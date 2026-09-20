"""Stateless branch service shared by internal HTTP, Google validation and stub tests."""
import copy
import json
import re
import uuid

from branch_data import Dataset
from branch_language import Language, LanguageError, Plan
from branch_models import (ContractError, VERSION, MAX_SAFE, UUID_PATTERN, initial_state,
                           parse_request, validate_event, validate_request)
import branch_query as Q

FIELDS = {"age": "나이", "irp_amount": "IRP 평가금액", "cash_amount": "현금성자산", "cash_pct": "현금성 비중", "return_pct": "수익률", "name": "이름", "grade": "등급"}


def label(p):
    if p["op"] == "segment":
        return "퇴직급여 운용 미지시" if p["value"] == "retirement_uninstructed" else p["value"]
    if p["op"] == "compare":
        field, val = p["field"], p["value"]
        display = Q.money(val) if field in ("irp_amount", "cash_amount") else (f"{val:g}" + ("세" if field == "age" else "%" if field.endswith("pct") else "")) if type(val) in (int, float) else str(val)
        return FIELDS[field] + " " + display + {"eq": "", "gte": " 이상", "gt": " 초과", "lte": " 이하", "lt": " 미만"}[p["cmp"]]
    if p["op"] == "isa_between":
        return "ISA 만기 기간"
    if p["op"] == "not":
        return label(p["arg"]) + " 제외"
    return (" 및 " if p["op"] == "and" else " 또는 ").join(label(x) for x in p["args"])


def contains(p, field):
    if p["op"] == "compare":
        return p["field"] == field
    if p["op"] == "segment":
        return p["value"] == field
    if p["op"] == "not":
        return contains(p["arg"], field)
    return any(contains(a, field) for a in p.get("args", []))


def button(text, kind, **kwargs):
    return {"label": text[:80], "action": {"type": kind, **kwargs}}


def fault_event(outer, code):
    request = {}
    try:
        request = json.loads(outer.get("input_value", ""))
        if not isinstance(request, dict):
            request = {}
    except (ValueError, TypeError, AttributeError, RecursionError):
        pass
    identified = (isinstance(request.get("request_id"), str) and re.fullmatch(UUID_PATTERN, request["request_id"])
                  and isinstance(request.get("conversation_id"), str) and re.fullmatch(UUID_PATTERN, request["conversation_id"])
                  and type(request.get("base_revision")) is int and 0 <= request["base_revision"] < MAX_SAFE)
    codes = {"SCHEMA": "INVALID_REQUEST", "MANIFEST": "DATA_VERSION", "IDENTITY": "STATE", "RESULT": "INTERNAL", "UI": "INTERNAL", "REVISION": "INTERNAL"}
    code = codes.get(code, code)
    if code not in ("INVALID_REQUEST", "VERSION", "DATA_VERSION", "STATE", "ACTION", "LLM_TIMEOUT", "LLM_OUTPUT", "INTERNAL"):
        code = "INTERNAL"
    return {"event": "error", "data": {"schema_version": VERSION,
            "request_id": request["request_id"] if identified else "invalid-request",
            "conversation_id": request["conversation_id"] if identified else None,
            "base_revision": request["base_revision"] if identified else None,
            "code": code, "retryable": code in ("LLM_TIMEOUT", "LLM_OUTPUT", "INTERNAL"),
            "message": "응답 시간이 초과되었습니다. 다시 시도해 주세요." if code == "LLM_TIMEOUT" else "요청을 처리하지 못했습니다. 입력과 연결 상태를 확인해 주세요."}}


def check_literals(plan, message):
    """A numeric interpretation must be grounded in explicit input units, not invented by the LLM."""
    units = {None: 1, "억": 100000000, "천만": 10000000, "백만": 1000000, "십만": 100000, "만": 10000, "천": 1000}
    values = [float(n.replace(",", "")) * units[u or None] for n, u in re.findall(r"(\d[\d,]*(?:\.\d+)?)\s*(천만|백만|십만|억|만|천)?", message)]
    allowed = set(values)
    if values:
        allowed.add(sum(values))
    for decade in re.findall(r"(\d+)\s*대", message):
        allowed.update((int(decade), int(decade) + 10))
    def check(p):
        if p["op"] == "compare" and p["field"] in ("name", "grade") and str(p["value"]).casefold() not in message.casefold():
            raise LanguageError()
        if p["op"] == "compare" and p["field"] not in ("name", "grade") and p["value"] not in allowed:
            raise LanguageError()
        for a in p.get("args", []):
            check(a)
        if "arg" in p:
            check(p["arg"])
    for op in plan["operations"]:
        if op["type"] == "filter":
            check(op["predicate"])
        if op["type"] == "take" and op["count"] not in allowed:
            raise LanguageError()


class Service:
    def __init__(self, dataset=None, llm_call=None):
        self.data = dataset or Dataset.load()
        if llm_call is None:
            from llm_client import call
            llm_call = call
        self.language = Language(llm_call)

    def handle(self, outer, emit=lambda event: None, observe=lambda stage, code: None):
        try:
            if isinstance(outer, dict) and isinstance(outer.get("input_value"), str):
                try:
                    raw = json.loads(outer["input_value"])
                    if isinstance(raw, dict) and (raw.get("schema_version") != VERSION or raw.get("task") != "branch_assistant"):
                        return fault_event(outer, "VERSION")
                except (ValueError, RecursionError):
                    pass
            req = parse_request(outer, self.data.manifest)
            def progress(phase, pending=False):
                ev = {"event": "progress", "data": {k: req[k] for k in ("request_id", "conversation_id", "base_revision")}}
                ev["data"].update(phase=phase, list_pending=pending)
                emit(validate_event(ev, req, self.data.manifest))
            progress("interpreting")
            event = self.execute(req, progress, observe)
            return validate_event(event, req, self.data.manifest, self.data.by_id)
        except (ContractError, LanguageError) as error:
            return fault_event(outer, error.code)
        except TimeoutError:
            return fault_event(outer, "LLM_TIMEOUT")
        except Exception:
            return fault_event(outer, "INTERNAL")

    def execute(self, req, progress=lambda *args: None, observe=lambda *args: None):
        d, m = self.data, self.data.manifest
        state = copy.deepcopy(req["state"] or initial_state())
        old = copy.deepcopy(state)
        message, action = req["message"], req["action"]
        rows, unknown, sort = Q.replay(d, state["selection"])
        current_ids = [r["row_id"] for r in rows]
        pending = state["clarification"]
        if pending:
            kind = pending["kind"]
            choices = {o["value"] for o in pending["options"]}
            if kind == "customer":
                # Named briefing may select a manifest customer outside the visible list.
                # The contract validates every candidate ID; choices must belong to them.
                if not choices <= set(pending["candidate_row_ids"]):
                    raise ContractError("STATE")
            allowed = {"cash_field": {"cash_amount", "cash_pct"}, "cash_value": set(), "amount_basis": {"irp_amount"},
                       "date_basis": {"today", "registered"}, "scope": {"all"} | ({"current"} if state["active"] else set()) | ({"aggregate"} if state["last_aggregate"] else set()),
                       "condition": {o["id"] for o in state["selection"]["operations"] if o["type"] == "filter"}}
            if kind in allowed and not choices <= allowed[kind]:
                raise ContractError("STATE")
        state["clarification"] = None
        forced_scope = None

        def answer(intent, text, result_rows=None, effect="keep", metric_keys=None, reasons=None, actions=None, result_unknown=None):
            result_rows = rows if result_rows is None else result_rows
            ids = [r["row_id"] for r in result_rows]
            context = ("추천 고객" if state["selection"]["base"] == "recommendation" else "현재 고객 목록")
            chips = [label(o["predicate"]) for o in state["selection"]["operations"] if o["type"] == "filter"]
            context += " · " + str(len(Q.replay(d, state["selection"])[0])) + "명" + (" · " + " · ".join(chips) if chips else "")
            data = {k: req[k] for k in ("schema_version", "request_id", "conversation_id", "base_revision", "dataset_id", "data_version", "rule_version")}
            data.update(revision=req["base_revision"] + 1, intent=intent,
                status="clarification_required" if intent == "clarify" else "unsupported" if intent == "unsupported" else "empty" if effect == "replace" and not ids else "ok",
                text=text, result={"row_ids": ids, "count": len(ids), "unknown_row_ids": [r["row_id"] for r in (result_unknown or [])],
                                  "metrics": Q.metrics(result_rows, metric_keys or []), "reasons": reasons or []},
                ui={"list_action": effect, "row_ids": ids if effect == "replace" else None, "sort": sort if effect == "replace" else None},
                context_label=context[:2000], scope_note="현재 시연 자료 기준 · " + m["as_of_date"] + " · 자료 기준일 혼재, 미확인 제외",
                actions=(actions or [])[:8], next_state=state)
            return {"event": "answer", "data": data}

        def clarify(kind, text, options=(), field=None, candidates=(), pending_message=None):
            state["clarification"] = {"kind": kind, "field": field, "pending_message": pending_message or message,
                                      "candidate_row_ids": list(candidates), "options": [{"value": v, "label": t} for v, t in options]}
            return answer("clarify", text, actions=[button(t, "clarify", value=v) for v, t in options])

        def unsupported(text, actions=()):
            return answer("unsupported", text, actions=list(actions))

        if pending and (not action or action["type"] == "clarify"):
            chosen = action["value"] if action else message.strip()
            chosen = next((x["value"] for x in pending["options"] if chosen in (x["value"], x["label"])), chosen)
            if pending["kind"] == "cash_field" and chosen in ("cash_amount", "cash_pct", "금액", "비중"):
                field = "cash_amount" if chosen in ("cash_amount", "금액") else "cash_pct"
                return clarify("cash_value", "기준 금액을 알려주세요." if field == "cash_amount" else "기준 비중을 알려주세요.", field=field, pending_message=pending["pending_message"])
            if pending["kind"] == "cash_value" and re.match(r"^\d", chosen):
                message = FIELDS[pending["field"]] + " " + chosen + " 고객 보여줘"
            elif pending["kind"] == "scope" and chosen in ("all", "current", "aggregate"):
                forced_scope, message = chosen, pending["pending_message"]
            elif pending["kind"] == "condition" and chosen in [o["id"] for o in state["selection"]["operations"] if o["type"] == "filter"]:
                action = {"type": "remove_condition", "operation_id": chosen}
            elif pending["kind"] == "customer":
                ids = [rid for rid in pending["candidate_row_ids"] if chosen in (rid, d.by_id[rid]["customer"]["name"])]
                if len(ids) == 1:
                    action = {"type": "brief", "row_id": ids[0]}
            elif pending["kind"] == "amount_basis" and chosen in ("irp_amount", "IRP 평가금액 기준"):
                message = pending["pending_message"].replace("운용금액", "IRP 잔액")
            elif pending["kind"] == "date_basis" and chosen in ("registered", "today"):
                message = "ISA 만기 고객 몇 명이야?" if chosen == "registered" else "앞으로 0일 이내 ISA 만기 고객 몇 명이야?"
            if action and action["type"] == "clarify":
                action = None

        if action:
            kind = action["type"]
            mapping = {"recommend": {"intent": "recommend"}, "restore_recommendation": {"intent": "restore", "detail": "recommendation"},
                       "reset": {"intent": "restore", "detail": "reset"}, "show_aggregate": {"intent": "search", "scope": "aggregate"},
                       "remove_condition": {"intent": "search", "scope": "current", "edit": "remove"}, "brief": {"intent": "brief"}}
            if kind not in mapping:
                raise ContractError("ACTION")
            plan = Plan(**mapping[kind]).model_dump()
        else:
            plan = self.language.interpret(message, state, m, req["x_client_user"])
            observe("interpret", "ok")
            if plan["edit"] == "remove":
                # Removal uses a field/operation selector, never values echoed from earlier State.
                plan["operations"] = []
            check_literals(plan, message)
            if plan["intent"] in ("overview", "aggregate"):
                plan["intent"] = "overview" if re.search("현황|현상황", message) else "aggregate"
        intent = plan["intent"]
        follow = bool(re.search(r"^(그중|이중|현재\s*목록|이\s*\d+명)|조건\s*(도|을)?\s*추가", message.strip()))
        if follow:
            plan["scope"] = "current"
            if intent == "search" and plan["edit"] != "remove":
                plan["edit"] = "append"
        if forced_scope:
            plan["scope"] = forced_scope
        if not forced_scope and intent not in ("restore", "recommend", "brief") and plan["scope"] == "current":
            aggregate = state["last_aggregate"]
            aggregate_ids = [r["row_id"] for r in Q.replay(d, aggregate["selection"])[0]] if aggregate else None
            if not state["active"] or (aggregate_ids is not None and set(aggregate_ids) != set(current_ids)):
                options = [("current", "현재 목록 기준")] if state["active"] else [("all", "전체 고객 기준")]
                if aggregate:
                    options.append(("aggregate", "방금 집계한 고객 기준"))
                return clarify("scope", "이어갈 고객 범위를 선택해 주세요.", options)
        progress("executing", intent in ("search", "recommend", "restore"))
        if intent == "clarify":
            kind = plan["clarification_kind"] or "condition"
            if kind == "cash_field":
                return clarify(kind, "현금성자산 금액과 비중 중 어떤 기준으로 찾을까요?", [("cash_amount", "금액"), ("cash_pct", "비중")])
            if kind == "amount_basis":
                return clarify(kind, "현금성을 포함한 IRP 평가금액 기준으로 조회할까요?", [("irp_amount", "IRP 평가금액 기준")], field="irp_amount")
            if kind == "date_basis":
                return clarify(kind, "시연 기준일의 당일 만기와 등록된 ISA 만기 상태 중 어떤 기준인가요?", [("today", "기준일 당일 만기"), ("registered", "ISA 만기 등록 고객")])
            return clarify(kind, "조회 기준을 구체적으로 알려주세요.")
        if intent == "unsupported":
            return unsupported("비교할 과거 자료가 없어 증감을 확인할 수 없습니다." if re.search("어제|전일|지난", message) else "지원하는 고객 조건·현황·추천·간단 브리핑 범위로 질문해 주세요.")
        if intent == "restore":
            if plan["detail"] == "reset":
                state = initial_state()
                return answer("restore", "기존 고객 목록으로 돌아왔습니다.", d.records, "reset")
            if state["recommendation"] is None:
                return unsupported("저장된 추천 결과가 없습니다. 먼저 추천을 요청해 주세요.", [button("관리할 고객 추천", "recommend")])
            state["selection"] = {"base": "recommendation", "operations": []}
        elif intent == "recommend":
            state["recommendation"] = {"rule_version": m["rule_version"], "as_of_date": m["as_of_date"]}
            state["selection"] = {"base": "recommendation", "operations": []}
        elif intent == "brief":
            target = action.get("row_id") if action and action["type"] == "brief" else None
            name = plan["target_name"]
            if name and name not in message:
                raise LanguageError()
            candidates = [d.by_id[target]] if target else [r for r in d.records if r["customer"]["name"] == name] if name else [d.by_id[state["selected_row_id"]]] if state["selected_row_id"] else rows if state["active"] else []
            if plan["detail"] == "isa_facts":
                candidates = [r for r in (rows if state["active"] else d.records) if Q.near_accounts(r, m["as_of_date"])]
            if not candidates:
                return clarify("customer", "확인할 고객을 이름으로 지정해 주세요.", candidates=m["row_ids"], options=[(r["row_id"], r["customer"]["name"]) for r in d.records])
            if len(candidates) != 1:
                return clarify("customer", "어떤 고객을 확인할까요?", [(r["row_id"], r["customer"]["name"]) for r in candidates], candidates=[r["row_id"] for r in candidates])
            r = candidates[0]
            if target and state["active"] and target not in current_ids and not (pending and target in pending["candidate_row_ids"]):
                raise ContractError("ACTION")
            state["selected_row_id"] = r["row_id"]
            template = Q.briefing(r, m["as_of_date"], plan["detail"])
            progress("composing", False)
            text, composition = self.language.compose(template, req["x_client_user"])
            observe("compose", composition)
            return answer("brief", text, [r], reasons=Q.evidence(r, m["as_of_date"]))
        else:
            scope = plan["scope"]
            if scope == "aggregate":
                if state["last_aggregate"] is None:
                    raise ContractError("STATE")
                selection = copy.deepcopy(state["last_aggregate"]["selection"])
            elif scope == "recommendation":
                if state["recommendation"] is None:
                    raise ContractError("STATE")
                selection = {"base": "recommendation", "operations": []}
            elif scope == "current":
                selection = copy.deepcopy(state["selection"])
            else:
                selection = {"base": "all", "operations": []}
            if plan["edit"] == "remove":
                found = [o for o in selection["operations"] if o["type"] == "filter" and
                    (o["id"] == action.get("operation_id") if action else contains(o["predicate"], plan["remove_field"]))]
                if not found:
                    return unsupported("해제할 조건이 없습니다. 현재 조건을 확인해 주세요.")
                if len(found) > 1:
                    return clarify("condition", "제거할 조건을 선택해 주세요.", [(o["id"], label(o["predicate"])[:80]) for o in found])
                selection["operations"] = [o for o in selection["operations"] if o["id"] != found[0]["id"]]
            else:
                for operation in plan["operations"]:
                    operation = copy.deepcopy(operation)
                    operation["id"] = "op-" + uuid.uuid4().hex
                    selection["operations"].append(operation)
            if len(selection["operations"]) > 100:
                return unsupported("조건 이력이 너무 많습니다. 기존 목록으로 복원한 뒤 다시 조회해 주세요.", [button("기존 목록", "reset")])
            if intent in ("overview", "aggregate"):
                keys = plan["metric_keys"] or (["customer_count", "irp_sum", "cash_sum"] if intent == "overview" else ["customer_count"])
                state["last_aggregate"] = {"selection": copy.deepcopy(selection), "metric_keys": keys}
                targets, un, _ = Q.replay(d, selection)
                parts = [f"대상 고객은 {len(targets)}명입니다."]
                for metric in Q.metrics(targets, keys):
                    if metric["key"] != "customer_count":
                        parts.append(("IRP 평가금액" if metric["key"] == "irp_sum" else "확인된 현금성자산") + f" 합계는 {Q.money(metric['value'])}입니다. {metric['known_count']}명 확인, {metric['unknown_count']}명 미확인입니다.")
                return answer(intent, " ".join(parts), targets, metric_keys=keys, result_unknown=un,
                              actions=[button(f"대상 고객 {len(targets)}명 보기", "show_aggregate"), button("관리할 고객 추천", "recommend")])
            state["selection"] = selection
        state["active"] = True
        rows, unknown, sort = Q.replay(d, state["selection"])
        ids = [r["row_id"] for r in rows]
        if state["selected_row_id"] not in ids:
            state["selected_row_id"] = None
        state["last_aggregate"] = None
        reasons = [x for r in rows for x in Q.evidence(r, m["as_of_date"])] if intent == "recommend" else []
        text = f"조건에 맞는 고객은 {len(rows)}명입니다."
        actions = [button(label(o["predicate"])[:65] + " 조건 해제", "remove_condition", operation_id=o["id"]) for o in state["selection"]["operations"] if o["type"] == "filter"]
        if intent == "recommend":
            directions = {"UR01": "계약이전 의사확인", "UR02": "퇴직급여 첫 운용 상담", "UR03": "ISA 만기자금 사용계획 확인"}
            text = f"오늘 우선 확인할 고객은 {len(rows)}명입니다. " + ", ".join(directions[k] for k in directions if any(x["code"] == k for x in reasons)) + ("이 필요합니다." if rows else "확인된 근거가 부족합니다.")
            actions = [button(r["customer"]["name"] + " 간단 브리핑", "brief", row_id=r["row_id"]) for r in rows]
        elif intent == "restore":
            text = f"처음 추천한 고객 {len(rows)}명을 다시 표시했습니다."
        if unknown:
            text += f" 조건 판정에 필요한 정보가 미확인인 고객은 {len(unknown)}명입니다."
        if not rows:
            text += " 조건을 해제해 다시 확인할 수 있습니다."
        for metric in Q.metrics(rows, plan["metric_keys"]):
            if metric["key"] != "customer_count":
                text += (" IRP 평가금액" if metric["key"] == "irp_sum" else " 현금성자산") + f" 합계는 {Q.money(metric['value'])}입니다. {metric['known_count']}명 확인, {metric['unknown_count']}명 미확인입니다."
        if state["recommendation"] is not None and intent != "recommend":
            actions = actions[:7] + [button("처음 추천 다시 보기", "restore_recommendation")]
        return answer(intent, text, rows, "replace", metric_keys=plan["metric_keys"], reasons=reasons, actions=actions, result_unknown=unknown)

"""36 fixed golden cases against the real service; stubs supply only interpretation candidates."""
import copy
import json
from pathlib import Path
import sys
import time
import uuid

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "deploy"))
from branch_data import Dataset
from branch_models import initial_state, validate_event
from branch_service import Service, contains
import branch_query as Q


def request(dataset, message, state=None, revision=0, action=None):
    m = dataset.manifest
    return {"schema_version": "branch-agent-api.v1", "task": "branch_assistant",
            **{k: m[k] for k in ("dataset_id", "data_version", "rule_version")},
            "request_id": str(uuid.uuid4()), "conversation_id": str(uuid.uuid4()), "base_revision": revision,
            "x_client_user": "LOCAL_VALIDATION", "message": message, "action": action, "state": copy.deepcopy(state)}


class Stub:
    def __init__(self):
        self.plan = None
        self.calls = 0

    def __call__(self, messages, **kwargs):
        self.calls += 1
        payload = json.loads(messages[0]["content"])
        if payload["stage"] == "compose":
            return payload["direction"]
        if self.plan is None:
            raise AssertionError("UNEXPECTED_INTERPRETATION")
        return json.dumps(self.plan, ensure_ascii=False)


def check_answer(answer, expected, before, data):
    assert answer["intent"] == expected["intent"], "INTENT"
    assert answer["status"] == expected.get("status", "ok"), "STATUS"
    assert answer["ui"]["list_action"] == expected["list_action"], "UI"
    if "row_ids" in expected:
        assert answer["result"]["row_ids"] == expected["row_ids"], "IDS_ORDER"
    assert answer["result"]["count"] == expected.get("count", answer["result"]["count"]), "COUNT"
    if expected["list_action"] == "keep":
        assert all(answer["next_state"][k] == (before or initial_state())[k] for k in ("active", "selection", "recommendation")), "KEEP"
    if expected["list_action"] == "replace":
        assert [r["row_id"] for r in Q.replay(data, answer["next_state"]["selection"])[0]] == answer["ui"]["row_ids"], "REPLAY"
    metrics = {x["key"]: x for x in answer["result"]["metrics"]}
    for key, val in expected.get("metrics", {}).items():
        assert metrics[key]["value"] == val, "METRIC"
    for kind in ("known", "unknown"):
        if "cash_" + kind in expected:
            assert metrics["cash_sum"][kind + "_count"] == expected["cash_" + kind], "CASH_COVERAGE"
    if "unknown_count" in expected:
        assert len(answer["result"]["unknown_row_ids"]) == expected["unknown_count"], "UNKNOWNS"
    if "reasons" in expected:
        assert [r["code"] for r in answer["result"]["reasons"]] == expected["reasons"], "REASONS"
    if "clarification" in expected:
        assert answer["next_state"]["clarification"]["kind"] == expected["clarification"], "CLARIFY"
    if "removed_field" in expected:
        assert not any(contains(o["predicate"], expected["removed_field"]) for o in answer["next_state"]["selection"]["operations"] if o["type"] == "filter"), "REMOVAL"
    for text in expected.get("text_contains", []):
        assert text in answer["text"], "FACT_TEXT"
    for text in expected.get("forbidden_text", []) + ["고객을 찾았습니다"]:
        assert text not in answer["text"], "FORBIDDEN_TEXT"
    if answer["intent"] in ("search", "recommend", "aggregate", "overview"):
        assert not any(r["customer"]["name"] in answer["text"] for r in data.records), "NAME_LIST"
    if answer["intent"] == "brief":
        assert 2 <= len([s for s in answer["text"].split(".") if s.strip()]) <= 3, "SENTENCES"


def run_cases(llm_call=None, repeats=1, variations=False):
    spec = json.loads((HERE / "scenarios.json").read_text())
    data, stub = Dataset.load(), Stub()
    assert spec["data_version"] == data.manifest["data_version"], "FIXTURE_VERSION"
    assert len(spec["cases"]) == 36
    records, observations = [], []
    for repetition in range(repeats):
        cache = {}
        for case in spec["cases"]:
            start = time.monotonic()
            if case["given"] and case["given"] not in cache:
                records.append({"id": case["id"], "run": repetition + 1, "status": "SKIP", "code": "PREREQUISITE"})
                continue
            state = copy.deepcopy(cache.get(case["given"]))
            if case.get("lifecycle") == "new_conversation" and state:
                state["last_aggregate"] = state["clarification"] = None
            try:
                # Recreate server/service for every case, passing only the browser's last success State.
                service = Service(data, llm_call or stub)
                for step in case["steps"]:
                    stub.plan = step["plan"]
                    message = step["message"]
                    if variations and repetition == 1:
                        message = message.replace("7천만원", "70,000,000원").replace("2억원", "200,000,000원").replace("500만원", "5,000,000원")
                    if variations and repetition == 2:
                        message = message.replace("보여줘", "찾아줘").replace("  ", " ")
                    req = request(data, message, state)
                    frozen = copy.deepcopy(req)
                    progress = []
                    event = service.handle({"input_value": json.dumps(req, ensure_ascii=False)}, progress.append,
                                           lambda stage, code: observations.append({"id": case["id"], "run": repetition + 1, "stage": stage, "code": code}))
                    assert req == frozen, "MUTATION"
                    assert event["event"] == "answer", event["data"].get("code", "EVENT")
                    validate_event(event, req, data.manifest, data.by_id)
                    assert progress and progress[0]["data"]["phase"] == "interpreting", "PROGRESS"
                    before, state = copy.deepcopy(state), event["data"]["next_state"]
                    if step.get("expect_clarification"):
                        assert state["clarification"]["kind"] == step["expect_clarification"], "INTERMEDIATE_CLARIFY"
                        assert event["data"]["ui"]["list_action"] == "keep", "INTERMEDIATE_KEEP"
                check_answer(event["data"], case["expect"], before, data)
                cache[case["id"]] = copy.deepcopy(state)
                records.append({"id": case["id"], "run": repetition + 1, "status": "PASS", "elapsed_ms": round((time.monotonic() - start) * 1000)})
            except Exception as error:
                code = str(error) if isinstance(error, AssertionError) and re_safe(str(error)) else type(error).__name__
                records.append({"id": case["id"], "run": repetition + 1, "status": "FAIL", "code": code, "elapsed_ms": round((time.monotonic() - start) * 1000)})
            print(json.dumps(records[-1]), flush=True)
            if getattr(llm_call, "blocked", False):
                completed = len(records)
                return {"results": records, "observations": observations, "unrun": 36 * repeats - completed, "blocked_code": llm_call.blocked}
    return {"results": records, "observations": observations, "unrun": 0}


def re_safe(code):
    return all(c in "ABCDEFGHIJKLMNOPQRSTUVWXYZ_0123456789" for c in code) and len(code) <= 60


def regressions():
    from concurrent.futures import ThreadPoolExecutor
    d = Dataset.load()
    r = copy.deepcopy(d.by_id["B01-03"])
    compare = lambda f, v: {"op": "compare", "field": f, "cmp": "gte", "value": v}
    for amount, expected in [(69999999, False), (70000000, True), (70000001, True)]:
        r["irpAccount"]["valuationAmountKrw"] = amount
        assert Q.predicate(r, compare("irp_amount", 70000000), d.manifest["as_of_date"]) is expected
    u = d.by_id["jmr"]  # display-only legacy row: cash amount unknown
    p = compare("cash_amount", 0)
    assert Q.predicate(u, p, d.manifest["as_of_date"]) is None
    assert Q.predicate(u, {"op": "not", "arg": p}, d.manifest["as_of_date"]) is None
    r["cash_amount"] = 0
    assert Q.predicate(r, p, d.manifest["as_of_date"]) is True
    # Same account must carry both verification date and maturity; no cross-account join.
    r["searchSupplement"]["externalAccounts"] = [dict(r["searchSupplement"]["externalAccounts"][0], verifiedAt="2026-09-01"),
        {"type": "ISA", "verifiedAt": "2026-09-14", "maturityDate": "2027-01-01"}]
    assert not Q.near_accounts(r, "2026-09-14")
    r["searchSupplement"]["externalAccounts"][0].update(verifiedAt="2026-09-14", maturityDate="2026-10-14")
    assert Q.near_accounts(r, "2026-09-14")
    r["searchSupplement"]["externalAccounts"][0]["maturityDate"] = "2026-10-15"
    assert not Q.near_accounts(r, "2026-09-14")
    extra = copy.deepcopy(d.records)
    x = copy.deepcopy(d.by_id["B04-23"])
    x.update(row_id="extra", customer_id="extra", original_order=48)
    x["customer"]["customerId"] = "extra"
    extra.append(x)
    # Mutation fixtures exercise the evaluator directly, never replace the runtime dataset.
    class Fixture:
        records = extra
        manifest = d.manifest
    assert len(Q.recommended(Fixture())[0]) == 4
    x["searchSupplement"]["management"]["transfer"]["status"] = "완료"
    assert len(Q.recommended(Fixture())[0]) == 3
    x["searchSupplement"]["management"]["transfer"]["status"] = "의사확인대기"
    x["customer_id"] = d.by_id["B04-23"]["customer_id"]
    assert len(Q.recommended(Fixture())[0]) == 3
    bad_calls = [0]
    def malformed(*a, **kw):
        bad_calls[0] += 1
        return 'not-json'
    req = request(d, "오늘 우선 관리할 고객 추천해줘")
    assert Service(d, malformed).handle({"input_value": json.dumps(req)})["data"]["code"] == "LLM_OUTPUT"
    assert bad_calls[0] == 2
    def timeout(*a, **kw):
        raise TimeoutError()
    assert Service(d, timeout).handle({"input_value": json.dumps(req)})["data"]["code"] == "LLM_TIMEOUT"
    calls = [0]
    def bad_composition(messages, **kw):
        payload = json.loads(messages[0]["content"])
        calls[0] += 1
        return '상품을 매수했고 999999원을 이체했습니다.' if payload["stage"] == "compose" else '{"intent":"brief","target_name":"정미경"}'
    brief = Service(d, bad_composition).handle({"input_value": json.dumps(request(d, "정미경 브리핑"))})
    assert brief["event"] == "answer" and '999999' not in brief["data"]["text"] and calls[0] == 2
    assert Q.value(d.by_id['jmr'], 'grade') == d.by_id['jmr']['customer']['starClubGrade']
    # Stable ties and nulls last in either direction.
    a, b, c = (copy.deepcopy(d.records[i]) for i in range(3))
    a['cash_pct'], b['cash_pct'], c['cash_pct'] = 2.5, 2.5, None
    assert Q.sorted_rows([c,b,a], 'cash_pct', 'desc') == [a,b,c]
    assert Q.sorted_rows([b,c,a], 'cash_pct', 'asc') == [a,b,c]
    assert Q.predicate(a, compare('cash_pct', 2.5), d.manifest['as_of_date']) is True
    s = Stub();s.plan = {"intent": "recommend"}
    service = Service(d, s)
    with ThreadPoolExecutor(max_workers=2) as pool:
        outputs = list(pool.map(lambda i: service.handle({"input_value": json.dumps(request(d, "추천", revision=i))}), range(2)))
    assert [o["data"]["revision"] for o in outputs] == [1, 2]
    assert outputs[0]["data"]["next_state"] == outputs[1]["data"]["next_state"]
    state = outputs[0]['data']['next_state']
    base = copy.deepcopy(state)
    # Remove a filter, preserving the later sort/take operations and their IDs.
    state['selection']['operations'] = [
        {'id':'cash','type':'filter','predicate':{'op':'compare','field':'cash_amount','cmp':'gte','value':1000000}},
        {'id':'sort','type':'sort','field':'irp_amount','direction':'desc'}, {'id':'take','type':'take','count':2}]
    removal = service.handle({'input_value':json.dumps(request(d,'현금 조건 해제',state,action={'type':'remove_condition','operation_id':'cash'}))})
    assert removal['event']=='answer'
    assert [o['id'] for o in removal['data']['next_state']['selection']['operations']]==['sort','take']
    assert removal['data']['result']['row_ids']==['B06-13','B04-23']
    stale_action = service.handle({'input_value':json.dumps(request(d,'지난 조건 해제',removal['data']['next_state'],action={'type':'remove_condition','operation_id':'cash'}))})
    assert stale_action['data']['code']=='ACTION'
    forged = copy.deepcopy(base);forged['selected_row_id']='DEMO-01'
    assert service.handle({'input_value':json.dumps(request(d,'추천',forged))})['event']=='error'
    # A named briefing outside the current list keeps that list and supports a follow-up.
    s.plan = {'intent':'brief','target_name':'이수민'}
    named = service.handle({'input_value':json.dumps(request(d,'이수민 브리핑',base))})
    assert named['event']=='answer' and named['data']['result']['row_ids']==['C01-12']
    assert named['data']['next_state']['selection']==base['selection']
    s.plan = {'intent':'brief','scope':'current'}
    follow = service.handle({'input_value':json.dumps(request(d,'이 고객 브리핑',named['data']['next_state']))})
    assert follow['event']=='answer' and follow['data']['result']['row_ids']==['C01-12']
    assert follow['data']['ui']['list_action']=='keep'
    oversized = copy.deepcopy(base)
    oversized['selection']['operations']=[{'id':'o'+str(i),'type':'take','count':1} for i in range(101)]
    assert service.handle({'input_value':json.dumps(request(d,'추천',oversized))})['event']=='error'
    wrong_version = dict(req, schema_version='v99')
    assert service.handle({'input_value':json.dumps(wrong_version)})['data']['code']=='VERSION'
    req["data_version"] = "0" * 64
    assert service.handle({"input_value": json.dumps(req)})["data"]["code"] == "DATA_VERSION"
    trace_checks(d)
    print("PASS: numeric/null/date/account boundaries, dynamic recommendation/dedup, interpretation repair/timeout, isolated concurrent turns and version rejection")


def trace_checks(d):
    """execution_trace: interpret → plan → apply → answer only; real attempts inside one interpret step; no LLM step on action paths; partial trace on errors."""
    from concurrent.futures import ThreadPoolExecutor
    plan = {"intent": "search", "scope": "all", "edit": "replace", "operations": [{"id": "p1", "type": "filter", "predicate": {"op": "and", "args": [
        {"op": "compare", "field": "age", "cmp": "gte", "value": 55}, {"op": "segment", "value": "연금저축 보유"}]}}]}
    s = Stub(); s.plan = plan
    service = Service(d, s)
    req = request(d, "만 55세 이상 고객 중 당행 연금저축 보유고객 보여줘")
    event = service.handle({"input_value": json.dumps(req, ensure_ascii=False)})
    assert event["event"] == "answer", "TRACE_ANSWER"
    validate_event(event, req, d.manifest, d.by_id)
    t = event["data"]["execution_trace"]
    assert t["origin"] == "agent_observed" and t["request_id"] == req["request_id"] and t["status"] == "completed", "TRACE_HEAD"
    assert [x["stage"] for x in t["steps"]] == ["interpret", "plan", "apply", "answer"], "TRACE_STAGES"
    assert [x["actor"] for x in t["steps"]] == ["LLM", "AGENT", "DATA", "AGENT"] and all(x["status"] == "completed" for x in t["steps"]), "TRACE_ACTORS"
    interpret, plan_step, apply_step, answer_step = t["steps"]
    assert interpret["input"]["message"] == req["message"] and interpret["output"]["plan"]["operations"] == plan["operations"], "TRACE_INTERPRET"
    assert plan_step["output"]["labels"] == ["나이 55세 이상 및 연금저축 보유"] and "numeric_literals" in plan_step["output"]["checks"], "TRACE_PLAN"
    assert apply_step["output"]["row_ids"] == event["data"]["result"]["row_ids"] and apply_step["output"]["count"] == event["data"]["result"]["count"], "TRACE_RESULT_IDS"
    assert apply_step["output"]["sort"] == {"field": "source_order", "direction": "asc"} and "기존 목록 순서 유지" in apply_step["summary"], "TRACE_ORDER"
    assert apply_step["output"]["selection"]["operations"][0]["predicate"] == plan["operations"][0]["predicate"], "TRACE_PREDICATE_KEPT"
    assert answer_step["output"]["list_action"] == "replace" and answer_step["output"]["revision"] == 1, "TRACE_ANSWER_STEP"
    call = t["llm_calls"][0]
    assert len(t["llm_calls"]) == 1 and call["status"] == "accepted" and call["attempt"] == 1 and call["model"] == "gemma-4-31b-it", "TRACE_CALL"
    text = json.dumps(t, ensure_ascii=False)
    assert "INTERPRET" not in text and "kb-key" not in text and "x-client-user" not in text and "LOCAL_VALIDATION" not in text, "TRACE_LEAK"
    for step in t["steps"]:
        assert step["duration_ms"] >= 0 and step["started_at"].endswith("+00:00") and step["ended_at"] >= step["started_at"], "TRACE_CLOCK"
    # Action path: no model call, no interpret step.
    act = service.handle({"input_value": json.dumps(request(d, "추천", action={"type": "recommend"}))})
    ta = act["data"]["execution_trace"]
    assert ta["llm_calls"] == [] and [x["stage"] for x in ta["steps"]] == ["plan", "apply", "answer"] and ta["steps"][0]["output"]["source"] == "action", "TRACE_ACTION"
    # Retry: one interpret step, both real attempts in llm_calls (rejected → accepted).
    calls = [0]
    def flaky(messages, **kw):
        calls[0] += 1
        return "not-json" if calls[0] == 1 else json.dumps(plan, ensure_ascii=False)
    retry = Service(d, flaky).handle({"input_value": json.dumps(req, ensure_ascii=False)})
    tr = retry["data"]["execution_trace"]
    assert retry["event"] == "answer" and [c["status"] for c in tr["llm_calls"]] == ["rejected", "accepted"] and [c["attempt"] for c in tr["llm_calls"]] == [1, 2], "TRACE_RETRY"
    assert [x["stage"] for x in tr["steps"]] == ["interpret", "plan", "apply", "answer"] and "재시도 1회" in tr["steps"][0]["summary"] and tr["status"] == "completed", "TRACE_RETRY_STEPS"
    # Error paths keep the partial trace with the failing stage; unidentified requests carry none.
    def malformed(*a, **kw):
        return "not-json"
    err = Service(d, malformed).handle({"input_value": json.dumps(req, ensure_ascii=False)})
    te = err["data"]["execution_trace"]
    assert err["data"]["code"] == "LLM_OUTPUT" and te["status"] == "failed" and [c["status"] for c in te["llm_calls"]] == ["rejected", "rejected"], "TRACE_ERROR"
    assert [(x["stage"], x["status"]) for x in te["steps"]] == [("interpret", "failed")], "TRACE_ERROR_NO_SUCCESS"
    def timeout(*a, **kw):
        raise TimeoutError()
    tt = Service(d, timeout).handle({"input_value": json.dumps(req, ensure_ascii=False)})["data"]["execution_trace"]
    assert tt["status"] == "failed" and tt["steps"][0]["stage"] == "interpret" and tt["steps"][0]["status"] == "failed" and tt["llm_calls"][0]["code"] == "LLM_TIMEOUT", "TRACE_TIMEOUT"
    assert "execution_trace" not in service.handle({"input_value": 123})["data"], "TRACE_UNIDENTIFIED"
    stale = dict(req, data_version="0" * 64)
    tv = service.handle({"input_value": json.dumps(stale)})["data"]["execution_trace"]
    assert [(x["stage"], x["status"], x["title"]) for x in tv["steps"]] == [("plan", "failed", "요청 검증 실패")], "TRACE_DATA_VERSION"
    # Concurrent requests never share a collector.
    with ThreadPoolExecutor(max_workers=2) as pool:
        outs = list(pool.map(lambda i: service.handle({"input_value": json.dumps(request(d, "만 55세 이상 고객 중 당행 연금저축 보유고객 보여줘", revision=i), ensure_ascii=False)}), range(2)))
    ids = [o["data"]["execution_trace"]["request_id"] for o in outs]
    assert ids[0] != ids[1] and all(o["data"]["execution_trace"]["request_id"] == o["data"]["request_id"] for o in outs), "TRACE_ISOLATION"
    # 2026-09-28 fail-safe: a trace that does not fit its own schema must never demote a valid answer or break the frame.
    from branch_models import ExecutionTrace
    import branch_trace
    wide = {"intent": "search", "scope": "all", "edit": "replace", "target_name": "", "remove_field": "  ", "operations": [{"id": "p1", "type": "filter", "predicate": {"op": "and", "args": [
        {"op": "compare", "field": "age", "cmp": "gte", "value": 55}, {"op": "compare", "field": "irp_amount", "cmp": "gte", "value": 70000000},
        {"op": "compare", "field": "cash_pct", "cmp": "gte", "value": 30}, {"op": "compare", "field": "return_pct", "cmp": "lte", "value": 5},
        {"op": "compare", "field": "cash_amount", "cmp": "gte", "value": 30000000}, {"op": "segment", "value": "연금저축 보유"}]}}]}
    sw = Stub(); sw.plan = wide
    req_w = request(d, "나이 55세 이상 IRP 7천만원 이상 현금성 비중 30% 이상 수익률 5% 이하 현금성자산 3천만원 이상 연금저축 보유 고객")
    ew = Service(d, sw).handle({"input_value": json.dumps(req_w, ensure_ascii=False)})
    assert ew["event"] == "answer", "TRACE_WIDE_LABEL_DEMOTED"
    tw = ew["data"]["execution_trace"]; ExecutionTrace.model_validate(tw)
    assert all(len(l) <= 80 for x in tw["steps"] for l in (x["output"] or {}).get("labels") or []) and tw["steps"][0]["output"]["plan"]["target_name"] is None, "TRACE_LABEL_CUT"
    assert [x["stage"] for x in tw["steps"]] == ["interpret", "plan", "apply", "answer"] and tw["status"] == "completed", "TRACE_WIDE_STAGES"
    def bad_compose(messages, **kw):
        payload = json.loads(messages[0]["content"])
        return '상품을 매수했고 999999원을 이체했습니다.' if payload["stage"] == "compose" else '{"intent":"brief","target_name":"정미경"}'
    eb = Service(d, bad_compose).handle({"input_value": json.dumps(request(d, "정미경 브리핑"), ensure_ascii=False)})
    tb = eb["data"]["execution_trace"]; ExecutionTrace.model_validate(tb)
    compose = next(x for x in tb["steps"] if x["stage"] == "compose")
    assert eb["event"] == "answer" and tb["status"] == "completed" and compose["status"] == "completed" and "템플릿" in compose["summary"] and tb["llm_calls"][-1]["status"] == "rejected", "TRACE_COMPOSE_FALLBACK"
    original = branch_trace.Collector.finish
    branch_trace.Collector.finish = lambda self, status=None: {"broken": True}
    try:
        eb2 = Service(d, s).handle({"input_value": json.dumps(req, ensure_ascii=False)})
        assert eb2["event"] == "answer" and "execution_trace" not in eb2["data"], "TRACE_DROP_INVALID"
        validate_event(eb2, req, d.manifest, d.by_id)
        ee = Service(d, timeout).handle({"input_value": json.dumps(req, ensure_ascii=False)})
        assert ee["event"] == "error" and ee["data"]["code"] == "LLM_TIMEOUT" and "execution_trace" not in ee["data"], "TRACE_DROP_INVALID_ERROR"
    finally:
        branch_trace.Collector.finish = original
    print("PASS: execution_trace fail-safe — 6-condition label cut to 80, blank target_name → null, compose fallback closes the step as completed, invalid trace dropped from answer and error events.")
    print("PASS: execution_trace — interpret→plan→apply→answer for the demo sentence (age>=55 AND 연금저축 보유, source_order kept), retry inside one interpret step, no LLM step on button actions, partial trace on LLM_OUTPUT/timeout/DATA_VERSION, per-request isolation, no prompt/header leakage")


if __name__ == "__main__":
    result = run_cases()
    failed = [x for x in result["results"] if x["status"] != "PASS"]
    if failed:
        raise SystemExit("FAIL: service golden " + str(len(failed)))
    regressions()
    print("PASS: stub 36/36 service golden cases; X-06 cancellation/late worker is additionally checked over HTTP")

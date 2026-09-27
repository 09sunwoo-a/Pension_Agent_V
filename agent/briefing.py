"""Fixed customer briefing lookup. Standard library only; never calls an LLM.

For a case that ships an analysis evidence map (C01-07 today) the answer also carries the optional
data.analysis_trace: the facts read from the validated request, the case-authored judgments, the refined
knowledge cards and the bindings to the same returned briefing, with the real construction timestamps.
"""
import copy
import json
import math
import re
import time
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any

VERSION = "customer-briefing-api.v1"
DATA_FILE = Path(__file__).with_name("briefing_data.json")
REQUEST_FIELDS = {"schema_version", "task", "request_id", "message", "x_client_user",
                  "case_id", "customer_id", "as_of_date", "customer_data"}


class BriefingError(ValueError):
    """Safe diagnostic code only. No request values or underlying exceptions."""


def parse_json(raw: str) -> Any:
    def invalid_constant(_value):
        raise BriefingError("INVALID_JSON")

    def unique_object(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise BriefingError("INVALID_JSON")
            result[key] = value
        return result

    try:
        return json.loads(raw, parse_constant=invalid_constant, object_pairs_hook=unique_object)
    except (ValueError, TypeError, RecursionError):
        raise BriefingError("INVALID_JSON") from None


def validate_shape(value: Any, schema: dict) -> None:
    """Validate the small JSON Schema subset emitted by the shared JS contract.

    Avoid a second handwritten S1-S5 schema and additional package dependencies.
    Semantic source/dataRefs checks run in the shared build/check before packing.
    """
    kind = ("null" if value is None else "boolean" if isinstance(value, bool)
            else "string" if isinstance(value, str) else "object" if isinstance(value, dict)
            else "array" if isinstance(value, list) else "number" if isinstance(value, (int, float))
            else "invalid")
    types = schema["type"] if isinstance(schema["type"], list) else [schema["type"]]
    if kind not in types:
        raise BriefingError("SCHEMA")
    if "const" in schema and value != schema["const"]:
        raise BriefingError("SCHEMA")
    if "enum" in schema and value not in schema["enum"]:
        raise BriefingError("SCHEMA")
    if kind == "number" and not math.isfinite(value):
        raise BriefingError("SCHEMA")
    if kind == "string" and "pattern" in schema and not re.search(schema["pattern"], value):
        raise BriefingError("SCHEMA")
    if kind == "array":
        if len(value) < schema.get("minItems", 0):
            raise BriefingError("SCHEMA")
        for item in value:
            validate_shape(item, schema["items"])
    if kind == "object":
        if not set(schema.get("required", [])).issubset(value):
            raise BriefingError("SCHEMA")
        if set(value) - set(schema["properties"]):
            raise BriefingError("SCHEMA")
        for key, item in value.items():
            validate_shape(item, schema["properties"][key])


@lru_cache(maxsize=1)
def load_data() -> dict:
    try:
        data = parse_json(DATA_FILE.read_text(encoding="utf-8"))
        if data["schema_version"] != VERSION or not data["cases"]:
            raise BriefingError("DATA")
        for case_id, record in data["cases"].items():
            customer = record["customer_data"]
            if customer["briefingMeta"]["caseId"] != case_id:
                raise BriefingError("DATA")
            validate_shape(record["briefing"], data["answer_schema"]["properties"]["data"]["properties"]["briefing"])
        return data
    except (OSError, ValueError, KeyError, TypeError, RecursionError):
        raise BriefingError("DATA") from None


def request_id_of(parsed: Any) -> str:
    value = parsed.get("request_id") if isinstance(parsed, dict) else None
    return value if isinstance(value, str) and value.strip() else "invalid-request"


def build_answer(parsed: Any) -> dict:
    if not isinstance(parsed, dict) or set(parsed) != REQUEST_FIELDS:
        raise BriefingError("INPUT")
    if any(not isinstance(parsed[k], str) or not parsed[k].strip()
           for k in REQUEST_FIELDS - {"customer_data"}):
        raise BriefingError("INPUT")
    if parsed["schema_version"] != VERSION or parsed["task"] != "customer_briefing":
        raise BriefingError("INPUT")
    if not isinstance(parsed["customer_data"], dict):
        raise BriefingError("INPUT")
    data = load_data()
    record = data["cases"].get(parsed["case_id"])
    if record is None:
        raise BriefingError("UNKNOWN_CASE")
    customer = record["customer_data"]
    if (parsed["customer_id"] != customer["customer"]["customerId"]
            or parsed["as_of_date"] != customer["briefingMeta"]["asOfDate"]):
        raise BriefingError("IDENTITY")
    # This endpoint returns stored text, not a newly inferred answer. Reject a
    # changed snapshot rather than presenting text based on different facts.
    canonical = lambda value: json.dumps(value, sort_keys=True, ensure_ascii=False, allow_nan=False)
    if canonical(parsed["customer_data"]) != canonical(customer):
        raise BriefingError("SNAPSHOT")
    answer = {"event": "answer", "data": {
        "schema_version": VERSION, "answer_type": "briefing",
        **{key: parsed[key] for key in ("request_id", "case_id", "customer_id", "as_of_date")},
        "briefing": copy.deepcopy(record["briefing"]),
    }}
    if record.get("analysis_evidence"):
        # Evidence for the fixed briefing: values come from the validated request, sentences from this same answer.
        answer["data"]["analysis_trace"] = analysis_trace(record["analysis_evidence"], parsed["customer_data"], answer["data"]["briefing"], parsed)
    validate_shape(answer, data["answer_schema"])
    return answer


def pointer(root: Any, ref: str) -> Any:
    current = root
    for token in ref.lstrip("/").split("/"):
        token = token.replace("~1", "/").replace("~0", "~")
        if isinstance(current, list):
            if not token.isdigit() or str(int(token)) != token or int(token) >= len(current):
                raise BriefingError("EVIDENCE")
            current = current[int(token)]
        elif isinstance(current, dict) and token in current:
            current = current[token]
        else:
            raise BriefingError("EVIDENCE")
    return current


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds")


def _scalar(value):
    return value is None or isinstance(value, (str, int, float, bool))


def customer_snapshot(customer: dict) -> list:
    """Every customer value the screen shows, read from the validated request snapshot, grouped for display.
    Only scalar leaves; missing fields are skipped, never invented."""
    def item(label, ref):
        try:
            value = pointer(customer, ref)
        except BriefingError:
            return None
        return {"label": label, "ref": ref, "value": value} if _scalar(value) else None
    def group(title, items):
        items = [x for x in items if x]
        return {"title": title, "items": items} if items else None
    groups = [
        group("고객 정보", [item("고객명", "/customer/name"), item("고객식별자", "/customer/customerId"), item("나이", "/customer/age"), item("성별", "/customer/gender"),
                        item("스타클럽 등급", "/customer/starClubGrade"), item("투자성향", "/customer/investmentProfile"), item("IRP 계좌 신규일", "/customer/irpOpenedAt"),
                        item("디폴트옵션 등록", "/customer/defaultOption/registrationStatus"), item("디폴트옵션 지정상품", "/customer/defaultOption/designatedProduct/productName"),
                        item("디폴트옵션 위험등급", "/customer/defaultOption/designatedProduct/riskLevel"), item("디폴트옵션 적용", "/customer/defaultOption/applicationStatus"),
                        item("데이터 기준일", "/briefingMeta/asOfDate")]),
        group("IRP 계좌현황", [item("평가금액", "/irpAccount/valuationAmountKrw"), item("1년 수익률", "/irpAccount/oneYearReturnPct"), item("세액공제 잔여한도", "/irpAccount/taxDeductionRemainingKrw")]
              + [item("최근 상품 신규 · " + key, "/irpAccount/latestProductOpening/" + key) for key in (customer.get("irpAccount", {}).get("latestProductOpening") or {}) if isinstance(customer["irpAccount"]["latestProductOpening"], dict)]),
    ]
    allocation = customer.get("irpAccount", {}).get("assetAllocation") or []
    groups.append(group("자산 구성", [x for i, a in enumerate(allocation) for x in (
        item(str(a.get("assetType")) + " 금액", "/irpAccount/assetAllocation/%d/amountKrw" % i), item(str(a.get("assetType")) + " 비중", "/irpAccount/assetAllocation/%d/weightPct" % i))]))
    for i, h in enumerate(customer.get("holdings") or []):
        groups.append(group("보유상품 %d · %s" % (i + 1, h.get("productName")), [
            item("자산유형", "/holdings/%d/assetType" % i), item("상품구분", "/holdings/%d/productCategory" % i), item("계약기간", "/holdings/%d/contractTerm" % i),
            item("평가금액", "/holdings/%d/valuationAmountKrw" % i), item("비중", "/holdings/%d/weightPct" % i), item("1년 수익률", "/holdings/%d/oneYearReturnPct" % i), item("가입일", "/holdings/%d/openedAt" % i)]))
    signals = customer.get("signals") or []
    groups.append(group("관리신호 · 세그먼트", [x for i, s in enumerate(signals) for x in (
        item("세그먼트 %d" % (i + 1), "/signals/%d/label" % i), item("세그먼트 %d 기준일" % (i + 1), "/signals/%d/date" % i))]))
    context = customer.get("에이전트맥락데이터") or {}
    for title, key in (("연금 수령 상태", "퇴직및인출"), ("납입 · 세제", "납입및세제")):
        block = context.get(key)
        if isinstance(block, dict):
            groups.append(group(title, [item(name, "/에이전트맥락데이터/" + key + "/" + name) for name in block]))
    return [g for g in groups if g]


def analysis_trace(evidence: dict, customer: dict, briefing: dict, parsed: dict) -> dict:
    """Four business steps with the actual construction times. No LLM call, no expected_* baselines."""
    t0, started = time.monotonic(), _now()
    steps, marks = [], []

    def mark(step, work):
        began, t = _now(), time.monotonic()
        result = work()
        steps.append({"id": step["id"], "sequence": len(steps) + 1, "title": step["title"], "summary": step["summary"],
                      "started_at": began, "ended_at": _now(), "duration_ms": int(round((time.monotonic() - t) * 1000)),
                      "fact_ids": list(step["fact_ids"]), "judgment_ids": list(step["judgment_ids"]),
                      "group_ids": list(step["group_ids"]), "target_prefixes": list(step["target_prefixes"])})
        return result
    presentation = evidence["presentation"]
    by_id = {s["id"]: s for s in presentation["steps"]}
    if [s["id"] for s in presentation["steps"]] != ["customer_summary", "management_focus", "knowledge_selection", "briefing_binding"]:
        raise BriefingError("EVIDENCE")
    snapshot = []
    def summarize():
        snapshot.extend(customer_snapshot(customer))
        return [{"id": f["id"], "label": f["label"], "role": f["role"], "values": [{"ref": ref, "value": pointer(customer, ref)} for ref in f["data_refs"]]}
                for f in evidence["facts"]]
    facts = mark(by_id["customer_summary"], summarize)
    for f in facts:
        for v in f["values"]:
            if not isinstance(v["value"], (str, int, float, bool)) and v["value"] is not None:
                raise BriefingError("EVIDENCE")
    judgments = mark(by_id["management_focus"], lambda: [
        {"id": j["id"], "origin": j["origin"], "summary": j["summary"], "guard": j.get("guard"), "fact_ids": list(j["fact_ids"]), "evidence_ids": list(j.get("evidence_ids") or [])}
        for j in evidence["judgments"]])
    cards = mark(by_id["knowledge_selection"], lambda: [
        {"id": c["id"], "group": c["group"], "title": c["title"], "source_title": c["source_title"], "product_id": c.get("product_id"),
         "source_id": c.get("source_id"), "summary": c["summary"], "application": c["application"], "raw_status": c["raw_status"],
         "raw_excerpts": [{"text": r["text"]} for r in c["raw_excerpts"]], "used_by": list(c["used_by"])}
        for c in evidence["knowledge_cards"]])
    def bind():
        out = []
        for b in evidence["bindings"]:
            text = pointer(briefing, b["target"])
            if not isinstance(text, str) or not text.strip():
                raise BriefingError("EVIDENCE")
            out.append({"id": b["id"], "target": b["target"], "text": text, "role": b["role"], "fact_ids": list(b["fact_ids"]),
                        "evidence_ids": list(b["evidence_ids"]), "judgment_ids": list(b["judgment_ids"])})
        for c in cards:
            for ref in c["used_by"]:
                if not isinstance(pointer(briefing, ref), str):
                    raise BriefingError("EVIDENCE")
        return out
    bindings = mark(by_id["briefing_binding"], bind)
    policy = evidence["runtime_policy"]
    return {"mode": policy["analysis_mode"], "origin": policy["trace_origin"], "judgment_origin": policy["judgment_origin"],
            "llm_calls": policy["llm_calls"], "case_id": parsed["case_id"], "as_of_date": parsed["as_of_date"],
            "started_at": started, "ended_at": _now(), "duration_ms": int(round((time.monotonic() - t0) * 1000)),
            "panel_title": presentation["panel_title"], "button": presentation["button"],
            "steps": steps, "groups": [{"id": g["id"], "title": g["title"], "card_ids": list(g["card_ids"]), "reuse_card_ids": list(g.get("reuse_card_ids") or [])} for g in presentation["groups"]],
            "snapshot": snapshot, "facts": facts, "judgments": judgments, "knowledge_cards": cards, "bindings": bindings,
            "workflow": {k: (list(v) if isinstance(v, list) else v) for k, v in evidence["workflow"].items()}}


def error_event(request_id: str) -> dict:
    return {"event": "error", "request_id": request_id,
            "message": "입력 규격 및 고객 데이터와 배포 자료의 일치 여부를 확인해 주세요."}


def sse_frame(logical_event: dict) -> str:
    envelope = {"event": "CHUNK",
                "content": json.dumps(logical_event, ensure_ascii=False, allow_nan=False),
                "references": [], "recommend_queries": [], "actions": []}
    return "data: " + json.dumps(envelope, ensure_ascii=False, allow_nan=False) + "\n\n"

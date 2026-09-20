"""Branch wire models. No customer loading, LLM calls, HTTP, or UI code.

This is the schema source. validate_request/event below also check relationships
that JSON Schema cannot express. Call these at the boundary, not just model_validate.
"""
from __future__ import annotations

import json
import math
import re
from datetime import date
from typing import Annotated, Literal, Union

from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator

VERSION = "branch-agent-api.v1"
DATASET = "branch-demo.v1"
RULE_VERSION = "branch-rules.v1"
MAX_SAFE = 9007199254740991
UUID_PATTERN = r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
ID_PATTERN = r"^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$"


def json_integer(value):
    # JSON has one numeric type. JS 1.0 and Python 1 must have the same verdict.
    if type(value) is float and math.isfinite(value) and value.is_integer():
        return int(value)
    return value


Int = Annotated[int, Field(ge=0, le=MAX_SAFE)]
Count = Annotated[Int, Field(le=48)]
Number = Annotated[float, Field(allow_inf_nan=False, ge=-MAX_SAFE, le=MAX_SAFE)]
Text = Annotated[str, Field(min_length=1, max_length=2000, pattern=r"\S")]
Label = Annotated[str, Field(min_length=1, max_length=80, pattern=r"\S")]
Question = Annotated[str, Field(min_length=1, max_length=1200, pattern=r"\S")]
RowId = Annotated[str, Field(pattern=ID_PATTERN)]
Uuid = Annotated[str, Field(pattern=UUID_PATTERN)]
Day = Annotated[str, Field(pattern=r"^\d{4}-\d{2}-\d{2}$")]
Hash = Annotated[str, Field(pattern=r"^[0-9a-f]{64}$")]
Ids = Annotated[list[RowId], Field(max_length=48)]
NumericField = Literal["age", "irp_amount", "cash_amount", "cash_pct", "return_pct"]
SortField = Union[NumericField, Literal["source_order"]]
MetricKey = Literal["customer_count", "irp_sum", "cash_sum"]


class Fixed(BaseModel):
    model_config = ConfigDict(strict=True, extra="forbid", allow_inf_nan=False)

    @field_validator("*", mode="before")
    @classmethod
    def integral_json_numbers(cls, value):
        return json_integer(value)


class Compare(Fixed):
    op: Literal["compare"]
    field: Union[NumericField, Literal["name", "grade"]]
    cmp: Literal["eq", "gte", "gt", "lte", "lt"]
    value: Union[Number, Label]


class Segment(Fixed):
    op: Literal["segment"]
    value: Label


class IsaBetween(Fixed):
    op: Literal["isa_between"]
    start: Day
    end: Day


class BooleanPredicate(Fixed):
    op: Literal["and", "or"]
    args: Annotated[list["Predicate"], Field(min_length=1, max_length=32)]


class NotPredicate(Fixed):
    op: Literal["not"]
    arg: "Predicate"


Predicate = Union[Compare, Segment, IsaBetween, BooleanPredicate, NotPredicate]
BooleanPredicate.model_rebuild()
NotPredicate.model_rebuild()


class Filter(Fixed):
    id: RowId
    type: Literal["filter"]
    predicate: Predicate


class SortOperation(Fixed):
    id: RowId
    type: Literal["sort"]
    field: SortField
    direction: Literal["asc", "desc"]


class Take(Fixed):
    id: RowId
    type: Literal["take"]
    count: Annotated[Count, Field(ge=1)]


class Selection(Fixed):
    base: Literal["all", "recommendation"]
    operations: Annotated[list[Union[Filter, SortOperation, Take]], Field(max_length=100)]


class Recommendation(Fixed):
    rule_version: Literal["branch-rules.v1"]
    as_of_date: Day


class Aggregate(Fixed):
    selection: Selection
    metric_keys: Annotated[list[MetricKey], Field(min_length=1, max_length=3)]


class Choice(Fixed):
    value: Label
    label: Label


class Clarification(Fixed):
    kind: Literal["cash_field", "cash_value", "amount_basis", "scope", "customer", "date_basis", "condition"]
    field: Union[Literal["cash_amount", "cash_pct", "irp_amount"], None]
    pending_message: Question
    candidate_row_ids: Ids
    options: Annotated[list[Choice], Field(max_length=48)]


class State(Fixed):
    active: bool
    selection: Selection
    recommendation: Union[Recommendation, None]
    last_aggregate: Union[Aggregate, None]
    clarification: Union[Clarification, None]
    selected_row_id: Union[RowId, None]


class SimpleAction(Fixed):
    type: Literal["recommend", "restore_recommendation", "show_aggregate", "reset"]


class RemoveAction(Fixed):
    type: Literal["remove_condition"]
    operation_id: RowId


class BriefAction(Fixed):
    type: Literal["brief"]
    row_id: RowId


class ClarifyAction(Fixed):
    type: Literal["clarify"]
    value: Label


Action = Union[SimpleAction, RemoveAction, BriefAction, ClarifyAction]


class Button(Fixed):
    label: Label
    action: Action


class Identity(Fixed):
    schema_version: Literal["branch-agent-api.v1"]
    request_id: Uuid
    conversation_id: Uuid
    base_revision: Annotated[Int, Field(lt=MAX_SAFE)]
    dataset_id: Literal["branch-demo.v1"]
    data_version: Hash
    rule_version: Literal["branch-rules.v1"]


class BranchRequest(Identity):
    task: Literal["branch_assistant"]
    x_client_user: Annotated[str, Field(min_length=1, max_length=128, pattern=r"\S")]
    message: Question
    action: Union[Action, None]
    state: Union[State, None]


class FabrixRequest(BaseModel):
    # Outer gateway additions are permitted; the inner contract is strict.
    model_config = ConfigDict(strict=True, extra="ignore")
    input_value: Annotated[str, Field(min_length=1, max_length=1024 * 1024)]
    message_hists: Union[list[dict], None] = None


class Metric(Fixed):
    key: MetricKey
    value: Union[Number, None]
    unit: Literal["count", "KRW", "pct"]
    known_count: Count
    unknown_count: Count


class Reason(Fixed):
    row_id: RowId
    code: Literal["UR01", "UR02", "UR03"]
    text: Text
    as_of_date: Day
    evidence_refs: Annotated[list[Annotated[str, Field(min_length=1, max_length=256, pattern=r"^/")]], Field(min_length=1, max_length=8)]


class Result(Fixed):
    row_ids: Ids
    count: Count
    unknown_row_ids: Ids
    metrics: Annotated[list[Metric], Field(max_length=3)]
    reasons: Annotated[list[Reason], Field(max_length=48)]


class Sort(Fixed):
    field: Union[SortField, Literal["recommendation_order"]]
    direction: Literal["asc", "desc"]


class UI(Fixed):
    list_action: Literal["keep", "replace", "reset"]
    row_ids: Union[Ids, None]
    sort: Union[Sort, None]


class Answer(Identity):
    revision: Int
    intent: Literal["search", "overview", "aggregate", "recommend", "brief", "clarify", "restore", "unsupported"]
    status: Literal["ok", "empty", "clarification_required", "unsupported"]
    text: Text
    result: Result
    ui: UI
    context_label: Annotated[str, Field(max_length=2000)]
    scope_note: Annotated[str, Field(max_length=2000)]
    actions: Annotated[list[Button], Field(max_length=8)]
    next_state: State


class AnswerEvent(Fixed):
    event: Literal["answer"]
    data: Answer


class Progress(Fixed):
    request_id: Uuid
    conversation_id: Uuid
    base_revision: Annotated[Int, Field(lt=MAX_SAFE)]
    phase: Literal["interpreting", "executing", "composing"]
    list_pending: bool


class ProgressEvent(Fixed):
    event: Literal["progress"]
    data: Progress


class ErrorData(Fixed):
    schema_version: Literal["branch-agent-api.v1"]
    request_id: Union[Uuid, Literal["invalid-request"]]
    conversation_id: Union[Uuid, None]
    base_revision: Union[Annotated[Int, Field(lt=MAX_SAFE)], None]
    code: Literal["INVALID_REQUEST", "VERSION", "DATA_VERSION", "STATE", "ACTION", "LLM_TIMEOUT", "LLM_OUTPUT", "INTERNAL"]
    retryable: bool
    message: Annotated[str, Field(min_length=1, max_length=300, pattern=r"\S")]


class ErrorEvent(Fixed):
    event: Literal["error"]
    data: ErrorData


class ContractSchemas(Fixed):
    """Schema entry points, not an object sent across the wire."""
    request: BranchRequest
    answer: AnswerEvent
    progress: ProgressEvent
    error: ErrorEvent
    state: State


class ContractError(ValueError):
    def __init__(self, code="SCHEMA"):
        self.code = code
        super().__init__(code)  # Never include submitted values in errors/logs.


def require(condition, code="SCHEMA"):
    if not condition:
        raise ContractError(code)


def initial_state():
    return {"active": False, "selection": {"base": "all", "operations": []},
            "recommendation": None, "last_aggregate": None, "clarification": None, "selected_row_id": None}


def shape(kind, raw):
    classes = {"request": BranchRequest, "answer": AnswerEvent, "progress": ProgressEvent, "error": ErrorEvent, "state": State}
    try:
        json_value_check(raw)
        require(kind in classes)
        return classes[kind].model_validate(raw).model_dump()
    except (ValidationError, RecursionError, TypeError, OverflowError):
        raise ContractError("SCHEMA") from None


def json_value_check(value, depth=0):
    """Reject non-JSON values and lone surrogates before either serializer sees them."""
    require(depth <= 64)
    if isinstance(value, str):
        require(not any(0xD800 <= ord(ch) <= 0xDFFF for ch in value))
    elif type(value) in (int, float):
        require(math.isfinite(value) and abs(value) <= MAX_SAFE)
    elif isinstance(value, dict):
        for key, child in value.items():
            require(isinstance(key, str))
            json_value_check(key, depth + 1)
            json_value_check(child, depth + 1)
    elif isinstance(value, list):
        for child in value:
            json_value_check(child, depth + 1)
    else:
        require(value is None or type(value) is bool)


def valid_day(value):
    try:
        return date.fromisoformat(value).isoformat() == value
    except (ValueError, TypeError):
        return False


def unique(values, code="SCHEMA"):
    require(len(set(values)) == len(values), code)


def manifest_check(manifest):
    require(isinstance(manifest, dict), "MANIFEST")
    require(manifest.get("dataset_id") == DATASET and manifest.get("rule_version") == RULE_VERSION, "MANIFEST")
    require(isinstance(manifest.get("row_ids"), list) and 0 < len(manifest["row_ids"]) <= 48, "MANIFEST")
    require(all(isinstance(x, str) for x in manifest["row_ids"]), "MANIFEST")
    unique(manifest["row_ids"], "MANIFEST")
    require(isinstance(manifest.get("segment_labels"), list) and all(isinstance(x, str) for x in manifest["segment_labels"]), "MANIFEST")
    require(valid_day(manifest.get("as_of_date")), "MANIFEST")


def identities(value, manifest):
    for key in ("dataset_id", "data_version", "rule_version"):
        require(value[key] == manifest.get(key), "DATA_VERSION")


def check_ids(ids, manifest):
    unique(ids, "IDENTITY")
    require(all(x in manifest["row_ids"] for x in ids), "IDENTITY")


def predicate_check(predicate, manifest, depth=1):
    require(depth <= 4, "STATE")
    op = predicate["op"]
    nodes = 1
    if op == "compare":
        field, value = predicate["field"], predicate["value"]
        if field in ("name", "grade"):
            require(isinstance(value, str) and predicate["cmp"] == "eq", "STATE")
        else:
            require(type(value) in (int, float), "STATE")
            if field in ("irp_amount", "cash_amount", "age"):
                require(value >= 0 and float(value).is_integer(), "STATE")
            if field == "age":
                require(value <= 150, "STATE")
            if field == "cash_pct":
                require(0 <= value <= 100, "STATE")
    elif op == "segment":
        require(predicate["value"] in manifest["segment_labels"] or predicate["value"] == "retirement_uninstructed", "STATE")
    elif op == "isa_between":
        require(valid_day(predicate["start"]) and valid_day(predicate["end"]) and predicate["start"] <= predicate["end"], "STATE")
    elif op in ("and", "or"):
        nodes += sum(predicate_check(x, manifest, depth + 1) for x in predicate["args"])
    elif op == "not":
        nodes += predicate_check(predicate["arg"], manifest, depth + 1)
    require(nodes <= 32, "STATE")
    return nodes


def selection_check(selection, state, manifest):
    require(selection["base"] != "recommendation" or state["recommendation"] is not None, "STATE")
    unique([x["id"] for x in selection["operations"]], "STATE")
    for operation in selection["operations"]:
        if operation["type"] == "filter":
            predicate_check(operation["predicate"], manifest)


def state_check(state, manifest):
    selection_check(state["selection"], state, manifest)
    if not state["active"]:
        require(state["selection"] == initial_state()["selection"], "STATE")
    rec = state["recommendation"]
    if rec:
        require(rec["rule_version"] == manifest["rule_version"] and rec["as_of_date"] == manifest["as_of_date"], "STATE")
    aggregate = state["last_aggregate"]
    if aggregate:
        selection_check(aggregate["selection"], state, manifest)
        unique(aggregate["metric_keys"], "STATE")
    if state["selected_row_id"] is not None:
        check_ids([state["selected_row_id"]], manifest)
    clarify = state["clarification"]
    if clarify:
        check_ids(clarify["candidate_row_ids"], manifest)
        unique([x["value"] for x in clarify["options"]], "STATE")
        if clarify["kind"] == "cash_value":
            require(clarify["field"] in ("cash_amount", "cash_pct"), "STATE")
        if clarify["kind"] == "customer":
            require(bool(clarify["candidate_row_ids"]), "STATE")


def action_check(action, state, manifest):
    kind = action["type"]
    if kind == "restore_recommendation":
        require(state["recommendation"] is not None, "ACTION")
    elif kind == "show_aggregate":
        require(state["last_aggregate"] is not None, "ACTION")
    elif kind == "remove_condition":
        require(any(x["type"] == "filter" and x["id"] == action["operation_id"] for x in state["selection"]["operations"]), "ACTION")
    elif kind == "brief":
        check_ids([action["row_id"]], manifest)
        if state["clarification"] and state["clarification"]["kind"] == "customer":
            require(action["row_id"] in state["clarification"]["candidate_row_ids"], "ACTION")
    elif kind == "clarify":
        require(state["clarification"] is not None and action["value"] in [x["value"] for x in state["clarification"]["options"]], "ACTION")


def validate_request(raw, manifest):
    manifest_check(manifest)
    value = shape("request", raw)
    identities(value, manifest)
    state = value["state"] or initial_state()
    state_check(state, manifest)
    if value["action"] is not None:
        action_check(value["action"], state, manifest)
    return value


def validate_event(raw, request, manifest, records_by_id=None):
    request = validate_request(request, manifest)
    require(isinstance(raw, dict) and raw.get("event") in ("answer", "progress", "error"))
    value = shape(raw["event"], raw)
    data = value["data"]
    for key in ("request_id", "conversation_id", "base_revision"):
        require(data[key] == request[key], "IDENTITY")
    if value["event"] == "progress":
        require(data["phase"] != "interpreting" or not data["list_pending"], "STATE")
        return value
    if value["event"] == "error":
        return value
    identities(data, manifest)
    require(data["revision"] == request["base_revision"] + 1, "REVISION")
    state, old = data["next_state"], request["state"] or initial_state()
    state_check(state, manifest)
    result, ui = data["result"], data["ui"]
    check_ids(result["row_ids"], manifest)
    check_ids(result["unknown_row_ids"], manifest)
    require(result["count"] == len(result["row_ids"]) and not set(result["row_ids"]) & set(result["unknown_row_ids"]), "RESULT")
    unique([x["key"] for x in result["metrics"]], "RESULT")
    for metric in result["metrics"]:
        require(metric["known_count"] + metric["unknown_count"] == result["count"], "RESULT")
        require(metric["unit"] == ("count" if metric["key"] == "customer_count" else "KRW"), "RESULT")
        if metric["value"] is not None:
            require(metric["value"] >= 0 and float(metric["value"]).is_integer(), "RESULT")
        if metric["key"] == "customer_count":
            require(metric["value"] == result["count"] and metric["unknown_count"] == 0, "RESULT")
        else:
            require((metric["value"] is None) == (metric["known_count"] == 0 and result["count"] > 0), "RESULT")
            if result["count"] == 0:
                require(metric["value"] == 0, "RESULT")
    unique([x["row_id"] + ":" + x["code"] for x in result["reasons"]], "RESULT")
    for reason in result["reasons"]:
        require(reason["row_id"] in result["row_ids"] and valid_day(reason["as_of_date"]) and reason["as_of_date"] == manifest["as_of_date"], "RESULT")
        unique(reason["evidence_refs"], "RESULT")
        for pointer in reason["evidence_refs"]:
            require(not re.search(r"~(?![01])", pointer), "RESULT")
            if records_by_id is not None:
                current = records_by_id.get(reason["row_id"])
                for token in pointer[1:].split("/"):
                    token = token.replace("~1", "/").replace("~0", "~")
                    if isinstance(current, dict) and token in current:
                        current = current[token]
                    elif isinstance(current, list) and token.isascii() and token.isdigit() and str(int(token)) == token and int(token) < len(current):
                        current = current[int(token)]
                    else:
                        raise ContractError("RESULT")
    for button in data["actions"]:
        action_check(button["action"], state, manifest)
    effect, intent, status = ui["list_action"], data["intent"], data["status"]
    if effect == "replace":
        require(ui["row_ids"] is not None and ui["sort"] is not None, "UI")
        check_ids(ui["row_ids"], manifest)
        require(ui["row_ids"] == result["row_ids"] and state["active"], "UI")
        require(intent in ("search", "recommend", "restore"), "UI")
        require(status == ("empty" if not ui["row_ids"] else "ok"), "UI")
        require(state["selected_row_id"] is None or state["selected_row_id"] in ui["row_ids"], "STATE")
    else:
        require(ui["row_ids"] is None and ui["sort"] is None, "UI")
        if effect == "keep":
            require(all(state[k] == old[k] for k in ("active", "selection", "recommendation")), "UI")
            require(intent in ("overview", "aggregate", "brief", "clarify", "unsupported"), "UI")
        else:
            require(intent == "restore" and status == "ok" and state == initial_state(), "UI")
            require(result["row_ids"] == manifest["row_ids"], "RESULT")
    require(status != "empty" or effect == "replace", "UI")
    if intent == "clarify":
        require(status == "clarification_required" and state["clarification"] is not None, "STATE")
    else:
        require(status != "clarification_required" and state["clarification"] is None, "STATE")
    require((intent == "unsupported") == (status == "unsupported"), "STATE")
    if intent == "recommend":
        require(state["recommendation"] is not None and state["selection"] == {"base": "recommendation", "operations": []}, "STATE")
        require(set(x["row_id"] for x in result["reasons"]) == set(result["row_ids"]), "RESULT")
        require(ui["sort"]["field"] == "recommendation_order", "UI")
    if intent == "brief":
        require(result["count"] == 1 and state["selected_row_id"] == result["row_ids"][0], "RESULT")
    if intent in ("overview", "aggregate"):
        require(state["last_aggregate"] is not None, "STATE")
    return value


def parse_request(outer, manifest):
    try:
        envelope = FabrixRequest.model_validate(outer)
        raw = json.loads(envelope.input_value, parse_constant=lambda _: (_ for _ in ()).throw(ContractError()))
    except (ValidationError, ValueError, TypeError, RecursionError):
        raise ContractError("INVALID_REQUEST") from None
    return validate_request(raw, manifest)


def sse_frame(event):
    # Schema check only here; service must validate_event against the request first.
    require(isinstance(event, dict))
    logical = shape(event.get("event"), event)
    chunk = {"event": "CHUNK", "content": json.dumps(logical, ensure_ascii=False, allow_nan=False),
             "references": [], "recommend_queries": [], "actions": []}
    return "data: " + json.dumps(chunk, ensure_ascii=False, allow_nan=False) + "\n\n"

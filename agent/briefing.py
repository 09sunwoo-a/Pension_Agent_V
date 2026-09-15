"""Fixed customer briefing lookup. Standard library only; never calls an LLM."""
import copy
import json
import math
import re
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
    validate_shape(answer, data["answer_schema"])
    return answer


def error_event(request_id: str) -> dict:
    return {"event": "error", "request_id": request_id,
            "message": "입력 규격 및 고객 데이터와 배포 자료의 일치 여부를 확인해 주세요."}


def sse_frame(logical_event: dict) -> str:
    envelope = {"event": "CHUNK",
                "content": json.dumps(logical_event, ensure_ascii=False, allow_nan=False),
                "references": [], "recommend_queries": [], "actions": []}
    return "data: " + json.dumps(envelope, ensure_ascii=False, allow_nan=False) + "\n\n"

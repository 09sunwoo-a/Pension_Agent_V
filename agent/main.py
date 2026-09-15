"""FabriX fixed-briefing endpoint. LLM transport is intentionally not imported."""
import logging
from typing import Any, Literal

from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, ConfigDict, Field

from briefing import BriefingError, build_answer, error_event, load_data, parse_json, request_id_of, sse_frame

app = FastAPI()
logger = logging.getLogger(__name__)


class FabrixRequest(BaseModel):
    # Connector may add outer fields; the inner briefing request is strict.
    model_config = ConfigDict(strict=True, extra="ignore")
    input_value: str = Field(max_length=1024 * 1024)
    message_hists: list[dict[str, Any]] | None = None


class FixedModel(BaseModel):
    model_config = ConfigDict(strict=True, extra="forbid")


class AnswerData(FixedModel):
    schema_version: Literal["customer-briefing-api.v1"]
    answer_type: Literal["briefing"]
    request_id: str = Field(pattern=r"\S")
    case_id: str = Field(pattern=r"\S")
    customer_id: str = Field(pattern=r"\S")
    as_of_date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    # All nested fields are validated by the shared generated contract in
    # briefing.build_answer(), before this fixed Pydantic envelope is assembled.
    briefing: dict[str, Any]


class AnswerEvent(FixedModel):
    event: Literal["answer"]
    data: AnswerData


class ErrorEvent(FixedModel):
    event: Literal["error"]
    request_id: str = Field(pattern=r"\S")
    message: str = Field(pattern=r"\S")


@app.exception_handler(RequestValidationError)
async def invalid_outer_request(_request, _error):
    # FastAPI's default validation detail can echo the submitted customer data.
    return JSONResponse(status_code=422, content={"detail": "Invalid FabriX request envelope."})


@app.get("/health")
def health():
    try:
        count = len(load_data()["cases"])
        return {"status": "ok", "mode": "fixed_briefing", "llm_enabled": False, "case_count": count}
    except BriefingError:
        return JSONResponse(status_code=503, content={"status": "unavailable", "mode": "fixed_briefing"})


@app.post("/chat")
def chat(req: FabrixRequest):
    request_id = "invalid-request"
    try:
        parsed = parse_json(req.input_value)
        request_id = request_id_of(parsed)
        logical = AnswerEvent.model_validate(build_answer(parsed))
    except BriefingError as error:
        logger.warning("briefing_request_failed code=%s", str(error))
        logical = ErrorEvent.model_validate(error_event(request_id))
    except Exception:
        # Do not log raw exceptions, requests, employee IDs, keys or model output.
        logger.error("briefing_request_failed code=INTERNAL")
        logical = ErrorEvent.model_validate(error_event(request_id))

    # Exactly one complete logical event in one Agent CHUNK, then EOF.
    return StreamingResponse(iter([sse_frame(logical.model_dump())]),
                             media_type="text/event-stream",
                             headers={"Cache-Control": "no-store", "X-Accel-Buffering": "no"})

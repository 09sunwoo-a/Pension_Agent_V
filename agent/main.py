import json
from typing import Any, Literal

from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

# 기존에 Gemma4 호출 성공한 llm_client.py의 call()을 그대로 사용
from llm_client import call as call_llm


app = FastAPI()


# ============================================================
# Fabrix -> Pro Agent Request
# ============================================================

class FabrixRequest(BaseModel):
    input_value: str
    message_hists: list[dict[str, Any]] | None = None


# ============================================================
# Frontend Contract
#
# 중요:
# 아래 구조는 Python이 100% 고정한다.
# LLM은 이 schema / type / blocks 구조를 생성하지 않는다.
# ============================================================

class Block(BaseModel):
    type: Literal[
        "paragraph",
        "caution",
    ]
    title: str | None = None
    text: str
    items: list[str] = Field(default_factory=list)


class AgentAnswer(BaseModel):
    schema_version: Literal["1.0"] = "1.0"
    answer_type: Literal["fact"] = "fact"

    lead: str

    blocks: list[Block] = Field(default_factory=list)

    followups: list[str] = Field(default_factory=list)


class AnswerEvent(BaseModel):
    event: Literal["answer"] = "answer"
    data: AgentAnswer


class ErrorEvent(BaseModel):
    event: Literal["error"] = "error"
    message: str


# ============================================================
# Input Parser
# ============================================================

def parse_input_value(raw: str) -> dict[str, Any]:
    """
    input_value가 JSON 문자열이면 dict로 복원.
    아니면 raw 전체를 message로 취급.
    """

    try:
        parsed = json.loads(raw)

        if isinstance(parsed, dict):
            return parsed

    except Exception:
        pass

    return {
        "message": raw,
    }


# ============================================================
# LLM Text Slot Generator
#
# 핵심:
# Gemma는 JSON을 만들지 않는다.
# 각 호출은 오직 '문장 문자열'만 생성한다.
# ============================================================

def generate_text_slot(
    *,
    user_question: str,
    slot_instruction: str,
    x_client_user: str,
    max_tokens: int = 300,
) -> str:

    system_prompt = f"""
너는 KB국민은행 직원용 퇴직연금 상담지원 문구 작성 도우미다.

아래 역할의 자연어 문장만 작성한다.

역할:
{slot_instruction}

출력 규칙:
- JSON을 출력하지 않는다.
- Markdown을 출력하지 않는다.
- 제목이나 라벨을 붙이지 않는다.
- bullet 기호를 사용하지 않는다.
- 코드블록을 사용하지 않는다.
- 요청한 문장 자체만 출력한다.
- 모르는 사실을 임의로 만들지 않는다.
""".strip()

    result = call_llm(
        messages=[
            {
                "role": "user",
                "content": user_question,
            }
        ],
        system=system_prompt,
        max_tokens=max_tokens,
        x_client_user=x_client_user,
    )

    # 구조 파싱을 하지 않는다.
    # LLM 결과는 어디까지나 문자열 content일 뿐이다.
    return str(result or "").strip()


# ============================================================
# Fixed Backend Assembler
#
# Frontend에 전달되는 구조는 여기서만 결정된다.
# ============================================================

def build_fact_answer(
    *,
    lead: str,
    detail: str,
    caution: str,
) -> AgentAnswer:

    return AgentAnswer(
        # 아래 metadata / UI 구조는 Python 고정값
        schema_version="1.0",
        answer_type="fact",

        # LLM이 생성한 것은 문자열 값만 삽입
        lead=lead,

        blocks=[
            Block(
                type="paragraph",
                title=None,
                text=detail,
                items=[],
            ),
            Block(
                type="caution",
                title=None,
                text=caution,
                items=[],
            ),
        ],

        # TEST2에서는 아직 follow-up 생성 안 함.
        # 구조는 유지하되 빈 배열로 고정.
        followups=[],
    )


# ============================================================
# SSE Builder
# ============================================================

def build_streaming_response(
    logical_event: BaseModel,
) -> StreamingResponse:

    # Pydantic object -> Python dict -> JSON string
    agent_content = json.dumps(
        logical_event.model_dump(),
        ensure_ascii=False,
    )

    print(
        "[TEST2_FIXED] FINAL AGENT CONTENT:",
        agent_content,
    )

    def generate():
        # Fabrix가 기대하는 Agent SSE envelope
        payload = {
            "event": "CHUNK",
            "content": agent_content,
            "references": [],
            "recommend_queries": [],
            "actions": [],
        }

        yield (
            "data: "
            + json.dumps(
                payload,
                ensure_ascii=False,
            )
            + "\n\n"
        )

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
    )


# ============================================================
# Health
# ============================================================

@app.get("/health")
def health():
    return {
        "status": "ok",
        "test": "gemma-text-only-fixed-template-test-2",
    }


# ============================================================
# Chat
# ============================================================

@app.post("/chat")
def chat(req: FabrixRequest):

    parsed = parse_input_value(
        req.input_value
    )

    user_question = str(
        parsed.get("message")
        or parsed.get("input_value")
        or req.input_value
    ).strip()

    x_client_user = str(
        parsed.get("x_client_user")
        or parsed.get("user_id")
        or "test-user"
    )

    print("===================================")
    print("[TEST2_FIXED] /chat called")
    print(
        "[TEST2_FIXED] question:",
        user_question,
    )
    print(
        "[TEST2_FIXED] x_client_user:",
        x_client_user,
    )
    print("===================================")

    try:
        # ----------------------------------------------------
        # 1. LLM은 각각 자연어 문장만 생성
        # ----------------------------------------------------

        lead = generate_text_slot(
            user_question=user_question,
            slot_instruction=(
                "직원이 질문에 바로 답할 수 있도록 "
                "핵심 결론을 1문장으로 작성한다."
            ),
            x_client_user=x_client_user,
            max_tokens=180,
        )

        print(
            "[TEST2_FIXED] LLM lead:",
            lead,
        )

        detail = generate_text_slot(
            user_question=user_question,
            slot_instruction=(
                "핵심 결론을 뒷받침하는 상세 설명을 "
                "2~3문장의 자연스러운 문단으로 작성한다."
            ),
            x_client_user=x_client_user,
            max_tokens=350,
        )

        print(
            "[TEST2_FIXED] LLM detail:",
            detail,
        )

        caution = generate_text_slot(
            user_question=user_question,
            slot_instruction=(
                "직원이 고객에게 안내할 때 확인하거나 "
                "주의해야 할 점을 1문장으로 작성한다. "
                "별도 주의사항이 뚜렷하지 않다면 "
                "확정 안내 전에 관련 기준과 고객 정보를 "
                "확인해야 한다는 수준으로 작성한다."
            ),
            x_client_user=x_client_user,
            max_tokens=180,
        )

        print(
            "[TEST2_FIXED] LLM caution:",
            caution,
        )

        # ----------------------------------------------------
        # 2. Python이 100% 고정 구조로 조립
        # ----------------------------------------------------

        answer = build_fact_answer(
            lead=lead,
            detail=detail,
            caution=caution,
        )

        print(
            "[TEST2_FIXED] PYDANTIC ANSWER:",
            answer.model_dump(),
        )

        # ----------------------------------------------------
        # 3. 고정 AnswerEvent
        # ----------------------------------------------------

        logical_event = AnswerEvent(
            data=answer
        )

    except Exception as e:

        print(
            "[TEST2_FIXED] ERROR:",
            repr(e),
        )

        # 오류 구조도 Python이 고정
        logical_event = ErrorEvent(
            message=(
                "답변 생성 중 오류가 발생했습니다."
            )
        )

    # --------------------------------------------------------
    # 4. Fabrix SSE
    # --------------------------------------------------------

    return build_streaming_response(
        logical_event
    )

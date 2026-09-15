# -*- coding: utf-8 -*-

from __future__ import annotations

import os
import random
import string

from dotenv import load_dotenv
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langchain_openai import AzureChatOpenAI


load_dotenv()


DEFAULT_TRNN_ENDPOINT = (
    "https://cm-hea-genai-stg-apim.azure-api.net/trnn/gemma-4"
)

DEFAULT_SERV_ENDPOINT = (
    "https://cm-hea-genai-stg-apim.azure-api.net/serv/gemma-4"
)

DEFAULT_DEPLOYMENT_NAME = "gemma-4-31b-nvidia-fp4-h100"
DEFAULT_API_VERSION = "1"


def _stage() -> str:
    value = os.getenv("ENV_PATH", "").strip().lower()

    if value in {"serving", "serv"}:
        return "SERV"

    return "TRNN"


def _endpoint() -> str:
    stage = _stage()

    if stage == "SERV":
        return (
            os.getenv("LLM_BASE_URL_SERV", "").strip()
            or os.getenv("LLM_BASE_URL", "").strip()
            or DEFAULT_SERV_ENDPOINT
        )

    return (
        os.getenv("LLM_BASE_URL_TRNN", "").strip()
        or os.getenv("LLM_BASE_URL", "").strip()
        or DEFAULT_TRNN_ENDPOINT
    )


def _api_key() -> str:
    stage = _stage()

    if stage == "SERV":
        key = (
            os.getenv("LLM_API_KEY_SERV", "").strip()
            or os.getenv("LLM_API_KEY", "").strip()
        )
    else:
        key = (
            os.getenv("LLM_API_KEY_TRNN", "").strip()
            or os.getenv("LLM_API_KEY", "").strip()
        )

    if not key:
        raise EnvironmentError(
            f"Gemma API key가 없습니다. "
            f"stage={stage}, "
            f"LLM_API_KEY_{stage} 또는 LLM_API_KEY를 확인하세요."
        )

    return key


def _deployment_name(override: str = "") -> str:
    return (
        override.strip()
        or os.getenv("LLM_DEPLOYMENT_NAME", "").strip()
        or DEFAULT_DEPLOYMENT_NAME
    )


def _random_suffix(length: int = 5) -> str:
    alphabet = string.ascii_letters + string.digits

    return "".join(
        random.choice(alphabet)
        for _ in range(length)
    )


def call(
    messages: list[dict[str, str]],
    *,
    system: str = "",
    model: str = "",
    max_tokens: int = 1024,
    x_client_user: str = "",
) -> str:

    api_key = _api_key()
    endpoint = _endpoint()
    deployment_name = _deployment_name(model)

    user_id = x_client_user or "system"
    client_user = f"{user_id}-{_random_suffix(5)}"

    headers = {
        "kb-key": api_key,
        "x-client-user": client_user,
    }

    model_options = {
        "openai_api_version": os.getenv(
            "LLM_API_VERSION",
            DEFAULT_API_VERSION,
        ),
        "deployment_name": deployment_name,
        "streaming": False,
        "stream_usage": True,
        "default_headers": headers,
        "api_key": api_key,
        "azure_endpoint": endpoint,
        "model_kwargs": {
            "extra_headers": headers,
        },
        "max_tokens": max_tokens,
    }

    llm = AzureChatOpenAI(**model_options)

    lc_messages = []

    if system:
        lc_messages.append(
            SystemMessage(content=system)
        )

    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")

        if role == "system":
            lc_messages.append(
                SystemMessage(content=content)
            )
        elif role == "assistant":
            lc_messages.append(
                AIMessage(content=content)
            )
        else:
            lc_messages.append(
                HumanMessage(content=content)
            )

    response = llm.invoke(lc_messages)

    content = response.content

    if isinstance(content, str):
        return content

    return str(content)


def status() -> dict:
    try:
        key_set = bool(_api_key())
    except Exception:
        key_set = False

    return {
        "stage": _stage(),
        "endpoint": _endpoint(),
        "deployment_name": _deployment_name(),
        "api_version": os.getenv(
            "LLM_API_VERSION",
            DEFAULT_API_VERSION,
        ),
        "api_key_set": key_set,
    }


if __name__ == "__main__":
    print("=" * 70)
    print("Gemma4 연결 테스트")
    print("=" * 70)
    print("STAGE      :", _stage())
    print("ENDPOINT   :", _endpoint())
    print("DEPLOYMENT :", _deployment_name())
    print(
        "API VERSION:",
        os.getenv(
            "LLM_API_VERSION",
            DEFAULT_API_VERSION,
        ),
    )
    print(
        "API KEY    :",
        "설정됨" if _api_key() else "미설정",
    )
    print()

    result = call(
        messages=[
            {
                "role": "user",
                "content": "안녕. 한 문장으로 인사해줘.",
            }
        ],
        x_client_user="llm-client-test",
        max_tokens=100,
    )

    print("[SUCCESS]")
    print(result)

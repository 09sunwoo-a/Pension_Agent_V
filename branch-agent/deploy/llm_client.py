"""Internal transport: preserve the established call signature, stage and authentication."""
import os
import random
import string


def _stage():
    return "SERV" if os.getenv("ENV_PATH", "").strip().lower() in ("serv", "serving") else "TRNN"


def readiness():
    """Presence-only view of the LLM settings for /health. Never returns values, and never calls the model."""
    stage = _stage()
    try:
        import langchain_openai  # noqa: F401
        sdk = True
    except Exception:
        sdk = False
    return {"stage": stage,
            "model_ok": os.getenv("LLM_MODEL", "gemma-4-31b-it") == "gemma-4-31b-it",
            "deployment_name_set": bool(os.getenv("LLM_DEPLOYMENT_NAME", "").strip()),
            "api_key_set": bool(os.getenv("LLM_API_KEY_" + stage, "").strip() or os.getenv("LLM_API_KEY", "").strip()),
            "base_url_set": bool(os.getenv("LLM_BASE_URL_" + stage, "").strip() or os.getenv("LLM_BASE_URL", "").strip()),
            "sdk_importable": sdk}


def _fail(code, detail):
    error = RuntimeError(code)
    error.detail = detail  # Diagnostic only: exception class / HTTP status / missing variable names. Never values.
    return error


def call(messages: list[dict[str, str]], *, system: str = "", model: str = "",
         max_tokens: int = 1024, x_client_user: str = "") -> str:
    try:
        from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
        from langchain_openai import AzureChatOpenAI
    except Exception as error:
        raise _fail("LLM_SDK", "sdk import failed: " + type(error).__name__) from None
    stage = _stage()
    endpoint = (os.getenv("LLM_BASE_URL_" + stage, "").strip() or os.getenv("LLM_BASE_URL", "").strip()
                or "https://cm-hea-genai-stg-apim.azure-api.net/" + ("serv" if stage == "SERV" else "trnn") + "/gemma-4")
    key = os.getenv("LLM_API_KEY_" + stage, "").strip() or os.getenv("LLM_API_KEY", "").strip()
    deployment = model.strip() or os.getenv("LLM_DEPLOYMENT_NAME", "").strip()
    missing = [name for name, ok in (("LLM_API_KEY_" + stage + "|LLM_API_KEY", key), ("LLM_DEPLOYMENT_NAME", deployment),
                                     ("LLM_MODEL=gemma-4-31b-it", os.getenv("LLM_MODEL", "gemma-4-31b-it") == "gemma-4-31b-it")) if not ok]
    if missing:
        raise _fail("LLM_CONFIG", "stage=" + stage + " missing: " + ", ".join(missing))
    suffix = "".join(random.choice(string.ascii_letters + string.digits) for _ in range(5))
    headers = {"kb-key": key, "x-client-user": (x_client_user or "system") + "-" + suffix}
    llm = AzureChatOpenAI(openai_api_version=os.getenv("LLM_API_VERSION", "1"),
        deployment_name=deployment, streaming=False, stream_usage=True, default_headers=headers,
        api_key=key, azure_endpoint=endpoint, model_kwargs={"extra_headers": headers},
        max_tokens=max_tokens, timeout=20, max_retries=0)
    translated = [SystemMessage(content=system)] if system else []
    types = {"system": SystemMessage, "assistant": AIMessage, "user": HumanMessage}
    translated.extend(types.get(m.get("role"), HumanMessage)(content=m.get("content", "")) for m in messages)
    try:
        response = llm.invoke(translated)
    except Exception as error:
        if "timeout" in type(error).__name__.lower():
            raise TimeoutError("LLM_TIMEOUT") from None
        status = getattr(error, "status_code", None) or getattr(getattr(error, "response", None), "status_code", None)
        raise _fail("LLM_PROVIDER", "stage=" + stage + " " + type(error).__name__ + (" status=" + str(status) if status else "")) from None
    if not isinstance(response.content, str):
        raise RuntimeError("LLM_OUTPUT")
    return response.content

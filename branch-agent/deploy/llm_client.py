"""Internal transport: preserve the established call signature, stage and authentication."""
import os
import random
import string


def _stage():
    return "SERV" if os.getenv("ENV_PATH", "").strip().lower() in ("serv", "serving") else "TRNN"


def call(messages: list[dict[str, str]], *, system: str = "", model: str = "",
         max_tokens: int = 1024, x_client_user: str = "") -> str:
    from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
    from langchain_openai import AzureChatOpenAI
    stage = _stage()
    endpoint = (os.getenv("LLM_BASE_URL_" + stage, "").strip() or os.getenv("LLM_BASE_URL", "").strip()
                or "https://cm-hea-genai-stg-apim.azure-api.net/" + ("serv" if stage == "SERV" else "trnn") + "/gemma-4")
    key = os.getenv("LLM_API_KEY_" + stage, "").strip() or os.getenv("LLM_API_KEY", "").strip()
    deployment = model.strip() or os.getenv("LLM_DEPLOYMENT_NAME", "").strip()
    if not key or not deployment or os.getenv("LLM_MODEL", "gemma-4-31b-it") != "gemma-4-31b-it":
        raise RuntimeError("LLM_CONFIG")
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
        raise RuntimeError("LLM_PROVIDER") from None
    if not isinstance(response.content, str):
        raise RuntimeError("LLM_OUTPUT")
    return response.content

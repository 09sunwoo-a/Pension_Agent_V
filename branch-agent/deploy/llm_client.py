"""Internal transport: preserve the established call signature, stage and authentication."""
import os
import random
import re
import string

MODEL_ID = "gemma-4-31b-it"
# Same defaults as the previously deployed llm_client.py: deployment alias and API version used when .env omits them.
DEFAULT_DEPLOYMENT_NAME = "gemma-4-31b-nvidia-fp4-h100"
DEFAULT_API_VERSION = "1"
_env_file = None


def _load_env_file():
    """Same deployment practice as the fixed agent: a .env copied into /custom by the internal Dockerfile.
    Loaded once at import, never overriding variables the platform already injected. No python-dotenv needed."""
    global _env_file
    here = os.path.dirname(os.path.abspath(__file__))
    candidates = [os.getenv("ENV_PATH", "").strip(), os.path.join(here, ".env"), "/custom/.env", os.path.join(os.getcwd(), ".env")]
    for path in candidates:
        if not path or not os.path.isfile(path):
            continue
        try:
            with open(path, encoding="utf-8") as handle:
                for line in handle:
                    line = line.strip()
                    if not line or line.startswith("#") or "=" not in line:
                        continue
                    key, value = line[7:].split("=", 1) if line.startswith("export ") else line.split("=", 1)
                    key, value = key.strip(), value.strip()
                    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
                        value = value[1:-1]
                    elif " #" in value:
                        value = value.split(" #", 1)[0].rstrip()
                    if re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", key) and key not in os.environ:
                        os.environ[key] = value
        except OSError:
            continue
        _env_file = path
        return path
    return None


_load_env_file()


def _stage():
    # Jenkins passes training|serving; tolerate a file path such as /custom/.env.serving as well.
    value = os.path.basename(os.getenv("ENV_PATH", "").strip().lower())
    return "SERV" if any(token in ("serv", "serving") for token in re.split(r"[^a-z]+", value)) else "TRNN"


def _model():
    return os.getenv("LLM_MODEL", "").strip() or MODEL_ID  # An empty LLM_MODEL= line means the default.


def _number(name, default, low, high, cast=float):
    try:
        return min(high, max(low, cast(os.getenv(name, "").strip() or default)))
    except (TypeError, ValueError):
        return default


def _timeout():
    # Per-call budget. Default 20s; .env LLM_TIMEOUT may raise it, capped below the 85s request budget.
    return _number("LLM_TIMEOUT", 20, 5, 80)


def _retries():
    return _number("LLM_MAX_RETRIES", 0, 0, 2, int)


def readiness():
    """Presence-only view of the LLM settings for /health. Never returns values, and never calls the model."""
    stage = _stage()
    try:
        import langchain_openai  # noqa: F401
        sdk = True
    except Exception:
        sdk = False
    return {"stage": stage, "env_file": bool(_env_file),
            "model_ok": _model() == MODEL_ID,
            "deployment_name_set": bool(os.getenv("LLM_DEPLOYMENT_NAME", "").strip()),
            "deployment_default_used": not os.getenv("LLM_DEPLOYMENT_NAME", "").strip(),
            "api_key_set": bool(os.getenv("LLM_API_KEY_" + stage, "").strip() or os.getenv("LLM_API_KEY", "").strip()),
            "base_url_set": bool(os.getenv("LLM_BASE_URL_" + stage, "").strip() or os.getenv("LLM_BASE_URL", "").strip()),
            "timeout_s": _timeout(), "max_retries": _retries(), "sdk_importable": sdk}


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
    deployment = model.strip() or os.getenv("LLM_DEPLOYMENT_NAME", "").strip() or DEFAULT_DEPLOYMENT_NAME
    missing = [name for name, ok in (("LLM_API_KEY_" + stage + "|LLM_API_KEY", key),
                                     ("LLM_MODEL=gemma-4-31b-it", _model() == MODEL_ID)) if not ok]
    if missing:
        raise _fail("LLM_CONFIG", "stage=" + stage + " missing: " + ", ".join(missing))
    suffix = "".join(random.choice(string.ascii_letters + string.digits) for _ in range(5))
    headers = {"kb-key": key, "x-client-user": (x_client_user or "system") + "-" + suffix}
    llm = AzureChatOpenAI(openai_api_version=os.getenv("LLM_API_VERSION", "").strip() or DEFAULT_API_VERSION,
        deployment_name=deployment, streaming=False, stream_usage=True, default_headers=headers,
        api_key=key, azure_endpoint=endpoint, model_kwargs={"extra_headers": headers},
        max_tokens=max_tokens, timeout=_timeout(), max_retries=_retries())
    translated = [SystemMessage(content=system)] if system else []
    types = {"system": SystemMessage, "assistant": AIMessage, "user": HumanMessage}
    translated.extend(types.get(m.get("role"), HumanMessage)(content=m.get("content", "")) for m in messages)
    import time
    started = time.monotonic()
    try:
        response = llm.invoke(translated)
    except Exception as error:
        # Diagnostic trail (no values): SDK class, underlying httpx cause, HTTP status, provider message head.
        # cause=ReadTimeout means the request reached the endpoint and no reply came in time (the model was hit);
        # cause=ConnectTimeout/ConnectError means the endpoint host was never reached.
        chain, cause = [], error
        while (cause.__cause__ or cause.__context__) is not None and len(chain) < 6:
            cause = cause.__cause__ or cause.__context__
            chain.append(cause)
        # Prefer the httpx layer (ReadTimeout / ConnectTimeout / ConnectError) over the raw socket error beneath it.
        picked = next((c for c in chain if type(c).__module__.startswith("httpx")), chain[-1] if chain else None)
        trail = type(error).__name__ + (" cause=" + type(picked).__name__ if picked is not None else "")
        status = getattr(error, "status_code", None) or getattr(getattr(error, "response", None), "status_code", None)
        if status:
            trail += " status=" + str(status)
        body = getattr(error, "body", None)
        text = body.get("error", body).get("message") if isinstance(body, dict) and isinstance(body.get("error", body), dict) else None
        if isinstance(text, str) and text.strip():
            trail += " msg=" + re.sub(r"[^A-Za-z0-9_ .:/-]", "", text)[:80].strip()
        elapsed = "elapsed=%.1fs" % (time.monotonic() - started)
        if "timeout" in type(error).__name__.lower():
            timeout = TimeoutError("LLM_TIMEOUT")
            timeout.detail = "stage=%s timeout=%gs %s retries=%d %s" % (stage, _timeout(), elapsed, _retries(), trail)
            raise timeout from None
        raise _fail("LLM_PROVIDER", "stage=" + stage + " " + elapsed + " " + trail) from None
    if not isinstance(response.content, str):
        raise RuntimeError("LLM_OUTPUT")
    return response.content


if __name__ == "__main__":
    # Same standalone connection test as the previous llm_client.py. Prints presence, never values.
    import json
    print("=" * 60)
    print("Gemma4 connection test (branch agent)")
    print("=" * 60)
    print(json.dumps(readiness(), ensure_ascii=False))
    print("DEPLOYMENT:", os.getenv("LLM_DEPLOYMENT_NAME", "").strip() or DEFAULT_DEPLOYMENT_NAME + " (default)")
    import time
    started = time.monotonic()
    try:
        answer = call([{"role": "user", "content": "안녕. 한 문장으로 인사해줘."}], x_client_user="llm-client-test", max_tokens=100)
        print("[SUCCESS] %.1fs" % (time.monotonic() - started), answer)
    except Exception as error:
        print("[FAIL] %.1fs" % (time.monotonic() - started), error, "|", getattr(error, "detail", type(error).__name__))
        raise SystemExit(1)

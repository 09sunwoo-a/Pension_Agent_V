"""Pod-side LLM connection probe. Prints only presence flags, host, stage, exception class and HTTP status.
Never prints key values, prompts or model output. Run inside the Agent container:
    python /custom/llm_probe.py            (after copying this file into /custom)
or paste the file into `python - <<'EOF' ... EOF` with the same environment variables."""
import os
import sys
import time
from urllib.parse import urlsplit

sys.path.insert(0, "/custom")
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "deploy"))


def flag(name):
    v = os.getenv(name)
    if v is None:
        return "unset"
    if not v.strip():
        return "EMPTY"
    note = []
    if v != v.strip():
        note.append("has-whitespace")
    if "\n" in v or "\r" in v:
        note.append("has-newline")
    if v.lower().startswith("bearer "):
        note.append("has-Bearer-prefix")
    return "set(len=%d%s)" % (len(v), ", " + ", ".join(note) if note else "")


def main():
    stage = "SERV" if os.getenv("ENV_PATH", "").strip().lower() in ("serv", "serving") else "TRNN"
    print("ENV_PATH        :", repr(os.getenv("ENV_PATH")), "-> stage", stage)
    print("LLM_MODEL       :", repr(os.getenv("LLM_MODEL", "gemma-4-31b-it")), "(must be gemma-4-31b-it)")
    for name in ("LLM_DEPLOYMENT_NAME", "LLM_API_KEY_" + stage, "LLM_API_KEY", "LLM_BASE_URL_" + stage, "LLM_BASE_URL", "LLM_API_VERSION"):
        print("%-16s: %s" % (name, flag(name)))
    endpoint = (os.getenv("LLM_BASE_URL_" + stage, "").strip() or os.getenv("LLM_BASE_URL", "").strip()
                or "https://cm-hea-genai-stg-apim.azure-api.net/" + ("serv" if stage == "SERV" else "trnn") + "/gemma-4")
    u = urlsplit(endpoint)
    print("endpoint in use :", u.scheme + "://" + u.netloc + u.path, "(default)" if not (os.getenv("LLM_BASE_URL_" + stage, "").strip() or os.getenv("LLM_BASE_URL", "").strip()) else "")
    try:
        import llm_client
    except Exception as e:
        print("import llm_client: FAIL", type(e).__name__)
        return 2
    try:
        import langchain_openai, openai  # noqa: F401
        print("sdk             : langchain-openai + openai", openai.__version__)
    except Exception as e:
        print("sdk             : IMPORT FAIL", type(e).__name__, "-> INTERNAL. requirements/Nexus 설치 확인")
        return 2
    # 1) Same path the Agent uses. Only the masked code comes back.
    t = time.monotonic()
    try:
        out = llm_client.call([{"role": "user", "content": "ping"}], system="답은 'pong' 한 단어.", max_tokens=8, x_client_user="probe")
        print("llm_client.call : OK (%.1fs, %d chars)" % (time.monotonic() - t, len(out or "")))
        return 0
    except Exception as e:
        print("llm_client.call : %s %s (%.1fs)" % (type(e).__name__, e, time.monotonic() - t))
    # 2) Direct SDK call to see the real class and HTTP status (still no values printed).
    key = os.getenv("LLM_API_KEY_" + stage, "").strip() or os.getenv("LLM_API_KEY", "").strip()
    deployment = os.getenv("LLM_DEPLOYMENT_NAME", "").strip()
    if not key or not deployment:
        print("verdict         : LLM_CONFIG -> 위의 EMPTY/unset 항목을 Portal Secret/환경변수에 넣으세요")
        return 1
    from langchain_openai import AzureChatOpenAI
    from langchain_core.messages import HumanMessage
    headers = {"kb-key": key, "x-client-user": "probe-00000"}
    llm = AzureChatOpenAI(openai_api_version=os.getenv("LLM_API_VERSION", "1"), deployment_name=deployment, streaming=False,
                          default_headers=headers, api_key=key, azure_endpoint=endpoint, model_kwargs={"extra_headers": headers},
                          max_tokens=8, timeout=20, max_retries=0)
    try:
        llm.invoke([HumanMessage(content="ping")])
        print("direct SDK      : OK")
        return 0
    except Exception as e:
        status = getattr(e, "status_code", None) or getattr(getattr(e, "response", None), "status_code", None)
        print("direct SDK      : %s status=%s" % (type(e).__name__, status))
        hint = {401: "키(kb-key/api-key) 불일치 또는 만료 -> LLM_API_KEY_" + stage + " 값 확인. FabriX openapiToken 과 다른 키",
                403: "키는 맞지만 이 deployment/경로 권한 없음 -> APIM 구독·stage 확인",
                404: "deployment 별칭 또는 base URL 경로 오류 -> LLM_DEPLOYMENT_NAME / LLM_BASE_URL_" + stage,
                429: "요청 한도 초과 -> 잠시 후 재시도", 500: "endpoint 내부 오류", 502: "endpoint 게이트웨이 오류", 503: "endpoint 사용 불가"}
        print("verdict         :", hint.get(status, "연결/TLS/프록시 문제 (status 없음) -> base URL 호스트와 Pod 아웃바운드 확인" if status is None else "HTTP " + str(status)))
        return 1


if __name__ == "__main__":
    sys.exit(main())

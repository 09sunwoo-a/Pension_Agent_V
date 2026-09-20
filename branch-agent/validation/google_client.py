"""Google AI Studio adapter. Standard library only; never included in the internal image."""
import json
import os
import socket
import urllib.error
import urllib.request

MODEL = "gemma-4-31b-it"
ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent"


class GeneratedText(str):
    """Still the same string interface, with optional safe validation-only token counts."""
    def __new__(cls, text, usage):
        obj = super().__new__(cls, text)
        obj.usage = usage
        return obj


class GoogleError(RuntimeError):
    def __init__(self, code, retry_after=None, quota_kind=None):
        self.code = code
        self.retry_after = retry_after
        self.quota_kind = quota_kind
        super().__init__(code)


def call(messages: list[dict[str, str]], *, system: str = "", model: str = "",
         max_tokens: int = 1024, x_client_user: str = "") -> str:
    key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not key:
        raise GoogleError("GOOGLE_KEY_MISSING")
    if model and model != MODEL:
        raise GoogleError("GOOGLE_MODEL")
    instructions = [system] if system else []
    contents = []
    for message in messages:
        if message["role"] == "system":
            instructions.append(message["content"])
        else:
            role = "model" if message["role"] == "assistant" else "user"
            part = {"text": message["content"]}
            if contents and contents[-1]["role"] == role:
                contents[-1]["parts"].append(part)
            else:
                contents.append({"role": role, "parts": [part]})
    payload = {"contents": contents, "generationConfig": {"temperature": 0, "maxOutputTokens": max_tokens,
               "thinkingConfig": {"thinkingLevel": "minimal"}}}
    if instructions:
        payload["systemInstruction"] = {"parts": [{"text": "\n\n".join(instructions)}]}
    request = urllib.request.Request(ENDPOINT, data=json.dumps(payload, ensure_ascii=False).encode(),
        headers={"Content-Type": "application/json", "x-goog-api-key": key}, method="POST")
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            raw = response.read(1024 * 1024 + 1)
        if len(raw) > 1024 * 1024:
            raise GoogleError("GOOGLE_OUTPUT_SIZE")
        data = json.loads(raw)
    except urllib.error.HTTPError as error:
        # Never print error body/URL/request headers; they may contain identifiers.
        retry_after, quota_kind = None, None
        if error.code == 429:
            try:
                details = json.loads(error.read(65536)).get("error", {}).get("details", [])
                for detail in details:
                    if detail.get("@type", "").endswith("RetryInfo"):
                        retry_after = min(60, max(1, float(detail["retryDelay"].rstrip("s"))))
                    if detail.get("@type", "").endswith("QuotaFailure"):
                        quota_ids = " ".join(v.get("quotaId", "") for v in detail.get("violations", []))
                        quota_kind = "daily" if "PerDay" in quota_ids else "token_rate" if "Token" in quota_ids and "PerMinute" in quota_ids else "request_rate" if "PerMinute" in quota_ids else "unknown"
            except (ValueError, TypeError, KeyError):
                pass
        raise GoogleError("GOOGLE_HTTP_" + str(error.code), retry_after, quota_kind) from None
    except (TimeoutError, socket.timeout):
        raise TimeoutError("LLM_TIMEOUT") from None
    except urllib.error.URLError:
        raise GoogleError("GOOGLE_NETWORK") from None
    candidates = data.get("candidates", [])
    if len(candidates) != 1 or candidates[0].get("finishReason") != "STOP":
        raise GoogleError("GOOGLE_OUTPUT")
    text = "".join(p.get("text", "") for p in candidates[0].get("content", {}).get("parts", []) if not p.get("thought"))
    if not text.strip():
        raise GoogleError("GOOGLE_EMPTY")
    usage = data.get("usageMetadata", {})
    return GeneratedText(text, {k: usage.get(k, 0) for k in ("promptTokenCount", "candidatesTokenCount", "totalTokenCount")})

"""Local same-origin FabriX bridge and Starroot harness; all business logic lives in deploy."""
import argparse
import json
from pathlib import Path
import sys

DEPLOY = Path(__file__).resolve().parents[1] / "deploy"
ROOT = DEPLOY.parents[1]
sys.path.insert(0, str(DEPLOY))
from fastapi import Request
from fastapi.responses import HTMLResponse, Response
from main import create_app
from google_client import call


def local_app(llm_call=call):
    stats = {"provider": "google-live" if llm_call is call else "stub", "model": "gemma-4-31b-it", "calls": 0, "errors": {}}
    def observed(*args, **kwargs):
        stats["calls"] += 1
        try:
            return llm_call(*args, **kwargs)
        except Exception as error:
            code = getattr(error, "code", "LLM_TIMEOUT" if isinstance(error, TimeoutError) else "PROVIDER_ERROR")
            stats["errors"][code] = stats["errors"].get(code, 0) + 1
            raise
    app = create_app(llm_call=observed)

    @app.get("/validation/status")
    async def status():
        return {**stats, "stages": dict(app.state.observations)}

    @app.post("/openapi/agent-chat/v1/agent-messages")
    async def bridge(request: Request):
        try:
            outer = await app.state.read_body(request)
            if (outer.get("agentId") != "branch-local" or outer.get("isStream") is not True
                    or not isinstance(outer.get("contents"), list) or len(outer["contents"]) != 1
                    or not isinstance(outer["contents"][0], str)):
                raise ValueError("OUTER")
            inner = {"input_value": outer["contents"][0], "message_hists": None}
        except Exception:
            inner = {}
        def wrap(event):
            return "data: " + json.dumps({"event_status": "CHUNK", "status": "SUCCESS", "result_code": "FR-200",
                "content": json.dumps(event, ensure_ascii=False), "references": [], "recommend_queries": [], "actions": []}, ensure_ascii=False) + "\n\n"
        return app.state.stream(inner, wrap)

    @app.get("/")
    async def index():
        html = (ROOT / "frontend/briefing-fabrix/mnPensionAgentDemo.html").read_text()
        script = '''<script>window.PG_1288272.onParam({localPreview:true,fabrix:{xClientUser:'LOCAL_VALIDATION',branch:{endpointUrl:location.origin,agentId:'branch-local',openapiToken:'LOCAL_ONLY',generativeAiClient:'LOCAL_ONLY'}}});</script>'''
        html = html.replace("</head>", "<style>html{font-size:10px}body{margin:0}</style></head>").replace("</body>", script + "</body>")
        return HTMLResponse(html, headers={"Cache-Control": "no-store"})

    @app.get("/mnbank/app/html/bfe/asstmgt/asst/{name}")
    async def asset(name: str):
        types = {"pensionAgentDemo.js": "text/javascript", "pensionAgentDemo.css": "text/css"}
        if name not in types:
            return Response(status_code=404)
        return Response((ROOT / "frontend/briefing-fabrix" / name).read_bytes(), media_type=types[name], headers={"Cache-Control": "no-store"})
    return app


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8766)
    args = parser.parse_args()
    if not __import__("os").environ.get("GEMINI_API_KEY", "").strip():
        raise SystemExit("GEMINI_API_KEY is required in the server environment.")
    import uvicorn
    uvicorn.run(local_app(), host="127.0.0.1", port=args.port, access_log=False, log_level="warning")

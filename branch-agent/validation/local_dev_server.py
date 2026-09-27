"""Local same-origin dev server: front + fixed briefing Agent (agent/) + branch Agent (deploy/).

One FabriX-style bridge routes by agentId: 1 -> fixed S1-S5 briefing, 'branch-local' -> branch
assistant with the real Google model. Business logic stays in agent/ and deploy/; never shipped.
"""
import argparse
import importlib.util
import json
import os
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
DEPLOY = HERE.parents[0] / "deploy"
ROOT = DEPLOY.parents[1]
AGENT = ROOT / "agent"
sys.path.insert(0, str(DEPLOY))
sys.path.append(str(AGENT))  # after deploy: "main" must resolve to deploy/main.py, "briefing" to agent/
from fastapi import Request
from fastapi.responses import HTMLResponse, JSONResponse, Response, StreamingResponse
from main import create_app  # branch deploy entry point
from google_client import call

BRIEFING_AGENT_ID = 1
BRANCH_AGENT_ID = "branch-local"


def load_fixed_agent():
    spec = importlib.util.spec_from_file_location("fixed_briefing_agent", AGENT / "main.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def gateway_frame(content):
    return "data: " + json.dumps({"event_status": "CHUNK", "status": "SUCCESS", "result_code": "FR-200",
        "content": content, "references": [], "recommend_queries": [], "actions": []}, ensure_ascii=False) + "\n\n"


def dev_app(llm_call=call):
    fixed = load_fixed_agent()
    stats = {"provider": "google-live" if llm_call is call else "stub", "model": "gemma-4-31b-it", "calls": 0, "errors": {}}

    def observed(*args, **kwargs):
        stats["calls"] += 1
        try:
            return llm_call(*args, **kwargs)
        except Exception as error:
            code = getattr(error, "code", "LLM_TIMEOUT" if isinstance(error, TimeoutError) else "PROVIDER_ERROR")
            stats["errors"][code] = stats["errors"].get(code, 0) + 1
            raise
    observed.describe = getattr(llm_call, "describe", None)  # model/deployment alias for execution traces
    app = create_app(llm_call=observed)

    @app.get("/validation/status")
    async def status():
        return {**stats, "stages": dict(app.state.observations)}

    @app.get("/health/briefing")
    async def briefing_health():
        return fixed.health()

    @app.post("/openapi/agent-chat/v1/agent-messages")
    async def bridge(request: Request):
        try:
            outer = await app.state.read_body(request)
            valid = (outer.get("isStream") is True and isinstance(outer.get("contents"), list)
                     and len(outer["contents"]) == 1 and isinstance(outer["contents"][0], str))
            agent_id = outer.get("agentId")
        except Exception:
            outer, valid, agent_id = {}, False, None
        if agent_id == BRIEFING_AGENT_ID:
            fixed_response = fixed.chat(fixed.FabrixRequest(input_value=outer["contents"][0] if valid else ""))
            async def generate():
                async for frame in fixed_response.body_iterator:
                    # agent-level "data: {event:CHUNK,...}" -> gateway envelope, like the real Connector
                    yield gateway_frame(frame.split(":", 1)[1].strip())
            return StreamingResponse(generate(), media_type="text/event-stream",
                                     headers={"Cache-Control": "no-store", "X-Accel-Buffering": "no"})
        if agent_id == BRANCH_AGENT_ID:
            inner = {"input_value": outer["contents"][0], "message_hists": None} if valid else {}
            return app.state.stream(inner, lambda event: gateway_frame(json.dumps(event, ensure_ascii=False)))
        return JSONResponse(status_code=404, content={"detail": "Unknown local agentId."})

    @app.get("/")
    async def index():
        html = (ROOT / "frontend/briefing-fabrix/mnPensionAgentDemo.html").read_text()
        config = {"endpointUrl": "__ORIGIN__", "agentId": BRIEFING_AGENT_ID, "openapiToken": "LOCAL_ONLY",
                  "generativeAiClient": "LOCAL_ONLY", "xClientUser": "LOCAL_VALIDATION",
                  "branch": {"endpointUrl": "__ORIGIN__", "agentId": BRANCH_AGENT_ID,
                             "openapiToken": "LOCAL_ONLY", "generativeAiClient": "LOCAL_ONLY"}}
        script = ("<script>window.PG_1288272.onParam({localPreview:true,fabrix:"
                  + json.dumps(config).replace('"__ORIGIN__"', "location.origin") + "});</script>")
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
    if not os.environ.get("GEMINI_API_KEY", "").strip():
        raise SystemExit("GEMINI_API_KEY is required in the server environment.")
    import uvicorn
    uvicorn.run(dev_app(), host="127.0.0.1", port=args.port, access_log=False, log_level="warning")

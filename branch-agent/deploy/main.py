"""Internal flat /custom HTTP entry point. Validation injects only its LLM transport."""
import asyncio
import json
import threading
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, StreamingResponse

from branch_data import Dataset
from branch_language import MODEL
from branch_models import sse_frame
from branch_service import Service, fault_event


def create_app(llm_call=None, dataset=None, timeout=85, concurrency=4):
    tasks = set()
    slots = threading.BoundedSemaphore(concurrency)
    @asynccontextmanager
    async def lifespan(app):
        yield
        if tasks:
            await asyncio.wait(tuple(tasks), timeout=65)
    app = FastAPI(lifespan=lifespan, docs_url=None, redoc_url=None, openapi_url=None)
    try:
        service = Service(dataset or Dataset.load(), llm_call)
    except Exception:
        service = None
    app.state.service = service
    app.state.observations = {"interpret_ok": 0, "compose_generated": 0, "compose_template": 0}

    def observe(stage, code):
        key = stage + "_" + code
        app.state.observations[key] = app.state.observations.get(key, 0) + 1

    @app.get("/health")
    async def health():
        m = service.data.manifest if service else {}
        return JSONResponse({"status": "ok" if service else "unavailable", "mode": "branch_assistant",
                             "data_loaded": service is not None, "data_version": m.get("data_version"),
                             "rule_version": m.get("rule_version"), "model": MODEL}, status_code=200 if service else 503)

    async def body(request):
        parts, length = [], 0
        async for chunk in request.stream():
            length += len(chunk)
            if length > 1024 * 1024:
                raise ValueError("INVALID_REQUEST")
            parts.append(chunk)
        parsed = json.loads(b"".join(parts))
        if not isinstance(parsed, dict):
            raise ValueError("INVALID_REQUEST")
        return parsed

    async def events(outer):
        if service is None:
            yield fault_event(outer, "DATA_VERSION")
            return
        if not slots.acquire(blocking=False):
            yield fault_event(outer, "LLM_TIMEOUT")
            return
        queue = asyncio.Queue(maxsize=64)
        loop, stop = asyncio.get_running_loop(), threading.Event()
        def put(event):
            if not stop.is_set():
                if queue.full():
                    stop.set()
                else:
                    queue.put_nowait(event)
        def emit(event):
            if stop.is_set():
                raise RuntimeError("CANCELLED")
            loop.call_soon_threadsafe(put, event)
        def worker():
            try:
                final = service.handle(outer, emit, observe)
                if not stop.is_set():
                    emit(final)
            finally:
                slots.release()  # Held until the SDK worker actually ends, even after HTTP abort.
        task = asyncio.create_task(asyncio.to_thread(worker))
        tasks.add(task)
        task.add_done_callback(tasks.discard)
        deadline = time.monotonic() + timeout
        try:
            while True:
                event = await asyncio.wait_for(queue.get(), max(0.001, deadline - time.monotonic()))
                yield event
                if event["event"] in ("answer", "error"):
                    break
        except asyncio.TimeoutError:
            yield fault_event(outer, "LLM_TIMEOUT")
        finally:
            stop.set()

    def stream(outer, wrap=sse_frame):
        async def generate():
            async for event in events(outer):
                yield wrap(event)
        return StreamingResponse(generate(), media_type="text/event-stream", headers={"Cache-Control": "no-store", "X-Accel-Buffering": "no"})

    @app.post("/chat")
    async def chat(request: Request):
        try:
            outer = await body(request)
        except Exception:
            outer = {}
        return stream(outer)

    app.state.read_body = body
    app.state.stream = stream
    return app


app = create_app()

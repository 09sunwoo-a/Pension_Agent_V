"""Real loopback HTTP/SSE and flat deploy smoke tests; no mocked ASGI client."""
import contextlib
import http.client
import json
import os
from pathlib import Path
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import urllib.request

from check_service import Dataset, request


def free_port():
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


@contextlib.contextmanager
def server(directory, entry="probe:app"):
    port = free_port()
    env = dict(os.environ, PYTHONDONTWRITEBYTECODE="1")
    env.pop("PYTHONPATH", None)
    process = subprocess.Popen([sys.executable, "-m", "uvicorn", entry, "--host", "127.0.0.1", "--port", str(port), "--no-access-log", "--log-level", "error"],
                               cwd=directory, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(100):
            if process.poll() is not None:
                raise AssertionError("SERVER_EXIT")
            try:
                with urllib.request.urlopen(f"http://127.0.0.1:{port}/health", timeout=.2) as result:
                    assert json.load(result)["mode"] == "branch_assistant"
                break
            except OSError:
                time.sleep(.05)
        else:
            raise AssertionError("SERVER_START")
        yield port
    finally:
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait()


def post(port, outer, path="/chat"):
    req = urllib.request.Request(f"http://127.0.0.1:{port}" + path, data=json.dumps(outer).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=3) as response:
        assert response.headers.get_content_type() == "text/event-stream"
        body = response.read().decode()
    assert body.endswith("\n\n")
    envelopes = [json.loads(frame[6:]) for frame in body.split("\n\n") if frame]
    events = [json.loads(e["content"]) for e in envelopes]
    assert sum(e["event"] in ("answer", "error") for e in events) == 1
    assert events[-1]["event"] in ("answer", "error")
    return events


def main():
    data = Dataset.load()
    deploy = Path(__file__).resolve().parents[1] / "deploy"
    with tempfile.TemporaryDirectory(prefix="branch-flat-") as directory:
        root = Path(directory)
        # Exactly the files described by Docker COPY. No validation folder or source-repo imports.
        copies = []
        for line in (deploy / "Dockerfile").read_text().splitlines():
            if line.startswith("COPY ./"):
                filename = line.split()[1][2:]
                copies.append(filename)
                shutil.copyfile(deploy / filename, root / filename)
        assert "validation" not in " ".join(copies)
        with server(root, "main:app") as port:
            req = request(data, "추천", action={"type": "recommend"})
            events = post(port, {"input_value": json.dumps(req)})
            assert events[-1]["data"]["result"]["row_ids"] == ["B04-23", "B06-13", "B01-03"]
            assert post(port, {"input_value": 123})[-1]["event"] == "error"
            stale = dict(req, data_version="0" * 64)
            assert post(port, {"input_value": json.dumps(stale)})[-1]["data"]["code"] == "DATA_VERSION"
        (root / "probe.py").write_text('''import json,time
from main import create_app
def call(messages, **kwargs):
    message=json.loads(messages[0]['content']).get('message','')
    if message=='SLOW':time.sleep(.7)
    if message=='BAD':return 'not-json'
    return '{"intent":"recommend"}'
app=create_app(llm_call=call,timeout=.2,concurrency=1)
''')
        with server(root) as port:
            def outer(text):
                return {"input_value": json.dumps(request(data, text))}
            assert post(port, outer("추천"))[-1]["event"] == "answer"
            assert post(port, outer("BAD"))[-1]["data"]["code"] == "LLM_OUTPUT"
            assert post(port, outer("SLOW"))[-1]["data"]["code"] == "LLM_TIMEOUT"
            assert post(port, outer("추천"))[-1]["data"]["code"] == "LLM_TIMEOUT", "Timed-out worker must retain its slot"
            time.sleep(.75)
            assert post(port, outer("추천"))[-1]["event"] == "answer"
            connection = http.client.HTTPConnection("127.0.0.1", port, timeout=3)
            connection.request("POST", "/chat", json.dumps(outer("SLOW")), {"Content-Type": "application/json"})
            response = connection.getresponse()
            assert b'CHUNK' in response.readline()
            response.close()
            connection.close()
            assert post(port, outer("추천"))[-1]["data"]["code"] == "LLM_TIMEOUT"
            time.sleep(.8)
            assert post(port, outer("추천"))[-1]["data"]["revision"] == 1
    # Same-origin bridge uses the same injected service; only the envelope changes.
    validation = Path(__file__).resolve().parent
    with tempfile.TemporaryDirectory(prefix="branch-bridge-") as directory:
        Path(directory, "probe.py").write_text("import sys\nsys.path.insert(0," + repr(str(validation)) + ")\nfrom local_server import local_app\napp=local_app(llm_call=lambda *a,**k:'{\"intent\":\"recommend\"}')\n")
        with server(directory) as port:
            req = request(data, "추천")
            result = post(port, {"agentId": "branch-local", "contents": [json.dumps(req)], "isStream": True, "llmConfig": {}}, "/openapi/agent-chat/v1/agent-messages")
            assert result[-1]["data"]["result"]["count"] == 3
            with urllib.request.urlopen(f"http://127.0.0.1:{port}/") as response:
                html = response.read().decode()
            assert 'location.origin' in html and 'onParam' in html and 'GEMINI_API_KEY' not in html
    print("PASS: real HTTP /health, /chat SSE, strict errors, timeout, abort/late worker/slot limit, retry, flat Docker COPY boot without validation, localhost FabriX bridge/harness")


if __name__ == "__main__":
    main()

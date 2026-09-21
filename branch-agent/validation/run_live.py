"""Explicit Google live run. Logs only scenario IDs, safe codes, durations and fallback counts."""
import argparse
import json
from pathlib import Path
import time

from check_service import run_cases, Dataset, Service, Stub, request, HERE
from google_client import call, GoogleError, MODEL


class Live:
    def __init__(self, pace=12):
        self.blocked = False
        self.calls = 0
        self.errors = []
        self.pace = pace
        self.previous = 0
        self.usage = []

    def __call__(self, *args, **kwargs):
        time.sleep(max(0, self.pace - (time.monotonic() - self.previous)))
        self.previous = time.monotonic()
        self.calls += 1
        try:
            result = call(*args, **kwargs)
            self.usage.append(getattr(result, "usage", {}))
            return result
        except GoogleError as error:
            self.errors.append(error.code)
            print(json.dumps({"provider_code": error.code, "quota_kind": error.quota_kind, "retry_after_seconds": error.retry_after}), flush=True)
            if error.code in ("GOOGLE_KEY_MISSING", "GOOGLE_NETWORK", "GOOGLE_HTTP_401", "GOOGLE_HTTP_403", "GOOGLE_HTTP_404", "GOOGLE_HTTP_429"):
                self.blocked = error.code
            raise


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--repeats", type=int, choices=(1, 3), default=3)
    parser.add_argument("--pace", type=float, default=12, help="Minimum seconds between model calls; avoid free-tier request/token bursts")
    parser.add_argument("--diagnose", help="Single interpretation schema diagnostic; prerequisite State is prepared with the real service and stub")
    args = parser.parse_args()
    live = Live(max(0, args.pace))
    if args.diagnose:
        from branch_language import decode_plan
        import copy
        cases = {c["id"]: c for c in json.loads((HERE / "scenarios.json").read_text())["cases"]}
        data, stub = Dataset.load(), Stub()
        def prepare(id):
            if not id:
                return None
            case = cases[id]
            state = prepare(case["given"])
            for step in case["steps"]:
                stub.plan = step["plan"]
                ev = Service(data, stub).handle({"input_value": json.dumps(request(data, step["message"], state))})
                state = ev["data"]["next_state"]
            return state
        case = cases[args.diagnose]
        state = prepare(case["given"])
        def diagnose(*a, **kw):
            raw = live(*a, **kw)
            try:
                candidate = decode_plan(raw, data.manifest)
                summary = {k: candidate[k] for k in ("intent", "scope", "edit", "detail")}
                summary["operations"] = [{k: o[k] for k in ("type",) if k in o} for o in candidate["operations"]]
                print(json.dumps({"diagnostic": summary}), flush=True)
            except Exception as error:
                if hasattr(error, "errors"):
                    details = [{"loc": e["loc"], "type": e["type"]} for e in error.errors(include_input=False, include_url=False)]
                else:
                    try:
                        obj = json.loads(raw.strip().removeprefix('```json').removesuffix('```'))
                        details = {"intent": obj.get("intent") if obj.get("intent") in ("brief", "aggregate", "search") else "other", "operation_count": len(obj.get("operations") or [])}
                    except Exception:
                        details = "JSON_PARSE"
                print(json.dumps({"diagnostic_error": type(error).__name__, "schema": details}), flush=True)
            return raw
        ev = Service(data, diagnose).handle({"input_value": json.dumps(request(data, case["steps"][-1]["message"], state))})
        print(json.dumps({"diagnostic_case": args.diagnose, "event": ev["event"], "code": ev["data"].get("code")}))
        print(json.dumps({"usage": live.usage}))
        raise SystemExit(0 if ev["event"] == "answer" else 1)
    result = run_cases(live, args.repeats, variations=True)
    result.update(mode="google-live", provider="Google AI Studio", model=MODEL, temperature=0,
                  thinking="minimal", calls=live.calls, provider_errors=live.errors, usage=live.usage, timestamp=int(time.time()))
    output = Path(__file__).with_name(".local-results")
    output.mkdir(exist_ok=True)
    (output / "google-live.json").write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    (output / ("google-live-" + str(result["timestamp"]) + ".json")).write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    passed = sum(x["status"] == "PASS" for x in result["results"])
    print(json.dumps({"mode": "google-live", "passed": passed, "total": 36 * args.repeats, "calls": live.calls, "blocked": live.blocked}))
    raise SystemExit(0 if passed == 36 * args.repeats else 1)

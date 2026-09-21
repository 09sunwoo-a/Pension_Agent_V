"""Batch validation bridge for JS/Python parity tests; stdin contains dummy fixtures only."""
import json
import ast
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "deploy"))
from branch_models import ContractError, parse_request, shape, sse_frame, validate_event, validate_request


def run(batch):
    deploy = Path(__file__).resolve().parents[1] / "deploy"
    for source in deploy.glob("*.py"):
        ast.parse(source.read_text(), filename=source.name, feature_version=(3, 10))
    results = []
    for case in batch["cases"]:
        manifest = case.get("manifest", batch["manifest"])
        try:
            if case["kind"] == "request":
                validate_request(case["value"], manifest)
            elif case["kind"] == "outer":
                parse_request(case["value"], manifest)
            elif case["kind"] == "shape":
                shape(case["schema_kind"], case["value"])
            else:
                validate_event(case["value"], case["request"], manifest, case.get("records_by_id"))
            results.append({"id": case["id"], "ok": True})
        except ContractError as error:
            results.append({"id": case["id"], "ok": False, "code": error.code})
    frames = [sse_frame(x) for x in batch.get("frame_events", [])]
    return {"results": results, "frames": frames, "python_310_syntax": True}


if __name__ == "__main__":
    print(json.dumps(run(json.load(sys.stdin)), ensure_ascii=True, allow_nan=False))

"""Export/check the Pydantic wire schema; no LLM or customer data needed."""
import argparse
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "branch-agent/deploy"))
from branch_models import ContractSchemas

TARGET = ROOT / "integration/contracts/branch-agent.schema.json"


def exported():
    schema = ContractSchemas.model_json_schema()
    schema["$schema"] = "https://json-schema.org/draft/2020-12/schema"
    return json.dumps(schema, ensure_ascii=False, indent=2, sort_keys=True) + "\n"


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    content = exported()
    if args.check:
        if not TARGET.exists() or TARGET.read_text() != content:
            sys.exit("FAIL: branch schema is stale; run export_schema.py")
        print("PASS: exported branch schema matches Pydantic models")
    else:
        TARGET.write_text(content)
        print("Exported integration/contracts/branch-agent.schema.json")

"""Load task 03's generated data. No exports, substitute data or hash reimplementation."""
import copy
import json
import math
import re
from pathlib import Path

from branch_models import manifest_check, valid_day, MAX_SAFE


class Dataset:
    def __init__(self, data):
        data = copy.deepcopy(data)
        self.manifest, self.records = data["manifest"], data["records"]
        m = self.manifest
        manifest_check(m)
        ids = [r["row_id"] for r in self.records]
        if (ids != m["row_ids"] or len(set(ids)) != len(ids)
                or len(ids) != m["record_count"] or not re.fullmatch(r"[0-9a-f]{64}", m["data_version"])
                or m["projection_version"] != "current-data.v1"):
            raise ValueError("DATA")
        for i, r in enumerate(self.records):
            if (r["original_order"] != i or r["briefingMeta"]["caseId"] != r["row_id"]
                    or r["customer_id"] != r["customer"]["customerId"]):
                raise ValueError("DATA")
            if r["as_of_date"] is not None and not valid_day(r["as_of_date"]):
                raise ValueError("DATA")
            values = {"age": r["customer"].get("age"), "irp_amount": r["irpAccount"].get("valuationAmountKrw"),
                      "cash_amount": r["cash_amount"], "cash_pct": r["cash_pct"], "return_pct": r["irpAccount"].get("oneYearReturnPct")}
            for field, value in values.items():
                if value is None:
                    continue
                if type(value) not in (int, float) or not math.isfinite(value) or abs(value) > MAX_SAFE:
                    raise ValueError("DATA")
                if field in ("age", "irp_amount", "cash_amount") and (value < 0 or value != int(value)):
                    raise ValueError("DATA")
                if (field == "age" and value > 150) or (field == "cash_pct" and not 0 <= value <= 100):
                    raise ValueError("DATA")
            if any(s["label"] not in m["segment_labels"] for s in r["signals"]):
                raise ValueError("DATA")
            if r["source_kind"] == "display-only" and any(r[k] is not None for k in
                    ("source_case_id", "as_of_date", "cash_amount", "cash_pct")):
                raise ValueError("DATA")
        if sum(r["source_kind"] == "structured" for r in self.records) != m["structured_count"]:
            raise ValueError("DATA")
        if sum(r["source_kind"] == "display-only" for r in self.records) != m["display_only_count"]:
            raise ValueError("DATA")
        self.by_id = {r["row_id"]: r for r in self.records}

    @classmethod
    def load(cls, path=None):
        try:
            return cls(json.loads(Path(path or Path(__file__).with_name("branch_data.json")).read_text(encoding="utf-8")))
        except Exception:
            raise ValueError("DATA") from None

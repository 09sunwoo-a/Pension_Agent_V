"""Data parity checks only; no HTTP service, LLM, or second hashing algorithm."""
import copy
import datetime
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "deploy"))
from branch_models import ContractError, validate_request


def cash(record):
    asset = next((a for a in record["irpAccount"]["assetAllocation"]
                  if a["assetType"] == "현금성자산"), None)
    return asset["amountKrw"] if asset else None


def check(data):
    manifest, records = data["manifest"], data["records"]
    ids = [r["row_id"] for r in records]
    # 57 rows = 42 case customers + 15 legacy demo rows (ksy/lsm/pjh replaced by C01-10/12/11).
    assert ids == manifest["row_ids"] and len(ids) == len(set(ids)) == 57
    assert "DEMO-01" not in ids and "ksy" not in ids
    assert sum(r["source_case_id"] == "DEMO-01" for r in records) == 0
    assert [r["original_order"] for r in records] == list(range(57))
    assert sum(r["source_kind"] == "structured" for r in records) == 42
    assert sum(r["source_kind"] == "display-only" for r in records) == 15
    for r in records:
        origin = r["searchSource"]
        assert r["row_id"] == r["briefingMeta"]["caseId"]
        assert r["customer_id"] == r["customer"]["customerId"]
        assert r["source_case_id"] == origin["sourceCaseId"]
        assert r["as_of_date"] == origin["asOfDate"]
        assert r["display_overrides"] == origin["displayOverrides"]
        assert r["cash_amount"] == cash(r)
        if r["source_kind"] == "display-only":
            assert r["source_case_id"] is None and r["as_of_date"] is None
            assert r["cash_amount"] is None and r["cash_pct"] is None
            assert r["holdings"] is None and r["irpAccount"]["assetAllocation"] == []
    assert sum(r["irpAccount"]["valuationAmountKrw"] for r in records) == 7855840000
    amounts = [cash(r) for r in records]
    assert sum(x for x in amounts if x is not None) == 935230000
    assert sum(x is not None for x in amounts) == 42
    assert sum(r["irpAccount"]["valuationAmountKrw"] >= 70000000 for r in records) == 41
    assert sum(any(s["label"] == "ISA 만기" or s["label"].startswith("ISA 만기 D-")
                   for s in r["signals"]) for r in records) == 3
    as_of = datetime.date.fromisoformat(manifest["as_of_date"])
    end = (as_of + datetime.timedelta(days=30)).isoformat()
    isa = [r for r in records if any(a["type"] == "ISA" and a["maturityDate"] is not None
           and manifest["as_of_date"] <= a["maturityDate"] <= end
           for a in r["searchSupplement"].get("externalAccounts", []))]
    assert [r["row_id"] for r in isa] == ["C01-10", "B01-03", "B01-22"]
    account = next(a for a in next(r for r in isa if r["row_id"] == "B01-03")["searchSupplement"]["externalAccounts"] if a["type"] == "ISA")
    assert account["valuationAmountKrw"] is None and account["conversionIntent"] is None
    transfer = next(r for r in records if r["row_id"] == "B04-23")["searchSupplement"]["management"]["transfer"]
    assert transfer["applied"] is True and transfer["status"] == "의사확인대기"
    retirement = next(r for r in records if r["row_id"] == "B06-13")
    management = retirement["searchSupplement"]["management"]
    assert management["instruction"] is False
    assert retirement["cash_pct"] == 100 and management["retirementAmount"] == cash(retirement) == 164700000
    assert any(d["date"] == "2026-09-04" and d["amount"] == cash(retirement)
               for d in management["retirementDeposits"])


def main():
    payload = json.load(sys.stdin)
    data = (json.loads(pathlib.Path(payload["data_file"]).read_text(encoding="utf-8"))
            if payload.get("data_file") else payload["data"])
    check(data)
    for item in payload["cash_cases"]:
        assert cash(item["record"]) == item["expected"]
    manifest, request = data["manifest"], payload["request"]
    validate_request(request, manifest)
    for label in manifest["segment_labels"]:
        value = copy.deepcopy(request)
        value["state"] = {"active": True, "selection": {"base": "all", "operations": [
            {"id": "op-1", "type": "filter", "predicate": {"op": "segment", "value": label}}]},
            "recommendation": None, "last_aggregate": None, "clarification": None, "selected_row_id": None}
        validate_request(value, manifest)
    for bad, context in [(dict(request, data_version="0" * 64), manifest), (request, None)]:
        try:
            validate_request(bad, context)
        except ContractError:
            pass
        else:
            raise AssertionError("Missing/stale manifest accepted")
    print("PASS: Python data load, 57 IDs/source aliases/order/nulls, aggregates, ISA account dates, real manifest contract")


if __name__ == "__main__":
    main()

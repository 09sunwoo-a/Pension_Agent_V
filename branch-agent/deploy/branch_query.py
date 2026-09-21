"""Authoritative numbers, IDs, three-valued predicates and ordered selection replay."""
from datetime import date, timedelta
from functools import cmp_to_key


def value(r, field):
    return {"age": r["customer"].get("age"), "name": r["customer"].get("name"),
            "grade": r["customer"].get("starClubGrade"), "irp_amount": r["irpAccount"].get("valuationAmountKrw"),
            "cash_amount": r["cash_amount"], "cash_pct": r["cash_pct"],
            "return_pct": r["irpAccount"].get("oneYearReturnPct"), "source_order": r["original_order"]}[field]


def accounts(r):
    return [(i, a) for i, a in enumerate(r.get("searchSupplement", {}).get("externalAccounts", [])) if a.get("type") == "ISA"]


def near_accounts(r, as_of):
    end = (date.fromisoformat(as_of) + timedelta(days=30)).isoformat()
    return [(i, a) for i, a in accounts(r) if a.get("verifiedAt") == as_of
            and a.get("maturityDate") and as_of <= a["maturityDate"] <= end]


def evidence(r, as_of):
    if r["as_of_date"] != as_of:
        return []
    m = r.get("searchSupplement", {}).get("management", {})
    refs, transfer = [], m.get("transfer") or {}
    if transfer.get("applied") is True and transfer.get("status") == "의사확인대기":
        refs.append(("UR01", "계약이전 신청 후 의사확인 대기", ["/searchSupplement/management/transfer/applied", "/searchSupplement/management/transfer/status"]))
    deposits = [(i, d) for i, d in enumerate(m.get("retirementDeposits", [])) if d.get("date")
                and d["date"] <= as_of and d.get("amount") == m.get("retirementAmount")]
    if (m.get("instruction") is False and (m.get("retirementAmount") or 0) > 0
            and r["cash_amount"] == m["retirementAmount"] and r["cash_pct"] == 100 and deposits):
        i, _ = max(deposits, key=lambda x: x[1]["date"])
        refs.append(("UR02", "퇴직급여 입금 후 운용 미지시·전액 현금성", ["/searchSupplement/management/instruction", "/searchSupplement/management/retirementAmount", f"/searchSupplement/management/retirementDeposits/{i}", "/cash_amount", "/cash_pct"]))
    for i, a in sorted(near_accounts(r, as_of), key=lambda x: x[1]["maturityDate"]):
        refs.append(("UR03", "확인된 ISA 계좌가 30일 이내 만기", [f"/searchSupplement/externalAccounts/{i}/verifiedAt", f"/searchSupplement/externalAccounts/{i}/maturityDate"]))
        break
    return [{"row_id": r["row_id"], "code": code, "text": text, "as_of_date": as_of, "evidence_refs": pointers}
            for code, text, pointers in refs]


def recommended(dataset):
    candidates = [(r, evidence(r, dataset.manifest["as_of_date"])) for r in dataset.records]
    candidates = sorted((x for x in candidates if x[1]), key=lambda x: (x[1][0]["code"], x[0]["row_id"]))
    seen, rows, reasons = set(), [], []
    for r, refs in candidates:
        identity = r["customer_id"] or r["row_id"]
        if identity not in seen:
            seen.add(identity)
            rows.append(r)
            reasons.extend(refs)
    return rows, reasons


def tri_and(values):
    return False if False in values else None if None in values else True


def predicate(r, p, as_of):
    op = p["op"]
    if op == "compare":
        v, target = value(r, p["field"]), p["value"]
        if v is None:
            return None
        return {"eq": lambda: v == target, "gte": lambda: v >= target, "gt": lambda: v > target,
                "lte": lambda: v <= target, "lt": lambda: v < target}[p["cmp"]]()
    if op == "segment":
        label = p["value"]
        if label == "retirement_uninstructed":
            if r["as_of_date"] != as_of or not r.get("searchSupplement", {}).get("management"):
                return None
            return any(x["code"] == "UR02" for x in evidence(r, as_of))
        return any(s["label"] == label or s["label"].startswith(label + " D-") for s in r["signals"])
    if op == "isa_between":
        aa = accounts(r)
        if any(a.get("maturityDate") and p["start"] <= a["maturityDate"] <= p["end"] for _, a in aa):
            return True
        return None if not aa or any(not a.get("maturityDate") for _, a in aa) else False
    if op == "not":
        v = predicate(r, p["arg"], as_of)
        return None if v is None else not v
    values = [predicate(r, a, as_of) for a in p["args"]]
    return tri_and(values) if op == "and" else True if True in values else None if None in values else False


def sorted_rows(rows, field, direction):
    def compare(a, b):
        av, bv = value(a, field), value(b, field)
        if av is None or bv is None:
            order = (av is None) - (bv is None)
        else:
            order = ((av > bv) - (av < bv)) * (-1 if direction == "desc" else 1)
        return order or (a["original_order"] - b["original_order"])
    return sorted(rows, key=cmp_to_key(compare))


def replay(dataset, selection):
    rows = recommended(dataset)[0] if selection["base"] == "recommendation" else list(dataset.records)
    unknown = []
    sort = {"field": "recommendation_order" if selection["base"] == "recommendation" else "source_order", "direction": "asc"}
    for op in selection["operations"]:
        if op["type"] == "filter":
            pairs = [(r, predicate(r, op["predicate"], dataset.manifest["as_of_date"])) for r in rows]
            unknown = [r for r in unknown if predicate(r, op["predicate"], dataset.manifest["as_of_date"]) is not False]
            unknown += [r for r, truth in pairs if truth is None]
            rows = [r for r, truth in pairs if truth is True]
        elif op["type"] == "sort":
            sort = {"field": op["field"], "direction": op["direction"]}
            rows = sorted_rows(rows, **sort)
        else:
            rows = rows[:op["count"]]
    return rows, sorted(unknown, key=lambda r: r["original_order"]), sort


def metrics(rows, keys):
    result = []
    for key in keys:
        vals = [1] * len(rows) if key == "customer_count" else [value(r, "irp_amount" if key == "irp_sum" else "cash_amount") for r in rows]
        known = [v for v in vals if v is not None]
        result.append({"key": key, "value": sum(known) if known or not rows else None,
                       "unit": "count" if key == "customer_count" else "KRW", "known_count": len(known), "unknown_count": len(rows) - len(known)})
    return result


def money(n):
    return "미확인" if n is None else f"{n:,.0f}원"


def briefing(r, as_of, detail="brief"):
    name = r["customer"]["name"]
    near = near_accounts(r, as_of)
    refs = evidence(r, as_of)
    codes = {x["code"] for x in refs}
    if detail == "isa_amount":
        vals = [a.get("valuationAmountKrw") for _, a in accounts(r)]
        known = [v for v in vals if v is not None]
        return (f"{name} 고객의 ISA 평가금액은 " + (f"확인된 합계 {money(sum(known))}입니다." if known else "미확인입니다.")
                + f" IRP 평가금액 {money(value(r, 'irp_amount'))}은 별도 계좌 금액입니다. ISA 잔액과 자금 사용계획을 확인할 필요가 있습니다.")
    if detail == "isa_facts" or "UR03" in codes:
        _, a = near[0]
        days = (date.fromisoformat(a["maturityDate"]) - date.fromisoformat(as_of)).days
        return f"{name} 고객의 ISA 만기는 {a['maturityDate']}로 {as_of} 기준 {days}일 남았습니다. ISA 금액과 자금 사용계획·IRP 전환 의향을 확인하는 상담이 필요합니다." + (" ISA 금액과 전환 의향은 미확인입니다." if a.get("valuationAmountKrw") is None and a.get("conversionIntent") is None else "")
    if "UR01" in codes:
        reason = r["searchSupplement"]["management"]["transfer"].get("reason") or "사유 미확인"
        return f"{name} 고객은 IRP {money(value(r, 'irp_amount'))}을 보유하고 {reason} 사유로 계약이전을 신청해 의사확인 대기 중입니다. 현재 이전 의사와 불편 사항을 확인하는 상담이 필요합니다."
    if "UR02" in codes:
        m = r["searchSupplement"]["management"]
        day = max(d["date"] for d in m["retirementDeposits"] if d["amount"] == r["cash_amount"] and d["date"] <= as_of)
        elapsed = (date.fromisoformat(as_of) - date.fromisoformat(day)).days
        return f"{name} 고객의 퇴직급여 {money(r['cash_amount'])}이 운용지시 없이 전액 현금성으로 남아 있고 {as_of} 기준 입금 후 {elapsed}일이 지났습니다. 자금 사용계획과 운용 의사를 확인해 첫 운용 상담을 진행할 필요가 있습니다."
    labels = [s["label"] for s in r["signals"]]
    age = value(r, "age")
    facts = (f"{age}세이며 " if age is not None else "") + ("·".join(labels) + " 상태가 등록되어 있습니다." if labels else "등록된 관리 상태가 미확인입니다.")
    direction = "현금성으로 유지하는 이유와 운용 의사, 디폴트옵션 등록 여부를 확인하는 상담이 필요합니다." if "현금성 장기대기" in labels else "최신 계좌 현황과 자금 사용계획을 확인하는 상담이 필요합니다."
    return f"{name} 고객은 {facts} {direction}"

"""Per-request execution trace collector (origin agent_observed).

One Collector per /chat request; never shared between threads or requests. Durations come from
time.monotonic(); absolute times are ISO 8601 with the server's UTC offset (the screen converts to KST).
Only the decision flow is recorded: interpret → plan → apply → (compose) → answer. Request parsing,
scope replay and final validation are not steps; a failure there is recorded as the failing stage.
No customer payloads, secrets, headers, employee IDs, prompts or raw model text.
"""
import time
from datetime import datetime, timezone

from branch_models import TraceDetail, MAX_TRACE_STEPS, MAX_TRACE_CALLS

STAGE_TITLES = {"interpret": "검색 조건 해석", "plan": "검색 조건 확정", "apply": "조건 적용·고객 확정",
                "compose": "상담 문장 생성", "answer": "답변 구성"}
STAGE_ACTOR = {"interpret": "LLM", "plan": "AGENT", "apply": "DATA", "compose": "LLM", "answer": "AGENT"}


def now_iso():
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds")


LABEL_MAX = 80


def _labels(values, limit):
    """Label lists are display text; the wire Label is 1..80 chars, so long/blank entries are cut, never rejected."""
    out = [str(v).strip()[:LABEL_MAX] for v in values if str(v).strip()]
    return out[:limit] or None


def detail(**fields):
    """A TraceDetail dict with every key present (schema keys are required, values nullable)."""
    base = {key: None for key in TraceDetail.model_fields}
    for key, value in fields.items():
        if key not in base:
            raise KeyError(key)
        if key in ("labels", "checks") and value is not None:
            value = _labels(value, 100 if key == "labels" else 16)
        base[key] = value
    return base


def state_summary(state):
    return {"active": bool(state["active"]), "base": state["selection"]["base"],
            "filter_count": sum(1 for o in state["selection"]["operations"] if o["type"] == "filter"),
            "has_recommendation": state["recommendation"] is not None,
            "clarification": state["clarification"]["kind"] if state["clarification"] else None}


def plan_summary(plan):
    # Plan allows blank optional strings (falsy = absent); the wire PlanSummary does not, so blanks become None here.
    text = lambda v: (str(v).strip()[:LABEL_MAX] or None) if v is not None else None
    return {"intent": plan["intent"], "scope": plan["scope"], "edit": plan["edit"], "operations": plan["operations"],
            "metric_keys": plan["metric_keys"], "target_name": text(plan.get("target_name")), "remove_field": text(plan.get("remove_field")),
            "clarification_kind": plan.get("clarification_kind"), "detail": plan.get("detail") or "brief"}


class Collector:
    def __init__(self):
        self.request_id = None
        self.t0 = time.monotonic()
        self.started_at = now_iso()
        self.steps = []
        self.calls = []
        self.failed = False

    def set_request(self, request_id):
        self.request_id = request_id

    def _ms(self, t):
        return int(round((time.monotonic() - t) * 1000))

    def begin(self, stage, title=None):
        if len(self.steps) >= MAX_TRACE_STEPS:
            return None
        step = {"id": "s%02d" % (len(self.steps) + 1), "sequence": len(self.steps) + 1, "actor": STAGE_ACTOR[stage], "stage": stage,
                "title": (title or STAGE_TITLES[stage])[:80], "status": "completed", "started_at": now_iso(), "ended_at": None,
                "duration_ms": None, "summary": "", "input": None, "output": None, "evidence_refs": [], "_t": time.monotonic()}
        self.steps.append(step)
        return len(self.steps) - 1

    def end(self, index, summary, status="completed", input=None, output=None, evidence=None):
        if index is None:
            return
        step = self.steps[index]
        if step["ended_at"] is not None:
            return
        step.update(ended_at=now_iso(), duration_ms=self._ms(step["_t"]), summary=str(summary)[:300], status=status,
                    input=input, output=output, evidence_refs=list(evidence or [])[:16])
        if status == "failed":
            self.failed = True

    def step(self, stage, title, summary, **kwargs):
        index = self.begin(stage, title)
        self.end(index, summary, **kwargs)
        return index

    def fail(self, stage, code, summary=None, title=None):
        """Marks the failing stage. An open step (e.g. an interpretation still in progress) is closed as failed."""
        for index, step in enumerate(self.steps):
            if step["ended_at"] is None:
                self.end(index, summary or ("처리 중단 · " + str(code)), status="failed", output=detail(code=str(code)[:80]))
                return
        self.step(stage, title, summary or ("처리 중단 · " + str(code)), status="failed", output=detail(code=str(code)[:80]))

    # One step per purpose ("검색 조건 해석" / "상담 문장 생성"); every real attempt is its own llm_calls entry.
    def llm_begin(self, purpose, attempt, model, deployment, input_detail):
        if len(self.calls) >= MAX_TRACE_CALLS:
            return None
        stage = "interpret" if purpose == "interpret" else "compose"
        index = next((i for i, s in enumerate(self.steps) if s["stage"] == stage and s["ended_at"] is None), None)
        if index is None:
            index = self.begin(stage)
        call = {"call_id": "llm-%02d" % (len(self.calls) + 1), "purpose": purpose, "attempt": attempt, "model": model,
                "deployment": deployment, "started_at": now_iso(), "ended_at": None, "duration_ms": None, "status": "failed",
                "input": input_detail, "output": None, "code": None, "_t": time.monotonic(), "_step": index}
        self.calls.append(call)
        return len(self.calls) - 1

    def llm_end(self, index, status, output=None, code=None, summary=None, close=False):
        """close=True ends the step as completed after a rejected attempt that has a supported fallback (template sentence)."""
        if index is None:
            return
        call = self.calls[index]
        if call["ended_at"] is not None:
            return
        call.update(ended_at=now_iso(), duration_ms=self._ms(call["_t"]), status=status, output=output, code=code)
        attempts = [c for c in self.calls if c["purpose"] == call["purpose"]]
        head = detail(model=call["model"], deployment=call["deployment"], attempt=len(attempts),
                      message=call["input"]["message"] if call["input"] else None,
                      state_summary=call["input"]["state_summary"] if call["input"] else None,
                      purpose=call["input"]["purpose"] if call["input"] else None)
        if status == "accepted":
            self.end(call["_step"], (summary or "채택") + (" · 재시도 %d회" % (len(attempts) - 1) if len(attempts) > 1 else "") + " · %.1f초" % (sum(c["duration_ms"] for c in attempts) / 1000),
                     input=head, output=output)
        elif status == "failed":
            self.end(call["_step"], "호출 실패 · " + str(code), status="failed", input=head, output=detail(code=str(code)[:80]))
        elif status == "rejected" and close:
            self.end(call["_step"], summary or "검증 실패 · 확정 문장 사용", input=head, output=output)
        # rejected without close: the step stays open for the next attempt; a final rejection is closed by fail() as failed.

    def finish(self, status=None):
        for index, step in enumerate(self.steps):
            if step["ended_at"] is None:
                self.end(index, "완료 전 중단", status="failed")
        for call in self.calls:
            if call["ended_at"] is None:
                call.update(ended_at=now_iso(), duration_ms=self._ms(call["_t"]), status="failed", code=call["code"] or "INTERRUPTED")
        steps = [{k: v for k, v in s.items() if not k.startswith("_")} for s in self.steps]
        calls = [{k: v for k, v in c.items() if not k.startswith("_")} for c in self.calls]
        return {"trace_version": "branch-execution-trace.v1", "origin": "agent_observed", "request_id": self.request_id,
                "clock": "monotonic", "started_at": self.started_at, "ended_at": now_iso(), "duration_ms": self._ms(self.t0),
                "status": status or ("failed" if self.failed else "completed"), "steps": steps, "llm_calls": calls}

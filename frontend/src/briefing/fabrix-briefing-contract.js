/* Fixed wire contract for briefing tests. Backend logic is intentionally absent. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./briefing-contract'));
  else root.PensionFabrixContract = factory(root.PensionBriefingContract);
})(typeof window === 'undefined' ? globalThis : window, function (contentContract) {
  'use strict';
  var VERSION = 'customer-briefing-api.v1';
  var text = { type: 'string', pattern: '\\S' };
  function object(properties, required) { return { type: 'object', properties: properties, required: required || Object.keys(properties), additionalProperties: false }; }
  var identity = { request_id: text, case_id: text, customer_id: text, as_of_date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' } };
  // 선택 필드 data.analysis_trace: 고정 브리핑에 덧붙이는 구성 근거(고객 사실·사전 작성 판단·지식 카드·브리핑 연결).
  // C01-07에만 제공되며 없어도 기존 응답은 그대로 유효하다. LLM 호출은 없다(llm_calls = 0).
  var strings = { type: 'array', items: text }, iso = { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}(\\.\\d{1,6})?(Z|[+-]\\d{2}:\\d{2})$' };
  var pointerRef = { type: 'string', pattern: '^/' }, ms = { type: 'number' };
  var traceStep = object({ id: text, sequence: ms, title: text, summary: text, started_at: iso, ended_at: iso, duration_ms: ms, fact_ids: strings, judgment_ids: strings, group_ids: strings, target_prefixes: strings });
  var factValue = object({ ref: pointerRef, value: { type: ['string', 'number', 'boolean', 'null'] } });
  var fact = object({ id: text, label: text, role: text, values: { type: 'array', items: factValue, minItems: 1 } });
  var snapshotGroup = object({ title: text, items: { type: 'array', items: object({ label: text, ref: pointerRef, value: { type: ['string', 'number', 'boolean', 'null'] } }), minItems: 1 } });
  var judgment = object({ id: text, origin: { type: 'string', const: 'case_authored' }, summary: text, guard: { type: ['string', 'null'] }, fact_ids: strings, evidence_ids: strings });
  var cardProperties = { id: text, group: text, title: text, source_title: text, product_id: { type: ['string', 'null'] }, summary: text, application: text, raw_status: text, raw_excerpts: array(object({ text: text })), used_by: { type: 'array', items: pointerRef }, source_id: { type: ['string', 'null'] } };
  // source_id is optional; when present it must name a briefing.sources[].id of the same answer (checked in traceErrors).
  var card = object(cardProperties, Object.keys(cardProperties).filter(function (k) { return k !== 'source_id'; }));
  var binding = object({ id: text, target: pointerRef, text: text, role: text, fact_ids: strings, evidence_ids: strings, judgment_ids: strings });
  var group = object({ id: text, title: text, card_ids: strings, reuse_card_ids: strings });
  var analysisTraceSchema = object({
    mode: { type: 'string', const: 'fixed_briefing_evidence' }, origin: { type: 'string', const: 'agent_observed' }, judgment_origin: { type: 'string', const: 'case_authored' },
    llm_calls: { type: 'number', const: 0 }, case_id: text, as_of_date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
    started_at: iso, ended_at: iso, duration_ms: ms, panel_title: text, button: text,
    steps: { type: 'array', items: traceStep, minItems: 4 }, groups: array(group), snapshot: array(snapshotGroup), facts: array(fact), judgments: array(judgment), knowledge_cards: array(card), bindings: { type: 'array', items: binding, minItems: 1 },
    workflow: object({ common: { type: 'array', items: pointerRef }, continue_investing: { type: 'array', items: pointerRef }, start_pension: { type: 'array', items: pointerRef }, followup: { type: 'array', items: pointerRef }, meaning: text })
  });
  var STEP_IDS = ['customer_summary', 'management_focus', 'knowledge_selection', 'briefing_binding'];
  function array(items) { return { type: 'array', items: items }; }
  var dataProperties = Object.assign({ schema_version: { type: 'string', const: VERSION }, answer_type: { type: 'string', const: 'briefing' } }, identity, { briefing: contentContract.contentSchema, analysis_trace: analysisTraceSchema });
  var dataSchema = object(dataProperties, Object.keys(dataProperties).filter(function (k) { return k !== 'analysis_trace'; }));
  var answerSchema = object({ event: { type: 'string', const: 'answer' }, data: dataSchema });
  // Briefing-only view of the answer: the trace is checked separately so a bad trace never hides a valid briefing.
  var coreProperties = Object.assign({}, dataProperties); delete coreProperties.analysis_trace;
  var coreSchema = object({ event: { type: 'string', const: 'answer' }, data: object(coreProperties) });
  function pointer(root, ref) {
    var cur = root, parts = ref.replace(/^\//, '').split('/');
    for (var i = 0; i < parts.length; i++) {
      var key = parts[i].replace(/~1/g, '/').replace(/~0/g, '~');
      if (Array.isArray(cur)) { if (!/^(0|[1-9]\d*)$/.test(key) || Number(key) >= cur.length) return undefined; cur = cur[Number(key)]; }
      else if (cur && typeof cur === 'object' && Object.prototype.hasOwnProperty.call(cur, key)) cur = cur[key];
      else return undefined;
    }
    return cur;
  }
  // Semantic checks beyond the shape: fixed four steps, unique ids, every reference resolvable, binding text taken from the same briefing.
  function traceErrors(trace, data, req) {
    var errors = [];
    if (trace.case_id !== data.case_id || trace.as_of_date !== data.as_of_date) errors.push('trace identity');
    if (trace.steps.map(function (s) { return s.id; }).join(',') !== STEP_IDS.join(',')) errors.push('trace steps');
    var unique = function (list, name) { var seen = {}; list.forEach(function (x) { if (seen[x.id]) errors.push('duplicate ' + name + ' ' + x.id); seen[x.id] = true; }); return seen; };
    var facts = unique(trace.facts, 'fact'), judgments = unique(trace.judgments, 'judgment'), cards = unique(trace.knowledge_cards, 'card'), groups = unique(trace.groups, 'group');
    unique(trace.bindings, 'binding');
    trace.facts.forEach(function (f) { f.values.forEach(function (v) { var actual = pointer(req.customer_data, v.ref); if (JSON.stringify(actual) !== JSON.stringify(v.value)) errors.push('fact value ' + f.id); }); });
    trace.snapshot.forEach(function (g) { g.items.forEach(function (v) { if (JSON.stringify(pointer(req.customer_data, v.ref)) !== JSON.stringify(v.value)) errors.push('snapshot value ' + g.title); }); });
    trace.judgments.forEach(function (j) { j.fact_ids.forEach(function (id) { if (!facts[id]) errors.push('judgment fact ' + j.id); }); j.evidence_ids.forEach(function (id) { if (!cards[id]) errors.push('judgment card ' + j.id); }); });
    var sourceIds = {}; (data.briefing.sources || []).forEach(function (s) { if (s && s.id) sourceIds[s.id] = true; });
    trace.knowledge_cards.forEach(function (c) { if (!groups[c.group]) errors.push('card group ' + c.id); if (c.source_id != null && !sourceIds[c.source_id]) errors.push('card source ' + c.id); c.used_by.forEach(function (ref) { if (typeof pointer(data.briefing, ref) !== 'string') errors.push('card used_by ' + c.id); }); });
    trace.groups.forEach(function (g) { g.card_ids.concat(g.reuse_card_ids).forEach(function (id) { if (!cards[id]) errors.push('group card ' + g.id); }); });
    trace.bindings.forEach(function (b) {
      if (pointer(data.briefing, b.target) !== b.text) errors.push('binding text ' + b.id);
      b.fact_ids.forEach(function (id) { if (!facts[id]) errors.push('binding fact ' + b.id); });
      b.evidence_ids.forEach(function (id) { if (!cards[id]) errors.push('binding card ' + b.id); });
      b.judgment_ids.forEach(function (id) { if (!judgments[id]) errors.push('binding judgment ' + b.id); });
    });
    trace.steps.forEach(function (s) {
      s.fact_ids.forEach(function (id) { if (!facts[id]) errors.push('step fact ' + s.id); }); s.judgment_ids.forEach(function (id) { if (!judgments[id]) errors.push('step judgment ' + s.id); }); s.group_ids.forEach(function (id) { if (!groups[id]) errors.push('step group ' + s.id); });
      if (s.ended_at < s.started_at || s.duration_ms < 0) errors.push('step clock ' + s.id);
    });
    Object.keys(trace.workflow).forEach(function (k) { if (Array.isArray(trace.workflow[k])) trace.workflow[k].forEach(function (ref) { if (pointer(data.briefing, ref) === undefined) errors.push('workflow ' + k); }); });
    return errors;
  }
  var errorSchema = object({ event: { type: 'string', const: 'error' }, request_id: text, message: text });
  function request(customer, requestId, employee) {
    return { schema_version: VERSION, task: 'customer_briefing', request_id: requestId,
      message: '제공된 고객 스냅샷을 기준으로 S1~S5 고객별 브리핑을 작성해 주세요.',
      x_client_user: employee || '', case_id: customer.briefingMeta.caseId,
      customer_id: customer.customer.customerId, as_of_date: customer.briefingMeta.asOfDate,
      customer_data: JSON.parse(JSON.stringify(customer)) };
  }
  function answer(requestData, briefing, trace) {
    var data = { schema_version: VERSION, answer_type: 'briefing' };
    Object.keys(identity).forEach(function (key) { data[key] = requestData[key]; });
    data.briefing = briefing;
    if (trace) data.analysis_trace = trace;
    return { event: 'answer', data: data };
  }
  function validate(event, req) {
    if (event && event.event === 'error') {
      var errorShape = contentContract.checkShape(event, errorSchema);
      if (errorShape.length) return { ok: false, code: 'SCHEMA' };
      return { ok: false, code: event.request_id === req.request_id ? 'AGENT' : 'IDENTITY' };
    }
    if (event && event.data && event.data.schema_version !== VERSION) return { ok: false, code: 'VERSION' };
    if (!event || !event.data || typeof event.data !== 'object') return { ok: false, code: 'SCHEMA' };
    var trace = Object.prototype.hasOwnProperty.call(event.data, 'analysis_trace') ? event.data.analysis_trace : null;
    var core = { event: event.event, data: Object.assign({}, event.data) }; delete core.data.analysis_trace;
    if (contentContract.checkShape(core, coreSchema).length) return { ok: false, code: 'SCHEMA' };
    if (Object.keys(identity).some(function (key) { return event.data[key] !== req[key]; })) return { ok: false, code: 'IDENTITY' };
    if (contentContract.validateContent(event.data.briefing, req.customer_data).length) return { ok: false, code: 'SCHEMA' };
    // A malformed trace never poisons the briefing: the briefing is still shown, the evidence panel is not.
    if (trace !== null && (contentContract.checkShape(trace, analysisTraceSchema).length || traceErrors(trace, event.data, req).length)) return { ok: true, content: event.data.briefing, trace: null, traceCode: 'TRACE' };
    return { ok: true, content: event.data.briefing, trace: trace || null };
  }
  return { version: VERSION, answerSchema: answerSchema, errorSchema: errorSchema, analysisTraceSchema: analysisTraceSchema, stepIds: STEP_IDS, request: request, answer: answer, validate: validate, traceErrors: traceErrors, pointer: pointer };
});

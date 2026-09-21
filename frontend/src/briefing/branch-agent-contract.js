/* Branch wire boundary. Schema comes from Pydantic, not an independently edited JS schema.
 * No DOM, network, credentials, customer calculation, or LLM dependencies. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../../../integration/contracts/branch-agent.schema.json'));
  else root.PensionBranchAgentContract = factory(root.PensionBranchAgentSchema);
})(typeof window === 'undefined' ? globalThis : window, function (schema) {
  'use strict';
  const VERSION = 'branch-agent-api.v1', DATASET = 'branch-demo.v1', RULE = 'branch-rules.v1';
  const own = (x, k) => Object.prototype.hasOwnProperty.call(x, k);
  const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
  const clone = x => JSON.parse(JSON.stringify(x));
  function fault(code) { const e = new Error(code); e.code = code; return e; }
  function requireThat(value, code = 'SCHEMA') { if (!value) throw fault(code); }
  function equal(a, b) {
    if (a === b) return true;
    if (Array.isArray(a)) return Array.isArray(b) && a.length === b.length && a.every((v, i) => equal(v, b[i]));
    return object(a) && object(b) && Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(k => own(b, k) && equal(a[k], b[k]));
  }

  // Deliberately restricted Draft 2020-12 subset emitted by branch_models.py.
  // Fail closed if a future model emits a keyword we have not implemented.
  const keywords = new Set(['$schema', '$defs', '$ref', 'title', 'description', 'type', 'properties', 'required',
    'additionalProperties', 'anyOf', 'enum', 'const', 'items', 'minItems', 'maxItems', 'minLength', 'maxLength',
    'pattern', 'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum']);
  function checkSchema(rule) {
    requireThat(object(rule), 'SCHEMA_DEFINITION');
    Object.keys(rule).forEach(k => requireThat(keywords.has(k), 'SCHEMA_DEFINITION'));
    if (rule.$ref) requireThat(/^#\/\$defs\/[A-Za-z0-9_]+$/.test(rule.$ref) && own(schema.$defs, rule.$ref.slice(8)), 'SCHEMA_DEFINITION');
    if (rule.properties) Object.values(rule.properties).forEach(checkSchema);
    if (rule.$defs) Object.values(rule.$defs).forEach(checkSchema);
    if (rule.anyOf) rule.anyOf.forEach(checkSchema);
    if (rule.items) checkSchema(rule.items);
    if (object(rule.additionalProperties)) checkSchema(rule.additionalProperties);
  }
  checkSchema(schema);
  function shapeMatches(value, rule, depth = 0) {
    if (depth > 80) return false;
    if (rule.$ref && !shapeMatches(value, schema.$defs[rule.$ref.slice(8)], depth + 1)) return false;
    if (rule.anyOf && !rule.anyOf.some(r => shapeMatches(value, r, depth + 1))) return false;
    if (own(rule, 'const') && value !== rule.const) return false;
    if (rule.enum && !rule.enum.includes(value)) return false;
    if (rule.type) {
      const valid = { object: object(value), array: Array.isArray(value), string: typeof value === 'string',
        integer: Number.isSafeInteger(value), number: typeof value === 'number' && Number.isFinite(value),
        boolean: typeof value === 'boolean', null: value === null };
      if (!valid[rule.type]) return false;
    }
    if (typeof value === 'string') {
      const length = Array.from(value).length; // JSON Schema/Python use code points, not UTF-16 units.
      if (rule.minLength !== undefined && length < rule.minLength || rule.maxLength !== undefined && length > rule.maxLength) return false;
      if (rule.pattern && !new RegExp(rule.pattern, 'u').test(value)) return false;
    }
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) return false;
      if (rule.minimum !== undefined && value < rule.minimum || rule.maximum !== undefined && value > rule.maximum) return false;
      if (rule.exclusiveMinimum !== undefined && value <= rule.exclusiveMinimum || rule.exclusiveMaximum !== undefined && value >= rule.exclusiveMaximum) return false;
    }
    if (Array.isArray(value)) {
      if (rule.minItems !== undefined && value.length < rule.minItems || rule.maxItems !== undefined && value.length > rule.maxItems) return false;
      if (rule.items && !value.every(v => shapeMatches(v, rule.items, depth + 1))) return false;
    }
    if (object(value)) {
      if (rule.required && !rule.required.every(k => own(value, k))) return false;
      for (const k of Object.keys(value)) {
        if (rule.properties && own(rule.properties, k)) { if (!shapeMatches(value[k], rule.properties[k], depth + 1)) return false; }
        else if (rule.additionalProperties === false) return false;
        else if (object(rule.additionalProperties) && !shapeMatches(value[k], rule.additionalProperties, depth + 1)) return false;
      }
    }
    return true;
  }
  function shape(kind, raw) {
    jsonValueCheck(raw);
    requireThat(own(schema.properties, kind) && shapeMatches(raw, schema.properties[kind]));
    return raw;
  }
  function jsonValueCheck(value, depth = 0) {
    requireThat(depth <= 64);
    if (typeof value === 'string') requireThat(!Array.from(value).some(ch => ch.codePointAt(0) >= 0xD800 && ch.codePointAt(0) <= 0xDFFF));
    else if (typeof value === 'number') requireThat(Number.isFinite(value) && Math.abs(value) <= Number.MAX_SAFE_INTEGER);
    else if (Array.isArray(value)) value.forEach(x => jsonValueCheck(x, depth + 1));
    else if (object(value)) Object.keys(value).forEach(k => { jsonValueCheck(k, depth + 1); jsonValueCheck(value[k], depth + 1); });
    else requireThat(value === null || typeof value === 'boolean');
  }
  function initialState() {
    return { active: false, selection: { base: 'all', operations: [] }, recommendation: null,
      last_aggregate: null, clarification: null, selected_row_id: null };
  }
  function validDay(value) {
    if (typeof value !== 'string' || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number), leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
  }
  function unique(values, code = 'SCHEMA') { requireThat(new Set(values).size === values.length, code); }
  function manifestCheck(manifest) {
    requireThat(object(manifest) && manifest.dataset_id === DATASET && manifest.rule_version === RULE, 'MANIFEST');
    requireThat(Array.isArray(manifest.row_ids) && manifest.row_ids.length > 0 && manifest.row_ids.length <= 64 && manifest.row_ids.every(x => typeof x === 'string'), 'MANIFEST');
    unique(manifest.row_ids, 'MANIFEST');
    requireThat(Array.isArray(manifest.segment_labels) && manifest.segment_labels.every(x => typeof x === 'string') && validDay(manifest.as_of_date), 'MANIFEST');
  }
  function identities(value, manifest) { ['dataset_id', 'data_version', 'rule_version'].forEach(k => requireThat(value[k] === manifest[k], 'DATA_VERSION')); }
  function checkIds(ids, manifest) { unique(ids, 'IDENTITY'); requireThat(ids.every(x => manifest.row_ids.includes(x)), 'IDENTITY'); }
  function predicateCheck(p, manifest, depth = 1) {
    requireThat(depth <= 4, 'STATE'); let nodes = 1;
    if (p.op === 'compare') {
      if (['name', 'grade'].includes(p.field)) requireThat(typeof p.value === 'string' && p.cmp === 'eq', 'STATE');
      else {
        requireThat(typeof p.value === 'number', 'STATE');
        if (['irp_amount', 'cash_amount', 'age'].includes(p.field)) requireThat(p.value >= 0 && Number.isSafeInteger(p.value), 'STATE');
        if (p.field === 'age') requireThat(p.value <= 150, 'STATE');
        if (p.field === 'cash_pct') requireThat(p.value >= 0 && p.value <= 100, 'STATE');
      }
    } else if (p.op === 'segment') requireThat(manifest.segment_labels.includes(p.value) || p.value === 'retirement_uninstructed', 'STATE');
    else if (p.op === 'isa_between') requireThat(validDay(p.start) && validDay(p.end) && p.start <= p.end, 'STATE');
    else if (['and', 'or'].includes(p.op)) nodes += p.args.reduce((n, x) => n + predicateCheck(x, manifest, depth + 1), 0);
    else if (p.op === 'not') nodes += predicateCheck(p.arg, manifest, depth + 1);
    requireThat(nodes <= 32, 'STATE'); return nodes;
  }
  function selectionCheck(selection, state, manifest) {
    requireThat(selection.base !== 'recommendation' || state.recommendation !== null, 'STATE');
    unique(selection.operations.map(x => x.id), 'STATE');
    selection.operations.forEach(x => { if (x.type === 'filter') predicateCheck(x.predicate, manifest); });
  }
  function stateCheck(state, manifest) {
    selectionCheck(state.selection, state, manifest);
    if (!state.active) requireThat(equal(state.selection, initialState().selection), 'STATE');
    if (state.recommendation) requireThat(state.recommendation.rule_version === manifest.rule_version && state.recommendation.as_of_date === manifest.as_of_date, 'STATE');
    if (state.last_aggregate) { selectionCheck(state.last_aggregate.selection, state, manifest); unique(state.last_aggregate.metric_keys, 'STATE'); }
    if (state.selected_row_id !== null) checkIds([state.selected_row_id], manifest);
    const clarify = state.clarification;
    if (clarify) {
      checkIds(clarify.candidate_row_ids, manifest); unique(clarify.options.map(x => x.value), 'STATE');
      if (clarify.kind === 'cash_value') requireThat(['cash_amount', 'cash_pct'].includes(clarify.field), 'STATE');
      if (clarify.kind === 'customer') requireThat(clarify.candidate_row_ids.length > 0, 'STATE');
    }
  }
  function actionCheck(action, state, manifest) {
    if (action.type === 'restore_recommendation') requireThat(state.recommendation !== null, 'ACTION');
    else if (action.type === 'show_aggregate') requireThat(state.last_aggregate !== null, 'ACTION');
    else if (action.type === 'remove_condition') requireThat(state.selection.operations.some(x => x.type === 'filter' && x.id === action.operation_id), 'ACTION');
    else if (action.type === 'brief') {
      checkIds([action.row_id], manifest);
      if (state.clarification && state.clarification.kind === 'customer') requireThat(state.clarification.candidate_row_ids.includes(action.row_id), 'ACTION');
    } else if (action.type === 'clarify') requireThat(state.clarification !== null && state.clarification.options.some(x => x.value === action.value), 'ACTION');
  }
  function validateRequest(raw, manifest) {
    manifestCheck(manifest); shape('request', raw); identities(raw, manifest);
    const state = raw.state || initialState(); stateCheck(state, manifest);
    if (raw.action !== null) actionCheck(raw.action, state, manifest);
    return clone(raw);
  }
  function pointerExists(record, pointer) {
    let current = record;
    for (const part of pointer.slice(1).split('/')) {
      const key = part.replace(/~1/g, '/').replace(/~0/g, '~');
      if (Array.isArray(current)) { if (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= current.length) return false; current = current[Number(key)]; }
      else if (object(current) && own(current, key)) current = current[key];
      else return false;
    }
    return true;
  }
  function validateEvent(raw, request, manifest, recordsById) {
    request = validateRequest(request, manifest);
    requireThat(object(raw) && ['answer', 'progress', 'error'].includes(raw.event)); shape(raw.event, raw);
    const data = raw.data;
    ['request_id', 'conversation_id', 'base_revision'].forEach(k => requireThat(data[k] === request[k], 'IDENTITY'));
    if (raw.event === 'progress') { requireThat(data.phase !== 'interpreting' || !data.list_pending, 'STATE'); return clone(raw); }
    if (raw.event === 'error') return clone(raw);
    identities(data, manifest); requireThat(data.revision === request.base_revision + 1, 'REVISION');
    const state = data.next_state, old = request.state || initialState(), result = data.result, ui = data.ui;
    stateCheck(state, manifest); checkIds(result.row_ids, manifest); checkIds(result.unknown_row_ids, manifest);
    requireThat(result.count === result.row_ids.length && !result.row_ids.some(x => result.unknown_row_ids.includes(x)), 'RESULT');
    unique(result.metrics.map(x => x.key), 'RESULT');
    result.metrics.forEach(m => {
      requireThat(m.known_count + m.unknown_count === result.count, 'RESULT');
      requireThat(m.unit === (m.key === 'customer_count' ? 'count' : 'KRW'), 'RESULT');
      if (m.value !== null) requireThat(m.value >= 0 && Number.isSafeInteger(m.value), 'RESULT');
      if (m.key === 'customer_count') requireThat(m.value === result.count && m.unknown_count === 0, 'RESULT');
      else {
        requireThat((m.value === null) === (m.known_count === 0 && result.count > 0), 'RESULT');
        if (result.count === 0) requireThat(m.value === 0, 'RESULT');
      }
    });
    unique(result.reasons.map(x => x.row_id + ':' + x.code), 'RESULT');
    result.reasons.forEach(r => {
      requireThat(result.row_ids.includes(r.row_id) && validDay(r.as_of_date) && r.as_of_date === manifest.as_of_date, 'RESULT');
      unique(r.evidence_refs, 'RESULT');
      r.evidence_refs.forEach(p => { requireThat(!/~(?![01])/.test(p), 'RESULT'); if (recordsById !== undefined) requireThat(pointerExists(recordsById[r.row_id], p), 'RESULT'); });
    });
    data.actions.forEach(b => actionCheck(b.action, state, manifest));
    const effect = ui.list_action, intent = data.intent, status = data.status;
    if (effect === 'replace') {
      requireThat(ui.row_ids !== null && ui.sort !== null, 'UI'); checkIds(ui.row_ids, manifest);
      requireThat(equal(ui.row_ids, result.row_ids) && state.active && ['search', 'recommend', 'restore'].includes(intent), 'UI');
      requireThat(status === (ui.row_ids.length ? 'ok' : 'empty'), 'UI');
      requireThat(state.selected_row_id === null || ui.row_ids.includes(state.selected_row_id), 'STATE');
    } else {
      requireThat(ui.row_ids === null && ui.sort === null, 'UI');
      if (effect === 'keep') {
        requireThat(['active', 'selection', 'recommendation'].every(k => equal(state[k], old[k])), 'UI');
        requireThat(['overview', 'aggregate', 'brief', 'clarify', 'unsupported'].includes(intent), 'UI');
      } else {
        requireThat(intent === 'restore' && status === 'ok' && equal(state, initialState()), 'UI');
        requireThat(equal(result.row_ids, manifest.row_ids), 'RESULT');
      }
    }
    requireThat(status !== 'empty' || effect === 'replace', 'UI');
    if (intent === 'clarify') requireThat(status === 'clarification_required' && state.clarification !== null, 'STATE');
    else requireThat(status !== 'clarification_required' && state.clarification === null, 'STATE');
    requireThat((intent === 'unsupported') === (status === 'unsupported'), 'STATE');
    if (intent === 'recommend') {
      requireThat(state.recommendation !== null && equal(state.selection, {base: 'recommendation', operations: []}), 'STATE');
      const ids = Array.from(new Set(result.reasons.map(x => x.row_id))).sort(); requireThat(equal(ids, result.row_ids.slice().sort()), 'RESULT');
      requireThat(ui.sort.field === 'recommendation_order', 'UI');
    }
    if (intent === 'brief') requireThat(result.count === 1 && state.selected_row_id === result.row_ids[0], 'RESULT');
    if (['overview', 'aggregate'].includes(intent)) requireThat(state.last_aggregate !== null, 'STATE');
    return clone(raw);
  }
  function request(fields, manifest) {
    return validateRequest(Object.assign({ schema_version: VERSION, task: 'branch_assistant', dataset_id: manifest.dataset_id,
      data_version: manifest.data_version, rule_version: manifest.rule_version, action: null, state: null }, fields), manifest);
  }

  // Known gateway wrapping only. Concatenated complete logical objects are supported
  // because the existing internal chat samples demonstrate that coalescing can occur.
  // No regex recovery from error text, plain prose, or partial logical JSON.
  function logicalObjects(text) {
    requireThat(typeof text === 'string', 'JSON'); const objects = []; let i = 0;
    while (i < text.length) {
      while (/\s/.test(text[i] || '') && i < text.length) i++;
      if (i === text.length) break;
      requireThat(text[i] === '{', 'JSON');
      const start = i; let depth = 0, quoted = false, escaped = false, ended = false;
      for (; i < text.length; i++) {
        const ch = text[i];
        if (quoted) { if (escaped) escaped = false; else if (ch === '\\') escaped = true; else if (ch === '"') quoted = false; }
        else if (ch === '"') quoted = true;
        else if (ch === '{') depth++;
        else if (ch === '}' && --depth === 0) { i++; ended = true; break; }
      }
      requireThat(ended, 'JSON');
      let parsed; try { parsed = JSON.parse(text.slice(start, i)); } catch (_) { throw fault('JSON'); }
      requireThat(object(parsed), 'JSON'); objects.push(parsed);
      requireThat(objects.length <= 64, 'LIMIT');
    }
    return objects;
  }
  function unwrap(envelope) {
    requireThat(object(envelope), 'SSE');
    requireThat(!envelope.status || envelope.status === 'SUCCESS', 'GATEWAY');
    requireThat(envelope.truncated !== true && envelope.truncated !== 'true' && envelope.finish_reason !== 'length', 'TRUNCATED');
    if (['START', 'END', 'DONE'].includes(envelope.event_status) && !envelope.content) return [];
    requireThat(envelope.event_status === 'CHUNK', 'SSE');
    if (envelope.content === '' || envelope.content === null || envelope.content === undefined) return [];
    return logicalObjects(envelope.content).flatMap(x => x.event === 'CHUNK' ? logicalObjects(x.content) : [x]);
  }
  function createTurn(req, manifest) {
    const requestSnapshot = validateRequest(req, manifest), context = clone(manifest);
    let final = null, closed = false, broken = false, count = 0;
    return {
      accept(envelope) {
        try {
          requireThat(!closed && !broken, 'STATE');
          const events = unwrap(envelope);
          events.forEach(event => {
            requireThat(final === null, 'MULTIPLE'); requireThat(++count <= 64, 'LIMIT');
            const valid = validateEvent(event, requestSnapshot, context);
            if (valid.event !== 'progress') final = valid;
          });
          return events.filter(e => e.event === 'progress').map(clone);
        } catch (e) { broken = true; throw e; }
      },
      finish() {
        requireThat(!closed && !broken, 'STATE'); requireThat(final !== null, 'EMPTY'); closed = true;
        return clone(final); // Transport calls this only after parser.finish() and clean HTTP EOF.
      },
      cancel() { broken = true; final = null; }
    };
  }
  return { version: VERSION, schema, shape, initialState, request, validateRequest, validateEvent, unwrap, createTurn };
});

/* Shared by the vanilla browser adapter and the offline fixture builder. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PensionBriefingContract = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  var VERSION = 'customer-briefing-output.v2';
  var str = { type: 'string' };
  var text = { type: 'string', pattern: '\\S' };
  var strings = { type: 'array', items: str };
  function object(properties, required) {
    return { type: 'object', additionalProperties: false, properties: properties, required: required || Object.keys(properties) };
  }
  function array(items) { return { type: 'array', items: items }; }
  function optional(rule) { return Object.assign({}, rule, { type: [rule.type, 'null'] }); }
  var source = object({ id: text, title: text, description: optional(str), url: optional(str) }, ['id', 'title']);
  var metric = object({
    kind: { type: 'string', enum: ['return', 'rate'] }, valuePct: { type: 'number' }, period: text, asOf: text,
    validFrom: optional({ type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' }), validUntil: optional({ type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' })
  }, ['kind', 'valuePct', 'period', 'asOf']);
  var product = object({
    productId: optional(str), name: text, category: optional(str), riskLevel: optional(str),
    metrics: optional(array(metric)), reason: optional(str), notes: optional(strings), sourceIds: { type: 'array', items: text, minItems: 1 }
  }, ['name', 'sourceIds']);
  var option = object({
    id: text, title: text, summary: optional(str), details: optional(strings), products: optional(array(product)), sourceIds: optional(strings)
  }, ['id', 'title']);
  var schema = object({
    schemaVersion: { type: 'string', const: VERSION },
    caseId: text, customerId: text, asOfDate: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
    status: { type: 'string', enum: ['draft', 'ready'] },
    title: text,
    s1: object({ items: { type: 'array', minItems: 1, items: object({ text: text, dataRefs: optional(strings), sourceIds: optional(strings) }, ['text']) } }),
    s2: object({ lead: text, why: optional(str), checks: optional(strings), sourceIds: optional(strings) }, ['lead']),
    s3: object({ lead: text, options: optional(array(option)), notes: optional(strings) }, ['lead']),
    s4: optional(object({ opening: optional(str), reactions: optional(array(object({ label: text, paragraphs: { type: 'array', items: text, minItems: 1 } }))), notices: optional(strings), sourceIds: optional(strings) }, [])),
    s5: optional(object({ tips: optional(array(object({ title: text, body: optional(str), sourceIds: optional(strings) }, ['title']))), actions: optional(array(object({ screenCode: optional(str), title: text, description: optional(str) }, ['title']))), sourceIds: optional(strings) }, [])),
    sources: optional(array(source)), reviewNotes: optional(strings)
  }, ['schemaVersion', 'caseId', 'customerId', 'asOfDate', 'status', 'title', 's1', 's2', 's3']);
  // Frontend content boundary. Routing metadata belongs to the caller, never
  // to the narrative response. Reuse exactly the same section definitions.
  var contentFields = ['s1', 's2', 's3', 's4', 's5', 'sources', 'reviewNotes'];
  var contentProperties = {};
  contentFields.forEach(function (key) { contentProperties[key] = schema.properties[key]; });
  var contentSchema = object(contentProperties, ['s1', 's2', 's3']);
  function contentOf(output) {
    var content = {};
    contentFields.forEach(function (key) {
      if (Object.prototype.hasOwnProperty.call(output, key)) content[key] = output[key];
    });
    return JSON.parse(JSON.stringify(content));
  }
  function withContext(content, customer) {
    return Object.assign({ schemaVersion: VERSION, caseId: customer.briefingMeta.caseId,
      customerId: customer.customer.customerId, asOfDate: customer.briefingMeta.asOfDate,
      status: 'draft', title: '고객별 브리핑' }, content);
  }
  function validateContent(content, customer) {
    var errors = [];
    validateShape(content, contentSchema, 'content', errors);
    return errors.length ? errors : validate(withContext(content, customer), customer);
  }
  function checkShape(value, rule) { var errors = []; validateShape(value, rule, 'response', errors); return errors; }
  function normalizeContent(content) { return contentOf(normalize(content)); }

  // The schema uses a deliberately small JSON Schema subset, also checked in the browser.
  function validateShape(value, rule, path, errors) {
    var type = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
    var types = Array.isArray(rule.type) ? rule.type : [rule.type];
    if (types.indexOf(type) < 0) { errors.push(path + ': expected ' + types.join('/')); return; }
    if (rule.const !== undefined && value !== rule.const) errors.push(path + ': unsupported version');
    if (rule.enum && rule.enum.indexOf(value) < 0) errors.push(path + ': invalid enum');
    if (type === 'string' && rule.pattern && !(new RegExp(rule.pattern)).test(value)) errors.push(path + ': invalid or blank text');
    if (type === 'number' && !Number.isFinite(value)) errors.push(path + ': invalid number');
    if (type === 'array' && rule.minItems && value.length < rule.minItems) errors.push(path + ': too few items');
    if (type === 'object') {
      rule.required.forEach(function (key) { if (!Object.prototype.hasOwnProperty.call(value, key)) errors.push(path + '.' + key + ': missing'); });
      Object.keys(value).forEach(function (key) {
        if (!Object.prototype.hasOwnProperty.call(rule.properties, key)) errors.push(path + '.' + key + ': unexpected field');
        else validateShape(value[key], rule.properties[key], path + '.' + key, errors);
      });
    }
    if (type === 'array') value.forEach(function (v, i) { validateShape(v, rule.items, path + '[' + i + ']', errors); });
  }
  function pointer(record, path) {
    if (!/^\//.test(path)) return undefined;
    return path.slice(1).split('/').reduce(function (v, key) {
      key = key.replace(/~1/g, '/').replace(/~0/g, '~');
      return v && Object.prototype.hasOwnProperty.call(v, key) ? v[key] : undefined;
    }, record);
  }
  function safeUrl(url) {
    return typeof url === 'string' && /^https:\/\/[^\s<>]+$/i.test(url);
  }
  // Only call after shape validation. Omitted, null and empty optional fields
  // become the same internal form; meaningful numeric zero is never discarded.
  function normalize(raw) {
    var b = JSON.parse(JSON.stringify(raw));
    var trim = function (v) { return v == null ? '' : v.trim(); };
    var list = function (v) { return (v || []).map(trim).filter(Boolean); };
    b.sources = (b.sources || []).map(function (s) { return Object.assign(s, { description: trim(s.description), url: trim(s.url) || null }); });
    b.reviewNotes = list(b.reviewNotes);
    b.s1.items.forEach(function (s) { s.dataRefs = list(s.dataRefs); s.sourceIds = list(s.sourceIds); });
    b.s2.why = trim(b.s2.why); b.s2.checks = list(b.s2.checks); b.s2.sourceIds = list(b.s2.sourceIds);
    b.s3.notes = list(b.s3.notes);
    b.s3.options = (b.s3.options || []).map(function (o) {
      o.summary = trim(o.summary); o.details = list(o.details); o.sourceIds = list(o.sourceIds);
      o.products = (o.products || []).map(function (p) {
        p.productId = trim(p.productId); p.category = trim(p.category); p.riskLevel = trim(p.riskLevel);
        p.reason = trim(p.reason); p.notes = list(p.notes); p.sourceIds = list(p.sourceIds); p.metrics = p.metrics || [];
        return p;
      });
      return o;
    });
    b.s4 = b.s4 || {}; b.s4.opening = trim(b.s4.opening); b.s4.notices = list(b.s4.notices);
    b.s4.reactions = b.s4.reactions || []; b.s4.sourceIds = list(b.s4.sourceIds);
    b.s5 = b.s5 || {}; b.s5.tips = (b.s5.tips || []).map(function (t) { return Object.assign(t, { body: trim(t.body), sourceIds: list(t.sourceIds) }); });
    b.s5.actions = (b.s5.actions || []).map(function (a) { return Object.assign(a, { screenCode: trim(a.screenCode) || null, description: trim(a.description) }); });
    b.s5.sourceIds = list(b.s5.sourceIds);
    return b;
  }
  function validate(output, customer) {
    var errors = [];
    validateShape(output, schema, 'briefing', errors);
    if (errors.length) return errors;
    output = normalize(output);
    if (output.caseId !== customer.briefingMeta.caseId) errors.push('caseId: customer mismatch');
    if (output.customerId !== customer.customer.customerId) errors.push('customerId: customer mismatch');
    if (output.asOfDate !== customer.briefingMeta.asOfDate) errors.push('asOfDate: customer mismatch');
    var ids = output.sources.map(function (s) { return s.id; });
    if (new Set(ids).size !== ids.length) errors.push('sources: duplicate id');
    var optionIds = output.s3.options.map(function (s) { return s.id; });
    if (new Set(optionIds).size !== optionIds.length) errors.push('s3: duplicate option id');
    output.s3.options.forEach(function (o) {
      var productIds = o.products.map(function (p) { return p.productId; }).filter(Boolean);
      if (new Set(productIds).size !== productIds.length) errors.push('s3: duplicate product id within option');
      o.products.forEach(function (p) {
        if (!p.sourceIds.length) errors.push('s3: product has no evidence');
        p.metrics.forEach(function (m) {
          if (!!m.validFrom !== !!m.validUntil) errors.push('s3: metric validity requires both dates');
          if (m.validFrom && m.validUntil && m.validFrom > m.validUntil) errors.push('s3: metric validity dates reversed');
        });
      });
    });
    output.sources.forEach(function (s) { if (s.url !== null && !safeUrl(s.url)) errors.push('sources.' + s.id + ': invalid URL'); });
    function walk(v) {
      if (!v || typeof v !== 'object') return;
      Object.keys(v).forEach(function (key) {
        if (key === 'sourceIds') v[key].forEach(function (id) { if (ids.indexOf(id) < 0) errors.push('unknown source: ' + id); });
        else if (key === 'dataRefs') v[key].forEach(function (ref) { if (pointer(customer, ref) === undefined) errors.push('unknown customer field: ' + ref); });
        else walk(v[key]);
      });
    }
    walk(output);
    output.s1.items.forEach(function (item) { if (!item.text.trim() || (!item.dataRefs.length && !item.sourceIds.length)) errors.push('s1: fact has no evidence'); });
    output.s5.actions.forEach(function (a) { if (a.screenCode !== null && !/^\d{2}-\d{2}-\d{3}$/.test(a.screenCode)) errors.push('invalid screen code'); });
    if (output.status === 'ready' && output.reviewNotes.length) errors.push('ready briefing has unresolved review notes');
    return errors;
  }
  function money(value) {
    if (value == null) return '확인 필요';
    if (value === 0) return '0원';
    if (value % 10000 === 0) {
      var eok = Math.floor(value / 100000000), man = (value % 100000000) / 10000;
      return (eok ? eok.toLocaleString('ko-KR') + '억' + (man ? ' ' : '원') : '') + (man ? man.toLocaleString('ko-KR') + '만원' : '');
    }
    return value.toLocaleString('ko-KR') + '원';
  }
  function percent(value) { return value == null ? '—' : (value > 0 ? '+' : '') + value.toLocaleString('ko-KR', { maximumFractionDigits: 2 }) + '%'; }
  return { version: VERSION, schema: schema, validate: validate, normalize: normalize,
    contentSchema: contentSchema, contentOf: contentOf, validateContent: validateContent, normalizeContent: normalizeContent, checkShape: checkShape,
    pointer: pointer, safeUrl: safeUrl, money: money, percent: percent };
});

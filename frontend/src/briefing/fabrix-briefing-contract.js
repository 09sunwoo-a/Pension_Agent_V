/* Fixed wire contract for briefing tests. Backend logic is intentionally absent. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./briefing-contract'));
  else root.PensionFabrixContract = factory(root.PensionBriefingContract);
})(typeof window === 'undefined' ? globalThis : window, function (contentContract) {
  'use strict';
  var VERSION = 'customer-briefing-api.v1';
  var text = { type: 'string', pattern: '\\S' };
  function object(properties) { return { type: 'object', properties: properties, required: Object.keys(properties), additionalProperties: false }; }
  var identity = { request_id: text, case_id: text, customer_id: text, as_of_date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' } };
  var answerSchema = object({ event: { type: 'string', const: 'answer' }, data: object(Object.assign({
    schema_version: { type: 'string', const: VERSION }, answer_type: { type: 'string', const: 'briefing' }
  }, identity, { briefing: contentContract.contentSchema })) });
  var errorSchema = object({ event: { type: 'string', const: 'error' }, request_id: text, message: text });
  function request(customer, requestId, employee) {
    return { schema_version: VERSION, task: 'customer_briefing', request_id: requestId,
      message: '제공된 고객 스냅샷을 기준으로 S1~S5 고객별 브리핑을 작성해 주세요.',
      x_client_user: employee || '', case_id: customer.briefingMeta.caseId,
      customer_id: customer.customer.customerId, as_of_date: customer.briefingMeta.asOfDate,
      customer_data: JSON.parse(JSON.stringify(customer)) };
  }
  function answer(requestData, briefing) {
    var data = { schema_version: VERSION, answer_type: 'briefing' };
    Object.keys(identity).forEach(function (key) { data[key] = requestData[key]; });
    data.briefing = briefing;
    return { event: 'answer', data: data };
  }
  function validate(event, req) {
    if (event && event.event === 'error') {
      var errorShape = contentContract.checkShape(event, errorSchema);
      if (errorShape.length) return { ok: false, code: 'SCHEMA' };
      return { ok: false, code: event.request_id === req.request_id ? 'AGENT' : 'IDENTITY' };
    }
    if (event && event.data && event.data.schema_version !== VERSION) return { ok: false, code: 'VERSION' };
    if (contentContract.checkShape(event, answerSchema).length) return { ok: false, code: 'SCHEMA' };
    if (Object.keys(identity).some(function (key) { return event.data[key] !== req[key]; })) return { ok: false, code: 'IDENTITY' };
    if (contentContract.validateContent(event.data.briefing, req.customer_data).length) return { ok: false, code: 'SCHEMA' };
    return { ok: true, content: event.data.briefing };
  }
  return { version: VERSION, answerSchema: answerSchema, errorSchema: errorSchema, request: request, answer: answer, validate: validate };
});

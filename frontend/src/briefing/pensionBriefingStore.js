/* Frontend-only state. No fetch, FabriX envelope, UI code or customer mutations. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./briefing-contract'));
  else root.PensionBriefingStore = factory(root.PensionBriefingContract);
})(typeof window === 'undefined' ? globalThis : window, function (contract) {
  'use strict';
  var copy = function (v) { return JSON.parse(JSON.stringify(v)); };
  function create(records, onChange) {
    var customers = new Map(), entries = new Map(), serial = 0;
    records.forEach(function (record) {
      var id = record.briefingMeta.caseId;
      if (customers.has(id)) throw new Error('Duplicate caseId: ' + id);
      customers.set(id, copy(record));
      entries.set(id, { phase: 'empty', content: null, status: 'draft', errors: [], request: null });
    });
    function changed(id, contentChanged) { if (onChange) onChange(id, !!contentChanged); }
    function context(id) {
      var r = customers.get(id);
      return r ? { caseId: id, customerId: r.customer.customerId, asOfDate: r.briefingMeta.asOfDate } : null;
    }
    function begin(id) {
      var e = entries.get(id), c = context(id);
      if (!e) return null;
      var ticket = Object.freeze(Object.assign({ requestId: ++serial }, c));
      e.request = ticket; e.phase = 'loading'; e.errors = [];
      changed(id, false);
      return ticket;
    }
    // Tickets are opaque, local request handles; callers must retain the exact
    // object. A response cannot choose a customer or change the header snapshot.
    function current(ticket) {
      var e = ticket && entries.get(ticket.caseId);
      return e && e.request === ticket ? e : null;
    }
    function stale() { return { ok: false, stale: true, errors: ['Inactive or superseded request'] }; }
    function fail(ticket, errors) {
      var e = current(ticket);
      if (!e) return stale();
      e.request = null; e.phase = 'error';
      // Internal diagnostics only. Never display raw server errors in the UI.
      e.errors = Array.isArray(errors) ? errors.map(String) : ['Briefing request failed'];
      changed(ticket.caseId, false);
      return { ok: false, errors: e.errors.slice() };
    }
    function receive(ticket, content) {
      if (!current(ticket)) return stale();
      var errors = contract.validateContent(content, customers.get(ticket.caseId));
      if (errors.length) return fail(ticket, errors);
      var e = current(ticket);
      e.content = contract.normalizeContent(content); e.status = 'draft';
      e.phase = 'loaded'; e.errors = []; e.request = null;
      changed(ticket.caseId, true);
      return { ok: true, errors: [] };
    }
    function cancel(id) {
      var e = entries.get(id);
      if (!e || !e.request) return;
      e.request = null; e.phase = e.content ? 'loaded' : 'empty'; e.errors = [];
      changed(id, false);
    }
    function clear(id) {
      var e = entries.get(id);
      if (!e) return false;
      e.request = null; e.content = null; e.phase = 'empty'; e.status = 'draft'; e.errors = [];
      changed(id, true); return true;
    }
    // Compatibility/import boundary for existing v2 fixture documents only.
    // Validate before begin(): a rejected legacy import must not cancel a request.
    function setOutput(output) {
      var r = output && customers.get(output.caseId);
      if (!r) return { ok: false, errors: ['Unknown caseId'] };
      var errors = contract.validate(output, r);
      if (errors.length) return { ok: false, errors: errors };
      var result = receive(begin(output.caseId), contract.contentOf(output));
      entries.get(output.caseId).status = output.status;
      changed(output.caseId, false);
      return result;
    }
    return {
      begin: begin, receive: receive, fail: fail, cancel: cancel, clear: clear, setOutput: setOutput, context: context,
      // Return copies; renderers and callers cannot overwrite customer facts.
      customer: function (id) { return customers.has(id) ? copy(customers.get(id)) : null; },
      customers: function () { return Array.from(customers.values()).map(copy); },
      read: function (id) { var e = entries.get(id); return e ? copy({ phase: e.phase, content: e.content, status: e.status, errors: e.errors }) : null; }
    };
  }
  return { create: create };
});

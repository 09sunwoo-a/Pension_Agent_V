/* Thin composition layer: local customer facts + briefing content received from
 * the Agent. No network requests here. Keep legacy demo rendering independent.
 */
(function (window) {
  'use strict';
  var fixtures = window.PensionBriefingFixtures;
  var CustomerView = window.PensionCustomerView, BriefingView = window.PensionBriefingView;
  if (!fixtures || !CustomerView || !BriefingView || !window.PensionBriefingStore) return;
  var revision = 0;
  var store = window.PensionBriefingStore.create(fixtures.customers, function (id, contentChanged) {
    var instance = window.PensionAgentDemoInstance;
    if (!instance || instance.state.sel !== id) return;
    var patch = { briefingRevision: ++revision };
    if (contentChanged) Object.assign(patch, { bfSol: null, bfReact: null, briefingSourcesOpen: false });
    instance.setState(patch);
  });
  var records = store.customers();
  var noBriefing = {};
  (fixtures.noBriefing || []).forEach(function (id) { noBriefing[id] = true; });
  // The main list shows the case customers next to the legacy demo rows. Cases kept out of the
  // list (none today) stay reachable from the case picker and search.
  var QUEUE_EXCLUDED = {};
  // Legacy demo rows replaced by the conversational-agent versions of the same customers
  // (C01-10 김서연, C01-12 이수민, C01-11 박정호). Their mock code stays in pensionAgentDemo.js unused.
  var LEGACY_HIDDEN = { ksy: true, lsm: true, pjh: true };
  var queued = records.filter(function (r) { return !QUEUE_EXCLUDED[r.briefingMeta.caseId]; });
  var asOfDate = (function () {
    var count = {}, best = null;
    queued.forEach(function (r) { var d = r.briefingMeta.asOfDate; count[d] = (count[d] || 0) + 1; if (best == null || count[d] > count[best]) best = d; });
    return best;
  })();
  function view(component, base) {
    var id = component.state.sel, record = store.customer(id), entry = store.read(id);
    base.briefingLabels = BriefingView.labels;
    base.structuredBrief = !!record; base.legacyBrief = !record;
    base.briefingTilesClass = record ? 'pad-tiles--structured' : '';
    base.hasBriefingState = false;
    if (!record) return base;
    Object.assign(base, CustomerView.build(record));
    base.panelOpen = false; base.panelClosed = false; base.showLegacyTip = false;
    if (QUEUE_EXCLUDED[id]) {
      // Not in the main list: 다음 고객 walks the structured cases instead of the queue order.
      base.goNext = function () {
        var index = records.findIndex(function (r) { return r.briefingMeta.caseId === id; });
        component.select(records[(index + 1) % records.length].briefingMeta.caseId, true);
      };
    }
    base.hasAiBrief = !!entry.content; base.noAiBrief = !entry.content;
    base.briefingAvailable = !noBriefing[id];
    base.hasBriefingError = false;
    base.hasBriefingState = entry.phase === 'loading' || entry.phase === 'error';
    base.briefingPhase = entry.phase;
    base.briefingStateText = entry.phase === 'loading'
      ? '브리핑을 불러오는 중입니다.' + (entry.content ? ' 이전 브리핑을 표시합니다.' : '')
      : '브리핑을 불러오지 못했습니다.' + (entry.content ? ' 이전 브리핑을 유지합니다.' : ' 다시 요청해 주세요.');
    base.briefingAnalysisLabel = record.briefingMeta.asOfDate.replace(/-/g, '.') + ' 기준 · 브리핑 초안';
    base.bfName = record.customer.name;
    if (entry.content) Object.assign(base, BriefingView.build(entry.content, component));
    return base;
  }
  function install(Component) {
    var originalProfile = Component.prototype.profileOf, originalRender = Component.prototype.renderVals;
    var originalSelect = Component.prototype.select;
    var originalDir = Object.getOwnPropertyDescriptor(Component.prototype, 'DIR').get;
    var originalData = Object.getOwnPropertyDescriptor(Component.prototype, 'DATA').get;
    Component.prototype.select = function (id) {
      if (this.state.sel !== id) store.cancel(this.state.sel);
      return originalSelect.apply(this, arguments);
    };
    Component.prototype.profileOf = function (c) {
      var record = c && store.customer(c.id);
      return record ? CustomerView.profile(record) : originalProfile.call(this, c);
    };
    // Main-list rows: legacy demo rows first in their own order, then the case customers.
    // The queue renderer sorts by 관리 필요도 across both sets.
    Object.defineProperty(Component.prototype, 'DATA', { configurable: true, get: function () {
      if (!this._queueRows) this._queueRows = originalData.call(this).filter(function (c) { return !LEGACY_HIDDEN[c.id]; }).concat(queued.map(CustomerView.row));
      return this._queueRows;
    } });
    // The legacy directory already contains DATA; add only the cases kept out of the list.
    Object.defineProperty(Component.prototype, 'DIR', { configurable: true, get: function () {
      if (!this._caseDirectory) this._caseDirectory = originalDir.call(this).filter(function (c) { return !LEGACY_HIDDEN[c.id]; }).concat(records.filter(function (r) { return QUEUE_EXCLUDED[r.briefingMeta.caseId]; }).map(CustomerView.stub));
      return this._caseDirectory;
    } });
    Component.prototype.asOfDate = asOfDate;
    Component.prototype.renderVals = function () { return view(this, originalRender.call(this)); };
  }
  window.PensionBriefingAdapter = {
    install: install,
    // Customers shipped as snapshots only: no stored briefing, so no Agent request.
    hasBriefing: function (id) { return !noBriefing[id]; },
    // Retain the exact local ticket until response arrival. No customer payload.
    begin: store.begin, receive: store.receive, fail: store.fail, cancel: store.cancel,
    clear: store.clear, getContext: store.context, getCustomerForRequest: store.customer
  };
})(window);

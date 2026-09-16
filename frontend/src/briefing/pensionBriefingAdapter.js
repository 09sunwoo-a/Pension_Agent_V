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
  var sampleLabels = { 'DEMO-01': '대표 · 상품 제안', 'B01-22': '대표 · 업무 제안', 'B06-13': '대표 · 미확인 정보' };
  function view(component, base) {
    var id = component.state.sel, record = store.customer(id), entry = store.read(id);
    base.briefingLabels = BriefingView.labels;
    base.hasCaseLibrary = true;
    base.openCaseLibrary = function () { component.select('B01-22', true); };
    base.caseChoices = [{ id: 'ksy', label: '기존 데모 · 김서연', selected: id === 'ksy' }].concat(records.map(function (r) {
      return { id: r.briefingMeta.caseId, label: (sampleLabels[r.briefingMeta.caseId] || r.briefingMeta.caseId) + ' · ' + r.customer.name, selected: id === r.briefingMeta.caseId };
    }));
    if (!record && id && id !== 'ksy') base.caseChoices.unshift({ id: id, label: '기존 데모 · ' + base.selName, selected: true });
    base.onCaseChange = function (e) { component.select(e.target.value, true); };
    base.structuredBrief = !!record; base.legacyBrief = !record;
    base.briefingTilesClass = record ? 'pad-tiles--structured' : '';
    base.hasBriefingState = false;
    if (!record) return base;
    Object.assign(base, CustomerView.build(record));
    base.panelOpen = false; base.panelClosed = false; base.showLegacyTip = false;
    base.goNext = function () {
      var index = records.findIndex(function (r) { return r.briefingMeta.caseId === id; });
      component.select(records[(index + 1) % records.length].briefingMeta.caseId, true);
    };
    base.hasAiBrief = !!entry.content; base.noAiBrief = !entry.content;
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
    Component.prototype.select = function (id) {
      if (this.state.sel !== id) store.cancel(this.state.sel);
      return originalSelect.apply(this, arguments);
    };
    Component.prototype.profileOf = function (c) {
      var record = c && store.customer(c.id);
      return record ? CustomerView.profile(record) : originalProfile.call(this, c);
    };
    Object.defineProperty(Component.prototype, 'DIR', { configurable: true, get: function () {
      if (!this._caseDirectory) this._caseDirectory = originalDir.call(this).concat(records.map(CustomerView.stub));
      return this._caseDirectory;
    } });
    Component.prototype.renderVals = function () { return view(this, originalRender.call(this)); };
  }
  window.PensionBriefingAdapter = {
    install: install,
    // Retain the exact local ticket until response arrival. No customer payload.
    begin: store.begin, receive: store.receive, fail: store.fail, cancel: store.cancel,
    clear: store.clear, getContext: store.context, getCustomerForRequest: store.customer
  };
})(window);

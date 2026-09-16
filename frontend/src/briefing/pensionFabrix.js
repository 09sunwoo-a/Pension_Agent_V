/* FabriX briefing controller. The connection config is injected at runtime by
 * Starroot (PG_<code>.onParam(params).fabrix) or window.__PENSION_FABRIX_CONFIG.
 * It stays in JS memory until the page is destroyed; never persist or log cfg,
 * responses or customer data. Each structured case is requested once per mount.
 */
(function (window) {
  'use strict';
  if (window.PensionFabrix && window.PensionFabrix.destroy) window.PensionFabrix.destroy();
  var transport = window.PensionFabrixTransport, wire = window.PensionFabrixContract;
  var bridge = window.PensionBriefingAdapter, cfg = null, configCode = 'NOCONFIG', active = null, serial = 0;
  var diagnostics = new Map(), loaded = new Set();
  var messages = {
    NOCONFIG: '연결 설정 없음: 화면 진입 시 onParam params.fabrix 또는 window.__PENSION_FABRIX_CONFIG로 설정을 주입해 주세요.',
    CONFIG: '설정 오류: 주입된 endpoint·인증값·Agent ID(양의 정수)·직원 ID를 확인해 주세요.',
    AUTH: '인증 실패: 토큰·클라이언트 값과 호출 권한을 확인해 주세요.',
    HTTP: 'HTTP 오류: 사내 Network 탭에서 응답 상태를 확인해 주세요.',
    NETWORK: '연결 실패: 네트워크·Origin/CORS·인증서 정책을 확인해 주세요.',
    CONTENT_TYPE: '응답 형식 오류: text/event-stream이 필요합니다.', STREAM: '이 환경에서 응답 스트림을 읽을 수 없습니다.',
    SSE: 'SSE 형식 오류: 이벤트 구분과 JSON 인코딩을 확인해 주세요.',
    JSON: 'JSON 파싱 오류: content에 완성된 Agent 이벤트 JSON 문자열이 필요합니다.',
    SCHEMA: '규격 오류: S1~S5 필드·필수값·근거 참조를 확인해 주세요.',
    VERSION: '버전 오류: customer-briefing-api.v1 응답이 필요합니다.',
    IDENTITY: '고객 연결 오류: 요청 ID·고객 ID·케이스·기준일이 일치하지 않습니다.',
    AGENT: 'Agent가 오류 이벤트를 반환했습니다. 서버 측 처리를 확인해 주세요.',
    EMPTY: '빈 응답: 완성된 answer 이벤트가 수신되지 않았습니다.',
    TRUNCATED: '응답 중단: 스트림이 잘렸거나 생성 길이 제한에 도달했습니다.',
    MULTIPLE: '규격 오류: 한 요청에는 최종 answer 또는 error 이벤트 하나만 반환해야 합니다.',
    LIMIT: '응답 크기가 프론트의 허용 범위를 초과했습니다.',
    GATEWAY: 'FabriX Gateway 오류: Connector 상태를 확인해 주세요.',
    TIMEOUT: '응답 시간 초과(90초): 재요청하거나 Agent 처리 시간을 확인해 주세요.',
    ABORTED: '요청을 취소했습니다. 이전 브리핑을 유지합니다.'
  };
  function refresh() {
    var app = window.PensionAgentDemoInstance;
    if (app) app.setState({ fabrixRevision: ++serial });
  }
  function cancel() {
    if (!active) return;
    var pending = active; active = null;
    pending.controller.abort(); bridge.cancel(pending.caseId);
    diagnostics.set(pending.caseId, { code: 'ABORTED' }); refresh();
  }
  function configure(input) {
    cancel();
    try { cfg = transport.config(input); configCode = ''; }
    catch (_) { cfg = null; configCode = input == null ? 'NOCONFIG' : 'CONFIG'; }
    refresh();
    return cfg ? { ok: true } : { ok: false, code: configCode };
  }
  function runtimeConfig(params) {
    var injected = params && typeof params === 'object' ? params.fabrix : undefined;
    if (injected == null) injected = window.__PENSION_FABRIX_CONFIG;
    return injected == null ? null : injected;
  }
  function destroy() { cancel(); cfg = null; configCode = 'NOCONFIG'; diagnostics.clear(); loaded.clear(); }
  function requestId() {
    return window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : 'brief-' + Date.now() + '-' + (++serial);
  }
  async function request(caseId) {
    var customer = bridge.getCustomerForRequest(caseId);
    if (!customer) return { ok: false, code: 'CUSTOMER' };
    if (!cfg) return { ok: false, code: configCode };
    cancel();
    var requestCfg = cfg, req = wire.request(customer, requestId(), requestCfg.xClientUser);
    var pending = { caseId: caseId, ticket: bridge.begin(caseId), controller: new AbortController() };
    active = pending; diagnostics.set(caseId, { code: 'LOADING' }); refresh();
    try {
      var event = await transport.call(requestCfg, req, { signal: pending.controller.signal });
      if (active !== pending) return { ok: false, stale: true };
      var checked = wire.validate(event, req);
      if (!checked.ok) throw { code: checked.code };
      var result = bridge.receive(pending.ticket, checked.content);
      if (result.stale) return result;
      if (!result.ok) throw { code: 'SCHEMA' };
      loaded.add(caseId); diagnostics.set(caseId, { code: 'SUCCESS' });
      return { ok: true };
    } catch (error) {
      if (active !== pending) return { ok: false, stale: true };
      var code = Object.prototype.hasOwnProperty.call(messages, error.code) ? error.code : 'NETWORK';
      bridge.fail(pending.ticket, [code]); diagnostics.set(caseId, { code: code });
      return { ok: false, code: code };
    } finally {
      if (active === pending) { active = null; refresh(); }
    }
  }
  function ensure(caseId) {
    if (!cfg || loaded.has(caseId) || (active && active.caseId === caseId)) return;
    request(caseId);
  }
  function view(component, base) {
    var id = component.state.sel, busy = !!active && active.caseId === id;
    var diagnostic = cfg ? diagnostics.get(id) : { code: configCode };
    base.fabrixEnabled = !!base.structuredBrief;
    base.fabrixConfigured = !!cfg;
    base.fabrixCanRequest = !!base.structuredBrief && !!cfg && !busy;
    base.fabrixBusy = busy;
    base.fabrixRequest = function () { request(component.state.sel); };
    base.fabrixCancel = cancel;
    base.fabrixDiagnostic = !diagnostic ? '' : diagnostic.code === 'LOADING' ? '호출 중 · 최종 응답을 기다립니다.'
      : diagnostic.code === 'SUCCESS' ? '정상 수신 · 내용 검토 전 초안입니다.' : messages[diagnostic.code];
    base.fabrixDiagnosticCode = diagnostic ? diagnostic.code : '';
    return base;
  }
  function install(Component) {
    var originalRender = Component.prototype.renderVals, originalSelect = Component.prototype.select;
    var originalMount = Component.prototype.componentDidMount, originalUnmount = Component.prototype.componentWillUnmount;
    Component.prototype.componentDidMount = function () {
      if (originalMount) originalMount.apply(this, arguments);
      configure(runtimeConfig(this.props.starrootParams));
    };
    Component.prototype.select = function (id) {
      if (this.state.sel !== id) cancel();
      var result = originalSelect.apply(this, arguments);
      if (this.state.sel === id) ensure(id);
      return result;
    };
    Component.prototype.renderVals = function () {
      var base = view(this, originalRender.call(this)), back = base.goBack;
      base.goBack = function () { cancel(); if (back) back(); };
      return base;
    };
    Component.prototype.componentWillUnmount = function () { destroy(); return originalUnmount.apply(this, arguments); };
  }
  window.PensionFabrix = { configure: configure, request: request, cancel: cancel, destroy: destroy, install: install };
})(window);

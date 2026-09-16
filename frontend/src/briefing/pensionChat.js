/* "실시간 상담" panel for structured customers, backed by the conversational
 * agent through PensionChatTransport. Config comes from the runtime config's
 * `chat` block; config and transcripts live in memory until the page is
 * destroyed. Never log or persist messages, answers or credentials. */
(function (window) {
  'use strict';
  if (window.PensionChat && window.PensionChat.destroy) window.PensionChat.destroy();
  var transport = window.PensionChatTransport, bridge = window.PensionBriefingAdapter;
  var cfg = null, configCode = 'NOCONFIG', active = null, serial = 0, sessions = new Map();
  var STARTERS = ['이 고객 지금 현황은 어때?', '왜 오늘 타겟이야?', '이 고객한테 제안할 만한 게 뭐야?'];
  // The chat agent only knows its own demo customer so far; send that id for every
  // screen until its customer store is aligned with our 31 snapshots, then clear this.
  var PINNED_CUSTOMER_ID = '198734-1205842';
  var SOURCE_COLORS = { '본부 공식 자료': ['#FFF3C2', '#7A6108'], '직원 교육자료': ['#E8ECF3', '#3D4A5C'], '영업점 현장 노하우': ['#F9EFD8', '#A96A00'],
    '상담 이력': ['#F2F3F5', '#696E76'], '이번 상담 기록': ['#F2F3F5', '#696E76'], '안내 콘텐츠': ['#E6F6EF', '#047857'] };
  var messages = {
    NOCONFIG: '실시간 상담 설정(chat)이 주입되지 않아 질문을 보내지 않았습니다.',
    CONFIG: '실시간 상담 설정값 형식이 올바르지 않아 질문을 보내지 않았습니다.',
    AUTH: '인증 실패: 대화 Agent 토큰·클라이언트 값을 확인해 주세요.',
    HTTP: 'HTTP 오류가 발생했습니다. Network 탭에서 응답 상태를 확인해 주세요.',
    NETWORK: '연결에 실패했습니다. 네트워크·Origin/CORS 정책을 확인해 주세요.',
    CONTENT_TYPE: '응답 형식 오류: text/event-stream이 필요합니다.', STREAM: '이 환경에서 응답 스트림을 읽을 수 없습니다.',
    SSE: 'SSE 형식 오류가 발생했습니다.', GATEWAY: 'FabriX Gateway 오류: Connector 상태를 확인해 주세요.',
    EMPTY: '응답 이벤트가 오지 않았습니다.', TRUNCATED: '답변이 끝나기 전에 스트림이 종료되었습니다.',
    LIMIT: '응답 크기가 허용 범위를 초과했습니다.', TIMEOUT: '응답 시간 초과(180초)입니다. 다시 질문해 주세요.',
    ABORTED: '요청을 취소했습니다.'
  };
  var EMPTY = { lead: '', hasLeadSub: false, leadSub: '', streaming: false, blocks: [], footOn: false, srcBadges: [], hasGuard: false, guardSummary: '',
    evidN: 0, evidOpen: false, evid: [], guardN: 0, guardOpen: false, guard: [], hasFollow: false, follow: [], ctaOn: false, ctaAsk: '', ctaYes: '',
    clarifyOn: false, clarifyQuestion: '', clarify: [], typeLabel: '', typeBg: 'transparent', typeFg: 'transparent' };
  function noop() {}
  function refresh() {
    var app = window.PensionAgentDemoInstance;
    if (app) app.setState({ chatRevision: ++serial });
  }
  function filled(input) {
    return !!input && typeof input === 'object' && Object.keys(input).some(function (key) {
      return input[key] != null && input[key] !== '' && input[key] !== 0 && typeof input[key] !== 'object';
    });
  }
  function runtimeConfig(params) {
    var root = params && typeof params === 'object' && filled(params.fabrix) ? params.fabrix : window.__PENSION_FABRIX_CONFIG;
    var chat = root && typeof root === 'object' ? root.chat : null;
    return filled(chat) ? Object.assign({ xClientUser: root.xClientUser }, chat) : null;
  }
  function configure(input) {
    cancel();
    try { cfg = transport.config(input); configCode = ''; }
    catch (_) { cfg = null; configCode = input == null ? 'NOCONFIG' : 'CONFIG'; }
    refresh();
    return cfg ? { ok: true } : { ok: false, code: configCode };
  }
  function destroy() { cancel(); cfg = null; configCode = 'NOCONFIG'; sessions.clear(); }
  function uuid() {
    return window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : 'chat-' + Date.now() + '-' + (++serial);
  }
  // The gateway breaks input_value on lone surrogates; replace them before sending.
  function wellFormed(text) {
    if (typeof text.toWellFormed === 'function') return text.toWellFormed();
    return text.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(^|[^\uD800-\uDBFF])[\uDC00-\uDFFF]/g, function (_, before) { return (before || '') + '�'; });
  }
  function intro(customer) {
    return { k: 'sys', text: customer.customer.name + ' 고객님 상담을 도와드릴게요. 궁금한 점을 입력하거나 아래 질문으로 시작해 보세요.'
      + (PINNED_CUSTOMER_ID ? ' ※ 지금은 대화 Agent가 시연 고객(' + PINNED_CUSTOMER_ID + ') 기준으로 답합니다.' : '') };
  }
  function session(caseId, customer) {
    var s = sessions.get(caseId);
    if (!s) { s = { id: uuid(), items: [intro(customer)] }; sessions.set(caseId, s); }
    return s;
  }
  function notStatus(m) { return m.k !== 'status'; }
  function cancel() {
    if (!active) return;
    var pending = active; active = null;
    pending.controller.abort();
    var s = sessions.get(pending.caseId);
    if (s) { s.items = s.items.filter(notStatus); s.items.push({ k: 'sys', text: messages.ABORTED }); }
    refresh();
  }
  function send(caseId, text) {
    var customer = bridge.getCustomerForRequest(caseId);
    text = wellFormed(String(text == null ? '' : text)).trim().slice(0, 1000);
    if (!customer || !text || (active && active.caseId === caseId)) return;
    var s = session(caseId, customer);
    s.items.push({ k: 'user', text: text });
    if (!cfg) { s.items.push({ k: 'sys', text: messages[configCode] }); refresh(); return; }
    cancel();
    var status = { k: 'status', text: '질문 내용을 파악하고 있어요' };
    s.items.push(status);
    var pending = { caseId: caseId, controller: new AbortController(), events: [] };
    active = pending; refresh();
    var inner = { message: text, x_client_user: cfg.xClientUser, customer_id: PINNED_CUSTOMER_ID || customer.customer.customerId, session_id: s.id };
    transport.call(cfg, inner, { signal: pending.controller.signal, onEvent: function (event) {
      if (active !== pending) return;
      if (event.type === 'progress') { status.text = String(event.text || '').trim() || status.text; refresh(); }
      else pending.events.push(event);
    } }).then(function () { finish(pending, null); }, function (error) { finish(pending, error); });
  }
  function finish(pending, error) {
    if (active !== pending) return;
    active = null;
    var s = sessions.get(pending.caseId);
    s.items = s.items.filter(notStatus);
    var answer = compose(pending.events);
    if (answer) s.items.push({ k: 'ans', answer: answer });
    var failure = pending.events.filter(function (e) { return e.type === 'error'; })[0];
    if (failure) s.items.push({ k: 'sys', text: '답변에 실패했습니다. ' + String(failure.text || '').slice(0, 300) });
    else if (error) s.items.push({ k: 'sys', text: messages[error.code] || messages.NETWORK });
    refresh();
  }
  // answer.text: paragraphs split by blank lines; "- " lines become a list, a
  // quoted paragraph becomes a copyable script, and the trailing
  // "── 참고한 자료 / · <유형>" block becomes source badges.
  function parseAnswer(text) {
    var badges = [], trailer = /\n*──\s*참고한 자료\s*\n([\s\S]*)$/.exec(text);
    if (trailer) {
      badges = trailer[1].split(/\n/).map(function (line) { return line.replace(/^[\s·•\-]+/, '').trim(); }).filter(Boolean);
      text = text.slice(0, trailer.index);
    }
    var bullet = /^\s*[-•·]\s+/, lead = '', blocks = [];
    text.split(/\n\s*\n/).map(function (p) { return p.trim(); }).filter(Boolean).forEach(function (paragraph) {
      var lines = paragraph.split(/\n/);
      if (lines.length > 1 && !bullet.test(lines[0]) && lines.slice(1).every(function (l) { return bullet.test(l); })) {
        blocks.push({ t: 'p', x: lines[0].trim() }); lines = lines.slice(1);
      }
      if (lines.every(function (l) { return bullet.test(l); })) {
        blocks.push({ t: 'list', items: lines.map(function (l) { return (/^\s+/.test(l) ? '· ' : '') + l.replace(bullet, '').trim(); }) });
      } else if (/^[“"].*[”"]$/.test(paragraph.replace(/\n/g, ' '))) {
        blocks.push({ t: 'quote', x: paragraph.replace(/^[“"]|[”"]$/g, '') });
      } else if (!lead && !blocks.length) {
        lead = paragraph;
      } else {
        blocks.push({ t: 'p', x: paragraph });
      }
    });
    if (!lead && blocks.length && blocks[0].t === 'p') lead = blocks.shift().x;
    return { lead: lead, blocks: blocks, badges: badges };
  }
  function docParts(doc) {
    var s = String(doc == null ? '' : doc).trim(), open = s.lastIndexOf(' (');
    if (open > 0 && s.charAt(s.length - 1) === ')') return { name: s.slice(0, open).trim(), meta: s.slice(open + 2, -1).trim() };
    return { name: s, meta: '' };
  }
  function group(items) {
    var out = [], index = new Map();
    items.forEach(function (x) {
      var key = String(x.doc || x.title || ''), entry = index.get(key);
      if (!entry) { var d = docParts(key); entry = { doc: d.name || '자료', meta: d.meta, points: [], url: '' }; index.set(key, entry); out.push(entry); }
      var point = String(x.title == null ? '' : x.title).trim();
      if (point) entry.points.push(point + (typeof x.score === 'number' && isFinite(x.score) ? ' · 관련도 ' + x.score : ''));
      if (!entry.url && typeof x.url === 'string' && /^https:\/\//i.test(x.url)) entry.url = x.url;
    });
    return out;
  }
  function compose(events) {
    var answer = events.filter(function (e) { return e.type === 'answer'; })[0];
    if (!answer) return null;
    var listOf = function (type) {
      return events.filter(function (e) { return e.type === type; }).reduce(function (all, e) { return all.concat(Array.isArray(e.items) ? e.items : []); }, []);
    };
    var parsed = parseAnswer(String(answer.text == null ? '' : answer.text));
    var sources = listOf('sources').filter(function (x) { return x && typeof x === 'object'; });
    var action = events.filter(function (e) { return e.type === 'action'; })[0] || null;
    var clarify = events.filter(function (e) { return e.type === 'clarify'; })[0] || null;
    if (action && typeof action.text === 'string' && action.text.trim()) {
      var head = (action.to ? '받는 사람: ' + action.to + '\n' : '') + (action.title ? '제목: ' + action.title + '\n' : '');
      parsed.blocks.push({ t: 'msg', x: head + (head ? '\n' : '') + action.text.trim() });
    }
    return { lead: parsed.lead, blocks: parsed.blocks, badges: parsed.badges,
      evidence: group(sources.filter(function (x) { return x.role !== '주의'; })),
      guard: sources.filter(function (x) { return x.role === '주의'; }).map(function (x) { var d = docParts(x.doc); return { doc: d.name || '상담 원칙', meta: d.meta, point: String(x.title == null ? '' : x.title) }; }),
      follow: listOf('followups').map(function (f) { return String(f == null ? '' : f).trim(); }).filter(Boolean),
      action: action, clarify: clarify };
  }
  function message(component, id, m, i, offers, busy) {
    var out = Object.assign({ isSys: m.k === 'sys', isUser: m.k === 'user', isStatus: m.k === 'status', isAns: m.k === 'ans',
      text: m.text || '', statusLabel: m.k === 'status' ? m.text : '', onEvid: noop, onGuard: noop, onCtaYes: noop, onCtaNo: noop }, EMPTY);
    if (m.k !== 'ans') return out;
    var a = m.answer, S = component.state, key = 'chat' + i;
    var toggle = function (field) {
      return function () { component.setState(function (s) { var next = Object.assign({}, s[field]); next[i] = !next[i]; var patch = {}; patch[field] = next; return patch; }); };
    };
    out.typeLabel = 'AI 답변'; out.typeBg = '#F2F3F5'; out.typeFg = '#696E76';
    out.lead = a.lead;
    out.blocks = a.blocks.map(function (b, bi) {
      var bkey = key + '-' + bi;
      return { isP: b.t === 'p', isList: b.t === 'list', isSteps: false, isQuote: b.t === 'quote', isMsg: b.t === 'msg', isTable: false, isCaution: false, isMemory: false, isLink: false, isEvCard: false,
        x: b.x || '', title: '', hasTitle: false, kind: '', icon: '', when: '', desc: '', msg: '', msgOpen: false, msgRot: '0deg', onMsgToggle: noop, rows: [],
        items: (b.items || []).map(function (it, ii, arr) { return { no: ii + 1, t: it, title: '', desc: '', hasLine: ii < arr.length - 1 }; }),
        copyLabel: S.copied === bkey ? '복사됨 ✓' : '복사', onCopy: function () { component.copy(bkey, b.x || ''); } };
    });
    out.footOn = true;
    out.srcBadges = a.badges.map(function (t) { var c = SOURCE_COLORS[t] || ['#F2F3F5', '#696E76']; return { t: t, bg: c[0], fg: c[1], warn: false }; });
    out.evidN = a.evidence.length; out.evidOpen = !!S.agEvidOpen[i]; out.onEvid = toggle('agEvidOpen');
    out.evid = a.evidence.map(function (e) { return { doc: e.doc, meta: e.meta, points: e.points.map(function (p) { return { t: p }; }), hasUrl: !!e.url, url: e.url }; });
    out.hasGuard = a.guard.length > 0; out.guardN = a.guard.length; out.guardOpen = !!S.agGuardOpen[i]; out.onGuard = toggle('agGuardOpen'); out.guard = a.guard;
    out.hasFollow = a.follow.length > 0;
    out.follow = a.follow.map(function (f) { return { t: f, cls: 'pad-follow', onTap: function () { send(id, f); } }; });
    out.ctaOn = offers && !busy && !!a.action;
    out.ctaAsk = a.action ? String(a.action.label || a.action.prompt || '연계해드릴까요?') : ''; out.ctaYes = '네';
    out.onCtaYes = function () { send(id, '네'); }; out.onCtaNo = function () { send(id, '아니오'); };
    out.clarifyOn = offers && !busy && !!a.clarify;
    out.clarifyQuestion = a.clarify ? String(a.clarify.question || '') : '';
    out.clarify = (a.clarify && Array.isArray(a.clarify.options) ? a.clarify.options : []).map(function (o) {
      var label = String(typeof o === 'string' ? o : (o && (o.label || o.text || o.value)) || '').trim();
      return { label: label, onTap: function () { send(id, label); } };
    }).filter(function (o) { return o.label; });
    return out;
  }
  function view(component, base) {
    var id = component.state.sel, customer = id ? bridge.getCustomerForRequest(id) : null;
    if (!customer) return base;
    var S = component.state, busy = !!active && active.caseId === id;
    var s = sessions.get(id), items = s ? s.items : [intro(customer)], lastAnswer = -1;
    items.forEach(function (m, i) { if (m.k === 'ans') lastAnswer = i; });
    base.agentOn = true; base.agentOff = false; base.agName = customer.customer.name;
    base.panelOpen = !!S.panelOpen; base.panelClosed = !S.panelOpen;
    base.agMsgs = items.map(function (m, i) { return message(component, id, m, i, i === lastAnswer && lastAnswer === items.length - 1, busy); });
    base.agChipsOn = !busy && lastAnswer < 0;
    base.agChips = STARTERS.map(function (q) { return { label: q, onTap: function () { send(id, q); } }; });
    base.agInput = S.agInput || ''; base.agBusy = busy; base.agNotBusy = !busy;
    base.agOnInput = function (e) { component.setState({ agInput: e.target.value }); };
    // Enter fires before the input's change event updates state, so read the live value.
    var submit = function (text) { if (text == null) text = component.state.agInput; component.setState({ agInput: '' }); send(id, text); };
    base.agOnKey = function (e) { if (e.key === 'Enter') submit(e.target && e.target.value); };
    base.agSendTap = function () {
      var input = typeof document !== 'undefined' && document.querySelector ? document.querySelector('#pensionAgentDemo .pad-inputbar__input') : null;
      submit(input ? input.value : undefined);
    };
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
      return originalSelect.apply(this, arguments);
    };
    Component.prototype.renderVals = function () {
      var base = view(this, originalRender.call(this)), back = base.goBack;
      base.goBack = function () { cancel(); if (back) back(); };
      return base;
    };
    Component.prototype.componentWillUnmount = function () { destroy(); return originalUnmount.apply(this, arguments); };
  }
  window.PensionChat = { configure: configure, send: send, cancel: cancel, destroy: destroy, install: install, parseAnswer: parseAnswer, compose: compose, pinnedCustomerId: PINNED_CUSTOMER_ID };
})(window);

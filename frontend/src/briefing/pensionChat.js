/* "실시간 상담" panel for structured customers, backed by the conversational
 * agent through PensionChatTransport. Config comes from the runtime config's
 * `chat` block; config and transcripts live in memory until the page is
 * destroyed. Never log or persist messages, answers or credentials. */
(function (window) {
  'use strict';
  if (window.PensionChat && window.PensionChat.destroy) window.PensionChat.destroy();
  var transport = window.PensionChatTransport, bridge = window.PensionBriefingAdapter, customerView = window.PensionCustomerView;
  var cfg = null, configCode = 'NOCONFIG', active = null, serial = 0, sessions = new Map();
  var ID_PATTERN = /^[A-Za-z0-9._-]{3,40}$/;
  var ASK_ID = '고객 식별자를 입력해 주세요.';
  // The agent leaves its own offer sentence as the last line of answer.text ("— … (네 / 아니오)") and
  // sends the same sentence as action.prompt; the buttons replace that line (agent tools/history.py regex).
  var OFFER_TRAILER = /\n*— [^\n]*\(네 \/ 아니오\)\s*$/;
  // Same line when the material-marks block ("── 참고한 자료") follows it instead of ending the text.
  var OFFER_BEFORE_MARKS = /\n*— [^\n]*\(네 \/ 아니오\)\s*(?=\n\s*\n──\s*참고한 자료)/;
  var FENCE = /```[\s\S]*?```\n*/;
  // Terminal deep links the agent computes (effects/screens.py); the page never assembles one itself.
  var SCREEN_LINK = /^mystar-link:\/\//i;
  // Older agent builds put the deep link URL in the answer text instead of (or as well as) answer.links.
  var URL_IN_TEXT = /mystar-link:\/\/[^\s"'<>)\]]+/gi;
  var SCREEN_NO = /\d{2}-\d{2}-\d{3}/g;
  // Replies the agent itself reads as consent (nodes/act.py _YES); an answer with a link after one of these is an accepted proposal.
  var YES_WORDS = ['네', '예', '웅', '응', '그래', '좋아', '열어', '연계', '해줘', '해주세요', '부탁', '보내', 'ok', 'yes'];
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
    evidN: 0, evidOpen: false, evid: [], guardN: 0, guardOpen: false, guard: [], hasFollow: false, followChips: false, follow: [], ctaOn: false, ctaAsk: '', ctaYes: '',
    clarifyOn: false, clarifyQuestion: '', hasClarifyQuestion: false, clarify: [], typeLabel: '', typeBg: 'transparent', typeFg: 'transparent' };
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
  // A consultation starts on the selected customer's own id with a fresh session id;
  // 고객 변경 lets the employee switch to another identifier by typing it.
  function intro(customer) { return customer.customer.name + ' 고객님 상담을 시작해요. 상담 중 궁금한 내용을 바로 물어보세요.'; }
  function session(caseId) {
    var s = sessions.get(caseId);
    if (!s) {
      var customer = bridge.getCustomerForRequest(caseId);
      s = { id: uuid(), customerId: customer.customer.customerId, items: [{ k: 'sys', text: intro(customer) }] };
      sessions.set(caseId, s);
    }
    return s;
  }
  function startCustomer(s, customerId) {
    s.customerId = customerId; s.id = uuid();
    s.items.push({ k: 'sys', text: '고객 ' + customerId + ' 기준으로 상담을 시작합니다. 궁금한 점을 입력해 주세요.' });
  }
  function resetCustomer(caseId) {
    var s = sessions.get(caseId);
    if (!s || !s.customerId) return;
    if (active && active.caseId === caseId) cancel();
    s.customerId = null; s.id = uuid();
    s.items.push({ k: 'sys', text: '다른 고객으로 상담을 시작합니다. ' + ASK_ID });
    refresh();
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
  // Returns true when the text was consumed (customer id taken, sent, or kept with a note).
  function send(caseId, text) {
    var customer = bridge.getCustomerForRequest(caseId);
    text = wellFormed(String(text == null ? '' : text)).trim().slice(0, 1000);
    if (!customer || !text || (active && active.caseId === caseId)) return false;
    var s = session(caseId);
    s.items.push({ k: 'user', text: text });
    if (!s.customerId) {
      if (ID_PATTERN.test(text)) startCustomer(s, text);
      else s.items.push({ k: 'sys', text: '고객 식별자 형식을 확인해 주세요. 예: 198734-1205842' });
      refresh(); return true;
    }
    if (!cfg) { s.items.push({ k: 'sys', text: messages[configCode] }); refresh(); return true; }
    cancel();
    var status = { k: 'status', text: '질문 내용을 파악하고 있어요' };
    s.items.push(status);
    var pending = { caseId: caseId, controller: new AbortController(), events: [] };
    active = pending; refresh();
    var inner = { message: text, x_client_user: cfg.xClientUser, customer_id: s.customerId, session_id: s.id };
    transport.call(cfg, inner, { signal: pending.controller.signal, onEvent: function (event) {
      if (active !== pending) return;
      if (event.type === 'progress') { status.text = String(event.text || '').trim() || status.text; refresh(); }
      else pending.events.push(event);
    } }).then(function () { finish(pending, null); }, function (error) { finish(pending, error); });
    return true;
  }
  function finish(pending, error) {
    if (active !== pending) return;
    active = null;
    var s = sessions.get(pending.caseId);
    s.items = s.items.filter(notStatus);
    var answer = compose(pending.events);
    if (answer) {
      s.items.push({ k: 'ans', answer: answer });
      // "네" to a screen proposal: the agent answers with the proposal label and the deep link; open it right away.
      var lastUser = s.items.filter(function (it) { return it.k === 'user'; }).pop();
      if (answer.links.length && (answer.intent === 'confirm_action' || saidYes(lastUser && lastUser.text))) {
        var first = answer.links[0], auto = openScreen(first.url);
        // Browsers may refuse a script-started custom-scheme navigation once the click's user activation has
        // expired (the agent takes seconds to answer), so the transcript always keeps a button the employee can press.
        s.items.push({ k: 'open', url: first.url, label: first.label, screen: first.screen, auto: auto });
      }
    }
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
    var links = (Array.isArray(answer.links) ? answer.links : []).filter(function (l) {
      return l && typeof l.screen === 'string' && l.screen && typeof l.url === 'string' && l.url;
    }).map(function (l) { return { screen: l.screen, url: l.url, label: String(l.label || l.screen) }; });
    String(answer.text == null ? '' : answer.text).split(/\n/).forEach(function (line) {
      (line.match(URL_IN_TEXT) || []).forEach(function (url) {
        if (links.some(function (l) { return l.url === url; })) return;
        var before = line.slice(0, line.indexOf(url)), nos = before.match(SCREEN_NO), digits = (/scnNo=(\d{7})/.exec(url) || [])[1];
        var screen = nos ? nos[nos.length - 1] : digits ? digits.slice(0, 2) + '-' + digits.slice(2, 4) + '-' + digits.slice(4) : '';
        links.push({ screen: screen, url: url, label: screen ? screen + ' 화면' : '단말 화면' });
      });
    });
    var listOf = function (type) {
      return events.filter(function (e) { return e.type === type; }).reduce(function (all, e) { return all.concat(Array.isArray(e.items) ? e.items : []); }, []);
    };
    var sources = listOf('sources').filter(function (x) { return x && typeof x === 'object'; });
    var action = events.filter(function (e) { return e.type === 'action'; })[0] || null;
    var clarify = events.filter(function (e) { return e.type === 'clarify'; })[0] || null;
    var text = String(answer.text == null ? '' : answer.text);
    if (action) {
      // A memo offer replaces the body with the fenced draft; the action carries the same title/text/to
      // for the msg block below, so the fence is dropped rather than shown twice.
      if (action.kind === 'memo' || /^\s*```/.test(text)) text = text.replace(FENCE, '');
      text = text.replace(OFFER_TRAILER, '').replace(OFFER_BEFORE_MARKS, '');
    }
    var parsed = parseAnswer(text);
    var options = clarify && Array.isArray(clarify.options) ? clarify.options.map(function (o) { return String(typeof o === 'string' ? o : (o && (o.label || o.text || o.value)) || '').trim(); }) : [];
    if (clarify && parsed.blocks.length) {
      // The clarify turn body repeats the options as "· " lines; the buttons replace them.
      var last = parsed.blocks[parsed.blocks.length - 1];
      if (last.t === 'list' && last.items.length === options.length && last.items.every(function (it, i) { return it.replace(/^· /, '') === options[i]; })) parsed.blocks.pop();
    }
    if (action && typeof action.text === 'string' && action.text.trim()) {
      var head = (action.to ? '받는 사람: ' + action.to + '\n' : '') + (action.title ? '제목: ' + action.title + '\n' : '');
      parsed.blocks.push({ t: 'msg', x: head + (head ? '\n' : '') + action.text.trim() });
    }
    return { lead: parsed.lead, blocks: parsed.blocks, badges: parsed.badges, links: links, intent: String(answer.intent || ''),
      evidence: group(sources.filter(function (x) { return x.role !== '주의'; })),
      guard: sources.filter(function (x) { return x.role === '주의'; }).map(function (x) { var d = docParts(x.doc); return { doc: d.name || '상담 원칙', meta: d.meta, point: String(x.title == null ? '' : x.title) }; }),
      follow: listOf('followups').map(function (f) { return String(f == null ? '' : f).trim(); }).filter(Boolean),
      action: action, clarify: clarify };
  }
  // Split text into plain and deep-link segments at every occurrence of a link's screen number.
  function segments(text, links) {
    var s = String(text == null ? '' : text), out = [], pos = 0;
    if (!links || !links.length) return [{ t: s, isText: true, isLink: false, url: '', label: '' }];
    var hits = [];
    links.forEach(function (l) {
      [l.url, l.screen].forEach(function (needle) {
        if (!needle) return;
        var at = s.indexOf(needle);
        while (at >= 0) { hits.push({ at: at, len: needle.length, link: l }); at = s.indexOf(needle, at + needle.length); }
      });
    });
    hits.sort(function (a, b) { return a.at - b.at; });
    hits.forEach(function (h) {
      if (h.at < pos) return;
      if (h.at > pos) out.push({ t: s.slice(pos, h.at), isText: true, isLink: false, url: '', label: '' });
      out.push({ t: s.slice(h.at, h.at + h.len), isText: false, isLink: true, url: h.link.url, label: h.link.label });
      pos = h.at + h.len;
    });
    if (pos < s.length || !out.length) out.push({ t: s.slice(pos), isText: true, isLink: false, url: '', label: '' });
    return out;
  }
  function openScreen(url, viaNewWindow) {
    if (!SCREEN_LINK.test(String(url || ''))) return false;
    try {
      if (viaNewWindow && typeof window.open === 'function' && window.open(url, '_blank')) return true;
      window.location.href = url; return true;
    } catch (_) { return false; }
  }
  function saidYes(text) {
    var t = String(text == null ? '' : text).trim().toLowerCase();
    return YES_WORDS.some(function (w) { return t.indexOf(w) >= 0; });
  }
  function message(component, id, m, i, offers, busy) {
    var out = Object.assign({ isSys: m.k === 'sys', isUser: m.k === 'user', isStatus: m.k === 'status', isAns: m.k === 'ans', isOpen: m.k === 'open',
      openText: m.k === 'open' ? (m.auto ? '단말 화면 열기를 요청했어요. 열리지 않으면 아래 버튼을 눌러 주세요.' : '단말 화면을 열 수 있어요.') : '',
      openLabel: m.k === 'open' ? m.label + ' (' + m.screen + ')' : '', openUrl: m.k === 'open' ? m.url : '', onOpen: m.k === 'open' ? function (e) { if (e && e.preventDefault) e.preventDefault(); openScreen(m.url, true); } : noop,
      text: m.text || '', statusLabel: m.k === 'status' ? m.text : '', onEvid: noop, onGuard: noop, onCtaYes: noop, onCtaNo: noop,
      leadSegs: [{ t: m.text || '', isText: true, isLink: false, url: '', label: '' }], hasLinkRows: false, linkRows: [] }, EMPTY);
    if (m.k !== 'ans') return out;
    var a = m.answer, S = component.state, key = 'chat' + i;
    var toggle = function (field) {
      return function () { component.setState(function (s) { var next = Object.assign({}, s[field]); next[i] = !next[i]; var patch = {}; patch[field] = next; return patch; }); };
    };
    out.typeLabel = 'AI 답변'; out.typeBg = '#F2F3F5'; out.typeFg = '#696E76';
    out.lead = a.lead; out.leadSegs = segments(a.lead, a.links);
    out.hasLinkRows = a.links.length > 0; out.linkRows = a.links.map(function (l) { return { screen: l.screen, url: l.url, label: l.label }; });
    out.blocks = a.blocks.map(function (b, bi) {
      var bkey = key + '-' + bi;
      return { isP: b.t === 'p', isList: b.t === 'list', isSteps: false, isQuote: b.t === 'quote', isMsg: b.t === 'msg', isTable: false, isCaution: false, isMemory: false, isLink: false, isEvCard: false,
        x: b.x || '', segs: segments(b.x || '', a.links), title: '', hasTitle: false, kind: '', icon: '', when: '', desc: '', msg: '', msgOpen: false, msgRot: '0deg', onMsgToggle: noop, rows: [],
        items: (b.items || []).map(function (it, ii, arr) { return { no: ii + 1, t: it, segs: segments(it, a.links), title: '', desc: '', hasLine: ii < arr.length - 1 }; }),
        // Quoted 화법 shows without a copy button (2026-09-22 request); the memo draft keeps one.
        copyOn: b.t === 'msg',
        copyLabel: S.copied === bkey ? '복사됨 ✓' : '복사', onCopy: function () { component.copy(bkey, b.x || ''); } };
    });
    out.footOn = true;
    out.srcBadges = a.badges.map(function (t) { var c = SOURCE_COLORS[t] || ['#F2F3F5', '#696E76']; return { t: t, bg: c[0], fg: c[1], warn: false }; });
    out.evidN = a.evidence.length; out.evidOpen = !!S.agEvidOpen[i]; out.onEvid = toggle('agEvidOpen');
    out.evid = a.evidence.map(function (e) { return { doc: e.doc, meta: e.meta, points: e.points.map(function (p) { return { t: p }; }), hasUrl: !!e.url, url: e.url }; });
    out.hasGuard = a.guard.length > 0; out.guardN = a.guard.length; out.guardOpen = !!S.agGuardOpen[i]; out.onGuard = toggle('agGuardOpen'); out.guard = a.guard;
    out.hasFollow = a.follow.length > 0; out.followChips = true;
    out.follow = a.follow.map(function (f) { return { t: f, onTap: function () { send(id, f); } }; });
    out.ctaOn = offers && !busy && !!a.action;
    // action.prompt is the question the agent asks; label is the proposal noun. The buttons stand in for "(네 / 아니오)".
    out.ctaAsk = a.action ? String(a.action.prompt || a.action.label || '연계해드릴까요?').replace(/\s*\(네 \/ 아니오\)\s*$/, '') : ''; out.ctaYes = '네';
    out.onCtaYes = function () { send(id, '네'); }; out.onCtaNo = function () { send(id, '아니오'); };
    out.clarifyOn = offers && !busy && !!a.clarify;
    out.clarifyQuestion = a.clarify && String(a.clarify.question || '') !== a.lead ? String(a.clarify.question || '') : '';
    out.hasClarifyQuestion = !!out.clarifyQuestion;
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
    var s = session(id), items = s.items, lastAnswer = -1;
    var customerId = s.customerId;
    items.forEach(function (m, i) { if (m.k === 'ans') lastAnswer = i; });
    base.agentOn = true; base.agentOff = false;
    // Header shows the 5자리-5자리 screen form; customer_id in the request stays the original value.
    base.agName = customerId ? customer.customer.name + ' · ' + customerView.displayId(customerId) : customer.customer.name;
    base.agResetOn = !!customerId && !busy; base.agReset = function () { resetCustomer(id); };
    base.panelOpen = !!S.panelOpen; base.panelClosed = !S.panelOpen;
    base.agMsgs = items.map(function (m, i) { return message(component, id, m, i, i === lastAnswer && lastAnswer === items.length - 1, busy); });
    base.agChipsOn = false; base.agChips = []; base.agChipsTitle = '';
    base.agInput = S.agInput || ''; base.agBusy = busy; base.agNotBusy = !busy;
    base.agOnInput = function (e) { component.setState({ agInput: e.target.value }); };
    // Enter's keydown fires before the input's change event, so read the live value and
    // clear the element itself; otherwise the late change event refills the box.
    var submit = function (input) {
      var text = input ? input.value : component.state.agInput;
      if (!send(id, text)) return;
      if (input) input.value = '';
      component.setState({ agInput: '' });
    };
    base.agOnKey = function (e) { if (e.key === 'Enter') { e.preventDefault(); submit(e.target); } };
    base.agSendTap = function () {
      submit(typeof document !== 'undefined' && document.querySelector ? document.querySelector('#pensionAgentDemo .pad-inputbar__input') : null);
    };
    return base;
  }
  // Bring the latest turn into view: the top of a new answer, otherwise the bottom.
  function scrollChat(component, previousState) {
    if (!previousState || previousState.chatRevision === component.state.chatRevision) return;
    if (typeof document === 'undefined' || !document.querySelector) return;
    var el = document.querySelector('#pensionAgentDemo [data-scroll-key="agent-chat"]');
    if (!el) return;
    var s = sessions.get(component.state.sel), last = s && s.items[s.items.length - 1];
    var answers = el.querySelectorAll('.pad-ans'), target = answers[answers.length - 1];
    if (last && last.k === 'ans' && target) el.scrollTop += target.getBoundingClientRect().top - el.getBoundingClientRect().top - 8;
    else el.scrollTop = el.scrollHeight;
  }
  function install(Component) {
    var originalRender = Component.prototype.renderVals, originalSelect = Component.prototype.select;
    var originalMount = Component.prototype.componentDidMount, originalUnmount = Component.prototype.componentWillUnmount;
    var originalUpdate = Component.prototype.componentDidUpdate;
    Component.prototype.componentDidMount = function () {
      if (originalMount) originalMount.apply(this, arguments);
      configure(runtimeConfig(this.props.starrootParams));
    };
    Component.prototype.componentDidUpdate = function (previousProps, previousState) {
      if (originalUpdate) originalUpdate.apply(this, arguments);
      scrollChat(this, previousState);
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
  window.PensionChat = { configure: configure, send: send, cancel: cancel, resetCustomer: resetCustomer, destroy: destroy, install: install,
    parseAnswer: parseAnswer, compose: compose, segments: segments };
})(window);

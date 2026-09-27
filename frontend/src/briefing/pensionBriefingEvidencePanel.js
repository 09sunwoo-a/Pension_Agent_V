/* 고객 브리핑 '분석 근거' 패널 (오세훈 C01-07처럼 응답에 analysis_trace가 있는 고객 전용).
 * 브리핑 카드의 [분석 근거] 버튼이 바로 연다. 메인 처리 이력 목록을 거치지 않는다.
 * 네 단계(고객 상황 요약 → 관리포인트 → 참고한 업무·상품 지식 → 브리핑 반영)만 보이며 한 번에 한 단계만 펼친다.
 * 표시하는 값은 검증된 같은 응답의 trace와 브리핑에서 읽는다. 원문은 textContent로만 그리며 최대 8행 뒤 '더 보기'.
 * host는 #pensionAgentDemo 안, pensionAgentMount 밖에 두고 공통 처리 이력 패널의 외형(pad-trace-*)을 재사용한다.
 */
(function (root) {
  'use strict';
  var HOST_ID = 'pad-evidence-host', PANEL_ID = 'pad-evidence-panel', RAW_LINES = 8;
  var current = null;
  var hasDom = function () { return typeof root.document === 'object' && root.document && typeof root.document.createElement === 'function' && typeof root.document.getElementById === 'function'; };
  var SECTION = { s1: 'S1', s2: 'S2', s3: 'S3', s4: 'S4', s5: 'S5' };
  var ROLE = { customer_fact: '고객 사실', case_application: '고객 적용 판단', case_followup: '후속 관리(고객 적용)', adapted_dialogue: '화법 적용', hypothetical_customer_response: '예상 반응(가정)', product_reference: '상품 참고', workflow_reference: '단말 업무 참고' };

  function el(tag, cls, text) { var n = root.document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function button(cls, text, onClick, attrs) { var b = el('button', cls, text); b.type = 'button'; if (attrs) Object.keys(attrs).forEach(function (k) { b.setAttribute(k, attrs[k]); }); b.addEventListener('click', onClick); return b; }
  function meta(pairs) {
    var dl = el('dl', 'pad-trace-meta');
    pairs.forEach(function (p) { if (p[1] == null || p[1] === '') return; var row = el('div', 'pad-trace-meta__row'); row.appendChild(el('dt', null, p[0])); var dd = el('dd'); if (typeof p[1] === 'string' || typeof p[1] === 'number') dd.textContent = p[1]; else dd.appendChild(p[1]); row.appendChild(dd); dl.appendChild(row); });
    return dl;
  }
  var clock = function (iso) { var P = root.PensionExecutionTracePanel; var p = iso && P && P.kst ? P.kst(iso) : null; return p ? p.time : (iso ? String(iso).slice(11, 23) : '—'); };
  var ms = function (n) { return n == null ? '—' : n >= 1000 ? (n / 1000).toFixed(1) + '초' : n + 'ms'; };
  var plain = function (text) { return String(text == null ? '' : text).replace(/\*\*/g, ''); };
  var short = function (text, max) { var t = plain(text); return t.length > max ? t.slice(0, max - 1) + '…' : t; };
  function formatValue(ref, value) {
    if (value === null || value === undefined) return '미확인';
    if (typeof value === 'boolean') return value ? '예' : '아니오';
    if (typeof value === 'number') return /Krw$/.test(ref) ? value.toLocaleString('ko-KR') + '원' : /Pct$/.test(ref) ? value + '%' : value.toLocaleString('ko-KR');
    // 고객식별자는 화면과 같은 5자리-5자리 표기로 보인다.
    if (/\/customerId$/.test(ref) && root.PensionCustomerView && root.PensionCustomerView.displayId) return root.PensionCustomerView.displayId(value);
    return String(value);
  }
  function refKey(ref) { var parts = ref.split('/').filter(Boolean); return parts.slice(-2).join(' / '); }
  function targetLabel(target) {
    var p = target.split('/').filter(Boolean), s = SECTION[p[0]] || p[0], n = function (i) { return Number(p[i]) + 1; };
    if (p[0] === 's1') return s + ' 문장 ' + n(2);
    if (p[0] === 's2') return s + ' ' + (p[1] === 'lead' ? '관리방향' : p[1] === 'why' ? '왜 지금' : '확인 질문 ' + n(2));
    if (p[0] === 's3') return p[1] === 'lead' ? s + ' 제안' : s + ' 옵션 ' + n(2) + ' ' + (p[3] === 'title' ? '제목' : p[3] === 'summary' ? '요약' : p[3] === 'products' ? (p[5] === 'name' ? '상품명' : p[5] === 'reason' ? '상품 이유' : '상품 유의 ' + n(6)) : p[3]);
    if (p[0] === 's4') return s + ' ' + (p[1] === 'opening' ? '도입' : p[1] === 'notices' ? '유의사항' : '반응 ' + n(2) + (p[3] === 'label' ? ' 제목' : ' 문단 ' + n(4)));
    if (p[0] === 's5') return s + ' ' + (p[1] === 'tips' ? '팁' + (p[3] === 'title' ? ' 제목' : '') : '액션 ' + n(2) + ' ' + (p[3] === 'screenCode' ? '화면' : p[3] === 'title' ? '제목' : '설명'));
    return target;
  }
  function index(list) { var m = {}; (list || []).forEach(function (x) { m[x.id] = x; }); return m; }
  function names(ids, map, key) { return ids.map(function (id) { return map[id] ? map[id][key || 'label'] || map[id].title || id : id; }).join(' · '); }
  function textBlock(text, label) { var wrap = el('div', 'pad-trace-json-wrap'); if (label) wrap.appendChild(el('div', 'pad-trace-json-label', label)); var pre = el('pre', 'pad-trace-json pad-trace-json--text', text); pre.setAttribute('tabindex', '0'); wrap.appendChild(pre); return wrap; }
  // 원문 발췌: 기본 8행, 같은 영역에서 더 보기. 원문 안의 마크업은 실행하지 않는다.
  function rawBlock(text) {
    var lines = String(text).split('\n'), wrap = el('div', 'pad-trace-json-wrap'), pre = el('pre', 'pad-trace-json pad-trace-json--text pad-evidence-raw');
    pre.setAttribute('tabindex', '0'); wrap.appendChild(pre);
    var expanded = false;
    function draw() { pre.textContent = expanded || lines.length <= RAW_LINES ? lines.join('\n') : lines.slice(0, RAW_LINES).join('\n') + '\n…'; }
    draw();
    if (lines.length > RAW_LINES) wrap.appendChild(button('pad-trace-link pad-trace-link--quiet', '더 보기 (' + (lines.length - RAW_LINES) + '행)', function (e) { expanded = !expanded; draw(); e.currentTarget.textContent = expanded ? '접기' : '더 보기 (' + (lines.length - RAW_LINES) + '행)'; }));
    return wrap;
  }
  function sentence(binding, ctx) {
    var li = el('li', 'pad-evidence-sentence');
    li.appendChild(el('div', 'pad-evidence-sentence__text', plain(binding.text)));
    var basis = [];
    if (binding.fact_ids.length) basis.push('사실 ' + names(binding.fact_ids, ctx.facts));
    if (binding.judgment_ids.length) basis.push('판단 ' + binding.judgment_ids.join(' · '));
    if (binding.evidence_ids.length) basis.push('지식 ' + names(binding.evidence_ids, ctx.cards, 'title'));
    li.appendChild(el('div', 'pad-trace-muted', targetLabel(binding.target) + ' · ' + (ROLE[binding.role] || binding.role) + (basis.length ? ' · ' + basis.join(' · ') : '')));
    return li;
  }
  function bindingsUnder(ctx, prefixes) { return ctx.trace.bindings.filter(function (b) { return prefixes.some(function (p) { return b.target === p || b.target.indexOf(p + '/') === 0; }); }); }

  /* ---------- 단계 본문 ---------- */
  function snapshotTable(group) {
    var table = el('table', 'pad-trace-table'), tbody = el('tbody');
    group.items.forEach(function (it) { var tr = el('tr'); tr.appendChild(el('td', 'pad-evidence-fact', it.label)); tr.appendChild(el('td', null, formatValue(it.ref, it.value))); tbody.appendChild(tr); });
    table.appendChild(tbody); var wrap = el('div', 'pad-trace-table-wrap'); wrap.appendChild(table); return wrap;
  }
  function customerSummaryBody(step, ctx) {
    var body = el('div', 'pad-trace-step__body');
    // 화면에 뿌려지는 고객 데이터 전체(요청 스냅샷 값)와 세그먼트를 먼저 보이고, 그 아래에 브리핑에 실제로 쓴 필드를 둔다.
    (ctx.trace.snapshot || []).forEach(function (g) { body.appendChild(el('div', 'pad-trace-json-label', g.title)); body.appendChild(snapshotTable(g)); });
    body.appendChild(el('div', 'pad-trace-json-label', '브리핑에 사용한 필드 (키 · 값)'));
    var table = el('table', 'pad-trace-table'), tbody = el('tbody');
    step.fact_ids.forEach(function (id) {
      var f = ctx.facts[id]; if (!f) return;
      f.values.forEach(function (v, i) { var tr = el('tr'); tr.appendChild(el('td', i === 0 ? 'pad-evidence-fact' : 'pad-trace-muted', i === 0 ? f.label : '')); tr.appendChild(el('td', 'pad-trace-muted', refKey(v.ref))); tr.appendChild(el('td', null, formatValue(v.ref, v.value))); tbody.appendChild(tr); });
    });
    table.appendChild(tbody); var wrap = el('div', 'pad-trace-table-wrap'); wrap.appendChild(table); body.appendChild(wrap);
    body.appendChild(el('div', 'pad-trace-json-label', '현재 S1 세 문장'));
    var ul = el('ul', 'pad-evidence-sentences'); bindingsUnder(ctx, step.target_prefixes).forEach(function (b) { ul.appendChild(sentence(b, ctx)); }); body.appendChild(ul);
    return body;
  }
  function managementFocusBody(step, ctx) {
    var body = el('div', 'pad-trace-step__body');
    body.appendChild(el('div', 'pad-trace-json-label', '확인한 사실'));
    body.appendChild(meta(step.fact_ids.map(function (id) { var f = ctx.facts[id]; return f ? [f.label, f.values.map(function (v) { return formatValue(v.ref, v.value); }).join(' · ')] : [id, '']; })));
    body.appendChild(el('div', 'pad-trace-json-label', '관리포인트 (고객 사례에 적용한 판단 · 원문 인용이 아님)'));
    step.judgment_ids.forEach(function (id) {
      var j = ctx.judgments[id]; if (!j) return;
      var box = el('div', 'pad-evidence-judgment'); box.appendChild(el('div', 'pad-evidence-judgment__text', j.summary));
      var note = [];
      if (j.evidence_ids.length) note.push('참고 지식 ' + names(j.evidence_ids, ctx.cards, 'title'));
      if (j.guard) note.push(j.guard);
      if (note.length) box.appendChild(el('div', 'pad-trace-muted', note.join(' · ')));
      body.appendChild(box);
    });
    body.appendChild(el('div', 'pad-trace-json-label', '현재 S2'));
    var ul = el('ul', 'pad-evidence-sentences'); bindingsUnder(ctx, step.target_prefixes).forEach(function (b) { ul.appendChild(sentence(b, ctx)); }); body.appendChild(ul);
    return body;
  }
  function cardRow(card, ctx, reused) {
    var li = el('li', 'pad-trace-step pad-evidence-card'), open = false;
    li.setAttribute('data-card-id', card.id); if (card.source_id) li.setAttribute('data-source-id', card.source_id);
    var head = button('pad-trace-step__head', null, function () {
      open = !open; head.setAttribute('aria-expanded', String(open));
      if (open && !li.querySelector('.pad-trace-step__body')) li.appendChild(cardBody(card, ctx));
      var b = li.querySelector('.pad-trace-step__body'); if (b) b.hidden = !open;
    }, { 'aria-expanded': 'false' });
    var text = el('span', 'pad-trace-step__text');
    text.appendChild(el('span', 'pad-trace-step__title', card.title + (reused ? ' (재사용)' : '')));
    text.appendChild(el('span', 'pad-trace-step__summary', '출처 ' + card.source_title + ' · ' + card.summary));
    head.appendChild(text); head.appendChild(el('span', 'pad-trace-caret', '▾')); li.appendChild(head);
    return li;
  }
  function cardBody(card, ctx) {
    var body = el('div', 'pad-trace-step__body');
    body.appendChild(meta([['출처', card.source_title], ['참고 내용', card.summary], ['고객 적용', card.application]]));
    if (card.raw_excerpts.length) { body.appendChild(el('div', 'pad-trace-json-label', '원문 발췌 ' + card.raw_excerpts.length + '건')); card.raw_excerpts.forEach(function (r) { body.appendChild(rawBlock(r.text)); }); }
    else body.appendChild(el('div', 'pad-trace-muted', '원문 미확보 · 제목·참고 내용·반영 위치만 표시'));
    var used = card.used_by.map(function (ref) { return ctx.byTarget[ref]; }).filter(Boolean);
    if (used.length) { body.appendChild(el('div', 'pad-trace-json-label', '반영 문장 ' + used.length + '개')); var ul = el('ul', 'pad-evidence-sentences'); used.forEach(function (b) { var li = el('li', 'pad-evidence-sentence'); li.appendChild(el('div', 'pad-evidence-sentence__text', short(b.text, 120))); li.appendChild(el('div', 'pad-trace-muted', targetLabel(b.target))); ul.appendChild(li); }); body.appendChild(ul); }
    return body;
  }
  function knowledgeBody(step, ctx) {
    var body = el('div', 'pad-trace-step__body');
    step.group_ids.forEach(function (gid) {
      var g = ctx.groups[gid]; if (!g) return;
      body.appendChild(el('div', 'pad-trace-json-label', g.title + ' · ' + (g.card_ids.length + g.reuse_card_ids.length) + '건'));
      var ol = el('ol', 'pad-trace-steps');
      g.card_ids.forEach(function (id) { if (ctx.cards[id]) ol.appendChild(cardRow(ctx.cards[id], ctx, false)); });
      g.reuse_card_ids.forEach(function (id) { if (ctx.cards[id]) ol.appendChild(cardRow(ctx.cards[id], ctx, true)); });
      body.appendChild(ol);
    });
    return body;
  }
  function bindingBody(step, ctx) {
    var body = el('div', 'pad-trace-step__body');
    ['s1', 's2', 's3', 's4', 's5'].forEach(function (sec) {
      var list = bindingsUnder(ctx, ['/' + sec]); if (!list.length) return;
      var head = el('div', 'pad-evidence-section'); head.appendChild(el('span', 'pad-trace-json-label', SECTION[sec] + ' · ' + list.length + '개 문장'));
      head.appendChild(button('pad-trace-mini', '브리핑에서 보기', function () { reveal(sec); }, { 'aria-label': SECTION[sec] + ' 브리핑 위치로 이동' }));
      body.appendChild(head);
      var ul = el('ul', 'pad-evidence-sentences');
      list.forEach(function (b) { var li = el('li', 'pad-evidence-sentence'); li.appendChild(el('div', 'pad-evidence-sentence__text', short(b.text, 110))); var basis = []; if (b.fact_ids.length) basis.push(names(b.fact_ids, ctx.facts)); if (b.judgment_ids.length) basis.push(b.judgment_ids.join(' · ')); if (b.evidence_ids.length) basis.push(names(b.evidence_ids, ctx.cards, 'title')); li.appendChild(el('div', 'pad-trace-muted', targetLabel(b.target) + ' · ' + (ROLE[b.role] || b.role) + (basis.length ? ' · ' + basis.join(' · ') : ''))); ul.appendChild(li); });
      body.appendChild(ul);
    });
    return body;
  }
  // 기존 브리핑 카드의 해당 섹션으로 이동하고 잠시 강조한다. 브리핑 전문을 패널에 복제하지 않는다.
  function reveal(section) {
    var c = current; if (!c) return;
    var target = c.app.querySelector('[data-brief-section="' + section + '"]'); if (!target) return;
    try { target.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (_) { target.scrollIntoView(); }
    target.classList.remove('pad-evidence-flash'); void target.offsetWidth; target.classList.add('pad-evidence-flash');
    if (c.flashTimer) clearTimeout(c.flashTimer);
    c.flashTimer = setTimeout(function () { target.classList.remove('pad-evidence-flash'); }, 1800);
  }

  /* ---------- 패널 ---------- */
  function render(trace) {
    var c = current, ctx = { trace: trace, facts: index(trace.facts), judgments: index(trace.judgments), cards: index(trace.knowledge_cards), groups: index(trace.groups), byTarget: {} };
    // afterRender()가 같은 근거를 다시 그리지 않도록 렌더 키를 여기서 기록한다(열린 단계가 첫 재렌더에서 접히는 문제 방지).
    c.renderedAt = trace.ended_at + '|' + (trace.front ? trace.front.responded_at : '');
    trace.bindings.forEach(function (b) { ctx.byTarget[b.target] = b; });
    c.title.textContent = trace.panel_title;
    var front = trace.front || {};
    c.subtitle.textContent = (front.requested_at ? '요청 ' + clock(front.requested_at) + ' · 응답 ' + clock(front.responded_at) : '') + (front.requested_at ? ' · ' : '') + '근거 구성 ' + clock(trace.started_at) + ' → ' + clock(trace.ended_at) + ' · ' + ms(trace.duration_ms) + ' (Agent)';
    c.body.replaceChildren();
    var list = el('ol', 'pad-trace-steps'), builders = { customer_summary: customerSummaryBody, management_focus: managementFocusBody, knowledge_selection: knowledgeBody, briefing_binding: bindingBody };
    trace.steps.forEach(function (step) {
      var li = el('li', 'pad-trace-step');
      var head = button('pad-trace-step__head', null, function () {
        var open = head.getAttribute('aria-expanded') !== 'true';
        // 한 번에 한 단계만 펼친다.
        Array.prototype.forEach.call(list.children, function (other) { var h = other.querySelector('.pad-trace-step__head'), b = other.querySelector('.pad-trace-step__body'); if (h && other !== li) { h.setAttribute('aria-expanded', 'false'); if (b) b.hidden = true; } });
        head.setAttribute('aria-expanded', String(open));
        if (open && !li.querySelector(':scope > .pad-trace-step__body')) li.appendChild((builders[step.id] || function () { return el('div', 'pad-trace-step__body'); })(step, ctx));
        var body = li.querySelector(':scope > .pad-trace-step__body'); if (body) body.hidden = !open;
        c.openStep = open ? step.id : null;
      }, { 'aria-expanded': 'false' });
      head.appendChild(el('span', 'pad-trace-time', clock(step.started_at)));
      var text = el('span', 'pad-trace-step__text'); text.appendChild(el('span', 'pad-trace-step__title', step.title)); text.appendChild(el('span', 'pad-trace-step__summary', step.summary)); head.appendChild(text);
      head.appendChild(el('span', 'pad-trace-caret', '▾')); li.appendChild(head); list.appendChild(li);
    });
    c.body.appendChild(list);
  }
  // 하단 '근거 자료' 제목 선택 → 이 패널의 '참고한 업무·상품 지식' 단계에서 같은 출처(source_id)의 카드만 펼쳐 보인다.
  function openSource(sourceId) {
    var c = current; if (!c) return;
    open(); if (!c.open) return;
    var heads = Array.prototype.slice.call(c.body.querySelectorAll(':scope > .pad-trace-steps > .pad-trace-step > .pad-trace-step__head'));
    var knowledge = heads[2]; if (!knowledge) return;
    if (knowledge.getAttribute('aria-expanded') !== 'true') knowledge.click();
    var cards = Array.prototype.slice.call(c.body.querySelectorAll('.pad-evidence-card')), first = null;
    cards.forEach(function (li) {
      var head = li.querySelector('.pad-trace-step__head'), match = li.getAttribute('data-source-id') === sourceId;
      li.classList.toggle('is-focus', match);
      if (match && head.getAttribute('aria-expanded') !== 'true') head.click();
      if (!match && head.getAttribute('aria-expanded') === 'true') head.click();
      if (match && !first) first = li;
    });
    if (first) { try { first.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (_) { first.scrollIntoView(); } var h = first.querySelector('.pad-trace-step__head'); if (h) h.focus({ preventScroll: true }); }
  }
  function trigger() { return current && current.app.querySelector('.pad-evidence-open'); }
  function syncTrigger() { var b = trigger(); if (b) b.setAttribute('aria-expanded', current && current.open ? 'true' : 'false'); }
  function launcher(visible) { var a = root.PensionBranchSearchAdapter, ctx = a && a.get && a.get(); if (ctx && ctx.widget && typeof ctx.widget.setVisible === 'function') ctx.widget.setVisible(visible); }
  function open() {
    var c = current; if (!c) return;
    var id = c.component.state.sel, bridge = root.PensionBriefingAdapter, trace = id && bridge && bridge.analysisTrace ? bridge.analysisTrace(id) : null;
    if (!trace) return;
    if (root.PensionExecutionTracePanel && root.PensionExecutionTracePanel.close) root.PensionExecutionTracePanel.close(false);
    if (c.caseId !== id || !c.rendered) { c.caseId = id; c.rendered = true; render(trace); }
    c.open = true; c.host.hidden = false; launcher(false); syncTrigger();
    c.close.focus({ preventScroll: true });
  }
  function close(returnFocus) {
    var c = current; if (!c || !c.open) return;
    c.open = false; c.host.hidden = true; launcher(!c.component.state.sel); syncTrigger();
    var b = trigger(); if (returnFocus !== false && b) b.focus({ preventScroll: true });
  }
  function create(component) {
    if (!hasDom()) return;
    destroy();
    var app = root.document.getElementById('pensionAgentDemo'); if (!app) return;
    app.classList.add('pad-trace-anchor');
    var host = el('div', 'pad-trace-host'); host.id = HOST_ID; host.hidden = true;
    var panel = el('aside', 'pad-trace-panel'); panel.id = PANEL_ID; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'false'); panel.setAttribute('aria-labelledby', PANEL_ID + '-title'); panel.setAttribute('tabindex', '-1');
    var head = el('div', 'pad-trace-head'), titles = el('div', 'pad-trace-head__titles');
    var title = el('h2', 'pad-trace-title', '분석 근거'); title.id = PANEL_ID + '-title';
    var subtitle = el('div', 'pad-trace-subtitle', ''); titles.appendChild(title); titles.appendChild(subtitle);
    var closeBtn = button('pad-trace-close', '닫기', function () { close(true); }, { 'aria-label': '분석 근거 닫기' });
    head.appendChild(titles); head.appendChild(closeBtn);
    var body = el('div', 'pad-trace-body');
    panel.appendChild(head); panel.appendChild(body); host.appendChild(panel); app.appendChild(host);
    var onKey = function (e) { if (e.key === 'Escape' && current && current.open) { e.stopPropagation(); close(true); } };
    host.addEventListener('keydown', onKey);
    current = { component: component, app: app, host: host, body: body, title: title, subtitle: subtitle, close: closeBtn, onKey: onKey, open: false, rendered: false, caseId: null, openStep: null, flashTimer: null };
  }
  function destroy() {
    var c = current; if (!c) return; current = null;
    if (c.flashTimer) clearTimeout(c.flashTimer);
    c.host.removeEventListener('keydown', c.onKey);
    if (c.host.parentNode) c.host.parentNode.removeChild(c.host);
  }
  function afterRender(component) {
    var c = current; if (!c || c.component !== component) return;
    // 고객 변경·목록 복귀 시 닫고, 재요청으로 브리핑이 바뀌면 다음 열기에서 새 근거를 그린다.
    if (c.open && component.state.sel !== c.caseId) close(false);
    if (c.rendered && component.state.sel === c.caseId) {
      var bridge = root.PensionBriefingAdapter, t = bridge && bridge.analysisTrace ? bridge.analysisTrace(c.caseId) : null;
      if (!t) { c.rendered = false; if (c.open) close(false); }
      else if (c.renderedAt !== t.ended_at + '|' + (t.front ? t.front.responded_at : '')) { c.renderedAt = t.ended_at + '|' + (t.front ? t.front.responded_at : ''); if (c.open) render(t); else c.rendered = false; }
    }
    if (c.open) launcher(false);
    syncTrigger();
  }
  function install(Component) {
    if (Component.prototype.__padEvidenceInstalled) return;
    Component.prototype.__padEvidenceInstalled = true;
    var mount = Component.prototype.componentDidMount, unmount = Component.prototype.componentWillUnmount, renderVals = Component.prototype.renderVals;
    Component.prototype.componentDidMount = function () { if (mount) mount.apply(this, arguments); create(this); };
    Component.prototype.componentWillUnmount = function () { destroy(); return unmount ? unmount.apply(this, arguments) : undefined; };
    Component.prototype.renderVals = function () {
      var base = renderVals.apply(this, arguments);
      base.openEvidence = function () { open(); };
      base.evidenceExpanded = current && current.open && current.caseId === this.state.sel ? 'true' : 'false';
      return base;
    };
  }
  root.PensionBriefingEvidencePanel = { install: install, afterRender: afterRender, open: open, openSource: openSource, close: close, destroy: destroy, get: function () { return current; }, targetLabel: targetLabel, formatValue: formatValue };
})(typeof window === 'undefined' ? globalThis : window);

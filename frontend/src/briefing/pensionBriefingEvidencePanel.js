/* 고객 브리핑 TRACE 패널 — 두 가지 기록을 한 패널에 그린다.
 *  1) 분석 근거: 응답에 analysis_trace가 있는 고객(오세훈 C01-07) 전용. 네 단계(고객 상황 요약 → 관리포인트 →
 *     참고한 업무·상품 지식 → 브리핑 반영)만 보이며 한 번에 한 단계만 펼친다.
 *  2) 실시간 상담: 대화 Agent가 턴마다 보낸 `trace` 이벤트(동료 repo client/README.md «trace — 답변 근거 패널»)를
 *     턴 목록으로 보인다. 턴을 펼치면 처리 단계 → 무엇을 찾아봤나 → 확인한 사실 → 답변 검증 → 문장별 근거.
 *     값은 Agent가 실제로 판정한 것만 그리고(폐기된 초안·LLM이 단 출처는 Agent가 싣지 않는다), 대응이 없는 문장은 '대응 미확인'으로 둔다.
 * 브리핑 카드의 [TRACE] 버튼과 상담 답변의 [TRACE] 버튼이 바로 연다. 메인 처리 이력 목록을 거치지 않는다.
 * 표시하는 값은 검증된 같은 응답에서 읽는다. 원문은 textContent로만 그리며 최대 8행 뒤 '더 보기'.
 * host는 #pensionAgentDemo 안, pensionAgentMount 밖에 두고 공통 처리 이력 패널의 외형(pad-trace-*)을 재사용한다.
 */
(function (root) {
  'use strict';
  var HOST_ID = 'pad-evidence-host', PANEL_ID = 'pad-evidence-panel', RAW_LINES = 8;
  var current = null;
  var hasDom = function () { return typeof root.document === 'object' && root.document && typeof root.document.createElement === 'function' && typeof root.document.getElementById === 'function'; };
  var SECTION = { s1: 'S1', s2: 'S2', s3: 'S3', s4: 'S4', s5: 'S5' };
  // 대화 Agent trace 표기 (client/README.md «timeline[].stage 이름과 뜻» · intent · rounds[].outcome)
  var STAGE = { turn: '턴', understand: '질문 이해', plan: '조회 계획', tool: '근거 수집', compose: '답변 작성', verify: '근거 검증', clarify: '되묻기 판정', offer: '연계 제안', confirm: '확인', action: '실행', llm: 'LLM 호출', agent_help: '능력 안내' };
  var INTENT = { situation: '고객 현황', procedure: '절차', guide: '안내', agent_help: '능력 안내', correction: '정정', lms_link: 'LMS 연결', confirm_action: '연계 실행', llm_down: 'LLM 장애', clarify: '되묻기' };
  var OUTCOME = { found: '찾음', miss: '없음', failed: '고장' };
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

  /* ---------- 실시간 상담 턴 (대화 Agent trace) ---------- */
  function chatTurns(caseId) { var chat = root.PensionChat; return caseId && chat && typeof chat.turns === 'function' ? chat.turns(caseId) : []; }
  function customerName(caseId) { var b = root.PensionBriefingAdapter, r = b && b.getCustomerForRequest ? b.getCustomerForRequest(caseId) : null; return r && r.customer ? r.customer.name : ''; }
  var isoMs = function (iso) { var t = Date.parse(iso); return isNaN(t) ? null : t; };
  // 턴 하나의 핵심 요약 — 시연에서 한 줄로 읽히는 값만. 검증은 마지막 verify 항목의 facts 기준이다.
  function summarizeTurn(agent) {
    var tl = Array.isArray(agent.timeline) ? agent.timeline : [], rounds = Array.isArray(agent.rounds) ? agent.rounds : [];
    var verify = tl.filter(function (e) { return e.stage === 'verify'; }), last = verify[verify.length - 1], facts = last && last.facts && typeof last.facts === 'object' ? last.facts : {};
    var llm = tl.filter(function (e) { return e.stage === 'llm'; }).length, warned = tl.some(function (e) { return e.level === 'WARNING'; });
    var outcomes = { found: 0, miss: 0, failed: 0 }; rounds.forEach(function (r) { if (outcomes[r.outcome] != null) outcomes[r.outcome] += 1; });
    var verdict = !verify.length ? null : facts.passed === false ? (facts.fallback ? '검증 미통과 · 근거 원문으로 대체' : '검증 미통과') : verify.some(function (v) { return v.level === 'WARNING'; }) ? '재작성 후 검증 통과' : '검증 통과';
    var start = isoMs(agent.started_at), end = isoMs(agent.finished_at), durationMs = start != null && end != null ? Math.max(0, end - start) : null;
    var intentLabel = INTENT[agent.intent] || agent.intent || '의도 미상';
    var line = [intentLabel, rounds.length ? '도구 ' + rounds.length + '회 (찾음 ' + outcomes.found + (outcomes.miss ? ' · 없음 ' + outcomes.miss : '') + (outcomes.failed ? ' · 고장 ' + outcomes.failed : '') + ')' : '도구 호출 없음', verdict, llm ? 'LLM ' + llm + '회' : null, durationMs != null ? ms(durationMs) : null].filter(Boolean).join(' · ');
    return { intentLabel: intentLabel, rounds: rounds.length, outcomes: outcomes, llmCalls: llm, verdict: verdict, warning: warned ? (facts.passed === false ? '검증 미통과' : '경고') : null, durationMs: durationMs, line: line,
      stages: tl.map(function (e) { return e.stage; }).filter(function (st, i, arr) { return st !== 'turn' && st !== 'llm' && arr.indexOf(st) === i; }) };
  }
  // 한 목록 안에서 한 번에 하나만 펼친다. 본문은 처음 펼칠 때 만든다.
  function toggleOne(list, li, head, build) {
    var open = head.getAttribute('aria-expanded') !== 'true';
    Array.prototype.forEach.call(list.children, function (other) { if (other === li) return; var h = other.querySelector(':scope > .pad-trace-step__head'), b = other.querySelector(':scope > .pad-trace-step__body'); if (h) h.setAttribute('aria-expanded', 'false'); if (b) b.hidden = true; });
    head.setAttribute('aria-expanded', String(open));
    if (open && !li.querySelector(':scope > .pad-trace-step__body')) li.appendChild(build());
    var body = li.querySelector(':scope > .pad-trace-step__body'); if (body) body.hidden = !open;
  }
  function stepRow(list, title, summary, build, extra) {
    var li = el('li', 'pad-trace-step' + (extra && extra.cls ? ' ' + extra.cls : ''));
    var head = button('pad-trace-step__head', null, function () { toggleOne(list, li, head, build); }, { 'aria-expanded': 'false' });
    if (extra && extra.time) head.appendChild(el('span', 'pad-trace-time', extra.time));
    var text = el('span', 'pad-trace-step__text'); text.appendChild(el('span', 'pad-trace-step__title', title)); text.appendChild(el('span', 'pad-trace-step__summary', summary || '')); head.appendChild(text);
    if (extra && extra.badge) head.appendChild(el('span', 'pad-trace-status pad-trace-status--failed', extra.badge));
    head.appendChild(el('span', 'pad-trace-caret', '▾')); li.appendChild(head); list.appendChild(li);
    return li;
  }
  function table(rows, cls) {
    var t = el('table', 'pad-trace-table'), tbody = el('tbody');
    rows.forEach(function (cells) { var tr = el('tr', cells.cls || null); cells.forEach(function (cell) { var td = el('td', cell && cell.cls ? cell.cls : null); if (cell && typeof cell === 'object' && 'text' in cell) td.textContent = cell.text; else td.textContent = cell == null ? '' : String(cell); tr.appendChild(td); }); tbody.appendChild(tr); });
    t.appendChild(tbody); var wrap = el('div', 'pad-trace-table-wrap' + (cls ? ' ' + cls : '')); wrap.appendChild(t); return wrap;
  }
  function timelineBody(agent) {
    var body = el('div', 'pad-trace-step__body'), tl = agent.timeline, shown = tl.filter(function (e) { return e.level !== 'DEBUG'; });
    body.appendChild(table(shown.map(function (e) {
      var row = [{ text: clock(e.at), cls: 'pad-trace-muted' }, { text: e.elapsed_ms != null ? '+' + ms(e.elapsed_ms) : '', cls: 'pad-trace-muted' }, { text: (STAGE[e.stage] || e.stage) + (e.ident ? ' · ' + e.ident : ''), cls: 'pad-evidence-fact' }, { text: plain(e.text) }];
      row.cls = e.level === 'WARNING' ? 'pad-chat-trace__warn' : null; return row;
    })));
    if (shown.length < tl.length) body.appendChild(el('div', 'pad-trace-muted', 'DEBUG ' + (tl.length - shown.length) + '건(LLM 호출 등)은 생략'));
    return body;
  }
  function roundsBody(agent) {
    var body = el('div', 'pad-trace-step__body'), rounds = agent.rounds || [];
    if (!rounds.length) { body.appendChild(el('div', 'pad-trace-note', '이 턴은 도구를 부르지 않았다(되묻기·승낙·능력 안내·LLM 장애 턴).')); return body; }
    body.appendChild(table(rounds.map(function (r) { var row = [{ text: r.n, cls: 'pad-trace-muted' }, { text: r.tool, cls: 'pad-evidence-fact' }, { text: r.query || '' }, { text: OUTCOME[r.outcome] || r.outcome || '' }, { text: r.reason || '', cls: 'pad-trace-muted' }]; row.cls = r.outcome === 'failed' ? 'pad-chat-trace__warn' : null; return row; })));
    return body;
  }
  function evidenceBody(agent) {
    var body = el('div', 'pad-trace-step__body'), blocks = agent.evidence || [];
    if (!blocks.length) { body.appendChild(el('div', 'pad-trace-note', '모은 근거가 없다. 문장별 근거도 기록되지 않는다.')); return body; }
    blocks.forEach(function (b, i) {
      body.appendChild(el('div', 'pad-trace-json-label', '근거 ' + (i + 1) + ' · ' + b.tool + (b.query ? " · '" + b.query + "'" : '')));
      var cards = Array.isArray(b.cards) ? b.cards : [];
      if (cards.length) { var ul = el('ul', 'pad-evidence-sentences'); cards.forEach(function (card) { var li = el('li', 'pad-evidence-sentence' + (card.used ? '' : ' is-unused')); li.appendChild(el('div', 'pad-evidence-sentence__text', (card.title || card.id || '') + (card.used ? '' : ' — 답변에 사용 안 함'))); li.appendChild(el('div', 'pad-trace-muted', [card.id, card.doc, card.score != null ? '관련도 ' + card.score : null].filter(Boolean).join(' · '))); ul.appendChild(li); }); body.appendChild(ul); }
      if (b.text) { body.appendChild(rawBlock(b.text)); if (b.truncated) body.appendChild(el('div', 'pad-trace-muted', '원문이 길어 Agent가 4,000자에서 잘라 보냈다')); }
      if (Array.isArray(b.atomic) && b.atomic.length) body.appendChild(el('div', 'pad-trace-muted', '원문 그대로 인용해야 하는 값 ' + b.atomic.length + '건: ' + b.atomic.join(' / ')));
      if (Array.isArray(b.notices) && b.notices.length) body.appendChild(el('div', 'pad-trace-muted', '빠지면 안 되는 주의 ' + b.notices.length + '건: ' + b.notices.join(' / ')));
    });
    return body;
  }
  function verifyBody(agent) {
    var body = el('div', 'pad-trace-step__body'), entries = (agent.timeline || []).filter(function (e) { return e.stage === 'verify'; });
    if (!entries.length) { body.appendChild(el('div', 'pad-trace-note', '이 턴에는 검증 단계가 없다(되묻기·승낙·LLM 장애 턴).')); return body; }
    entries.forEach(function (e) {
      var f = e.facts && typeof e.facts === 'object' ? e.facts : {}, box = el('div', 'pad-evidence-judgment' + (e.level === 'WARNING' ? ' pad-chat-trace__warn' : ''));
      box.appendChild(el('div', 'pad-evidence-judgment__text', (f.attempt ? '시도 ' + f.attempt + ' · ' : '') + (f.passed === true ? '통과' : f.passed === false ? '미통과' : plain(e.text))));
      var faults = Array.isArray(f.faults) ? f.faults : (f.reason ? [f.reason] : []);
      if (faults.length) { var ul = el('ul', 'pad-evidence-sentences'); faults.forEach(function (x) { var li = el('li', 'pad-evidence-sentence'); li.appendChild(el('div', 'pad-evidence-sentence__text', String(x))); ul.appendChild(li); }); box.appendChild(ul); }
      if (f.fallback) box.appendChild(el('div', 'pad-trace-muted', '끝내 통과하지 못해 ' + (f.fallback === 'raw_evidence' ? '근거 원문으로 답변을 대신했다' : String(f.fallback))));
      body.appendChild(box);
    });
    body.appendChild(el('div', 'pad-trace-muted', '폐기된 초안 문장은 Agent가 싣지 않는다 — 사유만 기록된다.'));
    return body;
  }
  function matchLabel(m) {
    if (m.by === '수치') return '수치 ' + (Array.isArray(m.values) ? m.values.join(', ') : '') + (m.card ? ' (' + m.card + ')' : m.tool ? ' (' + m.tool + ')' : '');
    return m.by + (m.card ? ' ' + m.card : m.tool ? ' ' + m.tool : '') + (m.span ? " '" + short(m.span, 60) + "'" : '');
  }
  function sentencesBody(agent) {
    var body = el('div', 'pad-trace-step__body'), list = agent.sentences || [];
    if (!list.length) { body.appendChild(el('div', 'pad-trace-note', '근거가 없는 턴이라 문장별 대응이 기록되지 않았다.')); return body; }
    var ul = el('ul', 'pad-evidence-sentences');
    list.forEach(function (sent) {
      var li = el('li', 'pad-evidence-sentence' + (sent.matches && sent.matches.length ? '' : ' is-unused')); li.appendChild(el('div', 'pad-evidence-sentence__text', plain(sent.text)));
      li.appendChild(el('div', 'pad-trace-muted', sent.matches && sent.matches.length ? sent.matches.map(matchLabel).join(' · ') : '대응 미확인 — 코드가 증명하지 못한 문장(의역·화법 등)'));
      ul.appendChild(li);
    });
    body.appendChild(ul);
    body.appendChild(el('div', 'pad-trace-muted', '대응은 Agent 코드가 대조해 증명한 것만 싣는다(원문스팬 · 카드문구 · 수치). LLM이 단 출처는 없다.'));
    return body;
  }
  function turnBody(t) {
    var body = el('div', 'pad-trace-step__body'), a = t.agent, sum = summarizeTurn(a), f = t.front || {};
    body.appendChild(meta([['질문', t.question], ['질문 이해', sum.intentLabel + (a.intent ? ' (' + a.intent + ')' : '')],
      ['요청 → 응답', f.requestedAt ? clock(f.requestedAt) + ' → ' + clock(f.finishedAt) + (f.durationMs != null ? ' · ' + ms(f.durationMs) : '') + ' (프론트)' : null],
      ['Agent 처리', clock(a.started_at) + ' → ' + clock(a.finished_at) + (sum.durationMs != null ? ' · ' + ms(sum.durationMs) : '') + ' (Agent 시계)'], ['세션', t.sessionId]]));
    var steps = el('ol', 'pad-trace-steps'), tl = a.timeline || [], ev = a.evidence || [], cards = ev.reduce(function (n, b) { return n + (Array.isArray(b.cards) ? b.cards.length : 0); }, 0), used = ev.reduce(function (n, b) { return n + (Array.isArray(b.cards) ? b.cards.filter(function (c) { return c.used; }).length : 0); }, 0);
    var sents = a.sentences || [], matched = sents.filter(function (x) { return x.matches && x.matches.length; }).length;
    stepRow(steps, '처리 단계', sum.stages.map(function (st) { return STAGE[st] || st; }).join(' → ') + ' · ' + tl.length + '건' + (sum.warning ? ' · 경고 있음' : ''), function () { return timelineBody(a); });
    stepRow(steps, '무엇을 찾아봤나', sum.rounds ? '도구 호출 ' + sum.rounds + '회 · 찾음 ' + sum.outcomes.found + ' · 없음 ' + sum.outcomes.miss + ' · 고장 ' + sum.outcomes.failed : '도구 호출 없음', function () { return roundsBody(a); });
    stepRow(steps, '확인한 사실', ev.length ? '근거 블록 ' + ev.length + ' · 카드 ' + cards + '장 (답변에 사용 ' + used + ')' : '근거 없음', function () { return evidenceBody(a); });
    stepRow(steps, '답변 검증', sum.verdict || '검증 단계 없음', function () { return verifyBody(a); }, { badge: sum.verdict && /미통과/.test(sum.verdict) ? '미통과' : null });
    stepRow(steps, '문장별 근거', sents.length ? '문장 ' + sents.length + ' · 대응 확인 ' + matched + (matched < sents.length ? ' · 미확인 ' + (sents.length - matched) : '') : '기록 없음', function () { return sentencesBody(a); });
    body.appendChild(steps);
    return body;
  }
  function chatSection(turns, below) {
    var wrap = el('div', 'pad-chat-trace' + (below ? ' pad-chat-trace--below' : ''));
    var head = el('div', 'pad-evidence-section'); head.appendChild(el('span', 'pad-trace-json-label', '실시간 상담 · ' + turns.length + '턴 (대화 Agent 턴 절차 기록)')); wrap.appendChild(head);
    var list = el('ol', 'pad-trace-steps pad-chat-turns');
    turns.forEach(function (t) {
      var sum = summarizeTurn(t.agent);
      var li = stepRow(list, '턴 ' + t.turn + ' · ' + short(t.question, 48), sum.line, function () { return turnBody(t); }, { time: clock(t.agent.started_at), badge: sum.warning, cls: sum.verdict && /미통과/.test(sum.verdict) ? 'pad-trace-step--failed' : null });
      li.setAttribute('data-turn', String(t.turn));
    });
    wrap.appendChild(list);
    return wrap;
  }

  /* ---------- 패널 ---------- */
  function renderKey(trace, turns) { return (trace ? trace.ended_at + '|' + (trace.front ? trace.front.responded_at : '') : '-') + '|' + turns.length + '|' + (turns.length ? turns[turns.length - 1].front.finishedAt : ''); }
  function render(trace, turns) {
    var c = current;
    // afterRender()가 같은 근거를 다시 그리지 않도록 렌더 키를 여기서 기록한다(열린 단계가 첫 재렌더에서 접히는 문제 방지).
    c.renderedAt = renderKey(trace, turns);
    c.body.replaceChildren();
    if (trace) {
      c.title.textContent = trace.panel_title;
      var front = trace.front || {};
      c.subtitle.textContent = (front.requested_at ? '요청 ' + clock(front.requested_at) + ' · 응답 ' + clock(front.responded_at) : '') + (front.requested_at ? ' · ' : '') + '근거 구성 ' + clock(trace.started_at) + ' → ' + clock(trace.ended_at) + ' · ' + ms(trace.duration_ms) + ' (Agent)' + (turns.length ? ' · 상담 ' + turns.length + '턴' : '');
      c.body.appendChild(analysisSteps(trace));
    } else {
      c.title.textContent = (customerName(c.caseId) ? customerName(c.caseId) + ' · ' : '') + '실시간 상담 TRACE';
      c.subtitle.textContent = '상담 ' + turns.length + '턴 · 대화 Agent가 턴마다 보낸 절차 기록';
    }
    if (turns.length) c.body.appendChild(chatSection(turns, !!trace));
  }
  function analysisSteps(trace) {
    var ctx = { trace: trace, facts: index(trace.facts), judgments: index(trace.judgments), cards: index(trace.knowledge_cards), groups: index(trace.groups), byTarget: {} };
    trace.bindings.forEach(function (b) { ctx.byTarget[b.target] = b; });
    var c = current;
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
    return list;
  }
  // 상담 답변의 [TRACE] → 이 패널을 열고 해당 턴만 펼친다.
  function openTurn(caseId, turn) {
    var c = current; if (!c || c.component.state.sel !== caseId) return;
    open(); if (!c.open) return;
    var li = c.body.querySelector('.pad-chat-turns > [data-turn="' + String(turn) + '"]'); if (!li) return;
    var head = li.querySelector(':scope > .pad-trace-step__head');
    if (head && head.getAttribute('aria-expanded') !== 'true') head.click();
    try { li.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (_) { li.scrollIntoView(); }
    if (head) head.focus({ preventScroll: true });
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
    var id = c.component.state.sel, bridge = root.PensionBriefingAdapter, trace = id && bridge && bridge.analysisTrace ? bridge.analysisTrace(id) : null, turns = chatTurns(id);
    if (!trace && !turns.length) return;
    if (root.PensionExecutionTracePanel && root.PensionExecutionTracePanel.close) root.PensionExecutionTracePanel.close(false);
    if (c.caseId !== id || !c.rendered || c.renderedAt !== renderKey(trace, turns)) { c.caseId = id; c.rendered = true; render(trace, turns); }
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
    var title = el('h2', 'pad-trace-title', 'TRACE'); title.id = PANEL_ID + '-title';
    var subtitle = el('div', 'pad-trace-subtitle', ''); titles.appendChild(title); titles.appendChild(subtitle);
    var closeBtn = button('pad-trace-close', '닫기', function () { close(true); }, { 'aria-label': 'TRACE 닫기' });
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
      var bridge = root.PensionBriefingAdapter, t = bridge && bridge.analysisTrace ? bridge.analysisTrace(c.caseId) : null, turns = chatTurns(c.caseId);
      if (!t && !turns.length) { c.rendered = false; if (c.open) close(false); }
      // 재요청으로 브리핑 근거가 바뀌거나 상담 턴이 추가되면 열려 있을 때는 다시 그리고, 닫혀 있으면 다음 열기에서 그린다.
      else if (c.renderedAt !== renderKey(t, turns)) { if (c.open) render(t, turns); else c.rendered = false; }
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
      // 카드의 [TRACE]는 분석 근거가 있거나 이 고객의 상담 턴에 trace가 하나라도 있을 때 보인다.
      base.hasTraceButton = !!(base.hasAnalysisTrace || (this.state.sel && chatTurns(this.state.sel).length));
      base.evidenceExpanded = current && current.open && current.caseId === this.state.sel ? 'true' : 'false';
      return base;
    };
  }
  root.PensionBriefingEvidencePanel = { install: install, afterRender: afterRender, open: open, openSource: openSource, openTurn: openTurn, close: close, destroy: destroy, get: function () { return current; }, targetLabel: targetLabel, formatValue: formatValue, summarizeTurn: summarizeTurn };
})(typeof window === 'undefined' ? globalThis : window);

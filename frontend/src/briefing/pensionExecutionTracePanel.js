/* 처리 이력 패널 — 목록·상세·타임라인 렌더러.
 * 세 종류의 기록을 한 패널에서 보여준다: 오늘의 부점 브리핑(사전 완료 목업, frontend_fixture),
 * 부점 AI 고객 검색(실제 전송·수신·Agent execution_trace, frontend_observed/agent_observed), 고객 목록 엑셀 추출(frontend_observed).
 * host는 #pensionAgentDemo 안, pensionAgentMount 밖에 두어 메인 전체 재렌더링에도 사라지지 않는다.
 * 실제 통신·Agent 호출·상태 변경을 하지 않으며, 펼치기·페이지 이동은 패널 안의 해당 영역만 갱신한다.
 */
(function (root) {
  'use strict';
  var HOST_ID = 'pad-trace-host', PANEL_ID = 'pad-trace-panel', PAGE = 20, MOCK_ID = 'briefing-fixture-0730';
  var current = null;
  var D = function () { return root.PensionExecutionTraceData; };
  var hasDom = function () { return typeof root.document === 'object' && root.document && typeof root.document.createElement === 'function' && typeof root.document.getElementById === 'function'; };
  var KIND = { branch_briefing: '부점 브리핑', branch_search: '부점 AI 검색', excel_export: '엑셀 추출' };
  var STATUS = { running: '진행 중', completed: '완료', error: '오류', cancelled: '취소', failed: '실패' };
  var ACTOR_LABEL = { FRONT: '프론트', FABRIX: 'FabriX', AGENT: 'Agent', DATA: '데이터', LLM: 'LLM', EXPORT: '엑셀 생성' };

  function el(tag, cls, text) {
    var node = root.document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }
  function button(cls, text, onClick, attrs) {
    var b = el('button', cls, text); b.type = 'button';
    if (attrs) Object.keys(attrs).forEach(function (k) { b.setAttribute(k, attrs[k]); });
    b.addEventListener('click', onClick);
    return b;
  }
  /* ---------- 시각 표시: 원본은 ISO(timezone 포함), 화면은 한국 시간 HH:mm:ss.SSS ---------- */
  var kstFormat = null;
  function kstParts(iso) {
    var d = new Date(iso); if (isNaN(d.getTime())) return null;
    try {
      kstFormat = kstFormat || new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      var p = {}; kstFormat.formatToParts(d).forEach(function (x) { p[x.type] = x.value; });
      return { date: p.year + '.' + p.month + '.' + p.day, time: (p.hour === '24' ? '00' : p.hour) + ':' + p.minute + ':' + p.second + '.' + String(d.getUTCMilliseconds()).padStart(3, '0') };
    } catch (_) {
      var s = new Date(d.getTime() + 9 * 3600000).toISOString();
      return { date: s.slice(0, 10).replace(/-/g, '.'), time: s.slice(11, 23) };
    }
  }
  var clock = function (iso) { var p = iso && kstParts(iso); return p ? p.time : '—'; };
  var dateLabel = function (iso) { var p = iso && kstParts(iso); return p ? p.date : '—'; };
  var ms = function (n) { return n == null ? '—' : n >= 1000 ? (n / 1000).toFixed(n % 1000 ? 1 : 0) + '초' : n + 'ms'; };
  var count = function (n) { return Number(n).toLocaleString('ko-KR'); };
  // TraceDetail(모든 키 존재, 미사용 null)은 값이 있는 키만 보여준다. 표시 전용이며 원본 값은 바꾸지 않는다.
  function compact(value) {
    if (Array.isArray(value)) return value.map(compact);
    if (value && typeof value === 'object') { var out = {}; Object.keys(value).forEach(function (k) { if (value[k] !== null && value[k] !== undefined) out[k] = compact(value[k]); }); return out; }
    return value;
  }

  /* ---------- JSON 표시 (textContent, 변경 경로 강조) ---------- */
  function jsonLines(value, path, indent, key, last, out) {
    var prefix = key == null ? '' : JSON.stringify(key) + ': ', comma = last ? '' : ',';
    if (Array.isArray(value)) {
      if (!value.length) { out.push({ path: path, text: indent + prefix + '[]' + comma, leaf: true }); return out; }
      out.push({ path: path, text: indent + prefix + '[', edge: true });
      value.forEach(function (v, i) { jsonLines(v, path + '[' + i + ']', indent + '  ', null, i === value.length - 1, out); });
      out.push({ path: path, text: indent + ']' + comma, edge: true });
      return out;
    }
    if (value && typeof value === 'object') {
      var keys = Object.keys(value);
      if (!keys.length) { out.push({ path: path, text: indent + prefix + '{}' + comma, leaf: true }); return out; }
      out.push({ path: path, text: indent + prefix + '{', edge: true });
      keys.forEach(function (k, i) { jsonLines(value[k], path ? path + '.' + k : k, indent + '  ', k, i === keys.length - 1, out); });
      out.push({ path: path, text: indent + '}' + comma, edge: true });
      return out;
    }
    out.push({ path: path, text: indent + prefix + JSON.stringify(value === undefined ? null : value) + comma, leaf: true });
    return out;
  }
  function jsonBlock(value, changedPaths, label) {
    var wrap = el('div', 'pad-trace-json-wrap');
    if (label) wrap.appendChild(el('div', 'pad-trace-json-label', label));
    var pre = el('pre', 'pad-trace-json'); pre.setAttribute('tabindex', '0');
    var changed = changedPaths || [];
    var within = function (path) { return path && changed.some(function (p) { return p === path || path.indexOf(p + '.') === 0 || path.indexOf(p + '[') === 0; }); };
    jsonLines(value, '', '', null, true, []).forEach(function (line) { pre.appendChild(el('span', 'pad-trace-json__line' + (within(line.path) ? ' is-changed' : ''), line.text + '\n')); });
    wrap.appendChild(pre);
    return wrap;
  }
  function textBlock(text, label) {
    var wrap = el('div', 'pad-trace-json-wrap');
    if (label) wrap.appendChild(el('div', 'pad-trace-json-label', label));
    var pre = el('pre', 'pad-trace-json pad-trace-json--text', text); pre.setAttribute('tabindex', '0');
    wrap.appendChild(pre);
    return wrap;
  }
  // 고객은 화면과 같은 고객식별자(5자리-5자리)로 표시한다. 검색·엑셀 기록의 내부 행 ID(case id)는 현재 목록 데이터로 변환하고,
  // 변환할 수 없으면 원래 값을 그대로 둔다. JSON 원문의 row_ids는 바꾸지 않는다.
  var idMap = null, idMapSource = null;
  function customerLabel(id) {
    var adapter = root.PensionBranchSearchAdapter, ctx = adapter && adapter.get && adapter.get(), source = ctx && ctx.source;
    if (source !== idMapSource) {
      idMapSource = source; idMap = {};
      if (source && Array.isArray(source.records)) source.records.forEach(function (r) {
        var raw = r.customer && r.customer.customerId, shown = raw && (root.PensionCustomerView && root.PensionCustomerView.displayId ? root.PensionCustomerView.displayId(raw) : root.PensionExport && root.PensionExport.displayId ? root.PensionExport.displayId(raw) : raw);
        if (shown) idMap[r.briefingMeta.caseId] = shown;
      });
    }
    return idMap && idMap[id] ? idMap[id] : String(id);
  }
  function chips(ids, cls) { var wrap = el('div', 'pad-trace-chips'); ids.forEach(function (id) { var label = customerLabel(id), chip = el('span', 'pad-trace-chip' + (cls ? ' ' + cls : ''), label); if (label !== String(id)) chip.title = '행 ID ' + id; wrap.appendChild(chip); }); return wrap; }
  function meta(pairs) {
    var dl = el('dl', 'pad-trace-meta');
    pairs.forEach(function (p) { if (p[1] == null || p[1] === '') return; var row = el('div', 'pad-trace-meta__row'); row.appendChild(el('dt', null, p[0])); var dd = el('dd'); if (typeof p[1] === 'string' || typeof p[1] === 'number') dd.textContent = p[1]; else dd.appendChild(p[1]); row.appendChild(dd); dl.appendChild(row); });
    return dl;
  }
  function pagedIds(ids, key, title) {
    var c = current, wrap = el('div', 'pad-trace-paged'), head = el('div', 'pad-trace-paged__head'), list = el('div');
    wrap.appendChild(head); wrap.appendChild(list);
    function draw() {
      var page = c.state.pages[key] || 0, pages = Math.max(1, Math.ceil(ids.length / PAGE)); if (page >= pages) page = pages - 1;
      head.replaceChildren(); head.appendChild(el('span', 'pad-trace-paged__title', (title || '고객식별자') + ' · ' + count(ids.length) + '명'));
      if (pages > 1) {
        var nav = el('span', 'pad-trace-paged__nav');
        nav.appendChild(button('pad-trace-mini', '이전', function () { c.state.pages[key] = Math.max(0, page - 1); draw(); }, { 'aria-label': '이전 페이지' }));
        nav.appendChild(el('span', 'pad-trace-paged__page', (page + 1) + ' / ' + pages));
        nav.appendChild(button('pad-trace-mini', '다음', function () { c.state.pages[key] = Math.min(pages - 1, page + 1); draw(); }, { 'aria-label': '다음 페이지' }));
        head.appendChild(nav);
      }
      list.replaceChildren(ids.length ? chips(ids.slice(page * PAGE, page * PAGE + PAGE)) : el('div', 'pad-trace-empty', '해당 고객 없음'));
    }
    draw(); return wrap;
  }
  function actorBadge(actor) { var b = el('span', 'pad-trace-actor pad-trace-actor--' + String(actor).toLowerCase(), actor); b.title = ACTOR_LABEL[actor] || actor; return b; }
  function statusBadge(status) { return el('span', 'pad-trace-status pad-trace-status--' + status, STATUS[status] || status); }
  function kindBadge(kind) { return el('span', 'pad-trace-kind pad-trace-kind--' + kind, KIND[kind] || kind); }
  function evidence(refs) {
    if (!refs || !refs.length) return null;
    var wrap = el('div', 'pad-trace-evidence'); wrap.appendChild(el('div', 'pad-trace-json-label', '근거 참조 (evidenceRefs · 원본 필드)'));
    var ul = el('ul'); refs.slice(0, 12).forEach(function (ref) { ul.appendChild(el('li', null, ref)); });
    if (refs.length > 12) ul.appendChild(el('li', 'pad-trace-muted', '외 ' + (refs.length - 12) + '건'));
    wrap.appendChild(ul); return wrap;
  }

  /* ---------- 부점 브리핑(목업) 단계 상세 ---------- */
  function stepMeta(step) {
    return meta([['시작', clock(step.startedAt)], ['종료', step.endedAt ? clock(step.endedAt) : '—'], ['소요시간', step.durationMs == null ? '—' : step.durationMs ? ms(step.durationMs) : '즉시(완료 표시)'], ['실행 주체', step.actor + ' · ' + (ACTOR_LABEL[step.actor] || '')], ['상태', STATUS[step.status] || step.status]]);
  }
  function genericDetail(step) {
    var frag = root.document.createDocumentFragment();
    if (step.input) frag.appendChild(jsonBlock(compact(step.input), null, '입력 JSON'));
    if (step.output) frag.appendChild(jsonBlock(compact(step.output), null, '처리 결과'));
    var ev = evidence(step.evidenceRefs || step.evidence_refs); if (ev) frag.appendChild(ev);
    return frag;
  }
  function compareDetail(step, data) {
    var c = current, frag = root.document.createDocumentFragment();
    frag.appendChild(jsonBlock(step.input, null, '입력'));
    var out = step.output, summary = el('div', 'pad-trace-summary-grid');
    var cell = function (label, value) { var d = el('div', 'pad-trace-summary-cell'); d.appendChild(el('div', 'pad-trace-summary-cell__label', label)); d.appendChild(el('div', 'pad-trace-summary-cell__value', value)); return d; };
    summary.appendChild(cell('원본 사실 변경 고객', count(out.changedCustomerCount) + '명'));
    summary.appendChild(cell('기준일 경과만으로 세그먼트 변경', count(out.dateOnlySegmentChangeIds.length) + '명'));
    Object.keys(out.changedByGroup).forEach(function (g) { if (out.changedByGroup[g]) summary.appendChild(cell(g, count(out.changedByGroup[g]) + '명')); });
    frag.appendChild(el('div', 'pad-trace-json-label', '변경 요약 (정보군별 고객 수, 한 고객이 여러 정보군에 포함될 수 있음)'));
    frag.appendChild(summary);
    frag.appendChild(el('div', 'pad-trace-json-label', '대표 사례 · 원본 고객 데이터(전일 JSON / 금일 JSON)와 계산된 세그먼트 결과를 구분해 표시'));
    var tabs = el('div', 'pad-trace-tabs'), view = el('div', 'pad-trace-compare');
    var render = function () {
      var key = c.state.caseSel[step.id] || data.cases[0].key, cs = data.cases.filter(function (x) { return x.key === key; })[0];
      Array.prototype.forEach.call(tabs.children, function (b) { var on = b.getAttribute('data-case') === key; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', String(on)); });
      view.replaceChildren();
      var head = el('div', 'pad-trace-case-head'); head.appendChild(el('div', 'pad-trace-case-title', cs.title));
      var badges = el('div', 'pad-trace-chips'); badges.appendChild(el('span', 'pad-trace-chip', cs.customerId));
      badges.appendChild(el('span', 'pad-trace-chip ' + (cs.factChanged ? 'pad-trace-chip--warn' : 'pad-trace-chip--muted'), cs.factChanged ? '원본 사실 변경 ' + cs.changedPaths.length + '개 필드' : '원본 사실 변경 없음 · 기준일 경과'));
      head.appendChild(badges); view.appendChild(head);
      view.appendChild(meta([['세그먼트(전일)', cs.segmentsBefore.join(' · ')], ['세그먼트(금일)', cs.segmentsAfter.join(' · ')], ['변경 필드', cs.changedPaths.length ? cs.changedPaths.join(', ') : '없음']]));
      var cols = el('div', 'pad-trace-compare__cols');
      cols.appendChild(jsonBlock(cs.prev, cs.changedPaths, '전일 JSON · ' + dateLabel(data.snapshots.prev.capturedAt) + ' 07:25'));
      cols.appendChild(jsonBlock(cs.curr, cs.changedPaths, '금일 JSON · ' + dateLabel(data.snapshots.curr.capturedAt) + ' 07:25'));
      view.appendChild(cols);
      var ev = evidence(cs.evidenceRefs); if (ev) view.appendChild(ev);
    };
    data.cases.forEach(function (cs) { tabs.appendChild(button('pad-trace-tab', cs.title, function () { c.state.caseSel[step.id] = cs.key; render(); }, { 'data-case': cs.key, 'aria-pressed': 'false' })); });
    frag.appendChild(tabs); frag.appendChild(view); render();
    frag.appendChild(pagedIds(out.changedCustomerIds, step.id + ':changed', '원본 사실 변경 고객 (고객식별자)'));
    frag.appendChild(pagedIds(out.dateOnlySegmentChangeIds, step.id + ':dateonly', '기준일 경과만으로 세그먼트가 바뀐 고객'));
    return frag;
  }
  function segmentsDetail(step, data) {
    var c = current, frag = root.document.createDocumentFragment();
    frag.appendChild(el('div', 'pad-trace-json-label', '세그먼트별 전일·금일 인원과 신규 진입·이탈·순증 (순증 = 신규 진입 − 이탈). 세그먼트는 겹칠 수 있음'));
    var table = el('table', 'pad-trace-table'), thead = el('thead'), tr = el('tr');
    ['표시 그룹', '등록 라벨', '전일', '금일', '신규 진입', '이탈', '순증'].forEach(function (h) { tr.appendChild(el('th', null, h)); });
    thead.appendChild(tr); table.appendChild(thead);
    var tbody = el('tbody'), detail = el('div', 'pad-trace-segment-detail');
    var render = function () {
      var key = c.state.caseSel[step.id] || 'churn_risk', seg = data.segments.filter(function (s) { return s.key === key; })[0];
      Array.prototype.forEach.call(tbody.children, function (row) { row.classList.toggle('is-on', row.getAttribute('data-seg') === key); });
      detail.replaceChildren(); detail.appendChild(el('div', 'pad-trace-case-title', seg.label));
      detail.appendChild(meta([['계산 기준', seg.rule], ['등록 라벨', seg.sourceLabels.length ? seg.sourceLabels.join(', ') : '없음 (화면 계산 기준)']]));
      if (seg.entered.length) { detail.appendChild(el('div', 'pad-trace-json-label', '신규 진입 ' + seg.entered.length + '명')); detail.appendChild(chips(seg.entered, 'pad-trace-chip--ok')); }
      if (seg.exited.length) { detail.appendChild(el('div', 'pad-trace-json-label', '이탈 ' + seg.exited.length + '명')); detail.appendChild(chips(seg.exited, 'pad-trace-chip--warn')); }
      detail.appendChild(pagedIds(seg.afterIds, step.id + ':' + seg.key, '금일 인원'));
    };
    data.segments.forEach(function (s) {
      var row = el('tr'); row.setAttribute('data-seg', s.key);
      var first = el('td'); first.appendChild(button('pad-trace-link', s.label, function () { c.state.caseSel[step.id] = s.key; render(); })); row.appendChild(first);
      row.appendChild(el('td', 'pad-trace-muted', s.sourceLabels.join(', ') || '—'));
      row.appendChild(el('td', 'pad-trace-num', count(s.before))); row.appendChild(el('td', 'pad-trace-num', count(s.after)));
      row.appendChild(el('td', 'pad-trace-num', s.entered.length ? '+' + s.entered.length : '0')); row.appendChild(el('td', 'pad-trace-num', s.exited.length ? '−' + s.exited.length : '0'));
      row.appendChild(el('td', 'pad-trace-num' + (s.net > 0 ? ' pad-trace-num--up' : s.net < 0 ? ' pad-trace-num--down' : ''), s.net > 0 ? '+' + s.net : s.net < 0 ? '−' + (-s.net) : '0'));
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    var scroller = el('div', 'pad-trace-table-wrap'); scroller.appendChild(table); frag.appendChild(scroller);
    var ov = step.output.overlaps[0];
    if (ov && ov.customerIds.length) { frag.appendChild(el('div', 'pad-trace-json-label', '중복 포함: ' + ov.segments.join(' + ') + ' (' + ov.customerIds.length + '명)')); frag.appendChild(chips(ov.customerIds)); }
    frag.appendChild(detail); render();
    frag.appendChild(jsonBlock(step.input, null, '세그먼트 정의 JSON'));
    return frag;
  }
  function funnelDetail(step, data, children) {
    var frag = root.document.createDocumentFragment();
    frag.appendChild(el('div', 'pad-trace-json-label', '단계별 입력·선택·제외 고객집합과 제외 사유'));
    children.forEach(function (child) {
      var box = el('div', 'pad-trace-child'), head = el('div', 'pad-trace-child__head');
      head.appendChild(el('span', 'pad-trace-time', clock(child.startedAt))); head.appendChild(actorBadge(child.actor));
      head.appendChild(el('span', 'pad-trace-child__title', child.title)); head.appendChild(el('span', 'pad-trace-muted', ms(child.durationMs)));
      box.appendChild(head);
      box.appendChild(meta([['입력', count(child.input.inputCount) + '명'], ['선택', child.output.selected.length + '명'], ['제외', child.output.excludedCount + '명'], ['조건', child.input.rule], ['사용 필드', child.input.field]]));
      box.appendChild(el('div', 'pad-trace-json-label', '선택 고객')); box.appendChild(chips(child.output.selected, 'pad-trace-chip--ok'));
      if (child.output.excluded.length) {
        box.appendChild(el('div', 'pad-trace-json-label', '제외 고객과 사유'));
        var ul = el('ul', 'pad-trace-reasons');
        child.output.excluded.forEach(function (x) { var li = el('li'); li.appendChild(el('span', 'pad-trace-chip pad-trace-chip--warn', x.customerId)); li.appendChild(el('span', null, ' ' + x.reason)); li.appendChild(el('div', 'pad-trace-muted', x.evidenceRefs.join(', '))); ul.appendChild(li); });
        box.appendChild(ul);
      } else if (child.output.excludedCount) box.appendChild(el('div', 'pad-trace-muted', '제외 ' + count(child.output.excludedCount) + '명은 조건 미충족(급여입금 거래 없음)으로 개별 사유를 나열하지 않음'));
      frag.appendChild(box);
    });
    frag.appendChild(jsonBlock(step.output, null, '확정 결과'));
    var ev = evidence(step.evidenceRefs); if (ev) frag.appendChild(ev);
    return frag;
  }
  function mockLlmDetail(step, data) {
    var frag = root.document.createDocumentFragment(), call = data.llmCalls[step.detail.callId];
    frag.appendChild(meta([['모델', D().MODEL.display + ' · ' + call.model + ' · ' + call.deployment], ['호출', clock(step.startedAt) + ' → ' + clock(step.endedAt) + ' · ' + ms(step.durationMs)], ['목적', call.purpose]]));
    frag.appendChild(el('div', 'pad-trace-json-label', '입력 (system 지시 + 구조화 사실)'));
    call.messages.forEach(function (m) { frag.appendChild(typeof m.content === 'string' ? textBlock(m.content, m.role) : jsonBlock(m.content, null, m.role)); });
    frag.appendChild(typeof call.response.text === 'string' && Object.keys(call.response).length === 1 ? textBlock(call.response.text, '출력 · 생성 문장') : jsonBlock(call.response, null, '출력 · 판단 결과'));
    frag.appendChild(meta([['다음 단계에서 사용', step.detail.usedBy.fields.join(', ')]]));
    frag.appendChild(el('div', 'pad-trace-note', '숫자·고객 ID는 앞 단계(DATA)가 확정했고 LLM은 해석·문장만 맡는다.'));
    return frag;
  }
  function mockStepBody(step, data, children) {
    var body = el('div', 'pad-trace-step__body'); body.appendChild(stepMeta(step));
    var kind = step.detail && step.detail.kind;
    if (kind === 'compare') body.appendChild(compareDetail(step, data));
    else if (kind === 'segments') body.appendChild(segmentsDetail(step, data));
    else if (kind === 'funnel') body.appendChild(funnelDetail(step, data, children));
    else if (kind === 'llm') body.appendChild(mockLlmDetail(step, data));
    else body.appendChild(genericDetail(step));
    return body;
  }

  /* ---------- 실제 기록(검색·엑셀) 단계 상세 ---------- */
  function agentLlmDetail(step, rec) {
    var frag = root.document.createDocumentFragment(), trace = rec.agentTrace, purpose = step.stage === 'compose' ? 'compose' : 'interpret';
    var calls = trace ? trace.llm_calls.filter(function (c) { return c.purpose === purpose; }) : [], accepted = calls.filter(function (c) { return c.status === 'accepted'; })[0], first = calls[0];
    if (!first) return genericDetail(step);
    frag.appendChild(meta([['모델', first.model + (first.deployment ? ' · ' + first.deployment : ' · deployment 미제공')], ['호출', calls.map(function (c) { return (calls.length > 1 ? '시도 ' + c.attempt + ' ' : '') + ms(c.duration_ms) + ' · ' + (c.status === 'accepted' ? '채택' : c.status === 'rejected' ? '거절(' + (c.code || '') + ')' : '실패(' + (c.code || '') + ')'); }).join(' / ')], ['시각', clock(step.startedAt) + ' → ' + clock(step.endedAt) + ' (Agent)']]));
    var input = compact(first.input || {});
    if (input.message) frag.appendChild(textBlock(input.message, '입력 질문'));
    if (input.state_summary) frag.appendChild(jsonBlock(input.state_summary, null, '검색 상태 요약'));
    if (input.purpose) frag.appendChild(el('div', 'pad-trace-muted', input.purpose));
    if (accepted && accepted.output && accepted.output.plan) frag.appendChild(jsonBlock(compact(accepted.output.plan), null, '검증된 Plan (자연어 → 검색 조건)'));
    else if (accepted && accepted.output) frag.appendChild(jsonBlock(compact(accepted.output), null, '출력 요약'));
    calls.filter(function (c) { return c.status !== 'accepted' && c.output; }).forEach(function (c) { frag.appendChild(jsonBlock(compact(c.output), null, '시도 ' + c.attempt + ' 출력 요약 (거절)')); });
    frag.appendChild(el('div', 'pad-trace-note', '시스템 프롬프트 전문·원시 모델 응답은 전달하지 않는다. 숫자·고객 ID는 Python이 확정하고 Plan은 검증 후에만 실행된다.'));
    return frag;
  }
  function liveStepBody(step, rec) {
    var body = el('div', 'pad-trace-step__body');
    var agentSide = step.origin === 'agent_observed';
    body.appendChild(meta([['시작', clock(step.startedAt) + (agentSide ? ' (Agent 시각)' : '')], ['종료', step.endedAt ? clock(step.endedAt) + (agentSide ? ' (Agent 시각)' : '') : '—'], ['소요시간', step.durationMs == null ? '—' : (step.durationMs ? ms(step.durationMs) : '즉시') + (agentSide ? ' · Agent monotonic' : ' · performance.now')], ['실행 주체', step.actor + ' · ' + (ACTOR_LABEL[step.actor] || '')], ['상태', STATUS[step.status] || step.status], ['기록 출처', step.origin]]));
    if (agentSide && (step.stage === 'interpret' || step.stage === 'compose')) body.appendChild(agentLlmDetail(step, rec));
    else {
      if (step.input) body.appendChild(jsonBlock(compact(step.input), null, '입력'));
      if (step.output) {
        var out = compact(step.output);
        if (out.row_ids && out.row_ids.length > PAGE) { var ids = out.row_ids; delete out.row_ids; body.appendChild(jsonBlock(out, null, '처리 결과')); body.appendChild(pagedIds(ids, rec.id + ':' + step.id, '결과 고객 (고객식별자)')); }
        else if (out.rowIds && out.rowIds.length > PAGE) { var ids2 = out.rowIds; delete out.rowIds; body.appendChild(jsonBlock(out, null, '처리 결과')); body.appendChild(pagedIds(ids2, rec.id + ':' + step.id, '고객 (고객식별자)')); }
        else body.appendChild(jsonBlock(out, null, '처리 결과'));
      }
      var ev = evidence(step.evidenceRefs || step.evidence_refs); if (ev) body.appendChild(ev);
    }
    return body;
  }
  // 프론트 관측 단계와 Agent execution_trace 단계를 sequence·인과관계로 합친다. 서로 다른 시계이므로 절대시각 차이를 지연으로 해석하지 않는다.
  function mergedSteps(rec) {
    var front = rec.steps, agent = rec.agentTrace ? rec.agentTrace.steps.map(function (s) {
      return { id: 'a-' + s.id, sequence: s.sequence, actor: s.actor, stage: s.stage, title: s.title, status: s.status, startedAt: s.started_at, endedAt: s.ended_at, durationMs: s.duration_ms, summary: s.summary, input: s.input, output: s.output, evidenceRefs: s.evidence_refs, origin: 'agent_observed' };
    }) : [];
    var sent = front.filter(function (s) { return s.stage === 'post_sent'; }), progress = front.filter(function (s) { return s.stage === 'progress'; });
    var after = front.filter(function (s) { return s.stage !== 'post_sent' && s.stage !== 'progress'; });
    return sent.concat(agent.length ? agent : progress, after);
  }
  function timelineList(steps, traceKey, bodyBuilder) {
    var c = current, list = el('ol', 'pad-trace-steps');
    steps.forEach(function (step) {
      var li = el('li', 'pad-trace-step pad-trace-step--' + step.status), id = traceKey + ':' + step.id, expanded = !!c.state.expanded[id];
      var headBtn = button('pad-trace-step__head', null, function () {
        var open = headBtn.getAttribute('aria-expanded') !== 'true';
        c.state.expanded[id] = open; headBtn.setAttribute('aria-expanded', String(open));
        if (open && !li.querySelector('.pad-trace-step__body')) li.appendChild(bodyBuilder(step));
        var body = li.querySelector('.pad-trace-step__body'); if (body) body.hidden = !open;
      }, { 'aria-expanded': String(expanded) });
      headBtn.appendChild(el('span', 'pad-trace-time', clock(step.startedAt)));
      headBtn.appendChild(actorBadge(step.actor));
      var text = el('span', 'pad-trace-step__text'); text.appendChild(el('span', 'pad-trace-step__title', step.title)); text.appendChild(el('span', 'pad-trace-step__summary', step.summary || '')); headBtn.appendChild(text);
      if (step.status !== 'completed') headBtn.appendChild(statusBadge(step.status));
      headBtn.appendChild(el('span', 'pad-trace-caret', '▾'));
      li.appendChild(headBtn);
      if (expanded) li.appendChild(bodyBuilder(step));
      list.appendChild(li);
    });
    return list;
  }
  function section(title, subtitle) {
    var sec = el('section', 'pad-trace-section'), head = el('div', 'pad-trace-section__head');
    head.appendChild(el('h3', 'pad-trace-h3', title)); if (subtitle) head.appendChild(el('span', 'pad-trace-muted', subtitle)); sec.appendChild(head); return sec;
  }

  /* ---------- 기록 목록 ---------- */
  function mockRecord() {
    var data = D() && D().build(), entry = data && data.entries[0]; if (!entry) return null;
    return { id: MOCK_ID, kind: 'branch_briefing', title: entry.title, origin: 'frontend_fixture', status: 'completed', requestId: entry.requestId, conversationId: null, sourceSearchTraceId: null,
      startedAt: entry.requestedAt, endedAt: entry.respondedAt, durationMs: entry.durationMs, displayContext: root.PensionBranchDisplay ? root.PensionBranchDisplay.context() : null,
      steps: entry.steps, resultSummary: '대상 고객 ' + entry.customerCount + '명 · 응답 ' + ms(entry.durationMs), entry: entry, data: data };
  }
  function liveLog() { var a = root.PensionBranchSearchAdapter, ctx = a && a.get && a.get(); return ctx && ctx.traceLog ? ctx.traceLog : null; }
  function allRecords() {
    var log = liveLog(), live = log ? log.list().slice() : [];
    live.sort(function (a, b) { return (a.status === 'running') === (b.status === 'running') ? (a.startedAt < b.startedAt ? 1 : -1) : (a.status === 'running' ? -1 : 1); });
    var mock = mockRecord(); if (mock) live.push(mock);
    return live;
  }
  function findRecord(id) { return allRecords().filter(function (r) { return r.id === id; })[0] || null; }
  function renderList() {
    var c = current, wrap = el('div', 'pad-trace-list'), records = allRecords();
    wrap.appendChild(el('p', 'pad-trace-lead', '기록 ' + records.length + '건 · ' + (root.PensionBranchDisplay ? root.PensionBranchDisplay.scopeLabel() : '') + ' · 화면 세션 동안 유지'));
    records.forEach(function (rec) {
      var item = button('pad-trace-item pad-trace-item--' + rec.status, null, function () { c.state.view = 'detail'; c.state.selectedId = rec.id; render(); c.body.scrollTop = 0; });
      var top = el('div', 'pad-trace-item__top'), left = el('span', 'pad-trace-item__lead');
      left.appendChild(el('span', 'pad-trace-kind', KIND[rec.kind] || rec.kind)); left.appendChild(el('span', 'pad-trace-item__title', rec.title)); top.appendChild(left);
      if (rec.status !== 'completed') top.appendChild(statusBadge(rec.status)); item.appendChild(top);
      item.appendChild(el('div', 'pad-trace-item__sub', (rec.kind === 'branch_briefing' ? rec.displayContext.branchName + ' · 요청 ' + rec.requestId : rec.kind === 'branch_search' ? '요청 ' + rec.requestId + (rec.status === 'running' && rec.phase ? ' · ' + (root.PensionExecutionTraceLog.PHASE_LABEL[rec.phase] || rec.phase) : '') : '실행 ' + rec.id)));
      var grid = el('div', 'pad-trace-item__grid');
      var cells = rec.kind === 'branch_briefing'
        ? [['요청 시각', clock(rec.startedAt)], ['응답 시각', clock(rec.endedAt)], ['소요', ms(rec.durationMs)], ['결과', rec.resultSummary]]
        : [['시작', clock(rec.startedAt)], ['종료', rec.endedAt ? clock(rec.endedAt) : '진행 중'], ['소요', rec.durationMs == null ? '—' : ms(rec.durationMs)], ['결과', rec.resultSummary || (rec.status === 'running' ? '처리 중' : '—')]];
      cells.forEach(function (p) { var cell = el('div', 'pad-trace-item__cell'); cell.appendChild(el('span', 'pad-trace-item__k', p[0])); cell.appendChild(el('span', 'pad-trace-item__v', p[1])); grid.appendChild(cell); });
      item.appendChild(grid); wrap.appendChild(item);
    });
    return wrap;
  }

  /* ---------- 핵심 흐름(기본 보기) ----------
   * 기본 보기는 Agent의 판단 흐름만 남긴다: 스냅샷 비교 → 관리 포인트 도출 → LLM 해석 → 확정.
   * 전송·수신·검증 같은 배관 단계와 프론트 관측 단계는 '전체 단계 보기'에서만 보인다. 기록 데이터는 바꾸지 않는다. */
  function mode(rec) { return current.state.detailMode[rec.id] || 'core'; }
  function modeToggle(rec, coreCount, allCount) {
    var c = current, wrap = el('div', 'pad-trace-mode'), core = mode(rec) === 'core';
    wrap.appendChild(el('span', 'pad-trace-muted', core ? '핵심 단계 ' + coreCount + '개' : '전체 단계 ' + allCount + '개'));
    wrap.appendChild(button('pad-trace-link pad-trace-link--quiet', core ? '전체 단계 보기' : '핵심 단계만 보기', function () { c.state.detailMode[rec.id] = core ? 'all' : 'core'; render(); }));
    return wrap;
  }
  // 기본 보기: 기록을 업무 단위로 묶는다(부점 브리핑 3 · 검색 3 · 엑셀 2). 내부 단계는 묶음 안에서 그대로 펼쳐 볼 수 있다.
  function group(id, title, members, extra) {
    if (!members.length) return null;
    var first = members[0], last = members[members.length - 1];
    return Object.assign({ id: id, actor: first.actor, title: title, summary: members.map(function (m) { return m.summary; }).filter(Boolean).join(' → '), status: members.some(function (m) { return m.status === 'failed'; }) ? 'failed' : members.some(function (m) { return m.status === 'cancelled'; }) ? 'cancelled' : members.some(function (m) { return m.status === 'running'; }) ? 'running' : 'completed',
      startedAt: first.startedAt, endedAt: last.endedAt, durationMs: members.reduce(function (n, m) { return n + (m.durationMs || 0); }, 0), members: members,
      body: function () { var body = el('div', 'pad-trace-step__body'); body.appendChild(timelineList(members, id, function (step) { return step.body ? step.body() : el('div', 'pad-trace-step__body'); })); return body; } }, extra || {});
  }
  function briefingCore(rec) {
    var data = rec.data, gen = data.traces.generation, byId = {}; gen.steps.forEach(function (s) { byId[s.id] = s; });
    var childrenOf = function (id) { return gen.steps.filter(function (s) { return s.parentId === id; }); };
    var wrap = function (ids) { return ids.map(function (id) { var step = byId[id]; return Object.assign({}, step, { body: function () { return mockStepBody(step, data, childrenOf(step.id)); } }); }); };
    return [group('brief-change', '고객 변화 확인', wrap(['g01', 'g02']), { summary: '전일·금일 ' + count(data.snapshots.curr.customers.length) + '명 비교 · 사실이 바뀐 고객 ' + byId.g01.output.changedCustomerCount + '명 · ' + data.segments.filter(function (x) { return x.net; }).length + '개 세그먼트 변동' }),
      group('brief-target', '관리대상 선정', wrap(['g03']), { summary: byId.g03.summary }),
      group('brief-compose', '브리핑 구성', wrap(['g04', 'g05', 'g06']), { summary: '관리방향 해석 → 문장 생성 (Gemma 4) → 근거 대조 · ' + ms(byId.g04.durationMs + byId.g05.durationMs + byId.g06.durationMs) })].filter(Boolean);
  }
  function agentStep(s) { return { id: 'a-' + s.id, sequence: s.sequence, actor: s.actor, stage: s.stage, title: s.title, status: s.status, startedAt: s.started_at, endedAt: s.ended_at, durationMs: s.duration_ms, summary: s.summary, input: s.input, output: s.output, evidenceRefs: s.evidence_refs, origin: 'agent_observed' }; }
  function searchCore(rec) {
    var trace = rec.agentTrace; if (!trace) return null;
    var steps = trace.steps.map(function (s) { var step = agentStep(s); step.body = function () { return liveStepBody(step, rec); }; return step; });
    var by = function (stages) { return steps.filter(function (s) { return stages.indexOf(s.stage) >= 0; }); };
    var rendered = rec.steps.filter(function (s) { return s.stage === 'list_rendered'; }).map(function (s) { return Object.assign({}, s, { body: function () { return liveStepBody(s, rec); } }); });
    var labels = conditionLabels(rec);
    return [group('search-interpret', '검색조건 해석', by(['interpret', 'plan']), { summary: labels && labels.length ? '조건 ' + labels.join(' 및 ') : undefined }),
      group('search-query', '고객 조회', by(['apply', 'compose'])),
      group('search-apply', '결과 반영', by(['answer']).concat(rendered), { summary: rec.answer ? (rec.answer.listAction === 'replace' ? '목록 교체 · ' + rec.answer.count + '명' : rec.answer.listAction === 'reset' ? '기존 목록 복원' : '목록 유지') + (rec.listApplied && rec.listApplied.action !== 'keep' ? ' · 화면 반영 완료' : '') : undefined })].filter(Boolean);
  }
  function exportCore(rec) {
    var steps = rec.steps.map(function (s) { return Object.assign({}, s, { body: function () { return liveStepBody(s, rec); } }); });
    var by = function (stages) { return steps.filter(function (s) { return stages.indexOf(s.stage) >= 0; }); };
    return [group('export-target', '추출대상 확인', by(['capture', 'empty'])), group('export-file', '파일 생성·다운로드 요청', by(['build', 'download', 'cancelled', 'failed']).concat(steps.filter(function (s) { return s.status === 'failed' && ['capture', 'empty', 'build', 'download', 'cancelled'].indexOf(s.stage) < 0; })))].filter(Boolean);
  }
  function coreTimeline(steps, key) { return timelineList(steps, key, function (step) { return step.body ? step.body() : el('div', 'pad-trace-step__body'); }); }

  /* ---------- 상세 ---------- */
  function renderBriefingDetail(rec) {
    if (mode(rec) === 'core') return renderBriefingCore(rec);
    var wrap = el('div', 'pad-trace-detail'), entry = rec.entry, data = rec.data, gen = data.traces.generation;
    wrap.appendChild(modeToggle(rec, briefingCore(rec).length, gen.steps.filter(function (s) { return !s.parentId; }).length + entry.steps.length));
    wrap.appendChild(meta([['요청 식별자', entry.requestId], ['조회 trace', entry.traceId], ['연결된 생성 trace', entry.linkedGenerationTraceId], ['기준일', dateLabel(entry.asOfDate + 'T00:00:00+09:00') + ' (' + entry.timezone + ')'], ['요청 → 응답', clock(entry.requestedAt) + ' → ' + clock(entry.respondedAt) + ' · ' + ms(entry.durationMs)], ['생성(요청 안)', clock(gen.startedAt) + ' → ' + clock(gen.endedAt) + ' · ' + ms(gen.durationMs)], ['표시 범위', rec.displayContext ? rec.displayContext.scopeLabel : ''], ['상태', '완료']]));
    var pathSec = section('요청·응답 경로'), ol = el('ol', 'pad-trace-path');
    entry.path.forEach(function (p) { var li = el('li'); li.appendChild(actorBadge(p.from)); li.appendChild(el('span', 'pad-trace-path__arrow', '→')); li.appendChild(actorBadge(p.to)); li.appendChild(el('span', 'pad-trace-path__label', p.label)); li.appendChild(el('span', 'pad-trace-muted', p.detail)); ol.appendChild(li); });
    pathSec.appendChild(ol);
    pathSec.appendChild(el('div', 'pad-trace-note', '화면 렌더링 직후의 첫 요청이며 생성은 이 요청 안에서 수행되었다. 토큰·인증 헤더·직원 ID·Connector URL은 표시하지 않는다.'));
    wrap.appendChild(pathSec);
    var childrenOf = function (id) { return gen.steps.filter(function (s) { return s.parentId === id; }); };
    var genSec = section('생성 과정', clock(gen.startedAt) + ' → ' + clock(gen.endedAt) + ' · ' + ms(gen.durationMs) + ' · ' + gen.steps.filter(function (s) { return !s.parentId; }).length + '단계');
    genSec.appendChild(timelineList(gen.steps.filter(function (s) { return !s.parentId; }), gen.traceId, function (step) { return mockStepBody(step, data, childrenOf(step.id)); }));
    wrap.appendChild(genSec);
    var retSec = section('저장된 결과 조회', clock(entry.requestedAt) + ' → ' + clock(entry.respondedAt) + ' · ' + ms(entry.durationMs) + ' · ' + entry.steps.length + '단계');
    retSec.appendChild(timelineList(entry.steps, entry.traceId, function (step) { return mockStepBody(step, data, []); }));
    wrap.appendChild(retSec);
    var fin = section('최종 브리핑'), card = el('div', 'pad-trace-final');
    card.appendChild(el('div', 'pad-trace-final__kicker', '오늘의 부점 브리핑 · 기준일 ' + dateLabel(entry.asOfDate + 'T00:00:00+09:00') + ' · 대상 고객 ' + entry.customerCount + '명'));
    card.appendChild(el('div', 'pad-trace-final__text', entry.text)); fin.appendChild(card); wrap.appendChild(fin);
    return wrap;
  }
  function renderBriefingCore(rec) {
    var wrap = el('div', 'pad-trace-detail'), entry = rec.entry, data = rec.data, gen = data.traces.generation, steps = briefingCore(rec);
    wrap.appendChild(meta([['기준일', dateLabel(entry.asOfDate + 'T00:00:00+09:00') + ' · 전일 07:25 / 금일 07:25 스냅샷'], ['요청 → 응답', clock(entry.requestedAt) + ' → ' + clock(entry.respondedAt) + ' · ' + ms(entry.durationMs) + ' · 화면 렌더링 직후 첫 요청'], ['생성', clock(gen.startedAt) + ' → ' + clock(gen.endedAt) + ' · ' + ms(gen.durationMs) + ' (요청 안에서 수행)'], ['대상', '추가납입 상담 고객 ' + entry.customerCount + '명']]));
    wrap.appendChild(modeToggle(rec, steps.length, gen.steps.filter(function (s) { return !s.parentId; }).length + entry.steps.length));
    var sec = section('판단 흐름'); sec.appendChild(coreTimeline(steps, gen.traceId + ':core')); wrap.appendChild(sec);
    var fin = section('최종 브리핑'), card = el('div', 'pad-trace-final'); card.appendChild(el('div', 'pad-trace-final__text', entry.text)); fin.appendChild(card); wrap.appendChild(fin);
    return wrap;
  }
  function renderSearchCore(rec) {
    var wrap = el('div', 'pad-trace-detail'), trace = rec.agentTrace, steps = searchCore(rec), labels = conditionLabels(rec);
    wrap.appendChild(meta([['질문', rec.message + (rec.action ? ' (버튼: ' + rec.action.type + ')' : '')], ['조건', labels && labels.length ? labels.join(' · ') : (rec.answer ? (root.PensionExecutionTraceLog.INTENT_LABEL[rec.answer.intent] || rec.answer.intent) : rec.status === 'running' ? '해석 중' : '—')], ['결과', rec.answer ? rec.answer.count + '명' + (rec.answer.unknownRowIds.length ? ' · 미확인 ' + rec.answer.unknownRowIds.length + '명' : '') + ' · ' + (rec.displayContext ? rec.displayContext.scopeLabel + ' 중' : '') : rec.error ? '오류 ' + rec.error.code : '—'], ['소요', (rec.durationMs != null ? ms(rec.durationMs) + ' (프론트 전송→목록 반영)' : rec.status === 'running' ? '진행 중' : '—') + (trace ? ' · Agent ' + ms(trace.duration_ms) : '')], ['상태', STATUS[rec.status] || rec.status]]));
    var allCount = mergedSteps(rec).length;
    wrap.appendChild(modeToggle(rec, steps ? steps.length : 0, allCount));
    var sec = section('판단 흐름');
    if (steps && steps.length) sec.appendChild(coreTimeline(steps, rec.id + ':core'));
    else sec.appendChild(el('div', 'pad-trace-muted', rec.status === 'running' ? '응답을 기다리는 중 · ' + (rec.phase ? (root.PensionExecutionTraceLog.PHASE_LABEL[rec.phase] || rec.phase) : '') : 'Agent 기록이 없는 응답이다. 전체 단계 보기에서 프론트 관측 기록만 확인할 수 있다.'));
    wrap.appendChild(sec);
    if (rec.answer) { var fin = section('답변'), card = el('div', 'pad-trace-final'); card.appendChild(el('div', 'pad-trace-final__text', rec.answer.text)); fin.appendChild(card); fin.appendChild(pagedIds(rec.answer.rowIds, rec.id + ':result', '결과 고객 (고객식별자)')); wrap.appendChild(fin); }
    else if (rec.error) wrap.appendChild(el('div', 'pad-trace-note', '코드 ' + rec.error.code + (rec.error.message ? ' · ' + rec.error.message : '') + ' · 기존 목록과 조건은 유지됨'));
    return wrap;
  }
  function renderExportCore(rec) {
    var c = current, wrap = el('div', 'pad-trace-detail'), linked = rec.sourceSearchTraceId ? findRecord(rec.sourceSearchTraceId) : null, steps = exportCore(rec);
    var link = linked ? button('pad-trace-link', linked.title, function () { c.state.selectedId = linked.id; render(); c.body.scrollTop = 0; }) : null;
    wrap.appendChild(meta([['대상', rec.rowIds.length + '명 · ' + (rec.listSource === 'ai_search' ? 'AI 검색 결과' : '메인 목록/필터') + ' · 조건 「' + rec.condition + '」'], ['연결된 검색', link || '없음'], ['파일', rec.file ? rec.file.fileName + ' · ' + rec.file.byteLength.toLocaleString('ko-KR') + ' bytes' : (rec.status === 'running' ? '생성 전' : '생성되지 않음')], ['소요', (rec.durationMs != null ? ms(rec.durationMs) : '—') + (rec.waitMs != null ? ' (표시 대기 ' + ms(rec.waitMs) + ' 포함, 파일 생성과 별도)' : '')], ['상태', STATUS[rec.status] || rec.status]]));
    wrap.appendChild(modeToggle(rec, steps.length, rec.steps.length));
    var sec = section('실행 흐름'); sec.appendChild(coreTimeline(steps, rec.id + ':core')); wrap.appendChild(sec);
    return wrap;
  }
  function conditionLabels(rec) {
    var trace = rec.agentTrace, confirm = trace && trace.steps.filter(function (s) { return (s.stage === 'plan' || s.stage === 'apply') && s.output && s.output.labels; })[0];
    if (confirm) return confirm.output.labels;
    if (rec.answer && rec.answer.contextLabel) return [rec.answer.contextLabel];
    return null;
  }
  function renderSearchDetail(rec) {
    if (mode(rec) === 'core') return renderSearchCore(rec);
    var wrap = el('div', 'pad-trace-detail'), trace = rec.agentTrace, call = trace && trace.llm_calls[0];
    wrap.appendChild(modeToggle(rec, (searchCore(rec) || []).length, mergedSteps(rec).length));
    wrap.appendChild(meta([['요청 식별자', rec.requestId], ['대화 식별자', rec.conversationId], ['질문', rec.message + (rec.action ? ' (버튼 action: ' + rec.action.type + ')' : '')], ['상태', STATUS[rec.status] || rec.status], ['전송 → 완료', rec.sentAt ? clock(rec.sentAt) + ' → ' + (rec.endedAt ? clock(rec.endedAt) : '진행 중') + (rec.durationMs != null ? ' · ' + ms(rec.durationMs) + ' (프론트 performance.now)' : '') : '전송 전'], ['Agent 처리', trace ? clock(trace.started_at) + ' → ' + clock(trace.ended_at) + ' · ' + ms(trace.duration_ms) + ' (Agent monotonic · ' + trace.status + ')' : (rec.status === 'running' ? '응답 대기 중' : 'execution_trace 없음 · 미확인')], ['모델', call ? call.model + (call.deployment ? ' · ' + call.deployment : '') + ' · 호출 ' + trace.llm_calls.length + '회' : (trace ? 'LLM 호출 없음(버튼 action 경로)' : null)], ['데이터 버전', rec.answer ? rec.answer.datasetId + ' · ' + rec.answer.dataVersion.slice(0, 12) + '… · ' + rec.answer.ruleVersion : null], ['revision', rec.answer ? String(rec.baseRevision) + ' → ' + rec.answer.revision : String(rec.baseRevision)]]));
    var scope = section('범위 요약'), box = el('div', 'pad-trace-scope'), labels = conditionLabels(rec);
    box.appendChild(el('div', 'pad-trace-scope__line', rec.displayContext ? rec.displayContext.scopeLabel : ''));
    box.appendChild(el('div', 'pad-trace-scope__line', '적용 조건: ' + (labels && labels.length ? labels.join(' · ') : rec.answer ? (root.PensionExecutionTraceLog.INTENT_LABEL[rec.answer.intent] || rec.answer.intent) : '해석 중')));
    box.appendChild(el('div', 'pad-trace-scope__line pad-trace-scope__line--strong', '검색 결과: ' + (rec.answer ? rec.answer.count + '명' + (rec.answer.unknownRowIds.length ? ' · 미확인 ' + rec.answer.unknownRowIds.length + '명' : '') : rec.error ? '오류 ' + rec.error.code : '—')));
    box.appendChild(el('div', 'pad-trace-muted', '관리 고객 수는 표시용 범위(display_config)이며, 결과 인원·ID·순서는 Agent 응답의 실제 값이다.'));
    scope.appendChild(box); wrap.appendChild(scope);
    var pathSec = section('전달 경로'), ol = el('ol', 'pad-trace-path');
    [['FRONT', 'FABRIX', 'POST FabriX Connector', rec.sentAt ? '전송 ' + clock(rec.sentAt) : '전송 전'], ['FABRIX', 'AGENT', 'Agent POST /chat', 'FabriX 내부 시각은 관측하지 않음'], ['AGENT', 'FRONT', 'FabriX SSE CHUNK', rec.endedAt && rec.steps.some(function (s) { return s.stage === 'response_stream'; }) ? '수신 완료' : '수신 대기']].forEach(function (p) {
      var li = el('li'); li.appendChild(actorBadge(p[0])); li.appendChild(el('span', 'pad-trace-path__arrow', '→')); li.appendChild(actorBadge(p[1])); li.appendChild(el('span', 'pad-trace-path__label', p[2])); li.appendChild(el('span', 'pad-trace-muted', p[3])); ol.appendChild(li);
    });
    pathSec.appendChild(ol); wrap.appendChild(pathSec);
    var steps = mergedSteps(rec);
    var tl = section('실행 타임라인', steps.length + '단계' + (trace ? ' · Agent 기록 ' + trace.steps.length + '단계 포함' : rec.status === 'running' ? ' · 진행 중' : ' · 프론트 관측 기록만'));
    if (!trace && rec.status !== 'running') tl.appendChild(el('div', 'pad-trace-note', 'Agent execution_trace가 없는 응답이다. 실제로 관측한 프론트·progress 기록만 표시하고 누락된 Agent 단계는 만들지 않는다.'));
    tl.appendChild(timelineList(steps, rec.id, function (step) { return liveStepBody(step, rec); }));
    wrap.appendChild(tl);
    var fin = section(rec.error ? '오류 응답' : '최종 답변');
    if (rec.answer) {
      var card = el('div', 'pad-trace-final pad-trace-final--plain');
      card.appendChild(el('div', 'pad-trace-final__kicker', (root.PensionExecutionTraceLog.INTENT_LABEL[rec.answer.intent] || rec.answer.intent) + ' · ' + rec.answer.status + ' · list_action ' + rec.answer.listAction));
      card.appendChild(el('div', 'pad-trace-final__text', rec.answer.text));
      if (rec.answer.contextLabel) card.appendChild(el('div', 'pad-trace-muted', rec.answer.contextLabel));
      fin.appendChild(card);
      fin.appendChild(pagedIds(rec.answer.rowIds, rec.id + ':result', '결과 고객 (고객식별자)'));
      if (rec.answer.sort) fin.appendChild(meta([['표시 순서', rec.answer.sort.field === 'source_order' ? '기존 목록 순서 유지' : rec.answer.sort.field + ' ' + rec.answer.sort.direction], ['후속 버튼', rec.answer.actions.join(' / ') || '없음']]));
    } else if (rec.error) fin.appendChild(el('div', 'pad-trace-note', '코드 ' + rec.error.code + (rec.error.message ? ' · ' + rec.error.message : '') + ' · 기존 목록과 조건은 유지됨'));
    else fin.appendChild(el('div', 'pad-trace-muted', rec.status === 'running' ? '응답을 기다리는 중' : '최종 답변 없음'));
    wrap.appendChild(fin);
    return wrap;
  }
  function renderExportDetail(rec) {
    if (mode(rec) === 'core') return renderExportCore(rec);
    var c = current, wrap = el('div', 'pad-trace-detail'), linked = rec.sourceSearchTraceId ? findRecord(rec.sourceSearchTraceId) : null;
    wrap.appendChild(modeToggle(rec, exportCore(rec).length, rec.steps.length));
    var link = null;
    if (linked) link = button('pad-trace-link', linked.title + ' (' + (linked.resultSummary || STATUS[linked.status]) + ')', function () { c.state.selectedId = linked.id; render(); c.body.scrollTop = 0; }, { 'aria-label': '연결된 검색 이력으로 이동' });
    wrap.appendChild(meta([['실행 식별자', rec.id], ['상태', STATUS[rec.status] || rec.status], ['시작 → 종료', clock(rec.startedAt) + ' → ' + (rec.endedAt ? clock(rec.endedAt) : '진행 중') + (rec.durationMs != null ? ' · ' + ms(rec.durationMs) : '')], ['표시 대기', rec.waitMs != null ? ms(rec.waitMs) + ' (파일 생성 시간과 별도)' : null], ['목록 출처', rec.listSource === 'ai_search' ? 'AI 검색 결과 · 화면 revision ' + rec.listRevision : '메인 목록/필터 · 화면 revision ' + rec.listRevision], ['연결된 검색 이력', link || (rec.sourceSearchTraceId ? rec.sourceSearchTraceId : '없음')], ['처리 주체', 'FRONT → EXPORT(브라우저 내 XLSX 조립) → FRONT · Agent/Gemma/FabriX 호출 없음']]));
    var info = section('파일 정보');
    if (rec.file) info.appendChild(meta([['파일명', rec.file.fileName], ['파일 크기', rec.file.byteLength.toLocaleString('ko-KR') + ' bytes'], ['고객 데이터 행', rec.file.rowCount + '행 (헤더 제외)'], ['열', rec.file.columnCount + '개 · ' + rec.file.columns.join(', ')], ['시트', rec.file.sheetNames.join(' / ')], ['적용 조건', rec.condition], ['기준일', rec.asOf || '확인 필요'], ['추출 범위', rec.scope]]));
    else info.appendChild(meta([['적용 조건', rec.condition], ['기준일', rec.asOf || '확인 필요'], ['추출 범위', rec.scope], ['파일', rec.status === 'running' ? '생성 전' : '생성되지 않음']]));
    info.appendChild(el('div', 'pad-trace-note', '수신평잔 등 일부 값은 기존 표시용 산출 기준을 그대로 쓴다(새 은행 API 조회 결과가 아님). 다운로드 실행 이후의 디스크 저장 완료는 브라우저 코드로 확인할 수 없다.'));
    wrap.appendChild(info);
    var tl = section('실행 타임라인', rec.steps.length + '단계'); tl.appendChild(timelineList(rec.steps, rec.id, function (step) { return liveStepBody(step, rec); })); wrap.appendChild(tl);
    var ids = section('추출 대상 고객 (요청 시점 스냅샷)'); ids.appendChild(pagedIds(rec.rowIds, rec.id + ':rows', '고객식별자 · 순서 고정')); wrap.appendChild(ids);
    return wrap;
  }
  function render() {
    var c = current; if (!c) return;
    var detail = c.state.view === 'detail', rec = detail ? findRecord(c.state.selectedId) : null;
    if (detail && !rec) { c.state.view = 'list'; detail = false; }
    c.back.hidden = !detail;
    c.title.textContent = detail ? rec.title : '처리 이력';
    c.subtitle.textContent = detail ? (KIND[rec.kind] + ' · ' + (STATUS[rec.status] || rec.status) + ' · ' + dateLabel(rec.startedAt)) : '요청·응답 목록';
    var top = c.body.scrollTop;
    c.body.replaceChildren(detail ? (rec.kind === 'branch_briefing' ? renderBriefingDetail(rec) : rec.kind === 'excel_export' ? renderExportDetail(rec) : renderSearchDetail(rec)) : renderList());
    c.body.scrollTop = top;
  }
  function scheduleRefresh() {
    var c = current; if (!c) return;
    if (!c.state.open || !c.rendered) { c.dirty = true; return; }
    if (c.frame) return;
    c.frame = (typeof root.requestAnimationFrame === 'function' ? root.requestAnimationFrame : function (f) { return setTimeout(f, 16); })(function () { c.frame = null; if (current === c) render(); });
  }

  /* ---------- host·열기·닫기 ---------- */
  function launcher(visible) { var adapter = root.PensionBranchSearchAdapter, ctx = adapter && adapter.get && adapter.get(); if (ctx && ctx.widget && typeof ctx.widget.setVisible === 'function') ctx.widget.setVisible(visible); }
  function trigger() { return current && current.app.querySelector('.pad-trace-open'); }
  function syncTrigger() { var b = trigger(); if (b) b.setAttribute('aria-expanded', current && current.state.open ? 'true' : 'false'); }
  function open() {
    var c = current; if (!c || c.state.open) return;
    c.state.open = true; c.host.hidden = false;
    if (!c.rendered || c.dirty) { c.rendered = true; c.dirty = false; render(); }
    launcher(false); syncTrigger();
    c.close.focus({ preventScroll: true });
  }
  function close(returnFocus) {
    var c = current; if (!c || !c.state.open) return;
    c.state.open = false; c.host.hidden = true;
    launcher(!c.component.state.sel); syncTrigger();
    var b = trigger(); if (returnFocus !== false && b) b.focus({ preventScroll: true });
  }
  function create(component) {
    if (!hasDom()) return;
    destroy();
    var app = root.document.getElementById('pensionAgentDemo'); if (!app) return;
    // 오늘의 부점 브리핑 목업의 기준 시각 = 화면이 처음 렌더링된 지금. 이후 열 때마다 같은 기록을 보여준다.
    if (D() && D().setBase) D().setBase(Date.now());
    app.classList.add('pad-trace-anchor');
    var host = el('div', 'pad-trace-host'); host.id = HOST_ID; host.hidden = true;
    var panel = el('aside', 'pad-trace-panel'); panel.id = PANEL_ID; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'false'); panel.setAttribute('aria-labelledby', PANEL_ID + '-title'); panel.setAttribute('tabindex', '-1');
    var head = el('div', 'pad-trace-head');
    var back = button('pad-trace-nav', '← 목록', function () { current.state.view = 'list'; render(); current.body.scrollTop = 0; }, { 'aria-label': '목록으로 돌아가기' }); back.hidden = true;
    var titles = el('div', 'pad-trace-head__titles'), title = el('h2', 'pad-trace-title', '처리 이력'); title.id = PANEL_ID + '-title';
    var subtitle = el('div', 'pad-trace-subtitle', '요청·응답 목록'); titles.appendChild(title); titles.appendChild(subtitle);
    var closeBtn = button('pad-trace-close', '닫기', function () { close(true); }, { 'aria-label': '처리 이력 닫기' });
    head.appendChild(back); head.appendChild(titles); head.appendChild(closeBtn);
    var body = el('div', 'pad-trace-body'); body.setAttribute('data-trace-scroll', '');
    panel.appendChild(head); panel.appendChild(body); host.appendChild(panel); app.appendChild(host);
    var onKey = function (e) { if (e.key === 'Escape' && current && current.state.open) { e.stopPropagation(); close(true); } };
    host.addEventListener('keydown', onKey);
    current = { component: component, app: app, host: host, panel: panel, body: body, back: back, title: title, subtitle: subtitle, close: closeBtn, onKey: onKey, rendered: false, dirty: false, frame: null, unsubscribe: null,
      state: { open: false, view: 'list', selectedId: null, expanded: {}, pages: {}, caseSel: {}, detailMode: {} } };
    var log = liveLog();
    if (log) current.unsubscribe = log.subscribe(function () { scheduleRefresh(); });
  }
  function destroy() {
    var c = current; if (!c) return; current = null;
    if (c.unsubscribe) { try { c.unsubscribe(); } catch (_) {} }
    if (c.frame && typeof root.cancelAnimationFrame === 'function') root.cancelAnimationFrame(c.frame);
    c.host.removeEventListener('keydown', c.onKey);
    if (c.host.parentNode) c.host.parentNode.removeChild(c.host);
    c.app.classList.remove('pad-trace-anchor');
  }
  function afterRender(component) {
    var c = current; if (!c || c.component !== component) return;
    if (c.state.open) launcher(false);
    syncTrigger();
  }
  function install(Component) {
    if (Component.prototype.__padTraceInstalled) return;
    Component.prototype.__padTraceInstalled = true;
    var mount = Component.prototype.componentDidMount, unmount = Component.prototype.componentWillUnmount, renderVals = Component.prototype.renderVals;
    Component.prototype.componentDidMount = function () { if (mount) mount.apply(this, arguments); create(this); };
    Component.prototype.componentWillUnmount = function () { destroy(); return unmount ? unmount.apply(this, arguments) : undefined; };
    Component.prototype.renderVals = function () {
      var base = renderVals.apply(this, arguments);
      base.openTrace = function () { open(); };
      base.traceExpanded = current && current.state.open ? 'true' : 'false';
      return base;
    };
  }
  root.PensionExecutionTracePanel = { install: install, afterRender: afterRender, open: open, close: close, destroy: destroy, get: function () { return current; }, jsonLines: jsonLines, mergedSteps: mergedSteps, records: allRecords, kst: kstParts, customerLabel: customerLabel };
})(typeof window === 'undefined' ? globalThis : window);

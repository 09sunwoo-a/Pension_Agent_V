/* Local contracts/data/render checks. No server, fake API or browser automation. */
'use strict';
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { ROOT, OUT, inputs, artifacts, agentData } = require('./build');
const contract = require('../../frontend/src/briefing/briefing-contract');
const wire = require('../../frontend/src/briefing/fabrix-briefing-contract');
const transport = require('../../frontend/src/briefing/fabrix-transport');
const chatTransport = require('../../frontend/src/briefing/fabrix-chat-transport');
const { create } = require('../../frontend/src/briefing/pensionBriefingStore');
const copy = x => JSON.parse(JSON.stringify(x));
// 화면은 모든 자료 날짜를 오늘로 평행이동한다(pensionDisplayDate.js). 검사는 자료 기준일에 고정해 기존 값으로 확인하고, 이동 자체는 displayDateCheck()에서 본다.
const DATA_AS_OF = '2026-09-29';
globalThis.__PENSION_DISPLAY_DATE = DATA_AS_OF;
const { customers, briefings, noBriefing } = inputs();
assert.equal(customers.length, 42, 'Expected 30 case customers + 12 conversational-agent demo customers. Update intentionally when adding cases.');
assert.equal(briefings.filter(Boolean).length, 42, 'Expected 42 stored briefings (30 B cases + 12 C01 customers)');
assert.deepEqual(noBriefing, [], 'Every customer ships with a stored briefing');
const FIRST = customers[briefings.findIndex(Boolean)].briefingMeta.caseId;
const js = fs.readFileSync(path.join(OUT, 'pensionAgentDemo.js'), 'utf8');
const code = js.match(/^\s*var STARROOT_FILE_CODE = '([^']+)'/m)[1];
const expected = artifacts(code);
assert.deepEqual(fs.readdirSync(OUT).sort(), Object.keys(expected).sort());
for (const [name, body] of Object.entries(expected)) assert.equal(fs.readFileSync(path.join(OUT, name), 'utf8'), body, 'Rebuild required: ' + name);
// 오세훈(C01-07) 분석 근거: 빌드가 검증한 팩이 Agent 묶음에만 실리고, 응답의 analysis_trace는 프론트 계약으로 검증된다.
const EVIDENCE_CASE = 'C01-07';
const evidence = agentData({ customers, briefings }).cases[EVIDENCE_CASE].analysis_evidence;
assert.ok(evidence, 'C01-07 record carries its analysis evidence');
assert.deepEqual([evidence.facts.length, evidence.judgments.length, evidence.knowledge_cards.length, evidence.bindings.length, evidence.knowledge_cards.reduce((n, c) => n + c.raw_excerpts.length, 0), evidence.presentation.steps.map(s => s.id)],
  [6, 4, 11, 49, 12, ['customer_summary', 'management_focus', 'knowledge_selection', 'briefing_binding']], 'Evidence pack counts and the four steps');
assert.ok(!/expected_|source_path|sha256|line_start|internal_notes|registry_id/.test(JSON.stringify(evidence)), 'Authoring baselines, corpus paths, hashes and notes never ship');
assert.ok(Object.values(agentData({ customers, briefings }).cases).filter(c => c.analysis_evidence).length === 1, 'Only C01-07 has evidence');
const evidenceCustomer = customers.find(c => c.briefingMeta.caseId === EVIDENCE_CASE), evidenceBriefing = contract.contentOf(briefings[customers.indexOf(evidenceCustomer)]);
{ // briefing_ui_revision: 카드는 원천 id를 싣고, 그 id는 같은 브리핑의 sources에 있어야 한다. 상품 3종 카드는 RAW가 없다.
  const sourceIds = new Set(evidenceBriefing.sources.map(s => s.id));
  assert.deepEqual(evidence.knowledge_cards.map(c => c.source_id).filter(id => id == null), [], 'Every knowledge card names its source');
  assert.ok(evidence.knowledge_cards.every(c => sourceIds.has(c.source_id)), 'Card source_id ⊂ briefing.sources');
  assert.deepEqual(evidence.knowledge_cards.filter(c => c.product_id).map(c => c.raw_excerpts.length), [0, 0, 0], 'Product cards carry no RAW excerpts');
  assert.deepEqual([evidenceBriefing.sources.length, evidenceBriefing.s5.tips.map(t => t.kind), evidenceBriefing.s5.tips[0].publishedAt, evidenceBriefing.s5.actions.length], [9, ['hot_tip', 'follow_up'], '2025-02-27', 4], 'C01-07: 9 sources, one Hot Tip + one follow-up, 4 actions kept');
  assert.ok(/^https:\/\/lxp\.kbstar\.com\//.test(evidenceBriefing.sources.find(s => s.id === evidenceBriefing.s5.tips[0].sourceIds[0]).url), 'Hot Tip links to the LXP original');
  assert.ok(!evidence.bindings.some(b => /\/products\/\d+\/(reason|notes)/.test(b.target)), 'No bindings to hidden product reason/notes');
  assert.ok(!/AS-IS|TO-BE|DEMO|MOCK/.test(JSON.stringify(evidenceBriefing)), 'No planning words in the briefing');
}
// Frontend-side stand-in for the Agent's analysis_trace (same evidence pack, real clock); used only by the fake fetch below.
function traceFor(req, briefing) {
  const now = new Date().toISOString();
  return { mode: 'fixed_briefing_evidence', origin: 'agent_observed', judgment_origin: 'case_authored', llm_calls: 0, case_id: req.case_id, as_of_date: req.as_of_date, started_at: now, ended_at: now, duration_ms: 0,
    panel_title: evidence.presentation.panel_title, button: evidence.presentation.button,
    steps: evidence.presentation.steps.map((s, i) => ({ id: s.id, sequence: i + 1, title: s.title, summary: s.summary, started_at: now, ended_at: now, duration_ms: 0, fact_ids: s.fact_ids, judgment_ids: s.judgment_ids, group_ids: s.group_ids, target_prefixes: s.target_prefixes })),
    groups: evidence.presentation.groups, snapshot: [], facts: evidence.facts.map(f => ({ id: f.id, label: f.label, role: f.role, values: f.data_refs.map(ref => ({ ref, value: wire.pointer(req.customer_data, ref) })) })),
    judgments: evidence.judgments, knowledge_cards: evidence.knowledge_cards, bindings: evidence.bindings.map(b => Object.assign({ text: wire.pointer(briefing, b.target) }, b)), workflow: evidence.workflow };
}
const ctx = { window: { __PENSION_DISPLAY_DATE: DATA_AS_OF }, document: {}, console, setTimeout, clearTimeout, setInterval, clearInterval, URL, AbortController, TextDecoder };
vm.runInNewContext(js.replace('  // Starroot adapter', '  window.TestComponent = Component;\n  // Starroot adapter'), ctx);
assert.equal(typeof ctx.window['PG_' + code].onParam, 'function');
assert.equal(typeof ctx.window.PensionFabrix.configure, 'function');
assert.equal(typeof ctx.window.PensionChat.send, 'function');
assert.equal(ctx.window.PensionBriefingFixtures.briefings, undefined, 'Briefing text must not ship in the frontend bundle');
const app = new ctx.window.TestComponent({});
app.setState = patch => Object.assign(app.state, typeof patch === 'function' ? patch(app.state) : patch);
const bridge = ctx.window.PensionBriefingAdapter;
for (const [i, c] of customers.entries()) {
  const id = c.briefingMeta.caseId, b = briefings[i];
  if (b) assert.deepEqual(contract.validateContent(contract.contentOf(b), c), [], id);
  assert.equal(c.holdings.reduce((sum, x) => sum + x.valuationAmountKrw, 0), c.irpAccount.valuationAmountKrw, id);
  assert.equal(c.irpAccount.assetAllocation.reduce((sum, x) => sum + x.amountKrw, 0), c.irpAccount.valuationAmountKrw, id);
  if (c.irpAccount.valuationAmountKrw) for (const rows of [c.holdings, c.irpAccount.assetAllocation]) assert.ok(Math.abs(rows.reduce((sum, x) => sum + x.weightPct, 0) - 100) < 0.001, id);
  app.select(id, true);
  assert.equal(app.renderVals().hasAiBrief, false, id + ': no briefing before the Agent answer');
  assert.equal(app.renderVals().briefingAvailable, !!b, id + ': briefingAvailable follows the stored briefing');
  if (!b) { assert.equal(app.renderVals().selName, c.customer.name, id); continue; }
  assert.equal(bridge.receive(bridge.begin(id), contract.contentOf(b)).ok, true, id);
  const v = app.renderVals(), normalized = contract.normalizeContent(contract.contentOf(b));
  assert.equal(v.selName, c.customer.name, id);
  assert.equal(v.pfAmt, contract.money(c.irpAccount.valuationAmountKrw), id);
  assert.equal(v.pfPin, ctx.window.PensionCustomerView.displayId(c.customer.customerId), id + ': header shows the 5자리-5자리 screen id');
  assert.ok(/^\d{5}-\d{5}$/.test(v.pfPin), id + ': screen id is 5자리-5자리');
  assert.equal(v.bfS1Lines.length, b.s1.items.length, id);
  assert.equal(v.bfTiles.length, normalized.s3.options.length, id);
  assert.equal(v.bfReacts.length, normalized.s4.reactions.length, id);
  const req = wire.request(c, 'check-' + id, 'TEST_EMPLOYEE');
  assert.equal(wire.validate(wire.answer(req, contract.contentOf(b)), req).ok, true);
}
// Main list: legacy demo rows (minus the three replaced by C01-10/11/12) + every case customer.
// Each case row's badges are its signals, colored the same way as the briefing header.
const LEGACY_ROWS = 15, queued = customers.slice();
app.state.sel = null; app.state.filter = 'all'; app.state.extA = null;
const dash = app.renderVals();
assert.equal(dash.showDashboard, true);
assert.equal(dash.queue.length, LEGACY_ROWS + queued.length, 'Main list = legacy rows + case customers');
assert.equal(dash.queueTotal, LEGACY_ROWS + queued.length);
assert.equal(dash.kNewN + dash.kOnN + dash.doneCount, dash.queueTotal, 'Every row is 신규 선정, 지속 관리 or 처리완료');
assert.deepEqual([dash.dashDateLabel, dash.dashAsOfLabel], ['9월 29일 화요일', '09.29'], 'Dashboard date follows the case 기준일 (display date pinned to it in this check)');
assert.ok(customers.every(c => c.briefingMeta.asOfDate === '2026-09-29'), 'Every customer shares the 2026-09-29 기준일');
for (const hidden of ['ksy', 'lsm', 'pjh']) assert.ok(!Array.from(dash.queue).some(r => r.id === hidden), hidden + ' legacy row replaced');
assert.deepEqual([dash.hasCaseLibrary, dash.caseChoices, dash.caseLibraryLabel], [undefined, undefined, undefined], 'Test-only 고객별 브리핑 pickers removed');
assert.equal(dash.isaCount, dash.queue.filter(r => r.tags.some(t => /^ISA 만기 D-\d+$/.test(t.t))).length);
const CATALOG = /^(정기예금 만기|GIC 만기|ISA 만기|ISA 전환기한|DO 실행|퇴직금 재입금기한|연금개시) D-\d+$|^추가납입 \d+만원$|^(퇴직금 운용 미지시|퇴직금 일부만 운용|현금성 장기대기|현금성 과다|만기자금 미운용|납입금 미운용|입금매수상품 미지정|원리금보장 편중|수익률 부진|환매추천 펀드 보유|판매중단 펀드 보유|저금리 예금 보유|DO 미등록|투자성향-DO불일치|타행 IRP 보유|타행 연금저축 보유|연금저축 보유|복수 IRP 보유|연금자산 분산보유|이탈징후|계약이전 신청|연금개시 가능|연금개시 예정|연금수령 중|올해 미납입|납입 중단|퇴직연금 관리화면 방문|ETF 상품조회|펀드 상품조회|보유상품 수익률 조회|장기 미운용)$/;
for (const row of dash.queue) for (const t of row.tags) assert.ok(CATALOG.test(t.t), row.name + ': badge outside the Dynamic Segment catalog: ' + t.t);
for (const c of customers) {
  const id = c.briefingMeta.caseId, labels = c.signals.map(s => s.label);
  assert.ok(labels.every(l => CATALOG.test(l)), id + ': signals outside the catalog');
  assert.ok(labels.length <= 3, id + ': at most three badges');
  app.select(id, true);
  const header = app.renderVals().bfBadges;
  // Arrays from the vm realm carry another Array prototype; compare main-realm copies.
  assert.deepEqual(Array.from(header, b => b.t), labels, id + ': briefing header badges = signals');
  const row = dash.queue.find(r => r.id === id);
  assert.deepEqual(Array.from(row.tags, t => [t.t, t.bg, t.fg]), Array.from(header, b => [b.t, b.bg, b.fg]), id + ': main list badges and colors = briefing header');
  assert.equal(row.bal, contract.money(c.irpAccount.valuationAmountKrw), id);
  assert.equal(row.taxOn, c.irpAccount.taxDeductionRemainingKrw != null, id + ': tax ring only with a known 잔여한도');
}
app.state.filter = 'isa';
assert.deepEqual(Array.from(app.renderVals().queue, r => r.name).sort(), Array.from(dash.queue).filter(r => r.tags.some(t => /^ISA 만기 D-\d+$/.test(t.t))).map(r => r.name).sort(), 'ISA 만기 filter');
app.state.filter = 'all';
const order = Array.from(dash.queue).filter(r => !r.done).map(r => Array.from(r.tags, t => t.t));
const dday = tags => { const m = tags.map(t => t.match(/ D-(\d+)$/)).filter(Boolean).map(m => +m[1]); return m.length ? Math.min(...m) : null; };
const ddays = order.map(dday).filter(d => d != null);
assert.deepEqual(ddays, ddays.slice().sort((a, b) => a - b), 'D-day rows come first in ascending order');
assert.ok(order.findIndex(t => dday(t) == null) > ddays.length - 1, 'No non-D-day row before the D-day rows');
const kim = customers[briefings.findIndex(Boolean)], content = contract.contentOf(briefings[briefings.findIndex(Boolean)]), store = create(customers);
const first = store.begin(FIRST), second = store.begin(FIRST);
assert.equal(store.receive(first, content).stale, true);
assert.equal(store.receive(second, content).ok, true);
assert.equal(store.receive(second, content).stale, true);
const snapshot = store.customer(FIRST);
assert.equal(store.receive(store.begin(FIRST), { ...content, customer: {} }).ok, false);
assert.deepEqual(store.customer(FIRST), snapshot);
const cancelled = store.begin(FIRST); store.cancel(FIRST);
assert.equal(store.receive(cancelled, content).stale, true);
const minimal = { s1: { items: [{ text: '고객 사실', dataRefs: ['/customer/name'] }] }, s2: { lead: '상담 목적' }, s3: { lead: '제안 방향' }, s4: null, s5: null };
assert.deepEqual(contract.validateContent(minimal, kim), []);
app.select(FIRST, true);
const before = app.renderVals().pfAmt;
assert.equal(bridge.receive(bridge.begin(FIRST), minimal).ok, true);
assert.equal(app.renderVals().pfAmt, before);
assert.equal(app.renderVals().hasS4, false); assert.equal(app.renderVals().hasS5, false);
const req = wire.request(kim, 'check-request', 'TEST_EMPLOYEE'), answer = wire.answer(req, content);
for (const key of ['request_id', 'case_id', 'customer_id', 'as_of_date']) {
  const bad = copy(answer); bad.data[key] = key === 'as_of_date' ? '2020-01-01' : 'wrong';
  assert.equal(wire.validate(bad, req).code, 'IDENTITY');
}
const events = [], parser = transport.parser(event => events.push(event));
for (const ch of 'data: ' + JSON.stringify({ event_status: 'CHUNK', content: JSON.stringify(answer), status: 'SUCCESS' }) + '\r\n\r\n') parser.push(ch);
parser.finish(); assert.deepEqual(JSON.parse(events[0].content), answer);
{
  const req7 = wire.request(evidenceCustomer, 'check-evidence', 'TEST_EMPLOYEE'), trace = traceFor(req7, evidenceBriefing);
  const withTrace = wire.validate(wire.answer(req7, evidenceBriefing, trace), req7);
  assert.deepEqual([withTrace.ok, !!withTrace.trace, withTrace.trace && withTrace.trace.steps.length, withTrace.trace && withTrace.trace.bindings.length], [true, true, 4, 49], 'Valid trace returned with the briefing');
  { const t = copy(trace); t.knowledge_cards[0].source_id = 'no-such-source'; assert.deepEqual([wire.validate(wire.answer(req7, evidenceBriefing, t), req7).trace, wire.traceErrors(t, wire.answer(req7, evidenceBriefing, t).data, req7).some(e => /card source/.test(e))], [null, true], 'A card whose source_id is not in briefing.sources drops the trace'); }
  { const t = copy(trace); t.knowledge_cards.forEach(c => { delete c.source_id; }); assert.ok(wire.validate(wire.answer(req7, evidenceBriefing, t), req7).trace, 'source_id stays optional'); }
  assert.equal(wire.validate(wire.answer(req7, evidenceBriefing), req7).trace, null, 'No trace → briefing only');
  for (const [label, mutate] of [['binding text', t => { t.bindings[0].text = 'changed'; }], ['fact value', t => { t.facts[0].values[0].value = 1; }], ['step order', t => { t.steps.reverse(); }], ['unknown card', t => { t.bindings[3].evidence_ids = ['K-NONE']; }], ['llm call claimed', t => { t.llm_calls = 1; }], ['other case', t => { t.case_id = 'B01-03'; }]]) {
    const t = copy(trace); mutate(t); const r = wire.validate(wire.answer(req7, evidenceBriefing, t), req7);
    assert.ok(r.ok && r.trace === null, 'Invalid trace is dropped while the briefing stays valid: ' + label);
  }
  const extra = wire.answer(req7, evidenceBriefing, trace); extra.data.analysis_trace.steps[0].raw_prompt = '...';
  assert.deepEqual([wire.validate(extra, req7).ok, wire.validate(extra, req7).trace, wire.validate(extra, req7).traceCode], [true, null, 'TRACE'], 'Unknown trace fields drop the trace, not the briefing');
  const junk = wire.answer(req7, evidenceBriefing, trace); junk.data.analysis_trace = 'not-an-object';
  assert.deepEqual([wire.validate(junk, req7).ok, wire.validate(junk, req7).trace], [true, null], 'A non-object trace is ignored');
  const s = require('../../frontend/src/briefing/pensionBriefingStore').create([evidenceCustomer]);
  const ticket = s.begin(EVIDENCE_CASE); assert.equal(s.receive(ticket, evidenceBriefing, trace).ok, true);
  assert.deepEqual([s.read(EVIDENCE_CASE).trace.steps.length, !!s.trace(EVIDENCE_CASE)], [4, true], 'Briefing and trace stored from the same ticket');
  const t2 = s.begin(EVIDENCE_CASE); s.fail(t2, ['x']); assert.ok(s.trace(EVIDENCE_CASE), 'A failed re-request keeps the previous briefing and trace together');
  const t3 = s.begin(EVIDENCE_CASE); s.receive(t3, evidenceBriefing, null); assert.equal(s.trace(EVIDENCE_CASE), null, 'A trace-less successful response replaces both atomically');
  s.clear(EVIDENCE_CASE); assert.equal(s.read(EVIDENCE_CASE).trace, null);
}
{ // briefing_ui_revision (C01-07): 계약 규칙과 표시 정책. 다른 고객은 기존 표시 그대로다.
  const View = require('../../frontend/src/briefing/pensionBriefingView');
  const fakeComponent = state => ({ state: Object.assign({ bfSol: null, bfReact: null, briefingSourcesOpen: false }, state), bold: t => t, setState() {}, openScn() {} });
  const withMetric = (kind, asOf) => { const c = copy(evidenceBriefing); c.s3.options[0].products[0].metrics = [{ kind, valuePct: 1.5, period: '1년', asOf }]; return contract.validateContent(c, evidenceCustomer); };
  assert.deepEqual(withMetric('return', null), [], 'return metric may carry asOf null (기준일 미표기)');
  assert.ok(withMetric('rate', null).some(e => /basis/.test(e)), 'rate metric without a basis is rejected');
  assert.ok(withMetric('rate', '   ').some(e => /basis/.test(e)), 'blank basis is rejected');
  assert.deepEqual(withMetric('rate', '2026-09'), [], 'rate metric with a basis passes');
  { const c = copy(evidenceBriefing); c.s5.tips[1].kind = 'hot_tip'; assert.ok(contract.validateContent(c, evidenceCustomer).some(e => /hot_tip/.test(e)), 'At most one hot_tip'); }
  { const c = copy(evidenceBriefing); c.s5.tips[0].publishedAt = '2025.02.27'; assert.ok(contract.validateContent(c, evidenceCustomer).length > 0, 'publishedAt must be YYYY-MM-DD'); }
  { const c = copy(evidenceBriefing); c.s5.tips[0].kind = 'banner'; assert.ok(contract.validateContent(c, evidenceCustomer).length > 0, 'Unknown tip kind rejected'); }
  { const c = copy(evidenceBriefing); delete c.s5.tips[0].kind; delete c.s5.tips[0].publishedAt; assert.deepEqual(contract.validateContent(c, evidenceCustomer), [], 'kind/publishedAt stay optional'); }
  const trace = traceFor(wire.request(evidenceCustomer, 'ui-revision', 'TEST_EMPLOYEE'), evidenceBriefing);
  const opened = new Set(trace.knowledge_cards.map(c => c.source_id)), openedIds = [];
  const policy = { productLayout: 'metadata_only', hideReviewNotes: true, footerTitle: '근거 자료', sourceRows: true, canOpenSource: id => opened.has(id), openSource: id => openedIds.push(id) };
  const nb = contract.normalizeContent(evidenceBriefing), sol = nb.s3.options[0].id, vals = View.build(nb, fakeComponent({ bfSol: sol }), policy);
  // One product per option: build the expanded card of each option.
  const prods = nb.s3.options.map(o => View.build(nb, fakeComponent({ bfSol: o.id }), policy).bfOpenProds).flat();
  assert.equal(prods.length, 3, 'Three recommended products across the three options');
  assert.ok(prods.every(p => p.hasMeta && p.n && p.hasCategory && !p.hasDesc && p.notes.length === 0 && p.evidence.length === 0 && !p.showMetricLines), 'Metadata only: name, type, period table, basis; no reason/notes/evidence badges');
  assert.deepEqual(prods.map(p => p.hasBadge), nb.s3.options.map(o => !!o.products[0].riskLevel), 'Risk badge only where the product has a riskLevel (fund)');
  assert.ok(prods.every(p => p.metaRow.every(r => /^-?\d+\.\d{2}%$/.test(r.t))), 'Two decimals, no leading +');
  const fund = prods.filter(p => p.metaLabel === '누적수익률'), deposits = prods.filter(p => p.metaLabel === '표시금리');
  assert.deepEqual([fund.length, deposits.length], [1, 2], 'One fund (누적수익률) and two guaranteed products (표시금리)');
  assert.ok(fund.every(p => p.basis === '기준일 미표기'), 'Fund returns show 기준일 미표기, never a made-up date');
  assert.deepEqual(deposits.map(p => p.basis), ['2026.09 자료 기준 · 적용기간 2026.09.01~2026.09.30', '2026.09 자료 기준'], 'Rate basis once per card: 자료 기준 (+ 적용기간 only when the data has one)');
  assert.deepEqual([vals.bfHotTips.length, vals.bfStructuredTips.length, vals.bfFollowUps.length, vals.bfExecItems.length], [1, 0, 1, 4], 'One Hot Tip card, no legacy tip, one follow-up note, 4 actions kept');
  assert.deepEqual([vals.bfHotTips[0].title, vals.bfHotTips[0].date, vals.bfHotTips[0].hasUrl, /^https:\/\/lxp\.kbstar\.com\/app\/board\/hottip-my\/view\/199404\./.test(vals.bfHotTips[0].url)], ['IRP 연금 지급 절차', '2025.02.27', true, true], 'Hot Tip title, 게시일, LXP link');
  assert.equal(vals.bfFollowUps[0].title, '상담 후 확인', 'Follow-up sits below the actions as a note');
  assert.deepEqual([vals.briefingSourcesLabel, vals.briefingSourcesOpen, vals.briefingSourceRowsOn, vals.briefingSourceRows.length, vals.showReviewNotes, vals.briefingReviewNotes.length], ['근거 자료', false, true, 9, false, 0], 'Footer: 근거 자료, collapsed, 9 title rows, review notes hidden');
  assert.deepEqual(vals.briefingSourceRows.map(r => r.title), evidenceBriefing.sources.map(s => s.title), 'Rows are the source titles in order');
  assert.ok(vals.briefingSourceRows.every(r => r.canOpen), 'Every source is linked to at least one knowledge card');
  vals.briefingSourceRows[0].onOpen(); assert.deepEqual(openedIds, [evidenceBriefing.sources[0].id], 'Row click opens the evidence panel at that source');
  const noTrace = View.build(nb, fakeComponent({ bfSol: sol }), Object.assign({}, policy, { canOpenSource: () => false }));
  assert.ok(noTrace.briefingSourceRows.every(r => r.plain && !r.canOpen), 'Without a trace the rows are plain titles');
  // Other customers: policy-less legacy layout.
  const other = customers.find(c => c.briefingMeta.caseId !== EVIDENCE_CASE && briefings[customers.indexOf(c)] && contract.normalizeContent(contract.contentOf(briefings[customers.indexOf(c)])).s3.options.some(o => o.products.length));
  const ob = contract.contentOf(briefings[customers.indexOf(other)]), onb = contract.normalizeContent(ob), legacy = View.build(onb, fakeComponent({ bfSol: onb.s3.options[0].id }), null);
  legacy.bfOpenProds = onb.s3.options.map(o => View.build(onb, fakeComponent({ bfSol: o.id }), null).bfOpenProds).flat();
  assert.ok(legacy.bfOpenProds.some(p => p.hasDesc || p.notes.length || p.evidence.length), other.briefingMeta.caseId + ': legacy product card keeps reason/notes/evidence');
  assert.deepEqual([legacy.briefingSourceRowsOn, legacy.briefingSourceRowsOff, legacy.briefingSourcesLabel, legacy.bfHotTips.length, legacy.bfFollowUps.length], [false, true, '근거 자료 · 검토사항', 0, 0], other.briefingMeta.caseId + ': legacy footer and tips');
  // Adapter applies the policy only for C01-07 and only links sources present in the received trace.
  app.select(EVIDENCE_CASE, true); assert.equal(bridge.receive(bridge.begin(EVIDENCE_CASE), evidenceBriefing, trace).ok, true);
  const rendered = app.renderVals();
  assert.deepEqual([rendered.hasAnalysisTrace, rendered.briefingSourcesLabel, rendered.briefingSourceRows.length, Array.from(rendered.briefingSourceRows).every(r => r.canOpen), rendered.bfHotTips.length], [true, '근거 자료', 9, true, 1], 'C01-07 adapter view: policy on, sources linked to the trace');
  app.select(other.briefingMeta.caseId, true); assert.equal(bridge.receive(bridge.begin(other.briefingMeta.caseId), ob).ok, true);
  assert.deepEqual([app.renderVals().briefingSourceRowsOn, app.renderVals().briefingSourcesLabel], [false, '근거 자료 · 검토사항'], 'Other customer through the adapter: legacy layout');
  app.select(FIRST, true);
  console.log('PASS: C01-07 UI revision — metric asOf null (return only), tip kind/publishedAt, metadata-only product cards (2 funds 기준일 미표기 / 1 deposit 자료 기준·적용기간), one Hot Tip (2025.02.27, LXP link) + follow-up note + 4 actions, 근거 자료 footer (9 titles, collapsed, → 분석 근거 panel), review notes hidden; other customers unchanged.');
}
// Conversational agent: event extraction, config, and the captured real answers (integration/contracts/chat.example.json).
const chatSample = JSON.parse(fs.readFileSync(path.join(ROOT, 'integration/contracts/chat.example.json'), 'utf8'));
const typesOf = text => chatTransport.events(text).map(e => e.type);
assert.deepEqual(typesOf(JSON.stringify({ type: 'answer', text: 'a' }) + JSON.stringify({ type: 'sources', items: [] })), ['answer', 'sources'], 'Concatenated events in one content');
assert.deepEqual(typesOf(JSON.stringify({ event: 'CHUNK', content: JSON.stringify({ type: 'followups', items: ['x'] }) })), ['followups'], 'Agent CHUNK wrapper');
assert.deepEqual(typesOf('[Errno Extra data] ' + JSON.stringify({ event: 'CHUNK', content: JSON.stringify({ type: 'done' }) })), ['done'], 'Gateway error text embedding the CHUNK');
assert.deepEqual(typesOf('plain text {not json} {"content": {"type": "answer"}} {"x": "{\\"type\\":\\"nested\\"}"}'), [], 'Untyped or unparsable objects are ignored');
const chatCfg = { endpointUrl: 'https://chat.example/prod/kb0/connector/1', agentId: 'asset-test-01', openapiToken: 'chat-token', generativeAiClient: 'chat-client', xClientUser: '3902172-test' };
assert.equal(chatTransport.config(chatCfg).agentId, 'asset-test-01', 'assetId string accepted');
assert.equal(chatTransport.config({ ...chatCfg, agentId: 12 }).agentId, 12);
for (const agentId of ['', 0, -1, 'a\nb', null]) assert.throws(() => chatTransport.config({ ...chatCfg, agentId }), agentId + ' rejected');
// Values built inside the vm context carry that realm's prototypes; compare plain copies.
const plain = value => JSON.parse(JSON.stringify(value));
const parseAnswer = text => plain(ctx.window.PensionChat.parseAnswer(text)), composeTurn = turn => plain(ctx.window.PensionChat.compose(turn.events));
const [turnFact, turnCustomer, turnPitch] = chatSample.turns;
const answerText = turn => turn.events.find(e => e.type === 'answer').text;
const factAnswer = parseAnswer(answerText(turnFact));
assert.deepEqual([factAnswer.badges, factAnswer.blocks.map(b => b.t), factAnswer.lead], [['본부 공식 자료'], ['p'], answerText(turnFact).split('\n\n')[0]], 'Trailer becomes badges and is removed from the body');
const customerAnswer = parseAnswer(answerText(turnCustomer));
assert.deepEqual([customerAnswer.badges, customerAnswer.blocks.map(b => b.t), customerAnswer.blocks[1].items.length, customerAnswer.blocks[1].items[4]], [[], ['p', 'list'], 9, '· 에셋플러스 글로벌 리치투게더 (주식) — 4,800만원 (수익률 20.0%)'], 'Bullet lines become a list, nested items marked');
const pitchAnswer = parseAnswer(answerText(turnPitch));
assert.deepEqual([pitchAnswer.badges, pitchAnswer.blocks.map(b => b.t), pitchAnswer.blocks[0].x], [['본부 공식 자료'], ['quote', 'quote'], answerText(turnPitch).split('\n\n')[1].replace(/^"|"$/g, '')], 'Quoted paragraphs become copyable scripts');
const composed = composeTurn(turnCustomer);
assert.deepEqual([composed.evidence.length, composed.evidence.map(e => e.points.length), composed.evidence[1].doc, composed.evidence[1].meta, composed.guard, composed.follow.length, composed.action, composed.clarify],
  [5, [1, 2, 1, 1, 2], '연금사업부(상품) 오늘의할일 스크립트', '연금사업부(상품), 2023~24 추정', [], 3, null, null], 'Sources grouped by document with org/date split out');
assert.equal(composeTurn(turnFact).evidence[0].points[0], turnFact.events.find(e => e.type === 'sources').items[0].title + ' · 관련도 2');
const withAction = composeTurn({ events: turnFact.events.concat([{ type: 'action', kind: 'memo', label: '쪽지로 보내드릴까요?', prompt: '네/아니오', title: '안내', text: '본문', to: '3902173' }, { type: 'clarify', question: '어느 상품?', options: ['A', { label: 'B' }] }, { type: 'sources', items: [{ id: 'g1', title: '원금보장 오인 금지', doc: '상담 원칙 (2026)', role: '주의' }] }]) });
assert.deepEqual([withAction.blocks[withAction.blocks.length - 1], withAction.guard, withAction.clarify.options.length, withAction.evidence.length],
  [{ t: 'msg', x: '받는 사람: 3902173\n제목: 안내\n\n본문' }, [{ doc: '상담 원칙', meta: '2026', point: '원금보장 오인 금지' }], 2, 1], 'Action memo, clarify and 주의 sources');
// Agent shapes from the colleague repo (nodes/act.py, nodes/clarify.py, effects/screens.py): offer trailer, memo fence,
// clarify bullets and deep links are handled in compose()/segments(), not left in the body.
const offerTurn = composeTurn({ events: [{ type: 'answer', text: 'MyStar 단말 [04-12-642] 적립금 및 수익률 조회 화면에서 확인하세요.\n\n— «만기예금 보유» 고객에게 쓰는 화법 2건, 보여드릴까요? (네 / 아니오)', intent: 'situation', links: [{ screen: '04-12-642', url: 'mystar-link://scnNo=0412642&mode=D', label: '적립금및수익률조회' }] }, { type: 'action', kind: 'pitch', label: '«만기예금 보유» 고객에게 쓰는 화법 2건', prompt: '«만기예금 보유» 고객에게 쓰는 화법 2건, 보여드릴까요? (네 / 아니오)' }, { type: 'sources', items: [] }, { type: 'followups', items: [] }, { type: 'done' }] });
assert.deepEqual([offerTurn.lead, offerTurn.blocks, offerTurn.links, offerTurn.intent], ['MyStar 단말 [04-12-642] 적립금 및 수익률 조회 화면에서 확인하세요.', [], [{ screen: '04-12-642', url: 'mystar-link://scnNo=0412642&mode=D', label: '적립금및수익률조회' }], 'situation'], 'Offer trailer removed only with an action; links kept');
assert.deepEqual(plain(ctx.window.PensionChat.segments(offerTurn.lead, offerTurn.links)).map(x => [x.t, x.isLink, x.url]), [['MyStar 단말 [', false, ''], ['04-12-642', true, 'mystar-link://scnNo=0412642&mode=D'], ['] 적립금 및 수익률 조회 화면에서 확인하세요.', false, '']], 'Screen number wrapped inside the brackets with the agent url');
assert.deepEqual(composeTurn({ events: [{ type: 'answer', text: '본문.\n\n— 쪽지를 보낼 받는 사람을 알 수 없어요 — 로그인 사번이 넘어오지 않았습니다.', intent: 'situation', links: [] }, { type: 'sources', items: [] }, { type: 'done' }] }).blocks.map(b => b.x), ['— 쪽지를 보낼 받는 사람을 알 수 없어요 — 로그인 사번이 넘어오지 않았습니다.'], 'A notice line without an action stays in the body');
const offerThenMarks = composeTurn({ events: [{ type: 'answer', text: '본문.\n\n— 화법 2건, 보여드릴까요? (네 / 아니오)\n\n── 참고한 자료\n· 본부 공식 자료', intent: 'situation', links: [] }, { type: 'action', kind: 'pitch', label: '화법 2건', prompt: '화법 2건, 보여드릴까요? (네 / 아니오)' }, { type: 'sources', items: [] }, { type: 'done' }] });
assert.deepEqual([offerThenMarks.lead, offerThenMarks.blocks, offerThenMarks.badges], ['본문.', [], ['본부 공식 자료']], 'Offer line removed even when the 참고한 자료 block follows it');
const memoTurn = composeTurn({ events: [{ type: 'answer', text: '```\n[제목] 과세이연 등록 상담 정리\n\n고객님과 나눈 내용입니다.\n```\n\n— 이대로 쪽지를 보낼까요? 받는 사람은 본인이에요. (네 / 아니오)', intent: 'situation', links: [] }, { type: 'action', kind: 'memo', label: '이 쪽지 보내기(받는 사람: 본인)', prompt: '이대로 쪽지를 보낼까요? 받는 사람은 본인이에요. (네 / 아니오)', title: '과세이연 등록 상담 정리', text: '고객님과 나눈 내용입니다.', to: '본인' }, { type: 'sources', items: [] }, { type: 'done' }] });
assert.deepEqual([memoTurn.lead, memoTurn.blocks], ['', [{ t: 'msg', x: '받는 사람: 본인\n제목: 과세이연 등록 상담 정리\n\n고객님과 나눈 내용입니다.' }]], 'Memo draft shown once from the action fields; fence and offer line dropped');
const clarifyTurn = composeTurn({ events: [{ type: 'answer', text: '어느 계좌 기준으로 안내할까요?\n\n· 개인형IRP\n· 연금저축', intent: 'situation', links: [] }, { type: 'clarify', question: '어느 계좌 기준으로 안내할까요?', options: ['개인형IRP', '연금저축'] }, { type: 'sources', items: [] }, { type: 'followups', items: [] }, { type: 'done' }] });
assert.deepEqual([clarifyTurn.lead, clarifyTurn.blocks, clarifyTurn.clarify.options], ['어느 계좌 기준으로 안내할까요?', [], ['개인형IRP', '연금저축']], 'Clarify options rendered as buttons only, not as body bullets');
assert.deepEqual(JSON.parse(fs.readFileSync(path.join(ROOT, 'integration/contracts/response.example.json'), 'utf8')), wire.answer(wire.request(kim, 'example-request-001', 'TEST_EMPLOYEE'), content));
assert.deepEqual(JSON.parse(fs.readFileSync(path.join(ROOT, 'agent/briefing_data.json'), 'utf8')), agentData({ customers, briefings }), 'Rebuild Agent data together with the frontend');
console.log('PASS: 42 customers (42 with briefings), totals, render mappings, optional fields, customer isolation, request identity, SSE parser, current three-file build, main list = legacy rows + 42 cases with catalog badges.');

// Bundle-level run of the real path: injected config -> auto request on select ->
// fake fetch answering one SSE frame -> answer rendered. No network, no secrets.
async function autoRequestCheck() {
  const calls = [], settle = () => new Promise(resolve => setImmediate(resolve));
  ctx.fetch = async (url, init) => {
    calls.push({ url, init });
    const inner = JSON.parse(JSON.parse(init.body).contents[0]);
    const briefing = briefings[customers.findIndex(c => c.briefingMeta.caseId === inner.case_id)];
    const content = contract.contentOf(briefing), traced = inner.case_id === EVIDENCE_CASE && !ctx.__noTrace ? traceFor(inner, content) : null;
    const bytes = new TextEncoder().encode('data: ' + JSON.stringify({ event_status: 'CHUNK', status: 'SUCCESS', content: JSON.stringify(wire.answer(inner, content, traced)) }) + '\n\n');
    let sent = false;
    return { ok: true, status: 200, headers: { get: () => 'text/event-stream' }, body: { getReader: () => ({
      read: async () => (sent ? { done: true } : { done: !(sent = true), value: bytes }), cancel: async () => {}, releaseLock() {} }) } };
  };
  const cfg = { endpointUrl: 'https://fabrix.example/prod/kb0/connector/1', openapiToken: 'test-token', generativeAiClient: 'test-client', agentId: 7, xClientUser: 'TEST_EMPLOYEE' };
  const mount = props => {
    const c = new ctx.window.TestComponent(props);
    c.setState = patch => Object.assign(c.state, typeof patch === 'function' ? patch(c.state) : patch);
    c.componentDidMount(); return c;
  };
  const live = mount({ starrootParams: { fabrix: cfg } });
  live.select(FIRST, true);
  assert.equal(live.renderVals().fabrixBusy, true, 'Selecting a case requests it immediately');
  await settle();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, cfg.endpointUrl + '/openapi/agent-chat/v1/agent-messages');
  assert.equal(calls[0].init.headers['x-openapi-token'], 'Bearer test-token');
  const sent = JSON.parse(calls[0].init.body), inner = JSON.parse(sent.contents[0]);
  assert.deepEqual([sent.agentId, sent.isStream, inner.case_id, inner.x_client_user], [7, true, FIRST, 'TEST_EMPLOYEE']);
  assert.deepEqual(inner.customer_data, kim);
  const v = live.renderVals();
  assert.deepEqual([v.fabrixDiagnosticCode, v.hasAiBrief, v.bfS1Lines.length], ['SUCCESS', true, content.s1.items.length]);
  v.goBack(); live.select(FIRST, true);
  assert.equal(calls.length, 1, 'A loaded case is not requested again in the same mount');
  live.select('B01-22', true);
  assert.equal(calls.length, 2, 'Another case is requested');
  await settle();
  assert.deepEqual([live.renderVals().hasAiBrief, live.renderVals().hasAnalysisTrace, typeof live.renderVals().openEvidence, live.renderVals().evidenceExpanded], [true, false, 'function', 'false'], 'Other customers: briefing without the evidence button');
  live.select(EVIDENCE_CASE, true); await settle();
  assert.deepEqual([calls.length, live.renderVals().hasAiBrief, live.renderVals().hasAnalysisTrace], [3, true, true], '오세훈: briefing and evidence arrive in one answer; the evidence button appears');
  assert.equal(ctx.window.PensionBriefingAdapter.analysisTrace(EVIDENCE_CASE).facts.find(f => f.id === 'F-DEPOSIT').values[3].value, 70400000, 'Trace facts are read from the request snapshot');
  v.goBack(); live.select(EVIDENCE_CASE, true); await settle(); assert.equal(calls.length, 3, 'Re-opening the customer uses the cached briefing and trace');
  live.componentWillUnmount(); await settle();
  ctx.__noTrace = true; const plainMount = mount({ starrootParams: { fabrix: cfg } }); plainMount.select(EVIDENCE_CASE, true); await settle(); delete ctx.__noTrace;
  assert.deepEqual([calls.length, plainMount.renderVals().hasAiBrief, plainMount.renderVals().hasAnalysisTrace], [4, true, false], 'A trace-less answer for the same customer shows the briefing only');
  plainMount.componentWillUnmount(); await settle();
  assert.equal(live.renderVals().fabrixDiagnosticCode, 'NOCONFIG', 'Destroy clears the injected config');
  ctx.window.__PENSION_FABRIX_CONFIG = cfg;
  const viaGlobal = mount({ starrootParams: {} });
  viaGlobal.select('B06-13', true);
  assert.equal(viaGlobal.renderVals().fabrixBusy, true, 'window.__PENSION_FABRIX_CONFIG fallback');
  viaGlobal.componentWillUnmount(); delete ctx.window.__PENSION_FABRIX_CONFIG;
  const invalid = mount({ starrootParams: { fabrix: { ...cfg, endpointUrl: 'http://fabrix.example/prod' } } });
  invalid.select(FIRST, true);
  assert.deepEqual([invalid.renderVals().fabrixDiagnosticCode, invalid.renderVals().fabrixCanRequest], ['CONFIG', false]);
  invalid.componentWillUnmount();
  ctx.window.__PENSION_FABRIX_CONFIG = { endpointUrl: '', agentId: 0, xClientUser: '', openapiToken: '', generativeAiClient: '' };
  const empty = mount({ starrootParams: {} });
  empty.select(FIRST, true);
  assert.equal(empty.renderVals().fabrixDiagnosticCode, 'NOCONFIG', 'Shipped empty config block counts as not injected');
  empty.componentWillUnmount(); delete ctx.window.__PENSION_FABRIX_CONFIG;
  await settle();
  assert.equal(calls.length, 5, 'Invalid, empty or missing config never sends a request');
  delete ctx.fetch;
}
// Bundle-level run of the chat panel: injected chat config -> question -> fake fetch replaying the
// captured real turns as SSE (answer+sources concatenated in one frame) -> transcript rendered.
async function chatPanelCheck() {
  const calls = [], settle = () => new Promise(resolve => setImmediate(resolve));
  const frame = content => 'data: ' + JSON.stringify({ event_status: 'CHUNK', status: 'SUCCESS', content }) + '\n\n';
  ctx.fetch = async (url, init) => {
    assert.ok(url.startsWith('https://chat.example/'), 'Only the chat Connector is called: ' + url);
    const inner = JSON.parse(JSON.parse(init.body).contents[0]);
    calls.push({ url, headers: init.headers, agentId: JSON.parse(init.body).agentId, inner });
    const turn = chatSample.turns.find(t => t.message === inner.message);
    const scripted = {
      'IRP 계좌 해지는 몇 번 화면에서 하지?': [{ type: 'answer', text: '04-12-646 지급/해지조회 화면에서 처리해요.\n\n— «금리 변화기» 안내 문구로 75-08-110 발송 화면 열기, 연계해드릴까요? (네 / 아니오)', intent: 'guide', links: [{ screen: '04-12-646', url: 'mystar-link://scnNo=0412646&mode=D', label: '지급/해지조회' }] }, { type: 'action', kind: 'lms', label: '«금리 변화기» 안내 문구로 75-08-110 발송 화면 열기', prompt: '«금리 변화기» 안내 문구로 75-08-110 발송 화면 열기, 연계해드릴까요? (네 / 아니오)' }, { type: 'sources', items: [] }, { type: 'followups', items: [] }, { type: 'done' }],
      '01-12-213 화면 열어줘': [{ type: 'answer', text: '01-12-213 화면열기 - mystar-link://scnNo=0112213&mode=D', intent: 'situation' }, { type: 'sources', items: [] }, { type: 'followups', items: [] }, { type: 'done' }],
      '네': [{ type: 'answer', text: '«금리 변화기» 안내 문구로 75-08-110 발송 화면 열기\n화면이 열리면 이 문구를 넣어 주세요 — "고객님, 안내드립니다."', intent: 'confirm_action', links: [{ screen: '75-08-110', url: 'mystar-link://scnNo=7508110&mode=D', label: '개인고객용메시지발송(등록)' }] }, { type: 'sources', items: [] }, { type: 'followups', items: [] }, { type: 'done' }]
    };
    const events = turn ? turn.events : scripted[inner.message] || [{ type: 'error', text: '알 수 없는 질문' }, { type: 'done' }];
    const frames = [];
    for (let i = 0; i < events.length; i++) {
      if (events[i].type === 'answer' && events[i + 1] && events[i + 1].type === 'sources') { frames.push(frame(JSON.stringify(events[i]) + JSON.stringify(events[i + 1]))); i++; }
      else frames.push(frame(JSON.stringify(events[i])));
    }
    frames.push('data: [DONE]\n\n');
    const chunks = frames.map(f => new TextEncoder().encode(f));
    let n = 0;
    return { ok: true, status: 200, headers: { get: () => 'text/event-stream; charset=utf-8' }, body: { getReader: () => ({
      read: async () => (n < chunks.length ? { done: false, value: chunks[n++] } : { done: true }), cancel: async () => {}, releaseLock() {} }) } };
  };
  const mount = props => {
    const c = new ctx.window.TestComponent(props);
    c.setState = patch => Object.assign(c.state, typeof patch === 'function' ? patch(c.state) : patch);
    c.componentDidMount(); return c;
  };
  const kinds = msgs => [...msgs].map(m => m.isUser ? 'user' : m.isStatus ? 'status' : m.isSys ? 'sys' : 'ans');
  const blockKinds = blocks => [...blocks].map(b => b.isP ? 'p' : b.isList ? 'list' : b.isQuote ? 'quote' : b.isMsg ? 'msg' : '?');
  const type = (c, text) => { c.state.agInput = text; c.renderVals().agSendTap(); };
  const demoId = '198734-1205842';
  const briefingCfg = { endpointUrl: 'https://fabrix.example/prod/kb0/briefing/1', agentId: 7, xClientUser: '3902172-test', openapiToken: 'brief-token', generativeAiClient: 'brief-client' };
  ctx.window.__PENSION_FABRIX_CONFIG = { ...briefingCfg, chat: { endpointUrl: 'https://chat.example/prod/kb0/chat/1', agentId: 'asset-test-01', openapiToken: 'chat-token', generativeAiClient: 'chat-client' } };
  ctx.window.PensionFabrix.destroy(); // keep the briefing controller quiet: no briefing config for this component
  const live = mount({ starrootParams: { fabrix: { ...ctx.window.__PENSION_FABRIX_CONFIG, endpointUrl: '' } } });
  live.state.sel = FIRST;
  let v = live.renderVals();
  assert.deepEqual([v.agentOn, v.panelOpen, v.agChipsOn, v.agChips.length, kinds(v.agMsgs), v.agMsgs[0].text, v.agName, calls.length], [true, true, false, 0, ['sys'], kim.customer.name + ' 고객님 상담을 시작해요. 상담 중 궁금한 내용을 바로 물어보세요.', kim.customer.name + ' · ' + kim.customer.customerId, 0], 'Panel opens on the selected customer with the intro only: no id prompt, no chips, no call');
  type(live, turnFact.message);
  v = live.renderVals();
  assert.deepEqual([v.agBusy, kinds(v.agMsgs).slice(-2), live.state.agInput], [true, ['user', 'status'], ''], 'Question sent: busy, status bubble, input cleared');
  await settle();
  v = live.renderVals();
  assert.equal(calls.length, 1);
  assert.deepEqual([calls[0].agentId, calls[0].headers['x-openapi-token'], calls[0].inner.x_client_user, calls[0].inner.customer_id, typeof calls[0].inner.session_id], ['asset-test-01', 'Bearer chat-token', '3902172-test', kim.customer.customerId, 'string'], 'Chat request carries the chat credentials, assetId, employee and the selected customer id');
  let ans = v.agMsgs[v.agMsgs.length - 1];
  assert.deepEqual([v.agBusy, ans.isAns, ans.lead, blockKinds(ans.blocks), [...ans.srcBadges].map(b => b.t), ans.evidN, ans.evid[0].points.length, ans.hasFollow, ans.followChips, ans.follow.length, ans.ctaOn, ans.clarifyOn],
    [false, true, answerText(turnFact).split('\n\n')[0], ['p'], ['본부 공식 자료'], 1, 3, true, true, 1, false, false], 'Answer rendered from the real sample');
  // Turn trace (colleague client/README.md «trace»): asked for on every request, kept with its answer, summarized for the TRACE panel; `log` lines are not stored.
  assert.equal(calls[0].inner.log_events, true, 'Every chat request asks for log/trace events');
  assert.deepEqual([ans.traceOn, kinds(v.agMsgs)], [true, ['sys', 'user', 'ans']], 'Answer carrying a trace event gets a TRACE button; the log event adds nothing to the transcript');
  assert.doesNotThrow(() => ans.onTrace(), 'TRACE without a DOM host is a no-op');
  const turns = plain(ctx.window.PensionChat.turns(FIRST));
  assert.deepEqual([turns.length, turns[0].turn, turns[0].question, turns[0].agent.intent, turns[0].agent.timeline.length, turns[0].agent.rounds.length, turns[0].agent.sentences.length, typeof turns[0].front.requestedAt, turns[0].sessionId, turns[0].answer.lead],
    [1, 1, turnFact.message, 'situation', 12, 2, 4, 'string', calls[0].inner.session_id, ans.lead], 'Turn record = agent trace + what the page observed');
  const sum = plain(ctx.window.PensionBriefingEvidencePanel.summarizeTurn(turns[0].agent));
  assert.deepEqual([sum.intentLabel, sum.rounds, sum.outcomes, sum.llmCalls, sum.verdict, sum.warning, sum.stages, sum.durationMs], ['고객 현황', 2, { found: 2, miss: 0, failed: 0 }, 1, '재작성 후 검증 통과', '경고', ['understand', 'plan', 'tool', 'compose', 'verify'], 822], 'One-line turn summary for the demo panel');
  assert.deepEqual(plain(ctx.window.PensionBriefingEvidencePanel.summarizeTurn({ intent: 'clarify', timeline: [{ stage: 'turn', level: 'INFO' }, { stage: 'clarify', level: 'INFO' }], rounds: [], evidence: [], sentences: [] })).line, '되묻기 · 도구 호출 없음', 'Clarify turn: no tools, no verify, nothing invented');
  assert.equal(v.hasTraceButton, true, 'Card TRACE button appears once a turn carries a trace');
  ans.follow[0].onTap();
  await settle();
  assert.equal(calls.length, 2); assert.equal(calls[1].inner.message, '고객이 앱에서 직접 할 수 있어?'); assert.equal(calls[1].inner.session_id, calls[0].inner.session_id, 'Same session across turns');
  v = live.renderVals();
  assert.ok(v.agMsgs[v.agMsgs.length - 1].isSys && /답변에 실패/.test(v.agMsgs[v.agMsgs.length - 1].text), 'error event becomes a system note');
  type(live, turnCustomer.message); await settle();
  ans = live.renderVals().agMsgs.pop();
  assert.deepEqual([blockKinds(ans.blocks), ans.blocks[1].items.length, ans.evidN, ans.follow.length], [['p', 'list'], 9, 5, 3]);
  assert.deepEqual([ans.traceOn, ctx.window.PensionChat.turns(FIRST).length], [false, 1], 'A turn without a trace event has no TRACE button and adds no turn record');
  const demoTranscript = live.renderVals().agMsgs.length;
  live.select('B01-22', true);
  v = live.renderVals();
  const b0122 = customers.find(c => c.briefingMeta.caseId === 'B01-22').customer.customerId;
  assert.deepEqual([kinds(v.agMsgs), v.agChipsOn, v.agName], [['sys'], false, '한지훈 · ' + b0122], 'Another customer starts on its own id');
  assert.deepEqual([v.hasTraceButton, ctx.window.PensionChat.turns('B01-22').length], [false, 0], 'Turn records are per customer');
  live.select('C01-10', true);
  assert.equal(live.renderVals().agName, '김서연 · 17120-48150', 'C01 header shows the cut 5자리-5자리 id');
  assert.equal(ctx.window.PensionCustomerView.displayId('171203-4815062'), '17120-48150');
  live.select('B01-22', true);
  type(live, turnPitch.message); await settle();
  assert.equal(calls[3].inner.customer_id, b0122, 'Selected customer id is sent as customer_id');
  assert.notEqual(calls[3].inner.session_id, calls[0].inner.session_id, 'New customer, new session');
  ans = live.renderVals().agMsgs.pop();
  assert.deepEqual([blockKinds(ans.blocks), ans.blocks[0].copyLabel, ans.srcBadges.length], [['quote', 'quote'], '복사', 1]);
  live.select(FIRST, true);
  v = live.renderVals();
  assert.equal(v.agMsgs.length, demoTranscript, 'Transcript kept per customer within the page');
  ctx.window.PensionChat.resetCustomer(FIRST);
  v = live.renderVals();
  assert.deepEqual([v.agChipsOn, kinds(v.agMsgs).pop(), v.agName], [false, 'sys', kim.customer.name], 'resetCustomer asks for a new id; the header has no 고객 변경 button');
  type(live, 'bad id!');
  assert.ok(/형식/.test(live.renderVals().agMsgs.pop().text) && calls.length === 4, 'Malformed id after 고객 변경 is rejected without calling the agent');
  type(live, demoId); type(live, turnFact.message); await settle();
  assert.deepEqual([calls[4].inner.customer_id, calls[4].inner.session_id !== calls[0].inner.session_id], [demoId, true], 'Typed id replaces the customer and starts a new session');
  // Offer turn: prompt (not label) above the buttons, offer line gone from the body, screen number wrapped as a link, no copy button on 화법.
  ctx.window.location = { href: '' };
  type(live, 'IRP 계좌 해지는 몇 번 화면에서 하지?'); await settle();
  v = live.renderVals(); ans = v.agMsgs[v.agMsgs.length - 1];
  assert.deepEqual([ans.ctaOn, ans.ctaAsk, ans.blocks.length, plain(ans.leadSegs).map(x => [x.t, x.isLink]), ans.hasLinkRows, plain(ans.linkRows)[0].url, ctx.window.location.href],
    [true, '«금리 변화기» 안내 문구로 75-08-110 발송 화면 열기, 연계해드릴까요?', 0, [['04-12-646', true], [' 지급/해지조회 화면에서 처리해요.', false]], true, 'mystar-link://scnNo=0412646&mode=D', ''], 'Offer turn: prompt on the CTA, trailer stripped, inline deep link, no auto-open');
  assert.equal(plain(live.renderVals().agMsgs.filter(m => m.isAns).map(m => m.blocks.filter(b => b.isQuote).map(b => b.copyOn)).flat()).some(Boolean), false, 'Quoted 화법 carries no copy button');
  ans.onCtaYes(); await settle();
  v = live.renderVals(); ans = v.agMsgs[v.agMsgs.length - 2]; const opened = v.agMsgs[v.agMsgs.length - 1];
  assert.deepEqual([calls[calls.length - 1].inner.message, ans.isAns, plain(ans.leadSegs).map(x => x.isLink), ctx.window.location.href, opened.isOpen, opened.openLabel, opened.openUrl],
    ['네', true, [false, true, false], 'mystar-link://scnNo=7508110&mode=D', true, '개인고객용메시지발송(등록) (75-08-110)', 'mystar-link://scnNo=7508110&mode=D'], '네 on a screen proposal opens the agent deep link and leaves a button');
  ctx.window.location.href = ''; opened.onOpen(); assert.equal(ctx.window.location.href, 'mystar-link://scnNo=7508110&mode=D', 'Button re-opens the same link on a user click');
  ctx.window.location.href = ''; ctx.window.open = (url) => { ctx.window.opened = url; return {}; };
  opened.onOpen({ preventDefault() {} }); assert.deepEqual([ctx.window.opened, ctx.window.location.href], ['mystar-link://scnNo=7508110&mode=D', ''], 'Button click opens in a new window when available');
  // Older agent build: URL inside the answer text, no links, no intent — still recognised after a 네.
  type(live, '01-12-213 화면 열어줘'); await settle();
  v = live.renderVals(); const legacyOpen = v.agMsgs[v.agMsgs.length - 1], legacyAns = v.agMsgs[v.agMsgs.length - 2];
  assert.deepEqual([legacyAns.isAns, plain(legacyAns.leadSegs).map(x => [x.t, x.isLink]), plain(legacyAns.linkRows), legacyOpen.isOpen, ctx.window.location.href],
    [true, [['01-12-213', true], [' 화면열기 - ', false], ['mystar-link://scnNo=0112213&mode=D', true]], [{ screen: '01-12-213', url: 'mystar-link://scnNo=0112213&mode=D', label: '01-12-213 화면' }], true, 'mystar-link://scnNo=0112213&mode=D'], 'URL written in the answer text is parsed into a link and opened after a consent word');
  delete ctx.window.open; delete ctx.window.opened;
  delete ctx.window.location;
  live.componentWillUnmount();
  const bare = mount({ starrootParams: { fabrix: { ...briefingCfg, chat: { endpointUrl: '', agentId: '', openapiToken: '', generativeAiClient: '' } } } });
  bare.state.sel = FIRST; type(bare, '질문');
  const note = bare.renderVals().agMsgs.pop();
  assert.ok(note.isSys && /주입되지 않아/.test(note.text) && calls.length === 8, 'Empty chat block: question kept, no call, NOCONFIG note');
  bare.componentWillUnmount(); delete ctx.window.__PENSION_FABRIX_CONFIG; delete ctx.fetch;
}
// 부점 AI (current main-list search): golden regression of the deterministic evaluator and session on the
// 8 review customers (test-only input; expected answers are never read at runtime), then the built page's
// real main list projected read-only. No customer row is injected, replaced or mutated.
async function branchSearchCheck() {
  const C = require('../../frontend/src/briefing/branch-search-core');
  const S = require('../../frontend/src/briefing/branch-search-session');
  const golden = path.join(ROOT, 'tests/branch-search/golden');
  const I = JSON.parse(fs.readFileSync(path.join(golden, 'golden.input.json'), 'utf8'));
  const E = JSON.parse(fs.readFileSync(path.join(golden, 'golden.expected.json'), 'utf8'));
  const records = I.records, asOf = I.metadata.asOfDate, before = JSON.stringify(records);
  const keys = ['intent', 'resultStatus', 'resolvedQuery', 'matchedCaseIds', 'matchedCount', 'unknownCaseIds', 'metrics', 'uiEffect', 'resultPreviewCaseIds', 'resultPreviewCount', 'mainListCaseIds', 'mainListCount', 'sort', 'limit', 'orderedCaseIds', 'unknownCount'];
  const checkCase = (c, state) => { const got = C.step(records, state, c.utterance, asOf); keys.forEach(k => { if (k in c.expected) assert.deepEqual(got.result[k], c.expected[k], c.id + ' ' + k); }); return got.state; };
  let turns = 0;
  for (const c of E.cases) { checkCase(c, C.initialState(records)); turns++; }
  for (const session of E.sessions) { let state = C.initialState(records); for (const t of session.turns) { state = checkCase(t, state); turns++; } }
  assert.equal(JSON.stringify(records), before, 'Golden input is never mutated');
  assert.ok(!fs.readFileSync(path.join(ROOT, 'frontend/src/briefing/branch-search-core.js'), 'utf8').includes('golden.expected.json'), 'Runtime never reads golden answers');
  { const changed = copy(records); changed.find(r => C.idOf(r) === 'B02-27').irpAccount.valuationAmountKrw = 21000000;
    assert.equal(C.step(changed, C.initialState(changed), E.cases[1].utterance, asOf).result.matchedCount, 2, 'Answers are computed from data, not baked in'); }
  assert.equal(C.run([...records, copy(records[0])], C.all()).matchedCount, 8, 'Duplicate customer does not inflate the count');
  { const q = C.and(C.segment('납입금 미운용'), C.compare('age', 'gte', 38), C.compare('irp_amount', 'gte', 10000000)), q2 = C.remove(q, x => x.field === 'age');
    assert.deepEqual([C.run(records, q2).matchedCount, C.chips(q2).length], [2, 2], 'Chip removal changes only that condition'); }
  { const prev = C.step(records, C.initialState(records), E.cases[1].utterance, asOf).state, r = C.step(records, prev, '은행장님이 좋아할 고객 10명', asOf);
    assert.equal(r.result.resultStatus, 'unsupported_mock'); assert.deepEqual(r.state, prev, 'Unknown input keeps main list and reference'); }
  assert.equal(C.step(records, C.initialState(records), C.turns[1], asOf).result.resultStatus, 'clarification_required', 'Follow-up without reference asks');
  assert.deepEqual([C.dateAdd(asOf, -6), C.dateAdd(asOf, 30)], ['2026-09-08', '2026-10-14'], 'Dates come from the snapshot, not the clock');
  assert.equal(C.step(records, C.initialState(records), '현금성자산 500만원 이상 그리고 부자들만', asOf).result.resultStatus, 'unsupported_mock', 'Unrecognised clause is not partially executed');
  { const r = C.run(records, C.compare('tax_remaining', 'eq', 0)); assert.deepEqual([r.matchedCaseIds, r.unknownCaseIds], [['B01-03'], ['B02-04']], 'Zero is known, null is unknown'); }
  assert.equal(C.evaluate(records[2], { op: 'or', args: [C.compare('tax_remaining', 'eq', 0), C.segment('납입금 미운용')] }), true);
  assert.deepEqual(C.run(records, { op: 'holding_exists', productId: 'SAV-013', minAmountKrw: 30000000 }).matchedCaseIds, ['B04-19']);
  assert.equal(C.run(records, C.all(), { field: 'tax_remaining', direction: 'desc' }).orderedCaseIds.at(-1), 'B02-04', 'Unknown sorts last');
  assert.equal(C.step(records, C.initialState(records), '현금성자산 30% 이상', asOf).result.resultStatus, 'clarification_required', 'Wrong unit is rejected');
  // Session: latest request wins; manual change, new conversation, failure and destroy never leave a stale list.
  const pending = () => { const queue = []; const session = S.create(I, { mode: 'local', provider: (text, state) => new Promise((resolve, reject) => queue.push({ text, state, resolve, reject })) }); return { session, queue, resolve: i => queue[i].resolve(C.resolve(queue[i].text, queue[i].state, asOf)) }; };
  { const { session: s, resolve } = pending(); const p1 = s.send(C.questions[1][1]), p2 = s.send(C.questions[2][1]); resolve(1); await p2; resolve(0); await p1;
    assert.deepEqual(s.get().state.mainListCaseIds, ['B02-18'], 'Latest request wins'); assert.ok(s.get().messages[1].cancelled); s.destroy(); }
  { const { session: s, resolve } = pending(); const p = s.send(C.questions[1][1]); s.apply({ query: C.compare('cash_amount', 'gte', 5000000), sort: { field: 'caseId', direction: 'asc' }, limit: null }); resolve(0); await p;
    assert.deepEqual(s.get().state.mainListCaseIds, ['B01-22', 'B02-18'], 'Manual condition invalidates the pending reply'); s.destroy(); }
  { const { session: s, resolve } = pending(); s.apply({ query: C.segment('납입금 미운용'), limit: null }); const p = s.send(C.questions[2][1]); s.newConversation(); resolve(0); await p;
    assert.deepEqual([s.get().state.mainListCaseIds, s.get().messages.length, s.get().state.reference], [['B02-04', 'B02-27'], 0, null], 'New conversation keeps the list'); s.destroy(); }
  { const { session: s, queue } = pending(); s.apply({ query: C.segment('납입금 미운용'), limit: null }); const prev = s.get().state; const p = s.send(C.questions[2][1]); queue[0].reject(new Error('unavailable')); await p;
    assert.deepEqual(s.get().state, prev); assert.ok(s.get().messages.at(-1).error, 'Failure keeps query and list'); s.destroy(); }
  { const { session: s, resolve } = pending(); let events = 0; s.subscribe(() => events++); const p = s.send(C.questions[0][1]); s.destroy(); const n = events; resolve(0); await p; assert.equal(events, n, 'Destroy cancels in-flight updates'); }
  { const s = S.create(I, { mode: 'local' }); const a = await s.send(C.turns[0]); assert.deepEqual([a.uiEffect, s.get().state.mainListCaseIds.length], ['answer_only_keep_list', 8], 'Default session keeps the list on an aggregate answer (golden semantics)'); s.destroy(); }
  { const s = S.create(I, { mode: 'local', applyAggregate: true }); const a = await s.send(C.turns[0]); assert.deepEqual([a.uiEffect, s.get().state.mainListCaseIds], ['apply_customer_list', ['B02-04', 'B02-27']], 'Screen session applies an aggregate answer to the list at once'); await s.send(C.turns[1]); assert.deepEqual(s.get().state.mainListCaseIds, ['B02-04'], 'Follow-up narrows the applied list'); s.destroy(); }
  { const s = S.create(I, { mode: 'local' }), original = JSON.stringify(I); s.records()[0].customer.name = 'CHANGED'; assert.notEqual(s.records()[0].customer.name, 'CHANGED'); const x = s.get(); x.state.mainListCaseIds = []; assert.equal(s.get().state.mainListCaseIds.length, 8); await s.send(C.turns[0]); assert.equal(JSON.stringify(I), original, 'Snapshots are copies'); s.destroy(); }
  { const s = S.create(I, { mode: 'local' }); await s.send(C.turns[0]); const prev = s.get().state; assert.equal((await s.send('절대로 해석하면 안 되는 임의의 문장')).resultStatus, 'unsupported_mock'); assert.deepEqual(s.get().state, prev); s.destroy(); }
  { const s = S.create(I, { mode: 'local' }); let notice = ''; s.subscribe(e => { if (e.notice) notice = e.notice; }); assert.equal(await s.send('가'.repeat(1201)), null); assert.ok(notice && s.get().messages.length === 0, 'Oversized input is not executed'); s.destroy(); }
  { const s = S.create(I, { mode: 'local', latency: 80 }); const types = []; s.subscribe(e => types.push(e.type)); const t0 = Date.now(); const p = s.send(C.turns[0]); assert.deepEqual([s.get().busy, types], [true, ['pending']], 'Latency keeps the reply pending'); const r = await p; assert.ok(r && Date.now() - t0 >= 75 && !s.get().busy && types.at(-1) === 'answer', 'Mock answer arrives after the thinking time'); const p2 = s.send(C.turns[1]); s.cancel(); assert.deepEqual([await p2, s.get().messages.at(-1).cancelled, s.get().busy], [null, true, false], 'Stop during the thinking time cancels the reply'); s.destroy(); }
  // Bundle level: the built page's real main list (legacy demo rows + case customers), projected read-only.
  const w = ctx.window, page = new w.TestComponent({}); page.setState = patch => Object.assign(page.state, typeof patch === 'function' ? patch(page.state) : patch);
  const queue = page.renderVals().queue, rowsBefore = JSON.stringify(queue.map(r => [r.id, r.name, r.bal, r.ret, r.tags.map(t => t.t)]));
  const ids = plain(queue.map(r => r.id)), D = w.PensionBranchCurrentData;
  assert.deepEqual(ids.slice().sort(), plain(page.DATA.map(c => c.id)).sort(), 'Main-list rows carry the original customer ids');
  const fixtureIds = new Set(customers.map(c => c.briefingMeta.caseId)), structured = ids.filter(id => fixtureIds.has(id) || id === 'ksy');
  const source = D.fromCurrentRows(queue, w.PensionBriefingFixtures, page.DATA, c => page.profileOf(c));
  await require('../../tests/branch-search/conversation.test')(source);
  assert.deepEqual(plain([source.metadata.recordCount, source.metadata.structuredCount, source.metadata.displayOnlyCount, source.records.map(C.idOf)]), [ids.length, structured.length, ids.length - structured.length, ids], 'Population is exactly the current main list; case rows and ksy (DEMO-01) use their structured snapshot, legacy rows are display-only');
  assert.equal(JSON.stringify(queue.map(r => [r.id, r.name, r.bal, r.ret, r.tags.map(t => t.t)])), rowsBefore); assert.equal(w.PensionBriefingFixtures.customers.length, 42, 'Rows and fixtures are read, never changed');
  const withBadge = label => ids.filter(id => queue.find(r => r.id === id).tags.some(t => t.t === label));
  const balance = id => D.money(queue.find(r => r.id === id).bal);
  const provider = w.PensionBranchCurrentProvider.create(source), query = (text, state) => w.PensionBranchSearchCore.execute(source.records, state, provider(text, state), source.metadata.asOfDate);
  let state = w.PensionBranchSearchCore.initialState(source.records), out;
  out = query('DO 미등록 고객 보여줘', state); state = out.state;
  assert.deepEqual(plain([out.result.matchedCaseIds, out.state.mainListCaseIds]), [withBadge('DO 미등록').slice().sort(), withBadge('DO 미등록')], 'Badge search = rows showing that badge, in original list order');
  assert.ok(withBadge('DO 미등록').length >= 2 && !/undefined|적용했습니다|유지했습니다|판단하지 않았습니다/.test(out.result.answer), 'Answer text has no undefined field and no list-status trailer');
  out = query('IRP 잔액 2억원 이상 보여줘', state); state = out.state;
  const rich = ids.filter(id => balance(id) >= 200000000);
  assert.deepEqual(plain([out.result.matchedCaseIds, out.result.unknownCount, out.state.mainListCaseIds]), [rich.slice().sort(), 0, rich], 'Displayed balances (decimal 억원 included) parse exactly; results keep the original list order');
  out = query('우리 부점 IRP 고객 현황을 요약해줘.', state);
  assert.deepEqual(plain([out.result.intent, out.result.metrics.customerCount, out.result.metrics.assetAllocation[2].unknownCount, out.state.mainListCaseIds]), ['aggregate', ids.length, ids.length - structured.length, rich], 'Overview counts the whole list, marks legacy rows as unknown cash and keeps the applied list');
  const before1 = state;
  out = query('우리 부점에서 납입금 미운용 고객은 몇 명이고, 현금성자산 합계는 얼마야?', state); state = out.state;
  const idle = withBadge('납입금 미운용');
  assert.deepEqual(plain(w.PensionBranchSearchCore.execute(source.records, before1, provider('우리 부점에서 납입금 미운용 고객은 몇 명이고, 현금성자산 합계는 얼마야?', before1), source.metadata.asOfDate, { applyAggregate: true }).state.mainListCaseIds), idle, 'With applyAggregate (the screen setting) the aggregate answer narrows the list to those customers');
  assert.deepEqual(plain([out.result.intent, out.result.matchedCaseIds, out.state.mainListCaseIds]), ['aggregate', idle.slice().sort(), rich], 'M01 turn 1 aggregates over the current list without changing it');
  out = query('그중 IRP 잔액 2천만원 이상만 보여줘.', state); state = out.state;
  assert.deepEqual(plain(out.state.mainListCaseIds), idle.filter(id => balance(id) >= 20000000), 'M01 turn 2 narrows the previous condition on the current data');
  assert.equal(out.result.matchedCount, query('납입금 미운용 고객 중 IRP 잔액 2천만원 이상만 보여줘.', w.PensionBranchSearchCore.initialState(source.records)).result.matchedCount, 'Golden G02 gives the same customers as the follow-up, computed from current data');
  assert.equal(w.PensionBranchSearchStyles.replace(/--pad-branch-css:"[0-9a-f]{12}"/, '--pad-branch-css:"PAD_BRANCH_CSS_VERSION"'), fs.readFileSync(path.join(ROOT, 'frontend/src/briefing/branch-search.css'), 'utf8'), 'Bundled fallback copy of branch-search.css matches the source (version stamp aside)');
  assert.ok(/--pad-branch-css:"[0-9a-f]{12}"/.test(w.PensionBranchSearchStyles) && /--pad-branch-css:"[0-9a-f]{12}"/.test(fs.readFileSync(path.join(OUT, 'pensionAgentDemo.css'), 'utf8')), 'CSS version stamp present in bundle and stylesheet');
  assert.ok(js.includes('data-branch-style'), 'Widget injects the fallback stylesheet when the page CSS lacks its rules');
  // Renderer hooks, list markup and namespaced CSS in the built page.
  const html = fs.readFileSync(path.join(OUT, 'mnPensionAgentDemo.html'), 'utf8');
  for (const marker of ['PensionBranchSearchAdapter.mount(instance, params || {})', 'PensionBranchSearchAdapter.beforeRender(instance)', 'PensionBranchSearchAdapter.afterRender(instance)', 'PensionBranchSearchAdapter.destroy()']) assert.equal(js.split(marker).length, 2, 'Renderer hook: ' + marker);
  assert.deepEqual([(html.match(/data-branch-list/g) || []).length, (html.match(/data-branch-customer-id="\{\{ c\.id \}\}"/g) || []).length], [1, 1], 'List identity attributes');
  assert.ok(!/extToggle|extOpen|extOn\b|조건 추출/.test(html) && !/PensionBranchPreserveUI|resultbar|결과 위치 보기|해당 고객 보기/.test(js), '조건 추출 UI, result bar and reveal/apply buttons removed');
  for (const gone of ['6턴 시연 가이드', '조회 취소', '실제 AI 미연결', '<i></i>고객 조회', 'pad-branch-mode-gate', 'pad-branch-scope', 'pad-branch-live-dot', 'pad-branch-answer-meta', 'pad-branch-author', 'pad-branch-tour']) assert.ok(!js.includes(gone), 'Removed chat element still in the bundle: ' + gone);
  assert.ok(/height:min\(640px,calc\(100vh - 118px\)\)/.test(fs.readFileSync(path.join(OUT, 'pensionAgentDemo.css'), 'utf8')), 'Chat window height 640px');
  assert.ok(js.includes('<div class="floating_chat" role="button" tabindex="0"') && js.includes('>퇴직연금 사후관리 에이전트</div>') && !js.includes('pad-branch-launcher"'), 'Launcher is the shell .floating_chat div');
  for (const part of ['branchSearchLatency', 'pad-branch-progress', 'pad-branch-query-donut', 'pad-branch-skeleton-active', 'padBranchResultReveal', 'padBranchBorderLight', 'pad-branch-followups', 'pad-branch-caret', 'has-unread', 'is-stop']) assert.ok(js.includes(part), 'Waiting/completion UI piece in the bundle: ' + part);
  const css = fs.readFileSync(path.join(OUT, 'pensionAgentDemo.css'), 'utf8'), base = fs.readFileSync(path.join(ROOT, 'frontend/src/briefing/pensionAgentDemo.css'), 'utf8');
  assert.ok(css.startsWith(base), 'Original stylesheet stays an exact prefix');
  let depth = 0, buf = ''; const selectors = [];
  for (const ch of css.slice(base.length)) { if (ch === '{') { if (!depth) selectors.push(buf.replace(/\/\*[\s\S]*?\*\//g, '').trim()); depth++; buf = ''; } else if (ch === '}') { depth--; buf = ''; } else if (!depth) buf += ch; }
  // The widget is mounted on document.body (the shell's .pt-page is transformed, which breaks position:fixed),
  // so its rules are scoped by the .pad-branch- class prefix; no tag or global selector is allowed.
  const stray = selectors.filter(s => !/^(#pensionAgentDemo\b|\.pad-branch-)/.test(s) && !/^@(keyframes padBranch|media)/.test(s));
  assert.deepEqual(stray, [], 'Added CSS stays namespaced (.pad-branch- classes or #pensionAgentDemo)');
  // 엑셀 내려받기: 대화 문장 판별, 외부 라이브러리 없는 xlsx(ZIP store) 조립, 세션 기록. Agent 호출 없음.
  {
    const X = w.PensionExport;
    for (const t of ['이 고객 명세를 다운받고 싶어', '엑셀로 추출해줘', '지금 목록 파일로 내려받을래', 'xlsx 로 저장', 'Excel 다운로드']) assert.ok(X.isExportRequest(t), 'export intent: ' + t);
    for (const t of ['현금성 장기대기 고객 추출해줘', '오늘 부점 현황 말해줘', 'ISA 만기 고객 몇 명이야?', '']) assert.ok(!X.isExportRequest(t), 'not export intent: ' + t);
    const models = new Map(page.DATA.map(d => [d.id, d]));
    const items = source.records.map(r => ({ record: r, profile: page.profileOf(models.get(r.briefingMeta.caseId) || {}) }));
    const out = X.build({ items, asOf: source.metadata.asOfDate, staff: 'TEST', condition: '테스트 조건', now: new Date(2026, 8, 29, 14, 12) });
    assert.equal(out.fileName, '타겟고객_명단_20260929_1412.xlsx'); assert.equal(out.count, source.records.length);
    assert.deepEqual(plain(out.columns.slice(6, 9)), ['투자성향', '수신평잔(원)', 'IRP 잔액(원)'], '수신평잔 sits between 투자성향 and IRP 잔액');
    assert.ok(!out.columns.includes('최근 신호일'));
    const b = out.bytes; assert.ok(ArrayBuffer.isView(b) && b[0] === 0x50 && b[1] === 0x4B, 'ZIP signature'); // instanceof fails across vm realms
    const eocd = b.length - 22; assert.equal(b[eocd] | (b[eocd + 1] << 8) | (b[eocd + 2] << 16) | (b[eocd + 3] << 24), 0x06054b50, 'EOCD'); assert.equal(b[eocd + 10] | (b[eocd + 11] << 8), 7, '7 parts: types, rels, workbook, workbook rels, styles, 2 sheets');
    for (const row of out.rows) {
      const irp = row[8], dep = row[7];
      if (irp == null) assert.equal(dep, null); else { assert.ok(dep >= irp * 6 && dep <= irp * 9 && dep % 10000 === 0, '수신평잔 = IRP 잔액 × 6~9, 만원 단위: ' + row[1]); }
    }
    const again = X.build({ items, asOf: source.metadata.asOfDate, now: new Date(2026, 8, 29, 14, 12) });
    assert.deepEqual(again.rows.map(r => r[7]), out.rows.map(r => r[7]), '수신평잔 is deterministic per customer');
    const st = out.rows.find(r => r[1] === '박서진'); assert.ok(st && st[3] === 35 && st[9] === 3.2, 'structured record values flow into the sheet');
    const s = S.create(I, { mode: 'local' }); const events = []; s.subscribe(e => events.push(e.type)); const before = s.get();
    await s.note('엑셀로 내려받고 싶어', '내려받았어요'); const after = s.get();
    assert.deepEqual(events, ['answer']); assert.deepEqual(plain(after.messages.map(m => m.role)), ['user', 'assistant']); assert.equal(after.revision, before.revision); assert.deepEqual(after.state, before.state);
    // 지연 응답: pending(생각 중) 상태를 거친 뒤 answer 함수가 실행된다. 그 사이 취소되면 실행되지 않는다.
    { const d = S.create(I, { mode: 'local' }); const ev = []; d.subscribe(e => ev.push(e.type)); let ran = 0;
      const p = d.note('엑셀로', () => { ran++; return '완료'; }, { pendingText: '정리 중', delayMs: 40 });
      const mid = d.get(); assert.equal(mid.busy, true); assert.equal(mid.messages.at(-1).pending, true); assert.equal(mid.messages.at(-1).text, '정리 중'); assert.equal(ran, 0, 'download work waits for the delay');
      assert.equal(await p, '완료'); assert.equal(ran, 1); assert.equal(d.get().busy, false); assert.equal(d.get().messages.at(-1).text, '완료'); assert.deepEqual(ev, ['pending', 'answer']);
      const q = d.note('다시', () => { ran++; return 'x'; }, { delayMs: 40 }); d.cancel(); assert.equal(await q, null); assert.equal(ran, 1, 'cancelled note never runs its work'); assert.equal(d.get().messages.at(-1).cancelled, true); }
    assert.equal(X.displayId('4730692158-1234567'), '47306-12345'); assert.equal(X.displayId('10274-38562'), '10274-38562'); assert.equal(X.displayId(null), '');
    for (const r of out.rows) assert.ok(r[2] === '' || /^\d{1,5}-\d{1,5}$/.test(r[2]), '고객번호 5자리-5자리 표시: ' + r[1] + ' ' + r[2]);
    console.log('PASS: 엑셀 내려받기 — intent detection, dependency-free xlsx (' + out.count + ' rows, 2 sheets), session note without Agent/state change.');
  }
  console.log('PASS: 부점 AI golden regression (' + turns + ' turns, 8 review customers, test-only), session ordering/cancel/failure, real main list projected (' + ids.length + ' rows, ' + structured.length + ' structured), renderer hooks, list markup, namespaced CSS.');
}

// 처리 이력(오늘의 부점 브리핑): 프론트 목업 기록의 정합성과 패널 설치. 실제 Agent·LLM·FabriX 호출과 무관한 구조 검사다.
function traceCheck() {
  const T = require('../../frontend/src/briefing/pensionExecutionTraceData');
  const d = T.build();
  assert.deepEqual([d.origin, d.isSimulated, d.traces.generation.origin, d.traces.retrieval.isSimulated], ['frontend_fixture', true, 'frontend_fixture', true], 'Mock records carry their origin metadata');
  const prevIds = d.snapshots.prev.customers.map(c => c.customerId), currIds = d.snapshots.curr.customers.map(c => c.customerId);
  assert.equal(prevIds.length, 1392); assert.deepEqual(prevIds, currIds, 'Both snapshots hold the same 1,392 identifiers');
  assert.equal(new Set(prevIds).size, 1392);
  const target = { '관리 고객': [1392, 1392], '이탈위험': [34, 36], '계약이전 신청·처리대기': [7, 8], '전일 급여 입금': [0, 12], 'DO 미등록': [52, 51], '현금성 장기대기': [37, 39], '납입금 미운용': [14, 16], '정기예금 만기 30일 이내': [18, 21], 'ISA 만기 30일 이내': [11, 12], '연금개시 가능·미개시': [76, 77], '수익률 1% 미만': [214, 210], 'IRP 평가금액 1억원 이상': [119, 120] };
  assert.deepEqual(Object.fromEntries(d.segments.map(s => [s.label, [s.before, s.after]])), target, 'Segment counts are aggregated from the snapshots, not typed in');
  for (const s of d.segments) {
    assert.equal(s.net, s.entered.length - s.exited.length, s.label + ': 순증 = 신규 진입 − 이탈');
    assert.equal(s.after, s.before + s.net, s.label);
    assert.equal(new Set(s.entered.concat(s.exited)).size, s.entered.length + s.exited.length, s.label + ': a customer cannot enter and exit at once');
  }
  const seg = Object.fromEntries(d.segments.map(s => [s.key, s]));
  assert.equal(seg.churn_risk.entered.filter(id => seg.transfer_pending.entered.includes(id)).length, 1, 'One of the two new churn-risk customers is the new transfer applicant');
  const byCurr = Object.fromEntries(d.snapshots.curr.customers.map(c => [c.customerId, c]));
  assert.deepEqual(d.funnel.stages.map(s => s.selected.length), [12, 9, 6]);
  assert.deepEqual(d.funnel.stages.map(s => s.excludedCount), [1380, 3, 3]);
  assert.deepEqual(d.funnel.stages.slice(1).map(s => s.excluded.length), [3, 3], 'Excluded customers keep their reasons');
  for (const id of d.funnel.selected) {
    const c = byCurr[id];
    assert.ok(c.transactions.some(t => t.type === '급여입금' && t.date === '2026-09-28') && c.contribution.taxDeductionRemainingKrw > 0 && c.contribution.pastExtraContributions.length > 0, id + ' satisfies all three conditions');
  }
  assert.ok(d.funnel.selected.every(id => seg.salary_deposit.entered.includes(id)));
  for (const x of d.funnel.stages[1].excluded) assert.equal(byCurr[x.customerId].contribution.taxDeductionRemainingKrw, 0);
  for (const x of d.funnel.stages[2].excluded) assert.equal(byCurr[x.customerId].contribution.pastExtraContributions.length, 0);
  // 변경 고객은 식별자 합집합으로 다시 센다. 기준일 경과만으로 세그먼트가 바뀐 고객은 사실 변경이 없다.
  const byPrev = Object.fromEntries(d.snapshots.prev.customers.map(c => [c.customerId, c]));
  const actuallyChanged = currIds.filter(id => JSON.stringify(byPrev[id]) !== JSON.stringify(byCurr[id]));
  assert.deepEqual(d.comparison.changed.map(c => c.customerId), actuallyChanged);
  const compareStep = d.traces.generation.steps.find(s => s.id === 'g01');
  assert.deepEqual(compareStep.output.changedCustomerIds, actuallyChanged);
  for (const id of compareStep.output.dateOnlySegmentChangeIds) assert.equal(JSON.stringify(byPrev[id]), JSON.stringify(byCurr[id]), id + ': date-only segment change has no fact change');
  assert.ok(compareStep.output.changedCustomerIds.length > 14, 'Changed customers are not pinned to the old 14');
  const total = key => d.snapshots[key].customers.reduce((a, c) => a + c.account.valuationAmountKrw, 0);
  assert.deepEqual([total('prev'), total('curr')], [52550000000, 52680000000], '부점 잔액 526.8억(▲1.3억) matches the main screen');
  const bigCurr = d.snapshots.curr.customers.filter(c => c.account.valuationAmountKrw >= 1e8).reduce((a, c) => a + c.account.valuationAmountKrw, 0);
  assert.equal((bigCurr / total('curr') * 100).toFixed(1), '45.3', '적립금 1억 이상 = 전체의 45.3%');
  assert.equal(d.cases.length, 6);
  assert.equal(d.cases.find(c => c.key === 'maturity_window').factChanged, false);
  assert.ok(d.cases.find(c => c.key === 'churn_transfer').segmentsAfter.includes('이탈위험') && d.cases.find(c => c.key === 'churn_transfer').segmentsAfter.includes('계약이전 신청·처리대기'));
  assert.ok(d.cases.find(c => c.key === 'do_registered').segmentsBefore.includes('DO 미등록') && !d.cases.find(c => c.key === 'do_registered').segmentsAfter.includes('DO 미등록'));
  // 시각: 하나의 기준 시각 + offset. 소요시간은 시작·종료에서 계산되고 상위 단계는 빈틈 없이 이어진다.
  const msOf = iso => Date.parse(iso);
  for (const trace of [d.traces.generation, d.traces.retrieval]) {
    for (const s of trace.steps) {
      assert.ok(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(s.startedAt) && /Z$/.test(s.endedAt), 'ISO with timezone (runtime clock)');
      assert.equal(Math.round(msOf(s.endedAt) - msOf(s.startedAt)), s.durationMs, s.id + ': durationMs = end − start');
      if (s.parentId) { const p = trace.steps.find(x => x.id === s.parentId); assert.ok(msOf(s.startedAt) >= msOf(p.startedAt) && msOf(s.endedAt) <= msOf(p.endedAt), s.id + ' inside parent span'); }
    }
    const top = trace.steps.filter(s => !s.parentId);
    // Generation steps run back to back; the two transport steps bracket the generation window.
    if (trace === d.traces.generation) for (let i = 1; i < top.length; i++) assert.equal(top[i].startedAt, top[i - 1].endedAt, top[i].id + ' starts when the previous step ends');
  }
  const gen = d.traces.generation, ret = d.traces.retrieval;
  // 기준 시각 = 프론트 최초 렌더링(setBase). 요청 +120ms → 생성 +150ms~+20.15초 → 응답 +20.352초.
  const base = msOf(ret.requestedAt) - 120;
  assert.ok(Date.now() - base < 120000 && Date.now() - base >= 0, 'Mock clock is anchored to the runtime, not the authored 07:30');
  assert.deepEqual([msOf(gen.startedAt) - base, msOf(gen.endedAt) - base, gen.durationMs], [150, 20150, 20000]);
  assert.deepEqual([msOf(ret.respondedAt) - base, ret.durationMs, ret.generationDurationMs, ret.steps.map(s => s.id)], [20352, 20232, 20000, ['r01', 'r02']]);
  assert.ok(msOf(ret.requestedAt) < msOf(gen.startedAt) && msOf(gen.endedAt) <= msOf(ret.respondedAt), 'Generation runs inside the request/response window');
  T.setBase(1000000000000); const pinned = T.build();
  assert.equal(pinned.traces.retrieval.requestedAt, new Date(1000000000120).toISOString(), 'setBase re-anchors every timestamp'); T.setBase(base);
  assert.equal(ret.linkedGenerationTraceId, gen.traceId);
  assert.ok(gen.steps.filter(s => s.actor === 'LLM').length === 2 && ret.steps.every(s => s.actor !== 'LLM'), 'LLM calls live in the generation trace only');
  assert.deepEqual([gen.steps.filter(s => !s.parentId).map(s => s.id), ret.steps.length], [['g01', 'g02', 'g03', 'g04', 'g05', 'g06'], 2], 'Six generation steps (compare → segments → points → interpret → compose → verify) and two transport steps');
  assert.equal(JSON.parse(JSON.parse(JSON.parse(ret.response.gatewayFrame.slice(6)).content).content).data.text, T.BRIEFING_TEXT, 'Gateway CHUNK wraps the Agent CHUNK which wraps the logical answer');
  for (const s of gen.steps.concat(ret.steps)) { assert.equal(s.status, 'completed'); for (const k of ['id', 'sequence', 'actor', 'title', 'startedAt', 'endedAt', 'durationMs', 'summary']) assert.ok(s[k] != null, s.id + '.' + k); }
  for (const k of ['requestId', 'traceId', 'linkedGenerationTraceId', 'title', 'status', 'requestedAt', 'respondedAt', 'generatedAt', 'durationMs', 'request', 'response', 'steps', 'origin', 'isSimulated']) assert.ok(ret[k] != null, 'retrieval.' + k);
  const serialized = JSON.stringify(d.traces);
  assert.ok(!/Bearer |LOCAL_ONLY|GEMINI|openapiToken/.test(serialized), 'No credentials or config values in the mock record');
  assert.ok(!/\bDEMO\b|\bMOCK\b/.test(fs.readFileSync(path.join(ROOT, 'frontend/src/briefing/pensionExecutionTracePanel.js'), 'utf8')), 'No DEMO/MOCK prefixes in the panel UI');
  // 최종 문장은 메인 화면의 부점 브리핑 문구와 같다.
  const html = fs.readFileSync(path.join(ROOT, 'frontend/src/briefing/mnPensionAgentDemo.html'), 'utf8');
  const bodyHtml = html.match(/<div class="pad-brief-card__body pad-in">([\s\S]*?)<\/div>/)[1];
  assert.equal(bodyHtml.replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, ''), T.BRIEFING_TEXT, 'Final briefing equals the main-screen sentence');
  assert.equal(Number(T.BRIEFING_TEXT.match(/고객 (\d+)명/)[1]), d.funnel.selected.length);
  assert.ok(gen.steps.find(s => s.id === 'g06').output.checks.every(c => c.ok));
  assert.ok(html.includes('class="pad-trace-open" sc-camel-on-click="{{ openTrace }}" aria-controls="pad-trace-panel"'), 'Header button next to the status pill');
  // 번들: 패널 설치, renderVals 값, 스타일 범위.
  assert.equal(typeof ctx.window.PensionExecutionTracePanel.install, 'function');
  const page = new ctx.window.TestComponent({}); page.setState = patch => Object.assign(page.state, typeof patch === 'function' ? patch(page.state) : patch);
  page.componentDidMount();
  const vals = page.renderVals();
  assert.deepEqual([typeof vals.openTrace, vals.traceExpanded], ['function', 'false'], 'renderVals exposes the trigger and its aria state');
  assert.equal(ctx.window.PensionExecutionTracePanel.get(), null, 'No DOM host without a document');
  page.componentWillUnmount();
  const vmData = ctx.window.PensionExecutionTraceData.build();
  assert.equal(vmData.funnel.selected.length, 6, 'Bundle copy computes the same record');
  const cssSrc = fs.readFileSync(path.join(ROOT, 'frontend/src/briefing/pensionAgentDemo.css'), 'utf8'), traceCss = cssSrc.slice(cssSrc.indexOf('/* ===== 12. 처리 이력'));
  let depth = 0, buf = ''; const sel = [];
  for (const ch of traceCss) { if (ch === '{') { if (!depth) sel.push(buf.replace(/\/\*[\s\S]*?\*\//g, '').trim()); depth++; buf = ''; } else if (ch === '}') { depth--; buf = ''; } else if (!depth) buf += ch; }
  assert.deepEqual(sel.filter(s => !/^(#pensionAgentDemo\b|@media|@keyframes padEvidence)/.test(s)), [], 'pad-trace CSS stays under #pensionAgentDemo');
  const lines = ctx.window.PensionExecutionTracePanel.jsonLines({ a: 1, b: { c: [1, 2] } }, '', '', null, true, []);
  assert.deepEqual(lines.map(l => l.path), ['', 'a', 'b', 'b.c', 'b.c[0]', 'b.c[1]', 'b.c', 'b', ''], 'JSON lines carry paths for change highlighting');
  console.log('PASS: 처리 이력(오늘의 부점 브리핑) mock record — 1,392×2 snapshots, segment before/after/entered/exited/net, 12→9→6 with reasons, changed-customer union, totals 526.8억/45.3%, one clock base with consistent durations, generation→retrieval link, final sentence = main screen, panel installed and namespaced. (Structure only; no real Agent/LLM/FabriX call.)');
}

// 처리 이력(부점 AI 검색·엑셀 추출): 실제 세션/transport 관측 지점에서만 기록되는지, 가짜 SSE로 확인한다. Agent 계산·실제 Gemma는 다루지 않는다.
async function traceLogCheck() {
  if (!globalThis.crypto) globalThis.crypto = require('node:crypto').webcrypto;
  const L = require('../../frontend/src/briefing/pensionExecutionTraceLog');
  const S = require('../../frontend/src/briefing/branch-search-session');
  const X = require('../../frontend/src/briefing/pensionExport');
  const fixture = JSON.parse(fs.readFileSync(path.join(ROOT, 'branch-agent/validation/contract.examples.json'), 'utf8'));
  const example = fixture.examples.find(x => x.id === 'search'), errorExample = fixture.examples.find(x => x.id === 'error');
  const cfg = { endpointUrl: 'http://127.0.0.1:8765/bridge', agentId: 'branch-asset', openapiToken: 'TEST_ONLY', generativeAiClient: 'TEST_ONLY', xClientUser: 'TEST_EMPLOYEE' };
  const frame = event => 'data: ' + JSON.stringify({ event_status: 'CHUNK', status: 'SUCCESS', content: JSON.stringify(event) }) + '\r\n\r\n';
  const trace = req => ({ trace_version: 'branch-execution-trace.v1', origin: 'agent_observed', request_id: req.request_id, clock: 'monotonic', started_at: '2026-09-27T04:00:00.000+00:00', ended_at: '2026-09-27T04:00:05.700+00:00', duration_ms: 5700, status: 'completed',
    steps: [['s01', 'LLM', 'interpret'], ['s02', 'AGENT', 'plan'], ['s03', 'DATA', 'apply'], ['s04', 'AGENT', 'answer']].map(([id, actor, stage], i) => ({ id, sequence: i + 1, actor, stage, title: stage, status: 'completed', started_at: '2026-09-27T04:00:00.' + String(i * 10).padStart(3, '0') + '+00:00', ended_at: '2026-09-27T04:00:00.' + String(i * 10 + 5).padStart(3, '0') + '+00:00', duration_ms: 5, summary: stage, input: null, output: stage === 'plan' ? { message: null, attempt: null, model: null, deployment: null, purpose: null, state_summary: null, plan: null, selection: null, labels: ['현금성 장기대기'], row_ids: null, unknown_row_ids: null, count: null, sort: null, list_action: null, intent: null, status: null, revision: null, code: null, checks: null, source: null, action_type: null, notes: null } : null, evidence_refs: [] })),
    llm_calls: [{ call_id: 'llm-01', purpose: 'interpret', attempt: 1, model: 'gemma-4-31b-it', deployment: 'gemma-4-31b-nvidia-fp4-h100', started_at: '2026-09-27T04:00:00.020+00:00', ended_at: '2026-09-27T04:00:05.600+00:00', duration_ms: 5580, status: 'accepted', input: null, output: null, code: null }] });
  const fake = (body, options = {}) => async () => { const bytes = new TextEncoder().encode(body); let pos = 0; return new Response(new ReadableStream({ pull(c) { if (pos >= bytes.length) c.close(); else c.enqueue(bytes.slice(pos, pos += 64)); } }), { status: 200, headers: { 'Content-Type': 'text/event-stream' } }); };
  const answerFor = (req, withTrace) => { const events = copy(example.events); events.forEach(e => { for (const k of ['request_id', 'conversation_id', 'base_revision']) e.data[k] = req[k]; if (e.event === 'answer') { e.data.revision = req.base_revision + 1; if (withTrace) e.data.execution_trace = trace(req); } }); return events; };
  const log = L.createLog(), recorded = [];
  log.subscribe(e => recorded.push(e.type));
  let mode = 'trace';
  const session = S.create({ metadata: { recordCount: 57 } }, { config: cfg, manifest: fixture.manifest, timeoutMs: 40, observer: { start: input => L.searchRecorder(log, input) },
    fetch: async (url, opts) => {
      const req = JSON.parse(JSON.parse(opts.body).contents[0]);
      if (mode === 'slow') return new Promise(() => {});
      if (mode === 'error') { const e = copy(errorExample.events.at(-1)); e.data.request_id = req.request_id; e.data.conversation_id = req.conversation_id; e.data.base_revision = req.base_revision; return fake(frame(e))(url, opts); }
      return fake(answerFor(req, mode === 'trace').map(frame).join(''))(url, opts);
    } });
  // 1) 정상 + execution_trace: 전송 → progress → 수신 → 검증까지 기록되고, 목록 반영은 렌더러가 알릴 때만 완료된다.
  const answer = await session.send('현금성 장기대기 고객 보여줘');
  assert.ok(answer && answer.execution_trace, 'answer carries the Agent trace');
  const rec = log.list()[0];
  assert.deepEqual([rec.kind, rec.origin, rec.status, rec.requestId, rec.message], ['branch_search', 'frontend_observed', 'running', answer.request_id, '현금성 장기대기 고객 보여줘']);
  assert.deepEqual(rec.steps.map(s => s.stage), ['post_sent', 'response_stream', 'progress', 'validated'], 'Front-observed stages before the list renders');
  assert.ok(rec.steps[0].startedAt.endsWith('Z') && rec.steps[1].durationMs >= 0 && rec.steps[3].endedAt, 'ISO timestamps and measured durations');
  assert.equal(rec.agentTrace.steps.length, 4); assert.equal(rec.title, '현금성 장기대기 고객 검색', 'Title from the confirmed condition labels');
  assert.deepEqual([rec.answer.count, rec.answer.rowIds, rec.answer.listAction], [4, ['lsm', 'jmr', 'jmj', 'B08-01'], 'replace'], 'Result values are the actual answer values');
  assert.equal(rec.displayContext.managedCustomerCount, 1392); assert.equal(rec.displayContext.origin, 'display_config', 'Display scope is separate from the actual result count');
  const recorder = log.list()[0]; const w = ctx.window;
  const merged = plain(w.PensionExecutionTracePanel.mergedSteps(rec)).map(s => s.stage);
  assert.deepEqual(merged, ['post_sent', 'interpret', 'plan', 'apply', 'answer', 'response_stream', 'validated'], 'Timeline: FRONT send → Agent steps (progress hidden when the trace exists) → FRONT receive/validate');
  // Rendering completion is reported by the adapter after the DOM update, not by the promise.
  const api = L.searchRecorder(log, { requestId: 'x', conversationId: 'y', baseRevision: 0, message: 'm' }); log.list().pop();
  assert.equal(rec.listApplied, null);
  { const r = L.searchRecorder(log, { requestId: answer.request_id, conversationId: answer.conversation_id, baseRevision: 0, message: '현금성 장기대기 고객 보여줘' });
    r.sent({ path: '/openapi/agent-chat/v1/agent-messages', method: 'POST' }); r.responded(); r.final({ event: 'answer', data: answer }); r.validated(answer); assert.equal(r.record.status, 'running');
    r.rendered({ action: 'replace', rowIds: answer.ui.row_ids, revision: 1 }); assert.deepEqual([r.record.status, r.record.resultSummary, r.record.steps.at(-1).stage, r.record.listApplied.rowIds], ['completed', '4명 · 목록 반영 완료', 'list_rendered', answer.ui.row_ids]);
    assert.ok(r.record.durationMs >= 0 && r.record.endedAt, 'Completed record has an end time and a front-clock duration'); }
  // 2) execution_trace 없는 유효 응답: 프론트·progress 기록만, 가짜 Agent 단계 없음.
  mode = 'plain'; const plainAnswer = await session.send('현금성 장기대기 고객 보여줘');
  const rec2 = log.list().find(r => r.requestId === plainAnswer.request_id);
  assert.equal(rec2.agentTrace, null); assert.deepEqual(plain(w.PensionExecutionTracePanel.mergedSteps(rec2)).map(s => s.stage), ['post_sent', 'progress', 'response_stream', 'validated'], 'Without a trace only observed steps are shown');
  // 3) error 이벤트: 오류 기록, 이전 목록 유지.
  mode = 'error'; const before = session.get().revision; assert.equal(await session.send('오류'), null);
  const rec3 = log.list().at(-1); assert.deepEqual([rec3.status, rec3.error.code, session.get().revision], ['error', errorExample.events.at(-1).data.code, before]);
  assert.ok(rec3.steps.some(s => s.stage === 'failed') && !rec3.steps.some(s => s.stage === 'validated'), 'No success step after an error');
  // 4) timeout → 취소 기록, 진행 중 단계는 완료 처리되지 않음.
  mode = 'slow'; assert.equal(await session.send('느림'), null);
  const rec4 = log.list().at(-1); assert.deepEqual([rec4.status, session.get().messages.at(-1).code], ['error', 'TIMEOUT']);
  assert.ok(rec4.steps.every(s => s.status !== 'completed' || s.stage === 'post_sent'), 'Only the send step completed before the timeout');
  // 5) 새 요청이 이전 요청을 취소: 늦은 응답은 기록·목록에 적용되지 않는다.
  mode = 'slow'; const p1 = session.send('첫 요청'); mode = 'trace'; const a2 = await session.send('둘째 요청'); assert.equal(await p1, null);
  const first = log.list().find(r => r.message === '첫 요청'); assert.deepEqual([first.status, a2.request_id !== first.requestId, session.get().revision], ['cancelled', true, before + 1]);
  session.destroy();
  // 6) 엑셀 추출 기록: 목록 스냅샷 고정, 대기와 생성 시간 구분, 열/시트/파일 정보, 빈 목록·실패·취소.
  const items = customers.slice(0, 5).map(c => ({ record: { briefingMeta: { caseId: c.briefingMeta.caseId }, customer: c.customer, irpAccount: c.irpAccount, signals: c.signals }, profile: {} }));
  { const r = L.exportRecorder(log, { rowIds: items.map(i => i.record.briefingMeta.caseId), condition: '현금성 장기대기 · 4명', scope: '부점 AI 검색 결과', asOf: '2026-09-29', revision: 2, listSource: 'ai_search', sourceSearchTraceId: rec.id });
    r.captured(); r.waitStart(3000); r.waitEnd(); r.buildStart();
    assert.equal(r.record.steps.length, 2, 'Display wait is a duration note, not a step');
    const out = X.build({ items, asOf: '2026-09-29', condition: '현금성 장기대기 · 4명', scope: 's', now: new Date(2026, 8, 29, 14, 12), onPhase: (phase, info) => r.phase(phase, info) });
    r.built(out); r.downloaded(out.fileName);
    assert.deepEqual([r.record.status, r.record.resultSummary, r.record.sourceSearchTraceId, r.record.rowIds.length], ['completed', '5명 · XLSX 생성 · 다운로드 실행', rec.id, 5]);
    assert.deepEqual(r.record.steps.map(s => s.stage), ['capture', 'build', 'download'], 'Three export steps');
    assert.deepEqual(Object.keys(r.record.steps[1].output.phases), ['rows', 'sheets', 'zip'], 'XLSX phases are kept inside the build step');
    assert.ok(r.record.steps.every(s => s.status === 'completed' && s.endedAt && s.durationMs != null), 'Every export step is closed as completed with an end time');
    assert.deepEqual([r.record.file.rowCount, r.record.file.columnCount, r.record.file.sheetNames, r.record.file.byteLength], [5, 14, ['고객 명단', '추출 조건'], out.bytes.length], 'File facts from the actual build; header not counted');
    assert.ok(r.record.waitMs != null && r.record.waitMs >= 0 && r.record.steps[1].durationMs != null, 'Display wait is separate from the XLSX build duration'); }
  { const r = L.exportRecorder(log, { rowIds: [], condition: '전체 고객', scope: 's', asOf: null, revision: 0, listSource: 'main_list' }); r.captured(); r.empty(); assert.deepEqual([r.record.status, r.record.file, r.record.steps.at(-1).stage], ['completed', null, 'empty']); }
  { const r = L.exportRecorder(log, { rowIds: ['a'], condition: 'c', scope: 's', asOf: null, revision: 0, listSource: 'main_list' }); r.captured(); r.waitStart(10); r.cancelled('대기 중 취소'); assert.deepEqual([r.record.status, r.record.steps.at(-1).status], ['cancelled', 'cancelled']); }
  { const r = L.exportRecorder(log, { rowIds: ['a'], condition: 'c', scope: 's', asOf: null, revision: 0, listSource: 'main_list' }); r.captured(); r.waitStart(10); r.waitEnd(); r.buildStart(); r.failed('build', 'BOOM'); assert.deepEqual([r.record.status, r.record.resultSummary], ['error', '파일 생성 실패 · BOOM']); }
  { const r = L.exportRecorder(log, { rowIds: ['a'], condition: 'c', scope: 's', asOf: null, revision: 0, listSource: 'main_list' }); r.captured(); r.waitStart(10); r.waitEnd(); r.buildStart(); r.built({ fileName: 'f.xlsx', byteLength: 10, count: 1, columns: ['a'], sheetNames: ['x'] }); r.failed('download', 'DOWNLOAD_UNSUPPORTED'); assert.equal(r.record.resultSummary, '파일 생성 완료 · 다운로드 실행 실패 · DOWNLOAD_UNSUPPORTED'); }
  assert.ok(recorded.includes('add') && recorded.includes('update'), 'Panel subscribers are notified');
  // 화면 표시: 내부 행 ID는 현재 목록 데이터의 고객식별자(5자리-5자리)로 바꿔 보여주고, 모르는 ID는 그대로 둔다. JSON 원문은 바꾸지 않는다.
  { const pg = new w.TestComponent({}); pg.setState = patch => Object.assign(pg.state, typeof patch === 'function' ? patch(pg.state) : patch);
    const src = w.PensionBranchCurrentData.fromCurrentRows(pg.renderVals().queue, w.PensionBriefingFixtures, pg.DATA, c => pg.profileOf(c));
    const savedGet = w.PensionBranchSearchAdapter.get; w.PensionBranchSearchAdapter.get = () => ({ source: src });
    const kim = customers.find(c => c.briefingMeta.caseId === 'B01-03');
    assert.equal(w.PensionExecutionTracePanel.customerLabel('B01-03'), w.PensionCustomerView.displayId(kim.customer.customerId), 'Case row id shown as the customer identifier');
    assert.ok(/^\d{5}-\d{5}$/.test(w.PensionExecutionTracePanel.customerLabel('B01-03')), '10-digit 5-5 form');
    assert.equal(w.PensionExecutionTracePanel.customerLabel('no-such-row'), 'no-such-row', 'Unknown ids stay as they are');
    w.PensionBranchSearchAdapter.get = savedGet; }
  const mockIds = ctx.window.PensionExecutionTraceData.build().snapshots.curr.customers.map(c => c.customerId);
  assert.ok(mockIds.every(id => /^\d{5}-\d{5}$/.test(id)) && new Set(mockIds).size === mockIds.length, 'Mock briefing customers use unique 10-digit identifiers');
  assert.ok(!JSON.stringify(log.list()).includes('TEST_ONLY'), 'No token or header values in the log');
  log.destroy(); assert.deepEqual(log.list(), []);
  // 번들: 어댑터가 세션에 observer를 연결하고 렌더 완료 지점을 가진다; 표시 범위 설정은 계약·manifest와 분리된다.
  assert.ok(js.includes("observer:traceLog?{start:input=>TRACE().searchRecorder(traceLog,input)}:null") && js.includes('c.pendingTrace.rendered('), 'Adapter wiring in the bundle');
  assert.deepEqual([w.PensionBranchDisplay.DISPLAY.managedCustomerCount, w.PensionBranchDataManifest.row_ids.length <= 64, js.includes('MAX_ROWS = 1392')], [1392, true, false], '1,392 stays display-only; manifest and contract limits untouched');
  console.log('PASS: 처리 이력(부점 AI 검색·엑셀 추출) — send/receive/validate observed on the real transport hooks, Agent execution_trace merged in sequence, trace-less answer shows observed steps only, error/timeout/late response recorded without touching the list, export snapshot·wait vs build timing·file facts·empty/fail/cancel. (Fake SSE; no real Agent/Gemma.)');
}

// 화면 표시 기준일 = 오늘: 자료 기준일(2026-09-29)과의 차이만큼 화면의 모든 날짜가 움직이고, Agent 요청·manifest·실제 처리 시각은 그대로다.
// 검사는 +2일(2026-10-01, 목요일)로 고정한 두 번째 반입 JS 컨텍스트로 확인한다.
async function displayDateCheck() {
  const DDm = require('../../frontend/src/briefing/pensionDisplayDate');
  delete globalThis.__PENSION_DISPLAY_DATE;
  assert.match(DDm.today(), /^\d{4}-\d{2}-\d{2}$/, 'today() is a calendar day (Asia/Seoul)');
  globalThis.__PENSION_DISPLAY_DATE = '2026-10-01';
  assert.deepEqual([DDm.base(), DDm.today(), DDm.offsetDays()], [DATA_AS_OF, '2026-10-01', 2], 'Base = data 기준일, offset = today − base');
  assert.equal(DDm.shiftText('기준일 2026-09-29 · 2026.09.16 자료 기준 · 2026년 9월 30일 · 9월 30일 만기 · 2026-09-29T07:00:00+09:00 · D-10 · 경과 109일 · 12개월 10일 · 매월 25일 · 2026.09 자료 · 193482-6012375 · 10274-38562 · 2027-02-28'),
    '기준일 2026-10-01 · 2026.09.18 자료 기준 · 2026년 10월 2일 · 10월 2일 만기 · 2026-10-01T07:00:00+09:00 · D-10 · 경과 109일 · 12개월 10일 · 매월 25일 · 2026.09 자료 · 193482-6012375 · 10274-38562 · 2027-03-02',
    'Every date notation moves by the offset; D-n, elapsed days, month-only basis and identifiers stay');
  assert.deepEqual(DDm.shiftValue({ openedAt: '2026-09-29', started_at: '2026-09-29T01:00:00.000Z', front: { requestedAt: '2026-09-29T01:00:00.000Z' }, timeline: [{ at: '2026-09-29T01:00:00.000Z', text: '2026-09-29', n: 3 }] }),
    { openedAt: '2026-10-01', started_at: '2026-09-29T01:00:00.000Z', front: { requestedAt: '2026-09-29T01:00:00.000Z' }, timeline: [{ at: '2026-09-29T01:00:00.000Z', text: '2026-10-01', n: 3 }] }, 'Real clock keys are copied untouched; data dates move');
  globalThis.__PENSION_DISPLAY_DATE = DATA_AS_OF;
  assert.deepEqual([DDm.offsetDays(), DDm.shiftText('2026-09-29 그대로'), DDm.shiftDay('2026-09-29')], [0, '2026-09-29 그대로', '2026-09-29'], 'Offset 0 = identity');
  // 반입 JS 전체를 2026-10-01로 고정한 컨텍스트.
  let hooked = null;
  const w = { window: { __PENSION_DISPLAY_DATE: '2026-10-01', __PensionBuildExtract: extract => { hooked = copy(extract()); } }, document: {}, console, setTimeout, clearTimeout, setInterval, clearInterval, URL, AbortController, TextDecoder };
  vm.runInNewContext(js.replace('  // Starroot adapter', '  window.TestComponent = Component;\n  // Starroot adapter'), w);
  const page = new w.window.TestComponent({});
  page.setState = patch => Object.assign(page.state, typeof patch === 'function' ? patch(page.state) : patch);
  page.state.sel = null; page.state.filter = 'all'; page.state.extA = null;
  const dash2 = page.renderVals();
  assert.deepEqual([dash2.dashDateLabel, dash2.dashAsOfLabel], ['10월 1일 목요일', '10.01'], 'Dashboard date = display date (today)');
  assert.deepEqual(Array.from(dash2.queue, r => r.id), Array.from(dash.queue, r => r.id), 'Same rows and order as the pinned check');
  assert.deepEqual(Array.from(dash2.queue, r => Array.from(r.tags, t => t.t)), Array.from(dash.queue, r => Array.from(r.tags, t => t.t)), 'D-n badges are relative and do not change');
  const osh = customers.find(c => c.briefingMeta.caseId === EVIDENCE_CASE), b2 = w.window.PensionBriefingAdapter;
  page.select(EVIDENCE_CASE, true);
  let v2 = page.renderVals();
  assert.deepEqual([v2.profileAnalysisLabel, v2.briefingAnalysisLabel], ['2026.10.01 기준', '2026.10.01 기준 · 브리핑 초안'], 'Header 기준일 labels follow today');
  assert.equal(page.profileOf({ id: EVIDENCE_CASE }).acct, '2018.02.21', 'Customer dates move with the same offset (irpOpenedAt 2018-02-19 + 2)');
  assert.deepEqual(hooked, require('./branch-data').extractCurrentRows(customers), 'Build extraction hook (branch data) is independent of the display date');
  assert.equal(w.window.__PENSION_DISPLAY_DATE, '2026-10-01', 'Extraction restores the display date');
  const req2 = b2.getCustomerForRequest(EVIDENCE_CASE), wire2 = w.window.PensionFabrixContract.request(req2, 'r', 'E');
  assert.deepEqual([req2.briefingMeta.asOfDate, req2.customer.irpOpenedAt, req2.signals[1].date, wire2.as_of_date, wire2.customer_data.briefingMeta.asOfDate], [DATA_AS_OF, '2018-02-19', '2026-10-09', DATA_AS_OF, DATA_AS_OF], 'Agent request keeps the authored snapshot and 기준일');
  assert.deepEqual(JSON.stringify(wire2.customer_data), JSON.stringify(osh), 'Request snapshot is byte-identical to the fixture');
  assert.equal(b2.receive(b2.begin(EVIDENCE_CASE), evidenceBriefing, traceFor(wire2, evidenceBriefing)).ok, true, 'Stored briefing (authored dates) is still accepted');
  v2 = page.renderVals();
  assert.equal(v2.bfHotTips[0].date, '2025.03.01', 'Briefing content dates (Hot Tip 2025-02-27) move with the offset');
  { const stored = b2.analysisTrace(EVIDENCE_CASE), shown = w.window.PensionDisplayDate.shiftValue(stored);
    assert.deepEqual([stored.as_of_date, shown.as_of_date, shown.started_at, shown.steps[0].ended_at], [DATA_AS_OF, '2026-10-01', stored.started_at, stored.steps[0].ended_at], 'Stored trace keeps authored values; the panel draws a shifted copy with real clocks intact'); }
  { const T2 = w.window.PensionExecutionTraceData, d2 = T2.build(), d1 = require('../../frontend/src/briefing/pensionExecutionTraceData').build();
    assert.deepEqual([T2.AS_OF, T2.PREV, d2.asOfDate, d2.snapshots.prev.asOfDate, d2.snapshots.curr.transactionDate, d2.funnel.stages[0].title], ['2026-10-01', '2026-09-30', '2026-10-01', '2026-09-30', '2026-09-30', '전일(9/30) 급여 입금 고객'], 'Mock 처리 이력 is anchored to today');
    assert.ok(d2.segments.find(s => s.key === 'salary_deposit').rule.includes('전일 스냅샷 9/29, 금일 스냅샷 9/30'), 'Rule text names the shifted snapshot days');
    assert.deepEqual(copy([d2.funnel.selected, d2.segments.map(s => [s.before, s.after])]), [d1.funnel.selected, d1.segments.map(s => [s.before, s.after])], 'Same customers and counts every day; only dates move');
    assert.ok(d2.funnel.selected.every(id => d2.snapshots.curr.customers.find(c => c.customerId === id).transactions.some(t => t.type === '급여입금' && t.date === '2026-09-30')), 'Salary deposits land on yesterday');
    assert.ok(/^\d{4}-\d{2}-\d{2}T/.test(d2.traces.retrieval.requestedAt) && Date.now() - Date.parse(d2.traces.retrieval.requestedAt) < 120000, 'Timestamps stay on the runtime clock'); }
  { const out = w.window.PensionChat.compose([{ type: 'answer', text: '정기예금 만기 2026-10-09(D-8)이며 9월 30일 상담 예정입니다.', intent: 'situation' }, { type: 'trace', timeline: [{ at: '2026-09-29T01:00:00.000Z', stage: 'turn' }] }]);
    assert.ok(JSON.stringify(out).includes('2026-10-11(D-8)이며 10월 2일 상담') && !JSON.stringify(out).includes('2026-10-09'), 'Consultation answers render with today-based dates'); }
  // 원격 부점 AI 답변: 화면 문구만 옮기고 next_state·actions·반환 answer는 원본.
  { if (!globalThis.crypto) globalThis.crypto = require('node:crypto').webcrypto;
    const S = require('../../frontend/src/briefing/branch-search-session');
    const fixture = JSON.parse(fs.readFileSync(path.join(ROOT, 'branch-agent/validation/contract.examples.json'), 'utf8')), example = fixture.examples.find(x => x.id === 'search');
    const frame = event => 'data: ' + JSON.stringify({ event_status: 'CHUNK', status: 'SUCCESS', content: JSON.stringify(event) }) + '\r\n\r\n';
    const fakeFetch = async (url, opts) => { const req = JSON.parse(JSON.parse(opts.body).contents[0]); const events = copy(example.events); events.forEach(e => { for (const k of ['request_id', 'conversation_id', 'base_revision']) e.data[k] = req[k]; if (e.event === 'answer') { e.data.revision = req.base_revision + 1; e.data.text = '2026-09-29 기준 현금성 장기대기 고객은 4명입니다.'; e.data.scope_note = '현재 시연 자료 기준 · 2026-09-29'; } });
      const bytes = new TextEncoder().encode(events.map(frame).join('')); let pos = 0; return new Response(new ReadableStream({ pull(c) { if (pos >= bytes.length) c.close(); else c.enqueue(bytes.slice(pos, pos += 64)); } }), { status: 200, headers: { 'content-type': 'text/event-stream' } }); };
    globalThis.PensionDisplayDate = DDm; globalThis.__PENSION_DISPLAY_DATE = '2026-10-01';
    try {
      const session = S.create({ metadata: { recordCount: 57 } }, { config: { endpointUrl: 'http://127.0.0.1:8765/bridge', agentId: 'branch-asset', openapiToken: 'TEST_ONLY', generativeAiClient: 'TEST_ONLY', xClientUser: 'TEST_EMPLOYEE' }, manifest: fixture.manifest, timeoutMs: 400, fetch: fakeFetch });
      const returned = await session.send('현금성 장기대기 고객 보여줘'), snap = session.get(), reply = snap.messages.find(m => m.role === 'assistant');
      assert.deepEqual([reply.text, reply.result.scopeNote, returned.text, returned.scope_note], ['2026-10-01 기준 현금성 장기대기 고객은 4명입니다.', '현재 시연 자료 기준 · 2026-10-01', '2026-09-29 기준 현금성 장기대기 고객은 4명입니다.', '현재 시연 자료 기준 · 2026-09-29'], 'Remote answer prose is shown with today; the validated answer is returned unchanged');
      assert.deepEqual([snap.state, reply.result.actions], [returned.next_state, returned.actions], 'State and actions sent back to the Agent are the originals');
      session.destroy();
    } finally { delete globalThis.PensionDisplayDate; globalThis.__PENSION_DISPLAY_DATE = DATA_AS_OF; }
  }
  console.log('PASS: 화면 표시 기준일 = 오늘 — dashboard/header 기준일, customer·briefing·trace·mock 처리 이력·상담 답변·부점 AI 답변의 자료 날짜가 (오늘 − 2026-09-29)만큼 이동, D-n 뱃지·실제 처리 시각·Agent 요청 스냅샷·manifest·state는 그대로.');
}

autoRequestCheck().then(
  () => console.log('PASS: injected FabriX config (onParam params / window global), auto request on case select, one request per loaded case, SSE answer rendered, invalid or missing config never calls.'))
  .then(chatPanelCheck).then(
  () => console.log('PASS: chat panel with injected chat config: question -> replayed real SSE turns -> answer/list/quote/sources/followups rendered, log_events asked, trace kept per turn + summarized (TRACE button only on traced answers), session per customer, error note, empty config never calls.'))
  .then(branchSearchCheck).then(traceCheck).then(traceLogCheck).then(displayDateCheck).catch(
  error => { console.error(error); process.exitCode = 1; });

if (process.argv[2] === '--agent') {
  const served = customers.filter((c, i) => briefings[i]), servedBriefings = briefings.filter(Boolean);
  const requests = served.map(c => wire.request(c, 'agent-check-' + c.briefingMeta.caseId, 'TEST_EMPLOYEE'));
  const script = `
import ast, asyncio, copy, importlib.util, json, pathlib, sys
sys.path.insert(0, sys.argv[1])
import briefing
requests = json.load(sys.stdin)
events = [briefing.build_answer(req) for req in requests]
frames = [briefing.sse_frame(event) for event in events]
for event, frame in zip(events, frames):
    assert frame.endswith('\\n\\n') and frame.count('data: ') == 1
    envelope = json.loads(frame[6:])
    assert envelope['event'] == 'CHUNK'
    assert json.loads(envelope['content']) == event
first = requests[0]
for field, value in [('case_id', 'unknown'), ('customer_id', 'wrong'), ('as_of_date', '2000-01-01'), ('schema_version', 'v99'), ('task', 'other'), ('x_client_user', '')]:
    bad = copy.deepcopy(first); bad[field] = value
    try: briefing.build_answer(bad)
    except briefing.BriefingError: pass
    else: raise AssertionError('Invalid request accepted: ' + field)
bad = copy.deepcopy(first); bad['customer_data']['customer']['name'] = 'changed'
try: briefing.build_answer(bad)
except briefing.BriefingError as e: assert str(e) == 'SNAPSHOT'
else: raise AssertionError('Changed snapshot accepted')
for raw in ['not-json', '{"x":NaN}', '{"x":1,"x":2}']:
    try: briefing.parse_json(raw)
    except briefing.BriefingError: pass
    else: raise AssertionError('Malformed JSON accepted')
for bad in [None, [], {}, dict(first, extra='unexpected')]:
    try: briefing.build_answer(bad)
    except briefing.BriefingError: pass
    else: raise AssertionError('Invalid shape accepted')
mutated = briefing.build_answer(first); mutated['data']['briefing']['s2']['lead'] = 'mutated'
assert briefing.build_answer(first) == events[0]
for name in ['main.py', 'briefing.py']:
    ast.parse(pathlib.Path(sys.argv[1], name).read_text(), feature_version=(3, 10))
http_checked = False
if all(importlib.util.find_spec(name) for name in ['fastapi', 'pydantic']):
    import main
    async def request(method, route, body):
        messages = []; sent = False
        async def receive():
            nonlocal sent
            if not sent:
                sent = True
                return {'type': 'http.request', 'body': json.dumps(body).encode(), 'more_body': False}
            await asyncio.Event().wait()
        async def send(message): messages.append(message)
        scope = {'type': 'http', 'asgi': {'version': '3.0', 'spec_version': '2.4'}, 'http_version': '1.1', 'method': method, 'scheme': 'http', 'path': route, 'raw_path': route.encode(), 'query_string': b'', 'root_path': '', 'headers': [(b'content-type', b'application/json')], 'server': ('test', 80), 'client': ('test', 1234)}
        await main.app(scope, receive, send)
        status = next(m['status'] for m in messages if m['type'] == 'http.response.start')
        payload = b''.join(m.get('body', b'') for m in messages if m['type'] == 'http.response.body').decode()
        return status, payload
    async def run():
        status, body = await request('GET', '/health', {})
        assert status == 200 and json.loads(body)['llm_enabled'] is False
        def stable(text):
            event = json.loads(json.loads(text[6:])['content'])
            trace = event['data'].pop('analysis_trace', None)
            if trace is not None:
                for key in ('started_at', 'ended_at', 'duration_ms'):
                    trace.pop(key)
                for step in trace['steps']:
                    for key in ('started_at', 'ended_at', 'duration_ms'):
                        step.pop(key)
            return event, trace
        for req, frame in zip(requests, frames):
            status, body = await request('POST', '/chat', {'input_value': json.dumps(req)})
            assert status == 200 and body.endswith('\\n\\n') and body.startswith('data: ')
            got, got_trace = stable(body); want, want_trace = stable(frame)
            assert got == want and got_trace == want_trace and (got_trace is not None) == (req['case_id'] == 'C01-07')
        bad = dict(first, case_id='unknown')
        status, body = await request('POST', '/chat', {'input_value': json.dumps(bad)})
        assert status == 200
        error = json.loads(json.loads(body[6:])['content'])
        assert error['event'] == 'error' and error['request_id'] == first['request_id']
        status, body = await request('POST', '/chat', {'input_value': 123, 'secret': 'DO_NOT_ECHO'})
        assert status == 422 and 'DO_NOT_ECHO' not in body
    asyncio.run(run()); http_checked = True
assert 'llm_client' not in sys.modules
print(json.dumps({'events': events, 'http_checked': http_checked}, ensure_ascii=False))
`;
  const result = require('child_process').spawnSync(process.env.PYTHON || 'python3', ['-B', '-c', script, path.join(ROOT, 'agent')],
    { input: JSON.stringify(requests), encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, timeout: 60000 });
  if (result.error || result.status !== 0) throw new Error('Agent check failed: ' + (result.error ? result.error.message : result.stderr));
  const checked = JSON.parse(result.stdout);
  checked.events.forEach((event, i) => {
    const v = wire.validate(event, requests[i]);
    assert.equal(v.ok, true, requests[i].case_id);
    assert.deepEqual(event.data.briefing, contract.contentOf(servedBriefings[i]));
    if (requests[i].case_id === EVIDENCE_CASE) {
      assert.ok(v.trace && !v.traceCode, 'C01-07 answer carries a valid analysis_trace');
      assert.deepEqual([v.trace.mode, v.trace.origin, v.trace.llm_calls, v.trace.steps.map(s => s.id), v.trace.facts.length, v.trace.knowledge_cards.length, v.trace.bindings.length], ['fixed_briefing_evidence', 'agent_observed', 0, ['customer_summary', 'management_focus', 'knowledge_selection', 'briefing_binding'], 6, 11, 49]);
      assert.ok(v.trace.steps.every(s => /^\d{4}-\d{2}-\d{2}T/.test(s.started_at) && s.started_at !== '2026-09-28' && s.duration_ms >= 0), 'Steps carry actual runtime timestamps, not the authoring date');
      assert.ok(v.trace.bindings.every(b => wire.pointer(event.data.briefing, b.target) === b.text), 'Binding text resolves from the same returned briefing');
      assert.ok(v.trace.knowledge_cards.every(c => event.data.briefing.sources.some(s => s.id === c.source_id)), 'Agent cards carry source_id resolvable in the returned briefing');
      const titles = v.trace.snapshot.map(g => g.title);
      assert.ok(titles.includes('고객 정보') && titles.includes('IRP 계좌현황') && titles.includes('자산 구성') && titles.includes('관리신호 · 세그먼트') && titles.filter(t => t.startsWith('보유상품')).length === requests[i].customer_data.holdings.length, 'Snapshot covers profile, account, allocation, every holding and the segments');
      assert.ok(v.trace.snapshot.every(g => g.items.every(it => JSON.stringify(wire.pointer(requests[i].customer_data, it.ref)) === JSON.stringify(it.value))), 'Snapshot values are read from the request');
      assert.deepEqual(v.trace.snapshot.find(g => g.title === '관리신호 · 세그먼트').items.filter(it => /^세그먼트 \d$/.test(it.label)).map(it => it.value), requests[i].customer_data.signals.map(s => s.label), 'Segments are the customer signals');
    } else assert.ok(!('analysis_trace' in event.data), requests[i].case_id + ': no trace for other customers');
  });
  console.log('PASS: Python fixed lookup + SSE for 42 cases validated by frontend contract; C01-07 analysis_trace (4 steps, 6 facts, 11 cards with source_id, 49 bindings, llm_calls 0) and none elsewhere; invalid input/snapshot rejection; no LLM import; Python 3.10 syntax.');
  console.log(checked.http_checked ? 'PASS: FastAPI ASGI /health, ' + requests.length + ' /chat responses and error handling.' : 'SKIP: FastAPI/Pydantic not installed in local Python. HTTP application startup must be checked in the internal environment.');
}

// Optional real-response check. Inputs must be sanitized logical JSON objects,
// not HAR files or headers. Request/response values are never printed.
if (process.argv.length > 2 && process.argv[2] !== '--agent') {
  if (process.argv.length !== 4) throw new Error('Usage: node tools/briefing/check.js <request.json> <response.json>');
  const readInput = f => JSON.parse(fs.readFileSync(path.resolve(f), 'utf8'));
  const request = readInput(process.argv[2]), response = readInput(process.argv[3]);
  const result = wire.validate(response, request);
  if (!result.ok) throw new Error('Response validation: ' + result.code);
  console.log('PASS: supplied logical Agent response matches supplied request and S1–S5 contract.');
}

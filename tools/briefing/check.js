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
const { customers, briefings } = inputs();
assert.equal(customers.length, 31, 'Expected 30 customers + Kim. Update intentionally when adding cases.');
const js = fs.readFileSync(path.join(OUT, 'pensionAgentDemo.js'), 'utf8');
const code = js.match(/^\s*var STARROOT_FILE_CODE = '([^']+)'/m)[1];
const expected = artifacts(code);
assert.deepEqual(fs.readdirSync(OUT).sort(), Object.keys(expected).sort());
for (const [name, body] of Object.entries(expected)) assert.equal(fs.readFileSync(path.join(OUT, name), 'utf8'), body, 'Rebuild required: ' + name);
const ctx = { window: {}, document: {}, console, setTimeout, clearTimeout, setInterval, clearInterval, URL, AbortController, TextDecoder };
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
  assert.deepEqual(contract.validateContent(contract.contentOf(b), c), [], id);
  assert.equal(c.holdings.reduce((sum, x) => sum + x.valuationAmountKrw, 0), c.irpAccount.valuationAmountKrw, id);
  assert.equal(c.irpAccount.assetAllocation.reduce((sum, x) => sum + x.amountKrw, 0), c.irpAccount.valuationAmountKrw, id);
  if (c.irpAccount.valuationAmountKrw) for (const rows of [c.holdings, c.irpAccount.assetAllocation]) assert.ok(Math.abs(rows.reduce((sum, x) => sum + x.weightPct, 0) - 100) < 0.001, id);
  app.select(id, true);
  assert.equal(app.renderVals().hasAiBrief, false, id + ': no briefing before the Agent answer');
  assert.equal(bridge.receive(bridge.begin(id), contract.contentOf(b)).ok, true, id);
  const v = app.renderVals(), normalized = contract.normalizeContent(contract.contentOf(b));
  assert.equal(v.selName, c.customer.name, id);
  assert.equal(v.pfAmt, contract.money(c.irpAccount.valuationAmountKrw), id);
  assert.equal(v.bfS1Lines.length, b.s1.items.length, id);
  assert.equal(v.bfTiles.length, normalized.s3.options.length, id);
  assert.equal(v.bfReacts.length, normalized.s4.reactions.length, id);
  const req = wire.request(c, 'check-' + id, 'TEST_EMPLOYEE');
  assert.equal(wire.validate(wire.answer(req, contract.contentOf(b)), req).ok, true);
}
app.select('ksy', true);
assert.equal(app.renderVals().structuredBrief, false, 'Original Kim remains independent');
assert.equal(app.renderVals().pfRet, '+3.1%');
// Main list: legacy demo rows + the 30 case customers (DEMO-01 stays in the picker only).
// Each case row's badges are its signals, colored the same way as the briefing header.
const LEGACY_ROWS = 18, queued = customers.filter(c => c.briefingMeta.caseId !== 'DEMO-01');
app.state.sel = null; app.state.filter = 'all';
const dash = app.renderVals();
assert.equal(dash.showDashboard, true);
assert.equal(dash.queue.length, LEGACY_ROWS + queued.length, 'Main list = legacy rows + case customers');
assert.equal(dash.queueTotal, LEGACY_ROWS + queued.length);
assert.equal(dash.kNewN + dash.kOnN + dash.doneCount, dash.queueTotal, 'Every row is 신규 선정, 지속 관리 or 처리완료');
assert.deepEqual([dash.dashDateLabel, dash.dashAsOfLabel], ['9월 14일 월요일', '09.14'], 'Dashboard date follows the case 기준일');
assert.equal(dash.isaCount, dash.queue.filter(r => r.tags.some(t => /^ISA 만기 D-\d+$/.test(t.t))).length);
const CATALOG = /^(정기예금 만기|GIC 만기|ISA 만기|ISA 전환기한|DO 실행|퇴직금 재입금기한|연금개시) D-\d+$|^추가납입 \d+만원$|^(퇴직금 운용 미지시|퇴직금 일부만 운용|현금성 장기대기|현금성 과다|만기자금 미운용|납입금 미운용|입금매수상품 미지정|원리금보장 편중|수익률 부진|환매추천 펀드 보유|판매중단 펀드 보유|저금리 예금 보유|DO 미등록|투자성향-DO불일치|타행 IRP 보유|타행 연금저축 보유|연금저축 보유|복수 IRP 보유|연금자산 분산보유|이탈징후|계약이전 신청|계약이전 페이지 방문|연금개시 가능|연금개시 예정|연금수령 중|올해 미납입|납입 중단|퇴직연금 관리화면 방문|ETF 상품조회|펀드 상품조회|보유상품 수익률 조회|장기 미운용)$/;
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
  if (id === 'DEMO-01') { assert.equal(row, undefined, 'DEMO-01 is not a second 김서연 row'); continue; }
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
const kim = customers[0], content = contract.contentOf(briefings[0]), store = create(customers);
const first = store.begin('DEMO-01'), second = store.begin('DEMO-01');
assert.equal(store.receive(first, content).stale, true);
assert.equal(store.receive(second, content).ok, true);
assert.equal(store.receive(second, content).stale, true);
const snapshot = store.customer('DEMO-01');
assert.equal(store.receive(store.begin('DEMO-01'), { ...content, customer: {} }).ok, false);
assert.deepEqual(store.customer('DEMO-01'), snapshot);
const cancelled = store.begin('DEMO-01'); store.cancel('DEMO-01');
assert.equal(store.receive(cancelled, content).stale, true);
const minimal = { s1: { items: [{ text: '고객 사실', dataRefs: ['/customer/name'] }] }, s2: { lead: '상담 목적' }, s3: { lead: '제안 방향' }, s4: null, s5: null };
assert.deepEqual(contract.validateContent(minimal, kim), []);
app.select('DEMO-01', true);
const before = app.renderVals().pfAmt;
assert.equal(bridge.receive(bridge.begin('DEMO-01'), minimal).ok, true);
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
assert.deepEqual(JSON.parse(fs.readFileSync(path.join(ROOT, 'integration/contracts/response.example.json'), 'utf8')), wire.answer(wire.request(kim, 'example-request-001', 'TEST_EMPLOYEE'), content));
assert.deepEqual(JSON.parse(fs.readFileSync(path.join(ROOT, 'agent/briefing_data.json'), 'utf8')), agentData({ customers, briefings }), 'Rebuild Agent data together with the frontend');
console.log('PASS: 31 customer/briefing pairs, totals, render mappings, optional fields, customer isolation, request identity, SSE parser, current three-file build, main list = legacy rows + 30 cases with catalog badges.');

// Bundle-level run of the real path: injected config -> auto request on select ->
// fake fetch answering one SSE frame -> answer rendered. No network, no secrets.
async function autoRequestCheck() {
  const calls = [], settle = () => new Promise(resolve => setImmediate(resolve));
  ctx.fetch = async (url, init) => {
    calls.push({ url, init });
    const inner = JSON.parse(JSON.parse(init.body).contents[0]);
    const briefing = briefings[customers.findIndex(c => c.briefingMeta.caseId === inner.case_id)];
    const bytes = new TextEncoder().encode('data: ' + JSON.stringify({ event_status: 'CHUNK', status: 'SUCCESS', content: JSON.stringify(wire.answer(inner, contract.contentOf(briefing))) }) + '\n\n');
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
  live.select('DEMO-01', true);
  assert.equal(live.renderVals().fabrixBusy, true, 'Selecting a case requests it immediately');
  await settle();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, cfg.endpointUrl + '/openapi/agent-chat/v1/agent-messages');
  assert.equal(calls[0].init.headers['x-openapi-token'], 'Bearer test-token');
  const sent = JSON.parse(calls[0].init.body), inner = JSON.parse(sent.contents[0]);
  assert.deepEqual([sent.agentId, sent.isStream, inner.case_id, inner.x_client_user], [7, true, 'DEMO-01', 'TEST_EMPLOYEE']);
  assert.deepEqual(inner.customer_data, kim);
  const v = live.renderVals();
  assert.deepEqual([v.fabrixDiagnosticCode, v.hasAiBrief, v.bfS1Lines.length], ['SUCCESS', true, content.s1.items.length]);
  v.goBack(); live.select('DEMO-01', true);
  assert.equal(calls.length, 1, 'A loaded case is not requested again in the same mount');
  live.select('B01-22', true);
  assert.equal(calls.length, 2, 'Another case is requested');
  live.componentWillUnmount();
  await settle();
  assert.equal(live.renderVals().fabrixDiagnosticCode, 'NOCONFIG', 'Destroy clears the injected config');
  ctx.window.__PENSION_FABRIX_CONFIG = cfg;
  const viaGlobal = mount({ starrootParams: {} });
  viaGlobal.select('B06-13', true);
  assert.equal(viaGlobal.renderVals().fabrixBusy, true, 'window.__PENSION_FABRIX_CONFIG fallback');
  viaGlobal.componentWillUnmount(); delete ctx.window.__PENSION_FABRIX_CONFIG;
  const invalid = mount({ starrootParams: { fabrix: { ...cfg, endpointUrl: 'http://fabrix.example/prod' } } });
  invalid.select('DEMO-01', true);
  assert.deepEqual([invalid.renderVals().fabrixDiagnosticCode, invalid.renderVals().fabrixCanRequest], ['CONFIG', false]);
  invalid.componentWillUnmount();
  ctx.window.__PENSION_FABRIX_CONFIG = { endpointUrl: '', agentId: 0, xClientUser: '', openapiToken: '', generativeAiClient: '' };
  const empty = mount({ starrootParams: {} });
  empty.select('DEMO-01', true);
  assert.equal(empty.renderVals().fabrixDiagnosticCode, 'NOCONFIG', 'Shipped empty config block counts as not injected');
  empty.componentWillUnmount(); delete ctx.window.__PENSION_FABRIX_CONFIG;
  await settle();
  assert.equal(calls.length, 3, 'Invalid, empty or missing config never sends a request');
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
    const events = turn ? turn.events : [{ type: 'error', text: '알 수 없는 질문' }, { type: 'done' }];
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
  live.state.sel = 'DEMO-01';
  let v = live.renderVals();
  assert.deepEqual([v.agentOn, v.panelOpen, v.agChipsOn, v.agChips.length, kinds(v.agMsgs), v.agMsgs[0].text, v.agResetOn, v.agName], [true, true, false, 0, ['sys'], '고객 식별자를 입력해 주세요.', false, kim.customer.name], 'Panel opens with only the id prompt, no chips');
  type(live, 'bad id!');
  v = live.renderVals();
  assert.ok(/형식/.test(v.agMsgs[v.agMsgs.length - 1].text) && calls.length === 0, 'Malformed id is rejected without calling the agent');
  type(live, demoId);
  v = live.renderVals();
  assert.deepEqual([kinds(v.agMsgs).slice(-2), v.agChipsOn, v.agResetOn, v.agName, live.state.agInput, calls.length], [['user', 'sys'], false, true, kim.customer.name + ' · ' + demoId, '', 0], 'Entering the id starts the consultation: no chips, no agent call, input cleared');
  type(live, turnFact.message);
  v = live.renderVals();
  assert.deepEqual([v.agBusy, v.agResetOn, kinds(v.agMsgs).slice(-2), live.state.agInput], [true, false, ['user', 'status'], ''], 'Question sent: busy, status bubble, input cleared');
  await settle();
  v = live.renderVals();
  assert.equal(calls.length, 1);
  assert.deepEqual([calls[0].agentId, calls[0].headers['x-openapi-token'], calls[0].inner.x_client_user, calls[0].inner.customer_id, typeof calls[0].inner.session_id], ['asset-test-01', 'Bearer chat-token', '3902172-test', demoId, 'string'], 'Chat request carries the chat credentials, assetId, employee and the entered customer id');
  let ans = v.agMsgs[v.agMsgs.length - 1];
  assert.deepEqual([v.agBusy, ans.isAns, ans.lead, blockKinds(ans.blocks), [...ans.srcBadges].map(b => b.t), ans.evidN, ans.evid[0].points.length, ans.hasFollow, ans.followChips, ans.follow.length, ans.ctaOn, ans.clarifyOn],
    [false, true, answerText(turnFact).split('\n\n')[0], ['p'], ['본부 공식 자료'], 1, 3, true, true, 1, false, false], 'Answer rendered from the real sample');
  ans.follow[0].onTap();
  await settle();
  assert.equal(calls.length, 2); assert.equal(calls[1].inner.message, '고객이 앱에서 직접 할 수 있어?'); assert.equal(calls[1].inner.session_id, calls[0].inner.session_id, 'Same session across turns');
  v = live.renderVals();
  assert.ok(v.agMsgs[v.agMsgs.length - 1].isSys && /답변에 실패/.test(v.agMsgs[v.agMsgs.length - 1].text), 'error event becomes a system note');
  type(live, turnCustomer.message); await settle();
  ans = live.renderVals().agMsgs.pop();
  assert.deepEqual([blockKinds(ans.blocks), ans.blocks[1].items.length, ans.evidN, ans.follow.length], [['p', 'list'], 9, 5, 3]);
  const demoTranscript = live.renderVals().agMsgs.length;
  live.select('B01-22', true);
  v = live.renderVals();
  assert.deepEqual([kinds(v.agMsgs), v.agChipsOn, v.agResetOn], [['sys'], false, false], 'Another customer starts by asking for its id');
  const b0122 = customers.find(c => c.briefingMeta.caseId === 'B01-22').customer.customerId;
  type(live, b0122); type(live, turnPitch.message); await settle();
  assert.equal(calls[3].inner.customer_id, b0122, 'Typed id is sent as customer_id');
  assert.notEqual(calls[3].inner.session_id, calls[0].inner.session_id, 'New customer, new session');
  ans = live.renderVals().agMsgs.pop();
  assert.deepEqual([blockKinds(ans.blocks), ans.blocks[0].copyLabel, ans.srcBadges.length], [['quote', 'quote'], '복사', 1]);
  live.select('DEMO-01', true);
  v = live.renderVals();
  assert.equal(v.agMsgs.length, demoTranscript, 'Transcript kept per customer within the page');
  v.agReset();
  v = live.renderVals();
  assert.deepEqual([v.agResetOn, v.agChipsOn, kinds(v.agMsgs).pop(), v.agName], [false, false, 'sys', kim.customer.name], '고객 변경 asks for a new id');
  type(live, demoId); type(live, turnFact.message); await settle();
  assert.notEqual(calls[4].inner.session_id, calls[0].inner.session_id, 'Re-entering an id starts a new session');
  live.componentWillUnmount();
  const bare = mount({ starrootParams: { fabrix: { ...briefingCfg, chat: { endpointUrl: '', agentId: '', openapiToken: '', generativeAiClient: '' } } } });
  bare.state.sel = 'DEMO-01'; type(bare, demoId); type(bare, '질문');
  const note = bare.renderVals().agMsgs.pop();
  assert.ok(note.isSys && /주입되지 않아/.test(note.text) && calls.length === 5, 'Empty chat block: question kept, no call, NOCONFIG note');
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
  assert.equal(JSON.stringify(queue.map(r => [r.id, r.name, r.bal, r.ret, r.tags.map(t => t.t)])), rowsBefore); assert.equal(w.PensionBriefingFixtures.customers.length, 31, 'Rows and fixtures are read, never changed');
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
  assert.equal(w.PensionBranchSearchStyles, fs.readFileSync(path.join(ROOT, 'frontend/src/briefing/branch-search.css'), 'utf8'), 'Bundled fallback copy of branch-search.css matches the source');
  assert.ok(js.includes('data-branch-style'), 'Widget injects the fallback stylesheet when the page CSS lacks its rules');
  // Renderer hooks, list markup and namespaced CSS in the built page.
  const html = fs.readFileSync(path.join(OUT, 'mnPensionAgentDemo.html'), 'utf8');
  for (const marker of ['PensionBranchSearchAdapter.mount(instance, params || {})', 'PensionBranchSearchAdapter.beforeRender(instance)', 'PensionBranchSearchAdapter.afterRender(instance)', 'PensionBranchSearchAdapter.destroy()']) assert.equal(js.split(marker).length, 2, 'Renderer hook: ' + marker);
  assert.deepEqual([(html.match(/data-branch-list/g) || []).length, (html.match(/data-branch-customer-id="\{\{ c\.id \}\}"/g) || []).length], [1, 1], 'List identity attributes');
  assert.ok(!/extToggle|extOpen|extOn\b|조건 추출/.test(html) && !/PensionBranchPreserveUI|resultbar|결과 위치 보기|해당 고객 보기/.test(js), '조건 추출 UI, result bar and reveal/apply buttons removed');
  for (const gone of ['6턴 시연 가이드', '조회 취소', '실제 AI 미연결', '<i></i>고객 조회', 'pad-branch-mode-gate', 'pad-branch-scope', 'pad-branch-live-dot', 'pad-branch-answer-meta', 'pad-branch-author', 'pad-branch-tour']) assert.ok(!js.includes(gone), 'Removed chat element still in the bundle: ' + gone);
  assert.ok(/height:min\(640px,calc\(100vh - 118px\)\)/.test(fs.readFileSync(path.join(OUT, 'pensionAgentDemo.css'), 'utf8')), 'Chat window height 640px');
  for (const part of ['branchSearchLatency', 'pad-branch-progress', 'pad-branch-query-donut', 'pad-branch-skeleton-active', 'padBranchResultReveal', 'padBranchBorderLight', 'pad-branch-followups', 'pad-branch-caret', 'has-unread', 'is-stop']) assert.ok(js.includes(part), 'Waiting/completion UI piece in the bundle: ' + part);
  const css = fs.readFileSync(path.join(OUT, 'pensionAgentDemo.css'), 'utf8'), base = fs.readFileSync(path.join(ROOT, 'frontend/src/briefing/pensionAgentDemo.css'), 'utf8');
  assert.ok(css.startsWith(base), 'Original stylesheet stays an exact prefix');
  let depth = 0, buf = ''; const selectors = [];
  for (const ch of css.slice(base.length)) { if (ch === '{') { if (!depth) selectors.push(buf.replace(/\/\*[\s\S]*?\*\//g, '').trim()); depth++; buf = ''; } else if (ch === '}') { depth--; buf = ''; } else if (!depth) buf += ch; }
  // The widget is mounted on document.body (the shell's .pt-page is transformed, which breaks position:fixed),
  // so its rules are scoped by the .pad-branch- class prefix; no tag or global selector is allowed.
  const stray = selectors.filter(s => !/^(#pensionAgentDemo\b|\.pad-branch-)/.test(s) && !/^@(keyframes padBranch|media)/.test(s));
  assert.deepEqual(stray, [], 'Added CSS stays namespaced (.pad-branch- classes or #pensionAgentDemo)');
  console.log('PASS: 부점 AI golden regression (' + turns + ' turns, 8 review customers, test-only), session ordering/cancel/failure, real main list projected (' + ids.length + ' rows, ' + structured.length + ' structured), renderer hooks, list markup, namespaced CSS.');
}

autoRequestCheck().then(
  () => console.log('PASS: injected FabriX config (onParam params / window global), auto request on case select, one request per loaded case, SSE answer rendered, invalid or missing config never calls.'))
  .then(chatPanelCheck).then(
  () => console.log('PASS: chat panel with injected chat config: question -> replayed real SSE turns -> answer/list/quote/sources/followups rendered, session per customer, error note, empty config never calls.'))
  .then(branchSearchCheck).catch(
  error => { console.error(error); process.exitCode = 1; });

if (process.argv[2] === '--agent') {
  const requests = customers.map(c => wire.request(c, 'agent-check-' + c.briefingMeta.caseId, 'TEST_EMPLOYEE'));
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
        for req, frame in zip(requests, frames):
            status, body = await request('POST', '/chat', {'input_value': json.dumps(req)})
            assert status == 200 and body == frame
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
    assert.equal(wire.validate(event, requests[i]).ok, true, requests[i].case_id);
    assert.deepEqual(event.data.briefing, contract.contentOf(briefings[i]));
  });
  console.log('PASS: Python fixed lookup + SSE for 31 cases validated by frontend contract; invalid input/snapshot rejection; no LLM import; Python 3.10 syntax.');
  console.log(checked.http_checked ? 'PASS: FastAPI ASGI /health, 31 /chat responses and error handling.' : 'SKIP: FastAPI/Pydantic not installed in local Python. HTTP application startup must be checked in the internal environment.');
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

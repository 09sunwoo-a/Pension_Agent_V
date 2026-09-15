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
const { create } = require('../../frontend/src/briefing/pensionBriefingStore');
const copy = x => JSON.parse(JSON.stringify(x));
const { customers, briefings } = inputs();
assert.equal(customers.length, 31, 'Expected 30 customers + Kim. Update intentionally when adding cases.');
const js = fs.readFileSync(path.join(OUT, 'pensionAgentDemo.js'), 'utf8');
const code = js.match(/^\s*var STARROOT_FILE_CODE = '([^']+)'/m)[1];
const expected = artifacts(code);
assert.deepEqual(fs.readdirSync(OUT).sort(), Object.keys(expected).sort());
for (const [name, body] of Object.entries(expected)) assert.equal(fs.readFileSync(path.join(OUT, name), 'utf8'), body, 'Rebuild required: ' + name);
const ctx = { window: {}, document: {}, console, setTimeout, clearTimeout, setInterval, clearInterval, URL, AbortController };
vm.runInNewContext(js.replace('  // Starroot adapter', '  window.TestComponent = Component;\n  // Starroot adapter'), ctx);
assert.equal(typeof ctx.window['PG_' + code].onParam, 'function');
assert.equal(typeof ctx.window.PensionFabrix.configure, 'function');
const app = new ctx.window.TestComponent({});
app.setState = patch => Object.assign(app.state, typeof patch === 'function' ? patch(app.state) : patch);
for (const [i, c] of customers.entries()) {
  const id = c.briefingMeta.caseId, b = briefings[i];
  assert.deepEqual(contract.validateContent(contract.contentOf(b), c), [], id);
  assert.equal(c.holdings.reduce((sum, x) => sum + x.valuationAmountKrw, 0), c.irpAccount.valuationAmountKrw, id);
  assert.equal(c.irpAccount.assetAllocation.reduce((sum, x) => sum + x.amountKrw, 0), c.irpAccount.valuationAmountKrw, id);
  if (c.irpAccount.valuationAmountKrw) for (const rows of [c.holdings, c.irpAccount.assetAllocation]) assert.ok(Math.abs(rows.reduce((sum, x) => sum + x.weightPct, 0) - 100) < 0.001, id);
  app.select(id, true);
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
const bridge = ctx.window.PensionBriefingAdapter, before = app.renderVals().pfAmt;
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
assert.deepEqual(JSON.parse(fs.readFileSync(path.join(ROOT, 'integration/contracts/response.example.json'), 'utf8')), wire.answer(wire.request(kim, 'example-request-001', 'TEST_EMPLOYEE'), content));
assert.deepEqual(JSON.parse(fs.readFileSync(path.join(ROOT, 'agent/briefing_data.json'), 'utf8')), agentData({ customers, briefings }), 'Rebuild Agent data together with the frontend');
console.log('PASS: 31 customer/briefing pairs, totals, render mappings, optional fields, customer isolation, request identity, SSE parser, current three-file build.');

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

/* Contract gate only. Does not claim to test Agent calculation, a live model, or internal deployment. */
'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const cp = require('node:child_process'), vm = require('node:vm');
const ROOT = path.resolve(__dirname, '../..');
const C = require('../../frontend/src/briefing/branch-agent-contract');
const transport = require('../../frontend/src/briefing/fabrix-transport');
const fixture = require('./contract.examples.json');
const clone = x => JSON.parse(JSON.stringify(x));
const examples = Object.fromEntries(fixture.examples.map(x => [x.id, x]));
const last = name => clone(examples[name].events.at(-1));
const cases = [];
function add(id, kind, value, expected, extras = {}) { cases.push(clone({ id, kind, value, expected, ...extras })); }
function badRequest(id, change, name = 'search') { const r = clone(examples[name].request); change(r); add(id, 'request', r, false); }
function eventCase(id, change, expected = false, name = 'search', extras = {}) {
  const value = last(name); change(value.data); add(id, 'event', value, expected, { request: clone(examples[name].request), ...extras });
}

for (const e of fixture.examples) {
  add(e.id + ':request', 'request', e.request, true);
  e.events.forEach((value, i) => add(e.id + ':event:' + i, 'event', value, true, { request: e.request }));
}
badRequest('missing-message', r => delete r.message);
badRequest('missing-nullable-action', r => delete r.action);
badRequest('unexpected-html-field', r => r.html = '<div>no</div>');
badRequest('wrong-version', r => r.schema_version = 'customer-briefing-api.v1');
badRequest('wrong-task', r => r.task = 'customer_briefing');
badRequest('uuid-format', r => r.request_id = 'abc');
badRequest('uuid-trailing-newline', r => r.request_id += '\n');
badRequest('empty-message', r => r.message = '   ');
badRequest('overlong-message', r => r.message = '가'.repeat(1201));
badRequest('lone-surrogate-input', r => r.message = '\uD800');
badRequest('boolean-revision', r => r.base_revision = true);
badRequest('string-revision', r => r.base_revision = '0');
badRequest('negative-revision', r => r.base_revision = -1);
badRequest('unsafe-revision', r => r.base_revision = Number.MAX_SAFE_INTEGER);
badRequest('foreign-dataset', r => r.dataset_id = 'another-branch');
badRequest('data-hash-mismatch', r => r.data_version = '0'.repeat(64));
badRequest('hash-trailing-newline', r => r.data_version += '\n');
badRequest('unknown-action', r => r.action = { type: 'execute_js', code: 'alert(1)' });
badRequest('action-extra-field', r => r.action = { type: 'recommend', row_id: 'lsm' });
badRequest('restore-without-recommendation', r => r.action = { type: 'restore_recommendation' });
badRequest('aggregate-action-without-state', r => r.action = { type: 'show_aggregate' });
badRequest('remove-missing-condition', r => r.action = { type: 'remove_condition', operation_id: 'op-old' });
badRequest('brief-alias-is-not-row-id', r => r.action = { type: 'brief', row_id: 'DEMO-01' });
badRequest('clarify-without-pending', r => r.action = { type: 'clarify', value: 'yes' });

function stateRequest(id, change, expected = false) {
  const r = clone(examples.search.request); r.state = clone(last('search').data.next_state); r.base_revision = 1;
  change(r.state, r); add(id, 'request', r, expected);
}
stateRequest('valid-nested-filter', s => s.selection.operations[0].predicate = {op: 'and', args: [
  {op: 'compare', field: 'age', cmp: 'gte', value: 50}, {op: 'compare', field: 'age', cmp: 'lt', value: 60}]}, true);
stateRequest('decimal-percent', s => s.selection.operations[0].predicate = {op:'compare',field:'cash_pct',cmp:'gte',value:2.5}, true);
stateRequest('negative-return', s => s.selection.operations[0].predicate = {op:'compare',field:'return_pct',cmp:'lt',value:-2.5}, true);
stateRequest('zero-cash', s => s.selection.operations[0].predicate = {op:'compare',field:'cash_amount',cmp:'eq',value:0}, true);
stateRequest('valid-leap-date', s => s.selection.operations[0].predicate = {op:'isa_between',start:'2024-02-29',end:'2024-03-01'}, true);
stateRequest('invalid-calendar-date', s => s.selection.operations[0].predicate = {op:'isa_between',start:'2026-02-29',end:'2026-03-01'});
stateRequest('date-reversed', s => s.selection.operations[0].predicate = {op:'isa_between',start:'2026-10-01',end:'2026-09-01'});
stateRequest('year-zero', s => s.selection.operations[0].predicate = {op:'isa_between',start:'0000-01-01',end:'2026-09-01'});
stateRequest('decimal-won', s => s.selection.operations[0].predicate = {op:'compare',field:'irp_amount',cmp:'gte',value:70000000.5});
stateRequest('numeric-as-string', s => s.selection.operations[0].predicate = {op:'compare',field:'irp_amount',cmp:'gte',value:'70000000'});
stateRequest('text-field-numeric', s => s.selection.operations[0].predicate = {op:'compare',field:'name',cmp:'eq',value:1});
stateRequest('text-field-range', s => s.selection.operations[0].predicate = {op:'compare',field:'name',cmp:'gte',value:'김'});
stateRequest('percentage-over-100', s => s.selection.operations[0].predicate = {op:'compare',field:'cash_pct',cmp:'gte',value:101});
stateRequest('unregistered-segment', s => s.selection.operations[0].predicate.value = 'invented');
stateRequest('duplicate-operation-id', s => s.selection.operations.push(clone(s.selection.operations[0])));
stateRequest('too-many-operations', s => s.selection.operations = Array.from({length:101}, (_,i) => ({id:'op-'+i,type:'take',count:1})));
stateRequest('predicate-depth-five', s => { let p = {op:'segment',value:'DO 미등록'}; for(let i=0;i<4;i++) p={op:'not',arg:p}; s.selection.operations[0].predicate=p; });
stateRequest('predicate-33-nodes', s => s.selection.operations[0].predicate={op:'and',args:Array.from({length:32},()=>({op:'segment',value:'DO 미등록'}))});
stateRequest('take-zero', s => s.selection.operations=[{id:'op-2',type:'take',count:0}]);
stateRequest('take-over-48', s => s.selection.operations=[{id:'op-2',type:'take',count:49}]);
stateRequest('missing-recommendation-base', s => s.selection.base='recommendation');
stateRequest('inactive-filter-state', s => s.active=false);
stateRequest('unknown-selected-row', s => s.selected_row_id='missing');
stateRequest('valid-remove-action', (_s,r) => r.action={type:'remove_condition',operation_id:'op-1'}, true);
stateRequest('cannot-remove-sort-as-filter', (s,r) => {s.selection.operations=[{id:'op-1',type:'sort',field:'irp_amount',direction:'desc'}];r.action={type:'remove_condition',operation_id:'op-1'};});
{
  const r=clone(examples.clarify.request);r.state=clone(last('clarify').data.next_state);r.action={type:'clarify',value:'B06-13'};
  add('valid-clarify-choice','request',r,true);
  const invalid=clone(r);invalid.action.value='someone-else';add('stale-clarify-choice','request',invalid,false);
}
{
  const r=clone(examples.search.request);r.message='😀'.repeat(1200);add('unicode-code-point-limit','request',r,true);
  const over=clone(r);over.message+='😀';add('unicode-over-limit','request',over,false);
}
eventCase('count-disagrees', d => d.result.count++);
eventCase('duplicate-result', d => d.result.row_ids[1]=d.result.row_ids[0]);
eventCase('unknown-row', d => {d.result.row_ids[0]='missing';d.ui.row_ids[0]='missing';});
eventCase('matched-and-unknown-overlap', d => d.result.unknown_row_ids=['lsm']);
eventCase('ui-result-order-mismatch', d => d.ui.row_ids.reverse());
eventCase('replace-needs-sort', d => d.ui.sort=null);
eventCase('replace-needs-array', d => d.ui.row_ids=null);
eventCase('stale-request', d => d.request_id='00000000-0000-4000-8000-000000000099');
eventCase('stale-conversation', d => d.conversation_id='00000000-0000-4000-8000-000000000099');
eventCase('stale-base-revision', d => d.base_revision++);
eventCase('wrong-next-revision', d => d.revision++);
eventCase('response-version', d => d.schema_version='branch-agent-api.v2');
eventCase('response-data-version', d => d.data_version='a'.repeat(64));
eventCase('overlong-answer', d => d.text='가'.repeat(2001));
eventCase('too-many-actions', d => d.actions=Array.from({length:9},()=>({label:'추천',action:{type:'recommend'}})));
eventCase('action-removed-op', d => d.actions[0].action.operation_id='op-gone');
eventCase('selected-row-outside-result', d => d.next_state.selected_row_id='B01-03');
eventCase('html-field-in-answer', d => d.html='<div>no</div>');
eventCase('keep-with-row-array', d => d.ui.row_ids=[], false, 'overview');
eventCase('keep-cannot-be-empty-status', d => d.status='empty', false, 'overview');
eventCase('keep-changes-selection', d => d.next_state.selection={base:'all',operations:[]}, false, 'overview');
eventCase('keep-changes-recommendation', d => d.next_state.recommendation=null, false, 'overview');
eventCase('overview-changes-list', d => {d.ui.list_action='replace';d.ui.row_ids=d.result.row_ids;d.ui.sort={field:'source_order',direction:'asc'};}, false, 'overview');
eventCase('metric-string', d => d.result.metrics[1].value='5949240000', false, 'overview');
eventCase('metric-wrong-unit', d => d.result.metrics[1].unit='pct', false, 'overview');
eventCase('metric-coverage', d => d.result.metrics[2].unknown_count=16, false, 'overview');
eventCase('metric-duplicate-key', d => d.result.metrics[2].key='irp_sum', false, 'overview');
eventCase('known-value-null', d => d.result.metrics[1].value=null, false, 'overview');
eventCase('recommendation-without-evidence', d => d.result.reasons.pop(), false, 'recommend');
eventCase('recommendation-label-sort', d => d.ui.sort.field='source_order', false, 'recommend');
eventCase('reason-wrong-customer', d => d.result.reasons[0].row_id='lsm', false, 'recommend');
eventCase('reason-invalid-pointer', d => d.result.reasons[0].evidence_refs=['/invalid~2escape'], false, 'recommend');
eventCase('reason-invalid-day', d => d.result.reasons[0].as_of_date='2026-02-30', false, 'recommend');
eventCase('reason-duplicate', d => d.result.reasons.push(clone(d.result.reasons[0])), false, 'recommend');
eventCase('clarify-without-state', d => d.next_state.clarification=null, false, 'clarify');
eventCase('clarify-without-status', d => d.status='ok', false, 'clarify');
eventCase('empty-marked-ok', d => d.status='ok', false, 'empty');
eventCase('reset-retains-recommendation', d => d.next_state.recommendation=clone(last('recommend').data.next_state.recommendation), false, 'reset');
eventCase('reset-result-must-be-all', d => {d.result.row_ids=[];d.result.count=0;}, false, 'reset');
eventCase('brief-needs-target', d => d.next_state.selected_row_id=null, false, 'brief');
eventCase('unsupported-status-mismatch', d => d.status='ok', false, 'unsupported');
{
  const p=clone(examples.search.events[0]);p.data.list_pending=true;
  add('interpretation-must-not-hide-list','event',p,false,{request:examples.search.request});
  p.data.phase='executing';add('confirmed-list-progress','event',clone(p),true,{request:examples.search.request});
}
{
  const records={
    'B04-23':{searchSupplement:{management:{transfer:{status:'의사확인대기'}}}},
    'B06-13':{searchSupplement:{management:{instruction:false}}},
    'B01-03':{searchSupplement:{externalAccounts:[{maturityDate:'2026-10-07'}]}}
  };
  eventCase('evidence-paths-exist',()=>{},true,'recommend',{records_by_id:records});
  eventCase('missing-evidence-record',()=>{},false,'recommend',{records_by_id:{}});
}

function jsVerdict(test) {
  try {
    const manifest=test.manifest||fixture.manifest;
    if(test.kind==='request') C.validateRequest(test.value,manifest);
    else if(test.kind==='shape') C.shape(test.schema_kind,test.value);
    else C.validateEvent(test.value,test.request,manifest,test.records_by_id);
    return {id:test.id,ok:true};
  } catch(e) {return {id:test.id,ok:false,code:e.code||'UNEXPECTED'};}
}

function checkPython(results) {
  const local=path.join(__dirname,'.venv/bin/python');
  const python=process.env.BRANCH_PYTHON || (fs.existsSync(local)?local:'python3');
  const exported=cp.spawnSync(python,[path.join(__dirname,'export_schema.py'),'--check'],{encoding:'utf8'});
  assert.equal(exported.status,0,'Python/Pydantic and schema freshness are required for this gate: '+exported.stderr+exported.stdout);
  const outerCases=[
    {id:'outer-string',kind:'outer',value:{input_value:JSON.stringify(examples.search.request),message_hists:null,platform_extra:true},expected:true},
    {id:'outer-object-not-string',kind:'outer',value:{input_value:examples.search.request},expected:false},
    {id:'outer-invalid-json',kind:'outer',value:{input_value:'not json'},expected:false},
    {id:'outer-missing-field',kind:'outer',value:{},expected:false}
  ];
  const batch={manifest:fixture.manifest,cases:[...cases,...outerCases],frame_events:examples.recommend.events};
  const output=cp.spawnSync(python,[path.join(__dirname,'check_contract.py')],{input:JSON.stringify(batch),encoding:'utf8',maxBuffer:4*1024*1024});
  assert.equal(output.status,0,'Python gate failed: '+output.stderr);
  const parsed=JSON.parse(output.stdout);
  assert.equal(parsed.python_310_syntax,true);
  parsed.results.forEach((r,i)=>{
    const test=batch.cases[i];assert.equal(r.ok,test.expected,'Python: '+test.id+' '+(r.code||''));
    if(i<results.length)assert.equal(r.ok,results[i].ok,'Python/JS disagreement: '+test.id);
  });
  console.log('PASS: '+cases.length+' shared Python/JS contract cases + '+outerCases.length+' FabriX input_value cases; Pydantic schema fresh');
  const docker=fs.readFileSync(path.join(ROOT,'branch-agent/deploy/Dockerfile'),'utf8');
  assert(docker.includes('WORKDIR /custom')&&docker.includes('azurecr.io/python:3.10')&&docker.includes('stg-nexus-genaihub.kbonecloud.com'));
  for(const file of fs.readdirSync(path.join(ROOT,'branch-agent/deploy')).filter(f=>f.endsWith('.py')))assert(docker.includes('COPY ./'+file+' /custom/'+file),'Explicit Docker COPY: '+file);
  assert(!/^COPY.*validation/m.test(docker)&&!/^COPY.*\.env(?!\*)/m.test(docker),'No validation code or fixed .env in the image (only the optional ./.env* glob)');
  console.log('PASS: Python 3.10 syntax and internal Docker/COPY configuration (not an actual image build)');
  return parsed.frames;
}

function checkFrames(frames) {
  const req=examples.recommend.request,m=fixture.manifest;
  const gateway=frames.map(frame=>{
    const agent=JSON.parse(frame.slice(6).trim());assert.equal(agent.event,'CHUNK');assert.equal(typeof agent.content,'string');
    return {event_status:'CHUNK',status:'SUCCESS',content:agent.content};
  });
  function feed(parts) {
    const turn=C.createTurn(req,m),parser=transport.parser(e=>turn.accept(e));
    for(const part of parts)parser.push(part);parser.finish();return turn.finish();
  }
  const source=': keepalive\r\n\r\ndata: '+JSON.stringify({event_status:'CHUNK',content:''})+'\r\n\r\n'+gateway.map(e=>'data: '+JSON.stringify(e)+'\r\n\r\n').join('')+'data: [DONE]\r\n\r\n';
  // Stream UTF-8 a byte at a time, including Korean bytes and split CRLF boundaries.
  const decoder=new TextDecoder('utf-8',{fatal:true}),parts=Array.from(Buffer.from(source),b=>decoder.decode(Uint8Array.of(b),{stream:true}));parts.push(decoder.decode());
  assert.deepEqual(feed(parts),last('recommend'));
  const joined={event_status:'CHUNK',status:'SUCCESS',content:gateway.map(x=>x.content).join('')};
  assert.deepEqual(feed(['data: '+JSON.stringify(joined)+'\n\n']),last('recommend'));
  const wrapped={...joined,content:JSON.stringify({event:'CHUNK',content:joined.content})};
  assert.deepEqual(feed(['data: '+JSON.stringify(wrapped)+'\n\n']),last('recommend'));
  for(const [label,envelopes] of [
    ['duplicate-final',[...gateway,gateway.at(-1)]],['progress-after-final',[...gateway,gateway[0]]],
    ['gateway-failure',[...gateway,{...gateway.at(-1),status:'FAIL'}]],
    ['truncated-flag',[{...gateway.at(-1),truncated:true}]],
    ['prose-recovery-forbidden',[{...joined,content:'failed: '+joined.content}]],
    ['double-nested-wrapper',[{...joined,content:JSON.stringify({event:'CHUNK',content:wrapped.content})}]],
    ['partial-logical-json',[{...joined,content:joined.content.slice(0,-2)}]]
  ]) assert.throws(()=>feed(envelopes.map(e=>'data: '+JSON.stringify(e)+'\n\n')),undefined,label);
  assert.throws(()=>feed(['data: '+JSON.stringify(gateway.at(-1))]),undefined,'Incomplete SSE EOF');
  assert.throws(()=>feed([]),undefined,'No final event');
  const cancelled=C.createTurn(req,m);cancelled.accept(gateway[0]);cancelled.cancel();assert.throws(()=>cancelled.accept(gateway[1]));assert.throws(()=>cancelled.finish());
  // Gate validates against a captured request, not an object mutated while waiting.
  const mutable=clone(req),turn=C.createTurn(mutable,m);mutable.base_revision++;gateway.forEach(e=>turn.accept(e));assert.deepEqual(turn.finish(),last('recommend'));assert.throws(()=>turn.finish());
  console.log('PASS: Agent CHUNK → FabriX event_status → UTF-8/CRLF SSE → validated final; coalescing, one wrapper, failures and cancellation');
}

function checkBrowserBundle() {
  const code=require('../../tools/briefing/build').artifacts()['pensionAgentDemo.js'];
  const context={window:{},document:{},console,setTimeout,clearTimeout,setInterval,clearInterval,URL,AbortController,TextDecoder};
  vm.runInNewContext('(function(module,exports,require){'+code+'})({}, {}, function(){throw Error("Unexpected CommonJS loader");});',context);
  assert.equal(context.window.PensionBranchAgentContract.version,C.version);
  assert.deepEqual(clone(context.window.PensionBranchAgentContract.validateEvent(last('search'),examples.search.request,fixture.manifest)),last('search'));
  console.log('PASS: embedded Pydantic schema + contract module in Starroot Function-style bundle without external runtime');
}

function run(options = {}) {
  const results=cases.map(jsVerdict);
  results.forEach((r,i)=>assert.equal(r.ok,cases[i].expected,'JS: '+r.id+' '+(r.code||'')));
  // Non-JSON JS values must never be normalized to null before validation.
  for(const value of [NaN,Infinity,-Infinity]) {const r=clone(examples.search.request);r.base_revision=value;assert.throws(()=>C.validateRequest(r,fixture.manifest));}
  let frames;
  if(options.jsOnly){
    console.log('PASS: '+cases.length+' JS contract cases');
    console.log('SKIP: Python parity/schema freshness/internal Docker checks (--js-only)');
    frames=examples.recommend.events.map(e=>'data: '+JSON.stringify({event:'CHUNK',content:JSON.stringify(e),references:[],recommend_queries:[],actions:[]})+'\n\n');
  }else frames=checkPython(results);
  checkFrames(frames);checkBrowserBundle();
  console.log('Contract gate only: Agent computation/live Gemma/HTTP/internal E2E are not covered.');
}
if(require.main===module)run({jsOnly:process.argv.includes('--js-only')});
module.exports={run};

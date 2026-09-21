/* Validation only. Invoked by tools/briefing/check-briefing-browser.js over CDP.
 * Samples are injected into the test page, never into build artifacts. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
module.exports=async function(run){
 const fixture=require('./contract.examples.json');
 const actualPath=path.resolve(__dirname,'../../integration/contracts/branch-data.manifest.json');
 const actual=fs.existsSync(actualPath)?JSON.parse(fs.readFileSync(actualPath,'utf8')):null;
 const bundle=fs.readFileSync(path.resolve(__dirname,'../../frontend/briefing-fabrix/pensionAgentDemo.js'),'utf8');
 assert(!bundle.includes(fixture.manifest.data_version),'Contract-only manifest must not ship in product');
 if(actual)assert(bundle.includes(actual.data_version),'Rebuild with 03 generated manifest before browser verification');
 const result=await run('('+browserCheck.toString()+')('+JSON.stringify(fixture)+','+JSON.stringify(actual)+')');
 console.log(result);
 console.log(actual?'PASS: product bundle manifest matches generated manifest; remote browser uses the original main-list rows':'SKIP: 03 actual manifest not generated; remote browser used validation-only manifest');
};
async function browserCheck(fixture,actual){
 const check=(value,message)=>{if(!value)throw Error(message);};
 const same=(a,b,message)=>check(JSON.stringify(a)===JSON.stringify(b),message);
 const copy=x=>JSON.parse(JSON.stringify(x));
 const tick=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
 const until=async(predicate,message)=>{for(let i=0;i<100;i++){if(predicate())return;await new Promise(r=>setTimeout(r,10));}throw Error(message);};
 const W=window.PensionBranchAgentContract,examples=Object.fromEntries(fixture.examples.map(x=>[x.id,x]));
 const nativeFetch=window.fetch,savedManifest=window.PensionBranchDataManifest,savedGlobal=window.__PENSION_FABRIX_CONFIG;
 const manifest=actual||fixture.manifest;
 const params={localPreview:true,fabrix:{xClientUser:'TEST_EMPLOYEE',branch:{endpointUrl:'http://127.0.0.1:8765/branch-validation',agentId:'branch-validation-asset',openapiToken:'TEST_ONLY',generativeAiClient:'TEST_ONLY'}}};
 const calls=[];let plan=null,c=null;
 const snapshot=()=>{const s=c.session.get();return {state:s.state,revision:s.revision,view:s.view};};
 const rows=()=>[...document.querySelectorAll('[data-branch-customer-id]')].map(n=>n.dataset.branchCustomerId);
 const finishTyping=()=>{if(c.widget.getState().streaming)c.widget.element.querySelector('form').dispatchEvent(new Event('submit',{cancelable:true}));};
 function envelope(event){return {event_status:'CHUNK',status:'SUCCESS',content:JSON.stringify({event:'CHUNK',content:JSON.stringify(event)})};}
 function events(request,kind){
  const example=copy(examples[kind]||examples.search),final=example.events.at(-1),data=final.data;
  for(const k of ['request_id','conversation_id','base_revision'])data[k]=request[k];
  if(final.event==='answer'){
   data.revision=request.base_revision+1;data.data_version=manifest.data_version;
   if(data.next_state.recommendation)data.next_state.recommendation.as_of_date=manifest.as_of_date;
   data.result.reasons.forEach(r=>{r.as_of_date=manifest.as_of_date;});
   if(data.ui.list_action==='keep'){
    const old=copy(request.state||W.initialState());old.clarification=null;
    if(data.intent==='overview'||data.intent==='aggregate')old.last_aggregate=data.next_state.last_aggregate;
    if(data.intent==='brief')old.selected_row_id=data.result.row_ids[0];
    if(data.intent==='clarify')old.clarification=data.next_state.clarification;
    data.next_state=old;
   }
   if(kind==='overview')data.actions=[{label:'집계 대상 보기',action:{type:'show_aggregate'}}];
   if(kind==='show_aggregate'||kind==='remove_condition'){
    data.intent='search';data.result={row_ids:manifest.row_ids.slice(),count:manifest.row_ids.length,unknown_row_ids:[],metrics:[],reasons:[]};
    data.ui={list_action:'replace',row_ids:manifest.row_ids.slice(),sort:{field:'source_order',direction:'asc'}};
    data.next_state=W.initialState();data.next_state.active=true;data.actions=[];
   }
  }
  const identity={request_id:request.request_id,conversation_id:request.conversation_id,base_revision:request.base_revision};
  return [{event:'progress',data:{...identity,phase:'interpreting',list_pending:false}},
   {event:'progress',data:{...identity,phase:'executing',list_pending:!!plan.listPending}},final];
 }
 window.fetch=async(url,opts)=>{
  if(!String(url).includes('/branch-validation/'))return nativeFetch(url,opts);
  const p=plan;check(p,'Unexpected branch call');
  const outer=JSON.parse(opts.body),request=JSON.parse(outer.contents[0]);
  check(url.endsWith('/openapi/agent-chat/v1/agent-messages'),'Same remote URL for localhost bridge');
  check(opts.method==='POST'&&outer.isStream&&outer.agentId==='branch-validation-asset','POST with string assetId');
  check(opts.headers['x-openapi-token']==='Bearer TEST_ONLY','Dedicated branch token');
  check(Object.keys(request).length===12&&!('customer_data' in request),'State only, no customer snapshots');
  W.validateRequest(request,manifest);calls.push({request,signal:opts.signal});
  if(p.http)return new Response('',{status:p.http});
  let ev=events(request,p.kind||'search');if(p.change)p.change(ev,request);
  if(p.duplicate)ev.push(copy(ev.at(-1)));
  if(p.empty)ev=ev.slice(0,2);
  const encoded=ev.map(e=>'data: '+JSON.stringify(envelope(e))+'\r\n\r\n').join('')+(p.gateway?'data: {"event_status":"CHUNK","status":"ERROR","content":"ignored"}\r\n\r\n':'');
  const bytes=new TextEncoder().encode(p.truncated?encoded.slice(0,-2):encoded);
  const body=new ReadableStream({start(controller){
   // Split UTF-8, CRLF and JSON across arbitrary network chunks.
   p.write=()=>{for(let i=0;i<bytes.length;i+=7)controller.enqueue(bytes.slice(i,i+7));};
   p.close=()=>controller.close();
   if(!p.holdBody)p.write();if(!p.holdBody&&!p.holdEOF)p.close();
  },cancel(){p.cancelled=true;}});
  return new Response(body,{headers:{'Content-Type':'text/event-stream; charset=utf-8'}});
 };
 function mount(withConfig=true){
  PG_1288272.onBeforeUnload();PG_1288272.onParam(withConfig?params:{localPreview:true});c=PensionBranchSearchAdapter.get();
  check(c.session.mode==='remote','Remote is the default');c.widget.setOpen(true);
 }
 async function send(kind='search',extra={},text='검증 질문',action){
  plan={kind,...extra};const result=await c.session.send(text,action);await tick();finishTyping();return result;
 }
 try{
  if(actual)same(savedManifest,actual,'Product bundle manifest matches generated manifest');
  window.__PENSION_FABRIX_CONFIG={};window.PensionBranchDataManifest=manifest;
  mount(false);await send();check(calls.length===0&&c.session.get().messages.at(-1).error,'Missing config blocks without local fallback');
  delete window.PensionBranchDataManifest;mount();await send();check(calls.length===0&&c.session.get().messages.at(-1).code==='MANIFEST','Missing real manifest blocks calls');
  window.PensionBranchDataManifest=manifest;mount();
  const app=document.getElementById('pensionAgentDemo');
  const markup=n=>{const clone=n.cloneNode(true);clone.querySelectorAll('[style]').forEach(el=>{el.style.removeProperty('animation');if(!el.getAttribute('style'))el.removeAttribute('style');});return clone.innerHTML;};
  const originalCards=new Map([...app.querySelectorAll('[data-branch-customer-id]')].map(n=>[n.dataset.branchCustomerId,markup(n)]));
  const fixed=['.pad-status-pill','.pad-brief-card','.pad-progress-card'],originalHeader=fixed.map(s=>markup(app.querySelector(s)));
  function original(){
   fixed.forEach((s,i)=>same(markup(app.querySelector(s)),originalHeader[i],'Main header unchanged'));
   app.querySelectorAll('[data-branch-customer-id]').forEach(n=>same(markup(n),originalCards.get(n.dataset.branchCustomerId),'Original card unchanged'));
   check(!app.querySelector('.pad-branch-controls,.pad-branch-row-footer,.pad-branch-brief,.pad-branch-empty'),'No new main screen UI');
  }
  // Real widget submission reaches transport, then waits for a clean EOF.
  const before=snapshot();plan={kind:'search',holdEOF:true,listPending:true};
  const form=c.widget.element.querySelector('form'),input=form.querySelector('textarea');input.value='현금성 장기대기 고객 보여줘';input.dispatchEvent(new Event('input'));form.dispatchEvent(new Event('submit',{cancelable:true}));
  await until(()=>c.busy,'Executing progress enables list skeleton');
  same(snapshot(),before,'Final event buffered until EOF');same(rows(),manifest.row_ids,'Pending leaves previous rows');check(c.session.get().busy,'Pending until EOF');
  plan.close();await until(()=>!c.session.get().busy,'EOF commits');await tick();finishTyping();
  same(rows(),examples.search.events.at(-1).data.ui.row_ids,'Search IDs and order');check(c.session.get().revision===1,'Revision commits');original();
  // Keep means exact list node/DOM/title preservation, even though result describes every row.
  const list=app.querySelector('[data-branch-list]'),head=app.querySelector('.pad-section-head'),title=head.textContent,listHTML=list.innerHTML;
  await send('overview');check(app.querySelector('[data-branch-list]')===list&&app.querySelector('.pad-section-head')===head,'Keep does not rerender list/header');
  check(list.innerHTML===listHTML&&head.textContent===title,'Keep preserves DOM and title');
  const last=c.session.get().messages.at(-1);check(last.result.scopeNote&&last.result.actions.length,'Context and followups in chat');
  plan={kind:'show_aggregate'};const actionButton=c.widget.element.querySelector('[data-command]');check(actionButton,'Show aggregate action rendered');actionButton.click();
  await until(()=>!c.session.get().busy,'Aggregate action finishes');await tick();finishTyping();
  same(calls.at(-1).request.action,{type:'show_aggregate'},'Button uses contract Action');same(rows(),manifest.row_ids,'Apply only on followup response');original();
  await send('recommend');same(rows(),examples.recommend.events.at(-1).data.ui.row_ids,'Recommendation server order');
  const briefList=app.querySelector('[data-branch-list]');await send('brief',{},'정미경 간단 브리핑',{type:'brief',row_id:'B04-23'});
  check(app.querySelector('[data-branch-list]')===briefList&&!c.component.state.sel,'Brief stays in conversation');
  await send('clarify');check(c.widget.element.querySelectorAll('[data-command]').length===3,'Clarification options rendered');
  plan={kind:'brief'};c.widget.element.querySelector('[data-command]').click();await until(()=>!c.session.get().busy,'Clarification selection completes');await tick();finishTyping();
  same(calls.at(-1).request.action,{type:'clarify',value:'B04-23'},'Clarification uses same remote API');
  await send('search');const staleButton=c.widget.element.querySelector('[data-command]');
  plan={kind:'remove_condition'};staleButton.click();await until(()=>!c.session.get().busy,'Condition removal completes');await tick();finishTyping();
  same(calls.at(-1).request.action,{type:'remove_condition',operation_id:'op-1'},'Remove condition uses Action');same(rows(),manifest.row_ids,'Removed condition applies reply IDs');
  const count=calls.length;staleButton.click();await tick();check(calls.length===count,'Old answer actions cannot be reused');
  await send('empty');same(rows(),[],'Empty replace renders zero rows');original();
  await send('reset');same(rows(),manifest.row_ids,'Agent reset restores original list');check(!c.session.get().state.active,'Reset state applied');
  await send('search');
  for(const failure of [
   {gateway:true},{duplicate:true},{truncated:true},{empty:true},{http:403},{kind:'error'},
   {change:ev=>{ev.at(-1).data.data_version='0'.repeat(64);}},
   {change:ev=>{ev.at(-1).data.request_id='00000000-0000-4000-8000-000000000009';}},
   {change:ev=>{ev.at(-1).data.ui.row_ids[0]='missing-row';}},
   {change:ev=>{ev.at(-1).data.html='<b>forbidden</b>';}}
  ]){
   const previous=snapshot(),ids=rows();await send('search',failure);
   same(snapshot(),previous,'Failure preserves last successful State/revision/view');same(rows(),ids,'Failure preserves rows');check(c.session.get().messages.at(-1).error,'Failure shown in chat');
  }
  const failed=calls.at(-1).request,committed=snapshot();plan={kind:'search'};
  c.widget.element.querySelector('[data-action="retry"]').click();await until(()=>!c.session.get().busy,'Retry finishes');await tick();finishTyping();
  const retry=calls.at(-1).request;check(retry.request_id!==failed.request_id,'Retry has a new request ID');same(retry.state,committed.state,'Retry uses last successful State');check(retry.base_revision===committed.revision,'Retry uses successful revision');
  await send('unsupported');check(!c.session.get().messages.at(-1).error,'Unsupported is a valid keep reply');
  await send('brief',{change:ev=>{ev.at(-1).data.text='<img src=x onerror="window.__branchInjected=1">검증';}});
  check(!window.__branchInjected&&!c.widget.element.querySelector('.pad-branch-messages img'),'Answer text is literal, no HTML execution');
  // Cancellation aborts fetch and keeps both state and rows. A late old turn never applies.
  let saved=snapshot();plan={kind:'search',holdBody:true};const pending=c.session.send('지연 응답');await until(()=>plan.close,'Fetch started');const old=plan,oldCall=calls.at(-1);
  c.session.cancel();await pending;check(oldCall.signal.aborted,'AbortController reaches transport');same(snapshot(),saved,'Cancel preserves state');
  await send('search');saved=snapshot();try{old.write();old.close();}catch(_){}await tick();same(snapshot(),saved,'Late cancelled response ignored');
  // A newer request invalidates the prior ticket even while its body is still pending.
  plan={kind:'search',holdBody:true};const older=c.session.send('첫 요청');await until(()=>plan.close,'Old fetch started');const oldSignal=calls.at(-1).signal;
  await send('recommend');await older;check(oldSignal.aborted,'New turn aborts old fetch');same(rows(),examples.recommend.events.at(-1).data.ui.row_ids,'Latest turn wins');
  // New conversation preserves selection/recommendation/selected row, clears only transient references.
  await send('brief');await send('overview');await send('clarify');const oldConversation=c.session.get();
  c.session.newConversation();const fresh=c.session.get();check(fresh.conversationId!==oldConversation.conversationId&&fresh.revision===0&&fresh.messages.length===0,'New conversation identity/reset');
  for(const k of ['active','selection','recommendation','selected_row_id'])same(fresh.state[k],oldConversation.state[k],'Preserved '+k);
  check(fresh.state.last_aggregate===null&&fresh.state.clarification===null,'Transient references cleared');
  const newList=rows();
  plan={kind:'search',holdBody:true};const detailPending=c.session.send('상세 이동 중');await until(()=>plan.close,'Detail pending started');const detailCall=calls.at(-1);
  c.component.setState({sel:newList[0]});await tick();await detailPending;
  check(detailCall.signal.aborted&&!c.widget.getState().visible,'Detail cancels and hides widget');
  c.component.setState({sel:null});await tick();same(rows(),newList,'Back preserves successful list');check(c.widget.getState().visible,'Widget returns');
  // Original filters reset AI even before a first result or while clarification/aggregate keeps the list.
  plan={kind:'search',holdBody:true};const filtering=c.session.send('필터 이동 중');await until(()=>plan.close,'Filter pending started');const filterCall=calls.at(-1);
  c.component.renderVals().kNewTap();await tick();await filtering;check(filterCall.signal.aborted&&c.session.get().state===null&&!c.applied,'KPI clears remote state and mode');
  check(c.component.state.filter==='new','Original KPI action preserved');await send('overview');check(calls.at(-1).request.state===null,'Native filtered list is not implicit AI scope');
  // Repeated KPI toggles retain their original behavior.
  c.component.renderVals().kNewTap();await tick();check(c.component.state.filter==='all','KPI toggle returns to all');
  c.restore();await tick();check(c.session.get().state===null,'Local restore null State');
  // A row can disappear or the loaded manifest can change after the request was sent.
  let stable=snapshot();plan={kind:'search',holdEOF:true};let invalidated=c.session.send('행 변경 중');
  await until(()=>plan.close,'Row validation pending');const originalData=c.component.DATA;
  Object.defineProperty(c.component,'DATA',{configurable:true,value:originalData.filter(x=>x.id!=='jmr')});
  plan.close();await invalidated;delete c.component.DATA;same(snapshot(),stable,'Missing live original row rejects whole turn');
  stable=snapshot();plan={kind:'search',holdEOF:true};invalidated=c.session.send('버전 변경 중');await until(()=>plan.close,'Version pending');
  window.PensionBranchDataManifest={...manifest,data_version:'0'.repeat(64)};plan.close();await invalidated;
  same(snapshot(),stable,'Version change rejects pending response');const changedCalls=calls.length;await send();check(calls.length===changedCalls,'Changed manifest blocks reuse of old State');
  window.PensionBranchDataManifest=manifest;
  // Unload disposes request, widget, state and subscriptions. Reentry is one clean instance.
  plan={kind:'search',holdBody:true};const unloading=c.session.send('화면 종료 중');await until(()=>plan.close,'Unload pending started');const disposedSession=c.session,unloadCall=calls.at(-1);
  PG_1288272.onBeforeUnload();await unloading;check(unloadCall.signal.aborted&&!document.querySelector('.pad-branch-widget,[data-branch-style]'),'Unload abort and DOM cleanup');
  check(disposedSession.get().state===null&&disposedSession.get().messages.length===0,'State and messages disposed');
  PG_1288272.onParam(params);c=PensionBranchSearchAdapter.get();check(document.querySelectorAll('.pad-branch-widget').length===1&&c.session.get().revision===0,'Single fresh widget on reentry');
  // Manifest mismatch is blocked before fetch, preserving every original row.
  window.PensionBranchDataManifest={...manifest,row_ids:manifest.row_ids.slice(1)};mount();const beforeMismatch=calls.length;await send();check(calls.length===beforeMismatch&&rows().length===48,'Manifest/current-row mismatch blocks calls');
  return 'PASS: browser transport → createTurn → remote session → original adapter; EOF/progress, search/keep/actions/brief/clarify/empty/reset, errors/retry/cancel/latest ticket, text safety, filters/detail/new conversation/unload/reentry, original cards/header';
 }finally{
  PG_1288272.onBeforeUnload();window.fetch=nativeFetch;window.__PENSION_FABRIX_CONFIG=savedGlobal;
  if(savedManifest===undefined)delete window.PensionBranchDataManifest;else window.PensionBranchDataManifest=savedManifest;
  PG_1288272.onParam({localPreview:true});
 }
}

/* Validation only: real transport with contract samples and byte-level fake SSE. */
'use strict';
const assert=require('node:assert/strict');
if(!globalThis.crypto)globalThis.crypto=require('node:crypto').webcrypto;
const T=require('../../frontend/src/briefing/branch-agent-transport');
const S=require('../../frontend/src/briefing/branch-search-session');
const fixture=require('./contract.examples.json'),example=fixture.examples.find(x=>x.id==='search');
const cfg={endpointUrl:'http://127.0.0.1:8765/bridge',agentId:'branch-asset',openapiToken:'TEST_ONLY',generativeAiClient:'TEST_ONLY',xClientUser:'TEST_EMPLOYEE'};
const frame=event=>'data: '+JSON.stringify({event_status:'CHUNK',status:'SUCCESS',content:JSON.stringify(event)})+'\r\n\r\n';
const valid=example.events.map(frame).join('');
const fake=(body,options={})=>async(_url,request)=>{
 assert.equal(request.method,'POST');assert.equal(request.credentials,'omit');
 const outer=JSON.parse(request.body);assert.equal(outer.agentId,'branch-asset');assert.equal(typeof outer.contents[0],'string');assert.equal(outer.isStream,true);
 const bytes=new TextEncoder().encode(body);let pos=0;
 return new Response(new ReadableStream({pull(c){if(pos>=bytes.length)c.close();else c.enqueue(bytes.slice(pos,pos+=options.step||1));}}),{status:options.status||200,headers:{'Content-Type':options.contentType||'text/event-stream'}});
};
async function run(){
 assert.equal(T.config({...cfg,agentId:42}).agentId,42);
 for(const id of [0,-1,'',null])assert.throws(()=>T.config({...cfg,agentId:id}));
 assert.equal(T.settings({fabrix:{branch:null}}, {branch:cfg}),null);
 assert.deepEqual(T.settings({fabrix:{branch:{agentId:'override'},xClientUser:'PARAM'}},{branch:cfg,xClientUser:'GLOBAL'}),{agentId:'override',xClientUser:'PARAM'});
 let progress=0;
 const result=await T.call(cfg,example.request,fixture.manifest,{fetch:fake(valid),onProgress:()=>progress++});
 assert.equal(progress,1);assert.deepEqual(result,example.events.at(-1));
 const merged='data: '+JSON.stringify({event_status:'CHUNK',content:JSON.stringify({event:'CHUNK',content:example.events.map(JSON.stringify).join('')})})+'\n\n';
 assert.deepEqual(await T.call(cfg,example.request,fixture.manifest,{fetch:fake(merged)}),result);
 for(const [label,body,code] of [
  ['truncated',valid.slice(0,-2),'TRUNCATED'],['duplicate',valid+frame(result),'MULTIPLE'],
  ['gateway',valid+'data: {"status":"ERROR","event_status":"CHUNK","content":"ignored"}\n\n','GATEWAY'],
  ['missing final',frame(example.events[0]),'EMPTY'],['progress after final',valid+frame(example.events[0]),'MULTIPLE'],
  ['limit','data: '+ ' '.repeat(4*1024*1024+1),'LIMIT'],
 ])await assert.rejects(T.call(cfg,example.request,fixture.manifest,{fetch:fake(body,{step:16384})}),{code},label);
 await assert.rejects(T.call(cfg,example.request,fixture.manifest,{fetch:fake('',{status:403})}),{code:'AUTH'});
 await assert.rejects(T.call(cfg,example.request,fixture.manifest,{fetch:fake('',{contentType:'text/plain'})}),{code:'CONTENT_TYPE'});
 await assert.rejects(T.call(cfg,example.request,fixture.manifest,{fetch:async()=>new Promise(()=>{}),timeoutMs:10}),{code:'TIMEOUT'});
 let cancelled=false;
 await assert.rejects(T.call(cfg,example.request,fixture.manifest,{timeoutMs:10,fetch:async()=>new Response(new ReadableStream({cancel(){cancelled=true;}}),{headers:{'Content-Type':'text/event-stream'}})}),{code:'TIMEOUT'});
 assert(cancelled,'Timed-out reader cancelled');
 const controller=new AbortController();controller.abort();let calls=0;
 await assert.rejects(T.call(cfg,example.request,fixture.manifest,{signal:controller.signal,fetch:()=>{calls++;}}),{code:'ABORTED'});assert.equal(calls,0);
 const source={metadata:{recordCount:48}};
 for(const opts of [{config:null,manifest:fixture.manifest},{config:cfg,manifest:null}]){
  const session=S.create(source,{...opts,fetch:()=>{calls++;}});await session.send('검색');
  assert.equal(calls,0);assert.equal(session.get().revision,0);assert.equal(session.get().state,null);assert(session.get().messages.at(-1).error);session.destroy();
 }
 let slow=false;
 const session=S.create(source,{config:cfg,manifest:fixture.manifest,timeoutMs:30,fetch:async(url,opts)=>{
  if(slow)return new Promise(()=>{});
  const req=JSON.parse(JSON.parse(opts.body).contents[0]);
  const events=JSON.parse(JSON.stringify(example.events));events.forEach(e=>{
   for(const k of ['request_id','conversation_id','base_revision'])e.data[k]=req[k];
   if(e.event==='answer')e.data.revision=req.base_revision+1;
  });return fake(events.map(frame).join(''),{step:64})(url,opts);
 }});
 await session.send('성공');const committed=session.get();assert.equal(committed.revision,1);
 slow=true;await session.send('시간초과');const failed=session.get();
 assert.deepEqual(failed.state,committed.state);assert.deepEqual(failed.view,committed.view);assert.equal(failed.revision,1);assert.equal(failed.messages.at(-1).code,'TIMEOUT');session.destroy();
 console.log('PASS: branch remote transport POST/config, byte-split/coalesced SSE, final EOF, gateway/duplicate/truncation/limit/HTTP, timeout/abort, no-config/no-manifest block');
}
if(require.main===module)run().catch(e=>{console.error(e);process.exitCode=1;});
module.exports=run;

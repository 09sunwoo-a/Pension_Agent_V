/* Actual Chrome -> existing remote transport -> local bridge -> Google. No saved answers. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const port=Number(process.env.BRANCH_LOCAL_PORT||8766),cdp=Number(process.env.BRANCH_CDP_PORT||9229);
(async()=>{
 const base='http://127.0.0.1:'+port;
 const start=await(await fetch(base+'/validation/status')).json();assert.equal(start.provider,'google-live');
 const targets=await(await fetch('http://127.0.0.1:'+cdp+'/json/list')).json();
 const page=targets.find(t=>t.type==='page');assert(page,'Test Chrome page required');
 const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let seq=0;const pending=new Map(),exceptions=[],checks=[];
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error('CDP')):p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')exceptions.push('BROWSER_EXCEPTION');});
 const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 const run=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error('UI_ASSERTION');return r.result.value;};
 try{
  await call('Runtime.enable');await call('Page.enable');
  await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await call('Page.navigate',{url:base+'/'});
  for(let i=0;i<100;i++){if(await run('!!window.PensionBranchSearchAdapter?.get()'))break;await new Promise(r=>setTimeout(r,100));}
  await run(`(()=>{
   const c=PensionBranchSearchAdapter.get();if(c.session.mode!=='remote')throw Error('REMOTE');c.widget.setOpen(true);
   const app=document.getElementById('pensionAgentDemo');
   const markup=n=>{const z=n.cloneNode(true);z.querySelectorAll('[style]').forEach(x=>{x.style.removeProperty('animation');if(!x.getAttribute('style'))x.removeAttribute('style');});return z.innerHTML;};
   const headers=['.pad-status-pill','.pad-brief-card','.pad-progress-card'];const original=headers.map(s=>markup(app.querySelector(s)));
   const cards=new Map([...app.querySelectorAll('[data-branch-customer-id]')].map(n=>[n.dataset.branchCustomerId,markup(n)]));
   const ids=()=>[...app.querySelectorAll('[data-branch-customer-id]')].map(n=>n.dataset.branchCustomerId);
   const same=(a,b)=>{if(JSON.stringify(a)!==JSON.stringify(b))throw Error('MISMATCH');};
   const tick=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
   const finish=()=>{if(c.widget.getState().streaming)c.widget.element.querySelector('form').dispatchEvent(new Event('submit',{cancelable:true}));};
   window.__branchLive={c,ids,same,tick,finish,original:()=>{headers.forEach((s,i)=>same(markup(app.querySelector(s)),original[i]));app.querySelectorAll('[data-branch-customer-id]').forEach(n=>same(markup(n),cards.get(n.dataset.branchCustomerId)));},
    send:async(text,expected,keep=false,action=null)=>{const list=app.querySelector('[data-branch-list]'),html=list.innerHTML,head=app.querySelector('.pad-section-head'),title=head.textContent;
     const answer=await c.session.send(text,action);if(!answer)throw Error('AGENT');await tick();finish();if(expected)same(ids(),expected);
     if(keep){if(app.querySelector('[data-branch-list]')!==list||list.innerHTML!==html||app.querySelector('.pad-section-head')!==head||head.textContent!==title)throw Error('KEEP');}
     window.__branchLive.original();return {intent:answer.intent,count:answer.result.count,metrics:answer.result.metrics};}
   };return true;
  })()`);
  async function step(id,expression){const value=await run(expression);checks.push({id,status:'PASS'});console.log('PASS: '+id);return value;}
  const rec=['B04-23','B06-13','B01-03'];
  await step('recommend',`__branchLive.send('오늘 우선 관리할 고객 추천해줘',${JSON.stringify(rec)})`);
  await new Promise(r=>setTimeout(r,7100));
  await step('brief',`__branchLive.send('정미경 간단 브리핑',${JSON.stringify(rec)},true,{type:'brief',row_id:'B04-23'})`);
  await new Promise(r=>setTimeout(r,7100));
  const overview=await step('overview-keep',`__branchLive.send('오늘 부점 현황 말해줘',${JSON.stringify(rec)},true)`);
  assert.equal(overview.metrics.find(x=>x.key==='irp_sum').value,5949240000);
  await new Promise(r=>setTimeout(r,7100));
  await step('isa-stat-keep',`__branchLive.send('ISA 만기 고객 몇명이야?',${JSON.stringify(rec)},true)`);
  await step('aggregate-target',`__branchLive.send('대상 고객 보기',['ksy','B01-03','B01-22'],false,{type:'show_aggregate'})`);
  await new Promise(r=>setTimeout(r,7100));
  await step('search',`__branchLive.send('현금성 장기대기 고객 보여줘',['lsm','jmr','jmj','B08-01'])`);
  await new Promise(r=>setTimeout(r,7100));
  await step('add-age',`__branchLive.send('그중 50대 고객만 보여줘',['lsm'])`);
  await new Promise(r=>setTimeout(r,7100));
  await step('add-do',`__branchLive.send('DO 미등록 조건도 추가해줘',['lsm'])`);
  await new Promise(r=>setTimeout(r,7100));
  await step('remove-age',`__branchLive.send('나이 조건 빼줘',['lsm','jmr'])`);
  await step('restore-recommendation',`__branchLive.send('처음 추천 다시 보기',${JSON.stringify(rec)},false,{type:'restore_recommendation'})`);
  await new Promise(r=>setTimeout(r,7100));
  await step('empty',`__branchLive.send('그중 IRP 2억원 이상만',[])`);
  await step('remove-condition-button',`(()=>{const op=__branchLive.c.session.get().state.selection.operations.find(o=>o.type==='filter');return __branchLive.send('잔액 조건 해제',${JSON.stringify(rec)},false,{type:'remove_condition',operation_id:op.id});})()`);
  await new Promise(r=>setTimeout(r,7100));
  // Cancel a real fetch after it starts; no mocked response or business engine is used.
  await step('cancel',`(async()=>{const t=__branchLive,c=t.c,before=c.session.get();const p=c.session.send('오늘 부점 현황 말해줘');await new Promise(r=>setTimeout(r,150));c.widget.element.querySelector('form').dispatchEvent(new Event('submit',{cancelable:true}));await p;t.same(c.session.get().state,before.state);t.same(c.session.get().revision,before.revision);t.same(t.ids(),${JSON.stringify(rec)});return true;})()`);
  await new Promise(r=>setTimeout(r,21000));
  await step('retry',`(async()=>{const t=__branchLive,c=t.c,before=c.session.get(),list=document.querySelector('#pensionAgentDemo [data-branch-list]'),html=list.innerHTML;
   const button=c.widget.element.querySelector('[data-action="retry"]');if(!button)throw Error('RETRY_BUTTON');button.click();
   const deadline=Date.now()+95000;while(c.session.get().busy&&Date.now()<deadline)await new Promise(r=>setTimeout(r,100));
   const after=c.session.get();if(after.busy||after.revision!==before.revision+1||after.messages.at(-1).error)throw Error('RETRY');
   await t.tick();t.finish();t.same(t.ids(),${JSON.stringify(rec)});if(list!==document.querySelector('#pensionAgentDemo [data-branch-list]')||html!==list.innerHTML)throw Error('KEEP');t.original();return true;})()`);
  await step('restore-after-overview',`__branchLive.send('처음 추천 다시 보기',${JSON.stringify(rec)},false,{type:'restore_recommendation'})`);
  await new Promise(r=>setTimeout(r,7100));
  await step('narrow-retirement',`__branchLive.send('그중 퇴직금 운용 미지시 고객만 보여줘',['B06-13'])`);
  await step('new-conversation',`(()=>{const t=__branchLive,b=t.c.session.get();t.c.widget.element.querySelector('[data-action="new"]').click();const n=t.c.session.get();if(n.conversationId===b.conversationId||n.revision!==0)throw Error('NEW');t.same(n.state.selection,b.state.selection);t.same(t.ids(),['B06-13']);return true;})()`);
  await new Promise(r=>setTimeout(r,7100));
  await step('brief-after-new',`__branchLive.send('이 고객 브리핑해줘',['B06-13'],true)`);
  await step('unload-reentry',`(()=>{PG_1288272.onBeforeUnload();if(document.querySelector('.pad-branch-widget'))throw Error('LEAK');PG_1288272.onParam({localPreview:true,fabrix:{xClientUser:'LOCAL_VALIDATION',branch:{endpointUrl:location.origin,agentId:'branch-local',openapiToken:'LOCAL_ONLY',generativeAiClient:'LOCAL_ONLY'}}});if(PensionBranchSearchAdapter.get().session.mode!=='remote'||document.querySelectorAll('.pad-branch-widget').length!==1)throw Error('REENTRY');return true;})()`);
  assert.deepEqual(exceptions,[]);
 }catch(e){checks.push({id:'sequence',status:'FAIL',code:e.message==='UI_ASSERTION'?'UI_ASSERTION':'VALIDATION'});process.exitCode=1;}
 finally{
  const end=await(await fetch(base+'/validation/status')).json();
  const errors=Object.fromEntries(Object.entries(end.errors).map(([k,v])=>[k,v-(start.errors[k]||0)]).filter(([,v])=>v));
  const stages=Object.fromEntries(Object.entries(end.stages).map(([k,v])=>[k,v-(start.stages[k]||0)]));
  const result={mode:'local-ui-google-live',checks,model:end.model,provider_calls:end.calls-start.calls,provider_errors:errors,stages,browser_exceptions:exceptions.length};
  const dir=path.join(__dirname,'.local-results');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'local-ui-google-live.json'),JSON.stringify(result,null,2)+'\n');
  fs.writeFileSync(path.join(dir,'local-ui-google-live-'+Date.now()+'.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result));ws.close();
 }
})().catch(()=>{console.error('FAIL: local live bridge or test Chrome unavailable');process.exitCode=1;});

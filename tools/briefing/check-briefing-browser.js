/* Local UI verification using an already running preview (:8765) and test Chrome CDP (:9229).
 * Node built-ins only. Screenshots stay in the system temp directory, never in the repo. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
(async()=>{
 const targets=await(await fetch('http://127.0.0.1:9229/json/list')).json();
 const page=targets.find(t=>t.type==='page');assert(page,'Start a test Chrome with remote-debugging-port=9229');
 const ws=new WebSocket(page.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 let seq=0;const pending=new Map(),errors=[],dir=fs.mkdtempSync(path.join(os.tmpdir(),'pension-golden-ui-'));
 ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails);});
 const call=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 const run=async expression=>{const r=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 const shot=async name=>{await new Promise(r=>setTimeout(r,1500));const r=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(dir,name+'.png'),Buffer.from(r.data,'base64'));};
 try{
  await call('Runtime.enable');await call('Page.enable');await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await call('Page.navigate',{url:'http://127.0.0.1:8765/'});
  for(let i=0;i<80;i++){if(await run('!!window.PensionBranchSearchAdapter?.get()'))break;await new Promise(r=>setTimeout(r,100));}
  console.log(await run(`(()=>{
   PG_1288272.onBeforeUnload();PG_1288272.onParam({localPreview:true,branchAgentMode:'local',branchSearchLatency:0});
   const app=document.getElementById('pensionAgentDemo'),outer=document.createElement('div'),inner=document.createElement('div');outer.className='pt-perspective';inner.className='pt-page';inner.style.transform='translateX(0)';app.before(outer);outer.append(inner);inner.append(app);
   const c=PensionBranchSearchAdapter.get();c.widget.setOpen(true);
   // The legacy renderer disables replayed entry animations after its first render.
   // Ignore only that transient style while comparing all content and layout attributes.
   const markup=n=>{const copy=n.cloneNode(true);copy.querySelectorAll('[style]').forEach(el=>{el.style.removeProperty('animation');if(!el.getAttribute('style'))el.removeAttribute('style');});return copy.innerHTML;};
   const originalRows=new Map([...app.querySelectorAll('[data-branch-customer-id]')].map(n=>[n.dataset.branchCustomerId,markup(n)]));
   const fixedSelectors=['.pad-status-pill','.pad-brief-card','.pad-progress-card'];
   const originalFixed=fixedSelectors.map(s=>markup(app.querySelector(s)));
   const starts=[...document.querySelectorAll('[data-question]')];if(starts.length!==3||!starts.some(b=>b.textContent.includes('부점 현황')))throw Error('Missing starters');
   window.__branchCheck={
    c,assert:(v,m)=>{if(!v)throw Error(m);},
    original:()=>{
     if(app.querySelector('.pad-branch-controls,.pad-branch-row-footer,.pad-branch-brief,.pad-branch-empty,[data-branch-command]'))throw Error('Unexpected main-screen additions');
     for(const row of app.querySelectorAll('[data-branch-customer-id]'))if(markup(row)!==originalRows.get(row.dataset.branchCustomerId))throw Error('Original customer card changed: '+row.dataset.branchCustomerId);
     fixedSelectors.forEach((s,i)=>{if(markup(app.querySelector(s))!==originalFixed[i])throw Error('Original main header changed: '+s);});
    },
    rows:()=>[...document.querySelectorAll('[data-branch-customer-id]')].map(n=>n.dataset.branchCustomerId),
    tick:()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))),
    finish:()=>{if(c.widget.getState().streaming)document.querySelector('.pad-branch-composer').dispatchEvent(new Event('submit',{cancelable:true}));},
    send:async text=>{const result=await c.session.send(text);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));if(c.widget.getState().streaming)document.querySelector('.pad-branch-composer').dispatchEvent(new Event('submit',{cancelable:true}));return result;}
   };return 'PASS: 3 starters and transformed shell initialization';
  })()`));
  await shot('intro');
  console.log(await run(`(async()=>{const t=__branchCheck,c=t.c;
   const b=document.querySelector('[data-question]');b.click();await t.tick();t.finish();
   t.assert(JSON.stringify(t.rows())===JSON.stringify(['B04-23','B06-13','B01-03']),'Recommendation IDs/order');
   t.assert(document.querySelector('.pad-section-head .pad-h2').textContent==='AI 검색 결과 · 3명','Original search title');t.original();
   const brief=[...document.querySelectorAll('[data-command]')].find(b=>b.textContent.includes('정미경'));
   t.assert(brief,'Briefing action in chat');brief.click();await t.tick();t.finish();
   t.assert(!c.component.state.sel,'Briefing button must not open detail');
   t.assert(c.session.get().messages.at(-1).text.includes('수수료'),'Briefing answer');
   t.assert(t.rows().length===3,'Briefing keeps list');t.original();
   document.querySelector('.pad-section-head').scrollIntoView({block:'start'});return 'PASS: recommendation preserves original cards/header; briefing action stays in chat';
  })()`));
  await shot('recommendation');
  console.log(await run(`(async()=>{const t=__branchCheck,c=t.c;
   const list=document.querySelector('[data-branch-list]'),row=list.firstElementChild;
   await t.send('오늘 부점 현황 말해줘');
   t.assert(document.querySelector('[data-branch-list]')===list&&list.firstElementChild===row,'Overview must not re-render list');
   t.assert(c.session.get().messages.at(-1).text.includes('59억'),'Overview statistics');
   await t.send('ISA 만기 고객 몇명이냐?');t.assert(t.rows().length===3,'Aggregate keeps recommendation');
   const action=[...document.querySelectorAll('[data-command]')].find(b=>b.textContent.includes('대상 고객'));
   t.assert(action,'Aggregate target button');action.click();await t.tick();t.finish();
   t.assert(JSON.stringify(t.rows().slice().sort())===JSON.stringify(['B01-03','B01-22','ksy']),'Target button applies aggregate IDs');
   return 'PASS: overview keeps DOM and aggregate target action selects exactly its customers';
  })()`));
  console.log(await run(`(async()=>{const t=__branchCheck,c=t.c;
   await t.send('현금성 장기대기 고객 보여줘');t.assert(t.rows().length===4,'S-01');
   await t.send('그중 50대 고객만 보여줘');t.assert(t.rows().length===1,'S-02');
   await t.send('DO 미등록 조건도 추가해줘');t.assert(c.session.get().state.conditionChips.length===3,'Three conditions');t.original();
   const input=document.querySelector('.pad-branch-composer textarea');input.value='나이 조건 빼줘';input.dispatchEvent(new Event('input',{bubbles:true}));
   document.querySelector('.pad-branch-composer').dispatchEvent(new Event('submit',{cancelable:true}));await t.tick();t.finish();
   t.assert(JSON.stringify(t.rows())===JSON.stringify(['lsm','jmr']),'Natural-language condition removal');t.original();
   await t.send('DO 미등록 조건도 빼줘');t.assert(t.rows().length===4,'S-05');
   await t.send('오늘 중점적으로 관리할 고객은 누구야?');await t.send('그중 IRP 2억원 이상만');
   t.assert(t.rows().length===0,'Zero result view');t.original();
   const undo=[...document.querySelectorAll('[data-command]')].find(b=>JSON.parse(b.dataset.command).type==='remove');t.assert(undo,'Zero recovery action in chat');undo.click();await t.tick();t.finish();
   t.assert(t.rows().length===3,'Zero recovery');
   await t.send('그중 IRP 잔액 큰 순으로 2명만 보여줘');await t.send('그중 ISA 만기 고객만 보여줘');t.assert(t.rows().length===0,'Top N does not refill');
   await t.send('처음 추천한 고객 다시 보여줘');t.assert(t.rows().length===3,'Restore recommendation');
   t.original();return 'PASS: chat condition removal, zero recovery, Top N subset and recommendation restore';
  })()`));
  console.log(await run(`(async()=>{const t=__branchCheck,c=t.c;
   await t.send('현금 많은 고객');t.assert(c.session.get().state.clarification.kind==='cash','Cash clarification');
   [...document.querySelectorAll('[data-command]')].find(b=>b.textContent==='금액').click();await t.tick();t.finish();
   t.assert(c.session.get().state.clarification.kind==='cash_value','Cash field action');
   await t.send('500만원 이상');t.assert(t.rows().length===11,'Cash filter');t.assert(c.session.get().messages.at(-1).text.includes('17명'),'Unknown amount coverage');
   await t.send('오늘 중점적으로 관리할 고객은 누구야?');await t.send('그중 퇴직금 운용 미지시 고객만 보여줘');
   document.querySelector('[data-action="new"]').click();t.assert(c.session.get().messages.length===0&&t.rows()[0]==='B06-13','New conversation preserves result');
   t.assert(document.querySelector('.pad-branch-context').textContent.includes('1명'),'Context after new conversation');
   await t.send('이 고객 브리핑해줘');t.assert(c.session.get().messages.at(-1).text.includes('신경호'),'Briefing after new conversation');
   document.querySelector('[data-action="restore"]').click();await t.tick();t.assert(t.rows().length===48&&!c.session.get().state.recommendation,'Original list clears recommendation');
   return 'PASS: clarification controls, unknowns and distinct conversation/list resets';
  })()`));
  // Actual row click still opens the original detail; return preserves the AI selection.
  console.log(await run(`(async()=>{const t=__branchCheck,c=t.c;
   await t.send('현금성 장기대기 고객 보여줘');document.querySelector('[data-branch-customer-id="lsm"] .pad-t-15b').click();await t.tick();
   t.assert(c.component.state.sel==='lsm','Original detail click');t.assert(!c.widget.getState().visible,'Widget hidden in detail');
   await new Promise(r=>setTimeout(r,4100));document.querySelector('.pad-nav-btn').click();await t.tick();t.assert(t.rows().length===4&&c.widget.getState().visible,'Return preserves selection');
   return 'PASS: original detail navigation and return';
  })()`));
  await call('Emulation.setDeviceMetricsOverride',{width:1024,height:700,deviceScaleFactor:1,mobile:false});
  console.log(await run(`(async()=>{const t=__branchCheck;t.c.widget.setOpen(true);await t.tick();const panel=document.querySelector('.pad-branch-window'),r=panel.getBoundingClientRect(),body=document.querySelector('.pad-branch-body');t.assert(r.top>=0&&r.bottom<=innerHeight,'Panel viewport bounds');t.assert(body.scrollWidth<=body.clientWidth,'Chat horizontal overflow');return 'PASS: compact viewport and scrolling';})()`));
  await shot('compact');
  console.log(await run(`(async()=>{
   PG_1288272.onBeforeUnload();if(document.querySelector('.pad-branch-widget'))throw Error('Leaked widget');
   PG_1288272.onParam({localPreview:true,branchAgentMode:'local',branchSearchLatency:100});const c=PensionBranchSearchAdapter.get();
   const check=(v,m)=>{if(!v)throw Error(m);};
   const p=c.session.send('오늘 중점적으로 관리할 고객은 누구야?');await Promise.resolve();await Promise.resolve();check(c.busy,'Search skeleton');c.session.cancel();await p;check(!c.busy&&!c.session.get().state.active,'Cancel keeps old list');
   const stat=c.session.send('오늘 부점 현황 말해줘');await Promise.resolve();await Promise.resolve();check(!c.busy,'No list skeleton for statistics');await stat;
   const pending=c.session.send('오늘 중점적으로 관리할 고객은 누구야?');PG_1288272.onBeforeUnload();await pending;check(!document.querySelector('.pad-branch-widget'),'No late widget after unload');
   PG_1288272.onParam({localPreview:true,branchAgentMode:'local',branchSearchLatency:0});check(document.querySelectorAll('.pad-branch-widget').length===1,'Single widget after reentry');
   return 'PASS: intent-aware loading, cancellation, unload and reentry';
  })()`));
  console.log(await run(`(async()=>{
   const check=(v,m)=>{if(!v)throw Error(m);};
   PG_1288272.onBeforeUnload();
   const response=await fetch('/mnbank/app/html/bfe/asstmgt/asst/pensionAgentDemo.js');check(response.ok,'WAS-style JS path');
   new Function('module','exports','require',await response.text())({}, {}, ()=>{throw Error('Unexpected module loader dependency');});
   check(!PensionBranchSearchAdapter.get(),'No automatic initialization during script evaluation');
   PG_1288272.onParam({localPreview:true,branchSearch:false});check(!PensionBranchSearchAdapter.get()&&!document.querySelector('.pad-branch-widget'),'Disabled branch AI');
   check(document.querySelectorAll('[data-branch-customer-id]').length===48,'Original screen without branch AI');
   PG_1288272.onBeforeUnload();
   const sheet=[...document.styleSheets].find(s=>s.href&&s.href.includes('pensionAgentDemo.css'));check(sheet,'WAS-style CSS path');
   const oldCss=document.createElement('style');oldCss.textContent=[...sheet.cssRules].filter(r=>!/pad-branch-|padBranch/.test(r.cssText)).map(r=>r.cssText).join('\\n');document.head.append(oldCss);sheet.disabled=true;
   try{
    PG_1288272.onParam({localPreview:true,branchAgentMode:'local',branchSearchLatency:0});const c=PensionBranchSearchAdapter.get();c.widget.setOpen(true);
    await new Promise(r=>setTimeout(r,200));
    check(document.querySelectorAll('[data-branch-style]').length===1,'Stale CSS fallback injected once');
    check(document.querySelector('.pad-branch-widget').parentElement===document.body,'Widget outside transformed shell');
    const launcher=document.querySelector('.pad-branch-widget .floating_chat'),panel=document.querySelector('.pad-branch-window');
    check(getComputedStyle(panel).position==='fixed'&&launcher.classList.contains('pad-branch-launcher-fallback')&&getComputedStyle(launcher).position==='fixed','Fallback fixed positioning');
    const before=launcher.getBoundingClientRect();window.scrollTo(0,0);await new Promise(r=>requestAnimationFrame(r));window.scrollTo(0,300);await new Promise(r=>requestAnimationFrame(r));
    const after=launcher.getBoundingClientRect(),bounds=panel.getBoundingClientRect();
    check(Math.abs(before.top-after.top)<1&&Math.abs(before.right-after.right)<1,'Launcher fixed while shell scrolls');
    check(bounds.top>=0&&bounds.bottom<=innerHeight&&bounds.left>=0&&bounds.right<=innerWidth,'Fallback panel bounds');
    PG_1288272.onBeforeUnload();check(!document.querySelector('[data-branch-style],.pad-branch-widget'),'Fallback and widget removed on unload');
   }finally{sheet.disabled=false;oldCss.remove();}
   PG_1288272.onParam({localPreview:true,branchAgentMode:'local',branchSearchLatency:0});check(document.querySelectorAll('.pad-branch-widget').length===1,'Single widget after bundle reload');
   return 'PASS: Function loader, onParam-only init, branch AI disabled, old CSS fallback, shell scroll positioning and cleanup';
  })()`));
  await require('../../branch-agent/validation/check_frontend_browser')(run);
  assert.deepEqual(errors,[],'No browser exceptions');console.log('PASS: no browser exceptions. Screenshots: '+dir);
 }finally{ws.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

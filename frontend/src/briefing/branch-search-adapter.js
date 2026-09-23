/* Additive integration with the CURRENT main list of frontend/briefing-fabrix.
 * No fixed cohort and no replacement row renderer: a query only chooses which
 * original rows are shown, and in what order.
 */
(function(root){'use strict';
const C=root.PensionBranchSearchCore;let current=null;
const EXPORT_DELAY_MS=3000; // 엑셀 내려받기 전 '정리 중' 표시 시간
function fullView(component,render){
 const saved=component.state;
 // renderVals is evaluated synchronously. Do not emit a state update or modify
 // existing filters merely to read the unfiltered source population.
 component.state=Object.assign({},saved,{sel:null,filter:'all'});
 try{return render.call(component);}finally{component.state=saved;}
}
function mount(component,params){
 destroy();params=params||{};if(params.branchSearch===false)return;
 const app=document.getElementById('pensionAgentDemo');if(!app)return;
 const render=component.renderVals,initial=fullView(component,render);
 const source=root.PensionBranchCurrentData.fromCurrentRows(initial.queue,root.PensionBriefingFixtures,component.DATA,c=>component.profileOf(c));
 if(!source.records.length){console.error('[Branch AI] Current main list empty. No fallback cohort used.');return;}
 // Local calculation is opt-in for regression/demo use; remote failures never fall back to it.
 const local=params.branchAgentMode==='local';
 const latency=params.branchSearchLatency==null?6000:Math.max(0,Number(params.branchSearchLatency)||0);
 const engine=local?root.PensionBranchConversation.create(source):null;
 function checkManifest(manifest){
  const ids=fullView(component,render).queue.map(r=>r.id);
  if(!manifest||JSON.stringify(manifest)!==JSON.stringify(root.PensionBranchDataManifest)||JSON.stringify(ids)!==JSON.stringify(manifest.row_ids)){
   const error=new Error('MANIFEST');error.code='MANIFEST';throw error;
  }
 }
 const session=root.PensionBranchSearchSession.create(source,local?{mode:'local',engine,latency}:{
  config:root.PensionBranchAgentTransport.settings(params,root.__PENSION_FABRIX_CONFIG),
  manifest:root.PensionBranchDataManifest,checkManifest,
  isCurrent:()=>current&&current.component===component&&!component.state.sel,
  prepareAnswer:(_answer,manifest)=>checkManifest(manifest)
 });
 // 엑셀 추출 시트에 남기는 추출 직원(사번). 로컬 모드는 연결 설정이 없다.
 let staff='';try{staff=local?'':String(root.PensionBranchAgentTransport.settings(params,root.__PENSION_FABRIX_CONFIG).xClientUser||'');}catch(_){staff='';}
 params=null;
 const motion=root.PensionBranchMotion.create();
 const ctx={component,app,source,session,engine,motion,applied:false,pending:false,busy:false,before:new Map(),oldRender:render,lastSelected:null};current=ctx;
 // Capture before the legacy row handlers; CSS also removes hidden controls from keyboard navigation.
 ctx.blockBusyRow=e=>{if(ctx.busy&&e.target.closest('[data-branch-list]')){e.preventDefault();e.stopImmediatePropagation();}};
 app.addEventListener('click',ctx.blockBusyRow,true);app.addEventListener('keydown',ctx.blockBusyRow,true);
 // Back to the original list: the 전체 chip, the KPI cards and the chat's 기존 목록 button all end the search mode.
 function restore(keepFilter){ctx.keepFilter=keepFilter===true;try{session.reset();}finally{ctx.keepFilter=false;}}
 // The Starroot shell renders the page inside a transformed .pt-page; position:fixed only works from document.body.
 // 대화창의 "엑셀로 내려받고 싶어" 류 요청: Agent 를 부르지 않고 지금 화면에 보이는 고객 목록(AI 검색 결과 또는 필터)을 그대로 xlsx 로 만든다.
 function exportRequest(text){
  const X=root.PensionExport;if(!X||!X.isExportRequest(text))return false;
  let vals;try{vals=component.renderVals();}catch(_){return false;}
  const byId=new Map(source.records.map(r=>[r.briefingMeta.caseId,r])),models=new Map((component.DATA||[]).map(d=>[d.id,d]));
  const items=(vals.queue||[]).filter(r=>r.id&&byId.has(r.id)).map(r=>{let profile={};try{profile=component.profileOf(models.get(r.id)||{})||{};}catch(_){}return {record:byId.get(r.id),profile};});
  if(!items.length){session.note(text,'내려받을 고객이 없어요. 먼저 대화로 고객을 좁히거나 전체 목록으로 돌아간 뒤 다시 요청해 주세요.');return true;}
  const snap=session.get(),v=snap.view,s=snap.state||{};
  const condition=ctx.applied?((v?v.contextLabel:s.contextLabel)||'AI 검색 결과'):(vals.subChipOn?String(vals.subChipLabel):'전체 고객');
  const scope=(ctx.applied?'부점 AI 검색 결과':'메인 고객 목록')+' · '+source.metadata.scopeLabel;
  // Agent 응답처럼 보이도록 3초간 '정리 중' 상태를 보여준 뒤 파일을 만들고 내려받는다.
  session.note(text,()=>{
   try{
    const out=X.build({items,asOf:source.metadata.asOfDate,staff,condition,scope});
    X.download(out);
    return '현재 목록 '+out.count+'명을 '+out.fileName+' 파일로 내려받았어요. (조건: '+condition+') 파일의 「추출 조건」 시트에 기준일·조건을 함께 남겼습니다.';
   }catch(e){
    if(typeof console!=='undefined')console.warn('[Branch AI] export failed: '+(e&&e.message));
    return '엑셀 파일을 만들지 못했어요. 브라우저 다운로드가 허용되어 있는지 확인한 뒤 다시 시도해 주세요.';
   }
  },{pendingText:'고객 '+items.length+'명의 명세를 정리하고 있어요.',delayMs:EXPORT_DELAY_MS});
  return true;
 }
 ctx.restore=restore;ctx.widget=root.PensionBranchSearchWidget.mount(document.body,session,{onRestore:restore,intercept:exportRequest});
 ctx.off=session.subscribe(e=>{
  // Waiting only patches the header/list styles, preserving the current DOM and focus.
  // wait: any request in flight (header donut + progress bar only, rows untouched). busy: the list itself will change (skeleton).
  // Interpretation is the long phase on a remote Agent, so the header shows activity from send until the answer.
  if(e.type==='pending'){ctx.wait=e.mode==='remote';ctx.busy=ctx.wait&&!!e.listGuess;if(ctx.busy)motion.cancel();paintBusy(ctx);return;}
  if(e.type==='resolved'){ctx.busy=e.listChange;if(ctx.busy)motion.cancel();paintBusy(ctx);return;}
  if(e.type==='progress'){if(e.listChange){ctx.busy=true;motion.cancel();paintBusy(ctx);}return;}
  if(e.type==='apply'){ctx.applied=e.view?e.view.active:!!e.state.active;ctx.pending=true;ctx.busy=false;ctx.wait=false;const update={branchSearchRevision:e.revision};if(!ctx.keepFilter)update.filter='all';component.setState(update);return;}
  if((ctx.busy||ctx.wait)&&(e.type==='answer'||e.type==='error'||e.type==='cancel')){ctx.busy=false;ctx.wait=false;paintBusy(ctx);}
 });
 component.renderVals=function(){
  const base=ctx.oldRender.apply(this,arguments);
  // Wrap even before the first AI result so original filters invalidate pending requests.
  for(const k of ['filterAll','kNewTap','kOnTap','kResTap','filterNew','filterIsa']){const fn=base[k];if(typeof fn==='function')base[k]=()=>{restore(true);fn();};}
  if(!ctx.applied||this.state.sel)return base;
  // Always reuse original row objects/handlers, including badges and tax rings.
  // The query chooses IDs and their order; it never builds an alternative row.
  const all=fullView(this,ctx.oldRender),rows=new Map((all.queue||[]).filter(r=>r.id).map(r=>[r.id,r]));
  const snapshot=session.get(),ids=snapshot.view?snapshot.view.rowIds:snapshot.state.mainListCaseIds;
  base.queue=ids.map(id=>{if(!rows.has(id))throw new Error('Current original row disappeared');return Object.assign({},rows.get(id),{anim:'none'});});
  base.queueTotal=ids.length;
  return base;
 };
}
function paintBusy(c){
 const list=c.app.querySelector('[data-branch-list]'),head=c.app.querySelector('.pad-section-head'),title=head&&head.querySelector('.pad-h2');
 if(list){
  list.classList.toggle('pad-branch-list--busy',c.busy);list.setAttribute('aria-busy',String(c.busy));
  list.setAttribute('aria-hidden',String(c.busy));
  const rows=list.querySelectorAll('.pad-queue-item');
  rows.forEach(row=>{const r=row.getBoundingClientRect();row.classList.toggle('pad-branch-skeleton-active',c.busy&&r.bottom>0&&r.top<root.innerHeight);});
  // An empty result still needs a visible loading state on the next query.
  if(c.busy&&!rows.length&&!list.querySelector('.pad-branch-skeleton-empty')){
   const empty=document.createElement('div');empty.className='pad-branch-skeleton-empty';
   for(let i=0;i<3;i++){const card=document.createElement('div');card.className='pad-branch-skeleton-card pad-branch-skeleton-active';empty.appendChild(card);}list.appendChild(empty);
  }
  if(!c.busy)list.querySelectorAll('.pad-branch-skeleton-empty').forEach(n=>n.remove());
 }
 if(!head||!title)return;
 head.classList.add('pad-branch-list-head');
 if(!c.busy&&!c.wait){head.querySelectorAll('.pad-branch-query-state,.pad-branch-progress').forEach(n=>n.remove());return;}
 if(!title.querySelector('.pad-branch-query-state')){
  const status=document.createElement('span');status.className='pad-branch-query-state';status.setAttribute('role','status');
  const label=document.createElement('span');label.className='pad-branch-sr-only';label.textContent='고객 목록 조회 중';status.appendChild(label);
  const donut=document.createElement('span');donut.className='pad-branch-query-donut';donut.setAttribute('aria-hidden','true');status.appendChild(donut);title.appendChild(status);
 }
 if(!head.querySelector('.pad-branch-progress')){const progress=document.createElement('span');progress.className='pad-branch-progress';progress.setAttribute('aria-hidden','true');head.appendChild(progress);}
}
function beforeRender(component){const c=current;if(c&&c.component===component){if(c.pending)c.before=c.motion.capture(c.app);c.motion.cancel();}}
function afterRender(component){
 const c=current;if(!c||c.component!==component)return;
 const selected=component.state.sel;
 if(selected&&c.lastSelected!==selected)c.session.cancel('상세화면 이동으로 진행 중인 조회를 취소했습니다.');
 c.lastSelected=selected;c.widget.setVisible(!selected);
 if(selected){c.pending=false;c.motion.cancel();return;}
 const list=c.app.querySelector('[data-branch-list]');
 if(c.applied){
  // Preserve the original customer cards; new context and actions belong in chat.
  const snapshot=c.session.get(),s=snapshot.state,v=snapshot.view;
  const title=c.app.querySelector('.pad-section-head .pad-h2');if(title)title.textContent='AI 검색 결과 · '+(v?v.rowIds.length:s.mainListCaseIds.length)+'명';
  const order=c.app.querySelector('.pad-section-head > .pad-rowb > .pad-t-12-muted');
  if(order)order.textContent=v?remoteSortLabel(v.sort):C.sortLabel(s.main.sort);
 }
 paintBusy(c);
 if(c.pending&&list)c.motion.play(c.app,c.before,true);c.pending=false;
}
function remoteSortLabel(sort){
 const names={recommendation_order:'추천순',source_order:'기존 순서',age:'나이',irp_amount:'IRP 잔액',cash_amount:'현금성자산',cash_pct:'현금 비중',return_pct:'수익률'};
 return (names[sort.field]||'조회 순서')+(['recommendation_order','source_order'].includes(sort.field)?'':sort.direction==='asc'?' 낮은 순':' 높은 순');
}
function destroy(){const c=current;if(!c)return;current=null;c.off();c.widget.destroy();c.session.destroy();c.motion.cancel();c.busy=false;paintBusy(c);c.app.removeEventListener('click',c.blockBusyRow,true);c.app.removeEventListener('keydown',c.blockBusyRow,true);c.component.renderVals=c.oldRender;}
root.PensionBranchSearchAdapter={mount,beforeRender,afterRender,destroy,get:()=>current,disable:()=>current&&current.restore(),fullView};
})(window);

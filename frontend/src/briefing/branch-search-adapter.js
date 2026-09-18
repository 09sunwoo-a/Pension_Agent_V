/* v0.3: additive integration with frontend/briefing-fabrix's CURRENT main list.
 * No fixed cohort; no legacy standalone HTML; no replacement customer renderer.
 */
(function(root){'use strict';
const C=root.PensionBranchSearchCore;let current=null;
function fullView(component,render){
 const saved=component.state;
 // renderVals is evaluated synchronously. Do not emit a state update or modify
 // existing filters merely to read the unfiltered source population.
 component.state=Object.assign({},saved,{sel:null,filter:'all',extA:null});
 try{return render.call(component);}finally{component.state=saved;}
}
function mount(component,params){
 destroy();params=params||{};if(params.branchSearch===false)return;
 const app=document.getElementById('pensionAgentDemo');if(!app)return;
 const render=component.renderVals,initial=fullView(component,render);
 const source=root.PensionBranchCurrentData.fromCurrentRows(initial.queue,root.PensionBriefingFixtures,component.DATA,c=>component.profileOf(c));
 if(!source.records.length){console.error('[Branch AI] Current main list empty. No fallback cohort used.');return;}
 const session=root.PensionBranchSearchSession.create(source,{provider:root.PensionBranchCurrentProvider.create(source)});
 const motion=root.PensionBranchMotion.create();
 const ctx={component,app,source,session,motion,applied:false,pending:false,before:new Map(),rows:new Map(),oldRender:render,lastSelected:null,legacySnapshot:null};current=ctx;
 function restore(){session.cancel();session.clearReference();ctx.applied=false;ctx.pending=true;component.setState(Object.assign({},ctx.legacySnapshot||{filter:'all',extA:null,extOpen:false},{branchSearchRevision:session.get().revision+1}));}
 function reveal(){const list=app.querySelector('[data-branch-list]');if(list){list.scrollIntoView({behavior:motion.reduced()?'auto':'smooth',block:'start'});list.classList.add('pad-branch-reveal');setTimeout(()=>list.classList.remove('pad-branch-reveal'),800);}}
 // The Starroot shell renders the page inside a transformed .pt-page; position:fixed only works from document.body.
 ctx.restore=restore;ctx.widget=root.PensionBranchSearchWidget.mount(document.body,session,{enabled:true,onRestore:restore,onReveal:reveal});
 ctx.off=session.subscribe(e=>{
  if(e.type==='apply'){
   if(!ctx.applied)ctx.legacySnapshot=C.copy({filter:component.state.filter,ext:component.state.ext||null,extA:component.state.extA||null,extOpen:!!component.state.extOpen});
   ctx.applied=true;ctx.pending=true;component.setState({branchSearchRevision:e.revision,filter:'all',extA:null,extOpen:false});
  }else{const status=app.querySelector('.pad-branch-list-status');if(status)status.textContent=e.busy?'고객 조회 중… 기존 목록을 유지합니다.':'';}
 });
 component.renderVals=function(){
  const base=ctx.oldRender.apply(this,arguments);
  if(!ctx.applied||this.state.sel)return base;
  // Always reuse original row objects/handlers, including badges and tax rings.
  // The query chooses IDs and their order; it never builds an alternative row.
  const all=fullView(this,ctx.oldRender),rows=new Map((all.queue||[]).filter(r=>r.id).map(r=>[r.id,r]));
  const s=session.get().state;
  base.queue=s.mainListCaseIds.map(id=>{if(!rows.has(id))throw new Error('Current original row disappeared: '+id);return Object.assign({},rows.get(id),{anim:'none'});});
  base.queueTotal=s.mainMatchedCount;base.extOn=false;
  base.filterAll=()=>session.reset();base.extClear=()=>session.reset();
  base.extApply=()=>{session.apply(root.PensionBranchPreserveUI.manual(session,component.state.ext),'기존 조건 추출의 조건을 현재 검색에 반영했습니다.');component.setState({extOpen:false,extA:null,filter:'all'});};
  if(component.state.ext){const p=root.PensionBranchPreserveUI.manual(session,component.state.ext);base.extPreviewN=C.run(session.records(),p.query,p.sort,p.limit).resultPreviewCount;}
  for(const k of ['kNewTap','kOnTap','kResTap','filterNew','filterIsa']){const fn=base[k];if(typeof fn==='function')base[k]=()=>{restore();fn();};}
  return base;
 };
}
function beforeRender(component){const c=current;if(c&&c.component===component&&c.pending)c.before=c.motion.capture(c.app);}
function afterRender(component){
 const c=current;if(!c||c.component!==component)return;
 const selected=component.state.sel;
 if(selected&&c.lastSelected!==selected)c.session.cancel('상세화면 이동으로 진행 중인 조회를 취소했습니다.');
 c.lastSelected=selected;c.widget.setVisible(!selected);
 if(selected){c.pending=false;return;}
 c.app.querySelectorAll('.pad-branch-resultbar,.pad-branch-empty').forEach(n=>n.remove());
 const list=c.app.querySelector('[data-branch-list]');
 if(c.applied&&list){
  list.parentNode.insertBefore(root.PensionBranchPreserveUI.bar(c.session,c.restore),list);
  const title=c.app.querySelector('.pad-section-head .pad-h2');if(title)title.textContent='AI 검색 결과 · '+c.session.get().state.mainMatchedCount+'명';
  const order=c.app.querySelector('.pad-section-head > .pad-rowb > .pad-t-12-muted');if(order)order.textContent=C.sortLabel(c.session.get().state.main.sort);
  if(!c.session.get().state.mainListCaseIds.length){const n=document.createElement('div');n.className='pad-branch-empty';n.textContent='조건에 맞는 고객이 없습니다. 입력한 조건은 유지했습니다.';list.appendChild(n);}
 }
 if(c.pending&&list)c.motion.play(c.app,c.before,true);c.pending=false;
}
function destroy(){const c=current;if(!c)return;current=null;c.off();c.widget.destroy();c.session.destroy();c.motion.cancel();c.component.renderVals=c.oldRender;}
root.PensionBranchSearchAdapter={mount,beforeRender,afterRender,destroy,get:()=>current,disable:()=>current&&current.restore(),fullView};
})(window);

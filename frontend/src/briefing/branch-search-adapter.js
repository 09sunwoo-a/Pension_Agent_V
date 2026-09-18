/* Additive integration with the CURRENT main list of frontend/briefing-fabrix.
 * No fixed cohort and no replacement row renderer: a query only chooses which
 * original rows are shown, and in what order.
 */
(function(root){'use strict';
const C=root.PensionBranchSearchCore;let current=null;
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
 // Every answer that resolves a customer set (extract or aggregate) is applied to the list at once.
 // The mock answers instantly, so a thinking time (default 2s, onParam({ branchSearchLatency: ms })) keeps the waiting UI visible.
 const latency=params.branchSearchLatency==null?2000:Math.max(0,Number(params.branchSearchLatency)||0);
 const session=root.PensionBranchSearchSession.create(source,{provider:root.PensionBranchCurrentProvider.create(source),applyAggregate:true,latency});
 const motion=root.PensionBranchMotion.create();
 const ctx={component,app,source,session,motion,applied:false,pending:false,busy:false,flash:false,before:new Map(),oldRender:render,lastSelected:null};current=ctx;
 // Back to the original list: the 전체 chip, the KPI cards and the chat's 기존 목록 button all end the search mode.
 function restore(){session.cancel();session.clearReference();ctx.applied=false;ctx.pending=true;component.setState({filter:'all',branchSearchRevision:session.get().revision+1});}
 // The Starroot shell renders the page inside a transformed .pt-page; position:fixed only works from document.body.
 ctx.restore=restore;ctx.widget=root.PensionBranchSearchWidget.mount(document.body,session,{onRestore:restore});
 ctx.off=session.subscribe(e=>{
  // pending: dim the list under a loading pill; apply: new rows plus a short 'updated' cue on the title.
  if(e.type==='pending'){ctx.busy=true;component.setState({branchSearchBusy:true});return;}
  if(e.type==='apply'){ctx.applied=true;ctx.pending=true;ctx.busy=false;ctx.flash=true;component.setState({branchSearchRevision:e.revision,branchSearchBusy:false,filter:'all'});return;}
  if(ctx.busy&&(e.type==='answer'||e.type==='error'||e.type==='cancel')){ctx.busy=false;component.setState({branchSearchBusy:false});}
 });
 component.renderVals=function(){
  const base=ctx.oldRender.apply(this,arguments);
  if(!ctx.applied||this.state.sel)return base;
  // Always reuse original row objects/handlers, including badges and tax rings.
  // The query chooses IDs and their order; it never builds an alternative row.
  const all=fullView(this,ctx.oldRender),rows=new Map((all.queue||[]).filter(r=>r.id).map(r=>[r.id,r]));
  const s=session.get().state;
  base.queue=s.mainListCaseIds.map(id=>{if(!rows.has(id))throw new Error('Current original row disappeared: '+id);return Object.assign({},rows.get(id),{anim:'none'});});
  base.queueTotal=s.mainListCaseIds.length;
  base.filterAll=restore;
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
 const list=c.app.querySelector('[data-branch-list]');
 if(list){
  list.classList.toggle('pad-branch-list--busy',!!c.busy);
  if(c.busy&&!list.querySelector('.pad-branch-loading')){const o=document.createElement('div');o.className='pad-branch-loading';o.setAttribute('role','status');o.innerHTML='<div class="pad-branch-loading__pill"><span class="pad-spinner"></span><span class="pad-branch-loading__msg">부점 AI가 고객을 조회하고 있어요</span></div>';list.prepend(o);}
 }
 if(c.applied){
  // Search mode changes only the list title and its order label. No extra bar, chips or notes.
  const s=c.session.get().state;
  const title=c.app.querySelector('.pad-section-head .pad-h2');if(title)title.textContent='AI 검색 결과 · '+s.mainListCaseIds.length+'명';
  const order=c.app.querySelector('.pad-section-head > .pad-rowb > .pad-t-12-muted');if(order)order.textContent=C.sortLabel(s.main.sort);
  if(c.flash&&title){c.flash=false;title.classList.add('pad-branch-updated');const tag=document.createElement('span');tag.className='pad-branch-updated-tag';tag.textContent='방금 갱신';title.appendChild(tag);setTimeout(()=>{tag.remove();title.classList.remove('pad-branch-updated');},2600);}
 }
 if(c.pending&&list)c.motion.play(c.app,c.before,true);c.pending=false;
}
function destroy(){const c=current;if(!c)return;current=null;c.off();c.widget.destroy();c.session.destroy();c.motion.cancel();c.component.renderVals=c.oldRender;}
root.PensionBranchSearchAdapter={mount,beforeRender,afterRender,destroy,get:()=>current,disable:()=>current&&current.restore(),fullView};
})(window);

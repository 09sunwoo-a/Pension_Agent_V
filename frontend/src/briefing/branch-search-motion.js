/* In-place result reveal. No row translation, cloned ghosts or viewport-positioned layers. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.PensionBranchMotion=factory();})(typeof window==='undefined'?globalThis:window,function(){
'use strict';
function create(win){
 win=win||window;let cleanups=[],timer=null;
 const reduced=()=>!!(win.matchMedia&&win.matchMedia('(prefers-reduced-motion: reduce)').matches);
 function cancel(){win.clearTimeout(timer);timer=null;cleanups.forEach(fn=>fn());cleanups=[];}
 function capture(root){
  const out=new Map();if(!root)return out;
  root.querySelectorAll('[data-branch-customer-id]').forEach(el=>{
   const id=el.getAttribute('data-branch-customer-id');if(id)out.set(id,true);
  });return out;
 }
 function play(root,before,changed){
  cancel();if(!changed||reduced()||!root)return;
  const title=root.querySelector('.pad-section-head .pad-h2');
  if(title){title.classList.add('pad-branch-result-pulse');cleanups.push(()=>title.classList.remove('pad-branch-result-pulse'));}
  const rows=Array.from(root.querySelectorAll('[data-branch-customer-id]'));
  // A sort-only or identical result receives the title cue, without replaying card entry.
  const membershipChanged=before.size!==rows.length||rows.some(el=>!before.has(el.getAttribute('data-branch-customer-id')));
  let visibleIndex=0;
  if(membershipChanged)rows.forEach(el=>{
   const rect=el.getBoundingClientRect();
   if(!rect.width||!rect.height||rect.bottom<=0||rect.top>=win.innerHeight)return;
   const id=el.getAttribute('data-branch-customer-id'),delay=Math.min(visibleIndex++,3)*50;
   const previous=el.style.animation;
   // Preserve the existing dimmed appearance of completed customers.
   el.style.setProperty('--pad-branch-row-opacity',el.style.opacity||'1');
   el.style.animation='padBranchResultReveal 900ms cubic-bezier(.4,0,.2,1) '+delay+'ms both';
   if(!before.has(id)){
    el.style.setProperty('--pad-branch-border-delay',(delay+250)+'ms');
    el.classList.add('pad-branch-customer-arrival');
   }
   cleanups.push(()=>{el.style.animation=previous;el.style.removeProperty('--pad-branch-row-opacity');el.style.removeProperty('--pad-branch-border-delay');el.classList.remove('pad-branch-customer-arrival');});
  });
  // Last card: 150ms stagger + 250ms border delay + 900ms glow; clean up after it finishes.
  timer=win.setTimeout(cancel,1400);
 }
 return {capture,play,cancel,reduced};
}
return {create};
});

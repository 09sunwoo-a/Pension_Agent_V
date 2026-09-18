/* FLIP-like position transition; also supports hosts replacing every row DOM node. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.PensionBranchMotion=factory();})(typeof window==='undefined'?globalThis:window,function(){
'use strict';
function create(win){
 win=win||window;let running=[],ghosts=[],timer=null,generation=0;
 const reduced=()=>!!(win.matchMedia&&win.matchMedia('(prefers-reduced-motion: reduce)').matches);
 function cancel(){generation++;running.forEach(a=>{try{a.cancel();}catch(_){}});running=[];ghosts.forEach(n=>n.remove());ghosts=[];clearTimeout(timer);}
 function capture(root){
  const out=new Map();if(!root)return out;
  root.querySelectorAll('[data-branch-customer-id]').forEach(el=>{
   const id=el.getAttribute('data-branch-customer-id');const rect=el.getBoundingClientRect();
   if(id&&rect.width&&rect.height)out.set(id,{rect,clone:el.cloneNode(true)});
  });return out;
 }
 function play(root,before,changed){
  cancel();if(!changed||reduced()||!root)return;
  const now=new Map();root.querySelectorAll('[data-branch-customer-id]').forEach(el=>now.set(el.getAttribute('data-branch-customer-id'),el));
  const beforeIds=Array.from(before.keys()),afterIds=Array.from(now.keys());
  if(JSON.stringify(beforeIds)===JSON.stringify(afterIds))return;
  let entered=0;
  now.forEach((el,id)=>{
   const current=el.getBoundingClientRect(),old=before.get(id);let frames;
   if(old){const dx=old.rect.left-current.left,dy=old.rect.top-current.top;if(Math.abs(dx)<1&&Math.abs(dy)<1)return;frames=[{transform:'translate('+dx+'px,'+dy+'px)',opacity:1},{transform:'translate(0,0)',opacity:1}];}
   else frames=[{transform:'translateY(10px)',opacity:0},{transform:'translateY(0)',opacity:1}];
   if(typeof el.animate==='function')running.push(el.animate(frames,{duration:old?280:190,delay:old?0:Math.min(entered++*22,88),easing:'cubic-bezier(.2,.7,.2,1)',fill:'none'}));
  });
  before.forEach((old,id)=>{
   if(now.has(id)||old.rect.bottom<0||old.rect.top>win.innerHeight)return;
   const ghost=old.clone;ghost.removeAttribute('id');ghost.removeAttribute('data-branch-customer-id');ghost.setAttribute('aria-hidden','true');ghost.inert=true;
   ghost.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));
   Object.assign(ghost.style,{position:'fixed',left:old.rect.left+'px',top:old.rect.top+'px',width:old.rect.width+'px',height:old.rect.height+'px',margin:'0',pointerEvents:'none',zIndex:'25',boxSizing:'border-box',animation:'none'});
   ghost.classList.add('pad-branch-row-ghost');root.appendChild(ghost);ghosts.push(ghost);
   if(typeof ghost.animate==='function')running.push(ghost.animate([{opacity:.65,transform:'translateY(0)'},{opacity:0,transform:'translateY(-5px)'}],{duration:160,fill:'forwards',easing:'ease-out'}));
  });
  timer=setTimeout(()=>{ghosts.forEach(n=>n.remove());ghosts=[];running=[];},480);
 }
 return {capture,play,cancel,reduced};
}
return {create};
});

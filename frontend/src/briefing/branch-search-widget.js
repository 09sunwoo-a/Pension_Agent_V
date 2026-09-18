/* Non-modal floating chat widget. Mounted on document.body (outside the shell's transformed .pt-page and the
 * legacy full-render mount) so position:fixed is viewport-relative; removed again on destroy. */
(function(root){'use strict';
const C=root.PensionBranchSearchCore;
const svg=(path)=>'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+path+'</svg>';
const icons={chat:svg('<path d="M20 11.5a8 8 0 0 1-8 8H5l-3 2V11.5a9 9 0 0 1 18 0Z"/><path d="M7 10h8M7 14h5"/>'),arrow:svg('<path d="m5 12 7-7 7 7M12 5v15"/>'),minus:svg('<path d="M5 12h14"/>'),reset:svg('<path d="M3 10a9 9 0 1 1 1.5 7M3 4v6h6"/>'),spark:svg('<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/>')};
function mount(container,session,options){
 options=options||{};let open=false,visible=true,disposed=false,composing=false,examplesOpen=false;
 const rootEl=document.createElement('div');rootEl.className='pad-branch-widget';rootEl.setAttribute('data-branch-widget','');
 rootEl.innerHTML='<div class="pad-branch-window" id="pad-branch-window" role="dialog" aria-modal="false" aria-label="부점 AI 고객 검색" hidden>'+
 '<div class="pad-branch-header"><div class="pad-branch-avatar">'+icons.spark+'</div><div class="pad-branch-heading"><strong>부점 AI</strong></div><button type="button" class="pad-branch-icon" data-action="new" title="새 대화 · 목록 유지" aria-label="새 대화">'+icons.reset+'</button><button type="button" class="pad-branch-icon" data-action="close" aria-label="대화창 최소화">'+icons.minus+'</button></div>'+
 '<div class="pad-branch-context" hidden></div>'+
 '<div class="pad-branch-body" data-branch-scroll><div class="pad-branch-welcome"><div class="pad-branch-welcome-title">어떤 고객을 찾으시나요?</div><div class="pad-branch-suggestions"><button type="button" data-question="overview">IRP 고객 현황<span>↗</span></button><button type="button" data-question="cash">납입금 미운용 고객<span>↗</span></button><button type="button" data-question="do">DO 실행 예정 고객<span>↗</span></button></div></div><div class="pad-branch-messages" role="log" aria-live="polite" aria-relevant="additions text" aria-label="부점 AI 대화"></div></div>'+
 '<div class="pad-branch-examples" hidden></div>'+
 '<div class="pad-branch-footer"><div class="pad-branch-tools"><button type="button" data-action="examples" aria-expanded="false">예시 질문</button><button type="button" data-action="restore" title="검색 결과를 해제하고 기존 목록으로">기존 목록</button></div><form class="pad-branch-composer"><textarea rows="1" maxlength="1200" aria-label="찾고 싶은 고객 조건" placeholder="찾고 싶은 고객 조건을 입력하세요"></textarea><button type="submit" aria-label="질문 전송" class="pad-branch-send" disabled>'+icons.arrow+'</button></form><div class="pad-branch-disclaimer">확인된 데이터만 조회해요.</div></div></div>'+
 '<button type="button" class="pad-branch-launcher" aria-label="부점 AI 열기" aria-controls="pad-branch-window" aria-expanded="false">'+icons.chat+'<span>부점 AI</span></button>';
 container.appendChild(rootEl);
 // Fallback for a stale or partially deployed pensionAgentDemo.css: if the launcher is not positioned by the
 // page stylesheet, inject the bundled copy of branch-search.css once (removed again on destroy).
 let styleEl=null;
 if(root.PensionBranchSearchStyles&&getComputedStyle(rootEl.querySelector('.pad-branch-launcher')).position!=='fixed'){styleEl=document.createElement('style');styleEl.setAttribute('data-branch-style','');styleEl.textContent=root.PensionBranchSearchStyles;(document.head||document.body).appendChild(styleEl);console.warn('[Branch AI] pensionAgentDemo.css has no .pad-branch-* rules (old file or cache); using the bundled copy.');}
 const find=s=>rootEl.querySelector(s),panel=find('.pad-branch-window'),launcher=find('.pad-branch-launcher'),input=find('textarea'),sendBtn=find('.pad-branch-send'),body=find('.pad-branch-body'),log=find('.pad-branch-messages');
 const welcome=find('.pad-branch-welcome'),context=find('.pad-branch-context'),examples=find('.pad-branch-examples');
 const nodes=new Map();let lastMessageIds='',current=session.get();
 function refreshDraft(){sendBtn.disabled=!input.value.trim();input.style.height='auto';input.style.height=Math.min(input.scrollHeight,92)+'px';}
 input.addEventListener('input',refreshDraft);
 input.addEventListener('compositionstart',()=>{composing=true;});input.addEventListener('compositionend',()=>{composing=false;refreshDraft();});
 input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing&&!composing&&e.keyCode!==229){e.preventDefault();submit();}});
 find('form').addEventListener('submit',e=>{e.preventDefault();if(!composing)submit();});
 function submit(text){const q=text===undefined?input.value:text;if(!q.trim())return;input.value='';refreshDraft();examplesOpen=false;examples.hidden=true;find('[data-action="examples"]').setAttribute('aria-expanded','false');session.send(q);}
 function setOpen(value,focus){open=value;panel.hidden=!open;launcher.setAttribute('aria-expanded',String(open));launcher.setAttribute('aria-label',open?'부점 AI 최소화':'부점 AI 열기');launcher.classList.toggle('is-open',open);if(open&&focus!==false)setTimeout(()=>{if(!disposed&&open&&visible)input.focus({preventScroll:true});},80);if(!open&&focus!==false)launcher.focus({preventScroll:true});}
 launcher.addEventListener('click',()=>setOpen(!open));
 // Example questions: the reviewed utterances only, no recipe ids.
 C.questions.forEach(([id,q])=>{const b=document.createElement('button');b.type='button';b.dataset.example=id;b.textContent=q;examples.appendChild(b);});
 function systemStatus(text){const n=document.createElement('div');n.className='pad-branch-system';n.textContent=text;log.appendChild(n);}
 function sync(e){
  if(disposed)return;current=e;
  context.hidden=!e.state.reference;context.textContent=e.state.reference?'대화 기준 · '+C.describe(e.state.reference.query):'';
  context.title=context.textContent;
  welcome.hidden=e.messages.length>0;
  const liveIds=new Set(e.messages.map(m=>m.id));nodes.forEach((n,id)=>{if(!liveIds.has(id)){n.remove();nodes.delete(id);}});
  e.messages.forEach(m=>{
   let n=nodes.get(m.id);const key=JSON.stringify([m.text,m.pending,m.cancelled,m.error,m.result&&m.result.uiEffect]);
   if(!n){n=document.createElement('div');nodes.set(m.id,n);log.appendChild(n);}if(n.dataset.renderKey===key)return;n.dataset.renderKey=key;
   n.className='pad-branch-message '+(m.role==='user'?'is-user':m.role==='system'?'is-system':'is-assistant')+(m.pending?' is-pending':'');n.replaceChildren();
   const p=document.createElement('p');p.textContent=m.text;n.appendChild(p);
   if(m.pending){const dot=document.createElement('span');dot.className='pad-branch-typing';dot.setAttribute('aria-hidden','true');dot.innerHTML='<i></i><i></i><i></i>';n.appendChild(dot);}
   if(m.retryText){const b=document.createElement('button');b.type='button';b.dataset.message=String(m.id);b.dataset.action='retry';b.className='pad-branch-result-action';b.textContent='다시 시도';n.appendChild(b);}
  });
  if(e.type==='new_conversation'){log.replaceChildren();nodes.clear();input.value='';refreshDraft();}
  if(e.type==='validation')systemStatus(e.notice);
  const ids=e.messages.map(x=>x.id).join(',');
  if(ids!==lastMessageIds||['answer','apply','error'].includes(e.type)){
   requestAnimationFrame(()=>{if(disposed)return;const last=e.messages.at(-1),node=last&&nodes.get(last.id);if(node){const top=node.offsetTop-log.offsetTop+log.offsetTop;body.scrollTop=Math.max(0,top-14);}else body.scrollTop=0;});
  }
  lastMessageIds=ids;
 }
 rootEl.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  const q=b.dataset.question;if(q){submit(q==='overview'?C.questions[0][1]:q==='cash'?C.turns[0]:C.questions[4][1]);return;}
  if(b.dataset.example){const row=C.questions.find(x=>x[0]===b.dataset.example);input.value=row[1];refreshDraft();examplesOpen=false;examples.hidden=true;find('[data-action="examples"]').setAttribute('aria-expanded','false');input.focus();return;}
  const act=b.dataset.action;
  if(act==='close')setOpen(false);
  if(act==='new'){session.newConversation();input.value='';refreshDraft();input.focus();}
  if(act==='restore'&&options.onRestore)options.onRestore();
  if(act==='examples'){examplesOpen=!examplesOpen;examples.hidden=!examplesOpen;b.setAttribute('aria-expanded',String(examplesOpen));}
  if(act==='retry'){const m=current.messages.find(x=>String(x.id)===b.dataset.message);if(m)submit(m.retryText);}
 });
 rootEl.addEventListener('keydown',e=>{if(e.key==='Escape'&&open){e.stopPropagation();setOpen(false);}});
 const off=session.subscribe(sync);sync(session.get());
 return {setOpen,setVisible:v=>{visible=v;rootEl.hidden=!v;if(!v)setOpen(false,false);},
  getState:()=>({open,visible,draft:input.value}),
  destroy:()=>{disposed=true;off();rootEl.remove();if(styleEl)styleEl.remove();},element:rootEl};
}
root.PensionBranchSearchWidget={mount};
})(window);

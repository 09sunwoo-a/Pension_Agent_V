/* Non-modal floating chat widget. Mounted on document.body (outside the shell's transformed .pt-page and the
 * legacy full-render mount) so position:fixed is viewport-relative; removed again on destroy.
 * Conversational states: thinking phrases while pending, typed-out answers, a stop button, follow-up chips,
 * and an unread dot on the launcher when an answer arrives while the window is closed. */
(function(root){'use strict';
const C=root.PensionBranchSearchCore;
const svg=(path)=>'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+path+'</svg>';
const icons={chat:svg('<path d="M20 11.5a8 8 0 0 1-8 8H5l-3 2V11.5a9 9 0 0 1 18 0Z"/><path d="M7 10h8M7 14h5"/>'),arrow:svg('<path d="m5 12 7-7 7 7M12 5v15"/>'),stop:svg('<rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="currentColor" stroke="none"/>'),minus:svg('<path d="M5 12h14"/>'),reset:svg('<path d="M3 10a9 9 0 1 1 1.5 7M3 4v6h6"/>'),spark:svg('<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/>')};
const STARTERS=[
 {label:'관리 대상 추천',question:'오늘 중점적으로 관리할 고객은 누구야?'},
 {label:'부점 현황',question:'오늘 부점 현황 말해줘'},
 {label:'고객 검색',question:'현금성 장기대기 고객 보여줘'}
];
const EXAMPLES=[
 {label:'관리 대상 추천',questions:[STARTERS[0].question,'처음 추천한 고객 다시 보여줘']},
 {label:'부점 현황',questions:[STARTERS[1].question,'ISA 만기 고객은 몇 명이야?','납입금 미운용 고객 몇 명이고 현금 합계 얼마야?']},
 {label:'고객 검색',questions:[STARTERS[2].question,'IRP 잔액 7천만원 이상 고객 보여줘','DO 미등록 고객 보여줘']}
];
function mount(container,session,options){
 options=options||{};let open=false,visible=true,disposed=false,composing=false,examplesOpen=false;
 const phrases=['조건을 해석하고 있어요','현재 고객 '+session.metadata().recordCount+'명을 조회하고 있어요','결과를 정리하고 있어요'];
 const rootEl=document.createElement('div');rootEl.className='pad-branch-widget';rootEl.setAttribute('data-branch-widget','');
 rootEl.innerHTML='<div class="pad-branch-window" id="pad-branch-window" role="dialog" aria-modal="false" aria-label="부점 AI 고객 현황·검색" hidden>'+
 '<div class="pad-branch-header"><span aria-label="KB국민은행" class="pad-branch-logo">KB</span><div class="pad-branch-heading"><strong>퇴직연금 사후관리 에이전트</strong><span>여의도종합금융센터</span></div><button type="button" class="pad-branch-icon" data-action="new" title="새 대화 · 목록 유지" aria-label="새 대화">'+icons.reset+'</button><button type="button" class="pad-branch-icon" data-action="close" aria-label="대화창 최소화">'+icons.minus+'</button></div>'+
 '<div class="pad-branch-context" hidden></div>'+
 '<div class="pad-branch-body" data-branch-scroll><div class="pad-branch-welcome"><div class="pad-branch-welcome-title">오늘 우리 부점,<br>어떤 고객을 먼저 살펴볼까요?</div><p class="pad-branch-welcome-desc">우리 부점 고객 현황을 살펴보고, 관리가 필요한 고객을 찾아보세요.</p><p class="pad-branch-welcome-note">찾은 고객은 메인 고객 목록에서 바로 확인할 수 있어요.</p><div class="pad-branch-suggestions"></div></div><div class="pad-branch-messages" role="log" aria-live="polite" aria-relevant="additions text" aria-label="부점 AI 대화"></div></div>'+
 '<div class="pad-branch-examples" hidden></div>'+
 '<div class="pad-branch-footer"><div class="pad-branch-tools"><button type="button" data-action="examples" aria-expanded="false">예시 질문</button><button type="button" data-action="restore" title="검색 결과를 해제하고 기존 목록으로">기존 목록</button></div><form class="pad-branch-composer"><textarea rows="1" maxlength="1200" aria-label="궁금한 부점 현황이나 찾고 싶은 고객 조건" placeholder="궁금한 현황이나 고객 조건을 물어보세요"></textarea><button type="submit" aria-label="질문 전송" class="pad-branch-send" disabled>'+icons.arrow+'</button></form><div class="pad-branch-disclaimer">확인된 데이터만 조회해요.</div></div></div>'+
 // Launcher: the company shell styles .floating_chat as its chatbot button, so the markup carries only that class.
 '<div class="floating_chat" role="button" tabindex="0" aria-label="퇴직연금 사후관리 에이전트 열기" aria-controls="pad-branch-window" aria-expanded="false">퇴직연금 사후관리 에이전트</div>';
 container.appendChild(rootEl);
 // Fallback for a stale or partially deployed pensionAgentDemo.css: the build stamps --pad-branch-css into both the
 // stylesheet and the bundled copy. A missing or different stamp (old file, cache) means the page CSS predates this JS,
 // so the bundled copy is injected once (removed again on destroy). Position is kept as a second trigger.
 let styleEl=null;
 if(root.PensionBranchSearchStyles){
  const expected=(String(root.PensionBranchSearchStyles).match(/--pad-branch-css:"([^"]+)"/)||[])[1]||'';
  const actual=getComputedStyle(rootEl).getPropertyValue('--pad-branch-css').trim().replace(/^"|"$/g,'');
  if(actual!==expected||getComputedStyle(rootEl.querySelector('.pad-branch-window')).position!=='fixed'){styleEl=document.createElement('style');styleEl.setAttribute('data-branch-style','');styleEl.textContent=root.PensionBranchSearchStyles;(document.head||document.body).appendChild(styleEl);console.warn('[Branch AI] pensionAgentDemo.css is missing or older than this JS (stamp '+(actual||'none')+' vs '+expected+'); using the bundled copy. Deploy the CSS from the same build and clear the cache.');}
 }
 const find=s=>rootEl.querySelector(s),panel=find('.pad-branch-window'),launcher=find('.floating_chat'),input=find('textarea'),sendBtn=find('.pad-branch-send'),body=find('.pad-branch-body'),log=find('.pad-branch-messages');
 // No stylesheet positions .floating_chat (local preview, shell without the class): use the bundled pill look.
 if(getComputedStyle(launcher).position==='static')launcher.classList.add('pad-branch-launcher-fallback');
 const welcome=find('.pad-branch-welcome'),context=find('.pad-branch-context'),examples=find('.pad-branch-examples');
 const nodes=new Map(),streams=new Map();let lastMessageIds='',current=session.get(),statusTimer=null,statusIndex=0,statusEl=null,pendingIds=new Set(),focusTimer=null,scrollFrame=null;
 // The send button turns into a stop button while the answer is being prepared or typed out.
 function refreshSend(){const stop=current.busy||streams.size>0;sendBtn.classList.toggle('is-stop',stop);sendBtn.innerHTML=stop?icons.stop:icons.arrow;sendBtn.setAttribute('aria-label',stop?'응답 중지':'질문 전송');sendBtn.disabled=stop?false:!input.value.trim();}
 function refreshDraft(){refreshSend();input.style.height='auto';input.style.height=Math.min(input.scrollHeight,92)+'px';}
 input.addEventListener('input',refreshDraft);
 input.addEventListener('compositionstart',()=>{composing=true;});input.addEventListener('compositionend',()=>{composing=false;refreshDraft();});
 input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing&&!composing&&e.keyCode!==229){e.preventDefault();submit();}});
 find('form').addEventListener('submit',e=>{e.preventDefault();if(current.busy){session.cancel();return;}if(streams.size){finishStreams();return;}if(!composing)submit();});
 // options.intercept(text): 입력 문장을 프론트가 직접 처리하면 true (예: 엑셀 내려받기). 칩/액션 요청은 가로채지 않는다.
 function submit(text,action){const q=text===undefined?input.value:text;if(!q.trim())return;finishStreams();input.value='';refreshDraft();examplesOpen=false;examples.hidden=true;find('[data-action="examples"]').setAttribute('aria-expanded','false');if(!action&&options.intercept&&options.intercept(q.trim()))return;session.send(q,action);}
 function setOpen(value,focus){open=value;panel.hidden=!open;launcher.setAttribute('aria-expanded',String(open));launcher.setAttribute('aria-label',open?'퇴직연금 사후관리 에이전트 최소화':'퇴직연금 사후관리 에이전트 열기');launcher.classList.toggle('is-open',open);if(open)launcher.classList.remove('has-unread');if(focusTimer)clearTimeout(focusTimer);if(open&&focus!==false)focusTimer=setTimeout(()=>{if(!disposed&&open&&visible)input.focus({preventScroll:true});},80);if(!open&&focus!==false)launcher.focus({preventScroll:true});}
 launcher.addEventListener('click',()=>setOpen(!open));
 launcher.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setOpen(!open);}});
 // Welcome and example questions use the supported current-data grammar.
 STARTERS.forEach(item=>{
  const b=document.createElement('button');b.type='button';b.dataset.question=item.question;
  const copy=document.createElement('span');copy.className='pad-branch-suggestion-copy';
  const label=document.createElement('span');label.className='pad-branch-suggestion-label';label.textContent=item.label;
  const question=document.createElement('span');question.className='pad-branch-suggestion-question';question.textContent=item.question.replace(/\.$/,'');
  copy.appendChild(label);copy.appendChild(question);b.appendChild(copy);
  const arrow=document.createElement('span');arrow.className='pad-branch-suggestion-arrow';arrow.setAttribute('aria-hidden','true');arrow.textContent='↗';b.appendChild(arrow);find('.pad-branch-suggestions').appendChild(b);
 });
 EXAMPLES.forEach(group=>{const section=document.createElement('div');section.className='pad-branch-example-group';const label=document.createElement('div');label.className='pad-branch-example-label';label.textContent=group.label;section.appendChild(label);group.questions.forEach(q=>{const b=document.createElement('button');b.type='button';b.dataset.example=q;b.textContent=q;section.appendChild(b);});examples.appendChild(section);});
 function systemStatus(text){const n=document.createElement('div');n.className='pad-branch-system';n.textContent=text;log.appendChild(n);}
 function setStatusCycle(on){if(on&&session.mode!=='remote'&&!statusTimer)statusTimer=setInterval(()=>{statusIndex=(statusIndex+1)%phrases.length;if(statusEl)statusEl.textContent=phrases[statusIndex];},700);if(!on&&statusTimer){clearInterval(statusTimer);statusTimer=null;statusIndex=0;statusEl=null;}}
 // Follow-up chips: only utterances the bounded grammar accepts, and never a condition the result already carries.
 function followups(m){
  const r=m.result;
  if(r&&Array.isArray(r.actions))return r.actions;
  if(session.mode==='remote')return [];
  return STARTERS.map(s=>({label:s.label,command:{type:'query',text:s.question}}));
 }
 function renderChips(node,m){
  node.querySelectorAll('.pad-branch-followups').forEach(x=>x.remove());
  const actions=followups(m);if(!actions.length)return;
  const wrap=document.createElement('div');wrap.className='pad-branch-followups';
  actions.forEach(a=>{const b=document.createElement('button');b.type='button';b.dataset.command=JSON.stringify(a.action||a.command);b.dataset.message=String(m.id);b.textContent=a.label;wrap.appendChild(b);});node.appendChild(wrap);
 }
 function afterStreams(){
  const last=current.messages.length?current.messages[current.messages.length-1]:null;
  if(last&&last.role==='assistant'&&!last.pending&&!last.cancelled&&!last.error){const node=nodes.get(last.id);if(node){if(!node.querySelector('.pad-branch-followups'))renderChips(node,last);const bottom=node.offsetTop+node.offsetHeight;if(bottom>body.scrollTop+body.clientHeight)body.scrollTop=bottom-body.clientHeight+8;}}
  if(!open)launcher.classList.add('has-unread');
  refreshSend();
 }
 function finishStreams(){if(!streams.size)return;streams.forEach(st=>{clearInterval(st.timer);st.text.data=st.full;st.caret.remove();});streams.clear();afterStreams();}
 function startStream(node,p,m){
  const full=m.text,text=document.createTextNode(''),caret=document.createElement('span');caret.className='pad-branch-caret';p.replaceChildren(text,caret);
  const step=full.length>240?4:2;let i=0;const st={full,text,caret,timer:null};
  st.timer=setInterval(()=>{if(disposed){clearInterval(st.timer);return;}i=Math.min(full.length,i+step);text.data=full.slice(0,i);if(i>=full.length){clearInterval(st.timer);caret.remove();streams.delete(m.id);afterStreams();}},20);
  streams.set(m.id,st);
 }
 function sync(e){
  if(disposed)return;current=e;
  const state=e.state||{};
  context.textContent=e.view?e.view.contextLabel:state.contextLabel||(state.reference?'대화 기준 · '+C.describe(state.reference.query):'');context.hidden=!context.textContent;
  if(e.connectionNotice)find('.pad-branch-disclaimer').textContent=e.connectionNotice;
  context.title=context.textContent;
  welcome.hidden=e.messages.length>0;
  const liveIds=new Set(e.messages.map(m=>m.id));nodes.forEach((n,id)=>{if(!liveIds.has(id)){n.remove();nodes.delete(id);}});
  const nowPending=new Set(),lastId=e.messages.length?e.messages[e.messages.length-1].id:null;
  e.messages.forEach(m=>{
   let n=nodes.get(m.id);const key=JSON.stringify([m.text,m.pending,m.cancelled,m.error,m.result&&m.result.uiEffect]);
   if(m.pending)nowPending.add(m.id);
   if(!n){n=document.createElement('div');nodes.set(m.id,n);log.appendChild(n);}if(n.dataset.renderKey===key)return;n.dataset.renderKey=key;
   n.className='pad-branch-message '+(m.role==='user'?'is-user':m.role==='system'?'is-system':'is-assistant')+(m.pending?' is-pending':'');n.replaceChildren();
   const p=document.createElement('p');n.appendChild(p);
   if(m.result&&m.result.scopeNote){const note=document.createElement('div');note.className='pad-branch-data-note';note.textContent=m.result.scopeNote;n.appendChild(note);}
   if(m.pending){p.className='pad-branch-status';p.textContent=session.mode==='remote'?m.text:phrases[statusIndex];statusEl=p;const dot=document.createElement('span');dot.className='pad-branch-typing';dot.setAttribute('aria-hidden','true');dot.innerHTML='<i></i><i></i><i></i>';n.appendChild(dot);return;}
   // An answer that was pending a moment ago is typed out; cancellations and errors show at once.
   if(m.role==='assistant'&&pendingIds.has(m.id)&&!m.cancelled&&!m.error)startStream(n,p,m);else p.textContent=m.text;
   if(m.retryText&&!m.pending){const b=document.createElement('button');b.type='button';b.dataset.message=String(m.id);b.dataset.action='retry';b.className='pad-branch-result-action';b.textContent='다시 시도';n.appendChild(b);}
  });
  pendingIds=nowPending;setStatusCycle(nowPending.size>0);
  nodes.forEach((n,id)=>{if(id!==lastId)n.querySelectorAll('.pad-branch-followups,[data-action="retry"]').forEach(x=>x.remove());});
  if(e.type==='reference'&&!state.reference)log.querySelectorAll('.pad-branch-followups').forEach(x=>x.remove());
  if(e.type==='new_conversation'){streams.forEach(st=>clearInterval(st.timer));streams.clear();log.replaceChildren();nodes.clear();input.value='';}
  if(e.type==='validation')systemStatus(e.notice);
  if(e.type==='cancel'||e.type==='error')afterStreams();
  refreshSend();
  const ids=e.messages.map(x=>x.id).join(',');
  if(ids!==lastMessageIds||['answer','apply','error'].includes(e.type)){
   if(scrollFrame)cancelAnimationFrame(scrollFrame);scrollFrame=requestAnimationFrame(()=>{if(disposed)return;const last=e.messages.at(-1),node=last&&nodes.get(last.id);if(node){const top=node.offsetTop-log.offsetTop+log.offsetTop;body.scrollTop=Math.max(0,top-14);}else body.scrollTop=0;});
  }
  lastMessageIds=ids;
 }
 rootEl.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  const q=b.dataset.question;if(q){submit(q);return;}
  if(b.dataset.command){const last=current.messages.at(-1);if(!current.busy&&last&&String(last.id)===b.dataset.message)submit(b.textContent,JSON.parse(b.dataset.command));return;}
  if(b.dataset.example){input.value=b.dataset.example;refreshDraft();examplesOpen=false;examples.hidden=true;find('[data-action="examples"]').setAttribute('aria-expanded','false');input.focus();return;}
  const act=b.dataset.action;
  if(act==='close')setOpen(false);
  if(act==='new'){session.newConversation();input.value='';refreshDraft();input.focus();}
  if(act==='restore'&&options.onRestore)options.onRestore();
  if(act==='examples'){examplesOpen=!examplesOpen;examples.hidden=!examplesOpen;b.setAttribute('aria-expanded',String(examplesOpen));}
  if(act==='retry'){const m=current.messages.find(x=>String(x.id)===b.dataset.message);if(m&&m===current.messages.at(-1)&&!current.busy)submit(m.retryText,m.retryAction);}
 });
 rootEl.addEventListener('keydown',e=>{if(e.key==='Escape'&&open){e.stopPropagation();setOpen(false);}});
 const off=session.subscribe(sync);sync(session.get());
 return {setOpen,ask:(text,action)=>{setOpen(true);submit(text,action);},setVisible:v=>{visible=v;rootEl.hidden=!v;if(!v)setOpen(false,false);},
  getState:()=>({open,visible,draft:input.value,busy:current.busy,streaming:streams.size>0}),
  destroy:()=>{disposed=true;off();clearTimeout(focusTimer);cancelAnimationFrame(scrollFrame);current=null;nodes.clear();setStatusCycle(false);streams.forEach(st=>clearInterval(st.timer));streams.clear();rootEl.remove();if(styleEl)styleEl.remove();},element:rootEl};
}
root.PensionBranchSearchWidget={mount};
})(window);

/* Non-modal floating chat widget. Mounted on document.body (outside the shell's transformed .pt-page and the
 * legacy full-render mount) so position:fixed is viewport-relative; removed again on destroy. */
(function(root){'use strict';
const C=root.PensionBranchSearchCore;
const svg=(path)=>'<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+path+'</svg>';
const icons={chat:svg('<path d="M20 11.5a8 8 0 0 1-8 8H5l-3 2V11.5a9 9 0 0 1 18 0Z"/><path d="M7 10h8M7 14h5"/>'),arrow:svg('<path d="m5 12 7-7 7 7M12 5v15"/>'),minus:svg('<path d="M5 12h14"/>'),reset:svg('<path d="M3 10a9 9 0 1 1 1.5 7M3 4v6h6"/>'),spark:svg('<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/>')};
function mount(container,session,options){
 options=options||{};const meta=session.metadata();const scopeText=(meta.scopeLabel||'조회 대상')+' '+meta.recordCount+'명';const dateText=meta.asOfDate?meta.asOfDate.replace(/-/g,'.'):'기준일 미확인';let open=false,visible=true,disposed=false,composing=false,examplesOpen=false,tour=-1,enabled=options.enabled!==false;
 const rootEl=document.createElement('div');rootEl.className='pad-branch-widget';rootEl.setAttribute('data-branch-widget','');
 rootEl.innerHTML='<div class="pad-branch-window" id="pad-branch-window" role="dialog" aria-modal="false" aria-label="부점 AI 고객 검색" hidden>'+
 '<div class="pad-branch-header"><div class="pad-branch-avatar">'+icons.spark+'</div><div class="pad-branch-heading"><strong>부점 AI</strong><span><i></i>고객 조회·집계·추출</span></div><button type="button" class="pad-branch-icon" data-action="new" title="새 대화 · 목록 유지" aria-label="새 대화">'+icons.reset+'</button><button type="button" class="pad-branch-icon" data-action="close" aria-label="대화창 최소화">'+icons.minus+'</button></div>'+
 '<div class="pad-branch-scope"><span>현재 화면 기준</span><span>'+scopeText+' · '+dateText+'</span></div>'+
 '<div class="pad-branch-mode-gate" hidden><strong>현재 고객 목록을 확인해 주세요.</strong><p>검색 원본 연결을 확인할 수 없습니다. 다른 고객 데이터로 대체하지 않습니다.</p><button class="pad-branch-primary" type="button" data-action="enable">현재 데이터 다시 확인</button></div>'+
 '<div class="pad-branch-context" hidden></div><div class="pad-branch-tour" hidden></div>'+
 '<div class="pad-branch-body" data-branch-scroll><div class="pad-branch-welcome"><div class="pad-branch-welcome-icon">'+icons.chat+'</div><div class="pad-branch-welcome-title">어떤 고객을 찾으시나요?</div><p>부점 현황을 확인하고, 원하는 조건으로<br>고객 목록을 좁혀 보세요.</p><div class="pad-branch-suggestions"><button type="button" data-question="overview">IRP 고객 현황<span>↗</span></button><button type="button" data-question="cash">납입금 미운용 고객<span>↗</span></button><button type="button" data-question="do">DO 실행 예정 고객<span>↗</span></button></div><p class="pad-branch-mock-note">현재 고객 데이터 조회 · 실제 AI 미연결</p></div><div class="pad-branch-messages" role="log" aria-live="polite" aria-relevant="additions text" aria-label="부점 AI 대화"></div></div>'+
 '<div class="pad-branch-examples" hidden></div>'+
 '<div class="pad-branch-footer"><div class="pad-branch-tools"><button type="button" data-action="examples" aria-expanded="false">예시 질문</button><button type="button" data-action="tour">6턴 시연 가이드</button><button type="button" data-action="restore" title="검색 결과를 해제하고 기존 목록으로">기존 목록</button><button type="button" data-action="cancel" class="pad-branch-cancel" hidden>조회 취소</button></div><form class="pad-branch-composer"><textarea rows="1" maxlength="1200" aria-label="찾고 싶은 고객 조건" placeholder="찾고 싶은 고객 조건을 입력하세요"></textarea><button type="submit" aria-label="질문 전송" class="pad-branch-send" disabled>'+icons.arrow+'</button></form><div class="pad-branch-disclaimer">확인된 데이터만 조회해요. 거래는 실행하지 않아요.</div></div></div>'+
 '<button type="button" class="pad-branch-launcher" aria-label="부점 AI 열기" aria-controls="pad-branch-window" aria-expanded="false">'+icons.chat+'<span>부점 AI</span><span class="pad-branch-live-dot"></span></button>';
 container.appendChild(rootEl);
 // Fallback for a stale or partially deployed pensionAgentDemo.css: if the launcher is not positioned by the
 // page stylesheet, inject the bundled copy of branch-search.css once (removed again on destroy).
 let styleEl=null;
 if(root.PensionBranchSearchStyles&&getComputedStyle(rootEl.querySelector('.pad-branch-launcher')).position!=='fixed'){styleEl=document.createElement('style');styleEl.setAttribute('data-branch-style','');styleEl.textContent=root.PensionBranchSearchStyles;(document.head||document.body).appendChild(styleEl);console.warn('[Branch AI] pensionAgentDemo.css has no .pad-branch-* rules (old file or cache); using the bundled copy.');}
 const scopeNode=rootEl.querySelector('.pad-branch-scope');scopeNode.title=meta.scopeNote||'';
 const note=rootEl.querySelector('.pad-branch-disclaimer');if(meta.displayOnlyCount)note.textContent='현재 목록 '+meta.recordCount+'명 · 상세 원본 '+meta.structuredCount+'명 · 나머지 상세값은 미확인';if(meta.mixedDates)note.textContent+=' · 일부 기준일 상이';
 const find=s=>rootEl.querySelector(s),panel=find('.pad-branch-window'),launcher=find('.pad-branch-launcher'),input=find('textarea'),sendBtn=find('.pad-branch-send'),body=find('.pad-branch-body'),log=find('.pad-branch-messages');
 const welcome=find('.pad-branch-welcome'),context=find('.pad-branch-context'),tourEl=find('.pad-branch-tour'),examples=find('.pad-branch-examples');
 const nodes=new Map();let lastMessageIds='',current=session.get();
 function refreshDraft(){sendBtn.disabled=!input.value.trim()||!enabled;input.style.height='auto';input.style.height=Math.min(input.scrollHeight,92)+'px';}
 input.addEventListener('input',refreshDraft);
 input.addEventListener('compositionstart',()=>{composing=true;});input.addEventListener('compositionend',()=>{composing=false;refreshDraft();});
 input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing&&!composing&&e.keyCode!==229){e.preventDefault();submit();}});
 find('form').addEventListener('submit',e=>{e.preventDefault();if(!composing)submit();});
 function submit(text){const q=text===undefined?input.value:text;if(!q.trim()||!enabled)return;input.value='';refreshDraft();examplesOpen=false;examples.hidden=true;find('[data-action="examples"]').setAttribute('aria-expanded','false');const step=tour;session.send(q).then(result=>{if(step>=0&&step<6&&tour===step&&q===C.turns[step]&&result&&['ok','partial','empty'].includes(result.resultStatus)){tour++;renderTour();}});}
 function setOpen(value,focus){open=value;panel.hidden=!open;launcher.setAttribute('aria-expanded',String(open));launcher.setAttribute('aria-label',open?'부점 AI 최소화':'부점 AI 열기');launcher.classList.toggle('is-open',open);if(open&&focus!==false)setTimeout(()=>{if(!disposed&&open&&visible)input.focus({preventScroll:true});},80);if(!open&&focus!==false)launcher.focus({preventScroll:true});}
 launcher.addEventListener('click',()=>setOpen(!open));
 function setEnabled(value){enabled=value;find('.pad-branch-mode-gate').hidden=enabled;find('.pad-branch-body').hidden=!enabled;find('.pad-branch-footer').hidden=!enabled;refreshDraft();}
 function buildExamples(){examples.replaceChildren();const title=document.createElement('div');title.className='pad-branch-examples-title';title.textContent='예시 질문 · 정답은 현재 고객 데이터에서 계산해요';examples.appendChild(title);C.questions.forEach(([id,q])=>{const b=document.createElement('button');b.type='button';b.dataset.example=id;const n=document.createElement('span');n.textContent=id;const txt=document.createElement('span');txt.textContent=q;b.append(n,txt);examples.appendChild(b);});}
 buildExamples();
 function renderTour(){tourEl.replaceChildren();tourEl.hidden=tour<0;if(tour<0)return;const tag=document.createElement('span');tag.textContent=tour>=6?'6턴 시연 완료':('M01 · '+(tour+1)+'/6');const p=document.createElement('p');p.textContent=tour>=6?'현재 고객 기준 조건 변경을 확인했어요.':C.turns[tour];const b=document.createElement('button');b.type='button';b.dataset.action=tour>=6?'tour':'tour-next';b.textContent=tour>=6?'처음부터':'질문 입력';const close=document.createElement('button');close.type='button';close.dataset.action='tour-close';close.textContent='닫기';tourEl.append(tag,p,b,close);}
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
   if(m.role==='assistant'){const label=document.createElement('div');label.className='pad-branch-author';label.textContent=m.pending?'조건 확인 중':'부점 AI';n.appendChild(label);}
   const p=document.createElement('p');p.textContent=m.text;n.appendChild(p);
   if(m.pending){const dot=document.createElement('span');dot.className='pad-branch-typing';dot.setAttribute('aria-hidden','true');dot.innerHTML='<i></i><i></i><i></i>';n.appendChild(dot);}
   if(m.result&&m.result.resolvedQuery){
    const stamp=document.createElement('div');stamp.className='pad-branch-answer-meta';stamp.textContent=scopeText+' · '+dateText;n.appendChild(stamp);
   }
   if(m.retryText){const b=document.createElement('button');b.type='button';b.dataset.message=String(m.id);b.dataset.action='retry';b.className='pad-branch-result-action';b.textContent='다시 시도';n.appendChild(b);}
  });
  find('[data-action="cancel"]').hidden=!e.busy;
  if(e.type==='new_conversation'){log.replaceChildren();nodes.clear();input.value='';tour=-1;renderTour();refreshDraft();}
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
  if(b.dataset.example){const row=C.questions.find(x=>x[0]===b.dataset.example);input.value=row[1];refreshDraft();examplesOpen=false;examples.hidden=true;input.focus();return;}
  const act=b.dataset.action;
  if(act==='close')setOpen(false);
  if(act==='new'){session.newConversation();input.value='';refreshDraft();input.focus();}
  if(act==='cancel')session.cancel();
  if(act==='restore'&&options.onRestore)options.onRestore();
  if(act==='enable'){if(options.onEnable&&options.onEnable()===false)return;setEnabled(true);}
  if(act==='examples'){examplesOpen=!examplesOpen;examples.hidden=!examplesOpen;b.setAttribute('aria-expanded',String(examplesOpen));}
  if(act==='tour'){session.reset();session.newConversation();tour=0;renderTour();}
  if(act==='tour-next'){if(tour<6){input.value=C.turns[tour];refreshDraft();input.focus();}}
  if(act==='tour-close'){tour=-1;renderTour();}
  if(act==='retry'){const m=current.messages.find(x=>String(x.id)===b.dataset.message);if(m)submit(m.retryText);}
 });
 rootEl.addEventListener('keydown',e=>{if(e.key==='Escape'&&open){e.stopPropagation();setOpen(false);}});
 const off=session.subscribe(sync);sync(session.get());setEnabled(enabled);
 return {setOpen,setEnabled,setVisible:v=>{visible=v;rootEl.hidden=!v;if(!v)setOpen(false,false);},
  getState:()=>({open,visible,draft:input.value,enabled}),
  destroy:()=>{disposed=true;off();rootEl.remove();if(styleEl)styleEl.remove();},element:rootEl};
}
root.PensionBranchSearchWidget={mount};
})(window);

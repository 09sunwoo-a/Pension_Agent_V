/* Remote turns commit only after clean EOF; the latest ticket wins.
 * options.mode='local' retains the isolated demo/golden engine. Only that mode
 * uses applyAggregate and simulated latency. No remote failure falls back to it. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./branch-search-core'),require('./branch-agent-contract'),require('./branch-agent-transport'),globalThis);else root.PensionBranchSearchSession=factory(root.PensionBranchSearchCore,root.PensionBranchAgentContract,root.PensionBranchAgentTransport,root);})(typeof window==='undefined'?globalThis:window,function(C,W,T,root){
'use strict';
function createLocal(input,options){
 options=options||{};
 const data=C.copy(input),records=data.records,asOf=data.metadata.asOfDate;
 const engine=options.engine;
 let state=engine?engine.initialState():C.initialState(records),messages=[],busy=false,ticket=0,revision=0,sequence=0,disposed=false;
 const listeners=new Set();
 const provider=options.provider||((text,s)=>Promise.resolve(C.resolve(text,s,asOf))),applyAggregate=!!options.applyAggregate,latency=Math.max(0,Number(options.latency)||0);
 const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 const emit=(type,extra)=>{if(disposed)return;const e=Object.assign({type,revision,busy,state:C.copy(state),messages:C.copy(messages)},extra||{});listeners.forEach(f=>f(e));};
 const add=(role,text,extra)=>{const m=Object.assign({id:++sequence,role,text},extra||{});messages.push(m);return m;};
 function cancel(reason){ticket++;if(busy){busy=false;messages.forEach(m=>{if(m.pending){m.pending=false;m.cancelled=true;m.text=reason||'요청을 취소했습니다. 목록은 유지합니다.';}});emit('cancel');}}
 async function send(text,action){
  text=String(text||'').trim();if(!text||disposed)return null;
  if(text.length>1200){emit('validation',{notice:'질문은 1,200자 이내로 입력해 주세요.'});return null;}
  cancel('새 요청으로 이전 조회를 취소했습니다.');const token=++ticket;busy=true;
  add('user',text);const reply=add('assistant','검색조건을 확인하고 있어요.',{pending:true});
  const snapshot=C.copy(state);emit('pending');
  try{
   const delay=latency?wait(latency):Promise.resolve();
   const request=engine?await engine.resolve(text,snapshot,action):await provider(text,snapshot);
   if(disposed||token!==ticket)return null;
   emit('resolved',{listChange:engine?!!request.listChange:true});
   await delay;
   if(disposed||token!==ticket)return null;
   const out=engine?engine.execute(snapshot,request):C.execute(records,snapshot,request,asOf,{applyAggregate});
   state=out.state;busy=false;reply.pending=false;reply.text=out.result.answer;reply.result=out.result;
   if(out.result.uiEffect==='apply_customer_list')revision++;
   emit(out.result.uiEffect==='apply_customer_list'?'apply':'answer',{result:C.copy(out.result)});
   return out.result;
  }catch(err){
   if(disposed||token!==ticket)return null;
   busy=false;reply.pending=false;reply.error=true;reply.text='조회 중 오류가 발생했습니다. 기존 목록과 조건은 유지했습니다. 다시 시도해 주세요.';reply.retryText=text;reply.retryAction=action;
   emit('error');return null;
  }
 }
 function apply(spec,source){
  cancel('조건이 변경되어 이전 조회를 취소했습니다.');
  const out=C.execute(records,state,{intent:'extract',query:spec.query,sort:spec.sort||C.copy(state.main.sort),limit:spec.limit===undefined?state.main.limit:spec.limit},asOf);
  state=out.state;revision++;
  if(source)add('system',source);emit('apply',{result:C.copy(out.result)});return out.result;
 }
 return {
  send,cancel,apply,perform:(action,label)=>send(label||'선택한 요청',action),
  // 프론트가 직접 처리한 요청(예: 엑셀 내려받기)을 대화 기록에 남긴다. Agent/엔진 호출·목록 변경 없음.
  note:(userText,assistantText)=>{if(disposed)return;add('user',String(userText));add('assistant',String(assistantText));emit('answer');},
  reset:()=>{if(!engine)return apply({query:C.all(),sort:{field:data.metadata.scopeId==='current-main-list'?'source_order':'caseId',direction:'asc'},limit:null},'전체 검색조건과 표시 제한을 해제했습니다.');cancel();state=engine.initialState();revision++;add('system','기존 고객 목록으로 돌아왔습니다.');emit('apply');},
  newConversation:()=>{cancel();if(!engine)state.reference=null;else {state.clarification=null;state.aggregate=null;state.selectedCustomerId=null;}state.lastResult=null;messages=[];emit('new_conversation');},
  clearReference:()=>{state.reference=null;emit('reference');},
  get:()=>({state:C.copy(state),messages:C.copy(messages),busy,revision}),
  subscribe:f=>{listeners.add(f);return()=>listeners.delete(f);},
  records:()=>C.copy(records),metadata:()=>C.copy(data.metadata),
  destroy:()=>{cancel();disposed=true;listeners.clear();},
  // Fixture verification only. No evaluation answers are used by the session.
  mode:input.metadata.scopeId==='current-main-list'?'current-data-mock':'golden-mock'
 };
}
function createRemote(input,options){
 options=Object.assign({},options);let cfg=options.config;delete options.config;
 let manifest=options.manifest?C.copy(options.manifest):null;delete options.manifest;
 const metadata=C.copy(input.metadata),listeners=new Set();
 let state=null,revision=0,conversationId=uuid(),messages=[],sequence=0,ticket=0,busy=false,disposed=false,controller=null;
 let view={active:false,rowIds:[],sort:null,contextLabel:''};
 function uuid(){
  if(root.crypto.randomUUID)return root.crypto.randomUUID();
  const b=root.crypto.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;
  const h=Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);
 }
 let connectionNotice='';try{ready();}catch(e){connectionNotice=notice(e.code,e.field);if(typeof console!=='undefined'&&(e.code==='NOCONFIG'||e.code==='CONFIG'))console.warn('[Branch AI] connection config '+e.code+(e.field?' ('+e.field+')':'')+': onParam(params).fabrix.branch 또는 window.__PENSION_FABRIX_CONFIG.branch 와 공통 xClientUser 를 확인하세요.');}
 function snapshot(){return {state:C.copy(state),view:C.copy(view),messages:C.copy(messages),busy,revision,conversationId,mode:'remote',connectionNotice};}
 function emit(type,extra){if(!disposed){const event=Object.assign(snapshot(),{type},extra);listeners.forEach(f=>f(event));}}
 function add(role,text,extra){const m=Object.assign({id:++sequence,role,text},extra);messages.push(m);return m;}
 function cancel(reason){
  ticket++;if(controller){controller.abort();controller=null;}
  if(busy){busy=false;messages.forEach(m=>{if(m.pending){m.pending=false;m.cancelled=true;m.text=reason||'요청을 취소했습니다. 기존 목록과 조건은 유지했습니다.';}});emit('cancel');}
 }
 function fault(code){const e=new Error(code);e.code=code;return e;}
 function guessListChange(text,action){
  if(action)return ['recommend','restore_recommendation','reset','show_aggregate','remove_condition'].includes(action.type);
  const n=text.replace(/\s+/g,'');
  if(/찾아|보여|추천|기존목록|전체목록|처음추천|조건.*(빼|제거|해제|추가)|순으로|명만|만보|만$/.test(n))return true;
  if(/현황|몇명|합계|얼마|브리핑|왜|어떻게|언제|알려|말해|요약|정리/.test(n))return false;
  return /고객|누구|중점|우선|관리할/.test(n);
 }
 function ready(){
  const valid=T.config(cfg);if(!manifest)throw fault('MANIFEST');
  if(options.checkManifest)options.checkManifest(manifest);
  return valid;
 }
 function notice(code,field){
  if(code==='NOCONFIG')return '부점 AI 연결 설정이 주입되지 않았습니다. 담당자에게 연결 설정(branch)을 확인해 주세요.';
  if(code==='CONFIG')return '부점 AI 연결 설정 오류'+(field?': '+field+' 값이 비어 있거나 형식이 맞지 않습니다.':'입니다.')+' 담당자에게 연결 설정을 확인해 주세요.';
  if(code==='MANIFEST'||code==='DATA_VERSION')return '부점 AI 데이터 버전을 확인할 수 없습니다. 같은 빌드의 데이터와 화면으로 다시 진입해 주세요.';
  if(code==='AUTH')return '부점 AI 인증 설정을 확인해 주세요. 기존 목록과 조건은 유지했습니다.';
  if(code==='TIMEOUT')return '응답 시간이 초과되었습니다. 기존 목록과 조건은 유지했습니다. 다시 시도해 주세요.';
  // Stage codes so a failed call can be located without reading the response: HTTP/CONTENT_TYPE/STREAM (gateway),
  // SSE/JSON/GATEWAY/TRUNCATED/LIMIT (stream shape), VERSION/IDENTITY/DATA_VERSION/REVISION/SCHEMA/RESULT/UI/STATE/ACTION (contract),
  // LLM_TIMEOUT/LLM_OUTPUT/INTERNAL/INVALID_REQUEST (Agent error event), NETWORK (fetch/CORS).
  return '응답을 확인하지 못했습니다'+(code?' (코드: '+code+')':'')+'. 기존 목록과 조건은 유지했습니다. 다시 시도해 주세요.';
 }
 async function send(text,action){
  text=String(text||'').trim();if(!text||disposed)return null;
  if(Array.from(text).length>1200){emit('validation',{notice:'질문은 1,200자 이내로 입력해 주세요.'});return null;}
  cancel('새 요청으로 이전 조회를 취소했습니다.');const token=++ticket;
  busy=true;add('user',text);const reply=add('assistant','조건을 해석하고 있어요.',{pending:true,retryText:text,retryAction:action||null});
  // Optimistic guess (like the local engine's immediate intent): is this request likely to change the main list?
  // Interpretation is the long phase on a remote Agent, so the list skeleton starts now and the answer decides.
  emit('pending',{listGuess:guessListChange(text,action)});controller=new AbortController();const activeController=controller;
  try{
   const valid=ready();
   const request=W.request({request_id:uuid(),conversation_id:conversationId,base_revision:revision,
    x_client_user:valid.xClientUser,message:text,action:action||null,state:C.copy(state)},manifest);
   const final=await T.call(valid,request,manifest,{signal:activeController.signal,fetch:options.fetch,timeoutMs:options.timeoutMs,
    onProgress:progress=>{
     if(disposed||token!==ticket)return;
     reply.text={interpreting:'조건을 해석하고 있어요.',executing:'고객 데이터를 확인하고 있어요.',composing:'답변을 정리하고 있어요.'}[progress.phase];
     emit('progress',{progress,listChange:progress.phase==='executing'&&progress.list_pending});
    }});
   if(disposed||token!==ticket)return null;
   if(options.isCurrent&&!options.isCurrent()){cancel();return null;}
   if(final.event==='error')throw fault(final.data.code);
   const answer=final.data;
   // Check every ID against the actual original rows before committing any part of the turn.
   if(options.prepareAnswer)options.prepareAnswer(answer,manifest);
   state=C.copy(answer.next_state);revision=answer.revision;
   if(answer.ui.list_action==='replace')view={active:true,rowIds:answer.ui.row_ids.slice(),sort:C.copy(answer.ui.sort),contextLabel:answer.context_label};
   else if(answer.ui.list_action==='reset')view={active:false,rowIds:[],sort:null,contextLabel:answer.context_label};
   else view.contextLabel=answer.context_label;
   busy=false;controller=null;reply.pending=false;reply.text=answer.text;delete reply.retryText;delete reply.retryAction;
   reply.result={answer:answer.text,scopeNote:answer.scope_note,contextLabel:answer.context_label,actions:C.copy(answer.actions),ui:answer.ui};
   emit(answer.ui.list_action==='keep'?'answer':'apply',{result:C.copy(reply.result)});return C.copy(answer);
  }catch(e){
   if(disposed||token!==ticket)return null;
   busy=false;controller=null;reply.pending=false;reply.error=true;reply.code=e.code||'NETWORK';reply.text=notice(reply.code,e.field);
   if(typeof console!=='undefined'&&reply.code!=='ABORTED')console.warn('[Branch AI] request failed: '+reply.code+(e.field?' ('+e.field+')':'')+' · Network 탭에서 agent-messages 응답의 status/content-type/본문을 확인하세요. 응답 내용은 기록하지 않습니다.');
   emit('error');return null;
  }
 }
 return {send,cancel,perform:(action,label)=>send(label||'선택한 요청',action),
  // 프론트가 직접 처리한 요청(예: 엑셀 내려받기)을 대화 기록에 남긴다. Agent 호출·state/view 변경 없음.
  note:(userText,assistantText)=>{if(disposed)return;add('user',String(userText));add('assistant',String(assistantText));emit('answer');},
  reset:()=>{if(disposed)return;cancel();state=null;revision++;view={active:false,rowIds:[],sort:null,contextLabel:''};add('system','기존 고객 목록으로 돌아왔습니다.');emit('apply');},
  newConversation:()=>{if(disposed)return;cancel();conversationId=uuid();revision=0;if(state){state.last_aggregate=null;state.clarification=null;}messages=[];emit('new_conversation');},
  get:snapshot,metadata:()=>C.copy(metadata),subscribe:f=>{listeners.add(f);return()=>listeners.delete(f);},mode:'remote',
  destroy:()=>{cancel();disposed=true;listeners.clear();state=null;messages=[];cfg=null;manifest=null;view={active:false,rowIds:[],sort:null,contextLabel:''};options={};conversationId=null;}
 };
}
function create(input,options){return options&&options.mode==='local'?createLocal(input,options):createRemote(input,options);}
return {create};
});

/* Conversation state is independent of DOM and transport. Latest request wins.
 * options.applyAggregate: the screen applies aggregate answers to the list too (golden tests keep the default). */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./branch-search-core'));else root.PensionBranchSearchSession=factory(root.PensionBranchSearchCore);})(typeof window==='undefined'?globalThis:window,function(C){
'use strict';
function create(input,options){
 options=options||{};
 const data=C.copy(input),records=data.records,asOf=data.metadata.asOfDate;
 let state=C.initialState(records),messages=[],busy=false,ticket=0,revision=0,sequence=0,disposed=false;
 const listeners=new Set();
 const provider=options.provider||((text,s)=>Promise.resolve(C.resolve(text,s,asOf))),applyAggregate=!!options.applyAggregate;
 const emit=(type,extra)=>{if(disposed)return;const e=Object.assign({type,revision,busy,state:C.copy(state),messages:C.copy(messages)},extra||{});listeners.forEach(f=>f(e));};
 const add=(role,text,extra)=>{const m=Object.assign({id:++sequence,role,text},extra||{});messages.push(m);return m;};
 function cancel(reason){ticket++;if(busy){busy=false;messages.forEach(m=>{if(m.pending){m.pending=false;m.cancelled=true;m.text=reason||'요청을 취소했습니다. 목록은 유지합니다.';}});emit('cancel');}}
 async function send(text){
  text=String(text||'').trim();if(!text||disposed)return null;
  if(text.length>1200){emit('validation',{notice:'질문은 1,200자 이내로 입력해 주세요.'});return null;}
  cancel('새 요청으로 이전 조회를 취소했습니다.');const token=++ticket;busy=true;
  add('user',text);const reply=add('assistant','검색조건을 확인하고 있어요.',{pending:true});
  const snapshot=C.copy(state);emit('pending');
  try{
   const request=await provider(text,snapshot);
   if(disposed||token!==ticket)return null;
   const out=C.execute(records,snapshot,request,asOf,{applyAggregate});
   state=out.state;busy=false;reply.pending=false;reply.text=out.result.answer;reply.result=out.result;
   if(out.result.uiEffect==='apply_customer_list')revision++;
   emit(out.result.uiEffect==='apply_customer_list'?'apply':'answer',{result:C.copy(out.result)});
   return out.result;
  }catch(err){
   if(disposed||token!==ticket)return null;
   busy=false;reply.pending=false;reply.error=true;reply.text='조회 중 오류가 발생했습니다. 기존 목록과 조건은 유지했습니다. 다시 시도해 주세요.';reply.retryText=text;
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
  send,cancel,apply,
  reset:()=>apply({query:C.all(),sort:{field:data.metadata.scopeId==='current-main-list'?'source_order':'caseId',direction:'asc'},limit:null},'전체 검색조건과 표시 제한을 해제했습니다.'),
  newConversation:()=>{cancel();state.reference=null;state.lastResult=null;messages=[];emit('new_conversation');},
  clearReference:()=>{state.reference=null;emit('reference');},
  get:()=>({state:C.copy(state),messages:C.copy(messages),busy,revision}),
  subscribe:f=>{listeners.add(f);return()=>listeners.delete(f);},
  records:()=>C.copy(records),metadata:()=>C.copy(data.metadata),
  destroy:()=>{cancel();disposed=true;listeners.clear();},
  // Fixture verification only. No evaluation answers are used by the session.
  mode:input.metadata.scopeId==='current-main-list'?'current-data-mock':'golden-mock'
 };
}
return {create};
});

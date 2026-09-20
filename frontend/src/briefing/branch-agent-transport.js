/* Shared remote path for FabriX and the validation localhost bridge. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./fabrix-transport'),require('./branch-agent-contract'));
 else root.PensionBranchAgentTransport=factory(root.PensionFabrixTransport,root.PensionBranchAgentContract);
})(typeof window==='undefined'?globalThis:window,function(T,C){
'use strict';
function fault(code){const e=new Error(code);e.code=code;return e;}
function config(input){
 if(!input)throw fault('NOCONFIG');
 const id=input.agentId;
 if(!(Number.isSafeInteger(id)&&id>0)&&!(typeof id==='string'&&id.trim()))throw fault('CONFIG');
 // Reuse URL/header validation without changing the existing numeric-ID API.
 const cfg=T.config(Object.assign({},input,{agentId:1}));
 cfg.agentId=typeof id==='string'?id.trim():id;return cfg;
}
function settings(params,globalConfig){
 const p=params&&params.fabrix,g=globalConfig||{};
 const branch=p&&Object.prototype.hasOwnProperty.call(p,'branch')?p.branch:g.branch;
 if(!branch)return null;
 return Object.assign({},branch,{xClientUser:p&&Object.prototype.hasOwnProperty.call(p,'xClientUser')?p.xClientUser:g.xClientUser});
}
async function call(input,request,manifest,options){
 const cfg=config(input),turn=C.createTurn(request,manifest),opts=options||{};
 const controller=new AbortController();let reader,completed=false,timedOut=false,rejectAbort;
 const stopped=new Promise((_,reject)=>{rejectAbort=reject;});
 const stop=()=>{controller.abort();rejectAbort(fault(timedOut?'TIMEOUT':'ABORTED'));};
 const timer=setTimeout(()=>{timedOut=true;stop();},opts.timeoutMs==null?90000:opts.timeoutMs);
 if(opts.signal)opts.signal.addEventListener('abort',stop);
 try{
  if(opts.signal&&opts.signal.aborted)stop();
  const response=await Promise.race([stopped,Promise.resolve().then(()=>{
   if(controller.signal.aborted)throw fault('ABORTED');
   return (opts.fetch||fetch)(cfg.endpointUrl+'/openapi/agent-chat/v1/agent-messages',{
    method:'POST',mode:'cors',credentials:'omit',cache:'no-store',redirect:'error',signal:controller.signal,
    headers:{'Content-Type':'application/json; charset=UTF-8','Accept':'text/event-stream',
     'x-openapi-token':'Bearer '+cfg.openapiToken,'x-generative-ai-client':cfg.generativeAiClient},
    body:JSON.stringify({agentId:cfg.agentId,contents:[JSON.stringify(request)],llmConfig:{},isStream:true})
   });
  })]);
  if(!response.ok)throw fault([401,403].includes(response.status)?'AUTH':'HTTP');
  if(!/^text\/event-stream(?:\s*;|$)/i.test(response.headers.get('content-type')||''))throw fault('CONTENT_TYPE');
  if(!response.body||!response.body.getReader)throw fault('STREAM');
  reader=response.body.getReader();
  const decoder=new TextDecoder('utf-8',{fatal:true});
  const stream=T.parser(envelope=>turn.accept(envelope).forEach(event=>{if(opts.onProgress)opts.onProgress(event.data);}));
  function decode(bytes,streaming){try{return decoder.decode(bytes,{stream:streaming});}catch(_){throw fault('SSE');}}
  while(true){const item=await Promise.race([reader.read(),stopped]);if(item.done)break;stream.push(decode(item.value,true));}
  stream.push(decode(undefined,false));stream.finish();
  if(controller.signal.aborted)throw fault(timedOut?'TIMEOUT':'ABORTED');
  const final=turn.finish();completed=true;return final;
 }catch(e){turn.cancel();throw controller.signal.aborted?fault(timedOut?'TIMEOUT':'ABORTED'):fault(e.code||'NETWORK');}
 finally{
  clearTimeout(timer);if(opts.signal)opts.signal.removeEventListener('abort',stop);
  if(!completed)controller.abort();
  if(reader){if(!completed)reader.cancel().catch(()=>{});reader.releaseLock();}
 }
}
return {config,settings,call};
});

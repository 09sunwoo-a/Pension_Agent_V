/* Local demo conversation: data-derived selection, ordered history, evidence and UI actions.
 * This is not a remote Agent contract. No fixed customer IDs or golden answers are used. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./branch-search-core'),require('./branch-search-current-provider'));
 else root.PensionBranchConversation=factory(root.PensionBranchSearchCore,root.PensionBranchCurrentProvider);
})(typeof window==='undefined'?globalThis:window,function(C,P){
'use strict';
const norm=t=>String(t).normalize('NFKC').replace(/[\s?!？。,·]/g,'').replace(/\.$/,'').toLowerCase();
const normalSort={field:'source_order',direction:'asc'};
const act=(label,command)=>({label,command});
const finite=v=>typeof v==='number'&&Number.isFinite(v);
const same=(a,b)=>a.length===b.length&&a.every(x=>b.includes(x));
function create(input){
 const data=C.copy(input),records=data.records,byId=new Map(records.map(r=>[C.idOf(r),r])),allIds=records.map(C.idOf),asOf=data.metadata.asOfDate;
 const provider=P.create(data),pick=ids=>ids.map(id=>byId.get(id)).filter(Boolean);
 const dateText=d=>d?Number(d.slice(5,7))+'월 '+Number(d.slice(8,10))+'일':'기준일 미확인';
 const accounts=r=>(r.searchSupplement&&r.searchSupplement.externalAccounts||[]).filter(a=>a.type==='ISA');
 const upcoming=r=>accounts(r).filter(a=>asOf&&a.maturityDate>=asOf&&a.maturityDate<=C.dateAdd(asOf,30));
 function evidence(r){
  const s=r.searchSupplement||{},m=s.management||{},date=r.searchSource&&r.searchSource.asOfDate,items=[];
  if(date!==asOf)return items;
  if(m.transfer&&m.transfer.applied&&m.transfer.status==='의사확인대기')items.push({type:'transfer',rank:0,label:'계약이전 신청 · 의사확인 대기'});
  const cash=C.value(r,'cash_amount'),pct=C.value(r,'cash_pct');
  const deposits=(m.retirementDeposits||[]).filter(e=>e.date&&e.date<=asOf&&e.amount===m.retirementAmount).sort((a,b)=>b.date.localeCompare(a.date));
  if(m.instruction===false&&m.retirementAmount>0&&cash===m.retirementAmount&&pct===100&&deposits.length)items.push({type:'retirement',rank:1,label:'퇴직금 운용 미지시 · 현금성 '+C.money(cash),date:deposits[0].date,days:C.dayDiff(deposits[0].date,asOf)});
  const isa=upcoming(r).filter(a=>a.verifiedAt===asOf).sort((a,b)=>a.maturityDate.localeCompare(b.maturityDate));
  if(isa.length)items.push({type:'isa',rank:2,label:'ISA 만기 D-'+C.dayDiff(asOf,isa[0].maturityDate)+' · '+isa[0].maturityDate.slice(5).replace('-','.'),date:isa[0].maturityDate});
  return items;
 }
 function recommendation(){
  const seen=new Set(),rows=records.map(r=>({r,reasons:evidence(r)})).filter(x=>x.reasons.length).filter(x=>{const id=x.r.customer.customerId||C.idOf(x.r);if(seen.has(id))return false;seen.add(id);return true;});
  rows.sort((a,b)=>a.reasons[0].rank-b.reasons[0].rank||C.idOf(a.r).localeCompare(C.idOf(b.r)));
  return {ids:rows.map(x=>C.idOf(x.r)),reasons:Object.fromEntries(rows.map(x=>[C.idOf(x.r),x.reasons])),asOf};
 }
 function initialState(){return Object.assign(C.initialState(records),{mainListCaseIds:allIds.slice(),active:false,selection:null,recommendation:null,aggregate:null,clarification:null,selectedCustomerId:null,operationSequence:0,conditionChips:[],contextLabel:''});}
 function info(answer,extra){return Object.assign({type:'info',answer,listChange:false},extra||{});}
 function clarify(answer,clarification,actions){return info(answer,{status:'clarification_required',clarification,actions:actions||[]});}
 function parseSearch(text){
  const out=provider(text,{reference:null});
  if(out.error)return out;
  return out;
 }
 function resolve(text,state,action){
  if(action){if(action.type==='query')return resolve(action.text,Object.assign({},state,{clarification:null}));return Object.assign({},action,{listChange:['recommend','restore_recommendation','reset','show_ids','remove','select','scope'].includes(action.type)});}
  const n=norm(text),pending=state.clarification;
  if(pending&&pending.kind==='cash'){
   if(n==='금액'||n==='비중')return clarify(n==='금액'?'기준 금액을 알려주세요.':'기준 비중을 알려주세요.',{kind:'cash_value',field:n==='금액'?'현금성자산':'현금성비중'},[]);
  }
  if(pending&&pending.kind==='cash_value'&&/^\d/.test(n))return resolve(pending.field+' '+text+' 고객 보여줘',Object.assign({},state,{clarification:null}));
  if(pending&&pending.kind==='customer'){
   const ids=pending.ids.filter(id=>norm(byId.get(id).customer.name)===n.replace(/고객$/,''));
   if(ids.length===1)return {type:'brief',id:ids[0],listChange:false};
  }
  if(pending&&pending.kind==='scope'&&/^(현재목록|추천고객|방금집계|집계고객)$/.test(n))return resolve('',state,{type:'scope',target:/현재|추천/.test(n)?'current':'aggregate',text:pending.text});
  if(/^(기존목록|전체목록)(으로)?(돌아가|보여줘|복원해줘)?$/.test(n))return {type:'reset',listChange:true};
  if(/^처음추천/.test(n))return state.recommendation?{type:'restore_recommendation',listChange:true}:info('저장된 추천 결과가 없습니다. 오늘 관리할 고객을 추천해드릴까요?',{actions:[act('관리할 고객 추천',{type:'recommend'})]});
  if(/어제|전일|지난달/.test(n))return info('비교할 과거 자료가 없어 증감은 확인할 수 없습니다. 현재 확인된 관리 상태는 조회할 수 있습니다.');
  if(/^(오늘|지금).*(중점|우선|먼저|관리할).*(고객).*(누구|추천|보여줘)/.test(n)||n==='관리할고객추천해줘')return {type:'recommend',listChange:true};
  if(/^(오늘의?|우리)?부점(?:irp고객)?현황(?:을)?(?:말해줘|요약해줘|정리해줘|알려줘|보여줘)?$/.test(n)||n==='irp고객현황')return {type:'aggregate',query:C.all(),metric:'overview',listChange:false};
  if(/^(현금(이)?많은고객)(찾아줘|보여줘)?$/.test(n))return clarify('현금성자산 금액과 비중 중 어떤 기준으로 찾을까요?',{kind:'cash'},[act('금액',{type:'cash_field',field:'현금성자산'}),act('비중',{type:'cash_field',field:'현금성비중'})]);
  if(n.includes('운용금액'))return clarify('운용금액을 현금성을 포함한 IRP 평가금액 기준으로 조회할까요?',{kind:'amount'},[act('IRP 평가금액 기준',{type:'query',text:text.replace(/운용금액/g,'IRP 잔액').replace(/이상이다\s*$/,'이상 고객 보여줘')})]);
  if(/오늘.*isa.*만기/.test(n))return info('시연 기준일은 '+asOf+'입니다. 당일 ISA 만기를 확인할까요, 등록된 ISA 만기 고객을 볼까요?',{actions:[act('기준일 당일 만기',{type:'query',text:'앞으로 0일 이내 ISA 만기 고객 보여줘'}),act('ISA 만기 등록 고객',{type:'query',text:'ISA 만기 고객 보여줘'})]});
  if(/isa.*누구.*언제|isa.*언제.*만기/.test(n))return {type:'isa_facts',listChange:false};
  if(/브리핑|왜.*관리|왜.*확인|어떻게관리|얼마가운용되지|isa만기자금/.test(n)){
   const scope=state.active?pick(state.mainListCaseIds):records;
   const allNamed=records.filter(r=>n.includes(norm(r.customer.name))),inScope=scope.filter(r=>allNamed.includes(r));
   const named=inScope.length?inScope:allNamed;
   const ids=named.length?named.map(C.idOf):state.selectedCustomerId&&state.mainListCaseIds.includes(state.selectedCustomerId)?[state.selectedCustomerId]:state.active?state.mainListCaseIds:[];
   const mode=n.includes('isa만기자금')?'isa_amount':'brief';
   if(ids.length===1)return {type:mode,id:ids[0],listChange:false};
   if(!ids.length)return info('확인할 고객을 이름으로 지정하거나 먼저 고객을 검색해 주세요.');
   return clarify('어떤 고객을 확인할까요?',{kind:'customer',ids},ids.slice(0,8).map(id=>act(byId.get(id).customer.name,{type:mode,id})));
  }
  const remove=n.match(/^(.+?)(조건)(은|도|만)?(빼줘|빼자|삭제해줘|해제해줘)$/);
  if(remove)return {type:'remove',field:({'나이':'age','연령':'age','50대':'age','잔액':'irp_amount','irp잔액':'irp_amount','irp평가금액':'irp_amount','현금성자산':'cash_amount','현금성비중':'cash_pct'})[remove[1]],label:remove[1],listChange:!!state.active};
  const follow=/^(그중|이중|현재목록|이\d+명)/.test(n)||/조건(도|을)?추가해줘$/.test(n);
  if(follow&&!state.active)return info('이어갈 검색 결과가 없습니다. 먼저 고객을 찾거나 추천해 주세요.');
  const countReference=n.match(/^이(\d+)명/);if(countReference&&Number(countReference[1])!==state.mainListCaseIds.length)return info('현재 목록은 '+state.mainListCaseIds.length+'명입니다. 집계할 고객 범위를 확인해 주세요.');
  if(follow&&state.aggregate&&!same(state.mainListCaseIds,state.aggregate.ids))return clarify('현재 목록 '+state.mainListCaseIds.length+'명과 방금 집계한 고객 '+state.aggregate.ids.length+'명 중 어느 대상을 확인할까요?',{kind:'scope',text},[act('현재 목록 기준',{type:'scope',target:'current',text}),act('방금 집계한 고객',{type:'scope',target:'aggregate',text})]);
  if(/(irp|잔액).*합계/.test(n))return {type:'aggregate',query:C.all(),metric:'irp_sum',ids:follow?state.mainListCaseIds:null,listChange:false};
  if(/^(우리부점)?현금성자산합계/.test(n))return {type:'aggregate',query:C.all(),metric:'cash_sum',listChange:false};
  if(/납입금미운용.*(현금|현금성자산).*합계/.test(n))return {type:/찾아|보여/.test(n)?'select':'aggregate',query:C.segment('납입금 미운용'),metric:'cash_sum',follow,listChange:/찾아|보여/.test(n)};
  let queryText=text.replace(/^\s*(그중|이중)\s*/,'').replace(/조건\s*(도|을)?\s*추가해줘\s*$/,'고객 보여줘').replace(/몇\s*명이냐/g,'몇 명이야').replace(/나이/g,'연령');
  let clean=norm(queryText).replace(/^irp(?=[+-]?\d)/,'irp잔액').replace(/(이상|이하|초과|미만|대)만$/,'$1');queryText=clean;
  let sort=clean.match(/^(irp잔액|irp평가금액|잔액|현금성자산|현금성비중|수익률)(큰|많은|높은|작은|적은|낮은)순으로(?:상위)?(?:(\d+)명만)?(?:보여줘|남겨줘)?$/);
  if(sort){if(!state.active)return info('정렬할 고객을 먼저 검색해 주세요.');return {type:'select',follow:true,sort:{field:({'irp잔액':'irp_amount','irp평가금액':'irp_amount','잔액':'irp_amount','현금성자산':'cash_amount','현금성비중':'cash_pct','수익률':'return_pct'})[sort[1]],direction:/큰|많은|높은/.test(sort[2])?'desc':'asc'},limit:sort[3]?Number(sort[3]):null,listChange:true};}
  const isa=clean.match(/^(?:앞으로)?(\d+)일(?:이내|안에)isa만기고객(?:은)?(몇명이야|보여줘|찾아줘)$/);
  if(isa){if(!asOf)return info('기준일이 확인되지 않아 만기 기간을 계산할 수 없습니다.');return {type:isa[2]==='몇명이야'?'aggregate':'select',query:{op:'isa_between',start:asOf,end:C.dateAdd(asOf,Number(isa[1]))},follow,listChange:isa[2]!=='몇명이야'};}
  if(!/(보여줘|찾아줘|몇명이야|남겨줘|알려줘)$/.test(clean)&&/(이상|이하|초과|미만|만)$/.test(clean))queryText+=' 보여줘';
  const parsed=parseSearch(queryText);
  if(parsed.error)return info(parsed.error==='unsupported_mock'?'조건을 이해하지 못했습니다. 고객 상태나 금액 기준을 구체적으로 알려주세요.':parsed.answer,{status:parsed.error});
  return {type:parsed.intent==='aggregate'?'aggregate':'select',query:parsed.query,metric:parsed.metric,sort:parsed.sort&&parsed.sort.field!=='source_order'?parsed.sort:null,limit:parsed.limit,follow,listChange:parsed.intent!=='aggregate'};
 }
 function replay(selection){
  let candidates=selection.baseIds.slice(),ids=candidates.slice(),query=C.all(),unknown=[],sort=normalSort,limit=null;
  for(const op of selection.operations){
   if(op.type==='filter'){
    query=C.and(query,op.query);const r=C.run(pick(candidates),query,sort);
    ids=sort.field==='source_order'?candidates.filter(id=>r.matchedCaseIds.includes(id)):r.orderedCaseIds;unknown=r.unknownCaseIds;
   }else if(op.type==='sort'){
    sort=op.sort;ids=C.run(pick(ids),C.all(),sort).orderedCaseIds;
   }else if(op.type==='limit'){
    limit=op.limit;ids=ids.slice(0,limit);candidates=ids.slice();query=C.all();unknown=[];
   }
  }
  // A filter after sorting retains the selected order.
  const lastSort=selection.operations.map((o,i)=>o.type==='sort'?i:-1).filter(i=>i>=0).pop();
  if(lastSort!==undefined)ids=C.run(pick(ids),C.all(),sort).orderedCaseIds;
  return {ids,unknown,sort,limit};
 }
 function conditionChips(selection){return selection.operations.map(o=>({key:o.key,label:o.type==='filter'?C.describe(o.query):o.type==='sort'?C.sortLabel(o.sort):'상위 '+o.limit+'명'}));}
 function brief(r){
  const reasons=evidence(r),m=r.searchSupplement&&r.searchSupplement.management||{},name=r.customer.name;
  if(reasons.some(x=>x.type==='transfer'))return name+' 고객은 IRP '+C.money(C.value(r,'irp_amount'))+'을 보유하고 있으며, '+(m.transfer.reason==='계좌수수료부담'?'수수료 부담으로 ':'')+'계약이전을 신청해 의사확인 대기 중입니다. 현재 이전 의사와 불편 사항을 확인하는 상담이 필요합니다.';
  const deposit=reasons.find(x=>x.type==='retirement');
  if(deposit)return name+' 고객은 퇴직급여 '+C.money(m.retirementAmount)+'이 운용지시 없이 전액 현금성으로 남아 있으며, '+dateText(asOf)+' 기준 입금 후 '+deposit.days+'일이 지났습니다. 자금 사용계획과 운용 의사를 확인해 첫 운용 상담이 필요합니다.';
  const isa=reasons.find(x=>x.type==='isa');
  if(isa){const a=upcoming(r).find(a=>a.maturityDate===isa.date),missing=[];if(!finite(a.valuationAmountKrw))missing.push('ISA 금액');if(!a.usePlan)missing.push('자금 사용계획');if(a.conversionIntent==null)missing.push('IRP 전환 의향');return name+' 고객의 ISA 만기는 '+dateText(isa.date)+'로, '+dateText(asOf)+' 기준 '+C.dayDiff(asOf,isa.date)+'일 남았습니다. '+(missing.length?missing.join('·')+'이 확인되지 않아 만기 전에 이를 확인하는 상담이 필요합니다.':'만기 전에 확인된 자금 사용계획을 다시 점검할 필요가 있습니다.');}
  const labels=(r.signals||[]).map(s=>s.label),idle=labels.includes('현금성 장기대기'),unregistered=labels.includes('DO 미등록');
  if(idle||unregistered)return name+' 고객은 '+(finite(r.customer.age)?r.customer.age+'세이며, ':'')+[idle?'현금성 장기대기':null,unregistered?'DO 미등록':null].filter(Boolean).join('와 ')+' 상태가 등록되어 있습니다. '+(idle?'현금성으로 유지하는 이유와 운용 의사를 확인하고, ':'')+(unregistered?'디폴트옵션 등록 여부를 상담할 필요가 있습니다.':'자금 사용계획에 맞는 운용 상담이 필요합니다.');
  return name+' 고객의 IRP 평가금액은 '+C.money(C.value(r,'irp_amount'))+'입니다. '+(labels.length?'등록된 '+labels.slice(0,2).join('·')+' 상태의 현재 상황과 고객 의사를 확인하는 상담이 필요합니다.':'추가 관리 사유가 확인되지 않아 현재 계획과 상담 필요 여부를 먼저 확인해야 합니다.');
 }
 function execute(state,request){
  let next=C.copy(state),q=C.copy(request),result={intent:q.type,resultStatus:'ok',answer:'',actions:[],metrics:{},uiEffect:'answer_only_keep_list',asOfDate:asOf};
  next.clarification=null;
  function finish(){result.mainListCaseIds=next.mainListCaseIds.slice();result.mainListCount=next.mainListCaseIds.length;result.contextLabel=next.contextLabel;next.lastResult=C.copy(result);return {state:next,result};}
  if(q.type==='query')return execute(state,resolve(q.text,Object.assign({},state,{clarification:null})));
  if(q.type==='cash_field')return execute(state,clarify(q.field==='현금성자산'?'기준 금액을 알려주세요.':'기준 비중을 알려주세요.',{kind:'cash_value',field:q.field},[]));
  if(q.type==='scope'){
   const chosen=state.clarification;if(!chosen||chosen.kind!=='scope')return execute(state,info('다시 확인할 고객 범위를 질문해 주세요.'));
   next.aggregate=null;
   if(q.target==='aggregate'){next.selection={baseIds:state.aggregate.ids.slice(),scope:'집계 고객 중',operations:[]};next.mainListCaseIds=state.aggregate.ids.slice();next.active=true;}
   const resolved=resolve(q.text,next);
   if(resolved.type==='info')return execute(state,resolved);
   if(resolved.type==='aggregate')return execute(Object.assign({},state,{aggregate:null}),Object.assign({},resolved,{ids:next.mainListCaseIds}));
   return execute(next,resolved);
  }
  if(q.type==='info'){result.answer=q.answer;result.actions=q.actions||[];result.resultStatus=q.status||'ok';if(q.clarification)next.clarification=q.clarification;return finish();}
  if(q.type==='reset'){next=initialState();result.answer='기존 고객 목록으로 돌아왔습니다.';result.uiEffect='apply_customer_list';return finish();}
  if(q.type==='brief'||q.type==='isa_amount'){
   const r=byId.get(q.id);if(!r)return execute(state,info('해당 고객을 현재 조회 범위에서 확인할 수 없습니다.'));
   next.selectedCustomerId=q.id;
   if(q.type==='brief')result.answer=brief(r);
   else {const rows=accounts(r),known=rows.filter(a=>finite(a.valuationAmountKrw));result.answer=known.length?'확인된 ISA 평가금액 합계는 '+C.money(known.reduce((n,a)=>n+a.valuationAmountKrw,0))+'입니다.'+(known.length<rows.length?' 일부 계좌 금액은 미확인입니다.':''):r.customer.name+' 고객의 ISA 평가금액은 현재 확인되지 않았습니다. IRP 잔액 '+C.money(C.value(r,'irp_amount'))+'은 별도 계좌 금액입니다.';}
   return finish();
  }
  if(q.type==='isa_facts'){
   const rows=pick(next.active?next.mainListCaseIds:allIds).flatMap(r=>upcoming(r).map(a=>({r,a})));
   result.answer=rows.length?rows.map(({r,a})=>r.customer.name+' 고객의 ISA 만기는 '+dateText(a.maturityDate)+'로, '+dateText(asOf)+' 기준 '+C.dayDiff(asOf,a.maturityDate)+'일 남았습니다.').join('\n'):'현재 범위에서 30일 이내로 확인된 ISA 만기일이 없습니다.';return finish();
  }
  if(q.type==='aggregate'){
   const subset=pick(q.ids||q.follow&&next.active&&next.mainListCaseIds||allIds),req={intent:'aggregate',query:q.query||C.all(),sort:normalSort,metric:q.metric};
   const out=C.execute(subset,C.initialState(subset),req,asOf);result=Object.assign(result,out.result,{intent:'aggregate',actions:[],uiEffect:'answer_only_keep_list'});
   const ids=result.resultPreviewCaseIds;next.aggregate={ids:ids.slice(),query:req.query};
   if(q.metric==='irp_sum'){const values=pick(ids).map(r=>C.value(r,'irp_amount')),known=values.filter(finite);result.answer='IRP 평가금액 합계는 '+C.money(known.length?known.reduce((a,b)=>a+b,0):ids.length?null:0)+'입니다. '+(known.length===ids.length?ids.length+'명 모두 금액이 확인되었습니다.':known.length+'명 확인 · '+(ids.length-known.length)+'명 미확인입니다.');result.metrics={irpAmountKrw:known.length?known.reduce((a,b)=>a+b,0):null,knownCount:known.length,unknownCount:ids.length-known.length};}
   if(q.metric==='overview')result.actions=[act('관리할 고객 추천',{type:'recommend'})];
   else if(ids.length)result.actions=[act('대상 고객 '+ids.length+'명 보기',{type:'show_ids',ids,query:req.query})];
   result.scopeNote=q.ids||q.follow?'현재 결과 기준':'현재 시연 목록 기준 · 자료 기준일 혼재';return finish();
  }
  if(q.type==='recommend'){
   const rec=recommendation();if(!rec.ids.length)return execute(state,info('확인된 관리정보에서 추천할 고객을 찾지 못했습니다. 기존 목록을 유지합니다.'));
   next.recommendation=rec;next.selection={baseIds:rec.ids.slice(),scope:'추천 고객 중',operations:[]};
  }else if(q.type==='restore_recommendation'){
   if(!next.recommendation)return execute(state,info('저장된 추천 결과가 없습니다.',{actions:[act('관리할 고객 추천',{type:'recommend'})]}));
   next.selection={baseIds:next.recommendation.ids.slice(),scope:'추천 고객 중',operations:[]};
  }else if(q.type==='show_ids'){
   const query=q.query&&same(C.run(records,q.query,normalSort).matchedCaseIds,q.ids)?q.query:{op:'case_ids',ids:q.ids.filter(id=>byId.has(id))};
   next.selection={baseIds:allIds.slice(),scope:'전체 고객 중',operations:[{type:'filter',query,key:++next.operationSequence}]};
   if(q.query)next.selection.operations[0].displayLabel=C.describe(q.query);
  }else if(q.type==='remove'){
   if(!next.selection)return execute(state,info('해제할 검색 조건이 없습니다.'));
   const before=JSON.stringify(next.selection.operations);
   next.selection.operations=next.selection.operations.flatMap(op=>{
    if(q.key!=null)return String(op.key)===String(q.key)?[]:[op];
    if(op.type!=='filter')return [op];
    const query=C.remove(op.query,x=>q.field?x.field===q.field:norm(x.label||'')===q.label);
    return query.op==='all_records'?[]:[Object.assign({},op,{query})];
   });
   if(before===JSON.stringify(next.selection.operations))return execute(state,info('해당 조건을 찾지 못했습니다. 목록 위의 조건을 확인해 주세요.'));
  }else if(q.type==='select'){
   if(!q.follow||!next.selection)next.selection={baseIds:allIds.slice(),scope:'전체 고객 중',operations:[]};
   if(q.query&&q.query.op!=='all_records')next.selection.operations.push({type:'filter',query:q.query,key:++next.operationSequence});
   if(q.sort)next.selection.operations.push({type:'sort',sort:q.sort,key:++next.operationSequence});
   if(q.limit!=null)next.selection.operations.push({type:'limit',limit:q.limit,key:++next.operationSequence});
  }else return execute(state,info('요청을 처리할 수 없습니다. 검색 조건을 다시 알려주세요.'));
  const selected=replay(next.selection),ids=selected.ids;
  next.active=true;next.aggregate=null;next.selectedCustomerId=null;next.mainListCaseIds=ids;next.mainUnknownCaseIds=selected.unknown;next.mainMatchedCount=ids.length;
  next.main={query:C.and(...next.selection.operations.filter(o=>o.type==='filter').map(o=>o.query)),sort:selected.sort,limit:selected.limit};next.reference=C.copy(next.main);
  next.conditionChips=conditionChips(next.selection).map(chip=>{const o=next.selection.operations.find(o=>o.key===chip.key);return Object.assign(chip,{label:o.displayLabel||chip.label});});
  next.contextLabel=next.selection.scope+' · '+ids.length+'명'+(next.conditionChips.length?' · '+next.conditionChips.map(c=>c.label).join(' · '):'');
  const recommended=next.selection.scope==='추천 고객 중'&&!next.selection.operations.length;
  next.listTitle=(recommended?'오늘 우선 확인할 고객':'AI 검색 결과')+' · '+ids.length+'명';
  result.uiEffect='apply_customer_list';result.matchedCount=ids.length;result.matchedCaseIds=ids.slice();result.resultPreviewCaseIds=ids.slice();result.resultPreviewCount=ids.length;result.unknownCount=selected.unknown.length;result.resolvedQuery=next.main.query;result.sort=next.main.sort;result.limit=next.main.limit;
  result.resultStatus=selected.unknown.length?'partial':ids.length?'ok':'empty';
  result.answer=q.type==='recommend'?'오늘 우선 확인할 고객은 '+ids.length+'명입니다.\n'+[next.recommendation.ids.some(id=>next.recommendation.reasons[id].some(r=>r.type==='transfer'))?'계약이전 의사확인':null,next.recommendation.ids.some(id=>next.recommendation.reasons[id].some(r=>r.type==='retirement'))?'퇴직급여 첫 운용 상담':null,next.recommendation.ids.some(id=>next.recommendation.reasons[id].some(r=>r.type==='isa'))?'ISA 만기자금 사용계획 확인':null].filter(Boolean).join(', ')+'이 필요합니다.':q.type==='restore_recommendation'?'처음 추천한 고객 '+ids.length+'명을 다시 표시했습니다.':(q.type==='remove'?'조건을 해제했습니다. ':'')+'조건에 맞는 고객은 '+ids.length+'명입니다.';
  if(selected.unknown.length)result.answer+='\n'+selected.unknown.length+'명은 정보가 부족해 조건 충족 여부를 확인할 수 없습니다.';
  if(q.metric){const out=C.execute(records,C.initialState(records),{intent:'aggregate',query:C.and({op:'case_ids',ids},q.query||C.all()),metric:q.metric,sort:normalSort},asOf);result.metrics=out.result.metrics;result.answer=out.result.answer;}
  if(!ids.length){const last=next.selection.operations.filter(o=>o.type==='filter').at(-1);if(last){const relaxed=C.copy(next.selection);relaxed.operations=relaxed.operations.filter(o=>o.key!==last.key);const count=replay(relaxed).ids.length;if(count>0){result.answer+='\n마지막 조건을 해제하면 '+count+'명을 다시 확인할 수 있습니다.';result.actions=[act('마지막 조건 해제 · '+count+'명',{type:'remove',key:last.key})];}}}
  else if(recommended)result.actions=ids.slice(0,3).map(id=>act(byId.get(id).customer.name+' 간단 브리핑',{type:'brief',id}));
  else if(ids.length===1)result.actions=[act('간단 브리핑',{type:'brief',id:ids[0]})];
  if(next.recommendation&&!recommended)result.actions.push(act('처음 추천 다시 보기',{type:'restore_recommendation'}));
  if(!result.actions.length&&ids.length>1){const fifty=C.and(C.compare('age','gte',50),C.compare('age','lte',59)),count=C.run(pick(ids),fifty).matchedCount;if(count>0&&count<ids.length)result.actions.push(act('50대만 · '+count+'명',{type:'select',follow:true,query:fifty}));}
  result.scopeNote=recommended?'확인된 관리정보 기준 · '+asOf:'현재 시연 목록 기준 · 자료 기준일 혼재';
  return finish();
 }
 return {initialState,resolve,execute,evidence,brief,records:()=>C.copy(records)};
}
return {create};
});

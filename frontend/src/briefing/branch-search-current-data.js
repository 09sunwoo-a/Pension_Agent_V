/* Read-only projection of the CURRENT main-list rows and CURRENT embedded fixtures.
 * No review-8 fixture, no extra customers, no changes to customer snapshots.
 */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.PensionBranchCurrentData=factory();
})(typeof window==='undefined'?globalThis:window,function(){
'use strict';
const copy=x=>JSON.parse(JSON.stringify(x));
const num=x=>typeof x==='number'&&Number.isFinite(x)?x:null;
const get=(x,p)=>p.reduce((v,k)=>v==null?undefined:v[k],x);
const own=(x,k)=>!!x&&Object.prototype.hasOwnProperty.call(x,k);
function money(text){
 if(typeof text==='number')return num(text);
 if(typeof text!=='string'||!text.trim())return null;
 const s=text.replace(/[\s,원]/g,'').replace(/[−–]/g,'-');
 if(/^-?\d+(?:\.\d+)?$/.test(s))return Number(s);
 let total=0,pos=0,matched=false;const re=/(-?\d+(?:\.\d+)?)(억|천만|만)/g;let m;
 while((m=re.exec(s))){if(m.index!==pos)return null;total+=Math.round(Number(m[1])*({'억':1e8,'천만':1e7,'만':1e4}[m[2]]));pos=re.lastIndex;matched=true;}
 return matched&&pos===s.length&&Number.isSafeInteger(total)?total:null;
}
function percent(x){if(typeof x==='number')return num(x);if(typeof x!=='string')return null;const t=x.replace(/[\s,%]/g,'').replace(/[−–]/g,'-');return /^[-+]?\d+(?:\.\d+)?$/.test(t)?Number(t):null;}
function date(x){if(typeof x!=='string')return null;const d=x.slice(0,10).replace(/\./g,'-');return /^\d{4}-\d{2}-\d{2}$/.test(d)?d:null;}
function supplement(raw){
 const ctx=raw['에이전트맥락데이터']||{},s={},a=get(ctx,['납입및세제','개인부담금자동이체']),p=get(ctx,['계좌운영','입금시매수상품']),d=get(ctx,['계좌운영','디폴트옵션실행예정']);
 if(a)s.autoTransfer={registered:typeof a['등록여부']==='boolean'?a['등록여부']:null,monthlyAmountKrw:num(a['월이체금액원'])};
 if(p)s.depositPurchase={configured:typeof p['설정여부']==='boolean'?p['설정여부']:null};
 if(d)s.defaultOptionExecution={scheduledAt:date(d['예정일']),amountKrw:num(d['대상금액원'])};
 s.externalAccounts=(ctx['외부계좌']||[]).map((a,i)=>({
  id:a['외부계좌식별자']||('recorded-external-'+i),
  type:a['계좌유형']||(a['외부계좌구분']==='ISA'?'ISA':a['외부계좌구분']),
  institution:a['금융기관']||null,valuationAmountKrw:num(a['평가금액원']),
  maturityDate:date(a['만기일']),verifiedAt:date(a['정보확인일']),source:a['정보출처']||null,
  liveIntegrated:a['통합조회가능여부']===true
 }));
 if(own(ctx['납입및세제'],'올해개인부담금납입액원'))s.annualContributionKrw=num(ctx['납입및세제']['올해개인부담금납입액원']);
 return s;
}
function fromCurrentRows(mainRows,embeddedFixtures,modelRows,profileGetter){
 if(!Array.isArray(mainRows))throw new Error('현재 고객 목록을 읽을 수 없습니다.');
 const raw=(embeddedFixtures&&embeddedFixtures.customers)||[],models=new Map((modelRows||[]).map(r=>[r.id,r]));
 const byCase=new Map(raw.map(r=>[r.briefingMeta.caseId,r]));
 const byCustomer=new Map(raw.filter(r=>r.customer.customerId).map(r=>[r.customer.customerId,r]));
 const records=[],warnings=[],seenRows=new Set();
 for(const row of mainRows){
  if(!row.id||seenRows.has(row.id))continue;seenRows.add(row.id);
  const model=models.get(row.id)||{};
  let profile={};try{profile=profileGetter?profileGetter(model)||{}:{};}catch(_){}
  let src=byCase.get(row.id)||byCustomer.get(model.cno||profile.pin);
  // Repository documents DEMO-01 as the structured twin of the existing ksy row.
  if(!src&&row.id==='ksy')src=byCase.get('DEMO-01');
  let r;
  if(src){
   r=copy(src);r.searchSupplement=supplement(src);
   r.searchSource={kind:'structured',sourceCaseId:src.briefingMeta.caseId,asOfDate:src.briefingMeta.asOfDate,displayOverrides:[]};
   r.briefingMeta.caseId=row.id;
  }else{
   r={briefingMeta:{caseId:row.id,asOfDate:null},
    customer:{customerId:model.cno||profile.pin||null,name:row.name||model.name||'',age:num(profile.age),starClubGrade:row.club||profile.club||null,investmentProfile:model.profile||null,irpOpenedAt:date(profile.acct),defaultOption:{registrationStatus:typeof profile.dopt==='boolean'?(profile.dopt?'등록':'미등록'):null}},
    irpAccount:{valuationAmountKrw:null,oneYearReturnPct:null,taxDeductionRemainingKrw:null,assetAllocation:[]},holdings:null,signals:[],searchSupplement:{},
    searchSource:{kind:'display-only',sourceCaseId:null,asOfDate:null,displayOverrides:[]}};
   // These are current model facts, not invented legacy-to-JSON customer records.
   // Do not infer cash/holdings/tax amounts from rounded display labels or missing arrays.
   if(num(model.taxRemainingKrw)!==null)r.irpAccount.taxDeductionRemainingKrw=model.taxRemainingKrw;
  }
  r.customer.name=row.name||r.customer.name;
  if(row.club)r.customer.starClubGrade=row.club;
  const currentBalance=money(row.bal),currentReturn=percent(row.ret);
  if(currentBalance!==null&&r.irpAccount.valuationAmountKrw!==currentBalance){
   if(src)r.searchSource.displayOverrides.push('valuationAmountKrw');
   r.irpAccount.valuationAmountKrw=currentBalance;
  }
  if(currentReturn!==null&&r.irpAccount.oneYearReturnPct!==currentReturn){
   if(src)r.searchSource.displayOverrides.push('oneYearReturnPct');
   r.irpAccount.oneYearReturnPct=currentReturn;
  }
  // Keep exactly the state labels exposed by the CURRENT row. A missing badge is
  // not evidence of absent behaviour. Attach a date only when the original agrees.
  const originalSignals=src&&Array.isArray(src.signals)?src.signals:[];
  if(Array.isArray(row.tags))r.signals=row.tags.map(t=>{
   const label=t.t||t.label||'';const old=originalSignals.find(s=>s.label===label);
   return Object.assign({},old?copy(old):{}, {label,source:old&&old.source||'현재 메인 목록의 표시 뱃지'});
  }).filter(x=>x.label);
  const triggers={};for(const k of ['risk','mat','imp','opp'])triggers[k]=own(model,k)?!!model[k]:null;
  r.searchSupplement.triggers=triggers;
  if(r.searchSource.displayOverrides.length)warnings.push({caseId:row.id,kind:'display-vs-snapshot',fields:r.searchSource.displayOverrides});
  r.searchSource.originalOrder=records.length;records.push(r);
 }
 const counts={};for(const r of records){const d=r.searchSource.asOfDate;if(d)counts[d]=(counts[d]||0)+1;}
 const dates=Object.keys(counts).sort((a,b)=>counts[b]-counts[a]||b.localeCompare(a));
 const asOfDate=dates[0]||null;
 const knownDates=Object.keys(counts).sort();
 return {metadata:{scopeId:'current-main-list',scopeLabel:'현재 메인 목록',recordCount:records.length,
  structuredCount:records.filter(r=>r.searchSource.kind==='structured').length,
  displayOnlyCount:records.filter(r=>r.searchSource.kind==='display-only').length,
  asOfDate,knownDates,mixedDates:knownDates.length>1,
  source:'frontend/briefing-fabrix + PensionBriefingFixtures + original main-list rows',warnings,
  scopeNote:'현재 메인 목록에 포함된 시연 고객만 조회합니다. 상단 부점 전체 예시 통계와 별도 범위입니다. 상세 원본이 없는 값은 미확인으로 처리합니다.'},records};
}
return {fromCurrentRows,supplement,money,percent,date};
});

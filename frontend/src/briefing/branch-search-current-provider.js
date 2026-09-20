/* Bounded mock interpreter. Queries are evaluated against current data, not golden answers. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./branch-search-core'));else root.PensionBranchCurrentProvider=factory(root.PensionBranchSearchCore);})(typeof window==='undefined'?globalThis:window,function(C){
'use strict';
const norm=t=>String(t).trim().replace(/[?!？。·,]/g,'').replace(/\.$/,'').replace(/\s/g,'').toLowerCase();
const fields={'irp잔액':'irp_amount','irp평가금액':'irp_amount','잔액':'irp_amount','현금성자산':'cash_amount','현금성잔액':'cash_amount','현금성비중':'cash_pct','원리금보장비중':'protected_pct','연령':'age','나이':'age','계좌수익률':'return_pct','수익률':'return_pct','세액공제잔여한도':'tax_remaining'};
const err=text=>({error:'clarification_required',answer:text});
function segmentRegistry(records){
 const labels=new Map();
 const approved=['퇴직금 운용 미지시','퇴직금 일부만 운용','현금성 장기대기','현금성 과다','만기자금 미운용','납입금 미운용','입금매수상품 미지정','원리금보장 편중','수익률 부진','환매추천 펀드 보유','판매중단 펀드 보유','저금리 예금 보유','DO 미등록','투자성향-DO불일치','타행 IRP 보유','타사 연금저축 보유','복수 IRP 보유','연금자산 분산보유','이탈징후','계약이전 신청','계약이전 페이지 방문','연금개시 가능','연금개시 예정','연금수령 중','올해 미납입','납입 중단','퇴직연금 관리화면 방문','ETF 상품조회','펀드 상품조회','보유상품 수익률 조회','장기 미운용'];
 for(const label of approved)labels.set(norm(label),{op:'segment_registered',label});
 for(const label of ['정기예금 만기','GIC 만기','ISA 만기','ISA 전환기한','DO 실행','퇴직금 재입금기한','연금개시','추가납입'])labels.set(norm(label),{op:'segment_family',label});
 for(const r of records)for(const s of r.signals||[]){
  labels.set(norm(s.label),{op:'segment_registered',label:s.label});
  const m=s.label.match(/^(.*) D-\d+$/);if(m)labels.set(norm(m[1]),{op:'segment_family',label:m[1]});
 }
 return labels;
}
// Shared by the provider and data build; includes registered badges and families.
function segmentLabels(records){return [...new Set([...segmentRegistry(records).values()].map(x=>x.label))].sort();}
function create(input){
 const labels=segmentRegistry(input.records);
 if(labels.has('etf상품조회'))labels.set('etf조회',labels.get('etf상품조회'));
 if(labels.has('펀드상품조회'))labels.set('펀드조회',labels.get('펀드상품조회'));
 const simpleClause=raw=>{
  let n=raw.replace(/(이고|이면서|등록된|이있는|이있음|한|인)?고객(만)?$/,'').replace(/(한|인|등록된)$/,'');
  if(labels.has(n))return C.copy(labels.get(n));
  if(['vip','vvip','그랜드','베스트'].includes(n))return C.compare('grade','eq',({vip:'VIP',vvip:'VVIP'}[n]||n));
  let m=n.match(/^(\d{1,2})대$/);if(m){const age=Number(m[1]);if(age%10)return null;return C.and(C.compare('age','gte',age),C.compare('age','lte',age+9));}
  m=n.match(/^(?:(irp잔액|irp평가금액|잔액|현금성자산|현금성잔액|현금성비중|원리금보장비중|연령|나이|계좌수익률|수익률|세액공제잔여한도))?([-+]?\d+(?:\.\d+)?)(억원|억|천만원|천만|만원|만|원|%|세)(이상|이하|초과|미만)$/);
  if(m){const f=m[1]?fields[m[1]]:m[3]==='세'?'age':null;if(!f)return null;
   const monetary=f.endsWith('_amount')||f==='tax_remaining';
   if(f==='age'&&m[3]!=='세'||f.endsWith('_pct')&&m[3]!=='%'||monetary&&!['억원','억','천만원','천만','만원','만','원'].includes(m[3]))return null;
   const v=(f.endsWith('_pct')?x=>x:Math.round)(Number(m[2])*({'억원':1e8,'억':1e8,'천만원':1e7,'천만':1e7,'만원':1e4,'만':1e4,'원':1,'%':1,'세':1}[m[3]]));
   return C.compare(f,{'이상':'gte','이하':'lte','초과':'gt','미만':'lt'}[m[4]],v);
  }
  const person=input.records.find(r=>norm(r.customer.name)===n);if(person)return C.compare('name','eq',person.customer.name);
  return null;
 };
 return function(text,state){
  const asOf=input.metadata.asOfDate;
  const base=C.resolve(text,state,asOf||'1900-01-01');
  if(!asOf&&base.query&&/between/.test(JSON.stringify(base.query)))return err('공통 분석 기준일이 확인되지 않아 기간 조건을 계산할 수 없습니다.');
  if(!base.error||base.error!=='unsupported_mock'){if(base.sort&&base.sort.field==='caseId')base.sort={field:'source_order',direction:'asc'};return base;}
  let n=norm(text).replace(/^우리부점(에서|의)?/,'').replace(/^현재(메인)?목록(에서|의)?/,'');
  const follow=/^(그중|이중)/.test(n);n=n.replace(/^(그중|이중)/,'');
  const prior=state.reference;
  if(follow&&!prior)return err('이어갈 검색조건이 없습니다. 먼저 찾고 싶은 고객 조건을 알려주세요.');
  let out={intent:'extract',query:follow?C.copy(prior.query):C.all(),sort:follow?C.copy(prior.sort):{field:'source_order',direction:'asc'},limit:follow?prior.limit:null};
  let m=n.match(/^(irp잔액|잔액|현금성자산|현금성비중|원리금보장비중|수익률)(큰|많은|높은|작은|적은|낮은)순으로(?:상위)?(\d+)명만(?:보여줘|남겨줘)?$/);
  if(m){if(!follow&&prior)out=Object.assign(out,C.copy(prior),{intent:'extract',metric:null});out.sort={field:fields[m[1]],direction:['큰','많은','높은'].includes(m[2])?'desc':'asc'};out.limit=Number(m[3]);return out;}
  m=n.match(/^(.+)조건(?:은|만)?(?:빼줘|빼자|삭제해줘|해제해줘)$/);
  if(m){if(!prior)return err('삭제할 검색조건이 없습니다.');const key=m[1],f=fields[key],seg=labels.get(key);if(!f&&!seg)return base;
   out=Object.assign(out,C.copy(prior),{intent:'extract',metric:null});out.query=C.remove(out.query,q=>f?q.field===f:(q.label===seg.label));return out;
  }
  if(/(몇명이야|몇명이있어|몇명인지알려줘)$/.test(n)){out.intent='aggregate';n=n.replace(/(몇명이야|몇명이있어|몇명인지알려줘)$/,'').replace(/(은|는|이|가)$/,'');}
  else n=n.replace(/(보여줘|찾아줘|추려줘|남겨줘)$/,'');
  n=n.replace(/만$/,'');
  const hasOr=/(또는|이거나)/.test(n),hasAnd=/(이면서|이고|그리고|고객중|중에서)/.test(n);
  if(hasOr&&hasAnd)return err('“또는”과 “그리고”가 함께 있어 결합 기준을 확인해야 합니다. 조건을 두 묶음으로 나눠 알려주세요.');
  const parts=n.split(/(?:이면서|이고|그리고|고객중|중에서|또는|이거나)/).filter(Boolean),terms=parts.map(simpleClause);
  if(!parts.length||terms.some(x=>!x))return {error:'unsupported_mock',answer:'현재는 정해진 조회 규칙으로 동작하는 목업입니다. 이 문장을 임의의 조건으로 바꾸지 않았습니다. 예시 질문 또는 현재 뱃지명과 금액 조건을 사용해 주세요. 기존 목록은 유지합니다.'};
  const q=hasOr?{op:'or',args:terms}:C.and(...terms);out.query=follow?C.and(prior.query,q):q;return out;
 };
}
return {create,segmentLabels};
});

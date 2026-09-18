/* Shared additive search-result row. Existing dashboard/rows/filter CSS is never changed. */
(function(root){'use strict';
 const C=root.PensionBranchSearchCore;
 function bar(session,onRestore){
  const el=document.createElement('section');el.className='pad-branch-resultbar';el.setAttribute('aria-label','AI 검색 결과 조건');
  const state=session.get().state,meta=session.metadata();
  const head=document.createElement('div');head.className='pad-branch-resulthead';
  const title=document.createElement('span');title.className='pad-branch-resulttitle';title.textContent='AI 검색 결과';
  const count=document.createElement('span');count.className='pad-branch-resultcount';count.textContent='조건 일치 '+state.mainMatchedCount+'명 · '+state.mainListCaseIds.length+'명 표시';
  const scope=document.createElement('span');scope.className='pad-branch-resultscope';scope.textContent=(meta.scopeLabel||'조회 대상')+' '+meta.recordCount+'명 · '+(meta.asOfDate?meta.asOfDate.replace(/-/g,'.')+' 기준':'기준일 미확인');
  const actions=document.createElement('div');actions.className='pad-branch-resultactions';
  [['전체 조건 해제',()=>session.reset()],['기존 목록으로',onRestore]].forEach(([label,fn])=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',fn);actions.appendChild(b);});
  head.append(title,count,scope,actions);el.appendChild(head);
  const chips=document.createElement('div');chips.className='pad-branch-resultchips';
  C.chips(state.main.query).forEach(ch=>{const b=document.createElement('button');b.type='button';b.className='pad-branch-resultchip';b.setAttribute('aria-label',ch.label+' 조건 삭제');b.textContent=ch.label+' ×';b.addEventListener('click',()=>session.removeChip(ch.key));chips.appendChild(b);});
  const sort=document.createElement('span');sort.className='pad-branch-resultsort';sort.textContent=C.sortLabel(state.main.sort)+(state.main.limit?' · 상위 '+state.main.limit+'명':'');chips.appendChild(sort);el.appendChild(chips);
  if(state.mainUnknownCaseIds.length){const d=document.createElement('details');d.className='pad-branch-resultunknown';const s=document.createElement('summary');s.textContent='확인 필요 '+state.mainUnknownCaseIds.length+'명';const p=document.createElement('p');p.textContent=state.mainUnknownCaseIds.map(id=>session.records().find(r=>C.idOf(r)===id).customer.name).join(' · ')+' — 관련 값이 미확인이어서 조건 충족 여부를 판단하지 않았습니다.';d.append(s,p);el.appendChild(d);}
  const status=document.createElement('div');status.className='pad-branch-list-status';status.setAttribute('role','status');status.textContent=session.get().busy?'고객 조회 중… 기존 목록을 유지합니다.':'';el.appendChild(status);return el;
 }
 function manual(session,e){
  e=e||{};let q=session.get().state.main.query;
  q=C.remove(q,x=>x.source==='legacy-filter');
  const add=(x)=>{x.source='legacy-filter';q=C.and(q,x);};
  if(e.dep==='lt1')add(C.compare('irp_amount','lt',100000000));
  if(e.dep==='1to2'){add(C.compare('irp_amount','gte',100000000));add(C.compare('irp_amount','lt',200000000));};
  if(e.dep==='gt2')add(C.compare('irp_amount','gte',200000000));
  const profiles={st:['안정형','안정추구형'],nu:['위험중립형'],ag:['적극투자형','공격투자형']};
  if(profiles[e.inv])add({op:'or',args:profiles[e.inv].map(x=>C.compare('profile','eq',x))});
  if(e.taxOnly)add(C.compare('tax_remaining','gt',0));
  if(['risk','mat','imp','opp'].includes(e.trig)) add(C.compare('trigger_'+e.trig,'eq',true));
  return {query:q,sort:session.get().state.main.sort,limit:e.topN||null};
 }
 root.PensionBranchPreserveUI={bar,manual};
})(window);

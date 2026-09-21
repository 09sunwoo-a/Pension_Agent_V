/* Current-data golden conversation and state invariants; no answers loaded by runtime. */
'use strict';
const assert=require('assert/strict');
const E=require('../../frontend/src/briefing/branch-search-conversation');
const Session=require('../../frontend/src/briefing/branch-search-session');
const clone=x=>JSON.parse(JSON.stringify(x));
async function check(source){
 source=clone(source);const original=JSON.stringify(source),engine=E.create(source),rec=['B04-23','B06-13','C01-10'],idle=['C01-09','jmr','jmj','B08-01','C01-01'];
 let state=engine.initialState();
 const reset=()=>state=engine.initialState();
 const send=(text,action)=>{const before=JSON.stringify(state);const request=engine.resolve(text,state,action),out=engine.execute(state,request);assert.equal(JSON.stringify(state),before,'Execution must not mutate prior state');state=out.state;assert(!['unsupported_mock'].includes(out.result.resultStatus),text);return out.result;};
 const ids=expected=>assert.deepEqual(state.mainListCaseIds,expected);
 const recommend=()=>{send('오늘 중점적으로 관리할 고객은 누구야?');ids(rec);};
 // S: ordered edits must replay from the original scope, not from the last subset.
 send('현금성 장기대기 고객 보여줘');ids(idle);
 send('그중 40대 고객만 보여줘');ids(['jmr','B08-01']);
 send('DO 미등록 조건도 추가해줘');ids(['jmr']);assert.equal(state.conditionChips.length,3);
 let r=send('이 고객 브리핑해줘');assert.match(r.answer,/41세/);assert(!/10주|1천만원/.test(r.answer));ids(['jmr']);
 const ageChip=state.conditionChips.find(c=>c.label.includes('연령'));
 const beforeRemove=clone(state);send('나이 조건 빼줘');ids(['jmr','C01-01']);
 const removedBySpeech=clone(state.mainListCaseIds);state=beforeRemove;send('조건 해제',{type:'remove',key:ageChip.key});ids(removedBySpeech);
 send('DO 미등록 조건도 빼줘');ids(idle);
 send('정미경 고객 찾아줘');ids(['B04-23']);
 r=send('납입금 미운용 고객 찾아주고 현금 합계도 알려줘');ids(['B02-04','B02-27']);assert.equal(r.metrics.cashAmountKrw,3150000);
 r=send('IRP 잔액 7천만원 이상 고객 보여줘');assert.equal(state.mainListCaseIds.length,41);assert(!source.records.some(c=>r.answer.includes(c.customer.name)));
 // H: aggregates never overwrite the current list; target actions do.
 recommend();const title=state.listTitle;
 r=send('오늘 부점 현황 말해줘');ids(rec);assert.equal(state.listTitle,title);assert.equal(r.metrics.customerCount,57);assert.equal(r.metrics.irpAmountKrw,7855840000);
 r=send('우리 부점 현금성자산 합계는 얼마야?');ids(rec);assert.equal(r.metrics.cashAmountKrw,935230000);assert.equal(r.metrics.cashUnknownCount,15);
 r=send('현금성 장기대기 고객은 몇 명이야?');ids(rec);assert.equal(r.matchedCount,5);
 send(r.actions[0].label,r.actions[0].command);ids(idle);send('그중 40대 고객만 보여줘');ids(['jmr','B08-01']);
 r=send('납입금 미운용 고객 몇 명이고 현금 합계 얼마야?');ids(['jmr','B08-01']);assert.equal(r.metrics.cashAmountKrw,3150000);
 r=send('ISA 만기 고객 몇명이냐?');ids(['jmr','B08-01']);assert.equal(r.matchedCount,3);
 send(r.actions[0].label,r.actions[0].command);assert.deepEqual([...state.mainListCaseIds].sort(),['B01-03','B01-22','C01-10']);
 // R/B: evidence, facts, sums, named briefings and restore.
 recommend();
 for(const [q,pattern] of [['정미경 간단히 브리핑해줘',/6,870만원.*수수료/],['신경호는 어떻게 관리하면 돼?',/1억 6,470만원.*25일/],['오민서는 왜 관리해야 해?',/6,350만원.*ISA 만기 D-8/]]){r=send(q);assert.match(r.answer,pattern);ids(rec);assert.equal(r.uiEffect,'answer_only_keep_list');}
 send('그중 퇴직금 운용 미지시 고객만 보여줘');ids(['B06-13']);send('처음 추천한 고객 다시 보여줘');ids(rec);
 r=send('이 3명의 IRP 잔액 합계는?');ids(rec);assert.equal(r.metrics.irpAmountKrw,278400000);
 r=send('ISA 만기가 가까운 고객은 누구고 언제 만기야?');ids(rec);assert.match(r.answer,/김서연.*1일/);
 send('그중 ISA 만기 고객만 보여줘');ids(['C01-10']);r=send('이 고객의 ISA 만기자금은 얼마야?');assert.match(r.answer,/8,000만원/);
 recommend();send('그중 IRP 잔액 큰 순으로 2명만 보여줘');ids(['B06-13','B04-23']);send('그중 ISA 만기 고객만 보여줘');ids([]);
 // X: target selection, zero recovery, clarification and ambiguous aggregate references.
 recommend();r=send('이 고객 브리핑해줘');ids(rec);assert.equal(r.resultStatus,'clarification_required');send(r.actions[1].label,r.actions[1].command);assert.match(state.lastResult.answer,/신경호/);ids(rec);
 recommend();r=send('그중 IRP 2억원 이상만');ids([]);assert.match(r.answer,/3명/);send('잔액 조건 빼줘');ids(rec);
 r=send('어제보다 관리할 고객 늘었어?');ids(rec);assert.match(r.answer,/자료/);
 send('현금 많은 고객');ids(rec);send('금액');ids(rec);r=send('500만원 이상');assert.equal(r.matchedCount,19);assert.equal(r.unknownCount,15);
 recommend();send('납입금 미운용 고객 몇 명이고 현금 합계 얼마야?');r=send('그중 잔액 큰 순으로');ids(rec);assert.equal(r.resultStatus,'clarification_required');send(r.actions[1].label,r.actions[1].command);assert.deepEqual([...state.mainListCaseIds].sort(),['B02-04','B02-27']);
 reset();r=send('처음 추천 다시 보여줘');assert.match(r.answer,/저장된 추천/);assert.equal(state.active,false);
 r=send('운용금액 7천만원 이상 고객 보여줘');assert.equal(r.resultStatus,'clarification_required');r=send(r.actions[0].label,r.actions[0].command);assert.equal(r.matchedCount,41);
 send('앞으로 30일 이내 ISA 만기 고객을 보여주고, 확인된 ISA 평가금액도 알려줘.');ids(['C01-10','B01-03','B01-22']);
 r=send('오늘 ISA 만기 고객은 몇 명이야?');ids(['C01-10','B01-03','B01-22']);send(r.actions[0].label,r.actions[0].command);ids([]);
 // Actual data filtering, decimal comparisons and data-derived recommendation.
 const expected=source.records.filter(r=>typeof r.irpAccount.oneYearReturnPct==='number'&&r.irpAccount.oneYearReturnPct<2.5).map(r=>r.briefingMeta.caseId);
 send('수익률 2.5% 미만 고객 보여줘');assert.deepEqual([...state.mainListCaseIds].sort(),expected.sort());
 const extra=clone(source),customer=clone(extra.records.find(r=>r.briefingMeta.caseId==='B04-23'));customer.briefingMeta.caseId='dynamic-case';customer.customer.customerId='dynamic-customer';customer.customer.name='추가시연';extra.records.push(customer);
 const dynamic=E.create(extra),out=dynamic.execute(dynamic.initialState(),{type:'recommend'});assert.equal(out.state.mainListCaseIds.length,4);assert(out.state.mainListCaseIds.includes('dynamic-case'));
 customer.searchSupplement.management.transfer.status='완료';const completed=E.create(extra);assert.equal(completed.execute(completed.initialState(),{type:'recommend'}).state.mainListCaseIds.length,3);
 // Session state across new conversation, reset, late completion and rejected provider.
 const session=Session.create(source,{mode:'local',engine,latency:5});await session.send('오늘 우선 관리할 고객 추천해줘');await session.send('그중 퇴직금 운용 미지시 고객만 보여줘');session.newConversation();assert.deepEqual(session.get().state.mainListCaseIds,['B06-13']);r=await session.send('이 고객 브리핑해줘');assert.match(r.answer,/신경호/);
 await session.send('처음 추천 다시 보여줘');assert.deepEqual(session.get().state.mainListCaseIds,rec);
 const events=[];const off=session.subscribe(e=>{if(e.type==='resolved')events.push(e.listChange);});await session.send('오늘 부점 현황 말해줘');assert.equal(events.at(-1),false);await session.send('현금성 장기대기 고객 보여줘');assert.equal(events.at(-1),true);off();
 const keep=clone(session.get().state);const pending=session.send('오늘 우선 관리할 고객 추천해줘');session.cancel();assert.equal(await pending,null);assert.deepEqual(session.get().state,keep);
 session.reset();assert.equal(session.get().state.active,false);assert.equal(session.get().state.recommendation,null);const resetState=clone(session.get().state);
 const p1=session.send('오늘 우선 관리할 고객 추천해줘'),p2=session.send('정미경 고객 찾아줘');await Promise.all([p1,p2]);assert.deepEqual(session.get().state.mainListCaseIds,['B04-23']);session.destroy();
 const failing=Session.create(source,{mode:'local',engine:{initialState:()=>resetState,resolve:()=>Promise.reject(Error('test failure')),execute:()=>assert.fail('Must not execute on failure')}});await failing.send('조회');assert.deepEqual(failing.get().state,resetState);assert(failing.get().messages.at(-1).error);failing.destroy();
 assert.equal(JSON.stringify(source),original,'Customer input stays unchanged');
 console.log('PASS: current-data S/H/R/B/X golden conversations, evidence, ordered edits, actions, unknowns, cancellation and reset');
}
module.exports=check;
if(require.main===module){
 const vm=require('vm'),b=require('../../tools/briefing/build'),ctx={window:{},document:{},console,setTimeout,clearTimeout,setInterval,clearInterval,URL,AbortController,TextDecoder};
 vm.runInNewContext(b.artifacts()['pensionAgentDemo.js'].replace('  // Starroot adapter','  window.TestComponent=Component;\n  // Starroot adapter'),ctx);
 const w=ctx.window,p=new w.TestComponent({});p.setState=x=>Object.assign(p.state,typeof x==='function'?x(p.state):x);
 check(w.PensionBranchCurrentData.fromCurrentRows(p.renderVals().queue,w.PensionBriefingFixtures,p.DATA,c=>p.profileOf(c))).catch(e=>{console.error(e);process.exitCode=1;});
}

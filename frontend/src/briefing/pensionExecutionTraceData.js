/* 오늘의 부점 브리핑 처리 이력 — 데이터 구성.
 * 프론트 안에서 완결되는 목업이다. 전일·금일 1,392명 가상 스냅샷을 고정 seed로 만들고,
 * 세그먼트 변화·추가납입 상담 후보(12→9→6명)·Gemma 4 호출·FabriX 조회 경로를 하나의 기준 시각과
 * offset으로 기록한다. 실제 Agent·LLM·FabriX 호출, 고객 원본, manifest, 검색 결과에는 관여하지 않는다.
 * 모든 기록은 origin:'frontend_fixture', isSimulated:true 를 가진다. 렌더러는 pensionExecutionTracePanel.js.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./pensionDisplayDate'));
  else root.PensionExecutionTraceData = factory(root.PensionDisplayDate);
})(typeof window === 'undefined' ? globalThis : window, function (DD) {
  'use strict';
  // 목업을 작성한 기준일 D0. 실제 기준일 AS_OF는 화면 표시 기준일(오늘, pensionDisplayDate.js)이며, 작성된 날짜는 전부 그 차이(OFFSET)만큼 옮긴다.
  // 시드는 날짜와 무관하게 고정이라 고객·금액·세그먼트 결과는 매일 같고 날짜만 당일 기준으로 움직인다.
  var D0 = '2026-09-29', AS_OF = D0, PREV = '2026-09-28', OFFSET = 0, SEED = 20260929, COUNT = 1392, BRANCH = '여의도종합금융센터';
  var TIMEZONE = 'Asia/Seoul';
  var MODEL = { display: 'Gemma 4', model: 'gemma-4-31b-it', deployment: 'gemma-4-31b-nvidia-fp4-h100' };
  // 기존 화면과 같은 값: 부점 잔액 526.8억(▲1.3억), 적립금 1억 이상 고객이 전체 적립금의 45.3%.
  var TOTAL_PREV = 52550000000, TOTAL_CURR = 52680000000, BIG_SHARE_CURR = 0.453;
  var MAN = 10000;
  var BRIEFING_TEXT = '전일 급여가 입금된 고객 중 세액공제 잔여한도가 있고,\n과거 추가납입 이력이 있는 고객 6명을 찾았습니다.\n자금 여력을 확인하고, 추가납입 시 세제혜택과 입금 후 운용방법을 함께 안내해 보세요.';

  /* ---------- 결정적 난수·날짜·시각 ---------- */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var pad = function (n, w) { var s = String(n); while (s.length < w) s = '0' + s; return s; };
  var DAY = 86400000;
  var toDays = function (s) { return Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) / DAY; };
  var fromDays = function (d) { var t = new Date(d * DAY); return t.getUTCFullYear() + '-' + pad(t.getUTCMonth() + 1, 2) + '-' + pad(t.getUTCDate(), 2); };
  var addDays = function (s, n) { return fromDays(toDays(s) + n); };
  var daysBetween = function (from, to) { return toDays(to) - toDays(from); };
  var rel = function (authored) { return addDays(authored, OFFSET); }; // 작성 당시 날짜 → 현재 기준일 세계의 같은 날짜
  var md = function (day) { return (+day.slice(5, 7)) + '/' + (+day.slice(8, 10)); };
  var anchored = false;
  function anchor() {
    var day = DD && DD.today ? DD.today() : D0;
    if (anchored && day === AS_OF) return;
    anchored = true; AS_OF = day; PREV = addDays(AS_OF, -1); OFFSET = daysBetween(D0, AS_OF); cached = null;
    SEGMENTS.forEach(function (s) { if (s.key === 'salary_deposit') s.rule = '스냅샷 직전 달력일의 일반계좌 급여입금 거래 존재 (전일 스냅샷 ' + md(addDays(PREV, -1)) + ', 금일 스냅샷 ' + md(PREV) + ')'; });
  }
  var copy = function (x) { return JSON.parse(JSON.stringify(x)); };
  // 기준 시각은 프론트가 처음 렌더링된 실제 시각(setBase)이다. 화면이 뜨자마자 브리핑을 요청하고, 그 요청 안에서
  // 생성(20초)이 수행된 뒤 응답이 돌아온 것처럼 모든 시각을 이 기준의 ms offset으로 계산한다.
  var baseMs = null, GEN = 150; // 요청 전달 뒤 150ms에 생성 시작
  function setBase(ms) { if (typeof ms === 'number' && ms !== baseMs) { baseMs = ms; cached = null; } }
  function stamp(offsetMs) {
    if (baseMs == null) baseMs = Date.now();
    return new Date(baseMs + offsetMs).toISOString();
  }
  function clockOf(iso) { return iso.slice(11, 23); }

  /* ---------- 가상 고객 스냅샷 ---------- */
  var GRADES = ['일반', '베스트', '그랜드', 'VIP', 'VVIP'], GRADE_W = [0.34, 0.24, 0.2, 0.15, 0.07];
  var PROFILES = ['안정형', '안정추구형', '위험중립형', '적극투자형', '공격투자형'], PROFILE_W = [0.22, 0.34, 0.24, 0.14, 0.06];
  var SUMMARIES = ['연금개시 시기 문의', '디폴트옵션 안내', '추가납입 세제혜택 안내', '정기예금 만기 후 운용 상담', 'ISA 만기자금 이전 문의', '수익률 점검 요청', '계약이전 절차 문의', '퇴직급여 수령 방법 안내'];
  function pick(r, list, weights) {
    var x = r(), acc = 0;
    for (var i = 0; i < list.length; i++) { acc += weights ? weights[i] : 1 / list.length; if (x < acc) return list[i]; }
    return list[list.length - 1];
  }
  var between = function (r, lo, hi) { return lo + Math.floor(r() * (hi - lo + 1)); };
  var man = function (r, lo, hi) { return between(r, lo, hi) * MAN; };
  var dateBetween = function (r, from, to) { return addDays(from, between(r, 0, daysBetween(from, to))); };
  function shuffled(r, n) { var a = []; for (var i = 0; i < n; i++) a.push(i); for (var j = n - 1; j > 0; j--) { var k = Math.floor(r() * (j + 1)); var t = a[j]; a[j] = a[k]; a[k] = t; } return a; }

  function baseCustomer(r, i) {
    var age = between(r, 27, 64), opened = dateBetween(r, rel('2012-01-01'), rel('2026-06-30'));
    var contributed = pick(r, [0, 1200000, 2400000, 3600000, 4800000, 6000000, 7200000, 9000000], [0.18, 0.12, 0.14, 0.14, 0.14, 0.1, 0.08, 0.1]);
    var history = [];
    if (r() < 0.32) { var n = between(r, 1, 3); for (var k = 0; k < n; k++) history.push({ date: dateBetween(r, rel('2024-01-10'), rel('2025-12-20')), amountKrw: man(r, 50, 300) }); history.sort(function (a, b) { return a.date < b.date ? -1 : 1; }); }
    return {
      // 화면과 같은 고객식별자 표기(5자리-5자리, 10자리). i마다 유일하며 실제 개인정보가 아니다.
      customerId: pad(10000 + ((i * 7919) % 90000), 5) + '-' + pad(10000 + ((i * 104729 + 12345) % 90000), 5),
      profile: { age: age, grade: pick(r, GRADES, GRADE_W), investmentProfile: pick(r, PROFILES, PROFILE_W), irpOpenedAt: opened },
      account: { valuationAmountKrw: 0, oneYearReturnPct: 0, cashAmountKrw: 0, cashPct: 0 },
      operation: { lastInstructionDate: dateBetween(r, rel('2026-08-30'), rel('2026-09-27')), depositPurchaseConfigured: r() < 0.65, defaultOptionRegistered: true },
      maturities: [],
      contribution: { annualContributionKrw: contributed, taxDeductionRemainingKrw: 9000000 - contributed, pastExtraContributions: history, pendingContributionKrw: 0 },
      payout: { pensionEligible: false, pensionStarted: false },
      signals: { churnRisk: false, churnReasons: [], transfer: null, contributionStopped: contributed === 0 && r() < 0.5 },
      transactions: [],
      counseling: { lastCounselingDate: r() < 0.55 ? dateBetween(r, rel('2026-03-01'), rel('2026-09-20')) : null, summary: null }
    };
  }
  function setValuation(c, amount, pct) {
    c.account.valuationAmountKrw = amount;
    c.account.cashAmountKrw = Math.round(amount * pct / 100 / MAN) * MAN;
    c.account.cashPct = Math.round(c.account.cashAmountKrw / amount * 1000) / 10;
  }
  function recomputeCashPct(c) { c.account.cashPct = Math.round(c.account.cashAmountKrw / c.account.valuationAmountKrw * 1000) / 10; }

  function generate() {
    var r = rng(SEED), customers = [], i;
    for (i = 0; i < COUNT; i++) customers.push(baseCustomer(r, i));
    var order = shuffled(r, COUNT), cursor = 0;
    var take = function (n) { var out = order.slice(cursor, cursor + n); cursor += n; return out; };
    // 금일 사실이 바뀌는 고객(스크립트). 서로 겹치지 않으며, 집계 대상 속성은 아래에서 명시적으로 정한다.
    var roles = {
      salary: take(12), returnUp: take(4), balanceCross: take(1), retirementDeposit: take(1), routine: take(30),
      churnTransfer: take(1), churnOnly: take(1), doRegistered: take(1), pendingPlain: take(1), cashFact: take(1)
    };
    var scripted = {};
    Object.keys(roles).forEach(function (k) { roles[k].forEach(function (idx) { scripted[idx] = k; }); });
    var pool = order.slice(cursor);
    // 날짜 경과만으로 세그먼트가 바뀌는 고객(사실 변경 없음)은 pool 앞쪽에서 따로 뗀다.
    var dateOnly = { tdEnter: pool.splice(0, 3), isaEnter: pool.splice(0, 1), cashWait: pool.splice(0, 1), pension: pool.splice(0, 1) };
    var dateOnlySet = {};
    Object.keys(dateOnly).forEach(function (k) { dateOnly[k].forEach(function (idx) { dateOnlySet[idx] = k; }); });
    var draw = function (n, exclude) { // pool에서 n명(겹침 허용, 집계 속성마다 독립 추첨)
      var out = [], s = shuffled(r, pool.length);
      for (var j = 0; j < s.length && out.length < n; j++) { var idx = pool[s[j]]; if (!exclude || !exclude[idx]) out.push(idx); }
      return out;
    };
    var pensionStarted = draw(20), startedMap = {};
    pensionStarted.forEach(function (idx) { startedMap[idx] = true; });
    // 1억 이상 118명 + 퇴직급여 입금 고객(1.83억) = 전일 119명. 금일은 1억 진입 고객이 더해져 120명.
    var sets = {
      big: draw(118), lowReturn: draw(210), cashWait: draw(37), pending: draw(14), doUnregistered: draw(51),
      churn: draw(34), transfer: draw(7), td30: draw(18), isa30: draw(11), pensionEligible: draw(76, startedMap), pensionStarted: pensionStarted
    };
    var inSet = {};
    Object.keys(sets).forEach(function (k) { inSet[k] = {}; sets[k].forEach(function (idx) { inSet[k][idx] = true; }); });
    // 상품 만기(정기예금·ISA). 30일 이내 집계 대상은 지정한 고객만 창 안에 둔다.
    var mat = 0;
    customers.forEach(function (c, idx) {
      if (scripted[idx] || dateOnlySet[idx]) return;
      if (inSet.td30[idx]) c.maturities.push({ kind: '정기예금', id: 'TD-' + pad(++mat, 4), maturityDate: dateBetween(r, AS_OF, addDays(PREV, 30)), amountKrw: man(r, 500, 6000) });
      else if (r() < 0.24) c.maturities.push({ kind: '정기예금', id: 'TD-' + pad(++mat, 4), maturityDate: dateBetween(r, addDays(AS_OF, 31), rel('2027-09-20')), amountKrw: man(r, 500, 6000) });
      if (inSet.isa30[idx]) c.maturities.push({ kind: 'ISA', id: 'ISA-' + pad(++mat, 4), maturityDate: dateBetween(r, AS_OF, addDays(PREV, 30)), amountKrw: man(r, 1000, 8000) });
      else if (r() < 0.16) c.maturities.push({ kind: 'ISA', id: 'ISA-' + pad(++mat, 4), maturityDate: dateBetween(r, addDays(AS_OF, 31), rel('2027-12-20')), amountKrw: man(r, 1000, 8000) });
    });
    dateOnly.tdEnter.forEach(function (idx) { customers[idx].maturities.push({ kind: '정기예금', id: 'TD-' + pad(++mat, 4), maturityDate: addDays(AS_OF, 30), amountKrw: man(r, 1000, 5000) }); });
    dateOnly.isaEnter.forEach(function (idx) { customers[idx].maturities.push({ kind: 'ISA', id: 'ISA-' + pad(++mat, 4), maturityDate: addDays(AS_OF, 30), amountKrw: man(r, 2000, 6000) }); });
    // 평가금액·수익률·현금·운용지시·DO·신호·연금.
    customers.forEach(function (c, idx) {
      var role = scripted[idx], dOnly = dateOnlySet[idx];
      var big = !role && !dOnly && inSet.big[idx];
      var pct = inSet.cashWait[idx] && !role && !dOnly ? between(r, 30, 60) : (r() < 0.7 ? between(r, 0, 24) : between(r, 30, 60));
      setValuation(c, big ? man(r, 10000, 48000) : man(r, 300, 9800), pct);
      c.account.oneYearReturnPct = inSet.lowReturn[idx] && !role && !dOnly ? between(r, -75, 9) / 10 : between(r, 15, 115) / 10;
      if (inSet.cashWait[idx] && !role && !dOnly) c.operation.lastInstructionDate = dateBetween(r, rel('2025-08-01'), addDays(PREV, -100));
      else if (c.account.cashPct >= 30) c.operation.lastInstructionDate = dateBetween(r, addDays(PREV, -80), addDays(PREV, -1));
      if (inSet.pending[idx] && !role && !dOnly) { c.contribution.pendingContributionKrw = man(r, 100, 600); c.operation.depositPurchaseConfigured = false; }
      if (inSet.doUnregistered[idx] && !role && !dOnly) c.operation.defaultOptionRegistered = false;
      if (inSet.churn[idx] && !role && !dOnly) { c.signals.churnRisk = true; c.signals.churnReasons = [pick(r, ['수익률 부진 후 잔액 감소', '타행 IRP 이전 문의', '계약이전 절차 문의', '납입 중단 후 상담 요청'])]; }
      if (inSet.transfer[idx] && !role && !dOnly) c.signals.transfer = { applied: true, status: pick(r, ['처리대기', '진행중']), appliedAt: dateBetween(r, rel('2026-08-20'), rel('2026-09-24')) };
      if (inSet.pensionStarted[idx] && !role && !dOnly) { c.profile.age = Math.max(c.profile.age, 58); c.payout.pensionStarted = true; }
      if (inSet.pensionEligible[idx] && !role && !dOnly && !c.payout.pensionStarted) { c.profile.age = Math.max(c.profile.age, 55); c.profile.irpOpenedAt = dateBetween(r, rel('2012-01-01'), rel('2021-06-30')); }
      else if (role || dOnly !== 'pension') { if (c.profile.age >= 55 && !c.payout.pensionStarted && daysBetween(c.profile.irpOpenedAt, AS_OF) >= 365 * 5) c.profile.irpOpenedAt = dateBetween(r, rel('2022-01-01'), rel('2026-06-30')); }
      if (role) c.profile.age = Math.min(c.profile.age, 52);
    });
    // 날짜 경과만으로 진입하는 고객.
    var cw = customers[dateOnly.cashWait[0]]; setValuation(cw, cw.account.valuationAmountKrw, 41); cw.operation.lastInstructionDate = addDays(AS_OF, -90);
    var pe = customers[dateOnly.pension[0]]; pe.profile.age = 57; pe.payout.pensionStarted = false; pe.profile.irpOpenedAt = addDays(AS_OF, -365 * 5); // 금일 5년 경과
    // 스크립트 고객의 금일 이전 상태(전일 스냅샷).
    var role = function (k, j) { return customers[roles[k][j]]; };
    roles.salary.forEach(function (idx, j) {
      var c = customers[idx]; setValuation(c, man(r, 2000, 9000), between(r, 3, 22)); c.operation.depositPurchaseConfigured = true;
      if (j < 3) { c.contribution.annualContributionKrw = 9000000; c.contribution.taxDeductionRemainingKrw = 0; }
      else { var paid = pick(r, [1200000, 2400000, 3600000, 4800000]); c.contribution.annualContributionKrw = paid; c.contribution.taxDeductionRemainingKrw = 9000000 - paid; }
      if (j >= 3 && j < 6) c.contribution.pastExtraContributions = [];
      if (j >= 6 && !c.contribution.pastExtraContributions.length) c.contribution.pastExtraContributions = [{ date: dateBetween(r, rel('2024-02-01'), rel('2025-11-30')), amountKrw: man(r, 100, 300) }];
    });
    roles.returnUp.forEach(function (idx) { var c = customers[idx]; setValuation(c, man(r, 3000, 8000), between(r, 3, 20)); c.account.oneYearReturnPct = between(r, 6, 9) / 10; });
    var bx = role('balanceCross', 0); setValuation(bx, 42000000, 9); bx.operation.lastInstructionDate = rel('2026-09-10');
    var rd = role('retirementDeposit', 0); setValuation(rd, 183000000, 12); rd.operation.lastInstructionDate = rel('2026-09-15');
    roles.routine.forEach(function (idx) { var c = customers[idx]; setValuation(c, man(r, 2000, 8000), between(r, 3, 24)); c.account.oneYearReturnPct = between(r, 18, 96) / 10; });
    var ct = role('churnTransfer', 0); setValuation(ct, 56000000, 8); ct.counseling = { lastCounselingDate: rel('2026-09-11'), summary: '계약이전 절차 문의' };
    var co = role('churnOnly', 0); setValuation(co, 84000000, 14); co.account.oneYearReturnPct = 1.6;
    var dr = role('doRegistered', 0); setValuation(dr, 31000000, 11); dr.operation.defaultOptionRegistered = false;
    var pp = role('pendingPlain', 0); setValuation(pp, 60000000, 10); pp.operation.depositPurchaseConfigured = false; pp.contribution.annualContributionKrw = 2400000; pp.contribution.taxDeductionRemainingKrw = 6600000;
    var cf = role('cashFact', 0); setValuation(cf, 30000000, 22); cf.operation.depositPurchaseConfigured = false; cf.operation.lastInstructionDate = rel('2026-04-20'); cf.contribution.annualContributionKrw = 1200000; cf.contribution.taxDeductionRemainingKrw = 7800000;
    // 부점 잔액을 기존 화면 값에 맞춘다(pool 고객만 조정, 스크립트 고객 금액은 유지).
    // 금일 1억 이상 합계 = 전체의 45.3% = pool 118명 + 퇴직급여 입금 고객(2.13억) + 1억 진입 고객(1.07억).
    var bigPoolTarget = Math.round(BIG_SHARE_CURR * TOTAL_CURR) - 213000000 - 107000000;
    calibrate(customers, pool.filter(function (idx) { return inSet.big[idx]; }), bigPoolTarget, 100000000, Infinity);
    var scriptedSmall = 0; customers.forEach(function (c, idx) { if (scripted[idx] && c.account.valuationAmountKrw < 100000000) scriptedSmall += c.account.valuationAmountKrw; });
    var smallIdxs = []; customers.forEach(function (c, idx) { if (!scripted[idx] && c.account.valuationAmountKrw < 100000000) smallIdxs.push(idx); });
    calibrate(customers, smallIdxs, TOTAL_PREV - bigPoolTarget - 183000000 - scriptedSmall, 3000000, 99990000);
    customers.forEach(function (c) { c.payout.pensionEligible = pensionEligible(c, PREV); });
    var prev = { snapshotId: 'snap-' + PREV.replace(/-/g, '') + '-0725', capturedAt: PREV + 'T07:25:00+09:00', asOfDate: PREV, transactionDate: addDays(PREV, -1), customers: customers };
    var curr = applyChanges(copy(prev), roles, r);
    return { prev: prev, curr: curr, roles: roles, dateOnly: dateOnly };
  }
  function calibrate(customers, idxs, target, floor, cap) {
    var sum = 0; idxs.forEach(function (idx) { sum += customers[idx].account.valuationAmountKrw; });
    var f = target / sum, acc = 0, largest = idxs[0];
    idxs.forEach(function (idx) {
      var c = customers[idx], v = Math.min(cap, Math.max(floor, Math.round(c.account.valuationAmountKrw * f / MAN) * MAN));
      setValuation(c, v, c.account.cashPct); acc += v;
      if (v > customers[largest].account.valuationAmountKrw) largest = idx;
    });
    var last = customers[largest]; setValuation(last, last.account.valuationAmountKrw + (target - acc), last.account.cashPct);
  }
  function applyChanges(snap, roles, r) {
    snap.snapshotId = 'snap-' + AS_OF.replace(/-/g, '') + '-0725'; snap.capturedAt = AS_OF + 'T07:25:00+09:00'; snap.asOfDate = AS_OF; snap.transactionDate = PREV;
    var cs = snap.customers, at = function (k, j) { return cs[roles[k][j == null ? 0 : j]]; }, tx = PREV;
    roles.salary.forEach(function (idx) { var c = cs[idx]; c.transactions.push({ date: tx, type: '급여입금', account: '일반', amountKrw: man(r, 280, 720) }); });
    var upDelta = 0;
    roles.returnUp.forEach(function (idx) { var c = cs[idx]; var d = Math.round(c.account.valuationAmountKrw * 0.004 / MAN) * MAN; c.account.valuationAmountKrw += d; upDelta += d; recomputeCashPct(c); c.account.oneYearReturnPct = Math.round((c.account.oneYearReturnPct + between(r, 4, 8) / 10) * 10) / 10; });
    var bx = at('balanceCross'); bx.account.valuationAmountKrw += 65000000; bx.account.cashAmountKrw += 65000000; recomputeCashPct(bx); bx.transactions.push({ date: tx, type: '퇴직급여입금', account: 'IRP', amountKrw: 65000000 });
    var rd = at('retirementDeposit'); rd.account.valuationAmountKrw += 30000000; rd.account.cashAmountKrw += 30000000; recomputeCashPct(rd); rd.transactions.push({ date: tx, type: '퇴직급여입금', account: 'IRP', amountKrw: 30000000 });
    var ct = at('churnTransfer'); ct.signals.churnRisk = true; ct.signals.churnReasons = ['계약이전 신청 접수']; ct.signals.transfer = { applied: true, status: '신청', appliedAt: tx }; ct.transactions.push({ date: tx, type: '계약이전신청', account: 'IRP', amountKrw: null });
    var co = at('churnOnly'); co.signals.churnRisk = true; co.signals.churnReasons = ['타행 IRP 이전 문의', '수익률 부진 상담']; co.counseling = { lastCounselingDate: tx, summary: '타행 IRP 이전 조건 문의, 수익률 개선 방안 요청' };
    var dr = at('doRegistered'); dr.operation.defaultOptionRegistered = true; dr.transactions.push({ date: tx, type: 'DO등록', account: 'IRP', amountKrw: null });
    var pp = at('pendingPlain'); contribute(pp, 4000000, tx);
    var cf = at('cashFact'); contribute(cf, 7000000, tx);
    var residual = TOTAL_CURR - TOTAL_PREV - upDelta - 65000000 - 30000000 - 4000000 - 7000000;
    var deltas = roles.routine.map(function (idx, j) { return (j < 20 ? 1 : -1) * man(r, 20, 90); });
    var sum = deltas.reduce(function (a, b) { return a + b; }, 0);
    deltas[0] += residual - sum;
    roles.routine.forEach(function (idx, j) { var c = cs[idx]; c.account.valuationAmountKrw += deltas[j]; recomputeCashPct(c); c.account.oneYearReturnPct = Math.round((c.account.oneYearReturnPct + (deltas[j] > 0 ? 1 : -1) / 10) * 10) / 10; });
    cs.forEach(function (c) { c.payout.pensionEligible = pensionEligible(c, AS_OF); });
    return snap;
  }
  function contribute(c, amount, date) {
    c.contribution.annualContributionKrw += amount; c.contribution.taxDeductionRemainingKrw -= amount; c.contribution.pendingContributionKrw += amount;
    c.account.valuationAmountKrw += amount; c.account.cashAmountKrw += amount; recomputeCashPct(c);
    c.transactions.push({ date: date, type: '개인부담금납입', account: 'IRP', amountKrw: amount });
  }
  function pensionEligible(c, asOf) { return c.profile.age >= 55 && daysBetween(c.profile.irpOpenedAt, asOf) >= 365 * 5 && !c.payout.pensionStarted; }

  /* ---------- 세그먼트 규칙(목업 계산 기준) ---------- */
  var SEGMENTS = [
    { key: 'managed', label: '관리 고객', sourceLabels: [], rule: '스냅샷의 전체 개인형 IRP 고객', basis: 'count', test: function () { return true; } },
    { key: 'churn_risk', label: '이탈위험', sourceLabels: ['이탈징후'], rule: "관리신호 churnRisk = true (등록 라벨 '이탈징후'를 이 표시 그룹에 연결)", test: function (c) { return c.signals.churnRisk === true; } },
    { key: 'transfer_pending', label: '계약이전 신청·처리대기', sourceLabels: ['계약이전 신청'], rule: "transfer.applied = true 이고 상태가 신청·처리대기·진행중", test: function (c) { return !!c.signals.transfer && c.signals.transfer.applied && ['신청', '처리대기', '진행중'].indexOf(c.signals.transfer.status) >= 0; } },
    { key: 'salary_deposit', label: '전일 급여 입금', sourceLabels: [], rule: '', /* anchor()가 기준일로 채운다 */ test: function (c, s) { return c.transactions.some(function (t) { return t.type === '급여입금' && t.date === s.transactionDate; }); } },
    { key: 'do_unregistered', label: 'DO 미등록', sourceLabels: ['DO 미등록'], rule: 'defaultOptionRegistered = false', test: function (c) { return c.operation.defaultOptionRegistered === false; } },
    { key: 'cash_long_wait', label: '현금성 장기대기', sourceLabels: ['현금성 장기대기'], rule: '현금성자산 비중 30% 이상이고 최근 운용지시일이 기준일로부터 90일 이상 경과', test: function (c, s) { return c.account.cashPct >= 30 && daysBetween(c.operation.lastInstructionDate, s.asOfDate) >= 90; } },
    { key: 'pending_contribution', label: '납입금 미운용', sourceLabels: ['납입금 미운용'], rule: '미운용 개인부담금 납입액 > 0', test: function (c) { return c.contribution.pendingContributionKrw > 0; } },
    { key: 'td_maturity_30', label: '정기예금 만기 30일 이내', sourceLabels: ['정기예금 만기'], rule: '정기예금 만기일이 기준일부터 30일 이내 (화면 계산 기준, 등록 라벨은 D-n 단위)', test: function (c, s) { return c.maturities.some(function (m) { var d = daysBetween(s.asOfDate, m.maturityDate); return m.kind === '정기예금' && d >= 0 && d <= 30; }); } },
    { key: 'isa_maturity_30', label: 'ISA 만기 30일 이내', sourceLabels: ['ISA 만기'], rule: 'ISA 만기일이 기준일부터 30일 이내 (화면 계산 기준)', test: function (c, s) { return c.maturities.some(function (m) { var d = daysBetween(s.asOfDate, m.maturityDate); return m.kind === 'ISA' && d >= 0 && d <= 30; }); } },
    { key: 'pension_eligible', label: '연금개시 가능·미개시', sourceLabels: ['연금개시 가능'], rule: '만 55세 이상, IRP 가입 5년 경과, 연금 미개시', test: function (c, s) { return pensionEligible(c, s.asOfDate); } },
    { key: 'low_return', label: '수익률 1% 미만', sourceLabels: ['수익률 부진'], rule: '1년 수익률 < 1% (메인 KPI 기준)', test: function (c) { return c.account.oneYearReturnPct < 1; } },
    { key: 'big_balance', label: 'IRP 평가금액 1억원 이상', sourceLabels: [], rule: '평가금액 ≥ 1억원 (메인 KPI 기준)', test: function (c) { return c.account.valuationAmountKrw >= 100000000; } }
  ];
  function membership(snap) {
    var out = {}; SEGMENTS.forEach(function (s) { out[s.key] = []; });
    snap.customers.forEach(function (c) { SEGMENTS.forEach(function (s) { if (s.test(c, snap)) out[s.key].push(c.customerId); }); });
    return out;
  }
  function segmentChanges(prev, curr) {
    var a = membership(prev), b = membership(curr);
    return SEGMENTS.map(function (s) {
      var before = a[s.key], after = b[s.key], bs = {}, as = {};
      before.forEach(function (id) { bs[id] = true; }); after.forEach(function (id) { as[id] = true; });
      var entered = after.filter(function (id) { return !bs[id]; }), exited = before.filter(function (id) { return !as[id]; });
      return { key: s.key, label: s.label, sourceLabels: s.sourceLabels, rule: s.rule, before: before.length, after: after.length,
        entered: entered, exited: exited, net: entered.length - exited.length, beforeIds: before, afterIds: after };
    });
  }

  /* ---------- 원본 비교 ---------- */
  function diffPaths(a, b, prefix, out) {
    out = out || [];
    if (Array.isArray(a) && Array.isArray(b)) {
      var n = Math.max(a.length, b.length);
      for (var i = 0; i < n; i++) { if (i >= a.length || i >= b.length) out.push(prefix + '[' + i + ']'); else diffPaths(a[i], b[i], prefix + '[' + i + ']', out); }
      return out;
    }
    if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
      var keys = Object.keys(a); Object.keys(b).forEach(function (k) { if (keys.indexOf(k) < 0) keys.push(k); });
      keys.forEach(function (k) { diffPaths(a[k], b[k], prefix ? prefix + '.' + k : k, out); });
      return out;
    }
    if (JSON.stringify(a) !== JSON.stringify(b)) out.push(prefix);
    return out;
  }
  var GROUPS = { profile: '기본정보', account: '계좌', operation: '운용', maturities: '만기', contribution: '납입', payout: '지급', signals: '관리신호', transactions: '거래', counseling: '상담' };
  function compare(prev, curr) {
    var byId = {}; prev.customers.forEach(function (c) { byId[c.customerId] = c; });
    var changed = [], byGroup = {}; Object.keys(GROUPS).forEach(function (g) { byGroup[g] = 0; });
    var onlyPrev = [], matched = 0;
    curr.customers.forEach(function (c) {
      var p = byId[c.customerId]; if (!p) return; matched++;
      var paths = diffPaths(p, c, '', []);
      if (!paths.length) return;
      var groups = {}; paths.forEach(function (path) { groups[path.split(/[.\[]/)[0]] = true; });
      Object.keys(groups).forEach(function (g) { if (byGroup[g] != null) byGroup[g]++; });
      changed.push({ customerId: c.customerId, paths: paths, groups: Object.keys(groups) });
    });
    var currIds = {}; curr.customers.forEach(function (c) { currIds[c.customerId] = true; });
    prev.customers.forEach(function (c) { if (!currIds[c.customerId]) onlyPrev.push(c.customerId); });
    return { matched: matched, onlyPrev: onlyPrev, onlyCurr: curr.customers.length - matched, changed: changed, byGroup: byGroup };
  }

  /* ---------- 추가납입 상담 후보 12 → 9 → 6 ---------- */
  function funnel(curr) {
    var byId = {}; curr.customers.forEach(function (c) { byId[c.customerId] = c; });
    var salary = curr.customers.filter(function (c) { return c.transactions.some(function (t) { return t.type === '급여입금' && t.date === curr.transactionDate; }); }).map(function (c) { return c.customerId; });
    var remaining = [], noRemaining = [];
    salary.forEach(function (id) { (byId[id].contribution.taxDeductionRemainingKrw > 0 ? remaining : noRemaining).push(id); });
    var history = [], noHistory = [];
    remaining.forEach(function (id) { (byId[id].contribution.pastExtraContributions.length ? history : noHistory).push(id); });
    var reason = function (ids, text, ref) { return ids.map(function (id) { return { customerId: id, reason: text, evidenceRefs: [ref(byId[id])] }; }); };
    return {
      stages: [
        { key: 'salary', title: '전일(' + md(curr.transactionDate) + ') 급여 입금 고객', inputCount: curr.customers.length, selected: salary, excludedCount: curr.customers.length - salary.length, excluded: [], rule: "거래일 " + curr.transactionDate + " 일반계좌 '급여입금' 거래 존재", field: 'transactions[].type = 급여입금' },
        { key: 'remaining', title: '세액공제 잔여한도 양수', inputCount: salary.length, selected: remaining, excludedCount: noRemaining.length, excluded: reason(noRemaining, '세액공제 잔여한도 0원 (올해 개인부담금 900만원 납입 완료)', function (c) { return ref(curr, c, 'contribution.taxDeductionRemainingKrw'); }), rule: 'contribution.taxDeductionRemainingKrw > 0', field: 'contribution.taxDeductionRemainingKrw' },
        { key: 'history', title: '과거 추가납입 거래 이력 존재', inputCount: remaining.length, selected: history, excludedCount: noHistory.length, excluded: reason(noHistory, '과거 추가납입 거래 이력 없음', function (c) { return ref(curr, c, 'contribution.pastExtraContributions'); }), rule: 'contribution.pastExtraContributions.length > 0', field: 'contribution.pastExtraContributions' }
      ],
      selected: history
    };
  }
  function ref(snap, c, path) { return 'snapshot:' + snap.asOfDate + '/' + c.customerId + '#' + path; }

  /* ---------- 기록 조립 ---------- */
  var ACTOR_LABEL = { FRONT: '프론트', FABRIX: 'FabriX', AGENT: 'Agent', DATA: '데이터', LLM: 'LLM' };
  function step(def) {
    var s = {
      id: def.id, parentId: def.parentId || null, sequence: def.sequence, actor: def.actor, title: def.title,
      startedAt: stamp(def.start), endedAt: stamp(def.end), durationMs: def.end - def.start, status: 'completed',
      summary: def.summary, input: def.input || null, output: def.output || null, evidenceRefs: def.evidenceRefs || [], detail: def.detail || null
    };
    return s;
  }
  var won = function (n) { return n == null ? '미확인' : n.toLocaleString('ko-KR') + '원'; };
  var eok = function (n) { return (Math.round(n / 1e7) / 10).toFixed(1) + '억'; };

  function build() {
    var g = generate(), prev = g.prev, curr = g.curr;
    var byPrev = {}, byCurr = {}; prev.customers.forEach(function (c) { byPrev[c.customerId] = c; }); curr.customers.forEach(function (c) { byCurr[c.customerId] = c; });
    var cmp = compare(prev, curr), segs = segmentChanges(prev, curr), fun = funnel(curr);
    var segByKey = {}; segs.forEach(function (s) { segByKey[s.key] = s; });
    var totalPrev = prev.customers.reduce(function (a, c) { return a + c.account.valuationAmountKrw; }, 0);
    var totalCurr = curr.customers.reduce(function (a, c) { return a + c.account.valuationAmountKrw; }, 0);
    var changedIds = cmp.changed.map(function (c) { return c.customerId; }), changedSet = {}; changedIds.forEach(function (id) { changedSet[id] = true; });
    var segmentMovers = {}; segs.forEach(function (s) { s.entered.concat(s.exited).forEach(function (id) { segmentMovers[id] = true; }); });
    var dateOnlyIds = Object.keys(segmentMovers).filter(function (id) { return !changedSet[id]; }).sort();
    var idOf = function (k, j) { return curr.customers[g.roles[k][j || 0]].customerId; };
    var churnNew = segByKey.churn_risk.entered, transferNew = segByKey.transfer_pending.entered;
    var overlap = churnNew.filter(function (id) { return transferNew.indexOf(id) >= 0; });
    var cases = [
      { key: 'selected', title: '급여 입금 + 공제잔여 + 과거 납입 이력 → 최종 선정', customerId: fun.selected[0], stepId: 'g06' },
      { key: 'no_remaining', title: '급여 입금 + 공제잔여 없음 → 제외', customerId: fun.stages[1].excluded[0].customerId, stepId: 'g06' },
      { key: 'no_history', title: '급여 입금 + 공제잔여 있음 + 과거 이력 없음 → 제외', customerId: fun.stages[2].excluded[0].customerId, stepId: 'g06' },
      { key: 'churn_transfer', title: '이탈징후 신규 발생 + 계약이전 신청 → 두 세그먼트에 중복 포함', customerId: overlap[0], stepId: 'g05' },
      { key: 'do_registered', title: 'DO 등록 → DO 미등록 세그먼트에서 이탈', customerId: segByKey.do_unregistered.exited[0], stepId: 'g05' },
      { key: 'maturity_window', title: '만기일은 그대로, 기준일 경과로 정기예금 만기 30일 이내 그룹 진입', customerId: curr.customers[g.dateOnly.tdEnter[0]].customerId, stepId: 'g05' }
    ].map(function (c) {
      var p = byPrev[c.customerId], n = byCurr[c.customerId], paths = diffPaths(p, n, '', []);
      var before = segs.filter(function (s) { return s.beforeIds.indexOf(c.customerId) >= 0; }).map(function (s) { return s.label; });
      var after = segs.filter(function (s) { return s.afterIds.indexOf(c.customerId) >= 0; }).map(function (s) { return s.label; });
      return { key: c.key, title: c.title, customerId: c.customerId, stepId: c.stepId, prev: p, curr: n, changedPaths: paths, factChanged: paths.length > 0,
        segmentsBefore: before, segmentsAfter: after, evidenceRefs: paths.map(function (path) { return ref(curr, n, path); }) };
    });
    var segmentSummary = segs.map(function (s) { return { key: s.key, label: s.label, sourceLabels: s.sourceLabels, rule: s.rule, before: s.before, after: s.after, entered: s.entered.length, exited: s.exited.length, net: s.net }; });
    var call1 = {
      callId: 'llm-call-01', purpose: '계산된 세그먼트 변화·신규 위험고객·상담 후보 선정 결과를 읽고 오늘의 관리방향을 구조화한다. 숫자·고객 ID는 DATA 단계가 확정했고 LLM은 해석만 한다.',
      model: MODEL.model, deployment: MODEL.deployment, temperature: 0, maxOutputTokens: 1024,
      messages: [
        { role: 'system', content: '너는 은행 부점의 퇴직연금 사후관리 보조자다. 입력 JSON의 사실만 사용해 관리방향을 판단한다. 숫자·고객 ID·상품명을 새로 만들지 않는다. 출력은 JSON 객체 하나다.' },
        { role: 'user', content: {
          stage: 'interpret', as_of_date: AS_OF, branch: BRANCH,
          segment_changes: segmentSummary.filter(function (s) { return s.entered || s.exited; }).map(function (s) { return { label: s.label, before: s.before, after: s.after, entered: s.entered, exited: s.exited, net: s.net }; }),
          new_risk_customers: { churn_risk: churnNew, transfer_pending: transferNew, overlap: overlap },
          candidate_funnel: fun.stages.map(function (s) { return { stage: s.title, input: s.inputCount, selected: s.selected.length, excluded: s.excludedCount }; }),
          selected_customers: fun.selected,
          facts_used: ['급여입금 거래일 ' + curr.transactionDate, '세액공제 잔여한도 > 0', '과거 추가납입 거래 이력'],
          needs_confirmation: ['급여 입금액이 IRP 납입 가능 자금인지', '추가납입 의향과 자금 사용 계획']
        } }
      ],
      response: {
        priority_tasks: [{ key: 'churn_risk_new', customer_ids: churnNew, note: '이탈위험 신규 ' + churnNew.length + '명은 우선 확인할 관리 과제. 그중 계약이전 신규 신청자 ' + overlap.length + '명 포함' }],
        follow_up_targets: [{ key: 'extra_contribution_intent', customer_ids: fun.selected, note: '급여 입금 이후 추가납입 의향을 확인할 대상 ' + fun.selected.length + '명' }],
        briefing_topic: { key: 'extra_contribution_consult', customer_count: fun.selected.length, reason: '대표 브리핑 주제는 추가납입 상담 대상 ' + fun.selected.length + '명' },
        cautions: ['급여 입금만으로 고객의 여유자금을 확정하지 않음', '위험 증가 해석은 처리 상세에 남기고 고객 목록에 새 업무를 등록하지 않음']
      },
      usedBy: { step: 'g05', fields: ['briefing_topic', 'follow_up_targets[0].customer_ids', 'cautions'] }
    };
    var call2 = {
      callId: 'llm-call-02', purpose: '확정된 인원·선정 근거와 호출 1의 관리방향을 짧은 직원용 브리핑 문장으로 만든다.',
      model: MODEL.model, deployment: MODEL.deployment, temperature: 0, maxOutputTokens: 300,
      messages: [
        { role: 'system', content: '부점 직원에게 보여줄 오늘의 브리핑을 3문장 이내로 쓴다. 입력의 인원수와 조건만 사용하고 새로운 숫자·고객명·실행 완료 주장을 넣지 않는다. 출력은 문장만 낸다.' },
        { role: 'user', content: {
          stage: 'compose', audience: '부점 직원', length: '짧은 안내 3문장',
          confirmed_count: fun.selected.length,
          selection_basis: ['전일 급여 입금', '세액공제 잔여한도 있음', '과거 추가납입 이력 있음'],
          direction: call1.response.briefing_topic, guidance: ['자금 여력 확인', '추가납입 시 세제혜택 안내', '입금 후 운용방법 안내'], cautions: call1.response.cautions
        } }
      ],
      response: { text: BRIEFING_TEXT },
      usedBy: { step: 'g06', fields: ['text'] }
    };
    var checks = [
      { check: '문장의 인원수 = 확정 고객 수', expected: fun.selected.length, actual: Number((BRIEFING_TEXT.match(/고객 (\d+)명/) || [])[1]), ok: true },
      { check: '확정 고객 ⊂ 전일 급여 입금 고객', expected: fun.selected.length, actual: fun.selected.filter(function (id) { return fun.stages[0].selected.indexOf(id) >= 0; }).length, ok: true },
      { check: '문장에 계산에 없는 수치 없음', expected: [fun.selected.length], actual: (BRIEFING_TEXT.match(/\d+/g) || []).map(Number), ok: true },
      { check: '신규 위험고객은 처리 상세에만 기록 (고객 목록 미등록)', expected: 0, actual: 0, ok: true }
    ];
    checks.forEach(function (c) { c.ok = JSON.stringify(c.expected) === JSON.stringify(c.actual); });
    var N = curr.customers.length.toLocaleString('ko-KR');
    var llmInput = function (call) { return { callId: call.callId, model: call.model, deployment: call.deployment, temperature: 0, maxOutputTokens: call.maxOutputTokens, purpose: call.purpose, messages: call.messages }; };
    var genSteps = [
      step({ id: 'g01', sequence: 1, actor: 'DATA', title: '고객 데이터 스냅샷 비교', start: GEN + 0, end: GEN + 1250,
        summary: '전일·금일 ' + N + '명 식별자 연결 · 원본 사실이 바뀐 고객 ' + changedIds.length + '명, 기준일 경과만으로 세그먼트가 바뀐 고객 ' + dateOnlyIds.length + '명',
        input: { snapshots: [{ id: prev.snapshotId, capturedAt: prev.capturedAt, transactionDate: prev.transactionDate }, { id: curr.snapshotId, capturedAt: curr.capturedAt, transactionDate: curr.transactionDate }], fieldGroups: GROUPS,
          method: '식별자(customerId)로 두 스냅샷을 연결한 뒤 정보군별 필드 단위 JSON 비교. 기준일 메타데이터 변경은 변경 고객으로 세지 않음. 미확인 값은 0·false로 바꾸지 않음' },
        output: { matched: cmp.matched, onlyPrev: cmp.onlyPrev, onlyCurr: cmp.onlyCurr, changedCustomerCount: changedIds.length, changedByGroup: cmp.byGroup, changedCustomerIds: changedIds, dateOnlySegmentChangeIds: dateOnlyIds,
          valuationTotalKrw: { prev: totalPrev, curr: totalCurr, delta: totalCurr - totalPrev }, valuationTotalDisplay: { prev: eok(totalPrev), curr: eok(totalCurr), delta: '▲' + eok(totalCurr - totalPrev) },
          note: '부점 수익률은 원본 시스템 값이며 고객 수익률 단순 평균으로 계산하지 않아 이 기록에 포함하지 않음' },
        evidenceRefs: cases.slice(0, 5).map(function (c) { return c.evidenceRefs[0]; }).filter(Boolean), detail: { kind: 'compare', caseKeys: cases.map(function (c) { return c.key; }) } }),
      step({ id: 'g02', sequence: 2, actor: 'DATA', title: '세그먼트 변화 계산', start: GEN + 1250, end: GEN + 1600, summary: segs.filter(function (s) { return s.net; }).length + '개 세그먼트 변동 · 순증 = 신규 진입 − 이탈',
        input: { segments: SEGMENTS.map(function (s) { return { key: s.key, label: s.label, sourceLabels: s.sourceLabels, rule: s.rule }; }), note: "만기 30일 이내·수익률 1% 미만·1억원 이상은 이 화면의 계산 기준이며 기존 Agent의 공식 업무 규칙이 아님" },
        output: { segments: segmentSummary, overlaps: [{ segments: ['이탈위험', '계약이전 신청·처리대기'], customerIds: overlap }] }, detail: { kind: 'segments' } }),
      step({ id: 'g03', sequence: 3, actor: 'DATA', title: '관리 포인트 도출', start: GEN + 1600, end: GEN + 2000, summary: '추가납입 상담 후보 ' + fun.stages.map(function (s) { return s.selected.length; }).join(' → ') + '명 · 신규 위험고객 ' + churnNew.length + '명(계약이전 신규 신청 ' + overlap.length + '명 포함)',
        input: { source: curr.snapshotId, conditions: fun.stages.map(function (s) { return s.rule; }), riskSegments: ['이탈위험', '계약이전 신청·처리대기'] },
        output: { selected: fun.selected, count: fun.selected.length, newRiskCustomers: { churn_risk: churnNew, transfer_pending: transferNew, overlap: overlap } },
        evidenceRefs: fun.selected.map(function (id) { return ref(curr, byCurr[id], 'transactions'); }), detail: { kind: 'funnel' } }),
      step({ id: 'g04', sequence: 4, actor: 'LLM', title: '관리방향 해석 (Gemma 4)', start: GEN + 2000, end: GEN + 9800, summary: '우선 과제: 이탈위험 신규 ' + churnNew.length + '명 · 브리핑 주제: 추가납입 상담 대상 ' + fun.selected.length + '명 · 7.8초',
        input: llmInput(call1), output: call1.response, detail: { kind: 'llm', callId: 'llm-call-01', usedBy: call1.usedBy } }),
      step({ id: 'g05', sequence: 5, actor: 'LLM', title: '브리핑 문장 생성 (Gemma 4)', start: GEN + 9800, end: GEN + 19200, summary: '직원용 브리핑 3문장 · 9.4초',
        input: llmInput(call2), output: call2.response, detail: { kind: 'llm', callId: 'llm-call-02', usedBy: call2.usedBy } }),
      step({ id: 'g06', sequence: 6, actor: 'AGENT', title: '근거 대조 · 브리핑 확정', start: GEN + 19200, end: GEN + 20000, summary: checks.filter(function (c) { return c.ok; }).length + '/' + checks.length + ' 항목 일치 · 브리핑 ' + 'brf-' + AS_OF.replace(/-/g, '') + '-001' + ' 저장',
        input: { text: BRIEFING_TEXT, selected: fun.selected }, output: { checks: checks, briefingId: 'brf-' + AS_OF.replace(/-/g, '') + '-001', storedAt: stamp(GEN + 20000), generationTraceId: 'gen-' + AS_OF.replace(/-/g, '') + '-0730' } })
    ];
    // 관리 포인트 도출의 하위 단계(12 → 9 → 6명, 부모 g03 안에서 순차 실행).
    fun.stages.forEach(function (s, j) {
      var start = GEN + 1600 + j * 133, end = GEN + (j === 2 ? 2000 : 1600 + (j + 1) * 133);
      genSteps.push(step({ id: 'g03-' + (j + 1), parentId: 'g03', sequence: 3 + (j + 1) / 10, actor: 'DATA', title: s.title, start: start, end: end,
        summary: '입력 ' + s.inputCount + '명 → 선택 ' + s.selected.length + '명 · 제외 ' + s.excludedCount + '명', input: { inputCount: s.inputCount, rule: s.rule, field: s.field },
        output: { selected: s.selected, excluded: s.excluded, excludedCount: s.excludedCount }, evidenceRefs: s.selected.map(function (id) { return ref(curr, byCurr[id], s.field.split('[')[0]); }) }));
    });
    var generationTraceId = 'gen-' + AS_OF.replace(/-/g, '') + '-0730', requestId = 'req-' + AS_OF.replace(/-/g, '') + '-0730-0001', briefingId = 'brf-' + AS_OF.replace(/-/g, '') + '-001';
    var generation = { traceId: generationTraceId, kind: 'generation', title: '오늘의 부점 브리핑 생성', branch: BRANCH, status: 'completed', startedAt: stamp(GEN), endedAt: stamp(GEN + 20000), durationMs: 20000, steps: genSteps, origin: 'frontend_fixture', isSimulated: true };
    // 저장된 결과 조회. 실제 계약(customer-briefing-api / branch-agent-api)에 필드를 더하지 않는 목업 내부 작업.
    var inner = { schema_version: 'branch-daily-briefing.v1', task: 'branch_daily_briefing_lookup', request_id: requestId, branch: BRANCH, as_of_date: AS_OF, x_client_user: '(직원 ID 미표시)' };
    var logical = { event: 'answer', data: { schema_version: inner.schema_version, request_id: requestId, briefing_id: briefingId, as_of_date: AS_OF, generated_at: stamp(GEN + 20000), customer_count: fun.selected.length, text: BRIEFING_TEXT, generation_trace_id: generationTraceId } };
    var agentFrame = { event: 'CHUNK', content: JSON.stringify(logical), references: [], recommend_queries: [], actions: [] };
    var gatewayFrame = { event_status: 'CHUNK', status: 'SUCCESS', result_code: 'FR-200', content: JSON.stringify(agentFrame), references: [], recommend_queries: [], actions: [] };
    var request = { method: 'POST', path: '/openapi/agent-chat/v1/agent-messages', endpoint: '(연결 설정의 FabriX Connector URL)', headers: { 'Content-Type': 'application/json; charset=UTF-8', Accept: 'text/event-stream', 'x-openapi-token': '(미표시)', 'x-generative-ai-client': '(미표시)' }, body: { agentId: '(연결 설정의 Agent ID)', contents: [JSON.stringify(inner)], llmConfig: {}, isStream: true } };
    var response = { transport: 'SSE (text/event-stream)', agentFrame: 'data: ' + JSON.stringify(agentFrame), gatewayFrame: 'data: ' + JSON.stringify(gatewayFrame), logical: logical };
    // 화면 렌더링 직후 첫 요청: 프론트 POST(120ms) → Agent가 요청 안에서 생성(150ms~20.15초) → SSE 응답 → 화면 반영(20.352초).
    var retSteps = [
      step({ id: 'r01', sequence: 1, actor: 'FRONT', title: '브리핑 요청 전달', start: 120, end: GEN,
        summary: '화면 렌더링 직후 POST → FabriX Connector → Agent /chat 전달 · 30ms',
        input: { request: request, forwardedBody: { input_value: request.body.contents[0], message_hists: null } }, output: { forwarded: true } }),
      step({ id: 'r02', sequence: 2, actor: 'AGENT', title: '응답 전달·화면 반영', start: GEN + 20000, end: 20352,
        summary: '생성 완료 브리핑 ' + briefingId + ' → Agent CHUNK → FabriX event_status CHUNK → 오늘의 부점 브리핑 카드 반영 · 202ms',
        input: { briefingId: briefingId },
        output: { briefingId: briefingId, generatedAt: stamp(GEN + 20000), linkedGenerationTraceId: generationTraceId, logical: logical, agentFrame: response.agentFrame, gatewayFrame: response.gatewayFrame,
          checks: [{ check: 'status = SUCCESS', ok: true }, { check: 'event = answer', ok: true }, { check: 'request_id 일치', expected: requestId, actual: logical.data.request_id, ok: true }, { check: '문장 인원수 = customer_count', expected: fun.selected.length, actual: logical.data.customer_count, ok: true }] } })
    ];
    var retrieval = {
      requestId: requestId, traceId: 'ret-' + AS_OF.replace(/-/g, '') + '-0730-0001', linkedGenerationTraceId: generationTraceId, kind: 'retrieval',
      title: '오늘의 부점 브리핑', branch: BRANCH, status: 'completed', asOfDate: AS_OF, timezone: TIMEZONE,
      requestedAt: stamp(120), respondedAt: stamp(20352), generatedAt: stamp(GEN + 20000), durationMs: 20352 - 120, generationDurationMs: 20000,
      request: request, response: response, steps: retSteps, briefingId: briefingId, text: BRIEFING_TEXT, customerCount: fun.selected.length,
      path: [
        { from: 'FRONT', to: 'FABRIX', label: 'POST FabriX Connector', detail: request.path },
        { from: 'FABRIX', to: 'AGENT', label: 'Agent POST /chat', detail: 'input_value = contents[0]' },
        { from: 'AGENT', to: 'LLM', label: '사내 LLM Gateway → ' + MODEL.display, detail: MODEL.model + ' · ' + MODEL.deployment + ' (요청 안의 생성 단계 · 호출 2회)' },
        { from: 'AGENT', to: 'FRONT', label: 'FabriX SSE CHUNK', detail: 'event_status: CHUNK / content' }
      ],
      origin: 'frontend_fixture', isSimulated: true
    };
    return {
      schemaVersion: 'execution-trace.v1', asOfDate: AS_OF, timezone: TIMEZONE, branch: BRANCH, model: MODEL, origin: 'frontend_fixture', isSimulated: true,
      entries: [retrieval], traces: { generation: generation, retrieval: retrieval },
      snapshots: { prev: prev, curr: curr }, comparison: cmp, segments: segs, funnel: fun, cases: cases, llmCalls: { 'llm-call-01': call1, 'llm-call-02': call2 },
      customer: function (snapshotKey, id) { return (snapshotKey === 'prev' ? byPrev : byCurr)[id] || null; }
    };
  }

  var cached = null;
  anchor();
  return {
    build: function () { anchor(); return cached || (cached = build()); },
    reset: function () { cached = null; },
    stamp: stamp, setBase: setBase, clockOf: clockOf, diffPaths: diffPaths, daysBetween: daysBetween, won: won,
    ACTOR_LABEL: ACTOR_LABEL, SEGMENTS: SEGMENTS, BRIEFING_TEXT: BRIEFING_TEXT, MODEL: MODEL, COUNT: COUNT, D0: D0,
    get AS_OF() { anchor(); return AS_OF; }, get PREV() { anchor(); return PREV; }
  };
});

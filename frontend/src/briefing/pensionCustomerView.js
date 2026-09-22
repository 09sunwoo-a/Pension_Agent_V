/* Local customer facts only. Never consumes briefing/API response content. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./briefing-contract'));
  else root.PensionCustomerView = factory(root.PensionBriefingContract);
})(typeof window === 'undefined' ? globalThis : window, function (contract) {
  'use strict';
  var date = function (value) { return value ? value.replace(/-/g, '.') : '확인 필요'; };
  var weight = function (value) { return value == null ? '—' : value.toFixed(1) + '%'; };
  var color = function (value) { return value == null ? '#9298A2' : value < 0 ? '#B91C1C' : '#059669'; };
  var colors = { '원리금보장형': '#FFCC00', '실적배당형': '#26282C', '현금성자산': '#C9CDD3' };
  // Dynamic Segment badge palette. Same hex values as the legacy screen palette so the
  // main list and the briefing header render one badge the same way.
  var PALETTE = { red: ['#FDECEC', '#B91C1C', '#DC2626'], am: ['#F9EFD8', '#A96A00', '#D99000'], gr: ['#E6F6EF', '#047857', '#059669'], bl: ['#FFF3C2', '#7A6108', '#FFCC00'] };
  var DDAY = / D-(\d+)$/;
  // 빨강: 이탈·계약이전, 상품·수익률 문제 / 주황: 만기·일정(D-n), 자금 유입·운용 공백, 관리 공백, 납입 공백
  // 초록: 연금개시·수령, 실제 추가납입, 외부 연금자산 / 노랑: 자산 구성, 디폴트옵션, 저금리, 디지털 행동
  var CATEGORY = [
    ['red', ['이탈징후', '계약이전 신청', '계약이전 페이지 방문', '수익률 부진', '환매추천 펀드 보유', '판매중단 펀드 보유']],
    ['am', [DDAY, '퇴직금 운용 미지시', '퇴직금 일부만 운용', '현금성 장기대기', '현금성 과다', '만기자금 미운용', '납입금 미운용', '입금매수상품 미지정', '장기 미운용', '올해 미납입', '납입 중단']],
    ['gr', ['연금개시 가능', '연금개시 예정', '연금수령 중', /^추가납입 /, '타행 IRP 보유', '타행 연금저축 보유', '연금저축 보유', '복수 IRP 보유', '연금자산 분산보유']],
    ['bl', ['원리금보장 편중', 'DO 미등록', '투자성향-DO불일치', '저금리 예금 보유', '퇴직연금 관리화면 방문', 'ETF 상품조회', '펀드 상품조회', '보유상품 수익률 조회']]
  ];
  var PERF = ['수익률 부진', '환매추천 펀드 보유', '판매중단 펀드 보유'];
  var IMPROVE = ['원리금보장 편중', 'DO 미등록', '투자성향-DO불일치', '저금리 예금 보유'];
  function keyOf(label) {
    for (var i = 0; i < CATEGORY.length; i++) {
      var rules = CATEGORY[i][1];
      for (var j = 0; j < rules.length; j++) if (rules[j] instanceof RegExp ? rules[j].test(label) : rules[j] === label) return CATEGORY[i][0];
    }
    return 'bl';
  }
  function badge(label) { var k = keyOf(label); return { t: label, key: k, bg: PALETTE[k][0], fg: PALETTE[k][1] }; }
  function labels(record) {
    return (record.signals || []).map(function (s) { return typeof s === 'string' ? s : s.label || s.text || ''; }).filter(Boolean);
  }
  // Queue order: imminent D-day first, then 이탈·상품 문제, then 운용 공백, then the rest.
  function priority(list) {
    var days = null, keys = list.map(keyOf);
    list.forEach(function (l) { var m = l.match(DDAY); if (m && (days == null || +m[1] < days)) days = +m[1]; });
    if (days != null) return days;
    if (keys.indexOf('red') >= 0) return 1000;
    if (keys.indexOf('am') >= 0) return 2000;
    return list.length ? 3000 : 4000;
  }
  var TAX_LIMIT_KRW = 9000000;
  // Screen-only identifier: every customer number shows as 5자리-5자리. Longer parts (C01 6-7자리)
  // are cut to their first five digits. Requests keep the original customerId untouched.
  function displayId(value) {
    var m = /^(\d+)-(\d+)$/.exec(String(value == null ? '' : value));
    return m ? m[1].slice(0, 5) + '-' + m[2].slice(0, 5) : String(value == null ? '' : value);
  }

  function stub(record) {
    var c = record.customer;
    return { id: record.briefingMeta.caseId, name: c.name, cno: c.customerId, cnoLabel: displayId(c.customerId), phone: '', product: 'IRP', profile: c.investmentProfile || '확인 필요', deposit: contract.money(record.irpAccount.valuationAmountKrw).replace(/원$/, ''), depositEok: record.irpAccount.valuationAmountKrw / 100000000, bar: '#FFCC00', hold: [], tags: [], chips: [] };
  }
  // Main-list row for a structured customer, in the shape the legacy queue renderer reads.
  // Badges are the customer's Dynamic Segments (signals); 신규 선정 = an imminent event
  // (D-day badge or 계약이전 신청), everything else is 지속 관리.
  function row(record) {
    var base = stub(record), a = record.irpAccount, list = labels(record), badges = list.map(badge);
    var keys = badges.map(function (b) { return b.key; }), has = function (k) { return keys.indexOf(k) >= 0; };
    var lead = has('red') ? 'red' : has('am') ? 'am' : has('gr') ? 'gr' : has('bl') ? 'bl' : null;
    var perf = list.some(function (l) { return PERF.indexOf(l) >= 0; });
    var remain = a.taxDeductionRemainingKrw;
    base.bar = lead ? PALETTE[lead][2] : '#D8D5D0';
    base.tags = badges;
    base.qm = { club: record.customer.starClubGrade || '', mg: list.some(function (l) { return DDAY.test(l) || l === '계약이전 신청'; }) ? 'new' : 'on',
      sig: badges.map(function (b) { return [b.t, b.key]; }), bal: contract.money(a.valuationAmountKrw), ret: contract.percent(a.oneYearReturnPct) };
    base.taxPaid = remain == null ? undefined : Math.max(0, Math.round((TAX_LIMIT_KRW - remain) / 10000));
    base.prio = priority(list);
    base.risk = has('red') ? 1 : 0; base.mat = has('am') ? 1 : 0; base.opp = has('gr') ? 1 : 0; base.perf = perf ? 1 : 0;
    base.imp = perf || list.some(function (l) { return IMPROVE.indexOf(l) >= 0; }) ? 1 : 0;
    base.brief = 1;
    return base;
  }
  function profile(record) {
    var c = record.customer, a = record.irpAccount, d = c.defaultOption, r = a.latestProductOpening;
    return { pin: c.customerId, age: c.age == null ? '확인 필요' : c.age, sex: c.gender || '확인 필요', club: c.starClubGrade || '확인 필요', acct: date(c.irpOpenedAt), dopt: d.registrationStatus === '등록', doptName: d.designatedProduct ? d.designatedProduct.productName : '', ret: contract.percent(a.oneYearReturnPct), taxHas: a.taxDeductionRemainingKrw != null, taxPaid: 0, recent: { d: r ? date(r.openedAt) : '—', n: r ? r.productName : '—', a: r ? contract.money(r.amountKrw) : '—' } };
  }
  function build(record) {
    var base = {}, customer = record.customer, account = record.irpAccount, d = customer.defaultOption;
    base.selName = customer.name;
    base.pfPin = displayId(customer.customerId);
    base.pfRows = [{ l: '나이 · 성별', v: (customer.age == null ? '확인 필요' : customer.age + '세') + ' · ' + (customer.gender || '확인 필요') }, { l: '스타클럽 등급', v: customer.starClubGrade || '확인 필요' }, { l: '투자성향', v: customer.investmentProfile || '확인 필요' }];
    base.pfAmt = contract.money(account.valuationAmountKrw);
    base.pfRet = contract.percent(account.oneYearReturnPct);
    base.pfRetFg = color(account.oneYearReturnPct);
    base.pfTaxRemain = contract.money(account.taxDeductionRemainingKrw);
    base.pfTaxFg = account.taxDeductionRemainingKrw == null || account.taxDeductionRemainingKrw === 0 ? '#9298A2' : color(account.taxDeductionRemainingKrw);
    base.pfDo = d.registrationStatus + (d.designatedProduct ? ' · ' + d.designatedProduct.productName : '');
    base.pfDoFg = d.registrationStatus === '등록' ? '#047857' : '#A96A00';
    base.pfDoBg = d.registrationStatus === '등록' ? '#E6F6EF' : '#F9EFD8';
    base.pfDoApplication = d.applicationStatus || '확인 필요';
    var total = account.valuationAmountKrw, acc = 0, circumference = 2 * Math.PI * 54;
    base.pfPort = account.assetAllocation.map(function (a) { return { l: a.assetType, color: colors[a.assetType] || '#9298A2', v: contract.money(a.amountKrw), w: total ? weight(a.weightPct) : '—' }; });
    base.pfArcs = account.assetAllocation.filter(function (a) { return total > 0 && a.amountKrw > 0; }).map(function (a) {
      var fraction = a.amountKrw / total, arc = { color: colors[a.assetType] || '#9298A2', dash: (fraction * circumference).toFixed(1) + ' ' + circumference.toFixed(1), off: (-acc * circumference).toFixed(1) };
      acc += fraction; return arc;
    });
    base.selHoldings = record.holdings.map(function (h) { return { n: h.productName + (h.contractTerm ? ' · ' + h.contractTerm : ''), t: h.assetType, a: contract.money(h.valuationAmountKrw), w: total ? weight(h.weightPct) : '—', r: contract.percent(h.oneYearReturnPct), rc: color(h.oneYearReturnPct), redeem: h.flags.indexOf('환매추천') >= 0 }; });
    base.holdCount = record.holdings.length;
    base.holdingReturnLabel = '수익률 / 기간금리';
    base.holdingReturnNote = '실적배당형은 자료상 1년 수익률, 원리금보장형은 계약기간의 표시금리입니다. 계좌 수익률과 계산 기준이 다를 수 있습니다.';
    base.profileAnalysisLabel = date(record.briefingMeta.asOfDate) + ' 기준';
    base.bfBadges = labels(record).map(badge);

    return base;
  }
  return { stub: stub, row: row, profile: profile, build: build, badge: badge, keyOf: keyOf, priority: priority, labels: labels, displayId: displayId };
});

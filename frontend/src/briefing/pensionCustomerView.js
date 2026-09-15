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

  function stub(record) {
    var c = record.customer;
    return { id: record.briefingMeta.caseId, name: c.name, cno: c.customerId, phone: '', product: 'IRP', profile: c.investmentProfile || '확인 필요', deposit: contract.money(record.irpAccount.valuationAmountKrw).replace(/원$/, ''), bar: '#FFCC00', hold: [], tags: [], chips: [] };
  }
  function profile(record) {
    var c = record.customer, a = record.irpAccount, d = c.defaultOption, r = a.latestProductOpening;
    return { pin: c.customerId, age: c.age == null ? '확인 필요' : c.age, sex: c.gender || '확인 필요', club: c.starClubGrade || '확인 필요', acct: date(c.irpOpenedAt), dopt: d.registrationStatus === '등록', doptName: d.designatedProduct ? d.designatedProduct.productName : '', ret: contract.percent(a.oneYearReturnPct), taxHas: a.taxDeductionRemainingKrw != null, taxPaid: 0, recent: { d: r ? date(r.openedAt) : '—', n: r ? r.productName : '—', a: r ? contract.money(r.amountKrw) : '—' } };
  }
  function build(record) {
    var base = {}, customer = record.customer, account = record.irpAccount, d = customer.defaultOption;
    base.selName = customer.name;
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
    base.bfBadges = (record.signals || []).map(function (s) { return { t: typeof s === 'string' ? s : s.label || s.text || '', bg: '#FFF3C2', fg: '#7A6108' }; }).filter(function (s) { return !!s.t; });

    return base;
  }
  return { stub: stub, profile: profile, build: build };
});

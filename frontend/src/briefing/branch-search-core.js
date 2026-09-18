/* Branch search v0.3: deterministic evaluator and reviewed utterance recipes.
 * No LLM, network, evaluation-answer imports, or customer-data writes.
 * Dates are evaluated against the fixture asOfDate, never the system clock.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PensionBranchSearchCore = factory();
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  const copy = x => JSON.parse(JSON.stringify(x));
  const all = () => ({ op: 'all_records' });
  const segment = label => ({ op: 'segment_registered', label });
  const compare = (field, cmp, value) => ({ op: 'compare', field, cmp, value });
  const defaultSort = () => ({ field: 'caseId', direction: 'asc' });
  const idOf = r => r.briefingMeta.caseId;
  const number = v => typeof v === 'number' && Number.isFinite(v);
  const asset = (r, t) => (r.irpAccount.assetAllocation || []).find(a => a.assetType === t);
  const argsOf = q => !q || q.op === 'all_records' ? [] : q.op === 'and' ? q.args : [q];
  function and() {
    const terms = Array.from(arguments).flatMap(argsOf);
    const seen = new Set();
    const list = terms.filter(q => { const k = JSON.stringify(q); if (seen.has(k)) return false; seen.add(k); return true; });
    return list.length === 0 ? all() : list.length === 1 ? list[0] : { op: 'and', args: list };
  }
  function remove(q, predicate) {
    if (!q || predicate(q)) return all();
    if (q.op === 'and') return and(...q.args.map(x => remove(x, predicate)));
    // OR chips are removed as a group; do not silently turn A OR B into A AND B.
    return copy(q);
  }
  function dateAdd(date, days) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Invalid snapshot date');
    const d = new Date(date + 'T00:00:00Z');
    if (!Number.isFinite(d.getTime())) throw new Error('Invalid snapshot date');
    d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10);
  }
  const dayDiff = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000);
  function value(r, field) {
    const a = r.irpAccount, s = r.searchSupplement || {}, c = r.customer;
    switch (field) {
      case 'caseId': return idOf(r);
      case 'source_order': return r.searchSource ? r.searchSource.originalOrder : null;
      case 'name': return c.name;
      case 'customerId': return c.customerId;
      case 'age': return c.age;
      case 'grade': return c.starClubGrade;
      case 'profile': return c.investmentProfile;
      case 'trigger_risk': return (s.triggers || {}).risk;
      case 'trigger_mat': return (s.triggers || {}).mat;
      case 'trigger_imp': return (s.triggers || {}).imp;
      case 'trigger_opp': return (s.triggers || {}).opp;
      case 'irp_amount': return a.valuationAmountKrw;
      case 'return_pct': return a.oneYearReturnPct;
      case 'cash_amount': return (asset(r, '현금성자산') || {}).amountKrw;
      case 'cash_pct': return (asset(r, '현금성자산') || {}).weightPct;
      case 'protected_amount': return (asset(r, '원리금보장형') || {}).amountKrw;
      case 'protected_pct': return (asset(r, '원리금보장형') || {}).weightPct;
      case 'tax_remaining': return a.taxDeductionRemainingKrw;
      case 'auto_registered': return (s.autoTransfer || {}).registered;
      case 'auto_monthly': return (s.autoTransfer || {}).monthlyAmountKrw;
      case 'deposit_configured': return (s.depositPurchase || {}).configured;
      default: throw new Error('Unsupported field: ' + field);
    }
  }
  const fields = ['caseId','name','customerId','age','grade','profile','irp_amount','return_pct','cash_amount','cash_pct','protected_amount','protected_pct','tax_remaining','auto_registered','auto_monthly','deposit_configured','trigger_risk','trigger_mat','trigger_imp','trigger_opp','source_order'];
  function cmp(v, op, target) {
    if (v == null) return null;
    if (op === 'eq') return v === target;
    if (!number(v) || !number(target)) return null;
    if (op === 'gte') return v >= target;
    if (op === 'gt') return v > target;
    if (op === 'lte') return v <= target;
    if (op === 'lt') return v < target;
    throw new Error('Unsupported comparator');
  }
  const triAnd = list => list.includes(false) ? false : list.includes(null) ? null : true;
  const triOr = list => list.includes(true) ? true : list.includes(null) ? null : false;
  function between(v, start, end) {
    if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
    return v >= start && v <= end;
  }
  function sumKnown(list) {
    if (!list.length) return { value: null, known: 0, unknown: 0 };
    const known = list.filter(number);
    return { value: known.length ? known.reduce((s, x) => s + x, 0) : null, known: known.length, unknown: list.length - known.length };
  }
  const external = (r, type) => ((r.searchSupplement || {}).externalAccounts || []).filter(x => x.type === type);
  function evaluate(r, q) {
    if (!q || q.op === 'all_records') return true;
    const s = r.searchSupplement || {};
    switch (q.op) {
      case 'and': return triAnd(q.args.map(x => evaluate(r, x)));
      case 'or': return triOr(q.args.map(x => evaluate(r, x)));
      case 'case_ids': return q.ids.includes(idOf(r));
      case 'segment_registered': return (r.signals || []).some(x => x.label === q.label);
      case 'segment_family': return (r.signals || []).some(x => x.label === q.label || x.label.startsWith(q.label + ' D-') || (q.label === '추가납입' && /^추가납입 [\d,.]+만원$/.test(x.label)));
      case 'compare': return cmp(value(r, q.field), q.cmp, q.value);
      case 'segment_date_between': {
        const signals = (r.signals || []).filter(x => x.label === q.label);
        return signals.length ? triOr(signals.map(x => between(x.date, q.start, q.end))) : false;
      }
      case 'do_between': return s.defaultOptionExecution ? between(s.defaultOptionExecution.scheduledAt, q.start, q.end) : null;
      case 'isa_between': {
        const accts = external(r, 'ISA');
        return accts.length ? triOr(accts.map(a => triAnd([
          between(a.maturityDate, q.start, q.end),
          q.minAmountKrw == null ? true : cmp(a.valuationAmountKrw, 'gte', q.minAmountKrw)
        ]))) : false; // Searches *recorded* ISA accounts, not negative ownership evidence.
      }
      case 'holding_sum_gte': {
        if (!Array.isArray(r.holdings)) return null;
        const rows = r.holdings.filter(h => h.productCategory === q.category);
        if (!rows.length) return cmp(0, 'gte', q.minAmountKrw);
        const sum = sumKnown(rows.map(h => h.valuationAmountKrw));
        if (sum.value != null && sum.value >= q.minAmountKrw) return true;
        return sum.unknown ? null : false;
      }
      case 'holding_exists': {
        if (!Array.isArray(r.holdings)) return null;
        return triOr(r.holdings.filter(h => h.productId === q.productId).map(h => cmp(h.valuationAmountKrw, 'gte', q.minAmountKrw)));
      }
      case 'external_irp_sum_gte': {
        const rows = external(r, '개인형IRP');
        if (!rows.length) return null;
        const sum = sumKnown(rows.map(a => a.valuationAmountKrw));
        if (sum.value != null && sum.value >= q.minAmountKrw) return true;
        return sum.unknown ? null : false;
      }
      default: throw new Error('Unsupported query: ' + q.op);
    }
  }
  function validateQuery(q, depth) {
    depth = depth || 0;
    if (!q || typeof q !== 'object' || depth > 8) throw new Error('Invalid query');
    switch (q.op) {
      case 'all_records': return;
      case 'and': case 'or':
        if (!Array.isArray(q.args) || !q.args.length || q.args.length > 30) throw new Error('Invalid group');
        q.args.forEach(x => validateQuery(x, depth + 1)); return;
      case 'compare':
        if (!fields.includes(q.field) || !['eq','gte','gt','lte','lt'].includes(q.cmp)) throw new Error('Unsupported field/operator');
        if (!['string','number','boolean'].includes(typeof q.value)) throw new Error('Invalid condition value'); return;
      case 'segment_registered': case 'segment_family':
        if (typeof q.label !== 'string' || q.label.length > 80) throw new Error('Invalid segment'); return;
      case 'case_ids':
        if (!Array.isArray(q.ids)) throw new Error('Invalid IDs'); return;
      case 'do_between': case 'isa_between': case 'segment_date_between':
        dateAdd(q.start, 0); dateAdd(q.end, 0);
        if (q.start > q.end) throw new Error('Invalid date range'); return;
      case 'holding_sum_gte': case 'holding_exists': case 'external_irp_sum_gte':
        if (!number(q.minAmountKrw) || q.minAmountKrw < 0) throw new Error('Invalid amount'); return;
      default: throw new Error('Unsupported query');
    }
  }
  function run(records, query, sort, limit) {
    validateQuery(query); sort = sort || defaultSort();
    if (!fields.includes(sort.field) || !['asc','desc'].includes(sort.direction)) throw new Error('Invalid sort');
    if (limit != null && (!Number.isInteger(limit) || limit < 1 || limit > 1000)) throw new Error('Invalid limit');
    const matched = [], unknown = [], seen = new Set();
    records.forEach(r => {
      const identity = r.customer.customerId || ('view:' + idOf(r));
      if (seen.has(identity)) return;
      seen.add(identity);
      const t = evaluate(r, query); if (t === true) matched.push(r); else if (t === null) unknown.push(r);
    });
    const ordered = matched.slice().sort((a, b) => {
      const x = value(a, sort.field), y = value(b, sort.field);
      if (x == null && y != null) return 1; if (y == null && x != null) return -1;
      const sign = sort.direction === 'desc' ? -1 : 1;
      return (x < y ? -sign : x > y ? sign : 0) || idOf(a).localeCompare(idOf(b));
    });
    return {
      matchedCaseIds: matched.map(idOf).sort(), matchedCount: matched.length,
      orderedCaseIds: ordered.map(idOf), unknownCaseIds: unknown.map(idOf).sort(), unknownCount: unknown.length,
      resultPreviewCaseIds: (limit == null ? ordered : ordered.slice(0, limit)).map(idOf),
      resultPreviewCount: limit == null ? ordered.length : Math.min(limit, ordered.length),
      resultStatus: unknown.length ? 'partial' : matched.length ? 'ok' : 'empty',
      resolvedQuery: copy(query), sort: copy(sort), limit: limit == null ? null : limit
    };
  }
  function money(v) {
    if (!number(v)) return '미확인';
    if (v === 0) return '0원';
    const abs = Math.abs(v); if (abs < 10000) return v.toLocaleString('ko-KR') + '원';
    if (v % 10000) return v.toLocaleString('ko-KR') + '원';
    const eok = Math.floor(abs / 100000000), man = abs % 100000000 / 10000;
    return (v < 0 ? '-' : '') + (eok ? eok.toLocaleString('ko-KR') + '억' : '') +
      (eok && man ? ' ' : '') + (man ? man.toLocaleString('ko-KR') + '만' : '') + '원';
  }
  function flatten(q) { return q && ['and','or'].includes(q.op) ? q.args.flatMap(flatten) : q ? [q] : []; }
  function metrics(records, result, kind, asOf) {
    const seenCustomers = new Set();
    const matched = records.filter(r => {
      const identity = r.customer.customerId || ('view:' + idOf(r));
      if (!result.matchedCaseIds.includes(idOf(r)) || seenCustomers.has(identity)) return false;
      seenCustomers.add(identity); return true;
    });
    if (kind === 'overview') {
      const totalCoverage = sumKnown(matched.map(r => r.irpAccount.valuationAmountKrw));
      const total = totalCoverage.value;
      return { customerCount: matched.length, irpAmountKrw: total,
        assetAllocation: ['원리금보장형','실적배당형','현금성자산'].map(t => {
          const sum = sumKnown(matched.map(r => (asset(r, t) || {}).amountKrw));
          const live = records.some(r => r.searchSource);
          const m = { assetType: t, amountKrw: sum.value, weightPct: total && sum.value != null && (!live || (!sum.unknown && !totalCoverage.unknown)) ? +(sum.value / total * 100).toFixed(2) : null };
          if (live) { m.knownCount = sum.known; m.unknownCount = sum.unknown; }
          return m;
        }) };
    }
    if (kind === 'cash_sum') {
      const sum = sumKnown(matched.map(r => value(r, 'cash_amount')));
      const m = { customerCount: matched.length, cashAmountKrw: matched.length ? sum.value : 0 };
      if (records.some(r => r.searchSource)) { m.cashKnownCount = sum.known; m.cashUnknownCount = sum.unknown; }
      return m;
    }
    if (kind === 'do_detail' && matched.length === 1) {
      const d = matched[0].searchSupplement.defaultOptionExecution;
      return { executionDate: d.scheduledAt, daysUntil: dayDiff(asOf, d.scheduledAt), executionAmountKrw: d.amountKrw };
    }
    if (kind === 'isa_detail') {
      const q = flatten(result.resolvedQuery).find(x => x.op === 'isa_between');
      const entries = matched.flatMap(r => external(r, 'ISA').filter(a => between(a.maturityDate, q.start, q.end) === true).map(a => ({ r, a })));
      if (q.minAmountKrw != null) return { knownIsaAmountKrw: sumKnown(entries.filter(x => number(x.a.valuationAmountKrw) && x.a.valuationAmountKrw >= q.minAmountKrw).map(x => x.a.valuationAmountKrw)).value };
      const known = entries.filter(x => number(x.a.valuationAmountKrw)), unknown = entries.filter(x => !number(x.a.valuationAmountKrw));
      return { isaKnownAmountSumKrw: sumKnown(known.map(x => x.a.valuationAmountKrw)).value,
        isaAmountKnownCount: known.length, isaAmountUnknownCount: unknown.length,
        isaAmountUnknownCaseIds: [...new Set(unknown.map(x => idOf(x.r)))].sort() };
    }
    if (kind === 'deposit_detail') return { depositAmountsByCaseId: Object.fromEntries(matched.map(r => [idOf(r), r.holdings.filter(h => h.productCategory === '정기예금').reduce((s,h) => s+h.valuationAmountKrw,0)])) };
    if (kind === 'external_detail') {
      const rows = matched.flatMap(r => external(r, '개인형IRP'));
      const dates = [...new Set(rows.map(a => a.verifiedAt).filter(Boolean))];
      return { externalIrpCount: rows.length, knownExternalIrpAmountKrw: sumKnown(rows.map(x=>x.valuationAmountKrw)).value,
        verificationDate: dates.length === 1 ? dates[0] : null, includesInternalIrp: false };
    }
    return {};
  }
  const labels = { age:'연령', irp_amount:'IRP 평가금액', cash_amount:'현금성자산', cash_pct:'현금성 비중',
    protected_amount:'원리금보장 금액', protected_pct:'원리금보장 비중', return_pct:'계좌 1년 수익률', tax_remaining:'공제 잔여한도',
    auto_monthly:'월 자동이체', auto_registered:'자동이체 등록', deposit_configured:'입금매수상품 지정', grade:'관리등급', profile:'투자성향', name:'고객명', customerId:'고객번호', caseId:'고객번호 순' };
  function describe(q) {
    if (!q || q.op === 'all_records') return '현재 메인 목록 전체';
    switch (q.op) {
      case 'and': return q.args.map(describe).join(' · ');
      case 'or': return '(' + q.args.map(describe).join(' 또는 ') + ')';
      case 'segment_registered': case 'segment_family': return q.label;
      case 'case_ids': return '선택한 결과 집합';
      case 'compare': {
        const v = q.field === 'age' ? q.value + '세' : q.field.endsWith('_pct') ? q.value + '%' : typeof q.value === 'boolean' ? q.value ? '예' : '아니오' : typeof q.value === 'number' ? money(q.value) : q.value;
        return (labels[q.field] || q.field) + ' ' + v + ({gte:' 이상',gt:' 초과',lte:' 이하',lt:' 미만',eq:''}[q.cmp]);
      }
      case 'do_between': return 'DO 실행 ' + q.start.slice(5).replace('-','.') + '~' + q.end.slice(5).replace('-','.');
      case 'isa_between': return 'ISA 만기 ' + q.start.slice(5).replace('-','.') + '~' + q.end.slice(5).replace('-','.') + (q.minAmountKrw != null ? ' · ISA ' + money(q.minAmountKrw) + ' 이상' : '');
      case 'segment_date_between': return q.label + ' ' + q.start.slice(5).replace('-','.') + '~' + q.end.slice(5).replace('-','.');
      case 'holding_sum_gte': return q.category + ' 합계 ' + money(q.minAmountKrw) + ' 이상';
      case 'holding_exists': return (q.productId === 'SAV-013' ? 'DB저축은행 예금' : q.productId) + ' 한 상품 ' + money(q.minAmountKrw) + ' 이상';
      case 'external_irp_sum_gte': return '확인된 타행 IRP 합계 ' + money(q.minAmountKrw) + ' 이상';
      default: return q.op;
    }
  }
  function chips(query) { return argsOf(query).map(q => ({ label: describe(q), query: copy(q), key: JSON.stringify(q) })); }
  function sortLabel(sort) {
    if (!sort || sort.field === 'caseId') return '고객번호 순';
    if (sort.field === 'source_order') return '기존 목록 순';
    return (labels[sort.field] || sort.field) + (sort.direction === 'desc' ? ' 높은 순' : ' 낮은 순');
  }
  function answer(records, result, kind, asOf) {
    const m = result.metrics, names = result.resultPreviewCaseIds.map(id => records.find(r => idOf(r) === id).customer.name).join('·');
    let text;
    if (kind === 'overview') {
      const cash = m.assetAllocation.find(a => a.assetType === '현금성자산');
      text = '조회 대상 고객 ' + m.customerCount + '명 기준입니다.\n확인된 IRP 평가금액 합계는 ' + money(m.irpAmountKrw) + ', 현금성자산 합계는 ' + money(cash.amountKrw) + '입니다.';
      if (cash.unknownCount) text += '\n현금성 금액 확인 ' + cash.knownCount + '명 · 미확인 ' + cash.unknownCount + '명. 합계는 확인된 금액만 포함합니다.';
    } else if (kind === 'cash_sum') text = '등록된 조건에 해당하는 고객은 ' + m.customerCount + '명입니다.\n현금성자산 합계는 ' + money(m.cashAmountKrw) + '입니다.';
    else if (!result.matchedCount) text = '확인된 조건 충족 고객은 0명입니다. 입력한 조건은 그대로 유지했습니다.';
    else text = (result.unknownCount ? '조건 충족이 확인된 고객은 ' : '조건에 맞는 고객은 ') + result.matchedCount + '명입니다.\n' +
      (result.resultPreviewCount < result.matchedCount ? '그중 ' + sortLabel(result.sort) + '으로 상위 ' + result.resultPreviewCount + '명(' + names + ')을 표시합니다.' : names + ' 고객을 찾았습니다.');
    if (result.intent === 'extract' && result.resultPreviewCount > 0 && result.resultPreviewCount <= 3 && !['do_detail','isa_detail','external_detail'].includes(kind)) {
      const terms = flatten(result.resolvedQuery);
      let detailFields = [];
      if (!['caseId', 'source_order'].includes(result.sort.field)) detailFields.push(result.sort.field);
      terms.filter(q => q.op === 'compare' && ['irp_amount','cash_amount','cash_pct','age','auto_monthly','tax_remaining'].includes(q.field)).forEach(q => detailFields.push(q.field));
      detailFields = [...new Set(detailFields)].slice(0, 2);
      const detailLines = result.resultPreviewCaseIds.map(id => {
        const r = records.find(x => idOf(x) === id), bits = detailFields.map(f => {
          const v = value(r, f); return labels[f] + ' ' + (f === 'age' ? v + '세' : f.endsWith('_pct') ? v + '%' : money(v));
        });
        if (kind === 'deposit_detail') bits.push('정기예금 합계 ' + money(m.depositAmountsByCaseId[id]));
        const hq = terms.find(q => q.op === 'holding_exists');
        if (hq) bits.push('해당 상품 ' + money(r.holdings.find(h => h.productId === hq.productId && h.valuationAmountKrw >= hq.minAmountKrw).valuationAmountKrw));
        const dq = terms.find(q => q.op === 'segment_date_between');
        if (dq) { const signal = r.signals.find(x => x.label === dq.label && between(x.date, dq.start, dq.end)); if (signal) bits.push('조회일 ' + signal.date); }
        return bits.length ? r.customer.name + ': ' + bits.join(' · ') : '';
      }).filter(Boolean);
      if (detailLines.length) text += '\n' + detailLines.join('\n');
    }
    if (kind === 'cash_sum' && m.cashUnknownCount) text += '\n금액 확인 ' + m.cashKnownCount + '명 · 미확인 ' + m.cashUnknownCount + '명. 미확인은 0원으로 합산하지 않았습니다.';
    if (kind === 'do_detail' && m.executionDate) text += '\n실행예정일 ' + m.executionDate + ' (D-' + m.daysUntil + '), 대상금액 ' + money(m.executionAmountKrw) + '.';
    if (kind === 'isa_detail') text += '\n확인된 ISA 평가금액 합계: ' + money(m.knownIsaAmountKrw !== undefined ? m.knownIsaAmountKrw : m.isaKnownAmountSumKrw) + '.' + (m.isaAmountUnknownCount ? ' 금액 미확인 ' + m.isaAmountUnknownCount + '건은 합산하지 않았습니다.' : '');
    if (kind === 'external_detail') text += '\n확인된 외부 IRP ' + m.externalIrpCount + '개 · ' + money(m.knownExternalIrpAmountKrw) + '.\n확인일 ' + m.verificationDate + ' · 원본에 기록된 계좌만 합산했으며 실시간 갱신값으로 간주하지 않습니다.';
    if (kind === 'deposit_detail') text += '\n정기예금 금액을 고객별로 합산한 뒤 IRP 전체 잔액으로 정렬했습니다.';
    if (result.unknownCount) text += '\n확인 필요 ' + result.unknownCount + '명';
    return text;
  }

  // Reviewed recipes contain only utterances and semantic queries, never expected IDs or amounts.
  const questions = [
    ['G01','우리 부점 IRP 고객 현황을 요약해줘.'],
    ['G02','납입금 미운용 고객 중 IRP 잔액 2천만원 이상만 보여줘.'],
    ['G03','현금성자산 500만원 이상이고 비중이 10% 이상인 고객 보여줘.'],
    ['G04','납입금 미운용이거나 이탈징후가 등록된 고객을 보여줘.'],
    ['G05','앞으로 7일 안에 DO가 실행되는 고객 중 투자성향-DO불일치 고객을 보여줘.'],
    ['G06','앞으로 30일 이내 ISA 만기 고객을 보여주고, 확인된 ISA 평가금액도 알려줘.'],
    ['G07','앞으로 45일 이내 ISA 만기 고객 중 ISA 평가금액 3천만원 이상인 고객을 보여줘.'],
    ['G08','정기예금을 합계 5천만원 이상 보유한 고객을 IRP 잔액 큰 순으로 보여줘.'],
    ['G09','DB저축은행 퇴직연금 정기예금을 한 상품에 3천만원 이상 보유한 고객 보여줘.'],
    ['G10','월 30만원 이상 자동이체 중인데 입금매수상품이 미지정인 고객 보여줘.'],
    ['G11','타행 IRP 보유가 등록된 고객 중 확인된 외부 IRP 합계가 5천만원 이상인 고객 보여줘.'],
    ['G12','세액공제 잔여한도가 0원인 고객 보여줘.'],
    ['G13','펀드 상품조회가 등록된 고객 중 최근 7일 이내 조회일이 있는 고객만 보여줘.'],
    ['G14','검토 고객 중 IRP 잔액 1억원 이상인 고객 보여줘.'],
    ['G15','최근 7일 동안 ETF를 한 번도 조회하지 않은 고객만 보여줘.'],
    ['G16','지난달보다 현금성자산이 늘어난 고객을 찾아줘.'],
    ['G17','이 고객들에게 ETF를 골라서 자동매수해줘.'],
    ['G18','현금이 많은 고객 찾아줘.']
  ];
  const turns = [
    '우리 부점에서 납입금 미운용 고객은 몇 명이고, 현금성자산 합계는 얼마야?',
    '그중 IRP 잔액 2천만원 이상만 보여줘.',
    '잔액 조건은 빼고, 현금성자산 많은 순으로 1명만 보여줘.',
    '그중 38세 이상만 남겨줘.',
    '나이 조건은 빼고, 최근 7일 이내 펀드 상품조회한 고객만.',
    '조건을 모두 지우고, 전체 검토 고객에서 현금성자산 500만원 이상을 금액 큰 순으로 전부 보여줘.'
  ];
  const norm = s => String(s).normalize('NFKC').trim().replace(/[?!？。·,]/g, '').replace(/\.$/, '').replace(/\s/g, '').toLowerCase();
  const aliases = {
    G01: ['우리 부점 현황','IRP 고객 현황'],
    G05: ['7일 안에 DO가 실행되는 고객 중 투자성향-DO불일치 고객을 보여줘.'],
    G06: ['앞으로 30일 이내 ISA 만기 예정인 고객을 보여줘.'],
    G14: ['IRP 잔액 1억원 이상인 고객 보여줘.'],
    M01T1: ['납입금 미운용 고객은 몇 명이고, 현금성자산 합계는 얼마야?']
  };
  function error(status, text) { return { error: status, answer: text }; }
  function resolve(text, state, asOf) {
    const n = norm(text), matched = questions.find(x => norm(x[1]) === n);
    let id = matched && matched[0];
    if (!id) Object.keys(aliases).some(k => { if (aliases[k].some(s=>norm(s)===n)) { id=k; return true; } return false; });
    const ti = turns.findIndex(s=>norm(s)===n);
    if (ti >= 0) id = 'M01T' + (ti + 1);
    const base = () => ({ intent: 'extract', query: all(), sort: defaultSort(), limit: null, metric: null, recipeId: id });
    let out = base();
    const fundRecent = () => and(segment('펀드 상품조회'), {op:'segment_date_between',label:'펀드 상품조회',start:dateAdd(asOf,-6),end:asOf});
    switch (id) {
      case 'G01': out.intent='aggregate'; out.metric='overview'; break;
      case 'G02': out.query=and(segment('납입금 미운용'),compare('irp_amount','gte',20000000)); break;
      case 'G03': out.query=and(compare('cash_amount','gte',5000000),compare('cash_pct','gte',10)); break;
      case 'G04': out.query={op:'or',args:[segment('납입금 미운용'),segment('이탈징후')]}; break;
      case 'G05': out.query=and({op:'do_between',start:asOf,end:dateAdd(asOf,7)},segment('투자성향-DO불일치')); out.metric='do_detail'; break;
      case 'G06': case 'G07': out.query={op:'isa_between',start:asOf,end:dateAdd(asOf,id==='G06'?30:45)};
        if(id==='G07')out.query.minAmountKrw=30000000; out.metric='isa_detail'; break;
      case 'G08': out.query={op:'holding_sum_gte',category:'정기예금',minAmountKrw:50000000}; out.sort={field:'irp_amount',direction:'desc'};out.metric='deposit_detail';break;
      case 'G09': out.query={op:'holding_exists',productId:'SAV-013',minAmountKrw:30000000};break;
      case 'G10':out.query=and(compare('auto_registered','eq',true),compare('auto_monthly','gte',300000),compare('deposit_configured','eq',false));break;
      case 'G11':out.query=and(segment('타행 IRP 보유'),{op:'external_irp_sum_gte',minAmountKrw:50000000});out.metric='external_detail';break;
      case 'G12':out.query=compare('tax_remaining','eq',0);break;
      case 'G13':out.query=fundRecent();break;
      case 'G14':out.query=compare('irp_amount','gte',100000000);break;
      case 'G15':return error('insufficient_data','기간 전체의 ETF 방문·조회 로그가 없어 미조회 고객을 확정할 수 없습니다. 등록 태그가 없다는 것을 실제 미조회로 보지는 않습니다. 기존 목록은 유지합니다.');
      case 'G16':return error('unsupported_history','동일 정의의 전월말 현금성자산 스냅샷이 없어 전월 대비 증감을 계산할 수 없습니다. 현재 금액 기준으로 조회해 주세요. 기존 목록은 유지합니다.');
      case 'G17':return error('out_of_scope','이 대화창은 고객 조회·집계·추출 기능입니다. 상품 추천이나 자동매수를 실행하지 않습니다. 기존 목록은 유지합니다.');
      case 'G18':return error('clarification_required','현금성자산 금액으로 찾을까요, 비중으로 찾을까요? 예를 들어 “현금성자산 500만원 이상”처럼 기준을 알려주세요.');
      case 'M01T1':out.intent='aggregate';out.query=segment('납입금 미운용');out.metric='cash_sum';break;
      case 'M01T2': case 'M01T3':case 'M01T4':case 'M01T5': {
        if(!state.reference) return error('clarification_required','이어갈 검색조건이 없습니다. 먼저 찾고 싶은 고객 조건을 알려주세요.');
        out = Object.assign(out,copy(state.reference)); out.intent='extract'; out.metric=null; out.recipeId=id;
        if(id==='M01T2') out.query=and(out.query,compare('irp_amount','gte',20000000));
        if(id==='M01T3'){out.query=remove(out.query,q=>q.field==='irp_amount');out.sort={field:'cash_amount',direction:'desc'};out.limit=1;}
        if(id==='M01T4')out.query=and(out.query,compare('age','gte',38));
        if(id==='M01T5')out.query=and(remove(out.query,q=>q.field==='age'),fundRecent());
        break;
      }
      case 'M01T6':out.query=compare('cash_amount','gte',5000000);out.sort={field:'cash_amount',direction:'desc'};out.limit=null;break;
      default: {
        // Deliberately bounded grammar: refuse unrecognised clauses instead of dropping them.
        if (['조건전부지워줘','조건모두해제','전체조건해제','전체보기'].includes(n)) return out;
        const m = n.match(/^(그중)?(irp잔액|현금성자산|현금성비중|원리금보장비중|연령)(\d+(?:\.\d+)?)(억원|천만원|만원|원|%|세)(이상|이하|초과|미만)(인)?(고객)?(만)?(보여줘|찾아줘|남겨줘)?$/);
        if(m){
          const f={'irp잔액':'irp_amount','현금성자산':'cash_amount','현금성비중':'cash_pct','원리금보장비중':'protected_pct','연령':'age'}[m[2]];
          if((f==='age' && m[4]!=='세') || (f.endsWith('_pct') && m[4]!=='%') || (f.endsWith('_amount') && !m[4].endsWith('원')))return error('clarification_required','금액·비중·연령에 맞는 단위를 입력해 주세요.');
          const mult={'억원':1e8,'천만원':1e7,'만원':1e4,'원':1,'%':1,'세':1}[m[4]];
          const q=compare(f,{'이상':'gte','이하':'lte','초과':'gt','미만':'lt'}[m[5]],Math.round(Number(m[3])*mult));
          if(m[1]){if(!state.reference)return error('clarification_required','먼저 검색조건을 지정해 주세요.'); out=Object.assign(out,copy(state.reference),{intent:'extract',metric:null});out.query=and(out.query,q);} else out.query=q;
          return out;
        }
        return error('unsupported_mock','현재는 골든셋 기반 목업입니다. 이 문장은 아직 연결하지 않았습니다. “예시 질문”에서 지원하는 질문을 선택하거나, “현금성자산 500만원 이상”처럼 입력해 주세요. 기존 목록은 유지합니다.');
      }
    }
    return out;
  }
  function initialState(records) {
    const ids=records.map(idOf).sort();
    return {reference:null,main:{query:all(),sort:defaultSort(),limit:null},mainListCaseIds:ids,mainMatchedCount:ids.length,mainUnknownCaseIds:[],lastResult:null};
  }
  // options.applyAggregate: also apply an aggregate answer's customer set to the main list (screen behaviour).
  function execute(records, state, request, asOf, options) {
    const next=copy(state);
    if(request.error) return {state:next,result:{intent:request.error,resultStatus:request.error,matchedCount:null,matchedCaseIds:null,unknownCaseIds:null,resolvedQuery:null,metrics:{},answer:request.answer,uiEffect:'keep_list_and_query',resultPreviewCaseIds:null,resultPreviewCount:null,mainListCaseIds:copy(state.mainListCaseIds),mainListCount:state.mainListCaseIds.length}};
    const res=run(records,request.query,request.sort,request.limit);
    res.intent=request.intent;res.metrics=metrics(records,res,request.metric,asOf);res.recipeId=request.recipeId || null;
    const spec={query:copy(request.query),sort:copy(res.sort),limit:res.limit}; next.reference=spec;
    const applyList=request.intent!=='aggregate'||!!(options&&options.applyAggregate);
    res.uiEffect=applyList?'apply_customer_list':'answer_only_keep_list';
    if(applyList){
      next.main=copy(spec);next.mainListCaseIds=copy(res.resultPreviewCaseIds);next.mainMatchedCount=res.matchedCount;next.mainUnknownCaseIds=copy(res.unknownCaseIds);
    }
    res.mainListCaseIds=copy(next.mainListCaseIds);res.mainListCount=next.mainListCaseIds.length;
    res.answer=answer(records,res,request.metric,asOf);next.lastResult=copy(res);
    return {state:next,result:res};
  }
  function step(records,state,text,asOf){return execute(records,state,resolve(text,state,asOf),asOf);}
  return {version:'branch-search-current.v0.3',copy,all,segment,compare,and,remove,fields,value,idOf,asset,run,evaluate,dateAdd,dayDiff,money,describe,chips,sortLabel,questions,turns,resolve,initialState,execute,step};
});

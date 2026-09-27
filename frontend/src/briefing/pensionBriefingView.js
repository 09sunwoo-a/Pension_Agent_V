/* Section-specific mappings to the existing vanilla template.
 * Input: normalized briefing content + UI interactions. No transport or fixtures.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./briefing-contract'));
  else root.PensionBriefingView = factory(root.PensionBriefingContract);
})(typeof window === 'undefined' ? globalThis : window, function (contract) {
  'use strict';
  var date = function (v) { return v ? v.replace(/-/g, '.') : ''; };
  // Presentation labels live here, not in narrative JSON or the API contract.
  var labels = {
    s1: '고객님의 최근 금융상황을 분석했습니다.', s2: '이번 상담에서 확인할 점',
    s3: '관리 방향 및 제안', s4: '상담 Point', s5: 'TIP & 실행',
    why: '왜 지금?', checks: '고객과 확인', opening: '💬 이렇게 시작해보세요',
    reactions: '고객 반응에 따라', sources: '근거 자료 · 검토사항',
    products: '추천상품 보기', details: '상세 보기'
  };
  function s1(component, b) {
    var base = {};
    base.bfS1Lines = b.s1.items.map(function (item, i) { return { no: i + 1, t: component.bold(item.text), fg: i ? '#4E545C' : '#26282C', fw: i ? 400 : 800 }; });
    return base;
  }
  function s2(component, b) {
    var base = {};
    base.bfS2Lead = component.bold(b.s2.lead);
    base.bfS2Why = component.bold(b.s2.why);
    base.bfS2Checks = b.s2.checks.map(function (t) { return { t: t }; });
    base.hasWhy = !!b.s2.why; base.hasChecks = b.s2.checks.length > 0;
    return base;
  }
  var UNKNOWN_DATE = '기준일 미표기';
  function basisOf(m) { return m.asOf == null || !String(m.asOf).trim() ? UNKNOWN_DATE : String(m.asOf).replace(/-/g, '.') + ' 자료 기준'; }
  function metricText(m) {
    return (m.kind === 'rate' ? '표시금리 ' : '수익률 ') + contract.percent(m.valuePct).replace(/^\+/, '')
      + ' · ' + m.period + ' · ' + basisOf(m)
      + (m.validFrom && m.validUntil ? ' · 적용 ' + date(m.validFrom) + '~' + date(m.validUntil) : '');
  }
  // 소수 둘째 자리, 양수 '+' 없음, 음수 부호와 유효한 0은 유지.
  function pctText(v) { return Number(v).toFixed(2) + '%'; }
  // policy.productLayout === 'metadata_only': 상품명·유형·위험등급·기간별 수치·자료 기준만 남기고 긴 이유·확인사항·근거 배지는 숨긴다.
  function productCard(p, i, sources, policy) {
    var meta = !!(policy && policy.productLayout === 'metadata_only');
    var card = { i: i + 1, n: p.name, hasBadge: !!p.riskLevel, badge: p.riskLevel, bFg: '#696E76', bBg: '#F2F3F5', hasStat: false,
      hasCategory: !!p.category, category: p.category, hasDesc: !meta && !!p.reason, desc: p.reason, meta: meta, showMetricLines: !meta && p.metrics.length > 0,
      metrics: p.metrics.map(function (m) { return { text: metricText(m) }; }),
      notes: meta ? [] : p.notes.map(function (t) { return { t: t }; }),
      evidence: meta ? [] : p.sourceIds.map(function (id) { var s = sources.find(function (x) { return x.id === id; }); return { t: '근거: ' + (s ? s.title.split(' · ')[0] : id) + ' · 하단 근거 자료 참조' }; }) };
    if (meta) {
      var kinds = p.metrics.map(function (m) { return m.kind; }), isReturn = kinds.length > 0 && kinds.every(function (k) { return k === 'return'; });
      card.hasMeta = p.metrics.length > 0;
      card.metaLabel = isReturn ? '누적수익률' : '표시금리';
      card.metaHead = p.metrics.map(function (m) { return { t: isReturn ? m.period.replace(/\s*누적$/, '') : m.period }; });
      card.metaRow = p.metrics.map(function (m) { return { t: pctText(m.valuePct) }; });
      // 기준 문구는 카드 안에서 한 번만. 적용기간이 있으면 함께 표시하고, 없는 날짜는 만들지 않는다.
      var bases = [], seen = {};
      p.metrics.forEach(function (m) { var b = basisOf(m) + (m.validFrom && m.validUntil ? ' · 적용기간 ' + date(m.validFrom) + '~' + date(m.validUntil) : ''); if (!seen[b]) { seen[b] = true; bases.push(b); } });
      card.basis = bases.join(' / ');
    }
    return card;
  }
  function s3(component, b, policy) {
    var base = {};
    base.bfS3Lead = component.bold(b.s3.lead);
    var selected = b.s3.options.find(function (o) { return o.id === component.state.bfSol; });
    base.bfTiles = b.s3.options.map(function (o) {
      var open = o.id === component.state.bfSol;
      return { name: o.title, desc: o.summary, hasDesc: !!o.summary, hasBtn: o.details.length > 0 || o.products.length > 0, btnLabel: o.products.length ? labels.products : labels.details, bd: open ? '#26282C' : '#ECEDF0', rot: open ? '180deg' : '0deg', onTap: function () { component.setState({ bfSol: open ? null : o.id }); } };
    });
    base.hasOptions = b.s3.options.length > 0;
    base.bfOpenOn = !!selected && (selected.details.length > 0 || selected.products.length > 0);
    base.bfOpenHasSteps = false; base.bfOpenHasProds = !!selected && selected.products.length > 0; base.bfOpenHasNote = false;
    base.bfOpenProds = selected ? selected.products.map(function (p, i) { return productCard(p, i, b.sources, policy); }) : [];
    base.bfOpenParagraphs = selected ? selected.details.map(function (t) { return { t: t }; }) : [];
    base.bfHasS3Foot = b.s3.notes.length > 0;
    base.bfS3Foot = b.s3.notes.join('\n');
    return base;
  }
  function s4(component, b) {
    var base = {};
    base.bfOpening = b.s4.opening;
    base.bfOpeningBg = 'none';
    base.bfReacts = b.s4.reactions.map(function (r, i) {
      var open = component.state.bfReact === i;
      return { label: r.label, open: open, rot: open ? '180deg' : '0deg', paragraphs: r.paragraphs.map(function (t) { return { t: t }; }), onTap: function () { component.setState({ bfReact: open ? null : i }); } };
    });
    base.bfS4HasNote = b.s4.notices.length > 0;
    base.bfS4Note = b.s4.notices.join('\n');
    base.hasOpening = !!b.s4.opening; base.hasReactions = b.s4.reactions.length > 0;
    base.hasS4 = base.hasOpening || base.hasReactions || base.bfS4HasNote;
    return base;
  }
  function s5(component, b) {
    var base = {};
    // hot_tip: 강조 카드(게시일·원문 링크는 같은 tip의 sourceIds → sources.url). follow_up: 실행 목록 아래 일반 안내. kind 없음: 기존 표시.
    var linkOf = function (t) { var s = t.sourceIds.map(function (id) { return b.sources.find(function (x) { return x.id === id; }); }).find(function (x) { return x && contract.safeUrl(x.url); }); return s ? s.url : ''; };
    var tips = b.s5.tips.map(function (t) { return { title: t.title, body: t.body, hasBody: !!t.body, kind: t.kind || null, date: date(t.publishedAt || ''), hasDate: !!t.publishedAt, url: linkOf(t), hasUrl: !!linkOf(t) }; });
    base.bfHotTips = tips.filter(function (t) { return t.kind === 'hot_tip'; });
    base.bfStructuredTips = tips.filter(function (t) { return !t.kind; });
    base.bfFollowUps = tips.filter(function (t) { return t.kind === 'follow_up'; });
    base.bfExecItems = b.s5.actions.map(function (a, i) { return { hasNo: false, no: i + 1, chip: a.screenCode || '', hasCode: !!a.screenCode, name: a.title, desc: a.description, hasDesc: !!a.description, canOpen: !!a.screenCode, onOpen: function () { if (a.screenCode) component.openScn(a.screenCode, a.title); } }; });
    base.hasExecItems = base.bfExecItems.length > 0;
    base.hasS5 = b.s5.tips.length > 0 || base.hasExecItems;
    return base;
  }
  function sources(component, b, policy) {
    var base = {}, rows = !!(policy && policy.sourceRows);
    base.briefingSources = b.sources.map(function (s) { return { title: s.title, description: s.description, hasDescription: !!s.description, url: s.url || '', hasUrl: contract.safeUrl(s.url) }; });
    // 원천 제목만 행으로 보이는 정책: 제목 선택 시 분석 근거 패널의 관련 지식으로 이동(연결할 근거가 없으면 이동 버튼 없이 제목만).
    base.briefingSourceRowsOn = rows; base.briefingSourceRowsOff = !rows;
    base.briefingSourceRows = rows ? b.sources.map(function (s) {
      var canOpen = !!(policy.canOpenSource && policy.canOpenSource(s.id));
      return { id: s.id, title: s.title, canOpen: canOpen, plain: !canOpen, onOpen: function () { if (policy.openSource) policy.openSource(s.id); } };
    }) : [];
    base.showReviewNotes = !(policy && policy.hideReviewNotes) && b.reviewNotes.length > 0;
    base.briefingReviewNotes = base.showReviewNotes ? b.reviewNotes.map(function (t) { return { t: t }; }) : [];
    base.briefingSourcesLabel = (policy && policy.footerTitle) || labels.sources;
    base.hasBriefingSources = b.sources.length > 0 || base.showReviewNotes;
    base.briefingSourcesOpen = !!component.state.briefingSourcesOpen;
    base.toggleBriefingSources = function () { component.setState({ briefingSourcesOpen: !component.state.briefingSourcesOpen }); };
    return base;
  }
  // policy(optional): 선택 고객의 표시 정책. 없으면 기존 표시 그대로다.
  function build(content, component, policy) {
    return Object.assign({}, s1(component, content), s2(component, content), s3(component, content, policy),
      s4(component, content), s5(component, content), sources(component, content, policy));
  }
  return { labels: labels, build: build, productCard: productCard, metricText: metricText,
    sections: { s1: s1, s2: s2, s3: s3, s4: s4, s5: s5, sources: sources } };
});

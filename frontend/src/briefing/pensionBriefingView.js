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
  function metricText(m) {
    return (m.kind === 'rate' ? '표시금리 ' : '수익률 ') + contract.percent(m.valuePct).replace(/^\+/, '')
      + ' · ' + m.period + ' · ' + m.asOf + ' 기준'
      + (m.validFrom && m.validUntil ? ' · 적용 ' + date(m.validFrom) + '~' + date(m.validUntil) : '');
  }
  function productCard(p, i, sources) {
    return { i: i + 1, n: p.name, hasBadge: !!p.riskLevel, badge: p.riskLevel, bFg: '#696E76', bBg: '#F2F3F5', hasStat: false,
      hasCategory: !!p.category, category: p.category, hasDesc: !!p.reason, desc: p.reason,
      metrics: p.metrics.map(function (m) { return { text: metricText(m) }; }),
      notes: p.notes.map(function (t) { return { t: t }; }),
      evidence: p.sourceIds.map(function (id) { return { t: '근거: ' + sources.find(function (s) { return s.id === id; }).title.split(' · ')[0] + ' · 하단 근거 자료 참조' }; }) };
  }
  function s3(component, b) {
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
    base.bfOpenProds = selected ? selected.products.map(function (p, i) { return productCard(p, i, b.sources); }) : [];
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
    base.bfStructuredTips = b.s5.tips.map(function (t) { return { title: t.title, body: t.body, hasBody: !!t.body }; });
    base.bfExecItems = b.s5.actions.map(function (a, i) { return { hasNo: false, no: i + 1, chip: a.screenCode || '', hasCode: !!a.screenCode, name: a.title, desc: a.description, hasDesc: !!a.description, canOpen: !!a.screenCode, onOpen: function () { if (a.screenCode) component.openScn(a.screenCode, a.title); } }; });
    base.hasExecItems = base.bfExecItems.length > 0;
    base.hasS5 = b.s5.tips.length > 0 || base.hasExecItems;
    return base;
  }
  function sources(component, b) {
    var base = {};
    base.briefingSources = b.sources.map(function (s) { return { title: s.title, description: s.description, hasDescription: !!s.description, url: s.url || '', hasUrl: contract.safeUrl(s.url) }; });
    base.briefingReviewNotes = b.reviewNotes.map(function (t) { return { t: t }; });
    base.hasBriefingSources = b.sources.length > 0 || b.reviewNotes.length > 0;
    base.briefingSourcesOpen = !!component.state.briefingSourcesOpen;
    base.toggleBriefingSources = function () { component.setState({ briefingSourcesOpen: !component.state.briefingSourcesOpen }); };
    return base;
  }
  function build(content, component) {
    return Object.assign({}, s1(component, content), s2(component, content), s3(component, content),
      s4(component, content), s5(component, content), sources(component, content));
  }
  return { labels: labels, build: build, productCard: productCard, metricText: metricText,
    sections: { s1: s1, s2: s2, s3: s3, s4: s4, s5: s5, sources: sources } };
});

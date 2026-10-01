/* Development only: editable JSON + vanilla source -> three deployment files. */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const SRC = path.join(ROOT, 'frontend/src/briefing');
const OUT = path.join(ROOT, 'frontend/briefing-fabrix');
const ACTIVE = path.join(ROOT, 'agent-workbench/case-design/active');
const contract = require('../../frontend/src/briefing/briefing-contract');
const wire = require('../../frontend/src/briefing/fabrix-briefing-contract');
const branchData = require('./branch-data');
const read = file => fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
const json = file => JSON.parse(read(file));
// 오세훈(C01-07) 브리핑 분석 근거: 정제 완료한 지식 맵을 검증해 Agent 배포 묶음에만 싣는다. 원본 MD/JSON은 읽기 전용.
const EVIDENCE = path.join(ROOT, 'agent-workbench/case-design/review/C01-knowledge/C01-07/briefing_evidence.json');
const canonical = value => JSON.stringify(sortKeys(value));
function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k, sortKeys(value[k])]));
  return value;
}
function pointer(root, ref) {
  return ref.replace(/^\//, '').split('/').reduce((cur, token) => {
    const key = token.replace(/~1/g, '/').replace(/~0/g, '~');
    if (Array.isArray(cur)) { if (!/^(0|[1-9]\d*)$/.test(key) || Number(key) >= cur.length) throw new Error('Evidence pointer missing: ' + ref); return cur[Number(key)]; }
    if (cur && typeof cur === 'object' && Object.prototype.hasOwnProperty.call(cur, key)) return cur[key];
    throw new Error('Evidence pointer missing: ' + ref);
  }, root);
}
// Validates the authored map against the current customer/briefing/corpus and returns the transport pack
// (no expected_* baselines, source paths, line numbers, hashes or internal notes).
function evidencePack(data) {
  if (!fs.existsSync(EVIDENCE)) return null;
  const e = json(EVIDENCE), sha = text => require('crypto').createHash('sha256').update(text, 'utf8').digest('hex');
  const index = data.customers.findIndex(c => c.briefingMeta.caseId === e.case_id);
  if (index < 0 || !data.briefings[index]) throw new Error('Evidence case without customer/briefing: ' + e.case_id);
  const customer = data.customers[index], briefing = json(path.join(ACTIVE, 'briefing-json', e.case_id + '.json'));
  if (sha(canonical(customer)) !== e.baseline.customer_sha256) throw new Error('Evidence baseline: customer JSON changed since the map was authored (' + e.case_id + ')');
  if (sha(canonical(briefing)) !== e.baseline.briefing_sha256) throw new Error('Evidence baseline: briefing JSON changed since the map was authored (' + e.case_id + ')');
  const ids = list => { const seen = new Set(); list.forEach(x => { if (seen.has(x.id)) throw new Error('Duplicate evidence id: ' + x.id); seen.add(x.id); }); return seen; };
  const factIds = ids(e.facts), judgmentIds = ids(e.judgments), cardIds = ids(e.knowledge_cards);
  e.facts.forEach(f => f.data_refs.forEach((ref, i) => { if (canonical(pointer(customer, ref)) !== canonical(f.expected_values[i])) throw new Error('Evidence fact value differs: ' + f.id + ' ' + ref); }));
  e.bindings.forEach(b => {
    if (pointer(briefing, b.target) !== b.expected_text) throw new Error('Evidence binding text differs: ' + b.id + ' ' + b.target);
    b.fact_ids.forEach(id => { if (!factIds.has(id)) throw new Error('Unknown fact in binding ' + b.id); });
    b.evidence_ids.forEach(id => { if (!cardIds.has(id)) throw new Error('Unknown card in binding ' + b.id); });
    b.judgment_ids.forEach(id => { if (!judgmentIds.has(id)) throw new Error('Unknown judgment in binding ' + b.id); });
  });
  ids(e.bindings);
  const groupIds = new Set(e.presentation.groups.map(g => g.id)), sourceIds = new Set((briefing.sources || []).map(s => s.id));
  e.knowledge_cards.forEach(card => {
    if (!groupIds.has(card.group)) throw new Error('Card group unknown: ' + card.id);
    if (card.source_id != null && !sourceIds.has(card.source_id)) throw new Error('Card source_id not in briefing.sources: ' + card.id);
    card.used_by.forEach(ref => { if (typeof pointer(briefing, ref) !== 'string') throw new Error('Card used_by not a briefing string: ' + card.id + ' ' + ref); });
    card.raw_excerpts.forEach(raw => {
      const lines = read(path.join(ROOT, raw.source_path)).split('\n').slice(raw.line_start - 1, raw.line_end).join('\n');
      if (lines !== raw.text || sha(lines) !== raw.sha256) throw new Error('Evidence RAW excerpt differs from corpus: ' + card.id);
    });
  });
  e.judgments.forEach(j => { j.fact_ids.forEach(id => { if (!factIds.has(id)) throw new Error('Unknown fact in judgment ' + j.id); }); (j.evidence_ids || []).forEach(id => { if (!cardIds.has(id)) throw new Error('Unknown card in judgment ' + j.id); }); });
  e.presentation.steps.forEach(s => { s.fact_ids.forEach(id => { if (!factIds.has(id)) throw new Error('Unknown fact in step ' + s.id); }); s.judgment_ids.forEach(id => { if (!judgmentIds.has(id)) throw new Error('Unknown judgment in step ' + s.id); }); s.group_ids.forEach(id => { if (!groupIds.has(id)) throw new Error('Unknown group in step ' + s.id); }); });
  const a = e.acceptance, rawCount = e.knowledge_cards.reduce((n, c) => n + c.raw_excerpts.length, 0);
  if (e.presentation.steps.length !== a.step_count || e.facts.reduce((n, f) => n + f.data_refs.length, 0) !== a.customer_field_count || e.knowledge_cards.length !== a.knowledge_card_count || rawCount !== a.raw_excerpt_count || e.bindings.length !== a.binding_count || e.knowledge_cards.filter(c => c.raw_excerpts.length).length !== a.raw_card_count) throw new Error('Evidence acceptance counts differ');
  // used_by must be exactly what the bindings say (rebuilt from bindings[].evidence_ids).
  e.knowledge_cards.forEach(card => { const expected = e.bindings.filter(b => b.evidence_ids.includes(card.id)).map(b => b.target); if (JSON.stringify(card.used_by) !== JSON.stringify(expected)) throw new Error('Card used_by out of sync with bindings: ' + card.id); });
  return {
    schema_version: e.schema_version, case_id: e.case_id, as_of_date: e.as_of_date,
    runtime_policy: { analysis_mode: e.runtime_policy.analysis_mode, llm_calls: e.runtime_policy.llm_calls, trace_origin: e.runtime_policy.trace_origin, judgment_origin: e.runtime_policy.judgment_origin },
    presentation: { button: e.presentation.button, panel_title: e.presentation.panel_title, max_open_steps: e.presentation.max_open_steps,
      steps: e.presentation.steps.map(s => ({ id: s.id, title: s.title, summary: s.summary, fact_ids: s.fact_ids, judgment_ids: s.judgment_ids, group_ids: s.group_ids, target_prefixes: s.target_prefixes })),
      groups: e.presentation.groups.map(g => ({ id: g.id, title: g.title, card_ids: g.card_ids, reuse_card_ids: g.reuse_card_ids || [] })) },
    facts: e.facts.map(f => ({ id: f.id, label: f.label, role: f.role, data_refs: f.data_refs })),
    judgments: e.judgments.map(j => ({ id: j.id, origin: j.origin, summary: j.summary, guard: j.guard || null, fact_ids: j.fact_ids, evidence_ids: j.evidence_ids || [] })),
    knowledge_cards: e.knowledge_cards.map(c => ({ id: c.id, group: c.group, title: c.title, source_title: c.source_title, product_id: c.product_id || null, source_id: c.source_id || null, summary: c.summary, application: c.application,
      raw_status: c.provenance.raw_status, raw_excerpts: c.raw_excerpts.map(r => ({ text: r.text })), used_by: c.used_by })),
    bindings: e.bindings.map(b => ({ id: b.id, target: b.target, role: b.role, fact_ids: b.fact_ids, evidence_ids: b.evidence_ids, judgment_ids: b.judgment_ids })),
    workflow: { common: e.workflow.common, continue_investing: e.workflow.continue_investing, start_pension: e.workflow.start_pension, followup: e.workflow.followup, meaning: e.workflow.meaning }
  };
}

function inputs() {
  const dataDir = path.join(ACTIVE, 'display-data'), briefingDir = path.join(ACTIVE, 'briefing-json');
  // B = case customers with S1-S5 briefings, C = conversational-agent demo customers (customer data only).
  const customerFiles = fs.readdirSync(dataDir).filter(f => /^[BC]\d{2}-\d{2}\.json$/.test(f)).sort();
  const customers = customerFiles.map(f => {
    const customer = json(path.join(dataDir, f));
    if (customer.briefingMeta.caseId + '.json' !== f) throw new Error('Customer filename/caseId mismatch: ' + f);
    return customer;
  });
  const ids = customers.map(c => c.briefingMeta.caseId);
  if (new Set(ids).size !== ids.length || new Set(customers.map(c => c.customer.customerId)).size !== ids.length) throw new Error('Duplicate case/customer ID');
  const actual = fs.readdirSync(briefingDir).filter(f => f.endsWith('.json')).sort();
  const orphans = actual.filter(f => !ids.includes(f.replace(/\.json$/, '')));
  if (orphans.length) throw new Error('Briefing JSON without a customer: ' + orphans.join(', '));
  // Metadata is assembled in memory for the existing store, never stored as a
  // second editable briefing. Only briefing-json/*.json is the content source.
  // A customer without a briefing file (null) ships as a snapshot only; the screen shows the briefing as not ready.
  const briefings = customers.map(c => {
    const id = c.briefingMeta.caseId, file = path.join(briefingDir, id + '.json');
    if (!fs.existsSync(file)) return null;
    const content = json(file);
    const errors = contract.validateContent(content, c);
    if (errors.length) throw new Error(id + ': ' + errors.join('\n'));
    return { schemaVersion: contract.version, caseId: id, customerId: c.customer.customerId,
      asOfDate: c.briefingMeta.asOfDate, status: 'draft', title: '고객별 브리핑', ...content };
  });
  if (!briefings.some(Boolean)) throw new Error('No briefing JSON found');
  return { customers, briefings, noBriefing: customers.filter((c, i) => !briefings[i]).map(c => c.briefingMeta.caseId) };
}

// Starroot file code of the deployed business page; pass another code as the CLI argument to override.
const DEFAULT_FILE_CODE = '1288272';

function artifacts(fileCode = DEFAULT_FILE_CODE, data = inputs(), branch = branchData.generate(data)) {
  if (!/^(REPLACE_WITH_FILE_CODE|\d+)$/.test(fileCode)) throw new Error('File code must be numeric');
  // pensionDisplayDate.js: 화면 표시 날짜를 오늘로 옮기는 공통 모듈. 렌더러·어댑터·패널보다 앞에 둔다.
  const modules = ['briefing-contract.js', 'pensionDisplayDate.js', 'pensionCustomerView.js', 'pensionBriefingView.js',
    'pensionBriefingStore.js', 'pensionBriefingAdapter.js', 'fabrix-briefing-contract.js',
    'fabrix-transport.js', 'pensionFabrix.js', 'fabrix-chat-transport.js', 'pensionChat.js',
    // 부점 AI: current main-list search. Core/data/provider/session precede the DOM modules and the adapter.
    'branch-agent-contract.js', 'branch-agent-transport.js', 'branch-search-core.js', 'branch-search-current-data.js', 'branch-search-current-provider.js', 'branch-search-conversation.js', 'branch-search-session.js',
    // pensionExport.js: 대화창의 "엑셀로 내려받기" 요청을 프론트에서 처리(xlsx 생성). 어댑터가 실행 시점에 참조.
    // 처리 이력: 표시 범위 설정·공통 기록 저장소(검색/엑셀 어댑터)는 adapter 보다 앞에, 목업 데이터·패널 렌더러는 그 뒤에 둔다.
    'pensionBranchDisplay.js', 'pensionExecutionTraceLog.js',
    'branch-search-motion.js', 'branch-search-widget.js', 'pensionExport.js', 'branch-search-adapter.js',
    'pensionExecutionTraceData.js', 'pensionExecutionTracePanel.js', 'pensionBriefingEvidencePanel.js', 'pensionAgentDemo.js'];
  // The widget compares this stamp (a custom property on .pad-branch-widget) with the deployed CSS to detect a stale file.
  const branchSource = read(path.join(SRC, 'branch-search.css'));
  const branchCss = branchSource.replace('PAD_BRANCH_CSS_VERSION', require('crypto').createHash('sha256').update(branchSource).digest('hex').slice(0, 12));
  const js = '/* Generated by tools/briefing/build.js. Edit source/JSON, not this file. */\n' +
    '(function(window, document) {\nvar module, exports, require;\n' +
    'if (window.__PensionVanilla) window.__PensionVanilla.destroy();\n' +
    // Schema is exported from Pydantic; the manifest comes from the same projection as the Agent data.
    'window.PensionBranchAgentSchema = ' + JSON.stringify(json(path.join(ROOT, 'integration/contracts/branch-agent.schema.json'))).replace(/</g, '\\u003c') + ';\n' +
    'window.PensionBranchDataManifest = ' + JSON.stringify(branch.manifest).replace(/</g, '\\u003c') + ';\n' +
    // Only customer snapshots ship to the browser; briefing text comes from the Agent.
    'window.PensionBriefingFixtures = ' + JSON.stringify({ customers: data.customers, noBriefing: data.noBriefing }).replace(/</g, '\\u003c') + ';\n' +
    // Fallback copy of the widget rules: injected only when the deployed pensionAgentDemo.css lacks them (stale/partial CSS deploy).
    'window.PensionBranchSearchStyles = ' + JSON.stringify(branchCss).replace(/</g, '\\u003c') + ';\n' +
    modules.map(f => '\n/* ' + f + ' */\n' + read(path.join(SRC, f))).join('\n;\n')
      .replace("var STARROOT_FILE_CODE = 'REPLACE_WITH_FILE_CODE';", "var STARROOT_FILE_CODE = '" + fileCode + "';") +
    '\n})(window, document);\n';
  const html = read(path.join(SRC, 'mnPensionAgentDemo.html'));
  if ((html.match(/<script\b[^>]*\bsrc=/g) || []).length !== 1 || (html.match(/<link\b/g) || []).length !== 1) throw new Error('HTML must reference one JS and one CSS');
  // The config block ships empty; credentials are filled only in the deployed copy.
  const block = html.match(/window\.__PENSION_FABRIX_CONFIG = window\.__PENSION_FABRIX_CONFIG \|\| \{([\s\S]*?)\n\s*\};/);
  if (!block) throw new Error('FabriX config block not found in HTML');
  for (const [, key, value] of block[1].matchAll(/\b(\w+):\s*('[^']*'|\d+)/g)) {
    if (value !== "''" && value !== '0') throw new Error('FabriX config block must stay empty in source: ' + key);
  }
  // The original stylesheet stays an exact prefix; branch-search.css only adds #pensionAgentDemo .pad-branch-* rules.
  const css = read(path.join(SRC, 'pensionAgentDemo.css')) + '\n/* branch-search.css */\n' + branchCss;
  return { 'mnPensionAgentDemo.html': html, 'pensionAgentDemo.js': js, 'pensionAgentDemo.css': css };
}

function build(fileCode) {
  const data = inputs(), branch = branchData.generate(data), files = artifacts(fileCode, data, branch);
  fs.mkdirSync(OUT, { recursive: true });
  for (const [name, body] of Object.entries(files)) fs.writeFileSync(path.join(OUT, name), body);
  branchData.write(branch);
  const first = data.briefings.findIndex(Boolean), req = wire.request(data.customers[first], 'example-request-001', 'TEST_EMPLOYEE');
  fs.writeFileSync(path.join(ROOT, 'integration/contracts/response.example.json'), JSON.stringify(wire.answer(req, contract.contentOf(data.briefings[first])), null, 2) + '\n');
  fs.writeFileSync(path.join(ROOT, 'agent/briefing_data.json'), JSON.stringify(agentData(data)) + '\n');
  console.log('Built frontend (1 HTML + 1 JS + 1 CSS) from ' + data.customers.length + ' customers and Agent data from ' + data.briefings.filter(Boolean).length + ' customer/briefing pairs. Source JSON unchanged.');
  console.log('Built branch data/manifest: ' + branch.manifest.record_count + ' rows, data_version=' + branch.manifest.data_version);
}

function agentData(data = inputs()) {
  const evidence = evidencePack(data);
  return { schema_version: wire.version, answer_schema: wire.answerSchema,
    // Only customers with a stored briefing are served by the fixed Agent. The C01-07 record also carries its
    // validated analysis evidence map; the Agent turns it into the optional answer.data.analysis_trace.
    cases: Object.fromEntries(data.customers.map((customer, i) => [customer.briefingMeta.caseId, data.briefings[i]]).filter(([, b]) => b).map(([id, b], i) => [id,
      Object.assign({ customer_data: data.customers.find(c => c.briefingMeta.caseId === id), briefing: contract.contentOf(b) },
        evidence && evidence.case_id === id ? { analysis_evidence: evidence } : {})])) };
}

function preview() {
  // Static preview only. No fake Agent, mock HTTP endpoint or credential capture.
  const assets = new Map([
    ['/', ['mnPensionAgentDemo.html', 'text/html; charset=utf-8']],
    ['/mnbank/app/html/bfe/asstmgt/asst/pensionAgentDemo.js', ['pensionAgentDemo.js', 'text/javascript; charset=utf-8']],
    ['/mnbank/app/html/bfe/asstmgt/asst/pensionAgentDemo.css', ['pensionAgentDemo.css', 'text/css; charset=utf-8']]
  ]);
  const server = require('http').createServer((req, res) => {
    const asset = assets.get(req.url);
    if (req.method !== 'GET' || !asset) { res.writeHead(404).end(); return; }
    try {
      let body = read(path.join(OUT, asset[0]));
      if (asset[0].endsWith('.html')) {
        const code = read(path.join(OUT, 'pensionAgentDemo.js')).match(/^\s*var STARROOT_FILE_CODE = '([^']+)'/m)[1];
        body = body.replace('</head>', '<style>html{font-size:10px}body{margin:0}</style></head>')
          .replace('</body>', '<script>window[' + JSON.stringify('PG_' + code) + '].onParam({localPreview:true});</script></body>');
      }
      res.writeHead(200, { 'Content-Type': asset[1], 'Cache-Control': 'no-store' }).end(body);
    } catch (_) { res.writeHead(500).end('Build the frontend first.'); }
  });
  server.on('error', err => { console.error('Preview failed: ' + err.code); process.exitCode = 1; });
  server.listen(8765, '127.0.0.1', () => console.log('Static preview: http://127.0.0.1:8765 (no mock API). Ctrl+C to stop.'));
  return server;
}
if (require.main === module) {
  if (process.argv[2] === '--preview') preview();
  else build(process.argv[2] || DEFAULT_FILE_CODE);
}
module.exports = { ROOT, SRC, OUT, ACTIVE, DEFAULT_FILE_CODE, EVIDENCE, inputs, artifacts, agentData, evidencePack, build };

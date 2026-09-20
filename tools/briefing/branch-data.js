/* Build-only projection of the existing editable sources. Never reads contract samples. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const projection = require('../../frontend/src/briefing/branch-search-current-data');
const provider = require('../../frontend/src/briefing/branch-search-current-provider');
const core = require('../../frontend/src/briefing/branch-search-core');
const ROOT = path.resolve(__dirname, '../..');
const DATA_FILE = path.join(ROOT, 'branch-agent/deploy/branch_data.json');
const MANIFEST_FILE = path.join(ROOT, 'integration/contracts/branch-data.manifest.json');
const VERSIONS = Object.freeze({ dataset_id: 'branch-demo.v1', rule_version: 'branch-rules.v1',
  projection_version: 'current-data.v1', as_of_date: '2026-09-14' });
const clone = value => JSON.parse(JSON.stringify(value));

// JSON only: recursively sorted object keys, ordered arrays, UTF-8, no build clock/path.
function stableStringify(value) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort()
    .map(key => JSON.stringify(key) + ':' + stableStringify(value[key])).join(',') + '}';
  throw new Error('Branch data must contain only finite JSON values');
}

function dataVersion(records, segmentLabels, versions = VERSIONS) {
  return crypto.createHash('sha256').update(stableStringify({ records, segment_labels: segmentLabels,
    as_of_date: versions.as_of_date, rule_version: versions.rule_version,
    projection_version: versions.projection_version }), 'utf8').digest('hex');
}

function extractCurrentRows(customers) {
  let extracted;
  const context = vm.createContext({ window: {
    PensionBriefingFixtures: { customers: clone(customers) },
    __PensionBuildExtract: extract => { extracted = extract(); }
  }, document: {} }, { codeGeneration: { strings: false, wasm: false } });
  // Fixed repository modules only. Customer JSON is data, never executable input.
  for (const file of ['briefing-contract.js', 'pensionCustomerView.js', 'pensionBriefingView.js',
    'pensionBriefingStore.js', 'pensionBriefingAdapter.js', 'pensionAgentDemo.js']) {
    const source = fs.readFileSync(path.join(ROOT, 'frontend/src/briefing', file), 'utf8');
    vm.runInContext(source, context, { filename: file, timeout: 5000 });
  }
  if (!extracted) throw new Error('Explicit main-list build extraction hook is missing');
  // Drop view callbacks at the boundary; only the existing row/profile facts cross it.
  return clone(extracted);
}

function project(customers) {
  const { mainRows, modelRows, profiles } = extractCurrentRows(customers);
  const ids = mainRows.map(row => row.id);
  if (ids.some(id => typeof id !== 'string' || !id) || new Set(ids).size !== ids.length)
    throw new Error('Duplicate or missing main-list row ID');
  return projection.fromCurrentRows(mainRows, { customers }, modelRows, row => profiles[row.id]);
}

function fromProjection(source, versions = VERSIONS) {
  const records = source.records.map(value => {
    const record = clone(value), origin = record.searchSource;
    return Object.assign(record, {
      row_id: record.briefingMeta.caseId,
      source_case_id: origin.sourceCaseId,
      customer_id: record.customer.customerId ?? null,
      as_of_date: origin.asOfDate ?? null,
      source_kind: origin.kind,
      original_order: origin.originalOrder,
      display_overrides: origin.displayOverrides.slice(),
      // Explicit nulls for missing cash; never manufacture an assetAllocation/holding.
      cash_amount: core.value(record, 'cash_amount') ?? null,
      cash_pct: core.value(record, 'cash_pct') ?? null
    });
  });
  const rowIds = records.map(row => row.row_id);
  const structured = records.filter(row => row.source_kind === 'structured');
  const displayOnly = records.filter(row => row.source_kind === 'display-only');
  if (records.length !== 48 || new Set(rowIds).size !== 48 || structured.length !== 31 || displayOnly.length !== 17)
    throw new Error('Branch population must be 48 unique rows (31 structured / 17 display-only)');
  if (rowIds.includes('DEMO-01') || structured.filter(row => row.source_case_id === 'DEMO-01').length !== 1 ||
    !records.some(row => row.row_id === 'ksy' && row.source_case_id === 'DEMO-01'))
    throw new Error('DEMO-01 must be represented exactly once, by row ksy');
  if (new Set(structured.map(row => row.source_case_id)).size !== 31 ||
    records.some((row, index) => row.original_order !== index) ||
    displayOnly.some(row => row.source_case_id !== null || row.as_of_date !== null || row.cash_amount !== null || row.cash_pct !== null))
    throw new Error('Branch source identity, order or unknown-value preservation failed');
  const segmentLabels = provider.segmentLabels(records);
  const knownDates = [...new Set(records.map(row => row.as_of_date).filter(Boolean))].sort();
  const manifest = { dataset_id: versions.dataset_id, data_version: dataVersion(records, segmentLabels, versions),
    rule_version: versions.rule_version, projection_version: versions.projection_version,
    as_of_date: versions.as_of_date, known_dates: knownDates, mixed_dates: knownDates.length > 1,
    record_count: records.length, structured_count: structured.length, display_only_count: displayOnly.length,
    row_ids: rowIds, segment_labels: segmentLabels };
  return { manifest, records };
}

function generate(data) { return fromProjection(project(data.customers)); }

function write(data) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.mkdirSync(path.dirname(MANIFEST_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2) + '\n');
  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(data.manifest, null, 2) + '\n');
}

module.exports = { DATA_FILE, MANIFEST_FILE, VERSIONS, stableStringify, dataVersion,
  extractCurrentRows, project, fromProjection, generate, write };

/* Task 03: actual generated dataset, deterministic versions, and Python parity. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const cp = require('node:child_process');
const build = require('../../tools/briefing/build');
const B = require('../../tools/briefing/branch-data');
const D = require('../../frontend/src/briefing/branch-search-current-data');
const C = require('../../frontend/src/briefing/branch-search-core');
const contract = require('../../frontend/src/briefing/branch-agent-contract');
const clone = value => JSON.parse(JSON.stringify(value));
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));

function run(options = {}) {
  const input = build.inputs(), before = JSON.stringify(input);
  const source = B.project(input.customers), data = B.fromProjection(source), m = data.manifest;
  assert.deepEqual(data, B.generate(input), 'Independent source extraction has the same hash and records');
  assert.equal(JSON.stringify(input), before, 'Editable data is read-only');
  assert.match(m.data_version, /^[a-f0-9]{64}$/);
  // 57 rows = 42 case customers (30 with briefings + 12 conversational-agent demo customers) + 15 legacy demo rows.
  assert.deepEqual([m.record_count, m.structured_count, m.display_only_count], [57, 42, 15]);
  assert.equal(new Set(m.row_ids).size, 57);
  assert.equal(m.row_ids.includes('DEMO-01'), false);
  assert.equal(m.row_ids.includes('ksy'), false, 'Legacy 김서연 row replaced by C01-10');
  assert.equal(data.records.filter(r => r.source_case_id === 'DEMO-01').length, 0);
  assert.equal(new Set(data.records.map(r => r.customer_id)).size, 57);
  assert.deepEqual(m.known_dates, ['2026-09-29']);
  assert.equal(m.mixed_dates, false);
  assert.equal(new Set(m.segment_labels).size, m.segment_labels.length);
  for (const label of ['ISA 만기', '퇴직금 운용 미지시', '추가납입']) assert(m.segment_labels.includes(label));
  for (const [index, row] of data.records.entries()) {
    const { row_id, source_case_id, customer_id, as_of_date, source_kind, original_order,
      display_overrides, cash_amount, cash_pct, ...projected } = row;
    assert.deepEqual(projected, source.records[index], 'Every original projection field is preserved');
    assert.equal(original_order, index);
    assert.equal(cash_amount, C.value(row, 'cash_amount') ?? null);
    assert.equal(cash_pct, C.value(row, 'cash_pct') ?? null);
    if (source_kind === 'display-only') {
      assert.deepEqual([source_case_id, as_of_date, cash_amount, cash_pct, row.holdings], [null, null, null, null, null]);
      assert.deepEqual(row.irpAccount.assetAllocation, []);
    }
  }
  assert.equal(data.records.reduce((s, r) => s + r.irpAccount.valuationAmountKrw, 0), 7855840000);
  assert.equal(data.records.reduce((s, r) => s + (r.cash_amount ?? 0), 0), 935230000);
  assert.equal(data.records.filter(r => r.cash_amount !== null).length, 42);
  assert.equal(data.records.filter(r => r.irpAccount.valuationAmountKrw >= 70000000).length, 41);
  assert.equal(data.records.filter(r => C.evaluate(r, { op: 'segment_family', label: 'ISA 만기' })).length, 3);
  assert.deepEqual(data.records.filter(r => C.evaluate(r, { op: 'isa_between', start: m.as_of_date,
    end: C.dateAdd(m.as_of_date, 30) }) === true).map(r => r.row_id), ['C01-10', 'B01-03', 'B01-22']);

  // Mutate only transient projection inputs, never the original JSON/main template.
  const extracted = B.extractCurrentRows(input.customers);
  for (const mutate of [
    (rows) => { rows.mainRows[0].bal = '1원'; },
    (rows) => { rows.mainRows[0].tags.push({ t: '검증용 뱃지' }); },
    (_rows, customers) => { customers[0].briefingMeta.asOfDate = '2026-09-15'; }
  ]) {
    const rows = clone(extracted), customers = clone(input.customers);
    mutate(rows, customers);
    const changed = D.fromCurrentRows(rows.mainRows, { customers }, rows.modelRows, r => rows.profiles[r.id]);
    assert.notEqual(B.fromProjection(changed).manifest.data_version, m.data_version, 'Amount/badge/date input changes the hash');
  }
  const reverseKeys = value => Array.isArray(value) ? value.map(reverseKeys) : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).reverse().map(key => [key, reverseKeys(value[key])])) : value;
  assert.equal(B.dataVersion(reverseKeys(data.records), m.segment_labels, m), m.data_version);
  assert.notEqual(B.dataVersion(data.records.slice().reverse(), m.segment_labels, m), m.data_version);
  assert.notEqual(B.dataVersion(data.records, [...m.segment_labels, '검증용 사전'], m), m.data_version);
  for (const key of ['rule_version', 'projection_version', 'as_of_date'])
    assert.notEqual(B.dataVersion(data.records, m.segment_labels, { ...m, [key]: m[key] + '-changed' }), m.data_version);
  for (const value of [NaN, Infinity, undefined]) assert.throws(() => B.stableStringify({ value }));
  console.log('PASS: 57 current rows, 42/15 source identity, nulls/overrides, IRP/cash/ISA/70M totals; repeat/key-order/input/version hash checks');

  const request = contract.request({ request_id: '00000000-0000-4000-8000-000000000031',
    conversation_id: '00000000-0000-4000-8000-000000000003', base_revision: 0,
    x_client_user: 'TEST_EMPLOYEE', message: '현재 부점 현황 알려줘' }, m);
  assert.throws(() => contract.validateRequest({ ...request, data_version: '0'.repeat(64) }, m));
  assert.throws(() => contract.validateRequest(request, null));
  if (!options.sourceOnly) {
    assert.deepEqual(read(B.DATA_FILE), data, 'Agent data needs rebuild');
    assert.deepEqual(read(B.MANIFEST_FILE), m, 'Manifest needs rebuild');
    let shippedRows;
    const context = { window: { __PensionBuildExtract: extract => { shippedRows = clone(extract()); } },
      document: {}, console, setTimeout, clearTimeout, setInterval, clearInterval,
      URL, AbortController, TextDecoder };
    vm.runInNewContext(fs.readFileSync(path.join(build.OUT, 'pensionAgentDemo.js'), 'utf8'), context);
    assert.deepEqual(clone(context.window.PensionBranchDataManifest), m, 'Shipped frontend and Agent manifest match');
    assert(shippedRows, 'Shipped page has the explicit extraction hook');
    const shippedProjection = D.fromCurrentRows(shippedRows.mainRows, clone(context.window.PensionBriefingFixtures),
      shippedRows.modelRows, row => shippedRows.profiles[row.id]);
    assert.deepEqual(B.fromProjection(shippedProjection), data, 'Full frontend module composition projects the same rows as the build');
    assert.equal(context.window.PensionBranchAgentContract.validateRequest(request, context.window.PensionBranchDataManifest).data_version, m.data_version);
    console.log('PASS: actual Agent JSON = manifest file = shipped frontend manifest; existing schema/contract registered');
  } else console.log('SKIP: generated files/frontend comparison (--source-only; waiting for shared build)');
  const known = clone(data.records.find(r => r.row_id === 'B01-03')), unknown = clone(data.records.find(r => r.source_kind === 'display-only'));
  const zero = clone(known), missing = clone(known);
  C.asset(zero, '현금성자산').amountKrw = 0;
  C.asset(missing, '현금성자산').amountKrw = null;
  const cashCases = [known, unknown, zero, missing].map(record => ({ record, expected: C.value(record, 'cash_amount') ?? null }));
  const venv = path.join(__dirname, '.venv/bin/python');
  const python = process.env.BRANCH_PYTHON || (fs.existsSync(venv) ? venv : 'python3');
  const result = cp.spawnSync(python, ['-B', path.join(__dirname, 'check_data.py')], {
    input: JSON.stringify({ data: options.sourceOnly ? data : undefined,
      data_file: options.sourceOnly ? undefined : B.DATA_FILE, request, cash_cases: cashCases }),
    encoding: 'utf8', maxBuffer: 1024 * 1024, timeout: 30000
  });
  assert.equal(result.status, 0, result.error ? result.error.message : result.stderr);
  process.stdout.write(result.stdout);
  const docker = fs.readFileSync(path.join(build.ROOT, 'branch-agent/deploy/Dockerfile'), 'utf8');
  assert(docker.includes('COPY ./branch_data.json /custom/branch_data.json'));
  console.log('PASS: branch_data explicit Docker COPY (image build/HTTP/LLM/internal E2E not covered)');
  console.log('data_version: ' + m.data_version);
  return data;
}

if (require.main === module) run({ sourceOnly: process.argv.includes('--source-only') });
module.exports = { run };

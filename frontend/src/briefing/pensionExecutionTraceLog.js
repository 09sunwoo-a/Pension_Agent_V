/* 처리 이력 공통 모델·기록 저장소·경로별 어댑터(부점 AI 검색 / 엑셀 추출).
 * 화면 세션 동안 메모리에만 보관한다(localStorage·외부 전송 없음). 업무 상태(목록·State·revision)의 근거는
 * 기존 answer.result/ui/next_state이며, 이 기록은 그것을 관측해 남길 뿐 목록을 바꾸지 않는다.
 * 기록 출처(origin): frontend_observed(프론트 관측) · agent_observed(Agent execution_trace) · frontend_fixture(목업).
 * 시각: 원본은 timezone 포함 ISO, 프론트 소요시간은 performance.now, Agent 소요시간은 서버 monotonic(수신값 그대로).
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(globalThis, require('./pensionBranchDisplay'));
  else root.PensionExecutionTraceLog = factory(root, root.PensionBranchDisplay);
})(typeof window === 'undefined' ? globalThis : window, function (root, display) {
  'use strict';
  var MAX_RECORDS = 50, MAX_STEPS = 48, MAX_IDS = 64;
  var nowIso = function () { return new Date().toISOString(); };
  var perf = function () { return typeof root.performance === 'object' && root.performance && typeof root.performance.now === 'function' ? root.performance.now() : Date.now(); };
  var copy = function (x) { return x === undefined ? undefined : JSON.parse(JSON.stringify(x)); };
  var ids = function (list) { return Array.isArray(list) ? list.slice(0, MAX_IDS).map(String) : []; };
  var text = function (value, max) { var s = String(value == null ? '' : value); return s.length > (max || 300) ? s.slice(0, max || 300) : s; };
  var round = function (n) { return Math.max(0, Math.round(n)); };

  /* ---------- 저장소 ---------- */
  function createLog() {
    var records = [], listeners = new Set(), serial = 0, disposed = false;
    function emit(type, record) { if (disposed) return; listeners.forEach(function (fn) { try { fn({ type: type, record: record, records: records.slice() }); } catch (_) {} }); }
    return {
      add: function (record) {
        if (disposed) return null;
        record.id = record.id || (record.kind + '-' + (++serial) + '-' + Date.now().toString(36));
        records.push(record);
        if (records.length > MAX_RECORDS) records.splice(0, records.length - MAX_RECORDS);
        emit('add', record); return record;
      },
      update: function (record, patch) { if (disposed || !record) return; Object.assign(record, patch || {}); emit('update', record); },
      touch: function (record) { emit('update', record); },
      get: function (id) { return records.filter(function (r) { return r.id === id; })[0] || null; },
      list: function () { return records.slice(); },
      subscribe: function (fn) { listeners.add(fn); return function () { listeners.delete(fn); }; },
      destroy: function () { disposed = true; records.length = 0; listeners.clear(); }
    };
  }

  /* ---------- 공통 실행 단위 ---------- */
  function record(kind, title, origin, extra) {
    return Object.assign({
      id: null, kind: kind, title: title, origin: origin, status: 'running', requestId: null, conversationId: null, sourceSearchTraceId: null,
      startedAt: nowIso(), endedAt: null, durationMs: null, displayContext: display ? display.context() : null,
      steps: [], resultSummary: '', _t0: perf()
    }, extra || {});
  }
  function addStep(rec, step) {
    if (rec.steps.length >= MAX_STEPS) return null;
    var s = Object.assign({ id: 'f' + String(rec.steps.length + 1).padStart(2, '0'), sequence: rec.steps.length + 1, actor: 'FRONT', stage: '', title: '', status: 'completed',
      startedAt: nowIso(), endedAt: null, durationMs: null, summary: '', input: null, output: null, evidenceRefs: [], origin: 'frontend_observed', _t: perf() }, step);
    if (s.endedAt === undefined) s.endedAt = null;
    rec.steps.push(s); return s;
  }
  function endStep(step, patch) {
    if (!step || step.endedAt) return step;
    step.endedAt = nowIso(); step.durationMs = round(perf() - step._t);
    Object.assign(step, patch || {}); return step;
  }
  function instant(rec, step) { var s = addStep(rec, step); if (s) { s.endedAt = s.startedAt; s.durationMs = 0; } return s; }
  function finish(rec, status, summary) {
    rec.status = status; rec.endedAt = nowIso(); rec.durationMs = round(perf() - rec._t0);
    if (summary != null) rec.resultSummary = summary;
    rec.steps.forEach(function (s) { if (!s.endedAt) { s.endedAt = rec.endedAt; s.durationMs = round(perf() - s._t); if (s.status === 'running') s.status = status === 'completed' ? 'completed' : status; } });
  }

  /* ---------- 부점 AI 검색 ---------- */
  var PHASE_LABEL = { interpreting: '조건 해석 중', executing: '고객 데이터 확인 중', composing: '답변 정리 중' };
  var INTENT_LABEL = { search: '고객 검색', overview: '부점 현황', aggregate: '집계', recommend: '관리 대상 추천', brief: '간단 브리핑', clarify: '조건 확인 질문', restore: '목록 복원', unsupported: '지원 범위 밖' };
  function searchTitle(message, answer) {
    if (answer) {
      var trace = answer.execution_trace, confirm = trace && trace.steps.filter(function (s) { return (s.stage === 'plan' || s.stage === 'apply') && s.output && s.output.labels; })[0];
      var chips = confirm ? confirm.output.labels : null;
      if (answer.intent === 'search' && chips && chips.length) return chips.join(' · ') + ' 고객 검색';
      if (answer.intent === 'search' && answer.context_label) return text(answer.context_label.replace(/^[^·]*·\s*\d+명\s*·?\s*/, ''), 60) + (answer.context_label ? ' 고객 검색' : '');
      return (INTENT_LABEL[answer.intent] || '부점 AI') + ' · ' + text(message, 40);
    }
    return '부점 AI · ' + text(message, 40);
  }
  // session.send 한 번 = 검색 기록 하나. observer 콜백은 session/transport의 실제 관측 지점에서 호출된다.
  function searchRecorder(log, input) {
    var rec = log.add(record('branch_search', '부점 AI · ' + text(input.message, 40), 'frontend_observed', {
      requestId: input.requestId, conversationId: input.conversationId, baseRevision: input.baseRevision, message: text(input.message, 1200),
      action: input.action ? { type: input.action.type } : null, phase: null, agentTrace: null, answer: null, error: null, listApplied: null
    }));
    var sendStep = null, receive = null, pendingRender = false;
    var api = {
      record: rec,
      sent: function (info) {
        sendStep = instant(rec, { stage: 'post_sent', title: 'FabriX POST 요청 전송', summary: 'POST ' + info.path + ' · contents[0]에 요청 JSON 문자열 · request_id ' + rec.requestId,
          output: { method: info.method, path: info.path, requestId: rec.requestId, conversationId: rec.conversationId, baseRevision: rec.baseRevision, message: rec.message, action: rec.action } });
        rec.sentAt = sendStep.startedAt; rec._sentPerf = perf(); log.touch(rec);
      },
      responded: function () { receive = addStep(rec, { stage: 'response_stream', title: 'FabriX 응답 수신', status: 'running', summary: '응답 헤더 수신 · 스트림 읽는 중' }); log.touch(rec); },
      progress: function (p) {
        rec.phase = p.phase;
        instant(rec, { stage: 'progress', actor: 'AGENT', title: '진행 알림 · ' + (PHASE_LABEL[p.phase] || p.phase), summary: 'progress 이벤트 수신 (프론트 관측 시각) · list_pending ' + (p.list_pending ? '예' : '아니오'), output: { phase: p.phase, list_pending: !!p.list_pending } });
        log.touch(rec);
      },
      final: function (event) {
        // Clean EOF and contract validation already passed inside the transport; nothing here changes business state.
        if (!receive) receive = addStep(rec, { stage: 'response_stream', title: 'FabriX 응답 수신', summary: '' });
        var data = event.data, trace = data.execution_trace || null;
        endStep(receive, { status: 'completed', summary: (event.event === 'answer' ? 'answer' : 'error') + ' 이벤트 1개 · 정상 EOF' + (trace ? ' · Agent execution_trace ' + trace.steps.length + '단계 포함' : ' · execution_trace 없음(프론트 관측 기록만 표시)'),
          output: { event: event.event, hasExecutionTrace: !!trace } });
        rec.agentTrace = trace ? copy(trace) : null; rec.phase = null;
        if (event.event === 'answer') {
          rec.answer = { intent: data.intent, status: data.status, text: data.text, count: data.result.count, rowIds: ids(data.result.row_ids), unknownRowIds: ids(data.result.unknown_row_ids),
            listAction: data.ui.list_action, uiRowIds: data.ui.row_ids ? ids(data.ui.row_ids) : null, sort: copy(data.ui.sort), revision: data.revision, contextLabel: text(data.context_label, 300),
            dataVersion: data.data_version, ruleVersion: data.rule_version, datasetId: data.dataset_id, actions: (data.actions || []).map(function (a) { return a.label; }) };
          rec.title = searchTitle(rec.message, data);
        } else {
          rec.error = { code: data.code, retryable: !!data.retryable, message: text(data.message, 300) };
        }
        log.touch(rec);
      },
      validated: function (answer) {
        var s = addStep(rec, { stage: 'validated', title: '응답·고객 ID 검증 완료', summary: '' });
        endStep(s, { summary: 'result.row_ids ' + answer.result.count + '개가 현재 원본 목록 ID와 일치 · revision ' + answer.revision + ' · list_action ' + answer.ui.list_action, output: { count: answer.result.count, revision: answer.revision, listAction: answer.ui.list_action } });
        if (answer.ui.list_action === 'keep') {
          finish(rec, 'completed', (answer.result.count != null ? answer.result.count + '명 · ' : '') + '목록 유지(keep)');
          rec.listApplied = { action: 'keep' };
        } else pendingRender = true;
        log.touch(rec);
      },
      rendered: function (info) {
        // Called by the adapter after the customer list DOM was actually re-rendered for this answer.
        if (!pendingRender || rec.status !== 'running') return;
        pendingRender = false;
        var s = addStep(rec, { stage: 'list_rendered', title: '고객 목록 갱신 완료', summary: '' });
        endStep(s, { summary: (info.action === 'reset' ? '기존 목록 복원' : 'AI 검색 결과 ' + info.rowIds.length + '명 표시') + ' · 화면 revision ' + info.revision, output: { action: info.action, rowIds: ids(info.rowIds), revision: info.revision } });
        rec.listApplied = { action: info.action, rowIds: ids(info.rowIds), revision: info.revision };
        finish(rec, 'completed', (info.action === 'reset' ? '기존 목록 복원' : info.rowIds.length + '명 · 목록 반영 완료'));
        log.touch(rec);
      },
      failed: function (code, note) {
        if (rec.status !== 'running') return;
        if (receive && !receive.endedAt) endStep(receive, { status: 'failed', summary: '스트림 종료 전 오류 · ' + code });
        instant(rec, { stage: 'failed', title: '요청 실패', status: 'failed', summary: '코드 ' + code + (note ? ' · ' + note : '') + ' · 기존 목록과 조건 유지', output: { code: code } });
        rec.error = rec.error || { code: code, retryable: null, message: null };
        finish(rec, 'error', '오류 · ' + code);
        log.touch(rec);
      },
      cancelled: function (reason) {
        if (rec.status !== 'running') return;
        if (receive && !receive.endedAt) endStep(receive, { status: 'cancelled', summary: '취소로 스트림 읽기 중단' });
        instant(rec, { stage: 'cancelled', title: '요청 취소', status: 'cancelled', summary: (reason || '요청을 취소했습니다.') + ' · 서버의 LLM 작업 종료 여부는 확인하지 않음(미확인)' });
        finish(rec, 'cancelled', '취소됨');
        log.touch(rec);
      }
    };
    return api;
  }

  /* ---------- 고객 목록 엑셀 추출 (3단계: 대상·조건 확정 → XLSX 생성 → 다운로드 실행) ---------- */
  function exportRecorder(log, input) {
    var rec = log.add(record('excel_export', '고객 목록 엑셀 추출', 'frontend_observed', {
      sourceSearchTraceId: input.sourceSearchTraceId || null, listRevision: input.revision, condition: text(input.condition, 300), scope: text(input.scope, 300), asOf: input.asOf || null,
      rowIds: ids(input.rowIds), listSource: input.listSource, file: null, waitMs: null, phases: null
    }));
    var waitT = null, build = null, phases = {};
    var api = {
      record: rec,
      captured: function () {
        var s = addStep(rec, { stage: 'capture', title: '대상 ' + rec.rowIds.length + '명 · 조건 · 기준일 확정', summary: '' });
        endStep(s, { summary: '요청 시점의 표시 목록·순서·값 고정 · 출처 ' + (rec.listSource === 'ai_search' ? 'AI 검색 결과' : '메인 목록/필터') + ' · 조건 「' + rec.condition + '」 · 기준일 ' + (rec.asOf || '확인 필요'),
          output: { rowIds: rec.rowIds, count: rec.rowIds.length, listSource: rec.listSource, sourceSearchTraceId: rec.sourceSearchTraceId, listRevision: rec.listRevision, condition: rec.condition, asOf: rec.asOf, scope: rec.scope } });
        log.touch(rec);
      },
      empty: function () { instant(rec, { stage: 'empty', title: '대상 0명 · 종료', summary: '내려받을 고객이 없어 파일을 만들지 않음' }); finish(rec, 'completed', '대상 0명 · 종료'); log.touch(rec); },
      // 표시용 대기(정리 중)는 단계가 아니라 소요 메모다. 파일 생성 시간과 섞지 않는다.
      waitStart: function () { waitT = perf(); rec.waitMs = null; log.touch(rec); },
      waitEnd: function () { if (waitT != null) { rec.waitMs = round(perf() - waitT); waitT = null; } log.touch(rec); },
      buildStart: function () { phases = {}; build = addStep(rec, { stage: 'build', actor: 'EXPORT', title: 'XLSX 생성', status: 'running', summary: '고객 데이터 행·시트·파일 조립 중' }); build._phaseT = perf(); log.touch(rec); },
      phase: function (name, info) {
        if (!build) return;
        var now = perf(); phases[name] = Object.assign({ durationMs: round(now - build._phaseT) }, info); build._phaseT = now;
        log.touch(rec);
      },
      built: function (out) {
        rec.file = { fileName: out.fileName, byteLength: out.byteLength, rowCount: out.count, columnCount: out.columns.length, columns: out.columns.slice(), sheetNames: out.sheetNames.slice() };
        rec.phases = phases;
        endStep(build, { status: 'completed', summary: out.count + '행 · ' + out.columns.length + '열 · ' + out.sheetNames.join('/') + ' · ' + out.byteLength.toLocaleString('ko-KR') + ' bytes',
          output: { fileName: out.fileName, byteLength: out.byteLength, rowCount: out.count, columnCount: out.columns.length, columns: out.columns.slice(), sheetNames: out.sheetNames.slice(), phases: phases } });
        log.touch(rec);
      },
      downloaded: function (fileName) {
        var s = addStep(rec, { stage: 'download', title: '브라우저 다운로드 실행', summary: '' });
        endStep(s, { summary: fileName + ' (저장 완료 여부는 브라우저가 알려주지 않음)', output: { fileName: fileName } });
        finish(rec, 'completed', rec.file.rowCount + '명 · XLSX 생성 · 다운로드 실행');
        log.touch(rec);
      },
      failed: function (stage, code) {
        if (rec.status !== 'running') return;
        if (stage === 'build' && build && !build.endedAt) endStep(build, { status: 'failed', summary: '파일 생성 실패 · ' + code, output: { code: code, phases: phases } });
        else instant(rec, { stage: stage, title: stage === 'download' ? '다운로드 실행 실패' : '파일 생성 실패', status: 'failed', summary: '코드 ' + code, output: { code: code } });
        finish(rec, 'error', (stage === 'download' ? '파일 생성 완료 · 다운로드 실행 실패' : '파일 생성 실패') + ' · ' + code);
        log.touch(rec);
      },
      cancelled: function (reason) {
        if (rec.status !== 'running') return;
        if (waitT != null) { rec.waitMs = round(perf() - waitT); waitT = null; }
        instant(rec, { stage: 'cancelled', title: '요청 취소', status: 'cancelled', summary: (reason || '대기 중 취소') + ' · 파일을 만들지 않음' });
        finish(rec, 'cancelled', '취소됨 · 파일 미생성');
        log.touch(rec);
      }
    };
    return api;
  }

  return { createLog: createLog, searchRecorder: searchRecorder, exportRecorder: exportRecorder, INTENT_LABEL: INTENT_LABEL, PHASE_LABEL: PHASE_LABEL, MAX_RECORDS: MAX_RECORDS };
});

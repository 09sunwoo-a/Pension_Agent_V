/*
 * fabrixClient.js — 브라우저에서 Fabrix Agent Connector 호출하기 (참고 구현)
 * ============================================================================
 *
 * 출처:
 *   사내 업무화면 WAS(https://zmnbank.kbstar.com)에 배포해서
 *   브라우저 → Fabrix direct call 이 실제로 동작하는 것을 확인한 진단 코드.
 *   HTTP 200 / Content-Type: text/event-stream 응답과 CHUNK 수신을 확인했다.
 *
 * 원본과의 차이:
 *   원본 진단본에는 openapiToken / generativeAiClient / agentId / 직원ID가
 *   평문으로 박혀 있었다. 이 파일은 그 값들을 전부 제거하고 **호출 시 주입**하도록
 *   바꾼 것이다. 토큰을 다시 이 파일에 적지 마라.
 *   → docs/platform/06-SECURITY.md
 *
 * 용도:
 *   이 파일은 참고용이다. 화면에 로드되지 않는다.
 *   실제 연동 시 frontend/app/pensionAgentDemo.js 안으로 필요한 부분만 옮겨 쓴다.
 *   → integration/contracts/AGENT_FRONTEND_CONTRACT.md §5 (연동 설계)
 *
 * 관련 문서:
 *   integration/fabrix/FABRIX_GUIDE.md   — 규격 전체
 *   integration/contracts/AGENT_FRONTEND_CONTRACT.md — 응답 어댑터
 */

(function (global) {
  'use strict';

  // ==========================================================================
  // 1. 설정
  // --------------------------------------------------------------------------
  // 🔒 토큰을 이 파일에 하드코딩하지 마라. 호출자가 넘긴다.
  //
  // 운영 설계에서는 브라우저에 토큰을 내리지 않는 방식(사내 WAS 얇은 proxy)을
  // 우선 검토한다. → docs/platform/06-SECURITY.md §4
  //
  //   cfg = {
  //     endpointUrl:        'https://.../prod/kb0/<connector-id>/1',
  //     openapiToken:       '<FABRIX_OPENAPI_TOKEN>',        // 🔒 Secret
  //     generativeAiClient: '<FABRIX_GENERATIVE_AI_CLIENT>', // 🔒 Secret
  //     agentId:            0,                               // number
  //     xClientUser:        '<직원ID>'
  //   }
  // ==========================================================================

  function assertConfig(cfg) {
    if (!cfg) throw new Error('fabrixClient: config가 필요합니다.');

    ['endpointUrl', 'openapiToken', 'generativeAiClient', 'agentId'].forEach(function (k) {
      if (!cfg[k]) throw new Error('fabrixClient: config.' + k + ' 누락');
    });

    return cfg;
  }

  /**
   * Agent Connector 호출 URL 조립.
   * 패턴: {endpointUrl}/openapi/agent-chat/v1/agent-messages
   */
  function fabrixAgentUrl(cfg) {
    return String(cfg.endpointUrl).replace(/\/$/, '')
      + '/openapi/agent-chat/v1/agent-messages';
  }

  // ==========================================================================
  // 2. Request Body
  // --------------------------------------------------------------------------
  // ⚠️ contents 는 배열이고, contents[0] 은 객체가 아니라
  //    JSON 직렬화된 "문자열" 이다. 이 문자열이 Agent 쪽에서
  //    FabrixRequest.input_value 로 도착한다.
  // ==========================================================================

  function buildPayload(cfg, question) {
    var inner = {
      message: question,
      x_client_user: cfg.xClientUser || ''
    };

    return {
      agentId: cfg.agentId,
      contents: [JSON.stringify(inner)],   // ← 객체 아님. 문자열.
      llmConfig: {},
      isStream: true
    };
  }

  // ==========================================================================
  // 3. content 언래핑
  // --------------------------------------------------------------------------
  // Gateway가 Agent의 CHUNK 전체를 문자열로 한 번 더 감싸는 경우가 관찰됐다.
  // 그 경우까지 방어적으로 풀어준다.
  // ==========================================================================

  function unwrapFabrixContent(content) {
    if (typeof content !== 'string' || !content) return '';

    try {
      var nested = JSON.parse(content);

      // 한 겹 더 감싸져 있던 경우
      if (nested && typeof nested === 'object' && typeof nested.content === 'string') {
        return nested.content;
      }
    } catch (e) {
      // content가 JSON이 아니면 그대로 쓴다 (plain text 응답 등)
    }

    return content;
  }

  // ==========================================================================
  // 4. 호출 + SSE 스트림 읽기
  // --------------------------------------------------------------------------
  // ⚠️ EventSource를 쓸 수 없다.
  //    POST + 커스텀 헤더 + JSON body 이므로 fetch + ReadableStream 이다.
  //
  // onEvent(fabrixEvent) 콜백으로 이벤트가 하나씩 전달된다.
  // ==========================================================================

  /**
   * @param {object}   cfg       설정 (assertConfig 참고)
   * @param {string}   question  사용자 질문
   * @param {object}  [opts]
   * @param {function}[opts.onEvent]  (fabrixEvent) => void  — CHUNK 도착마다
   * @param {AbortSignal}[opts.signal]
   * @returns {Promise<{ok, httpStatus, contents, events, origin, url}>}
   */
  async function callFabrixAgent(cfg, question, opts) {
    assertConfig(cfg);
    opts = opts || {};

    var url = fabrixAgentUrl(cfg);
    var payload = buildPayload(cfg, question);

    var response;

    try {
      response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-store',
        signal: opts.signal,

        headers: {
          'Content-Type': 'application/json; charset=UTF-8',

          // 🔒 Secret 2종
          'X-openapi-token': 'Bearer ' + cfg.openapiToken,
          'x-generative-ai-client': cfg.generativeAiClient
        },

        body: JSON.stringify(payload)
      });
    } catch (err) {
      // 여기서 실패하면 대개 CORS다.
      // Network 탭에서 OPTIONS / POST 상태를 확인한다.
      // OPTIONS 405 → 이 origin에서 direct fetch가 차단된 것.
      // (zmnbank.kbstar.com origin 은 성공이 확인됐다. → 04 §9)
      err.fabrixPhase = 'fetch';
      throw err;
    }

    if (!response.ok) {
      var errText = '';
      try { errText = await response.text(); } catch (e) {}

      var httpErr = new Error(
        'Fabrix HTTP ' + response.status + (errText ? ' · ' + errText.slice(0, 240) : '')
      );
      httpErr.fabrixPhase = 'http';
      httpErr.httpStatus = response.status;
      throw httpErr;
    }

    // 스트림을 못 쓰는 환경 대비 (isStream=false 응답 등)
    if (!response.body || !response.body.getReader) {
      var whole = await response.text();
      return {
        ok: true,
        httpStatus: response.status,
        contents: [whole],
        events: [],
        origin: global.location && global.location.origin,
        url: url
      };
    }

    var reader = response.body.getReader();
    var decoder = new TextDecoder('utf-8');

    var buffer = '';
    var events = [];
    var contents = [];
    var gatewayError = null;

    while (true) {
      var item = await reader.read();
      if (item.done) break;

      buffer += decoder.decode(item.value, { stream: true });

      // 줄 단위로 끊는다. 마지막 조각은 미완성일 수 있으므로 buffer로 되돌린다.
      // (\r\n 도 함께 처리. `data: {...}\n\n` framing 에서는 빈 줄이 자연히 걸러진다.)
      var lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || '';

      for (var i = 0; i < lines.length; i++) {
        var line = String(lines[i] || '').trim();

        if (!line || line.indexOf('data:') !== 0) continue;

        var raw = line.slice(5).trim();
        if (!raw || raw === '[DONE]') continue;

        var fabrixEvent;

        try {
          fabrixEvent = JSON.parse(raw);          // ← 1단계 parse
        } catch (parseErr) {
          // 조각난 JSON일 수 있다. 조용히 넘긴다.
          continue;
        }

        events.push(fabrixEvent);

        // Gateway 레벨 오류
        if (fabrixEvent.status && fabrixEvent.status !== 'SUCCESS') {
          gatewayError = 'Gateway ' + fabrixEvent.status
            + (fabrixEvent.responseCode ? ' / ' + fabrixEvent.responseCode : '')
            + (fabrixEvent.content ? ' · ' + fabrixEvent.content : '');
        }

        // ⚠️ 첫 CHUNK는 content가 비어 있을 수 있다. 반드시 거른다.
        if (!fabrixEvent.content) continue;

        var content = unwrapFabrixContent(fabrixEvent.content);
        if (!content) continue;

        contents.push(content);

        if (typeof opts.onEvent === 'function') {
          opts.onEvent(fabrixEvent, content);
        }
      }
    }

    if (gatewayError) {
      var gwErr = new Error(gatewayError);
      gwErr.fabrixPhase = 'gateway';
      throw gwErr;
    }

    return {
      ok: true,
      httpStatus: response.status,
      contents: contents,
      events: events,
      origin: global.location && global.location.origin,
      url: url
    };
  }

  // ==========================================================================
  // 5. ★ 2단계 파싱
  // --------------------------------------------------------------------------
  //   Fabrix envelope            ← 위에서 JSON.parse(raw) 로 이미 품
  //       ↓ .content  (아직 문자열)
  //   우리 Agent Contract        ← 여기서 한 번 더 parse
  //
  // 이 분리는 의도적으로 유지한다. envelope과 우리 계약을 섞지 마라.
  // → integration/fabrix/FABRIX_GUIDE.md §8
  // ==========================================================================

  /**
   * content 문자열 → Agent 이벤트 객체.
   * 파싱 실패 시 null (throw하지 않는다).
   */
  function parseAgentEvent(content) {
    if (!content) return null;

    try {
      var agentEvent = JSON.parse(content);       // ← 2단계 parse
      if (agentEvent && typeof agentEvent === 'object') return agentEvent;
    } catch (e) {
      // Agent가 plain text를 보낸 경우 등
    }

    return null;
  }

  // ==========================================================================
  // 6. 사용 예
  // --------------------------------------------------------------------------
  //
  //   var cfg = window.__FABRIX_CONFIG;   // 토큰은 외부에서 주입
  //
  //   var res = await FabrixClient.call(cfg, 'IRP 세액공제 한도가 얼마야?', {
  //     onEvent: function (fabrixEvent, content) {
  //
  //       if (fabrixEvent.event_status !== 'CHUNK') return;
  //
  //       var agentEvent = FabrixClient.parseAgentEvent(content);
  //       if (!agentEvent) return;
  //
  //       if (agentEvent.event === 'answer') {
  //         // agentEvent.data 를 어댑터로 넘긴다
  //         // → integration/contracts/AGENT_FRONTEND_CONTRACT.md §5 normalizeAgentAnswer()
  //         //   ⚠️ paragraph→p, text→x 변환 필수
  //       } else if (agentEvent.event === 'error') {
  //         // 안내 메시지 표시
  //       }
  //     }
  //   });
  //
  // ⚠️ 키 이름 주의:
  //     브라우저가 받는 envelope 키 = event_status   (Fabrix가 재구성)
  //     Agent가 보낸 계약 키        = event
  //     둘은 다르다.
  //
  // ⚠️ streaming 중 chunk 도착마다 전체 화면을 다시 그리지 마라.
  //     → frontend/platform/STARROOT_FRONTEND_GUIDE.md §9, §11
  // ==========================================================================

  global.FabrixClient = {
    call: callFabrixAgent,
    parseAgentEvent: parseAgentEvent,
    unwrapFabrixContent: unwrapFabrixContent,
    agentUrl: fabrixAgentUrl,
    buildPayload: buildPayload
  };

})(typeof window !== 'undefined' ? window : this);

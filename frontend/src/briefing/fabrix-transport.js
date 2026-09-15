/* POST + SSE transport. Does not render, log raw responses, or persist secrets. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PensionFabrixTransport = factory();
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  function fault(code) { var error = new Error(code); error.code = code; return error; }
  function config(input) {
    if (!input || typeof input !== 'object') throw fault('CONFIG');
    var cfg = {};
    ['endpointUrl', 'openapiToken', 'generativeAiClient', 'xClientUser'].forEach(function (key) {
      if (typeof input[key] !== 'string' || !input[key].trim()) throw fault('CONFIG');
      cfg[key] = input[key].trim();
    });
    if (!Number.isSafeInteger(input.agentId) || input.agentId <= 0) throw fault('CONFIG');
    cfg.agentId = input.agentId;
    var url;
    try { url = new URL(cfg.endpointUrl); } catch (_) { throw fault('CONFIG'); }
    var loopback = ['localhost', '127.0.0.1', '[::1]'].indexOf(url.hostname) >= 0;
    if ((url.protocol !== 'https:' && !(loopback && url.protocol === 'http:')) || url.username || url.password || url.search || url.hash) throw fault('CONFIG');
    cfg.endpointUrl = url.href.replace(/\/+$/, '');
    cfg.openapiToken = cfg.openapiToken.replace(/^Bearer\s+/i, '');
    if (!cfg.openapiToken || /[\r\n]/.test(cfg.openapiToken + cfg.generativeAiClient)) throw fault('CONFIG');
    return cfg;
  }
  // Buffer by SSE event, not network packet. Handles CRLF split across packets,
  // comments, multi-line data, UTF-8 fragments and [DONE]. Incomplete EOF fails.
  function parser(onEnvelope) {
    var buffer = '', ended = false, total = 0;
    function dispatch(block) {
      var data = block.split(/\r?\n/).filter(function (line) { return line.indexOf('data:') === 0; })
        .map(function (line) { return line.slice(5).replace(/^ /, ''); }).join('\n');
      if (!data.trim()) return;
      if (ended) throw fault('SSE');
      if (data.trim() === '[DONE]') { ended = true; return; }
      var event;
      try { event = JSON.parse(data); } catch (_) { throw fault('SSE'); }
      onEnvelope(event);
    }
    return {
      push: function (text) {
        total += text.length;
        if (total > 4 * 1024 * 1024) throw fault('LIMIT');
        buffer += text;
        var boundary;
        while ((boundary = /\r?\n\r?\n/.exec(buffer))) {
          var block = buffer.slice(0, boundary.index);
          buffer = buffer.slice(boundary.index + boundary[0].length);
          dispatch(block);
        }
      },
      finish: function () { if (buffer.trim()) throw fault('TRUNCATED'); }
    };
  }
  function logicalEvent(envelope) {
    if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) throw fault('SSE');
    if (envelope.status && envelope.status !== 'SUCCESS') throw fault('GATEWAY');
    if (envelope.truncated === true || envelope.truncated === 'true' || envelope.finish_reason === 'length') throw fault('TRUNCATED');
    if (envelope.event_status !== 'CHUNK') {
      if (['START', 'END', 'DONE'].indexOf(envelope.event_status) >= 0 && !envelope.content) return null;
      throw fault('SSE');
    }
    if (envelope.content === '' || envelope.content == null) return null;
    if (typeof envelope.content !== 'string') throw fault('JSON');
    var event;
    try { event = JSON.parse(envelope.content); } catch (_) { throw fault('JSON'); }
    // Known extra Agent-CHUNK wrapper, at most one layer; never unwrap arbitrary
    // objects just because they happen to contain a field named content.
    if (event && event.event === 'CHUNK' && typeof event.content === 'string') {
      try { event = JSON.parse(event.content); } catch (_) { throw fault('JSON'); }
    }
    return event;
  }
  async function call(cfgInput, req, opts) {
    var cfg = config(cfgInput); opts = opts || {};
    var controller = new AbortController(), timedOut = false, reader, completed = false;
    var abort = function () { controller.abort(); };
    if (opts.signal) { opts.signal.addEventListener('abort', abort); if (opts.signal.aborted) abort(); }
    var timeoutMs = opts.timeoutMs == null ? 90000 : opts.timeoutMs;
    var timer = setTimeout(function () { timedOut = true; controller.abort(); }, timeoutMs);
    var answer = null;
    try {
      var response = await (opts.fetch || fetch)(cfg.endpointUrl + '/openapi/agent-chat/v1/agent-messages', {
        method: 'POST', mode: 'cors', credentials: 'omit', cache: 'no-store', redirect: 'error', signal: controller.signal,
        headers: { 'Content-Type': 'application/json; charset=UTF-8', 'Accept': 'text/event-stream',
          'x-openapi-token': 'Bearer ' + cfg.openapiToken, 'x-generative-ai-client': cfg.generativeAiClient },
        body: JSON.stringify({ agentId: cfg.agentId, contents: [JSON.stringify(req)], llmConfig: {}, isStream: true })
      });
      if (!response.ok) throw fault(response.status === 401 || response.status === 403 ? 'AUTH' : 'HTTP');
      if (!/^text\/event-stream(?:\s*;|$)/i.test(response.headers.get('content-type') || '')) throw fault('CONTENT_TYPE');
      if (!response.body || !response.body.getReader) throw fault('STREAM');
      reader = response.body.getReader();
      var decoder = new TextDecoder('utf-8', { fatal: true });
      var stream = parser(function (envelope) {
        var event = logicalEvent(envelope);
        if (event === null) return;
        if (answer !== null) throw fault('MULTIPLE');
        if (!event || (event.event !== 'answer' && event.event !== 'error')) throw fault('SCHEMA');
        answer = event;
      });
      while (true) {
        var item = await reader.read();
        if (item.done) break;
        var decoded;
        try { decoded = decoder.decode(item.value, { stream: true }); } catch (_) { throw fault('SSE'); }
        stream.push(decoded);
      }
      var tail;
      try { tail = decoder.decode(); } catch (_) { throw fault('SSE'); }
      stream.push(tail); stream.finish();
      if (controller.signal.aborted) throw fault(timedOut ? 'TIMEOUT' : 'ABORTED');
      if (answer === null) throw fault('EMPTY');
      completed = true;
      return answer;
    } catch (error) {
      if (controller.signal.aborted) throw fault(timedOut ? 'TIMEOUT' : 'ABORTED');
      throw error.code ? error : fault('NETWORK');
    } finally {
      clearTimeout(timer);
      if (opts.signal) opts.signal.removeEventListener('abort', abort);
      if (reader) { if (!completed) { try { await reader.cancel(); } catch (_) {} } reader.releaseLock(); }
    }
  }
  return { config: config, parser: parser, logicalEvent: logicalEvent, call: call };
});

/* Streaming transport for the conversational agent. Same FabriX envelope and SSE
 * framing as the briefing call, but one turn is a sequence of typed events
 * (progress … answer|error, sources, followups, done). Does not render or log. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./fabrix-transport'));
  else root.PensionChatTransport = factory(root.PensionFabrixTransport);
})(typeof window === 'undefined' ? globalThis : window, function (base) {
  'use strict';
  function fault(code) { var error = new Error(code); error.code = code; return error; }
  // Same URL/credential rules as the briefing call; only agentId may be an assetId string.
  function config(input) {
    if (!input || typeof input !== 'object') throw fault('CONFIG');
    var agentId = typeof input.agentId === 'string' ? input.agentId.trim() : input.agentId;
    var valid = (typeof agentId === 'string' && agentId && !/[\r\n]/.test(agentId)) || (Number.isSafeInteger(agentId) && agentId > 0);
    if (!valid) throw fault('CONFIG');
    var cfg = base.config(Object.assign({}, input, { agentId: 1 }));
    cfg.agentId = agentId;
    return cfg;
  }
  // One envelope `content` can carry several event objects back to back, an Agent
  // CHUNK wrapper around them, or a gateway error text with the CHUNK embedded.
  function events(text, out) {
    var s = String(text == null ? '' : text), i = 0;
    out = out || [];
    while (i < s.length) {
      var start = s.indexOf('{', i);
      if (start < 0) break;
      var depth = 0, inString = false, escaped = false, end = -1;
      for (var j = start; j < s.length; j++) {
        var ch = s[j];
        if (inString) { if (escaped) escaped = false; else if (ch === '\\') escaped = true; else if (ch === '"') inString = false; }
        else if (ch === '"') inString = true;
        else if (ch === '{') depth++;
        else if (ch === '}' && --depth === 0) { end = j; break; }
      }
      if (end < 0) break;
      var parsed = null;
      try { parsed = JSON.parse(s.slice(start, end + 1)); } catch (_) {}
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        if (typeof parsed.type === 'string') out.push(parsed);
        else if (parsed.event === 'CHUNK' && typeof parsed.content === 'string') events(parsed.content, out);
      }
      i = end + 1;
    }
    return out;
  }
  async function call(cfgInput, inner, opts) {
    var cfg = config(cfgInput); opts = opts || {};
    var controller = new AbortController(), timedOut = false, reader, finished = false, count = 0;
    var abort = function () { controller.abort(); };
    if (opts.signal) { opts.signal.addEventListener('abort', abort); if (opts.signal.aborted) abort(); }
    var timer = setTimeout(function () { timedOut = true; controller.abort(); }, opts.timeoutMs == null ? 180000 : opts.timeoutMs);
    function emit(event) {
      if (finished) return;
      count++;
      if (event.type === 'done') finished = true;
      if (typeof opts.onEvent === 'function') opts.onEvent(event);
    }
    try {
      var response = await (opts.fetch || fetch)(cfg.endpointUrl + '/openapi/agent-chat/v1/agent-messages', {
        method: 'POST', mode: 'cors', credentials: 'omit', cache: 'no-store', redirect: 'error', signal: controller.signal,
        headers: { 'Content-Type': 'application/json; charset=UTF-8', 'Accept': 'text/event-stream',
          'x-openapi-token': 'Bearer ' + cfg.openapiToken, 'x-generative-ai-client': cfg.generativeAiClient },
        body: JSON.stringify({ agentId: cfg.agentId, contents: [JSON.stringify(inner)], llmConfig: {}, isStream: true })
      });
      if (!response.ok) throw fault(response.status === 401 || response.status === 403 ? 'AUTH' : 'HTTP');
      if (!/^text\/event-stream(?:\s*;|$)/i.test(response.headers.get('content-type') || '')) throw fault('CONTENT_TYPE');
      if (!response.body || !response.body.getReader) throw fault('STREAM');
      reader = response.body.getReader();
      var decoder = new TextDecoder('utf-8', { fatal: true });
      var stream = base.parser(function (envelope) {
        if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) throw fault('SSE');
        var found = events(envelope.content);
        if (!found.length && envelope.status && envelope.status !== 'SUCCESS') throw fault('GATEWAY');
        found.forEach(emit);
      });
      while (!finished) {
        var item = await reader.read();
        if (item.done) break;
        var decoded;
        try { decoded = decoder.decode(item.value, { stream: true }); } catch (_) { throw fault('SSE'); }
        stream.push(decoded);
      }
      if (!finished) {
        var tail;
        try { tail = decoder.decode(); } catch (_) { throw fault('SSE'); }
        stream.push(tail); stream.finish();
      }
      if (controller.signal.aborted) throw fault(timedOut ? 'TIMEOUT' : 'ABORTED');
      if (!finished) throw fault(count ? 'TRUNCATED' : 'EMPTY');
      return { ok: true, events: count };
    } catch (error) {
      if (controller.signal.aborted) throw fault(timedOut ? 'TIMEOUT' : 'ABORTED');
      throw error.code ? error : fault('NETWORK');
    } finally {
      clearTimeout(timer);
      if (opts.signal) opts.signal.removeEventListener('abort', abort);
      if (reader) { try { await reader.cancel(); } catch (_) {} reader.releaseLock(); }
    }
  }
  return { config: config, events: events, call: call };
});

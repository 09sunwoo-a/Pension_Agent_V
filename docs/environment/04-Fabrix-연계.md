# 04. Fabrix 연계

> 근거: `sources/KB_GenAI_ProAgent_SourceOfTruth_v2.md` §14, §15, §20~§31
> 핵심: **Fabrix는 Agent Connector 계층이고, Gemma endpoint와 전혀 다르다.**

---

## 1. 위치

```text
Browser / Python Client
        ↓
Fabrix Agent Connector      ← 인증 · 라우팅 · SSE 중계
        ↓
배포된 FastAPI Agent
        ↓
Agent Logic
        ↓
Gemma
```

```text
⚠️ Fabrix Endpoint != Gemma Endpoint
```

---

## 2. 호출 URL

패턴:

```text
{FABRIX_ENDPOINT_URL}/openapi/agent-chat/v1/agent-messages
```

`FABRIX_ENDPOINT_URL` 호스트 패턴 예:

```text
https://stg-fabrix-catalog-apim-trnn-genaihub.kbonecloud.com/prod/kb0/<connector-id>/1
```

최종:

```text
https://.../<connector-id>/1/openapi/agent-chat/v1/agent-messages
```

```javascript
function fabrixAgentUrl(endpointUrl) {
  return endpointUrl.replace(/\/$/, '') + '/openapi/agent-chat/v1/agent-messages';
}
```

---

## 3. Request Headers

```http
Content-Type: application/json
x-openapi-token: Bearer <FABRIX_OPENAPI_TOKEN>
x-generative-ai-client: <FABRIX_GENERATIVE_AI_CLIENT>
```

> 🔒 이 값들은 **Secret** 이다. 정적 소스에 하드코딩하지 마라. → [09-보안-시크릿.md](09-보안-시크릿.md)

---

## 4. Request Body

```json
{
  "agentId": 1234,
  "contents": [
    "{\"message\":\"질문\",\"x_client_user\":\"직원ID\"}"
  ],
  "llmConfig": {},
  "isStream": true
}
```

### ⚠️ 가장 틀리기 쉬운 부분

```text
contents 는 배열이다.
contents[0] 은 JSON 객체가 아니라 JSON 직렬화 "문자열" 이다.
```

```javascript
const inner = {
  message: question,
  x_client_user: X_CLIENT_USER
};

const payload = {
  agentId: AGENT_ID,
  contents: [ JSON.stringify(inner) ],   // ← 객체가 아니라 문자열
  llmConfig: {},
  isStream: true
};
```

이 `contents[0]` 문자열이 Agent 쪽에서 `FabrixRequest.input_value` 로 도착한다.
→ [02-에이전트-개발.md](02-에이전트-개발.md) §6

---

## 5. Agent → Fabrix 응답 (SSE)

Agent가 Fabrix로 반환할 때 검증된 구조:

```python
payload = {
    "event": "CHUNK",
    "content": agent_content,      # 우리 Agent JSON의 "문자열"
    "references": [],
    "recommend_queries": [],
    "actions": [],
}

yield "data: " + json.dumps(payload, ensure_ascii=False) + "\n\n"
```

```python
return StreamingResponse(generate(), media_type="text/event-stream")
```

핵심 framing:

```text
data: {JSON}\n\n
```

`\n\n` (빈 줄 하나) 로 이벤트가 끝난다. 이걸 지켜야 브라우저 쪽 split이 맞는다.

### `content` 에 무엇을 넣는가

초기에는 `"안녕하세요"` 같은 plain text를 넣었으나,
현재는 **프론트 제어를 위해 우리 Agent JSON을 문자열로 직렬화해서** 넣는 방식이 검증됐다.

```python
agent_content = json.dumps(
    AnswerEvent(data=answer).model_dump(),
    ensure_ascii=False,
)
```

따라서 Fabrix `content` 는:

```text
"{\"event\":\"answer\",\"data\":{...}}"
```

형태의 JSON string이다.

---

## 6. Browser에서 받는 Fabrix Event

실제 Console에서 확인된 구조:

```json
{
  "event_status": "CHUNK",
  "content": "...",
  "status": "SUCCESS",
  "result_code": "FR-200",
  "orchestrator_type": "custom",
  "model_type": "GPT-OSS",
  "references": [],
  "recommend_queries": [],
  "actions": []
}
```

그 외 관찰된 필드: `id`, `parent_message_id`, `parent_message_created_at`, `chat_id`,
`user_id`, `catalogs`, `files`, `plugins`, `prompt_token`, `completion_token`,
`finish_reason`, `response_code`, `truncated`.

프론트가 실질적으로 쓰는 필드는 다음으로 충분하다:

```text
event_status
content
status
result_code
references
recommend_queries
actions
```

> ⚠️ Agent가 보낸 키는 `event` 인데 브라우저에서 받는 키는 `event_status` 다.
> Fabrix가 envelope을 재구성한다. 둘을 혼동하지 마라.

### ⚠️ 첫 CHUNK는 비어 있을 수 있다

```json
{ "event_status": "CHUNK", "content": "" }
```

반드시 걸러라:

```javascript
if (!event.content) continue;
```

---

## 7. Browser 호출은 `fetch` + `ReadableStream`

`EventSource` 를 쓰지 마라. 요청이 **POST + 커스텀 헤더 + JSON body** 이기 때문에
`EventSource` 로는 불가능하다.

```javascript
const response = await fetch(url, {
  method: "POST",
  mode: "cors",
  cache: "no-store",
  headers: {
    "Content-Type": "application/json; charset=UTF-8",
    "x-openapi-token": `Bearer ${OPENAPI_TOKEN}`,
    "x-generative-ai-client": GENERATIVE_AI_CLIENT,
  },
  body: JSON.stringify(payload),
});
```

### SSE 읽기

```javascript
const reader = response.body.getReader();
const decoder = new TextDecoder("utf-8");
let buffer = "";

while (true) {
  const { value, done } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });

  const chunks = buffer.split("\n\n");
  buffer = chunks.pop() || "";        // ← 마지막 조각은 미완성일 수 있으므로 되돌린다

  for (const chunk of chunks) {
    const line = chunk.split("\n").find(l => l.startsWith("data:"));
    if (!line) continue;

    const raw = line.replace(/^data:\s*/, "").trim();
    if (!raw) continue;

    const fabrixEvent = JSON.parse(raw);
    // ... 8번으로
  }
}
```

---

## 8. ★ 2단계 파싱

이 프로젝트에서 가장 자주 틀리는 지점이다.

```text
Fabrix Envelope
    ↓ JSON.parse(raw)
fabrixEvent.content   ← 아직 "문자열"
    ↓ JSON.parse(content)
우리 Agent Contract
```

```javascript
if (fabrixEvent.event_status === "CHUNK" && fabrixEvent.content) {

  const agentEvent = JSON.parse(fabrixEvent.content);   // ← 2단계

  if (agentEvent.event === "answer") {
    const answer = agentEvent.data;
    // UI render
  }
}
```

**이 분리는 의도적으로 유지한다.** Fabrix envelope과 우리 계약을 섞지 마라.

### 3단계로 감싸지는 경우 대비

게이트웨이가 Agent의 CHUNK 전체를 문자열로 한 번 더 감싸는 사례가 관찰됐다.
방어적으로 풀어주는 헬퍼를 두는 것이 안전하다.

```javascript
function unwrapFabrixContent(content) {
  if (typeof content !== 'string' || !content) return '';
  try {
    const nested = JSON.parse(content);
    if (nested && typeof nested === 'object' && typeof nested.content === 'string') {
      return nested.content;     // 한 겹 더 감싸져 있던 경우
    }
  } catch (e) {}
  return content;
}
```

---

## 9. CORS — 단정하지 마라

| Origin | 결과 |
|---|---|
| `https://zmnbank.kbstar.com` | ✅ HTTP 200, `text/event-stream` (direct call 성공) |
| 그 외 일부 origin | ⚠️ `OPTIONS 405` 발생 사례 있음 |

정확한 결론은 이것뿐이다:

```text
Fabrix Browser direct call 가능 여부는 Origin/CORS 정책에 따라 다르다.
zmnbank.kbstar.com origin 은 현재 direct call 성공이 확인됐다.
```

```text
❌ "Fabrix는 Browser에서 무조건 안 된다"
❌ "어떤 Browser에서도 된다"
```

둘 다 틀렸다. 새 origin에서 쓸 거면 그 origin에서 직접 확인하라.

---

## 10. 체크리스트

### Agent 쪽
```text
[ ] SSE framing이 `data: {JSON}\n\n` 인가
[ ] media_type이 text/event-stream 인가
[ ] content가 우리 Agent JSON의 "문자열"인가
[ ] references / recommend_queries / actions 키가 존재하는가 (빈 배열이라도)
```

### 프론트 쪽
```text
[ ] EventSource가 아니라 fetch + ReadableStream 인가
[ ] contents[0]이 JSON.stringify된 문자열인가
[ ] buffer.split("\n\n") 후 마지막 조각을 buffer로 되돌리는가
[ ] 빈 content를 건너뛰는가
[ ] 2단계 JSON.parse를 하는가
[ ] event_status(= 브라우저 키)와 event(= Agent 키)를 혼동하지 않았는가
[ ] 토큰을 정적 JS에 하드코딩하지 않았는가
```

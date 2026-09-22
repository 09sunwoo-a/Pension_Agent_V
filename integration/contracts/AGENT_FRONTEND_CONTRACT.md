# FabriX 고객별 브리핑 — 테스트 방법 및 Agent 입출력 명세

## 1. 이 문서의 범위

프론트 통합본은 **HTML 1개 + JS 1개 + CSS 1개**입니다. 실제 호출 기능을 포함하며, Agent는 아래 계약대로 결과를 반환하면 됩니다. Agent 내부의 검색·추론·문장 생성 방식은 이 문서가 정하지 않습니다. 기존 `fact` 상담 응답과 다른 **브리핑 전용 계약**입니다.

- 배포본: `frontend/briefing-fabrix/`
- 고정 계약 버전: `customer-briefing-api.v1`
- 전체 응답 예시: [response.example.json](response.example.json)
- 기계 검증용 스키마는 프론트 계약 JS에만 정의합니다. 중복 JSON 스키마 파일은 두지 않습니다.
- 현재 Agent는 LLM 없이 저장된 고객별 브리핑을 반환합니다. `case_id`로 조회하고 고객 ID·기준일·전체 입력 스냅샷이 배포 자료와 일치하는지 검사합니다. 다른 값이면 오류 이벤트를 반환합니다. 문장 생성은 이후 구현 범위입니다.

고정할 것은 **필드 이름·자료형·의미·이벤트 구분**입니다. 고객별 문장과 선택지·추천상품·고객 반응의 개수는 달라도 됩니다. 선택 필드의 값이 없으면 해당 화면 영역을 숨깁니다.

규격 수정 원본은 [briefing-contract.js](../../frontend/src/briefing/briefing-contract.js)의 S1–S5 공통 스키마와 [fabrix-briefing-contract.js](../../frontend/src/briefing/fabrix-briefing-contract.js)의 API envelope입니다. 별도 수정용 JSON 스키마는 두지 않습니다. 빌드가 같은 스키마와 고객·브리핑을 `agent/briefing_data.json`에 포함하므로 Python에서도 검사합니다. 응답 예시와 Agent 묶음은 직접 수정하지 않습니다. [수정 위치와 명령](../../README.md)을 참조하세요.

## 2. 사내 배포와 연결 설정

다음 세 파일만 배포합니다. 별도 JSON·JS 의존 파일, npm, 외부 CDN, React, 런타임 빌드는 필요하지 않습니다.

```text
frontend/briefing-fabrix/
  mnPensionAgentDemo.html
  pensionAgentDemo.js
  pensionAgentDemo.css
```

HTML의 리소스 경로는 검증본과 같습니다.

```text
/mnbank/app/html/bfe/asstmgt/asst/pensionAgentDemo.js
/mnbank/app/html/bfe/asstmgt/asst/pensionAgentDemo.css
```

반입 JS의 `STARROOT_FILE_CODE`는 빌드 기본값 `1288272`입니다(다른 코드는 `node tools/briefing/build.js <파일코드>`). `PG_<파일코드>.onParam()` 초기화, `onBeforeUnload()` 정리를 사용합니다. `DOMContentLoaded`에 의존하지 않습니다. 파일 경로·파일코드 설정은 최초 배포 작업이며 FabriX 인증 설정과 별개입니다.

연결 설정 다섯 값은 화면 진입 시 런타임으로 주입합니다. 정적 배포 파일·소스·Git에는 넣지 않습니다.

1. Starroot가 `PG_<파일코드>.onParam(params)`를 호출할 때 `params.fabrix`로 전달하거나,
2. `mnPensionAgentDemo.html` `<body>` 첫머리의 `window.__PENSION_FABRIX_CONFIG` 블록에 값을 채웁니다. 저장소 원본은 항상 빈 값이며(빌드가 검사), **배포본에서만** 채우거나 WAS가 서버에서 채워 넣습니다. `params.fabrix`가 있으면 그 값을 우선합니다.

```js
// params.fabrix 또는 window.__PENSION_FABRIX_CONFIG
{ endpointUrl: 'https://…/prod/kb0/<connector-id>/1', agentId: 1234, xClientUser: '<직원ID>',
  openapiToken: '<OpenAPI 토큰>', generativeAiClient: '<인증용 클라이언트 값>' }
```

화면 동작:

1. 메인 목록에서 브리핑이 있는 고객(B 30명)을 클릭하면 준비 화면 뒤 상세로 넘어가며 즉시 FabriX 요청을 보냅니다. 테스트용 '고객별 브리핑' 버튼·드롭다운은 2026-09-22에 제거했습니다. 반입본에 저장된 브리핑 문장은 없으며 S1~S5에는 API 응답만 표시합니다.
2. 같은 화면 세션에서 이미 수신한 고객을 다시 선택하면 재요청하지 않습니다. **다시 요청**으로 명시적으로 갱신합니다.
3. 호출 중에는 **요청 취소**를 쓸 수 있고, 다른 고객 선택·목록 복귀·화면 종료 시 자동으로 취소합니다.
4. 상단 고객정보·IRP 계좌·보유상품은 응답과 무관하게 로컬 스냅샷을 표시합니다.
5. 설정이 주입되지 않았으면 `NOCONFIG`, 형식이 틀리면 `CONFIG`를 표시하고 요청하지 않습니다.

| 설정 필드 | 내용 |
|---|---|
| `endpointUrl` | Connector 기준 URL. 예: `https://…/prod/kb0/<connector-id>/1`. `/openapi/agent-chat/v1/agent-messages`는 프론트가 붙임 |
| `openapiToken` | OpenAPI 인증 토큰. `Bearer `가 붙어 있어도 중복하지 않음 |
| `generativeAiClient` | 인증용 클라이언트 값 |
| `agentId` | 양의 정수. 예시의 0은 실제 설정으로 허용하지 않음 |
| `xClientUser` | 직원 ID. 요청의 `x_client_user`로 전달 |

주입 대신 호출 코드로 설정할 때도 동일한 필드를 사용합니다(로컬 확인 등). 설정 후에는 다음 고객 선택부터 자동 요청하며, `request`로 바로 호출할 수도 있습니다. 실제 값을 정적 배포 파일에 넣지 않습니다.

```js
var configured = window.PensionFabrix.configure(cfg);
// configured: { ok: true } 또는 { ok: false, code: 'CONFIG' }
if (configured.ok) {
  window.PensionFabrix.request('DEMO-01').then(function (result) {
    // result에는 성공 여부·안전한 오류 코드만 포함됩니다.
  });
}
```

설정은 JS 메모리에만 보관하며 저장소·쿠키·파일·로그에 기록하지 않습니다. 화면 종료(`onBeforeUnload`) 시 제거하므로 화면 진입마다 다시 주입되어야 합니다. Component 상태나 HTML에는 보관하지 않습니다. 다만 브라우저 직접 호출 특성상 Network 탭에는 인증 헤더가 보입니다. **승인된 사내 환경에서만 사용하고, 운영 적용 시 WAS 프록시 등 토큰을 브라우저에 내리지 않는 방식을 별도로 검토해야 합니다.** 개발자 도구 콘솔 기록에도 실제 토큰을 붙여넣지 않는 것을 권장합니다.

`기존 데모 · 김서연`은 원래 화면을 보존하므로 API 호출 대상이 아닙니다. 김서연 실제 연결 테스트는 `대표 · 상품 제안 · 김서연`(`DEMO-01`)을 선택합니다. 데이터는 시연용이며, 원천 내용의 검토 완료를 뜻하지 않습니다.

## 3. 프론트 → FabriX 요청

```http
POST {endpointUrl}/openapi/agent-chat/v1/agent-messages
Content-Type: application/json; charset=UTF-8
Accept: text/event-stream
x-openapi-token: Bearer <실행 시 주입>
x-generative-ai-client: <실행 시 주입>
```

요청 body는 아래 코드와 같은 구조입니다. **`contents[0]`은 객체가 아니라 JSON 문자열**입니다.

```js
{
  agentId: cfg.agentId,
  contents: [JSON.stringify(agentRequest)],
  llmConfig: {},
  isStream: true
}
```

Agent에서 `FabrixRequest.input_value`를 JSON 파싱하면 `agentRequest` 객체를 얻습니다. 요청 필드는 아래 표를 따르며 `request()` 함수가 동일한 객체를 생성합니다.

| `agentRequest` 필드 | 자료형 | 의미 |
|---|---|---|
| `schema_version` | string | `customer-briefing-api.v1` |
| `task` | string | `customer_briefing` |
| `request_id` | string | 프론트가 요청마다 생성한 식별값. 응답에서 그대로 반환 |
| `message` | string | 브리핑 생성 요청 문장 |
| `x_client_user` | string | 직원 ID |
| `case_id` | string | 선택한 케이스 ID |
| `customer_id` | string | 고객 스냅샷의 고객 ID |
| `as_of_date` | string | 고객 스냅샷 기준일, `YYYY-MM-DD`. 서버의 오늘 날짜로 바꾸지 않음 |
| `customer_data` | object | 프론트가 보유한 해당 고객의 시연용 스냅샷 |

`customer_data`에는 `briefingMeta`, `customer`, `irpAccount`, `holdings`, `signals`, 제공된 경우 `에이전트맥락데이터`가 포함됩니다. 서버는 이 스냅샷으로 브리핑을 생성합니다. **상단 정보를 응답으로 다시 보내는 것이 아니라, Agent가 판단에 사용할 입력으로 보내는 것**입니다. 외부 업무·상품 지식의 조회는 이후 Agent 구현 범위입니다.

## 4. Agent 논리 응답 — 정상

프론트가 최종적으로 파싱할 객체는 다음과 같습니다. 아래 예시는 `request_id` 등 네 연결 값이 요청과 일치할 때 유효합니다.

```json
{
  "event": "answer",
  "data": {
    "schema_version": "customer-briefing-api.v1",
    "answer_type": "briefing",
    "request_id": "example-request-001",
    "case_id": "DEMO-01",
    "customer_id": "10274-38562",
    "as_of_date": "2026-09-04",
    "briefing": {
      "s1": {
        "items": [{
          "text": "등록된 투자성향은 위험중립형입니다.",
          "dataRefs": ["/customer/investmentProfile"]
        }]
      },
      "s2": { "lead": "사용계획과 운용 의향을 확인합니다." },
      "s3": { "lead": "확인된 사용시점에 맞춰 운용방향을 비교합니다." }
    }
  }
}
```

- `event`, `schema_version`, `answer_type`, 요청 연결 정보는 서버 코드가 고정·복사합니다. LLM이 임의로 만들게 하지 않습니다.
- `request_id`, `case_id`, `customer_id`, `as_of_date`는 **요청과 모두 일치**해야 합니다. 다르면 이전 브리핑을 유지하고 `IDENTITY` 오류를 표시합니다.
- 문장·항목·추천상품은 `data.briefing`에만 넣습니다. HTML/CSS/클릭 핸들러/고객정보 객체/계좌 객체는 허용하지 않습니다.
- 응답의 필드 구조는 JSON Schema로 서버에서도 검사하는 것을 권장합니다. 프론트는 구조 및 근거 ID·고객 필드 경로를 다시 검사합니다.
- 전체 상품 예시는 [response.example.json](response.example.json)입니다. 고객별 `active/briefing-json/*.json` 내용을 `data.briefing`에 넣고 요청 식별 필드는 그대로 반환합니다.

### 4.1 S1~S5 필드

모든 경로는 `data.briefing` 기준입니다. `?`는 문서상의 선택 표시이며 실제 JSON 키에는 넣지 않습니다.

| 구역 | 필드 | 규칙 / 화면 |
|---|---|---|
| S1 | `s1.items[]` | 필수, 1개 이상. 각 항목의 `text` 필수. 순번은 프론트가 표시 |
| S1 근거 | `items[].dataRefs?`, `items[].sourceIds?` | 둘 중 최소 한 개의 유효한 참조가 필요 |
| S2 | `s2.lead` | 필수, 상담 목적 |
| S2 보조 | `why?`, `checks[]?`, `sourceIds[]?` | 이유/확인 질문. 비면 제목·박스까지 숨김 |
| S3 | `s3.lead` | 필수, 관리 방향 |
| S3 선택지 | `options[]?` | 각 항목 `id`, `title` 필수. `summary?`, `details[]?`, `products[]?`, `sourceIds[]?` 선택 |
| S3 공통 | `notes[]?` | 선택지 공통 주의 문구 |
| S4 | `s4?` | 선택 객체. `opening?`, `reactions[]?`, `notices[]?`, `sourceIds[]?` |
| S4 반응 | `reactions[].label`, `paragraphs[]` | 반응 항목 생성 시 모두 필수, 문단 1개 이상. 문단 수만큼 모두 표시 |
| S5 | `s5?` | 선택 객체. `tips[]?`, `actions[]?`, `sourceIds[]?` |
| S5 TIP | `tips[].title`, `body?`, `sourceIds[]?` | 제목 필수, 본문 없으면 제목만 표시 |
| S5 업무 | `actions[].title`, `screenCode?`, `description?` | 제목 필수, 화면번호는 `00-00-000`. 없으면 실행 버튼·코드칩 숨김 |
| 근거 | `sources[]?` | 각 항목 `id`, `title` 필수. `description?`, `url?` 선택. URL은 HTTPS만 허용 |
| 검토 | `reviewNotes[]?` | 자료 누락·충돌 등 내부 검토사항. 상담 후 기록 기능이 아님 |

S4·S5는 표시할 내용이 전혀 없으면 구분선과 섹션 제목도 숨깁니다. S1~S3는 핵심 내용이므로 생략하지 않습니다. 선택 문자열은 생략/null/빈 문자열/공백, 선택 배열은 생략/null/빈 배열이면 미표시로 처리합니다. 다만 배열 안에 빈 객체를 넣어 카드 자리를 채우면 오류입니다.

### 4.2 추천상품 구조

`s3.options[].products[]`의 각 상품:

| 필드 | 필수 여부 | 의미 |
|---|---|---|
| `name` | 필수 | 실제 후보 상품명 |
| `sourceIds` | 필수, 1개 이상 | 같은 응답 `sources[].id` 참조 |
| `productId` | 선택 | 상품 식별자. 같은 선택지 안에서 중복 금지 |
| `category`, `riskLevel` | 선택 | 상품군·자료상 위험등급 |
| `reason` | 선택 | 해당 고객에게 제안하는 이유 |
| `notes[]` | 선택 | 상품별 조건·주의 문구 |
| `metrics[]` | 선택 | 아래 지표 객체 배열 |

지표 객체는 `kind`(`rate`: 표시금리 / `return`: 수익률), 숫자 `valuePct`, 문자열 `period`, 문자열 `asOf`가 모두 필수입니다. `3.85`는 3.85%이며 `0`도 유효합니다. 기간·기준 없이 숫자만 보내지 않습니다. 적용기간을 표시하려면 `validFrom`/`validUntil`을 `YYYY-MM-DD` 한 쌍으로 보내며 시작일이 종료일보다 늦을 수 없습니다.

상품만 있고 `details`가 없어도 추천상품 펼치기가 표시됩니다. 상품과 상세가 모두 없으면 펼치기 버튼이 없습니다. ETF 조회 이력만 있고 상품이 특정되지 않았다면 상품명을 만들어 채우지 않습니다. 확인되지 않은 수익률은 `metrics`를 생략합니다.

### 4.3 근거 참조와 검증의 한계

`dataRefs`는 **요청의 `customer_data` 내부**를 기준으로 한 JSON Pointer입니다. 예: `/irpAccount/valuationAmountKrw`, `/customer/investmentProfile`. `/customer_data/...`로 시작하지 않습니다. `sourceIds`는 응답 `sources[].id`와 연결합니다.

프론트는 필드·출처의 존재, 중복 ID, 값의 형식을 검사하지만 문장 의미·제도 현행성·상품 적합성까지 판단하지는 않습니다. 정상 수신해도 자동 승인하지 않고 내용 검토 전 초안으로 표시합니다. 상단 정보는 브리핑 문장에서 역산하거나 덮어쓰지 않습니다.

## 5. 오류 응답

```json
{
  "event": "error",
  "request_id": "example-request-001",
  "message": "브리핑 생성에 실패했습니다."
}
```

한 요청에는 정상 `answer` 또는 `error` 하나만 반환합니다. 오류 메시지에는 인증정보·고객 원문·내부 traceback을 넣지 않습니다. 프론트는 서버의 원시 메시지를 화면에 그대로 출력하지 않고 고정 안내문으로 `AGENT` 오류를 표시합니다.

## 6. Agent → FabriX SSE 포장

4~5절의 논리 객체를 `logical_event`라고 할 때, Agent는 아래처럼 **JSON 문자열로 한 번 직렬화해 `content`에 넣습니다.** 다음 코드는 전송 형식 예시이며 Agent 생성 로직은 아닙니다.

```python
import json

agent_chunk = {
    "event": "CHUNK",
    "content": json.dumps(logical_event, ensure_ascii=False),
    "references": [],
    "recommend_queries": [],
    "actions": [],
}
frame = "data: " + json.dumps(agent_chunk, ensure_ascii=False) + "\n\n"
# Content-Type: text/event-stream으로 frame을 전송한 후 스트림 종료
```

FabriX를 거쳐 브라우저가 받는 포장은 다음과 같습니다. 바깥 키가 `event_status`로 바뀌는 점에 주의합니다.

```js
{
  event_status: 'CHUNK',
  status: 'SUCCESS',
  result_code: 'FR-200',
  content: JSON.stringify(logical_event),
  references: [],
  recommend_queries: [],
  actions: []
}
```

확인된 추가 포장인 `content = JSON.stringify({event:'CHUNK', content:JSON.stringify(logical_event), ...})`도 한 겹까지 처리합니다. 바깥 `actions`, `references`, `recommend_queries`는 이번 브리핑에서 사용하지 않습니다. S5의 `actions` 및 브리핑의 `sources`와 섞지 않습니다.

### 스트림 규칙

- **완성된 논리 JSON 하나**를 보내고 스트림을 종료합니다. 여러 CHUNK에 JSON 문자열 조각을 나누는 논리적 token delta 전송은 이번 v1에서 지원하지 않습니다.
- 네트워크 패킷이 한글 바이트·JSON·줄바꿈 중간에서 나뉘는 것은 정상적으로 처리합니다.
- 빈 CHUNK와 빈 줄, 완결된 SSE 주석, LF/CRLF, 여러 `data:` 줄, 선택적인 `[DONE]`을 처리합니다.
- 각 SSE 이벤트 끝에 빈 줄(`\n\n` 또는 `\r\n\r\n`)이 필요합니다. 불완전한 마지막 이벤트는 거절합니다.
- 빈 `START`/`END`/`DONE` 포장은 허용합니다. 기타 알려지지 않은 포장 형식은 규격 오류입니다.
- HTTP 성공 및 `text/event-stream`이어야 합니다. `status`가 있다면 `SUCCESS`여야 합니다.
- `truncated: true` 또는 `finish_reason: 'length'`는 잘린 응답으로 처리합니다.
- 최종 이벤트 수신 후 스트림이 정상 종료된 뒤에만 화면에 반영합니다. 후속 Gateway 오류나 중복 answer가 있으면 기존 정상 브리핑을 유지합니다.
- 기본 전체 제한 시간은 90초, 디코딩된 스트림 최대 길이는 4×1024×1024 JS 문자열 코드 단위입니다.

## 7. 상태·실패 처리

S1~S5에는 API 응답만 표시하며 반입본에 더미 브리핑 문장을 포함하지 않습니다. 정상 수신도 `내용 검토 전 초안`으로 표시합니다. 오류 시 같은 화면 세션에서 이전에 수신한 브리핑이 있으면 유지하고 이전 브리핑임을 함께 안내합니다.

진단 코드: `NOCONFIG`, `CONFIG`, `AUTH`, `HTTP`, `NETWORK`, `CONTENT_TYPE`, `STREAM`, `SSE`, `JSON`, `SCHEMA`, `VERSION`, `IDENTITY`, `AGENT`, `EMPTY`, `TRUNCATED`, `MULTIPLE`, `LIMIT`, `GATEWAY`, `TIMEOUT`, `ABORTED`.

요청 취소·다른 고객 선택·목록으로 복귀·화면 종료·설정 교체 시 진행 중인 fetch를 중단합니다. 이미 도착했더라도 무효화된 요청은 반영하지 않습니다. 재시도는 **다시 요청**으로 명시적으로 실행하며 자동 반복 호출하지 않습니다. 같은 화면 세션에서 이미 수신한 고객은 재선택해도 재요청하지 않습니다.

## 8. 응답 규격을 나중에 변경할 때

- 내부 생성 방식만 변경: 이 계약을 지키면 프론트 변경 없음.
- 바깥 포장/필드명 변경: `fabrix-briefing-contract.js`와 필요 시 `fabrix-transport.js`의 변환·검증 수정.
- S1~S5 필드 변경: `briefing-contract.js`의 공통 필드 정의와 해당 `pensionBriefingView.js` 구역 수정.
- JSON 스키마는 `additionalProperties:false`입니다. 임의의 새 필드는 무시하지 않고 거절합니다. 변경 시 스키마·프론트를 함께 배포하고 호환성 변경에는 계약 버전을 올립니다.
- 문장·상품 개수만 변경: 허용된 배열·선택 필드 범위 안에서는 HTML 수정 없음.

반입본과 응답 예시는 빌드 결과입니다. 고객 데이터와 브리핑 JSON은 직접 수정하는 원본이며 빌드가 덮어쓰지 않습니다.

```sh
node tools/briefing/build.js
# 파일코드 기본값 1288272. 다른 코드: node tools/briefing/build.js <파일코드>
node tools/briefing/check.js
```

## 9. 로컬 확인과 실제 응답 검증

`node tools/briefing/build.js --preview` 후 `http://127.0.0.1:8765`를 엽니다. 반입 세 파일을 표시하는 정적 미리보기이며 모의 API는 없습니다. 설정이 주입되지 않으므로 고객 선택 시 S1~S5 영역은 `NOCONFIG` 상태로 비어 있습니다. 로컬 FabriX 호환 서버가 있다면 콘솔에서 `window.PensionFabrix.configure({...})`(`http://127.0.0.1` endpoint 허용) 후 다른 고객을 선택해 확인할 수 있습니다. 실 API 호출은 승인된 사내 Origin에서 검증합니다.

사내에서 비밀값을 제거한 논리적 요청 객체와 Agent answer 객체를 준비하면 `node tools/briefing/check.js request.json response.json`으로 계약 일치를 검사할 수 있습니다. 입력은 FabriX envelope/HAR가 아니라 위 명세의 내부 요청과 최종 answer JSON입니다. 토큰·전체 헤더·실제 고객 데이터는 저장소에 넣지 않습니다.

기본 검사는 현재 JSON/반입본 일치, 31건 렌더링 매핑, 상단 고객 격리, 선택 필드, 요청 식별값, SSE parser, 그리고 반입본 수준의 자동 호출 경로(설정 주입 → 고객 선택 시 요청 → SSE answer 반영, 잘못된/누락 설정 시 미호출)를 확인합니다. `node tools/briefing/check.js --agent`는 Python 고정 응답/SSE와 프론트 규격의 일치도 검사합니다. FastAPI/Pydantic이 있으면 ASGI 경로도 검사하며, 없으면 명시적으로 SKIP합니다. 실제 인증·CORS·Gateway·Starroot/WebView·추천 내용의 적합성은 [사내 체크리스트](../../COMPANY_DEPLOY_CHECKLIST.md)에서 별도로 검증합니다.

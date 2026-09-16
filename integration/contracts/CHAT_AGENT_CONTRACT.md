# 실시간 상담(대화 Agent) — 프론트 호출 규격과 화면 매핑

우측 **실시간 상담** 패널이 호출하는 대화 Agent의 요청·응답과 화면 매핑입니다. 원천 규격은 대화 Agent 저장소의 `client/README.md`이며, 이 문서는 프론트가 쓰는 부분과 실제 수신 샘플([chat.example.json](chat.example.json), 3턴)로 확인한 내용만 정리합니다. S1–S5 브리핑 API([AGENT_FRONTEND_CONTRACT.md](AGENT_FRONTEND_CONTRACT.md))와는 **별개 Connector·별개 토큰**입니다.

- 수정 원본: [fabrix-chat-transport.js](../../frontend/src/briefing/fabrix-chat-transport.js)(전송·이벤트 추출), [pensionChat.js](../../frontend/src/briefing/pensionChat.js)(세션·답변 파싱·패널 매핑)
- 패널은 31명 구조화 고객에서 켜집니다. 기존 데모 3명(ksy/lsm/pjh)은 종전 mock 상담을 유지합니다.

## 1. 설정

`window.__PENSION_FABRIX_CONFIG.chat`(또는 `onParam(params).fabrix.chat`)에 아래 값을 주입합니다. 저장소 HTML의 블록은 빈 값이며 배포본에서만 채웁니다.

| 키 | 내용 |
|---|---|
| `endpointUrl` | 대화 Agent Connector URL. `https://…/prod/kb0/<connector-id>/1`까지. 재배포 시 바뀔 수 있음 |
| `agentId` | Agent assetId. 문자열 허용(양의 정수도 허용) |
| `openapiToken`, `generativeAiClient` | 대화 Agent 전용 Secret. 브리핑 Agent와 다름 |

`xClientUser`는 최상위 값을 공유하며 **7자리 사번으로 시작**해야 합니다(`3902172` 또는 `3902172-…`). Agent가 여기서 사번을 읽어 쪽지의 보내는 사람을 정합니다. `chat` 값이 전부 비어 있으면 패널은 미설정 안내만 표시하고 호출하지 않습니다.

## 2. 요청

```http
POST {endpointUrl}/openapi/agent-chat/v1/agent-messages
Content-Type: application/json; charset=UTF-8
Accept: text/event-stream
x-openapi-token: Bearer <chat.openapiToken>
x-generative-ai-client: <chat.generativeAiClient>
```

```js
{ agentId: cfg.chat.agentId, contents: [JSON.stringify(inner)], llmConfig: {}, isStream: true }
// inner
{ message: '질문', x_client_user: '3902172', customer_id: '198734-1205842', session_id: '<uuid>' }
```

- `session_id`: 고객(케이스)마다 첫 질문 때 UUID를 만들고 같은 고객의 모든 턴에 같은 값을 보냅니다. 다른 고객은 다른 세션이며, 대화 기록은 화면이 살아 있는 동안 고객별로 유지되고 화면 종료 시 사라집니다.
- `customer_id`: 원칙은 선택한 고객의 `customer.customerId`입니다. **현재는 `pensionChat.js`의 `PINNED_CUSTOMER_ID`로 `198734-1205842`에 고정**되어 있습니다 — 대화 Agent의 고객 저장소에 아직 우리 31명 고객이 없어서, 실제 수신 샘플에서 우리 ID를 보내도 이 시연 고객으로 답했기 때문입니다. Agent 쪽 데이터가 정렬되면 상수를 빈 문자열로 바꿉니다. 패널 첫 안내문에 이 사실을 표시합니다.
- `message`는 1,000자에서 자르고, 잘못된 대리 문자는 U+FFFD로 치환합니다(게이트웨이가 `input_value`를 깨뜨려 500을 내는 경우 방지).
- `action`의 네/아니오, `clarify`의 선택지, `followups`의 문장은 모두 **다음 턴의 `message`**로 보냅니다. 별도 API가 없습니다.

## 3. 응답 이벤트와 화면

SSE `data:` 줄마다 게이트웨이 객체 하나, 그 `content` 문자열 안에 `type`을 가진 Agent 이벤트 JSON이 있습니다. 한 `content`에 이벤트가 연달아 붙어 올 수 있고(샘플에서는 `answer`+`sources`), Agent CHUNK 포장이 한 겹 더 있거나 게이트웨이 오류 문구 안에 CHUNK가 실릴 수 있어 모두 풀어 읽습니다. `status`가 `SUCCESS`가 아니면서 이벤트도 없을 때만 `GATEWAY` 오류입니다. 턴 전체 제한 시간은 180초입니다.

| type | 화면 |
|---|---|
| `progress` (여러 번) | 상태 말풍선에 **마지막 문구**를 표시. 실제로 5~9단계가 옴 |
| `answer.text` | 첫 문단은 굵은 lead. 이후 문단은 본문. `- `로 시작하는 줄 묶음은 목록(들여쓴 항목은 `· ` 접두), 큰따옴표로 감싼 문단은 **복사 버튼이 있는 화법**. 꼬리의 `── 참고한 자료` / `· <유형>` 줄은 본문에서 떼어 "참고한 자료" 배지로 표시 |
| `answer.intent` | 현재 값 목록이 확인되지 않아 배지에 쓰지 않음(항상 `AI 답변`) |
| `sources.items` role `근거` | "▸ 근거 N건": 같은 `doc`끼리 묶어 문서명·괄호 안 부서/일자·사용한 `title` 목록. `score`는 `관련도 n`, `url`은 HTTPS일 때만 링크 |
| `sources.items` role `주의` | "▸ 적용 중인 상담 원칙 N건" |
| `followups.items` | "이어서 물어보실 수 있어요" — 클릭하면 그 문장을 다음 턴으로 전송 |
| `action` | 마지막 답변 아래 **네 / 아니오** 버튼(`label` 또는 `prompt`를 질문으로). 쪽지(`title`,`text`,`to`)면 받는 사람·제목·본문 박스와 복사 버튼 |
| `clarify` | `question`과 `options[]` 버튼. 누른 값을 다음 턴으로 전송 |
| `error.text` | 회색 시스템 말풍선 "답변에 실패했습니다. …"(300자). 이전 답변은 유지 |
| `done` | 턴 종료. 입력 재개 |

요청 취소·다른 고객 선택·목록 복귀·화면 종료 시 진행 중인 턴을 중단하고 해당 대화에 "요청을 취소했습니다."를 남깁니다. 한 고객당 한 번에 하나의 턴만 진행합니다.

## 4. 확인

- `node tools/briefing/check.js`: 이벤트 추출(연속 JSON·CHUNK 포장·오류 문구), 설정 검증, 샘플 3턴 파싱(배지·목록·화법·근거 묶음), 반입본 수준 패널 동작(가짜 fetch가 샘플을 SSE로 재생 → 질문·응답·세션·오류·미설정).
- 사내 확인은 [체크리스트](../../COMPANY_DEPLOY_CHECKLIST.md) 5-2입니다.
- 실제 응답으로 확인하지 못한 것: `action`·`clarify`·`error`·`주의` role(문서 기준 구현), `intent` 값 목록. 실제 샘플이 오면 [chat.example.json](chat.example.json)에 턴을 추가하고 매핑을 맞춥니다.

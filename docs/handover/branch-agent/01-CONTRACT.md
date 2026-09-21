# 01 — 부점 Agent 요청·응답 계약

상태: **2026-09-21 계약 구현·로컬 교차 검증 완료**. 실제 HTTP Agent·LLM·화면 연결은02~04 작업. 읽기: 이 문서, 기존 `integration/contracts/AGENT_FRONTEND_CONTRACT.md` §3·6, `briefing-contract.js`·`fabrix-briefing-contract.js`, `fabrix-transport.js`. 기존 두 JS 계약은 S1~S5용이며 새 부점 계약으로 대체하지 않는다.

## 호출 경로와 공통 식별값

```text
대화창 → POST FabriX Connector → Agent POST /chat
      ← fetch/ReadableStream ← SSE CHUNK 안의 논리 JSON
```

런타임 설정: `params.fabrix.branch` 우선, 없으면 `window.__PENSION_FABRIX_CONFIG.branch`. 필드 `endpointUrl, agentId, openapiToken, generativeAiClient`; `xClientUser`는 최상위 설정에서 공유. `agentId`는 양의 정수 또는 비어 있지 않은 assetId 문자열. 기존 브리핑/상담의 토큰·Agent 설정으로 자동 대체하지 않는다.

```js
// POST {endpointUrl}/openapi/agent-chat/v1/agent-messages
// Content-Type: application/json; charset=UTF-8, Accept: text/event-stream
// x-openapi-token: Bearer <런타임 주입>, x-generative-ai-client: <런타임 주입>
{ agentId: cfg.agentId, contents: [JSON.stringify(inner)], llmConfig: {}, isStream: true }
// Agent outer body: {input_value: JSON.stringify(inner), message_hists: null}
```

`inner` 필드(모두 필수, nullable은 명시):

| 필드 | 타입·의미 |
|---|---|
| schema_version / task | 상수 `branch-agent-api.v1` / `branch_assistant` |
| request_id / conversation_id | 요청별 UUID / 화면 대화별 UUID. 새 대화는 conversation_id 교체 |
| base_revision | 0 이상의 정수. 마지막 적용된 상태 revision |
| dataset_id / data_version / rule_version | `branch-demo.v1` / 빌드 SHA-256 / `branch-rules.v1`. 서버 묶음과 모두 일치 |
| x_client_user | 런타임 직원 식별자. 고객 범위 권한을 이 문자열만으로 인증하지 않음 |
| message | 1~1,200자 질문. 행동 버튼이면 표시 label |
| action | 아래 Action 또는 null. 일반 질문은 null |
| state | 마지막 성공 State 또는 null. 첫 요청·기존 목록 복원 직후 null 허용 |

`base_revision`은 State와 별개의 브라우저 적용 번호다. null State의 재시작도 현재 번호를 보낸다. 응답은 `revision=base_revision+1`. 데이터 버전 변경 시 이전 State를 재사용하지 않고 새 manifest와 기본 화면으로 재진입한다.

## Action·State·검색식

Action은 엄격한 tagged union(해당 타입의 필드만 허용):

| type | 추가 필드 | 의미 |
|---|---|---|
| recommend / restore_recommendation / show_aggregate / reset | 없음 | 추천 / 최초 추천 / 직전 집계 대상 보기 / 기존 목록 |
| remove_condition | operation_id:string | 이력의 해당 filter만 제거 |
| brief | row_id:string | 특정 고객 간단 브리핑 |
| clarify | value:string | 현재 clarification.options의 허용 value 선택 |

응답 버튼은 `{label:string, action:Action}` 배열. 자연어 추천질문은 입력 문장으로 다시 전송한다. 버튼은 현재 마지막 답변에서만 활성화한다. action의 대상·조건·선택지가 State와 데이터에 유효한지 서버가 검사한다. 이전 답변의 버튼은 새 상태에 재사용하지 않는다.

State의 필수 필드:

| 필드 | 정의 |
|---|---|
| active | boolean. AI 목록이 확정되었는지; 초기/복원 false, 검색·추천·대상보기 true |
| selection | `Selection={base:'all'|'recommendation', operations:Operation[]}`. 현재 목록을 재계산하는 원본 범위·순서 있는 이력 |
| recommendation | null 또는 `{rule_version, as_of_date}`. 같은 고정 데이터/규칙으로 최초 추천 집합과 순서를 재현 |
| last_aggregate | null 또는 `{selection:Selection, metric_keys:string[]}`. 집계 당시 선택식을 복사해 보존; 현재 selection과 별개 |
| clarification | null 또는 `{kind, field, pending_message, candidate_row_ids, options:[{value,label}]}`. kind=`cash_field|cash_value|amount_basis|scope|customer|date_basis|condition`, field=`cash_amount|cash_pct|irp_amount|null`. 숫자 답변만 오는 다음 턴을 위해 선택된 필드 보존 |
| selected_row_id | string 또는 null. 이름/선택지로 확정한 간단 브리핑 대상 |

Operation은 `{id, type:'filter', predicate:Predicate}` / `{id,type:'sort',field,direction:'asc'|'desc'}` / `{id,type:'take',count}`. ID는 State 내 유일하며 삭제 후 남은 ID를 재번호화하지 않는다. filter→sort→take 순서를 강제로 재배치하지 않는다. 최대100개, 초과 시 기존 목록 복원 안내. State의 고객 배열/라벨을 사실로 신뢰하지 않고 Agent 데이터에서 다시 계산한다.

null State의 초기값은 active=false, selection={base:'all',operations:[]}, 나머지 nullable 필드는 null. recommendation이 null인데 base=recommendation이면 오류. take.count는1~48 정수. 각 객체는 허용 필드 외 입력을 거절한다. enum/state 구조를 구현하며 바꿀 경우 이 문서도 먼저 수정한다.

Predicate v1 허용형:

- `{op:'compare',field,cmp:'eq'|'gte'|'gt'|'lte'|'lt',value:number|string}`. 필드: `age,irp_amount,cash_amount,cash_pct,return_pct,name,grade`. name/grade는 eq만, 숫자는 유한값, 금액은 원 정수.
- `{op:'segment',value:string}`. 등록 뱃지 사전과 `retirement_uninstructed`만 허용. 뱃지와 실제 계좌 사실은 별개.
- `{op:'isa_between',start:'YYYY-MM-DD',end:'YYYY-MM-DD'}`. 기록된 같은 ISA 계좌 날짜를 검사.
- `{op:'and'|'or',args:Predicate[]}`, `{op:'not',arg:Predicate}`. 깊이≤4, 총 노드≤32. 미확인은 3값 논리로 유지한다.

Operation의 sort 필드는 숫자 필드 또는 `source_order`; null은 항상 뒤, 동률은 원래 순서. State에 대화 원문 전체·고객 원본·LLM 출력·직원 정보는 넣지 않는다. `pending_message`만 미해결 질문으로 최대1,200자 보관한다. 고객 후보·options는 최대48개이며 서버가 관련 범위와 다시 대조한다.

검증 context는 manifest의 `dataset_id,data_version,rule_version,as_of_date,row_ids,segment_labels`를 사용한다.03은 정확한 등록 뱃지와 지원하는 가족 라벨(예: ISA 만기)을 `segment_labels`에 생성한다. 미등록 segment·없는 action 대상·중복 operation ID는 거절한다. 브리핑 대상을 이름으로 지정한 경우 active=false여도 selected_row_id는 존재할 수 있다. 숫자는 JS 안전 범위 이내, 금액/나이는 음이 아닌 정수(나이≤150), 비중은0~100. 문자열 금액/boolean 숫자/깨진 Unicode는 거절한다.

## 정상 응답

논리 이벤트 `{event:'answer',data:Answer}`. Answer 필드:

| 필드 | 타입·규칙 |
|---|---|
| schema_version, request_id, conversation_id, base_revision, dataset_id, data_version, rule_version | 요청과 정확히 동일 |
| revision | base_revision+1 |
| intent | `search|overview|aggregate|recommend|brief|clarify|restore|unsupported` |
| status | `ok|empty|clarification_required|unsupported` |
| text | 사용자 답변 문자열. 검색 이름 나열 금지; 특정 고객 브리핑은 허용 |
| result | `{row_ids:string[],count:int,unknown_row_ids:string[],metrics:Metric[],reasons:Reason[]}` |
| ui | `{list_action:'keep'|'replace'|'reset',row_ids:string[]|null,sort:Sort|null}` |
| context_label / scope_note | 대화창 조건 요약 / 기준일·자료 범위 안내 문자열 |
| actions | 위 버튼 배열. 최대8개 |
| next_state | 검증된 State. 성공 턴에 전체 상태로 교체 |

Metric=`{key,value:number|null,unit:'count'|'KRW'|'pct',known_count:int,unknown_count:int}`. key는 `customer_count|irp_sum|cash_sum`으로 시작하고 확장은 계약 변경으로 관리. 표본 수의 합은 해당 집계 대상 수다. Reason=`{row_id,code:'UR01'|'UR02'|'UR03',text,as_of_date,evidence_refs:string[]}`; refs는 Agent 생성 데이터 내 해당 고객의 JSON Pointer로 검증한다.

`result.row_ids`는 질문 대상, `ui.row_ids`는 적용할 목록이다. 집계 대상3명이어도 keep이면 현재 목록은48명일 수 있다. count는 result.row_ids 길이; unknown은 해당 검색 조건을 판단 못 한 고객이며 matched와 겹치지 않는다. metric의 unknown은 금액 미확인으로 검색 unknown과 별개다.

keep은 row_ids/sort=null, DOM·순서·제목 불변. replace는 중복 없는 알려진 ID 배열(빈 배열도 유효), sort 필수(UI의 기본 추천순은 field=`recommendation_order`, 사용자 정렬은 해당 필드). reset은 row_ids/sort=null이며 기존 기본 필터·목록 복원. 검색 제목은 프론트가 `AI 검색 결과 · N명`으로 만든다. 응답으로 상단 KPI나 카드 내용을 덮어쓰지 않는다.

Sort는 `{field,direction:'asc'|'desc'}`. ui.sort는 표시 의미이며 프론트가 ID 배열을 다시 정렬하지 않는다. next_state.selection 재계산 결과와 replace IDs는 같아야 한다. status=empty는 검색 결과0건, clarification_required/unsupported는 keep만 허용. 사용자 문장과 버튼 라벨은 최대2,000/80자, 오류 문장은 최대300자. result/reason/ID 배열은 최대48개이며 known/unknown count는0~48이다.

### 요청·응답 예: 장기대기4명

`<build-sha256>`는 문서용 자리표시자이며 실행 샘플에서는 실제 manifest 값으로 치환한다.

```json
{"schema_version":"branch-agent-api.v1","task":"branch_assistant","request_id":"00000000-0000-4000-8000-000000000001","conversation_id":"00000000-0000-4000-8000-000000000002","base_revision":0,"dataset_id":"branch-demo.v1","data_version":"<build-sha256>","rule_version":"branch-rules.v1","x_client_user":"TEST_EMPLOYEE","message":"현금성 장기대기 고객 보여줘","action":null,"state":null}
```

```json
{
  "event":"answer",
  "data":{
    "schema_version":"branch-agent-api.v1","request_id":"00000000-0000-4000-8000-000000000001",
    "conversation_id":"00000000-0000-4000-8000-000000000002","base_revision":0,"revision":1,
    "dataset_id":"branch-demo.v1","data_version":"<build-sha256>","rule_version":"branch-rules.v1",
    "intent":"search","status":"ok","text":"현금성 장기대기 상태가 등록된 고객은 4명입니다.",
    "result":{"row_ids":["lsm","jmr","jmj","B08-01"],"count":4,"unknown_row_ids":[],"metrics":[],"reasons":[]},
    "ui":{"list_action":"replace","row_ids":["lsm","jmr","jmj","B08-01"],"sort":{"field":"source_order","direction":"asc"}},
    "context_label":"현금성 장기대기 · 4명","scope_note":"현재 시연 목록 기준 · 자료 기준일 혼재",
    "actions":[{"label":"장기대기 조건 해제","action":{"type":"remove_condition","operation_id":"op-1"}}],
    "next_state":{"active":true,"selection":{"base":"all","operations":[{"id":"op-1","type":"filter","predicate":{"op":"segment","value":"현금성 장기대기"}}]},"recommendation":null,"last_aggregate":null,"clarification":null,"selected_row_id":null}
  }
}
```

현황 H-01은 intent=overview, ui=keep, result.count=48, metrics에 IRP 5949240000(48/0), 현금346630000(31/17). 추천 R-01은 replace `[B04-23,B06-13,B01-03]`와 UR 근거. B-01은 keep과2~3문장. 명확화는 keep·status=clarification_required·next_state.clarification과 선택 버튼. 실행 가능한9개 요청·응답은 [contract.examples.json](../../../branch-agent/validation/contract.examples.json)에 있다. 샘플 manifest/hash는 **계약 검증 전용**이며03의 실제 데이터 manifest로 쓰지 않는다.

## 진행·오류·전송

- progress: `{event:'progress',data:{request_id,conversation_id,base_revision,phase:'interpreting'|'executing'|'composing',list_pending:boolean}}`. 계산 의도를 확정하기 전 false. 답변 뒤 progress 금지. 이 이벤트는 State나 목록을 변경하지 않는다.
- error: `{event:'error',data:{schema_version,request_id,conversation_id,base_revision,code,retryable:boolean,message}}`. code=`INVALID_REQUEST|VERSION|DATA_VERSION|STATE|ACTION|LLM_TIMEOUT|LLM_OUTPUT|INTERNAL`. 식별 불가능한 입력만 request_id=`invalid-request`, conversation_id=null, base_revision=null. 정상 요청과 일치하지 않는 error는 화면 상태에 적용하지 않는다.
- Agent SSE는 `data: {"event":"CHUNK","content":"<논리 JSON 문자열>","references":[],"recommend_queries":[],"actions":[]}\n\n`. FabriX 수신은 기존 계약의 `event_status:'CHUNK'` 포장 및 알려진 추가1겹을 허용한다.
- progress 0개 이상 → answer 또는 error **정확히1개** → 정상 EOF. 최종 JSON을 여러 CHUNK의 문자열 조각으로 나누지 않는다. 네트워크 바이트 분할은 허용. 후속 Gateway 오류·중복 최종·불완전 EOF면 전체 미적용.
- 실제 상담 샘플에서 관찰된 게이트웨이 병합에 대비해 **완성된 논리 JSON 객체의 연속**은 허용한다. 최대64이벤트, CHUNK 추가 포장은1겹만. 오류 본문에서 JSON을 추출해 성공으로 복구하거나 plain text로 우회하지 않는다.
- 기본90초/4Mi JS문자 제한은02 transport가 시행한다. 초기 해석 진행은 즉시 보낸다. 원시 응답·Secret·직원/고객 식별정보 로그 금지. HTML/URL/실행 명령 필드는 계약 오류이며 text는 textContent로 표시한다.

사내 근거: [FABRIX_GUIDE](../../../integration/fabrix/FABRIX_GUIDE.md) §4~9, [검증 참고 코드](../../../integration/fabrix/fabrixClient.js), [플랫폼 원본](../../platform/references/KB_GenAI_ProAgent_SourceOfTruth_v2.md) §1·3·6·10·12·14·37·38. 참고 코드의 plain text fallback/파싱 오류 무시는 새 계약에 복사하지 않는다. 별도 상담의 `type:answer/sources/done` 계약과 부점 `event:answer/progress/error`를 섞지 않는다. 과거 WAS 호출 성공은 새 부점 Agent E2E 성공을 뜻하지 않는다.

## 구현 산출물·완료

`branch-agent/deploy/branch_models.py`가 **새 계약의 스키마 원본**이다(Pydantic v2, strict, extra=forbid). `branch-agent/validation/export_schema.py`가 `integration/contracts/branch-agent.schema.json`을 생성하고, build가 `PensionBranchAgentSchema`로 번들에 넣는다. 기존 S1~S5의 JS 원본 방식은 유지한다. 승인 없는 commit은 하지 않는다.

외부 validator/CDN 없이 제한된 JSON Schema 검증기+의미 검사를 구현했다. 새 schema keyword를 지원하지 않으면 조용히 무시하지 않고 실패한다. Unicode code point 길이, JSON 정수1/1.0 동일 의미를 양쪽에서 맞춘다. export 재실행 결과가 저장된 schema와 다르면 검사 실패. 기존 `checkShape`를 범용 검증기로 간주하지 않는다.

| 후속 작업용 API | 역할 |
|---|---|
| Python `validate_request(raw, manifest)` / `parse_request(outer, manifest)` | 구조·버전·상태·행동 검증. 정상화 dict 반환, 실패는 값 없는 ContractError.code |
| Python `validate_event(event, request, manifest, records_by_id=None)` | 요청 연결·결과/metrics/UI/State 일관성. records를 주면 evidence pointer 존재도 검사 |
| Python `sse_frame(event)` | 스키마 검사 후 사내 CHUNK/SSE 생성. 서비스는 먼저 validate_event 호출 |
| JS `PensionBranchAgentContract.request(fields, manifest)` | 기본 고정 필드를 채운 요청 생성·검증 |
| JS `validateRequest` / `validateEvent` | Python과 같은 경계 검사. 실패는 Error.code; 원문 값 없는 오류 |
| JS `createTurn(request, manifest)` | accept(envelope)→progress 배열, finish()→최종 event, cancel(). 최종은 clean EOF 뒤에만 꺼냄 |

`createTurn`은 fetch/timeout/화면 적용을 하지 않는다.02는 기존 SSE parser의 finish가 통과하고 네트워크가 정상 종료됐을 때만 turn.finish를 호출한다. error도 유효한 최종 이벤트일 수 있지만 State/목록은 반영하지 않는다. UI keep 비교는 selection·active·recommendation 보존을 검사한다. **조건식 재실행·합계의 실제 정답·근거 사실 판단은04/05의 책임**으로, 계약 검사만으로 증명하지 않는다.

검증: `node branch-agent/validation/check_contract.js`. Python은 `BRANCH_PYTHON` → validation/.venv/bin/python → python3 순. 프론트만 작업하면 `--js-only` 가능하나 Python 검사 SKIP을 표시한다. 원본 모델 변경 후 `python export_schema.py`, freshness는 `--check`.125개 공통 사례+outer4개, Python SSE→JS 파싱, Starroot Function 방식 번들 로딩을 확인했다.

| 인계 | 값 |
|---|---|
| 상태 |01 완료.02와03 시작 가능,04는03 데이터 완료 후 |
| 변경 파일 | deploy 모델/requirements/계약용 Docker stage, schema, JS 검증기, build 등록, validation 샘플/export/검사 |
| 검사 환경 | 로컬 Python3.13/Pydantic2.13.4, Node22. Python3.10 문법·Docker COPY 정적 확인 |
| 사내 제한 | 로컬 Nexus 설치 실패. 승인받아 격리 venv에 공개 PyPI 패키지로 교차 검증. 배포 Docker는 계속 사내 Nexus. 실제 Python3.10 이미지 빌드/HTTP/LLM/사내 E2E는 미검증 |

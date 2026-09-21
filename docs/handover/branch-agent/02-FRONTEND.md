# 02 — 응답으로 기존 화면 조작

상태: **2026-09-21 구현·로컬 검증 완료. 03 실제 manifest를 포함한 제품 번들로 remote 브라우저 재검사 PASS**. 선행:01 계약·샘플. 샘플/가짜 SSE는 `branch-agent/validation/`에 두며 deploy에 반입하지 않는다. 읽기:01, `branch-search-session.js`, `branch-search-adapter.js`, `branch-search-widget.js`, `fabrix-transport.js`, Starroot 가이드 §5·6·9·13-1. 고객 원본 전체를 읽을 필요 없음.

## 구현 범위

- 신규 `branch-agent-transport.js`: 기존 SSE parser·포장 해제 규칙 재사용, progress 다건+최종1건 처리. 기존 `fabrix-transport.call`은 progress를 거절하므로 그대로 호출하지 않는다. 기존 S1~S5/상담 전송 동작은 변경하지 않는다.
- 구현된 `branch-agent-contract.js`의 request/validateEvent/createTurn을 재사용한다.01의 schema·검증 로직을 별도 구현하지 않는다. 문자열 agentId 허용은 부점 transport 안에서 처리한다.
- `branch-search-session.js`: remote provider 경로와 마지막 성공 State/revision, AbortController, 적용 ticket. 기존 local engine은 명시적 데모/회귀검사 모드로 보존한다.
- `branch-search-adapter.js`: 결과 ID→원래 row 매핑, keep일 때 렌더 생략. `branch-search-widget.js`: 답변·조건 요약·명확화/후속 버튼을 대화창에 표시.
- `build.js`: 계약 모듈·공유 schema는 이미 등록됐다.02는 새 transport 모듈만 등록하고,03은 실제 data manifest를 포함한다. 두 세션이 동시에 편집하지 않도록 등록 구간 변경을 순차 반영한다. Node/추가 JSON URL/CDN 없이 반입 HTML/JS/CSS3개 유지.

03 완료 전에는 validation 샘플 manifest로 remote 통합 검사를 진행할 수 있다. 샘플 manifest를 제품 번들에 넣거나 실제 데이터 버전으로 사용하지 않는다. 실제 manifest가 없으면 호출하지 않으며03 완료 후 같은 생성물을 연결해 재검사한다.

메인 HTML·카드 템플릿·상단 문구·KPI·상세 브리핑 구조는 변경 금지. 필요한 초기화 연결은 기존 adapter.mount에서 수행한다. 별도 대시보드/카드 버튼을 만들지 않는다.

로컬 실제 모델 검증도 remote 경로를 사용한다.04의 validation 브리지가 FabriX와 같은 요청/응답 포장을 제공하므로 프론트에 Google SDK·키·별도 Google 전송기를 추가하지 않는다.02는 가짜 SSE로 먼저 완료하고04 이후 같은 UI/transport를 실제 Google Gemma와 연결한다.

## 실제 턴 처리

1. 부점 설정과 manifest 확인. 연결 모드 기본 `remote`; 설정이 없으면 대화창에 미설정 안내, 네트워크 호출 없음. 테스트는 `branchAgentMode:'local'`을 명시한다. 실패를 로컬 답변으로 몰래 대체하지 않는다.
2. 질문과 마지막 성공 State를 요청으로 만든다. 명확화·버튼도 같은 API. 사용자 입력을 SQL/DOM 동작으로 직접 해석하지 않는다.
3. pending은 대화창과 목록 헤더(도넛·진행 바)에 표시. remote에서는 전송 시 질문/버튼으로 목록 변경 여부를 추정해(guessListChange) 스켈레톤을 먼저 켜고, progress.executing의 list_pending과 최종 answer의 list_action이 확정한다(keep이면 행 원복). 6초 모의 지연은 remote 경로에서 제거한다.
4. 최종 응답은 임시 보관하고 정상 EOF까지 기다린다. 스키마·요청ID·대화ID·base_revision·버전·알려진 row ID·중복·count·next_state 불변식을 검사한다.
5. 최신 ticket과 현재 화면이 유효할 때만 State/revision·답변·목록을 함께 확정한다. 답변의 타이핑 효과는 확정 뒤 표현일 뿐 부분 JSON 반영이 아니다.
6. 취소·오류·시간초과·불완전 응답이면 이전 State/revision·목록을 보존하고 대화창에서 재시도를 제공한다. 재시도는 새 request_id, 같은 확정 State를 사용한다.

| 응답 | 대화창 | 메인 화면 |
|---|---|---|
| search/recommend + replace | 답변·조건/범위·후속 행동 | 해당 row_ids 순서로 기존 카드만 표시. 제목 `AI 검색 결과 · N명` |
| overview/aggregate + keep | 숫자·미확인·대상 보기 | DOM·순서·제목 유지 |
| brief + keep | 현재 상황+관리 방향2~3문장 | 상세 자동 진입 없음, 목록 유지 |
| clarify + keep | 질문·선택 버튼 | 목록 유지 |
| empty + replace([]) | 0명과 조건 해제 제안 | 0행. 별도 메인 복구 패널 추가 금지 |
| reset | 복원 답변 또는 기존 목록 버튼 처리 | 원래 필터·48명 기본 목록 복원 |
| error / unsupported | 안전한 오류/범위 안내 | 이전 확정 목록 유지 |

통계 답변의 `result.row_ids`를 자동으로 목록에 적용하지 않는다. 버튼 show_aggregate 클릭→Agent 재요청→replace 수신이 적용 시점이다. 응답 ID 하나라도 프론트 manifest/기존 row에 없으면 일부만 표시하지 않고 전체를 거절한다.

## 수명·멀티턴 연결

- 새 대화: 진행 요청 중단, conversation_id 교체, revision=0, 메시지 제거. selection/recommendation/selected_row_id는 보존하고 last_aggregate/clarification은 제거한다. 기존 목록은 유지한다.
- 기존 목록 및 원래 전체/KPI/필터 버튼: 진행 요청 중단, State=null, revision 증가, AI 적용 모드 해제 후 원래 버튼 동작. 다음 “그중”은 유효 AI 결과가 없음을 안내한다. 기본 필터로 축소된 행을 암묵적 AI 검색 범위로 삼지 않는다.
- 상세 이동: 요청 취소·위젯 숨김. 복귀하면 확정 AI 목록 유지. 상세 클릭만으로 브리핑의 selected_row_id를 새로 설정하지 않는다.
- onBeforeUnload: fetch·타이머·이벤트·body 위젯·CSS 폴백·Secret·State 제거. 재진입은 새 대화, 중복 위젯 금지.
- 답변 텍스트는 textContent, 행동은 계약의 allowlist에 매핑. HTML/JS/선택자 실행 금지.

## 완료·인계

01의 샘플을 가짜 fetch/SSE로 재생해 **실제 transport→validator→session→adapter**를 검사한다. 기존 browser 검사의 직접 `session.send` 로컬 경로만 통과해서 remote 완료라고 하지 않는다. 검색→통계 keep→대상 보기→브리핑→조건 제거→취소→상세 복귀, 버전 불일치·늦은 응답·재진입 포함. 카드 내부/상단 원형 비교 유지. `build.js`, `check.js`, 브라우저 검사 실행.

| 인계 | 값 |
|---|---|
| 상태 | **02 완료.** 03 실제 생성 manifest와 제품 번들 manifest 일치, 실제 transport→validator→session→adapter 가짜 SSE 브라우저 재검사 PASS |
| 공유 build.js 인계 | 02 transport 등록 완료 → 공유 03 문서에 인계 → 03의 생성기/manifest 등록·빌드 완료 확인 → 02 최종 build 및 재검사 순서로 진행. 기존 계약/schema/transport 및 03 변경 보존 |
| 변경 파일 | `frontend/src/briefing/branch-agent-transport.js`, `branch-search-session.js`, `branch-search-adapter.js`, `branch-search-widget.js`; build 모듈 등록; check.js/기존 conversation·browser 검사의 명시적 local 옵션; `branch-agent/validation/check_frontend.js`, `check_frontend_browser.js` |
| PASS | build/check, check --agent의 고정 응답 검사, 계약 125개 JS/Python + outer4개, check_data, transport/session 단위 검사, 실제 transport→createTurn→remote session→adapter 가짜 SSE 브라우저 검사 및 기존 local 화면 회귀 |
| SKIP / 미실행 | check --agent의 기존 HTTP 앱 기동은 기본 Python에 FastAPI/Pydantic 미설치로 SKIP. 신규 부점 HTTP Agent·실제 Gemma·사내 E2E 미실행 |
| 남은 연결 | 03 연결 완료. 04 실제 Agent/localhost 브리지, 05 Gemma, 06 실제 FabriX/Starroot E2E. 같은 remote transport에 런타임 branch 설정을 주입해 이어서 검증 |


## 02 구현·검증 상세

기본 모드는 remote이며, 로컬 회귀/데모만 `onParam({branchAgentMode:'local'})`로 선택한다. 설정은 `params.fabrix.branch` 우선, 없을 때 `window.__PENSION_FABRIX_CONFIG.branch`; 직원 식별자는 최상위 `xClientUser`를 공유한다. 다른 Agent 설정을 대체 사용하지 않는다. manifest는 **`window.PensionBranchDataManifest`**를 읽으며 검증 샘플/hash는 build에 넣지 않았다.

`endpointUrl`에 FabriX 또는 localhost 브리지의 base URL을 주입하면 같은 transport가 `/openapi/agent-chat/v1/agent-messages`에 POST한다. 양의 정수/문자열 agentId, 전용 헤더, JSON 문자열 contents를 사용한다. Google SDK/키·추가 JSON URL은 없다. 공유 SSE parser와 `createTurn`을 재사용하며 90초·4Mi JS문자·정상 EOF 경계를 유지한다.

원래 목록 객체/카드 렌더러를 재사용한다. keep은 목록 렌더를 호출하지 않고, replace는 응답 ID 순서 그대로 적용한다. 기존 전체/KPI/필터는 요청 취소·State=null·revision 증가 후 원래 동작을 실행한다. 새 대화는 목록/selection/recommendation/selected_row_id를 보존하고 대화ID/revision/집계·명확화 참조를 초기화한다. 취소·실패·불완전 EOF는 마지막 성공 State/revision/목록을 보존한다. 오류·취소 메시지의 재시도는 새 request_id를 생성한다. 답변/조건/범위/행동 버튼은 대화창 안에만 표시한다.

실행 명령(저장소 루트):

```sh
node tools/briefing/build.js
node tools/briefing/check.js
node tools/briefing/check.js --agent
node branch-agent/validation/check_contract.js
node branch-agent/validation/check_data.js
node branch-agent/validation/check_frontend.js
# localhost 정적 preview(:8765), 테스트 Chrome CDP(:9229)가 실행 중일 때
/opt/homebrew/opt/node@22/bin/node tools/briefing/check-briefing-browser.js
```

브라우저 검사는 `validation/check_frontend_browser.js`를 호출하며 실제 transport→validator→session→adapter를 통과한다. 검증 파일만 샘플을 읽고, 실제 manifest 파일이 있으면 그것을 사용한다. 가짜 fetch는 POST 포장·byte 분할/추가 CHUNK·progress/EOF를 검사한다. 검색→통계 keep→대상 보기→추천→브리핑→명확화→조건 해제, empty/reset, 오류/재시도/늦은 응답, 새 대화/원래 필터/상세 복귀/재진입을 검사하고 원래 상단·카드 markup도 대조한다. 구조·화면 검증이며 Agent 계산 정답이나 실제 LLM 답변 내용 검증이 아니다.

첫 검사에서 기본 `/usr/local/bin/node`는 v18이라 CDP WebSocket 실행에 실패했고, 설치된 Node22로 재실행해 PASS했다. 03 인계 후 실제 manifest가 포함된 bundle로 모든 검사를 재실행해 PASS했다. 중간 인계 구간에서의 `Rebuild required`는 03 등록 후 최종 build로 해소했다.


최종 데이터 버전은 `2faa49449acd295992aba6ca7d57aebc1ba0cb7bef3a6a363a281fc52fc9afc4`다. `check_data.js`가 Agent JSON/manifest 파일/제품 JS manifest 일치를 확인하고, 브라우저 검사도 제품이 로드한 manifest와 같은 파일을 대조한다. 계약 샘플 manifest의 hash가 제품 JS에 있으면 검사 실패다. 응답 대기 중 기존 행이 사라지거나 manifest가 바뀌면 State/revision/목록 전체를 보존하고 실패 처리하며, 새 manifest로 재진입하기 전 이전 State를 다시 전송하지 않는다.

메인 HTML·기존 메인 CSS·카드/상세 템플릿·기존 `agent/` 파일·01 계약은 02에서 수정하지 않았다. 생성된 반입본은 build로만 갱신했다. commit/push/사내 배포는 하지 않았다.

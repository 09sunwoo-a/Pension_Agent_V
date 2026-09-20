# 04 — Agent 계산·LLM·멀티턴 구현

상태: **2026-09-21 구현 완료.03 실제 데이터·02 remote 인계를 재확인하고 공통 서비스·실제 HTTP·Google 호출기·로컬 브리지를 구현했다. Google/UI 최종 검사 결과는05에 별도 기록한다.** 선행:01 계약,03 데이터. 읽기: 두 문서, 기능 기준 UR/S/H/R/B/X, `agent/main.py`·`briefing.py`·`llm_client.py`, `docs/platform/02-AGENT_DEVELOPMENT.md` 관련 절, 현 `branch-search-conversation.js`의 resolve/execute. 전체 고객 자료는 검증 시만 읽는다.

## Python 구성

신규 배포 원본은 **`branch-agent/deploy/`** 아래다. 아래 파일과 `main.py`, `llm_client.py`, Dockerfile, requirements를 이곳에 두고 사내 반입 시 폴더 내용이 배포 repository root가 된다. 테스트/fixture/export/로컬 실행 도구는 형제 `branch-agent/validation/`에 둔다. 기존 `agent/`는 읽기 참고만 한다.

| 파일 | 책임 |
|---|---|
| branch_models.py |01 외부 계약·State 구현 완료. 재사용하고 내부 Plan은 외부 schema와 분리하여 추가 |
| branch_data.py |03 생성물 로드, ID index·버전·범위·근거 경로 검증 |
| branch_query.py | 3값 조건 평가, 순서 있는 filter/sort/take, 집계·기간·미확인 |
| branch_service.py | 요청 검증→해석→상태 전이→추천/브리핑→응답 확정 |
| branch_language.py | 질문 해석 후보·문장 프롬프트, llm_client.call 호출, 검증/대체 문장 |

신규 `main.py`에는 부점 `/chat` 검증·호출과 SSE를 구현한다. `branch-agent-api.v1/branch_assistant`만 허용하며 다른 버전/task는 오류. `/health`는 mode=`branch_assistant`, 데이터/규칙버전·적재 여부·설정 모델 이름만 반환하고 Secret·고객·endpoint는 노출하지 않는다. 기존 `agent/main.py`의 S1~S5는 수정 없이 별도 Agent로 유지한다. 새 모듈은 평면 import, 신규 Dockerfile에 개별 COPY.

모델은 **`gemma-4-31b-it`**. 기존 `agent/llm_client.py`의 검증된 call 인터페이스·사내 인증/endpoint 분기를 새 deploy로 가져오되 이전 deployment 기본값을 무심코 쓰지 않는다. 검증용도 같은 deploy 모듈을 import한다. 모델을 작은 모델/가짜 답변으로 바꾼 실행은 실제 모델 검증으로 기록하지 않는다.

01의 계약용 Dockerfile에04 HTTP 진입점·CMD·패키지·모든 Python 파일의 개별 COPY를 완성했다.03의 데이터 COPY를 보존하며 Nexus 정책을 따른다. 실제 사내 이미지 빌드·기동 여부는 로컬 문법/계약 PASS와 따로 기록한다.

## 로컬 실제 모델·프론트 연결

사용자 확정(2026-09-21): **Agent 로직 구현 후 Google AI Studio의 실제 `gemma-4-31b-it`으로 로컬 프론트까지 연결해 검증하고, 그다음 사내 반입을 진행한다.** 모델은 Google 호스팅 API에서 실행하며 로컬 GPU 구동은 요구하지 않는다.

```text
로컬: 기존 프론트 → localhost 검증 브리지 → 공통 Agent 서비스 → Google AI Studio Gemma
사내: 기존 프론트 → FabriX Connector → 동일 Agent 서비스 → 사내 Gemma endpoint
```

- 업무 로직·데이터·프롬프트·계약·State 처리는 deploy의 동일 모듈을 import한다. app/service factory에 `llm_call` 의존성을 주입하고 기본값은 기존 사내 `llm_client.call`로 둔다. 로컬 Google 호출기는 같은 시그니처로 validation에 구현한다. 전역 monkey patch나 업무 로직 복제는 하지 않는다.
- Google 호출기와 `local_server.py`, 프론트 초기화 하네스는 validation 소유다. 로컬 프론트도02의 remote transport를 사용한다. 기존 `branchAgentMode:'local'`은 JS 규칙 엔진이므로 실제 모델 검증에 사용하지 않는다.
- 브리지는 127.0.0.1에 바인딩하고 빌드된 프론트와 테스트용 Starroot 진입 하네스를 같은 origin으로 제공한다. 하네스에서 branch endpoint·테스트 식별값/비밀 아닌 헤더를 주입한다. 제품 메인 화면·S1~S5·상담 설정을 바꾸지 않는다.
- 브리지의 `/openapi/agent-chat/v1/agent-messages`는 `contents[0]`을 공통 Agent의 `input_value` 처리 경로로 전달하고, Agent CHUNK를 FabriX `event_status` 형식으로 포장한다. 오류·취소·EOF를 전달하고 response/State/숫자를 직접 생성하지 않는다. 실제 Gateway 검증은06에 남는다.
- Google 키는 로컬 Python 프로세스의 `GEMINI_API_KEY`로만 읽는다. 프론트 설정·응답·로그에 넣지 않는다. Google용 의존성은 validation에만 두고 deploy Docker/requirements에 추가하지 않는다. 사내 이미지는 validation 없이 import·기동되어야 한다.
- Google API의 인증·메시지/role 매핑·timeout·출력 토큰·최종 텍스트 추출만 호출기가 담당한다. 공통 프롬프트 의미는 유지하고 provider 전용 도구/JSON 강제 기능에 업무 로직을 의존시키지 않는다. 숨은 추론 파트를 답변으로 채택하지 않는다.
- 기본 검사는 stub, 실제 호출은 명시적 live 실행이다. 모델 접근·quota 오류는 보고하고 다른 모델/stub으로 자동 전환하지 않는다. 로직 완성 후05의 실제 모델 검사와 브라우저 연속 시연까지 수행하고 실제 실행 명령을 validation README에 기록한다.

API 지원 근거는 [06 모델·검증 환경](06-INTERNAL.md#모델·검증-환경). Google API 사용 가능성과 사내 배포 결과의 동일성은 별개이므로 제공처·모델·생성 설정을 검사 결과에 구분한다.

## 처리 단계

1. 요청·dataset·rule version·State·입력 크기를 검사한다. 프론트가 보낸 상태의 모든 ID/조건을 Agent 데이터에 대조하고 재계산한다.
2. Action과 명확화 응답을 우선 처리한다. 정확한 숫자/기간/명시 조건은 코드로 정규화한다. 지원 범위 밖 요청은 unsupported 또는 명확화로 반환한다.
3. 자유로운 질문은 기존 `llm_client.call(messages, system, max_tokens, x_client_user)`로 해석 후보를 얻는다. 입력은 현재 질문+검증된 조건/선택 상태+필드 사전.48명 전체 개인정보를 해석 프롬프트에 넣지 않는다.
4. 내부 Plan을 Pydantic으로 검증한다. Plan=`{intent,scope,edit,operations,metric_keys,target_name,remove_field,clarification_kind,detail}`. 모호하면 pending_message와 선택지를 만들며 실행하지 않는다. 금액 표현/통계 vs 검색/지시대상을 코드와 대조한다.
5. 확정된 Plan의 계산은 Python만 수행한다. 이 시점에 progress.executing의 list_pending을 보낸다. LLM이 만든 고객 ID/합계/위험순위를 계산 결과로 채택하지 않는다.
6. 코드가 Fact 묶음(값·단위·기준일·미확인·근거·관리 방향)을 만든다. 검색/통계의 숫자 문장은 템플릿으로 정확히 조립. 고객 브리핑은 Python이 사실 문장을 확정하고 상담 방향 한 문장만 LLM이 다듬는다. 최종 답변은2~3문장이다.
7. LLM 문장에 금지 문구·불필요 이름 나열·지원하지 않는 수치/날짜가 있으면 검증된 템플릿으로 대체한다. 이 검사는 모든 의미 오류를 증명하지 않으므로05의 내용 검토를 별도로 수행한다.
8. Python이 ID·metrics·ui·next_state를 조립하고 Pydantic/의미 검사 후 answer1개를 내보낸다. 원래 State를 in-place 변경하거나 서버 공용 세션에 저장하지 않는다.

내부 해석 후보 JSON은 제한된 업무 Plan일 뿐 프론트 응답이 아니다. LLM이 외부 계약·UI·ID·합계를 직접 작성하게 하지 않는다. 기존 플랫폼 문서 §7의 “문장 slot, JSON 금지”는 과거 fact 문장 생성 경로를 설명한 것으로, 문장 생성에는 유지하고 새 내부 해석 단계는 별도로 검증한다. JSON schema 강제/tool calling이 Gemma에서 된다고 가정하지 않고 텍스트 반환을 파싱한다.

해석 파싱 실패 시1회만 수정 요청, 재실패하면 LLM_OUTPUT 오류 또는 구체적 명확화. 사용자가 모호한 것을 재시도만으로 임의 확정하지 않는다. 문장 생성 실패는 이미 계산된 사실의 템플릿으로 대체 가능; 질문 의미를 파악 못 한 실패는 그럴듯한 로컬 검색으로 숨기지 않는다. 해석/문장 단계별 소요·성공/대체 코드만 기록한다.

현재 call은 동기 함수이므로 async endpoint의 이벤트 루프에서 직접 오래 실행하지 않는다. `asyncio.to_thread`로 계산/LLM 작업을 분리하고 유한한 timeout·동시 작업 수·종료 회수를 둔다. 프론트90초·서버85초 안에서 해석/선택적 재시도/문장을 각20초로 제한한다. SDK 자동 재시도는0회다. 취소는 이미 진행 중인 SDK 호출을 강제 종료한다고 가정하지 않는다. 필요 시 SDK의 timeout/retry 설정만 내부에서 보완하고 call 시그니처·인증 헤더·endpoint 체계는 유지한다.

## 추천·짧은 브리핑

- UR01: 실제 계약이전 신청+의사확인 대기. UR02: 완료된 퇴직급여 입금+미지시+재원과 현금 일치+현금100%. UR03: 같은 ISA 계좌의 확인일/만기일·30일 범위. 세부 기준은 기존 기능 문서가 원본이다.
- 데이터에서 평가한 합집합, 실제 고객 ID로 중복 제거. UR01→02→03 유형 순서, 동률 row_id 순으로 안정화.3명/이름을 실행 코드에 고정하지 않는다.
- 현재 기준일2026-09-14에 확인된 근거만 추천. 오래된17명 정보를 이유로 “관리 필요 없음”으로 단정하지 않는다.
- B는 현재 상황+관리 방향만. 상품 가입·이체·쪽지 발송·상담이력 저장·외부 MCP 업무 실행은 이번 범위에 없다. ISA 잔액과 IRP 잔액을 바꾸어 설명하지 않는다.

## 멀티턴 규칙

브라우저가 적용한 next_state가 다음 요청의 유일한 업무 상태다. `conversation_id`는 상관관계 식별값이며 서버 메모리 key가 아니다. `message_hists`나 모델 대화 기억에 목록 상태를 맡기지 않는다. 인스턴스 변경/재시작에도 같은 요청 State로 계산 가능하다. 범위는 서버 dataset으로 제한되며 클라이언트 State를 권한 증명으로 쓰지 않는다.

| 질문/행동 | 상태 전이 |
|---|---|
| 독립 검색 | selection.base=all, 새 operations. 최초 recommendation은 명시 reset 전까지 보존 |
| 추천 | recommendation 기준 저장, selection.base=recommendation, operations=[] |
| 그중/조건 추가 | 기존 operations 뒤에 추가. 현재 부분집합 밖 고객을 보충하지 않음 |
| 조건 제거 | 선택한 filter ID만 삭제하고 같은 base에서 전체 이력 재실행. 여러 후보면 명확화 |
| 최초 추천 복원 | base=recommendation, operations=[]; 추천 규칙/기준일 동일 |
| 통계 | selection 유지, last_aggregate만 스냅샷으로 갱신 |
| 집계 뒤 “그중” | 현재 목록과 집계 ID 집합이 다르면 scope 확인. 미선택 상태 keep |
| 집계 대상 보기 | last_aggregate.selection을 현재 selection으로 복사해 재계산 |
| 브리핑 | selection 유지, selected_row_id만 기록. 다음 목록에서 빠지면 null로 정리 |
| 기존 목록 | 초기 State, 추천/집계/명확화/선택 모두 해제. 자연어 reset은 Agent 응답으로, 원래 화면/채팅 버튼의 로컬 복원은02의 규칙으로 처리 |
| 새 대화 | 프론트에서 새 conversation_id·revision0, 목록/추천/선택 유지, 집계/명확화 제거 |

예: `all → idle → age50 → DO`는4→1→1명. age filter를 제거하면 `all → idle → DO`로2명. 추천→잔액정렬→take2→ISA는0명이며 take를 무시해 오민서를 보충하지 않는다. 필터 제거는 제거 시점 이후의 sort/take도 순서대로 다시 실행한다.

null State는 “확정된 AI 결과 없음”이다. 첫 “그중”은 전체48명으로 추측하지 않는다. 01에 정의한 **State.active**를 사용한다. 검색/추천/대상보기 후 true, 기본/복원 후 false. active=false에서는 후속 범위를 물어본다. 처음 통계만 본 뒤의 “그중”도 명확화 후 집계 대상으로 연결한다.

전체 상태는 브라우저가 조작 가능한 입력이다. 숫자/사실·추천 ID를 신뢰하지 않고 조건식을 재실행하며, 잘못된 State는 STATE 오류. 클라이언트 state 전달 방식 자체는 실제 인증/직원별 접근제어를 제공하지 않는다. 시연 dataset은 고정 더미이며 실데이터 전환 전 별도 권한 연결이 필요하다.

## 완료·인계

LLM stub으로36개 계산/상태 골든 및 두 독립 세션·동시 요청·서버 재생성 검사. Agent는 업무 부작용이 없으므로 취소된 worker가 끝나도 서버 세션이 진전하지 않아야 한다. 기존31건 S1~S5 검사를 함께 통과하고 실제 Gemma 검사는05에 별도 기록한다. 기존 회귀는 `build.js`, `check.js --agent`, 신규 배포 코드는 validation runner로 따로 검증한다. 두 Agent 각각의 HTTP 기동 PASS/SKIP을 구분한다.

| 인계 | 값 |
|---|---|
| 상태 | 공통 Agent·사내 호출기·Google 호출기·브리지 구현 완료. 외부 계약·기존 `agent/` 유지 |
| deploy 변경 | `branch_data.py`, `branch_query.py`, `branch_language.py`, `branch_service.py`, `llm_client.py`, `main.py`, `Dockerfile`, `requirements.txt`, `README.md`.01 모델과03 생성 데이터 재사용 |
| validation 변경 | `scenarios.json`, `check_service.py`, `check_http.py`, `google_client.py`, `local_server.py`, `run.js`, `run_live.py`, `check_live_ui.js`, `README.md` |
| 검사 | 실제 데이터 stub36/36 및 경계·상태·오류 회귀 PASS. 실제 TCP HTTP/SSE·취소/timeout PASS. validation 없는 평면 배포 파일 기동 PASS. build/check/check --agent·계약·데이터·프론트 전송 PASS. 실제 모델/UI의 별도 집계는05 |
| 사내 배포 준비 | `/custom` 평면 import·개별 COPY·uvicorn CMD·Nexus 명세 준비. 내부 호출은 기존 call·stage·인증 유지, deployment 별칭 명시 설정 필수. 사내 실행 승인/검증 완료를 뜻하지 않음 |
| 미검증 | 사내 Python3.10 이미지 빌드·Nexus 설치·사내 deployment 매핑·Connector·Starroot 실제 E2E. 로컬 Docker daemon도 가동되지 않아 이미지 빌드 미실행 |
| 사용 안내 | [로컬 시작/종료](../../../branch-agent/validation/README.md), [내일 사내 반입 안내](../../../BRANCH_AGENT_DEPLOY_TOMORROW.md) |

### 구현 확인 사항

- 선행 작업 확인 시점에는03 생성물이 없었으나 이후02·03 완료를 재확인했다. 실제48명 데이터와 manifest 해시 `2faa49449acd295992aba6ca7d57aebc1ba0cb7bef3a6a363a281fc52fc9afc4`로 구현했다. 대체 데이터로 완료 처리하지 않았다.
- 기존 `parse_request`·`validate_event`·`sse_frame`을 재사용한다. 모든 조건·추천·집계·선택은 Python이 다시 계산하고, 수치 후보는 질문의 원/만원/억원·비율 표현과 대조한다. 외부 schema는 바꾸지 않았다.
- filter/sort/take 순서, 조건 제거 후 재실행, 추천 복원, 통계의 keep, 명확화 후보/State 유효성, 새 대화·독립 세션을 검사했다. 작업별 결과 fixture를 런타임에서 import하지 않는다.
- Google에서 확인한 조건 제거 시 예전 operation 재출력, 현황/집계 구분, ISA 브리핑에 필터를 덧붙이는 문제를 공통 프롬프트·Plan 검증으로 보완했다. 해석 실패는 오류로, 문장 표현 실패만 사실 템플릿으로 대체하며 횟수를 기록한다.
- `asyncio.to_thread` worker가 실제 종료될 때까지 동시 실행 슬롯을 유지한다. timeout/abort 뒤 늦은 응답은 폐기하며 서버에 업무 세션을 저장하지 않는다.
- Google 호출은 서버 환경변수 `GEMINI_API_KEY`만 사용한다. standard-library REST 호출기는 validation에만 있고, 배포 파일에는 Google SDK/도구/키가 없다. 로그와 결과 파일에는 원문·Secret을 기록하지 않는다.
- 로컬 의존성은 사용자 요청에 따라 격리 venv에 공개 PyPI로 설치했다. 사내 requirements는 Nexus용으로 유지한다. Python3.10 문법과 직접 의존성의 Requires-Python 메타데이터는 확인했지만 실제 실행 interpreter는3.13이다.

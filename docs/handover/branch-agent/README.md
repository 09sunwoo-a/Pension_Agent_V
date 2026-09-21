# 부점 AI 실제 Agent 구현 — 세션별 작업 안내

2026-09-21 갱신. **01~04 계약·프론트·데이터·공통 Agent 구현 완료.05 stub36/36·실제 HTTP·Google108/108·로컬 UI19/19 PASS(상세05).06 사내 E2E는 미실행이다.** 목표는 현재 골든 흐름으로 사내 시연을 완료하는 것. 기존 메인 상단·카드 구조는 바꾸지 않는다.

## 현재 있는 것 / 새로 할 것

| 항목 | 현재 상태 |
|---|---|
| 기능 요구사항 | [기능·골든 기준](../BRANCH_AI_SEARCH_DESIGN.md)의 검색 S8·현황 H5·추천 R8·브리핑 B4·예외 X11, 총36개 ID |
| 실행 가능한 검사 | `tests/branch-search/conversation.test.js`의 현재 메인 목록(57명, 2026-09-21 이전 48명) 로컬 엔진 검사. `tests/branch-search/golden/`의8명24턴은 별도 과거 회귀용 |
| 부점 AI | 기본 remote transport가 응답 State·keep/replace/reset을 적용. 실제 manifest+remote Agent 경로 구현. Google localhost 브리지도 동일 transport 사용. 기존 JS 엔진은 명시적 `branchAgentMode:'local'` 회귀/데모 전용 |
| 기존 Agent | `agent/main.py`의 `/chat`: `customer-briefing-api.v1` 고정 S1~S5 반환. 부점 AI용 API가 아님 |
| 실제 Agent 출력 골든 | `validation/scenarios.json`의36개 고정 기대값 및 실제 서비스 stub36/36 PASS. 실제 Google/UI와 사내 검사는05에서 별도 집계 |
| 부점 요청·응답 계약 | Pydantic/공유 schema/JS 검증기·9개 정상/오류 샘플·125개 교차 검사 완료.36개 기능 골든과는 별개 |

## 이 설계에서 정한 것

- 부점 전용 `branch-agent-api.v1`을 추가하고 기존 S1~S5·실시간 상담 계약은 유지한다. 신규 배포 Agent의 `/chat`은 부점 계약만 받고 기존 `agent/`와 별도 배포한다.
- Agent가 해석·조회·추천·통계·짧은 브리핑을 담당한다. Python/Pydantic이 응답 구조와 숫자·ID·화면 동작을 확정하고, LLM은 해석 후보와 근거 기반 문장에 사용한다.
- **사용자 지정 모델:** `gemma-4-31b-it`. 새 `branch-agent/deploy/`는 사내 배포용, `branch-agent/validation/`은 구현 검증용. 기존 `agent/`는 참고용으로 유지한다. 키는 저장하지 않으며 실행 시 서버 환경변수로만 주입한다.
- 실행 시 계산 데이터는 Agent에 둔다. 프론트의 원래 카드 표시 데이터는 유지한다. 둘은 같은 빌드의 버전·ID 목록으로 연결한다. 매 턴48명 원본을 전송하지 않는다.
- 멀티턴은 **프론트가 마지막 성공 상태를 보관하고 요청에 전달하는 무상태 서버 방식**이다. 서버 메모리 세션·Redis·LangGraph 도입은 이번 시연에 필요하지 않다.
- 로직 구현 후 **Google AI Studio의 실제 Gemma로 로컬 프론트까지 연결해 검증**한다. 업무 로직/데이터/계약은 사내 배포본과 공유하고, validation의 Google 호출기·localhost 브리지만 교체한다.04가 연결 도구를 구현하고05가 실제 모델·화면을 검사한 다음06 사내 검증으로 진행한다.
- Agent는 HTML·DOM 선택자·실행 코드를 보내지 않는다. 프론트는 `keep/replace/reset`과 기존 행 ID만 적용한다. 새 설명·선택 버튼은 대화창에만 표시한다.

## 세션별 순서와 작업 범위

| 순서 | 작업 문서 | 산출물 / 선행 조건 |
|---|---|---|
| 1 완료 | [01 계약](01-CONTRACT.md) | Pydantic 모델·공유 스키마·JS 검증기·정상/오류 샘플. 다음 작업에서 필드 임의 변경 금지 |
| 2 완료 | [02 프론트](02-FRONTEND.md) | POST/SSE·마지막 성공 상태·취소/복구·기존 목록 적용. 실제 manifest와 가짜 SSE remote 브라우저 PASS |
| 3 완료 | [03 데이터](03-DATA.md) | 같은 메인 목록(현재 57명) 데이터 묶음·manifest·버전 및 제품 번들 일치 검증 PASS |
| 4 구현 완료 | [04 Agent·멀티턴](04-AGENT-STATE.md) | Python 계산·상태 전이·LLM·별도 `/chat`, validation의 Google 호출기·로컬 브리지. 1·3 필요 |
| 5 결과 참조 | [05 골든·검증](05-GOLDEN.md) |36개 기능 골든·Google 실제 Gemma·로컬 프론트 연계. 1 후 기대값 작성, 2·4 후 통합 |
| 6 | [06 사내 연결](06-INTERNAL.md) | Docker COPY·환경 설정·실제 FabriX 응답·Starroot E2E. 2~5 통과 후 |

세션 시작 요청 예: **“README와 docs/handover/branch-agent/README.md를 읽고 02-FRONTEND.md 범위만 구현해. 메인 UI는 유지해.”** 해당 작업 문서의 읽기 목록만 열고, 전체 원본/모든 문서를 매번 읽지 않는다.

각 세션은 담당 문서 끝의 인계 표에 상태·변경 파일·실행 검사·남은 문제를 짧게 갱신한다. 다른 세션이 사용하는 필드를 임의 변경하지 않는다. 계약 변경은1번 문서·모델·샘플·골든을 함께 갱신하고 후속 세션에 버전을 알린다. 공동 수정 파일(`build.js`, `check.js`, 신규 deploy의 `main.py`, Dockerfile)은 같은 시점에 두 세션이 편집하지 않는다.

## 완료 기준

계약/계산 골든 전부 통과 → 실제 Gemma 변형 질문 검증 → 사내 FabriX/Starroot에서 대표 연속 시연 완료. 구조 PASS와 답변 내용 검토를 구분한다. 실제 사내 E2E 전에는 “사내 호환 완료”라고 기록하지 않는다. 요청 없는 commit/push/tag/배포는 하지 않는다.

팀원 소스는 [06의 참고 평가](06-INTERNAL.md#참고-소스에서-취할-것)만 먼저 읽는다. 외부 저장소 전체를 복사하거나 기본 컨텍스트로 읽지 않는다.

## 다음 세션에 붙여넣을 프롬프트

아래는 작업 범위를 보존한 최초 프롬프트다.01~04의 구현 상태와05 결과를 먼저 확인하고 완료된 파일을 중복 구현하지 않는다.2026-09-21 사용자가 GitHub push를 추가 요청했으므로 이번 세션의 commit/push는 승인 범위에 포함된다. 실제 사내 배포는 수행하지 않는다.

02와03은 별도 세션에서 진행할 수 있다. 공유 파일 build.js의 편집·빌드는 순차 수행하고,04는03 완료 후 시작한다. 같은 작업 폴더에서는 다른 세션의 변경을 덮어쓰거나 되돌리지 않는다.

### 02 프론트 연결

```text
/Users/leesunwoo/Desktop/Pension_Agent_V에서 작업 02를 구현해.
먼저 README.md의 작업별 표, docs/handover/branch-agent/README.md,
01-CONTRACT.md와 02-FRONTEND.md를 읽고 해당 읽기 목록만 따라가.
완료된 계약 검증기·createTurn을 재사용하여 부점 FabriX transport,
마지막 성공 State/revision, 취소·오류 복구, keep/replace/reset 적용을 구현해.
수정 범위는 부점 AI 대화창·호출·검색 연결이다. 원래 메인 상단·카드·상세는 보존해.
Starroot lifecycle·Vanilla JS·fetch/ReadableStream·반입 3파일 조건을 지켜.
03 전에는 검증용 샘플로 transport→session→adapter를 테스트하고,
실제 manifest 미생성 시 호출을 차단해. 제품에 샘플 manifest를 넣지 마.
04의 localhost 브리지에도 같은 remote transport를 사용하도록 해.
브라우저에 Google SDK나 키를 추가하지 마.
build.js는 03 세션과 동시에 편집하지 말고 기존 등록 내용을 보존해.
build/check·계약 검사·가짜 SSE remote 브라우저 검사를 수행하고
02 문서에 변경 파일·PASS/SKIP·03 연결 후 남은 검사를 기록해.
계약 임의 변경, 기존 agent 수정, commit/push/사내 배포는 하지 마.
```

### 03 데이터 생성

```text
/Users/leesunwoo/Desktop/Pension_Agent_V에서 작업 03을 구현해.
README.md의 작업별 표, docs/handover/branch-agent/README.md,
01-CONTRACT.md와 03-DATA.md부터 읽어.
기존 수정 원본과 현재 투영 함수에서 48명 branch_data.json 및
branch-data.manifest.json을 생성하고 같은 manifest를 프론트에 포함해.
row_id/case_id 구분, 31명 구조화·17명 표시 정보, null 미확인,
segment_labels, 안정적인 data_version 해시를 문서대로 구현해.
원본 고객 JSON·기존 agent·메인 UI는 보존하고 생성물은 직접 편집하지 마.
사내 /custom 배포용 Dockerfile에 데이터 COPY를 반영해.
build.js는 02와 동시에 편집하지 말고 계약/schema 등록을 보존해.
반복 빌드 해시·48개 ID·명세의 집계값을 검증하고
build/check/check --agent·계약 검사를 실행해.
03 문서에 산출물·버전·PASS/SKIP을 기록하고 04가 사용할 경로를 명시해.
계약 임의 변경, commit/push/사내 배포는 하지 마.
```

### 04 실제 Agent

```text
/Users/leesunwoo/Desktop/Pension_Agent_V에서 작업 04를 구현해.
README.md의 작업별 표, docs/handover/branch-agent/README.md,
01-CONTRACT.md·03-DATA.md·04-AGENT-STATE.md·05-GOLDEN.md의 관련 절부터 읽어.
03의 실제 데이터·manifest 생성과 검증 완료를 먼저 확인해.
미완료라면 그 의존성을 알리고 구현 계획까지만 진행해. 대체 데이터를 만들지 마.
신규 코드는 branch-agent/deploy/, 검증은 validation/에만 둬.
기존 agent/는 참고용이며 완료된 외부 계약·모델·검증기를 재사용해.
Python 계산·상태 전이·추천·짧은 브리핑·/health·/chat SSE를 구현하고
gemma-4-31b-it을 기존 llm_client.call 인터페이스로 연결해.
사내 호출기는 deploy에 유지하고 validation에 같은 인터페이스의
Google AI Studio 호출기와 localhost 프론트 연결 브리지를 구현해.
공통 업무 로직을 import하고 별도 검증용 Agent 로직은 복제하지 마.
사내 플랫폼 개발/배포/Nexus/보안 문서와 integration의 관련 절을 확인해.
/custom 평면 import·개별 COPY·실행 CMD·사내 패키지 설치를 완성해.
키는 런타임 주입하며 코드·문서·로그에 저장하지 마.
36개 기능 골든을 실제 서비스와 LLM stub으로 검증하고 HTTP 검사를 추가해.
로직 완성 후 Google 실제 Gemma와 로컬 프론트를 연결해05의 검사를 수행해.
키는 서버 GEMINI_API_KEY로만 읽고 실행 명령을 validation README에 남겨.
build/check/check --agent·계약 검사를 수행해. 실제 Gemma·사내 E2E는
환경이 있어 실행한 결과만 기록하고 미실행·SKIP을 PASS로 쓰지 마.
04/05 문서에 변경 파일·검사·배포 준비 상태와 미검증 항목을 기록해.
프론트·계약 임의 변경, commit/push/실제 사내 배포는 하지 마.
```

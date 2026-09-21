# 작업 기록·미완료

현재 상태는 README, 부점 AI 목표는 [구현 기획](BRANCH_AI_SEARCH_DESIGN.md), 코드 현황은 [AS-IS](BRANCH_AI_FRONTEND_AS_IS.md). 이전 UI 수치·폐기안·전체 실행 로그는 기본 컨텍스트에서 제외한다.

## 2026-09-20 — 부점 AI 기능 검토·문구·문서 정리

- 사용자 방향: 검색 결과 이름 나열 제거, ‘중점 관리 고객’은 추천, ‘부점 현황’은 통계. 개별 고객은 상황+관리 방향의 짧은 브리핑. 최종 목표 사내 시연 완료.
- 일반 검색의 ‘누구누구 찾았습니다’·Top N 괄호 이름·고객별 자동 상세줄 제거. 검색 집합·금액·미확인 처리 유지.
- 원본 기반 실행: 전체48명 통계, ISA 뱃지3명/30일 내1명, IRP 7천만원 이상35명 확인. ‘오늘 부점 현황’, ‘몇명이냐’, ‘운용금액’, 통합 추천의 정확 문장은 아직 미지원.
- 구현 기획/AS-IS의 중복 설명·전체 질문 실행 로그·폐기된 시연안·장기 확장 표를 축약. 기능·골든 ID·근거·현재 제한·수정 위치는 유지.
- 이 문구·문서 정리 다음 작업에서 프론트 골든 구현을 진행했다(아래 기록). 실제 Agent·사내 E2E는 남아 있다.

## 2026-09-20 — 프론트 골든 시연 구현

- 검색/현황/추천 분리, 데이터 근거 추천3명, 짧은 브리핑, 조건 이력·Top N·복원·명확화·0명 복구 연결. 통계는 목록 유지, 대상 보기로 적용.
- 카드 브리핑·조건 Chip·의도별 로딩, 상단 현재 통계 반영. 이름 나열 없음. 원본 고객·Python Agent 수정 없음.
- 빌드/기존 검사+신규 대화 검증, 로컬 Chrome shell 재현·클릭·상세 복귀·취소·재진입 확인. 실제 부점 Agent/사내 E2E는 다음 단계.

## 2026-09-20 — 메인 화면 변경 롤백

- 사용자 요청으로 직전 추가한 카드 브리핑·추천 근거·목록 조건 버튼·상단 문구 변경을 되돌림. 메인 HTML/JS는 변경 전과 동일. 부점 AI 대화·검색 로직과 기존 조회 효과 유지.
- 브리핑/조건 제거/0명 복구는 대화창에서만 제공. 이후 메인 UI를 임의 확장하지 않는 범위를 README·골든 기준에 반영.
- 로컬 Starroot 재현 검사에 원래 카드/상단 보존·Function 로더·CSS 폴백·스크롤·정리 검증 추가. 실제 사내 WAS/WebView E2E는 미검증.

## 2026-09-21 — 부점 Agent 작업01 계약 구현

- `integration/`의 FabriX 계약/실제 샘플과 플랫폼 원본 reference의 관련 절을 확인했다. POST 스트림·CHUNK 포장·평면 import·Nexus·개별 COPY 조건을 새 계약과 후속 작업에 반영했다.
- 신규 `branch-agent/deploy/branch_models.py`를 schema 원본으로 만들고 공유 JSON schema·JS 검증기·9개 정상/오류 샘플·검사 도구를 구현했다. 기존 S1~S5 계약·`agent/`·메인 HTML/JS/CSS 원본은 변경하지 않았다.
- 요청 식별값·버전·State·UI keep/replace/reset·숫자/ID 관계를 교차 검증한다. 완성된 answer도 정상 EOF까지 보류하고 오류·중복 최종·불완전 응답·취소는 거절한다. 계산/문장 의미의 정답은 아직 후속 작업이다.
- PASS: build, check, check --agent의 고정 lookup/SSE,125개 Python/JS 공통+outer4개, schema 최신성, Python3.10 문법/Docker 정적 검사, 로컬 Chrome의 원래 카드/상단·대화·취소·Starroot 수명 검사.
- SKIP: 기존 Agent HTTP 기동(기본 Python에 FastAPI/Pydantic 없음). 계약 검사만 격리 Python3.13/Pydantic2.13.4로 수행했다. 로컬 Nexus 설치 실패 후 승인된 공개 PyPI로 검증했으며 배포 Docker는 사내 Nexus를 유지한다. 실제 Python3.10 이미지·새 HTTP Agent·Gemma·사내 E2E는 미검증이다.
- [세션 안내](branch-agent/README.md)에02 프론트·03 데이터·04 Agent 시작 프롬프트를 저장했다.02/03 시작 가능,04는03 이후. 현재 Docker는 계약용 stage이며 바로 배포할 HTTP 서비스는 아니다.

## 2026-09-21 — 로직 완성 후 로컬 실제 Gemma 검증 확정

- 사용자가 키 제공처를 Google AI Studio로 확인했고, Agent 구현 뒤 로컬 프론트와 실제 모델을 연결해 응답·화면을 검증하도록 요청했다. Google 공식 문서의 `gemma-4-31b-it` API 지원을 확인했다. 개인 키로 실제 호출은 아직 하지 않았다.
- 02·04·05·06과 세션 프롬프트를 갱신했다. 업무 로직·데이터·계약은 공통으로 유지하고 validation에 Google 호출기·localhost FabriX 형식 브리지를 구현한다. 사내 Gemma 호출기/패키지와 분리하며 Google 키는 로컬 서버에서만 읽는다.
- 진행 순서:02/03 →04 Agent/stub →05 Google live·로컬 UI →06 사내 E2E. 이번 변경은 계획 문서이며 새로운 live 서버가 구현된 것은 아니다.

## 2026-09-21 — 부점04 구현·05 로컬 검증

- 02 remote·03 실제48명 데이터 생성/검증 완료를 재확인한 뒤 공통 Python 서비스·상태 전이·Gemma 해석/문장·HTTP SSE를 구현했다. 원본 데이터·외부 계약·기존 `agent/`는 유지했다.
- validation에 같은 call 인터페이스의 Google 호출기·localhost FabriX 브리지·Starroot 하네스·36개 서비스 골든·실제 HTTP/브라우저 runner를 추가했다. 키는 서버 환경변수만 읽고 Git/로그에서 제외한다.
- build/check/check --agent, 데이터·계약·remote 전송, stub36/36, 실제 HTTP/SSE·timeout/취소, validation 없는 배포 파일 기동 PASS. 기존 Agent ASGI도 venv에서 실행해 이전 미설치 SKIP을 해소했다.
- 실제 Google `gemma-4-31b-it`108/108, 로컬 remote UI19/19 PASS. 문장 대체·중간429/해석 실패 이력은 [05](branch-agent/05-GOLDEN.md)에 별도 기록한다. 사내 E2E는 미실행이다.
- 루트 [내일 배포 안내](../../BRANCH_AGENT_DEPLOY_TOMORROW.md)에 프론트3파일·FabriX API 설정·Python10파일·6개 직접 의존성·사내 점검 순서를 정리했다. 사내 Nexus 접근 대신 승인된 공개 PyPI 로컬 venv로 검사했고, 실제 사내 이미지 설치 성공을 주장하지 않는다.
- 사용자가 오늘 로컬 변경의 GitHub commit/push를 추가 요청했다. 해당 요청 범위로 반영하며 실제 사내 배포는 하지 않는다.

## 보존할 구현 이력

- **2026-09-20 실제 부점 Agent 설계:** `docs/handover/branch-agent/`에 계약→프론트→데이터→Agent/상태→골든→사내 검증을 분리. 지정 모델 `gemma-4-31b-it`, 신규 `branch-agent/deploy/`·`validation/` 폴더 구성. 기존 agent/프론트 실행 코드는 이번 문서 작업에서 변경하지 않음. 신규 계약·Agent·검사 도구는 아직 미구현. 전달된 인증 키는 저장/사용하지 않음.

- **2026-09-16 이전·정리:** 30명+김서연 원본/브리핑 보존. 상단 고객정보와 S1~S5 분리. 중복 명세·구버전 프론트·MD 변환/override·일회성 도구 정리. 수정 원본은 고객 JSON·브리핑 JSON·Vanilla 모듈.
- **고정 Agent:** case_id·고객ID·기준일·전체 스냅샷 검증 후 저장된 S1~S5 반환. LLM 미사용, 평면 import·Docker COPY·Pydantic envelope·SSE 유지. `llm_client.call` 인터페이스/requirements 변경 없음.
- **브리핑 자동 호출:** 구조화 고객 선택 시 FabriX 호출, 수신 고객은 세션 내 재사용·‘다시 요청’으로 갱신. 설정은 onParam/window 주입, 없거나 잘못되면 미호출. 반입 JS에는 고객 스냅샷만, 브리핑 문장은 API에서 수신.
- **실시간 상담:** 별도 Connector로 사내 실제3턴 확인, 샘플은 `integration/contracts/chat.example.json`. 고객별 대화 세션·SSE/연속JSON/CHUNK 파싱·근거/후속 질문 표시. 직원이 대화 Agent용 고객 식별자를 입력하며 현재 저장소31건과 자동 연결된 것은 아님.
- **메인 목록·뱃지:** 레거시18+케이스30, 김서연 중복 제외. 뱃지 원천은 signals/카탈로그, `pensionCustomerView`에서 색·표시 공통 처리. 목록 정렬과 일부 KPI는 목록 기반이며 AI 검색 집계와 자동 연동된 것으로 간주하지 않음.
- **2026-09-18 부점 AI:** 규칙 기반 플로팅 검색 통합, 현재 메인48행 투영. 집계도 목록 적용, 기존 목록/상세 진입/복귀 연결. 조건 추출·추가 안내줄 제거.
- **Starroot 보정:** transform 조상으로 인한 fixed 오류를 body 위젯으로 해결. 사내 옛 CSS 진단 후 번들 CSS 폴백 추가. 자산 경로를 `/mnbank/app/html/bfe/asstmgt/asst/`로 정정. 플랫폼 원본 reference는 유지.

- **2026-09-17 뱃지 정렬:** `signals`를 Dynamic Segment 카탈로그 뱃지로 재정비(근거는 `에이전트맥락데이터`·`가상설정메모`), 디폴트옵션명 뿔려드림, 메인 목록 30케이스 합류·색·정렬·KPI 계산은 위 항목과 같음.
- **2026-09-21 기준일 9/29 통일·C01 합류:** 30케이스 기준일 9/29 재계산(D-day·일수 지표·브리핑 문장, B02-18 DO 실행 10/3, B02-27 9/21 입금 반영). 동료 대화 Agent 시연 고객 12명 `C01-01~12`(엑셀 9명+실측 답변 3명, 카탈로그 뱃지만, 가정은 가상설정메모). 빌드가 브리핑 없는 고객 허용(`noBriefing`, FabriX 미요청·준비 중 표시, Agent 데이터 30건). DEMO-01 빌드 제외·브리핑 삭제, 레거시 ksy·lsm·pjh 숨김 후 C01 버전으로 대체.
- **2026-09-21 부점 AI 모집단 57행 적응:** 메인 목록 투영이 48행→57행(구조화42+레거시15), 기준일 2026-09-29. `branch-data.js` 인원 검사를 소스 metadata 기반으로, 계약 `row_ids`·Pydantic `MAX_ROWS`를 64로 상향, 스키마 재출력. check_data/check_frontend/check_service/check_http/check_live_ui·conversation.test 기대값과 stub 36골든(`scenarios.json`, data_version 재계산, S-02 50대→40대, 추천 B04-23·B06-13·C01-10)을 현재 데이터로 재산출. 로컬 gate·build/check/--agent PASS. **Google Gemma 108골든·remote UI 19건은 옛 48행 기준이라 재실행 전까지 stale.**

## 검증·미완료

- 과거: 31건 화면·가짜 SSE/오류/취소·자동 호출·실시간 상담 샘플 재생·shell 재현 브라우저 검사 수행. 삭제한 일회성 도구가 현재 존재한다고 가정하지 않는다.
- 현재 검사: `node tools/briefing/build.js`, `node tools/briefing/check.js`. Agent 변경 시 `--agent`도 실행. 과거 Agent 검사는 로컬 FastAPI/Pydantic 미설치로 HTTP 기동 **SKIP**이었으며 사내 기동 완료 근거가 아니다.
- 고객 내용은 모두 draft. 대표 DEMO-01·B01-22·B06-13 외28건 문장 개선, 날짜/상품 매핑 검토가 남음. [사례 색인](../../agent-workbench/case-design/review/CASE_INDEX.md)과 해당 JSON만 확인.
- 최신 브리핑 자동 호출의 실제 WAS 설정·Origin, 부점 AI의 사내 인증·사내 E2E 미검증. 부점 공통 Agent의 로컬 구현/검사는 위04·05 기록 참조. 과거 대화 Agent 실제 응답 확인과 구분.
- 부점 반입/배포는 [내일 안내](../../BRANCH_AGENT_DEPLOY_TOMORROW.md), 기존 고정 Agent는 [사내 체크리스트](../../COMPANY_DEPLOY_CHECKLIST.md). Secret 저장 금지. 요청 없는 commit/push/사내 배포 금지.

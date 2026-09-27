# 작업 기록·미완료

현재 상태는 README, 부점 AI 목표는 [구현 기획](BRANCH_AI_SEARCH_DESIGN.md), 코드 현황은 [AS-IS](BRANCH_AI_FRONTEND_AS_IS.md). 이전 UI 수치·폐기안·전체 실행 로그는 기본 컨텍스트에서 제외한다.

## 2026-09-28 — `계약이전 페이지 방문` 세그먼트 폐지

- 사용자 요청으로 세그먼트를 전부 제거: B03-07 박서진·B04-23 정미경 `signals`에서 삭제(두 고객의 `디지털행동` 원본 로그와 이탈징후 판정 메모는 유지), 뱃지 색 규칙(`pensionCustomerView.js`), 검사 카탈로그(`check.js`), 부점 검색 등록 세그먼트(`branch-search-current-provider.js`), 프론트 골든 입력, 목업 이탈 사유 문구, `BADGE_CATALOG.md`(28번 폐지). 빌드로 반입본·`agent/briefing_data.json`·`branch_data.json`·manifest 갱신 → 부점 data_version `81f4311c…`(문서·`scenarios.json` 재고정). check 9 / --agent 11 / run.js 15 PASS.

## 2026-09-28 — 사내 배포 전 검증·결함 수정, 배포 목록 [DEPLOY_LIST_2026-09-29.md](../../DEPLOY_LIST_2026-09-29.md)

- 자동 게이트 전부 통과: build 결정적(2회 해시 동일), check.js 9 PASS, check --agent(ASGI HTTP 포함) PASS, 부점 run.js 5 게이트 PASS, 배포 .py 11개 Python 3.10 AST·bare import OK, Dockerfile COPY = 배포 파일, requirements 변경 없음, 산출물에 키·로컬 주소 없음, `agent/briefing_data.json` 변경은 C01-07·answer_schema뿐, 부점 data_version 81f4311c… 일치(JS·manifest·branch_data.json). 로컬 8766 실제 경로: 화면 unload→onParam 재진입 2회 중복 없음, 오세훈 브리핑+분석 근거, 부점 AI 검색 실제 Gemma 호출 10명 반영·execution_trace 병합, 처리 이력 3건.
- 정밀 리뷰(프론트·Python diff)로 찾은 결함 수정: **(HIGH) 부점 execution_trace가 자기 스키마에 안 맞으면 정상 답변이 오류로 바뀌고 SSE 프레임까지 실패** → `branch_trace.detail()`이 labels/checks를 80자로 자르고 `plan_summary`가 빈 target_name/remove_field를 null로, `branch_service.safe_trace()`가 검증 실패 trace를 버림(답변·오류 이벤트 모두). (MED) compose 문장 검증 실패 시 단계가 열린 채 남아 trace가 failed로 표시 → 템플릿 대체를 completed로 종료. (MED) 엑셀 추출 기록이 `session.note()`의 동기 cancel에 걸려 새 기록이 '취소'로 찍힘 → pendingExport 등록을 note() 뒤로. (MED) 목업 기록 UI 문구 '목업 계산 기준'·'*.mock.v1' 제거. (LOW) 분석 근거 패널 첫 재렌더 시 열린 단계 접힘, 죽은 설정값, 미사용 변수, 근거 폐기 시 console.warn 코드 1줄, `agent/main.py` exclude_none→exclude_unset. 회귀 검사는 `check_service.py`에 추가(6조건 라벨·빈 target_name·compose 대체·invalid trace 폐기).
- 배포 문서의 부점 data_version 표기(b059980b…, 9/21)를 현재 값으로 갱신.

## 2026-09-28 — 오세훈(C01-07) 브리핑 표시 개편: S3 상품 메타정보·S5 Hot Tip·하단 근거 자료

- 기획 `agent-workbench/case-design/review/C01-knowledge/C01-07/briefing_ui_revision.md`·`.json`대로 구현. 계획 JSON은 런타임/빌드 입력으로 등록하지 않았고, 원본 `active/briefing-json/C01-07.json`·`briefing_evidence.json`을 고친 뒤 빌드로 반입본을 갱신했다.
- 자료: 상품 3종에 `category`·`riskLevel`(펀드만)·`metrics`(기간별 표시금리/누적수익률, 펀드는 `asOf: null`) 추가, `sourceIds`를 카탈로그 원천 id로 교체. S5 `tips` = Hot Tip(`kind: hot_tip`, `publishedAt: 2025-02-27`, 실제 LXP URL) + 후속 안내(`kind: follow_up`). `sources` 9건. 근거 맵은 카드 11장(`source_id` 부여, H-PENSION 추가, 상품 3장은 RAW 없음)·연결 49건·RAW 12줄, baseline 해시 갱신.
- 계약: `briefing-contract.js` 지표 `asOf`는 `return`만 `null` 허용(`rate`는 문자열 필수), `tips[].kind`(hot_tip/follow_up, hot_tip 최대 1)·`publishedAt`(YYYY-MM-DD) 선택. `fabrix-briefing-contract.js` 카드 `source_id` 선택, 같은 응답 `briefing.sources` 존재 검사. `build.js`가 팩에 `source_id`를 싣고 검증, `agent/briefing.py`가 그대로 투영. 문서 §4.1·4.2·4.4.
- 화면(C01-07만, `pensionBriefingAdapter.js` 표시 정책): 추천상품 펼침은 상품명·유형·위험등급·기간별 수치 표(소수 둘째 자리, '+' 없음)·기준 문구 1회(`2026.09 자료 기준`, 적용기간은 자료에 있을 때만, 펀드는 `기준일 미표기`)만 보이고 이유·확인사항·근거 배지는 숨김. S5는 Hot Tip 카드 1장(게시일, 본문, `원문 보기 ↗`) + 기존 실행 4건 + 그 아래 '상담 후 확인' 일반 안내. 하단은 '근거 자료'(기본 접힘, 제목 9행). 제목 선택 → 기존 분석 근거 패널의 '참고한 업무·상품 지식'에서 같은 출처 카드만 펼침(`openSource`). reviewNotes 숨김. 다른 고객은 정책 없이 기존 표시.
- 검사: build/check(신규 'C01-07 UI revision' 항목 포함 9 PASS)/check --agent(ASGI HTTP PASS). 브라우저(로컬 8766)에서 상품 펼침·Hot Tip·근거 자료 → 패널 이동·고객 전환 확인. commit/push/사내 배포 없음.

## 2026-09-28 — 오세훈(C01-07) 브리핑 '분석 근거' 패널 + 메인 이력 업무 단위 묶음

- 자료: `agent-workbench/case-design/review/C01-knowledge/C01-07/briefing_evidence.json`(고객 필드 16, 판단 4, 지식 카드 10, RAW 11, 브리핑 연결 52)을 `tools/briefing/build.js`가 원본 고객/브리핑 해시·포인터 값·corpus 발췌와 대조한 뒤 `agent/briefing_data.json`의 C01-07 레코드에만 `analysis_evidence`로 싣는다(expected_*·경로·해시·내부 메모 제외).
- Agent: `agent/briefing.py`가 고정 브리핑에 선택 필드 `data.analysis_trace`를 덧붙인다(네 단계 실제 처리 시각, 요청에서 읽은 사실 값, 사전 작성 판단, 카드, 같은 응답 브리핑의 연결 문장; LLM 호출 0). `main.py` Pydantic에 선택 필드 허용(`exclude_none`).
- 프론트: `fabrix-briefing-contract.js`에 선택 스키마+의미 검사(잘못된 근거는 버리고 브리핑만 표시), 저장소가 브리핑·근거를 같은 ticket으로 원자 교체, 브리핑 카드의 [분석 근거] 버튼과 고객 전용 패널 `pensionBriefingEvidencePanel.js`(고객 상황 요약 → 관리포인트 → 참고한 업무·상품 지식 → 브리핑 반영, 한 번에 한 단계, 원문 8행+더 보기, 브리핑에서 보기 강조). 고객 변경·목록 복귀 시 닫힘.
- 메인 처리 이력 기본 보기를 업무 단위로 묶음: 부점 브리핑(고객 변화 확인 → 관리대상 선정 → 브리핑 구성), 검색(검색조건 해석 → 고객 조회 → 결과 반영), 엑셀(추출대상 확인 → 파일 생성·다운로드 요청). 내부 단계는 묶음 안에서 펼침. 기록 데이터·출처 구분 유지.
- 검사: build/check(근거 팩·계약·저장소·자동 요청 흐름), check --agent(C01-07 trace 검증, 다른 고객 없음). 현재 브리핑 JSON은 그대로.

## 2026-09-28 — 처리 이력 패널: 오늘의 부점 브리핑(목업) + 부점 AI 검색·엑셀 추출(실제 기록)

- 메인 상단 '분석 완료' 옆 '처리 이력' 버튼 → 앱 내부 우측 패널(760px, `#pensionAgentDemo` 기준 absolute + sticky). 목록 → 상세 → 단계 펼치기, 닫기·Escape·재진입 시 상태 유지·중복 없음. 화면 문구에 DEMO/MOCK 접두사 없음, 내부 origin(`frontend_fixture`/`frontend_observed`/`agent_observed`)으로 구분.
- 부점 브리핑: `pensionExecutionTraceData.js`가 1,392명 전일·금일 가상 스냅샷(고정 seed)에서 12개 세그먼트 변화·12→9→6명·대표 사례 6건·Gemma 4 호출 2회·FabriX 요청/응답을 하나의 기준 시각 offset으로 구성. 2026-09-28부터 기준 시각은 화면이 처음 렌더링된 실제 시각(`setBase`)이며 요청 +120ms → 생성 +150ms~+20.15초(요청 안에서 수행) → 응답 +20.352초로 보인다. 최종 문장은 메인 화면과 동일. 실제 호출 없음.
- 부점 AI 검색: Agent `branch_trace.Collector`가 요청별 4단계(해석 → 확정 → 적용 → 답변, 브리핑은 문장 생성 추가)와 LLM 시도별 기록을 `answer.execution_trace`(선택 필드)로 반환. 프론트는 transport의 실제 전송·수신 지점(`onSend/onResponse`), 세션 검증, adapter의 목록 DOM 갱신 지점에서만 기록. 표시 범위 '여의도종합금융센터 관리 고객 1,392명'은 `pensionBranchDisplay.js`(display_config)이며 result.count·row_ids·manifest는 실제 값 유지.
- 엑셀 추출: 요청 시점 목록·조건·기준일·연결 검색 trace 고정, 3초 표시 대기와 XLSX 생성(행 구성/시트/ZIP) 시간 구분, 파일명·크기·행·열·시트 기록, 0명·생성 실패·다운로드 실패·취소 구분. Agent 호출 없음.
- 2026-09-28 단계 축소: 기록 자체를 줄였다. 브리핑 목업 생성 6단계(스냅샷 비교 → 세그먼트 변화 → 관리 포인트 → 관리방향 해석 → 문장 생성 → 근거 대조·확정) + 조회 1단계, 검색 Agent 4단계, 엑셀 3단계(대상·조건 확정 → XLSX 생성 → 다운로드, 3초 대기는 소요 메모). 프론트 전송·수신 관측 기록은 '전체 단계 보기'에서만 보인다. 배지 색을 빼고 로그처럼 표시한다.
- 검사: build/check(신규 traceCheck·traceLogCheck), check --agent, validation run.js(계약 137건·서비스 36/36+trace_checks·HTTP), 실제 Gemma(Google AI Studio)로 시연 문장 → `and(age>=55, segment 연금저축 보유)` 10명 확인. 사내 Connector/Starroot E2E 미검증. 새 Agent와 프론트 3파일은 함께 교체 필요(구 프론트는 새 키 거절).

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
- **실시간 상담:** 별도 Connector로 사내 실제3턴 확인, 샘플은 `integration/contracts/chat.example.json`. 고객별 대화 세션·SSE/연속JSON/CHUNK 파싱·근거/후속 질문 표시. 2026-09-22부터 선택한 고객의 `customerId`로 바로 시작하며(고객 변경으로 식별자 수동 입력 가능), 대화 Agent가 아는 고객은 C01 12명.
- **메인 목록·뱃지:** 레거시18+케이스30, 김서연 중복 제외. 뱃지 원천은 signals/카탈로그, `pensionCustomerView`에서 색·표시 공통 처리. 목록 정렬과 일부 KPI는 목록 기반이며 AI 검색 집계와 자동 연동된 것으로 간주하지 않음.
- **2026-09-18 부점 AI:** 규칙 기반 플로팅 검색 통합, 현재 메인48행 투영. 집계도 목록 적용, 기존 목록/상세 진입/복귀 연결. 조건 추출·추가 안내줄 제거.
- **Starroot 보정:** transform 조상으로 인한 fixed 오류를 body 위젯으로 해결. 사내 옛 CSS 진단 후 번들 CSS 폴백 추가. 자산 경로를 `/mnbank/app/html/bfe/asstmgt/asst/`로 정정. 플랫폼 원본 reference는 유지.

- **2026-09-17 뱃지 정렬:** `signals`를 Dynamic Segment 카탈로그 뱃지로 재정비(근거는 `에이전트맥락데이터`·`가상설정메모`), 디폴트옵션명 뿔려드림, 메인 목록 30케이스 합류·색·정렬·KPI 계산은 위 항목과 같음.
- **2026-09-21 기준일 9/29 통일·C01 합류:** 30케이스 기준일 9/29 재계산(D-day·일수 지표·브리핑 문장, B02-18 DO 실행 10/3, B02-27 9/21 입금 반영). 동료 대화 Agent 시연 고객 12명 `C01-01~12`(엑셀 9명+실측 답변 3명, 카탈로그 뱃지만, 가정은 가상설정메모). 빌드가 브리핑 없는 고객 허용(`noBriefing`, FabriX 미요청·준비 중 표시, Agent 데이터 30건). DEMO-01 빌드 제외·브리핑 삭제, 레거시 ksy·lsm·pjh 숨김 후 C01 버전으로 대체.
- **2026-09-21 부점 AI 모집단 57행 적응:** 메인 목록 투영이 48행→57행(구조화42+레거시15), 기준일 2026-09-29. `branch-data.js` 인원 검사를 소스 metadata 기반으로, 계약 `row_ids`·Pydantic `MAX_ROWS`를 64로 상향, 스키마 재출력. check_data/check_frontend/check_service/check_http/check_live_ui·conversation.test 기대값과 stub 36골든(`scenarios.json`, data_version 재계산, S-02 50대→40대, 추천 B04-23·B06-13·C01-10)을 현재 데이터로 재산출. 로컬 gate·build/check/--agent PASS. **Google Gemma 108골든·remote UI 19건은 옛 48행 기준이라 재실행 전까지 stale.**
- **2026-09-22 실시간 상담 패널 정합성 반영:** `answer.links` 딥링크(본문 화면번호 링크·링크 줄·승낙 턴 자동 열기), 네/아니오 버튼을 본문 바로 아래로 옮기고 `prompt` 사용, 본문의 제안 문장·쪽지 ``` 초안·되묻기 옵션 줄 제거, 화법 카드 복사 버튼 제거, 본문 줄바꿈 유지. 빈 근거·실패 안내 표시(1-7·1-8)는 보류. check.js 케이스 추가, 헤드리스 캡처 확인.
- **2026-09-22 대화 Agent 정합성 분석:** 동료 `pension_agent` 소스(main.py·client/README·consult_agent·customers.json)와 실시간 상담 패널을 대조해 `integration/contracts/CHAT_AGENT_ALIGNMENT.md` 작성. 반드시 고칠 것 8건(answer.links 미처리, CTA가 prompt 대신 label·출처 아래 배치, 쪽지 펜스·되묻기·제안 문장 중복, 빈 sources·실패 안내 표시), 서식·출처 분해·employee_id·계약 문서 갱신 항목, C01-10/11/12 데이터 불일치와 PENSION_TODAY 전제 정리. 코드 변경은 아직 없음.
- **2026-09-22 진입 흐름 정리:** 테스트용 '고객별 브리핑' 버튼(목록 헤더)·드롭다운(상세 상단) 제거. 진입은 목록 행 클릭 → 준비 화면(4초 고정) → 상세만 남김. 실시간 상담 패널은 식별자 입력 대신 선택 고객의 `customerId`로 바로 시작하고 인트로를 "OOO 고객님 상담을 시작해요. 상담 중 궁금한 내용을 바로 물어보세요."로 변경, 고객 변경은 유지. check.js 갱신, 전 gate PASS.
- **2026-09-21 뱃지 카탈로그 문서화:** `agent-workbench/case-design/review/BADGE_CATALOG.md` 신설(39종 정의·색·42케이스+레거시 사용 현황, 미사용 2종·변형 1종 명시). CASE_INDEX를 42건·기준일 9/29·C01 12행으로 갱신하고 DEMO-01 행 제거. 스키마 문서 12절에 카탈로그 우선 안내 추가.

## 검증·미완료

- 과거: 31건 화면·가짜 SSE/오류/취소·자동 호출·실시간 상담 샘플 재생·shell 재현 브라우저 검사 수행. 삭제한 일회성 도구가 현재 존재한다고 가정하지 않는다.
- 현재 검사: `node tools/briefing/build.js`, `node tools/briefing/check.js`. Agent 변경 시 `--agent`도 실행. 과거 Agent 검사는 로컬 FastAPI/Pydantic 미설치로 HTTP 기동 **SKIP**이었으며 사내 기동 완료 근거가 아니다.
- 고객 내용은 모두 draft. 대표 DEMO-01·B01-22·B06-13 외28건 문장 개선, 날짜/상품 매핑 검토가 남음. [사례 색인](../../agent-workbench/case-design/review/CASE_INDEX.md)과 해당 JSON만 확인.
- 최신 브리핑 자동 호출의 실제 WAS 설정·Origin, 부점 AI의 사내 인증·사내 E2E 미검증. 부점 공통 Agent의 로컬 구현/검사는 위04·05 기록 참조. 과거 대화 Agent 실제 응답 확인과 구분.
- 부점 반입/배포는 [내일 안내](../../BRANCH_AGENT_DEPLOY_TOMORROW.md), 기존 고정 Agent는 [사내 체크리스트](../../COMPANY_DEPLOY_CHECKLIST.md). Secret 저장 금지. 요청 없는 commit/push/사내 배포 금지.

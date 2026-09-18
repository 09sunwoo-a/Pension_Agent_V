# 작업 기록

## 2026-09-16 — 이전 및 핵심 파일 정리

- 외부 작업본을 저장소 내부로 이전했고, 30명 + 김서연 고객/브리핑 JSON과 원래 김서연 UI를 보존했습니다.
- 상단 고객정보와 Agent S1–S5 응답을 분리하고, 선택 필드 숨김·추천상품·요청 취소/실패/늦은 응답 처리를 구현했습니다. 상담 후 확인 기록은 제거했습니다.
- API는 `customer-briefing-api.v1`. Python이 구조를 고정하고 LLM은 문장을 생성하는 내부 구현이 남았습니다.
- 정리: 중복 명세·스키마/예시, 구버전 프론트, 별도 fixture, Markdown 변환/override, 모의 서버/브라우저 시뮬레이션/이전 검사와 중복 안내 문서 총 76개를 제거했습니다. contracts는 2개, frontend/src/briefing은 11개, tools/briefing은 2개 파일만 남겼습니다.
- 현재 수정 원본은 고객 JSON + 브리핑 JSON + Vanilla 모듈입니다. 중간 문서 JSON을 만들지 않습니다. 도구는 `build.js`와 `check.js` 두 개로 통합했습니다.
- 기존 상품/전략 지식과 사내 플랫폼 reference, Agent 실행·배포 코드는 보존했습니다. 기능에 필요한 렌더러/연동 모듈을 파일 수만 줄이려고 합치지는 않았습니다.

## 확인한 범위

이전 직후 31건 Chrome 화면·모의 FabriX 오류/취소/상단 격리와 임시 폴더 독립 재생성을 확인했습니다. 해당 일회성 도구는 정리에서 제거했습니다. 정리 후 현재 `check.js`로 31건/필드/렌더링 매핑/요청 식별/빌드 일치 검사를 통과했습니다. 고객 JSON 30건·브리핑 JSON 31건은 정리 전과 동일하고 반입 HTML/CSS도 끝 줄바꿈 외에 동일합니다.

남긴 핵심 폴더만 임시 위치에 복제한 뒤에도 빌드/검증을 통과했습니다. 숫자 Starroot 파일코드로 빌드하는 경로도 그 복사본에서 확인했으며, 저장소 반입본에는 실제 파일코드를 아직 설정하지 않았습니다.

고객·브리핑 의미, 현행 제도·상품 근거를 모두 검토한 것은 아닙니다. 대표 DEMO-01·B01-22·B06-13 외 28건 문장 개선이 남았고 모든 사례는 draft입니다. 알려진 날짜·상품 매핑 이슈와 의도적 고객 예외는 사례 색인/JSON에 남아 있습니다.

실제 사내 FabriX 인증·CORS·Starroot/WebView 및 최신 Agent E2E는 미검증입니다. [사내 체크리스트](../../COMPANY_DEPLOY_CHECKLIST.md)를 따릅니다.

삭제한 기존 추적 파일은 Git 이력, 이전에 복사한 개발 자료는 저장소 바깥의 기존 작업본에서 복구할 수 있습니다. 외부 작업본과 Git 이력은 삭제하지 않았습니다.

## LLM 없는 고정 Agent 및 사내 준비

- `main.py`를 브리핑 전용으로 교체하고 LLM import/호출과 원시 입출력 로그를 제거했습니다. `llm_client.py`와 기존 requirements는 변경하지 않았습니다.
- `briefing.py`가 case_id·고객 ID·기준일·전체 스냅샷을 확인하고 저장된 S1–S5를 선택합니다. 임의 사례/변경 입력은 정상 브리핑으로 대체하지 않습니다.
- 동일 빌드가 `agent/briefing_data.json`도 생성합니다. 별도 수정 원본/규격을 늘리지 않고 프론트 계약 스키마를 그대로 묶어 Python에서 검사합니다.
- Pydantic으로 answer/error envelope를 고정하고 FabriX Agent CHUNK 하나 + SSE EOF를 반환합니다. Docker COPY에 새 두 파일을 반영하고 이 단계에서 불필요한 `.env` COPY는 제거했습니다.
- `check.js --agent`: 31건 Python 응답/SSE와 프론트 규격 일치, 오류 입력/스냅샷, 응답 객체 격리, Python 3.10 문법, LLM import 없음 확인.
- 로컬 FastAPI/Pydantic 미설치로 HTTP 앱 기동 검사는 SKIP입니다. 실제 사내 기동·배포·연동까지 완료했다고 보지 않습니다.
- 루트 `COMPANY_DEPLOY_CHECKLIST.md`에 내일 반입할 파일, 파일코드/cfg, 사내 flat repo/tag/Portal, health/API/오류 확인 순서를 통합했습니다.

## 브리핑 화면 실제 API 전환 (사내 체크리스트 통과 후)

- 연결 설정 입력 폼·실제 브리핑 호출 버튼·더미로 복원을 제거했습니다. 설정 다섯 값은 `PG_<파일코드>.onParam(params).fabrix` 또는 `window.__PENSION_FABRIX_CONFIG`로 화면 진입 시 주입하며 메모리에만 보관합니다. 주입이 없으면 `NOCONFIG`, 형식 오류면 `CONFIG`로 표시하고 호출하지 않습니다.
- 구조화 고객을 선택하면 즉시 FabriX를 호출합니다. 같은 화면 세션에서 수신한 고객은 재선택 시 재요청하지 않고 **다시 요청**으로만 갱신합니다. 취소·늦은 응답·오류 처리와 transport·계약·Agent는 그대로입니다.
- 반입 JS에서 브리핑 문장 31건을 제거했습니다(`PensionBriefingFixtures.customers`만 포함). 요청 스냅샷과 Agent SNAPSHOT 검증에 필요한 고객 데이터는 유지하며 `agent/briefing_data.json`은 같은 빌드로 계속 생성합니다. 사용처가 없어진 store의 `setOutput`/`status`도 제거했습니다.
- `check.js`에 반입본 수준 검사를 추가했습니다: 주입 설정 → 선택 시 자동 요청 → 가짜 fetch의 SSE 1프레임 → 화면 반영, 수신 고객 재요청 없음, 잘못된/누락 설정 시 미호출. 로컬 Chromium + 가짜 SSE 서버(loopback endpoint)로 `NOCONFIG`·자동 호출·고객 전환·다시 요청 화면 동작도 확인했습니다.
- 사내 확인 항목은 [체크리스트](../../COMPANY_DEPLOY_CHECKLIST.md) 5단계입니다. WAS 쪽 설정 주입과 실제 Origin에서의 자동 호출은 미검증입니다. 토큰이 브라우저에 내려가는 구조는 그대로이므로 운영 전 WAS 프록시 등 인증 방식 검토가 남아 있습니다.

## 실시간 상담 패널 — 대화 Agent 연결

- 사내 브리핑 화면 콘솔에서 대화 Agent Connector로 브라우저 직접 호출이 되는 것을 확인했고, 실제 3턴 응답을 `integration/contracts/chat.example.json`으로 보관했습니다. 규격·매핑은 `CHAT_AGENT_CONTRACT.md`.
- `fabrix-chat-transport.js`(이벤트 스트림, 연속 JSON·CHUNK 포장·오류 문구 속 CHUNK 처리)와 `pensionChat.js`(고객별 세션·대화 기록, 답변 파싱, 패널 매핑)를 추가했습니다. 31명 구조화 고객에서 패널을 켜고, 기존 데모 3명은 mock을 유지합니다.
- 설정 블록에 `chat: { endpointUrl, agentId(assetId 문자열), openapiToken, generativeAiClient }`를 추가했습니다(브리핑과 다른 토큰). `xClientUser`는 공유하며 7자리 사번으로 시작해야 합니다.
- 실제 샘플에서 우리 `customerId`를 보내도 Agent가 자기 시연 고객(이준호, 198734-1205842)으로 답합니다. 그래서 상담 시작 시 "고객 식별자를 입력해 주세요."만 띄우고 첫 입력을 식별자로 받습니다(추천 칩 없음). 식별자를 정하면 새 `session_id`, 헤더 **고객 변경**으로 재시작. Agent 고객 저장소에 우리 31건이 들어가면 우리 `customerId`를 그대로 입력하면 됩니다.
- 답변 본문 규칙(실측): 첫 문단 lead, `- ` 줄 목록, 큰따옴표 문단은 복사 가능한 화법, 꼬리 `── 참고한 자료 / · 유형`은 배지. 근거는 `doc`별로 묶어 표시. `progress`는 마지막 문구만 표시. Enter 전송은 change 이벤트보다 먼저 오는 keydown이라 입력값을 직접 읽도록 했습니다.
- `check.js`에 이벤트 추출·설정·샘플 파싱·반입본 수준 패널 재생 검사를 추가했고, 로컬 Chromium + 샘플 재생 서버로 진행 문구·목록·근거·추천질문·화법 복사·네/아니오·선택지·오류·고객 전환·대화 유지를 확인했습니다. `action`·`clarify`·`error`·`주의` role은 문서 기준 구현이며 실제 응답은 미확인입니다.
- 사내 실제 응답 확인 후 UI 보완: 추천질문을 첫 화면과 같은 칩 버튼으로, Enter 전송 시 늦게 오는 change 이벤트가 입력창을 다시 채우던 문제(입력 요소 값을 직접 비움), 새 답변이 오면 대화창을 답변 시작 위치로 스크롤(진행 중에는 맨 아래).
- 사내 화면에서 상단에 불필요한 여백을 만들던 `.browserHeader.on` 겹침 자동 보정(`--starroot-top-offset` padding-top)을 제거했습니다.

## 메인화면 30케이스 합류 및 Dynamic Segment 뱃지 정렬

- 고객 JSON의 `signals`를 Dynamic Segment 카탈로그 뱃지(label/date/source)로 재정비했습니다. 근거는 각 JSON의 `에이전트맥락데이터`에만 두고 `가상설정메모`에 추가 사실을 적었습니다. 디폴트옵션명은 뿔려드림으로 통일했습니다.
- 메인 목록(오늘의 중점관리 고객)에 레거시 18명과 함께 30케이스가 들어갑니다. 행 데이터는 `pensionCustomerView.row`(뱃지=signals, 잔액·수익률·세액공제 도넛=irpAccount)이고, `pensionBriefingAdapter`가 `DATA`에 합류시킵니다. DEMO-01 김서연은 레거시 ksy와 같은 인물이라 드롭다운·검색에만 남깁니다.
- 뱃지 색은 `pensionCustomerView`의 카탈로그 분류 한 곳에서 정합니다(빨강 이탈·상품 문제, 주황 일정·운용 공백, 초록 연금개시·납입·외부자산, 노랑 구성·DO·디지털 행동). 메인 목록과 브리핑 헤더가 같은 함수를 씁니다. 레거시 QMETA·BRIEFS 뱃지 문구도 같은 카탈로그로 바꿨고, 해당 Segment가 없는 홍성우·서정화는 비웠습니다.
- 정렬은 D-day 임박 → 이탈·상품 문제 → 운용 공백 → 나머지, 처리완료는 뒤. 신규 선정은 D-day 뱃지나 계약이전 신청이 있는 고객. 상단 KPI·"중점관리 고객 N명"·관리완료 수·부점 브리핑의 ISA 만기 인원·기준일(9월 14일)은 목록에서 계산합니다. `check.js`에 목록 48행·뱃지=signals·색 일치·카탈로그 밖 문구 없음·정렬 검사를 추가했습니다.
## 부점 AI 고객 검색 — 현재 메인 목록에 플로팅 채팅 통합 (2026-09-18)

- 외부에서 받은 부점 AI v0.3 패키지(기준: 메인화면 30케이스 합류 커밋 7723f21의 반입본 세 파일)의 모듈 8개와 CSS 1개를 `frontend/src/briefing/branch-search-*`로 반입하고 기존 `build.js` 모듈 목록·CSS 결합에 연결했습니다. 반입본 세 파일은 같은 빌드로 재생성되며, 패키지의 별도 적용기·standalone HTML·manifest·test-results는 저장소에 넣지 않았습니다.
- 원본 연결은 `pensionAgentDemo.js`의 init/렌더 전후/destroy 훅 4줄과 HTML의 목록 컨테이너 `data-branch-list`·고객행 `data-branch-customer-id`뿐입니다. 대시보드·필터·고객행·뱃지·도넛·S1–S5 렌더링은 바꾸지 않았습니다. `onParam({ branchSearch: false })`로 끌 수 있습니다.
- 검색 대상은 화면의 현재 메인 목록 48행(레거시 18 + 케이스 30)입니다. 케이스 행과 김서연(`ksy`→DEMO-01)은 `PensionBriefingFixtures` 스냅샷(31건)을 쓰고, 레거시 17행은 표시된 잔액·수익률·등급·뱃지·연령만 쓰며 현금성·보유상품·자동이체·DO 실행일 등은 미확인으로 답합니다. 화면 값과 스냅샷이 다르면 표시 값을 쓰고 차이를 기록합니다(현재 김서연 수익률 1건). 별도 고객을 주입하지 않으며, 기준일은 케이스 2026-09-14가 대표이고 DEMO-01(09-04)과 섞여 있어 창에 표시합니다. 실제 LLM 없이 정해진 문법으로 동작하는 목업입니다.
- 패키지 모듈에서 고친 것: 표시 금액 소수점 파싱(`2.2억원`이 부동소수 오차로 미확인 처리되던 문제, 반올림), 결과 상세줄에 정렬 필드 `source_order`가 `undefined 6원`으로 찍히던 문제, 현재 화면에 없는 핸들러(`filterBrief`) 참조 제거.
- 검증: `check.js`에 골든 회귀(검토용 8명 24턴, 테스트 전용 입력·정답 `tests/branch-search/golden/`)·세션 취소/실패/최신 요청 우선·실제 메인 목록 투영(48행, 구조화 31)과 뱃지·금액·집계·M01 1~2턴 질문의 데이터 기반 기대값·훅·목록 속성·CSS 네임스페이스 검사를 추가했고 `check.js`, `check.js --agent`(HTTP는 기존대로 SKIP) 통과. 로컬 Chromium + 미리보기 서버로 런처 표시, 기존 KPI 필터, 뱃지/금액/집계/M01 후속 질문, 결과행 클릭 → 기존 상세 → 복귀 시 결과 유지, 기존 목록 복원, 전체 조건 해제, 미지원 문장 안내, `onBeforeUnload`/재진입, `branchSearch: false`를 확인했습니다(콘솔 오류 없음).
- 사내 반입 후 채팅창이 팝업으로 뜨지 않던 문제: Starroot shell이 업무 화면을 `transform`이 걸린 `.pt-page` 안에 넣어 `position: fixed`가 그 안에서 페이지 스크롤을 따라가고 창이 화면 밖에 열렸습니다(PageTransitions 구조를 로컬에 재현해 확인). 위젯을 `document.body`에 붙이고 `branch-search.css`를 `#pensionAgentDemo` 대신 `.pad-branch-` 클래스 접두사로만 범위 지정했습니다(태그·전역 선택자 없음, destroy 시 제거). 위젯 마크업의 section/header/footer/h3는 shell 태그 스타일을 피하려고 div로 바꿨고, 행 퇴장 고스트 애니메이션은 transform 조상이 있으면 생략합니다. 브라우저 검사는 `.pt-perspective > .pt-page` 구조를 씌운 상태로 실행해 스크롤 중 런처 고정·팝업 위치를 확인했습니다.
- 미검증: 실제 WAS 반입 후 화면(shell 재현은 문서의 DOM 구조와 PageTransitions 기본 CSS 기준). 골든 8명 입력은 커밋 7723f21 시점 display-data 사본이라 이후 고객 JSON이 바뀌면 화면 답과 달라질 수 있으며, 화면 수치는 항상 현재 데이터로 계산합니다.

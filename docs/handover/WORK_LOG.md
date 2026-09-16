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

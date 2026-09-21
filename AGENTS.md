# 작업 규칙

- 먼저 README.md의 작업별 표에서 범위를 고르고 필요한 파일만 읽는다.
- 고객 작업은 해당 고객 JSON/브리핑 JSON만 읽는다. 전체 42건(브리핑은 30건)은 검증 시에만 사용한다.
- `frontend/briefing-fabrix/`는 생성된 반입본이다. 평소 읽거나 직접 수정하지 않는다.
- `agent/briefing_data.json`도 배포용 생성 묶음이다. 기본 컨텍스트에 읽지 말고 해당 고객 원본 JSON을 읽는다.
- 이전 설계·전체 원천자료를 기본 컨텍스트에 넣지 않는다. 지식은 `knowledge/README.md`와 registry를 거쳐 관련 절만 읽는다.
- API 변경은 `integration/contracts/AGENT_FRONTEND_CONTRACT.md`와 두 계약 JS를 함께 검토한다. 현재 agent는 LLM 없는 고정 브리핑 반환이다.
- 고객 JSON과 `active/briefing-json/*.json`은 수정 원본이다. 빌드가 덮어쓰지 않는다.
- 프론트는 Vanilla JS, Starroot `PG_<파일코드>.onParam` 초기화/`onBeforeUnload` 정리. React/CDN/DOMContentLoaded 의존 금지.
- CSS는 `#pensionAgentDemo` 하위로 제한. 화면 수정 시 `frontend/platform/STARROOT_FRONTEND_GUIDE.md`의 관련 절을 읽는다.
- FabriX는 POST + fetch/ReadableStream. 화면 구조는 프론트, 응답 구조는 Python/Pydantic, 문장은 LLM이 담당한다.
- Agent 수정 시 `docs/platform/02-AGENT_DEVELOPMENT.md`, 배포 시 `03-DEPLOYMENT_PIPELINE.md`의 해당 영역을 읽는다.
- Agent는 /custom 평면 import. 새 Python 파일은 Dockerfile의 개별 COPY에 반영한다. 동작하는 llm_client.call 인터페이스를 이유 없이 바꾸지 않는다.
- 패키지는 사내 Nexus 기준. 변경 시 `docs/platform/04-REQUIREMENTS_POLICY.md`를 확인한다.
- Token/Key/Client Secret은 코드·로그·문서·Git에 저장하지 않는다. `docs/platform/06-SECURITY.md` 준수.
- 플랫폼 원본 reference는 수정하지 않는다. 검증된 과거 환경과 최신 미검증 E2E를 구분한다.
- 변경 후 `node tools/briefing/build.js`, `node tools/briefing/check.js` 실행. Agent 변경 시 `node tools/briefing/check.js --agent`도 실행하고 HTTP 검사 SKIP을 숨기지 않는다. 데이터/문장 의미 검토와 구조 PASS를 혼동하지 않는다.
- 불필요한 임시 도구·중복 명세·보고서를 추가하지 않는다. 요청 없는 commit/push나 사내 배포를 하지 않는다.

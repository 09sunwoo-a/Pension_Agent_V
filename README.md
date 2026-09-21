# Pension Agent

고객별 브리핑과 사내 Agent 구현을 이어가기 위한 저장소입니다. **30명 고객 데이터/브리핑 + 대화 Agent 시연 고객 12명(C01, 고객 데이터만)**을 보존했습니다. 레거시 데모의 김서연·이수민·박정호는 대화 Agent 버전(C01-10·12·11)으로 교체했고, 그 mock 코드는 프론트 안에 남아 있지만 화면에는 뜨지 않습니다.

## 작업별로 필요한 것만 읽기

| 작업 | 수정 원본 / 참고 |
|---|---|
| Agent 내부 구현 | [agent/](agent/), [입출력 명세](integration/contracts/AGENT_FRONTEND_CONTRACT.md) |
| 부점 AI 실제 Agent 신규 구현 | [세션별 작업 안내](docs/handover/branch-agent/README.md)부터. 사내 배포용 `branch-agent/deploy/`, 구현 검증용 `branch-agent/validation/`. 기존 `agent/`는 참고용 |
| 고객 데이터·브리핑 개선 | [30건 색인](agent-workbench/case-design/review/CASE_INDEX.md)의 해당 고객 JSON과 S1–S5 JSON. C01 고객은 고객 JSON만 |
| 화면 레이아웃 | `frontend/src/briefing/mnPensionAgentDemo.html`, `pensionAgentDemo.css` |
| S1–S5·추천상품 렌더링 | `frontend/src/briefing/pensionBriefingView.js` |
| 상단 고객·계좌 렌더링 | `frontend/src/briefing/pensionCustomerView.js` |
| 응답 필드 | `frontend/src/briefing/briefing-contract.js`, `fabrix-briefing-contract.js` |
| 고객별 상태·기존 화면 연결 | `frontend/src/briefing/pensionBriefingStore.js`, `pensionBriefingAdapter.js` |
| API 호출·설정 | `frontend/src/briefing/fabrix-transport.js`, `pensionFabrix.js` |
| 실시간 상담(대화 Agent) 호출·패널 | `frontend/src/briefing/fabrix-chat-transport.js`, `pensionChat.js`, [규격](integration/contracts/CHAT_AGENT_CONTRACT.md) |
| 기존 Vanilla 화면 동작 | `frontend/src/briefing/pensionAgentDemo.js` |
| 부점 AI 고객 검색(플로팅 채팅·목록 전환) | `frontend/src/briefing/branch-search-conversation.js`(의도·추천·브리핑·대화 상태), `branch-search-core.js`(평가·집계), `branch-search-current-data.js`(현재 목록 투영), `branch-search-widget.js`·`branch-search.css`(채팅창), `branch-search-adapter.js`(기존 렌더러 연결) |
| 부점 AI 현재 지원 질문·수정 위치 | [현재 구현 요약](docs/handover/BRANCH_AI_FRONTEND_AS_IS.md) — 코드 작업 시 필요한 절만 |
| 부점 AI 프론트·Agent 구현 기획 | [기능·골든셋](docs/handover/BRANCH_AI_SEARCH_DESIGN.md) — 이 문서부터 읽기. 검색·현황·추천·짧은 브리핑, 최종 목표 사내 시연 |
| 내일 사내 반입·Agent 배포·연동 확인 | 부점 AI: [BRANCH_AGENT_DEPLOY_TOMORROW.md](BRANCH_AGENT_DEPLOY_TOMORROW.md). 기존 S1–S5: [COMPANY_DEPLOY_CHECKLIST.md](COMPANY_DEPLOY_CHECKLIST.md), 필요한 [플랫폼 문서](docs/platform/README.md) |
| 지식 검색 | [색인](knowledge/source_registry.md)으로 관련 자료만 선택 |
| 변경·미완료 기록 | [WORK_LOG.md](docs/handover/WORK_LOG.md) |

## 수정 원칙

- 고객 입력: `agent-workbench/case-design/active/display-data/Bxx-xx.json`(브리핑 있음)·`Cxx-xx.json`(대화 Agent 시연 고객, 브리핑 없음) 직접 수정. 기준일은 전부 2026-09-29. `materials/reference-cases/DEMO-01_*.json`은 더 이상 빌드에 들어가지 않는 참고본입니다.
- 브리핑: `active/briefing-json/<caseId>.json` 직접 수정. S1–S5와 출처/검토 메모만 저장합니다.
- 위 경로의 `active/`, `materials/`는 모두 `agent-workbench/case-design/` 아래입니다.
- Golden/브리핑 Markdown은 고객 맥락·출처 확인용입니다. JSON을 덮어쓰는 생성기/override는 제거했으므로 MD를 고쳐도 화면 JSON이 자동으로 바뀌지 않습니다.
- 생성된 반입 JS, `agent/briefing_data.json`, 응답 예시는 직접 수정하지 않습니다. 같은 빌드가 프론트와 Agent 데이터 묶음을 함께 만들며 원본 JSON은 읽기만 합니다.
- 원본 지식/사내 플랫폼 reference는 그대로 보존하며 전부 기본 컨텍스트로 읽지 않습니다.
- 부점 AI 작업은 대화창·검색 로직 범위입니다. 메인 상단·고객 카드 구조는 유지하고, 새 설명·브리핑 버튼·조건 조작은 대화창 안에만 둡니다.

## 빌드·검증·화면 확인

저장소 루트에서 실행합니다. Node.js 22 권장, npm 설치 없음.

```sh
node tools/briefing/build.js
node tools/briefing/check.js
node tools/briefing/check.js --agent
node tools/briefing/build.js --preview
```

정적 미리보기는 `http://127.0.0.1:8765`, 종료는 Ctrl+C입니다. 실제 Google Gemma와 부점 프론트 연결은 `branch-agent/validation/local_server.py`의 `http://127.0.0.1:8766`을 사용합니다. 패키지 설치·서버/프론트 시작·종료·검사 명령은 [validation README](branch-agent/validation/README.md)에 있습니다.

사내 반입은 **[frontend/briefing-fabrix/](frontend/briefing-fabrix)의 HTML·JS·CSS 세 파일만** 합니다. Node나 원본 모듈은 WAS 실행에 필요하지 않습니다. 반입본의 Starroot 파일코드는 빌드 기본값 `1288272`이며, 다른 코드는 `node tools/briefing/build.js <숫자파일코드>`로 생성합니다.

사내 Agent 응답 검증: `node tools/briefing/check.js request.json response.json` (내부 요청/answer JSON만, 토큰·헤더·실제 고객 정보 반입 금지). cfg 다섯 항목은 화면 진입 시 `onParam(params).fabrix` 또는 `window.__PENSION_FABRIX_CONFIG`로 주입하며 소스에 넣지 않습니다.

## 현재 단계

- 프론트·브리핑 규격·30건 브리핑 + 12건 고객 스냅샷 구조 연결: 로컬 검증.
- 브리핑 화면은 고객 선택 시 FabriX를 자동 호출하고 API 응답만 표시합니다. 반입 JS에 더미 브리핑 문장은 없습니다(고객 스냅샷만 포함). 자동 호출 경로는 `check.js`와 로컬 브라우저·가짜 SSE 서버로 확인했고, 사내 WAS의 설정 주입과 실제 Origin 호출은 미검증입니다.
- 브리핑 내용: 모두 draft, 대표 3건만 1차 개선. 검토 이슈는 각 JSON의 `reviewNotes`와 사례 색인.
- **LLM 없는 고정 Agent 구현 완료**: 선택한 사례의 저장된 S1–S5를 반환하며 요청 식별값/고객 스냅샷이 다르면 오류. Python 응답은 프론트 계약으로 검증했습니다.
- 로컬 venv의 FastAPI/Pydantic으로 기존31건 Agent ASGI 검사와 신규 부점 Agent 실제 HTTP/SSE 검사를 통과했습니다. 사내 이미지·Nexus·Connector·운영 인증 E2E는 미검증입니다.
- 우측 실시간 상담은 42명 구조화 고객에서 대화 Agent(별도 Connector·토큰, 설정 블록의 `chat`)를 호출합니다. 실제 3턴 응답 샘플로 파싱·화면을 검증했고, `customer_id`는 상담 시작 시 직원이 채팅으로 입력합니다(대화 Agent 시연 고객 `198734-1205842`). 기존 데모 3명은 mock 상담을 유지합니다.
- **부점 AI 01~04 구현:** 실제 부점 데이터(현재 57명, 2026-09-21 이전 48명)·공유 계약·remote transport·Python 검색/통계/추천/짧은 브리핑·명확화·멀티턴 상태·SSE를 연결했습니다. 숫자·ID·목록은 Python이 확정하고 LLM은 해석 후보/상담 문장에 사용합니다. 기존 JS 엔진은 명시적 local 데모/회귀 전용입니다.
- **부점 검증:** 공통 서비스 stub36/36, 실제 HTTP/SSE·취소/timeout, validation 없는 배포 파일 기동 PASS. 지정 `gemma-4-31b-it` Google108/108·로컬 remote UI19/19 PASS. 문장 대체·quota 이력은 [05 검사 기록](docs/handover/branch-agent/05-GOLDEN.md)에 구분해 기록합니다. 사내 E2E는 미실행입니다.
- 신규 배포는 `branch-agent/deploy/`만 사용하며 기존 `agent/`와 별도입니다. 사내 call/인증·Nexus는 유지하고 Google 호출기·키·로컬 도구는 사내 이미지에서 제외합니다.
- Secret과 실제 고객 데이터를 올리지 마세요.

# Pension Agent

고객별 브리핑과 사내 Agent 구현을 이어가기 위한 저장소입니다. **30명 + 김서연(DEMO-01) 고객 데이터/브리핑**을 보존했습니다. 원래 김서연 `ksy` 화면도 최신 프론트 안에 유지됩니다.

## 작업별로 필요한 것만 읽기

| 작업 | 수정 원본 / 참고 |
|---|---|
| Agent 내부 구현 | [agent/](agent/), [입출력 명세](integration/contracts/AGENT_FRONTEND_CONTRACT.md) |
| 고객 데이터·브리핑 개선 | [31건 색인](agent-workbench/case-design/review/CASE_INDEX.md)의 해당 고객 JSON과 S1–S5 JSON |
| 화면 레이아웃 | `frontend/src/briefing/mnPensionAgentDemo.html`, `pensionAgentDemo.css` |
| S1–S5·추천상품 렌더링 | `frontend/src/briefing/pensionBriefingView.js` |
| 상단 고객·계좌 렌더링 | `frontend/src/briefing/pensionCustomerView.js` |
| 응답 필드 | `frontend/src/briefing/briefing-contract.js`, `fabrix-briefing-contract.js` |
| 고객별 상태·기존 화면 연결 | `frontend/src/briefing/pensionBriefingStore.js`, `pensionBriefingAdapter.js` |
| API 호출·설정 | `frontend/src/briefing/fabrix-transport.js`, `pensionFabrix.js` |
| 실시간 상담(대화 Agent) 호출·패널 | `frontend/src/briefing/fabrix-chat-transport.js`, `pensionChat.js`, [규격](integration/contracts/CHAT_AGENT_CONTRACT.md) |
| 기존 Vanilla 화면 동작 | `frontend/src/briefing/pensionAgentDemo.js` |
| 내일 사내 반입·Agent 배포·연동 확인 | [COMPANY_DEPLOY_CHECKLIST.md](COMPANY_DEPLOY_CHECKLIST.md), 필요한 [플랫폼 문서](docs/platform/README.md) |
| 지식 검색 | [색인](knowledge/source_registry.md)으로 관련 자료만 선택 |
| 변경·미완료 기록 | [WORK_LOG.md](docs/handover/WORK_LOG.md) |

## 수정 원칙

- 고객 입력: `agent-workbench/case-design/active/display-data/Bxx-xx.json` 직접 수정. 김서연은 `materials/reference-cases/DEMO-01_KIM_SEOYEON_표시용데이터_v0.1.json` 수정.
- 브리핑: `active/briefing-json/<caseId>.json` 직접 수정. S1–S5와 출처/검토 메모만 저장합니다.
- 위 경로의 `active/`, `materials/`는 모두 `agent-workbench/case-design/` 아래입니다.
- Golden/브리핑 Markdown은 고객 맥락·출처 확인용입니다. JSON을 덮어쓰는 생성기/override는 제거했으므로 MD를 고쳐도 화면 JSON이 자동으로 바뀌지 않습니다.
- 생성된 반입 JS, `agent/briefing_data.json`, 응답 예시는 직접 수정하지 않습니다. 같은 빌드가 프론트와 Agent 데이터 묶음을 함께 만들며 원본 JSON은 읽기만 합니다.
- 원본 지식/사내 플랫폼 reference는 그대로 보존하며 전부 기본 컨텍스트로 읽지 않습니다.

## 빌드·검증·화면 확인

저장소 루트에서 실행합니다. Node.js 22 권장, npm 설치 없음.

```sh
node tools/briefing/build.js
node tools/briefing/check.js
node tools/briefing/check.js --agent
node tools/briefing/build.js --preview
```

미리보기는 `http://127.0.0.1:8765`, 종료는 Ctrl+C입니다. 별도 모의 Agent/API 서버는 없습니다.

사내 반입은 **[frontend/briefing-fabrix/](frontend/briefing-fabrix)의 HTML·JS·CSS 세 파일만** 합니다. Node나 원본 모듈은 WAS 실행에 필요하지 않습니다. 반입본의 Starroot 파일코드는 빌드 기본값 `1288272`이며, 다른 코드는 `node tools/briefing/build.js <숫자파일코드>`로 생성합니다.

사내 Agent 응답 검증: `node tools/briefing/check.js request.json response.json` (내부 요청/answer JSON만, 토큰·헤더·실제 고객 정보 반입 금지). cfg 다섯 항목은 화면 진입 시 `onParam(params).fabrix` 또는 `window.__PENSION_FABRIX_CONFIG`로 주입하며 소스에 넣지 않습니다.

## 현재 단계

- 프론트·브리핑 규격·31건 구조 연결: 로컬 검증.
- 브리핑 화면은 고객 선택 시 FabriX를 자동 호출하고 API 응답만 표시합니다. 반입 JS에 더미 브리핑 문장은 없습니다(고객 스냅샷만 포함). 자동 호출 경로는 `check.js`와 로컬 브라우저·가짜 SSE 서버로 확인했고, 사내 WAS의 설정 주입과 실제 Origin 호출은 미검증입니다.
- 브리핑 내용: 모두 draft, 대표 3건만 1차 개선. 검토 이슈는 각 JSON의 `reviewNotes`와 사례 색인.
- **LLM 없는 고정 Agent 구현 완료**: 선택한 사례의 저장된 S1–S5를 반환하며 요청 식별값/고객 스냅샷이 다르면 오류. Python 응답은 프론트 계약으로 검증했습니다.
- **로컬 FastAPI/Pydantic 미설치로 앱 기동은 미검증. 실제 사내 E2E, LLM 기반 생성, 운영 인증 방식은 미완료.**
- 우측 실시간 상담은 31명 구조화 고객에서 대화 Agent(별도 Connector·토큰, 설정 블록의 `chat`)를 호출합니다. 실제 3턴 응답 샘플로 파싱·화면을 검증했고, `customer_id`는 Agent 고객 데이터가 정렬될 때까지 `198734-1205842`로 고정합니다. 기존 데모 3명은 mock 상담을 유지합니다.
- Secret과 실제 고객 데이터를 올리지 마세요.

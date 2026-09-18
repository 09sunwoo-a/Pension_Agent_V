# 내일 사내 작업 순서 — 프론트 반입 → 고정 Agent 배포 → FabriX 연동

## 이번 검증의 목표와 현재 상태

**LLM을 호출하지 않고, 화면에서 선택한 고객의 저장된 S1–S5 브리핑을 실제 사내 Agent/FabriX 경로로 받아 표시하는지 확인합니다.** 문장은 저장소 브리핑 JSON과 같으며 반입 JS에는 더미 문장이 없습니다. API 수신 상태와 실제 Network 요청으로 연동 성공을 판단합니다.

- 로컬 통과: 31건 고객/브리핑, Python 고정 반환·SSE 포장, 프론트 응답 검증, 잘못된 입력·다른 고객·변경된 스냅샷 거부, LLM import 없음.
- **미검증:** 로컬에 FastAPI/Pydantic이 없어 실제 앱 기동/ASGI 검사는 SKIP했습니다. 사내 Docker build·기동·Gateway·Origin/CORS·Starroot/WebView는 아래 순서로 확인해야 합니다.
- 모든 고객 데이터는 시연용입니다. 금융 내용 승인/실제 추천 적합성 검증과는 별개입니다.

## 1. 반입할 파일 준비

먼저 GitHub `main`의 최신 코드를 받습니다. 아래 명령은 `Pension_Agent_V` 루트 기준입니다.

```sh
node tools/briefing/build.js
node tools/briefing/check.js
node tools/briefing/check.js --agent
```

`--agent` 검사는 Python이 필요합니다. FastAPI/Pydantic 설치 환경에서는 `/health`, 31건 `/chat`, 오류 응답도 검사합니다. 없으면 Python 반환부 검사까지만 통과하고 HTTP 검사 SKIP을 표시합니다. 의존성 설치는 사내 Nexus/기존 requirements 정책을 따릅니다.

빌드는 **프론트와 Agent 데이터를 함께** 생성합니다. 고객/브리핑 JSON을 수정했다면 양쪽을 같은 빌드 결과로 반입합니다. 생성 파일은 직접 수정하지 않습니다.

| 반입 대상 | 가져갈 파일 |
|---|---|
| 업무화면 WAS | `frontend/briefing-fabrix/mnPensionAgentDemo.html`, `pensionAgentDemo.js`, `pensionAgentDemo.css` — 세 파일 |
| 사내 Agent 배포 repo | `agent/Dockerfile`, `requirements.txt`, `main.py`, `briefing.py`, `briefing_data.json`, `llm_client.py` — 여섯 파일 |

Node·개별 고객 JSON·프론트 원본 모듈은 WAS에 올리지 않습니다. Agent에도 저장소 전체나 frontend/tools 폴더가 필요하지 않습니다. `llm_client.py`는 기존 Docker COPY를 유지하기 위해 포함하지만 현재 실행 경로는 import/호출하지 않습니다.

## 2. 프론트 세 파일 반입 및 화면 확인

- [ ] 기존 사내 화면 파일을 백업하고 원복 위치를 기록합니다.
- [ ] 반입 JS의 파일코드가 `var STARROOT_FILE_CODE = '1288272';`인지 확인합니다. 빌드 기본값이 1288272이므로 별도 치환은 필요 없고, 다른 코드로 올릴 때만 `node tools/briefing/build.js <숫자파일코드>`로 다시 생성합니다.
- [ ] HTML을 업무 페이지에 등록하고 JS/CSS를 HTML과 같은 폴더인 아래 경로에 배치합니다. HTML의 `<link>`·`<script>`도 이 경로를 가리킵니다.

```text
/mnbank/app/html/bfe/asstmgt/asst/pensionAgentDemo.js
/mnbank/app/html/bfe/asstmgt/asst/pensionAgentDemo.css
```

- [ ] HTML/CSS/JS가 모두 200으로 로드되는지 확인합니다. Starroot에서 JS가 XHR로 보여도 정상일 수 있습니다.
- [ ] **실제 로드 경로와 캐시 확인 (2026-09-18 사내 화면에서 확인)**: 브라우저 테스트 환경은 CSS를 `/mnbank/app/html/bfe/asstmgt/asst/pensionAgentDemo.css`에서 읽었고, 이후 HTML·체크리스트의 경로를 여기에 맞췄습니다. 반입 후 F12 → Network에서 실제 로드된 CSS/JS의 URL과 크기가 이번 반입본과 같은지 보고, 다르면 그 경로의 파일을 교체하고 캐시를 비운 뒤(Ctrl+Shift+R 또는 Disable cache) 다시 확인합니다. 콘솔에서 `getComputedStyle(document.querySelector('.pad-branch-launcher')).position`이 `fixed`면 CSS가 적용된 것입니다. 옛 CSS가 남아 있어도 JS에 실린 사본으로 부점 AI 버튼은 뜨지만 콘솔에 `[Branch AI] … using the bundled copy` 경고가 남습니다.
- [ ] Shell이 `PG_<파일코드>.onParam()`을 호출해 화면을 초기화하는지 확인합니다. `DOMContentLoaded`를 추가하지 않습니다.
- [ ] 기존 김서연 화면, 구조화 김서연 `DEMO-01`, 30개 사례가 목록에 표시되는지 확인합니다.
- [ ] 상단 고객정보/IRP/보유상품이 표시되는지 확인합니다. 상담 후 확인 기록은 없습니다.

이 단계에서는 로컬 고객 스냅샷만 확인합니다. 반입 JS에 브리핑 문장이 없으므로 Agent 배포·설정 주입 전에는 고객을 선택해도 S1–S5 영역이 `NOCONFIG` 안내와 함께 비어 있는 것이 정상입니다. S3 추천상품 펼침·S4 고객 반응·S5 TIP/업무는 5단계에서 확인합니다. 우측 실시간 상담은 이번 S1–S5 API 대상이 아닙니다.

## 3. Agent를 사내 배포 repo의 평면 구조로 배치

이 GitHub 저장소는 개발용 계층 구조이고 **사내 GenAI 배포 repo는 `agent/`의 내용이 루트**가 되어야 합니다.

```text
사내 Agent 배포 repo/
  Dockerfile
  requirements.txt
  main.py
  briefing.py
  briefing_data.json
  llm_client.py
```

- [ ] `.env`, LLM 키, Gemma URL을 채우지 않습니다. 현재 경로는 LLM/`.env`를 읽지 않고 Dockerfile도 `.env` 파일을 요구하지 않습니다.
- [ ] 사내 ACR Python 3.10 이미지, Nexus 설치 주소, `WORKDIR /custom`, `uvicorn main:app`, Stage ARG는 기존 설정을 유지합니다.
- [ ] 현재 `requirements.txt`를 그대로 사용합니다. 다른 프로젝트의 버전을 섞거나 외부 PyPI 설치로 바꾸지 않습니다.
- [ ] Dockerfile에 `briefing.py`와 `briefing_data.json` COPY가 들어 있는지 확인합니다. 신규 파일을 Git에 올리기만 하고 COPY를 빼먹으면 안 됩니다.
- [ ] 가능하면 같은 사내 Python 환경에서 `uvicorn main:app --host 0.0.0.0 --port 8000`으로 먼저 기동합니다.

`briefing_data.json`이 없거나 깨지면 `/health`가 503이 됩니다. 빌드 명령을 실행해 만든 묶음을 누락 없이 반입합니다.

## 4. 사내 Git tag → GenAI Portal 배포

- [ ] 위 여섯 파일을 사내 배포 repo에 반영합니다. 이번 GitHub main push 자체가 사내 배포 완료를 뜻하지 않습니다.
- [ ] 사내 절차에 따라 commit → branch push → 새 tag 생성 → tag push를 수행합니다.
- [ ] `git ls-remote --tags origin`으로 실제 원격 tag 존재를 확인합니다.
- [ ] GenAI Portal에서 해당 tag를 선택합니다.
- [ ] Jenkins/Kaniko build → ACR push → ArgoCD/Kubernetes rollout → Healthy를 확인합니다.
- [ ] `/health`가 아래처럼 응답하는지 확인합니다.

```json
{"status":"ok","mode":"fixed_briefing","llm_enabled":false,"case_count":31}
```

기존 `gemma-text-only-fixed-template-test-2`가 보이면 구버전 main.py가 배포된 것입니다. `ModuleNotFoundError`면 평면 import/COPY/설치 결과부터 확인합니다.

## 5. FabriX Connector 설정과 실제 호출

- [ ] Connector가 새 배포 Agent를 가리키는지 확인하고 해당 환경의 Connector URL과 Agent ID를 준비합니다.
- [ ] **배포본** `mnPensionAgentDemo.html`의 `<body>` 첫머리 `window.__PENSION_FABRIX_CONFIG = {...}` 블록에 아래 다섯 값을 채웁니다(Git 원본은 빈 값 유지, 빌드가 검사함). WAS가 서버에서 채우거나 `PG_<파일코드>.onParam(params)`의 `params.fabrix`로 넘기는 경우에는 블록을 비워 둡니다. 파일코드처럼 재빌드 후 다시 채워야 합니다.

| cfg 키 | 준비할 값 |
|---|---|
| `endpointUrl` | `https://…/prod/kb0/<connector-id>/1`까지. Gemma endpoint 아님 |
| `openapiToken` | 승인된 OpenAPI 토큰. Secret |
| `generativeAiClient` | 승인된 인증용 클라이언트 값. Secret |
| `agentId` | 실제 Agent의 양의 정수 ID. `0` 불가 |
| `xClientUser` | 테스트 직원 식별값 |

설정은 메모리에만 보관되며 화면 종료 시 제거되므로 화면 진입마다 주입되어야 합니다. 소스·문서·콘솔 기록에 인증값을 넣지 않습니다. Network에는 헤더가 보이므로 HAR/스크린샷/전체 요청을 공유할 때 비밀값과 식별정보를 포함하지 않습니다.

- [ ] **대표 · 상품 제안 · 김서연 (`DEMO-01`)**을 선택합니다. 선택 즉시 요청이 나갑니다(호출 버튼 없음). 원래 김서연 `ksy`는 API 호출 대상이 아닙니다.
- [ ] 화면 상단 **브리핑 수신** 줄이 `LOADING`이었다가 **`SUCCESS` · 정상 수신 · 내용 검토 전 초안입니다**로 바뀌는지 확인합니다. `NOCONFIG`면 주입이 안 된 것이고, `CONFIG`면 주입값 형식 오류입니다.
- [ ] POST URL이 `{endpointUrl}/openapi/agent-chat/v1/agent-messages`인지 확인합니다.
- [ ] `contents[0]`이 JSON 문자열이고 `isStream: true`인지 확인합니다. FabriX가 그 문자열을 Agent `/chat`의 `input_value`에 전달합니다.
- [ ] HTTP 200 + `text/event-stream`인지 확인합니다.
- [ ] S1–S5, S3 추천상품 펼침, S4 고객 반응, S5 TIP/업무가 표시되는지 확인합니다. 브리핑 문장이 저장소 JSON과 같은 것은 고정 반환 단계의 정상 동작입니다.
- [ ] 상단 고객/계좌/보유상품이 API 응답 때문에 바뀌지 않는지 확인합니다.
- [ ] B01-22, B06-13, 다른 사례로 바꿔 각 고객에 맞는 결과를 받는지 확인합니다. 고객마다 요청이 1회 나가고, 이미 수신한 고객을 다시 선택하면 재요청하지 않으며 **다시 요청**으로만 갱신되는지 확인합니다.

Agent는 `event: CHUNK`, 문자열 `content`, 빈 `references/recommend_queries/actions`를 전송합니다. 브라우저에서는 FabriX의 `event_status: CHUNK` 포장 안에 `event: answer` 논리 객체가 있어야 합니다. 완성된 이벤트 하나 후 스트림이 종료되어야 합니다. 상세 필드는 [입출력 명세](integration/contracts/AGENT_FRONTEND_CONTRACT.md)를 따릅니다.

### 5-2. 실시간 상담(대화 Agent) 연결

- [ ] 배포본 HTML 설정 블록의 `chat: { endpointUrl, agentId, openapiToken, generativeAiClient }`에 **대화 Agent 전용** 값을 채웁니다(브리핑 토큰과 다름). `agentId`는 assetId 문자열. 최상위 `xClientUser`는 7자리 사번으로 시작해야 합니다.
- [ ] 구조화 고객을 선택하면 우측 **실시간 상담** 패널이 열리고 "고객 식별자를 입력해 주세요."만 보이는지 확인합니다. `198734-1205842`를 입력하면 "고객 … 기준으로 상담을 시작합니다"가 나오고 헤더에 식별자와 **고객 변경**이 표시됩니다. `chat`을 비워 두면 질문 시 미설정 안내만 나오고 호출하지 않습니다.
- [ ] `이 고객 지금 현황은 어때?`를 입력합니다. 상태 말풍선 문구가 바뀌다가(5~9단계) 답변·목록·"▸ 근거 N건"·추천질문 칩이 표시되는지 확인합니다. Network에는 대화 Connector로 POST 1건, `contents[0]` 안 `customer_id`가 입력한 식별자, `session_id`가 UUID인지 봅니다.
- [ ] 추천질문 하나를 눌러 2턴째가 **같은 `session_id`**로 나가는지 확인합니다(Agent 로그 `맥락=N턴`).
- [ ] `이 고객 IRP 해지한대 ㅜ` 입력 → 큰따옴표 화법이 복사 버튼과 함께 표시되는지, "참고한 자료" 배지가 붙는지 확인합니다.
- [ ] 연계 제안이 나오면 **네** 버튼으로 다음 턴이 나가는지, 되묻기가 나오면 선택지 버튼으로 나가는지 확인합니다(실제 응답 형태는 [규격](integration/contracts/CHAT_AGENT_CONTRACT.md)과 대조).
- [ ] 헤더의 **고객 변경**을 누르면 식별자를 다시 묻고, 새 식별자로 시작하면 `session_id`가 바뀌는지 확인합니다. 다른 고객 화면으로 바꾸면 그 고객의 상담은 식별자부터 새로 시작하고, 원래 고객으로 돌아오면 이전 대화가 유지되는지 확인합니다.

우리 `customerId`(예: `54182-30764`)를 입력해 답하게 하려면 대화 Agent의 고객 저장소에 `agent/briefing_data.json`의 `customer_data` 31건이 같은 `customerId`로 들어가야 합니다.

## 6. 오류·화면 수명 확인

- [ ] 다른 고객 선택/요청 취소/화면 이동 시 늦은 응답이 현재 고객을 덮어쓰지 않습니다.
- [ ] 오류가 나면 이전에 수신한 브리핑이 있을 때만 유지하고 오류 안내를 표시합니다. **다시 요청**으로 재시도되는지 확인합니다.
- [ ] 실제 Shell/WebView에서 헤더 겹침·폰트·가로 넘침·스크롤·포커스를 확인합니다.

| 증상 | 먼저 확인할 것 |
|---|---|
| 401/403 | 토큰/클라이언트/Connector 권한 |
| OPTIONS 405 또는 fetch 실패 | 실제 Origin/CORS/네트워크/인증서. 브라우저 보안 우회 금지 |
| HTTP 422 | Agent 요청이 `{input_value: JSON문자열}`인지 |
| `AGENT` 오류 | Agent 로그의 안전한 코드 확인: INPUT/UNKNOWN_CASE/IDENTITY/SNAPSHOT/DATA |
| SNAPSHOT | 프론트와 Agent를 같은 고객 JSON 빌드 결과로 배포했는지. 묶음 교체 후 Agent 재시작/재배포 |
| VERSION/SCHEMA | 구버전 fact Agent 또는 계약/프론트 버전 불일치 |
| 200인데 계속 대기 | SSE 빈 줄 종료·완성된 answer·스트림 EOF 여부 |

서버는 `request_id/case_id/customer_id/as_of_date`를 그대로 반환합니다. 고객 데이터가 달라졌다고 기존 저장 문장을 재계산하지는 않습니다. 이 단계에서 데이터/브리핑을 고쳤다면 다시 빌드하고 양쪽을 재배포하세요.

## 7. 결과 기록 후 다음 작업

기록할 것: 날짜/Stage/Origin, 배포 tag, 파일코드, 사례 ID, 성공 여부, 안전한 오류 코드. 토큰/전체 헤더/실제 고객 데이터는 기록하지 않습니다.

연동 성공 뒤에는 고객 데이터·브리핑 내용 개선 → `briefing.py`의 저장된 내용 선택 부분을 실제 Agent 판단/문장 생성으로 교체합니다. 바깥 요청 검증·고정 응답·SSE 포장은 유지하는 방향으로 진행합니다. 운영 인증 방식과 금융 내용 검토는 별도 과제입니다.

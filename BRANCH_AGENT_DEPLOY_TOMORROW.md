# 내일 사내 확인 — 부점 AI 프론트·API·Python 배포

작업 기준: 2026-09-21. 기존 S1~S5 고정 Agent는 유지하고, 부점 AI는 `branch-agent/deploy/`를 별도 Agent로 배포한다. 이 문서는 부점 AI용이며 기존 고정 브리핑 배포 절차는 `COMPANY_DEPLOY_CHECKLIST.md`에 있다.

## 현재 배포 준비 판단

부점 배포 파일·Docker 실행 명령·Nexus 설치 설정은 준비됐다. 실제03 데이터로 stub 36개, 로컬 실제 HTTP/SSE, validation 없이 배포 파일만으로 기동하는 검사를 통과했다. Google 실제 `gemma-4-31b-it`108/108건과 실제 remote 프론트19/19단계도 통과했다. 문장 템플릿 대체 횟수·중간429 이력까지 [05 검사 기록](docs/handover/branch-agent/05-GOLDEN.md)에 구분했다.

**사내 배포 완료나 사내 호환 검증 완료는 아니다.** 사내 Python3.10 이미지 빌드(로컬 Docker daemon도 미가동), Nexus의 실제 설치 버전, 사내 Gemma deployment 매핑, Connector·WAS Origin·Starroot E2E는 내일 확인해야 한다. 로컬 패키지는 사용자 요청에 따라 공개 PyPI에서 격리 venv에 설치했다.

## 1. 먼저 HTML·CSS·JS 세 파일로 화면 확인

이번에 같은 build로 생성한 아래 세 파일을 반입한다. 각각 따로 옛 파일과 섞지 않는다.

| 용도 | 반입 파일 |
|---|---|
| 업무 페이지 | `frontend/briefing-fabrix/mnPensionAgentDemo.html` |
| 동작·고객 표시·manifest | `frontend/briefing-fabrix/pensionAgentDemo.js` |
| 스타일 | `frontend/briefing-fabrix/pensionAgentDemo.css` |

Node, npm, 프론트 원본 모듈, JSON 별도 URL, Google SDK는 WAS에 필요 없다. 생성 JS 안에 실제 manifest가 들어 있다. 현재 파일코드는 `1288272`다. 다른 파일코드는 반입 전에 개발 환경에서 `node tools/briefing/build.js <파일코드>`로 재생성한다.

HTML이 참조하는 JS/CSS 위치:

```text
/mnbank/app/html/bfe/asstmgt/asst/pensionAgentDemo.js
/mnbank/app/html/bfe/asstmgt/asst/pensionAgentDemo.css
```

1. 기존 세 파일의 원복 사본을 보관하고 새 파일을 교체한다.
2. Network에서 JS/CSS 응답이200인지, 실제 URL과 응답 크기가 이번 파일과 일치하는지 확인하고 캐시를 비운다.
3. Starroot가 `PG_1288272.onParam(params)`을 호출해야 한다. React/CDN/DOMContentLoaded 초기화를 추가하지 않는다.
4. 기본 57명(2026-09-21 모집단 변경, Google 골든 재실행 필요)·상단 KPI·기존 카드·상세 진입/복귀·우측 부점 대화창·작은 화면 스크롤을 확인한다.
5. 페이지 이탈 시 `onBeforeUnload()`로 요청/이벤트/위젯을 정리하고 재진입 시 위젯이 하나인지 확인한다.

API 설정 전에는 remote 연결 미설정 안내가 정상이다. 이 단계는 화면 반입 검사다. 검색 답변·추천·통계의 실제 API 연동까지 성공했다는 뜻이 아니다. 기존 S1~S5와 실시간 상담의 Agent 설정도 별도 유지한다.

## 2. 부점 API는 어디에 연결하나

```text
사내 프론트
  → 사내 FabriX base URL + /openapi/agent-chat/v1/agent-messages
  → 부점 전용 Connector/agentId
  → 신규 부점 Python Agent의 POST /chat
  → 기존 사내 Gemma endpoint와 인증
```

프론트의 `endpointUrl`은 **사내 FabriX base URL**이다. `/chat`까지 붙이거나 Google URL/로컬 `127.0.0.1:8766`을 사내 설정에 넣지 않는다. 실제 base URL·branch agentId·전용 토큰/클라이언트 값은 사내 Connector 등록 결과를 사용한다. 기존 S1~S5 Agent ID로 대신 연결하면 계약이 다르므로 실패한다.

화면 진입 시 기존 설정에 `fabrix.branch`를 추가해 런타임 주입한다. 다음 `runtime`은 사내에서 받은 실행 설정이며 실제 값을 소스/문서에 적지 않는다.

```js
PG_1288272.onParam({
  fabrix: {
    xClientUser: runtime.employeeId,
    branch: {
      endpointUrl: runtime.fabrixBaseUrl,
      agentId: runtime.branchAgentId,
      openapiToken: runtime.branchOpenapiToken,
      generativeAiClient: runtime.branchGenerativeAiClient
    }
  }
});
```

기존 상위 S1~S5 설정과 `fabrix.chat`이 있다면 함께 보존한다. 우선순위는 `params.fabrix.branch`, 다음은 `window.__PENSION_FABRIX_CONFIG.branch`다. 기본 transport는 remote다.

프론트가 보내는 것은 `contents:[JSON.stringify(inner)]`, `isStream:true`인 POST다. Connector는 이를 Agent에 `{input_value:"JSON 문자열",message_hists:null}`로 전달해야 한다. 부점 inner의 버전/task는 `branch-agent-api.v1` / `branch_assistant`다. 응답은 `text/event-stream`, Agent CHUNK를 FabriX가 `event_status`로 포장하고 정상 EOF 뒤에만 화면에 적용한다.

## 3. Python 배포 repo에는 무엇을 넣나

`branch-agent/deploy/`의 아래 **10개 파일을 사내 배포 repository 루트에 평면으로** 놓는다. 기존 `agent/` 파일과 섞지 않는다.

```text
Dockerfile
requirements.txt
main.py
llm_client.py
branch_models.py
branch_data.py
branch_query.py
branch_language.py
branch_service.py
branch_data.json
```

`validation/`, `.venv/`, `.local-results/`, 테스트 골든, Google 호출기, 프론트, 개발 도구, `.env`는 사내 이미지에 넣지 않는다. Dockerfile의 개별 COPY가 위 실행 파일 전부를 `/custom`으로 옮긴다.

실행 조건:

```text
사내 기본 이미지: cmheastggenaiacr01.azurecr.io/python:3.10
WORKDIR: /custom
CMD: uvicorn main:app --host 0.0.0.0 --port 8000
Stage: ARG ENV_FILE_PATH → ENV_PATH
```

`branch_data.json`을 열어 수기로 고치지 않는다. 프론트 내장 manifest와 같은 빌드 결과를 반입한다. 현재 data_version은 다음과 같다.

```text
b059980b851fdb92776fd0f2aba5f3d98c11e97c7cc8d0eb81d62d58e7152ec8
```

## 4. Python 패키지와 LLM 실행 설정

배포할 패키지 명세는 **`branch-agent/deploy/requirements.txt`**다. 로컬 Mac의 venv·wheel·site-packages를 복사하지 않는다. 사내 Docker 빌드가 Nexus에서 requirements와 전이 의존성을 설치한다.

| 직접 의존성 | 역할 |
|---|---|
| `pydantic>=2,<3` | 고정 외부 계약·내부 Plan 검증 |
| `fastapi` | `/health`, `/chat` |
| `uvicorn` | ASGI 서버 |
| `langchain-core` | 기존 메시지 타입 |
| `langchain-openai` | 기존 AzureChatOpenAI 호출 |
| `openai` | Azure 호환 SDK |

Google용 SDK는 쓰지 않으며 Google 호출기는 validation의 Python 표준 라이브러리 구현이다. 사내 requirements/Docker에 Google 전용 파일·패키지가 없다. 호출기는 기존 배포본과 같이 `/custom/.env`(배포 repo 루트의 `.env`를 Dockerfile이 복사)와 서버 환경변수를 읽는다. python-dotenv는 필요 없다. `.env`는 Git에 두지 않는다.

Nexus 주소는 Dockerfile에 유지했다.

```text
https://stg-nexus-genaihub.kbonecloud.com/repository/pypi/simple
```

로컬에서 설치·import를 확인한 버전은 FastAPI0.141.1, Uvicorn0.53.0, Pydantic2.13.4, langchain-core1.6.3, langchain-openai1.6.2, openai3.16.2 / Python3.13이다. **이 버전을 사내 설치 성공 버전으로 간주하거나 그대로 pin하지 않는다.** 내일 Nexus 설치 로그와 Python3.10 기동 결과를 확인한다.

| 환경변수 | 사내 설정 |
|---|---|
| `ENV_PATH` | `training` / `serving`에 따라 TRNN/SERV 선택 |
| `LLM_MODEL` | `gemma-4-31b-it` |
| `LLM_DEPLOYMENT_NAME` | 해당 모델에 연결된 사내 deployment 별칭. 미설정이면 기존 배포본과 같은 `gemma-4-31b-nvidia-fp4-h100` 사용 |
| `LLM_BASE_URL_TRNN`, `LLM_BASE_URL_SERV` | 기존 사내 Gemma endpoint. 공통 `LLM_BASE_URL`도 기존 우선순위로 지원 |
| `LLM_API_KEY_TRNN`, `LLM_API_KEY_SERV` | 해당 stage의 런타임 Secret. 공통 `LLM_API_KEY`도 기존 우선순위로 지원 |
| `LLM_API_VERSION` | 기존 기본값 문자열 `1` |

모델 ID와 Azure deployment 별칭은 다른 개념이다. 별칭 기본값은 기존 배포본 `llm_client.py`와 같은 `gemma-4-31b-nvidia-fp4-h100`이며 `LLM_DEPLOYMENT_NAME`으로 바꾼다. 기존 `kb-key`와 직원 식별자에 임의 suffix를 붙인 `x-client-user` 인증 방식은 유지한다. Google용 `GEMINI_API_KEY`는 사내에 설정할 필요 없다.

## 5. 배포할 때 확인할 순서

1. 사내 배포 repo 루트에 위10개 파일과 정확한 데이터 버전이 있는지 확인한다.
2. 사내 절차로 branch/tag를 반영하고 **원격 tag가 존재하는지** 확인한 후 Portal에서 해당 tag를 선택한다. GitHub main push는 사내 배포가 아니다.
3. Jenkins/Kaniko의 Nexus 설치 성공, 개별 COPY, 이미지 생성, rollout/Healthy를 확인한다. `ModuleNotFoundError`는 flat import·COPY·requirements부터 점검한다.
4. `/health`가 HTTP200이고 `mode=branch_assistant`, `data_loaded=true`, 설정 모델과 데이터/규칙 버전이 맞는지 확인한다. 데이터 누락/오류는503이다. health는 외부 LLM을 호출하지 않으므로 health 성공만으로 모델 연결을 판정하지 않는다.
5. 부점 전용 Connector에 새 Agent를 연결하고 실제 `/chat` 요청으로 Gemma 응답을 확인한다. 해석 즉시 progress, 최종 answer 또는 error 한 개, 정상 EOF인지 검사한다.
6. WAS의 실제 Origin에서 POST/CORS·SSE·UTF-8·timeout을 확인한다. 응답 원문/키/직원·고객 정보를 로그에 저장하지 않는다.
7. 화면에서 추천→브리핑→현황(목록 유지)→ISA 통계/대상 보기→검색/조건 제거→0명 복구→취소/재시도→새 대화를 실행한다. 상단/카드 구조와 keep일 때 목록 DOM이 유지되는지 확인한다.

전체 응답 제한은 프론트90초, 서버85초이며 각 LLM SDK/API 호출은20초·자동 SDK 재시도0회다. 해석 JSON 수정은 최대1회다. 취소는 이미 시작한 모델 호출을 강제 종료한다는 뜻이 아니며 늦은 결과는 적용하지 않는다.

오류를 만나면 `DATA_VERSION`은 프론트/Agent를 같은 빌드로 교체, `ACTION`/`STATE`는 새 대화·기존 목록 후 재확인, `LLM_TIMEOUT`은 모델 지연/연결, `LLM_OUTPUT`은 해석 실패를 확인한다. `INTERNAL`은 LLM 설정·인증·서버 상태를 확인하되 예외 원문·Secret을 화면/로그에 출력하지 않는다.

## 6. 로컬에서 다시 확인

서버·프론트 시작/종료와 검사 명령은 [validation README](branch-agent/validation/README.md)에 있다. 실제 Google 시연은 localhost8766의 동일 remote transport를 사용한다. 일반 정적 preview8765와 구별한다. 결과를 stub, Google live, 로컬 UI, 사내 E2E로 나누어 기록한다.

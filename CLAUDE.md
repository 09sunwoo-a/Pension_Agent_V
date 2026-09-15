# CLAUDE.md — 퇴직연금 Pro Agent (KB 사내망)

이 저장소는 **KB 사내망(내부망) 전용** 퇴직연금 상담지원 에이전트 프로젝트다.
공개 인터넷 환경의 관례(Public PyPI / OpenAI 공식 endpoint / React SPA / EventSource)를
그대로 적용하면 **거의 확실히 실패한다.**

작업을 시작하기 전에 반드시 `docs/platform/` 를 읽어라.

---

## 0. 먼저 읽을 것 (순서 고정)

| 순서 | 파일 | 목적 |
|---:|---|---|
| 1 | [`docs/platform/README.md`](docs/platform/README.md) | 전체 지도 · 작업 유형별 진입점 |
| 2 | [`docs/platform/01-INTERNAL_ENVIRONMENT.md`](docs/platform/01-INTERNAL_ENVIRONMENT.md) | 전체 아키텍처 · 금지 가정 |
| 3 | 작업 영역에 해당하는 문서 (아래 §4) | 상세 규격 |

원본 근거 문서는 `docs/platform/references/` 와 `frontend/platform/references/` 에
**수정 없이** 보관한다. 요약본과 원본이 충돌하면 **원본이 우선**이고, 요약본을 고쳐라.

---

## 1. 이 프로젝트의 3줄 요약

```text
1. Agent 내부 구현은 사내 Gemma / Docker / Fabrix 계약을 지킨다.

2. 배포는 Git tag → GenAI Portal → Jenkins/Kaniko → ACR → ArgoCD/K8s 흐름을 전제로 한다.

3. LLM은 문장만 생성하고, Python Backend가 Pydantic으로 구조를 고정한 뒤,
   Fabrix content를 통해 업무화면 JavaScript가 2단계 JSON parsing으로 사용한다.
```

전체 경로:

```text
Starroot 업무화면 (zmnbank.kbstar.com)
    ↓  fetch + ReadableStream (EventSource 아님)
Fabrix Agent Connector
    ↓  POST /openapi/agent-chat/v1/agent-messages
FastAPI Pro Agent (K8s, /custom, uvicorn main:app)
    ↓  llm_client.call()
사내 GenAI APIM → Gemma4
```

---

## 2. 절대 하지 말 것 (프로젝트 단위 금지 규칙)

이 규칙들은 실제로 장애를 일으킨 적이 있거나, 사내 환경 제약상 반드시 지켜야 하는 것이다.

### 백엔드 / 에이전트

- ❌ **패키지형 import 를 가정하지 마라.** Agent 소스는 `agent/` 디렉터리의 평면 구조이고
  컨테이너 WORKDIR은 `/custom` 이다. `from app.xxx import ...` 는 실제로
  `ModuleNotFoundError: No module named 'app'` → Pod 기동 실패 → rollback 을 일으켰다.
- ❌ 새 `.py` 파일을 추가하고 **Dockerfile `COPY` 를 빼먹지 마라.** 현재 Dockerfile은
  와일드카드가 아니라 **파일 단위 COPY** 다. 파일을 추가하면 `COPY` 줄도 추가해야 한다.
- ❌ 동작 중인 `agent/llm_client.py` 의 `call()` 인터페이스를 이유 없이 갈아엎지 마라.
  Agent 로직은 `agent/main.py` 에서 바꾼다.
- ❌ `deployment_name` 을 endpoint 마지막 path(`gemma-4`)로 추측하지 마라.
  실제 값은 `gemma-4-31b-nvidia-fp4-h100` 이다. **둘은 다르다.**
- ❌ 외부 PyPI를 가정하지 마라. 설치는 **사내 Nexus** 를 통해서만 이뤄진다.
- ❌ 다른 사내 프로젝트의 `requirements.txt` 버전을 부분 복사해 섞지 마라.
  (현재 프로젝트는 LangChain **1.x** 계열, 참고군은 **0.3.x** 계열 — 세대가 다르다.)
- ❌ **LLM에게 JSON/스키마/블록 구조를 생성시키지 마라.** LLM은 문장만 만든다.

### 프론트엔드 (Starroot SPA)

- ❌ React/번들러/CDN을 전제하지 마라. **HTML + CSS + Vanilla JS** 다.
- ❌ `DOMContentLoaded` 로 초기화하지 마라. 초기화는 **`PG_<파일코드>.onParam()`** 이다.
- ❌ `*`, `body`, `html`, `button`, `input` 에 전역 CSS를 쓰지 마라.
  모든 selector는 `#pensionAgentDemo` 하위로 namespace 한다.
- ❌ `<head>` 안 inline `<style>` 에 핵심 CSS를 넣지 마라. Starroot loader가 `<head>` 를 제거한다.
- ❌ 브라우저에서 Fabrix를 `EventSource` 로 부르지 마라. **`fetch` + `ReadableStream`** 이다.
- ❌ `window.1234567 = ...` 형태로 파일코드를 쓰지 마라 (`Unexpected number`).
  반드시 `window['PG_' + STARROOT_FILE_CODE]`.

### 보안 (예외 없음)

- ❌ **API Key / Fabrix Token / Client Secret 을 소스에 하드코딩하지 마라.**
  커밋하지도, 로그로 출력하지도, 문서에 적지도 마라.
- ❌ `.env` 를 커밋하지 마라. 변수 **이름**만 `agent/.env.example` 에 둔다.
- 브라우저 direct call이 기술적으로 동작하는 것과, 운영 보안상 정적 JS에 토큰을
  둬도 되는 것은 **전혀 다른 문제**다. 자세한 내용은 `docs/platform/06-SECURITY.md`.

---

## 3. 저장소 구조

```text
.
├── CLAUDE.md                       # ← 지금 이 파일
│
├── agent/                          # 실제 GenAI Portal에 배포되는 Agent 코드
│   ├── Dockerfile                  # 배포 시 이 디렉터리가 repo root 평면 구조가 된다
│   ├── main.py
│   ├── llm_client.py
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md
│
├── frontend/                       # Starroot 업무화면 + 프론트 환경
│   ├── app/
│   │   ├── mnPensionAgentDemo.html
│   │   ├── pensionAgentDemo.css
│   │   ├── pensionAgentDemo.js
│   │   └── local_preview.html
│   └── platform/
│       ├── STARROOT_FRONTEND_GUIDE.md
│       └── references/STARROOT_FRONTEND_CODING_GUIDE.md
│
├── integration/                    # Frontend ↔ Fabrix ↔ Agent
│   ├── fabrix/
│   │   ├── FABRIX_GUIDE.md
│   │   ├── fabrixClient.js         # 동작 확인된 참고 구현 (토큰 제거본)
│   │   └── README.md
│   └── contracts/
│       └── AGENT_FRONTEND_CONTRACT.md
│
├── agent-workbench/                # Case 설계 작업공간
│   └── case-design/
│       ├── active/                 # 현재 핵심 Case 제작물
│       │   ├── customer-data/      #   B01~B10 Golden Case 더미데이터
│       │   ├── display-data/       #   개별 Case JSON + all-customers.json + validation-report.md
│       │   └── briefings/          #   고객별 브리핑 MD
│       └── materials/              # Case 제작 재료
│           ├── schemas/
│           ├── case-candidates/
│           ├── source-maps/
│           ├── reference-cases/    # DEMO-01 김서연 참고본
│           └── domain-knowledge/
│               ├── products/       # PRODUCT_MASTER / PRODUCT_MATCHING_KB
│               └── strategy/       # 일반운용전략 Master KB
│
├── knowledge/                      # 원천 · 정제 업무지식 (RAG 원천)
│   ├── 01-original/                # 원본 (PDF · Script · HTML · 이미지 · xlsx)
│   ├── 02-source-md/               # 원문 MD/TXT 변환본
│   ├── 03-curated/                 # 주제별 정제 Knowledge
│   ├── registry/source_registry.md # 탐색 색인
│   └── README.md                   # ★ 사용 규칙. 먼저 읽는다
│
├── docs/
│   └── platform/                   # 사내 환경 기준 문서
│       ├── README.md
│       ├── 01-INTERNAL_ENVIRONMENT.md
│       ├── 02-AGENT_DEVELOPMENT.md
│       ├── 03-DEPLOYMENT_PIPELINE.md
│       ├── 04-REQUIREMENTS_POLICY.md
│       ├── 05-TROUBLESHOOTING.md
│       ├── 06-SECURITY.md
│       └── references/             # 원본 근거 문서 (수정 금지)
│
└── tools/
    └── case-design/
        └── generate_customer_display_data.js
```

> ⚠️ `agent/` 디렉터리는 **사내 GitLab에 올릴 때 repo root 평면 구조가 되어야 한다.**
> 이 저장소에서의 `agent/` 는 정리를 위한 디렉터리이고, 배포 시점의 컨테이너 경로는
> `/custom/main.py` 다. 자세한 내용은 `docs/platform/03-DEPLOYMENT_PIPELINE.md` §"디렉터리 매핑".

### knowledge/ 사용 규칙

`knowledge/` 아래 Source Corpus를 다룰 때는 **그 디렉터리의 자체 규칙**([`knowledge/README.md`](knowledge/README.md))이 우선한다. 요약:

```text
❌ Source Corpus 전체를 기본 Context로 읽지 않는다
✅ registry/source_registry.md 로 후보를 좁힌 뒤 필요한 원문/절만 확인한다
✅ Source에 명시된 내용과 Agent의 추론을 구분한다
❌ Source에 없는 업무 Fact를 생성하지 않는다
❌ 충돌하는 Source를 임의로 통합/해소하지 않는다
```

---

## 4. 작업 유형별 진입점

| 하려는 일 | 읽을 문서 | 건드릴 파일 |
|---|---|---|
| Agent 로직 추가/수정 | `docs/platform/02-AGENT_DEVELOPMENT.md`, `integration/contracts/AGENT_FRONTEND_CONTRACT.md` | `agent/main.py` |
| LLM 호출 방식 변경 | `docs/platform/02-AGENT_DEVELOPMENT.md` §Gemma 규격 | `agent/llm_client.py` |
| 패키지 추가 | `docs/platform/04-REQUIREMENTS_POLICY.md` | `agent/requirements.txt` + `agent/Dockerfile` |
| 배포 | `docs/platform/03-DEPLOYMENT_PIPELINE.md` | git tag → GenAI Portal |
| Fabrix 연동 | `integration/fabrix/FABRIX_GUIDE.md` + `integration/fabrix/fabrixClient.js` | `agent/main.py` (SSE) / 프론트 transport |
| 화면 수정 | `frontend/platform/STARROOT_FRONTEND_GUIDE.md` | `frontend/app/*` |
| Mock → 실제 Agent 교체 | `integration/fabrix/`, `frontend/platform/`, `integration/contracts/` | `frontend/app/pensionAgentDemo.js` |
| 케이스 설계 (DATA / Display / Briefing) | `agent-workbench/case-design/materials/` | `agent-workbench/case-design/active/*` |
| Display Data 재생성 | — | `tools/case-design/generate_customer_display_data.js` |
| 장애 분석 | `docs/platform/05-TROUBLESHOOTING.md` | — |

---

## 5. 변경 후 자가 점검

에이전트 코드를 건드렸다면 최소한 아래를 확인하고 보고하라.

```text
[ ] import가 평면 구조 기준인가 (app. 패키지 사용 안 함)
[ ] 새 .py 파일이 Dockerfile COPY에 포함됐는가
[ ] requirements 변경 시 사내 Nexus 설치 가능성을 검토했는가
[ ] LLM이 구조가 아니라 문장만 생성하는가
[ ] 출력이 Pydantic으로 고정되는가 (AGENT_FRONTEND_CONTRACT 준수)
[ ] SSE framing이 `data: {JSON}\n\n` 인가
[ ] Secret이 소스/로그/문서에 들어가지 않았는가
```

프론트를 건드렸다면:

```text
[ ] 초기화가 onParam 경로인가
[ ] CSS가 #pensionAgentDemo 하위로 제한되는가
[ ] destroy()에서 타이머/이벤트를 해제하는가
[ ] 전체 DOM 재생성 시 scroll/focus/caret을 보존하는가
```

---

## 6. 현재 검증 상태

검증된 것과 미검증인 것을 섞어서 말하지 마라. 최신 상태는 `docs/platform/README.md` §검증 현황.

요약: **Gemma 호출 · Agent SSE · Fabrix 전달 · Browser 2단계 parse · 배포 파이프라인은 검증됨.**
**프론트 Mock → 실제 Agent 교체, multi-turn, action 처리, SERV E2E는 미완료.**

# CLAUDE.md — 퇴직연금 Pro Agent (KB 사내망)

이 저장소는 **KB 사내망(내부망) 전용** 퇴직연금 상담지원 에이전트 프로젝트다.
공개 인터넷 환경의 관례(Public PyPI / OpenAI 공식 endpoint / React SPA / EventSource)를
그대로 적용하면 **거의 확실히 실패한다.**

작업을 시작하기 전에 반드시 `docs/environment/` 를 읽어라.

---

## 0. 먼저 읽을 것 (순서 고정)

| 순서 | 파일 | 목적 |
|---:|---|---|
| 1 | [`docs/environment/README.md`](docs/environment/README.md) | 전체 지도 · 작업 유형별 진입점 |
| 2 | [`docs/environment/01-사내환경-개요.md`](docs/environment/01-사내환경-개요.md) | 전체 아키텍처 · 금지 가정 |
| 3 | 작업 영역에 해당하는 02~09 문서 | 상세 규격 |

원본 근거 문서는 `docs/environment/sources/` 에 **수정 없이** 보관한다.
요약본(01~09)과 원본이 충돌하면 **원본이 우선**이고, 요약본을 고쳐라.

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

- ❌ `app/` 패키지 구조를 가정하지 마라. **Agent 소스는 repo root 평면 구조**이고
  컨테이너 WORKDIR은 `/custom` 이다. `from app.xxx import ...` 는 실제로
  `ModuleNotFoundError: No module named 'app'` → Pod 기동 실패 → rollback 을 일으켰다.
- ❌ 새 `.py` 파일을 추가하고 **Dockerfile `COPY` 를 빼먹지 마라.** 현재 Dockerfile은
  와일드카드가 아니라 **파일 단위 COPY** 다. 파일을 추가하면 `COPY` 줄도 추가해야 한다.
- ❌ 동작 중인 `llm_client.py` 의 `call()` 인터페이스를 이유 없이 갈아엎지 마라.
  Agent 로직은 `main.py` 에서 바꾼다.
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
  둬도 되는 것은 **전혀 다른 문제**다. 자세한 내용은 `09-보안-시크릿.md`.

---

## 3. 저장소 구조

```text
.
├── CLAUDE.md                  # ← 지금 이 파일
├── agent/                     # FastAPI Pro Agent (배포 대상 = 이 디렉터리의 평면 구조)
│   ├── Dockerfile
│   ├── main.py                # Fabrix 계약 · Agent 오케스트레이션 · 출력 계약 · SSE
│   ├── llm_client.py          # Gemma4 transport (AzureChatOpenAI)
│   ├── requirements.txt
│   └── .env.example           # 변수 이름만. 실제 값 금지.
├── app/                       # Starroot 업무화면 (Vanilla JS)
│   ├── mnPensionAgentDemo.html
│   ├── pensionAgentDemo.css
│   ├── pensionAgentDemo.js
│   └── local_preview.html
├── data/                      # 더미 고객 데이터 · 골든 케이스
├── docs/
│   ├── environment/           # ★ 사내 환경 기준 문서 (이 프로젝트의 Source of Truth)
│   │   ├── README.md
│   │   ├── 01-사내환경-개요.md
│   │   ├── 02-에이전트-개발.md
│   │   ├── 03-배포-파이프라인.md
│   │   ├── 04-Fabrix-연계.md
│   │   ├── 05-Starroot-프론트엔드.md
│   │   ├── 06-출력계약-Contract.md
│   │   ├── 07-requirements-정책.md
│   │   ├── 08-트러블슈팅.md
│   │   ├── 09-보안-시크릿.md
│   │   └── sources/           # 원본 근거 문서 (수정 금지)
│   ├── briefings/ · kb/ · specs/
└── scripts/
```

> ⚠️ `agent/` 디렉터리는 **사내 GitLab에 올릴 때 repo root 평면 구조가 되어야 한다.**
> 이 저장소에서의 `agent/` 는 정리를 위한 디렉터리이고, 배포 시점의 컨테이너 경로는
> `/custom/main.py` 다. 자세한 내용은 `03-배포-파이프라인.md` §"디렉터리 매핑".

---

## 4. 작업 유형별 진입점

| 하려는 일 | 읽을 문서 | 건드릴 파일 |
|---|---|---|
| Agent 로직 추가/수정 | 02, 06 | `agent/main.py` |
| LLM 호출 방식 변경 | 02 §Gemma 규격 | `agent/llm_client.py` |
| 패키지 추가 | 07 | `agent/requirements.txt` + `Dockerfile` |
| 배포 | 03 | git tag → GenAI Portal |
| Fabrix 연동 | 04 | `agent/main.py` (SSE) / 프론트 transport |
| 화면 수정 | 05 | `app/*` |
| Mock → 실제 Agent 교체 | 04, 05, 06 | `app/pensionAgentDemo.js` |
| 장애 분석 | 08 | — |

---

## 5. 변경 후 자가 점검

에이전트 코드를 건드렸다면 최소한 아래를 확인하고 보고하라.

```text
[ ] import가 평면 구조 기준인가 (app. 패키지 사용 안 함)
[ ] 새 .py 파일이 Dockerfile COPY에 포함됐는가
[ ] requirements 변경 시 사내 Nexus 설치 가능성을 검토했는가
[ ] LLM이 구조가 아니라 문장만 생성하는가
[ ] 출력이 Pydantic으로 고정되는가 (06 계약 준수)
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

검증된 것과 미검증인 것을 섞어서 말하지 마라. 최신 상태는 `docs/environment/README.md` §검증 현황.

요약: **Gemma 호출 · Agent SSE · Fabrix 전달 · Browser 2단계 parse · 배포 파이프라인은 검증됨.**
**프론트 Mock → 실제 Agent 교체, multi-turn, action 처리, SERV E2E는 미완료.**

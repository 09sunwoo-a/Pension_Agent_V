# 01. 사내 환경 개요

> 근거: `references/KB_GenAI_ProAgent_SourceOfTruth_v2.md` §0, §2, §20
> 이 문서는 **"공개 인터넷 환경과 무엇이 다른가"** 를 먼저 이해시키는 것이 목적이다.

---

## 1. 전체 경로

이 프로젝트는 하나의 웹앱이 아니라 **5개 계층을 지나는 체인**이다.
장애를 볼 때도 이 계층 순서로 쪼개서 봐야 한다.

```text
[개발]
GitLab repository (+ git tag)
    ↓
GenAI Portal            ← 배포 Control Plane (IDE 아님)
    ↓
Jenkins Pipeline
    ↓
Kaniko Docker Build
    ↓
사내 ACR
    ↓
ArgoCD
    ↓
Kubernetes

[런타임]
Starroot 업무화면 Browser JavaScript   (https://zmnbank.kbstar.com)
    ↓  fetch + ReadableStream
Fabrix Agent Connector
    ↓
FastAPI Pro Agent (K8s Pod, WORKDIR /custom)
    ↓  llm_client.call()
사내 GenAI APIM
    ↓
Gemma4 (gemma-4-31b-nvidia-fp4-h100)
```

---

## 2. 구성요소별 역할

| 구성요소 | 실제 역할 | 흔한 오해 |
|---|---|---|
| **GenAI Portal** | 배포 Control Plane / Orchestrator. Git tag를 골라 파이프라인을 태운다. | ❌ Agent 소스를 실행하는 IDE가 아니다 |
| **Jenkins** | checkout → Kaniko build → ACR push → ArgoCD YAML commit | — |
| **ArgoCD** | Deployment YAML을 K8s에 sync | ❌ Portal이 프로세스를 직접 띄우는 게 아니다 |
| **Fabrix** | 배포된 Custom Agent를 외부/업무화면에서 호출하게 해주는 **Agent Connector 계층** | ❌ **Fabrix endpoint ≠ Gemma endpoint** |
| **GenAI APIM** | 사내 LLM 게이트웨이. `kb-key` 인증 | ❌ OpenAI 공식 endpoint 규격이 아니다 |
| **사내 Nexus** | Python 패키지 저장소 | ❌ 외부 PyPI를 못 쓴다 |
| **Starroot** | 업무화면 SPA Shell. 업무 페이지를 동적 삽입 | ❌ 독립 HTML document가 아니다 |

---

## 3. 가정하면 안 되는 것 (금지 가정 목록)

이 목록은 원본 문서 §0의 핵심이다. 하나하나가 실제 실패 원인이다.

```text
❌ 외부 PyPI를 자유롭게 사용할 수 있다.
   → 사내 Nexus만 쓴다. 해당 패키지/버전이 Nexus에 있는지 먼저 확인.

❌ OpenAI 공식 endpoint 형식을 그대로 사용하면 된다.
   → AzureChatOpenAI + kb-key / x-client-user 커스텀 헤더 조합이다.

❌ Dockerfile을 수정하지 않고 Python 파일을 마음대로 추가할 수 있다.
   → 파일 단위 COPY다. 추가한 .py가 컨테이너에 안 들어가면 ModuleNotFoundError.

❌ Fabrix와 LLM endpoint가 같은 것이다.
   → 완전히 다른 계층이다.

❌ Browser에서 Fabrix를 호출하려면 EventSource를 사용해야 한다.
   → POST + 커스텀 헤더 + JSON body + stream 이므로 fetch + ReadableStream.

❌ LLM이 프론트 JSON 전체를 생성해야 한다.
   → LLM은 문장만. 구조는 Python Backend가 Pydantic으로 고정.

❌ 프론트는 React SPA다.
   → Starroot Shell 안의 HTML + CSS + Vanilla JS 모듈이다.
```

---

## 4. 책임 분리 원칙 (이 프로젝트의 핵심 설계)

```text
LLM       = 문장을 생성한다
Backend   = 구조를 결정한다
Frontend  = 표현을 결정한다
```

구체적으로:

| 계층 | 만드는 것 | 만들면 안 되는 것 |
|---|---|---|
| Gemma | `"실제 환급액은 고객의 결정세액에 따라 달라질 수 있습니다."` | `schema_version`, `blocks`, `type`, HTML, CSS |
| Python | `{"type": "caution", "text": "실제 환급액은 ..."}` | 색상/레이아웃 |
| JS | 노란 caution 박스 | — |

**왜 이렇게 하는가:**

```text
LLM 출력 변동
    ↓
JSON shape 변동
    ↓
Frontend parser 오류
```

이 연쇄를 끊기 위해서다. LLM이 아무리 이상한 문장을 뱉어도
`schema_version` 누락 / `blocks` 누락 / `block.type` 랜덤 값이
**프론트까지 도달하지 않게** 하는 것이 목표다.

자세한 계약은 [06-출력계약-Contract.md](../../integration/contracts/AGENT_FRONTEND_CONTRACT.md).

---

## 5. 계층별 경계 요약

작업할 때 "내가 지금 어느 계층을 건드리는가"를 항상 의식하라.

```text
┌─────────────────────────────────────────────┐
│ frontend/app/pensionAgentDemo.js (Starroot Vanilla) │  ← 05
│   fetch → SSE 파싱 → 2단계 JSON.parse         │  ← 04
│   → 어댑터 → 기존 renderer                    │  ← 06
└─────────────────────────────────────────────┘
                     ↓ HTTPS POST
┌─────────────────────────────────────────────┐
│ Fabrix Agent Connector                       │  ← 04
│   envelope: {event_status, content, ...}     │
└─────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────┐
│ agent/main.py                                │  ← 02
│   FabrixRequest → parse_input_value          │
│   → LLM 문장 slot → Pydantic 고정 조립         │  ← 06
│   → SSE `data: {JSON}\n\n`                   │  ← 04
└─────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────┐
│ agent/llm_client.py                          │  ← 02
│   AzureChatOpenAI + kb-key 헤더               │
└─────────────────────────────────────────────┘
```

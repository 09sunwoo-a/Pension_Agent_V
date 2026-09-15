# Pension_Agent_V

KB 사내망(내부망) 퇴직연금 AI 상담 에이전트 프로젝트.
에이전트 백엔드, Starroot 업무화면 프론트엔드, Fabrix 연동, 케이스 설계 작업공간, 지식 코퍼스, 사내 환경 기준 문서를 모아둔 저장소입니다.

> **개발/코딩 에이전트는 [`CLAUDE.md`](CLAUDE.md) 를 먼저 읽으세요.**
> 이 프로젝트는 공개 인터넷 환경의 관례(Public PyPI / OpenAI 공식 endpoint / React SPA / EventSource)를
> 그대로 적용하면 동작하지 않습니다.

## 프로젝트 전체 경로

```text
Starroot 업무화면 (zmnbank.kbstar.com)
    ↓  fetch + ReadableStream
Fabrix Agent Connector
    ↓
FastAPI Pro Agent (K8s)
    ↓
사내 GenAI APIM → Gemma4
```

## 저장소 구조 (최상위)

```
.
├── CLAUDE.md              ★ 코딩 에이전트 진입점
│
├── agent/                 실제 GenAI Portal에 배포되는 Agent 코드
├── frontend/              Starroot 업무화면 코드와 프론트 환경 자료
│   ├── app/                 mnPensionAgentDemo.html · pensionAgentDemo.{js,css} · local_preview.html
│   └── platform/            Starroot 개발 규칙 (+ references/ 원본 근거)
├── integration/           Frontend ↔ Fabrix ↔ Agent 통신·계약
│   ├── fabrix/              FABRIX_GUIDE.md · fabrixClient.js
│   └── contracts/           AGENT_FRONTEND_CONTRACT.md
├── agent-workbench/       Golden Case / 고객 DATA / Display Data / Briefing 설계 작업공간
│   └── case-design/
│       ├── active/          customer-data · display-data · briefings
│       └── materials/       schemas · case-candidates · source-maps · reference-cases · domain-knowledge
├── knowledge/             퇴직연금 지식 코퍼스
│   ├── 01-original/         원본 (PDF · Script · HTML · 이미지 · xlsx)
│   ├── 02-source-md/        원문 MD/TXT 변환본
│   ├── 03-curated/          주제별 정제 Knowledge
│   ├── registry/            source_registry.md
│   └── README.md            사용 규칙
├── docs/
│   └── platform/            사내 환경 기준 문서 (01~06 + references/)
└── tools/
    └── case-design/         generate_customer_display_data.js
```

## 빠른 시작

### 프론트엔드 데모

빌드 과정이 없습니다. `frontend/app/local_preview.html` 을 브라우저로 열면 바로 동작합니다.

```bash
open frontend/app/local_preview.html          # macOS
npx serve frontend/app                        # 또는 정적 서버
```

`frontend/app/mnPensionAgentDemo.html` 은 CSS/JS를 `/mnbank/app/...` 절대경로로 참조하므로
로컬에서 그대로 열면 스타일과 스크립트가 로드되지 않습니다. 로컬 확인은 `local_preview.html` 을 쓰세요.

> 현재 실시간 상담 UI는 **Mock(사전 정의 QA)** 입니다.
> 실제 Agent 연동은 다음 단계이며 설계는 [`integration/contracts/AGENT_FRONTEND_CONTRACT.md`](integration/contracts/AGENT_FRONTEND_CONTRACT.md) 에 있습니다.

### 에이전트

```bash
cd agent
cp .env.example .env     # 값 채우기 (커밋 금지)
uvicorn main:app --host 0.0.0.0 --port 8000
```

사내망 밖에서는 LLM 호출이 되지 않습니다. 자세한 내용은 [`agent/README.md`](agent/README.md).

### 고객 표시용 데이터 재생성

`agent-workbench/case-design/active/customer-data/` 의 마크다운 JSON 블록을 읽어
`agent-workbench/case-design/active/display-data/` 를 다시 만듭니다.

```bash
node tools/case-design/generate_customer_display_data.js
```

결과물: 고객별 JSON 30개, `all-customers.json`, 검증 결과 `validation-report.md`.

## 현재 상태

| 영역 | 상태 |
|---|---|
| Gemma4 호출 · Agent SSE · Fabrix 전달 · Browser 2단계 파싱 | ✅ 검증 |
| 배포 파이프라인 (git tag → Portal → Jenkins → ArgoCD → K8s) | ✅ 검증 |
| Starroot Vanilla 화면 구동 | ✅ 검증 |
| 프론트 Mock → 실제 Agent 교체 | ⏳ 다음 단계 |
| Multi-turn / action 처리 / SERV E2E | ⏳ 미확정 |

상세 현황은 [`docs/platform/README.md`](docs/platform/README.md#검증-현황).

## 주의

- 저장소에 포함된 고객 데이터는 전부 **더미 데이터**이며 실제 고객 정보가 아닙니다.
- 분석 기준일(`AS_OF_DATE`)은 생성 스크립트 상단에 상수로 정의되어 있습니다.
- **API Key / Fabrix Token / Client Secret 을 커밋하지 마세요.**
  → [`docs/platform/06-SECURITY.md`](docs/platform/06-SECURITY.md)

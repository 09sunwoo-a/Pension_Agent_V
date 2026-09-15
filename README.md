# Pension_Agent_V

KB 사내망(내부망) 퇴직연금 AI 상담 에이전트 프로젝트.
에이전트 백엔드, Starroot 업무화면 프론트엔드, 그리고 사내 환경 기준 문서를 모아둔 저장소입니다.

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

## 디렉터리 구조

```
.
├── CLAUDE.md                 # ★ 코딩 에이전트 진입점 (금지 규칙 · 작업별 가이드)
│
├── agent/                    # FastAPI Pro Agent (배포 대상)
│   ├── Dockerfile            #   Python 3.10 / 사내 Nexus / WORKDIR /custom
│   ├── main.py               #   Fabrix 계약 · 오케스트레이션 · 출력 계약 · SSE
│   ├── llm_client.py         #   Gemma4 transport (AzureChatOpenAI)
│   ├── requirements.txt
│   ├── .env.example          #   환경변수 이름만 (실제 .env 커밋 금지)
│   └── README.md
│
├── app/                      # Starroot 업무화면 (Vanilla JS, 빌드 없음)
│   ├── mnPensionAgentDemo.html  #   배포용 (/mnbank/... 절대경로)
│   ├── local_preview.html       #   로컬 미리보기 (상대경로)
│   ├── pensionAgentDemo.css
│   └── pensionAgentDemo.js
│
├── data/
│   ├── customer-display-data/   # 고객 30명 표시용 JSON + all-customers.json
│   └── golden-cases/            # B01~B10 골든 케이스 더미데이터 (생성 원천자료)
│
├── sources/                  # 퇴직연금 지식 코퍼스 (RAG 원천, 399 files)
│   ├── README.md             #   사용 규칙
│   ├── source_registry.md    #   탐색용 색인
│   └── corpus/
│
├── docs/
│   ├── environment/          # ★ 사내 환경 기준 문서 (Source of Truth)
│   │   ├── README.md         #   지도 · 검증 현황 · 다음 단계
│   │   ├── 01-사내환경-개요.md
│   │   ├── 02-에이전트-개발.md
│   │   ├── 03-배포-파이프라인.md
│   │   ├── 04-Fabrix-연계.md
│   │   ├── 05-Starroot-프론트엔드.md
│   │   ├── 06-출력계약-Contract.md
│   │   ├── 07-requirements-정책.md
│   │   ├── 08-트러블슈팅.md
│   │   ├── 09-보안-시크릿.md
│   │   ├── examples/         #   동작 확인된 참고 구현 (fabrixClient.js)
│   │   └── sources/          #   원본 근거 문서 (수정 금지)
│   ├── briefings/            # 고객 브리핑 MD (B01~B10)
│   ├── kb/                   # 상품 마스터 / 매칭 KB / 운용전략 KB
│   └── specs/                # 데이터 스키마 · 골든 케이스 통합본 · 출처맵
│
└── scripts/
    └── generate_customer_display_data.js
```

## 빠른 시작

### 프론트엔드 데모

빌드 과정이 없습니다. `app/local_preview.html` 을 브라우저로 열면 바로 동작합니다.

```bash
open app/local_preview.html          # macOS
npx serve app                        # 또는 정적 서버
```

`app/mnPensionAgentDemo.html` 은 CSS/JS를 `/mnbank/app/...` 절대경로로 참조하므로
로컬에서 그대로 열면 스타일과 스크립트가 로드되지 않습니다. 로컬 확인은 `local_preview.html` 을 쓰세요.

> 현재 실시간 상담 UI는 **Mock(사전 정의 QA)** 입니다.
> 실제 Agent 연동은 다음 단계이며 설계는 `docs/environment/06-출력계약-Contract.md` 에 있습니다.

### 에이전트

```bash
cd agent
cp .env.example .env     # 값 채우기 (커밋 금지)
uvicorn main:app --host 0.0.0.0 --port 8000
```

사내망 밖에서는 LLM 호출이 되지 않습니다. 자세한 내용은 [`agent/README.md`](agent/README.md).

### 고객 표시용 데이터 재생성

`data/golden-cases/` 의 마크다운 JSON 블록을 읽어 `data/customer-display-data/` 를 다시 만듭니다.

```bash
node scripts/generate_customer_display_data.js
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

상세 현황은 [`docs/environment/README.md`](docs/environment/README.md#검증-현황).

## ⚠️ `sources/` 가 두 개입니다

| 경로 | 내용 |
|---|---|
| `sources/` | 퇴직연금 **지식 코퍼스** (RAG 원천). 자체 사용 규칙은 [`sources/README.md`](sources/README.md) |
| `docs/environment/sources/` | 사내 환경 **원본 근거 문서** (수정 금지) |

## 주의

- 저장소에 포함된 고객 데이터는 전부 **더미 데이터**이며 실제 고객 정보가 아닙니다.
- 분석 기준일(`AS_OF_DATE`)은 생성 스크립트 상단에 상수로 정의되어 있습니다.
- **API Key / Fabrix Token / Client Secret 을 커밋하지 마세요.**
  → [`docs/environment/09-보안-시크릿.md`](docs/environment/09-보안-시크릿.md)

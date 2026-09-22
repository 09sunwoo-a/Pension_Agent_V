# agent/ — FastAPI Pro Agent

사내 GenAI Portal로 배포되는 퇴직연금 Pro Agent 소스다. 현재는 **LLM 없는 고정 브리핑 반환 모드**이며 `/chat`에서 `llm_client`를 import/호출하지 않는다.

> ⚠️ **이 디렉터리의 내용이 배포 repo의 root가 된다.**
> 사내 GitLab 배포 repository는 **평면(flat) 구조**이고,
> 컨테이너 WORKDIR은 `/custom` 이다. `app/` 패키지 구조가 아니다.
>
> ```text
> agent/main.py  →  (배포 repo) main.py  →  /custom/main.py
> ```
>
> 매핑 상세: [`../docs/platform/03-DEPLOYMENT_PIPELINE.md`](../docs/platform/03-DEPLOYMENT_PIPELINE.md) §3

## 파일

| 파일 | 역할 |
|---|---|
| `main.py` | FastAPI 요청, Pydantic 고정 envelope, 오류 처리, SSE |
| `briefing.py` | 엄격한 입력 파싱, case_id 조회, 고객 스냅샷 일치 검사, 공유 스키마 검사 |
| `briefing_data.json` | 42건 고객/브리핑(B 케이스 30건 + C01 12명, 기준일 2026-09-29) 및 공유 스키마를 포함하는 배포 생성물. 직접 수정 금지 |
| `llm_client.py` | Gemma4 transport (`AzureChatOpenAI` + `kb-key` 헤더). `call()` 인터페이스 유지 |
| `Dockerfile` | Python 3.10 / 사내 Nexus / `WORKDIR /custom` / `uvicorn main:app` |
| `requirements.txt` | 최소 의존성 |
| `.env.example` | 환경변수 **이름만**. 실제 `.env` 는 커밋 금지 |

## Endpoint

```text
GET  /health   → {"status": "ok", ...}
POST /chat     → SSE (text/event-stream), `data: {JSON}\n\n`
```

## 수정 전에 읽을 것

- [`../docs/platform/02-AGENT_DEVELOPMENT.md`](../docs/platform/02-AGENT_DEVELOPMENT.md) — 코드 구조 · Gemma 규격
- [`../integration/contracts/AGENT_FRONTEND_CONTRACT.md`](../integration/contracts/AGENT_FRONTEND_CONTRACT.md) — 출력 계약
- [`../docs/platform/04-REQUIREMENTS_POLICY.md`](../docs/platform/04-REQUIREMENTS_POLICY.md) — 패키지 추가 절차

## ⚠️ 새 `.py` 파일을 추가할 때

Dockerfile은 **파일 단위 `COPY`** 를 쓴다. Git에 추가하는 것만으로는 컨테이너에 들어가지 않는다.

```dockerfile
COPY ./output_schema.py /custom/output_schema.py    # ← 이 줄을 빼먹으면 ModuleNotFoundError
```

## 로컬 확인

저장소 루트에서 같은 빌드로 프론트와 Agent 자료를 준비한다. npm 추가 설치나 LLM 키는 필요하지 않다.

```bash
node tools/briefing/build.js
node tools/briefing/check.js --agent
```

`--agent`는 Python 고정 반환/SSE를 프론트 계약과 대조한다. Python에 FastAPI/Pydantic이 있으면 ASGI endpoint도 검사하고 없으면 HTTP 검사 SKIP을 표시한다. 패키지는 사내 requirements/Nexus 기준으로 준비한다.

Agent 기동은 이 디렉터리에서:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
curl localhost:8000/health
```

`/health` 기대값은 `mode: fixed_briefing`, `llm_enabled: false`, `case_count: 42`이다. `.env`는 현재 기동·Docker build에 필요하지 않다. LLM 호출 단독 테스트도 이 단계에서는 실행하지 않는다.

`/chat`은 기존 FabriX outer body `{input_value: JSON문자열, message_hists?: ...}`를 받는다. 내부 JSON은 프론트가 만드는 `customer-briefing-api.v1` 요청 그대로 사용한다. case_id만 받는 별도 간이 규격은 추가하지 않는다. `case_id/customer_id/as_of_date/customer_data`가 배포 묶음과 일치할 때 저장된 S1–S5를 반환하고 `request_id`는 요청마다 그대로 돌려준다.

입력 오류는 request_id가 포함된 error 이벤트로 반환한다. 식별 불가능한 잘못된 JSON은 `invalid-request`, 잘못된 outer body는 안전한 HTTP 422다. 원시 고객 입력/직원 ID/예외 본문을 로그에 출력하지 않는다. 자료를 바꾸면 같은 빌드 결과로 프론트와 Agent를 재배포한다.

## 배포

내일 실제 작업 순서는 루트의 [COMPANY_DEPLOY_CHECKLIST.md](../COMPANY_DEPLOY_CHECKLIST.md)에 정리했다. 이 디렉터리의 여섯 배포 파일을 사내 flat repo 루트에 놓고 tag를 push한 후 Portal에서 선택한다. GitHub main push가 사내 배포를 대신하지 않는다.

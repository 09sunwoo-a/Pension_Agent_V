# agent/ — FastAPI Pro Agent

사내 GenAI Portal로 배포되는 퇴직연금 Pro Agent 소스다.

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
| `main.py` | Fabrix 요청 계약, `input_value` 파싱, Agent 오케스트레이션, 출력 계약, SSE |
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

사내망 밖에서는 LLM 호출이 되지 않는다. 구조 확인만 가능하다.

```bash
cp .env.example .env        # 값 채우기 (커밋 금지)
uvicorn main:app --host 0.0.0.0 --port 8000
curl localhost:8000/health

# Gemma 연결 단독 테스트 (사내망 필요)
python llm_client.py
```

## 배포

```bash
git push origin <branch>
git tag v1.x
git push origin v1.x          # ← 빼먹으면 Jenkins checkout 실패
git ls-remote --tags origin   # 확인
# 이후 GenAI Portal에서 해당 tag 선택
```

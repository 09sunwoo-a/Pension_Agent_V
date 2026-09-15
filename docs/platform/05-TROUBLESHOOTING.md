# 08. 트러블슈팅

> 근거: `references/KB_GenAI_ProAgent_SourceOfTruth_v2.md` §19, §40
> + `../../frontend/platform/references/STARROOT_FRONTEND_CODING_GUIDE.md` §22
> 핵심: **증상이 나타난 계층과 원인이 있는 계층은 대개 다르다.** 계층을 쪼개서 봐라.

---

## 1. 계층 분리가 먼저다

```text
Browser (Starroot)
    ↓  ① CORS / fetch / SSE 파싱
Fabrix Connector
    ↓  ② auth / routing / agentId
FastAPI Agent
    ↓  ③ import / startup / 로직 / SSE framing
Gemma (APIM)
    ↓  ④ endpoint / deployment_name / kb-key
```

어느 계층인지 모르겠으면 **위에서부터 하나씩 고정**한다.

- Agent를 의심하면 → 프론트를 빼고 **Python client로 Fabrix 직접 호출**
- Fabrix를 의심하면 → Agent를 **LLM 없이 static 응답**으로 바꿔 보기
- Gemma를 의심하면 → `python llm_client.py` 단독 실행

---

## 2. Agent가 배포되지 않는다

이 순서로 본다.

```text
1. Jenkins Checkout
2. Docker Build
3. Container Startup Log      ← ★ 대부분 여기
4. ArgoCD
5. Health Check
```

### ⚠️ Health Check 실패 ≠ Health endpoint 문제

**실제 사고 사례:**

```text
from app.output_schema import ...    ← 평면 구조인데 package import
+ output_schema.py 를 Dockerfile에서 COPY 안 함
    ↓
ModuleNotFoundError: No module named 'app'
    ↓
Pod 기동 실패
    ↓
Progressing → Degraded → Health Check Timeout → rollback
```

Health Check 실패가 보인다고 health endpoint를 뜯지 마라.
**먼저 container log에서 startup 오류를 본다.**

```text
ModuleNotFoundError
ImportError
ValidationError
```

---

## 3. 증상별 표

| 증상 | 먼저 볼 것 | 문서 |
|---|---|---|
| `Couldn't find any revision to build` | remote에 tag가 push됐는가 (`git ls-remote --tags origin`) | [03](03-DEPLOYMENT_PIPELINE.md) §2 |
| `ModuleNotFoundError: No module named 'app'` | 평면 구조 import인가 / Dockerfile COPY 누락인가 | [02](02-AGENT_DEVELOPMENT.md) §1 |
| 새로 만든 모듈이 없다고 함 | Dockerfile에 `COPY` 줄을 추가했는가 | [02](02-AGENT_DEVELOPMENT.md) §1 |
| `pip install` 실패 | 사내 Nexus에 그 패키지/버전이 있는가 | [07](04-REQUIREMENTS_POLICY.md) |
| Pod이 `Degraded` | container startup log (import/의존성) | §2 |
| LLM 호출 401/403 | `kb-key` 헤더, stage별 API key | [02](02-AGENT_DEVELOPMENT.md) §3 |
| LLM 호출 404 | `deployment_name` 을 endpoint path로 추측하지 않았는가 | [02](02-AGENT_DEVELOPMENT.md) §3 ⚠️ |
| Fabrix 200인데 화면이 비어 있음 | 첫 CHUNK의 빈 `content` 를 거르는가 / 2단계 parse를 하는가 | [04](../../integration/fabrix/FABRIX_GUIDE.md) §6, §8 |
| 블록이 빈 칸으로 렌더 | `paragraph→p`, `text→x` 변환을 했는가 | [06](../../integration/contracts/AGENT_FRONTEND_CONTRACT.md) §4.3 ⚠️ |
| Browser `Failed to fetch` | Network 탭의 OPTIONS / POST / Origin / CORS 헤더 | §4 |
| `OPTIONS 405` | 그 origin에서 direct call이 차단된 것 | [04](../../integration/fabrix/FABRIX_GUIDE.md) §9 |
| 화면이 안 뜸 | `window.PG_<파일코드>` 존재 여부 | [05](../../frontend/platform/STARROOT_FRONTEND_GUIDE.md) §16 |
| `Unexpected number` | `window.숫자` 로 썼는가 → bracket notation | [05](../../frontend/platform/STARROOT_FRONTEND_GUIDE.md) §5 |
| 공통 UI가 깨짐 | 전역 CSS를 썼는가 → `#pensionAgentDemo` namespace | [05](../../frontend/platform/STARROOT_FRONTEND_GUIDE.md) §6 |
| streaming 중 화면 흔들림 | 전체 DOM 재렌더 빈도 / scroll·focus 보존 | [05](../../frontend/platform/STARROOT_FRONTEND_GUIDE.md) §9, §11 |
| 답변에 "작성해 드립니다" 같은 메타 발화 | **Prompt 품질 문제.** 구조를 고치지 마라 | [02](02-AGENT_DEVELOPMENT.md) §7 ⚠️ |

---

## 4. Browser `Failed to fetch`

Network 탭에서 확인한다.

```text
OPTIONS 요청이 갔는가 / 응답 코드는?
POST 요청이 갔는가 / 응답 코드는?
Origin 헤더 값
응답의 CORS 헤더 (Access-Control-Allow-*)
```

```text
OPTIONS 405  → 그 origin에서 direct call 차단
              zmnbank.kbstar.com 에서는 성공이 확인됨 → origin 정책 차이
```

CORS 결론을 일반화하지 마라. → [04](../../integration/fabrix/FABRIX_GUIDE.md) §9

---

## 5. Fabrix HTTP 문제 계층 분리

```text
Fabrix auth      ← x-openapi-token / x-generative-ai-client 유효한가
routing          ← endpoint URL / connector-id / agentId 맞는가
SSE              ← Agent가 text/event-stream 을 주는가
Agent logic      ← /chat 이 예외 없이 도는가
LLM              ← Gemma 호출이 되는가
```

Python client로 Fabrix를 직접 호출해 보면 브라우저/CORS 변수를 제거할 수 있다.
Agent를 **LLM 없이 static 응답**으로 잠깐 바꾸면 LLM 변수를 제거할 수 있다.

---

## 6. 프론트 화면이 안 뜰 때

```text
1) Network
   업무 HTML / CSS / JS 가 200 인가
   → JS가 Script가 아니라 XHR로 보이는 건 Starroot loader 특성. 오류 아님.

2) window.PG_<파일코드>          존재?
   → STARROOT_FILE_CODE 가 아직 'REPLACE_WITH_FILE_CODE' 는 아닌가

3) window.__PensionVanilla       존재?
   window.PensionAgentDemoInstance 존재?

4) onParam 진입 로그

5) Elements → Computed
   font-family / position / top / height / overflow / display

6) Shell DOM
   .browserHeader / .pt-perspective / .pt-page-current
```

---

## 7. 보고할 때

```text
✅ 어느 계층에서 끊겼는지
✅ 실제 로그/응답 원문 (Secret 제외)
✅ 검증한 것과 추정인 것의 구분

❌ "아마 CORS 문제일 것"만 말하고 끝내기
❌ Secret이 포함된 로그를 그대로 붙여넣기
```

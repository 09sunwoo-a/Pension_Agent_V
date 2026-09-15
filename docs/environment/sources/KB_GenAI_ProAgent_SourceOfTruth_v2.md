# KB GenAI Pro Agent 실전 개발·배포·Fabrix·프론트 연계 Source of Truth

> 목적  
> 이 문서는 **KB 사내 GenAI Pro Agent를 실제로 개발하고, GenAI 포털을 통해 배포한 뒤, Fabrix Agent Connector를 이용해 업무화면 JavaScript와 연계하는 작업**을 다른 AI가 이어받을 수 있도록 정리한 실전 기준 문서다.
>
> 이 문서의 범위는 아래 3가지다.
>
> 1. **에이전트 내부 로직 코딩 — 사내 환경에 맞게**
> 2. **GenAI 포털을 통한 배포**
> 3. **Fabrix를 통한 사내 업무화면 JavaScript 연계**
>
> 일반적인 인터넷상의 Azure OpenAI / FastAPI / SSE 관례보다, 이 문서에 적힌 **실제 검증 결과**를 우선한다.
>
> 실제 API Key, Fabrix Token, Client Secret 등 Secret 값은 이 문서에 포함하지 않는다. 다른 AI도 Secret을 소스에 하드코딩하거나 출력하지 않는다.

---

# 0. 다른 AI가 가장 먼저 알아야 할 것

이 프로젝트는 일반적인 공개 인터넷 환경이 아니다.

현재 확인된 환경은 다음과 같다.

```text
GitLab repository
    ↓
GenAI Portal에서 Agent 배포 요청
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
    ↓
FastAPI Pro Agent
    ↓
Fabrix Agent Connector
    ↓
업무화면 Browser JavaScript
```

LLM 호출도 외부 OpenAI API가 아니라 **사내 GenAI APIM을 통해 Gemma4를 호출**한다.

따라서 다른 AI는 아래를 가정하면 안 된다.

```text
❌ 외부 PyPI를 자유롭게 사용할 수 있다.
❌ OpenAI 공식 endpoint 형식을 그대로 사용하면 된다.
❌ Dockerfile을 수정하지 않고 Python 파일을 마음대로 추가할 수 있다.
❌ Fabrix와 LLM endpoint가 같은 것이다.
❌ Browser에서 Fabrix를 호출하려면 EventSource를 사용해야 한다.
❌ LLM이 프론트 JSON 전체를 생성해야 한다.
```

---

# 1. 현재 프로젝트의 실제 코드 구조

현재 Agent Git repository는 package형 `app/` 구조가 아니다.

현재 기준:

```text
project-root/
├─ .env
├─ Dockerfile
├─ llm_client.py
├─ main.py
└─ requirements.txt
```

중요:

```text
✅ main.py는 repository root에 있다.
✅ llm_client.py도 repository root에 있다.
✅ uvicorn은 main:app으로 실행한다.

❌ app/main.py 구조가 아니다.
❌ app.output_schema 같은 package import를 임의로 사용하면 안 된다.
```

실제 배포 컨테이너의 작업 디렉터리는 `/custom`이었다.

```text
/custom/
├─ .env
├─ main.py
├─ llm_client.py
└─ requirements.txt
```

따라서 새 Python 파일을 추가할 경우 반드시 Dockerfile이 그 파일을 컨테이너에 복사하는지도 확인한다.

예:

```text
output_schema.py를 Git에 추가
```

했다고 해서 자동으로 컨테이너에 들어가는 것이 아니다.

현재 Dockerfile이 파일 단위 `COPY`를 사용한다면:

```dockerfile
COPY ./output_schema.py /custom/output_schema.py
```

도 필요하다.

---

# 2. GenAI 포털은 어떤 역할을 하는가

현재 프로젝트에서 확인된 GenAI 포털의 핵심 역할은 **Agent 소스 자체를 실행하는 IDE가 아니라 배포 Control Plane / Orchestrator 역할**이다.

관찰된 실제 흐름:

```text
개발자
  ↓
GitLab repository / tag
  ↓
GenAI Portal에서 배포 설정
  ↓
Jenkins Pipeline 실행
  ↓
Docker Build
  ↓
Container Registry
  ↓
ArgoCD Application 생성/갱신
  ↓
Kubernetes Deployment
  ↓
Health Check
  ↓
Agent 사용 가능
```

즉 다른 AI가 Agent 내부 코드를 작성할 때는 단순히 Python 코드가 실행되는지만 볼 것이 아니라:

```text
Git repository 구조
Docker COPY
requirements 설치
uvicorn entrypoint
container health
Fabrix contract
```

까지 함께 맞춰야 한다.

---

# 3. 실제 Docker / Build 환경

Jenkins 배포 로그에서 확인된 Training build의 핵심 구조는 다음과 같다.

```dockerfile
FROM cmheastggenaiacr01.azurecr.io/python:3.10

ARG ENV_FILE_PATH
ENV ENV_PATH=$ENV_FILE_PATH

WORKDIR /custom

COPY ./requirements.txt /custom/requirements.txt

RUN pip install \
  --no-cache-dir \
  --index-url https://stg-nexus-genaihub.kbonecloud.com/repository/pypi/simple \
  --trusted-host stg-nexus-genaihub.kbonecloud.com \
  -r /custom/requirements.txt

COPY ./.env /custom/.env
COPY ./main.py /custom/main.py
COPY ./llm_client.py /custom/llm_client.py

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 핵심 제약

### Python

```text
Python 3.10
```

### 패키지 Repository

외부 PyPI가 아니라 사내 Nexus를 사용한다.

```text
https://stg-nexus-genaihub.kbonecloud.com/repository/pypi/simple
```

따라서 새로운 패키지를 추가할 때:

```text
"pip install 하면 되겠지"
```

라고 가정하면 안 된다.

사내 Nexus에 해당 패키지/버전이 존재하는지 확인해야 한다.

---

# 4. 현재 실제 설치 확인된 주요 패키지

Jenkins 로그 기준:

```text
fastapi           0.139.2
uvicorn           0.51.0
pydantic          2.13.4
langchain-core    1.3.2
langchain-openai  1.2.1
openai            2.47.0
python-dotenv     1.2.2
```

따라서 현재 코드에서는 Pydantic v2 API 사용이 가능하다.

예:

```python
model.model_dump()
Model.model_validate_json(...)
```

---

# 5. Agent 내부 로직 — 반드시 지켜야 할 계층

권장 책임 분리는 아래와 같다.

```text
main.py
│
├─ Fabrix request contract
├─ input_value parsing
├─ Agent orchestration
├─ Frontend output contract
└─ SSE response
        │
        v
llm_client.py
│
├─ 사내 Gemma endpoint
├─ 인증 header
├─ AzureChatOpenAI
└─ LLM transport
```

핵심 원칙:

```text
main.py       = Agent / Fabrix / Frontend 계약
llm_client.py = Gemma transport
```

기존에 성공한 `llm_client.py`를 특별한 이유 없이 새 OpenAI client 구현으로 교체하지 않는다.

---

# 6. Gemma4 실제 호출 규격

현재 STG TRNN에서 실제 성공한 호출 조합:

```text
Client:
langchain_openai.AzureChatOpenAI

Endpoint:
https://cm-hea-genai-stg-apim.azure-api.net/trnn/gemma-4

Deployment Name:
gemma-4-31b-nvidia-fp4-h100

OpenAI API Version:
"1"
```

Custom headers:

```text
kb-key
x-client-user
```

대표 패턴:

```python
headers = {
    "kb-key": api_key,
    "x-client-user": f"{user_id}-{random_suffix}",
}

llm = AzureChatOpenAI(
    openai_api_version="1",
    deployment_name="gemma-4-31b-nvidia-fp4-h100",
    streaming=False,
    stream_usage=True,
    default_headers=headers,
    api_key=api_key,
    azure_endpoint=(
        "https://cm-hea-genai-stg-apim.azure-api.net/trnn/gemma-4"
    ),
    model_kwargs={
        "extra_headers": headers,
    },
    max_tokens=max_tokens,
)
```

## 가장 중요한 함정

```text
Endpoint path:
gemma-4

Deployment name:
gemma-4-31b-nvidia-fp4-h100
```

둘은 다르다.

다른 AI가 endpoint 마지막 path를 보고:

```python
deployment_name = "gemma-4"
```

로 추정하면 안 된다.

---

# 7. `llm_client.py`를 수정하기 전에 확인할 것

현재 프로젝트의 성공한 client는 `call()` 인터페이스를 유지하는 형태다.

대표적으로:

```python
call(
    messages,
    system="",
    model="",
    max_tokens=1024,
    x_client_user="",
)
```

다른 AI는 우선 현재 `llm_client.py`를 읽고 이 인터페이스를 유지한다.

권장:

```text
기존 LLM transport를 재사용
↓
main.py에서 Agent logic만 수정
```

비권장:

```text
main.py 안에서 새로운 OpenAI client를 또 구현
```

---

# 8. FastAPI Agent 기본 계약

Agent는 최소 다음 endpoint를 갖는다.

```text
GET  /health
POST /chat
```

## `/health`

간단한 readiness 확인용.

```python
@app.get("/health")
def health():
    return {
        "status": "ok"
    }
```

## `/chat`

Fabrix에서 들어오는 요청을 받는다.

기본 request model:

```python
class FabrixRequest(BaseModel):
    input_value: str
    message_hists: list | None = None
```

---

# 9. `input_value`는 문자열이다

Fabrix → Agent 구간에서 핵심은 `input_value`가 문자열이라는 점이다.

현재 프로젝트에서는 그 문자열 안에 다시 JSON을 넣는 방식을 사용한다.

예:

```json
{
  "message": "IRP 세액공제 한도가 얼마야?",
  "x_client_user": "3901317"
}
```

이 객체를 문자열화해서 전달한다.

Agent 쪽에서는:

```python
def parse_input_value(raw: str):
    try:
        parsed = json.loads(raw)

        if isinstance(parsed, dict):
            return parsed

    except Exception:
        pass

    return {
        "message": raw
    }
```

처럼 방어적으로 처리하는 것이 좋다.

---

# 10. Frontend용 출력 구조는 LLM이 결정하지 않는다

현재 프로젝트에서 중요한 설계 결정:

```text
LLM은 문장만 생성한다.
출력 구조는 Python Backend가 고정한다.
```

즉 LLM에게 아래를 생성하게 하지 않는다.

```text
schema_version
answer_type
event
blocks
block.type
action.type
CSS
HTML
```

이유:

```text
LLM 출력 변동
↓
JSON shape 변동
↓
Frontend parser 오류
```

를 방지하기 위해서다.

---

# 11. 권장 Agent Output 구조

Frontend와의 계약은 Pydantic으로 고정한다.

예:

```python
class Block(BaseModel):
    type: Literal[
        "paragraph",
        "caution",
    ]

    title: str | None = None
    text: str
    items: list[str] = Field(
        default_factory=list
    )


class AgentAnswer(BaseModel):
    schema_version: Literal["1.0"] = "1.0"
    answer_type: Literal["fact"] = "fact"

    lead: str
    blocks: list[Block]
    followups: list[str]


class AnswerEvent(BaseModel):
    event: Literal["answer"] = "answer"
    data: AgentAnswer
```

LLM은 오직:

```text
lead
detail
caution
```

같은 content slot에 들어갈 문자열만 생성한다.

Python이:

```python
answer = AgentAnswer(
    schema_version="1.0",
    answer_type="fact",
    lead=lead,
    blocks=[
        Block(
            type="paragraph",
            text=detail,
        ),
        Block(
            type="caution",
            text=caution,
        ),
    ],
    followups=[],
)
```

처럼 조립한다.

---

# 12. 현재 Pydantic 전송 검증 결과

다음 흐름은 실제로 성공했다.

```text
Python Pydantic Object
        ↓
model_dump()
        ↓
json.dumps()
        ↓
Agent SSE content
        ↓
Fabrix
        ↓
Browser
        ↓
content 문자열
        ↓
JSON.parse()
```

실제 Browser에서 다음 형태가 그대로 도달했다.

```json
{
  "event": "answer",
  "data": {
    "schema_version": "1.0",
    "answer_type": "fact",
    "lead": "김서연 고객은 ...",
    "blocks": [
      {
        "type": "list",
        "title": "이 고객 기준 공제 구조",
        "text": null,
        "items": [
          "기본 세액공제 잔여한도 500만원"
        ]
      },
      {
        "type": "paragraph",
        "title": null,
        "text": "...",
        "items": []
      },
      {
        "type": "caution",
        "title": null,
        "text": "...",
        "items": []
      }
    ],
    "followups": []
  }
}
```

따라서:

```javascript
const agentEvent =
    JSON.parse(event.content);
```

로 Frontend에서 정상 파싱 가능하다는 것이 확인됐다.

---

# 13. 현재 LLM Content 생성 테스트 결과

현재 다음 구조도 기술적으로 성공했다.

```text
사용자 질문
    ↓
Gemma
    ├─ lead 문장
    ├─ detail 문장
    └─ caution 문장
    ↓
Python fixed template
    ↓
Pydantic
    ↓
Fabrix
    ↓
Browser
```

즉:

```text
LLM content slot 생성      ✅
Python fixed contract      ✅
Pydantic                   ✅
Fabrix 전달                ✅
Browser 전달               ✅
```

다만 현재 prompt에서는 Gemma가:

```text
"작성해 드립니다."
"저는 ... 도와드립니다."
```

같은 메타 설명을 생성한 사례가 있다.

따라서 앞으로 content prompt는:

```text
사용자 질문에 직접 답한다.
자신의 역할이나 작성 행위를 설명하지 않는다.
"작성하겠습니다", "도와드립니다" 같은 메타 표현을 쓰지 않는다.
```

를 명시해야 한다.

이것은 **구조 문제는 아니며 Prompt 품질 문제**다.

---

# 14. Agent → Fabrix SSE 규격

FastAPI Agent가 Fabrix로 반환할 때 현재 성공한 구조:

```python
payload = {
    "event": "CHUNK",
    "content": agent_content,
    "references": [],
    "recommend_queries": [],
    "actions": [],
}
```

SSE framing:

```python
yield (
    "data: "
    + json.dumps(
        payload,
        ensure_ascii=False,
    )
    + "\n\n"
)
```

Response:

```python
return StreamingResponse(
    generate(),
    media_type="text/event-stream",
)
```

핵심:

```text
data: {JSON}\n\n
```

형식이 실제 Fabrix를 통해 정상 동작했다.

---

# 15. Agent `content` 필드에 무엇을 넣는가

처음에는:

```text
"안녕하세요"
```

같은 plain text를 넣었다.

현재는 Frontend 제어를 위해 JSON 문자열을 넣는 방식이 검증됐다.

예:

```python
agent_content = json.dumps(
    AnswerEvent(data=answer).model_dump(),
    ensure_ascii=False,
)
```

그리고:

```python
payload = {
    "event": "CHUNK",
    "content": agent_content,
    ...
}
```

따라서 Fabrix `content`는:

```text
"{\"event\":\"answer\",\"data\":{...}}"
```

형태의 JSON string을 전달한다.

---

# 16. 배포 — Git에서 Portal까지

실제 배포의 시작점은 GitLab repository와 Git tag다.

대표 흐름:

```text
code 수정
↓
git commit
↓
git push
↓
git tag
↓
git push origin <tag>
↓
GenAI Portal에서 해당 tag 선택
↓
배포
```

예:

```bash
git add .
git commit -m "update agent output contract"

git push origin <branch>

git tag v1.4
git push origin v1.4
```

## 중요

Portal에서 tag를 지정했지만 remote GitLab에 tag가 없으면 Jenkins checkout이 실패한다.

실제 발생했던 오류:

```text
Couldn't find any revision to build
```

따라서 Portal 배포 전에:

```bash
git ls-remote --tags origin
```

등으로 tag 존재 여부를 확인하는 것이 좋다.

---

# 17. Jenkins에서 실제로 일어나는 일

관찰된 Pipeline 흐름:

```text
1. Jenkins Agent Pod 생성

2. Agent source repository checkout
   - 특정 Git tag checkout

3. Kaniko로 Training image build

4. 사내 ACR에 image push

5. Serving Docker build job 실행

6. ArgoCD source checkout

7. Agent deployment YAML 생성

8. ArgoCD Git repository에 YAML commit / push

9. ArgoCD sync

10. Kubernetes Deployment rollout

11. Health Check

12. 성공 또는 자동 rollback
```

Training build 예:

```text
/kaniko/executor
  --context .
  --dockerfile ./Dockerfile
  --destination <ACR>/<agent-image>:training
  --build-arg ENV_FILE_PATH=training
  --cache=false
```

---

# 18. ArgoCD / Kubernetes 단계

Portal/Jenkins는 Agent deployment를 직접 프로세스로 띄우는 것이 아니라:

```text
Deployment YAML
↓
ArgoCD
↓
Kubernetes
```

흐름으로 반영한다.

상태 예:

```text
Missing
↓
Progressing
↓
Healthy
```

문제가 있으면:

```text
Degraded
```

로 전환될 수 있다.

---

# 19. 실제 실패 사례 — Python import

실제 발생한 오류:

```text
ModuleNotFoundError:
No module named 'app'
```

원인:

```python
from app.output_schema import ...
```

를 사용했지만 실제 container는:

```text
/custom/main.py
/custom/llm_client.py
```

구조였기 때문이다.

또 `output_schema.py` 자체도 Dockerfile에서 COPY하지 않았다.

이 실패 이후 Kubernetes Pod가 정상 기동하지 못했고:

```text
Progressing
↓
Degraded
↓
Health Check Timeout
↓
rollback
```

으로 이어졌다.

즉:

```text
Health Check failure
```

가 보인다고 해서 Health endpoint 자체 문제라고 단정하지 말 것.

먼저 container log에서:

```text
Python import
dependency
startup exception
```

을 확인한다.

---

# 20. 배포 후 Fabrix는 무엇인가

Fabrix는 **배포된 Custom Agent를 외부/업무화면에서 호출할 수 있도록 연결하는 Agent Connector 계층**으로 보면 된다.

구조:

```text
Browser / Python Client
        ↓
Fabrix Agent Connector
        ↓
Deployed FastAPI Agent
        ↓
Agent Logic
        ↓
Gemma
```

주의:

```text
Fabrix Endpoint != Gemma Endpoint
```

---

# 21. Fabrix Agent Connector 호출 URL

패턴:

```text
{FABRIX_ENDPOINT_URL}
/openapi/agent-chat/v1/agent-messages
```

예시 host pattern:

```text
https://stg-fabrix-catalog-apim-trnn-genaihub.kbonecloud.com/prod/kb0/<connector-id>/1
```

최종:

```text
https://.../<connector-id>/1/openapi/agent-chat/v1/agent-messages
```

---

# 22. Fabrix Request Headers

현재 검증된 header:

```http
Content-Type: application/json

x-openapi-token:
Bearer <FABRIX_OPENAPI_TOKEN>

x-generative-ai-client:
<FABRIX_GENERATIVE_AI_CLIENT>
```

실제 token을 static source에 저장하지 않는다.

---

# 23. Fabrix Request Body

현재 검증된 body:

```json
{
  "agentId": 1234,
  "contents": [
    "{\"message\":\"질문\",\"x_client_user\":\"직원ID\"}"
  ],
  "llmConfig": {},
  "isStream": true
}
```

핵심:

```text
contents는 배열
contents[0]은 JSON 객체가 아니라 JSON 직렬화 문자열
```

JavaScript:

```javascript
const inner = {
  message: question,
  x_client_user: X_CLIENT_USER
};

const payload = {
  agentId: AGENT_ID,
  contents: [
    JSON.stringify(inner)
  ],
  llmConfig: {},
  isStream: true
};
```

---

# 24. 사내 업무화면 Browser에서 Fabrix 호출 검증

실제 업무화면 origin:

```text
https://zmnbank.kbstar.com
```

에서 Browser JavaScript → Fabrix direct call을 실행했고 성공했다.

결과:

```text
HTTP 200 OK

Content-Type:
text/event-stream; charset=utf-8
```

따라서 현재 확인된 경로:

```text
zmnbank Browser
↓
Fabrix
↓
Agent
↓
Gemma
↓
Fabrix SSE
↓
Browser
```

는 동작한다.

---

# 25. Browser CORS 관련 주의

다른 Browser origin에서 Fabrix를 직접 호출했을 때:

```text
OPTIONS 405
```

가 발생한 사례가 있다.

반면:

```text
https://zmnbank.kbstar.com
```

에서는 성공했다.

따라서 정확한 결론은:

```text
Fabrix Browser direct call 가능 여부는 Origin/CORS 정책에 따라 다르다.
zmnbank.kbstar.com origin은 현재 direct call 성공이 확인됐다.
```

이다.

다른 AI가:

```text
"Fabrix는 Browser에서 무조건 안 된다"
```

또는:

```text
"어떤 Browser에서도 된다"
```

라고 단정하면 안 된다.

---

# 26. Browser에서 실제 받은 Fabrix Event 구조

실제 Console에서 확인된 event 예:

```json
{
  "event_status": "CHUNK",
  "content": "...",
  "status": "SUCCESS",
  "result_code": "FR-200",
  "orchestrator_type": "custom",
  "model_type": "GPT-OSS",
  "references": [],
  "recommend_queries": [],
  "actions": []
}
```

그 외 관찰된 필드:

```text
id
parent_message_id
parent_message_created_at
chat_id
user_id
catalogs
files
plugins
prompt_token
completion_token
finish_reason
response_code
truncated
```

Frontend가 모든 필드를 사용할 필요는 없다.

실질적으로 중요한 필드:

```text
event_status
content
status
result_code
references
recommend_queries
actions
```

---

# 27. 첫 Fabrix CHUNK는 비어 있을 수 있다

실제 첫 event:

```json
{
  "event_status": "CHUNK",
  "content": ""
}
```

형태가 관찰됐다.

따라서 JS에서는:

```javascript
if (!event.content) {
  continue;
}
```

같이 빈 content를 무시해야 한다.

---

# 28. Browser에서는 EventSource가 아니라 fetch를 사용한다

Fabrix 요청은:

```text
POST
custom headers
JSON body
stream response
```

이므로 `EventSource`보다:

```text
fetch + ReadableStream
```

을 사용한다.

대표:

```javascript
const response = await fetch(
  url,
  {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      "x-openapi-token": `Bearer ${OPENAPI_TOKEN}`,
      "x-generative-ai-client": GENERATIVE_AI_CLIENT,
    },

    body: JSON.stringify(payload),
  }
);
```

---

# 29. SSE 읽기

대표 코드:

```javascript
const reader =
  response.body.getReader();

const decoder =
  new TextDecoder("utf-8");

let buffer = "";

while (true) {

  const {
    value,
    done
  } = await reader.read();

  if (done) break;

  buffer += decoder.decode(
    value,
    {
      stream: true
    }
  );

  const chunks =
    buffer.split("\n\n");

  buffer =
    chunks.pop() || "";

  for (const chunk of chunks) {

    const line =
      chunk
        .split("\n")
        .find(
          line =>
            line.startsWith("data:")
        );

    if (!line) continue;

    const raw =
      line
        .replace(/^data:\s*/, "")
        .trim();

    if (!raw) continue;

    const event =
      JSON.parse(raw);
  }
}
```

---

# 30. Fabrix JSON과 Agent JSON은 2단계로 파싱한다

Fabrix outer event:

```json
{
  "event_status": "CHUNK",
  "content": "{\"event\":\"answer\",\"data\":{...}}"
}
```

따라서:

```javascript
const fabrixEvent =
  JSON.parse(raw);

const agentEvent =
  JSON.parse(
    fabrixEvent.content
  );
```

두 단계 parsing을 한다.

구조적으로:

```text
Fabrix Envelope
    ↓
content
    ↓
우리 Agent Contract
```

로 분리된다.

이 분리는 의도적으로 유지하는 것이 좋다.

---

# 31. JavaScript에서 실제 사용할 최소 필드

권장:

```javascript
if (
  fabrixEvent.event_status === "CHUNK"
  && fabrixEvent.content
) {

  const agentEvent =
    JSON.parse(
      fabrixEvent.content
    );

  if (
    agentEvent.event === "answer"
  ) {

    const answer =
      agentEvent.data;

    // UI render
  }
}
```

---

# 32. 현재 pensionAgentDemo 프론트 구조

업무화면 HTML:

```text
mnPensionAgentDemo.html
```

JS:

```text
pensionAgentDemo.js
```

HTML에서는 실제 배포 path로:

```html
<link
  rel="stylesheet"
  href="/mnbank/app/css/bfe/pension/pensionAgentDemo.css"
/>

<script
  id="PENSION_AGENT_DEMO"
  src="/mnbank/app/js/bfe/pension/pensionAgentDemo.js"
></script>
```

형태를 사용한다.

---

# 33. 현재 화면 renderer 구조

`pensionAgentDemo.js`는 별도의 React/Vue보다는 자체 경량 상태/Template renderer 구조다.

큰 흐름:

```text
Component
↓
state
↓
renderVals()
↓
Template interpolation
↓
DOM render
```

주요 함수:

```text
Component
renderVals()
agSend()
agMatch()
agRun()
agVals()
```

---

# 34. 현재 실시간 상담은 Mock이다

현재 흐름:

```text
사용자 입력
↓
agSend()
↓
agMatch()
↓
agRun()
↓
QA.answers
↓
agVals()
↓
화면
```

즉 현재 Agent처럼 보이는 UI는 실제 LLM 호출이 아니라 미리 정의한 QA / script를 사용한다.

---

# 35. 실제 Agent 연계 시 권장 변경 위치

기존 renderer를 버리지 않는다.

추천:

```text
agSend()
↓
callFabrixAgent()
↓
parseFabrixSSE()
↓
JSON.parse(content)
↓
normalizeAgentAnswer()
↓
state.agChat
↓
기존 agVals()
↓
기존 UI
```

핵심:

```text
Transport만 교체
Response Adapter 추가
Renderer는 최대한 유지
```

---

# 36. 현재 프론트가 이미 지원하는 답변 UI

현재 화면은 이미 다음 유형을 표현할 수 있다.

```text
paragraph
list
steps
quote
message
table
caution
memory
link
event card
```

또:

```text
lead
source badge
evidence
guard
follow-up
CTA
```

영역도 존재한다.

따라서 Agent output을 설계할 때 기존 UI capability에 맞춰 Backend에서 안정적인 contract를 만들면 된다.

---

# 37. Agent / Backend / Frontend 책임 분리

가장 중요한 원칙:

```text
LLM
= 문장을 생성

Backend
= 구조를 결정

Frontend
= 표현을 결정
```

예:

LLM:

```text
"실제 환급액은 고객의 결정세액에 따라 달라질 수 있습니다."
```

Backend:

```json
{
  "type": "caution",
  "text": "실제 환급액은 ..."
}
```

Frontend:

```text
노란 caution box
```

따라서 LLM이 아래를 생성하게 하지 않는다.

```json
{
  "backgroundColor": "#FFF3C2",
  "html": "<div>...</div>"
}
```

---

# 38. Frontend Contract는 Pydantic으로 강제한다

Frontend에서:

```text
"어떤 필드가 올지 모르겠다"
```

상태가 되면 안 된다.

Backend에서:

```python
AgentAnswer(...)
```

생성 단계에서 structure를 확정한다.

LLM 출력이 이상하더라도:

```text
schema_version 누락
blocks 누락
block.type 랜덤
```

이 Frontend까지 전달되지 않게 한다.

---

# 39. Secret 처리

실제 다음 값은 Secret이다.

```text
LLM API Key
Fabrix OpenAPI Token
Fabrix Generative AI Client
기타 Client Secret
```

주의:

Browser direct call이 기술적으로 동작하더라도 정적 JS에 token을 하드코딩하면 DevTools에서 노출된다.

따라서 운영 설계에서는 별도 보안정책을 확인해야 한다.

현재 확인된 사실:

```text
기술적으로 Browser direct call 성공
```

과:

```text
운영 보안상 token 노출 허용
```

은 같은 의미가 아니다.

---

# 40. 문제 해결 순서

## Agent가 배포 안 되는 경우

먼저:

```text
Jenkins Checkout
Docker Build
Container Startup Log
ArgoCD
Health Check
```

순서로 본다.

## Python startup failure

예:

```text
ModuleNotFoundError
ImportError
ValidationError
```

가 있는지 먼저 확인.

## Fabrix HTTP 문제

Python caller / static Agent response로 계층 분리.

```text
Fabrix auth
routing
SSE
Agent logic
LLM
```

을 따로 본다.

## Browser `Failed to fetch`

Network tab에서:

```text
OPTIONS
POST
Origin
CORS response headers
```

를 확인.

---

# 41. 다른 AI가 Agent 코딩 전에 반드시 읽어야 할 파일

다른 세션의 AI에게 아래 파일을 같이 제공하는 것을 권장한다.

## Agent 코드

### 1. `Dockerfile`

목적:

```text
container filesystem 구조
COPY 대상
WORKDIR
requirements 설치
uvicorn entrypoint
```

확인.

### 2. `main.py`

목적:

```text
FabrixRequest
/chat
SSE
Agent output contract
```

확인.

### 3. `llm_client.py`

목적:

```text
Gemma endpoint
AzureChatOpenAI config
headers
call() interface
```

확인.

### 4. `requirements.txt`

목적:

```text
사용 가능 library
Pydantic / LangChain version
```

확인.

### 5. `.env`

다른 AI에게 실제 secret 값은 제공하지 않는다.

필요한 것은:

```text
환경변수 이름
stage 분기 구조
```

뿐이다.

Secret은 마스킹한다.

---

# 42. Frontend 작업 전에 반드시 읽어야 할 파일

### 6. `pensionAgentDemo.js`

특히:

```text
Component
agSend
agMatch
agRun
agVals
renderVals
```

를 읽는다.

### 7. `mnPensionAgentDemo.html`

특히 실시간 상담 영역의:

```text
agMsgs
blocks
follow-up
CTA
```

렌더링 구조를 확인한다.

---

# 43. 다른 AI에게 권장하는 시작 지시문

다음 프롬프트와 함께 이 MD와 코드를 넘기면 된다.

```text
먼저 `KB_GenAI_ProAgent_실전개발_배포_Fabrix_프론트연계_SourceOfTruth.md`
전체를 읽어라.

이 문서의 VERIFIED 규격을 일반적인 Azure/OpenAI/FastAPI 관례보다 우선하라.

그 다음 아래 순서로 실제 코드를 읽어라.

1. Dockerfile
2. main.py
3. llm_client.py
4. requirements.txt
5. pensionAgentDemo.js
6. mnPensionAgentDemo.html

현재 Agent repository는 root-level main.py / llm_client.py 구조다.
app/ package 구조라고 가정하지 마라.

새 Python 파일을 추가할 경우 Dockerfile COPY 대상에 포함되는지 반드시 확인하라.

LLM은 프론트 JSON 구조를 생성하지 않는다.
LLM은 자연어 content만 생성하고,
Python Backend가 Pydantic으로 Frontend Contract를 고정한다.

Agent → Fabrix 응답은 SSE `data: {JSON}\n\n` 규격을 유지한다.

Fabrix Browser response의 `content`에는 우리 Agent JSON 문자열이 들어가므로
Frontend에서는 Fabrix JSON → content JSON 순서로 2단계 parse한다.

기존 pensionAgentDemo renderer를 재작성하지 말고,
Fabrix transport와 response adapter를 추가하는 방향을 우선한다.
```

---

# 44. 현재 상태 요약

| 항목 | 상태 |
|---|---|
| Gemma4 STG TRNN 호출 | ✅ 검증 |
| `AzureChatOpenAI` 호출 | ✅ 검증 |
| FastAPI `/chat` | ✅ 검증 |
| Agent SSE framing | ✅ 검증 |
| Git tag 기반 배포 | ✅ 검증 |
| Jenkins / Kaniko Build | ✅ 확인 |
| ACR push | ✅ 확인 |
| ArgoCD / Kubernetes rollout | ✅ 확인 |
| Fabrix Python 호출 | ✅ 검증 |
| zmnbank Browser → Fabrix | ✅ 검증 |
| Fabrix `content` 전달 | ✅ 검증 |
| Pydantic JSON → Browser | ✅ 검증 |
| Browser `JSON.parse(content)` | ✅ 검증 |
| Backend fixed output contract | ✅ 검증 |
| Gemma plain-text slot 생성 | ✅ 호출 성공 |
| Gemma prompt 품질 | ⚠ 개선 필요 |
| 실제 pensionAgentDemo Mock → Fabrix 교체 | ⏳ 다음 단계 |
| Multi-turn/session | ⏳ 미확정 |
| Action 처리 | ⏳ 미확정 |
| SERV End-to-End | ⏳ 미검증 |

---

# 45. 참고 소스

이 문서는 아래 자료와 실제 테스트 결과를 기반으로 작성됐다.

## A. 현재 업무화면 HTML

파일:

```text
mnPensionAgentDemo(1).html
```

확인한 내용:

```text
- pensionAgentDemo.js 실제 업무화면 로딩 path
- 실시간 상담 UI
- agMsgs / blocks / follow-up / CTA 렌더링
```

## B. 현재 업무화면 JavaScript

파일:

```text
pensionAgentDemo(1).js
```

확인한 내용:

```text
- 자체 Component / state / renderVals 구조
- 현재 Mock Agent 구조
- agSend / agMatch / agRun
- agVals
- 기존 UI block renderer
```

## C. Jenkins / Agent Deployment Log

파일:

```text
붙여넣은 텍스트 (1)(20260915-045251).txt
```

확인한 내용:

```text
- Git tag checkout
- Python 3.10 base image
- /custom WORKDIR
- 사내 Nexus
- requirements 설치 버전
- Docker COPY 대상
- uvicorn main:app
- Kaniko build
- ACR push
- ArgoCD YAML 생성
- Kubernetes rollout
- Health check / rollback
- ModuleNotFoundError 사고 사례
```

## D. 직접 수행한 Fabrix Browser 테스트

확인한 내용:

```text
Origin:
https://zmnbank.kbstar.com

결과:
HTTP 200 OK
text/event-stream

Fabrix event_status:
CHUNK

Agent content:
정상 수신
```

## E. 직접 수행한 Pydantic TEST1

확인한 내용:

```text
Pydantic
→ JSON string
→ SSE content
→ Fabrix
→ Browser

구조 보존 성공
```

## F. 직접 수행한 Fixed Template TEST2

확인한 내용:

```text
Gemma plain text
→ Python fixed Pydantic template
→ Fabrix
→ Browser

Frontend structure 고정 성공
```

---

# 46. 최종 기준

이 프로젝트에서 가장 중요한 개발 원칙은 아래 세 줄이다.

```text
1. Agent 내부 구현은 사내 Gemma / Docker / Fabrix 계약을 지킨다.

2. 배포는 Git tag → GenAI Portal → Jenkins/Kaniko → ACR → ArgoCD/K8s 흐름을 전제로 한다.

3. LLM은 문장만 생성하고, Python Backend가 Pydantic으로 구조를 고정한 뒤,
   Fabrix content를 통해 업무화면 JavaScript가 2단계 JSON parsing으로 사용한다.
```

이 세 가지를 깨지 않는 범위에서 Agent logic, RAG, LangGraph, MCP, Tool Calling 등을 확장한다.

---

# 47. 다른 사내 Agent 프로젝트의 `requirements.txt` 참고군

> **분류: REFERENCE**
>
> 아래 내용은 현재 프로젝트의 Jenkins에서 직접 설치 확인한 버전이 아니라,  
> **다른 사내 Agent 프로젝트들의 `requirements.txt`에서 확인한 실제 사용 예시**다.
>
> 따라서 이 목록을 현재 프로젝트에 그대로 복사하지 않는다.
>
> 우선순위는 다음과 같다.
>
> ```text
> 1. 현재 프로젝트 Jenkins에서 실제 설치 성공한 버전
> 2. 현재 프로젝트의 기존 requirements.txt
> 3. 다른 사내 Agent 프로젝트 requirements.txt
> 4. 인터넷상의 일반 패키지 예시
> ```
>
> 특히 LangChain / LangGraph / OpenAI SDK / Pydantic은 상호 의존성이 크므로  
> **한 프로젝트의 버전 세트를 통째로 참고하는 것은 가능하지만, 여러 프로젝트의 버전을 섞어 임의 조합하지 않는다.**

## 47.1 참고군 A — LangChain 0.3.27 / LangGraph 0.4.8 계열

다른 사내 Agent 프로젝트에서 확인한 예:

```txt
# =====================================
# FastAPI (Fabrix deployment)
# =====================================
fastapi==0.115.12
uvicorn==0.38.0

# =====================================
# LangChain (Azure OpenAI integration)
# =====================================
langchain==0.3.27
langchain-community==0.3.27
langchain-core==0.3.72
langchain-openai==0.3.28

# =====================================
# LangGraph
# =====================================
langgraph==0.4.8
langgraph-checkpoint==2.0.26
langgraph-sdk==0.1.70
langsmith==0.4.42

# =====================================
# Core Dependencies
# =====================================
openai==1.98.0
python-dotenv==1.2.1
pydantic==2.12.5
pydantic_core==2.41.5

# =====================================
# HTTP & Async
# =====================================
httpx==0.28.1
httpcore==1.0.9
h11==0.16.0
anyio==4.11.0
sniffio==1.3.1

# =====================================
# JSON & Data
# =====================================
jsonpatch==1.33
jsonpointer==3.0.0
orjson==3.11.4
PyYAML==6.0.3
pandas==2.3.2

# =====================================
# Utilities
# =====================================
requests==2.32.5
requests-toolbelt==1.0.0
qrcode==8.2
pillow==12.0.0
tenacity==9.1.2
tqdm==4.67.1
holidays==0.77

# =====================================
# Type / compatibility
# =====================================
typing_extensions==4.15.0
typing-inspection==0.4.2
annotated-types==0.7.0

# =====================================
# Compression / Encoding
# =====================================
ormsgpack==1.9.1
xxhash==3.5.0
zstandard==0.25.0

# =====================================
# System
# =====================================
certifi==2025.11.12
charset-normalizer==3.4.4
idna==3.11
urllib3==2.5.0
packaging==25.0
distro==1.9.0
colorama==0.4.6
nest-asyncio==1.6.0
jiter==0.12.0
```

이 참고군은 다음 성격의 Agent에 적합한 구성으로 보인다.

```text
FastAPI
+ AzureChatOpenAI
+ LangChain 0.3.x
+ LangGraph 0.4.x
+ Pydantic 2.x
```

현재 프로젝트에서 LangGraph를 도입할 경우 가장 먼저 참고할 만한 사내 버전군이다.

---

## 47.2 참고군 B — MCP / Langfuse / Scheduler / Data 처리 확장

다른 사내 Agent 프로젝트에서 추가로 확인한 패키지:

```txt
langchain_mcp_adapters==0.1.7
python-mcp-sdk==0.5.0

scikit-learn==1.5.1

langchain_openai==0.3.28

langfuse==3.2.2
apscheduler==3.11.0

openpyxl==3.1.5
psutil==7.1.3
lxml==6.0.2
```

용도별로 보면:

```text
langchain_mcp_adapters
python-mcp-sdk
    → MCP Server / Tool 연결

langfuse
    → LLM trace / observability

apscheduler
    → Agent 내부 batch / scheduled job

scikit-learn
    → clustering / ML utility

openpyxl
    → Excel 처리

psutil
    → process / resource monitoring

lxml
    → XML / HTML parsing
```

현재 프로젝트에서 필요하지 않으면 추가하지 않는다.

---

## 47.3 참고군 C — 또 다른 LangChain / LangGraph 버전 조합

다른 프로젝트에서는 아래 조합도 확인됐다.

```txt
fastapi==0.115.12
uvicorn==0.34.2
python-dotenv==1.1.0

langchain==0.3.23
langchain-community==0.3.21
langchain-core==0.3.58
langchain-openai==0.3.14
langchain-text-splitters==0.3.8

langgraph==0.4.1

langfuse==3.2.2
ragas==0.2.14

pandas
openpyxl
numpy==1.26.4
```

즉 사내에서도 아래처럼 하나의 고정된 버전 조합만 사용되는 것은 아니다.

```text
프로젝트 A:
LangChain 0.3.27
LangGraph 0.4.8
langchain-openai 0.3.28

프로젝트 B:
LangChain 0.3.23
LangGraph 0.4.1
langchain-openai 0.3.14
```

따라서:

```text
"사내 표준 LangGraph 버전은 0.4.8이다"
```

처럼 단정하면 안 된다.

---

# 48. 현재 프로젝트에서 requirements를 다룰 때의 원칙

현재 프로젝트 Jenkins에서 직접 확인된 설치 버전은 이 문서 앞부분에 기록된 값이 기준이다.

예:

```text
FastAPI           0.139.2
Uvicorn           0.51.0
Pydantic          2.13.4
LangChain Core    1.3.2
LangChain OpenAI  1.2.1
OpenAI            2.47.0
```

이는 **현재 배포 시점에 실제 사내 Nexus에서 설치된 결과**다.

반면 다른 프로젝트의 requirements는 대부분:

```text
LangChain 0.3.x
LangChain OpenAI 0.3.x
OpenAI 1.x
```

계열이다.

따라서 두 버전군 사이에는 큰 세대 차이가 있다.

## 48.1 다른 프로젝트 requirements를 현재 프로젝트에 그대로 복사하지 말 것

예를 들어 현재 프로젝트에서:

```text
langchain-openai 1.2.1
openai 2.47.0
```

가 이미 설치되고 있는데,

다른 프로젝트를 보고 갑자기:

```text
langchain-openai==0.3.28
openai==1.98.0
```

로 내리면 기존 `AzureChatOpenAI` 코드와 동작 차이가 생길 수 있다.

따라서 패키지 추가가 필요한 경우:

```text
현재 환경 유지
↓
필요한 패키지만 최소 추가
↓
사내 Nexus에서 설치 여부 확인
↓
Jenkins build 확인
```

순서로 진행한다.

---

# 49. 기능별 추천 requirements 판단표

| 기능 | 현재 필수 여부 | 참고 패키지 |
|---|---:|---|
| FastAPI Agent | 필수 | `fastapi`, `uvicorn` |
| Gemma/Azure 호출 | 필수 | `langchain-openai`, `langchain-core`, `openai` |
| Pydantic output contract | 필수 | `pydantic` |
| `.env` 로딩 | 현재 사용 | `python-dotenv` |
| LangGraph orchestration | 선택 | `langgraph`, `langgraph-checkpoint`, `langgraph-sdk` |
| MCP Tool 연결 | 선택 | `langchain_mcp_adapters`, `python-mcp-sdk` |
| Langfuse tracing | 선택 | `langfuse` |
| Scheduler | 선택 | `apscheduler` |
| RAG 평가 | 선택 | `ragas` |
| Excel | 선택 | `openpyxl`, `pandas` |
| ML/Clustering | 선택 | `scikit-learn` |
| XML/HTML parsing | 선택 | `lxml` |
| 시스템 모니터링 | 선택 | `psutil` |

현재 목표가:

```text
Agent 내부 로직
→ 배포
→ Fabrix
→ JS Frontend
```

라면 최소 requirements는 대략 아래 기능만 필요하다.

```text
FastAPI
Uvicorn
Pydantic
python-dotenv
langchain-core
langchain-openai
openai
```

LangGraph / MCP / Langfuse 등은 Agent 로직 요구사항이 생길 때 추가한다.

---

# 50. LangGraph를 추가할 경우 다른 AI가 확인해야 할 것

현재 다른 사내 프로젝트에서 LangGraph 사용 예가 확인됐으므로  
향후 복잡한 Agent flow가 필요하면 LangGraph 사용 자체는 사내 환경상 가능한 것으로 참고할 수 있다.

확인된 버전 예:

```text
langgraph==0.4.8
langgraph-checkpoint==2.0.26
langgraph-sdk==0.1.70
```

또 다른 프로젝트:

```text
langgraph==0.4.1
```

하지만 현재 프로젝트에 추가할 때는:

```text
1. 현재 langchain-core / langchain-openai 버전 확인
2. 호환되는 langgraph 버전 확인
3. 사내 Nexus 존재 여부 확인
4. requirements 변경
5. Jenkins build 검증
```

순서를 지킨다.

다른 AI가 단순히:

```txt
langgraph==0.4.8
```

한 줄을 추가하고 끝내면 안 된다.

---

# 51. MCP를 추가할 경우 참고 가능한 사내 패키지

다른 사내 프로젝트에서 확인:

```txt
langchain_mcp_adapters==0.1.7
python-mcp-sdk==0.5.0
```

따라서 MCP 연계 구현이 필요할 경우 이 조합을 참고할 수 있다.

다만 현재 프로젝트의 핵심 연계:

```text
Browser
→ Fabrix
→ Agent
→ Gemma
```

에는 MCP가 필수는 아니다.

MCP는 Agent 내부에서:

```text
DB
업무 시스템
검색
사내 Tool
```

등을 호출해야 할 때 추가한다.

---

# 52. requirements 변경 시 배포 관점 체크리스트

requirements.txt를 수정하면 단순 Python 코드 수정보다 영향 범위가 크다.

다른 AI는 다음을 반드시 체크한다.

```text
[ ] package가 사내 Nexus에 존재하는가
[ ] 기존 package와 version conflict가 없는가
[ ] Docker build에서 pip install 성공하는가
[ ] import path가 현재 버전 API와 맞는가
[ ] container startup이 성공하는가
[ ] /health가 Healthy인가
[ ] Fabrix 호출이 기존대로 동작하는가
```

특히:

```text
LangChain
LangGraph
OpenAI SDK
Pydantic
```

은 함께 버전 영향을 받기 쉬우므로 변경 시 한 묶음으로 본다.

---

# 53. 다른 AI에게 추가로 줄 requirements 관련 지시

다른 AI에게 이 문서와 requirements.txt를 함께 줄 때 아래 지시를 포함하는 것을 권장한다.

```text
현재 프로젝트의 requirements.txt와 Jenkins에서 실제 설치된 버전을 우선하라.

문서의 다른 사내 프로젝트 requirements는 REFERENCE다.

LangChain/LangGraph/OpenAI/Pydantic 버전을
다른 프로젝트에서 부분적으로 복사해 임의 조합하지 마라.

새 패키지를 추가할 때는 사내 Nexus 설치 가능성과
현재 Docker/Jenkins build를 기준으로 판단하라.

현재 Gemma4 호출이 정상 동작하는 llm_client.py와
그 dependency version set을 깨지 않는 방향을 우선하라.
```



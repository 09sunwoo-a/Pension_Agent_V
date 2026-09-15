# 07. requirements / 패키지 정책

> 근거: `sources/KB_GenAI_ProAgent_SourceOfTruth_v2.md` §4, §47~§53
> 핵심: **외부 PyPI가 아니라 사내 Nexus다. 그리고 다른 프로젝트 버전을 섞지 마라.**

---

## 1. 패키지 저장소

```text
https://stg-nexus-genaihub.kbonecloud.com/repository/pypi/simple
```

```dockerfile
RUN pip install --no-cache-dir \
    --index-url https://stg-nexus-genaihub.kbonecloud.com/repository/pypi/simple \
    --trusted-host stg-nexus-genaihub.kbonecloud.com \
    -r /custom/requirements.txt
```

```text
❌ "pip install 하면 되겠지"
✅ 해당 패키지/버전이 사내 Nexus에 존재하는지 먼저 확인
```

---

## 2. 현재 프로젝트에서 실제 설치 확인된 버전

Jenkins 빌드 로그 기준. **이것이 이 프로젝트의 기준값이다.**

```text
Python            3.10

fastapi           0.139.2
uvicorn           0.51.0
pydantic          2.13.4
langchain-core    1.3.2
langchain-openai  1.2.1
openai            2.47.0
python-dotenv     1.2.2
```

Pydantic v2 API를 쓸 수 있다.

```python
model.model_dump()
Model.model_validate_json(...)
```

> `agent/requirements.txt` 는 현재 **버전 핀 없이** 패키지 이름만 적혀 있다.
> 위 버전은 "그 시점 Nexus가 준 결과"이지 파일에 고정된 값이 아니다.
> 재현성이 필요하면 핀을 추가하되, **핀을 넣는 순간 Nexus에 그 버전이 있어야 한다.**

---

## 3. 우선순위

버전을 정할 때 이 순서를 지킨다.

```text
1. 현재 프로젝트 Jenkins에서 실제 설치 성공한 버전
2. 현재 프로젝트의 기존 requirements.txt
3. 다른 사내 Agent 프로젝트 requirements.txt   ← REFERENCE일 뿐
4. 인터넷상의 일반 패키지 예시                  ← 가장 낮음
```

---

## 4. ⚠️ 다른 프로젝트 버전을 복사하지 마라

원본 문서 §47에는 다른 사내 Agent 프로젝트의 requirements 참고군이 실려 있다.
**분류는 REFERENCE다. 그대로 복사하면 안 된다.**

세대 차이가 크다:

| | 현재 프로젝트 | 참고군 (다른 프로젝트) |
|---|---|---|
| langchain-openai | **1.2.1** | 0.3.28 / 0.3.14 |
| openai | **2.47.0** | 1.98.0 |
| langchain-core | **1.3.2** | 0.3.72 / 0.3.58 |

다른 프로젝트를 보고 `langchain-openai==0.3.28`, `openai==1.98.0` 으로 **내리면**
현재 동작 중인 `AzureChatOpenAI` 코드와 동작 차이가 생길 수 있다.

```text
❌ 여러 프로젝트의 버전을 부분 복사해 임의 조합
✅ 한 프로젝트의 버전 세트를 통째로 참고하는 것은 가능
```

특히 아래는 **상호 의존성이 크므로 한 묶음으로** 본다.

```text
LangChain / LangGraph / OpenAI SDK / Pydantic
```

또한 사내에도 고정된 표준 조합이 있는 게 아니다.

```text
프로젝트 A: LangChain 0.3.27 / LangGraph 0.4.8 / langchain-openai 0.3.28
프로젝트 B: LangChain 0.3.23 / LangGraph 0.4.1 / langchain-openai 0.3.14
```

→ *"사내 표준 LangGraph 버전은 0.4.8이다"* 처럼 단정하지 마라.

---

## 5. 패키지 추가 절차

```text
현재 환경 유지
    ↓
필요한 패키지만 최소 추가
    ↓
사내 Nexus에 존재하는지 확인
    ↓
requirements.txt 수정
    ↓
Jenkins build 검증
```

> **`langgraph==0.4.8` 한 줄 추가하고 끝내면 안 된다.**

---

## 6. 기능별 필요 여부

| 기능 | 현재 필수 | 참고 패키지 |
|---|---:|---|
| FastAPI Agent | 필수 | `fastapi`, `uvicorn` |
| Gemma/Azure 호출 | 필수 | `langchain-openai`, `langchain-core`, `openai` |
| Pydantic output contract | 필수 | `pydantic` |
| `.env` 로딩 | 사용 중 | `python-dotenv` |
| LangGraph orchestration | 선택 | `langgraph`, `langgraph-checkpoint`, `langgraph-sdk` |
| MCP Tool 연결 | 선택 | `langchain_mcp_adapters`, `python-mcp-sdk` |
| Langfuse tracing | 선택 | `langfuse` |
| Scheduler | 선택 | `apscheduler` |
| RAG 평가 | 선택 | `ragas` |
| Excel | 선택 | `openpyxl`, `pandas` |
| ML / Clustering | 선택 | `scikit-learn` |
| XML/HTML parsing | 선택 | `lxml` |
| 시스템 모니터링 | 선택 | `psutil` |

현재 목표(`Agent 로직 → 배포 → Fabrix → JS Frontend`)에는 아래면 충분하다.

```text
fastapi  uvicorn  pydantic  python-dotenv
langchain-core  langchain-openai  openai
```

LangGraph / MCP / Langfuse 등은 **로직 요구사항이 실제로 생겼을 때** 추가한다.

---

## 7. LangGraph를 추가하려면

다른 사내 프로젝트에서 사용 예가 확인됐으므로 **사내 환경상 사용 자체는 가능**하다.
확인된 버전 예: `langgraph==0.4.8` (+`langgraph-checkpoint==2.0.26`, `langgraph-sdk==0.1.70`), `langgraph==0.4.1`.

다만 현재 프로젝트에 추가할 때는:

```text
1. 현재 langchain-core / langchain-openai 버전 확인   ← 1.x 계열이다
2. 그것과 호환되는 langgraph 버전 확인               ← 0.4.x는 0.3.x 계열용이다
3. 사내 Nexus 존재 여부 확인
4. requirements 변경
5. Jenkins build 검증
```

> 참고군의 LangGraph 버전은 **LangChain 0.3.x 기준**이다.
> 현재 프로젝트는 LangChain 1.x이므로 **그대로 가져오면 충돌할 가능성이 높다.**

---

## 8. MCP를 추가하려면

참고 가능한 사내 조합:

```txt
langchain_mcp_adapters==0.1.7
python-mcp-sdk==0.5.0
```

단, 현재 핵심 경로(`Browser → Fabrix → Agent → Gemma`)에 **MCP는 필수가 아니다.**
Agent 내부에서 DB / 업무 시스템 / 검색 / 사내 Tool을 호출해야 할 때 추가한다.

---

## 9. requirements 변경 시 체크리스트

코드 한 줄 수정보다 영향 범위가 훨씬 크다.

```text
[ ] package가 사내 Nexus에 존재하는가
[ ] 기존 package와 version conflict가 없는가
[ ] Docker build에서 pip install이 성공하는가
[ ] import path가 현재 버전 API와 맞는가
[ ] container startup이 성공하는가
[ ] /health 가 Healthy인가
[ ] Fabrix 호출이 기존대로 동작하는가
```

`LangChain` / `LangGraph` / `OpenAI SDK` / `Pydantic` 은 **함께 검토**한다.

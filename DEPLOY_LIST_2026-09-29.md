# 2026-09-29 사내 배포 목록 — 검증 결과와 반입 파일

작성 기준: 2026-09-28 로컬 작업 종료 시점. 이 문서는 **이번에 바뀐 것만** 다룬다. 반입 절차·FabriX 설정·오류 대응의 일반 순서는 기존 [COMPANY_DEPLOY_CHECKLIST.md](COMPANY_DEPLOY_CHECKLIST.md)(고정 브리핑)와 [BRANCH_AGENT_DEPLOY_TOMORROW.md](BRANCH_AGENT_DEPLOY_TOMORROW.md)(부점 AI)를 그대로 따른다.

## 0. 결론

**세 묶음(프론트 3파일 · 고정 브리핑 Agent 6파일 · 부점 Agent 11파일)을 같은 빌드 결과로 함께 배포하면 된다.** 로컬에서 할 수 있는 검증은 전부 통과했고, 정밀 리뷰에서 나온 결함(HIGH 1 · MED 3 · LOW 6)은 모두 수정한 뒤 재검증했다.

사내에서만 확인할 수 있는 것은 §7에 따로 적었다. 이번 GitHub 작업 폴더의 변경은 **아직 commit/push하지 않은 상태**(수정 42 · 신규 12 파일, 이 문서 포함)이며, 사내 배포는 아래 파일을 각 배포 repo에 옮기는 것으로 한다.

## 1. 로컬 검증 결과 (2026-09-28)

| 검사 | 결과 |
|---|---|
| `node tools/briefing/build.js` | 성공. 두 번 실행해 산출물 해시 동일(결정적 빌드). 반입본은 원본과 동기화 상태 |
| `node tools/briefing/check.js` | 9 PASS (신규 `C01-07 UI revision` 항목 포함) |
| `check.js --agent` (venv Python 3.13) | 11 PASS. FastAPI ASGI `/health`·42건 `/chat`·오류 처리 실제 검사(SKIP 아님) |
| `node branch-agent/validation/run.js` | 15 PASS (data · contract 138건 · transport · service stub 36/36 + execution_trace + **fail-safe 회귀** · 실제 HTTP/SSE) |
| Python 3.10 문법 | 배포 `.py` 11개 `ast.parse(feature_version=(3,10))` 통과, 환경변수 없이 `import main` 성공(두 Agent 모두) |
| Dockerfile | 두 Dockerfile의 개별 COPY가 배포 파일 전부를 포함(`branch_trace.py` 추가됨). `requirements.txt` 두 개 모두 변경 없음 |
| 산출물 위생 | 키·토큰·`localhost`·`127.0.0.1`·`8766` 없음. 파일코드 `1288272`, 에셋 경로 `/mnbank/app/html/bfe/asstmgt/asst/` 그대로. UI 문자열에 목업/MOCK/DEMO 표기 없음(기존 코드의 부점 AI 로컬 규칙 안내문 2건·`DEMO-01` 식별자는 HEAD와 동일) |
| 데이터 범위 | `agent/briefing_data.json` 변경은 C01-07 레코드(브리핑·analysis_evidence)·answer_schema, 그리고 **B03-07·B04-23의 `계약이전 페이지 방문` 세그먼트 제거**(2026-09-28 요청, 세그먼트 폐지). 부점 `data_version` `81f4311c…`이 반입 JS·manifest·`branch_data.json`에서 일치. 부점 `branch_data.json`도 이번에 바뀜(세그먼트 제거 반영) |
| 브라우저(로컬 8766, 실제 로컬 Agent·Gemma 경로) | 화면 unload → `onParam` 재진입 2회에도 패널 host·위젯 중복 없음, 콘솔 오류 없음. 오세훈 브리핑 수신 + 분석 근거 패널, 상품 3종 메타정보 펼침, Hot Tip, 근거 자료 → 패널 이동. B01-03 전환 시 기존 레이아웃 유지. 부점 AI 검색 실제 호출(만 55세 이상 + 연금저축 보유 → 10명 반영, Agent execution_trace 4단계 병합). 처리 이력 3건 표시 |

### 리뷰에서 찾아 수정한 결함 (재검증 완료)

| 심각도 | 위치 | 내용 → 조치 |
|---|---|---|
| **HIGH** | `branch-agent/deploy/branch_service.py`, `branch_trace.py` | 실행 이력이 자기 스키마(라벨 80자, 빈 문자열 금지)에 어긋나면 **정상 답변이 오류로 바뀌고 SSE 프레임 생성까지 실패**해 화면이 아무 이벤트도 못 받음. 6조건 `and` 검색(라벨 96자)이나 모델이 `target_name: ""`를 내면 재현 → 라벨·checks 80자 절단, 빈 값 null, `safe_trace()`가 검증 실패 trace를 버리고 답변은 그대로 반환(오류 이벤트도 동일). `check_service.py`에 회귀 검사 추가 |
| MED | `branch_language.py` compose | 문장 검증 실패 → 템플릿 대체가 정상 경로인데 trace가 `failed`로 표시 → 단계 completed로 종료 |
| MED | `frontend/src/briefing/branch-search-adapter.js` | 엑셀 추출 기록이 `session.note()`의 동기 cancel에 걸려 새 기록에 '취소' 단계가 찍힘 → 등록 순서 변경 |
| MED | `pensionExecutionTraceData.js`, `pensionExecutionTracePanel.js` | 목업 기록의 화면 문구 '목업 계산 기준'·`*.mock.v1` → 중립 문구로 교체 |
| LOW | `pensionBriefingEvidencePanel.js` | 분석 근거 패널이 첫 재렌더에 한 번 접힘 → 렌더 키 기록 |
| LOW | `pensionFabrix.js`, `pensionBriefingAdapter.js`, `fabrix-briefing-contract.js`, `agent/main.py` | 근거 폐기 시 코드 1줄 `console.warn`, 죽은 설정값·미사용 변수 제거, `exclude_none` → `exclude_unset` |

## 2. 배포 묶음 A — 업무화면 WAS (프론트 3파일)

`frontend/briefing-fabrix/`의 세 파일을 **모두 함께** 교체한다. 셋 다 이번에 바뀌었다.

| 파일 | 크기 | 비고 |
|---|---|---|
| `mnPensionAgentDemo.html` | 43,846 B | TRACE 버튼(상단·카드·근거 자료 행·상담 답변), S3 메타정보 표, S5 Hot Tip·후속 안내, 근거 자료 행. 실시간 상담 헤더의 고객 변경 버튼 없음 |
| `pensionAgentDemo.js` | 890,677 B | **683 KB → 891 KB**(+208 KB). 신규 모듈 6개(처리 이력 패널·기록·목업 데이터, TRACE 패널, 부점 표시 설정, **표시 기준일=당일 평행이동 `pensionDisplayDate.js`**) + 실시간 상담 턴 trace(§2-1) |
| `pensionAgentDemo.css` | 83,388 B | 패널·표·Hot Tip·근거 행 스타일. 상단 도넛 132→148px(금액 문구 넘침 수정)도 포함 |

배치 경로·파일코드·캐시 확인은 [체크리스트 §2](COMPANY_DEPLOY_CHECKLIST.md). 반입 후 Network에서 JS 응답 크기가 **890,677**인지 보면 옛 파일 캐시를 바로 구분할 수 있다.

### 2-1. 2026-09-28 추가 — 프론트 3파일만 다시 생성(Agent 묶음 B·C 변경 없음)

`main 8ea5ebf` 이후 커밋(`262d1d2` TRACE 문구 · `9d21636` 실시간 상담 trace)는 **프론트만** 바꿨다. `agent/`·`branch-agent/deploy/`는 main과 같으므로 묶음 B·C를 이미 배포했다면 다시 올릴 것이 없고, 아직이면 §3·§4 그대로 함께 올린다.

| 바뀐 것 | 내용 |
|---|---|
| 버튼 문구 | 상단 `처리 이력`·카드 `분석 근거`·근거 자료 행 `분석 근거 →` → **`TRACE`**. 패널 제목·tooltip은 그대로 |
| 실시간 상담 헤더 | `고객 변경` 버튼 제거(`PensionChat.resetCustomer`는 API로만 남음) |
| 실시간 상담 trace | 매 요청 `contents[0]`에 `log_events: true`. 대화 Agent가 턴 끝에 보내는 `trace` 이벤트를 그 답변과 함께 메모리에만 보관하고 답변 아래 **TRACE** 버튼 → 카드 TRACE 패널의 「실시간 상담 · N턴」에서 해당 턴 펼침(처리 단계 → 무엇을 찾아봤나 → 확인한 사실 → 답변 검증 → 문장별 근거). `log` 이벤트는 콘솔에만. 계약 [CHAT_AGENT_CONTRACT §2·§3](integration/contracts/CHAT_AGENT_CONTRACT.md) |

로컬 검증(2026-09-28): 빌드 2회 해시 동일 · `check.js` 9 PASS · 반입본에 새 주소/키 없음(`localhost` 2건은 main과 동일한 기존 transport의 loopback 판정 코드·주석) · 파일코드 `1288272`·에셋 경로·설정 블록 빈 값·부점 `data_version 81f4311c…` 모두 이전과 동일 · Chromium에서 반입본을 띄워 가짜 Connector로 샘플 trace 재생 → TRACE 버튼·패널·5단계·ESC·trace 없는 턴 버튼 없음 확인.

버전 조합: **새 프론트 + 옛 대화 Agent**(`trace` 미지원)는 답변만 오고 TRACE 버튼이 안 뜬다. `log_events` 키는 대화 Agent가 `input_value`를 dict로 읽고 요청 모델이 `extra="allow"`라 무시된다. 대화 Agent가 동료 repo `e411672` 이후 tag로 배포돼야 trace가 온다. 사내에서만 확인할 것: `log_events`를 켠 실제 턴의 응답 크기(근거 원문 ≤4,000자×블록)가 180초·`LIMIT` 안인지.

롤백: 이 변경만 되돌리려면 `main 8ea5ebf`의 3파일(JS 861,306 · HTML 43,714 · CSS 82,571 B)로 원복. Agent는 손대지 않아도 된다.

### 3-1. 2026-09-28 추가 — 고정 브리핑 Agent `briefing.py` 시연용 pacing (묶음 B 재배포)

오세훈 `analysis_trace`의 네 단계가 마이크로초에 끝나 TRACE 패널 시각이 전부 같게 보였다. `agent/briefing.py`가 단계마다 0.4/0.7/1.1/0.5초를 쉬고 진행해 기록 시각이 순서대로 늘어난다(총 약 2.7초, 오세훈 요청만 · 다른 41건은 즉시). `ANALYSIS_TRACE_PACE=0`이면 끈다(배율). 프론트 브리핑 timeout 90초 안. **묶음 B 6파일을 다시 반입해야 하며 `briefing.py`만 바뀌었다**(Dockerfile·requirements·데이터 동일). `check.js --agent` Python 검사 통과, ASGI HTTP 검사는 여전히 로컬 SKIP.

## 3. 배포 묶음 B — 고정 브리핑 Agent (사내 GenAI 배포 repo 루트, 6파일)

| 파일 | 이번 변경 | 비고 |
|---|---|---|
| `agent/main.py` | **변경** | `analysis_trace` 선택 필드, `exclude_unset` 직렬화 |
| `agent/briefing.py` | **변경** | C01-07 `analysis_trace()` 구성(LLM 없음), `source_id` 투영 |
| `agent/briefing_data.json` | **변경** | C01-07 브리핑(상품 메타·Hot Tip·9 출처) + `analysis_evidence`, answer_schema |
| `agent/Dockerfile` | 동일 | |
| `agent/requirements.txt` | 동일 | |
| `agent/llm_client.py` | 동일 | 여전히 import/호출 안 함 |

`/health` 기대값은 그대로(`mode: fixed_briefing`, `llm_enabled: false`, `case_count: 42`).

## 4. 배포 묶음 C — 부점 AI Agent (별도 배포 repo 루트, 11파일)

| 파일 | 이번 변경 | 비고 |
|---|---|---|
| `branch-agent/deploy/branch_trace.py` | **신규** | 요청별 실행 이력 수집기 |
| `branch-agent/deploy/Dockerfile` | **변경** | `COPY ./branch_trace.py` 한 줄 추가 — 빠지면 `ModuleNotFoundError` |
| `branch-agent/deploy/branch_models.py` | **변경** | `execution_trace` 선택 필드·Trace 모델 |
| `branch-agent/deploy/branch_service.py` | **변경** | trace 수집·fail-safe |
| `branch-agent/deploy/branch_language.py` | **변경** | '만 55세 이상'·'연금저축 보유' 해석 규칙, trace 연동 |
| `branch-agent/deploy/llm_client.py` | **변경** | `describe()` 추가(모델·deployment 이름만, `call()` 경로 변경 없음) |
| `branch-agent/deploy/branch_data.json` | **변경** | `계약이전 페이지 방문` 세그먼트 제거로 `data_version 81f4311c07c3550cf87571a436351adef5f9a393df7b87f6a29a548c0719905c` (HEAD `7abc22b0…`에서 변경) |
| `main.py`, `branch_data.py`, `branch_query.py`, `requirements.txt` | 동일 | |

## 5. 반드시 같이 배포해야 하는 이유 (버전 조합 주의)

- **옛 프론트 + 새 Agent:** 두 계약 모두 `additionalProperties: false`라 새 Agent가 붙이는 `execution_trace`(부점) / `analysis_trace`(오세훈)를 옛 프론트가 SCHEMA 오류로 거부한다. 부점 대화는 모든 답변이, 브리핑은 오세훈 한 명이 실패한다.
- **새 프론트 + 옛 Agent:** 동작은 하지만 처리 이력에 Agent 단계가 없고, 오세훈 브리핑이 옛 S3/S5 문장으로 오며 [분석 근거] 버튼이 없다(계약상 정상, 데이터만 옛것).
- **부점 `data_version`이 바뀌었다**(`7abc22b0…` → `81f4311c…`). 프론트와 부점 Agent 중 한쪽만 올리면 부점 대화가 `DATA_VERSION` 오류로 멈추므로 두 묶음을 같은 빌드로 함께 올린다.

## 6. 내일 순서

1. 이 폴더에서 다시 한 번 `node tools/briefing/build.js` → `node tools/briefing/check.js` → `check.js --agent`(사내 Python) 실행. 산출물 해시가 §2·§3 크기와 같은지 확인.
2. **묶음 B**(고정 Agent 6파일) → 사내 repo commit·tag push → Portal 배포 → `/health` 200.
3. **묶음 C**(부점 Agent 11파일) → 동일 절차 → `/health` 200, `data_version 81f4311c…`, `model gemma-4-31b-it`.
4. **묶음 A**(프론트 3파일) → WAS 교체, 캐시 비우기, JS 890,677 B 로드 확인, `PG_1288272.onParam` 호출 확인.
5. 연동 확인(§7). 문제 시 롤백은 §8.

## 7. 사내에서만 확인 가능한 항목 (로컬 미검증)

- [ ] 사내 Python 3.10 이미지 빌드·Nexus 설치·기동(로컬은 3.13 venv + 3.10 AST 검사까지).
- [ ] **오세훈(C01-07) `/chat` 응답 크기 52 KB**(기존 최대 약 15 KB)가 FabriX Connector의 단일 CHUNK로 그대로 도착하는지. 화면에서 오세훈 선택 → `SUCCESS` + [분석 근거] 버튼이 보이면 통과. 버튼이 없고 콘솔에 `analysis_trace dropped: TRACE`가 찍히면 Connector가 본문을 변형한 것.
- [ ] 부점 Agent 실제 Gemma(사내 deployment)에서 시연 문장 `만 55세 이상 고객 중 당행 연금저축 보유고객 보여줘` → 10명 + 처리 이력에 `해석 → 확정 → 적용 → 답변` 4단계와 LLM 호출 1회.
- [ ] 처리 이력 '부점 AI 검색' 기록의 요청/응답 시각이 실제 Network 시각과 맞는지(프론트 관측값).
- [ ] 엑셀 추출 이력: 검색 → 즉시 '엑셀로 내려받기' 시 새 기록이 '취소'로 찍히지 않고 3초 대기 후 완료로 남는지(이번 수정 항목, 로컬은 코드 검사만).
- [ ] Starroot/WebView에서 우측 패널(처리 이력·분석 근거) 겹침·스크롤·ESC 닫기.

## 8. 롤백

- 프론트: 기존 3파일 원복(옛 JS 682,664 B). 옛 프론트는 새 Agent의 추가 필드를 거부하므로 **Agent도 함께 원복**해야 한다.
- 고정 Agent: 이전 tag 재선택. 부점 Agent: 이전 tag 재선택하되 **프론트도 같은 시점 파일로 원복**해야 `DATA_VERSION`이 맞는다.

## 9. 알아두면 좋은 표시상 특성 (결함 아님, 사용자 결정 사항)

- 처리 이력의 '오늘의 부점 브리핑'은 **프론트 안에서 완결되는 목업 기록**(origin `frontend_fixture`, 실제 호출 없음)이다. 요청·응답 시각은 화면이 처음 렌더링된 실제 시각(+120 ms / +20.35 s)에 맞춘 것이라, 상단 상태 pill의 "오전 7:30"·요청 ID의 `0730`과는 다르게 보인다. 부점 AI 검색·엑셀 추출 기록은 실제 관측값이다.
- 오세훈 브리핑의 펀드 누적수익률은 원문에 기준일이 없어 `기준일 미표기`로 나온다(날짜를 만들어 넣지 않음).
- 부점 execution_trace에는 직원이 입력한 질문 원문(≤1,200자)과 deployment 별칭이 들어가 화면에 보인다. 고객 자료·키·헤더·프롬프트·모델 원문은 들어가지 않는다.

## 10. 배포하지 않는 것

`branch-agent/validation/`(로컬 서버 `local_dev_server.py` 포함), `agent-workbench/`, `docs/`, `tools/`, `frontend/src/`, `.venv`, Gemini/LLM 키. 로컬 8766·8765 서버 주소를 사내 설정에 넣지 않는다.

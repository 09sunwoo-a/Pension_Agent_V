# 05 — Agent 출력 골든·검증

상태: **2026-09-21 실제03 데이터·공통04 서비스의36개 stub 골든과 실제 HTTP/SSE 검증 완료. Google 실제 Gemma36×3회108/108 PASS. 실제 remote 로컬 UI19/19 PASS. 사내 E2E는 미실행이며 아래 기록을 따른다.** 선행:01 계약부터 기대값 작성 가능,03·04 후 실행. 읽기: [기능·36개 골든](../BRANCH_AI_SEARCH_DESIGN.md) §3,01 계약, `tests/branch-search/conversation.test.js`. 과거8명 fixture를 현48명 Agent 데이터로 쓰지 않는다.

01에서 `node branch-agent/validation/check_contract.js`가 구현됐다(125개 공통 계약 사례+outer4개·SSE·번들 로딩). 계약 샘플9개는 아래36개 기능 골든을 대체하지 않는다. 이 검사를 재사용하고 계산/내용/실제 모델 검사를 추가한다.

## 기존 골든의 의미

현재 JS 검사는 질문→로컬 엔진→ID/숫자/상태를 검사한다. 실제 Python Agent·LLM 의미 해석·SSE 응답·remote UI 연결의 통과 근거가 아니다. 문서36개 ID마다 새 테스트를 명시적으로 연결한다. 요구사항 문장은 의미 기준이며 정확한 문장 일치보다 사실·행동이 중요하다.

새 수정 원본은 `branch-agent/validation/scenarios.json`: 데이터 버전, 시나리오, 선행 단계, 입력, 기대 Plan/구조·ID·숫자·State 변화·금지 내용. `cases`는36개 ID를 모두 포함하고 변형 테스트는 별도 suffix. 예제 response fixture는 테스트용일 뿐 Agent 런타임에서 import 금지.

| 그룹 | 필수 기대값 |
|---|---|
| S-01~05 | `[lsm,jmr,jmj,B08-01]`→`[lsm]`→`[lsm]`→`[lsm,jmr]`→최초4명, filter 이력 재계산 |
| S-06~08 | B04-23 1명 / B02-04·B02-27, 현금2550000 / IRP≥70000000 총35명. 각각 전체48명에서 시작 |
| H-01~05 | 전체48·IRP5949240000·현금346630000(31/17), 장기대기4, 미운용2·2550000, ISA 등록3. 항상 keep |
| R-01~08 | `[B04-23,B06-13,B01-03]`·UR 근거, 퇴직급여1명, 최초추천복원, IRP296900000, ISA10.07/D23·금액null, top2→ISA0명 |
| B-01~04 | 기존 표의 사실·관리 방향2~3문장. 이름 지정/결과1명 식별, list keep. 이수민의 미검증1천만원·10주 금지 |
| X-01~11 | 고객/범위 명확화,0명→조건 해제, 전일 비교불가, 현금 금액500만원11명·미확인17, 취소/복원/새대화/Top N 범위 |

S-08의35명은 count만 검사하지 않고 전체 ID 배열을 검토·고정한다. 계좌 기간 검색은 B01-03 한 명. 해당 고객 JSON과 수작업 집계로 기대값을 확인한 뒤 fixture에 저장한다. 테스트 때 Agent 출력으로 expected를 재생성하지 않는다. 기존 JS 결과는 대조 자료일 뿐 단독 정답 판정자가 아니다.

## 테스트 레코드 형태

```json
{
  "id":"S-04",
  "given":"S-01>S-02>S-03",
  "input":{"message":"나이 조건 빼줘","action":null},
  "expect":{
    "intent":"search","status":"ok","list_action":"replace",
    "ordered_row_ids":["lsm","jmr"],"count":2,
    "removed_filter_field":"age","preserved_filter_segments":["현금성 장기대기","DO 미등록"],
    "forbidden_text":["고객을 찾았습니다"]
  }
}
```

`given`은 테스트 runner가 이전 턴을 실행하고 실제 성공 next_state를 전달하는 순서다. 사람 이름을 포함한 ID 기대값은 화면 결과 검증용이며 일반 검색 답변에 나열하지 않는다. golden.state는 필드별 invariant를 검사해 operation ID 생성 방식·문장 표현까지 과하게 고정하지 않는다.

## 검증 층과 통과 기준

| 층 | 방법 | 통과 기준 |
|---|---|---|
| 계약 | Python·JS에 정상/오류 fixture 동일 입력 | accept/reject100% 일치; 필수 필드·타입·추가 필드·버전·revision·ID·count 검사 |
| 계산/멀티턴 | 해석·문장 LLM stub, 실제 branch_data와 Python 서비스 |36개 전부 성공, ID/순서/금액/미확인/keep·replace 정확 |
| 해석 | 실제 `gemma-4-31b-it`에 원문+동의어·띄어쓰기·숫자 표기·부정/조건제거 입력 | 핵심36개×3회 실행해 기록. UI 동작/ID/숫자 오류0건; 실패를 제외하고 PASS 금지 |
| 답변 내용 | fact_refs·금액/날짜 검증+대표 브리핑 수동 확인 | 검색 이름 나열 없음, 허구 사실/금액 치환 없음,2~3문장 및 관리 방향 |
| 전송 | 실제 transport에 가짜 fetch/SSE, 뒤에서 오류 주입 | 부분 UTF-8·CRLF·포장1겹 정상; 중복최종·truncated·오류뒤answer·버전 mismatch는 미적용 |
| UI | 로컬 Chrome Starroot 재현, remote provider로 골든 실행 | 기존 상단/카드 보존·keep DOM 불변·검색 ID/순서·버튼·취소·재진입 |
| 사내 | 실제 Connector→Agent→Gemma→Starroot |06 대표 시연과 생성된 응답 계약 검증, 실제 응답 수신 확인 |

LLM stub 통과와 실제 Gemma 통과를 별도 수치로 기록한다. 외부 LLM/사내 호출은 환경이 준비된 세션에서만 수행하며 요청 문장·고객 원문·Secret을 로그에 보관하지 않는다. 실패 ID/안전한 코드·소요·템플릿 대체 여부만 기록한다.

## 로직 완성 후 로컬 live 검증

04의 Google AI Studio 호출기와 localhost 브리지를 사용한다. 공통 Agent의 stub 골든 통과 → 실제 `gemma-4-31b-it`으로36개 해석/응답 검사 → 같은 실행 서버에 프론트 연결 순서다. Google 호출을 프론트 JS 규칙 엔진이나 저장된 답변으로 대체하지 않는다.

브라우저에서 추천 → 고객 브리핑 → 최초 추천 복원 → 부점 현황(목록 유지) → ISA 통계/대상 보기 → 조건 추가·제거 →0명 → 취소·재시도 → 새 대화를 확인한다. 각 턴은 실제 Agent 응답의 ID·숫자·State·UI 변화와 금지 문구를 검사한다. 취소 같은 전송 실패 주입 검사는 별도로 재현한다.

검증 결과는 `stub`, `google-live`, `local-ui-google-live`, `internal-e2e`로 구분한다. 테스트 서버·프론트 시작/종료와 live 명령을 validation README에 남겨 사용자가 직접 질문을 바꿔 시연할 수 있게 한다. quota/접근 실패로 일부만 실행했으면 실행 수·실패/SKIP을 그대로 기록한다. 로컬 PASS를 사내 E2E PASS로 간주하지 않는다.

## 필수 변형·회귀

- 경계: 70000000 정확값/바로 아래·위, 소수 비율,0 vs null, 동일 금액 정렬, 30일 끝날/초과, ISA 두 계좌의 날짜/금액 교차 결합 금지.
- 추천: UR 충족 고객을 추가한 테스트 데이터에서4명, 완료된 이전은 제외, 한 고객이 두 규칙을 만족해도1명. 고정3명 응답 탐지.
- 상태: 새대화 뒤 단일 고객 브리핑, 집계군/현재군 혼동, 조건 제거 뒤 take 재실행, 오래된 버튼, 위조/초과 State, 두 직원/탭 격리, 재시도/서버 재시작.
- 실패: LLM 해석 실패·문장 실패·시간초과 각각 다른 기대값, abort 뒤 늦은 worker, EOF 뒤 중복 데이터, 서버/프론트 데이터 버전 불일치, 알 수 없는 row ID, 고객ID와 row_id 혼용.
- 기존 S1~S5 고정 반환31건·상담 parser·원래 카드 클릭/상세복귀·위젯 CSS 폴백도 유지한다.

## 명령·인계

실행 방법과 서버·프론트 종료 방법은 [validation README](../../../branch-agent/validation/README.md)에 있다. 로컬 패키지는 공개 PyPI에 설치했으며 사내 Docker는 Nexus를 유지한다.

```sh
node tools/briefing/build.js
node tools/briefing/check.js
PYTHON=branch-agent/validation/.venv/bin/python node tools/briefing/check.js --agent
node branch-agent/validation/run.js
branch-agent/validation/.venv/bin/python -B branch-agent/validation/run_live.py --pace 10
node branch-agent/validation/check_live_ui.js
```

live 모델 검사와 브라우저 검사는 같은 Google quota를 공유하므로 순차 실행한다. `run.js`는 실제 모델을 호출하지 않는다. live UI는8766 브리지와 별도 테스트 Chrome9229를 먼저 실행해야 한다.

| 인계 | 값 |
|---|---|
| 변경 파일 |04의 deploy 공통 서비스, `validation/scenarios.json`, `check_service.py`, `check_http.py`, `google_client.py`, `local_server.py`, `run.js`, `run_live.py`, `check_live_ui.js`, validation README,04·05 문서, 루트 반입 안내 |
| 기대값 | 현재03 실제48명·31/17 구분·독립 집계로 고정한36개. S-08의35명 전체 ID 배열 검사. 실행 시 정답 재생성 없음 |
| 사내 준비 | 개별 COPY·flat import·CMD·Nexus requirements 준비. [내일 배포 안내](../../../BRANCH_AGENT_DEPLOY_TOMORROW.md)에3개 프론트 파일·API 연결·10개 Python 배포 파일·패키지·확인 절차 기록 |

### 2026-09-21 실행 결과

| 구분 | 결과 | 범위·한계 |
|---|---|---|
| build | PASS | 기존31건 S1~S5 및 부점48명 데이터·manifest·프론트3파일 생성 |
| 기존 회귀 | PASS | `check.js`의 기존 브리핑·대화·부점 회귀 |
| 기존 Agent 회귀 | PASS | venv를 지정한 `check.js --agent`:31건 Python 결과와 FastAPI ASGI 검사. HTTP SKIP 없음 |
| 데이터 | PASS |48개 ID/원본순서·31/17·집계·null·해시·manifest/제품 번들 일치 |
| 계약 | PASS | Python/JS125개 공통 사례+FabriX outer4개·schema freshness·SSE·번들·Docker 정적 검사 |
| remote 전송 | PASS |02 transport/state와 가짜 SSE의 경계·취소·오류 검사. 실제 모델 UI와 구분 |
| stub | **36/36 PASS** | 실제 공통 서비스와03 데이터. 경계·소수·null·안정 정렬·동일 ISA 계좌·동적 추천4명/중복 제거·상태 위조/독립성·해석 실패/문장 대체 회귀 포함 |
| 부점 실제 HTTP/SSE | **PASS** | uvicorn 실제 TCP `/health`·`/chat`, timeout/abort·늦은 worker·슬롯 제한·재시도, FabriX wrapper. 가짜 SSE 재생 검사와 별개 |
| validation 없는 기동 | **PASS** | Docker COPY 파일만 임시 평면 폴더로 복사하여 import·uvicorn 기동·HTTP 확인 |
| google-live | **108/108 PASS** | 지정 모델36×3회,132회 실제 API 호출,114회 해석 성공. 제공처 오류0·FAIL0·SKIP0·미실행0 |
| local-ui-google-live | **19/19 PASS** | Chrome→02 remote→8766 브리지→공통 서비스→실제 Gemma. 모델14회, 제공처 오류0·브라우저 예외0 |
| 패키지·문법 | PASS(로컬) | Python3.13 venv의6개 직접 의존성 설치·`pip check`·기존 AzureChatOpenAI 생성자 구성. Python3.10 문법·직접 패키지 Requires-Python 호환 메타데이터 확인 |
| 사내 이미지·Nexus | **미실행** | 사내 연결 불가. 로컬 Docker daemon 미가동으로 실제 이미지 빌드도 미실행 |
| internal-e2e | **미실행** | 사내 배포하지 않음. 실제 Connector·사내 Gemma·Starroot의 결과로만 추후 판정 |

실제 데이터 버전: `2faa49449acd295992aba6ca7d57aebc1ba0cb7bef3a6a363a281fc52fc9afc4`.

Google 제공처는 AI Studio/Generative Language API, 모델은 `gemma-4-31b-it`, temperature0·thinkingLevel minimal·해석 출력1600토큰·상담 문장200토큰·요청 timeout20초다. 같은 공통 프롬프트/서비스를 사용한다.2회차는 금액 표기,3회차는 일부 동의어 변형이며 모든 질문이 서로 다른 문장인 것은 아니다. 관찰 결과는 `.local-results/`에 안전한 ID·코드·소요·토큰 수·대체 횟수만 저장하고 Git에서 제외한다.

### 중간 실패와 조치

- 처음에는03 산출물 미생성 및 동시 편집 중 build/check 불일치를 확인했다. 이후02/03 인계와 같은 소스 상태의 재빌드·검사로 해소했다. 당시 FAIL을 숨기거나 대체 데이터로 완료 처리하지 않았다.
- 초기 실제 호출에서 S-04 조건 제거 해석과 H-02 현황 분류 실패, Google429를 확인했다. 공통 해석/검증을 수정하고 호출 간격을 추가했다.
- 다음 실행은30건 PASS 후 ISA 브리핑(R-05)의 불필요 operation으로 실패했으며 종속 R-06/R-07은 SKIP했다. 브리핑은 Python이 대상/사실을 정하도록 보완했다. 문장 생성429가 발생한 경우 사실 템플릿으로 대체된 사실도 관찰 기록에 남긴다.
- 최초 실제 브라우저 검사에서는 추천·브리핑·현황 keep·ISA 통계 keep·집계 대상 보기5단계가 통과했다. 모델 반복 검사와 동시에 실행하여 Google429가 발생했고 전체 UI FAIL로 기록했다. 최종 UI는 모델 검사 뒤 단독 재실행한다.

### 최종 Google 반복 결과

- `run_live.py --pace 10`:36개×3회 **108/108 PASS**, 실제 API132회, 제공처 오류0건·중단 없음. ID·순서·숫자·목록 keep/replace·State·명확화·금지 문구를 검사했다.
- 해석114회 성공(X-05 같은 다단계 사례 포함). 상담 문장 생성 요청18회 중6회 생성문 채택,12회는 표현 검증 후 사실 기반 템플릿으로 대체했다. 별도3회는 다듬을 상담 문장이 없어 모델 문장 호출이 필요 없었다. **18회 전부 LLM 생성문 채택으로 기록하지 않는다.** 수치/날짜 문장은 공통 Python이 확정했다.
- 중간 실행의429/실패·SKIP은 위 이력에 보존했다. 최종108건 실행에는 해당 오류가 없었다. 실제 호출 중 모델을 바꾸거나 JS 엔진/저장 답변으로 우회하지 않았다.
- 명시한 고객이 현재 목록 밖에 있어도 브리핑 후속 질문은 유지되는 회귀를 추가했고 최신 코드의 stub/HTTP 검사를 다시 통과했다. 최종 UI는 최신 서버로 재시작해19개 흐름을 통과했다.

### 최종 로컬 UI 결과

- `check_live_ui.js`: **19/19 PASS**. 추천→고객 브리핑→부점 현황 keep→ISA 통계 keep→집계 대상 보기→장기대기 검색→나이/DO 조건 추가→나이 제거→추천 복원→0명→조건 제거→취소→재시도→추천 복원→퇴직급여 대상 좁히기→새 대화→후속 브리핑→이탈/재진입.
- 실제 Google14회, 제공처 오류0, 브라우저 예외0. 상담 문장은 생성1회·표현 검증 후 템플릿1회였다. 취소는 실제 fetch 진행 중 화면 form 경로로 실행했고, 재시도·새 대화는 화면 버튼을 클릭했다.
- 원래 상단/카드 구조·ID/순서, 통계/브리핑의 기존 목록 DOM 유지, 취소 전후 성공 State/revision 불변, 새 conversation ID/revision0 및 목록 보존, 재진입 위젯1개를 검사했다. 프론트 fetch를 가로채 가짜 응답으로 바꾸지 않았다.
- 로컬 서버는 `http://127.0.0.1:8766/`. 시작/종료 명령은 validation README를 따른다. Google 반복 검사와 UI 검사는 quota를 공유하므로 동시에 실행하지 않는다.

문장 구조/금액 검사는 의미 전체의 증명이 아니다. 허구/금액 치환/이름 나열 금지 검사와 대표 관리 방향 검토를 했으며 실제 사내 제공처의 표현·지연·인증은 별도 검증해야 한다.

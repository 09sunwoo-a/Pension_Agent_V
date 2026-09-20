# 03 — 데이터 위치·버전·ID

> **02 → 03 인계 완료 (2026-09-21):** 02 transport 등록 후 03에 build.js를 인계했고, 03 실제 manifest 등록·빌드 완료를 확인했습니다. 02가 같은 제품 번들로 build/check·계약·데이터 및 remote SSE 브라우저 검사를 재실행해 PASS했습니다. [02 최종 결과](02-FRONTEND.md#완료인계)를 참고하세요.

상태: **2026-09-21 구현·생성·로컬 검증 완료. 04 시작 가능**. 선행:01. 읽기: `build.js`, `check.js`의 current-data 투영 부분, `branch-search-current-data.js`, 기능 기준의 UR01~03. 특정 고객 확인은 해당 JSON만, 전체48명 투영은 빌드·검증 시만 수행한다.

## 위치 결정

| 데이터 | 수정 원본 / 실행 위치 |
|---|---|
| 구조화31명 | 기존 `active/display-data/*.json` 및 DEMO-01 원본. Agent 조회 데이터 생성에 사용 |
| 표시 정보만 있는17명 | 기존 메인 JS의 모델/프로필·카드 값. 빌드에서 기존 투영 함수로 추출; 별도 수기 사본 만들지 않음 |
| 실행 조회48명 | 신규 생성물 `branch-agent/deploy/branch_data.json`. Agent가 로드해 검색·집계·추천. 직접 수정 금지 |
| 데이터 manifest | 신규 생성물 `integration/contracts/branch-data.manifest.json`; 같은 내용을 프론트 JS에 포함 |
| 기존 고객 카드 표시 | 현 프론트 모델/스냅샷 유지. 요청마다 전체 스냅샷을 보내지 않음 |
| 멀티턴 State | 현재 브라우저 메모리. 응답 next_state를 다음 요청에 재전달. 고객 원본/Secret 없음 |
| S1~S5 묶음 | 기존 `agent/briefing_data.json` 유지. 신규 branch_data와 역할 분리 |

실행 시 Agent 데이터가 계산의 기준이다. 데이터의 편집 원본은 계속 기존 JSON/메인 모델이며, “Agent에 둔다”는 원본을 수기로 중복 관리한다는 뜻이 아니다. 향후 실데이터 DB는 별도 단계다.

## 생성 방법

`build.js`에 current-data 생성 단계를 추가한다. 기존 check.js처럼 DOM 없는 VM에서 원본 Component의 기본 renderVals/프로필과31명 fixture를 얻고 `fromCurrentRows`로 투영한다. 검증에 숨겨진 문자열 치환에 의존하지 않도록 명시적 build용 추출 함수를 분리하되 메인 렌더 결과는 변경하지 않는다. 외부 스크립트/고객 입력을 실행하지 않는다.

manifest 필드: `{dataset_id:'branch-demo.v1',data_version,rule_version:'branch-rules.v1',projection_version:'current-data.v1',as_of_date:'2026-09-14',known_dates, mixed_dates:true,record_count:48,structured_count:31,display_only_count:17,row_ids:[원래순서],segment_labels:[허용뱃지/가족라벨]}`. segment_labels는 현재 provider의 등록 라벨과 지원 가족 라벨에서 생성한다.01 검증기의 context 요구사항이며 사전 변경도 data_version 해시에 포함한다. `contract.examples.json`의 manifest는 샘플 전용으로 복사하지 않는다.

branch_data는 `{manifest,records}`. record는 현 투영값을 보존하고 명시적 `row_id`를 추가한다. `source_case_id`, 실제 `customer_id`, 고객별 `as_of_date`, `source_kind`, `original_order`, `display_overrides`를 구분한다. 날짜 없는17명은 null, 확인되지 않은 현금은 null이다. 표시 반올림 금액으로 보유상품/현금 구성을 만들어내지 않는다.

`data_version`: 정규화한 records+segment_labels+기준일+규칙버전+투영버전의 안정적 직렬화 SHA-256. 객체 키 재귀 정렬, 배열 순서 유지, UTF-8, 생성 시각·머신 경로 제외. 같은 입력은 같은 값. Python은 파일 버전을 읽고 Node와 별도 해시 알고리즘을 중복 작성하지 않는다. schema_version과 data_version은 서로 다르다.

| 화면 row_id | 원본 case_id | 연결 규칙 |
|---|---|---|
| ksy | DEMO-01 | 같은 고객. 목록 응답에는 ksy만. 기존 상세 API는 계속 DEMO-01 |
| B01-03 등30명 | 같은 Bxx-xx | 기존 카드 ID 그대로 |
| lsm/jmr 등17명 | 없음 | 화면 ID로만 연결. 임의 사례 ID/원본을 만들지 않음 |

시연 부점 범위는 서버의 고정 dataset_id로48명이다. 클라이언트가 row_ids를 보내 권한 범위를 늘리게 하지 않는다. `x_client_user`는 감사 식별일 뿐 실제 인증된 부점 권한의 대체물이 아니다. 실제 직원/부점별 데이터 연결은 사내 인증 컨텍스트가 확보된 뒤 추가한다.

## 완료·검증

- 동일 입력 재빌드 해시 동일, 금액/뱃지/날짜 변경 시 해시 변경. JS manifest와 Agent manifest 동일.
- row48개 중복 없음, 구조화31/표시17, ksy와 DEMO-01 이중 집계 없음. 원본 JSON/메인 템플릿 무변경.
- 전체 IRP5949240000, 현금346630000(31명 확인/17명 미확인), ISA 등록3명/30일 내1명, ≥7천만원35명과 대조.
- Python 계산이 JS 투영의 display override·미확인·원래 순서를 재현. 실제 데이터 수정 없이 변형 fixture에서만 경계검사.
- 신규 deploy/Dockerfile에 branch_data COPY. 기존 agent/Dockerfile은 변경하지 않는다. manifest 없는/불일치 배포는 API 호출·화면 적용 거절, 프론트와 Agent를 같은 빌드로 반입.

## 구현 상세·04 연결 위치

- 생성 코드: `tools/briefing/branch-data.js`. 원본 Component의 명시적 `__PensionBuildExtract` 훅으로 기본 queue/model/profile만 추출하고 기존 `fromCurrentRows`를 실행한다. 소스 문자열 치환·DOM·네트워크 호출 없이 고정된 저장소 모듈만 VM에서 실행한다. 고객 JSON은 실행하지 않는다.
- `node tools/briefing/build.js`가 같은 입력에서 한 번 생성한 `{manifest, records}`를 Agent 파일과 프론트 manifest에 함께 사용한다. `artifacts()`도 같은 생성기를 사용하므로 기존 `check.js`의 프론트 freshness 검사에 연결된다. Agent 파일·별도 manifest까지 포함한 검사는 아래 `check_data.js`로 실행한다.
- `branch-search-current-provider.js`의 `segmentLabels(records)`가 provider와 같은 등록 사전을 공유한다. 현재 56개 정확한 뱃지/가족 라벨을 생성하며, 특수 계산 조건 `retirement_uninstructed`는 기존 계약대로 별도로 허용한다.
- Agent 파일: `branch-agent/deploy/branch_data.json`의 `{manifest, records}`. `/custom/branch_data.json`으로 개별 COPY한다. 04는 이 파일을 로드하고 `{r['row_id']: r for r in records}`로 인덱스를 만든 뒤, 기존 `validate_request`/`validate_event`에 이 manifest를 전달한다. Python에서 해시를 다시 구현하지 않는다.
- record의 기존 `briefingMeta.caseId`는 투영 함수 호환용 화면 ID이며 `row_id`와 같다. 원본 사례 연결은 `source_case_id`만 사용한다. `ksy`의 원본은 `DEMO-01`, 표시정보 17명의 원본 사례/기준일은 null이다. `customer_id`는 기존 `customer.customerId`를 보존한다.
- 기존 중첩 투영 필드와 `searchSource`/`searchSupplement`를 모두 보존하고, `source_kind`, `as_of_date`, `original_order`, `display_overrides`를 명시한다. `cash_amount`/`cash_pct`는 기존 자산배분의 현금성 조회값을 명시적으로 투영하며 미확인은 null이다. 현금 구성/보유상품을 새로 만들지 않는다.
- UR01 근거는 `searchSupplement.management.transfer`, UR02는 같은 객체의 `instruction`/`retirementAmount`/`retirementDeposits`와 현금성 자산, UR03은 `searchSupplement.externalAccounts`의 **동일 ISA 계좌** 날짜다. 04의 evidence_refs는 이 보존된 record 내부 JSON Pointer를 사용한다.
- manifest 파일은 `integration/contracts/branch-data.manifest.json`. 프론트 전역 이름은 **`window.PensionBranchDataManifest`**이며 02의 adapter가 이 이름을 사용한다. 프론트에 records나 계약 샘플 manifest를 별도로 넣지 않는다.
- 해시 입력은 `{records, segment_labels, as_of_date, rule_version, projection_version}`의 키를 재귀 정렬한 UTF-8 JSON. 배열 순서는 유지한다. 생성 시각·절대 머신 경로를 추가하지 않는다. 데이터 변경은 원본 수정 후 생성기로 반영한다.
- 04 해석 검증 참고: 기존 로컬 provider는 `ISA 전환기한 고객 보여줘`와 `퇴직금 재입금기한 고객 보여줘`를 처리하지 못한다(이번 변경 이전 HEAD에서도 재현). 두 라벨은 기존 등록 사전에 있으므로 manifest에 유지하며 Python 계약은 허용한다. 이 기존 자연어 파서 이슈를 데이터 누락이나 실제 Agent 검증 PASS와 혼동하지 않는다.

| 인계 | 값 |
|---|---|
| 상태 | **03 완료. 04는 실제 데이터 파일과 manifest로 구현 시작 가능** |
| 공유 build.js 인계 | 02 문서의 명시적 편집·빌드 종료 인계를 확인한 뒤 순차 연결. **03의 build.js 편집·반복 빌드·전체 검사 종료**. 계약/schema/transport 등록 유지. 02의 manifest 연결 후 브라우저 재검사도 완료 |
| 생성물 | `branch-agent/deploy/branch_data.json`, `integration/contracts/branch-data.manifest.json`, `frontend/briefing-fabrix/pensionAgentDemo.js` 안의 `PensionBranchDataManifest` |
| 버전 | dataset=`branch-demo.v1`, rule=`branch-rules.v1`, projection=`current-data.v1` |
| data_version | `2faa49449acd295992aba6ca7d57aebc1ba0cb7bef3a6a363a281fc52fc9afc4` |
| 기준일 | 기본 `2026-09-14`; 실제 원본 기준일 `2026-09-04`, `2026-09-14`; mixed_dates=true, 표시정보17명 날짜 null |
| 변경 파일 | `tools/briefing/branch-data.js`·`build.js`, `frontend/src/briefing/pensionAgentDemo.js`의 opt-in 빌드 추출 훅, `branch-search-current-provider.js`의 공유 라벨 조회 함수, `branch-agent/deploy/Dockerfile`, `branch-agent/validation/check_data.js`·`check_data.py`, 생성물, 이 문서 |
| 생성·데이터 PASS | `build.js` 및 반복 전체 빌드의 생성물 바이트 동일. `check_data.js`: 객체 키 순서 불변, 금액/뱃지/날짜/사전/버전 변경 해시, 48 ID/31+17/ksy 연결, null·표시 override·원래 순서, JS/Python 집계·실제 manifest 계약, Agent JSON=manifest 파일=프론트 내장 manifest, 전체 프론트 투영과 빌드 투영 일치 |
| 집계 PASS | IRP `5949240000`(48/0), 현금 `346630000`(31/17), ISA 등록3명·30일 내1명, IRP ≥7천만원35명; UR01~03 근거 필드 유지 |
| 기존 검사 PASS | `check.js`, `check.js --agent`의 고정31명 Python 조회/SSE 및 프론트 회귀, `check_contract.js`의 JS/Python125개+outer4개·schema freshness·Python3.10 문법·Docker 정적 검사 |
| 프론트 연결 PASS | `check_frontend.js`와 Node22 `check-briefing-browser.js`: 실제 생성 manifest로 remote transport→validator→session→adapter, 누락·버전 불일치 차단, EOF·취소·실패 복구·행동·재진입, 기존 카드/상단 유지, 브라우저 예외0. 가짜 SSE 기반이며 실제 Agent 계산/LLM 검증은 아님 |
| 원본 보존 PASS | 작업 시작 시 체크섬 대비 고객/브리핑 JSON, 기존 `agent/`(재생성된 briefing_data 포함), 메인 HTML/CSS 바이트 동일. 메인 JS는 렌더 로직 변경 없이 빌드 추출 훅만 추가. 생성물 직접 수정 없음 |
| 환경 | 일반 build/check는 기본 Node18.14.0, 브라우저 CDP 검사는 설치된 Node22. 부점 Python 검사는 validation/.venv의 Python3.13/Pydantic2.13.4 |
| 미실행 / SKIP | `check.js --agent`: 기본 Python의 FastAPI/Pydantic 미설치로 **HTTP 앱 기동 검사 SKIP**. 신규 부점 HTTP Agent·실제 Gemma·실제 Docker 이미지/Nexus 설치·사내 FabriX/Starroot E2E는 미실행 |
| 남은 문제 | 데이터/manifest 연결의 미완료 항목 없음. 04는 `/custom/branch_data.json` 로드, manifest를 사용한 버전 거절 및 계산/상태/근거 포인터 검증, `/health`·`/chat`·LLM을 구현해야 함. 기존 로컬 파서의 두 기간 라벨 문구 이슈는 위 참고. 구조/가짜 응답 PASS를 실제 내용·사내 호환 PASS로 보지 않음 |

재생성·검증 명령(저장소 루트):

```sh
node tools/briefing/build.js
node branch-agent/validation/check_data.js
node tools/briefing/check.js
node tools/briefing/check.js --agent
node branch-agent/validation/check_contract.js
node branch-agent/validation/check_frontend.js
# 정적 preview(:8765)와 테스트 Chrome CDP(:9229)가 실행 중인 경우
/opt/homebrew/opt/node@22/bin/node tools/briefing/check-briefing-browser.js
```

`check_data.js --source-only`는 공유 빌드가 사용 중일 때 원본에서 메모리 생성 검증만 수행한다. 이 옵션의 생성물/프론트 비교 SKIP은 전체 완료 검사를 대체하지 않는다. 기본 실행은 실제 세 위치의 생성물까지 비교한다.

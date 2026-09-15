# PRODUCT_MASTER — 개인형IRP 브리핑용 상품 마스터

> 버전: v1.0 · 작성일: 2026-09-10 · 판매목록 처리: **B01 완료(ETF 10개 + 일반펀드 클래스 10개 = 20개)**  
> 목적: [상품 매핑 KB](PRODUCT_MATCHING_KB.md)의 상황·검색조건을 실제 상품명·종류·위험·성과/금리·조건으로 연결한다.  
> 범위: 첨부 상품자료 + 지정 `main` 브랜치 연금왕 찐천재 핵심 절. 거래 가능성·법규·현재 시세를 외부에서 검증한 자료가 아니다. **행내한 자료를 바탕으로 한 직원·기획용 초안**이며 승인된 환경에서 사용한다.

## 1. 사용 방법과 집계

**상황을 먼저 고른 뒤 상품을 찾는다.** `PRODUCT_MATCHING_KB.md`에서 PM 카드를 찾고, 연결 ID로 이 문서의 레코드를 조회한다. 등록 자체는 추천·적합성 확인 완료를 뜻하지 않는다. 고객별 최종 후보는 기본 1~3개이며, 확인되지 않은 조건을 충족한 것으로 간주하지 않는다.

| 구분 | 레코드 수 | 범위 |
|---|---:|---|
| 일반은행 등 정기예금 | 16 | DC/IRP 표 15개 + 자사규제 운용불가 1개. 만기는 레코드 안에 보존 |
| 저축은행 정기예금 | 25 | 개별 IRP 금리/조건 표의 기관상품 25개. 가입불가·IRP 금리 미기재도 상태 표시 |
| 특별제공안 | 5 | GIC 4개 + ELB 1개. 정식 상품명·회차가 아닌 제공기관×유형 단위 |
| 월간 추천·모델 구성 펀드 | 26 | 시리즈/약칭 단위. 특정 클래스와는 별도 |
| 판매목록 ETF | 10 | 선별된 실제 목록 레코드 |
| 판매목록 일반펀드 | 10 | 선별된 실제 클래스 레코드 |
| 디폴트옵션 | 10 | 포트폴리오 단위. 편입상품·비중·성과는 내부에 별도 보존 |
| 모델 포트폴리오 | 7 | 성향별 5개 + 연금수령 단계별 2개. 독립 매수상품 수에 포함하면 안 됨 |
| 관리형 서비스 | 1 | AI 투자일임. 상품과 별도 |
| **총 참조 레코드** | **110** | 상품·약칭·제공안·모델·서비스 혼합 집계이므로 ‘판매 가능 상품 수’가 아님 |

판매목록 전체는 **ETF 130행 + 일반펀드 162행 = 292행**이다. 이번 선별은 **20행**, 미구조화는 **272행(ETF 120행/펀드 152행)**이다. 펀드는 클래스별 행을 세었으며 동일 본펀드 클래스 통합 개수가 아니다. 월간 추천/원리금 자료는 별도 범위로 정리했다. 미처리 272행에 상세 설명·대기열을 만들지 않았고 다음 Batch도 자동 수행하지 않았다.

## 2. 데이터 읽기 규칙

`null`은 미확인/미기재다. `0`과 같지 않다. 금리·수익률·표준편차·비중의 수치형 `_pct` 값은 **퍼센트 단위**다(예: `2.52` = 2.52%). 상품 투자한도와 고객별 실제 매수가능액은 다르다.

**원문 정보**는 `raw_*`, `source_*`, 금리·성과 관측값에 보존했다. `asset_class`, `strategy_type`, `portfolio_role`, 상황별 활용 이유는 **원문에 기반한 기획용 분류/해석**이다. 상세 투자전략이 없는 판매목록은 이름·유형 기반 분류까지만 하며 실제 편입비중·분배주기·보수를 추정하지 않는다.

**기준시점:** S01/S02 금리 적용기간은 2026-09-01~09-30, S03은 9월 특별제공안이다. S04 1절 추천펀드 성과는 2026-08-28, TDF 성과는 2030 기준이다. S04 디폴트옵션 성과표 및 S05 판매목록에는 별도 성과 기준일이 명시되지 않아 `null`을 유지했다. 작성일을 성과 기준일로 넣지 않았다.

**동일성:** 월간 약칭·시리즈, 판매 클래스, 디폴트옵션 전용상품, 제공안, 모델을 서로 다른 `entity_type`으로 관리한다. 약칭과 클래스의 참고 연결은 가능하지만 **다른 클래스의 수익률·보수·위험등급은 복사하지 않는다.** 같은 값의 반복은 원문 관측 유지이며 임의 평균·통합하지 않았다.

**가용성:** `CONDITIONAL`은 직원 검토 후보, `EXCLUDED`는 신규 매수 후보 제외, `NEEDS_REVIEW`는 해당 필드/거래의 근거 확인 필요다. `FAMILY_CANDIDATE_REQUIRES_VARIANT`는 정식 빈티지/클래스 확인이 필요한 약칭 후보다. `INTERNAL_REVIEW_BEFORE_CUSTOMER_PROPOSAL`은 내부 검토만 가능하며 협의 완료 전에 고객 제안하지 않는다. `runtime_verified`는 전 레코드에서 false다.

단기 필요자금에는 투자수단의 만기뿐 아니라 **계좌의 인출 가능성·실제 정산일**도 확인해야 한다. 100% 운용가능 표기는 원금보장·무위험·100% 편입 권고가 아니다. 교육자료의 ‘Core/안정형’ 같은 표현도 개별 고객의 허용 상품을 자동 결정하지 않는다.

## 3. 빠른 상품 인덱스

아래 숫자는 자료를 찾기 위한 요약값이다. 모든 기간 성과 및 만기별 금리는 각 레코드에 보존했다. 기준일 미확인 성과를 날짜가 있는 월간 성과와 섞어 순위를 만들지 않는다.

| ID | 상품명/자료상 표기 | 형태 | 위험/신용(구분) | 1Y 성과 또는 금리 요약 | 후보 상태 |
|---|---|---|---|---|---|
| [DEP-001](#DEP-001) | 수협은행 노후보장 정기예금 | 정기예금 | 미확인/해당없음 | 1년 3.4% · 2026-09 / 표시·추천 보류 | NEEDS_REVIEW |
| [DEP-002](#DEP-002) | 농협은행 퇴직연금 정기예금 | 정기예금 | 미확인/해당없음 | 1년 3.37% · 2026-09 | CONDITIONAL |
| [DEP-003](#DEP-003) | 우리은행 퇴직연금 정기예금 | 정기예금 | 미확인/해당없음 | 1년 3.3% · 2026-09 | CONDITIONAL |
| [DEP-004](#DEP-004) | 하나은행 퇴직연금용 정기예금 | 정기예금 | 미확인/해당없음 | 1년 3.3% · 2026-09 | CONDITIONAL |
| [DEP-005](#DEP-005) | 신한은행 TOPS퇴직플랜 정기예금 | 정기예금 | 미확인/해당없음 | 1년 3.25% · 2026-09 | CONDITIONAL |
| [DEP-006](#DEP-006) | 산업은행 KDBPENSION 정기예금 | 정기예금 | 미확인/해당없음 | 1년 3.25% · 2026-09 | CONDITIONAL |
| [DEP-007](#DEP-007) | 기업은행 퇴직연금 정기예금 | 정기예금 | 미확인/해당없음 | 1년 3.23% · 2026-09 | CONDITIONAL |
| [DEP-008](#DEP-008) | 한국증권금융 퇴직연금 정기예금 | 정기예금 | 미확인/해당없음 | 1년 3.8% · 2026-09 | CONDITIONAL |
| [DEP-009](#DEP-009) | 전북은행 퇴직연금전용 정기예금 | 정기예금 | 미확인/해당없음 | 1년 3.72% · 2026-09 | CONDITIONAL |
| [DEP-010](#DEP-010) | 경남은행 퇴직연금전용 정기예금 | 정기예금 | 미확인/해당없음 | 1년 3.65% · 2026-09 | EXCLUDED |
| [DEP-011](#DEP-011) | 카카오뱅크 퇴직연금 정기예금 | 정기예금 | 미확인/해당없음 | 1년 3.6% · 2026-09 | CONDITIONAL |
| [DEP-012](#DEP-012) | 우체국 퇴직연금 정기예금 | 정기예금 | 미확인/해당없음 | 1년 3.55% · 2026-09 | EXCLUDED |
| [DEP-013](#DEP-013) | 광주은행 퇴직연금전용 정기예금 | 정기예금 | 미확인/해당없음 | 1년 3.5% · 2026-09 | EXCLUDED |
| [DEP-014](#DEP-014) | 아이엠뱅크 퇴직연금 정기예금 | 정기예금 | 미확인/해당없음 | 1년 3.5% · 2026-09 | EXCLUDED |
| [DEP-015](#DEP-015) | 부산은행 마이플랜 퇴직연금 정기예금 | 정기예금 | 미확인/해당없음 | 1년 3.4% · 2026-09 | CONDITIONAL |
| [DEP-016](#DEP-016) | KB 퇴직연금정기예금 | 정기예금 | 미확인/해당없음 | 1년 3.22% · 2026-09 / 표시·추천 보류 | EXCLUDED |
| [SAV-001](#SAV-001) | KB저축은행 퇴직연금 정기예금 | 저축은행 정기예금 | 신용 A- | 1년 3.5% / 2년 2.6% / 3년 2.4% | CONDITIONAL |
| [SAV-002](#SAV-002) | 신한저축은행 퇴직연금 정기예금 | 저축은행 정기예금 | 신용 A | 1년 3.5% / 2년 2% / 3년 1.9% | CONDITIONAL |
| [SAV-003](#SAV-003) | NH저축은행 퇴직연금 정기예금 | 저축은행 정기예금 | 신용 A- | 1년 3.6% / 2년 3.5% | CONDITIONAL |
| [SAV-004](#SAV-004) | 하나저축은행 퇴직연금 정기예금 | 저축은행 정기예금 | 신용 A- | 1년 3.5% / 2년 3% / 3년 2.9% | CONDITIONAL |
| [SAV-005](#SAV-005) | IBK저축은행 퇴직연금 정기예금 | 저축은행 정기예금 | 신용 A- | 1년 3.55% | CONDITIONAL |
| [SAV-006](#SAV-006) | BNK저축은행 퇴직연금 정기예금 | 저축은행 정기예금 | 신용 A | IRP 금리 미기재 | NEEDS_REVIEW |
| [SAV-007](#SAV-007) | 한국투자저축은행 퇴직연금 정기예금 | 저축은행 정기예금 | 신용 A | 1년 3.75% / 2년 2% / 3년 2% | CONDITIONAL |
| [SAV-008](#SAV-008) | 대신저축은행 퇴직연금 정기예금 | 저축은행 정기예금 | 신용 A- | 1년 3.7% / 2년 2.98% / 3년 2.98% | CONDITIONAL |
| [SAV-009](#SAV-009) | SBI저축은행 퇴직연금 정기예금 | 저축은행 정기예금 | 신용 A | 1년 3.85% / 2년 3.95% / 3년 3.95% | CONDITIONAL |
| [SAV-010](#SAV-010) | 한화저축은행 퇴직연금 정기예금 | 저축은행 정기예금 | 신용 A- | 1년 3.65% | CONDITIONAL |
| [SAV-011](#SAV-011) | 키움저축은행 퇴직연금 정기예금 | 저축은행 정기예금 | 신용 A- | 1년 3.8% / 2년 3.8% | CONDITIONAL |
| [SAV-012](#SAV-012) | 고려저축은행 퇴직연금 정기예금 | 저축은행 정기예금 | 신용 BBB+ | 1년 3.7% / 2년 3% / 3년 3% | CONDITIONAL |
| [SAV-013](#SAV-013) | DB저축은행 퇴직연금 정기예금 | 저축은행 정기예금 | 신용 A- | 1년 3.75% / 2년 3.75% / 3년 3.65% | CONDITIONAL |
| [SAV-014](#SAV-014) | 우리금융저축은행 퇴직연금 정기예금 | 저축은행 정기예금 | 신용 A | 1년 3.6% / 2년 3.6% / 3년 3% | CONDITIONAL |
| [SAV-015](#SAV-015) | 푸른저축은행 퇴직연금 정기예금 | 저축은행 정기예금 | 신용 BBB+ | 1년 4% / 2년 4% | CONDITIONAL |
| [SAV-016](#SAV-016) | 다올저축은행 퇴직연금 정기예금 | 저축은행 정기예금 | 신용 BBB | 1년 3.93% / 2년 3.4% / 3년 2.4% | CONDITIONAL |
| [SAV-017](#SAV-017) | 모아저축은행 퇴직연금 정기예금 | 저축은행 정기예금 | 신용 BBB | 1년 4% / 2년 3.4% / 3년 3.3% | CONDITIONAL |
| [SAV-018](#SAV-018) | 키움Yes저축은행 퇴직연금 정기예금 | 저축은행 정기예금 | 신용 BBB | 1년 4% / 2년 2.9% / 3년 2.4% | CONDITIONAL |
| [SAV-019](#SAV-019) | 예가람저축은행 퇴직연금 정기예금 | 저축은행 정기예금 | 신용 BBB | 1년 3.8% / 2년 3.5% / 3년 3.7% | CONDITIONAL |
| [SAV-020](#SAV-020) | OK저축은행 퇴직연금 정기예금 | 저축은행 정기예금 | 신용 BBB | 1년 3.9% / 2년 3.4% | CONDITIONAL |
| [SAV-021](#SAV-021) | 웰컴저축은행 퇴직연금 정기예금 | 저축은행 정기예금 | 신용 BBB | 1년 3.8% | CONDITIONAL |
| [SAV-022](#SAV-022) | 바로저축은행 퇴직연금 정기예금 | 저축은행 정기예금 | 신용 BBB- | 1년 3.85% / 2년 2.8% / 3년 2.8% | EXCLUDED |
| [SAV-023](#SAV-023) | 유안타저축은행 퇴직연금 정기예금 | 저축은행 정기예금 | 신용 BBB | 1년 3.96% / 2년 3.96% / 3년 3.76% | CONDITIONAL |
| [SAV-024](#SAV-024) | 애큐온저축은행 퇴직연금 정기예금 | 저축은행 정기예금 | 신용 BBB | 1년 3.95% / 2년 3.95% / 3년 3.95% | CONDITIONAL |
| [SAV-025](#SAV-025) | 제이티친애저축은행 퇴직연금 정기예금 | 저축은행 정기예금 | 신용 BBB- | 1년 3.85% / 2년 3.65% / 3년 3.35% | EXCLUDED |
| [GIC-001](#GIC-001) | KB손해보험 GIC (2026년 9월 특별제공안) | GIC | 신용 AA+ | 1년 3.8% / 2년 4.2% / 3년 4.62% / 5년 3.7% | CONDITIONAL |
| [GIC-002](#GIC-002) | DB손해보험 GIC (2026년 9월 특별제공안) | GIC | 신용 AAA | 3년 4.6% / 5년 4.5% | CONDITIONAL |
| [GIC-003](#GIC-003) | 한화생명 GIC (2026년 9월 특별제공안) | GIC | 신용 AAA | 1년 4% / 2년 3.48% / 3년 4.48% / 5년 3.54% | CONDITIONAL |
| [GIC-004](#GIC-004) | 메리츠화재 GIC (2026년 9월 특별제공안) | GIC | 신용 AA+ | 3년 4.45% / 5년 4.2% | CONDITIONAL |
| [ELB-001](#ELB-001) | 메리츠증권 ELB (2026년 9월 특별제공안) | ELB | 신용 AA | 1년 3.95% / 2년 4.3% / 3년 4.6% / 5년 4.7% | INTERNAL_REVIEW_BEFORE_CUSTOMER_PROPOSAL |
| [MF-001](#MF-001) | KB 온국민 TDF 시리즈 | 일반펀드 | 투자위험  다소높은 | 1Y 15.27% · 2026-08-28 | FAMILY_CANDIDATE_REQUIRES_VARIANT |
| [MF-002](#MF-002) | 마이다스 기본 TDF 시리즈 | 일반펀드 | 투자위험  보통 | 1Y 19.44% · 2026-08-28 | FAMILY_CANDIDATE_REQUIRES_VARIANT |
| [MF-003](#MF-003) | 신한 마음편한 TDF 시리즈 | 일반펀드 | 투자위험  다소높은 | 1Y 15.74% · 2026-08-28 | FAMILY_CANDIDATE_REQUIRES_VARIANT |
| [MF-004](#MF-004) | 한화 LIFEPLUS TDF 시리즈 | 일반펀드 | 투자위험  다소높은 | 1Y 14.57% · 2026-08-28 | FAMILY_CANDIDATE_REQUIRES_VARIANT |
| [MF-005](#MF-005) | 마이다스 아시아 리더스 성장주 (H) (주식) | 일반펀드 | 투자위험  높은 | 1Y 53.06% · 2026-08-28 | FAMILY_CANDIDATE_REQUIRES_VARIANT |
| [MF-006](#MF-006) | 에셋플러스 글로벌 리치투게더 (주식) | 일반펀드 | 투자위험  높은 | 1Y 31.05% · 2026-08-28 | FAMILY_CANDIDATE_REQUIRES_VARIANT |
| [MF-007](#MF-007) | KB RISE 미국ETF 모아드림 (주식-재간접) | 일반펀드 | 투자위험  높은 | 1Y 28.56% · 2026-08-28 | FAMILY_CANDIDATE_REQUIRES_VARIANT |
| [MF-008](#MF-008) | 피델리티 글로벌 테크놀로지 (주식-재간접) | 일반펀드 | 투자위험  높은 | 1Y 24.25% · 2026-08-28 | FAMILY_CANDIDATE_REQUIRES_VARIANT |
| [MF-009](#MF-009) | 삼성 EMP 리얼리턴 (UH) (주식혼합-재간접) | 일반펀드 | 투자위험  보통 | 1Y 22.25% · 2026-08-28 | FAMILY_CANDIDATE_REQUIRES_VARIANT |
| [MF-010](#MF-010) | KB 드림스타 자산배분 안정형 (혼합-재간접) | 일반펀드 | 투자위험  보통 | 1Y 13.04% · 2026-08-28 | FAMILY_CANDIDATE_REQUIRES_VARIANT |
| [MF-011](#MF-011) | 우리 미국단기채 공모주 (H) (채권혼합) | 일반펀드 | 투자위험  보통 | 1Y 4% · 2026-08-28 | FAMILY_CANDIDATE_REQUIRES_VARIANT |
| [MF-012](#MF-012) | KB코리아밸류업액티브 (주식) | 일반펀드 | 투자위험  높은 | 1Y 157.79% · 2026-08-28 | FAMILY_CANDIDATE_REQUIRES_VARIANT |
| [MF-013](#MF-013) | 하나 파이팅 코리아 (주식) | 일반펀드 | 투자위험  높은 | 1Y 159.98% · 2026-08-28 | FAMILY_CANDIDATE_REQUIRES_VARIANT |
| [MF-014](#MF-014) | KB 퇴직연금 배당 (주식) | 일반펀드 | 투자위험  높은 | 1Y 126.97% · 2026-08-28 | FAMILY_CANDIDATE_REQUIRES_VARIANT |
| [MF-015](#MF-015) | 키움 더드림 단기채 (채권) | 일반펀드 | 투자위험  매우낮은 | 1Y 2.39% · 2026-08-28 | FAMILY_CANDIDATE_REQUIRES_VARIANT |
| [MF-016](#MF-016) | 한국투자 크레딧 포커스 ESG (채권) | 일반펀드 | 투자위험  낮은 | 1Y 1.25% · 2026-08-28 | FAMILY_CANDIDATE_REQUIRES_VARIANT |
| [MF-017](#MF-017) | 교보악사 Tomorrow 장기우량K-1호 (채권) | 일반펀드 | 투자위험  낮은 | 1Y -5.51% · 2026-08-28 | FAMILY_CANDIDATE_REQUIRES_VARIANT |
| [MF-018](#MF-018) | 한화 내일받는 단기국공채 | 일반펀드 | 미확인/해당없음 | 미기재 | FAMILY_CANDIDATE_REQUIRES_VARIANT |
| [MF-019](#MF-019) | 유진 챔피언 단기채 | 일반펀드 | 미확인/해당없음 | 미기재 | FAMILY_CANDIDATE_REQUIRES_VARIANT |
| [MF-020](#MF-020) | KB 스타 단기국공채 | 일반펀드 | 미확인/해당없음 | 미기재 | FAMILY_CANDIDATE_REQUIRES_VARIANT |
| [MODEL-001](#MODEL-001) | 안정형 | 추천 모델 포트폴리오 | 미확인/해당없음 | 모델 기대 2.4% (실현수익 아님) | MODEL_REFERENCE_ONLY |
| [MF-021](#MF-021) | KB 글로벌 단기채(H) | 일반펀드 | 미확인/해당없음 | 미기재 | FAMILY_CANDIDATE_REQUIRES_VARIANT |
| [MF-022](#MF-022) | AB글로벌고수익 | 일반펀드 | 미확인/해당없음 | 미기재 | FAMILY_CANDIDATE_REQUIRES_VARIANT |
| [MODEL-002](#MODEL-002) | 안정추구형 | 추천 모델 포트폴리오 | 미확인/해당없음 | 모델 기대 2.4% (실현수익 아님) | MODEL_REFERENCE_ONLY |
| [MODEL-003](#MODEL-003) | 위험중립형 | 추천 모델 포트폴리오 | 미확인/해당없음 | 모델 기대 5.8% (실현수익 아님) | MODEL_REFERENCE_ONLY |
| [MF-023](#MF-023) | NH-Amundi 하나로단기채 | 일반펀드 | 미확인/해당없음 | 미기재 | FAMILY_CANDIDATE_REQUIRES_VARIANT |
| [MF-024](#MF-024) | 신한누버거버먼 미국가치주(H) | 일반펀드 | 미확인/해당없음 | 미기재 | FAMILY_CANDIDATE_REQUIRES_VARIANT |
| [MODEL-004](#MODEL-004) | 적극투자형 | 추천 모델 포트폴리오 | 미확인/해당없음 | 모델 기대 11% (실현수익 아님) | MODEL_REFERENCE_ONLY |
| [MF-025](#MF-025) | 삼성글로벌 배당성장주(H) | 일반펀드 | 미확인/해당없음 | 미기재 | FAMILY_CANDIDATE_REQUIRES_VARIANT |
| [MODEL-005](#MODEL-005) | 공격투자형 | 추천 모델 포트폴리오 | 미확인/해당없음 | 모델 기대 12.5% (실현수익 아님) | MODEL_REFERENCE_ONLY |
| [MODEL-006](#MODEL-006) | 연금 든든테마(연금수령 예정) | 추천 모델 포트폴리오 | 미확인/해당없음 | 모델 기대 2.4% (실현수익 아님) | MODEL_REFERENCE_ONLY |
| [MF-026](#MF-026) | 우리 단기채권 | 일반펀드 | 미확인/해당없음 | 미기재 | FAMILY_CANDIDATE_REQUIRES_VARIANT |
| [MODEL-007](#MODEL-007) | 연금 인컴테마(연금수령) | 추천 모델 포트폴리오 | 미확인/해당없음 | 모델 기대 2.4% (실현수익 아님) | MODEL_REFERENCE_ONLY |
| [ETF-001](#ETF-001) | KODEX 단기채권PLUS | ETF | 투자위험 6 매우낮은위험 | 1Y 2.26% · 기준일 미확인 | CONDITIONAL |
| [ETF-002](#ETF-002) | RISE 머니마켓액티브 | ETF | 투자위험 5 낮은위험 | 1Y 3% · 기준일 미확인 | CONDITIONAL |
| [ETF-003](#ETF-003) | KODEX 국고채3년 | ETF | 투자위험 5 낮은위험 | 1Y -0.66% · 기준일 미확인 | CONDITIONAL |
| [ETF-004](#ETF-004) | KODEX TRF3070 | ETF | 투자위험 5 낮은위험 | 1Y 2.85% · 기준일 미확인 | CONDITIONAL |
| [ETF-005](#ETF-005) | RISE 글로벌자산배분액티브 | ETF | 투자위험 4 보통위험 | 1Y 8% · 기준일 미확인 | CONDITIONAL |
| [ETF-006](#ETF-006) | RISE 미국S&P500 | ETF | 투자위험 2 높은위험 | 1Y 17.97% · 기준일 미확인 | CONDITIONAL |
| [ETF-007](#ETF-007) | KODEX 미국S&P500(H) | ETF | 투자위험 3 다소높은위험 | 1Y 17.09% · 기준일 미확인 | CONDITIONAL |
| [ETF-008](#ETF-008) | KODEX TDF2030액티브적격 | ETF | 투자위험 4 보통위험 | 1Y 6.12% · 기준일 미확인 | CONDITIONAL |
| [ETF-009](#ETF-009) | RISE TDF2050액티브적격 | ETF | 투자위험 4 보통위험 | 1Y 21.56% · 기준일 미확인 | CONDITIONAL |
| [ETF-010](#ETF-010) | SOL 미국배당다우존스 | ETF | 투자위험 3 다소높은위험 | 1Y 26.89% · 기준일 미확인 | CONDITIONAL |
| [FND-001](#FND-001) | 키움더드림단기채증권투자신탁(채권)C-P2E(퇴직연금) | 일반펀드 | 투자위험 6 매우낮은위험 | 1Y 2.52% · 기준일 미확인 | CONDITIONAL |
| [FND-002](#FND-002) | 우리미국단기채공모주증권자투자신탁1호(H)(채권혼합)CLASSC-PE | 일반펀드 | 투자위험 4 보통위험 | 1Y 4.25% · 기준일 미확인 | CONDITIONAL |
| [FND-003](#FND-003) | 한국투자크레딧포커스ESG증권자투자신탁1호(채권)C-RE | 일반펀드 | 투자위험 5 낮은위험 | 1Y 1.26% · 기준일 미확인 | CONDITIONAL |
| [FND-004](#FND-004) | 한화내일받는단기국공채증권자투자신탁(채권)C-RPE(퇴직연금) | 일반펀드 | 투자위험 6 매우낮은위험 | 1Y 2.53% · 기준일 미확인 | CONDITIONAL |
| [FND-005](#FND-005) | KB글로벌단기채증권자투자신탁(채권-재간접형)(H)C-퇴직E | 일반펀드 | 투자위험 5 낮은위험 | 1Y 1.58% · 기준일 미확인 | CONDITIONAL |
| [FND-006](#FND-006) | AB글로벌고수익증권투자신탁(채권-재간접형)CE-P2 | 일반펀드 | 투자위험 5 낮은위험 | 1Y 3.08% · 기준일 미확인 | CONDITIONAL |
| [FND-007](#FND-007) | 신한누버거버먼미국가치주증권투자신탁(H)(주식-재간접형)C-RE | 일반펀드 | 투자위험 4 보통위험 | 1Y 28.51% · 기준일 미확인 | CONDITIONAL |
| [FND-008](#FND-008) | 삼성글로벌배당성장주증권자투자신탁H[주식] CPE(퇴직연금) | 일반펀드 | 투자위험 3 다소높은위험 | 1Y 20.36% · 기준일 미확인 | CONDITIONAL |
| [FND-009](#FND-009) | 유진챔피언단기채증권자투자신탁(채권)C-PE2 | 일반펀드 | 투자위험 6 매우낮은위험 | 1Y 2.41% · 기준일 미확인 | CONDITIONAL |
| [FND-010](#FND-010) | KB온국민평생소득TIF40증권자투자신탁(채권혼합-재간접)C-퇴직E | 일반펀드 | 투자위험 4 보통위험 | 1Y 6.1% · 기준일 미확인 | CONDITIONAL |
| [DO-001](#DO-001) | 지켜드림 | 디폴트옵션 포트폴리오 | 초저위험 | 1Y 2.11% · 기준일 미확인 | CONDITIONAL |
| [DO-002](#DO-002) | 알파드림 | 디폴트옵션 포트폴리오 | 저위험 | 1Y 4.92% · 기준일 미확인 | CONDITIONAL |
| [DO-003](#DO-003) | 알파드림II | 디폴트옵션 포트폴리오 | 저위험 | 1Y 10.52% · 기준일 미확인 | CONDITIONAL |
| [DO-004](#DO-004) | 알파드림III | 디폴트옵션 포트폴리오 | 저위험 | 1Y 6.84% · 기준일 미확인 | CONDITIONAL |
| [DO-005](#DO-005) | 불려드림 | 디폴트옵션 포트폴리오 | 중위험 | 1Y 17.16% · 기준일 미확인 | CONDITIONAL |
| [DO-006](#DO-006) | 불려드림II | 디폴트옵션 포트폴리오 | 중위험 | 1Y 15.9% · 기준일 미확인 | CONDITIONAL |
| [DO-007](#DO-007) | 불려드림III | 디폴트옵션 포트폴리오 | 중위험 | 1Y 11.18% · 기준일 미확인 | CONDITIONAL |
| [DO-008](#DO-008) | 모두드림 | 디폴트옵션 포트폴리오 | 고위험 | 1Y 23.12% · 기준일 미확인 | CONDITIONAL |
| [DO-009](#DO-009) | 모두드림II | 디폴트옵션 포트폴리오 | 고위험 | 1Y 23.74% · 기준일 미확인 | CONDITIONAL |
| [DO-010](#DO-010) | 모두드림III | 디폴트옵션 포트폴리오 | 고위험 | 1Y 17.69% · 기준일 미확인 | CONDITIONAL |
| [SVC-001](#SVC-001) | 개인형IRP AI 투자일임 서비스 | 관리형 서비스 | 미확인/해당없음 | 미기재 | SERVICE_CONDITIONAL |

## 4. 일반은행 등 정기예금

<a id="DEP-001"></a>

### DEP-001 · 수협은행 노후보장 정기예금

```yaml
product_id: DEP-001
product_name: 수협은행 노후보장 정기예금
entity_type: individual_product
product_form: 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 재운용
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S01:L43
- E05:상품마다 다른 금리 표시 기준
provider_name: 수협은행
management_style:
- 고객이 기간·기관 선택
scheme_scope:
- DC
- 개인형IRP
risk_grade: null
credit_rating: null
irp_investment_limit_pct: null
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 연단리(은행 정기예금 교안 일반기준; 개별 약관 확인)
  rates_by_term:
    3M: null
    6M: null
    1Y: 3.4
    2Y: 3.15
    3Y: 3.25
    5Y: 2.95
  source_ref: S01:L43
  display_allowed: false
principal_protection: 자료상 원리금보장상품
deposit_protection: 은행 정기예금은 교안상 보호대상. 개별 상품·제공기관별 보호조건 확인; 기타기관에 자동 확장하지 않음.
minimum_amount_krw: null
pension_payment_eligible: null
availability:
  source_status: DC/IRP 운용지시 가능상품 표 등재
  runtime_verified: false
  execution_mode: 계속성/일회성
  candidate_state: NEEDS_REVIEW
  required_checks:
  - 해당 만기 제공 여부
  - 거래시점 적용금리·잔여한도
  - 개인형IRP 상품조회
investment_strategy: 기간별 확정금리를 비교하여 사용계획에 맞는 만기 선택. 다른 상품으로 변경할 때 기존 상품의 해지 불이익을 별도 확인.
monthly_recommended: false
portfolio_included: false
mapping_knowledge_refs:
- E05:원픽 가이드
- E08:1-2 원리금보장상품 거래하기
quality_note: S01:L51에서 빈 셀 제거에 따른 만기 열 대응 불확실을 명시. 원문 금리는 보존하되 개별 만기 금리의 브리핑 표시·비교는 보류.
```

<a id="DEP-002"></a>

### DEP-002 · 농협은행 퇴직연금 정기예금

```yaml
product_id: DEP-002
product_name: 농협은행 퇴직연금 정기예금
entity_type: individual_product
product_form: 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 재운용
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S01:L44
- E05:상품마다 다른 금리 표시 기준
provider_name: 농협은행
management_style:
- 고객이 기간·기관 선택
scheme_scope:
- DC
- 개인형IRP
risk_grade: null
credit_rating: null
irp_investment_limit_pct: null
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 연단리(은행 정기예금 교안 일반기준; 개별 약관 확인)
  rates_by_term:
    3M: 2.45
    6M: 2.75
    1Y: 3.37
    2Y: 3.2
    3Y: 3.35
    5Y: 3.35
  source_ref: S01:L44
  display_allowed: true
principal_protection: 자료상 원리금보장상품
deposit_protection: 은행 정기예금은 교안상 보호대상. 개별 상품·제공기관별 보호조건 확인; 기타기관에 자동 확장하지 않음.
minimum_amount_krw: null
pension_payment_eligible: null
availability:
  source_status: DC/IRP 운용지시 가능상품 표 등재
  runtime_verified: false
  execution_mode: 계속성/일회성
  candidate_state: CONDITIONAL
  required_checks:
  - 해당 만기 제공 여부
  - 거래시점 적용금리·잔여한도
  - 개인형IRP 상품조회
investment_strategy: 기간별 확정금리를 비교하여 사용계획에 맞는 만기 선택. 다른 상품으로 변경할 때 기존 상품의 해지 불이익을 별도 확인.
monthly_recommended: false
portfolio_included: false
mapping_knowledge_refs:
- E05:원픽 가이드
- E08:1-2 원리금보장상품 거래하기
```

<a id="DEP-003"></a>

### DEP-003 · 우리은행 퇴직연금 정기예금

```yaml
product_id: DEP-003
product_name: 우리은행 퇴직연금 정기예금
entity_type: individual_product
product_form: 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 재운용
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S01:L45
- E05:상품마다 다른 금리 표시 기준
provider_name: 우리은행
management_style:
- 고객이 기간·기관 선택
scheme_scope:
- DC
- 개인형IRP
risk_grade: null
credit_rating: null
irp_investment_limit_pct: null
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 연단리(은행 정기예금 교안 일반기준; 개별 약관 확인)
  rates_by_term:
    3M: 2.5
    6M: 2.7
    1Y: 3.3
    2Y: 3.2
    3Y: 3.2
    5Y: 3.2
  source_ref: S01:L45
  display_allowed: true
principal_protection: 자료상 원리금보장상품
deposit_protection: 은행 정기예금은 교안상 보호대상. 개별 상품·제공기관별 보호조건 확인; 기타기관에 자동 확장하지 않음.
minimum_amount_krw: null
pension_payment_eligible: null
availability:
  source_status: DC/IRP 운용지시 가능상품 표 등재
  runtime_verified: false
  execution_mode: 계속성/일회성
  candidate_state: CONDITIONAL
  required_checks:
  - 해당 만기 제공 여부
  - 거래시점 적용금리·잔여한도
  - 개인형IRP 상품조회
investment_strategy: 기간별 확정금리를 비교하여 사용계획에 맞는 만기 선택. 다른 상품으로 변경할 때 기존 상품의 해지 불이익을 별도 확인.
monthly_recommended: false
portfolio_included: false
mapping_knowledge_refs:
- E05:원픽 가이드
- E08:1-2 원리금보장상품 거래하기
```

<a id="DEP-004"></a>

### DEP-004 · 하나은행 퇴직연금용 정기예금

```yaml
product_id: DEP-004
product_name: 하나은행 퇴직연금용 정기예금
entity_type: individual_product
product_form: 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 재운용
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S01:L46
- E05:상품마다 다른 금리 표시 기준
provider_name: 하나은행
management_style:
- 고객이 기간·기관 선택
scheme_scope:
- DC
- 개인형IRP
risk_grade: null
credit_rating: null
irp_investment_limit_pct: null
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 연단리(은행 정기예금 교안 일반기준; 개별 약관 확인)
  rates_by_term:
    3M: null
    6M: 2.85
    1Y: 3.3
    2Y: 3.1
    3Y: 3.15
    5Y: 3.11
  source_ref: S01:L46
  display_allowed: true
principal_protection: 자료상 원리금보장상품
deposit_protection: 은행 정기예금은 교안상 보호대상. 개별 상품·제공기관별 보호조건 확인; 기타기관에 자동 확장하지 않음.
minimum_amount_krw: null
pension_payment_eligible: null
availability:
  source_status: DC/IRP 운용지시 가능상품 표 등재
  runtime_verified: false
  execution_mode: 계속성/일회성
  candidate_state: CONDITIONAL
  required_checks:
  - 해당 만기 제공 여부
  - 거래시점 적용금리·잔여한도
  - 개인형IRP 상품조회
investment_strategy: 기간별 확정금리를 비교하여 사용계획에 맞는 만기 선택. 다른 상품으로 변경할 때 기존 상품의 해지 불이익을 별도 확인.
monthly_recommended: false
portfolio_included: false
mapping_knowledge_refs:
- E05:원픽 가이드
- E08:1-2 원리금보장상품 거래하기
```

<a id="DEP-005"></a>

### DEP-005 · 신한은행 TOPS퇴직플랜 정기예금

```yaml
product_id: DEP-005
product_name: 신한은행 TOPS퇴직플랜 정기예금
entity_type: individual_product
product_form: 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 재운용
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S01:L47
- E05:상품마다 다른 금리 표시 기준
provider_name: 신한은행
management_style:
- 고객이 기간·기관 선택
scheme_scope:
- DC
- 개인형IRP
risk_grade: null
credit_rating: null
irp_investment_limit_pct: null
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 연단리(은행 정기예금 교안 일반기준; 개별 약관 확인)
  rates_by_term:
    3M: 2.54
    6M: 2.84
    1Y: 3.25
    2Y: 3.1
    3Y: 3.25
    5Y: 3.25
  source_ref: S01:L47
  display_allowed: true
principal_protection: 자료상 원리금보장상품
deposit_protection: 은행 정기예금은 교안상 보호대상. 개별 상품·제공기관별 보호조건 확인; 기타기관에 자동 확장하지 않음.
minimum_amount_krw: null
pension_payment_eligible: null
availability:
  source_status: DC/IRP 운용지시 가능상품 표 등재
  runtime_verified: false
  execution_mode: 계속성/일회성
  candidate_state: CONDITIONAL
  required_checks:
  - 해당 만기 제공 여부
  - 거래시점 적용금리·잔여한도
  - 개인형IRP 상품조회
investment_strategy: 기간별 확정금리를 비교하여 사용계획에 맞는 만기 선택. 다른 상품으로 변경할 때 기존 상품의 해지 불이익을 별도 확인.
monthly_recommended: false
portfolio_included: false
mapping_knowledge_refs:
- E05:원픽 가이드
- E08:1-2 원리금보장상품 거래하기
```

<a id="DEP-006"></a>

### DEP-006 · 산업은행 KDBPENSION 정기예금

```yaml
product_id: DEP-006
product_name: 산업은행 KDBPENSION 정기예금
entity_type: individual_product
product_form: 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 재운용
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S01:L48
- E05:상품마다 다른 금리 표시 기준
provider_name: 산업은행
management_style:
- 고객이 기간·기관 선택
scheme_scope:
- DC
- 개인형IRP
risk_grade: null
credit_rating: null
irp_investment_limit_pct: null
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 연단리(은행 정기예금 교안 일반기준; 개별 약관 확인)
  rates_by_term:
    3M: 2.45
    6M: 2.75
    1Y: 3.25
    2Y: 3.1
    3Y: 3.2
    5Y: 3.13
  source_ref: S01:L48
  display_allowed: true
principal_protection: 자료상 원리금보장상품
deposit_protection: 은행 정기예금은 교안상 보호대상. 개별 상품·제공기관별 보호조건 확인; 기타기관에 자동 확장하지 않음.
minimum_amount_krw: null
pension_payment_eligible: null
availability:
  source_status: DC/IRP 운용지시 가능상품 표 등재
  runtime_verified: false
  execution_mode: 계속성/일회성
  candidate_state: CONDITIONAL
  required_checks:
  - 해당 만기 제공 여부
  - 거래시점 적용금리·잔여한도
  - 개인형IRP 상품조회
investment_strategy: 기간별 확정금리를 비교하여 사용계획에 맞는 만기 선택. 다른 상품으로 변경할 때 기존 상품의 해지 불이익을 별도 확인.
monthly_recommended: false
portfolio_included: false
mapping_knowledge_refs:
- E05:원픽 가이드
- E08:1-2 원리금보장상품 거래하기
```

<a id="DEP-007"></a>

### DEP-007 · 기업은행 퇴직연금 정기예금

```yaml
product_id: DEP-007
product_name: 기업은행 퇴직연금 정기예금
entity_type: individual_product
product_form: 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 재운용
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S01:L49
- E05:상품마다 다른 금리 표시 기준
provider_name: 기업은행
management_style:
- 고객이 기간·기관 선택
scheme_scope:
- DC
- 개인형IRP
risk_grade: null
credit_rating: null
irp_investment_limit_pct: null
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 연단리(은행 정기예금 교안 일반기준; 개별 약관 확인)
  rates_by_term:
    3M: 2.46
    6M: 2.67
    1Y: 3.23
    2Y: 3.06
    3Y: 3.22
    5Y: 3.17
  source_ref: S01:L49
  display_allowed: true
principal_protection: 자료상 원리금보장상품
deposit_protection: 은행 정기예금은 교안상 보호대상. 개별 상품·제공기관별 보호조건 확인; 기타기관에 자동 확장하지 않음.
minimum_amount_krw: null
pension_payment_eligible: null
availability:
  source_status: DC/IRP 운용지시 가능상품 표 등재
  runtime_verified: false
  execution_mode: 계속성/일회성
  candidate_state: CONDITIONAL
  required_checks:
  - 해당 만기 제공 여부
  - 거래시점 적용금리·잔여한도
  - 개인형IRP 상품조회
investment_strategy: 기간별 확정금리를 비교하여 사용계획에 맞는 만기 선택. 다른 상품으로 변경할 때 기존 상품의 해지 불이익을 별도 확인.
monthly_recommended: false
portfolio_included: false
mapping_knowledge_refs:
- E05:원픽 가이드
- E08:1-2 원리금보장상품 거래하기
```

<a id="DEP-008"></a>

### DEP-008 · 한국증권금융 퇴직연금 정기예금

```yaml
product_id: DEP-008
product_name: 한국증권금융 퇴직연금 정기예금
entity_type: individual_product
product_form: 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 재운용
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S01:L57
- E05:상품마다 다른 금리 표시 기준
provider_name: 한국증권금융
management_style:
- 고객이 기간·기관 선택
scheme_scope:
- DC
- 개인형IRP
risk_grade: null
credit_rating: null
irp_investment_limit_pct: null
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 연단리(은행 정기예금 교안 일반기준; 개별 약관 확인)
  rates_by_term:
    3M: 2.5
    6M: 2.65
    1Y: 3.8
    2Y: null
    3Y: 3.35
    5Y: 3.45
  source_ref: S01:L57
  display_allowed: true
principal_protection: 자료상 원리금보장상품
deposit_protection: 은행 정기예금은 교안상 보호대상. 개별 상품·제공기관별 보호조건 확인; 기타기관에 자동 확장하지 않음.
minimum_amount_krw: null
pension_payment_eligible: null
availability:
  source_status: DC/IRP 운용지시 가능상품 표 등재
  runtime_verified: false
  execution_mode: 일회성
  candidate_state: CONDITIONAL
  required_checks:
  - 해당 만기 제공 여부
  - 거래시점 적용금리·잔여한도
  - 개인형IRP 상품조회
investment_strategy: 기간별 확정금리를 비교하여 사용계획에 맞는 만기 선택. 다른 상품으로 변경할 때 기존 상품의 해지 불이익을 별도 확인.
monthly_recommended: false
portfolio_included: false
mapping_knowledge_refs:
- E05:원픽 가이드
- E08:1-2 원리금보장상품 거래하기
source_additional_fields:
  상품기관: ''
  제도: ''
  특별중도해지 3개월: ''
  특별중도해지 6개월: ''
  비고: ''
```

<a id="DEP-009"></a>

### DEP-009 · 전북은행 퇴직연금전용 정기예금

```yaml
product_id: DEP-009
product_name: 전북은행 퇴직연금전용 정기예금
entity_type: individual_product
product_form: 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 재운용
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S01:L58
- E05:상품마다 다른 금리 표시 기준
provider_name: 전북은행
management_style:
- 고객이 기간·기관 선택
scheme_scope:
- DC
- 개인형IRP
risk_grade: null
credit_rating: null
irp_investment_limit_pct: null
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 연단리(은행 정기예금 교안 일반기준; 개별 약관 확인)
  rates_by_term:
    3M: 2.6
    6M: 3.05
    1Y: 3.72
    2Y: 3.5
    3Y: 3.4
    5Y: 3.0
  source_ref: S01:L58
  display_allowed: true
principal_protection: 자료상 원리금보장상품
deposit_protection: 은행 정기예금은 교안상 보호대상. 개별 상품·제공기관별 보호조건 확인; 기타기관에 자동 확장하지 않음.
minimum_amount_krw: null
pension_payment_eligible: null
availability:
  source_status: DC/IRP 운용지시 가능상품 표 등재
  runtime_verified: false
  execution_mode: 일회성
  candidate_state: CONDITIONAL
  required_checks:
  - 해당 만기 제공 여부
  - 거래시점 적용금리·잔여한도
  - 개인형IRP 상품조회
investment_strategy: 기간별 확정금리를 비교하여 사용계획에 맞는 만기 선택. 다른 상품으로 변경할 때 기존 상품의 해지 불이익을 별도 확인.
monthly_recommended: false
portfolio_included: false
mapping_knowledge_refs:
- E05:원픽 가이드
- E08:1-2 원리금보장상품 거래하기
source_additional_fields:
  상품기관: 전북
  제도: DC/IRP
  특별중도해지 3개월: 2.60%
  특별중도해지 6개월: 3.05%
  비고: ''
```

<a id="DEP-010"></a>

### DEP-010 · 경남은행 퇴직연금전용 정기예금

```yaml
product_id: DEP-010
product_name: 경남은행 퇴직연금전용 정기예금
entity_type: individual_product
product_form: 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 재운용
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S01:L59
- E05:상품마다 다른 금리 표시 기준
provider_name: 경남은행
management_style:
- 고객이 기간·기관 선택
scheme_scope:
- DC
- 개인형IRP
risk_grade: null
credit_rating: null
irp_investment_limit_pct: null
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 연단리(은행 정기예금 교안 일반기준; 개별 약관 확인)
  rates_by_term:
    3M: 2.4
    6M: 2.5
    1Y: 3.65
    2Y: 3.5
    3Y: 3.5
    5Y: null
  source_ref: S01:L59
  display_allowed: true
principal_protection: 자료상 원리금보장상품
deposit_protection: 은행 정기예금은 교안상 보호대상. 개별 상품·제공기관별 보호조건 확인; 기타기관에 자동 확장하지 않음.
minimum_amount_krw: null
pension_payment_eligible: null
availability:
  source_status: 가입불가
  runtime_verified: false
  execution_mode: 일회성
  candidate_state: EXCLUDED
  required_checks:
  - 해당 만기 제공 여부
  - 거래시점 적용금리·잔여한도
  - 개인형IRP 상품조회
investment_strategy: 기간별 확정금리를 비교하여 사용계획에 맞는 만기 선택. 다른 상품으로 변경할 때 기존 상품의 해지 불이익을 별도 확인.
monthly_recommended: false
portfolio_included: false
mapping_knowledge_refs:
- E05:원픽 가이드
- E08:1-2 원리금보장상품 거래하기
source_additional_fields:
  상품기관: 경남
  제도: DC/IRP
  특별중도해지 3개월: 2.40%
  특별중도해지 6개월: 2.50%
  비고: ※가입불가!
```

<a id="DEP-011"></a>

### DEP-011 · 카카오뱅크 퇴직연금 정기예금

```yaml
product_id: DEP-011
product_name: 카카오뱅크 퇴직연금 정기예금
entity_type: individual_product
product_form: 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 재운용
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S01:L60
- E05:상품마다 다른 금리 표시 기준
provider_name: 카카오뱅크
management_style:
- 고객이 기간·기관 선택
scheme_scope:
- DC
- 개인형IRP
risk_grade: null
credit_rating: null
irp_investment_limit_pct: null
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 연단리(은행 정기예금 교안 일반기준; 개별 약관 확인)
  rates_by_term:
    3M: null
    6M: null
    1Y: 3.6
    2Y: 3.4
    3Y: 3.4
    5Y: null
  source_ref: S01:L60
  display_allowed: true
principal_protection: 자료상 원리금보장상품
deposit_protection: 은행 정기예금은 교안상 보호대상. 개별 상품·제공기관별 보호조건 확인; 기타기관에 자동 확장하지 않음.
minimum_amount_krw: null
pension_payment_eligible: null
availability:
  source_status: DC/IRP 운용지시 가능상품 표 등재
  runtime_verified: false
  execution_mode: 일회성
  candidate_state: CONDITIONAL
  required_checks:
  - 해당 만기 제공 여부
  - 거래시점 적용금리·잔여한도
  - 개인형IRP 상품조회
investment_strategy: 기간별 확정금리를 비교하여 사용계획에 맞는 만기 선택. 다른 상품으로 변경할 때 기존 상품의 해지 불이익을 별도 확인.
monthly_recommended: false
portfolio_included: false
mapping_knowledge_refs:
- E05:원픽 가이드
- E08:1-2 원리금보장상품 거래하기
source_additional_fields:
  상품기관: ''
  제도: ''
  특별중도해지 3개월: ''
  특별중도해지 6개월: ''
  비고: ''
```

<a id="DEP-012"></a>

### DEP-012 · 우체국 퇴직연금 정기예금

```yaml
product_id: DEP-012
product_name: 우체국 퇴직연금 정기예금
entity_type: individual_product
product_form: 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 재운용
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S01:L61
- E05:상품마다 다른 금리 표시 기준
provider_name: 우체국
management_style:
- 고객이 기간·기관 선택
scheme_scope:
- DC
- 개인형IRP
risk_grade: null
credit_rating: null
irp_investment_limit_pct: null
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 연단리(은행 정기예금 교안 일반기준; 개별 약관 확인)
  rates_by_term:
    3M: 2.75
    6M: 2.95
    1Y: 3.55
    2Y: 3.6
    3Y: 3.6
    5Y: 3.65
  source_ref: S01:L61
  display_allowed: true
principal_protection: 자료상 원리금보장상품
deposit_protection: 은행 정기예금은 교안상 보호대상. 개별 상품·제공기관별 보호조건 확인; 기타기관에 자동 확장하지 않음.
minimum_amount_krw: null
pension_payment_eligible: null
availability:
  source_status: 가입불가
  runtime_verified: false
  execution_mode: 일회성
  candidate_state: EXCLUDED
  required_checks:
  - 해당 만기 제공 여부
  - 거래시점 적용금리·잔여한도
  - 개인형IRP 상품조회
investment_strategy: 기간별 확정금리를 비교하여 사용계획에 맞는 만기 선택. 다른 상품으로 변경할 때 기존 상품의 해지 불이익을 별도 확인.
monthly_recommended: false
portfolio_included: false
mapping_knowledge_refs:
- E05:원픽 가이드
- E08:1-2 원리금보장상품 거래하기
source_additional_fields:
  상품기관: 우체국
  제도: DC/IRP
  특별중도해지 3개월: 2.75%
  특별중도해지 6개월: 2.95%
  비고: ※가입불가!
```

<a id="DEP-013"></a>

### DEP-013 · 광주은행 퇴직연금전용 정기예금

```yaml
product_id: DEP-013
product_name: 광주은행 퇴직연금전용 정기예금
entity_type: individual_product
product_form: 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 재운용
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S01:L62
- E05:상품마다 다른 금리 표시 기준
provider_name: 광주은행
management_style:
- 고객이 기간·기관 선택
scheme_scope:
- DC
- 개인형IRP
risk_grade: null
credit_rating: null
irp_investment_limit_pct: null
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 연단리(은행 정기예금 교안 일반기준; 개별 약관 확인)
  rates_by_term:
    3M: 2.55
    6M: 2.65
    1Y: 3.5
    2Y: 3.55
    3Y: 3.2
    5Y: 2.5
  source_ref: S01:L62
  display_allowed: true
principal_protection: 자료상 원리금보장상품
deposit_protection: 은행 정기예금은 교안상 보호대상. 개별 상품·제공기관별 보호조건 확인; 기타기관에 자동 확장하지 않음.
minimum_amount_krw: null
pension_payment_eligible: null
availability:
  source_status: 가입불가
  runtime_verified: false
  execution_mode: 일회성
  candidate_state: EXCLUDED
  required_checks:
  - 해당 만기 제공 여부
  - 거래시점 적용금리·잔여한도
  - 개인형IRP 상품조회
investment_strategy: 기간별 확정금리를 비교하여 사용계획에 맞는 만기 선택. 다른 상품으로 변경할 때 기존 상품의 해지 불이익을 별도 확인.
monthly_recommended: false
portfolio_included: false
mapping_knowledge_refs:
- E05:원픽 가이드
- E08:1-2 원리금보장상품 거래하기
source_additional_fields:
  상품기관: ''
  제도: ''
  특별중도해지 3개월: ''
  특별중도해지 6개월: ''
  비고: ※가입불가!
```

<a id="DEP-014"></a>

### DEP-014 · 아이엠뱅크 퇴직연금 정기예금

```yaml
product_id: DEP-014
product_name: 아이엠뱅크 퇴직연금 정기예금
entity_type: individual_product
product_form: 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 재운용
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S01:L63
- E05:상품마다 다른 금리 표시 기준
provider_name: 아이엠뱅크
management_style:
- 고객이 기간·기관 선택
scheme_scope:
- DC
- 개인형IRP
risk_grade: null
credit_rating: null
irp_investment_limit_pct: null
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 연단리(은행 정기예금 교안 일반기준; 개별 약관 확인)
  rates_by_term:
    3M: null
    6M: 2.85
    1Y: 3.5
    2Y: 3.2
    3Y: 3.2
    5Y: 3.1
  source_ref: S01:L63
  display_allowed: true
principal_protection: 자료상 원리금보장상품
deposit_protection: 은행 정기예금은 교안상 보호대상. 개별 상품·제공기관별 보호조건 확인; 기타기관에 자동 확장하지 않음.
minimum_amount_krw: null
pension_payment_eligible: null
availability:
  source_status: 가입불가
  runtime_verified: false
  execution_mode: 일회성
  candidate_state: EXCLUDED
  required_checks:
  - 해당 만기 제공 여부
  - 거래시점 적용금리·잔여한도
  - 개인형IRP 상품조회
investment_strategy: 기간별 확정금리를 비교하여 사용계획에 맞는 만기 선택. 다른 상품으로 변경할 때 기존 상품의 해지 불이익을 별도 확인.
monthly_recommended: false
portfolio_included: false
mapping_knowledge_refs:
- E05:원픽 가이드
- E08:1-2 원리금보장상품 거래하기
source_additional_fields:
  상품기관: ''
  제도: ''
  특별중도해지 3개월: ''
  특별중도해지 6개월: ''
  비고: ※가입불가!
```

<a id="DEP-015"></a>

### DEP-015 · 부산은행 마이플랜 퇴직연금 정기예금

```yaml
product_id: DEP-015
product_name: 부산은행 마이플랜 퇴직연금 정기예금
entity_type: individual_product
product_form: 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 재운용
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S01:L64
- E05:상품마다 다른 금리 표시 기준
provider_name: 부산은행
management_style:
- 고객이 기간·기관 선택
scheme_scope:
- DC
- 개인형IRP
risk_grade: null
credit_rating: null
irp_investment_limit_pct: null
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 연단리(은행 정기예금 교안 일반기준; 개별 약관 확인)
  rates_by_term:
    3M: null
    6M: 2.65
    1Y: 3.4
    2Y: 3.15
    3Y: 3.25
    5Y: null
  source_ref: S01:L64
  display_allowed: true
principal_protection: 자료상 원리금보장상품
deposit_protection: 은행 정기예금은 교안상 보호대상. 개별 상품·제공기관별 보호조건 확인; 기타기관에 자동 확장하지 않음.
minimum_amount_krw: null
pension_payment_eligible: null
availability:
  source_status: DC/IRP 운용지시 가능상품 표 등재
  runtime_verified: false
  execution_mode: 일회성
  candidate_state: CONDITIONAL
  required_checks:
  - 해당 만기 제공 여부
  - 거래시점 적용금리·잔여한도
  - 개인형IRP 상품조회
investment_strategy: 기간별 확정금리를 비교하여 사용계획에 맞는 만기 선택. 다른 상품으로 변경할 때 기존 상품의 해지 불이익을 별도 확인.
monthly_recommended: false
portfolio_included: false
mapping_knowledge_refs:
- E05:원픽 가이드
- E08:1-2 원리금보장상품 거래하기
source_additional_fields:
  상품기관: 부산
  제도: DC/IRP
  특별중도해지 3개월: 2.65%
  특별중도해지 6개월: ''
  비고: ''
```

<a id="DEP-016"></a>

### DEP-016 · KB 퇴직연금정기예금

```yaml
product_id: DEP-016
product_name: KB 퇴직연금정기예금
entity_type: individual_product
product_form: 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role: []
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S01:L88-L93
scheme_scope:
- DC
- 개인형IRP
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rates_by_term:
    3M: 2.53
    6M: 2.65
    1Y: 3.22
    2Y: 3.03
    3Y: 3.15
    5Y: 3.03
  display_allowed: false
availability:
  source_status: 운용불가(자사상품규제)
  candidate_state: EXCLUDED
  runtime_verified: false
quality_note: 금리표에 있어도 매수 후보로 사용하지 않음.
```


## 5. 저축은행 정기예금

<a id="SAV-001"></a>

### SAV-001 · KB저축은행 퇴직연금 정기예금

```yaml
product_id: SAV-001
product_name: KB저축은행 퇴직연금 정기예금
entity_type: individual_product
product_form: 저축은행 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 분산
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S02:L61-L65
- S02:L6-L14
- S03:L67-L70
- E05:상품별 예금자보호 여부와 특징
source_names:
- KB저축은행 퇴직연금 정기예금
provider_name: KB저축은행
scheme_scope:
- 개인형IRP
credit_rating: A-
risk_grade: null
irp_investment_limit_pct: null
management_style:
- 기관·만기 직접 선택
principal_protection: 자료상 원리금보장상품
deposit_protection:
  source_value: 상품제공기관별 1억원 한도
  account_aggregation: 자료상 DC/IRP 합산 관리
  source_refs:
  - S02:L10
  - S03:L69-L70
subscription_amount_policy:
  one_year_only_cap_krw: 95000000
  two_or_three_year_holdings_cap_krw: 90000000
  minimum_amount_krw: null
  source_ref: S03:L69-L70
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 월복리(교안 일반기준; 개별 약관 확인)
  purchase_rates:
  - term: 1년
    rate_pct: 3.5
    source_ref: S02:L63
  - term: 2년
    rate_pct: 2.6
    source_ref: S02:L64
  - term: 3년
    rate_pct: 2.4
    source_ref: S02:L65
  early_termination_reference_rates:
  - term: 3개월
    rate_pct: 1.7
    source_ref: S02:L61
  - term: 6개월
    rate_pct: 1.7
    source_ref: S02:L62
  reference_rate_note: 3·6개월은 특별중도해지이율 참고용이며 가입불가(S02:L14).
availability:
  source_status: IRP 금리 기재; 제공한도·신규 가능 여부 확인 필요
  candidate_state: CONDITIONAL
  runtime_verified: false
  required_checks:
  - 04-12-17A 제공기관 잔여한도·실제 가입가능 여부
  - 동일 제공기관 DC/IRP 보유 및 가입한도
  - 개인형IRP와 기업형IRP 제한 구분
  other_scheme_restrictions: []
early_termination:
  source_terms:
  - text: '- 1개월 미만 : 0.1%; - 6개월 미만 : 약정이율 × 60% × 경과월수/계약월수; - 1년 미만 : 약정이율 × 70% × 경과월수/계약월수; - 2년 미만 : 약정이율 × 80% × 경과월수/계약월수;
      - 2년 이상 : 약정이율 × 90% × 경과월수/계약월수; (1개월 이상 : 최저금리는 약정이율 × 50%)'
    source_ref: S02:L61
  common_special_terms_ref: S02:L179-L186
  note: 원문 조건 보존. 공통식과 기관별 식을 중복 계산하지 않음. 가입 당시 약정·특별중도해지 사유별 실제 적용 확인.
pension_payment_eligible: null
investment_strategy: 기존 원리금보장 운용을 유지하려는 자금의 기관·만기 비교 후보. 금리만으로 기관 집중 또는 장기화를 결정하지 않음.
mapping_knowledge_refs:
- E05:원픽 가이드 — 고금리 추구/금리 변동성 대응
- K01:RS-15
- K02:CASE 16
```

<a id="SAV-002"></a>

### SAV-002 · 신한저축은행 퇴직연금 정기예금

```yaml
product_id: SAV-002
product_name: 신한저축은행 퇴직연금 정기예금
entity_type: individual_product
product_form: 저축은행 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 분산
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S02:L66-L70
- S02:L6-L14
- S03:L67-L70
- E05:상품별 예금자보호 여부와 특징
source_names:
- 신한저축은행 퇴직연금 정기예금
provider_name: 신한저축은행
scheme_scope:
- 개인형IRP
credit_rating: A
risk_grade: null
irp_investment_limit_pct: null
management_style:
- 기관·만기 직접 선택
principal_protection: 자료상 원리금보장상품
deposit_protection:
  source_value: 상품제공기관별 1억원 한도
  account_aggregation: 자료상 DC/IRP 합산 관리
  source_refs:
  - S02:L10
  - S03:L69-L70
subscription_amount_policy:
  one_year_only_cap_krw: 95000000
  two_or_three_year_holdings_cap_krw: 90000000
  minimum_amount_krw: null
  source_ref: S03:L69-L70
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 월복리(교안 일반기준; 개별 약관 확인)
  purchase_rates:
  - term: 1년
    rate_pct: 3.5
    source_ref: S02:L68
  - term: 2년
    rate_pct: 2.0
    source_ref: S02:L69
  - term: 3년
    rate_pct: 1.9
    source_ref: S02:L70
  early_termination_reference_rates:
  - term: 3개월
    rate_pct: 1.8
    source_ref: S02:L66
  - term: 6개월
    rate_pct: 2.3
    source_ref: S02:L67
  reference_rate_note: 3·6개월은 특별중도해지이율 참고용이며 가입불가(S02:L14).
availability:
  source_status: IRP 금리 기재; 제공한도·신규 가능 여부 확인 필요
  candidate_state: CONDITIONAL
  runtime_verified: false
  required_checks:
  - 04-12-17A 제공기관 잔여한도·실제 가입가능 여부
  - 동일 제공기관 DC/IRP 보유 및 가입한도
  - 개인형IRP와 기업형IRP 제한 구분
  other_scheme_restrictions: []
early_termination:
  source_terms:
  - text: '- 1개월 미만 : 0.2% (보통예금이율); - 1년 미만 : 약정이율 × 70% × 경과월수/계약월수; - 2년 미만 : 약정이율 × 80% × 경과월수/계약월수; - 3년 미만 : 약정이율 ×
      90% × 경과월수/계약월수; (1~3년 미만 : 최저금리는 약정이율 × 50%)'
    source_ref: S02:L66
  common_special_terms_ref: S02:L179-L186
  note: 원문 조건 보존. 공통식과 기관별 식을 중복 계산하지 않음. 가입 당시 약정·특별중도해지 사유별 실제 적용 확인.
pension_payment_eligible: null
investment_strategy: 기존 원리금보장 운용을 유지하려는 자금의 기관·만기 비교 후보. 금리만으로 기관 집중 또는 장기화를 결정하지 않음.
mapping_knowledge_refs:
- E05:원픽 가이드 — 고금리 추구/금리 변동성 대응
- K01:RS-15
- K02:CASE 16
```

<a id="SAV-003"></a>

### SAV-003 · NH저축은행 퇴직연금 정기예금

```yaml
product_id: SAV-003
product_name: NH저축은행 퇴직연금 정기예금
entity_type: individual_product
product_form: 저축은행 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 분산
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S02:L71-L74
- S02:L6-L14
- S03:L67-L70
- E05:상품별 예금자보호 여부와 특징
source_names:
- NH저축은행 퇴직연금 정기예금
provider_name: NH저축은행
scheme_scope:
- 개인형IRP
credit_rating: A-
risk_grade: null
irp_investment_limit_pct: null
management_style:
- 기관·만기 직접 선택
principal_protection: 자료상 원리금보장상품
deposit_protection:
  source_value: 상품제공기관별 1억원 한도
  account_aggregation: 자료상 DC/IRP 합산 관리
  source_refs:
  - S02:L10
  - S03:L69-L70
subscription_amount_policy:
  one_year_only_cap_krw: 95000000
  two_or_three_year_holdings_cap_krw: 90000000
  minimum_amount_krw: null
  source_ref: S03:L69-L70
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 월복리(교안 일반기준; 개별 약관 확인)
  purchase_rates:
  - term: 1년
    rate_pct: 3.6
    source_ref: S02:L73
  - term: 2년
    rate_pct: 3.5
    source_ref: S02:L74
  early_termination_reference_rates:
  - term: 3개월
    rate_pct: 3.0
    source_ref: S02:L71
  - term: 6개월
    rate_pct: 3.3
    source_ref: S02:L72
  reference_rate_note: 3·6개월은 특별중도해지이율 참고용이며 가입불가(S02:L14).
availability:
  source_status: IRP 금리 기재; 제공한도·신규 가능 여부 확인 필요
  candidate_state: CONDITIONAL
  runtime_verified: false
  required_checks:
  - 04-12-17A 제공기관 잔여한도·실제 가입가능 여부
  - 동일 제공기관 DC/IRP 보유 및 가입한도
  - 개인형IRP와 기업형IRP 제한 구분
  other_scheme_restrictions: []
early_termination:
  source_terms:
  - text: '- 1개월 미만 : 0.2% (보통예금이율); - 1개월 이상 ~ 3개월 미만 : 약정이율 × 50%; - 12개월 미만 : 약정이율 × 60%; - 12개월 이상 : 약정이율 × 70%; (단, 일반중도해지이율은
      특별중도해지이율보다 높지 않음)'
    source_ref: S02:L71
  common_special_terms_ref: S02:L179-L186
  note: 원문 조건 보존. 공통식과 기관별 식을 중복 계산하지 않음. 가입 당시 약정·특별중도해지 사유별 실제 적용 확인.
pension_payment_eligible: null
investment_strategy: 기존 원리금보장 운용을 유지하려는 자금의 기관·만기 비교 후보. 금리만으로 기관 집중 또는 장기화를 결정하지 않음.
mapping_knowledge_refs:
- E05:원픽 가이드 — 고금리 추구/금리 변동성 대응
- K01:RS-15
- K02:CASE 16
```

<a id="SAV-004"></a>

### SAV-004 · 하나저축은행 퇴직연금 정기예금

```yaml
product_id: SAV-004
product_name: 하나저축은행 퇴직연금 정기예금
entity_type: individual_product
product_form: 저축은행 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 분산
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S02:L75-L79
- S02:L6-L14
- S03:L67-L70
- E05:상품별 예금자보호 여부와 특징
source_names:
- 하나저축은행 퇴직연금 정기예금
provider_name: 하나저축은행
scheme_scope:
- 개인형IRP
credit_rating: A-
risk_grade: null
irp_investment_limit_pct: null
management_style:
- 기관·만기 직접 선택
principal_protection: 자료상 원리금보장상품
deposit_protection:
  source_value: 상품제공기관별 1억원 한도
  account_aggregation: 자료상 DC/IRP 합산 관리
  source_refs:
  - S02:L10
  - S03:L69-L70
subscription_amount_policy:
  one_year_only_cap_krw: 95000000
  two_or_three_year_holdings_cap_krw: 90000000
  minimum_amount_krw: null
  source_ref: S03:L69-L70
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 월복리(교안 일반기준; 개별 약관 확인)
  purchase_rates:
  - term: 1년
    rate_pct: 3.5
    source_ref: S02:L77
  - term: 2년
    rate_pct: 3.0
    source_ref: S02:L78
  - term: 3년
    rate_pct: 2.9
    source_ref: S02:L79
  early_termination_reference_rates:
  - term: 3개월
    rate_pct: 2.6
    source_ref: S02:L75
  - term: 6개월
    rate_pct: 2.6
    source_ref: S02:L76
  reference_rate_note: 3·6개월은 특별중도해지이율 참고용이며 가입불가(S02:L14).
availability:
  source_status: IRP 금리 기재; 제공한도·신규 가능 여부 확인 필요
  candidate_state: CONDITIONAL
  runtime_verified: false
  required_checks:
  - 04-12-17A 제공기관 잔여한도·실제 가입가능 여부
  - 동일 제공기관 DC/IRP 보유 및 가입한도
  - 개인형IRP와 기업형IRP 제한 구분
  other_scheme_restrictions: []
early_termination:
  source_terms:
  - text: '- 1개월 미만 : 0.2% (보통예금이율); - 1년 미만 : 약정이율 × 60% × 경과월수/계약월수; - 2년 미만 : 약정이율 × 70% × 경과월수/계약월수; - 2년 이상 : 약정이율 ×
      80% × 경과월수/계약월수; (1개월 이상 : 최저금리는 약정이율 × 50%)'
    source_ref: S02:L75
  common_special_terms_ref: S02:L179-L186
  note: 원문 조건 보존. 공통식과 기관별 식을 중복 계산하지 않음. 가입 당시 약정·특별중도해지 사유별 실제 적용 확인.
pension_payment_eligible: null
investment_strategy: 기존 원리금보장 운용을 유지하려는 자금의 기관·만기 비교 후보. 금리만으로 기관 집중 또는 장기화를 결정하지 않음.
mapping_knowledge_refs:
- E05:원픽 가이드 — 고금리 추구/금리 변동성 대응
- K01:RS-15
- K02:CASE 16
```

<a id="SAV-005"></a>

### SAV-005 · IBK저축은행 퇴직연금 정기예금

```yaml
product_id: SAV-005
product_name: IBK저축은행 퇴직연금 정기예금
entity_type: individual_product
product_form: 저축은행 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 분산
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S02:L80-L82
- S02:L6-L14
- S03:L67-L70
- E05:상품별 예금자보호 여부와 특징
source_names:
- IBK저축은행 퇴직연금 정기예금
provider_name: IBK저축은행
scheme_scope:
- 개인형IRP
credit_rating: A-
risk_grade: null
irp_investment_limit_pct: null
management_style:
- 기관·만기 직접 선택
principal_protection: 자료상 원리금보장상품
deposit_protection:
  source_value: 상품제공기관별 1억원 한도
  account_aggregation: 자료상 DC/IRP 합산 관리
  source_refs:
  - S02:L10
  - S03:L69-L70
subscription_amount_policy:
  one_year_only_cap_krw: 95000000
  two_or_three_year_holdings_cap_krw: 90000000
  minimum_amount_krw: null
  source_ref: S03:L69-L70
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 월복리(교안 일반기준; 개별 약관 확인)
  purchase_rates:
  - term: 1년
    rate_pct: 3.55
    source_ref: S02:L82
  early_termination_reference_rates:
  - term: 3개월
    rate_pct: 1.2
    source_ref: S02:L80
  - term: 6개월
    rate_pct: 2.0
    source_ref: S02:L81
  reference_rate_note: 3·6개월은 특별중도해지이율 참고용이며 가입불가(S02:L14).
availability:
  source_status: IRP 금리 기재; 제공한도·신규 가능 여부 확인 필요
  candidate_state: CONDITIONAL
  runtime_verified: false
  required_checks:
  - 04-12-17A 제공기관 잔여한도·실제 가입가능 여부
  - 동일 제공기관 DC/IRP 보유 및 가입한도
  - 개인형IRP와 기업형IRP 제한 구분
  other_scheme_restrictions: []
early_termination:
  source_terms:
  - text: '- 1개월 미만 : 0.4% (보통예금이율); - 1개월 이상 ~ 3개월 미만 : 약정금리 × 50%; - 6개월 미만 : 약정금리 × 52%; - 1년 미만 : 약정금리 × 55%; - 2년 미만
      : 약정금리 × 60%; - 2년 이상 : 약정금리 × 70%; (1개월 이상 : 최저금리는 약정이율 × 50%)'
    source_ref: S02:L80
  common_special_terms_ref: S02:L179-L186
  note: 원문 조건 보존. 공통식과 기관별 식을 중복 계산하지 않음. 가입 당시 약정·특별중도해지 사유별 실제 적용 확인.
pension_payment_eligible: null
investment_strategy: 기존 원리금보장 운용을 유지하려는 자금의 기관·만기 비교 후보. 금리만으로 기관 집중 또는 장기화를 결정하지 않음.
mapping_knowledge_refs:
- E05:원픽 가이드 — 고금리 추구/금리 변동성 대응
- K01:RS-15
- K02:CASE 16
```

<a id="SAV-006"></a>

### SAV-006 · BNK저축은행 퇴직연금 정기예금

```yaml
product_id: SAV-006
product_name: BNK저축은행 퇴직연금 정기예금
entity_type: individual_product
product_form: 저축은행 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 분산
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S02:L83-L87
- S02:L6-L14
- S03:L67-L70
- E05:상품별 예금자보호 여부와 특징
source_names:
- BNK저축은행 퇴직연금 정기예금
provider_name: BNK저축은행
scheme_scope:
- 개인형IRP
credit_rating: A
risk_grade: null
irp_investment_limit_pct: null
management_style:
- 기관·만기 직접 선택
principal_protection: 자료상 원리금보장상품
deposit_protection:
  source_value: 상품제공기관별 1억원 한도
  account_aggregation: 자료상 DC/IRP 합산 관리
  source_refs:
  - S02:L10
  - S03:L69-L70
subscription_amount_policy:
  one_year_only_cap_krw: 95000000
  two_or_three_year_holdings_cap_krw: 90000000
  minimum_amount_krw: null
  source_ref: S03:L69-L70
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 월복리(교안 일반기준; 개별 약관 확인)
  purchase_rates:
  - term: 1년
    rate_pct: null
    source_ref: S02:L85
  - term: 2년
    rate_pct: null
    source_ref: S02:L86
  - term: 3년
    rate_pct: null
    source_ref: S02:L87
  early_termination_reference_rates:
  - term: 3개월
    rate_pct: null
    source_ref: S02:L83
  - term: 6개월
    rate_pct: null
    source_ref: S02:L84
  reference_rate_note: 3·6개월은 특별중도해지이율 참고용이며 가입불가(S02:L14).
availability:
  source_status: IRP 금리 미기재
  candidate_state: NEEDS_REVIEW
  runtime_verified: false
  required_checks:
  - 04-12-17A 제공기관 잔여한도·실제 가입가능 여부
  - 동일 제공기관 DC/IRP 보유 및 가입한도
  - 개인형IRP와 기업형IRP 제한 구분
  other_scheme_restrictions: []
early_termination:
  source_terms:
  - text: '- 1개월 미만 : 0.01%; - 6개월 미만 : 약정이율 × 50%; - 2년 미만 : 약정이율 × 60%; - 2년 이상 : 약정이율 × 70%'
    source_ref: S02:L83
  common_special_terms_ref: S02:L179-L186
  note: 원문 조건 보존. 공통식과 기관별 식을 중복 계산하지 않음. 가입 당시 약정·특별중도해지 사유별 실제 적용 확인.
pension_payment_eligible: null
investment_strategy: 기존 원리금보장 운용을 유지하려는 자금의 기관·만기 비교 후보. 금리만으로 기관 집중 또는 장기화를 결정하지 않음.
mapping_knowledge_refs:
- E05:원픽 가이드 — 고금리 추구/금리 변동성 대응
- K01:RS-15
- K02:CASE 16
```

<a id="SAV-007"></a>

### SAV-007 · 한국투자저축은행 퇴직연금 정기예금

```yaml
product_id: SAV-007
product_name: 한국투자저축은행 퇴직연금 정기예금
entity_type: individual_product
product_form: 저축은행 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 분산
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S02:L88-L92
- S02:L6-L14
- S03:L67-L70
- E05:상품별 예금자보호 여부와 특징
source_names:
- 한국투자저축은행 퇴직연금 정기예금 (기업형IRP 판매불가)
provider_name: 한국투자저축은행
scheme_scope:
- 개인형IRP
credit_rating: A
risk_grade: null
irp_investment_limit_pct: null
management_style:
- 기관·만기 직접 선택
principal_protection: 자료상 원리금보장상품
deposit_protection:
  source_value: 상품제공기관별 1억원 한도
  account_aggregation: 자료상 DC/IRP 합산 관리
  source_refs:
  - S02:L10
  - S03:L69-L70
subscription_amount_policy:
  one_year_only_cap_krw: 95000000
  two_or_three_year_holdings_cap_krw: 90000000
  minimum_amount_krw: null
  source_ref: S03:L69-L70
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 월복리(교안 일반기준; 개별 약관 확인)
  purchase_rates:
  - term: 1년
    rate_pct: 3.75
    source_ref: S02:L90
  - term: 2년
    rate_pct: 2.0
    source_ref: S02:L91
  - term: 3년
    rate_pct: 2.0
    source_ref: S02:L92
  early_termination_reference_rates:
  - term: 3개월
    rate_pct: 2.0
    source_ref: S02:L88
  - term: 6개월
    rate_pct: 2.3
    source_ref: S02:L89
  reference_rate_note: 3·6개월은 특별중도해지이율 참고용이며 가입불가(S02:L14).
availability:
  source_status: IRP 금리 기재; 제공한도·신규 가능 여부 확인 필요
  candidate_state: CONDITIONAL
  runtime_verified: false
  required_checks:
  - 04-12-17A 제공기관 잔여한도·실제 가입가능 여부
  - 동일 제공기관 DC/IRP 보유 및 가입한도
  - 개인형IRP와 기업형IRP 제한 구분
  other_scheme_restrictions:
  - 한국투자저축은행 퇴직연금 정기예금 (기업형IRP 판매불가)
early_termination:
  source_terms:
  - text: '- 1개월 미만 : 0.20%; - 1년 미만 : 약정금리 × 50%; - 2년 미만 : 약정금리 × 60%; - 30개월 미만 : 약정금리 × 70%; - 30개월 이상 : 약정금리 × 80%'
    source_ref: S02:L88
  common_special_terms_ref: S02:L179-L186
  note: 원문 조건 보존. 공통식과 기관별 식을 중복 계산하지 않음. 가입 당시 약정·특별중도해지 사유별 실제 적용 확인.
pension_payment_eligible: null
investment_strategy: 기존 원리금보장 운용을 유지하려는 자금의 기관·만기 비교 후보. 금리만으로 기관 집중 또는 장기화를 결정하지 않음.
mapping_knowledge_refs:
- E05:원픽 가이드 — 고금리 추구/금리 변동성 대응
- K01:RS-15
- K02:CASE 16
```

<a id="SAV-008"></a>

### SAV-008 · 대신저축은행 퇴직연금 정기예금

```yaml
product_id: SAV-008
product_name: 대신저축은행 퇴직연금 정기예금
entity_type: individual_product
product_form: 저축은행 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 분산
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S02:L93-L97
- S02:L6-L14
- S03:L67-L70
- E05:상품별 예금자보호 여부와 특징
source_names:
- 대신저축은행 퇴직연금 정기예금
provider_name: 대신저축은행
scheme_scope:
- 개인형IRP
credit_rating: A-
risk_grade: null
irp_investment_limit_pct: null
management_style:
- 기관·만기 직접 선택
principal_protection: 자료상 원리금보장상품
deposit_protection:
  source_value: 상품제공기관별 1억원 한도
  account_aggregation: 자료상 DC/IRP 합산 관리
  source_refs:
  - S02:L10
  - S03:L69-L70
subscription_amount_policy:
  one_year_only_cap_krw: 95000000
  two_or_three_year_holdings_cap_krw: 90000000
  minimum_amount_krw: null
  source_ref: S03:L69-L70
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 월복리(교안 일반기준; 개별 약관 확인)
  purchase_rates:
  - term: 1년
    rate_pct: 3.7
    source_ref: S02:L95
  - term: 2년
    rate_pct: 2.98
    source_ref: S02:L96
  - term: 3년
    rate_pct: 2.98
    source_ref: S02:L97
  early_termination_reference_rates:
  - term: 3개월
    rate_pct: 3.7
    source_ref: S02:L93
  - term: 6개월
    rate_pct: 3.7
    source_ref: S02:L94
  reference_rate_note: 3·6개월은 특별중도해지이율 참고용이며 가입불가(S02:L14).
availability:
  source_status: IRP 금리 기재; 제공한도·신규 가능 여부 확인 필요
  candidate_state: CONDITIONAL
  runtime_verified: false
  required_checks:
  - 04-12-17A 제공기관 잔여한도·실제 가입가능 여부
  - 동일 제공기관 DC/IRP 보유 및 가입한도
  - 개인형IRP와 기업형IRP 제한 구분
  other_scheme_restrictions: []
early_termination:
  source_terms:
  - text: '- 1개월 미만 : 0.1% (신규시점 보통예금이율); - 1년 미만 : 약정이율 × 50%; - 2년 미만 : 약정이율 × 60%; - 2년 이상 : 약정이율 × 70%'
    source_ref: S02:L93
  common_special_terms_ref: S02:L179-L186
  note: 원문 조건 보존. 공통식과 기관별 식을 중복 계산하지 않음. 가입 당시 약정·특별중도해지 사유별 실제 적용 확인.
pension_payment_eligible: null
investment_strategy: 기존 원리금보장 운용을 유지하려는 자금의 기관·만기 비교 후보. 금리만으로 기관 집중 또는 장기화를 결정하지 않음.
mapping_knowledge_refs:
- E05:원픽 가이드 — 고금리 추구/금리 변동성 대응
- K01:RS-15
- K02:CASE 16
```

<a id="SAV-009"></a>

### SAV-009 · SBI저축은행 퇴직연금 정기예금

```yaml
product_id: SAV-009
product_name: SBI저축은행 퇴직연금 정기예금
entity_type: individual_product
product_form: 저축은행 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 분산
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S02:L98-L102
- S02:L6-L14
- S03:L67-L70
- E05:상품별 예금자보호 여부와 특징
source_names:
- SBI저축은행 퇴직연금 정기예금
provider_name: SBI저축은행
scheme_scope:
- 개인형IRP
credit_rating: A
risk_grade: null
irp_investment_limit_pct: null
management_style:
- 기관·만기 직접 선택
principal_protection: 자료상 원리금보장상품
deposit_protection:
  source_value: 상품제공기관별 1억원 한도
  account_aggregation: 자료상 DC/IRP 합산 관리
  source_refs:
  - S02:L10
  - S03:L69-L70
subscription_amount_policy:
  one_year_only_cap_krw: 95000000
  two_or_three_year_holdings_cap_krw: 90000000
  minimum_amount_krw: null
  source_ref: S03:L69-L70
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 월복리(교안 일반기준; 개별 약관 확인)
  purchase_rates:
  - term: 1년
    rate_pct: 3.85
    source_ref: S02:L100
  - term: 2년
    rate_pct: 3.95
    source_ref: S02:L101
  - term: 3년
    rate_pct: 3.95
    source_ref: S02:L102
  early_termination_reference_rates:
  - term: 3개월
    rate_pct: 3.85
    source_ref: S02:L98
  - term: 6개월
    rate_pct: 3.85
    source_ref: S02:L99
  reference_rate_note: 3·6개월은 특별중도해지이율 참고용이며 가입불가(S02:L14).
availability:
  source_status: IRP 금리 기재; 제공한도·신규 가능 여부 확인 필요
  candidate_state: CONDITIONAL
  runtime_verified: false
  required_checks:
  - 04-12-17A 제공기관 잔여한도·실제 가입가능 여부
  - 동일 제공기관 DC/IRP 보유 및 가입한도
  - 개인형IRP와 기업형IRP 제한 구분
  other_scheme_restrictions: []
early_termination:
  source_terms:
  - text: '- 1개월 미만 : 가입일자 시점 보통예금 금리; - 1개월 이상 ~ 36개월 이하 : 만기금리 × 100% × 경과율(경과일수/약정일수)와 가입일자 시점 보통예금 금리 중 큰 값'
    source_ref: S02:L98
  common_special_terms_ref: S02:L179-L186
  note: 원문 조건 보존. 공통식과 기관별 식을 중복 계산하지 않음. 가입 당시 약정·특별중도해지 사유별 실제 적용 확인.
pension_payment_eligible: null
investment_strategy: 기존 원리금보장 운용을 유지하려는 자금의 기관·만기 비교 후보. 금리만으로 기관 집중 또는 장기화를 결정하지 않음.
mapping_knowledge_refs:
- E05:원픽 가이드 — 고금리 추구/금리 변동성 대응
- K01:RS-15
- K02:CASE 16
```

<a id="SAV-010"></a>

### SAV-010 · 한화저축은행 퇴직연금 정기예금

```yaml
product_id: SAV-010
product_name: 한화저축은행 퇴직연금 정기예금
entity_type: individual_product
product_form: 저축은행 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 분산
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S02:L103-L105
- S02:L6-L14
- S03:L67-L70
- E05:상품별 예금자보호 여부와 특징
source_names:
- 한화저축은행 퇴직연금 정기예금
provider_name: 한화저축은행
scheme_scope:
- 개인형IRP
credit_rating: A-
risk_grade: null
irp_investment_limit_pct: null
management_style:
- 기관·만기 직접 선택
principal_protection: 자료상 원리금보장상품
deposit_protection:
  source_value: 상품제공기관별 1억원 한도
  account_aggregation: 자료상 DC/IRP 합산 관리
  source_refs:
  - S02:L10
  - S03:L69-L70
subscription_amount_policy:
  one_year_only_cap_krw: 95000000
  two_or_three_year_holdings_cap_krw: 90000000
  minimum_amount_krw: null
  source_ref: S03:L69-L70
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 월복리(교안 일반기준; 개별 약관 확인)
  purchase_rates:
  - term: 1년
    rate_pct: 3.65
    source_ref: S02:L105
  early_termination_reference_rates:
  - term: 3개월
    rate_pct: 2.65
    source_ref: S02:L103
  - term: 6개월
    rate_pct: 2.65
    source_ref: S02:L104
  reference_rate_note: 3·6개월은 특별중도해지이율 참고용이며 가입불가(S02:L14).
availability:
  source_status: IRP 금리 기재; 제공한도·신규 가능 여부 확인 필요
  candidate_state: CONDITIONAL
  runtime_verified: false
  required_checks:
  - 04-12-17A 제공기관 잔여한도·실제 가입가능 여부
  - 동일 제공기관 DC/IRP 보유 및 가입한도
  - 개인형IRP와 기업형IRP 제한 구분
  other_scheme_restrictions: []
early_termination:
  source_terms:
  - text: '- 1개월 미만 : 0.1%; - 1년 미만 : 약정이율 × 50% × 경과월수/계약월수'
    source_ref: S02:L103
  common_special_terms_ref: S02:L179-L186
  note: 원문 조건 보존. 공통식과 기관별 식을 중복 계산하지 않음. 가입 당시 약정·특별중도해지 사유별 실제 적용 확인.
pension_payment_eligible: null
investment_strategy: 기존 원리금보장 운용을 유지하려는 자금의 기관·만기 비교 후보. 금리만으로 기관 집중 또는 장기화를 결정하지 않음.
mapping_knowledge_refs:
- E05:원픽 가이드 — 고금리 추구/금리 변동성 대응
- K01:RS-15
- K02:CASE 16
```

<a id="SAV-011"></a>

### SAV-011 · 키움저축은행 퇴직연금 정기예금

```yaml
product_id: SAV-011
product_name: 키움저축은행 퇴직연금 정기예금
entity_type: individual_product
product_form: 저축은행 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 분산
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S02:L106-L109
- S02:L6-L14
- S03:L67-L70
- E05:상품별 예금자보호 여부와 특징
source_names:
- 키움저축은행 퇴직연금 정기예금
provider_name: 키움저축은행
scheme_scope:
- 개인형IRP
credit_rating: A-
risk_grade: null
irp_investment_limit_pct: null
management_style:
- 기관·만기 직접 선택
principal_protection: 자료상 원리금보장상품
deposit_protection:
  source_value: 상품제공기관별 1억원 한도
  account_aggregation: 자료상 DC/IRP 합산 관리
  source_refs:
  - S02:L10
  - S03:L69-L70
subscription_amount_policy:
  one_year_only_cap_krw: 95000000
  two_or_three_year_holdings_cap_krw: 90000000
  minimum_amount_krw: null
  source_ref: S03:L69-L70
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 월복리(교안 일반기준; 개별 약관 확인)
  purchase_rates:
  - term: 1년
    rate_pct: 3.8
    source_ref: S02:L108
  - term: 2년
    rate_pct: 3.8
    source_ref: S02:L109
  early_termination_reference_rates:
  - term: 3개월
    rate_pct: 1.5
    source_ref: S02:L106
  - term: 6개월
    rate_pct: 3.9
    source_ref: S02:L107
  reference_rate_note: 3·6개월은 특별중도해지이율 참고용이며 가입불가(S02:L14).
availability:
  source_status: IRP 금리 기재; 제공한도·신규 가능 여부 확인 필요
  candidate_state: CONDITIONAL
  runtime_verified: false
  required_checks:
  - 04-12-17A 제공기관 잔여한도·실제 가입가능 여부
  - 동일 제공기관 DC/IRP 보유 및 가입한도
  - 개인형IRP와 기업형IRP 제한 구분
  other_scheme_restrictions: []
early_termination:
  source_terms:
  - text: '- 1개월 미만 : 보통예금 금리(0.20%); - 1년 미만 : 약정금리 × 50%; - 2년 미만 : 약정금리 × 55%'
    source_ref: S02:L106
  common_special_terms_ref: S02:L179-L186
  note: 원문 조건 보존. 공통식과 기관별 식을 중복 계산하지 않음. 가입 당시 약정·특별중도해지 사유별 실제 적용 확인.
pension_payment_eligible: null
investment_strategy: 기존 원리금보장 운용을 유지하려는 자금의 기관·만기 비교 후보. 금리만으로 기관 집중 또는 장기화를 결정하지 않음.
mapping_knowledge_refs:
- E05:원픽 가이드 — 고금리 추구/금리 변동성 대응
- K01:RS-15
- K02:CASE 16
```

<a id="SAV-012"></a>

### SAV-012 · 고려저축은행 퇴직연금 정기예금

```yaml
product_id: SAV-012
product_name: 고려저축은행 퇴직연금 정기예금
entity_type: individual_product
product_form: 저축은행 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 분산
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S02:L110-L114
- S02:L6-L14
- S03:L67-L70
- E05:상품별 예금자보호 여부와 특징
source_names:
- 고려저축은행 퇴직연금 정기예금 (DB 신규 불가)
provider_name: 고려저축은행
scheme_scope:
- 개인형IRP
credit_rating: BBB+
risk_grade: null
irp_investment_limit_pct: null
management_style:
- 기관·만기 직접 선택
principal_protection: 자료상 원리금보장상품
deposit_protection:
  source_value: 상품제공기관별 1억원 한도
  account_aggregation: 자료상 DC/IRP 합산 관리
  source_refs:
  - S02:L10
  - S03:L69-L70
subscription_amount_policy:
  one_year_only_cap_krw: 95000000
  two_or_three_year_holdings_cap_krw: 90000000
  minimum_amount_krw: null
  source_ref: S03:L69-L70
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 월복리(교안 일반기준; 개별 약관 확인)
  purchase_rates:
  - term: 1년
    rate_pct: 3.7
    source_ref: S02:L112
  - term: 2년
    rate_pct: 3.0
    source_ref: S02:L113
  - term: 3년
    rate_pct: 3.0
    source_ref: S02:L114
  early_termination_reference_rates:
  - term: 3개월
    rate_pct: 1.9
    source_ref: S02:L110
  - term: 6개월
    rate_pct: 2.1
    source_ref: S02:L111
  reference_rate_note: 3·6개월은 특별중도해지이율 참고용이며 가입불가(S02:L14).
availability:
  source_status: IRP 금리 기재; 제공한도·신규 가능 여부 확인 필요
  candidate_state: CONDITIONAL
  runtime_verified: false
  required_checks:
  - 04-12-17A 제공기관 잔여한도·실제 가입가능 여부
  - 동일 제공기관 DC/IRP 보유 및 가입한도
  - 개인형IRP와 기업형IRP 제한 구분
  other_scheme_restrictions:
  - 고려저축은행 퇴직연금 정기예금 (DB 신규 불가)
early_termination:
  source_terms:
  - text: '- 1개월 미만 : 0.10% (보통예금이율); - 6개월 미만 : 약정금리 × 50%; - 12개월 미만 : 약정금리 × 55%; - 12개월 이상 : 약정금리 × 70%'
    source_ref: S02:L110
  common_special_terms_ref: S02:L179-L186
  note: 원문 조건 보존. 공통식과 기관별 식을 중복 계산하지 않음. 가입 당시 약정·특별중도해지 사유별 실제 적용 확인.
pension_payment_eligible: null
investment_strategy: 기존 원리금보장 운용을 유지하려는 자금의 기관·만기 비교 후보. 금리만으로 기관 집중 또는 장기화를 결정하지 않음.
mapping_knowledge_refs:
- E05:원픽 가이드 — 고금리 추구/금리 변동성 대응
- K01:RS-15
- K02:CASE 16
```

<a id="SAV-013"></a>

### SAV-013 · DB저축은행 퇴직연금 정기예금

```yaml
product_id: SAV-013
product_name: DB저축은행 퇴직연금 정기예금
entity_type: individual_product
product_form: 저축은행 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 분산
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S02:L115-L119
- S02:L6-L14
- S03:L67-L70
- E05:상품별 예금자보호 여부와 특징
source_names:
- DB저축은행 퇴직연금 정기예금
provider_name: DB저축은행
scheme_scope:
- 개인형IRP
credit_rating: A-
risk_grade: null
irp_investment_limit_pct: null
management_style:
- 기관·만기 직접 선택
principal_protection: 자료상 원리금보장상품
deposit_protection:
  source_value: 상품제공기관별 1억원 한도
  account_aggregation: 자료상 DC/IRP 합산 관리
  source_refs:
  - S02:L10
  - S03:L69-L70
subscription_amount_policy:
  one_year_only_cap_krw: 95000000
  two_or_three_year_holdings_cap_krw: 90000000
  minimum_amount_krw: null
  source_ref: S03:L69-L70
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 월복리(교안 일반기준; 개별 약관 확인)
  purchase_rates:
  - term: 1년
    rate_pct: 3.75
    source_ref: S02:L117
  - term: 2년
    rate_pct: 3.75
    source_ref: S02:L118
  - term: 3년
    rate_pct: 3.65
    source_ref: S02:L119
  early_termination_reference_rates:
  - term: 3개월
    rate_pct: 2.4
    source_ref: S02:L115
  - term: 6개월
    rate_pct: 2.7
    source_ref: S02:L116
  reference_rate_note: 3·6개월은 특별중도해지이율 참고용이며 가입불가(S02:L14).
availability:
  source_status: IRP 금리 기재; 제공한도·신규 가능 여부 확인 필요
  candidate_state: CONDITIONAL
  runtime_verified: false
  required_checks:
  - 04-12-17A 제공기관 잔여한도·실제 가입가능 여부
  - 동일 제공기관 DC/IRP 보유 및 가입한도
  - 개인형IRP와 기업형IRP 제한 구분
  other_scheme_restrictions: []
early_termination:
  source_terms:
  - text: '- 1개월 미만 : 0.1%; - 6개월 미만 : 약정이율 × 50%; - 9개월 미만 : 약정이율 × 55%; - 12개월 미만 : 약정이율 × 60%; - 24개월 미만 : 약정이율 × 70%;
      - 24개월 이상 : 약정이율 × 80%'
    source_ref: S02:L115
  common_special_terms_ref: S02:L179-L186
  note: 원문 조건 보존. 공통식과 기관별 식을 중복 계산하지 않음. 가입 당시 약정·특별중도해지 사유별 실제 적용 확인.
pension_payment_eligible: null
investment_strategy: 기존 원리금보장 운용을 유지하려는 자금의 기관·만기 비교 후보. 금리만으로 기관 집중 또는 장기화를 결정하지 않음.
mapping_knowledge_refs:
- E05:원픽 가이드 — 고금리 추구/금리 변동성 대응
- K01:RS-15
- K02:CASE 16
```

<a id="SAV-014"></a>

### SAV-014 · 우리금융저축은행 퇴직연금 정기예금

```yaml
product_id: SAV-014
product_name: 우리금융저축은행 퇴직연금 정기예금
entity_type: individual_product
product_form: 저축은행 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 분산
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S02:L120-L124
- S02:L6-L14
- S03:L67-L70
- E05:상품별 예금자보호 여부와 특징
source_names:
- 우리금융저축은행 퇴직연금 정기예금
provider_name: 우리금융저축은행
scheme_scope:
- 개인형IRP
credit_rating: A
risk_grade: null
irp_investment_limit_pct: null
management_style:
- 기관·만기 직접 선택
principal_protection: 자료상 원리금보장상품
deposit_protection:
  source_value: 상품제공기관별 1억원 한도
  account_aggregation: 자료상 DC/IRP 합산 관리
  source_refs:
  - S02:L10
  - S03:L69-L70
subscription_amount_policy:
  one_year_only_cap_krw: 95000000
  two_or_three_year_holdings_cap_krw: 90000000
  minimum_amount_krw: null
  source_ref: S03:L69-L70
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 월복리(교안 일반기준; 개별 약관 확인)
  purchase_rates:
  - term: 1년
    rate_pct: 3.6
    source_ref: S02:L122
  - term: 2년
    rate_pct: 3.6
    source_ref: S02:L123
  - term: 3년
    rate_pct: 3.0
    source_ref: S02:L124
  early_termination_reference_rates:
  - term: 3개월
    rate_pct: 2.3
    source_ref: S02:L120
  - term: 6개월
    rate_pct: 2.6
    source_ref: S02:L121
  reference_rate_note: 3·6개월은 특별중도해지이율 참고용이며 가입불가(S02:L14).
availability:
  source_status: IRP 금리 기재; 제공한도·신규 가능 여부 확인 필요
  candidate_state: CONDITIONAL
  runtime_verified: false
  required_checks:
  - 04-12-17A 제공기관 잔여한도·실제 가입가능 여부
  - 동일 제공기관 DC/IRP 보유 및 가입한도
  - 개인형IRP와 기업형IRP 제한 구분
  other_scheme_restrictions: []
early_termination:
  source_terms:
  - text: '- 1개월 미만 : 0.3% (신규시점 보통예금 이율); - 3개월 미만 : 약정금리 × 50%; - 6개월 미만 : 약정금리 × 55%; - 12개월 미만 : 약정금리 × 60%; - 12개월 이상
      : 약정금리 × 70%'
    source_ref: S02:L120
  common_special_terms_ref: S02:L179-L186
  note: 원문 조건 보존. 공통식과 기관별 식을 중복 계산하지 않음. 가입 당시 약정·특별중도해지 사유별 실제 적용 확인.
pension_payment_eligible: null
investment_strategy: 기존 원리금보장 운용을 유지하려는 자금의 기관·만기 비교 후보. 금리만으로 기관 집중 또는 장기화를 결정하지 않음.
mapping_knowledge_refs:
- E05:원픽 가이드 — 고금리 추구/금리 변동성 대응
- K01:RS-15
- K02:CASE 16
```

<a id="SAV-015"></a>

### SAV-015 · 푸른저축은행 퇴직연금 정기예금

```yaml
product_id: SAV-015
product_name: 푸른저축은행 퇴직연금 정기예금
entity_type: individual_product
product_form: 저축은행 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 분산
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S02:L125-L128
- S02:L6-L14
- S03:L67-L70
- E05:상품별 예금자보호 여부와 특징
source_names:
- 푸른저축은행 퇴직연금 정기예금 (DB 신규 불가)
provider_name: 푸른저축은행
scheme_scope:
- 개인형IRP
credit_rating: BBB+
risk_grade: null
irp_investment_limit_pct: null
management_style:
- 기관·만기 직접 선택
principal_protection: 자료상 원리금보장상품
deposit_protection:
  source_value: 상품제공기관별 1억원 한도
  account_aggregation: 자료상 DC/IRP 합산 관리
  source_refs:
  - S02:L10
  - S03:L69-L70
subscription_amount_policy:
  one_year_only_cap_krw: 95000000
  two_or_three_year_holdings_cap_krw: 90000000
  minimum_amount_krw: null
  source_ref: S03:L69-L70
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 월복리(교안 일반기준; 개별 약관 확인)
  purchase_rates:
  - term: 1년
    rate_pct: 4.0
    source_ref: S02:L127
  - term: 2년
    rate_pct: 4.0
    source_ref: S02:L128
  early_termination_reference_rates:
  - term: 3개월
    rate_pct: 3.6
    source_ref: S02:L125
  - term: 6개월
    rate_pct: 3.8
    source_ref: S02:L126
  reference_rate_note: 3·6개월은 특별중도해지이율 참고용이며 가입불가(S02:L14).
availability:
  source_status: IRP 금리 기재; 제공한도·신규 가능 여부 확인 필요
  candidate_state: CONDITIONAL
  runtime_verified: false
  required_checks:
  - 04-12-17A 제공기관 잔여한도·실제 가입가능 여부
  - 동일 제공기관 DC/IRP 보유 및 가입한도
  - 개인형IRP와 기업형IRP 제한 구분
  other_scheme_restrictions:
  - 푸른저축은행 퇴직연금 정기예금 (DB 신규 불가)
early_termination:
  source_terms:
  - text: '- DC/IRP : 신규일 당시 고시된 상품설명서상 중도해지이율; 1개월 미만 : 0.20% / 3개월 미만 : 1.80% / 6개월 미만 : 1.97% / 12개월 미만 : 2.09% / 12개월
      이상 : 2.10%; - DB : 신규일 당시 고시된 상품설명서상 중도해지이율; ※ 푸른저축은행은 매월 중도해지이율 변경됨 유의'
    source_ref: S02:L125
  common_special_terms_ref: S02:L179-L186
  note: 원문 조건 보존. 공통식과 기관별 식을 중복 계산하지 않음. 가입 당시 약정·특별중도해지 사유별 실제 적용 확인.
pension_payment_eligible: null
investment_strategy: 기존 원리금보장 운용을 유지하려는 자금의 기관·만기 비교 후보. 금리만으로 기관 집중 또는 장기화를 결정하지 않음.
mapping_knowledge_refs:
- E05:원픽 가이드 — 고금리 추구/금리 변동성 대응
- K01:RS-15
- K02:CASE 16
```

<a id="SAV-016"></a>

### SAV-016 · 다올저축은행 퇴직연금 정기예금

```yaml
product_id: SAV-016
product_name: 다올저축은행 퇴직연금 정기예금
entity_type: individual_product
product_form: 저축은행 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 분산
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S02:L129-L133
- S02:L6-L14
- S03:L67-L70
- E05:상품별 예금자보호 여부와 특징
source_names:
- 다올저축은행 퇴직연금 정기예금 (舊유진저축은행 퇴직연금 정기예금) (DB 신규 불가)
- 다올저축은행 퇴직연금 정기예금
provider_name: 다올저축은행
scheme_scope:
- 개인형IRP
credit_rating: BBB
risk_grade: null
irp_investment_limit_pct: null
management_style:
- 기관·만기 직접 선택
principal_protection: 자료상 원리금보장상품
deposit_protection:
  source_value: 상품제공기관별 1억원 한도
  account_aggregation: 자료상 DC/IRP 합산 관리
  source_refs:
  - S02:L10
  - S03:L69-L70
subscription_amount_policy:
  one_year_only_cap_krw: 95000000
  two_or_three_year_holdings_cap_krw: 90000000
  minimum_amount_krw: null
  source_ref: S03:L69-L70
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 월복리(교안 일반기준; 개별 약관 확인)
  purchase_rates:
  - term: 1년
    rate_pct: 3.93
    source_ref: S02:L131
  - term: 2년
    rate_pct: 3.4
    source_ref: S02:L132
  - term: 3년
    rate_pct: 2.4
    source_ref: S02:L133
  early_termination_reference_rates:
  - term: 3개월
    rate_pct: 3.93
    source_ref: S02:L129
  - term: 6개월
    rate_pct: 3.93
    source_ref: S02:L130
  reference_rate_note: 3·6개월은 특별중도해지이율 참고용이며 가입불가(S02:L14).
availability:
  source_status: IRP 금리 기재; 제공한도·신규 가능 여부 확인 필요
  candidate_state: CONDITIONAL
  runtime_verified: false
  required_checks:
  - 04-12-17A 제공기관 잔여한도·실제 가입가능 여부
  - 동일 제공기관 DC/IRP 보유 및 가입한도
  - 개인형IRP와 기업형IRP 제한 구분
  other_scheme_restrictions:
  - 다올저축은행 퇴직연금 정기예금 (舊유진저축은행 퇴직연금 정기예금) (DB 신규 불가)
early_termination:
  source_terms:
  - text: '- DC/IRP; 1개월 미만 : 0.1% (신규시점 보통예금 이율); 6개월 미만 : 약정금리 × 50%; 9개월 미만 : 약정금리 × 55%; 12개월 미만 : 약정금리 × 60%; 12개월 이상
      : 약정금리 × 70%; - DB : 가입당시 약정이율(''26.04.01 시행*); *시행일 이전 신규계좌는 DC/IRP와 동일'
    source_ref: S02:L129
  common_special_terms_ref: S02:L179-L186
  note: 원문 조건 보존. 공통식과 기관별 식을 중복 계산하지 않음. 가입 당시 약정·특별중도해지 사유별 실제 적용 확인.
pension_payment_eligible: null
investment_strategy: 기존 원리금보장 운용을 유지하려는 자금의 기관·만기 비교 후보. 금리만으로 기관 집중 또는 장기화를 결정하지 않음.
mapping_knowledge_refs:
- E05:원픽 가이드 — 고금리 추구/금리 변동성 대응
- K01:RS-15
- K02:CASE 16
```

<a id="SAV-017"></a>

### SAV-017 · 모아저축은행 퇴직연금 정기예금

```yaml
product_id: SAV-017
product_name: 모아저축은행 퇴직연금 정기예금
entity_type: individual_product
product_form: 저축은행 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 분산
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S02:L134-L138
- S02:L6-L14
- S03:L67-L70
- E05:상품별 예금자보호 여부와 특징
source_names:
- 모아저축은행 퇴직연금 정기예금 (DB 신규 불가)
- 모아저축은행 퇴직연금 정기예금
provider_name: 모아저축은행
scheme_scope:
- 개인형IRP
credit_rating: BBB
risk_grade: null
irp_investment_limit_pct: null
management_style:
- 기관·만기 직접 선택
principal_protection: 자료상 원리금보장상품
deposit_protection:
  source_value: 상품제공기관별 1억원 한도
  account_aggregation: 자료상 DC/IRP 합산 관리
  source_refs:
  - S02:L10
  - S03:L69-L70
subscription_amount_policy:
  one_year_only_cap_krw: 95000000
  two_or_three_year_holdings_cap_krw: 90000000
  minimum_amount_krw: null
  source_ref: S03:L69-L70
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 월복리(교안 일반기준; 개별 약관 확인)
  purchase_rates:
  - term: 1년
    rate_pct: 4.0
    source_ref: S02:L136
  - term: 2년
    rate_pct: 3.4
    source_ref: S02:L137
  - term: 3년
    rate_pct: 3.3
    source_ref: S02:L138
  early_termination_reference_rates:
  - term: 3개월
    rate_pct: 1.2
    source_ref: S02:L134
  - term: 6개월
    rate_pct: 3.2
    source_ref: S02:L135
  reference_rate_note: 3·6개월은 특별중도해지이율 참고용이며 가입불가(S02:L14).
availability:
  source_status: IRP 금리 기재; 제공한도·신규 가능 여부 확인 필요
  candidate_state: CONDITIONAL
  runtime_verified: false
  required_checks:
  - 04-12-17A 제공기관 잔여한도·실제 가입가능 여부
  - 동일 제공기관 DC/IRP 보유 및 가입한도
  - 개인형IRP와 기업형IRP 제한 구분
  other_scheme_restrictions:
  - 모아저축은행 퇴직연금 정기예금 (DB 신규 불가)
early_termination:
  source_terms:
  - text: '- 1개월 미만 : 0.1% (신규시점 보통예금 이율); - 3개월 미만 : 약정금리 × 20%; - 6개월 미만 : 약정금리 × 30%; - 9개월 미만 : 약정금리 × 60%; - 2년 미만 :
      약정금리 × 80%'
    source_ref: S02:L134
  common_special_terms_ref: S02:L179-L186
  note: 원문 조건 보존. 공통식과 기관별 식을 중복 계산하지 않음. 가입 당시 약정·특별중도해지 사유별 실제 적용 확인.
pension_payment_eligible: null
investment_strategy: 기존 원리금보장 운용을 유지하려는 자금의 기관·만기 비교 후보. 금리만으로 기관 집중 또는 장기화를 결정하지 않음.
mapping_knowledge_refs:
- E05:원픽 가이드 — 고금리 추구/금리 변동성 대응
- K01:RS-15
- K02:CASE 16
```

<a id="SAV-018"></a>

### SAV-018 · 키움Yes저축은행 퇴직연금 정기예금

```yaml
product_id: SAV-018
product_name: 키움Yes저축은행 퇴직연금 정기예금
entity_type: individual_product
product_form: 저축은행 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 분산
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S02:L139-L143
- S02:L6-L14
- S03:L67-L70
- E05:상품별 예금자보호 여부와 특징
source_names:
- 키움Yes저축은행 퇴직연금 정기예금 (DB 신규 불가)
- 키움Yes저축은행 퇴직연금 정기예금
provider_name: 키움Yes저축은행
scheme_scope:
- 개인형IRP
credit_rating: BBB
risk_grade: null
irp_investment_limit_pct: null
management_style:
- 기관·만기 직접 선택
principal_protection: 자료상 원리금보장상품
deposit_protection:
  source_value: 상품제공기관별 1억원 한도
  account_aggregation: 자료상 DC/IRP 합산 관리
  source_refs:
  - S02:L10
  - S03:L69-L70
subscription_amount_policy:
  one_year_only_cap_krw: 95000000
  two_or_three_year_holdings_cap_krw: 90000000
  minimum_amount_krw: null
  source_ref: S03:L69-L70
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 월복리(교안 일반기준; 개별 약관 확인)
  purchase_rates:
  - term: 1년
    rate_pct: 4.0
    source_ref: S02:L141
  - term: 2년
    rate_pct: 2.9
    source_ref: S02:L142
  - term: 3년
    rate_pct: 2.4
    source_ref: S02:L143
  early_termination_reference_rates:
  - term: 3개월
    rate_pct: 2.1
    source_ref: S02:L139
  - term: 6개월
    rate_pct: 2.1
    source_ref: S02:L140
  reference_rate_note: 3·6개월은 특별중도해지이율 참고용이며 가입불가(S02:L14).
availability:
  source_status: IRP 금리 기재; 제공한도·신규 가능 여부 확인 필요
  candidate_state: CONDITIONAL
  runtime_verified: false
  required_checks:
  - 04-12-17A 제공기관 잔여한도·실제 가입가능 여부
  - 동일 제공기관 DC/IRP 보유 및 가입한도
  - 개인형IRP와 기업형IRP 제한 구분
  other_scheme_restrictions:
  - 키움Yes저축은행 퇴직연금 정기예금 (DB 신규 불가)
early_termination:
  source_terms:
  - text: '- 1개월 미만 : 0.3% (보통예금 이율); - 1년 미만 : 약정금리 × 50%; - 2년 미만 : 약정금리 × 60%; - 3년 미만 : 약정금리 × 70%; - 5년 미만 : 약정금리 × 80%'
    source_ref: S02:L139
  common_special_terms_ref: S02:L179-L186
  note: 원문 조건 보존. 공통식과 기관별 식을 중복 계산하지 않음. 가입 당시 약정·특별중도해지 사유별 실제 적용 확인.
pension_payment_eligible: null
investment_strategy: 기존 원리금보장 운용을 유지하려는 자금의 기관·만기 비교 후보. 금리만으로 기관 집중 또는 장기화를 결정하지 않음.
mapping_knowledge_refs:
- E05:원픽 가이드 — 고금리 추구/금리 변동성 대응
- K01:RS-15
- K02:CASE 16
```

<a id="SAV-019"></a>

### SAV-019 · 예가람저축은행 퇴직연금 정기예금

```yaml
product_id: SAV-019
product_name: 예가람저축은행 퇴직연금 정기예금
entity_type: individual_product
product_form: 저축은행 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 분산
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S02:L144-L148
- S02:L6-L14
- S03:L67-L70
- E05:상품별 예금자보호 여부와 특징
source_names:
- 예가람저축은행 퇴직연금 정기예금 (DB 신규 불가)
- 예가람저축은행 퇴직연금 정기예금
provider_name: 예가람저축은행
scheme_scope:
- 개인형IRP
credit_rating: BBB
risk_grade: null
irp_investment_limit_pct: null
management_style:
- 기관·만기 직접 선택
principal_protection: 자료상 원리금보장상품
deposit_protection:
  source_value: 상품제공기관별 1억원 한도
  account_aggregation: 자료상 DC/IRP 합산 관리
  source_refs:
  - S02:L10
  - S03:L69-L70
subscription_amount_policy:
  one_year_only_cap_krw: 95000000
  two_or_three_year_holdings_cap_krw: 90000000
  minimum_amount_krw: null
  source_ref: S03:L69-L70
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 월복리(교안 일반기준; 개별 약관 확인)
  purchase_rates:
  - term: 1년
    rate_pct: 3.8
    source_ref: S02:L146
  - term: 2년
    rate_pct: 3.5
    source_ref: S02:L147
  - term: 3년
    rate_pct: 3.7
    source_ref: S02:L148
  early_termination_reference_rates:
  - term: 3개월
    rate_pct: 1.95
    source_ref: S02:L144
  - term: 6개월
    rate_pct: 2.1
    source_ref: S02:L145
  reference_rate_note: 3·6개월은 특별중도해지이율 참고용이며 가입불가(S02:L14).
availability:
  source_status: IRP 금리 기재; 제공한도·신규 가능 여부 확인 필요
  candidate_state: CONDITIONAL
  runtime_verified: false
  required_checks:
  - 04-12-17A 제공기관 잔여한도·실제 가입가능 여부
  - 동일 제공기관 DC/IRP 보유 및 가입한도
  - 개인형IRP와 기업형IRP 제한 구분
  other_scheme_restrictions:
  - 예가람저축은행 퇴직연금 정기예금 (DB 신규 불가)
early_termination:
  source_terms:
  - text: '- 1개월 미만 : 0.2% (보통예금이율); - 6개월 미만 : 약정금리 × 50%; - 12개월 미만 : 약정금리 × 55%; - 12개월 이상 : 약정금리 × 70%'
    source_ref: S02:L144
  common_special_terms_ref: S02:L179-L186
  note: 원문 조건 보존. 공통식과 기관별 식을 중복 계산하지 않음. 가입 당시 약정·특별중도해지 사유별 실제 적용 확인.
pension_payment_eligible: null
investment_strategy: 기존 원리금보장 운용을 유지하려는 자금의 기관·만기 비교 후보. 금리만으로 기관 집중 또는 장기화를 결정하지 않음.
mapping_knowledge_refs:
- E05:원픽 가이드 — 고금리 추구/금리 변동성 대응
- K01:RS-15
- K02:CASE 16
```

<a id="SAV-020"></a>

### SAV-020 · OK저축은행 퇴직연금 정기예금

```yaml
product_id: SAV-020
product_name: OK저축은행 퇴직연금 정기예금
entity_type: individual_product
product_form: 저축은행 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 분산
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S02:L149-L152
- S02:L6-L14
- S03:L67-L70
- E05:상품별 예금자보호 여부와 특징
source_names:
- OK저축은행 퇴직연금 정기예금 (DB 신규 불가)
- OK저축은행 퇴직연금 정기예금
provider_name: OK저축은행
scheme_scope:
- 개인형IRP
credit_rating: BBB
risk_grade: null
irp_investment_limit_pct: null
management_style:
- 기관·만기 직접 선택
principal_protection: 자료상 원리금보장상품
deposit_protection:
  source_value: 상품제공기관별 1억원 한도
  account_aggregation: 자료상 DC/IRP 합산 관리
  source_refs:
  - S02:L10
  - S03:L69-L70
subscription_amount_policy:
  one_year_only_cap_krw: 95000000
  two_or_three_year_holdings_cap_krw: 90000000
  minimum_amount_krw: null
  source_ref: S03:L69-L70
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 월복리(교안 일반기준; 개별 약관 확인)
  purchase_rates:
  - term: 1년
    rate_pct: 3.9
    source_ref: S02:L151
  - term: 2년
    rate_pct: 3.4
    source_ref: S02:L152
  early_termination_reference_rates:
  - term: 3개월
    rate_pct: 3.9
    source_ref: S02:L149
  - term: 6개월
    rate_pct: 3.9
    source_ref: S02:L150
  reference_rate_note: 3·6개월은 특별중도해지이율 참고용이며 가입불가(S02:L14).
availability:
  source_status: IRP 금리 기재; 제공한도·신규 가능 여부 확인 필요
  candidate_state: CONDITIONAL
  runtime_verified: false
  required_checks:
  - 04-12-17A 제공기관 잔여한도·실제 가입가능 여부
  - 동일 제공기관 DC/IRP 보유 및 가입한도
  - 개인형IRP와 기업형IRP 제한 구분
  other_scheme_restrictions:
  - OK저축은행 퇴직연금 정기예금 (DB 신규 불가)
early_termination:
  source_terms:
  - text: '- DC/IRP; 1개월 미만 : 0.1%; 3개월 미만 : 약정금리 × 20%; 6개월 미만 : 약정금리 × 40%; 9개월 미만 : 약정금리 × 60%; 1년 미만 : 약정금리 × 70%; 1년
      이상 : 약정금리 × 80%; - DB : 가입당시 1년제 약정이율'
    source_ref: S02:L149
  common_special_terms_ref: S02:L179-L186
  note: 원문 조건 보존. 공통식과 기관별 식을 중복 계산하지 않음. 가입 당시 약정·특별중도해지 사유별 실제 적용 확인.
pension_payment_eligible: null
investment_strategy: 기존 원리금보장 운용을 유지하려는 자금의 기관·만기 비교 후보. 금리만으로 기관 집중 또는 장기화를 결정하지 않음.
mapping_knowledge_refs:
- E05:원픽 가이드 — 고금리 추구/금리 변동성 대응
- K01:RS-15
- K02:CASE 16
```

<a id="SAV-021"></a>

### SAV-021 · 웰컴저축은행 퇴직연금 정기예금

```yaml
product_id: SAV-021
product_name: 웰컴저축은행 퇴직연금 정기예금
entity_type: individual_product
product_form: 저축은행 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 분산
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S02:L153-L155
- S02:L6-L14
- S03:L67-L70
- E05:상품별 예금자보호 여부와 특징
source_names:
- 웰컴저축은행 퇴직연금 정기예금 (DB 신규 불가)
- 웰컴저축은행 퇴직연금 정기예금
provider_name: 웰컴저축은행
scheme_scope:
- 개인형IRP
credit_rating: BBB
risk_grade: null
irp_investment_limit_pct: null
management_style:
- 기관·만기 직접 선택
principal_protection: 자료상 원리금보장상품
deposit_protection:
  source_value: 상품제공기관별 1억원 한도
  account_aggregation: 자료상 DC/IRP 합산 관리
  source_refs:
  - S02:L10
  - S03:L69-L70
subscription_amount_policy:
  one_year_only_cap_krw: 95000000
  two_or_three_year_holdings_cap_krw: 90000000
  minimum_amount_krw: null
  source_ref: S03:L69-L70
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 월복리(교안 일반기준; 개별 약관 확인)
  purchase_rates:
  - term: 1년
    rate_pct: 3.8
    source_ref: S02:L155
  early_termination_reference_rates:
  - term: 3개월
    rate_pct: 3.8
    source_ref: S02:L153
  - term: 6개월
    rate_pct: 3.8
    source_ref: S02:L154
  reference_rate_note: 3·6개월은 특별중도해지이율 참고용이며 가입불가(S02:L14).
availability:
  source_status: IRP 금리 기재; 제공한도·신규 가능 여부 확인 필요
  candidate_state: CONDITIONAL
  runtime_verified: false
  required_checks:
  - 04-12-17A 제공기관 잔여한도·실제 가입가능 여부
  - 동일 제공기관 DC/IRP 보유 및 가입한도
  - 개인형IRP와 기업형IRP 제한 구분
  other_scheme_restrictions:
  - 웰컴저축은행 퇴직연금 정기예금 (DB 신규 불가)
early_termination:
  source_terms:
  - text: '- 1개월 미만 : 0.1%; - 약정기간의 20% 미만 : 약정금리 × 10%; - 약정기간의 20% 이상 : 약정금리 × 30%; - 약정기간의 40% 이상 : 약정금리 × 50%; - 약정기간의
      60% 이상 : 약정금리 × 70%; - 약정기간의 80% 이상 : 약정금리 × 90%'
    source_ref: S02:L153
  common_special_terms_ref: S02:L179-L186
  note: 원문 조건 보존. 공통식과 기관별 식을 중복 계산하지 않음. 가입 당시 약정·특별중도해지 사유별 실제 적용 확인.
pension_payment_eligible: null
investment_strategy: 기존 원리금보장 운용을 유지하려는 자금의 기관·만기 비교 후보. 금리만으로 기관 집중 또는 장기화를 결정하지 않음.
mapping_knowledge_refs:
- E05:원픽 가이드 — 고금리 추구/금리 변동성 대응
- K01:RS-15
- K02:CASE 16
```

<a id="SAV-022"></a>

### SAV-022 · 바로저축은행 퇴직연금 정기예금

```yaml
product_id: SAV-022
product_name: 바로저축은행 퇴직연금 정기예금
entity_type: individual_product
product_form: 저축은행 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 분산
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S02:L156-L160
- S02:L6-L14
- S03:L67-L70
- E05:상품별 예금자보호 여부와 특징
source_names:
- 바로저축은행 퇴직연금 정기예금 (신규 불가)
- 바로저축은행 퇴직연금 정기예금
provider_name: 바로저축은행
scheme_scope:
- 개인형IRP
credit_rating: BBB-
risk_grade: null
irp_investment_limit_pct: null
management_style:
- 기관·만기 직접 선택
principal_protection: 자료상 원리금보장상품
deposit_protection:
  source_value: 상품제공기관별 1억원 한도
  account_aggregation: 자료상 DC/IRP 합산 관리
  source_refs:
  - S02:L10
  - S03:L69-L70
subscription_amount_policy:
  one_year_only_cap_krw: 95000000
  two_or_three_year_holdings_cap_krw: 90000000
  minimum_amount_krw: null
  source_ref: S03:L69-L70
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 월복리(교안 일반기준; 개별 약관 확인)
  purchase_rates:
  - term: 1년
    rate_pct: 3.85
    source_ref: S02:L158
  - term: 2년
    rate_pct: 2.8
    source_ref: S02:L159
  - term: 3년
    rate_pct: 2.8
    source_ref: S02:L160
  early_termination_reference_rates:
  - term: 3개월
    rate_pct: 3.08
    source_ref: S02:L156
  - term: 6개월
    rate_pct: 3.47
    source_ref: S02:L157
  reference_rate_note: 3·6개월은 특별중도해지이율 참고용이며 가입불가(S02:L14).
availability:
  source_status: 신규 불가
  candidate_state: EXCLUDED
  runtime_verified: false
  required_checks:
  - 04-12-17A 제공기관 잔여한도·실제 가입가능 여부
  - 동일 제공기관 DC/IRP 보유 및 가입한도
  - 개인형IRP와 기업형IRP 제한 구분
  other_scheme_restrictions: []
early_termination:
  source_terms:
  - text: '- 1개월 미만 : 0.10%; - 12개월 미만 : 약정금리 × 50%; - 12개월 이상 : 약정금리 × 60%'
    source_ref: S02:L156
  common_special_terms_ref: S02:L179-L186
  note: 원문 조건 보존. 공통식과 기관별 식을 중복 계산하지 않음. 가입 당시 약정·특별중도해지 사유별 실제 적용 확인.
pension_payment_eligible: null
investment_strategy: 기존 원리금보장 운용을 유지하려는 자금의 기관·만기 비교 후보. 금리만으로 기관 집중 또는 장기화를 결정하지 않음.
mapping_knowledge_refs:
- E05:원픽 가이드 — 고금리 추구/금리 변동성 대응
- K01:RS-15
- K02:CASE 16
```

<a id="SAV-023"></a>

### SAV-023 · 유안타저축은행 퇴직연금 정기예금

```yaml
product_id: SAV-023
product_name: 유안타저축은행 퇴직연금 정기예금
entity_type: individual_product
product_form: 저축은행 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 분산
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S02:L161-L165
- S02:L6-L14
- S03:L67-L70
- E05:상품별 예금자보호 여부와 특징
source_names:
- 유안타저축은행 퇴직연금 정기예금 (DB 신규 불가)
- 유안타저축은행 퇴직연금 정기예금
provider_name: 유안타저축은행
scheme_scope:
- 개인형IRP
credit_rating: BBB
risk_grade: null
irp_investment_limit_pct: null
management_style:
- 기관·만기 직접 선택
principal_protection: 자료상 원리금보장상품
deposit_protection:
  source_value: 상품제공기관별 1억원 한도
  account_aggregation: 자료상 DC/IRP 합산 관리
  source_refs:
  - S02:L10
  - S03:L69-L70
subscription_amount_policy:
  one_year_only_cap_krw: 95000000
  two_or_three_year_holdings_cap_krw: 90000000
  minimum_amount_krw: null
  source_ref: S03:L69-L70
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 월복리(교안 일반기준; 개별 약관 확인)
  purchase_rates:
  - term: 1년
    rate_pct: 3.96
    source_ref: S02:L163
  - term: 2년
    rate_pct: 3.96
    source_ref: S02:L164
  - term: 3년
    rate_pct: 3.76
    source_ref: S02:L165
  early_termination_reference_rates:
  - term: 3개월
    rate_pct: 2.2
    source_ref: S02:L161
  - term: 6개월
    rate_pct: 2.4
    source_ref: S02:L162
  reference_rate_note: 3·6개월은 특별중도해지이율 참고용이며 가입불가(S02:L14).
availability:
  source_status: IRP 금리 기재; 제공한도·신규 가능 여부 확인 필요
  candidate_state: CONDITIONAL
  runtime_verified: false
  required_checks:
  - 04-12-17A 제공기관 잔여한도·실제 가입가능 여부
  - 동일 제공기관 DC/IRP 보유 및 가입한도
  - 개인형IRP와 기업형IRP 제한 구분
  other_scheme_restrictions:
  - 유안타저축은행 퇴직연금 정기예금 (DB 신규 불가)
early_termination:
  source_terms:
  - text: '- 1개월 미만 : 0.2% (신규시점 보통예금 이율); - 3개월 미만 : 약정금리 × 50%; - 6개월 미만 : 약정금리 × 55%; - 2년 미만 : 약정금리 × 60%; - 3년 미만 : 약정금리
      × 80%'
    source_ref: S02:L161
  common_special_terms_ref: S02:L179-L186
  note: 원문 조건 보존. 공통식과 기관별 식을 중복 계산하지 않음. 가입 당시 약정·특별중도해지 사유별 실제 적용 확인.
pension_payment_eligible: null
investment_strategy: 기존 원리금보장 운용을 유지하려는 자금의 기관·만기 비교 후보. 금리만으로 기관 집중 또는 장기화를 결정하지 않음.
mapping_knowledge_refs:
- E05:원픽 가이드 — 고금리 추구/금리 변동성 대응
- K01:RS-15
- K02:CASE 16
```

<a id="SAV-024"></a>

### SAV-024 · 애큐온저축은행 퇴직연금 정기예금

```yaml
product_id: SAV-024
product_name: 애큐온저축은행 퇴직연금 정기예금
entity_type: individual_product
product_form: 저축은행 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 분산
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S02:L166-L170
- S02:L6-L14
- S03:L67-L70
- E05:상품별 예금자보호 여부와 특징
source_names:
- 애큐온저축은행 퇴직연금 정기예금 (DB 신규 불가) (기업형IRP 판매불가)
- 애큐온저축은행 퇴직연금 정기예금
provider_name: 애큐온저축은행
scheme_scope:
- 개인형IRP
credit_rating: BBB
risk_grade: null
irp_investment_limit_pct: null
management_style:
- 기관·만기 직접 선택
principal_protection: 자료상 원리금보장상품
deposit_protection:
  source_value: 상품제공기관별 1억원 한도
  account_aggregation: 자료상 DC/IRP 합산 관리
  source_refs:
  - S02:L10
  - S03:L69-L70
subscription_amount_policy:
  one_year_only_cap_krw: 95000000
  two_or_three_year_holdings_cap_krw: 90000000
  minimum_amount_krw: null
  source_ref: S03:L69-L70
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 월복리(교안 일반기준; 개별 약관 확인)
  purchase_rates:
  - term: 1년
    rate_pct: 3.95
    source_ref: S02:L168
  - term: 2년
    rate_pct: 3.95
    source_ref: S02:L169
  - term: 3년
    rate_pct: 3.95
    source_ref: S02:L170
  early_termination_reference_rates:
  - term: 3개월
    rate_pct: 1.9
    source_ref: S02:L166
  - term: 6개월
    rate_pct: 2.3
    source_ref: S02:L167
  reference_rate_note: 3·6개월은 특별중도해지이율 참고용이며 가입불가(S02:L14).
availability:
  source_status: IRP 금리 기재; 제공한도·신규 가능 여부 확인 필요
  candidate_state: CONDITIONAL
  runtime_verified: false
  required_checks:
  - 04-12-17A 제공기관 잔여한도·실제 가입가능 여부
  - 동일 제공기관 DC/IRP 보유 및 가입한도
  - 개인형IRP와 기업형IRP 제한 구분
  other_scheme_restrictions:
  - 애큐온저축은행 퇴직연금 정기예금 (DB 신규 불가) (기업형IRP 판매불가)
early_termination:
  source_terms:
  - text: '- 1개월 미만 : 0.10%; - 12개월 미만 : 약정금리 × 50%; - 24개월 미만 : 약정금리 × 60%; - 24개월 이상 : 약정금리 × 80%'
    source_ref: S02:L166
  common_special_terms_ref: S02:L179-L186
  note: 원문 조건 보존. 공통식과 기관별 식을 중복 계산하지 않음. 가입 당시 약정·특별중도해지 사유별 실제 적용 확인.
pension_payment_eligible: null
investment_strategy: 기존 원리금보장 운용을 유지하려는 자금의 기관·만기 비교 후보. 금리만으로 기관 집중 또는 장기화를 결정하지 않음.
mapping_knowledge_refs:
- E05:원픽 가이드 — 고금리 추구/금리 변동성 대응
- K01:RS-15
- K02:CASE 16
```

<a id="SAV-025"></a>

### SAV-025 · 제이티친애저축은행 퇴직연금 정기예금

```yaml
product_id: SAV-025
product_name: 제이티친애저축은행 퇴직연금 정기예금
entity_type: individual_product
product_form: 저축은행 정기예금
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 만기 분산
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S02:L171-L175
- S02:L6-L14
- S03:L67-L70
- E05:상품별 예금자보호 여부와 특징
source_names:
- 제이티친애저축은행 퇴직연금 정기예금 (신규 불가) (기업형IRP 판매불가)
- 제이티친애저축은행 퇴직연금 정기예금
provider_name: 제이티친애저축은행
scheme_scope:
- 개인형IRP
credit_rating: BBB-
risk_grade: null
irp_investment_limit_pct: null
management_style:
- 기관·만기 직접 선택
principal_protection: 자료상 원리금보장상품
deposit_protection:
  source_value: 상품제공기관별 1억원 한도
  account_aggregation: 자료상 DC/IRP 합산 관리
  source_refs:
  - S02:L10
  - S03:L69-L70
subscription_amount_policy:
  one_year_only_cap_krw: 95000000
  two_or_three_year_holdings_cap_krw: 90000000
  minimum_amount_krw: null
  source_ref: S03:L69-L70
rate_observation:
  applicable_from: '2026-09-01'
  applicable_to: '2026-09-30'
  unit: '%'
  rate_type: 월복리(교안 일반기준; 개별 약관 확인)
  purchase_rates:
  - term: 1년
    rate_pct: 3.85
    source_ref: S02:L173
  - term: 2년
    rate_pct: 3.65
    source_ref: S02:L174
  - term: 3년
    rate_pct: 3.35
    source_ref: S02:L175
  early_termination_reference_rates:
  - term: 3개월
    rate_pct: 1.8
    source_ref: S02:L171
  - term: 6개월
    rate_pct: 2.0
    source_ref: S02:L172
  reference_rate_note: 3·6개월은 특별중도해지이율 참고용이며 가입불가(S02:L14).
availability:
  source_status: 신규 불가
  candidate_state: EXCLUDED
  runtime_verified: false
  required_checks:
  - 04-12-17A 제공기관 잔여한도·실제 가입가능 여부
  - 동일 제공기관 DC/IRP 보유 및 가입한도
  - 개인형IRP와 기업형IRP 제한 구분
  other_scheme_restrictions:
  - 제이티친애저축은행 퇴직연금 정기예금 (신규 불가) (기업형IRP 판매불가)
early_termination:
  source_terms:
  - text: '- 1개월 미만 : 0.10%; - 6개월 미만 : 약정금리 × 50%; - 12개월 미만 : 약정금리 × 60%; - 12개월 이상 : 약정금리 × 70%'
    source_ref: S02:L171
  common_special_terms_ref: S02:L179-L186
  note: 원문 조건 보존. 공통식과 기관별 식을 중복 계산하지 않음. 가입 당시 약정·특별중도해지 사유별 실제 적용 확인.
pension_payment_eligible: null
investment_strategy: 기존 원리금보장 운용을 유지하려는 자금의 기관·만기 비교 후보. 금리만으로 기관 집중 또는 장기화를 결정하지 않음.
mapping_knowledge_refs:
- E05:원픽 가이드 — 고금리 추구/금리 변동성 대응
- K01:RS-15
- K02:CASE 16
```


## 6. 특별제공 GIC / ELB

<a id="GIC-001"></a>

### GIC-001 · KB손해보험 GIC (2026년 9월 특별제공안)

```yaml
product_id: GIC-001
product_name: KB손해보험 GIC (2026년 9월 특별제공안)
entity_type: indicative_offer
product_form: GIC
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 연금수령 재원
- 만기 분산
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S03:L19-L29
- S03:L41-L42
- S03:L58-L70
- E05:원리금보장상품 4종 소개
official_product_name: null
name_note: 원문에는 제공기관·유형만 있어 이를 조합한 검색용 명칭. 정식 개별상품명/ELB 회차를 임의 생성하지 않음.
provider_name: KB손해보험
scheme_scope:
- DC
- 개인형IRP
credit_rating: AA+
risk_grade: null
irp_investment_limit_pct: null
management_style:
- 기관·만기 직접 선택
principal_protection: 교안상 원리금보장상품; ELB는 발행사 보장과 예금자보호를 구분
deposit_protection: 상품기관별 1억원까지 가능
pension_payment_eligible: true
pension_payment_source: S03:L26
minimum_amount_krw: 0
minimum_amount_note: 0은 원문 제한없음의 표기; 기타 계좌·거래 요건 면제를 의미하지 않음.
rate_observation:
  applicable_month: 2026-09
  unit: '%'
  rate_type: 연복리(교안 일반기준)
  purchase_rates:
  - term: 1년
    rate_pct: 3.8
  - term: 2년
    rate_pct: 4.2
  - term: 3년
    rate_pct: 4.62
  - term: 5년
    rate_pct: 3.7
  application_timing: 매수 완료일 기준(S03:L61)
  source_ref: S03:L25
availability:
  source_status: 9월 특별제공안
  runtime_verified: false
  candidate_state: CONDITIONAL
  required_checks:
  - 04-12-17A 제공한도·해당 만기 상품 조회
  non_face_to_face_available: 교안상 가능; 해당 상품 확인
execution_note: 일부 매도는 평가금액 매도 방식이며 신청액과 실제 매도금액이 다를 수 있음(S03:L62).
investment_strategy: 사용시점과 만기를 맞춰 약정금리를 활용. 긴 만기라는 이유만으로 단기 필요자금에 배정하지 않음.
mapping_knowledge_refs:
- E05:원픽 가이드
- S03:L52
```

<a id="GIC-002"></a>

### GIC-002 · DB손해보험 GIC (2026년 9월 특별제공안)

```yaml
product_id: GIC-002
product_name: DB손해보험 GIC (2026년 9월 특별제공안)
entity_type: indicative_offer
product_form: GIC
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 연금수령 재원
- 만기 분산
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S03:L19-L29
- S03:L41-L42
- S03:L58-L70
- E05:원리금보장상품 4종 소개
official_product_name: null
name_note: 원문에는 제공기관·유형만 있어 이를 조합한 검색용 명칭. 정식 개별상품명/ELB 회차를 임의 생성하지 않음.
provider_name: DB손해보험
scheme_scope:
- DC
- 개인형IRP
credit_rating: AAA
risk_grade: null
irp_investment_limit_pct: null
management_style:
- 기관·만기 직접 선택
principal_protection: 교안상 원리금보장상품; ELB는 발행사 보장과 예금자보호를 구분
deposit_protection: 상품기관별 1억원까지 가능
pension_payment_eligible: true
pension_payment_source: S03:L26
minimum_amount_krw: 0
minimum_amount_note: 0은 원문 제한없음의 표기; 기타 계좌·거래 요건 면제를 의미하지 않음.
rate_observation:
  applicable_month: 2026-09
  unit: '%'
  rate_type: 연복리(교안 일반기준)
  purchase_rates:
  - term: 3년
    rate_pct: 4.6
  - term: 5년
    rate_pct: 4.5
  application_timing: 매수 완료일 기준(S03:L61)
  source_ref: S03:L25
availability:
  source_status: 9월 특별제공안
  runtime_verified: false
  candidate_state: CONDITIONAL
  required_checks:
  - 04-12-17A 제공한도·해당 만기 상품 조회
  non_face_to_face_available: 교안상 가능; 해당 상품 확인
execution_note: 일부 매도는 평가금액 매도 방식이며 신청액과 실제 매도금액이 다를 수 있음(S03:L62).
investment_strategy: 사용시점과 만기를 맞춰 약정금리를 활용. 긴 만기라는 이유만으로 단기 필요자금에 배정하지 않음.
mapping_knowledge_refs:
- E05:원픽 가이드
- S03:L52
```

<a id="GIC-003"></a>

### GIC-003 · 한화생명 GIC (2026년 9월 특별제공안)

```yaml
product_id: GIC-003
product_name: 한화생명 GIC (2026년 9월 특별제공안)
entity_type: indicative_offer
product_form: GIC
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 연금수령 재원
- 만기 분산
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S03:L19-L29
- S03:L41-L42
- S03:L58-L70
- E05:원리금보장상품 4종 소개
official_product_name: null
name_note: 원문에는 제공기관·유형만 있어 이를 조합한 검색용 명칭. 정식 개별상품명/ELB 회차를 임의 생성하지 않음.
provider_name: 한화생명
scheme_scope:
- DC
- 개인형IRP
credit_rating: AAA
risk_grade: null
irp_investment_limit_pct: null
management_style:
- 기관·만기 직접 선택
principal_protection: 교안상 원리금보장상품; ELB는 발행사 보장과 예금자보호를 구분
deposit_protection: 상품기관별 1억원까지 가능
pension_payment_eligible: true
pension_payment_source: S03:L26
minimum_amount_krw: 0
minimum_amount_note: 0은 원문 제한없음의 표기; 기타 계좌·거래 요건 면제를 의미하지 않음.
rate_observation:
  applicable_month: 2026-09
  unit: '%'
  rate_type: 연복리(교안 일반기준)
  purchase_rates:
  - term: 1년
    rate_pct: 4.0
  - term: 2년
    rate_pct: 3.48
  - term: 3년
    rate_pct: 4.48
  - term: 5년
    rate_pct: 3.54
  application_timing: 매수 완료일 기준(S03:L61)
  source_ref: S03:L25
availability:
  source_status: 9월 특별제공안
  runtime_verified: false
  candidate_state: CONDITIONAL
  required_checks:
  - 04-12-17A 제공한도·해당 만기 상품 조회
  non_face_to_face_available: 교안상 가능; 해당 상품 확인
execution_note: 일부 매도는 평가금액 매도 방식이며 신청액과 실제 매도금액이 다를 수 있음(S03:L62).
investment_strategy: 사용시점과 만기를 맞춰 약정금리를 활용. 긴 만기라는 이유만으로 단기 필요자금에 배정하지 않음.
mapping_knowledge_refs:
- E05:원픽 가이드
- S03:L52
```

<a id="GIC-004"></a>

### GIC-004 · 메리츠화재 GIC (2026년 9월 특별제공안)

```yaml
product_id: GIC-004
product_name: 메리츠화재 GIC (2026년 9월 특별제공안)
entity_type: indicative_offer
product_form: GIC
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 연금수령 재원
- 만기 분산
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S03:L19-L29
- S03:L41-L42
- S03:L58-L70
- E05:원리금보장상품 4종 소개
official_product_name: null
name_note: 원문에는 제공기관·유형만 있어 이를 조합한 검색용 명칭. 정식 개별상품명/ELB 회차를 임의 생성하지 않음.
provider_name: 메리츠화재
scheme_scope:
- DC
- 개인형IRP
credit_rating: AA+
risk_grade: null
irp_investment_limit_pct: null
management_style:
- 기관·만기 직접 선택
principal_protection: 교안상 원리금보장상품; ELB는 발행사 보장과 예금자보호를 구분
deposit_protection: 상품기관별 1억원까지 가능
pension_payment_eligible: true
pension_payment_source: S03:L26
minimum_amount_krw: 0
minimum_amount_note: 0은 원문 제한없음의 표기; 기타 계좌·거래 요건 면제를 의미하지 않음.
rate_observation:
  applicable_month: 2026-09
  unit: '%'
  rate_type: 연복리(교안 일반기준)
  purchase_rates:
  - term: 3년
    rate_pct: 4.45
  - term: 5년
    rate_pct: 4.2
  application_timing: 매수 완료일 기준(S03:L61)
  source_ref: S03:L25
availability:
  source_status: 9월 특별제공안
  runtime_verified: false
  candidate_state: CONDITIONAL
  required_checks:
  - 04-12-17A 제공한도·해당 만기 상품 조회
  non_face_to_face_available: 교안상 가능; 해당 상품 확인
execution_note: 일부 매도는 평가금액 매도 방식이며 신청액과 실제 매도금액이 다를 수 있음(S03:L62).
investment_strategy: 사용시점과 만기를 맞춰 약정금리를 활용. 긴 만기라는 이유만으로 단기 필요자금에 배정하지 않음.
mapping_knowledge_refs:
- E05:원픽 가이드
- S03:L52
```

<a id="ELB-001"></a>

### ELB-001 · 메리츠증권 ELB (2026년 9월 특별제공안)

```yaml
product_id: ELB-001
product_name: 메리츠증권 ELB (2026년 9월 특별제공안)
entity_type: indicative_offer
product_form: ELB
asset_class:
- 원리금보장
strategy_type:
- 만기형 확정금리
portfolio_role:
- 원리금보장 영역
- 연금수령 재원
- 만기 분산
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S03:L19-L29
- S03:L41-L42
- S03:L58-L70
- E05:원리금보장상품 4종 소개
official_product_name: null
name_note: 원문에는 제공기관·유형만 있어 이를 조합한 검색용 명칭. 정식 개별상품명/ELB 회차를 임의 생성하지 않음.
provider_name: 메리츠증권
scheme_scope:
- DC
- 개인형IRP
credit_rating: AA
risk_grade: null
irp_investment_limit_pct: null
management_style:
- 기관·만기 직접 선택
principal_protection: 교안상 원리금보장상품; ELB는 발행사 보장과 예금자보호를 구분
deposit_protection: 불가
pension_payment_eligible: true
pension_payment_source: S03:L26
minimum_amount_krw: 50000000
minimum_amount_note: 0은 원문 제한없음의 표기; 기타 계좌·거래 요건 면제를 의미하지 않음.
rate_observation:
  applicable_month: 2026-09
  unit: '%'
  rate_type: 연단리(교안 일반기준)
  purchase_rates:
  - term: 1년
    rate_pct: 3.95
  - term: 2년
    rate_pct: 4.3
  - term: 3년
    rate_pct: 4.6
  - term: 5년
    rate_pct: 4.7
  application_timing: 매수 완료일 기준(S03:L61)
  source_ref: S03:L25
availability:
  source_status: 9월 특별제공안
  runtime_verified: false
  candidate_state: INTERNAL_REVIEW_BEFORE_CUSTOMER_PROPOSAL
  required_checks:
  - 최소 5천만원
  - 06-12-650 상품협의 등록 및 업체 컨펌 완료 후 고객 제안
  - 발행·거래일 및 신청 마감일 확인
  non_face_to_face_available: false
execution_note: 사전신청 마감 후 취소·변경 불가, 정해진 일자만 거래. 성향분석·설명의무 녹취·해피콜 등 자료상 요건 확인(S03:L63-L66).
investment_strategy: 사용시점과 만기를 맞춰 약정금리를 활용. 긴 만기라는 이유만으로 단기 필요자금에 배정하지 않음.
mapping_knowledge_refs:
- E05:원픽 가이드
- S03:L52
```


## 7. 월간 추천·모델 구성 펀드(시리즈/약칭)

<a id="MF-001"></a>

### MF-001 · KB 온국민 TDF 시리즈

```yaml
product_id: MF-001
product_name: KB 온국민 TDF 시리즈
entity_type: fund_series
product_form: 일반펀드
asset_class:
- 글로벌 자산배분
strategy_type:
- TDF
portfolio_role:
- 생애주기 자동조정
- 장기 분산
- 관리부담 완화
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L15
- S04:L11-L37
raw_category: TDF
share_class: null
source_code: null
management_style:
- 생애주기 자동조정
risk_grade:
  level: null
  source_label: 다소높은
  scope: 월간 표의 표기. TDF 빈티지·클래스 전체로 확장 금지
irp_investment_limit_pct: null
performance_observations:
- as_of: '2026-08-28'
  unit: '%'
  return_type: 수익률(누적/연환산 명시 없음)
  share_class: null
  vintage_scope: 2030
  returns_pct:
    1M: 0.3
    3M: -5.0
    1Y: 15.27
    3Y: 44.4
  volatility_1y_pct: 10.67
  source_ref: S04:L15
  quality: MD 표 값. 원본 PDF 대조 미실시.
monthly_recommended: true
recommendation_month: 2026-09
model_portfolio_refs: []
strategy_observations:
- text: 은퇴에 맞춘 글로벌 자산배분
  quality: 원문 명시
  source_ref: S04:L15
availability:
  source_status: 9월 추천펀드 표 등재
  runtime_verified: false
  candidate_state: FAMILY_CANDIDATE_REQUIRES_VARIANT
  required_checks:
  - 개인형IRP 실제 취급 클래스/빈티지
  - 해당 클래스 위험등급·투자한도
  - 정식 상품명 및 최신 상품조회
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06 고객 질문 Case 3)
deposit_protection: null
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3
- S04:상품별 투자전략
fee_observations: []
```

<a id="MF-002"></a>

### MF-002 · 마이다스 기본 TDF 시리즈

```yaml
product_id: MF-002
product_name: 마이다스 기본 TDF 시리즈
entity_type: fund_series
product_form: 일반펀드
asset_class:
- 글로벌 자산배분
strategy_type:
- TDF
portfolio_role:
- 생애주기 자동조정
- 장기 분산
- 관리부담 완화
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L16
- S04:L11-L37
raw_category: TDF
share_class: null
source_code: null
management_style:
- 생애주기 자동조정
risk_grade:
  level: null
  source_label: 보통
  scope: 월간 표의 표기. TDF 빈티지·클래스 전체로 확장 금지
irp_investment_limit_pct: null
performance_observations:
- as_of: '2026-08-28'
  unit: '%'
  return_type: 수익률(누적/연환산 명시 없음)
  share_class: null
  vintage_scope: 2030
  returns_pct:
    1M: -1.4
    3M: -6.22
    1Y: 19.44
    3Y: null
  volatility_1y_pct: 9.9
  source_ref: S04:L16
  quality: MD 표 값. 원본 PDF 대조 미실시.
monthly_recommended: true
recommendation_month: 2026-09
model_portfolio_refs: []
strategy_observations:
- text: 마이다스에셋의 대표적인 국내외 펀드를 편입하는 TDF ※
  quality: 판독불확실(원문 ※)
  source_ref: S04:L16
availability:
  source_status: 9월 추천펀드 표 등재
  runtime_verified: false
  candidate_state: FAMILY_CANDIDATE_REQUIRES_VARIANT
  required_checks:
  - 개인형IRP 실제 취급 클래스/빈티지
  - 해당 클래스 위험등급·투자한도
  - 정식 상품명 및 최신 상품조회
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06 고객 질문 Case 3)
deposit_protection: null
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3
- S04:상품별 투자전략
fee_observations: []
```

<a id="MF-003"></a>

### MF-003 · 신한 마음편한 TDF 시리즈

```yaml
product_id: MF-003
product_name: 신한 마음편한 TDF 시리즈
entity_type: fund_series
product_form: 일반펀드
asset_class:
- 글로벌 자산배분
strategy_type:
- TDF
portfolio_role:
- 생애주기 자동조정
- 장기 분산
- 관리부담 완화
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L17
- S04:L11-L37
raw_category: TDF
share_class: null
source_code: null
management_style:
- 생애주기 자동조정
risk_grade:
  level: null
  source_label: 다소높은
  scope: 월간 표의 표기. TDF 빈티지·클래스 전체로 확장 금지
irp_investment_limit_pct: null
performance_observations:
- as_of: '2026-08-28'
  unit: '%'
  return_type: 수익률(누적/연환산 명시 없음)
  share_class: null
  vintage_scope: 2030
  returns_pct:
    1M: 0.54
    3M: -2.85
    1Y: 15.74
    3Y: 44.38
  volatility_1y_pct: 8.38
  source_ref: S04:L17
  quality: MD 표 값. 원본 PDF 대조 미실시.
monthly_recommended: true
recommendation_month: 2026-09
model_portfolio_refs: []
strategy_observations:
- text: 생애주기에 따라 포트폴리오 조정, 환노출 포트폴리오 운용
  quality: 원문 명시
  source_ref: S04:L17
availability:
  source_status: 9월 추천펀드 표 등재
  runtime_verified: false
  candidate_state: FAMILY_CANDIDATE_REQUIRES_VARIANT
  required_checks:
  - 개인형IRP 실제 취급 클래스/빈티지
  - 해당 클래스 위험등급·투자한도
  - 정식 상품명 및 최신 상품조회
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06 고객 질문 Case 3)
deposit_protection: null
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3
- S04:상품별 투자전략
fee_observations: []
```

<a id="MF-004"></a>

### MF-004 · 한화 LIFEPLUS TDF 시리즈

```yaml
product_id: MF-004
product_name: 한화 LIFEPLUS TDF 시리즈
entity_type: fund_series
product_form: 일반펀드
asset_class:
- 글로벌 자산배분
strategy_type:
- TDF
portfolio_role:
- 생애주기 자동조정
- 장기 분산
- 관리부담 완화
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L18
- S04:L11-L37
raw_category: TDF
share_class: null
source_code: null
management_style:
- 생애주기 자동조정
risk_grade:
  level: null
  source_label: 다소높은
  scope: 월간 표의 표기. TDF 빈티지·클래스 전체로 확장 금지
irp_investment_limit_pct: null
performance_observations:
- as_of: '2026-08-28'
  unit: '%'
  return_type: 수익률(누적/연환산 명시 없음)
  share_class: null
  vintage_scope: 2030
  returns_pct:
    1M: 0.04
    3M: -3.79
    1Y: 14.57
    3Y: 44.07
  volatility_1y_pct: 7.97
  source_ref: S04:L18
  quality: MD 표 값. 원본 PDF 대조 미실시.
monthly_recommended: true
recommendation_month: 2026-09
model_portfolio_refs: []
strategy_observations:
- text: 하이브리드 운용전략과 JPG건의 노하우로 중장기 성과 추구 ※
  quality: 판독불확실(원문 ※)
  source_ref: S04:L18
availability:
  source_status: 9월 추천펀드 표 등재
  runtime_verified: false
  candidate_state: FAMILY_CANDIDATE_REQUIRES_VARIANT
  required_checks:
  - 개인형IRP 실제 취급 클래스/빈티지
  - 해당 클래스 위험등급·투자한도
  - 정식 상품명 및 최신 상품조회
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06 고객 질문 Case 3)
deposit_protection: null
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3
- S04:상품별 투자전략
fee_observations: []
```

<a id="MF-005"></a>

### MF-005 · 마이다스 아시아 리더스 성장주 (H) (주식)

```yaml
product_id: MF-005
product_name: 마이다스 아시아 리더스 성장주 (H) (주식)
entity_type: fund_family
product_form: 일반펀드
asset_class:
- 해외주식
strategy_type:
- 아시아주식
- 성장주
- H 표기
portfolio_role:
- 아시아주식 운용
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L19
- S04:L11-L37
raw_category: 해외주식
share_class: null
source_code: null
management_style:
- 펀드 선택 후 운용사 운용
risk_grade:
  level: null
  source_label: 높은
  scope: 월간 표의 표기. TDF 빈티지·클래스 전체로 확장 금지
irp_investment_limit_pct: null
performance_observations:
- as_of: '2026-08-28'
  unit: '%'
  return_type: 수익률(누적/연환산 명시 없음)
  share_class: null
  vintage_scope: null
  returns_pct:
    1M: -0.99
    3M: -14.08
    1Y: 53.06
    3Y: 127.14
  volatility_1y_pct: 30.16
  source_ref: S04:L19
  quality: MD 표 값. 원본 PDF 대조 미실시.
monthly_recommended: true
recommendation_month: 2026-09
model_portfolio_refs: []
strategy_observations:
- text: 성장잠재력 높은 아시아지역(일본, 중국, 인도, 대만 등) 주식에 투자 ※
  quality: 판독불확실(원문 ※)
  source_ref: S04:L19
availability:
  source_status: 9월 추천펀드 표 등재
  runtime_verified: false
  candidate_state: FAMILY_CANDIDATE_REQUIRES_VARIANT
  required_checks:
  - 개인형IRP 실제 취급 클래스/빈티지
  - 해당 클래스 위험등급·투자한도
  - 정식 상품명 및 최신 상품조회
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06 고객 질문 Case 3)
deposit_protection: null
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3
- S04:상품별 투자전략
fee_observations: []
classification_note: 원문 투자전략 또는 상품명 표기 기반. ※ 설명은 검수 필요 상태를 유지하며 상세 편입·분배 조건은 추가 추정하지 않음.
```

<a id="MF-006"></a>

### MF-006 · 에셋플러스 글로벌 리치투게더 (주식)

```yaml
product_id: MF-006
product_name: 에셋플러스 글로벌 리치투게더 (주식)
entity_type: fund_family
product_form: 일반펀드
asset_class:
- 해외주식
strategy_type:
- 글로벌 혁신기업
- 고부가소비재
portfolio_role:
- 글로벌 주식 성장전략
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L20
- S04:L11-L37
raw_category: 해외주식
share_class: null
source_code: null
management_style:
- 펀드 선택 후 운용사 운용
risk_grade:
  level: null
  source_label: 높은
  scope: 월간 표의 표기. TDF 빈티지·클래스 전체로 확장 금지
irp_investment_limit_pct: null
performance_observations:
- as_of: '2026-08-28'
  unit: '%'
  return_type: 수익률(누적/연환산 명시 없음)
  share_class: null
  vintage_scope: null
  returns_pct:
    1M: 0.78
    3M: -10.46
    1Y: 31.05
    3Y: 90.91
  volatility_1y_pct: 23.64
  source_ref: S04:L20
  quality: MD 표 값. 원본 PDF 대조 미실시.
monthly_recommended: true
recommendation_month: 2026-09
model_portfolio_refs: []
strategy_observations:
- text: 글로벌 혁신기업 및 고부가소비재 기업의 주식에 투자
  quality: 원문 명시
  source_ref: S04:L20
availability:
  source_status: 9월 추천펀드 표 등재
  runtime_verified: false
  candidate_state: FAMILY_CANDIDATE_REQUIRES_VARIANT
  required_checks:
  - 개인형IRP 실제 취급 클래스/빈티지
  - 해당 클래스 위험등급·투자한도
  - 정식 상품명 및 최신 상품조회
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06 고객 질문 Case 3)
deposit_protection: null
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3
- S04:상품별 투자전략
fee_observations: []
classification_note: 원문 투자전략 또는 상품명 표기 기반. ※ 설명은 검수 필요 상태를 유지하며 상세 편입·분배 조건은 추가 추정하지 않음.
```

<a id="MF-007"></a>

### MF-007 · KB RISE 미국ETF 모아드림 (주식-재간접)

```yaml
product_id: MF-007
product_name: KB RISE 미국ETF 모아드림 (주식-재간접)
entity_type: fund_family
product_form: 일반펀드
asset_class:
- 해외주식
strategy_type:
- 미국 ETF 재간접
- 미국 성장테마
portfolio_role:
- 미국주식 운용
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L21
- S04:L11-L37
raw_category: 해외주식
share_class: null
source_code: null
management_style:
- 펀드 선택 후 운용사 운용
risk_grade:
  level: null
  source_label: 높은
  scope: 월간 표의 표기. TDF 빈티지·클래스 전체로 확장 금지
irp_investment_limit_pct: null
performance_observations:
- as_of: '2026-08-28'
  unit: '%'
  return_type: 수익률(누적/연환산 명시 없음)
  share_class: null
  vintage_scope: null
  returns_pct:
    1M: -2.74
    3M: -10.38
    1Y: 28.56
    3Y: null
  volatility_1y_pct: 17.51
  source_ref: S04:L21
  quality: MD 표 값. 원본 PDF 대조 미실시.
monthly_recommended: true
recommendation_month: 2026-09
model_portfolio_refs: []
strategy_observations:
- text: 미국 대표자산 및 미국 성장테마 관련 ETF에 투자
  quality: 원문 명시
  source_ref: S04:L21
availability:
  source_status: 9월 추천펀드 표 등재
  runtime_verified: false
  candidate_state: FAMILY_CANDIDATE_REQUIRES_VARIANT
  required_checks:
  - 개인형IRP 실제 취급 클래스/빈티지
  - 해당 클래스 위험등급·투자한도
  - 정식 상품명 및 최신 상품조회
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06 고객 질문 Case 3)
deposit_protection: null
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3
- S04:상품별 투자전략
fee_observations: []
classification_note: 원문 투자전략 또는 상품명 표기 기반. ※ 설명은 검수 필요 상태를 유지하며 상세 편입·분배 조건은 추가 추정하지 않음.
```

<a id="MF-008"></a>

### MF-008 · 피델리티 글로벌 테크놀로지 (주식-재간접)

```yaml
product_id: MF-008
product_name: 피델리티 글로벌 테크놀로지 (주식-재간접)
entity_type: fund_family
product_form: 일반펀드
asset_class:
- 해외주식
strategy_type:
- 글로벌 테크놀로지
portfolio_role:
- 테크 섹터 운용
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L22
- S04:L11-L37
raw_category: 해외주식
share_class: null
source_code: null
management_style:
- 펀드 선택 후 운용사 운용
risk_grade:
  level: null
  source_label: 높은
  scope: 월간 표의 표기. TDF 빈티지·클래스 전체로 확장 금지
irp_investment_limit_pct: null
performance_observations:
- as_of: '2026-08-28'
  unit: '%'
  return_type: 수익률(누적/연환산 명시 없음)
  share_class: null
  vintage_scope: null
  returns_pct:
    1M: 6.22
    3M: -1.68
    1Y: 24.25
    3Y: 82.35
  volatility_1y_pct: 17.53
  source_ref: S04:L22
  quality: MD 표 값. 원본 PDF 대조 미실시.
monthly_recommended: true
recommendation_month: 2026-09
model_portfolio_refs: []
strategy_observations:
- text: 전세계 테크기업의 주식형증권 투자
  quality: 원문 명시
  source_ref: S04:L22
availability:
  source_status: 9월 추천펀드 표 등재
  runtime_verified: false
  candidate_state: FAMILY_CANDIDATE_REQUIRES_VARIANT
  required_checks:
  - 개인형IRP 실제 취급 클래스/빈티지
  - 해당 클래스 위험등급·투자한도
  - 정식 상품명 및 최신 상품조회
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06 고객 질문 Case 3)
deposit_protection: null
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3
- S04:상품별 투자전략
fee_observations: []
classification_note: 원문 투자전략 또는 상품명 표기 기반. ※ 설명은 검수 필요 상태를 유지하며 상세 편입·분배 조건은 추가 추정하지 않음.
```

<a id="MF-009"></a>

### MF-009 · 삼성 EMP 리얼리턴 (UH) (주식혼합-재간접)

```yaml
product_id: MF-009
product_name: 삼성 EMP 리얼리턴 (UH) (주식혼합-재간접)
entity_type: fund_family
product_form: 일반펀드
asset_class:
- 해외혼합
strategy_type:
- EMP
- 다자산 ETF
- UH 표기
portfolio_role:
- 다자산 분산
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L23
- S04:L11-L37
- S04:L174
raw_category: 해외혼합
share_class: null
source_code: null
management_style:
- 펀드 선택 후 운용사 운용
risk_grade:
  level: null
  source_label: 보통
  scope: 월간 표의 표기. TDF 빈티지·클래스 전체로 확장 금지
irp_investment_limit_pct: null
performance_observations:
- as_of: '2026-08-28'
  unit: '%'
  return_type: 수익률(누적/연환산 명시 없음)
  share_class: null
  vintage_scope: null
  returns_pct:
    1M: 1.69
    3M: -2.09
    1Y: 22.25
    3Y: 57.8
  volatility_1y_pct: 8.54
  source_ref: S04:L23
  quality: MD 표 값. 원본 PDF 대조 미실시.
monthly_recommended: true
recommendation_month: 2026-09
model_portfolio_refs:
- MODEL-003
strategy_observations:
- text: 국내외 주식, 채권, 대체자산 등 다양한 자산의 ETF에 투자 ※
  quality: 판독불확실(원문 ※)
  source_ref: S04:L23
- text: 국내외 주식, 채권, 대체자산 등 다양한 자산 관련 ETF에 투자
  quality: 원문 명시
  source_ref: S04:L174
availability:
  source_status: 9월 추천펀드 표 등재
  runtime_verified: false
  candidate_state: FAMILY_CANDIDATE_REQUIRES_VARIANT
  required_checks:
  - 개인형IRP 실제 취급 클래스/빈티지
  - 해당 클래스 위험등급·투자한도
  - 정식 상품명 및 최신 상품조회
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06 고객 질문 Case 3)
deposit_protection: null
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3
- S04:상품별 투자전략
fee_observations:
- fee_type: 합성총보수
  annual_pct: 1.1215
  share_class: null
  source_ref: S04:L174
  note: 모델 표 약칭의 보수. 특정 클래스에 전파하지 않음.
source_aliases:
- 삼성EMP 리얼리턴(UH)
classification_note: 원문 투자전략 또는 상품명 표기 기반. ※ 설명은 검수 필요 상태를 유지하며 상세 편입·분배 조건은 추가 추정하지 않음.
```

<a id="MF-010"></a>

### MF-010 · KB 드림스타 자산배분 안정형 (혼합-재간접)

```yaml
product_id: MF-010
product_name: KB 드림스타 자산배분 안정형 (혼합-재간접)
entity_type: fund_family
product_form: 일반펀드
asset_class:
- 해외혼합
strategy_type:
- 글로벌자산배분
- ETF 재간접
portfolio_role:
- 다자산 분산
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L24
- S04:L11-L37
raw_category: 해외혼합
share_class: null
source_code: null
management_style:
- 펀드 선택 후 운용사 운용
risk_grade:
  level: null
  source_label: 보통
  scope: 월간 표의 표기. TDF 빈티지·클래스 전체로 확장 금지
irp_investment_limit_pct: null
performance_observations:
- as_of: '2026-08-28'
  unit: '%'
  return_type: 수익률(누적/연환산 명시 없음)
  share_class: null
  vintage_scope: null
  returns_pct:
    1M: -0.14
    3M: -3.31
    1Y: 13.04
    3Y: null
  volatility_1y_pct: 6.32
  source_ref: S04:L24
  quality: MD 표 값. 원본 PDF 대조 미실시.
monthly_recommended: true
recommendation_month: 2026-09
model_portfolio_refs: []
strategy_observations:
- text: 전세계 주식, 채권 및 대체자산 관련 국내외 ETF에 분산투자
  quality: 원문 명시
  source_ref: S04:L24
availability:
  source_status: 9월 추천펀드 표 등재
  runtime_verified: false
  candidate_state: FAMILY_CANDIDATE_REQUIRES_VARIANT
  required_checks:
  - 개인형IRP 실제 취급 클래스/빈티지
  - 해당 클래스 위험등급·투자한도
  - 정식 상품명 및 최신 상품조회
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06 고객 질문 Case 3)
deposit_protection: null
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3
- S04:상품별 투자전략
fee_observations: []
classification_note: 원문 투자전략 또는 상품명 표기 기반. ※ 설명은 검수 필요 상태를 유지하며 상세 편입·분배 조건은 추가 추정하지 않음.
```

<a id="MF-011"></a>

### MF-011 · 우리 미국단기채 공모주 (H) (채권혼합)

```yaml
product_id: MF-011
product_name: 우리 미국단기채 공모주 (H) (채권혼합)
entity_type: fund_family
product_form: 일반펀드
asset_class:
- 해외 채권혼합
strategy_type:
- 미국 단기채
- 공모주
portfolio_role:
- 채권 중심 + 공모주 전략
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L25
- S04:L11-L37
- S04:L173
- S04:L184
- S04:L195
raw_category: 해외혼합
share_class: null
source_code: null
management_style:
- 펀드 선택 후 운용사 운용
risk_grade:
  level: null
  source_label: 보통
  scope: 월간 표의 표기. TDF 빈티지·클래스 전체로 확장 금지
irp_investment_limit_pct: null
performance_observations:
- as_of: '2026-08-28'
  unit: '%'
  return_type: 수익률(누적/연환산 명시 없음)
  share_class: null
  vintage_scope: null
  returns_pct:
    1M: -0.21
    3M: -0.08
    1Y: 4.0
    3Y: null
  volatility_1y_pct: 1.7
  source_ref: S04:L25
  quality: MD 표 값. 원본 PDF 대조 미실시.
monthly_recommended: true
recommendation_month: 2026-09
model_portfolio_refs:
- MODEL-003
- MODEL-004
- MODEL-005
strategy_observations:
- text: 미국 공모주와 채권에 주로 투자하며 글로벌 공모주에 선별하여 투자 ※
  quality: 판독불확실(원문 ※)
  source_ref: S04:L25
- text: 미국 공모주와 미국 채권에 주로 투자하며 일부자산은 한국 포함 글로벌 공모주에 선별 투자
  quality: 원문 명시
  source_ref: S04:L173
- text: 미국 공모주와 미국 채권에 주로 투자하며 일부자산은 한국 포함 글로벌 공모주에 선별 투자
  quality: 원문 명시
  source_ref: S04:L184
- text: 미국 공모주와 미국 채권에 주로 투자하며 일부자산은 한국 포함 글로벌 공모주에 선별 투자
  quality: 원문 명시
  source_ref: S04:L195
availability:
  source_status: 9월 추천펀드 표 등재
  runtime_verified: false
  candidate_state: FAMILY_CANDIDATE_REQUIRES_VARIANT
  required_checks:
  - 개인형IRP 실제 취급 클래스/빈티지
  - 해당 클래스 위험등급·투자한도
  - 정식 상품명 및 최신 상품조회
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06 고객 질문 Case 3)
deposit_protection: null
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3
- S04:상품별 투자전략
fee_observations:
- fee_type: 합성총보수
  annual_pct: 1.2171
  share_class: null
  source_ref: S04:L173
  note: 모델 표 약칭의 보수. 특정 클래스에 전파하지 않음.
- fee_type: 합성총보수
  annual_pct: 1.2171
  share_class: null
  source_ref: S04:L184
  note: 모델 표 약칭의 보수. 특정 클래스에 전파하지 않음.
- fee_type: 합성총보수
  annual_pct: 1.2171
  share_class: null
  source_ref: S04:L195
  note: 모델 표 약칭의 보수. 특정 클래스에 전파하지 않음.
source_aliases:
- 우리미국 단기채공모주(H)
related_class_candidates:
- FND-002
```

<a id="MF-012"></a>

### MF-012 · KB코리아밸류업액티브 (주식)

```yaml
product_id: MF-012
product_name: KB코리아밸류업액티브 (주식)
entity_type: fund_family
product_form: 일반펀드
asset_class:
- 국내주식
strategy_type:
- 국내 밸류업
- 주주환원
- 액티브
portfolio_role:
- 국내주식 가치제고 전략
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L28
- S04:L11-L37
raw_category: 국내주식
share_class: null
source_code: null
management_style:
- 펀드 선택 후 운용사 운용
risk_grade:
  level: null
  source_label: 높은
  scope: 월간 표의 표기. TDF 빈티지·클래스 전체로 확장 금지
irp_investment_limit_pct: null
performance_observations:
- as_of: '2026-08-28'
  unit: '%'
  return_type: 수익률(누적/연환산 명시 없음)
  share_class: null
  vintage_scope: null
  returns_pct:
    1M: 0.45
    3M: -21.46
    1Y: 157.79
    3Y: null
  volatility_1y_pct: 46.06
  source_ref: S04:L28
  quality: MD 표 값. 원본 PDF 대조 미실시.
monthly_recommended: true
recommendation_month: 2026-09
model_portfolio_refs: []
strategy_observations:
- text: 주주환원 및 기업가치 제고로 가치상승이 기대되는 국내주식에 투자
  quality: 원문 명시
  source_ref: S04:L28
availability:
  source_status: 9월 추천펀드 표 등재
  runtime_verified: false
  candidate_state: FAMILY_CANDIDATE_REQUIRES_VARIANT
  required_checks:
  - 개인형IRP 실제 취급 클래스/빈티지
  - 해당 클래스 위험등급·투자한도
  - 정식 상품명 및 최신 상품조회
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06 고객 질문 Case 3)
deposit_protection: null
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3
- S04:상품별 투자전략
fee_observations: []
classification_note: 원문 투자전략 또는 상품명 표기 기반. ※ 설명은 검수 필요 상태를 유지하며 상세 편입·분배 조건은 추가 추정하지 않음.
```

<a id="MF-013"></a>

### MF-013 · 하나 파이팅 코리아 (주식)

```yaml
product_id: MF-013
product_name: 하나 파이팅 코리아 (주식)
entity_type: fund_family
product_form: 일반펀드
asset_class:
- 국내주식
strategy_type:
- 국내주식
- 액티브
portfolio_role:
- 국내주식 운용
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L29
- S04:L11-L37
raw_category: 국내주식
share_class: null
source_code: null
management_style:
- 펀드 선택 후 운용사 운용
risk_grade:
  level: null
  source_label: 높은
  scope: 월간 표의 표기. TDF 빈티지·클래스 전체로 확장 금지
irp_investment_limit_pct: null
performance_observations:
- as_of: '2026-08-28'
  unit: '%'
  return_type: 수익률(누적/연환산 명시 없음)
  share_class: null
  vintage_scope: null
  returns_pct:
    1M: 1.45
    3M: -15.24
    1Y: 159.98
    3Y: null
  volatility_1y_pct: 39.64
  source_ref: S04:L29
  quality: MD 표 값. 원본 PDF 대조 미실시.
monthly_recommended: true
recommendation_month: 2026-09
model_portfolio_refs: []
strategy_observations:
- text: 국내주식을 주된 투자대상으로 하는 액티브 주식형 집합투자기구
  quality: 원문 명시
  source_ref: S04:L29
availability:
  source_status: 9월 추천펀드 표 등재
  runtime_verified: false
  candidate_state: FAMILY_CANDIDATE_REQUIRES_VARIANT
  required_checks:
  - 개인형IRP 실제 취급 클래스/빈티지
  - 해당 클래스 위험등급·투자한도
  - 정식 상품명 및 최신 상품조회
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06 고객 질문 Case 3)
deposit_protection: null
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3
- S04:상품별 투자전략
fee_observations: []
classification_note: 원문 투자전략 또는 상품명 표기 기반. ※ 설명은 검수 필요 상태를 유지하며 상세 편입·분배 조건은 추가 추정하지 않음.
```

<a id="MF-014"></a>

### MF-014 · KB 퇴직연금 배당 (주식)

```yaml
product_id: MF-014
product_name: KB 퇴직연금 배당 (주식)
entity_type: fund_family
product_form: 일반펀드
asset_class:
- 국내주식
strategy_type:
- 국내 배당주
- 성장가치
portfolio_role:
- 국내주식 배당전략
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L30
- S04:L11-L37
raw_category: 국내주식
share_class: null
source_code: null
management_style:
- 펀드 선택 후 운용사 운용
risk_grade:
  level: null
  source_label: 높은
  scope: 월간 표의 표기. TDF 빈티지·클래스 전체로 확장 금지
irp_investment_limit_pct: null
performance_observations:
- as_of: '2026-08-28'
  unit: '%'
  return_type: 수익률(누적/연환산 명시 없음)
  share_class: null
  vintage_scope: null
  returns_pct:
    1M: 4.73
    3M: -14.64
    1Y: 126.97
    3Y: 208.63
  volatility_1y_pct: 39.86
  source_ref: S04:L30
  quality: MD 표 값. 원본 PDF 대조 미실시.
monthly_recommended: true
recommendation_month: 2026-09
model_portfolio_refs: []
strategy_observations:
- text: 배당수익과 성장가치 주식에 투자하여 장기수익률 극대화 추구 ※
  quality: 판독불확실(원문 ※)
  source_ref: S04:L30
availability:
  source_status: 9월 추천펀드 표 등재
  runtime_verified: false
  candidate_state: FAMILY_CANDIDATE_REQUIRES_VARIANT
  required_checks:
  - 개인형IRP 실제 취급 클래스/빈티지
  - 해당 클래스 위험등급·투자한도
  - 정식 상품명 및 최신 상품조회
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06 고객 질문 Case 3)
deposit_protection: null
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3
- S04:상품별 투자전략
fee_observations: []
classification_note: 원문 투자전략 또는 상품명 표기 기반. ※ 설명은 검수 필요 상태를 유지하며 상세 편입·분배 조건은 추가 추정하지 않음.
```

<a id="MF-015"></a>

### MF-015 · 키움 더드림 단기채 (채권)

```yaml
product_id: MF-015
product_name: 키움 더드림 단기채 (채권)
entity_type: fund_family
product_form: 일반펀드
asset_class:
- 국내채권
strategy_type:
- 단기채
portfolio_role:
- 저변동 추구
- 대기자금 운용 검토(손실감내 확인)
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L31
- S04:L11-L37
- S04:L161
- S04:L172
raw_category: 국내채권
share_class: null
source_code: null
management_style:
- 펀드 선택 후 운용사 운용
risk_grade:
  level: null
  source_label: 매우낮은
  scope: 월간 표의 표기. TDF 빈티지·클래스 전체로 확장 금지
irp_investment_limit_pct: null
performance_observations:
- as_of: '2026-08-28'
  unit: '%'
  return_type: 수익률(누적/연환산 명시 없음)
  share_class: null
  vintage_scope: null
  returns_pct:
    1M: 0.37
    3M: 0.78
    1Y: 2.39
    3Y: 11.49
  volatility_1y_pct: 0.32
  source_ref: S04:L31
  quality: MD 표 값. 원본 PDF 대조 미실시.
monthly_recommended: true
recommendation_month: 2026-09
model_portfolio_refs:
- MODEL-002
- MODEL-003
strategy_observations:
- text: 금리변동위험 최소화하며 채권이자 및 매매차익 추구 ※
  quality: 판독불확실(원문 ※)
  source_ref: S04:L31
- text: 국내 단기채권 및 CP 등에 60% 이상을 투자하여 안정적인 이자수익 추구
  quality: 원문 명시
  source_ref: S04:L161
- text: 국내 단기채권 및 CP 등에 60% 이상을 투자하여 안정적인 이자수익 추구
  quality: 원문 명시
  source_ref: S04:L172
availability:
  source_status: 9월 추천펀드 표 등재
  runtime_verified: false
  candidate_state: FAMILY_CANDIDATE_REQUIRES_VARIANT
  required_checks:
  - 개인형IRP 실제 취급 클래스/빈티지
  - 해당 클래스 위험등급·투자한도
  - 정식 상품명 및 최신 상품조회
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06 고객 질문 Case 3)
deposit_protection: null
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3
- S04:상품별 투자전략
fee_observations:
- fee_type: 합성총보수
  annual_pct: 0.299
  share_class: null
  source_ref: S04:L161
  note: 모델 표 약칭의 보수. 특정 클래스에 전파하지 않음.
- fee_type: 합성총보수
  annual_pct: 0.299
  share_class: null
  source_ref: S04:L172
  note: 모델 표 약칭의 보수. 특정 클래스에 전파하지 않음.
source_aliases:
- 키움 더드림 단기채
related_class_candidates:
- FND-001
```

<a id="MF-016"></a>

### MF-016 · 한국투자 크레딧 포커스 ESG (채권)

```yaml
product_id: MF-016
product_name: 한국투자 크레딧 포커스 ESG (채권)
entity_type: fund_family
product_form: 일반펀드
asset_class:
- 국내채권
strategy_type:
- 크레딧
- 중단기 우량채권
- ESG
portfolio_role:
- 채권 운용
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L32
- S04:L11-L37
raw_category: 국내채권
share_class: null
source_code: null
management_style:
- 펀드 선택 후 운용사 운용
risk_grade:
  level: null
  source_label: 낮은
  scope: 월간 표의 표기. TDF 빈티지·클래스 전체로 확장 금지
irp_investment_limit_pct: null
performance_observations:
- as_of: '2026-08-28'
  unit: '%'
  return_type: 수익률(누적/연환산 명시 없음)
  share_class: null
  vintage_scope: null
  returns_pct:
    1M: 0.91
    3M: 1.15
    1Y: 1.25
    3Y: 14.57
  volatility_1y_pct: 1.58
  source_ref: S04:L32
  quality: MD 표 값. 원본 PDF 대조 미실시.
monthly_recommended: true
recommendation_month: 2026-09
model_portfolio_refs: []
strategy_observations:
- text: ESG등급이 우수한 중단기 우량채권에 투자, 지속가능한 초과수익 추구
  quality: 원문 명시
  source_ref: S04:L32
availability:
  source_status: 9월 추천펀드 표 등재
  runtime_verified: false
  candidate_state: FAMILY_CANDIDATE_REQUIRES_VARIANT
  required_checks:
  - 개인형IRP 실제 취급 클래스/빈티지
  - 해당 클래스 위험등급·투자한도
  - 정식 상품명 및 최신 상품조회
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06 고객 질문 Case 3)
deposit_protection: null
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3
- S04:상품별 투자전략
fee_observations: []
related_class_candidates:
- FND-003
```

<a id="MF-017"></a>

### MF-017 · 교보악사 Tomorrow 장기우량K-1호 (채권)

```yaml
product_id: MF-017
product_name: 교보악사 Tomorrow 장기우량K-1호 (채권)
entity_type: fund_family
product_form: 일반펀드
asset_class:
- 국내채권
strategy_type:
- 장기우량채
portfolio_role:
- 이자수익 및 자본이득 추구
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L33
- S04:L11-L37
- S04:L194
raw_category: 국내채권
share_class: null
source_code: null
management_style:
- 펀드 선택 후 운용사 운용
risk_grade:
  level: null
  source_label: 낮은
  scope: 월간 표의 표기. TDF 빈티지·클래스 전체로 확장 금지
irp_investment_limit_pct: null
performance_observations:
- as_of: '2026-08-28'
  unit: '%'
  return_type: 수익률(누적/연환산 명시 없음)
  share_class: null
  vintage_scope: null
  returns_pct:
    1M: 0.95
    3M: -0.2
    1Y: -5.51
    3Y: 8.05
  volatility_1y_pct: 3.78
  source_ref: S04:L33
  quality: MD 표 값. 원본 PDF 대조 미실시.
monthly_recommended: true
recommendation_month: 2026-09
model_portfolio_refs:
- MODEL-005
strategy_observations:
- text: 안정성이 높은 채권을 주된 투자대상자산으로 안정적인 이자 수익 추구
  quality: 원문 명시
  source_ref: S04:L33
- text: 국공채, 통안채, 공사채, 은행채, 우량회사채 등 안정성이 높은 채권을 투자대상자산으로 하여 자본이득과 안정적인 이자 수익 추구
  quality: 원문 명시
  source_ref: S04:L194
availability:
  source_status: 9월 추천펀드 표 등재
  runtime_verified: false
  candidate_state: FAMILY_CANDIDATE_REQUIRES_VARIANT
  required_checks:
  - 개인형IRP 실제 취급 클래스/빈티지
  - 해당 클래스 위험등급·투자한도
  - 정식 상품명 및 최신 상품조회
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06 고객 질문 Case 3)
deposit_protection: null
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3
- S04:상품별 투자전략
fee_observations:
- fee_type: 총보수
  annual_pct: 0.33
  share_class: null
  source_ref: S04:L194
  note: 모델 표 약칭의 보수. 특정 클래스에 전파하지 않음.
quality_note: 낮은 위험 표기만으로 단기채·원금보장 대안으로 취급하지 않음.
source_aliases:
- 교보악사 Tomorrow 장기우량K-1
```

<a id="MF-018"></a>

### MF-018 · 한화 내일받는 단기국공채

```yaml
product_id: MF-018
product_name: 한화 내일받는 단기국공채
entity_type: fund_family
product_form: 일반펀드
asset_class:
- 국내채권
strategy_type:
- 단기국공채
portfolio_role:
- 저변동 추구
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L150
- S04:L209
- S04:L222
raw_category: 국내채권
share_class: null
source_code: null
risk_grade: null
irp_investment_limit_pct: null
management_style:
- 펀드 선택 후 운용사 운용
performance_observations: []
monthly_recommended: false
recommendation_month: 2026-09
model_portfolio_refs:
- MODEL-001
- MODEL-006
- MODEL-007
strategy_observations:
- text: 무위험 채권 및 특수채, 우량채에 투자하며, 채권잔존만기를 6개월 수준으로 유지하여 채권가격 변동위험 최소화
  quality: 원문 명시
  source_ref: S04:L150
- text: 무위험 채권 및 특수채, 우량채에 투자하며, 채권잔존만기를 6개월 수준으로 유지하여 채권가격 변동위험 최소화
  quality: 원문 명시
  source_ref: S04:L209
- text: 무위험 채권 및 특수채, 우량채에 투자하며, 채권잔존만기를 6개월 수준으로 유지하여 채권가격 변동위험 최소화
  quality: 원문 명시
  source_ref: S04:L222
fee_observations:
- fee_type: 합성총보수
  annual_pct: 0.1977
  share_class: null
  source_ref: S04:L150
  note: 모델 표 약칭의 보수. 특정 클래스에 전파하지 않음.
- fee_type: 합성총보수
  annual_pct: 0.1977
  share_class: null
  source_ref: S04:L209
  note: 모델 표 약칭의 보수. 특정 클래스에 전파하지 않음.
- fee_type: 합성총보수
  annual_pct: 0.1977
  share_class: null
  source_ref: S04:L222
  note: 모델 표 약칭의 보수. 특정 클래스에 전파하지 않음.
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06 고객 질문 Case 3)
deposit_protection: null
availability:
  source_status: 9월 모델 포트폴리오 구성상품
  runtime_verified: false
  candidate_state: FAMILY_CANDIDATE_REQUIRES_VARIANT
  required_checks:
  - 정식 클래스·개인형IRP 취급 확인
  - 위험등급·운용가능비율
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3
- S04:L150
related_class_candidates:
- FND-004
classification_note: 원문 투자전략 또는 상품명 표기 기반. ※ 설명은 검수 필요 상태를 유지하며 상세 편입·분배 조건은 추가 추정하지 않음.
```

<a id="MF-019"></a>

### MF-019 · 유진 챔피언 단기채

```yaml
product_id: MF-019
product_name: 유진 챔피언 단기채
entity_type: fund_family
product_form: 일반펀드
asset_class:
- 국내채권
strategy_type:
- 단기채
- 전단채
- 기업어음
portfolio_role:
- 저변동 추구
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L151
- S04:L223
raw_category: 국내채권
share_class: null
source_code: null
risk_grade: null
irp_investment_limit_pct: null
management_style:
- 펀드 선택 후 운용사 운용
performance_observations: []
monthly_recommended: false
recommendation_month: 2026-09
model_portfolio_refs:
- MODEL-001
- MODEL-007
strategy_observations:
- text: 잔존만기가 짧은 전단채 및 기업어음에 주로 투자하여 금리변동 리스크 관리
  quality: 원문 명시
  source_ref: S04:L151
- text: 잔존만기가 짧은 전단채 및 기업어음에 주로 투자하여 금리변동 리스크 관리
  quality: 원문 명시
  source_ref: S04:L223
fee_observations:
- fee_type: 합성총보수
  annual_pct: 0.329
  share_class: null
  source_ref: S04:L151
  note: 모델 표 약칭의 보수. 특정 클래스에 전파하지 않음.
- fee_type: 합성총보수
  annual_pct: 0.329
  share_class: null
  source_ref: S04:L223
  note: 모델 표 약칭의 보수. 특정 클래스에 전파하지 않음.
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06 고객 질문 Case 3)
deposit_protection: null
availability:
  source_status: 9월 모델 포트폴리오 구성상품
  runtime_verified: false
  candidate_state: FAMILY_CANDIDATE_REQUIRES_VARIANT
  required_checks:
  - 정식 클래스·개인형IRP 취급 확인
  - 위험등급·운용가능비율
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3
- S04:L151
related_class_candidates:
- FND-009
classification_note: 원문 투자전략 또는 상품명 표기 기반. ※ 설명은 검수 필요 상태를 유지하며 상세 편입·분배 조건은 추가 추정하지 않음.
```

<a id="MF-020"></a>

### MF-020 · KB 스타 단기국공채

```yaml
product_id: MF-020
product_name: KB 스타 단기국공채
entity_type: fund_family
product_form: 일반펀드
asset_class:
- 국내채권
strategy_type:
- 단기국공채
- 우량회사채
portfolio_role:
- 저변동 추구
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L152
raw_category: 국내채권
share_class: null
source_code: null
risk_grade: null
irp_investment_limit_pct: null
management_style:
- 펀드 선택 후 운용사 운용
performance_observations: []
monthly_recommended: false
recommendation_month: 2026-09
model_portfolio_refs:
- MODEL-001
strategy_observations:
- text: 단기 국채, 지방채, 특수채 및 우량 회사채에 투자하여 안정적인 수익 추구
  quality: 원문 명시
  source_ref: S04:L152
fee_observations:
- fee_type: 총보수
  annual_pct: 0.243
  share_class: null
  source_ref: S04:L152
  note: 모델 표 약칭의 보수. 특정 클래스에 전파하지 않음.
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06 고객 질문 Case 3)
deposit_protection: null
availability:
  source_status: 9월 모델 포트폴리오 구성상품
  runtime_verified: false
  candidate_state: FAMILY_CANDIDATE_REQUIRES_VARIANT
  required_checks:
  - 정식 클래스·개인형IRP 취급 확인
  - 위험등급·운용가능비율
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3
- S04:L152
classification_note: 원문 투자전략 또는 상품명 표기 기반. ※ 설명은 검수 필요 상태를 유지하며 상세 편입·분배 조건은 추가 추정하지 않음.
```

<a id="MF-021"></a>

### MF-021 · KB 글로벌 단기채(H)

```yaml
product_id: MF-021
product_name: KB 글로벌 단기채(H)
entity_type: fund_family
product_form: 일반펀드
asset_class:
- 해외채권
strategy_type:
- 글로벌 달러표시 단기채
- H 표기
portfolio_role:
- 해외채권 분산
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L162
- S04:L210
raw_category: 해외채권
share_class: null
source_code: null
risk_grade: null
irp_investment_limit_pct: null
management_style:
- 펀드 선택 후 운용사 운용
performance_observations: []
monthly_recommended: false
recommendation_month: 2026-09
model_portfolio_refs:
- MODEL-002
- MODEL-006
strategy_observations:
- text: 전세계 달러표시 단기채권에 투자하여 안정적 수익 추구
  quality: 원문 명시
  source_ref: S04:L162
- text: 전세계 달러표시 단기채권에 투자하여 안정적 수익 추구
  quality: 원문 명시
  source_ref: S04:L210
fee_observations:
- fee_type: 합성총보수
  annual_pct: 0.696
  share_class: null
  source_ref: S04:L162
  note: 모델 표 약칭의 보수. 특정 클래스에 전파하지 않음.
- fee_type: 합성총보수
  annual_pct: 0.696
  share_class: null
  source_ref: S04:L210
  note: 모델 표 약칭의 보수. 특정 클래스에 전파하지 않음.
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06 고객 질문 Case 3)
deposit_protection: null
availability:
  source_status: 9월 모델 포트폴리오 구성상품
  runtime_verified: false
  candidate_state: FAMILY_CANDIDATE_REQUIRES_VARIANT
  required_checks:
  - 정식 클래스·개인형IRP 취급 확인
  - 위험등급·운용가능비율
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3
- S04:L162
related_class_candidates:
- FND-005
classification_note: 원문 투자전략 또는 상품명 표기 기반. ※ 설명은 검수 필요 상태를 유지하며 상세 편입·분배 조건은 추가 추정하지 않음.
```

<a id="MF-022"></a>

### MF-022 · AB글로벌고수익

```yaml
product_id: MF-022
product_name: AB글로벌고수익
entity_type: fund_family
product_form: 일반펀드
asset_class:
- 해외채권
strategy_type:
- 하이일드
- 미국·이머징 기업채
portfolio_role:
- 고수익 채권전략
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L163
- S04:L211
raw_category: 해외채권
share_class: null
source_code: null
risk_grade: null
irp_investment_limit_pct: null
management_style:
- 펀드 선택 후 운용사 운용
performance_observations: []
monthly_recommended: false
recommendation_month: 2026-09
model_portfolio_refs:
- MODEL-002
- MODEL-006
strategy_observations:
- text: 미국 및 이머징국가 기업발행 하이일드 채권에 주로 투자하여 초과 수익 추구
  quality: 원문 명시
  source_ref: S04:L163
- text: 미국 및 이머징국가 기업발행 하이일드 채권에 주로 투자하여 초과 수익 추구
  quality: 원문 명시
  source_ref: S04:L211
fee_observations:
- fee_type: 합성총보수
  annual_pct: 1.367
  share_class: null
  source_ref: S04:L163
  note: 모델 표 약칭의 보수. 특정 클래스에 전파하지 않음.
- fee_type: 합성총보수
  annual_pct: 1.367
  share_class: null
  source_ref: S04:L211
  note: 모델 표 약칭의 보수. 특정 클래스에 전파하지 않음.
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06 고객 질문 Case 3)
deposit_protection: null
availability:
  source_status: 9월 모델 포트폴리오 구성상품
  runtime_verified: false
  candidate_state: FAMILY_CANDIDATE_REQUIRES_VARIANT
  required_checks:
  - 정식 클래스·개인형IRP 취급 확인
  - 위험등급·운용가능비율
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3
- S04:L163
related_class_candidates:
- FND-006
classification_note: 원문 투자전략 또는 상품명 표기 기반. ※ 설명은 검수 필요 상태를 유지하며 상세 편입·분배 조건은 추가 추정하지 않음.
```

<a id="MF-023"></a>

### MF-023 · NH-Amundi 하나로단기채

```yaml
product_id: MF-023
product_name: NH-Amundi 하나로단기채
entity_type: fund_family
product_form: 일반펀드
asset_class:
- 국내채권
strategy_type:
- 단기회사채
- 기업어음
portfolio_role:
- 저변동 추구
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L183
raw_category: 국내채권
share_class: null
source_code: null
risk_grade: null
irp_investment_limit_pct: null
management_style:
- 펀드 선택 후 운용사 운용
performance_observations: []
monthly_recommended: false
recommendation_month: 2026-09
model_portfolio_refs:
- MODEL-004
strategy_observations:
- text: 단기 회사채 및 기업어음에 주로 투자하여 시중금리 대비 초과수익을 추구
  quality: 원문 명시
  source_ref: S04:L183
fee_observations:
- fee_type: 합성총보수
  annual_pct: 0.2839
  share_class: null
  source_ref: S04:L183
  note: 모델 표 약칭의 보수. 특정 클래스에 전파하지 않음.
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06 고객 질문 Case 3)
deposit_protection: null
availability:
  source_status: 9월 모델 포트폴리오 구성상품
  runtime_verified: false
  candidate_state: FAMILY_CANDIDATE_REQUIRES_VARIANT
  required_checks:
  - 정식 클래스·개인형IRP 취급 확인
  - 위험등급·운용가능비율
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3
- S04:L183
classification_note: 원문 투자전략 또는 상품명 표기 기반. ※ 설명은 검수 필요 상태를 유지하며 상세 편입·분배 조건은 추가 추정하지 않음.
```

<a id="MF-024"></a>

### MF-024 · 신한누버거버먼 미국가치주(H)

```yaml
product_id: MF-024
product_name: 신한누버거버먼 미국가치주(H)
entity_type: fund_family
product_form: 일반펀드
asset_class:
- 해외주식
strategy_type:
- 미국 가치주
- H 표기
portfolio_role:
- 미국주식 운용
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L185
raw_category: 해외주식
share_class: null
source_code: null
risk_grade: null
irp_investment_limit_pct: null
management_style:
- 펀드 선택 후 운용사 운용
performance_observations: []
monthly_recommended: false
recommendation_month: 2026-09
model_portfolio_refs:
- MODEL-004
strategy_observations:
- text: 미국 가치주 등에 주로 투자하는 누버거버먼 미국 라지캡밸류펀드에 투자하는 주식형 펀드
  quality: 원문 명시
  source_ref: S04:L185
fee_observations:
- fee_type: 합성총보수
  annual_pct: 1.61
  share_class: null
  source_ref: S04:L185
  note: 모델 표 약칭의 보수. 특정 클래스에 전파하지 않음.
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06 고객 질문 Case 3)
deposit_protection: null
availability:
  source_status: 9월 모델 포트폴리오 구성상품
  runtime_verified: false
  candidate_state: FAMILY_CANDIDATE_REQUIRES_VARIANT
  required_checks:
  - 정식 클래스·개인형IRP 취급 확인
  - 위험등급·운용가능비율
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3
- S04:L185
related_class_candidates:
- FND-007
classification_note: 원문 투자전략 또는 상품명 표기 기반. ※ 설명은 검수 필요 상태를 유지하며 상세 편입·분배 조건은 추가 추정하지 않음.
```

<a id="MF-025"></a>

### MF-025 · 삼성글로벌 배당성장주(H)

```yaml
product_id: MF-025
product_name: 삼성글로벌 배당성장주(H)
entity_type: fund_family
product_form: 일반펀드
asset_class:
- 해외주식
strategy_type:
- 글로벌 배당성장
- H 표기
portfolio_role:
- 해외주식 배당전략
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L196
raw_category: 해외주식
share_class: null
source_code: null
risk_grade: null
irp_investment_limit_pct: null
management_style:
- 펀드 선택 후 운용사 운용
performance_observations: []
monthly_recommended: false
recommendation_month: 2026-09
model_portfolio_refs:
- MODEL-005
strategy_observations:
- text: 지속적으로 배당이 증가하는 선진국 중심의 배당성장주 및 밸류에이션 매력이 높은 고배당기업에 투자
  quality: 원문 명시
  source_ref: S04:L196
fee_observations:
- fee_type: 합성총보수
  annual_pct: 1.4213
  share_class: null
  source_ref: S04:L196
  note: 모델 표 약칭의 보수. 특정 클래스에 전파하지 않음.
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06 고객 질문 Case 3)
deposit_protection: null
availability:
  source_status: 9월 모델 포트폴리오 구성상품
  runtime_verified: false
  candidate_state: FAMILY_CANDIDATE_REQUIRES_VARIANT
  required_checks:
  - 정식 클래스·개인형IRP 취급 확인
  - 위험등급·운용가능비율
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3
- S04:L196
related_class_candidates:
- FND-008
classification_note: 원문 투자전략 또는 상품명 표기 기반. ※ 설명은 검수 필요 상태를 유지하며 상세 편입·분배 조건은 추가 추정하지 않음.
```

<a id="MF-026"></a>

### MF-026 · 우리 단기채권

```yaml
product_id: MF-026
product_name: 우리 단기채권
entity_type: fund_family
product_form: 일반펀드
asset_class:
- 국내채권
strategy_type:
- 단기채
- 전단채
- 기업어음
portfolio_role:
- 저변동 추구
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L224
raw_category: 국내채권
share_class: null
source_code: null
risk_grade: null
irp_investment_limit_pct: null
management_style:
- 펀드 선택 후 운용사 운용
performance_observations: []
monthly_recommended: false
recommendation_month: 2026-09
model_portfolio_refs:
- MODEL-007
strategy_observations:
- text: 잔존만기 6개월 수준인 전단채 및 기업어음에 주로 투자하여 금리변동 리스크 관리
  quality: 원문 명시
  source_ref: S04:L224
fee_observations:
- fee_type: 합성총보수
  annual_pct: 0.3398
  share_class: null
  source_ref: S04:L224
  note: 모델 표 약칭의 보수. 특정 클래스에 전파하지 않음.
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06 고객 질문 Case 3)
deposit_protection: null
availability:
  source_status: 9월 모델 포트폴리오 구성상품
  runtime_verified: false
  candidate_state: FAMILY_CANDIDATE_REQUIRES_VARIANT
  required_checks:
  - 정식 클래스·개인형IRP 취급 확인
  - 위험등급·운용가능비율
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3
- S04:L224
classification_note: 원문 투자전략 또는 상품명 표기 기반. ※ 설명은 검수 필요 상태를 유지하며 상세 편입·분배 조건은 추가 추정하지 않음.
```


## 8. B01 선별 ETF 10개

<a id="ETF-001"></a>

### ETF-001 · KODEX 단기채권PLUS

```yaml
product_id: ETF-001
product_name: KODEX 단기채권PLUS
entity_type: individual_product
product_form: ETF
asset_class:
- 국내채권
strategy_type:
- 단기채
portfolio_role:
- 저변동 추구
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S05:L44
- S05:L1-L10
- E06:ETF/TDF 소개·고객 질문 Case 3·4
source_code: K55105B00244
source_row_no: 27
provider_name: 삼성
raw_domestic_foreign: 국내
raw_type: ETF_채권형
inception_date: '2015-03-02'
management_style:
- 고객이 ETF 선택
risk_grade:
  level: 6
  source_label: 매우낮은위험
irp_investment_limit_pct: 100.0
performance_observations:
- as_of: null
  as_of_status: 원문 기준일 미기재
  unit: '%'
  return_type: 기간(누적)수익률
  returns_pct:
    1M: 0.22
    3M: 0.67
    6M: 1.17
    1Y: 2.26
    2Y: 5.59
    3Y: 9.61
    5Y: 14.29
    7Y: 16.36
    10Y: 21.98
    연초 이후: 1.59
    설정 이후: 25.12
  volatility_1y_pct: 0.24
  quality: MD에서 빈 셀 복원. 선택 행에 ※ 없음; 원본 대조 미실시.
  display_policy: 자료값 보존. 표시 시 기준일 미확인 병기; 현재 성과·기간 간 우열 판단에 사용하지 않음.
  source_ref: S05:L44
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06)
deposit_protection: null
monthly_recommended: false
model_portfolio_refs: []
classification_detail_source: 상품명·원문 유형 기반 분류 및 E06 일반 설명. 실제 편입자산·정밀 전략 검증 아님.
exposure_tags:
- 단기채권 노출
investment_strategy: 초단기·단기 대기자금 운용 대안의 유형 비교용. 원금보장 아님.
fee_observations: []
availability:
  source_status: 원문상 판매중
  runtime_verified: false
  candidate_state: CONDITIONAL
  required_checks:
  - 고객 투자성향에 허용되는 상품인지
  - 상품별 현재 운용가능비율·매수가능금액
  - 정산·최신 정보 및 실제 판매 여부
batch: B01
batch_selection_reason: 초단기·단기 대기자금 운용 대안의 유형 비교용. 원금보장 아님.
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3·4
- E06:실전문제 Q1~Q3
- E08:1-3 실적배당상품 거래하기
```

<a id="ETF-002"></a>

### ETF-002 · RISE 머니마켓액티브

```yaml
product_id: ETF-002
product_name: RISE 머니마켓액티브
entity_type: individual_product
product_form: ETF
asset_class:
- 국내채권
strategy_type:
- 머니마켓
portfolio_role:
- 저변동 추구
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S05:L40
- S05:L1-L10
- E06:ETF/TDF 소개·고객 질문 Case 3·4
source_code: K55223E22581
source_row_no: 23
provider_name: KB
raw_domestic_foreign: 국내
raw_type: ETF_채권형
inception_date: '2023-05-08'
management_style:
- 고객이 ETF 선택
risk_grade:
  level: 5
  source_label: 낮은위험
irp_investment_limit_pct: 100.0
performance_observations:
- as_of: null
  as_of_status: 원문 기준일 미기재
  unit: '%'
  return_type: 기간(누적)수익률
  returns_pct:
    1M: 0.26
    3M: 0.81
    6M: 1.58
    1Y: 3.0
    2Y: 6.47
    3Y: 11.07
    5Y: null
    7Y: null
    10Y: null
    연초 이후: 2.13
    설정 이후: 12.49
  volatility_1y_pct: 0.11
  quality: MD에서 빈 셀 복원. 선택 행에 ※ 없음; 원본 대조 미실시.
  display_policy: 자료값 보존. 표시 시 기준일 미확인 병기; 현재 성과·기간 간 우열 판단에 사용하지 않음.
  source_ref: S05:L40
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06)
deposit_protection: null
monthly_recommended: false
model_portfolio_refs: []
classification_detail_source: 상품명·원문 유형 기반 분류 및 E06 일반 설명. 실제 편입자산·정밀 전략 검증 아님.
exposure_tags:
- 머니마켓 노출
investment_strategy: 현금성 장기 대기와 상품 운용을 비교할 때 검토. 실제 현금화일은 조회 필요.
fee_observations: []
availability:
  source_status: 원문상 판매중
  runtime_verified: false
  candidate_state: CONDITIONAL
  required_checks:
  - 고객 투자성향에 허용되는 상품인지
  - 상품별 현재 운용가능비율·매수가능금액
  - 정산·최신 정보 및 실제 판매 여부
batch: B01
batch_selection_reason: 현금성 장기 대기와 상품 운용을 비교할 때 검토. 실제 현금화일은 조회 필요.
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3·4
- E06:실전문제 Q1~Q3
- E08:1-3 실적배당상품 거래하기
```

<a id="ETF-003"></a>

### ETF-003 · KODEX 국고채3년

```yaml
product_id: ETF-003
product_name: KODEX 국고채3년
entity_type: individual_product
product_form: ETF
asset_class:
- 국내채권
strategy_type:
- 국고채3년
portfolio_role:
- 국내 국채 운용
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S05:L43
- S05:L1-L10
- E06:ETF/TDF 소개·고객 질문 Case 3·4
source_code: KR5105149383
source_row_no: 26
provider_name: 삼성
raw_domestic_foreign: 국내
raw_type: ETF_채권형
inception_date: '2009-07-28'
management_style:
- 고객이 ETF 선택
risk_grade:
  level: 5
  source_label: 낮은위험
irp_investment_limit_pct: 100.0
performance_observations:
- as_of: null
  as_of_status: 원문 기준일 미기재
  unit: '%'
  return_type: 기간(누적)수익률
  returns_pct:
    1M: 0.16
    3M: 0.75
    6M: -0.29
    1Y: -0.66
    2Y: 3.05
    3Y: 8.48
    5Y: 7.82
    7Y: 9.63
    10Y: 15.82
    연초 이후: 0.14
    설정 이후: 54.88
  volatility_1y_pct: 2.01
  quality: MD에서 빈 셀 복원. 선택 행에 ※ 없음; 원본 대조 미실시.
  display_policy: 자료값 보존. 표시 시 기준일 미확인 병기; 현재 성과·기간 간 우열 판단에 사용하지 않음.
  source_ref: S05:L43
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06)
deposit_protection: null
monthly_recommended: false
model_portfolio_refs: []
classification_detail_source: 상품명·원문 유형 기반 분류 및 E06 일반 설명. 실제 편입자산·정밀 전략 검증 아님.
exposure_tags:
- 국내 국채
investment_strategy: 단기채와 만기 성격이 다른 채권 대안. 최근 수익률만으로 대체하지 않음.
fee_observations: []
availability:
  source_status: 원문상 판매중
  runtime_verified: false
  candidate_state: CONDITIONAL
  required_checks:
  - 고객 투자성향에 허용되는 상품인지
  - 상품별 현재 운용가능비율·매수가능금액
  - 정산·최신 정보 및 실제 판매 여부
batch: B01
batch_selection_reason: 단기채와 만기 성격이 다른 채권 대안. 최근 수익률만으로 대체하지 않음.
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3·4
- E06:실전문제 Q1~Q3
- E08:1-3 실적배당상품 거래하기
```

<a id="ETF-004"></a>

### ETF-004 · KODEX TRF3070

```yaml
product_id: ETF-004
product_name: KODEX TRF3070
entity_type: individual_product
product_form: ETF
asset_class:
- 해외 채권혼합
strategy_type:
- TRF3070
portfolio_role:
- 혼합 분산
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S05:L78
- S05:L1-L10
- E06:ETF/TDF 소개·고객 질문 Case 3·4
source_code: K55105CS1271
source_row_no: 61
provider_name: 삼성
raw_domestic_foreign: 해외
raw_type: ETF_채권혼합형
inception_date: '2019-07-03'
management_style:
- 고객이 ETF 선택
risk_grade:
  level: 5
  source_label: 낮은위험
irp_investment_limit_pct: 100.0
performance_observations:
- as_of: null
  as_of_status: 원문 기준일 미기재
  unit: '%'
  return_type: 기간(누적)수익률
  returns_pct:
    1M: -0.13
    3M: -2.85
    6M: -0.36
    1Y: 2.85
    2Y: 13.02
    3Y: 26.52
    5Y: 26.29
    7Y: 42.27
    10Y: null
    연초 이후: 0.31
    설정 이후: 44.11
  volatility_1y_pct: 3.73
  quality: MD에서 빈 셀 복원. 선택 행에 ※ 없음; 원본 대조 미실시.
  display_policy: 자료값 보존. 표시 시 기준일 미확인 병기; 현재 성과·기간 간 우열 판단에 사용하지 않음.
  source_ref: S05:L78
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06)
deposit_protection: null
monthly_recommended: false
model_portfolio_refs: []
classification_detail_source: 상품명·원문 유형 기반 분류 및 E06 일반 설명. 실제 편입자산·정밀 전략 검증 아님.
exposure_tags:
- 주식·채권 혼합
investment_strategy: 상품명과 원문 채권혼합 유형에 따른 비교 후보. 정확한 자산비중·전략은 설명서 확인.
fee_observations: []
availability:
  source_status: 원문상 판매중
  runtime_verified: false
  candidate_state: CONDITIONAL
  required_checks:
  - 고객 투자성향에 허용되는 상품인지
  - 상품별 현재 운용가능비율·매수가능금액
  - 정산·최신 정보 및 실제 판매 여부
batch: B01
batch_selection_reason: 상품명과 원문 채권혼합 유형에 따른 비교 후보. 정확한 자산비중·전략은 설명서 확인.
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3·4
- E06:실전문제 Q1~Q3
- E08:1-3 실적배당상품 거래하기
```

<a id="ETF-005"></a>

### ETF-005 · RISE 글로벌자산배분액티브

```yaml
product_id: ETF-005
product_name: RISE 글로벌자산배분액티브
entity_type: individual_product
product_form: ETF
asset_class:
- 글로벌 자산배분
strategy_type:
- 글로벌자산배분
- 액티브
portfolio_role:
- 다자산 분산
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S05:L87
- S05:L1-L10
- E06:ETF/TDF 소개·고객 질문 Case 3·4
source_code: K55223E34636
source_row_no: 70
provider_name: KB
raw_domestic_foreign: 해외
raw_type: ETF_재간접형
inception_date: '2023-06-23'
management_style:
- 고객이 ETF 선택
risk_grade:
  level: 4
  source_label: 보통위험
irp_investment_limit_pct: 100.0
performance_observations:
- as_of: null
  as_of_status: 원문 기준일 미기재
  unit: '%'
  return_type: 기간(누적)수익률
  returns_pct:
    1M: 0.37
    3M: -3.88
    6M: -2.32
    1Y: 8.0
    2Y: 24.27
    3Y: 44.74
    5Y: null
    7Y: null
    10Y: null
    연초 이후: 0.08
    설정 이후: 47.83
  volatility_1y_pct: 6.56
  quality: MD에서 빈 셀 복원. 선택 행에 ※ 없음; 원본 대조 미실시.
  display_policy: 자료값 보존. 표시 시 기준일 미확인 병기; 현재 성과·기간 간 우열 판단에 사용하지 않음.
  source_ref: S05:L87
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06)
deposit_protection: null
monthly_recommended: false
model_portfolio_refs: []
classification_detail_source: 상품명·원문 유형 기반 분류 및 E06 일반 설명. 실제 편입자산·정밀 전략 검증 아님.
exposure_tags:
- 글로벌 다자산
investment_strategy: 원문 재간접 유형과 상품명에 기반한 다자산 후보. 정밀 구성·보수는 미확인.
fee_observations: []
availability:
  source_status: 원문상 판매중
  runtime_verified: false
  candidate_state: CONDITIONAL
  required_checks:
  - 고객 투자성향에 허용되는 상품인지
  - 상품별 현재 운용가능비율·매수가능금액
  - 정산·최신 정보 및 실제 판매 여부
batch: B01
batch_selection_reason: 원문 재간접 유형과 상품명에 기반한 다자산 후보. 정밀 구성·보수는 미확인.
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3·4
- E06:실전문제 Q1~Q3
- E08:1-3 실적배당상품 거래하기
```

<a id="ETF-006"></a>

### ETF-006 · RISE 미국S&P500

```yaml
product_id: ETF-006
product_name: RISE 미국S&P500
entity_type: individual_product
product_form: ETF
asset_class:
- 해외주식
strategy_type:
- 미국주식
- S&P500
- 대표지수
portfolio_role:
- 미국주식 장기 운용
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S05:L114
- S05:L1-L10
- E06:ETF/TDF 소개·고객 질문 Case 3·4
source_code: K55223DG4176
source_row_no: 97
provider_name: KB
raw_domestic_foreign: 해외
raw_type: ETF_주식형
inception_date: '2021-04-07'
management_style:
- 고객이 ETF 선택
risk_grade:
  level: 2
  source_label: 높은위험
irp_investment_limit_pct: 70.0
performance_observations:
- as_of: null
  as_of_status: 원문 기준일 미기재
  unit: '%'
  return_type: 기간(누적)수익률
  returns_pct:
    1M: -0.28
    3M: -7.23
    6M: 6.77
    1Y: 17.97
    2Y: 43.88
    3Y: 81.96
    5Y: 110.72
    7Y: null
    10Y: null
    연초 이후: 6.99
    설정 이후: 141.94
  volatility_1y_pct: 13.04
  quality: MD에서 빈 셀 복원. 선택 행에 ※ 없음; 원본 대조 미실시.
  display_policy: 자료값 보존. 표시 시 기준일 미확인 병기; 현재 성과·기간 간 우열 판단에 사용하지 않음.
  source_ref: S05:L114
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06)
deposit_protection: null
monthly_recommended: false
model_portfolio_refs: []
classification_detail_source: 상품명·원문 유형 기반 분류 및 E06 일반 설명. 실제 편입자산·정밀 전략 검증 아님.
exposure_tags:
- 미국 대형주 지수
investment_strategy: 원문 상품명에 따른 대표지수 접근 후보. 고객 전체 미국주식 쏠림 확인.
fee_observations: []
availability:
  source_status: 원문상 판매중
  runtime_verified: false
  candidate_state: CONDITIONAL
  required_checks:
  - 고객 투자성향에 허용되는 상품인지
  - 상품별 현재 운용가능비율·매수가능금액
  - 정산·최신 정보 및 실제 판매 여부
batch: B01
batch_selection_reason: 원문 상품명에 따른 대표지수 접근 후보. 고객 전체 미국주식 쏠림 확인.
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3·4
- E06:실전문제 Q1~Q3
- E08:1-3 실적배당상품 거래하기
```

<a id="ETF-007"></a>

### ETF-007 · KODEX 미국S&P500(H)

```yaml
product_id: ETF-007
product_name: KODEX 미국S&P500(H)
entity_type: individual_product
product_form: ETF
asset_class:
- 해외주식
strategy_type:
- 미국주식
- S&P500
- H 표기
portfolio_role:
- 미국주식 장기 운용
- 환헤지형 비교
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S05:L33
- S05:L1-L10
- E06:ETF/TDF 소개·고객 질문 Case 3·4
source_code: K55105DY7584
source_row_no: 16
provider_name: 삼성
raw_domestic_foreign: 해외
raw_type: ETF_주식형
inception_date: '2022-11-30'
management_style:
- 고객이 ETF 선택
risk_grade:
  level: 3
  source_label: 다소높은위험
irp_investment_limit_pct: 70.0
performance_observations:
- as_of: null
  as_of_status: 원문 기준일 미기재
  unit: '%'
  return_type: 기간(누적)수익률
  returns_pct:
    1M: 3.69
    3M: 1.73
    6M: 10.96
    1Y: 17.09
    2Y: 34.27
    3Y: 63.44
    5Y: null
    7Y: null
    10Y: null
    연초 이후: 10.77
    설정 이후: 79.14
  volatility_1y_pct: 12.34
  quality: MD에서 빈 셀 복원. 선택 행에 ※ 없음; 원본 대조 미실시.
  display_policy: 자료값 보존. 표시 시 기준일 미확인 병기; 현재 성과·기간 간 우열 판단에 사용하지 않음.
  source_ref: S05:L33
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06)
deposit_protection: null
monthly_recommended: false
model_portfolio_refs: []
classification_detail_source: 상품명·원문 유형 기반 분류 및 E06 일반 설명. 실제 편입자산·정밀 전략 검증 아님.
exposure_tags:
- 미국 대형주 지수
investment_strategy: 환헤지 유무를 비교할 때 검토. 환율 전망이나 헤지효과를 확정하지 않음.
fee_observations: []
availability:
  source_status: 원문상 판매중
  runtime_verified: false
  candidate_state: CONDITIONAL
  required_checks:
  - 고객 투자성향에 허용되는 상품인지
  - 상품별 현재 운용가능비율·매수가능금액
  - 정산·최신 정보 및 실제 판매 여부
batch: B01
batch_selection_reason: 환헤지 유무를 비교할 때 검토. 환율 전망이나 헤지효과를 확정하지 않음.
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3·4
- E06:실전문제 Q1~Q3
- E08:1-3 실적배당상품 거래하기
hedge_label: H(원문 상품명 표기; 헤지비율·비용 미확인)
```

<a id="ETF-008"></a>

### ETF-008 · KODEX TDF2030액티브적격

```yaml
product_id: ETF-008
product_name: KODEX TDF2030액티브적격
entity_type: individual_product
product_form: ETF
asset_class:
- 글로벌 자산배분
strategy_type:
- TDF
- '2030'
- 액티브
- 적격 표기
portfolio_role:
- 생애주기 자동조정
- 관리부담 완화
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S05:L89
- S05:L1-L10
- E06:ETF/TDF 소개·고객 질문 Case 3·4
source_code: K55105DT5353
source_row_no: 72
provider_name: 삼성
raw_domestic_foreign: 해외
raw_type: ETF_재간접형
inception_date: '2022-06-28'
management_style:
- 고객이 ETF 선택
- 펀드 내 생애주기 자산배분
risk_grade:
  level: 4
  source_label: 보통위험
irp_investment_limit_pct: 100.0
performance_observations:
- as_of: null
  as_of_status: 원문 기준일 미기재
  unit: '%'
  return_type: 기간(누적)수익률
  returns_pct:
    1M: -0.15
    3M: -4.28
    6M: 1.55
    1Y: 6.12
    2Y: 18.16
    3Y: 35.12
    5Y: null
    7Y: null
    10Y: null
    연초 이후: 3.36
    설정 이후: 47.2
  volatility_1y_pct: 6.54
  quality: MD에서 빈 셀 복원. 선택 행에 ※ 없음; 원본 대조 미실시.
  display_policy: 자료값 보존. 표시 시 기준일 미확인 병기; 현재 성과·기간 간 우열 판단에 사용하지 않음.
  source_ref: S05:L89
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06)
deposit_protection: null
monthly_recommended: false
model_portfolio_refs: []
classification_detail_source: 상품명·원문 유형 기반 분류 및 E06 일반 설명. 실제 편입자산·정밀 전략 검증 아님.
exposure_tags:
- 글로벌 자산배분
investment_strategy: 실제 사용기간과 2030 빈티지를 비교하는 후보. 가까운 시기 자금의 원금보장 대안 아님.
fee_observations: []
availability:
  source_status: 원문상 판매중
  runtime_verified: false
  candidate_state: CONDITIONAL
  required_checks:
  - 고객 투자성향에 허용되는 상품인지
  - 상품별 현재 운용가능비율·매수가능금액
  - 정산·최신 정보 및 실제 판매 여부
batch: B01
batch_selection_reason: 실제 사용기간과 2030 빈티지를 비교하는 후보. 가까운 시기 자금의 원금보장 대안 아님.
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3·4
- E06:실전문제 Q1~Q3
- E08:1-3 실적배당상품 거래하기
vintage: 2030
```

<a id="ETF-009"></a>

### ETF-009 · RISE TDF2050액티브적격

```yaml
product_id: ETF-009
product_name: RISE TDF2050액티브적격
entity_type: individual_product
product_form: ETF
asset_class:
- 글로벌 자산배분
strategy_type:
- TDF
- '2050'
- 액티브
- 적격 표기
portfolio_role:
- 장기 분산
- 관리부담 완화
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S05:L125
- S05:L1-L10
- E06:ETF/TDF 소개·고객 질문 Case 3·4
source_code: K55223DX5255
source_row_no: 108
provider_name: KB
raw_domestic_foreign: 해외
raw_type: ETF_재간접형
inception_date: '2022-09-20'
management_style:
- 고객이 ETF 선택
- 펀드 내 생애주기 자산배분
risk_grade:
  level: 4
  source_label: 보통위험
irp_investment_limit_pct: 100.0
performance_observations:
- as_of: null
  as_of_status: 원문 기준일 미기재
  unit: '%'
  return_type: 기간(누적)수익률
  returns_pct:
    1M: -0.71
    3M: -8.1
    6M: 5.72
    1Y: 21.56
    2Y: 40.9
    3Y: 60.92
    5Y: null
    7Y: null
    10Y: null
    연초 이후: 11.04
    설정 이후: 74.18
  volatility_1y_pct: 11.64
  quality: MD에서 빈 셀 복원. 선택 행에 ※ 없음; 원본 대조 미실시.
  display_policy: 자료값 보존. 표시 시 기준일 미확인 병기; 현재 성과·기간 간 우열 판단에 사용하지 않음.
  source_ref: S05:L125
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06)
deposit_protection: null
monthly_recommended: false
model_portfolio_refs: []
classification_detail_source: 상품명·원문 유형 기반 분류 및 E06 일반 설명. 실제 편입자산·정밀 전략 검증 아님.
exposure_tags:
- 글로벌 자산배분
investment_strategy: 장기간 남겨둘 노후자금의 빈티지 비교 후보. 100% 한도와 실제 위험은 별개.
fee_observations: []
availability:
  source_status: 원문상 판매중
  runtime_verified: false
  candidate_state: CONDITIONAL
  required_checks:
  - 고객 투자성향에 허용되는 상품인지
  - 상품별 현재 운용가능비율·매수가능금액
  - 정산·최신 정보 및 실제 판매 여부
batch: B01
batch_selection_reason: 장기간 남겨둘 노후자금의 빈티지 비교 후보. 100% 한도와 실제 위험은 별개.
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3·4
- E06:실전문제 Q1~Q3
- E08:1-3 실적배당상품 거래하기
vintage: 2050
```

<a id="ETF-010"></a>

### ETF-010 · SOL 미국배당다우존스

```yaml
product_id: ETF-010
product_name: SOL 미국배당다우존스
entity_type: individual_product
product_form: ETF
asset_class:
- 해외주식
strategy_type:
- 미국 배당주
- 배당다우존스
portfolio_role:
- 배당전략 비교
- 해외주식 운용
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S05:L71
- S05:L1-L10
- E06:ETF/TDF 소개·고객 질문 Case 3·4
source_code: KR7446720005
source_row_no: 54
provider_name: 신한
raw_domestic_foreign: 해외
raw_type: ETF_주식형
inception_date: '2022-11-11'
management_style:
- 고객이 ETF 선택
risk_grade:
  level: 3
  source_label: 다소높은위험
irp_investment_limit_pct: 70.0
performance_observations:
- as_of: null
  as_of_status: 원문 기준일 미기재
  unit: '%'
  return_type: 기간(누적)수익률
  returns_pct:
    1M: 0.37
    3M: -2.31
    6M: 6.45
    1Y: 26.89
    2Y: 35.54
    3Y: 59.43
    5Y: null
    7Y: null
    10Y: null
    연초 이후: 21.37
    설정 이후: 57.88
  volatility_1y_pct: 13.06
  quality: MD에서 빈 셀 복원. 선택 행에 ※ 없음; 원본 대조 미실시.
  display_policy: 자료값 보존. 표시 시 기준일 미확인 병기; 현재 성과·기간 간 우열 판단에 사용하지 않음.
  source_ref: S05:L71
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06)
deposit_protection: null
monthly_recommended: false
model_portfolio_refs: []
classification_detail_source: 상품명·원문 유형 기반 분류 및 E06 일반 설명. 실제 편입자산·정밀 전략 검증 아님.
exposure_tags:
- 미국 배당주
investment_strategy: 배당전략을 원하는 고객의 후보. 분배주기·금액·연금지급 기능은 이 목록에서 미확인.
fee_observations: []
availability:
  source_status: 원문상 판매중
  runtime_verified: false
  candidate_state: CONDITIONAL
  required_checks:
  - 고객 투자성향에 허용되는 상품인지
  - 상품별 현재 운용가능비율·매수가능금액
  - 정산·최신 정보 및 실제 판매 여부
batch: B01
batch_selection_reason: 배당전략을 원하는 고객의 후보. 분배주기·금액·연금지급 기능은 이 목록에서 미확인.
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3·4
- E06:실전문제 Q1~Q3
- E08:1-3 실적배당상품 거래하기
```


## 9. B01 선별 일반펀드 클래스 10개

<a id="FND-001"></a>

### FND-001 · 키움더드림단기채증권투자신탁(채권)C-P2E(퇴직연금)

```yaml
product_id: FND-001
product_name: 키움더드림단기채증권투자신탁(채권)C-P2E(퇴직연금)
entity_type: fund_share_class
product_form: 일반펀드
asset_class:
- 국내채권
strategy_type:
- 단기채
portfolio_role:
- 저변동 추구
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S05:L205
- S05:L1-L10
- E06:고객 질문 Case 1·3·4
source_code: null
provider_name: 키움
raw_domestic_foreign: 국내
raw_association_type: 간운법수익증권_채권형
raw_type: 초단기채권
inception_date: '2019-08-22'
management_style:
- 펀드 선택 후 운용사 운용
risk_grade:
  level: 6
  source_label: 매우낮은위험
irp_investment_limit_pct: 100.0
performance_observations:
- as_of: null
  as_of_status: 원문 기준일 미기재
  unit: '%'
  return_type: 기간(누적)수익률
  returns_pct:
    1M: 0.33
    3M: 0.83
    6M: 1.39
    1Y: 2.52
    2Y: 6.55
    3Y: 11.83
    5Y: 18.94
    7Y: 22.96
    10Y: null
    연초 이후: 1.88
    설정 이후: 26.76
  volatility_1y_pct: 0.32
  quality: MD에서 빈 셀 복원. 선택 행에 ※ 없음; 원본 대조 미실시.
  display_policy: 자료값 보존. 표시 시 기준일 미확인 병기; 현재 성과 비교 보류.
  source_ref: S05:L205
related_monthly_family:
  family_ref: MF-015
  relation: 약칭과 본펀드명·유형을 바탕으로 연결한 후보. 월간자료의 클래스 미특정이므로 수익률·보수·위험등급을 병합하지 않음.
monthly_recommended: 본펀드 약칭이 월간 추천에 있음; 해당 클래스 지정 여부 미확인
model_portfolio_refs: []
related_family_model_refs:
- MODEL-002
- MODEL-003
investment_strategy: 연결된 월간 약칭의 전략을 본펀드 수준 참고 설명으로 사용. 특정 클래스의 보수·성과는 이 레코드 자체 값을 사용.
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06)
deposit_protection: null
fee_observations: []
availability:
  source_status: 원문상 판매중
  runtime_verified: false
  candidate_state: CONDITIONAL
  required_checks:
  - 실제 가입채널·클래스
  - 투자성향 적합성·상품별 투자한도
  - 정산 및 현재 판매 여부
batch: B01
batch_selection_reason: 월간 추천·모델 구성 약칭의 실제 클래스 후보 보완
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3·4
- E06:원픽 가이드
- S04:관련 모델 포트폴리오
share_class_label: C-P2E(퇴직연금)
share_class_note: 상품명에서 보존한 클래스 표기. 채널·수수료 우대를 이름만으로 확정하지 않음.
```

<a id="FND-002"></a>

### FND-002 · 우리미국단기채공모주증권자투자신탁1호(H)(채권혼합)CLASSC-PE

```yaml
product_id: FND-002
product_name: 우리미국단기채공모주증권자투자신탁1호(H)(채권혼합)CLASSC-PE
entity_type: fund_share_class
product_form: 일반펀드
asset_class:
- 해외 채권혼합
strategy_type:
- 단기채
- 공모주
- H 표기
portfolio_role:
- 채권 중심 + 공모주 전략
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S05:L267
- S05:L1-L10
- E06:고객 질문 Case 1·3·4
source_code: null
provider_name: 우리
raw_domestic_foreign: 해외
raw_association_type: 간운법수익증권_채권혼합형
raw_type: 북미주식
inception_date: '2024-08-01'
management_style:
- 펀드 선택 후 운용사 운용
risk_grade:
  level: 4
  source_label: 보통위험
irp_investment_limit_pct: 100.0
performance_observations:
- as_of: null
  as_of_status: 원문 기준일 미기재
  unit: '%'
  return_type: 기간(누적)수익률
  returns_pct:
    1M: 0.02
    3M: -0.03
    6M: 0.82
    1Y: 4.25
    2Y: 9.94
    3Y: null
    5Y: null
    7Y: null
    10Y: null
    연초 이후: 2.6
    설정 이후: 9.85
  volatility_1y_pct: 1.7
  quality: MD에서 빈 셀 복원. 선택 행에 ※ 없음; 원본 대조 미실시.
  display_policy: 자료값 보존. 표시 시 기준일 미확인 병기; 현재 성과 비교 보류.
  source_ref: S05:L267
related_monthly_family:
  family_ref: MF-011
  relation: 약칭과 본펀드명·유형을 바탕으로 연결한 후보. 월간자료의 클래스 미특정이므로 수익률·보수·위험등급을 병합하지 않음.
monthly_recommended: 본펀드 약칭이 월간 추천에 있음; 해당 클래스 지정 여부 미확인
model_portfolio_refs: []
related_family_model_refs:
- MODEL-003
- MODEL-004
- MODEL-005
investment_strategy: 연결된 월간 약칭의 전략을 본펀드 수준 참고 설명으로 사용. 특정 클래스의 보수·성과는 이 레코드 자체 값을 사용.
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06)
deposit_protection: null
fee_observations: []
availability:
  source_status: 원문상 판매중
  runtime_verified: false
  candidate_state: CONDITIONAL
  required_checks:
  - 실제 가입채널·클래스
  - 투자성향 적합성·상품별 투자한도
  - 정산 및 현재 판매 여부
batch: B01
batch_selection_reason: 월간 추천·모델 구성 약칭의 실제 클래스 후보 보완
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3·4
- E06:원픽 가이드
- S04:관련 모델 포트폴리오
share_class_label: CLASSC-PE
share_class_note: 상품명에서 보존한 클래스 표기. 채널·수수료 우대를 이름만으로 확정하지 않음.
```

<a id="FND-003"></a>

### FND-003 · 한국투자크레딧포커스ESG증권자투자신탁1호(채권)C-RE

```yaml
product_id: FND-003
product_name: 한국투자크레딧포커스ESG증권자투자신탁1호(채권)C-RE
entity_type: fund_share_class
product_form: 일반펀드
asset_class:
- 국내채권
strategy_type:
- 크레딧
- ESG
portfolio_role:
- 채권운용
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S05:L194
- S05:L1-L10
- E06:고객 질문 Case 1·3·4
source_code: null
provider_name: 한국투자
raw_domestic_foreign: 국내
raw_association_type: 간운법수익증권_채권형
raw_type: 국내채권
inception_date: '2018-09-10'
management_style:
- 펀드 선택 후 운용사 운용
risk_grade:
  level: 5
  source_label: 낮은위험
irp_investment_limit_pct: 100.0
performance_observations:
- as_of: null
  as_of_status: 원문 기준일 미기재
  unit: '%'
  return_type: 기간(누적)수익률
  returns_pct:
    1M: 0.47
    3M: 1.1
    6M: 0.67
    1Y: 1.26
    2Y: 6.71
    3Y: 14.54
    5Y: 19.47
    7Y: 24.63
    10Y: null
    연초 이후: 1.19
    설정 이후: 28.5
  volatility_1y_pct: 1.61
  quality: MD에서 빈 셀 복원. 선택 행에 ※ 없음; 원본 대조 미실시.
  display_policy: 자료값 보존. 표시 시 기준일 미확인 병기; 현재 성과 비교 보류.
  source_ref: S05:L194
related_monthly_family:
  family_ref: MF-016
  relation: 약칭과 본펀드명·유형을 바탕으로 연결한 후보. 월간자료의 클래스 미특정이므로 수익률·보수·위험등급을 병합하지 않음.
monthly_recommended: 본펀드 약칭이 월간 추천에 있음; 해당 클래스 지정 여부 미확인
model_portfolio_refs: []
related_family_model_refs: []
investment_strategy: 연결된 월간 약칭의 전략을 본펀드 수준 참고 설명으로 사용. 특정 클래스의 보수·성과는 이 레코드 자체 값을 사용.
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06)
deposit_protection: null
fee_observations: []
availability:
  source_status: 원문상 판매중
  runtime_verified: false
  candidate_state: CONDITIONAL
  required_checks:
  - 실제 가입채널·클래스
  - 투자성향 적합성·상품별 투자한도
  - 정산 및 현재 판매 여부
batch: B01
batch_selection_reason: 월간 추천·모델 구성 약칭의 실제 클래스 후보 보완
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3·4
- E06:원픽 가이드
- S04:관련 모델 포트폴리오
share_class_label: C-RE
share_class_note: 상품명에서 보존한 클래스 표기. 채널·수수료 우대를 이름만으로 확정하지 않음.
```

<a id="FND-004"></a>

### FND-004 · 한화내일받는단기국공채증권자투자신탁(채권)C-RPE(퇴직연금)

```yaml
product_id: FND-004
product_name: 한화내일받는단기국공채증권자투자신탁(채권)C-RPE(퇴직연금)
entity_type: fund_share_class
product_form: 일반펀드
asset_class:
- 국내채권
strategy_type:
- 단기국공채
portfolio_role:
- 저변동 추구
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S05:L223
- S05:L1-L10
- E06:고객 질문 Case 1·3·4
source_code: null
provider_name: 한화
raw_domestic_foreign: 국내
raw_association_type: 간운법수익증권_채권형
raw_type: 국내채권
inception_date: '2017-08-17'
management_style:
- 펀드 선택 후 운용사 운용
risk_grade:
  level: 6
  source_label: 매우낮은위험
irp_investment_limit_pct: 100.0
performance_observations:
- as_of: null
  as_of_status: 원문 기준일 미기재
  unit: '%'
  return_type: 기간(누적)수익률
  returns_pct:
    1M: 0.22
    3M: 0.76
    6M: 1.35
    1Y: 2.53
    2Y: 5.95
    3Y: 10.18
    5Y: 15.98
    7Y: 18.37
    10Y: null
    연초 이후: 1.84
    설정 이후: 22.74
  volatility_1y_pct: 0.21
  quality: MD에서 빈 셀 복원. 선택 행에 ※ 없음; 원본 대조 미실시.
  display_policy: 자료값 보존. 표시 시 기준일 미확인 병기; 현재 성과 비교 보류.
  source_ref: S05:L223
related_monthly_family:
  family_ref: MF-018
  relation: 약칭과 본펀드명·유형을 바탕으로 연결한 후보. 월간자료의 클래스 미특정이므로 수익률·보수·위험등급을 병합하지 않음.
monthly_recommended: false
model_portfolio_refs: []
related_family_model_refs:
- MODEL-001
- MODEL-006
- MODEL-007
investment_strategy: 연결된 월간 약칭의 전략을 본펀드 수준 참고 설명으로 사용. 특정 클래스의 보수·성과는 이 레코드 자체 값을 사용.
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06)
deposit_protection: null
fee_observations: []
availability:
  source_status: 원문상 판매중
  runtime_verified: false
  candidate_state: CONDITIONAL
  required_checks:
  - 실제 가입채널·클래스
  - 투자성향 적합성·상품별 투자한도
  - 정산 및 현재 판매 여부
batch: B01
batch_selection_reason: 월간 추천·모델 구성 약칭의 실제 클래스 후보 보완
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3·4
- E06:원픽 가이드
- S04:관련 모델 포트폴리오
share_class_label: C-RPE(퇴직연금)
share_class_note: 상품명에서 보존한 클래스 표기. 채널·수수료 우대를 이름만으로 확정하지 않음.
```

<a id="FND-005"></a>

### FND-005 · KB글로벌단기채증권자투자신탁(채권-재간접형)(H)C-퇴직E

```yaml
product_id: FND-005
product_name: KB글로벌단기채증권자투자신탁(채권-재간접형)(H)C-퇴직E
entity_type: fund_share_class
product_form: 일반펀드
asset_class:
- 해외채권
strategy_type:
- 글로벌 단기채
- H 표기
portfolio_role:
- 해외채권 분산
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S05:L255
- S05:L1-L10
- E06:고객 질문 Case 1·3·4
source_code: null
provider_name: KB
raw_domestic_foreign: 해외
raw_association_type: 수익증권_해외채권편입
raw_type: 글로벌채권
inception_date: '2019-12-01'
management_style:
- 펀드 선택 후 운용사 운용
risk_grade:
  level: 5
  source_label: 낮은위험
irp_investment_limit_pct: 70.0
performance_observations:
- as_of: null
  as_of_status: 원문 기준일 미기재
  unit: '%'
  return_type: 기간(누적)수익률
  returns_pct:
    1M: 0.31
    3M: 0.26
    6M: 0.51
    1Y: 1.58
    2Y: 4.41
    3Y: 9.92
    5Y: 2.99
    7Y: null
    10Y: null
    연초 이후: 0.94
    설정 이후: 4.2
  volatility_1y_pct: 0.54
  quality: MD에서 빈 셀 복원. 선택 행에 ※ 없음; 원본 대조 미실시.
  display_policy: 자료값 보존. 표시 시 기준일 미확인 병기; 현재 성과 비교 보류.
  source_ref: S05:L255
related_monthly_family:
  family_ref: MF-021
  relation: 약칭과 본펀드명·유형을 바탕으로 연결한 후보. 월간자료의 클래스 미특정이므로 수익률·보수·위험등급을 병합하지 않음.
monthly_recommended: false
model_portfolio_refs: []
related_family_model_refs:
- MODEL-002
- MODEL-006
investment_strategy: 연결된 월간 약칭의 전략을 본펀드 수준 참고 설명으로 사용. 특정 클래스의 보수·성과는 이 레코드 자체 값을 사용.
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06)
deposit_protection: null
fee_observations: []
availability:
  source_status: 원문상 판매중
  runtime_verified: false
  candidate_state: CONDITIONAL
  required_checks:
  - 실제 가입채널·클래스
  - 투자성향 적합성·상품별 투자한도
  - 정산 및 현재 판매 여부
batch: B01
batch_selection_reason: 월간 추천·모델 구성 약칭의 실제 클래스 후보 보완
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3·4
- E06:원픽 가이드
- S04:관련 모델 포트폴리오
share_class_label: C-퇴직E
share_class_note: 상품명에서 보존한 클래스 표기. 채널·수수료 우대를 이름만으로 확정하지 않음.
```

<a id="FND-006"></a>

### FND-006 · AB글로벌고수익증권투자신탁(채권-재간접형)CE-P2

```yaml
product_id: FND-006
product_name: AB글로벌고수익증권투자신탁(채권-재간접형)CE-P2
entity_type: fund_share_class
product_form: 일반펀드
asset_class:
- 해외채권
strategy_type:
- 하이일드
portfolio_role:
- 고수익 채권 전략
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S05:L253
- S05:L1-L10
- E06:고객 질문 Case 1·3·4
source_code: null
provider_name: AB
raw_domestic_foreign: 해외
raw_association_type: 수익증권_해외채권편입
raw_type: 글로벌하이일드채권
inception_date: '2018-02-27'
management_style:
- 펀드 선택 후 운용사 운용
risk_grade:
  level: 5
  source_label: 낮은위험
irp_investment_limit_pct: 70.0
performance_observations:
- as_of: null
  as_of_status: 원문 기준일 미기재
  unit: '%'
  return_type: 기간(누적)수익률
  returns_pct:
    1M: 0.5
    3M: 0.33
    6M: 0.78
    1Y: 3.08
    2Y: 8.99
    3Y: 20.44
    5Y: 11.38
    7Y: 19.92
    10Y: null
    연초 이후: 1.61
    설정 이후: 24.24
  volatility_1y_pct: 2.5
  quality: MD에서 빈 셀 복원. 선택 행에 ※ 없음; 원본 대조 미실시.
  display_policy: 자료값 보존. 표시 시 기준일 미확인 병기; 현재 성과 비교 보류.
  source_ref: S05:L253
related_monthly_family:
  family_ref: MF-022
  relation: 약칭과 본펀드명·유형을 바탕으로 연결한 후보. 월간자료의 클래스 미특정이므로 수익률·보수·위험등급을 병합하지 않음.
monthly_recommended: false
model_portfolio_refs: []
related_family_model_refs:
- MODEL-002
- MODEL-006
investment_strategy: 연결된 월간 약칭의 전략을 본펀드 수준 참고 설명으로 사용. 특정 클래스의 보수·성과는 이 레코드 자체 값을 사용.
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06)
deposit_protection: null
fee_observations: []
availability:
  source_status: 원문상 판매중
  runtime_verified: false
  candidate_state: CONDITIONAL
  required_checks:
  - 실제 가입채널·클래스
  - 투자성향 적합성·상품별 투자한도
  - 정산 및 현재 판매 여부
batch: B01
batch_selection_reason: 월간 추천·모델 구성 약칭의 실제 클래스 후보 보완
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3·4
- E06:원픽 가이드
- S04:관련 모델 포트폴리오
share_class_label: CE-P2
share_class_note: 상품명에서 보존한 클래스 표기. 채널·수수료 우대를 이름만으로 확정하지 않음.
```

<a id="FND-007"></a>

### FND-007 · 신한누버거버먼미국가치주증권투자신탁(H)(주식-재간접형)C-RE

```yaml
product_id: FND-007
product_name: 신한누버거버먼미국가치주증권투자신탁(H)(주식-재간접형)C-RE
entity_type: fund_share_class
product_form: 일반펀드
asset_class:
- 해외주식
strategy_type:
- 미국 가치주
- H 표기
portfolio_role:
- 미국주식 운용
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S05:L169
- S05:L1-L10
- E06:고객 질문 Case 1·3·4
source_code: null
provider_name: 신한
raw_domestic_foreign: 해외
raw_association_type: 간운법수익증권_주식형
raw_type: 북미주식
inception_date: '2023-01-17'
management_style:
- 펀드 선택 후 운용사 운용
risk_grade:
  level: 4
  source_label: 보통위험
irp_investment_limit_pct: 70.0
performance_observations:
- as_of: null
  as_of_status: 원문 기준일 미기재
  unit: '%'
  return_type: 기간(누적)수익률
  returns_pct:
    1M: 2.67
    3M: 4.06
    6M: 9.34
    1Y: 28.51
    2Y: 35.63
    3Y: 48.58
    5Y: null
    7Y: null
    10Y: null
    연초 이후: 19.16
    설정 이후: 42.8
  volatility_1y_pct: 8.99
  quality: MD에서 빈 셀 복원. 선택 행에 ※ 없음; 원본 대조 미실시.
  display_policy: 자료값 보존. 표시 시 기준일 미확인 병기; 현재 성과 비교 보류.
  source_ref: S05:L169
related_monthly_family:
  family_ref: MF-024
  relation: 약칭과 본펀드명·유형을 바탕으로 연결한 후보. 월간자료의 클래스 미특정이므로 수익률·보수·위험등급을 병합하지 않음.
monthly_recommended: false
model_portfolio_refs: []
related_family_model_refs:
- MODEL-004
investment_strategy: 연결된 월간 약칭의 전략을 본펀드 수준 참고 설명으로 사용. 특정 클래스의 보수·성과는 이 레코드 자체 값을 사용.
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06)
deposit_protection: null
fee_observations: []
availability:
  source_status: 원문상 판매중
  runtime_verified: false
  candidate_state: CONDITIONAL
  required_checks:
  - 실제 가입채널·클래스
  - 투자성향 적합성·상품별 투자한도
  - 정산 및 현재 판매 여부
batch: B01
batch_selection_reason: 월간 추천·모델 구성 약칭의 실제 클래스 후보 보완
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3·4
- E06:원픽 가이드
- S04:관련 모델 포트폴리오
share_class_label: C-RE
share_class_note: 상품명에서 보존한 클래스 표기. 채널·수수료 우대를 이름만으로 확정하지 않음.
```

<a id="FND-008"></a>

### FND-008 · 삼성글로벌배당성장주증권자투자신탁H[주식] CPE(퇴직연금)

```yaml
product_id: FND-008
product_name: 삼성글로벌배당성장주증권자투자신탁H[주식] CPE(퇴직연금)
entity_type: fund_share_class
product_form: 일반펀드
asset_class:
- 해외주식
strategy_type:
- 글로벌 배당성장
- H 표기
portfolio_role:
- 해외주식 운용
- 배당전략 비교
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S05:L166
- S05:L1-L10
- E06:고객 질문 Case 1·3·4
source_code: null
provider_name: 삼성
raw_domestic_foreign: 해외
raw_association_type: 간운법수익증권_주식형
raw_type: 글로벌주식
inception_date: '2022-03-18'
management_style:
- 펀드 선택 후 운용사 운용
risk_grade:
  level: 3
  source_label: 다소높은위험
irp_investment_limit_pct: 70.0
performance_observations:
- as_of: null
  as_of_status: 원문 기준일 미기재
  unit: '%'
  return_type: 기간(누적)수익률
  returns_pct:
    1M: 1.05
    3M: 6.15
    6M: 6.3
    1Y: 20.36
    2Y: 26.12
    3Y: 46.77
    5Y: null
    7Y: null
    10Y: null
    연초 이후: 15.92
    설정 이후: 38.1
  volatility_1y_pct: 8.74
  quality: MD에서 빈 셀 복원. 선택 행에 ※ 없음; 원본 대조 미실시.
  display_policy: 자료값 보존. 표시 시 기준일 미확인 병기; 현재 성과 비교 보류.
  source_ref: S05:L166
related_monthly_family:
  family_ref: MF-025
  relation: 약칭과 본펀드명·유형을 바탕으로 연결한 후보. 월간자료의 클래스 미특정이므로 수익률·보수·위험등급을 병합하지 않음.
monthly_recommended: false
model_portfolio_refs: []
related_family_model_refs:
- MODEL-005
investment_strategy: 연결된 월간 약칭의 전략을 본펀드 수준 참고 설명으로 사용. 특정 클래스의 보수·성과는 이 레코드 자체 값을 사용.
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06)
deposit_protection: null
fee_observations: []
availability:
  source_status: 원문상 판매중
  runtime_verified: false
  candidate_state: CONDITIONAL
  required_checks:
  - 실제 가입채널·클래스
  - 투자성향 적합성·상품별 투자한도
  - 정산 및 현재 판매 여부
batch: B01
batch_selection_reason: 월간 추천·모델 구성 약칭의 실제 클래스 후보 보완
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3·4
- E06:원픽 가이드
- S04:관련 모델 포트폴리오
share_class_label: CPE(퇴직연금)
share_class_note: 상품명에서 보존한 클래스 표기. 채널·수수료 우대를 이름만으로 확정하지 않음.
```

<a id="FND-009"></a>

### FND-009 · 유진챔피언단기채증권자투자신탁(채권)C-PE2

```yaml
product_id: FND-009
product_name: 유진챔피언단기채증권자투자신탁(채권)C-PE2
entity_type: fund_share_class
product_form: 일반펀드
asset_class:
- 국내채권
strategy_type:
- 단기채
portfolio_role:
- 저변동 추구
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S05:L228
- S05:L1-L10
- E06:고객 질문 Case 1·3·4
source_code: null
provider_name: 유진
raw_domestic_foreign: 국내
raw_association_type: 간운법수익증권_채권형
raw_type: 초단기채권
inception_date: '2018-03-12'
management_style:
- 펀드 선택 후 운용사 운용
risk_grade:
  level: 6
  source_label: 매우낮은위험
irp_investment_limit_pct: 100.0
performance_observations:
- as_of: null
  as_of_status: 원문 기준일 미기재
  unit: '%'
  return_type: 기간(누적)수익률
  returns_pct:
    1M: 0.31
    3M: 0.74
    6M: 1.23
    1Y: 2.41
    2Y: 6.21
    3Y: 11.2
    5Y: 17.96
    7Y: 21.27
    10Y: null
    연초 이후: 1.73
    설정 이후: 27.04
  volatility_1y_pct: 0.34
  quality: MD에서 빈 셀 복원. 선택 행에 ※ 없음; 원본 대조 미실시.
  display_policy: 자료값 보존. 표시 시 기준일 미확인 병기; 현재 성과 비교 보류.
  source_ref: S05:L228
related_monthly_family:
  family_ref: MF-019
  relation: 약칭과 본펀드명·유형을 바탕으로 연결한 후보. 월간자료의 클래스 미특정이므로 수익률·보수·위험등급을 병합하지 않음.
monthly_recommended: false
model_portfolio_refs: []
related_family_model_refs:
- MODEL-001
- MODEL-007
investment_strategy: 연결된 월간 약칭의 전략을 본펀드 수준 참고 설명으로 사용. 특정 클래스의 보수·성과는 이 레코드 자체 값을 사용.
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06)
deposit_protection: null
fee_observations: []
availability:
  source_status: 원문상 판매중
  runtime_verified: false
  candidate_state: CONDITIONAL
  required_checks:
  - 실제 가입채널·클래스
  - 투자성향 적합성·상품별 투자한도
  - 정산 및 현재 판매 여부
batch: B01
batch_selection_reason: 월간 추천·모델 구성 약칭의 실제 클래스 후보 보완
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3·4
- E06:원픽 가이드
- S04:관련 모델 포트폴리오
share_class_label: C-PE2
share_class_note: 상품명에서 보존한 클래스 표기. 채널·수수료 우대를 이름만으로 확정하지 않음.
```

<a id="FND-010"></a>

### FND-010 · KB온국민평생소득TIF40증권자투자신탁(채권혼합-재간접)C-퇴직E

```yaml
product_id: FND-010
product_name: KB온국민평생소득TIF40증권자투자신탁(채권혼합-재간접)C-퇴직E
entity_type: fund_share_class
product_form: 일반펀드
asset_class:
- 해외 채권혼합
strategy_type:
- TIF
- 채권혼합
portfolio_role:
- 인컴전략 비교
- 관리부담 완화
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S05:L317
- S05:L1-L10
- E06:고객 질문 Case 1·3·4
source_code: null
provider_name: KB
raw_domestic_foreign: 해외
raw_association_type: 간운법수익증권_채권혼합형
raw_type: 글로벌 보수적자산배분
inception_date: '2018-03-06'
management_style:
- 펀드 선택 후 운용사 운용
risk_grade:
  level: 4
  source_label: 보통위험
irp_investment_limit_pct: 100.0
performance_observations:
- as_of: null
  as_of_status: 원문 기준일 미기재
  unit: '%'
  return_type: 기간(누적)수익률
  returns_pct:
    1M: 0.33
    3M: -1.61
    6M: 0.27
    1Y: 6.1
    2Y: 10.88
    3Y: 22.12
    5Y: 11.84
    7Y: 30.32
    10Y: null
    연초 이후: 3.18
    설정 이후: 35.68
  volatility_1y_pct: 4.9
  quality: MD에서 빈 셀 복원. 선택 행에 ※ 없음; 원본 대조 미실시.
  display_policy: 자료값 보존. 표시 시 기준일 미확인 병기; 현재 성과 비교 보류.
  source_ref: S05:L317
related_monthly_family: null
monthly_recommended: false
model_portfolio_refs: []
related_family_model_refs: []
investment_strategy: 원문 TIF40 상품명과 글로벌 보수적자산배분·채권혼합 유형에 기반한 인컴 운용 비교 후보. 실제 분배주기·수익·지급 방식은 미확인.
principal_protection: 실적배당형 — 원리금보장상품과 구분(E06)
deposit_protection: null
fee_observations: []
availability:
  source_status: 원문상 판매중
  runtime_verified: false
  candidate_state: CONDITIONAL
  required_checks:
  - 실제 가입채널·클래스
  - 투자성향 적합성·상품별 투자한도
  - 정산 및 현재 판매 여부
batch: B01
batch_selection_reason: 연금수령·인컴 상황에 필요한 TIF 유형 보완
mapping_knowledge_refs:
- E06:고객 질문 Case 1·3·4
- E06:원픽 가이드
- S04:관련 모델 포트폴리오
share_class_label: C-퇴직E
share_class_note: 상품명에서 보존한 클래스 표기. 채널·수수료 우대를 이름만으로 확정하지 않음.
```


## 10. 디폴트옵션 포트폴리오

<a id="DO-001"></a>

### DO-001 · 지켜드림

```yaml
product_id: DO-001
product_name: 지켜드림
entity_type: default_option_portfolio
product_form: 디폴트옵션 포트폴리오
asset_class:
- 편입상품별 구성 참조
strategy_type:
- 사전지정운용
portfolio_role:
- 운용공백 대비
- 위험도별 자산배분
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L45-L48
- S04:L87
- E07:디폴트옵션 개념·고객 질문
default_option_risk: 초저위험
risk_grade: null
inception_date: '2022-12-05'
management_style:
- 사전지정운용
- 별도 옵트인/실행절차
irp_investment_limit_pct: null
limit_note: E07 교안의 승인·예외 설명은 참조하되 개별 포트폴리오 운용가능비율은 실제 상품조회로 확인.
investment_strategy: 안전한 자산군만 추구하는 고객님을 위해 시중은행 정기예금으로만 구성된 원리금보장형 포트폴리오
components:
- source_product_name: 신한은행 퇴직연금 디폴트옵션 정기예금(3년)
  source_risk_label: null
  weight_pct: 35.0
  interest_rate_pct: 3.35
  rate_month: 2026-09
  returns_pct:
    1M: null
    3M: null
    6M: null
    1Y: null
  return_as_of: null
  source_ref: S04:L45
  quality: 원문 표 보존
- source_product_name: 기업은행 퇴직연금 디폴트옵션 정기예금(3년)
  source_risk_label: null
  weight_pct: 35.0
  interest_rate_pct: 3.32
  rate_month: 2026-09
  returns_pct:
    1M: null
    3M: null
    6M: null
    1Y: null
  return_as_of: null
  source_ref: S04:L46
  quality: 원문 표 보존
- source_product_name: 하나은행 퇴직연금 디폴트옵션 정기예금(3년)
  source_risk_label: null
  weight_pct: 30.0
  interest_rate_pct: 3.25
  rate_month: 2026-09
  returns_pct:
    1M: null
    3M: null
    6M: null
    1Y: null
  return_as_of: null
  source_ref: S04:L47
  quality: 원문 표 보존
performance_observations:
- as_of: null
  as_of_status: 디폴트옵션 표 성과 기준일 미기재. 1절의 8/28을 자동 전파하지 않음.
  unit: '%'
  return_type: 포트폴리오 수익률(일단위 재투자 가정; 실제 고객 수익률과 다를 수 있음)
  returns_pct:
    1M: 0.27
    3M: 0.77
    6M: 1.44
    1Y: 2.11
  source_ref: S04:L48
  calculation_note_ref: S04:L101
availability:
  source_status: 9월 추천 디폴트옵션 표 등재
  runtime_verified: false
  candidate_state: CONDITIONAL
  required_checks:
  - 최신 투자성향과 포트폴리오 위험도
  - 현재 지정상품과 실제 보유상품 구분
  - 신규입금/최초만기/재만기별 실행조건
  - 옵트인·변경 가능 여부
principal_protection: 자료상 정기예금으로만 구성
deposit_protection: 개별 구성상품별로 확인; 포트폴리오에 단일 보호 여부를 부여하지 않음.
recommended_by_kb:
  default_option_material: true
  month: 2026-09
mapping_knowledge_refs:
- E07:입금예정상품 vs 디폴트옵션
- E07:활용 마케팅 Tip·고객 질문
- S04:상품특징
```

<a id="DO-002"></a>

### DO-002 · 알파드림

```yaml
product_id: DO-002
product_name: 알파드림
entity_type: default_option_portfolio
product_form: 디폴트옵션 포트폴리오
asset_class:
- 편입상품별 구성 참조
strategy_type:
- 사전지정운용
portfolio_role:
- 운용공백 대비
- 위험도별 자산배분
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L49-L52
- S04:L88
- E07:디폴트옵션 개념·고객 질문
default_option_risk: 저위험
risk_grade: null
inception_date: '2022-12-05'
management_style:
- 사전지정운용
- 별도 옵트인/실행절차
irp_investment_limit_pct: null
limit_note: E07 교안의 승인·예외 설명은 참조하되 개별 포트폴리오 운용가능비율은 실제 상품조회로 확인.
investment_strategy: '"정기예금+" 수준의 수익률을 기대하는 고객님을 위해 시중은행 정기예금 70, TDF 30 투자하는 포트폴리오'
components:
- source_product_name: '***수협은행 노후보장 정기예금 디폴트전용 (3년)'
  source_risk_label: null
  weight_pct: 70.0
  interest_rate_pct: 3.3
  rate_month: 2026-09
  returns_pct:
    1M: null
    3M: null
    6M: null
    1Y: null
  return_as_of: null
  source_ref: S04:L49
  quality: 원문 표 보존
- source_product_name: 키움키움드림적격TDF2030 ※
  source_risk_label: 다소높은
  weight_pct: 20.0
  interest_rate_pct: null
  rate_month: null
  returns_pct:
    1M: -0.99
    3M: -8.32
    6M: 1.67
    1Y: 10.17
  return_as_of: null
  source_ref: S04:L50
  quality: 상품명 판독불확실(※)
- source_product_name: 삼성글로벌EMP적격TDF2035
  source_risk_label: 보통
  weight_pct: 10.0
  interest_rate_pct: null
  rate_month: null
  returns_pct:
    1M: 0.96
    3M: -4.07
    6M: 4.3
    1Y: 12.97
  return_as_of: null
  source_ref: S04:L51
  quality: 원문 표 보존
performance_observations:
- as_of: null
  as_of_status: 디폴트옵션 표 성과 기준일 미기재. 1절의 8/28을 자동 전파하지 않음.
  unit: '%'
  return_type: 포트폴리오 수익률(일단위 재투자 가정; 실제 고객 수익률과 다를 수 있음)
  returns_pct:
    1M: 0.09
    3M: -1.52
    6M: 1.81
    1Y: 4.92
  source_ref: S04:L52
  calculation_note_ref: S04:L101
availability:
  source_status: 9월 추천 디폴트옵션 표 등재
  runtime_verified: false
  candidate_state: CONDITIONAL
  required_checks:
  - 최신 투자성향과 포트폴리오 위험도
  - 현재 지정상품과 실제 보유상품 구분
  - 신규입금/최초만기/재만기별 실행조건
  - 옵트인·변경 가능 여부
principal_protection: 실적배당상품 포함 — 포트폴리오 전체 원금보장으로 안내하지 않음
deposit_protection: 개별 구성상품별로 확인; 포트폴리오에 단일 보호 여부를 부여하지 않음.
recommended_by_kb:
  default_option_material: true
  month: 2026-09
mapping_knowledge_refs:
- E07:입금예정상품 vs 디폴트옵션
- E07:활용 마케팅 Tip·고객 질문
- S04:상품특징
```

<a id="DO-003"></a>

### DO-003 · 알파드림II

```yaml
product_id: DO-003
product_name: 알파드림II
entity_type: default_option_portfolio
product_form: 디폴트옵션 포트폴리오
asset_class:
- 편입상품별 구성 참조
strategy_type:
- 사전지정운용
portfolio_role:
- 운용공백 대비
- 위험도별 자산배분
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L53-L56
- S04:L89
- E07:디폴트옵션 개념·고객 질문
default_option_risk: 저위험
risk_grade: null
inception_date: '2023-01-02'
management_style:
- 사전지정운용
- 별도 옵트인/실행절차
irp_investment_limit_pct: null
limit_note: E07 교안의 승인·예외 설명은 참조하되 개별 포트폴리오 운용가능비율은 실제 상품조회로 확인.
investment_strategy: 이자수익과 투자이익 모두를 기대하는 고객님을 위해 시중은행 정기예금 50, TDF 50에 투자하는 포트폴리오
components:
- source_product_name: 기업은행 퇴직연금 디폴트옵션 정기예금(3년)
  source_risk_label: null
  weight_pct: 50.0
  interest_rate_pct: 3.52
  rate_month: 2026-09
  returns_pct:
    1M: null
    3M: null
    6M: null
    1Y: null
  return_as_of: null
  source_ref: S04:L53
  quality: 원문 표 보존
- source_product_name: KB다이나믹적격TDF2030
  source_risk_label: 다소높은
  weight_pct: 40.0
  interest_rate_pct: null
  rate_month: null
  returns_pct:
    1M: 0.16
    3M: -6.59
    6M: 6.61
    1Y: 20.04
  return_as_of: null
  source_ref: S04:L54
  quality: 원문 표 보존
- source_product_name: NH하나로적격TDF2035
  source_risk_label: 보통
  weight_pct: 10.0
  interest_rate_pct: null
  rate_month: null
  returns_pct:
    1M: 1.55
    3M: -3.65
    6M: 3.42
    1Y: 14.57
  return_as_of: null
  source_ref: S04:L55
  quality: 원문 표 보존
performance_observations:
- as_of: null
  as_of_status: 디폴트옵션 표 성과 기준일 미기재. 1절의 8/28을 자동 전파하지 않음.
  unit: '%'
  return_type: 포트폴리오 수익률(일단위 재투자 가정; 실제 고객 수익률과 다를 수 있음)
  returns_pct:
    1M: 0.35
    3M: -2.61
    6M: 3.7
    1Y: 10.52
  source_ref: S04:L56
  calculation_note_ref: S04:L101
availability:
  source_status: 9월 추천 디폴트옵션 표 등재
  runtime_verified: false
  candidate_state: CONDITIONAL
  required_checks:
  - 최신 투자성향과 포트폴리오 위험도
  - 현재 지정상품과 실제 보유상품 구분
  - 신규입금/최초만기/재만기별 실행조건
  - 옵트인·변경 가능 여부
principal_protection: 실적배당상품 포함 — 포트폴리오 전체 원금보장으로 안내하지 않음
deposit_protection: 개별 구성상품별로 확인; 포트폴리오에 단일 보호 여부를 부여하지 않음.
recommended_by_kb:
  default_option_material: true
  month: 2026-09
mapping_knowledge_refs:
- E07:입금예정상품 vs 디폴트옵션
- E07:활용 마케팅 Tip·고객 질문
- S04:상품특징
quality_note: 구성 기업은행 3년 금리 S04:L53=3.52%, S01:L78 재예치=3.32%. 적용조건 동일성 미확인. 원문값 병기하고 이 구성금리의 제안·비교는 보류.
```

<a id="DO-004"></a>

### DO-004 · 알파드림III

```yaml
product_id: DO-004
product_name: 알파드림III
entity_type: default_option_portfolio
product_form: 디폴트옵션 포트폴리오
asset_class:
- 편입상품별 구성 참조
strategy_type:
- 사전지정운용
portfolio_role:
- 운용공백 대비
- 위험도별 자산배분
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L57-L60
- S04:L90
- E07:디폴트옵션 개념·고객 질문
default_option_risk: 저위험
risk_grade: null
inception_date: '2023-09-01'
management_style:
- 사전지정운용
- 별도 옵트인/실행절차
irp_investment_limit_pct: null
limit_note: E07 교안의 승인·예외 설명은 참조하되 개별 포트폴리오 운용가능비율은 실제 상품조회로 확인.
investment_strategy: 보험사 GIC 편입을 통해 이자수익을 강화한 원리금보장형 70, TDF 30 저위험 포트폴리오
components:
- source_product_name: 농협은행 디폴트옵션형 퇴직연금 정기예금(3년)
  source_risk_label: null
  weight_pct: 35.0
  interest_rate_pct: 3.4
  rate_month: 2026-09
  returns_pct:
    1M: null
    3M: null
    6M: null
    1Y: null
  return_as_of: null
  source_ref: S04:L57
  quality: 원문 표 보존
- source_product_name: DB손해보험 퇴직연금 디폴트옵션 이율보증형보험(3년)
  source_risk_label: null
  weight_pct: 35.0
  interest_rate_pct: 4.41
  rate_month: 2026-09
  returns_pct:
    1M: null
    3M: null
    6M: null
    1Y: null
  return_as_of: null
  source_ref: S04:L58
  quality: 원문 표 보존
- source_product_name: KB온국민적격TDF2035(H)
  source_risk_label: 다소높은
  weight_pct: 30.0
  interest_rate_pct: null
  rate_month: null
  returns_pct:
    1M: 0.44
    3M: -5.24
    6M: 6.02
    1Y: 17.23
  return_as_of: null
  source_ref: S04:L59
  quality: 원문 표 보존
performance_observations:
- as_of: null
  as_of_status: 디폴트옵션 표 성과 기준일 미기재. 1절의 8/28을 자동 전파하지 않음.
  unit: '%'
  return_type: 포트폴리오 수익률(일단위 재투자 가정; 실제 고객 수익률과 다를 수 있음)
  returns_pct:
    1M: 0.37
    3M: -0.95
    6M: 2.94
    1Y: 6.84
  source_ref: S04:L60
  calculation_note_ref: S04:L101
availability:
  source_status: 9월 추천 디폴트옵션 표 등재
  runtime_verified: false
  candidate_state: CONDITIONAL
  required_checks:
  - 최신 투자성향과 포트폴리오 위험도
  - 현재 지정상품과 실제 보유상품 구분
  - 신규입금/최초만기/재만기별 실행조건
  - 옵트인·변경 가능 여부
principal_protection: 실적배당상품 포함 — 포트폴리오 전체 원금보장으로 안내하지 않음
deposit_protection: 개별 구성상품별로 확인; 포트폴리오에 단일 보호 여부를 부여하지 않음.
recommended_by_kb:
  default_option_material: true
  month: 2026-09
mapping_knowledge_refs:
- E07:입금예정상품 vs 디폴트옵션
- E07:활용 마케팅 Tip·고객 질문
- S04:상품특징
```

<a id="DO-005"></a>

### DO-005 · 불려드림

```yaml
product_id: DO-005
product_name: 불려드림
entity_type: default_option_portfolio
product_form: 디폴트옵션 포트폴리오
asset_class:
- 편입상품별 구성 참조
strategy_type:
- 사전지정운용
portfolio_role:
- 운용공백 대비
- 위험도별 자산배분
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L61-L64
- S04:L91
- E07:디폴트옵션 개념·고객 질문
default_option_risk: 중위험
risk_grade: null
inception_date: '2023-01-02'
management_style:
- 사전지정운용
- 별도 옵트인/실행절차
irp_investment_limit_pct: null
limit_note: E07 교안의 승인·예외 설명은 참조하되 개별 포트폴리오 운용가능비율은 실제 상품조회로 확인.
investment_strategy: 기대수익률이 높아 적극적인 투자를 원하면서도 안정성도 원하는 고객님을 위해 정기예금 30, TDF 70 포트폴리오
components:
- source_product_name: 하나은행 퇴직연금 디폴트옵션 정기예금(3년)
  source_risk_label: null
  weight_pct: 30.0
  interest_rate_pct: 3.25
  rate_month: 2026-09
  returns_pct:
    1M: null
    3M: null
    6M: null
    1Y: null
  return_as_of: null
  source_ref: S04:L61
  quality: 원문 표 보존
- source_product_name: KB다이나믹적격TDF2040
  source_risk_label: 다소높은
  weight_pct: 50.0
  interest_rate_pct: null
  rate_month: null
  returns_pct:
    1M: 0.22
    3M: -7.35
    6M: 8.16
    1Y: 24.58
  return_as_of: null
  source_ref: S04:L62
  quality: 원문 표 보존
- source_product_name: 한화Lifeplus적격TDF2040
  source_risk_label: 다소높은
  weight_pct: 20.0
  interest_rate_pct: null
  rate_month: null
  returns_pct:
    1M: -0.18
    3M: -5.02
    6M: 3.38
    1Y: 21.17
  return_as_of: null
  source_ref: S04:L63
  quality: 원문 표 보존
performance_observations:
- as_of: null
  as_of_status: 디폴트옵션 표 성과 기준일 미기재. 1절의 8/28을 자동 전파하지 않음.
  unit: '%'
  return_type: 포트폴리오 수익률(일단위 재투자 가정; 실제 고객 수익률과 다를 수 있음)
  returns_pct:
    1M: 0.16
    3M: -4.45
    6M: 5.19
    1Y: 17.16
  source_ref: S04:L64
  calculation_note_ref: S04:L101
availability:
  source_status: 9월 추천 디폴트옵션 표 등재
  runtime_verified: false
  candidate_state: CONDITIONAL
  required_checks:
  - 최신 투자성향과 포트폴리오 위험도
  - 현재 지정상품과 실제 보유상품 구분
  - 신규입금/최초만기/재만기별 실행조건
  - 옵트인·변경 가능 여부
principal_protection: 실적배당상품 포함 — 포트폴리오 전체 원금보장으로 안내하지 않음
deposit_protection: 개별 구성상품별로 확인; 포트폴리오에 단일 보호 여부를 부여하지 않음.
recommended_by_kb:
  default_option_material: true
  month: 2026-09
mapping_knowledge_refs:
- E07:입금예정상품 vs 디폴트옵션
- E07:활용 마케팅 Tip·고객 질문
- S04:상품특징
source_alias_note: E07의 뿔려드림 계열과 유사하나 정식명 대조 전 원문 불려드림 표기 유지.
```

<a id="DO-006"></a>

### DO-006 · 불려드림II

```yaml
product_id: DO-006
product_name: 불려드림II
entity_type: default_option_portfolio
product_form: 디폴트옵션 포트폴리오
asset_class:
- 편입상품별 구성 참조
strategy_type:
- 사전지정운용
portfolio_role:
- 운용공백 대비
- 위험도별 자산배분
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L65-L68
- S04:L92
- E07:디폴트옵션 개념·고객 질문
default_option_risk: 중위험
risk_grade: null
inception_date: '2022-12-06'
management_style:
- 사전지정운용
- 별도 옵트인/실행절차
irp_investment_limit_pct: null
limit_note: E07 교안의 승인·예외 설명은 참조하되 개별 포트폴리오 운용가능비율은 실제 상품조회로 확인.
investment_strategy: 은퇴시기와 무관하게 안정적이고 지속적인 수익창출을 추구하는 고객님을 위한 TIF와 EMP의 자산배분형 포트폴리오
components:
- source_product_name: 미래에셋평생소득 TIF
  source_risk_label: 보통
  weight_pct: 70.0
  interest_rate_pct: null
  rate_month: null
  returns_pct:
    1M: 0.13
    3M: -2.99
    6M: 2.19
    1Y: 12.67
  return_as_of: null
  source_ref: S04:L65
  quality: 원문 표 보존
- source_product_name: 키움불리오글로벌멀티에셋EMP(UH) ※
  source_risk_label: 다소높은
  weight_pct: 20.0
  interest_rate_pct: null
  rate_month: null
  returns_pct:
    1M: -2.79
    3M: -8.2
    6M: 0.25
    1Y: 25.27
  return_as_of: null
  source_ref: S04:L66
  quality: 상품명 판독불확실(※)
- source_product_name: IBK플레인바닐라EMP
  source_risk_label: 다소높은
  weight_pct: 10.0
  interest_rate_pct: null
  rate_month: null
  returns_pct:
    1M: -3.27
    3M: -11.33
    6M: 2.37
    1Y: 19.58
  return_as_of: null
  source_ref: S04:L67
  quality: 원문 표 보존
performance_observations:
- as_of: null
  as_of_status: 디폴트옵션 표 성과 기준일 미기재. 1절의 8/28을 자동 전파하지 않음.
  unit: '%'
  return_type: 포트폴리오 수익률(일단위 재투자 가정; 실제 고객 수익률과 다를 수 있음)
  returns_pct:
    1M: -0.8
    3M: -4.87
    6M: 1.9
    1Y: 15.9
  source_ref: S04:L68
  calculation_note_ref: S04:L101
availability:
  source_status: 9월 추천 디폴트옵션 표 등재
  runtime_verified: false
  candidate_state: CONDITIONAL
  required_checks:
  - 최신 투자성향과 포트폴리오 위험도
  - 현재 지정상품과 실제 보유상품 구분
  - 신규입금/최초만기/재만기별 실행조건
  - 옵트인·변경 가능 여부
principal_protection: 실적배당상품 포함 — 포트폴리오 전체 원금보장으로 안내하지 않음
deposit_protection: 개별 구성상품별로 확인; 포트폴리오에 단일 보호 여부를 부여하지 않음.
recommended_by_kb:
  default_option_material: true
  month: 2026-09
mapping_knowledge_refs:
- E07:입금예정상품 vs 디폴트옵션
- E07:활용 마케팅 Tip·고객 질문
- S04:상품특징
source_alias_note: E07의 뿔려드림 계열과 유사하나 정식명 대조 전 원문 불려드림 표기 유지.
```

<a id="DO-007"></a>

### DO-007 · 불려드림III

```yaml
product_id: DO-007
product_name: 불려드림III
entity_type: default_option_portfolio
product_form: 디폴트옵션 포트폴리오
asset_class:
- 편입상품별 구성 참조
strategy_type:
- 사전지정운용
portfolio_role:
- 운용공백 대비
- 위험도별 자산배분
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L69-L71
- S04:L93
- E07:디폴트옵션 개념·고객 질문
default_option_risk: 중위험
risk_grade: null
inception_date: '2023-11-24'
management_style:
- 사전지정운용
- 별도 옵트인/실행절차
irp_investment_limit_pct: null
limit_note: E07 교안의 승인·예외 설명은 참조하되 개별 포트폴리오 운용가능비율은 실제 상품조회로 확인.
investment_strategy: KB라이프의 고수익 GIC와 KB국민은행·KBI자산운용의 자문형 펀드로 운용
components:
- source_product_name: KB라이프생명 퇴직연금 디폴트옵션 이율보증형보험(3년)
  source_risk_label: null
  weight_pct: 20.0
  interest_rate_pct: 4.3
  rate_month: 2026-09
  returns_pct:
    1M: null
    3M: null
    6M: null
    1Y: null
  return_as_of: null
  source_ref: S04:L69
  quality: 원문 표 보존
- source_product_name: KB드림스타자산배분안정형
  source_risk_label: 보통
  weight_pct: 80.0
  interest_rate_pct: null
  rate_month: null
  returns_pct:
    1M: -0.12
    3M: -3.26
    6M: 1.67
    1Y: 13.26
  return_as_of: null
  source_ref: S04:L70
  quality: 원문 표 보존
performance_observations:
- as_of: null
  as_of_status: 디폴트옵션 표 성과 기준일 미기재. 1절의 8/28을 자동 전파하지 않음.
  unit: '%'
  return_type: 포트폴리오 수익률(일단위 재투자 가정; 실제 고객 수익률과 다를 수 있음)
  returns_pct:
    1M: -0.03
    3M: -2.43
    6M: 1.66
    1Y: 11.18
  source_ref: S04:L71
  calculation_note_ref: S04:L101
availability:
  source_status: 9월 추천 디폴트옵션 표 등재
  runtime_verified: false
  candidate_state: CONDITIONAL
  required_checks:
  - 최신 투자성향과 포트폴리오 위험도
  - 현재 지정상품과 실제 보유상품 구분
  - 신규입금/최초만기/재만기별 실행조건
  - 옵트인·변경 가능 여부
principal_protection: 실적배당상품 포함 — 포트폴리오 전체 원금보장으로 안내하지 않음
deposit_protection: 개별 구성상품별로 확인; 포트폴리오에 단일 보호 여부를 부여하지 않음.
recommended_by_kb:
  default_option_material: true
  month: 2026-09
mapping_knowledge_refs:
- E07:입금예정상품 vs 디폴트옵션
- E07:활용 마케팅 Tip·고객 질문
- S04:상품특징
source_alias_note: E07의 뿔려드림 계열과 유사하나 정식명 대조 전 원문 불려드림 표기 유지.
```

<a id="DO-008"></a>

### DO-008 · 모두드림

```yaml
product_id: DO-008
product_name: 모두드림
entity_type: default_option_portfolio
product_form: 디폴트옵션 포트폴리오
asset_class:
- 편입상품별 구성 참조
strategy_type:
- 사전지정운용
portfolio_role:
- 운용공백 대비
- 위험도별 자산배분
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L72-L75
- S04:L94
- E07:디폴트옵션 개념·고객 질문
default_option_risk: 고위험
risk_grade: null
inception_date: '2022-12-06'
management_style:
- 사전지정운용
- 별도 옵트인/실행절차
irp_investment_limit_pct: null
limit_note: E07 교안의 승인·예외 설명은 참조하되 개별 포트폴리오 운용가능비율은 실제 상품조회로 확인.
investment_strategy: 투자경험이 풍부하고 투자수익을 위해 환차익까지, 기대수익률이 높은 고객님을 위한 TDF 100 투자 포트폴리오
components:
- source_product_name: KB온국민적격TDF2055(UH)
  source_risk_label: 다소높은
  weight_pct: 60.0
  interest_rate_pct: null
  rate_month: null
  returns_pct:
    1M: -1.66
    3M: -9.34
    6M: 6.54
    1Y: 23.59
  return_as_of: null
  source_ref: S04:L72
  quality: 원문 표 보존
- source_product_name: 한국투자적격TDF알아서2050(UH)
  source_risk_label: 다소높은
  weight_pct: 20.0
  interest_rate_pct: null
  rate_month: null
  returns_pct:
    1M: -0.8
    3M: -8.5
    6M: 5.08
    1Y: 21.61
  return_as_of: null
  source_ref: S04:L73
  quality: 원문 표 보존
- source_product_name: 한화Lifeplus적격TDF2045
  source_risk_label: 높은
  weight_pct: 20.0
  interest_rate_pct: null
  rate_month: null
  returns_pct:
    1M: -0.27
    3M: -5.8
    6M: 3.55
    1Y: 23.22
  return_as_of: null
  source_ref: S04:L74
  quality: 원문 표 보존
performance_observations:
- as_of: null
  as_of_status: 디폴트옵션 표 성과 기준일 미기재. 1절의 8/28을 자동 전파하지 않음.
  unit: '%'
  return_type: 포트폴리오 수익률(일단위 재투자 가정; 실제 고객 수익률과 다를 수 있음)
  returns_pct:
    1M: -1.21
    3M: -8.46
    6M: 5.65
    1Y: 23.12
  source_ref: S04:L75
  calculation_note_ref: S04:L101
availability:
  source_status: 9월 추천 디폴트옵션 표 등재
  runtime_verified: false
  candidate_state: CONDITIONAL
  required_checks:
  - 최신 투자성향과 포트폴리오 위험도
  - 현재 지정상품과 실제 보유상품 구분
  - 신규입금/최초만기/재만기별 실행조건
  - 옵트인·변경 가능 여부
principal_protection: 실적배당상품 포함 — 포트폴리오 전체 원금보장으로 안내하지 않음
deposit_protection: 개별 구성상품별로 확인; 포트폴리오에 단일 보호 여부를 부여하지 않음.
recommended_by_kb:
  default_option_material: true
  month: 2026-09
mapping_knowledge_refs:
- E07:입금예정상품 vs 디폴트옵션
- E07:활용 마케팅 Tip·고객 질문
- S04:상품특징
```

<a id="DO-009"></a>

### DO-009 · 모두드림II

```yaml
product_id: DO-009
product_name: 모두드림II
entity_type: default_option_portfolio
product_form: 디폴트옵션 포트폴리오
asset_class:
- 편입상품별 구성 참조
strategy_type:
- 사전지정운용
portfolio_role:
- 운용공백 대비
- 위험도별 자산배분
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L76-L79
- S04:L95
- E07:디폴트옵션 개념·고객 질문
default_option_risk: 고위험
risk_grade: null
inception_date: '2023-01-02'
management_style:
- 사전지정운용
- 별도 옵트인/실행절차
irp_investment_limit_pct: null
limit_note: E07 교안의 승인·예외 설명은 참조하되 개별 포트폴리오 운용가능비율은 실제 상품조회로 확인.
investment_strategy: 적극적인 투자로 초과이익을 추구하는 액티브 TDF 100으로 구성되어 투자경험이 풍부한 고객님께 추천드리는 포트폴리오
components:
- source_product_name: KB다이나믹적격TDF2050
  source_risk_label: 다소높은
  weight_pct: 50.0
  interest_rate_pct: null
  rate_month: null
  returns_pct:
    1M: 0.24
    3M: -7.52
    6M: 8.71
    1Y: 26.82
  return_as_of: null
  source_ref: S04:L76
  quality: 원문 표 보존
- source_product_name: 한국투자적격TDF알아서2055(UH)
  source_risk_label: 다소높은
  weight_pct: 40.0
  interest_rate_pct: null
  rate_month: null
  returns_pct:
    1M: -0.74
    3M: -8.86
    6M: 4.73
    1Y: 21.46
  return_as_of: null
  source_ref: S04:L77
  quality: 원문 표 보존
- source_product_name: 미래에셋전략배분적격TDF2050
  source_risk_label: 다소높은
  weight_pct: 10.0
  interest_rate_pct: null
  rate_month: null
  returns_pct:
    1M: 0.25
    3M: -6.27
    6M: 3.62
    1Y: 17.48
  return_as_of: null
  source_ref: S04:L78
  quality: 원문 표 보존
performance_observations:
- as_of: null
  as_of_status: 디폴트옵션 표 성과 기준일 미기재. 1절의 8/28을 자동 전파하지 않음.
  unit: '%'
  return_type: 포트폴리오 수익률(일단위 재투자 가정; 실제 고객 수익률과 다를 수 있음)
  returns_pct:
    1M: -0.15
    3M: -7.93
    6M: 6.61
    1Y: 23.74
  source_ref: S04:L79
  calculation_note_ref: S04:L101
availability:
  source_status: 9월 추천 디폴트옵션 표 등재
  runtime_verified: false
  candidate_state: CONDITIONAL
  required_checks:
  - 최신 투자성향과 포트폴리오 위험도
  - 현재 지정상품과 실제 보유상품 구분
  - 신규입금/최초만기/재만기별 실행조건
  - 옵트인·변경 가능 여부
principal_protection: 실적배당상품 포함 — 포트폴리오 전체 원금보장으로 안내하지 않음
deposit_protection: 개별 구성상품별로 확인; 포트폴리오에 단일 보호 여부를 부여하지 않음.
recommended_by_kb:
  default_option_material: true
  month: 2026-09
mapping_knowledge_refs:
- E07:입금예정상품 vs 디폴트옵션
- E07:활용 마케팅 Tip·고객 질문
- S04:상품특징
```

<a id="DO-010"></a>

### DO-010 · 모두드림III

```yaml
product_id: DO-010
product_name: 모두드림III
entity_type: default_option_portfolio
product_form: 디폴트옵션 포트폴리오
asset_class:
- 편입상품별 구성 참조
strategy_type:
- 사전지정운용
portfolio_role:
- 운용공백 대비
- 위험도별 자산배분
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L80-L81
- S04:L96
- E07:디폴트옵션 개념·고객 질문
default_option_risk: 고위험
risk_grade: null
inception_date: '2023-11-29'
management_style:
- 사전지정운용
- 별도 옵트인/실행절차
irp_investment_limit_pct: null
limit_note: E07 교안의 승인·예외 설명은 참조하되 개별 포트폴리오 운용가능비율은 실제 상품조회로 확인.
investment_strategy: KB국민은행에서 자문하고 미래에셋자산운용에서 운용하는 자산배분형 BF
components:
- source_product_name: 미래에셋글로벌스타자산배분성장형
  source_risk_label: 다소높은
  weight_pct: null
  interest_rate_pct: null
  rate_month: null
  returns_pct:
    1M: -0.81
    3M: -6.73
    6M: 3.03
    1Y: 17.69
  return_as_of: null
  source_ref: S04:L80
  quality: 원문 표 보존
performance_observations:
- as_of: null
  as_of_status: 디폴트옵션 표 성과 기준일 미기재. 1절의 8/28을 자동 전파하지 않음.
  unit: '%'
  return_type: 포트폴리오 수익률(일단위 재투자 가정; 실제 고객 수익률과 다를 수 있음)
  returns_pct:
    1M: -0.81
    3M: -6.73
    6M: 3.03
    1Y: 17.69
  source_ref: S04:L81
  calculation_note_ref: S04:L101
availability:
  source_status: 9월 추천 디폴트옵션 표 등재
  runtime_verified: false
  candidate_state: CONDITIONAL
  required_checks:
  - 최신 투자성향과 포트폴리오 위험도
  - 현재 지정상품과 실제 보유상품 구분
  - 신규입금/최초만기/재만기별 실행조건
  - 옵트인·변경 가능 여부
principal_protection: 실적배당상품 포함 — 포트폴리오 전체 원금보장으로 안내하지 않음
deposit_protection: 개별 구성상품별로 확인; 포트폴리오에 단일 보호 여부를 부여하지 않음.
recommended_by_kb:
  default_option_material: true
  month: 2026-09
mapping_knowledge_refs:
- E07:입금예정상품 vs 디폴트옵션
- E07:활용 마케팅 Tip·고객 질문
- S04:상품특징
quality_note: 개별 구성상품 비중 공란, 합계행 100만 기재. 구성행을 임의 100으로 보정하지 않음.
```


## 11. 투자성향·연금수령 모델 포트폴리오

<a id="MODEL-001"></a>

### MODEL-001 · 안정형

```yaml
product_id: MODEL-001
product_name: 안정형
entity_type: model_portfolio
product_form: 추천 모델 포트폴리오
asset_class:
- 원문 배분 참고
strategy_type:
- 투자성향/수령단계별 자산배분
portfolio_role:
- 운용방향 참고안
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L143-L152
- S04:L108
reference_month: 2026-09
raw_allocation: 국내채권 100%
expected_return_pct: 2.4
expected_volatility_pct: 3.0
metric_note: 과거 데이터를 분석한 모델 추정치. 개별 펀드의 과거 수익률이나 보장수익률이 아님.
holdings:
- fund_ref: MF-018
  source_product_name: 한화 내일받는 단기국공채 (합성총보수 연0.1977%)
  raw_asset_class: 국내채권
  weight_pct: 30.0
  source_ref: S04:L150
- fund_ref: MF-019
  source_product_name: 유진 챔피언 단기채 (합성총보수 연0.3290%)
  raw_asset_class: 국내채권
  weight_pct: 30.0
  source_ref: S04:L151
- fund_ref: MF-020
  source_product_name: KB 스타 단기국공채 (총보수 연0.2430%)
  raw_asset_class: 국내채권
  weight_pct: 40.0
  source_ref: S04:L152
application_note: 이 모델 비중은 개별 고객 적합성·허용 한도의 승인값이 아님. 계좌 전체/신규자금 구분 후 참고. 실제 클래스별 조건은 별도 조회.
availability:
  candidate_state: MODEL_REFERENCE_ONLY
  runtime_verified: false
```

<a id="MODEL-002"></a>

### MODEL-002 · 안정추구형

```yaml
product_id: MODEL-002
product_name: 안정추구형
entity_type: model_portfolio
product_form: 추천 모델 포트폴리오
asset_class:
- 원문 배분 참고
strategy_type:
- 투자성향/수령단계별 자산배분
portfolio_role:
- 운용방향 참고안
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L154-L163
- S04:L108
reference_month: 2026-09
raw_allocation: 국내채권 80% / 해외채권 20%
expected_return_pct: 2.4
expected_volatility_pct: 3.5
metric_note: 과거 데이터를 분석한 모델 추정치. 개별 펀드의 과거 수익률이나 보장수익률이 아님.
holdings:
- fund_ref: MF-015
  source_product_name: 키움 더드림 단기채 (합성총보수 연0.2990%)
  raw_asset_class: 국내채권
  weight_pct: 80.0
  source_ref: S04:L161
- fund_ref: MF-021
  source_product_name: KB 글로벌 단기채(H) (합성총보수 연0.6960%)
  raw_asset_class: 해외채권
  weight_pct: 10.0
  source_ref: S04:L162
- fund_ref: MF-022
  source_product_name: AB글로벌고수익 (합성총보수 연1.3670%)
  raw_asset_class: 해외채권
  weight_pct: 10.0
  source_ref: S04:L163
application_note: 이 모델 비중은 개별 고객 적합성·허용 한도의 승인값이 아님. 계좌 전체/신규자금 구분 후 참고. 실제 클래스별 조건은 별도 조회.
availability:
  candidate_state: MODEL_REFERENCE_ONLY
  runtime_verified: false
```

<a id="MODEL-003"></a>

### MODEL-003 · 위험중립형

```yaml
product_id: MODEL-003
product_name: 위험중립형
entity_type: model_portfolio
product_form: 추천 모델 포트폴리오
asset_class:
- 원문 배분 참고
strategy_type:
- 투자성향/수령단계별 자산배분
portfolio_role:
- 운용방향 참고안
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L165-L174
- S04:L108
reference_month: 2026-09
raw_allocation: 국내채권 60% / 해외채권 15% / 해외혼합 25%
expected_return_pct: 5.8
expected_volatility_pct: 4.9
metric_note: 과거 데이터를 분석한 모델 추정치. 개별 펀드의 과거 수익률이나 보장수익률이 아님.
holdings:
- fund_ref: MF-015
  source_product_name: 키움 더드림 단기채 (합성총보수 연0.2990%)
  raw_asset_class: 국내채권
  weight_pct: 60.0
  source_ref: S04:L172
- fund_ref: MF-011
  source_product_name: 우리미국 단기채공모주(H) (합성총보수 연1.2171%)
  raw_asset_class: 해외채권
  weight_pct: 15.0
  source_ref: S04:L173
- fund_ref: MF-009
  source_product_name: 삼성EMP 리얼리턴(UH) (합성총보수 연1.1215%)
  raw_asset_class: 해외혼합
  weight_pct: 25.0
  source_ref: S04:L174
application_note: 이 모델 비중은 개별 고객 적합성·허용 한도의 승인값이 아님. 계좌 전체/신규자금 구분 후 참고. 실제 클래스별 조건은 별도 조회.
availability:
  candidate_state: MODEL_REFERENCE_ONLY
  runtime_verified: false
```

<a id="MODEL-004"></a>

### MODEL-004 · 적극투자형

```yaml
product_id: MODEL-004
product_name: 적극투자형
entity_type: model_portfolio
product_form: 추천 모델 포트폴리오
asset_class:
- 원문 배분 참고
strategy_type:
- 투자성향/수령단계별 자산배분
portfolio_role:
- 운용방향 참고안
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L176-L185
- S04:L108
reference_month: 2026-09
raw_allocation: 국내채권 35% / 해외채권 5% / 해외주식 60%
expected_return_pct: 11.0
expected_volatility_pct: 9.6
metric_note: 과거 데이터를 분석한 모델 추정치. 개별 펀드의 과거 수익률이나 보장수익률이 아님.
holdings:
- fund_ref: MF-023
  source_product_name: NH-Amundi 하나로단기채 (합성총보수 연0.2839%)
  raw_asset_class: 국내채권
  weight_pct: 35.0
  source_ref: S04:L183
- fund_ref: MF-011
  source_product_name: 우리미국 단기채공모주(H) (합성총보수 연1.2171%)
  raw_asset_class: 해외채권
  weight_pct: 5.0
  source_ref: S04:L184
- fund_ref: MF-024
  source_product_name: 신한누버거버먼 미국가치주(H) (합성총보수 연1.6100%)
  raw_asset_class: 해외주식
  weight_pct: 60.0
  source_ref: S04:L185
application_note: 이 모델 비중은 개별 고객 적합성·허용 한도의 승인값이 아님. 계좌 전체/신규자금 구분 후 참고. 실제 클래스별 조건은 별도 조회.
availability:
  candidate_state: MODEL_REFERENCE_ONLY
  runtime_verified: false
```

<a id="MODEL-005"></a>

### MODEL-005 · 공격투자형

```yaml
product_id: MODEL-005
product_name: 공격투자형
entity_type: model_portfolio
product_form: 추천 모델 포트폴리오
asset_class:
- 원문 배분 참고
strategy_type:
- 투자성향/수령단계별 자산배분
portfolio_role:
- 운용방향 참고안
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L187-L196
- S04:L108
reference_month: 2026-09
raw_allocation: 국내채권 25% / 해외채권 5% / 해외주식 70%
expected_return_pct: 12.5
expected_volatility_pct: 11.1
metric_note: 과거 데이터를 분석한 모델 추정치. 개별 펀드의 과거 수익률이나 보장수익률이 아님.
holdings:
- fund_ref: MF-017
  source_product_name: 교보악사 Tomorrow 장기우량K-1 (총보수 연0.3300%)
  raw_asset_class: 국내채권
  weight_pct: 25.0
  source_ref: S04:L194
- fund_ref: MF-011
  source_product_name: 우리미국 단기채공모주(H) (합성총보수 연1.2171%)
  raw_asset_class: 해외채권
  weight_pct: 5.0
  source_ref: S04:L195
- fund_ref: MF-025
  source_product_name: 삼성글로벌 배당성장주(H) (합성총보수 연1.4213%)
  raw_asset_class: 해외주식
  weight_pct: 70.0
  source_ref: S04:L196
application_note: 이 모델 비중은 개별 고객 적합성·허용 한도의 승인값이 아님. 계좌 전체/신규자금 구분 후 참고. 실제 클래스별 조건은 별도 조회.
availability:
  candidate_state: MODEL_REFERENCE_ONLY
  runtime_verified: false
```

<a id="MODEL-006"></a>

### MODEL-006 · 연금 든든테마(연금수령 예정)

```yaml
product_id: MODEL-006
product_name: 연금 든든테마(연금수령 예정)
entity_type: model_portfolio
product_form: 추천 모델 포트폴리오
asset_class:
- 원문 배분 참고
strategy_type:
- 투자성향/수령단계별 자산배분
portfolio_role:
- 운용방향 참고안
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L202-L211
- S04:L108
reference_month: 2026-09
raw_allocation: 국내채권 80% / 해외채권 20%
expected_return_pct: 2.4
expected_volatility_pct: 3.5
metric_note: 과거 데이터를 분석한 모델 추정치. 개별 펀드의 과거 수익률이나 보장수익률이 아님.
holdings:
- fund_ref: MF-018
  source_product_name: 한화 내일받는 단기국공채 (합성총보수 연0.1977%)
  raw_asset_class: 국내채권
  weight_pct: 80.0
  source_ref: S04:L209
- fund_ref: MF-021
  source_product_name: KB 글로벌 단기채(H) (합성총보수 연0.6960%)
  raw_asset_class: 해외채권
  weight_pct: 10.0
  source_ref: S04:L210
- fund_ref: MF-022
  source_product_name: AB글로벌고수익 (합성총보수 연1.3670%)
  raw_asset_class: 해외채권
  weight_pct: 10.0
  source_ref: S04:L211
application_note: 이 모델 비중은 개별 고객 적합성·허용 한도의 승인값이 아님. 계좌 전체/신규자금 구분 후 참고. 실제 클래스별 조건은 별도 조회.
availability:
  candidate_state: MODEL_REFERENCE_ONLY
  runtime_verified: false
quality_note: 원문 포트폴리오 소개문과 세부 구성에 일부 표현 차이. 구성표를 원문 그대로 보존하고 상품군·위험을 개별 확인. 인컴테마 명칭은 월분배·연금지급 기능의 보증이 아님.
```

<a id="MODEL-007"></a>

### MODEL-007 · 연금 인컴테마(연금수령)

```yaml
product_id: MODEL-007
product_name: 연금 인컴테마(연금수령)
entity_type: model_portfolio
product_form: 추천 모델 포트폴리오
asset_class:
- 원문 배분 참고
strategy_type:
- 투자성향/수령단계별 자산배분
portfolio_role:
- 운용방향 참고안
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- S04:L215-L224
- S04:L108
reference_month: 2026-09
raw_allocation: 국내채권 100%
expected_return_pct: 2.4
expected_volatility_pct: 3.0
metric_note: 과거 데이터를 분석한 모델 추정치. 개별 펀드의 과거 수익률이나 보장수익률이 아님.
holdings:
- fund_ref: MF-018
  source_product_name: 한화 내일받는 단기국공채 (합성총보수 연0.1977%)
  raw_asset_class: 국내채권
  weight_pct: 40.0
  source_ref: S04:L222
- fund_ref: MF-019
  source_product_name: 유진 챔피언 단기채 (합성총보수 연0.3290%)
  raw_asset_class: 국내채권
  weight_pct: 30.0
  source_ref: S04:L223
- fund_ref: MF-026
  source_product_name: 우리 단기채권 (합성총보수 연0.3398%)
  raw_asset_class: 국내채권
  weight_pct: 30.0
  source_ref: S04:L224
application_note: 이 모델 비중은 개별 고객 적합성·허용 한도의 승인값이 아님. 계좌 전체/신규자금 구분 후 참고. 실제 클래스별 조건은 별도 조회.
availability:
  candidate_state: MODEL_REFERENCE_ONLY
  runtime_verified: false
quality_note: 원문 포트폴리오 소개문과 세부 구성에 일부 표현 차이. 구성표를 원문 그대로 보존하고 상품군·위험을 개별 확인. 인컴테마 명칭은 월분배·연금지급 기능의 보증이 아님.
```


## 12. 관리형 서비스

<a id="SVC-001"></a>

### SVC-001 · 개인형IRP AI 투자일임 서비스

```yaml
product_id: SVC-001
product_name: 개인형IRP AI 투자일임 서비스
entity_type: management_service
product_form: 관리형 서비스
asset_class:
- 실제 계약 포트폴리오 확인
strategy_type:
- 로보어드바이저 투자일임
portfolio_role:
- 상품선택·매매·리밸런싱 부담 완화
classification_basis: '기획용 분류: 원문 유형·상품명·투자전략 및 아래 교육근거에 기반. 상품별 적합성 판정 아님.'
registry_status: REGISTERED
source_refs:
- E06:1-1 AI 투자일임 서비스
provider_options:
- 디셈버앤컴퍼니(Fint)
- 미래에셋자산운용(M-ROBO)
- 한국투자신탁운용(KimRobo)
performance_observations: []
risk_grade: null
management_style:
- 일임계약 후 포트폴리오 운용
source_conditions:
  one_account_per_person: true
  annual_discretionary_limit_krw: 9000000
  excluded_customers:
  - 금액지정·기간지정 방식 연금개시 고객
  - 미성년자
  - 외국인
  as_of: null
  note: 교안에 기재된 조건. 현재 서비스 이용요건을 실시간 확인한 결과 아님.
availability:
  source_status: 교안에 소개된 서비스
  candidate_state: SERVICE_CONDITIONAL
  runtime_verified: false
  required_checks:
  - 이용 가능요건·한도·계약
  - 서비스 비용·실제 운용위험
  - 고객의 일임 의향
investment_strategy: 직접 투자 의향은 있으나 상품선택·리밸런싱 부담이 확인된 경우, TDF나 직접운용과 비교. 단순 무거래만으로 일임 필요성을 단정하지 않음.
mapping_knowledge_refs:
- E06:1-1
- K02:CASE 21
```


## 13. TDF 빈티지 비교 참고 — 월간자료 원문 표

출처: S04:L110-L139. **원문은 60세 은퇴 가정 및 위험자산 비중 표**이며 실제 개인의 은퇴·사용계획을 대신하지 않는다. Glide Path와 실제 운용비율은 다를 수 있다는 각주를 보존한다. 아래 운용사·빈티지의 모든 조합을 별도 판매상품으로 등록한 것이 아니다. 현재 가입가능 여부·정확한 클래스·위험등급을 표만으로 확정하지 않는다.

| 출생연도 | 1960년 | 1965년 | 1970년 | 1975년 | 1980년 | 1985년 | 1990년 | 1995년 |
|---|---|---|---|---|---|---|---|---|
| **TDF** | **2020** | **2025** | **2030** | **2035** | **2040** | **2045** | **2050** | **2055** |
| KB온국민 | 36.6 | 38.2 | 54.1 | 59.5 | 68.2 | 72.8 | 74.5 | 74.1 |
| KB 다이나믹 | | | 53.1 | | 68.0 | | 73.2 | |
| NH-Amundi | | 52.0 | 61.5 | 68.6 | 71.9 | 75.3 | 75.4 | |
| 교보악사 | | 48.4 | 65.8 | 72.2 | 75.5 | 76.8 | 76.9 | |
| 마이다스 | | | 48.0 | | | | 75.2 | |
| 미래에셋 | | 34.6 | 45.1 | 59.1 | 66.2 | 68.2 | 70.7 | |
| 삼성글로벌액티브 | 36.8 | 42.7 | 58.9 | 69.4 | 71.2 | 72.6 | 73.6 | 75.4 |
| 삼성글로벌EMP | | | 58.8 | 65.2 | 70.3 | 74.9 | 79.5 | 81.6 |
| 신영 | | | 58.4 | | 70.2 | | | |
| 신한 | | 33.4 | 47.7 | 58.6 | 67.1 | 73.7 | 78.1 | 77.9 |
| 우리 | | 41.2 | 51.8 | 60.0 | 67.4 | 72.3 | 73.2 | |
| 키움 | | 43.1 | 55.1 | 64.5 | 70.3 | 74.3 | | |
| 트러스톤 | | | 43.8 | | 61.0 | | 69.2 | |
| 한국투자알아서 | 36.2 | 40.2 | 50.5 | 60.1 | 67.5 | 72.0 | 73.3 | 71.2 |
| 한국투자ETF포커스 | | | 45.7 | 52.2 | 57.8 | 62.8 | 67.4 | 71.2 |
| 한화 | 27.0 | 36.9 | 46.7 | 56.2 | 63.1 | 68.2 | 71.9 | |

\* Glide Path 기준과 실제 운용비율은 시황과 전략에 따라 다를 수 있음

## 14. 상품 매핑에 영향을 주는 제한·미확인

| 항목 | 처리 |
|---|---|
| S05 성과 기준일 미기재·빈 셀 복원 | 선택 20행의 원문 수치와 모든 기간 보존. 기준일 `null`; 브리핑 숫자 표시 시 기준일 미확인 병기. 실제 최신성과 비교는 보류 |
| S01 수협 DC/IRP 금리 만기 열 | S01:L51의 판독 주석 보존. 해당 만기별 금리의 표시·순위 산정 보류(DEP-001) |
| S02 저축은행 3·6개월 | 특별중도해지 참고금리로 분리. 신규 매수 가능한 기간에 넣지 않음 |
| S02 원문에 신규불가/금리 미기재 | 바로·제이티친애 신규불가, BNK IRP 금리 미기재를 구분. DB 신규불가/기업형IRP 불가를 개인형IRP 불가로 잘못 확대하지 않음 |
| S02 취합표만 있는 기관 | 페퍼·OSB·JT·스마트는 개별상품 금리표 없음/취합값 공란. 정식 개별상품명·조건을 지어내지 않고 미등록 기관으로 남김 |
| S03 메리츠증권 ELB | 최소 5천만원, 사전 상품협의·업체 확인 완료 후 고객 제안. 회차·정식상품명 미확인. 내부 검토와 고객 제안을 분리 |
| S04 알파드림II 구성 예금 금리 | S04:L53 3.52% / S01:L78 재예치 3.32%. 조건 동일성 미확인으로 원문 병기; 해당 구성금리 비교 보류 |
| S04 TDF 2030 기준 | 월간 시리즈 성과를 다른 빈티지로 복사하지 않음. 숫자 위험등급은 미기재이므로 라벨만 보존 |
| S04 약칭 vs S05 클래스 | 키움 더드림 등 약칭과 클래스 후보를 연결하되 서로 다른 성과와 보수를 혼합하지 않음 |
| S04 연금테마·혼합 분류 | 소개문과 구성표의 표현 차이를 보존. ‘인컴’ 명칭으로 월분배·인출 가능성을 확정하지 않음. 우리미국 단기채공모주의 모델 표 해외채권 표기도 원문 보존 |
| E06 개별 KB온국민 TDF 예시 | 매수/환매 문구 깨짐과 ‘5등급(다소 높은 위험)’ 병기를 현재 개별상품 필드로 전파하지 않음 |
| E06/E08 ETF 매매 설명 | 장중 체결, 정산, 인출가능일을 구분. 교육자료의 일반 T+n을 모든 ETF 주문에 단일 고정값으로 적용하지 않음 |
| 추천목록·판매목록 미일치 | 자료에 없음을 판매중단으로 해석하지 않음. 본 KB도 전체 라인업이 아님 |

금융제도·보호한도·서비스 이용조건은 원문 설명을 정리한 것이며 외부 현행 법규 검증은 하지 않았다. 충돌 필드만 보류하고 확인 가능한 이름·유형·전략의 활용은 유지한다.

## 15. 출처와 위치 표기

`S04:L15`는 아래 S04 파일의 실제 15행이다. 교육자료는 `main`에서 읽은 파일의 절 이름으로 찾는다. 본문 ID와 기획용 분류는 이번 작성에서 부여했다. (1) 접미사는 첨부 파일명 구분이며 날짜·상품 버전을 뜻하지 않는다.

| 출처 | 파일/범위 | 용도·기준 |
|---|---|---|

| S01 | `시중은행_퇴직연금_정기예금_적용금리_2026-09(1).md` | DC/IRP·디폴트옵션·운용불가 절; 2026-09 적용금리 |
| S02 | `저축은행_퇴직연금_정기예금_적용금리_2026-09(1).md` | 개별 IRP 조건/금리와 공통 주석; 2026-09 |
| S03 | `9월_퇴직연금_원리금보장_특별제공상품_안내(1).md` | DC/개인형IRP 표 및 공통 주석; 2026-08-31 발신, 9월 제공안 |
| S04 | `퇴직연금_추천펀드_포트폴리오_2026-09(1).md` | 추천 17개·구성 약칭·디폴트옵션 10개·모델 7개·TDF 참고표 |
| S05 | `KB국민은행_퇴직연금_판매중_ETF_펀드(1).md` | 목록 292행은 선별/개수 확인, 상세 구조화 20행만; 기준일 미기재 |

교육자료 저장소: `09sunwoo-a/Pension_agent_code` · 참조 브랜치: `main` · 폴더: `sources/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/03_영업화법_스크립트_연금왕찐천재/`

- **E05** `연금왕찐천재_마스터북_Level2_5주차_원리금보장상품.md` — 원리금보장 4종·금리 표시·보호·연금지급·원픽 가이드·실전문제 일부. 파일 blob SHA `de0dc92a1de6a8379667d4a6bc241c5149d0fd61`.
- **E06** `연금왕찐천재_마스터북_Level2_6주차_실적배당상품.md` — AI 투자일임·TDF·ETF·고객 질문·Core-Satellite 가이드·실전문제 Q1~Q4. 파일 blob SHA `61bca40e9fde7c7f9ca49f2cad37af5e3a002dc9`.
- **E07** `연금왕찐천재_마스터북_Level2_7주차_디폴트옵션상품.md` — 입금예정상품 비교·디폴트옵션 활용 Tip·지정/실행 FAQ. 파일 blob SHA `122f255441357ee87ba905fff3ebc4e984f7d0e8`.
- **E08** `연금왕찐천재_마스터북_Level2_8주차_상품운용.md` — 원리금보장/실적배당 거래·설정·상품추천·3차 보호막 가이드. 파일 blob SHA `1620420b075d2e0882e2a8d7fa737bd47a296bb0`.

기존 기획문서는 원천 상품공문이 아닌 연결 참고자료다. 교육자료 전권·지정 폴더 전체에 대한 전수 감사는 하지 않았다.

- **K01** `퇴직연금_Agent_일반운용전략_Master_KB_v0.2.md` — RS-01~RS-18 운용전략 연결
- **K02** `퇴직연금_Agent_Golden_Case_최종_통합_보강_01-25.md` — CASE 01~25 중 관련 사례 연결
- **K03** `DEMO-01_KIM_SEOYEON.md` — 화면 구성 참고. 고객 사실·데모 상품을 이번 작업에서 변경하지 않음

## 16. 다음 Batch에 이어 쓰는 방법

이번 B01의 20개는 그대로 유지하고, 추가 요청이 있을 때만 새 판매목록 레코드 최대 20개를 추가한다. 동일 클래스·코드 여부를 확인해 중복을 피하고 미지정 값은 `null`로 둔다. 숫자와 날짜는 `performance_observations`/`rate_observation` 안에서 관리하며 상황 카드의 추천 이유와 독립적으로 갱신한다. 다음 후보의 전수 상세 대기열은 이번에 만들지 않았다.

# C01-03 이준호 · 브리핑 작성용 기반지식

**용도:** 작성자가 S1~S5 솔루션을 구성할 때 사용할 고객별 재료. 아래 솔루션 방향은 편집자의 작업 가설이며 완성 브리핑/매수 지시가 아니다.

고객 데이터 기준일: **2026-09-29** · 개별 매핑 대화 **4건** · 작성일 2026-09-21

[전체 고객 색인](<../README.md>) · [고객·대화 입력 JSON](<../../../../../C01_고객DATA_대화_원문매핑.json>) · [해당 고객 JSON](<../../../active/display-data/C01-03.json>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/active/display-data/C01-03.json)

입력 위치: `customers[2]` (`case_id=C01-03`). 대화 행 번호는 원본 `source_row_no`이며 고객 상담 발생 순서를 뜻하지 않는다.

**다른 GPT 세션에서 사용:** 이 파일 하나를 첨부하면 고객 DATA·매핑 대화 전체·선별 지식 원문을 함께 검토할 수 있다. 원문 Git 링크는 `41ae9a4` 커밋에 고정했다. 인용의 문장은 그대로이며 상대 이미지 경로만 이 파일 위치에 맞췄다. GitHub 접근 권한과 사내 게시글 로그인은 별도다.

## 1. S1 작성 재료 — 고객 데이터와 세그먼트

| 항목 | 입력 데이터 | 데이터 위치 |
|---|---|---|
| 고객 | 이준호 · 41세 · 적극투자형 · 재직 | `/customer`, `/에이전트맥락데이터/고객계획` |
| 계좌 | 125,000,000원 · 표시 1년 수익률 13.7% | `/irpAccount` |
| 납입 | 올해 당행 개인부담금 9,000,000원 · 타 연금계좌 0원 · 공제잔여 표시값 0원 | `/에이전트맥락데이터/납입및세제` |
| 재원 | 퇴직급여 0원 · 개인부담금 125,000,000원 | 같은 절의 재원 필드 |
| 디폴트옵션 | 등록 · 알파드림 · 미적용 | `/customer/defaultOption` |
| 연금개시 | 요건충족 표시값 False · 개시 False | `/에이전트맥락데이터/퇴직및인출` |

표시값과 대화·제도자료가 충돌하는 항목은 아래 검토사항에 남겼다. 표시값을 임의로 교정하지 않았다.

세그먼트 정의: [뱃지 카탈로그](<../../BADGE_CATALOG.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/review/BADGE_CATALOG.md). 뱃지는 현재 상태이며 그 자체가 자동 추천 결론은 아니다.

| 세그먼트 원문 | 사실 근거와 연결할 지식 |
|---|---|
| 만기자금 미운용 | 9/10 만기 4,050만원·19일 경과. K-CASH·K-DO-PENDING으로 실제 상환/주문 상태부터 확인. |
| 투자성향-DO불일치 | 적극투자형-저위험 DO 차이. 기존 글로벌·미국 성장자산 비중과 함께 미래 설정의 역할을 검토. |

| 보유상품 원문 | 평가금액 | 비중 | 데이터상 플래그 |
|---|---:|---:|---|
| 현금성자산 | 5,000,000원 | 4% | 없음 |
| 기업은행 퇴직연금 정기예금 1년 | 40,500,000원 | 32.4% | 없음 |
| 에셋플러스 글로벌 리치투게더 (주식) | 48,000,000원 | 38.4% | 없음 |
| RISE 미국나스닥100 ETF | 31,500,000원 | 25.2% | 없음 |

### 대화에서 찾은 솔루션 재료

| 대화 행 | 읽을 내용 | 이번 자료에서의 취급 |
|---|---|---|
| [행 2](#dialogue-2) | 만기 미운용·성향-DO 차이 | 실제 잔액 상태를 조회한 뒤 부분 재운용 가설로 연결. |
| [행 156](#dialogue-156) | 운용관리 타겟 | 인덱스의 타겟 아님 표기와 불일치 명시. |
| [행 107](#dialogue-107) | 세미나 안내 | 데모 행사 링크는 S5 실제 업무 링크에서 제외. |
| [행 164](#dialogue-164) | 후속 행사 링크 | 대화 기록으로만 보존. |

### 먼저 확인할 불일치·미확인 사항

- 인덱스의 “0개 — 타겟 아님”과 개별 답변·DATA 신호가 다르다. DATA와 행 2/156에 근거해 검토한다.
- 만기 4,050만원이 예금 보유행에 남아 있다. 현금 500만원에 별도 현금처럼 중복 합산하지 않는다.
- 수익률 13.7%는 비교군 12.1%보다 높다. 수익률 부진 고객처럼 설명하지 않는다.
- 개인부담금 공제잔여 0원이다. 기존 만기자금 운용을 추가납입 공제로 연결하지 않는다.

## 2. 대략적인 솔루션 방향과 S2 근거

5/28 메모의 만기자금 일부 투자 관심을 재확인한다. 만기예금의 상환·매수지시·DO 대기 상태를 확인한 후, 보수적 운용을 유지할 부분과 기존 글로벌/미국 주식 노출을 보완할 부분을 비교한다. 현재 운용과 다음 만기의 기본 설정을 각각 정리하는 방향이다.

**구성 우선순위:** 만기자금 상태 확인 → 부분 운용 의향 → 기존 노출과 비교 → 운용 실행/후속 점검.

**고객에게 확인할 사항:**

- 만기자금 중 직접 운용할 금액과 사용시점은?
- 5/28의 일부 실적배당 관심이 유지되는가?
- 글로벌·미국 자산 추가보다 다른 역할의 자산을 원하시는가?

### 기존 브리핑에서 참고할 구성

- [B02-18](<../../../active/briefing-json/B02-18.json>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/active/briefing-json/B02-18.json): DO 지정/대기/현재 운용 상태 구분. 고객 사실·금액·고객 발언은 이 사례로 옮기지 않는다.
- [B01-03](<../../../active/briefing-json/B01-03.json>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/active/briefing-json/B01-03.json): 기존 노출과 유입자금의 역할을 나누는 구성. 고객 사실·금액·고객 발언은 이 사례로 옮기지 않는다.

### 판단 논리를 보존한 기반지식

<a id="K-CASH"></a>
### K-CASH · 현금성자산의 사용계획·거래사유부터 확인

근거: [SRC-002 · 연금고객 수익률 KPI 평가대상 고객관리 시나리오](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/01_고객관리_수익률관리/연금고객_수익률KPI_고객관리_시나리오.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/01_%EA%B3%A0%EA%B0%9D%EA%B4%80%EB%A6%AC_%EC%88%98%EC%9D%B5%EB%A5%A0%EA%B4%80%EB%A6%AC/%EC%97%B0%EA%B8%88%EA%B3%A0%EA%B0%9D_%EC%88%98%EC%9D%B5%EB%A5%A0KPI_%EA%B3%A0%EA%B0%9D%EA%B4%80%EB%A6%AC_%EC%8B%9C%EB%82%98%EB%A6%AC%EC%98%A4.md#L172-L185) · L172–185 · 자료 기준 Unknown

**이 고객에게 적용할 때:** 현금성 존재와 불필요한 방치는 구분한다. 자료의 1개월 조건·교체매매/연금지급 예외를 함께 읽는다. 월별 LMS 운영은 자료 시점의 설명이다.

<!-- source-excerpt {"key": "K-CASH", "path": "knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/01_고객관리_수익률관리/연금고객_수익률KPI_고객관리_시나리오.md", "start": 172, "end": 185, "sha256": "477741b05f7fdcfe02375364ed1c97ab60c9bd0baa9b77377dc2cd55db721e4f"} -->
> ## [해피콜시] 고유계정대에 현금성자산 보유 고객
>
> **사용계획이 있는지 거래내역 등을 확인한 후 필요시 상품운용지시 권유하기**
>
> > *(말풍선) 사용계획이 있는지 미리 확인할 수 있나요?*
>
> 고유계정대에 보유중인 현금성자산이 일정기간(1개월 이상) 금액변동 없이 유지 중이고 [04-12-644] "퇴직연금 거래내역조회" 시 현금성자산 입금 사유(운용상품 매도 사유)가 "교체매매"나 "연금지급" 사유가 아닌 경우 미운용중인 자산이 있다고 안내해 보세요.
>
> #### ✅ 성공적인 상담 준비
>
> - 현금성자산(고유계정대) 적용금리 확인 ※ [04-12-642] 적립금 및 수익률 조회 > 조회구분: 고유계정대이자조회
> - 현금성자산 보유 관련 안내메시지 최근 발송내역이 있는지 확인 ※ [75-08-430] 고객별 발송조회
> - 현금성자산 100만원 이상 고객에게는 매월 관련 내용 안내 LMS가 발송되고 있어요
> - 상담시 "고유계정대" 용어는 고객에게 생소할 수 있으니 "현금성자산" 또는 "운용지시가 되지 않는 자산" 등 이해하기 쉬운 용어 사용
<!-- /source-excerpt -->

<a id="K-DO-FLOW"></a>
### K-DO-FLOW · 입금예정상품과 디폴트옵션의 역할 구분

근거: [SRC-098 · 연금왕 찐천재 마스터북 — Level 2 / 7주차 디폴트옵션 상품](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/03_영업화법_스크립트_연금왕찐천재/연금왕찐천재_마스터북_Level2_7주차_디폴트옵션상품.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/03_%EC%98%81%EC%97%85%ED%99%94%EB%B2%95_%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8_%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC/%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC_%EB%A7%88%EC%8A%A4%ED%84%B0%EB%B6%81_Level2_7%EC%A3%BC%EC%B0%A8_%EB%94%94%ED%8F%B4%ED%8A%B8%EC%98%B5%EC%85%98%EC%83%81%ED%92%88.md#L139-L150) · L139–150 · 자료 기준 2026-08 (수익률 2026-08-20 기준)

**이 고객에게 적용할 때:** 표는 교재 설명이다. 현재 자금의 입금/만기 구분, 실제 설정·통지·실행내역을 함께 확인한다.

<!-- source-excerpt {"key": "K-DO-FLOW", "path": "knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/03_영업화법_스크립트_연금왕찐천재/연금왕찐천재_마스터북_Level2_7주차_디폴트옵션상품.md", "start": 139, "end": 150, "sha256": "89124bf74ceb1aa093be17b1f86022fe4b86494aa38e25fc66d8db34a6de26a8"} -->
> ## 입금예정상품 vs 디폴트옵션 상품
>
> ### 입금예정상품? 디폴트옵션 상품?
>
> #### ✏️ 입금예정상품 vs 디폴트옵션 상품 비교
>
> | 구분 | 입금예정상품 | 디폴트옵션 상품 |
> |---|---|---|
> | 개념 | 계좌에 새로 입금될 때 자동매수 되도록 미리 지정한 상품 | 입금예정상품 설정 없이 별도의 운용 지시가 없거나, 기존 상품이 만기가 도래하여 고유대계정으로 대기중인 상태임에도 일정기간 운용지시가 없는 경우 자동매수 되도록 지정한 상품 |
> | 목적 | 입금 시 매번 운용지시를 하지 않아도 자동 매수 | 적립금이 낮은 금리(고유대계정 금리)로 방치되는 것을 방지하고 수익률을 제고 |
> | 적용 시점 | 부담금이 계좌에 입금된 익영업일(T+1) | 1) 부담금이 입금되고 별도 운용지시 없는 경우 **2주후**<br>2) 상품 만기가 지나도 별도 운용지시 없는 경우 **6주후** |
> | 선택 가능 상품 | 정기예금, ETF, 펀드 등 | 고용노동부로부터 승인을 받는 디폴트옵션 전용 포트폴리오 |
<!-- /source-excerpt -->

<a id="K-DO-PENDING"></a>
### K-DO-PENDING · 실행예정내역 조회와 직접운용 의사 확인

근거: [SRC-098 · 연금왕 찐천재 마스터북 — Level 2 / 7주차 디폴트옵션 상품](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/03_영업화법_스크립트_연금왕찐천재/연금왕찐천재_마스터북_Level2_7주차_디폴트옵션상품.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/03_%EC%98%81%EC%97%85%ED%99%94%EB%B2%95_%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8_%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC/%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC_%EB%A7%88%EC%8A%A4%ED%84%B0%EB%B6%81_Level2_7%EC%A3%BC%EC%B0%A8_%EB%94%94%ED%8F%B4%ED%8A%B8%EC%98%B5%EC%85%98%EC%83%81%ED%92%88.md#L289-L304) · L289–304 · 자료 기준 2026-08 (수익률 2026-08-20 기준)

**이 고객에게 적용할 때:** 실제 실행예정 건이 있을 때 사용하는 절차다. 미등록 고객에게 이미 실행예정 건이 있는 것처럼 적용하지 않는다.

<!-- source-excerpt {"key": "K-DO-PENDING", "path": "knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/03_영업화법_스크립트_연금왕찐천재/연금왕찐천재_마스터북_Level2_7주차_디폴트옵션상품.md", "start": 289, "end": 304, "sha256": "6a52fe727c9eea2595c9ea240401a963a97de1b7526547c1a8b55c9dc3a8a17c"} -->
> ## Case 3. 실행 안내를 받았는데, 어떻게 해야 하나요?
>
> ### 1. 실행 예정내역을 확인하세요
>
> - My Star+ [04-12-640] 상품운용내역조회에서 실행예정내역을 확인해보세요!
>
> > *(화면 이미지)* 거래구분 : **사전지정운용제도 상세조회**
>
> ### 2. 고객 의사를 확인하세요
>
> - 고객님께 디폴트옵션 상품으로 운용하실 건지, 다른 상품으로 운용하실 건지 의사를 확인해보세요!
>
> **1) 디폴트옵션 상품으로 운용하겠다고 하는 경우**
> : OO일에 자동 매수 되므로 그대로 두시면 됩니다.
>
> **2) 직접 운용하겠다고 하는 경우**
<!-- /source-excerpt -->


## 3. S3 재료 — 운용전략과 상품 매핑

예금 재운용과 자산배분형 일부 편입을 비교하되 현재 보유의 지역·자산 중복부터 본다. 확정 배분율을 만들지 않는다.

아래 상품은 고객별 **비교 후보 또는 유지할 설정**이다. 동시에 모두 매수하는 배분안이 아니다. `SRC-099`는 상품자료를 정리한 마스터로, 원 상품자료 S01~S05 파일은 이 작업에서 저장소 내 실물을 찾지 못했다. 마스터 레코드까지 대조했으며 원 상품자료 재검증·현재 판매가능 확인을 완료한 것으로 표시하지 않는다.

9월 예금금리는 2026-09-01~09-30 적용자료, 월간 펀드 성과는 2026-08-28, 판매목록 성과는 기준일 미기재다. 10월 이후 자금에 9월 금리를 약속하지 않는다. 고객별 손익과 상품 마스터의 관측성과를 섞지 않는다.

| 상품/자료 ID | 이 고객에게 연결하는 이유 | 선택 전 확인 |
|---|---|---|
| [DEP-007 · 기업은행 퇴직연금 정기예금](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md#DEP-007>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#DEP-007) | 기존 기업은행 예금의 동일 역할 재운용 비교. | 만기 상환과 현재 제공기간/금리를 조회. |
| [MF-010 · KB 드림스타 자산배분 안정형 (혼합-재간접)](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md#MF-010>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#MF-010) | 기존 성장자산과 다른 역할의 분산 후보. | 안정형 명칭이 원금보장을 의미하지 않음. 구성자산 중복·손실감내 확인. |
| [DO-006 · 불려드림II](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md#DO-006>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#DO-006) | 앞으로 기본 운용을 중위험으로 바꾸길 원할 때 비교. | 현재 저위험 지정 유지 선택과 비교; 현재 만기자금 처리와 분리. |

### 전략 적용 조건 원문

#### PM-05 · 이 고객에서의 적용

이미 실적배당을 보유하고 있어 추가 편입의 목적을 명확히 한다.

출처: [SRC-100 · PM-05](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MATCHING_KB.md#PM-05>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MATCHING_KB.md#L336-L398) · 해당 카드 L336–398. **자료 기반 기획 해석**이며 공식 업무규정과 구분한다.

> ### PM-05 · 장기 운용 + 실적배당 일부 확대
>
> **적용할 때 보는 데이터:** 장기 운용 가능금액과 기존 자산군 구성 / 현재 성향·투자경험 / 기존 글로벌 주식·채권·다자산 노출.
>
> **고객과 확인:** 몇 년 뒤부터 얼마를 사용할 계획인가? / 실제 감내할 수 있는 손실·변동성은? / 직접 상품을 고를지 펀드 내 분산운용을 선호할지?
>
> **관리방향:** 보유 원리금보장·단기자금은 필요에 따라 유지한다. 추가 실적배당 금액의 목적이 성장·자산배분 중 무엇인지 정한 뒤 기존 보유와 다른 역할을 보완한다.
>
> | 추가로 확인된 조건 | 검토 상품군/방식 |
> |---|---|
> | 은퇴시점 중심 관리형 운용 | 실제 기간에 맞는 TDF |
> | 여러 자산에 분산하는 펀드 선호 | 글로벌 자산배분/EMP |
> | 직접 주식시장 접근 희망 | 대표지수 ETF |

> **제외·유지·보류:** 위험중립형이라는 이름만으로 모든 후보가 가입 가능한 것은 아니다. 기존에 단기채가 많다면 같은 단기채 추가를 성장자산 확대라고 표현하지 않는다. 새 상품명이 늘어도 실제 투자대상이 같으면 분산 효과를 단정하지 않는다.
>
> **S3에 쓸 수 있는 관리방향 문장(기획 예시):**
>
> > 가까운 시기에 사용할 자금과 안정적으로 유지할 부분은 남겨두고, 장기 운용할 일부 자금은 TDF·다자산 펀드 또는 직접 선택한 지수형 ETF로 분산하는 방향을 검토합니다.
>
> **후속 확인:** 일시 변경·일부 변경 중 고객 의사를 확인하고 실제 변경 전 전체 자산배분을 다시 점검한다.
>
> **판단 근거:** E06:고객 질문 Case 3·원픽 가이드; S04:L24; K01:RS-01·RS-02·RS-18.  
> **기존 문서 연결:** RS-01, RS-02, RS-18, CASE 13 (RS는 K01, CASE는 K02의 버전 기준).

#### PM-15 · 이 고객에서의 적용

만기 경과와 미래 반복공백의 원인을 함께 점검한다.

출처: [SRC-100 · PM-15](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MATCHING_KB.md#PM-15>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MATCHING_KB.md#L995-L1058) · 해당 카드 L995–1058. **자료 기반 기획 해석**이며 공식 업무규정과 구분한다.

> ### PM-15 · 신규 납입금 / 만기자금의 반복 운용공백
>
> **적용할 때 보는 데이터:** 입금/만기→매수까지의 시간 흐름 / 입금 시 매수상품 지정 여부 / 만기변경예약·디폴트옵션 지정과 실제 실행 내역.
>
> **고객과 확인:** 매번 직접 결정하려고 기다리는 것인가? / 같은 방식으로 자동 매수되길 원하는가? / 신규 납입금과 만기자금에 같은 전략을 적용할 것인가?
>
> **관리방향:** 현재 현금을 한 번 운용하는 것보다 반복 공백의 원인이 되는 설정을 점검한다. 입금 시 매수상품, 만기변경예약, 디폴트옵션을 구분해 고객이 원하는 시점과 방식에 맞춘다.
>
> | 추가로 확인된 조건 | 검토 상품군/방식 |
> |---|---|
> | 원리금보장 자동운용 의향 | 입금 시 매수 가능한 정기예금 |
> | 실적배당 정기운용 의향 | 자동매수 지원을 확인한 펀드/ETF |
> | 운용지시를 놓쳤을 때의 대비 | 디폴트옵션 지정/재점검 |

> **제외·유지·보류:** 디폴트옵션이 등록됐다는 이유로 신규 납입금이 즉시 투자됐다고 판단하지 않는다. 원리금보장 전 상품이 입금 시 자동매수 가능하다고 가정하지 않는다. 의도적인 현금 대기를 무조건 방치로 분류하지 않는다.
>
> **S3에 쓸 수 있는 관리방향 문장(기획 예시):**
>
> > 입금과 만기 이후 매수가 반복해서 지연되는 원인을 확인하고, 신규 입금 시 매수상품 지정·만기 변경예약·디폴트옵션의 역할을 나눠 고객의 운용의사가 실제 설정에 반영되도록 점검합니다.
>
> **후속 확인:** 실행 예정인 디폴트옵션이 있다면 고객 의사 확인 후 실행 유지/실행 전 직접운용을 구분한다.
>
> **판단 근거:** E07:입금예정상품 비교·실행 FAQ; E08:원리금보장 거래·원픽 가이드; K02:CASE 22·23.  
> **기존 문서 연결:** RS-16, RS-17, CASE 22, CASE 23 (RS는 K01, CASE는 K02의 버전 기준).


### 상품 마스터 원문 레코드

후보의 구성·위험·가용성·출처를 생략하지 않도록 원문 레코드를 접어두었다. `runtime_verified: false` 상태도 보존한다.

<details><summary>DEP-007 원문 레코드 · L552–613</summary>

[상품 원문](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#L552-L613)

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

</details>

<details><summary>MF-010 원문 레코드 · L4492–4557</summary>

[상품 원문](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#L4492-L4557)

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

</details>

<details><summary>DO-006 원문 레코드 · L7870–7970</summary>

[상품 원문](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#L7870-L7970)

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

</details>


## 4. S4 재료 — 영업화법 원문

T-MATDIV의 일부 분산 논리를 참고하되 이미 만기가 지났으므로 “다가올 만기예약” 도입은 변경한다. DO 화법에서는 미등록 권유가 아니라 현재 지정의 재확인으로 시작한다.

아래 인용은 **저장소 MD의 해당 구간을 문장 수정 없이 발췌**했다. PDF/영상 자체를 다시 대조한 결과와 구분한다. 문서의 설명·예시 고객 반응은 실제 고객 발언이 아니다. 고객용 최종 화법은 작성자가 호칭·날짜·금액·상품 및 적용 조건을 맞춰 편집한다.

<a id="T-MATDIV"></a>
### T-MATDIV · 만기자금 일부 분산 제안 → 상품선택 부담 → 후속안내

근거: [SRC-002 · 연금고객 수익률 KPI 평가대상 고객관리 시나리오](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/01_고객관리_수익률관리/연금고객_수익률KPI_고객관리_시나리오.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/01_%EA%B3%A0%EA%B0%9D%EA%B4%80%EB%A6%AC_%EC%88%98%EC%9D%B5%EB%A5%A0%EA%B4%80%EB%A6%AC/%EC%97%B0%EA%B8%88%EA%B3%A0%EA%B0%9D_%EC%88%98%EC%9D%B5%EB%A5%A0KPI_%EA%B3%A0%EA%B0%9D%EA%B4%80%EB%A6%AC_%EC%8B%9C%EB%82%98%EB%A6%AC%EC%98%A4.md#L144-L168) · L144–168 · 자료 기준 Unknown

**이 고객에게 적용할 때:** 일부 실적배당 의향이 확인될 때 사용하는 화법. 만기 경과 고객은 예약거래 대목을 즉시 변경/운용 절차로 편집하며 이미 동의했다고 가정하지 않는다.

<!-- source-excerpt {"key": "T-MATDIV", "path": "knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/01_고객관리_수익률관리/연금고객_수익률KPI_고객관리_시나리오.md", "start": 144, "end": 168, "sha256": "f71391788bfd55f04a65daf0685134a665b903e36ff734f20754ee5ad92177e1"} -->
> #### 상담 대화 (해피콜)
>
> **[행원]** 안녕하세요, KB국민은행 000지점 000팀장(팀원)입니다. 저희 국민은행에 가입하신 퇴직연금 관련해서 안내드릴 사항이 있어 전화드렸습니다! 잠시 통화 가능하세요?
>
> **[고객]** 네~ 무슨 일이시죠?
>
> **[행원]** 보유하신 퇴직연금 DC/기업형IRP/개인형IRP 계좌에 이번달(다음달) 만기되는 정기예금이 있으시네요~ (필요시)ㅇㅇ은행(일반) 정기예금으로 금액은 총 ㅇㅇ원입니다.
>
> **[고객]** 네~ 알고 있어요.
>
> **[행원]** 만기 후 펀드 같은 상품을 일부 운용해 보시는건 어떻게 생각하세요? 지금 시장이 불안정하고 손실 날 가능성도 있지만 일부금액을 포트폴리오 차원으로 운용하시면 정기예금으로만 운용하실 때보다 높은 수익률을 기대하실 수 있어요. 퇴직연금은 미래 은퇴 후 사용할 자산이니 좀더 길게 보시고 포트폴리오로 운용해 보시는 것이 좋을 거 같아요.
>
> **[고객]** 펀드는 어떻게 좋은선택하기가 너무 어려워서요.
>
> **[행원]** 국민은행에서는 전문가들로 구성된 상품선정 및 자산배분 회의를 통해 매월 고객님들께 개별펀드와 포트폴리오상품을 추천해드리고 있어요. 그중에 고객님의 투자성향과 관심분야 등에 맞는 상품을 골라 운용해 보시는건 어떠실까요?
>
> **[고객] ① 네, 한번 해볼게요.**
>
> **[행원]** 그러시면 통화종료 후에 고객님께 문자메시지로 만기상품 예약변경 거래를 하실 수 있는 스타뱅킹 URL 링크를 보내드리겠습니다. 만기 한달 전부터 예약거래가 가능하시니 URL로 접속하셔서 지금 예약거래를 하실 수 있습니다. 퇴직연금 상품 검색시 'TDF상품' 이나 '추천상품' 테마에 접속하시면 관련 상품을 찾으실 수 있을 거에요.
>
> > *\* [75-08-110] 개인고객용메시지발송시 발송콘텐츠: 마케팅(상품) > 노후은퇴 > 만기상품예약변경 안내 선택*
>
> **[고객] ② 생각 좀 해볼게요.**
>
> **[행원]** 아무래도 많이 운용해보신 상품이 아니라 생각하실 시간이 필요하실 거에요. 궁금한 점 있으시면 언제든지 연락 주시고, 인터넷뱅킹 또는 스타뱅킹을 통해서도 관련상품에 대한 정보를 찾아보실 수 있으니 참고해주세요.
<!-- /source-excerpt -->

<a id="T-DO"></a>
### T-DO · 디폴트옵션: 거부감 낮추기 → 신뢰 → 고객 선택권

근거: [SRC-098 · 연금왕 찐천재 마스터북 — Level 2 / 7주차 디폴트옵션 상품](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/03_영업화법_스크립트_연금왕찐천재/연금왕찐천재_마스터북_Level2_7주차_디폴트옵션상품.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/03_%EC%98%81%EC%97%85%ED%99%94%EB%B2%95_%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8_%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC/%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC_%EB%A7%88%EC%8A%A4%ED%84%B0%EB%B6%81_Level2_7%EC%A3%BC%EC%B0%A8_%EB%94%94%ED%8F%B4%ED%8A%B8%EC%98%B5%EC%85%98%EC%83%81%ED%92%88.md#L214-L228) · L214–228 · 자료 기준 2026-08 (수익률 2026-08-20 기준)

**이 고객에게 적용할 때:** 세 단계 설명과 비유를 보존한다. 승인·안전장치는 원금보장을 뜻하지 않으며, 이미 등록된 고객은 미등록 권유 대신 현재 설정 점검으로 도입을 바꾼다.

<!-- source-excerpt {"key": "T-DO", "path": "knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/03_영업화법_스크립트_연금왕찐천재/연금왕찐천재_마스터북_Level2_7주차_디폴트옵션상품.md", "start": 214, "end": 228, "sha256": "c63c42fcd1f521912bf54f3dbd0f07b5a00e11fe5b51bdf511a0341f0a5bd226"} -->
> ### 생소해서 싫어요!
>
> #### ✏️ 디폴트옵션 상품에 대한 생소함과 막연한 거부감을 해소해드리는 상담 논리
>
> **1단계: 거부감 낮추기** *(단순 등록 절차 X / 나의 권리 O)*
>
> > 고객님. 디폴트옵션 상품이 원치 않는 상품에 강제로 가입되는 건 아닌지 걱정하실 수 있습니다. 그러나 이건 계좌 개설 시 적당히 넘겨버리는 불필요한 절차가 아닙니다. 고객님의 바쁜 일상 때문에 만기가 된 연금자산을 잊고 방치하더라도, 스스로 일하게 만드는 안전장치입니다.
>
> **2단계: 신뢰감 높이기** *(국가 검증 & 투명한 성과 공시)*
>
> > 특히 아무 상품이나 지정하는 것이 아닌, 고용노동부와 금융감독원이 꼼꼼하게 심사하고 승인한 엄선된 포트폴리오입니다. 또한 디폴트옵션 운용 성과와 수익률의 경우 매분기 투명하게 공시되고 있기 때문에, 저희 국민은행에서도 가장 신경 써서 수익률을 관리하고 있는 대표 상품입니다.
>
> **3단계: 주도권 부여** *(투자성향에 맞춘 맞춤 설정)*
>
> > 아무거나 선택하시기 보다는, 오늘 확인하신 고객님의 투자성향에 맞는 포트폴리오로 직접 골라 두시는 것이 유리합니다. 원리금보장형부터 TDF가 포함된 포트폴리오까지 다양하게 준비되어있으니, 고객님의 자산관리 목표에 잘 맞는 옷으로 입혀 두시는 것을 추천드립니다.
<!-- /source-excerpt -->


## 5. S5 재료 — 단말 업무와 Hot Tip

### 단말 업무화면

| 화면번호 | 자료상 화면명 | 이 고객에서 쓸 목적·순서 | 근거 |
|---|---|---|---|
| `04-12-644` | 거래내역 조회 | 9/10 만기 상환과 현금 유입 이력 대조. | [SRC-027 L74](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L74) |
| `04-12-640` | 상품운용내역조회 | 상환 후 운용지시/DO 실행 상태 확인. | [SRC-027 L68](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L68) |
| `06-12-918` | 디폴트옵션 대기자금 관리 | 실제 DO 대기자금·실행예정 건 확인. | [SRC-027 L70](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L70) |
| `04-12-17A` | New퇴직연금상품조회 | 동일 역할 예금과 분산 후보의 현재 조건 조회. | [SRC-003 L803](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/02_마케팅_캠페인/개인형IRP_마케팅_보물지도_Vol1.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/02_%EB%A7%88%EC%BC%80%ED%8C%85_%EC%BA%A0%ED%8E%98%EC%9D%B8/%EA%B0%9C%EC%9D%B8%ED%98%95IRP_%EB%A7%88%EC%BC%80%ED%8C%85_%EB%B3%B4%EB%AC%BC%EC%A7%80%EB%8F%84_Vol1.md#L803) |
| `06-12-611` | 보유상품변경 | 고객이 선택한 만기자금의 현재 운용 변경. | [SRC-027 L67](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L67) |
| `06-12-610` | 입금예정상품 등록/변경 | 향후 입금예정상품/DO 설정 확인. | [SRC-027 L66](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L66) |
| `04-12-660` | 상담연계등록 | 지원이 필요한 경우 상담 연계. | [SRC-069 L28](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/posts/2025-11-13_203924_IRP상품운용변경 다들 어떻게 하시나요.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2025-11-13_203924_IRP%EC%83%81%ED%92%88%EC%9A%B4%EC%9A%A9%EB%B3%80%EA%B2%BD%20%EB%8B%A4%EB%93%A4%20%EC%96%B4%EB%96%BB%EA%B2%8C%20%ED%95%98%EC%8B%9C%EB%82%98%EC%9A%94.md#L28) |

화면번호는 저장소 자료와 대조한 업무 참조다. 사내 단말 접속·화면 실행은 하지 않았다. `04-12-179`(기존 화면안내)와 `04-12-17A`(New 화면 표기)는 각 출처의 표기를 유지한다.

### Hot Tip 원문과 고객별 활용

#### Hot Tip #203924 · IRP상품운용변경 다들 어떻게 하시나요?

[사내 게시글 원문](https://lxp.kbstar.com/app/board/hottip-my/view/203924.22BF37852DCF86D972481099E57E925D71298EDD0AE8C067C35C757116253E23) · [저장소 MD](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/posts/2025-11-13_203924_IRP상품운용변경 다들 어떻게 하시나요.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2025-11-13_203924_IRP%EC%83%81%ED%92%88%EC%9A%B4%EC%9A%A9%EB%B3%80%EA%B2%BD%20%EB%8B%A4%EB%93%A4%20%EC%96%B4%EB%96%BB%EA%B2%8C%20%ED%95%98%EC%8B%9C%EB%82%98%EC%9A%94.md) · 게시일 2025-11-13

**연결 이유:** 미운용자금을 실제 변경으로 이어갈 채널 안내.

<a id="H-MANAGE-A"></a>
#### H-MANAGE-A · 운용변경 지원과 ETF 직접매수의 구분

근거: [SRC-069 · IRP상품운용변경 다들 어떻게 하시나요?](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/posts/2025-11-13_203924_IRP상품운용변경 다들 어떻게 하시나요.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2025-11-13_203924_IRP%EC%83%81%ED%92%88%EC%9A%B4%EC%9A%A9%EB%B3%80%EA%B2%BD%20%EB%8B%A4%EB%93%A4%20%EC%96%B4%EB%96%BB%EA%B2%8C%20%ED%95%98%EC%8B%9C%EB%82%98%EC%9A%94.md#L14-L20) · L14–20 · 자료 기준 2025-11-13

**이 고객에게 적용할 때:** 직원 경험담. 전화 변경 지원은 원문상 정기예금·고유대 대상이며 ETF 직접 매수와 구분된다. 펀드까지 전화로 일괄 변경된다고 확장하지 않는다.

<!-- source-excerpt {"key": "H-MANAGE-A", "path": "knowledge/corpus/03_스타런_영업점_Hottip/posts/2025-11-13_203924_IRP상품운용변경 다들 어떻게 하시나요.md", "start": 14, "end": 20, "sha256": "23671bdd5b7dc29c03112d594892b95381e54331d36dd422e70175dd53749de5"} -->
> 안녕하세요 ~퇴직연금 상품 운용변경 요즘 핫하죠?
>
> 퇴직연금전용상담센터 ==1599-0099== 정기예금,고유대 상품에 한하여 전화상담을 통해 운용방법 변경도 가능합니다
>
> 또 고객님이 직접전화연락 ==1833-3700==(퇴직연금자산관리 컨설팅 센터)으로도 가능하구요 .
>
> ETF 매수는 현금성 자산으로 된 상태에서 고객님이 직접 매수~~~방법은 아래에 간단히 !!!
<!-- /source-excerpt -->

<a id="H-MANAGE-B"></a>
#### H-MANAGE-B · 상담연계등록 후 후속 연락

근거: [SRC-069 · IRP상품운용변경 다들 어떻게 하시나요?](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/posts/2025-11-13_203924_IRP상품운용변경 다들 어떻게 하시나요.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2025-11-13_203924_IRP%EC%83%81%ED%92%88%EC%9A%B4%EC%9A%A9%EB%B3%80%EA%B2%BD%20%EB%8B%A4%EB%93%A4%20%EC%96%B4%EB%96%BB%EA%B2%8C%20%ED%95%98%EC%8B%9C%EB%82%98%EC%9A%94.md#L28-L30) · L28–30 · 자료 기준 2025-11-13

**이 고객에게 적용할 때:** 원문의 익영업일 순차 연락은 당시 운영 안내이며 확정 연락시각을 약속하지 않는다.

<!-- source-excerpt {"key": "H-MANAGE-B", "path": "knowledge/corpus/03_스타런_영업점_Hottip/posts/2025-11-13_203924_IRP상품운용변경 다들 어떻게 하시나요.md", "start": 28, "end": 30, "sha256": "c9e483e4b7fd749df053f57256bf94f423f635cff3c64167ba3703e40703de7c"} -->
> MyStar 04-12-660-상담연계등록-신규등록--상담신청 후
>
> 익영업일부터 순차적으로 퇴직연금 자산관리 컨설팅센터에서 고객에서 연락 드리니 이것도 참고 하시면 좋을 것 같아요 ~~^^
<!-- /source-excerpt -->


Hot Tip 링크는 원문 MD에 기록된 주소 그대로다. 로그인 접근·현재 업무 유효성은 검증하지 않았다. 현장 경험담의 절차는 본부 화면자료와 대조하여 사용한다.

## 6. 출처 목록

| Source ID | 자료 | 성격·기준시점 |
|---|---|---|
| SRC-002 | [연금고객 수익률 KPI 평가대상 고객관리 시나리오](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/01_고객관리_수익률관리/연금고객_수익률KPI_고객관리_시나리오.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/01_%EA%B3%A0%EA%B0%9D%EA%B4%80%EB%A6%AC_%EC%88%98%EC%9D%B5%EB%A5%A0%EA%B4%80%EB%A6%AC/%EC%97%B0%EA%B8%88%EA%B3%A0%EA%B0%9D_%EC%88%98%EC%9D%B5%EB%A5%A0KPI_%EA%B3%A0%EA%B0%9D%EA%B4%80%EB%A6%AC_%EC%8B%9C%EB%82%98%EB%A6%AC%EC%98%A4.md) | Official / Internal Guide / Internal · Unknown |
| SRC-003 | [개인형IRP 마케팅 보물지도](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/02_마케팅_캠페인/개인형IRP_마케팅_보물지도_Vol1.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/02_%EB%A7%88%EC%BC%80%ED%8C%85_%EC%BA%A0%ED%8E%98%EC%9D%B8/%EA%B0%9C%EC%9D%B8%ED%98%95IRP_%EB%A7%88%EC%BC%80%ED%8C%85_%EB%B3%B4%EB%AC%BC%EC%A7%80%EB%8F%84_Vol1.md) | Official / Internal Guide / Internal · 2026-03 |
| SRC-027 | [퇴직연금 주요거래 화면번호 안내](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md) | Reference / Internal · Unknown |
| SRC-069 | [IRP상품운용변경 다들 어떻게 하시나요?](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/posts/2025-11-13_203924_IRP상품운용변경 다들 어떻게 하시나요.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2025-11-13_203924_IRP%EC%83%81%ED%92%88%EC%9A%B4%EC%9A%A9%EB%B3%80%EA%B2%BD%20%EB%8B%A4%EB%93%A4%20%EC%96%B4%EB%96%BB%EA%B2%8C%20%ED%95%98%EC%8B%9C%EB%82%98%EC%9A%94.md) | Field Know-how / Experiential · 2025-11-13 |
| SRC-098 | [연금왕 찐천재 마스터북 — Level 2 / 7주차 디폴트옵션 상품](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/03_영업화법_스크립트_연금왕찐천재/연금왕찐천재_마스터북_Level2_7주차_디폴트옵션상품.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/03_%EC%98%81%EC%97%85%ED%99%94%EB%B2%95_%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8_%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC/%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC_%EB%A7%88%EC%8A%A4%ED%84%B0%EB%B6%81_Level2_7%EC%A3%BC%EC%B0%A8_%EB%94%94%ED%8F%B4%ED%8A%B8%EC%98%B5%EC%85%98%EC%83%81%ED%92%88.md) | Training Material / Internal · 2026-08 (수익률 2026-08-20 기준) |
| SRC-099 | [PRODUCT_MASTER — 개인형IRP 브리핑용 상품 마스터](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md) | Product Data / Internal · 2026-09-10 (금리 2026-09 적용, 추천펀드 성과 2026-08-28 기준, 판매목록 기준일 미기재) |
| SRC-100 | [PRODUCT_MATCHING_KB — 고객상황 → 상품 후보 매핑](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MATCHING_KB.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MATCHING_KB.md) | Product Data / Internal · 2026-09-10 (수치는 SRC-099 마스터의 읽기용 요약) |

## 7. 고객 데이터·대화 원문 부록

<details><summary>대화 자료의 고객 인덱스 원문 — 열 의미를 임의 추정하지 않음</summary>

```json
{
  "raw_row": "이준호 198734-1205842 41 적극투자형 – 있음 0 설정 1 (0개 — 타겟 아님)",
  "name": "이준호",
  "customer_id": "198734-1205842",
  "age": 41,
  "investment_profile": "적극투자형",
  "isa_maturity_flag_raw": "–",
  "unlabeled_source_column_6": "있음",
  "tax_deduction_remaining_raw": "0",
  "default_option_status_raw": "설정",
  "unlabeled_source_column_9": 1,
  "target_code_text_raw": "(0개 — 타겟 아님)",
  "target_codes": []
}
```

</details>

<details><summary>고객 DATA 전체 — 입력 JSON의 display_data 그대로</summary>

```json
{
  "schemaVersion": "customer-briefing-display.v0.1",
  "briefingMeta": {
    "caseId": "C01-03",
    "dataType": "시연용가상고객",
    "asOfDate": "2026-09-29",
    "generatedAt": "2026-09-29T07:00:00+09:00",
    "currency": "KRW"
  },
  "customer": {
    "customerId": "198734-1205842",
    "name": "이준호",
    "age": 41,
    "gender": "남",
    "starClubGrade": "VIP",
    "investmentProfile": "적극투자형",
    "irpOpenedAt": "2020-03-02",
    "defaultOption": {
      "registrationStatus": "등록",
      "designatedProduct": {
        "productId": "DO-002",
        "productName": "알파드림",
        "riskLevel": "저위험"
      },
      "applicationStatus": "미적용"
    }
  },
  "signals": [
    {
      "source": "동료 IRP Agent 시연 데이터(9 Cases v3)",
      "label": "만기자금 미운용",
      "date": "2026-09-10"
    },
    {
      "label": "투자성향-DO불일치",
      "source": "동료 IRP Agent 시연 데이터(9 Cases v3)"
    }
  ],
  "irpAccount": {
    "valuationAmountKrw": 125000000,
    "assetAllocation": [
      {
        "assetType": "원리금보장형",
        "amountKrw": 40500000,
        "weightPct": 32.4
      },
      {
        "assetType": "실적배당형",
        "amountKrw": 79500000,
        "weightPct": 63.6
      },
      {
        "assetType": "현금성자산",
        "amountKrw": 5000000,
        "weightPct": 4
      }
    ],
    "oneYearReturnPct": 13.7,
    "taxDeductionRemainingKrw": 0,
    "latestProductOpening": {
      "holdingId": "H002",
      "productId": "DEP-007",
      "productName": "기업은행 퇴직연금 정기예금 1년",
      "openedAt": "2025-09-10",
      "amountKrw": 40500000
    }
  },
  "holdings": [
    {
      "holdingId": "H001",
      "productId": null,
      "productName": "현금성자산",
      "assetType": "현금성자산",
      "productCategory": "현금성자산",
      "contractTerm": null,
      "valuationAmountKrw": 5000000,
      "weightPct": 4,
      "oneYearReturnPct": null,
      "openedAt": "2020-03-02",
      "allocationBreakdown": null,
      "flags": []
    },
    {
      "holdingId": "H002",
      "productId": "DEP-007",
      "productName": "기업은행 퇴직연금 정기예금 1년",
      "assetType": "원리금보장형",
      "productCategory": "정기예금",
      "contractTerm": "1년",
      "valuationAmountKrw": 40500000,
      "weightPct": 32.4,
      "oneYearReturnPct": 2.8,
      "openedAt": "2025-09-10",
      "allocationBreakdown": null,
      "flags": []
    },
    {
      "holdingId": "H003",
      "productId": "MF-006",
      "productName": "에셋플러스 글로벌 리치투게더 (주식)",
      "assetType": "실적배당형",
      "productCategory": "주식형펀드",
      "contractTerm": null,
      "valuationAmountKrw": 48000000,
      "weightPct": 38.4,
      "oneYearReturnPct": 20,
      "openedAt": "2024-08-05",
      "allocationBreakdown": null,
      "flags": []
    },
    {
      "holdingId": "H004",
      "productId": null,
      "productName": "RISE 미국나스닥100 ETF",
      "assetType": "실적배당형",
      "productCategory": "ETF",
      "contractTerm": null,
      "valuationAmountKrw": 31500000,
      "weightPct": 25.2,
      "oneYearReturnPct": 26,
      "openedAt": "2025-02-07",
      "allocationBreakdown": null,
      "flags": []
    }
  ],
  "에이전트맥락데이터": {
    "스키마버전": "customer-agent-context.v0.1",
    "고객계획": {
      "재직상태": "재직"
    },
    "납입및세제": {
      "올해개인부담금납입액원": 9000000,
      "개인부담금납입이력": [
        {
          "연도": 2023,
          "납입금액원": 9000000
        },
        {
          "연도": 2024,
          "납입금액원": 9000000
        },
        {
          "연도": 2025,
          "납입금액원": 9000000
        }
      ],
      "타연금계좌올해납입액원": 0,
      "세액공제기준한도원": 9000000,
      "세액공제잔여한도원": 0,
      "퇴직급여재원금액원": 0,
      "개인부담금재원금액원": 125000000
    },
    "계좌운영": {
      "디폴트옵션": {
        "등록여부": true,
        "위험등급": "저위험"
      },
      "입금시매수상품": {
        "설정여부": true,
        "지정상품": []
      },
      "최근운용지시일": "2026-06-20",
      "최근상품매매일": "2026-06-20",
      "최근입금일": "2026-06-15",
      "최근1년상품매매횟수": 5,
      "만기후운용설정": {
        "설정여부": false,
        "지정상품": []
      }
    },
    "퇴직및인출": {
      "연금수령요건충족여부": false,
      "연금개시여부": false,
      "연금지급설계등록여부": false
    },
    "최근사건": [
      {
        "이벤트식별자": "T001",
        "발생일시": "2026-09-10T00:00:00+09:00",
        "이벤트유형": "상품만기(운용지시 대기)",
        "계좌구분": "IRP",
        "관련보유상품식별자": "H002",
        "금액원": 40500000,
        "처리상태": "만기경과·미운용",
        "채널": null
      }
    ],
    "금융거래": [],
    "상담이력": [
      {
        "상담식별자": "CRM001",
        "상담일시": "2026-05-28T00:00:00+09:00",
        "상담채널": null,
        "상담유형": "퇴직연금사후관리",
        "상담메모": "정기예금 만기 시점에 일부 금액을 실적배당상품으로 전환하는 방안에 관심을 보임."
      }
    ],
    "외부계좌": [],
    "투자성향이력": [
      {
        "이력식별자": "R001",
        "분석일": "2026-05-20",
        "투자성향": "적극투자형",
        "현재여부": true
      }
    ],
    "운용정책": {
      "관리기준": {
        "현금성자산과다비중": 50,
        "원리금보장편중비중": 80,
        "장기미운용개월수": 12,
        "출처": "동료 IRP Agent 룰베이스(현금성 50% 이상·원리금보장 합산 80% 이상 TG-202·운용변경 없음 12개월+)"
      }
    },
    "상품진단": [],
    "계산지표": [
      {
        "지표식별자": "M001",
        "지표유형": "파생값",
        "지표명": "현금성자산비중",
        "대상참조": null,
        "값": 4,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M002",
        "지표유형": "파생값",
        "지표명": "원리금보장·현금성자산합산비중",
        "대상참조": null,
        "값": 36.4,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M003",
        "지표유형": "파생값",
        "지표명": "위험자산(실적배당형)비중",
        "대상참조": null,
        "값": 63.6,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M004",
        "지표유형": "파생값",
        "지표명": "동연령대평균수익률",
        "대상참조": null,
        "값": 12.1,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M005",
        "지표유형": "파생값",
        "지표명": "동연령대상위1%평균수익률",
        "대상참조": null,
        "값": 31.8,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M006",
        "지표유형": "파생값",
        "지표명": "동연령대상위1%평균원리금보장비중",
        "대상참조": null,
        "값": 20,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M007",
        "지표유형": "기간",
        "지표명": "최근 운용변경 후 경과개월수",
        "대상참조": null,
        "값": 3.3,
        "단위": "개월",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M008",
        "지표유형": "기간",
        "지표명": "최근 상담 후 경과일수(장기 미접촉)",
        "대상참조": null,
        "값": 124,
        "단위": "일",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M009",
        "지표유형": "파생값",
        "지표명": "최근 1개월 현금성자산 증감액",
        "대상참조": null,
        "값": 1000000,
        "단위": "원",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M010",
        "지표유형": "기간",
        "지표명": "정기예금 만기 후 경과일수(운용지시 없음)",
        "대상참조": "H002",
        "값": 19,
        "단위": "일",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M011",
        "지표유형": "상태비교",
        "지표명": "현재 투자성향과 지정 디폴트옵션 위험등급 일치 여부",
        "대상참조": [
          "R001",
          "DO-002"
        ],
        "값": false,
        "단위": null,
        "산출기준일": "2026-09-29"
      }
    ],
    "확인된특이사항": [],
    "가상설정메모": [
      "동료 IRP Agent 시연 데이터(9 Cases v3)에서 옮긴 시연 데이터. 기준일 2026-09-29.",
      "성별은 시연용 가정. 9/10 만기 예금은 운용지시 없이 만기 경과 상태(동료 Agent 답변 기준)."
    ]
  }
}
```

</details>

### 고객별 매핑 대화 전체

질문과 답변은 입력 파일의 문자열을 그대로 보존했다. 포함된 세율·상품·화면번호·데모 링크가 검증되었다는 뜻은 아니다. 위 검토사항과 함께 사용한다.

<a id="dialogue-2"></a>
<details><summary>행 2 · 이 고객 왜 관리 대상으로 떴어?</summary>

매핑 방식 `explicit_name` · 확신도 `high` · 매핑 메모: 원문 답변에 고객명이 직접 명시됨

원문 세그먼트 표기: `None` · 선행/후속 원문: `None`

**질문 원문**

> 이 고객 왜 관리 대상으로 떴어?

**답변 원문**

> 이준호 고객님이 관리 대상으로 뜬 이유는 평가금액 1억 2,500만원, 운용수익률 13.7%로 동연령 평균 수익률 12.1%를 상회하고 있으나, 2026년 9월 10일 만기가 경과한 예금 4,050만원이 포함되어 있어 체계적인 포트폴리오 재점검이 필요하기 때문이에요.

</details>

<a id="dialogue-107"></a>
<details><summary>행 107 · 이 고객한테 안내할 만한 세미나 있어?</summary>

매핑 방식 `context_and_data_match` · 확신도 `high` · 매핑 메모: 적극투자형 대비 원리금보장·현금성 비중 및 세미나 답변이 164번과 일치

원문 세그먼트 표기: `None` · 선행/후속 원문: `None`

**질문 원문**

> 이 고객한테 안내할 만한 세미나 있어?

**답변 원문**

> 현재 이 고객의 요건에 맞는 세미나는 아직 준비된 자료가 없어요. 다만 열려 있는 콘텐츠 중 날짜가 가까운 세미나로는 내 투자성향에 맞는 퇴직연금 포트폴리오 찾기 세미나가 11/12(목) 17시에 KB국민은행 WM투자부 주관으로 예정되어 있어요. 이 세미나는 적극투자형 성향에 비해 원리금보장·현금성 자산 비중이 높아, 포트폴리오를 점검하고 리밸런싱할 때 참고하시기 좋은 내용이에요. 안내할 때 참고할 수 있는 링크는 https\://obank.kbstar.com/demo/seminar/irp-004 에요. 18. 이번 상담 요약·쪽지

</details>

<a id="dialogue-156"></a>
<details><summary>행 156 · 이 고객 왜 관리 대상이야?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 이준호` · 선행/후속 원문: `None`

**질문 원문**

> 이 고객 왜 관리 대상이야?

**답변 원문**

> 적극투자형 성향임에도 원리금보장·현금성 자산이 36%를 차지하고 있어 포트폴리오 재정비가 필요한 시점이고, 현재 수익률은 13.7%로 동연령 평균 12.1%를 상회하고 있으나 2026년 9월 10일 만기가 경과된 기업은행 퇴직연금 정기예금 4,050만원이 대기 중이기 때문에 관리 대상이에요.

</details>

<a id="dialogue-164"></a>
<details><summary>행 164 · 이 고객한테 안내할 만한 세미나 있어?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 이준호` · 선행/후속 원문: `None`

**질문 원문**

> 이 고객한테 안내할 만한 세미나 있어?

**답변 원문**

> 이 고객에게는 지금 요건에 맞는 안내 대상 세미나가 없어요. 다만 현재 열려 있는 세미나 중 날짜가 가장 가까운 것은 11/12(목) 17시에 KB국민은행 WM투자부에서 주관하는 «내 투자성향에 맞는 포트폴리오 찾기»예요. 이 콘텐츠는 적극투자형 성향에 비해 원리금보장·현금성 자산 비중이 높아, 포트폴리오를 점검하고 리밸런싱할 때 참고하시기 좋으나 이 고객의 요건과는 무관해요. 안내 시 참고할 링크는 https\://obank.kbstar.com/demo/seminar/irp-004 에요. 다른 이벤트나 세미나 관련해서 다른 후보 콘텐츠들에 대한 상세 요건은 아직 준비된 자료가 없어요.

</details>


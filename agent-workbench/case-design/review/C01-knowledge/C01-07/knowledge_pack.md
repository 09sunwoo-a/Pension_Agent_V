# C01-07 오세훈 · 브리핑 작성용 기반지식

**용도:** 작성자가 S1~S5 솔루션을 구성할 때 사용할 고객별 재료. 아래 솔루션 방향은 편집자의 작업 가설이며 완성 브리핑/매수 지시가 아니다.

고객 데이터 기준일: **2026-09-29** · 개별 매핑 대화 **10건** · 작성일 2026-09-21

[전체 고객 색인](<../README.md>) · [고객·대화 입력 JSON](<../../../../../C01_고객DATA_대화_원문매핑.json>) · [해당 고객 JSON](<../../../active/display-data/C01-07.json>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/active/display-data/C01-07.json)

입력 위치: `customers[6]` (`case_id=C01-07`). 대화 행 번호는 원본 `source_row_no`이며 고객 상담 발생 순서를 뜻하지 않는다.

**다른 GPT 세션에서 사용:** 이 파일 하나를 첨부하면 고객 DATA·매핑 대화 전체·선별 지식 원문을 함께 검토할 수 있다. 원문 Git 링크는 `41ae9a4` 커밋에 고정했다. 인용의 문장은 그대로이며 상대 이미지 경로만 이 파일 위치에 맞췄다. GitHub 접근 권한과 사내 게시글 로그인은 별도다.

## 1. S1 작성 재료 — 고객 데이터와 세그먼트

| 항목 | 입력 데이터 | 데이터 위치 |
|---|---|---|
| 고객 | 오세훈 · 61세 · 안정추구형 · 퇴직 | `/customer`, `/에이전트맥락데이터/고객계획` |
| 계좌 | 165,000,000원 · 표시 1년 수익률 6.2% | `/irpAccount` |
| 납입 | 올해 당행 개인부담금 9,000,000원 · 타 연금계좌 0원 · 공제잔여 표시값 0원 | `/에이전트맥락데이터/납입및세제` |
| 재원 | 퇴직급여 95,000,000원 · 개인부담금 70,000,000원 | 같은 절의 재원 필드 |
| 디폴트옵션 | 등록 · 알파드림 · 미적용 | `/customer/defaultOption` |
| 연금개시 | 요건충족 표시값 True · 개시 False | `/에이전트맥락데이터/퇴직및인출` |

표시값과 대화·제도자료가 충돌하는 항목은 아래 검토사항에 남겼다. 표시값을 임의로 교정하지 않았다.

세그먼트 정의: [뱃지 카탈로그](<../../BADGE_CATALOG.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/review/BADGE_CATALOG.md). 뱃지는 현재 상태이며 그 자체가 자동 추천 결론은 아니다.

| 세그먼트 원문 | 사실 근거와 연결할 지식 |
|---|---|
| 정기예금 만기 D-10 | SBI저축은행 예금 7,040만원·10/9 만기. PM-03·K-RATE로 만기 전 선택을 준비. |
| 연금개시 가능 | 61세·요건충족 true·미개시. 6/12의 우선 계속 운용 의향을 재확인한 뒤 K-PENSION·K-PAYMENT 연결. |

| 보유상품 원문 | 평가금액 | 비중 | 데이터상 플래그 |
|---|---:|---:|---|
| 현금성자산 | 8,000,000원 | 4.8% | 없음 |
| SBI저축은행 퇴직연금 정기예금 1년 | 70,400,000원 | 42.7% | 없음 |
| KB라이프생명 퇴직연금 디폴트옵션 이율보증형보험(3년) | 35,500,000원 | 21.5% | 없음 |
| 신한 마음편한 TDF 시리즈 | 35,100,000원 | 21.3% | 없음 |
| RISE 200 ETF | 16,000,000원 | 9.7% | 없음 |

### 대화에서 찾은 솔루션 재료

| 대화 행 | 읽을 내용 | 이번 자료에서의 취급 |
|---|---|---|
| [행 7](#dialogue-7) | 만기예금과 재운용 | 10월 실제 제공조건으로 비교할 재료. |
| [행 58](#dialogue-58) | 연금개시 절차 | 고객이 개시를 선택한 경우의 업무 순서. |
| [행 61](#dialogue-61) | 예약 화면번호 | 75-08-110 발송과 06-12-611 만기예약 구분. |
| [행 130](#dialogue-130) | DO 미등록 가정 | 실제 고객은 알파드림 등록 상태. 일반 가정으로만 보존. |

### 먼저 확인할 불일치·미확인 사항

- 6/12 메모는 연금개시 문의 후 우선 계속 운용할 의향이다. 개시 가능을 즉시 개시 동의로 바꾸지 않는다.
- 현재 DO는 등록 상태이며 미등록이라는 대화 가정과 다르다.
- 대화의 예시 상품 목록·허용등급 표는 현재 마스터나 공식 적합성 표로 확인된 자료가 아니다.
- 10/9 만기에 9월 특별금리·상품 제공을 약속하지 않는다. 공제잔여는 0원이다.

## 2. 대략적인 솔루션 방향과 S2 근거

만기 7,040만원을 재운용하기 전에 연금수령 시작 시점과 예상 생활비를 다시 묻는다. 당분간 운용을 계속한다면 사용기간에 맞는 안정 상품을 비교하고, 개시를 선택한다면 가까운 지급 재원과 장기 운용 잔액을 구분한다. 기존 펀드·ETF는 필요 없이 전액 매도하는 전제로 삼지 않는다.

**구성 우선순위:** 연금수령 의향·일정 → 만기자금 사용기간 → 재운용/지급 재원 비교 → 예약 또는 개시 절차.

**고객에게 확인할 사항:**

- 6/12 이후 연금수령 시작 계획이 바뀌었는가?
- 월 생활비 필요액과 다른 소득은?
- 만기자금 중 지급에 쓸 부분과 계속 운용할 부분은?

### 기존 브리핑에서 참고할 구성

- [B03-07](<../../../active/briefing-json/B03-07.json>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/active/briefing-json/B03-07.json): 만기 상품 조건과 실제 사용기간 비교. 고객 사실·금액·고객 발언은 이 사례로 옮기지 않는다.
- [B05-09](<../../../active/briefing-json/B05-09.json>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/active/briefing-json/B05-09.json): 연금 지급계획을 상품 운용과 연결. 고객 사실·금액·고객 발언은 이 사례로 옮기지 않는다.

### 판단 논리를 보존한 기반지식

<a id="K-PENSION"></a>
### K-PENSION · 연금개시 요건·퇴직급여 예외·수령방법

근거: [SRC-003 · 개인형IRP 마케팅 보물지도](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/02_마케팅_캠페인/개인형IRP_마케팅_보물지도_Vol1.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/02_%EB%A7%88%EC%BC%80%ED%8C%85_%EC%BA%A0%ED%8E%98%EC%9D%B8/%EA%B0%9C%EC%9D%B8%ED%98%95IRP_%EB%A7%88%EC%BC%80%ED%8C%85_%EB%B3%B4%EB%AC%BC%EC%A7%80%EB%8F%84_Vol1.md#L248-L264) · L248–264 · 자료 기준 2026-03

**이 고객에게 적용할 때:** 퇴직급여가 포함된 경우의 가입기간 예외를 함께 보존한다. 고객 JSON의 요건 불충족 플래그와 충돌하면 원장을 확인할 쟁점으로 남긴다.

<!-- source-excerpt {"key": "K-PENSION", "path": "knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/02_마케팅_캠페인/개인형IRP_마케팅_보물지도_Vol1.md", "start": 248, "end": 264, "sha256": "a1283341119810d8ed4c429c956f7dba35aedc593b4c39d224621eda50561df9"} -->
> ### 연금으로 수령하기 위한 자격 요건
>
> 아래 두 가지 모두 충족 시 연금수령 개시 가능해요!
>
> ① 만 55세 이상
>
> ② 연금계좌 가입일\*로 부터 연금수령 신청일까지 5년 이상 경과 (\*연금 납입액이 최초로 입금된 일자)
>
> 퇴직급여가 포함된 경우에는 5년이 경과되지 않더라도 만 55세 조건만 충족되면 즉시 연금 수령이 가능해요!
>
> ### 연금수령방식 3가지
>
> | 구 분 | 수령기간 | 수령금액 | 비 고 |
> | --- | --- | --- | --- |
> | 기간지정 | 고정 | 변동 | 방식 간 변경 가능 |
> | 금액지정 | 변동 | 고정 | |
> | 자유인출 | 최소 연금수령기간 이상 | 고객 지정 | |
<!-- /source-excerpt -->

<a id="K-PAYMENT"></a>
### K-PAYMENT · 연금지급 가능 상품과 일반/특별중도해지 구분

근거: [SRC-097 · 연금왕 찐천재 마스터북 — Level 2 / 5주차 원리금보장상품](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/03_영업화법_스크립트_연금왕찐천재/연금왕찐천재_마스터북_Level2_5주차_원리금보장상품.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/03_%EC%98%81%EC%97%85%ED%99%94%EB%B2%95_%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8_%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC/%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC_%EB%A7%88%EC%8A%A4%ED%84%B0%EB%B6%81_Level2_5%EC%A3%BC%EC%B0%A8_%EC%9B%90%EB%A6%AC%EA%B8%88%EB%B3%B4%EC%9E%A5%EC%83%81%ED%92%88.md#L175-L196) · L175–196 · 자료 기준 2026-08 (금리 2026.07~08 기준)

**이 고객에게 적용할 때:** 자료상 기관별 조건을 보존하되 모든 예금·GIC·ELB에 같은 조건을 확장하지 않는다. 정확한 보유상품 약관과 지급사유를 조회한다.

<!-- source-excerpt {"key": "K-PAYMENT", "path": "knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/03_영업화법_스크립트_연금왕찐천재/연금왕찐천재_마스터북_Level2_5주차_원리금보장상품.md", "start": 175, "end": 196, "sha256": "eaef05da07e9d45d0acbede77a2b2ebb1eea1fa223df33809e2897d8c07d69b4"} -->
> ## 연금지급 관련 상품선택 유의사항
>
> ### ELB는 **연금지급 가능여부**를 확인 필수
>
> **연금 수령(예정) 고객이라면, ELB 상담 전 연금 지급 가능 여부를 확인하세요.**
>
> **파생결합사채(ELB)**
>
> | 상품기관 | 메리츠증권 | KYOBO 교보증권 | IBK 투자증권 |
> |---|---|---|---|
> | 신용등급 | AA | AA- | AA- |
> | **연금지급** | **가능** | **불가능** | **불가능** |
> | 예금자 보호 | 비대상 | 비대상 | 비대상 |
>
> > **Q.** 연금개시를 해서 만기전에 상품을 해지하게 되면, **중도해지이율**이 적용되나요?
>
> > 🐰 아닙니다! 연금 지급의 사유로 상품을 만기전에 해지하는 경우, **특별중도해지**라는 제도를 통해 약정 금리를 일할 계산해서 지급해드려요. 그래서 연금지급으로 인한 인출 시에는 만기전에 해지하는 일반 중도해지와는 달라요!
>
> | 구분 | 일반중도해지 | 특별중도해지 |
> |---|---|---|
> | 개념 | 개인 사정으로 만기 전에 임의해지하는 경우 | 법령이 정한 불가피한 사유(연금지급 등)로 해지하는 경우 |
> | 이율 | 중도해지 패널티 이율 적용<br>(약정이율의 50~90% 수준) | 약정이율 적용<br>(중도해지 불이익 없이 이자지급) |
<!-- /source-excerpt -->

<a id="K-RATE"></a>
### K-RATE · 예금·GIC의 단리·복리 비교 논리와 사례

근거: [SRC-097 · 연금왕 찐천재 마스터북 — Level 2 / 5주차 원리금보장상품](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/03_영업화법_스크립트_연금왕찐천재/연금왕찐천재_마스터북_Level2_5주차_원리금보장상품.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/03_%EC%98%81%EC%97%85%ED%99%94%EB%B2%95_%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8_%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC/%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC_%EB%A7%88%EC%8A%A4%ED%84%B0%EB%B6%81_Level2_5%EC%A3%BC%EC%B0%A8_%EC%9B%90%EB%A6%AC%EA%B8%88%EB%B3%B4%EC%9E%A5%EC%83%81%ED%92%88.md#L100-L134) · L100–134 · 자료 기준 2026-08 (금리 2026.07~08 기준)

**이 고객에게 적용할 때:** 교재의 숫자는 비교 원리 설명용 예시. 실제 거래월 금리·유지기간·해지조건으로 다시 비교한다.

<!-- source-excerpt {"key": "K-RATE", "path": "knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/03_영업화법_스크립트_연금왕찐천재/연금왕찐천재_마스터북_Level2_5주차_원리금보장상품.md", "start": 100, "end": 134, "sha256": "97985d81ce973c9587f658191ab69f33fcba8dcbdb6470890e050a6ebac4177f"} -->
> ## 상품마다 다른 금리 표시 기준
>
> ### 상품마다 금리 표시의 기준이 달라요!
>
> | 상품 | 금리 표시 기준 |
> |---|---|
> | 시중은행 정기예금 | **연단리** |
> | 저축은행 정기예금 | **월복리** |
> | GIC (이율보증형보험) | **연복리** |
> | ELB (파생결합사채) | **연단리** |
>
> #### 사례 1. 시중은행 정기예금 vs 저축은행 정기예금
>
> | 구분 | 신한은행 정기예금 | Daishin 저축은행 정기예금 |
> |---|---|---|
> | 기간 | 3년제 | 3년제 |
> | 표기 금리 | **3.40%** | **3.40%** (단리 환산 **3.57%**) |
>
> > 🙋 신한은행 정기예금과 대신저축은행 정기예금 만기 3년짜리 모두 3.40%로 표기 되어있던데, 실제로 받는 이자가 다르다는 건가요?!
>
> > 🐰 다릅니다! 복리는 말 그대로 이자에 이자가 붙는 것이기 때문에 보여지는 금리가 같아도 만기에 이자는 더 커요! 월복리(공시이율) 3.40%인 저축은행 상품을 단리로 환산해보면 연 3.57% 랍니다~
>
> #### 사례 2. GIC vs ELB
>
> | 구분 | 삼성생명 GIC (이율보증형보험) | IBK투자증권 ELB (파생결합사채) |
> |---|---|---|
> | 기간 | 5년제 | 5년제 |
> | 표기 금리 | **4.00%** (단리 환산 **4.33%**) | **4.30%** |
>
> > 🙋 IBK투자증권 ELB 만기 5년짜리 금리가 더 높네요?
>
> > 🐰 아니에요! 단리로 환산해서 같은 기준으로 놓고 비교해서 고객님께 안내해드려야해요. 만기 5년인 해당 삼성생명 GIC는 단리 환산시 연 4.33% 랍니다.
>
> > **※ 단리 환산 금리 계산기를 꼭 활용하세요!**
> > ■ 경로 : KB-WiseNet > Info Zone > 연금(퇴직연금) > [상품]원리금보장상품 > 상품정보 > 퇴직연금 저축은행 & GIC 단리 환산 금리 계산기
<!-- /source-excerpt -->

<a id="K-DO"></a>
### K-DO · 디폴트옵션의 지정·직접운용·자동적용

근거: [SRC-098 · 연금왕 찐천재 마스터북 — Level 2 / 7주차 디폴트옵션 상품](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/03_영업화법_스크립트_연금왕찐천재/연금왕찐천재_마스터북_Level2_7주차_디폴트옵션상품.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/03_%EC%98%81%EC%97%85%ED%99%94%EB%B2%95_%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8_%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC/%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC_%EB%A7%88%EC%8A%A4%ED%84%B0%EB%B6%81_Level2_7%EC%A3%BC%EC%B0%A8_%EB%94%94%ED%8F%B4%ED%8A%B8%EC%98%B5%EC%85%98%EC%83%81%ED%92%88.md#L43-L70) · L43–70 · 자료 기준 2026-08 (수익률 2026-08-20 기준)

**이 고객에게 적용할 때:** 사전 지정과 실제 보유는 다르다. 만기자금의 일반적인 4주+2주 설명이며 신규입금·동일상품 재만기에는 별도 조건이 있다.

<!-- source-excerpt {"key": "K-DO", "path": "knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/03_영업화법_스크립트_연금왕찐천재/연금왕찐천재_마스터북_Level2_7주차_디폴트옵션상품.md", "start": 43, "end": 70, "sha256": "b9d04f3d9c746e7bb3822daf2803f1ca13e788086c0e49e0aaf8e89503df9d1f"} -->
> ## 디폴트옵션 상품이란?
>
> ### 디폴트옵션(Default Option) 상품 이란?
>
> > 「적립금이 방치되지 않도록 미리 설정해두는 **사전지정운용제도**」
>
> 상품이 만기가 되었음에도 불구하고 일정 기간 방치가 되어있을 경우,
> 미리 지정해 둔 방법으로 적립금을 자동 운용하여 수익률 제고를 도모하는 제도입니다.
>
> ### ✏️ 디폴트옵션 상품 핵심 특징 : **1, 2, 4, 6, 7** 을 기억하세요!
>
> | 핵심 특징 | 부연 설명 |
> |---|---|
> | 디폴트옵션 포트폴리오 중 **1**개만 사전 지정 가능 | 고용노동부에서 승인을 받은 디폴트옵션 전용 포트폴리오 중 1개만 사전에 지정 가능합니다. |
> | 옵트인 & 옵트아웃 **2**가지 방식으로 직접 운용도 가능 | 대기시간을 기다리지 않고 언제든 즉시 매수(옵트인(Opt-in)), 즉시 매도(옵트아웃(Opt-out))가 가능합니다. |
> | 위험도를 **4**가지로 나누어 상품 제공 | 가입자의 투자 성향에 맞추어 고를 수 있도록 초저위험, 저위험, 중위험, 고위험으로 나누어 단계별 상품을 제공합니다. |
> | **6**주의 대기 후 자동 적용 (4주+2주) | 기존 만기 보유 상품이 종료된 후 4주 동안 운용지시가 없을 경우 1차 안내를, 안내 수신 후 추가로 2주 동안 운용지시가 없을 경우 지정해둔 디폴트옵션으로 자금이 자동 매수됩니다. |
> | 위험자산 **7**0% 한도 규제 예외 적용 | 고용노동부로부터 승인받은 중위험, 고위험 디폴트옵션 포트폴리오는 위험자산 한도규정 예외가 적용되어 70%를 초과하더라도 매수 및 운용이 가능합니다. |
>
> ### ✏️ 디폴트옵션 상품 적용 프로세스
>
> ```
> [상품 만기일]              [가입자 통지]                [디폴트옵션 적용]
> 현금으로 상환 후   ─4주─▶  2주 후             ─2주─▶   사전에 선택한
> 4주 대기                   디폴트옵션 상품              디폴트옵션 상품 매수
>                            적용안내
> ```
<!-- /source-excerpt -->


## 3. S3 재료 — 운용전략과 상품 매핑

가까운 연금 지급 재원과 장기 잔액에 같은 만기를 적용하지 않는다. 아래 상품은 비교 후보이며 실제 개시/지급계획을 확인한 뒤 역할을 정한다.

아래 상품은 고객별 **비교 후보 또는 유지할 설정**이다. 동시에 모두 매수하는 배분안이 아니다. `SRC-099`는 상품자료를 정리한 마스터로, 원 상품자료 S01~S05 파일은 이 작업에서 저장소 내 실물을 찾지 못했다. 마스터 레코드까지 대조했으며 원 상품자료 재검증·현재 판매가능 확인을 완료한 것으로 표시하지 않는다.

9월 예금금리는 2026-09-01~09-30 적용자료, 월간 펀드 성과는 2026-08-28, 판매목록 성과는 기준일 미기재다. 10월 이후 자금에 9월 금리를 약속하지 않는다. 고객별 손익과 상품 마스터의 관측성과를 섞지 않는다.

| 상품/자료 ID | 이 고객에게 연결하는 이유 | 선택 전 확인 |
|---|---|---|
| [SAV-009 · SBI저축은행 퇴직연금 정기예금](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md#SAV-009>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#SAV-009) | 현재 SBI 예금의 같은 역할 재운용 조건 비교. | 10월 금리·기관별 합산·연금지급 시 해지 조건 확인. |
| [FND-004 · 한화내일받는단기국공채증권자투자신탁(채권)C-RPE(퇴직연금)](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md#FND-004>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#FND-004) | 손실 가능성을 이해한 단기 운용 부분의 비교 후보. | 매도/정산일·낮은 위험과 원금보장의 차이·지급일 정합성 확인. |
| [GIC-003 · 한화생명 GIC (2026년 9월 특별제공안)](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md#GIC-003>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#GIC-003) | 가까운 지급에 쓰지 않을 장기 잔액의 구조 비교. | 9월 특별조건은 참고. 장기 계약기간과 지급/중도해지 조건 확인. |

### 전략 적용 조건 원문

#### PM-03 · 이 고객에서의 적용

만기자금을 즉시 현금처럼 취급하지 않고 예약 가능 여부를 확인한다.

출처: [SRC-100 · PM-03](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MATCHING_KB.md#PM-03>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MATCHING_KB.md#L203-L261) · 해당 카드 L203–261. **자료 기반 기획 해석**이며 공식 업무규정과 구분한다.

> ### PM-03 · 정기예금 만기 임박
>
> **적용할 때 보는 데이터:** 만기일·만기예상금액 / 만기변경예약/디폴트옵션 지정·실행 내역 / 해당 자금의 현재 상품·고객 투자성향.
>
> **고객과 확인:** 만기자금 사용계획이 있는가? / 같은 안정성을 유지할지 일부 투자를 검토할지? / 다음 운용상품의 만기는 어느 정도가 적절한가?
>
> **관리방향:** 만기를 기존 계약을 불필요하게 깨지 않고 재운용 방향을 정하는 시점으로 활용한다. 만기 도래 후 대기하지 않도록 예약 가능 여부를 확인한다.
>
> | 추가로 확인된 조건 | 검토 상품군/방식 |
> |---|---|
> | 사용계획에 맞춘 안정 운용 유지 | 정기예금 재예치/기관 비교 |
> | 중장기 원리금보장 운용 | GIC |
> | 원금손실 허용·채권형 운용 희망 | 단기채 펀드 |

> **제외·유지·보류:** 만기예상금액을 현재 즉시 사용가능 현금으로 보지 않는다. 기존 매수예약이 고객 의사와 맞으면 불필요하게 취소·교체하지 않는다. 예약 불가능한 상품을 자동 재운용 가능으로 안내하지 않는다.
>
> **S3에 쓸 수 있는 관리방향 문장(기획 예시):**
>
> > 만기자금의 사용계획과 운용 선호를 확인하고, 만기 시점에 맞춰 정기예금·GIC 또는 적합한 실적배당형으로 재운용할 후보를 준비합니다.
>
> **후속 확인:** 만기 1개월 내 예약 기능과 해당 상품 가능 여부를 조회한다. 기존 지정 디폴트옵션은 별도 확인한다.
>
> **판단 근거:** E05:원픽 가이드; E08:원픽 가이드 — 만기 상품 변경 예약; K02:CASE 02.  
> **기존 문서 연결:** RS-16, CASE 02 (RS는 K01, CASE는 K02의 버전 기준).

#### PM-13 · 이 고객에서의 적용

연금수령을 실제 계획하는 경우에만 적용한다.

출처: [SRC-100 · PM-13](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MATCHING_KB.md#PM-13>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MATCHING_KB.md#L859-L919) · 해당 카드 L859–919. **자료 기반 기획 해석**이며 공식 업무규정과 구분한다.

> ### PM-13 · 연금수령 예정
>
> **적용할 때 보는 데이터:** 희망 연금개시일·예상 수령액(확인된 경우) / 보유상품 만기·정산일 / 연금지급 가능 표시·적립금 규모.
>
> **고객과 확인:** 개시 직후 필요한 금액과 이후 남길 금액은? / 정기/비정기 수령 계획은? / 원금보장만 원하는지 실적배당도 유지할지?
>
> **관리방향:** 연금 지급에 필요한 재원과 장기 잔여자금을 구분한다. 단순 최고금리보다 연금수령 일정·지급 가능조건에 맞는 만기 구성을 우선한다.
>
> | 추가로 확인된 조건 | 검토 상품군/방식 |
> |---|---|
> | 1년 뒤 사용할 원금보장 재원 | 1년 정기예금 등 |
> | 몇 년 뒤 사용할 연금재원 | 연금지급 가능한 GIC/ELB의 만기·조건 비교 |
> | 실적배당 유지 의향 | 연금수령 예정 모델을 참고해 개별 펀드 확인 |

> **제외·유지·보류:** 일반 인출과 상품 매도 가능성을 혼동하지 않는다. 장기상품에 가입한 뒤 곧바로 깨는 구성을 우선하지 않는다. 연금지급 가능 ELB라도 최소금액·사전협의 조건은 별개다.
>
> **S3에 쓸 수 있는 관리방향 문장(기획 예시):**
>
> > 연금 개시 직후 받을 금액과 장기간 남겨둘 자금을 구분해 만기를 맞춥니다. 원리금보장 운용을 원하면 지급 가능한 예금·GIC 조건을, 실적배당을 유지하려면 수령 예정 모델의 개별 상품을 비교합니다.
>
> **후속 확인:** 연금지급 대상 여부와 특별중도해지 적용조건을 해당 상품 약관/화면에서 확인한다. 필요 재원의 현금화일을 먼저 확보한다.
>
> **판단 근거:** E05:연금지급 유의사항·원픽 가이드; S03:L25-L29; S04:L198-L211; K02:CASE 17.  
> **기존 문서 연결:** RS-14, RS-15, CASE 17, CASE 08 (RS는 K01, CASE는 K02의 버전 기준).


### 상품 마스터 원문 레코드

후보의 구성·위험·가용성·출처를 생략하지 않도록 원문 레코드를 접어두었다. `runtime_verified: false` 상태도 보존한다.

<details><summary>SAV-009 원문 레코드 · L1953–2040</summary>

[상품 원문](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#L1953-L2040)

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

</details>

<details><summary>FND-004 원문 레코드 · L6761–6842</summary>

[상품 원문](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#L6761-L6842)

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

</details>

<details><summary>GIC-003 원문 레코드 · L3647–3713</summary>

[상품 원문](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#L3647-L3713)

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

</details>


## 4. S4 재료 — 영업화법 원문

만기 안내 후 현재 연금계획을 질문하고, 개시를 선택할 때 전문상담으로 이어간다. 원문 보호한도·일반은행 보유 가정·금리차는 현재 SBI 보유 고객에 맞게 확인 후 편집한다.

아래 인용은 **저장소 MD의 해당 구간을 문장 수정 없이 발췌**했다. PDF/영상 자체를 다시 대조한 결과와 구분한다. 문서의 설명·예시 고객 반응은 실제 고객 발언이 아니다. 고객용 최종 화법은 작성자가 호칭·날짜·금액·상품 및 적용 조건을 맞춰 편집한다.

<a id="T-MATURITY"></a>
### T-MATURITY · 만기 안내 → 안정 운용 제안 → 예약/추가조회 분기

근거: [SRC-002 · 연금고객 수익률 KPI 평가대상 고객관리 시나리오](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/01_고객관리_수익률관리/연금고객_수익률KPI_고객관리_시나리오.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/01_%EA%B3%A0%EA%B0%9D%EA%B4%80%EB%A6%AC_%EC%88%98%EC%9D%B5%EB%A5%A0%EA%B4%80%EB%A6%AC/%EC%97%B0%EA%B8%88%EA%B3%A0%EA%B0%9D_%EC%88%98%EC%9D%B5%EB%A5%A0KPI_%EA%B3%A0%EA%B0%9D%EA%B4%80%EB%A6%AC_%EC%8B%9C%EB%82%98%EB%A6%AC%EC%98%A4.md#L98-L122) · L98–122 · 자료 기준 Unknown

**이 고객에게 적용할 때:** 오래된 자료의 보호한도 5천만원·금리격차 0.7~0.8%를 원문 그대로 보존했다. 2026.08 교재 SRC-097의 보호한도 표기와 시점이 다르므로 고객용 문장에는 최신 확인값을 사용한다. 이미 저축은행 예금을 보유한 고객에게 일반은행 예금으로 오인하는 문장을 쓰지 않는다.

<!-- source-excerpt {"key": "T-MATURITY", "path": "knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/01_고객관리_수익률관리/연금고객_수익률KPI_고객관리_시나리오.md", "start": 98, "end": 122, "sha256": "bad650966bd0555db8e13468d051e89af3af50a8346d7eac14adfcbe3b034f85"} -->
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
> **[행원]** 정기예금으로만 운용하시는 건 펀드가 변동성도 크고 원금손실 가능성이 있어서 그러시는거죠? 그렇다면 원금도 보장되고 지금 운용하는 상품보다 금리가 더 높은 정기예금으로 바꿔보시는건 어떠세요?
>
> **[고객]** 그런 상품이 있나요?
>
> **[행원]** 저축은행 정기예금 상품은 은행별 차이가 있지만 일반은행 정기예금 대비 금리가 약 0.7~0.8% 높고 예금자보호도 5천만원까지 가능하여 자산관리에 관심있는 고객분들은 정기예금 운용시 저축은행 상품으로 주로 운용하고 계세요. 안전자산을 선호하시는 고객님께 딱 맞는 상품이니 이번 기회에 저축은행 정기예금으로 재예치 해보시는건 어떠세요?
>
> **[고객] ① 만기 전 인데 신청이 가능한가요?**
>
> **[행원]** 네, 가능하세요. 통화종료 후에 고객님께 문자메시지로 만기상품 예약변경 거래를 하실 수 있는 스타뱅킹 URL 링크를 보내드리겠습니다. 만기 한달 전부터 예약거래가 가능하시니 URL로 접속하시면 지금 바로 예약거래를 하실 수 있습니다.
>
> > *\* [75-08-110] 개인고객용메시지발송시 발송콘텐츠: 마케팅(상품) > 노후은퇴 > 만기상품예약변경 안내 선택*
>
> **[고객] ② 좀 더 알아보고 싶으면 어떻게 하나요?**
>
> **[행원]** 인터넷뱅킹 또는 스타뱅킹에 접속하셔서 퇴직연금 상품검색을 하시면 저축은행 정기예금 상품에 대해 자세히 알아보실 수 있으세요. 예금자 보호 등 꼼꼼히 확인하시고 추가 문의사항이 있으시면 언제든지 연락 주세요.
<!-- /source-excerpt -->

<a id="T-PENSION-EXPERT"></a>
### T-PENSION-EXPERT · 은퇴 전후 수령·절세 전문상담 연결 화법

근거: [SRC-010 · 연금왕 찐천재 마스터북 — 계약이전 화법(은행)](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/03_영업화법_스크립트_연금왕찐천재/연금왕찐천재_마스터북_계약이전화법_은행.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/03_%EC%98%81%EC%97%85%ED%99%94%EB%B2%95_%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8_%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC/%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC_%EB%A7%88%EC%8A%A4%ED%84%B0%EB%B6%81_%EA%B3%84%EC%95%BD%EC%9D%B4%EC%A0%84%ED%99%94%EB%B2%95_%EC%9D%80%ED%96%89.md#L141-L143) · L141–143 · 자료 기준 Unknown

**이 고객에게 적용할 때:** 개시 강요 없이 수령계획을 함께 검토할 때 활용한다. 문장의 채널·서비스 제공조건은 실제 이용 시 확인한다.

<!-- source-excerpt {"key": "T-PENSION-EXPERT", "path": "knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/03_영업화법_스크립트_연금왕찐천재/연금왕찐천재_마스터북_계약이전화법_은행.md", "start": 141, "end": 143, "sha256": "f76adcfdfdb8dbb9b409bfe1185d5fda745368a7879226b002151f250ecef185"} -->
> ### Q4. 상담 한번 받는 것도 쉽지 않잖아요!
>
> **[키키 행원]** 전화나 화상으로도 운용 상담이 가능하고, 지점 방문이 필요하실 때는 모바일 번호표나 상담예약 서비스를 이용하시면 대기시간을 줄이실 수 있습니다. 또한 은퇴가 가까워지시면 KB골든라이프센터를 통해 연금수령, 절세, 건강보험료, 국민연금과 관련된 다양한 전문 상담도 받으실 수 있습니다.
<!-- /source-excerpt -->

<a id="T-THINK"></a>
### T-THINK · 나중에 하겠다는 반응에 재접점 남기기

근거: [SRC-068 · 《실전상담백서》 끝난 줄 알았던 상담, 이렇게 말하니 다시 시작됐어요!](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/posts/2025-11-13_203923_《실전상담백서》 끝난 줄 알았던 상담, 이렇게 말하니 다시 시작됐어요!.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2025-11-13_203923_%E3%80%8A%EC%8B%A4%EC%A0%84%EC%83%81%EB%8B%B4%EB%B0%B1%EC%84%9C%E3%80%8B%20%EB%81%9D%EB%82%9C%20%EC%A4%84%20%EC%95%8C%EC%95%98%EB%8D%98%20%EC%83%81%EB%8B%B4%2C%20%EC%9D%B4%EB%A0%87%EA%B2%8C%20%EB%A7%90%ED%95%98%EB%8B%88%20%EB%8B%A4%EC%8B%9C%20%EC%8B%9C%EC%9E%91%EB%90%90%EC%96%B4%EC%9A%94%21.md#L92-L100) · L92–100 · 자료 기준 2025-11-13

**이 고객에게 적용할 때:** 현장 경험담의 원문. 거절·보류 반응이 실제로 나올 때의 선택 분기이며 현재 고객의 발언으로 단정하지 않는다.

<!-- source-excerpt {"key": "T-THINK", "path": "knowledge/corpus/03_스타런_영업점_Hottip/posts/2025-11-13_203923_《실전상담백서》 끝난 줄 알았던 상담, 이렇게 말하니 다시 시작됐어요!.md", "start": 92, "end": 100, "sha256": "942b4ebf63251972d76acf112e028a1b484e2e98e67ddbffbcd3bf5167bdcced"} -->
> ** Scane 6 : "아직은 생각 없어요 / 나중에 할게요 / 다음에 올께요~"**
>
> (= 상담 차단형 반응 → 여운 남기기)
>
> 👄 이렇게 말해보자!
>
> "넵~ 괜한 타이밍 아니었을까 걱정했어요 ㅎㅎ <u>짧은 요약자료만 문자로 보내드릴게요</u>, 시간 괜찮으실 때 살짝만 봐주세요 :)"
>
> ✔ SMS 허용 유도 and 재접점 가능성 열어두기
<!-- /source-excerpt -->


## 5. S5 재료 — 단말 업무와 Hot Tip

### 단말 업무화면

| 화면번호 | 자료상 화면명 | 이 고객에서 쓸 목적·순서 | 근거 |
|---|---|---|---|
| `04-12-642` | 적립금및수익률조회 | 만기상품·전체 구성과 지급 재원 후보 확인. | [SRC-027 L65](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L65) |
| `04-12-17A` | New퇴직연금상품조회 | 10월 제공상품과 연금지급 가능 여부 조회. | [SRC-003 L803](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/02_마케팅_캠페인/개인형IRP_마케팅_보물지도_Vol1.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/02_%EB%A7%88%EC%BC%80%ED%8C%85_%EC%BA%A0%ED%8E%98%EC%9D%B8/%EA%B0%9C%EC%9D%B8%ED%98%95IRP_%EB%A7%88%EC%BC%80%ED%8C%85_%EB%B3%B4%EB%AC%BC%EC%A7%80%EB%8F%84_Vol1.md#L803) |
| `06-12-611` | 보유상품변경 | 계속 운용 선택 시 만기예약; 기존 예약도 확인. | [SRC-027 L67](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L67) |
| `75-08-110` | 개인고객용메시지발송등록 | 비대면 변경 안내 링크 발송; 예약 접수와 별개. | [SRC-002 L118](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/01_고객관리_수익률관리/연금고객_수익률KPI_고객관리_시나리오.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/01_%EA%B3%A0%EA%B0%9D%EA%B4%80%EB%A6%AC_%EC%88%98%EC%9D%B5%EB%A5%A0%EA%B4%80%EB%A6%AC/%EC%97%B0%EA%B8%88%EA%B3%A0%EA%B0%9D_%EC%88%98%EC%9D%B5%EB%A5%A0KPI_%EA%B3%A0%EA%B0%9D%EA%B4%80%EB%A6%AC_%EC%8B%9C%EB%82%98%EB%A6%AC%EC%98%A4.md#L118) |
| `04-10-099` | 세금우대관련조회 | 개시 선택 시 과세·세액공제 관련 사전 조회. | [SRC-003 L495](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/02_마케팅_캠페인/개인형IRP_마케팅_보물지도_Vol1.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/02_%EB%A7%88%EC%BC%80%ED%8C%85_%EC%BA%A0%ED%8E%98%EC%9D%B8/%EA%B0%9C%EC%9D%B8%ED%98%95IRP_%EB%A7%88%EC%BC%80%ED%8C%85_%EB%B3%B4%EB%AC%BC%EC%A7%80%EB%8F%84_Vol1.md#L495) |
| `06-12-622` | 세액공제 미신청금액 등록/전환 신청 | 해당하는 미공제금액 등록/전환 관련 처리. | [SRC-027 L94](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L94) |
| `02-12-221` | 개인형IRP 연금지급 | 지급 예상 조회 후 실제 개시·지급방법 등록. | [SRC-027 L50](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L50) |
| `04-12-640` | 상품운용내역조회 | 개시 전 진행 중 입금/주문과 매수 상태 확인. | [SRC-027 L68](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L68) |

화면번호는 저장소 자료와 대조한 업무 참조다. 사내 단말 접속·화면 실행은 하지 않았다. `04-12-179`(기존 화면안내)와 `04-12-17A`(New 화면 표기)는 각 출처의 표기를 유지한다.

### Hot Tip 원문과 고객별 활용

#### Hot Tip #199404 · irp 연금 지급 절차

[사내 게시글 원문](https://lxp.kbstar.com/app/board/hottip-my/view/199404.D59E713BFC50ADBEAC5F8FB48C7B16253F22F4AF0D957938667E721AE592A4FD) · [저장소 MD](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/posts/2025-02-27_199404_irp 연금 지급 절차.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2025-02-27_199404_irp%20%EC%97%B0%EA%B8%88%20%EC%A7%80%EA%B8%89%20%EC%A0%88%EC%B0%A8.md) · 게시일 2025-02-27

**연결 이유:** 연금개시를 선택했을 때의 요건·서류·화면·진행거래 제한.

<a id="H-PENSION-A"></a>
#### H-PENSION-A · 연금개시 전 요건과 이전 여부 확인

근거: [SRC-049 · irp 연금 지급 절차](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/posts/2025-02-27_199404_irp 연금 지급 절차.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2025-02-27_199404_irp%20%EC%97%B0%EA%B8%88%20%EC%A7%80%EA%B8%89%20%EC%A0%88%EC%B0%A8.md#L14-L24) · L14–24 · 자료 기준 2025-02-27

**이 고객에게 적용할 때:** 현장 경험담의 절차 후보. 가입기간 예외는 SRC-003과 대조했다. 연금개시 후 이전 불가 표현의 구체 범위는 실제 계좌/업무조건 확인이 필요하다.

<!-- source-excerpt {"key": "H-PENSION-A", "path": "knowledge/corpus/03_스타런_영업점_Hottip/posts/2025-02-27_199404_irp 연금 지급 절차.md", "start": 14, "end": 24, "sha256": "5fb62ee0503edbe918ddaff8dfd95dad9f1f8309a440cf79a1586abcd5336b64"} -->
> **<<연금개시>>**
>
> **가입일로부터 5년 경과, 만 55세이후 연금지급가능.-(퇴직용은 가입기간 제한없음.)**
>
> **연금 개시 전 확인사항**
>
> : ) 적립용 irp일경우
>
> 화면번호 <0410099>: 35,36,55 에서 이전가능한 상품이 있는지 확인
>
> *연금 개시 후에는 이전 불가!
<!-- /source-excerpt -->

<a id="H-PENSION-B"></a>
#### H-PENSION-B · 연금개시 서류와 2단계 화면

근거: [SRC-049 · irp 연금 지급 절차](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/posts/2025-02-27_199404_irp 연금 지급 절차.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2025-02-27_199404_irp%20%EC%97%B0%EA%B8%88%20%EC%A7%80%EA%B8%89%20%EC%A0%88%EC%B0%A8.md#L34-L40) · L34–40 · 자료 기준 2025-02-27

**이 고객에게 적용할 때:** 06-12-622/02-12-221 번호는 SRC-027에도 있다. 본부 화면명은 각각 세액공제 미신청금액 등록/전환 신청, 개인형IRP 연금지급이다.

<!-- source-excerpt {"key": "H-PENSION-B", "path": "knowledge/corpus/03_스타런_영업점_Hottip/posts/2025-02-27_199404_irp 연금 지급 절차.md", "start": 34, "end": 40, "sha256": "7827ea95126a12c5af305be2fcc518e218707865eb0bef2a92074a8abfb18d48"} -->
> **연금개시절차**
>
> *준비서류- 연금보험료등 소득 세액 공제 확인서(서류 없을 경우 국민지갑에서 발급가능)
>
> **1. 세액 미공제 한도 등록** (화면번호 0612622)
>
> **2. 연금지급** (화면번호 0212221)
<!-- /source-excerpt -->

<a id="H-PENSION-C"></a>
#### H-PENSION-C · 입금·보유상품변경 진행 중 거래 제한

근거: [SRC-049 · irp 연금 지급 절차](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/posts/2025-02-27_199404_irp 연금 지급 절차.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2025-02-27_199404_irp%20%EC%97%B0%EA%B8%88%20%EC%A7%80%EA%B8%89%20%EC%A0%88%EC%B0%A8.md#L45) · L45–45 · 자료 기준 2025-02-27

**이 고객에게 적용할 때:** 현재 주문/입금 상태 확인에 연결한다. 원문은 개별 상품 환매일수를 보장하지 않는다.

<!-- source-excerpt {"key": "H-PENSION-C", "path": "knowledge/corpus/03_스타런_영업점_Hottip/posts/2025-02-27_199404_irp 연금 지급 절차.md", "start": 45, "end": 45, "sha256": "2b238e6a52ab6d5e4e5bd4a18aab6e4bdf0997fd44ac8a3036305e655cb2057b"} -->
> ***자동이체 금액 입금중이거나, 보유상품변경 진행시 거래 불가.**
<!-- /source-excerpt -->


Hot Tip 링크는 원문 MD에 기록된 주소 그대로다. 로그인 접근·현재 업무 유효성은 검증하지 않았다. 현장 경험담의 절차는 본부 화면자료와 대조하여 사용한다.

## 6. 출처 목록

| Source ID | 자료 | 성격·기준시점 |
|---|---|---|
| SRC-002 | [연금고객 수익률 KPI 평가대상 고객관리 시나리오](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/01_고객관리_수익률관리/연금고객_수익률KPI_고객관리_시나리오.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/01_%EA%B3%A0%EA%B0%9D%EA%B4%80%EB%A6%AC_%EC%88%98%EC%9D%B5%EB%A5%A0%EA%B4%80%EB%A6%AC/%EC%97%B0%EA%B8%88%EA%B3%A0%EA%B0%9D_%EC%88%98%EC%9D%B5%EB%A5%A0KPI_%EA%B3%A0%EA%B0%9D%EA%B4%80%EB%A6%AC_%EC%8B%9C%EB%82%98%EB%A6%AC%EC%98%A4.md) | Official / Internal Guide / Internal · Unknown |
| SRC-003 | [개인형IRP 마케팅 보물지도](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/02_마케팅_캠페인/개인형IRP_마케팅_보물지도_Vol1.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/02_%EB%A7%88%EC%BC%80%ED%8C%85_%EC%BA%A0%ED%8E%98%EC%9D%B8/%EA%B0%9C%EC%9D%B8%ED%98%95IRP_%EB%A7%88%EC%BC%80%ED%8C%85_%EB%B3%B4%EB%AC%BC%EC%A7%80%EB%8F%84_Vol1.md) | Official / Internal Guide / Internal · 2026-03 |
| SRC-010 | [연금왕 찐천재 마스터북 — 계약이전 화법(은행)](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/03_영업화법_스크립트_연금왕찐천재/연금왕찐천재_마스터북_계약이전화법_은행.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/03_%EC%98%81%EC%97%85%ED%99%94%EB%B2%95_%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8_%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC/%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC_%EB%A7%88%EC%8A%A4%ED%84%B0%EB%B6%81_%EA%B3%84%EC%95%BD%EC%9D%B4%EC%A0%84%ED%99%94%EB%B2%95_%EC%9D%80%ED%96%89.md) | Training Material / Internal · Unknown |
| SRC-027 | [퇴직연금 주요거래 화면번호 안내](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md) | Reference / Internal · Unknown |
| SRC-049 | [irp 연금 지급 절차](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/posts/2025-02-27_199404_irp 연금 지급 절차.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2025-02-27_199404_irp%20%EC%97%B0%EA%B8%88%20%EC%A7%80%EA%B8%89%20%EC%A0%88%EC%B0%A8.md) | Field Know-how / Experiential · 2025-02-27 |
| SRC-068 | [《실전상담백서》 끝난 줄 알았던 상담, 이렇게 말하니 다시 시작됐어요!](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/posts/2025-11-13_203923_《실전상담백서》 끝난 줄 알았던 상담, 이렇게 말하니 다시 시작됐어요!.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2025-11-13_203923_%E3%80%8A%EC%8B%A4%EC%A0%84%EC%83%81%EB%8B%B4%EB%B0%B1%EC%84%9C%E3%80%8B%20%EB%81%9D%EB%82%9C%20%EC%A4%84%20%EC%95%8C%EC%95%98%EB%8D%98%20%EC%83%81%EB%8B%B4%2C%20%EC%9D%B4%EB%A0%87%EA%B2%8C%20%EB%A7%90%ED%95%98%EB%8B%88%20%EB%8B%A4%EC%8B%9C%20%EC%8B%9C%EC%9E%91%EB%90%90%EC%96%B4%EC%9A%94%21.md) | Field Know-how / Experiential · 2025-11-13 |
| SRC-097 | [연금왕 찐천재 마스터북 — Level 2 / 5주차 원리금보장상품](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/03_영업화법_스크립트_연금왕찐천재/연금왕찐천재_마스터북_Level2_5주차_원리금보장상품.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/03_%EC%98%81%EC%97%85%ED%99%94%EB%B2%95_%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8_%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC/%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC_%EB%A7%88%EC%8A%A4%ED%84%B0%EB%B6%81_Level2_5%EC%A3%BC%EC%B0%A8_%EC%9B%90%EB%A6%AC%EA%B8%88%EB%B3%B4%EC%9E%A5%EC%83%81%ED%92%88.md) | Training Material / Internal · 2026-08 (금리 2026.07~08 기준) |
| SRC-098 | [연금왕 찐천재 마스터북 — Level 2 / 7주차 디폴트옵션 상품](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/03_영업화법_스크립트_연금왕찐천재/연금왕찐천재_마스터북_Level2_7주차_디폴트옵션상품.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/03_%EC%98%81%EC%97%85%ED%99%94%EB%B2%95_%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8_%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC/%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC_%EB%A7%88%EC%8A%A4%ED%84%B0%EB%B6%81_Level2_7%EC%A3%BC%EC%B0%A8_%EB%94%94%ED%8F%B4%ED%8A%B8%EC%98%B5%EC%85%98%EC%83%81%ED%92%88.md) | Training Material / Internal · 2026-08 (수익률 2026-08-20 기준) |
| SRC-099 | [PRODUCT_MASTER — 개인형IRP 브리핑용 상품 마스터](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md) | Product Data / Internal · 2026-09-10 (금리 2026-09 적용, 추천펀드 성과 2026-08-28 기준, 판매목록 기준일 미기재) |
| SRC-100 | [PRODUCT_MATCHING_KB — 고객상황 → 상품 후보 매핑](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MATCHING_KB.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MATCHING_KB.md) | Product Data / Internal · 2026-09-10 (수치는 SRC-099 마스터의 읽기용 요약) |

## 7. 고객 데이터·대화 원문 부록

<details><summary>대화 자료의 고객 인덱스 원문 — 열 의미를 임의 추정하지 않음</summary>

```json
{
  "raw_row": "오세훈 193482-6012375 61 안정추구형 – 있음 0 설정 2 mat, pen",
  "name": "오세훈",
  "customer_id": "193482-6012375",
  "age": 61,
  "investment_profile": "안정추구형",
  "isa_maturity_flag_raw": "–",
  "unlabeled_source_column_6": "있음",
  "tax_deduction_remaining_raw": "0",
  "default_option_status_raw": "설정",
  "unlabeled_source_column_9": 2,
  "target_code_text_raw": "mat, pen",
  "target_codes": [
    "mat",
    "pen"
  ]
}
```

</details>

<details><summary>고객 DATA 전체 — 입력 JSON의 display_data 그대로</summary>

```json
{
  "schemaVersion": "customer-briefing-display.v0.1",
  "briefingMeta": {
    "caseId": "C01-07",
    "dataType": "시연용가상고객",
    "asOfDate": "2026-09-29",
    "generatedAt": "2026-09-29T07:00:00+09:00",
    "currency": "KRW"
  },
  "customer": {
    "customerId": "193482-6012375",
    "name": "오세훈",
    "age": 61,
    "gender": "남",
    "starClubGrade": "그랜드",
    "investmentProfile": "안정추구형",
    "irpOpenedAt": "2018-02-19",
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
      "label": "정기예금 만기 D-10",
      "date": "2026-10-09"
    },
    {
      "label": "연금개시 가능",
      "source": "동료 IRP Agent 시연 데이터(9 Cases v3)"
    }
  ],
  "irpAccount": {
    "valuationAmountKrw": 165000000,
    "assetAllocation": [
      {
        "assetType": "원리금보장형",
        "amountKrw": 105900000,
        "weightPct": 64.2
      },
      {
        "assetType": "실적배당형",
        "amountKrw": 51100000,
        "weightPct": 31
      },
      {
        "assetType": "현금성자산",
        "amountKrw": 8000000,
        "weightPct": 4.8
      }
    ],
    "oneYearReturnPct": 6.2,
    "taxDeductionRemainingKrw": 0,
    "latestProductOpening": {
      "holdingId": "H003",
      "productId": null,
      "productName": "KB라이프생명 퇴직연금 디폴트옵션 이율보증형보험(3년)",
      "openedAt": "2026-01-10",
      "amountKrw": 35500000
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
      "valuationAmountKrw": 8000000,
      "weightPct": 4.8,
      "oneYearReturnPct": null,
      "openedAt": "2018-02-19",
      "allocationBreakdown": null,
      "flags": []
    },
    {
      "holdingId": "H002",
      "productId": "SAV-009",
      "productName": "SBI저축은행 퇴직연금 정기예금 1년",
      "assetType": "원리금보장형",
      "productCategory": "정기예금",
      "contractTerm": "1년",
      "valuationAmountKrw": 70400000,
      "weightPct": 42.7,
      "oneYearReturnPct": 3,
      "openedAt": "2025-10-09",
      "allocationBreakdown": null,
      "flags": []
    },
    {
      "holdingId": "H003",
      "productId": null,
      "productName": "KB라이프생명 퇴직연금 디폴트옵션 이율보증형보험(3년)",
      "assetType": "원리금보장형",
      "productCategory": "GIC",
      "contractTerm": "1년",
      "valuationAmountKrw": 35500000,
      "weightPct": 21.5,
      "oneYearReturnPct": 3.2,
      "openedAt": "2026-01-10",
      "allocationBreakdown": null,
      "flags": []
    },
    {
      "holdingId": "H004",
      "productId": "MF-003",
      "productName": "신한 마음편한 TDF 시리즈",
      "assetType": "실적배당형",
      "productCategory": "TDF",
      "contractTerm": null,
      "valuationAmountKrw": 35100000,
      "weightPct": 21.3,
      "oneYearReturnPct": 17,
      "openedAt": "2024-10-15",
      "allocationBreakdown": null,
      "flags": []
    },
    {
      "holdingId": "H005",
      "productId": null,
      "productName": "RISE 200 ETF",
      "assetType": "실적배당형",
      "productCategory": "ETF",
      "contractTerm": null,
      "valuationAmountKrw": 16000000,
      "weightPct": 9.7,
      "oneYearReturnPct": 6.7,
      "openedAt": "2025-12-01",
      "allocationBreakdown": null,
      "flags": []
    }
  ],
  "에이전트맥락데이터": {
    "스키마버전": "customer-agent-context.v0.1",
    "고객계획": {
      "재직상태": "퇴직"
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
      "퇴직급여재원금액원": 95000000,
      "개인부담금재원금액원": 70000000
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
      "최근운용지시일": "2026-04-18",
      "최근상품매매일": "2026-04-18",
      "최근입금일": "2026-04-01",
      "최근1년상품매매횟수": 3,
      "만기후운용설정": {
        "설정여부": false,
        "지정상품": []
      }
    },
    "퇴직및인출": {
      "연금수령요건충족여부": true,
      "연금개시여부": false,
      "연금지급설계등록여부": false,
      "연금수령요건": "만 55세 이상·가입 5년 이상·개인부담금 보유",
      "가입후경과연수": 8.6
    },
    "최근사건": [
      {
        "이벤트식별자": "T001",
        "발생일시": "2026-10-09T00:00:00+09:00",
        "이벤트유형": "상품만기예정",
        "계좌구분": "IRP",
        "관련보유상품식별자": "H002",
        "금액원": 70400000,
        "처리상태": "예정",
        "채널": null
      },
      {
        "이벤트식별자": "T002",
        "발생일시": "2027-01-10T00:00:00+09:00",
        "이벤트유형": "상품만기예정",
        "계좌구분": "IRP",
        "관련보유상품식별자": "H003",
        "금액원": 35500000,
        "처리상태": "예정",
        "채널": null
      }
    ],
    "금융거래": [],
    "상담이력": [
      {
        "상담식별자": "CRM001",
        "상담일시": "2026-06-12T00:00:00+09:00",
        "상담채널": null,
        "상담유형": "퇴직연금사후관리",
        "상담메모": "연금개시 가능 시점과 수령방법을 문의했으나 당장 개시하기보다는 일정 기간 운용을 지속하고 싶다는 의사."
      }
    ],
    "외부계좌": [],
    "투자성향이력": [
      {
        "이력식별자": "R001",
        "분석일": "2026-05-03",
        "투자성향": "안정추구형",
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
        "값": 4.8,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M002",
        "지표유형": "파생값",
        "지표명": "원리금보장·현금성자산합산비중",
        "대상참조": null,
        "값": 69,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M003",
        "지표유형": "파생값",
        "지표명": "위험자산(실적배당형)비중",
        "대상참조": null,
        "값": 31,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M004",
        "지표유형": "파생값",
        "지표명": "동연령대평균수익률",
        "대상참조": null,
        "값": 5.9,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M005",
        "지표유형": "파생값",
        "지표명": "동연령대상위1%평균수익률",
        "대상참조": null,
        "값": 18.7,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M006",
        "지표유형": "파생값",
        "지표명": "동연령대상위1%평균원리금보장비중",
        "대상참조": null,
        "값": 42,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M007",
        "지표유형": "기간",
        "지표명": "최근 운용변경 후 경과개월수",
        "대상참조": null,
        "값": 5.4,
        "단위": "개월",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M008",
        "지표유형": "기간",
        "지표명": "최근 상담 후 경과일수(장기 미접촉)",
        "대상참조": null,
        "값": 109,
        "단위": "일",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M009",
        "지표유형": "파생값",
        "지표명": "최근 1개월 현금성자산 증감액",
        "대상참조": null,
        "값": 0,
        "단위": "원",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M010",
        "지표유형": "파생값",
        "지표명": "정기예금만기까지남은일수",
        "대상참조": "H002",
        "값": 10,
        "단위": "일",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M011",
        "지표유형": "파생값",
        "지표명": "GIC만기까지남은일수",
        "대상참조": "H003",
        "값": 103,
        "단위": "일",
        "산출기준일": "2026-09-29"
      }
    ],
    "확인된특이사항": [],
    "가상설정메모": [
      "동료 IRP Agent 시연 데이터(9 Cases v3)에서 옮긴 시연 데이터. 기준일 2026-09-29.",
      "성별은 시연용 가정. 정기예금 만기일은 엑셀(9/18) 대신 동료 Agent 답변(10/9·7,040만원)을 따름."
    ]
  }
}
```

</details>

### 고객별 매핑 대화 전체

질문과 답변은 입력 파일의 문자열을 그대로 보존했다. 포함된 세율·상품·화면번호·데모 링크가 검증되었다는 뜻은 아니다. 위 검토사항과 함께 사용한다.

<a id="dialogue-7"></a>
<details><summary>행 7 · 이 고객 만기 뭐뭐 있어?</summary>

매핑 방식 `context_and_data_match` · 확신도 `high` · 매핑 메모: 만기일·금액 2건이 오세훈 DATA와 일치

원문 세그먼트 표기: `None` · 선행/후속 원문: `None`

**질문 원문**

> 이 고객 만기 뭐뭐 있어?

**답변 원문**

> 이 고객의 만기 예정 자산은 2026년 10월 9일에 도래하는 7,040만원 규모의 SBI저축은행 퇴직연금 정기예금 1년 상품과, 2027년 1-10에 도래하는 3,550만원 규모의 KB라이프생명 퇴직연금 디폴트옵션 이율보증형보험(3년) 상품이 있어요. 만기 1개월 전 원리금보장상품을 보유하고 있어 정기예금 자동 재예치 제도가 폐지됨에 따라 운용지시가 없으면 만기자금이 현금성자산으로 상환되므로 만기 전 운용 방향 확정이 필요해요.

</details>

<a id="dialogue-9"></a>
<details><summary>행 9 · 이 고객 만기 언제고 금액은 얼마야?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 오세훈` · 선행/후속 원문: `None`

**질문 원문**

> 이 고객 만기 언제고 금액은 얼마야?

**답변 원문**

> 만기 예정인 예금은 2026년 10월 9일 도래하는 7,040만 원의 SBI저축은행 퇴직연금 정기예금 1년 건이 있고, GIC는 2027년 1월 10일에 3,550만 원 규모로 만기가 도래해요.

</details>

<a id="dialogue-21"></a>
<details><summary>행 21 · 이 고객 연금개시 할 수 있는 상태야?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 오세훈` · 선행/후속 원문: `None`

**질문 원문**

> 이 고객 연금개시 할 수 있는 상태야?

**답변 원문**

> 연금개시 요건을 충족했으나 아직 개시하지 않은 상태예요. 2018년 2월 19일에 IRP에 가입해 가입 후 8.6년이 경과했고 연령도 만 61세로 요건을 모두 채웠어요. 연금개시를 진행할 때는 세액 미공제 한도 등록 후 연금지급 등록의 2단계로 처리하며, 개시 전에 세금우대 조회로 이전 가능한 상품이 있는지 먼저 확인해야 해요.

</details>

<a id="dialogue-34"></a>
<details><summary>행 34 · 이 고객 세액공제 더 받게 추가납입 권해도 돼?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 오세훈` · 선행/후속 원문: `None`

**질문 원문**

> 이 고객 세액공제 더 받게 추가납입 권해도 돼?

**답변 원문**

> 세액공제 추가납입은 권할 수 없어요. 이 고객의 세액공제 잔여한도가 0원이기 때문이에요.

</details>

<a id="dialogue-58"></a>
<details><summary>행 58 · 연금 개시 신청하려면 절차가 어떻게 되고 필요한 서류는 뭐야?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 오세훈` · 선행/후속 원문: `None`

**질문 원문**

> 연금 개시 신청하려면 절차가 어떻게 되고 필요한 서류는 뭐야?

**답변 원문**

> 연금 개시 신청 업무는 2단계로 처리해야 하니 [06-12-622] 세액 미공제 한도 등록을 먼저 거친 뒤 [02-12-221] 연금지급 등록을 진행하는 게 핵심이에요. 첫 단계의 준비서류는 연금보험료 등 소득·세액 공제 확인서이며 서류가 없을 때는 국민지갑에서 발급할 수 있어요. 본격적인 개시 전에는 [04-10-099] 세금우대 조회로 이전 가능한 상품이 있는지 먼저 확인해야 하며 연금개시 후에는 이전이 불가능해요. 또한 처리 중에 자동이체 금액이 입금되고 있거나 보유상품변경이 진행 중이면 거래가 불가하니 이 점을 주의해 주세요.

</details>

<a id="dialogue-61"></a>
<details><summary>행 61 · 만기상품 예약변경 처리 순서랑 주의할 점 알려줘</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 오세훈` · 선행/후속 원문: `None`

**질문 원문**

> 만기상품 예약변경 처리 순서랑 주의할 점 알려줘

**답변 원문**

> 만기상품 예약변경 처리 순서와 주의할 점은 만기 1개월 전부터 예약을 진행하고 매월 첫째 주 만기명세로 관리하는 것이 핵심이에요. 상품 금리는 월 단위로 확정되므로 익월 금리 확인을 먼저 거친 뒤, [75-08-110] 화면을 통해 예약변경 거래를 처리하면 돼요. 디폴트옵션 도입 후 정기예금은 만기에 자동 재예치되지 않고 현금성자산에 머무르므로, 저축은행 상품처럼 만기 안내와 예약변경이 중요해요. 특히 만기 후 6주(만기일부터 4주간 지시 없으면 안내 후 2주 뒤 적용)의 유예 구조가 있으나 만기 4주 시점에 본부 안내가 나가기 때문에, 접촉 가능 구간인 만기 1개월 전부터 만기 후 4주 사이에 서둘러 대응해야 해요. 통화 후 스타뱅킹 URL 링크를 문자로 보내 고객이 직접 처리하게 하는 방식을 활용할 수 있어요.

</details>

<a id="dialogue-89"></a>
<details><summary>행 89 · 고객이 주식형 펀드 넣어달라는데 이 고객 성향으로 가능해?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 오세훈` · 선행/후속 원문: `None`

**질문 원문**

> 고객이 주식형 펀드 넣어달라는데 이 고객 성향으로 가능해?

**답변 원문**

> 이 고객의 투자성향과 위험등급 상한을 고려할 때 주식형 펀드는 안내할 수 없어요. 현재 고객의 투자성향은 안정추구형이고 적합성 허용 상한은 낮은위험이라서, 이 등급보다 높은 상품은 가입 대상이 아니에요. 따라서 위험등급이 보통위험 이상인 주식형 펀드는 안내가 제한돼요. 지금 고객에게 안내할 수 있는 상품은 위험등급이 낮은위험과 매우낮은위험에 해당하는 다음의 6종이에요. - KB 국내채권형 C-P — 낮은위험 - KB 안정형 MP — 낮은위험 - KB GIC 확정금리 — 매우낮은위험 - KB ELB 지수연계 — 낮은위험 - KB 정기예금(1년) — 매우낮은위험 - KB 원리금보장 안정 포트폴리오 — 매우낮은위험 반면 허용 상한을 초과하여 안내할 수 없는 상품과 그 사유는 다음과 같아요. - KB 글로벌채권인덱스 C-P — 상품 위험등급 보통위험 > 허용 상한 낮은위험 - KB 온국민TDF2035 C-P — 상품 위험등급 다소높은위험 > 허용 상한 낮은위험 - KB 온국민TDF2040 C-P — 상품 위험등급 다소높은위험 > 허용 상한 낮은위험 - KB 중립형 MP — 상품 위험등급 보통위험 > 허용 상한 낮은위험 - KB 성장형 MP — 상품 위험등급 다소높은위험 > 허용 상한 낮은위험 - KB 글로벌리츠 ETF — 상품 위험등급 높은위험 > 허용 상한 낮은위험 이 내용은 적합성 확인 결과이며 투자권유가 아니에요. ⚖ 본 자료는 정보 제공을 목적으로 합니다. 당행 직원은 투자권유 또는 투자관련 고객 상담 시 「자본시장과 금융투자업에 관한 법률」 및 당행 규정업무 프로세스를 준수할 의무가 있습니다.

</details>

<a id="dialogue-90"></a>
<details><summary>행 90 · 만기 자금 실적배당으로 돌리면 이 고객 성향으로 뭘 안내할 수 있어?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 오세훈` · 선행/후속 원문: `15. 퇴직연금 운용 상품`

**질문 원문**

> 만기 자금 실적배당으로 돌리면 이 고객 성향으로 뭘 안내할 수 있어?

**답변 원문**

> 안정추구형인 이 고객에게는 적합성 허용 상한이 낮은위험으로 설정되어 있어 그에 맞는 상품만 안내할 수 있어요. ⚖ 본 자료는 정보 제공을 목적으로 합니다. 당행 직원은 투자권유 또는 투자관련 고객 상담 시 「자본시장과 금융투자업에 관한 법률」 및 당행 규정업무 프로세스를 준수할 의무가 있습니다. 안내할 수 있는 상품은 다음과 같아요. - KB 국내채권형 C-P — 낮은위험 · 최근 1년 3.8% · 채권형 - KB 안정형 MP — 낮은위험 · 최근 1년 3.9% · MP - KB GIC 확정금리 — 매우낮은위험 · 최근 1년 3.65% · GIC - KB ELB 지수연계 — 낮은위험 · 최근 1년 4.1% · ELB - KB 정기예금(1년) — 매우낮은위험 · 최근 1년 3.1% · 예금 - KB 원리금보장 안정 포트폴리오 — 매우낮은위험 · 최근 1년 3.3% · MP 이 고객의 허용 상한이 낮은위험이므로 위험등급이 그보다 높은 다음 상품들은 안내할 수 없어요. - KB 글로벌채권인덱스 C-P — 상품 위험등급 보통위험 > 허용 상한 낮은위험 - KB 온국민TDF2035 C-P — 상품 위험등급 다소높은위험 > 허용 상한 낮은위험 - KB 온국민TDF2040 C-P — 상품 위험등급 다소높은위험 > 허용 상한 낮은위험 - KB 중립형 MP — 상품 위험등급 보통위험 > 허용 상한 낮은위험 - KB 성장형 MP — 상품 위험등급 다소높은위험 > 허용 상한 낮은위험 - KB 글로벌리츠 ETF — 상품 위험등급 높은위험 > 허용 상한 낮은위험 위 내용은 어디까지나 적합성 확인 결과에 따른 안내 범위이며, 실제 상품 안내 시에는 투자권유가 아님을 유의해야 해요.

</details>

<a id="dialogue-130"></a>
<details><summary>행 130 · (만기 질문 뒤) 그냥 두면 어떻게 돼?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 오세훈` · 선행/후속 원문: `이 고객 만기 언제고 금액은 얼마야?`

**질문 원문**

> (만기 질문 뒤) 그냥 두면 어떻게 돼?

**답변 원문**

> 정기예금 자동 재예치 제도가 폐지되어 운용지시가 없으면 만기자금이 현금성자산으로 상환된다는 제도 변화를 근거로 안내하는 것이 핵심이에요. 1개월 내 만기도래 원리금보장상품을 보유하고 디폴트옵션이 미등록된 상태라면 이러한 제도 변경 내용을 짚어주면서 디폴트옵션 사전지정 등록이나 만기 예약변경을 권유하는 방법을 활용할 수 있어요.

</details>

<a id="dialogue-155"></a>
<details><summary>행 155 · 이 고객 만기 뭐뭐 있어?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 오세훈` · 선행/후속 원문: `None`

**질문 원문**

> 이 고객 만기 뭐뭐 있어?

**답변 원문**

> 만기 도래 항목을 묻는 질문에 대해, 현재 2026년 10월 9일에 만기가 도래하는 7,040만원 규모의 SBI저축은행 퇴직연금 정기예금 1년 상품이 있어요. 그리고 2027년 1-10에 만기가 도래하는 KB라이프생명 퇴직연금 디폴트옵션 이율보증형보험(3년) 3,550만원 상품이 있습니다.

</details>


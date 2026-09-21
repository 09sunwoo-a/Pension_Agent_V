# C01-02 박지민 · 브리핑 작성용 기반지식

**용도:** 작성자가 S1~S5 솔루션을 구성할 때 사용할 고객별 재료. 아래 솔루션 방향은 편집자의 작업 가설이며 완성 브리핑/매수 지시가 아니다.

고객 데이터 기준일: **2026-09-29** · 개별 매핑 대화 **6건** · 작성일 2026-09-21

[전체 고객 색인](<../README.md>) · [고객·대화 입력 JSON](<../../../../../C01_고객DATA_대화_원문매핑.json>) · [해당 고객 JSON](<../../../active/display-data/C01-02.json>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/active/display-data/C01-02.json)

입력 위치: `customers[1]` (`case_id=C01-02`). 대화 행 번호는 원본 `source_row_no`이며 고객 상담 발생 순서를 뜻하지 않는다.

**다른 GPT 세션에서 사용:** 이 파일 하나를 첨부하면 고객 DATA·매핑 대화 전체·선별 지식 원문을 함께 검토할 수 있다. 원문 Git 링크는 `41ae9a4` 커밋에 고정했다. 인용의 문장은 그대로이며 상대 이미지 경로만 이 파일 위치에 맞췄다. GitHub 접근 권한과 사내 게시글 로그인은 별도다.

## 1. S1 작성 재료 — 고객 데이터와 세그먼트

| 항목 | 입력 데이터 | 데이터 위치 |
|---|---|---|
| 고객 | 박지민 · 34세 · 적극투자형 · 재직 | `/customer`, `/에이전트맥락데이터/고객계획` |
| 계좌 | 32,000,000원 · 표시 1년 수익률 16.9% | `/irpAccount` |
| 납입 | 올해 당행 개인부담금 4,000,000원 · 타 연금계좌 2,000,000원 · 공제잔여 표시값 3,000,000원 | `/에이전트맥락데이터/납입및세제` |
| 재원 | 퇴직급여 0원 · 개인부담금 32,000,000원 | 같은 절의 재원 필드 |
| 디폴트옵션 | 등록 · 알파드림 · 미적용 | `/customer/defaultOption` |
| 연금개시 | 요건충족 표시값 False · 개시 False | `/에이전트맥락데이터/퇴직및인출` |

표시값과 대화·제도자료가 충돌하는 항목은 아래 검토사항에 남겼다. 표시값을 임의로 교정하지 않았다.

세그먼트 정의: [뱃지 카탈로그](<../../BADGE_CATALOG.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/review/BADGE_CATALOG.md). 뱃지는 현재 상태이며 그 자체가 자동 추천 결론은 아니다.

| 세그먼트 원문 | 사실 근거와 연결할 지식 |
|---|---|
| 투자성향-DO불일치 | 적극투자형과 저위험 알파드림 지정의 차이. 현재 실적배당형 75%와 별개로 향후 기본 설정의 선택 이유를 확인. |

| 보유상품 원문 | 평가금액 | 비중 | 데이터상 플래그 |
|---|---:|---:|---|
| 현금성자산 | 1,000,000원 | 3.1% | 없음 |
| 하나은행 퇴직연금 정기예금 1년 | 7,000,000원 | 21.9% | 없음 |
| KB 온국민 TDF 시리즈 | 14,800,000원 | 46.2% | 없음 |
| RISE 미국S&P500 ETF | 9,200,000원 | 28.8% | 없음 |

### 대화에서 찾은 솔루션 재료

| 대화 행 | 읽을 내용 | 이번 자료에서의 취급 |
|---|---|---|
| [행 3](#dialogue-3) | 위험자산 70% 초과 해소 제안 | 적격 TDF 예외와 실제 산정비중 확인을 선행. |
| [행 159](#dialogue-159) | 소득정보 부재 | 세율·환급액을 고객 사실로 확정하지 않음. |
| [행 160](#dialogue-160) | 납입 600만원·추가공제 여력 | 당행 400만원+타계좌 200만원과 잔여 300만원을 분리 확인. |
| [행 23](#dialogue-23) | ISA 없음 | ISA 전환 솔루션을 새로 붙이지 않음. |

### 먼저 확인할 불일치·미확인 사항

- 실적배당형 75%에는 KB온국민TDF가 포함된다. 법규상 위험자산 비중과 동일하지 않을 수 있어 즉시 위반 또는 160만원 의무 매도를 확정하지 않는다.
- 7/2 메모의 현재 위험수준 유지 의향을 존중한다. 적극투자형이라는 이유로 DO를 고위험으로 올리지 않는다.
- 소득·결정세액이 없어 공제잔여 300만원만으로 확정 환급액을 만들 수 없다.

## 2. 대략적인 솔루션 방향과 S2 근거

첫 단계는 실제 위험자산 산정과 초과 여부 확인이다. 초과가 확인될 때만 일부 교체 또는 가용한 신규자금 등 해소 방법을 비교한다. 알파드림 지정은 현재 포트폴리오와 별도 선택이므로, 현재 위험수준 유지 의향 및 향후 만기자금 운용 의사를 물어 유지/변경을 검토한다.

**구성 우선순위:** 한도 산정 확인 → 필요 시 조정 비교 → 현재 운용 의향 확인 → 향후 DO 설정 확인.

**고객에게 확인할 사항:**

- 보유 TDF의 정확한 빈티지·클래스 및 한도 산정상 예외 적용 여부는?
- 현재 위험수준 유지 의향이 그대로인가?
- DO를 보수적으로 지정한 이유가 있는가?

### 기존 브리핑에서 참고할 구성

- [B09-02](<../../../active/briefing-json/B09-02.json>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/active/briefing-json/B09-02.json): 비중 조정 시 기존 자산과 신규자금을 구분하는 구성. 고객 사실·금액·고객 발언은 이 사례로 옮기지 않는다.
- [B02-18](<../../../active/briefing-json/B02-18.json>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/active/briefing-json/B02-18.json): 지정상품과 현재 운용의 구분. 고객 사실·금액·고객 발언은 이 사례로 옮기지 않는다.

### 판단 논리를 보존한 기반지식

<a id="K-LIMIT"></a>
### K-LIMIT · 위험자산 한도와 적격 TDF·디폴트옵션 예외

근거: [SRC-003 · 개인형IRP 마케팅 보물지도](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/02_마케팅_캠페인/개인형IRP_마케팅_보물지도_Vol1.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/02_%EB%A7%88%EC%BC%80%ED%8C%85_%EC%BA%A0%ED%8E%98%EC%9D%B8/%EA%B0%9C%EC%9D%B8%ED%98%95IRP_%EB%A7%88%EC%BC%80%ED%8C%85_%EB%B3%B4%EB%AC%BC%EC%A7%80%EB%8F%84_Vol1.md#L171-L183) · L171–183 · 자료 기준 2026-03

**이 고객에게 적용할 때:** 실적배당형 비중과 법규상 위험자산 산정비중을 구분하는 근거. 예외 적용 여부는 정확한 상품·클래스와 원장으로 확인한다.

<!-- source-excerpt {"key": "K-LIMIT", "path": "knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/02_마케팅_캠페인/개인형IRP_마케팅_보물지도_Vol1.md", "start": 171, "end": 183, "sha256": "a510df6f3f98623d0df4c968bd37c0d6790abd9a258cf49de1e2e51e586a7360"} -->
> ### 투자가능상품 (운용가능 상품)
>
> | 원리금보장형 상품 | 실적배당형 상품 | 디폴트옵션 상품(10종) |
> | --- | --- | --- |
> | 시중은행 정기예금 / 저축은행 정기예금 / 보험사 이율보증형보험(GIC) / 증권사 파생결합사채(ELB) | 펀드 / TDF / ETF | 지켜드림 / 알파드림 1,2,3 / 뿔려드림 1,2,3 / 모두드림 1,2,3 |
>
> ① 정기예금 및 이율보증형보험은 예금자보호법에 따라 원금과 소정의 이자를 합하여 1인당 "1억원까지" 보호됩니다. 단, ELB는 예금자보호법에 따라 보호되지 않아요.
>
> ② 근로자퇴직급여 보장법 시행령에 따라 주식형 및 주식혼합형 펀드의 경우 위험자산으로 분류되어 전체 적립금의 70% 범위 내에서만 운용할 수 있어요.
>
> ③ 금감원장이 정한 기준을 충족한 TDF(적격 TDF), 디폴트옵션 상품은 적립금의 100%까지 운용할 수 있어요. 당행 퇴직연금에서 운용 가능한 TDF는 전부 적격 TDF입니당!!!
>
> > **잠깐!**
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

DEP-004/ETF-001은 한도 확인 뒤 안정 부분을 조정할 때의 대안이고, DO-006은 향후 지정 비교다. 이미 보유한 TDF·S&P500을 추가 매수하라는 제안은 아니다.

아래 상품은 고객별 **비교 후보 또는 유지할 설정**이다. 동시에 모두 매수하는 배분안이 아니다. `SRC-099`는 상품자료를 정리한 마스터로, 원 상품자료 S01~S05 파일은 이 작업에서 저장소 내 실물을 찾지 못했다. 마스터 레코드까지 대조했으며 원 상품자료 재검증·현재 판매가능 확인을 완료한 것으로 표시하지 않는다.

9월 예금금리는 2026-09-01~09-30 적용자료, 월간 펀드 성과는 2026-08-28, 판매목록 성과는 기준일 미기재다. 10월 이후 자금에 9월 금리를 약속하지 않는다. 고객별 손익과 상품 마스터의 관측성과를 섞지 않는다.

| 상품/자료 ID | 이 고객에게 연결하는 이유 | 선택 전 확인 |
|---|---|---|
| [DEP-004 · 하나은행 퇴직연금용 정기예금](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md#DEP-004>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#DEP-004) | 실제 조정 필요 시 기존 예금과 같은 안정 운용 역할 비교. | 매도손익·중도해지와 실제 한도 산정 확인. |
| [ETF-001 · KODEX 단기채권PLUS](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md#ETF-001>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#ETF-001) | 자료상 100% 운용가능 단기채 ETF를 잔여자금 후보로 비교. | 원금보장 아님. ETF 거래방식·현재 운용가능 비율 확인. |
| [DO-006 · 불려드림II](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md#DO-006>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#DO-006) | 향후 기본 설정을 바꾸려는 의사가 있을 때만 중위험 구성 비교. | 현재 알파드림 유지도 가능. 성향·손실감내·구성비를 재확인. |

### 전략 적용 조건 원문

#### PM-10 · 이 고객에서의 적용

70% 관련 상품 선택의 참고 카드이며 현재 위반 판정이나 해소액 산식의 근거로 사용하지 않는다.

출처: [SRC-100 · PM-10](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MATCHING_KB.md#PM-10>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MATCHING_KB.md#L666-L723) · 해당 카드 L666–723. **자료 기반 기획 해석**이며 공식 업무규정과 구분한다.

> ### PM-10 · 위험자산 70% 수준 도달 후 잔여자금 운용
>
> **적용할 때 보는 데이터:** 계좌 위험자산 비중 및 실제 상품별 운용가능비율 / 남은 현금/예금의 금액 / 기존 주식·채권·TDF 합산 노출.
>
> **고객과 확인:** 남은 자금은 안전하게 두려는 의도인가? / 한도 때문에 다른 선택지가 없다고 생각한 것인가? / 잔여자금도 손실감내 범위 내에서 운용할 의향이 있는가?
>
> **관리방향:** 잔여자금을 반드시 투자해야 하는 것은 아니다. 원문에서 운용가능비율 100%로 표기된 상품도 실제 위험·기존 노출·고객 의사에 맞는지 확인한 뒤 후보로 비교한다.
>
> | 추가로 확인된 조건 | 검토 상품군/방식 |
> |---|---|
> | 의도적 원리금보장 비중 | 현 구조 유지 |
> | 낮은 변동성 추구·실적배당 허용 | 100% 표기 단기채 ETF/펀드 |
> | 혼합 운용 의향 | 100% 표기 채권혼합·적격 TDF를 개별 확인 |

> **제외·유지·보류:** 100% 운용가능을 위험자산 규제를 무시하는 근거로 쓰지 않는다. 해외채권·하이일드 등 모든 채권형이 100%라고 일반화하지 않는다. 이 마스터 FND-005/006은 원문 70%다. 고객이 안정성을 위해 남겨둔 부분은 유지가 가능하다.
>
> **S3에 쓸 수 있는 관리방향 문장(기획 예시):**
>
> > 남은 자금이 안정성을 위해 유지된 것인지 먼저 확인합니다. 추가 운용 의향이 있다면 실제 상품별 운용가능비율과 위험을 확인해 단기채·채권혼합 등 비교 가능한 대안을 살펴봅니다.
>
> **후속 확인:** 04-12-17A의 현재 상품별 한도와 계좌 매수가능액을 조회한다. 정밀 규제 산식은 이 문서에서 새로 구현하지 않는다.
>
> **판단 근거:** E06:고객 질문 Case 4·실전문제 Q1; S05:선정 상품별 한도; K02:CASE 19.  
> **기존 문서 연결:** RS-04, RS-18, CASE 19 (RS는 K01, CASE는 K02의 버전 기준).

#### PM-08 · 이 고객에서의 적용

성향-설정 차이를 대화 주제로만 사용한다.

출처: [SRC-100 · PM-08](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MATCHING_KB.md#PM-08>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MATCHING_KB.md#L539-L594) · 해당 카드 L539–594. **자료 기반 기획 해석**이며 공식 업무규정과 구분한다.

> ### PM-08 · 투자성향 대비 보수적인 포트폴리오
>
> **적용할 때 보는 데이터:** 최신 성향과 분석일 / 보유 자산배분·현재 디폴트옵션 위험도 / 설정일과 변경 이력.
>
> **고객과 확인:** 노후자금은 별도로 안전하게 두려는 의도인가? / 과거 설정을 그대로 둔 것인가? / 실제 손실감내·투자 의향이 성향분석 결과와 같은가?
>
> **관리방향:** 불일치는 점검 신호다. 투자성향이 상대적으로 높아도 현재 운용이 고객 목적에 맞으면 유지한다. 의도와 어긋난 과거 설정일 때만 변경 후보를 비교한다.
>
> | 추가로 확인된 조건 | 검토 상품군/방식 |
> |---|---|
> | 안전 운용이 의도된 선택 | 기존 초저위험·예금 유지 |
> | 일부 실적배당으로 조정 의향 | 낮은 단계의 혼합/디폴트옵션 비교 |
> | 장기자금·TDF 투자 희망 | 실제 기간에 맞는 TDF |

> **제외·유지·보류:** 공격투자형 판정만으로 모두드림 등 고위험으로 자동 매핑하지 않는다. 성향 설문에 고객이 동의하지 않으면 상품보다 성향 재확인을 우선한다.
>
> **S3에 쓸 수 있는 관리방향 문장(기획 예시):**
>
> > 투자성향과 실제 운용의 차이가 의도된 선택인지 확인합니다. 안정성 우선 의도가 명확하면 유지하고, 과거 설정이 현재 의사와 다를 때만 구성 조정을 검토합니다.
>
> **후속 확인:** 현재 지정상품·실제 보유상품·실행예정상품을 별도로 기록한다.
>
> **판단 근거:** E07:위험도별 선택·활용 Tip; K02:CASE 14.  
> **기존 문서 연결:** RS-04, RS-17, CASE 14 (RS는 K01, CASE는 K02의 버전 기준).


### 상품 마스터 원문 레코드

후보의 구성·위험·가용성·출처를 생략하지 않도록 원문 레코드를 접어두었다. `runtime_verified: false` 상태도 보존한다.

<details><summary>DEP-004 원문 레코드 · L357–418</summary>

[상품 원문](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#L357-L418)

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

</details>

<details><summary>ETF-001 원문 레코드 · L5693–5768</summary>

[상품 원문](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#L5693-L5768)

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

T-DO의 선택권 설명을 중심으로 현재 알파드림을 선택한 이유를 묻는다. 추가납입 화법은 공제잔여·자금 여력·소득을 확인했을 때만 별도 분기로 사용한다.

아래 인용은 **저장소 MD의 해당 구간을 문장 수정 없이 발췌**했다. PDF/영상 자체를 다시 대조한 결과와 구분한다. 문서의 설명·예시 고객 반응은 실제 고객 발언이 아니다. 고객용 최종 화법은 작성자가 호칭·날짜·금액·상품 및 적용 조건을 맞춰 편집한다.

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

<a id="T-CONTRIBUTION"></a>
### T-CONTRIBUTION · 납입한도 확인 → 미소진 안내 → 자동이체/거절 후속

근거: [SRC-003 · 개인형IRP 마케팅 보물지도](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/02_마케팅_캠페인/개인형IRP_마케팅_보물지도_Vol1.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/02_%EB%A7%88%EC%BC%80%ED%8C%85_%EC%BA%A0%ED%8E%98%EC%9D%B8/%EA%B0%9C%EC%9D%B8%ED%98%95IRP_%EB%A7%88%EC%BC%80%ED%8C%85_%EB%B3%B4%EB%AC%BC%EC%A7%80%EB%8F%84_Vol1.md#L548-L559) · L548–559 · 자료 기준 2026-03

**이 고객에게 적용할 때:** 작년 미소진 여부는 고객의 실제 납입이력으로 확인한다. 올해 잔여한도와 고객이 낼 수 있는 돈은 다르며, 추가납입과 현재 현금 운용도 별개다.

<!-- source-excerpt {"key": "T-CONTRIBUTION", "path": "knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/02_마케팅_캠페인/개인형IRP_마케팅_보물지도_Vol1.md", "start": 548, "end": 559, "sha256": "8366252c29bc8290407953b316b13fa6c5700e404a5eee3aa10972cdafec302b"} -->
> ### 추가납 — 연 900만원 미만 납입 고객
>
> **ACTION — 당행 및 타행 부담금 입금한도 확인하기**
>
> - **방법1**: **[06-12-151]** 개인부담금 연합회 한도 조회
>   - 고객고유번호 입력 후 조회
> - **방법2**: **[04-12-644]** 퇴직연금 거래내역 조회
>   - 조회기간 설정 필요
>
> **SCRIPT**
>
> **[행원]** 고객님, 확인해 보니 작년에 세액공제 한도 900만원을 다 활용을 못 하셨더라구요. 올해는 꼭 놓치지 말고 채우세요. IRP는 연간 900만원까지 세액공제가 가능하니 자동이체 금액을 늘리시는 게 어떠세요? **(거절 시)** 여유자금 생기실 때 꼭 추가입금 하세요. 궁금하신 점 있으시면 언제든지 연락주세요.
<!-- /source-excerpt -->


## 5. S5 재료 — 단말 업무와 Hot Tip

### 단말 업무화면

| 화면번호 | 자료상 화면명 | 이 고객에서 쓸 목적·순서 | 근거 |
|---|---|---|---|
| `04-12-354` | 컴플라이언스 위반점검현황 조회 | 위험자산 투자한도 초과 여부·상품별 내역 확인을 최우선. | [SRC-027 L104](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L104) |
| `04-12-642` | 적립금및수익률조회 | 전체 평가액과 상품별 비중 대조. | [SRC-027 L65](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L65) |
| `04-12-17A` | New퇴직연금상품조회 | TDF 정확한 유형과 비교상품 운용가능비율 확인. | [SRC-003 L803](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/02_마케팅_캠페인/개인형IRP_마케팅_보물지도_Vol1.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/02_%EB%A7%88%EC%BC%80%ED%8C%85_%EC%BA%A0%ED%8E%98%EC%9D%B8/%EA%B0%9C%EC%9D%B8%ED%98%95IRP_%EB%A7%88%EC%BC%80%ED%8C%85_%EB%B3%B4%EB%AC%BC%EC%A7%80%EB%8F%84_Vol1.md#L803) |
| `04-12-640` | 상품운용내역조회 | 현재 DO 실행 여부와 주문 확인. | [SRC-027 L68](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L68) |
| `06-12-611` | 보유상품변경 | 필요·동의가 확인된 현 보유 조정. | [SRC-027 L67](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L67) |
| `06-12-610` | 입금예정상품 등록/변경 | 향후 DO 지정 유지/변경을 별도 처리. | [SRC-027 L66](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L66) |

화면번호는 저장소 자료와 대조한 업무 참조다. 사내 단말 접속·화면 실행은 하지 않았다. `04-12-179`(기존 화면안내)와 `04-12-17A`(New 화면 표기)는 각 출처의 표기를 유지한다.

### Hot Tip 원문과 고객별 활용

#### Hot Tip #205618 · * 퇴직연금 100% 투자 가능 상품 정리 *

[사내 게시글 원문](https://lxp.kbstar.com/app/board/hottip-my/view/205618.CE4B50AEEA1665EF2905288D99BC06C0708008CFCF5DAC0138801FB65CE7C997) · [저장소 MD](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/posts/2026-04-27_205618_퇴직연금 100% 투자 가능 상품 정리.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2026-04-27_205618_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88%20100%25%20%ED%88%AC%EC%9E%90%20%EA%B0%80%EB%8A%A5%20%EC%83%81%ED%92%88%20%EC%A0%95%EB%A6%AC.md) · 게시일 2026-04-27

**연결 이유:** 실제 초과 확인과 조정 방법을 연결하는 현장 자료.

<a id="H-LIMIT-A"></a>
#### H-LIMIT-A · 한도 초과 시 교체매매 또는 추가입금

근거: [SRC-077 · * 퇴직연금 100% 투자 가능 상품 정리 *](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/posts/2026-04-27_205618_퇴직연금 100% 투자 가능 상품 정리.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2026-04-27_205618_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88%20100%25%20%ED%88%AC%EC%9E%90%20%EA%B0%80%EB%8A%A5%20%EC%83%81%ED%92%88%20%EC%A0%95%EB%A6%AC.md#L30-L36) · L30–36 · 자료 기준 2026-04-27

**이 고객에게 적용할 때:** 한도 초과를 실제 원장에서 확인한 후 참고하는 현장 팁. 상품별 예외·산정방식은 SRC-003 및 단말 조회와 대조한다.

<!-- source-excerpt {"key": "H-LIMIT-A", "path": "knowledge/corpus/03_스타런_영업점_Hottip/posts/2026-04-27_205618_퇴직연금 100% 투자 가능 상품 정리.md", "start": 30, "end": 36, "sha256": "1280adabc8b0af42431b00f26e7efcbe4c56944ea51371eaef79e8a2686f064f"} -->
> ♣ 한도 초과 시 조치 방법
>
> 초과 금액을 정기예금 등 안전자산으로 교체매매 또는 추가입금 후 안전자산으로 운용지시
>
> ♣ 유의사항
>
> 투자한도 초과에 따른 별도 페널티 없음
<!-- /source-excerpt -->

<a id="H-LIMIT-B"></a>
#### H-LIMIT-B · 위험자산 투자한도 초과내역 조회

근거: [SRC-077 · * 퇴직연금 100% 투자 가능 상품 정리 *](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/posts/2026-04-27_205618_퇴직연금 100% 투자 가능 상품 정리.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2026-04-27_205618_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88%20100%25%20%ED%88%AC%EC%9E%90%20%EA%B0%80%EB%8A%A5%20%EC%83%81%ED%92%88%20%EC%A0%95%EB%A6%AC.md#L42-L58) · L42–58 · 자료 기준 2026-04-27

**이 고객에게 적용할 때:** 고객 데이터의 실적배당 비중을 위반 판정으로 바로 쓰지 않고 이 화면에서 상품별 초과내역을 확인한다.

<!-- source-excerpt {"key": "H-LIMIT-B", "path": "knowledge/corpus/03_스타런_영업점_Hottip/posts/2026-04-27_205618_퇴직연금 100% 투자 가능 상품 정리.md", "start": 42, "end": 58, "sha256": "09a6421b0fe3f21567a665df7d1ac2fcca1419f9ddf83f39a79e00512c4aed01"} -->
> **3. 위험자산 투자한도 초과 내역 확인 방법**
>
> 화면코드 : 컴플라이언스 위반점검 현황조회 [04-12-354] 화면에서 확인 가능
>
> 계좌번호 입력
>
> 기준일자 입력 (당일 또는 조회 희망일)
>
> 조회구분 → "위험자산투자한도위반" 선택
>
> 조회 버튼 클릭
>
> ☞ 확인 가능 항목
>
> 고객명 / 위반기준일 / 위반일수
>
> 한도초과상품 / 초과금액 / 보유가능금액
<!-- /source-excerpt -->


Hot Tip 링크는 원문 MD에 기록된 주소 그대로다. 로그인 접근·현재 업무 유효성은 검증하지 않았다. 현장 경험담의 절차는 본부 화면자료와 대조하여 사용한다.

## 6. 출처 목록

| Source ID | 자료 | 성격·기준시점 |
|---|---|---|
| SRC-003 | [개인형IRP 마케팅 보물지도](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/02_마케팅_캠페인/개인형IRP_마케팅_보물지도_Vol1.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/02_%EB%A7%88%EC%BC%80%ED%8C%85_%EC%BA%A0%ED%8E%98%EC%9D%B8/%EA%B0%9C%EC%9D%B8%ED%98%95IRP_%EB%A7%88%EC%BC%80%ED%8C%85_%EB%B3%B4%EB%AC%BC%EC%A7%80%EB%8F%84_Vol1.md) | Official / Internal Guide / Internal · 2026-03 |
| SRC-027 | [퇴직연금 주요거래 화면번호 안내](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md) | Reference / Internal · Unknown |
| SRC-077 | [* 퇴직연금 100% 투자 가능 상품 정리 *](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/posts/2026-04-27_205618_퇴직연금 100% 투자 가능 상품 정리.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2026-04-27_205618_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88%20100%25%20%ED%88%AC%EC%9E%90%20%EA%B0%80%EB%8A%A5%20%EC%83%81%ED%92%88%20%EC%A0%95%EB%A6%AC.md) | Field Know-how / Experiential · 2026-04-27 |
| SRC-098 | [연금왕 찐천재 마스터북 — Level 2 / 7주차 디폴트옵션 상품](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/03_영업화법_스크립트_연금왕찐천재/연금왕찐천재_마스터북_Level2_7주차_디폴트옵션상품.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/03_%EC%98%81%EC%97%85%ED%99%94%EB%B2%95_%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8_%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC/%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC_%EB%A7%88%EC%8A%A4%ED%84%B0%EB%B6%81_Level2_7%EC%A3%BC%EC%B0%A8_%EB%94%94%ED%8F%B4%ED%8A%B8%EC%98%B5%EC%85%98%EC%83%81%ED%92%88.md) | Training Material / Internal · 2026-08 (수익률 2026-08-20 기준) |
| SRC-099 | [PRODUCT_MASTER — 개인형IRP 브리핑용 상품 마스터](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md) | Product Data / Internal · 2026-09-10 (금리 2026-09 적용, 추천펀드 성과 2026-08-28 기준, 판매목록 기준일 미기재) |
| SRC-100 | [PRODUCT_MATCHING_KB — 고객상황 → 상품 후보 매핑](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MATCHING_KB.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MATCHING_KB.md) | Product Data / Internal · 2026-09-10 (수치는 SRC-099 마스터의 읽기용 요약) |

## 7. 고객 데이터·대화 원문 부록

<details><summary>대화 자료의 고객 인덱스 원문 — 열 의미를 임의 추정하지 않음</summary>

```json
{
  "raw_row": "박지민 154821-4938201 34 적극투자형 – 있음 300만 설정 1 lim, tax, add",
  "name": "박지민",
  "customer_id": "154821-4938201",
  "age": 34,
  "investment_profile": "적극투자형",
  "isa_maturity_flag_raw": "–",
  "unlabeled_source_column_6": "있음",
  "tax_deduction_remaining_raw": "300만",
  "default_option_status_raw": "설정",
  "unlabeled_source_column_9": 1,
  "target_code_text_raw": "lim, tax, add",
  "target_codes": [
    "lim",
    "tax",
    "add"
  ]
}
```

</details>

<details><summary>고객 DATA 전체 — 입력 JSON의 display_data 그대로</summary>

```json
{
  "schemaVersion": "customer-briefing-display.v0.1",
  "briefingMeta": {
    "caseId": "C01-02",
    "dataType": "시연용가상고객",
    "asOfDate": "2026-09-29",
    "generatedAt": "2026-09-29T07:00:00+09:00",
    "currency": "KRW"
  },
  "customer": {
    "customerId": "154821-4938201",
    "name": "박지민",
    "age": 34,
    "gender": "여",
    "starClubGrade": "그랜드",
    "investmentProfile": "적극투자형",
    "irpOpenedAt": "2022-06-10",
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
      "label": "투자성향-DO불일치",
      "source": "동료 IRP Agent 시연 데이터(9 Cases v3)"
    }
  ],
  "irpAccount": {
    "valuationAmountKrw": 32000000,
    "assetAllocation": [
      {
        "assetType": "원리금보장형",
        "amountKrw": 7000000,
        "weightPct": 21.9
      },
      {
        "assetType": "실적배당형",
        "amountKrw": 24000000,
        "weightPct": 75
      },
      {
        "assetType": "현금성자산",
        "amountKrw": 1000000,
        "weightPct": 3.1
      }
    ],
    "oneYearReturnPct": 16.9,
    "taxDeductionRemainingKrw": 3000000,
    "latestProductOpening": {
      "holdingId": "H002",
      "productId": "DEP-004",
      "productName": "하나은행 퇴직연금 정기예금 1년",
      "openedAt": "2026-02-01",
      "amountKrw": 7000000
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
      "valuationAmountKrw": 1000000,
      "weightPct": 3.1,
      "oneYearReturnPct": null,
      "openedAt": "2022-06-10",
      "allocationBreakdown": null,
      "flags": []
    },
    {
      "holdingId": "H002",
      "productId": "DEP-004",
      "productName": "하나은행 퇴직연금 정기예금 1년",
      "assetType": "원리금보장형",
      "productCategory": "정기예금",
      "contractTerm": "1년",
      "valuationAmountKrw": 7000000,
      "weightPct": 21.9,
      "oneYearReturnPct": 3.2,
      "openedAt": "2026-02-01",
      "allocationBreakdown": null,
      "flags": []
    },
    {
      "holdingId": "H003",
      "productId": "MF-001",
      "productName": "KB 온국민 TDF 시리즈",
      "assetType": "실적배당형",
      "productCategory": "TDF",
      "contractTerm": null,
      "valuationAmountKrw": 14800000,
      "weightPct": 46.2,
      "oneYearReturnPct": 23.3,
      "openedAt": "2025-04-14",
      "allocationBreakdown": null,
      "flags": []
    },
    {
      "holdingId": "H004",
      "productId": "ETF-006",
      "productName": "RISE 미국S&P500 ETF",
      "assetType": "실적배당형",
      "productCategory": "ETF",
      "contractTerm": null,
      "valuationAmountKrw": 9200000,
      "weightPct": 28.8,
      "oneYearReturnPct": 15,
      "openedAt": "2026-01-08",
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
      "올해개인부담금납입액원": 4000000,
      "개인부담금납입이력": [
        {
          "연도": 2023,
          "납입금액원": 7000000
        },
        {
          "연도": 2024,
          "납입금액원": 9000000
        },
        {
          "연도": 2025,
          "납입금액원": 8000000
        }
      ],
      "타연금계좌올해납입액원": 2000000,
      "세액공제기준한도원": 9000000,
      "세액공제잔여한도원": 3000000,
      "퇴직급여재원금액원": 0,
      "개인부담금재원금액원": 32000000
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
      "최근운용지시일": "2026-07-22",
      "최근상품매매일": "2026-07-22",
      "최근입금일": "2026-07-01",
      "최근1년상품매매횟수": 7
    },
    "퇴직및인출": {
      "연금수령요건충족여부": false,
      "연금개시여부": false,
      "연금지급설계등록여부": false
    },
    "최근사건": [
      {
        "이벤트식별자": "T001",
        "발생일시": "2027-02-01T00:00:00+09:00",
        "이벤트유형": "상품만기예정",
        "계좌구분": "IRP",
        "관련보유상품식별자": "H002",
        "금액원": 7000000,
        "처리상태": "예정",
        "채널": null
      }
    ],
    "금융거래": [],
    "상담이력": [
      {
        "상담식별자": "CRM001",
        "상담일시": "2025-12-20T00:00:00+09:00",
        "상담채널": null,
        "상담유형": "퇴직연금사후관리",
        "상담메모": "연말 세액공제 한도 안내. 추가 납입 후에도 기존 실적배당상품 운용을 유지하고 싶다는 의사 확인."
      },
      {
        "상담식별자": "CRM002",
        "상담일시": "2026-07-02T00:00:00+09:00",
        "상담채널": null,
        "상담유형": "퇴직연금사후관리",
        "상담메모": "미국주식형 자산의 최근 성과를 점검함. 단기 변동성은 감수 가능하며 현재 운용방향 유지 희망."
      }
    ],
    "외부계좌": [],
    "투자성향이력": [
      {
        "이력식별자": "R001",
        "분석일": "2026-06-11",
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
        "값": 3.1,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M002",
        "지표유형": "파생값",
        "지표명": "원리금보장·현금성자산합산비중",
        "대상참조": null,
        "값": 25,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M003",
        "지표유형": "파생값",
        "지표명": "위험자산(실적배당형)비중",
        "대상참조": null,
        "값": 75,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M004",
        "지표유형": "파생값",
        "지표명": "동연령대평균수익률",
        "대상참조": null,
        "값": 9.4,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M005",
        "지표유형": "파생값",
        "지표명": "동연령대상위1%평균수익률",
        "대상참조": null,
        "값": 25.7,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M006",
        "지표유형": "파생값",
        "지표명": "동연령대상위1%평균원리금보장비중",
        "대상참조": null,
        "값": 22,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M007",
        "지표유형": "기간",
        "지표명": "최근 운용변경 후 경과개월수",
        "대상참조": null,
        "값": 2.3,
        "단위": "개월",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M008",
        "지표유형": "기간",
        "지표명": "최근 상담 후 경과일수(장기 미접촉)",
        "대상참조": null,
        "값": 89,
        "단위": "일",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M009",
        "지표유형": "파생값",
        "지표명": "최근 1개월 현금성자산 증감액",
        "대상참조": null,
        "값": -500000,
        "단위": "원",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M010",
        "지표유형": "상태비교",
        "지표명": "위험자산 한도(70%) 초과 여부",
        "대상참조": null,
        "값": true,
        "단위": null,
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
    "확인된특이사항": [
      {
        "구분": "한도점검",
        "내용": "위험자산 비중 75%로 DC·개인형IRP 투자한도 70% 초과. 카탈로그에 해당 Segment가 없어 뱃지로는 표시하지 않음"
      }
    ],
    "가상설정메모": [
      "동료 IRP Agent 시연 데이터(9 Cases v3)에서 옮긴 시연 데이터. 기준일 2026-09-29.",
      "성별은 시연용 가정. 세액공제 잔여 300만원은 도넛으로 표시."
    ]
  }
}
```

</details>

### 고객별 매핑 대화 전체

질문과 답변은 입력 파일의 문자열을 그대로 보존했다. 포함된 세율·상품·화면번호·데모 링크가 검증되었다는 뜻은 아니다. 위 검토사항과 함께 사용한다.

<a id="dialogue-3"></a>
<details><summary>행 3 · 위험자산 한도 초과라는데 뭐가 문제고 뭘 해야 하는 거야?</summary>

매핑 방식 `explicit_name` · 확신도 `high` · 매핑 메모: 원문 답변에 고객명이 직접 명시됨

원문 세그먼트 표기: `None` · 선행/후속 원문: `None`

**질문 원문**

> 위험자산 한도 초과라는데 뭐가 문제고 뭘 해야 하는 거야?

**답변 원문**

> 박지민 고객님은 적극투자형 성향이지만 위험자산 비중이 75%로 DC·개인형IRP 투자한도인 70%를 초과하여 컴플라이언스 위반 점검 대상이 되었습니다. 이 규정 사항은 고객의 투자성향과 무관하게 한도 내로 조정해야 하므로 다른 위험자산 조정 전략에 흡수시키지 않고 우선적으로 해소해야 합니다. 위험자산 한도를 초과한 계좌를 해소하는 방법은 초과 금액을 정기예금 등 안전자산으로 교체매매하거나, 추가입금 후 안전자산으로 운용지시하여 분모를 늘려 비율을 해소하는 두 가지 방법이 있습니다.

</details>

<a id="dialogue-23"></a>
<details><summary>행 23 · 이 고객 ISA 만기자금 갖고 있어?</summary>

매핑 방식 `explicit_name` · 확신도 `high` · 매핑 메모: 원문 답변에 고객명이 직접 명시됨

원문 세그먼트 표기: `None` · 선행/후속 원문: `None`

**질문 원문**

> 이 고객 ISA 만기자금 갖고 있어?

**답변 원문**

> 박지민 고객님은 ISA 만기자금 보유 내역이 없어요.

</details>

<a id="dialogue-24"></a>
<details><summary>행 24 · 이 고객 판매중단 상품 들고 있는 거 있어?</summary>

매핑 방식 `context_and_data_match` · 확신도 `high` · 매핑 메모: 직전 ISA 보유 여부 질문과 이어지는 동일 고객 계좌상태 문답

원문 세그먼트 표기: `None` · 선행/후속 원문: `None`

**질문 원문**

> 이 고객 판매중단 상품 들고 있는 거 있어?

**답변 원문**

> 판매중단 보유상품은 없어요.

</details>

<a id="dialogue-159"></a>
<details><summary>행 159 · 이 고객 세액공제율 몇 퍼센트 적용돼?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 박지민` · 선행/후속 원문: `None`

**질문 원문**

> 이 고객 세액공제율 몇 퍼센트 적용돼?

**답변 원문**

> 고객의 소득 수준이나 종합소득금액 값이 자료에 나와 있지 않아 해당 고객의 세액공제율을 바로 확정해 말씀드리기는 어려워요. 2026년 6월 기준 자료에 따르면, 공제율은 총급여 5,500만원 이하(종합소득금액 4,500만원 이하)인 경우 16.5%, 이를 초과하는 경우 13.2%가 적용돼요. 여기서 5,500만원 '이상'이 아니라 '초과'가 정확한 경계 표현이며, 5,500만원 정확히 일치하는 금액은 16.5% 구간에 해당한다는 점을 참고해 주세요. 단말에서 고객의 소득 조건을 먼저 확인하신 뒤에 안내를 이어가셔야 해요.

</details>

<a id="dialogue-160"></a>
<details><summary>행 160 · ISA 만기자금 IRP로 옮기면 세액공제 어떻게 돼?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 박지민` · 선행/후속 원문: `None`

**질문 원문**

> ISA 만기자금 IRP로 옮기면 세액공제 어떻게 돼?

**답변 원문**

> ISA 만기자금을 IRP로 옮겼을 때의 세액공제 관련 자료는 아직 준비된 것이 없어요. 박지민 고객의 개인형IRP 계좌 추가 납입에 대해서는, 잔여한도 300만원을 채워 총 900만원을 납입할 경우 총급여 5,500만원 이하(16.5%) 기준으로 환급 예상액이 990,000원에서 1,485,000원으로 늘어나 495,000원이 증가해요. 단, 세액공제 전 결정세액이 공제액보다 적으면 최대 환급액을 받지 못한다 — 소득이 낮은 고객에게 "900만원 넣으면 무조건 148.5만원"이라고 안내하면 오안내다.

</details>

<a id="dialogue-162"></a>
<details><summary>행 162 · 판매중단된 펀드 뭐 들고 있어?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 박지민` · 선행/후속 원문: `None`

**질문 원문**

> 판매중단된 펀드 뭐 들고 있어?

**답변 원문**

> 판매중단된 보유상품은 없어요.

</details>


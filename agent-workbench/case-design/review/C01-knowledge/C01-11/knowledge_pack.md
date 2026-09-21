# C01-11 박정호 · 브리핑 작성용 기반지식

**용도:** 작성자가 S1~S5 솔루션을 구성할 때 사용할 고객별 재료. 아래 솔루션 방향은 편집자의 작업 가설이며 완성 브리핑/매수 지시가 아니다.

고객 데이터 기준일: **2026-09-29** · 개별 매핑 대화 **10건** · 작성일 2026-09-21

[전체 고객 색인](<../README.md>) · [고객·대화 입력 JSON](<../../../../../C01_고객DATA_대화_원문매핑.json>) · [해당 고객 JSON](<../../../active/display-data/C01-11.json>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/active/display-data/C01-11.json)

입력 위치: `customers[10]` (`case_id=C01-11`). 대화 행 번호는 원본 `source_row_no`이며 고객 상담 발생 순서를 뜻하지 않는다.

**다른 GPT 세션에서 사용:** 이 파일 하나를 첨부하면 고객 DATA·매핑 대화 전체·선별 지식 원문을 함께 검토할 수 있다. 원문 Git 링크는 `41ae9a4` 커밋에 고정했다. 인용의 문장은 그대로이며 상대 이미지 경로만 이 파일 위치에 맞췄다. GitHub 접근 권한과 사내 게시글 로그인은 별도다.

## 1. S1 작성 재료 — 고객 데이터와 세그먼트

| 항목 | 입력 데이터 | 데이터 위치 |
|---|---|---|
| 고객 | 박정호 · 58세 · 안정추구형 · 퇴직 | `/customer`, `/에이전트맥락데이터/고객계획` |
| 계좌 | 68,000,000원 · 표시 1년 수익률 3.2% | `/irpAccount` |
| 납입 | 올해 당행 개인부담금 3,000,000원 · 타 연금계좌 0원 · 공제잔여 표시값 6,000,000원 | `/에이전트맥락데이터/납입및세제` |
| 재원 | 퇴직급여 50,000,000원 · 개인부담금 18,000,000원 | 같은 절의 재원 필드 |
| 디폴트옵션 | 등록 · 지켜드림 · 미적용 | `/customer/defaultOption` |
| 연금개시 | 요건충족 표시값 True · 개시 False | `/에이전트맥락데이터/퇴직및인출` |

표시값과 대화·제도자료가 충돌하는 항목은 아래 검토사항에 남겼다. 표시값을 임의로 교정하지 않았다.

세그먼트 정의: [뱃지 카탈로그](<../../BADGE_CATALOG.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/review/BADGE_CATALOG.md). 뱃지는 현재 상태이며 그 자체가 자동 추천 결론은 아니다.

| 세그먼트 원문 | 사실 근거와 연결할 지식 |
|---|---|
| 원리금보장 편중 | 6,800만원 전액 예금. 원금손실 수용 의향 없이 위험자산 편입을 전제하지 않음. |
| 연금개시 가능 | 58세·퇴직·요건충족 true·미개시. 수령 시작과 월 필요액을 물은 뒤 K-PENSION·K-PAYMENT 연결. |

| 보유상품 원문 | 평가금액 | 비중 | 데이터상 플래그 |
|---|---:|---:|---|
| KB저축은행 퇴직연금 정기예금 1년 | 40,000,000원 | 58.8% | 없음 |
| 신한은행 퇴직연금 정기예금 1년 | 28,000,000원 | 41.2% | 없음 |

### 대화에서 찾은 솔루션 재료

| 대화 행 | 읽을 내용 | 이번 자료에서의 취급 |
|---|---|---|
| [행 17](#dialogue-17) | 지켜드림 지정과 상품변경 | 실제 보유 예금과 DO 지정 구분. |
| [행 34](#dialogue-34) | 공제잔여 600만원 | 퇴직 고객의 소득·결정세액·자금 여력 확인을 선행. |
| [행 58](#dialogue-58) | 연금개시 절차 | 조회와 실제 개시 동의를 나누어 사용. |
| [행 161](#dialogue-161) | 55세 미만 반론 | 58세 고객 사실과 불일치하여 도입 화법에서 제외. |
| [행 154](#dialogue-154) | DO 매도 후 변경 | 현재 실제 DO 보유가 아니므로 일괄 적용하지 않음. |

### 먼저 확인할 불일치·미확인 사항

- 이 고객은 58세다. 대화의 “55세 미만이라 개시 불가” 반론은 맞지 않는다.
- DO001 지정·미적용이고 실제 보유는 KB저축은행/신한 예금이다. 지정 변경만으로 두 번의 매매가 필요하다고 쓰지 않는다.
- 퇴직 상태이며 소득정보가 없다. 공제잔여 600만원은 실제 절세효과나 추가납입 가능자금이 아니다.
- 예금 만기는 2027년 1/15·4/20이다. 연금개시를 위해 무조건 지금 전액 해지한다고 가정하지 않는다.

## 2. 대략적인 솔루션 방향과 S2 근거

현재 연금수령을 시작할 의향과 필요한 월 금액부터 확인한다. 기존 예금 만기와 지급 가능 조건을 조회해 유지하면서 지급할 수 있는지, 지급을 위한 일부 변경이 필요한지를 비교한다. 공제잔여는 별도 세제 확인 항목이며 신규납입을 개시 준비의 필수 단계로 만들지 않는다.

**구성 우선순위:** 개시 의향/생활비 → 계좌 요건·재원 → 예금별 지급/해지조건 → 지급 방식 비교 → 선택한 업무.

**고객에게 확인할 사항:**

- 언제부터 얼마씩 연금을 받을 계획인가?
- 퇴직 후 다른 소득과 생활비 재원은?
- 기존 예금 유지와 일부 현금화 중 어떤 선택을 원하는가?
- 올해 실제 소득·결정세액과 미공제 재원은?

### 기존 브리핑에서 참고할 구성

- [B05-09](<../../../active/briefing-json/B05-09.json>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/active/briefing-json/B05-09.json): 수령계획과 지급재원의 연결. 고객 사실·금액·고객 발언은 이 사례로 옮기지 않는다.
- [B03-07](<../../../active/briefing-json/B03-07.json>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/active/briefing-json/B03-07.json): 예금 유지·해지 손익 비교. 고객 사실·금액·고객 발언은 이 사례로 옮기지 않는다.
- [B02-18](<../../../active/briefing-json/B02-18.json>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/active/briefing-json/B02-18.json): DO 지정과 실제 자금의 분리. 고객 사실·금액·고객 발언은 이 사례로 옮기지 않는다.

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

<a id="K-TAX"></a>
### K-TAX · 일반 납입·ISA 전환·실제 공제효과 구분

근거: [SRC-087 · IRP(개인형 퇴직연금)란? 계좌 개설부터 퇴직금 수령, 세액공제 혜택까지](<../../../../../knowledge/corpus/04_KBthink_연금/01_IRP_개인형퇴직연금.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/04_KBthink_%EC%97%B0%EA%B8%88/01_IRP_%EA%B0%9C%EC%9D%B8%ED%98%95%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88.md#L66-L82) · L66–82 · 자료 기준 2026-06-08

**이 고객에게 적용할 때:** KB Think 웹페이지를 저장소에서 정리한 문서이며 웹 원문의 직접 인용은 아니다. 고객의 소득·결정세액이 없으면 고객별 환급액을 확정하지 않는다.

<!-- source-excerpt {"key": "K-TAX", "path": "knowledge/corpus/04_KBthink_연금/01_IRP_개인형퇴직연금.md", "start": 66, "end": 82, "sha256": "5ef95a325a1ed47dc05e637f1371386237507e24078d5c7a182ec6c65267c2d4"} -->
> ## IRP 계좌 혜택 — 어떤 점이 좋나요?
>
> 1. **다양한 상품으로 운용 가능** — 정기예금, 원리금보장 ELB/DLB, 펀드, ETF, TDF 등을 원하는 비중으로 선택해 운용. 단, 주식형·주식혼합형 펀드 등 위험자산은 평가금액의 70% 이내에서만 운용 가능. 상품별 안정성·수익성 차이가 있으므로 투자성향과 재정 목표 파악 필요.
> 2. **과세이연 효과** — 과세이연은 세금 납부 시점을 미루는 것. IRP 계좌 안에서 발생한 배당금·이자·평가차익에 대해 과세 없이 재투자 가능.
> 3. **연말정산 세액공제** — 추가 적립액은 연말정산 세액공제 대상. 총급여액 5,500만원(종합소득금액 4,500만원) 이하: 연간 납입액 최대 900만원(연금저축 합산)까지 16.5% 공제 → 최대 148만 5,000원 감면. 초과 시 최대 13.2% 공제. ※ 세액공제 전 결정세액이 공제액보다 적으면 최대 환급액을 받지 못함.
> 4. **연금 수령 시 절세** — 연금으로 받으면 퇴직소득세 30~50% 절감, 운용 수익에는 연금소득세(3.3~5.5%) 적용.
>
> ## 자주 묻는 질문(FAQ)
>
> **Q. 개인형IRP 연간 납입 한도는?**
> 연간 1,800만원(전 금융기관 개인형IRP, DC/기업형IRP 개인부담금, 연금저축계좌 합산). 다음의 경우 별도 납입 가능:
> - ISA 만기자금(만기일로부터 60일 이내)
> - 1주택 고령가구(부부 중 1인 60세 이상)가 더 낮은 가격의 주택으로 이사한 경우 그 차액(양도일로부터 6개월 이내, 1억원 한도)
> - 부부합산 1주택 이하 기초연금 수급자가 10년 이상 보유한 국내 토지·건물(주택 포함)의 양도차익(양도일로부터 6개월 이내, 다운사이징 차액 포함 1억원 한도)
>
> **Q. 연말정산 세액공제 한도는?**
> 연금저축 + IRP 합산 연간 납입액 최대 900만원. ISA 만기자금 전환 시 전환 금액의 10%(300만원 한도) 추가 공제.
<!-- /source-excerpt -->


## 3. S3 재료 — 운용전략과 상품 매핑

현재 보유 예금 유지가 첫 비교 기준이다. 아래 예금/GIC는 다음 만기 또는 지급에 사용하지 않을 잔액의 조건 비교용이고, DO-001은 유지할 수 있는 향후 지정상품으로 기록한다.

아래 상품은 고객별 **비교 후보 또는 유지할 설정**이다. 동시에 모두 매수하는 배분안이 아니다. `SRC-099`는 상품자료를 정리한 마스터로, 원 상품자료 S01~S05 파일은 이 작업에서 저장소 내 실물을 찾지 못했다. 마스터 레코드까지 대조했으며 원 상품자료 재검증·현재 판매가능 확인을 완료한 것으로 표시하지 않는다.

9월 예금금리는 2026-09-01~09-30 적용자료, 월간 펀드 성과는 2026-08-28, 판매목록 성과는 기준일 미기재다. 10월 이후 자금에 9월 금리를 약속하지 않는다. 고객별 손익과 상품 마스터의 관측성과를 섞지 않는다.

| 상품/자료 ID | 이 고객에게 연결하는 이유 | 선택 전 확인 |
|---|---|---|
| [SAV-009 · SBI저축은행 퇴직연금 정기예금](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md#SAV-009>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#SAV-009) | 다음 만기에 안정 운용을 이어갈 경우의 비교 후보. | 현재 예금 해지손익·기관별 합산·연금지급 조건 확인. |
| [GIC-003 · 한화생명 GIC (2026년 9월 특별제공안)](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md#GIC-003>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#GIC-003) | 당장 지급에 쓰지 않는 장기 잔액의 구조 비교. | 현재 판매조건은 미검증. 장기 계약과 특별중도해지 조건을 정확히 확인. |
| [DO-001 · 지켜드림](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md#DO-001>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#DO-001) | 기존 초저위험 지켜드림 지정 유지 검토. | 실제 보유상품 아님. 현재 두 예금이 자동으로 이 상품으로 바뀌지 않음. |

### 전략 적용 조건 원문

#### PM-13 · 이 고객에서의 적용

실제 수령계획이 확인된 경우 지급일정과 상품 만기를 함께 본다.

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

#### PM-04 · 이 고객에서의 적용

안정성을 유지하는 조건 비교에만 사용한다.

출처: [SRC-100 · PM-04](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MATCHING_KB.md#PM-04>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MATCHING_KB.md#L267-L330) · 해당 카드 L267–330. **자료 기반 기획 해석**이며 공식 업무규정과 구분한다.

> ### PM-04 · 안정성을 유지하면서 금리 조건 개선
>
> **적용할 때 보는 데이터:** 현재 약정금리·잔여만기 / 기관별 보유금액과 중도해지 조건 / 신규 운용할 금액·사용가능기간.
>
> **고객과 확인:** 현재 상품을 유지할지 만기에 교체할지? / 중장기 만기 유지가 가능한가? / 예금자보호와 발행기관 신용 중 중시하는 조건은?
>
> **관리방향:** 같은 기간·같은 금리 계산기준으로 비교한다. 신규/만기자금과 기존계약 중도교체를 구분하고, 실제 변경 실익이 없으면 유지한다.
>
> | 추가로 확인된 조건 | 검토 상품군/방식 |
> |---|---|
> | 1년 원리금보장 운용 | 저축은행 정기예금 또는 1년 GIC |
> | 3~5년 남겨둘 자금 | 기간이 맞는 GIC |
> | 큰 금액·협의 절차 수용 | ELB도 내부 비교 가능하나 협의 완료 전 고객 제안 보류 |

> **제외·유지·보류:** 표시금리 차이만 보고 잔여만기·중도해지 이자를 무시하지 않는다. ELB를 예금자보호가 필요한 고객에게 동일 보호대안처럼 매핑하지 않는다. 저축은행의 3·6개월 참고금리는 가입상품이 아니다.
>
> **S3에 쓸 수 있는 관리방향 문장(기획 예시):**
>
> > 원리금보장 운용을 유지하면서 같은 기간의 예금·GIC 조건을 비교합니다. 기존 계약을 바꿀 경우에는 중도해지에 따른 이자 감소까지 확인해 실제 실익이 있는 경우에만 검토합니다.
>
> **후속 확인:** 제공한도·해당 제도·매수완료일 기준 적용금리 확인. ELB는 반드시 업체 확인/협의 완료 후 고객 제안.
>
> **판단 근거:** E05:상품마다 다른 금리 표시 기준·원픽 가이드; S03:L19-L29,L41,L58-L70; S02:L6-L14; K02:CASE 03.  
> **기존 문서 연결:** RS-15, CASE 03, CASE 16 (RS는 K01, CASE는 K02의 버전 기준).


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

<details><summary>DO-001 원문 레코드 · L7353–7452</summary>

[상품 원문](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#L7353-L7452)

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

</details>


## 4. S4 재료 — 영업화법 원문

예금만 운용해도 수령·금리 조건을 관리할 수 있다는 설명 뒤에 연금 전문상담을 연결한다. 개시와 추가납입을 서두르지 않으며 숙려 분기도 보존한다.

아래 인용은 **저장소 MD의 해당 구간을 문장 수정 없이 발췌**했다. PDF/영상 자체를 다시 대조한 결과와 구분한다. 문서의 설명·예시 고객 반응은 실제 고객 발언이 아니다. 고객용 최종 화법은 작성자가 호칭·날짜·금액·상품 및 적용 조건을 맞춰 편집한다.

<a id="T-SAFE"></a>
### T-SAFE · 예금만 해서 관리 불필요하다는 반론

근거: [SRC-010 · 연금왕 찐천재 마스터북 — 계약이전 화법(은행)](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/03_영업화법_스크립트_연금왕찐천재/연금왕찐천재_마스터북_계약이전화법_은행.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/03_%EC%98%81%EC%97%85%ED%99%94%EB%B2%95_%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8_%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC/%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC_%EB%A7%88%EC%8A%A4%ED%84%B0%EB%B6%81_%EA%B3%84%EC%95%BD%EC%9D%B4%EC%A0%84%ED%99%94%EB%B2%95_%EC%9D%80%ED%96%89.md#L145-L147) · L145–147 · 자료 기준 Unknown

**이 고객에게 적용할 때:** 타행 이전 상담 원천 중 사후관리에도 적용 가능한 문단. 최고금리·현재 비대면 제공 여부는 실제 비교 후 표현한다.

<!-- source-excerpt {"key": "T-SAFE", "path": "knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/03_영업화법_스크립트_연금왕찐천재/연금왕찐천재_마스터북_계약이전화법_은행.md", "start": 145, "end": 147, "sha256": "dfcde46deb30bfda1bf0655523b9a1f52e4f7a8f79995229709b7c94680cbb59"} -->
> ### Q5. 투자는 안하고, 예금만 해서 관리 필요 없어요
>
> **[키키 행원]** 예금과 같은 원리금보장상품도 관리가 중요합니다. 국민은행은 고객님들을 위해 매월 금리가 가장 좋은 상품을 지속적으로 제공하고 있고, GIC 등 고금리 원리금보장상품도 비대면으로 손쉽게 거래하실 수 있습니다.
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
| `04-12-642` | 적립금및수익률조회 | 두 예금의 평가와 지급 재원 확인. | [SRC-027 L65](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L65) |
| `04-12-644` | 거래내역 조회 | 퇴직급여/개인부담금 재원·납입이력 대조. | [SRC-027 L74](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L74) |
| `04-10-099` | 세금우대관련조회 | 연금개시 전 과세 관련 내역 확인. | [SRC-003 L495](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/02_마케팅_캠페인/개인형IRP_마케팅_보물지도_Vol1.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/02_%EB%A7%88%EC%BC%80%ED%8C%85_%EC%BA%A0%ED%8E%98%EC%9D%B8/%EA%B0%9C%EC%9D%B8%ED%98%95IRP_%EB%A7%88%EC%BC%80%ED%8C%85_%EB%B3%B4%EB%AC%BC%EC%A7%80%EB%8F%84_Vol1.md#L495) |
| `04-12-17A` | New퇴직연금상품조회 | 보유상품 지급 조건과 비교상품 조회. | [SRC-003 L803](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/02_마케팅_캠페인/개인형IRP_마케팅_보물지도_Vol1.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/02_%EB%A7%88%EC%BC%80%ED%8C%85_%EC%BA%A0%ED%8E%98%EC%9D%B8/%EA%B0%9C%EC%9D%B8%ED%98%95IRP_%EB%A7%88%EC%BC%80%ED%8C%85_%EB%B3%B4%EB%AC%BC%EC%A7%80%EB%8F%84_Vol1.md#L803) |
| `06-12-622` | 세액공제 미신청금액 등록/전환 신청 | 해당하는 미공제금액 등록/전환 관련 처리. | [SRC-027 L94](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L94) |
| `02-12-221` | 개인형IRP 연금지급 | 예상 지급 조회 후 고객이 선택한 지급 방식 등록. | [SRC-027 L50](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L50) |
| `04-12-640` | 상품운용내역조회 | 처리 중 주문·입금 및 실제 DO 실행 여부 확인. | [SRC-027 L68](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L68) |
| `06-12-611` | 보유상품변경 | 필요하고 동의한 일부 변경만 처리. | [SRC-027 L67](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L67) |

화면번호는 저장소 자료와 대조한 업무 참조다. 사내 단말 접속·화면 실행은 하지 않았다. `04-12-179`(기존 화면안내)와 `04-12-17A`(New 화면 표기)는 각 출처의 표기를 유지한다.

### Hot Tip 원문과 고객별 활용

#### Hot Tip #199404 · irp 연금 지급 절차

[사내 게시글 원문](https://lxp.kbstar.com/app/board/hottip-my/view/199404.D59E713BFC50ADBEAC5F8FB48C7B16253F22F4AF0D957938667E721AE592A4FD) · [저장소 MD](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/posts/2025-02-27_199404_irp 연금 지급 절차.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2025-02-27_199404_irp%20%EC%97%B0%EA%B8%88%20%EC%A7%80%EA%B8%89%20%EC%A0%88%EC%B0%A8.md) · 게시일 2025-02-27

**연결 이유:** 개시 요건·세제 확인·화면 절차와 진행 중 거래 확인.

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
| SRC-003 | [개인형IRP 마케팅 보물지도](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/02_마케팅_캠페인/개인형IRP_마케팅_보물지도_Vol1.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/02_%EB%A7%88%EC%BC%80%ED%8C%85_%EC%BA%A0%ED%8E%98%EC%9D%B8/%EA%B0%9C%EC%9D%B8%ED%98%95IRP_%EB%A7%88%EC%BC%80%ED%8C%85_%EB%B3%B4%EB%AC%BC%EC%A7%80%EB%8F%84_Vol1.md) | Official / Internal Guide / Internal · 2026-03 |
| SRC-010 | [연금왕 찐천재 마스터북 — 계약이전 화법(은행)](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/03_영업화법_스크립트_연금왕찐천재/연금왕찐천재_마스터북_계약이전화법_은행.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/03_%EC%98%81%EC%97%85%ED%99%94%EB%B2%95_%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8_%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC/%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC_%EB%A7%88%EC%8A%A4%ED%84%B0%EB%B6%81_%EA%B3%84%EC%95%BD%EC%9D%B4%EC%A0%84%ED%99%94%EB%B2%95_%EC%9D%80%ED%96%89.md) | Training Material / Internal · Unknown |
| SRC-027 | [퇴직연금 주요거래 화면번호 안내](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md) | Reference / Internal · Unknown |
| SRC-049 | [irp 연금 지급 절차](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/posts/2025-02-27_199404_irp 연금 지급 절차.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2025-02-27_199404_irp%20%EC%97%B0%EA%B8%88%20%EC%A7%80%EA%B8%89%20%EC%A0%88%EC%B0%A8.md) | Field Know-how / Experiential · 2025-02-27 |
| SRC-068 | [《실전상담백서》 끝난 줄 알았던 상담, 이렇게 말하니 다시 시작됐어요!](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/posts/2025-11-13_203923_《실전상담백서》 끝난 줄 알았던 상담, 이렇게 말하니 다시 시작됐어요!.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2025-11-13_203923_%E3%80%8A%EC%8B%A4%EC%A0%84%EC%83%81%EB%8B%B4%EB%B0%B1%EC%84%9C%E3%80%8B%20%EB%81%9D%EB%82%9C%20%EC%A4%84%20%EC%95%8C%EC%95%98%EB%8D%98%20%EC%83%81%EB%8B%B4%2C%20%EC%9D%B4%EB%A0%87%EA%B2%8C%20%EB%A7%90%ED%95%98%EB%8B%88%20%EB%8B%A4%EC%8B%9C%20%EC%8B%9C%EC%9E%91%EB%90%90%EC%96%B4%EC%9A%94%21.md) | Field Know-how / Experiential · 2025-11-13 |
| SRC-087 | [IRP(개인형 퇴직연금)란? 계좌 개설부터 퇴직금 수령, 세액공제 혜택까지](<../../../../../knowledge/corpus/04_KBthink_연금/01_IRP_개인형퇴직연금.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/04_KBthink_%EC%97%B0%EA%B8%88/01_IRP_%EA%B0%9C%EC%9D%B8%ED%98%95%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88.md) | Public Content / Public · 2026-06-08 |
| SRC-097 | [연금왕 찐천재 마스터북 — Level 2 / 5주차 원리금보장상품](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/03_영업화법_스크립트_연금왕찐천재/연금왕찐천재_마스터북_Level2_5주차_원리금보장상품.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/03_%EC%98%81%EC%97%85%ED%99%94%EB%B2%95_%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8_%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC/%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC_%EB%A7%88%EC%8A%A4%ED%84%B0%EB%B6%81_Level2_5%EC%A3%BC%EC%B0%A8_%EC%9B%90%EB%A6%AC%EA%B8%88%EB%B3%B4%EC%9E%A5%EC%83%81%ED%92%88.md) | Training Material / Internal · 2026-08 (금리 2026.07~08 기준) |
| SRC-099 | [PRODUCT_MASTER — 개인형IRP 브리핑용 상품 마스터](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md) | Product Data / Internal · 2026-09-10 (금리 2026-09 적용, 추천펀드 성과 2026-08-28 기준, 판매목록 기준일 미기재) |
| SRC-100 | [PRODUCT_MATCHING_KB — 고객상황 → 상품 후보 매핑](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MATCHING_KB.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MATCHING_KB.md) | Product Data / Internal · 2026-09-10 (수치는 SRC-099 마스터의 읽기용 요약) |

## 7. 고객 데이터·대화 원문 부록

<details><summary>대화 자료의 고객 인덱스 원문 — 열 의미를 임의 추정하지 않음</summary>

```json
{
  "raw_row": "박정호 168450-7293815 58 안정추구형 – 있음 600만 설정 1 dep, pen, tax, add",
  "name": "박정호",
  "customer_id": "168450-7293815",
  "age": 58,
  "investment_profile": "안정추구형",
  "isa_maturity_flag_raw": "–",
  "unlabeled_source_column_6": "있음",
  "tax_deduction_remaining_raw": "600만",
  "default_option_status_raw": "설정",
  "unlabeled_source_column_9": 1,
  "target_code_text_raw": "dep, pen, tax, add",
  "target_codes": [
    "dep",
    "pen",
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
    "caseId": "C01-11",
    "dataType": "시연용가상고객",
    "asOfDate": "2026-09-29",
    "generatedAt": "2026-09-29T07:00:00+09:00",
    "currency": "KRW"
  },
  "customer": {
    "customerId": "168450-7293815",
    "name": "박정호",
    "age": 58,
    "gender": "남",
    "starClubGrade": "VVIP",
    "investmentProfile": "안정추구형",
    "irpOpenedAt": "2019-06-14",
    "defaultOption": {
      "registrationStatus": "등록",
      "designatedProduct": {
        "productId": "DO-001",
        "productName": "지켜드림",
        "riskLevel": "초저위험"
      },
      "applicationStatus": "미적용"
    }
  },
  "signals": [
    {
      "label": "원리금보장 편중",
      "source": "동료 IRP Agent 실측 답변(2026-09-29 기준)"
    },
    {
      "label": "연금개시 가능",
      "source": "동료 IRP Agent 실측 답변(2026-09-29 기준)"
    }
  ],
  "irpAccount": {
    "valuationAmountKrw": 68000000,
    "assetAllocation": [
      {
        "assetType": "원리금보장형",
        "amountKrw": 68000000,
        "weightPct": 100
      },
      {
        "assetType": "실적배당형",
        "amountKrw": 0,
        "weightPct": 0
      },
      {
        "assetType": "현금성자산",
        "amountKrw": 0,
        "weightPct": 0
      }
    ],
    "oneYearReturnPct": 3.2,
    "taxDeductionRemainingKrw": 6000000,
    "latestProductOpening": {
      "holdingId": "H002",
      "productId": "DEP-005",
      "productName": "신한은행 퇴직연금 정기예금 1년",
      "openedAt": "2026-04-20",
      "amountKrw": 28000000
    }
  },
  "holdings": [
    {
      "holdingId": "H001",
      "productId": "SAV-001",
      "productName": "KB저축은행 퇴직연금 정기예금 1년",
      "assetType": "원리금보장형",
      "productCategory": "정기예금",
      "contractTerm": "1년",
      "valuationAmountKrw": 40000000,
      "weightPct": 58.8,
      "oneYearReturnPct": 3.5,
      "openedAt": "2026-01-15",
      "allocationBreakdown": null,
      "flags": []
    },
    {
      "holdingId": "H002",
      "productId": "DEP-005",
      "productName": "신한은행 퇴직연금 정기예금 1년",
      "assetType": "원리금보장형",
      "productCategory": "정기예금",
      "contractTerm": "1년",
      "valuationAmountKrw": 28000000,
      "weightPct": 41.2,
      "oneYearReturnPct": 3.25,
      "openedAt": "2026-04-20",
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
      "올해개인부담금납입액원": 3000000,
      "개인부담금납입이력": [
        {
          "연도": 2025,
          "납입금액원": 6000000
        }
      ],
      "타연금계좌올해납입액원": 0,
      "세액공제기준한도원": 9000000,
      "세액공제잔여한도원": 6000000,
      "퇴직급여재원금액원": 50000000,
      "개인부담금재원금액원": 18000000
    },
    "계좌운영": {
      "디폴트옵션": {
        "등록여부": true,
        "위험등급": "초저위험"
      },
      "입금시매수상품": {
        "설정여부": true,
        "지정상품": []
      },
      "최근운용지시일": "2026-04-20",
      "최근상품매매일": "2026-04-20",
      "최근입금일": "2026-05-10",
      "최근1년상품매매횟수": 2
    },
    "퇴직및인출": {
      "연금수령요건충족여부": true,
      "연금개시여부": false,
      "연금지급설계등록여부": false,
      "연금수령요건": "만 55세 이상·가입 5년 이상·개인부담금 보유"
    },
    "최근사건": [
      {
        "이벤트식별자": "T001",
        "발생일시": "2027-01-15T00:00:00+09:00",
        "이벤트유형": "상품만기예정",
        "계좌구분": "IRP",
        "관련보유상품식별자": "H001",
        "금액원": 40000000,
        "처리상태": "예정",
        "채널": null
      },
      {
        "이벤트식별자": "T002",
        "발생일시": "2027-04-20T00:00:00+09:00",
        "이벤트유형": "상품만기예정",
        "계좌구분": "IRP",
        "관련보유상품식별자": "H002",
        "금액원": 28000000,
        "처리상태": "예정",
        "채널": null
      }
    ],
    "금융거래": [],
    "상담이력": [],
    "외부계좌": [],
    "투자성향이력": [
      {
        "이력식별자": "R001",
        "분석일": "2026-04-10",
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
        "값": 0,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M002",
        "지표유형": "파생값",
        "지표명": "원리금보장·현금성자산합산비중",
        "대상참조": null,
        "값": 100,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M003",
        "지표유형": "파생값",
        "지표명": "위험자산(실적배당형)비중",
        "대상참조": null,
        "값": 0,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M004",
        "지표유형": "파생값",
        "지표명": "동연령대평균수익률",
        "대상참조": null,
        "값": 6.4,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M005",
        "지표유형": "파생값",
        "지표명": "동연령대상위1%평균수익률",
        "대상참조": null,
        "값": 19.5,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M006",
        "지표유형": "파생값",
        "지표명": "동연령대상위1%평균원리금보장비중",
        "대상참조": null,
        "값": 40,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M007",
        "지표유형": "기간",
        "지표명": "최근 운용변경 후 경과개월수",
        "대상참조": null,
        "값": 5.3,
        "단위": "개월",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M008",
        "지표유형": "파생값",
        "지표명": "최근 1개월 현금성자산 증감액",
        "대상참조": null,
        "값": 0,
        "단위": "원",
        "산출기준일": "2026-09-29"
      }
    ],
    "확인된특이사항": [],
    "가상설정메모": [
      "동료 IRP Agent 실측 답변(2026-09-29 기준)에서 옮긴 시연 데이터. 기준일 2026-09-29.",
      "보유상품·평가금액·개설일·성별·동연령 비교값은 동료 Agent 답변에 없어 가정(정기예금 2건, 원리금보장 100%). 답변 확정값: 연금개시 요건 충족·미개시, 잔여한도 600만원, 디폴트옵션 초저위험 등록, 퇴직급여 보유."
    ]
  }
}
```

</details>

### 고객별 매핑 대화 전체

질문과 답변은 입력 파일의 문자열을 그대로 보존했다. 포함된 세율·상품·화면번호·데모 링크가 검증되었다는 뜻은 아니다. 위 검토사항과 함께 사용한다.

<a id="dialogue-17"></a>
<details><summary>행 17 · 이 고객 디폴트옵션 설정돼 있어?</summary>

매핑 방식 `explicit_name` · 확신도 `high` · 매핑 메모: 원문 답변에 고객명이 직접 명시됨

원문 세그먼트 표기: `None` · 선행/후속 원문: `None`

**질문 원문**

> 이 고객 디폴트옵션 설정돼 있어?

**답변 원문**

> 박정호 고객님은 디폴트옵션 설정이 되어 있어요. IRP 안에서 이미 디폴트옵션이 등록되어 있는 고객이므로, 만약 보유상품을 변경하시거나 사전지정운용제도를 다시 등록하실 경우에는 사전지정운용제도 등록 및 변경과 기존 매도 후 신규 매수로 이어지는 2단계 거래가 필요하다는 점을 안내해 드릴 수 있어요.

</details>

<a id="dialogue-21"></a>
<details><summary>행 21 · 이 고객 연금개시 할 수 있는 상태야?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 박정호` · 선행/후속 원문: `None`

**질문 원문**

> 이 고객 연금개시 할 수 있는 상태야?

**답변 원문**

> 박정호 고객님은 연금개시 요건을 충족했으나 아직 연금개시를 하지 않은 상태예요. 연금개시를 미루는 고객에게는 "고객님. 지금은 퇴직금을 꺼내 쓰시기보다, 자산을 늘려나가야 하는 시기입니다. IRP 안에서 운용수익에 대해선 과세가 되지 않는 만큼 계속 운용하면서 복리효과를 더 누리시는 게 좋습니다"라고 예상 반론 대응을 활용해 안내해 보세요.

</details>

<a id="dialogue-34"></a>
<details><summary>행 34 · 이 고객 세액공제 더 받게 추가납입 권해도 돼?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 박정호` · 선행/후속 원문: `None`

**질문 원문**

> 이 고객 세액공제 더 받게 추가납입 권해도 돼?

**답변 원문**

> 이 고객에게는 남은 세액공제 한도 활용을 위해 추가 납입을 제안하는 것이 핵심이에요. 2026년 3월 자료 기준으로 총급여 5,500만원 초과 기준 공제율은 13.2%가 적용되며, 세액공제 잔여한도는 600만원까지 남아 있어 추가 절세 혜택을 챙길 수 있습니다. 다만 세액공제 전 결정세액이 공제액보다 적으면 최대 환급액을 받지 못할 수 있으니 유의해야 합니다. 전년도 세액공제 한도 미소진 사실을 확인해 알려주고 자동이체 금액 증액을 제안할 때는 이렇게 말씀해 보세요. "세액공제 한도 납입 — 전년도 세액공제 한도 미소진 사실을 확인해 알려주고 자동이체 금액 증액을 제안한다." 거절 시에도 여지를 남기는 짧은 클로징이 원문에 같이 붙어 있습니다.

</details>

<a id="dialogue-58"></a>
<details><summary>행 58 · 연금 개시 신청하려면 절차가 어떻게 되고 필요한 서류는 뭐야?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 박정호` · 선행/후속 원문: `None`

**질문 원문**

> 연금 개시 신청하려면 절차가 어떻게 되고 필요한 서류는 뭐야?

**답변 원문**

> 연금 개시를 신청하는 고객에게는 2단계로 처리하는 것이 핵심이에요. 먼저 [06-12-622] 세액 미공제 한도 등록을 진행하고, 이어서 [02-12-221] 연금지급 등록을 처리해요. 세액 미공제 한도 등록 시에는 「연금보험료 등 소득·세액 공제 확인서」를 준비해야 하며, 서류가 없다면 국민지갑에서 발급할 수 있어요. 연금개시 전에는 [04-10-099] 세금우대 조회로 이전 가능한 상품이 있는지 꼭 확인해야 해요. 아울러 처리 중 자동이체 금액이 입금 중이거나 보유상품변경이 진행 중이면 거래가 불가하다는 점을 미리 안내드릴게요.

</details>

<a id="dialogue-84"></a>
<details><summary>행 84 · 예금만 하겠다는 고객, 뭐라고 설득하지?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 박정호` · 선행/후속 원문: `None`

**질문 원문**

> 예금만 하겠다는 고객, 뭐라고 설득하지?

**답변 원문**

> 예금만 하겠다는 고객에게는 원리금보장상품도 관리가 중요하다는 점을 짚어주고 금리 갈아타기로 대응하는 것이 핵심이에요. 예금 같은 원리금보장상품도 매월 금리가 가장 좋은 상품을 지속적으로 제공하고 GIC 같은 고금리 상품을 비대면으로 손쉽게 거래할 수 있다는 점을 활용해 사후관리에서는 금리 갈아타기가 곧 관리라는 논리로 접근해요. 현금성자산이나 시중은행 정기예금 100%인 고객에게는 이미 안정적으로 잘 운용하고 계신다고 인정한 뒤 같은 안전성 안에서 금리를 올려주는 제안으로 들어가요. 현재 보유 중인 정기예금 금리와 GIC 및 저축은행 정기예금 금리를 숫자 대 숫자로 나란히 제시하는 방식으로 대응해요. 고객에게는 이렇게 안내해 보세요. "예금과 같은 원리금보장상품도 관리가 중요합니다. 국민은행은 고객님들을 위해 매월 금리가 가장 좋은 상품을 지속적으로 제공하고 있고, GIC 등 고금리 원리금보장상품도 비대면으로 손쉽게 거래하실 수 있습니다."

</details>

<a id="dialogue-89"></a>
<details><summary>행 89 · 고객이 주식형 펀드 넣어달라는데 이 고객 성향으로 가능해?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 박정호` · 선행/후속 원문: `None`

**질문 원문**

> 고객이 주식형 펀드 넣어달라는데 이 고객 성향으로 가능해?

**답변 원문**

> 안정추구형인 이 고객에게는 주식형 펀드를 바로 안내할 수 없어요. 이 고객의 적합성 허용 상한은 낮은위험이라서, 그보다 위험도가 높은 주식형 펀드는 가입 대상이 아니에요. 지금 고객에게 안내할 수 있는 상품은 위험등급이 낮은 상품들로 한정되어 있어요. 단말에서 확인된 허용 상한인 낮은위험 이하의 상품들만 골라서 다음과 같이 보여드릴 수 있어요. - KB 국내채권형 C-P — 낮은위험 - KB 안정형 MP — 낮은위험 - KB GIC 확정금리 — 매우낮은위험 - KB ELB 지수연계 — 낮은위험 - KB 정기예금(1년) — 매우낮은위험 - KB 원리금보장 안정 포트폴리오 — 매우낮은위험 반면에 글로벌채권인덱스 C-P, 온국민TDF2035 C-P, 온국민TDF2040 C-P, 중립형 MP, 성장형 MP, 글로벌리츠 ETF 같은 상품들은 상품 위험등급이 보통위험에서 높은위험까지로 고객의 허용 상한인 낮은위험을 초과하기 때문에 안내할 수 없어요. 이는 어디까지나 적합성 확인 결과에 따른 안내이며 특정 상품에 대한 투자권유가 아니라는 점을 염두에 두셔야 해요. ⚖ 본 자료는 정보 제공을 목적으로 합니다. 당행 직원은 투자권유 또는 투자관련 고객 상담 시 「자본시장과 금융투자업에 관한 법률」 및 당행 규정업무 프로세스를 준수할 의무가 있습니다.

</details>

<a id="dialogue-101"></a>
<details><summary>행 101 · 요즘 시황 근거로 이 고객 원리금보장 그대로 둬도 되는지 판단 근거 알려줘</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 박정호` · 선행/후속 원문: `Ⅳ. 상담 후 · 그 밖 17. 안내 콘텐츠·발송`

**질문 원문**

> 요즘 시황 근거로 이 고객 원리금보장 그대로 둬도 되는지 판단 근거 알려줘

**답변 원문**

> 요즘 시황 근거로 원리금보장 자산을 그대로 두어도 되는지 판단할 때는 2026년 8월 3주차와 2026년 9월 자료에서 다루는 시장 상황과 기준시점을 확인해야 해요. 미국 7월 소비자물가가 예상에 부합하고 생산자물가는 예상을 하회하여 연준 금리 인상 우려가 완화된 반면, 미·이런 긴장에 따른 국제유가 상승과 미국 국채 금리 상승 요인이 함께 작용하고 있어요. 또한 9월에는 기준금리 동결 후 데이터 의존 입장을 반복할 것으로 예상되는 미국 FOMC와 기준금리 인상이 예상되는 일본 BOJ 금융정책결정회의 등 중요 이벤트가 예정되어 있어요. 미국 재정적자 확대와 장기국채 수요 감소를 감안해 장기금리 하락은 비중 축소 기회로 활용할 수 있으며, BOJ의 기준금리 인상과 엔 캐리 청산 우려가 있으나 인상이 예상된 이벤트라 2024년 8월과 같은 증시 폭락 가능성은 낮다고 판단하고 있어요. 다만 사용계획이 있는 자금인 연금지급 대기나 교체매매 중인 자금은 먼저 걸러내어 판단해야 해요. ※ 시황·상품 정보는 시장 변동과 상품 개편에 따라 빠르게 달라집니다. 인용 전 as_of 기준시점을 확인하고, 시효가 지난 수치는 갱신하거나** ⏳ **시효 민감 표기와 함께 사용하세요. — 2026.08.14 종가 기준 (2026년 8월 3주차) 기준 표기입니다. ⚖ 본 자료는 정보 제공을 목적으로 합니다. 당행 직원은 투자권유 또는 투자관련 고객 상담 시 「자본시장과 금융투자업에 관한 법률」 및 당행 규정업무 프로세스를 준수할 의무가 있습니다. ※ 시황·상품 정보는 시장 변동과 상품 개편에 따라 빠르게 달라집니다. 인용 전 as_of 기준시점을 확인하고, 시효가 지난 수치는 갱신하거나** ⏳ **시효 민감 표기와 함께 사용하세요. — 2026.09 기준 표기입니다.

</details>

<a id="dialogue-128"></a>
<details><summary>행 128 · 이 고객 예금만 들고 있는데 뭐라고 말해야 하지?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 박정호` · 선행/후속 원문: `None`

**질문 원문**

> 이 고객 예금만 들고 있는데 뭐라고 말해야 하지?

**답변 원문**

> 원리금보장상품 100% 운용 고객에게는 적립금 300만원 이상인 경우 정기예금 대신 디폴트옵션 저위험 이상으로 운용을 제안할 수 있어요. 상담을 진행할 때 사용계획 있는 자금인 연금지급 대기나 교체매매 중인 자금은 먼저 걸러내야 한다는 점을 유념해 주세요. 또한 고객에게 안내할 때는 생소한 '고유계정대'라는 표현 대신 '현금성자산'이나 '운용지시가 되지 않는 자산'이라는 용어를 사용해 주세요. 이미 디폴트옵션 초저위험을 등록·보유한 고객이라면 사전지정운용제도 등록 및 변경과 보유상품 변경(기존 매도 후 신규 매수)의 2단계 거래가 필요하다는 점을 반드시 안내해야 해요.

</details>

<a id="dialogue-154"></a>
<details><summary>행 154 · 이 고객 디폴트옵션 설정돼 있어?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 박정호` · 선행/후속 원문: `None`

**질문 원문**

> 이 고객 디폴트옵션 설정돼 있어?

**답변 원문**

> 박정호 고객님은 현재 디폴트옵션 설정이 되어 있어요. 다만 이미 디폴트옵션(초저위험)을 등록·보유한 고객은 ⓐ 사전지정운용제도 등록/변경 → ⓑ 보유상품 변경(기존 매도 + 신규 매수)의 2단계 거래가 필요하다는 점을 반드시 안내해야 해요. 투자성향이 등록하신 디폴트 옵션 위험등급보다 높은 경우라면 «현재 보유중이신 디폴트옵션(초저위험)은 정기예금만으로 구성되어 있습니다»라고 짚어 주세요.

</details>

<a id="dialogue-161"></a>
<details><summary>행 161 · 이 고객 연금개시 할 수 있어?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 박정호` · 선행/후속 원문: `None`

**질문 원문**

> 이 고객 연금개시 할 수 있어?

**답변 원문**

> 박정호 고객님은 연금개시 요건을 충족하였으나 아직 연금개시를 하지 않은 상태예요. 만 55세가 아직 멀었다며 연금개시를 망설이는 반론이 예상될 때는 "고객님. 지금은 퇴직금을 꺼내 쓰시기보다, 자산을 늘려나가야 하는 시기입니다. IRP 안에서 운용수익에 대해선 과세가 되지 않는 만큼 계속 운용하면서 복리효과를 더 누리시는 게 좋습니다."라고 안내해 보세요.

</details>


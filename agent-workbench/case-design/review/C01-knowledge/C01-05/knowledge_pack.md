# C01-05 정민석 · 브리핑 작성용 기반지식

**용도:** 작성자가 S1~S5 솔루션을 구성할 때 사용할 고객별 재료. 아래 솔루션 방향은 편집자의 작업 가설이며 완성 브리핑/매수 지시가 아니다.

고객 데이터 기준일: **2026-09-29** · 개별 매핑 대화 **8건** · 작성일 2026-09-21

[전체 고객 색인](<../README.md>) · [고객·대화 입력 JSON](<../../../../../C01_고객DATA_대화_원문매핑.json>) · [해당 고객 JSON](<../../../active/display-data/C01-05.json>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/active/display-data/C01-05.json)

입력 위치: `customers[4]` (`case_id=C01-05`). 대화 행 번호는 원본 `source_row_no`이며 고객 상담 발생 순서를 뜻하지 않는다.

**다른 GPT 세션에서 사용:** 이 파일 하나를 첨부하면 고객 DATA·매핑 대화 전체·선별 지식 원문을 함께 검토할 수 있다. 원문 Git 링크는 `41ae9a4` 커밋에 고정했다. 인용의 문장은 그대로이며 상대 이미지 경로만 이 파일 위치에 맞췄다. GitHub 접근 권한과 사내 게시글 로그인은 별도다.

## 1. S1 작성 재료 — 고객 데이터와 세그먼트

| 항목 | 입력 데이터 | 데이터 위치 |
|---|---|---|
| 고객 | 정민석 · 53세 · 공격투자형 · 재직 | `/customer`, `/에이전트맥락데이터/고객계획` |
| 계좌 | 260,000,000원 · 표시 1년 수익률 3.1% | `/irpAccount` |
| 납입 | 올해 당행 개인부담금 9,000,000원 · 타 연금계좌 0원 · 공제잔여 표시값 0원 | `/에이전트맥락데이터/납입및세제` |
| 재원 | 퇴직급여 80,000,000원 · 개인부담금 180,000,000원 | 같은 절의 재원 필드 |
| 디폴트옵션 | 등록 · 지켜드림 · 미적용 | `/customer/defaultOption` |
| 연금개시 | 요건충족 표시값 False · 개시 False | `/에이전트맥락데이터/퇴직및인출` |

표시값과 대화·제도자료가 충돌하는 항목은 아래 검토사항에 남겼다. 표시값을 임의로 교정하지 않았다.

세그먼트 정의: [뱃지 카탈로그](<../../BADGE_CATALOG.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/review/BADGE_CATALOG.md). 뱃지는 현재 상태이며 그 자체가 자동 추천 결론은 아니다.

| 세그먼트 원문 | 사실 근거와 연결할 지식 |
|---|---|
| 원리금보장 편중 | 예금과 현금으로 전액 운용. 2/20 상담의 원금손실 회피 의향을 우선 연결. |
| 투자성향-DO불일치 | 공격투자형과 초저위험 지켜드림 지정의 차이. 실제 IRP 운용 의향 확인 없이 위험을 올리지 않음. |
| 장기 미운용 | 마지막 변경 13.9개월, 접촉 221일. 재접촉 소재이지 무조건 교체할 근거는 아님. |

| 보유상품 원문 | 평가금액 | 비중 | 데이터상 플래그 |
|---|---:|---:|---|
| 현금성자산 | 20,000,000원 | 7.7% | 없음 |
| 신한은행 퇴직연금 정기예금 1년 | 161,000,000원 | 61.9% | 없음 |
| 하나은행 퇴직연금 정기예금 1년 | 79,000,000원 | 30.4% | 없음 |

### 대화에서 찾은 솔루션 재료

| 대화 행 | 읽을 내용 | 이번 자료에서의 취급 |
|---|---|---|
| [행 1](#dialogue-1) | 안정적 운용과 관리 필요 | 설문성향보다 실제 자금 목적을 확인. |
| [행 84](#dialogue-84) | 금리·GIC 비교 | 대화 속 4.5%를 현재 조건으로 재사용하지 않음. |
| [행 128](#dialogue-128) | DO 상품변경 절차 | 실제 DO 보유와 단순 지정 여부부터 확인. |
| [행 163](#dialogue-163) | 예금만 운용한다는 반론 | 안정성을 유지하는 사후관리 화법으로 연결. |

### 먼저 확인할 불일치·미확인 사항

- 2/20 메모에서 다른 계좌 ETF 경험은 있지만 IRP는 예금을 원했다. 공격투자형을 곧바로 위험 확대 의사로 보지 않는다.
- 지켜드림은 지정만 되어 있고 실제 보유는 신한·하나 예금이다. DO 매도 후 재매수라는 거래를 자동 적용하지 않는다.
- 예금 만기는 2027년 1/5·2/1이다. 현재 표시금리만으로 중도해지를 제안하지 않는다.
- 납입 공제잔여는 0원이다. 오래된 시장 전망과 세액공제 추가납입을 핵심 솔루션에 끼워 넣지 않는다.

## 2. 대략적인 솔루션 방향과 S2 근거

현재도 IRP 원금손실을 피하려는지 확인하고, 그렇다면 안정성을 유지하면서 만기와 금리조건을 관리하는 방향이 중심이다. 예금별 유지 대비 교체 손익을 비교하고 만기 전 재점검 시점을 잡는다. 일부 실적배당이나 DO 변경은 의향이 바뀌었을 때만 선택 분기로 남긴다.

**구성 우선순위:** 현재 의향 확인 → 현금/예금 만기 구분 → 해지 후 순이익 비교 → 유지 또는 만기 재운용 → 정기 점검.

**고객에게 확인할 사항:**

- IRP 원금손실을 피하려는 2/20 의향이 유지되는가?
- 현금 2,000만원의 사용계획과 각 예금 만기 이후 계획은?
- 안정성을 유지하는 조건 비교와 일부 변동성 수용 중 어느 범위를 원하시는가?

### 기존 브리핑에서 참고할 구성

- [B03-07](<../../../active/briefing-json/B03-07.json>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/active/briefing-json/B03-07.json): 표시금리와 중도해지·자금 사용시점을 함께 비교. 고객 사실·금액·고객 발언은 이 사례로 옮기지 않는다.
- [B02-18](<../../../active/briefing-json/B02-18.json>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/active/briefing-json/B02-18.json): 실제 보유와 향후 DO 지정의 구분. 고객 사실·금액·고객 발언은 이 사례로 옮기지 않는다.

### 판단 논리를 보존한 기반지식

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

<a id="K-FOLLOW"></a>
### K-FOLLOW · 기존 고객의 만기·수익률·제공조건 정기관리

근거: [SRC-003 · 개인형IRP 마케팅 보물지도](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/02_마케팅_캠페인/개인형IRP_마케팅_보물지도_Vol1.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/02_%EB%A7%88%EC%BC%80%ED%8C%85_%EC%BA%A0%ED%8E%98%EC%9D%B8/%EA%B0%9C%EC%9D%B8%ED%98%95IRP_%EB%A7%88%EC%BC%80%ED%8C%85_%EB%B3%B4%EB%AC%BC%EC%A7%80%EB%8F%84_Vol1.md#L782-L812) · L782–812 · 자료 기준 2026-03

**이 고객에게 적용할 때:** 만기 전 접촉, 월별 상품자료 확인, 후속관리의 연결 근거. 이달 상품조건 확인 없이 과거 수치를 재사용하지 않는다.

<!-- source-excerpt {"key": "K-FOLLOW", "path": "knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/02_마케팅_캠페인/개인형IRP_마케팅_보물지도_Vol1.md", "start": 782, "end": 812, "sha256": "feb81d0e6fdfb740995f9d3b5d26aa7ece1f9c973d098d20262906f05bd8573c"} -->
> ## 1. 기존 고객 관리
>
> 신규 마케팅만큼 중요한 것은 바로 "기존 고객 관리"입니다. 밑 빠진 독에 물 붓는 일 없도록, 이미 우리와 함께하고 있는 고객을 꾸준히 챙겨주세요!
>
> **하나. 우리 지점의 퇴직연금 계좌 보유명세, 만기현황, 수익률 현황 등을 파악해 주세요.**
>
> - **[경영정보시스템]**
>
> **둘. 만기 1개월 전, 반드시 만기 안내를 해주세요.**
>
> - ■ 경로 : **[경영정보시스템]** > 영업지원 > 실적관리 > 실적정보 > 수신상품(퇴직연금, 기타) > 퇴직연금
> - ※ 관련문서 : [퇴직연금] 이율보증형보험(GIC) 및 발행어음 비대면 거래 확대 안내(연금상품부 553, 2025-09-18) (이율보증형보험(GIC) 비대면 거래 확대 안내)
>
> **셋. 수익률이 낮은 고객이라면 포트폴리오 리밸런싱을 제안해 보세요.**
>
> > **Tip**
> > 이 달의 특별제공상품, 추천펀드 및 포트폴리오를 적극 활용하세요.
> > ■ 경로 : **KB-WiseNet** > Info Zone > 연금(퇴직연금) > [상품]실적배당상품
>
> > **Tip**
> > 원리금보장상품 금리는 매월 변경되니, 상담 전 상품 잔여한도를 꼭 확인하시기 바랍니다.
> > ■ 경로 : **MyStar+ 단말** > [04-12-17A] New퇴직연금상품조회
>
> **넷. 대면 계좌 고객이라면 비대면 계좌로 전환 시 수수료가 인하된다는 점, 꼭 안내해 주세요.**
>
> - ■ 경로: [스타뱅킹] 메뉴 > 가입상품관리 > 퇴직연금 > 정보·서류관리 > 계좌정보 > 비대면계좌로 간편전환
> - ※ 관련문서 : 스타뱅킹 「개인형IRP 비대면계좌 전환」 메뉴 신설 (연금상품부 583, 2025-09-29)
>
> > **고객과의 관계도 식물처럼 자랍니다.**
> > 매일 조금씩 물을 주어야 오래도록 함께할 수 있습니다.
<!-- /source-excerpt -->


## 3. S3 재료 — 운용전략과 상품 매핑

SAV-009와 GIC-003은 현금 또는 만기 도래 후 안정 운용의 비교자료다. 현재 예금 전액 중도해지나 DO 위험 상향을 전제로 삼지 않는다.

아래 상품은 고객별 **비교 후보 또는 유지할 설정**이다. 동시에 모두 매수하는 배분안이 아니다. `SRC-099`는 상품자료를 정리한 마스터로, 원 상품자료 S01~S05 파일은 이 작업에서 저장소 내 실물을 찾지 못했다. 마스터 레코드까지 대조했으며 원 상품자료 재검증·현재 판매가능 확인을 완료한 것으로 표시하지 않는다.

9월 예금금리는 2026-09-01~09-30 적용자료, 월간 펀드 성과는 2026-08-28, 판매목록 성과는 기준일 미기재다. 10월 이후 자금에 9월 금리를 약속하지 않는다. 고객별 손익과 상품 마스터의 관측성과를 섞지 않는다.

| 상품/자료 ID | 이 고객에게 연결하는 이유 | 선택 전 확인 |
|---|---|---|
| [SAV-009 · SBI저축은행 퇴직연금 정기예금](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md#SAV-009>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#SAV-009) | 안정 운용 안에서 예금 조건을 비교하는 후보. | 기관별 보유 합산·보호범위·기간·중도해지 후 순이익 확인. |
| [GIC-003 · 한화생명 GIC (2026년 9월 특별제공안)](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md#GIC-003>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#GIC-003) | 장기간 사용할 계획이 없는 금액의 GIC 구조 비교. | 9월 특별제공 자료이며 2027년 만기에 같은 조건을 약속하지 않음. 실제 기간/해지/연금지급 조건 확인. |
| [DO-002 · 알파드림](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md#DO-002>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#DO-002) | 일부 변동성을 수용하는 의향으로 바뀌었을 때만 지정 비교. | 현재 지켜드림 유지도 선택지. 저위험이어도 원금보장 아님. |

### 전략 적용 조건 원문

#### PM-02 · 이 고객에서의 적용

원리금보장 중심이라고 일괄 위험자산을 늘리지 않는다.

출처: [SRC-100 · PM-02](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MATCHING_KB.md#PM-02>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MATCHING_KB.md#L131-L197) · 해당 카드 L131–197. **자료 기반 기획 해석**이며 공식 업무규정과 구분한다.

> ### PM-02 · 원리금보장상품 중심 / 100% 운용
>
> **적용할 때 보는 데이터:** 현재 예금·GIC 비중과 만기 / 투자성향 분석일·상품변경 이력 / 장기 미변경 여부.
>
> **고객과 확인:** 노후자금만큼은 원금보장을 원해서 선택했는가? / 앞으로 실제 사용시점은 언제인가? / 기존 안정성을 유지하면서 일부 투자상품을 비교할 의향이 있는가?
>
> **관리방향:** 원리금보장 100% 자체를 문제로 규정하지 않는다. 의도된 안정 운용은 유지하고, 장기 운용·투자의향·손실감내가 함께 확인될 때만 일부 분산 대안을 찾는다.
>
> | 추가로 확인된 조건 | 검토 상품군/방식 |
> |---|---|
> | 의도된 원금보장 운용 | 현재 상품 유지 또는 원리금보장 내 금리·만기 점검 |
> | 일부 실적배당 의향·분산 필요 확인 | 혼합/다자산 펀드 |
> | 장기자금·관리부담 확인 | TDF |

> **제외·유지·보류:** 현재 성향이 높다는 이유만으로 주식 비중을 강제로 높이지 않는다. 교안 일반 설명과 달리 실제 상품의 변동성이 클 수 있으므로 적합성·기존 노출 확인.
>
> **S3에 쓸 수 있는 관리방향 문장(기획 예시):**
>
> > 현재의 원리금보장 운용이 고객님의 의도와 맞는지 먼저 확인하고, 장기 운용할 일부 자금에 투자 의향이 있는 경우에만 분산형 상품을 비교합니다.
>
> **후속 확인:** 유지 선택도 상담결과로 기록하고 만기 재점검 시점을 남긴다.
>
> **판단 근거:** E06:고객 질문 Case 3; S04:L15-L24; K02:CASE 13.  
> **기존 문서 연결:** RS-03, RS-04, CASE 13 (RS는 K01, CASE는 K02의 버전 기준).

#### PM-04 · 이 고객에서의 적용

해지비용·실제 유지기간을 반영한 조건 비교에 사용한다.

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

#### PM-08 · 이 고객에서의 적용

설문과 실제 선택의 차이를 확인하는 질문으로만 활용한다.

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

<details><summary>DO-002 원문 레코드 · L7456–7555</summary>

[상품 원문](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#L7456-L7555)

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

</details>


## 4. S4 재료 — 영업화법 원문

“예금만 하니 관리가 필요 없다”는 반론에 안정 운용 안에서의 관리 가치를 설명한다. DO 원문의 선택권을 보존하되 현재 지켜드림을 부적합하다고 단정하지 않는다.

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
| `04-12-642` | 적립금및수익률조회 | 각 예금과 현금의 평가·금리 조건 확인. | [SRC-027 L65](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L65) |
| `04-12-644` | 거래내역 조회 | 만기·이자·거래이력 확인. | [SRC-027 L74](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L74) |
| `04-12-17A` | New퇴직연금상품조회 | 비교 시점의 기간별 예금/GIC 조건 조회. | [SRC-003 L803](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/02_마케팅_캠페인/개인형IRP_마케팅_보물지도_Vol1.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/02_%EB%A7%88%EC%BC%80%ED%8C%85_%EC%BA%A0%ED%8E%98%EC%9D%B8/%EA%B0%9C%EC%9D%B8%ED%98%95IRP_%EB%A7%88%EC%BC%80%ED%8C%85_%EB%B3%B4%EB%AC%BC%EC%A7%80%EB%8F%84_Vol1.md#L803) |
| `04-12-640` | 상품운용내역조회 | DO 지정과 실제 실행 여부 대조. | [SRC-027 L68](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L68) |
| `06-12-611` | 보유상품변경 | 선택한 현재 변경 또는 만기예약 접수. | [SRC-027 L67](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L67) |
| `06-12-610` | 입금예정상품 등록/변경 | 향후 설정 변경 의사가 있을 때 별도 접수. | [SRC-027 L66](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L66) |
| `04-12-660` | 상담연계등록 | 안정 운용 변경 지원이 필요한 경우 상담 연계. | [SRC-069 L28](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/posts/2025-11-13_203924_IRP상품운용변경 다들 어떻게 하시나요.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2025-11-13_203924_IRP%EC%83%81%ED%92%88%EC%9A%B4%EC%9A%A9%EB%B3%80%EA%B2%BD%20%EB%8B%A4%EB%93%A4%20%EC%96%B4%EB%96%BB%EA%B2%8C%20%ED%95%98%EC%8B%9C%EB%82%98%EC%9A%94.md#L28) |

화면번호는 저장소 자료와 대조한 업무 참조다. 사내 단말 접속·화면 실행은 하지 않았다. `04-12-179`(기존 화면안내)와 `04-12-17A`(New 화면 표기)는 각 출처의 표기를 유지한다.

### Hot Tip 원문과 고객별 활용

#### Hot Tip #203924 · IRP상품운용변경 다들 어떻게 하시나요?

[사내 게시글 원문](https://lxp.kbstar.com/app/board/hottip-my/view/203924.22BF37852DCF86D972481099E57E925D71298EDD0AE8C067C35C757116253E23) · [저장소 MD](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/posts/2025-11-13_203924_IRP상품운용변경 다들 어떻게 하시나요.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2025-11-13_203924_IRP%EC%83%81%ED%92%88%EC%9A%B4%EC%9A%A9%EB%B3%80%EA%B2%BD%20%EB%8B%A4%EB%93%A4%20%EC%96%B4%EB%96%BB%EA%B2%8C%20%ED%95%98%EC%8B%9C%EB%82%98%EC%9A%94.md) · 게시일 2025-11-13

**연결 이유:** 예금·현금 운용변경 지원과 후속 연락의 실제 연결.

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
| SRC-003 | [개인형IRP 마케팅 보물지도](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/02_마케팅_캠페인/개인형IRP_마케팅_보물지도_Vol1.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/02_%EB%A7%88%EC%BC%80%ED%8C%85_%EC%BA%A0%ED%8E%98%EC%9D%B8/%EA%B0%9C%EC%9D%B8%ED%98%95IRP_%EB%A7%88%EC%BC%80%ED%8C%85_%EB%B3%B4%EB%AC%BC%EC%A7%80%EB%8F%84_Vol1.md) | Official / Internal Guide / Internal · 2026-03 |
| SRC-010 | [연금왕 찐천재 마스터북 — 계약이전 화법(은행)](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/03_영업화법_스크립트_연금왕찐천재/연금왕찐천재_마스터북_계약이전화법_은행.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/03_%EC%98%81%EC%97%85%ED%99%94%EB%B2%95_%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8_%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC/%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC_%EB%A7%88%EC%8A%A4%ED%84%B0%EB%B6%81_%EA%B3%84%EC%95%BD%EC%9D%B4%EC%A0%84%ED%99%94%EB%B2%95_%EC%9D%80%ED%96%89.md) | Training Material / Internal · Unknown |
| SRC-027 | [퇴직연금 주요거래 화면번호 안내](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md) | Reference / Internal · Unknown |
| SRC-069 | [IRP상품운용변경 다들 어떻게 하시나요?](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/posts/2025-11-13_203924_IRP상품운용변경 다들 어떻게 하시나요.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2025-11-13_203924_IRP%EC%83%81%ED%92%88%EC%9A%B4%EC%9A%A9%EB%B3%80%EA%B2%BD%20%EB%8B%A4%EB%93%A4%20%EC%96%B4%EB%96%BB%EA%B2%8C%20%ED%95%98%EC%8B%9C%EB%82%98%EC%9A%94.md) | Field Know-how / Experiential · 2025-11-13 |
| SRC-097 | [연금왕 찐천재 마스터북 — Level 2 / 5주차 원리금보장상품](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/03_영업화법_스크립트_연금왕찐천재/연금왕찐천재_마스터북_Level2_5주차_원리금보장상품.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/03_%EC%98%81%EC%97%85%ED%99%94%EB%B2%95_%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8_%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC/%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC_%EB%A7%88%EC%8A%A4%ED%84%B0%EB%B6%81_Level2_5%EC%A3%BC%EC%B0%A8_%EC%9B%90%EB%A6%AC%EA%B8%88%EB%B3%B4%EC%9E%A5%EC%83%81%ED%92%88.md) | Training Material / Internal · 2026-08 (금리 2026.07~08 기준) |
| SRC-098 | [연금왕 찐천재 마스터북 — Level 2 / 7주차 디폴트옵션 상품](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/03_영업화법_스크립트_연금왕찐천재/연금왕찐천재_마스터북_Level2_7주차_디폴트옵션상품.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/03_%EC%98%81%EC%97%85%ED%99%94%EB%B2%95_%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8_%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC/%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC_%EB%A7%88%EC%8A%A4%ED%84%B0%EB%B6%81_Level2_7%EC%A3%BC%EC%B0%A8_%EB%94%94%ED%8F%B4%ED%8A%B8%EC%98%B5%EC%85%98%EC%83%81%ED%92%88.md) | Training Material / Internal · 2026-08 (수익률 2026-08-20 기준) |
| SRC-099 | [PRODUCT_MASTER — 개인형IRP 브리핑용 상품 마스터](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md) | Product Data / Internal · 2026-09-10 (금리 2026-09 적용, 추천펀드 성과 2026-08-28 기준, 판매목록 기준일 미기재) |
| SRC-100 | [PRODUCT_MATCHING_KB — 고객상황 → 상품 후보 매핑](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MATCHING_KB.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MATCHING_KB.md) | Product Data / Internal · 2026-09-10 (수치는 SRC-099 마스터의 읽기용 요약) |

## 7. 고객 데이터·대화 원문 부록

<details><summary>대화 자료의 고객 인덱스 원문 — 열 의미를 임의 추정하지 않음</summary>

```json
{
  "raw_row": "정민석 181245-3097614 53 공격투자형 – 있음 0 설정 2 dor, mis, dep, nch",
  "name": "정민석",
  "customer_id": "181245-3097614",
  "age": 53,
  "investment_profile": "공격투자형",
  "isa_maturity_flag_raw": "–",
  "unlabeled_source_column_6": "있음",
  "tax_deduction_remaining_raw": "0",
  "default_option_status_raw": "설정",
  "unlabeled_source_column_9": 2,
  "target_code_text_raw": "dor, mis, dep, nch",
  "target_codes": [
    "dor",
    "mis",
    "dep",
    "nch"
  ]
}
```

</details>

<details><summary>고객 DATA 전체 — 입력 JSON의 display_data 그대로</summary>

```json
{
  "schemaVersion": "customer-briefing-display.v0.1",
  "briefingMeta": {
    "caseId": "C01-05",
    "dataType": "시연용가상고객",
    "asOfDate": "2026-09-29",
    "generatedAt": "2026-09-29T07:00:00+09:00",
    "currency": "KRW"
  },
  "customer": {
    "customerId": "181245-3097614",
    "name": "정민석",
    "age": 53,
    "gender": "남",
    "starClubGrade": "VVIP",
    "investmentProfile": "공격투자형",
    "irpOpenedAt": "2017-04-03",
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
      "source": "동료 IRP Agent 시연 데이터(9 Cases v3)"
    },
    {
      "label": "투자성향-DO불일치",
      "source": "동료 IRP Agent 시연 데이터(9 Cases v3)"
    },
    {
      "label": "장기 미운용",
      "source": "동료 IRP Agent 시연 데이터(9 Cases v3)"
    }
  ],
  "irpAccount": {
    "valuationAmountKrw": 260000000,
    "assetAllocation": [
      {
        "assetType": "원리금보장형",
        "amountKrw": 240000000,
        "weightPct": 92.3
      },
      {
        "assetType": "실적배당형",
        "amountKrw": 0,
        "weightPct": 0
      },
      {
        "assetType": "현금성자산",
        "amountKrw": 20000000,
        "weightPct": 7.7
      }
    ],
    "oneYearReturnPct": 3.1,
    "taxDeductionRemainingKrw": 0,
    "latestProductOpening": {
      "holdingId": "H003",
      "productId": "DEP-004",
      "productName": "하나은행 퇴직연금 정기예금 1년",
      "openedAt": "2026-02-01",
      "amountKrw": 79000000
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
      "valuationAmountKrw": 20000000,
      "weightPct": 7.7,
      "oneYearReturnPct": null,
      "openedAt": "2017-04-03",
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
      "valuationAmountKrw": 161000000,
      "weightPct": 61.9,
      "oneYearReturnPct": 2.9,
      "openedAt": "2026-01-05",
      "allocationBreakdown": null,
      "flags": []
    },
    {
      "holdingId": "H003",
      "productId": "DEP-004",
      "productName": "하나은행 퇴직연금 정기예금 1년",
      "assetType": "원리금보장형",
      "productCategory": "정기예금",
      "contractTerm": "1년",
      "valuationAmountKrw": 79000000,
      "weightPct": 30.4,
      "oneYearReturnPct": 2.7,
      "openedAt": "2026-02-01",
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
      "퇴직급여재원금액원": 80000000,
      "개인부담금재원금액원": 180000000
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
      "최근운용지시일": "2025-08-02",
      "최근상품매매일": "2025-08-02",
      "최근입금일": "2026-01-05",
      "최근1년상품매매횟수": 1
    },
    "퇴직및인출": {
      "연금수령요건충족여부": false,
      "연금개시여부": false,
      "연금지급설계등록여부": false
    },
    "최근사건": [
      {
        "이벤트식별자": "T001",
        "발생일시": "2027-01-05T00:00:00+09:00",
        "이벤트유형": "상품만기예정",
        "계좌구분": "IRP",
        "관련보유상품식별자": "H002",
        "금액원": 161000000,
        "처리상태": "예정",
        "채널": null
      },
      {
        "이벤트식별자": "T002",
        "발생일시": "2027-02-01T00:00:00+09:00",
        "이벤트유형": "상품만기예정",
        "계좌구분": "IRP",
        "관련보유상품식별자": "H003",
        "금액원": 79000000,
        "처리상태": "예정",
        "채널": null
      }
    ],
    "금융거래": [],
    "상담이력": [
      {
        "상담식별자": "CRM001",
        "상담일시": "2026-02-20T00:00:00+09:00",
        "상담채널": null,
        "상담유형": "퇴직연금사후관리",
        "상담메모": "원금손실 우려가 커 IRP는 예금 중심으로 유지 중. 다만 타 계좌에서 ETF 투자경험이 있다고 언급."
      }
    ],
    "외부계좌": [],
    "투자성향이력": [
      {
        "이력식별자": "R001",
        "분석일": "2026-07-18",
        "투자성향": "공격투자형",
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
    "상품진단": [
      {
        "진단구분": "상품운용이력요약",
        "조회시작일": "2017-04-03",
        "조회종료일": "2026-09-29",
        "최근운용변경일": "2025-08-02",
        "운용변경없는개월수": 13.9,
        "장기미운용판정": true
      }
    ],
    "계산지표": [
      {
        "지표식별자": "M001",
        "지표유형": "파생값",
        "지표명": "현금성자산비중",
        "대상참조": null,
        "값": 7.7,
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
        "값": 7.5,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M005",
        "지표유형": "파생값",
        "지표명": "동연령대상위1%평균수익률",
        "대상참조": null,
        "값": 20.3,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M006",
        "지표유형": "파생값",
        "지표명": "동연령대상위1%평균원리금보장비중",
        "대상참조": null,
        "값": 33,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M007",
        "지표유형": "기간",
        "지표명": "최근 운용변경 후 경과개월수",
        "대상참조": null,
        "값": 13.9,
        "단위": "개월",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M008",
        "지표유형": "기간",
        "지표명": "최근 상담 후 경과일수(장기 미접촉)",
        "대상참조": null,
        "값": 221,
        "단위": "일",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M009",
        "지표유형": "파생값",
        "지표명": "최근 1개월 현금성자산 증감액",
        "대상참조": null,
        "값": 5000000,
        "단위": "원",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M010",
        "지표유형": "상태비교",
        "지표명": "현재 투자성향과 지정 디폴트옵션 위험등급 일치 여부",
        "대상참조": [
          "R001",
          "DO-001"
        ],
        "값": false,
        "단위": null,
        "산출기준일": "2026-09-29"
      }
    ],
    "확인된특이사항": [
      {
        "구분": "설정불일치",
        "내용": "공격투자형 성향이나 원리금보장·현금성 자산 100%, 디폴트옵션 초저위험 지정"
      }
    ],
    "가상설정메모": [
      "동료 IRP Agent 시연 데이터(9 Cases v3)에서 옮긴 시연 데이터. 기준일 2026-09-29.",
      "성별은 시연용 가정."
    ]
  }
}
```

</details>

### 고객별 매핑 대화 전체

질문과 답변은 입력 파일의 문자열을 그대로 보존했다. 포함된 세율·상품·화면번호·데모 링크가 검증되었다는 뜻은 아니다. 위 검토사항과 함께 사용한다.

<a id="dialogue-1"></a>
<details><summary>행 1 · 이 고객 왜 관리 대상으로 떴어?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 정민석` · 선행/후속 원문: `None`

**질문 원문**

> 이 고객 왜 관리 대상으로 떴어?

**답변 원문**

> 공격투자형 성향이신 정민석 고객님은 221일간 장기 미접촉 상태가 이어지고 있으며, 투자성향과 포트폴리오 간의 불일치가 발생하여 관리 대상으로 선정되었어요. 세부적으로는 현재 위험자산 비중이 0%로 원리금보장 및 현금성 자산이 100%를 차지하고 있으며, 12개월 이상 운용변경이 없는 상태입니다. 이로 인해 전체 운용수익률은 3.1%에 머물러 동연령대 평균 수익률(7.5%) 및 상위 1% 평균 수익률(20.3%)과 큰 격차를 보이고 있어요.

</details>

<a id="dialogue-4"></a>
<details><summary>행 4 · 이 고객 성향이랑 실제 운용이 안 맞는다는 게 무슨 말이야?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 정민석` · 선행/후속 원문: `2. 고객 현황 확인`

**질문 원문**

> 이 고객 성향이랑 실제 운용이 안 맞는다는 게 무슨 말이야?

**답변 원문**

> 공격투자형 성향이신 정민석 고객님은 현재 위험자산 비중이 0%로, 원리금보장·현금성 자산이 100%를 차지하며 성향과 포트폴리오 간의 불일치가 발생하고 있습니다. 이로 인해 전체 운용수익률은 3.1%에 머물러 동연령대 평균 수익률(7.5%) 및 상위 1% 평균 수익률(20.3%)과 큰 격차를 보이고 있습니다. 또한 12개월 이상 운용변경이 없고 6개월 이상 장기 미접촉 상태가 지속되면서 관리가 필요한 상황입니다.

</details>

<a id="dialogue-16"></a>
<details><summary>행 16 · 운용변경 안 한 지 얼마나 됐어?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 정민석` · 선행/후속 원문: `3. 고객 계좌 상태 확인`

**질문 원문**

> 운용변경 안 한 지 얼마나 됐어?

**답변 원문**

> 운용변경 이력이 없는 기간은 12개월 이상이에요. 221일간 접촉 이력이 없고 최근 12개월 이상 운용변경 이력이 없는 상태예요.

</details>

<a id="dialogue-84"></a>
<details><summary>행 84 · 예금만 하겠다는 고객, 뭐라고 설득하지?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 정민석` · 선행/후속 원문: `None`

**질문 원문**

> 예금만 하겠다는 고객, 뭐라고 설득하지?

**답변 원문**

> 예금만 하겠다는 고객에게는 원리금보장상품도 관리가 필요하다는 점을 짚어주고 같은 안전성 안에서 금리를 올려주는 제안으로 접근하는 게 핵심이에요. 우선 고객이 이미 안정적으로 잘 운용하고 계신다고 인정한 뒤, 현재 보유 중인 정기예금 금리와 GIC·저축은행 정기예금 금리를 숫자 대 숫자로 나란히 비교해 주는 방식을 활용할 수 있어요. 상담을 진행할 때는 "예금과 같은 원리금보장상품도 관리가 중요합니다. 국민은행은 고객님들을 위해 매월 금리가 가장 좋은 상품을 지속적으로 제공하고 있고, GIC 등 고금리 원리금보장상품도 비대면으로 손쉽게 거래하실 수 있습니다."라고 안내해 보세요. 또한 보험사 공시이율은 2\~3% 수준이지만 이를 IRP로 이전하셔서 원리금보장상품 GIC 3\~5년제로 가입하시면 4.5% 이상의 금리를 가져가실 수 있다는 점을 함께 짚어드릴 수 있어요. 다만 사용 계획이 있는 자금인 연금지급 대기나 교체매매 중인 자금은 먼저 걸러내야 하고, 공격투자형이면서 스스로 초저위험을 선택한 고객은 원리금보장 100% 대상에서 제외해 이중 접촉을 방지해야 한다는 점을 유의해 주세요.

</details>

<a id="dialogue-101"></a>
<details><summary>행 101 · 요즘 시황 근거로 이 고객 원리금보장 그대로 둬도 되는지 판단 근거 알려줘</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 정민석` · 선행/후속 원문: `Ⅳ. 상담 후 · 그 밖 17. 안내 콘텐츠·발송`

**질문 원문**

> 요즘 시황 근거로 이 고객 원리금보장 그대로 둬도 되는지 판단 근거 알려줘

**답변 원문**

> 질문하신 고객의 원리금보장 상품 유지 여부를 판단할 때 시장 상황과 자금의 성격을 함께 고려해야 해요. 2026년 8월 3주차 기준으로 미국 증시는 소비자물가 예상 부합과 생산자물가 예상 하회, 연준 금리 인상 우려 완화 속에 AI 반도체 및 기술주 중심의 상승세로 S&P500지수가 사상 최고치를 경신했으나, 미국-이란 긴장으로 인한 국제유가 상승, 미국 재정 적자 우려, 하이퍼스케일러들의 AI 인프라 투자 자금 채권시장 조달에 따른 미국 국채 금리 상승 등이 증시 상승세를 제약하는 요인으로 작용하고 있습니다. 2026년 9월 기준으로는 미국 FOMC와 일본 BOJ 등 주요 경제 이벤트와 점도표 변화, 엔 캐리 청산 우려 등 변동성 확대 요인이 있으므로** ⏳ **시효 민감 표기와 함께 사용하세요. — 2026.08.14 종가 기준 (2026년 8월 3주차) 기준 표기입니다. 또한** ⏳ **시효 민감 표기와 함께 사용하세요. — 2026.09 기준 표기입니다. ※ 시황·상품 정보는 시장 변동과 상품 개편에 따라 빠르게 달라집니다. 인용 전 as_of 기준시점을 확인하고, 시효가 지난 수치는 갱신하거나** ⏳ **시효 민감 표기와 함께 사용하세요. — 2026.08.14 종가 기준 (2026년 8월 3주차) 기준 표기입니다. ⚖ 본 자료는 정보 제공을 목적으로 합니다. 당행 직원은 투자권유 또는 투자관련 고객 상담 시 「자본시장과 금융투자업에 관한 법률」 및 당행 규정업무 프로세스를 준수할 의무가 있습니다. ※ 시황·상품 정보는 시장 변동과 상품 개편에 따라 빠르게 달라진니다. 인용 전 as_of 기준시점을 확인하고, 시효가 지난 수치는 갱신하거나** ⏳ **시효 민감 표기와 함께 사용하세요. — 2026.09 기준 표기입니다. ── 빠뜨리면 안 되는 표시 · 「Insight to Solution」 월간 주요 이벤트 & 투자전략 — 2026년 9월 ※ 시황·상품 정보는 시장 변동과 상품 개편에 따라 빠르게 달라집니다. 인용 전 as_of 기준시점을 확인하고, 시효가 지난 수치는 갱신하거나** ⏳ **시효 민감 표기와 함께 사용하세요. — 2026.09 기준 표기입니다.

</details>

<a id="dialogue-128"></a>
<details><summary>행 128 · 이 고객 예금만 들고 있는데 뭐라고 말해야 하지?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 정민석` · 선행/후속 원문: `None`

**질문 원문**

> 이 고객 예금만 들고 있는데 뭐라고 말해야 하지?

**답변 원문**

> 현재 보유하신 자산이 모두 원리금보장상품으로만 운용 중인 고객에게는 정기예금 대신 디폴트옵션 저위험 이상으로 운용해 보시는 방법을 제안해 볼 수 있어요. 다만 해당 고객이 이미 디폴트옵션 초저위험을 등록해 보유하고 계신 상태라면 사전지정운용제도 등록 및 변경과 보유상품 변경인 기존 매도 및 신규 매수의 2단계 거래가 필요하다는 점을 반드시 함께 안내해 드려야 해요. 또한 고객에게 생소한 고유계정대라는 용어 대신 현금성자산이나 운용지시가 되지 않는 자산이라는 표현을 사용해 쉽게 설명해 주시는 것이 좋아요. 사용 계획이 있는 자금이나 반대 케이스에 해당하는지 먼저 확인하고 접근하는 점도 잊지 마세요.

</details>

<a id="dialogue-153"></a>
<details><summary>행 153 · 이 고객한테 뭘 권할 수 있어?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 정민석` · 선행/후속 원문: `None`

**질문 원문**

> 이 고객한테 뭘 권할 수 있어?

**답변 원문**

> ■ 제가 도와드릴 수 있는 것 IRP(개인형 퇴직연금) 상담 화법을 안내해 드려요. 예를 들면: · 신규 제안 — 다양한 고객에게 IRP를 처음 권할 때 · 거절 대응 — 관리·수익률 불만, 제도·투자 거부, 증권사 비교, 해지·망설임 같은 반응이 나왔을 때 · 운용관리 업무 가이드 — 예: 기존 고객 정기 관리의 타이밍 → 만기 1개월 전 안내 등 4원칙 · 관리 대상 정의 — 어떤 고객군을 왜 관리하는지 (86건) · 관리 방법론 — 이런 상황이면 무엇을 제안하는지 (131건) · 업무 처리 절차 — 처리 순서·주의 (74건) · 단말 화면번호 — 무슨 업무가 몇 번 화면인지 (87건) · 비대면 채널 경로 — 고객이 앱·웹에서 직접 하는 메뉴 (56건) · 현장의 목소리 — 영업점이 실제로 하는 방식 (10건) · 제도·상품 팩트 — 한도·요건·수수료 같은 확정 수치 (64건) · 지난 상담 기록 — 이 고객과 언제 무슨 얘기를 했는지 · 이번 상담 요약 — 지금까지 나눈 대화를 정리하고, 원하시면 쪽지로 보내기 ■ 활용 팁 "사업자 고객인데 수수료 부담된다고 하시네요" 처럼 실제 상황을 그대로 말씀해 주시면 바로 화법을 찾아드려요. 고객이 한 말을 그대로 옮겨 주셔도 됩니다("증권사가 수수료 무료라던데요") — 그 말에 어떻게 답하면 되는지 짚어드려요. "세액공제 한도 얼마야?"·"디폴트옵션 변경 화면번호"처럼 값이나 절차만 물어보셔도 됩니다.

</details>

<a id="dialogue-163"></a>
<details><summary>행 163 · 예금만 들고 있는데 뭐라고 말해야 하지?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 정민석` · 선행/후속 원문: `None`

**질문 원문**

> 예금만 들고 있는데 뭐라고 말해야 하지?

**답변 원문**

> 현재 보유한 자산이 예금 위주인 고객에게는 이미 안정적으로 잘 운용하고 계신다고 인정한 뒤 같은 안전성 안에서 금리를 올려주는 제안으로 들어가는 게 핵심이에요. 원리금보장상품도 관리가 중요하다는 점을 매월 최고금리 상품 제공과 GIC 비대면 거래 가능으로 입증해야 하므로, 금리 갈아타기가 곧 관리라는 논리로 대응해 보세요. 다만 사용계획이 있는 자금은 먼저 걸러내고, 고객에게 생소한 고유계정대 같은 용어 대신 현금성자산이나 운용지시가 되지 않는 자산이라는 용어를 써야 해요. 고객이 예금만 해서 관리가 필요 없다고 반응할 때는 "예금과 같은 원리금보장상품도 관리가 중요합니다. 국민은행은 고객님들을 위해 매월 금리가 가장 좋은 상품을 지속적으로 제공하고 있고, GIC 등 고금리 원리금보장상품도 비대면으로 손쉽게 거래하실 수 있습니다."라고 안내해 보세요.

</details>


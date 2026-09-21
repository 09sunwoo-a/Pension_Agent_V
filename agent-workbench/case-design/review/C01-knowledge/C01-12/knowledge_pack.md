# C01-12 이수민 · 브리핑 작성용 기반지식

**용도:** 작성자가 S1~S5 솔루션을 구성할 때 사용할 고객별 재료. 아래 솔루션 방향은 편집자의 작업 가설이며 완성 브리핑/매수 지시가 아니다.

고객 데이터 기준일: **2026-09-29** · 개별 매핑 대화 **17건** · 작성일 2026-09-21

[전체 고객 색인](<../README.md>) · [고객·대화 입력 JSON](<../../../../../C01_고객DATA_대화_원문매핑.json>) · [해당 고객 JSON](<../../../active/display-data/C01-12.json>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/active/display-data/C01-12.json)

입력 위치: `customers[11]` (`case_id=C01-12`). 대화 행 번호는 원본 `source_row_no`이며 고객 상담 발생 순서를 뜻하지 않는다.

**다른 GPT 세션에서 사용:** 이 파일 하나를 첨부하면 고객 DATA·매핑 대화 전체·선별 지식 원문을 함께 검토할 수 있다. 원문 Git 링크는 `41ae9a4` 커밋에 고정했다. 인용의 문장은 그대로이며 상대 이미지 경로만 이 파일 위치에 맞췄다. GitHub 접근 권한과 사내 게시글 로그인은 별도다.

## 1. S1 작성 재료 — 고객 데이터와 세그먼트

| 항목 | 입력 데이터 | 데이터 위치 |
|---|---|---|
| 고객 | 이수민 · 49세 · 위험중립형 · 재직 | `/customer`, `/에이전트맥락데이터/고객계획` |
| 계좌 | 80,000,000원 · 표시 1년 수익률 2.8% | `/irpAccount` |
| 납입 | 올해 당행 개인부담금 0원 · 타 연금계좌 0원 · 공제잔여 표시값 9,000,000원 | `/에이전트맥락데이터/납입및세제` |
| 재원 | 퇴직급여 0원 · 개인부담금 80,000,000원 | 같은 절의 재원 필드 |
| 디폴트옵션 | 미등록 · 지정상품 없음 · 미적용 | `/customer/defaultOption` |
| 연금개시 | 요건충족 표시값 False · 개시 False | `/에이전트맥락데이터/퇴직및인출` |

표시값과 대화·제도자료가 충돌하는 항목은 아래 검토사항에 남겼다. 표시값을 임의로 교정하지 않았다.

세그먼트 정의: [뱃지 카탈로그](<../../BADGE_CATALOG.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/review/BADGE_CATALOG.md). 뱃지는 현재 상태이며 그 자체가 자동 추천 결론은 아니다.

| 세그먼트 원문 | 사실 근거와 연결할 지식 |
|---|---|
| 정기예금 만기 D-18 | 기업은행 예금 7,000만원·10/17 만기. 만기예약과 미래 운용공백 관리 자료 연결. |
| 원리금보장 편중 | 현금 1,000만원+예금 7,000만원. 안정성 선호를 확인하고 같은 역할 재운용/일부 분산을 구분. |
| DO 미등록 | 미등록 상태. 현재 현금·다가올 만기와 향후 기본 설정의 역할을 나누어 설명. |

| 보유상품 원문 | 평가금액 | 비중 | 데이터상 플래그 |
|---|---:|---:|---|
| 현금성자산 | 10,000,000원 | 12.5% | 없음 |
| 기업은행 퇴직연금 정기예금 1년 | 70,000,000원 | 87.5% | 없음 |

### 대화에서 찾은 솔루션 재료

| 대화 행 | 읽을 내용 | 이번 자료에서의 취급 |
|---|---|---|
| [행 9](#dialogue-9) | 만기 도래 | 10/17 자금을 현재 사용가능 현금과 구분. |
| [행 19](#dialogue-19) | 공제잔여 900만원 | 현재 현금 운용과 새 납입의 효과를 분리. |
| [행 61](#dialogue-61) | 만기예약 화면 | 발송 75-08-110과 거래 06-12-611 정정 연결. |
| [행 129](#dialogue-129) | 소득에 따른 세액공제 | 미확인 소득구간 가정으로 보존. |
| [행 130](#dialogue-130) | DO 활용 | 등록과 현재/만기 자금의 즉시 운용을 구분. |

### 먼저 확인할 불일치·미확인 사항

- 올해·작년 개인부담금 납입 0원, 잔여 900만원은 표시값이다. 총급여·자금 여력은 없다.
- 대화의 900만원 공제잔여와 연간 일반 납입한도 1,800만원은 서로 다른 한도다.
- 현금 1,000만원은 6/26 이후 95일 대기. 곧 만기될 7,000만원과 더해 이미 전액 현금인 것처럼 표현하지 않는다.
- 상담이력이 없으므로 실적배당 동의·DO 가입 의향·추가납입 계획을 만들지 않는다.
- 10/17 거래에 9월 금리를 적용한다고 약속하지 않는다.

## 2. 대략적인 솔루션 방향과 S2 근거

다가오는 7,000만원 만기와 이미 대기 중인 현금 1,000만원을 따로 확인한다. 각 자금의 목적과 손실감내를 물은 뒤 만기 재운용을 준비하고, 현재 현금의 운용 및 향후 DO 설정을 나누어 공백 반복을 줄이는 방향이다. 세액공제는 별도 자금 여력과 실제 세액이 있을 때 추가납입 선택지로만 검토한다.

**구성 우선순위:** 현금 목적·만기 계획 → 기간/위험 선택 → 예약과 현재 운용 → 향후 설정 → 조건부 납입 검토.

**고객에게 확인할 사항:**

- 현재 현금 1,000만원의 사용계획은?
- 10/17 만기자금을 어느 기간까지 운용할 계획인가?
- 원금손실 가능성을 수용할 부분이 있는가?
- 추가납입할 자금과 소득·결정세액이 있는가?

### 기존 브리핑에서 참고할 구성

- [B03-07](<../../../active/briefing-json/B03-07.json>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/active/briefing-json/B03-07.json): 만기 상품과 현재 현금을 구분한 조건 비교. 고객 사실·금액·고객 발언은 이 사례로 옮기지 않는다.
- [B02-18](<../../../active/briefing-json/B02-18.json>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/active/briefing-json/B02-18.json): 지정과 직접운용·실행 시점의 구분. 고객 사실·금액·고객 발언은 이 사례로 옮기지 않는다.

### 판단 논리를 보존한 기반지식

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

DEP-007은 기존 예금과 같은 역할, FND-001은 변동성을 이해하는 단기 운용 선택, DO-002는 향후 기본 설정 비교다. 서로 다른 역할을 하나의 자동배분안으로 합치지 않는다.

아래 상품은 고객별 **비교 후보 또는 유지할 설정**이다. 동시에 모두 매수하는 배분안이 아니다. `SRC-099`는 상품자료를 정리한 마스터로, 원 상품자료 S01~S05 파일은 이 작업에서 저장소 내 실물을 찾지 못했다. 마스터 레코드까지 대조했으며 원 상품자료 재검증·현재 판매가능 확인을 완료한 것으로 표시하지 않는다.

9월 예금금리는 2026-09-01~09-30 적용자료, 월간 펀드 성과는 2026-08-28, 판매목록 성과는 기준일 미기재다. 10월 이후 자금에 9월 금리를 약속하지 않는다. 고객별 손익과 상품 마스터의 관측성과를 섞지 않는다.

| 상품/자료 ID | 이 고객에게 연결하는 이유 | 선택 전 확인 |
|---|---|---|
| [DEP-007 · 기업은행 퇴직연금 정기예금](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md#DEP-007>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#DEP-007) | 기존 기업은행 예금의 동일 역할 재운용 비교. | 10월 제공조건·기간·만기예약 가능 여부 확인. |
| [FND-001 · 키움더드림단기채증권투자신탁(채권)C-P2E(퇴직연금)](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md#FND-001>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#FND-001) | 변동성을 수용하는 현재 현금 일부의 단기채 비교. | 원금보장 아님. 정확한 C-P2E 클래스·채널·정산일 확인. |
| [DO-002 · 알파드림](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md#DO-002>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#DO-002) | 미등록 고객의 향후 저위험 분산형 지정 비교. | 원금손실 수용 여부 확인. 등록만으로 현재 현금·만기자금이 즉시 매수되지 않음. |

### 전략 적용 조건 원문

#### PM-03 · 이 고객에서의 적용

다가올 만기에 맞추어 고객 의사와 예약 가능 여부를 확인한다.

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

#### PM-15 · 이 고객에서의 적용

현재 95일 대기와 향후 공백 반복을 별도 설정으로 관리한다.

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

<details><summary>FND-001 원문 레코드 · L6507–6587</summary>

[상품 원문](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#L6507-L6587)

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

만기 안내 → 선택 도움 → 예약 안내와 DO 설명을 연결한다. 추가납입 화법은 작년 납입 0원 사실을 참고할 수 있지만, 세액과 자금 여력이 확인되어야 고객별 금액 문장을 작성할 수 있다.

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
| `04-12-644` | 거래내역 조회 | 현금 유입·납입 이력 확인. | [SRC-027 L74](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L74) |
| `04-12-642` | 적립금및수익률조회 | 현재 현금과 만기예금·고유계정대 이자 조회. | [SRC-027 L65](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L65) |
| `04-12-17A` | New퇴직연금상품조회 | 10월 조건과 예약 가능 상품 조회. | [SRC-003 L803](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/02_마케팅_캠페인/개인형IRP_마케팅_보물지도_Vol1.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/02_%EB%A7%88%EC%BC%80%ED%8C%85_%EC%BA%A0%ED%8E%98%EC%9D%B8/%EA%B0%9C%EC%9D%B8%ED%98%95IRP_%EB%A7%88%EC%BC%80%ED%8C%85_%EB%B3%B4%EB%AC%BC%EC%A7%80%EB%8F%84_Vol1.md#L803) |
| `06-12-611` | 보유상품변경 | 현재 현금 변경과 10/17 만기예약을 구분 접수. | [SRC-027 L67](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L67) |
| `75-08-110` | 개인고객용메시지발송등록 | 비대면 상품변경 링크 발송; 실제 예약 접수 확인은 별도. | [SRC-002 L118](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/01_고객관리_수익률관리/연금고객_수익률KPI_고객관리_시나리오.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/01_%EA%B3%A0%EA%B0%9D%EA%B4%80%EB%A6%AC_%EC%88%98%EC%9D%B5%EB%A5%A0%EA%B4%80%EB%A6%AC/%EC%97%B0%EA%B8%88%EA%B3%A0%EA%B0%9D_%EC%88%98%EC%9D%B5%EB%A5%A0KPI_%EA%B3%A0%EA%B0%9D%EA%B4%80%EB%A6%AC_%EC%8B%9C%EB%82%98%EB%A6%AC%EC%98%A4.md#L118) |
| `06-12-610` | 입금예정상품 등록/변경 | 향후 입금예정상품/DO 지정 신청. | [SRC-027 L66](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L66) |
| `04-12-640` | 상품운용내역조회 | 운용지시와 예약/실행 상태 확인. | [SRC-027 L68](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L68) |
| `06-12-151` | 개인부담금 연합회 한도 등록 | 추가납입 선택 시 연합회 납입한도 확인/등록. 공제잔여 조회로 혼동하지 않음. | [SRC-027 L92](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L92) |
| `06-12-619` | 퇴직연금 자동이체 | 자동이체를 선택하는 경우에만 신청. | [SRC-027 L91](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L91) |

화면번호는 저장소 자료와 대조한 업무 참조다. 사내 단말 접속·화면 실행은 하지 않았다. `04-12-179`(기존 화면안내)와 `04-12-17A`(New 화면 표기)는 각 출처의 표기를 유지한다.

### Hot Tip 원문과 고객별 활용

#### Hot Tip #207754 · ★개인형IRP 고객수 단기간 최대득점하기★

[사내 게시글 원문](https://lxp.kbstar.com/app/board/hottip-my/view/207754.31DF7D0885853D47870BFD95BB703E2DFE86103D0C379C8622E773A6EA8A4A53) · [저장소 MD](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/posts/2026-08-03_207754_★개인형IRP 고객수 단기간 최대득점하기★.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2026-08-03_207754_%E2%98%85%EA%B0%9C%EC%9D%B8%ED%98%95IRP%20%EA%B3%A0%EA%B0%9D%EC%88%98%20%EB%8B%A8%EA%B8%B0%EA%B0%84%20%EC%B5%9C%EB%8C%80%EB%93%9D%EC%A0%90%ED%95%98%EA%B8%B0%E2%98%85.md) · 게시일 2026-08-03

**연결 이유:** 고유계정대·월별 상품조건·변경 링크 발송 화면을 구분해 연결.

<a id="H-MATURITY"></a>
#### H-MATURITY · 상품변경 안내·월별 금리·발송 화면의 구분

근거: [SRC-086 · ★개인형IRP 고객수 단기간 최대득점하기★](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/posts/2026-08-03_207754_★개인형IRP 고객수 단기간 최대득점하기★.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2026-08-03_207754_%E2%98%85%EA%B0%9C%EC%9D%B8%ED%98%95IRP%20%EA%B3%A0%EA%B0%9D%EC%88%98%20%EB%8B%A8%EA%B8%B0%EA%B0%84%20%EC%B5%9C%EB%8C%80%EB%93%9D%EC%A0%90%ED%95%98%EA%B8%B0%E2%98%85.md#L66-L96) · L66–96 · 자료 기준 2026-08-03

**이 고객에게 적용할 때:** KPI 기준은 고객 제안 근거에서 제외한다. 2.76%는 게시일 관측치이고 현재 현금 금리가 아니다. 75-08-110은 메시지 발송이며 상품변경 접수가 아니다.

<!-- source-excerpt {"key": "H-MATURITY", "path": "knowledge/corpus/03_스타런_영업점_Hottip/posts/2026-08-03_207754_★개인형IRP 고객수 단기간 최대득점하기★.md", "start": 66, "end": 96, "sha256": "20a4e01757d03dc69eda76b4ea07fb2e829dba4916611b4f1cf87e3ff1de5d47"} -->
> 금리가 상대적으로 낮은 상품 미운용자금을 금리높은 상품으로 운용지시해 드리겠다고 안내하여 내점하도록 하거나 유선으로 안내한 후 상품변경 링크*를 발송하여 직접 상품선택하실 수 있도록 안내하시면 됩니다.
>
> 참고로, 고유대 금리는 매일 변동되며 금일기준 2.76%
>
> ▷ 매일달라지는 고유대금리 확인하는 화면
>
> ![이미지6](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/images/207754_06.jpg>)
> > **이미지6 설명**: 화면 [04-12-642] 적립금및수익률조회 화면 — 고유계정대 이자조회 탭, 발생일자별 고유계정대이자상당금액 16,897,074원, 이자율 2.68~2.75%, 고유계정대이자 목록(개인정보 마스킹).
>
> ▷ 이번달 금리높은 예금금리 확인하는 화면
>
> ![이미지7](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/images/207754_07.jpg>)
> > **이미지7 설명**: 화면 [04-12-17A] NEW 퇴직연금상품조회 화면 — 원리금보장상품 탭, 저축은행/GIC 상품구분 체크, 상품명·신용등급·계약기간·금리·전매한도·예금자보호·IRP연금가능여부 목록(총 44건).
>
> ※     예금상품 금리는 월단위로 확정/변동 됩니다.(7/31일 매수시 8월금리적용됨 유의)
>
> ▷ 상품변경링크 발송하기(누르면 바로 로그인 후 상품변경화면 이동)
>
> ①    싱글뷰 open
>
> ![이미지8](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/images/207754_08.jpg>)
> > **이미지8 설명**: KB스타뱅킹 개인고객 계좌 조회 화면 — 당행 계좌 탭, 메시지 발송 버튼 강조, 수신/신탁 상품별 계좌번호·상품명·원금/계약금액·잔액/평가금액 목록(개인정보 마스킹).
>
> ②    url발송하기 선택 후 퇴직연금 > 상품변경하기 선택 또는
>
> 75-08-110. 개인고객용메시지발송등록 화면에서 고객정보 입력 후
>
> ![이미지9](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/images/207754_09.jpg>)
> > **이미지9 설명**: 개인고객용 메시지발송 등록 화면 — 발송예정일, 발송예상고객수 107명, 발송직원명, 발송콘텐츠(마케팀 상품_퇴직 IRP, DC/IRP 교체매매 안내), 메시지 본문 미리보기 및 발송방식 안내.
>
> 발송하기(SMS거절고객 및 마케팅거절고객앞 발송불가)
<!-- /source-excerpt -->


Hot Tip 링크는 원문 MD에 기록된 주소 그대로다. 로그인 접근·현재 업무 유효성은 검증하지 않았다. 현장 경험담의 절차는 본부 화면자료와 대조하여 사용한다.

## 6. 출처 목록

| Source ID | 자료 | 성격·기준시점 |
|---|---|---|
| SRC-002 | [연금고객 수익률 KPI 평가대상 고객관리 시나리오](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/01_고객관리_수익률관리/연금고객_수익률KPI_고객관리_시나리오.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/01_%EA%B3%A0%EA%B0%9D%EA%B4%80%EB%A6%AC_%EC%88%98%EC%9D%B5%EB%A5%A0%EA%B4%80%EB%A6%AC/%EC%97%B0%EA%B8%88%EA%B3%A0%EA%B0%9D_%EC%88%98%EC%9D%B5%EB%A5%A0KPI_%EA%B3%A0%EA%B0%9D%EA%B4%80%EB%A6%AC_%EC%8B%9C%EB%82%98%EB%A6%AC%EC%98%A4.md) | Official / Internal Guide / Internal · Unknown |
| SRC-003 | [개인형IRP 마케팅 보물지도](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/02_마케팅_캠페인/개인형IRP_마케팅_보물지도_Vol1.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/02_%EB%A7%88%EC%BC%80%ED%8C%85_%EC%BA%A0%ED%8E%98%EC%9D%B8/%EA%B0%9C%EC%9D%B8%ED%98%95IRP_%EB%A7%88%EC%BC%80%ED%8C%85_%EB%B3%B4%EB%AC%BC%EC%A7%80%EB%8F%84_Vol1.md) | Official / Internal Guide / Internal · 2026-03 |
| SRC-027 | [퇴직연금 주요거래 화면번호 안내](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md) | Reference / Internal · Unknown |
| SRC-086 | [★개인형IRP 고객수 단기간 최대득점하기★](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/posts/2026-08-03_207754_★개인형IRP 고객수 단기간 최대득점하기★.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2026-08-03_207754_%E2%98%85%EA%B0%9C%EC%9D%B8%ED%98%95IRP%20%EA%B3%A0%EA%B0%9D%EC%88%98%20%EB%8B%A8%EA%B8%B0%EA%B0%84%20%EC%B5%9C%EB%8C%80%EB%93%9D%EC%A0%90%ED%95%98%EA%B8%B0%E2%98%85.md) | Field Know-how / Experiential · 2026-08-03 |
| SRC-087 | [IRP(개인형 퇴직연금)란? 계좌 개설부터 퇴직금 수령, 세액공제 혜택까지](<../../../../../knowledge/corpus/04_KBthink_연금/01_IRP_개인형퇴직연금.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/04_KBthink_%EC%97%B0%EA%B8%88/01_IRP_%EA%B0%9C%EC%9D%B8%ED%98%95%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88.md) | Public Content / Public · 2026-06-08 |
| SRC-098 | [연금왕 찐천재 마스터북 — Level 2 / 7주차 디폴트옵션 상품](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/03_영업화법_스크립트_연금왕찐천재/연금왕찐천재_마스터북_Level2_7주차_디폴트옵션상품.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/03_%EC%98%81%EC%97%85%ED%99%94%EB%B2%95_%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8_%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC/%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC_%EB%A7%88%EC%8A%A4%ED%84%B0%EB%B6%81_Level2_7%EC%A3%BC%EC%B0%A8_%EB%94%94%ED%8F%B4%ED%8A%B8%EC%98%B5%EC%85%98%EC%83%81%ED%92%88.md) | Training Material / Internal · 2026-08 (수익률 2026-08-20 기준) |
| SRC-099 | [PRODUCT_MASTER — 개인형IRP 브리핑용 상품 마스터](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md) | Product Data / Internal · 2026-09-10 (금리 2026-09 적용, 추천펀드 성과 2026-08-28 기준, 판매목록 기준일 미기재) |
| SRC-100 | [PRODUCT_MATCHING_KB — 고객상황 → 상품 후보 매핑](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MATCHING_KB.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MATCHING_KB.md) | Product Data / Internal · 2026-09-10 (수치는 SRC-099 마스터의 읽기용 요약) |

## 7. 고객 데이터·대화 원문 부록

<details><summary>대화 자료의 고객 인덱스 원문 — 열 의미를 임의 추정하지 않음</summary>

```json
{
  "raw_row": "이수민 175926-3048171 49 위험중립형 – 없음 900만 미설정 1 dep, nod, mat, tax, add",
  "name": "이수민",
  "customer_id": "175926-3048171",
  "age": 49,
  "investment_profile": "위험중립형",
  "isa_maturity_flag_raw": "–",
  "unlabeled_source_column_6": "없음",
  "tax_deduction_remaining_raw": "900만",
  "default_option_status_raw": "미설정",
  "unlabeled_source_column_9": 1,
  "target_code_text_raw": "dep, nod, mat, tax, add",
  "target_codes": [
    "dep",
    "nod",
    "mat",
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
    "caseId": "C01-12",
    "dataType": "시연용가상고객",
    "asOfDate": "2026-09-29",
    "generatedAt": "2026-09-29T07:00:00+09:00",
    "currency": "KRW"
  },
  "customer": {
    "customerId": "175926-3048171",
    "name": "이수민",
    "age": 49,
    "gender": "여",
    "starClubGrade": "그랜드",
    "investmentProfile": "위험중립형",
    "irpOpenedAt": "2014-05-20",
    "defaultOption": {
      "registrationStatus": "미등록",
      "designatedProduct": null,
      "applicationStatus": "미적용"
    }
  },
  "signals": [
    {
      "source": "동료 IRP Agent 실측 답변(2026-09-29 기준)",
      "label": "정기예금 만기 D-18",
      "date": "2026-10-17"
    },
    {
      "label": "원리금보장 편중",
      "source": "동료 IRP Agent 실측 답변(2026-09-29 기준)"
    },
    {
      "label": "DO 미등록",
      "source": "동료 IRP Agent 실측 답변(2026-09-29 기준)"
    }
  ],
  "irpAccount": {
    "valuationAmountKrw": 80000000,
    "assetAllocation": [
      {
        "assetType": "원리금보장형",
        "amountKrw": 70000000,
        "weightPct": 87.5
      },
      {
        "assetType": "실적배당형",
        "amountKrw": 0,
        "weightPct": 0
      },
      {
        "assetType": "현금성자산",
        "amountKrw": 10000000,
        "weightPct": 12.5
      }
    ],
    "oneYearReturnPct": 2.8,
    "taxDeductionRemainingKrw": 9000000,
    "latestProductOpening": {
      "holdingId": "H002",
      "productId": "DEP-007",
      "productName": "기업은행 퇴직연금 정기예금 1년",
      "openedAt": "2025-10-17",
      "amountKrw": 70000000
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
      "valuationAmountKrw": 10000000,
      "weightPct": 12.5,
      "oneYearReturnPct": null,
      "openedAt": "2026-06-26",
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
      "valuationAmountKrw": 70000000,
      "weightPct": 87.5,
      "oneYearReturnPct": 2.9,
      "openedAt": "2025-10-17",
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
      "올해개인부담금납입액원": 0,
      "개인부담금납입이력": [
        {
          "연도": 2025,
          "납입금액원": 0
        }
      ],
      "타연금계좌올해납입액원": 0,
      "세액공제기준한도원": 9000000,
      "세액공제잔여한도원": 9000000,
      "퇴직급여재원금액원": 0,
      "개인부담금재원금액원": 80000000
    },
    "계좌운영": {
      "디폴트옵션": {
        "등록여부": false,
        "위험등급": null
      },
      "입금시매수상품": {
        "설정여부": false,
        "지정상품": []
      },
      "최근운용지시일": "2025-10-17",
      "최근상품매매일": "2025-10-17",
      "최근입금일": "2025-10-17",
      "최근1년상품매매횟수": 1,
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
        "발생일시": "2026-10-17T00:00:00+09:00",
        "이벤트유형": "상품만기예정",
        "계좌구분": "IRP",
        "관련보유상품식별자": "H002",
        "금액원": 70000000,
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
        "분석일": "2026-02-18",
        "투자성향": "위험중립형",
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
        "값": 12.5,
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
        "값": 7.1,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M005",
        "지표유형": "파생값",
        "지표명": "동연령대상위1%평균수익률",
        "대상참조": null,
        "값": 21.8,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M006",
        "지표유형": "파생값",
        "지표명": "동연령대상위1%평균원리금보장비중",
        "대상참조": null,
        "값": 31,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M007",
        "지표유형": "기간",
        "지표명": "최근 운용변경 후 경과개월수",
        "대상참조": null,
        "값": 11.4,
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
      },
      {
        "지표식별자": "M009",
        "지표유형": "파생값",
        "지표명": "정기예금만기까지남은일수",
        "대상참조": "H002",
        "값": 18,
        "단위": "일",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M010",
        "지표유형": "기간",
        "지표명": "현금성자산 대기일수(6/26 만기자금)",
        "대상참조": "H001",
        "값": 95,
        "단위": "일",
        "산출기준일": "2026-09-29"
      }
    ],
    "확인된특이사항": [],
    "가상설정메모": [
      "동료 IRP Agent 실측 답변(2026-09-29 기준)에서 옮긴 시연 데이터. 기준일 2026-09-29.",
      "답변 확정값: 평가금액 8,000만원(기업은행 정기예금 7,000만원 10/17 만기·현금성 1,000만원), 디폴트옵션 미설정, 당해 납입 0원·잔여한도 900만원, 상담이력 0건. 개설일·성별·현금성 발생일·동연령 비교값은 가정."
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

원문 세그먼트 표기: `● 이수민` · 선행/후속 원문: `None`

**질문 원문**

> 이 고객 왜 관리 대상으로 떴어?

**답변 원문**

> 현재 평가금액 8,000만원 중 원리금보장형과 고유계정대가 100%를 차지하여 위험자산 비중이 0%로 편중되어 있고, 오는 2026년 10월 17일에 7,000만원 규모의 예금 만기가 도래할 예정이기 때문에 관리 대상으로 선정되었어요. 또한 원리금보장상품 편중(80% 이상), 디폴트옵션 미설정, 만기예금 보유, 세액공제 활용 가능, 추가입금 여력 보유 항목이 성립 요건에 해당해요.

</details>

<a id="dialogue-9"></a>
<details><summary>행 9 · 이 고객 만기 언제고 금액은 얼마야?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 이수민` · 선행/후속 원문: `None`

**질문 원문**

> 이 고객 만기 언제고 금액은 얼마야?

**답변 원문**

> 이수민 고객님의 만기일은 2026년 10월 17일이며, 해당 예금 금액은 7,000만원이다. 만기가 18일 앞으로 다가온 상태이니 만기 전 운용 방향을 확정할 수 있도록 안내해야 한다.

</details>

<a id="dialogue-11"></a>
<details><summary>행 11 · 올해 얼마 넣었고 잔여한도는 얼마 남았어?</summary>

매핑 방식 `context_and_data_match` · 확신도 `high` · 매핑 메모: 당해 납입 0원·세액공제 잔여 900만원이 이수민 DATA와 일치

원문 세그먼트 표기: `None` · 선행/후속 원문: `None`

**질문 원문**

> 올해 얼마 넣었고 잔여한도는 얼마 남았어?

**답변 원문**

> 당해 납입액은 0원이고 세액공제 잔여한도는 900만원이 남았어요. 연 납입한도 1,800만원 중 당해 납입액이 없어 1,800만원의 납입 여력이 있는 상태예요. 세액공제 한도 900만원에 미달하는 고객인 만큼, 세액공제 잔여한도 900만원을 확인한 뒤 자동이체 금액 증액을 제안하거나 여유자금 발생 시점의 추가입금으로 예약을 남기는 순서로 설계해 보세요.

</details>

<a id="dialogue-18"></a>
<details><summary>행 18 · 이 고객 디폴트옵션 설정돼 있어?</summary>

매핑 방식 `explicit_name` · 확신도 `high` · 매핑 메모: 원문 답변에 고객명이 직접 명시됨

원문 세그먼트 표기: `None` · 선행/후속 원문: `None`

**질문 원문**

> 이 고객 디폴트옵션 설정돼 있어?

**답변 원문**

> 디폴트옵션은 현재 설정되어 있지 않아요. 이수민 고객님은 현재 원리금보장·현금성 자산이 100%를 차지하고 있으며, 7,000만원 규모의 정기예금 만기가 2026년 10월 17일(D-18) 도래를 앞두고 있어요. 만기 1개월 내 만기도래 원리금보장상품을 보유하고 있으면서 디폴트옵션이 미등록된 상태이므로, 정기예금 자동 재예치 제도가 폐지되어 운용지시가 없으면 만기자금이 현금성자산으로 상환된다는 제도 변화를 근거로 디폴트옵션 사전지정 등록 또는 만기 예약변경을 권유해 보세요.

</details>

<a id="dialogue-19"></a>
<details><summary>행 19 · 이 고객 세액공제 잔여한도 얼마 남았어?</summary>

매핑 방식 `explicit_name` · 확신도 `high` · 매핑 메모: 원문 답변에 고객명이 직접 명시됨

원문 세그먼트 표기: `None` · 선행/후속 원문: `None`

**질문 원문**

> 이 고객 세액공제 잔여한도 얼마 남았어?

**답변 원문**

> 이수민 고객의 세액공제 잔여한도는 900만원이에요. 세액공제 한도 900만원에 미달하여 납입하고 있는 상태이므로, 당행과 타행의 합산 잔여한도를 먼저 확인하고 자동이체 금액 증액을 제안해 보세요. 거절할 경우 여유자금 발생 시점의 추가입금으로 예약을 남기는 순서로 설계해 주시면 돼요.

</details>

<a id="dialogue-27"></a>
<details><summary>행 27 · 지난 상담에서 무슨 얘기 했는지 알려줘</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 이수민` · 선행/후속 원문: `None`

**질문 원문**

> 지난 상담에서 무슨 얘기 했는지 알려줘

**답변 원문**

> 고객과의 지난 상담 기록은 아직 등록된 내용이 없어요. 시스템상 이 고객에 대한 이전 상담 이력이 0건으로 조회되니 이 점 참고해서 이번 상담을 진행하면 돼요.

</details>

<a id="dialogue-48"></a>
<details><summary>행 48 · 이 고객 300만원 더 넣으면 얼마 돌려받는지 계산해줘</summary>

매핑 방식 `explicit_name` · 확신도 `high` · 매핑 메모: 원문 답변에 고객명이 직접 명시됨

원문 세그먼트 표기: `None` · 선행/후속 원문: `None`

**질문 원문**

> 이 고객 300만원 더 넣으면 얼마 돌려받는지 계산해줘

**답변 원문**

> 이수민 고객이 개인형IRP 계좌에 300만 원을 추가 납입할 때의 환급 예상액을 안내할 때는 개인형IRP 계좌 추가 납입액 300만 원을 기준으로 총급여 구간에 따른 환급액을 짚어 주어야 해요. 이 고객의 당해 납입액은 0원이고 세액공제 잔여한도는 900만 원이라 추가 납입하는 300만 원 전액이 공제 대상이 돼요. 공제율은 원장의 총급여 구간에서 확인된 값에 따르므로, 총급여 5,500만 원 이하로 16.5%가 적용되는 경우라면 "개인형IRP 계좌에 300만 원을 추가 납입하시면 총급여 5,500만 원 이하 기준 16.5% 공제율이 적용되어 495,000원을 환급받으실 수 있어요"라고 안내해 보세요. 단, 세액공제 전 결정세액이 공제액보다 적으면 최대 환급액을 받지 못한다 — 소득이 낮은 고객에게 "900만원 넣으면 무조건 148.5만원"이라고 안내하면 오안내다. 또한 사용계획이 있는 자금인지는 먼저 걸러내고, 고객에게 생소한 "고유계정대" 같은 용어 대신 "현금성자산"이나 "운용지시가 되지 않는 자산"이라는 용어를 사용해 주세요.

</details>

<a id="dialogue-49"></a>
<details><summary>행 49 · 이 고객 한도 꽉 채우려면 얼마 더 넣어야 하고, 그러면 얼마 돌려받아?</summary>

매핑 방식 `explicit_name` · 확신도 `high` · 매핑 메모: 원문 답변에 고객명이 직접 명시됨

원문 세그먼트 표기: `None` · 선행/후속 원문: `None`

**질문 원문**

> 이 고객 한도 꽉 채우려면 얼마 더 넣어야 하고, 그러면 얼마 돌려받아?

**답변 원문**

> 이수민 고객의 추가 납입 한도를 채울 때는 개인형IRP 계좌에 900만원을 더 넣어야 해요. 총급여 5,500만원 이하인 고객이라면 16.5% 공제율을 적용해 1,485,000원을 돌려받을 수 있고, 총급여 5,500만원 초과 고객이라면 13.2% 공제율을 적용해 1,188,000원을 돌려받을 수 있어요. 단, 세액공제 전 결정세액이 공제액보다 적으면 최대 환급액을 받지 못한다 — 소득이 낮은 고객에게 "900만원 넣으면 무조건 148.5만원"이라고 안내하면 오안내다. 이 고객의 정확한 총급여 구간은 아직 단말 원장에 나타나지 않아 두 경우를 다 실었으니, 고객의 소득 구간을 먼저 확인한 뒤에 해당하는 금액으로 안내해 주세요.

</details>

<a id="dialogue-61"></a>
<details><summary>행 61 · 만기상품 예약변경 처리 순서랑 주의할 점 알려줘</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 이수민` · 선행/후속 원문: `None`

**질문 원문**

> 만기상품 예약변경 처리 순서랑 주의할 점 알려줘

**답변 원문**

> 만기상품 예약변경은 먼저 사용계획이 있는 자금인지 확인하고 처리하는 게 핵심이에요. 정기예금은 만기에 자동 재예치되지 않아 방치되면 현금성자산에 머물게 되니 [75-08-110] 화면에서 만기상품 예약변경으로 처리해야 해요. 처리 순서는 익월 금리가 월 단위로 확정되므로 익월 금리 확인을 선행한 뒤 만기 1개월 전부터 예약변경을 걸고, 통화 후 스타뱅킹 URL 링크를 문자로 보내 고객이 직접 처리하게 안내하는 방식이에요. 주의할 점은 연금지급 대기나 교체매매 중인 자금처럼 사용계획이 있는 자금은 먼저 걸러내야 하며, 디폴트옵션 미등록 고객은 사전지정 등록과 만기 예약변경을 함께 처리해야 한다는 점이에요.

</details>

<a id="dialogue-77"></a>
<details><summary>행 77 · 고객이 '그 돈 그냥 예금으로 둬도 되지 않나요?' 하는데 뭐라고 하지?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 이수민` · 선행/후속 원문: `None`

**질문 원문**

> 고객이 '그 돈 그냥 예금으로 둬도 되지 않나요?' 하는데 뭐라고 하지?

**답변 원문**

> "예금만 해서 관리 필요 없어요"라는 고객에게는 금리 갈아타기가 곧 관리라는 논리로 접근하는 게 핵심이에요. 예금과 같은 원리금보장상품도 꾸준한 관리가 필요한 대상이라는 점을 짚어주고, 매월 금리가 가장 좋은 상품을 제공하고 있다는 점을 설명해 주세요. 고객에게는 이렇게 안내해 보세요. "예금과 같은 원리금보장상품도 관리가 중요합니다. 국민은행은 고객님들을 위해 매월 금리가 가장 좋은 상품을 지속적으로 제공하고 있고, GIC 등 고금리 원리금보장상품도 비대면으로 손쉽게 거래하실 수 있습니다." 이미 안정적으로 잘 운용하고 있다는 점을 먼저 인정한 뒤, 같은 안전성인 예금자보호 테두리 안에서 금리를 올려주는 제안으로 자연스럽게 대화를 이어가면 됩니다.

</details>

<a id="dialogue-90"></a>
<details><summary>행 90 · 만기 자금 실적배당으로 돌리면 이 고객 성향으로 뭘 안내할 수 있어?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 이수민` · 선행/후속 원문: `15. 퇴직연금 운용 상품`

**질문 원문**

> 만기 자금 실적배당으로 돌리면 이 고객 성향으로 뭘 안내할 수 있어?

**답변 원문**

> 위험중립형인 이 고객에게 안내할 수 있는 위험등급 상한은 보통위험이며, 안내할 수 있는 상품은 총 8종이에요. - KB 글로벌채권인덱스 C-P — 보통위험 · 최근 1년 4.8% · 채권형 - KB 국내채권형 C-P — 낮은위험 · 최근 1년 3.8% · 채권형 - KB 안정형 MP — 낮은위험 · 최근 1년 3.9% · MP - KB 중립형 MP — 보통위험 · 최근 1년 5.1% · MP - KB GIC 확정금리 — 매우낮은위험 · 최근 1년 3.65% · GIC - KB ELB 지수연계 — 낮은위험 · 최근 1년 4.1% · ELB - KB 정기예금(1년) — 매우낮은위험 · 최근 1년 3.1% · 예금 - KB 원리금보장 안정 포트폴리오 — 매우낮은위험 · 최근 1년 3.3% · MP 이외에 KB 온국민TDF2035 C-P, KB 온국민TDF2040 C-P, KB 성장형 MP는 상품 위험등급이 다소높은위험으로 허용 상한인 보통위험보다 높아 안내할 수 없으며, KB 글로벌리츠 ETF는 상품 위험등급이 높은위험이라 안내할 수 없어요. 이 안내는 적합성 확인 결과이며 투자권유가 아니라는 점을 염두에 두시고, 사용계획이 있는 자금이라면 먼저 걸러내어 현금성자산이나 운용지시가 되지 않는 자산으로 다루어 주세요. ⚖ 본 자료는 정보 제공을 목적으로 합니다. 당행 직원은 투자권유 또는 투자관련 고객 상담 시 「자본시장과 금융투자업에 관한 법률」 및 당행 규정업무 프로세스를 준수할 의무가 있습니다.

</details>

<a id="dialogue-129"></a>
<details><summary>행 129 · 올해 얼마 넣었고 세액공제 더 받을 수 있는지 계산까지 해줘</summary>

매핑 방식 `explicit_name` · 확신도 `high` · 매핑 메모: 원문 답변에 고객명이 직접 명시됨

원문 세그먼트 표기: `None` · 선행/후속 원문: `None`

**질문 원문**

> 올해 얼마 넣었고 세액공제 더 받을 수 있는지 계산까지 해줘

**답변 원문**

> 이수민 고객의 세액공제 환급 예상액을 안내할 때는 개인형IRP 계좌의 추가 납입을 기준으로 짚어주는 게 핵심이에요. 당해 납입액이 0원이고 세액공제 한도와 잔여한도는 연금저축 납입분을 합산해 900만원으로 확인돼요. 질문에 금액이 없어 잔여한도인 900만원을 추가 납입하는 상황으로 계산하면, 공제 대상은 0원에서 900만원으로 늘어나요. 총급여 5,500만원 이하(16.5% 공제율)인 경우 환급 예상액은 1,485,000원이 늘어나요. 공제율은 원장의 총급여 구간에서 나온 값이니 되물을 필요 없이 바로 활용하시면 돼요. "개인형IRP 계좌에 900만원을 추가 납입하시면, 총급여 5,500만원 이하 기준 세액공제 환급 예상액이 1,485,000원 늘어나요"라고 안내해 보세요. 단, 세액공제 전 결정세액이 공제액보다 적으면 최대 환급액을 받지 못한다 — 소득이 낮은 고객에게 "900만원 넣으면 무조건 148.5만원"이라고 안내하면 오안내다.

</details>

<a id="dialogue-130"></a>
<details><summary>행 130 · (만기 질문 뒤) 그냥 두면 어떻게 돼?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 이수민` · 선행/후속 원문: `이 고객 만기 언제고 금액은 얼마야?`

**질문 원문**

> (만기 질문 뒤) 그냥 두면 어떻게 돼?

**답변 원문**

> 앞서 말씀드린 2026년 10월 17일 만기를 앞둔 7,000만원 규모의 예금은 만기 때 별도의 재예치 지시가 없으면 현금성자산으로 대기하게 돼요. 정기예금 자동 재예치 제도가 폐지되어 운용지시가 없으면 만기자금이 현금성자산으로 상환되므로, 만기 전 운용 방향을 확정해야 해요. 만기 임박 + 디폴트옵션 미등록 고객에게는 "정기예금 자동 재예치 제도가 폐지되어 운용지시가 없으면 만기 자금이 현금성자산으로 상환되니 디폴트옵션 사전지정 등록이나 만기 예약을 하시는 것이 좋아요"라고 안내해 보세요.

</details>

<a id="dialogue-143"></a>
<details><summary>행 143 · 세액공제 한도가 얼마고, 이 고객 300만원 더 넣으면 얼마 받아?</summary>

매핑 방식 `explicit_name` · 확신도 `high` · 매핑 메모: 원문 답변에 고객명이 직접 명시됨

원문 세그먼트 표기: `None` · 선행/후속 원문: `None`

**질문 원문**

> 세액공제 한도가 얼마고, 이 고객 300만원 더 넣으면 얼마 받아?

**답변 원문**

> 이수민 고객의 개인형IRP 계좌에 300만원을 추가 납입할 때 받을 수 있는 세액공제 환급 예상액은 원장의 총급여 구간에 따라 달라져요. 자료에 따르면 이 고객의 총급여가 5,500만원 이하(16.5%)인 경우 개인형IRP 계좌에 추가 납입액 300만원을 넣으면 환급 예상액은 495,000원이 돼요. 이때 연금저축 납입분을 합산한 세액공제 한도와 잔여한도는 각각 900만원이며, 당해 납입액은 0원이에요. 단, 세액공제 전 결정세액이 공제액보다 적으면 최대 환급액을 받지 못한다 — 소득이 낮은 고객에게 "900만원 넣으면 무조건 148.5만원"이라고 안내하면 오안내다. 공제율은 원장의 총급여 구간에서 나온 값이니 되물을 필요가 없어요.

</details>

<a id="dialogue-154"></a>
<details><summary>행 154 · 이 고객 디폴트옵션 설정돼 있어?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 이수민` · 선행/후속 원문: `None`

**질문 원문**

> 이 고객 디폴트옵션 설정돼 있어?

**답변 원문**

> 이수민 고객님께는 디폴트옵션이 설정되어 있지 않아요. 현재 원리금보장상품 100% 운용 고객이자 1개월 내 만기도래 원리금보장상품을 보유하고 있으면서 디폴트옵션이 미등록된 상태예요. 정기예금 자동 재예치 제도가 폐지되어 운용지시가 없으면 만기자금이 현금성자산으로 상환되므로, 재예치 폐지를 근거로 사전지정 등록을 권유하는 화법을 활용할 수 있어요. 투자성향이 등록하신 디폴트옵션 위험등급보다 높은 경우라면 “정기예금(GIC,ELB) 대신 디폴트옵션(저위험이상)으로 운용”을 제안하는 방식을 검토해 보세요.

</details>

<a id="dialogue-155"></a>
<details><summary>행 155 · 이 고객 만기 뭐뭐 있어?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 이수민` · 선행/후속 원문: `None`

**질문 원문**

> 이 고객 만기 뭐뭐 있어?

**답변 원문**

> 이수민 고객의 만기 예정 자산은 2026년 10월 17일에 도래하는 7,000만원 규모의 기업은행 퇴직연금 정기예금 1년 상품이 있습니다. 해당 정기예금의 금리와 수익률은 모두 2.90%이며, 만기 D-18을 앞두고 있어 재예치 지시가 없으면 현금성자산(연 2.52%)으로 대기하게 되므로 만기 전 운용 방향 확정이 필요합니다.

</details>

<a id="dialogue-158"></a>
<details><summary>행 158 · 300만원 더 넣으면 얼마 돌려받아?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 이수민` · 선행/후속 원문: `None`

**질문 원문**

> 300만원 더 넣으면 얼마 돌려받아?

**답변 원문**

> 이수민 고객에게 개인형IRP 계좌에 300만원을 추가 납입할 때 예상되는 세액공제 환급액을 안내할 때는 총급여 구간과 세액공제 한도를 함께 짚어주어야 해요. 이 고객의 당해 납입액은 0원이고 세액공제 한도 및 잔여한도가 900만원이므로, 300만원을 추가 납입하면 총급여 5,500만원 이하 기준 16.5%의 공제율을 적용하여 495,000원의 환급을 예상할 수 있어요. 단, 세액공제 전 결정세액이 공제액보다 적으면 최대 환급액을 받지 못한다 — 소득이 낮은 고객에게 "900만원 넣으면 무조건 148.5만원"이라고 안내하면 오안내다. 공제율은 원장의 총급여 구간에서 나온 값이니 이를 바탕으로 안내해 보세요.

</details>


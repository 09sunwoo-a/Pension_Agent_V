# C01-01 김현수 · 브리핑 작성용 기반지식

**용도:** 작성자가 S1~S5 솔루션을 구성할 때 사용할 고객별 재료. 아래 솔루션 방향은 편집자의 작업 가설이며 완성 브리핑/매수 지시가 아니다.

고객 데이터 기준일: **2026-09-29** · 개별 매핑 대화 **4건** · 작성일 2026-09-21

[전체 고객 색인](<../README.md>) · [고객·대화 입력 JSON](<../../../../../C01_고객DATA_대화_원문매핑.json>) · [해당 고객 JSON](<../../../active/display-data/C01-01.json>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/active/display-data/C01-01.json)

입력 위치: `customers[0]` (`case_id=C01-01`). 대화 행 번호는 원본 `source_row_no`이며 고객 상담 발생 순서를 뜻하지 않는다.

**다른 GPT 세션에서 사용:** 이 파일 하나를 첨부하면 고객 DATA·매핑 대화 전체·선별 지식 원문을 함께 검토할 수 있다. 원문 Git 링크는 `41ae9a4` 커밋에 고정했다. 인용의 문장은 그대로이며 상대 이미지 경로만 이 파일 위치에 맞췄다. GitHub 접근 권한과 사내 게시글 로그인은 별도다.

## 1. S1 작성 재료 — 고객 데이터와 세그먼트

| 항목 | 입력 데이터 | 데이터 위치 |
|---|---|---|
| 고객 | 김현수 · 29세 · 위험중립형 · 재직 | `/customer`, `/에이전트맥락데이터/고객계획` |
| 계좌 | 8,000,000원 · 표시 1년 수익률 -1.8% | `/irpAccount` |
| 납입 | 올해 당행 개인부담금 0원 · 타 연금계좌 0원 · 공제잔여 표시값 0원 | `/에이전트맥락데이터/납입및세제` |
| 재원 | 퇴직급여 0원 · 개인부담금 8,000,000원 | 같은 절의 재원 필드 |
| 디폴트옵션 | 미등록 · 지정상품 없음 · 미적용 | `/customer/defaultOption` |
| 연금개시 | 요건충족 표시값 False · 개시 False | `/에이전트맥락데이터/퇴직및인출` |

표시값과 대화·제도자료가 충돌하는 항목은 아래 검토사항에 남겼다. 표시값을 임의로 교정하지 않았다.

세그먼트 정의: [뱃지 카탈로그](<../../BADGE_CATALOG.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/review/BADGE_CATALOG.md). 뱃지는 현재 상태이며 그 자체가 자동 추천 결론은 아니다.

| 세그먼트 원문 | 사실 근거와 연결할 지식 |
|---|---|
| 현금성 장기대기 | 현금 600만원·75%, 대기 697일. K-CASH로 사용계획/주문 여부를 먼저 확인하고 PM-01과 연결. |
| DO 미등록 | 미등록 사실에 K-DO-FLOW·T-DO 연결. 현재 현금 운용과 장래 지정은 별도 업무. |
| 원리금보장 편중 | 현금·예금 중심이지만 단기채 10%를 이미 보유. 원금손실 수용 여부에 따라 예금 유지/제한적 분산을 비교. |

| 보유상품 원문 | 평가금액 | 비중 | 데이터상 플래그 |
|---|---:|---:|---|
| 현금성자산 | 6,000,000원 | 75% | 없음 |
| 신한은행 퇴직연금 정기예금 1년 | 1,200,000원 | 15% | 없음 |
| 키움 더드림 단기채 (채권) | 800,000원 | 10% | 없음 |

### 대화에서 찾은 솔루션 재료

| 대화 행 | 읽을 내용 | 이번 자료에서의 취급 |
|---|---|---|
| [행 6](#dialogue-6) | 현금성자산 600만원·75% | 고유계정대 설명과 사용계획 질문의 출발점. |
| [행 27](#dialogue-27) | 상담이력 없음 | 이전에 설명·동의를 받았다고 쓰지 않음. |
| [행 70](#dialogue-70) | 소액 계좌의 관리 필요 | 금액이 작아도 관리하되 위험자산 0% 주장은 산정기준 확인. |
| [행 163](#dialogue-163) | 예금만 운용할 때의 화법 | 가정 반론. 현재 단기채 보유 사실을 지우지 않음. |

### 먼저 확인할 불일치·미확인 사항

- 올해 납입·타계좌 납입이 모두 0원인데 공제잔여도 0원이다. 납입 권유 전 표시값의 산출 사유를 확인한다.
- 대화의 위험자산 0%와 DATA의 실적배당형 10%는 분류가 다를 수 있다. 두 수치를 같은 지표로 비교하지 않는다.
- 29세라는 이유만으로 장기 투자기간이나 손실감내를 확정하지 않는다.

## 2. 대략적인 솔루션 방향과 S2 근거

먼저 600만원의 사용 목적과 현금 대기 이유를 확인한다. 사용계획이 없는 금액 안에서 안정 운용 또는 일부 분산을 비교하고, 관리 방법까지 설명하는 구성이 가능하다. 향후 입금·만기 때의 공백을 줄이는 DO 지정은 현재 현금을 곧바로 투자하는 업무와 나누어 설명한다.

**구성 우선순위:** 현금 목적 확인 → 운용 가능 금액/기간 → 비교 후보 → 현재 변경 및 향후 설정 → 후속 확인.

**고객에게 확인할 사항:**

- 현금 600만원 중 가까운 시기에 사용할 금액은 얼마인가?
- 원금손실을 어느 정도까지 받아들일 수 있으며 직접 선택/관리할 의향이 있는가?
- 공제잔여 0원은 실제 세제정보와 일치하는가?

### 기존 브리핑에서 참고할 구성

- [B01-03](<../../../active/briefing-json/B01-03.json>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/active/briefing-json/B01-03.json): 현금 운용과 신규 유입자금의 목적을 구분하는 구성. 고객 사실·금액·고객 발언은 이 사례로 옮기지 않는다.
- [B02-18](<../../../active/briefing-json/B02-18.json>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/active/briefing-json/B02-18.json): DO 지정·현재 자금·실행 상태를 구분하는 구성. 고객 사실·금액·고객 발언은 이 사례로 옮기지 않는다.

### 판단 논리를 보존한 기반지식

<a id="K-CORE"></a>
### K-CORE · 자금 성격 → 기간·목표 → 변동성 → 자산배분

근거: [SRC-019 · 연금 투자, 이거는 알고 하자](<../../../../../knowledge/corpus/02_스타런_퇴직연금_교육자료/02_투자교육/연금투자_기본원칙_이것은_알고_하자.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/02_%EC%8A%A4%ED%83%80%EB%9F%B0_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EA%B5%90%EC%9C%A1%EC%9E%90%EB%A3%8C/02_%ED%88%AC%EC%9E%90%EA%B5%90%EC%9C%A1/%EC%97%B0%EA%B8%88%ED%88%AC%EC%9E%90_%EA%B8%B0%EB%B3%B8%EC%9B%90%EC%B9%99_%EC%9D%B4%EA%B2%83%EC%9D%80_%EC%95%8C%EA%B3%A0_%ED%95%98%EC%9E%90.md#L213-L235) · L213–235 · 자료 기준 Unknown

**이 고객에게 적용할 때:** 저장소의 정제 전사 발화. 30세·연 500만원·30년은 강의 예시이며 고객의 나이·납입액·실제 사용기간으로 확정하지 않는다. 판단 순서와 설명을 함께 보존했다.

<!-- source-excerpt {"key": "K-CORE", "path": "knowledge/corpus/02_스타런_퇴직연금_교육자료/02_투자교육/연금투자_기본원칙_이것은_알고_하자.md", "start": 213, "end": 235, "sha256": "5dd4344e705dfdc990d13a84ff70024734e40d2d2d793694456968126153fa8f"} -->
> > **투자의 순서**부터 좀 생각을 해보겠습니다. 투자에 대한 순서는, 일단 **자금이 결정이 돼야** 되는 거죠. 그러니까 내가 어떤 자금을 투자하는 것인가. 예를 들면 내 회사가 DC 계좌로 내 퇴직금을 미리 납입을 해줬는데 그 자금을 투자를 하는 것인지, 아니면 여유 돈을 투자를 하는 것인지. 이런 거에 따라서 자금의 성격 자체가 달라지기 때문에, 이 자금을 명확하게 규정하고 시작하는 게 중요하다라고 할 수가 있겠고요.
> >
> > 자금을 명확하게 규정을 했으면, 이 자금의 성격에 따라서 **목표 수익률**이라는 것을 설정을 해야 됩니다. 거기에 덧붙여서 **투자 기간**을 설정을 해야 되는 거예요.
> >
> > 그러니까 사실은 이 자금을 명확하게 규정을 해놨다고 한다면 그거에 따른 목표 수익률과 투자 기간이 어느 정도 나온다. 예를 들면 오늘 주제인 연금에 대해서 얘기를 해보자면, 연금 자산이에요. 회사가 나에게 DC 계좌로 1년에 500만 원씩 넣어 준다고 가정을 합시다. 1년에 500만 원씩이면 매년 매년 이게 쌓이는 거예요. 그러면 10년이 쌓이면 5천만 원, 20년이 쌓이면 1억 원이 되겠죠. 그렇기 때문에 우리가 투자를 할 수 있는 어떤 규모가 어느 정도 되는지 우리가 파악할 수가 있는 거고요.
> >
> > 이 퇴직연금 자산은 우리가 은퇴할 때까지 불릴 수 있는 자산이잖아요. 그게 이 자금을 투자할 수 있는 **투자 가능 기간**이 되겠죠. 그래서 통상적으로 우리가 30살에 입사를 한다, 60세에 퇴직을 가정하면 한 30년 동안 운용을 할 수 있는 자금이다, 이렇게 볼 수가 있겠죠.
> >
> > 요렇게 목표 수익률과 투자 기간을 설정한 다음에는 **변동성**이라는 걸 좀 설정을 해줘야 돼요. 변동성이란 게 뭐냐면, 주식이나 부동산이나 채권이나 모든 자산들이 가격이 이렇게 쭉 가면 얼마나 좋겠어요. 근데 모든 자산이 이렇게 하는 게 아니죠. 내려갔다가 확 올랐다가, 또 내려갔다가 확 올랐다가. 이런 식으로 우리가 기대하는 어떤 기대 수익률 대비 실제 수익률 간의 어떤 차이, 갭, 요런 것도 우리가 변동성이라고 하거든요.
> >
> > 그래서 과연 내가 허용할 수 있는 변동성은 어느 정도인가. 그것도 이 자금의 성격에서 좀 나오는 부분인데, 내가 이 변동성을 아무것도 용납을 못 하겠다, 나는 마이너스가 나면 절대 안 된다라고 한다면 좀 안정적인 자산을 운용을 해야겠고, 장기로 운용하는 자산이라고 한다면 "변동성 좀 있어도 돼, 어차피 나 바로 찾아서 쓸 거 아니니까, 다만 내가 은퇴할 때까지만 올라 주면 돼"라고 한다면 우리가 허용할 수 있는 변동성이 크다, 이렇게 얘기할 수 있겠죠.
> >
> > 그래서 목표 수익률과 투자 기간과 변동성까지 우리가 좀 생각을 했다면, 요걸 기준으로 **자산배분**이라는 걸 하는 겁니다. ○○ 님, 자산배분이 뭔지 알아요?
>
> **참여자:**
> > 자산을 배분한다… 나누어서 투자하는 것.
>
> **강사:**
> > 맞습니다. 정확한 표현입니다. 그러니까 이 용어가 좀 생소하실 텐데, 사실 자산배분이라고 하는 것은 우리 국민들 모두가 이미 하고 있죠. 내 주머니에 놓고 있어도 자산배분, 일부는 은행 예금에 맡겨 놓고 일부는 부동산, 일부는 차. 이렇게 내가 어떤 금전을 가지고 어떤 다른 자산군에 이렇게 나눠서 투자를 하고 있는 거거든요. 그래서 우리는 이 자산배분이라는 단어를 몰라도 이미 자산배분을 하고 있다, 이렇게 보시면 되겠고요.
> >
> > 그래서 우리가 목표 수익률과 투자 기간과 변동성을 설정을 해 놓으면 우리 선진 금융 기법으로 이 자산배분이 가능합니다. 그 부분은 물론 굉장히 어렵기 때문에 어떤 수학적으로, 통계적으로 자산배분을 전문가들이 좀 해서 제공을 해드리는 그런 부분이 있으니까 많이 활용을 하면 좋겠습니다.
> >
> > 자, 여기까지가 연금 투자뿐만 아니라 모든 투자의 아주 베이직한 절차라고 보시면 되고, 여기까지 혹시 궁금하신 사항 있어요?
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


## 3. S3 재료 — 운용전략과 상품 매핑

기존 현금 600만원에서 사용할 자금을 제외한 부분이 검토 대상이다. DEP-002는 안정 운용 비교, MF-001은 장기자금의 조건부 분산, DO-002는 향후 설정 비교로 역할이 다르다.

아래 상품은 고객별 **비교 후보 또는 유지할 설정**이다. 동시에 모두 매수하는 배분안이 아니다. `SRC-099`는 상품자료를 정리한 마스터로, 원 상품자료 S01~S05 파일은 이 작업에서 저장소 내 실물을 찾지 못했다. 마스터 레코드까지 대조했으며 원 상품자료 재검증·현재 판매가능 확인을 완료한 것으로 표시하지 않는다.

9월 예금금리는 2026-09-01~09-30 적용자료, 월간 펀드 성과는 2026-08-28, 판매목록 성과는 기준일 미기재다. 10월 이후 자금에 9월 금리를 약속하지 않는다. 고객별 손익과 상품 마스터의 관측성과를 섞지 않는다.

| 상품/자료 ID | 이 고객에게 연결하는 이유 | 선택 전 확인 |
|---|---|---|
| [DEP-002 · 농협은행 퇴직연금 정기예금](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md#DEP-002>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#DEP-002) | 원금손실을 원하지 않는 부분의 예금 조건 비교. | 사용시점에 맞는 만기·거래일 금리·제공한도 확인. |
| [MF-001 · KB 온국민 TDF 시리즈](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md#MF-001>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#MF-001) | 장기 보유와 변동성 수용이 확인된 부분에만 TDF 방식 비교. | 시리즈 자료이므로 정확한 빈티지·클래스와 위험등급을 별도 선택. 2030 성과를 다른 빈티지에 전용하지 않음. |
| [DO-002 · 알파드림](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md#DO-002>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#DO-002) | 미등록 상태에서 저위험 분산형 지정의 비교 후보. | 예금과 TDF 혼합이며 원금보장 아님. 지정만으로 현금 600만원이 즉시 이동하지 않음. |

### 전략 적용 조건 원문

#### PM-01 · 이 고객에서의 적용

의도된 현금/주문 중 자금을 먼저 제외한다.

출처: [SRC-100 · PM-01](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MATCHING_KB.md#PM-01>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MATCHING_KB.md#L64-L125) · 해당 카드 L64–125. **자료 기반 기획 해석**이며 공식 업무규정과 구분한다.

> ### PM-01 · 현금성자산 과다
>
> **적용할 때 보는 데이터:** 현금성 금액·비중과 발생일 / 입금/만기/매도 후 경과기간 및 예약·주문 유무 / 현재 보유상품·투자성향.
>
> **고객과 확인:** 지출·이전·연금수령 때문에 의도적으로 대기하는가? / 장기 운용할 금액과 원금손실 허용 여부는? / 직접 선택과 관리형 중 무엇을 선호하는가?
>
> **관리방향:** 운용공백의 이유부터 확인한다. 불필요한 대기라면 자금 사용기간과 손실감내에 맞게 상품 운용을 검토하되 필요한 현금은 유지한다.
>
> | 추가로 확인된 조건 | 검토 상품군/방식 |
> |---|---|
> | 원금손실을 원하지 않고 만기까지 유지 가능 | 정기예금·GIC |
> | 일부 변동성 허용, 직접 상품 선택 희망 | 단기채 펀드/ETF |
> | 장기자금·상품관리 부담 확인 | 적합한 빈티지의 TDF 또는 관리형 방식 |

> **제외·유지·보류:** 의도된 현금 대기·이미 매수지시 진행 중이면 중복 권유하지 않는다. 원금손실 거부 고객에게 FND-001/ETF-008을 예금처럼 제안하지 않는다.
>
> **S3에 쓸 수 있는 관리방향 문장(기획 예시):**
>
> > 현금성으로 대기 중인 이유와 사용할 시점을 확인한 뒤, 계속 남겨둘 자금은 원리금보장형 또는 투자성향에 맞는 실적배당형으로 운용하는 방향을 검토합니다.
>
> **후속 확인:** 현재 주문상태를 확인하고 일회성 운용 또는 입금 시 매수상품 설정 필요성을 구분한다.
>
> **판단 근거:** E06:고객 질문 Case 3; E08:원픽 가이드 — 3차 보호막; K02:CASE 01.  
> **기존 문서 연결:** RS-18, RS-16, CASE 01 (RS는 K01, CASE는 K02의 버전 기준).

#### PM-15 · 이 고객에서의 적용

향후 반복 공백에 대한 설정을 현재 현금 매수와 구분한다.

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

<details><summary>DEP-002 원문 레코드 · L227–288</summary>

[상품 원문](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#L227-L288)

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

</details>

<details><summary>MF-001 원문 레코드 · L3858–3923</summary>

[상품 원문](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#L3858-L3923)

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

현금 방치 화법을 사용계획 질문 뒤에 배치하고, DO 설명을 별도 주제로 이어간다. 600만원·75%를 사용할 수 있으나 개선 수익률을 만들어 넣지 않는다.

아래 인용은 **저장소 MD의 해당 구간을 문장 수정 없이 발췌**했다. PDF/영상 자체를 다시 대조한 결과와 구분한다. 문서의 설명·예시 고객 반응은 실제 고객 발언이 아니다. 고객용 최종 화법은 작성자가 호칭·날짜·금액·상품 및 적용 조건을 맞춰 편집한다.

<a id="T-CASH"></a>
### T-CASH · 현금성자산 안내 → 운용 필요 설명 → 비대면/내점 분기

근거: [SRC-002 · 연금고객 수익률 KPI 평가대상 고객관리 시나리오](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/01_고객관리_수익률관리/연금고객_수익률KPI_고객관리_시나리오.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/01_%EA%B3%A0%EA%B0%9D%EA%B4%80%EB%A6%AC_%EC%88%98%EC%9D%B5%EB%A5%A0%EA%B4%80%EB%A6%AC/%EC%97%B0%EA%B8%88%EA%B3%A0%EA%B0%9D_%EC%88%98%EC%9D%B5%EB%A5%A0KPI_%EA%B3%A0%EA%B0%9D%EA%B4%80%EB%A6%AC_%EC%8B%9C%EB%82%98%EB%A6%AC%EC%98%A4.md#L187-L211) · L187–211 · 자료 기준 Unknown

**이 고객에게 적용할 때:** 000지점·직원·고객명·000만원·00%만 확인된 값으로 바꾼다. 지출/주문 목적이 있는 현금에는 방치 화법을 바로 쓰지 않는다. 원문의 수익률 개선 표현은 보장으로 바꾸지 않는다.

<!-- source-excerpt {"key": "T-CASH", "path": "knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/01_고객관리_수익률관리/연금고객_수익률KPI_고객관리_시나리오.md", "start": 187, "end": 211, "sha256": "612505bb3b178a9d3b4f7fb97b0c9f4b4779c6b9d7be78290824dc2524c91ff6"} -->
> #### 상담 대화 (해피콜)
>
> **[행원]** 안녕하세요, KB국민은행 000지점 000팀장(팀원)입니다. 저희 국민은행에 가입하신 퇴직연금 관련해서 안내드릴 사항이 있어 전화드렸습니다! 잠시 통화 가능하세요?
>
> **[고객]** 네~ 무슨 일이시죠?
>
> **[행원]** 보유하신 퇴직연금 DC/기업형IRP/개인형IRP 계좌에 운용지시가 안된 현금성자산이 000만원 있는데 알고 계신가요?
>
> **[고객]** 아, 그래요? 신경 안서 잘 모르겠어요.
>
> **[행원]** 고객님께서 가입하신 퇴직연금 제도는 정기예금이나 펀드 등의 상품으로 자유롭게 운용하실 수 있고, 여기서 발생하는 운용수익에 따라서 향후에 수령하시는 퇴직연금 금액이 달라집니다. 현재 미운용 중인 현금성자산의 적용금리는 00% 수준으로 빨리 금리가 높은 저축은행 정기예금이나 펀드같은 상품으로 운용하시면 좋을거 같아요.
>
> **[고객]** 어떻게 하면 되나요?
>
> **[행원]** 은행에 내점하실 필요 없이, 스타뱅킹에서 운용지시를 하실 수 있습니다. 고객님, 스타뱅킹이나 인터넷뱅킹은 사용하고 계시죠?
>
> **[고객] ① 네, 사용하고 있어요.**
>
> **[행원]** 그러시면 통화종료 후에 고객님께 문자메시지로 퇴직연금 보유상품 변경 거래를 하실 수 있는 스타뱅킹 URL 링크를 보내드리겠습니다. URL로 접속하셔서 현금성자산을 다른 상품으로 변경하시면 되겠습니다.
>
> > *\* [75-08-110] 개인고객용메시지발송시 발송콘텐츠: 마케팅(상품) > 노후은퇴 > 보유상품변경 안내 선택*
>
> **[고객] ② 아뇨, 사용 안해요.**
>
> **[행원]** 그러면 불편하시더라도 영업점에 방문하셔야 처리가 가능합니다. 시간 여유있으실 때, 저희 지점에 방문하시면 처리해드리겠습니다. 추천상품도 안내 해드리니 시간나실 때 내점 부탁드립니다. 000지점 000팀장(팀원)을 찾아주시면 업무처리를 도와드리겠습니다.
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
| `04-12-644` | 거래내역 조회 | 현금 유입과 장기 대기 원인 확인. | [SRC-027 L74](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L74) |
| `04-12-642` | 적립금및수익률조회 | 현재 평가금액·수익률 확인. | [SRC-027 L65](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L65) |
| `04-12-640` | 상품운용내역조회 | 기존 운용지시/매수 진행 여부 확인. | [SRC-027 L68](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L68) |
| `04-12-17A` | New퇴직연금상품조회 | 현금 목적에 맞는 상품의 현재 조건 조회. | [SRC-003 L803](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/02_마케팅_캠페인/개인형IRP_마케팅_보물지도_Vol1.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/02_%EB%A7%88%EC%BC%80%ED%8C%85_%EC%BA%A0%ED%8E%98%EC%9D%B8/%EA%B0%9C%EC%9D%B8%ED%98%95IRP_%EB%A7%88%EC%BC%80%ED%8C%85_%EB%B3%B4%EB%AC%BC%EC%A7%80%EB%8F%84_Vol1.md#L803) |
| `06-12-611` | 보유상품변경 | 고객이 선택한 현재 현금의 보유상품 변경. | [SRC-027 L67](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L67) |
| `06-12-610` | 입금예정상품 등록/변경 | 입금예정상품 또는 DO 지정 신청을 별도 처리. | [SRC-027 L66](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L66) |
| `04-12-660` | 상담연계등록 | 직접 진행이 어려운 고객의 상담 지원 연계. | [SRC-069 L28](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/posts/2025-11-13_203924_IRP상품운용변경 다들 어떻게 하시나요.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2025-11-13_203924_IRP%EC%83%81%ED%92%88%EC%9A%B4%EC%9A%A9%EB%B3%80%EA%B2%BD%20%EB%8B%A4%EB%93%A4%20%EC%96%B4%EB%96%BB%EA%B2%8C%20%ED%95%98%EC%8B%9C%EB%82%98%EC%9A%94.md#L28) |

화면번호는 저장소 자료와 대조한 업무 참조다. 사내 단말 접속·화면 실행은 하지 않았다. `04-12-179`(기존 화면안내)와 `04-12-17A`(New 화면 표기)는 각 출처의 표기를 유지한다.

### Hot Tip 원문과 고객별 활용

#### Hot Tip #203924 · IRP상품운용변경 다들 어떻게 하시나요?

[사내 게시글 원문](https://lxp.kbstar.com/app/board/hottip-my/view/203924.22BF37852DCF86D972481099E57E925D71298EDD0AE8C067C35C757116253E23) · [저장소 MD](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/posts/2025-11-13_203924_IRP상품운용변경 다들 어떻게 하시나요.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2025-11-13_203924_IRP%EC%83%81%ED%92%88%EC%9A%B4%EC%9A%A9%EB%B3%80%EA%B2%BD%20%EB%8B%A4%EB%93%A4%20%EC%96%B4%EB%96%BB%EA%B2%8C%20%ED%95%98%EC%8B%9C%EB%82%98%EC%9A%94.md) · 게시일 2025-11-13

**연결 이유:** 현금 운용을 실제 변경으로 연결할 지원 채널과 후속 연락 절차.

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
| SRC-019 | [연금 투자, 이거는 알고 하자](<../../../../../knowledge/corpus/02_스타런_퇴직연금_교육자료/02_투자교육/연금투자_기본원칙_이것은_알고_하자.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/02_%EC%8A%A4%ED%83%80%EB%9F%B0_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EA%B5%90%EC%9C%A1%EC%9E%90%EB%A3%8C/02_%ED%88%AC%EC%9E%90%EA%B5%90%EC%9C%A1/%EC%97%B0%EA%B8%88%ED%88%AC%EC%9E%90_%EA%B8%B0%EB%B3%B8%EC%9B%90%EC%B9%99_%EC%9D%B4%EA%B2%83%EC%9D%80_%EC%95%8C%EA%B3%A0_%ED%95%98%EC%9E%90.md) | Training Material / Internal · Unknown |
| SRC-027 | [퇴직연금 주요거래 화면번호 안내](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md) | Reference / Internal · Unknown |
| SRC-069 | [IRP상품운용변경 다들 어떻게 하시나요?](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/posts/2025-11-13_203924_IRP상품운용변경 다들 어떻게 하시나요.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2025-11-13_203924_IRP%EC%83%81%ED%92%88%EC%9A%B4%EC%9A%A9%EB%B3%80%EA%B2%BD%20%EB%8B%A4%EB%93%A4%20%EC%96%B4%EB%96%BB%EA%B2%8C%20%ED%95%98%EC%8B%9C%EB%82%98%EC%9A%94.md) | Field Know-how / Experiential · 2025-11-13 |
| SRC-098 | [연금왕 찐천재 마스터북 — Level 2 / 7주차 디폴트옵션 상품](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/03_영업화법_스크립트_연금왕찐천재/연금왕찐천재_마스터북_Level2_7주차_디폴트옵션상품.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/03_%EC%98%81%EC%97%85%ED%99%94%EB%B2%95_%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8_%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC/%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC_%EB%A7%88%EC%8A%A4%ED%84%B0%EB%B6%81_Level2_7%EC%A3%BC%EC%B0%A8_%EB%94%94%ED%8F%B4%ED%8A%B8%EC%98%B5%EC%85%98%EC%83%81%ED%92%88.md) | Training Material / Internal · 2026-08 (수익률 2026-08-20 기준) |
| SRC-099 | [PRODUCT_MASTER — 개인형IRP 브리핑용 상품 마스터](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md) | Product Data / Internal · 2026-09-10 (금리 2026-09 적용, 추천펀드 성과 2026-08-28 기준, 판매목록 기준일 미기재) |
| SRC-100 | [PRODUCT_MATCHING_KB — 고객상황 → 상품 후보 매핑](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MATCHING_KB.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MATCHING_KB.md) | Product Data / Internal · 2026-09-10 (수치는 SRC-099 마스터의 읽기용 요약) |

## 7. 고객 데이터·대화 원문 부록

<details><summary>대화 자료의 고객 인덱스 원문 — 열 의미를 임의 추정하지 않음</summary>

```json
{
  "raw_row": "김현수 173544-2074623 29 위험중립형 – 없음 0 미설정 1 dep, idl, nod",
  "name": "김현수",
  "customer_id": "173544-2074623",
  "age": 29,
  "investment_profile": "위험중립형",
  "isa_maturity_flag_raw": "–",
  "unlabeled_source_column_6": "없음",
  "tax_deduction_remaining_raw": "0",
  "default_option_status_raw": "미설정",
  "unlabeled_source_column_9": 1,
  "target_code_text_raw": "dep, idl, nod",
  "target_codes": [
    "dep",
    "idl",
    "nod"
  ]
}
```

</details>

<details><summary>고객 DATA 전체 — 입력 JSON의 display_data 그대로</summary>

```json
{
  "schemaVersion": "customer-briefing-display.v0.1",
  "briefingMeta": {
    "caseId": "C01-01",
    "dataType": "시연용가상고객",
    "asOfDate": "2026-09-29",
    "generatedAt": "2026-09-29T07:00:00+09:00",
    "currency": "KRW"
  },
  "customer": {
    "customerId": "173544-2074623",
    "name": "김현수",
    "age": 29,
    "gender": "남",
    "starClubGrade": "패밀리",
    "investmentProfile": "위험중립형",
    "irpOpenedAt": "2024-11-01",
    "defaultOption": {
      "registrationStatus": "미등록",
      "designatedProduct": null,
      "applicationStatus": "미적용"
    }
  },
  "signals": [
    {
      "label": "현금성 장기대기",
      "source": "동료 IRP Agent 시연 데이터(9 Cases v3)"
    },
    {
      "label": "DO 미등록",
      "source": "동료 IRP Agent 시연 데이터(9 Cases v3)"
    },
    {
      "label": "원리금보장 편중",
      "source": "동료 IRP Agent 시연 데이터(9 Cases v3)"
    }
  ],
  "irpAccount": {
    "valuationAmountKrw": 8000000,
    "assetAllocation": [
      {
        "assetType": "원리금보장형",
        "amountKrw": 1200000,
        "weightPct": 15
      },
      {
        "assetType": "실적배당형",
        "amountKrw": 800000,
        "weightPct": 10
      },
      {
        "assetType": "현금성자산",
        "amountKrw": 6000000,
        "weightPct": 75
      }
    ],
    "oneYearReturnPct": -1.8,
    "taxDeductionRemainingKrw": 0,
    "latestProductOpening": {
      "holdingId": "H002",
      "productId": "DEP-005",
      "productName": "신한은행 퇴직연금 정기예금 1년",
      "openedAt": "2026-01-12",
      "amountKrw": 1200000
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
      "valuationAmountKrw": 6000000,
      "weightPct": 75,
      "oneYearReturnPct": null,
      "openedAt": "2024-11-01",
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
      "valuationAmountKrw": 1200000,
      "weightPct": 15,
      "oneYearReturnPct": 3,
      "openedAt": "2026-01-12",
      "allocationBreakdown": null,
      "flags": []
    },
    {
      "holdingId": "H003",
      "productId": "FND-001",
      "productName": "키움 더드림 단기채 (채권)",
      "assetType": "실적배당형",
      "productCategory": "채권형펀드",
      "contractTerm": null,
      "valuationAmountKrw": 800000,
      "weightPct": 10,
      "oneYearReturnPct": -6.4,
      "openedAt": "2025-10-20",
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
          "연도": 2023,
          "납입금액원": 0
        },
        {
          "연도": 2024,
          "납입금액원": 0
        },
        {
          "연도": 2025,
          "납입금액원": 0
        }
      ],
      "타연금계좌올해납입액원": 0,
      "세액공제기준한도원": 9000000,
      "세액공제잔여한도원": 0,
      "퇴직급여재원금액원": 0,
      "개인부담금재원금액원": 8000000
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
      "최근운용지시일": "2025-10-20",
      "최근상품매매일": "2025-10-20",
      "최근입금일": "2026-02-10",
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
        "발생일시": "2027-01-12T00:00:00+09:00",
        "이벤트유형": "상품만기예정",
        "계좌구분": "IRP",
        "관련보유상품식별자": "H002",
        "금액원": 1200000,
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
        "분석일": "2026-07-05",
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
        "값": 75,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M002",
        "지표유형": "파생값",
        "지표명": "원리금보장·현금성자산합산비중",
        "대상참조": null,
        "값": 90,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M003",
        "지표유형": "파생값",
        "지표명": "위험자산(실적배당형)비중",
        "대상참조": null,
        "값": 10,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M004",
        "지표유형": "파생값",
        "지표명": "동연령대평균수익률",
        "대상참조": null,
        "값": 10.2,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M005",
        "지표유형": "파생값",
        "지표명": "동연령대상위1%평균수익률",
        "대상참조": null,
        "값": 28.5,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M006",
        "지표유형": "파생값",
        "지표명": "동연령대상위1%평균원리금보장비중",
        "대상참조": null,
        "값": 18,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M007",
        "지표유형": "기간",
        "지표명": "최근 운용변경 후 경과개월수",
        "대상참조": null,
        "값": 11.3,
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
        "지표유형": "기간",
        "지표명": "현금성자산 대기일수(2024-11-01 입금 후)",
        "대상참조": "H001",
        "값": 697,
        "단위": "일",
        "산출기준일": "2026-09-29"
      }
    ],
    "확인된특이사항": [],
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

<a id="dialogue-6"></a>
<details><summary>행 6 · 고유계정대 얼마야? 금액이랑 비중 둘 다 알려줘</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 김현수` · 선행/후속 원문: `None`

**질문 원문**

> 고유계정대 얼마야? 금액이랑 비중 둘 다 알려줘

**답변 원문**

> 고유계정대 금액은 600만 원이고 비중은 75.0%예요. 고객에게 안내할 때는 생소한 고유계정대라는 용어 대신 현금성자산이나 운용지시가 되지 않는 자산이라는 표현을 사용해 주세요.

</details>

<a id="dialogue-27"></a>
<details><summary>행 27 · 지난 상담에서 무슨 얘기 했는지 알려줘</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 김현수` · 선행/후속 원문: `None`

**질문 원문**

> 지난 상담에서 무슨 얘기 했는지 알려줘

**답변 원문**

> 이 고객과의 지난 상담 기록은 아직 등록된 내용이 없어요. 기록이 없는 상태이므로 별도의 지난 상담 이력을 안내해 드릴 수 있는 내용은 아직 준비된 자료가 없어요.

</details>

<a id="dialogue-70"></a>
<details><summary>행 70 · 적립금이 1천만원도 안 되는데 이런 고객도 관리 대상이야?</summary>

매핑 방식 `context_and_data_match` · 확신도 `high` · 매핑 메모: 적립금 1천만원 미만·현금성 600만원 고객 조건이 일치

원문 세그먼트 표기: `None` · 선행/후속 원문: `None`

**질문 원문**

> 적립금이 1천만원도 안 되는데 이런 고객도 관리 대상이야?

**답변 원문**

> 적립금이 1천만원 미만이더라도 이 고객은 원리금보장·현금성 자산 비중이 90%로 편중되어 있고 디폴트옵션이 미설정되어 있어 관리 대상에 해당해요. 현재 고유계정대와 예금을 포함한 원리금보장·현금성 자산 비중이 높고 키움 더드림 단기채 수익률이 -6.4%를 기록하면서 전체 운용수익률이 -1.8%에 머물러 있는 상태예요. 이는 동연령 평균 수익률 10.2%와 비교해 저조한 수준이며, 위험자산 한도 70% 중 위험자산 비중이 0%로 나타나 포트폴리오 조정이 필요한 상태예요.

</details>

<a id="dialogue-163"></a>
<details><summary>행 163 · 예금만 들고 있는데 뭐라고 말해야 하지?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 김현수` · 선행/후속 원문: `None`

**질문 원문**

> 예금만 들고 있는데 뭐라고 말해야 하지?

**답변 원문**

> 예금만 보유하고 있어 관리가 필요 없다는 고객에게는 금리 갈아타기가 곧 관리라는 점을 짚어주는 게 핵심이에요. 이미 안정적으로 잘 운용하고 계신다고 인정한 뒤, 같은 안전성 안에서 금리를 올려주는 제안으로 들어가야 해요. 고객이 사용계획이 있는 자금인지 먼저 확인하고, 고객에게는 "예금과 같은 원리금보장상품도 관리가 중요합니다. 국민은행은 고객님들을 위해 매월 금리가 가장 좋은 상품을 지속적으로 제공하고 있고, GIC 등 고금리 원리금보장상품도 비대면으로 손쉽게 거래하실 수 있습니다"라고 안내해 보세요.

</details>


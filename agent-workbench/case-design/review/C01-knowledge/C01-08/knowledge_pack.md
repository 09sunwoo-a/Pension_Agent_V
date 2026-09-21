# C01-08 윤가영 · 브리핑 작성용 기반지식

**용도:** 작성자가 S1~S5 솔루션을 구성할 때 사용할 고객별 재료. 아래 솔루션 방향은 편집자의 작업 가설이며 완성 브리핑/매수 지시가 아니다.

고객 데이터 기준일: **2026-09-29** · 개별 매핑 대화 **0건** · 작성일 2026-09-21

[전체 고객 색인](<../README.md>) · [고객·대화 입력 JSON](<../../../../../C01_고객DATA_대화_원문매핑.json>) · [해당 고객 JSON](<../../../active/display-data/C01-08.json>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/active/display-data/C01-08.json)

입력 위치: `customers[7]` (`case_id=C01-08`). 대화 행 번호는 원본 `source_row_no`이며 고객 상담 발생 순서를 뜻하지 않는다.

**다른 GPT 세션에서 사용:** 이 파일 하나를 첨부하면 고객 DATA·매핑 대화 전체·선별 지식 원문을 함께 검토할 수 있다. 원문 Git 링크는 `41ae9a4` 커밋에 고정했다. 인용의 문장은 그대로이며 상대 이미지 경로만 이 파일 위치에 맞췄다. GitHub 접근 권한과 사내 게시글 로그인은 별도다.

## 1. S1 작성 재료 — 고객 데이터와 세그먼트

| 항목 | 입력 데이터 | 데이터 위치 |
|---|---|---|
| 고객 | 윤가영 · 66세 · 적극투자형 · 재직 | `/customer`, `/에이전트맥락데이터/고객계획` |
| 계좌 | 480,000,000원 · 표시 1년 수익률 11.4% | `/irpAccount` |
| 납입 | 올해 당행 개인부담금 9,000,000원 · 타 연금계좌 0원 · 공제잔여 표시값 0원 | `/에이전트맥락데이터/납입및세제` |
| 재원 | 퇴직급여 0원 · 개인부담금 480,000,000원 | 같은 절의 재원 필드 |
| 디폴트옵션 | 미등록 · 지정상품 없음 · 미적용 | `/customer/defaultOption` |
| 연금개시 | 요건충족 표시값 False · 개시 False | `/에이전트맥락데이터/퇴직및인출` |

표시값과 대화·제도자료가 충돌하는 항목은 아래 검토사항에 남겼다. 표시값을 임의로 교정하지 않았다.

세그먼트 정의: [뱃지 카탈로그](<../../BADGE_CATALOG.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/review/BADGE_CATALOG.md). 뱃지는 현재 상태이며 그 자체가 자동 추천 결론은 아니다.

| 세그먼트 원문 | 사실 근거와 연결할 지식 |
|---|---|
| 이탈징후 | 8/5 상담에서 증권사 ETF 편의·다양성 문의. T-ETF로 투자 목적과 실제 기능 차이를 확인. |
| 현금성 과다 | 현금 2억5,000만원, 최근 1개월 1억7,000만원 증가. 사용/주문/이전 준비 여부를 확인하고 PM-01·07로 연결. |
| DO 미등록 | 미등록 사실은 별도 관리 항목. 이전을 막기 위한 조건으로 DO 가입을 요구하지 않음. |

| 보유상품 원문 | 평가금액 | 비중 | 데이터상 플래그 |
|---|---:|---:|---|
| 현금성자산 | 250,000,000원 | 52% | 없음 |
| 마이다스 아시아 리더스 성장주(H) (주식) | 83,000,000원 | 17.3% | 없음 |
| RISE 미국나스닥100 ETF | 92,000,000원 | 19.2% | 없음 |
| RISE 미국S&P500 ETF | 55,000,000원 | 11.5% | 없음 |

### 대화에서 찾은 솔루션 재료

| 대화 행 | 읽을 내용 | 이번 자료에서의 취급 |
|---|---|---|
| [행 74](#dialogue-74) | 다중고객 관리 대상 목록 | 윤가영 구간만 발췌; 독립 상담 답변으로 오인하지 않음. |
| [행 124](#dialogue-124) | 공통 타겟 재안내 | 현금·이탈징후의 맥락을 DATA와 대조. |
| [행 125](#dialogue-125) | 공통 타겟 재안내 | 별도 솔루션 합의나 이전 신청 사실이 아님. |

### 먼저 확인할 불일치·미확인 사항

- 독립 매핑 대화는 0건이다. 공통 행의 해당 고객 구간과 8/5 상담메모에 근거한다.
- 이전 문의는 있지만 실제 이전 신청·확정 의사는 확인되지 않는다.
- 보유행 현금 비중 52%와 계산상 52.1%는 반올림 차이로 구분한다. 현금 증가만으로 장기 방치를 단정하지 않는다.
- Hot Tip의 “3등급 보통위험” 표현과 상품 마스터 위험등급 체계가 맞지 않는다. 검색 필터/적합성을 그대로 적용하지 않는다.

## 2. 대략적인 솔루션 방향과 S2 근거

고객이 원하는 ETF와 거래 편의가 무엇인지부터 확인한다. 최근 크게 늘어난 현금의 목적을 확인하고 실제 지원 상품·거래방식을 비교해 선택을 돕는 방향이다. 운용을 계속 원한다면 단기 대기 목적과 장기 투자 목적을 나누고, 기존 미국 주식 노출을 중복 확대하지 않도록 후보 역할을 설명한다.

**구성 우선순위:** 이전 문의 이유 경청 → 현금 목적/기존 노출 → 실제 상품·거래기능 비교 → 선택한 운용과 후속 확인.

**고객에게 확인할 사항:**

- 불편한 점은 원하는 종목의 부재인가, 주문 방식이나 가격 확인인가?
- 현금 증가분은 지출·추가매수·이전 준비 중 어떤 목적의 자금인가?
- 기존 미국 주식 노출을 유지할지 다른 역할을 더할지 원하는 방향은?

### 기존 브리핑에서 참고할 구성

- [B03-07](<../../../active/briefing-json/B03-07.json>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/active/briefing-json/B03-07.json): 타 금융회사 문의의 이유를 확인하고 비교하는 구성. 고객 사실·금액·고객 발언은 이 사례로 옮기지 않는다.
- [B09-02](<../../../active/briefing-json/B09-02.json>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/active/briefing-json/B09-02.json): 기존 보유와 신규 운용의 노출을 함께 비교. 고객 사실·금액·고객 발언은 이 사례로 옮기지 않는다.

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

ETF 라인업과 거래 방식의 실제 확인이 먼저다. ETF-006은 기존 보유 유지 검토용이며 추가 매수 후보와 구분한다. 100% 운용가능 표시를 전액 투자의 이유로 삼지 않는다.

아래 상품은 고객별 **비교 후보 또는 유지할 설정**이다. 동시에 모두 매수하는 배분안이 아니다. `SRC-099`는 상품자료를 정리한 마스터로, 원 상품자료 S01~S05 파일은 이 작업에서 저장소 내 실물을 찾지 못했다. 마스터 레코드까지 대조했으며 원 상품자료 재검증·현재 판매가능 확인을 완료한 것으로 표시하지 않는다.

9월 예금금리는 2026-09-01~09-30 적용자료, 월간 펀드 성과는 2026-08-28, 판매목록 성과는 기준일 미기재다. 10월 이후 자금에 9월 금리를 약속하지 않는다. 고객별 손익과 상품 마스터의 관측성과를 섞지 않는다.

| 상품/자료 ID | 이 고객에게 연결하는 이유 | 선택 전 확인 |
|---|---|---|
| [ETF-002 · RISE 머니마켓액티브](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md#ETF-002>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#ETF-002) | 짧은 대기 목적 자금에서 머니마켓형 ETF 방식 비교. | 원금보장 아님. 비용·가격변동·매매 및 정산 방식 확인. |
| [ETF-004 · KODEX TRF3070](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md#ETF-004>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#ETF-004) | 기존 주식형 ETF와 다른 주식/채권 혼합 역할 비교. | 실제 자산 구성·중복과 위험을 확인. “100% 가능”은 규정상 표기. |
| [ETF-006 · RISE 미국S&P500](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md#ETF-006>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#ETF-006) | 이미 보유한 S&P500 노출의 유지/중복 점검용. | 나스닥 등과 합산한 미국 주식 노출 확인. 신규 매수로 자동 연결하지 않음. |

### 전략 적용 조건 원문

#### PM-07 · 이 고객에서의 적용

직접운용 관심과 실제 거래 조건을 연결한다.

출처: [SRC-100 · PM-07](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MATCHING_KB.md#PM-07>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MATCHING_KB.md#L472-L533) · 해당 카드 L472–533. **자료 기반 기획 해석**이며 공식 업무규정과 구분한다.

> ### PM-07 · ETF 직접운용 관심
>
> **적용할 때 보는 데이터:** ETF 조회·매매 이력(관심 신호) / 기존 ETF·펀드의 국가/섹터 노출 / 성향·현재 운용가능금액.
>
> **고객과 확인:** 조회한 이유와 실제 원하는 투자대상은? / 직접 선택·정기 점검할 의향이 있는가? / 환율 노출과 원금손실 위험을 어느 정도 감수하는가?
>
> **관리방향:** 조회 신호를 상담 질문으로 연결한다. 고객이 원하는 투자대상과 관리방식을 확인한 뒤 실제 해당 노출을 구현하는 ETF를 비교한다.
>
> | 추가로 확인된 조건 | 검토 상품군/방식 |
> |---|---|
> | 미국 대표지수 투자 | S&P500 ETF |
> | 같은 지수에서 환헤지형 비교 필요 | H 표기 ETF |
> | 배당전략에 관심 | 배당 ETF; 실제 분배 조건 별도 확인 |

> **제외·유지·보류:** ETF 조회만으로 가입 의사를 확정하지 않는다. 대표지수/배당 ETF를 저위험 또는 모든 연령에게 적합한 상품으로 표시하지 않는다. 은행 ETF 매매를 증권사 지정가·수량 주문과 동일하게 설명하지 않는다.
>
> **S3에 쓸 수 있는 관리방향 문장(기획 예시):**
>
> > 최근 ETF 관심이 실제 투자 의향으로 이어지는지 확인하고, 원하는 지수·배당전략·환헤지 선호에 맞춰 후보를 비교하되 기존 계좌의 주식 쏠림을 함께 점검합니다.
>
> **후속 확인:** 04-12-17A 및 설명서에서 상품·한도·거래방식을 확인한다. 현재 Batch에 없는 ETF가 반드시 판매불가인 것은 아니다.
>
> **판단 근거:** E06:1-3 ETF·별첨·실전문제 Q2/Q4; K03:디지털 Signal; K01:RS-12.  
> **기존 문서 연결:** RS-02, RS-12, CASE 01의 직접운용 분기 (RS는 K01, CASE는 K02의 버전 기준).

#### PM-01 · 이 고객에서의 적용

현금 목적이 확인된 후에만 운용 후보를 제시한다.

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


### 상품 마스터 원문 레코드

후보의 구성·위험·가용성·출처를 생략하지 않도록 원문 레코드를 접어두었다. `runtime_verified: false` 상태도 보존한다.

<details><summary>ETF-002 원문 레코드 · L5772–5847</summary>

[상품 원문](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#L5772-L5847)

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

</details>

<details><summary>ETF-004 원문 레코드 · L5930–6005</summary>

[상품 원문](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#L5930-L6005)

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

</details>

<details><summary>ETF-006 원문 레코드 · L6089–6166</summary>

[상품 원문](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#L6089-L6166)

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

</details>


## 4. S4 재료 — 영업화법 원문

T-ETF의 목적 질문과 선택 논리를 보존하되 교육 대화 속 직원·전문가 발언을 고객의 실제 말로 옮기지 않는다. DO는 고객이 원할 때 설명할 보조 주제다.

아래 인용은 **저장소 MD의 해당 구간을 문장 수정 없이 발췌**했다. PDF/영상 자체를 다시 대조한 결과와 구분한다. 문서의 설명·예시 고객 반응은 실제 고객 발언이 아니다. 고객용 최종 화법은 작성자가 호칭·날짜·금액·상품 및 적용 조건을 맞춰 편집한다.

<a id="T-ETF"></a>
### T-ETF · ETF 이전 문의: 투자 목적과 상품 선택의 논리

근거: [SRC-013 · ETF를 이유로 한 증권사 이전 이탈 대응](<../../../../../knowledge/corpus/02_스타런_퇴직연금_교육자료/01_이탈방지상담/ETF_증권사이전_이탈대응.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/02_%EC%8A%A4%ED%83%80%EB%9F%B0_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EA%B5%90%EC%9C%A1%EC%9E%90%EB%A3%8C/01_%EC%9D%B4%ED%83%88%EB%B0%A9%EC%A7%80%EC%83%81%EB%8B%B4/ETF_%EC%A6%9D%EA%B6%8C%EC%82%AC%EC%9D%B4%EC%A0%84_%EC%9D%B4%ED%83%88%EB%8C%80%EC%9D%91.md#L35-L51) · L35–51 · 자료 기준 Unknown

**이 고객에게 적용할 때:** 직원-전문가 교육 대화의 정제 전사다. 고객 발화로 바꾸어 저장하지 않는다. 약 100개/900개 라인업 수는 기준일 미상이라 현재 수치로 재사용하지 않는다. 이미 이전 신청했다고 가정하지 않는다.

<!-- source-excerpt {"key": "T-ETF", "path": "knowledge/corpus/02_스타런_퇴직연금_교육자료/01_이탈방지상담/ETF_증권사이전_이탈대응.md", "start": 35, "end": 51, "sha256": "605adfbb81a66fa2dbaff1a65d9989ce0180ba64601f5e99e52afa9e06d46558"} -->
> ## 원문 발화 (정제 전사)
>
> **질문(직원):**
> > 수정아, 실물이전 때문에 지금 난리잖아. ETF 때문에 증권사로 옮긴다고 하는데 어떻게 해야 될까?
>
> **답변(전문가):**
> > 최근 주식처럼 단기 직접투자를 선호하는 고객들을 중심으로 퇴직연금 투자에서도 ETF의 인기가 높은 상황이에요. 그러한 핵심적인 이유는 '수익률이 우수하다'는 막연한 인식, 매수·매도 거래 편리성 때문인데요. 특히 단기 테마 중심으로 투자하는 고객들이 선호하는 경향이 있어요.
> >
> > 이러한 ETF의 특성이 퇴직연금 투자에도 적합할까요? 일반적인 경우에는 그렇지 않아요. 퇴직연금은 장기적인 관점에서 안정적인 수익률을 추구하며 운용하는 것을 추천합니다. 높은 변동성과 단기 직접투자의 위험성 등 감안 시 퇴직연금 투자는 분산투자 기반으로 TDF 중심 투자를 추천해요. 고객님께서 일부 자금을 ETF에 투자하고 싶은 경우에는 당행에서도 주요 섹터·테마, 지역별 엄선한 ETF 상품에 대한 투자를 편리하게 하실 수 있어요.
>
> **질문(직원):**
> > 그러면 ETF 상품 경쟁력이 떨어져서 옮기신다는 고객님들도 계시거든. 그럴 때는 어떻게 응대해야 될까?
>
> **답변(전문가):**
> > ETF 투자 환경 관련 은행과 증권사의 가장 큰 차이점은 제공하는 상품 수거든요. ETF 상품 라인업을 당행은 약 100개, 증권사는 약 900개를 제공하고 있어요. 증권사처럼 선택할 수 있는 상품이 많은 것이 무조건 고객님에게 유리할까요? 그렇지 않아요. 대부분 일반적인 퇴직연금 투자 고객님들은 오히려 이 많은 상품 중에 '어떤 상품이 좋은 상품인지, 어떤 상품을 선택해야 하지?'라는 선택에 어려움을 겪고 있어요.
> >
> > 당행은 고객 수요가 많고 수익과 위험이 검증된 ETF 상품을 선별해서 제공하고 있어요. 따라서 증권사보다 더 쉽게 당행에서 고객 선호도가 높은 지수·섹터·테마 중 선별된 ETF에 투자할 수 있어요.
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
| `04-12-644` | 거래내역 조회 | 최근 현금 증가의 입출금·매도 이력 확인. | [SRC-027 L74](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L74) |
| `04-12-642` | 적립금및수익률조회 | 현재 평가금액과 보유 노출 확인. | [SRC-027 L65](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L65) |
| `04-12-640` | 상품운용내역조회 | 이미 진행 중인 주문/변경 여부 확인. | [SRC-027 L68](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L68) |
| `04-12-17A` | New퇴직연금상품조회 | 고객이 원하는 ETF의 실제 제공·투자가능한도·위험 확인. | [SRC-003 L803](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/02_마케팅_캠페인/개인형IRP_마케팅_보물지도_Vol1.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/02_%EB%A7%88%EC%BC%80%ED%8C%85_%EC%BA%A0%ED%8E%98%EC%9D%B8/%EA%B0%9C%EC%9D%B8%ED%98%95IRP_%EB%A7%88%EC%BC%80%ED%8C%85_%EB%B3%B4%EB%AC%BC%EC%A7%80%EB%8F%84_Vol1.md#L803) |
| `06-12-611` | 보유상품변경 | 선택한 운용 변경. ETF별 실제 주문 채널/방식은 별도 확인. | [SRC-027 L67](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L67) |
| `06-12-610` | 입금예정상품 등록/변경 | 고객이 원하는 경우 향후 DO 지정 신청. | [SRC-027 L66](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L66) |

화면번호는 저장소 자료와 대조한 업무 참조다. 사내 단말 접속·화면 실행은 하지 않았다. `04-12-179`(기존 화면안내)와 `04-12-17A`(New 화면 표기)는 각 출처의 표기를 유지한다.

### Hot Tip 원문과 고객별 활용

#### Hot Tip #206430 · ETF 100%운용지시로 ★개인형IRP 수익률 극대화하고 증권사 이탈 방어하기꿀TIP★

[사내 게시글 원문](https://lxp.kbstar.com/app/board/hottip-my/view/206430.F8ABDE4DAA360D5AF8E49235BDE49F3C4F5248578829B2D15D2DBBD410116850) · [저장소 MD](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/posts/2026-06-29_206430_ETF 100%운용지시로 ★개인형IRP 수익률 극대화하고 증권사 이탈 방.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2026-06-29_206430_ETF%20100%25%EC%9A%B4%EC%9A%A9%EC%A7%80%EC%8B%9C%EB%A1%9C%20%E2%98%85%EA%B0%9C%EC%9D%B8%ED%98%95IRP%20%EC%88%98%EC%9D%B5%EB%A5%A0%20%EA%B7%B9%EB%8C%80%ED%99%94%ED%95%98%EA%B3%A0%20%EC%A6%9D%EA%B6%8C%EC%82%AC%20%EC%9D%B4%ED%83%88%20%EB%B0%A9.md) · 게시일 2026-06-29

**연결 이유:** ETF 문의에 상품조회 화면과 기능 비교를 연결하는 자료.

<a id="H-ETF"></a>
#### H-ETF · ETF 조회와 증권사 이전 문의 대응

근거: [SRC-081 · ETF 100%운용지시로 ★개인형IRP 수익률 극대화하고 증권사 이탈 방어하기꿀TIP★](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/posts/2026-06-29_206430_ETF 100%운용지시로 ★개인형IRP 수익률 극대화하고 증권사 이탈 방.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2026-06-29_206430_ETF%20100%25%EC%9A%B4%EC%9A%A9%EC%A7%80%EC%8B%9C%EB%A1%9C%20%E2%98%85%EA%B0%9C%EC%9D%B8%ED%98%95IRP%20%EC%88%98%EC%9D%B5%EB%A5%A0%20%EA%B7%B9%EB%8C%80%ED%99%94%ED%95%98%EA%B3%A0%20%EC%A6%9D%EA%B6%8C%EC%82%AC%20%EC%9D%B4%ED%83%88%20%EB%B0%A9.md#L133-L159) · L133–159 · 자료 기준 2026-06-29

**이 고객에게 적용할 때:** 현장 팁의 04-12-17A 조회 경로를 연결한다. 위험등급 «3등급 보통위험» 표기는 상품 마스터와 일치하지 않으므로 그대로 필터 규칙으로 구현하지 않는다. 100% 가능은 원금보장/전액 편입 권고가 아니다.

<!-- source-excerpt {"key": "H-ETF", "path": "knowledge/corpus/03_스타런_영업점_Hottip/posts/2026-06-29_206430_ETF 100%운용지시로 ★개인형IRP 수익률 극대화하고 증권사 이탈 방.md", "start": 133, "end": 159, "sha256": "eec80e523d738c1c7c7951335686227bf959c74300bf1eb9495aa6eaad60edce"} -->
> 운용지시 가능한 상품들은 어디서 조회할 수 있는지 공유드립니다!
>
> **04-12-17A**** **
>
> 화면에서
>
> **상품 구분 > ETF**
>
> **위험등급 > 3등급 보통위험**
>
> **투자가능한도 > 100%로**
>
> 검색하면
>
> 당일 장중매수, 장중매도가 가능한 ETF 상품들을 찾을 수 있습니다!
>
> 보통 채권혼합형의 경우 위험등급이 보통위험 이하의 상품들이기 때문에
>
> 위험등급을 3,4등급으로 조회하여 가능한 상품들을 조회할 수 있습니다
>
> 고객님들은 은행보다는 증권사가 퇴직연금 수익률이 좀 더 좋다고 생각하는 경향이 많기 때문에
>
> 정기예금 또는 펀드로 운용시 증권사로 이탈할 수 있는 가능성이 있습니다!
>
> 당일 실시간 가격 확인이 가능한 ETF를 최대한 활용하여
>
> 고객들의 퇴직연금을 관리하고 증권사로의 이탈을 방어하면 좋을 것 같습니다 :) 읽어주셔서 감사합니다!
<!-- /source-excerpt -->


Hot Tip 링크는 원문 MD에 기록된 주소 그대로다. 로그인 접근·현재 업무 유효성은 검증하지 않았다. 현장 경험담의 절차는 본부 화면자료와 대조하여 사용한다.

## 6. 출처 목록

| Source ID | 자료 | 성격·기준시점 |
|---|---|---|
| SRC-002 | [연금고객 수익률 KPI 평가대상 고객관리 시나리오](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/01_고객관리_수익률관리/연금고객_수익률KPI_고객관리_시나리오.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/01_%EA%B3%A0%EA%B0%9D%EA%B4%80%EB%A6%AC_%EC%88%98%EC%9D%B5%EB%A5%A0%EA%B4%80%EB%A6%AC/%EC%97%B0%EA%B8%88%EA%B3%A0%EA%B0%9D_%EC%88%98%EC%9D%B5%EB%A5%A0KPI_%EA%B3%A0%EA%B0%9D%EA%B4%80%EB%A6%AC_%EC%8B%9C%EB%82%98%EB%A6%AC%EC%98%A4.md) | Official / Internal Guide / Internal · Unknown |
| SRC-003 | [개인형IRP 마케팅 보물지도](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/02_마케팅_캠페인/개인형IRP_마케팅_보물지도_Vol1.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/02_%EB%A7%88%EC%BC%80%ED%8C%85_%EC%BA%A0%ED%8E%98%EC%9D%B8/%EA%B0%9C%EC%9D%B8%ED%98%95IRP_%EB%A7%88%EC%BC%80%ED%8C%85_%EB%B3%B4%EB%AC%BC%EC%A7%80%EB%8F%84_Vol1.md) | Official / Internal Guide / Internal · 2026-03 |
| SRC-013 | [ETF를 이유로 한 증권사 이전 이탈 대응](<../../../../../knowledge/corpus/02_스타런_퇴직연금_교육자료/01_이탈방지상담/ETF_증권사이전_이탈대응.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/02_%EC%8A%A4%ED%83%80%EB%9F%B0_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EA%B5%90%EC%9C%A1%EC%9E%90%EB%A3%8C/01_%EC%9D%B4%ED%83%88%EB%B0%A9%EC%A7%80%EC%83%81%EB%8B%B4/ETF_%EC%A6%9D%EA%B6%8C%EC%82%AC%EC%9D%B4%EC%A0%84_%EC%9D%B4%ED%83%88%EB%8C%80%EC%9D%91.md) | Training Material / Internal · Unknown |
| SRC-019 | [연금 투자, 이거는 알고 하자](<../../../../../knowledge/corpus/02_스타런_퇴직연금_교육자료/02_투자교육/연금투자_기본원칙_이것은_알고_하자.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/02_%EC%8A%A4%ED%83%80%EB%9F%B0_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EA%B5%90%EC%9C%A1%EC%9E%90%EB%A3%8C/02_%ED%88%AC%EC%9E%90%EA%B5%90%EC%9C%A1/%EC%97%B0%EA%B8%88%ED%88%AC%EC%9E%90_%EA%B8%B0%EB%B3%B8%EC%9B%90%EC%B9%99_%EC%9D%B4%EA%B2%83%EC%9D%80_%EC%95%8C%EA%B3%A0_%ED%95%98%EC%9E%90.md) | Training Material / Internal · Unknown |
| SRC-027 | [퇴직연금 주요거래 화면번호 안내](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md) | Reference / Internal · Unknown |
| SRC-081 | [ETF 100%운용지시로 ★개인형IRP 수익률 극대화하고 증권사 이탈 방어하기꿀TIP★](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/posts/2026-06-29_206430_ETF 100%운용지시로 ★개인형IRP 수익률 극대화하고 증권사 이탈 방.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2026-06-29_206430_ETF%20100%25%EC%9A%B4%EC%9A%A9%EC%A7%80%EC%8B%9C%EB%A1%9C%20%E2%98%85%EA%B0%9C%EC%9D%B8%ED%98%95IRP%20%EC%88%98%EC%9D%B5%EB%A5%A0%20%EA%B7%B9%EB%8C%80%ED%99%94%ED%95%98%EA%B3%A0%20%EC%A6%9D%EA%B6%8C%EC%82%AC%20%EC%9D%B4%ED%83%88%20%EB%B0%A9.md) | Field Know-how / Experiential · 2026-06-29 |
| SRC-098 | [연금왕 찐천재 마스터북 — Level 2 / 7주차 디폴트옵션 상품](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/03_영업화법_스크립트_연금왕찐천재/연금왕찐천재_마스터북_Level2_7주차_디폴트옵션상품.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/03_%EC%98%81%EC%97%85%ED%99%94%EB%B2%95_%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8_%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC/%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC_%EB%A7%88%EC%8A%A4%ED%84%B0%EB%B6%81_Level2_7%EC%A3%BC%EC%B0%A8_%EB%94%94%ED%8F%B4%ED%8A%B8%EC%98%B5%EC%85%98%EC%83%81%ED%92%88.md) | Training Material / Internal · 2026-08 (수익률 2026-08-20 기준) |
| SRC-099 | [PRODUCT_MASTER — 개인형IRP 브리핑용 상품 마스터](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md) | Product Data / Internal · 2026-09-10 (금리 2026-09 적용, 추천펀드 성과 2026-08-28 기준, 판매목록 기준일 미기재) |
| SRC-100 | [PRODUCT_MATCHING_KB — 고객상황 → 상품 후보 매핑](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MATCHING_KB.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MATCHING_KB.md) | Product Data / Internal · 2026-09-10 (수치는 SRC-099 마스터의 읽기용 요약) |

## 7. 고객 데이터·대화 원문 부록

<details><summary>대화 자료의 고객 인덱스 원문 — 열 의미를 임의 추정하지 않음</summary>

```json
{
  "raw_row": "윤가영 162754-9483106 66 적극투자형 – 있음 0 미설정 0 out, nod",
  "name": "윤가영",
  "customer_id": "162754-9483106",
  "age": 66,
  "investment_profile": "적극투자형",
  "isa_maturity_flag_raw": "–",
  "unlabeled_source_column_6": "있음",
  "tax_deduction_remaining_raw": "0",
  "default_option_status_raw": "미설정",
  "unlabeled_source_column_9": 0,
  "target_code_text_raw": "out, nod",
  "target_codes": [
    "out",
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
    "caseId": "C01-08",
    "dataType": "시연용가상고객",
    "asOfDate": "2026-09-29",
    "generatedAt": "2026-09-29T07:00:00+09:00",
    "currency": "KRW"
  },
  "customer": {
    "customerId": "162754-9483106",
    "name": "윤가영",
    "age": 66,
    "gender": "여",
    "starClubGrade": "VVIP",
    "investmentProfile": "적극투자형",
    "irpOpenedAt": "2022-07-12",
    "defaultOption": {
      "registrationStatus": "미등록",
      "designatedProduct": null,
      "applicationStatus": "미적용"
    }
  },
  "signals": [
    {
      "label": "이탈징후",
      "source": "동료 IRP Agent 시연 데이터(9 Cases v3)"
    },
    {
      "label": "현금성 과다",
      "source": "동료 IRP Agent 시연 데이터(9 Cases v3)"
    },
    {
      "label": "DO 미등록",
      "source": "동료 IRP Agent 시연 데이터(9 Cases v3)"
    }
  ],
  "irpAccount": {
    "valuationAmountKrw": 480000000,
    "assetAllocation": [
      {
        "assetType": "원리금보장형",
        "amountKrw": 0,
        "weightPct": 0
      },
      {
        "assetType": "실적배당형",
        "amountKrw": 230000000,
        "weightPct": 48
      },
      {
        "assetType": "현금성자산",
        "amountKrw": 250000000,
        "weightPct": 52
      }
    ],
    "oneYearReturnPct": 11.4,
    "taxDeductionRemainingKrw": 0,
    "latestProductOpening": {
      "holdingId": "H004",
      "productId": "ETF-006",
      "productName": "RISE 미국S&P500 ETF",
      "openedAt": "2025-10-15",
      "amountKrw": 55000000
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
      "valuationAmountKrw": 250000000,
      "weightPct": 52,
      "oneYearReturnPct": null,
      "openedAt": "2021-07-12",
      "allocationBreakdown": null,
      "flags": []
    },
    {
      "holdingId": "H002",
      "productId": "MF-005",
      "productName": "마이다스 아시아 리더스 성장주(H) (주식)",
      "assetType": "실적배당형",
      "productCategory": "주식형펀드",
      "contractTerm": null,
      "valuationAmountKrw": 83000000,
      "weightPct": 17.3,
      "oneYearReturnPct": 18.6,
      "openedAt": "2025-05-02",
      "allocationBreakdown": null,
      "flags": []
    },
    {
      "holdingId": "H003",
      "productId": null,
      "productName": "RISE 미국나스닥100 ETF",
      "assetType": "실적배당형",
      "productCategory": "ETF",
      "contractTerm": null,
      "valuationAmountKrw": 92000000,
      "weightPct": 19.2,
      "oneYearReturnPct": 41.5,
      "openedAt": "2025-04-07",
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
      "valuationAmountKrw": 55000000,
      "weightPct": 11.5,
      "oneYearReturnPct": 22.2,
      "openedAt": "2025-10-15",
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
      "개인부담금재원금액원": 480000000
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
      "최근운용지시일": "2026-08-04",
      "최근상품매매일": "2026-08-04",
      "최근입금일": "2026-08-01",
      "최근1년상품매매횟수": 14
    },
    "퇴직및인출": {
      "연금수령요건충족여부": false,
      "연금개시여부": false,
      "연금지급설계등록여부": false
    },
    "최근사건": [],
    "금융거래": [],
    "상담이력": [
      {
        "상담식별자": "CRM001",
        "상담일시": "2026-08-05T00:00:00+09:00",
        "상담채널": null,
        "상담유형": "퇴직연금사후관리",
        "상담메모": "증권사의 ETF 거래 편의성과 상품 선택 폭을 문의. 최근 현금성자산이 크게 늘어난 상태로 향후 운용방향을 검토 중."
      }
    ],
    "외부계좌": [],
    "투자성향이력": [
      {
        "이력식별자": "R001",
        "분석일": "2026-08-01",
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
        "값": 52.1,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M002",
        "지표유형": "파생값",
        "지표명": "원리금보장·현금성자산합산비중",
        "대상참조": null,
        "값": 52.1,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M003",
        "지표유형": "파생값",
        "지표명": "위험자산(실적배당형)비중",
        "대상참조": null,
        "값": 47.9,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M004",
        "지표유형": "파생값",
        "지표명": "동연령대평균수익률",
        "대상참조": null,
        "값": 5.2,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M005",
        "지표유형": "파생값",
        "지표명": "동연령대상위1%평균수익률",
        "대상참조": null,
        "값": 16.8,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M006",
        "지표유형": "파생값",
        "지표명": "동연령대상위1%평균원리금보장비중",
        "대상참조": null,
        "값": 48,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M007",
        "지표유형": "기간",
        "지표명": "최근 운용변경 후 경과개월수",
        "대상참조": null,
        "값": 1.8,
        "단위": "개월",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M008",
        "지표유형": "기간",
        "지표명": "최근 상담 후 경과일수(장기 미접촉)",
        "대상참조": null,
        "값": 55,
        "단위": "일",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M009",
        "지표유형": "파생값",
        "지표명": "최근 1개월 현금성자산 증감액",
        "대상참조": null,
        "값": 170000000,
        "단위": "원",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M010",
        "지표유형": "상태비교",
        "지표명": "이탈징후 판정(최근 1개월 현금화 +1억 7,000만원·증권사 ETF 문의)",
        "대상참조": [
          "CRM001"
        ],
        "값": true,
        "단위": null,
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M011",
        "지표유형": "상태비교",
        "지표명": "현금성자산 과다 여부(관리기준 50% 초과)",
        "대상참조": [
          "H001"
        ],
        "값": true,
        "단위": null,
        "산출기준일": "2026-09-29"
      }
    ],
    "확인된특이사항": [
      {
        "구분": "이탈징후",
        "내용": "최근 1개월 고유계정대 +1억 7,000만원(현금화 신호), 8/5 증권사 ETF 거래 편의성 문의, 디폴트옵션 미설정"
      }
    ],
    "가상설정메모": [
      "동료 IRP Agent 시연 데이터(9 Cases v3)에서 옮긴 시연 데이터. 기준일 2026-09-29.",
      "성별은 시연용 가정. 연금개시 요건은 가입 5년 미만으로 미충족."
    ]
  }
}
```

</details>

### 고객별 매핑 대화 전체

질문과 답변은 입력 파일의 문자열을 그대로 보존했다. 포함된 세율·상품·화면번호·데모 링크가 검증되었다는 뜻은 아니다. 위 검토사항과 함께 사용한다.

이 고객에게 직접 매핑된 개별 대화는 0건이다. 아래는 다중고객 답변 중 해당 고객의 문장만 발췌한 구간이다.

<a id="dialogue-74"></a>
#### 공통 행 74의 윤가영 구간

> 윤가영 고객은 이탈위험 관찰(현금화 신호) 최근 1개월 +1억 7,000만원과 디폴트옵션 미설정으로 선정되었고

<a id="dialogue-124"></a>
#### 공통 행 124의 윤가영 구간

> 윤가영 고객은 최근 1개월 이탈위험 관찰(현금화 신호)과 디폴트옵션 미설정으로 선정되었고

<a id="dialogue-125"></a>
#### 공통 행 125의 윤가영 구간

> 윤가영 — 이탈위험 관찰(현금화 신호) 최근 1개월 +1억 7,000만원, 디폴트옵션 미설정


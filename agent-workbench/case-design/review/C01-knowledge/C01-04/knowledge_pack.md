# C01-04 최서윤 · 브리핑 작성용 기반지식

**용도:** 작성자가 S1~S5 솔루션을 구성할 때 사용할 고객별 재료. 아래 솔루션 방향은 편집자의 작업 가설이며 완성 브리핑/매수 지시가 아니다.

고객 데이터 기준일: **2026-09-29** · 개별 매핑 대화 **3건** · 작성일 2026-09-21

[전체 고객 색인](<../README.md>) · [고객·대화 입력 JSON](<../../../../../C01_고객DATA_대화_원문매핑.json>) · [해당 고객 JSON](<../../../active/display-data/C01-04.json>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/active/display-data/C01-04.json)

입력 위치: `customers[3]` (`case_id=C01-04`). 대화 행 번호는 원본 `source_row_no`이며 고객 상담 발생 순서를 뜻하지 않는다.

**다른 GPT 세션에서 사용:** 이 파일 하나를 첨부하면 고객 DATA·매핑 대화 전체·선별 지식 원문을 함께 검토할 수 있다. 원문 Git 링크는 `41ae9a4` 커밋에 고정했다. 인용의 문장은 그대로이며 상대 이미지 경로만 이 파일 위치에 맞췄다. GitHub 접근 권한과 사내 게시글 로그인은 별도다.

## 1. S1 작성 재료 — 고객 데이터와 세그먼트

| 항목 | 입력 데이터 | 데이터 위치 |
|---|---|---|
| 고객 | 최서윤 · 47세 · 위험중립형 · 재직 | `/customer`, `/에이전트맥락데이터/고객계획` |
| 계좌 | 58,000,000원 · 표시 1년 수익률 -9.4% | `/irpAccount` |
| 납입 | 올해 당행 개인부담금 9,000,000원 · 타 연금계좌 0원 · 공제잔여 표시값 0원 | `/에이전트맥락데이터/납입및세제` |
| 재원 | 퇴직급여 0원 · 개인부담금 58,000,000원 | 같은 절의 재원 필드 |
| 디폴트옵션 | 등록 · 알파드림 · 미적용 | `/customer/defaultOption` |
| 연금개시 | 요건충족 표시값 False · 개시 False | `/에이전트맥락데이터/퇴직및인출` |

표시값과 대화·제도자료가 충돌하는 항목은 아래 검토사항에 남겼다. 표시값을 임의로 교정하지 않았다.

세그먼트 정의: [뱃지 카탈로그](<../../BADGE_CATALOG.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/review/BADGE_CATALOG.md). 뱃지는 현재 상태이며 그 자체가 자동 추천 결론은 아니다.

| 세그먼트 원문 | 사실 근거와 연결할 지식 |
|---|---|
| 판매중단 펀드 보유 | KB코리아밸류업 920만원·판매중단 표시는 시연 설정. 실제 중단 사유를 확인하고 유지/교체를 비교. |
| 수익률 부진 | 계좌 -9.4%, 해당 펀드 -38.7%. T-LOSS의 공감과 PM-11의 비교 논리를 연결. |

| 보유상품 원문 | 평가금액 | 비중 | 데이터상 플래그 |
|---|---:|---:|---|
| 현금성자산 | 3,000,000원 | 5.2% | 없음 |
| SBI저축은행 퇴직연금 정기예금 1년 | 18,000,000원 | 30.9% | 없음 |
| KB 코리아밸류업액티브 (주식) | 9,200,000원 | 15.9% | 판매중단 |
| 삼성 EMP 리얼리턴(UH) (주식혼합-재간접) | 15,300,000원 | 26.4% | 없음 |
| RISE KRX300 ETF | 12,500,000원 | 21.6% | 없음 |

### 대화에서 찾은 솔루션 재료

| 대화 행 | 읽을 내용 | 이번 자료에서의 취급 |
|---|---|---|
| [행 12](#dialogue-12) | 부진 상품과 손익 | 고객 DATA의 평가손익과 상품 자체 성과를 구분. |
| [행 82](#dialogue-82) | 손실 공감과 교체 반론 | 단정적 관리소홀 설명은 사실 확인 전 고객 문장에 사용하지 않음. |
| [행 162](#dialogue-162) | 매도·재추천 | 즉시 매도 결론으로 채택하지 않고 비교가설로 보존. |

### 먼저 확인할 불일치·미확인 사항

- 판매중단은 시연 플래그다. 실제 상품 판매중단·운용사 관리 소홀로 일반화할 근거는 없다.
- 12/15 메모에는 즉시 환매보다 비교 설명을 먼저 원하는 의향이 있다.
- 다른 자산군으로 바꾸는 것은 같은 역할의 우수상품 교체와 다르다. 기존 삼성EMP와 새 자산배분형의 중복도 확인한다.

## 2. 대략적인 솔루션 방향과 S2 근거

손실 경험과 기존 상담의 비교 선호를 먼저 존중한다. 보유 유지, 같은 국내주식 역할 안에서의 대체 검토, 위험을 낮추거나 자산배분으로 바꾸는 전략 변경을 구분해 자료를 제시한다. 판매중단만으로 손실을 확정하는 거래를 우선하지 않고 비교 결과를 읽을 시간을 둔다.

**구성 우선순위:** 공감·현재 의향 확인 → 상품 상태/손익 원인 → 유지·교체·전략 변경 비교 → 숙려와 재접점.

**고객에게 확인할 사항:**

- 기존 국내주식 역할은 유지하고 싶은가, 계좌 위험수준 자체를 낮추고 싶은가?
- 새 상품에서도 손실 가능성을 어느 정도 수용할 수 있는가?
- 환매 전 비교할 기간·지표와 다음 상담 시점은?

### 기존 브리핑에서 참고할 구성

- [B10-16](<../../../active/briefing-json/B10-16.json>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/active/briefing-json/B10-16.json): 같은 역할의 교체와 운용전략 변경을 구분하는 구성. 고객 사실·금액·고객 발언은 이 사례로 옮기지 않는다.

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

<a id="K-LOSS"></a>
### K-LOSS · 판매중단·성과부진 고객의 비교 상담 준비

근거: [SRC-002 · 연금고객 수익률 KPI 평가대상 고객관리 시나리오](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/01_고객관리_수익률관리/연금고객_수익률KPI_고객관리_시나리오.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/01_%EA%B3%A0%EA%B0%9D%EA%B4%80%EB%A6%AC_%EC%88%98%EC%9D%B5%EB%A5%A0%EA%B4%80%EB%A6%AC/%EC%97%B0%EA%B8%88%EA%B3%A0%EA%B0%9D_%EC%88%98%EC%9D%B5%EB%A5%A0KPI_%EA%B3%A0%EA%B0%9D%EA%B4%80%EB%A6%AC_%EC%8B%9C%EB%82%98%EB%A6%AC%EC%98%A4.md#L215-L229) · L215–229 · 자료 기준 Unknown

**이 고객에게 적용할 때:** 원문 시나리오의 대상과 준비사항이다. 시연 플래그를 실제 중단 사유로 확장하지 않고, 지금 보유 유지와 교체의 장단점을 비교한다.

<!-- source-excerpt {"key": "K-LOSS", "path": "knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/01_고객관리_수익률관리/연금고객_수익률KPI_고객관리_시나리오.md", "start": 215, "end": 229, "sha256": "c5daf1300aecd63b791a3d1694ca63b690cbe19367e861a7cfb988e2b4d36476"} -->
> ## [해피콜시] 성과부진(판매중단) 펀드 보유 고객
>
> **운용수익률 비교 상담 후, 전략펀드 또는 ETF 상품으로 리밸런싱 안내하기**
>
> 대상고객 보유상품목록에 성과부진(판매중단)펀드가 포함된 경우 조심스럽게 리밸런싱을 안내해 보세요.
>
> - 성과부진 사유로 판매중단까지 된 상품은 운용사의 관심도가 떨어져 향후에도 수익률 개선이 어려울 수 있습니다.
>
> > *\* 1페이지 성과부진펀드 목록 참고*
>
> #### ✅ 성공적인 상담 준비
>
> - 고객 수익률 및 보유상품현황 파악 ※ [04-12-642] 적립금 및 수익률 조회
> - 성과부진펀드 최근수익률 정보 조회 ※ KB-WiseNet > 연금(퇴직연금) > [자산관리]실적배당상품 > 펀드정보
> - 추천펀드 상품 및 수익률 정보 조회 ※ KB-WiseNet > 연금(퇴직연금) > [자산관리]실적배당상품 > 추천펀드/포트
<!-- /source-excerpt -->


## 3. S3 재료 — 운용전략과 상품 매핑

현재 자료만으로 같은 국내주식 역할의 “더 우수한” 대체상품을 확정할 수 없다. 아래 후보는 전략 변경을 선택할 때의 비교군이며 국내주식 펀드의 직접 대체 우열표가 아니다.

아래 상품은 고객별 **비교 후보 또는 유지할 설정**이다. 동시에 모두 매수하는 배분안이 아니다. `SRC-099`는 상품자료를 정리한 마스터로, 원 상품자료 S01~S05 파일은 이 작업에서 저장소 내 실물을 찾지 못했다. 마스터 레코드까지 대조했으며 원 상품자료 재검증·현재 판매가능 확인을 완료한 것으로 표시하지 않는다.

9월 예금금리는 2026-09-01~09-30 적용자료, 월간 펀드 성과는 2026-08-28, 판매목록 성과는 기준일 미기재다. 10월 이후 자금에 9월 금리를 약속하지 않는다. 고객별 손익과 상품 마스터의 관측성과를 섞지 않는다.

| 상품/자료 ID | 이 고객에게 연결하는 이유 | 선택 전 확인 |
|---|---|---|
| [MF-010 · KB 드림스타 자산배분 안정형 (혼합-재간접)](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md#MF-010>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#MF-010) | 자산배분형으로 역할을 변경할 때의 비교 후보. | 기존 삼성EMP와 자산배분/기초자산 중복, 비용과 환매일정 확인. |
| [FND-003 · 한국투자크레딧포커스ESG증권자투자신탁1호(채권)C-RE](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md#FND-003>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#FND-003) | 주식 위험을 줄이고 채권 운용을 선택할 때의 비교 후보. | 신용위험·금리위험이 있으며 원금보장 아님. 동일 국내주식 역할의 대체품 아님. |
| [DEP-002 · 농협은행 퇴직연금 정기예금](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md#DEP-002>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#DEP-002) | 원금손실을 더 이상 수용하지 않는 금액의 안정 운용 비교. | 기존 손실의 회복을 보장하지 않음. 환매 정산일과 예금 가입시점 확인. |

### 전략 적용 조건 원문

#### PM-11 · 이 고객에서의 적용

판매중단·부진·기존 역할·신규전략을 구분하며 유지 선택도 남긴다.

출처: [SRC-100 · PM-11](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MATCHING_KB.md#PM-11>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MATCHING_KB.md#L729-L788) · 해당 카드 L729–788. **자료 기반 기획 해석**이며 공식 업무규정과 구분한다.

> ### PM-11 · 수익률 부진 / 기존 펀드 교체 검토
>
> **적용할 때 보는 데이터:** 보유상품 정확한 클래스·보유기간·손익 / 같은 투자대상/전략의 비교성과 여부 / 전체 계좌에서 해당 자산의 역할·비중.
>
> **고객과 확인:** 부진 원인이 시장 전체인지 상품인지 알고 있는가? / 현재 자산군·위험수준을 유지하고 싶은가? / 상품 교체인지 운용전략 변경인지?
>
> **관리방향:** 손실 또는 단기 성과만으로 교체하지 않는다. 같은 역할의 비교인지 목표 자체를 바꿀 것인지 먼저 구분한 뒤 후보를 조회한다. 충분한 비교자료가 없으면 유지/추가 확인을 남긴다.
>
> | 추가로 확인된 조건 | 검토 상품군/방식 |
> |---|---|
> | 국내 크레딧 전략을 유지해 비교 | 동일 역할의 크레딧 펀드 |
> | 해외주식 노출 유지, 배당성장 목적 | 해당 목적의 주식형 펀드 |
> | 다자산으로 운용목적 변경 | 글로벌 자산배분 펀드 |

> **제외·유지·보류:** S05 성과는 기준일 미확인이므로 다른 자료와 수익률 순위를 만들지 않는다. 보유상품 정보 부족 상태에서는 위 후보를 더 우수한 대체상품이라고 부르지 않는다. 신규판매 중단이라는 사실만으로 즉시 환매하지 않는다.
>
> **S3에 쓸 수 있는 관리방향 문장(기획 예시):**
>
> > 낮은 수익률의 원인을 투자대상과 상품별 성과로 나눠 확인하고, 기존 운용목적을 유지할지부터 점검합니다. 교체가 필요하다면 같은 역할의 후보와 전략 변경 대안을 구분해 비교합니다.
>
> **후속 확인:** 수익률·위험·비용의 동일조건 비교가 되지 않으면 상품군 탐색까지만 하고 구체 교체 판단을 보류한다.
>
> **판단 근거:** E06:고객 질문 Case 1·3; K01:RS-10·RS-12; K02:CASE 11·12.  
> **기존 문서 연결:** RS-10, RS-12, CASE 11, CASE 12 (RS는 K01, CASE는 K02의 버전 기준).


### 상품 마스터 원문 레코드

후보의 구성·위험·가용성·출처를 생략하지 않도록 원문 레코드를 접어두었다. `runtime_verified: false` 상태도 보존한다.

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

<details><summary>FND-003 원문 레코드 · L6678–6757</summary>

[상품 원문](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#L6678-L6757)

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

</details>

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


## 4. S4 재료 — 영업화법 원문

공감 → 현재 상태 설명 → 앞으로의 선택 기준 → 손실확정 반론 → 숙려 흐름을 보존한다. 고객이 실제로 한 말은 상담메모이고 원문 예시의 대사는 가정이다.

아래 인용은 **저장소 MD의 해당 구간을 문장 수정 없이 발췌**했다. PDF/영상 자체를 다시 대조한 결과와 구분한다. 문서의 설명·예시 고객 반응은 실제 고객 발언이 아니다. 고객용 최종 화법은 작성자가 호칭·날짜·금액·상품 및 적용 조건을 맞춰 편집한다.

<a id="T-LOSS"></a>
### T-LOSS · 손실 공감 → 상품 상태 설명 → 교체 반론 → 숙려

근거: [SRC-002 · 연금고객 수익률 KPI 평가대상 고객관리 시나리오](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/01_고객관리_수익률관리/연금고객_수익률KPI_고객관리_시나리오.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/01_%EA%B3%A0%EA%B0%9D%EA%B4%80%EB%A6%AC_%EC%88%98%EC%9D%B5%EB%A5%A0%EA%B4%80%EB%A6%AC/%EC%97%B0%EA%B8%88%EA%B3%A0%EA%B0%9D_%EC%88%98%EC%9D%B5%EB%A5%A0KPI_%EA%B3%A0%EA%B0%9D%EA%B4%80%EB%A6%AC_%EC%8B%9C%EB%82%98%EB%A6%AC%EC%98%A4.md#L231-L255) · L231–255 · 자료 기준 Unknown

**이 고객에게 적용할 때:** 성과부진을 이유로 판매중단된 고객 시나리오다. 시연용 판매중단 플래그만으로 운용사 관리 소홀을 사실화하지 않는다. 수익 중인 고객에게 손실 공감 도입을 붙이지 않는다.

<!-- source-excerpt {"key": "T-LOSS", "path": "knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/01_고객관리_수익률관리/연금고객_수익률KPI_고객관리_시나리오.md", "start": 231, "end": 255, "sha256": "175cdd2397074cfccab83d12577aa8304007a4ba37d6cf7fb405d21480aa1822"} -->
> #### 상담 대화 (해피콜)
>
> **[행원]** 안녕하세요, KB국민은행 000지점 000팀장(팀원)입니다. 저희 국민은행에 가입하신 퇴직연금 관련해서 안내드릴 사항이 있어 전화드렸습니다! 잠시 통화 가능하세요?
>
> **[고객]** 네~ 무슨 일이시죠?
>
> **[행원]** 보유하신 DC/기업형IRP/개인형IRP 계좌에 00상품을 운용하시고 계신데 이 상품은 현재 성과가 좋지 않아 신규판매가 중단된 상품입니다. 아무래도 이런 경우 운용사의 관리가 소홀해 질 수 있어 향후 수익률 개선도 타상품 대비 어려울 수 있습니다.
>
> **[고객]** 그럼 어떻게 하나요?
>
> **[행원]** 많이 속상하시겠지만, 고객님 안정적인 퇴직연금 자산관리를 위해 최근 수익률 등을 비교해 보시고 상대적으로 성과가 우수한 상품으로 변경해 보시는 건 어떠신가요?
>
> **[고객]** 괜히 갈아탔다가 더 안좋아 지는거 아니예요?
>
> **[행원]** 갈아타신 상품의 수익률이 더 좋을거라고 말씀드리긴 어렵지만, 아무래도 자금유입이 가능한 상품이 펀드매니저가 포트폴리오를 통한 자산배분전략 운용 등에 원활하기 때문에 판매가 중단된 상품보다 운용 및 관리 측면에서 더 유리할 수 밖에 없습니다. 물론 현재 판매 중단된 상품도 향후 판매 재개가 가능할 수 있지만, 무작정 기다리시는 것 보다 좀 더 수익률 개선 여건이 좋은 상품으로 교체하여 운용하시는게 고객님의 자산관리에도 도움이 될 거라고 생각드려요.
>
> **[고객] ① 네, 갈아 타 볼게요.**
>
> **[행원]** 그러시면 통화종료 후에 고객님께 문자메시지로 퇴직연금 보유상품 변경 거래를 하실 수 있는 스타뱅킹 URL 링크를 보내드리겠습니다. 투자성향 분석 후 TDF나 추천펀드 메뉴를 검색하시고 고객님께 적합한 상품을 찾아 교체매매 해 보세요.
>
> > *\* [75-08-110] 개인고객용메시지발송시 발송콘텐츠: 마케팅(상품) > 노후은퇴 > 보유상품변경 안내 선택*
>
> **[고객] ② 생각 좀 해 볼게요.**
>
> **[행원]** 네, 생각하실 시간이 필요하실 거에요. 궁금한 점 있으시면 언제든지 연락 주시고, 인터넷뱅킹 또는 스타뱅킹을 통해서도 고객님의 상품정보나 추천펀드 정보를 찾아보실 수 있으니 참고해 주세요.
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
| `04-12-642` | 적립금및수익률조회 | 계좌/상품 평가손익과 비교 기준일 확인. | [SRC-027 L65](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L65) |
| `04-12-644` | 거래내역 조회 | 매수원금·추가입금·일부매도 등 손익 맥락 조회. | [SRC-027 L74](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L74) |
| `04-12-17A` | New퇴직연금상품조회 | 판매 상태·대체상품 세부 조건 확인. | [SRC-003 L803](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/02_마케팅_캠페인/개인형IRP_마케팅_보물지도_Vol1.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/02_%EB%A7%88%EC%BC%80%ED%8C%85_%EC%BA%A0%ED%8E%98%EC%9D%B8/%EA%B0%9C%EC%9D%B8%ED%98%95IRP_%EB%A7%88%EC%BC%80%ED%8C%85_%EB%B3%B4%EB%AC%BC%EC%A7%80%EB%8F%84_Vol1.md#L803) |
| `04-12-640` | 상품운용내역조회 | 기존 주문과 환매/매수 진행 확인. | [SRC-027 L68](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L68) |
| `06-12-611` | 보유상품변경 | 충분히 비교하고 동의한 교체만 접수. | [SRC-027 L67](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L67) |

화면번호는 저장소 자료와 대조한 업무 참조다. 사내 단말 접속·화면 실행은 하지 않았다. `04-12-179`(기존 화면안내)와 `04-12-17A`(New 화면 표기)는 각 출처의 표기를 유지한다.

### Hot Tip 원문과 고객별 활용

#### Hot Tip #203924 · IRP상품운용변경 다들 어떻게 하시나요?

[사내 게시글 원문](https://lxp.kbstar.com/app/board/hottip-my/view/203924.22BF37852DCF86D972481099E57E925D71298EDD0AE8C067C35C757116253E23) · [저장소 MD](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/posts/2025-11-13_203924_IRP상품운용변경 다들 어떻게 하시나요.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2025-11-13_203924_IRP%EC%83%81%ED%92%88%EC%9A%B4%EC%9A%A9%EB%B3%80%EA%B2%BD%20%EB%8B%A4%EB%93%A4%20%EC%96%B4%EB%96%BB%EA%B2%8C%20%ED%95%98%EC%8B%9C%EB%82%98%EC%9A%94.md) · 게시일 2025-11-13

**연결 이유:** 비대면 직접 변경과 전화 지원의 가능 범위를 구분. 펀드 환매를 예금 전화변경과 동일시하지 않는다.

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

#### Hot Tip #203923 · 《실전상담백서》 끝난 줄 알았던 상담, 이렇게 말하니 다시 시작됐어요!

[사내 게시글 원문](https://lxp.kbstar.com/app/board/hottip-my/view/203923.7559DB113988E52E12593258BE5C6CE3F4F6F829802E66664A333681E3E03E59) · [저장소 MD](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/posts/2025-11-13_203923_《실전상담백서》 끝난 줄 알았던 상담, 이렇게 말하니 다시 시작됐어요!.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2025-11-13_203923_%E3%80%8A%EC%8B%A4%EC%A0%84%EC%83%81%EB%8B%B4%EB%B0%B1%EC%84%9C%E3%80%8B%20%EB%81%9D%EB%82%9C%20%EC%A4%84%20%EC%95%8C%EC%95%98%EB%8D%98%20%EC%83%81%EB%8B%B4%2C%20%EC%9D%B4%EB%A0%87%EA%B2%8C%20%EB%A7%90%ED%95%98%EB%8B%88%20%EB%8B%A4%EC%8B%9C%20%EC%8B%9C%EC%9E%91%EB%90%90%EC%96%B4%EC%9A%94%21.md) · 게시일 2025-11-13

**연결 이유:** 지금 결정하지 않는 경우 다음 접점을 남기는 화법.

같은 원문 발췌: [T-THINK · 나중에 하겠다는 반응에 재접점 남기기](#T-THINK). 위 발췌와 적용 메모를 함께 사용한다.


Hot Tip 링크는 원문 MD에 기록된 주소 그대로다. 로그인 접근·현재 업무 유효성은 검증하지 않았다. 현장 경험담의 절차는 본부 화면자료와 대조하여 사용한다.

## 6. 출처 목록

| Source ID | 자료 | 성격·기준시점 |
|---|---|---|
| SRC-002 | [연금고객 수익률 KPI 평가대상 고객관리 시나리오](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/01_고객관리_수익률관리/연금고객_수익률KPI_고객관리_시나리오.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/01_%EA%B3%A0%EA%B0%9D%EA%B4%80%EB%A6%AC_%EC%88%98%EC%9D%B5%EB%A5%A0%EA%B4%80%EB%A6%AC/%EC%97%B0%EA%B8%88%EA%B3%A0%EA%B0%9D_%EC%88%98%EC%9D%B5%EB%A5%A0KPI_%EA%B3%A0%EA%B0%9D%EA%B4%80%EB%A6%AC_%EC%8B%9C%EB%82%98%EB%A6%AC%EC%98%A4.md) | Official / Internal Guide / Internal · Unknown |
| SRC-003 | [개인형IRP 마케팅 보물지도](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/02_마케팅_캠페인/개인형IRP_마케팅_보물지도_Vol1.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/02_%EB%A7%88%EC%BC%80%ED%8C%85_%EC%BA%A0%ED%8E%98%EC%9D%B8/%EA%B0%9C%EC%9D%B8%ED%98%95IRP_%EB%A7%88%EC%BC%80%ED%8C%85_%EB%B3%B4%EB%AC%BC%EC%A7%80%EB%8F%84_Vol1.md) | Official / Internal Guide / Internal · 2026-03 |
| SRC-019 | [연금 투자, 이거는 알고 하자](<../../../../../knowledge/corpus/02_스타런_퇴직연금_교육자료/02_투자교육/연금투자_기본원칙_이것은_알고_하자.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/02_%EC%8A%A4%ED%83%80%EB%9F%B0_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EA%B5%90%EC%9C%A1%EC%9E%90%EB%A3%8C/02_%ED%88%AC%EC%9E%90%EA%B5%90%EC%9C%A1/%EC%97%B0%EA%B8%88%ED%88%AC%EC%9E%90_%EA%B8%B0%EB%B3%B8%EC%9B%90%EC%B9%99_%EC%9D%B4%EA%B2%83%EC%9D%80_%EC%95%8C%EA%B3%A0_%ED%95%98%EC%9E%90.md) | Training Material / Internal · Unknown |
| SRC-027 | [퇴직연금 주요거래 화면번호 안내](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md) | Reference / Internal · Unknown |
| SRC-068 | [《실전상담백서》 끝난 줄 알았던 상담, 이렇게 말하니 다시 시작됐어요!](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/posts/2025-11-13_203923_《실전상담백서》 끝난 줄 알았던 상담, 이렇게 말하니 다시 시작됐어요!.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2025-11-13_203923_%E3%80%8A%EC%8B%A4%EC%A0%84%EC%83%81%EB%8B%B4%EB%B0%B1%EC%84%9C%E3%80%8B%20%EB%81%9D%EB%82%9C%20%EC%A4%84%20%EC%95%8C%EC%95%98%EB%8D%98%20%EC%83%81%EB%8B%B4%2C%20%EC%9D%B4%EB%A0%87%EA%B2%8C%20%EB%A7%90%ED%95%98%EB%8B%88%20%EB%8B%A4%EC%8B%9C%20%EC%8B%9C%EC%9E%91%EB%90%90%EC%96%B4%EC%9A%94%21.md) | Field Know-how / Experiential · 2025-11-13 |
| SRC-069 | [IRP상품운용변경 다들 어떻게 하시나요?](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/posts/2025-11-13_203924_IRP상품운용변경 다들 어떻게 하시나요.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2025-11-13_203924_IRP%EC%83%81%ED%92%88%EC%9A%B4%EC%9A%A9%EB%B3%80%EA%B2%BD%20%EB%8B%A4%EB%93%A4%20%EC%96%B4%EB%96%BB%EA%B2%8C%20%ED%95%98%EC%8B%9C%EB%82%98%EC%9A%94.md) | Field Know-how / Experiential · 2025-11-13 |
| SRC-099 | [PRODUCT_MASTER — 개인형IRP 브리핑용 상품 마스터](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md) | Product Data / Internal · 2026-09-10 (금리 2026-09 적용, 추천펀드 성과 2026-08-28 기준, 판매목록 기준일 미기재) |
| SRC-100 | [PRODUCT_MATCHING_KB — 고객상황 → 상품 후보 매핑](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MATCHING_KB.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MATCHING_KB.md) | Product Data / Internal · 2026-09-10 (수치는 SRC-099 마스터의 읽기용 요약) |

## 7. 고객 데이터·대화 원문 부록

<details><summary>대화 자료의 고객 인덱스 원문 — 열 의미를 임의 추정하지 않음</summary>

```json
{
  "raw_row": "최서윤 165932-8741205 47 위험중립형 – 있음 0 설정 1 dor, hlt",
  "name": "최서윤",
  "customer_id": "165932-8741205",
  "age": 47,
  "investment_profile": "위험중립형",
  "isa_maturity_flag_raw": "–",
  "unlabeled_source_column_6": "있음",
  "tax_deduction_remaining_raw": "0",
  "default_option_status_raw": "설정",
  "unlabeled_source_column_9": 1,
  "target_code_text_raw": "dor, hlt",
  "target_codes": [
    "dor",
    "hlt"
  ]
}
```

</details>

<details><summary>고객 DATA 전체 — 입력 JSON의 display_data 그대로</summary>

```json
{
  "schemaVersion": "customer-briefing-display.v0.1",
  "briefingMeta": {
    "caseId": "C01-04",
    "dataType": "시연용가상고객",
    "asOfDate": "2026-09-29",
    "generatedAt": "2026-09-29T07:00:00+09:00",
    "currency": "KRW"
  },
  "customer": {
    "customerId": "165932-8741205",
    "name": "최서윤",
    "age": 47,
    "gender": "여",
    "starClubGrade": "패밀리",
    "investmentProfile": "위험중립형",
    "irpOpenedAt": "2019-09-09",
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
      "label": "판매중단 펀드 보유",
      "source": "동료 IRP Agent 시연 데이터(9 Cases v3)"
    },
    {
      "label": "수익률 부진",
      "source": "동료 IRP Agent 시연 데이터(9 Cases v3)"
    }
  ],
  "irpAccount": {
    "valuationAmountKrw": 58000000,
    "assetAllocation": [
      {
        "assetType": "원리금보장형",
        "amountKrw": 18000000,
        "weightPct": 30.9
      },
      {
        "assetType": "실적배당형",
        "amountKrw": 37000000,
        "weightPct": 63.9
      },
      {
        "assetType": "현금성자산",
        "amountKrw": 3000000,
        "weightPct": 5.2
      }
    ],
    "oneYearReturnPct": -9.4,
    "taxDeductionRemainingKrw": 0,
    "latestProductOpening": {
      "holdingId": "H002",
      "productId": "SAV-009",
      "productName": "SBI저축은행 퇴직연금 정기예금 1년",
      "openedAt": "2026-03-15",
      "amountKrw": 18000000
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
      "valuationAmountKrw": 3000000,
      "weightPct": 5.2,
      "oneYearReturnPct": null,
      "openedAt": "2019-09-09",
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
      "valuationAmountKrw": 18000000,
      "weightPct": 30.9,
      "oneYearReturnPct": 3.1,
      "openedAt": "2026-03-15",
      "allocationBreakdown": null,
      "flags": []
    },
    {
      "holdingId": "H003",
      "productId": "MF-012",
      "productName": "KB 코리아밸류업액티브 (주식)",
      "assetType": "실적배당형",
      "productCategory": "주식형펀드",
      "contractTerm": null,
      "valuationAmountKrw": 9200000,
      "weightPct": 15.9,
      "oneYearReturnPct": -38.7,
      "openedAt": "2021-11-08",
      "allocationBreakdown": null,
      "flags": [
        "판매중단"
      ]
    },
    {
      "holdingId": "H004",
      "productId": "MF-009",
      "productName": "삼성 EMP 리얼리턴(UH) (주식혼합-재간접)",
      "assetType": "실적배당형",
      "productCategory": "혼합형펀드",
      "contractTerm": null,
      "valuationAmountKrw": 15300000,
      "weightPct": 26.4,
      "oneYearReturnPct": 9.3,
      "openedAt": "2024-06-04",
      "allocationBreakdown": null,
      "flags": []
    },
    {
      "holdingId": "H005",
      "productId": null,
      "productName": "RISE KRX300 ETF",
      "assetType": "실적배당형",
      "productCategory": "ETF",
      "contractTerm": null,
      "valuationAmountKrw": 12500000,
      "weightPct": 21.6,
      "oneYearReturnPct": 25,
      "openedAt": "2025-08-18",
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
      "개인부담금재원금액원": 58000000
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
      "최근운용지시일": "2026-01-15",
      "최근상품매매일": "2026-01-15",
      "최근입금일": "2026-01-10",
      "최근1년상품매매횟수": 2
    },
    "퇴직및인출": {
      "연금수령요건충족여부": false,
      "연금개시여부": false,
      "연금지급설계등록여부": false
    },
    "최근사건": [
      {
        "이벤트식별자": "T001",
        "발생일시": "2027-03-15T00:00:00+09:00",
        "이벤트유형": "상품만기예정",
        "계좌구분": "IRP",
        "관련보유상품식별자": "H002",
        "금액원": 18000000,
        "처리상태": "예정",
        "채널": null
      }
    ],
    "금융거래": [],
    "상담이력": [
      {
        "상담식별자": "CRM001",
        "상담일시": "2025-12-15T00:00:00+09:00",
        "상담채널": null,
        "상담유형": "퇴직연금사후관리",
        "상담메모": "보유 펀드 손실에 대한 불만을 표명. 추가 손실 우려로 즉시 매도보다는 상품 상태와 대안을 먼저 비교해달라고 요청."
      }
    ],
    "외부계좌": [],
    "투자성향이력": [
      {
        "이력식별자": "R001",
        "분석일": "2026-04-07",
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
    "상품진단": [
      {
        "진단구분": "관리플래그",
        "관련보유상품식별자": "H003",
        "플래그": "판매중단",
        "보유수익률": -38.7,
        "데이터성격": "동료 Agent 시연 데이터의 가상 판매상태. 실제 금융상품 판매상태가 아님"
      },
      {
        "진단구분": "성과비교",
        "관련보유상품식별자": null,
        "비교유형": "동연령대평균",
        "보유계좌수익률": -9.4,
        "동연령대평균수익률": 6.8,
        "성과차이퍼센트포인트": -16.2
      }
    ],
    "계산지표": [
      {
        "지표식별자": "M001",
        "지표유형": "파생값",
        "지표명": "현금성자산비중",
        "대상참조": null,
        "값": 5.2,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M002",
        "지표유형": "파생값",
        "지표명": "원리금보장·현금성자산합산비중",
        "대상참조": null,
        "값": 36.2,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M003",
        "지표유형": "파생값",
        "지표명": "위험자산(실적배당형)비중",
        "대상참조": null,
        "값": 63.8,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M004",
        "지표유형": "파생값",
        "지표명": "동연령대평균수익률",
        "대상참조": null,
        "값": 6.8,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M005",
        "지표유형": "파생값",
        "지표명": "동연령대상위1%평균수익률",
        "대상참조": null,
        "값": 22.4,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M006",
        "지표유형": "파생값",
        "지표명": "동연령대상위1%평균원리금보장비중",
        "대상참조": null,
        "값": 26,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M007",
        "지표유형": "기간",
        "지표명": "최근 운용변경 후 경과개월수",
        "대상참조": null,
        "값": 8.4,
        "단위": "개월",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M008",
        "지표유형": "기간",
        "지표명": "최근 상담 후 경과일수(장기 미접촉)",
        "대상참조": null,
        "값": 288,
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

<a id="dialogue-12"></a>
<details><summary>행 12 · 판매중단된 펀드 뭐 들고 있고 지금 손실이 얼마나 나 있어?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 최서윤` · 선행/후속 원문: `None`

**질문 원문**

> 판매중단된 펀드 뭐 들고 있고 지금 손실이 얼마나 나 있어?

**답변 원문**

> 판매중단된 상품으로는 KB 코리아밸류업액티브 (주식)를 보유하고 있고, 해당 상품의 수익률은 -38.7%예요. 전체 운용수익률은 -9.4%를 기록하고 있어요.

</details>

<a id="dialogue-82"></a>
<details><summary>행 82 · 고객이 '손실 난 걸 지금 팔라는 거냐'고 하면 뭐라고 하지?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 최서윤` · 선행/후속 원문: `None`

**질문 원문**

> 고객이 '손실 난 걸 지금 팔라는 거냐'고 하면 뭐라고 하지?

**답변 원문**

> 성과저조나 판매중단 펀드를 보유한 고객이 손실 중인 상태에서 교체를 망설일 때는 고객의 속상한 심정을 먼저 인정하는 공감의 자세로 접근해야 해요. 보유하신 계좌의 해당 상품이 현재 성과가 좋지 않고 신규 판매가 중단된 상태라는 점을 설명하면서, 이런 경우 운용사의 관리가 소홀해질 수 있어 향후 수익률 개선이 상대적으로 어려울 수 있다는 점을 짚어주는 것이 중요해요. 다만 갈아탄 상품이 더 좋을 것이라고 수익을 확정적으로 약속해서는 안 되며, 예측이 아니라 운용 여건의 차이를 근거로 설명해야 해요. 고객에게 안내할 때는 "많이 속상하시겠지만, 고객님 안정적인 퇴직연금 자산관리를 위해 최근 수익률 등을 비교해 보시고 상대적으로 성과가 우수한 상품으로 변경해 보시는 건 어떠신가요?"라고 말씀해 보세요.

</details>

<a id="dialogue-162"></a>
<details><summary>행 162 · 판매중단된 펀드 뭐 들고 있어?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 최서윤` · 선행/후속 원문: `None`

**질문 원문**

> 판매중단된 펀드 뭐 들고 있어?

**답변 원문**

> 최서윤 고객이 보유하고 있는 판매중단 상품은 KB 코리아밸류업액티브(주식)이다. 해당 상품은 920만원 규모로 보유 중이며 수익률은 -38.7%를 기록하고 있다. 판매중단 상품을 보유하고 있어 관리 공백이 우려되는 상황이므로, 보유 포트폴리오를 점검하고 매도 및 재추천 등의 액션을 안내하는 방향으로 접근해야 한다.

</details>


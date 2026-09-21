# C01-06 한지우 · 브리핑 작성용 기반지식

**용도:** 작성자가 S1~S5 솔루션을 구성할 때 사용할 고객별 재료. 아래 솔루션 방향은 편집자의 작업 가설이며 완성 브리핑/매수 지시가 아니다.

고객 데이터 기준일: **2026-09-29** · 개별 매핑 대화 **7건** · 작성일 2026-09-21

[전체 고객 색인](<../README.md>) · [고객·대화 입력 JSON](<../../../../../C01_고객DATA_대화_원문매핑.json>) · [해당 고객 JSON](<../../../active/display-data/C01-06.json>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/active/display-data/C01-06.json)

입력 위치: `customers[5]` (`case_id=C01-06`). 대화 행 번호는 원본 `source_row_no`이며 고객 상담 발생 순서를 뜻하지 않는다.

**다른 GPT 세션에서 사용:** 이 파일 하나를 첨부하면 고객 DATA·매핑 대화 전체·선별 지식 원문을 함께 검토할 수 있다. 원문 Git 링크는 `41ae9a4` 커밋에 고정했다. 인용의 문장은 그대로이며 상대 이미지 경로만 이 파일 위치에 맞췄다. GitHub 접근 권한과 사내 게시글 로그인은 별도다.

## 1. S1 작성 재료 — 고객 데이터와 세그먼트

| 항목 | 입력 데이터 | 데이터 위치 |
|---|---|---|
| 고객 | 한지우 · 57세 · 적극투자형 · 재직 | `/customer`, `/에이전트맥락데이터/고객계획` |
| 계좌 | 210,000,000원 · 표시 1년 수익률 21.6% | `/irpAccount` |
| 납입 | 올해 당행 개인부담금 3,500,000원 · 타 연금계좌 2,500,000원 · 공제잔여 표시값 3,000,000원 | `/에이전트맥락데이터/납입및세제` |
| 재원 | 퇴직급여 0원 · 개인부담금 210,000,000원 | 같은 절의 재원 필드 |
| 디폴트옵션 | 등록 · 알파드림 · 미적용 | `/customer/defaultOption` |
| 연금개시 | 요건충족 표시값 False · 개시 False | `/에이전트맥락데이터/퇴직및인출` |

표시값과 대화·제도자료가 충돌하는 항목은 아래 검토사항에 남겼다. 표시값을 임의로 교정하지 않았다.

세그먼트 정의: [뱃지 카탈로그](<../../BADGE_CATALOG.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/review/BADGE_CATALOG.md). 뱃지는 현재 상태이며 그 자체가 자동 추천 결론은 아니다.

| 세그먼트 원문 | 사실 근거와 연결할 지식 |
|---|---|
| ISA 전환기한 D-36 | 타행 ISA 8,000만원, 9/5 만기·11/4 기한. K-ISA·K-TAX로 전환 가능금액과 사용계획을 확인. |
| 투자성향-DO불일치 | 적극투자형-알파드림 저위험 지정 차이. 기존 기술·미국 주식 노출과 미래 기본 설정을 별개로 확인. |

| 보유상품 원문 | 평가금액 | 비중 | 데이터상 플래그 |
|---|---:|---:|---|
| 현금성자산 | 5,000,000원 | 2.4% | 없음 |
| 기업은행 퇴직연금 정기예금 1년 | 40,500,000원 | 19.3% | 없음 |
| KB라이프생명 퇴직연금 디폴트옵션 이율보증형보험(3년) | 30,200,000원 | 14.4% | 없음 |
| 피델리티 글로벌 테크놀로지 (주식-재간접) | 79,000,000원 | 37.6% | 없음 |
| RISE 미국S&P500 ETF | 55,300,000원 | 26.3% | 없음 |

### 대화에서 찾은 솔루션 재료

| 대화 행 | 읽을 내용 | 이번 자료에서의 취급 |
|---|---|---|
| [행 10](#dialogue-10) | ISA 금액과 기한 | 전환 문의는 동의가 아니므로 사용계획부터 확인. |
| [행 51](#dialogue-51) | 세제효과 계산 | 대화가 확정한 소득구간은 DATA에 없음. |
| [행 53](#dialogue-53) | 다른 소득구간 가정 | 별도 가정 분기이며 고객정보 갱신이 아님. |
| [행 64](#dialogue-64) | ISA 입금 화면 | 01-12-213의 거래구분과 입금 후 운용을 연결. |

### 먼저 확인할 불일치·미확인 사항

- 총급여가 고객 DATA에 없다. 행 51/52와 53/54의 세율 차이를 고객의 확정 소득으로 통합하지 않는다.
- 당행 납입 350만원+타계좌 250만원, 일반 공제잔여 300만원과 ISA 추가 공제대상금액은 별개다.
- 현재 KB라이프 DO GIC 보유와 현재 지정 알파드림의 미적용 상태를 같은 것으로 치환하지 않는다.
- ISA 전환 문의·7/31 상담기록만 있으며 8,000만원 전액 전환 합의는 없다.

## 2. 대략적인 솔루션 방향과 S2 근거

11/4까지라는 데이터상 기한을 중심으로 ISA 만기자금의 사용계획과 전환 의향을 확인한다. 사용할 돈을 남기고 전환 범위를 정한 뒤, 일반 공제와 ISA 추가 공제대상금액을 나누어 설명한다. 유입자금 운용은 이미 큰 기술주·미국주식 노출을 고려해 안정 부분 또는 다른 역할을 비교하는 방향이다.

**구성 우선순위:** 기한/가능금액 조회 → 사용계획·부분 전환 → 소득/공제정보 확인 → 입금 → 운용상품 선택.

**고객에게 확인할 사항:**

- 8,000만원 중 가까운 시기에 쓸 금액과 노후자금으로 둘 금액은?
- 전환할 의사가 있는가, 어느 금액까지 가능한가?
- 소득·결정세액 및 다른 연금계좌의 최종 납입내역은?

### 기존 브리핑에서 참고할 구성

- [B01-03](<../../../active/briefing-json/B01-03.json>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/active/briefing-json/B01-03.json): ISA 전환금액과 기존 보유 운용의 목적을 나누는 구성. 고객 사실·금액·고객 발언은 이 사례로 옮기지 않는다.
- [B02-18](<../../../active/briefing-json/B02-18.json>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/active/briefing-json/B02-18.json): 현재 보유/지정/실행의 구분. 고객 사실·금액·고객 발언은 이 사례로 옮기지 않는다.

### 판단 논리를 보존한 기반지식

<a id="K-ISA"></a>
### K-ISA · ISA 전환 대상·기한 확인과 두 가지 혜택의 설명

근거: [SRC-003 · 개인형IRP 마케팅 보물지도](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/02_마케팅_캠페인/개인형IRP_마케팅_보물지도_Vol1.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/02_%EB%A7%88%EC%BC%80%ED%8C%85_%EC%BA%A0%ED%8E%98%EC%9D%B8/%EA%B0%9C%EC%9D%B8%ED%98%95IRP_%EB%A7%88%EC%BC%80%ED%8C%85_%EB%B3%B4%EB%AC%BC%EC%A7%80%EB%8F%84_Vol1.md#L491-L508) · L491–508 · 자료 기준 2026-03

**이 고객에게 적용할 때:** 2026.03 내부 가이드. 전부/일부 전환, 자금 사용계획, 추가 공제와 과세이연 설명을 함께 보존한다. 원문의 단정 표현·환급·건강보험료 문구는 개인별 사실로 확정하지 않는다.

<!-- source-excerpt {"key": "K-ISA", "path": "knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/02_마케팅_캠페인/개인형IRP_마케팅_보물지도_Vol1.md", "start": 491, "end": 508, "sha256": "4edd6b7ec917abe339a4905e29b5670062f2579f2db16cd309b0d76b23164a06"} -->
> ### CASE ① ISA 만기 자금 IRP로 전환하기
>
> **ACTION — ISA 만기여부 확인하기** : ISA 만기일 60일 이내 IRP로 입금 (전부 또는 일부 선택 가능)
>
> - **방법1**: **[04-10-099]** 세금우대관련조회
>   - 조회종류 : 1. 저축종류별 세금우대내역조회
>   - 저축종류 : 83-만기 ISA 전환
> - **방법2**: **[경영정보시스템]** 수신만기도래계좌명세
>   - 조회구분 : 과목조회
>   - 과목코드 : 099
>
> **SCRIPT**
>
> **[행원]** 고객님, ISA 드디어 만기가 되셨네요. 축하드립니다. 이 목돈 어떻게 사용하실 예정이세요? 당장 사용하실 일이 없으시다면, IRP가 답이예요. 세금도 아끼고 노후도 준비하는 IRP에 넣어두세요. 지금이 골든타임이예요! 넣을 수 있을 때 넣으세요!
>
> **[행원]** ISA 만기자금을 IRP에 입금하면 두 가지 혜택이 있어요. 첫 번째는 세액공제 한도가 늘어나요. 원래 IRP로 연말정산 세액공제 한도가 연 900만원이잖아요, ISA 만기 자금을 넣으시면 전환 금액의 10%(최대 300만원)까지 추가로 공제 한도가 늘어나요. 결과적으로 올해 연말정산 때 최대 1,200만원에 대한 세금을 돌려받으실 수 있어요.
>
> **[행원]** 두 번째는 세금 걱정 없이 관리할 수 있어요. 원래 IRP는 연간 1,800만원까지만 넣을 수 있지만, ISA 만기 자금은 제한 없이 전액 다 넣으실 수 있거든요. 물론 고객님 상황에 맞춰 일부만 넣으셔도 되고요. ISA처럼 IRP도 운용하는 동안 이자에 대해 세금 떼지 않고 세금까지 원금에 합쳐서 통째로 굴릴 수 있어요. 원금이 커지면 재투자되는 이자 단위 자체가 달라지기 때문에 복리효과 진짜 '넘사벽'입니다. 또한 운용 중에 수익이 수천만 원이 나도 당장 고객님의 종합소득에 합산되지 않으니, 건강보험료 오를 걱정도 없어요.
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

전환 동의와 금액이 먼저다. 아래 후보는 기존 기술주·S&P500에 같은 노출을 더하는 대신 다른 역할을 비교할 재료이며 ISA 입금만으로 자동 매수되는 것은 아니다.

아래 상품은 고객별 **비교 후보 또는 유지할 설정**이다. 동시에 모두 매수하는 배분안이 아니다. `SRC-099`는 상품자료를 정리한 마스터로, 원 상품자료 S01~S05 파일은 이 작업에서 저장소 내 실물을 찾지 못했다. 마스터 레코드까지 대조했으며 원 상품자료 재검증·현재 판매가능 확인을 완료한 것으로 표시하지 않는다.

9월 예금금리는 2026-09-01~09-30 적용자료, 월간 펀드 성과는 2026-08-28, 판매목록 성과는 기준일 미기재다. 10월 이후 자금에 9월 금리를 약속하지 않는다. 고객별 손익과 상품 마스터의 관측성과를 섞지 않는다.

| 상품/자료 ID | 이 고객에게 연결하는 이유 | 선택 전 확인 |
|---|---|---|
| [DEP-002 · 농협은행 퇴직연금 정기예금](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md#DEP-002>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#DEP-002) | 전환 후 안정 운용할 부분의 예금 비교. | IRP 안에 넣을 수 있는 장기자금인지 먼저 확인. 외부 지출 예정금액은 전환과 구분. |
| [MF-010 · KB 드림스타 자산배분 안정형 (혼합-재간접)](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md#MF-010>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#MF-010) | 기존 기술주 중심 노출을 보완할 자산배분 방식 비교. | 구성 중복·비용·변동성 확인. 안정형도 손실 가능. |
| [DO-006 · 불려드림II](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md#DO-006>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#DO-006) | 향후 기본 설정 변경을 원할 경우 중위험 구조 비교. | 기존 보유 GIC를 매도해야 지정이 바뀐다고 단정하지 않음. |

### 전략 적용 조건 원문

#### PM-01 · 이 고객에서의 적용

ISA 유입 뒤 의도치 않은 현금 대기를 줄이는 관점에서만 사용한다.

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

#### PM-05 · 이 고객에서의 적용

새 상품 수가 아니라 실제 자산/지역 노출 변화로 분산 여부를 판단한다.

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

T-ISA의 사용계획 질문과 혜택 설명 순서를 보존한다. 8,000만원 전환·확정 환급액·전액 장기투자를 고객이 이미 결정한 것처럼 바꾸지 않는다.

아래 인용은 **저장소 MD의 해당 구간을 문장 수정 없이 발췌**했다. PDF/영상 자체를 다시 대조한 결과와 구분한다. 문서의 설명·예시 고객 반응은 실제 고객 발언이 아니다. 고객용 최종 화법은 작성자가 호칭·날짜·금액·상품 및 적용 조건을 맞춰 편집한다.

<a id="T-ISA"></a>
### T-ISA · ISA 사용계획 질문과 두 가지 혜택의 원문 화법

근거: [SRC-003 · 개인형IRP 마케팅 보물지도](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/02_마케팅_캠페인/개인형IRP_마케팅_보물지도_Vol1.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/02_%EB%A7%88%EC%BC%80%ED%8C%85_%EC%BA%A0%ED%8E%98%EC%9D%B8/%EA%B0%9C%EC%9D%B8%ED%98%95IRP_%EB%A7%88%EC%BC%80%ED%8C%85_%EB%B3%B4%EB%AC%BC%EC%A7%80%EB%8F%84_Vol1.md#L504-L508) · L504–508 · 자료 기준 2026-03

**이 고객에게 적용할 때:** ISA 만기 전/후 문장, 호칭·금액을 고객 사실에 맞춰 바꾼다. 원문 순서와 과세이연 설명을 유지하되 고객의 전환 동의·소득구간·확정 환급액을 추가하지 않는다.

<!-- source-excerpt {"key": "T-ISA", "path": "knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/02_마케팅_캠페인/개인형IRP_마케팅_보물지도_Vol1.md", "start": 504, "end": 508, "sha256": "8cd1f28def3c07154dd0e365abf3e006ef0371eebbac04cbc3803402dffe31a1"} -->
> **[행원]** 고객님, ISA 드디어 만기가 되셨네요. 축하드립니다. 이 목돈 어떻게 사용하실 예정이세요? 당장 사용하실 일이 없으시다면, IRP가 답이예요. 세금도 아끼고 노후도 준비하는 IRP에 넣어두세요. 지금이 골든타임이예요! 넣을 수 있을 때 넣으세요!
>
> **[행원]** ISA 만기자금을 IRP에 입금하면 두 가지 혜택이 있어요. 첫 번째는 세액공제 한도가 늘어나요. 원래 IRP로 연말정산 세액공제 한도가 연 900만원이잖아요, ISA 만기 자금을 넣으시면 전환 금액의 10%(최대 300만원)까지 추가로 공제 한도가 늘어나요. 결과적으로 올해 연말정산 때 최대 1,200만원에 대한 세금을 돌려받으실 수 있어요.
>
> **[행원]** 두 번째는 세금 걱정 없이 관리할 수 있어요. 원래 IRP는 연간 1,800만원까지만 넣을 수 있지만, ISA 만기 자금은 제한 없이 전액 다 넣으실 수 있거든요. 물론 고객님 상황에 맞춰 일부만 넣으셔도 되고요. ISA처럼 IRP도 운용하는 동안 이자에 대해 세금 떼지 않고 세금까지 원금에 합쳐서 통째로 굴릴 수 있어요. 원금이 커지면 재투자되는 이자 단위 자체가 달라지기 때문에 복리효과 진짜 '넘사벽'입니다. 또한 운용 중에 수익이 수천만 원이 나도 당장 고객님의 종합소득에 합산되지 않으니, 건강보험료 오를 걱정도 없어요.
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
| `04-10-099` | 세금우대관련조회 | ISA 만기 전환 가능 내역·잔여 가능금액 확인. | [SRC-003 L495](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/02_마케팅_캠페인/개인형IRP_마케팅_보물지도_Vol1.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/02_%EB%A7%88%EC%BC%80%ED%8C%85_%EC%BA%A0%ED%8E%98%EC%9D%B8/%EA%B0%9C%EC%9D%B8%ED%98%95IRP_%EB%A7%88%EC%BC%80%ED%8C%85_%EB%B3%B4%EB%AC%BC%EC%A7%80%EB%8F%84_Vol1.md#L495) |
| `04-12-644` | 거래내역 조회 | 당행 납입 이력과 실제 입금 확인; 타계좌 자료는 별도 대조. | [SRC-027 L74](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L74) |
| `01-12-213` | 입금/입금예약 | 고객 동의 후 ISA 만기자금 입금 거래구분 선택. | [SRC-027 L42](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L42) |
| `04-12-17A` | New퇴직연금상품조회 | 전환 후 운용할 상품의 현재 조건 조회. | [SRC-003 L803](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/02_마케팅_캠페인/개인형IRP_마케팅_보물지도_Vol1.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/02_%EB%A7%88%EC%BC%80%ED%8C%85_%EC%BA%A0%ED%8E%98%EC%9D%B8/%EA%B0%9C%EC%9D%B8%ED%98%95IRP_%EB%A7%88%EC%BC%80%ED%8C%85_%EB%B3%B4%EB%AC%BC%EC%A7%80%EB%8F%84_Vol1.md#L803) |
| `06-12-610` | 입금예정상품 등록/변경 | 입금예정 운용 또는 향후 DO 설정 확인. | [SRC-027 L66](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L66) |
| `06-12-611` | 보유상품변경 | 입금된 자금의 실제 운용 변경. | [SRC-027 L67](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L67) |
| `04-12-640` | 상품운용내역조회 | 입금 후 매수/운용 지시 실행 여부 확인. | [SRC-027 L68](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L68) |

화면번호는 저장소 자료와 대조한 업무 참조다. 사내 단말 접속·화면 실행은 하지 않았다. `04-12-179`(기존 화면안내)와 `04-12-17A`(New 화면 표기)는 각 출처의 표기를 유지한다.

### Hot Tip 원문과 고객별 활용

#### Hot Tip #204287 · [ ISA 만기 자금 개인형IRP 전환 마케팅 ]

[사내 게시글 원문](https://lxp.kbstar.com/app/board/hottip-my/view/204287.10A23D02D0E43DEA0A6FB41B9007AC2FB40B42A524DD2EDED36CDD0DCCA9504B) · [저장소 MD](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/posts/2026-01-31_204287_[ ISA 만기 자금 개인형IRP 전환 마케팅 ].md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2026-01-31_204287_%5B%20ISA%20%EB%A7%8C%EA%B8%B0%20%EC%9E%90%EA%B8%88%20%EA%B0%9C%EC%9D%B8%ED%98%95IRP%20%EC%A0%84%ED%99%98%20%EB%A7%88%EC%BC%80%ED%8C%85%20%5D.md) · 게시일 2026-01-31

**연결 이유:** ISA 전환의 입금 거래·타행 확인·유입 후 운용 안내를 함께 연결.

<a id="H-ISA-A"></a>
#### H-ISA-A · ISA 만기자금 입금 요건과 01-12-213 거래구분

근거: [SRC-072 · [ ISA 만기 자금 개인형IRP 전환 마케팅 ]](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/posts/2026-01-31_204287_[ ISA 만기 자금 개인형IRP 전환 마케팅 ].md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2026-01-31_204287_%5B%20ISA%20%EB%A7%8C%EA%B8%B0%20%EC%9E%90%EA%B8%88%20%EA%B0%9C%EC%9D%B8%ED%98%95IRP%20%EC%A0%84%ED%99%98%20%EB%A7%88%EC%BC%80%ED%8C%85%20%5D.md#L27-L60) · L27–60 · 자료 기준 2026-01-31

**이 고객에게 적용할 때:** Hot Tip의 세액공제 표현은 공제대상금액과 실제 세액을 구분하여 SRC-003/SRC-087과 함께 읽는다. 입금 완료는 상품 매수 완료와 별개다.

<!-- source-excerpt {"key": "H-ISA-A", "path": "knowledge/corpus/03_스타런_영업점_Hottip/posts/2026-01-31_204287_[ ISA 만기 자금 개인형IRP 전환 마케팅 ].md", "start": 27, "end": 60, "sha256": "aa42b474e8033cdbc912c4dea4991f7ff63ad6de83f141a22d6204c7d4485280"} -->
> ● **「만기 ISA의 연금계좌로 전환입금」이란?**
>
> ==**ISA 계좌 만기일로부터 **====**<u>60일 이내</u>**====**에 **====**<u>만기자금의 전부 또는 일부 금액</u>**====**을 연금계좌로 추가 납입 허용 및 세액공제 혜택 제공**==
>
> ※ 타행 ISA 만기자금 해지 후 당행으로 입금시 증빙서류 불필요(전산확인 가능)
>
> ● **입금 횟수** : 횟수 제한 없음(추가 가입한 ISA계좌의 만기자금도 동일하게 전환 입금 가능)
>
> ● **입금 대상**
>
> - 계약이 만료된 **<u>당행 또는 타행 ISA계좌</u>**(계약체결일로부터 3년 경과 계좌 포함)의 만기자금
>
> ● **입금 가능 금액**
>
> - 연간 납입한도 1,800만원(연금저축, DC, IRP 포함) 내 개인부담금 + **ISA 만기자금(만기일로부터 60일 이내)**
>
> ● **입금액에 대한 세액공제 혜택**
>
> - ==**ISA 만기자금 입금액의 최대 10%, 최대 300만원 까지 세액공제 가능**==(세액미공제 금액은 과세제외)
>
> ● **입금 방법**
>
> ▶ 창구입금 :
>
> - 입금/입금예약[01-12-213]
>
> - 거래구분 : ==**'ISA 만기자금 입금' **==선택
>
> - 계좌입력시 ISA 만기자금 입금가능금액이 자동 조회됨 ☞ 해당 금액 범위 내로 입금 가능
>
> ![이미지2](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/images/204287_02.jpg>)
> > **이미지2 설명**: 화면 [01-12-213] 입금/입금예약 화면 — 거래구분 "ISA만기자금 입금" 선택, ISA 만기자금 입금가능금액 45,184,024원 표시(만기일로부터 60일 이내 입금 가능 안내).
>
> ▶ 비대면입금 :
<!-- /source-excerpt -->

<a id="H-ISA-B"></a>
#### H-ISA-B · ISA 사전관리·타행 확인·운용상품 연결

근거: [SRC-072 · [ ISA 만기 자금 개인형IRP 전환 마케팅 ]](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/posts/2026-01-31_204287_[ ISA 만기 자금 개인형IRP 전환 마케팅 ].md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2026-01-31_204287_%5B%20ISA%20%EB%A7%8C%EA%B8%B0%20%EC%9E%90%EA%B8%88%20%EA%B0%9C%EC%9D%B8%ED%98%95IRP%20%EC%A0%84%ED%99%98%20%EB%A7%88%EC%BC%80%ED%8C%85%20%5D.md#L120-L138) · L120–138 · 자료 기준 2026-01-31

**이 고객에게 적용할 때:** 현장 팁의 접근법을 활용한다. 원문의 경영정보 경로·메시지 운영은 저장소 기재 수준 확인이다.

<!-- source-excerpt {"key": "H-ISA-B", "path": "knowledge/corpus/03_스타런_영업점_Hottip/posts/2026-01-31_204287_[ ISA 만기 자금 개인형IRP 전환 마케팅 ].md", "start": 120, "end": 138, "sha256": "b2610164c114dc6ed33c436c5d5bfddb8e89c592f3f1fb491a5ed982d2dcb153"} -->
> ● ==**ISA 만기 사전 관리**==
>
> - ISA 만기 2~1개월 전 고객에게 ISA 만기자금 IRP전환 및 세제혜택 안내
>
> - ISA 만기도래 계좌 확인방법 : **<u>경영정보시스템 > 신탁상품별 계좌보유명세</u>**
>
> ![이미지7](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/images/204287_07.jpg>)
> > **이미지7 설명**: 신탁상품별계좌보유명세 화면([MAC72111000]) — ISA신탁형 상품구분, 고객명·계좌잔액·수익률·신규년월일·만기년월일 목록(개인정보 마스킹).
>
> ● **마이데이터 대면서비스를 통한 타행 ISA 만기 확인 및 IRP유치 **
>
> ● **ISA 신규개설 내점 고객 대상 기보유 ISA 만기 해지 여부 확인 마케팅**
>
> - ISA해지금액이 입금되면 고객에게 연금저축계좌 입금에 대한 유의사항이 포함된 안내문자가 발송되므로 고객에게 추가 마케팅을 할 수 있음
>
> ![이미지8](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/images/204287_08.jpg>)
> > **이미지8 설명**: 신탁형ISA 해지금액 입금 안내 문자 — 연결계좌로 해지금액 45,184,024원 입금 안내 및 유의사항(만기일로부터 60일 이내 IRP 이전시 납입금액의 10%, 최대 300만원 추가 세액공제 가능).
>
> ● **개인형IRP 운용 상품의 다양성(TDF, ETF 등) 안내 및 포트폴리오 제안으로 고객 관심 유도**
<!-- /source-excerpt -->


Hot Tip 링크는 원문 MD에 기록된 주소 그대로다. 로그인 접근·현재 업무 유효성은 검증하지 않았다. 현장 경험담의 절차는 본부 화면자료와 대조하여 사용한다.

## 6. 출처 목록

| Source ID | 자료 | 성격·기준시점 |
|---|---|---|
| SRC-003 | [개인형IRP 마케팅 보물지도](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/02_마케팅_캠페인/개인형IRP_마케팅_보물지도_Vol1.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/02_%EB%A7%88%EC%BC%80%ED%8C%85_%EC%BA%A0%ED%8E%98%EC%9D%B8/%EA%B0%9C%EC%9D%B8%ED%98%95IRP_%EB%A7%88%EC%BC%80%ED%8C%85_%EB%B3%B4%EB%AC%BC%EC%A7%80%EB%8F%84_Vol1.md) | Official / Internal Guide / Internal · 2026-03 |
| SRC-019 | [연금 투자, 이거는 알고 하자](<../../../../../knowledge/corpus/02_스타런_퇴직연금_교육자료/02_투자교육/연금투자_기본원칙_이것은_알고_하자.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/02_%EC%8A%A4%ED%83%80%EB%9F%B0_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EA%B5%90%EC%9C%A1%EC%9E%90%EB%A3%8C/02_%ED%88%AC%EC%9E%90%EA%B5%90%EC%9C%A1/%EC%97%B0%EA%B8%88%ED%88%AC%EC%9E%90_%EA%B8%B0%EB%B3%B8%EC%9B%90%EC%B9%99_%EC%9D%B4%EA%B2%83%EC%9D%80_%EC%95%8C%EA%B3%A0_%ED%95%98%EC%9E%90.md) | Training Material / Internal · Unknown |
| SRC-027 | [퇴직연금 주요거래 화면번호 안내](<../../../../../knowledge/corpus/06_퇴직연금_주요거래_화면번호_안내/퇴직연금_주요거래_화면번호_안내.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md) | Reference / Internal · Unknown |
| SRC-072 | [[ ISA 만기 자금 개인형IRP 전환 마케팅 ]](<../../../../../knowledge/corpus/03_스타런_영업점_Hottip/posts/2026-01-31_204287_[ ISA 만기 자금 개인형IRP 전환 마케팅 ].md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2026-01-31_204287_%5B%20ISA%20%EB%A7%8C%EA%B8%B0%20%EC%9E%90%EA%B8%88%20%EA%B0%9C%EC%9D%B8%ED%98%95IRP%20%EC%A0%84%ED%99%98%20%EB%A7%88%EC%BC%80%ED%8C%85%20%5D.md) | Field Know-how / Experiential · 2026-01-31 |
| SRC-087 | [IRP(개인형 퇴직연금)란? 계좌 개설부터 퇴직금 수령, 세액공제 혜택까지](<../../../../../knowledge/corpus/04_KBthink_연금/01_IRP_개인형퇴직연금.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/04_KBthink_%EC%97%B0%EA%B8%88/01_IRP_%EA%B0%9C%EC%9D%B8%ED%98%95%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88.md) | Public Content / Public · 2026-06-08 |
| SRC-098 | [연금왕 찐천재 마스터북 — Level 2 / 7주차 디폴트옵션 상품](<../../../../../knowledge/corpus/01_행내가이드문서_연금사업부_연금컨설팅부/03_영업화법_스크립트_연금왕찐천재/연금왕찐천재_마스터북_Level2_7주차_디폴트옵션상품.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/03_%EC%98%81%EC%97%85%ED%99%94%EB%B2%95_%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8_%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC/%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC_%EB%A7%88%EC%8A%A4%ED%84%B0%EB%B6%81_Level2_7%EC%A3%BC%EC%B0%A8_%EB%94%94%ED%8F%B4%ED%8A%B8%EC%98%B5%EC%85%98%EC%83%81%ED%92%88.md) | Training Material / Internal · 2026-08 (수익률 2026-08-20 기준) |
| SRC-099 | [PRODUCT_MASTER — 개인형IRP 브리핑용 상품 마스터](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MASTER.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md) | Product Data / Internal · 2026-09-10 (금리 2026-09 적용, 추천펀드 성과 2026-08-28 기준, 판매목록 기준일 미기재) |
| SRC-100 | [PRODUCT_MATCHING_KB — 고객상황 → 상품 후보 매핑](<../../../../../knowledge/corpus/05_상품_기반지식/PRODUCT_MATCHING_KB.md>) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MATCHING_KB.md) | Product Data / Internal · 2026-09-10 (수치는 SRC-099 마스터의 읽기용 요약) |

## 7. 고객 데이터·대화 원문 부록

<details><summary>대화 자료의 고객 인덱스 원문 — 열 의미를 임의 추정하지 않음</summary>

```json
{
  "raw_row": "한지우 176903-5528417 57 적극투자형 Y 있음 300만 설정 2 isa, tax, add",
  "name": "한지우",
  "customer_id": "176903-5528417",
  "age": 57,
  "investment_profile": "적극투자형",
  "isa_maturity_flag_raw": "Y",
  "unlabeled_source_column_6": "있음",
  "tax_deduction_remaining_raw": "300만",
  "default_option_status_raw": "설정",
  "unlabeled_source_column_9": 2,
  "target_code_text_raw": "isa, tax, add",
  "target_codes": [
    "isa",
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
    "caseId": "C01-06",
    "dataType": "시연용가상고객",
    "asOfDate": "2026-09-29",
    "generatedAt": "2026-09-29T07:00:00+09:00",
    "currency": "KRW"
  },
  "customer": {
    "customerId": "176903-5528417",
    "name": "한지우",
    "age": 57,
    "gender": "여",
    "starClubGrade": "VIP",
    "investmentProfile": "적극투자형",
    "irpOpenedAt": "2024-03-05",
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
      "label": "ISA 전환기한 D-36",
      "date": "2026-11-04"
    },
    {
      "label": "투자성향-DO불일치",
      "source": "동료 IRP Agent 시연 데이터(9 Cases v3)"
    }
  ],
  "irpAccount": {
    "valuationAmountKrw": 210000000,
    "assetAllocation": [
      {
        "assetType": "원리금보장형",
        "amountKrw": 70700000,
        "weightPct": 33.7
      },
      {
        "assetType": "실적배당형",
        "amountKrw": 134300000,
        "weightPct": 63.9
      },
      {
        "assetType": "현금성자산",
        "amountKrw": 5000000,
        "weightPct": 2.4
      }
    ],
    "oneYearReturnPct": 21.6,
    "taxDeductionRemainingKrw": 3000000,
    "latestProductOpening": {
      "holdingId": "H002",
      "productId": "DEP-007",
      "productName": "기업은행 퇴직연금 정기예금 1년",
      "openedAt": "2026-04-02",
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
      "weightPct": 2.4,
      "oneYearReturnPct": null,
      "openedAt": "2024-03-05",
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
      "weightPct": 19.3,
      "oneYearReturnPct": 3.2,
      "openedAt": "2026-04-02",
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
      "valuationAmountKrw": 30200000,
      "weightPct": 14.4,
      "oneYearReturnPct": 3.3,
      "openedAt": "2026-02-14",
      "allocationBreakdown": null,
      "flags": []
    },
    {
      "holdingId": "H004",
      "productId": "MF-008",
      "productName": "피델리티 글로벌 테크놀로지 (주식-재간접)",
      "assetType": "실적배당형",
      "productCategory": "주식형펀드",
      "contractTerm": null,
      "valuationAmountKrw": 79000000,
      "weightPct": 37.6,
      "oneYearReturnPct": 31.7,
      "openedAt": "2025-05-21",
      "allocationBreakdown": null,
      "flags": []
    },
    {
      "holdingId": "H005",
      "productId": "ETF-006",
      "productName": "RISE 미국S&P500 ETF",
      "assetType": "실적배당형",
      "productCategory": "ETF",
      "contractTerm": null,
      "valuationAmountKrw": 55300000,
      "weightPct": 26.3,
      "oneYearReturnPct": 22.9,
      "openedAt": "2025-09-03",
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
      "올해개인부담금납입액원": 3500000,
      "개인부담금납입이력": [
        {
          "연도": 2023,
          "납입금액원": 6000000
        },
        {
          "연도": 2024,
          "납입금액원": 7000000
        },
        {
          "연도": 2025,
          "납입금액원": 8000000
        }
      ],
      "타연금계좌올해납입액원": 2500000,
      "세액공제기준한도원": 9000000,
      "세액공제잔여한도원": 3000000,
      "퇴직급여재원금액원": 0,
      "개인부담금재원금액원": 210000000
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
      "최근운용지시일": "2026-07-25",
      "최근상품매매일": "2026-07-25",
      "최근입금일": "2026-07-10",
      "최근1년상품매매횟수": 9
    },
    "퇴직및인출": {
      "연금수령요건충족여부": false,
      "연금개시여부": false,
      "연금지급설계등록여부": false
    },
    "최근사건": [
      {
        "이벤트식별자": "T001",
        "발생일시": "2027-04-02T00:00:00+09:00",
        "이벤트유형": "상품만기예정",
        "계좌구분": "IRP",
        "관련보유상품식별자": "H002",
        "금액원": 40500000,
        "처리상태": "예정",
        "채널": null
      },
      {
        "이벤트식별자": "T002",
        "발생일시": "2027-02-14T00:00:00+09:00",
        "이벤트유형": "상품만기예정",
        "계좌구분": "IRP",
        "관련보유상품식별자": "H003",
        "금액원": 30200000,
        "처리상태": "예정",
        "채널": null
      }
    ],
    "금융거래": [],
    "상담이력": [
      {
        "상담식별자": "CRM001",
        "상담일시": "2026-07-31T00:00:00+09:00",
        "상담채널": null,
        "상담유형": "퇴직연금사후관리",
        "상담메모": "타행 ISA 만기자금의 IRP 활용 가능 여부 문의. 만기 시점에 세액공제 잔여한도와 함께 다시 상담하기로 함."
      }
    ],
    "외부계좌": [
      {
        "외부계좌구분": "ISA",
        "외부계좌식별자": "EXT001",
        "금융기관": "타행",
        "평가금액원": 80000000,
        "만기일": "2026-09-05",
        "연금계좌전환기한": "2026-11-04",
        "정보확인일": "2026-09-29",
        "자금사용계획": null,
        "개인형퇴직연금전환의향": "문의",
        "개인형퇴직연금전환예정금액원": null,
        "정보출처": "동료 IRP Agent 시연 데이터(9 Cases v3)"
      }
    ],
    "투자성향이력": [
      {
        "이력식별자": "R001",
        "분석일": "2026-06-30",
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
        "값": 2.4,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M002",
        "지표유형": "파생값",
        "지표명": "원리금보장·현금성자산합산비중",
        "대상참조": null,
        "값": 36,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M003",
        "지표유형": "파생값",
        "지표명": "위험자산(실적배당형)비중",
        "대상참조": null,
        "값": 64,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M004",
        "지표유형": "파생값",
        "지표명": "동연령대평균수익률",
        "대상참조": null,
        "값": 8.2,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M005",
        "지표유형": "파생값",
        "지표명": "동연령대상위1%평균수익률",
        "대상참조": null,
        "값": 24.1,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M006",
        "지표유형": "파생값",
        "지표명": "동연령대상위1%평균원리금보장비중",
        "대상참조": null,
        "값": 35,
        "단위": "%",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M007",
        "지표유형": "기간",
        "지표명": "최근 운용변경 후 경과개월수",
        "대상참조": null,
        "값": 2.2,
        "단위": "개월",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M008",
        "지표유형": "기간",
        "지표명": "최근 상담 후 경과일수(장기 미접촉)",
        "대상참조": null,
        "값": 60,
        "단위": "일",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M009",
        "지표유형": "파생값",
        "지표명": "최근 1개월 현금성자산 증감액",
        "대상참조": null,
        "값": -2000000,
        "단위": "원",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M010",
        "지표유형": "상태비교",
        "지표명": "현재 투자성향과 지정 디폴트옵션 위험등급 일치 여부",
        "대상참조": [
          "R001",
          "DO-002"
        ],
        "값": false,
        "단위": null,
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M011",
        "지표유형": "파생값",
        "지표명": "ISA만기까지남은일수",
        "대상참조": "EXT001",
        "값": -24,
        "단위": "일",
        "산출기준일": "2026-09-29"
      },
      {
        "지표식별자": "M012",
        "지표유형": "파생값",
        "지표명": "ISA전환기한까지남은일수",
        "대상참조": "EXT001",
        "값": 36,
        "단위": "일",
        "산출기준일": "2026-09-29"
      }
    ],
    "확인된특이사항": [],
    "가상설정메모": [
      "동료 IRP Agent 시연 데이터(9 Cases v3)에서 옮긴 시연 데이터. 기준일 2026-09-29.",
      "성별은 시연용 가정. 우리 30케이스의 한지우(B02-04)와는 다른 고객. 세액공제 잔여 300만원은 도넛으로 표시."
    ]
  }
}
```

</details>

### 고객별 매핑 대화 전체

질문과 답변은 입력 파일의 문자열을 그대로 보존했다. 포함된 세율·상품·화면번호·데모 링크가 검증되었다는 뜻은 아니다. 위 검토사항과 함께 사용한다.

<a id="dialogue-10"></a>
<details><summary>행 10 · 이 고객 ISA 만기가 언제고 얼마짜리야?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 한지우` · 선행/후속 원문: `None`

**질문 원문**

> 이 고객 ISA 만기가 언제고 얼마짜리야?

**답변 원문**

> 한지우 고객님의 ISA 만기일은 2026년 9월 5일이고, 금액은 8,000만원이에요. 이 자금은 타행 ISA 만기자금이며 만기가 경과한 지 24일이 되었어요.

</details>

<a id="dialogue-51"></a>
<details><summary>행 51 · 고객이 8천만원 전부는 부담스럽다는데, 일부만 옮기면 세액공제는 어떻게 돼?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 한지우` · 선행/후속 원문: `None`

**질문 원문**

> 고객이 8천만원 전부는 부담스럽다는데, 일부만 옮기면 세액공제는 어떻게 돼?

**답변 원문**

> ■ 세액공제 환급 예상액 — 한지우 고객 · 현금을 더 납입하는 경우 (시스템 계산 — 검색 결과가 아니다) · 어디에 넣는 금액인가: 이 고객의 개인형IRP 계좌 추가 납입이다 · 당해 납입액 600만원 · 세액공제 한도 900만원 · 잔여한도 300만원 — 한도와 잔여한도는 연금저축 납입분까지 합산한 값이다(원장 값) · 계산에 쓴 추가 납입액 8,000만원 · 공제 대상 600만원 → 900만원 (잔여한도 300만원까지) · 총급여 5,500만원 초과(13.2%): 환급 예상 792,000원 → 1,188,000원 (늘어나는 금액 396,000원) · 공제율은 원장의 총급여 구간에서 나온 값이다 — 되물을 것이 없다 ■ ISA 만기자금을 전환하는 경우 — 위 계산과 다른 축이다 (잔여한도 안에서 나눠 쓰는 것이 아니라, 공제 대상 한도 자체가 늘어난다) · ISA 만기자금 8,000만원 · 만기 2026-09-05 (만기 24일 경과 · 전환 기한 36일 남음) · 타행 — 만기일로부터 60일 이내에 전환한다 · 전환금은 연 납입한도 1,800만원과 무관하다 — 만기금액의 전부 또는 일부를 넣을 수 있다 · 전환액의 10%가 세액공제 대상에 더해진다(상한 300만원) — 전환액 3,000만원에서 상한에 닿는다. 전환금 전액이 공제 대상이 되는 것이 아니다 · 그래서 공제 대상 한도가 900만원에서 최대 1,200만원으로 늘어난다 · 전환액별 추가 공제 대상: 1,000만원 → 100만원 · 2,000만원 → 200만원 · 3,000만원 → 300만원(상한) · 8,000만원 → 300만원(상한) · 계산에 쓴 전환액 8,000만원 → 추가 공제 대상 300만원 · 총급여 5,500만원 초과(13.2%): 이 전환으로 늘어나는 환급 396,000원 · 이 금액은 위의 «현금을 더 납입하는 경우»와 별개로 더해지는 몫이다 — 둘을 같은 한도 안에서 저울질하지 않는다

</details>

<a id="dialogue-52"></a>
<details><summary>행 52 · ISA 만기자금 8천만원 다 옮기면 세액공제는 얼마나 받는 거야?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 한지우` · 선행/후속 원문: `None`

**질문 원문**

> ISA 만기자금 8천만원 다 옮기면 세액공제는 얼마나 받는 거야?

**답변 원문**

> ISA 만기자금 8,000만원을 개인형IRP 계좌로 전환하면 세액공제 대상 한도가 늘어나 환급액을 더 받을 수 있어요. 한지우 고객의 총급여 5,500만원 초과(13.2%) 기준으로 전환액 8,000만원에 대해 추가 공제 대상 300만원이 적용되어 396,000원의 환급액이 늘어나요. 이 금액은 현금을 더 납입하는 경우와 별개로 더해지는 몫이에요. 단, 세액공제 전 결정세액이 공제액보다 적으면 최대 환급액을 받지 못한다 — 소득이 낮은 고객에게 "900만원 넣으면 무조건 148.5만원"이라고 안내하면 오안내다.

</details>

<a id="dialogue-53"></a>
<details><summary>행 53 · (총급여 구간 되묻기 뒤) 초과야</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 한지우` · 선행/후속 원문: `고객이 8천만원 전부는 부담스럽다는데, 일부만 옮기면 세액공제는 어떻게 돼?`

**질문 원문**

> (총급여 구간 되묻기 뒤) 초과야

**답변 원문**

> ISA 만기자금 중 일부를 IRP 계좌로 전환할 때는 전환액의 10%가 세액공제 대상에 더해져 공제 한도가 최대 1,200만원까지 늘어나요. 고객이 8천만원 중 일부만 전환하는 경우, 전환액별로 추가되는 공제 대상 금액은 다음과 같이 달라져요. - 1,000만원 전환 — 추가 공제 대상 100만원 - 2,000만원 전환 — 추가 공제 대상 200만원 - 3,000만원 이상 전환 — 추가 공제 대상 300만원(상한) 총급여가 5,500만원을 초과해 13.2%의 공제율이 적용되는 경우, 전환액 3,000만원 이상을 넣으면 늘어나는 환급액은 396,000원이 돼요. 단, 세액공제 전 결정세액이 공제액보다 적으면 최대 환급액을 받지 못한다 — 소득이 낮은 고객에게 "900만원 넣으면 무조건 148.5만원"이라고 안내하면 오안내다. 앞서 말씀드린 현금 추가 납입분과 ISA 전환분은 서로 다른 한도이므로 같은 한도 안에서 저울질하지 않도록 안내해 주세요.

</details>

<a id="dialogue-54"></a>
<details><summary>행 54 · (총급여 구간 되묻기 뒤) 5,500 이하야</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 한지우` · 선행/후속 원문: `고객이 8천만원 전부는 부담스럽다는데, 일부만 옮기면 세액공제는 어떻게 돼?`

**질문 원문**

> (총급여 구간 되묻기 뒤) 5,500 이하야

**답변 원문**

> 총급여가 5,500만원 이하인 고객에게는 개인형IRP 계좌로 ISA 만기자금을 일부 전환할 때 전환액에 따라 추가 공제 대상이 달라진다는 점을 짚어주는 게 핵심이에요. 앞서 말씀드린 대로 전환액의 10%가 세액공제 대상에 더해지며 상한은 300만원이에요. 전환액별 추가 공제 대상은 1,000만원이면 100만원, 2,000만원이면 200만원, 3,000만원 이상이면 상한인 300만원이 적용되어요. 총급여 5,500만원 이하 구간에서는 16.5%의 공제율이 적용되어 전환액 3,000만원 이상일 때 늘어나는 환급액은 495,000원이 되어요. 단, 세액공제 전 결정세액이 공제액보다 적으면 최대 환급액을 받지 못한다 — 소득이 낮은 고객에게 "900만원 넣으면 무조건 148.5만원"이라고 안내하면 오안내다.

</details>

<a id="dialogue-64"></a>
<details><summary>행 64 · ISA 만기자금 입금은 몇 번 화면에서 처리해?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 한지우` · 선행/후속 원문: `None`

**질문 원문**

> ISA 만기자금 입금은 몇 번 화면에서 처리해?

**답변 원문**

> ISA 만기자금 입금은 입금·입금예약·입금명부 등록을 처리하는 01-12-213 화면에서 처리해요. 해당 화면에서는 거래구분을 과세이연·계약이전입금이나 ISA 만기자금 입금으로 선택해 진행할 수 있어요. [01-12-213] ISA 만기자금 입금 거래구분을 선택하면 입금가능금액을 자동으로 조회할 수 있다는 점을 함께 참고해서 안내해 주세요.

</details>

<a id="dialogue-159"></a>
<details><summary>행 159 · 이 고객 세액공제율 몇 퍼센트 적용돼?</summary>

매핑 방식 `explicit_bullet_name` · 확신도 `high` · 매핑 메모: 원문 답변의 '● 고객명' 구간을 분리

원문 세그먼트 표기: `● 한지우` · 선행/후속 원문: `None`

**질문 원문**

> 이 고객 세액공제율 몇 퍼센트 적용돼?

**답변 원문**

> 총급여 기준을 적용하는 경우 5,500만원 이하 고객에게는 16.5%, 초과 고객에게는 13.2%의 세액공제율이 적용돼요. 세액공제 한도는 연간 납입액 최대 900만원이고, 공제율은 지방소득세 포함 기준이며 5,500만원 정확히 일치하는 경우에도 16.5% 구간에 해당해요. 다만 세액공제 전 결정세액이 공제액보다 적으면 최대 환급액을 받지 못하므로 이 점을 유의해야 하며, 해당 내용은 2026년 6월 기준의 자료를 바탕으로 안내드려요.

</details>


# C01-12 이수민 · S1~S5 브리핑 초안 v0.1

> 시연용 가상 고객 · 고객 분석 기준일 **2026-09-29** · 작성일 2026-09-21  
> 사용자와 방향·문장을 검토하기 위한 초안. 원문 사실·상담이력과 작성자의 제안을 구분했다.

**이수민 · 49세 · 위험중립형 · 재직 · 개인형IRP**  
현재 세그먼트: **정기예금 만기 D-18** · **원리금보장 편중** · **DO 미등록**

[고객별 기반지식](knowledge_pack.md) · [현재 고객 DATA](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/active/display-data/C01-12.json) · [전체 고객 색인](../README.md)

[S1 고객 상황](#s1) · [S2 관리 포인트](#s2) · [S3 관리 방향](#s3) · [S4 상담 화법](#s4) · [S5 업무 연결](#s5)

## 1. 화면용 S1~S5

<a id="s1"></a>
### S1. 고객 상황

이수민 고객은 **49세·위험중립형·재직 고객**으로, IRP **8,000만원**을 운용하고 있습니다. 기업은행 정기예금 **7,000만원**이 **10월 17일 만기**로, 분석 기준일에는 18일이 남아 있습니다. 별도 현금성자산 **1,000만원**은 6월 26일 이후 95일간 대기한 것으로 표시됩니다. 최근 1년 계좌 수익률은 2.8%입니다.

디폴트옵션과 입금 시 매수상품, 만기 후 운용설정은 모두 미설정 상태입니다. 올해와 작년 개인부담금 납입은 0원이며 DATA상 일반 세액공제 잔여한도는 900만원입니다. 과거 상담이력과 현재 자금 사용계획은 확인되지 않았습니다.

<a id="s2"></a>
### S2. 핵심 관리 포인트

**이번 만기자금이 다시 오래 대기하지 않도록 운용 방향을 먼저 정하세요.**

**💡 왜 지금?**

이미 현금 1,000만원이 대기 중이고 곧 예금 7,000만원도 만기를 맞습니다. 예금 중심 운용이 의도한 선택인지, 상품을 고르기 어려워 그대로 둔 것인지 확인할 시점입니다. 현재 현금과 아직 만기 전인 예금을 나누어 상담하고, 고객이 선택한 기간과 위험에 맞춰 직접 운용·만기예약·향후 기본 설정을 연결합니다.

49세의 재직 고객이라는 점은 노후까지의 운용기간을 함께 논의할 근거입니다. 다만 실제 은퇴 시점이나 손실 수용 의향은 미확인입니다. 또래와의 수익률 차이만으로 위험을 높이기보다, 장기간 유지할 금액에서는 다른 운용 방식도 비교해볼 의향이 있는지 묻습니다.

**고객과 확인**

- 현금 1,000만원을 남겨둔 이유와 사용계획은 무엇인지.
- 만기 7,000만원을 얼마나 오래 운용할 수 있고, 원금손실 가능성을 어느 정도 받아들일 수 있는지.
- 추가납입할 여유자금과 공제받을 소득·세액이 있는지.

<a id="s3"></a>
### S3. 관리 방향 및 제안

**현재 현금 운용과 만기예약을 구분하고, 이후 반복될 공백까지 점검합니다.**

**① 안정성을 유지하고 싶다면 — 만기 재예치 조건 비교**  
**기업은행 퇴직연금 정기예금(DEP-007)** 등에서 기간·10월 실제 금리·중도해지 조건을 비교합니다. 지금 현금 1,000만원은 현재 시점의 운용 선택으로, 7,000만원은 실제 만기와 예약 가능 여부를 확인하는 별도 거래로 다룹니다.

**② 일부 실적배당을 검토하고 싶다면 — 작은 범위부터 역할 비교**  
현금 중 가격 변동을 감수할 수 있는 부분에 **키움더드림단기채 C-P2E(퇴직연금)(FND-001)**의 단기채 운용 방식을 비교합니다. 주식형 성장전략과는 다른 후보이며, 예금보다 높은 수익을 보장하지 않습니다. 장기 성장투자까지 원하는 경우에는 목표기간·손실감내를 추가 확인한 뒤 적합한 후보를 더 비교합니다.

**③ 다음 운용공백 대비 — DO와 입금 설정 별도 안내**  
**알파드림(DO-002)**의 구성·위험과 적용 절차를 설명합니다. 디폴트옵션 등록, 입금 시 매수상품 지정, 현재 자금의 운용지시는 역할이 다릅니다. 설정만 해두면 오늘 현금과 만기자금이 즉시 매수된다고 안내하지 않습니다.

**④ 납입 여력이 있다면 — 세액공제 확인 후 선택**  
현재 계좌 안의 1,000만원으로 상품을 바꾸는 것은 새로운 개인부담금 납입이 아닙니다. 별도 여유자금과 실제 공제효과를 확인한 뒤 추가납입 여부·금액을 정합니다. 900만원은 표시된 공제잔여이며, 일반 연간 납입한도나 반드시 채워야 하는 목표와 구분합니다.

[상품별 설명·원문 보기](#products)

<a id="s4"></a>
### S4. 상담 Point

**💬 이렇게 시작해보세요**

> “이수민 고객님, IRP의 기업은행 예금 7,000만원이 10월 17일 만기로 조회돼 안내드리려고 합니다. 만기 뒤에도 예금으로 이어가실지, 일부 다른 운용도 비교해보고 싶으신지 함께 살펴볼까요?”

**① 예금으로 계속 운용하고 싶다면**

> “그러시면 어느 정도 기간까지 유지하실 수 있는지에 맞춰 조건을 비교해드리겠습니다. 만기 전에 예약할 수 있는 상품인지도 확인해드릴게요.”
>
> “지금 별도로 현금 1,000만원이 남아 있는데요. 이 금액은 정해두신 사용계획이 있으실까요? 만기예금과 나누어 보고, 운용을 원하시는 금액만 먼저 정하겠습니다.”

**② 상품을 고르기 어려웠다고 한다면**

> “상품을 한 번에 모두 고르실 필요는 없습니다. 원금손실을 피하고 싶은 금액과, 조금의 가격 변동을 감수하며 운용해볼 금액이 있는지부터 나누어보시면 좋겠습니다.”
>
> “일부 실적배당을 비교하고 싶으시면 단기채 펀드의 투자대상·비용·환매기간부터 설명드릴게요. 예금과 달리 손실이 날 수 있으니 설명을 들으신 뒤 결정하셔도 됩니다.”

**③ 디폴트옵션을 등록하면 알아서 운용되는지 묻는다면**

> “운용지시가 없는 경우에 대비해 미리 상품을 정해두는 제도입니다. 다만 지정하시는 것과 실제로 적용되는 시점은 다릅니다. 지금 현금 운용이나 이번 만기예약을 원하시면 그 절차를 따로 확인해드리겠습니다.”
>
> “알파드림은 예금과 투자상품을 함께 담는 구성이라 원금손실 가능성도 있습니다. 고객님이 원하시는 안정성에 맞는지 먼저 비교해보겠습니다.”

**④ 세액공제를 더 받을 수 있는지 묻는다면**

> “자료에는 올해 일반 세액공제 한도가 900만원 남아 있습니다. 올해 소득과 다른 연금계좌 내역, 여유자금을 확인하면 실제로 어느 정도 납입하는 게 맞을지 살펴볼 수 있습니다.”
>
> “이미 IRP 안에 있는 현금으로 상품을 사는 것은 추가납입이 아니에요. 별도로 넣으실 자금이 있을 때 검토하시면 됩니다. 매월 나누어 납입하고 싶으시면 가능한 금액에 맞춰 자동이체도 안내드릴게요.”

**선택 전 안내**  
10월 거래조건과 실제 만기 처리일을 확인합니다. 단기채와 알파드림은 원금보장상품이 아니며, 공제효과는 소득·결정세액 등에 따라 달라집니다.

화법 원문: [T-MATURITY](knowledge_pack.md#T-MATURITY) · [T-DO](knowledge_pack.md#T-DO) · [T-CONTRIBUTION](knowledge_pack.md#T-CONTRIBUTION) · S4는 원문 흐름을 살린 고객별 편집 화법이며 실제 대화 기록이 아니다.

<a id="s5"></a>
### S5. 현장 활용 / 후속조치

**📌 관련 TIP·업무지식**

**Hot Tip #207754 · ★개인형IRP 고객수 단기간 최대득점하기★**  
게시일 2026-08-03  
고유계정대·월별 상품조건·변경 링크 발송 화면을 구분해 연결.  
[게시글 원문](https://lxp.kbstar.com/app/board/hottip-my/view/207754.31DF7D0885853D47870BFD95BB703E2DFE86103D0C379C8622E773A6EA8A4A53) · [Git 원문](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2026-08-03_207754_%E2%98%85%EA%B0%9C%EC%9D%B8%ED%98%95IRP%20%EA%B3%A0%EA%B0%9D%EC%88%98%20%EB%8B%A8%EA%B8%B0%EA%B0%84%20%EC%B5%9C%EB%8C%80%EB%93%9D%EC%A0%90%ED%95%98%EA%B8%B0%E2%98%85.md)

연결할 절: [H-MATURITY · 상품변경 안내·월별 금리·발송 화면의 구분](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/03_%EC%8A%A4%ED%83%80%EB%9F%B0_%EC%98%81%EC%97%85%EC%A0%90_Hottip/posts/2026-08-03_207754_%E2%98%85%EA%B0%9C%EC%9D%B8%ED%98%95IRP%20%EA%B3%A0%EA%B0%9D%EC%88%98%20%EB%8B%A8%EA%B8%B0%EA%B0%84%20%EC%B5%9C%EB%8C%80%EB%93%9D%EC%A0%90%ED%95%98%EA%B8%B0%E2%98%85.md#L66-L96)

**↗ 관련 업무**

| 화면번호 | 화면명 | 이 고객에게 확인·처리할 내용 | 근거 |
|---|---|---|---|
| **04-12-644** | 거래내역 조회 | 현금 유입·납입 이력 확인. | [SRC-027 L74](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L74) |
| **04-12-642** | 적립금및수익률조회 | 현재 현금과 만기예금·고유계정대 이자 조회. | [SRC-027 L65](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L65) |
| **04-12-17A** | New퇴직연금상품조회 | 10월 조건과 예약 가능 상품 조회. | [SRC-003 L803](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/02_%EB%A7%88%EC%BC%80%ED%8C%85_%EC%BA%A0%ED%8E%98%EC%9D%B8/%EA%B0%9C%EC%9D%B8%ED%98%95IRP_%EB%A7%88%EC%BC%80%ED%8C%85_%EB%B3%B4%EB%AC%BC%EC%A7%80%EB%8F%84_Vol1.md#L803) |
| **06-12-611** | 보유상품변경 | 현재 현금 변경과 10/17 만기예약을 구분 접수. | [SRC-027 L67](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L67) |
| **75-08-110** | 개인고객용메시지발송등록 | 비대면 상품변경 링크 발송; 실제 예약 접수 확인은 별도. | [SRC-002 L118](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/01_%EA%B3%A0%EA%B0%9D%EA%B4%80%EB%A6%AC_%EC%88%98%EC%9D%B5%EB%A5%A0%EA%B4%80%EB%A6%AC/%EC%97%B0%EA%B8%88%EA%B3%A0%EA%B0%9D_%EC%88%98%EC%9D%B5%EB%A5%A0KPI_%EA%B3%A0%EA%B0%9D%EA%B4%80%EB%A6%AC_%EC%8B%9C%EB%82%98%EB%A6%AC%EC%98%A4.md#L118) |
| **06-12-610** | 입금예정상품 등록/변경 | 향후 입금예정상품/DO 지정 신청. | [SRC-027 L66](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L66) |
| **04-12-640** | 상품운용내역조회 | 운용지시와 예약/실행 상태 확인. | [SRC-027 L68](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L68) |
| **06-12-151** | 개인부담금 연합회 한도 등록 | 추가납입 선택 시 연합회 납입한도 확인/등록. 공제잔여 조회로 혼동하지 않음. | [SRC-027 L92](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L92) |
| **06-12-619** | 퇴직연금 자동이체 | 자동이체를 선택하는 경우에만 신청. | [SRC-027 L91](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/06_%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4/%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88_%EC%A3%BC%EC%9A%94%EA%B1%B0%EB%9E%98_%ED%99%94%EB%A9%B4%EB%B2%88%ED%98%B8_%EC%95%88%EB%82%B4.md#L91) |

**✓ 상담 후**

현재 현금과 만기자금의 사용계획·운용 선택을 각각 기록합니다. 만기예약과 실제 실행 결과를 확인하고, 고객이 선택한 DO/입금 설정만 처리합니다. 추가납입을 원하면 납입한도와 공제정보를 구분해 확인합니다.

<a id="products"></a>
## 2. 상품 펼쳐보기

자료 기준의 상담용 비교 후보다. 금액·배분과 실제 매수가능 여부는 고객 의사 및 거래시점 확인 후 정한다. 상품 마스터의 `runtime_verified: false` 상태를 유지하며, 9월 금리를 10월 이후 거래에 약속하지 않는다.

### DEP-007 · 기업은행 퇴직연금 정기예금

- **이 고객에게 연결하는 이유:** 기존 기업은행 예금의 동일 역할 재운용 비교.
- **자료상 성격:** 자료상 원리금보장 정기예금. 기존 만기예금의 재운용 비교 후보이며 다음 거래월의 조건을 다시 확인한다.
- **선택 전 확인:** 10월 제공조건·기간·만기예약 가능 여부 확인.
- **출처:** [상품 마스터 Git L552–613](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#L552-L613) · [전체 원문 레코드](knowledge_pack.md)

### FND-001 · 키움더드림단기채증권투자신탁(채권)C-P2E(퇴직연금)

- **이 고객에게 연결하는 이유:** 변동성을 수용하는 현재 현금 일부의 단기채 비교.
- **자료상 성격:** 자료에 기재된 C-P2E(퇴직연금) 클래스의 단기채 펀드. 원금보장 예금과 다르며 거래채널·비용·환매 정산일을 확인한다.
- **선택 전 확인:** 원금보장 아님. 정확한 C-P2E 클래스·채널·정산일 확인.
- **출처:** [상품 마스터 Git L6507–6587](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#L6507-L6587) · [전체 원문 레코드](knowledge_pack.md)

### DO-002 · 알파드림

- **이 고객에게 연결하는 이유:** 미등록 고객의 향후 저위험 분산형 지정 비교.
- **자료상 성격:** 저위험 알파드림의 지정 비교 자료. 예금과 TDF를 포함하는 구성으로 원금손실 가능성이 있다. 지정만으로 현재 현금이 즉시 매수되지 않는다.
- **선택 전 확인:** 원금손실 수용 여부 확인. 등록만으로 현재 현금·만기자금이 즉시 매수되지 않음.
- **출처:** [상품 마스터 Git L7456–7555](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MASTER.md#L7456-L7555) · [전체 원문 레코드](knowledge_pack.md)

## 3. 사용한 근거와 화법 편집 범위

고객 사실은 [C01-12 DATA](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/active/display-data/C01-12.json)의 `/customer`, `/irpAccount`, `/holdings`, `/에이전트맥락데이터`를 사용했다. 개별 대화는 [기반지식 부록](knowledge_pack.md)에 보존했다. 대화 답변의 가정·오류를 고객의 실제 상담 발언으로 바꾸지 않았다.

**방향·판단 근거**

- [K-DO-FLOW · 입금예정상품과 디폴트옵션의 역할 구분](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/03_%EC%98%81%EC%97%85%ED%99%94%EB%B2%95_%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8_%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC/%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC_%EB%A7%88%EC%8A%A4%ED%84%B0%EB%B6%81_Level2_7%EC%A3%BC%EC%B0%A8_%EB%94%94%ED%8F%B4%ED%8A%B8%EC%98%B5%EC%85%98%EC%83%81%ED%92%88.md#L139-L150)
- [K-CASH · 현금성자산의 사용계획·거래사유부터 확인](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/01_%EA%B3%A0%EA%B0%9D%EA%B4%80%EB%A6%AC_%EC%88%98%EC%9D%B5%EB%A5%A0%EA%B4%80%EB%A6%AC/%EC%97%B0%EA%B8%88%EA%B3%A0%EA%B0%9D_%EC%88%98%EC%9D%B5%EB%A5%A0KPI_%EA%B3%A0%EA%B0%9D%EA%B4%80%EB%A6%AC_%EC%8B%9C%EB%82%98%EB%A6%AC%EC%98%A4.md#L172-L185)
- [K-TAX · 일반 납입·ISA 전환·실제 공제효과 구분](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/04_KBthink_%EC%97%B0%EA%B8%88/01_IRP_%EA%B0%9C%EC%9D%B8%ED%98%95%ED%87%B4%EC%A7%81%EC%97%B0%EA%B8%88.md#L66-L82)
- [K-FOLLOW · 기존 고객의 만기·수익률·제공조건 정기관리](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/02_%EB%A7%88%EC%BC%80%ED%8C%85_%EC%BA%A0%ED%8E%98%EC%9D%B8/%EA%B0%9C%EC%9D%B8%ED%98%95IRP_%EB%A7%88%EC%BC%80%ED%8C%85_%EB%B3%B4%EB%AC%BC%EC%A7%80%EB%8F%84_Vol1.md#L782-L812)
- [PM-03 · 전략 선택 논리](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MATCHING_KB.md#L203-L261): 기획 매핑 자료. 공식 적합성 판정과 구분한다.
- [PM-15 · 전략 선택 논리](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/05_%EC%83%81%ED%92%88_%EA%B8%B0%EB%B0%98%EC%A7%80%EC%8B%9D/PRODUCT_MATCHING_KB.md#L995-L1058): 기획 매핑 자료. 공식 적합성 판정과 구분한다.

**S4 원문과 편집**

T-MATURITY의 만기 안내와 예약 지원, T-DO의 선택권을 살렸다. T-CONTRIBUTION의 한도 확인과 정기납입 안내는 여유자금·소득 확인 뒤로 배치하고 “꼭 채우세요”라는 단정 대신 고객이 금액을 고르는 말로 바꾸었다. 원문의 과거 금리차·보호한도는 사용하지 않았다.

- [T-MATURITY · 만기 안내 → 안정 운용 제안 → 예약/추가조회 분기](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/01_%EA%B3%A0%EA%B0%9D%EA%B4%80%EB%A6%AC_%EC%88%98%EC%9D%B5%EB%A5%A0%EA%B4%80%EB%A6%AC/%EC%97%B0%EA%B8%88%EA%B3%A0%EA%B0%9D_%EC%88%98%EC%9D%B5%EB%A5%A0KPI_%EA%B3%A0%EA%B0%9D%EA%B4%80%EB%A6%AC_%EC%8B%9C%EB%82%98%EB%A6%AC%EC%98%A4.md#L98-L122) · [보존된 발췌](knowledge_pack.md#T-MATURITY)
- [T-DO · 디폴트옵션: 거부감 낮추기 → 신뢰 → 고객 선택권](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/03_%EC%98%81%EC%97%85%ED%99%94%EB%B2%95_%EC%8A%A4%ED%81%AC%EB%A6%BD%ED%8A%B8_%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC/%EC%97%B0%EA%B8%88%EC%99%95%EC%B0%90%EC%B2%9C%EC%9E%AC_%EB%A7%88%EC%8A%A4%ED%84%B0%EB%B6%81_Level2_7%EC%A3%BC%EC%B0%A8_%EB%94%94%ED%8F%B4%ED%8A%B8%EC%98%B5%EC%85%98%EC%83%81%ED%92%88.md#L214-L228) · [보존된 발췌](knowledge_pack.md#T-DO)
- [T-CONTRIBUTION · 납입한도 확인 → 미소진 안내 → 자동이체/거절 후속](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/knowledge/corpus/01_%ED%96%89%EB%82%B4%EA%B0%80%EC%9D%B4%EB%93%9C%EB%AC%B8%EC%84%9C_%EC%97%B0%EA%B8%88%EC%82%AC%EC%97%85%EB%B6%80_%EC%97%B0%EA%B8%88%EC%BB%A8%EC%84%A4%ED%8C%85%EB%B6%80/02_%EB%A7%88%EC%BC%80%ED%8C%85_%EC%BA%A0%ED%8E%98%EC%9D%B8/%EA%B0%9C%EC%9D%B8%ED%98%95IRP_%EB%A7%88%EC%BC%80%ED%8C%85_%EB%B3%B4%EB%AC%BC%EC%A7%80%EB%8F%84_Vol1.md#L548-L559) · [보존된 발췌](knowledge_pack.md#T-CONTRIBUTION)

**제도 대조 자료**

- [세액공제](https://j.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7875&mi=6439)
- [DO제도](https://moel.go.kr/news/enews/report/enewsView.do?news_seq=13021)

자료 확인일 2026-09-21. 제도 설명의 대조 범위이며 고객별 세액·거래가능 여부를 확인한 결과는 아니다.

## 4. 고객 맥락·뱃지와 검토 메모

뱃지 정의: [BADGE_CATALOG.md](https://github.com/09sunwoo-a/Pension_Agent_V/blob/41ae9a44357ccabde98dec76d99965e6b038b2a6/agent-workbench/case-design/review/BADGE_CATALOG.md). 아래 해석은 상담 방향을 구성한 이유이며 고객의 확정 의향과 구분한다.

- **사실:** 49세·재직·위험중립형, 예금과 현금만 보유, 운용 관련 설정 없음. **해석:** 장기투자 의향을 확인할 여지는 있지만 손실감내나 실적배당 가입 동의는 미확인이다.
- **뱃지:** `정기예금 만기 D-18`, `원리금보장 편중`, `DO 미등록`을 연결해 운용공백의 반복 방지에 초점을 맞췄다.
- **디지털 맥락:** 실제 앱 방문·타계좌 투자 이력은 없다. 향후 수익률 조회 등의 로그가 제공되면 관심 확인 질문을 보강할 수 있지만 현재 초안에는 사실로 넣지 않았다.
- **날짜:** 2026/10/17은 토요일이다. DATA의 만기일 표기와 실제 상환·예약 실행일을 구분해 원장에서 확인한다.

**원본 데이터·대화의 확인사항**

- 올해·작년 개인부담금 납입 0원, 잔여 900만원은 표시값이다. 총급여·자금 여력은 없다.
- 대화의 900만원 공제잔여와 연간 일반 납입한도 1,800만원은 서로 다른 한도다.
- 현금 1,000만원은 6/26 이후 95일 대기. 곧 만기될 7,000만원과 더해 이미 전액 현금인 것처럼 표현하지 않는다.
- 상담이력이 없으므로 실적배당 동의·DO 가입 의향·추가납입 계획을 만들지 않는다.
- 10/17 거래에 9월 금리를 적용한다고 약속하지 않는다.
- 상품별 수익률과 계좌 수익률은 기간·납입·평가 기준이 다를 수 있다. 또래 평균/상위군 수익률을 고객 목표나 상품 선택의 유일한 근거로 삼지 않는다.
- 사내 단말 실행·Hot Tip 로그인 접속은 미검증이다. S5는 해당 고객의 선택에 필요한 업무만 사용한다.

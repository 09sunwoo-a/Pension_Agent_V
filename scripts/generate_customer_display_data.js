const fs = require("fs");
const path = require("path");

const AS_OF_DATE = "2026-09-14";
const GENERATED_AT = "2026-09-14T07:00:00+09:00";
const OUTPUT_DIR = path.join(__dirname, "..", "data", "customer-display-data");

const products = {
  "DEP-002": { name: "농협은행 퇴직연금 정기예금", returns: { "1년": 3.37 } },
  "DEP-003": { name: "우리은행 퇴직연금 정기예금", returns: { "1년": 3.3 } },
  "DEP-005": { name: "신한은행 TOPS퇴직플랜 정기예금", returns: { "1년": 3.25 } },
  "DEP-008": { name: "한국증권금융 퇴직연금 정기예금", returns: { "1년": 3.8, "3년": 3.35 } },
  "SAV-001": { name: "KB저축은행 퇴직연금 정기예금", returns: { "1년": 3.5 } },
  "SAV-003": { name: "NH저축은행 퇴직연금 정기예금", returns: { "1년": 3.6 } },
  "SAV-007": { name: "한국투자저축은행 퇴직연금 정기예금", returns: { "1년": 3.75 } },
  "SAV-009": { name: "SBI저축은행 퇴직연금 정기예금", returns: { "1년": 3.85 } },
  "SAV-013": { name: "DB저축은행 퇴직연금 정기예금", returns: { "1년": 3.75 } },
  "GIC-001": { name: "KB손해보험 GIC (2026년 9월 특별제공안)", returns: { "1년": 3.8, "3년": 4.62 } },
  "GIC-003": { name: "한화생명 GIC (2026년 9월 특별제공안)", returns: { "1년": 4.0, "3년": 4.48 } },
  "MF-001": { name: "KB 온국민 TDF 시리즈", oneYearReturnPct: 15.27 },
  "MF-010": { name: "KB 드림스타 자산배분 안정형 (혼합-재간접)", oneYearReturnPct: 13.04 },
  "MF-017": { name: "교보악사 Tomorrow 장기우량K-1호 (채권)", oneYearReturnPct: -5.51 },
  "FND-001": { name: "키움더드림단기채증권투자신탁(채권)C-P2E(퇴직연금)", oneYearReturnPct: 2.52 },
  "FND-003": { name: "한국투자크레딧포커스ESG증권자투자신탁1호(채권)C-RE", oneYearReturnPct: 1.26 },
  "FND-005": { name: "KB글로벌단기채증권자투자신탁(채권-재간접형)(H)C-퇴직E", oneYearReturnPct: 1.58 },
  "FND-007": { name: "신한누버거버먼미국가치주증권투자신탁(H)(주식-재간접형)C-RE", oneYearReturnPct: 28.51 },
  "FND-008": { name: "삼성글로벌배당성장주증권자투자신탁H[주식] CPE(퇴직연금)", oneYearReturnPct: 20.36 },
  "FND-010": { name: "KB온국민평생소득TIF40증권자투자신탁(채권혼합-재간접)C-퇴직E", oneYearReturnPct: 6.1 },
  "ETF-005": { name: "RISE 글로벌자산배분액티브", oneYearReturnPct: 8.0 },
  "ETF-006": { name: "RISE 미국S&P500", oneYearReturnPct: 17.97 },
  "ETF-008": { name: "KODEX TDF2030액티브적격", oneYearReturnPct: 6.12 },
  "ETF-009": { name: "RISE TDF2050액티브적격", oneYearReturnPct: 21.56 },
  "ETF-010": { name: "SOL 미국배당다우존스", oneYearReturnPct: 26.89 },
  "DO-006": {
    name: "불려드림II",
    oneYearReturnPct: 15.9,
    allocationBreakdown: [{ assetType: "실적배당형", weightPct: 100.0 }]
  }
};

const defaultOptions = {
  "DO-001": { productName: "지켜드림", riskLevel: "초저위험" },
  "DO-002": { productName: "알파드림", riskLevel: "저위험" },
  "DO-003": { productName: "알파드림II", riskLevel: "저위험" },
  "DO-004": { productName: "알파드림III", riskLevel: "저위험" },
  "DO-005": { productName: "불려드림", riskLevel: "중위험" },
  "DO-006": { productName: "불려드림II", riskLevel: "중위험" },
  "DO-007": { productName: "불려드림III", riskLevel: "중위험" },
  "DO-008": { productName: "모두드림", riskLevel: "고위험" },
  "DO-009": { productName: "모두드림II", riskLevel: "고위험" },
  "DO-010": { productName: "모두드림III", riskLevel: "고위험" }
};

function registered(productId, applicationStatus = "미적용") {
  const product = defaultOptions[productId];
  return {
    registrationStatus: "등록",
    designatedProduct: { productId, ...product },
    applicationStatus
  };
}

function unregistered() {
  return { registrationStatus: "미등록", designatedProduct: null, applicationStatus: "미적용" };
}

function unknownDefaultOption() {
  return { registrationStatus: "미확인", designatedProduct: null, applicationStatus: null };
}

function holding(productId, assetType, productCategory, valuationAmountKrw, openedAt, contractTerm = null, flags = []) {
  const product = products[productId];
  if (!product) throw new Error(`Unknown product: ${productId}`);
  const oneYearReturnPct = contractTerm ? product.returns?.[contractTerm] : product.oneYearReturnPct;
  if (oneYearReturnPct === undefined) throw new Error(`Missing master return: ${productId}/${contractTerm || "1Y"}`);
  return {
    productId,
    productName: product.name,
    assetType,
    productCategory,
    contractTerm,
    valuationAmountKrw,
    oneYearReturnPct,
    openedAt,
    allocationBreakdown: product.allocationBreakdown || null,
    flags
  };
}

function cash(valuationAmountKrw) {
  return {
    productId: null,
    productName: "현금성자산",
    assetType: "현금성자산",
    productCategory: "현금성자산",
    contractTerm: null,
    valuationAmountKrw,
    oneYearReturnPct: null,
    openedAt: null,
    allocationBreakdown: null,
    flags: []
  };
}

const cases = [
  {
    id: "B01-22", title: "ISA 만기 고객에게, 전환금액별 공제효과를 보여주고 필요한 돈은 남기기",
    customer: ["54182-30764", "한지훈", 54, "남", "VIP", "안정추구형", "2021-06-18"],
    defaultOption: registered("DO-003"), tax: 2600000,
    holdings: [holding("SAV-003", "원리금보장형", "정기예금", 48000000, "2025-11-15", "1년"), holding("FND-003", "실적배당형", "채권형펀드", 29000000, "2026-02-04"), cash(5300000)]
  },
  {
    id: "B01-03", title: "세액공제는 이미 다 채웠지만, ISA 만기로 상담 기회가 다시 열린 고객",
    customer: ["47306-92158", "오민서", 46, "여", "그랜드", "위험중립형", "2020-11-06"],
    defaultOption: registered("DO-006", "운용중"), tax: 0,
    holdings: [holding("SAV-001", "원리금보장형", "정기예금", 24130000, "2025-12-09", "1년"), holding("DO-006", "실적배당형", "디폴트옵션", 35000000, "2024-07-22"), cash(4370000)]
  },
  {
    id: "B01-14", title: "연금저축은 꾸준히 납입하지만 IRP는 활용하지 않는 고객에게, 병행 납입 제안",
    customer: ["43195-68420", "정유진", 43, "여", "그랜드", "위험중립형", "2022-04-15"],
    defaultOption: registered("DO-005"), tax: 3800000,
    holdings: [holding("DEP-005", "원리금보장형", "정기예금", 14000000, "2025-10-21", "1년"), holding("FND-005", "실적배당형", "채권형펀드", 15000000, "2026-01-16"), cash(2600000)]
  },
  {
    id: "B02-27", title: "매달 IRP에 입금하지만 투자되지 않는 고객에게, 입금부터 운용까지 연결",
    customer: ["74182-30695", "김도윤", 38, "남", "베스트", "위험중립형", "2021-02-19"],
    defaultOption: registered("DO-006"), tax: 4800000,
    holdings: [holding("FND-010", "실적배당형", "TIF", 13480000, "2026-03-27"), cash(1200000)]
  },
  {
    id: "B02-04", title: "납입액을 늘리려는데, 기존 납입금부터 매번 투자되지 않고 있는 고객",
    customer: ["58304-91726", "한지우", 37, "여", "그랜드", "위험중립형", "2020-09-11"],
    defaultOption: registered("DO-006"), tax: null,
    holdings: [holding("FND-007", "실적배당형", "주식형펀드", 12000000, "2026-06-18"), holding("FND-003", "실적배당형", "채권형펀드", 9390000, "2026-03-17"), cash(1350000)]
  },
  {
    id: "B02-18", title: "투자성향이 달라졌는데 과거 디폴트옵션 실행을 앞둔 고객에게, 실행 전 운용안 조정",
    customer: ["92641-58307", "오현준", 34, "남", "VIP", "안정추구형", "2022-01-14"],
    defaultOption: registered("DO-009", "실행예정"), tax: 1800000,
    holdings: [holding("SAV-001", "원리금보장형", "정기예금", 47630000, "2026-01-20", "1년"), cash(8240000)]
  },
  {
    id: "B03-11", title: "정기예금 만기 고객에게, 안정성을 유지하면서 다음 운용조건을 비교",
    customer: ["61538-90427", "이정훈", 56, "남", "VIP", "안정형", "2017-03-10"],
    defaultOption: registered("DO-001"), tax: 4000000,
    holdings: [holding("DEP-002", "원리금보장형", "정기예금", 48620000, "2025-10-02", "1년"), holding("SAV-013", "원리금보장형", "정기예금", 26180000, "2026-01-25", "1년")]
  },
  {
    id: "B03-07", title: "타사 금리를 보고 이전하려는데, 현재 예금 만기가 얼마 남지 않은 고객",
    customer: ["38716-52049", "박서진", 35, "여", "그랜드", "안정추구형", "2018-09-21"],
    defaultOption: registered("DO-003"), tax: 2200000,
    holdings: [holding("DEP-003", "원리금보장형", "정기예금", 72400000, "2025-09-30", "1년"), cash(3100000)]
  },
  {
    id: "B03-20", title: "내년부터 연금을 받으려는 원리금보장형 고객에게, 수령 일정에 맞춘 만기 배치 제안",
    customer: ["80429-36175", "최영호", 63, "남", "VVIP", "안정형", "2015-08-28"],
    defaultOption: registered("DO-001"), tax: 0,
    holdings: [holding("DEP-008", "원리금보장형", "정기예금", 96400000, "2026-03-15", "3년"), holding("GIC-001", "원리금보장형", "GIC", 74750000, "2026-09-10", "3년"), cash(7200000)]
  },
  {
    id: "B04-15", title: "대면으로 개설한 IRP를 계속 쓰는 고객에게, 운용상품 변경 없이 비용절감 제안",
    customer: ["46281-73509", "문지환", 36, "남", "VIP", "위험중립형", "2016-05-23"],
    defaultOption: registered("DO-006"), tax: 3000000,
    holdings: [holding("SAV-001", "원리금보장형", "정기예금", 41600000, "2025-11-08", "1년"), holding("FND-003", "실적배당형", "채권형펀드", 26800000, "2024-06-18")]
  },
  {
    id: "B04-23", title: "수수료 때문에 이전을 신청한 고객에게, ‘얼마를 줄일 수 있는지’ 보여주기",
    customer: ["73915-28460", "정미경", 39, "여", "그랜드", "안정형", "2019-02-14"],
    defaultOption: registered("DO-001"), tax: 0,
    holdings: [holding("DEP-002", "원리금보장형", "정기예금", 68700000, "2026-02-05", "1년")]
  },
  {
    id: "B04-19", title: "여러 기관에 IRP가 나뉜 고객에게, 보유상품을 유지할 수 있는 통합관리 제안",
    customer: ["20857-64913", "서민재", 55, "남", "VIP", "위험중립형", "2016-06-10"],
    defaultOption: registered("DO-006"), tax: 1600000,
    holdings: [holding("SAV-013", "원리금보장형", "정기예금", 31900000, "2025-12-12", "1년"), holding("FND-005", "실적배당형", "채권형펀드", 20700000, "2024-10-21")]
  },
  {
    id: "B05-28", title: "일반통장으로 받은 퇴직금이 남아 있는 고객에게, 기한 내 IRP 재입금 제안",
    customer: ["57136-82049", "강수진", 58, "여", "베스트", "안정형", "2021-07-14"],
    defaultOption: unregistered(), tax: 6000000, holdings: []
  },
  {
    id: "B05-26", title: "일부 목돈 때문에 퇴직금 IRP를 전액 해지하려는 고객에게, 필요한 금액 중심 수령 제안",
    customer: ["84620-31579", "윤성호", 62, "남", "VIP", "안정형", "2017-10-20"],
    defaultOption: registered("DO-001"), tax: 0,
    holdings: [holding("GIC-003", "원리금보장형", "GIC", 90000000, "2026-09-10", "3년"), holding("DEP-003", "원리금보장형", "정기예금", 31000000, "2026-01-22", "1년"), holding("FND-010", "실적배당형", "TIF", 64400000, "2025-07-15"), cash(18000000)]
  },
  {
    id: "B05-09", title: "필요한 돈은 일부인데 IRP 전액해지를 문의했고, 보유펀드는 현금화에도 시간이 걸리는 고객",
    customer: ["32064-97815", "배정우", 61, "남", "VVIP", "적극투자형", "2015-04-24"],
    defaultOption: registered("DO-008"), tax: 0,
    holdings: [holding("FND-007", "실적배당형", "주식형펀드", 129800000, "2022-05-16"), holding("SAV-003", "원리금보장형", "정기예금", 68800000, "2026-01-09", "1년")]
  },
  {
    id: "B06-21", title: "생활비를 연금으로 받으려는 고객에게, 세후 수령액과 잔여자금 운용을 함께 설계",
    customer: ["69418-20357", "조영민", 60, "남", "VVIP", "안정추구형", "2016-09-02"],
    defaultOption: registered("DO-003"), tax: 0,
    holdings: [holding("GIC-001", "원리금보장형", "GIC", 90000000, "2026-09-03", "3년"), holding("DEP-008", "원리금보장형", "정기예금", 60000000, "2026-02-10", "1년"), holding("FND-010", "실적배당형", "TIF", 77800000, "2024-08-19"), cash(10000000)]
  },
  {
    id: "B06-13", title: "퇴직급여가 입금됐지만 상품을 정하지 않은 고객에게, 첫 운용방향 제안",
    customer: ["13570-84296", "신경호", 60, "남", "VIP", null, "2026-08-29"],
    defaultOption: unknownDefaultOption(), tax: 7000000, holdings: [cash(164700000)]
  },
  {
    id: "B06-10", title: "월분배형 ETF를 계속 보유하고 싶은데, 연금은 매월 정액으로 받으려는 고객",
    customer: ["90742-51638", "김은주", 57, "여", "VIP", "적극투자형", "2018-07-06"],
    defaultOption: registered("DO-008"), tax: 0,
    holdings: [holding("ETF-010", "실적배당형", "ETF", 86900000, "2024-12-02")]
  },
  {
    id: "B07-29", title: "연금개시를 앞둔 고객에게, 세액공제를 받지 않은 납입원금부터 확인·등록",
    customer: ["66317-49028", "김태성", 61, "남", "VIP", "안정추구형", "2014-08-22"],
    defaultOption: registered("DO-003"), tax: 0,
    holdings: [holding("SAV-001", "원리금보장형", "정기예금", 82000000, "2025-09-25", "1년"), holding("FND-010", "실적배당형", "TIF", 58400000, "2025-11-20"), cash(12000000)]
  },
  {
    id: "B07-30", title: "기본 공제한도를 채운 고객에게, 추가납입 원금과 운용수익의 혜택을 구분",
    customer: ["21784-65093", "이소연", 48, "여", "VVIP", "위험중립형", "2017-05-19"],
    defaultOption: registered("DO-006"), tax: 0,
    holdings: [holding("SAV-013", "원리금보장형", "정기예금", 42000000, "2025-10-02", "1년"), holding("FND-008", "실적배당형", "주식형펀드", 56000000, "2026-03-18"), cash(14700000)]
  },
  {
    id: "B07-32", title: "여러 연금계좌에서 수령하는 고객에게, 계좌별 금액이 아닌 연간 합산 수령계획 제안",
    customer: ["95831-27406", "고정민", 66, "남", "VIP", "안정형", "2012-03-09"],
    defaultOption: registered("DO-001"), tax: 0,
    holdings: [holding("GIC-001", "원리금보장형", "GIC", 90000000, "2026-09-09", "3년"), holding("DEP-002", "원리금보장형", "정기예금", 28000000, "2025-12-03", "1년"), holding("FND-010", "실적배당형", "TIF", 55600000, "2026-03-11"), cash(10000000)]
  },
  {
    id: "B08-01", title: "다른 계좌에서는 펀드를 사는데, IRP만 몇 달째 대기 중인 고객",
    customer: ["75203-41968", "임재현", 45, "남", "VIP", "적극투자형", "2019-05-10"],
    defaultOption: registered("DO-008"), tax: 4500000,
    holdings: [holding("SAV-001", "원리금보장형", "정기예금", 37400000, "2025-11-04", "1년"), cash(51800000)]
  },
  {
    id: "B08-12", title: "은퇴까지 기간이 충분하지만 예금으로만 운용하는 고객에게, 일부 분산투자 제안",
    customer: ["41829-76035", "백승우", 42, "남", "그랜드", "위험중립형", "2018-03-12"],
    defaultOption: registered("DO-006"), tax: 3400000,
    holdings: [holding("SAV-001", "원리금보장형", "정기예금", 46200000, "2026-01-30", "1년"), holding("DEP-003", "원리금보장형", "정기예금", 28400000, "2025-10-18", "1년")]
  },
  {
    id: "B08-05", title: "연금저축보험 납입이 끝났지만, 직접 관리가 부담돼 이전을 망설이는 고객",
    customer: ["26975-83104", "송혜진", 58, "여", "VIP", "안정추구형", "2022-06-17"],
    defaultOption: registered("DO-003"), tax: 2500000,
    holdings: [holding("GIC-003", "원리금보장형", "GIC", 38000000, "2026-09-05", "1년"), holding("FND-010", "실적배당형", "TIF", 22800000, "2024-03-15"), cash(4000000)]
  },
  {
    id: "B09-02", title: "상여금 추가납입으로, 높아진 주식 비중까지 함께 조정할 고객",
    customer: ["59318-24760", "오준석", 53, "남", "VVIP", "적극투자형", "2019-07-22"],
    defaultOption: registered("DO-008"), tax: 2000000,
    holdings: [holding("ETF-006", "실적배당형", "ETF", 62525000, "2024-06-12"), holding("FND-003", "실적배당형", "채권형펀드", 14350000, "2025-09-22"), holding("SAV-013", "원리금보장형", "정기예금", 25625000, "2026-02-06", "1년")]
  },
  {
    id: "B09-17", title: "연금수령은 가까운데 먼 빈티지의 TDF를 보유한 고객에게, 위험수준 조정 제안",
    customer: ["72461-90538", "문정희", 58, "여", "VIP", "적극투자형", "2021-11-05"],
    defaultOption: registered("DO-008"), tax: 700000,
    holdings: [holding("MF-001", "실적배당형", "TDF", 91416000, "2024-02-19"), holding("SAV-001", "원리금보장형", "정기예금", 25784000, "2025-12-01", "1년")]
  },
  {
    id: "B09-24", title: "투자성향은 달라졌지만 예전 디폴트옵션이 남아 있는 고객에게, 향후 운용설정 조정",
    customer: ["18642-57309", "차유진", 47, "여", "그랜드", "적극투자형", "2020-10-08"],
    defaultOption: registered("DO-001"), tax: 1500000,
    holdings: [holding("SAV-001", "원리금보장형", "정기예금", 52390000, "2026-01-15", "1년"), holding("FND-003", "실적배당형", "채권형펀드", 28210000, "2025-08-19")]
  },
  {
    id: "B10-08", title: "TDF가 알아서 관리한다고 생각하지만, 별도로 산 ETF 때문에 전체 위험이 커진 고객",
    customer: ["40725-68193", "장현수", 59, "남", "VVIP", "적극투자형", "2017-04-11"],
    defaultOption: registered("DO-008"), tax: 0,
    holdings: [holding("MF-001", "실적배당형", "TDF", 72000000, "2023-05-18"), holding("ETF-010", "실적배당형", "ETF", 30000000, "2026-08-27"), holding("SAV-001", "원리금보장형", "정기예금", 18000000, "2025-11-02", "1년")]
  },
  {
    id: "B10-16", title: "오래 보유한 부진펀드를 그대로 두는 고객에게, 대체상품 비교와 단계적 교체 제안",
    customer: ["85136-42907", "류성민", 34, "남", "VIP", "안정추구형", "2018-12-03"],
    defaultOption: registered("DO-003"), tax: 1200000,
    holdings: [holding("MF-017", "실적배당형", "채권형펀드", 65660000, "2019-05-14"), holding("SAV-001", "원리금보장형", "정기예금", 28140000, "2025-10-14", "1년")]
  },
  {
    id: "B10-25", title: "손실 상태의 판매중단 펀드를 계속 보유하는 고객에게, 유지와 교체의 실익 비교",
    customer: ["31579-86420", "한미경", 37, "여", "VIP", "안정추구형", "2018-02-07"],
    defaultOption: registered("DO-003"), tax: 800000,
    holdings: [holding("MF-017", "실적배당형", "채권형펀드", 57680000, "2018-10-26"), holding("SAV-003", "원리금보장형", "정기예금", 24720000, "2025-12-16", "1년")]
  }
];

function agentEvent(이벤트식별자, 발생일시, 이벤트유형, 관련보유상품식별자, 금액원, 처리상태 = "완료", 채널 = null) {
  return {
    이벤트식별자,
    발생일시,
    이벤트유형,
    계좌구분: "IRP",
    관련보유상품식별자,
    금액원,
    처리상태,
    채널
  };
}

function agentMetric(지표식별자, 지표유형, 지표명, 값, 단위 = null, 대상참조 = null) {
  return { 지표식별자, 지표유형, 지표명, 대상참조, 값, 단위, 산출기준일: AS_OF_DATE };
}

function agentContext({
  고객계획 = {},
  납입및세제 = {},
  계좌운영 = {},
  퇴직및인출 = {},
  최근사건 = [],
  금융거래 = [],
  상담이력 = [],
  외부계좌 = [],
  투자성향이력 = [],
  운용정책 = {},
  상품진단 = [],
  계산지표 = [],
  확인된특이사항 = []
}) {
  return {
    스키마버전: "customer-agent-context.v0.1",
    고객계획,
    납입및세제,
    계좌운영,
    퇴직및인출,
    최근사건,
    금융거래,
    상담이력,
    외부계좌,
    투자성향이력,
    운용정책,
    상품진단,
    계산지표,
    확인된특이사항
  };
}

const agentContexts = {
  "B02-27": agentContext({
    고객계획: {
      대기발생사유: null,
      대기자금사용계획: null,
      향후자동매수희망여부: null,
      원금보장선호여부: null,
      손실감내범위: null
    },
    납입및세제: {
      개인부담금자동이체: {
        등록여부: true,
        월이체금액원: 600000,
        이체일: 20,
        최근이체일: "2026-08-20",
        다음이체예정일: "2026-09-21"
      }
    },
    계좌운영: {
      입금시매수상품: {
        설정여부: false,
        지정상품: []
      }
    },
    최근사건: [
      agentEvent("T001", "2026-02-20T08:30:00+09:00", "개인부담금자동이체입금", null, 600000),
      agentEvent("T002", "2026-03-20T08:30:00+09:00", "개인부담금자동이체입금", null, 600000),
      agentEvent("T003", "2026-03-27T14:18:00+09:00", "매수", "H001", 1200000),
      agentEvent("T004", "2026-04-20T08:30:00+09:00", "개인부담금자동이체입금", null, 600000),
      agentEvent("T005", "2026-05-20T08:30:00+09:00", "개인부담금자동이체입금", null, 600000),
      agentEvent("T006", "2026-06-22T08:30:00+09:00", "개인부담금자동이체입금", null, 600000),
      agentEvent("T007", "2026-06-26T15:02:00+09:00", "매수", "H001", 1800000),
      agentEvent("T008", "2026-07-20T08:30:00+09:00", "개인부담금자동이체입금", null, 600000),
      agentEvent("T009", "2026-08-20T08:30:00+09:00", "개인부담금자동이체입금", null, 600000)
    ],
    계산지표: [
      agentMetric("M001", "횟수", "최근 7개월 개인부담금 입금횟수", 7, "회"),
      agentMetric("M002", "횟수", "최근 7개월 상품 매수횟수", 2, "회"),
      agentMetric("M003", "기간", "최근 두 상품 매수 사이 간격", 91, "일", ["T003", "T007"]),
      agentMetric("M004", "기간", "마지막 상품 매수 후 경과일수", 80, "일", "T007"),
      agentMetric("M005", "기간", "현재 대기자금의 최장 대기일수", 56, "일", "T008")
    ]
  }),
  "B02-04": agentContext({
    고객계획: {
      개인형퇴직연금자동이체증액의향: true,
      희망증액금액원: null,
      월부담가능증액금액원: null,
      대기발생사유: null,
      대기자금사용계획: null,
      향후자동매수희망여부: null,
      원금보장선호여부: null,
      손실감내범위: null
    },
    납입및세제: {
      개인부담금자동이체: {
        등록여부: true,
        월이체금액원: 450000,
        이체일: 10,
        최근이체일: "2026-09-10",
        다음이체예정일: "2026-10-12"
      },
      타연금계좌올해납입액원: null
    },
    계좌운영: {
      입금시매수상품: {
        설정여부: false,
        지정상품: []
      }
    },
    최근사건: [
      agentEvent("T001", "2026-02-10T08:30:00+09:00", "개인부담금자동이체입금", null, 450000),
      agentEvent("T002", "2026-03-10T08:30:00+09:00", "개인부담금자동이체입금", null, 450000),
      agentEvent("T003", "2026-03-17T13:41:00+09:00", "매수", "H002", 900000),
      agentEvent("T004", "2026-04-10T08:30:00+09:00", "개인부담금자동이체입금", null, 450000),
      agentEvent("T005", "2026-05-11T08:30:00+09:00", "개인부담금자동이체입금", null, 450000),
      agentEvent("T006", "2026-06-10T08:30:00+09:00", "개인부담금자동이체입금", null, 450000),
      agentEvent("T007", "2026-06-18T14:07:00+09:00", "매수", "H001", 1350000),
      agentEvent("T008", "2026-07-10T08:30:00+09:00", "개인부담금자동이체입금", null, 450000),
      agentEvent("T009", "2026-08-10T08:30:00+09:00", "개인부담금자동이체입금", null, 450000),
      agentEvent("T010", "2026-09-10T08:30:00+09:00", "개인부담금자동이체입금", null, 450000)
    ],
    상담이력: [
      {
        상담식별자: "CRM001",
        상담일시: "2026-09-08T16:10:00+09:00",
        상담채널: "영업점전화",
        상담유형: "퇴직연금사후관리",
        상담메모: "고객은 연말 세액공제를 위해 현재 월 45만원인 IRP 자동이체 금액을 늘리고 싶다고 문의함. 희망 증액 금액은 아직 정하지 않음."
      }
    ],
    계산지표: [
      agentMetric("M001", "횟수", "최근 8개월 개인부담금 입금횟수", 8, "회"),
      agentMetric("M002", "횟수", "최근 8개월 상품 매수횟수", 2, "회"),
      agentMetric("M003", "기간", "최근 두 상품 매수 사이 간격", 93, "일", ["T003", "T007"]),
      agentMetric("M004", "기간", "마지막 상품 매수 후 경과일수", 88, "일", "T007"),
      agentMetric("M005", "기간", "현재 대기자금의 최장 대기일수", 66, "일", "T008")
    ],
    확인된특이사항: [
      {
        구분: "납입계획",
        내용: "연말 세액공제를 위해 IRP 자동이체를 증액하려는 의향은 확인됐으나 희망 증액 금액은 확인되지 않음"
      }
    ]
  }),
  "B02-18": agentContext({
    고객계획: {
      이번자금원금보장우선여부: null,
      감수가능변동성: null,
      디폴트옵션변경의향: null,
      실행예정자금직접운용의향: null,
      실행예정자금사용시점: null,
      실행예정자금유지가능기간: null
    },
    계좌운영: {
      디폴트옵션실행예정: {
        실행예정식별자: "DOEXEC001",
        예정일: "2026-09-18",
        대상금액원: 8240000,
        상태: "실행예정",
        적용예정상품식별자: "DO-009",
        적용예정상품명: "모두드림II",
        적용예정위험등급: "고위험",
        근거지정일: "2024-11-18"
      }
    },
    최근사건: [
      agentEvent("T001", "2024-11-18T10:05:00+09:00", "디폴트옵션등록", null, null),
      agentEvent("T002", "2026-09-04T14:20:00+09:00", "투자성향변경", null, null),
      agentEvent("T003", "2026-09-08T09:00:00+09:00", "디폴트옵션실행예정안내", "H002", 8240000, "실행전", "시스템")
    ],
    투자성향이력: [
      {
        이력식별자: "R001",
        분석일: "2024-11-15",
        투자성향: "적극투자형",
        현재여부: false
      },
      {
        이력식별자: "R002",
        분석일: "2026-09-04",
        투자성향: "안정추구형",
        현재여부: true
      }
    ],
    계산지표: [
      agentMetric("M001", "기간", "투자성향 변경 후 경과일수", 10, "일", "R002"),
      agentMetric("M002", "기간", "디폴트옵션 실행까지 남은 일수", 4, "일", "DOEXEC001"),
      agentMetric("M003", "상태비교", "현재 투자성향과 지정 디폴트옵션 위험등급 일치 여부", false, null, ["R002", "DO-009"])
    ],
    확인된특이사항: [
      {
        구분: "설정불일치",
        내용: "현재 투자성향은 안정추구형이지만 2024년에 지정한 고위험 디폴트옵션이 실행예정 상태임"
      }
    ]
  })
};

const GOLDEN_DIR = path.join(__dirname, "..", "data", "golden-cases");

function loadGoldenCases() {
  const loaded = {};
  const files = fs.readdirSync(GOLDEN_DIR)
    .filter((fileName) => fileName.includes("Golden_Case") && fileName.endsWith(".md"))
    .sort();

  for (const fileName of files) {
    const markdown = fs.readFileSync(path.join(GOLDEN_DIR, fileName), "utf8");
    const jsonBlocks = markdown.matchAll(/(```|~~~)json\s*([\s\S]*?)\s*\1/g);
    for (const match of jsonBlocks) {
      let parsed;
      try {
        parsed = JSON.parse(match[2]);
      } catch {
        continue;
      }
      const caseId = parsed.메타정보?.케이스ID;
      if (!caseId) continue;
      if (loaded[caseId]) throw new Error(`Golden case 중복: ${caseId}`);
      loaded[caseId] = parsed;
    }
  }

  if (Object.keys(loaded).length !== 30) {
    throw new Error(`Golden case 파싱 결과 ${Object.keys(loaded).length}건 (기대값 30건)`);
  }
  return loaded;
}

function normalizeAgentKey(key) {
  let normalized = key
    .replaceAll("IRP", "개인형퇴직연금")
    .replaceAll("ISA", "개인종합자산관리계좌")
    .replaceAll("ETF", "상장지수펀드")
    .replaceAll("TDF", "타깃데이트펀드")
    .replaceAll("ID", "식별자");
  if (normalized.endsWith("금액") || normalized.endsWith("잔액") || normalized.endsWith("세액") || normalized.endsWith("수령액") || normalized.endsWith("필요액") || normalized.endsWith("부담액") || normalized.endsWith("환급금") || normalized.endsWith("납입액") || normalized.endsWith("유입액") || normalized.endsWith("예정액") || normalized.endsWith("환급액")) {
    normalized += "원";
  }
  return normalized;
}

function normalizeAgentValue(value) {
  if (Array.isArray(value)) return value.map(normalizeAgentValue);
  if (!value || typeof value !== "object") return value;
  const normalized = {};
  for (const [key, nestedValue] of Object.entries(value)) {
    if (key === "정보출처") continue;
    normalized[normalizeAgentKey(key)] = normalizeAgentValue(nestedValue);
  }
  return normalized;
}

function normalizeDateTime(value) {
  if (!value) return value;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00+09:00` : value;
}

function normalizeGoldenEvent(event, displayRecord) {
  const relatedId = event.관련보유상품ID ?? event.관련상품ID ?? null;
  const currentHoldingIds = new Set(displayRecord.holdings.map((item) => item.holdingId));
  const currentHoldingId = relatedId && currentHoldingIds.has(relatedId) ? relatedId : null;
  let accountType = event.계좌구분;
  if (!accountType && event.이벤트유형 === "퇴직급여일반통장입금") accountType = "일반계좌";
  if (!accountType && event.이벤트유형 === "연금저축보험납입완료") accountType = "연금저축보험";
  if (!accountType) accountType = "IRP";
  const normalized = {
    이벤트식별자: event.이벤트ID,
    발생일시: normalizeDateTime(event.발생일시 ?? event.발생일),
    이벤트유형: event.이벤트유형,
    계좌구분: accountType,
    관련보유상품식별자: currentHoldingId,
    금액원: event.금액 ?? null,
    처리상태: event.처리상태 ?? event.처리결과 ?? null,
    채널: event.채널 ?? null
  };
  if (relatedId && !currentHoldingId) normalized.관련과거상품식별자 = relatedId;
  return normalized;
}

function normalizeGoldenTransaction(transaction) {
  return {
    거래식별자: transaction.거래ID,
    거래일시: normalizeDateTime(transaction.거래일시),
    계좌구분: transaction.계좌구분,
    상품마스터식별자: transaction.상품마스터ID ?? null,
    상품명: transaction.상품명 ?? null,
    상품유형: transaction.상품유형,
    상품분류: transaction.상품분류,
    거래유형: transaction.거래유형,
    거래금액원: transaction.거래금액,
    채널: transaction.채널 ?? null
  };
}

function normalizeGoldenConsultation(consultation) {
  return {
    상담식별자: consultation.상담ID,
    상담일시: normalizeDateTime(consultation.상담일시 ?? consultation.상담일),
    상담채널: consultation.상담채널 ?? null,
    상담유형: consultation.상담유형 ?? consultation.기록유형 ?? null,
    상담메모: consultation.상담메모
  };
}

function normalizeProfileHistory(history) {
  const sorted = [...history].sort((a, b) => (a.분석일 ?? a.평가일).localeCompare(b.분석일 ?? b.평가일));
  return sorted.map((item, index) => ({
    이력식별자: item.이력ID,
    분석일: item.분석일 ?? item.평가일,
    투자성향: item.투자성향,
    현재여부: item.현재여부 ?? index === sorted.length - 1
  }));
}

function flattenExternalAccounts(externalAccounts) {
  if (!externalAccounts) return [];
  const flattened = [];
  for (const [accountType, accounts] of Object.entries(externalAccounts)) {
    if (!Array.isArray(accounts)) continue;
    for (const account of accounts) {
      flattened.push({
        외부계좌구분: accountType,
        ...normalizeAgentValue(account)
      });
    }
  }
  return flattened;
}

function metricUnit(metricName) {
  if (metricName.includes("퍼센트포인트") || metricName.includes("비중포인트")) return "%p";
  if (metricName.includes("비중") || metricName.includes("수익률") || metricName.includes("손실률")) return "%";
  if (metricName.includes("금액") || metricName.includes("한도") || metricName.includes("수령액") || metricName.includes("잔여액") || metricName.includes("평가손익") || metricName.includes("세액") || metricName.includes("납입액") || metricName.includes("유입액") || metricName.includes("예정액") || metricName.includes("환급액")) return "원";
  if (metricName.includes("일수")) return "일";
  if (metricName.includes("연수") || metricName.includes("년수")) return "년";
  if (metricName.includes("횟수")) return "회";
  if (metricName.includes("기관수") || metricName.includes("계좌수")) return "개";
  if (metricName.includes("이벤트수") || metricName.includes("건수")) return "건";
  return null;
}

function dateDifferenceInDays(fromDate, toDate) {
  return Math.round((Date.parse(`${toDate}T00:00:00Z`) - Date.parse(`${fromDate}T00:00:00Z`)) / 86400000);
}

function adjustDayMetric(metricName, value, goldenAsOfDate) {
  if (typeof value !== "number" || !metricName.includes("일수")) return value;
  const delta = dateDifferenceInDays(goldenAsOfDate, AS_OF_DATE);
  if (metricName.includes("까지남은일수")) return value - delta;
  if (metricName.includes("후경과일수") || metricName.includes("대기일수") || metricName.includes("보유기간일수")) return value + delta;
  return value;
}

const nullComputedRoutes = {
  고객계획: new Set([
    "IRP추가입금확정금액", "가격변동감수가능금액", "기존전략유지의향",
    "기존주식형펀드조정의향", "남은운용가능기간", "디폴트옵션변경의향", "만기유지예상금액",
    "보유지속사유", "일부교체수용의향", "장기운용가능금액", "즉시이전예상금액",
    "테마형ETF투자목적", "현재TDF위험유지의향", "현재보유상품변경의향", "현재위험수준유지의향"
  ]),
  납입및세제: new Set(["예상환급세액", "재입금가능금액"]),
  계좌운영: new Set([
    "비대면전환후예상부담액", "실물이전가능금액", "예상절감액", "타사이전후예상부담액",
    "현금화필요금액", "현재수수료부담액"
  ]),
  퇴직및인출: new Set([
    "ETF유지와정액수령우선순위", "수리비지급까지남은일수", "수리비필요금액", "연금개시초기수령금액",
    "연금개시후장기잔여금액", "연금수령가능액", "연금수령한도", "예상세후수령액", "월분배금액",
    "월생활비필요액", "월세후생활비필요액", "월정액희망금액", "은퇴초기필요금액", "장기잔여자금",
    "전액해지시예상세후금액", "첫1~2년필요자금", "초기수령재원부족액", "필요금액수령시예상세후금액",
    "필요세전연금수령액", "필요환매금액", "환매대금입금예정일"
  ]),
  상품진단: new Set(["IRP이전예상금액", "현재보험유지예상금액", "합산주식노출비중", "현재평가손익"])
};

const knownComputedRoutes = {
  고객계획: new Set(["운용선택지확대희망여부", "직접펀드관리부담여부", "손실인지여부", "유지교체결정상태"])
};

function routeKnownComputedValue(context, key, value) {
  for (const [domain, keys] of Object.entries(knownComputedRoutes)) {
    if (!keys.has(key)) continue;
    context[domain][normalizeAgentKey(key)] = value;
    return true;
  }
  return false;
}

function routeNullComputedValue(context, key) {
  for (const [domain, keys] of Object.entries(nullComputedRoutes)) {
    if (!keys.has(key)) continue;
    const normalizedKey = normalizeAgentKey(key);
    if (domain === "상품진단") {
      context.상품진단.push({ 진단구분: "미산출지표", 지표명: key, 값: null });
    } else {
      context[domain][normalizedKey] = null;
    }
    return;
  }
  throw new Error(`미분류 null 계산값: ${key}`);
}

const screenCustomerRoutes = {
  재직상태: "고객계획",
  은퇴계획: "고객계획",
  연금수령계획: "퇴직및인출"
};

const screenAccountRoutes = {
  개인부담금자동이체: "납입및세제",
  퇴직급여재원금액: "납입및세제",
  개인부담금재원금액: "납입및세제",
  올해개인부담금납입액: "납입및세제",
  입금시매수상품: "계좌운영",
  디폴트옵션실행예정: "계좌운영",
  만기후운용설정: "계좌운영",
  계좌유형: "계좌운영",
  개설채널: "계좌운영",
  수수료현황: "계좌운영",
  계약이전현황: "계좌운영",
  상품운용지시: "계좌운영",
  연금수령계획: "퇴직및인출",
  연금수령요건충족여부: "퇴직및인출",
  연금수령한도: "퇴직및인출",
  예상세후수령액: "퇴직및인출",
  전액해지문의: "퇴직및인출",
  전액해지요청: "퇴직및인출",
  확인된자금사용계획: "퇴직및인출",
  잔여자금계속운용의향: "퇴직및인출",
  연금개시준비여부: "퇴직및인출",
  연금수령희망: "퇴직및인출",
  수령요구우선순위: "퇴직및인출",
  연금수령필요상황: "퇴직및인출"
};

function assignRoutedFields(context, source, baseFields, routes, sourceName) {
  for (const [key, value] of Object.entries(source ?? {})) {
    if (baseFields.has(key)) continue;
    const domain = routes[key];
    if (!domain) throw new Error(`${sourceName} 미분류 필드: ${key}`);
    context[domain][normalizeAgentKey(key)] = normalizeAgentValue(value);
  }
}

function buildAgentContextFromGolden(golden, displayRecord) {
  const context = agentContext({});
  const display = golden.화면직접표시데이터 ?? {};
  const customer = display.고객정보 ?? {};
  const account = display.IRP계좌현황 ?? {};
  const agent = golden.에이전트판단용데이터 ?? {};

  const baseCustomerFields = new Set(["고객식별자", "고객명", "나이", "성별", "스타클럽등급", "투자성향", "IRP계좌신규일", "디폴트옵션"]);
  const baseAccountFields = new Set(["평가금액", "원리금보장형금액", "원리금보장형비중", "실적배당형금액", "실적배당형비중", "고유계정대금액", "고유계정대비중", "계좌수익률", "세액공제잔여한도", "최근상품신규일", "최근신규상품명"]);
  assignRoutedFields(context, customer, baseCustomerFields, screenCustomerRoutes, `${golden.메타정보.케이스ID} 고객정보`);
  assignRoutedFields(context, account, baseAccountFields, screenAccountRoutes, `${golden.메타정보.케이스ID} 계좌현황`);

  context.최근사건 = (agent.최근거래및변화 ?? [])
    .map((event) => normalizeGoldenEvent(event, displayRecord))
    .sort((a, b) => a.발생일시.localeCompare(b.발생일시));
  context.금융거래 = (agent.당행상품거래시그널 ?? []).map(normalizeGoldenTransaction);
  context.상담이력 = (agent.상담이력 ?? []).map(normalizeGoldenConsultation);
  context.외부계좌 = flattenExternalAccounts(agent.외부금융정보);
  context.투자성향이력 = normalizeProfileHistory(agent.투자성향이력 ?? []);

  if ((agent.디지털행동 ?? []).length > 0) {
    throw new Error(`${golden.메타정보.케이스ID}: 디지털행동 표준 모듈 결정 필요`);
  }

  const baseAgentFields = new Set(["최근거래및변화", "외부금융정보", "디지털행동", "당행상품거래시그널", "상담이력", "투자성향이력"]);
  for (const [key, value] of Object.entries(agent)) {
    if (baseAgentFields.has(key)) continue;
    if (key === "목표자산배분이력") {
      context.운용정책[normalizeAgentKey(key)] = normalizeAgentValue(value);
    } else if (key === "상품운용이력요약" || key === "자산노출분석") {
      context.상품진단.push({ 진단구분: key, ...normalizeAgentValue(value) });
    } else if (key === "성과비교자료") {
      context.상품진단.push(...value.map((item) => ({ 진단구분: "성과비교", ...normalizeAgentValue(item) })));
    } else if (["연금수령계획", "당행IRP연금수령", "생활비필수수령액", "조정가능수령액"].includes(key)) {
      context.퇴직및인출[normalizeAgentKey(key)] = normalizeAgentValue(value);
    } else if (["개인부담금납입이력", "미공제원금확인", "올해연금계좌납입현황", "여유자금"].includes(key)) {
      context.납입및세제[normalizeAgentKey(key)] = normalizeAgentValue(value);
    } else {
      throw new Error(`${golden.메타정보.케이스ID} 에이전트 미분류 필드: ${key}`);
    }
  }

  let metricIndex = 1;
  for (const [key, originalValue] of Object.entries(golden.파생데이터?.계산값 ?? {})) {
    if (originalValue === null) {
      routeNullComputedValue(context, key);
      continue;
    }
    if (routeKnownComputedValue(context, key, originalValue)) continue;
    const value = adjustDayMetric(key, originalValue, golden.메타정보.기준일);
    context.계산지표.push(agentMetric(
      `M${String(metricIndex).padStart(3, "0")}`,
      "파생값",
      key,
      value,
      metricUnit(key)
    ));
    metricIndex += 1;
  }
  return context;
}

const goldenCases = loadGoldenCases();

function distributeTenths(amounts) {
  const total = amounts.reduce((sum, amount) => sum + amount, 0);
  if (total === 0) return amounts.map(() => 0);
  const raw = amounts.map((amount) => amount * 1000 / total);
  const tenths = raw.map(Math.floor);
  let remaining = 1000 - tenths.reduce((sum, value) => sum + value, 0);
  const order = raw.map((value, index) => ({ index, remainder: value - Math.floor(value) }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (let i = 0; i < remaining; i += 1) tenths[order[i].index] += 1;
  return tenths.map((value) => value / 10);
}

function buildDisplayRecord(source) {
  const [customerId, name, age, gender, starClubGrade, investmentProfile, irpOpenedAt] = source.customer;
  const holdings = source.holdings.map((item, index) => ({
    holdingId: `H${String(index + 1).padStart(3, "0")}`,
    productId: item.productId,
    productName: item.productName,
    assetType: item.assetType,
    productCategory: item.productCategory,
    contractTerm: item.contractTerm,
    valuationAmountKrw: item.valuationAmountKrw,
    weightPct: null,
    oneYearReturnPct: item.oneYearReturnPct,
    openedAt: item.openedAt,
    allocationBreakdown: item.allocationBreakdown,
    flags: item.flags
  }));
  const total = holdings.reduce((sum, item) => sum + item.valuationAmountKrw, 0);
  const holdingWeights = distributeTenths(holdings.map((item) => item.valuationAmountKrw));
  holdings.forEach((item, index) => { item.weightPct = holdingWeights[index]; });

  const assetTypes = ["원리금보장형", "실적배당형", "현금성자산"];
  const assetAmounts = assetTypes.map((assetType) => holdings
    .filter((item) => item.assetType === assetType)
    .reduce((sum, item) => sum + item.valuationAmountKrw, 0));
  const assetWeights = distributeTenths(assetAmounts);
  const assetAllocation = assetTypes.map((assetType, index) => ({
    assetType,
    amountKrw: assetAmounts[index],
    weightPct: assetWeights[index]
  }));

  const returnNumerator = holdings.reduce((sum, item) => sum + item.valuationAmountKrw * (item.oneYearReturnPct || 0), 0);
  const oneYearReturnPct = total === 0 ? null : Math.round((returnNumerator / total) * 10) / 10;
  const datedHoldings = holdings.filter((item) => item.openedAt).sort((a, b) => b.openedAt.localeCompare(a.openedAt));
  const latest = datedHoldings[0] || null;

  const record = {
    schemaVersion: "customer-briefing-display.v0.1",
    briefingMeta: {
      caseId: source.id,
      dataType: "시연용가상고객",
      asOfDate: AS_OF_DATE,
      generatedAt: GENERATED_AT,
      currency: "KRW"
    },
    customer: {
      customerId,
      name,
      age,
      gender,
      starClubGrade,
      investmentProfile,
      irpOpenedAt,
      defaultOption: source.defaultOption
    },
    signals: [],
    irpAccount: {
      valuationAmountKrw: total,
      assetAllocation,
      oneYearReturnPct,
      taxDeductionRemainingKrw: source.tax,
      latestProductOpening: latest ? {
        holdingId: latest.holdingId,
        productId: latest.productId,
        productName: latest.productName,
        openedAt: latest.openedAt,
        amountKrw: latest.valuationAmountKrw
      } : null
    },
    holdings
  };
  record["에이전트맥락데이터"] = agentContexts[source.id]
    ?? buildAgentContextFromGolden(goldenCases[source.id], record);
  return record;
}

const expectedCaseIds = [
  "B01-22", "B01-03", "B01-14", "B02-27", "B02-04", "B02-18",
  "B03-11", "B03-07", "B03-20", "B04-15", "B04-23", "B04-19",
  "B05-28", "B05-26", "B05-09", "B06-21", "B06-13", "B06-10",
  "B07-29", "B07-30", "B07-32", "B08-01", "B08-12", "B08-05",
  "B09-02", "B09-17", "B09-24", "B10-08", "B10-16", "B10-25"
];

const profileRisk = {
  "안정형": ["초저위험"],
  "안정추구형": ["저위험"],
  "위험중립형": ["중위험"],
  "적극투자형": ["고위험"],
  "공격투자형": ["고위험"]
};
const intentionalDefaultOptionMismatch = new Set(["B02-18", "B09-24"]);

function validate(records) {
  const errors = [];
  const warnings = [];
  const assert = (condition, message) => { if (!condition) errors.push(message); };
  const ids = records.map((record) => record.briefingMeta.caseId);
  const names = records.map((record) => record.customer.name);
  const customerIds = records.map((record) => record.customer.customerId);

  assert(records.length === 30, `레코드 수 ${records.length}건`);
  assert(new Set(ids).size === 30, "caseId 중복");
  assert(new Set(names).size === 30, "고객명 중복");
  assert(new Set(customerIds).size === 30, "고객식별자 중복");
  assert(expectedCaseIds.every((id) => ids.includes(id)), "제작대상 caseId 누락");

  for (const record of records) {
    const prefix = record.briefingMeta.caseId;
    const total = record.holdings.reduce((sum, item) => sum + item.valuationAmountKrw, 0);
    const allocationTotal = record.irpAccount.assetAllocation.reduce((sum, item) => sum + item.amountKrw, 0);
    const holdingWeight = record.holdings.reduce((sum, item) => sum + item.weightPct, 0);
    const allocationWeight = record.irpAccount.assetAllocation.reduce((sum, item) => sum + item.weightPct, 0);
    assert(total === record.irpAccount.valuationAmountKrw, `${prefix}: 보유상품 합계 불일치`);
    assert(allocationTotal === total, `${prefix}: 자산배분 합계 불일치`);
    assert(record.holdings.length === 0 ? holdingWeight === 0 : Math.abs(holdingWeight - 100) < 0.001, `${prefix}: 보유상품 비중 합계 불일치`);
    assert(total === 0 ? allocationWeight === 0 : Math.abs(allocationWeight - 100) < 0.001, `${prefix}: 자산배분 비중 합계 불일치`);
    assert(record.customer.irpOpenedAt <= AS_OF_DATE, `${prefix}: IRP 신규일이 기준일 이후`);
    assert(record.signals.length === 0, `${prefix}: 헤더 배지는 비어 있어야 함`);

    for (const item of record.holdings) {
      if (item.productId === null) {
        assert(item.productName === "현금성자산" && item.oneYearReturnPct === null, `${prefix}: 현금성자산 규칙 위반`);
        continue;
      }
      const master = products[item.productId];
      assert(Boolean(master), `${prefix}: 상품 마스터에 없는 ID ${item.productId}`);
      assert(master?.name === item.productName, `${prefix}: ${item.productId} 상품명 불일치`);
      const expectedReturn = item.contractTerm ? master?.returns?.[item.contractTerm] : master?.oneYearReturnPct;
      assert(expectedReturn === item.oneYearReturnPct, `${prefix}: ${item.productId} 수익률 불일치`);
      assert(item.openedAt >= record.customer.irpOpenedAt && item.openedAt <= AS_OF_DATE, `${prefix}: ${item.productId} 신규일 범위 오류`);
    }

    const option = record.customer.defaultOption;
    if (option.registrationStatus === "등록") {
      assert(Boolean(option.designatedProduct), `${prefix}: 등록 디폴트옵션 상품 누락`);
      const masterOption = defaultOptions[option.designatedProduct?.productId];
      assert(Boolean(masterOption), `${prefix}: 디폴트옵션 마스터 ID 오류`);
      assert(masterOption?.productName === option.designatedProduct?.productName, `${prefix}: 디폴트옵션 상품명 불일치`);
      assert(masterOption?.riskLevel === option.designatedProduct?.riskLevel, `${prefix}: 디폴트옵션 위험등급 불일치`);
      if (!intentionalDefaultOptionMismatch.has(prefix) && record.customer.investmentProfile) {
        assert(profileRisk[record.customer.investmentProfile]?.includes(option.designatedProduct.riskLevel), `${prefix}: 투자성향-디폴트옵션 불일치`);
      }
      if (option.applicationStatus === "운용중") {
        assert(record.holdings.some((item) => item.productId === option.designatedProduct.productId), `${prefix}: 운용중 디폴트옵션 보유상품 누락`);
      }
    } else {
      assert(option.designatedProduct === null, `${prefix}: 미등록/미확인 상품은 null이어야 함`);
    }
    if (option.registrationStatus === "미등록") assert(option.applicationStatus === "미적용", `${prefix}: 미등록 적용상태 오류`);
    if (option.registrationStatus === "미확인") assert(option.applicationStatus === null, `${prefix}: 미확인 적용상태 오류`);
  }

  const byId = Object.fromEntries(records.map((record) => [record.briefingMeta.caseId, record]));
  const amount = (id, type) => byId[id].irpAccount.assetAllocation.find((item) => item.assetType === type).amountKrw;
  const agentContextIds = expectedCaseIds;
  const recordsWithAgentContext = records.filter((record) => record["에이전트맥락데이터"]);
  assert(recordsWithAgentContext.length === 30, `에이전트 맥락 생성 대상 ${recordsWithAgentContext.length}건`);
  assert(agentContextIds.every((id) => byId[id]["에이전트맥락데이터"]), "에이전트 맥락 누락");
  assert(!JSON.stringify(recordsWithAgentContext).includes("openQuestions"), "제외하기로 한 openQuestions가 포함됨");

  const englishAgentKeys = [];
  const collectEnglishKeys = (value, location) => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => collectEnglishKeys(item, `${location}[${index}]`));
      return;
    }
    if (!value || typeof value !== "object") return;
    for (const [key, nestedValue] of Object.entries(value)) {
      if (/[A-Za-z]/.test(key)) englishAgentKeys.push(`${location}.${key}`);
      collectEnglishKeys(nestedValue, `${location}.${key}`);
    }
  };

  for (const id of agentContextIds) {
    const record = byId[id];
    const context = record["에이전트맥락데이터"];
    collectEnglishKeys(context, id);
    assert(context.스키마버전 === "customer-agent-context.v0.1", `${id}: 에이전트 맥락 스키마 버전 오류`);
    assert(Array.isArray(context.최근사건), `${id}: 최근사건 형식 오류`);
    assert(Array.isArray(context.계산지표), `${id}: 계산지표 형식 오류`);
    assert(context.최근사건.every((event, index, events) => index === 0 || events[index - 1].발생일시 <= event.발생일시), `${id}: 최근사건 시간순 정렬 오류`);
    const holdingIds = new Set(record.holdings.map((item) => item.holdingId));
    assert(context.최근사건.every((event) => event.관련보유상품식별자 === null || holdingIds.has(event.관련보유상품식별자)), `${id}: 최근사건의 보유상품 참조 오류`);
  }
  assert(englishAgentKeys.length === 0, `에이전트 맥락에 영문 필드 존재: ${englishAgentKeys.slice(0, 3).join(", ")}`);
  assert(!JSON.stringify(recordsWithAgentContext).includes("정보출처"), "제외하기로 한 정보출처 필드가 포함됨");

  const contextCount = (field) => records.reduce((sum, record) => sum + record["에이전트맥락데이터"][field].length, 0);
  assert(contextCount("최근사건") === 40, `최근사건 원천 누락: ${contextCount("최근사건")}/40`);
  assert(contextCount("상담이력") === 11, `상담이력 원천 누락: ${contextCount("상담이력")}/11`);
  assert(contextCount("외부계좌") === 8, `외부계좌 원천 누락: ${contextCount("외부계좌")}/8`);
  assert(contextCount("금융거래") === 2, `금융거래 원천 누락: ${contextCount("금융거래")}/2`);
  assert(contextCount("투자성향이력") === 4, `투자성향이력 원천 누락: ${contextCount("투자성향이력")}/4`);

  const metricValue = (id, name) => byId[id]["에이전트맥락데이터"].계산지표.find((metric) => metric.지표명 === name)?.값;
  assert(metricValue("B02-27", "마지막 상품 매수 후 경과일수") === 80, "B02-27: 분석 기준일 기준 경과일수 오류");
  assert(metricValue("B02-04", "현재 대기자금의 최장 대기일수") === 66, "B02-04: 분석 기준일 기준 대기일수 오류");
  assert(metricValue("B02-18", "디폴트옵션 실행까지 남은 일수") === 4, "B02-18: 분석 기준일 기준 실행 D-day 오류");
  assert(metricValue("B03-07", "정기예금만기까지남은일수") === 16, "B03-07: 분석 기준일 기준 만기 D-day 오류");
  assert(metricValue("B05-28", "퇴직급여수령후경과일수") === 24, "B05-28: 분석 기준일 기준 수령 경과일 오류");
  assert(metricValue("B05-28", "IRP재입금기한까지남은일수") === 36, "B05-28: 분석 기준일 기준 재입금 D-day 오류");
  assert(metricValue("B08-01", "현금성대기일수") === 122, "B08-01: 분석 기준일 기준 대기일수 오류");
  assert(metricValue("B09-02", "상여금유입후경과일수") === 10, "B09-02: 분석 기준일 기준 상여금 경과일 오류");
  assert(metricValue("B10-08", "ETF추가후경과일수") === 18, "B10-08: 분석 기준일 기준 ETF 매수 경과일 오류");
  assert(byId["B02-04"].irpAccount.taxDeductionRemainingKrw === null, "B02-04: 확인되지 않은 세액공제 잔여한도는 null이어야 함");
  assert(byId["B02-27"].holdings.find((item) => item.holdingId === "H001")?.openedAt === "2026-03-27", "B02-27: 최초 상품 매수일과 상품 신규일 불일치");
  assert(amount("B08-01", "현금성자산") / byId["B08-01"].irpAccount.valuationAmountKrw > 0.5, "B08-01: 현금성 대기비중이 절반 이하여서 브리핑과 불일치");
  assert(amount("B08-12", "원리금보장형") === byId["B08-12"].irpAccount.valuationAmountKrw, "B08-12: 원리금보장 100% 불일치");
  assert(byId["B02-18"].customer.defaultOption.applicationStatus === "실행예정", "B02-18: 디폴트옵션 실행예정 누락");
  assert(byId["B09-17"].holdings.find((item) => item.productCategory === "TDF")?.weightPct === 78, "B09-17: TDF 78% 불일치");
  assert(byId["B10-08"].holdings.find((item) => item.productCategory === "TDF")?.weightPct === 60, "B10-08: TDF 60% 불일치");
  assert(byId["B10-08"].holdings.find((item) => item.productCategory === "ETF")?.weightPct === 25, "B10-08: ETF 25% 불일치");
  assert(byId["B05-26"]["에이전트맥락데이터"].퇴직및인출.확인된자금사용계획.필요금액원 === 10000000, "B05-26: 확인된 실제 필요금액 누락");
  assert(byId["B06-13"]["에이전트맥락데이터"].계좌운영.상품운용지시.지시여부 === false, "B06-13: 상품 미지시 상태 누락");
  assert(metricValue("B07-32", "2026년사적연금과세대상합산예정액") === 17000000, "B07-32: 사적연금 합산예정액 오류");
  assert(byId["B10-08"]["에이전트맥락데이터"].상품진단.some((item) => item.중복주식노출확인여부 === true), "B10-08: 중복 주식노출 진단 누락");
  assert(byId["B10-16"]["에이전트맥락데이터"].상품진단.some((item) => item.성과차이퍼센트포인트 === -6.1), "B10-16: 성과비교 자료 누락");
  assert(byId["B10-25"]["에이전트맥락데이터"].고객계획.손실인지여부 === true, "B10-25: 손실 인지 사실 누락");
  assert(byId["B10-16"].holdings[0].weightPct === 70 && byId["B10-16"].holdings[0].oneYearReturnPct < 0, "B10-16: 부진펀드 핵심 조건 불일치");
  assert(byId["B10-25"].holdings[0].weightPct === 70 && byId["B10-25"].holdings[0].oneYearReturnPct < 0, "B10-25: 손실 펀드 핵심 조건 불일치");
  warnings.push("B07 고객브리핑 원문은 B08 후보 01·12·05가 복제된 상태다. B07 표시 데이터는 제작대상 목록과 후보 통합본의 29·30·32를 우선했다.");
  warnings.push("PRODUCT_MASTER에는 TDF 2055의 독립 상품 ID가 없어 B09-17은 마스터의 MF-001 ‘KB 온국민 TDF 시리즈’로 표시했다. 2055 빈티지 사실은 Golden case에 유지된다.");
  warnings.push("B10-16·B10-25의 원 Golden에는 판매중단 펀드의 정식 상품 ID가 없으므로, 화면 표시용으로 마스터 내 음(-)의 1년 수익률 상품 MF-017을 사용했다. 판매중단 상태 자체는 표시 스키마 범위 밖이다.");
  return { errors, warnings };
}

const records = cases.map(buildDisplayRecord);
const validation = validate(records);
if (validation.errors.length) {
  throw new Error(`Validation failed:\n${validation.errors.map((error) => `- ${error}`).join("\n")}`);
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
for (const record of records) {
  fs.writeFileSync(path.join(OUTPUT_DIR, `${record.briefingMeta.caseId}.json`), `${JSON.stringify(record, null, 2)}\n`, "utf8");
}
fs.writeFileSync(path.join(OUTPUT_DIR, "all-customers.json"), `${JSON.stringify(records, null, 2)}\n`, "utf8");

const usedProductIds = [...new Set(records.flatMap((record) => record.holdings.map((item) => item.productId).filter(Boolean)))].sort();
const usedDefaultOptionIds = [...new Set(records.map((record) => record.customer.defaultOption.designatedProduct?.productId).filter(Boolean))].sort();
const ageDistribution = records.reduce((counts, record) => {
  const band = `${Math.floor(record.customer.age / 10) * 10}대`;
  counts[band] = (counts[band] || 0) + 1;
  return counts;
}, {});
const report = `# 고객 표시용 데이터 검증 보고서

> 생성일: ${AS_OF_DATE} 07:00 KST  
> 스키마: \`customer-briefing-display.v0.1\`

## 결과

- JSON 레코드: **${records.length}/30 PASS**
- 고유 고객명: **${new Set(records.map((record) => record.customer.name)).size}/30 PASS**
- 고유 고객식별자: **${new Set(records.map((record) => record.customer.customerId)).size}/30 PASS**
- 고유 caseId: **${new Set(records.map((record) => record.briefingMeta.caseId)).size}/30 PASS**
- 연령대 분포: **30대 ${ageDistribution["30대"] || 0}명 / 40대 ${ageDistribution["40대"] || 0}명 / 50대 ${ageDistribution["50대"] || 0}명 / 60대 ${ageDistribution["60대"] || 0}명**
- 보유상품 합계 = IRP 평가금액: **30/30 PASS**
- 자산유형 합계 = IRP 평가금액: **30/30 PASS**
- 표시 비중 합계: **30/30 PASS** (잔여배분 방식으로 소수점 첫째 자리 100.0 보정, 0원 계좌 제외)
- 상품 ID·상품명·1년 수익률/기간금리 일치: **PASS**
- 디폴트옵션 등록·상품·적용상태 규칙: **PASS**
- 투자성향과 디폴트옵션 위험등급: **PASS** (의도된 불일치 B02-18·B09-24 제외)
- IRP 신규일 ≤ 상품 신규일 ≤ 분석 기준일: **PASS**
- 헤더 배지: **전 건 빈 배열**
- 에이전트 맥락 데이터: **30/30 PASS** (한글 필드, \`openQuestions\` 제외)
- Golden case 근거 보존: **최근사건 40건 / 상담이력 11건 / 외부계좌 8건 / 금융거래 2건 / 투자성향이력 4건**
- 에이전트 계산지표: **${records.reduce((sum, record) => sum + record["에이전트맥락데이터"].계산지표.length, 0)}건** (분석 기준일 ${AS_OF_DATE}로 날짜 차이 보정)
- 생성값 출처 필드: **제외**

## 사용한 상품 마스터 ID

- 보유상품: ${usedProductIds.map((id) => `\`${id}\``).join(", ")}
- 디폴트옵션: ${usedDefaultOptionIds.map((id) => `\`${id}\``).join(", ")}

## 의도적으로 유지한 예외

- **B02-18**: 현재 안정추구형이지만 과거 고위험 디폴트옵션 \`DO-009 모두드림II\`가 실행예정이다.
- **B09-24**: 현재 적극투자형이지만 과거 초저위험 디폴트옵션 \`DO-001 지켜드림\`이 미적용 상태로 남아 있다.
- **B05-28**: 디폴트옵션 미등록 고객이다.
- **B06-13**: 투자성향과 디폴트옵션 등록 여부를 확인하지 못한 고객이라 해당 값을 \`null\`/\`미확인\`으로 유지했다.

## 원천자료 주의사항

${validation.warnings.map((warning) => `- ${warning}`).join("\n")}
`;
fs.writeFileSync(path.join(OUTPUT_DIR, "validation-report.md"), report, "utf8");

console.log(`Generated ${records.length} customer JSON files in ${OUTPUT_DIR}`);
console.log(`Unique names: ${new Set(records.map((record) => record.customer.name)).size}`);
console.log(`Unique customer IDs: ${new Set(records.map((record) => record.customer.customerId)).size}`);
console.log(`Warnings: ${validation.warnings.length}`);

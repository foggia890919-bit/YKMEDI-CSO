/* =========================================================
   시세표 데이터 — 매일 시세가 바뀌면 이 파일의 숫자만 수정하세요.
   금액 단위: 원
   - price: 출고가
   - support[통신사][가입유형]: 지원금 합계(공시+추가+매장)
   - plan: 가입 시 유지 요금제 안내
   실구매가 = 출고가 - 지원금 (음수면 "차비 지급"으로 표시)
   ========================================================= */
const PHONES = [
  {
    id: "s26-ultra",
    name: "갤럭시 S26 울트라",
    storage: "256GB",
    brand: "samsung",
    price: 1698400,
    hot: true,
    badge: "오늘의 특가",
    plan: "월 109,000원 요금제 6개월 유지",
    colors: ["티타늄 블랙", "티타늄 그레이", "티타늄 블루"],
    support: {
      SKT: { mnp: 1150000, chg: 820000 },
      KT:  { mnp: 1190000, chg: 850000 },
      LGU: { mnp: 1230000, chg: 880000 },
    },
  },
  {
    id: "s26-plus",
    name: "갤럭시 S26 플러스",
    storage: "256GB",
    brand: "samsung",
    price: 1353000,
    hot: true,
    badge: "인기",
    plan: "월 109,000원 요금제 6개월 유지",
    colors: ["블랙", "실버", "아이시 블루"],
    support: {
      SKT: { mnp: 1050000, chg: 760000 },
      KT:  { mnp: 1090000, chg: 790000 },
      LGU: { mnp: 1120000, chg: 810000 },
    },
  },
  {
    id: "s26",
    name: "갤럭시 S26",
    storage: "256GB",
    brand: "samsung",
    price: 1155000,
    hot: true,
    badge: "차비폰",
    plan: "월 89,000원 요금제 6개월 유지",
    colors: ["블랙", "화이트", "민트"],
    support: {
      SKT: { mnp: 1180000, chg: 870000 },
      KT:  { mnp: 1210000, chg: 900000 },
      LGU: { mnp: 1250000, chg: 930000 },
    },
  },
  {
    id: "zflip7",
    name: "갤럭시 Z 플립7",
    storage: "256GB",
    brand: "samsung",
    price: 1485000,
    hot: true,
    badge: "역대급 딜",
    plan: "월 99,000원 요금제 6개월 유지",
    colors: ["블루 쉐도우", "제트 블랙", "코랄 레드"],
    support: {
      SKT: { mnp: 1250000, chg: 900000 },
      KT:  { mnp: 1300000, chg: 940000 },
      LGU: { mnp: 1350000, chg: 980000 },
    },
  },
  {
    id: "zfold7",
    name: "갤럭시 Z 폴드7",
    storage: "512GB",
    brand: "samsung",
    price: 2398000,
    hot: false,
    badge: "",
    plan: "월 109,000원 요금제 6개월 유지",
    colors: ["블루 쉐도우", "실버 쉐도우", "제트 블랙"],
    support: {
      SKT: { mnp: 1100000, chg: 780000 },
      KT:  { mnp: 1150000, chg: 820000 },
      LGU: { mnp: 1200000, chg: 860000 },
    },
  },
  {
    id: "iphone17-pro-max",
    name: "아이폰 17 프로맥스",
    storage: "256GB",
    brand: "apple",
    price: 1990000,
    hot: true,
    badge: "인기",
    plan: "월 109,000원 요금제 6개월 유지",
    colors: ["코스믹 오렌지", "딥 블루", "실버"],
    support: {
      SKT: { mnp: 720000, chg: 480000 },
      KT:  { mnp: 760000, chg: 510000 },
      LGU: { mnp: 800000, chg: 540000 },
    },
  },
  {
    id: "iphone17-pro",
    name: "아이폰 17 프로",
    storage: "256GB",
    brand: "apple",
    price: 1790000,
    hot: false,
    badge: "",
    plan: "월 109,000원 요금제 6개월 유지",
    colors: ["코스믹 오렌지", "딥 블루", "실버"],
    support: {
      SKT: { mnp: 700000, chg: 460000 },
      KT:  { mnp: 740000, chg: 490000 },
      LGU: { mnp: 780000, chg: 520000 },
    },
  },
  {
    id: "iphone17",
    name: "아이폰 17",
    storage: "256GB",
    brand: "apple",
    price: 1290000,
    hot: true,
    badge: "오늘의 특가",
    plan: "월 89,000원 요금제 6개월 유지",
    colors: ["라벤더", "미스트 블루", "블랙", "화이트"],
    support: {
      SKT: { mnp: 820000, chg: 560000 },
      KT:  { mnp: 860000, chg: 590000 },
      LGU: { mnp: 900000, chg: 620000 },
    },
  },
  {
    id: "iphone17-air",
    name: "아이폰 17 에어",
    storage: "256GB",
    brand: "apple",
    price: 1590000,
    hot: false,
    badge: "",
    plan: "월 99,000원 요금제 6개월 유지",
    colors: ["스카이 블루", "라이트 골드", "클라우드 화이트", "스페이스 블랙"],
    support: {
      SKT: { mnp: 750000, chg: 500000 },
      KT:  { mnp: 790000, chg: 530000 },
      LGU: { mnp: 830000, chg: 560000 },
    },
  },
  {
    id: "a56",
    name: "갤럭시 A56",
    storage: "128GB",
    brand: "samsung",
    price: 599500,
    hot: true,
    badge: "차비폰",
    plan: "월 69,000원 요금제 4개월 유지",
    colors: ["어썸 그라파이트", "어썸 라이트그레이", "어썸 핑크"],
    support: {
      SKT: { mnp: 640000, chg: 450000 },
      KT:  { mnp: 660000, chg: 470000 },
      LGU: { mnp: 690000, chg: 490000 },
    },
  },
  {
    id: "iphone16e",
    name: "아이폰 16e",
    storage: "128GB",
    brand: "apple",
    price: 990000,
    hot: false,
    badge: "",
    plan: "월 79,000원 요금제 4개월 유지",
    colors: ["블랙", "화이트"],
    support: {
      SKT: { mnp: 600000, chg: 400000 },
      KT:  { mnp: 630000, chg: 420000 },
      LGU: { mnp: 660000, chg: 450000 },
    },
  },
  {
    id: "quantum6",
    name: "갤럭시 퀀텀6",
    storage: "128GB",
    brand: "samsung",
    price: 619300,
    hot: false,
    badge: "",
    plan: "월 69,000원 요금제 4개월 유지",
    colors: ["네이비", "실버"],
    support: {
      SKT: { mnp: 580000, chg: 410000 },
      KT:  { mnp: 610000, chg: 430000 },
      LGU: { mnp: 650000, chg: 460000 },
    },
  },
];

/* 구매후기 — 실제 후기가 쌓이면 교체하세요 */
const REVIEWS = [
  { name: "김*수", model: "갤럭시 S26 울트라", rating: 5, date: "2026-06-08",
    text: "매장 여러 군데 발품 팔다가 여기가 제일 저렴해서 바로 개통했어요. 조건 숨김 없이 전부 설명해주셔서 믿음이 갔습니다." },
  { name: "이*영", model: "아이폰 17", rating: 5, date: "2026-06-05",
    text: "카톡으로 문의 남겼더니 1분 만에 답장 와서 깜짝 놀랐네요. 택배 개통으로 다음날 바로 받았습니다." },
  { name: "박*준", model: "갤럭시 Z 플립7", rating: 5, date: "2026-06-02",
    text: "부가서비스 가입 강요 없고, 안내받은 금액 그대로 개통됐어요. 부모님 폰도 여기서 바꿔드리려고요." },
  { name: "최*민", model: "아이폰 17 프로맥스", rating: 4, date: "2026-05-28",
    text: "재고 확인부터 개통까지 친절하게 안내해주셨습니다. 시세표 보고 갔는데 금액 그대로였어요." },
  { name: "정*아", model: "갤럭시 A56", rating: 5, date: "2026-05-25",
    text: "어머니 효도폰으로 구매했는데 차비까지 챙겨주셨어요. 설명도 어르신 눈높이로 해주셔서 감사했습니다." },
  { name: "한*결", model: "갤럭시 S26", rating: 5, date: "2026-05-21",
    text: "번호이동으로 진행했는데 위약금 조회부터 요금제 추천까지 한 번에 해결됐습니다. 강추!" },
];

/* 자주 묻는 질문 */
const FAQS = [
  { q: "정말 추가 조건이 없나요?",
    a: "네. 저희는 제휴카드 가입, 부가서비스 가입, 기기 반납 조건 없이 시세표에 안내된 금액 그대로 개통해 드립니다. 요금제 유지 기간만 안내드린 대로 지켜주시면 됩니다." },
  { q: "택배(비대면) 개통도 가능한가요?",
    a: "가능합니다. 신분증 진위확인 후 비대면으로 개통해 드리며, 당일 오후 4시 이전 접수 시 대부분 다음날 수령 가능합니다." },
  { q: "기존 휴대폰 위약금이 남아있는데 괜찮나요?",
    a: "상담 시 남은 위약금과 할부금을 함께 조회해 드리고, 번호이동/기기변경 중 더 유리한 쪽으로 안내해 드립니다." },
  { q: "요금제는 언제 변경할 수 있나요?",
    a: "기종별로 안내된 유지 기간(보통 4~6개월) 이후 자유롭게 변경 가능합니다. 유지 기간은 시세표와 상담 시 다시 한번 안내드립니다." },
  { q: "시세는 얼마나 자주 바뀌나요?",
    a: "통신사 정책에 따라 매일 변동됩니다. 시세표 금액은 당일 기준이며, 정확한 금액은 문의 남겨주시면 실시간으로 확인해 드립니다." },
];

/* =========================================================
   상세페이지 부가 정보 — 매장 정책에 맞게 수정하세요
   ========================================================= */

/* 구매 혜택 (상세페이지 "구매 혜택" 섹션) */
const SHOP_BENEFITS = [
  { icon: "🎁", title: "정품 케이스 + 강화필름 증정", desc: "구매 즉시 풀커버 강화필름 부착 서비스와 정품 케이스를 함께 드립니다." },
  { icon: "🚚", title: "오후 4시 이전 결제 시 당일 발송", desc: "전국 어디서나 다음날 수령. 송장번호 실시간 안내." },
  { icon: "🔄", title: "쓰던 폰 중고 시세 최고가 매입", desc: "개통과 동시에 기존 휴대폰을 당일 시세 최고가로 매입해 드립니다." },
  { icon: "📲", title: "데이터 이전 + 초기 설정 무료", desc: "사진·연락처·카톡 백업부터 eSIM 설정까지 무료로 도와드립니다." },
  { icon: "🛡", title: "개통 후 1:1 전담 케어", desc: "요금제 변경 시점 알림, A/S 안내 등 개통 이후까지 책임집니다." },
  { icon: "💳", title: "현금완납 · 카드 무이자 할부", desc: "부담 없는 결제 방법을 선택하세요. 카드 무이자 개월 수는 상담 시 안내." },
];

/* 통신사 제휴카드 추가 할인 — 예시 데이터, 실제 운영 카드로 교체하세요 */
const CARD_DISCOUNTS = {
  SKT: [
    { name: "T 제휴 신용카드 A", monthly: 17000, condition: "전월 실적 30만원 이상" },
    { name: "T 제휴 신용카드 B", monthly: 10000, condition: "전월 실적 30만원 이상" },
  ],
  KT: [
    { name: "KT 제휴 슈퍼카드 A", monthly: 17000, condition: "전월 실적 30만원 이상" },
    { name: "KT 제휴 슈퍼카드 B", monthly: 11000, condition: "전월 실적 30만원 이상" },
  ],
  LGU: [
    { name: "U+ 제휴카드 A", monthly: 17000, condition: "전월 실적 30만원 이상" },
    { name: "U+ 제휴카드 B", monthly: 12000, condition: "전월 실적 30만원 이상" },
  ],
};

/* 인터넷·가족 결합 할인 — 예시 데이터, 실제 결합상품으로 교체하세요 */
const INTERNET_BUNDLES = {
  SKT: [
    { name: "인터넷 + 휴대폰 결합", monthly: 13200, desc: "기가 인터넷과 결합 시 통신요금 월 할인" },
    { name: "가족 결합 (2~5인)", monthly: 20000, desc: "가족 회선 수에 따라 인당 요금 추가 할인 (최대 기준)" },
  ],
  KT: [
    { name: "인터넷 + 휴대폰 총액결합", monthly: 11000, desc: "인터넷 속도 상품에 따라 월 할인" },
    { name: "가족 결합", monthly: 22000, desc: "결합 회선 수에 따라 추가 할인 (최대 기준)" },
  ],
  LGU: [
    { name: "인터넷 + 휴대폰 결합", monthly: 13200, desc: "기가 인터넷 결합 시 월 할인" },
    { name: "가족 무한사랑 결합", monthly: 20000, desc: "가족 회선 수에 따라 추가 할인 (최대 기준)" },
  ],
};

/* 복지 요금 감면 (정부 제도 — 통신 3사 공통, 상담 시 자격 확인) */
const WELFARE_DISCOUNTS = [
  { target: "국가유공자 (전상·공상군경 등)", benefit: "기본료·통화료 35% 감면", note: "국가보훈부 등록 대상자" },
  { target: "장애인", benefit: "기본료·통화료 35% 감면", note: "장애인복지법 등록 대상자" },
  { target: "기초생활수급자 (생계·의료급여)", benefit: "기본 감면 26,000원 + 통화료 50% (월 최대 33,500원)", note: "" },
  { target: "주거·교육급여 수급자 / 차상위계층", benefit: "기본 감면 11,000원 + 통화료 35% (월 최대 21,500원)", note: "" },
  { target: "기초연금 수급자 (만 65세 이상)", benefit: "요금 50% 감면 (월 최대 11,000원)", note: "" },
];

/* 통신사 요금제 목록 — 계산기에서 선택. 실제 판매 요금제로 교체하세요 */
const PLANS = {
  SKT: [
    { name: "5GX 프리미엄", monthly: 125000 },
    { name: "5GX 프라임플러스", monthly: 109000 },
    { name: "5GX 프라임", monthly: 99000 },
    { name: "5GX 레귤러플러스", monthly: 89000 },
    { name: "5GX 레귤러", monthly: 79000 },
    { name: "베이직플러스", monthly: 69000 },
    { name: "컴팩트플러스", monthly: 59000 },
    { name: "컴팩트", monthly: 49000 },
  ],
  KT: [
    { name: "초이스 프리미엄", monthly: 130000 },
    { name: "초이스 스페셜", monthly: 110000 },
    { name: "초이스 베이직", monthly: 90000 },
    { name: "베이직", monthly: 80000 },
    { name: "심플 70GB", monthly: 69000 },
    { name: "슬림플러스", monthly: 61000 },
    { name: "슬림", monthly: 55000 },
  ],
  LGU: [
    { name: "5G 시그니처", monthly: 130000 },
    { name: "5G 프리미어 슈퍼", monthly: 115000 },
    { name: "5G 프리미어 플러스", monthly: 105000 },
    { name: "5G 프리미어 에센셜", monthly: 85000 },
    { name: "5G 스탠다드", monthly: 75000 },
    { name: "5G 데이터 플러스", monthly: 66000 },
    { name: "5G 라이트+", monthly: 55000 },
  ],
};

/* 할부 수수료 연이율 (통신사 공통 5.9%) */
const INSTALLMENT_APR = 0.059;

/* 용량 옵션 — 기종별 용량과 출고가. 없으면 기본 용량 하나만 표시됩니다 */
const STORAGE_OPTIONS = {
  "s26-ultra": [
    { label: "256GB", price: 1698400 },
    { label: "512GB", price: 1853500 },
    { label: "1TB", price: 2156000 },
  ],
  "s26-plus": [
    { label: "256GB", price: 1353000 },
    { label: "512GB", price: 1507000 },
  ],
  "s26": [
    { label: "256GB", price: 1155000 },
    { label: "512GB", price: 1309000 },
  ],
  "zflip7": [
    { label: "256GB", price: 1485000 },
    { label: "512GB", price: 1639000 },
  ],
  "zfold7": [
    { label: "256GB", price: 2238500 },
    { label: "512GB", price: 2398000 },
    { label: "1TB", price: 2706000 },
  ],
  "iphone17-pro-max": [
    { label: "256GB", price: 1990000 },
    { label: "512GB", price: 2330000 },
    { label: "1TB", price: 2670000 },
  ],
  "iphone17-pro": [
    { label: "256GB", price: 1790000 },
    { label: "512GB", price: 2130000 },
  ],
  "iphone17": [
    { label: "256GB", price: 1290000 },
    { label: "512GB", price: 1630000 },
  ],
  "iphone17-air": [
    { label: "256GB", price: 1590000 },
    { label: "512GB", price: 1930000 },
  ],
};

/* 선택약정(요금 25% 할인) 선택 시 적용되는 매장 추가지원금
   기종별로 직접 지정하려면 PHONES에 extraSupport 필드를 추가하세요.
   미지정 시 해당 통신사 지원금의 30%를 만원 단위로 반올림해 사용합니다. */
function extraSupportOf(phone, carrier, join) {
  if (typeof phone.extraSupport === "number") return phone.extraSupport;
  return Math.round((phone.support[carrier][join] * 0.3) / 10000) * 10000;
}

/* 복지 요금 감면 계산 옵션 (정부 제도 근사치 — 정확한 금액은 상담 시 확인) */
const WELFARE_OPTIONS = [
  { name: "국가유공자 — 기본료 35% 감면", calc: (plan) => Math.round(plan * 0.35) },
  { name: "장애인 — 기본료 35% 감면", calc: (plan) => Math.round(plan * 0.35) },
  { name: "기초생활수급자(생계·의료) — 월 최대 33,500원", calc: (plan) => Math.min(33500, 26000 + Math.round(Math.max(plan - 26000, 0) * 0.5)) },
  { name: "주거·교육급여/차상위 — 월 최대 21,500원", calc: (plan) => Math.min(21500, 11000 + Math.round(Math.max(plan - 11000, 0) * 0.35)) },
  { name: "기초연금 수급자(만 65세+) — 50% 감면, 월 최대 11,000원", calc: (plan) => Math.min(11000, Math.round(plan * 0.5)) },
];

/* 유의사항 아코디언 */
const NOTICES = [
  { title: "기종 안내사항",
    body: "단말기 색상과 용량은 재고 상황에 따라 달라질 수 있으며, 상담 시 실시간 재고를 확인해 드립니다. 전시/중고 제품이 아닌 통신사 정품 새 제품만 취급합니다." },
  { title: "개통 혜택 유의사항",
    body: "시세표의 지원금은 안내된 요금제 유지 기간을 채우는 조건이며, 유지 기간 내 요금제를 임의 변경할 경우 차액이 청구될 수 있습니다. 선택약정(25% 요금할인)은 약정 기간(12/24개월) 내 해지 시 할인반환금이 발생할 수 있습니다." },
  { title: "제조사 혜택 유의사항",
    body: "제조사 사전예약 사은품 및 보상 프로그램(트레이드인 등)은 제조사 정책에 따라 변경·조기 종료될 수 있으며, 신청 기한을 지난 경우 적용이 불가할 수 있습니다." },
  { title: "카드·결합 할인 유의사항",
    body: "제휴카드 할인은 카드사 전월 실적 조건 충족 시 적용되며, 인터넷 결합 할인은 결합 상품 가입 및 유지 조건이 있습니다. 자세한 내용은 상담 시 안내드립니다." },
];

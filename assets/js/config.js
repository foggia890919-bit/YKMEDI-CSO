/* =========================================================
   사이트 전역 설정 — 이 파일만 수정하면 사이트 전체에 반영됩니다.
   ========================================================= */
const SITE_CONFIG = {
  // 상호/브랜드 (원하는 매장 이름으로 변경하세요)
  brandName: "폰드림",
  brandNameEn: "PHONEDREAM",
  slogan: "온라인 휴대폰 성지, 전국 최저가 도전",

  // 연락처
  phone: "010-0000-0000",          // 대표 전화번호
  kakaoChannelUrl: "https://pf.kakao.com/_xxxxxx/chat", // 카카오톡 채널 채팅 URL
  openHours: "평일/주말 10:00 ~ 21:00 (연중무휴)",

  // 매장 정보 (푸터/사업자 표기)
  companyName: "폰드림",
  ceo: "홍길동",
  bizNumber: "000-00-00000",        // 사업자등록번호
  salesRegNumber: "제0000-서울강남-0000호", // 통신판매업 신고번호
  preOpenNumber: "",                // 사전승낙서 번호 (이동통신 판매점 필수)
  address: "서울특별시 강남구 테헤란로 000, 1층",
  email: "contact@example.com",

  // 문의 폼 백엔드 (Google Apps Script 배포 URL — backend/README.md 참고)
  inquiryEndpoint: "",              // 예: https://script.google.com/macros/s/XXXX/exec

  // 광고 추적 코드 (메타/유튜브 광고용 — 발급 후 입력하면 자동 적용)
  metaPixelId: "",                  // Meta(페이스북/인스타) 픽셀 ID
  ga4Id: "",                        // Google 애널리틱스 4 측정 ID (G-XXXX) — 유튜브/구글 광고 전환용
  // 운영 도메인 (OG 태그 절대경로용)
  siteUrl: "https://example.com",
};

/* 통신사 목록 */
const CARRIERS = [
  { id: "SKT", name: "SKT", color: "#3617ce" },
  { id: "KT", name: "KT", color: "#d71826" },
  { id: "LGU", name: "LG U+", color: "#e6007e" },
];

/* 가입 유형 */
const JOIN_TYPES = [
  { id: "mnp", name: "번호이동" },
  { id: "chg", name: "기기변경" },
];

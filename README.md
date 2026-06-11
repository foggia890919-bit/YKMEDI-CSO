# 폰드림 — 휴대폰 판매점 홈페이지

온라인 휴대폰 성지형 판매점 홈페이지입니다. 정적 사이트(HTML/CSS/JS)라서
GitHub Pages, Netlify, 카페24 등 어디에나 무료로 올릴 수 있습니다.

## 페이지 구성

| 파일 | 내용 |
|---|---|
| `index.html` | 메인 — 히어로, 오늘의 최저가, 실시간 시세표, 이용방법, 후기, FAQ, **문의 폼**, 매장안내 |
| `price.html` | 전체 시세표 — 통신사(SKT/KT/LG U+) × 가입유형(번호이동/기기변경) 비교, 기종 검색 |
| `goods.html?id=기종ID` | 상품 상세 — 통신사별 가격 카드 + 해당 기종 구매 상담 폼 |
| `reviews.html` | 구매후기 |
| `guide.html` | 구매 가이드 — 용어 설명, 택배개통 절차, FAQ |
| `admin.html` | (관리자용) 접수된 문의 목록 조회 |

## 운영하면서 수정할 파일은 딱 2개

1. **`assets/js/config.js`** — 상호, 전화번호, 카톡채널, 주소, 사업자번호, 픽셀/GA ID, 문의 백엔드 URL
2. **`assets/js/data.js`** — 시세표 금액(매일), 구매후기, FAQ

코드 몰라도 숫자/문구만 바꾸면 사이트 전체에 반영됩니다.

## 문의 자동화 (저장 + 카톡/문자 발송)

```
문의 폼 제출 → 구글시트 저장 → 사장님께 SMS 알림 → 고객에게 알림톡/문자 자동응답
```

설정 방법: **[backend/README.md](backend/README.md)** (약 10~20분 소요, 서버비 0원)

## 광고 (메타 · 유튜브) 준비사항

- `config.js`에 `metaPixelId`, `ga4Id`만 넣으면 전 페이지 추적 + 문의 전환(Lead) 이벤트 자동 적용
- 광고 랜딩은 `index.html`(브랜드) 또는 `price.html`(시세표 직행) 추천

## 배포 (GitHub Pages 기준)

저장소 Settings → Pages → Branch 선택 → 저장. 끝.
커스텀 도메인 연결 시 `config.js`의 `siteUrl`과 `sitemap.xml`의 도메인을 수정하세요.

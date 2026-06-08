# 비타앤오리진 올리브오일 쇼핑몰

프리미엄 올리브오일 온라인 쇼핑몰 - Next.js 기반 풀스택 애플리케이션

## 🚀 주요 기능

### 고객 기능
- ✅ 상품 브라우징 및 필터링 (가격, 정렬)
- ✅ 상품 상세 정보 조회
- ✅ 장바구니 관리 (추가, 수정, 삭제)
- ✅ 온라인 결제 (아임포트 PG 연동)
- ✅ 주문 완료 및 추적

### 마케팅 & 분석
- ✅ Facebook Pixel 통합
- ✅ Google Analytics 통합
- ✅ Naver Analytics 통합
- ✅ Kakao Analytics 통합
- ✅ 이벤트 추적 (상품 조회, 장바구니 추가, 구매 등)

### 기술 스택
- **프론트엔드**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **상태 관리**: Zustand (localStorage 연동)
- **결제**: 아임포트 (Iamport)
- **분석**: 메타, 구글, 네이버, 카카오 광고 픽셀

## 📦 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
```bash
cp .env.example .env.local
```

`.env.local` 파일에 다음 정보를 입력하세요:

```env
# 광고 픽셀 ID (필수)
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=YOUR_FACEBOOK_PIXEL_ID
NEXT_PUBLIC_GOOGLE_GA_ID=YOUR_GOOGLE_GA_ID
NEXT_PUBLIC_NAVER_CONVERSION_ID=YOUR_NAVER_CONVERSION_ID
NEXT_PUBLIC_KAKAO_APP_ID=YOUR_KAKAO_APP_ID

# 결제 (선택)
NEXT_PUBLIC_IAMPORT_KEY=YOUR_IAMPORT_KEY
IAMPORT_SECRET=YOUR_IAMPORT_SECRET
```

### 3. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

### 4. 프로덕션 빌드
```bash
npm run build
npm start
```

## 📋 프로젝트 구조

```
YKMEDI-CSO/
├── app/                      # Next.js App Router
│   ├── page.tsx             # 홈페이지
│   ├── layout.tsx           # 전역 레이아웃
│   ├── globals.css          # 전역 스타일
│   ├── shop/                # 상품 목록 페이지
│   ├── product/[id]/        # 상품 상세 페이지
│   ├── cart/                # 장바구니 페이지
│   ├── checkout/            # 결제 페이지
│   ├── order-complete/      # 주문 완료 페이지
│   └── api/
│       └── orders/          # 주문 API
├── components/              # 리액트 컴포넌트
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── Hero.tsx
│   ├── Products.tsx
│   ├── BrandStory.tsx
│   ├── Testimonials.tsx
│   └── Newsletter.tsx
├── lib/
│   ├── store.ts            # Zustand 장바구니 상태
│   └── analytics.ts        # 광고 추적 함수
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
└── .env.example
```

## 🎯 광고 추적 설정 가이드

### Facebook Pixel
1. Facebook Business Suite에서 Pixel ID 생성
2. `.env.local`에 `NEXT_PUBLIC_FACEBOOK_PIXEL_ID` 입력
3. 이벤트는 자동으로 추적됨

### Google Analytics
1. Google Analytics 계정 생성
2. Measurement ID (GA-XXXXXXXX) 복사
3. `.env.local`에 `NEXT_PUBLIC_GOOGLE_GA_ID` 입력

### Naver Analytics
1. Naver Analytics 가입
2. 전환 ID 복사
3. `.env.local`에 `NEXT_PUBLIC_NAVER_CONVERSION_ID` 입력

### Kakao Analytics
1. Kakao Developers에서 앱 등록
2. 앱 ID 복사
3. `.env.local`에 `NEXT_PUBLIC_KAKAO_APP_ID` 입력

## 💳 결제 연동 (아임포트)

### 아임포트 설정
1. [아임포트](https://www.iamport.kr) 가입
2. 결제 연동키 및 시크릿 키 발급
3. `.env.local`에 입력:
   ```env
   NEXT_PUBLIC_IAMPORT_KEY=가맹점 ID
   IAMPORT_SECRET=REST API 시크릿
   ```

### 지원하는 PG사
- KCP (신용카드, 계좌이체, 휴대폰결제)
- Inicis (신용카드, 계좌이체, 휴대폰결제)
- PayPal (국제 결제)

## 📊 핵심 API 엔드포인트

### 주문 생성
```
POST /api/orders
body: {
  impUid: string,
  merchantUid: string,
  amount: number,
  items: CartItem[],
  customer: {
    name: string,
    email: string,
    phone: string,
    address: string,
    detailAddress: string,
    postalCode: string
  }
}
```

## 🎨 커스터마이징

### 색상 변경
`tailwind.config.js`에서 웰니스 컨셉 색상 수정:
```js
colors: {
  "vita-green": "#2d5016",    // 기본 색
  "vita-light": "#f5f3f0",    // 배경
  "vita-gold": "#d4a574"      // 강조
}
```

### 상품 추가/수정
1. `/components/Products.tsx` - 홈페이지 상품
2. `/app/shop/page.tsx` - 상품 목록
3. `/app/product/[id]/page.tsx` - 상품 상세 정보

## 📱 반응형 디자인
- 모바일 (320px+)
- 태블릿 (768px+)
- 데스크톱 (1024px+)

모든 페이지는 모바일, 태블릿, 데스크톱에 최적화됨

## 🔒 보안 주의사항

- 민감한 정보는 `.env.local`에 저장 (`.gitignore`에 포함)
- 클라이언트 ID/KEY만 환경변수로 사용 가능 (`NEXT_PUBLIC_` 접두사)
- 결제 검증은 반드시 서버에서 수행
- 사용자 데이터는 암호화하여 저장

## 🚀 배포

### Vercel 배포 (권장)
```bash
npm install -g vercel
vercel
```

### 기타 서버 배포
```bash
npm run build
npm start
```

## 📞 고객 지원 (향후 추가)
- 실시간 채팅
- 이메일 지원
- FAQ 섹션
- 배송 추적 API

## 📝 라이선스
MIT License

## 👨‍💻 개발자
비타앤오리진 개발팀

---

**문의사항은 support@vitaorigin.com으로 연락주세요.**

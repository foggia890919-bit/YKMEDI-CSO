# 비타앤오리진 올리브오일 쇼핑몰

프리미엄 올리브오일 온라인 쇼핑몰 - Next.js 기반 풀스택 애플리케이션

## 🚀 주요 기능

### 고객 기능
- ✅ 상품 브라우징 및 필터링 (가격, 정렬)
- ✅ 상품 상세 정보 조회
- ✅ 장바구니 관리 (추가, 수정, 삭제)
- ✅ 온라인 결제 (아임포트 PG 연동)
- ✅ 주문 완료 및 추적
- ✅ 상품 리뷰 & 평점 시스템
- ✅ 회원가입 & 로그인
- ✅ 마이페이지 (정보 수정)
- ✅ 주문 내역 조회

### 관리자 기능
- ✅ 관리자 대시보드
  - 주요 지표 (총 주문, 매출, 평균 주문액)
  - 주문 상태 관리
  - 인기 상품 분석
  - 광고 성과 분석
  - ROI 계산 및 광고 예산 추천

### 고객 지원
- ✅ 실시간 채팅 고객 지원
- ✅ 채팅 위젯 (페이지 우측 하단)

### 마케팅 & 분석
- ✅ Facebook Pixel 통합
- ✅ Google Analytics 통합
- ✅ Naver Analytics 통합
- ✅ Kakao Analytics 통합
- ✅ 이벤트 추적 (상품 조회, 장바구니 추가, 구매 등)

### 기술 스택
- **프론트엔드**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **상태 관리**: Zustand (localStorage 연동)
- **인증**: JWT + bcrypt
- **결제**: 아임포트 (Iamport)
- **데이터베이스**: 메모리 기반 (프로덕션은 PostgreSQL/MongoDB 권장)
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
│   │
│   ├── shop/                # 상품 목록 페이지
│   ├── product/[id]/        # 상품 상세 페이지 (+ 리뷰)
│   ├── cart/                # 장바구니 페이지
│   ├── checkout/            # 결제 페이지
│   ├── order-complete/      # 주문 완료 페이지
│   │
│   ├── register/            # 회원가입 페이지
│   ├── login/               # 로그인 페이지
│   ├── mypage/              # 마이페이지
│   ├── orders/              # 주문 내역 페이지
│   ├── admin/               # 관리자 대시보드
│   ├── chat/                # 고객 지원 채팅
│   │
│   └── api/
│       ├── auth/
│       │   ├── register/    # 회원가입 API
│       │   └── login/       # 로그인 API
│       ├── orders/          # 주문 API
│       └── reviews/         # 리뷰 API
│
├── components/              # 리액트 컴포넌트
│   ├── Header.tsx           # 헤더 (로그인 상태 표시)
│   ├── Footer.tsx
│   ├── Hero.tsx
│   ├── Products.tsx
│   ├── BrandStory.tsx
│   ├── Testimonials.tsx
│   └── Newsletter.tsx
│
├── lib/
│   ├── store.ts            # Zustand 장바구니 상태
│   ├── auth-store.ts       # Zustand 인증 상태
│   ├── db.ts               # 메모리 데이터베이스
│   └── analytics.ts        # 광고 추적 함수
│
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

## 📞 고객 지원
- ✅ 실시간 채팅 (로그인 사용자)
- 이메일 지원 (support@vitaorigin.com)
- FAQ 섹션 (추가 예정)
- 배송 추적 API (추가 예정)

## 👥 사용자 가이드

### 고객용
1. **회원가입 & 로그인** (/register, /login)
   - 이메일, 이름, 비밀번호로 가입
   - JWT 토큰으로 자동 로그인 유지

2. **쇼핑**
   - 상품 목록에서 검색 및 필터링
   - 상품 상세 페이지에서 리뷰 확인
   - 장바구니에 추가 후 결제

3. **결제**
   - 배송 정보 입력
   - 아임포트로 안전한 결제
   - 주문 완료 확인

4. **주문 관리** (/orders)
   - 주문 내역 조회
   - 배송 상태 추적
   - 주문 취소 (배송 전)

5. **리뷰 작성**
   - 상품 상세 페이지에서 리뷰 작성
   - 1~5별 평점 제공
   - 평균 평점 및 리뷰 수 표시

6. **고객 지원** (/chat)
   - 채팅 위젯 (우측 하단)
   - 실시간 응답 (업무 시간 내)

### 관리자용
1. **대시보드** (/admin)
   - 주요 KPI 확인
   - 주문 상태 추적
   - 인기 상품 분석
   - 광고 성과 분석

2. **주문 관리**
   - 배송 상태 업데이트
   - 취소 처리

3. **상품 관리**
   - 상품 등록/수정/삭제
   - 재고 관리

## 🔐 보안 설정

### 프로덕션 배포 전 필수 사항
1. **환경 변수 설정**
   ```bash
   JWT_SECRET=매우-강한-비밀키-사용
   IAMPORT_SECRET=실제-결제-시크릿-키
   ```

2. **HTTPS 적용**
   - 모든 트래픽은 HTTPS로 암호화

3. **데이터베이스 연동**
   - 메모리 데이터베이스를 실제 DB로 교체
   - PostgreSQL 또는 MongoDB 권장

4. **결제 검증**
   - 서버에서 모든 결제 검증
   - 클라이언트 검증만으로는 불충분

## 🚀 성능 최적화

### 구현됨
- ✅ Next.js 이미지 최적화
- ✅ Tailwind CSS로 CSS 최소화
- ✅ 컴포넌트 지연 로딩

### 추가 예정
- 캐싱 전략
- CDN 통합
- API 응답 최적화

## 📊 분석 및 모니터링

### 광고 성과 추적
- Facebook Pixel: 방문자, 전환, 장바구니 추가
- Google Analytics: 페이지 뷰, 사용자 행동
- Naver Analytics: 한국 사용자 추적
- Kakao Analytics: 모바일 앱 연동

### ROI 계산
```
ROI = (전환 수 × 평균 주문액 - 광고 비용) / 광고 비용 × 100%
```

## 📝 라이선스
MIT License

## 👨‍💻 개발자
비타앤오리진 개발팀

---

**테스트 계정:**
- 이메일: test@example.com
- 비밀번호: test123

**문의사항은 support@vitaorigin.com으로 연락주세요.**

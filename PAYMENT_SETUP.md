# VITA & ORIGIN 결제 시스템 설정 가이드

## 1️⃣ Supabase 데이터베이스 설정

### 1.1 Supabase 가입 & 프로젝트 생성
1. https://supabase.com 방문
2. `Sign Up` → Google/GitHub로 가입
3. `New Project` → 프로젝트명 입력 → 지역선택 (Seoul 또는 Tokyo) → 비밀번호 설정
4. URL과 API Key 복사 → `.env.local`에 저장

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 1.2 데이터베이스 테이블 생성

Supabase 대시보드 → SQL Editor에서 다음 쿼리 실행:

```sql
-- 주문 테이블
CREATE TABLE orders (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  buyer_name VARCHAR(255) NOT NULL,
  buyer_email VARCHAR(255) NOT NULL,
  buyer_phone VARCHAR(20),
  amount INTEGER NOT NULL,
  product_name VARCHAR(255),
  product_count INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 결제 기록 테이블
CREATE TABLE payment_logs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  merchant_uid VARCHAR(255) UNIQUE,
  imp_uid VARCHAR(255),
  amount INTEGER,
  status VARCHAR(50),
  payment_method VARCHAR(50),
  pg_provider VARCHAR(50),
  buyer_name VARCHAR(255),
  buyer_email VARCHAR(255),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성 (검색 최적화)
CREATE INDEX idx_orders_email ON orders(buyer_email);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_payment_logs_merchant ON payment_logs(merchant_uid);
```

---

## 2️⃣ 아임포트(Iamport) 설정

### 2.1 아임포트 가입
1. https://iamport.kr 방문
2. `회원가입` → 사업자등록번호 입력
3. 대시보드 → `설정` → `API Keys` 복사

```env
NEXT_PUBLIC_IAMPORT_ID=imp_xxxxx
IAMPORT_API_KEY=xxxxxx
IAMPORT_API_SECRET=xxxxxxx
```

### 2.2 결제 수단별 PG 연동

아임포트에서 지원하는 결제 수단들:

| 결제 수단 | pg 값 | 설명 |
|---------|--------|------|
| **토스** | `tosspayments` | 신용카드, 계좌이체, 휴대폰결제 |
| **네이버페이** | `naverpay` | 네이버 계정으로 빠른 결제 |
| **카카오페이** | `kakaopay` | 카카오톡 통합 결제 |
| **이니시스** | `html5_inicis` | 신용카드, 계좌이체 (추천: 사용하기 편함) |
| **KCP** | `kcp` | 신용카드, 계좌이체 |

**권장 구성:**
```javascript
pg: 'html5_inicis' // 기본 신용카드
// 추가로 네이버페이, 카카오페이 구현 가능
```

---

## 3️⃣ 토스 페이먼츠 연동 (선택사항)

### 3.1 토스 가입
1. https://dashboard.tosspayments.com
2. 회원가입 → 사업자등록번호
3. `개발 설정` → API 키 복사

```env
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_xxxxx
TOSS_SECRET_KEY=test_sk_xxxxx
```

### 3.2 토스 결제 API 라우트 (선택사항)

토스를 추가로 사용하려면 별도 라우트 생성:

```bash
mkdir -p app/api/payment/toss
```

```typescript
// app/api/payment/toss/confirm/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { orderId, amount, paymentKey } = await request.json();

  const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.TOSS_SECRET_KEY}:`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      orderId,
      amount,
      paymentKey,
    }),
  });

  const data = await response.json();
  return NextResponse.json(data);
}
```

---

## 4️⃣ 네이버페이 연동 (선택사항)

### 4.1 네이버페이 가입
1. https://merchant.pay.naver.com
2. 회원가입 → 사업자등록번호
3. `환경설정` → `API Keys` 복사

```env
NEXT_PUBLIC_NAVER_CLIENT_ID=xxxxx
NAVER_SECRET_KEY=xxxxx
```

### 4.2 네이버페이 통합

```typescript
// PaymentModal.tsx에서 결제 수단 선택
const handleNaverPayment = () => {
  const naverPayBtn = document.getElementById('naverPayBtn');
  if (naverPayBtn) {
    naverPayBtn.click();
  }
};
```

---

## 5️⃣ 카카오페이 연동 (선택사항)

### 5.1 카카오 개발자 등록
1. https://developers.kakao.com
2. 앱 만들기 → App Key 복사

```env
NEXT_PUBLIC_KAKAO_APP_KEY=xxxxx
KAKAO_SECRET_KEY=xxxxx
```

### 5.2 카카오페이 스크립트 로드

```html
<!-- app/layout.tsx -->
<script src="https://t1.kakaocdn.net/kakao_js_sdk/2.3.0/kakao.min.js"></script>
<script>
  Kakao.init('YOUR_KAKAO_APP_KEY');
</script>
```

---

## 6️⃣ 테스트 결제

### 6.1 테스트 카드 정보 (이니시스)

```
카드번호: 4111-1111-1111-1111
유효기간: 12/25
CVC: 123
```

### 6.2 테스트 방법

1. 로컬에서 `npm run dev` 실행
2. `/checkout` 또는 결제 페이지 방문
3. 테스트 카드로 결제
4. 완료 후 Supabase에서 orders, payment_logs 테이블 확인

---

## 7️⃣ 수수료 비교

| 수단 | 수수료 |
|-----|-------|
| **아임포트 + 이니시스** | 신용카드 2.9% + 아임포트 0.5% = 약 3.4% |
| **토스** | 신용카드 2.9% |
| **네이버페이** | 2.9% |
| **카카오페이** | 2.9% |
| **PG 직거래** | 2.9% (구현 복잡) |

**권장:** 아임포트 + 이니시스 (구현이 가장 간단함)

---

## 8️⃣ 배포 전 체크리스트

- [ ] `.env.local`에 모든 API 키 설정
- [ ] Supabase 테이블 생성 완료
- [ ] 테스트 결제 성공
- [ ] Supabase Row Level Security (RLS) 정책 설정
- [ ] 주문 조회 페이지 테스트
- [ ] HTTPS 활성화 (Vercel 배포)
- [ ] 프로덕션 결제 수단으로 전환

---

## 🆘 트러블슈팅

### "아임포트 SDK 로드 실패"
→ `app/layout.tsx`에서 `<script src="https://cdn.iamport.kr/v1/iamport.js" />` 확인

### "결제 후 데이터가 저장되지 않음"
→ Supabase 테이블 생성 확인, `.env.local` 키 확인

### "토큰 취득 실패"
→ API 키가 올바른지 확인, 아임포트 대시보드에서 상태 확인

---

## 📞 고객 지원
- 아임포트: support@iamport.kr
- 토스: https://toss.im/help
- 네이버페이: https://merchant.pay.naver.com/support

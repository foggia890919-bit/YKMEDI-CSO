'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function OrderCompleteContent() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState('주문번호');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const saveOrderFromPayment = async () => {
      const paymentKey = searchParams.get('paymentKey');
      const orderId = searchParams.get('orderId');
      const amount = searchParams.get('amount');

      if (paymentKey && orderId && amount && !saving) {
        setSaving(true);
        try {
          const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              merchantUid: orderId,
              paymentKey: paymentKey,
              amount: parseInt(amount),
              items: [],
              customer: {},
              userId: localStorage.getItem('userId') || '',
            }),
          });

          if (response.ok) {
            localStorage.removeItem('cart');
            setOrderId(orderId);
          }
        } catch (error) {
          console.error('Failed to save order:', error);
        } finally {
          setSaving(false);
        }
      } else if (orderId) {
        setOrderId(orderId);
      }
    };

    saveOrderFromPayment();
  }, [searchParams, saving]);

  return renderContent(orderId);
}

function renderContent(orderId: string) {
  return (
    <div className="py-20">
      <div className="wellness-container max-w-2xl text-center">
        <div className="mb-8">
          <div className="text-6xl mb-4">✓</div>
        </div>

        <h1 className="text-4xl font-bold text-[#2d5016] mb-4">주문이 완료되었습니다!</h1>

        <p className="text-gray-700 text-lg mb-8">
          소중한 구매를 해주셔서 감사합니다.
          <br />
          2~3일 내에 배송이 시작됩니다.
        </p>

        <div className="bg-[#f5f3f0] p-6 rounded-lg mb-8">
          <p className="text-gray-600 mb-2">주문번호</p>
          <p className="text-2xl font-bold text-[#2d5016] break-all">{orderId}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8 text-left">
          <h2 className="text-xl font-bold text-[#2d5016] mb-4">다음 단계</h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-[#2d5016] font-bold mt-1">1.</span>
              <span>입력하신 이메일로 주문 확인 메일을 보내드렸습니다.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#2d5016] font-bold mt-1">2.</span>
              <span>상품이 배송되면 배송 추적 정보를 메일로 받게 됩니다.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#2d5016] font-bold mt-1">3.</span>
              <span>배송 완료 후 상품이 마음에 드시지 않으면 30일 이내에 반품 신청이 가능합니다.</span>
            </li>
          </ul>
        </div>

        <div className="flex gap-4 justify-center">
          <Link href="/shop" className="vita-button">
            계속 쇼핑하기
          </Link>
          <Link
            href="/"
            className="border-2 border-[#2d5016] text-[#2d5016] px-6 py-3 rounded-lg hover:bg-[#f5f3f0] transition"
          >
            홈으로 가기
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderCompletePage() {
  return (
    <Suspense fallback={<div className="py-20 text-center">로딩 중...</div>}>
      <OrderCompleteContent />
    </Suspense>
  );
}

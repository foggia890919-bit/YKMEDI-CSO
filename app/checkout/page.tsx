'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/store';

declare global {
  interface Window {
    IMP: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    detailAddress: '',
    postalCode: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);

  if (items.length === 0) {
    return (
      <div className="py-20">
        <div className="wellness-container text-center">
          <h1 className="text-4xl font-bold text-[#2d5016] mb-6">결제</h1>
          <p className="text-gray-700 text-lg mb-8">장바구니가 비어있습니다.</p>
          <Link href="/shop" className="vita-button inline-block">
            쇼핑하러 가기
          </Link>
        </div>
      </div>
    );
  }

  const totalPrice = getTotalPrice();
  const deliveryFee = totalPrice > 100000 ? 0 : 3000;
  const finalTotal = totalPrice + deliveryFee;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // 아임포트 초기화
    if (!window.IMP) {
      alert('결제 시스템을 초기화하지 못했습니다.');
      setIsProcessing(false);
      return;
    }

    window.IMP.init('YOUR_IAMPORT_ID');

    // 결제 요청 데이터
    const paymentData = {
      pg: 'kcp', // 또는 'inicis', 'paypal' 등
      pay_method: 'card',
      merchant_uid: `order_${Date.now()}`,
      amount: finalTotal,
      name: `비타앤오리진 올리브오일 ${items.length}개`,
      buyer_email: formData.email,
      buyer_name: formData.name,
      buyer_tel: formData.phone,
      buyer_addr: `${formData.address} ${formData.detailAddress}`,
      buyer_postcode: formData.postalCode,
    };

    window.IMP.request_pay(paymentData, async (response: any) => {
      if (response.success) {
        // 결제 성공 - 서버에 주문 정보 저장
        try {
          const orderResponse = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              impUid: response.imp_uid,
              merchantUid: paymentData.merchant_uid,
              amount: finalTotal,
              items: items,
              customer: formData,
            }),
          });

          if (orderResponse.ok) {
            clearCart();
            alert('주문이 완료되었습니다!');
            router.push(`/order-complete?orderId=${paymentData.merchant_uid}`);
          } else {
            alert('주문 저장 중 오류가 발생했습니다.');
          }
        } catch (error) {
          alert('결제 처리 중 오류가 발생했습니다.');
          console.error(error);
        }
      } else {
        alert(`결제 실패: ${response.error_msg}`);
      }
      setIsProcessing(false);
    });
  };

  return (
    <div className="py-12">
      <div className="wellness-container max-w-4xl">
        <h1 className="text-4xl font-bold text-[#2d5016] mb-8">주문/결제</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 주문 정보 입력 */}
          <div className="lg:col-span-2">
            <form onSubmit={handlePayment} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-[#2d5016] mb-6">배송 정보</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    이름 *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 rounded px-4 py-2"
                    placeholder="이름을 입력하세요"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      이메일 *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded px-4 py-2"
                      placeholder="이메일"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      전화번호 *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded px-4 py-2"
                      placeholder="010-0000-0000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      주소 *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded px-4 py-2"
                      placeholder="시/도 구/군 동/읍"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      우편번호 *
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      required
                      className="w-full border border-gray-300 rounded px-4 py-2"
                      placeholder="12345"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    상세 주소
                  </label>
                  <input
                    type="text"
                    name="detailAddress"
                    value={formData.detailAddress}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-4 py-2"
                    placeholder="아파트, 건물명 등"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full mt-8 vita-button disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? '처리 중...' : '결제하기'}
              </button>
            </form>
          </div>

          {/* 주문 요약 */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
              <h2 className="text-xl font-bold text-[#2d5016] mb-4">주문 요약</h2>

              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {item.name} x {item.quantity}
                    </span>
                    <span className="font-semibold">
                      ₩{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t space-y-2 pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-700">상품 합계</span>
                  <span>₩{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">배송료</span>
                  <span className={deliveryFee === 0 ? 'text-green-600 font-bold' : ''}>
                    {deliveryFee === 0 ? '무료' : `₩${deliveryFee.toLocaleString()}`}
                  </span>
                </div>
                {deliveryFee === 0 && (
                  <p className="text-xs text-green-600">* 10만원 이상 무료배송</p>
                )}
                <div className="border-t pt-2 flex justify-between text-lg font-bold">
                  <span>총 결제금액</span>
                  <span className="text-[#2d5016]">₩{finalTotal.toLocaleString()}</span>
                </div>
              </div>

              <Link
                href="/cart"
                className="block text-center text-[#2d5016] hover:underline mt-4 text-sm"
              >
                장바구니로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 아임포트 스크립트 */}
      <script src="https://code.jquery.com/jquery-1.12.4.min.js"></script>
      <script src="https://service.iamport.kr/js/iamport.payment-1.2.0.js"></script>
    </div>
  );
}

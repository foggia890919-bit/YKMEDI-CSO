'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/lib/store';
import { useAuthStore } from '@/lib/auth-store';
import { loadTossPayments } from '@tosspayments/payment-sdk';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    detailAddress: '',
    postalCode: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [tossPayments, setTossPayments] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'toss' | 'naver' | 'kakao' | 'samsung'>('toss');

  useEffect(() => {
    const initToss = async () => {
      try {
        const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
        if (!clientKey) {
          console.warn('Toss Client Key not configured');
          return;
        }
        const toss = await loadTossPayments(clientKey);
        setTossPayments(toss);
      } catch (error) {
        console.error('Failed to initialize Toss Payments:', error);
      }
    };
    initToss();
  }, []);

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

  const handleTossPayment = async (merchantUid: string) => {
    if (!tossPayments) {
      alert('결제 시스템을 초기화하지 못했습니다. 잠시 후 다시 시도해주세요.');
      setIsProcessing(false);
      return;
    }

    try {
      await tossPayments.requestPayment('카드', {
        amount: finalTotal,
        orderId: merchantUid,
        orderName: `비타앤오리진 올리브오일 ${items.length}개`,
        customerName: formData.name,
        customerEmail: formData.email,
        customerMobilePhone: formData.phone.replace(/-/g, ''),
        successUrl: `${window.location.origin}/order-complete`,
        failUrl: `${window.location.origin}/checkout`,
      });
    } catch (error: any) {
      if (error.code === 'USER_CANCEL') {
        setIsProcessing(false);
        return;
      }
      alert(`Toss 결제 요청 중 오류가 발생했습니다: ${error.message}`);
      setIsProcessing(false);
    }
  };

  const handleSamsungPayment = async (merchantUid: string) => {
    if (!tossPayments) {
      alert('결제 시스템을 초기화하지 못했습니다. 잠시 후 다시 시도해주세요.');
      setIsProcessing(false);
      return;
    }

    try {
      await tossPayments.requestPayment('삼성페이', {
        amount: finalTotal,
        orderId: merchantUid,
        orderName: `비타앤오리진 올리브오일 ${items.length}개`,
        customerName: formData.name,
        customerEmail: formData.email,
        customerMobilePhone: formData.phone.replace(/-/g, ''),
        successUrl: `${window.location.origin}/order-complete`,
        failUrl: `${window.location.origin}/checkout`,
      });
    } catch (error: any) {
      if (error.code === 'USER_CANCEL') {
        setIsProcessing(false);
        return;
      }
      alert(`삼성페이 결제 요청 중 오류가 발생했습니다: ${error.message}`);
      setIsProcessing(false);
    }
  };

  const handleNaverPayment = async (merchantUid: string) => {
    const clientId = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID;
    if (!clientId) {
      alert('네이버페이 시스템을 초기화하지 못했습니다.');
      setIsProcessing(false);
      return;
    }

    try {
      const script = document.createElement('script');
      script.src = 'https://naver.github.io/pay/sdk/v1/naver-pay-sdk.js';
      script.onload = () => {
        const naver = (window as any).Naver;
        naver.Pay.requestPayment({
          clientId: clientId,
          paymentMode: 'PRODUCTION',
          merchantPayKey: merchantUid,
          merchantName: '비타앤오리진',
          productName: `비타앤오리진 올리브오일 ${items.length}개`,
          totalPayAmount: finalTotal,
          taxScopeAmount: 0,
          taxExemptionAmount: finalTotal,
          returnUrl: `${window.location.origin}/order-complete`,
        });
      };
      document.head.appendChild(script);
    } catch (error) {
      alert('네이버페이 결제 요청 중 오류가 발생했습니다');
      setIsProcessing(false);
    }
  };

  const handleKakaoPayment = async (merchantUid: string) => {
    const appKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
    if (!appKey) {
      alert('카카오페이 시스템을 초기화하지 못했습니다.');
      setIsProcessing(false);
      return;
    }

    try {
      const script = document.createElement('script');
      script.src = 'https://developers.kakao.com/sdk/js/kakao.min.js';
      script.onload = () => {
        const kakao = (window as any).Kakao;
        if (!kakao.isInitialized()) {
          kakao.init(appKey);
        }

        kakao.Payment.requestPayment({
          tid: merchantUid,
          next_redirect_pc_url: `${window.location.origin}/order-complete`,
          next_redirect_mobile_url: `${window.location.origin}/order-complete`,
          cid: 'TC0ONETIME',
          partner_order_id: merchantUid,
          partner_user_id: formData.email || 'USER',
          item_name: `비타앤오리진 올리브오일 ${items.length}개`,
          quantity: items.length,
          total_amount: finalTotal,
          tax_free_amount: 0,
          approval_url: `${window.location.origin}/order-complete`,
          cancel_url: `${window.location.origin}/checkout`,
          fail_url: `${window.location.origin}/checkout`,
        });
      };
      document.head.appendChild(script);
    } catch (error) {
      alert('카카오페이 결제 요청 중 오류가 발생했습니다');
      setIsProcessing(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const merchantUid = `order_${Date.now()}`;

    switch (paymentMethod) {
      case 'toss':
        await handleTossPayment(merchantUid);
        break;
      case 'samsung':
        await handleSamsungPayment(merchantUid);
        break;
      case 'naver':
        await handleNaverPayment(merchantUid);
        break;
      case 'kakao':
        await handleKakaoPayment(merchantUid);
        break;
      default:
        alert('결제 수단을 선택해주세요.');
        setIsProcessing(false);
    }
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

              <div className="mt-8 pt-8 border-t">
                <h3 className="text-lg font-bold text-[#2d5016] mb-4">결제 수단 선택</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { id: 'toss', label: '🛒 Toss', desc: '토스' },
                    { id: 'naver', label: '☘️ Naver Pay', desc: '네이버페이' },
                    { id: 'kakao', label: '💛 Kakao Pay', desc: '카카오페이' },
                    { id: 'samsung', label: '🔷 Samsung Pay', desc: '삼성페이' },
                  ].map((method) => (
                    <label
                      key={method.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                        paymentMethod === method.id
                          ? 'border-[#2d5016] bg-[#f5f3f0]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                        className="mr-2"
                      />
                      <span className="font-semibold text-sm">{method.label}</span>
                    </label>
                  ))}
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
    </div>
  );
}

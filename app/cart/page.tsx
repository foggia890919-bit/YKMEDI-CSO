'use client';

import Link from 'next/link';
import { useCartStore } from '@/lib/store';

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotalPrice, clearCart } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="py-20">
        <div className="wellness-container text-center">
          <h1 className="text-4xl font-bold text-[#2d5016] mb-6">장바구니</h1>
          <p className="text-gray-700 text-lg mb-8">장바구니가 비어있습니다.</p>
          <Link href="/shop" className="vita-button inline-block">
            쇼핑 계속하기
          </Link>
        </div>
      </div>
    );
  }

  const totalPrice = getTotalPrice();
  const deliveryFee = totalPrice > 100000 ? 0 : 3000;
  const finalTotal = totalPrice + deliveryFee;

  return (
    <div className="py-12">
      <div className="wellness-container max-w-4xl">
        <h1 className="text-4xl font-bold text-[#2d5016] mb-8">장바구니</h1>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th className="text-left px-6 py-4">상품명</th>
                  <th className="text-center px-6 py-4">가격</th>
                  <th className="text-center px-6 py-4">수량</th>
                  <th className="text-center px-6 py-4">합계</th>
                  <th className="text-center px-6 py-4">삭제</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <Link href={`/product/${item.id}`} className="text-[#2d5016] hover:underline font-semibold">
                        {item.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-center">
                      ₩{item.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                          className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100"
                        >
                          −
                        </button>
                        <span className="min-w-12 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold">
                      ₩{(item.price * item.quantity).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-800 font-semibold"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 결제 정보 */}
          <div className="p-6 bg-gray-50 border-t">
            <div className="max-w-md ml-auto space-y-3">
              <div className="flex justify-between text-gray-700">
                <span>상품 합계</span>
                <span>₩{totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>배송료</span>
                <span className={deliveryFee === 0 ? 'text-green-600 font-bold' : ''}>
                  {deliveryFee === 0 ? '무료' : `₩${deliveryFee.toLocaleString()}`}
                </span>
              </div>
              {deliveryFee === 0 && (
                <p className="text-sm text-green-600">* 10만원 이상 구매로 배송료 무료</p>
              )}
              <div className="border-t pt-3 flex justify-between text-lg font-bold">
                <span>결제 예정금액</span>
                <span className="text-[#2d5016]">₩{finalTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={() => clearCart()}
            className="flex-1 border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 font-semibold"
          >
            장바구니 비우기
          </button>
          <Link
            href="/checkout"
            className="flex-1 vita-button text-center font-semibold"
          >
            결제하기
          </Link>
        </div>

        <Link href="/shop" className="text-[#2d5016] hover:underline mt-4 inline-block">
          ← 쇼핑 계속하기
        </Link>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/lib/store';

const PRODUCTS: Record<number, any> = {
  1: {
    id: 1,
    name: 'Premium Extra Virgin',
    price: 45000,
    description: '그리스 크레타 올리브오일',
    fullDescription: `세계적으로 유명한 그리스 크레타 지역에서 생산된 최고급 올리브오일입니다.
      첫 수확 올리브만을 엄선하여 만들어진 이 제품은 상큼하고 생생한 향이 특징입니다.
      혈압 관리, 항산화 작용 등 건강상의 다양한 효능이 있습니다.`,
    volume: '500ml',
    origin: '그리스 (크레타)',
    harvestDate: '2024년 10월',
    bestFor: '샐러드, 생식, 드레싱',
    tags: ['상큼함', '생과일향', '심플'],
  },
  2: {
    id: 2,
    name: 'Golden Selection',
    price: 38000,
    description: '스페인 안달루시아 올리브오일',
    fullDescription: `스페인의 대표적인 올리브유 생산지인 안달루시아에서 엄선한 제품입니다.
      균형잡힌 맛과 부드러운 풍미가 특징이며, 다양한 요리에 활용할 수 있습니다.
      가족 농장의 전통적인 방식으로 생산되었습니다.`,
    volume: '500ml',
    origin: '스페인 (안달루시아)',
    harvestDate: '2024년 11월',
    bestFor: '밥, 빵, 일상 요리',
    tags: ['균형잡힌맛', '부드러움'],
  },
  3: {
    id: 3,
    name: 'Heritage Estate',
    price: 52000,
    description: '이탈리아 토스카나 올리브오일',
    fullDescription: `이탈리아의 고급 올리브오일 생산 지역인 토스카나에서 생산된 프리미엄 제품입니다.
      진한 맛과 견과류 향이 특징이며, 고급 요리에 최적입니다.
      전통 가족 농장의 300년 역사를 담고 있습니다.`,
    volume: '500ml',
    origin: '이탈리아 (토스카나)',
    harvestDate: '2024년 10월',
    bestFor: '파스타, 스테이크, 고급 요리',
    tags: ['진한맛', '견과류향', '프리미엄'],
  },
  4: {
    id: 4,
    name: 'Morning Blend',
    price: 32000,
    description: '튀니지 올리브오일',
    fullDescription: `북아프리카의 튀니지에서 생산된 신선하고 상큼한 올리브오일입니다.
      가벼운 향미와 깔끔한 맛이 특징이며, 아침 식사에 최적입니다.
      항산화 성분이 풍부합니다.`,
    volume: '500ml',
    origin: '튀니지',
    harvestDate: '2024년 11월',
    bestFor: '아침 식사, 요거트, 채소',
    tags: ['가벼움', '상큼함', '건강'],
  },
};

export default function ProductPage({ params }: { params: { id: string } }) {
  const productId = parseInt(params.id);
  const product = PRODUCTS[productId];
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCartStore();

  if (!product) {
    return (
      <div className="wellness-container py-20">
        <p className="text-center text-xl">상품을 찾을 수 없습니다.</p>
        <div className="text-center mt-4">
          <Link href="/shop" className="vita-button inline-block">
            상품 목록으로
          </Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
      });
    }
    alert(`${product.name} ${quantity}개가 장바구니에 추가되었습니다.`);
  };

  return (
    <div className="py-12">
      <div className="wellness-container">
        <Link href="/shop" className="text-[#2d5016] hover:underline mb-6 inline-block">
          ← 상품 목록으로
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* 상품 이미지 */}
          <div className="bg-gradient-to-br from-[#f5f3f0] to-[#e8e4df] h-96 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-8xl mb-4">🫒</div>
              <p className="text-gray-700">{product.volume}</p>
            </div>
          </div>

          {/* 상품 정보 */}
          <div>
            <h1 className="text-4xl font-bold text-[#2d5016] mb-2">{product.name}</h1>
            <p className="text-gray-600 text-lg mb-6">{product.description}</p>

            <div className="mb-6">
              <span className="text-4xl font-bold text-[#2d5016]">
                ₩{product.price.toLocaleString()}
              </span>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <p className="text-sm text-gray-600">원산지</p>
                <p className="text-lg font-semibold text-gray-800">{product.origin}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">수확 시기</p>
                <p className="text-lg font-semibold text-gray-800">{product.harvestDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">용량</p>
                <p className="text-lg font-semibold text-gray-800">{product.volume}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">추천 용도</p>
                <p className="text-lg font-semibold text-gray-800">{product.bestFor}</p>
              </div>
            </div>

            {/* 수량 선택 */}
            <div className="flex items-center gap-4 mb-8">
              <label className="text-lg font-semibold">수량:</label>
              <div className="flex items-center border border-gray-300 rounded">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 hover:bg-gray-100"
                >
                  −
                </button>
                <span className="px-4 py-2 min-w-16 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              className="vita-button w-full mb-4"
            >
              장바구니에 추가
            </button>

            <Link href="/checkout" className="block text-center bg-[#d4a574] text-white px-6 py-3 rounded-lg hover:bg-[#c09560] transition">
              바로 구매
            </Link>
          </div>
        </div>

        {/* 상세 설명 */}
        <div className="mt-16 bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-[#2d5016] mb-4">상품 설명</h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {product.fullDescription}
          </p>

          <div className="mt-6">
            <h3 className="text-lg font-bold text-[#2d5016] mb-3">특징</h3>
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag: string) => (
                <span key={tag} className="bg-[#f5f3f0] text-[#2d5016] px-4 py-2 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

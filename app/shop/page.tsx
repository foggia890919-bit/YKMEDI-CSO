'use client';

import Link from 'next/link';
import { useState } from 'react';

const PRODUCTS = [
  {
    id: 1,
    name: 'Premium Extra Virgin',
    price: 45000,
    description: '그리스 크레타 올리브오일',
    tags: ['상큼함', '생과일향']
  },
  {
    id: 2,
    name: 'Golden Selection',
    price: 38000,
    description: '스페인 안달루시아 올리브오일',
    tags: ['균형잡힌맛', '부드러움']
  },
  {
    id: 3,
    name: 'Heritage Estate',
    price: 52000,
    description: '이탈리아 토스카나 올리브오일',
    tags: ['진한맛', '견과류향']
  },
  {
    id: 4,
    name: 'Morning Blend',
    price: 32000,
    description: '튀니지 올리브오일',
    tags: ['가벼움', '상큼함']
  },
  {
    id: 5,
    name: 'Luxury Gift Set',
    price: 120000,
    description: '4종 올리브오일 선물 세트',
    tags: ['선물', '세트']
  },
  {
    id: 6,
    name: 'Daily Essential',
    price: 28000,
    description: '초보자용 올리브오일 1L',
    tags: ['추천', '경제적']
  },
];

export default function ShopPage() {
  const [sortBy, setSortBy] = useState('featured');
  const [filterPrice, setFilterPrice] = useState('all');

  let displayedProducts = [...PRODUCTS];

  if (sortBy === 'price-low') {
    displayedProducts.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-high') {
    displayedProducts.sort((a, b) => b.price - a.price);
  }

  if (filterPrice !== 'all') {
    displayedProducts = displayedProducts.filter((p) => {
      if (filterPrice === 'under-40') return p.price < 40000;
      if (filterPrice === '40-50') return p.price >= 40000 && p.price <= 50000;
      if (filterPrice === 'over-50') return p.price > 50000;
      return true;
    });
  }

  return (
    <div className="py-12">
      <div className="wellness-container">
        <h1 className="text-4xl font-bold text-[#2d5016] mb-8">상품 쇼핑</h1>

        {/* 필터 및 정렬 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-white p-4 rounded-lg shadow-sm">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              정렬
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="featured">추천순</option>
              <option value="price-low">가격: 낮은순</option>
              <option value="price-high">가격: 높은순</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              가격 범위
            </label>
            <select
              value={filterPrice}
              onChange={(e) => setFilterPrice(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="all">전체</option>
              <option value="under-40">40,000원 이하</option>
              <option value="40-50">40,000 ~ 50,000원</option>
              <option value="over-50">50,000원 이상</option>
            </select>
          </div>
        </div>

        {/* 상품 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedProducts.map((product) => (
            <div key={product.id} className="product-card">
              <div className="h-48 bg-gradient-to-br from-[#f5f3f0] to-[#e8e4df] flex items-center justify-center text-6xl">
                🫒
              </div>
              <div className="p-4">
                <h3 className="font-bold text-lg mb-2">{product.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {product.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-[#f5f3f0] text-[#2d5016] px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-[#2d5016]">
                    ₩{product.price.toLocaleString()}
                  </span>
                  <Link
                    href={`/product/${product.id}`}
                    className="bg-[#2d5016] text-white px-4 py-2 rounded hover:bg-[#1f3810] transition"
                  >
                    보기
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {displayedProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">조건에 맞는 상품이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}

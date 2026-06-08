'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Product {
  id: number;
  name: string;
  price: number;
  origin: string;
  tags: string[];
  image: string;
  details: string;
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sortBy, setSortBy] = useState('featured');
  const [filterPrice, setFilterPrice] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (error) {
        console.error('Failed to load products:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, []);

  let displayedProducts = [...products];

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
    <div className="min-h-screen bg-white py-12">
      <div className="wellness-container">
        {/* 페이지 헤더 */}
        <div className="mb-14">
          <h1 className="text-5xl font-extrabold text-midnight-forest mb-4">
            엄선된 올리브오일 컬렉션
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            지중해의 햇살과 시간이 빚어낸 프리미엄 올리브오일을 만나보세요.
            각 병에는 농장의 정성과 자연의 순수함이 담겨있습니다.
          </p>
        </div>

        {/* 필터 및 정렬 */}
        <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-soft-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <label className="block text-sm uppercase tracking-widest font-semibold text-gray-700 mb-3">
              정렬
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:border-active-lime bg-white"
            >
              <option value="featured">추천순</option>
              <option value="price-low">가격: 낮은순</option>
              <option value="price-high">가격: 높은순</option>
            </select>
          </div>

          <div className="bg-soft-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <label className="block text-sm uppercase tracking-widest font-semibold text-gray-700 mb-3">
              가격 범위
            </label>
            <select
              value={filterPrice}
              onChange={(e) => setFilterPrice(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:border-active-lime bg-white"
            >
              <option value="all">전체</option>
              <option value="under-40">40,000원 이하</option>
              <option value="40-50">40,000 ~ 50,000원</option>
              <option value="over-50">50,000원 이상</option>
            </select>
          </div>
        </div>

        {/* 상품 그리드 */}
        {loading ? (
          <div className="text-center py-20">
            <p className="text-lg text-gray-600">상품을 불러오는 중...</p>
          </div>
        ) : displayedProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayedProducts.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="group"
              >
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 h-full flex flex-col">
                  {/* 상품 이미지 */}
                  <div className="h-64 bg-soft-white flex items-center justify-center overflow-hidden">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <span className="text-6xl">🫒</span>
                    )}
                  </div>

                  {/* 상품 정보 */}
                  <div className="p-6 flex flex-col flex-1">
                    <p className="text-xs uppercase tracking-widest text-active-lime-dark font-semibold mb-2">
                      {product.origin}
                    </p>
                    <h3 className="text-xl font-bold text-midnight-forest mb-3 group-hover:text-active-lime-dark transition-colors">
                      {product.name}
                    </h3>

                    {/* 태그 */}
                    {product.tags && product.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {product.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-lime-50 text-active-lime-dark px-3 py-1 rounded-full font-semibold"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* 가격 */}
                    <div className="mt-auto pt-4 border-t border-gray-100">
                      <div className="flex justify-between items-center">
                        <span className="text-2xl text-midnight-forest font-bold">
                          ₩{product.price.toLocaleString()}
                        </span>
                        <span className="text-active-orange font-semibold group-hover:translate-x-1 transition-transform duration-300">
                          +
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-xl text-gray-600">
              조건에 맞는 상품이 없습니다. 😌
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

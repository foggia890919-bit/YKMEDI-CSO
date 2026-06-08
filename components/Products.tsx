'use client';

import Link from 'next/link';

const PRODUCTS = [
  {
    id: 1,
    name: 'Premium Extra Virgin',
    price: 45000,
    description: '그리스 크레타',
    tags: ['상큼함', '생과일향'],
  },
  {
    id: 2,
    name: 'Golden Selection',
    price: 38000,
    description: '스페인 안달루시아',
    tags: ['균형잡힌맛', '부드러움'],
  },
  {
    id: 3,
    name: 'Heritage Estate',
    price: 52000,
    description: '이탈리아 토스카나',
    tags: ['진한맛', '견과류향'],
  },
  {
    id: 4,
    name: 'Morning Blend',
    price: 32000,
    description: '튀니지',
    tags: ['가벼움', '상큼함'],
  },
];

export default function Products() {
  return (
    <section id="products" className="bg-vita-ivory py-24">
      <div className="wellness-container">
        <div className="reveal mb-16 text-center">
          <span className="eyebrow justify-center mb-5">Bestsellers</span>
          <h2 className="font-serif-display text-4xl text-vita-green md:text-5xl">
            엄선된 컬렉션
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-vita-stone">
            지중해 각지의 명품 산지에서 직접 선별한 네 가지 시그니처 오일
          </p>
        </div>

        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCTS.map((product, idx) => (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className="product-card reveal group block"
              style={{ transitionDelay: `${idx * 80}ms` }}
            >
              {/* 이미지 슬롯 */}
              <div className="image-slot aspect-[4/5] overflow-hidden">
                <img
                  src={`/images/product-${product.id}.svg`}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-vita-gold">
                  {product.description}
                </p>
                <h3 className="font-serif-display mt-2 text-xl text-vita-charcoal">
                  {product.name}
                </h3>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-vita-cream px-2.5 py-1 text-xs text-vita-green"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between">
                  <span className="font-serif-display text-2xl text-vita-green">
                    ₩{product.price.toLocaleString()}
                  </span>
                  <span className="text-sm font-semibold text-vita-gold transition-transform duration-300 group-hover:translate-x-1">
                    보기 →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

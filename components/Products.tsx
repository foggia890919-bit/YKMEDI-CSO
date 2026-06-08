'use client';

import Link from 'next/link';

const PRODUCTS = [
  {
    id: 1,
    name: 'Premium Extra Virgin',
    price: 45000,
    image: '🫒',
    description: '그리스 크레타 올리브오일',
    tags: ['상큼함', '생과일향']
  },
  {
    id: 2,
    name: 'Golden Selection',
    price: 38000,
    image: '🫒',
    description: '스페인 안달루시아 올리브오일',
    tags: ['균형잡힌맛', '부드러움']
  },
  {
    id: 3,
    name: 'Heritage Estate',
    price: 52000,
    image: '🫒',
    description: '이탈리아 토스카나 올리브오일',
    tags: ['진한맛', '견과류향']
  },
  {
    id: 4,
    name: 'Morning Blend',
    price: 32000,
    image: '🫒',
    description: '튀니지 올리브오일',
    tags: ['가벼움', '상큼함']
  }
];

export default function Products() {
  return (
    <section id="products" className="py-16">
      <div className="wellness-container">
        <h2 className="text-4xl font-bold text-[#2d5016] mb-12 text-center">
          베스트셀러 제품
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRODUCTS.map((product) => (
            <div key={product.id} className="product-card">
              <div className="h-48 bg-gradient-to-br from-[#f5f3f0] to-[#e8e4df] flex items-center justify-center text-6xl">
                {product.image}
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
      </div>
    </section>
  );
}

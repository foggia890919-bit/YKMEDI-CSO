'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  origin: string;
  tags: string[];
  image: string;
  details: string;
}

interface ProductsContent {
  title: string;
  subtitle: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [content, setContent] = useState<ProductsContent>({
    title: '우리의 컬렉션',
    subtitle: '지중해의 최고 올리브 농장에서 엄선한 5가지 프리미엄 오일',
  });
  const [productImages, setProductImages] = useState<Record<number, string>>({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsRes, imagesRes, contentRes] = await Promise.all([
          fetch('/api/products'),
          fetch('/api/images'),
          fetch('/api/content'),
        ]);

        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(productsData);
        }

        if (imagesRes.ok) {
          const imagesData = await imagesRes.json();
          setProductImages(imagesData.products || {});
        }

        if (contentRes.ok) {
          const contentData = await contentRes.json();
          setContent(contentData.products);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    loadData();
  }, []);

  return (
    <section id="products" className="bg-white py-32">
      <div className="wellness-container">
        {/* 섹션 헤더 */}
        <div className="reveal mb-20 max-w-2xl">
          <span className="inline-block rounded-full bg-green-100 px-4 py-2 text-sm font-bold text-green-600 mb-4">
            🌿 컬렉션
          </span>
          <h2 className="text-5xl md:text-6xl font-bold text-charcoal mb-6">
            {content.title}
          </h2>
          <p className="text-xl text-gray-600">
            {content.subtitle}
          </p>
        </div>

        {/* 대시보드 그리드 - 반응형 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {products.map((product, idx) => (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className="group rounded-2xl overflow-hidden bg-white border-2 border-gray-100 hover:border-green-300 hover:shadow-lg transition-all duration-300"
              style={{ transitionDelay: `${idx * 50}ms` }}
            >
              {/* 이미지 */}
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <img
                  src={productImages[product.id] || product.image}
                  alt={product.name}
                  className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                  {product.tags[0]}
                </div>
              </div>

              {/* 콘텐츠 */}
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    {product.origin}
                  </p>
                  <h3 className="text-lg font-bold text-charcoal group-hover:text-green-600 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {product.description}
                  </p>
                </div>

                {/* 태그 */}
                <div className="flex flex-wrap gap-2">
                  {product.tags.slice(1).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-gray-50 text-gray-600 px-2.5 py-1 rounded-lg"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* 가격 */}
                <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                  <span className="text-xl font-bold text-green-600">
                    ₩{product.price.toLocaleString()}
                  </span>
                  <span className="text-green-600 font-bold group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 전체 보기 버튼 */}
        <div className="mt-16 text-center">
          <Link
            href="/shop"
            className="inline-block px-10 py-4 bg-green-600 text-white font-bold rounded-full hover:bg-green-700 transition-colors text-lg"
          >
            전체 컬렉션 보기 →
          </Link>
        </div>
      </div>
    </section>
  );
}

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
    title: '엄선된 컬렉션',
    subtitle: '지중해 각지의 명품 산지에서 직접 선별한 네 가지 시그니처 오일',
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
    <section id="products" className="bg-vita-ivory py-24">
      <div className="wellness-container">
        <div className="reveal mb-16 text-center">
          <span className="eyebrow justify-center mb-5">Bestsellers</span>
          <h2 className="font-serif-display text-4xl text-vita-green md:text-5xl">
            {content.title}
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-vita-stone">
            {content.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product, idx) => (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className="product-card reveal group block"
              style={{ transitionDelay: `${idx * 80}ms` }}
            >
              {/* 고급 AI 생성 상품 이미지 */}
              <div className="image-slot aspect-[4/5] overflow-hidden">
                <img
                  src={productImages[product.id] || product.image}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              <div className="p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-vita-gold">
                  {product.origin}
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

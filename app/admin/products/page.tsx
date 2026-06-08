'use client';

import { useState, useEffect } from 'react';

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

export default function ProductsAdmin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Product>({
    id: 0,
    name: '',
    price: 0,
    description: '',
    origin: '',
    tags: [],
    image: '',
    details: '',
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const handleAddNew = () => {
    const newId = Math.max(...products.map((p) => p.id), 0) + 1;
    setFormData({
      id: newId,
      name: '',
      price: 0,
      description: '',
      origin: '',
      tags: [],
      image: '',
      details: '',
    });
    setEditingId(newId);
  };

  const handleEdit = (product: Product) => {
    setFormData(product);
    setEditingId(product.id);
  };

  const handleSaveProduct = async () => {
    try {
      let updatedProducts: Product[];

      if (products.some((p) => p.id === formData.id)) {
        // 기존 상품 수정
        updatedProducts = products.map((p) => (p.id === formData.id ? formData : p));
      } else {
        // 새 상품 추가
        updatedProducts = [...products, formData];
      }

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProducts),
      });

      if (response.ok) {
        setProducts(updatedProducts);
        setEditingId(null);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        alert('✅ 저장되었습니다!');
      }
    } catch (error) {
      alert('❌ 저장 실패');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('정말로 삭제하시겠습니까?')) return;

    try {
      const updatedProducts = products.filter((p) => p.id !== id);
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProducts),
      });

      if (response.ok) {
        setProducts(updatedProducts);
        alert('✅ 삭제되었습니다!');
      }
    } catch (error) {
      alert('❌ 삭제 실패');
    }
  };

  return (
    <div className="min-h-screen bg-vita-ivory p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="font-serif-display text-4xl text-vita-green">
            🛍️ 상품 관리
          </h1>
          <button
            onClick={handleAddNew}
            className="bg-vita-gold text-white px-6 py-2 rounded-lg font-semibold hover:bg-vita-gold/90 transition-colors"
          >
            + 새 상품 추가
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 상품 목록 */}
          <div>
            <h2 className="font-serif-display text-2xl text-vita-green mb-4">
              상품 목록
            </h2>
            <div className="space-y-2">
              {products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleEdit(product)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    editingId === product.id
                      ? 'border-vita-gold bg-vita-cream'
                      : 'border-vita-green/20 bg-white hover:border-vita-gold'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-vita-charcoal">
                        {product.name}
                      </h3>
                      <p className="text-sm text-vita-stone">
                        ₩{product.price.toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(product.id);
                      }}
                      className="text-red-500 hover:text-red-700 font-semibold text-sm"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 상품 편집 폼 */}
          {editingId && (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="font-serif-display text-2xl text-vita-green mb-6">
                상품 {editingId} 편집
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-vita-charcoal mb-2">
                    상품명
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full p-2 border-2 border-vita-green/20 rounded-lg focus:outline-none focus:border-vita-green"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-vita-charcoal mb-2">
                    가격 (원)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2 border-2 border-vita-green/20 rounded-lg focus:outline-none focus:border-vita-green"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-vita-charcoal mb-2">
                    산지
                  </label>
                  <input
                    type="text"
                    value={formData.origin}
                    onChange={(e) =>
                      setFormData({ ...formData, origin: e.target.value })
                    }
                    placeholder="예: 그리스 크레타"
                    className="w-full p-2 border-2 border-vita-green/20 rounded-lg focus:outline-none focus:border-vita-green"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-vita-charcoal mb-2">
                    짧은 설명
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    placeholder="예: 상큼함, 생과일향"
                    className="w-full p-2 border-2 border-vita-green/20 rounded-lg focus:outline-none focus:border-vita-green"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-vita-charcoal mb-2">
                    태그 (쉼표로 구분)
                  </label>
                  <input
                    type="text"
                    value={formData.tags.join(', ')}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tags: e.target.value
                          .split(',')
                          .map((t) => t.trim())
                          .filter((t) => t),
                      })
                    }
                    placeholder="예: 상큼함, 생과일향"
                    className="w-full p-2 border-2 border-vita-green/20 rounded-lg focus:outline-none focus:border-vita-green"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-vita-charcoal mb-2">
                    상품 이미지 URL
                  </label>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) =>
                      setFormData({ ...formData, image: e.target.value })
                    }
                    className="w-full p-2 border-2 border-vita-green/20 rounded-lg focus:outline-none focus:border-vita-green text-xs"
                  />
                  {formData.image && (
                    <img
                      src={formData.image}
                      alt="preview"
                      className="mt-2 max-h-32 rounded"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-vita-charcoal mb-2">
                    상세 설명 (상세페이지에 표시)
                  </label>
                  <textarea
                    value={formData.details}
                    onChange={(e) =>
                      setFormData({ ...formData, details: e.target.value })
                    }
                    className="w-full p-2 border-2 border-vita-green/20 rounded-lg focus:outline-none focus:border-vita-green h-32"
                    placeholder="상품에 대한 자세한 설명을 입력하세요..."
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleSaveProduct}
                    className="flex-1 bg-vita-green text-white px-4 py-2 rounded-lg font-semibold hover:bg-vita-green-deep transition-colors"
                  >
                    💾 저장
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="flex-1 bg-vita-stone text-white px-4 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity"
                  >
                    취소
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {saved && (
          <div className="fixed bottom-8 right-8 bg-green-500 text-white px-6 py-3 rounded-lg font-semibold">
            ✅ 저장되었습니다!
          </div>
        )}
      </div>
    </div>
  );
}

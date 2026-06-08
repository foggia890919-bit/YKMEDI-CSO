'use client';

import { useState } from 'react';

interface ImageConfig {
  hero: string;
  products: {
    1: string;
    2: string;
    3: string;
    4: string;
  };
  brandStory: string;
}

export default function ImageAdmin() {
  const [config, setConfig] = useState<ImageConfig>({
    hero: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DKftYJhPYte6fzx7UlgD1iYDar/hf_20260608_184055_73c767ec-b72c-42a4-9f3b-12b302b51a96.jpeg',
    products: {
      1: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DKftYJhPYte6fzx7UlgD1iYDar/hf_20260608_184100_37751ea1-feb0-4142-a80d-ae22e1c27fb7.png',
      2: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DKftYJhPYte6fzx7UlgD1iYDar/hf_20260608_184101_6db206a9-fcd2-42e4-81b4-2169931065d2.png',
      3: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DKftYJhPYte6fzx7UlgD1iYDar/hf_20260608_184102_804eb490-04ce-4fb5-a7ca-ca561e72623c.png',
      4: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DKftYJhPYte6fzx7UlgD1iYDar/hf_20260608_184103_7ae3f5cb-0991-4f1b-ad5a-7b100eb45e65.png',
    },
    brandStory: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DKftYJhPYte6fzx7UlgD1iYDar/hf_20260608_184111_a220615c-a3d1-45b3-9a9d-e521ff1a9eb5.png',
  });

  const [saved, setSaved] = useState(false);

  const handleHeroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({ ...config, hero: e.target.value });
    setSaved(false);
  };

  const handleProductChange = (id: 1 | 2 | 3 | 4, value: string) => {
    setConfig({
      ...config,
      products: { ...config.products, [id]: value },
    });
    setSaved(false);
  };

  const handleBrandStoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfig({ ...config, brandStory: e.target.value });
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      const response = await fetch('/api/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        alert('✅ 저장되었습니다! 홈페이지를 새로고침해주세요.');
      } else {
        alert('❌ 저장 실패');
      }
    } catch (error) {
      alert('❌ 저장 중 오류가 발생했습니다');
    }
  };

  const products = [
    { id: 1, name: 'Premium Extra Virgin' },
    { id: 2, name: 'Golden Selection' },
    { id: 3, name: 'Heritage Estate' },
    { id: 4, name: 'Morning Blend' },
  ];

  return (
    <div className="min-h-screen bg-vita-ivory p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-serif-display text-4xl text-vita-green mb-8">
          🖼️ 이미지 관리자
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
          {/* 메인 히어로 */}
          <div>
            <h2 className="font-serif-display text-2xl text-vita-green mb-4">
              메인 히어로 이미지
            </h2>
            <input
              type="text"
              value={config.hero}
              onChange={handleHeroChange}
              className="w-full p-3 border-2 border-vita-green/20 rounded-lg focus:outline-none focus:border-vita-green"
              placeholder="이미지 URL 입력..."
            />
            {config.hero && (
              <img src={config.hero} alt="hero preview" className="mt-4 max-h-64 rounded-lg" />
            )}
          </div>

          {/* 상품 이미지 */}
          <div>
            <h2 className="font-serif-display text-2xl text-vita-green mb-4">
              상품 이미지 (4개)
            </h2>
            <div className="space-y-6">
              {products.map((product) => (
                <div key={product.id}>
                  <label className="block text-sm font-semibold text-vita-charcoal mb-2">
                    {product.id}. {product.name}
                  </label>
                  <input
                    type="text"
                    value={config.products[product.id as 1 | 2 | 3 | 4]}
                    onChange={(e) =>
                      handleProductChange(product.id as 1 | 2 | 3 | 4, e.target.value)
                    }
                    className="w-full p-3 border-2 border-vita-green/20 rounded-lg focus:outline-none focus:border-vita-green"
                    placeholder="이미지 URL 입력..."
                  />
                  {config.products[product.id as 1 | 2 | 3 | 4] && (
                    <img
                      src={config.products[product.id as 1 | 2 | 3 | 4]}
                      alt={`product-${product.id}`}
                      className="mt-3 max-h-48 rounded-lg"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 브랜드 스토리 */}
          <div>
            <h2 className="font-serif-display text-2xl text-vita-green mb-4">
              브랜드 스토리 이미지
            </h2>
            <input
              type="text"
              value={config.brandStory}
              onChange={handleBrandStoryChange}
              className="w-full p-3 border-2 border-vita-green/20 rounded-lg focus:outline-none focus:border-vita-green"
              placeholder="이미지 URL 입력..."
            />
            {config.brandStory && (
              <img
                src={config.brandStory}
                alt="brand story preview"
                className="mt-4 max-h-64 rounded-lg"
              />
            )}
          </div>

          {/* 저장 버튼 */}
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              className="bg-vita-green text-white px-8 py-3 rounded-lg font-semibold hover:bg-vita-green-deep transition-colors"
            >
              💾 저장
            </button>
            {saved && (
              <div className="flex items-center gap-2 text-green-600 font-semibold">
                ✅ 저장되었습니다!
              </div>
            )}
          </div>

          {/* 설명 */}
          <div className="bg-vita-cream p-4 rounded-lg text-sm text-vita-charcoal">
            <p className="font-semibold mb-2">📝 사용 방법:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>이미지 URL을 입력하면 바로 미리보기가 표시됩니다</li>
              <li>원하는 이미지로 변경 후 &quot;저장&quot;을 누르세요</li>
              <li>저장 후 홈페이지를 새로고침하면 변경사항이 반영됩니다</li>
              <li>Hixelsfield로 새 이미지를 생성한 후 URL을 복사-붙여넣기하면 됩니다</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

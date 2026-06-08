'use client';

import { useState, useEffect } from 'react';

interface ContentConfig {
  hero: {
    eyebrow: string;
    heading: string;
    description: string;
    button1: string;
    button2: string;
    stat1Title: string;
    stat1Desc: string;
    stat2Title: string;
    stat2Desc: string;
    stat3Title: string;
    stat3Desc: string;
  };
  products: {
    title: string;
    subtitle: string;
  };
  brandStory: {
    eyebrow: string;
    title: string;
    description1: string;
    description2: string;
  };
}

const DEFAULT_CONFIG: ContentConfig = {
  hero: {
    eyebrow: 'Premium Olive Oil',
    heading: '자연 그대로의\n생명력을 담다',
    description: '지중해의 햇살과 시간이 빚어낸 엑스트라 버진 올리브오일.\n매일의 식탁에 건강한 웰니스를 더합니다.',
    button1: '컬렉션 둘러보기',
    button2: '브랜드 스토리',
    stat1Title: '30+',
    stat1Desc: '년의 전문성',
    stat2Title: '100%',
    stat2Desc: '첫 수확 콜드프레스',
    stat3Title: '4.9★',
    stat3Desc: '고객 만족도',
  },
  products: {
    title: '엄선된 컬렉션',
    subtitle: '지중해 각지의 명품 산지에서 직접 선별한 네 가지 시그니처 오일',
  },
  brandStory: {
    eyebrow: 'Our Story',
    title: '한 그루의 나무에서\n시작된 정직함',
    description1:
      '비타앤오리진은 30년간 지중해 최고의 올리브 농장과 직접 파트너십을\n맺어왔습니다. 수확부터 병입까지, 자연의 생명력을 그대로 담기 위해\n타협하지 않습니다.',
    description2:
      '건강한 식습관과 웰니스 라이프스타일을 추구하는 분들을 위해,\n매 순간 최고의 올리브오일만을 선별합니다.',
  },
};

export default function ContentAdmin() {
  const [content, setContent] = useState<ContentConfig>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'hero' | 'products' | 'brandStory'>('hero');

  useEffect(() => {
    const loadContent = async () => {
      try {
        const res = await fetch('/api/content');
        if (res.ok) {
          const data = await res.json();
          setContent(data);
        }
      } catch (error) {
        console.error('Failed to load content:', error);
      }
    };
    loadContent();
  }, []);

  const handleSave = async () => {
    try {
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
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

  const updateHero = (field: keyof typeof content.hero, value: string) => {
    setContent({
      ...content,
      hero: { ...content.hero, [field]: value },
    });
  };

  const updateProducts = (field: keyof typeof content.products, value: string) => {
    setContent({
      ...content,
      products: { ...content.products, [field]: value },
    });
  };

  const updateBrandStory = (field: keyof typeof content.brandStory, value: string) => {
    setContent({
      ...content,
      brandStory: { ...content.brandStory, [field]: value },
    });
  };

  return (
    <div className="min-h-screen bg-vita-ivory p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="font-serif-display text-4xl text-vita-green mb-8">
          ✏️ 콘텐츠 관리자
        </h1>

        {/* 탭 네비게이션 */}
        <div className="flex gap-4 mb-8 border-b-2 border-vita-green/20">
          {(['hero', 'products', 'brandStory'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-semibold transition-colors ${
                activeTab === tab
                  ? 'text-vita-green border-b-2 border-vita-green'
                  : 'text-vita-stone'
              }`}
            >
              {tab === 'hero' && '🏠 메인'}
              {tab === 'products' && '🛍️ 상품'}
              {tab === 'brandStory' && '🌳 브랜드'}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          {/* 메인 섹션 */}
          {activeTab === 'hero' && (
            <div className="space-y-6">
              <h2 className="font-serif-display text-2xl text-vita-green">메인 히어로 섹션</h2>

              <div>
                <label className="block text-sm font-semibold text-vita-charcoal mb-2">
                  작은 제목 (Eyebrow)
                </label>
                <input
                  type="text"
                  value={content.hero.eyebrow}
                  onChange={(e) => updateHero('eyebrow', e.target.value)}
                  className="w-full p-3 border-2 border-vita-green/20 rounded-lg focus:outline-none focus:border-vita-green"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-vita-charcoal mb-2">
                  큰 제목 (메인 헤딩)
                </label>
                <textarea
                  value={content.hero.heading}
                  onChange={(e) => updateHero('heading', e.target.value)}
                  className="w-full p-3 border-2 border-vita-green/20 rounded-lg focus:outline-none focus:border-vita-green h-24"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-vita-charcoal mb-2">
                  설명 텍스트
                </label>
                <textarea
                  value={content.hero.description}
                  onChange={(e) => updateHero('description', e.target.value)}
                  className="w-full p-3 border-2 border-vita-green/20 rounded-lg focus:outline-none focus:border-vita-green h-24"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-vita-charcoal mb-2">
                    버튼 1 텍스트
                  </label>
                  <input
                    type="text"
                    value={content.hero.button1}
                    onChange={(e) => updateHero('button1', e.target.value)}
                    className="w-full p-3 border-2 border-vita-green/20 rounded-lg focus:outline-none focus:border-vita-green"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-vita-charcoal mb-2">
                    버튼 2 텍스트
                  </label>
                  <input
                    type="text"
                    value={content.hero.button2}
                    onChange={(e) => updateHero('button2', e.target.value)}
                    className="w-full p-3 border-2 border-vita-green/20 rounded-lg focus:outline-none focus:border-vita-green"
                  />
                </div>
              </div>

              <div className="border-t-2 border-vita-green/10 pt-6">
                <h3 className="font-semibold text-vita-green mb-4">통계 섹션</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-vita-charcoal mb-2">
                      통계 1 - 제목
                    </label>
                    <input
                      type="text"
                      value={content.hero.stat1Title}
                      onChange={(e) => updateHero('stat1Title', e.target.value)}
                      className="w-full p-3 border-2 border-vita-green/20 rounded-lg focus:outline-none focus:border-vita-green"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-vita-charcoal mb-2">
                      통계 1 - 설명
                    </label>
                    <input
                      type="text"
                      value={content.hero.stat1Desc}
                      onChange={(e) => updateHero('stat1Desc', e.target.value)}
                      className="w-full p-3 border-2 border-vita-green/20 rounded-lg focus:outline-none focus:border-vita-green"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-vita-charcoal mb-2">
                      통계 2 - 제목
                    </label>
                    <input
                      type="text"
                      value={content.hero.stat2Title}
                      onChange={(e) => updateHero('stat2Title', e.target.value)}
                      className="w-full p-3 border-2 border-vita-green/20 rounded-lg focus:outline-none focus:border-vita-green"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-vita-charcoal mb-2">
                      통계 2 - 설명
                    </label>
                    <input
                      type="text"
                      value={content.hero.stat2Desc}
                      onChange={(e) => updateHero('stat2Desc', e.target.value)}
                      className="w-full p-3 border-2 border-vita-green/20 rounded-lg focus:outline-none focus:border-vita-green"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-vita-charcoal mb-2">
                      통계 3 - 제목
                    </label>
                    <input
                      type="text"
                      value={content.hero.stat3Title}
                      onChange={(e) => updateHero('stat3Title', e.target.value)}
                      className="w-full p-3 border-2 border-vita-green/20 rounded-lg focus:outline-none focus:border-vita-green"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-vita-charcoal mb-2">
                      통계 3 - 설명
                    </label>
                    <input
                      type="text"
                      value={content.hero.stat3Desc}
                      onChange={(e) => updateHero('stat3Desc', e.target.value)}
                      className="w-full p-3 border-2 border-vita-green/20 rounded-lg focus:outline-none focus:border-vita-green"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 상품 섹션 */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              <h2 className="font-serif-display text-2xl text-vita-green">상품 섹션</h2>

              <div>
                <label className="block text-sm font-semibold text-vita-charcoal mb-2">
                  섹션 제목
                </label>
                <input
                  type="text"
                  value={content.products.title}
                  onChange={(e) => updateProducts('title', e.target.value)}
                  className="w-full p-3 border-2 border-vita-green/20 rounded-lg focus:outline-none focus:border-vita-green"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-vita-charcoal mb-2">
                  섹션 부제목
                </label>
                <textarea
                  value={content.products.subtitle}
                  onChange={(e) => updateProducts('subtitle', e.target.value)}
                  className="w-full p-3 border-2 border-vita-green/20 rounded-lg focus:outline-none focus:border-vita-green h-20"
                />
              </div>

              <div className="bg-vita-cream p-4 rounded-lg text-sm text-vita-charcoal">
                <p className="font-semibold mb-2">💡 상품 추가/수정:</p>
                <p>상품 목록은 🛍️ 상품 관리 페이지에서 관리하세요</p>
                <p className="text-xs text-vita-stone mt-2">
                  /admin/products에서 상품을 추가, 수정, 삭제할 수 있습니다
                </p>
              </div>
            </div>
          )}

          {/* 브랜드 스토리 섹션 */}
          {activeTab === 'brandStory' && (
            <div className="space-y-6">
              <h2 className="font-serif-display text-2xl text-vita-green">브랜드 스토리 섹션</h2>

              <div>
                <label className="block text-sm font-semibold text-vita-charcoal mb-2">
                  작은 제목 (Eyebrow)
                </label>
                <input
                  type="text"
                  value={content.brandStory.eyebrow}
                  onChange={(e) => updateBrandStory('eyebrow', e.target.value)}
                  className="w-full p-3 border-2 border-vita-green/20 rounded-lg focus:outline-none focus:border-vita-green"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-vita-charcoal mb-2">
                  큰 제목
                </label>
                <textarea
                  value={content.brandStory.title}
                  onChange={(e) => updateBrandStory('title', e.target.value)}
                  className="w-full p-3 border-2 border-vita-green/20 rounded-lg focus:outline-none focus:border-vita-green h-20"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-vita-charcoal mb-2">
                  설명 1
                </label>
                <textarea
                  value={content.brandStory.description1}
                  onChange={(e) => updateBrandStory('description1', e.target.value)}
                  className="w-full p-3 border-2 border-vita-green/20 rounded-lg focus:outline-none focus:border-vita-green h-24"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-vita-charcoal mb-2">
                  설명 2
                </label>
                <textarea
                  value={content.brandStory.description2}
                  onChange={(e) => updateBrandStory('description2', e.target.value)}
                  className="w-full p-3 border-2 border-vita-green/20 rounded-lg focus:outline-none focus:border-vita-green h-24"
                />
              </div>
            </div>
          )}

          {/* 저장 버튼 */}
          <div className="flex gap-4 pt-6 border-t-2 border-vita-green/10">
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
        </div>
      </div>
    </div>
  );
}

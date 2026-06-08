'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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

interface ImageConfig {
  hero: string;
  products: Record<string, string>;
  brandStory: string;
}

const DEFAULT_CONTENT: ContentConfig = {
  hero: {
    eyebrow: 'Premium Olive Oil',
    heading: '자연 그대로의\n생명력을 담다',
    description:
      '지중해의 햇살과 시간이 빚어낸 엑스트라 버진 올리브오일.\n매일의 식탁에 건강한 웰니스를 더합니다.',
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
      '비타앤오리진은 30년간 지중해 최고의 올리브 농장과 직접 파트너십을\n맺어왔습니다.',
    description2:
      '건강한 식습관과 웰니스 라이프스타일을 추구하는 분들을 위해,\n매 순간 최고의 올리브오일만을 선별합니다.',
  },
};

const DEFAULT_IMAGES: ImageConfig = {
  hero: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DKftYJhPYte6fzx7UlgD1iYDar/hf_20260608_184055_73c767ec-b72c-42a4-9f3b-12b302b51a96.jpeg',
  products: {
    1: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DKftYJhPYte6fzx7UlgD1iYDar/hf_20260608_184100_37751ea1-feb0-4142-a80d-ae22e1c27fb7.png',
    2: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DKftYJhPYte6fzx7UlgD1iYDar/hf_20260608_184101_6db206a9-fcd2-42e4-81b4-2169931065d2.png',
    3: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DKftYJhPYte6fzx7UlgD1iYDar/hf_20260608_184102_804eb490-04ce-4fb5-a7ca-ca561e72623c.png',
    4: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DKftYJhPYte6fzx7UlgD1iYDar/hf_20260608_184103_7ae3f5cb-0991-4f1b-ad5a-7b100eb45e65.png',
  },
  brandStory:
    'https://d8j0ntlcm91z4.cloudfront.net/user_3DKftYJhPYte6fzx7UlgD1iYDar/hf_20260608_184111_a220615c-a3d1-45b3-9a9d-e521ff1a9eb5.png',
};

// 인라인 편집 가능한 텍스트 필드
function EditableText({
  value,
  onChange,
  multiline = false,
  className = '',
  placeholder = '',
}: {
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  className?: string;
  placeholder?: string;
}) {
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-white/70 backdrop-blur border-2 border-dashed border-[#c8a24a]/40 rounded-lg px-3 py-2 focus:outline-none focus:border-[#c8a24a] focus:bg-white transition resize-none ${className}`}
        rows={3}
      />
    );
  }
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full bg-white/70 backdrop-blur border-2 border-dashed border-[#c8a24a]/40 rounded-lg px-3 py-2 focus:outline-none focus:border-[#c8a24a] focus:bg-white transition ${className}`}
    />
  );
}

// 인라인 편집 가능한 이미지
function EditableImage({
  value,
  onChange,
  aspectClass,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  aspectClass: string;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <div className={`relative ${aspectClass} rounded-2xl overflow-hidden bg-gray-100 group`}>
        {value ? (
          <img src={value} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-gray-400">
            이미지 없음
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
          <span className="text-white text-sm font-semibold">🖼️ {label}</span>
        </div>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="이미지 URL 붙여넣기..."
        className="w-full text-xs bg-white border-2 border-dashed border-[#c8a24a]/40 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#c8a24a]"
      />
    </div>
  );
}

const PRODUCT_NAMES = [
  'Premium Extra Virgin',
  'Golden Selection',
  'Heritage Estate',
  'Morning Blend',
];

export default function SiteEditor() {
  const [content, setContent] = useState<ContentConfig>(DEFAULT_CONTENT);
  const [images, setImages] = useState<ImageConfig>(DEFAULT_IMAGES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, iRes] = await Promise.all([
          fetch('/api/content'),
          fetch('/api/images'),
        ]);
        if (cRes.ok) setContent(await cRes.json());
        if (iRes.ok) setImages(await iRes.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const [c, i] = await Promise.all([
        fetch('/api/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(content),
        }),
        fetch('/api/images', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(images),
        }),
      ]);
      if (c.ok && i.ok) {
        alert('✅ 저장되었습니다! 홈페이지에 바로 반영됩니다.');
      } else {
        alert('❌ 저장 실패');
      }
    } catch (e) {
      alert('❌ 저장 중 오류가 발생했습니다');
    } finally {
      setSaving(false);
    }
  };

  const setHero = (field: keyof ContentConfig['hero'], v: string) =>
    setContent({ ...content, hero: { ...content.hero, [field]: v } });
  const setProductsContent = (field: keyof ContentConfig['products'], v: string) =>
    setContent({ ...content, products: { ...content.products, [field]: v } });
  const setBrand = (field: keyof ContentConfig['brandStory'], v: string) =>
    setContent({ ...content, brandStory: { ...content.brandStory, [field]: v } });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-lg text-gray-600">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0ede8] pb-32">
      {/* 상단 안내 바 */}
      <div className="sticky top-0 z-50 bg-gradient-to-r from-[#2d5016] to-[#3d6b1f] text-white py-4 shadow-lg">
        <div className="wellness-container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-white/70 hover:text-white text-sm">
              ← 대시보드
            </Link>
            <h1 className="font-serif-display text-xl">🎨 홈페이지 편집기</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden md:inline text-xs text-white/70">
              점선 박스를 클릭해서 바로 수정하세요
            </span>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#c8a24a] text-white px-6 py-2 rounded-full font-semibold hover:bg-[#b8923a] transition disabled:opacity-50"
            >
              {saving ? '저장 중...' : '💾 저장하기'}
            </button>
          </div>
        </div>
      </div>

      <div className="wellness-container py-8 space-y-6">
        {/* === 히어로 섹션 === */}
        <section className="bg-vita-ivory rounded-3xl p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#c8a24a] mb-4">
            ① 메인 히어로 섹션
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-gray-500">작은 제목</span>
                <EditableText
                  value={content.hero.eyebrow}
                  onChange={(v) => setHero('eyebrow', v)}
                  className="text-sm uppercase tracking-widest text-[#c8a24a] font-semibold"
                />
              </div>
              <div>
                <span className="text-[10px] text-gray-500">큰 제목 (줄바꿈 가능)</span>
                <EditableText
                  value={content.hero.heading}
                  onChange={(v) => setHero('heading', v)}
                  multiline
                  className="font-serif-display text-3xl text-vita-green"
                />
              </div>
              <div>
                <span className="text-[10px] text-gray-500">설명</span>
                <EditableText
                  value={content.hero.description}
                  onChange={(v) => setHero('description', v)}
                  multiline
                  className="text-vita-stone"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] text-gray-500">버튼 1</span>
                  <EditableText
                    value={content.hero.button1}
                    onChange={(v) => setHero('button1', v)}
                    className="text-center font-semibold"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-gray-500">버튼 2</span>
                  <EditableText
                    value={content.hero.button2}
                    onChange={(v) => setHero('button2', v)}
                    className="text-center font-semibold"
                  />
                </div>
              </div>
              {/* 통계 */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                {([1, 2, 3] as const).map((n) => (
                  <div key={n} className="space-y-1">
                    <span className="text-[10px] text-gray-500">통계 {n}</span>
                    <EditableText
                      value={content.hero[`stat${n}Title` as keyof ContentConfig['hero']]}
                      onChange={(v) => setHero(`stat${n}Title` as keyof ContentConfig['hero'], v)}
                      className="font-serif-display text-xl text-vita-green text-center"
                    />
                    <EditableText
                      value={content.hero[`stat${n}Desc` as keyof ContentConfig['hero']]}
                      onChange={(v) => setHero(`stat${n}Desc` as keyof ContentConfig['hero'], v)}
                      className="text-xs text-vita-stone text-center"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-gray-500">히어로 이미지</span>
              <EditableImage
                value={images.hero}
                onChange={(v) => setImages({ ...images, hero: v })}
                aspectClass="aspect-[4/5]"
                label="히어로 이미지"
              />
            </div>
          </div>
        </section>

        {/* === 상품 섹션 === */}
        <section className="bg-white rounded-3xl p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#c8a24a] mb-4">
            ② 상품 컬렉션 섹션
          </p>
          <div className="max-w-xl mx-auto text-center space-y-3 mb-8">
            <div>
              <span className="text-[10px] text-gray-500">섹션 제목</span>
              <EditableText
                value={content.products.title}
                onChange={(v) => setProductsContent('title', v)}
                className="font-serif-display text-2xl text-vita-green text-center"
              />
            </div>
            <div>
              <span className="text-[10px] text-gray-500">섹션 부제목</span>
              <EditableText
                value={content.products.subtitle}
                onChange={(v) => setProductsContent('subtitle', v)}
                className="text-vita-stone text-center text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {([1, 2, 3, 4] as const).map((id) => (
              <div key={id}>
                <span className="text-[10px] text-gray-500">
                  상품 {id}: {PRODUCT_NAMES[id - 1]}
                </span>
                <EditableImage
                  value={images.products[id] || ''}
                  onChange={(v) =>
                    setImages({
                      ...images,
                      products: { ...images.products, [id]: v },
                    })
                  }
                  aspectClass="aspect-[4/5]"
                  label={`상품 ${id} 이미지`}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 bg-[#fff5f1] rounded-xl p-4 text-sm text-[#8b7355]">
            💡 상품의 이름·가격·설명은{' '}
            <Link href="/admin/products" className="text-[#c8a24a] font-semibold underline">
              상품 관리
            </Link>{' '}
            페이지에서 수정하세요. 여기서는 메인페이지 이미지만 바꿉니다.
          </div>
        </section>

        {/* === 브랜드 스토리 섹션 === */}
        <section className="bg-vita-cream rounded-3xl p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#c8a24a] mb-4">
            ③ 브랜드 스토리 섹션
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-[10px] text-gray-500">브랜드 스토리 이미지</span>
              <EditableImage
                value={images.brandStory}
                onChange={(v) => setImages({ ...images, brandStory: v })}
                aspectClass="aspect-[5/6]"
                label="브랜드 스토리 이미지"
              />
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-gray-500">작은 제목</span>
                <EditableText
                  value={content.brandStory.eyebrow}
                  onChange={(v) => setBrand('eyebrow', v)}
                  className="text-sm uppercase tracking-widest text-[#c8a24a] font-semibold"
                />
              </div>
              <div>
                <span className="text-[10px] text-gray-500">큰 제목 (줄바꿈 가능)</span>
                <EditableText
                  value={content.brandStory.title}
                  onChange={(v) => setBrand('title', v)}
                  multiline
                  className="font-serif-display text-2xl text-vita-green"
                />
              </div>
              <div>
                <span className="text-[10px] text-gray-500">설명 1</span>
                <EditableText
                  value={content.brandStory.description1}
                  onChange={(v) => setBrand('description1', v)}
                  multiline
                  className="text-vita-charcoal/80 text-sm"
                />
              </div>
              <div>
                <span className="text-[10px] text-gray-500">설명 2</span>
                <EditableText
                  value={content.brandStory.description2}
                  onChange={(v) => setBrand('description2', v)}
                  multiline
                  className="text-vita-stone text-sm"
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 하단 고정 저장 바 (모바일) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden z-50">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#2d5016] text-white py-3 rounded-full font-semibold disabled:opacity-50"
        >
          {saving ? '저장 중...' : '💾 저장하기'}
        </button>
      </div>
    </div>
  );
}

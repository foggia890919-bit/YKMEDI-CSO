'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface HeroContent {
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
}

export default function Hero() {
  const [heroImage, setHeroImage] = useState(
    'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=1200&q=80'
  );
  const [content, setContent] = useState<HeroContent>({
    eyebrow: 'Vita & Origin',
    heading: '진정한 웰니스의\n시작입니다',
    description: '건강한 삶을 위한 정직한 선택. 지중해의 최고 명품 올리브를 엄선하여 제공합니다.',
    button1: '컬렉션 보기',
    button2: '우리의 이야기',
    stat1Title: '5가지',
    stat1Desc: '올리브오일 품종',
    stat2Title: '100%',
    stat2Desc: '콜드프레스',
    stat3Title: '건강한',
    stat3Desc: '웰니스 라이프',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [imagesRes, contentRes] = await Promise.all([
          fetch('/api/images'),
          fetch('/api/content'),
        ]);

        if (imagesRes.ok) {
          const imageData = await imagesRes.json();
          setHeroImage(imageData.hero);
        }

        if (contentRes.ok) {
          const contentData = await contentRes.json();
          setContent(contentData.hero);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    loadData();
  }, []);

  return (
    <section className="relative overflow-hidden bg-white">
      {/* 배경 장식 - 활발한 그린 톤 */}
      <div className="pointer-events-none absolute -top-40 -right-24 h-[600px] w-[600px] rounded-full bg-green-100/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full bg-amber-100/30 blur-3xl" />

      <div className="wellness-container relative grid grid-cols-1 items-center gap-16 py-24 md:py-32 lg:grid-cols-2">
        {/* 텍스트 섹션 */}
        <div className="reveal space-y-8">
          <div>
            <span className="inline-block rounded-full bg-green-50 px-4 py-2 text-sm font-bold text-green-600 mb-4">
              ✨ {content.eyebrow}
            </span>
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold leading-[1.1] text-charcoal">
              {content.heading.split('\n').map((line, i) => (
                <div key={i}>
                  {line.includes('웰니스') ? (
                    <>
                      {line.split('웰니스')[0]}
                      <span className="text-green-600">웰니스</span>
                      {line.split('웰니스')[1]}
                    </>
                  ) : (
                    line
                  )}
                </div>
              ))}
            </h1>
          </div>

          <p className="text-xl md:text-2xl leading-relaxed text-gray-600 max-w-2xl">
            {content.description}
          </p>

          {/* 버튼 그룹 */}
          <div className="flex flex-wrap gap-4 pt-4">
            <Link
              href="/shop"
              className="px-8 py-4 bg-green-600 text-white font-bold rounded-full hover:bg-green-700 transition-colors text-lg"
            >
              {content.button1} →
            </Link>
            <Link
              href="#story"
              className="px-8 py-4 border-2 border-green-600 text-green-600 font-bold rounded-full hover:bg-green-50 transition-colors text-lg"
            >
              {content.button2}
            </Link>
          </div>

          {/* 신뢰 지표 */}
          <div className="grid grid-cols-3 gap-8 pt-8 border-t border-gray-200">
            <div className="space-y-2">
              <p className="text-4xl md:text-5xl font-bold text-green-600">
                {content.stat1Title}
              </p>
              <p className="text-gray-600 font-medium">{content.stat1Desc}</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl md:text-5xl font-bold text-green-600">
                {content.stat2Title}
              </p>
              <p className="text-gray-600 font-medium">{content.stat2Desc}</p>
            </div>
            <div className="space-y-2">
              <p className="text-3xl md:text-4xl font-bold text-green-600">
                {content.stat3Title}
              </p>
              <p className="text-gray-600 font-medium text-sm">{content.stat3Desc}</p>
            </div>
          </div>
        </div>

        {/* 이미지 슬롯 */}
        <div className="reveal">
          <div className="relative aspect-square rounded-3xl overflow-hidden shadow-2xl group">
            <img
              src={heroImage}
              alt="Vita & Origin 프리미엄 올리브오일"
              className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}

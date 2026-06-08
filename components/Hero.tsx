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
    'https://d8j0ntlcm91z4.cloudfront.net/user_3DKftYJhPYte6fzx7UlgD1iYDar/hf_20260608_184055_73c767ec-b72c-42a4-9f3b-12b302b51a96.jpeg'
  );
  const [content, setContent] = useState<HeroContent>({
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
    <section className="relative overflow-hidden bg-vita-ivory">
      {/* 배경 장식 */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-[520px] w-[520px] rounded-full bg-vita-gold/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-[420px] w-[420px] rounded-full bg-vita-green/10 blur-3xl" />

      <div className="wellness-container relative grid grid-cols-1 items-center gap-12 py-20 md:py-28 lg:grid-cols-2">
        {/* 텍스트 */}
        <div className="reveal">
          <span className="eyebrow mb-6">{content.eyebrow}</span>
          <h1 className="font-serif-display text-5xl leading-[1.1] text-vita-green md:text-6xl lg:text-7xl">
            {content.heading.split('\n').map((line, i) => (
              <div key={i}>
                {line.includes('생명력') ? (
                  <>
                    {line.split('생명력')[0]}
                    <span className="text-vita-gold">생명력</span>
                    {line.split('생명력')[1]}
                  </>
                ) : (
                  line
                )}
              </div>
            ))}
          </h1>
          <p className="mt-7 max-w-md text-lg leading-relaxed text-vita-stone">
            {content.description.split('\n').map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/shop" className="vita-button">
              {content.button1}
            </Link>
            <Link href="#story" className="vita-button-ghost">
              {content.button2}
            </Link>
          </div>

          {/* 신뢰 지표 */}
          <div className="mt-12 flex gap-10">
            <div>
              <p className="font-serif-display text-3xl text-vita-green">
                {content.stat1Title.includes('+') ? (
                  <>
                    {content.stat1Title.replace('+', '')}<span className="text-vita-gold">+</span>
                  </>
                ) : (
                  content.stat1Title
                )}
              </p>
              <p className="mt-1 text-sm text-vita-stone">{content.stat1Desc}</p>
            </div>
            <div className="border-l border-vita-charcoal/10 pl-10">
              <p className="font-serif-display text-3xl text-vita-green">
                {content.stat2Title.includes('%') ? (
                  <>
                    {content.stat2Title.replace('%', '')}<span className="text-vita-gold">%</span>
                  </>
                ) : (
                  content.stat2Title
                )}
              </p>
              <p className="mt-1 text-sm text-vita-stone">{content.stat2Desc}</p>
            </div>
            <div className="border-l border-vita-charcoal/10 pl-10">
              <p className="font-serif-display text-3xl text-vita-green">
                {content.stat3Title.includes('★') ? (
                  <>
                    {content.stat3Title.replace('★', '')}<span className="text-vita-gold">★</span>
                  </>
                ) : (
                  content.stat3Title
                )}
              </p>
              <p className="mt-1 text-sm text-vita-stone">{content.stat3Desc}</p>
            </div>
          </div>
        </div>

        {/* 이미지 슬롯 (힉스필드 AI 고급 히어로 이미지) */}
        <div className="reveal">
          <div className="image-slot floaty aspect-[4/5] rounded-[28px] shadow-2xl overflow-hidden">
            <img
              src={heroImage}
              alt="비타앤오리진 프리미엄 올리브오일 - 지중해의 황금빛"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

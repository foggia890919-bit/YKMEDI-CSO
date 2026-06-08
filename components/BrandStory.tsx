'use client';

import { useEffect, useState } from 'react';

interface BrandStoryContent {
  eyebrow: string;
  title: string;
  description1: string;
  description2: string;
}

export default function BrandStory() {
  const [brandStoryImage, setBrandStoryImage] = useState(
    'https://d8j0ntlcm91z4.cloudfront.net/user_3DKftYJhPYte6fzx7UlgD1iYDar/hf_20260608_184111_a220615c-a3d1-45b3-9a9d-e521ff1a9eb5.png'
  );
  const [content, setContent] = useState<BrandStoryContent>({
    eyebrow: 'Our Story',
    title: '한 그루의 나무에서\n시작된 정직함',
    description1: '비타앤오리진은 30년간 지중해 최고의 올리브 농장과 직접 파트너십을\n맺어왔습니다. 수확부터 병입까지, 자연의 생명력을 그대로 담기 위해\n타협하지 않습니다.',
    description2: '건강한 식습관과 웰니스 라이프스타일을 추구하는 분들을 위해,\n매 순간 최고의 올리브오일만을 선별합니다.',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [imagesRes, contentRes] = await Promise.all([
          fetch('/api/images'),
          fetch('/api/content'),
        ]);

        if (imagesRes.ok) {
          const imagesData = await imagesRes.json();
          setBrandStoryImage(imagesData.brandStory);
        }

        if (contentRes.ok) {
          const contentData = await contentRes.json();
          setContent(contentData.brandStory);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    loadData();
  }, []);

  const points = [
    '100% 자연 상태 보존',
    '첫 수확 콜드프레스',
    '국제 품질 인증',
    '투명한 산지 직거래',
  ];

  return (
    <section id="story" className="bg-vita-cream py-24">
      <div className="wellness-container">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          {/* 고급 AI 생성 브랜드 스토리 이미지 */}
          <div className="reveal order-2 lg:order-1">
            <div className="image-slot aspect-[5/6] rounded-[28px] shadow-xl overflow-hidden">
              <img
                src={brandStoryImage}
                alt="올리브 나무와 지중해 풍경 - 30년의 농장 이야기"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          {/* 텍스트 */}
          <div className="reveal order-1 lg:order-2">
            <span className="eyebrow mb-6">{content.eyebrow}</span>
            <h2 className="font-serif-display text-4xl leading-tight text-vita-green md:text-5xl">
              {content.title.split('\n').map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </h2>
            <p className="mt-7 text-lg leading-relaxed text-vita-charcoal/80">
              {content.description1.split('\n').map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </p>
            <p className="mt-4 leading-relaxed text-vita-stone">
              {content.description2.split('\n').map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </p>

            <ul className="mt-9 grid grid-cols-2 gap-4">
              {points.map((p) => (
                <li key={p} className="flex items-center gap-3 text-vita-charcoal">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-vita-green text-sm text-white">
                    ✓
                  </span>
                  <span className="text-sm font-medium">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

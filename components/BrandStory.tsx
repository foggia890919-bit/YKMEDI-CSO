'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface BrandStoryContent {
  eyebrow: string;
  title: string;
  description1: string;
  description2: string;
}

export default function BrandStory() {
  const [brandStoryImage, setBrandStoryImage] = useState(
    'https://images.unsplash.com/photo-1445264718234-a623be589d37?w=900&q=80'
  );
  const [content, setContent] = useState<BrandStoryContent>({
    eyebrow: 'Our Story',
    title: '가장 정직한 기원에서\n시작된 순수한 생명력',
    description1:
      '비타앤오리진은 지중해 최고의 올리브 농장과 직접 파트너십을 맺습니다. 수확부터 병입까지, 자연의 생명력을 그대로 담기 위해 타협하지 않습니다.',
    description2:
      '매일 아침 세포를 깨우는 신선한 한 스푼. 건강한 웰니스 라이프를 추구하는 분들을 위해 가장 활기찬 오일만을 선별합니다.',
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
          if (imagesData.brandStory) setBrandStoryImage(imagesData.brandStory);
        }
        if (contentRes.ok) {
          const contentData = await contentRes.json();
          if (contentData.brandStory) setContent(contentData.brandStory);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    loadData();
  }, []);

  const points = [
    { icon: '🌿', label: '100% 자연 상태 보존' },
    { icon: '❄️', label: '첫 수확 콜드프레스' },
    { icon: '🏆', label: '국제 품질 인증' },
    { icon: '🤝', label: '투명한 산지 직거래' },
  ];

  return (
    <section id="story" className="bg-soft-white py-28">
      <div className="wellness-container">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          {/* 이미지 */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="order-2 lg:order-1"
          >
            <div className="relative aspect-[5/6] overflow-hidden rounded-[2rem] shadow-2xl">
              <img
                src={brandStoryImage}
                alt="올리브 나무와 지중해 풍경"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-midnight-forest/30 to-transparent" />
            </div>
          </motion.div>

          {/* 텍스트 */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="order-1 lg:order-2"
          >
            <span className="inline-block rounded-full bg-active-lime/15 px-4 py-2 text-sm font-bold text-active-lime-dark">
              {content.eyebrow}
            </span>
            <h2 className="mt-4 text-4xl font-extrabold leading-tight text-midnight-forest md:text-5xl">
              {content.title.split('\n').map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-gray-600">
              {content.description1}
            </p>
            <p className="mt-4 leading-relaxed text-gray-500">{content.description2}</p>

            <ul className="mt-9 grid grid-cols-2 gap-4">
              {points.map((p) => (
                <li
                  key={p.label}
                  className="flex items-center gap-3 rounded-xl bg-lime-50 px-4 py-3"
                >
                  <span className="text-xl">{p.icon}</span>
                  <span className="text-sm font-semibold text-midnight-forest">
                    {p.label}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

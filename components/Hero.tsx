'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

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

const TRUST_ITEMS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2C7 7 7 13 12 22C17 13 17 7 12 2Z" strokeLinejoin="round" />
      </svg>
    ),
    title: '100%',
    desc: '자연 유래',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 3C12 3 5 11 5 16a7 7 0 0014 0c0-5-7-13-7-13Z" strokeLinejoin="round" />
      </svg>
    ),
    title: '엑스트라버진',
    desc: '프리미엄 오일',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6l7-3Z" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: '엄격한 품질',
    desc: '& 안전 관리',
  },
];

export default function Hero() {
  const [heroImage, setHeroImage] = useState(
    'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=1200&q=80'
  );
  const [content, setContent] = useState<HeroContent>({
    eyebrow: 'Vita & Origin',
    heading: 'VIBRANT LIFE,\nPURE ORIGIN',
    description:
      '자연이 설계한 생명력, 비타앤오리진이 전하는 가장 액티브한 프리미엄 오일 컬렉션.',
    button1: 'Shop Now',
    button2: 'Our Story',
    stat1Title: '5가지',
    stat1Desc: '프리미엄 품종',
    stat2Title: '0.1%',
    stat2Desc: '초정밀 산도',
    stat3Title: '650',
    stat3Desc: '폴리페놀 mg/kg',
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
          if (imageData.hero) setHeroImage(imageData.hero);
        }
        if (contentRes.ok) {
          const contentData = await contentRes.json();
          if (contentData.hero) setContent(contentData.hero);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    loadData();
  }, []);

  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.15, duration: 0.6, ease: 'easeOut' as const },
    }),
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-lime-50 via-green-50 to-emerald-100">
      {/* 동적 블러 그라데이션 구체 */}
      <motion.div
        className="pointer-events-none absolute -top-32 right-1/4 h-[500px] w-[500px] rounded-full bg-active-lime/20 blur-3xl"
        animate={{ scale: [1, 1.15, 1], x: [0, 30, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute -bottom-40 -left-20 h-[450px] w-[450px] rounded-full bg-emerald-200/40 blur-3xl"
        animate={{ scale: [1, 1.2, 1], y: [0, -20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="wellness-container relative grid grid-cols-1 items-center gap-12 py-20 md:py-28 lg:grid-cols-2">
        {/* 좌측: 핵심 메시지 */}
        <div className="space-y-7">
          <motion.h1
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-5xl font-extrabold leading-[1.02] tracking-tight md:text-6xl lg:text-7xl"
          >
            {content.heading.split('\n').map((line, i) => (
              <span key={i} className="block">
                {i === 0 ? (
                  <span className="text-midnight-forest">{line}</span>
                ) : (
                  <span className="text-active-lime-dark">{line}</span>
                )}
              </span>
            ))}
          </motion.h1>

          {/* 오렌지 액센트 대시 */}
          <motion.div
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="flex items-center gap-2"
          >
            <span className="h-1 w-12 rounded-full bg-active-orange" />
            <span className="h-1.5 w-1.5 rounded-full bg-active-orange" />
          </motion.div>

          <motion.p
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="max-w-md text-lg leading-relaxed text-gray-600"
          >
            자연이 설계한 생명력, 비타앤오리진이 전하는 가장{' '}
            <span className="font-bold text-active-orange">액티브한</span> 프리미엄 오일
            컬렉션.
          </motion.p>

          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="flex flex-wrap gap-4"
          >
            <Link
              href="/shop"
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-active-lime to-active-lime-dark px-8 py-4 text-lg font-bold text-midnight-forest shadow-lg shadow-active-lime/40 transition-transform hover:scale-105"
            >
              {content.button1} <span className="text-xl">›</span>
            </Link>
            <Link
              href="#story"
              className="flex items-center gap-2 rounded-full border-2 border-midnight-forest/30 px-8 py-4 text-lg font-bold text-midnight-forest transition-colors hover:border-midnight-forest"
            >
              {content.button2} <span className="text-xl">›</span>
            </Link>
          </motion.div>

          {/* 신뢰 지표 (아이콘) */}
          <motion.div
            custom={4}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="flex flex-wrap items-center gap-6 border-t border-green-200/60 pt-8"
          >
            {TRUST_ITEMS.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-active-lime-dark">{item.icon}</span>
                <div>
                  <p className="text-sm font-bold text-midnight-forest">{item.title}</p>
                  <p className="text-xs text-gray-500">{item.desc}</p>
                </div>
                {i < TRUST_ITEMS.length - 1 && (
                  <span className="ml-3 hidden h-8 w-px bg-green-200 md:block" />
                )}
              </div>
            ))}
          </motion.div>
        </div>

        {/* 우측: 다이내믹 제품 비주얼 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative"
        >
          <motion.div
            className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-2xl"
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <img
              src={heroImage}
              alt="Vita & Origin 프리미엄 올리브오일"
              className="h-full w-full object-cover"
            />
          </motion.div>

          {/* 평점 배지 */}
          <motion.div
            className="absolute -bottom-4 right-4 rounded-2xl bg-white/95 px-6 py-4 shadow-xl backdrop-blur"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="flex items-center gap-2">
              <span className="text-active-orange">★★★★★</span>
              <span className="text-lg font-bold text-midnight-forest">4.9</span>
              <span className="text-sm text-gray-400">(1,248)</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-active-lime-dark">
              Wellness Life, Every Day
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

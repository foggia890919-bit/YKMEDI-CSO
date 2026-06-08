'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { VARIETIES } from '@/lib/varieties';

const FEATURES = [
  { icon: '🌿', title: 'SINGLE ORIGIN', desc: '단일 품종의 순수함' },
  { icon: '💧', title: 'EARLY HARVEST', desc: '초기 수확의 신선함' },
  { icon: '❄️', title: 'COLD EXTRACTION', desc: '저온 추출로 영양 그대로' },
  { icon: '🧪', title: 'LAB TESTED', desc: '철저한 품질 검사' },
];

// 시안 기준 컬렉션 (4종 싱글 오리진)
const COLLECTION = VARIETIES.filter((v) =>
  ['picual', 'arbequina', 'koroneiki', 'avocado'].includes(v.id)
);

const FLAVOR_LABEL: Record<string, string> = {
  picual: 'Robust & Spicy',
  arbequina: 'Delicate & Sweet',
  koroneiki: 'High-Polyphenol Power',
  avocado: 'Hass Premium',
};

export default function Products() {
  return (
    <section id="products" className="relative overflow-hidden bg-midnight-forest py-28">
      {/* 배경 글로우 */}
      <div className="pointer-events-none absolute right-0 top-0 h-96 w-96 rounded-full bg-active-lime/10 blur-3xl" />

      <div className="wellness-container relative">
        {/* 헤더 */}
        <div className="mb-16 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-extrabold tracking-tight text-white md:text-6xl"
          >
            THE SINGLE-ORIGIN COLLECTION
          </motion.h2>
          <p className="mt-4 text-lg text-active-lime/80">
            단 하나의 품종에 온전히 담긴 자연의 활력
          </p>
          <div className="mx-auto mt-6 flex items-center justify-center gap-2">
            <span className="h-px w-12 bg-active-lime/40" />
            <span className="text-active-lime">🌿</span>
            <span className="h-px w-12 bg-active-lime/40" />
          </div>
        </div>

        {/* 품종 카드 그리드 */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {COLLECTION.map((v, idx) => (
            <motion.div
              key={v.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="group relative overflow-hidden rounded-3xl border p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-2"
              style={{
                borderColor: `${v.theme.primary}40`,
                background: `linear-gradient(160deg, ${v.theme.primary}18 0%, rgba(11,27,16,0.4) 70%)`,
              }}
            >
              {/* 번호 배지 */}
              <span
                className="absolute left-5 top-4 text-2xl font-bold opacity-60"
                style={{ color: v.theme.light }}
              >
                0{idx + 1}
              </span>

              {/* 글로우 */}
              <div
                className="pointer-events-none absolute -right-10 top-10 h-40 w-40 rounded-full blur-2xl transition-opacity duration-500 group-hover:opacity-80"
                style={{ backgroundColor: `${v.theme.primary}30`, opacity: 0.4 }}
              />

              {/* 제품 이미지 */}
              <div className="relative mt-8 mb-6 flex h-52 items-center justify-center">
                <img
                  src={v.image}
                  alt={v.name}
                  className="h-full w-full rounded-2xl object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* 이름 */}
              <h3
                className="text-2xl font-extrabold tracking-wide"
                style={{ color: v.theme.light }}
              >
                {v.nameEn}
                <span className="ml-2 text-sm font-medium text-white/60">{v.name}</span>
              </h3>

              {/* 풍미 태그 */}
              <div
                className="mt-3 rounded-xl px-4 py-3"
                style={{ backgroundColor: `${v.theme.primary}25` }}
              >
                <p className="text-sm font-bold" style={{ color: v.theme.light }}>
                  {FLAVOR_LABEL[v.id]}
                </p>
                <p className="mt-0.5 text-xs text-white/70">{v.tagline}</p>
              </div>

              {/* 가격 + 추가 버튼 */}
              <div className="mt-5 flex items-center justify-between">
                <span className="text-xl font-bold text-white">
                  ₩{v.price.toLocaleString()}
                </span>
                <Link
                  href={`/product/${VARIETIES.indexOf(v) + 1}`}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-active-orange text-2xl font-bold text-white shadow-lg transition-transform hover:scale-110"
                  aria-label={`${v.name} 보기`}
                >
                  +
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 하단 기능 강조 */}
        <div className="mt-20 grid grid-cols-2 gap-8 border-t border-white/10 pt-12 md:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="flex items-center gap-4"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full border border-active-lime/30 text-2xl">
                {f.icon}
              </span>
              <div>
                <p className="text-sm font-bold tracking-wide text-active-lime">
                  {f.title}
                </p>
                <p className="text-sm text-white/60">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* 전체 보기 */}
        <div className="mt-16 text-center">
          <Link
            href="/shop"
            className="inline-block rounded-full bg-active-lime px-10 py-4 text-lg font-bold text-midnight-forest transition-transform hover:scale-105"
          >
            전체 컬렉션 보기 →
          </Link>
        </div>
      </div>
    </section>
  );
}

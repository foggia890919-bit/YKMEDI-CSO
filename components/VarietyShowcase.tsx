'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { VARIETIES } from '@/lib/varieties';
import { CircularGauge, BarGauge } from './SpecGauge';

export default function VarietyShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = VARIETIES[activeIndex];

  return (
    <section
      id="varieties"
      className="relative overflow-hidden py-24 transition-colors duration-700"
      style={{
        background: `linear-gradient(135deg, ${active.theme.primary}10 0%, #FAF9F6 60%)`,
      }}
    >
      {/* 동적 배경 블러 */}
      <motion.div
        key={`bg-${active.id}`}
        className="pointer-events-none absolute -top-40 right-0 h-[600px] w-[600px] rounded-full blur-3xl"
        style={{ backgroundColor: `${active.theme.primary}20` }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      />

      <div className="wellness-container relative">
        {/* 헤더 */}
        <div className="mb-12 text-center">
          <span
            className="inline-block rounded-full px-4 py-2 text-sm font-bold transition-colors duration-500"
            style={{
              backgroundColor: `${active.theme.primary}20`,
              color: active.theme.text,
            }}
          >
            🫒 품종별 컬렉션
          </span>
          <h2 className="mt-4 text-4xl font-bold text-midnight-forest md:text-5xl">
            당신의 활력을 선택하세요
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-gray-600">
            품종을 선택하면 각 오일의 시그니처 무드와 헬스 스펙을 확인할 수 있습니다
          </p>
        </div>

        {/* 품종 선택 탭 */}
        <div className="mb-12 flex flex-wrap justify-center gap-3">
          {VARIETIES.map((variety, idx) => (
            <button
              key={variety.id}
              onClick={() => setActiveIndex(idx)}
              className="relative rounded-full px-6 py-3 text-sm font-bold transition-all duration-300"
              style={{
                color: activeIndex === idx ? '#fff' : '#6B7280',
              }}
            >
              {activeIndex === idx && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: variety.theme.primary }}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative z-10">{variety.nameEn}</span>
            </button>
          ))}
        </div>

        {/* 메인 쇼케이스 카드 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2"
          >
            {/* 좌측: 제품 이미지 + 정보 */}
            <div className="space-y-6">
              <motion.div
                className="relative aspect-square overflow-hidden rounded-3xl shadow-2xl"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <img
                  src={active.image}
                  alt={active.name}
                  className="h-full w-full object-cover"
                />
                <div
                  className="absolute inset-0 mix-blend-overlay"
                  style={{ backgroundColor: `${active.theme.primary}30` }}
                />
              </motion.div>
            </div>

            {/* 우측: 스펙 대시보드 */}
            <div className="space-y-6">
              <div>
                <p
                  className="text-sm font-bold uppercase tracking-widest"
                  style={{ color: active.theme.primary }}
                >
                  {active.origin}
                </p>
                <h3 className="mt-1 text-4xl font-bold text-midnight-forest">
                  {active.name}
                </h3>
                <p className="mt-2 text-lg font-semibold text-gray-500">
                  {active.tagline}
                </p>
                <p className="mt-4 leading-relaxed text-gray-600">
                  {active.description}
                </p>
              </div>

              {/* 풍미 노트 */}
              <div className="flex flex-wrap gap-2">
                {active.flavorNotes.map((note) => (
                  <span
                    key={note}
                    className="rounded-full px-3 py-1.5 text-sm font-medium"
                    style={{
                      backgroundColor: `${active.theme.primary}15`,
                      color: active.theme.text,
                    }}
                  >
                    {note}
                  </span>
                ))}
              </div>

              {/* 헬스 대시보드 게이지 */}
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-6 flex items-center justify-around">
                  <CircularGauge
                    value={active.specs.polyphenol}
                    max={700}
                    label="폴리페놀"
                    unit="mg/kg"
                    color={active.theme.primary}
                  />
                  <CircularGauge
                    value={active.specs.acidity}
                    max={0.8}
                    label="산도"
                    unit="%"
                    color={active.theme.primary}
                    displayValue={active.specs.acidity.toFixed(2)}
                  />
                </div>
                <div className="space-y-4 border-t border-gray-100 pt-6">
                  <BarGauge
                    value={active.specs.freshness}
                    max={100}
                    label="신선도"
                    color={active.theme.primary}
                  />
                  <BarGauge
                    value={active.specs.intensity}
                    max={100}
                    label="풍미 강도"
                    color={active.theme.primary}
                  />
                  <BarGauge
                    value={active.specs.smokePoint}
                    max={280}
                    label="발연점"
                    color={active.theme.primary}
                    unit="℃"
                  />
                </div>
              </div>

              {/* 가격 + CTA */}
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-midnight-forest">
                  ₩{active.price.toLocaleString()}
                </span>
                <Link
                  href="/shop"
                  className="rounded-full px-8 py-4 font-bold text-white transition-transform hover:scale-105"
                  style={{ backgroundColor: active.theme.primary }}
                >
                  구매하기 →
                </Link>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

'use client';

import { motion } from 'framer-motion';

const TESTIMONIALS = [
  {
    name: '김은진',
    role: '영양사',
    text: '건강한 지방산 함량이 뛰어나고, 신선한 맛이 정말 좋습니다. 환자분들께도 추천합니다.',
  },
  {
    name: '박선호',
    role: '셰프',
    text: '요리에 사용하는 올리브오일 중 가장 품질이 좋습니다. 풍미도 뛰어나고요.',
  },
  {
    name: '이지현',
    role: '웰니스 라이프 실천자',
    text: '매일 아침 한 스푼씩 먹고 있어요. 체력도 좋아지고 피부도 탄력있어졌어요.',
  },
  {
    name: '최준호',
    role: '푸드 블로거',
    text: '진짜 프리미엄 올리브오일이에요. 가격도 합리적이고 배송도 빨라요!',
  },
];

export default function Testimonials() {
  return (
    <section className="bg-lime-50/50 py-28">
      <div className="wellness-container">
        <div className="mb-16 text-center">
          <span className="inline-block rounded-full bg-active-lime/15 px-4 py-2 text-sm font-bold text-active-lime-dark">
            Reviews
          </span>
          <h2 className="mt-4 text-4xl font-extrabold text-midnight-forest md:text-5xl">
            건강한 변화를 경험한 사람들
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TESTIMONIALS.map((t, idx) => (
            <motion.figure
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="mb-4 text-active-orange">★★★★★</div>
              <blockquote className="flex-1 leading-relaxed text-gray-600">
                “{t.text}”
              </blockquote>
              <figcaption className="mt-6 border-t border-gray-100 pt-4">
                <p className="text-lg font-bold text-midnight-forest">{t.name}</p>
                <p className="text-sm text-active-lime-dark">{t.role}</p>
              </figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

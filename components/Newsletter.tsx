'use client';

import { useState } from 'react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // 메일 구독 API 호출
      console.log('Newsletter signup:', email);
      setSubmitted(true);
      setEmail('');
      setTimeout(() => setSubmitted(false), 3000);
    }
  };

  return (
    <section className="bg-[#2d5016] text-white py-16">
      <div className="wellness-container max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">
          최신 소식을 받아보세요
        </h2>
        <p className="mb-8 text-gray-300">
          신제품 출시, 특별 할인, 웰니스 팁을 메일로 받아보세요
        </p>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            placeholder="이메일 주소"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-4 py-3 rounded text-gray-900"
            required
          />
          <button
            type="submit"
            className="bg-[#d4a574] text-white px-6 py-3 rounded hover:bg-[#c09560] transition font-bold"
          >
            구독
          </button>
        </form>

        {submitted && (
          <p className="mt-4 text-green-300">✓ 구독 감사합니다!</p>
        )}
      </div>
    </section>
  );
}

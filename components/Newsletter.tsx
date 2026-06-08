'use client';

import { useState } from 'react';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      console.log('Newsletter signup:', email);
      setSubmitted(true);
      setEmail('');
      setTimeout(() => setSubmitted(false), 3000);
    }
  };

  return (
    <section className="bg-vita-green py-24">
      <div className="wellness-container">
        <div className="reveal mx-auto max-w-2xl text-center">
          <span className="eyebrow justify-center mb-5 text-vita-gold-soft">Newsletter</span>
          <h2 className="font-serif-display text-4xl text-white md:text-5xl">
            웰니스 레터를 받아보세요
          </h2>
          <p className="mt-5 text-white/70">
            신제품 출시, 특별 할인, 그리고 올리브오일 활용 레시피를 가장 먼저 전해드립니다.
          </p>

          <form onSubmit={handleSubmit} className="mx-auto mt-9 flex max-w-md flex-col gap-3 sm:flex-row">
            <input
              type="email"
              placeholder="이메일 주소"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-full border border-white/20 bg-white/10 px-5 py-3.5 text-white placeholder-white/50 outline-none transition focus:border-vita-gold focus:bg-white/15"
              required
            />
            <button
              type="submit"
              className="rounded-full bg-vita-gold px-7 py-3.5 font-semibold text-vita-charcoal transition hover:bg-vita-gold-soft"
            >
              구독하기
            </button>
          </form>

          {submitted && (
            <p className="mt-4 text-vita-gold-soft">✓ 구독해 주셔서 감사합니다!</p>
          )}
        </div>
      </div>
    </section>
  );
}

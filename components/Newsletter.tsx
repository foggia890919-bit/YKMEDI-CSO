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
    <section className="bg-midnight-forest py-28">
      <div className="wellness-container">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-block rounded-full bg-active-lime/20 px-4 py-2 text-sm font-bold text-active-lime">
            Wellness Club
          </span>
          <h2 className="mt-4 text-4xl font-extrabold text-white md:text-5xl">
            매일의 활력을 받아보세요
          </h2>
          <p className="mt-5 text-white/60">
            신제품 출시, 특별 할인, 그리고 건강한 오일 활용 레시피를 가장 먼저 전해드립니다.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mx-auto mt-9 flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              placeholder="이메일 주소"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-full border border-white/20 bg-white/10 px-5 py-3.5 text-white placeholder-white/40 outline-none transition focus:border-active-lime focus:bg-white/15"
              required
            />
            <button
              type="submit"
              className="rounded-full bg-active-lime px-7 py-3.5 font-bold text-midnight-forest transition hover:bg-active-lime-dark"
            >
              구독하기
            </button>
          </form>

          {submitted && (
            <p className="mt-4 font-semibold text-active-lime">
              ✓ 구독해 주셔서 감사합니다!
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

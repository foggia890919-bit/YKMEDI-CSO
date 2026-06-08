import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-vita-ivory">
      {/* 배경 장식 */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-[520px] w-[520px] rounded-full bg-vita-gold/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-24 h-[420px] w-[420px] rounded-full bg-vita-green/10 blur-3xl" />

      <div className="wellness-container relative grid grid-cols-1 items-center gap-12 py-20 md:py-28 lg:grid-cols-2">
        {/* 텍스트 */}
        <div className="reveal">
          <span className="eyebrow mb-6">Premium Olive Oil</span>
          <h1 className="font-serif-display text-5xl leading-[1.1] text-vita-green md:text-6xl lg:text-7xl">
            자연 그대로의
            <br />
            <span className="text-vita-gold">생명력</span>을 담다
          </h1>
          <p className="mt-7 max-w-md text-lg leading-relaxed text-vita-stone">
            지중해의 햇살과 시간이 빚어낸 엑스트라 버진 올리브오일.
            매일의 식탁에 건강한 웰니스를 더합니다.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href="/shop" className="vita-button">
              컬렉션 둘러보기
            </Link>
            <Link href="#story" className="vita-button-ghost">
              브랜드 스토리
            </Link>
          </div>

          {/* 신뢰 지표 */}
          <div className="mt-12 flex gap-10">
            <div>
              <p className="font-serif-display text-3xl text-vita-green">30<span className="text-vita-gold">+</span></p>
              <p className="mt-1 text-sm text-vita-stone">년의 전문성</p>
            </div>
            <div className="border-l border-vita-charcoal/10 pl-10">
              <p className="font-serif-display text-3xl text-vita-green">100<span className="text-vita-gold">%</span></p>
              <p className="mt-1 text-sm text-vita-stone">첫 수확 콜드프레스</p>
            </div>
            <div className="border-l border-vita-charcoal/10 pl-10">
              <p className="font-serif-display text-3xl text-vita-green">4.9<span className="text-vita-gold">★</span></p>
              <p className="mt-1 text-sm text-vita-stone">고객 만족도</p>
            </div>
          </div>
        </div>

        {/* 이미지 슬롯 (힉스필드 히어로 이미지가 들어갈 자리) */}
        <div className="reveal">
          <div className="image-slot floaty aspect-[4/5] rounded-[28px] shadow-2xl">
            {/* 이미지 준비되면 아래 주석 해제:
            <img src="/images/hero.jpg" alt="비타앤오리진 올리브오일" /> */}
            <div className="flex h-full w-full flex-col items-center justify-center text-center">
              <span className="text-7xl">🫒</span>
              <p className="mt-4 px-8 text-sm text-vita-stone">
                지중해 햇살 아래의 황금빛 올리브오일
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

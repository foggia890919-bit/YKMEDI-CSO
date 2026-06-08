import Link from 'next/link';

export default function Hero() {
  return (
    <section className="bg-[#f5f3f0] py-20">
      <div className="wellness-container text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-[#2d5016] mb-6">
          프리미엄 올리브오일
        </h1>
        <p className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto">
          세계 최고의 올리브오일을 엄선하여 제공합니다.
          <br />
          당신의 웰니스 라이프스타일을 위한 완벽한 선택입니다.
        </p>
        <Link
          href="/shop"
          className="vita-button inline-block"
        >
          지금 쇼핑하기
        </Link>
      </div>
    </section>
  );
}

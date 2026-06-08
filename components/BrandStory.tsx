export default function BrandStory() {
  const points = [
    '100% 자연 상태 보존',
    '첫 수확 콜드프레스',
    '국제 품질 인증',
    '투명한 산지 직거래',
  ];

  return (
    <section id="story" className="bg-vita-cream py-24">
      <div className="wellness-container">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
          {/* 이미지 슬롯 (브랜드 스토리 이미지) */}
          <div className="reveal order-2 lg:order-1">
            <div className="image-slot aspect-[5/6] rounded-[28px] shadow-xl">
              {/* <img src="/images/brand-story.jpg" alt="올리브 나무와 지중해 풍경" /> */}
              <div className="flex h-full w-full flex-col items-center justify-center text-center">
                <span className="text-7xl">🌿</span>
                <p className="mt-4 text-sm text-vita-stone">30년의 올리브 농장 이야기</p>
              </div>
            </div>
          </div>

          {/* 텍스트 */}
          <div className="reveal order-1 lg:order-2">
            <span className="eyebrow mb-6">Our Story</span>
            <h2 className="font-serif-display text-4xl leading-tight text-vita-green md:text-5xl">
              한 그루의 나무에서
              <br />
              시작된 정직함
            </h2>
            <p className="mt-7 text-lg leading-relaxed text-vita-charcoal/80">
              비타앤오리진은 30년간 지중해 최고의 올리브 농장과 직접 파트너십을
              맺어왔습니다. 수확부터 병입까지, 자연의 생명력을 그대로 담기 위해
              타협하지 않습니다.
            </p>
            <p className="mt-4 leading-relaxed text-vita-stone">
              건강한 식습관과 웰니스 라이프스타일을 추구하는 분들을 위해,
              매 순간 최고의 올리브오일만을 선별합니다.
            </p>

            <ul className="mt-9 grid grid-cols-2 gap-4">
              {points.map((p) => (
                <li key={p} className="flex items-center gap-3 text-vita-charcoal">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-vita-green text-sm text-white">
                    ✓
                  </span>
                  <span className="text-sm font-medium">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

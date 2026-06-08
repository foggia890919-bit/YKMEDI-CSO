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
    <section className="bg-vita-ivory py-24">
      <div className="wellness-container">
        <div className="reveal mb-16 text-center">
          <span className="eyebrow justify-center mb-5">Reviews</span>
          <h2 className="font-serif-display text-4xl text-vita-green md:text-5xl">
            고객의 이야기
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TESTIMONIALS.map((t, idx) => (
            <figure
              key={idx}
              className="reveal flex h-full flex-col rounded-2xl border border-vita-charcoal/5 bg-white p-7 shadow-sm"
              style={{ transitionDelay: `${idx * 80}ms` }}
            >
              <div className="mb-4 text-vita-gold">★★★★★</div>
              <blockquote className="flex-1 leading-relaxed text-vita-charcoal/80">
                “{t.text}”
              </blockquote>
              <figcaption className="mt-6 border-t border-vita-charcoal/5 pt-4">
                <p className="font-serif-display text-lg text-vita-green">{t.name}</p>
                <p className="text-sm text-vita-stone">{t.role}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

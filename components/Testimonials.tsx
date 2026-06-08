const TESTIMONIALS = [
  {
    name: '김은진',
    role: '영양사',
    text: '건강한 지방산 함량이 뛰어나고, 신선한 맛이 정말 좋습니다. 환자분들께도 추천합니다.',
    rating: 5
  },
  {
    name: '박선호',
    role: '셰프',
    text: '요리에 사용하는 올리브오일 중 가장 품질이 좋습니다. 풍미도 뛰어나고요.',
    rating: 5
  },
  {
    name: '이지현',
    role: '웰니스 라이프 실천자',
    text: '매일 아침 한스푼씩 먹고 있어요. 체력도 좋아지고 피부도 탄력있어졌어요.',
    rating: 5
  },
  {
    name: '최준호',
    role: '푸드 블로거',
    text: '진짜 프리미엄 올리브오일이에요. 가격도 합리적이고 배송도 빨라요!',
    rating: 5
  }
];

export default function Testimonials() {
  return (
    <section className="py-16 bg-[#f5f3f0]">
      <div className="wellness-container">
        <h2 className="text-4xl font-bold text-[#2d5016] mb-12 text-center">
          고객 후기
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TESTIMONIALS.map((testimonial, idx) => (
            <div key={idx} className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <span key={i} className="text-xl">⭐</span>
                ))}
              </div>
              <p className="text-gray-700 mb-4 line-clamp-3">"{testimonial.text}"</p>
              <div>
                <p className="font-bold text-[#2d5016]">{testimonial.name}</p>
                <p className="text-sm text-gray-500">{testimonial.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

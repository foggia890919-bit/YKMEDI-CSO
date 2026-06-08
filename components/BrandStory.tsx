export default function BrandStory() {
  return (
    <section id="story" className="bg-white py-16">
      <div className="wellness-container">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-[#2d5016] mb-6">
              비타앤오리진 이야기
            </h2>
            <p className="text-gray-700 mb-4 text-lg leading-relaxed">
              30년의 올리브오일 전문성으로 시작된 비타앤오리진.
              우리는 지중해 최고의 올리브 농장과 직접 파트너십을 맺고,
              수확부터 병입까지 엄격한 품질 관리를 합니다.
            </p>
            <p className="text-gray-700 mb-4 text-lg leading-relaxed">
              건강한 식습관과 웰니스 라이프스타일을 추구하는 분들을 위해,
              최고의 올리브오일만을 선별합니다.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <span className="text-2xl">✓</span>
                <span className="text-gray-700">100% 자연 상태 보존</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-2xl">✓</span>
                <span className="text-gray-700">첫 수확 올리브오일 우선</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-2xl">✓</span>
                <span className="text-gray-700">국제 품질 인증</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-2xl">✓</span>
                <span className="text-gray-700">투명한 유통 관리</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-[#f5f3f0] to-[#e8e4df] h-96 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-8xl mb-4">🌿</div>
              <p className="text-gray-700 font-semibold">세계 최고의 올리브오일</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#2d5016] text-white">
      <div className="wellness-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">비타앤오리진</h3>
            <p className="text-gray-300">
              세계 최고의 올리브오일을 선별하여 제공합니다.
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-4">상품</h4>
            <ul className="space-y-2 text-gray-300">
              <li><Link href="#" className="hover:text-white">올리브오일</Link></li>
              <li><Link href="#" className="hover:text-white">액세서리</Link></li>
              <li><Link href="#" className="hover:text-white">기프트 세트</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">고객 서비스</h4>
            <ul className="space-y-2 text-gray-300">
              <li><Link href="#" className="hover:text-white">배송 정보</Link></li>
              <li><Link href="#" className="hover:text-white">반품 정책</Link></li>
              <li><Link href="#" className="hover:text-white">FAQ</Link></li>
              <li><Link href="#" className="hover:text-white">문의</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4">팔로우</h4>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#" className="hover:text-white">Instagram</a></li>
              <li><a href="#" className="hover:text-white">Facebook</a></li>
              <li><a href="#" className="hover:text-white">Naver Blog</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="text-center text-gray-400">
            <p>&copy; 2024 비타앤오리진. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

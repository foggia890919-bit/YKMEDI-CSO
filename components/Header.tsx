'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
    setIsProfileOpen(false);
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="wellness-container">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="text-2xl font-bold text-[#2d5016]">
            비타앤오리진
          </Link>

          <nav className="hidden md:flex gap-8">
            <Link href="#products" className="text-gray-700 hover:text-[#2d5016]">
              제품
            </Link>
            <Link href="#story" className="text-gray-700 hover:text-[#2d5016]">
              브랜드 스토리
            </Link>
            <Link href="/shop" className="text-gray-700 hover:text-[#2d5016]">
              쇼핑
            </Link>
            <Link href="/cart" className="text-gray-700 hover:text-[#2d5016]">
              장바구니
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100"
                >
                  <span className="text-sm font-semibold text-gray-700">{user.name}</span>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <Link
                      href="/mypage"
                      className="block px-4 py-2 hover:bg-gray-100 border-b"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      내 정보
                    </Link>
                    <Link
                      href="/orders"
                      className="block px-4 py-2 hover:bg-gray-100 border-b"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      주문 내역
                    </Link>
                    <Link
                      href="/admin"
                      className="block px-4 py-2 hover:bg-gray-100 border-b"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      관리자 대시보드
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login" className="text-gray-700 hover:text-[#2d5016] text-sm">
                  로그인
                </Link>
                <Link href="/register" className="bg-[#2d5016] text-white px-4 py-2 rounded hover:bg-[#1f3810] text-sm">
                  회원가입
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {isOpen && (
          <nav className="md:hidden pb-4 flex flex-col gap-4">
            <Link href="#products" className="text-gray-700 hover:text-[#2d5016]">
              제품
            </Link>
            <Link href="#story" className="text-gray-700 hover:text-[#2d5016]">
              브랜드 스토리
            </Link>
            <Link href="/shop" className="text-gray-700 hover:text-[#2d5016]">
              쇼핑
            </Link>
            <Link href="/cart" className="text-gray-700 hover:text-[#2d5016]">
              장바구니
            </Link>
            {isAuthenticated ? (
              <>
                <Link href="/mypage" className="text-gray-700 hover:text-[#2d5016]">
                  내 정보
                </Link>
                <Link href="/orders" className="text-gray-700 hover:text-[#2d5016]">
                  주문 내역
                </Link>
                <button onClick={handleLogout} className="text-red-600 hover:text-red-800 text-left">
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-700 hover:text-[#2d5016]">
                  로그인
                </Link>
                <Link href="/register" className="text-gray-700 hover:text-[#2d5016]">
                  회원가입
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
}

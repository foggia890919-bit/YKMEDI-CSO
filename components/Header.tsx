'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

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
          </nav>
        )}
      </div>
    </header>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function MyPage() {
  const router = useRouter();
  const { user, isAuthenticated, setUser } = useAuthStore();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    email: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user) {
      setFormData({
        name: user.name,
        phone: user.phone,
        address: user.address,
        email: user.email,
      });
    }
  }, [isAuthenticated, router, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');

    try {
      // 실제로는 API를 통해 저장
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (user) {
        setUser({
          ...user,
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
        });
      }

      setMessage('정보가 저장되었습니다.');
      setIsEditing(false);

      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="py-12">
      <div className="wellness-container max-w-2xl">
        <h1 className="text-4xl font-bold text-[#2d5016] mb-8">내 정보</h1>

        <div className="bg-white rounded-lg shadow-md p-8">
          {message && (
            <div className={`mb-4 p-4 rounded ${
              message.includes('오류')
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-6">
            {/* 이메일 (읽기 전용) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                이메일
              </label>
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full border border-gray-300 rounded px-4 py-2 bg-gray-100 text-gray-600"
              />
              <p className="text-xs text-gray-500 mt-1">이메일은 변경할 수 없습니다.</p>
            </div>

            {/* 이름 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                이름
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full border border-gray-300 rounded px-4 py-2 ${
                  isEditing
                    ? 'focus:outline-none focus:border-[#2d5016]'
                    : 'bg-gray-100 text-gray-600'
                }`}
              />
            </div>

            {/* 전화번호 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                전화번호
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full border border-gray-300 rounded px-4 py-2 ${
                  isEditing
                    ? 'focus:outline-none focus:border-[#2d5016]'
                    : 'bg-gray-100 text-gray-600'
                }`}
                placeholder="010-0000-0000"
              />
            </div>

            {/* 주소 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                배송 기본 주소
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full border border-gray-300 rounded px-4 py-2 ${
                  isEditing
                    ? 'focus:outline-none focus:border-[#2d5016]'
                    : 'bg-gray-100 text-gray-600'
                }`}
                placeholder="시/도 구/군 동/읍 상세주소"
                rows={3}
              />
            </div>

            {/* 버튼 */}
            <div className="flex gap-4 pt-4">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex-1 vita-button"
                >
                  수정하기
                </button>
              ) : (
                <>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 vita-button disabled:opacity-50"
                  >
                    {isSaving ? '저장 중...' : '저장하기'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      if (user) {
                        setFormData({
                          name: user.name,
                          phone: user.phone,
                          address: user.address,
                          email: user.email,
                        });
                      }
                    }}
                    className="flex-1 border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50"
                  >
                    취소
                  </button>
                </>
              )}
            </div>
          </form>

          {/* 추가 정보 */}
          <div className="mt-8 pt-8 border-t space-y-4">
            <h2 className="text-lg font-bold text-[#2d5016]">빠른 링크</h2>
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/orders"
                className="p-4 border border-gray-200 rounded hover:border-[#2d5016] hover:bg-[#f5f3f0] transition text-center"
              >
                <p className="font-semibold text-[#2d5016]">주문 내역</p>
                <p className="text-xs text-gray-600">나의 주문 정보</p>
              </Link>
              <Link
                href="/shop"
                className="p-4 border border-gray-200 rounded hover:border-[#2d5016] hover:bg-[#f5f3f0] transition text-center"
              >
                <p className="font-semibold text-[#2d5016]">쇼핑 계속</p>
                <p className="text-xs text-gray-600">더 많은 상품 보기</p>
              </Link>
            </div>
          </div>

          {/* 계정 설정 */}
          <div className="mt-8 pt-8 border-t">
            <h2 className="text-lg font-bold text-[#2d5016] mb-4">계정 관리</h2>
            <div className="space-y-2">
              <button className="w-full text-left p-3 border border-gray-200 rounded hover:bg-gray-50">
                비밀번호 변경
              </button>
              <button className="w-full text-left p-3 border border-gray-200 rounded hover:bg-gray-50">
                알림 설정
              </button>
              <button className="w-full text-left p-3 border border-red-200 rounded hover:bg-red-50 text-red-600">
                계정 탈퇴
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

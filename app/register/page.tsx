'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    password: '',
    passwordConfirm: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password || !formData.name) {
      setError('필수 항목을 모두 입력하세요.');
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      await register(
        formData.email,
        formData.password,
        formData.passwordConfirm,
        formData.name,
        formData.phone
      );
      router.push('/');
    } catch (err: any) {
      setError(err.message || '회원가입 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="py-12">
      <div className="wellness-container max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-[#2d5016] mb-2 text-center">회원가입</h1>
          <p className="text-gray-600 text-center mb-8">비타앤오리진 계정을 만드세요</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                이메일
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-[#2d5016]"
                placeholder="example@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                이름
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-[#2d5016]"
                placeholder="홍길동"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                전화번호 (선택)
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-[#2d5016]"
                placeholder="010-0000-0000"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                비밀번호
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-[#2d5016]"
                placeholder="최소 6자 이상"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                비밀번호 확인
              </label>
              <input
                type="password"
                name="passwordConfirm"
                value={formData.passwordConfirm}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-[#2d5016]"
                placeholder="비밀번호 재입력"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full vita-button disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {isLoading ? '가입 중...' : '가입하기'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              이미 계정이 있으신가요?{' '}
              <Link href="/login" className="text-[#2d5016] font-semibold hover:underline">
                로그인
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

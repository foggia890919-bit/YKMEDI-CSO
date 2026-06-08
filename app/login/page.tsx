'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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

    if (!formData.email || !formData.password) {
      setError('이메일과 비밀번호를 입력하세요.');
      return;
    }

    try {
      await login(formData.email, formData.password);
      router.push('/');
    } catch (err: any) {
      setError(err.message || '로그인 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="py-12">
      <div className="wellness-container max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-[#2d5016] mb-2 text-center">로그인</h1>
          <p className="text-gray-600 text-center mb-8">비타앤오리진 계정으로 로그인하세요</p>

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
                비밀번호
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-[#2d5016]"
                placeholder="비밀번호 입력"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full vita-button disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="mt-6 space-y-3 text-center">
            <div>
              <Link href="#" className="text-[#2d5016] text-sm hover:underline">
                비밀번호를 잊으셨나요?
              </Link>
            </div>
            <p className="text-gray-600 text-sm">
              아직 계정이 없으신가요?{' '}
              <Link href="/register" className="text-[#2d5016] font-semibold hover:underline">
                회원가입
              </Link>
            </p>
          </div>

          {/* 테스트용 계정 */}
          <div className="mt-8 p-4 bg-[#f5f3f0] rounded text-xs text-gray-600">
            <p className="font-semibold mb-2">테스트 계정:</p>
            <p>이메일: test@example.com</p>
            <p>비밀번호: test123</p>
          </div>
        </div>
      </div>
    </div>
  );
}

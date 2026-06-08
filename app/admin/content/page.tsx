'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ContentRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/site');
  }, [router]);
  return (
    <div className="flex justify-center items-center h-96">
      <p className="text-gray-600">홈페이지 편집기로 이동 중...</p>
    </div>
  );
}

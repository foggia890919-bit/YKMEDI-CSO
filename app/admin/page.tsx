'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  totalCustomers: number;
  pendingOrders: number;
  shippedOrders: number;
  topProducts: { name: string; sales: number }[];
  adMetrics: {
    facebook: { clicks: number; conversions: number; roi: number };
    google: { clicks: number; conversions: number; roi: number };
    naver: { clicks: number; conversions: number; roi: number };
    kakao: { clicks: number; conversions: number; roi: number };
  };
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // 데이터 로드
    fetchStats();
  }, [isAuthenticated, router]);

  const fetchStats = async () => {
    try {
      // 실제로는 API에서 데이터를 가져옴
      const mockStats: DashboardStats = {
        totalOrders: 127,
        totalRevenue: 4850000,
        avgOrderValue: 38189,
        totalCustomers: 89,
        pendingOrders: 12,
        shippedOrders: 98,
        topProducts: [
          { name: 'Heritage Estate', sales: 35 },
          { name: 'Premium Extra Virgin', sales: 32 },
          { name: 'Golden Selection', sales: 28 },
          { name: 'Morning Blend', sales: 22 },
        ],
        adMetrics: {
          facebook: { clicks: 2450, conversions: 28, roi: 312 },
          google: { clicks: 3120, conversions: 45, roi: 385 },
          naver: { clicks: 1890, conversions: 22, roi: 268 },
          kakao: { clicks: 1340, conversions: 16, roi: 245 },
        },
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-lg text-gray-600">로딩 중...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="py-12">
        <div className="wellness-container text-center">
          <p className="text-lg text-gray-600">데이터를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#faf8f6]">
      {/* 관리자 헤더 */}
      <div className="bg-gradient-to-r from-[#2d5016] to-[#3d6b1f] text-white py-8 mb-12">
        <div className="wellness-container">
          <h1 className="font-serif-display text-4xl mb-2">🔐 관리자 대시보드</h1>
          <p className="text-white/80">환영합니다, <span className="font-semibold">{user?.name}님</span></p>
        </div>
      </div>

      <div className="wellness-container py-12">
        <div className="mb-8"></div>

        {/* 주요 지표 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 text-sm mb-2">총 주문</p>
            <p className="text-3xl font-bold text-[#2d5016]">{stats.totalOrders}</p>
            <p className="text-xs text-gray-500 mt-2">이번 달</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 text-sm mb-2">총 매출</p>
            <p className="text-3xl font-bold text-[#2d5016]">
              ₩{(stats.totalRevenue / 1000000).toFixed(1)}M
            </p>
            <p className="text-xs text-gray-500 mt-2">이번 달</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 text-sm mb-2">평균 주문액</p>
            <p className="text-3xl font-bold text-[#2d5016]">
              ₩{stats.avgOrderValue.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-2">1주문당</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-gray-600 text-sm mb-2">총 고객</p>
            <p className="text-3xl font-bold text-[#2d5016]">{stats.totalCustomers}</p>
            <p className="text-xs text-gray-500 mt-2">신규 고객</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 주문 상태 */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-[#2d5016] mb-4">주문 상태</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700">배송 대기</span>
                  <span className="font-bold text-[#2d5016]">{stats.pendingOrders}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{
                      width: `${(stats.pendingOrders / stats.totalOrders) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700">배송 완료</span>
                  <span className="font-bold text-[#2d5016]">{stats.shippedOrders}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${(stats.shippedOrders / stats.totalOrders) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* 인기 상품 */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-[#2d5016] mb-4">인기 상품</h2>
            <div className="space-y-3">
              {stats.topProducts.map((product, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-gray-700">{idx + 1}. {product.name}</span>
                  <span className="font-bold text-[#2d5016]">{product.sales}개</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 광고 성과 */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-[#2d5016] mb-6">광고 성과 분석</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(stats.adMetrics).map(([platform, metrics]) => (
              <div key={platform} className="border border-gray-200 p-4 rounded-lg">
                <h3 className="font-bold text-gray-800 mb-3 capitalize">{platform}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">클릭수</span>
                    <span className="font-semibold">{metrics.clicks.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">전환</span>
                    <span className="font-semibold text-green-600">{metrics.conversions}개</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-gray-600 font-semibold">ROI</span>
                    <span className="font-bold text-[#2d5016]">{metrics.roi}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 광고 예산 분석 */}
          <div className="mt-8">
            <h3 className="font-bold text-gray-800 mb-4">추천 광고 할당</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700">Google (ROI 385%)</span>
                  <span className="font-bold">35%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-blue-500 h-3 rounded-full" style={{ width: '35%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700">Facebook (ROI 312%)</span>
                  <span className="font-bold">30%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-blue-600 h-3 rounded-full" style={{ width: '30%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700">Naver (ROI 268%)</span>
                  <span className="font-bold">25%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-green-600 h-3 rounded-full" style={{ width: '25%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-700">Kakao (ROI 245%)</span>
                  <span className="font-bold">10%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-yellow-500 h-3 rounded-full" style={{ width: '10%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 관리 페이지 빠른 접근 */}
        <div className="mt-12 bg-gradient-to-r from-[#f5f3f0] to-[#e8e4df] rounded-lg p-8 border border-[#d9c5b0]">
          <h2 className="text-2xl font-bold text-[#2d5016] mb-6">📱 콘텐츠 관리</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/products"
              className="bg-white p-6 rounded-lg border-2 border-[#c8a24a] hover:shadow-lg transition-all duration-300 group"
            >
              <div className="text-3xl mb-3">🛍️</div>
              <h3 className="font-bold text-[#2d5016] mb-2 group-hover:text-[#c8a24a]">상품 관리</h3>
              <p className="text-sm text-gray-600">상품 추가, 수정, 삭제</p>
            </Link>

            <Link
              href="/admin/content"
              className="bg-white p-6 rounded-lg border-2 border-[#c8a24a] hover:shadow-lg transition-all duration-300 group"
            >
              <div className="text-3xl mb-3">✍️</div>
              <h3 className="font-bold text-[#2d5016] mb-2 group-hover:text-[#c8a24a]">텍스트 관리</h3>
              <p className="text-sm text-gray-600">홈페이지 문구 수정</p>
            </Link>

            <Link
              href="/admin/images"
              className="bg-white p-6 rounded-lg border-2 border-[#c8a24a] hover:shadow-lg transition-all duration-300 group"
            >
              <div className="text-3xl mb-3">🖼️</div>
              <h3 className="font-bold text-[#2d5016] mb-2 group-hover:text-[#c8a24a]">이미지 관리</h3>
              <p className="text-sm text-gray-600">이미지 URL 변경</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

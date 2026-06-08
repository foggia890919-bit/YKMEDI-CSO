'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Order {
  id: string;
  userId: string;
  items: any[];
  totalAmount: number;
  status: string;
  customer: any;
  createdAt: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [isAuthenticated, router]);

  const fetchData = async () => {
    try {
      const [ordersRes, productsRes] = await Promise.all([
        fetch('/api/orders?all=true'),
        fetch('/api/products'),
      ]);

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      }
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(Array.isArray(productsData) ? productsData : []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
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

  // 실제 데이터로 통계 계산
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const uniqueCustomers = new Set(orders.map((o) => o.userId).filter(Boolean)).size;
  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const shippedOrders = orders.filter(
    (o) => o.status === 'shipped' || o.status === 'delivered'
  ).length;

  // 인기 상품 계산 (실제 주문 기반)
  const productSales: Record<string, number> = {};
  orders.forEach((order) => {
    (order.items || []).forEach((item: any) => {
      const name = item.name || '알 수 없음';
      productSales[name] = (productSales[name] || 0) + (item.quantity || 1);
    });
  });
  const topProducts = Object.entries(productSales)
    .map(([name, sales]) => ({ name, sales }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  // 최근 주문
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '배송 대기',
      confirmed: '주문 확인',
      shipped: '배송 중',
      delivered: '배송 완료',
      cancelled: '취소됨',
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#faf8f6]">
      {/* 관리자 헤더 */}
      <div className="bg-gradient-to-r from-[#2d5016] to-[#3d6b1f] text-white py-8 mb-12">
        <div className="wellness-container">
          <h1 className="font-serif-display text-4xl mb-2">🔐 관리자 대시보드</h1>
          <p className="text-white/80">
            환영합니다, <span className="font-semibold">{user?.name}님</span>
          </p>
        </div>
      </div>

      <div className="wellness-container py-4 pb-16">
        {/* 콘텐츠 관리 빠른 접근 (최상단 배치) */}
        <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/admin/products"
            className="bg-white p-8 rounded-2xl border-2 border-[#c8a24a] hover:shadow-xl transition-all duration-300 group"
          >
            <div className="text-4xl mb-4">🛍️</div>
            <h3 className="font-serif-display text-2xl text-[#2d5016] mb-2 group-hover:text-[#c8a24a]">
              상품 관리
            </h3>
            <p className="text-gray-600">상품 추가, 가격 설정, 상세페이지 작성</p>
          </Link>

          <Link
            href="/admin/site"
            className="bg-white p-8 rounded-2xl border-2 border-[#c8a24a] hover:shadow-xl transition-all duration-300 group"
          >
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="font-serif-display text-2xl text-[#2d5016] mb-2 group-hover:text-[#c8a24a]">
              홈페이지 편집
            </h3>
            <p className="text-gray-600">메인페이지 텍스트 & 이미지를 직접 보며 수정</p>
          </Link>
        </div>

        {/* 주요 지표 (실제 데이터) */}
        <h2 className="font-serif-display text-2xl text-[#2d5016] mb-4">📊 실시간 통계</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e8d9cc]">
            <p className="text-gray-600 text-sm mb-2">총 주문</p>
            <p className="text-3xl font-bold text-[#2d5016]">{totalOrders}</p>
            <p className="text-xs text-gray-500 mt-2">전체 기간</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e8d9cc]">
            <p className="text-gray-600 text-sm mb-2">총 매출</p>
            <p className="text-3xl font-bold text-[#2d5016]">
              ₩{totalRevenue.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-2">전체 기간</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e8d9cc]">
            <p className="text-gray-600 text-sm mb-2">평균 주문액</p>
            <p className="text-3xl font-bold text-[#2d5016]">
              ₩{avgOrderValue.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-2">1주문당</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e8d9cc]">
            <p className="text-gray-600 text-sm mb-2">구매 고객</p>
            <p className="text-3xl font-bold text-[#2d5016]">{uniqueCustomers}</p>
            <p className="text-xs text-gray-500 mt-2">고유 고객</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* 주문 상태 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e8d9cc]">
            <h2 className="font-serif-display text-xl text-[#2d5016] mb-4">주문 상태</h2>
            {totalOrders > 0 ? (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">배송 대기</span>
                    <span className="font-bold text-[#2d5016]">{pendingOrders}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{ width: `${(pendingOrders / totalOrders) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">배송 중/완료</span>
                    <span className="font-bold text-[#2d5016]">{shippedOrders}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${(shippedOrders / totalOrders) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 py-8 text-center">아직 주문이 없습니다.</p>
            )}
          </div>

          {/* 인기 상품 (실제 판매 기반) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e8d9cc]">
            <h2 className="font-serif-display text-xl text-[#2d5016] mb-4">인기 상품</h2>
            {topProducts.length > 0 ? (
              <div className="space-y-3">
                {topProducts.map((product, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-gray-700">
                      {idx + 1}. {product.name}
                    </span>
                    <span className="font-bold text-[#2d5016]">{product.sales}개</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 py-8 text-center">
                아직 판매 데이터가 없습니다.
              </p>
            )}
          </div>
        </div>

        {/* 최근 주문 */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e8d9cc]">
          <h2 className="font-serif-display text-xl text-[#2d5016] mb-4">최근 주문</h2>
          {recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#e8d9cc] text-left text-gray-600">
                    <th className="py-3 pr-4">주문번호</th>
                    <th className="py-3 pr-4">고객</th>
                    <th className="py-3 pr-4">금액</th>
                    <th className="py-3 pr-4">상태</th>
                    <th className="py-3">날짜</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100">
                      <td className="py-3 pr-4 font-mono text-xs">{order.id}</td>
                      <td className="py-3 pr-4">{order.customer?.name || '-'}</td>
                      <td className="py-3 pr-4 font-semibold text-[#2d5016]">
                        ₩{(order.totalAmount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 pr-4">{getStatusLabel(order.status)}</td>
                      <td className="py-3 text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 py-8 text-center">아직 주문이 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export default function OrdersPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    fetchOrders();
  }, [isAuthenticated, router]);

  const fetchOrders = async () => {
    try {
      // 실제로는 API에서 사용자의 주문을 가져옴
      const mockOrders: Order[] = [
        {
          id: 'order_1719532800000',
          userId: user?.id || '',
          items: [
            { id: 1, name: 'Premium Extra Virgin', price: 45000, quantity: 2 },
          ],
          totalAmount: 93000,
          status: 'delivered',
          createdAt: new Date('2024-06-28'),
          updatedAt: new Date('2024-07-01'),
        },
        {
          id: 'order_1719619200000',
          userId: user?.id || '',
          items: [
            { id: 3, name: 'Heritage Estate', price: 52000, quantity: 1 },
            { id: 4, name: 'Morning Blend', price: 32000, quantity: 1 },
          ],
          totalAmount: 87000,
          status: 'shipped',
          createdAt: new Date('2024-06-29'),
          updatedAt: new Date('2024-07-02'),
        },
        {
          id: 'order_1719705600000',
          userId: user?.id || '',
          items: [
            { id: 2, name: 'Golden Selection', price: 38000, quantity: 3 },
          ],
          totalAmount: 114000,
          status: 'pending',
          createdAt: new Date('2024-06-30'),
          updatedAt: new Date('2024-06-30'),
        },
      ];

      setOrders(mockOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

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

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter((order) => order.status === filterStatus);

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

  return (
    <div className="py-12">
      <div className="wellness-container max-w-4xl">
        <h1 className="text-4xl font-bold text-[#2d5016] mb-8">주문 내역</h1>

        {/* 필터 */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {['all', 'pending', 'confirmed', 'shipped', 'delivered'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded whitespace-nowrap ${
                filterStatus === status
                  ? 'bg-[#2d5016] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status === 'all' ? '전체' : getStatusLabel(status)}
            </button>
          ))}
        </div>

        {/* 주문 목록 */}
        {filteredOrders.length > 0 ? (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-gray-600">주문번호</p>
                    <p className="font-bold text-gray-800">{order.id}</p>
                  </div>
                  <span className={`px-3 py-1 rounded text-sm font-semibold ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                <div className="border-t border-b py-4 mb-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm py-2">
                      <span className="text-gray-700">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="font-semibold">
                        ₩{(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">총액</p>
                    <p className="text-2xl font-bold text-[#2d5016]">
                      ₩{order.totalAmount.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 mb-3">
                      {new Date(order.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                    <button className="bg-[#2d5016] text-white px-4 py-2 rounded hover:bg-[#1f3810]">
                      상세보기
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">주문 내역이 없습니다.</p>
            <Link href="/shop" className="vita-button inline-block">
              쇼핑하러 가기
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

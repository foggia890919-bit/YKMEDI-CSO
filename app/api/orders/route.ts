import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '.data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

interface Order {
  id: string;
  userId: string;
  impUid?: string;
  paymentKey?: string;
  paymentMethod: 'toss' | 'naver' | 'kakao' | 'samsung';
  settlementStatus: 'pending' | 'settled' | 'failed';
  items: any[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  customer: any;
  createdAt: string;
  updatedAt: string;
}

const loadOrders = (): Order[] => {
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8'));
    }
  } catch (error) {
    console.error('Failed to load orders:', error);
  }
  return [];
};

export async function GET(request: NextRequest) {
  const orders = loadOrders();
  const orderId = request.nextUrl.searchParams.get('orderId');
  const userId = request.nextUrl.searchParams.get('userId');
  const all = request.nextUrl.searchParams.get('all');

  // 특정 주문 조회
  if (orderId) {
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      return NextResponse.json(order);
    }
    return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
  }

  // 관리자: 전체 주문 조회
  if (all === 'true') {
    return NextResponse.json(orders);
  }

  // 사용자별 주문 조회
  if (userId) {
    const userOrders = orders.filter((o) => o.userId === userId);
    return NextResponse.json(userOrders);
  }

  return NextResponse.json([]);
}

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
  items: any[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  customer: any;
  createdAt: string;
  updatedAt: string;
}

const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

const loadOrders = (): Order[] => {
  try {
    ensureDataDir();
    if (fs.existsSync(ORDERS_FILE)) {
      return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8'));
    }
  } catch (error) {
    console.error('Failed to load orders:', error);
  }
  return [];
};

const saveOrders = (orders: Order[]) => {
  ensureDataDir();
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
};

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const orders = loadOrders();

    const order: Order = {
      id: data.merchantUid || `order_${Date.now()}`,
      userId: data.userId || '',
      impUid: data.impUid,
      paymentKey: data.paymentKey,
      items: data.items || [],
      totalAmount: data.amount || 0,
      status: data.paymentKey ? 'confirmed' : 'pending',
      customer: data.customer || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    orders.push(order);
    saveOrders(orders);

    return NextResponse.json(
      {
        success: true,
        orderId: order.id,
        message: '주문이 저장되었습니다.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Order error:', error);
    return NextResponse.json(
      { error: '주문 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

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

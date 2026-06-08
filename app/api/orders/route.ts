import { NextRequest, NextResponse } from 'next/server';

// 주문 데이터를 메모리에 저장 (실제로는 데이터베이스에 저장)
const orders: any[] = [];

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const order = {
      id: data.merchantUid,
      impUid: data.impUid,
      amount: data.amount,
      items: data.items,
      customer: data.customer,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    orders.push(order);

    // 실제로는 여기서 아임포트 API로 결제를 검증해야 함
    // const verifyUrl = `https://api.iamport.kr/payments/${data.impUid}`;
    // const headers = { Authorization: process.env.IAMPORT_SECRET };
    // const verification = await fetch(verifyUrl, { headers });

    // 환영 이메일 전송 (실제로는 이메일 서비스 사용)
    console.log('Order created:', order);

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
  const orderId = request.nextUrl.searchParams.get('orderId');

  if (orderId) {
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      return NextResponse.json(order);
    }
    return NextResponse.json({ error: '주문을 찾을 수 없습니다.' }, { status: 404 });
  }

  return NextResponse.json(orders);
}

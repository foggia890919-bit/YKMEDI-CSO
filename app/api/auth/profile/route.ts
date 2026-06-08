import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, name, phone, address } = data;

    if (!id) {
      return NextResponse.json({ error: '사용자 ID가 필요합니다.' }, { status: 400 });
    }

    const updated = db.users.update(id, { name, phone, address });
    if (!updated) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    const { password: _, ...userWithoutPassword } = updated;
    return NextResponse.json({ success: true, user: userWithoutPassword });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: '프로필 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

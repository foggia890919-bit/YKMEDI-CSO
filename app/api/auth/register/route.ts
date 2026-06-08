import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, User } from '@/lib/db';
import { randomUUID } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { email, password, passwordConfirm, name, phone } = data;

    // 검증
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: '필수 항목을 입력하세요.' },
        { status: 400 }
      );
    }

    if (password !== passwordConfirm) {
      return NextResponse.json(
        { error: '비밀번호가 일치하지 않습니다.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: '비밀번호는 최소 6자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    // 이미 존재하는 이메일 확인
    if (db.users.findByEmail(email)) {
      return NextResponse.json(
        { error: '이미 가입된 이메일입니다.' },
        { status: 400 }
      );
    }

    // 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 사용자 생성
    const user: User = {
      id: randomUUID(),
      email,
      password: hashedPassword,
      name,
      phone: phone || '',
      address: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    db.users.create(user);

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // 응답에서 비밀번호 제거
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      {
        success: true,
        message: '회원가입이 완료되었습니다.',
        user: userWithoutPassword,
        token,
      },
      {
        status: 201,
        headers: {
          'Set-Cookie': `auth-token=${token}; HttpOnly; Path=/; Max-Age=2592000`,
        },
      }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: '회원가입 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

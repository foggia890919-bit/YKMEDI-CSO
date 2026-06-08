import { NextRequest, NextResponse } from 'next/server';
import { db, Review } from '@/lib/db';
import { randomUUID } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const productId = request.nextUrl.searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: '상품 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const reviews = db.reviews.findByProductId(parseInt(productId));
    const avgRating =
      reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : 0;

    return NextResponse.json({
      reviews,
      avgRating: parseFloat(avgRating as string),
      totalCount: reviews.length,
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    return NextResponse.json(
      { error: '리뷰 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { productId, userId, userName, rating, comment } = data;

    if (!productId || !userId || !rating || !comment) {
      return NextResponse.json(
        { error: '필수 항목을 입력하세요.' },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: '평점은 1~5 사이의 값이어야 합니다.' },
        { status: 400 }
      );
    }

    const review: Review = {
      id: randomUUID(),
      productId,
      userId,
      userName: userName || '익명',
      rating,
      comment,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    db.reviews.create(review);

    return NextResponse.json(
      {
        success: true,
        message: '리뷰가 등록되었습니다.',
        review,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create review error:', error);
    return NextResponse.json(
      { error: '리뷰 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

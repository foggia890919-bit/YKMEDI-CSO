'use client';

import { useState, useEffect } from 'react';
import { useCallback } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/lib/store';
import { useAuthStore } from '@/lib/auth-store';

interface Review {
  id: string;
  productId: number;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function ProductPage({ params }: { params: { id: string } }) {
  const productId = parseInt(params.id);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const products = await res.json();
          const found = products.find((p: any) => p.id === productId);
          setProduct(found);
        }
      } catch (error) {
        console.error('Failed to load product:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/reviews?productId=${productId}`);
      const data = await response.json();
      setReviews(data.reviews || []);
      setAvgRating(data.avgRating || 0);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('리뷰를 작성하려면 로그인이 필요합니다.');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          userId: user?.id,
          userName: user?.name,
          rating: reviewForm.rating,
          comment: reviewForm.comment,
        }),
      });

      if (response.ok) {
        setReviewForm({ rating: 5, comment: '' });
        await fetchReviews();
        alert('리뷰가 등록되었습니다.');
      }
    } catch (error) {
      alert('리뷰 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
      });
    }
    alert(`${product.name} ${quantity}개가 장바구니에 추가되었습니다.`);
  };

  if (loading) {
    return (
      <div className="wellness-container py-20">
        <p className="text-center text-xl">로드 중...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="wellness-container py-20">
        <p className="text-center text-xl">상품을 찾을 수 없습니다.</p>
        <div className="text-center mt-4">
          <Link href="/shop" className="vita-button inline-block">
            상품 목록으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12">
      <div className="wellness-container">
        <Link href="/shop" className="text-[#2d5016] hover:underline mb-6 inline-block">
          ← 상품 목록으로
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="bg-gradient-to-br from-[#f5f3f0] to-[#e8e4df] h-96 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="text-8xl mb-4">🫒</div>
              <p className="text-gray-700">{product.volume}</p>
            </div>
          </div>

          <div>
            <h1 className="text-4xl font-bold text-[#2d5016] mb-2">{product.name}</h1>

            {/* 평점 표시 */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={i < Math.round(avgRating) ? '⭐' : '☆'}>
                  </span>
                ))}
              </div>
              <span className="text-sm text-gray-600">
                {avgRating.toFixed(1)} ({reviews.length}개 리뷰)
              </span>
            </div>

            <p className="text-gray-600 text-lg mb-6">{product.origin}</p>

            <div className="mb-6">
              <span className="text-4xl font-bold text-[#2d5016]">
                ₩{product.price.toLocaleString()}
              </span>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <p className="text-sm text-gray-600">원산지</p>
                <p className="text-lg font-semibold text-gray-800">{product.origin}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">수확 시기</p>
                <p className="text-lg font-semibold text-gray-800">{product.harvestDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">용량</p>
                <p className="text-lg font-semibold text-gray-800">{product.volume}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">추천 용도</p>
                <p className="text-lg font-semibold text-gray-800">{product.bestFor}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 mb-8">
              <label className="text-lg font-semibold">수량:</label>
              <div className="flex items-center border border-gray-300 rounded">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 hover:bg-gray-100"
                >
                  −
                </button>
                <span className="px-4 py-2 min-w-16 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-2 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              className="vita-button w-full mb-4"
            >
              장바구니에 추가
            </button>

            <Link href="/checkout" className="block text-center bg-[#d4a574] text-white px-6 py-3 rounded-lg hover:bg-[#c09560] transition">
              바로 구매
            </Link>
          </div>
        </div>

        <div className="mt-16 bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-[#2d5016] mb-4">상품 설명</h2>
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">
            {product.details}
          </p>

          <div className="mt-6">
            <h3 className="text-lg font-bold text-[#2d5016] mb-3">특징</h3>
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag: string) => (
                <span key={tag} className="bg-[#f5f3f0] text-[#2d5016] px-4 py-2 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 리뷰 섹션 */}
        <div className="mt-16 bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-[#2d5016] mb-6">고객 리뷰</h2>

          {/* 리뷰 작성 폼 */}
          {isAuthenticated ? (
            <form onSubmit={handleSubmitReview} className="mb-8 p-6 bg-[#f5f3f0] rounded-lg">
              <h3 className="text-lg font-bold text-[#2d5016] mb-4">리뷰 작성</h3>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  평점
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className={`text-3xl ${
                        star <= reviewForm.rating ? '⭐' : '☆'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  리뷰
                </label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) =>
                    setReviewForm({ ...reviewForm, comment: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:border-[#2d5016]"
                  placeholder="이 상품에 대한 의견을 남겨주세요."
                  rows={4}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingReview}
                className="vita-button disabled:opacity-50"
              >
                {isSubmittingReview ? '등록 중...' : '리뷰 등록'}
              </button>
            </form>
          ) : (
            <div className="mb-8 p-6 bg-gray-100 rounded-lg text-center">
              <p className="text-gray-700 mb-3">리뷰를 작성하려면 로그인이 필요합니다.</p>
              <Link href="/login" className="vita-button inline-block">
                로그인하기
              </Link>
            </div>
          )}

          {/* 리뷰 목록 */}
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border-b pb-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-gray-800">{review.userName}</p>
                      <div className="flex gap-1 text-sm">
                        {[...Array(5)].map((_, i) => (
                          <span key={i}>
                            {i < review.rating ? '⭐' : '☆'}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 py-8">
              아직 리뷰가 없습니다. 첫 번째 리뷰를 남겨보세요!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

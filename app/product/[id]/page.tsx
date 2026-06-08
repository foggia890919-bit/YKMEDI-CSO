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
    <div className="min-h-screen bg-gradient-to-b from-white to-[#faf8f6]">
      <div className="wellness-container py-12">
        <Link href="/shop" className="text-[#d4a574] hover:text-[#c8a24a] font-medium mb-8 inline-block transition">
          ← 상품 목록으로
        </Link>

        {/* 상품 헤더 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-20">
          {/* 상품 이미지 */}
          <div className="flex items-center justify-center">
            <div className="bg-gradient-to-br from-[#fff5f1] via-[#ffe8e0] to-[#fce4d6] aspect-square rounded-3xl shadow-2xl flex items-center justify-center overflow-hidden">
              <div className="text-center">
                <div className="text-9xl mb-6 drop-shadow-lg">🫒</div>
                <p className="text-lg text-[#8b7355] font-light tracking-wide">{product.volume || '500ml'}</p>
              </div>
            </div>
          </div>

          {/* 상품 정보 */}
          <div className="flex flex-col justify-center">
            <div className="mb-8">
              <p className="text-sm uppercase tracking-widest text-[#d4a574] font-semibold mb-3">Premium Olive Oil</p>
              <h1 className="font-serif-display text-5xl text-[#2d5016] mb-4 leading-tight">{product.name}</h1>
              <p className="text-xl text-[#8b7355] font-light mb-2">{product.origin}</p>
            </div>

            {/* 평점 & 리뷰 */}
            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-[#e8d9cc]">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-lg">
                    {i < Math.round(avgRating) ? '⭐' : '☆'}
                  </span>
                ))}
              </div>
              <span className="text-sm text-[#8b7355]">
                <span className="font-semibold text-[#2d5016]">{avgRating.toFixed(1)}</span> / 5.0 ({reviews.length}개 리뷰)
              </span>
            </div>

            {/* 가격 */}
            <div className="mb-10">
              <p className="text-xs uppercase tracking-widest text-[#a89080] mb-2">가격</p>
              <p className="font-serif-display text-5xl text-[#2d5016] font-bold">
                ₩<span className="text-[#d4a574]">{product.price.toLocaleString()}</span>
              </p>
            </div>

            {/* 특징 태그 */}
            {product.tags && product.tags.length > 0 && (
              <div className="mb-10">
                <p className="text-xs uppercase tracking-widest text-[#a89080] mb-3">특징</p>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag: string) => (
                    <span key={tag} className="bg-gradient-to-r from-[#fff5f1] to-[#ffe8e0] text-[#c8a24a] px-4 py-2 rounded-full text-sm font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 수량 선택 */}
            <div className="flex items-center gap-6 mb-8">
              <span className="text-sm uppercase tracking-widest text-[#a89080] font-semibold">수량</span>
              <div className="flex items-center border-2 border-[#e8d9cc] rounded-full p-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-full hover:bg-[#ffe8e0] flex items-center justify-center text-[#2d5016] font-bold transition"
                >
                  −
                </button>
                <span className="w-12 text-center font-semibold text-[#2d5016]">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-full hover:bg-[#ffe8e0] flex items-center justify-center text-[#2d5016] font-bold transition"
                >
                  +
                </button>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="space-y-3">
              <button
                onClick={handleAddToCart}
                className="w-full bg-gradient-to-r from-[#2d5016] to-[#3d6b1f] text-white py-4 rounded-full font-semibold hover:shadow-lg transition-all duration-300 text-lg"
              >
                🛍️ 장바구니에 추가
              </button>
              <Link href="/checkout" className="block w-full text-center bg-gradient-to-r from-[#d4a574] to-[#c8a24a] text-white py-4 rounded-full font-semibold hover:shadow-lg transition-all duration-300">
                ⚡ 바로 구매
              </Link>
            </div>
          </div>
        </div>

        {/* 상세 정보 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
            <div className="text-4xl mb-4">🌍</div>
            <h3 className="font-serif-display text-xl text-[#2d5016] mb-3">원산지</h3>
            <p className="text-[#8b7355] leading-relaxed">{product.origin}</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
            <div className="text-4xl mb-4">📦</div>
            <h3 className="font-serif-display text-xl text-[#2d5016] mb-3">용량</h3>
            <p className="text-[#8b7355] leading-relaxed">{product.volume || '500ml'}</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="font-serif-display text-xl text-[#2d5016] mb-3">추천용도</h3>
            <p className="text-[#8b7355] leading-relaxed">{product.bestFor || '모든 식탁에 어울리는 올리브오일'}</p>
          </div>
        </div>

        {/* 상품 상세 설명 섹션 */}
        <div className="mt-24 bg-gradient-to-br from-white to-[#faf8f6] rounded-3xl p-12 shadow-lg border border-[#e8d9cc]">
          <div className="max-w-3xl">
            <h2 className="font-serif-display text-4xl text-[#2d5016] mb-8">상품 스토리</h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-lg leading-relaxed text-[#8b7355] whitespace-pre-line font-light">
                {product.details}
              </p>
            </div>

            {/* 특징 섹션 */}
            {product.tags && product.tags.length > 0 && (
              <div className="mt-12 pt-12 border-t border-[#e8d9cc]">
                <h3 className="font-serif-display text-2xl text-[#2d5016] mb-6">감각적인 특징</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {product.tags.map((tag: string) => (
                    <div key={tag} className="bg-gradient-to-br from-[#fff5f1] to-[#ffe8e0] p-6 rounded-2xl text-center hover:shadow-md transition-all duration-300">
                      <p className="text-lg font-semibold text-[#c8a24a]">{tag}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 리뷰 섹션 */}
        <div className="mt-24 bg-white rounded-3xl p-12 shadow-lg border border-[#e8d9cc]">
          <h2 className="font-serif-display text-4xl text-[#2d5016] mb-10">✨ 고객 리뷰</h2>

          {/* 리뷰 작성 폼 */}
          {isAuthenticated ? (
            <form onSubmit={handleSubmitReview} className="mb-12 p-8 bg-gradient-to-br from-[#fff5f1] to-[#ffe8e0] rounded-2xl">
              <h3 className="font-serif-display text-2xl text-[#2d5016] mb-6">당신의 경험을 나눠주세요</h3>

              <div className="mb-6">
                <label className="block text-sm uppercase tracking-widest font-semibold text-[#8b7355] mb-3">
                  평점
                </label>
                <div className="flex gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className={`text-4xl transition-transform duration-200 ${
                        star <= reviewForm.rating ? '⭐ scale-110' : '☆'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm uppercase tracking-widest font-semibold text-[#8b7355] mb-3">
                  리뷰 내용
                </label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) =>
                    setReviewForm({ ...reviewForm, comment: e.target.value })
                  }
                  className="w-full border-2 border-[#e8d9cc] rounded-xl px-4 py-3 focus:outline-none focus:border-[#c8a24a] bg-white text-[#8b7355] placeholder-[#a89080]"
                  placeholder="이 제품에 대한 솔직한 의견을 나눠주세요. 😊"
                  rows={5}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingReview}
                className="w-full bg-gradient-to-r from-[#2d5016] to-[#3d6b1f] text-white py-3 rounded-full font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50"
              >
                {isSubmittingReview ? '등록 중...' : '✨ 리뷰 등록'}
              </button>
            </form>
          ) : (
            <div className="mb-12 p-8 bg-gradient-to-r from-[#fff5f1] to-[#ffe8e0] rounded-2xl text-center border-2 border-[#e8d9cc]">
              <p className="text-lg text-[#8b7355] mb-4 font-light">리뷰를 작성하려면 로그인이 필요합니다.</p>
              <Link href="/login" className="inline-block bg-gradient-to-r from-[#d4a574] to-[#c8a24a] text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all duration-300">
                로그인하기
              </Link>
            </div>
          )}

          {/* 리뷰 목록 */}
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="bg-gradient-to-r from-[#ffffff] to-[#faf8f6] p-6 rounded-xl border border-[#e8d9cc] hover:shadow-md transition-all duration-300">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-[#2d5016]">{review.userName}</p>
                      <div className="flex gap-0.5 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className="text-lg">
                            {i < review.rating ? '⭐' : '☆'}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-[#a89080] font-light">
                      {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <p className="text-[#8b7355] leading-relaxed">{review.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-xl text-[#a89080] font-light mb-4">
                아직 리뷰가 없습니다. 첫 번째 리뷰를 남겨보세요! 💌
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

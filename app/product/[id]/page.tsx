'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCartStore } from '@/lib/store';
import { useAuthStore } from '@/lib/auth-store';
import { VARIETIES, Variety } from '@/lib/varieties';
import { CircularGauge, BarGauge } from '@/components/SpecGauge';

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

// 제품명으로 품종 데이터 매칭
function findVariety(productName: string): Variety | undefined {
  return VARIETIES.find(
    (v) => productName.includes(v.name) || productName.toUpperCase().includes(v.nameEn)
  );
}

// 셀링 포인트 데이터
const SELLING_POINTS = [
  {
    icon: '❄️',
    title: '원심분리 원스톱 냉추출 (NCS)',
    desc: '수확 후 2시간 이내, 27℃ 이하 비가열 원심분리로 추출하여 영양 손실 없이 극대화된 상쾌함을 담았습니다.',
  },
  {
    icon: '🛡️',
    title: '갈색 차광 글래스 & 산소 차단 마개',
    desc: '신선함을 상온에서도 오래 유지시켜주는 산패 안전 패키징으로 마지막 한 방울까지 신선하게.',
  },
  {
    icon: '🥄',
    title: '가벼운 일상 속 루틴',
    desc: '공복 생식 음용 또는 가벼운 드레싱으로. 매일 아침 세포를 깨우는 활력의 한 스푼을 경험하세요.',
  },
];

export default function ProductPage({ params }: { params: { id: string } }) {
  const productId = parseInt(params.id);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
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
      addItem({ id: product.id, name: product.name, price: product.price });
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
        <div className="mt-4 text-center">
          <Link href="/shop" className="vita-button inline-block">
            상품 목록으로
          </Link>
        </div>
      </div>
    );
  }

  const variety = findVariety(product.name);
  const theme = variety?.theme.primary || '#8DE317';
  const themeText = variety?.theme.text || '#0B1B10';
  const specs = variety?.specs;

  return (
    <div className="min-h-screen bg-soft-white">
      <div className="wellness-container py-12">
        <Link
          href="/shop"
          className="mb-8 inline-block font-medium text-gray-500 transition hover:text-midnight-forest"
        >
          ← 상품 목록으로
        </Link>

        {/* 상품 헤더 */}
        <div className="mb-20 grid grid-cols-1 gap-16 md:grid-cols-2">
          {/* 이미지 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative aspect-square overflow-hidden rounded-3xl shadow-2xl"
          >
            <img
              src={product.image}
              alt={product.name}
              className="h-full w-full object-cover"
            />
            <div
              className="absolute inset-0 mix-blend-overlay"
              style={{ backgroundColor: `${theme}25` }}
            />
          </motion.div>

          {/* 정보 */}
          <div className="flex flex-col justify-center">
            <p
              className="mb-3 text-sm font-bold uppercase tracking-widest"
              style={{ color: theme }}
            >
              {product.origin}
            </p>
            <h1 className="mb-4 text-5xl font-bold leading-tight text-midnight-forest">
              {product.name}
            </h1>
            {variety && (
              <p className="mb-6 text-lg font-semibold text-gray-500">
                {variety.tagline}
              </p>
            )}

            {/* 평점 */}
            <div className="mb-8 flex items-center gap-4 border-b border-gray-200 pb-8">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-lg">
                    {i < Math.round(avgRating) ? '⭐' : '☆'}
                  </span>
                ))}
              </div>
              <span className="text-sm text-gray-500">
                <span className="font-semibold text-midnight-forest">
                  {avgRating.toFixed(1)}
                </span>{' '}
                / 5.0 ({reviews.length}개 리뷰)
              </span>
            </div>

            {/* 가격 */}
            <div className="mb-8">
              <p className="mb-2 text-xs uppercase tracking-widest text-gray-400">
                가격
              </p>
              <p className="text-5xl font-bold text-midnight-forest">
                ₩{product.price.toLocaleString()}
              </p>
            </div>

            {/* 태그 */}
            {product.tags?.length > 0 && (
              <div className="mb-8 flex flex-wrap gap-2">
                {product.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="rounded-full px-4 py-2 text-sm font-medium"
                    style={{ backgroundColor: `${theme}15`, color: themeText }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* 수량 */}
            <div className="mb-8 flex items-center gap-6">
              <span className="text-sm font-semibold uppercase tracking-widest text-gray-400">
                수량
              </span>
              <div className="flex items-center rounded-full border-2 border-gray-200 p-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-full font-bold text-midnight-forest transition hover:bg-gray-100"
                >
                  −
                </button>
                <span className="w-12 text-center font-semibold text-midnight-forest">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full font-bold text-midnight-forest transition hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="space-y-3">
              <button
                onClick={handleAddToCart}
                className="w-full rounded-full py-4 text-lg font-bold text-white transition-all duration-300 hover:shadow-lg"
                style={{ backgroundColor: theme }}
              >
                🛍️ 장바구니에 추가
              </button>
              <Link
                href="/checkout"
                className="block w-full rounded-full border-2 py-4 text-center font-bold transition-all duration-300 hover:shadow-lg"
                style={{ borderColor: theme, color: themeText }}
              >
                ⚡ 바로 구매
              </Link>
            </div>
          </div>
        </div>

        {/* 헬스 대시보드 스펙 섹션 */}
        {specs && (
          <div className="mb-20">
            <div className="mb-8 text-center">
              <span
                className="inline-block rounded-full px-4 py-2 text-sm font-bold"
                style={{ backgroundColor: `${theme}20`, color: themeText }}
              >
                📊 액티브 스펙 대시보드
              </span>
              <h2 className="mt-4 text-3xl font-bold text-midnight-forest">
                한눈에 보는 헬스 스코어
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* 핵심 게이지 */}
              <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-sm lg:col-span-1">
                <div className="flex items-center justify-around">
                  <CircularGauge
                    value={specs.polyphenol}
                    max={700}
                    label="폴리페놀"
                    unit="mg/kg"
                    color={theme}
                  />
                  <CircularGauge
                    value={specs.acidity}
                    max={0.8}
                    label="산도"
                    unit="%"
                    color={theme}
                    displayValue={specs.acidity.toFixed(2)}
                  />
                </div>
                <p className="mt-4 text-center text-sm text-gray-400">
                  초정밀 냉압착 · 항산화 지수
                </p>
              </div>

              {/* 막대 게이지 */}
              <div className="space-y-6 rounded-3xl border border-gray-100 bg-white p-8 shadow-sm lg:col-span-2">
                <BarGauge value={specs.freshness} max={100} label="신선도" color={theme} />
                <BarGauge value={specs.intensity} max={100} label="풍미 강도" color={theme} />
                <BarGauge
                  value={specs.smokePoint}
                  max={280}
                  label="발연점"
                  color={theme}
                  unit="℃"
                />
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-600">
                    <span className="font-bold" style={{ color: themeText }}>
                      산도 {specs.acidity.toFixed(2)}%
                    </span>{' '}
                    — 초정밀 냉압착으로 증명된 최상급 신선도 수치입니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 셀링 포인트 카드 */}
        <div className="mb-20 grid grid-cols-1 gap-6 md:grid-cols-3">
          {SELLING_POINTS.map((point, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-all duration-300 hover:shadow-md"
            >
              <div className="mb-4 text-4xl">{point.icon}</div>
              <p
                className="mb-2 text-xs font-bold uppercase tracking-widest"
                style={{ color: theme }}
              >
                Point 0{idx + 1}
              </p>
              <h3 className="mb-3 text-xl font-bold text-midnight-forest">
                {point.title}
              </h3>
              <p className="leading-relaxed text-gray-600">{point.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* 상품 스토리 */}
        <div className="mb-20 rounded-3xl border border-gray-100 bg-white p-12 shadow-sm">
          <h2 className="mb-8 text-4xl font-bold text-midnight-forest">상품 스토리</h2>
          <p className="whitespace-pre-line text-lg font-light leading-relaxed text-gray-600">
            {product.details}
          </p>
        </div>

        {/* 리뷰 섹션 */}
        <div className="rounded-3xl border border-gray-100 bg-white p-12 shadow-sm">
          <h2 className="mb-10 text-4xl font-bold text-midnight-forest">✨ 고객 리뷰</h2>

          {isAuthenticated ? (
            <form
              onSubmit={handleSubmitReview}
              className="mb-12 rounded-2xl p-8"
              style={{ backgroundColor: `${theme}10` }}
            >
              <h3 className="mb-6 text-2xl font-bold text-midnight-forest">
                당신의 경험을 나눠주세요
              </h3>
              <div className="mb-6">
                <label className="mb-3 block text-sm font-semibold uppercase tracking-widest text-gray-500">
                  평점
                </label>
                <div className="flex gap-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                      className="text-4xl transition-transform duration-200 hover:scale-110"
                    >
                      {star <= reviewForm.rating ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-6">
                <label className="mb-3 block text-sm font-semibold uppercase tracking-widest text-gray-500">
                  리뷰 내용
                </label>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  className="w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-700 placeholder-gray-400 focus:border-active-lime focus:outline-none"
                  placeholder="이 제품에 대한 솔직한 의견을 나눠주세요. 😊"
                  rows={5}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmittingReview}
                className="w-full rounded-full py-3 font-bold text-white transition-all duration-300 hover:shadow-lg disabled:opacity-50"
                style={{ backgroundColor: theme }}
              >
                {isSubmittingReview ? '등록 중...' : '✨ 리뷰 등록'}
              </button>
            </form>
          ) : (
            <div
              className="mb-12 rounded-2xl p-8 text-center"
              style={{ backgroundColor: `${theme}10` }}
            >
              <p className="mb-4 text-lg font-light text-gray-600">
                리뷰를 작성하려면 로그인이 필요합니다.
              </p>
              <Link
                href="/login"
                className="inline-block rounded-full px-8 py-3 font-bold text-white transition-all duration-300 hover:shadow-lg"
                style={{ backgroundColor: theme }}
              >
                로그인하기
              </Link>
            </div>
          )}

          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-xl border border-gray-100 bg-gray-50 p-6 transition-all duration-300 hover:shadow-md"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-midnight-forest">
                        {review.userName}
                      </p>
                      <div className="mt-1 flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className="text-lg">
                            {i < review.rating ? '⭐' : '☆'}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className="text-xs font-light text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <p className="leading-relaxed text-gray-600">{review.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <p className="mb-4 text-xl font-light text-gray-400">
                아직 리뷰가 없습니다. 첫 번째 리뷰를 남겨보세요! 💌
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

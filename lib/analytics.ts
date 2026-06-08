// 광고 플랫폼별 추적 함수

// Facebook Pixel 추적
export const trackFacebookEvent = (eventName: string, data?: any) => {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', eventName, data || {});
  }
};

// Google Analytics 추적
export const trackGoogleEvent = (eventName: string, data?: any) => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, data || {});
  }
};

// Naver Analytics 추적
export const trackNaverEvent = (eventName: string, data?: any) => {
  if (typeof window !== 'undefined' && (window as any).wcs) {
    (window as any).wcs_do({
      e: eventName,
      ...data,
    });
  }
};

// Kakao 추적
export const trackKakaoEvent = (eventName: string, data?: any) => {
  if (typeof window !== 'undefined' && (window as any).Kakao) {
    (window as any).Kakao.Analytics.sendEvent(eventName, data || {});
  }
};

// 종합 추적 함수
export const trackEvent = (eventName: string, data?: any) => {
  // 모든 플랫폼에 이벤트 전송
  trackFacebookEvent(eventName, data);
  trackGoogleEvent(eventName, data);
  trackNaverEvent(eventName, data);
  trackKakaoEvent(eventName, data);
};

// 특정 이벤트들
export const trackAddToCart = (item: { id: number; name: string; price: number }) => {
  trackEvent('AddToCart', {
    currency: 'KRW',
    value: item.price,
    items: [{ item_id: item.id.toString(), item_name: item.name, price: item.price }],
  });
};

export const trackInitiateCheckout = (value: number, itemsCount: number) => {
  trackEvent('InitiateCheckout', {
    currency: 'KRW',
    value,
    num_items: itemsCount,
  });
};

export const trackPurchase = (orderId: string, value: number, items: any[]) => {
  trackEvent('Purchase', {
    currency: 'KRW',
    transaction_id: orderId,
    value,
    items: items.map((item) => ({
      item_id: item.id.toString(),
      item_name: item.name,
      price: item.price,
      quantity: item.quantity,
    })),
  });
};

export const trackPageView = (pageName: string) => {
  trackEvent('PageView', { page_title: pageName });
};

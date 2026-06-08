// 비타앤오리진 품종별 데이터 - Active Wellness 컨셉
// 헬스 대시보드 스타일 스펙 포함

export interface VarietySpec {
  acidity: number;        // 산도 (%) - 낮을수록 좋음
  polyphenol: number;     // 폴리페놀 (mg/kg) - 항산화 지수
  freshness: number;      // 신선도 (0-100)
  intensity: number;      // 풍미 강도 (0-100)
  smokePoint: number;     // 발연점 (℃)
}

export interface Variety {
  id: string;
  name: string;
  nameEn: string;
  origin: string;
  tagline: string;
  description: string;
  // 테마 컬러
  theme: {
    primary: string;      // 메인 컬러
    light: string;        // 밝은 톤
    bg: string;           // 배경 그라데이션
    text: string;         // 텍스트 컬러
  };
  flavorNotes: string[];
  specs: VarietySpec;
  price: number;
  image: string;
}

export const VARIETIES: Variety[] = [
  {
    id: 'picual',
    name: '피쿠알',
    nameEn: 'PICUAL',
    origin: '스페인 안달루시아',
    tagline: '강렬하고 스파이시한 아침의 에너지',
    description:
      '스페인을 대표하는 피쿠알 품종. 짙은 초록빛과 강렬한 풀 향, 후추처럼 톡 쏘는 피니시가 특징입니다. 폴리페놀 함량이 매우 높아 강력한 항산화 에너지를 선사합니다.',
    theme: {
      primary: '#1B9E6B',
      light: '#34D399',
      bg: 'from-emerald-50 to-green-100',
      text: '#065F46',
    },
    flavorNotes: ['강렬한 맛', '후추향', '풀향', '견과류'],
    specs: {
      acidity: 0.11,
      polyphenol: 580,
      freshness: 95,
      intensity: 90,
      smokePoint: 207,
    },
    price: 48000,
    image: 'https://images.unsplash.com/photo-1474836212017-52cecde8f86e?w=600&q=80',
  },
  {
    id: 'arbequina',
    name: '아르베키나',
    nameEn: 'ARBEQUINA',
    origin: '스페인 카탈루냐',
    tagline: '사과와 아몬드향의 상큼하고 달콤한 밸런스',
    description:
      '카탈루냐의 아르베키나. 가볍고 섬세한 풍미와 잘 익은 사과, 아몬드의 달콤한 향이 어우러집니다. 부드러워 매일의 식탁에 가장 어울리는 선택입니다.',
    theme: {
      primary: '#E8B547',
      light: '#FCD34D',
      bg: 'from-amber-50 to-yellow-100',
      text: '#92400E',
    },
    flavorNotes: ['부드러움', '사과향', '아몬드향', '버터'],
    specs: {
      acidity: 0.13,
      polyphenol: 420,
      freshness: 90,
      intensity: 55,
      smokePoint: 200,
    },
    price: 42000,
    image: 'https://images.unsplash.com/photo-1418065460487-3e41de6ce85d?w=600&q=80',
  },
  {
    id: 'koroneiki',
    name: '코로네이키',
    nameEn: 'KORONEIKI',
    origin: '그리스 크레타',
    tagline: '크레타 섬에서 온 폴리페놀 항산화 쉴드',
    description:
      '그리스 크레타의 전설적인 코로네이키. 신선한 그린 사과 향과 미네랄한 뉘앙스, 최고 수준의 폴리페놀 함량으로 강력한 항산화 보호막을 제공합니다.',
    theme: {
      primary: '#8DE317',
      light: '#A3E635',
      bg: 'from-lime-50 to-green-100',
      text: '#3F6212',
    },
    flavorNotes: ['신선함', '사과향', '미네랄', '허브'],
    specs: {
      acidity: 0.1,
      polyphenol: 650,
      freshness: 98,
      intensity: 75,
      smokePoint: 210,
    },
    price: 50000,
    image: 'https://images.unsplash.com/photo-1585518419759-8ba96b8b92a2?w=600&q=80',
  },
  {
    id: 'blending',
    name: '블렌딩',
    nameEn: 'BLENDING',
    origin: '지중해 셀렉션',
    tagline: '매일 부담 없이 즐기는 데일리 루틴',
    description:
      '여러 품종을 정교하게 블렌딩한 데일리 오일. 피쿠알의 강렬함, 아르베키나의 부드러움, 코로네이키의 신선함을 균형있게 담아 모든 요리에 완벽합니다.',
    theme: {
      primary: '#5BA84F',
      light: '#86EFAC',
      bg: 'from-green-50 to-emerald-100',
      text: '#166534',
    },
    flavorNotes: ['균형잡힌맛', '다층맛', '다용도', '데일리'],
    specs: {
      acidity: 0.14,
      polyphenol: 480,
      freshness: 92,
      intensity: 65,
      smokePoint: 205,
    },
    price: 45000,
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&q=80',
  },
  {
    id: 'avocado',
    name: '하스 아보카도',
    nameEn: 'HASS AVOCADO',
    origin: '멕시코',
    tagline: '100% 프리미엄 하스 아보카도의 불포화지방산 에너지',
    description:
      '하스 아보카도 과육에서 추출한 프리미엄 오일. 높은 발연점으로 고온 조리에도 안전하며, 풍부한 불포화지방산과 비타민E로 건강한 식생활을 완성합니다.',
    theme: {
      primary: '#1E4D2B',
      light: '#4ADE80',
      bg: 'from-green-100 to-emerald-200',
      text: '#14532D',
    },
    flavorNotes: ['부드러움', '고소함', '건강함', '고발연점'],
    specs: {
      acidity: 0.15,
      polyphenol: 380,
      freshness: 88,
      intensity: 50,
      smokePoint: 271,
    },
    price: 55000,
    image: 'https://images.unsplash.com/photo-1601039641847-7857b994d704?w=600&q=80',
  },
];

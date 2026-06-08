import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), 'content-config.json');

const DEFAULT_CONTENT = {
  hero: {
    eyebrow: 'Premium Olive Oil',
    heading: '자연 그대로의\n생명력을 담다',
    description:
      '지중해의 햇살과 시간이 빚어낸 엑스트라 버진 올리브오일.\n매일의 식탁에 건강한 웰니스를 더합니다.',
    button1: '컬렉션 둘러보기',
    button2: '브랜드 스토리',
    stat1Title: '30+',
    stat1Desc: '년의 전문성',
    stat2Title: '100%',
    stat2Desc: '첫 수확 콜드프레스',
    stat3Title: '4.9★',
    stat3Desc: '고객 만족도',
  },
  products: {
    title: '엄선된 컬렉션',
    subtitle:
      '지중해 각지의 명품 산지에서 직접 선별한 네 가지 시그니처 오일',
  },
  brandStory: {
    eyebrow: 'Our Story',
    title: '한 그루의 나무에서\n시작된 정직함',
    description1:
      '비타앤오리진은 30년간 지중해 최고의 올리브 농장과 직접 파트너십을\n맺어왔습니다. 수확부터 병입까지, 자연의 생명력을 그대로 담기 위해\n타협하지 않습니다.',
    description2:
      '건강한 식습관과 웰니스 라이프스타일을 추구하는 분들을 위해,\n매 순간 최고의 올리브오일만을 선별합니다.',
  },
};

export async function GET() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return NextResponse.json(JSON.parse(data));
    }
    return NextResponse.json(DEFAULT_CONTENT);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read config' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

const ensureUploadDir = () => {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
};

const IMAGE_SIZES = {
  hero: { width: 800, height: 1000, aspectRatio: '4/5' },
  products: { width: 600, height: 750, aspectRatio: '4/5' },
  brandStory: { width: 750, height: 900, aspectRatio: '5/6' },
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const imageType = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
    }

    if (!imageType || !Object.keys(IMAGE_SIZES).includes(imageType)) {
      return NextResponse.json({ error: '올바른 이미지 타입이 아닙니다.' }, { status: 400 });
    }

    ensureUploadDir();

    const buffer = await file.arrayBuffer();
    const imageBuffer = Buffer.from(buffer);

    // 파일명 생성 (타임스탬프 + 랜덤)
    const fileName = `${imageType}_${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    const size = IMAGE_SIZES[imageType as keyof typeof IMAGE_SIZES];

    // 이미지 리사이징 및 최적화
    await sharp(imageBuffer)
      .resize(size.width, size.height, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: 80 })
      .toFile(filePath);

    // 상대 경로 반환
    const relativeUrl = `/uploads/${fileName}`;

    return NextResponse.json({
      success: true,
      url: relativeUrl,
      size: {
        width: size.width,
        height: size.height,
        aspectRatio: size.aspectRatio,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: '이미지 업로드 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

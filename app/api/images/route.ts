import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.join(process.cwd(), 'image-config.json');

export async function GET() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return NextResponse.json(JSON.parse(data));
    }
    return NextResponse.json({
      hero: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DKftYJhPYte6fzx7UlgD1iYDar/hf_20260608_184055_73c767ec-b72c-42a4-9f3b-12b302b51a96.jpeg',
      products: {
        1: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DKftYJhPYte6fzx7UlgD1iYDar/hf_20260608_184100_37751ea1-feb0-4142-a80d-ae22e1c27fb7.png',
        2: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DKftYJhPYte6fzx7UlgD1iYDar/hf_20260608_184101_6db206a9-fcd2-42e4-81b4-2169931065d2.png',
        3: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DKftYJhPYte6fzx7UlgD1iYDar/hf_20260608_184102_804eb490-04ce-4fb5-a7ca-ca561e72623c.png',
        4: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DKftYJhPYte6fzx7UlgD1iYDar/hf_20260608_184103_7ae3f5cb-0991-4f1b-ad5a-7b100eb45e65.png',
      },
      brandStory: 'https://d8j0ntlcm91z4.cloudfront.net/user_3DKftYJhPYte6fzx7UlgD1iYDar/hf_20260608_184111_a220615c-a3d1-45b3-9a9d-e521ff1a9eb5.png',
    });
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

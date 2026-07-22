// 스마트스토어 리뷰 자동 답글 봇
//
// 네이버 커머스API에는 리뷰 조회/답글 API가 없어서 (2024.8 네이버 공식 답변,
// https://github.com/commerce-api-naver/commerce-api/discussions/1909)
// 스마트스토어센터 화면을 브라우저 자동화(Playwright)로 조작합니다.
//
// 사용법:
//   node bot.js --login    # 최초 1회: 브라우저가 열리면 직접 로그인 (세션 저장됨)
//   node bot.js            # 드라이런: 답글을 생성해서 보여주기만 하고 등록은 안 함
//   node bot.js --post     # 실제로 답글 등록
//
// ⚠️ 네이버 이용약관상 자동화 접근은 계정 제재 사유가 될 수 있습니다.
//    본인 스토어에 한해, 낮은 빈도로, 자기 책임 하에 사용하세요.

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const { GoogleGenAI } = require('@google/genai');
const config = require('./config');

const LOGIN_ONLY = process.argv.includes('--login');
const POST = process.argv.includes('--post');
const MAX_REPLIES = Number(process.env.MAX_REPLIES_PER_RUN || 10);
const STORE_NAME = process.env.STORE_NAME || '저희 스토어';

const USER_DATA_DIR = path.join(__dirname, 'user-data');
const DEBUG_DIR = path.join(__dirname, 'debug');
const REPLIED_LOG = path.join(__dirname, 'replied-log.json');

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function randomDelay() {
  const { min, max } = config.delayBetweenReplies;
  return min + Math.floor(Math.random() * (max - min));
}

function loadRepliedLog() {
  try {
    return JSON.parse(fs.readFileSync(REPLIED_LOG, 'utf8'));
  } catch {
    return [];
  }
}

function saveRepliedLog(log) {
  fs.writeFileSync(REPLIED_LOG, JSON.stringify(log, null, 2));
}

// 리뷰를 식별하는 키 (같은 리뷰에 두 번 달지 않도록)
function reviewKey(review) {
  return `${review.productName}::${review.content.slice(0, 60)}`;
}

async function saveDebug(page, label) {
  fs.mkdirSync(DEBUG_DIR, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ path: path.join(DEBUG_DIR, `${label}-${ts}.png`), fullPage: true });
  fs.writeFileSync(path.join(DEBUG_DIR, `${label}-${ts}.html`), await page.content());
  console.log(`  → debug/ 폴더에 스크린샷과 HTML을 저장했습니다 (${label})`);
}

// ---------------------------------------------------------------
// Gemini로 답글 생성
// ---------------------------------------------------------------
async function generateReply(review) {
  const response = await genai.models.generateContent({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: `당신은 네이버 스마트스토어 "${STORE_NAME}"의 사장님입니다.
고객 리뷰에 다는 답글을 작성합니다. 답글 텍스트만 출력하세요 (따옴표, 설명, 머리말 없이).

작성 규칙:
${config.toneGuide}`,
    },
    contents: `다음 리뷰에 답글을 작성해주세요.

상품명: ${review.productName}
별점: ${review.rating}점
리뷰 내용:
${review.content}`,
  });

  const text = (response.text || '').trim();
  if (!text) throw new Error('답글 생성 결과가 비어 있습니다');
  return text;
}

// ---------------------------------------------------------------
// 브라우저 흐름
// ---------------------------------------------------------------
async function launchBrowser() {
  // persistent context: 한 번 로그인하면 user-data/에 세션이 남아 재로그인 불필요
  return chromium.launchPersistentContext(USER_DATA_DIR, {
    headless: false,
    viewport: { width: 1400, height: 900 },
    args: ['--disable-blink-features=AutomationControlled'],
  });
}

async function collectReviews(page) {
  const s = config.selectors;
  await page.goto(config.urls.reviewSearch, { waitUntil: 'networkidle' });
  await sleep(3000);

  const rows = page.locator(s.reviewRow);
  const count = await rows.count();
  if (count === 0) {
    console.log('리뷰 행을 찾지 못했습니다. 셀렉터(config.js)를 확인하세요.');
    await saveDebug(page, 'no-reviews');
    return [];
  }

  const reviews = [];
  for (let i = 0; i < count; i++) {
    const row = rows.nth(i);
    try {
      const productName = (await row.locator(s.productName).first().innerText()).trim();
      const ratingText = (await row.locator(s.rating).first().innerText()).trim();
      const content = (await row.locator(s.content).first().innerText()).trim();
      const rating = parseInt(ratingText.replace(/[^0-9]/g, ''), 10) || 5;
      if (content) reviews.push({ index: i, productName, rating, content });
    } catch {
      // 헤더 행이나 구조가 다른 행은 건너뜀
    }
  }
  return reviews;
}

async function postReply(page, review, replyText) {
  const s = config.selectors;
  const row = page.locator(s.reviewRow).nth(review.index);

  await row.locator(s.replyButton).first().click();
  await sleep(1500);

  const textarea = page.locator(s.replyTextarea).last();
  await textarea.waitFor({ timeout: 10000 });
  // 사람이 입력하듯 타이핑
  await textarea.pressSequentially(replyText, { delay: 30 });
  await sleep(800);

  await page.locator(s.replySubmit).last().click();
  await sleep(2000);
}

// ---------------------------------------------------------------
// 메인
// ---------------------------------------------------------------
async function main() {
  if (!process.env.GEMINI_API_KEY && !LOGIN_ONLY) {
    console.error('GEMINI_API_KEY가 설정되지 않았습니다. .env 파일을 확인하세요.');
    console.error('키 발급: https://aistudio.google.com/apikey (무료, 카드 등록 불필요)');
    process.exit(1);
  }

  const context = await launchBrowser();
  const page = context.pages()[0] || (await context.newPage());

  if (LOGIN_ONLY) {
    await page.goto(config.urls.center);
    console.log('브라우저에서 스마트스토어센터에 로그인하세요.');
    console.log('로그인이 끝나면 이 터미널에서 Ctrl+C로 종료하면 됩니다. (세션은 user-data/에 저장)');
    await new Promise(() => {}); // 사용자가 종료할 때까지 대기
  }

  console.log(`리뷰 수집 중... (모드: ${POST ? '실제 등록' : '드라이런'})`);
  const reviews = await collectReviews(page);
  console.log(`리뷰 ${reviews.length}건 발견`);

  const repliedLog = loadRepliedLog();
  const repliedKeys = new Set(repliedLog.map((r) => r.key));
  const targets = reviews.filter((r) => !repliedKeys.has(reviewKey(r))).slice(0, MAX_REPLIES);
  console.log(`이번에 처리할 리뷰: ${targets.length}건 (최대 ${MAX_REPLIES}건)`);

  for (const review of targets) {
    console.log(`\n[${review.productName}] ★${review.rating}`);
    console.log(`  리뷰: ${review.content.slice(0, 100)}${review.content.length > 100 ? '…' : ''}`);

    let reply;
    try {
      reply = await generateReply(review);
    } catch (err) {
      console.error(`  답글 생성 실패: ${err.message}`);
      continue;
    }
    console.log(`  답글: ${reply}`);

    if (POST) {
      try {
        await postReply(page, review, reply);
        console.log('  ✓ 등록 완료');
        repliedLog.push({ key: reviewKey(review), reply, at: new Date().toISOString() });
        saveRepliedLog(repliedLog);
        const wait = randomDelay();
        console.log(`  다음 답글까지 ${Math.round(wait / 1000)}초 대기...`);
        await sleep(wait);
      } catch (err) {
        console.error(`  등록 실패: ${err.message}`);
        await saveDebug(page, 'post-fail');
      }
    }
  }

  if (!POST) {
    console.log('\n드라이런 모드였습니다. 실제로 등록하려면: node bot.js --post');
  }
  await context.close();
}

main().catch((err) => {
  console.error('오류:', err);
  process.exit(1);
});

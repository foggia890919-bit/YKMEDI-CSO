/**
 * 네이버 키워드 수집 도구 (구글 시트 + 앱스스크립트)
 * --------------------------------------------------------------
 * 3가지 출처에서 키워드를 한 번에 수집한다.
 *   ① 연관   : 네이버 검색광고 API (keywordstool) — 월간 검색량/경쟁도
 *   ② 자동완성 : 네이버 자동완성 API (ac.search.naver.com)
 *   ③ 상위상품 : 네이버 쇼핑 검색 API (shop.json) — 상품명에서 키워드 추출 + 카테고리
 *
 * 결과 시트(연관키워드_수집) 컬럼(9개):
 *   A 시드 | B 키워드 | C PC | D 모바일 | E 합계 | F 경쟁도 | G 수집일 | H 출처 | I 카테고리
 *
 * 스크립트 속성(파일 > 프로젝트 설정 > 스크립트 속성)에 아래 5개 키 등록 필요:
 *   NAVER_AD_CUSTOMER_ID, NAVER_AD_API_KEY, NAVER_AD_SECRET_KEY,
 *   NAVER_CLIENT_ID, NAVER_CLIENT_SECRET
 */

// ============================ 설정 ============================
const CONFIG = {
  INPUT_SHEET:  '키워드',            // 시드 키워드를 A열에 입력하는 시트
  RESULT_SHEET: '연관키워드_수집',    // 결과가 쌓이는 시트
  QUEUE_SHEET:  '큐',                // 배치 처리용 내부 시트(자동 생성)

  BATCH_SECONDS: 270,                // 한 번 실행에서 쓸 최대 시간(초) ≈ 4.5분
  SHOP_DISPLAY: 100,                 // 쇼핑 API에서 가져올 상품 수(최대 100)

  // 상위상품 키워드 추출
  SHOP_MIN_TOKEN_LEN: 2,             // 토큰 최소 글자수
  SHOP_MIN_FREQ: 3,                  // 상품명에서 N회 이상 등장해야 키워드로 채택

  // 노이즈 필터(연관/자동완성에 적용)
  KW_MAX_LEN: 15,                    // 키워드 최대 글자수
  KW_MAX_SPECIAL: 2,                 // 허용 특수문자 최대 개수
  KW_MAX_DIGIT_RATIO: 0.5,           // 숫자 비중 최대

  SORT_BY_VOLUME: true,              // 결과를 합계 검색량 내림차순 정렬
};

// 출처 우선순위(중복 제거 시 먼저 나온 출처를 유지)
const SOURCE_PRIORITY = { '연관': 0, '상위상품': 1, '자동완성': 2 };

// 상위상품 토큰에서 제외할 단위/불용어(브랜드성·노이즈 토큰 컷)
const SHOP_STOPWORDS = new Set([
  '정품','무료배송','당일발송','사은품','세트','단품','신상','신상품','best','BEST',
  '특가','할인','이벤트','증정','한정','국내산','수입','정장','공용','남녀공용',
  'cm','mm','kg','g','ml','l','개','종','매','팩','box','set','pcs','color','컬러',
]);

// ============================ 메뉴 ============================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('키워드 수집')
    .addItem('▶ 선택 키워드 수집 시작', 'startJob')
    .addItem('■ 진행 중지(트리거 정리)', 'stopJob')
    .addSeparator()
    .addItem('결과 시트 정렬', 'resortResults')
    .addToUi();
}

// ============================ 작업 시작 ============================
/**
 * 입력 시트에서 선택한(또는 A열 전체) 시드를 큐에 넣고 배치 트리거를 건다.
 */
function startJob() {
  const ss = SpreadsheetApp.getActive();
  const input = ss.getSheetByName(CONFIG.INPUT_SHEET) || ss.getActiveSheet();

  // 선택 영역이 있으면 그 값을, 없으면 A열 전체를 시드로 사용
  let seeds = [];
  const sel = input.getActiveRange();
  if (sel && sel.getNumRows() > 1) {
    seeds = sel.getValues().map(r => String(r[0]).trim());
  } else {
    const last = input.getLastRow();
    if (last >= 1) {
      seeds = input.getRange(1, 1, last, 1).getValues().map(r => String(r[0]).trim());
    }
  }
  seeds = dedupe_(seeds.filter(s => s && s !== '키워드' && s !== '시드'));

  if (!seeds.length) {
    SpreadsheetApp.getUi().alert('수집할 키워드가 없습니다. A열에 키워드를 입력하거나 범위를 선택하세요.');
    return;
  }

  // 큐 시트 초기화
  const q = getOrCreateSheet_(CONFIG.QUEUE_SHEET);
  q.clearContents();
  q.getRange(1, 1, seeds.length, 2).setValues(seeds.map(s => [s, 'pending']));

  ensureResultHeader_();
  clearTriggers_();
  ScriptApp.newTrigger('processBatch_').timeBased().after(1000).create();

  SpreadsheetApp.getActive().toast(seeds.length + '개 키워드 수집을 시작합니다.', '키워드 수집', 5);
}

function stopJob() {
  clearTriggers_();
  SpreadsheetApp.getActive().toast('진행 중인 트리거를 모두 정리했습니다.', '키워드 수집', 5);
}

// ============================ 배치 처리 ============================
/**
 * 시간 예산(BATCH_SECONDS) 안에서 큐를 처리한다.
 * 남으면 다음 배치 트리거를 다시 건다.
 */
function processBatch_() {
  const start = Date.now();
  const ss = SpreadsheetApp.getActive();
  const q = ss.getSheetByName(CONFIG.QUEUE_SHEET);
  if (!q || q.getLastRow() < 1) { clearTriggers_(); return; }

  const keys = getApiKeys_();
  const today = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyyMMdd');
  const rows = q.getRange(1, 1, q.getLastRow(), 2).getValues();

  for (let i = 0; i < rows.length; i++) {
    if (rows[i][1] !== 'pending') continue;

    // 시간 예산 초과 직전이면 멈추고 다음 배치 예약
    if ((Date.now() - start) / 1000 > CONFIG.BATCH_SECONDS) {
      clearTriggers_();
      ScriptApp.newTrigger('processBatch_').timeBased().after(1000).create();
      return;
    }

    const seed = String(rows[i][0]).trim();
    try {
      const collected = processOne_(seed, keys, today);
      appendResults_(collected);
      q.getRange(i + 1, 2).setValue('done');
    } catch (e) {
      q.getRange(i + 1, 2).setValue('error: ' + (e && e.message ? e.message : e));
    }
    SpreadsheetApp.flush();
  }

  // 전부 끝남
  clearTriggers_();
  if (CONFIG.SORT_BY_VOLUME) resortResults();
  ss.toast('수집 완료!', '키워드 수집', 5);
}

// ============================ 시드 1개 처리 ============================
/**
 * 한 시드에서 3가지 출처를 모으고, 중복 제거 후 검색량을 채워 반환한다.
 * @return {Array<Array>} 결과 시트에 그대로 넣을 행 배열
 */
function processOne_(seed, keys, today) {
  // keyword -> { seed, kw, pc, mo, comp, source, cat }
  const map = new Map();

  const add = (kw, source, extra) => {
    kw = String(kw || '').trim();
    if (!kw) return;
    const prev = map.get(kw);
    if (!prev) {
      map.set(kw, Object.assign({ seed: seed, kw: kw, pc: '', mo: '', comp: '', source: source, cat: '' }, extra || {}));
    } else if (SOURCE_PRIORITY[source] < SOURCE_PRIORITY[prev.source]) {
      // 더 우선순위 높은 출처로 교체(검색량/카테고리는 기존 값 보존하며 보강)
      prev.source = source;
      if (extra) Object.keys(extra).forEach(k => { if (extra[k] && !prev[k]) prev[k] = extra[k]; });
    } else if (extra) {
      Object.keys(extra).forEach(k => { if (extra[k] && !prev[k]) prev[k] = extra[k]; });
    }
  };

  // ① 연관 (검색광고 API) — 검색량/경쟁도 포함, 노이즈 필터 적용
  fetchRelatedAd_(seed, keys).forEach(r => {
    if (!isCleanKw_(r.kw)) return;
    add(r.kw, '연관', { pc: r.pc, mo: r.mo, comp: r.comp });
  });

  // ② 자동완성 — 검색량 필터 없이 그대로(저검색량 롱테일 보존)
  fetchAutocomplete_(seed).forEach(kw => add(kw, '자동완성', {}));

  // ③ 상위상품 (쇼핑 API) — 상품명 토큰 + 카테고리
  const shop = fetchShop_(seed, keys);
  shop.keywords.forEach(kw => add(kw, '상위상품', { cat: shop.topCategory }));

  // 검색량이 비어있는 키워드(자동완성·상위상품)는 검색광고 API로 보충
  fillVolumes_(map, keys);

  // 행 배열로 변환
  const out = [];
  map.forEach(v => {
    const pc = num_(v.pc), mo = num_(v.mo);
    const sum = (pc === '' && mo === '') ? '' : (toInt_(pc) + toInt_(mo));
    out.push([v.seed, v.kw, pc, mo, sum, v.comp, today, v.source, v.cat]);
  });
  return out;
}

// ============================ ① 연관 (검색광고 API) ============================
function fetchRelatedAd_(seed, keys) {
  const path = '/keywordstool';
  const ts = String(Date.now());
  const sig = signAd_(ts, 'GET', path, keys.adSecret);

  const url = 'https://api.searchad.naver.com' + path +
    '?hintKeywords=' + encodeURIComponent(seed.replace(/\s+/g, '')) + '&showDetail=1';

  const res = fetchWithRetry_(url, {
    method: 'get',
    muteHttpExceptions: true,
    headers: {
      'X-Timestamp': ts,
      'X-API-KEY': keys.adApiKey,
      'X-Customer': keys.adCustomerId,
      'X-Signature': sig,
    },
  });
  if (!res || res.getResponseCode() !== 200) return [];

  let data;
  try { data = JSON.parse(res.getContentText()); } catch (e) { return []; }
  const list = (data && data.keywordList) || [];

  return list.map(it => ({
    kw: String(it.relKeyword || '').trim(),
    pc: parseCnt_(it.monthlyPcQcCnt),
    mo: parseCnt_(it.monthlyMobileQcCnt),
    comp: it.compIdx || '',
  })).filter(x => x.kw);
}

/** 검색광고 API HMAC-SHA256 서명 */
function signAd_(timestamp, method, path, secret) {
  const msg = timestamp + '.' + method + '.' + path;
  const raw = Utilities.computeHmacSha256Signature(msg, secret);
  return Utilities.base64Encode(raw);
}

/** "< 10" 같은 값 처리 */
function parseCnt_(v) {
  if (v === undefined || v === null) return '';
  const s = String(v).replace(/[<,\s]/g, '');
  const n = parseInt(s, 10);
  return isNaN(n) ? '' : n;
}

// ============================ ② 자동완성 ============================
function fetchAutocomplete_(seed) {
  const url = 'https://ac.search.naver.com/nx/ac' +
    '?q=' + encodeURIComponent(seed) +
    '&con=1&frm=nv&ans=2&r_format=json&r_enc=UTF-8&r_unicode=0&t_koreng=1&run=2&rev=4&q_enc=UTF-8&st=100';

  const res = fetchWithRetry_(url, { method: 'get', muteHttpExceptions: true });
  if (!res || res.getResponseCode() !== 200) return [];

  let data;
  try { data = JSON.parse(res.getContentText()); } catch (e) { return []; }

  const out = [];
  const items = (data && data.items) || [];
  items.forEach(group => {
    (group || []).forEach(entry => {
      const kw = Array.isArray(entry) ? String(entry[0] || '').trim() : String(entry || '').trim();
      if (kw) out.push(kw);
    });
  });
  return dedupe_(out);
}

// ============================ ③ 상위상품 (쇼핑 API) ============================
/**
 * 쇼핑 검색 상위 상품명에서 키워드를 추출하고, 대표 카테고리를 뽑는다.
 * @return {{keywords: string[], topCategory: string}}
 */
function fetchShop_(seed, keys) {
  const url = 'https://openapi.naver.com/v1/search/shop.json' +
    '?query=' + encodeURIComponent(seed) +
    '&display=' + CONFIG.SHOP_DISPLAY + '&sort=sim';

  const res = fetchWithRetry_(url, {
    method: 'get',
    muteHttpExceptions: true,
    headers: {
      'X-Naver-Client-Id': keys.clientId,
      'X-Naver-Client-Secret': keys.clientSecret,
    },
  });
  if (!res || res.getResponseCode() !== 200) return { keywords: [], topCategory: '' };

  let data;
  try { data = JSON.parse(res.getContentText()); } catch (e) { return { keywords: [], topCategory: '' }; }
  const items = (data && data.items) || [];

  // 토큰 빈도 + 카테고리 빈도 집계
  const tokenFreq = new Map();
  const catFreq = new Map();
  const seedNorm = seed.replace(/\s+/g, '');

  items.forEach(it => {
    const title = stripTags_(it.title || '');
    extractTokens_(title).forEach(tok => {
      tokenFreq.set(tok, (tokenFreq.get(tok) || 0) + 1);
    });

    const cat = [it.category2, it.category3, it.category4]
      .filter(c => c && String(c).trim())
      .join(' > ');
    if (cat) catFreq.set(cat, (catFreq.get(cat) || 0) + 1);
  });

  // 빈도 N회 이상 + 시드 자신/불용어 제외, 빈도 내림차순
  const keywords = [...tokenFreq.entries()]
    .filter(([tok, f]) => f >= CONFIG.SHOP_MIN_FREQ && tok.replace(/\s+/g, '') !== seedNorm)
    .sort((a, b) => b[1] - a[1])
    .map(([tok]) => tok);

  const topCategory = [...catFreq.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c)[0] || '';

  return { keywords: keywords, topCategory: topCategory };
}

/** 상품명에서 의미있는 토큰 추출(브랜드/숫자/단위/특수문자 노이즈 제거) */
function extractTokens_(title) {
  // 괄호류 내용 제거 후 공백 분리
  const cleaned = title
    .replace(/[\[\](){}<>]/g, ' ')
    .replace(/[^가-힣a-zA-Z0-9\s]/g, ' ')   // 한글/영문/숫자/공백만
    .replace(/\s+/g, ' ')
    .trim();

  const out = [];
  cleaned.split(' ').forEach(raw => {
    const tok = raw.trim();
    if (tok.length < CONFIG.SHOP_MIN_TOKEN_LEN) return;
    if (/^\d+$/.test(tok)) return;                       // 순수 숫자
    if (/^[a-zA-Z]+$/.test(tok)) return;                 // 순수 영문(브랜드성)
    if (/\d/.test(tok) && /(cm|mm|kg|ml|호|종|개|매|팩|호점)/i.test(tok)) return; // 수치+단위
    if (SHOP_STOPWORDS.has(tok) || SHOP_STOPWORDS.has(tok.toLowerCase())) return;
    out.push(tok);
  });
  return out;
}

// ============================ 검색량 보충 ============================
/**
 * 검색량(pc/mo)이 비어있는 키워드를 검색광고 API로 일괄 조회해 채운다.
 * keywordstool은 hintKeywords에 콤마로 최대 5개까지 묶을 수 있다.
 */
function fillVolumes_(map, keys) {
  const targets = [];
  map.forEach(v => { if (v.pc === '' && v.mo === '') targets.push(v.kw); });
  if (!targets.length) return;

  for (let i = 0; i < targets.length; i += 5) {
    const chunk = targets.slice(i, i + 5);
    const hint = chunk.map(k => k.replace(/\s+/g, '')).join(',');

    const path = '/keywordstool';
    const ts = String(Date.now());
    const sig = signAd_(ts, 'GET', path, keys.adSecret);
    const url = 'https://api.searchad.naver.com' + path +
      '?hintKeywords=' + encodeURIComponent(hint) + '&showDetail=1';

    const res = fetchWithRetry_(url, {
      method: 'get',
      muteHttpExceptions: true,
      headers: {
        'X-Timestamp': ts,
        'X-API-KEY': keys.adApiKey,
        'X-Customer': keys.adCustomerId,
        'X-Signature': sig,
      },
    });
    if (!res || res.getResponseCode() !== 200) continue;

    let data;
    try { data = JSON.parse(res.getContentText()); } catch (e) { continue; }
    const list = (data && data.keywordList) || [];

    // relKeyword(공백제거) -> 검색량 매핑
    const vol = {};
    list.forEach(it => {
      const k = String(it.relKeyword || '').replace(/\s+/g, '');
      vol[k] = { pc: parseCnt_(it.monthlyPcQcCnt), mo: parseCnt_(it.monthlyMobileQcCnt), comp: it.compIdx || '' };
    });

    chunk.forEach(kw => {
      const v = map.get(kw);
      const hit = vol[kw.replace(/\s+/g, '')];
      if (v && hit) {
        if (v.pc === '') v.pc = hit.pc;
        if (v.mo === '') v.mo = hit.mo;
        if (!v.comp) v.comp = hit.comp;
      }
    });
  }
}

// ============================ 노이즈 필터 ============================
function isCleanKw_(kw) {
  kw = String(kw || '').trim();
  if (!kw) return false;

  const noSpace = kw.replace(/\s+/g, '');
  if (noSpace.length > CONFIG.KW_MAX_LEN) return false;

  // 특수문자 개수
  const special = (kw.match(/[^가-힣a-zA-Z0-9\s]/g) || []).length;
  if (special > CONFIG.KW_MAX_SPECIAL) return false;

  // 숫자 비중
  const digits = (noSpace.match(/\d/g) || []).length;
  if (noSpace.length > 0 && digits / noSpace.length > CONFIG.KW_MAX_DIGIT_RATIO) return false;

  // 광고/노이즈 패턴
  if (/(무료|배송|쿠폰|할인|이벤트|최저가|정품|사은품)/.test(kw) && kw.length <= 4) return false;

  return true;
}

// ============================ 결과 시트 ============================
function ensureResultHeader_() {
  const sh = getOrCreateSheet_(CONFIG.RESULT_SHEET);
  if (sh.getLastRow() === 0) {
    sh.appendRow(['시드', '키워드', 'PC', '모바일', '합계', '경쟁도', '수집일', '출처', '카테고리']);
    sh.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#f0f0f0');
    sh.setFrozenRows(1);
  }
}

function appendResults_(rows) {
  if (!rows || !rows.length) return;
  const sh = getOrCreateSheet_(CONFIG.RESULT_SHEET);
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, 9).setValues(rows);
}

/** 합계(E열) 내림차순 정렬(헤더 유지) */
function resortResults() {
  const sh = SpreadsheetApp.getActive().getSheetByName(CONFIG.RESULT_SHEET);
  if (!sh || sh.getLastRow() < 3) return;
  const range = sh.getRange(2, 1, sh.getLastRow() - 1, 9);
  range.sort([{ column: 5, ascending: false }, { column: 1, ascending: true }]);
}

// ============================ 유틸 ============================
function getApiKeys_() {
  const p = PropertiesService.getScriptProperties();
  const keys = {
    adCustomerId: p.getProperty('NAVER_AD_CUSTOMER_ID'),
    adApiKey:     p.getProperty('NAVER_AD_API_KEY'),
    adSecret:     p.getProperty('NAVER_AD_SECRET_KEY'),
    clientId:     p.getProperty('NAVER_CLIENT_ID'),
    clientSecret: p.getProperty('NAVER_CLIENT_SECRET'),
  };
  const missing = Object.keys(keys).filter(k => !keys[k]);
  if (missing.length) {
    throw new Error('스크립트 속성 누락: ' + missing.join(', '));
  }
  return keys;
}

/** 네트워크 일시 오류 대비 재시도(지수 백오프) */
function fetchWithRetry_(url, options, maxTries) {
  maxTries = maxTries || 3;
  let last;
  for (let i = 0; i < maxTries; i++) {
    try {
      const res = UrlFetchApp.fetch(url, options);
      const code = res.getResponseCode();
      if (code === 200) return res;
      // 429/5xx만 재시도, 그 외는 즉시 반환
      if (code !== 429 && code < 500) return res;
      last = res;
    } catch (e) {
      last = null;
    }
    Utilities.sleep(Math.pow(2, i) * 500); // 0.5s, 1s, 2s
  }
  return last;
}

function getOrCreateSheet_(name) {
  const ss = SpreadsheetApp.getActive();
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function clearTriggers_() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'processBatch_') ScriptApp.deleteTrigger(t);
  });
}

function dedupe_(arr) {
  const seen = new Set();
  const out = [];
  arr.forEach(x => { if (!seen.has(x)) { seen.add(x); out.push(x); } });
  return out;
}

function stripTags_(s) {
  return String(s).replace(/<[^>]*>/g, '').replace(/&[a-z]+;/g, ' ').trim();
}

function num_(v) { return (v === '' || v === null || v === undefined) ? '' : v; }
function toInt_(v) { const n = parseInt(v, 10); return isNaN(n) ? 0 : n; }

/* =========================================================
   시세 자동 갱신 스크립트 — GitHub Actions가 매일 실행
   결과를 assets/js/auto-data.js 에 기록하면 사이트 전체에 자동 반영됩니다.

   데이터 소스 (환경변수로 선택):
   ── 방식 1: 구글시트 (추천 — 즉시 사용 가능) ─────────────────
   SHEET_OFFICIAL_CSV  공시지원금 시트 CSV 발행 URL
                       컬럼: id,carrier,plan_monthly,official
   SHEET_SUPPORT_CSV   총지원금(시세) 시트 CSV 발행 URL
                       컬럼: id,carrier,mnp,chg
   ── 방식 2: 공공데이터포털 API (완전 자동) ───────────────────
   DATA_GO_KR_KEY       data.go.kr에서 발급받은 서비스 키
   DATA_GO_KR_ENDPOINT  단말기 지원금 조회 API 엔드포인트 URL
   ========================================================= */
import { writeFileSync, readFileSync } from "node:fs";

const OUT = "assets/js/auto-data.js";

/* 통신사 표기 정규화 */
function normCarrier(s) {
  s = String(s).trim().toUpperCase();
  if (["SKT", "SK", "SK텔레콤", "SKTELECOM"].includes(s)) return "SKT";
  if (["KT", "올레", "OLLEH"].includes(s)) return "KT";
  if (["LGU", "LGU+", "LG U+", "LG유플러스", "LGUPLUS", "U+"].includes(s)) return "LGU";
  return null;
}

function parseCsv(text) {
  const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim());
  const header = lines.shift().split(",").map((h) => h.trim().toLowerCase());
  return lines.map((l) => {
    const cells = l.split(",").map((c) => c.trim());
    return Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ""]));
  });
}

const num = (v) => {
  const n = Number(String(v).replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? null : n;
};

async function fetchText(url) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url.slice(0, 80)}`);
  return res.text();
}

/* ── 방식 1: 구글시트 ── */
async function fromSheets() {
  const data = { official: {}, officialByPlan: {}, support: {} };
  let used = false;

  if (process.env.SHEET_OFFICIAL_CSV) {
    const rows = parseCsv(await fetchText(process.env.SHEET_OFFICIAL_CSV));
    for (const r of rows) {
      const id = r.id, c = normCarrier(r.carrier), pm = num(r.plan_monthly), v = num(r.official);
      if (!id || !c || pm == null || v == null) continue;
      ((data.officialByPlan[id] ??= {})[c] ??= []).push([pm, v]);
      used = true;
    }
    // 구간 정렬 + 최고 요금제 기준값을 official로
    for (const id of Object.keys(data.officialByPlan))
      for (const c of Object.keys(data.officialByPlan[id])) {
        data.officialByPlan[id][c].sort((a, b) => a[0] - b[0]);
        (data.official[id] ??= {})[c] = data.officialByPlan[id][c].at(-1)[1];
      }
  }

  if (process.env.SHEET_SUPPORT_CSV) {
    const rows = parseCsv(await fetchText(process.env.SHEET_SUPPORT_CSV));
    for (const r of rows) {
      const id = r.id, c = normCarrier(r.carrier), mnp = num(r.mnp), chg = num(r.chg);
      if (!id || !c) continue;
      const slot = ((data.support[id] ??= {})[c] ??= {});
      if (mnp != null) slot.mnp = mnp;
      if (chg != null) slot.chg = chg;
      used = true;
    }
  }
  return used ? { source: "sheet", ...data } : null;
}

/* ── 방식 2: 공공데이터포털 (data.go.kr) 단말기 지원금 API ──
   API 응답 스키마는 신청한 API 문서에 맞춰 mapDataGov()를 수정하세요. */
async function fromDataGov() {
  const key = process.env.DATA_GO_KR_KEY, endpoint = process.env.DATA_GO_KR_ENDPOINT;
  if (!key || !endpoint) return null;
  const url = `${endpoint}${endpoint.includes("?") ? "&" : "?"}serviceKey=${encodeURIComponent(key)}&_type=json&numOfRows=999`;
  const raw = JSON.parse(await fetchText(url));
  return mapDataGov(raw);
}
function mapDataGov(raw) {
  // TODO: 발급받은 API의 응답 필드명에 맞춰 매핑하세요.
  // 기대 형식 예: items[].{modelName, telecom, planPrice, subsidy}
  // 모델명 → 사이트 기종 id 매핑은 아래 MODEL_MAP에 추가합니다.
  const MODEL_MAP = {
    "갤럭시 S26 울트라": "s26-ultra",
    "갤럭시 S26+": "s26-plus",
    "갤럭시 S26": "s26",
    "갤럭시 Z 플립7": "zflip7",
    "갤럭시 Z 폴드7": "zfold7",
    "아이폰 17 프로 맥스": "iphone17-pro-max",
    "아이폰 17 프로": "iphone17-pro",
    "아이폰 17": "iphone17",
  };
  const items = raw?.response?.body?.items?.item || [];
  const data = { official: {}, officialByPlan: {}, support: {} };
  for (const it of items) {
    const id = MODEL_MAP[it.modelName];
    const c = normCarrier(it.telecom);
    const pm = num(it.planPrice), v = num(it.subsidy);
    if (!id || !c || pm == null || v == null) continue;
    ((data.officialByPlan[id] ??= {})[c] ??= []).push([pm, v]);
  }
  let used = false;
  for (const id of Object.keys(data.officialByPlan)) {
    used = true;
    for (const c of Object.keys(data.officialByPlan[id])) {
      data.officialByPlan[id][c].sort((a, b) => a[0] - b[0]);
      (data.official[id] ??= {})[c] = data.officialByPlan[id][c].at(-1)[1];
    }
  }
  return used ? { source: "datagov", ...data } : null;
}

/* ── 실행 ── */
const result = (await fromDataGov().catch((e) => (console.error("datagov 실패:", e.message), null)))
  || (await fromSheets().catch((e) => (console.error("sheet 실패:", e.message), null)));

if (!result) {
  console.log("갱신할 데이터 소스가 설정되지 않았거나 비어 있습니다. (auto-data.js 변경 없음)");
  process.exit(0);
}

const out = `/* 자동 생성 파일 — 직접 수정하지 마세요. scripts/update-prices.mjs가 갱신합니다. */
const AUTO_DATA = ${JSON.stringify({
  generatedAt: new Date().toISOString(),
  source: result.source,
  official: result.official,
  officialByPlan: result.officialByPlan,
  support: result.support,
}, null, 2)};
`;

const prev = readFileSync(OUT, "utf8").replace(/"generatedAt": "[^"]*"/, "");
if (prev === out.replace(/"generatedAt": "[^"]*"/, "")) {
  console.log("데이터 변동 없음 — 커밋 생략");
  process.exit(0);
}
writeFileSync(OUT, out);
console.log(`auto-data.js 갱신 완료 (source=${result.source}, 기종 ${Object.keys({ ...result.official, ...result.support }).length}종)`);

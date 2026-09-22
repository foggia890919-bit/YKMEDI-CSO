import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getCsoScope } from "@/lib/cso/scope";
import { csoAvailWithRows, csoSetAvailResult, csoAppendAvail, vendorList } from "@/lib/gateway/cso";
import { notifyFilterResult } from "@/lib/cso/filterNotify";
import { toRow, statusKind } from "@/lib/availability";
import { googleAccessToken, googleDirectEnabled as hasGoogleCreds } from "@/lib/google";
import { getSetting } from "@/lib/gateway/notify";

// 관리자 전용: 필터링 결과표 이미지(캡처·사진) → 제약사·결과 추출 → 대기 요청에 결과 채움(없으면 새 행)
//   POST { action:"extract", image:<base64>, mediaType:"image/jpeg"|"image/png"|"image/webp"|"image/gif" }
//   POST { action:"apply", name, bizNo, items:[{ vendor, status:"거래가능"|"거래불가"|"회신전", raw }] }
// 인식 엔진(설정 OCR_ENGINE 또는 환경변수, 기본 auto):
//   gemini : Gemini Flash (GEMINI_API_KEY) — 빠르고 저렴, 표 구조까지 이해
//   vision : Google Cloud Vision OCR — 이미 있는 서비스계정으로 호출(GCP 프로젝트에서 Vision API 활성화 필요), 글자만 읽고 행은 규칙으로 분석
//   claude : Claude (ANTHROPIC_API_KEY)
//   auto   : GEMINI_API_KEY 있으면 gemini → 없으면 vision 시도 → 실패 시 ANTHROPIC_API_KEY 있으면 claude
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Vercel 에 이미 있을 수 있는 Gemini 키 이름들을 전부 인식 (설정 탭 GEMINI_API_KEY 도 허용) */
function geminiKey(): string {
  const direct = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_KEY || process.env.GOOGLE_API_KEY || "";
  if (direct) return direct;
  // 이름을 모르는 경우: 이름에 GEMINI/GENERATIVE 가 들어간 변수, 또는 GOOGLE 이 들어가고 값이 구글 API 키 모양(AIza…)인 변수를 자동으로 씀
  const keys = Object.keys(process.env);
  const byName = keys.find((k) => /GEMINI|GENERATIVE/i.test(k) && String(process.env[k] || "").trim());
  if (byName) return String(process.env[byName]).trim();
  const byShape = keys.find((k) => /GOOGLE|GCP|GENAI/i.test(k) && /^AIza[0-9A-Za-z_-]{20,}$/.test(String(process.env[k] || "").trim()));
  return byShape ? String(process.env[byShape]).trim() : "";
}
/** 진단용: AI 관련 환경변수 이름만 (값은 절대 안 내보냄) */
function aiEnvNames(): string[] {
  return Object.keys(process.env).filter((k) => /GEMINI|GENERATIVE|GOOGLE|GATEWAY|ANTHROPIC|OPENAI|CLAUDE|VISION|OCR|^AI_/i.test(k) && !/PRIVATE_KEY|SECRET|SERVICE_ACCOUNT/i.test(k)).sort();
}
/** Vercel AI Gateway 키 (프로젝트에 AI Gateway 를 켜 두었으면 이 이름으로 자동 주입되기도 함) */
function gatewayKey(): string { return process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_AI_GATEWAY_API_KEY || ""; }
const GATEWAY_MODEL = process.env.OCR_GATEWAY_MODEL || "google/gemini-2.5-flash";
const CLAUDE_MODEL = "claude-haiku-4-5-20251001"; // 표 읽기에는 소형 모델로 충분 (이미지 1장 ≈ 1~2천 토큰)
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const Extracted = z.object({
  hospital: z.string(), // 표에 보이는 병의원(거래처)명, 없으면 ""
  items: z.array(z.object({
    vendor: z.string(), // 제약사명 (표준 목록에 같은 회사가 있으면 그 이름)
    status: z.enum(["거래가능", "거래불가", "회신전", "기타"]),
    raw: z.string(), // 결과 칸 원문
  })),
});
type Out = z.infer<typeof Extracted>;
type Item = Out["items"][number];
type MT = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

const norm = (s: unknown) => String(s ?? "").replace(/\s/g, "").replace(/\(주\)|주식회사|㈜/g, "").toLowerCase();

function guideText(vendors: string[]): string {
  return [
    "이 이미지는 병의원 대체조제 필터링(거래가능유무) 결과표입니다. 표의 모든 행에서 제약사명과 결과를 빠짐없이 추출하세요.",
    "결과 분류: '가능', 'O', '거래중', '가능(…)'은 거래가능 / '불가', 'X', '불가(타업체)'는 거래불가 / '회신전', '확인중', '대기', 빈칸은 회신전 / 그 밖의 문구는 기타. raw 에는 결과 칸 원문을 그대로 넣습니다.",
    "제약사명은 아래 표준 목록에 같은 회사를 가리키는 이름이 있으면 그 표준 이름으로 바꾸고(예: '대웅바이오 CNE' → '대웅바이오(CNE)'), 없으면 읽은 그대로 둡니다. 순번·번호는 제약사명에 넣지 마세요.",
    "표에 병의원(거래처)명이 보이면 hospital 에 넣고, 없으면 빈 문자열로 둡니다.",
    vendors.length ? "표준 제약사 목록: " + vendors.join(", ") : "",
  ].filter(Boolean).join("\n");
}

/** 결과 칸 문구 → 분류 */
function classify(raw: string): Item["status"] {
  const t = String(raw || "").replace(/\s/g, "");
  if (!t) return "회신전";
  if (/거래불가|불가|^x$|^X$|✕|✗/.test(t)) return "거래불가";
  if (/거래가능|가능|거래중|^o$|^O$|○|◯|✓|✔/.test(t)) return "거래가능";
  if (/회신전|확인중|대기|요청|보류/.test(t)) return "회신전";
  return "기타";
}
/** 읽은 제약사명 → 표준 목록 이름 (같은 회사면 표준명, 없으면 그대로) */
function canonVendor(name: string, vendors: string[]): string {
  const n = norm(name); if (!n) return name.trim();
  const exact = vendors.find((v) => norm(v) === n); if (exact) return exact;
  const inc = vendors.find((v) => norm(v).includes(n) || n.includes(norm(v))); return inc || name.trim();
}

/* ---------- 엔진 1: Gemini (구글 AI API 키) ---------- */
async function extractGemini(image: string, mediaType: MT, vendors: string[]): Promise<Out> {
  const key = geminiKey();
  if (!key) throw new Error("Gemini 키가 없습니다 (GEMINI_API_KEY / GOOGLE_GENERATIVE_AI_API_KEY / GOOGLE_API_KEY 중 하나)");
  const schema = { type: "OBJECT", properties: { hospital: { type: "STRING" }, items: { type: "ARRAY", items: { type: "OBJECT", properties: { vendor: { type: "STRING" }, status: { type: "STRING", enum: ["거래가능", "거래불가", "회신전", "기타"] }, raw: { type: "STRING" } }, required: ["vendor", "status", "raw"] } } }, required: ["hospital", "items"] };
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(key)}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ inline_data: { mime_type: mediaType, data: image } }, { text: guideText(vendors) }] }], generationConfig: { temperature: 0, response_mime_type: "application/json", response_schema: schema } }),
  });
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Gemini ${r.status}: ${j?.error?.message || "호출 실패"}`);
  const text = j?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") || "";
  let parsed: any; try { parsed = JSON.parse(text); } catch { throw new Error("Gemini 응답을 해석하지 못했습니다"); }
  const out = Extracted.safeParse(parsed); if (!out.success) throw new Error("Gemini 응답 형식 오류");
  return { hospital: out.data.hospital, items: out.data.items.map((it) => ({ ...it, vendor: canonVendor(it.vendor, vendors) })) };
}

/* ---------- 엔진 1-b: Vercel AI Gateway (OpenAI 호환) 로 Gemini 호출 — 구글 키 없이 AI_GATEWAY_API_KEY 만 있을 때 ---------- */
async function extractGateway(image: string, mediaType: MT, vendors: string[]): Promise<Out> {
  const key = gatewayKey();
  if (!key) throw new Error("AI_GATEWAY_API_KEY 가 없습니다");
  const schema = { type: "object", additionalProperties: false, properties: { hospital: { type: "string" }, items: { type: "array", items: { type: "object", additionalProperties: false, properties: { vendor: { type: "string" }, status: { type: "string", enum: ["거래가능", "거래불가", "회신전", "기타"] }, raw: { type: "string" } }, required: ["vendor", "status", "raw"] } } }, required: ["hospital", "items"] };
  const r = await fetch("https://ai-gateway.vercel.sh/v1/chat/completions", {
    method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: GATEWAY_MODEL, temperature: 0, messages: [{ role: "user", content: [{ type: "image_url", image_url: { url: `data:${mediaType};base64,${image}` } }, { type: "text", text: guideText(vendors) + "\nJSON 으로만 답하세요: {hospital, items:[{vendor,status,raw}]}" }] }], response_format: { type: "json_schema", json_schema: { name: "filter_result", strict: true, schema } } }),
  });
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`AI Gateway ${r.status}: ${j?.error?.message || j?.error || "호출 실패"}`);
  const text = String(j?.choices?.[0]?.message?.content || "").replace(/^```(?:json)?\s*|\s*```$/g, "");
  let parsed: any; try { parsed = JSON.parse(text); } catch { throw new Error("AI Gateway 응답을 해석하지 못했습니다"); }
  const out = Extracted.safeParse(parsed); if (!out.success) throw new Error("AI Gateway 응답 형식 오류");
  return { hospital: out.data.hospital, items: out.data.items.map((it) => ({ ...it, vendor: canonVendor(it.vendor, vendors) })) };
}

/* ---------- 엔진 2: Google Cloud Vision OCR (서비스계정) + 행 규칙 분석 ---------- */
async function extractVision(image: string, vendors: string[]): Promise<Out> {
  if (!hasGoogleCreds()) throw new Error("구글 서비스계정(GOOGLE_SERVICE_ACCOUNT_EMAIL/PRIVATE_KEY)이 없습니다");
  const t = await googleAccessToken();
  const r = await fetch("https://vision.googleapis.com/v1/images:annotate", {
    method: "POST", headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
    body: JSON.stringify({ requests: [{ image: { content: image }, features: [{ type: "TEXT_DETECTION" }], imageContext: { languageHints: ["ko", "en"] } }] }),
  });
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok) {
    const m = String(j?.error?.message || r.status);
    throw new Error(/has not been used|is disabled|SERVICE_DISABLED|PERMISSION_DENIED/.test(m) ? "Vision API 가 꺼져 있음 — GCP 콘솔 › API 및 서비스 › Cloud Vision API 「사용」 (결제 계정 필요, 월 1,000장 무료) · " + m : "Vision " + m);
  }
  const ann: any[] = j?.responses?.[0]?.textAnnotations || [];
  if (ann.length < 2) throw new Error("이미지에서 글자를 찾지 못했습니다");
  // 단어(1번부터)를 y 중심으로 묶어 행을 만들고, 행 안에서는 x 순서로 이어 붙인다 (표 캡처의 셀 → 한 줄)
  const words = ann.slice(1).map((a) => { const v = a.boundingPoly?.vertices || []; const ys = v.map((p: any) => p.y || 0), xs = v.map((p: any) => p.x || 0); return { text: String(a.description || ""), x: Math.min(...xs), yc: (Math.min(...ys) + Math.max(...ys)) / 2, h: Math.max(...ys) - Math.min(...ys) }; });
  const hs = words.map((w) => w.h).sort((a, b) => a - b); const tol = Math.max(6, (hs[Math.floor(hs.length / 2)] || 12) * 0.6);
  words.sort((a, b) => a.yc - b.yc);
  const rows: { yc: number; ws: typeof words }[] = [];
  for (const w of words) { const row = rows.find((rw) => Math.abs(rw.yc - w.yc) <= tol); if (row) { row.ws.push(w); row.yc = (row.yc * (row.ws.length - 1) + w.yc) / row.ws.length; } else rows.push({ yc: w.yc, ws: [w] }); }
  const items: Item[] = []; let hospital = "";
  const STATUS = /(거래\s*가능|거래\s*불가|회신\s*전|확인\s*중|불가(\([^)]*\))?|가능(\([^)]*\))?|거래중|대기|보류|[OXox○◯✓✔✕✗])\s*$/;
  for (const rw of rows) {
    const line = rw.ws.sort((a, b) => a.x - b.x).map((w) => w.text).join(" ").trim();
    const hm = line.match(/(병의원|거래처|병원명|약국명)\s*[:：]?\s*(.+)/); if (hm && !hospital) { hospital = hm[2].trim(); continue; }
    const m = line.match(STATUS); if (!m) continue;
    let vendor = line.slice(0, m.index).replace(/^\s*\d+[\s.)]*/, "").replace(/[|｜]/g, " ").trim();
    if (!vendor || /제약사|업체|결과|거래가능유무/.test(vendor)) continue;
    vendor = canonVendor(vendor, vendors);
    items.push({ vendor, status: classify(m[1]), raw: m[1].trim() });
  }
  if (!items.length) throw new Error("글자는 읽었지만 「제약사 + 결과」 행을 찾지 못했습니다 (표 캡처가 맞는지 확인)");
  return { hospital, items };
}

/* ---------- 엔진 3: Claude ---------- */
async function extractClaude(image: string, mediaType: MT, vendors: string[]): Promise<Out> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY 환경변수가 없습니다");
  const client = new Anthropic();
  const response = await client.messages.parse({
    model: CLAUDE_MODEL, max_tokens: 8000,
    messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: mediaType, data: image } }, { type: "text", text: guideText(vendors) }] }],
    output_config: { format: zodOutputFormat(Extracted) },
  });
  if (response.stop_reason === "refusal") throw new Error("모델이 이 이미지 처리를 거부했습니다. 다른 캡처로 다시 시도하세요.");
  if (!response.parsed_output) throw new Error("이미지에서 표를 읽지 못했습니다. 표가 잘 보이는 캡처로 다시 시도하세요.");
  return response.parsed_output;
}

async function extract(image: string, mediaType: MT): Promise<Out & { engine: string }> {
  let vendors: string[] = [];
  try { vendors = await vendorList(); } catch { vendors = []; }
  const pref = ((await getSetting("OCR_ENGINE").catch(() => "")) || process.env.OCR_ENGINE || "auto").trim().toLowerCase();
  const order = ["gemini", "gateway", "vision", "claude"].includes(pref) ? [pref]
    : [geminiKey() ? "gemini" : "", gatewayKey() ? "gateway" : "", hasGoogleCreds() ? "vision" : "", process.env.ANTHROPIC_API_KEY ? "claude" : ""].filter(Boolean);
  if (!order.length) throw new Error("인식 엔진이 없습니다: Gemini 키(GEMINI_API_KEY 등) 또는 AI_GATEWAY_API_KEY 또는 Vision API 활성화 또는 ANTHROPIC_API_KEY 중 하나");
  const errors: string[] = [];
  for (const eng of order) {
    try {
      const out = eng === "gemini" ? await extractGemini(image, mediaType, vendors) : eng === "gateway" ? await extractGateway(image, mediaType, vendors) : eng === "vision" ? await extractVision(image, vendors) : await extractClaude(image, mediaType, vendors);
      return { ...out, engine: eng === "gemini" ? GEMINI_MODEL : eng === "gateway" ? "gateway:" + GATEWAY_MODEL : eng === "vision" ? "google-vision" : CLAUDE_MODEL };
    } catch (e: any) { errors.push(`${eng}: ${e?.message || "실패"}`); }
  }
  const hint = geminiKey() || gatewayKey() ? "" : " · 가장 쉬운 해결: Vercel 환경변수 GEMINI_API_KEY 추가(aistudio.google.com/apikey 에서 무료 발급) 후 재배포";
  throw new Error(errors.join(" / ") + hint);
}

/** 관리자 진단: 어떤 인식 엔진이 설정돼 있는지 (키 값은 절대 내보내지 않음) */
export async function GET() {
  const scope = await getCsoScope();
  if (!scope || !scope.isAdmin) return NextResponse.json({ ok: false, error: "관리자만" }, { status: 403 });
  const pref = ((await getSetting("OCR_ENGINE").catch(() => "")) || process.env.OCR_ENGINE || "auto").trim().toLowerCase();
  return NextResponse.json({ ok: true, pref, engines: { gemini: !!geminiKey(), gateway: !!gatewayKey(), vision: hasGoogleCreds(), claude: !!process.env.ANTHROPIC_API_KEY }, geminiModel: GEMINI_MODEL, gatewayModel: GATEWAY_MODEL, claudeModel: CLAUDE_MODEL, envNames: aiEnvNames(), help: "gemini/gateway 가 false 면 Vercel › Settings › Environment Variables 에 GEMINI_API_KEY 를 넣고 재배포. envNames 에 이름이 보이면 그 이름을 알려주세요." });
}

export async function POST(req: NextRequest) {
  const scope = await getCsoScope();
  if (!scope) return NextResponse.json({ ok: false, error: "로그인이 필요합니다." }, { status: 401 });
  if (!scope.isAdmin) return NextResponse.json({ ok: false, error: "관리자만 접근할 수 있습니다." }, { status: 403 });
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: "잘못된 요청" }, { status: 400 }); }

  if (body.action === "extract") {
    const image = String(body.image || "").replace(/^data:[^;]+;base64,/, "");
    const mt = String(body.mediaType || "image/jpeg");
    if (!image) return NextResponse.json({ ok: false, error: "이미지가 없습니다." }, { status: 400 });
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(mt)) return NextResponse.json({ ok: false, error: "지원하지 않는 이미지 형식: " + mt }, { status: 400 });
    try {
      const out = await extract(image, mt as MT);
      // 매칭 정보: 대기 요청이 있는 제약사인지
      let all: Awaited<ReturnType<typeof csoAvailWithRows>> = [];
      try { all = await csoAvailWithRows(); } catch { all = []; }
      const hospitals = Array.from(new Set(all.map((r) => r.name.trim()).filter(Boolean)));
      const hn = norm(out.hospital);
      const items = out.items.map((it) => {
        const hit = all.find((r) => norm(r.vendor) === norm(it.vendor) && (!hn || norm(r.name) === hn) && statusKind(r.status) === "pending");
        return { ...it, matchRow: hit ? hit.row : 0, matchName: hit ? hit.name : "" };
      });
      return NextResponse.json({ ok: true, hospital: out.hospital, items, hospitals, model: out.engine });
    } catch (e: any) {
      return NextResponse.json({ ok: false, error: e?.message || "인식 실패" }, { status: 502 });
    }
  }

  if (body.action === "apply") {
    const name = String(body.name || "").trim(), bizNo = String(body.bizNo || "").replace(/\D/g, "");
    const items = (Array.isArray(body.items) ? body.items : []) as Item[];
    if (!name) return NextResponse.json({ ok: false, error: "거래처명은 필수입니다." }, { status: 400 });
    if (!items.length) return NextResponse.json({ ok: false, error: "반영할 항목이 없습니다." }, { status: 400 });
    const handler = scope.name || scope.id;
    const dateKST = new Date().toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });
    const out = { filled: 0, added: 0, requested: 0, skipped: 0, notified: 0, errors: [] as string[] };
    let all = await csoAvailWithRows();
    for (const it of items) {
      const vendor = String(it.vendor || "").trim(); if (!vendor) continue;
      const st = it.status === "거래가능" || it.status === "거래불가" ? it.status : "";
      const note = "이미지 입력" + (it.raw ? ": " + String(it.raw).trim() : "");
      try {
        const pendingRow = all.find((r) => norm(r.name) === norm(name) && norm(r.vendor) === norm(vendor) && statusKind(r.status) === "pending");
        if (pendingRow && st) {
          const item = await csoSetAvailResult(pendingRow.row, st, note, handler);
          out.filled++;
          try { const nr = await notifyFilterResult(item, st, note); if (nr.notified) out.notified++; } catch { /* 통보 실패 무시 */ }
        } else if (pendingRow && !st) {
          out.skipped++; // 이미 대기 중 — 회신전은 그대로
        } else {
          const exists = all.find((r) => norm(r.name) === norm(name) && norm(r.vendor) === norm(vendor) && statusKind(r.status) !== "pending");
          if (exists && st && norm(exists.status) === norm(st)) { out.skipped++; continue; } // 같은 결과가 이미 있음
          const row = toRow({ name, bizNo, vendor, note, category: "입력" }, handler, dateKST);
          row[6] = st; // 결과가 있으면 바로 기록, 회신전이면 비워 두어 확인중으로 표시
          await csoAppendAvail(row);
          if (st) out.added++; else out.requested++;
          all = [...all, { row: 0, category: "입력", date: dateKST, requester: handler, name, bizNo, vendor, status: st, note }];
        }
      } catch (e: any) { out.errors.push(`${vendor}: ${e?.message || "실패"}`); }
    }
    return NextResponse.json({ ok: true, ...out });
  }
  return NextResponse.json({ ok: false, error: "알 수 없는 동작" }, { status: 400 });
}

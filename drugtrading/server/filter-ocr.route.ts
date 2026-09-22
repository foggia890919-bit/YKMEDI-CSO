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
//   vertex : Vertex AI Gemini — 기존 서비스계정으로(GCP 에서 Vertex AI API 활성화), 새 키 불필요
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

/* ---------- 엔진 1-c: Vertex AI Gemini — 새 키 없이 기존 서비스계정으로 (GCP 프로젝트에서 Vertex AI API 켜기) ---------- */
function gcpProject(): string {
  const env = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT || process.env.GOOGLE_PROJECT_ID || "";
  if (env) return env;
  const m = (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "").match(/@([a-z0-9-]+)\.iam\.gserviceaccount\.com$/i);
  return m ? m[1] : "";
}
async function extractVertex(image: string, mediaType: MT, vendors: string[]): Promise<Out> {
  if (!hasGoogleCreds()) throw new Error("구글 서비스계정이 없습니다");
  const project = gcpProject(); if (!project) throw new Error("GCP 프로젝트 ID 를 알 수 없음 (환경변수 GOOGLE_CLOUD_PROJECT)");
  const loc = process.env.VERTEX_LOCATION || "global";
  const host = loc === "global" ? "aiplatform.googleapis.com" : `${loc}-aiplatform.googleapis.com`;
  const t = await googleAccessToken();
  const schema = { type: "OBJECT", properties: { hospital: { type: "STRING" }, items: { type: "ARRAY", items: { type: "OBJECT", properties: { vendor: { type: "STRING" }, status: { type: "STRING", enum: ["거래가능", "거래불가", "회신전", "기타"] }, raw: { type: "STRING" } }, required: ["vendor", "status", "raw"] } } }, required: ["hospital", "items"] };
  const r = await fetch(`https://${host}/v1/projects/${project}/locations/${loc}/publishers/google/models/${GEMINI_MODEL}:generateContent`, {
    method: "POST", headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ role: "user", parts: [{ inlineData: { mimeType: mediaType, data: image } }, { text: guideText(vendors) }] }], generationConfig: { temperature: 0, responseMimeType: "application/json", responseSchema: schema } }),
  });
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok) {
    const m = String(j?.error?.message || r.status);
    throw new Error(/has not been used|is disabled|SERVICE_DISABLED|PERMISSION_DENIED|403/.test(m) ? `Vertex AI API 가 꺼져 있음 — GCP 콘솔 › API 및 서비스 › Vertex AI API 「사용」(결제 계정 필요) 후 서비스계정에 Vertex AI 사용자 역할 · ${m}` : "Vertex " + m);
  }
  const text = j?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") || "";
  let parsed: any; try { parsed = JSON.parse(text); } catch { throw new Error("Vertex 응답을 해석하지 못했습니다"); }
  const out = Extracted.safeParse(parsed); if (!out.success) throw new Error("Vertex 응답 형식 오류");
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

/** 자가 진단용 작은 표 이미지(다산제약 거래불가 / 동구바이오 거래가능 / 휴텍스 회신전) */
const TEST_IMAGE = "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";
const ENGINE_LABEL: Record<string, string> = { gemini: "Gemini (API 키)", gateway: "Vercel AI Gateway", vertex: "Vertex AI Gemini (서비스계정)", vision: "구글 Vision OCR (서비스계정)", claude: "Claude" };
async function extractWith(eng: string, image: string, mediaType: MT, vendors: string[]): Promise<Out> {
  return eng === "gemini" ? extractGemini(image, mediaType, vendors) : eng === "gateway" ? extractGateway(image, mediaType, vendors) : eng === "vertex" ? extractVertex(image, mediaType, vendors) : eng === "vision" ? extractVision(image, vendors) : extractClaude(image, mediaType, vendors);
}
/** 오류 문구 → 사장님이 할 일 한 줄 */
function plainFix(eng: string, msg: string): string {
  if (/결제|billing|BILLING/i.test(msg)) return "GCP 프로젝트에 결제 계정을 연결해야 합니다 (console.cloud.google.com › 결제)";
  if (/has not been used|is disabled|SERVICE_DISABLED|꺼져 있음/i.test(msg)) return eng === "vertex" ? "GCP 콘솔에서 Vertex AI API 를 「사용」으로 켜세요 (방금 켰다면 5분 뒤 다시)" : eng === "vision" ? "GCP 콘솔에서 Cloud Vision API 를 「사용」으로 켜세요" : msg;
  if (/PERMISSION_DENIED|permission|403/i.test(msg)) return "IAM 에서 서비스계정에 「Vertex AI 사용자」 역할을 추가하세요";
  if (/키가 없습니다|환경변수가 없습니다|API_KEY/i.test(msg)) return "이 엔진은 키가 없어 건너뜀 (필요 없으면 무시)";
  if (/404|not found|NOT_FOUND/i.test(msg)) return "모델 이름 또는 리전 문제 — 환경변수 GEMINI_MODEL / VERTEX_LOCATION 확인";
  return msg;
}
async function selfTest(): Promise<{ ok: boolean; summary: string; results: { engine: string; label: string; ok: boolean; items?: string[]; error?: string; fix?: string; ms: number }[] }> {
  let vendors: string[] = []; try { vendors = await vendorList(); } catch { vendors = []; }
  const order = [geminiKey() ? "gemini" : "", gatewayKey() ? "gateway" : "", hasGoogleCreds() ? "vertex" : "", hasGoogleCreds() ? "vision" : "", process.env.ANTHROPIC_API_KEY ? "claude" : ""].filter(Boolean);
  const results: { engine: string; label: string; ok: boolean; items?: string[]; error?: string; fix?: string; ms: number }[] = [];
  for (const eng of order) {
    const t0 = Date.now();
    try { const out = await extractWith(eng, TEST_IMAGE, "image/jpeg", vendors); results.push({ engine: eng, label: ENGINE_LABEL[eng], ok: true, items: out.items.map((i) => `${i.vendor}:${i.status}`), ms: Date.now() - t0 }); }
    catch (e: any) { const msg = String(e?.message || e); results.push({ engine: eng, label: ENGINE_LABEL[eng], ok: false, error: msg, fix: plainFix(eng, msg), ms: Date.now() - t0 }); }
  }
  const good = results.find((r) => r.ok);
  const summary = good ? `✅ 사용 가능 — ${good.label} 로 인식됩니다. 도구에서 이미지 자동 입력을 바로 쓰시면 됩니다.`
    : results.length ? `❌ 아직 안 됨 — 할 일: ${results.map((r) => `[${r.label}] ${r.fix}`).join(" / ")}` : "❌ 인식 엔진이 하나도 설정되지 않았습니다 — Vercel 환경변수 GEMINI_API_KEY 를 넣거나 GCP 에서 Vertex AI API 를 켜세요";
  return { ok: !!good, summary, results };
}

async function extract(image: string, mediaType: MT): Promise<Out & { engine: string }> {
  let vendors: string[] = [];
  try { vendors = await vendorList(); } catch { vendors = []; }
  const pref = ((await getSetting("OCR_ENGINE").catch(() => "")) || process.env.OCR_ENGINE || "auto").trim().toLowerCase();
  const order = ["gemini", "gateway", "vertex", "vision", "claude"].includes(pref) ? [pref]
    : [geminiKey() ? "gemini" : "", gatewayKey() ? "gateway" : "", hasGoogleCreds() ? "vertex" : "", hasGoogleCreds() ? "vision" : "", process.env.ANTHROPIC_API_KEY ? "claude" : ""].filter(Boolean);
  if (!order.length) throw new Error("인식 엔진이 없습니다: Gemini 키(GEMINI_API_KEY 등) 또는 AI_GATEWAY_API_KEY 또는 Vision API 활성화 또는 ANTHROPIC_API_KEY 중 하나");
  const errors: string[] = [];
  for (const eng of order) {
    try {
      const out = await extractWith(eng, image, mediaType, vendors);
      return { ...out, engine: eng === "gemini" ? GEMINI_MODEL : eng === "gateway" ? "gateway:" + GATEWAY_MODEL : eng === "vertex" ? "vertex:" + GEMINI_MODEL : eng === "vision" ? "google-vision" : CLAUDE_MODEL };
    } catch (e: any) { errors.push(`${eng}: ${e?.message || "실패"}`); }
  }
  const hint = geminiKey() || gatewayKey() ? "" : " · 해결: ① GCP 콘솔에서 Vertex AI API 또는 Cloud Vision API 「사용」(기존 서비스계정 그대로) 또는 ② Vercel 환경변수 GEMINI_API_KEY 추가(aistudio.google.com/apikey) 후 재배포";
  throw new Error(errors.join(" / ") + hint);
}

/** 관리자 진단: 어떤 인식 엔진이 설정돼 있는지 (키 값은 절대 내보내지 않음) */
export async function GET(req: NextRequest) {
  const scope = await getCsoScope();
  if (!scope || !scope.isAdmin) return NextResponse.json({ ok: false, error: "관리자만" }, { status: 403 });
  if (req.nextUrl.searchParams.get("test") === "1") {
    // 자가 진단: 내장 표 이미지로 설정된 엔진을 순서대로 실제 호출 → 되는지, 안 되면 무엇을 하면 되는지 한 줄로
    const r = await selfTest();
    return NextResponse.json({ ok: r.ok, summary: r.summary, results: r.results });
  }
  const pref = ((await getSetting("OCR_ENGINE").catch(() => "")) || process.env.OCR_ENGINE || "auto").trim().toLowerCase();
  return NextResponse.json({ ok: true, pref, engines: { gemini: !!geminiKey(), gateway: !!gatewayKey(), vertex: hasGoogleCreds() && !!gcpProject(), vision: hasGoogleCreds(), claude: !!process.env.ANTHROPIC_API_KEY }, gcpProject: gcpProject(), geminiModel: GEMINI_MODEL, gatewayModel: GATEWAY_MODEL, claudeModel: CLAUDE_MODEL, envNames: aiEnvNames(), help: "실제로 되는지 보려면 이 주소 뒤에 ?test=1 을 붙여 여세요 — 내장 표 이미지로 엔진을 실제 호출해 결과와 할 일을 알려줍니다." });
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

// YKMEDI 명함 AI 정밀 인식 (Supabase Edge Function)
// 명함 앞/뒤 이미지를 Claude Vision으로 읽어 구조화된 연락처 필드를 반환한다.
// 배포:  supabase functions deploy card-ai-ocr
// 시크릿: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// (verify_jwt 기본값 유지 — 로그인한 사용자만 호출 가능)
import Anthropic from "npm:@anthropic-ai/sdk";
import { z } from "npm:zod";
import { zodOutputFormat } from "npm:@anthropic-ai/sdk/helpers/zod";

const CardFields = z.object({
  name: z.string().describe("사람 이름 — 한글·한자 등 현지 표기 우선, 없으면 로마자"),
  name_en: z.string().describe("로마자(영문) 이름 — name과 동일 표기면 빈 문자열"),
  company: z.string().describe("회사/기관명"),
  department: z.string().describe("부서/팀"),
  title: z.string().describe("직함/직급"),
  mobile: z.string().describe("휴대폰 번호, 010-0000-0000 형식"),
  phone: z.string().describe("유선 전화번호, 02-000-0000 형식"),
  fax: z.string().describe("팩스 번호"),
  email: z.string().describe("이메일 주소"),
  website: z.string().describe("홈페이지 주소"),
  address: z.string().describe("주소"),
  country: z.string().describe("국가 (예: 한국, 중국, 인도 — 명함 정보로 판단)"),
  extra: z.string().describe("명함의 부가 정보 — 추가 연락처, 공장/지점 전화, 인증마크 등 메모할 만한 내용"),
  raw_text: z.string().describe("명함에 보이는 전체 텍스트"),
});

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ ok: false, error: "POST only" }, 405);

  let images: { label: string; data: string }[];
  try {
    const body = await req.json();
    images = [];
    if (body.front) images.push({ label: "앞면", data: String(body.front) });
    if (body.back) images.push({ label: "뒷면", data: String(body.back) });
    if (!images.length) return json({ ok: false, error: "no images" }, 400);
  } catch {
    return json({ ok: false, error: "invalid JSON body" }, 400);
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return json({ ok: false, error: "ANTHROPIC_API_KEY not configured" }, 500);

  const client = new Anthropic({ apiKey });
  const model = Deno.env.get("CLAUDE_MODEL") || "claude-opus-5";

  const content: Anthropic.ContentBlockParam[] = [];
  for (const img of images) {
    content.push({ type: "text", text: `명함 ${img.label}:` });
    content.push({
      type: "image",
      source: { type: "base64", media_type: "image/jpeg", data: img.data },
    });
  }
  content.push({
    type: "text",
    text:
      "위 명함 이미지에서 연락처 정보를 추출해줘. (사진이 회전되어 있어도 그대로 읽으면 돼) " +
      "읽을 수 없거나 명함에 없는 항목은 빈 문자열로 둬. " +
      "전화번호는 하이픈(-)으로 구분하고, 한국 번호의 국가번호 +82는 0으로 바꿔줘 (예: +82 31 215 8890 → 031-215-8890). " +
      "라벨 안내: T=대표전화(phone), M/HP=휴대폰(mobile), F=팩스(fax), E=이메일, H/W=홈페이지. " +
      "D(직통)번호는 phone이 비어 있으면 phone에, 아니면 extra에 '직통: 번호'로 적어줘. " +
      "한글 면과 영문 면이 모두 있으면 병합하되 name은 한글, name_en은 로마자로 나눠 적어줘. " +
      "양면의 직함/부서가 서로 다르면 한글 면을 기준으로 하고, 다른 면의 직함은 extra에 적어줘. " +
      "뒷면·로고면에서 얻은 부가정보(직통·공장 전화, 부서 메일, 사업분야 등)는 extra에 정리해줘.",
  });

  try {
    const response = await client.messages.parse({
      model,
      max_tokens: 4096,
      output_config: { format: zodOutputFormat(CardFields), effort: "low" },
      messages: [{ role: "user", content }],
    });

    if (response.stop_reason === "refusal" || !response.parsed_output) {
      return json({ ok: false, error: "model could not read the card" }, 422);
    }
    return json({ ok: true, fields: response.parsed_output, model });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return json({ ok: false, error: msg }, 502);
  }
});

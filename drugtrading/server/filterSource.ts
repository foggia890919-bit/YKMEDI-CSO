import "server-only";
// 단일 원천: 통계제출현황 「필터링」 탭(gid 1969204985)에 직접 읽기/쓰기.
//  - 앱이 쓰는 것은 두 가지뿐: ① 필터링요청 행 append(H 거래가능유무·I 문의처 공란) ② K 히스토리 셀 누적(요청/재요청/OCR 인식 등 참고 메모).
//  - H 거래가능유무·I 문의처·G 제약사검증은 담당자가 시트에서 직접 채운다. 앱은 절대 쓰지 않는다.
//  - 모든 앱 쓰기는 같은 시트 「웹등록로그」 탭(gid 581216062)에 1건 1행으로 감사 기록(로그 실패는 본 쓰기를 막지 않음).
//  - 범위 clear/전체 재기록/정렬/행 삭제 금지. 헤더는 이름으로 찾고, 예상과 다르면 쓰기 중단.
import {
  readAllByGidOf, readAllOf, appendRowOf, appendRowsOf, setCellOf, writeRangeOf, spreadsheetTabs, ensureSheetOf,
} from "@/lib/google";
import { getSetting } from "@/lib/gateway/notify";
import { csoSheetId, vendorList } from "@/lib/gateway/cso";
import { resolveAvailability } from "@/lib/availability";
import { normVendorKey, matchVendorName } from "@/lib/cso/opsSync";
import { notifyFilterResult } from "@/lib/cso/filterNotify";

export const DEFAULT_FILTER_SHEET_ID = "1wRscbgsxW62bwa3E2kopHBAgJIsgJvRzb-lHCk5bHDA";
export const FILTER_GID = 1969204985;   // 「필터링」 탭
export const WEBLOG_GID = 581216062;    // 「웹등록로그」 탭
export const WEBLOG_URL = `https://docs.google.com/spreadsheets/d/${DEFAULT_FILTER_SHEET_ID}/edit?gid=${WEBLOG_GID}`;
// 문자 발송용 이전상태 스냅샷(CSO 시트 내부, 사용자 비노출).
// v2: 구 스냅샷(_필터링스냅샷)은 첫 동기화 때 기준값 없이 과거 확정건 전체를 발송한 이력이 있어 폐기.
//     새 탭은 첫 동기화에서 현재 상태를 "기준값"으로만 기록하고 문자는 보내지 않는다.
const SNAP_TAB = "_필터링스냅샷v2";
const SNAP_HEADER = ["키", "상태", "조회일", "발송일시"];
const NOTIFY_MAX_PER_RUN = 10;          // 1회 동기화 문자 발송 상한(초과분은 스냅샷 미갱신 → 다음 실행에 이어서)

const LOG_HEADER = ["일시", "탭", "행번호", "구분", "거래처명", "사업자번호", "제약사명", "변경열", "이전값", "변경값", "경로", "실행자", "비고"];

const nsp = (s: unknown) => String(s ?? "").replace(/\s/g, "");
const digits = (s: unknown) => String(s ?? "").replace(/\.0+$/, "").replace(/\D/g, "");
const nameKey = (s: unknown) => nsp(s).replace(/\(주\)|주식회사|㈜/g, "").toLowerCase();
const rowKey = (name: unknown, biz: unknown, vendor: unknown) => (digits(biz) || nameKey(name)) + "|" + normVendorKey(vendor);
// 스냅샷 키: 제약사는 G 제약사검증 → 제약사 목록 매칭명 순(동기화·즉시발송·요청이 같은 키를 쓰도록 통일)
const snapKey = (name: unknown, biz: unknown, verified: unknown, vendorRaw: unknown, vlist: string[]) =>
  rowKey(name, biz, String(verified ?? "").trim() || matchVendorName(String(vendorRaw ?? ""), vlist).name);
const p2 = (n: number) => String(n).padStart(2, "0");
const kst = () => new Date(Date.now() + 9 * 3600 * 1000);
const today = () => { const d = kst(); return `${d.getUTCFullYear()}/${p2(d.getUTCMonth() + 1)}/${p2(d.getUTCDate())}`; };
const stamp = () => { const d = kst(); return `${today()} ${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}`; };
const cut = (s: unknown, n = 300) => { const t = String(s ?? ""); return t.length > n ? t.slice(0, n) + "…" : t; };

// 중복 append 방어: 같은 key 30초 스로틀 + 방금 append 한 key 60초 기억(stale 캐시로 인한 재-append 차단).
const THROTTLE_MS = 30000;
const RECENT_APPEND_MS = 60000;
const _throttle = new Map<string, number>();      // key → 마지막 요청 성공 ts(ms)
const _recentAppend = new Map<string, number>();  // key → 방금 새 행 append 한 ts(ms)
function prune(m: Map<string, number>, ttl: number) { const now = Date.now(); for (const [k, ts] of m) if (now - ts > ttl) m.delete(k); }
// 투코드 품목 요약: "694205610 트윈케라정80/5, ..."
function summarizeItems(items?: { code?: string; name?: string; comp?: string }[]): string {
  if (!Array.isArray(items) || !items.length) return "";
  return items
    .map((it) => [String(it?.code ?? "").trim(), String(it?.name ?? "").trim()].filter(Boolean).join(" "))
    .filter(Boolean)
    .join(", ");
}

export async function filterSheetId(): Promise<string> {
  const raw = (await getSetting("CSO_OPS_SOURCE_SHEET_ID").catch(() => "")).trim();
  return raw || DEFAULT_FILTER_SHEET_ID;
}

let _tabs: { at: number; sid: string; list: { title: string; gid: number }[] } | null = null;
async function titleByGid(sid: string, gid: number): Promise<string> {
  if (!_tabs || _tabs.sid !== sid || Date.now() - _tabs.at > 300000) {
    _tabs = { at: Date.now(), sid, list: (await spreadsheetTabs(sid)).map((t) => ({ title: t.title, gid: t.gid })) };
  }
  const hit = _tabs.list.find((t) => t.gid === gid);
  if (!hit) throw new Error(`시트에서 탭(gid ${gid})을 찾지 못했습니다 — 서비스계정 편집 권한 및 탭 존재를 확인하세요.`);
  return hit.title;
}

export type FilterCols = { category: number; date: number; requester: number; name: number; biz: number; vendor: number; verified: number; status: number; inquiry: number; note: number; history: number };
function colsOf(headerRow: string[]): FilterCols {
  const H = (headerRow || []).map(nsp);
  const f = (...names: string[]) => { for (let i = 0; i < H.length; i++) for (const n of names) if (H[i].includes(n)) return i; return -1; };
  const vendor = (() => { for (let i = 0; i < H.length; i++) if (H[i].includes("제약사") && !H[i].includes("검증")) return i; return -1; })();
  const verified = (() => { for (let i = 0; i < H.length; i++) if (H[i].includes("제약사검증") || H[i] === "검증") return i; return -1; })();
  return { category: f("분류"), date: f("조회일"), requester: f("요청자"), name: f("거래처"), biz: f("사업자"), vendor, verified, status: f("거래가능"), inquiry: f("문의처", "제출처"), note: f("특이사항"), history: f("히스토리", "이력") };
}

type FilterRead = { title: string; values: string[][]; hi: number; cols: FilterCols };
let _fc: { at: number; data: FilterRead } | null = null;

// 살아있는 행(자동정리된 「중복…」 분류 제외)
function isLiveRow(r: string[], c: FilterCols): boolean {
  const cat = c.category >= 0 ? String(r[c.category] ?? "").trim() : "";
  return !cat.startsWith("중복");
}
// 같은 거래처×제약사 판정: 사업자번호(없으면 거래처명) + 제약사는 원문 키·G 검증명·목록 매칭명 중 하나라도 일치하면 같은 건.
//   ("동구바이오" 와 "동구바이오제약" 처럼 표기만 다른 입력이 새 행(중복)으로 갈라지지 않게)
function sameVendorRow(r: string[], c: FilterCols, key: string, keyCanon: string, vlist: string[]): boolean {
  const rn = String(r[c.name] ?? "").trim(), rv = c.vendor >= 0 ? String(r[c.vendor] ?? "").trim() : "";
  if (!rn || !rv) return false;
  const biz = c.biz >= 0 ? r[c.biz] : "";
  if (rowKey(rn, biz, rv) === key) return true;
  const rg = c.verified >= 0 ? String(r[c.verified] ?? "").trim() : "";
  if (rg && rowKey(rn, biz, rg) === keyCanon) return true;
  const mv = matchVendorName(rv, vlist);
  return mv.matched && rowKey(rn, biz, mv.name) === keyCanon;
}
const canonKey = (name: string, bizNo: string, vendor: string, vlist: string[]) => rowKey(name, bizNo, matchVendorName(vendor, vlist).name);
export async function readFilter(force = false): Promise<FilterRead> {
  if (!force && _fc && Date.now() - _fc.at < 60000) return _fc.data;
  const sid = await filterSheetId();
  const title = await titleByGid(sid, FILTER_GID);
  const values = await readAllByGidOf(sid, FILTER_GID);
  let hi = -1;
  for (let i = 0; i < Math.min(values.length, 15); i++) {
    const row = (values[i] || []).map(nsp);
    if (row.some((c) => c.includes("거래처")) && row.some((c) => c.includes("거래가능"))) { hi = i; break; }
  }
  if (hi < 0) throw new Error("「필터링」 탭에서 헤더(거래처/거래가능)를 찾지 못했습니다 — 시트 구조를 확인하세요.");
  const data: FilterRead = { title, values, hi, cols: colsOf(values[hi]) };
  _fc = { at: Date.now(), data };
  return data;
}

// 배지·포털 화면용 항목. H 거래가능유무 원문(raw)·문의처(sub)·정규화 제약사명을 그대로 내려준다.
export type FilterItem = { row: number; category: string; date: string; requester: string; name: string; bizNo: string; vendor: string; vendorRaw: string; status: string; sub: string; note: string; history: string; kind: string; requested: boolean };
// 기본은 같은 거래처×제약사를 1건으로 합쳐 준다(가장 아래(최신) 행 우선, 단 결과(O/X)가 있는 행이 공란 행보다 우선).
//   raw:true 면 합치지 않고 시트 행 그대로(관리자 중복정리·행 단위 조작용).
export async function readFilterItems(opts: { raw?: boolean } = {}): Promise<FilterItem[]> {
  const f = await readFilter();
  const c = f.cols;
  const vlist = await vendorList().catch(() => [] as string[]);
  const out: FilterItem[] = [];
  for (let i = f.hi + 1; i < f.values.length; i++) {
    const r = f.values[i] || [];
    const category = c.category >= 0 ? String(r[c.category] ?? "").trim() : "필터링";
    if (category.startsWith("중복")) continue; // 자동정리된 중복 행은 화면·배지에서 무시
    const name = c.name >= 0 ? String(r[c.name] ?? "").trim() : "";
    const vendorRaw = c.vendor >= 0 ? String(r[c.vendor] ?? "").trim() : "";
    if (!name || !vendorRaw) continue; // 2행 범례·빈행 보호
    const raw = c.status >= 0 ? String(r[c.status] ?? "").trim() : "";
    const inquiryRaw = c.inquiry >= 0 ? String(r[c.inquiry] ?? "").trim() : "";
    // 판정 우선순위 H > I(문의처) > 공란
    const res = resolveAvailability(raw, inquiryRaw);
    const kind = res.kind;
    const status = res.status;
    const verified = c.verified >= 0 ? String(r[c.verified] ?? "").trim() : "";
    const vendor = verified || matchVendorName(vendorRaw, vlist).name;
    const sub = inquiryRaw || res.sub; // 기존 sub=I 원문 유지(ok 판정이 I 에서 왔어도 I)
    const note = c.note >= 0 ? String(r[c.note] ?? "").trim() : "";
    const history = c.history >= 0 ? String(r[c.history] ?? "").trim() : "";
    // 요청됨(회신대기): 미필터링인데 히스토리에 요청/재요청 기록이 있으면 true
    const requested = kind === "unfiltered" && /재?요청/.test(history);
    out.push({ row: i + 1, category, date: c.date >= 0 ? String(r[c.date] ?? "").trim() : "", requester: c.requester >= 0 ? String(r[c.requester] ?? "").trim() : "", name, bizNo: c.biz >= 0 ? digits(r[c.biz]) : "", vendor, vendorRaw, status, sub, note, history, kind, requested });
  }
  if (opts.raw) return out;
  return collapseFilterItems(out);
}
/** 같은 거래처×제약사(사업자번호 또는 거래처명 + 매칭 제약사명)를 1건으로: 결과 있는 행 > 공란 행, 같은 급이면 아래(최신) 행. */
export function collapseFilterItems(items: FilterItem[]): FilterItem[] {
  const keep = new Map<string, FilterItem>();
  const hasRes = (it: FilterItem) => it.kind === "ok" || it.kind === "no";
  for (const it of items) {
    const k = rowKey(it.name, it.bizNo, it.vendor);
    const prev = keep.get(k);
    if (!prev || hasRes(it) || !hasRes(prev)) keep.set(k, it);
  }
  const kept = new Set(keep.values());
  return items.filter((it) => kept.has(it));
}

// ---- 웹등록로그 ----
let _logReady = false;
async function safeLog(e: { rowNo: number | string; kind: string; name?: string; biz?: string; vendor?: string; changed?: string; before?: string; after?: string; path?: string; actor?: string; memo?: string }): Promise<void> {
  try {
    const sid = await filterSheetId();
    const title = await titleByGid(sid, WEBLOG_GID);
    if (!_logReady) {
      const vals = await readAllByGidOf(sid, WEBLOG_GID);
      const row1 = (vals[0] || []).map((x) => String(x).trim());
      if (row1.join("") === "" || !row1.includes("일시")) await writeRangeOf(sid, title, 1, 1, [LOG_HEADER]);
      _logReady = true;
    }
    await appendRowOf(sid, title, [stamp(), "필터링", String(e.rowNo ?? ""), e.kind, e.name || "", e.biz || "", e.vendor || "", e.changed || "", cut(e.before), cut(e.after), e.path || "", e.actor || "시스템", e.memo || ""]);
  } catch { /* 로그 실패는 본 쓰기를 막지 않음 */ }
}

function ensureWritable(f: FilterRead): void {
  const c = f.cols;
  if (c.name < 0 || c.vendor < 0 || c.status < 0 || c.history < 0) throw new Error("「필터링」 탭 헤더가 예상과 달라(거래처명/제약사명/거래가능유무/히스토리) 쓰기를 중단했습니다.");
}

// ① 필터링요청 행 append. 같은 거래처×제약사에 이미 미필터링(H 공란) 행이 있으면 새 행 대신 그 행 히스토리에 "재요청" 누적.
export type TwoCodeItem = { code?: string; name?: string; comp?: string };
export type RequestInput = { requester?: string; name: string; bizNo?: string; vendor: string; note?: string; path?: string; actor?: string; category?: string; items?: TwoCodeItem[] };
export async function appendFilterRequest(inp: RequestInput): Promise<{ ok: boolean; row: number; deduped: boolean; throttled: boolean }> {
  const path = inp.path || "포털요청";
  const actor = inp.actor || "시스템";
  const requester = String(inp.requester || "").trim();
  const name = String(inp.name || "").trim();
  const bizNo = digits(inp.bizNo);
  const vendor = String(inp.vendor || "").trim();
  const note = String(inp.note || "").trim();
  const category = String(inp.category || "").trim() || "필터링"; // 필터링/투코드/재조회 (그대로 기록)
  const itemsSummary = summarizeItems(inp.items);           // "694205610 트윈케라정80/5, ..."
  const itemsTag = itemsSummary ? ` · 투코드 ${(inp.items || []).length}품목` : "";
  const key = rowKey(name, bizNo, vendor);
  const ts = stamp();
  const vlist = await vendorList().catch(() => [] as string[]);
  const keyCanon = canonKey(name, bizNo, vendor, vlist);
  // 30초 스로틀: 같은 key 재요청이면 시트를 전혀 건드리지 않음
  const last = _throttle.get(key);
  if (last && Date.now() - last < THROTTLE_MS) return { ok: true, row: -1, deduped: true, throttled: true };
  let f: FilterRead;
  try { f = await readFilter(false); ensureWritable(f); } // 캐시 우선(60초 _fc)
  catch (e: any) { await safeLog({ rowNo: "", kind: "실패", name, biz: bizNo, vendor, changed: "헤더", after: "요청추가 시도", path, actor, memo: String(e?.message || e) }); throw e; }
  const c = f.cols;
  // dedup: 같은 키 중 H 공란(미필터링) 행. 중복 자동정리된 행은 건너뜀.
  for (let i = f.hi + 1; i < f.values.length; i++) {
    const r = f.values[i] || [];
    const rcat = c.category >= 0 ? String(r[c.category] ?? "").trim() : "";
    if (rcat.startsWith("중복")) continue;
    const rn = String(r[c.name] ?? "").trim(), rv = c.vendor >= 0 ? String(r[c.vendor] ?? "").trim() : "";
    if (!rn || !rv) continue;
    if (!sameVendorRow(r, c, key, keyCanon, vlist)) continue;
    const h = c.status >= 0 ? String(r[c.status] ?? "").trim() : "";
    const hk = resolveAvailability(h, c.inquiry >= 0 ? String(r[c.inquiry] ?? "") : "").kind;
    if (hk === "ok" || hk === "no") {
      // 이미 결과가 있는 행(1거래처×1제약사 = 1행 원칙): 새 행을 만들지 않는다.
      //   재조회 → H 를 비워 재확인 대기로 되돌리고 히스토리에 이전 결과를 남김. 그 외 요청 → 결과 유지(요청 생략 로그만).
      const before = c.history >= 0 ? String(r[c.history] ?? "") : "";
      if (category === "재조회") {
        const memo = `${ts} 재조회 요청(이전 결과 ${h || hk})${itemsTag} · 경로:${path}(${requester || actor})`;
        try {
          await setCellOf(await filterSheetId(), f.title, i + 1, c.status + 1, "");
          if (c.history >= 0) await setCellOf(await filterSheetId(), f.title, i + 1, c.history + 1, before ? before + " / " + memo : memo);
        } catch (e: any) { await safeLog({ rowNo: i + 1, kind: "실패", name, biz: bizNo, vendor, changed: "거래가능유무", before: h, after: "", path, actor, memo: String(e?.message || e) + " — 시트 편집 권한 필요" }); throw e; }
        _fc = null;
        _throttle.set(key, Date.now());
        await safeLog({ rowNo: i + 1, kind: "재조회", name, biz: bizNo, vendor, changed: "거래가능유무·히스토리", before: h, after: "", path, actor, memo });
        return { ok: true, row: i + 1, deduped: true, throttled: false };
      }
      _throttle.set(key, Date.now());
      await safeLog({ rowNo: i + 1, kind: "요청생략", name, biz: bizNo, vendor, changed: "", before: h, after: h, path, actor, memo: "이미 결과가 있어 새 요청 행을 만들지 않음" });
      return { ok: true, row: i + 1, deduped: true, throttled: false };
    }
    {
      const before = c.history >= 0 ? String(r[c.history] ?? "") : "";
      const reqTag = itemsSummary ? `재요청(투코드 ${(inp.items || []).length}품목: ${itemsSummary})` : "재요청";
      const memo = `${ts} ${reqTag} · 경로:${path}(${requester || actor})`;
      const next = before ? before + " / " + memo : memo;
      try { await setCellOf(await filterSheetId(), f.title, i + 1, c.history + 1, next); } // A 분류는 덮어쓰지 않음
      catch (e: any) { await safeLog({ rowNo: i + 1, kind: "실패", name, biz: bizNo, vendor, changed: "히스토리", before, after: memo, path, actor, memo: String(e?.message || e) + " — 시트 편집 권한 필요 여부 확인" }); throw e; }
      _fc = null;
      _throttle.set(key, Date.now());
      await safeLog({ rowNo: i + 1, kind: "재요청", name, biz: bizNo, vendor, changed: "히스토리", before, after: memo, path, actor });
      return { ok: true, row: i + 1, deduped: true, throttled: false };
    }
  }
  // stale 캐시 방어: 방금 새 행 append 한 key 면 재-append 하지 않고 스로틀 취급
  prune(_recentAppend, RECENT_APPEND_MS);
  const recent = _recentAppend.get(key);
  if (recent && Date.now() - recent < RECENT_APPEND_MS) return { ok: true, row: -1, deduped: true, throttled: true };
  // 새 행 append
  const mv = matchVendorName(vendor, vlist);
  const width = Math.max((f.values[f.hi] || []).length, c.history + 1);
  const line = new Array(width).fill("");
  const set = (idx: number, val: string) => { if (idx >= 0) line[idx] = val; };
  const noteCell = c.note >= 0 && itemsSummary ? [note, `투코드 품목: ${itemsSummary}`].filter(Boolean).join(" / ") : note;
  set(c.category, category); set(c.date, today()); set(c.requester, requester); set(c.name, name); set(c.biz, bizNo);
  set(c.vendor, vendor); set(c.verified, mv.matched ? mv.name : ""); set(c.status, ""); set(c.inquiry, "");
  set(c.note, noteCell); set(c.history, `${ts} 요청${itemsTag} · 경로:${path}(${requester || actor})`);
  const sid = await filterSheetId();
  try { await appendRowOf(sid, f.title, line); }
  catch (e: any) { await safeLog({ rowNo: "", kind: "실패", name, biz: bizNo, vendor, changed: "행 전체", after: "필터링요청", path, actor, memo: String(e?.message || e) + " — 시트 편집 권한 필요" }); throw e; }
  const newRow = f.values.length + 1;
  _fc = null;
  _throttle.set(key, Date.now());
  _recentAppend.set(key, Date.now());
  // 스냅샷에 "대기"로 등록 → 이후 H/I 가 O/X 로 채워지면 동기화가 요청자에게 1회 발송
  await upsertSnapshot(snapKey(name, bizNo, mv.matched ? mv.name : "", vendor, vlist), "");
  await safeLog({ rowNo: newRow, kind: "요청추가", name, biz: bizNo, vendor, changed: "행 전체", after: `${category}요청 ${vendor}${mv.matched ? `(검증 ${mv.name})` : "(미검증)"}${itemsTag}`, path, actor });
  return { ok: true, row: newRow, deduped: false, throttled: false };
}

// ② K 히스토리 참고 메모 누적(이미지입력 OCR·회신입력·엑셀반영). H/I 는 건드리지 않는다. 해당 행이 없으면 no-op.
export type HistoryMemoInput = { name: string; bizNo?: string; vendor: string; memo: string; path?: string; actor?: string };
export async function appendFilterHistory(inp: HistoryMemoInput): Promise<{ ok: boolean; row: number; found: boolean }> {
  const path = inp.path || "회신입력";
  const actor = inp.actor || "시스템";
  const name = String(inp.name || "").trim();
  const bizNo = digits(inp.bizNo);
  const vendor = String(inp.vendor || "").trim();
  const memo = String(inp.memo || "").trim();
  const f = await readFilter(true);
  const c = f.cols;
  if (c.history < 0) throw new Error("「필터링」 탭에 히스토리 열이 없어 메모를 남길 수 없습니다.");
  const key = rowKey(name, bizNo, vendor);
  for (let i = f.hi + 1; i < f.values.length; i++) {
    const r = f.values[i] || [];
    const rn = String(r[c.name] ?? "").trim(), rv = c.vendor >= 0 ? String(r[c.vendor] ?? "").trim() : "";
    if (!rn || !rv) continue;
    if (rowKey(rn, c.biz >= 0 ? r[c.biz] : "", rv) !== key) continue;
    const before = String(r[c.history] ?? "");
    const line = `${stamp()} ${memo} · 경로:${path}(${actor})`;
    const next = before ? before + " / " + line : line;
    await setCellOf(await filterSheetId(), f.title, i + 1, c.history + 1, next);
    _fc = null;
    await safeLog({ rowNo: i + 1, kind: "셀수정", name, biz: bizNo, vendor, changed: "히스토리", before, after: line, path, actor });
    return { ok: true, row: i + 1, found: true };
  }
  return { ok: false, row: -1, found: false };
}

// 문자 재발송 방지용 스냅샷 upsert(즉시 발송 후 호출해 30분 동기화가 같은 결과를 재발송하지 않게).
async function upsertSnapshot(key: string, status: string): Promise<void> {
  try {
    const csid = await csoSheetId();
    await ensureSheetOf(csid, SNAP_TAB, SNAP_HEADER);
    const vals = await readAllOf(csid, SNAP_TAB);
    for (let i = 1; i < vals.length; i++) { if (String((vals[i] || [])[0]) === key) { await setCellOf(csid, SNAP_TAB, i + 1, 2, status); return; } }
    await appendRowOf(csid, SNAP_TAB, [key, status, today(), ""]);
  } catch { /* 스냅샷 실패는 무시 */ }
}

// ③ 웹 입력 결과 반영(이미지 OCR·회신 입력·엑셀 반영): 해당 행 H 거래가능유무(O/X)·I 문의처·J 특이사항 update + K 히스토리 누적. 행 없으면 append. 쓰기 직후 문자 1회.
export type ResultInput = { name: string; bizNo?: string; vendor: string; kind: "ok" | "no"; sub?: string; note?: string; path?: string; actor?: string; notify?: boolean };
export async function applyFilterResult(inp: ResultInput): Promise<{ ok: boolean; row: number; found: boolean; notified: boolean }> {
  const path = inp.path || "회신입력";
  const actor = inp.actor || "시스템";
  const name = String(inp.name || "").trim();
  const bizNo = digits(inp.bizNo);
  const vendor = String(inp.vendor || "").trim();
  const sub = String(inp.sub || "").trim();
  const note = String(inp.note || "").trim();
  const OX = inp.kind === "no" ? "X" : "O";
  const label = inp.kind === "no" ? "거래불가" : "거래가능";
  let f: FilterRead;
  try { f = await readFilter(true); ensureWritable(f); }
  catch (e: any) { await safeLog({ rowNo: "", kind: "실패", name, biz: bizNo, vendor, changed: "거래가능유무", after: OX, path, actor, memo: String(e?.message || e) }); throw e; }
  const c = f.cols;
  const sid = await filterSheetId();
  const ts = stamp();
  const key = rowKey(name, bizNo, vendor);
  const vlist = await vendorList().catch(() => [] as string[]);
  const doNotify = inp.notify !== false;
  // 같은 거래처×제약사 행을 모두 찾아 가장 아래(최신) 행에 기록하고, 나머지는 「중복(자동정리)」로 접는다 → 1건 1행.
  const keyCanon = canonKey(name, bizNo, vendor, vlist);
  const hits: number[] = [];
  for (let i = f.hi + 1; i < f.values.length; i++) { const r = f.values[i] || []; if (isLiveRow(r, c) && sameVendorRow(r, c, key, keyCanon, vlist)) hits.push(i); }
  for (const i of hits.slice(-1)) {
    const r = f.values[i] || [];
    const beforeH = c.status >= 0 ? String(r[c.status] ?? "").trim() : "";
    try {
      if (c.status >= 0 && beforeH !== OX) await setCellOf(sid, f.title, i + 1, c.status + 1, OX);
      if (c.inquiry >= 0 && sub) await setCellOf(sid, f.title, i + 1, c.inquiry + 1, sub);
      if (c.note >= 0 && note) await setCellOf(sid, f.title, i + 1, c.note + 1, note);
      const beforeK = c.history >= 0 ? String(r[c.history] ?? "") : "";
      const chg = beforeH && beforeH !== OX ? ` (이전 ${beforeH} → ${OX})` : "";
      const memoLine = `${ts} 결과:${OX}${sub ? `(제출처 ${sub})` : ""}${chg} · 경로:${path}(${actor})`;
      if (c.history >= 0) await setCellOf(sid, f.title, i + 1, c.history + 1, beforeK ? beforeK + " / " + memoLine : memoLine);
    } catch (e: any) {
      await safeLog({ rowNo: i + 1, kind: "실패", name, biz: bizNo, vendor, changed: "거래가능유무", before: beforeH, after: OX, path, actor, memo: String(e?.message || e) + " — 시트 편집 권한 필요" });
      throw e;
    }
    _fc = null;
    await safeLog({ rowNo: i + 1, kind: "결과반영", name, biz: bizNo, vendor, changed: "거래가능유무" + (sub ? "·문의처" : ""), before: beforeH, after: OX, path, actor, memo: note });
    let notified = false;
    if (doNotify && beforeH !== OX) {
      try { const requester = c.requester >= 0 ? String(r[c.requester] ?? "").trim() : ""; const rr = await notifyFilterResult({ row: i + 1, category: "필터링", date: "", requester, name, bizNo, vendor, status: label, note: sub ? `제출처 ${sub}` : "" }, label, OX); notified = !!(rr && rr.notified); } catch { /* 발송 실패 무시 */ }
    }
    await upsertSnapshot(snapKey(name, bizNo, c.verified >= 0 ? r[c.verified] : "", vendor, vlist), OX);
    await foldDuplicates(f, hits.slice(0, -1), i + 1, path, actor);
    return { ok: true, row: i + 1, found: true, notified };
  }
  // 행 없음 → append
  const mv = matchVendorName(vendor, vlist);
  const width = Math.max((f.values[f.hi] || []).length, c.history + 1);
  const line = new Array(width).fill("");
  const set = (idx: number, val: string) => { if (idx >= 0) line[idx] = val; };
  set(c.category, "필터링"); set(c.date, today()); set(c.name, name); set(c.biz, bizNo); set(c.vendor, vendor);
  set(c.verified, mv.matched ? mv.name : ""); set(c.status, OX); set(c.inquiry, sub); set(c.note, note);
  set(c.history, `${ts} 결과:${OX}${sub ? `(제출처 ${sub})` : ""} · 경로:${path}(${actor})`);
  try { await appendRowOf(sid, f.title, line); }
  catch (e: any) { await safeLog({ rowNo: "", kind: "실패", name, biz: bizNo, vendor, changed: "행 전체", after: `결과 ${OX}`, path, actor, memo: String(e?.message || e) + " — 시트 편집 권한 필요" }); throw e; }
  const newRow = f.values.length + 1;
  _fc = null;
  await safeLog({ rowNo: newRow, kind: "결과반영", name, biz: bizNo, vendor, changed: "행 전체", after: `결과 ${OX}`, path, actor, memo: "행 없어 신규 추가" });
  let notified = false;
  if (doNotify) { try { const rr = await notifyFilterResult({ row: newRow, category: "필터링", date: today(), requester: "", name, bizNo, vendor, status: label, note: sub ? `제출처 ${sub}` : "" }, label, OX); notified = !!(rr && rr.notified); } catch { /* 무시 */ } }
  await upsertSnapshot(snapKey(name, bizNo, mv.matched ? mv.name : "", vendor, vlist), OX);
  return { ok: true, row: newRow, found: false, notified };
}

// ---- 30분 동기화: 스냅샷 "대기" → O/X 로 바뀐 건만 요청자에게 1회 문자 발송 ----
// 안전장치
//  1) 스냅샷에 없는 키(처음 보는 건·과거 확정건)는 상태를 기준값으로만 기록하고 절대 발송하지 않는다.
//  2) 발송 대상은 스냅샷을 먼저 갱신한 뒤 발송(중간에 시간초과로 끊겨도 재발송 없음).
//  3) 1회 최대 NOTIFY_MAX_PER_RUN 건. 초과분은 스냅샷을 그대로 두어 다음 실행에 발송.
//  4) 설정 FILTER_NOTIFY_OFF=1 이면 스냅샷만 갱신하고 문자는 보내지 않는다(그 사이 확정건은 발송 생략).
//  같은 키(거래처×제약사) 행이 여러 개면 가장 아래(최신) 행만 본다.
export type FilterSyncResult = { ok: boolean; at: string; scanned: number; changed: number; notified: number; baselined?: number; deferred?: number; muted?: boolean; error?: string };
let _lastSync: { at: number; result: FilterSyncResult } | null = null;
let _syncing: Promise<FilterSyncResult> | null = null;
export function lastFilterSync(): FilterSyncResult | null { return _lastSync ? _lastSync.result : null; }
export async function syncFilterNotify(opts: { minIntervalMs?: number } = {}): Promise<FilterSyncResult> {
  if (opts.minIntervalMs && _lastSync && Date.now() - _lastSync.at < opts.minIntervalMs) return { ..._lastSync.result };
  if (_syncing) return _syncing;
  _syncing = doSyncNotify().then((r) => { _lastSync = { at: Date.now(), result: r }; return r; }).finally(() => { _syncing = null; });
  return _syncing;
}
const isOn = (v: string) => /^(1|y|yes|true|on|o|중지)$/i.test(String(v || "").trim());
async function doSyncNotify(): Promise<FilterSyncResult> {
  const at = stamp();
  try {
    const muted = isOn(await getSetting("FILTER_NOTIFY_OFF").catch(() => ""));
    const f = await readFilter(true);
    const c = f.cols;
    const vlist = await vendorList().catch(() => [] as string[]);
    const csid = await csoSheetId();
    await ensureSheetOf(csid, SNAP_TAB, SNAP_HEADER);
    const snapVals = await readAllOf(csid, SNAP_TAB);
    const snap = new Map<string, { status: string; row: number }>();
    for (let i = 1; i < snapVals.length; i++) { const r = snapVals[i] || []; if (r[0]) snap.set(String(r[0]), { status: String(r[1] ?? ""), row: i + 1 }); }

    // 키별 최신(가장 아래) 행만 추림
    type Cur = { row: number; key: string; name: string; biz: string; vendor: string; requester: string; date: string; state: string; kind: string; sub: string };
    const latest = new Map<string, Cur>();
    let scanned = 0;
    for (let i = f.hi + 1; i < f.values.length; i++) {
      const r = f.values[i] || [];
      const rcat = c.category >= 0 ? String(r[c.category] ?? "").trim() : "";
      if (rcat.startsWith("중복")) continue; // 자동정리된 중복 행 무시
      const name = c.name >= 0 ? String(r[c.name] ?? "").trim() : "";
      const vraw = c.vendor >= 0 ? String(r[c.vendor] ?? "").trim() : "";
      if (!name || !vraw) continue;
      scanned++;
      const biz = c.biz >= 0 ? digits(r[c.biz]) : "";
      const verified = c.verified >= 0 ? String(r[c.verified] ?? "").trim() : "";
      const vendor = verified || matchVendorName(vraw, vlist).name;
      const H = c.status >= 0 ? String(r[c.status] ?? "").trim() : "";
      const I = c.inquiry >= 0 ? String(r[c.inquiry] ?? "").trim() : "";
      // 판정 우선순위 H > I(문의처) > 공란. H 공란이어도 I 로 ok/no 가 확정되면 "확정 상태"로 취급.
      const res = resolveAvailability(H, I);
      const state = res.kind === "ok" ? "O" : res.kind === "no" ? "X" : res.kind === "pending" ? (H || res.status) : "";
      const key = snapKey(name, biz, verified, vraw, vlist);
      latest.set(key, {
        row: i + 1, key, name, biz, vendor, state, kind: res.kind, sub: res.sub || "",
        requester: c.requester >= 0 ? String(r[c.requester] ?? "").trim() : "",
        date: c.date >= 0 ? String(r[c.date] ?? "") : "",
      });
    }

    const toAppend: string[][] = [];
    let changed = 0, notified = 0, baselined = 0, deferred = 0, sent = 0;
    for (const cur of latest.values()) {
      const s0 = snap.get(cur.key);
      if (!s0) { toAppend.push([cur.key, cur.state, cur.date, ""]); baselined++; continue; } // 기준값만 기록, 발송 없음
      if (s0.status === cur.state) continue;
      changed++;
      const wasOpen = s0.status !== "O" && s0.status !== "X";   // 대기(공란/회신전 등)
      const nowDone = cur.state === "O" || cur.state === "X";
      if (!muted && wasOpen && nowDone) {
        if (sent >= NOTIFY_MAX_PER_RUN) { deferred++; continue; } // 스냅샷 유지 → 다음 실행에 발송
        sent++;
        await setCellOf(csid, SNAP_TAB, s0.row, 2, cur.state);  // 먼저 기록(재발송 방지)
        await setCellOf(csid, SNAP_TAB, s0.row, 4, stamp()).catch(() => {});
        try {
          const label = cur.kind === "ok" ? "거래가능" : "거래불가";
          const rr = await notifyFilterResult({ row: cur.row, category: "필터링", date: cur.date, requester: cur.requester, name: cur.name, bizNo: cur.biz, vendor: cur.vendor, status: label, note: cur.sub ? `제출처 ${cur.sub}` : "" }, label, cur.state);
          if (rr && rr.notified) notified++;
        } catch { /* 발송 실패 무시 */ }
      } else {
        await setCellOf(csid, SNAP_TAB, s0.row, 2, cur.state);
      }
    }
    if (toAppend.length) await appendRowsOf(csid, SNAP_TAB, toAppend);
    return { ok: true, at, scanned, changed, notified, baselined, deferred, muted };
  } catch (e: any) {
    return { ok: false, at, scanned: 0, changed: 0, notified: 0, error: String(e?.message || e) };
  }
}

// 같은 건의 나머지 행을 「중복(자동정리)」로 접기(행 삭제 없음). keepRow = 대표(최신) 행 번호.
async function foldDuplicates(f: FilterRead, idxs: number[], keepRow: number, path: string, actor: string): Promise<number> {
  if (!idxs.length) return 0;
  const c = f.cols;
  const sid = await filterSheetId();
  let n = 0;
  for (const j of idxs) {
    const r = f.values[j] || [];
    try {
      if (c.category >= 0) await setCellOf(sid, f.title, j + 1, c.category + 1, "중복(자동정리)");
      if (c.history >= 0) {
        const before = String(r[c.history] ?? "");
        const memo = `${stamp()} 중복 자동정리(대표 ${keepRow}행에 통합) · 경로:${path}(${actor})`;
        await setCellOf(sid, f.title, j + 1, c.history + 1, before ? before + " / " + memo : memo);
      }
      await safeLog({ rowNo: j + 1, kind: "중복정리", name: String(r[c.name] ?? ""), vendor: c.vendor >= 0 ? String(r[c.vendor] ?? "") : "", changed: "분류", after: "중복(자동정리)", path, actor, memo: `대표 ${keepRow}행` });
      n++;
    } catch { /* 접기 실패는 본 기록에 영향 없음 */ }
  }
  if (n) _fc = null;
  return n;
}

// ④ 결과 되돌리기(가능/불가 → 확인중): H 거래가능유무를 비우고 K 히스토리에 남김. 행 번호 또는 거래처×제약사로 지정.
export type ClearInput = { row?: number; name?: string; bizNo?: string; vendor?: string; path?: string; actor?: string; memo?: string };
export async function clearFilterResult(inp: ClearInput): Promise<{ ok: boolean; row: number; found: boolean; before: string }> {
  const path = inp.path || "회신입력";
  const actor = inp.actor || "시스템";
  const f = await readFilter(true);
  const c = f.cols;
  ensureWritable(f);
  const sid = await filterSheetId();
  let idx = -1;
  if (inp.row && inp.row > f.hi + 1) idx = inp.row - 1;
  else {
    const name = String(inp.name || "").trim(), bizNo = digits(inp.bizNo), vendor = String(inp.vendor || "").trim();
    const vlist = await vendorList().catch(() => [] as string[]);
    const key = rowKey(name, bizNo, vendor), keyCanon = canonKey(name, bizNo, vendor, vlist);
    for (let i = f.hi + 1; i < f.values.length; i++) { const r = f.values[i] || []; if (isLiveRow(r, c) && sameVendorRow(r, c, key, keyCanon, vlist)) idx = i; } // 가장 아래(최신) 행
  }
  if (idx < 0) return { ok: false, row: -1, found: false, before: "" };
  const r = f.values[idx] || [];
  const name = String(r[c.name] ?? "").trim(), vendor = c.vendor >= 0 ? String(r[c.vendor] ?? "").trim() : "", biz = c.biz >= 0 ? digits(r[c.biz]) : "";
  const before = String(r[c.status] ?? "").trim();
  const memo = `${stamp()} 결과 ${before || "(공란)"} → 공란(확인중)${inp.memo ? " " + inp.memo : ""} · 경로:${path}(${actor})`;
  try {
    if (before) await setCellOf(sid, f.title, idx + 1, c.status + 1, "");
    const hb = c.history >= 0 ? String(r[c.history] ?? "") : "";
    if (c.history >= 0) await setCellOf(sid, f.title, idx + 1, c.history + 1, hb ? hb + " / " + memo : memo);
  } catch (e: any) { await safeLog({ rowNo: idx + 1, kind: "실패", name, biz, vendor, changed: "거래가능유무", before, after: "", path, actor, memo: String(e?.message || e) + " — 시트 편집 권한 필요" }); throw e; }
  _fc = null;
  await safeLog({ rowNo: idx + 1, kind: "결과취소", name, biz, vendor, changed: "거래가능유무", before, after: "", path, actor, memo: inp.memo || "" });
  try { const vlist = await vendorList().catch(() => [] as string[]); await upsertSnapshot(snapKey(name, biz, c.verified >= 0 ? r[c.verified] : "", vendor, vlist), ""); } catch { /* 무시 */ }
  return { ok: true, row: idx + 1, found: true, before };
}

// ---- 관리자: 필터링요청 중복행 자동정리 ----
// 같은 사업자번호(digits)+제약사(normVendorKey)+H 공란+같은 조회일 인 행이 2행 이상이면 중복 그룹.
// 각 그룹에서 첫 행(가장 위)만 남기고 나머지 행의 A 분류를 "중복(자동정리)" 로 마킹 + K 히스토리 누적.
// 원본 행 삭제 절대 금지 — 분류 마킹만. dry=true 면 조회만.
export type DedupeGroup = { key: string; keep: number; remove: number[]; name: string; vendor: string; date: string };
export async function dedupeFilterRequests(dry: boolean, actor: string): Promise<{ ok: boolean; dry: boolean; groups: DedupeGroup[]; removed: number }> {
  const f = await readFilter(true);
  const c = f.cols;
  const sid = await filterSheetId();
  const groups = new Map<string, { row: number; name: string; vendorRaw: string; date: string }[]>();
  for (let i = f.hi + 1; i < f.values.length; i++) {
    const r = f.values[i] || [];
    const cat = c.category >= 0 ? String(r[c.category] ?? "").trim() : "";
    if (cat.startsWith("중복")) continue; // 이미 정리된 행 제외
    const name = c.name >= 0 ? String(r[c.name] ?? "").trim() : "";
    const vraw = c.vendor >= 0 ? String(r[c.vendor] ?? "").trim() : "";
    if (!name || !vraw) continue;
    const h = c.status >= 0 ? String(r[c.status] ?? "").trim() : "";
    if (h) continue; // H 값 있으면 확정 → 중복 대상 아님
    const biz = c.biz >= 0 ? digits(r[c.biz]) : "";
    const date = c.date >= 0 ? String(r[c.date] ?? "").trim() : "";
    const key = (biz || nameKey(name)) + "|" + normVendorKey(vraw) + "|" + date;
    const arr = groups.get(key) || [];
    arr.push({ row: i + 1, name, vendorRaw: vraw, date });
    groups.set(key, arr);
  }
  const out: DedupeGroup[] = [];
  let removed = 0;
  for (const [key, rows] of groups) {
    if (rows.length < 2) continue;
    rows.sort((a, b) => a.row - b.row);
    const keep = rows[0];
    const rem = rows.slice(1);
    out.push({ key, keep: keep.row, remove: rem.map((x) => x.row), name: keep.name, vendor: keep.vendorRaw, date: keep.date });
    if (dry) { removed += rem.length; continue; }
    for (const t of rem) {
      try {
        if (c.category >= 0) await setCellOf(sid, f.title, t.row, c.category + 1, "중복(자동정리)");
        if (c.history >= 0) {
          const before = String((f.values[t.row - 1] || [])[c.history] ?? "");
          const memo = `${stamp()} 중복 자동정리(대표 ${keep.row}행) · 경로:관리자정리`;
          await setCellOf(sid, f.title, t.row, c.history + 1, before ? before + " / " + memo : memo);
        }
        await safeLog({ rowNo: t.row, kind: "중복정리", name: t.name, vendor: t.vendorRaw, changed: "분류", before: "", after: "중복(자동정리)", path: "관리자정리", actor, memo: `대표 ${keep.row}행` });
        removed++;
      } catch (e: any) {
        await safeLog({ rowNo: t.row, kind: "실패", name: t.name, vendor: t.vendorRaw, changed: "분류", after: "중복(자동정리)", path: "관리자정리", actor, memo: String(e?.message || e) + " — 시트 편집 권한 필요" });
      }
    }
  }
  if (!dry) _fc = null;
  return { ok: true, dry, groups: out, removed };
}

// ───────── 필터링 발송 원장(자동 발송·회신 추적) ─────────
//  같은 시트의 「_필터링발송」 탭. 자동/수동 발송한 요청을 1건 1행으로 남겨:
//   ① 무한 재발송 방지(이미 원장에 있는 요청키는 다시 보내지 않음)
//   ② 웹 회신 페이지가 묶음별 요청 목록을 재구성
//   ③ 발송 이력(누구에게·언제·회신여부) 조회
const DISPATCH_TAB = "_필터링발송";
const DISPATCH_HEADER = ["묶음", "요청키", "거래처명", "사업자번호", "제약사명", "제출처", "요청자", "발송일시", "발송처", "상태", "회신일시"];
export type DispatchLedgerRow = { row: number; batch: string; key: string; name: string; bizNo: string; vendor: string; sub: string; requester: string; sentAt: string; sentTo: string; status: string; repliedAt: string };
export const dispatchRowKey = (name: string, bizNo: string, vendor: string) => rowKey(name, bizNo, vendor);

export async function readDispatchLedger(): Promise<DispatchLedgerRow[]> {
  const sid = await filterSheetId();
  await ensureSheetOf(sid, DISPATCH_TAB, DISPATCH_HEADER);
  const vals = await readAllOf(sid, DISPATCH_TAB);
  const h = (vals[0] || []).map((x) => String(x).trim());
  const gi = (n: string) => h.indexOf(n);
  const out: DispatchLedgerRow[] = [];
  for (let i = 1; i < vals.length; i++) {
    const r = vals[i] || [];
    const batch = String(r[gi("묶음")] ?? "").trim();
    if (!batch) continue;
    out.push({
      row: i + 1, batch, key: String(r[gi("요청키")] ?? "").trim(), name: String(r[gi("거래처명")] ?? "").trim(),
      bizNo: String(r[gi("사업자번호")] ?? "").trim(), vendor: String(r[gi("제약사명")] ?? "").trim(), sub: String(r[gi("제출처")] ?? "").trim(),
      requester: String(r[gi("요청자")] ?? "").trim(), sentAt: String(r[gi("발송일시")] ?? "").trim(), sentTo: String(r[gi("발송처")] ?? "").trim(),
      status: String(r[gi("상태")] ?? "").trim(), repliedAt: String(r[gi("회신일시")] ?? "").trim(),
    });
  }
  return out;
}

/** 이미 발송된 요청키 집합(무한 재발송 방지) */
export async function dispatchedKeys(): Promise<Set<string>> {
  try { return new Set((await readDispatchLedger()).map((r) => r.key).filter(Boolean)); } catch { return new Set(); }
}

/** 발송 원장에 여러 건 기록(같은 묶음). */
export async function recordDispatch(batch: string, sentTo: string, items: { name: string; bizNo: string; vendor: string; sub: string; requester: string }[]): Promise<number> {
  if (!items.length) return 0;
  const sid = await filterSheetId();
  await ensureSheetOf(sid, DISPATCH_TAB, DISPATCH_HEADER);
  const ts = stamp();
  const rows = items.map((it) => [batch, dispatchRowKey(it.name, it.bizNo, it.vendor), it.name, digits(it.bizNo), it.vendor, it.sub || "", it.requester || "", ts, sentTo || "", "발송", ""]);
  await appendRowsOf(sid, DISPATCH_TAB, rows);
  return rows.length;
}

/** 묶음의 요청 목록(현재 「필터링」 판정과 결합해 이미 회신된 건 표시). */
export async function readDispatchBatch(batch: string): Promise<{ sub: string; sentAt: string; items: { key: string; name: string; bizNo: string; vendor: string; requester: string; kind: string; status: string; note: string }[] } | null> {
  const ledger = (await readDispatchLedger()).filter((r) => r.batch === batch);
  if (!ledger.length) return null;
  const items = await readFilterItems().catch(() => [] as FilterItem[]);
  const byKey = new Map<string, FilterItem>();
  for (const it of items) { byKey.set(rowKey(it.name, it.bizNo, it.vendorRaw), it); byKey.set(rowKey(it.name, it.bizNo, it.vendor), it); }
  return {
    sub: ledger[0].sub || batch.split("#")[0], sentAt: ledger[0].sentAt,
    items: ledger.map((l) => { const f = byKey.get(l.key); return { key: l.key, name: l.name, bizNo: l.bizNo, vendor: l.vendor, requester: l.requester, kind: f?.kind || "unfiltered", status: f?.status || "회신대기", note: f?.note || "" }; }),
  };
}

/** 결과가 기록된 요청키를 묶음과 무관하게 회신 처리(관리자 직접 입력·이미지 입력·도구 입력 후 원장 정리). */
export async function markDispatchRepliedByKeys(keys: string[]): Promise<number> {
  if (!keys.length) return 0;
  const set = new Set(keys);
  const ledger = (await readDispatchLedger()).filter((r) => set.has(r.key) && r.status !== "회신");
  if (!ledger.length) return 0;
  const sid = await filterSheetId();
  const vals = await readAllOf(sid, DISPATCH_TAB);
  const h = (vals[0] || []).map((x) => String(x).trim());
  const stCol = h.indexOf("상태") + 1, tsCol = h.indexOf("회신일시") + 1;
  let n = 0;
  for (const l of ledger) { try { if (stCol > 0) await setCellOf(sid, DISPATCH_TAB, l.row, stCol, "회신"); if (tsCol > 0) await setCellOf(sid, DISPATCH_TAB, l.row, tsCol, stamp()); n++; } catch { /* 무시 */ } }
  return n;
}

/** 회신 처리 표시(원장 상태=회신). */
export async function markDispatchReplied(batch: string, keys: string[]): Promise<number> {
  const sid = await filterSheetId();
  const ledger = (await readDispatchLedger()).filter((r) => r.batch === batch && keys.includes(r.key));
  const set = new Set(keys);
  let n = 0;
  await ensureSheetOf(sid, DISPATCH_TAB, DISPATCH_HEADER);
  const vals = await readAllOf(sid, DISPATCH_TAB);
  const h = (vals[0] || []).map((x) => String(x).trim());
  const stCol = h.indexOf("상태") + 1, tsCol = h.indexOf("회신일시") + 1;
  for (const l of ledger) {
    if (!set.has(l.key)) continue;
    try { if (stCol > 0) await setCellOf(sid, DISPATCH_TAB, l.row, stCol, "회신"); if (tsCol > 0) await setCellOf(sid, DISPATCH_TAB, l.row, tsCol, stamp()); n++; } catch { /* 무시 */ }
  }
  return n;
}

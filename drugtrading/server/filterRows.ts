import "server-only";
// 관리 화면(필터링 결과입력·발송·회신)용 행 — 단일 원천 「필터링」 탭(1거래처×1제약사=1행) + 발송 원장(「_필터링발송」).
//   CSO 시트 「필터링-거래가능유무」는 더 이상 읽거나 쓰지 않는다. 행 번호(row)는 원본 시트의 실제 행.
import { readFilterItems, readDispatchLedger, dispatchRowKey, type FilterItem, type DispatchLedgerRow } from "@/lib/cso/filterSource";
import { loadExtraFee, extraForName, type ExtraRow } from "@/lib/cso/extraFee";
import type { AvailPending } from "@/lib/gateway/cso";

export type SourceRow = AvailPending & { kind: string; key: string; keyRaw: string; vendorRaw: string; requested: boolean; history: string };
export const isOpenKind = (kind: string) => kind === "unfiltered" || kind === "pending";

/** 원본 항목 → 화면 행. 제출처·추가수수료는 I 문의처 > 추가수수료표, 발송처·발송일·묶음은 발송 원장(최근 발송)에서. */
export function toSourceRow(it: FilterItem, exIdx: Record<string, ExtraRow>, ledgerByKey: Map<string, DispatchLedgerRow>): SourceRow {
  const ex = extraForName(exIdx, it.vendor) || extraForName(exIdx, it.vendorRaw);
  const key = dispatchRowKey(it.name, it.bizNo, it.vendor), keyRaw = dispatchRowKey(it.name, it.bizNo, it.vendorRaw);
  const l = ledgerByKey.get(key) || ledgerByKey.get(keyRaw);
  return {
    row: it.row, category: it.category, date: it.date, requester: it.requester, name: it.name, bizNo: it.bizNo, vendor: it.vendor, vendorRaw: it.vendorRaw,
    status: isOpenKind(it.kind) && it.kind === "unfiltered" ? "" : it.status, note: it.note, history: it.history, kind: it.kind, key, keyRaw, requested: it.requested,
    sub: it.sub || ex?.sub || "", extraPct: ex && ex.pct > 0 ? String(ex.pct) : "",
    sentTo: l?.sentTo || "", sentAt: l?.sentAt || "", batch: l?.batch || "",
  };
}

export async function sourceRows(origin: string, opts: { raw?: boolean } = {}): Promise<{ list: SourceRow[]; subs: string[]; ledger: DispatchLedgerRow[] }> {
  const [items, ef, ledger] = await Promise.all([
    readFilterItems({ raw: !!opts.raw }),
    loadExtraFee(origin).catch(() => ({ data: null, idx: {} as Record<string, ExtraRow> })),
    readDispatchLedger().catch(() => [] as DispatchLedgerRow[]),
  ]);
  const byKey = new Map<string, DispatchLedgerRow>();
  for (const l of ledger) { const prev = byKey.get(l.key); if (!prev || l.sentAt >= prev.sentAt) byKey.set(l.key, l); }
  const list = items.map((it) => toSourceRow(it, ef.idx, byKey));
  const subs = Array.from(new Set([...(ef.data?.subs || []), ...list.map((r) => r.sub || "").filter(Boolean)]));
  return { list, subs, ledger };
}

/** 행 번호 → 원본 행(합치기 전 원시 목록에서). */
export async function sourceRowByNo(origin: string, row: number): Promise<SourceRow | undefined> {
  const { list } = await sourceRows(origin, { raw: true });
  return list.find((r) => r.row === row);
}

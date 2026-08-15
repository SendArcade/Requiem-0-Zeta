import type { Currency, SourceId } from "./index.js";
import { convertCurrency } from "./fx.js";
import type { EvidenceKind } from "./provenance.js";
import { feedsOracleMark, resolveEvidenceKind } from "./provenance.js";

/** US big-box retail — ask/shelf only, never sold comps. */
export const US_RETAIL_SOURCES: SourceId[] = ["walmart_us"];

export interface RetailReferenceInput {
  price: number;
  currency: Currency;
  source: SourceId;
  status: "listing" | "sold";
  evidenceKind?: EvidenceKind;
  rawJson?: Record<string, unknown> | null;
}

export interface RetailReference {
  value: number;
  currency: Currency;
  low: number;
  high: number;
  nAsks: number;
  sources: SourceId[];
}

function isRetailAsk(row: RetailReferenceInput): boolean {
  if (row.status !== "listing") return false;
  if (!US_RETAIL_SOURCES.includes(row.source)) return false;
  const kind = row.evidenceKind ?? resolveEvidenceKind(row.source, row.rawJson);
  return !feedsOracleMark(kind);
}

/** Median US retail ask — reference band when sold comps are thin. Does not feed Oracle Value. */
export function computeRetailReference(
  rows: RetailReferenceInput[],
  opts: { targetCurrency?: Currency } = {}
): RetailReference | null {
  const target = opts.targetCurrency ?? "USD";
  const asks = rows.filter(isRetailAsk);
  if (asks.length === 0) return null;

  const prices = asks
    .map((r) => convertCurrency(r.price, r.currency, target))
    .filter((p) => Number.isFinite(p) && p > 0)
    .sort((a, b) => a - b);

  if (prices.length === 0) return null;

  const mid = Math.floor(prices.length / 2);
  const value =
    prices.length % 2 === 0
      ? (prices[mid - 1]! + prices[mid]!) / 2
      : prices[mid]!;

  const sources = [...new Set(asks.map((r) => r.source))];

  return {
    value: Math.round(value * 100) / 100,
    currency: target,
    low: prices[0]!,
    high: prices[prices.length - 1]!,
    nAsks: prices.length,
    sources,
  };
}

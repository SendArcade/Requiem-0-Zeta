import type { Currency, SourceId } from "@beyoracle/shared";

export const EVENTS_CHANNEL = "beyoracle:events";

/** Part- or product-level sold comp event for SSE replay. */
export interface SaleEvent {
  type: "sale";
  observationId: string;
  /** @deprecated use assetName — kept for backward-compatible clients */
  partName?: string;
  productName?: string;
  /** Unified display label (part or product name). */
  assetName: string;
  assetKind: "part" | "product";
  partId?: string;
  productId?: string;
  source: SourceId;
  title: string;
  price: number;
  currency: Currency;
  condition: string;
  observedAt: string;
  url: string;
}

export interface AlertEvent {
  type: "alert";
  alertId: string;
  sessionId: string;
  partId: string;
  partName: string;
  previousValue: number;
  newValue: number;
  dropPct: number;
  thresholdPct: number;
}

export type BeyoracleEvent = SaleEvent | AlertEvent;

export function parseEvent(raw: string): BeyoracleEvent | null {
  try {
    const parsed = JSON.parse(raw) as BeyoracleEvent;
    if (parsed.type === "sale" || parsed.type === "alert") return parsed;
    return null;
  } catch {
    return null;
  }
}

/** Normalize legacy sale payloads missing assetKind / assetName. */
export function normalizeSaleEvent(event: SaleEvent): SaleEvent {
  if (event.assetKind && event.assetName) return event;
  if (event.productId) {
    return {
      ...event,
      assetKind: "product",
      assetName: event.productName ?? event.partName ?? event.title,
      productName: event.productName ?? event.partName,
    };
  }
  return {
    ...event,
    assetKind: "part",
    assetName: event.partName ?? event.title,
    partName: event.partName ?? event.title,
  };
}

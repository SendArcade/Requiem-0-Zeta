import type { SourceId } from "./index.js";

/** Market evidence class — controls oracle admission vs display-only signals. */
export type EvidenceKind =
  | "confirmed_sale"
  | "dealer_sold_out_proxy"
  | "dealer_buyback_offer"
  | "active_ask"
  | "demand_proxy";

export const EVIDENCE_KINDS: EvidenceKind[] = [
  "confirmed_sale",
  "dealer_sold_out_proxy",
  "dealer_buyback_offer",
  "active_ask",
  "demand_proxy",
];

export const EVIDENCE_LABELS: Record<EvidenceKind, string> = {
  confirmed_sale: "Confirmed sale",
  dealer_sold_out_proxy: "Dealer sold-out",
  dealer_buyback_offer: "Dealer buyback",
  active_ask: "Active ask",
  demand_proxy: "Demand proxy",
};

/** Default evidence when rawJson carries no priceKind override. */
export const SOURCE_DEFAULT_EVIDENCE: Record<SourceId, EvidenceKind> = {
  mercari_jp: "confirmed_sale",
  yahoo_auctions_jp: "confirmed_sale",
  shopee_tw: "confirmed_sale",
  ebay_com: "confirmed_sale",
  ruten_tw: "demand_proxy",
  mandarake_jp: "active_ask",
  suruga_ya_jp: "dealer_buyback_offer",
  walmart_us: "active_ask",
  amazon_us: "active_ask",
};

function priceKindToEvidence(raw: string): EvidenceKind | null {
  switch (raw) {
    case "fixture_sold":
      return "confirmed_sale";
    case "sold_proxy":
    case "sold_out_proxy":
      return "dealer_sold_out_proxy";
    case "buyback":
    case "buyback_offer":
      return "dealer_buyback_offer";
    case "ask":
      return "active_ask";
    case "demand_proxy":
    case "cumulative_sold":
      return "demand_proxy";
    default:
      return null;
  }
}

/** Resolve provenance from source + adapter rawJson (priceKind, compEligible). */
export function resolveEvidenceKind(
  source: SourceId,
  rawJson?: Record<string, unknown> | null
): EvidenceKind {
  const pk = rawJson?.priceKind;
  if (typeof pk === "string") {
    const mapped = priceKindToEvidence(pk);
    if (mapped) return mapped;
  }

  if (rawJson?.compEligible === false) {
    return "active_ask";
  }

  return SOURCE_DEFAULT_EVIDENCE[source] ?? "confirmed_sale";
}

/** Only confirmed realized sales feed the default Oracle Value median. */
export function feedsOracleMark(kind: EvidenceKind): boolean {
  return kind === "confirmed_sale";
}

export function evidenceLabel(kind: EvidenceKind): string {
  return EVIDENCE_LABELS[kind];
}

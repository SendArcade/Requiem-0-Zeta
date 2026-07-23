import type { RutenItem } from "./ruten/client.js";

/** Ask-floor listings need this many cumulative sales before weak-comp promotion. */
export const RUTEN_MIN_SOLD_WEAK_COMP = Number(
  process.env.RUTEN_MIN_SOLD_WEAK_COMP ?? 3
);

export const RUTEN_WEAK_COMP_VENUE_MULTIPLIER = 0.35;

export type RutenPriceKind = "ask" | "sold_proxy" | "fixture_sold";

export interface RutenQualityMeta {
  priceKind: RutenPriceKind;
  /** When false, observation is market signal only — never an oracle comp. */
  compEligible: boolean;
  venueWeightMultiplier: number;
  status: "listing" | "sold";
}

/**
 * Ruten rtapi returns ask prices + cumulative SoldQty — not closed-transaction comps.
 * Default: listing-only (excluded from oracle). Optional weak comps when RUTEN_WEAK_COMPS=1.
 */
export function classifyRutenListing(
  item: RutenItem,
  opts: { fixture?: boolean } = {}
): RutenQualityMeta {
  if (opts.fixture) {
    return {
      priceKind: "fixture_sold",
      compEligible: true,
      venueWeightMultiplier: 1,
      status: "sold",
    };
  }

  const weakComps = process.env.RUTEN_WEAK_COMPS === "1";
  if (
    weakComps &&
    item.soldCount >= RUTEN_MIN_SOLD_WEAK_COMP &&
    item.priceTwd > 0
  ) {
    return {
      priceKind: "sold_proxy",
      compEligible: true,
      venueWeightMultiplier: RUTEN_WEAK_COMP_VENUE_MULTIPLIER,
      status: "sold",
    };
  }

  return {
    priceKind: "ask",
    compEligible: false,
    venueWeightMultiplier: 0,
    status: "listing",
  };
}

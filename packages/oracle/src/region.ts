import type { RegionEstimate, SourceId } from "@beyoracle/shared";
import { median } from "./robust-estimator.js";

const JP_SOURCES: SourceId[] = ["mercari_jp", "yahoo_auctions_jp"];
const TW_SOURCES: SourceId[] = ["shopee_tw"];

export function estimateRegionPremium(
  comps: Array<{ priceJpy: number; source: SourceId }>
): number | null {
  const jp = comps
    .filter((c) => JP_SOURCES.includes(c.source) && c.priceJpy > 0)
    .map((c) => c.priceJpy);
  const tw = comps
    .filter((c) => TW_SOURCES.includes(c.source) && c.priceJpy > 0)
    .map((c) => c.priceJpy);

  if (jp.length < 2 || tw.length < 2) return null;

  const jpMed = median(jp);
  const twMed = median(tw);
  if (jpMed <= 0) return null;

  return twMed / jpMed;
}

export function buildRegionEstimates(
  valueJpy: number,
  premiumRatio: number | null
): RegionEstimate[] {
  if (premiumRatio == null || premiumRatio <= 0) {
    return [
      {
        region: "jp",
        value: Math.round(valueJpy * 100) / 100,
        premiumPct: 0,
      },
    ];
  }

  const twValue = Math.round(valueJpy * premiumRatio * 100) / 100;
  const premiumPct = Math.round((premiumRatio - 1) * 1000) / 10;

  return [
    { region: "jp", value: Math.round(valueJpy * 100) / 100, premiumPct: 0 },
    { region: "tw", value: twValue, premiumPct },
  ];
}

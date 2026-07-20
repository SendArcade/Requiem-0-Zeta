/**
 * Cohort market index — chained median-of-ratios by calendar month.
 * Methodology inspired by hpipy (Apache-2.0); see docs/ATTRIBUTIONS.md.
 */

import { median } from "./robust-estimator.js";

export interface IndexSale {
  partId: string;
  priceJpy: number;
  observedAt: Date;
  /** generation × partType bucket */
  cohortKey: string;
}

export interface CohortIndex {
  cohortKey: string;
  /** ISO month → index level (1.0 = baseline month). */
  levels: Map<string, number>;
  baselineMonth: string;
}

function monthKey(d: Date): string {
  return d.toISOString().slice(0, 7);
}

/** Build a chained index for one cohort from matched sales across parts. */
export function buildCohortIndex(sales: IndexSale[], cohortKey: string): CohortIndex | null {
  const cohortSales = sales.filter((s) => s.cohortKey === cohortKey && s.priceJpy > 0);
  if (cohortSales.length < 4) return null;

  const months = [...new Set(cohortSales.map((s) => monthKey(s.observedAt)))].sort();
  if (months.length < 2) return null;

  const baselineMonth = months[0]!;
  const levels = new Map<string, number>();
  levels.set(baselineMonth, 1);

  for (let i = 1; i < months.length; i++) {
    const prev = months[i - 1]!;
    const cur = months[i]!;

    const prevPrices = cohortSales
      .filter((s) => monthKey(s.observedAt) === prev)
      .map((s) => s.priceJpy);
    const curPrices = cohortSales
      .filter((s) => monthKey(s.observedAt) === cur)
      .map((s) => s.priceJpy);

    if (prevPrices.length === 0 || curPrices.length === 0) {
      levels.set(cur, levels.get(prev) ?? 1);
      continue;
    }

    const ratio = median(curPrices) / median(prevPrices);
    levels.set(cur, (levels.get(prev) ?? 1) * ratio);
  }

  return { cohortKey, levels, baselineMonth };
}

export function indexAt(index: CohortIndex, date: Date): number {
  const key = monthKey(date);
  if (index.levels.has(key)) return index.levels.get(key)!;

  const sorted = [...index.levels.keys()].sort();
  let last = index.levels.get(index.baselineMonth) ?? 1;
  for (const m of sorted) {
    last = index.levels.get(m) ?? last;
    if (m >= key) return last;
  }
  return last;
}

/** Re-time an observed price to `asOf` using the cohort index (Card Ladder pattern). */
export function adjustPriceToAsOf(
  priceJpy: number,
  observedAt: Date,
  asOf: Date,
  index: CohortIndex | null | undefined
): number {
  if (!index || priceJpy <= 0) return priceJpy;
  const iObs = indexAt(index, observedAt);
  const iNow = indexAt(index, asOf);
  if (iObs <= 0) return priceJpy;
  return priceJpy * (iNow / iObs);
}

export function cohortKeyForPart(generation: string, partType: string): string {
  return `${generation}:${partType}`;
}

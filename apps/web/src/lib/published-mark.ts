import { resolvePublishedMinComps } from "@beyoracle/shared";

/** Row has a publishable oracle mark (≥ min comps, not low confidence). */
export function hasPublishedMark(row: { nComps: number; confidence: string }): boolean {
  const minComps = resolvePublishedMinComps();
  return row.nComps >= minComps && row.confidence !== "low";
}

export function filterPublishedRows<T extends { nComps: number; confidence: string }>(
  rows: T[],
  publishedOnly = true
): T[] {
  return publishedOnly ? rows.filter(hasPublishedMark) : rows;
}

import { filterPublishedRows as filterPublishedRowsShared, hasPublishedMark } from "@beyoracle/shared";

export { hasPublishedMark };

export function filterPublishedRows<T extends { nComps: number; confidence: string }>(
  rows: T[],
  publishedOnly = true
): T[] {
  return filterPublishedRowsShared(rows, publishedOnly);
}

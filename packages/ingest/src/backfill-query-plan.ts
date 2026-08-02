import { loadParts, loadProducts } from "@beyoracle/catalog";
import type { Generation } from "@beyoracle/shared";
import { SCHEDULED_INGEST_QUERIES } from "./queries.js";

const ALL_GENS: Generation[] = ["plastic", "metal", "burst", "x"];

const SKU_QUERY_SUFFIX: Record<string, string[]> = {
  starter: ["スターター", "starter"],
  sealed: ["未開封", "sealed", "NIB"],
  complete_loose: ["完成品", "complete"],
  complete_sealed: ["完成品 未開封", "complete sealed"],
};

/**
 * Full-catalog search terms for backfill — all gens, parts + whole SKUs.
 * Batched by BACKFILL_QUERY_BATCH in backfill-oracle.ts.
 */
export function buildBackfillQueryPlan(opts?: {
  generations?: Generation[];
  maxQueries?: number;
}): string[] {
  const generations = opts?.generations ?? ALL_GENS;
  const seen = new Set<string>();
  const out: string[] = [];

  const add = (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(trimmed);
  };

  for (const q of SCHEDULED_INGEST_QUERIES) add(q);

  for (const part of loadParts()) {
    if (!generations.includes(part.generation)) continue;
    for (const code of part.productCodes) {
      if (part.nameJp) add(`${code} ${part.nameJp}`);
      add(code);
    }
    if (part.nameJp && part.productCodes.length === 0) add(part.nameJp);
    if (part.nameEn && part.productCodes.length === 0) add(part.nameEn);
  }

  for (const product of loadProducts()) {
    if (!generations.includes(product.generation)) continue;
    for (const code of product.productCodes) {
      add(code);
      if (product.nameJp) add(`${code} ${product.nameJp}`);
      for (const suffix of SKU_QUERY_SUFFIX[product.skuType] ?? []) {
        add(`${code} ${suffix}`);
      }
    }
    if (product.nameJp) add(product.nameJp);
    if (product.nameEn) add(product.nameEn);
  }

  if (opts?.maxQueries != null && opts.maxQueries > 0) {
    return out.slice(0, opts.maxQueries);
  }
  return out;
}

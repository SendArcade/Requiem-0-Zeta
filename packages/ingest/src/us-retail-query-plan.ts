import type { Generation } from "@beyoracle/shared";
import { buildProductBackfillQueryPlan } from "./product-backfill-query-plan.js";

const CJK_RE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;

/**
 * English shelf-search rotation for dedicated US retail workers (Walmart / Amazon).
 * JP terms are dropped — US big-box search expects English product names + SKU codes.
 */
export function buildUsRetailQueryPlan(opts?: {
  maxQueries?: number;
  sliceIndex?: number;
}): string[] {
  const maxQueries =
    opts?.maxQueries ?? Number(process.env.US_RETAIL_QUERIES_PER_TICK ?? 8);

  const pool = buildProductBackfillQueryPlan({
    generations: ["plastic", "metal", "burst", "x"] as Generation[],
    maxQueries: Number(process.env.US_RETAIL_QUERY_POOL_MAX ?? 600),
  });

  const englishPool = pool.filter((q) => !CJK_RE.test(q));
  if (englishPool.length === 0) return ["Beyblade X starter", "Beyblade Burst starter"];
  if (englishPool.length <= maxQueries) return englishPool;

  const intervalMs = Number(process.env.INGEST_INTERVAL_MS ?? 15 * 60 * 1000);
  const sliceSize = maxQueries;
  const totalSlices = Math.ceil(englishPool.length / sliceSize);
  const sliceIndex =
    opts?.sliceIndex ??
    Math.floor(Date.now() / intervalMs) % Math.max(1, totalSlices);
  const offset = sliceIndex * sliceSize;
  return englishPool.slice(offset, offset + sliceSize);
}

import { loadParts } from "@beyoracle/catalog";
import { buildProductBackfillQueryPlan } from "./product-backfill-query-plan.js";
import { SCHEDULED_INGEST_QUERIES } from "./queries.js";

const PRIORITY_GENERATIONS = new Set(["x", "burst"]);

let cachedProductQueryPool: string[] | null = null;

function productQueryPool(): string[] {
  if (cachedProductQueryPool) return cachedProductQueryPool;
  cachedProductQueryPool = buildProductBackfillQueryPlan({
    generations: ["x", "burst"],
    maxQueries: Number(process.env.INGEST_PRODUCT_QUERY_POOL_MAX ?? 800),
  });
  return cachedProductQueryPool;
}

/**
 * Catalog-driven query rotation — seed anchors + whole-SKU product terms + part long tail.
 * Product queries use English + JP starter/complete terms from publishable SKUs.
 */
export function buildIngestQueryPlan(opts?: {
  maxQueries?: number;
  /** Explicit slice index for deterministic tests. */
  sliceIndex?: number;
}): string[] {
  const maxQueries =
    opts?.maxQueries ?? Number(process.env.INGEST_QUERIES_PER_TICK ?? 12);

  const seen = new Set<string>();
  const candidates: string[] = [];

  const add = (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push(trimmed);
  };

  // Seed queries always run first — high-signal market anchors.
  for (const q of SCHEDULED_INGEST_QUERIES) add(q);

  const intervalMs = Number(process.env.INGEST_INTERVAL_MS ?? 15 * 60 * 1000);
  const sliceIndex =
    opts?.sliceIndex ??
    Math.floor(Date.now() / intervalMs) % Math.max(1, Math.ceil(2000 / maxQueries));

  const productPerTick = Number(process.env.INGEST_PRODUCT_QUERIES_PER_TICK ?? 6);
  const productPool = productQueryPool();
  if (productPool.length > 0 && productPerTick > 0) {
    const productSlices = Math.max(1, Math.ceil(productPool.length / productPerTick));
    const productSliceIndex = sliceIndex % productSlices;
    const productOffset = productSliceIndex * productPerTick;
    for (const q of productPool.slice(productOffset, productOffset + productPerTick)) {
      add(q);
    }
  }

  const parts = loadParts().filter((p) => PRIORITY_GENERATIONS.has(p.generation));

  for (const part of parts) {
    for (const code of part.productCodes) {
      if (part.nameJp) add(`${code} ${part.nameJp}`);
      else add(code);
    }
    if (part.nameJp && part.productCodes.length === 0) add(part.nameJp);
  }

  if (candidates.length <= maxQueries) return candidates;

  const sliceSize = maxQueries;
  const totalSlices = Math.ceil(candidates.length / sliceSize);
  const partSliceIndex =
    opts?.sliceIndex ??
    Math.floor(Date.now() / intervalMs) % totalSlices;

  const offset = partSliceIndex * sliceSize;
  return candidates.slice(offset, offset + sliceSize);
}

/** Test helper — reset cached product query pool. */
export function resetIngestQueryPlanCache(): void {
  cachedProductQueryPool = null;
}

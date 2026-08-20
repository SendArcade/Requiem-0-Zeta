/**
 * Parallel product backfill sharding — partition publishable whole-SKU products
 * across N workers for Railway fleet scale-out.
 *
 * Assignment is deterministic: productId → FNV-1a → shardId ∈ [0, shardCount).
 * Partitions are disjoint and cover the full target set.
 */
import type { Generation, ProductDTO, SourceId, SkuType } from "@beyoracle/shared";
import {
  buildProductBackfillTargets,
  listPublishableProducts,
} from "./product-backfill-query-plan.js";
import { recomputeProductOracleSnapshotsBatch } from "./persist.js";
import { runSourceIngest } from "./source-ingest.js";
import { listProductBackfillSources } from "./product-backfill.js";

export const PRODUCT_BACKFILL_SHARD_JOB = "product.backfill.shard";

/** Default fleet size when env PRODUCT_BACKFILL_SHARD_COUNT is unset. */
export const DEFAULT_PRODUCT_BACKFILL_SHARD_COUNT = 32;

const ALL_GENERATIONS: Generation[] = ["plastic", "metal", "burst", "x"];

/** Resolve generations for shard work — treats env `all`/`*` as full catalog. */
export function resolveShardGenerations(opts?: Generation[]): Generation[] {
  if (opts?.length) return opts;
  const raw = process.env.PRODUCT_BACKFILL_GENERATIONS?.trim();
  if (raw == null || raw === "" || raw === "all" || raw === "*") return ALL_GENERATIONS;
  const gens = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is Generation => (ALL_GENERATIONS as string[]).includes(s));
  return gens.length ? gens : ALL_GENERATIONS;
}

export interface ProductShardTarget {
  productId: string;
  generation: Generation;
  skuType: SkuType;
  nameEn: string;
  productCodes: string[];
}

export interface ProductBackfillShardReport {
  shardId: number;
  shardCount: number;
  productsTargeted: number;
  productIds: string[];
  queriesTotal: number;
  queryBatches: number;
  sourcesPolled: SourceId[];
  inserted: number;
  updated: number;
  matched: number;
  productsTouched: number;
  productsRecomputed: number;
  /** Auto-accept product matches only feed this (precision-first). */
  precisionNote: string;
  errors: string[];
}

/** Stable FNV-1a 32-bit hash for shard assignment. */
export function hashProductId(productId: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < productId.length; i++) {
    h ^= productId.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function productShardIndex(productId: string, shardCount: number): number {
  if (shardCount < 1) throw new Error(`shardCount must be ≥1, got ${shardCount}`);
  return hashProductId(productId) % shardCount;
}

export function parseShardCount(raw?: string | number | null): number {
  const n =
    typeof raw === "number"
      ? raw
      : Number(raw ?? process.env.PRODUCT_BACKFILL_SHARD_COUNT ?? DEFAULT_PRODUCT_BACKFILL_SHARD_COUNT);
  if (!Number.isFinite(n) || n < 1 || n > 10_000) {
    throw new Error(`Invalid PRODUCT_BACKFILL_SHARD_COUNT: ${raw}`);
  }
  return Math.floor(n);
}

export function parseShardId(raw: string | number | null | undefined, shardCount: number): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n) || n < 0 || n >= shardCount) {
    throw new Error(`Invalid PRODUCT_BACKFILL_SHARD_ID=${raw} for shardCount=${shardCount}`);
  }
  return Math.floor(n);
}

/**
 * List publishable products assigned to one shard.
 * Defaults to all generations (full catalog) unless opts.generations set.
 */
export function listProductsForShard(
  shardId: number,
  shardCount: number,
  opts?: {
    generations?: Generation[];
    priorityOnly?: boolean;
    maxProducts?: number;
    skuTypes?: SkuType[];
  }
): ProductDTO[] {
  const count = parseShardCount(shardCount);
  const id = parseShardId(shardId, count);

  const generations = resolveShardGenerations(opts?.generations);

  let products = listPublishableProducts({
    generations,
    priorityOnly: opts?.priorityOnly,
    maxProducts: opts?.maxProducts,
  });

  if (opts?.skuTypes?.length) {
    const allow = new Set(opts.skuTypes);
    products = products.filter((p) => allow.has(p.skuType));
  }

  return products.filter((p) => productShardIndex(p.id, count) === id);
}

/** Queries for only this shard's products (avoids cross-shard query waste). */
export function buildShardQueryPlan(
  shardId: number,
  shardCount: number,
  opts?: {
    generations?: Generation[];
    priorityOnly?: boolean;
    maxProducts?: number;
    maxQueries?: number;
    skuTypes?: SkuType[];
  }
): { products: ProductDTO[]; queries: string[] } {
  const products = listProductsForShard(shardId, shardCount, opts);
  const idSet = new Set(products.map((p) => p.id));
  const gens = resolveShardGenerations(opts?.generations);
  const targets = buildProductBackfillTargets({
    generations: gens,
    priorityOnly: opts?.priorityOnly,
    maxProducts: opts?.maxProducts,
  }).filter((t) => idSet.has(t.productId));

  const seen = new Set<string>();
  const queries: string[] = [];
  for (const t of targets) {
    for (const q of t.queries) {
      const key = q.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      queries.push(q);
      if (opts?.maxQueries != null && opts.maxQueries > 0 && queries.length >= opts.maxQueries) {
        return { products, queries };
      }
    }
  }
  return { products, queries };
}

/** Assert shards form a partition of the product set (for tests + boot checks). */
export function assertShardPartition(
  shardCount: number,
  opts?: { generations?: Generation[]; priorityOnly?: boolean }
): { total: number; perShard: number[]; emptyShards: number } {
  const count = parseShardCount(shardCount);
  const all = listPublishableProducts({
    generations: opts?.generations ?? ["plastic", "metal", "burst", "x"],
    priorityOnly: opts?.priorityOnly,
  });
  const perShard = Array.from({ length: count }, () => 0);
  const seen = new Set<string>();
  for (const p of all) {
    if (seen.has(p.id)) throw new Error(`duplicate product id ${p.id}`);
    seen.add(p.id);
    const sid = productShardIndex(p.id, count);
    if (sid < 0 || sid >= count) {
      throw new Error(`product ${p.id} hashed to invalid shard ${sid}`);
    }
    perShard[sid]!++;
  }
  const covered = perShard.reduce((a, b) => a + b, 0);
  if (covered !== all.length) {
    throw new Error(`shard coverage ${covered} !== total ${all.length}`);
  }
  return {
    total: all.length,
    perShard,
    emptyShards: perShard.filter((n) => n === 0).length,
  };
}

/**
 * Run backfill for a single shard. Does NOT close the DB connection (worker-safe).
 * Precision-first: relies on match confidence routing + live-only product recompute.
 */
export async function runProductBackfillShard(opts: {
  shardId: number;
  shardCount: number;
  generations?: Generation[];
  priorityOnly?: boolean;
  maxProducts?: number;
  maxQueries?: number;
  queryBatchSize?: number;
  limitPerQuery?: number;
  closeDb?: boolean;
}): Promise<ProductBackfillShardReport> {
  const shardCount = parseShardCount(opts.shardCount);
  const shardId = parseShardId(opts.shardId, shardCount);

  const maxQueriesEnv = Number(process.env.PRODUCT_BACKFILL_MAX_QUERIES ?? 0);
  const maxQueries =
    opts.maxQueries ?? (maxQueriesEnv > 0 ? maxQueriesEnv : undefined);
  const priorityOnly =
    opts.priorityOnly ?? process.env.PRODUCT_BACKFILL_PRIORITY_ONLY === "1";

  const { products, queries } = buildShardQueryPlan(shardId, shardCount, {
    generations: opts.generations,
    priorityOnly,
    maxProducts: opts.maxProducts,
    maxQueries: maxQueries && maxQueries > 0 ? maxQueries : undefined,
  });

  const report: ProductBackfillShardReport = {
    shardId,
    shardCount,
    productsTargeted: products.length,
    productIds: products.map((p) => p.id),
    queriesTotal: queries.length,
    queryBatches: 0,
    sourcesPolled: [],
    inserted: 0,
    updated: 0,
    matched: 0,
    productsTouched: 0,
    productsRecomputed: 0,
    precisionNote:
      "auto-accept ≥0.9 only; lots/single-parts rejected; live-only product marks; variant/skuType separated",
    errors: [],
  };

  const productsTouched = new Set<string>();
  const sources = listProductBackfillSources();
  report.sourcesPolled = sources;

  const batchSize =
    opts.queryBatchSize ?? Number(process.env.PRODUCT_BACKFILL_QUERY_BATCH ?? 15);
  const limitPerQuery =
    opts.limitPerQuery ?? Number(process.env.INGEST_LIMIT_PER_QUERY ?? 30);

  try {
    if (products.length === 0) {
      report.errors.push(`shard ${shardId}/${shardCount}: no products assigned`);
      return report;
    }
    if (sources.length === 0) {
      report.errors.push("No live sources enabled — set MERCARI_API_ENABLED=1 etc.");
      return report;
    }
    if (queries.length === 0) {
      report.errors.push(`shard ${shardId}: no queries generated`);
      return report;
    }

    console.log(
      `[product-backfill-shard ${shardId}/${shardCount}] ${products.length} products, ${queries.length} queries × ${sources.length} sources`
    );

    const totalBatches = Math.ceil(queries.length / batchSize);
    for (let i = 0; i < queries.length; i += batchSize) {
      const batch = queries.slice(i, i + batchSize);
      report.queryBatches++;
      console.log(
        `[product-backfill-shard ${shardId}] batch ${report.queryBatches}/${totalBatches}`
      );

      // Sequential sources to stay polite; parallel shards provide fleet scale.
      for (const sourceId of sources) {
        const sourceStarted = Date.now();
        try {
          const r = await runSourceIngest({
            sourceId,
            queries: batch,
            limitPerQuery,
            recordRun: false,
          });
          report.inserted += r.inserted;
          report.updated += r.updated;
          report.matched += r.matched;
          for (const id of r.productsTouchedIds) {
            // Only recompute products owned by this shard (avoid thrash).
            if (productShardIndex(id, shardCount) === shardId) {
              productsTouched.add(id);
            }
          }
          report.errors.push(...r.errors);
          console.log(
            `[product-backfill-shard ${shardId}] batch ${report.queryBatches}/${totalBatches} ` +
              `${sourceId}: queries=${r.queriesRun} listings=${r.listingsFetched} ` +
              `+${r.inserted} matched=${r.matched} (${Date.now() - sourceStarted}ms)`
          );
        } catch (err) {
          report.errors.push(`${sourceId}: ${(err as Error).message}`);
          console.warn(
            `[product-backfill-shard ${shardId}] batch ${report.queryBatches}/${totalBatches} ` +
              `${sourceId} failed:`,
            (err as Error).message
          );
        }
      }
    }

    report.productsTouched = productsTouched.size;
    if (productsTouched.size > 0) {
      await recomputeProductOracleSnapshotsBatch(productsTouched);
      report.productsRecomputed = productsTouched.size;
    }
  } finally {
    if (opts.closeDb) {
      const { closeDb } = await import("@beyoracle/db");
      await closeDb();
    }
  }

  return report;
}

/** Build enqueue specs for all shards (idempotent jobIds within a run). */
export function buildProductBackfillShardJobs(opts?: {
  shardCount?: number;
  generations?: Generation[];
  priorityOnly?: boolean;
  maxQueriesPerShard?: number;
  /** Distinct run id so a new fleet pass can re-enqueue after a prior run finished. */
  runId?: string;
}): Array<{
  jobId: string;
  name: typeof PRODUCT_BACKFILL_SHARD_JOB;
  data: {
    shardId: number;
    shardCount: number;
    generations?: Generation[];
    priorityOnly?: boolean;
    maxQueries?: number;
  };
}> {
  const shardCount = parseShardCount(opts?.shardCount);
  const runId =
    opts?.runId?.trim() ||
    process.env.PRODUCT_BACKFILL_RUN_ID?.trim() ||
    "v1";
  const maxQueriesPerShard =
    opts?.maxQueriesPerShard != null && opts.maxQueriesPerShard > 0
      ? opts.maxQueriesPerShard
      : undefined;
  const jobs = [];
  for (let shardId = 0; shardId < shardCount; shardId++) {
    jobs.push({
      jobId: `product-backfill-shard-${runId}-${shardCount}-${shardId}`,
      name: PRODUCT_BACKFILL_SHARD_JOB as typeof PRODUCT_BACKFILL_SHARD_JOB,
      data: {
        shardId,
        shardCount,
        generations: opts?.generations,
        priorityOnly: opts?.priorityOnly,
        ...(maxQueriesPerShard != null ? { maxQueries: maxQueriesPerShard } : {}),
      },
    });
  }
  return jobs;
}


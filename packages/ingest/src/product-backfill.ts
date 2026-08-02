import { closeDb, getDb, ingestRuns } from "@beyoracle/db";
import type { SourceId } from "@beyoracle/shared";
import { desc, eq } from "drizzle-orm";
import {
  buildProductBackfillQueryPlan,
  listPublishableProducts,
} from "./product-backfill-query-plan.js";
import { recomputeProductOracleSnapshotsBatch } from "./persist.js";
import { startIngestRun } from "./runs.js";
import { listEnabledSources, runSourceIngest } from "./source-ingest.js";

export const PRODUCT_BACKFILL_JOB = "product.backfill";

export interface ProductBackfillReport {
  queriesTotal: number;
  productsTargeted: number;
  queryBatches: number;
  sourcesPolled: SourceId[];
  inserted: number;
  updated: number;
  matched: number;
  productsTouched: number;
  productsRecomputed: number;
  errors: string[];
}

/** Default Mercari + Yahoo for whole-SKU sold comps. */
export function listProductBackfillSources(): SourceId[] {
  const enabled = listEnabledSources();
  const raw =
    process.env.PRODUCT_BACKFILL_SOURCES?.trim() ??
    process.env.BACKFILL_SOURCES?.trim() ??
    "mercari_jp,yahoo_auctions_jp";

  const allow = new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
  const picked = enabled.filter((id) => allow.has(id));
  if (picked.length === 0) {
    console.warn(
      `[product-backfill] PRODUCT_BACKFILL_SOURCES=${raw} matched no enabled sources — using all enabled`
    );
    return enabled;
  }
  return picked;
}

export async function shouldRunProductBackfill(): Promise<boolean> {
  if (process.env.FORCE_PRODUCT_BACKFILL === "1") return true;
  if (process.env.PRODUCT_BACKFILL_DONE === "1") return false;

  const db = getDb();
  const rows = await db
    .select({ status: ingestRuns.status, finishedAt: ingestRuns.finishedAt })
    .from(ingestRuns)
    .where(eq(ingestRuns.jobName, PRODUCT_BACKFILL_JOB))
    .orderBy(desc(ingestRuns.startedAt))
    .limit(1);

  const last = rows[0];
  if (!last) return true;
  if (last.status === "success") return false;
  if (last.status !== "running") return true;

  const staleMs = Number(process.env.PRODUCT_BACKFILL_STALE_MS ?? 45 * 60 * 1000);
  const ageMs = last.finishedAt
    ? Date.now() - last.finishedAt.getTime()
    : staleMs + 1;
  return ageMs > staleMs;
}

export async function runProductBackfill(opts?: {
  generations?: ("x" | "burst" | "metal" | "plastic")[];
  priorityOnly?: boolean;
  maxProducts?: number;
  maxQueries?: number;
  queryBatchSize?: number;
  limitPerQuery?: number;
  force?: boolean;
}): Promise<ProductBackfillReport> {
  if (!opts?.force && !(await shouldRunProductBackfill())) {
    console.log("[product-backfill] skipped — prior run success or in progress");
    return {
      queriesTotal: 0,
      productsTargeted: 0,
      queryBatches: 0,
      sourcesPolled: [],
      inserted: 0,
      updated: 0,
      matched: 0,
      productsTouched: 0,
      productsRecomputed: 0,
      errors: ["skipped: already completed or running"],
    };
  }

  const run = await startIngestRun({ jobName: PRODUCT_BACKFILL_JOB });
  const report: ProductBackfillReport = {
    queriesTotal: 0,
    productsTargeted: 0,
    queryBatches: 0,
    sourcesPolled: [],
    inserted: 0,
    updated: 0,
    matched: 0,
    productsTouched: 0,
    productsRecomputed: 0,
    errors: [],
  };

  const productsTouched = new Set<string>();

  try {
    const maxProducts =
      opts?.maxProducts ??
      (process.env.PRODUCT_BACKFILL_MAX_PRODUCTS
        ? Number(process.env.PRODUCT_BACKFILL_MAX_PRODUCTS)
        : undefined);

    const maxQueries =
      opts?.maxQueries ??
      Number(process.env.PRODUCT_BACKFILL_MAX_QUERIES ?? 500);

    const priorityOnly =
      opts?.priorityOnly ?? process.env.PRODUCT_BACKFILL_PRIORITY_ONLY === "1";

    const targeted = listPublishableProducts({
      generations: opts?.generations,
      priorityOnly,
      maxProducts,
    });
    report.productsTargeted = targeted.length;

    const allQueries = buildProductBackfillQueryPlan({
      generations: opts?.generations,
      priorityOnly,
      maxProducts,
      maxQueries,
    });

    report.queriesTotal = allQueries.length;

    const batchSize =
      opts?.queryBatchSize ?? Number(process.env.PRODUCT_BACKFILL_QUERY_BATCH ?? 20);
    const limitPerQuery =
      opts?.limitPerQuery ?? Number(process.env.INGEST_LIMIT_PER_QUERY ?? 40);

    const sources = listProductBackfillSources();
    report.sourcesPolled = sources;

    if (sources.length === 0) {
      report.errors.push("No live sources enabled — set MERCARI_API_ENABLED=1 etc.");
    } else if (allQueries.length === 0) {
      report.errors.push("No product queries generated");
    } else {
      console.log(
        `[product-backfill] ${allQueries.length} queries × ${sources.length} sources (batch ${batchSize})`
      );

      const totalBatches = Math.ceil(allQueries.length / batchSize);
      for (let i = 0; i < allQueries.length; i += batchSize) {
        const batch = allQueries.slice(i, i + batchSize);
        report.queryBatches++;
        console.log(
          `[product-backfill] batch ${report.queryBatches}/${totalBatches} (${batch.length} queries)`
        );

        const results = await Promise.allSettled(
          sources.map((sourceId) =>
            runSourceIngest({
              sourceId,
              queries: batch,
              limitPerQuery,
              recordRun: false,
            })
          )
        );

        for (const result of results) {
          if (result.status === "rejected") {
            report.errors.push((result.reason as Error).message);
            continue;
          }
          const r = result.value;
          report.inserted += r.inserted;
          report.updated += r.updated;
          report.matched += r.matched;
          for (const id of r.productsTouchedIds) productsTouched.add(id);
          report.errors.push(...r.errors);
        }
      }
    }

    report.productsTouched = productsTouched.size;

    if (productsTouched.size > 0) {
      console.log(
        `[product-backfill] recomputing ${productsTouched.size} touched product snapshots…`
      );
      await recomputeProductOracleSnapshotsBatch(productsTouched);
      report.productsRecomputed = productsTouched.size;
    }

    await run.finish({
      status: report.errors.length ? "failed" : "success",
      stats: report,
      errors: report.errors,
    });
  } catch (err) {
    report.errors.push((err as Error).message);
    await run.finish({
      status: "failed",
      stats: report,
      errors: report.errors,
    });
  } finally {
    await closeDb();
  }

  return report;
}

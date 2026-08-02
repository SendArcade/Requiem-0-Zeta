import { loadAllFixtures } from "@beyoracle/catalog";
import { getDb, ingestRuns, parts, products } from "@beyoracle/db";
import type { SourceId } from "@beyoracle/shared";
import { desc, eq } from "drizzle-orm";
import { buildBackfillQueryPlan } from "./backfill-query-plan.js";
import { backfillLandedJpy } from "./backfill-landed.js";
import { resolveIngestMatch } from "./match-ingest.js";
import {
  persistObservation,
  recomputeOracleSnapshotsBatch,
  recomputeProductOracleSnapshotsBatch,
} from "./persist.js";
import { listBackfillSources, runSourceIngest } from "./source-ingest.js";
import { startIngestRun } from "./runs.js";

export const ORACLE_BACKFILL_JOB = "oracle.backfill";

let backfillInFlight = false;

/** True while runOracleBackfill is actively polling sources (used to pause cron ingest). */
export function isBackfillInFlight(): boolean {
  return backfillInFlight;
}

export interface BackfillOracleReport {
  fixtureObservations: number;
  fixtureMatched: number;
  queryBatches: number;
  queriesTotal: number;
  sourcesPolled: SourceId[];
  inserted: number;
  updated: number;
  matched: number;
  partsRecomputed: number;
  productsRecomputed: number;
  landedBackfillUpdated: number;
  errors: string[];
}

/** Insert fixture sold comps (idempotent) with product-first matching. */
export async function backfillFixtureComps(): Promise<{
  observations: number;
  matched: number;
}> {
  const fixtures = loadAllFixtures();
  let matched = 0;

  for (const f of fixtures) {
    const observation = {
      id: `${f.source}:${f.externalId}`,
      source: f.source,
      externalId: f.externalId,
      title: f.title,
      price: f.price,
      currency: f.currency,
      status: f.status,
      condition: f.condition,
      url: f.url,
      observedAt: new Date(f.observedAt),
      rawJson: { fixture: true, backfill: true },
    };

    const ingestMatch = resolveIngestMatch(f.title);
    const { partId, productId } = await persistObservation(observation, ingestMatch, {
      isBundle: false,
    });
    if (partId || productId) matched++;
  }

  return { observations: fixtures.length, matched };
}

export async function recomputeAllOracleSnapshots(): Promise<{
  parts: number;
  products: number;
}> {
  const db = getDb();
  const partRows = await db.select({ id: parts.id }).from(parts);
  const productRows = await db.select({ id: products.id }).from(products);
  const partIds = partRows.map((r) => r.id);
  const productIds = productRows.map((r) => r.id);

  await recomputeOracleSnapshotsBatch(partIds);
  await recomputeProductOracleSnapshotsBatch(productIds);

  return { parts: partIds.length, products: productIds.length };
}

/** Short ASCII-only tokens (e.g. "Atomic-S") often 404 on Yahoo and timeout Ruten. */
export function filterWeakBackfillQueries(queries: string[]): string[] {
  if (process.env.BACKFILL_SKIP_WEAK_QUERIES !== "1") return queries;
  const kept = queries.filter((q) => {
    const t = q.trim();
    if (t.length >= 14) return true;
    if (/[\u3040-\u30ff\u4e00-\u9fff]/.test(t)) return true;
    // Keep product codes like BX-00-01 (digits in hyphen segments).
    if (/\d/.test(t)) return true;
    return false;
  });
  const skipped = queries.length - kept.length;
  if (skipped > 0) {
    console.log(
      `[backfill] BACKFILL_SKIP_WEAK_QUERIES=1 — skipped ${skipped} short ASCII-only queries`
    );
  }
  return kept;
}

/** Skip if a successful or in-flight backfill already exists (worker restart safe). */
export async function shouldRunOracleBackfill(): Promise<boolean> {
  if (process.env.FORCE_ORACLE_BACKFILL === "1") return true;
  if (process.env.ORACLE_BACKFILL_DONE === "1") return false;

  const db = getDb();
  const rows = await db
    .select({
      status: ingestRuns.status,
      startedAt: ingestRuns.startedAt,
      stats: ingestRuns.stats,
    })
    .from(ingestRuns)
    .where(eq(ingestRuns.jobName, ORACLE_BACKFILL_JOB))
    .orderBy(desc(ingestRuns.startedAt))
    .limit(1);

  const latest = rows[0];
  if (!latest) return true;
  if (latest.status === "success") return false;
  if (latest.status === "running") {
    const stats = (latest.stats ?? {}) as { lastBatchAt?: string; batch?: number };
    const lastActive = stats.lastBatchAt
      ? new Date(stats.lastBatchAt)
      : latest.startedAt;
    const ageMs = Date.now() - lastActive.getTime();
    const staleMs = stats.lastBatchAt
      ? Number(process.env.BACKFILL_STALE_MS ?? 45 * 60 * 1000)
      : Number(process.env.BACKFILL_STALE_MS_NO_PULSE ?? 24 * 60 * 60 * 1000);
    if (ageMs < staleMs) {
      console.log(
        `[backfill] skip — oracle.backfill still running (last activity ${Math.round(ageMs / 1000)}s ago)`
      );
      return false;
    }
    console.warn(
      `[backfill] stale oracle.backfill run (no activity for ${Math.round(ageMs / 60000)}m) — restarting`
    );
    return true;
  }
  return true;
}

/**
 * Full oracle backfill: fixture comps → live ingest (batched) → landed JPY → recompute all marks.
 */
export async function runOracleBackfill(opts?: {
  skipFixtures?: boolean;
  skipLiveIngest?: boolean;
  skipLanded?: boolean;
  queryBatchSize?: number;
  limitPerQuery?: number;
  maxQueries?: number;
  force?: boolean;
}): Promise<BackfillOracleReport> {
  if (!opts?.force && !(await shouldRunOracleBackfill())) {
    console.log("[backfill] skipped — prior oracle.backfill run success or in progress");
    return {
      fixtureObservations: 0,
      fixtureMatched: 0,
      queryBatches: 0,
      queriesTotal: 0,
      sourcesPolled: [],
      inserted: 0,
      updated: 0,
      matched: 0,
      partsRecomputed: 0,
      productsRecomputed: 0,
      landedBackfillUpdated: 0,
      errors: ["skipped: already completed or running"],
    };
  }

  backfillInFlight = true;
  const run = await startIngestRun({ jobName: ORACLE_BACKFILL_JOB });

  const report: BackfillOracleReport = {
    fixtureObservations: 0,
    fixtureMatched: 0,
    queryBatches: 0,
    queriesTotal: 0,
    sourcesPolled: [],
    inserted: 0,
    updated: 0,
    matched: 0,
    partsRecomputed: 0,
    productsRecomputed: 0,
    landedBackfillUpdated: 0,
    errors: [],
  };

  try {
  const batchSize =
    opts?.queryBatchSize ?? Number(process.env.BACKFILL_QUERY_BATCH ?? 25);
  const limitPerQuery =
    opts?.limitPerQuery ?? Number(process.env.INGEST_LIMIT_PER_QUERY ?? 40);

  // report initialized above
  if (!opts?.skipFixtures) {
    console.log("[backfill] inserting fixture sold comps…");
    const fx = await backfillFixtureComps();
    report.fixtureObservations = fx.observations;
    report.fixtureMatched = fx.matched;
    console.log(
      `[backfill] fixtures: ${fx.observations} titles, ${fx.matched} matched`
    );
  }

  const allQueries = filterWeakBackfillQueries(
    buildBackfillQueryPlan({
      maxQueries: opts?.maxQueries,
    })
  );
  report.queriesTotal = allQueries.length;

  if (!opts?.skipLiveIngest) {
    const sources = listBackfillSources();
    report.sourcesPolled = sources;

    if (sources.length === 0) {
      report.errors.push("No live sources enabled — set MERCARI_API_ENABLED=1 etc.");
    } else {
      console.log(
        `[backfill] live ingest: ${allQueries.length} queries × ${sources.length} sources (batch ${batchSize})`
      );

      const totalBatches = Math.ceil(allQueries.length / batchSize);
      const backfillStartedAt = Date.now();

      for (let i = 0; i < allQueries.length; i += batchSize) {
        const batch = allQueries.slice(i, i + batchSize);
        const batchStartedAt = Date.now();
        report.queryBatches++;
        console.log(
          `[backfill] batch ${report.queryBatches}/${totalBatches} (${batch.length} queries)`
        );

        const sourceResults = await Promise.allSettled(
          sources.map(async (sourceId) => {
            const sourceStartedAt = Date.now();
            const result = await runSourceIngest({
              sourceId,
              queries: batch,
              limitPerQuery,
              recordRun: false,
            });
            console.log(
              `[backfill] batch ${report.queryBatches}/${totalBatches} ${sourceId}: +${result.inserted} new, ${result.matched} matched (${Math.round((Date.now() - sourceStartedAt) / 1000)}s)`
            );
            return { sourceId, result };
          })
        );

        for (const settled of sourceResults) {
          if (settled.status === "fulfilled") {
            const { result } = settled.value;
            report.inserted += result.inserted;
            report.updated += result.updated;
            report.matched += result.matched;
            report.errors.push(...result.errors);
          } else {
            report.errors.push(String(settled.reason));
          }
        }

        const batchesDone = report.queryBatches;
        const elapsedMs = Date.now() - backfillStartedAt;
        const avgMsPerBatch = elapsedMs / batchesDone;
        const batchesLeft = totalBatches - batchesDone;
        const etaMin = Math.round((avgMsPerBatch * batchesLeft) / 60_000);
        console.log(
          `[backfill] batch ${batchesDone}/${totalBatches} done in ${Math.round((Date.now() - batchStartedAt) / 1000)}s — ETA ~${etaMin}m (+${report.inserted} inserted total)`
        );

        await run.pulse({
          lastBatchAt: new Date().toISOString(),
          batch: batchesDone,
          totalBatches,
          queriesTotal: allQueries.length,
          inserted: report.inserted,
          matched: report.matched,
        });
      }
    }
  }

  if (!opts?.skipLanded) {
    console.log("[backfill] landed JPY backfill…");
    let cursor: string | undefined;
    let totalUpdated = 0;
    for (;;) {
      const pass = await backfillLandedJpy({
        batchSize: Number(process.env.BACKFILL_LANDED_BATCH ?? 500),
        cursor,
      });
      totalUpdated += pass.updated;
      if (!pass.hasMore) break;
      cursor = pass.nextCursor;
    }
    report.landedBackfillUpdated = totalUpdated;
  }

  console.log("[backfill] recomputing all part + product oracle snapshots…");
  const recompute = await recomputeAllOracleSnapshots();
  report.partsRecomputed = recompute.parts;
  report.productsRecomputed = recompute.products;

  await run.finish({
    status: report.errors.length > 0 && report.inserted === 0 ? "failed" : "success",
    stats: report,
    errors: report.errors.slice(0, 50),
  });

  return report;
  } catch (err) {
    await run.finish({
      status: "failed",
      stats: report,
      errors: [...report.errors, (err as Error).message],
    });
    throw err;
  } finally {
    backfillInFlight = false;
  }
}

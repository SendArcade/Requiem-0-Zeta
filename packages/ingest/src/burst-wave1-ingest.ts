/**
 * Wave 1 burst expansion — B-01, B-102, B-168 + Wave 0 sealed rows.
 * Mercari + Yahoo sold ingest → burst rematch → recompute touched products.
 * Run on Railway worker via BURST_WAVE1_INGEST=1 (no Apify).
 */
import { closeDb } from "@beyoracle/db";
import { buildWave1QueryPlan } from "./burst-wave1-targets.js";
import { WAVE1_BURST_PRODUCTS } from "./burst-wave1-ids.js";
import { runBurstRematchUnmatched } from "./burst-rematch-unmatched.js";
import { listProductBackfillSources } from "./product-backfill.js";
import { ingestQueryBatch } from "./ingest-batch.js";
import { recomputeProductOracleSnapshotsBatch } from "./persist.js";
import { resetYahooLiveCircuitForWave0 } from "./adapters/yahoo-auctions-jp.js";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type BurstWave1IngestReport = {
  dryRun: boolean;
  queriesTotal: number;
  sourcesPolled: string[];
  inserted: number;
  updated: number;
  matched: number;
  ingestErrors: string[];
  rematchSealed: Awaited<ReturnType<typeof runBurstRematchUnmatched>>;
  recomputedProducts: number;
  productsTouched: string[];
};

export async function runBurstWave1Ingest(
  opts: {
    dryRun?: boolean;
    skipIngest?: boolean;
    maxQueries?: number;
    limitPerQuery?: number;
    closeDb?: boolean;
  } = {}
): Promise<BurstWave1IngestReport> {
  const dryRun = opts.dryRun ?? false;
  const skipIngest = opts.skipIngest ?? false;
  const closeDbAfter = opts.closeDb ?? true;

  resetYahooLiveCircuitForWave0();

  const queries = buildWave1QueryPlan({ maxQueries: opts.maxQueries });
  const sources = listProductBackfillSources();

  const report: BurstWave1IngestReport = {
    dryRun,
    queriesTotal: queries.length,
    sourcesPolled: sources,
    inserted: 0,
    updated: 0,
    matched: 0,
    ingestErrors: [],
    rematchSealed: {
      candidates: 0,
      scanned: 0,
      matched: 0,
      gateSkip: 0,
      nonBurst: 0,
      lowConf: 0,
      recomputedProducts: 0,
      samples: [],
    },
    recomputedProducts: 0,
    productsTouched: [],
  };

  console.log(
    `[burst:wave1-ingest] start dryRun=${dryRun} queries=${queries.length} products=${WAVE1_BURST_PRODUCTS.length} sources=${sources.join(",") || "(none)"}`
  );

  const touched = new Set<string>();

  if (!skipIngest && !dryRun) {
    if (sources.length === 0) {
      report.ingestErrors.push(
        "No live sources enabled — set MERCARI_API_ENABLED=1 and YAHOO_AUCTIONS_ENABLED=1"
      );
    } else if (queries.length === 0) {
      report.ingestErrors.push("No Wave 1 queries generated");
    } else {
      const limitPerQuery =
        opts.limitPerQuery ?? Number(process.env.INGEST_LIMIT_PER_QUERY ?? 40);
      const batchSize = Number(process.env.WAVE1_INGEST_QUERY_BATCH ?? 12);
      const batchPauseMs = Number(process.env.WAVE1_INGEST_BATCH_PAUSE_MS ?? 3_000);

      for (let i = 0; i < queries.length; i += batchSize) {
        const batch = queries.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;
        console.log(
          `[burst:wave1-ingest] ingest batch ${batchNum} (${batch.length} queries)`
        );

        const totals = await ingestQueryBatch({
          sources,
          queries: batch,
          limitPerQuery,
          batchNum,
          logPrefix: "burst:wave1-ingest",
        });
        report.inserted += totals.inserted;
        report.updated += totals.updated;
        report.matched += totals.matched;
        report.ingestErrors.push(...totals.errors);
        for (const id of totals.productsTouchedIds) {
          if ((WAVE1_BURST_PRODUCTS as readonly string[]).includes(id)) touched.add(id);
        }

        if (i + batchSize < queries.length && batchPauseMs > 0) {
          await sleep(batchPauseMs);
        }
      }
    }
  } else if (skipIngest) {
    console.log("[burst:wave1-ingest] skipIngest=1 — rematch/recompute only");
  } else {
    console.log("[burst:wave1-ingest] dryRun — skip live ingest API calls");
  }

  report.rematchSealed = await runBurstRematchUnmatched({
    dryRun,
    wave0Only: false,
    allBurstish: true,
  });
  console.log(
    `[burst:wave1-ingest] sealed rematch matched=${report.rematchSealed.matched}/${report.rematchSealed.candidates}`
  );

  if (!dryRun) {
    for (const id of WAVE1_BURST_PRODUCTS) touched.add(id);
    report.productsTouched = [...touched];
    await recomputeProductOracleSnapshotsBatch(touched);
    report.recomputedProducts = touched.size;
    console.log(
      `[burst:wave1-ingest] recomputed ${report.recomputedProducts} Wave 1 products`
    );
  }

  if (closeDbAfter) {
    await closeDb();
  }

  return report;
}

/**
 * Targeted Wave 0 gap fill — B-110 / B-97 / B-104 only.
 * Mercari + Yahoo sold ingest → loose rematch → below-band purge → recompute → verify.
 * Run on Railway worker via BURST_WAVE0_INGEST=1 (no Apify).
 */
import { closeDb } from "@beyoracle/db";
import { buildWave0GapQueryPlan, WAVE0_FAILING_STARTERS } from "./burst-wave0-targets.js";
import { runBurstRematchLooseWave0 } from "./burst-rematch-unmatched.js";
import { purgeWave0BelowBand } from "./burst-wave0-purge-below-band.js";
import { listProductBackfillSources } from "./product-backfill.js";
import { recomputeProductOracleSnapshotsBatch } from "./persist.js";
import { runSourceIngest } from "./source-ingest.js";
import { formatWave0Verify, verifyWave0 } from "./burst-wave0-verify-lib.js";

export type BurstWave0IngestReport = {
  dryRun: boolean;
  queriesTotal: number;
  sourcesPolled: string[];
  inserted: number;
  updated: number;
  matched: number;
  ingestErrors: string[];
  rematchLoose: Awaited<ReturnType<typeof runBurstRematchLooseWave0>>;
  purgeBelowBand: Awaited<ReturnType<typeof purgeWave0BelowBand>>;
  recomputedProducts: number;
  verify: Awaited<ReturnType<typeof verifyWave0>> | null;
};

export async function runBurstWave0Ingest(opts: {
  dryRun?: boolean;
  skipIngest?: boolean;
  skipVerify?: boolean;
  maxQueries?: number;
  limitPerQuery?: number;
  closeDb?: boolean;
} = {}): Promise<BurstWave0IngestReport> {
  const dryRun = opts.dryRun ?? false;
  const skipIngest = opts.skipIngest ?? false;
  const skipVerify = opts.skipVerify ?? false;
  const closeDbAfter = opts.closeDb ?? true;

  const queries = buildWave0GapQueryPlan({
    maxQueries: opts.maxQueries,
  });
  const sources = listProductBackfillSources();

  const report: BurstWave0IngestReport = {
    dryRun,
    queriesTotal: queries.length,
    sourcesPolled: sources,
    inserted: 0,
    updated: 0,
    matched: 0,
    ingestErrors: [],
    rematchLoose: {
      candidates: 0,
      scanned: 0,
      matched: 0,
      gateSkip: 0,
      nonBurst: 0,
      lowConf: 0,
      recomputedProducts: 0,
      samples: [],
    },
    purgeBelowBand: {
      scanned: 0,
      purged: 0,
      skippedProducts: [],
      samples: [],
      recomputedProducts: 0,
    },
    recomputedProducts: 0,
    verify: null,
  };

  console.log(
    `[burst:wave0-ingest] start dryRun=${dryRun} queries=${queries.length} sources=${sources.join(",") || "(none)"}`
  );

  if (!skipIngest && !dryRun) {
    if (sources.length === 0) {
      report.ingestErrors.push(
        "No live sources enabled — set MERCARI_API_ENABLED=1 and YAHOO_AUCTIONS_ENABLED=1"
      );
    } else if (queries.length === 0) {
      report.ingestErrors.push("No gap queries generated");
    } else {
      const limitPerQuery =
        opts.limitPerQuery ?? Number(process.env.INGEST_LIMIT_PER_QUERY ?? 40);
      const batchSize = Number(process.env.WAVE0_INGEST_QUERY_BATCH ?? 12);

      for (let i = 0; i < queries.length; i += batchSize) {
        const batch = queries.slice(i, i + batchSize);
        console.log(
          `[burst:wave0-ingest] ingest batch ${Math.floor(i / batchSize) + 1} (${batch.length} queries)`
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
            report.ingestErrors.push((result.reason as Error).message);
            continue;
          }
          const r = result.value;
          report.inserted += r.inserted;
          report.updated += r.updated;
          report.matched += r.matched;
          report.ingestErrors.push(...r.errors);
          console.log(
            `[burst:wave0-ingest] ${r.sourceId} batch ${Math.floor(i / batchSize) + 1}: fetched=${r.listingsFetched} matched=${r.matched} inserted=${r.inserted}`
          );
        }
      }
    }
  } else if (skipIngest) {
    console.log("[burst:wave0-ingest] skipIngest=1 — rematch/purge/recompute only");
  } else {
    console.log("[burst:wave0-ingest] dryRun — skip live ingest API calls");
  }

  report.rematchLoose = await runBurstRematchLooseWave0({ dryRun });
  console.log(
    `[burst:wave0-ingest] loose rematch matched=${report.rematchLoose.matched}/${report.rematchLoose.candidates}`
  );

  report.purgeBelowBand = await purgeWave0BelowBand({ dryRun });
  console.log(
    `[burst:wave0-ingest] below-band purge ${report.purgeBelowBand.purged}/${report.purgeBelowBand.scanned}`
  );

  if (!dryRun) {
    await recomputeProductOracleSnapshotsBatch(new Set(WAVE0_FAILING_STARTERS));
    report.recomputedProducts = WAVE0_FAILING_STARTERS.length;
    console.log(
      `[burst:wave0-ingest] recomputed ${report.recomputedProducts} failing starters`
    );
  }

  if (!skipVerify) {
    report.verify = await verifyWave0();
    console.log(formatWave0Verify(report.verify));
  }

  if (closeDbAfter) {
    await closeDb();
  }

  return report;
}

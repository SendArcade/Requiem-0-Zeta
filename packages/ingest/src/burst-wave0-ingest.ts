/**
 * Targeted Wave 0 gap fill — B-110 / B-97 / B-104 only.
 * Mercari + Yahoo sold ingest → loose rematch → below-band purge → recompute → verify.
 * Run on Railway worker via BURST_WAVE0_INGEST=1 (no Apify).
 */
import { closeDb } from "@beyoracle/db";
import { buildWave0GapQueryPlan, WAVE0_FAILING_STARTERS } from "./burst-wave0-targets.js";
import {
  runBurstRematchGapWave0,
  runBurstRematchLooseWave0,
  runBurstRematchUnmatched,
} from "./burst-rematch-unmatched.js";
import { purgeWave0BelowBand } from "./burst-wave0-purge-below-band.js";
import { listProductBackfillSources } from "./product-backfill.js";
import { recomputeProductOracleSnapshotsBatch } from "./persist.js";
import { runSourceIngest } from "./source-ingest.js";
import { formatWave0Verify, verifyWave0 } from "./burst-wave0-verify-lib.js";
import type { SourceId } from "@beyoracle/shared";
import type { SourceIngestReport } from "./source-ingest.js";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sequentialSources(): boolean {
  return (
    process.env.WAVE0_INGEST_SEQUENTIAL !== "0" &&
    (process.env.BURST_WAVE0_LOOP === "1" || process.env.BURST_WAVE0_INGEST === "1" || process.env.WAVE0_INGEST_SEQUENTIAL === "1")
  );
}

async function runSourceIngestWithRetry(opts: {
  sourceId: SourceId;
  queries: string[];
  limitPerQuery: number;
  retries: number;
}): Promise<SourceIngestReport> {
  let last: SourceIngestReport | null = null;
  for (let attempt = 1; attempt <= opts.retries; attempt++) {
    try {
      last = await runSourceIngest({
        sourceId: opts.sourceId,
        queries: opts.queries,
        limitPerQuery: opts.limitPerQuery,
        recordRun: false,
      });
      if (last.errors.length === 0 || attempt === opts.retries) return last;
      console.warn(
        `[burst:wave0-ingest] ${opts.sourceId} batch retry ${attempt}/${opts.retries} (${last.errors.length} errors)`
      );
    } catch (err) {
      if (attempt === opts.retries) throw err;
      console.warn(
        `[burst:wave0-ingest] ${opts.sourceId} batch attempt ${attempt} failed: ${(err as Error).message}`
      );
    }
    await sleep(Number(process.env.WAVE0_INGEST_RETRY_PAUSE_MS ?? 5_000));
  }
  return last!;
}

async function ingestBatchForSources(
  sources: SourceId[],
  batch: string[],
  limitPerQuery: number,
  batchNum: number,
  report: BurstWave0IngestReport
): Promise<void> {
  const retries = Number(process.env.WAVE0_INGEST_RETRIES ?? 2);
  const runOne = async (sourceId: SourceId) => {
    const r = await runSourceIngestWithRetry({
      sourceId,
      queries: batch,
      limitPerQuery,
      retries,
    });
    report.inserted += r.inserted;
    report.updated += r.updated;
    report.matched += r.matched;
    report.ingestErrors.push(...r.errors);
    console.log(
      `[burst:wave0-ingest] ${r.sourceId} batch ${batchNum}: fetched=${r.listingsFetched} matched=${r.matched} inserted=${r.inserted}`
    );
  };

  if (sequentialSources()) {
    for (const sourceId of sources) {
      await runOne(sourceId);
    }
  } else {
    const results = await Promise.allSettled(sources.map((sourceId) => runOne(sourceId)));
    for (const result of results) {
      if (result.status === "rejected") {
        report.ingestErrors.push((result.reason as Error).message);
      }
    }
  }
}

export type BurstWave0IngestReport = {
  dryRun: boolean;
  queriesTotal: number;
  sourcesPolled: string[];
  inserted: number;
  updated: number;
  matched: number;
  ingestErrors: string[];
  rematchLoose: Awaited<ReturnType<typeof runBurstRematchLooseWave0>>;
  rematchGap: Awaited<ReturnType<typeof runBurstRematchGapWave0>>;
  rematchSealed: Awaited<ReturnType<typeof runBurstRematchUnmatched>>;
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
    rematchGap: {
      candidates: 0,
      scanned: 0,
      matched: 0,
      gateSkip: 0,
      nonBurst: 0,
      lowConf: 0,
      recomputedProducts: 0,
      samples: [],
    },
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
      const batchPauseMs = Number(process.env.WAVE0_INGEST_BATCH_PAUSE_MS ?? 3_000);

      for (let i = 0; i < queries.length; i += batchSize) {
        const batch = queries.slice(i, i + batchSize);
        const batchNum = Math.floor(i / batchSize) + 1;
        console.log(
          `[burst:wave0-ingest] ingest batch ${batchNum} (${batch.length} queries) sequential=${sequentialSources()}`
        );

        await ingestBatchForSources(sources, batch, limitPerQuery, batchNum, report);

        if (i + batchSize < queries.length && batchPauseMs > 0) {
          await sleep(batchPauseMs);
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

  report.rematchGap = await runBurstRematchGapWave0({ dryRun });
  console.log(
    `[burst:wave0-ingest] gap rematch matched=${report.rematchGap.matched}/${report.rematchGap.candidates}`
  );

  report.rematchSealed = await runBurstRematchUnmatched({ dryRun, wave0Only: true });
  console.log(
    `[burst:wave0-ingest] sealed rematch matched=${report.rematchSealed.matched}/${report.rematchSealed.candidates}`
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

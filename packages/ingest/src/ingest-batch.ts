import type { SourceId } from "@beyoracle/shared";
import { runSourceIngest, type SourceIngestReport } from "./source-ingest.js";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function ingestSequentialSources(): boolean {
  if (process.env.INGEST_SEQUENTIAL_SOURCES === "0") return false;
  if (process.env.INGEST_SEQUENTIAL_SOURCES === "1") return true;
  return (
    process.env.WAVE0_INGEST_SEQUENTIAL !== "0" &&
    (process.env.BURST_WAVE0_LOOP === "1" ||
      process.env.BURST_WAVE0_INGEST === "1" ||
      process.env.WAVE0_INGEST_SEQUENTIAL === "1" ||
      Boolean(process.env.GENERATION_ORACLE_LOOP?.trim()))
  );
}

export async function runSourceIngestWithRetry(opts: {
  sourceId: SourceId;
  queries: string[];
  limitPerQuery: number;
  retries?: number;
  logPrefix?: string;
  retryPauseMs?: number;
}): Promise<SourceIngestReport> {
  const retries = opts.retries ?? Number(process.env.INGEST_BATCH_RETRIES ?? 2);
  const prefix = opts.logPrefix ?? "ingest";
  let last: SourceIngestReport | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      last = await runSourceIngest({
        sourceId: opts.sourceId,
        queries: opts.queries,
        limitPerQuery: opts.limitPerQuery,
        recordRun: false,
      });
      if (last.errors.length === 0 || attempt === retries) return last;
      console.warn(
        `[${prefix}] ${opts.sourceId} retry ${attempt}/${retries} (${last.errors.length} errors)`
      );
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(
        `[${prefix}] ${opts.sourceId} attempt ${attempt} failed: ${(err as Error).message}`
      );
    }
    await sleep(
      opts.retryPauseMs ??
        Number(process.env.INGEST_BATCH_RETRY_PAUSE_MS ?? process.env.WAVE0_INGEST_RETRY_PAUSE_MS ?? 5_000)
    );
  }
  return last!;
}

export type IngestBatchTotals = {
  inserted: number;
  updated: number;
  matched: number;
  errors: string[];
  productsTouchedIds: string[];
};

export async function ingestQueryBatch(opts: {
  sources: SourceId[];
  queries: string[];
  limitPerQuery: number;
  batchNum: number;
  logPrefix: string;
  sequential?: boolean;
}): Promise<IngestBatchTotals> {
  const totals: IngestBatchTotals = {
    inserted: 0,
    updated: 0,
    matched: 0,
    errors: [],
    productsTouchedIds: [],
  };
  const touched = new Set<string>();
  const sequential = opts.sequential ?? ingestSequentialSources();

  const runOne = async (sourceId: SourceId) => {
    const r = await runSourceIngestWithRetry({
      sourceId,
      queries: opts.queries,
      limitPerQuery: opts.limitPerQuery,
      logPrefix: opts.logPrefix,
    });
    totals.inserted += r.inserted;
    totals.updated += r.updated;
    totals.matched += r.matched;
    totals.errors.push(...r.errors);
    for (const id of r.productsTouchedIds) touched.add(id);
    console.log(
      `[${opts.logPrefix}] ${r.sourceId} batch ${opts.batchNum}: fetched=${r.listingsFetched} matched=${r.matched} inserted=${r.inserted}`
    );
  };

  if (sequential) {
    for (const sourceId of opts.sources) {
      await runOne(sourceId);
    }
  } else {
    const results = await Promise.allSettled(opts.sources.map((sourceId) => runOne(sourceId)));
    for (const result of results) {
      if (result.status === "rejected") {
        totals.errors.push((result.reason as Error).message);
      }
    }
  }

  totals.productsTouchedIds = [...touched];
  return totals;
}

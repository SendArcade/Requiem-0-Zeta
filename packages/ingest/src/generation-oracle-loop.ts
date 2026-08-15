/**
 * Per-generation oracle backfill loop — rotating query batches until max iterations.
 * Railway: set GENERATION_ORACLE_LOOP=burst,plastic,metal for parallel multi-gen loops.
 */
import type { Generation } from "@beyoracle/shared";
import {
  buildProductBackfillQueryPlan,
  listPublishableProducts,
} from "./product-backfill-query-plan.js";
import { listProductBackfillSources } from "./product-backfill.js";
import { hashProductId } from "./product-backfill-shards.js";
import { ingestQueryBatch } from "./ingest-batch.js";
import { recomputeProductOracleSnapshotsBatch } from "./persist.js";
import { resetYahooLiveCircuitForWave0 } from "./adapters/yahoo-auctions-jp.js";

const ALL_GENS: Generation[] = ["plastic", "metal", "burst", "x"];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function parseGenerationOracleLoops(
  raw = process.env.GENERATION_ORACLE_LOOP
): Generation[] {
  const v = raw?.trim();
  if (!v) return [];
  if (v === "all" || v === "*") return ["plastic", "metal", "burst"];
  return v
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is Generation => (ALL_GENS as string[]).includes(s));
}

export type GenerationOracleLoopReport = {
  generation: Generation;
  batchLane: number;
  batchLaneCount: number;
  iterations: number;
  maxIterations: number;
  queriesPerIteration: number;
  totalInserted: number;
  totalUpdated: number;
  totalMatched: number;
  productsRecomputed: number;
  errors: string[];
};

function productIdsForLane(generation: Generation, lane: number, laneCount: number): Set<string> {
  const products = listPublishableProducts({ generations: [generation] });
  return new Set(
    products
      .filter((p) => hashProductId(p.id) % laneCount === lane)
      .map((p) => p.id)
  );
}

export async function runGenerationOracleLoop(opts: {
  generation: Generation;
  batchLane?: number;
  batchLaneCount?: number;
  maxIterations?: number;
  closeDb?: boolean;
}): Promise<GenerationOracleLoopReport> {
  const generation = opts.generation;
  const batchLane = opts.batchLane ?? Number(process.env.GENERATION_ORACLE_BATCH_LANE ?? 0);
  const batchLaneCount =
    opts.batchLaneCount ?? Number(process.env.GENERATION_ORACLE_BATCH_LANE_COUNT ?? 3);
  const maxIterations =
    opts.maxIterations ?? Number(process.env.GENERATION_ORACLE_LOOP_MAX ?? 6);
  const queryBatchSize = Number(process.env.GEN_ORACLE_QUERY_BATCH ?? 24);
  const batchPauseMs = Number(process.env.GEN_ORACLE_BATCH_PAUSE_MS ?? 4_000);
  const iterPauseMs = Number(process.env.GEN_ORACLE_ITER_PAUSE_MS ?? 20_000);
  const limitPerQuery = Number(process.env.INGEST_LIMIT_PER_QUERY ?? 25);
  const logPrefix = `gen-oracle:${generation}:lane${batchLane}`;

  const report: GenerationOracleLoopReport = {
    generation,
    batchLane,
    batchLaneCount,
    iterations: 0,
    maxIterations,
    queriesPerIteration: 0,
    totalInserted: 0,
    totalUpdated: 0,
    totalMatched: 0,
    productsRecomputed: 0,
    errors: [],
  };

  const laneProductIds = productIdsForLane(generation, batchLane, batchLaneCount);

  const allQueries = buildProductBackfillQueryPlan({
    generations: [generation],
    maxQueries: Number(process.env.GEN_ORACLE_MAX_QUERIES ?? 500),
  });

  console.log(
    `[${logPrefix}] start iterations=${maxIterations} queries=${allQueries.length} laneProducts=${laneProductIds.size}`
  );

  if (allQueries.length === 0) {
    report.errors.push(`${generation}: no queries generated`);
    return report;
  }

  const sources = listProductBackfillSources();
  if (sources.length === 0) {
    report.errors.push("No live sources enabled");
    return report;
  }

  for (let iter = 1; iter <= maxIterations; iter++) {
    report.iterations = iter;
    resetYahooLiveCircuitForWave0();

    const offset = ((iter - 1) * queryBatchSize) % allQueries.length;
    const queries = allQueries.slice(offset, offset + queryBatchSize);
    report.queriesPerIteration = queries.length;

    console.log(
      `[${logPrefix}] iteration ${iter}/${maxIterations} queries=${queries.length} offset=${offset}`
    );

    const innerBatch = Number(process.env.GEN_ORACLE_INNER_BATCH ?? 4);
    const touched = new Set<string>();

    for (let i = 0; i < queries.length; i += innerBatch) {
      const batch = queries.slice(i, i + innerBatch);
      const batchNum = Math.floor(i / innerBatch) + 1;

      const totals = await ingestQueryBatch({
        sources,
        queries: batch,
        limitPerQuery,
        batchNum,
        logPrefix,
      });

      report.totalInserted += totals.inserted;
      report.totalUpdated += totals.updated;
      report.totalMatched += totals.matched;
      report.errors.push(...totals.errors);
      for (const id of totals.productsTouchedIds) {
        if (laneProductIds.has(id)) touched.add(id);
      }

      if (i + innerBatch < queries.length && batchPauseMs > 0) {
        await sleep(batchPauseMs);
      }
    }

    if (touched.size > 0) {
      await recomputeProductOracleSnapshotsBatch(touched);
      report.productsRecomputed += touched.size;
    }

    console.log(
      `[${logPrefix}] iteration ${iter} done matched=${report.totalMatched} recomputed=${report.productsRecomputed}`
    );

    if (iter < maxIterations) {
      await sleep(iterPauseMs);
    }
  }

  if (opts.closeDb) {
    const { closeDb } = await import("@beyoracle/db");
    await closeDb();
  }

  return report;
}

export type MultiGenerationOracleLoopReport = {
  generations: Generation[];
  reports: GenerationOracleLoopReport[];
};

/** Run burst / plastic / metal loops in parallel (staggered start). */
export async function runMultiGenerationOracleLoops(opts?: {
  generations?: Generation[];
  staggerMs?: number;
  closeDb?: boolean;
}): Promise<MultiGenerationOracleLoopReport> {
  const generations =
    opts?.generations?.length
      ? opts.generations
      : parseGenerationOracleLoops().length
        ? parseGenerationOracleLoops()
        : (["burst", "plastic", "metal"] as Generation[]);
  const staggerMs = opts?.staggerMs ?? Number(process.env.GENERATION_ORACLE_STAGGER_MS ?? 45_000);
  const laneCount = Number(process.env.GENERATION_ORACLE_BATCH_LANE_COUNT ?? 3);

  console.log(
    `[gen-oracle:multi] start generations=${generations.join(",")} staggerMs=${staggerMs}`
  );

  const reports = await Promise.all(
    generations.map(async (generation, index) => {
      if (index > 0 && staggerMs > 0) {
        await sleep(index * staggerMs);
      }
      return runGenerationOracleLoop({
        generation,
        batchLane: index % laneCount,
        batchLaneCount: laneCount,
        closeDb: false,
      });
    })
  );

  console.log(`[gen-oracle:multi] all loops finished (${reports.length})`);
  for (const r of reports) {
    console.log(
      `[gen-oracle:multi] ${r.generation} matched=${r.totalMatched} inserted=${r.totalInserted} errors=${r.errors.length}`
    );
  }

  if (opts?.closeDb !== false) {
    const { closeDb } = await import("@beyoracle/db");
    await closeDb();
  }

  return { generations, reports };
}

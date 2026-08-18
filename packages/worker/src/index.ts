import { closeDb } from "@beyoracle/db";
import { closePublisher, getRedisUrl } from "@beyoracle/events";
import {
  bullmqWorkerLockOpts,
  CRON_TICK,
  CONTROL_QUEUE,
} from "@beyoracle/jobs";
import {
  registerOracleRecomputeEnqueuer,
  purgeBadComps,
  recomputeAllOracleSnapshots,
  runBurstWave0Maintenance,
  runBurstWave0Ingest,
  runBurstWave1Ingest,
  runBurstWave0Loop,
  runMultiGenerationOracleLoops,
  runOracleBackfill,
  runProductBackfill,
  runProductBackfillShard,
  parseShardCount,
  shouldRunOracleBackfill,
  sweepStaleIngestRuns,
  buildUsRetailQueryPlan,
  listEnabledSources,
  runSourceIngest,
  verifyWave0,
  formatWave0Verify,
  runWave0CompDiag,
} from "@beyoracle/ingest";
import { Worker, Queue } from "bullmq";
import { Redis } from "ioredis";
import { bootstrapDatabaseIfNeeded } from "./bootstrap.js";
import { dispatchCronTick, syncScheduledCronTick } from "./dispatch.js";
import { enqueueOracleRecompute } from "./enqueue-oracle.js";
import {
  enqueueProductBackfillFleet,
  parseProductBackfillGenerations,
} from "./enqueue-product-backfill.js";
import { handleJob, logJobMetrics } from "./handlers.js";

const INTERVAL_MS = Number(process.env.INGEST_INTERVAL_MS ?? 15 * 60 * 1000);
/** Higher concurrency when fleet-processing product backfill shards. */
const WORKER_CONCURRENCY = Number(
  process.env.WORKER_CONCURRENCY ??
    (process.env.PRODUCT_BACKFILL_FLEET === "1" || process.env.PRODUCT_BACKFILL_ENQUEUE === "1"
      ? 8
      : 2)
);

/** Process-local guard — one backfill kickoff per worker boot even if env is re-read. */
let backfillKickoffStarted = false;

async function main() {
  if (process.env.SKIP_DB_BOOTSTRAP !== "1") {
    await bootstrapDatabaseIfNeeded();
  }

  if (process.env.PURGE_BAD_COMPS === "1") {
    console.log("[worker] PURGE_BAD_COMPS=1 — re-validating persisted matches…");
    const generations = process.env.PURGE_GENERATIONS?.split(",").map((s) => s.trim()).filter(Boolean);
    const purged = await purgeBadComps({
      dryRun: process.env.PURGE_DRY_RUN === "1",
      deleteObservations: process.env.PURGE_DELETE_OBSERVATIONS === "1",
      generations: generations?.length ? (generations as import("@beyoracle/shared").Generation[]) : undefined,
      skipPartMatches: process.env.PURGE_SKIP_PART_MATCHES === "1",
    });
    console.log("[worker] purge complete:", JSON.stringify(purged));
  }

  if (process.env.BURST_WAVE0_MAINTENANCE === "1") {
    if (process.env.BURST_WAVE0_MAINTENANCE_DONE === "1") {
      console.log(
        "[worker] BURST_WAVE0_MAINTENANCE=1 but BURST_WAVE0_MAINTENANCE_DONE=1 — skip"
      );
    } else {
      console.log("[worker] BURST_WAVE0_MAINTENANCE=1 — Wave 0 purge/rematch/recompute…");
      const report = await runBurstWave0Maintenance({
        dryRun: process.env.BURST_WAVE0_DRY_RUN === "1",
      });
      console.log("[worker] wave0 maintenance complete:", JSON.stringify(report));
      console.log(
        "[worker] set BURST_WAVE0_MAINTENANCE_DONE=1 and unset BURST_WAVE0_MAINTENANCE after reviewing logs"
      );
    }
  }

  if (process.env.ORACLE_RECOMPUTE_ALL === "1") {
    console.log("[worker] ORACLE_RECOMPUTE_ALL=1 — recomputing oracle snapshots…");
    const recomputed = await recomputeAllOracleSnapshots();
    console.log("[worker] recompute complete:", JSON.stringify(recomputed));
  }

  if (process.env.PRODUCT_BACKFILL === "1") {
    // Static single-process backfill OR one shard of a static fleet.
    const shardCountEnv = process.env.PRODUCT_BACKFILL_SHARD_COUNT;
    const shardIdEnv = process.env.PRODUCT_BACKFILL_SHARD_ID;
    if (shardCountEnv != null && shardIdEnv != null) {
      const shardCount = parseShardCount(shardCountEnv);
      const shardId = Number(shardIdEnv);
      console.log(
        `[worker] PRODUCT_BACKFILL=1 static shard ${shardId}/${shardCount}…`
      );
      const report = await runProductBackfillShard({
        shardId,
        shardCount,
        generations: parseProductBackfillGenerations(),
        priorityOnly: process.env.PRODUCT_BACKFILL_PRIORITY_ONLY === "1",
        closeDb: false,
      });
      console.log("[worker] product backfill shard complete:", JSON.stringify(report));
    } else {
      console.log("[worker] PRODUCT_BACKFILL=1 — monolithic product backfill…");
      const productReport = await runProductBackfill({
        force: process.env.FORCE_PRODUCT_BACKFILL === "1",
        priorityOnly: process.env.PRODUCT_BACKFILL_PRIORITY_ONLY === "1",
        generations: parseProductBackfillGenerations(),
      });
      console.log("[worker] product backfill complete:", JSON.stringify(productReport));
    }
  }

  if (process.env.US_RETAIL_INGEST_BOOT === "1") {
    if (process.env.US_RETAIL_INGEST_BOOT_DONE === "1") {
      console.log(
        "[worker] US_RETAIL_INGEST_BOOT=1 but US_RETAIL_INGEST_BOOT_DONE=1 — skip"
      );
    } else {
      const sources = listEnabledSources();
      const queries = buildUsRetailQueryPlan({
        maxQueries: process.env.US_RETAIL_BOOT_MAX_QUERIES
          ? Number(process.env.US_RETAIL_BOOT_MAX_QUERIES)
          : undefined,
      });
      console.log(
        `[worker] US_RETAIL_INGEST_BOOT=1 — one-shot retail ingest for ${sources.join(", ") || "(none)"}`
      );
      for (const sourceId of sources) {
        const report = await runSourceIngest({
          sourceId,
          queries,
          recordRun: true,
        });
        console.log(`[worker] US retail boot ${sourceId}:`, JSON.stringify(report));
      }
      console.log(
        "[worker] set US_RETAIL_INGEST_BOOT_DONE=1 and unset US_RETAIL_INGEST_BOOT after reviewing logs"
      );
    }
  }

  const connection = new Redis(getRedisUrl(), { maxRetriesPerRequest: null });
  const queue = new Queue(CONTROL_QUEUE, { connection });

  registerOracleRecomputeEnqueuer((partIds: string[], reason: "ingest" | "manual" | "backfill", productIds?: string[]) =>
    enqueueOracleRecompute(queue, partIds, reason, productIds)
  );

  try {
    const swept = await sweepStaleIngestRuns();
    if (swept > 0) {
      console.log(`[worker] swept ${swept} stale ingest_runs on boot`);
    }
  } catch (err) {
    console.warn("[worker] sweepStaleIngestRuns failed:", (err as Error).message);
  }

  // Pause cron fan-out during fleet product backfill to free capacity for shards.
  // Must remove the Redis repeatable first — BACKFILL_PAUSE_CRON_INGEST=1 does not
  // otherwise stop `scheduled-cron-tick`, and the frozen Aug-5 tickId payload lives there.
  const pauseCron =
    process.env.BACKFILL_PAUSE_CRON_INGEST === "1" ||
    process.env.PRODUCT_BACKFILL_FLEET === "1";

  const cronSync = await syncScheduledCronTick(queue, {
    pause: pauseCron,
    intervalMs: INTERVAL_MS,
  });
  if (cronSync.added) {
    console.log(
      `[worker] ${CRON_TICK} every ${INTERVAL_MS / 1000}s on queue ${CONTROL_QUEUE} (${getRedisUrl()}) (removed ${cronSync.removed} prior repeatable)`
    );
  } else {
    console.log(
      `[worker] cron.tick paused (BACKFILL_PAUSE_CRON_INGEST or PRODUCT_BACKFILL_FLEET); removed ${cronSync.removed} repeatable scheduled-cron-tick`
    );
  }

  console.log(`[worker] concurrency=${WORKER_CONCURRENCY}`);

  const lockOpts = bullmqWorkerLockOpts(process.env);
  console.log(
    `[worker] lockDuration=${lockOpts.lockDuration}ms lockRenewTime=${lockOpts.lockRenewTime}ms`
  );

  const worker = new Worker(
    CONTROL_QUEUE,
    async (job) => {
      const started = Date.now();
      try {
        const result = await handleJob(job, queue);
        logJobMetrics({
          jobName: job.name,
          durationMs: Date.now() - started,
          outcome: "success",
        });
        return result;
      } catch (err) {
        logJobMetrics({
          jobName: job.name,
          durationMs: Date.now() - started,
          outcome: "failure",
        });
        throw err;
      }
    },
    {
      connection,
      concurrency: WORKER_CONCURRENCY,
      // Product shards run many live API calls — 10m lock stalled 26/31 observed.
      lockDuration: lockOpts.lockDuration,
      lockRenewTime: lockOpts.lockRenewTime,
      stalledInterval: Number(process.env.BULLMQ_STALLED_INTERVAL_MS ?? 60_000),
      maxStalledCount: 3,
    }
  );

  worker.on("failed", (job, err) => {
    console.error(`[worker] job ${job?.name}/${job?.id} failed:`, err.message);
  });

  if (process.env.BURST_WAVE0_VERIFY === "1") {
    if (process.env.BURST_WAVE0_VERIFY_DONE === "1") {
      console.log("[worker] BURST_WAVE0_VERIFY=1 but BURST_WAVE0_VERIFY_DONE=1 — skip");
    } else {
      void (async () => {
        try {
          console.log("[worker] BURST_WAVE0_VERIFY=1 — Diablo bar check (background)…");
          const report = await verifyWave0();
          for (const line of formatWave0Verify(report).split("\n")) {
            console.log(line);
          }
          console.log(
            "[worker] set BURST_WAVE0_VERIFY_DONE=1 and unset BURST_WAVE0_VERIFY after reviewing logs"
          );
        } catch (err) {
          console.error("[worker] BURST_WAVE0_VERIFY failed:", (err as Error).message);
        }
      })();
    }
  }

  const compDiag = process.env.BURST_WAVE0_COMP_DIAG?.trim();
  if (compDiag) {
    void (async () => {
      try {
        const ids =
          compDiag === "1"
            ? undefined
            : compDiag.split(",").map((s) => s.trim()).filter(Boolean);
        console.log(`[worker] BURST_WAVE0_COMP_DIAG — comp pool diagnostic…`);
        const reports = await runWave0CompDiag(ids);
        for (const report of reports) {
          console.log("[wave0:comp-diag]", JSON.stringify(report));
        }
      } catch (err) {
        console.error("[worker] BURST_WAVE0_COMP_DIAG failed:", (err as Error).message);
      }
    })();
  }

  if (process.env.BURST_WAVE0_LOOP === "1") {
    if (process.env.BURST_WAVE0_LOOP_DONE === "1") {
      console.log("[worker] BURST_WAVE0_LOOP=1 but BURST_WAVE0_LOOP_DONE=1 — skip");
    } else {
      void (async () => {
        try {
          console.log("[worker] BURST_WAVE0_LOOP=1 — autonomous Wave 0 loop (background)…");
          const report = await runBurstWave0Loop({
            dryRun: process.env.BURST_WAVE0_DRY_RUN === "1",
            closeDb: false,
          });
          console.log("[worker] wave0 loop complete:", JSON.stringify(report));
          console.log(
            "[worker] set BURST_WAVE0_LOOP_DONE=1 and unset BURST_WAVE0_LOOP after reviewing logs"
          );
        } catch (err) {
          console.error("[worker] BURST_WAVE0_LOOP failed:", (err as Error).message);
        }
      })();
    }
  }

  if (process.env.GENERATION_ORACLE_LOOP?.trim()) {
    if (process.env.GENERATION_ORACLE_LOOP_DONE === "1") {
      console.log(
        "[worker] GENERATION_ORACLE_LOOP set but GENERATION_ORACLE_LOOP_DONE=1 — skip"
      );
    } else {
      void (async () => {
        try {
          console.log(
            `[worker] GENERATION_ORACLE_LOOP=${process.env.GENERATION_ORACLE_LOOP} — parallel gen loops (background)…`
          );
          const report = await runMultiGenerationOracleLoops({ closeDb: false });
          console.log("[worker] generation oracle loops complete:", JSON.stringify(report));
          console.log(
            "[worker] set GENERATION_ORACLE_LOOP_DONE=1 and unset GENERATION_ORACLE_LOOP after reviewing logs"
          );
        } catch (err) {
          console.error("[worker] GENERATION_ORACLE_LOOP failed:", (err as Error).message);
        }
      })();
    }
  }

  if (process.env.BURST_WAVE0_INGEST === "1") {
    if (process.env.BURST_WAVE0_INGEST_DONE === "1") {
      console.log("[worker] BURST_WAVE0_INGEST=1 but BURST_WAVE0_INGEST_DONE=1 — skip");
    } else {
      void (async () => {
        try {
          console.log(
            "[worker] BURST_WAVE0_INGEST=1 — targeted gap ingest (background, B-97/B-104/B-110)…"
          );
          const report = await runBurstWave0Ingest({
            dryRun: process.env.BURST_WAVE0_DRY_RUN === "1",
            skipIngest: process.env.BURST_WAVE0_SKIP_INGEST === "1",
            skipVerify: process.env.BURST_WAVE0_SKIP_VERIFY === "1",
            closeDb: false,
          });
          console.log("[worker] wave0 ingest complete:", JSON.stringify(report));
          console.log(
            "[worker] set BURST_WAVE0_INGEST_DONE=1 and unset BURST_WAVE0_INGEST after reviewing logs"
          );
        } catch (err) {
          console.error("[worker] BURST_WAVE0_INGEST failed:", (err as Error).message);
        }
      })();
    }
  }

  if (process.env.BURST_WAVE1_INGEST === "1") {
    if (process.env.BURST_WAVE1_INGEST_DONE === "1") {
      console.log("[worker] BURST_WAVE1_INGEST=1 but BURST_WAVE1_INGEST_DONE=1 — skip");
    } else {
      void (async () => {
        try {
          console.log(
            "[worker] BURST_WAVE1_INGEST=1 — Wave 1 burst expansion (B-01/B-102/B-168 + sealed rows)…"
          );
          const report = await runBurstWave1Ingest({
            dryRun: process.env.BURST_WAVE1_DRY_RUN === "1",
            skipIngest: process.env.BURST_WAVE1_SKIP_INGEST === "1",
            closeDb: false,
          });
          console.log("[worker] wave1 ingest complete:", JSON.stringify(report));
          console.log(
            "[worker] set BURST_WAVE1_INGEST_DONE=1 and unset BURST_WAVE1_INGEST after reviewing logs"
          );
        } catch (err) {
          console.error("[worker] BURST_WAVE1_INGEST failed:", (err as Error).message);
        }
      })();
    }
  }

  if (!pauseCron) {
    await dispatchCronTick(queue, {
      triggeredAt: new Date().toISOString(),
    });
  }

  // Fleet mode: enqueue all product.backfill.shard jobs once; every replica drains the queue.
  // Set PRODUCT_BACKFILL_ENQUEUE=1 on a single replica (or one-shot) to avoid double-enqueue races
  // (jobIds are idempotent, so double enqueue is safe but noisy).
  // Default generations = burst (Wave 0+1 identity recut). Set PRODUCT_BACKFILL_GENERATIONS=all for full catalog.
  if (
    (process.env.PRODUCT_BACKFILL_ENQUEUE === "1" ||
      process.env.PRODUCT_BACKFILL_FLEET === "1") &&
    process.env.PRODUCT_BACKFILL_ENQUEUE_DONE !== "1"
  ) {
    const generations = parseProductBackfillGenerations();
    try {
      const result = await enqueueProductBackfillFleet(queue, {
        shardCount: parseShardCount(process.env.PRODUCT_BACKFILL_SHARD_COUNT),
        generations,
        priorityOnly: process.env.PRODUCT_BACKFILL_PRIORITY_ONLY === "1",
        maxQueriesPerShard: process.env.PRODUCT_BACKFILL_MAX_QUERIES
          ? Number(process.env.PRODUCT_BACKFILL_MAX_QUERIES)
          : undefined,
      });
      console.log("[worker] product backfill fleet enqueued:", JSON.stringify(result));
    } catch (err) {
      console.error(
        "[worker] product backfill fleet enqueue failed:",
        (err as Error).message
      );
    }
  }

  if (process.env.ORACLE_BACKFILL === "1" && !backfillKickoffStarted) {
    backfillKickoffStarted = true;
    void shouldRunOracleBackfill()
      .then((ok: boolean) => {
        if (!ok) {
          console.log(
            "[worker] ORACLE_BACKFILL=1 but backfill already done/in progress — skip"
          );
          return undefined;
        }
        console.log("[worker] ORACLE_BACKFILL=1 — starting catalog backfill in background…");
        return runOracleBackfill({
          maxQueries: process.env.BACKFILL_MAX_QUERIES
            ? Number(process.env.BACKFILL_MAX_QUERIES)
            : undefined,
          skipLiveIngest: process.env.SKIP_LIVE === "1",
        });
      })
      .then((report: Awaited<ReturnType<typeof runOracleBackfill>> | undefined) => {
        if (report) {
          console.log("[worker] oracle backfill complete:", JSON.stringify(report));
        }
      })
      .catch((err: Error) => {
        console.error("[worker] oracle backfill failed:", err.message);
      });
  }

  const shutdown = async () => {
    console.log("[worker] shutting down…");
    await worker.close();
    await queue.close();
    await connection.quit();
    await closePublisher();
    await closeDb();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch(async (err) => {
  console.error("[worker] fatal:", err);
  await closePublisher();
  await closeDb();
  process.exit(1);
});

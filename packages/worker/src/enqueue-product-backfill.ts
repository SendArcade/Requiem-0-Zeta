/**
 * Enqueue product.backfill.shard jobs for the full catalog fleet.
 * Idempotent jobIds — safe to re-run (BullMQ dedupes by jobId while pending/active).
 *
 * Next fleet pass is Burst-only (Wave 0+1 identity recut). Override with
 * PRODUCT_BACKFILL_GENERATIONS=all (or plastic,metal,burst,x) for the full catalog.
 * Do not write venue yen as marks.
 */
import {
  bullmqOptsForJob,
  CONTROL_QUEUE,
  PRODUCT_BACKFILL_SHARD,
  parseJobPayload,
} from "@beyoracle/jobs";
import {
  assertShardPartition,
  buildProductBackfillShardJobs,
  parseShardCount,
} from "@beyoracle/ingest";
import type { Generation } from "@beyoracle/shared";
import type { Queue } from "bullmq";
import type { Redis } from "ioredis";
import { parseProductBackfillGenerations } from "./backfill-generations.js";

export { parseProductBackfillGenerations } from "./backfill-generations.js";

const ENQUEUE_CLAIM_PREFIX = "beyoracle:product-backfill-enqueued:";

/** One enqueue per run id — survives redeploys without PRODUCT_BACKFILL_ENQUEUE_DONE env churn. */
export async function claimProductBackfillFleetEnqueue(
  redis: Redis,
  runId: string
): Promise<boolean> {
  const key = `${ENQUEUE_CLAIM_PREFIX}${runId}`;
  const result = await redis.set(key, new Date().toISOString(), "EX", 60 * 60 * 24 * 14, "NX");
  return result === "OK";
}

/** Drop waiting/delayed product.backfill.shard jobs. With keepRunId, only removes other runs. */
export async function drainProductBackfillShardJobs(
  queue: Queue,
  opts?: { keepRunId?: string }
): Promise<number> {
  const waiting = await queue.getJobs(["waiting", "delayed", "paused"]);
  const keepPrefix = opts?.keepRunId?.trim()
    ? `product-backfill-shard-${opts.keepRunId.trim()}-`
    : undefined;
  let removed = 0;
  for (const job of waiting) {
    if (job.name !== PRODUCT_BACKFILL_SHARD) continue;
    if (keepPrefix && String(job.id ?? "").startsWith(keepPrefix)) continue;
    await job.remove();
    removed++;
  }
  if (removed > 0) {
    console.log(
      `[worker] drained ${removed} stale ${PRODUCT_BACKFILL_SHARD} jobs` +
        (keepPrefix ? ` (kept ${keepPrefix}*)` : "")
    );
  }
  return removed;
}

export async function enqueueProductBackfillFleet(
  queue: Queue,
  opts?: {
    shardCount?: number;
    generations?: Generation[];
    priorityOnly?: boolean;
    maxQueriesPerShard?: number;
  }
): Promise<{ shardCount: number; enqueued: number; totalProducts: number }> {
  const shardCount = parseShardCount(opts?.shardCount);
  const parsedGenerations = opts?.generations ?? parseProductBackfillGenerations();
  // Always persist explicit gens on the job — env `all` must not become ["all"] in workers.
  const generations =
    parsedGenerations ??
    (["plastic", "metal", "burst", "x"] as Generation[]);
  const partition = assertShardPartition(shardCount, {
    generations,
    priorityOnly: opts?.priorityOnly,
  });

  const jobs = buildProductBackfillShardJobs({
    shardCount,
    generations,
    priorityOnly: opts?.priorityOnly,
    maxQueriesPerShard: opts?.maxQueriesPerShard,
    runId: process.env.PRODUCT_BACKFILL_RUN_ID,
  });

  let enqueued = 0;
  for (const j of jobs) {
    const data = parseJobPayload(PRODUCT_BACKFILL_SHARD, j.data);
    await queue.add(PRODUCT_BACKFILL_SHARD, data, {
      jobId: j.jobId,
      ...bullmqOptsForJob(PRODUCT_BACKFILL_SHARD),
    });
    enqueued++;
  }

  console.log(
    `[worker] enqueued ${enqueued} ${PRODUCT_BACKFILL_SHARD} jobs ` +
      `(shardCount=${shardCount}, products=${partition.total}, queue=${CONTROL_QUEUE})`
  );

  return {
    shardCount,
    enqueued,
    totalProducts: partition.total,
  };
}

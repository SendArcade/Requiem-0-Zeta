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
import { parseProductBackfillGenerations } from "./backfill-generations.js";

export { parseProductBackfillGenerations } from "./backfill-generations.js";

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
  const generations = opts?.generations ?? parseProductBackfillGenerations();
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

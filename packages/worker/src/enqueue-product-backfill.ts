/**
 * Enqueue product.backfill.shard jobs for the full catalog fleet.
 * Idempotent jobIds — safe to re-run (BullMQ dedupes by jobId while pending/active).
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
  const partition = assertShardPartition(shardCount, {
    generations: opts?.generations,
    priorityOnly: opts?.priorityOnly,
  });

  const jobs = buildProductBackfillShardJobs({
    shardCount,
    generations: opts?.generations,
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

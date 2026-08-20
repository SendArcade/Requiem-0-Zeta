/**
 * One-shot: enqueue product.backfill.shard jobs into Redis (no worker boot required).
 *
 *   railway run --service worker pnpm --filter @beyoracle/worker enqueue:fleet
 */
import { getRedisUrl } from "@beyoracle/events";
import { CONTROL_QUEUE } from "@beyoracle/jobs";
import { parseShardCount } from "@beyoracle/ingest";
import { Queue } from "bullmq";
import { Redis } from "ioredis";
import { parseProductBackfillGenerations } from "../backfill-generations.js";
import { enqueueProductBackfillFleet } from "../enqueue-product-backfill.js";

function resolveMaxQueriesPerShard(): number | undefined {
  const raw = process.env.PRODUCT_BACKFILL_MAX_QUERIES?.trim();
  if (!raw) return undefined;
  const n = Number(raw);
  return n > 0 ? n : undefined;
}

async function main() {
  const redisUrl = getRedisUrl();
  if (!redisUrl || redisUrl.includes("localhost")) {
    console.error("[enqueue:fleet] REDIS_URL missing or local — run on Railway worker service");
    process.exit(1);
  }

  const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });
  const queue = new Queue(CONTROL_QUEUE, { connection });

  try {
    const result = await enqueueProductBackfillFleet(queue, {
      shardCount: parseShardCount(process.env.PRODUCT_BACKFILL_SHARD_COUNT),
      generations: parseProductBackfillGenerations(),
      priorityOnly: process.env.PRODUCT_BACKFILL_PRIORITY_ONLY === "1",
      maxQueriesPerShard: resolveMaxQueriesPerShard(),
    });
    console.log("[enqueue:fleet] ok:", JSON.stringify(result));
  } finally {
    await queue.close();
    await connection.quit();
  }
}

main().catch((err) => {
  console.error("[enqueue:fleet] failed:", (err as Error).message);
  process.exit(1);
});

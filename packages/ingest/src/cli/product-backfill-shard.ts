/**
 * Run one product-backfill shard (CLI / static Railway replica).
 *
 *   PRODUCT_BACKFILL_SHARD_ID=3 PRODUCT_BACKFILL_SHARD_COUNT=32 \
 *     pnpm --filter @beyoracle/ingest exec tsx src/cli/product-backfill-shard.ts
 */
import {
  parseShardCount,
  parseShardId,
  runProductBackfillShard,
} from "../product-backfill-shards.js";

async function main() {
  const shardCount = parseShardCount(process.env.PRODUCT_BACKFILL_SHARD_COUNT);
  const shardId = parseShardId(process.env.PRODUCT_BACKFILL_SHARD_ID, shardCount);
  const gensRaw = process.env.PRODUCT_BACKFILL_GENERATIONS?.trim();
  const generations = gensRaw
    ? (gensRaw.split(",").map((s) => s.trim()).filter(Boolean) as Array<
        "plastic" | "metal" | "burst" | "x"
      >)
    : undefined;

  const report = await runProductBackfillShard({
    shardId,
    shardCount,
    generations,
    priorityOnly: process.env.PRODUCT_BACKFILL_PRIORITY_ONLY === "1",
    maxQueries: process.env.PRODUCT_BACKFILL_MAX_QUERIES
      ? Number(process.env.PRODUCT_BACKFILL_MAX_QUERIES)
      : undefined,
    closeDb: true,
  });
  console.log(JSON.stringify(report, null, 2));
  if (report.errors.length && report.productsTargeted === 0) process.exit(1);
}

main().catch((err) => {
  console.error("[product-backfill-shard] failed:", (err as Error).message);
  process.exit(1);
});

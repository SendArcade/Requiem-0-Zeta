/**
 * Print fleet plan: shard counts, products per shard, sample product IDs.
 *
 *   PRODUCT_BACKFILL_SHARD_COUNT=64 pnpm --filter @beyoracle/ingest exec tsx src/cli/product-backfill-fleet-plan.ts
 */
import {
  assertShardPartition,
  listProductsForShard,
  parseShardCount,
} from "../product-backfill-shards.js";

function main() {
  const shardCount = parseShardCount(process.env.PRODUCT_BACKFILL_SHARD_COUNT ?? 32);
  const gensRaw = process.env.PRODUCT_BACKFILL_GENERATIONS?.trim();
  const generations = gensRaw
    ? (gensRaw.split(",").map((s) => s.trim()).filter(Boolean) as Array<
        "plastic" | "metal" | "burst" | "x"
      >)
    : (["plastic", "metal", "burst", "x"] as const);

  const partition = assertShardPartition(shardCount, {
    generations: [...generations],
  });

  console.log(
    JSON.stringify(
      {
        shardCount,
        generations,
        totalPublishableProducts: partition.total,
        emptyShards: partition.emptyShards,
        minPerShard: Math.min(...partition.perShard),
        maxPerShard: Math.max(...partition.perShard),
        avgPerShard: Number((partition.total / shardCount).toFixed(1)),
        perShard: partition.perShard,
        sampleShard0: listProductsForShard(0, shardCount, {
          generations: [...generations],
        })
          .slice(0, 5)
          .map((p) => ({ id: p.id, gen: p.generation, sku: p.skuType })),
        railwayHint: {
          enqueue:
            "PRODUCT_BACKFILL_ENQUEUE=1 PRODUCT_BACKFILL_FLEET=1 PRODUCT_BACKFILL_SHARD_COUNT=64 MERCARI_API_ENABLED=1 BACKFILL_PAUSE_CRON_INGEST=1 WORKER_CONCURRENCY=8",
          scale: "Scale worker service replicas (e.g. 16–64); each drains product.backfill.shard jobs",
          after: "PRODUCT_BACKFILL_ENQUEUE_DONE=1 or unset PRODUCT_BACKFILL_ENQUEUE; run purge:bad-comps",
        },
      },
      null,
      2
    )
  );
}

main();

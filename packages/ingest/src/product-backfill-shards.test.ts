import { describe, expect, it } from "vitest";
import {
  assertShardPartition,
  buildProductBackfillShardJobs,
  buildShardQueryPlan,
  hashProductId,
  listProductsForShard,
  parseShardCount,
  productShardIndex,
  PRODUCT_BACKFILL_SHARD_JOB,
} from "./product-backfill-shards.js";
import { listPublishableProducts } from "./product-backfill-query-plan.js";
import { MATCH_AUTO_ACCEPT_THRESHOLD } from "./match-confidence-routing.js";

describe("product backfill shards", () => {
  it("hashes product ids stably", () => {
    const a = hashProductId("prod-metal-bb-28-starter");
    const b = hashProductId("prod-metal-bb-28-starter");
    expect(a).toBe(b);
    expect(a).toBeGreaterThanOrEqual(0);
  });

  it(
    "assigns each product to exactly one shard (partition)",
    () => {
      const shardCount = 17;
      const partition = assertShardPartition(shardCount);
      expect(partition.total).toBeGreaterThan(100);
      const sum = partition.perShard.reduce((a, b) => a + b, 0);
      expect(sum).toBe(partition.total);

      // Single pass: no product maps to two shards
      const all = listPublishableProducts({
        generations: ["plastic", "metal", "burst", "x"],
      });
      const bucket = new Map<string, number>();
      for (const p of all) {
        const s = productShardIndex(p.id, shardCount);
        expect(bucket.has(p.id)).toBe(false);
        bucket.set(p.id, s);
      }
      expect(bucket.size).toBe(all.length);
      expect(listProductsForShard(0, shardCount).every((p) => bucket.get(p.id) === 0)).toBe(
        true
      );
    },
    30_000
  );

  it("shard query plan only targets that shard's products", () => {
    const shardCount = 8;
    const { products, queries } = buildShardQueryPlan(3, shardCount, {
      maxQueries: 40,
    });
    expect(products.every((p) => productShardIndex(p.id, shardCount) === 3)).toBe(
      true
    );
    expect(queries.length).toBeGreaterThan(0);
    expect(queries.length).toBeLessThanOrEqual(40);
  });

  it("buildProductBackfillShardJobs covers 0..N-1 with stable jobIds", () => {
    const jobs = buildProductBackfillShardJobs({ shardCount: 5 });
    expect(jobs).toHaveLength(5);
    expect(jobs.map((j) => j.data.shardId)).toEqual([0, 1, 2, 3, 4]);
    expect(jobs.every((j) => j.name === PRODUCT_BACKFILL_SHARD_JOB)).toBe(true);
    expect(jobs[0]!.jobId).toBe("product-backfill-shard-v1-5-0");
  });

  it("parseShardCount rejects invalid counts", () => {
    expect(() => parseShardCount(0)).toThrow();
    expect(() => parseShardCount(-1)).toThrow();
    expect(parseShardCount(32)).toBe(32);
  });

  it("fleet defaults include all generations for full catalog", () => {
    const all = listPublishableProducts();
    const gens = new Set(all.map((p) => p.generation));
    expect(gens.has("plastic")).toBe(true);
    expect(gens.has("metal")).toBe(true);
    expect(gens.has("burst")).toBe(true);
    expect(gens.has("x")).toBe(true);
  });

  it("precision floor for product persist remains auto-accept ≥0.9", () => {
    // Guardrail: fleet must never lower the auto-accept bar.
    expect(MATCH_AUTO_ACCEPT_THRESHOLD).toBeGreaterThanOrEqual(0.9);
  });
});

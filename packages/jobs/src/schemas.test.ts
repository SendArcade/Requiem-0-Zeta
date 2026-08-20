import { describe, expect, it } from "vitest";
import { parseJobPayload, PRODUCT_BACKFILL_SHARD } from "./index.js";

describe("productBackfillShardPayload maxQueries", () => {
  const base = { shardId: 0, shardCount: 64 };

  it("accepts positive maxQueries", () => {
    const data = parseJobPayload(PRODUCT_BACKFILL_SHARD, { ...base, maxQueries: 100 });
    expect(data.maxQueries).toBe(100);
  });

  it("treats maxQueries=0 as unlimited (omit from parsed output)", () => {
    const data = parseJobPayload(PRODUCT_BACKFILL_SHARD, { ...base, maxQueries: 0 });
    expect(data.maxQueries).toBeUndefined();
  });

  it("accepts missing maxQueries", () => {
    const data = parseJobPayload(PRODUCT_BACKFILL_SHARD, base);
    expect(data.maxQueries).toBeUndefined();
  });
});

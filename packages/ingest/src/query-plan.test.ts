import { describe, it, expect, afterEach } from "vitest";
import { buildIngestQueryPlan, resetIngestQueryPlanCache } from "./query-plan.js";
import { SCHEDULED_INGEST_QUERIES } from "./queries.js";

describe("buildIngestQueryPlan", () => {
  afterEach(() => {
    resetIngestQueryPlanCache();
  });

  it("always includes seed queries in the first slice", () => {
    const plan = buildIngestQueryPlan({ maxQueries: 20, sliceIndex: 0 });
    for (const seed of SCHEDULED_INGEST_QUERIES) {
      expect(plan.some((q) => q.includes(seed) || seed.includes(q))).toBe(true);
    }
  });

  it("rotates slices without exceeding maxQueries", () => {
    const a = buildIngestQueryPlan({ maxQueries: 8, sliceIndex: 0 });
    const b = buildIngestQueryPlan({ maxQueries: 8, sliceIndex: 1 });
    expect(a.length).toBeLessThanOrEqual(8);
    expect(b.length).toBeLessThanOrEqual(8);
    expect(a.join("|")).not.toBe(b.join("|"));
  });

  it("includes whole-SKU English product queries in rotation", () => {
    const plan = buildIngestQueryPlan({ maxQueries: 20, sliceIndex: 0 });
    const hasProductQuery = plan.some(
      (q) => (/starter/i.test(q) && /BX-|B-/i.test(q)) || /Beyblade X/i.test(q)
    );
    expect(hasProductQuery).toBe(true);
  });
});

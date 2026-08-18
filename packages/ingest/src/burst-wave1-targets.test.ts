import { describe, expect, it } from "vitest";
import { buildWave1QueryPlan } from "./burst-wave1-targets.js";
import { WAVE1_BURST_PRODUCTS } from "./burst-wave1-ids.js";

describe("buildWave1QueryPlan", () => {
  it("generates queries for Wave 1 expansion SKUs", () => {
    const plan = buildWave1QueryPlan({ maxQueries: 200 });
    expect(plan.length).toBeGreaterThan(10);
    expect(plan.some((q) => /B-01/i.test(q))).toBe(true);
    expect(plan.some((q) => /B-102/i.test(q))).toBe(true);
    expect(plan.some((q) => /B-168/i.test(q))).toBe(true);
    expect(plan.some((q) => /未開封|sealed/i.test(q))).toBe(true);
  });

  it("covers all Wave 1 product ids in catalog targets", () => {
    expect(WAVE1_BURST_PRODUCTS.length).toBe(14);
    expect(WAVE1_BURST_PRODUCTS).toContain("prod-burst-b-01-sealed");
    expect(WAVE1_BURST_PRODUCTS).toContain("prod-burst-b-34-sealed");
  });
});

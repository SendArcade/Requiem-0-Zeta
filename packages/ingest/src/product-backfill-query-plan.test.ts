import { describe, expect, it } from "vitest";
import {
  buildProductBackfillQueryPlan,
  buildProductBackfillTargets,
  listPublishableProducts,
  PRIORITY_PRODUCT_IDS,
} from "./product-backfill-query-plan.js";

describe("buildProductBackfillQueryPlan", () => {
  it("defaults to full-catalog publishable complete SKUs (all gens)", () => {
    const products = listPublishableProducts();
    const gens = new Set(products.map((p) => p.generation));
    expect(gens.has("plastic")).toBe(true);
    expect(gens.has("metal")).toBe(true);
    expect(gens.has("burst")).toBe(true);
    expect(gens.has("x")).toBe(true);
    expect(products.every((p) =>
      p.skuType === "starter" ||
      p.skuType === "complete_loose" ||
      p.skuType === "complete_sealed"
    )).toBe(true);
  });

  it("includes English starter queries for plastic/metal anchors", () => {
    const plan = buildProductBackfillQueryPlan({
      priorityOnly: true,
      maxQueries: 200,
    });
    expect(plan.some((q) => /BB-01S/i.test(q) && /starter/i.test(q))).toBe(true);
    expect(plan.some((q) => /BB-28/i.test(q))).toBe(true);
    expect(plan.some((q) => /Beyblade Plastic/i.test(q) && /Dragoon/i.test(q))).toBe(true);
    expect(plan.some((q) => /Metal Fight/i.test(q) && /Pegasus/i.test(q))).toBe(true);
  });

  it("includes Japanese whole-SKU terms", () => {
    const plan = buildProductBackfillQueryPlan({
      priorityOnly: true,
      maxQueries: 200,
    });
    expect(plan.some((q) => /スターター|完成品/.test(q))).toBe(true);
  });

  it("respects maxQueries cap", () => {
    const plan = buildProductBackfillQueryPlan({ maxQueries: 25, generations: ["metal"] });
    expect(plan.length).toBeLessThanOrEqual(25);
  });

  it("builds per-product targets for priority SKUs", () => {
    const targets = buildProductBackfillTargets({ priorityOnly: true });
    expect(targets.length).toBeGreaterThan(0);
    expect(targets.length).toBeLessThanOrEqual(PRIORITY_PRODUCT_IDS.length);
    expect(targets[0]?.queries.length).toBeGreaterThan(3);
    const gens = new Set(targets.map((t) => t.generation));
    expect(gens.has("plastic") || gens.has("metal") || gens.has("burst")).toBe(true);
  });

  it("can still target X when explicitly requested", () => {
    const products = listPublishableProducts({ generations: ["x"], maxProducts: 5 });
    expect(products.length).toBeGreaterThan(0);
    expect(products.every((p) => p.generation === "x")).toBe(true);
  });
});

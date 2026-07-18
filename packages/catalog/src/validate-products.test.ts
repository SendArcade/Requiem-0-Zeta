import { describe, expect, it } from "vitest";
import { validateProductRecipes } from "./validate-products.js";

describe("validateProductRecipes", () => {
  it("has zero assembled SKUs missing required slots", () => {
    const issues = validateProductRecipes();
    const missing = issues.filter((i) => i.kind === "missing_slot");
    expect(missing).toEqual([]);
  });

  it("reports burst layer-only SKUs as partial (not missing_slot)", () => {
    const issues = validateProductRecipes();
    expect(issues.filter((i) => i.kind === "partial_recipe")).toHaveLength(0);
    expect(issues.filter((i) => i.productId.includes("cho-z"))).toHaveLength(0);
  });
});

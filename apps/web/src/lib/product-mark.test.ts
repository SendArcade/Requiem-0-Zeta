import { describe, expect, it } from "vitest";
import { hasPublishedProductMark } from "./product-data";

describe("hasPublishedProductMark", () => {
  it("returns true when comps meet publish floor with usable confidence", () => {
    expect(hasPublishedProductMark({ nComps: 3, confidence: "medium" })).toBe(true);
    expect(hasPublishedProductMark({ nComps: 5, confidence: "high" })).toBe(true);
  });

  it("returns false when below publish floor or low confidence", () => {
    expect(hasPublishedProductMark({ nComps: 2, confidence: "medium" })).toBe(false);
    expect(hasPublishedProductMark({ nComps: 0, confidence: "low" })).toBe(false);
    expect(hasPublishedProductMark({ nComps: 10, confidence: "low" })).toBe(false);
  });
});

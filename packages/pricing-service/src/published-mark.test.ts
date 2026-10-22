import { afterEach, describe, expect, it } from "vitest";
import { hasPublishedMark } from "./published-mark.js";

describe("hasPublishedMark", () => {
  afterEach(() => {
    delete process.env.PUBLISHED_MIN_COMPS;
  });

  it("returns true when comps meet strict publish floor with usable confidence", () => {
    process.env.PUBLISHED_MIN_COMPS = "3";
    expect(hasPublishedMark({ nComps: 3, confidence: "medium" })).toBe(true);
    expect(hasPublishedMark({ nComps: 5, confidence: "high" })).toBe(true);
  });

  it("returns false in strict mode when below publish floor or low confidence", () => {
    process.env.PUBLISHED_MIN_COMPS = "3";
    expect(hasPublishedMark({ nComps: 2, confidence: "medium" })).toBe(false);
    expect(hasPublishedMark({ nComps: 0, confidence: "low" })).toBe(false);
    expect(hasPublishedMark({ nComps: 10, confidence: "low" })).toBe(false);
  });

  it("breadth mode publishes sparse marks with low stored confidence", () => {
    process.env.PUBLISHED_MIN_COMPS = "1";
    expect(hasPublishedMark({ nComps: 1, confidence: "low" })).toBe(true);
    expect(hasPublishedMark({ nComps: 2, confidence: "low" })).toBe(true);
  });
});

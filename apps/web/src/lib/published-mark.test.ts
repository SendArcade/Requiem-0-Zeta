import { describe, expect, it } from "vitest";
import { hasPublishedMark } from "./published-mark";

describe("hasPublishedMark", () => {
  it("returns true when comps meet publish floor with usable confidence", () => {
    expect(hasPublishedMark({ nComps: 3, confidence: "medium" })).toBe(true);
    expect(hasPublishedMark({ nComps: 5, confidence: "high" })).toBe(true);
  });

  it("returns false when below publish floor or low confidence", () => {
    expect(hasPublishedMark({ nComps: 2, confidence: "medium" })).toBe(false);
    expect(hasPublishedMark({ nComps: 0, confidence: "low" })).toBe(false);
    expect(hasPublishedMark({ nComps: 10, confidence: "low" })).toBe(false);
  });
});

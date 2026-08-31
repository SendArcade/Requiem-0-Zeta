import { afterEach, describe, expect, it } from "vitest";
import {
  hasPublishedMark,
  isOkayishPublishComp,
  resolveOracleConfidence,
  resolvePublishedMinComps,
} from "./index.js";

describe("isOkayishPublishComp", () => {
  it("allows any auto-accept comp when minComps > 1", () => {
    expect(isOkayishPublishComp({ method: "alias", confidence: 0.91 }, 3)).toBe(true);
  });

  it("breadth mode accepts any matcher auto-accept comp (≥0.90)", () => {
    expect(isOkayishPublishComp({ method: "product_code", confidence: 0.9 }, 1)).toBe(true);
    expect(isOkayishPublishComp({ method: "alias", confidence: 0.91 }, 1)).toBe(true);
    expect(isOkayishPublishComp({ method: "alias_fuzzy", confidence: 0.89 }, 1)).toBe(false);
  });
});

describe("resolveOracleConfidence", () => {
  afterEach(() => {
    delete process.env.PUBLISHED_MIN_COMPS;
  });

  it("strict mode uses comp count density", () => {
    expect(resolveOracleConfidence(2, { minComps: 3 })).toBe("low");
    expect(resolveOracleConfidence(3, { minComps: 3 })).toBe("medium");
    expect(resolveOracleConfidence(8, { minComps: 3 })).toBe("high");
  });

  it("breadth mode uses best match quality, not volume", () => {
    expect(
      resolveOracleConfidence(1, { minComps: 1, maxMatchConfidence: 0.98 })
    ).toBe("high");
    expect(
      resolveOracleConfidence(1, { minComps: 1, maxMatchConfidence: 0.91 })
    ).toBe("medium");
    expect(
      resolveOracleConfidence(5, { minComps: 1, maxMatchConfidence: 0.88 })
    ).toBe("low");
  });
});

describe("hasPublishedMark", () => {
  afterEach(() => {
    delete process.env.PUBLISHED_MIN_COMPS;
  });

  it("strict mode requires n≥3 and non-low confidence", () => {
    process.env.PUBLISHED_MIN_COMPS = "3";
    expect(resolvePublishedMinComps()).toBe(3);
    expect(hasPublishedMark({ nComps: 3, confidence: "medium" })).toBe(true);
    expect(hasPublishedMark({ nComps: 2, confidence: "medium" })).toBe(false);
    expect(hasPublishedMark({ nComps: 4, confidence: "low" })).toBe(false);
  });

  it("breadth mode publishes any mark at or above min comps", () => {
    process.env.PUBLISHED_MIN_COMPS = "1";
    expect(hasPublishedMark({ nComps: 1, confidence: "low" })).toBe(true);
    expect(hasPublishedMark({ nComps: 2, confidence: "low" })).toBe(true);
    expect(hasPublishedMark({ nComps: 0, confidence: "medium" })).toBe(false);
  });
});

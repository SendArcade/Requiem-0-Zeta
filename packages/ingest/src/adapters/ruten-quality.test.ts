import { describe, expect, it, beforeEach, afterEach } from "vitest";
import type { RutenItem } from "./ruten/client.js";
import {
  classifyRutenListing,
  RUTEN_MIN_SOLD_WEAK_COMP,
} from "./ruten-quality.js";

const baseItem: RutenItem = {
  gNo: "123",
  title: "戰鬥陀螺X",
  priceTwd: 1000,
  soldCount: 0,
  url: "https://www.ruten.com.tw/item/show?123",
};

describe("classifyRutenListing", () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
    delete process.env.RUTEN_WEAK_COMPS;
  });

  afterEach(() => {
    process.env = env;
  });

  it("fixtures are full-weight sold comps", () => {
    const m = classifyRutenListing(baseItem, { fixture: true });
    expect(m.status).toBe("sold");
    expect(m.compEligible).toBe(true);
    expect(m.venueWeightMultiplier).toBe(1);
  });

  it("live ask listings are not comp-eligible by default", () => {
    const m = classifyRutenListing({ ...baseItem, soldCount: 10 });
    expect(m.status).toBe("listing");
    expect(m.compEligible).toBe(false);
    expect(m.priceKind).toBe("ask");
  });

  it("promotes to weak sold_proxy when RUTEN_WEAK_COMPS=1 and soldCount threshold met", () => {
    process.env.RUTEN_WEAK_COMPS = "1";
    const m = classifyRutenListing({
      ...baseItem,
      soldCount: RUTEN_MIN_SOLD_WEAK_COMP,
    });
    expect(m.status).toBe("sold");
    expect(m.compEligible).toBe(true);
    expect(m.priceKind).toBe("sold_proxy");
    expect(m.venueWeightMultiplier).toBe(0.35);
  });
});

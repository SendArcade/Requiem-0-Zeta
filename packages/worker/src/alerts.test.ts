import { describe, expect, it } from "vitest";
import { dropPct } from "./alerts.js";

describe("dropPct", () => {
  it("computes percent drop from baseline", () => {
    expect(dropPct(1000, 900)).toBeCloseTo(10);
    expect(dropPct(1000, 850)).toBeCloseTo(15);
    expect(dropPct(1000, 1000)).toBeCloseTo(0);
  });
});

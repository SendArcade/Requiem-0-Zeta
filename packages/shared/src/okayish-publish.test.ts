import { describe, expect, it } from "vitest";
import { isOkayishPublishComp } from "./index.js";

describe("isOkayishPublishComp", () => {
  it("allows any auto-accept comp when minComps > 1", () => {
    expect(isOkayishPublishComp({ method: "alias", confidence: 0.91 }, 3)).toBe(true);
  });

  it("okayish n=1 requires product_code or ≥0.95", () => {
    expect(isOkayishPublishComp({ method: "product_code", confidence: 0.9 }, 1)).toBe(true);
    expect(isOkayishPublishComp({ method: "alias", confidence: 0.95 }, 1)).toBe(true);
    expect(isOkayishPublishComp({ method: "alias", confidence: 0.91 }, 1)).toBe(false);
    expect(isOkayishPublishComp({ method: "fuzzy", confidence: 0.92 }, 1)).toBe(false);
  });
});

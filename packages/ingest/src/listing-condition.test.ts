import { describe, expect, it } from "vitest";
import { inferConditionFromTitle, resolveListingCondition } from "./types.js";

describe("inferConditionFromTitle", () => {
  it("maps sealed title cues including 未開封 to sealed", () => {
    expect(inferConditionFromTitle("Beyblade Burst 未開封")).toBe("sealed");
    expect(inferConditionFromTitle("B-01 Valkyrie 新品")).toBe("sealed");
    expect(inferConditionFromTitle("Winning Valkyrie MIB")).toBe("sealed");
    expect(inferConditionFromTitle("B-86 Legend Spriggan 未使用")).toBe("sealed");
    expect(inferConditionFromTitle("Valkyrie sealed NIB")).toBe("sealed");
    expect(inferConditionFromTitle("new in box starter")).toBe("sealed");
  });
});

describe("resolveListingCondition", () => {
  it("title sealed cues override marketplace used", () => {
    expect(resolveListingCondition("Mercari 未開封 starter", "used")).toBe("sealed");
    expect(resolveListingCondition("新品 未使用 B-34", "used")).toBe("sealed");
    expect(resolveListingCondition("Winning Valkyrie MIB", "used")).toBe("sealed");
    expect(resolveListingCondition("used with scratches", "used")).toBe("used");
    expect(resolveListingCondition("B-01 Valkyrie", "used")).toBe("used");
    expect(resolveListingCondition("B-01 Valkyrie")).toBe("unknown");
  });

  it("title 開封/中古 overrides Yahoo marketplace sealed", () => {
    expect(
      resolveListingCondition("B-104 スターター ウイニングヴァルキリー 開封 中古", "sealed")
    ).toBe("used");
    expect(resolveListingCondition("B-110 スターター 中古", "sealed")).toBe("used");
  });
});

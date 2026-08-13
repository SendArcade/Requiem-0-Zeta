import { describe, expect, it } from "vitest";
import { MercariJpSource } from "./adapters/mercari-jp.js";
import {
  inferConditionFromTitle,
  resolveListingCondition,
} from "./types.js";

describe("inferConditionFromTitle", () => {
  it("maps 未開封 / 新品 / MIB / 未使用 to sealed", () => {
    expect(inferConditionFromTitle("ベイブレード スターター 未開封")).toBe("sealed");
    expect(inferConditionFromTitle("B-34 新品 未使用")).toBe("sealed");
    expect(inferConditionFromTitle("Winning Valkyrie MIB")).toBe("sealed");
    expect(inferConditionFromTitle("Victory Valkyrie 未使用")).toBe("sealed");
  });
});

describe("resolveListingCondition", () => {
  it("lets title 未開封 win over marketplace used", () => {
    expect(
      resolveListingCondition("ベイブレードバースト スターター 未開封", "used")
    ).toBe("sealed");
    expect(resolveListingCondition("B-34 Victory Valkyrie MIB", "used")).toBe("sealed");
    expect(resolveListingCondition("中古 傷あり", "used")).toBe("used");
    expect(resolveListingCondition("Dran Sword", undefined)).toBe("unknown");
  });
});

describe("Mercari normalize", () => {
  it("does not let API used override 未開封 in the title", () => {
    const src = new MercariJpSource();
    const obs = src.normalize({
      externalId: "m-unsealed-title",
      title: "ベイブレードバースト B-34 スターター 未開封",
      price: 3980,
      currency: "JPY",
      status: "sold",
      condition: "used",
      url: "https://jp.mercari.com/item/m-unsealed-title",
      observedAt: new Date().toISOString(),
      raw: { live: true },
    });
    expect(obs.condition).toBe("sealed");
  });
});

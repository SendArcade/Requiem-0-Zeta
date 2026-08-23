import { describe, expect, it, beforeAll } from "vitest";
import { loadMatcherContext, loadProductMatcherContext } from "@beyoracle/catalog";
import { isStaleOrWrongMatch } from "./purge-bad-comps.js";

describe("purge match re-validation", () => {
  beforeAll(() => {
    loadMatcherContext();
    loadProductMatcherContext();
  }, 30_000);

  it("flags non-Beyblade titles", () => {
    expect(
      isStaleOrWrongMatch("Foundation Addict jeans A01", "part", "x-bx-01-blade", 0.95)
    ).toBe(true);
  });

  it("flags bulk lots for part comps", () => {
    expect(
      isStaleOrWrongMatch("ベイブレード まとめ 10個", "part", "burst-b-168-layer", 0.95)
    ).toBe(true);
  });

  it("flags loose single matched as whole product", () => {
    expect(
      isStaleOrWrongMatch(
        "B-168 レイヤー 単品 中古",
        "product",
        "prod-burst-b-168-starter",
        0.92
      )
    ).toBe(true);
  });

  it("accepts valid whole-SKU product match", () => {
    expect(
      isStaleOrWrongMatch(
        "ベイブレードX BX-01 ドランソード スターター 3-60F タカラトミー",
        "product",
        "prod-x-bx-01-starter",
        0.95
      )
    ).toBe(false);
  }, 15_000);

  it("flags low-confidence persisted rows", () => {
    expect(
      isStaleOrWrongMatch(
        "BX-01 ドランソード ブレード 中古",
        "part",
        "x-bx-01-blade",
        0.75
      )
    ).toBe(true);
  });
});

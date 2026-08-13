import { describe, expect, it } from "vitest";
import type { ProductDTO } from "./index.js";
import {
  DEFAULT_ORACLE_CONDITIONS,
  isLiveMarketplaceComp,
  PRODUCT_ORACLE_WINDOW_DAYS,
  productMarkConditions,
} from "./index.js";
import { analyzeProductRecipe, inferRecipeKind } from "./product-recipe.js";

const xStarter: ProductDTO = {
  id: "prod-x-bx-01-starter",
  generation: "x",
  skuType: "starter",
  nameEn: "Dran Sword Starter",
  nameJp: "ドランソード スターター",
  productCodes: ["BX-01"],
  attrs: { combo: "3-60F" },
  partIds: ["x-bx-01-blade", "x-bx-05-ratchet", "x-bx-06-bit"],
};

const xParts = [
  { id: "x-bx-01-blade", partType: "blade", nameEn: "Dran Sword" },
  { id: "x-bx-05-ratchet", partType: "ratchet", nameEn: "3-60" },
  { id: "x-bx-06-bit", partType: "bit", nameEn: "Flat" },
];

describe("product recipe", () => {
  it("infers assembled for starter SKUs", () => {
    expect(inferRecipeKind(xStarter)).toBe("assembled");
  });

  it("marks complete X starter as publishable", () => {
    const analysis = analyzeProductRecipe(xStarter, xParts);
    expect(analysis.isComplete).toBe(true);
    expect(analysis.canPublishMark).toBe(true);
    expect(analysis.missingSlots).toEqual([]);
  });

  it("blocks partial burst layer-only SKUs", () => {
    const partial: ProductDTO = {
      ...xStarter,
      id: "prod-burst-layer-only",
      generation: "burst",
      skuType: "complete_loose",
      attrs: { recipe: "layer_only" },
      partIds: ["burst-b-34-layer"],
    };
    const analysis = analyzeProductRecipe(partial, [
      { id: "burst-b-34-layer", partType: "layer", nameEn: "Winning Valkyrie" },
    ]);
    expect(analysis.recipeKind).toBe("partial");
    expect(analysis.canPublishMark).toBe(false);
    expect(analysis.missingSlots).toContain("forge_disc");
  });

  it("blocks sealed box contents from publishing whole-Bey marks", () => {
    const sealed: ProductDTO = {
      ...xStarter,
      id: "prod-x-bx-00-sealed",
      skuType: "sealed",
      partIds: ["x-bx-01-blade", "x-bx-02-blade", "x-bx-03-blade"],
    };
    const analysis = analyzeProductRecipe(sealed, xParts);
    expect(analysis.recipeKind).toBe("contents");
    expect(analysis.canPublishMark).toBe(false);
  });
});

describe("productMarkConditions", () => {
  it("uses sealed-only pool for complete_sealed", () => {
    expect(productMarkConditions("complete_sealed")).toEqual(["sealed"]);
  });

  it("uses used secondary pool for complete_loose", () => {
    expect(productMarkConditions("complete_loose")).toEqual(DEFAULT_ORACLE_CONDITIONS);
  });

  it("keeps starter marks on opened starter+launcher (excludes sealed)", () => {
    expect(productMarkConditions("starter")).toEqual(DEFAULT_ORACLE_CONDITIONS);
    expect(productMarkConditions("starter")).not.toContain("sealed");
    expect(productMarkConditions("complete_loose")).toEqual(DEFAULT_ORACLE_CONDITIONS);
  });
});

describe("live product mark gates (shared)", () => {
  it("rejects fixture rawJson", () => {
    expect(isLiveMarketplaceComp({ fixture: true })).toBe(false);
    expect(isLiveMarketplaceComp({ fixture: false })).toBe(true);
    expect(isLiveMarketplaceComp({ live: true })).toBe(true);
  });

  it("uses multi-month product window", () => {
    expect(PRODUCT_ORACLE_WINDOW_DAYS).toBeGreaterThanOrEqual(180);
  });
});

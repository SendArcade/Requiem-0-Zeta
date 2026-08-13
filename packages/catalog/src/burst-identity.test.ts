import { describe, expect, it } from "vitest";
import { loadParts, loadProducts } from "./load.js";

function productsForCode(code: string) {
  return loadProducts().filter(
    (p) => p.generation === "burst" && p.productCodes.includes(code)
  );
}

function assembled(code: string) {
  return productsForCode(code).filter((p) => p.attrs?.recipeKind === "assembled");
}

const THREE_KEYS = ["starter", "complete_loose", "sealed"] as const;

describe("Burst catalog identity", () => {
  it("keeps Victory on B-34 and Winning on B-104 (rename-and-split)", () => {
    const b34 = assembled("B-34");
    const b104 = assembled("B-104");
    expect(b34.map((p) => p.skuType).sort()).toEqual([...THREE_KEYS].sort());
    expect(b104.map((p) => p.skuType).sort()).toEqual([...THREE_KEYS].sort());
    expect(b34.every((p) => /Victory Valkyrie/i.test(p.nameEn))).toBe(true);
    expect(b34.every((p) => !/Winning/i.test(p.nameEn))).toBe(true);
    expect(b104.every((p) => /Winning Valkyrie/i.test(p.nameEn))).toBe(true);
    const victory = b34.find((p) => p.skuType === "starter");
    expect(victory?.attrs?.combo).toMatch(/Boost Variable/i);
    expect(victory?.partIds).toContain("burst-layer-victory-valkyrie");
    expect(victory?.partIds).not.toContain("burst-b-34-layer");
    const winning = b104.find((p) => p.skuType === "starter");
    expect(winning?.attrs?.combo).toMatch(/12 Volcanic/i);
    expect(winning?.partIds).toContain("burst-b-34-layer");
  });

  it("maps B-86 to Legend Spriggan 7 Merge and Achilles to B-129", () => {
    const b86 = assembled("B-86");
    const b129 = assembled("B-129");
    expect(b86.every((p) => /Legend Spriggan/i.test(p.nameEn))).toBe(true);
    expect(b86.every((p) => !/Achilles/i.test(p.nameEn))).toBe(true);
    expect(b86.find((p) => p.skuType === "starter")?.attrs?.combo).toMatch(/7 Merge/i);
    expect(b129.every((p) => /Cho-Z Achilles/i.test(p.nameEn))).toBe(true);
    expect(b129.map((p) => p.skuType).sort()).toEqual([...THREE_KEYS].sort());
  });

  it("maps B-97 to Nightmare Longinus and Heaven Pegasus to B-148", () => {
    const b97 = assembled("B-97");
    const b148 = assembled("B-148");
    expect(b97.every((p) => /Nightmare Longinus/i.test(p.nameEn))).toBe(true);
    expect(b97.every((p) => !/Heaven|Pegasus/i.test(p.nameEn))).toBe(true);
    expect(b148.every((p) => /Heaven Pegasus/i.test(p.nameEn))).toBe(true);
  });

  it("maps B-110 to Bloody Longinus, not Spriggan Requiem (B-100)", () => {
    const b110 = assembled("B-110");
    const b100 = assembled("B-100");
    expect(b110.every((p) => /Bloody Longinus/i.test(p.nameEn))).toBe(true);
    expect(b110.every((p) => !/Spriggan Requiem/i.test(p.nameEn))).toBe(true);
    expect(b100.some((p) => /Spriggan Requiem/i.test(p.nameEn))).toBe(true);
  });

  it("maps B-127 to Cho-Z Valkyrie.Z.Ev, not Cho-Z Spriggan (B-128)", () => {
    const b127 = assembled("B-127");
    const b128 = assembled("B-128");
    expect(b127.every((p) => /Cho-Z Valkyrie/i.test(p.nameEn))).toBe(true);
    expect(b127.every((p) => !/Spriggan/i.test(p.nameEn))).toBe(true);
    expect(b127.find((p) => p.skuType === "starter")?.partIds).toContain("burst-disc-z");
    expect(b128.some((p) => /Cho-Z Spriggan/i.test(p.nameEn))).toBe(true);
  });

  it("keeps B-01 as Wing Accel DX three keys only and does not fold B-29 into B-01", () => {
    const b01 = assembled("B-01");
    expect(b01.map((p) => p.skuType).sort()).toEqual([...THREE_KEYS].sort());
    expect(b01.every((p) => p.attrs?.combo === "Wing Accel")).toBe(true);
    expect(b01.every((p) => !/booster/i.test(p.id))).toBe(true);
    const b29 = productsForCode("B-29");
    expect(b29.every((p) => !p.productCodes.includes("B-01"))).toBe(true);
  });

  it("treats B-102 Twin Nemesis and B-168 Rage Longinus as booster SKUs", () => {
    const b102 = assembled("B-102");
    const b168 = assembled("B-168");
    expect(b102.every((p) => /Twin Nemesis/i.test(p.nameEn))).toBe(true);
    expect(b102.every((p) => p.skuType !== "starter")).toBe(true);
    expect(b102.map((p) => p.skuType).sort()).toEqual(["complete_loose", "sealed"]);
    expect(b168.every((p) => /Rage Longinus/i.test(p.nameEn))).toBe(true);
    expect(b168.every((p) => p.skuType !== "starter")).toBe(true);
    expect(assembled("B-131").some((p) => /Dead Phoenix/i.test(p.nameEn))).toBe(true);
    expect(assembled("B-180").some((p) => /Dynamite Belial/i.test(p.nameEn))).toBe(true);
  });

  it("moves Geist Fafnir to B-122 and vacates B-115", () => {
    expect(assembled("B-115")).toEqual([]);
    const b122 = assembled("B-122");
    expect(b122.every((p) => /Geist Fafnir/i.test(p.nameEn))).toBe(true);
    expect(b122.every((p) => p.skuType !== "complete_sealed")).toBe(true);
  });

  it("collapses Burst complete_sealed into sealed (no booster-sealed / rb-sealed)", () => {
    const burst = loadProducts().filter((p) => p.generation === "burst");
    expect(burst.every((p) => p.skuType !== "complete_sealed")).toBe(true);
    expect(burst.every((p) => !["booster-sealed", "rb-sealed"].includes(p.skuType))).toBe(true);
  });

  it("does not attach Winning aliases to the Victory B-34 layer", () => {
    const parts = loadParts();
    const victory = parts.find((p) => p.id === "burst-layer-victory-valkyrie");
    const winning = parts.find((p) => p.id === "burst-b-34-layer");
    expect(victory?.productCodes).toContain("B-34");
    expect(victory?.nameEn).toMatch(/Victory/i);
    expect(winning?.productCodes).toContain("B-104");
    expect(winning?.productCodes).not.toContain("B-34");
    expect(winning?.nameEn).toMatch(/Winning/i);
  });
});

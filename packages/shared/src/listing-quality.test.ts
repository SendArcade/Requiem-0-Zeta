import { describe, expect, it } from "vitest";
import {
  countStrongBeyMatchSignals,
  isBeybladeAccessoryListing,
  isNonBeybladeJunk,
} from "./listing-quality.js";
import { classifyListingShape, isProductCompEligible, looksLikeBeybladeListing } from "./shape.js";

describe("listing-quality garbage patterns", () => {
  it("blocks Honda/Shimano/nav junk", () => {
    expect(isNonBeybladeJunk("BB12 【ディオ FI AF68】プーリー ホンダ")).toBe(true);
    expect(isNonBeybladeJunk("SRAM X0 BB30 MTB シマノ")).toBe(true);
    expect(isNonBeybladeJunk("Panasonic Strada (BB12)")).toBe(true);
    expect(isNonBeybladeJunk("BAOBAO ISSEY MIYAKE BB71-AG053")).toBe(true);
  });

  it("blocks accessory listings", () => {
    expect(isBeybladeAccessoryListing("BB51 エクストリームベイスタジアム")).toBe(true);
    expect(isBeybladeAccessoryListing("BB60 ランダムブースター ロックリブラ")).toBe(true);
    expect(isBeybladeAccessoryListing("BX-01 スターター ドランソード")).toBe(false);
  });

  it("rejects accessories and junk at shape layer", () => {
    expect(looksLikeBeybladeListing("BB51 エクストリームベイスタジアム")).toBe(false);
    expect(isProductCompEligible("BB51 エクストリームベイスタジアム")).toBe(false);
  });

  it("blocks bare X combo without catalog/bey context (UX-16 loose parts)", () => {
    expect(classifyListingShape("9-65B 単品 ビット")).toBe("single_part");
    expect(isProductCompEligible("9-65B 単品")).toBe(false);
    expect(classifyListingShape("UX-16 クロックミラージュ 9-65B スターター")).toBe(
      "complete_bey"
    );
  });

  it("allows Metal Fight bare BB with bey + character/combo", () => {
    expect(looksLikeBeybladeListing("メタルファイトベイブレード BB30 ロックレオーネ 145WB")).toBe(
      true
    );
    expect(
      isProductCompEligible("メタルファイトベイブレード BB30 ロックレオーネ 145WB")
    ).toBe(true);
  });
});

describe("strong match signals", () => {
  it("scores best-match titles higher", () => {
    const best = countStrongBeyMatchSignals(
      "ベイブレードX BX-01 スターター ドランソード3-60F タカラトミー"
    );
    const weak = countStrongBeyMatchSignals("BX01");
    expect(best).toBeGreaterThan(weak);
    expect(best).toBeGreaterThanOrEqual(4);
  });
});

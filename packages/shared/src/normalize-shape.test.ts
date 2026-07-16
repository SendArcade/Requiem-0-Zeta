import { describe, expect, it } from "vitest";
import { matchKeys, normalizeForMatch, normalizedContains } from "./normalize-match.js";
import {
  classifyListingShape,
  isCompEligible,
  isIngestEligible,
  looksLikeBeybladeListing,
  looksLikeBundle,
} from "./shape.js";

describe("classifyListingShape", () => {
  it("classifies lots", () => {
    expect(classifyListingShape("BX-01 ドランソード まとめ売り 10個")).toBe("lot");
    expect(classifyListingShape("070C ベイブレード まとめ BEYBLADE X ドランソード")).toBe("lot");
    expect(looksLikeBundle("BX-01 ドランソード まとめ売り 10個")).toBe(true);
  });

  it("rejects non-beyblade fashion listings", () => {
    expect(
      looksLikeBeybladeListing("【A01】【ファンデーションアディクト デニムパンツ S】ns")
    ).toBe(false);
  });

  it("accepts listings with beyblade signal or catalog SKU", () => {
    expect(looksLikeBeybladeListing("ベイブレードX BX-01 スターター")).toBe(true);
    expect(looksLikeBeybladeListing("BX-01 ドランソード 美品")).toBe(true);
  });

  it("classifies complete beys as ingest-eligible", () => {
    expect(classifyListingShape("ベイブレードX BX-01 スターター")).toBe("complete_bey");
    expect(isIngestEligible("ベイブレードX BX-01 スターター")).toBe(true);
    expect(isCompEligible("ベイブレードX BX-01 スターター")).toBe(false);
  });

  it("classifies single parts", () => {
    expect(classifyListingShape("ベイブレードX ドランソード 3-60F 単品")).toBe("single_part");
    expect(isCompEligible("ベイブレードX ドランソード 3-60F 単品")).toBe(true);
  });

  it("classifies English complete + product code as complete_bey", () => {
    expect(classifyListingShape("Heaven Pegasus B-97 complete used")).toBe("complete_bey");
    expect(classifyListingShape("BB-28 Storm Pegasus complete")).toBe("complete_bey");
  });

  it("classifies plastic/metal complete Japanese titles", () => {
    expect(classifyListingShape("BB-01S ドラグーンS 完成品 中古")).toBe("complete_bey");
    expect(classifyListingShape("BB-28 ストームペガサス 105RF スターター")).toBe("complete_bey");
    expect(classifyListingShape("BB-28 まとめ 5点")).toBe("lot");
  });
});

describe("normalizeForMatch", () => {
  it("folds Traditional to Simplified Chinese", () => {
    const trad = normalizeForMatch("龍劍");
    const simp = normalizeForMatch("龙剑");
    expect(trad).toBe(simp);
    expect(normalizedContains("戰鬥陀螺x 龙剑 3-60f", "龍劍")).toBe(true);
  });

  it("emits romaji match keys for Japanese", () => {
    const keys = matchKeys("ドランソード");
    expect(keys.some((k) => k.includes("doran") || k.includes("ドラン"))).toBe(true);
  });

  it("does not false-match short haystack fragments inside romaji needles", () => {
    expect(
      normalizedContains(
        "【A01】【ファンデーションアディクト デニムパンツ S】ns",
        "ドランソード"
      )
    ).toBe(false);
  });
});

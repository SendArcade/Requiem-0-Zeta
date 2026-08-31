import { describe, expect, it } from "vitest";
import { matchKeys, normalizeForMatch, normalizedContains } from "./normalize-match.js";
import {
  classifyListingShape,
  isCompEligible,
  isIngestEligible,
  isProductCompEligible,
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

  it("rejects car model kit false positives with bare B-code + 完成品", () => {
    expect(looksLikeBeybladeListing("【完成品】B-02 アオシマ 1/24 330セドリック")).toBe(false);
    expect(looksLikeBeybladeListing("【完成品】B-05 ハセガワ 1/24 スカイライン")).toBe(false);
    expect(looksLikeBeybladeListing("【完成品】B-07 タミヤ 1/24 フェアレディZ")).toBe(false);
    expect(isProductCompEligible("【完成品】B-02 アオシマ 1/24 330セドリック")).toBe(false);
  });

  it("rejects bare B-code listings without beyblade context", () => {
    expect(looksLikeBeybladeListing("トヨタ ヘッドランプ B-104 中古")).toBe(false);
    expect(looksLikeBeybladeListing("フジミ 1/144 模型 B-03")).toBe(false);
    expect(looksLikeBeybladeListing("Levis 501 B-131 ジーンズ")).toBe(false);
    expect(looksLikeBeybladeListing("DENSO B-03 センサー")).toBe(false);
    expect(looksLikeBeybladeListing("B-104 美品")).toBe(false);
  });

  it("accepts burst listings with context beyond bare B-code", () => {
    expect(looksLikeBeybladeListing("B-34 ヴァルキリー 完成品 未開封")).toBe(true);
    expect(looksLikeBeybladeListing("Heaven Pegasus B-97 complete used")).toBe(true);
    expect(looksLikeBeybladeListing("ベイブレードバースト B-104 スターター")).toBe(true);
  });

  it("rejects bare BB## without beyblade context (Shimano/Honda/nav collisions)", () => {
    expect(looksLikeBeybladeListing("BB12 【ディオ FI AF68】プーリー ホンダ")).toBe(false);
    expect(looksLikeBeybladeListing("Panasonic Strada CN-E330D (BB12)")).toBe(false);
    expect(looksLikeBeybladeListing("SRAM X0 カーボンクランク BB30 MTB")).toBe(false);
    expect(looksLikeBeybladeListing("BAOBAO ISSEY MIYAKE BB71-AG053")).toBe(false);
    expect(looksLikeBeybladeListing("BB12 80s フランス軍 フィールドジャケット")).toBe(false);
  });

  it("rejects stadium and random booster accessory listings", () => {
    expect(isProductCompEligible("BB51 エクストリームベイスタジアム")).toBe(false);
    expect(isProductCompEligible("BB44 ランダムブースター Vol.4")).toBe(false);
  });

  it("accepts bare BB## when beyblade context is present", () => {
    expect(looksLikeBeybladeListing("BB28 ストームペガシス 105RF スターター")).toBe(true);
    expect(looksLikeBeybladeListing("メタルファイト BB28 完成品")).toBe(true);
  });

  it("does not classify Honda BB12 parts as complete bey", () => {
    expect(classifyListingShape("BB12 【ディオ FI AF68】プーリー ホンダ")).toBe("single_part");
    expect(isIngestEligible("BB12 【ディオ FI AF68】プーリー ホンダ")).toBe(true);
    expect(isCompEligible("BB12 【ディオ FI AF68】プーリー ホンダ")).toBe(true);
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
    expect(classifyListingShape("ベイブレード B-34 まとめ")).toBe("lot");
    expect(classifyListingShape("ベイブレードバースト B-34 2個")).toBe("lot");
    expect(isIngestEligible("ベイブレードバースト B-34 2個")).toBe(false);
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

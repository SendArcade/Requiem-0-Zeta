import { describe, expect, it } from "vitest";
import { classifyListingShape, isCompEligible, looksLikeBundle } from "@beyoracle/shared";
import { createDpopProof, generateDpopKeyPair } from "./dpop.js";
import { conditionFromMercariId, mercariItemUrl } from "./client.js";

describe("dpop proof", () => {
  it("produces a three-segment ES256 JWT with the public JWK inlined", () => {
    const proof = createDpopProof(
      generateDpopKeyPair(),
      "https://api.mercari.jp/v2/entities:search",
      "POST"
    );

    const segments = proof.split(".");
    expect(segments).toHaveLength(3);

    const header = JSON.parse(
      Buffer.from(segments[0]!, "base64url").toString()
    );
    expect(header.alg).toBe("ES256");
    expect(header.typ).toBe("dpop+jwt");
    expect(header.jwk.crv).toBe("P-256");
    expect(header.jwk.x).toBeTruthy();

    const payload = JSON.parse(
      Buffer.from(segments[1]!, "base64url").toString()
    );
    expect(payload.htm).toBe("POST");
    expect(payload.htu).toContain("api.mercari.jp");

    // ES256 signatures are the raw r||s pair: 64 bytes.
    expect(Buffer.from(segments[2]!, "base64url")).toHaveLength(64);
  });

  it("uses a fresh jti per proof", () => {
    const keys = generateDpopKeyPair();
    const url = "https://api.mercari.jp/v2/entities:search";
    const jti = (proof: string) =>
      JSON.parse(Buffer.from(proof.split(".")[1]!, "base64url").toString()).jti;

    expect(jti(createDpopProof(keys, url, "POST"))).not.toBe(
      jti(createDpopProof(keys, url, "POST"))
    );
  });
});

describe("mercari field mapping", () => {
  it("maps condition ids onto the shared condition axis", () => {
    expect(conditionFromMercariId(1)).toBe("sealed");
    expect(conditionFromMercariId(2)).toBe("like_new");
    expect(conditionFromMercariId(4)).toBe("used");
    expect(conditionFromMercariId(undefined)).toBe("unknown");
    expect(conditionFromMercariId(99)).toBe("unknown");
  });

  it("builds canonical item urls", () => {
    expect(mercariItemUrl("m12345")).toBe("https://jp.mercari.com/item/m12345");
  });
});

describe("bundle detection", () => {
  it("flags real multi-item sold titles seen on Mercari", () => {
    const bundles = [
      "ベイブレードX Jリーグ BX-00 コバルトドラグーン ドランソード セット",
      "ベイブレードx スターターまとめ売り　ベイコードなし",
      "ベイブレードX BX-14 ナイトシールド＆ドランソード",
      "ベイブレード バースト 大量 まとめ 100個以上",
      "戰鬥陀螺 全套 整組",
    ];
    for (const title of bundles) {
      expect(looksLikeBundle(title), title).toBe(true);
    }
  });

  it("leaves single-part titles alone", () => {
    const singles = [
      "ベイブレードX ドランソード 3-60F 単品",
    ];
    for (const title of singles) {
      expect(looksLikeBundle(title), title).toBe(false);
      expect(isCompEligible(title), title).toBe(true);
    }
  });

  it("flags complete-bey titles separately from lots", () => {
    expect(classifyListingShape("ベイブレードX BEYBLADE X ドランソード　3-60 f 赤")).toBe(
      "complete_bey"
    );
    expect(looksLikeBundle("ベイブレードX BEYBLADE X ドランソード　3-60 f 赤")).toBe(false);
  });
});

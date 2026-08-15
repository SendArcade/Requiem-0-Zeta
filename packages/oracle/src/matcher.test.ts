import { describe, it, expect, beforeAll } from "vitest";
import type { AliasDTO, PartDTO } from "@beyoracle/shared";
import {
  classifyListingShape,
  isCompEligible,
  looksLikeBundle,
  maskFromSources,
} from "@beyoracle/shared";
import {
  matchTitle,
  matchToProduct,
  dedupeProductCodes,
  extractProductCodes,
  canonicalizeProductCode,
} from "../src/matcher.js";
import {
  buildTimeSeries,
  computeOracleByCondition,
  computeOracleValue,
  recomputeWithSources,
} from "../src/oracle-value.js";

const parts: PartDTO[] = [
  {
    id: "x-bx-01-blade",
    generation: "x",
    partType: "blade",
    nameEn: "Dran Sword",
    nameJp: "ドランソード",
    nameZh: "龍劍",
    productCodes: ["BX-01"],
    attrs: {},
  },
  {
    id: "burst-b-34-layer",
    generation: "burst",
    partType: "layer",
    nameEn: "Winning Valkyrie",
    nameJp: "ウィニングヴァルキリー",
    nameZh: "勝利女武神",
    productCodes: ["B-104"],
    attrs: {},
  },
  {
    id: "burst-layer-victory-valkyrie",
    generation: "burst",
    partType: "layer",
    nameEn: "Victory Valkyrie",
    nameJp: "ビクトリーヴァルキリー",
    nameZh: null,
    productCodes: ["B-34"],
    attrs: {},
  },
];

const aliases: AliasDTO[] = [
  { partId: "x-bx-01-blade", locale: "ja", text: "ドランソード BX-01", source: "catalog" },
  { partId: "burst-b-34-layer", locale: "en", text: "Winning Valkyrie B-104", source: "catalog" },
];

const ctx = { parts, aliases };

describe("matcher", () => {
  it("matches by product code", () => {
    const m = matchTitle("【中古】ベイブレードX ドランソード BX-01 美品", ctx);
    expect(m?.partId).toBe("x-bx-01-blade");
    expect(m?.method).toBe("product_code");
  });

  it("rejects bundle listings before product code", () => {
    expect(
      matchTitle("BX-01 ドランソード まとめ売り 10個セット", ctx)
    ).toBeNull();
    expect(classifyListingShape("BX-01 ドランソード まとめ売り 10個セット")).toBe("lot");
    expect(looksLikeBundle("BX-01 ドランソード まとめ売り 10個セット")).toBe(true);
  });

  it("matches Japanese name via exact (spaced title)", () => {
    const m = matchTitle("ベイブレードX ドランソード 3-60F 単品", ctx);
    expect(m?.partId).toBe("x-bx-01-blade");
  });

  it("matches unspaced Japanese title when marked 単品", () => {
    const m = matchTitle("ベイブレードXドランソード3-60F 単品", ctx);
    expect(m?.partId).toBe("x-bx-01-blade");
  });

  it("rejects complete-bey combo titles without 単品", () => {
    expect(matchTitle("ベイブレードXドランソード3-60F", ctx)).toBeNull();
    expect(classifyListingShape("ベイブレードXドランソード3-60F")).toBe("complete_bey");
  });

  it("matches Traditional Chinese title via nameZh", () => {
    const m = matchTitle("戰鬥陀螺x 龍劍 3-60f 単品", ctx);
    expect(m?.partId).toBe("x-bx-01-blade");
  });

  it("matches English alias exact", () => {
    const m = matchTitle("Winning Valkyrie B-104 layer used", ctx);
    expect(m?.partId).toBe("burst-b-34-layer");
  });

  it("does not land Winning titles on the B-34 Victory layer", () => {
    const m = matchTitle("Winning Valkyrie B-34 layer used", ctx);
    expect(m?.partId).not.toBe("burst-layer-victory-valkyrie");
  });

  it("matches fuzzy for partial English title", () => {
    const m = matchTitle("Dran Sword beyblade x blade", ctx);
    expect(m?.partId).toBe("x-bx-01-blade");
  });

  it("rejects starter / complete-bey listings", () => {
    expect(matchTitle("ベイブレードX BX-01 スターター", ctx)).toBeNull();
    expect(isCompEligible("ベイブレードX BX-01 スターター")).toBe(false);
  });

  it("rejects non-beyblade Yahoo false positives via SKU boundary", () => {
    expect(
      matchTitle("【A01】【ファンデーションアディクト デニムパンツ S】ns", ctx)
    ).toBeNull();
  });

  it("rejects junk lots with bare まとめ", () => {
    expect(
      matchTitle("070C ベイブレード まとめ BEYBLADE X ドランソード スタジアム", ctx)
    ).toBeNull();
  });

  it("matches Simplified Chinese 龙剑", () => {
    const m = matchTitle("戰鬥陀螺x 龙剑 3-60f 単品", ctx);
    expect(m?.partId).toBe("x-bx-01-blade");
  });

  it("dedupes substring product codes (WD vs WD-MG)", () => {
    expect(dedupeProductCodes(["WD", "WD-MG"])).toEqual(["WD-MG"]);
    expect(extractProductCodes("WD-MG ウエイトディスク")).toEqual(["WD-MG"]);
  });

  it("canonicalizes unhyphenated live-style product codes", () => {
    expect(canonicalizeProductCode("BB28")).toBe("BB-28");
    expect(canonicalizeProductCode("BB01S")).toBe("BB-01S");
    expect(canonicalizeProductCode("B34")).toBe("B-34");
    expect(canonicalizeProductCode("BX01")).toBe("BX-01");
    expect(extractProductCodes("BB28 ストームペガサス スターター")).toEqual(["BB-28"]);
    expect(extractProductCodes("BB105 ビッグバンペガシス")).toContain("BB105");
  });

  it("prefers longest product code match", () => {
    const weightCtx = {
      parts: [
        {
          id: "plastic-mg-weight",
          generation: "plastic" as const,
          partType: "weight_disk",
          nameEn: "Magnum Weight Disk",
          nameJp: "マグナムウエイト",
          nameZh: null,
          productCodes: ["WD-MG"],
          attrs: {},
        },
        {
          id: "metal-wd-tip",
          generation: "metal" as const,
          partType: "performance_tip",
          nameEn: "Wide Defense",
          nameJp: "ワイドディフェンス",
          nameZh: null,
          productCodes: ["WD"],
          attrs: {},
        },
      ],
      aliases: [] as AliasDTO[],
    };
    const m = matchTitle("WD-MG ウエイトディスク 中古", weightCtx);
    expect(m?.partId).toBe("plastic-mg-weight");
  });
});

describe("oracle value", () => {
  const now = new Date("2026-07-15T00:00:00Z");
  const comps = [
    { price: 980, currency: "JPY" as const, source: "mercari_jp" as const, observedAt: now, status: "sold" as const, condition: "used" as const },
    { price: 850, currency: "JPY" as const, source: "mercari_jp" as const, observedAt: now, status: "sold" as const, condition: "used" as const },
    { price: 1100, currency: "JPY" as const, source: "mercari_jp" as const, observedAt: now, status: "sold" as const, condition: "used" as const },
    { price: 5000, currency: "JPY" as const, source: "mercari_jp" as const, observedAt: now, status: "sold" as const, condition: "sealed" as const },
    { price: 280, currency: "TWD" as const, source: "shopee_tw" as const, observedAt: now, status: "sold" as const, condition: "used" as const },
    { price: 350, currency: "TWD" as const, source: "shopee_tw" as const, observedAt: now, status: "sold" as const, condition: "like_new" as const },
  ];

  it("computes median on used/like_new/unknown only by default", () => {
    const snap = computeOracleValue("x-bx-01-blade", comps, {
      targetCurrency: "JPY",
      engine: "v1",
    });
    expect(snap).not.toBeNull();
    expect(snap!.nComps).toBe(5);
    expect(snap!.value).toBeLessThan(5000);
    expect(snap!.conditions).toEqual(["used", "like_new", "unknown"]);
  });

  it("returns null when below minComps", () => {
    const snap = computeOracleValue("x-bx-01-blade", comps.slice(0, 1), {
      minComps: 3,
    });
    expect(snap).toBeNull();
  });

  it("enforces multi-comp publish floor (DEFAULT_PUBLISHED_MIN_COMPS ≥ 3)", async () => {
    const { DEFAULT_PUBLISHED_MIN_COMPS } = await import("@beyoracle/shared");
    expect(DEFAULT_PUBLISHED_MIN_COMPS).toBeGreaterThanOrEqual(3);
    const one = computeOracleValue("prod-metal-bb-28-starter", comps.slice(0, 1), {
      minComps: DEFAULT_PUBLISHED_MIN_COMPS,
      engine: "v1",
    });
    expect(one).toBeNull();
    const enough = computeOracleValue(
      "prod-metal-bb-28-starter",
      comps.filter((c) => c.condition !== "sealed").slice(0, DEFAULT_PUBLISHED_MIN_COMPS),
      { minComps: DEFAULT_PUBLISHED_MIN_COMPS, engine: "v1" }
    );
    expect(enough).not.toBeNull();
    expect(enough!.nComps).toBeGreaterThanOrEqual(DEFAULT_PUBLISHED_MIN_COMPS);
  });

  it("publishes complete_sealed marks from sealed comps only (not DEFAULT used pool)", async () => {
    const { productMarkConditions, DEFAULT_PUBLISHED_MIN_COMPS } = await import(
      "@beyoracle/shared"
    );
    const sealedComps = [
      {
        price: 8000,
        currency: "JPY" as const,
        source: "mercari_jp" as const,
        observedAt: now,
        status: "sold" as const,
        condition: "sealed" as const,
      },
      {
        price: 8200,
        currency: "JPY" as const,
        source: "mercari_jp" as const,
        observedAt: now,
        status: "sold" as const,
        condition: "sealed" as const,
      },
      {
        price: 7900,
        currency: "JPY" as const,
        source: "yahoo_auctions_jp" as const,
        observedAt: now,
        status: "sold" as const,
        condition: "sealed" as const,
      },
      {
        price: 1000,
        currency: "JPY" as const,
        source: "mercari_jp" as const,
        observedAt: now,
        status: "sold" as const,
        condition: "used" as const,
      },
    ];
    const defaultPool = computeOracleValue("prod-metal-bb-28-complete-sealed", sealedComps, {
      minComps: DEFAULT_PUBLISHED_MIN_COMPS,
      engine: "v1",
      // default conditions exclude sealed → null despite 3 sealed sales
    });
    expect(defaultPool).toBeNull();

    const sealedMark = computeOracleValue("prod-metal-bb-28-complete-sealed", sealedComps, {
      minComps: DEFAULT_PUBLISHED_MIN_COMPS,
      engine: "v1",
      conditions: productMarkConditions("complete_sealed"),
    });
    expect(sealedMark).not.toBeNull();
    expect(sealedMark!.nComps).toBe(3);
    expect(sealedMark!.value).toBeGreaterThan(7000);
  });

  it("segments by condition", () => {
    const byCond = computeOracleByCondition("x-bx-01-blade", comps, {
      targetCurrency: "JPY",
    });
    expect(byCond.sealed?.value).toBe(5000);
    expect(byCond.used?.nComps).toBe(4);
  });

  it("recomputes with source mask", () => {
    const mercariOnly = recomputeWithSources(
      "x-bx-01-blade",
      comps,
      ["mercari_jp"],
      { targetCurrency: "JPY" }
    );
    expect(mercariOnly!.nComps).toBe(3);
    expect(mercariOnly!.sourcesMask).toBe(maskFromSources(["mercari_jp"]));
  });

  it("uses interpolated quartiles (not floor index)", () => {
    const snap = computeOracleValue("x-bx-01-blade", comps, {
      targetCurrency: "JPY",
      engine: "v1",
    });
    expect(snap!.high).toBeLessThan(5000);
    expect(snap!.high).toBeGreaterThan(snap!.value);
  });
});

describe("product multi-month history from dated comps", () => {
  it("builds series only from real dated sold comps (no synthetic points)", () => {
    const recent = new Date("2026-07-20T00:00:00Z");
    const mid = new Date("2026-05-15T00:00:00Z");
    const older = new Date("2026-03-01T00:00:00Z");
    const comps = [
      {
        price: 4500,
        currency: "JPY" as const,
        source: "mercari_jp" as const,
        observedAt: recent,
        status: "sold" as const,
        condition: "used" as const,
        landedJpy: 4500,
      },
      {
        price: 4200,
        currency: "JPY" as const,
        source: "yahoo_auctions_jp" as const,
        observedAt: mid,
        status: "sold" as const,
        condition: "used" as const,
        landedJpy: 4200,
      },
      {
        price: 3900,
        currency: "JPY" as const,
        source: "mercari_jp" as const,
        observedAt: older,
        status: "sold" as const,
        condition: "used" as const,
        landedJpy: 3900,
      },
      {
        price: 99999,
        currency: "JPY" as const,
        source: "mercari_jp" as const,
        observedAt: recent,
        status: "listing" as const,
        condition: "used" as const,
        landedJpy: 99999,
      },
    ];

    const current = computeOracleValue("prod-metal-bb-28-starter", comps, {
      windowDays: 90,
      minComps: 2,
      engine: "v1",
    });
    // mid (May) is ~66 days before July 20 when "today" is not frozen — use relative ages.
    // Freeze by using windowDays large enough for all dated comps.
    const longWindow = computeOracleValue("prod-metal-bb-28-starter", comps, {
      windowDays: 180,
      minComps: 2,
      engine: "v1",
    });
    expect(longWindow).not.toBeNull();
    expect(longWindow!.nComps).toBe(3);

    const series90 = buildTimeSeries(comps, { windowDays: 180 });
    expect(series90.length).toBe(3);
    expect(series90.every((p) => /^\d{4}-\d{2}-\d{2}$/.test(p.date))).toBe(true);
    expect(series90.map((p) => p.price).sort((a, b) => a - b)).toEqual([3900, 4200, 4500]);
    // Never invent points beyond real comps
    expect(series90.length).toBeLessThanOrEqual(
      comps.filter((c) => c.status === "sold").length
    );

    // Insufficient comps → null mark, not a fabricated price
    const sparse = computeOracleValue("prod-plastic-bb-01s-starter", comps.slice(0, 1), {
      windowDays: 180,
      minComps: 3,
      engine: "v1",
    });
    expect(sparse).toBeNull();
    expect(current === null || current.nComps >= 1).toBe(true);
  });

  it("keeps sealed condition out of default secondary-market mark", () => {
    const now = new Date();
    const comps = [
      {
        price: 8000,
        currency: "JPY" as const,
        source: "mercari_jp" as const,
        observedAt: now,
        status: "sold" as const,
        condition: "sealed" as const,
        landedJpy: 8000,
      },
      {
        price: 3000,
        currency: "JPY" as const,
        source: "mercari_jp" as const,
        observedAt: now,
        status: "sold" as const,
        condition: "used" as const,
        landedJpy: 3000,
      },
      {
        price: 3200,
        currency: "JPY" as const,
        source: "mercari_jp" as const,
        observedAt: now,
        status: "sold" as const,
        condition: "used" as const,
        landedJpy: 3200,
      },
      {
        price: 3100,
        currency: "JPY" as const,
        source: "mercari_jp" as const,
        observedAt: now,
        status: "sold" as const,
        condition: "like_new" as const,
        landedJpy: 3100,
      },
    ];
    const snap = computeOracleValue("prod-burst-b-34-starter", comps, {
      minComps: 3,
      engine: "v1",
    });
    expect(snap).not.toBeNull();
    expect(snap!.nComps).toBe(3);
    expect(snap!.value).toBeLessThan(5000);
  });
});

describe("Burst identity product matcher", () => {
  let productCtx: Awaited<
    ReturnType<(typeof import("@beyoracle/catalog"))["loadProductMatcherContext"]>
  >;

  beforeAll(async () => {
    const { loadProductMatcherContext } = await import("@beyoracle/catalog");
    productCtx = loadProductMatcherContext();
  }, 30_000);

  it(
    "rejects wrong-TT titles and routes sealed packaging to sealed SKU",
    () => {
      expect(
        matchToProduct("Beyblade Burst B-34 Starter Winning Valkyrie", productCtx)
      ).toBeNull();
      expect(matchToProduct("Heaven Pegasus B-97 complete used", productCtx)).toBeNull();
      expect(matchToProduct("B-97 ヘブンペガサス 完成品", productCtx)).toBeNull();

      const sealed = matchToProduct("B-01 ヴァルキリー スターター 未開封", productCtx);
      expect(sealed?.productId).toBe("prod-burst-b-01-sealed");
      const used = matchToProduct("B-34 ビクトリーヴァルキリー スターター 中古", productCtx);
      expect(used?.productId).toBe("prod-burst-b-34-starter");
    },
    30_000
  );
});

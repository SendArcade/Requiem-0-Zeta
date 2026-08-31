import { describe, it, expect } from "vitest";
import {
  buildCohortIndex,
  adjustPriceToAsOf,
  cohortKeyForPart,
} from "./cohort-index.js";
import {
  compAgeDays,
  madFilter,
  timeDecayWeight,
  weightedMedian,
} from "./robust-estimator.js";
import { shrinkTowardPrior } from "./shrinkage.js";
import { estimateRegionPremium, buildRegionEstimates } from "./region.js";
import {
  computeOracleValue,
  computeProductOracleValue,
  resolveProductOracleWindowDays,
} from "./oracle-value.js";
import {
  BURST_FMV_FALLBACK_WINDOW_DAYS,
  BURST_FMV_PRIMARY_WINDOW_DAYS,
  DEFAULT_PUBLISHED_MIN_COMPS,
  DEFAULT_SPARSE_ORACLE_WINDOW_DAYS,
  PRODUCT_ORACLE_WINDOW_DAYS,
  productMarkConditions,
} from "@beyoracle/shared";

describe("robust estimator", () => {
  it("decays older comps", () => {
    expect(timeDecayWeight(0, 30)).toBeCloseTo(1);
    expect(timeDecayWeight(30, 30)).toBeCloseTo(0.5);
    expect(timeDecayWeight(60, 30)).toBeCloseTo(0.25);
  });

  it("removes MAD outliers when n≥5", () => {
    const values = [100, 105, 102, 98, 500];
    const weights = [1, 1, 1, 1, 1];
    const { values: kept, removed } = madFilter(values, weights);
    expect(removed).toBe(1);
    expect(kept).not.toContain(500);
    expect(kept.length).toBe(4);
  });

  it("computes comp age in days", () => {
    const asOf = new Date("2026-07-15T00:00:00Z");
    const obs = new Date("2026-07-01T00:00:00Z");
    expect(compAgeDays(obs, asOf)).toBeCloseTo(14, 0);
  });
});

describe("shrinkage", () => {
  it("pulls sparse estimate toward cohort prior", () => {
    const { value, applied } = shrinkTowardPrior(1200, 800, 2, 5);
    expect(applied).toBe(true);
    expect(value).toBeGreaterThan(800);
    expect(value).toBeLessThan(1200);
  });

  it("skips shrinkage when n≥k", () => {
    const { value, applied } = shrinkTowardPrior(1200, 800, 5, 5);
    expect(applied).toBe(false);
    expect(value).toBe(1200);
  });
});

describe("cohort index", () => {
  it("chains monthly ratios", () => {
    const key = cohortKeyForPart("x", "blade");
    const sales = [
      { partId: "a", priceJpy: 1000, observedAt: new Date("2026-05-15"), cohortKey: key },
      { partId: "b", priceJpy: 1100, observedAt: new Date("2026-05-20"), cohortKey: key },
      { partId: "a", priceJpy: 1200, observedAt: new Date("2026-06-10"), cohortKey: key },
      { partId: "b", priceJpy: 1300, observedAt: new Date("2026-06-15"), cohortKey: key },
    ];
    const index = buildCohortIndex(sales, key);
    expect(index).not.toBeNull();
    const adj = adjustPriceToAsOf(
      1000,
      new Date("2026-05-15"),
      new Date("2026-06-15"),
      index
    );
    expect(adj).toBeGreaterThan(1000);
  });
});

describe("region premium", () => {
  it("estimates TW/JP ratio from mixed sources", () => {
    const ratio = estimateRegionPremium([
      { priceJpy: 1000, source: "mercari_jp" },
      { priceJpy: 1020, source: "yahoo_auctions_jp" },
      { priceJpy: 1150, source: "shopee_tw" },
      { priceJpy: 1170, source: "shopee_tw" },
    ]);
    expect(ratio).not.toBeNull();
    expect(ratio!).toBeGreaterThan(1);
    const regions = buildRegionEstimates(1000, ratio);
    expect(regions).toHaveLength(2);
    expect(regions[1]!.region).toBe("tw");
  });
});

describe("oracle v2 pipeline", () => {
  const now = new Date("2026-07-15T00:00:00Z");
  const recent = new Date("2026-07-10T00:00:00Z");
  const stale = new Date("2026-04-01T00:00:00Z");

  const comps = [
    {
      price: 980,
      currency: "JPY" as const,
      source: "mercari_jp" as const,
      observedAt: recent,
      status: "sold" as const,
      condition: "used" as const,
      landedJpy: 980,
    },
    {
      price: 850,
      currency: "JPY" as const,
      source: "mercari_jp" as const,
      observedAt: recent,
      status: "sold" as const,
      condition: "used" as const,
      landedJpy: 850,
    },
    {
      price: 1100,
      currency: "JPY" as const,
      source: "mercari_jp" as const,
      observedAt: recent,
      status: "sold" as const,
      condition: "used" as const,
      landedJpy: 1100,
    },
    {
      price: 5000,
      currency: "JPY" as const,
      source: "mercari_jp" as const,
      observedAt: recent,
      status: "sold" as const,
      condition: "sealed" as const,
      landedJpy: 5000,
    },
    {
      price: 280,
      currency: "TWD" as const,
      source: "shopee_tw" as const,
      observedAt: recent,
      status: "sold" as const,
      condition: "used" as const,
      landedJpy: 1482.4,
    },
    {
      price: 350,
      currency: "TWD" as const,
      source: "shopee_tw" as const,
      observedAt: recent,
      status: "sold" as const,
      condition: "like_new" as const,
      landedJpy: 1838,
    },
    {
      price: 200,
      currency: "JPY" as const,
      source: "mercari_jp" as const,
      observedAt: stale,
      status: "sold" as const,
      condition: "used" as const,
      landedJpy: 200,
    },
  ];

  it("uses landed JPY and v2 engine metadata", () => {
    const snap = computeOracleValue("x-bx-01-blade", comps, {
      targetCurrency: "JPY",
      engine: "v2",
    });
    expect(snap).not.toBeNull();
    expect(snap!.engine).toBe("v2");
    expect(snap!.nComps).toBeGreaterThanOrEqual(4);
    expect(snap!.nEffective).toBeDefined();
    expect(snap!.value).toBeLessThan(5000);
  });

  it("prefers recent comps over stale via time decay", () => {
    const snap = computeOracleValue("x-bx-01-blade", comps, {
      targetCurrency: "JPY",
      engine: "v2",
      halfLifeDays: 14,
    });
    expect(snap!.value).toBeGreaterThan(300);
  });

  it("v1 engine preserves legacy median path", () => {
    const v1Comps = comps.filter(
      (c) => c.observedAt.getTime() >= recent.getTime()
    );
    const snap = computeOracleValue("x-bx-01-blade", v1Comps, {
      targetCurrency: "JPY",
      engine: "v1",
    });
    expect(snap!.engine).toBe("v1");
    expect(snap!.nComps).toBe(5);
  });

  it("excludes non-confirmed evidence from oracle median", () => {
    const withProxy = [
      ...comps,
      {
        price: 999,
        currency: "JPY" as const,
        source: "ruten_tw" as const,
        observedAt: recent,
        status: "sold" as const,
        condition: "used" as const,
        evidenceKind: "dealer_sold_out_proxy" as const,
      },
    ];
    const snap = computeOracleValue("x-bx-01-blade", withProxy, {
      targetCurrency: "JPY",
      engine: "v1",
    });
    expect(snap!.nComps).toBe(5);
    expect(snap!.value).not.toBe(999);
  });

  it("breadth mode: confidence follows best match quality, not comp count", () => {
    const oneStrong = [
      {
        ...soldComp({ price: 1200, daysAgo: 3, condition: "used" }),
        matchConfidence: 0.98,
      },
    ];
    const manyWeak = [0.88, 0.88, 0.88].map((matchConfidence, i) => ({
      ...soldComp({ price: 1000 + i, daysAgo: 3, condition: "used" }),
      matchConfidence,
    }));

    const strong = computeOracleValue("prod-x-bx-02-starter", oneStrong, {
      targetCurrency: "JPY",
      minComps: 1,
      engine: "v1",
    });
    const weak = computeOracleValue("prod-x-bx-02-starter", manyWeak, {
      targetCurrency: "JPY",
      minComps: 1,
      engine: "v1",
    });

    expect(strong!.confidence).toBe("high");
    expect(weak!.confidence).toBe("low");
  });
});

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function soldComp(opts: {
  price: number;
  daysAgo: number;
  condition: "sealed" | "used" | "like_new" | "unknown";
}) {
  return {
    price: opts.price,
    currency: "JPY" as const,
    source: "mercari_jp" as const,
    observedAt: daysAgo(opts.daysAgo),
    status: "sold" as const,
    condition: opts.condition,
    landedJpy: opts.price,
  };
}

describe("burst FMV windows and sealed isolation", () => {
  const starter = {
    id: "prod-burst-b-01-starter",
    generation: "burst" as const,
    skuType: "starter" as const,
  };
  const loose = {
    id: "prod-burst-b-01-complete-loose",
    generation: "burst" as const,
    skuType: "complete_loose" as const,
  };
  const sealedSku = {
    id: "prod-burst-b-01-sealed",
    generation: "burst" as const,
    skuType: "complete_sealed" as const,
  };

  it("uses 7-day window when primary n >= min comps", () => {
    const comps = [1, 2, 3].map((i) =>
      soldComp({ price: 1000 + i, daysAgo: 2, condition: "used" })
    );
    const windowDays = resolveProductOracleWindowDays(starter.generation, comps, {
      conditions: productMarkConditions("starter"),
      minComps: DEFAULT_PUBLISHED_MIN_COMPS,
    });
    expect(windowDays).toBe(BURST_FMV_PRIMARY_WINDOW_DAYS);
    const snap = computeProductOracleValue(starter, comps, { engine: "v1" });
    expect(snap).not.toBeNull();
    expect(snap!.nComps).toBe(3);
  });

  it("falls back to 90d only when 7d n < 3", () => {
    const comps = [
      soldComp({ price: 1100, daysAgo: 2, condition: "used" }),
      soldComp({ price: 1200, daysAgo: 2, condition: "used" }),
      soldComp({ price: 1300, daysAgo: 20, condition: "used" }),
      soldComp({ price: 1400, daysAgo: 40, condition: "used" }),
    ];
    const windowDays = resolveProductOracleWindowDays(starter.generation, comps, {
      conditions: productMarkConditions("starter"),
      minComps: DEFAULT_PUBLISHED_MIN_COMPS,
    });
    expect(windowDays).toBe(BURST_FMV_FALLBACK_WINDOW_DAYS);
    const snap = computeProductOracleValue(starter, comps, { engine: "v1" });
    expect(snap).not.toBeNull();
    expect(snap!.nComps).toBe(4);
  });

  it("never mixes sealed comps into starter or default/loose windows", () => {
    const comps = [
      soldComp({ price: 900, daysAgo: 1, condition: "used" }),
      soldComp({ price: 950, daysAgo: 1, condition: "like_new" }),
      soldComp({ price: 980, daysAgo: 2, condition: "unknown" }),
      soldComp({ price: 8000, daysAgo: 1, condition: "sealed" }),
      soldComp({ price: 8100, daysAgo: 2, condition: "sealed" }),
      soldComp({ price: 8200, daysAgo: 3, condition: "sealed" }),
    ];
    const starterSnap = computeProductOracleValue(starter, comps, { engine: "v1" });
    const looseSnap = computeProductOracleValue(loose, comps, { engine: "v1" });
    expect(starterSnap).not.toBeNull();
    expect(looseSnap).not.toBeNull();
    expect(starterSnap!.nComps).toBe(3);
    expect(looseSnap!.nComps).toBe(3);
    expect(starterSnap!.value).toBeLessThan(2000);
    expect(looseSnap!.value).toBeLessThan(2000);
    expect(starterSnap!.conditions).not.toContain("sealed");
    expect(looseSnap!.conditions).not.toContain("sealed");
  });

  it("sealed comps do not count toward 7d fallback for starter", () => {
    const comps = [
      soldComp({ price: 900, daysAgo: 1, condition: "used" }),
      soldComp({ price: 8000, daysAgo: 1, condition: "sealed" }),
      soldComp({ price: 8100, daysAgo: 1, condition: "sealed" }),
      soldComp({ price: 8200, daysAgo: 1, condition: "sealed" }),
      soldComp({ price: 1000, daysAgo: 20, condition: "used" }),
      soldComp({ price: 1100, daysAgo: 30, condition: "used" }),
    ];
    const windowDays = resolveProductOracleWindowDays(starter.generation, comps, {
      conditions: productMarkConditions("starter"),
      minComps: DEFAULT_PUBLISHED_MIN_COMPS,
    });
    expect(windowDays).toBe(BURST_FMV_FALLBACK_WINDOW_DAYS);
    const snap = computeProductOracleValue(starter, comps, { engine: "v1" });
    expect(snap!.nComps).toBe(3);
    expect(snap!.value).toBeLessThan(2000);
  });

  it("complete_sealed mark uses sealed comps only", () => {
    const comps = [
      soldComp({ price: 8000, daysAgo: 1, condition: "sealed" }),
      soldComp({ price: 8100, daysAgo: 2, condition: "sealed" }),
      soldComp({ price: 8200, daysAgo: 2, condition: "sealed" }),
      soldComp({ price: 900, daysAgo: 1, condition: "used" }),
    ];
    const snap = computeProductOracleValue(sealedSku, comps, { engine: "v1" });
    expect(snap).not.toBeNull();
    expect(snap!.nComps).toBe(3);
    expect(snap!.value).toBeGreaterThan(7000);
    expect(snap!.conditions).toEqual(["sealed"]);
  });

  it("extends to sparse window when burst comps are older than 90d", () => {
    const comps = [soldComp({ price: 1500, daysAgo: 169, condition: "used" })];
    const windowDays = resolveProductOracleWindowDays(starter.generation, comps, {
      conditions: productMarkConditions("complete_loose"),
      minComps: 1,
    });
    expect(windowDays).toBe(DEFAULT_SPARSE_ORACLE_WINDOW_DAYS);
    const snap = computeProductOracleValue(
      { ...starter, skuType: "complete_loose" },
      comps,
      { engine: "v1", minComps: 1 }
    );
    expect(snap).not.toBeNull();
    expect(snap!.nComps).toBe(1);
  });

  it("extends X/plastic/metal to sparse window when comps exceed 180d", () => {
    const xStarter = {
      id: "prod-x-bx-02-starter",
      generation: "x" as const,
      skuType: "starter" as const,
    };
    const comps = [soldComp({ price: 3200, daysAgo: 200, condition: "used" })];
    const windowDays = resolveProductOracleWindowDays(xStarter.generation, comps, {
      conditions: productMarkConditions("starter"),
      minComps: 1,
    });
    expect(windowDays).toBe(DEFAULT_SPARSE_ORACLE_WINDOW_DAYS);
    const snap = computeProductOracleValue(xStarter, comps, { engine: "v1", minComps: 1 });
    expect(snap).not.toBeNull();
    expect(snap!.nComps).toBe(1);
  });

  it("keeps 180d window for X when comps are within range", () => {
    const comps = [soldComp({ price: 3200, daysAgo: 90, condition: "used" })];
    const windowDays = resolveProductOracleWindowDays("x", comps, {
      conditions: productMarkConditions("starter"),
      minComps: 1,
    });
    expect(windowDays).toBe(PRODUCT_ORACLE_WINDOW_DAYS);
  });
});

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
import { computeOracleValue } from "./oracle-value.js";

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
});

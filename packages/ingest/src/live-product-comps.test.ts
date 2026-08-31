import { describe, expect, it } from "vitest";
import { isLiveMarketplaceComp } from "./persist.js";
import {
  productMarkConditions,
  DEFAULT_PUBLISHED_MIN_COMPS,
  PRODUCT_ORACLE_WINDOW_DAYS,
  BURST_FMV_PRIMARY_WINDOW_DAYS,
  BURST_FMV_FALLBACK_WINDOW_DAYS,
  isLiveMarketplaceComp as isLiveFromShared,
} from "@beyoracle/shared";
import { computeOracleValue, computeProductOracleValue, resolveProductOracleWindowDays } from "@beyoracle/oracle";

describe("live product comps quality gates", () => {
  it("excludes seed fixtures from live marketplace comps (shared + ingest re-export)", () => {
    expect(isLiveMarketplaceComp({ fixture: true })).toBe(false);
    expect(isLiveFromShared({ fixture: true })).toBe(false);
    expect(isLiveMarketplaceComp({ mercariItemId: "m123" })).toBe(true);
    expect(isLiveMarketplaceComp(null)).toBe(true);
    expect(isLiveMarketplaceComp({})).toBe(true);
  });

  it("publishes complete_sealed marks when sealed conditions are used", () => {
    const now = new Date();
    const sealedComps = [1, 2, 3].map((i) => ({
      price: 7000 + i * 100,
      currency: "JPY" as const,
      source: "mercari_jp" as const,
      observedAt: now,
      status: "sold" as const,
      condition: "sealed" as const,
    }));
    const mark = computeOracleValue("prod-metal-bb-28-complete-sealed", sealedComps, {
      minComps: DEFAULT_PUBLISHED_MIN_COMPS,
      conditions: productMarkConditions("complete_sealed"),
      engine: "v1",
      windowDays: PRODUCT_ORACLE_WINDOW_DAYS,
    });
    expect(mark).not.toBeNull();
    expect(mark!.nComps).toBe(3);
  });

  it("PRODUCT_ORACLE_WINDOW_DAYS is multi-month (≥180)", () => {
    expect(PRODUCT_ORACLE_WINDOW_DAYS).toBeGreaterThanOrEqual(180);
  });

  it("sealed comps do not move default or starter marks", () => {
    const now = new Date();
    const mixed = [
      ...[1, 2, 3].map((i) => ({
        price: 1200 + i,
        currency: "JPY" as const,
        source: "mercari_jp" as const,
        observedAt: now,
        status: "sold" as const,
        condition: "used" as const,
      })),
      ...[1, 2, 3].map((i) => ({
        price: 9000 + i,
        currency: "JPY" as const,
        source: "mercari_jp" as const,
        observedAt: now,
        status: "sold" as const,
        condition: "sealed" as const,
      })),
    ];
    const starter = computeOracleValue("prod-burst-b-34-starter", mixed, {
      minComps: DEFAULT_PUBLISHED_MIN_COMPS,
      conditions: productMarkConditions("starter"),
      engine: "v1",
    });
    expect(starter).not.toBeNull();
    expect(starter!.nComps).toBe(3);
    expect(starter!.value).toBeLessThan(2000);
  });

  it("Burst FMV prefers 7-day sold comps and falls back to 90d when n<3", () => {
    expect(BURST_FMV_PRIMARY_WINDOW_DAYS).toBe(7);
    expect(BURST_FMV_FALLBACK_WINDOW_DAYS).toBe(90);
    const now = new Date();
    const d2 = new Date(now.getTime() - 2 * 24 * 3600 * 1000);
    const d30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    const recent3 = [1, 2, 3].map((i) => ({
      price: 2000 + i,
      currency: "JPY" as const,
      source: "mercari_jp" as const,
      observedAt: d2,
      status: "sold" as const,
      condition: "used" as const,
    }));
    const older = [1, 2, 3].map((i) => ({
      price: 4000 + i,
      currency: "JPY" as const,
      source: "mercari_jp" as const,
      observedAt: d30,
      status: "sold" as const,
      condition: "used" as const,
    }));
    const sealedOld = {
      price: 12000,
      currency: "JPY" as const,
      source: "mercari_jp" as const,
      observedAt: d2,
      status: "sold" as const,
      condition: "sealed" as const,
    };
    const product = {
      id: "prod-burst-b-34-starter",
      generation: "burst" as const,
      skuType: "starter" as const,
    };
    expect(
      resolveProductOracleWindowDays("burst", [...recent3, sealedOld], {
        conditions: productMarkConditions("starter"),
      })
    ).toBe(7);
    const primary = computeProductOracleValue(product, [...recent3, sealedOld], {
      engine: "v1",
    });
    expect(primary).not.toBeNull();
    expect(primary!.nComps).toBe(3);
    expect(primary!.value).toBeLessThan(3000);
    expect(
      resolveProductOracleWindowDays("burst", [recent3[0]!, ...older, sealedOld], {
        conditions: productMarkConditions("starter"),
      })
    ).toBe(90);
    expect(resolveProductOracleWindowDays("metal", recent3, {
      conditions: productMarkConditions("starter"),
    })).toBe(PRODUCT_ORACLE_WINDOW_DAYS);
    const d169 = new Date(now.getTime() - 169 * 24 * 3600 * 1000);
    const sparseBurst = [
      {
        price: 1500,
        currency: "JPY" as const,
        source: "mercari_jp" as const,
        observedAt: d169,
        status: "sold" as const,
        condition: "used" as const,
      },
    ];
    expect(
      resolveProductOracleWindowDays("burst", sparseBurst, {
        conditions: productMarkConditions("complete_loose"),
        minComps: 1,
      })
    ).toBeGreaterThan(BURST_FMV_FALLBACK_WINDOW_DAYS);
  });

  it("product page + snapshot recompute share live-only + 180d gates (structural)", async () => {
    const { readFileSync } = await import("node:fs");
    const { join, dirname } = await import("node:path");
    const { fileURLToPath } = await import("node:url");
    const here = dirname(fileURLToPath(import.meta.url));
    const webProductData = readFileSync(
      join(here, "../../../apps/web/src/lib/product-data.ts"),
      "utf-8"
    );
    const persist = readFileSync(join(here, "persist.ts"), "utf-8");
    const seed = readFileSync(
      join(here, "../../catalog/src/seed.ts"),
      "utf-8"
    );

    // Web product page must filter fixtures and resolve Burst 7d/90d vs other-gen windows
    expect(webProductData).toContain("isLiveMarketplaceComp");
    expect(webProductData).toContain("computeProductOracleValue");
    expect(webProductData).toContain("resolveProductOracleWindowDays");

    // Snapshot recompute uses same live gate + product-aware window
    expect(persist).toContain("isLiveMarketplaceComp");
    expect(persist).toContain("computeProductOracleValue");

    // Seed must not insert product_matches for fixtures
    expect(seed).toMatch(/never create product_matches|live-only/i);
    expect(seed).not.toMatch(
      /await db\.insert\(productMatches\)\.values/
    );
  });
});

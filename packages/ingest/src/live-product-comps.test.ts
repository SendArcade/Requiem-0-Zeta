import { describe, expect, it } from "vitest";
import { isLiveMarketplaceComp } from "./persist.js";
import {
  productMarkConditions,
  DEFAULT_PUBLISHED_MIN_COMPS,
  PRODUCT_ORACLE_WINDOW_DAYS,
  isLiveMarketplaceComp as isLiveFromShared,
} from "@beyoracle/shared";
import { computeOracleValue } from "@beyoracle/oracle";

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

    // Web product page must filter fixtures and use multi-month window
    expect(webProductData).toContain("isLiveMarketplaceComp");
    expect(webProductData).toContain("PRODUCT_ORACLE_WINDOW_DAYS");
    expect(webProductData).toMatch(/windowDays:\s*PRODUCT_ORACLE_WINDOW_DAYS/);

    // Snapshot recompute uses same live gate + window constant
    expect(persist).toContain("isLiveMarketplaceComp");
    expect(persist).toContain("PRODUCT_ORACLE_WINDOW_DAYS");

    // Seed must not insert product_matches for fixtures
    expect(seed).toMatch(/never create product_matches|live-only/i);
    expect(seed).not.toMatch(
      /await db\.insert\(productMatches\)\.values/
    );
  });
});

import { describe, it, expect } from "vitest";
import { MercariJpSource } from "../src/adapters/mercari-jp.js";
import { ShopeeTwSource } from "../src/adapters/shopee-tw.js";
import { YahooAuctionsJpSource } from "../src/adapters/yahoo-auctions-jp.js";
import { ingestFixturesSmoke } from "../src/pipeline.js";

describe("ingest adapters", () => {
  it("mercari normalizes fixture listing", async () => {
    const src = new MercariJpSource();
    const raw = await src.search("BX-01", { limit: 1 });
    expect(raw.length).toBeGreaterThan(0);
    const obs = src.normalize(raw[0]!);
    expect(obs.source).toBe("mercari_jp");
    expect(obs.currency).toBe("JPY");
  });

  it("shopee normalizes fixture listing", async () => {
    const src = new ShopeeTwSource();
    const raw = await src.search("龍劍", { limit: 1 });
    expect(raw.length).toBeGreaterThan(0);
    const obs = src.normalize(raw[0]!);
    expect(obs.source).toBe("shopee_tw");
    expect(obs.currency).toBe("TWD");
  });

  it("yahoo normalizes fixture listing", async () => {
    const src = new YahooAuctionsJpSource();
    const raw = await src.search("ドランソード", { limit: 1 });
    expect(raw.length).toBeGreaterThan(0);
    const obs = src.normalize(raw[0]!);
    expect(obs.source).toBe("yahoo_auctions_jp");
    expect(obs.currency).toBe("JPY");
    expect(obs.status).toBe("sold");
  });

  it("fixture smoke ingest matches parts", async () => {
    const result = await ingestFixturesSmoke();
    expect(result.mercari).toBeGreaterThan(0);
    expect(result.shopee).toBeGreaterThan(0);
    expect(result.matched).toBeGreaterThan(0);
  });

  it("loadMatcherContext matches real Japanese listing titles", async () => {
    const { loadMatcherContext } = await import("@beyoracle/catalog");
    const { matchTitle } = await import("@beyoracle/oracle");
    const ctx = loadMatcherContext();
    expect(ctx.parts.length).toBeGreaterThan(1000);
    expect(ctx.aliases.length).toBeGreaterThan(1000);

    const titles = [
      "ベイブレードX ドランソード 3-60F 単品",
      "ベイブレードXドランソード3-60F 単品",
      "戰鬥陀螺x 龙剑 3-60f 単品",
    ];
    for (const title of titles) {
      const m = matchTitle(title, ctx);
      expect(m?.partId, title).toBe("x-bx-01-blade");
    }
  });
});

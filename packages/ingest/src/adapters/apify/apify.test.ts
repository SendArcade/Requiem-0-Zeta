import { afterEach, describe, expect, it, vi } from "vitest";
import {
  apifyActorRestId,
  parseLiveProviderChain,
  runActorSyncGetItems,
} from "./client.js";
import {
  conditionFromApifyMercari,
  isApifyMercariSoldRow,
  mapApifyMercariRow,
  mercariIdFromUrl,
} from "./mercari-sold.js";
import {
  isApifyYahooSoldRow,
  mapApifyYahooRow,
  yahooAuctionIdFromUrl,
} from "./yahoo-sold.js";

describe("apify client helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.APIFY_TOKEN;
  });

  it("converts store ids to REST actor ids", () => {
    expect(apifyActorRestId("kitebuilds/resale-sold-comps")).toBe(
      "kitebuilds~resale-sold-comps"
    );
  });

  it("defaults to primary then apify fallback when token is set", () => {
    process.env.APIFY_TOKEN = "test-token";
    expect(parseLiveProviderChain(undefined, { primary: "dpop", fallback: "apify" })).toEqual([
      "dpop",
      "apify",
    ]);
  });

  it("defaults to primary only when apify is not configured", () => {
    expect(parseLiveProviderChain(undefined, { primary: "self", fallback: "apify" })).toEqual([
      "self",
    ]);
  });

  it("honors explicit provider chains", () => {
    expect(parseLiveProviderChain("apify,dpop", { primary: "self" })).toEqual([
      "apify",
      "dpop",
    ]);
  });

  it("throws when APIFY_TOKEN is missing", async () => {
    await expect(
      runActorSyncGetItems("kitebuilds/resale-sold-comps", { searchTerm: "x" })
    ).rejects.toThrow(/APIFY_TOKEN/);
  });

  it("posts actor input and returns dataset items", async () => {
    process.env.APIFY_TOKEN = "test-token";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ title: "test", soldPrice: 1000, url: "https://jp.mercari.com/item/m1" }],
    });
    vi.stubGlobal("fetch", fetchMock);

    const items = await runActorSyncGetItems("kitebuilds/resale-sold-comps", {
      searchTerm: "ベイブレード",
      maxItems: 3,
    });

    expect(items).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain("kitebuilds~resale-sold-comps/run-sync-get-dataset-items");
    expect(init.method).toBe("POST");
    expect(JSON.parse(String(init.body))).toMatchObject({ searchTerm: "ベイブレード" });
  });
});

describe("Apify Mercari sold mapper", () => {
  it("extracts mercari item ids from urls", () => {
    expect(mercariIdFromUrl("https://jp.mercari.com/item/m76760088287")).toBe("m76760088287");
  });

  it("maps English condition labels", () => {
    expect(conditionFromApifyMercari("New")).toBe("sealed");
    expect(conditionFromApifyMercari("Like new")).toBe("like_new");
    expect(conditionFromApifyMercari("Good")).toBe("used");
  });

  it("skips summary rows", () => {
    expect(isApifyMercariSoldRow({ type: "SUMMARY", soldPrice: 100 })).toBe(false);
  });

  it("maps a sold row onto RawListing", () => {
    const row = {
      platform: "mercari_jp",
      title: "ベイブレードX ドランソード",
      soldPrice: 5500,
      currency: "JPY",
      condition: "Good",
      soldDate: "2026-05-30",
      url: "https://jp.mercari.com/item/m76760088287",
      query: "ドランソード",
    };

    const listing = mapApifyMercariRow(row, "ドランソード");
    expect(listing).toMatchObject({
      externalId: "m76760088287",
      price: 5500,
      currency: "JPY",
      status: "sold",
      condition: "used",
    });
    expect((listing?.raw as { provider?: string })?.provider).toBe("apify");
  });
});

describe("Apify Yahoo sold mapper", () => {
  it("extracts auction ids from urls", () => {
    expect(yahooAuctionIdFromUrl("https://auctions.yahoo.co.jp/jp/auction/k123456789")).toBe(
      "k123456789"
    );
  });

  it("skips price summary rows", () => {
    expect(isApifyYahooSoldRow({ type: "price_summary", title: "x", priceJpy: 100 })).toBe(false);
  });

  it("drops zero-bid auction rows", () => {
    const row = {
      title: "ベイブレード",
      finalPriceJpy: 1200,
      bidCount: 0,
      url: "https://auctions.yahoo.co.jp/jp/auction/k999",
    };
    expect(mapApifyYahooRow(row, "ベイブレード")).toBeNull();
  });

  it("maps a sold auction row onto RawListing", () => {
    const row = {
      title: "ベイブレードX BX-00",
      finalPriceJpy: 24800,
      bidCount: 3,
      itemCondition: "USED20",
      endTime: "2026-07-03T12:00:00+00:00",
      url: "https://auctions.yahoo.co.jp/jp/auction/k123456789",
    };

    const listing = mapApifyYahooRow(row, "BX-00");
    expect(listing).toMatchObject({
      externalId: "k123456789",
      price: 24800,
      status: "sold",
      condition: "used",
    });
    expect((listing?.raw as { provider?: string })?.provider).toBe("apify");
  });
});

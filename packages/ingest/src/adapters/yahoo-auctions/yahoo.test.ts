import { describe, expect, it, vi, afterEach } from "vitest";
import {
  conditionFromYahoo,
  normalizeYahooKeyword,
  parseNextData,
  yahooItemUrl,
  type YahooItem,
} from "./client.js";

const SAMPLE_HTML = `<html><head></head><body>
<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
  props: {
    pageProps: {
      initialState: {
        search: {
          items: {
            listing: {
              totalResultsAvailable: 46416,
              items: [
                {
                  auctionId: "m14526260763",
                  title: "ベイブレードX ドランソード 3-60F",
                  price: 2000,
                  bidCount: 2,
                  endTime: "2026-07-20T10:00:00+09:00",
                  itemCondition: "USED20",
                  isFleamarketItem: false,
                },
                {
                  auctionId: "z651675064",
                  title: "ベイブレードX ラチェット 4-50",
                  price: 1250,
                  bidCount: 1,
                  endTime: "2026-07-18T14:30:00+09:00",
                  itemCondition: "NEW",
                  isFleamarketItem: true,
                },
                {
                  auctionId: "u999",
                  title: "no bids auction",
                  price: 500,
                  bidCount: 0,
                  endTime: "2026-07-01T00:00:00+09:00",
                  isFleamarketItem: false,
                },
              ] as YahooItem[],
            },
          },
        },
      },
    },
  },
})}</script></body></html>`;

describe("yahoo __NEXT_DATA__ parser", () => {
  it("extracts listing items and total count", () => {
    const page = parseNextData(SAMPLE_HTML);
    expect(page.totalResultsAvailable).toBe(46416);
    expect(page.items).toHaveLength(3);
    expect(page.items[0]!.auctionId).toBe("m14526260763");
    expect(page.items[0]!.price).toBe(2000);
  });

  it("maps Yahoo condition codes", () => {
    expect(conditionFromYahoo("NEW")).toBe("sealed");
    expect(conditionFromYahoo("USED10")).toBe("like_new");
    expect(conditionFromYahoo("USED40")).toBe("used");
    expect(conditionFromYahoo(undefined)).toBe("unknown");
  });

  it("builds auction vs flea market urls", () => {
    expect(
      yahooItemUrl({
        auctionId: "m123",
        isFleamarketItem: false,
      } as YahooItem)
    ).toBe("https://auctions.yahoo.co.jp/jp/auction/m123");

    expect(
      yahooItemUrl({
        auctionId: "z456",
        isFleamarketItem: true,
      } as YahooItem)
    ).toBe("https://paypayfleamarket.yahoo.co.jp/item/z456");
  });
});

describe("yahoo sold filter", () => {
  it("searchSold drops zero-bid auction rows", async () => {
    const { YahooAuctionsClient } = await import("./client.js");

    const client = new YahooAuctionsClient({ minIntervalMs: 0 });
    client.searchPage = async () => parseNextData(SAMPLE_HTML);

    const sold = await client.searchSold("test", { maxItems: 10, maxPages: 1 });
    expect(sold.map((i) => i.auctionId)).toEqual([
      "m14526260763",
      "z651675064",
    ]);
  });
});

const EMPTY_404_HTML = `<html><body><script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
  props: {
    pageProps: {
      initialState: {
        search: {
          items: {
            listing: { totalResultsAvailable: 0, items: [] },
          },
        },
      },
    },
  },
})}</script></body></html>`;

describe("yahoo 404 zero-hit queries", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.YAHOO_NORMALIZE_HYPHEN_QUERIES;
  });

  it("parseNextData handles empty listing on 404-shaped payload", () => {
    const page = parseNextData(EMPTY_404_HTML);
    expect(page.items).toEqual([]);
    expect(page.totalResultsAvailable).toBe(0);
  });

  it("searchPage treats HTTP 404 as empty results instead of throwing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        status: 404,
        ok: false,
        text: async () => EMPTY_404_HTML,
      }))
    );

    const { YahooAuctionsClient } = await import("./client.js");
    const client = new YahooAuctionsClient({ minIntervalMs: 0 });
    const page = await client.searchPage("Absorb-S");
    expect(page.items).toEqual([]);
  });

  it("normalizeYahooKeyword replaces letter-hyphen-letter by default", () => {
    expect(normalizeYahooKeyword("Absorb-S starter")).toBe("Absorb S starter");
    expect(normalizeYahooKeyword("BX-00")).toBe("BX-00");
    process.env.YAHOO_NORMALIZE_HYPHEN_QUERIES = "0";
    expect(normalizeYahooKeyword("Absorb-S")).toBe("Absorb-S");
  });
});

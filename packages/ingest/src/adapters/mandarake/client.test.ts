import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  isGeoBlockedLanding,
  mandarakeItemUrl,
  parseSearchHtml,
} from "./client.js";

const FIXTURE = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "fixtures/search-snippet.html"),
  "utf8"
);

describe("mandarake listPage parser", () => {
  it("extracts sold and in-stock rows from thumlarge blocks", () => {
    const items = parseSearchHtml(FIXTURE, 10);

    expect(items).toHaveLength(2);

    const sold = items.find((i) => i.itemCode === "1341082807");
    expect(sold).toMatchObject({
      title: expect.stringContaining("ケルベロスリーパー"),
      priceJpy: 2500,
      soldOut: true,
      shop: "名古屋店",
    });
    expect(sold!.url).toContain("itemCode=1341082807");
    expect(sold!.itemNo).toEqual(["nitem-00M6G247", "0230891984"]);

    const ask = items.find((i) => i.itemCode === "1343632250");
    expect(ask).toMatchObject({
      title: expect.stringContaining("ウルフフレイム"),
      priceJpy: 2500,
      soldOut: false,
      stockText: "在庫確認します",
    });
  });

  it("builds canonical detail URLs", () => {
    expect(mandarakeItemUrl("1298765432")).toBe(
      "https://order.mandarake.co.jp/order/detailPage/item?itemCode=1298765432"
    );
  });

  it("detects geo-block landing pages", () => {
    const gate = `<html><body><img src="img/global/logo.png"><ul class="select_sp"></ul></body></html>`;
    expect(isGeoBlockedLanding(gate)).toBe(true);
    expect(isGeoBlockedLanding(FIXTURE)).toBe(false);
  });

  it("throws when search shell has no parseable rows", () => {
    expect(() =>
      parseSearchHtml('<div class="thumlarge"></div>', 5)
    ).toThrow(/none parsed cleanly/);
  });
});

describe("mandarake client searchItems", () => {
  it("maps parsed HTML through searchItems", async () => {
    const { MandarakeClient } = await import("./client.js");
    const client = new MandarakeClient({ minIntervalMs: 0 });

    client["primeSession"] = async () => {};
    client["fetchText"] = async () => FIXTURE;

    const items = await client.searchItems("beyblade", {
      limit: 5,
      includeSoldOut: false,
    });

    expect(items.length).toBe(2);
    expect(items.every((i) => i.itemCode && i.title && i.priceJpy > 0)).toBe(
      true
    );
  });
});

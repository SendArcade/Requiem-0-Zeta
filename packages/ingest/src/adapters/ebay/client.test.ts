import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  ebayItemUrl,
  isBlockedPage,
  parseSearchHtml,
  soldSearchUrl,
} from "./client.js";

const FIXTURE = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "fixtures/search-snippet.html"),
  "utf8"
);

describe("ebay sold search parser", () => {
  it("builds sold search URL", () => {
    expect(soldSearchUrl("beyblade BX-01")).toContain("LH_Sold=1");
    expect(soldSearchUrl("beyblade BX-01")).toContain("LH_Complete=1");
    expect(soldSearchUrl("beyblade BX-01")).toContain("_nkw=beyblade");
  });

  it("parses sold items from s-item cards", () => {
    const items = parseSearchHtml(FIXTURE, 10);
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      itemId: "25678901234567",
      title: expect.stringContaining("Dran Sword"),
      price: 18.5,
      currency: "USD",
    });
    expect(items[0]!.soldAt).toBeTruthy();
    expect(ebayItemUrl(items[0]!.itemId)).toContain("/itm/25678901234567");
  });

  it("skips shop-on-ebay promo rows", () => {
    const items = parseSearchHtml(FIXTURE, 10);
    expect(items.every((i) => !/shop on ebay/i.test(i.title))).toBe(true);
  });

  it("detects bot/error pages", () => {
    expect(isBlockedPage("<div class='error-header__headline'>SORRY</div>")).toBe(true);
    expect(isBlockedPage(FIXTURE)).toBe(false);
  });
});

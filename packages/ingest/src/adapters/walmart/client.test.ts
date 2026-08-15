import { describe, expect, it } from "vitest";
import { parseWalmartSearchPayload, walmartItemUrl } from "./client.js";

const FIXTURE_HTML = `<!DOCTYPE html><html><body>
<script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
  props: {
    pageProps: {
      initialData: {
        searchResult: {
          itemStacks: [
            {
              items: [
                {
                  usItemId: "5012345678",
                  name: "Hasbro Beyblade X Dran Sword 3-60F Starter Set",
                  priceInfo: { currentPrice: { price: 14.97 } },
                },
                {
                  usItemId: "5098765432",
                  name: "Beyblade X BX-00 Cobalt Dragoon",
                  salePrice: 24.96,
                },
              ],
            },
          ],
        },
      },
    },
  },
})}</script></body></html>`;

describe("walmart client", () => {
  it("builds canonical item urls", () => {
    expect(walmartItemUrl("5012345678")).toBe("https://www.walmart.com/ip/5012345678");
  });

  it("parses __NEXT_DATA__ search items", () => {
    const page = parseWalmartSearchPayload(FIXTURE_HTML);
    expect(page.items).toHaveLength(2);
    expect(page.items[0]).toMatchObject({
      itemId: "5012345678",
      price: 14.97,
      currency: "USD",
    });
  });
});

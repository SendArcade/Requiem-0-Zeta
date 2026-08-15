import { describe, expect, it } from "vitest";
import { amazonItemUrl, parseAmazonSearchHtml } from "./client.js";

const FIXTURE_HTML = `<html><body>
<div data-asin="B0C1234567">
  <span class="a-price"><span class="a-offscreen">$19.99</span></span>
  <h2>Hasbro Beyblade X Dran Sword 3-60F Starter Set</h2>
</div>
<div data-asin="B0C7654321">
  <span class="a-price"><span class="a-offscreen">$24.95</span></span>
  <h2>Takara Tomy Beyblade X BX-00 Cobalt Dragoon</h2>
</div>
</body></html>`;

describe("amazon client", () => {
  it("builds canonical item urls", () => {
    expect(amazonItemUrl("B0C1234567")).toBe("https://www.amazon.com/dp/B0C1234567");
  });

  it("parses search HTML for ASIN rows", () => {
    const page = parseAmazonSearchHtml(FIXTURE_HTML);
    expect(page.items).toHaveLength(2);
    expect(page.items[0]).toMatchObject({ asin: "B0C1234567", price: 19.99 });
  });
});

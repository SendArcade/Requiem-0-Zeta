import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseSearchHtml } from "./client.js";

const __dir = dirname(fileURLToPath(import.meta.url));
const FIXTURE = readFileSync(
  join(__dir, "fixtures/search-snippet.html"),
  "utf8"
);

describe("parseSearchHtml", () => {
  it("extracts product rows and skips kaitori buyback links", () => {
    const items = parseSearchHtml(FIXTURE, 10);
    expect(items.length).toBe(2);
    expect(items.map((i) => i.productId)).toEqual(["708123456", "708654321"]);
    expect(items[0]!.priceJpy).toBe(1980);
    expect(items[0]!.inStock).toBe(true);
    expect(items[1]!.inStock).toBe(false);
  });
});

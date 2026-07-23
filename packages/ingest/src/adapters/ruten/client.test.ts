import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  normalizeSearchOffset,
  parseProdRows,
  parseSearchIds,
  rutenItemUrl,
  RutenClient,
} from "./client.js";

const FIXTURE = JSON.parse(
  readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "fixtures/search-snippet.json"),
    "utf8"
  )
) as {
  search: { TotalRows: number; Rows: { Id: string }[] };
  prod: Parameters<typeof parseProdRows>[0];
};

describe("ruten rtapi parser", () => {
  it("extracts listing ids from search Rows", () => {
    expect(parseSearchIds(FIXTURE.search, 10)).toEqual([
      "22630186592509",
      "22629118691557",
    ]);
  });

  it("maps prod batch rows to normalized items", () => {
    const items = parseProdRows(FIXTURE.prod, 10);

    expect(items).toHaveLength(2);

    const first = items.find((i) => i.gNo === "22630186592509");
    expect(first).toMatchObject({
      title: expect.stringContaining("UX-21"),
      priceTwd: 1000,
      priceRangeMax: 5820,
      soldCount: 3,
      stockQty: 195,
      shippingCost: 0,
    });
    expect(first!.url).toBe(rutenItemUrl("22630186592509"));
    expect(first!.postTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);

    const second = items.find((i) => i.gNo === "22629118691557");
    expect(second).toMatchObject({
      priceTwd: 999,
      soldCount: 39,
    });
  });

  it("normalizes 1-based search offset", () => {
    expect(normalizeSearchOffset()).toBe(1);
    expect(normalizeSearchOffset(0)).toBe(1);
    expect(normalizeSearchOffset(3)).toBe(3);
  });

  it("builds canonical item URLs", () => {
    expect(rutenItemUrl("21311212469710")).toBe(
      "https://www.ruten.com.tw/item/show?21311212469710"
    );
  });

  it("throws when prod batch has no parseable rows", () => {
    expect(() =>
      parseProdRows([{ ProdId: "", ProdName: "x", PriceRange: [1, 1] }], 5)
    ).toThrow(/none parsed cleanly/);
  });
});

describe("ruten client searchItems", () => {
  it("maps search ids through prod batch", async () => {
    const client = new RutenClient({ minIntervalMs: 0 });

    client["fetchJson"] = async <T>(url: string): Promise<T> => {
      if (url.includes("/search/")) return FIXTURE.search as T;
      if (url.includes("/prod/")) return FIXTURE.prod as T;
      throw new Error(`unexpected url ${url}`);
    };

    const items = await client.searchItems("戰鬥陀螺X", { limit: 5 });

    expect(items.length).toBe(2);
    expect(items.every((i) => i.gNo && i.title && i.priceTwd > 0)).toBe(true);
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import type { ProductDTO } from "@beyoracle/shared";

const sample = (id: string, generation: ProductDTO["generation"]): ProductDTO => ({
  id,
  generation,
  skuType: "starter",
  nameEn: id,
  nameJp: null,
  productCodes: [],
  attrs: {},
  partIds: [],
});

describe("loadProducts", () => {
  afterEach(() => {
    vi.resetModules();
    vi.doUnmock("node:fs");
  });

  it("loads legacy products.json when no per-gen files exist", async () => {
    vi.doMock("node:fs", async (importOriginal) => {
      const actual = await importOriginal<typeof import("node:fs")>();
      return {
        ...actual,
        existsSync: (path: string) =>
          String(path).endsWith("products.json") || String(path).endsWith("seeds"),
        readdirSync: () => [],
        readFileSync: (path: string) => {
          if (String(path).endsWith("products.json")) {
            return JSON.stringify([sample("prod-legacy", "burst")]);
          }
          throw new Error(`unexpected read: ${path}`);
        },
      };
    });

    const { loadProducts } = await import("./load.js");
    expect(loadProducts()).toEqual([sample("prod-legacy", "burst")]);
  });

  it("merges per-gen files and dedupes by id with per-gen winning", async () => {
    vi.doMock("node:fs", async (importOriginal) => {
      const actual = await importOriginal<typeof import("node:fs")>();
      return {
        ...actual,
        existsSync: (path: string) =>
          String(path).includes("seeds") || String(path).endsWith(".json"),
        readdirSync: () => ["products-burst.json", "products-x.json"],
        readFileSync: (path: string) => {
          if (String(path).endsWith("products.json")) {
            return JSON.stringify([
              sample("prod-shared", "burst"),
              sample("prod-legacy-only", "metal"),
            ]);
          }
          if (String(path).endsWith("products-burst.json")) {
            return JSON.stringify([
              { ...sample("prod-shared", "burst"), nameEn: "burst override" },
              sample("prod-burst-only", "burst"),
            ]);
          }
          if (String(path).endsWith("products-x.json")) {
            return JSON.stringify([sample("prod-x-only", "x")]);
          }
          throw new Error(`unexpected read: ${path}`);
        },
      };
    });

    const { loadProducts } = await import("./load.js");
    const products = loadProducts();
    expect(products).toHaveLength(4);
    expect(products.find((p) => p.id === "prod-shared")?.nameEn).toBe("burst override");
    expect(products.map((p) => p.id).sort()).toEqual([
      "prod-burst-only",
      "prod-legacy-only",
      "prod-shared",
      "prod-x-only",
    ]);
  });

  it("countProductsByGeneration tallies merged catalog", async () => {
    vi.doMock("node:fs", async (importOriginal) => {
      const actual = await importOriginal<typeof import("node:fs")>();
      return {
        ...actual,
        existsSync: () => true,
        readdirSync: () => ["products-plastic.json"],
        readFileSync: (path: string) => {
          if (String(path).endsWith("products.json")) {
            return JSON.stringify([sample("prod-x", "x")]);
          }
          if (String(path).endsWith("products-plastic.json")) {
            return JSON.stringify([sample("prod-plastic", "plastic")]);
          }
          throw new Error(`unexpected read: ${path}`);
        },
      };
    });

    const { countProductsByGeneration } = await import("./load.js");
    expect(countProductsByGeneration()).toEqual({
      plastic: 1,
      metal: 0,
      burst: 0,
      x: 1,
    });
  });
});

describe("loadProducts integration", () => {
  it("loads the repo seed catalog without per-gen files", async () => {
    const { loadProducts, countProductsByGeneration } = await import("./load.js");
    const products = loadProducts();
    expect(products.length).toBeGreaterThan(0);
    const counts = countProductsByGeneration();
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(products.length);
  });
});

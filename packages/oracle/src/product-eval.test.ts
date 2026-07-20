import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { loadProductMatcherContext } from "@beyoracle/catalog";
import type { ProductEvalCase } from "./product-eval.js";
import { runProductEval } from "./product-eval.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const evalPath = join(__dirname, "..", "fixtures", "eval-product-titles.json");

describe("product matcher eval set", () => {
  const cases = JSON.parse(readFileSync(evalPath, "utf-8")) as ProductEvalCase[];
  const ctx = loadProductMatcherContext();

  it("has labeled product cases spanning plastic/metal/burst complete + negatives", () => {
    expect(cases.length).toBeGreaterThanOrEqual(30);
    const expectedIds = cases.map((c) => c.expectedProductId).filter(Boolean) as string[];
    expect(expectedIds.some((id) => id.includes("plastic"))).toBe(true);
    expect(expectedIds.some((id) => id.includes("metal"))).toBe(true);
    expect(expectedIds.some((id) => id.includes("burst"))).toBe(true);
    expect(cases.some((c) => c.expectedShape === "lot")).toBe(true);
    expect(cases.some((c) => c.expectedShape === "single_part" && c.expectedProductId === null)).toBe(
      true
    );
  });

  it("meets precision-first product match thresholds", () => {
    const report = runProductEval(cases, ctx);
    if (report.failures.length > 0) {
      console.log("Product eval failures:", report.failures);
    }
    expect(report.falsePositiveCount).toBe(0);
    expect(report.productMatchAccuracy).toBeGreaterThanOrEqual(0.85);
    expect(report.shapeAccuracy).toBeGreaterThanOrEqual(0.95);
  });
});

import type { ListingShape } from "@beyoracle/shared";
import { classifyListingShape } from "@beyoracle/shared";
import type { ProductMatcherContext } from "./matcher.js";
import { matchToProduct } from "./matcher.js";

export interface ProductEvalCase {
  title: string;
  expectedProductId: string | null;
  expectedShape: ListingShape;
  note?: string;
}

export interface ProductEvalReport {
  total: number;
  shapeAccuracy: number;
  productMatchAccuracy: number;
  falsePositiveCount: number;
  shapeCorrect: number;
  productMatchCorrect: number;
  failures: Array<{
    title: string;
    expectedProductId: string | null;
    gotProductId: string | null;
    expectedShape: ListingShape;
    gotShape: ListingShape;
    note?: string;
  }>;
}

export function runProductEval(
  cases: ProductEvalCase[],
  ctx: ProductMatcherContext
): ProductEvalReport {
  let shapeCorrect = 0;
  let productMatchCorrect = 0;
  let falsePositiveCount = 0;
  const failures: ProductEvalReport["failures"] = [];

  for (const c of cases) {
    const gotShape = classifyListingShape(c.title);
    const productMatch = matchToProduct(c.title, ctx);
    const gotProductId = productMatch?.productId ?? null;

    const shapeOk = gotShape === c.expectedShape;
    const productOk = gotProductId === c.expectedProductId;

    if (shapeOk) shapeCorrect++;
    if (shapeOk && productOk) productMatchCorrect++;

    // Precision-first: any wrong product id (null→id, wrong SKU/variant, or lot/part→product)
    if (gotProductId != null && gotProductId !== c.expectedProductId) {
      falsePositiveCount++;
    }

    if (!shapeOk || !productOk) {
      failures.push({
        title: c.title,
        expectedProductId: c.expectedProductId,
        gotProductId,
        expectedShape: c.expectedShape,
        gotShape,
        note: c.note,
      });
    }
  }

  const total = cases.length;
  return {
    total,
    shapeCorrect,
    productMatchCorrect,
    falsePositiveCount,
    shapeAccuracy: total ? shapeCorrect / total : 0,
    productMatchAccuracy: total ? productMatchCorrect / total : 0,
    failures,
  };
}

import { loadParts, loadProducts } from "./load.js";
import { analyzeProductRecipe } from "@beyoracle/shared";
import type { ProductDTO, SkuType } from "@beyoracle/shared";

const MARK_SKU_TYPES: ReadonlySet<SkuType> = new Set([
  "starter",
  "complete_loose",
  "complete_sealed",
  "sealed",
]);

export interface ProductValidationIssue {
  productId: string;
  generation: ProductDTO["generation"];
  skuType: SkuType;
  kind: "missing_slot" | "partial_recipe" | "contents_only" | "dangling_part";
  detail: string;
}

/** Catalog lint — whole-SKU products must have complete assembled recipes. */
export function validateProductRecipes(): ProductValidationIssue[] {
  const parts = loadParts();
  const partById = new Map(parts.map((p) => [p.id, p]));
  const issues: ProductValidationIssue[] = [];

  for (const product of loadProducts()) {
    if (!MARK_SKU_TYPES.has(product.skuType)) continue;

    const recipeParts = product.partIds
      .map((id) => partById.get(id))
      .filter((p): p is NonNullable<typeof p> => p != null);

    for (const partId of product.partIds) {
      if (!partById.has(partId)) {
        issues.push({
          productId: product.id,
          generation: product.generation,
          skuType: product.skuType,
          kind: "dangling_part",
          detail: `Unknown part id ${partId}`,
        });
      }
    }

    const analysis = analyzeProductRecipe(product, recipeParts);
    if (analysis.recipeKind === "partial") {
      continue;
    }
    if (analysis.recipeKind === "contents") {
      continue;
    }
    if (analysis.missingSlots.length > 0) {
      issues.push({
        productId: product.id,
        generation: product.generation,
        skuType: product.skuType,
        kind: "missing_slot",
        detail: `Missing slots: ${analysis.missingSlots.join(", ")}`,
      });
    }
  }

  return issues;
}

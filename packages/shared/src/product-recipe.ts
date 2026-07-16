import type { Generation, PartDTO, ProductDTO, SkuType } from "./index.js";

/** How `partIds` should be interpreted for this SKU. */
export type RecipeKind = "assembled" | "contents" | "partial";

/** Required component slots per generation for an assembled whole Bey. */
export const ASSEMBLED_SLOTS: Record<Generation, readonly string[]> = {
  plastic: ["attack_ring", "weight_disk", "blade_base"],
  metal: ["metal_wheel", "spin_track", "performance_tip"],
  burst: ["layer", "forge_disc", "driver"],
  x: ["blade", "ratchet", "bit"],
};

export interface ProductRecipeSlot {
  slot: string;
  partId: string | null;
  partName: string | null;
}

export interface ProductRecipeAnalysis {
  recipeKind: RecipeKind;
  slots: ProductRecipeSlot[];
  presentSlots: string[];
  missingSlots: string[];
  isComplete: boolean;
  /** Whole-SKU oracle marks require assembled + complete recipe. */
  canPublishMark: boolean;
  blockReason: string | null;
}

const MARK_ELIGIBLE_SKU: ReadonlySet<SkuType> = new Set([
  "starter",
  "complete_loose",
  "complete_sealed",
]);

function readRecipeKind(product: ProductDTO): RecipeKind | null {
  const raw = product.attrs?.recipeKind;
  if (raw === "assembled" || raw === "contents" || raw === "partial") return raw;
  return null;
}

/** Infer recipe semantics when seed JSON omits explicit `recipeKind`. */
export function inferRecipeKind(product: ProductDTO): RecipeKind {
  const explicit = readRecipeKind(product);
  if (explicit) return explicit;

  if (product.attrs?.recipe === "layer_only") return "partial";
  if (product.skuType === "sealed") return "contents";
  if (MARK_ELIGIBLE_SKU.has(product.skuType)) return "assembled";
  return "partial";
}

export function analyzeProductRecipe(
  product: ProductDTO,
  parts: Pick<PartDTO, "id" | "partType" | "nameEn">[]
): ProductRecipeAnalysis {
  const recipeKind = inferRecipeKind(product);
  const required = [...ASSEMBLED_SLOTS[product.generation]];
  const partById = new Map(parts.map((p) => [p.id, p]));

  const slots: ProductRecipeSlot[] = required.map((slot) => {
    const match = parts.find((p) => p.partType === slot);
    return {
      slot,
      partId: match?.id ?? null,
      partName: match?.nameEn ?? null,
    };
  });

  const presentSlots = slots.filter((s) => s.partId != null).map((s) => s.slot);
  const missingSlots = required.filter((s) => !presentSlots.includes(s));

  const isComplete =
    recipeKind === "assembled" && missingSlots.length === 0 && parts.length > 0;

  let canPublishMark = false;
  let blockReason: string | null = null;

  if (recipeKind === "contents") {
    blockReason = "Sealed box contents — not a single assembled Bey recipe";
  } else if (recipeKind === "partial") {
    blockReason = "Partial or unknown component recipe";
  } else if (!MARK_ELIGIBLE_SKU.has(product.skuType)) {
    blockReason = `SKU type ${product.skuType} is not eligible for whole-Bey marks`;
  } else if (missingSlots.length > 0) {
    blockReason = `Missing required slots: ${missingSlots.join(", ")}`;
  } else if (parts.length === 0) {
    blockReason = "No parts linked to product recipe";
  } else {
    canPublishMark = true;
  }

  // Guard dangling partIds that aren't in resolved parts list
  for (const partId of product.partIds) {
    if (!partById.has(partId) && canPublishMark) {
      canPublishMark = false;
      blockReason = `Unknown part id in recipe: ${partId}`;
      break;
    }
  }

  return {
    recipeKind,
    slots,
    presentSlots,
    missingSlots,
    isComplete,
    canPublishMark,
    blockReason,
  };
}

export function isProductMarkEligible(
  product: ProductDTO,
  parts: Pick<PartDTO, "id" | "partType" | "nameEn">[]
): boolean {
  return analyzeProductRecipe(product, parts).canPublishMark;
}

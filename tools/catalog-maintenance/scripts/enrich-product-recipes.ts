/**
 * Add recipeKind + defaultComboPartIds to all product seed JSON files.
 * Run after generate-products-* or build-products.ts.
 *
 * Usage: pnpm --filter @beyoracle/catalog-maintenance products:enrich
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Generation, PartDTO, ProductDTO, SkuType } from "@beyoracle/shared";
import {
  analyzeProductRecipe,
  ASSEMBLED_SLOTS,
  inferRecipeKind,
} from "@beyoracle/shared";

const __dirname = dirname(fileURLToPath(import.meta.url));
const seedsDir = join(__dirname, "..", "..", "..", "packages", "catalog", "data", "seeds");
const parts = JSON.parse(
  readFileSync(join(__dirname, "..", "..", "..", "packages", "catalog", "data", "parts.json"), "utf-8")
) as PartDTO[];
const partById = new Map(parts.map((p) => [p.id, p]));

function readProducts(path: string): ProductDTO[] {
  const raw = readFileSync(path, "utf-8").trim();
  if (!raw) return [];
  return JSON.parse(raw) as ProductDTO[];
}

function defaultComboPartIds(product: ProductDTO): string[] | undefined {
  if (inferRecipeKind(product) !== "contents") return undefined;
  const gen = product.generation;
  const required = ASSEMBLED_SLOTS[gen];
  const picked: string[] = [];
  for (const slot of required) {
    const part = product.partIds
      .map((id) => partById.get(id))
      .find((p) => p?.partType === slot);
    if (part) picked.push(part.id);
  }
  return picked.length === required.length ? picked : undefined;
}

function enrichProduct(product: ProductDTO): ProductDTO {
  const recipeParts = product.partIds
    .map((id) => partById.get(id))
    .filter((p): p is PartDTO => p != null);

  const kind = inferRecipeKind(product);
  const analysis = analyzeProductRecipe(product, recipeParts);

  const attrs: ProductDTO["attrs"] = { ...product.attrs, recipeKind: kind };

  if (kind === "contents") {
    const combo = defaultComboPartIds(product);
    if (combo) attrs.defaultComboPartIds = combo;
  }

  if (kind === "partial" && product.attrs?.recipe === "layer_only") {
    attrs.recipe = "layer_only";
  }

  // Fix misleading layer-only labels still named "Complete"
  let nameEn = product.nameEn;
  let nameJp = product.nameJp;
  if (kind === "partial" && product.skuType === "complete_loose") {
    if (nameEn.includes("(Complete)")) {
      nameEn = nameEn.replace("(Complete)", "(Layer only)");
    }
    if (nameJp?.includes("完成品")) {
      nameJp = nameJp.replace("完成品", "レイヤーのみ");
    }
  }

  return {
    ...product,
    nameEn,
    nameJp,
    attrs,
    _analysisComplete: analysis.isComplete,
  } as ProductDTO & { _analysisComplete?: boolean };
}

function stripInternal(p: ProductDTO & { _analysisComplete?: boolean }): ProductDTO {
  const { _analysisComplete: _, ...rest } = p;
  return rest;
}

function main() {
  const files = readdirSync(seedsDir)
    .filter((f) => f.startsWith("products-") && f.endsWith(".json"))
    .sort();

  let total = 0;
  let publishable = 0;
  const byGen: Record<Generation, { total: number; publishable: number }> = {
    plastic: { total: 0, publishable: 0 },
    metal: { total: 0, publishable: 0 },
    burst: { total: 0, publishable: 0 },
    x: { total: 0, publishable: 0 },
  };

  for (const file of files) {
    const path = join(seedsDir, file);
    const products = readProducts(path).map(enrichProduct).map(stripInternal);
    writeFileSync(path, JSON.stringify(products, null, 2) + "\n");

    for (const p of products) {
      total++;
      byGen[p.generation].total++;
      const recipeParts = p.partIds
        .map((id) => partById.get(id))
        .filter((x): x is PartDTO => x != null);
      if (analyzeProductRecipe(p, recipeParts).canPublishMark) {
        publishable++;
        byGen[p.generation].publishable++;
      }
    }
    console.log(`Enriched ${path} (${products.length} products)`);
  }

  console.log("\nRecipe coverage:");
  console.log(`  Total products: ${total}`);
  console.log(`  Publishable whole-Bey marks: ${publishable}`);
  for (const [gen, counts] of Object.entries(byGen)) {
    console.log(`  ${gen}: ${counts.publishable}/${counts.total} publishable`);
  }
}

main();

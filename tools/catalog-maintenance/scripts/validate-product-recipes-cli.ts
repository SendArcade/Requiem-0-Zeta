/**
 * Validate product recipes — exit 1 if assembled SKUs lack required slots.
 *
 * Usage: pnpm --filter @beyoracle/catalog-maintenance products:validate
 */
import { validateProductRecipes } from "@beyoracle/catalog";
import { loadProducts } from "@beyoracle/catalog";
import { analyzeProductRecipe } from "@beyoracle/shared";
import { loadParts } from "@beyoracle/catalog";

function main() {
  const issues = validateProductRecipes();
  const parts = loadParts();
  const partById = new Map(parts.map((p) => [p.id, p]));

  let publishable = 0;
  for (const product of loadProducts()) {
    const recipeParts = product.partIds
      .map((id) => partById.get(id))
      .filter((p): p is NonNullable<typeof p> => p != null);
    if (analyzeProductRecipe(product, recipeParts).canPublishMark) publishable++;
  }

  const missingSlot = issues.filter((i) => i.kind === "missing_slot");
  const partial = issues.filter((i) => i.kind === "partial_recipe");

  console.log(`Products: ${loadProducts().length}`);
  console.log(`Publishable: ${publishable}`);
  console.log(`Issues: ${issues.length} (missing_slot: ${missingSlot.length}, partial: ${partial.length})`);

  if (missingSlot.length > 0) {
    console.error("\nAssembled SKUs missing required slots:");
    for (const i of missingSlot.slice(0, 15)) {
      console.error(`  ${i.productId}: ${i.detail}`);
    }
    if (missingSlot.length > 15) {
      console.error(`  … and ${missingSlot.length - 15} more`);
    }
    process.exit(1);
  }

  console.log("OK — no assembled SKU missing required component slots.");
}

main();

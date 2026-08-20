/**
 * Product oracle coverage report — publishable SKUs vs those with marks.
 *
 *   pnpm product:coverage
 *   pnpm product:coverage -- --generation=x
 */
import { closeDb, getDb, productOracleSnapshots } from "@beyoracle/db";
import {
  listPublishableProducts,
  PRIORITY_PRODUCT_IDS,
} from "../product-backfill-query-plan.js";
import { allSourcesMask, resolvePublishedMinComps, type Generation } from "@beyoracle/shared";
import { eq } from "drizzle-orm";

async function main() {
  const genFlag = process.argv.indexOf("--generation");
  const generation =
    genFlag >= 0 ? (process.argv[genFlag + 1] as Generation | undefined) : undefined;

  const publishable = listPublishableProducts({
    generations: generation ? [generation] : undefined,
  });

  const db = getDb();
  const snaps = await db
    .select()
    .from(productOracleSnapshots)
    .where(eq(productOracleSnapshots.sourcesMask, allSourcesMask()));

  const snapByProduct = new Map(snaps.map((s) => [s.productId, s]));
  const minComps = resolvePublishedMinComps();

  const withComps = publishable.filter(
    (p: (typeof publishable)[number]) => (snapByProduct.get(p.id)?.nComps ?? 0) >= 1
  ).length;
  const withMark = publishable.filter(
    (p: (typeof publishable)[number]) =>
      (snapByProduct.get(p.id)?.nComps ?? 0) >= minComps
  ).length;
  const priorityWithMark = (PRIORITY_PRODUCT_IDS as readonly string[]).filter(
    (id: string) => (snapByProduct.get(id)?.nComps ?? 0) >= minComps
  ).length;

  const sparsePriority = (PRIORITY_PRODUCT_IDS as readonly string[]).filter(
    (id: string) => (snapByProduct.get(id)?.nComps ?? 0) < minComps
  ).map((id: string) => {
    const p = publishable.find((x: (typeof publishable)[number]) => x.id === id);
    const snap = snapByProduct.get(id);
    return `${p?.nameEn ?? id} nComps=${snap?.nComps ?? 0}`;
  });

  const pct = publishable.length
    ? ((withMark / publishable.length) * 100).toFixed(1)
    : "0.0";

  console.log("[coverage] product oracle");
  console.log(`  publishable SKUs: ${publishable.length}${generation ? ` (${generation})` : ""}`);
  console.log(`  with ≥1 comp:     ${withComps}`);
  console.log(`  with ≥${minComps} comps:    ${withMark} (${pct}%)`);
  console.log(
    `  priority anchors: ${priorityWithMark}/${PRIORITY_PRODUCT_IDS.length} at ≥${minComps} comps`
  );

  // Per-generation breakdown (plastic / metal / burst focus).
  if (!generation) {
    for (const gen of ["plastic", "metal", "burst", "x"] as Generation[]) {
      const genProducts = publishable.filter((p) => p.generation === gen);
      if (genProducts.length === 0) continue;
      const genWithMark = genProducts.filter(
        (p) => (snapByProduct.get(p.id)?.nComps ?? 0) >= minComps
      ).length;
      const genPct = ((genWithMark / genProducts.length) * 100).toFixed(1);
      console.log(
        `  ${gen}: publishable=${genProducts.length} withMark≥${minComps}=${genWithMark} (${genPct}%)`
      );
    }
  }

  if (sparsePriority.length > 0) {
    console.log("  sparse priority:");
    for (const line of sparsePriority.slice(0, 12)) console.log(`    - ${line}`);
  }

  await closeDb();
}

main().catch(async (err) => {
  console.error("[coverage] failed:", (err as Error).message);
  await closeDb();
  process.exit(1);
});

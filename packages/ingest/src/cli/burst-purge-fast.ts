/**
 * Fast burst product-match cleanup — drop rows failing comp-eligibility gates
 * without re-running full product matcher (seconds vs minutes).
 *
 *   pnpm --filter @beyoracle/ingest burst:purge-fast
 *   PURGE_DRY_RUN=1 pnpm --filter @beyoracle/ingest burst:purge-fast
 */
import { closeDb, getDb, observations, productMatches, products } from "@beyoracle/db";
import {
  classifyListingShape,
  isIngestEligible,
  isProductCompEligible,
  looksLikeBeybladeListing,
} from "@beyoracle/shared";
import { eq, inArray } from "drizzle-orm";
import { recomputeProductOracleSnapshotsBatch } from "../persist.js";

function isFastBadProductTitle(title: string): boolean {
  if (!looksLikeBeybladeListing(title)) return true;
  if (classifyListingShape(title) === "lot") return true;
  if (!isIngestEligible(title)) return true;
  if (!isProductCompEligible(title)) return true;
  return false;
}

async function main() {
  const dryRun = process.env.PURGE_DRY_RUN === "1";
  const db = getDb();

  const rows = await db
    .select({
      matchId: productMatches.id,
      productId: productMatches.productId,
      title: observations.title,
    })
    .from(productMatches)
    .innerJoin(observations, eq(productMatches.observationId, observations.id))
    .innerJoin(products, eq(productMatches.productId, products.id))
    .where(eq(products.generation, "burst"));

  const badIds: string[] = [];
  const touched = new Set<string>();
  const samples: string[] = [];

  for (const row of rows) {
    if (!isFastBadProductTitle(row.title)) continue;
    badIds.push(row.matchId);
    touched.add(row.productId);
    if (samples.length < 10) samples.push(row.title.slice(0, 90));
  }

  const mode = dryRun ? "dry-run" : "apply";
  console.log(
    `[burst:purge-fast:${mode}] ${badIds.length}/${rows.length} burst product matches flagged`
  );
  for (const s of samples) console.log(`  - ${s}`);

  if (badIds.length === 0 || dryRun) {
    await closeDb();
    return;
  }

  for (let i = 0; i < badIds.length; i += 500) {
    await db.delete(productMatches).where(inArray(productMatches.id, badIds.slice(i, i + 500)));
  }

  await recomputeProductOracleSnapshotsBatch(touched);
  console.log(`[burst:purge-fast] recomputed ${touched.size} products`);
  await closeDb();
}

main().catch(async (err) => {
  console.error("[burst:purge-fast] failed:", (err as Error).message);
  await closeDb();
  process.exit(1);
});

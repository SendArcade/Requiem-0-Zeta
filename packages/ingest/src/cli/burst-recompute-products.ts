/** Recompute product oracle snapshots for burst SKUs that still have matches. */
import { closeDb, getDb, products, productMatches } from "@beyoracle/db";
import { eq } from "drizzle-orm";
import { recomputeProductOracleSnapshotsBatch } from "../persist.js";

async function main() {
  const db = getDb();
  const rows = await db
    .selectDistinct({ productId: productMatches.productId })
    .from(productMatches)
    .innerJoin(products, eq(productMatches.productId, products.id))
    .where(eq(products.generation, "burst"));
  const ids = rows.map((r) => r.productId);
  console.log(`[burst:recompute] ${ids.length} products`);
  await recomputeProductOracleSnapshotsBatch(new Set(ids));
  await closeDb();
}

main().catch(async (err) => {
  console.error("[burst:recompute] failed:", (err as Error).message);
  await closeDb();
  process.exit(1);
});

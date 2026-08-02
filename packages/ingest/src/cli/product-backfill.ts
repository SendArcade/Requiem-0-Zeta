/**
 * Targeted whole-SKU backfill — Mercari + Yahoo with English + JP queries.
 *
 *   pnpm backfill:products
 *   PRODUCT_BACKFILL_PRIORITY_ONLY=1 pnpm backfill:products
 *   PRODUCT_BACKFILL_MAX_QUERIES=200 BACKFILL_SOURCES=mercari_jp,yahoo_auctions_jp pnpm backfill:products
 */
import { closeDb } from "@beyoracle/db";
import { runProductBackfill } from "../product-backfill.js";

async function main() {
  const force = process.env.FORCE_PRODUCT_BACKFILL === "1";
  const priorityOnly = process.env.PRODUCT_BACKFILL_PRIORITY_ONLY === "1";

  const report = await runProductBackfill({ force, priorityOnly });
  console.log("[product-backfill] complete:", JSON.stringify(report, null, 2));
  await closeDb();

  if (report.errors.length > 0 && report.matched === 0) {
    process.exit(1);
  }
}

main().catch(async (err) => {
  console.error("[product-backfill] failed:", (err as Error).message);
  await closeDb();
  process.exit(1);
});

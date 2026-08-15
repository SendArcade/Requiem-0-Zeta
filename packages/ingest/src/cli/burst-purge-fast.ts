/**
 * Fast burst product-match cleanup — drop rows failing comp-eligibility gates
 * without re-running full product matcher (seconds vs minutes).
 *
 *   pnpm --filter @beyoracle/ingest burst:purge-fast
 *   PURGE_DRY_RUN=1 pnpm --filter @beyoracle/ingest burst:purge-fast
 */
import { closeDb } from "@beyoracle/db";
import { runBurstPurgeFast } from "../burst-purge-fast.js";

async function main() {
  const dryRun = process.env.PURGE_DRY_RUN === "1";
  const result = await runBurstPurgeFast({ dryRun });
  const mode = dryRun ? "dry-run" : "apply";

  console.log(
    `[burst:purge-fast:${mode}] ${result.purged}/${result.scanned} burst product matches flagged`
  );
  for (const s of result.samples) console.log(`  - ${s}`);

  if (!dryRun && result.purged > 0) {
    console.log(`[burst:purge-fast] recomputed ${result.recomputedProducts} products`);
  }

  await closeDb();
}

main().catch(async (err) => {
  console.error("[burst:purge-fast] failed:", (err as Error).message);
  await closeDb();
  process.exit(1);
});

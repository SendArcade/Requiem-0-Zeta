/**
 * Re-match sold burst observations that have no product_match row (e.g. after purge
 * removed sealed-on-starter links). Uses current matcher + comp-eligibility gates.
 *
 * Default: sealed-title rows only (post purge:bad-comps). Set REMATCH_ALL=1 for broader pass.
 *
 *   pnpm --filter @beyoracle/ingest burst:rematch-unmatched
 *   REMATCH_DRY_RUN=1 pnpm --filter @beyoracle/ingest burst:rematch-unmatched
 */
import { closeDb } from "@beyoracle/db";
import { runBurstRematchUnmatched } from "../burst-rematch-unmatched.js";

async function main() {
  const dryRun = process.env.REMATCH_DRY_RUN === "1";
  const allBurstish = process.env.REMATCH_ALL === "1";
  const wave0Only = process.env.REMATCH_WAVE0 !== "0";

  const result = await runBurstRematchUnmatched({
    dryRun,
    allBurstish,
    wave0Only,
  });

  const mode = dryRun ? "dry-run" : "apply";
  console.log(
    `[burst:rematch-unmatched:${mode}] candidates=${result.candidates} scanned=${result.scanned} matched=${result.matched} gateSkip=${result.gateSkip} nonBurst=${result.nonBurst} lowConf=${result.lowConf}`
  );
  for (const s of result.samples) console.log(`  - ${s}`);

  if (!dryRun && result.recomputedProducts > 0) {
    console.log(`[burst:rematch-unmatched] recomputed ${result.recomputedProducts} products`);
  }

  await closeDb();
}

main().catch(async (err) => {
  console.error("[burst:rematch-unmatched] failed:", (err as Error).message);
  await closeDb();
  process.exit(1);
});

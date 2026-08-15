/**
 * Wave 0 maintenance sequence — run on Railway worker via BURST_WAVE0_MAINTENANCE=1.
 * No Apify required; uses matcher re-validation + sealed rematch on existing observations.
 */
import { getDb, products, productMatches } from "@beyoracle/db";
import { eq } from "drizzle-orm";
import { runBurstPurgeFast } from "./burst-purge-fast.js";
import { runBurstRematchUnmatched } from "./burst-rematch-unmatched.js";
import { purgeBadComps } from "./purge-bad-comps.js";
import { recomputeProductOracleSnapshotsBatch } from "./persist.js";
import { summarizeWave0Status } from "./burst-wave0-status-lib.js";

export type BurstWave0MaintenanceReport = {
  dryRun: boolean;
  purgeFast: Awaited<ReturnType<typeof runBurstPurgeFast>>;
  purgeStale: Awaited<ReturnType<typeof purgeBadComps>>;
  rematch: Awaited<ReturnType<typeof runBurstRematchUnmatched>>;
  recomputedBurstProducts: number;
  wave0: Awaited<ReturnType<typeof summarizeWave0Status>>;
};

export async function runBurstWave0Maintenance(opts: {
  dryRun?: boolean;
} = {}): Promise<BurstWave0MaintenanceReport> {
  const dryRun = opts.dryRun ?? false;

  console.log(`[burst:wave0-maintenance] start dryRun=${dryRun}`);

  const purgeFast = await runBurstPurgeFast({ dryRun });
  console.log(
    `[burst:wave0-maintenance] purge-fast ${purgeFast.purged}/${purgeFast.scanned} flagged`
  );

  const purgeStale = await purgeBadComps({
    dryRun,
    generations: ["burst"],
    skipPartMatches: true,
  });
  console.log(
    `[burst:wave0-maintenance] purge-stale ${purgeStale.badProductMatches} product matches`
  );

  const rematch = await runBurstRematchUnmatched({
    dryRun,
    wave0Only: true,
  });
  console.log(`[burst:wave0-maintenance] rematch matched=${rematch.matched}`);

  let recomputedBurstProducts = 0;
  if (!dryRun) {
    const db = getDb();
    const rows = await db
      .selectDistinct({ productId: productMatches.productId })
      .from(productMatches)
      .innerJoin(products, eq(productMatches.productId, products.id))
      .where(eq(products.generation, "burst"));
    const ids = new Set(rows.map((r) => r.productId));
    await recomputeProductOracleSnapshotsBatch(ids);
    recomputedBurstProducts = ids.size;
    console.log(`[burst:wave0-maintenance] recomputed ${recomputedBurstProducts} burst products`);
  }

  const wave0 = await summarizeWave0Status();

  return {
    dryRun,
    purgeFast,
    purgeStale,
    rematch,
    recomputedBurstProducts,
    wave0,
  };
}

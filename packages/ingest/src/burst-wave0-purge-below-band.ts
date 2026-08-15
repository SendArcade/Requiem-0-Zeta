/**
 * Drop used starter comps whose landed JPY sits below Wave 0 venue-band floor.
 * Targets B-97 / B-104 skew (and any future gap SKU in WAVE0_FAILING_STARTERS).
 */
import { getDb, observations, productMatches } from "@beyoracle/db";
import { and, eq, isNotNull, lt } from "drizzle-orm";
import { WAVE0_STARTER_BANDS } from "./burst-wave0-ids.js";
import { WAVE0_FAILING_STARTERS } from "./burst-wave0-targets.js";
import { recomputeProductOracleSnapshotsBatch } from "./persist.js";

export type PurgeWave0BelowBandResult = {
  scanned: number;
  purged: number;
  samples: string[];
  recomputedProducts: number;
};

export async function purgeWave0BelowBand(opts: {
  dryRun?: boolean;
} = {}): Promise<PurgeWave0BelowBandResult> {
  const dryRun = opts.dryRun ?? false;
  const db = getDb();
  const samples: string[] = [];
  const touched = new Set<string>();
  let scanned = 0;
  let purged = 0;

  for (const productId of WAVE0_FAILING_STARTERS) {
    const band = WAVE0_STARTER_BANDS[productId];
    if (!band) continue;

    const rows = await db
      .select({
        matchId: productMatches.id,
        title: observations.title,
        landedJpy: observations.landedJpy,
      })
      .from(productMatches)
      .innerJoin(observations, eq(productMatches.observationId, observations.id))
      .where(
        and(
          eq(productMatches.productId, productId),
          eq(observations.condition, "used"),
          isNotNull(observations.landedJpy),
          lt(observations.landedJpy, band.min)
        )
      );

    for (const row of rows) {
      scanned++;
      touched.add(productId);
      if (samples.length < 12) {
        samples.push(
          `¥${row.landedJpy} < ¥${band.min} — ${productId} ← ${row.title.slice(0, 60)}`
        );
      }
      if (!dryRun) {
        await db.delete(productMatches).where(eq(productMatches.id, row.matchId));
      }
      purged++;
    }
  }

  let recomputedProducts = 0;
  if (!dryRun && touched.size > 0) {
    await recomputeProductOracleSnapshotsBatch(touched);
    recomputedProducts = touched.size;
  }

  return { scanned, purged, samples, recomputedProducts };
}

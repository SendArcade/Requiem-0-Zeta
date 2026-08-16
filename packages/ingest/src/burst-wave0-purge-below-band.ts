/**
 * Drop used starter comps whose landed JPY sits below Wave 0 venue-band floor.
 * Only when ≥3 in-band comps remain — avoids zeroing marks before fresh ingest lands.
 */
import { getDb, observations, productMatches, productOracleSnapshots } from "@beyoracle/db";
import { and, desc, eq, gte, isNotNull, lt, lte } from "drizzle-orm";
import { WAVE0_STARTER_BANDS } from "./burst-wave0-ids.js";
import { WAVE0_FAILING_STARTERS } from "./burst-wave0-targets.js";
import { recomputeProductOracleSnapshotsBatch } from "./persist.js";

const MIN_COMPS_AFTER_PURGE = 3;

export type PurgeWave0BelowBandResult = {
  scanned: number;
  purged: number;
  skippedProducts: string[];
  samples: string[];
  recomputedProducts: number;
};

export async function purgeWave0BelowBand(opts: {
  dryRun?: boolean;
} = {}): Promise<PurgeWave0BelowBandResult> {
  const dryRun = opts.dryRun ?? false;
  const db = getDb();
  const samples: string[] = [];
  const skippedProducts: string[] = [];
  const touched = new Set<string>();
  let scanned = 0;
  let purged = 0;

  for (const productId of WAVE0_FAILING_STARTERS) {
    const band = WAVE0_STARTER_BANDS[productId];
    if (!band) continue;

    const inBandRows = await db
      .select({ id: productMatches.id })
      .from(productMatches)
      .innerJoin(observations, eq(productMatches.observationId, observations.id))
      .where(
        and(
          eq(productMatches.productId, productId),
          eq(observations.condition, "used"),
          isNotNull(observations.landedJpy),
          gte(observations.landedJpy, band.min),
          lte(observations.landedJpy, band.max)
        )
      );

    const belowBandRows = await db
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

    scanned += belowBandRows.length;

    if (belowBandRows.length === 0) continue;

    const snapRows = await db
      .select({ value: productOracleSnapshots.value })
      .from(productOracleSnapshots)
      .where(eq(productOracleSnapshots.productId, productId))
      .orderBy(desc(productOracleSnapshots.nComps))
      .limit(1);
    const currentMark = snapRows[0]?.value == null ? null : Number(snapRows[0]!.value);
    const markBelowFloor = currentMark != null && currentMark < band.min;

    if (inBandRows.length < MIN_COMPS_AFTER_PURGE && !markBelowFloor) {
      skippedProducts.push(
        `${productId} (${inBandRows.length} in-band, ${belowBandRows.length} below — need ingest first)`
      );
      continue;
    }

    for (const row of belowBandRows) {
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

  if (skippedProducts.length > 0) {
    console.log(
      `[burst:wave0-purge-below-band] skipped ${skippedProducts.length} products (insufficient in-band pool): ${skippedProducts.join("; ")}`
    );
  }

  return { scanned, purged, skippedProducts, samples, recomputedProducts };
}

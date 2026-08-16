/**
 * Report used comps below Wave 0 venue-band floor — diagnostic only by default.
 * Real sold prices stay in the comp pool; ingest adds higher comps to move the median.
 * Opt-in delete: WAVE0_PURGE_BELOW_BAND=1 (destructive — rarely needed).
 */
import { getDb, observations, productMatches } from "@beyoracle/db";
import { and, eq, gte, isNotNull, lt, lte } from "drizzle-orm";
import { WAVE0_STARTER_BANDS } from "./burst-wave0-ids.js";
import { WAVE0_FAILING_STARTERS } from "./burst-wave0-targets.js";
import { recomputeProductOracleSnapshotsBatch } from "./persist.js";

export type PurgeWave0BelowBandResult = {
  scanned: number;
  purged: number;
  skippedProducts: string[];
  samples: string[];
  recomputedProducts: number;
  diagnosticOnly: boolean;
};

export async function purgeWave0BelowBand(opts: {
  dryRun?: boolean;
} = {}): Promise<PurgeWave0BelowBandResult> {
  const dryRun = opts.dryRun ?? false;
  const allowDelete = process.env.WAVE0_PURGE_BELOW_BAND === "1";
  const diagnosticOnly = !allowDelete;

  const db = getDb();
  const samples: string[] = [];
  const skippedProducts: string[] = [];
  const touched = new Set<string>();
  let scanned = 0;
  let purged = 0;

  for (const productId of WAVE0_FAILING_STARTERS) {
    const band = WAVE0_STARTER_BANDS[productId];
    if (!band) continue;

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

    const inBandCount = await db
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

    for (const row of belowBandRows) {
      if (samples.length < 12) {
        samples.push(
          `¥${row.landedJpy} < ¥${band.min} — ${productId} ← ${row.title.slice(0, 60)}`
        );
      }
      if (diagnosticOnly || dryRun) continue;

      touched.add(productId);
      await db.delete(productMatches).where(eq(productMatches.id, row.matchId));
      purged++;
    }

    if (belowBandRows.length > 0 && diagnosticOnly) {
      skippedProducts.push(
        `${productId} (${belowBandRows.length} below-band kept, ${inBandCount.length} in-band — add comps via ingest)`
      );
    }
  }

  let recomputedProducts = 0;
  if (!dryRun && !diagnosticOnly && touched.size > 0) {
    await recomputeProductOracleSnapshotsBatch(touched);
    recomputedProducts = touched.size;
  }

  if (diagnosticOnly && scanned > 0) {
    console.log(
      `[burst:wave0-purge-below-band] diagnostic only — ${scanned} below-band comps kept (set WAVE0_PURGE_BELOW_BAND=1 to delete)`
    );
  }

  if (skippedProducts.length > 0) {
    console.log(`[burst:wave0-purge-below-band] ${skippedProducts.join("; ")}`);
  }

  return { scanned, purged, skippedProducts, samples, recomputedProducts, diagnosticOnly };
}

/**
 * Fast burst product-match cleanup — eligibility gates only (no full matcher re-run).
 */
import { getDb, productMatches, products, observations } from "@beyoracle/db";
import {
  classifyListingShape,
  isIngestEligible,
  isProductCompEligible,
  looksLikeBeybladeListing,
} from "@beyoracle/shared";
import { eq, inArray } from "drizzle-orm";
import { recomputeProductOracleSnapshotsBatch } from "./persist.js";

export type BurstPurgeFastResult = {
  scanned: number;
  purged: number;
  recomputedProducts: number;
  samples: string[];
};

function isFastBadProductTitle(title: string): boolean {
  if (!looksLikeBeybladeListing(title)) return true;
  if (classifyListingShape(title) === "lot") return true;
  if (!isIngestEligible(title)) return true;
  if (!isProductCompEligible(title)) return true;
  return false;
}

export async function runBurstPurgeFast(opts: {
  dryRun?: boolean;
} = {}): Promise<BurstPurgeFastResult> {
  const dryRun = opts.dryRun ?? false;
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

  if (badIds.length === 0 || dryRun) {
    return {
      scanned: rows.length,
      purged: badIds.length,
      recomputedProducts: 0,
      samples,
    };
  }

  for (let i = 0; i < badIds.length; i += 500) {
    await db.delete(productMatches).where(inArray(productMatches.id, badIds.slice(i, i + 500)));
  }

  await recomputeProductOracleSnapshotsBatch(touched);

  return {
    scanned: rows.length,
    purged: badIds.length,
    recomputedProducts: touched.size,
    samples,
  };
}

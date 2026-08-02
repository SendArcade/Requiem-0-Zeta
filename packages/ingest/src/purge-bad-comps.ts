import { getDb, closeDb, matches, observations, productMatches } from "@beyoracle/db";
import {
  classifyListingShape,
  isCompEligible,
  isIngestEligible,
  isProductCompEligible,
  looksLikeBeybladeListing,
} from "@beyoracle/shared";
import { eq, inArray } from "drizzle-orm";
import { recomputeAllOracleSnapshots } from "./backfill-oracle.js";
import { resolveIngestMatch, type IngestMatch } from "./match-ingest.js";
import { shouldPersistMatch } from "./match-confidence-routing.js";

export type PurgeBadCompsOptions = {
  /** Log counts only — no deletes or recompute. */
  dryRun?: boolean;
  /** Also delete orphaned observations (legacy behavior). Default false — preserve raw market rows. */
  deleteObservations?: boolean;
};

export type PurgeBadCompsResult = {
  badPartMatches: number;
  badProductMatches: number;
  /** Observations deleted when deleteObservations=true. */
  purgedObservations: number;
  preservedObservations: number;
  recomputedParts: number;
  recomputedProducts: number;
  /** Sample titles for dry-run inspection. */
  samples: string[];
};

function isBadCompTitle(title: string, kind: "part" | "product"): boolean {
  if (!looksLikeBeybladeListing(title)) return true;
  if (classifyListingShape(title) === "lot") return true;
  if (!isIngestEligible(title)) return true;
  if (kind === "part" && !isCompEligible(title)) return true;
  if (kind === "product" && !isProductCompEligible(title)) return true;
  return false;
}

function freshMatchId(match: IngestMatch): string {
  return match.kind === "product" ? match.match.productId : match.match.partId;
}

function freshMatchConfidence(match: IngestMatch): number {
  return match.match.confidence;
}

/** Re-run matcher v3.1 gates — drop stale/wrong persisted rows. */
export function isStaleOrWrongMatch(
  title: string,
  kind: "part" | "product",
  storedId: string,
  storedConfidence: number
): boolean {
  if (isBadCompTitle(title, kind)) return true;

  const shape = classifyListingShape(title);
  const fresh = resolveIngestMatch(title, { shape });
  if (!fresh) return true;
  if (!shouldPersistMatch(freshMatchConfidence(fresh))) return true;
  if (fresh.kind !== kind) return true;
  if (freshMatchId(fresh) !== storedId) return true;

  // Stored row below auto-accept should never have been persisted.
  if (!shouldPersistMatch(storedConfidence)) return true;

  return false;
}

export async function purgeBadComps(
  opts: PurgeBadCompsOptions = {}
): Promise<PurgeBadCompsResult> {
  const dryRun = opts.dryRun ?? false;
  const deleteObservations = opts.deleteObservations ?? false;

  const db = getDb();
  const badPartMatchIds: string[] = [];
  const badProductMatchIds: string[] = [];
  const badObsIds = new Set<string>();
  const samples: string[] = [];

  const partRows = await db
    .select({
      matchId: matches.id,
      observationId: matches.observationId,
      partId: matches.partId,
      confidence: matches.confidence,
      title: observations.title,
    })
    .from(matches)
    .innerJoin(observations, eq(matches.observationId, observations.id));

  for (const row of partRows) {
    if (isStaleOrWrongMatch(row.title, "part", row.partId, row.confidence)) {
      badPartMatchIds.push(row.matchId);
      badObsIds.add(row.observationId);
      if (samples.length < 8) samples.push(`[part] ${row.title.slice(0, 80)}`);
    }
  }

  const productRows = await db
    .select({
      matchId: productMatches.id,
      observationId: productMatches.observationId,
      productId: productMatches.productId,
      confidence: productMatches.confidence,
      title: observations.title,
    })
    .from(productMatches)
    .innerJoin(observations, eq(productMatches.observationId, observations.id));

  for (const row of productRows) {
    if (
      isStaleOrWrongMatch(row.title, "product", row.productId, row.confidence)
    ) {
      badProductMatchIds.push(row.matchId);
      badObsIds.add(row.observationId);
      if (samples.length < 8) samples.push(`[product] ${row.title.slice(0, 80)}`);
    }
  }

  const totalBad = badPartMatchIds.length + badProductMatchIds.length;
  if (totalBad === 0) {
    await closeDb();
    return {
      badPartMatches: 0,
      badProductMatches: 0,
      purgedObservations: 0,
      preservedObservations: 0,
      recomputedParts: 0,
      recomputedProducts: 0,
      samples: [],
    };
  }

  if (dryRun) {
    await closeDb();
    return {
      badPartMatches: badPartMatchIds.length,
      badProductMatches: badProductMatchIds.length,
      purgedObservations: 0,
      preservedObservations: badObsIds.size,
      recomputedParts: 0,
      recomputedProducts: 0,
      samples,
    };
  }

  const CHUNK = 500;
  for (let i = 0; i < badPartMatchIds.length; i += CHUNK) {
    const chunk = badPartMatchIds.slice(i, i + CHUNK);
    await db.delete(matches).where(inArray(matches.id, chunk));
  }
  for (let i = 0; i < badProductMatchIds.length; i += CHUNK) {
    const chunk = badProductMatchIds.slice(i, i + CHUNK);
    await db.delete(productMatches).where(inArray(productMatches.id, chunk));
  }

  let purgedObservations = 0;
  if (deleteObservations) {
    const allBadObsIds = [...badObsIds];
    for (let i = 0; i < allBadObsIds.length; i += CHUNK) {
      const chunk = allBadObsIds.slice(i, i + CHUNK);
      await db.delete(observations).where(inArray(observations.id, chunk));
    }
    purgedObservations = allBadObsIds.length;
  }

  const recompute = await recomputeAllOracleSnapshots();
  await closeDb();

  return {
    badPartMatches: badPartMatchIds.length,
    badProductMatches: badProductMatchIds.length,
    purgedObservations,
    preservedObservations: deleteObservations ? 0 : badObsIds.size,
    recomputedParts: recompute.parts,
    recomputedProducts: recompute.products,
    samples,
  };
}

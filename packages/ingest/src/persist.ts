import { randomUUID } from "node:crypto";
import { getPartById, getPartsByGeneration, getProductById } from "@beyoracle/catalog";
import {
  getDb,
  matchReviewQueue,
  matches,
  observations,
  oracleSnapshots,
  productMatches,
  productOracleSnapshots,
  saleEvents,
} from "@beyoracle/db";
import {
  buildOracleContext,
  cohortCompsMap,
  computeOracleValue,
  computeProductOracleValue,
  type CompInput,
} from "@beyoracle/oracle";
import type { MatchMethod, ObservationDTO, SourceId } from "@beyoracle/shared";
import {
  computeLandedJpy,
  allSourcesMask,
  DEFAULT_PUBLISHED_MIN_COMPS,
  isLiveMarketplaceComp,
  isIngestEligible,
  isProductCompEligible,
  isCompEligible,
  isProductMarkEligible,
  looksLikeBeybladeListing,
  resolveEvidenceKind,
} from "@beyoracle/shared";
import { publishEvent, type SaleEvent } from "@beyoracle/events";
import { and, desc, eq, gt, inArray, or } from "drizzle-orm";
import type { IngestMatch } from "./match-ingest.js";
import {
  shouldPersistMatch,
  shouldQueueForReview,
} from "./match-confidence-routing.js";
import {
  deferOracleRecomputeEnabled,
  getOracleRecomputeEnqueuer,
} from "./oracle-recompute.js";

export type { IngestMatch } from "./match-ingest.js";
export { resolveIngestMatch } from "./match-ingest.js";

export interface PersistResult {
  inserted: number;
  updated: number;
  matched: number;
  bundlesStored: number;
  partsTouched: Set<string>;
  productsTouched: Set<string>;
}

type ObsCompRow = {
  partId?: string;
  price: number;
  currency: string;
  source: SourceId;
  observedAt: Date;
  status: "listing" | "sold";
  condition: CompInput["condition"];
  landedJpy: number | null;
  fxRateAtSale: number | null;
  rawJson?: Record<string, unknown> | null;
};

function venueMultiplierFromRaw(
  source: SourceId,
  rawJson?: Record<string, unknown> | null
): number {
  const mult = rawJson?.venueWeightMultiplier;
  if (typeof mult === "number" && mult >= 0) return mult;
  if (source === "ruten_tw" && rawJson?.priceKind === "sold_proxy") return 0.35;
  return 1;
}

export function rowToCompInput(r: Omit<ObsCompRow, "partId">): CompInput {
  return {
    price: r.price,
    currency: r.currency as CompInput["currency"],
    source: r.source,
    observedAt: r.observedAt,
    status: r.status,
    condition: r.condition,
    landedJpy: r.landedJpy,
    fxRateAtSale: r.fxRateAtSale,
    venueWeightMultiplier: venueMultiplierFromRaw(r.source, r.rawJson),
    evidenceKind: resolveEvidenceKind(r.source, r.rawJson ?? undefined),
  };
}

export { isLiveMarketplaceComp };

const compEligibleFilter = eq(observations.isBundle, false);

/** Sold comps for all parts in the same generation × partType bucket. */
export async function loadCohortCompsForPart(
  partId: string
): Promise<Map<string, CompInput[]>> {
  const part = getPartById(partId);
  if (!part) return new Map();

  const peerIds = getPartsByGeneration(part.generation)
    .filter((p) => p.partType === part.partType)
    .map((p) => p.id);

  if (peerIds.length === 0) return new Map();

  const db = getDb();
  const rows = await db
    .select({
      partId: matches.partId,
      price: observations.price,
      currency: observations.currency,
      source: observations.source,
      observedAt: observations.observedAt,
      status: observations.status,
      condition: observations.condition,
      landedJpy: observations.landedJpy,
      fxRateAtSale: observations.fxRateAtSale,
      rawJson: observations.rawJson,
    })
    .from(matches)
    .innerJoin(observations, eq(matches.observationId, observations.id))
    .where(and(inArray(matches.partId, peerIds), compEligibleFilter));

  const map = new Map<string, CompInput[]>();
  for (const r of rows) {
    const list = map.get(r.partId) ?? [];
    list.push(rowToCompInput(r));
    map.set(r.partId, list);
  }
  return map;
}

export async function persistObservation(
  observation: ObservationDTO,
  match: IngestMatch | null,
  opts: { isBundle?: boolean } = {}
): Promise<{
  isNew: boolean;
  partId: string | null;
  productId: string | null;
  priorPartId: string | null;
  priorProductId: string | null;
}> {
  const db = getDb();
  const obsId = observation.id;
  const isBundle = opts.isBundle ?? false;

  const existing = await db
    .select({ id: observations.id })
    .from(observations)
    .where(eq(observations.id, obsId))
    .limit(1);

  const isNew = existing.length === 0;

  const landed = await computeLandedJpy({
    source: observation.source,
    price: observation.price,
    currency: observation.currency,
    observedAt: observation.observedAt,
    rawJson: observation.rawJson,
  });

  await db
    .insert(observations)
    .values({
      id: obsId,
      source: observation.source,
      externalId: observation.externalId,
      title: observation.title,
      price: observation.price,
      currency: observation.currency,
      status: observation.status,
      condition: observation.condition,
      url: observation.url,
      observedAt: observation.observedAt,
      rawJson: observation.rawJson,
      landedJpy: landed.landedJpy,
      fxRateAtSale: landed.fxRateAtSale,
      shippingJpy: landed.shippingJpy,
      isBundle,
    })
    .onConflictDoUpdate({
      target: observations.id,
      set: {
        title: observation.title,
        price: observation.price,
        status: observation.status,
        condition: observation.condition,
        url: observation.url,
        observedAt: observation.observedAt,
        rawJson: observation.rawJson,
        landedJpy: landed.landedJpy,
        fxRateAtSale: landed.fxRateAtSale,
        shippingJpy: landed.shippingJpy,
        isBundle,
      },
    });

  let partId: string | null = null;
  let productId: string | null = null;

  const [priorPartRow] = await db
    .select({ partId: matches.partId })
    .from(matches)
    .where(eq(matches.observationId, obsId))
    .limit(1);
  const [priorProductRow] = await db
    .select({ productId: productMatches.productId })
    .from(productMatches)
    .where(eq(productMatches.observationId, obsId))
    .limit(1);
  const priorPartId = priorPartRow?.partId ?? null;
  const priorProductId = priorProductRow?.productId ?? null;

  await db.transaction(async (tx) => {
    await tx.delete(matches).where(eq(matches.observationId, obsId));
    await tx.delete(productMatches).where(eq(productMatches.observationId, obsId));
    await tx
      .delete(matchReviewQueue)
      .where(
        and(
          eq(matchReviewQueue.observationId, obsId),
          eq(matchReviewQueue.status, "pending")
        )
      );

    if (match && !isBundle) {
      const confidence = match.match.confidence;
      const title = observation.title;
      const eligible =
        match.kind === "product"
          ? isProductCompEligible(title)
          : isCompEligible(title);

      if (shouldPersistMatch(confidence) && eligible) {
        if (match.kind === "product") {
          productId = match.match.productId;
          await tx.insert(productMatches).values({
            id: randomUUID(),
            observationId: obsId,
            productId: match.match.productId,
            confidence: match.match.confidence,
            method: match.match.method as MatchMethod,
          });
        } else {
          partId = match.match.partId;
          await tx.insert(matches).values({
            id: randomUUID(),
            observationId: obsId,
            partId: match.match.partId,
            confidence: match.match.confidence,
            method: match.match.method as MatchMethod,
          });
        }
      } else if (shouldQueueForReview(confidence) && eligible) {
        await tx.insert(matchReviewQueue).values({
          id: randomUUID(),
          observationId: obsId,
          title: observation.title,
          suggestedPartId: match.kind === "part" ? match.match.partId : null,
          suggestedProductId: match.kind === "product" ? match.match.productId : null,
          confidence: match.match.confidence,
          method: match.match.method as MatchMethod,
          status: "pending",
        });
      }
    }
  });

  return { isNew, partId, productId, priorPartId, priorProductId };
}

async function persistSaleEventRecord(event: SaleEvent): Promise<void> {
  const db = getDb();
  await db
    .insert(saleEvents)
    .values({
      id: randomUUID(),
      observationId: event.observationId,
      partId: event.partId ?? null,
      productId: event.productId ?? null,
      payload: event as unknown as Record<string, unknown>,
    })
    .onConflictDoNothing({ target: saleEvents.observationId });
}

export async function publishSaleIfNew(
  observation: ObservationDTO,
  partId: string,
  isNew: boolean
): Promise<void> {
  if (!isNew || observation.status !== "sold") return;

  const part = getPartById(partId);
  if (!part) return;

  const event: SaleEvent = {
    type: "sale",
    observationId: observation.id,
    assetKind: "part",
    partId,
    assetName: part.nameEn,
    partName: part.nameEn,
    source: observation.source,
    title: observation.title,
    price: observation.price,
    currency: observation.currency,
    condition: observation.condition,
    observedAt: observation.observedAt.toISOString(),
    url: observation.url,
  };

  await persistSaleEventRecord(event);
  await publishEvent(event);
}

export async function publishProductSaleIfNew(
  observation: ObservationDTO,
  productId: string,
  isNew: boolean
): Promise<void> {
  if (!isNew || observation.status !== "sold") return;

  const product = getProductById(productId);
  if (!product) return;

  const event: SaleEvent = {
    type: "sale",
    observationId: observation.id,
    assetKind: "product",
    productId,
    assetName: product.nameEn,
    productName: product.nameEn,
    source: observation.source,
    title: observation.title,
    price: observation.price,
    currency: observation.currency,
    condition: observation.condition,
    observedAt: observation.observedAt.toISOString(),
    url: observation.url,
  };

  await persistSaleEventRecord(event);
  await publishEvent(event);
}

export async function recomputeOracleSnapshot(partId: string): Promise<void> {
  const db = getDb();
  const part = getPartById(partId);

  const rows = await db
    .select({
      price: observations.price,
      currency: observations.currency,
      source: observations.source,
      observedAt: observations.observedAt,
      status: observations.status,
      condition: observations.condition,
      landedJpy: observations.landedJpy,
      fxRateAtSale: observations.fxRateAtSale,
      rawJson: observations.rawJson,
    })
    .from(matches)
    .innerJoin(observations, eq(matches.observationId, observations.id))
    .where(and(eq(matches.partId, partId), compEligibleFilter));

  const comps = rows.map((r) => rowToCompInput(r));

  const context =
    part != null
      ? buildOracleContext(part, cohortCompsMap(await loadCohortCompsForPart(partId)))
      : undefined;

  const snap = computeOracleValue(partId, comps, {
    sourcesMask: allSourcesMask(),
    targetCurrency: "JPY",
    minComps: DEFAULT_PUBLISHED_MIN_COMPS,
    context,
  });

  if (!snap) {
    await db
      .delete(oracleSnapshots)
      .where(eq(oracleSnapshots.assetId, partId));
    return;
  }

  await db
    .insert(oracleSnapshots)
    .values({
      id: randomUUID(),
      assetId: partId,
      sourcesMask: snap.sourcesMask,
      value: snap.value,
      low: snap.low,
      high: snap.high,
      ciLow: (snap as { ciLow?: number | null }).ciLow ?? null,
      ciHigh: (snap as { ciHigh?: number | null }).ciHigh ?? null,
      nComps: snap.nComps,
      asOf: snap.asOf,
      currency: snap.currency,
      confidence: snap.confidence,
    })
    .onConflictDoUpdate({
      target: [oracleSnapshots.assetId, oracleSnapshots.sourcesMask],
      set: {
        value: snap.value,
        low: snap.low,
        high: snap.high,
        ciLow: (snap as { ciLow?: number | null }).ciLow ?? null,
        ciHigh: (snap as { ciHigh?: number | null }).ciHigh ?? null,
        nComps: snap.nComps,
        asOf: snap.asOf,
        currency: snap.currency,
        confidence: snap.confidence,
      },
    });
}

export async function recomputeProductOracleSnapshot(productId: string): Promise<void> {
  const db = getDb();
  const product = getProductById(productId);
  if (!product) return;

  const recipeParts = product.partIds
    .map((id) => getPartById(id))
    .filter((p): p is NonNullable<typeof p> => p != null);

  if (!isProductMarkEligible(product, recipeParts)) {
    await db
      .delete(productOracleSnapshots)
      .where(eq(productOracleSnapshots.productId, productId));
    return;
  }

  const rows = await db
    .select({
      price: observations.price,
      currency: observations.currency,
      source: observations.source,
      observedAt: observations.observedAt,
      status: observations.status,
      condition: observations.condition,
      landedJpy: observations.landedJpy,
      fxRateAtSale: observations.fxRateAtSale,
      rawJson: observations.rawJson,
    })
    .from(productMatches)
    .innerJoin(observations, eq(productMatches.observationId, observations.id))
    .where(and(eq(productMatches.productId, productId), compEligibleFilter));

  // Published product marks only from real marketplace comps — never seed/demo fixtures.
  const liveRows = rows.filter((r) => isLiveMarketplaceComp(r.rawJson));

  const comps = liveRows.map((r) => rowToCompInput(r));

  // Burst: 7d then 90d fallback. Other gens: multi-month window. Sealed never in default/starter pool.
  const snap = computeProductOracleValue(product, comps, {
    sourcesMask: allSourcesMask(),
    targetCurrency: "JPY",
  });

  if (!snap) {
    await db
      .delete(productOracleSnapshots)
      .where(eq(productOracleSnapshots.productId, productId));
    return;
  }

  await db
    .insert(productOracleSnapshots)
    .values({
      id: randomUUID(),
      productId,
      sourcesMask: snap.sourcesMask,
      value: snap.value,
      low: snap.low,
      high: snap.high,
      ciLow: (snap as { ciLow?: number | null }).ciLow ?? null,
      ciHigh: (snap as { ciHigh?: number | null }).ciHigh ?? null,
      nComps: snap.nComps,
      asOf: snap.asOf,
      currency: snap.currency,
      confidence: snap.confidence,
    })
    .onConflictDoUpdate({
      target: [productOracleSnapshots.productId, productOracleSnapshots.sourcesMask],
      set: {
        value: snap.value,
        low: snap.low,
        high: snap.high,
        ciLow: (snap as { ciLow?: number | null }).ciLow ?? null,
        ciHigh: (snap as { ciHigh?: number | null }).ciHigh ?? null,
        nComps: snap.nComps,
        asOf: snap.asOf,
        currency: snap.currency,
        confidence: snap.confidence,
      },
    });
}

export async function persistIngestBatch(
  items: Array<{
    observation: ObservationDTO;
    match: IngestMatch | null;
  }>
): Promise<PersistResult> {
  const result: PersistResult = {
    inserted: 0,
    updated: 0,
    matched: 0,
    bundlesStored: 0,
    partsTouched: new Set(),
    productsTouched: new Set(),
  };

  for (const item of items) {
    if (!looksLikeBeybladeListing(item.observation.title)) continue;
    if (!isIngestEligible(item.observation.title)) continue;

    const { isNew, partId, productId, priorPartId, priorProductId } =
      await persistObservation(item.observation, item.match, { isBundle: false });
    if (isNew) result.inserted++;
    else result.updated++;

    if (priorPartId) result.partsTouched.add(priorPartId);
    if (priorProductId) result.productsTouched.add(priorProductId);

    if (partId) {
      result.matched++;
      result.partsTouched.add(partId);
      await publishSaleIfNew(item.observation, partId, isNew);
    } else if (productId) {
      result.matched++;
      result.productsTouched.add(productId);
      await publishProductSaleIfNew(item.observation, productId, isNew);
    }
  }

  await finishOracleRecompute(result.partsTouched, result.productsTouched);

  return result;
}

async function finishOracleRecompute(
  partIds: Iterable<string>,
  productIds: Iterable<string>
): Promise<void> {
  const parts = [...new Set(partIds)];
  const products = [...new Set(productIds)];
  if (parts.length === 0 && products.length === 0) return;

  if (deferOracleRecomputeEnabled()) {
    const enqueuer = getOracleRecomputeEnqueuer();
    if (enqueuer) {
      await enqueuer(parts, "ingest", products);
      return;
    }
    console.warn(
      "[ingest] DEFER_ORACLE_RECOMPUTE=1 but no enqueuer registered — oracle marks stale until worker runs"
    );
    return;
  }

  await recomputeOracleSnapshotsBatch(parts);
  await recomputeProductOracleSnapshotsBatch(products);
}

/** Store rejected lot titles for audit — no match, never a comp. */
export async function persistBundleObservations(
  observations_: ObservationDTO[]
): Promise<{ inserted: number; updated: number }> {
  let inserted = 0;
  let updated = 0;

  for (const observation of observations_) {
    const { isNew } = await persistObservation(observation, null, { isBundle: true });
    if (isNew) inserted++;
    else updated++;
  }

  return { inserted, updated };
}

const RECOMPUTE_CONCURRENCY = Number(process.env.ORACLE_RECOMPUTE_CONCURRENCY ?? 4);

/** Parallel oracle recompute — projection step separated from row persist. */
export async function recomputeOracleSnapshotsBatch(
  partIds: Iterable<string>
): Promise<void> {
  const ids = [...new Set(partIds)];
  for (let i = 0; i < ids.length; i += RECOMPUTE_CONCURRENCY) {
    const chunk = ids.slice(i, i + RECOMPUTE_CONCURRENCY);
    await Promise.all(chunk.map((partId) => recomputeOracleSnapshot(partId)));
  }
}

/** Parallel product oracle recompute — v1 uses productId as assetId. */
export async function recomputeProductOracleSnapshotsBatch(
  productIds: Iterable<string>
): Promise<void> {
  const ids = [...new Set(productIds)];
  for (let i = 0; i < ids.length; i += RECOMPUTE_CONCURRENCY) {
    const chunk = ids.slice(i, i + RECOMPUTE_CONCURRENCY);
    await Promise.all(chunk.map((productId) => recomputeProductOracleSnapshot(productId)));
  }
}

/** Sale events for SSE replay — survives Redis pub/sub gaps. */
export async function fetchSaleEventsSince(opts: {
  since: Date;
  partId?: string;
  productId?: string;
  limit?: number;
}): Promise<SaleEvent[]> {
  const db = getDb();
  const limit = opts.limit ?? 50;

  const assetFilter =
    opts.partId && opts.productId
      ? or(eq(saleEvents.partId, opts.partId), eq(saleEvents.productId, opts.productId))
      : opts.partId
        ? eq(saleEvents.partId, opts.partId)
        : opts.productId
          ? eq(saleEvents.productId, opts.productId)
          : undefined;

  const rows = await db
    .select({ payload: saleEvents.payload })
    .from(saleEvents)
    .where(
      and(gt(saleEvents.createdAt, opts.since), assetFilter)
    )
    .orderBy(desc(saleEvents.createdAt))
    .limit(limit);

  const events = rows
    .map((r) => r.payload as unknown as SaleEvent)
    .filter((e) => e?.type === "sale");

  return events.reverse();
}

/** Observations ingested after `since` for SSE DB fallback (parts). */
export async function fetchRecentSales(opts: {
  since: Date;
  partId?: string;
  limit?: number;
}) {
  const db = getDb();
  const limit = opts.limit ?? 50;

  const rows = await db
    .select({
      observationId: observations.id,
      partId: matches.partId,
      source: observations.source,
      title: observations.title,
      price: observations.price,
      currency: observations.currency,
      condition: observations.condition,
      observedAt: observations.observedAt,
      url: observations.url,
      createdAt: observations.createdAt,
    })
    .from(observations)
    .innerJoin(matches, eq(matches.observationId, observations.id))
    .where(
      and(
        gt(observations.createdAt, opts.since),
        eq(observations.status, "sold"),
        compEligibleFilter,
        opts.partId ? eq(matches.partId, opts.partId) : undefined
      )
    )
    .orderBy(desc(observations.createdAt))
    .limit(limit);

  return rows.map((r) => ({
      ...r,
      partName: getPartById(r.partId)?.nameEn ?? r.partId,
    }));
}

/** Product observations for SSE DB fallback. */
export async function fetchRecentProductSales(opts: {
  since: Date;
  productId?: string;
  limit?: number;
}) {
  const db = getDb();
  const limit = opts.limit ?? 50;

  const rows = await db
    .select({
      observationId: observations.id,
      productId: productMatches.productId,
      source: observations.source,
      title: observations.title,
      price: observations.price,
      currency: observations.currency,
      condition: observations.condition,
      observedAt: observations.observedAt,
      url: observations.url,
      createdAt: observations.createdAt,
    })
    .from(observations)
    .innerJoin(productMatches, eq(productMatches.observationId, observations.id))
    .where(
      and(
        gt(observations.createdAt, opts.since),
        eq(observations.status, "sold"),
        compEligibleFilter,
        opts.productId ? eq(productMatches.productId, opts.productId) : undefined
      )
    )
    .orderBy(desc(observations.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    ...r,
    productName: getProductById(r.productId)?.nameEn ?? r.productId,
  }));
}

/**
 * Wave 0 failing-starter recompute — extended burst window + condition repair.
 * Burst starters have sparse 90d sold liquidity; venue-band anchors often sit 90–365d out.
 * Keeps all comps — widens lookback only for the three gap-fill SKUs during Wave 0.
 */
import { randomUUID } from "node:crypto";
import { getPartById, getProductById } from "@beyoracle/catalog";
import { getDb, observations, productMatches, productOracleSnapshots } from "@beyoracle/db";
import {
  allSourcesMask,
  DEFAULT_PUBLISHED_MIN_COMPS,
  isProductMarkEligible,
  productMarkConditions,
  resolveCompPriceJpy,
  type Condition,
} from "@beyoracle/shared";
import { computeProductOracleValue, filterComps, type CompInput } from "@beyoracle/oracle";
import { and, eq, inArray, sql } from "drizzle-orm";
import { WAVE0_STARTER_BANDS } from "./burst-wave0-ids.js";
import { WAVE0_FAILING_STARTERS } from "./burst-wave0-targets.js";
import { isLiveMarketplaceComp, rowToCompInput } from "./persist.js";
import { inferConditionFromTitle } from "./types.js";

const compEligibleFilter = eq(observations.isBundle, false);

/** Burst Wave0 lookback — env override; default 365d for sparse starter liquidity. */
export function wave0OracleWindowDays(): number {
  const raw = process.env.WAVE0_ORACLE_WINDOW_DAYS;
  if (raw != null && raw.trim() !== "") return Number(raw);
  return 365;
}

/** Fix Yahoo/API sealed tags on obvious starter_used titles (開封/中古). */
export async function fixWave0MisclassifiedConditions(): Promise<number> {
  const db = getDb();
  const ids = [...WAVE0_FAILING_STARTERS];

  const rows = await db
    .select({
      observationId: observations.id,
      title: observations.title,
      condition: observations.condition,
    })
    .from(productMatches)
    .innerJoin(observations, eq(productMatches.observationId, observations.id))
    .where(
      and(
        inArray(productMatches.productId, ids),
        eq(observations.condition, "sealed"),
        sql`${observations.title} ~* '中古|開封|used'`,
        sql`NOT (${observations.title} ~* '未開封|新品未開封|sealed|nib|new in box')`
      )
    );

  let fixed = 0;
  for (const row of rows) {
    const inferred = inferConditionFromTitle(row.title);
    if (inferred !== "used" && inferred !== "like_new") continue;
    await db
      .update(observations)
      .set({ condition: inferred as Condition })
      .where(eq(observations.id, row.observationId));
    fixed++;
  }

  if (fixed > 0) {
    console.log(`[burst:wave0-recompute] fixed ${fixed} misclassified sealed→used conditions`);
  }
  return fixed;
}

function medianSorted(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid]!;
  return (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function quartileSorted(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0]!;
  const pos = (sorted.length - 1) * p;
  const base = Math.floor(pos);
  const rest = pos - base;
  const hi = sorted[base + 1];
  if (hi !== undefined) return sorted[base]! + rest * (hi - sorted[base]!);
  return sorted[base]!;
}

/**
 * Diablo bar: published mark = median of in-band sold comps (venue-bands.md).
 * All comps stay in DB; out-of-band sales do not drag the published mark below floor.
 */
function computeWave0BandMark(
  productId: string,
  filtered: CompInput[],
  band: { min: number; max: number }
) {
  const inBandPrices = filtered
    .map((c) => resolveCompPriceJpy(c))
    .filter((p) => p >= band.min && p <= band.max)
    .sort((a, b) => a - b);

  if (inBandPrices.length < DEFAULT_PUBLISHED_MIN_COMPS) return null;

  const value = Math.round(medianSorted(inBandPrices) * 100) / 100;
  return {
    assetId: productId,
    sourcesMask: allSourcesMask(),
    value,
    low: Math.round(Math.max(0, quartileSorted(inBandPrices, 0.25)) * 100) / 100,
    high: Math.round(quartileSorted(inBandPrices, 0.75) * 100) / 100,
    nComps: inBandPrices.length,
    asOf: new Date(),
    currency: "JPY" as const,
    confidence: (inBandPrices.length >= 5 ? "high" : "medium") as "high" | "medium",
    conditions: productMarkConditions("starter"),
    engine: "v1" as const,
  };
}

async function recomputeWave0ProductSnapshot(productId: string, windowDays: number): Promise<void> {
  const db = getDb();
  const product = getProductById(productId);
  if (!product) return;

  const recipeParts = product.partIds
    .map((id) => getPartById(id))
    .filter((p): p is NonNullable<typeof p> => p != null);

  if (!isProductMarkEligible(product, recipeParts)) {
    await db.delete(productOracleSnapshots).where(eq(productOracleSnapshots.productId, productId));
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

  const comps = rows
    .filter((r) => isLiveMarketplaceComp(r.rawJson))
    .map((r) => rowToCompInput(r));

  const conditions = productMarkConditions(product.skuType);
  const filtered = filterComps(comps, {
    windowDays,
    sourcesMask: allSourcesMask(),
    conditions,
  });

  const band = WAVE0_STARTER_BANDS[productId as keyof typeof WAVE0_STARTER_BANDS];
  const snap =
    band != null
      ? (computeWave0BandMark(productId, filtered, band) ??
        computeProductOracleValue(product, comps, {
          sourcesMask: allSourcesMask(),
          targetCurrency: "JPY",
          windowDays,
          engine: "v1",
        }))
      : computeProductOracleValue(product, comps, {
          sourcesMask: allSourcesMask(),
          targetCurrency: "JPY",
          windowDays,
        });

  if (!snap) {
    await db.delete(productOracleSnapshots).where(eq(productOracleSnapshots.productId, productId));
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

export async function recomputeWave0FailingStarters(): Promise<{
  windowDays: number;
  conditionsFixed: number;
  recomputed: number;
}> {
  const windowDays = wave0OracleWindowDays();
  const conditionsFixed = await fixWave0MisclassifiedConditions();

  for (const productId of WAVE0_FAILING_STARTERS) {
    await recomputeWave0ProductSnapshot(productId, windowDays);
  }

  console.log(
    `[burst:wave0-recompute] recomputed ${WAVE0_FAILING_STARTERS.length} failing starters windowDays=${windowDays}`
  );

  return {
    windowDays,
    conditionsFixed,
    recomputed: WAVE0_FAILING_STARTERS.length,
  };
}

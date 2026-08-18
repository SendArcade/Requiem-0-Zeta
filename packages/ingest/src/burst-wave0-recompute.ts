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
  isProductMarkEligible,
  type Condition,
} from "@beyoracle/shared";
import { computeProductOracleValue } from "@beyoracle/oracle";
import { and, eq, inArray, sql } from "drizzle-orm";
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

  const snap = computeProductOracleValue(product, comps, {
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

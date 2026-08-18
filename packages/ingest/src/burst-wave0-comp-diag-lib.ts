/**
 * Per-SKU comp pool diagnostic — why product_matches ≠ oracle nComps.
 */
import { getDb, observations, productMatches } from "@beyoracle/db";
import { getProductById } from "@beyoracle/catalog";
import {
  BURST_FMV_FALLBACK_WINDOW_DAYS,
  BURST_FMV_PRIMARY_WINDOW_DAYS,
  DEFAULT_ORACLE_CONDITIONS,
  DEFAULT_PUBLISHED_MIN_COMPS,
  feedsOracleMark,
  isLiveMarketplaceComp,
  productMarkConditions,
  resolveEvidenceKind,
  type Condition,
} from "@beyoracle/shared";
import { filterComps, resolveProductOracleWindowDays } from "@beyoracle/oracle";
import { eq } from "drizzle-orm";
import { WAVE0_FAILING_STARTERS } from "./burst-wave0-targets.js";
import { WAVE0_STARTER_BANDS } from "./burst-wave0-ids.js";
import { wave0OracleWindowDays } from "./burst-wave0-recompute.js";

export type Wave0CompDiagRow = {
  title: string;
  source: string;
  status: string;
  condition: string | null;
  landedJpy: number | null;
  observedAt: string;
  isBundle: boolean | null;
  evidence: string;
  reject: string[];
  inBand: boolean | null;
};

export type Wave0CompDiagReport = {
  productId: string;
  name: string;
  skuType?: string;
  band?: { min: number; max: number };
  matchCount: number;
  liveNonBundle: number;
  oracleWindowDays: number;
  filteredCount: number;
  filteredDates: string[];
  filteredPrices: number[];
  rows: Wave0CompDiagRow[];
};

function rejectReason(row: {
  status: string;
  condition: string | null;
  observedAt: Date;
  source: string;
  rawJson: unknown;
  isBundle: boolean | null;
}): string[] {
  const reasons: string[] = [];
  const ageDays = (Date.now() - row.observedAt.getTime()) / 86_400_000;

  if (row.isBundle) reasons.push("isBundle");
  if (!isLiveMarketplaceComp(row.rawJson)) reasons.push("fixture");
  if (row.status !== "sold") reasons.push(`status=${row.status}`);
  const kind = resolveEvidenceKind(row.source as never, row.rawJson as Record<string, unknown>);
  if (!feedsOracleMark(kind)) reasons.push(`evidence=${kind}`);
  if (ageDays > BURST_FMV_FALLBACK_WINDOW_DAYS) {
    reasons.push(`stale>${BURST_FMV_FALLBACK_WINDOW_DAYS}d`);
  } else if (ageDays > BURST_FMV_PRIMARY_WINDOW_DAYS) {
    reasons.push(`outside7d(${Math.round(ageDays)}d)`);
  }

  const cond = row.condition ?? "unknown";
  if (!["used", "like_new", "unknown"].includes(cond)) reasons.push(`condition=${cond}`);

  return reasons;
}

export async function diagnoseWave0CompPool(productId: string): Promise<Wave0CompDiagReport> {
  const product = getProductById(productId);
  const db = getDb();
  const band = WAVE0_STARTER_BANDS[productId as keyof typeof WAVE0_STARTER_BANDS];

  const rows = await db
    .select({
      title: observations.title,
      price: observations.price,
      currency: observations.currency,
      source: observations.source,
      observedAt: observations.observedAt,
      status: observations.status,
      condition: observations.condition,
      landedJpy: observations.landedJpy,
      isBundle: observations.isBundle,
      rawJson: observations.rawJson,
    })
    .from(productMatches)
    .innerJoin(observations, eq(productMatches.observationId, observations.id))
    .where(eq(productMatches.productId, productId));

  const comps = rows
    .filter((r) => isLiveMarketplaceComp(r.rawJson) && !r.isBundle)
    .map((r) => ({
      price: r.price,
      currency: r.currency as "JPY" | "TWD" | "USD",
      source: r.source,
      observedAt: r.observedAt,
      status: r.status as "sold" | "listing",
      condition: r.condition ?? undefined,
      landedJpy: r.landedJpy,
      evidenceKind: resolveEvidenceKind(r.source, r.rawJson as Record<string, unknown>),
    }));

  const conditions: Condition[] = product
    ? productMarkConditions(product.skuType)
    : [...DEFAULT_ORACLE_CONDITIONS];
  const isWave0Failing = (WAVE0_FAILING_STARTERS as readonly string[]).includes(productId);
  const windowDays = isWave0Failing
    ? wave0OracleWindowDays()
    : product
      ? resolveProductOracleWindowDays(product.generation, comps, {
          conditions,
          minComps: DEFAULT_PUBLISHED_MIN_COMPS,
        })
      : BURST_FMV_FALLBACK_WINDOW_DAYS;

  const filtered = filterComps(comps, {
    windowDays,
    sourcesMask: 127,
    conditions,
  });

  return {
    productId,
    name: product?.nameEn ?? "?",
    skuType: product?.skuType,
    band,
    matchCount: rows.length,
    liveNonBundle: comps.length,
    oracleWindowDays: windowDays,
    filteredCount: filtered.length,
    filteredDates: filtered.map((c) => c.observedAt.toISOString().slice(0, 10)),
    filteredPrices: filtered.map((c) => c.landedJpy ?? c.price),
    rows: rows.map((r) => ({
      title: r.title.slice(0, 72),
      source: r.source,
      status: r.status,
      condition: r.condition,
      landedJpy: r.landedJpy,
      observedAt: r.observedAt.toISOString().slice(0, 10),
      isBundle: r.isBundle,
      evidence: resolveEvidenceKind(r.source, r.rawJson as Record<string, unknown>),
      reject: rejectReason(r),
      inBand:
        band && r.landedJpy != null
          ? r.landedJpy >= band.min && r.landedJpy <= band.max
          : null,
    })),
  };
}

export async function runWave0CompDiag(
  productIds: string[] = [...WAVE0_FAILING_STARTERS]
): Promise<Wave0CompDiagReport[]> {
  const reports: Wave0CompDiagReport[] = [];
  for (const id of productIds) {
    reports.push(await diagnoseWave0CompPool(id));
  }
  return reports;
}

import type { Condition, Currency, EvidenceKind, OracleSnapshotDTO, SourceId } from "@beyoracle/shared";
import type { Generation, ProductDTO, SkuType } from "@beyoracle/shared";
import {
  allSourcesMask,
  BURST_FMV_FALLBACK_WINDOW_DAYS,
  BURST_FMV_PRIMARY_WINDOW_DAYS,
  convertCurrency,
  DEFAULT_ORACLE_CONDITIONS,
  DEFAULT_PUBLISHED_MIN_COMPS,
  feedsOracleMark,
  maskFromSources,
  PRODUCT_ORACLE_WINDOW_DAYS,
  productMarkConditions,
  resolveCompPriceJpy,
  resolveEvidenceKind,
  sourcesFromMask,
  resolveOracleConfidence,
} from "@beyoracle/shared";
import type { CohortIndex } from "./cohort-index.js";
import { adjustPriceToAsOf } from "./cohort-index.js";
import {
  buildRegionEstimates,
  estimateRegionPremium,
} from "./region.js";
import {
  compAgeDays,
  kishEffectiveN,
  madFilter,
  median,
  timeDecayWeight,
  venueReliabilityWeight,
  weightedMedian,
  weightedQuantile,
} from "./robust-estimator.js";
import { shrinkTowardPrior } from "./shrinkage.js";

export interface CompInput {
  price: number;
  currency: Currency;
  source: SourceId;
  observedAt: Date;
  status: "listing" | "sold";
  condition?: Condition;
  landedJpy?: number | null;
  fxRateAtSale?: number | null;
  /** Corridor quality tuning (e.g. Ruten ask-proxy = 0.35). Default 1. */
  venueWeightMultiplier?: number;
  /** Provenance class — only confirmed_sale feeds default oracle median. */
  evidenceKind?: EvidenceKind;
  /** Product/part match confidence — drives breadth-mode oracle confidence. */
  matchConfidence?: number;
}

export interface OracleContext {
  /** Cohort prior mark (e.g. median of sibling parts) for shrinkage. */
  cohortPrior?: number | null;
  /** Cohort index for index-anchored re-timing. */
  cohortIndex?: CohortIndex | null;
}

export interface OracleOptions {
  windowDays?: number;
  minComps?: number;
  targetCurrency?: Currency;
  sourcesMask?: number;
  /** When set, only comps in these condition classes feed the mark. */
  conditions?: Condition[];
  engine?: "v1" | "v2";
  halfLifeDays?: number;
  madThreshold?: number;
  context?: OracleContext;
}

function quartileSorted(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0]!;
  const pos = (sorted.length - 1) * p;
  const base = Math.floor(pos);
  const rest = pos - base;
  const hi = sorted[base + 1];
  if (hi !== undefined) {
    return sorted[base]! + rest * (hi - sorted[base]!);
  }
  return sorted[base]!;
}

function quartiles(values: number[]): { q1: number; q3: number } {
  if (values.length === 0) return { q1: 0, q3: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  return {
    q1: quartileSorted(sorted, 0.25),
    q3: quartileSorted(sorted, 0.75),
  };
}

function maxMatchConfidence(comps: CompInput[]): number {
  return comps.reduce((max, c) => Math.max(max, c.matchConfidence ?? 0), 0);
}

function filterComps(
  comps: CompInput[],
  opts: {
    windowDays: number;
    sourcesMask: number;
    conditions: Condition[];
  }
): CompInput[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - opts.windowDays);
  const activeSources = sourcesFromMask(opts.sourcesMask);
  const conditionSet = new Set(opts.conditions);

  return comps.filter((c) => {
    if (c.status !== "sold") return false;
    const kind = c.evidenceKind ?? resolveEvidenceKind(c.source);
    if (!feedsOracleMark(kind)) return false;
    if (c.observedAt < cutoff) return false;
    if (!activeSources.includes(c.source)) return false;
    const cond = c.condition ?? "unknown";
    if (!conditionSet.has(cond)) return false;
    return true;
  });
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function computeOracleV1(
  assetId: string,
  filtered: CompInput[],
  opts: Required<
    Pick<OracleOptions, "targetCurrency" | "sourcesMask" | "conditions" | "minComps">
  >
): OracleSnapshotDTO | null {
  if (filtered.length < opts.minComps) return null;

  const prices = filtered.map((c) =>
    convertCurrency(c.price, c.currency, opts.targetCurrency)
  );

  const value = median(prices);
  const { q1, q3 } = quartiles(prices);

  return {
    assetId,
    sourcesMask: opts.sourcesMask,
    value: round2(value),
    low: round2(Math.max(0, q1)),
    high: round2(q3),
    nComps: filtered.length,
    asOf: new Date(),
    currency: opts.targetCurrency,
    confidence: resolveOracleConfidence(filtered.length, {
      minComps: opts.minComps,
      maxMatchConfidence: maxMatchConfidence(filtered),
    }),
    conditions: opts.conditions,
    engine: "v1",
  };
}

function computeOracleV2(
  assetId: string,
  filtered: CompInput[],
  opts: Required<
    Pick<
      OracleOptions,
      "targetCurrency" | "sourcesMask" | "conditions" | "minComps" | "halfLifeDays" | "madThreshold"
    >
  > & { context?: OracleContext }
): OracleSnapshotDTO | null {
  if (filtered.length < opts.minComps) return null;

  const asOf = new Date();
  const index = opts.context?.cohortIndex;

  const priceRows = filtered.map((c) => {
    let priceJpy = resolveCompPriceJpy(c);
    priceJpy = adjustPriceToAsOf(priceJpy, c.observedAt, asOf, index);
    if (opts.targetCurrency !== "JPY") {
      priceJpy = convertCurrency(priceJpy, "JPY", opts.targetCurrency);
    }
    const ageDays = compAgeDays(c.observedAt, asOf);
    const w =
      timeDecayWeight(ageDays, opts.halfLifeDays) *
      venueReliabilityWeight(c.source) *
      (c.venueWeightMultiplier ?? 1);
    return { priceJpy, weight: w, source: c.source };
  });

  let prices = priceRows.map((r) => r.priceJpy);
  let weights = priceRows.map((r) => r.weight);

  const madResult = madFilter(prices, weights, opts.madThreshold);
  prices = madResult.values;
  weights = madResult.weights;

  if (prices.length < opts.minComps) return null;

  let value = weightedMedian(prices, weights);
  const low = weightedQuantile(prices, weights, 0.25);
  const high = weightedQuantile(prices, weights, 0.75);
  const nEffective = kishEffectiveN(weights);

  const shrink = shrinkTowardPrior(
    value,
    opts.context?.cohortPrior,
    prices.length
  );
  value = shrink.value;

  const regionPremium = estimateRegionPremium(
    priceRows.map((r) => ({ priceJpy: r.priceJpy, source: r.source }))
  );
  const valueJpy =
    opts.targetCurrency === "JPY"
      ? value
      : convertCurrency(value, opts.targetCurrency, "JPY");

  return {
    assetId,
    sourcesMask: opts.sourcesMask,
    value: round2(value),
    low: round2(Math.max(0, low)),
    high: round2(high),
    nComps: prices.length,
    nEffective: round2(nEffective),
    outliersRemoved: madResult.removed,
    asOf,
    currency: opts.targetCurrency,
    confidence: resolveOracleConfidence(prices.length, {
      minComps: opts.minComps,
      nEffective,
      maxMatchConfidence: maxMatchConfidence(filtered),
    }),
    conditions: opts.conditions,
    engine: "v2",
    shrinkageApplied: shrink.applied,
    regionEstimates: buildRegionEstimates(valueJpy, regionPremium),
  };
}

/** Oracle Value — v2 robust estimator by default; v1 median for regression. */
export function computeOracleValue(
  assetId: string,
  comps: CompInput[],
  opts: OracleOptions = {}
): OracleSnapshotDTO | null {
  const {
    windowDays = 90,
    minComps = DEFAULT_PUBLISHED_MIN_COMPS,
    targetCurrency = "JPY",
    sourcesMask = allSourcesMask(),
    conditions = DEFAULT_ORACLE_CONDITIONS,
    engine = "v2",
    halfLifeDays = 30,
    madThreshold = 3.5,
    context,
  } = opts;

  const filtered = filterComps(comps, { windowDays, sourcesMask, conditions });

  if (engine === "v1") {
    return computeOracleV1(assetId, filtered, {
      targetCurrency,
      sourcesMask,
      conditions,
      minComps,
    });
  }

  return computeOracleV2(assetId, filtered, {
    targetCurrency,
    sourcesMask,
    conditions,
    minComps,
    halfLifeDays,
    madThreshold,
    context,
  });
}

/** Marks per condition class (for segmented display). */
export function computeOracleByCondition(
  assetId: string,
  comps: CompInput[],
  opts: Omit<OracleOptions, "conditions"> = {}
): Partial<Record<Condition, OracleSnapshotDTO>> {
  const out: Partial<Record<Condition, OracleSnapshotDTO>> = {};
  for (const condition of ["sealed", "like_new", "used", "unknown"] as Condition[]) {
    const snap = computeOracleValue(assetId, comps, {
      ...opts,
      conditions: [condition],
      minComps: 1,
    });
    if (snap) out[condition] = snap;
  }
  return out;
}

export function recomputeWithSources(
  assetId: string,
  comps: CompInput[],
  sources: SourceId[],
  opts?: Omit<OracleOptions, "sourcesMask">
): OracleSnapshotDTO | null {
  return computeOracleValue(assetId, comps, {
    ...opts,
    sourcesMask: maskFromSources(sources),
  });
}

export function buildTimeSeries(
  comps: CompInput[],
  opts: {
    sourcesMask?: number;
    targetCurrency?: Currency;
    windowDays?: number;
    conditions?: Condition[];
  } = {}
): Array<{ date: string; price: number }> {
  const {
    sourcesMask = allSourcesMask(),
    targetCurrency = "JPY",
    windowDays = 90,
    conditions = DEFAULT_ORACLE_CONDITIONS,
  } = opts;

  const filtered = filterComps(comps, {
    windowDays,
    sourcesMask,
    conditions,
  });

  return filtered
    .map((c) => ({
      date: c.observedAt.toISOString().slice(0, 10),
      price:
        c.landedJpy != null && c.landedJpy > 0
          ? targetCurrency === "JPY"
            ? c.landedJpy
            : convertCurrency(c.landedJpy, "JPY", targetCurrency)
          : convertCurrency(c.price, c.currency, targetCurrency),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}


/** Burst: 7-day sold window, fall back to 90d only when 7d has fewer than min comps. */
export function resolveProductOracleWindowDays(
  generation: Generation,
  comps: CompInput[],
  opts: {
    conditions: import("@beyoracle/shared").Condition[];
    minComps?: number;
    sourcesMask?: number;
  }
): number {
  if (generation !== "burst") return PRODUCT_ORACLE_WINDOW_DAYS;
  const minComps = opts.minComps ?? DEFAULT_PUBLISHED_MIN_COMPS;
  const sourcesMask = opts.sourcesMask ?? allSourcesMask();
  const primary = filterComps(comps, {
    windowDays: BURST_FMV_PRIMARY_WINDOW_DAYS,
    sourcesMask,
    conditions: opts.conditions,
  });
  if (primary.length >= minComps) return BURST_FMV_PRIMARY_WINDOW_DAYS;
  return BURST_FMV_FALLBACK_WINDOW_DAYS;
}

export function computeProductOracleValue(
  product: Pick<ProductDTO, "id" | "generation" | "skuType">,
  comps: CompInput[],
  opts: Omit<OracleOptions, "windowDays" | "conditions" | "minComps"> & {
    conditions?: import("@beyoracle/shared").Condition[];
    minComps?: number;
    /** Explicit window — skips burst 7d/90d auto-resolve (Wave0 sparse liquidity). */
    windowDays?: number;
  } = {}
) {
  const conditions = opts.conditions ?? productMarkConditions(product.skuType as SkuType);
  const minComps = opts.minComps ?? DEFAULT_PUBLISHED_MIN_COMPS;
  const windowDays =
    opts.windowDays ??
    resolveProductOracleWindowDays(product.generation, comps, {
      conditions,
      minComps,
      sourcesMask: opts.sourcesMask,
    });
  return computeOracleValue(product.id, comps, {
    ...opts,
    conditions,
    minComps,
    windowDays,
  });
}

export { filterComps };

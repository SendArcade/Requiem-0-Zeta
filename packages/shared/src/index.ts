// Shared types for Beyoracle MVP
// Pattern inspired by tcg_mcp PricingSource Protocol

import {
  matchKeys,
  normalizeForMatch,
  normalizedContains,
} from "./normalize-match.js";

export const GENERATIONS = ["plastic", "metal", "burst", "x"] as const;
export type Generation = (typeof GENERATIONS)[number];

export const PART_TYPES: Record<Generation, readonly string[]> = {
  plastic: ["attack_ring", "weight_disk", "blade_base", "spinning_gear"],
  metal: ["face", "clear_wheel", "metal_wheel", "spin_track", "performance_tip"],
  burst: ["layer", "forge_disc", "driver"],
  x: ["blade", "ratchet", "bit"],
} as const;

export const SOURCES = [
  "mercari_jp",
  "shopee_tw",
  "yahoo_auctions_jp",
  "ruten_tw",
  "mandarake_jp",
  "suruga_ya_jp",
  "ebay_com",
  "walmart_us",
  "amazon_us",
] as const;
export type SourceId = (typeof SOURCES)[number];

export const SOURCE_LABELS: Record<SourceId, string> = {
  mercari_jp: "Mercari JP",
  shopee_tw: "Shopee TW",
  yahoo_auctions_jp: "Yahoo Auctions JP",
  ruten_tw: "Ruten TW",
  mandarake_jp: "Mandarake",
  suruga_ya_jp: "Suruga-ya",
  ebay_com: "eBay US",
  walmart_us: "Walmart US",
  amazon_us: "Amazon US",
};

export const CURRENCIES = ["JPY", "TWD", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const CONDITIONS = ["sealed", "like_new", "used", "unknown"] as const;
export type Condition = (typeof CONDITIONS)[number];

export const OBSERVATION_STATUSES = ["listing", "sold"] as const;
export type ObservationStatus = (typeof OBSERVATION_STATUSES)[number];

export type MatchMethod = "product_code" | "alias_exact" | "alias_fuzzy" | "manual";

export const MATCH_METHOD_LABELS: Record<MatchMethod, string> = {
  product_code: "SKU code",
  alias_exact: "Exact alias",
  alias_fuzzy: "Fuzzy",
  manual: "Manual",
};

export const SKU_TYPES = [
  "sealed",
  "starter",
  "complete_loose",
  "complete_sealed",
] as const;
export type SkuType = (typeof SKU_TYPES)[number];

export interface PartDTO {
  id: string;
  generation: Generation;
  partType: string;
  nameEn: string;
  nameJp: string | null;
  nameZh: string | null;
  productCodes: string[];
  attrs: Record<string, unknown>;
}

export interface AliasDTO {
  partId: string;
  locale: "en" | "ja" | "zh";
  text: string;
  source: string;
}

export interface ProductDTO {
  id: string;
  generation: Generation;
  skuType: SkuType;
  nameEn: string;
  nameJp: string | null;
  productCodes: string[];
  attrs: Record<string, unknown>;
  /** Part IDs that compose this SKU (recipe). */
  partIds: string[];
}

export interface ObservationDTO {
  id: string;
  source: SourceId;
  externalId: string;
  title: string;
  price: number;
  currency: Currency;
  status: ObservationStatus;
  condition: Condition;
  url: string;
  observedAt: Date;
  rawJson: Record<string, unknown>;
  /** Buyer landed price in JPY at time of sale (item + shipping). */
  landedJpy?: number | null;
  fxRateAtSale?: number | null;
  shippingJpy?: number | null;
}

export interface MatchDTO {
  observationId: string;
  partId: string;
  confidence: number;
  method: MatchMethod;
}

export interface RegionEstimate {
  region: "jp" | "tw";
  value: number;
  /** TW/JP ratio when region is tw. */
  premiumPct: number;
}

export interface OracleSnapshotDTO {
  assetId: string;
  sourcesMask: number;
  value: number;
  low: number;
  high: number;
  nComps: number;
  asOf: Date;
  currency: Currency;
  confidence: "high" | "medium" | "low";
  /** Which condition classes fed this mark (omitted = all). */
  conditions?: Condition[];
  /** v2: Kish effective sample size after time-decay weighting. */
  nEffective?: number;
  outliersRemoved?: number;
  engine?: "v1" | "v2";
  shrinkageApplied?: boolean;
  regionEstimates?: RegionEstimate[];
}

/** Bitmask helpers for source toggles */
export const SOURCE_MASK: Record<SourceId, number> = {
  mercari_jp: 1,
  shopee_tw: 2,
  yahoo_auctions_jp: 4,
  ruten_tw: 8,
  mandarake_jp: 16,
  suruga_ya_jp: 32,
  ebay_com: 64,
  walmart_us: 128,
  amazon_us: 256,
};

export function maskFromSources(sources: SourceId[]): number {
  return sources.reduce((m, s) => m | SOURCE_MASK[s], 0);
}

export function sourcesFromMask(mask: number): SourceId[] {
  return SOURCES.filter((s) => (mask & SOURCE_MASK[s]) !== 0);
}

export function allSourcesMask(): number {
  return maskFromSources([...SOURCES]);
}

export {
  FX_RATES,
  convertCurrency,
  fetchFxRateAtDate,
  getStaticFxRate,
} from "./fx.js";
export {
  computeLandedJpy,
  computeLandedJpySync,
  estimateShippingAmount,
  resolveCompPriceJpy,
  DEFAULT_SHIPPING_TWD,
  type LandedPriceInput,
  type LandedPriceResult,
} from "./landed-price.js";

export function normalizeText(s: string): string {
  return normalizeForMatch(s);
}

export { normalizeForMatch, matchKeys, normalizedContains } from "./normalize-match.js";
export {
  classifyListingShape,
  isCompEligible,
  isIngestEligible,
  isProductCompEligible,
  looksLikeBeybladeListing,
  looksLikeBundle,
  type ListingShape,
} from "./shape.js";
export {
  ASSEMBLED_SLOTS,
  analyzeProductRecipe,
  inferRecipeKind,
  isProductMarkEligible,
  type ProductRecipeAnalysis,
  type ProductRecipeSlot,
  type RecipeKind,
} from "./product-recipe.js";
export {
  computeRetailReference,
  US_RETAIL_SOURCES,
  type RetailReference,
  type RetailReferenceInput,
} from "./retail-reference.js";
export {
  EVIDENCE_KINDS,
  EVIDENCE_LABELS,
  SOURCE_DEFAULT_EVIDENCE,
  evidenceLabel,
  feedsOracleMark,
  resolveEvidenceKind,
  type EvidenceKind,
} from "./provenance.js";

export function tokenSet(s: string): Set<string> {
  return new Set(normalizeText(s).split(" ").filter(Boolean));
}

export function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const t of a) {
    if (b.has(t)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

const CJK_RE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u;

/** Split polluted alias rows like "ドランソード BX-01" into atomic surface forms. */
export function splitAliasText(text: string): string[] {
  const out = new Set<string>([text.trim()]);
  const codeTail =
    /^(.+?)\s+(BX-\d{2}|UX-\d{2}|CX-\d{2}|B-\d{2,3}|BB-?\d{2}[A-Z]?|A-\d{2}|D-\d+|DS-\d+|MD-\d+|WD-[A-Z0-9]+|BB105|WF2|WD|R2F|BB-?\d+[A-Z]?)$/i;
  const m = text.trim().match(codeTail);
  if (m) {
    out.add(m[1]!.trim());
    out.add(m[2]!.trim());
  }
  return [...out].filter(Boolean);
}

/**
 * CJK-aware tokens: whitespace words for Latin, character bigrams for CJK runs.
 * Handles unspaced Japanese titles like ベイブレードXドランソード3-60F.
 */
export function tokenSetCjkAware(s: string): Set<string> {
  const norm = normalizeText(s);
  const tokens = new Set<string>();

  for (const word of norm.split(/\s+/).filter(Boolean)) {
    addCjkTokens(tokens, word);
  }

  // Pull CJK runs out of the full normalized string (catches unspaced titles).
  for (const run of norm.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]+/gu) ?? []) {
    addCjkTokens(tokens, run);
  }

  // Latin/alphanumeric chunks (product codes, 3-60f).
  for (const chunk of norm.match(/[a-z0-9][a-z0-9-]*/g) ?? []) {
    if (chunk.length >= 2) tokens.add(chunk);
  }

  return tokens;
}

function addCjkTokens(tokens: Set<string>, run: string): void {
  if (!CJK_RE.test(run)) {
    if (run.length >= 2) tokens.add(run);
    return;
  }
  if (run.length <= 4) tokens.add(run);
  for (let i = 0; i < run.length - 1; i++) {
    tokens.add(run.slice(i, i + 2));
  }
}

/** Combined similarity for fuzzy matching (CJK bigrams + whitespace words). */
export function textSimilarity(a: string, b: string): number {
  if (normalizedContains(a, b)) {
    const aKeys = matchKeys(a);
    const bKeys = matchKeys(b);
    for (const ak of aKeys) {
      for (const bk of bKeys) {
        if (bk.length >= 2 && ak.includes(bk)) return 1;
        if (ak.length >= 2 && bk.includes(ak)) return 0.95;
      }
    }
  }
  return jaccardSimilarity(tokenSetCjkAware(a), tokenSetCjkAware(b));
}

export const CONDITION_LABELS: Record<Condition, string> = {
  sealed: "Sealed / New",
  like_new: "Like New",
  used: "Used",
  unknown: "Unknown",
};

/** Default comps bucket for secondary-market Oracle Value (excludes sealed retail). */
export const DEFAULT_ORACLE_CONDITIONS: Condition[] = ["used", "like_new", "unknown"];

/** Sealed whole-SKU marks (complete_sealed / sealed boxes). */
export const SEALED_ORACLE_CONDITIONS: Condition[] = ["sealed"];

/**
 * Condition pool for a product mark — variants stay separated:
 * complete_sealed / sealed → factory MIB only;
 * complete_loose → used secondary (default mark);
 * starter → opened starter+launcher only (never sealed/NIB).
 */
export function productMarkConditions(skuType: SkuType): Condition[] {
  switch (skuType) {
    case "complete_sealed":
    case "sealed":
      return [...SEALED_ORACLE_CONDITIONS];
    case "starter":
    case "complete_loose":
    default:
      return [...DEFAULT_ORACLE_CONDITIONS];
  }
}

/**
 * Minimum sold comps before publishing a mark on asset/product pages.
 * Multi-comp floor: sparse single sales never become a confident published mark.
 */
export const DEFAULT_PUBLISHED_MIN_COMPS = 3;

/** Product oracle lookback — multi-month secondary market (plastic/metal need longer windows). */
export const PRODUCT_ORACLE_WINDOW_DAYS = 180;

/** Burst FMV: prefer 7-day sold comps; fall back to 90d only if 7d has fewer than min comps. */
export const BURST_FMV_PRIMARY_WINDOW_DAYS = 7;
export const BURST_FMV_FALLBACK_WINDOW_DAYS = 90;

/**
 * Seed/demo fixtures never feed published product marks or product-page comps.
 * Live marketplace rows either omit `fixture` or set it false.
 */
export function isLiveMarketplaceComp(rawJson: unknown): boolean {
  if (rawJson == null || typeof rawJson !== "object") return true;
  return (rawJson as { fixture?: boolean }).fixture !== true;
}

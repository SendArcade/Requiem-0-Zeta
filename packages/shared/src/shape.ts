/**
 * Listing-shape classifier — run before matching.
 * Pattern from matcher v3 research (docs/MATCHING_RESEARCH.md).
 */

import {
  bareLegacyBbHasContext,
  BEYBLADE_SIGNAL_RE,
  BARE_BB_CODE_RE,
  BURST_B_CODE_RE,
  HYPHEN_BB_CODE_RE,
  HYPHEN_CATALOG_CODE_RE,
  bareBurstBCodeHasContext,
  isBeybladeAccessoryListing,
  isNonBeybladeJunk,
  METAL_PLASTIC_COMBO_RE,
  X_COMBO_SUFFIX_RE,
} from "./listing-quality.js";

export type ListingShape = "single_part" | "complete_bey" | "lot";

const LOT_PATTERNS: RegExp[] = [
  /まとめ売り|まとめて|まとめ|セット売り/,
  /\d+\s*(個|点|本|台)\s*(セット|まとめ)?/,
  /大量|詰め合わせ|ジャンク品?まとめ|ジャンク扱い/,
  /整組|全套|一批|多件|套組/,
  /\d+\s*(件|入|組)/,
  /\bbundle\b|\block\b|\bset of\b|\bjoblot\b/i,
  /\b\d+\s*種\s*セット\b/,
];

const MULTI_ITEM_JOINER = /[＆&＋+]/;

const SINGLE_PART_MARKERS =
  /単品|バラ売り|のみ|散裝|單顆|ブレードのみ|ラチェットのみ|ビットのみ|blade only|ratchet only|bit only/i;

/** Starter / booster / deck SKUs — priced as a full Bey, not one loose part. */
const COMPLETE_BEY_MARKERS =
  /スターター|starter|ブースター|booster|スタートダッシュ|entry set|デッキセット|deck set|スタートダッシュセット|バトルエントリー|3on3|カスタマイズセット/i;

function canonicalizeShapeCode(code: string): string {
  const u = code.toUpperCase().replace(/\s+/g, "");
  if (/^(BX|UX|CX|BB|B|A)-/.test(u)) return u;
  const m = u.match(/^(BX|UX|CX|BB|B|A)(\d{2,3})([A-Z]?)$/);
  if (m) return `${m[1]}-${m[2]}${m[3] ?? ""}`;
  return u;
}

function extractProductCodes(title: string): string[] {
  const re =
    /\b(BX-?\d{2}|UX-?\d{2}|CX-?\d{2}|B-?\d{2,3}|BB-?\d{2}[A-Z]?|A-?\d{1,2})\b/gi;
  return [
    ...new Set((title.match(re) ?? []).map((m) => canonicalizeShapeCode(m))),
  ];
}

function looksLikeLot(title: string): boolean {
  if (MULTI_ITEM_JOINER.test(title)) return true;
  if (LOT_PATTERNS.some((re) => re.test(title))) return true;
  if (extractProductCodes(title).length >= 2) return true;
  if (/セット/.test(title)) {
    if (/まとめ|種|個|点|台/.test(title)) return true;
    if (/セット\s*$/.test(title.trim())) return true;
  }
  return false;
}

/** Title looks like a Beyblade listing — gate before matcher auto-accept. */
export function looksLikeBeybladeListing(title: string): boolean {
  if (isNonBeybladeJunk(title)) return false;
  if (isBeybladeAccessoryListing(title)) return false;
  if (BEYBLADE_SIGNAL_RE.test(title)) return true;
  if (HYPHEN_BB_CODE_RE.test(title)) return true;
  if (BARE_BB_CODE_RE.test(title)) {
    return bareLegacyBbHasContext(title);
  }
  if (HYPHEN_CATALOG_CODE_RE.test(title)) return true;
  if (BURST_B_CODE_RE.test(title)) return bareBurstBCodeHasContext(title);
  return false;
}

/** Part or whole-SKU ingest — never lots. */
export function isIngestEligible(title: string): boolean {
  const shape = classifyListingShape(title);
  return shape === "single_part" || shape === "complete_bey";
}

/** Whole-product comps — complete Bey listings only (never loose singles). */
export function isProductCompEligible(title: string): boolean {
  if (isBeybladeAccessoryListing(title)) return false;
  return classifyListingShape(title) === "complete_bey";
}

export function classifyListingShape(title: string): ListingShape {
  if (looksLikeLot(title)) return "lot";
  if (isBeybladeAccessoryListing(title)) return "single_part";

  if (SINGLE_PART_MARKERS.test(title)) return "single_part";

  if (COMPLETE_BEY_MARKERS.test(title)) return "complete_bey";

  // Whole SKU with product code + complete/sealed packaging language (JP + EN).
  if (
    extractProductCodes(title).length > 0 &&
    looksLikeBeybladeListing(title) &&
    (/完成品/.test(title) ||
      /\bcomplete\b/i.test(title) ||
      /\bassembled\b/i.test(title) ||
      /\bnib\b/i.test(title) ||
      /new in box/i.test(title))
  ) {
    return "complete_bey";
  }

  // X combo suffix needs catalog code or bey signal — blocks loose 9-65B bit listings.
  if (
    X_COMBO_SUFFIX_RE.test(title) &&
    !SINGLE_PART_MARKERS.test(title) &&
    (looksLikeBeybladeListing(title) || hasCatalogOrBeyContext(title))
  ) {
    return "complete_bey";
  }

  // Metal Fight bare BB30 + character/combo (hyphen optional in JP listings).
  if (
    BARE_BB_CODE_RE.test(title) &&
    bareLegacyBbHasContext(title) &&
    !SINGLE_PART_MARKERS.test(title)
  ) {
    return "complete_bey";
  }

  const withoutCodes = title.replace(
    /\b(BX-?\d{2}|UX-?\d{2}|CX-?\d{2}|B-?\d{2,3}|BB-?\d{2}[A-Z]?|A-?\d{1,2})\b/gi,
    " "
  );
  if (
    extractProductCodes(title).length > 0 &&
    METAL_PLASTIC_COMBO_RE.test(withoutCodes) &&
    !SINGLE_PART_MARKERS.test(title) &&
    (BEYBLADE_SIGNAL_RE.test(title) ||
      bareLegacyBbHasContext(title) ||
      HYPHEN_BB_CODE_RE.test(title))
  ) {
    return "complete_bey";
  }

  // Plastic-gen Takara A-codes (A-1 Dragoon S, …) listed with character name / bey signal.
  if (
    /\bA-?\d{1,2}\b/i.test(title) &&
    BEYBLADE_SIGNAL_RE.test(title) &&
    !SINGLE_PART_MARKERS.test(title)
  ) {
    return "complete_bey";
  }

  return "single_part";
}

function hasCatalogOrBeyContext(title: string): boolean {
  return (
    HYPHEN_CATALOG_CODE_RE.test(title) ||
    HYPHEN_BB_CODE_RE.test(title) ||
    BEYBLADE_SIGNAL_RE.test(title)
  );
}

/** Only loose single-part sold listings may feed a part-level oracle mark. */
export function isCompEligible(title: string): boolean {
  return classifyListingShape(title) === "single_part";
}

/** @deprecated Use classifyListingShape === "lot" — kept for existing call sites. */
export function looksLikeBundle(title: string): boolean {
  return classifyListingShape(title) === "lot";
}

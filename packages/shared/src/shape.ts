/**
 * Listing-shape classifier — run before matching.
 * Pattern from matcher v3 research (docs/MATCHING_RESEARCH.md).
 */

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

/** Beyblade / Takara-Tomy SKU tokens that must appear as printed (hyphenated), not 【A01】 tags. */
const CATALOG_CODE_IN_TITLE =
  /\b(BX-\d{2}|UX-\d{2}|CX-\d{2}|B-\d{2,3}|BB-?\d{2}[A-Z]?|A-\d{2}|D-\d+|DS-\d+|MD-\d+|WD-[A-Z0-9]+|BB105|WF2|R2F|WD)\b/i;

const BEYBLADE_SIGNAL =
  /ベイブレード|beyblade\s*x?|beybladex|戰鬥陀螺|战斗陀螺|爆旋陀螺/i;

const MULTI_ITEM_JOINER = /[＆&＋+]/;

const SINGLE_PART_MARKERS =
  /単品|バラ売り|のみ|散裝|單顆|ブレードのみ|ラチェットのみ|ビットのみ|blade only|ratchet only|bit only/i;

/** Starter / booster / deck SKUs — priced as a full Bey, not one loose part. */
const COMPLETE_BEY_MARKERS =
  /スターター|starter|ブースター|booster|スタートダッシュ|entry set|デッキセット|deck set|スタートダッシュセット|バトルエントリー|3on3|カスタマイズセット/i;

/** X combo suffix: ratchet + bit, e.g. 3-60F, 4-80B, 3-60 f. */
const COMBO_SUFFIX = /\d-\d{2}\s*[a-z]{1,3}\b/i;

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
  if (BEYBLADE_SIGNAL.test(title)) return true;
  return CATALOG_CODE_IN_TITLE.test(title);
}

/** Part or whole-SKU ingest — never lots. */
export function isIngestEligible(title: string): boolean {
  const shape = classifyListingShape(title);
  return shape === "single_part" || shape === "complete_bey";
}

/** Whole-product comps — complete Bey listings only (never loose singles). */
export function isProductCompEligible(title: string): boolean {
  return classifyListingShape(title) === "complete_bey";
}

export function classifyListingShape(title: string): ListingShape {
  if (looksLikeLot(title)) return "lot";

  if (SINGLE_PART_MARKERS.test(title)) return "single_part";

  if (COMPLETE_BEY_MARKERS.test(title)) return "complete_bey";

  // Whole SKU with product code + complete/sealed packaging language (JP + EN).
  if (
    extractProductCodes(title).length > 0 &&
    (/完成品/.test(title) ||
      /\bcomplete\b/i.test(title) ||
      /\bassembled\b/i.test(title) ||
      /\bnib\b/i.test(title) ||
      /new in box/i.test(title))
  ) {
    return "complete_bey";
  }

  // Full X combo name without a single-part marker → starter-equivalent listing.
  if (COMBO_SUFFIX.test(title) && !SINGLE_PART_MARKERS.test(title)) {
    return "complete_bey";
  }

  // Metal/Plastic whole tops often list as "BB-28 ストームペガシス 105RF" without
  // スターター/完成品. Product code + track/tip combo (and no part-only marker) ≈ complete.
  // Strip catalog codes first so "BB-01S" itself is not treated as a combo.
  const withoutCodes = title.replace(
    /\b(BX-?\d{2}|UX-?\d{2}|CX-?\d{2}|B-?\d{2,3}|BB-?\d{2}[A-Z]?|A-?\d{1,2})\b/gi,
    " "
  );
  const METAL_OR_PLASTIC_COMBO =
    /\b\d{2,3}[A-Z]{1,3}\b|\b[A-Z]{1,2}\d{2,3}[A-Z]{0,3}\b/;
  if (
    extractProductCodes(title).length > 0 &&
    METAL_OR_PLASTIC_COMBO.test(withoutCodes) &&
    !SINGLE_PART_MARKERS.test(title)
  ) {
    return "complete_bey";
  }

  // Plastic-gen Takara A-codes (A-1 Dragoon S, …) listed with character name / bey signal.
  if (
    /\bA-?\d{1,2}\b/i.test(title) &&
    BEYBLADE_SIGNAL.test(title) &&
    !SINGLE_PART_MARKERS.test(title)
  ) {
    return "complete_bey";
  }

  return "single_part";
}

/** Only loose single-part sold listings may feed a part-level oracle mark. */
export function isCompEligible(title: string): boolean {
  return classifyListingShape(title) === "single_part";
}

/** @deprecated Use classifyListingShape === "lot" — kept for existing call sites. */
export function looksLikeBundle(title: string): boolean {
  return classifyListingShape(title) === "lot";
}

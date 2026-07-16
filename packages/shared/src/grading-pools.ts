/**
 * Grading ↔ oracle pool mapping (Notion auth/grading spec).
 * Maps S10–S6 sealed and L10–L3 loose grade codes to comp condition filters.
 * Premium pool (G 15–16) is a stub — no separate Condition enum yet.
 */

/** Mirrors shared Condition — kept local to avoid circular import with index.ts */
type OracleCondition = "sealed" | "like_new" | "used" | "unknown";

export const SEALED_GRADE_CODES = ["S10", "S9", "S8", "S7", "S6"] as const;
export const LOOSE_GRADE_CODES = [
  "L10",
  "L9",
  "L8",
  "L7",
  "L6",
  "L5",
  "L4",
  "L3",
] as const;

export type SealedGradeCode = (typeof SEALED_GRADE_CODES)[number];
export type LooseGradeCode = (typeof LOOSE_GRADE_CODES)[number];
export type GradeCode = SealedGradeCode | LooseGradeCode;

/** Named oracle comp pools — keys match grading spec §5 platform mapping. */
export const GRADED_ORACLE_CONDITIONS = {
  /** S10 — factory sealed NIB */
  sealed: ["sealed"] as OracleCondition[],
  /** S9–S7 / MIB — mint open box */
  like_new: ["like_new"] as OracleCondition[],
  /** L8+ loose gem/near mint — complete loose (mint) */
  loose_mint: ["like_new"] as OracleCondition[],
  /** L6–L9 — complete loose standard pool */
  loose_standard: ["used", "like_new"] as OracleCondition[],
  /** L4–L7 — played / light play */
  loose_used: ["used"] as OracleCondition[],
  /** L8+ with G 15–16 — premium mold/weight pool (stub: same conditions, flagged separately) */
  premium: ["like_new", "used"] as OracleCondition[],
} as const;

export type GradingPool = keyof typeof GRADED_ORACLE_CONDITIONS;

const SEALED_GRADE_POOL: Record<SealedGradeCode, GradingPool> = {
  S10: "sealed",
  S9: "like_new",
  S8: "like_new",
  S7: "like_new",
  S6: "loose_standard",
};

const LOOSE_GRADE_POOL: Record<LooseGradeCode, GradingPool> = {
  L10: "loose_mint",
  L9: "loose_standard",
  L8: "loose_standard",
  L7: "loose_used",
  L6: "loose_used",
  L5: "loose_used",
  L4: "loose_used",
  L3: "loose_used",
};

/** Map a grade certificate code to the oracle comp pool name. */
export function gradeToGradingPool(grade: GradeCode): GradingPool {
  if (grade.startsWith("S")) {
    return SEALED_GRADE_POOL[grade as SealedGradeCode];
  }
  return LOOSE_GRADE_POOL[grade as LooseGradeCode];
}

/** Resolve oracle condition filter from grade + optional G subscore (0–16). */
export function gradeToOracleConditions(
  grade: GradeCode,
  gSubscore?: number | null
): OracleCondition[] {
  if (gSubscore != null && isPremiumPoolEligible(gSubscore)) {
    const base = gradeToGradingPool(grade);
    if (base === "loose_mint" || base === "loose_standard") {
      return [...GRADED_ORACLE_CONDITIONS.premium];
    }
  }
  return [...GRADED_ORACLE_CONDITIONS[gradeToGradingPool(grade)]];
}

/** G 15–16 → premium pool eligibility (Notion §3 G→oracle modifier). */
export function isPremiumPoolEligible(gSubscore: number): boolean {
  return gSubscore >= 15;
}

const SEALED_TITLE_RE =
  /(新品|未開封|未使用|\bshrink\b|\bsealed\b|\bnib\b|new in box|factory sealed)/i;
const LIKE_NEW_TITLE_RE =
  /(美品|未使用に近い|ほぼ新品|箱あり|箱付|\blike new\b|\bmint\b|\bmib\b)/i;
const USED_TITLE_RE =
  /(中古|傷|ジャンク|\bused\b|\bplayed\b|\bjunk\b|as[- ]?is)/i;

/** Heuristic condition from marketplace listing title (JP/EN). */
export function inferConditionFromTitle(title: string): OracleCondition {
  const t = title.trim();
  if (SEALED_TITLE_RE.test(t)) return "sealed";
  if (LIKE_NEW_TITLE_RE.test(t)) return "like_new";
  if (USED_TITLE_RE.test(t)) return "used";
  return "unknown";
}

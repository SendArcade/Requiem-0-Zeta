import { describe, it, expect } from "vitest";
import {
  gradeToGradingPool,
  gradeToOracleConditions,
  inferConditionFromTitle,
  isPremiumPoolEligible,
  GRADED_ORACLE_CONDITIONS,
} from "./grading-pools.js";

describe("grading pool mapping", () => {
  it("maps sealed grades S10–S6", () => {
    expect(gradeToGradingPool("S10")).toBe("sealed");
    expect(gradeToGradingPool("S9")).toBe("like_new");
    expect(gradeToGradingPool("S6")).toBe("loose_standard");
  });

  it("maps loose grades L10–L3", () => {
    expect(gradeToGradingPool("L10")).toBe("loose_mint");
    expect(gradeToGradingPool("L8")).toBe("loose_standard");
    expect(gradeToGradingPool("L7")).toBe("loose_used");
    expect(gradeToGradingPool("L3")).toBe("loose_used");
  });

  it("promotes L8+ to premium pool when G≥15", () => {
    const conds = gradeToOracleConditions("L8", 16);
    expect(conds).toEqual(GRADED_ORACLE_CONDITIONS.premium);
  });

  it("keeps standard pool for median G", () => {
    const conds = gradeToOracleConditions("L8", 10);
    expect(conds).toEqual(GRADED_ORACLE_CONDITIONS.loose_standard);
  });

  it("detects premium eligibility at G 15+", () => {
    expect(isPremiumPoolEligible(15)).toBe(true);
    expect(isPremiumPoolEligible(14)).toBe(false);
  });
});

describe("inferConditionFromTitle", () => {
  it("detects sealed / like_new / used from JP and EN cues", () => {
    expect(inferConditionFromTitle("ベイブレードX 未開封 新品")).toBe("sealed");
    expect(inferConditionFromTitle("Dran Sword BX-01 美品 箱付")).toBe("like_new");
    expect(inferConditionFromTitle("中古 傷あり")).toBe("used");
    expect(inferConditionFromTitle("Dran Sword")).toBe("unknown");
  });
});

import { describe, it, expect } from "vitest";
import {
  runScoreboard,
  scoreboardLeaveOneOut,
  formatScoreboardReport,
  type ScoreboardPanel,
} from "./eval-scoreboard.js";

describe("eval scoreboard v1 vs v2", () => {
  const panels: ScoreboardPanel[] = [
    {
      id: "outlier-panel",
      assetId: "x-test",
      truth: 500,
      comps: [
        { price: 490, currency: "JPY", source: "mercari_jp", daysAgo: 3, condition: "used" },
        { price: 505, currency: "JPY", source: "mercari_jp", daysAgo: 5, condition: "used" },
        { price: 495, currency: "JPY", source: "mercari_jp", daysAgo: 8, condition: "used" },
        { price: 510, currency: "JPY", source: "mercari_jp", daysAgo: 12, condition: "used" },
        { price: 2500, currency: "JPY", source: "mercari_jp", daysAgo: 4, condition: "used" },
      ],
    },
    {
      id: "stale-panel",
      assetId: "x-test-2",
      truth: 1000,
      comps: [
        { price: 980, currency: "JPY", source: "mercari_jp", daysAgo: 5, condition: "used" },
        { price: 1020, currency: "JPY", source: "mercari_jp", daysAgo: 7, condition: "used" },
        { price: 990, currency: "JPY", source: "mercari_jp", daysAgo: 10, condition: "used" },
        { price: 400, currency: "JPY", source: "mercari_jp", daysAgo: 85, condition: "used" },
      ],
    },
  ];

  it("produces LOO MAE and revision metrics", () => {
    const report = scoreboardLeaveOneOut(panels);
    expect(report.panels).toBe(2);
    expect(report.foldCount).toBe(9);
    expect(report.maeV1).not.toBeNull();
    expect(report.maeV2).not.toBeNull();
    expect(report.v2WinRate).toBeGreaterThanOrEqual(0);
    expect(formatScoreboardReport(report)).toMatch(/LOO-MAE/);
  });

  it("v2 LOO-MAE beats v1 on fixture panels", () => {
    const report = runScoreboard();
    expect(report.panels).toBeGreaterThanOrEqual(4);
    expect(report.maeV2).not.toBeNull();
    expect(report.maeV1).not.toBeNull();
    expect(report.maeV2!).toBeLessThanOrEqual(report.maeV1!);
  });
});

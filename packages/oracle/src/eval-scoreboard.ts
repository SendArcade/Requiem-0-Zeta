/**
 * Eval scoreboard — compare oracle v1 vs v2 on fixed comp panels.
 * Inspired by hpipy k-fold error / revision metrics (see docs/VALUATION_RESEARCH.md).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Currency, SourceId } from "@beyoracle/shared";
import { computeOracleValue, type CompInput } from "./oracle-value.js";

export interface ScoreboardCompFixture {
  price: number;
  currency: Currency;
  source: SourceId;
  daysAgo: number;
  condition?: CompInput["condition"];
  landedJpy?: number;
}

export interface ScoreboardPanel {
  id: string;
  assetId: string;
  note?: string;
  /** Known fair value for absolute-error metric (synthetic ground truth). */
  truth: number;
  comps: ScoreboardCompFixture[];
}

export interface ScoreboardFoldResult {
  panelId: string;
  heldOutIndex: number;
  heldOutPrice: number;
  v1Estimate: number | null;
  v2Estimate: number | null;
  v1AbsError: number | null;
  v2AbsError: number | null;
}

export interface ScoreboardReport {
  panels: number;
  foldCount: number;
  /** Median absolute error vs held-out comp price. */
  maeV1: number | null;
  maeV2: number | null;
  /** Fraction of panels where |v2−v1|/v1 > revisionThreshold on full panel. */
  revisionRate: number;
  /** Fraction of folds where v2 abs error < v1 abs error. */
  v2WinRate: number;
  /** MAE vs synthetic truth (full-panel mark). */
  truthMaeV1: number | null;
  truthMaeV2: number | null;
  revisionThreshold: number;
  foldResults: ScoreboardFoldResult[];
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_PANELS_PATH = join(__dirname, "..", "fixtures", "eval-scoreboard-panels.json");

function fixtureToComp(f: ScoreboardCompFixture, asOf: Date): CompInput {
  const observedAt = new Date(asOf);
  observedAt.setDate(observedAt.getDate() - f.daysAgo);
  return {
    price: f.price,
    currency: f.currency,
    source: f.source,
    observedAt,
    status: "sold",
    condition: f.condition ?? "used",
    landedJpy: f.landedJpy ?? (f.currency === "JPY" ? f.price : undefined),
  };
}

function medianAbs(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2;
  }
  return sorted[mid]!;
}

function absError(estimate: number | null, target: number): number | null {
  if (estimate == null) return null;
  return Math.abs(estimate - target);
}

/** Leave-one-out folds: train on n−1 comps, predict held-out price. */
export function scoreboardLeaveOneOut(
  panels: ScoreboardPanel[],
  opts: { asOf?: Date; revisionThreshold?: number } = {}
): ScoreboardReport {
  const asOf = opts.asOf ?? new Date("2026-07-15T00:00:00Z");
  const revisionThreshold = opts.revisionThreshold ?? 0.05;
  const folds: ScoreboardFoldResult[] = [];
  const v1Errors: number[] = [];
  const v2Errors: number[] = [];
  const truthErrorsV1: number[] = [];
  const truthErrorsV2: number[] = [];
  let revisions = 0;
  let comparablePanels = 0;

  for (const panel of panels) {
    const allComps = panel.comps.map((c) => fixtureToComp(c, asOf));

    const fullV1 = computeOracleValue(panel.assetId, allComps, {
      engine: "v1",
      minComps: 3,
      windowDays: 90,
    });
    const fullV2 = computeOracleValue(panel.assetId, allComps, {
      engine: "v2",
      minComps: 3,
      windowDays: 90,
    });

    if (fullV1 && fullV2 && fullV1.value > 0) {
      comparablePanels++;
      if (Math.abs(fullV2.value - fullV1.value) / fullV1.value > revisionThreshold) {
        revisions++;
      }
    }

    const e1 = absError(fullV1?.value ?? null, panel.truth);
    const e2 = absError(fullV2?.value ?? null, panel.truth);
    if (e1 != null) truthErrorsV1.push(e1);
    if (e2 != null) truthErrorsV2.push(e2);

    for (let i = 0; i < allComps.length; i++) {
      const heldOut = allComps[i]!;
      const train = allComps.filter((_, j) => j !== i);
      const heldOutPrice =
        heldOut.landedJpy != null && heldOut.landedJpy > 0
          ? heldOut.landedJpy
          : heldOut.price;

      const v1 = computeOracleValue(panel.assetId, train, {
        engine: "v1",
        minComps: 3,
        windowDays: 90,
      });
      const v2 = computeOracleValue(panel.assetId, train, {
        engine: "v2",
        minComps: 3,
        windowDays: 90,
      });

      const v1Err = absError(v1?.value ?? null, heldOutPrice);
      const v2Err = absError(v2?.value ?? null, heldOutPrice);

      if (v1Err != null) v1Errors.push(v1Err);
      if (v2Err != null) v2Errors.push(v2Err);

      folds.push({
        panelId: panel.id,
        heldOutIndex: i,
        heldOutPrice,
        v1Estimate: v1?.value ?? null,
        v2Estimate: v2?.value ?? null,
        v1AbsError: v1Err,
        v2AbsError: v2Err,
      });
    }
  }

  let v2Wins = 0;
  let v2Comparable = 0;
  for (const f of folds) {
    if (f.v1AbsError != null && f.v2AbsError != null) {
      v2Comparable++;
      if (f.v2AbsError < f.v1AbsError) v2Wins++;
    }
  }

  return {
    panels: panels.length,
    foldCount: folds.length,
    maeV1: medianAbs(v1Errors),
    maeV2: medianAbs(v2Errors),
    revisionRate: comparablePanels ? revisions / comparablePanels : 0,
    v2WinRate: v2Comparable ? v2Wins / v2Comparable : 0,
    truthMaeV1: medianAbs(truthErrorsV1),
    truthMaeV2: medianAbs(truthErrorsV2),
    revisionThreshold,
    foldResults: folds,
  };
}

export function loadScoreboardPanels(path = DEFAULT_PANELS_PATH): ScoreboardPanel[] {
  return JSON.parse(readFileSync(path, "utf-8")) as ScoreboardPanel[];
}

export function runScoreboard(
  panels?: ScoreboardPanel[],
  opts?: { asOf?: Date; revisionThreshold?: number }
): ScoreboardReport {
  const data = panels ?? loadScoreboardPanels();
  return scoreboardLeaveOneOut(data, opts);
}

/** CLI-friendly one-line summary. */
export function formatScoreboardReport(report: ScoreboardReport): string {
  const fmt = (n: number | null) => (n == null ? "n/a" : n.toFixed(1));
  return [
    `panels=${report.panels} folds=${report.foldCount}`,
    `LOO-MAE v1=${fmt(report.maeV1)} v2=${fmt(report.maeV2)}`,
    `truth-MAE v1=${fmt(report.truthMaeV1)} v2=${fmt(report.truthMaeV2)}`,
    `v2-win=${(report.v2WinRate * 100).toFixed(0)}%`,
    `revision=${(report.revisionRate * 100).toFixed(0)}% (>${report.revisionThreshold * 100}% delta)`,
  ].join(" | ");
}

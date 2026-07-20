/**
 * Weighted Harrell-Davis quantile estimator.
 * Ported from perfolizer (MIT): HarrellDavisQuantileEstimator.cs
 * https://github.com/AndreyAkinshin/perfolizer
 *
 * Harrell, F.E. & Davis, C.E. (1982). A new distribution-free quantile estimator.
 * Biometrika 69(3), 635-640.
 */

import { weightedMedian } from "./robust-estimator.js";

/** Minimum sample count before HD replaces weighted-median fallback. */
export const HD_MIN_N = 5;

/** Regularized incomplete beta I_x(a, b) via continued fraction (Numerical Recipes). */
function regularizedBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  const lnBeta =
    logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x);
  const front = Math.exp(lnBeta);

  if (x < (a + 1) / (a + b + 2)) {
    return (front * betaContinuedFraction(x, a, b)) / a;
  }
  return 1 - (front * betaContinuedFraction(1 - x, b, a)) / b;
}

function betaContinuedFraction(x: number, a: number, b: number): number {
  const maxIterations = 200;
  const epsilon = 3e-14;
  let m = 1;
  let aa: number;
  let del: number;
  let qab = a + b;
  let qap = a + 1;
  let qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < 1e-30) d = 1e-30;
  d = 1 / d;
  let h = d;

  for (let i = 1; i <= maxIterations; i++) {
    const i2 = 2 * i;
    aa = (i * (b - i) * x) / ((qam + i2) * (a + i2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + i) * (qab + i) * x) / ((a + i2) * (qap + i2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    del = d * c;
    h *= del;
    if (Math.abs(del - 1) < epsilon) break;
    m = i;
  }
  void m;
  return h;
}

/** Lanczos log-gamma (g=7). */
function logGamma(z: number): number {
  const coef = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278681905, -0.13857109526572012, 9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  }
  z -= 1;
  let x = coef[0]!;
  for (let i = 1; i < coef.length; i++) {
    x += coef[i]! / (z + i);
  }
  const t = z + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function betaCdf(x: number, a: number, b: number): number {
  return regularizedBeta(x, a, b);
}

/**
 * Weighted Harrell-Davis quantile at probability p ∈ [0, 1].
 * Values and weights are paired; zero/negative weights are clamped to 0.
 */
export function harrellDavisQuantile(values: number[], weights: number[], p: number): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0]!;

  const pairs = values
    .map((v, i) => ({ v, w: Math.max(0, weights[i] ?? 1) }))
    .sort((a, b) => a.v - b.v);

  const totalW = pairs.reduce((s, x) => s + x.w, 0);
  if (totalW <= 0) return weightedMedian(values, weights);

  const n = totalW;
  const a = (n + 1) * p;
  const b = (n + 1) * (1 - p);

  let estimate = 0;
  let betaCdfRight = 0;
  let currentProbability = 0;

  for (let j = 0; j < pairs.length; j++) {
    const betaCdfLeft = betaCdfRight;
    currentProbability += pairs[j]!.w / totalW;
    betaCdfRight = betaCdf(currentProbability, a, b);
    const w = betaCdfRight - betaCdfLeft;
    estimate += w * pairs[j]!.v;
  }

  return estimate;
}

/** HD median shorthand. */
export function harrellDavisMedian(values: number[], weights: number[]): number {
  return harrellDavisQuantile(values, weights, 0.5);
}

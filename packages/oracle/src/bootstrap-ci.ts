/**
 * Percentile bootstrap confidence interval for a weighted point estimate.
 * Resamples comps with replacement (weights as sampling probabilities).
 */

import { HD_MIN_N } from "./harrell-davis.js";
import { harrellDavisQuantile } from "./harrell-davis.js";
import { weightedMedian } from "./robust-estimator.js";

export const BOOTSTRAP_ITERATIONS = 500;
export const BOOTSTRAP_CI_LEVEL = 0.9;

export interface BootstrapCIOptions {
  iterations?: number;
  /** Two-sided coverage, e.g. 0.9 → 5th–95th percentile band. */
  confidence?: number;
  /** Optional seed for reproducible resampling (tests). */
  seed?: number;
  estimate?: (values: number[], weights: number[]) => number;
}

export interface BootstrapCIResult {
  low: number;
  high: number;
  iterations: number;
  confidence: number;
}

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function weightedSampleIndex(weights: number[], rng: () => number): number {
  const total = weights.reduce((s, w) => s + w, 0);
  if (total <= 0) return Math.floor(rng() * weights.length);
  let r = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]!;
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

function percentileSorted(sorted: number[], p: number): number {
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

function defaultEstimate(values: number[], weights: number[]): number {
  if (values.length >= HD_MIN_N) {
    return harrellDavisQuantile(values, weights, 0.5);
  }
  return weightedMedian(values, weights);
}

/**
 * Bootstrap percentile CI for the given estimator.
 * Returns null when there are fewer than HD_MIN_N observations.
 */
export function bootstrapPercentileCI(
  values: number[],
  weights: number[],
  opts: BootstrapCIOptions = {}
): BootstrapCIResult | null {
  if (values.length < HD_MIN_N) return null;

  const {
    iterations = BOOTSTRAP_ITERATIONS,
    confidence = BOOTSTRAP_CI_LEVEL,
    seed,
    estimate = defaultEstimate,
  } = opts;

  const rng = seed != null ? mulberry32(seed) : Math.random;
  const n = values.length;
  const bootEstimates: number[] = [];

  for (let b = 0; b < iterations; b++) {
    const resampledValues: number[] = [];
    const resampledWeights: number[] = [];
    for (let i = 0; i < n; i++) {
      const idx = weightedSampleIndex(weights, rng);
      resampledValues.push(values[idx]!);
      resampledWeights.push(weights[idx]!);
    }
    bootEstimates.push(estimate(resampledValues, resampledWeights));
  }

  bootEstimates.sort((a, b) => a - b);
  const alpha = (1 - confidence) / 2;

  return {
    low: percentileSorted(bootEstimates, alpha),
    high: percentileSorted(bootEstimates, 1 - alpha),
    iterations,
    confidence,
  };
}

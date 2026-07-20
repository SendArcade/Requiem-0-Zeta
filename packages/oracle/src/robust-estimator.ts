/** Robust comp aggregation — time decay, MAD gate, weighted quantiles. */

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2;
  }
  return sorted[mid]!;
}

export function timeDecayWeight(ageDays: number, halfLifeDays: number): number {
  if (halfLifeDays <= 0) return 1;
  return Math.exp((-Math.LN2 * ageDays) / halfLifeDays);
}

export function venueReliabilityWeight(source: string): number {
  switch (source) {
    case "mercari_jp":
      return 1;
    case "yahoo_auctions_jp":
      return 0.95;
    case "shopee_tw":
      return 0.85;
    default:
      return 0.8;
  }
}

export function weightedMedian(values: number[], weights: number[]): number {
  if (values.length === 0) return 0;
  const pairs = values.map((v, i) => ({ v, w: Math.max(0, weights[i] ?? 1) }));
  pairs.sort((a, b) => a.v - b.v);
  const totalW = pairs.reduce((s, p) => s + p.w, 0);
  if (totalW <= 0) return median(values);
  let cum = 0;
  for (const p of pairs) {
    cum += p.w;
    if (cum >= totalW / 2) return p.v;
  }
  return pairs[pairs.length - 1]!.v;
}

/** Hyndman-Fan type 7 weighted quantile on sorted pairs. */
export function weightedQuantile(values: number[], weights: number[], p: number): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0]!;

  const pairs = values
    .map((v, i) => ({ v, w: Math.max(0, weights[i] ?? 1) }))
    .sort((a, b) => a.v - b.v);

  const totalW = pairs.reduce((s, x) => s + x.w, 0);
  if (totalW <= 0) return median(values);

  const target = totalW * p;
  let cum = 0;
  for (let i = 0; i < pairs.length; i++) {
    const prev = cum;
    cum += pairs[i]!.w;
    if (cum >= target) {
      if (i === 0) return pairs[i]!.v;
      const span = cum - prev;
      if (span <= 0) return pairs[i]!.v;
      const frac = (target - prev) / span;
      const lo = pairs[i - 1]!.v;
      const hi = pairs[i]!.v;
      return lo + frac * (hi - lo);
    }
  }
  return pairs[pairs.length - 1]!.v;
}

export function kishEffectiveN(weights: number[]): number {
  const sum = weights.reduce((a, w) => a + w, 0);
  const sumSq = weights.reduce((a, w) => a + w * w, 0);
  return sumSq > 0 ? (sum * sum) / sumSq : 0;
}

export function madFilter(
  values: number[],
  weights: number[],
  threshold = 3.5
): { values: number[]; weights: number[]; removed: number } {
  if (values.length < 5) {
    return { values, weights, removed: 0 };
  }

  const center = weightedMedian(values, weights);
  const absDev = values.map((v) => Math.abs(v - center));
  const madRaw = median(absDev);
  const mad = madRaw * 1.4826;

  if (mad <= 0) {
    return { values, weights, removed: 0 };
  }

  const keptV: number[] = [];
  const keptW: number[] = [];
  let removed = 0;

  for (let i = 0; i < values.length; i++) {
    const z = Math.abs(values[i]! - center) / mad;
    if (z <= threshold) {
      keptV.push(values[i]!);
      keptW.push(weights[i]!);
    } else {
      removed++;
    }
  }

  if (keptV.length === 0) {
    return { values, weights, removed: 0 };
  }

  return { values: keptV, weights: keptW, removed };
}

export function compAgeDays(observedAt: Date, asOf: Date): number {
  const ms = asOf.getTime() - observedAt.getTime();
  return Math.max(0, ms / (1000 * 60 * 60 * 24));
}

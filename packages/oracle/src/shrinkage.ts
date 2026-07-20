/** James-Stein style shrinkage toward cohort prior when n is sparse. */

export function shrinkTowardPrior(
  estimate: number,
  prior: number | null | undefined,
  n: number,
  k = 5
): { value: number; applied: boolean } {
  if (prior == null || prior <= 0 || n <= 0) {
    return { value: estimate, applied: false };
  }
  if (n >= k) {
    return { value: estimate, applied: false };
  }

  const w = n / k;
  return {
    value: w * estimate + (1 - w) * prior,
    applied: true,
  };
}

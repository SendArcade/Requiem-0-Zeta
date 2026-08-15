/** Wave 0 starter product ids — shared by status, verify, and maintenance CLIs. */
export const WAVE0_STARTERS = [
  "prod-burst-b-34-starter",
  "prod-burst-b-86-starter",
  "prod-burst-b-97-starter",
  "prod-burst-b-100-starter",
  "prod-burst-b-104-starter",
  "prod-burst-b-110-starter",
  "prod-burst-b-127-starter",
] as const;

export function wave0SealedId(starterId: string): string {
  return starterId.replace("-starter", "-sealed");
}

/** starter_used bands from docs/burst/venue-bands.md (JPY landed). */
export const WAVE0_STARTER_BANDS: Record<
  (typeof WAVE0_STARTERS)[number],
  { min: number; max: number }
> = {
  "prod-burst-b-34-starter": { min: 800, max: 1_500 },
  "prod-burst-b-86-starter": { min: 800, max: 1_450 },
  "prod-burst-b-97-starter": { min: 2_200, max: 5_790 },
  "prod-burst-b-100-starter": { min: 690, max: 5_900 },
  "prod-burst-b-104-starter": { min: 600, max: 1_200 },
  "prod-burst-b-110-starter": { min: 777, max: 1_300 },
  "prod-burst-b-127-starter": { min: 699, max: 6_000 },
};

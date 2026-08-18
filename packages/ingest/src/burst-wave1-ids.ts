import { WAVE0_STARTERS, wave0SealedId } from "./burst-wave0-ids.js";

/** Wave 1 expansion — B-01 pack, boosters, Wave 0 sealed rows. */
export const WAVE1_NEW_PRODUCTS = [
  "prod-burst-b-01-starter",
  "prod-burst-b-01-complete-loose",
  "prod-burst-b-01-sealed",
  "prod-burst-b-102-complete-loose",
  "prod-burst-b-102-sealed",
  "prod-burst-b-168-complete-loose",
  "prod-burst-b-168-sealed",
] as const;

/** Wave 0 starter sealed rows — peel 未開封 comps off starter marks. */
export const WAVE1_SEALED_FROM_WAVE0 = WAVE0_STARTERS.map(
  (id) => wave0SealedId(id)
) as readonly string[];

export const WAVE1_BURST_PRODUCTS = [
  ...WAVE1_NEW_PRODUCTS,
  ...WAVE1_SEALED_FROM_WAVE0,
] as const;

/** B-codes used for sealed rematch filters during Wave 1 ingest. */
export const WAVE1_B_CODES = [
  "B-01",
  "B-102",
  "B-168",
  "B-34",
  "B-86",
  "B-97",
  "B-100",
  "B-104",
  "B-110",
  "B-127",
] as const;

import type { Generation } from "@beyoracle/shared";

const ALL_GENERATIONS: Generation[] = ["plastic", "metal", "burst", "x"];

/**
 * Parse PRODUCT_BACKFILL_GENERATIONS.
 * Unset/empty → burst only (next backfill pass after Wave 0+1 identity recut).
 * `all` / `*` → every generation (full catalog). Do not write venue yen as marks.
 */
export function parseProductBackfillGenerations(
  raw = process.env.PRODUCT_BACKFILL_GENERATIONS
): Generation[] | undefined {
  const v = raw?.trim();
  if (v == null || v === "") return ["burst"];
  if (v === "all" || v === "*") return undefined;
  const gens = v
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is Generation => (ALL_GENERATIONS as string[]).includes(s));
  return gens.length ? gens : ["burst"];
}

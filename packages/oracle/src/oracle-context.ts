import { getPartsByGeneration } from "@beyoracle/catalog";
import type { CompInput, OracleContext } from "./oracle-value.js";
import { computeOracleValue } from "./oracle-value.js";
import { buildCohortIndex, cohortKeyForPart } from "./cohort-index.js";
import type { Generation, PartDTO } from "@beyoracle/shared";
import { resolveCompPriceJpy } from "@beyoracle/shared";

export function cohortCompsMap(
  byPart: Map<string, CompInput[]> | Record<string, CompInput[]>
): Map<string, CompInput[]> {
  if (byPart instanceof Map) return byPart;
  return new Map(Object.entries(byPart));
}

/** Build shrinkage prior + cohort index from sibling parts in the same bucket. */
export function buildOracleContext(
  part: PartDTO,
  compsByPartId: Map<string, CompInput[]>
): OracleContext {
  const allParts = getPartsByGeneration(part.generation as Generation);
  const key = cohortKeyForPart(part.generation, part.partType);
  const siblings = allParts.filter(
     (p: PartDTO) =>
      p.id !== part.id &&
      p.generation === part.generation &&
      p.partType === part.partType
  );

  const siblingMarks: number[] = [];
  for (const sib of siblings) {
    const sibComps = compsByPartId.get(sib.id) ?? [];
    const snap = computeOracleValue(sib.id, sibComps, { minComps: 1, engine: "v1" });
    if (snap) siblingMarks.push(snap.value);
  }

  const cohortPrior =
    siblingMarks.length > 0
      ? siblingMarks.reduce((a, b) => a + b, 0) / siblingMarks.length
      : null;

  const cohortComps: CompInput[] = [];
  for (const p of allParts) {
    if (p.partType !== part.partType) continue;
    const comps = compsByPartId.get(p.id);
    if (comps) cohortComps.push(...comps);
  }

  const indexSales = cohortComps.map((c, i) => ({
    partId: `cohort-${i}`,
    priceJpy: resolveCompPriceJpy(c),
    observedAt: c.observedAt,
    cohortKey: key,
  }));

  const cohortIndex = buildCohortIndex(indexSales, key);

  return { cohortPrior, cohortIndex };
}

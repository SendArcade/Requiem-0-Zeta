import type { ListingShape } from "@beyoracle/shared";
import { classifyListingShape } from "@beyoracle/shared";
import type { MatcherContext } from "./matcher.js";
import { matchTitle } from "./matcher.js";

export interface EvalCase {
  title: string;
  expectedPartId: string | null;
  expectedShape: ListingShape;
  source?: string;
  note?: string;
}

export interface EvalReport {
  total: number;
  shapeAccuracy: number;
  matchAccuracy: number;
  shapeCorrect: number;
  matchCorrect: number;
  failures: Array<{
    title: string;
    expectedPartId: string | null;
    gotPartId: string | null;
    expectedShape: ListingShape;
    gotShape: ListingShape;
  }>;
}

export function runEval(cases: EvalCase[], ctx: MatcherContext): EvalReport {
  let shapeCorrect = 0;
  let matchCorrect = 0;
  const failures: EvalReport["failures"] = [];

  for (const c of cases) {
    const gotShape = classifyListingShape(c.title);
    const match =
      c.expectedShape === "single_part" ? matchTitle(c.title, ctx) : null;
    const gotPartId = match?.partId ?? null;

    const shapeOk = gotShape === c.expectedShape;
    const matchOk =
      c.expectedShape !== "single_part"
        ? gotPartId === null
        : gotPartId === c.expectedPartId;

    if (shapeOk) shapeCorrect++;
    if (shapeOk && matchOk) matchCorrect++;

    if (!shapeOk || !matchOk) {
      failures.push({
        title: c.title,
        expectedPartId: c.expectedPartId,
        gotPartId,
        expectedShape: c.expectedShape,
        gotShape,
      });
    }
  }

  const total = cases.length;
  return {
    total,
    shapeCorrect,
    matchCorrect,
    shapeAccuracy: total ? shapeCorrect / total : 0,
    matchAccuracy: total ? matchCorrect / total : 0,
    failures,
  };
}

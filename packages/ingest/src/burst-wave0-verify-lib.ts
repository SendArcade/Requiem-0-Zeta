import { getDb, observations, productMatches } from "@beyoracle/db";
import { eq, inArray } from "drizzle-orm";
import { WAVE0_STARTERS, WAVE0_STARTER_BANDS } from "./burst-wave0-ids.js";
import { isStaleOrWrongMatch } from "./purge-bad-comps.js";
import { summarizeWave0Status } from "./burst-wave0-status-lib.js";

export type Wave0VerifyRow = {
  productId: string;
  bCode: string;
  mark: number | null;
  nComps: number;
  usedMatchCount: number;
  staleMatches: number;
  bandOk: boolean | null;
  pass: boolean;
  reasons: string[];
};

export type Wave0VerifyReport = {
  rows: Wave0VerifyRow[];
  passCount: number;
  total: number;
};

export async function verifyWave0(): Promise<Wave0VerifyReport> {
  const summary = await summarizeWave0Status();
  const db = getDb();

  const matchRows = await db
    .select({
      productId: productMatches.productId,
      title: observations.title,
      confidence: productMatches.confidence,
    })
    .from(productMatches)
    .innerJoin(observations, eq(productMatches.observationId, observations.id))
    .where(inArray(productMatches.productId, [...WAVE0_STARTERS]));

  const staleByProduct = new Map<string, number>();
  for (const row of matchRows) {
    if (isStaleOrWrongMatch(row.title, "product", row.productId, row.confidence)) {
      staleByProduct.set(row.productId, (staleByProduct.get(row.productId) ?? 0) + 1);
    }
  }

  const rows: Wave0VerifyRow[] = summary.starters.map((s) => {
    const band = WAVE0_STARTER_BANDS[s.productId as keyof typeof WAVE0_STARTER_BANDS];
    const reasons: string[] = [];
    const stale = staleByProduct.get(s.productId) ?? 0;

    if (s.nComps < 3) reasons.push(`n=${s.nComps}<3`);
    if (s.mark == null) reasons.push("no mark");
    if (stale > 0) reasons.push(`${stale} stale/wrong-TT matches`);

    let bandOk: boolean | null = null;
    if (s.mark != null && band) {
      bandOk = s.mark >= band.min && s.mark <= band.max;
      if (!bandOk) {
        reasons.push(`mark ¥${s.mark} outside band ¥${band.min}–¥${band.max}`);
      }
    }

    const pass =
      s.nComps >= 3 &&
      s.mark != null &&
      stale === 0 &&
      bandOk === true;

    return {
      productId: s.productId,
      bCode: s.bCode,
      mark: s.mark,
      nComps: s.nComps,
      usedMatchCount: s.usedMatchCount,
      staleMatches: stale,
      bandOk,
      pass,
      reasons,
    };
  });

  // Defense in depth — one row per Wave 0 starter SKU (7 total).
  const deduped = new Map<string, Wave0VerifyRow>();
  for (const row of rows) {
    deduped.set(row.productId, row);
  }
  const uniqueRows = WAVE0_STARTERS.map((id) => deduped.get(id)).filter(
    (r): r is Wave0VerifyRow => r != null
  );

  const passCount = uniqueRows.filter((r) => r.pass).length;

  return { rows: uniqueRows, passCount, total: uniqueRows.length };
}

export function formatWave0Verify(report: Wave0VerifyReport): string {
  const lines = [
    `[wave0:verify] ${report.passCount}/${report.total} PASS (Diablo bar — starter rows only)`,
  ];
  for (const r of report.rows) {
    lines.push(
      `  ${r.bCode} ${r.pass ? "PASS" : "FAIL"} mark=${r.mark ?? "null"} n=${r.nComps} stale=${r.staleMatches}${r.reasons.length ? ` — ${r.reasons.join("; ")}` : ""}`
    );
  }
  return lines.join("\n");
}

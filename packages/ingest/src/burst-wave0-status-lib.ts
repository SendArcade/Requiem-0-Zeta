import { getDb } from "@beyoracle/db";
import { sql } from "drizzle-orm";
import { allSourcesMask } from "@beyoracle/shared";
import { WAVE0_STARTERS, wave0SealedId } from "./burst-wave0-ids.js";

export type Wave0RowStatus = {
  productId: string;
  bCode: string;
  nameEn: string;
  mark: number | null;
  nComps: number;
  matchCount: number;
  usedMatchCount: number;
};

export type Wave0StatusSummary = {
  starters: Wave0RowStatus[];
  sealed: Array<{
    productId: string;
    mark: number | null;
    nComps: number;
    matchCount: number;
  }>;
  burstProductMatchesTotal: number;
};

export async function summarizeWave0Status(): Promise<Wave0StatusSummary> {
  const db = getDb();
  const ids = WAVE0_STARTERS.map((id) => `'${id}'`).join(",");
  const sealedIds = WAVE0_STARTERS.map((id) => `'${wave0SealedId(id)}'`).join(",");

  const publishedMask = allSourcesMask();

  const starters = (await db.execute(sql.raw(`
    select p.id, p.product_codes, p.name_en,
      s.value, s.n_comps,
      (select count(*)::int from product_matches pm where pm.product_id = p.id) as match_count,
      (select count(*)::int from product_matches pm
        join observations o on o.id = pm.observation_id
        where pm.product_id = p.id and o.condition = 'used') as used_match_count
    from products p
    left join product_oracle_snapshots s
      on s.product_id = p.id and s.sources_mask = ${publishedMask}
    where p.id in (${ids})
    order by p.id
  `))) as Record<string, unknown>[];

  const sealed = (await db.execute(sql.raw(`
    select p.id, s.value, s.n_comps,
      (select count(*)::int from product_matches pm where pm.product_id = p.id) as match_count
    from products p
    left join product_oracle_snapshots s
      on s.product_id = p.id and s.sources_mask = ${publishedMask}
    where p.id in (${sealedIds})
    order by p.id
  `))) as Record<string, unknown>[];

  const pm = await db.execute(sql`
    select count(*)::int as n from product_matches pm
    join products p on p.id = pm.product_id where p.generation = 'burst'
  `);

  return {
    starters: starters.map((r) => ({
      productId: r.id as string,
      bCode: ((r.product_codes as string[] | null)?.[0] ?? "?") as string,
      nameEn: (r.name_en as string) ?? "",
      mark: r.value == null ? null : Number(r.value),
      nComps: Number(r.n_comps ?? 0),
      matchCount: Number(r.match_count ?? 0),
      usedMatchCount: Number(r.used_match_count ?? 0),
    })),
    sealed: sealed.map((r) => ({
      productId: r.id as string,
      mark: r.value == null ? null : Number(r.value),
      nComps: Number(r.n_comps ?? 0),
      matchCount: Number(r.match_count ?? 0),
    })),
    burstProductMatchesTotal: Number((pm[0] as { n: number }).n),
  };
}

export function formatWave0Status(summary: Wave0StatusSummary): string {
  const lines: string[] = ["[wave0] starter rows:"];
  for (const r of summary.starters) {
    lines.push(
      `  ${r.bCode} mark=${r.mark ?? "null"} n=${r.nComps} matches=${r.matchCount} usedMatches=${r.usedMatchCount} | ${r.nameEn.slice(0, 32)}`
    );
  }
  lines.push("[wave0] sealed rows:");
  for (const r of summary.sealed) {
    lines.push(`  ${r.productId} mark=${r.mark ?? "null"} n=${r.nComps} matches=${r.matchCount}`);
  }
  lines.push(`[wave0] burst product_matches total: ${summary.burstProductMatchesTotal}`);
  return lines.join("\n");
}

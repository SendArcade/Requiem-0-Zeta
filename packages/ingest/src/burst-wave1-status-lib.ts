import { getDb } from "@beyoracle/db";
import { sql } from "drizzle-orm";
import { allSourcesMask } from "@beyoracle/shared";
import { WAVE1_BURST_PRODUCTS } from "./burst-wave1-ids.js";

export type Wave1ProductRow = {
  productId: string;
  bCode: string;
  nameEn: string;
  skuType: string;
  mark: number | null;
  nComps: number;
  confidence: string;
  matchCount: number;
};

export type Wave1StatusSummary = {
  products: Wave1ProductRow[];
  burstProductMatchesTotal: number;
  markedCount: number;
};

export async function summarizeWave1Status(): Promise<Wave1StatusSummary> {
  const db = getDb();
  const ids = WAVE1_BURST_PRODUCTS.map((id) => `'${id}'`).join(",");
  const publishedMask = allSourcesMask();

  const rows = (await db.execute(sql.raw(`
    select p.id, p.product_codes, p.name_en, p.sku_type,
      s.value, s.n_comps, s.confidence,
      (select count(*)::int from product_matches pm where pm.product_id = p.id) as match_count
    from products p
    left join product_oracle_snapshots s
      on s.product_id = p.id and s.sources_mask = ${publishedMask}
    where p.id in (${ids})
    order by p.id
  `))) as Record<string, unknown>[];

  const pm = await db.execute(sql`
    select count(*)::int as n from product_matches pm
    join products p on p.id = pm.product_id where p.generation = 'burst'
  `);

  const products: Wave1ProductRow[] = rows.map((r) => ({
    productId: r.id as string,
    bCode: ((r.product_codes as string[] | null)?.[0] ?? "?") as string,
    nameEn: (r.name_en as string) ?? "",
    skuType: (r.sku_type as string) ?? "",
    mark: r.value == null ? null : Number(r.value),
    nComps: Number(r.n_comps ?? 0),
    confidence: (r.confidence as string) ?? "low",
    matchCount: Number(r.match_count ?? 0),
  }));

  return {
    products,
    burstProductMatchesTotal: Number((pm[0] as { n: number }).n),
    markedCount: products.filter((p) => p.mark != null && p.nComps >= 3).length,
  };
}

export function formatWave1Status(summary: Wave1StatusSummary): string {
  const lines: string[] = ["[wave1] expansion rows:"];
  for (const p of summary.products) {
    const mark = p.mark != null ? `¥${Math.round(p.mark).toLocaleString("ja-JP")}` : "null";
    lines.push(
      `  ${p.bCode} ${p.skuType}: mark=${mark} n=${p.nComps} matches=${p.matchCount} | ${p.nameEn.slice(0, 36)}`
    );
  }
  lines.push(
    `[wave1] marked (n≥3): ${summary.markedCount}/${summary.products.length}`
  );
  lines.push(`[wave1] burst product_matches total: ${summary.burstProductMatchesTotal}`);
  return lines.join("\n");
}

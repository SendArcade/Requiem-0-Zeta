/** Wave 0 starter + sealed mark status on Railway. */
import { closeDb, getDb } from "@beyoracle/db";
import { sql } from "drizzle-orm";

const WAVE0_STARTERS = [
  "prod-burst-b-34-starter",
  "prod-burst-b-86-starter",
  "prod-burst-b-97-starter",
  "prod-burst-b-100-starter",
  "prod-burst-b-104-starter",
  "prod-burst-b-110-starter",
  "prod-burst-b-127-starter",
];

async function main() {
  const db = getDb();
  const ids = WAVE0_STARTERS.map((id) => `'${id}'`).join(",");
  const sealedIds = WAVE0_STARTERS.map((id) => `'${id.replace("-starter", "-sealed")}'`).join(",");

  const starters = await db.execute(sql.raw(`
    select p.id, p.product_codes, p.name_en,
      s.value, s.n_comps,
      (select count(*)::int from product_matches pm where pm.product_id = p.id) as match_count,
      (select count(*)::int from product_matches pm
        join observations o on o.id = pm.observation_id
        where pm.product_id = p.id and o.condition = 'used') as used_match_count
    from products p
    left join product_oracle_snapshots s on s.product_id = p.id
    where p.id in (${ids})
    order by p.id
  `));

  const sealed = await db.execute(sql.raw(`
    select p.id, s.value, s.n_comps,
      (select count(*)::int from product_matches pm where pm.product_id = p.id) as match_count
    from products p
    left join product_oracle_snapshots s on s.product_id = p.id
    where p.id in (${sealedIds})
    order by p.id
  `));

  console.log("[wave0] starter rows:");
  for (const r of starters as Record<string, unknown>[]) {
    const code = (r.product_codes as string[] | null)?.[0] ?? "?";
    console.log(
      `  ${code} mark=${r.value ?? "null"} n=${r.n_comps ?? 0} matches=${r.match_count} usedMatches=${r.used_match_count} | ${(r.name_en as string)?.slice(0, 32)}`
    );
  }

  console.log("[wave0] sealed rows:");
  for (const r of sealed as Record<string, unknown>[]) {
    console.log(
      `  ${r.id} mark=${r.value ?? "null"} n=${r.n_comps ?? 0} matches=${r.match_count}`
    );
  }

  const pm = await db.execute(sql`
    select count(*)::int as n from product_matches pm
    join products p on p.id = pm.product_id where p.generation = 'burst'
  `);
  console.log(`[wave0] burst product_matches total: ${(pm[0] as { n: number }).n}`);
  await closeDb();
}

main().catch(async (e) => {
  console.error(e);
  await closeDb();
  process.exit(1);
});

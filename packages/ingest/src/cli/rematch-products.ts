/**
 * Re-run product matcher on existing sold observations; persist auto-accept product matches.
 * Used after matcher improvements (e.g. unhyphenated BB28) without re-fetching marketplaces.
 */
import { randomUUID } from "node:crypto";
import { closeDb, getDb, observations, productMatches } from "@beyoracle/db";
import { loadProductMatcherContext } from "@beyoracle/catalog";
import { matchToProduct } from "@beyoracle/oracle";
import { eq, sql } from "drizzle-orm";
import { shouldPersistMatch } from "../match-confidence-routing.js";
import { recomputeProductOracleSnapshotsBatch } from "../persist.js";

async function main() {
  const db = getDb();
  const ctx = loadProductMatcherContext();
  const rows = await db
    .select({
      id: observations.id,
      title: observations.title,
      rawJson: observations.rawJson,
      status: observations.status,
    })
    .from(observations)
    .where(eq(observations.status, "sold"));

  let productMatched = 0;
  let skippedFixture = 0;
  let skippedLowConf = 0;
  const touched = new Set<string>();

  for (const row of rows) {
    const raw = row.rawJson as { fixture?: boolean } | null;
    if (raw?.fixture === true) {
      skippedFixture++;
      continue;
    }
    const m = matchToProduct(row.title, ctx);
    if (!m || !shouldPersistMatch(m.confidence)) {
      if (m) skippedLowConf++;
      continue;
    }
    // Upsert-ish: delete prior product match for this obs then insert
    await db.delete(productMatches).where(eq(productMatches.observationId, row.id));
    await db.insert(productMatches).values({
      id: randomUUID(),
      observationId: row.id,
      productId: m.productId,
      confidence: m.confidence,
      method: m.method,
    });
    touched.add(m.productId);
    productMatched++;
  }

  console.log(
    JSON.stringify({
      soldObs: rows.length,
      skippedFixture,
      productMatched,
      skippedLowConf,
      productsTouched: touched.size,
    })
  );

  if (touched.size > 0) {
    await recomputeProductOracleSnapshotsBatch(touched);
    console.log(`recomputed ${touched.size} product snapshots`);
  }
  await closeDb();
}

main().catch(async (e) => {
  console.error(e);
  await closeDb();
  process.exit(1);
});

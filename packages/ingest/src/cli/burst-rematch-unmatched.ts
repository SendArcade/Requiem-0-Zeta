/**
 * Re-match sold burst observations that have no product_match row (e.g. after purge
 * removed sealed-on-starter links). Uses current matcher + comp-eligibility gates.
 *
 * Default: sealed-title rows only (post purge:bad-comps). Set REMATCH_ALL=1 for broader pass.
 *
 *   pnpm --filter @beyoracle/ingest burst:rematch-unmatched
 *   REMATCH_DRY_RUN=1 pnpm --filter @beyoracle/ingest burst:rematch-unmatched
 */
import { randomUUID } from "node:crypto";
import { getProductById } from "@beyoracle/catalog";
import { closeDb, getDb, observations, productMatches } from "@beyoracle/db";
import {
  isIngestEligible,
  isLiveMarketplaceComp,
  isProductCompEligible,
  looksLikeBeybladeListing,
} from "@beyoracle/shared";
import { and, eq, isNull, or, sql } from "drizzle-orm";
import { resolveIngestMatch } from "../match-ingest.js";
import { shouldPersistMatch } from "../match-confidence-routing.js";
import { recomputeProductOracleSnapshotsBatch } from "../persist.js";

const SEALED_TITLE = /未開封|新品未開封|sealed|nib|new in box/i;

/** Wave 0 majors — default sealed rematch scope after purge:bad-comps. */
const WAVE0_B_CODE_SQL = sql`${observations.title} ~* 'B-01|B-34|B-86|B-97|B-100|B-104|B-110|B-122|B-127'`;

async function main() {
  const dryRun = process.env.REMATCH_DRY_RUN === "1";
  const allBurstish = process.env.REMATCH_ALL === "1";
  const wave0Only = process.env.REMATCH_WAVE0 !== "0";
  const db = getDb();

  const burstSealedFilter = and(
    WAVE0_B_CODE_SQL,
    sql`${observations.title} ~* '未開封|新品未開封|sealed|nib|new in box'`,
    sql`${observations.title} ~* 'ベイ|バースト|beyblade|takara|タカラ|スターター|starter|ブースター|booster'`
  );

  const broadSealedFilter = and(
    sql`${observations.title} ~* 'B-[0-9]{2,3}'`,
    sql`${observations.title} ~* '未開封|新品未開封|sealed|nib|new in box'`,
    sql`${observations.title} ~* 'ベイ|バースト|beyblade|takara|タカラ|スターター|starter|ブースター|booster'`
  );

  const rows = await db
    .select({
      id: observations.id,
      title: observations.title,
      rawJson: observations.rawJson,
      status: observations.status,
    })
    .from(observations)
    .leftJoin(productMatches, eq(productMatches.observationId, observations.id))
    .where(
      and(
        eq(observations.status, "sold"),
        isNull(productMatches.id),
        allBurstish
          ? or(
              sql`${observations.title} ~* 'B-[0-9]{2,3}'`,
              sql`${observations.title} ~* 'ベイ|バースト|beyblade|takara|タカラ'`
            )
          : wave0Only
            ? burstSealedFilter
            : broadSealedFilter
      )
    );

  console.log(
    `[burst:rematch-unmatched] candidate rows: ${rows.length}${
      allBurstish ? " (all burstish)" : wave0Only ? " (Wave0 sealed)" : " (burst sealed)"
    }`
  );

  let scanned = 0;
  let skippedGate = 0;
  let skippedNonBurst = 0;
  let skippedLowConf = 0;
  let matched = 0;
  const touched = new Set<string>();
  const samples: string[] = [];

  for (const row of rows) {
    scanned++;
    if (scanned % 10 === 0) {
      console.log(`[burst:rematch-unmatched] progress ${scanned}/${rows.length}…`);
    }
    const title = row.title;
    if (!isLiveMarketplaceComp(row.rawJson as Record<string, unknown> | null)) continue;
    if (!looksLikeBeybladeListing(title)) {
      skippedGate++;
      continue;
    }
    if (!isIngestEligible(title) || !isProductCompEligible(title)) {
      skippedGate++;
      continue;
    }

    const fresh = resolveIngestMatch(title);
    if (!fresh || fresh.kind !== "product") continue;
    if (!shouldPersistMatch(fresh.match.confidence)) {
      skippedLowConf++;
      continue;
    }

    const product = getProductById(fresh.match.productId);
    if (!product || product.generation !== "burst") {
      skippedNonBurst++;
      continue;
    }

    if (samples.length < 12) {
      const sealed = SEALED_TITLE.test(title) ? "sealed" : "used";
      samples.push(`[${sealed}] ${product.skuType} ${product.id} ← ${title.slice(0, 70)}`);
    }

    if (dryRun) {
      matched++;
      touched.add(fresh.match.productId);
      continue;
    }

    await db.insert(productMatches).values({
      id: randomUUID(),
      observationId: row.id,
      productId: fresh.match.productId,
      confidence: fresh.match.confidence,
      method: fresh.match.method,
    });
    matched++;
    touched.add(fresh.match.productId);
  }

  const mode = dryRun ? "dry-run" : "apply";
  console.log(
    `[burst:rematch-unmatched:${mode}] scanned=${scanned} matched=${matched} gateSkip=${skippedGate} nonBurst=${skippedNonBurst} lowConf=${skippedLowConf}`
  );
  for (const s of samples) console.log(`  - ${s}`);

  if (!dryRun && touched.size > 0) {
    await recomputeProductOracleSnapshotsBatch(touched);
    console.log(`[burst:rematch-unmatched] recomputed ${touched.size} products`);
  }

  await closeDb();
}

main().catch(async (err) => {
  console.error("[burst:rematch-unmatched] failed:", (err as Error).message);
  await closeDb();
  process.exit(1);
});

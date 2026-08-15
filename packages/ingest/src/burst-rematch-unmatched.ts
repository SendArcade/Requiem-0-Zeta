import { randomUUID } from "node:crypto";
import { getProductById } from "@beyoracle/catalog";
import { getDb, observations, productMatches } from "@beyoracle/db";
import {
  isIngestEligible,
  isLiveMarketplaceComp,
  isProductCompEligible,
  looksLikeBeybladeListing,
} from "@beyoracle/shared";
import { and, eq, isNull, or, sql } from "drizzle-orm";
import { resolveIngestMatch } from "./match-ingest.js";
import { shouldPersistMatch } from "./match-confidence-routing.js";
import { recomputeProductOracleSnapshotsBatch } from "./persist.js";
import { WAVE0_FAILING_STARTERS } from "./burst-wave0-targets.js";

const SEALED_TITLE = /未開封|新品未開封|sealed|nib|new in box/i;

const WAVE0_B_CODE_SQL = sql`${observations.title} ~* 'B-01|B-34|B-86|B-97|B-100|B-104|B-110|B-122|B-127'`;

export type BurstRematchResult = {
  candidates: number;
  scanned: number;
  matched: number;
  gateSkip: number;
  nonBurst: number;
  lowConf: number;
  recomputedProducts: number;
  samples: string[];
};

const WAVE0_GAP_B_CODE_SQL = sql`${observations.title} ~* 'B-97|B-104|B-110'`;

const LOOSE_STARTER_TITLE = sql`${observations.title} ~* 'スターター|starter|ランチャー|launcher|完成品|complete|中古|開封'`;
const NOT_SEALED_TITLE = sql`NOT (${observations.title} ~* '未開封|新品未開封|sealed|nib|new in box')`;

/** Rematch sold loose/open Wave 0 starter listings (B-110 / B-97 / B-104 gap fill). */
export async function runBurstRematchLooseWave0(opts: {
  dryRun?: boolean;
} = {}): Promise<BurstRematchResult> {
  const dryRun = opts.dryRun ?? false;
  const db = getDb();

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
        WAVE0_GAP_B_CODE_SQL,
        NOT_SEALED_TITLE,
        LOOSE_STARTER_TITLE,
        sql`${observations.title} ~* 'ベイ|バースト|beyblade|takara|タカラ|ロンギヌス|ヴァルキリー'`
      )
    );

  return processRematchRows(rows, { dryRun, restrictProductIds: new Set(WAVE0_FAILING_STARTERS) });
}

async function processRematchRows(
  rows: Array<{ id: string; title: string; rawJson: unknown; status: string }>,
  opts: { dryRun: boolean; restrictProductIds?: Set<string> }
): Promise<BurstRematchResult> {
  let scanned = 0;
  let skippedGate = 0;
  let skippedNonBurst = 0;
  let skippedLowConf = 0;
  let matched = 0;
  const touched = new Set<string>();
  const samples: string[] = [];
  const db = getDb();

  for (const row of rows) {
    scanned++;
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

    if (opts.restrictProductIds && !opts.restrictProductIds.has(fresh.match.productId)) {
      skippedNonBurst++;
      continue;
    }

    if (samples.length < 12) {
      const sealed = SEALED_TITLE.test(title) ? "sealed" : "used";
      samples.push(`[${sealed}] ${product.skuType} ${product.id} ← ${title.slice(0, 70)}`);
    }

    if (opts.dryRun) {
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

  let recomputedProducts = 0;
  if (!opts.dryRun && touched.size > 0) {
    await recomputeProductOracleSnapshotsBatch(touched);
    recomputedProducts = touched.size;
  }

  return {
    candidates: rows.length,
    scanned,
    matched,
    gateSkip: skippedGate,
    nonBurst: skippedNonBurst,
    lowConf: skippedLowConf,
    recomputedProducts,
    samples,
  };
}

export async function runBurstRematchUnmatched(opts: {
  dryRun?: boolean;
  allBurstish?: boolean;
  wave0Only?: boolean;
} = {}): Promise<BurstRematchResult> {
  const dryRun = opts.dryRun ?? false;
  const allBurstish = opts.allBurstish ?? false;
  const wave0Only = opts.wave0Only ?? true;
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

  return processRematchRows(rows, { dryRun });
}

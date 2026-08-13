import { resolveIngestMatch } from "./match-ingest.js";
import { getSources } from "./pipeline.js";
import { persistBundleObservations, persistIngestBatch } from "./persist.js";
import { startIngestRun } from "./runs.js";
import type { SourceId } from "@beyoracle/shared";
import {
  classifyListingShape,
  isIngestEligible,
  looksLikeBeybladeListing,
} from "@beyoracle/shared";
import type { PricingSource, SearchOpts } from "./types.js";

export interface SourceIngestReport {
  sourceId: SourceId;
  queriesRun: number;
  listingsFetched: number;
  inserted: number;
  updated: number;
  matched: number;
  partsTouched: number;
  productsTouched: number;
  productsTouchedIds: string[];
  errors: string[];
}

const SOURCE_ENV_FLAGS: Record<SourceId, string> = {
  mercari_jp: "MERCARI_API_ENABLED",
  yahoo_auctions_jp: "YAHOO_AUCTIONS_ENABLED",
  shopee_tw: "SHOPEE_API_ENABLED",
  ruten_tw: "RUTEN_API_ENABLED",
  mandarake_jp: "MANDARAKE_API_ENABLED",
  suruga_ya_jp: "SURUGAYA_API_ENABLED",
  ebay_com: "EBAY_SOLD_ENABLED",
};

function sourceLiveEnabled(source: PricingSource): boolean {
  const flag = SOURCE_ENV_FLAGS[source.id];
  return flag ? process.env[flag] === "1" : false;
}

function getSourceById(sourceId: SourceId): PricingSource | undefined {
  return getSources().find((s) => s.id === sourceId);
}

function searchOptsForSource(sourceId: SourceId, limit: number): SearchOpts {
  const liveCorridor =
    (sourceId === "ruten_tw" && process.env.RUTEN_API_ENABLED === "1") ||
    (sourceId === "suruga_ya_jp" && process.env.SURUGAYA_API_ENABLED === "1");
  if (liveCorridor) return { limit };
  return { status: "sold", limit };
}

function shouldPersistMarketListing(observation: {
  source: SourceId;
  status: string;
}): boolean {
  if (observation.status !== "listing") return true;
  if (observation.source === "ruten_tw") {
    return process.env.RUTEN_MARKET_INGEST === "1";
  }
  if (observation.source === "suruga_ya_jp") {
    return process.env.SURUGAYA_MARKET_INGEST === "1";
  }
  return false;
}

/**
 * Ingest one pricing corridor — fetch outside DB, persist in batch.
 * War Machine pattern: one connector job per source, not one mega-job.
 */
export async function runSourceIngest(opts: {
  sourceId: SourceId;
  queries: string[];
  limitPerQuery?: number;
  recordRun?: boolean;
}): Promise<SourceIngestReport> {
  const source = getSourceById(opts.sourceId);
  if (!source) {
    throw new Error(`Unknown source: ${opts.sourceId}`);
  }

  const run =
    opts.recordRun !== false
      ? await startIngestRun({ jobName: "ingest.source", sourceId: opts.sourceId })
      : null;

  const limit = opts.limitPerQuery ?? Number(process.env.INGEST_LIMIT_PER_QUERY ?? 30);
  const report: SourceIngestReport = {
    sourceId: opts.sourceId,
    queriesRun: 0,
    listingsFetched: 0,
    inserted: 0,
    updated: 0,
    matched: 0,
    partsTouched: 0,
    productsTouched: 0,
    productsTouchedIds: [],
    errors: [],
  };

  try {
    const live = sourceLiveEnabled(source);
    const fixtureMode =
      !live && (process.env.INGEST_ALLOW_FIXTURES === "1" || opts.queries.length === 0);

    if (!live && !fixtureMode) {
      report.errors.push(
        `${opts.sourceId} disabled — set ${SOURCE_ENV_FLAGS[opts.sourceId]}=1 or INGEST_ALLOW_FIXTURES=1`
      );
      return report;
    }

    const queries = fixtureMode ? [""] : opts.queries.filter(Boolean);
    const batch: Array<{
      observation: ReturnType<PricingSource["normalize"]>;
      match: ReturnType<typeof resolveIngestMatch>;
    }> = [];
    const bundleObservations: ReturnType<PricingSource["normalize"]>[] = [];

    for (const query of queries) {
      report.queriesRun++;
      try {
        const raw = await source.search(
          query,
          searchOptsForSource(opts.sourceId, limit)
        );
        report.listingsFetched += raw.length;

        for (const r of raw) {
          if (!looksLikeBeybladeListing(r.title)) continue;

          const shape = classifyListingShape(r.title);
          if (shape === "lot") {
            bundleObservations.push(source.normalize(r));
            continue;
          }
          if (!isIngestEligible(r.title)) continue;

          const observation = source.normalize(r);
          if (!shouldPersistMarketListing(observation)) continue;
          const match = resolveIngestMatch(observation.title, { shape });
          batch.push({ observation, match });
        }
      } catch (err) {
        report.errors.push(`${query || "(fixtures)"}: ${(err as Error).message}`);
      }
    }

    try {
      const persist = await persistIngestBatch(batch);
      report.inserted = persist.inserted;
      report.updated = persist.updated;
      report.matched = persist.matched;
      report.partsTouched = persist.partsTouched.size;
      report.productsTouched = persist.productsTouched.size;
      report.productsTouchedIds = [...persist.productsTouched];

      if (bundleObservations.length > 0) {
        const bundles = await persistBundleObservations(bundleObservations);
        report.inserted += bundles.inserted;
        report.updated += bundles.updated;
      }
    } catch (err) {
      report.errors.push(`persist: ${(err as Error).message}`);
    }

    return report;
  } catch (err) {
    report.errors.push((err as Error).message);
    throw err;
  } finally {
    await run?.finish({
      status: report.errors.length ? "failed" : "success",
      stats: report,
      errors: report.errors,
    });
  }
}

export function listEnabledSources(): SourceId[] {
  return getSources()
    .filter((s) => sourceLiveEnabled(s) || process.env.INGEST_ALLOW_FIXTURES === "1")
    .map((s) => s.id);
}

export { sourceLiveEnabled };

/** Optional BACKFILL_SOURCES=mercari_jp,yahoo_auctions_jp — limits live corridors during oracle backfill. */
export function listBackfillSources(): SourceId[] {
  const enabled = listEnabledSources();
  const raw = process.env.BACKFILL_SOURCES?.trim();
  if (!raw) return enabled;
  const allow = new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
  const picked = enabled.filter((id) => allow.has(id));
  if (picked.length === 0) {
    console.warn(
      `[backfill] BACKFILL_SOURCES=${raw} matched no enabled sources — using all enabled`
    );
    return enabled;
  }
  return picked;
}

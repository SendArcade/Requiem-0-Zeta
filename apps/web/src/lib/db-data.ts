import {
  getPartById,
  getPartsByGeneration,
  loadAllFixtures,
  loadParts,
  searchParts,
} from "@beyoracle/catalog";
import { getDb, matches, observations, oracleSnapshots } from "@beyoracle/db";
import {
  buildTimeSeries,
  computeOracleByCondition,
  computeOracleValue,
  recomputeWithSources,
  type CompInput,
} from "@beyoracle/oracle";
import type { Condition, Currency, Generation, SourceId } from "@beyoracle/shared";
import {
  allSourcesMask,
  convertCurrency,
  DEFAULT_ORACLE_CONDITIONS,
  feedsOracleMark,
  isCompEligible,
  looksLikeBeybladeListing,
  maskFromSources,
  resolveEvidenceKind,
  resolvePublishedMinComps,
  SOURCES,
} from "@beyoracle/shared";
import { and, eq, inArray } from "drizzle-orm";
import type { CompRow, AssetData } from "./data-types";
import { filterPublishedRows } from "./published-mark";

let dbProbe: boolean | null = null;

export async function isDbAvailable(): Promise<boolean> {
  if (process.env.DATA_SOURCE === "fixtures") return false;
  if (process.env.DATA_SOURCE === "db") return true;
  if (dbProbe !== null) return dbProbe;

  try {
    const db = getDb();
    const rows = await db.select({ id: observations.id }).from(observations).limit(1);
    dbProbe = rows.length > 0;
  } catch {
    dbProbe = false;
  }
  return dbProbe;
}

async function loadCompsForPart(partId: string): Promise<CompInput[]> {
  const db = getDb();
  const rows = await db
    .select({
      title: observations.title,
      price: observations.price,
      currency: observations.currency,
      source: observations.source,
      observedAt: observations.observedAt,
      status: observations.status,
      condition: observations.condition,
      landedJpy: observations.landedJpy,
      fxRateAtSale: observations.fxRateAtSale,
      rawJson: observations.rawJson,
    })
    .from(matches)
    .innerJoin(observations, eq(matches.observationId, observations.id))
    .where(eq(matches.partId, partId));

  return rows
    .filter((r) => looksLikeBeybladeListing(r.title) && isCompEligible(r.title))
    .map((r) => ({
      price: r.price,
      currency: r.currency as Currency,
      source: r.source as SourceId,
      observedAt: r.observedAt,
      status: r.status as "listing" | "sold",
      condition: r.condition as Condition,
      landedJpy: r.landedJpy,
      fxRateAtSale: r.fxRateAtSale,
      evidenceKind: resolveEvidenceKind(r.source as SourceId, r.rawJson),
    }));
}

async function loadCompRows(
  partId: string,
  sources: SourceId[],
  displayCurrency: Currency,
  conditions?: Condition[]
): Promise<CompRow[]> {
  const db = getDb();
  const condSet = conditions ? new Set(conditions) : null;

  const rows = await db
    .select({
      id: observations.id,
      source: observations.source,
      title: observations.title,
      price: observations.price,
      currency: observations.currency,
      condition: observations.condition,
      observedAt: observations.observedAt,
      url: observations.url,
      status: observations.status,
      rawJson: observations.rawJson,
      matchMethod: matches.method,
      matchConfidence: matches.confidence,
    })
    .from(matches)
    .innerJoin(observations, eq(matches.observationId, observations.id))
    .where(eq(matches.partId, partId))
    .orderBy(observations.observedAt);

  return rows
    .filter((r) => sources.includes(r.source as SourceId))
    .filter((r) => !condSet || condSet.has(r.condition as Condition))
    .filter((r) => looksLikeBeybladeListing(r.title) && isCompEligible(r.title))
    .map((r) => {
      const evidenceKind = resolveEvidenceKind(r.source as SourceId, r.rawJson);
      return {
        id: r.id,
        source: r.source as SourceId,
        title: r.title,
        price: r.price,
        currency: r.currency as Currency,
        displayPrice: convertCurrency(r.price, r.currency as Currency, displayCurrency),
        displayCurrency,
        condition: r.condition,
        observedAt: r.observedAt.toISOString(),
        url: r.url,
        evidenceKind,
        inOracleMark: feedsOracleMark(evidenceKind) && r.status === "sold",
        matchMethod: r.matchMethod as CompRow["matchMethod"],
        matchConfidence: r.matchConfidence,
      };
    })
    .sort((a, b) => b.observedAt.localeCompare(a.observedAt));
}

export async function getAssetDataFromDb(
  partId: string,
  sources: SourceId[] = [...SOURCES],
  displayCurrency: Currency = "JPY",
  conditions: Condition[] = DEFAULT_ORACLE_CONDITIONS
): Promise<AssetData | null> {
  const part = getPartById(partId);
  if (!part) return null;

  const compsInput = await loadCompsForPart(partId);
  const sourcesMask =
    sources.length === SOURCES.length ? allSourcesMask() : maskFromSources(sources);
  const minComps = resolvePublishedMinComps();

  let activeConditions = conditions;
  let oracle =
    sources.length === SOURCES.length
      ? computeOracleValue(partId, compsInput, {
          targetCurrency: displayCurrency,
          sourcesMask: allSourcesMask(),
          conditions,
          minComps,
        })
      : recomputeWithSources(partId, compsInput, sources, {
          targetCurrency: displayCurrency,
          conditions,
          minComps,
        });

  const oracleByCondition = computeOracleByCondition(partId, compsInput, {
    targetCurrency: displayCurrency,
    sourcesMask,
  });

  // Loose/used pool can be below the publish floor while sealed or another
  // condition still has a real mark and sales. Show that pool instead of 404.
  if (!oracle) {
    const fallback = (Object.entries(oracleByCondition) as Array<
      [Condition, (typeof oracleByCondition)[Condition]]
    >)
      .filter((entry): entry is [Condition, NonNullable<(typeof entry)[1]>] => {
        const snap = entry[1];
        return !!snap && snap.value != null && snap.nComps >= 1;
      })
      .sort((a, b) => b[1].nComps - a[1].nComps)[0];
    if (fallback) {
      activeConditions = [fallback[0]];
      oracle = fallback[1];
    }
  }

  const chart = buildTimeSeries(compsInput, {
    sourcesMask,
    targetCurrency: displayCurrency,
    conditions: activeConditions,
  });

  return {
    part,
    oracle,
    oracleByCondition,
    comps: await loadCompRows(partId, sources, displayCurrency, activeConditions),
    chart,
    conditions: activeConditions,
  };
}

export async function browseGenerationFromDb(
  generation: Generation,
  opts?: { publishedOnly?: boolean }
) {
  const publishedOnly = opts?.publishedOnly ?? true;
  const parts = getPartsByGeneration(generation);
  const partIds = parts.map((p) => p.id);

  if (partIds.length === 0) return [];

  const db = getDb();
  const snaps = await db
    .select()
    .from(oracleSnapshots)
    .where(
      and(
        inArray(oracleSnapshots.assetId, partIds),
        eq(oracleSnapshots.sourcesMask, allSourcesMask())
      )
    );

  const snapByPart = new Map(snaps.map((s) => [s.assetId, s]));

  const rows = parts.map((p) => {
    const snap = snapByPart.get(p.id);
    return {
      ...p,
      oracleValue: snap?.value ?? null,
      oracleLow: snap?.low ?? null,
      oracleHigh: snap?.high ?? null,
      oracleCiLow: snap?.ciLow ?? null,
      oracleCiHigh: snap?.ciHigh ?? null,
      nComps: snap?.nComps ?? 0,
      confidence: snap?.confidence ?? "low",
    };
  });
  return filterPublishedRows(rows, publishedOnly);
}

export async function searchCatalogFromDb(q: string) {
  return searchParts(q).map((p) => ({ ...p, oracleValue: null as number | null, nComps: 0 }));
}

/** Enrich part search results with oracle snapshots when DB is warm. */
export async function searchPartsFromDbWithOracle(
  q: string,
  opts?: { publishedOnly?: boolean }
) {
  const publishedOnly = opts?.publishedOnly ?? true;
  const results = searchParts(q);
  if (results.length === 0) return [];

  const db = getDb();
  const ids = results.map((r) => r.id);
  const snaps = await db
    .select()
    .from(oracleSnapshots)
    .where(
      and(
        inArray(oracleSnapshots.assetId, ids),
        eq(oracleSnapshots.sourcesMask, allSourcesMask())
      )
    );

  const snapByPart = new Map(snaps.map((s) => [s.assetId, s]));

  const rows = results.map((p) => {
    const snap = snapByPart.get(p.id);
    return {
      kind: "part" as const,
      id: p.id,
      nameEn: p.nameEn,
      nameJp: p.nameJp,
      generation: p.generation,
      productCodes: p.productCodes,
      partType: p.partType,
      oracleValue: snap?.value ?? null,
      nComps: snap?.nComps ?? 0,
      confidence: snap?.confidence ?? "low",
    };
  });
  return filterPublishedRows(rows, publishedOnly);
}

/** @deprecated Use searchPartsFromDbWithOracle — kept for callers expecting raw part rows. */
export async function searchCatalogFromDbWithOracle(q: string) {
  const rows = await searchPartsFromDbWithOracle(q);
  return rows.map(({ kind: _kind, ...p }) => p);
}

export function getAssetDataFromFixtures(
  partId: string,
  sources: SourceId[] = [...SOURCES],
  displayCurrency: Currency = "JPY",
  conditions: Condition[] = DEFAULT_ORACLE_CONDITIONS
): AssetData | null {
  const part = getPartById(partId);
  if (!part) return null;

  const fixtures = loadAllFixtures().filter((f) => f.partId === partId);
  const compsInput = fixtures.map((f) => ({
    price: f.price,
    currency: f.currency,
    source: f.source,
    observedAt: new Date(f.observedAt),
    status: "sold" as const,
    condition: f.condition,
  }));

  const sourcesMask =
    sources.length === SOURCES.length ? allSourcesMask() : maskFromSources(sources);

  const oracle =
    sources.length === SOURCES.length
      ? computeOracleValue(partId, compsInput, {
          targetCurrency: displayCurrency,
          sourcesMask: allSourcesMask(),
          conditions,
        })
      : recomputeWithSources(partId, compsInput, sources, {
          targetCurrency: displayCurrency,
          conditions,
        });

  const oracleByCondition = computeOracleByCondition(partId, compsInput, {
    targetCurrency: displayCurrency,
    sourcesMask,
  });

  const chart = buildTimeSeries(compsInput, {
    sourcesMask,
    targetCurrency: displayCurrency,
    conditions,
  });

  const condSet = conditions ? new Set(conditions) : null;

  const comps: CompRow[] = fixtures
    .filter((f) => sources.includes(f.source))
    .filter((f) => !condSet || condSet.has(f.condition))
    .map((f) => {
      const evidenceKind = resolveEvidenceKind(f.source);
      return {
        id: `${f.source}:${f.externalId}`,
        source: f.source,
        title: f.title,
        price: f.price,
        currency: f.currency,
        displayPrice: convertCurrency(f.price, f.currency, displayCurrency),
        displayCurrency,
        condition: f.condition,
        observedAt: f.observedAt,
        url: f.url,
        evidenceKind,
        inOracleMark: feedsOracleMark(evidenceKind),
      };
    })
    .sort((a, b) => b.observedAt.localeCompare(a.observedAt));

  return { part, oracle, oracleByCondition, comps, chart, conditions };
}

export function browseGenerationFromFixtures(
  generation: Generation,
  opts?: { publishedOnly?: boolean }
) {
  const publishedOnly = opts?.publishedOnly ?? true;
  const parts = getPartsByGeneration(generation);
  const rows = parts.map((p) => {
    const data = getAssetDataFromFixtures(p.id);
    return {
      ...p,
      oracleValue: data?.oracle?.value ?? null,
      oracleLow: data?.oracle?.low ?? null,
      oracleHigh: data?.oracle?.high ?? null,
      nComps: data?.oracle?.nComps ?? 0,
      confidence: data?.oracle?.confidence ?? "low",
    };
  });
  return filterPublishedRows(rows, publishedOnly);
}

export function searchPartsFromFixtures(q: string, opts?: { publishedOnly?: boolean }) {
  const publishedOnly = opts?.publishedOnly ?? true;
  const rows = searchParts(q).map((p) => {
    const data = getAssetDataFromFixtures(p.id);
    return {
      kind: "part" as const,
      id: p.id,
      nameEn: p.nameEn,
      nameJp: p.nameJp,
      generation: p.generation,
      productCodes: p.productCodes,
      partType: p.partType,
      oracleValue: data?.oracle?.value ?? null,
      nComps: data?.oracle?.nComps ?? 0,
      confidence: data?.oracle?.confidence ?? "low",
    };
  });
  return filterPublishedRows(rows, publishedOnly);
}

/** @deprecated Use searchPartsFromFixtures */
export function searchCatalogFromFixtures(q: string) {
  return searchPartsFromFixtures(q).map(({ kind: _kind, ...p }) => p);
}

export { loadParts };

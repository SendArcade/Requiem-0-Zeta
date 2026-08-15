import type { Condition, Currency, Generation, SourceId } from "@beyoracle/shared";
import {
  getPartById,
  getProductById,
  getProductsByGeneration,
  loadAllFixtures,
  loadProductMatcherContext,
  loadProducts,
  searchProducts,
} from "@beyoracle/catalog";
import {
  getDb,
  observations,
  productMatches,
  productOracleSnapshots,
} from "@beyoracle/db";
import { matchToProduct, computeOracleValue, computeProductOracleValue, resolveProductOracleWindowDays, buildTimeSeries } from "@beyoracle/oracle";
import type { ProductDTO } from "@beyoracle/shared";
import {
  allSourcesMask,
  analyzeProductRecipe,
  convertCurrency,
  computeRetailReference,
  DEFAULT_PUBLISHED_MIN_COMPS,
  isLiveMarketplaceComp,
  productMarkConditions,
  feedsOracleMark,
  isProductCompEligible,
  looksLikeBeybladeListing,
  maskFromSources,
  resolveEvidenceKind,
  SOURCES,
  type ProductRecipeAnalysis,
  type RetailReference,
} from "@beyoracle/shared";
import { and, eq, inArray } from "drizzle-orm";
import type { CompRow } from "./data-types";
import { isDbAvailable } from "./db-data";

export interface BrowseProductRow {
  id: string;
  generation: Generation;
  skuType: ProductDTO["skuType"];
  nameEn: string;
  nameJp: string | null;
  productCodes: string[];
  oracleValue: number | null;
  oracleLow: number | null;
  oracleHigh: number | null;
  nComps: number;
  confidence: string;
}

export interface ProductData {
  product: ProductDTO;
  parts: NonNullable<ReturnType<typeof getPartById>>[];
  recipe: ProductRecipeAnalysis;
  oracle: ReturnType<typeof computeOracleValue>;
  /** US retail shelf reference when sold comps are thin — not Oracle Value. */
  retailReference: RetailReference | null;
  comps: CompRow[];
  chart: Array<{ date: string; price: number }>;
  conditions: Condition[];
}

async function loadProductCompsFromDb(productId: string) {
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
    .from(productMatches)
    .innerJoin(observations, eq(productMatches.observationId, observations.id))
    .where(and(eq(productMatches.productId, productId), eq(observations.isBundle, false)));

  return rows
    // Live marketplace only — never seed fixtures on product pages / marks.
    .filter((r) => isLiveMarketplaceComp(r.rawJson))
    .filter((r) => looksLikeBeybladeListing(r.title) && isProductCompEligible(r.title))
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

async function loadProductCompRows(
  productId: string,
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
      matchMethod: productMatches.method,
      matchConfidence: productMatches.confidence,
    })
    .from(productMatches)
    .innerJoin(observations, eq(productMatches.observationId, observations.id))
    .where(and(eq(productMatches.productId, productId), eq(observations.isBundle, false)))
    .orderBy(observations.observedAt);

  return rows
    .filter((r) => isLiveMarketplaceComp(r.rawJson))
    .filter((r) => sources.includes(r.source as SourceId))
    .filter((r) => !condSet || condSet.has(r.condition as Condition))
    .filter((r) => looksLikeBeybladeListing(r.title) && isProductCompEligible(r.title))
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

function productParts(product: ProductDTO) {
  return product.partIds
    .map((id) => getPartById(id))
    .filter((p): p is NonNullable<typeof p> => p != null);
}

function productRecipe(product: ProductDTO) {
  const parts = productParts(product);
  return analyzeProductRecipe(product, parts);
}

export async function getProductDataFromDb(
  productId: string,
  sources: SourceId[] = [...SOURCES],
  displayCurrency: Currency = "JPY",
  conditions?: Condition[]
): Promise<ProductData | null> {
  const product = getProductById(productId);
  if (!product) return null;

  const markConditions = conditions ?? productMarkConditions(product.skuType);
  const parts = productParts(product);
  const recipe = analyzeProductRecipe(product, parts);
  const compsInput = await loadProductCompsFromDb(productId);
  const sourcesMask =
    sources.length === SOURCES.length ? allSourcesMask() : maskFromSources(sources);

  const windowDays = resolveProductOracleWindowDays(product.generation, compsInput, {
    conditions: markConditions,
    minComps: DEFAULT_PUBLISHED_MIN_COMPS,
    sourcesMask,
  });

  const oracle = recipe.canPublishMark
    ? computeProductOracleValue(product, compsInput, {
        targetCurrency: displayCurrency,
        sourcesMask,
        conditions: markConditions,
        minComps: DEFAULT_PUBLISHED_MIN_COMPS,
      })
    : null;

  const chart = buildTimeSeries(compsInput, {
    sourcesMask,
    targetCurrency: displayCurrency,
    conditions: markConditions,
    windowDays,
  });

  const allCompRows = await loadProductCompRows(
    productId,
    sources,
    displayCurrency,
    markConditions
  );
  const retailReference = computeRetailReference(
    allCompRows.map((c) => ({
      price: c.price,
      currency: c.currency,
      source: c.source,
      status: c.evidenceKind === "active_ask" ? "listing" : "sold",
      evidenceKind: c.evidenceKind,
    })),
    { targetCurrency: "USD" }
  );

  return {
    product,
    parts,
    recipe,
    oracle,
    retailReference,
    comps: allCompRows,
    chart,
    conditions: markConditions,
  };
}

function fixtureCompsForProduct(productId: string) {
  const product = getProductById(productId);
  if (!product) return [];

  const productCtx = loadProductMatcherContext();
  return loadAllFixtures()
    .filter((f) => {
      const m = matchToProduct(f.title, productCtx);
      return m?.productId === productId;
    })
    .map((f) => ({
      price: f.price,
      currency: f.currency,
      source: f.source,
      observedAt: new Date(f.observedAt),
      status: "sold" as const,
      condition: f.condition,
      evidenceKind: resolveEvidenceKind(f.source),
    }));
}

export function getProductDataFromFixtures(
  productId: string,
  sources: SourceId[] = [...SOURCES],
  displayCurrency: Currency = "JPY",
  conditions?: Condition[]
): ProductData | null {
  const product = getProductById(productId);
  if (!product) return null;

  const markConditions = conditions ?? productMarkConditions(product.skuType);
  const parts = productParts(product);
  const recipe = analyzeProductRecipe(product, parts);

  const matchedFixtures = loadAllFixtures().filter((f) => {
    const m = matchToProduct(f.title, loadProductMatcherContext());
    return m?.productId === productId;
  });

  const compsInput = fixtureCompsForProduct(productId);
  const sourcesMask =
    sources.length === SOURCES.length ? allSourcesMask() : maskFromSources(sources);

  const windowDays = resolveProductOracleWindowDays(product.generation, compsInput, {
    conditions: markConditions,
    minComps: DEFAULT_PUBLISHED_MIN_COMPS,
    sourcesMask,
  });

  const oracle = recipe.canPublishMark
    ? computeProductOracleValue(product, compsInput, {
        targetCurrency: displayCurrency,
        sourcesMask: allSourcesMask(),
        conditions: markConditions,
        minComps: DEFAULT_PUBLISHED_MIN_COMPS,
      })
    : null;

  const chart = buildTimeSeries(compsInput, {
    sourcesMask,
    targetCurrency: displayCurrency,
    conditions: markConditions,
    windowDays,
  });

  const condSet = new Set(markConditions);
  const comps: CompRow[] = matchedFixtures
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

  const retailReference = computeRetailReference(
    comps.map((c) => ({
      price: c.price,
      currency: c.currency,
      source: c.source,
      status: c.evidenceKind === "active_ask" ? "listing" : "sold",
      evidenceKind: c.evidenceKind,
    })),
    { targetCurrency: "USD" }
  );

  return {
    product,
    parts,
    recipe,
    oracle,
    retailReference,
    comps,
    chart,
    conditions: markConditions,
  };
}

export async function getProductData(
  productId: string,
  sources: SourceId[] = [...SOURCES],
  displayCurrency: Currency = "JPY",
  conditions?: Condition[]
): Promise<ProductData | null> {
  if (await isDbAvailable()) {
    return getProductDataFromDb(productId, sources, displayCurrency, conditions);
  }
  return getProductDataFromFixtures(productId, sources, displayCurrency, conditions);
}

/** Read persisted product oracle snapshot when DB is warm. */
export async function getProductSnapshotFromDb(productId: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(productOracleSnapshots)
    .where(
      and(
        eq(productOracleSnapshots.productId, productId),
        eq(productOracleSnapshots.sourcesMask, allSourcesMask())
      )
    )
    .limit(1);

  return rows[0] ?? null;
}

export async function browseProductsFromDb(
  generation?: Generation
): Promise<BrowseProductRow[]> {
  const products = generation ? getProductsByGeneration(generation) : loadProducts();
  if (products.length === 0) return [];

  const db = getDb();
  const productIds = products.map((p) => p.id);
  const snaps = await db
    .select()
    .from(productOracleSnapshots)
    .where(
      and(
        inArray(productOracleSnapshots.productId, productIds),
        eq(productOracleSnapshots.sourcesMask, allSourcesMask())
      )
    );

  const snapByProduct = new Map(snaps.map((s) => [s.productId, s]));

  return products.map((p) => {
    const snap = snapByProduct.get(p.id);
    return {
      id: p.id,
      generation: p.generation,
      skuType: p.skuType,
      nameEn: p.nameEn,
      nameJp: p.nameJp,
      productCodes: p.productCodes,
      oracleValue: snap?.value ?? null,
      oracleLow: snap?.low ?? null,
      oracleHigh: snap?.high ?? null,
      nComps: snap?.nComps ?? 0,
      confidence: snap?.confidence ?? "low",
    };
  });
}

export function browseProductsFromFixtures(generation?: Generation): BrowseProductRow[] {
  const products = generation ? getProductsByGeneration(generation) : loadProducts();

  return products.map((p) => {
    const data = getProductDataFromFixtures(p.id);
    return {
      id: p.id,
      generation: p.generation,
      skuType: p.skuType,
      nameEn: p.nameEn,
      nameJp: p.nameJp,
      productCodes: p.productCodes,
      oracleValue: data?.oracle?.value ?? null,
      oracleLow: data?.oracle?.low ?? null,
      oracleHigh: data?.oracle?.high ?? null,
      nComps: data?.oracle?.nComps ?? 0,
      confidence: data?.oracle?.confidence ?? "low",
    };
  });
}

export async function browseProducts(generation?: Generation): Promise<BrowseProductRow[]> {
  if (await isDbAvailable()) {
    return browseProductsFromDb(generation);
  }
  return browseProductsFromFixtures(generation);
}

export async function searchProductsWithOracle(q: string) {
  const results = searchProducts(q);
  if (results.length === 0) return [];

  if (await isDbAvailable()) {
    const db = getDb();
    const ids = results.map((r) => r.id);
    const snaps = await db
      .select()
      .from(productOracleSnapshots)
      .where(
        and(
          inArray(productOracleSnapshots.productId, ids),
          eq(productOracleSnapshots.sourcesMask, allSourcesMask())
        )
      );

    const snapByProduct = new Map(snaps.map((s) => [s.productId, s]));

    return results.map((p) => {
      const snap = snapByProduct.get(p.id);
      return {
        kind: "product" as const,
        id: p.id,
        nameEn: p.nameEn,
        nameJp: p.nameJp,
        generation: p.generation,
        productCodes: p.productCodes,
        skuType: p.skuType,
        oracleValue: snap?.value ?? null,
        nComps: snap?.nComps ?? 0,
        confidence: snap?.confidence ?? "low",
      };
    });
  }

  return results.map((p) => {
    const data = getProductDataFromFixtures(p.id);
    return {
      kind: "product" as const,
      id: p.id,
      nameEn: p.nameEn,
      nameJp: p.nameJp,
      generation: p.generation,
      productCodes: p.productCodes,
      skuType: p.skuType,
      oracleValue: data?.oracle?.value ?? null,
      nComps: data?.oracle?.nComps ?? 0,
      confidence: data?.oracle?.confidence ?? "low",
    };
  });
}

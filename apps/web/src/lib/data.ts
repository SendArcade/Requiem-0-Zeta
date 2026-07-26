import type { Condition, Currency, Generation, SourceId } from "@beyoracle/shared";
import {
  CONDITION_LABELS,
  DEFAULT_ORACLE_CONDITIONS,
  GENERATIONS,
  SOURCE_LABELS,
  SOURCES,
} from "@beyoracle/shared";
import {
  browseGenerationFromDb,
  browseGenerationFromFixtures,
  getAssetDataFromDb,
  getAssetDataFromFixtures,
  isDbAvailable,
  loadParts,
  searchCatalogFromDbWithOracle,
  searchCatalogFromFixtures,
  searchPartsFromDbWithOracle,
  searchPartsFromFixtures,
} from "./db-data";
import { searchProductsWithOracle } from "./product-data";
import type { SearchResultItem } from "./data-types";

export type { AssetData, CompRow, SearchResultItem } from "./data-types.js";

export async function getAssetData(
  partId: string,
  sources: SourceId[] = [...SOURCES],
  displayCurrency: Currency = "JPY",
  conditions: Condition[] = DEFAULT_ORACLE_CONDITIONS
) {
  if (await isDbAvailable()) {
    return getAssetDataFromDb(partId, sources, displayCurrency, conditions);
  }
  return getAssetDataFromFixtures(partId, sources, displayCurrency, conditions);
}

export async function browseGeneration(generation: Generation) {
  if (await isDbAvailable()) {
    return browseGenerationFromDb(generation);
  }
  return browseGenerationFromFixtures(generation);
}

export async function searchCatalog(q: string) {
  if (await isDbAvailable()) {
    return searchCatalogFromDbWithOracle(q);
  }
  return searchCatalogFromFixtures(q);
}

/** Unified parts + whole-SKU product search (ALT-style catalog search). */
export async function searchUnified(q: string): Promise<SearchResultItem[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];

  const dbReady = await isDbAvailable();
  const [products, parts] = await Promise.all([
    searchProductsWithOracle(trimmed),
    dbReady
      ? searchPartsFromDbWithOracle(trimmed)
      : Promise.resolve(searchPartsFromFixtures(trimmed)),
  ]);

  return [...products, ...parts];
}

export {
  CONDITION_LABELS,
  DEFAULT_ORACLE_CONDITIONS,
  GENERATIONS,
  SOURCE_LABELS,
  loadParts,
};

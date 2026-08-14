import { randomUUID } from "node:crypto";
import { aliases, getDb, productParts, products, parts } from "@beyoracle/db";
import type { Generation, ProductDTO } from "@beyoracle/shared";
import { eq } from "drizzle-orm";
import { loadAliases, loadParts, loadProducts } from "./load.js";

export interface SyncCatalogReport {
  partsInserted: number;
  productsInserted: number;
  productsUpdated: number;
  productPartLinksInserted: number;
  aliasesInserted: number;
}

function productFieldsMatch(
  row: {
    nameEn: string;
    nameJp: string | null;
    skuType: ProductDTO["skuType"];
    productCodes: string[];
    attrs: Record<string, unknown>;
  },
  catalog: ProductDTO
): boolean {
  return (
    row.nameEn === catalog.nameEn &&
    (row.nameJp ?? null) === (catalog.nameJp ?? null) &&
    row.skuType === catalog.skuType &&
    JSON.stringify(row.productCodes) === JSON.stringify(catalog.productCodes) &&
    JSON.stringify(row.attrs) === JSON.stringify(catalog.attrs ?? {})
  );
}

/** Upsert catalog products missing from Postgres (safe on live DB — no observation wipe). */
export async function syncCatalogProducts(opts?: {
  generations?: Generation[];
}): Promise<{ inserted: number }> {
  const db = getDb();
  const catalogProducts = loadProducts().filter(
    (p) => !opts?.generations || opts.generations.includes(p.generation)
  );
  if (catalogProducts.length === 0) return { inserted: 0 };

  const existing = await db.select({ id: products.id }).from(products);
  const have = new Set(existing.map((r) => r.id));
  const missing = catalogProducts.filter((p) => !have.has(p.id));
  if (missing.length === 0) return { inserted: 0 };

  await db
    .insert(products)
    .values(
      missing.map((p) => ({
        id: p.id,
        generation: p.generation,
        skuType: p.skuType,
        nameEn: p.nameEn,
        nameJp: p.nameJp,
        productCodes: p.productCodes,
        attrs: p.attrs,
      }))
    )
    .onConflictDoNothing();

  const partLinks = missing.flatMap((p) =>
    p.partIds.map((partId) => ({
      productId: p.id,
      partId,
    }))
  );
  if (partLinks.length > 0) {
    await db.insert(productParts).values(partLinks).onConflictDoNothing();
  }

  return { inserted: missing.length };
}

/** Insert catalog parts (and their aliases) missing from Postgres — no wipe. */
export async function syncCatalogParts(): Promise<{ partsInserted: number; aliasesInserted: number }> {
  const db = getDb();
  const catalogParts = loadParts();
  const existing = await db.select({ id: parts.id }).from(parts);
  const have = new Set(existing.map((r) => r.id));
  const missing = catalogParts.filter((p) => !have.has(p.id));
  if (missing.length === 0) return { partsInserted: 0, aliasesInserted: 0 };

  await db.insert(parts).values(
    missing.map((p) => ({
      id: p.id,
      generation: p.generation,
      partType: p.partType,
      nameEn: p.nameEn,
      nameJp: p.nameJp,
      nameZh: p.nameZh,
      productCodes: p.productCodes,
      attrs: p.attrs,
    }))
  );

  const missingIds = new Set(missing.map((p) => p.id));
  const aliasRows = loadAliases().filter((a) => missingIds.has(a.partId));
  if (aliasRows.length === 0) {
    return { partsInserted: missing.length, aliasesInserted: 0 };
  }

  await db.insert(aliases).values(
    aliasRows.map((a) => ({
      id: randomUUID(),
      partId: a.partId,
      locale: a.locale,
      text: a.text,
      source: a.source ?? "catalog",
    }))
  );

  return { partsInserted: missing.length, aliasesInserted: aliasRows.length };
}

/** Refresh product identity fields from catalog seeds (name, sku_type, codes, attrs). */
export async function syncCatalogProductIdentity(opts?: {
  generations?: Generation[];
}): Promise<{ updated: number }> {
  const db = getDb();
  const catalogProducts = loadProducts().filter(
    (p) => !opts?.generations || opts.generations.includes(p.generation)
  );
  if (catalogProducts.length === 0) return { updated: 0 };

  const existing = await db.select().from(products);
  const byId = new Map(existing.map((r) => [r.id, r]));

  let updated = 0;
  for (const catalog of catalogProducts) {
    const row = byId.get(catalog.id);
    if (!row || productFieldsMatch(row, catalog)) continue;

    await db
      .update(products)
      .set({
        nameEn: catalog.nameEn,
        nameJp: catalog.nameJp,
        skuType: catalog.skuType,
        productCodes: catalog.productCodes,
        attrs: catalog.attrs,
      })
      .where(eq(products.id, catalog.id));
    updated++;
  }

  return { updated };
}

/** Ensure product↔part recipe links exist for catalog products. */
export async function syncCatalogProductParts(opts?: {
  generations?: Generation[];
}): Promise<{ inserted: number }> {
  const db = getDb();
  const catalogProducts = loadProducts().filter(
    (p) => !opts?.generations || opts.generations.includes(p.generation)
  );
  if (catalogProducts.length === 0) return { inserted: 0 };

  const existing = await db
    .select({ productId: productParts.productId, partId: productParts.partId })
    .from(productParts);
  const have = new Set(existing.map((r) => `${r.productId}:${r.partId}`));

  const links = catalogProducts.flatMap((p) =>
    p.partIds
      .filter((partId) => !have.has(`${p.id}:${partId}`))
      .map((partId) => ({ productId: p.id, partId }))
  );
  if (links.length === 0) return { inserted: 0 };

  await db.insert(productParts).values(links).onConflictDoNothing();
  return { inserted: links.length };
}

/**
 * Live-safe catalog sync: missing parts + product identity refresh + recipe links.
 * Does not touch observations, matches, or oracle snapshots.
 */
export async function syncCatalogIdentity(opts?: {
  generations?: Generation[];
}): Promise<SyncCatalogReport> {
  const partsResult = await syncCatalogParts();
  const productsResult = await syncCatalogProducts(opts);
  const identityResult = await syncCatalogProductIdentity(opts);
  const linksResult = await syncCatalogProductParts(opts);

  return {
    partsInserted: partsResult.partsInserted,
    aliasesInserted: partsResult.aliasesInserted,
    productsInserted: productsResult.inserted,
    productsUpdated: identityResult.updated,
    productPartLinksInserted: linksResult.inserted,
  };
}

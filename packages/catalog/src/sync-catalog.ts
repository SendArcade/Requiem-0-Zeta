import { getDb, productParts, products } from "@beyoracle/db";
import { loadProducts } from "./load.js";

/** Upsert catalog products missing from Postgres (safe on live DB — no observation wipe). */
export async function syncCatalogProducts(): Promise<{ inserted: number }> {
  const db = getDb();
  const catalogProducts = loadProducts();
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

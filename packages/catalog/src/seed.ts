import { randomUUID } from "node:crypto";
import {
  aliases,
  getDb,
  closeDb,
  matches,
  observations,
  oracleSnapshots,
  parts,
  productMatches,
  productOracleSnapshots,
  products,
  productParts,
} from "@beyoracle/db";
import {
  loadAliases,
  loadAllFixtures,
  loadMatcherContext,
  loadParts,
  loadProductMatcherContext,
  loadProducts,
} from "./load.js";
import {
  computeOracleValue,
  matchObservation,
  matchToProduct,
} from "@beyoracle/oracle";
import { allSourcesMask } from "@beyoracle/shared";

async function seed() {
  const db = getDb();

  console.log("Seeding catalog...");
  await db.delete(productOracleSnapshots);
  await db.delete(productMatches);
  await db.delete(oracleSnapshots);
  await db.delete(matches);
  await db.delete(observations);
  await db.delete(productParts);
  await db.delete(products);
  await db.delete(aliases);
  await db.delete(parts);

  const partRows = loadParts();
  await db.insert(parts).values(
    partRows.map((p) => ({
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

  const aliasRows = loadAliases();
  await db.insert(aliases).values(
    aliasRows.map((a) => ({
      id: randomUUID(),
      partId: a.partId,
      locale: a.locale,
      text: a.text,
      source: a.source,
    }))
  );

  const productRows = loadProducts();
  await db.insert(products).values(
    productRows.map((p) => ({
      id: p.id,
      generation: p.generation,
      skuType: p.skuType,
      nameEn: p.nameEn,
      nameJp: p.nameJp,
      productCodes: p.productCodes,
      attrs: p.attrs,
    }))
  );
  await db.insert(productParts).values(
    productRows.flatMap((p) =>
      p.partIds.map((partId) => ({
        productId: p.id,
        partId,
      }))
    )
  );

  console.log("Seeding fixture observations...");
  const fixtures = loadAllFixtures();
  const partCtx = loadMatcherContext();
  const productCtx = loadProductMatcherContext();
  const touchedParts = new Set<string>();

  for (const f of fixtures) {
    const obsId = `${f.source}:${f.externalId}`;
    await db.insert(observations).values({
      id: obsId,
      source: f.source,
      externalId: f.externalId,
      title: f.title,
      price: f.price,
      currency: f.currency,
      status: f.status,
      condition: f.condition,
      url: f.url,
      observedAt: new Date(f.observedAt),
      rawJson: { fixture: true },
      isBundle: false,
    });

    // Fixtures never create product_matches — published whole-SKU marks are live-only.
    // Complete-bey fixture titles skip part matching too (would poison part comps).
    if (matchToProduct(f.title, productCtx)) {
      continue;
    }

    const partMatch = matchObservation(f.title, partCtx);
    const partId = partMatch?.partId ?? f.partId;
    // Skip dangling part ids from fixtures so product seed is not aborted by FK.
    if (partId && partRows.some((p) => p.id === partId)) {
      await db.insert(matches).values({
        id: randomUUID(),
        observationId: obsId,
        partId,
        confidence: partMatch?.confidence ?? 0.95,
        method: partMatch?.method ?? "product_code",
      });
      touchedParts.add(partId);
    }
  }

  console.log("Computing oracle snapshots...");
  for (const partId of touchedParts) {
    const partFixtures = fixtures.filter((f) => {
      const pm = matchToProduct(f.title, productCtx);
      if (pm) return false;
      const m = matchObservation(f.title, partCtx);
      return (m?.partId ?? f.partId) === partId;
    });
    const comps = partFixtures.map((f) => ({
      price: f.price,
      currency: f.currency as "JPY" | "TWD",
      source: f.source,
      observedAt: new Date(f.observedAt),
      status: "sold" as const,
    }));

    const snap = computeOracleValue(partId, comps, {
      sourcesMask: allSourcesMask(),
      targetCurrency: "JPY",
    });
    if (snap) {
      await db.insert(oracleSnapshots).values({
        id: randomUUID(),
        assetId: partId,
        sourcesMask: snap.sourcesMask,
        value: snap.value,
        low: snap.low,
        high: snap.high,
        nComps: snap.nComps,
        asOf: snap.asOf,
        currency: snap.currency,
        confidence: snap.confidence,
      });
    }
  }

  const count = await db.select().from(parts);
  console.log(
    `Seeded ${count.length} parts, ${productRows.length} products, ${fixtures.length} observations`
  );
}

seed()
  .then(async () => {
    await closeDb();
    console.log("Seed complete");
  })
  .catch(async (err) => {
    console.error("Seed failed (is Postgres running?):", err.message);
    console.log("Web app works with JSON fixtures without DB — run pnpm dev");
    await closeDb();
    process.exit(0);
  });

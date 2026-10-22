import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  normalizeText,
  splitAliasText,
} from "@beyoracle/shared";
import type {
  AliasDTO,
  Condition,
  Currency,
  Generation,
  ObservationStatus,
  PartDTO,
  ProductDTO,
  SourceId,
} from "@beyoracle/shared";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "data");

export interface FixtureObservation {
  externalId: string;
  partId: string;
  title: string;
  price: number;
  currency: Currency;
  status: ObservationStatus;
  condition: Condition;
  url: string;
  observedAt: string;
}

export function loadParts(): PartDTO[] {
  const raw = readFileSync(join(dataDir, "parts.json"), "utf-8");
  return JSON.parse(raw) as PartDTO[];
}

const seedsDir = join(dataDir, "seeds");

function readProductSeedFile(path: string): ProductDTO[] {
  const raw = readFileSync(path, "utf-8").trim();
  if (!raw) return [];
  return JSON.parse(raw) as ProductDTO[];
}

/**
 * Load whole-SKU products from `data/seeds/products-*.json` + legacy `products.json`.
 * Per-gen files override legacy rows on duplicate `id` (workers can land incrementally).
 */
export function loadProducts(): ProductDTO[] {
  const byId = new Map<string, ProductDTO>();

  const legacyPath = join(seedsDir, "products.json");
  if (existsSync(legacyPath)) {
    for (const product of readProductSeedFile(legacyPath)) {
      byId.set(product.id, product);
    }
  }

  const perGenFiles = existsSync(seedsDir)
    ? readdirSync(seedsDir)
        .filter((name) => name.startsWith("products-") && name.endsWith(".json"))
        .sort()
    : [];

  for (const file of perGenFiles) {
    for (const product of readProductSeedFile(join(seedsDir, file))) {
      byId.set(product.id, product);
    }
  }

  return [...byId.values()];
}

/** Product counts by generation after merge (for docs / smoke checks). */
export function countProductsByGeneration(): Record<Generation, number> {
  const counts: Record<Generation, number> = {
    plastic: 0,
    metal: 0,
    burst: 0,
    x: 0,
  };
  for (const product of loadProducts()) {
    counts[product.generation] += 1;
  }
  return counts;
}

export function loadAliases(): AliasDTO[] {
  const raw = readFileSync(join(dataDir, "aliases.json"), "utf-8");
  return JSON.parse(raw) as AliasDTO[];
}

const FIXTURE_FILES = {
  mercari_jp: "fixtures/mercari-jp.json",
  shopee_tw: "fixtures/shopee-tw.json",
  yahoo_auctions_jp: "fixtures/yahoo-auctions-jp.json",
  ebay_com: "fixtures/ebay-com.json",
  walmart_us: "fixtures/walmart-us.json",
  amazon_us: "fixtures/amazon-us.json",
} satisfies Partial<Record<SourceId, string>>;

export function loadFixtureObservations(source: SourceId): FixtureObservation[] {
  const rel = FIXTURE_FILES[source as keyof typeof FIXTURE_FILES];
  if (!rel) return [];
  const raw = readFileSync(join(dataDir, rel), "utf-8");
  return JSON.parse(raw) as FixtureObservation[];
}

export function loadAllFixtures(): Array<FixtureObservation & { source: SourceId }> {
  const bySource = (Object.keys(FIXTURE_FILES) as Array<keyof typeof FIXTURE_FILES>).flatMap(
    (source) => loadFixtureObservations(source).map((o) => ({ ...o, source: source as SourceId }))
  );
  // Whole-SKU product comps (Plastic/Metal/Burst/X) — may share source enums with per-source files.
  const productRows = loadProductFixtures();
  const seen = new Set(bySource.map((o) => `${o.source}:${o.externalId}`));
  for (const row of productRows) {
    const key = `${row.source}:${row.externalId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    bySource.push(row);
  }
  return bySource;
}

export const GENERATION_LABELS: Record<Generation, string> = {
  plastic: "Plastic (Original)",
  metal: "Metal Fight",
  burst: "Burst",
  x: "X",
};

let partIndex: { signature: string; byId: Map<string, PartDTO> } | null = null;

/** Avoid parsing the entire parts catalogue per recipe slot; refresh after local rebuilds. */
export function getPartById(id: string): PartDTO | undefined {
  const stat = statSync(join(dataDir, "parts.json"));
  const signature = `${stat.mtimeMs}:${stat.ctimeMs}:${stat.size}`;
  if (!partIndex || partIndex.signature !== signature) {
    partIndex = { signature, byId: new Map(loadParts().map(part => [part.id, part])) };
  }
  return partIndex.byId.get(id);
}

export function searchParts(query: string): PartDTO[] {
  const q = query.toLowerCase().trim();
  if (!q) return loadParts();
  return loadParts().filter(
    (p) =>
      p.nameEn.toLowerCase().includes(q) ||
      p.nameJp?.toLowerCase().includes(q) ||
      p.nameZh?.toLowerCase().includes(q) ||
      p.productCodes.some((c) => c.toLowerCase().includes(q)) ||
      p.id.toLowerCase().includes(q)
  );
}

export function getPartsByGeneration(generation: Generation): PartDTO[] {
  return loadParts().filter((p) => p.generation === generation);
}

/** Matcher context with atomic aliases derived from parts + alias file. */
export function loadMatcherContext(): {
  parts: PartDTO[];
  aliases: AliasDTO[];
} {
  const parts = loadParts();
  const rawAliases = loadAliases();
  const aliases: AliasDTO[] = [];
  const seen = new Set<string>();

  const add = (
    partId: string,
    locale: AliasDTO["locale"],
    text: string,
    source: string
  ) => {
    const trimmed = text.trim();
    if (!trimmed || normalizeText(trimmed).length < 2) return;
    const key = `${partId}:${normalizeText(trimmed)}`;
    if (seen.has(key)) return;
    seen.add(key);
    aliases.push({ partId, locale, text: trimmed, source });
  };

  for (const alias of rawAliases) {
    for (const atomic of splitAliasText(alias.text)) {
      add(alias.partId, alias.locale, atomic, alias.source);
    }
  }

  for (const part of parts) {
    add(part.id, "en", part.nameEn, "part");
    if (part.nameJp) add(part.id, "ja", part.nameJp, "part");
    if (part.nameZh && part.nameZh !== part.nameEn) {
      add(part.id, "zh", part.nameZh, "part");
    }
    for (const code of part.productCodes) {
      add(part.id, "en", code, "code");
    }
  }

  return { parts, aliases };
}


export function getProductsByGeneration(generation: Generation): ProductDTO[] {
  return loadProducts().filter((p) => p.generation === generation);
}

export function searchProducts(query: string): ProductDTO[] {
  const q = query.toLowerCase().trim();
  if (!q) return loadProducts();
  return loadProducts().filter(
    (p) =>
      p.nameEn.toLowerCase().includes(q) ||
      p.nameJp?.toLowerCase().includes(q) ||
      p.productCodes.some((c) => c.toLowerCase().includes(q)) ||
      p.id.toLowerCase().includes(q)
  );
}

export function getProductById(id: string): ProductDTO | undefined {
  return loadProducts().find((p) => p.id === id);
}

export function loadProductMatcherContext(): {
  products: ProductDTO[];
} {
  return { products: loadProducts() };
}

export function loadProductFixtures(): Array<FixtureObservation & { source: SourceId }> {
  const path = join(dataDir, "fixtures/product-fixtures.json");
  try {
    const raw = readFileSync(path, "utf-8");
    const rows = JSON.parse(raw) as Array<FixtureObservation & { source?: SourceId }>;
    return rows
      .filter((r) => r.source && r.externalId && r.title)
      .map((r) => ({ ...r, source: r.source as SourceId }));
  } catch {
    return [];
  }
}

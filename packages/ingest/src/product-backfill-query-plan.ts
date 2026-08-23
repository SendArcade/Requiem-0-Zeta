import { getPartById, loadProducts } from "@beyoracle/catalog";
import type { Generation, ProductDTO, SkuType } from "@beyoracle/shared";
import { analyzeProductRecipe } from "@beyoracle/shared";

/** High-traffic whole SKUs — queried first when `priorityOnly` or low caps. */
export const PRIORITY_PRODUCT_IDS = [
  "prod-plastic-bb-01s-starter",
  "prod-plastic-bb-01s-complete-loose",
  "prod-metal-bb-28-starter",
  "prod-metal-bb-28-complete-loose",
  "prod-metal-bb-30-starter",
  "prod-metal-bb-70-starter",
  "prod-burst-b-34-starter",
  "prod-burst-b-34-complete-loose",
  "prod-burst-b-97-complete-loose",
  "prod-burst-b-168-starter",
  "prod-burst-b-168-complete-loose",
] as const;

/**
 * Full-catalog product backfill defaults: all generations' publishable complete SKUs.
 * Override with PRODUCT_BACKFILL_GENERATIONS=plastic,metal,burst or opts.generations.
 */
const DEFAULT_GENS: Generation[] = ["plastic", "metal", "burst", "x"];

const GEN_EN_LABEL: Record<Generation, string> = {
  plastic: "Plastic",
  metal: "Metal Fight",
  burst: "Burst",
  x: "X",
};

const EN_SUFFIX: Record<SkuType, string[]> = {
  starter: ["starter", "starter set"],
  complete_loose: ["complete", "complete beyblade"],
  complete_sealed: ["sealed", "NIB"],
  sealed: ["sealed box", "booster box"],
};

const JP_SUFFIX: Record<SkuType, string[]> = {
  starter: ["スターター", "starter"],
  complete_loose: ["完成品", "complete"],
  complete_sealed: ["完成品 未開封", "complete sealed"],
  sealed: ["未開封", "sealed"],
};

export interface ProductBackfillTarget {
  productId: string;
  generation: Generation;
  skuType: SkuType;
  nameEn: string;
  nameJp: string | null;
  productCodes: string[];
  queries: string[];
}

function recipeParts(product: ProductDTO) {
  return product.partIds
    .map((id) => getPartById(id))
    .filter((p): p is NonNullable<typeof p> => p != null);
}

export function isPublishableProduct(product: ProductDTO): boolean {
  return analyzeProductRecipe(product, recipeParts(product)).canPublishMark;
}

function skuRank(skuType: SkuType): number {
  switch (skuType) {
    case "starter":
      return 0;
    case "complete_loose":
      return 1;
    case "complete_sealed":
      return 2;
    case "sealed":
      return 3;
    default:
      return 9;
  }
}

function genRank(gen: Generation): number {
  // Prefer plastic → metal → burst when building default plans (X last).
  if (gen === "plastic") return 0;
  if (gen === "metal") return 1;
  if (gen === "burst") return 2;
  return 3;
}

function buildQueriesForProduct(product: ProductDTO): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(trimmed);
  };

  const primaryCode = product.productCodes[0];
  const genLabel = GEN_EN_LABEL[product.generation];

  for (const code of product.productCodes) {
    add(code);
    for (const suffix of EN_SUFFIX[product.skuType] ?? []) {
      add(`${code} ${suffix}`);
    }
    for (const suffix of JP_SUFFIX[product.skuType] ?? []) {
      add(`${code} ${suffix}`);
    }
    if (product.nameJp) add(`${code} ${product.nameJp}`);
    if (product.nameEn) {
      add(`${code} ${product.nameEn}`);
      add(`Beyblade ${genLabel} ${product.nameEn} ${code}`);
      for (const suffix of EN_SUFFIX[product.skuType] ?? []) {
        add(`${product.nameEn} ${code} ${suffix}`);
        add(`Beyblade ${genLabel} ${product.nameEn} ${suffix}`);
      }
    }
  }

  if (product.nameEn) {
    add(`Beyblade ${genLabel} ${product.nameEn}`);
    if (primaryCode) add(`Beyblade ${genLabel} ${product.nameEn} ${primaryCode}`);
  }
  if (product.nameJp) add(product.nameJp);

  // High-recall Mercari patterns from best-match audit (bey + code + starter/takara).
  if (primaryCode) {
    add(`ベイブレード ${primaryCode} スターター`);
    add(`BEYBLADE ${primaryCode} スターター`);
    add(`タカラトミー ${primaryCode} スターター`);
    add(`ベイブレードX ${primaryCode} スターター`);
    if (product.nameJp) add(`${primaryCode} ${product.nameJp} ベイブレード`);
    if (product.nameEn) add(`タカラトミー ${primaryCode} ${product.nameEn}`);
  }

  // Metal/Plastic: sellers often omit hyphen (BB30 ロックレオーネ).
  if (
    (product.generation === "metal" || product.generation === "plastic") &&
    primaryCode?.startsWith("BB-")
  ) {
    const bare = primaryCode.replace("-", "");
    add(`メタルファイト ${bare}`);
    add(`ベイブレード ${bare}`);
    if (product.nameJp) add(`${bare} ${product.nameJp}`);
  }

  return out;
}

export function listPublishableProducts(opts?: {
  generations?: Generation[];
  priorityOnly?: boolean;
  maxProducts?: number;
}): ProductDTO[] {
  const generations = new Set(opts?.generations ?? DEFAULT_GENS);
  const priority = new Set<string>(PRIORITY_PRODUCT_IDS);

  let products = loadProducts().filter(
    (p) => generations.has(p.generation) && isPublishableProduct(p)
  );

  if (opts?.priorityOnly) {
    products = products.filter((p) => priority.has(p.id));
  }

  products.sort((a, b) => {
    const pa = priority.has(a.id) ? 0 : 1;
    const pb = priority.has(b.id) ? 0 : 1;
    if (pa !== pb) return pa - pb;
    const ga = genRank(a.generation);
    const gb = genRank(b.generation);
    if (ga !== gb) return ga - gb;
    const sa = skuRank(a.skuType);
    const sb = skuRank(b.skuType);
    if (sa !== sb) return sa - sb;
    return a.nameEn.localeCompare(b.nameEn);
  });

  if (opts?.maxProducts != null && opts.maxProducts > 0) {
    return products.slice(0, opts.maxProducts);
  }
  return products;
}

/** Product-first query plan — English + JP terms for whole-SKU sold search. */
export function buildProductBackfillQueryPlan(opts?: {
  generations?: Generation[];
  priorityOnly?: boolean;
  maxProducts?: number;
  maxQueries?: number;
}): string[] {
  const products = listPublishableProducts({
    generations: opts?.generations,
    priorityOnly: opts?.priorityOnly,
    maxProducts: opts?.maxProducts,
  });

  const seen = new Set<string>();
  const out: string[] = [];

  for (const product of products) {
    for (const q of buildQueriesForProduct(product)) {
      const key = q.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(q);
      if (opts?.maxQueries != null && opts.maxQueries > 0 && out.length >= opts.maxQueries) {
        return out;
      }
    }
  }

  return out;
}

export function buildProductBackfillTargets(opts?: {
  generations?: Generation[];
  priorityOnly?: boolean;
  maxProducts?: number;
}): ProductBackfillTarget[] {
  return listPublishableProducts(opts).map((product) => ({
    productId: product.id,
    generation: product.generation,
    skuType: product.skuType,
    nameEn: product.nameEn,
    nameJp: product.nameJp,
    productCodes: product.productCodes,
    queries: buildQueriesForProduct(product),
  }));
}

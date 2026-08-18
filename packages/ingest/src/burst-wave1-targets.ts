import { getProductById } from "@beyoracle/catalog";
import { buildProductBackfillTargets } from "./product-backfill-query-plan.js";
import { WAVE1_BURST_PRODUCTS } from "./burst-wave1-ids.js";

/** High-signal JP sold-search anchors from docs/burst/venue-bands.md. */
const VENUE_ANCHOR_QUERIES: Record<string, string[]> = {
  "prod-burst-b-01-starter": [
    "B-01 ヴァルキリー スターター",
    "B-01 Valkyrie starter",
    "ヴァルキリー B-01 スターター 中古",
    "B-01 Wing Accel スターター",
    "B-01 ベイブレード スターター 中古",
  ],
  "prod-burst-b-01-sealed": [
    "B-01 ヴァルキリー 未開封",
    "B-01 Valkyrie sealed",
    "B-01 スターター 未開封",
    "B-01 22222",
    "B-01 19000",
    "B-01 16000",
    "B-01 14858",
  ],
  "prod-burst-b-102-complete-loose": [
    "B-102 ツインネメシス 中古",
    "B-102 Twin Nemesis loose",
    "B-102 ブースター 中古",
    "Twin Nemesis B-102 999",
    "B-102 1977",
    "B-102 1879",
  ],
  "prod-burst-b-102-sealed": [
    "B-102 ツインネメシス 未開封",
    "B-102 Twin Nemesis sealed",
    "B-102 ブースター 未開封",
    "B-102 4097",
    "B-102 3700",
    "B-102 3480",
  ],
  "prod-burst-b-168-complete-loose": [
    "B-168 レイジロンギヌス 中古",
    "B-168 Rage Longinus loose",
    "B-168 ブースター 中古",
    "Rage Longinus B-168 2500",
    "B-168 1800",
  ],
  "prod-burst-b-168-sealed": [
    "B-168 レイジロンギヌス 未開封",
    "B-168 Rage Longinus sealed",
    "B-168 ブースター 未開封",
    "B-168 3880",
  ],
  "prod-burst-b-34-sealed": [
    "B-34 ヴィクトリーヴァルキリー 未開封",
    "B-34 Victory Valkyrie sealed",
    "B-34 13999",
    "B-34 12800",
    "B-34 8800",
  ],
  "prod-burst-b-97-sealed": [
    "B-97 ナイトメアロンギヌス 未開封",
    "B-97 Nightmare Longinus sealed",
    "B-97 7000",
    "B-97 6888",
  ],
  "prod-burst-b-110-sealed": [
    "B-110 ブラッディロンギヌス 未開封",
    "B-110 Bloody Longinus sealed",
    "B-110 1780",
    "B-110 1200",
  ],
  "prod-burst-b-127-sealed": [
    "B-127 超Zヴァルキリー 未開封",
    "B-127 Cho-Z Valkyrie sealed",
    "B-127 6722",
  ],
};

const wave1Set = new Set<string>(WAVE1_BURST_PRODUCTS);

/** Sold-comp search queries for Wave 1 expansion SKUs. */
export function buildWave1QueryPlan(opts?: { maxQueries?: number }): string[] {
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

  for (const t of buildProductBackfillTargets()) {
    if (!wave1Set.has(t.productId)) continue;
    for (const q of t.queries) add(q);
  }

  for (const id of WAVE1_BURST_PRODUCTS) {
    for (const q of VENUE_ANCHOR_QUERIES[id] ?? []) add(q);
    const p = getProductById(id);
    if (p?.nameJp) add(`${p.productCodes[0] ?? ""} ${p.nameJp}`.trim());
  }

  const max = opts?.maxQueries ?? Number(process.env.WAVE1_INGEST_MAX_QUERIES ?? 96);
  return out.slice(0, max);
}

export function wave1ProductIds(): readonly string[] {
  return WAVE1_BURST_PRODUCTS;
}

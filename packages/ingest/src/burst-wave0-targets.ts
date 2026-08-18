import { getProductById } from "@beyoracle/catalog";
import { buildProductBackfillTargets } from "./product-backfill-query-plan.js";
import { WAVE0_STARTERS } from "./burst-wave0-ids.js";

/** Wave 0 verify failures — targeted ingest/rematch/purge (2026-08-15). */
export const WAVE0_FAILING_STARTERS = [
  "prod-burst-b-110-starter",
  "prod-burst-b-97-starter",
  "prod-burst-b-104-starter",
] as const;

/** High-signal JP sold-search anchors from docs/burst/venue-bands.md. */
const VENUE_ANCHOR_QUERIES: Record<(typeof WAVE0_FAILING_STARTERS)[number], string[]> = {
  "prod-burst-b-110-starter": [
    "B-110 ブラッディロンギヌス スターター",
    "B-110 Bloody Longinus starter",
    "ブラッディロンギヌス B-110 中古",
    "B-110 ロンギヌス スターターセット",
    "B-110 ベイブレード スターター 中古",
    "ブラッディロンギヌス スターターセット",
    "B-110 スターター 美品",
    "ブラッディロンギヌス 1300",
    "B-110 1180",
    "B-110 777",
    "B-110 13 Jolt",
  ],
  "prod-burst-b-97-starter": [
    "B-97 ナイトメアロンギヌス スターター",
    "B-97 Nightmare Longinus starter",
    "ナイトメアロンギヌス B-97 中古",
    "B-97 ロンギヌス スターター",
    "B-97 ベイブレード スターター 中古",
    "ナイトメアロンギヌス スターターセット",
    "B-97 ナイトメア ロンギヌス",
    "ナイトメアロンギヌス 5400",
    "B-97 5790",
    "B-97 2200",
    "B-97 スターター 美品",
    "Nightmare Longinus Ds starter",
  ],
  "prod-burst-b-104-starter": [
    "B-104 ウィニングヴァルキリー スターター",
    "B-104 Winning Valkyrie starter",
    "ウィニングヴァルキリー B-104 中古",
    "B-104 スターター ランチャー",
    "B-104 ベイブレード スターター 中古",
    "ウィニングヴァルキリー スターターセット",
    "B-104 ヴァルキリー 中古",
    "B-104 開封 中古 スターター",
    "B-104 1200",
    "B-104 ランチャー付き",
    "Winning Valkyrie 12 Vl starter",
  ],
};

/** Sold-comp search queries for the three failing Wave 0 starters. */
export function buildWave0GapQueryPlan(opts?: { maxQueries?: number }): string[] {
  const failing = new Set<string>(WAVE0_FAILING_STARTERS);
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
    if (!failing.has(t.productId)) continue;
    for (const q of t.queries) add(q);
  }

  for (const id of WAVE0_FAILING_STARTERS) {
    for (const q of VENUE_ANCHOR_QUERIES[id]) add(q);
    const p = getProductById(id);
    if (p?.nameJp) add(`${p.productCodes[0] ?? ""} ${p.nameJp}`.trim());
  }

  const max = opts?.maxQueries ?? Number(process.env.WAVE0_INGEST_MAX_QUERIES ?? 64);
  return out.slice(0, max);
}

export function wave0StarterIds(): readonly string[] {
  return WAVE0_STARTERS;
}

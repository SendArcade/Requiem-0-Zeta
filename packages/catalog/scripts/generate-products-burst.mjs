/**
 * One-shot generator for data/seeds/products-burst.json
 * Scavenge: build-products.ts burstRecipes + Takara starter combos verified against parts.json
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const parts = JSON.parse(
  readFileSync(join(__dirname, "..", "data", "parts.json"), "utf-8")
);
const partIds = new Set(parts.map((p) => p.id));
const partById = Object.fromEntries(parts.map((p) => [p.id, p]));

function slug(s) {
  return s
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function assertParts(ids) {
  for (const id of ids) {
    if (!partIds.has(id)) throw new Error(`Missing part: ${id}`);
  }
}

/** @type {import('@beyoracle/shared').ProductDTO[]} */
const products = [];
const seen = new Set();

function add(product) {
  assertParts(product.partIds);
  if (seen.has(product.id)) return;
  seen.add(product.id);
  products.push(product);
}

function starterSkus(code, nameEn, nameJp, partIds, attrs = {}) {
  for (const skuType of ["starter", "complete_loose", "complete_sealed"]) {
    const suffix =
      skuType === "complete_sealed"
        ? " (Sealed)"
        : skuType === "complete_loose"
          ? " (Complete)"
          : " Starter";
    const jpSuffix =
      skuType === "complete_sealed"
        ? " 未開封"
        : skuType === "complete_loose"
          ? " 完成品"
          : " スターター";
    add({
      id: `prod-burst-${slug(code)}-${skuType.replace(/_/g, "-")}`,
      generation: "burst",
      skuType,
      nameEn: `${nameEn}${suffix}`,
      nameJp: nameJp ? `${nameJp}${jpSuffix}` : null,
      productCodes: [code],
      attrs: { recipeKind: "assembled", ...attrs },
      partIds,
    });
  }
}

/** Full starter recipes — all part IDs verified in parts.json */
const STARTERS = [
  {
    code: "B-01",
    nameEn: "Valkyrie",
    nameJp: null,
    combo: "Boost Variable",
    partIds: ["burst-layer-valkyrie", "burst-disc-boost", "burst-driver-variable"],
  },
  {
    code: "B-02",
    nameEn: "Roktavor",
    nameJp: null,
    combo: "Heavy Variable",
    partIds: ["burst-layer-roktavor", "burst-disc-heavy", "burst-driver-variable"],
  },
  {
    code: "B-03",
    nameEn: "Kerbeus",
    nameJp: null,
    combo: "Central Needle",
    partIds: ["burst-layer-kerbeus", "burst-disc-central", "burst-driver-needle"],
  },
  {
    code: "Xcalibur",
    nameEn: "Xcalibur",
    nameJp: null,
    combo: "Force Xtreme",
    partIds: ["burst-layer-xcalibur", "burst-disc-force", "burst-driver-xtreme"],
  },
  {
    code: "B-05",
    nameEn: "Amaterios",
    nameJp: null,
    combo: "Fortress Defense",
    partIds: ["burst-layer-amaterios", "burst-disc-fortress", "burst-driver-defense"],
  },
  {
    code: "B-06",
    nameEn: "Yegdrion",
    nameJp: null,
    combo: "Ring Defense",
    partIds: ["burst-layer-yegdrion", "burst-disc-ring", "burst-driver-defense"],
  },
  {
    code: "B-07",
    nameEn: "Wyvern",
    nameJp: null,
    combo: "Spread Accel",
    partIds: ["burst-layer-wyvern", "burst-disc-spread", "burst-driver-accel"],
  },
  {
    code: "Ragnaruk",
    nameEn: "Ragnaruk",
    nameJp: null,
    combo: "Yell Destroy",
    partIds: ["burst-layer-ragnaruk", "burst-disc-yell", "burst-driver-destroy"],
  },
  {
    code: "B-09",
    nameEn: "Horusood",
    nameJp: null,
    combo: "Gravity Spiral",
    partIds: ["burst-layer-horusood", "burst-disc-gravity", "burst-driver-spiral"],
  },
  {
    code: "B-10",
    nameEn: "Treptune",
    nameJp: null,
    combo: "Down Survive",
    partIds: ["burst-layer-treptune", "burst-disc-down", "burst-driver-survive"],
  },
  {
    code: "B-11",
    nameEn: "Spriggan",
    nameJp: null,
    combo: "8 Trans",
    partIds: ["burst-layer-spriggan", "burst-disc-8", "burst-driver-trans"],
  },
  {
    code: "B-34",
    nameEn: "Winning Valkyrie",
    nameJp: "ウィニングヴァルキリー",
    combo: "12 Variable",
    partIds: ["burst-b-34-layer", "burst-disc-12", "burst-driver-variable"],
  },
  {
    code: "B-86",
    nameEn: "Cho-Z Achilles",
    nameJp: null,
    combo: "0 Zeta",
    partIds: ["burst-layer-cho-z-achilles", "burst-0-disc", "burst-driver-zeta"],
  },
  {
    code: "B-97",
    nameEn: "Heaven Pegasus",
    nameJp: "ヘブンペガサス",
    combo: "10 Atomic",
    partIds: ["burst-b-97-layer", "burst-disc-10", "burst-driver-atomic"],
  },
  {
    code: "B-102",
    nameEn: "Dead Phoenix",
    nameJp: null,
    combo: "0 Friction",
    partIds: ["burst-layer-dead-phoenix", "burst-0-disc", "burst-driver-friction"],
  },
  {
    code: "B-110",
    nameEn: "Spriggan Requiem",
    nameJp: null,
    combo: "0 Evolution",
    partIds: [
      "burst-layer-spriggan-requiem",
      "burst-0-disc",
      "burst-driver-evolution",
    ],
  },
  {
    code: "B-115",
    nameEn: "Geist Fafnir",
    nameJp: null,
    combo: "1 Eternal",
    partIds: ["burst-layer-geist-fafnir", "burst-disc-1", "burst-driver-eternal"],
  },
  {
    code: "B-127",
    nameEn: "Cho-Z Spriggan",
    nameJp: "超Zスプリガン",
    combo: "13 Accel",
    partIds: ["burst-b-127-layer", "burst-disc-13", "burst-driver-accel"],
  },
  {
    code: "B-168",
    nameEn: "Dynamite Belial",
    nameJp: "ダイナマイトベリアル",
    combo: "Over Power",
    partIds: ["burst-b-168-layer", "burst-disc-over", "burst-driver-power"],
  },
];

for (const s of STARTERS) {
  starterSkus(s.code, s.nameEn, s.nameJp, s.partIds, { combo: s.combo });
}

/** Random booster / multi-pack sealed SKUs */
const SEALED = [
  {
    id: "prod-burst-b-00-sealed",
    code: "B-00",
    nameEn: "B-00 Random Booster Vol.1",
    nameJp: "B-00 ランダムブースター Vol.1",
    attrs: { volume: 1, line: "RB" },
    partIds: [
      "burst-b-34-layer",
      "burst-disc-12",
      "burst-driver-variable",
      "burst-layer-storm-spriggan",
      "burst-disc-knuckle",
    ],
  },
  {
    id: "prod-burst-b-04-rb-sealed",
    code: "B-04 RB",
    nameEn: "B-04 Random Booster Vol.1",
    nameJp: "B-04 ランダムブースター Vol.1",
    attrs: { volume: 1, line: "RB" },
    partIds: [
      "burst-layer-storm-spriggan",
      "burst-layer-kaiser-kerbeus",
      "burst-disc-knuckle",
      "burst-disc-6",
      "burst-driver-accel",
      "burst-driver-iron",
    ],
  },
  {
    id: "prod-burst-b-08-rb-sealed",
    code: "B-08 RB",
    nameEn: "B-08 Random Booster Vol.2",
    nameJp: "B-08 ランダムブースター Vol.2",
    attrs: { volume: 2, line: "RB" },
    partIds: [
      "burst-layer-rising-ragnaruk",
      "burst-layer-nova-neptune",
      "burst-disc-7",
      "burst-disc-yell",
      "burst-driver-destroy",
      "burst-driver-survive",
    ],
  },
  {
    id: "prod-burst-b-13-rb-sealed",
    code: "B-13 RB",
    nameEn: "B-13 Random Booster Vol.3",
    nameJp: "B-13 ランダムブースター Vol.3",
    attrs: { volume: 3, line: "RB" },
    partIds: [
      "burst-layer-god-valkyrie",
      "burst-layer-nightmare-longinus",
      "burst-disc-10",
      "burst-disc-tapered",
      "burst-driver-atomic",
      "burst-driver-trans",
    ],
  },
  {
    id: "prod-burst-b-18-rb-sealed",
    code: "B-18 RB",
    nameEn: "B-18 Random Booster Vol.4",
    nameJp: "B-18 ランダムブースター Vol.4",
    attrs: { volume: 4, line: "RB" },
    partIds: [
      "burst-layer-legend-spriggan",
      "burst-layer-xeno-xcalibur",
      "burst-11-disc",
      "burst-disc-giga",
      "burst-driver-jolt",
      "burst-driver-orbit",
    ],
  },
  {
    id: "prod-burst-b-24-rb-sealed",
    code: "B-24 RB",
    nameEn: "B-24 Random Booster Vol.5",
    nameJp: "B-24 ランダムブースター Vol.5",
    attrs: { volume: 5, line: "RB" },
    partIds: [
      "burst-layer-cho-z-valkyrie",
      "burst-layer-z-achilles",
      "burst-0-disc",
      "burst-disc-boost",
      "burst-driver-zeta",
      "burst-driver-destroy",
    ],
  },
  {
    id: "prod-burst-b-36-rb-sealed",
    code: "B-36 RB",
    nameEn: "B-36 Random Booster Vol.6",
    nameJp: "B-36 ランダムブースター Vol.6",
    attrs: { volume: 6, line: "RB" },
    partIds: [
      "burst-layer-cho-z-achilles",
      "burst-b-127-layer",
      "burst-disc-13",
      "burst-disc-nexus",
      "burst-driver-evolution",
      "burst-driver-friction",
    ],
  },
  {
    id: "prod-burst-b-51-rb-sealed",
    code: "B-51 RB",
    nameEn: "B-51 Random Booster Vol.7",
    nameJp: "B-51 ランダムブースター Vol.7",
    attrs: { volume: 7, line: "RB" },
    partIds: [
      "burst-b-97-layer",
      "burst-layer-geist-fafnir",
      "burst-disc-10",
      "burst-disc-1",
      "burst-driver-atomic",
      "burst-driver-eternal",
    ],
  },
  {
    id: "prod-burst-b-63-rb-sealed",
    code: "B-63 RB",
    nameEn: "B-63 Random Booster Vol.8",
    nameJp: "B-63 ランダムブースター Vol.8",
    attrs: { volume: 8, line: "RB" },
    partIds: [
      "burst-layer-spriggan-requiem",
      "burst-layer-dead-phoenix",
      "burst-disc-limited",
      "burst-disc-jerk",
      "burst-driver-evolution",
      "burst-driver-friction",
    ],
  },
  {
    id: "prod-burst-b-99-rb-sealed",
    code: "B-99 RB",
    nameEn: "B-99 Random Booster Vol.11",
    nameJp: "B-99 ランダムブースター Vol.11",
    attrs: { volume: 11, line: "RB" },
    partIds: [
      "burst-layer-drain-fafnir",
      "burst-layer-maximum-garuda",
      "burst-disc-ring",
      "burst-disc-sting",
      "burst-driver-unite",
      "burst-driver-power",
    ],
  },
  {
    id: "prod-burst-b-125-rb-sealed",
    code: "B-125 RB",
    nameEn: "B-125 Random Booster Vol.13",
    nameJp: "B-125 ランダムブースター Vol.13",
    attrs: { volume: 13, line: "RB" },
    partIds: [
      "burst-b-168-layer",
      "burst-layer-perfect-phoenix",
      "burst-disc-over",
      "burst-disc-moon",
      "burst-driver-power",
      "burst-driver-metal-ball",
    ],
  },
  {
    id: "prod-burst-b-01-booster-sealed",
    code: "B-01 Booster",
    nameEn: "Valkyrie Booster Pack",
    nameJp: null,
    attrs: { line: "booster" },
    partIds: ["burst-layer-valkyrie", "burst-disc-boost"],
  },
  {
    id: "prod-burst-b-05-booster-sealed",
    code: "B-05 Booster",
    nameEn: "Amaterios Booster Pack",
    nameJp: null,
    attrs: { line: "booster" },
    partIds: ["burst-layer-amaterios", "burst-disc-aero"],
  },
  {
    id: "prod-burst-corocoro-amaterios-sealed",
    code: "CoroCoro Amaterios",
    nameEn: "CoroCoro Limited Shadow Amaterios",
    nameJp: null,
    attrs: { line: "corocoro", limited: true },
    partIds: ["burst-layer-shadow-amaterios", "burst-disc-limited"],
  },
];

for (const s of SEALED) {
  const ids = s.partIds.filter((id) => partIds.has(id));
  if (ids.length === 0) continue;
  add({
    id: s.id,
    generation: "burst",
    skuType: "sealed",
    nameEn: s.nameEn,
    nameJp: s.nameJp ?? null,
    productCodes: [s.code],
    attrs: { recipeKind: "contents", ...s.attrs },
    partIds: ids,
  });
}

/** Popular layer-only complete_loose (disc/driver unknown in catalog) */
const LAYER_ONLY = [
  "Achilles",
  "Spriggan",
  "Dragon",
  "Fafnir",
  "Lucifer",
  "Valkyrie",
  "Pegasus",
  "Salamander",
  "Ashura",
  "Rage",
  "Joker",
  "Tempest",
  "Roar",
  "Brave",
  "King",
  "Deathscyther",
  "Wyvern",
  "Hades",
  "Excalibur",
  "Garuda",
  "Kraken",
  "Leopard",
  "Phoenix",
];

const layers = parts.filter((p) => p.generation === "burst" && p.partType === "layer");
for (const hint of LAYER_ONLY) {
  const layer = layers.find((l) => l.nameEn.toLowerCase().includes(hint.toLowerCase()));
  if (!layer) continue;
  const code =
    layer.productCodes.find((c) => /^B-\d/.test(c)) ?? layer.productCodes[0] ?? layer.nameEn;
  const id = `prod-burst-${slug(layer.nameEn)}-complete-loose`;
  if (seen.has(id)) continue;
  add({
    id,
    generation: "burst",
    skuType: "complete_loose",
    nameEn: `${layer.nameEn} (Layer only)`,
    nameJp: layer.nameJp ? `${layer.nameJp} レイヤーのみ` : null,
    productCodes: [code],
    attrs: { recipeKind: "partial", recipe: "layer_only" },
    partIds: [layer.id],
  });
}

products.sort((a, b) => a.id.localeCompare(b.id));

const outPath = join(__dirname, "..", "data", "seeds", "products-burst.json");
writeFileSync(outPath, JSON.stringify(products, null, 2) + "\n");

const bySku = {};
for (const p of products) {
  bySku[p.skuType] = (bySku[p.skuType] ?? 0) + 1;
}
console.log("Wrote", outPath);
console.log("Total:", products.length);
console.log("By skuType:", bySku);

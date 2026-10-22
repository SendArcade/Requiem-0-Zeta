/**
 * Generator for data/seeds/products-burst.json
 * Wave 0+1: vacate occupied TT codes first, then attach pack keys to true identities.
 * Pack keys: starter + complete_loose + sealed (complete_sealed collapsed).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const parts = JSON.parse(
  readFileSync(join(__dirname, "..", "..", "..", "packages", "catalog", "data", "parts.json"), "utf-8")
);
const partIds = new Set(parts.map((p) => p.id));

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

function packSkus(code, nameEn, nameJp, partIds, attrs = {}, skuTypes = ["starter", "complete_loose", "sealed"]) {
  for (const skuType of skuTypes) {
    const suffix =
      skuType === "sealed" || skuType === "complete_sealed"
        ? " (Sealed)"
        : skuType === "complete_loose"
          ? " (Complete)"
          : " Starter";
    const jpSuffix =
      skuType === "sealed" || skuType === "complete_sealed"
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

function starterSkus(code, nameEn, nameJp, partIds, attrs = {}) {
  packSkus(code, nameEn, nameJp, partIds, attrs, ["starter", "complete_loose", "sealed"]);
}

function boosterSkus(code, nameEn, nameJp, partIds, attrs = {}) {
  packSkus(code, nameEn, nameJp, partIds, attrs, ["complete_loose", "sealed"]);
}

/** Dual Layer / early starters — B-01 is Wing Accel, not Boost Variable. */
const BASE_STARTERS = [
  {
    code: "B-01",
    nameEn: "Valkyrie Wing Accel DX",
    nameJp: "ヴァルキリー",
    combo: "Wing Accel",
    partIds: ["burst-layer-valkyrie", "burst-disc-wing", "burst-driver-accel"],
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
];

/**
 * WAVE 0: mint B-104 Winning first, then retitle B-34 to Victory.
 * No Winning alias on B-34. B-29 stays its own code (not listed here).
 */
const WAVE0_STARTERS = [
  {
    code: "B-104",
    nameEn: "Winning Valkyrie",
    nameJp: "ウィニングヴァルキリー",
    combo: "12 Volcanic",
    partIds: ["burst-b-34-layer", "burst-disc-12", "burst-driver-volcanic"],
  },
  {
    code: "B-34",
    nameEn: "Victory Valkyrie",
    nameJp: "ビクトリーヴァルキリー",
    combo: "Boost Variable",
    partIds: ["burst-layer-victory-valkyrie", "burst-disc-boost", "burst-driver-variable"],
  },
];

/**
 * WAVE 1: vacate occupied codes FIRST, then attach keys to true TT.
 * B-115 vacated for Wave 2 (not filled). Metal held.
 */
const WAVE1_VACATE_STARTERS = [
  {
    code: "B-129",
    nameEn: "Cho-Z Achilles",
    nameJp: "超Zアキレス",
    combo: "00 Dimension",
    partIds: ["burst-layer-cho-z-achilles", "burst-disc-00", "burst-driver-dimension"],
  },
  {
    code: "B-148",
    nameEn: "Heaven Pegasus",
    nameJp: "ヘブンペガサス",
    combo: "10 Atomic",
    partIds: ["burst-b-97-layer", "burst-disc-10", "burst-driver-atomic"],
  },
  {
    code: "B-131",
    nameEn: "Dead Phoenix",
    nameJp: "デッドフェニックス",
    combo: "0 Friction",
    partIds: ["burst-layer-dead-phoenix", "burst-0-disc", "burst-driver-friction"],
  },
  {
    code: "B-100",
    nameEn: "Spriggan Requiem",
    nameJp: "スプリガンレクイエム",
    combo: "0 Zeta",
    partIds: ["burst-layer-spriggan-requiem", "burst-0-disc", "burst-driver-zeta"],
  },
  {
    code: "B-180",
    nameEn: "Dynamite Belial",
    nameJp: "ダイナマイトベリアル",
    combo: "Over Power",
    partIds: ["burst-b-180-layer", "burst-disc-over", "burst-driver-power"],
  },
  {
    code: "B-122",
    nameEn: "Geist Fafnir",
    nameJp: "ガイストファブニル",
    combo: "8 Absorb",
    partIds: ["burst-layer-geist-fafnir", "burst-disc-8", "burst-driver-absorb"],
  },
  {
    code: "B-128",
    nameEn: "Cho-Z Spriggan",
    nameJp: "超Zスプリガン",
    combo: "0 Atomic",
    partIds: ["burst-b-127-layer", "burst-0-disc", "burst-driver-atomic"],
  },
];

const WAVE1_TRUE_TT_STARTERS = [
  {
    code: "B-86",
    nameEn: "Legend Spriggan",
    nameJp: "レジェンドスプリガン",
    combo: "7 Merge",
    partIds: ["burst-layer-legend-spriggan", "burst-disc-7", "burst-driver-merge"],
  },
  {
    code: "B-97",
    nameEn: "Nightmare Longinus",
    nameJp: "ナイトメアロンギヌス",
    combo: "Destroy",
    partIds: ["burst-layer-nightmare-longinus", "burst-disc-heavy", "burst-driver-destroy"],
  },
  {
    code: "B-110",
    nameEn: "Bloody Longinus",
    nameJp: "ブラッディロンギヌス",
    combo: "13 Jolt",
    partIds: ["burst-layer-bloody-longinus", "burst-disc-13", "burst-driver-jolt"],
  },
  {
    code: "B-127",
    nameEn: "Cho-Z Valkyrie",
    nameJp: "超Zヴァルキリー",
    combo: "Z Evolution",
    partIds: ["burst-layer-cho-z-valkyrie", "burst-disc-z", "burst-driver-evolution"],
  },
];

/** Boosters: complete_loose + sealed only (no starter). */
const WAVE1_BOOSTERS = [
  {
    code: "B-102",
    nameEn: "Twin Nemesis",
    nameJp: "ツインネメシス",
    combo: "3 Unite",
    partIds: ["burst-layer-twin-nemesis", "burst-disc-3", "burst-driver-unite"],
  },
  {
    code: "B-168",
    nameEn: "Rage Longinus",
    nameJp: "レイジロンギヌス",
    combo: "Giga Revolve",
    partIds: ["burst-b-168-layer", "burst-disc-giga", "burst-driver-revolve"],
  },
];

for (const s of BASE_STARTERS) {
  starterSkus(s.code, s.nameEn, s.nameJp, s.partIds, { combo: s.combo });
}
for (const s of WAVE0_STARTERS) {
  starterSkus(s.code, s.nameEn, s.nameJp, s.partIds, { combo: s.combo });
}
for (const s of WAVE1_VACATE_STARTERS) {
  starterSkus(s.code, s.nameEn, s.nameJp, s.partIds, { combo: s.combo });
}
for (const s of WAVE1_TRUE_TT_STARTERS) {
  starterSkus(s.code, s.nameEn, s.nameJp, s.partIds, { combo: s.combo });
}
for (const s of WAVE1_BOOSTERS) {
  boosterSkus(s.code, s.nameEn, s.nameJp, s.partIds, { combo: s.combo, pack: "booster" });
}

products.sort((a, b) => a.id.localeCompare(b.id));

const outPath = join(__dirname, "..", "..", "..", "packages", "catalog", "data", "seeds", "products-burst.json");
writeFileSync(outPath, JSON.stringify(products, null, 2) + "\n");

const bySku = {};
for (const p of products) {
  bySku[p.skuType] = (bySku[p.skuType] ?? 0) + 1;
}
console.log("Wrote", outPath);
console.log("Total:", products.length);
console.log("By skuType:", bySku);

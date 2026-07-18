/**
 * Rebuild data/seeds/products.json from parts.json + BeyBrew starter metadata.
 *
 * Scavenge patterns: yujinyuz/beybrew source[] lines (BX-01 DRANSWORD3-60F),
 * curated seeds in data/seeds/product-overrides.json, existing hand-tuned SKUs.
 *
 * Usage: pnpm --filter @beyoracle/catalog products:build
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Generation, PartDTO, ProductDTO, SkuType } from "@beyoracle/shared";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "data");
const seedsDir = join(dataDir, "seeds");

interface BeybrewPart {
  name: string;
  source?: string[];
  line?: string;
}

interface BeybrewData {
  blades: BeybrewPart[];
  ratchets: BeybrewPart[];
  bits: BeybrewPart[];
}

interface StarterRecipe {
  code: string;
  line: "BX" | "UX" | "CX";
  combo: string;
  bladeName: string;
  partIds: string[];
  nameEn: string;
  nameJp: string | null;
}

/** Multi-pack / random booster — sealed SKU only (no starter variant). */
const SEALED_ONLY_CODES = new Set([
  "BX-00",
  "BX-08",
  "BX-14",
  "BX-16",
  "BX-19",
  "BX-21",
  "BX-23",
  "BX-24",
  "BX-26",
  "BX-27",
  "BX-33",
  "BX-35",
  "BX-39",
  "BX-44",
  "UX-00",
  "CX-00",
  "B-00",
]);

const STARTER_LINE_RE =
  /^(BX|UX|CX)-(\d{2})\s+[A-Z0-9_]+?(\d-\d+[A-Z]{1,3})/i;

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function humanize(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .trim();
}

function loadJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

function partIndex(parts: PartDTO[]) {
  const byId = new Map(parts.map((p) => [p.id, p]));
  const byGenType = new Map<string, PartDTO[]>();
  const byCode = new Map<string, PartDTO[]>();

  for (const p of parts) {
    const gt = `${p.generation}:${p.partType}`;
    if (!byGenType.has(gt)) byGenType.set(gt, []);
    byGenType.get(gt)!.push(p);
    for (const c of p.productCodes) {
      const key = `${p.generation}:${c.toUpperCase()}`;
      if (!byCode.has(key)) byCode.set(key, []);
      byCode.get(key)!.push(p);
    }
  }

  return { byId, byGenType, byCode };
}

function normName(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findBladeForCode(
  parts: PartDTO[],
  code: string,
  bladeName: string
): PartDTO | undefined {
  const upper = code.toUpperCase();
  const [line, num] = upper.split("-");
  const preferredId = `x-${line!.toLowerCase()}-${num}-blade`;

  const byCode = parts.filter(
    (p) =>
      p.generation === "x" &&
      p.partType === "blade" &&
      p.productCodes.some((c) => c.toUpperCase() === upper)
  );

  const preferred = byCode.find((p) => p.id === preferredId);
  if (preferred) return preferred;

  const byName = byCode.find((p) => normName(p.nameEn) === normName(humanize(bladeName)));
  if (byName) return byName;

  return byCode.sort((a, b) => a.productCodes.length - b.productCodes.length)[0];
}

function findRatchetForCombo(parts: PartDTO[], combo: string): PartDTO | undefined {
  const prefix = combo.match(/^(\d-\d+)/)?.[1];
  if (!prefix) return undefined;

  const exact = parts.find(
    (p) =>
      p.generation === "x" &&
      p.partType === "ratchet" &&
      (p.nameEn === prefix || p.id === `x-ratchet-${prefix}` || p.id === `x-bx-05-ratchet`)
  );
  if (exact && exact.nameEn === prefix) return exact;

  return (
    parts.find(
      (p) =>
        p.generation === "x" &&
        p.partType === "ratchet" &&
        (p.nameEn === prefix || p.id === `x-ratchet-${prefix}`)
    ) ??
    parts.find(
      (p) => p.generation === "x" && p.partType === "ratchet" && p.nameEn === prefix
    )
  );
}

function findBitForCombo(parts: PartDTO[], combo: string, code: string): PartDTO | undefined {
  const upper = code.toUpperCase();
  const byCode = parts.filter(
    (p) =>
      p.generation === "x" &&
      p.partType === "bit" &&
      p.productCodes.some((c) => c.toUpperCase() === upper)
  );
  if (byCode.length === 1) return byCode[0];
  if (byCode.length > 1) {
    const suffix = combo.slice(-1).toUpperCase();
    const suffixMap: Record<string, string> = {
      F: "Flat",
      B: "Ball",
      N: "Needle",
      T: "Taper",
      A: "Accel",
      D: "Dot",
      V: "Vortex",
    };
    const hint = suffixMap[suffix];
    if (hint) {
      const match = byCode.find((p) => p.nameEn === hint || p.nameEn.startsWith(hint));
      if (match) return match;
    }
    return byCode.sort((a, b) => a.productCodes.length - b.productCodes.length)[0];
  }

  const suffix = combo.match(/[A-Z]{1,3}$/)?.[0] ?? "";
  const suffixToName: Record<string, string> = {
    F: "Flat",
    B: "Ball",
    LF: "Low Flat",
    LF2: "Low Flat",
    DB: "Disc Ball",
    RA: "Rush Accel",
    HN: "High Needle",
    HT: "High Taper",
    GB: "Gear Ball",
    GF: "Gear Flat",
    GU: "Gear Unite",
    GR: "Gear Rush",
    WB: "Wall Ball",
    MN: "Metal Needle",
    K: "Kick",
    O: "Orb",
    E: "Elevate",
    Q: "Quake",
    P: "Point",
    S: "Spike",
    C: "Cyclone",
    R: "Rubber",
    Z: "Zenith",
    L: "Low",
    A: "Accel",
    N: "Needle",
    T: "Taper",
    V: "Vortex",
    D: "Dot",
    M: "Metal",
  };

  const bitName = suffixToName[suffix] ?? suffixToName[suffix.slice(-1) ?? ""];
  if (bitName) {
    return parts.find(
      (p) =>
        p.generation === "x" &&
        p.partType === "bit" &&
        (p.nameEn === bitName || p.id === `x-bit-${slug(bitName)}` || p.id === `x-bx-06-bit`)
    );
  }

  return undefined;
}

function resolveXRecipe(
  parts: PartDTO[],
  code: string,
  combo: string,
  bladeName: string
): string[] | null {
  const blade = findBladeForCode(parts, code, bladeName);
  const ratchet = findRatchetForCombo(parts, combo);
  const bit = findBitForCombo(parts, combo, code);
  const ids = [blade?.id, ratchet?.id, bit?.id].filter(Boolean) as string[];
  if (ids.length === 0) return null;
  return [...new Set(ids)];
}

function parseBeybrewStarters(beybrew: BeybrewData, parts: PartDTO[]): StarterRecipe[] {
  const starters = new Map<string, StarterRecipe>();

  for (const blade of beybrew.blades) {
    for (const src of blade.source ?? []) {
      const m = src.match(STARTER_LINE_RE);
      if (!m) continue;
      const line = m[1]!.toUpperCase() as "BX" | "UX" | "CX";
      const num = m[2]!;
      const code = `${line}-${num}`;
      const combo = m[3]!.toUpperCase();

      if (SEALED_ONLY_CODES.has(code)) continue;
      if (src.toLowerCase().includes("metallic coat")) continue;
      if (src.toLowerCase().includes("special ver")) continue;
      if (src.toLowerCase().includes("holo sticker")) continue;

      const existing = starters.get(code);
      if (!existing) {
        const partIds = resolveXRecipe(parts, code, combo, blade.name);
        if (!partIds || partIds.length === 0) continue;
        const bladePart = findBladeForCode(parts, code, blade.name);
        starters.set(code, {
          code,
          line,
          combo,
          bladeName: blade.name,
          partIds,
          nameEn: bladePart?.nameEn ?? humanize(blade.name),
          nameJp: bladePart?.nameJp ?? null,
        });
      }
    }
  }

  return [...starters.values()].sort((a, b) => a.code.localeCompare(b.code));
}

function productId(gen: Generation, code: string, skuType: SkuType): string {
  const codeSlug = slug(code);
  const skuSlug = skuType.replace(/_/g, "-");
  return `prod-${gen}-${codeSlug}-${skuSlug}`;
}

function addProduct(
  products: ProductDTO[],
  seen: Set<string>,
  input: Omit<ProductDTO, "nameJp"> & { nameJp?: string | null }
): void {
  if (seen.has(input.id)) return;
  const validPartIds = input.partIds.filter(Boolean);
  if (validPartIds.length === 0) return;
  seen.add(input.id);
  const recipeKind =
    input.attrs?.recipeKind ??
    (input.skuType === "sealed"
      ? "contents"
      : input.attrs?.recipe === "layer_only"
        ? "partial"
        : "assembled");
  products.push({
    ...input,
    nameJp: input.nameJp ?? null,
    partIds: validPartIds,
    attrs: { ...input.attrs, recipeKind },
  });
}

function buildXProducts(parts: PartDTO[], beybrew: BeybrewData): ProductDTO[] {
  const products: ProductDTO[] = [];
  const seen = new Set<string>();
  const idx = partIndex(parts);

  for (const recipe of parseBeybrewStarters(beybrew, parts)) {
    const gen = "x" as const;
    const attrs = { combo: recipe.combo, line: recipe.line };

    for (const skuType of ["starter", "complete_loose", "complete_sealed"] as SkuType[]) {
      const suffix =
        skuType === "complete_sealed"
          ? " (Sealed)"
          : skuType === "complete_loose"
            ? ` (${recipe.combo})`
            : " Starter";
      const jpSuffix =
        skuType === "complete_sealed"
          ? " 未開封"
          : skuType === "complete_loose"
            ? " 完成品"
            : " スターター";

      addProduct(products, seen, {
        id: productId(gen, recipe.code, skuType),
        generation: gen,
        skuType,
        nameEn: `${recipe.nameEn}${suffix}`,
        nameJp: recipe.nameJp ? `${recipe.nameJp}${jpSuffix}` : null,
        productCodes: [recipe.code],
        attrs,
        partIds: recipe.partIds,
      });
    }
  }

  // Sealed multi-packs — all parts tagged with the product code
  for (const code of SEALED_ONLY_CODES) {
    if (!code.startsWith("BX") && !code.startsWith("UX") && !code.startsWith("CX")) continue;
    const codeParts = (idx.byCode.get(`x:${code}`) ?? []).map((p) => p.id);
    if (codeParts.length === 0) continue;

    const nameMap: Record<string, { en: string; jp: string }> = {
      "BX-00": { en: "BX-00 Basic Battle Set", jp: "BX-00 ベーシックバトルセット" },
      "BX-08": { en: "BX-08 Random Booster Vol.1", jp: "BX-08 ランダムブースター Vol.1" },
      "BX-14": { en: "BX-14 Dual Pack", jp: "BX-14 デュアルパック" },
      "BX-16": { en: "BX-16 Random Booster Vol.2", jp: "BX-16 ランダムブースター Vol.2" },
      "UX-00": { en: "UX-00 Ultimate Starter", jp: "UX-00 アルティメットスターター" },
      "CX-00": { en: "CX-00 Custom Line Set", jp: "CX-00 カスタムラインセット" },
    };

    const label = nameMap[code] ?? { en: `${code} Sealed Set`, jp: `${code} 未開封` };

    addProduct(products, seen, {
      id: productId("x", code, "sealed"),
      generation: "x",
      skuType: "sealed",
      nameEn: label.en,
      nameJp: label.jp,
      productCodes: [code],
      attrs: { line: code.split("-")[0] },
      partIds: codeParts,
    });
  }

  // CX-01 curated custom line starter
  addProduct(products, seen, {
    id: "prod-x-cx-01-starter",
    generation: "x",
    skuType: "starter",
    nameEn: "CX-01 Custom Line Starter",
    nameJp: "CX-01 カスタムライン スターター",
    productCodes: ["CX-01"],
    attrs: { line: "CX" },
    partIds: ["x-bx-01-blade", "x-ratchet-4-60", "x-bit-v"],
  });

  return products;
}

function buildBurstProducts(parts: PartDTO[]): ProductDTO[] {
  const products: ProductDTO[] = [];
  const seen = new Set<string>();

  const burstRecipes: Array<{
    code: string;
    layerId: string;
    discId?: string;
    driverId?: string;
    nameEn: string;
    nameJp: string | null;
  }> = [
    {
      code: "B-34",
      layerId: "burst-b-34-layer",
      discId: "burst-disc-12",
      driverId: "burst-driver-variable",
      nameEn: "Winning Valkyrie",
      nameJp: "ウィニングヴァルキリー",
    },
    {
      code: "B-97",
      layerId: "burst-b-97-layer",
      nameEn: "Heaven Pegasus",
      nameJp: "ヘブンペガサス",
    },
    {
      code: "B-127",
      layerId: "burst-b-127-layer",
      nameEn: "Cho-Z Spriggan",
      nameJp: "超Zスプリガン",
    },
    {
      code: "B-168",
      layerId: "burst-b-168-layer",
      discId: "burst-disc-over",
      driverId: "burst-driver-power",
      nameEn: "Dynamite Belial",
      nameJp: "ダイナマイトベリアル",
    },
  ];

  for (const r of burstRecipes) {
    const partIds = [r.layerId, r.discId, r.driverId].filter(Boolean) as string[];
    for (const skuType of ["starter", "complete_loose", "complete_sealed"] as SkuType[]) {
      const suffix =
        skuType === "complete_sealed"
          ? " (Sealed)"
          : skuType === "complete_loose"
            ? " (Complete)"
            : " Starter";
      addProduct(products, seen, {
        id: productId("burst", r.code, skuType),
        generation: "burst",
        skuType,
        nameEn: `${r.nameEn}${suffix}`,
        nameJp: r.nameJp
          ? `${r.nameJp}${skuType === "complete_sealed" ? " 未開封" : skuType === "complete_loose" ? " 完成品" : " スターター"}`
          : null,
        productCodes: [r.code],
        attrs: {},
        partIds,
      });
    }
  }

  addProduct(products, seen, {
    id: "prod-burst-b-00-sealed",
    generation: "burst",
    skuType: "sealed",
    nameEn: "B-00 Random Booster Vol.1",
    nameJp: "B-00 ランダムブースター Vol.1",
    productCodes: ["B-00"],
    attrs: { volume: 1 },
    partIds: ["burst-b-34-layer"],
  });

  // Popular Cho-Z / GT / Superking layers — complete_loose (layer-only recipe; disc/driver unknown)
  const layerOnlyNames = [
    "Achilles",
    "Spriggan",
    "Dragon",
    "Fafnir",
    "Diabolos",
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
    "Cobalt",
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
  for (const hint of layerOnlyNames) {
    const layer = layers.find((l) => l.nameEn.toLowerCase().includes(hint.toLowerCase()));
    if (!layer) continue;
    const code = layer.productCodes.find((c) => /^B-\d/.test(c)) ?? layer.productCodes[0] ?? layer.id;
    addProduct(products, seen, {
      id: `prod-burst-${slug(layer.nameEn)}-complete-loose`,
      generation: "burst",
      skuType: "complete_loose",
      nameEn: `${layer.nameEn} (Complete)`,
      nameJp: layer.nameJp ? `${layer.nameJp} 完成品` : null,
      productCodes: [code],
      attrs: { recipeKind: "partial", recipe: "layer_only" },
      partIds: [layer.id],
    });
  }

  return products;
}

function buildMetalProducts(parts: PartDTO[]): ProductDTO[] {
  const products: ProductDTO[] = [];
  const seen = new Set<string>();

  const bbStarters = [
    {
      code: "BB28",
      wheelId: "metal-storm-wheel",
      trackId: "metal-spin-track-105",
      tipId: "metal-wd-tip",
      nameEn: "Storm Pegasus",
      nameJp: "ストームペガサス",
    },
    {
      code: "BB30",
      wheelId: "metal-rock-wheel",
      trackId: "metal-wf2-track",
      tipId: "metal-wd-tip",
      nameEn: "Rock Leone",
      nameJp: "ロックレオーネ",
    },
    {
      code: "BB105",
      wheelId: "metal-storm-wheel",
      trackId: "metal-bb105-track",
      tipId: "metal-r2f-tip",
      nameEn: "Big Bang Pegasis F:D",
      nameJp: "ビッグバンペガシス",
    },
  ];

  for (const r of bbStarters) {
    const partIds = [r.wheelId, r.trackId, r.tipId];
    for (const skuType of ["starter", "complete_loose", "complete_sealed"] as SkuType[]) {
      const suffix =
        skuType === "complete_sealed"
          ? " (Sealed)"
          : skuType === "complete_loose"
            ? " (Complete)"
            : " Starter";
      addProduct(products, seen, {
        id: productId("metal", r.code, skuType),
        generation: "metal",
        skuType,
        nameEn: `${r.nameEn}${suffix}`,
        nameJp: r.nameJp
          ? `${r.nameJp}${skuType === "complete_sealed" ? " 未開封" : skuType === "complete_loose" ? " 完成品" : " スターター"}`
          : null,
        productCodes: [r.code],
        attrs: {},
        partIds,
      });
    }
  }

  // Metal Fight popular wheels — complete_loose (wheel-only; track/tip vary by release)
  const wheelHints = [
    "Lightning L-Drago",
    "Meteo L-Drago",
    "L-Drago Destructor",
    "Flame Sagittario",
    "Earth Eagle",
    "Dark Bull",
    "Thermal Lacerta",
    "Burn Fireblaze",
    "Gravity Destroyer",
    "Hell Kerbecs",
    "Basalt Horogium",
    "Twisted Tempo",
    "Death Quetzalcoatl",
    "Fang Leone",
    "Scythe Kronos",
    "Variares",
    "Diablo Nemesis",
    "Phantom Orion",
  ];

  const wheels = parts.filter((p) => p.generation === "metal" && p.partType === "metal_wheel");
  for (const hint of wheelHints) {
    const wheel = wheels.find((w) => w.nameEn.toLowerCase().includes(hint.toLowerCase()));
    if (!wheel) continue;
    const code = wheel.productCodes.find((c) => /^BB/i.test(c)) ?? wheel.productCodes[0] ?? wheel.nameEn;
    addProduct(products, seen, {
      id: `prod-metal-${slug(wheel.nameEn)}-complete-loose`,
      generation: "metal",
      skuType: "complete_loose",
      nameEn: `${wheel.nameEn} (Complete)`,
      nameJp: wheel.nameJp ? `${wheel.nameJp} 完成品` : null,
      productCodes: [code],
      attrs: { recipe: "wheel_only" },
      partIds: [wheel.id],
    });
  }

  return products;
}

function buildPlasticProducts(parts: PartDTO[]): ProductDTO[] {
  const products: ProductDTO[] = [];
  const seen = new Set<string>();

  const aStarters = [
    {
      code: "A-01",
      ringId: "plastic-dragoon-ring",
      diskId: "plastic-mg-weight",
      baseId: "plastic-dragoon-base",
      nameEn: "Dragoon S",
      nameJp: "ドラグーンS",
    },
    {
      code: "A-03",
      ringId: "plastic-driger-ring",
      diskId: "plastic-10-balance",
      baseId: "plastic-grip-base",
      nameEn: "Driger S",
      nameJp: "ドライガーS",
    },
    {
      code: "A-05",
      ringId: "plastic-salg-ring",
      diskId: "plastic-10-balance",
      baseId: "plastic-grip-base",
      nameEn: "Salamalyon",
      nameJp: "サラマリオン",
    },
  ];

  for (const r of aStarters) {
    const partIds = [r.ringId, r.diskId, r.baseId];
    for (const skuType of ["starter", "complete_loose", "complete_sealed"] as SkuType[]) {
      const suffix =
        skuType === "complete_sealed"
          ? " (Sealed)"
          : skuType === "complete_loose"
            ? " (Complete)"
            : " Starter";
      addProduct(products, seen, {
        id: productId("plastic", r.code, skuType),
        generation: "plastic",
        skuType,
        nameEn: `${r.nameEn}${suffix}`,
        nameJp: r.nameJp
          ? `${r.nameJp}${skuType === "complete_sealed" ? " 未開封" : skuType === "complete_loose" ? " 完成品" : " スターター"}`
          : null,
        productCodes: [r.code],
        attrs: { series: "Original" },
        partIds,
      });
    }
  }

  const arHints = [
    "Dragoon",
    "Dranzer",
    "Driger",
    "Draciel",
    "Wyborg",
    "Galleon",
    "Griffon",
    "Trygle",
    "Trygator",
    "Sonzong",
    "Gaia",
    "Dragoon V",
    "Dranzer V",
    "Driger V",
    "Draciel V",
  ];

  const rings = parts.filter((p) => p.generation === "plastic" && p.partType === "attack_ring");
  for (const hint of arHints) {
    const ring = rings.find((r) => r.nameEn.toLowerCase().includes(hint.toLowerCase()));
    if (!ring) continue;
    const code = ring.productCodes.find((c) => /^A-/i.test(c)) ?? ring.productCodes[0] ?? ring.nameEn;
    addProduct(products, seen, {
      id: `prod-plastic-${slug(ring.nameEn)}-complete-loose`,
      generation: "plastic",
      skuType: "complete_loose",
      nameEn: `${ring.nameEn} (Complete)`,
      nameJp: ring.nameJp ? `${ring.nameJp} 完成品` : null,
      productCodes: [code],
      attrs: { recipe: "attack_ring_only" },
      partIds: [ring.id],
    });
  }

  return products;
}

function validateProducts(products: ProductDTO[], parts: PartDTO[]): string[] {
  const partIds = new Set(parts.map((p) => p.id));
  const errors: string[] = [];
  for (const prod of products) {
    for (const pid of prod.partIds) {
      if (!partIds.has(pid)) errors.push(`${prod.id}: missing part ${pid}`);
    }
  }
  return errors;
}

function main() {
  const parts = loadJson<PartDTO[]>(join(dataDir, "parts.json"));
  const beybrew = loadJson<BeybrewData>(join(dataDir, "sources", "beyparts.json"));

  const products = [
    ...buildXProducts(parts, beybrew),
    ...buildBurstProducts(parts),
    ...buildMetalProducts(parts),
    ...buildPlasticProducts(parts),
  ].sort(
    (a, b) =>
      a.generation.localeCompare(b.generation) ||
      a.productCodes[0]!.localeCompare(b.productCodes[0]!) ||
      a.skuType.localeCompare(b.skuType)
  );

  const errors = validateProducts(products, parts);
  if (errors.length > 0) {
    console.error("Validation errors:", errors.slice(0, 20));
    process.exit(1);
  }

  const outPath = join(seedsDir, "products.json");
  writeFileSync(outPath, JSON.stringify(products, null, 2) + "\n");

  const byGen = Object.fromEntries(
    (["plastic", "metal", "burst", "x"] as Generation[]).map((g) => [
      g,
      products.filter((p) => p.generation === g).length,
    ])
  );

  console.log("Products built:");
  console.log(`  Total: ${products.length}`);
  console.log(`  By generation:`, byGen);
  console.log(`  Wrote ${outPath}`);
}

main();

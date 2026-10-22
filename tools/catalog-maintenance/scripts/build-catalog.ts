/**
 * Rebuild parts.json + aliases.json from upstream catalog sources.
 *
 * Sources (scavenge-first — see docs/ATTRIBUTIONS.md):
 * - yujinyuz/beybrew beyparts.json — Beyblade X parts (MasterData-derived)
 * - Beyblade Fandom wiki API — Burst / Metal / Plastic part categories
 * - data/seeds/curated-parts.json — hand-tuned EN/JP/ZH overrides (28 MVP parts)
 *
 * Usage: pnpm --filter @beyoracle/catalog-maintenance catalog:build
 *        CATALOG_SKIP_FANDOM=1  — X-only rebuild from vendored beyparts.json
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { AliasDTO, Generation, PartDTO } from "@beyoracle/shared";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "..", "..", "packages", "catalog", "data");
const seedsDir = join(dataDir, "seeds");
const sourcesDir = join(dataDir, "sources");

const FANDOM = "https://beyblade.fandom.com/api.php";
const PRODUCT_CODE_RE =
  /\b(BX-\d{2}|UX-\d{2}|CX-\d{2}|B-\d{2,3}|BB-?\d{2}[A-Z]?|A-\d{2}|D-\d+|DS-\d+|MD-\d+|WD-[A-Z0-9]+)\b/gi;

interface BeybrewPart {
  name: string;
  type?: string;
  line?: string;
  source?: string[];
  attack?: number;
  defense?: number;
  stamina?: number;
  alias?: string;
  spinType?: string;
  integratedRatchet?: string;
}

interface BeybrewData {
  blades: BeybrewPart[];
  assist_blades: BeybrewPart[];
  ratchets: BeybrewPart[];
  bits: BeybrewPart[];
  lock_chips: BeybrewPart[];
  over_blades: BeybrewPart[];
}

const FANDOM_CATEGORIES: Array<{
  category: string;
  generation: Generation;
  partType: string;
  prefix: string;
}> = [
  { category: "Category:Layers", generation: "burst", partType: "layer", prefix: "Layer - " },
  { category: "Category:Discs", generation: "burst", partType: "forge_disc", prefix: "Disc - " },
  { category: "Category:Drivers", generation: "burst", partType: "driver", prefix: "Driver - " },
  {
    category: "Category:Fusion_Wheels",
    generation: "metal",
    partType: "metal_wheel",
    prefix: "Fusion Wheel - ",
  },
  {
    category: "Category:Spin_Tracks",
    generation: "metal",
    partType: "spin_track",
    prefix: "Spin Track - ",
  },
  {
    category: "Category:Performance_Tips",
    generation: "metal",
    partType: "performance_tip",
    prefix: "Performance Tip - ",
  },
  {
    category: "Category:Attack_Rings",
    generation: "plastic",
    partType: "attack_ring",
    prefix: "Attack Ring - ",
  },
  {
    category: "Category:Blade_Bases",
    generation: "plastic",
    partType: "blade_base",
    prefix: "Blade Base - ",
  },
];

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normName(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function humanize(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .trim();
}

function extractProductCodes(texts: string[]): string[] {
  const codes = new Set<string>();
  for (const t of texts) {
    for (const m of t.matchAll(PRODUCT_CODE_RE)) {
      codes.add(m[0]!.toUpperCase());
    }
  }
  return [...codes].sort();
}

function loadJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

function mergePart(existing: PartDTO, incoming: PartDTO): PartDTO {
  return {
    ...incoming,
    ...existing,
    nameJp: existing.nameJp ?? incoming.nameJp,
    nameZh: existing.nameZh ?? incoming.nameZh,
    productCodes: [
      ...new Set([...existing.productCodes, ...incoming.productCodes]),
    ].sort(),
    attrs: { ...incoming.attrs, ...existing.attrs },
  };
}

function partKey(p: Pick<PartDTO, "generation" | "partType" | "nameEn">): string {
  return `${p.generation}:${p.partType}:${normName(p.nameEn)}`;
}

function codesOverlap(a: string[], b: string[]): boolean {
  if (a.length === 0 || b.length === 0) return false;
  const setB = new Set(b.map((c) => c.toUpperCase()));
  return a.some((c) => setB.has(c.toUpperCase()));
}

async function fetchFandomCategory(category: string): Promise<string[]> {
  const titles: string[] = [];
  let continueToken: string | undefined;

  do {
    const params = new URLSearchParams({
      action: "query",
      list: "categorymembers",
      cmtitle: category,
      cmlimit: "500",
      format: "json",
    });
    if (continueToken) params.set("cmcontinue", continueToken);

    const res = await fetch(`${FANDOM}?${params}`, {
      headers: { "user-agent": "BeyoracleCatalogBot/1.0 (github.com/beyoracle)" },
    });
    if (!res.ok) throw new Error(`Fandom ${category}: HTTP ${res.status}`);
    const json = (await res.json()) as {
      continue?: { cmcontinue?: string };
      query?: { categorymembers?: Array<{ title: string }> };
    };
    for (const m of json.query?.categorymembers ?? []) {
      titles.push(m.title);
    }
    continueToken = json.continue?.cmcontinue;
    await new Promise((r) => setTimeout(r, 200));
  } while (continueToken);

  return titles;
}

function importBeybrew(data: BeybrewData): PartDTO[] {
  const out: PartDTO[] = [];

  const add = (
    partType: "blade" | "ratchet" | "bit",
    entry: BeybrewPart,
    subType?: string
  ) => {
    const nameEn = humanize(entry.name);
    const sources = entry.source ?? [];
    const codes = extractProductCodes(sources);
    const nameSlug = slug(nameEn);

    let id: string;
    const starter = codes.find((c) => /^(BX|UX|CX)-\d{2}$/.test(c) && !/-00$/.test(c));

    if (partType === "blade") {
      // BX-00 / UX-00 are reused across many limited blades — name slug is stable.
      id = `x-blade-${nameSlug}`;
    } else if (partType === "ratchet") {
      id = `x-ratchet-${nameSlug}`;
    } else if (partType === "bit") {
      id = `x-bit-${slug(entry.alias ?? nameEn)}`;
    } else {
      id = `x-${partType}-${nameSlug}`;
    }

    // Preserve code-keyed ids for well-known starters when not already curated.
    if (partType === "blade" && starter) {
      const [line, num] = starter.split("-");
      const codeId = `x-${line!.toLowerCase()}-${num}-blade`;
      if (codeId === `x-bx-01-blade` || codeId === `x-bx-02-blade` || codeId === `x-bx-03-blade` || codeId === `x-bx-04-blade`) {
        id = codeId;
      }
    }

    out.push({
      id,
      generation: "x",
      partType,
      nameEn,
      nameJp: null,
      nameZh: null,
      productCodes: codes.length > 0 ? codes : [nameEn],
      attrs: {
        line: entry.line,
        type: entry.type,
        subType,
        attack: entry.attack,
        defense: entry.defense,
        stamina: entry.stamina,
        spinType: entry.spinType,
        source: "beybrew",
      },
    });
  };

  for (const b of data.blades) add("blade", b);
  for (const b of data.assist_blades) add("blade", b, "assist");
  for (const b of data.over_blades) add("blade", b, "over");
  for (const b of data.ratchets) add("ratchet", b);
  for (const b of data.bits) add("bit", b);
  for (const b of data.lock_chips) add("bit", b, "lock_chip");

  return out;
}

function importFandomTitle(
  title: string,
  generation: Generation,
  partType: string,
  prefix: string
): PartDTO | null {
  if (!title.startsWith(prefix)) return null;
  const rawName = title.slice(prefix.length).trim();
  if (!rawName) return null;

  const nameEn = rawName.replace(/\s*\((Hasbro|Takara Tomy)\)\s*$/i, "").trim();
  const variant = title.match(/\((Hasbro|Takara Tomy)\)/i)?.[1];

  const idPrefix =
    generation === "burst"
      ? `burst-${partType === "forge_disc" ? "disc" : partType}`
      : generation === "metal"
        ? `metal-${partType.replace(/_/g, "-")}`
        : `plastic-${partType.replace(/_/g, "-")}`;

  const id = `${idPrefix}-${slug(nameEn)}`;
  const codes = extractProductCodes([title, nameEn]);
  const displayName =
    partType === "forge_disc" ? `${nameEn} Forge Disc` : nameEn;

  return {
    id,
    generation,
    partType,
    nameEn: displayName,
    nameJp: null,
    nameZh: null,
    productCodes: codes.length > 0 ? codes : [nameEn],
    attrs: {
      source: "fandom",
      ...(variant ? { variant } : {}),
    },
  };
}

function buildAliases(parts: PartDTO[], curated: AliasDTO[]): AliasDTO[] {
  const aliases: AliasDTO[] = [...curated];
  const seen = new Set(aliases.map((a) => `${a.partId}:${a.text.toLowerCase()}`));

  const add = (partId: string, locale: AliasDTO["locale"], text: string, source: string) => {
    const t = text.trim();
    if (!t || t.length < 2) return;
    const key = `${partId}:${t.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    aliases.push({ partId, locale, text: t, source });
  };

  for (const part of parts) {
    if (part.nameJp) add(part.id, "ja", part.nameJp, "curated");
    if (part.nameZh) add(part.id, "zh", part.nameZh, "curated");
    for (const code of part.productCodes) {
      if (/^[A-Z0-9-]{2,}$/i.test(code)) {
        add(part.id, "en", code, "code");
      }
    }
    // Compact form without spaces (CJK listing style)
    const compact = part.nameEn.replace(/\s+/g, "");
    if (compact !== part.nameEn && compact.length >= 3) {
      add(part.id, "en", compact, "compact");
    }
  }

  return aliases;
}

async function main() {
  const curated = loadJson<PartDTO[]>(join(seedsDir, "curated-parts.json"));
  const curatedAliases = loadJson<AliasDTO[]>(join(seedsDir, "curated-aliases.json"));
  const beybrew = loadJson<BeybrewData>(join(sourcesDir, "beyparts.json"));

  const byId = new Map<string, PartDTO>();
  const byKey = new Map<string, string>();
  const byCode = new Map<string, string>();

  const register = (part: PartDTO) => {
    const existingId = byId.get(part.id);
    if (existingId) {
      byId.set(part.id, mergePart(byId.get(part.id)!, part));
    } else {
      byId.set(part.id, part);
    }
    const p = byId.get(part.id)!;
    byKey.set(partKey(p), part.id);
    for (const c of p.productCodes) {
      byCode.set(`${p.generation}:${p.partType}:${c.toUpperCase()}`, part.id);
    }
  };

  const absorb = (incoming: PartDTO) => {
    const key = partKey(incoming);
    if (byKey.has(key)) {
      const id = byKey.get(key)!;
      byId.set(id, mergePart(byId.get(id)!, incoming));
      return;
    }
    for (const c of incoming.productCodes) {
      const codeKey = `${incoming.generation}:${incoming.partType}:${c.toUpperCase()}`;
      // X product codes label SKUs/starter boxes shared across parts — name is the key.
      if (incoming.generation !== "x" && byCode.has(codeKey)) {
        const id = byCode.get(codeKey)!;
        byId.set(id, mergePart(byId.get(id)!, incoming));
        byKey.set(key, id);
        return;
      }
    }
    // Cross-match curated burst layers by B- code across part types
    if (incoming.generation === "burst" && incoming.productCodes.length > 0) {
      for (const [id, existing] of byId) {
        if (
          existing.generation === incoming.generation &&
          codesOverlap(existing.productCodes, incoming.productCodes)
        ) {
          byId.set(id, mergePart(existing, incoming));
          byKey.set(key, id);
          return;
        }
      }
    }
    register(incoming);
  };

  // Curated parts win — loaded first
  for (const p of curated) register(p);

  console.log("Importing BeyBrew X catalog...");
  for (const p of importBeybrew(beybrew)) absorb(p);

  if (process.env.CATALOG_SKIP_FANDOM !== "1") {
    console.log("Fetching Fandom wiki categories...");
    for (const spec of FANDOM_CATEGORIES) {
      const titles = await fetchFandomCategory(spec.category);
      console.log(`  ${spec.category}: ${titles.length} pages`);
      for (const title of titles) {
        const part = importFandomTitle(
          title,
          spec.generation,
          spec.partType,
          spec.prefix
        );
        if (part) absorb(part);
      }
    }
  } else {
    console.log("Skipping Fandom (CATALOG_SKIP_FANDOM=1)");
  }

  const parts = [...byId.values()].sort((a, b) =>
    a.generation.localeCompare(b.generation) ||
    a.partType.localeCompare(b.partType) ||
    a.nameEn.localeCompare(b.nameEn)
  );

  const aliases = buildAliases(parts, curatedAliases);

  writeFileSync(join(dataDir, "parts.json"), JSON.stringify(parts, null, 2) + "\n");
  writeFileSync(join(dataDir, "aliases.json"), JSON.stringify(aliases, null, 2) + "\n");

  const byGen = Object.fromEntries(
    (["plastic", "metal", "burst", "x"] as Generation[]).map((g) => [
      g,
      parts.filter((p) => p.generation === g).length,
    ])
  );

  console.log("\nCatalog built:");
  console.log(`  Total parts : ${parts.length}`);
  console.log(`  By generation:`, byGen);
  console.log(`  Aliases     : ${aliases.length}`);
  console.log(`  Wrote ${join(dataDir, "parts.json")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

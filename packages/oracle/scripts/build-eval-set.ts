/**
 * Build labeled eval set from catalog + known tricky titles.
 * Run: pnpm --filter @beyoracle/oracle eval:build
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadParts } from "@beyoracle/catalog";
import type { ListingShape, PartDTO } from "@beyoracle/shared";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "..", "fixtures", "eval-titles.json");

export interface EvalCase {
  title: string;
  expectedPartId: string | null;
  expectedShape: ListingShape;
  source: "synthetic" | "curated";
  note?: string;
}

function xBlades(parts: PartDTO[]): PartDTO[] {
  return parts.filter((p) => p.generation === "x" && p.partType === "blade");
}

function burstLayers(parts: PartDTO[]): PartDTO[] {
  return parts.filter((p) => p.generation === "burst" && p.partType === "layer");
}

function main() {
  const parts = loadParts();
  const cases: EvalCase[] = [];

  const push = (c: EvalCase) => cases.push(c);

  // --- Curated real-world patterns from probes ---
  const curated: EvalCase[] = [
    {
      title: "ベイブレードX ドランソード 3-60F 単品",
      expectedPartId: "x-bx-01-blade",
      expectedShape: "single_part",
      source: "curated",
    },
    {
      title: "【中古】ベイブレードX ドランソード BX-01 美品",
      expectedPartId: "x-bx-01-blade",
      expectedShape: "single_part",
      source: "curated",
    },
    {
      title: "ベイブレードXドランソード3-60F",
      expectedPartId: null,
      expectedShape: "complete_bey",
      source: "curated",
      note: "combo suffix without 単品",
    },
    {
      title: "ベイブレードX BX-01 スターター",
      expectedPartId: null,
      expectedShape: "complete_bey",
      source: "curated",
    },
    {
      title: "BX-01 ドランソード まとめ売り 10個セット",
      expectedPartId: null,
      expectedShape: "lot",
      source: "curated",
    },
    {
      title: "ベイブレードX Jリーグ BX-00 コバルトドラグーン ドランソード セット",
      expectedPartId: null,
      expectedShape: "lot",
      source: "curated",
    },
    {
      title: "戰鬥陀螺x 龙剑 3-60f 単品",
      expectedPartId: "x-bx-01-blade",
      expectedShape: "single_part",
      source: "curated",
      note: "Simplified Chinese via opencc",
    },
    {
      title: "【現貨】戰鬥陀螺X BX-01 龍劍 正版",
      expectedPartId: "x-bx-01-blade",
      expectedShape: "single_part",
      source: "curated",
    },
    {
      title: "WD-MG ウエイトディスク",
      expectedPartId: "plastic-mg-weight",
      expectedShape: "single_part",
      source: "curated",
    },
    {
      title: "Winning Valkyrie B-34 layer used",
      expectedPartId: "burst-b-34-layer",
      expectedShape: "single_part",
      source: "curated",
    },
    {
      title: "ベイブレード バースト 大量 まとめ 100個以上",
      expectedPartId: null,
      expectedShape: "lot",
      source: "curated",
    },
    {
      title: "戰鬥陀螺 全套 整組",
      expectedPartId: null,
      expectedShape: "lot",
      source: "curated",
    },
  ];
  cases.push(...curated);

  // --- Synthetic from X blades ---
  for (const part of xBlades(parts).slice(0, 40)) {
    const jp = part.nameJp ?? part.nameEn;
    const zh = part.nameZh;
    const code = part.productCodes.find((c) => /^BX-\d{2}$/.test(c));

    push({
      title: `ベイブレードX ${jp} ブレード 単品`,
      expectedPartId: part.id,
      expectedShape: "single_part",
      source: "synthetic",
    });

    if (code) {
      push({
        title: `ベイブレードX ${code} ${jp} 中古`,
        expectedPartId: part.id,
        expectedShape: "single_part",
        source: "synthetic",
      });
      push({
        title: `ベイブレードX ${code} スターター`,
        expectedPartId: null,
        expectedShape: "complete_bey",
        source: "synthetic",
      });
    }

    push({
      title: `ベイブレードX ${jp} 3-60F`,
      expectedPartId: null,
      expectedShape: "complete_bey",
      source: "synthetic",
    });

    push({
      title: `${jp} まとめ売り`,
      expectedPartId: null,
      expectedShape: "lot",
      source: "synthetic",
    });

    if (zh) {
      push({
        title: `戰鬥陀螺X ${zh} 單品`,
        expectedPartId: part.id,
        expectedShape: "single_part",
        source: "synthetic",
      });
    }
  }

  // --- Synthetic burst layers ---
  for (const part of burstLayers(parts).slice(0, 30)) {
    push({
      title: `${part.nameEn} layer ${part.productCodes[0] ?? ""} used`.trim(),
      expectedPartId: part.id,
      expectedShape: "single_part",
      source: "synthetic",
    });
    if (part.nameJp) {
      push({
        title: `ベイブレードバースト ${part.nameJp} レイヤー 単品`,
        expectedPartId: part.id,
        expectedShape: "single_part",
        source: "synthetic",
      });
    }
  }

  // --- Ratchets / bits (single part markers) ---
  for (const part of parts.filter((p) => p.generation === "x" && p.partType === "ratchet").slice(0, 15)) {
    push({
      title: `ベイブレードX ラチェット ${part.nameEn} のみ`,
      expectedPartId: part.id,
      expectedShape: "single_part",
      source: "synthetic",
    });
  }

  for (const part of parts.filter((p) => p.generation === "x" && p.partType === "bit").slice(0, 15)) {
    push({
      title: `BX ビット ${part.nameEn} バラ`,
      expectedPartId: part.id,
      expectedShape: "single_part",
      source: "synthetic",
    });
  }

  // Dedupe by title
  const seen = new Set<string>();
  const deduped = cases.filter((c) => {
    if (seen.has(c.title)) return false;
    seen.add(c.title);
    return true;
  });

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(deduped, null, 2) + "\n");
  console.log(`Wrote ${deduped.length} eval cases to ${outPath}`);
}

main();

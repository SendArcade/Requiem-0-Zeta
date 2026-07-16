/**
 * Locale-aware normalization for entity matching.
 * Uses wanakana (JP) and opencc-js (Trad→Simpl ZH). See docs/MATCHING_RESEARCH.md.
 */
import OpenCC from "opencc-js";
import { toKatakana, toRomaji } from "wanakana";

const twToCn = OpenCC.Converter({ from: "tw", to: "cn" });

const PROMO_STRIP =
  /【[^】]*】|［[^］]*］|\[[^\]]*\]|（[^）]*）|\([^)]*\)|[✨🔥💥★☆]/g;

const SHOPEE_PROMO =
  /現貨|免運|熱賣|爆款|台灣出貨|24H出貨|快速出貨|特價|優惠|限時|買一送一|交換禮物|兒童玩具/g;

function foldSmallKana(s: string): string {
  return s
    .replace(/ッ/g, "ツ")
    .replace(/ャ/g, "ヤ")
    .replace(/ュ/g, "ユ")
    .replace(/ョ/g, "ヨ")
    .replace(/ー/g, "");
}

function baseNormalize(s: string): string {
  return s
    .normalize("NFKC")
    .toLowerCase()
    .replace(PROMO_STRIP, " ")
    .replace(SHOPEE_PROMO, " ")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Primary normalized form for substring / token matching. */
export function normalizeForMatch(text: string): string {
  let s = baseNormalize(text);

  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) {
    s = foldSmallKana(toKatakana(s, { convertLongVowelMark: true }));
  }

  if (/[\u4e00-\u9fff]/.test(text)) {
    try {
      s = baseNormalize(twToCn(text));
    } catch {
      // opencc failure — keep base form
    }
  }

  return s;
}

/**
 * Alternate match keys so 龍劍/龙剑 and ドランソード/dransword hit the same catalog row.
 */
export function matchKeys(text: string): string[] {
  const keys = new Set<string>();

  const primary = normalizeForMatch(text);
  if (primary.length >= 2) keys.add(primary);

  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) {
    const romaji = baseNormalize(toRomaji(text));
    if (romaji.length >= 2) keys.add(romaji);
  }

  if (/[\u4e00-\u9fff]/.test(text)) {
    try {
      const simplified = baseNormalize(twToCn(text));
      if (simplified.length >= 2) keys.add(simplified);
    } catch {
      // ignore
    }
  }

  // Compact (no spaces) for unspaced CJK titles.
  const compact = primary.replace(/\s+/g, "");
  if (compact.length >= 2 && compact !== primary) keys.add(compact);

  return [...keys];
}

/** True if normalized forms overlap (either contains the other). */
export function normalizedContains(haystack: string, needle: string): boolean {
  const hKeys = matchKeys(haystack);
  const nKeys = matchKeys(needle);
  for (const h of hKeys) {
    for (const n of nKeys) {
      if (n.length < 2) continue;
      if (h.includes(n)) return true;
      // Block short haystack fragments (e.g. "ns" from stripped 【A01】 tags) matching inside romaji needles.
      if (n.includes(h) && h.length >= 4) return true;
    }
  }
  return false;
}

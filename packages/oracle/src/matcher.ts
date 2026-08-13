import type {
  AliasDTO,
  Generation,
  MatchMethod,
  PartDTO,
  ProductDTO,
  SkuType,
} from "@beyoracle/shared";
import {
  isCompEligible,
  isProductCompEligible,
  normalizeText,
  normalizedContains,
  textSimilarity,
} from "@beyoracle/shared";

/** Cascading matcher — pattern inspired by PokeDao CardMatcher */
export interface MatchCandidate {
  partId: string;
  confidence: number;
  method: MatchMethod;
}

export interface MatcherContext {
  parts: PartDTO[];
  aliases: AliasDTO[];
}

const PRODUCT_CODE_RE =
  /\b(BX-?\d{2}|UX-?\d{2}|CX-?\d{2}|B-?\d{2,3}|BB-?\d{2}[A-Z]?|A-?\d{1,2}|D-?\d+|DS-?\d+|MD-?\d+|WD-?[A-Z0-9]+|BB105|WF2|R2F|WD)\b/gi;

/**
 * Canonicalize catalog SKU tokens so live titles match seed codes.
 * BB28 → BB-28, BB01S → BB-01S, B34 → B-34, BX01 → BX-01, BB105 stays BB105.
 */
export function canonicalizeProductCode(code: string): string {
  const u = code.toUpperCase().replace(/\s+/g, "");
  if (/^(WF2|R2F|WD|BB105)$/.test(u)) return u;
  // Already hyphenated catalog forms
  if (/^(BX|UX|CX|BB|B|A|D|DS|MD|WD)-/.test(u)) return u;
  // Unhyphenated live-style: BB28, BB01S, B34, BX01, A01, WD-MG already hyphenated above
  // A-series plastic codes can be 1–2 digits (A-1, A-12).
  const aOnly = u.match(/^(A)(\d{1,2})$/);
  if (aOnly) return `A-${aOnly[2]}`;
  const m = u.match(/^(BX|UX|CX|BB|DS|MD|WD|B|D)(\d{2,3})([A-Z]?)$/);
  if (m) {
    const [, prefix, digits, suffix] = m;
    return `${prefix}-${digits}${suffix ?? ""}`;
  }
  return u;
}

/** Drop short codes subsumed by a longer extracted token (e.g. WD inside WD-MG). */
export function dedupeProductCodes(codes: string[]): string[] {
  const sorted = [...codes].sort((a, b) => b.length - a.length);
  return sorted.filter((code, i) => {
    return !sorted.some(
      (longer, j) =>
        j < i &&
        longer.length > code.length &&
        (longer.startsWith(`${code}-`) || longer.startsWith(`${code} `))
    );
  });
}

export function extractProductCodes(title: string): string[] {
  const matches = title.match(PRODUCT_CODE_RE) ?? [];
  const unique = [
    ...new Set(matches.map((m) => canonicalizeProductCode(m))),
  ];
  return dedupeProductCodes(unique);
}

const CATALOG_CODE_FORM =
  /^(BX-\d{2}|UX-\d{2}|CX-\d{2}|B-\d{2,3}|BB-?\d{2}[A-Z]?|A-\d{2}|D-\d+|DS-\d+|MD-\d+|WD-[A-Z0-9]+|BB105|WF2|R2F|WD)$/i;

/** Require hyphenated SKU tokens in the raw title — blocks fashion 【A01】 false positives. */
function formMatchesTitle(title: string, formText: string): boolean {
  const trimmed = formText.trim();
  if (CATALOG_CODE_FORM.test(trimmed)) {
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(title);
  }
  return normalizedContains(title, trimmed);
}

function partNames(part: PartDTO): string[] {
  return [part.nameEn, part.nameJp ?? "", part.nameZh ?? ""].filter(Boolean);
}

function titleContainsName(normTitle: string, part: PartDTO): boolean {
  return partNames(part).some((name) => {
    return name.length >= 2 && normalizedContains(normTitle, name);
  });
}


function distinctiveNames(part: PartDTO): string[] {
  return partNames(part).filter((n) => n.length >= 6);
}

/** Seller mislabel: title names a different part than the extracted product code. */
function titleConflictsWithOtherPart(
  title: string,
  part: PartDTO,
  ctx: MatcherContext
): boolean {
  if (titleContainsName(normalizeText(title), part)) return false;
  const selfNames = distinctiveNames(part);
  for (const other of ctx.parts) {
    if (other.id === part.id) continue;
    if (other.generation !== part.generation) continue;
    for (const name of distinctiveNames(other)) {
      if (!normalizedContains(title, name)) continue;
      if (selfNames.some((b) => b.includes(name) || name.includes(b))) continue;
      return true;
    }
  }
  return false;
}

function findByProductCode(
  title: string,
  ctx: MatcherContext,
  generation?: Generation
): MatchCandidate | null {
  const codes = extractProductCodes(title);
  if (codes.length === 0) return null;

  const normTitle = normalizeText(title);
  const candidates: PartDTO[] = [];

  const codeSet = new Set(codes.map(canonicalizeProductCode));
  for (const part of ctx.parts) {
    if (generation && part.generation !== generation) continue;
    for (const code of part.productCodes) {
      if (codeSet.has(canonicalizeProductCode(code))) {
        candidates.push(part);
        break;
      }
    }
  }

  if (candidates.length === 0) return null;
  if (candidates.length === 1) {
    if (titleConflictsWithOtherPart(title, candidates[0]!, ctx)) return null;
    return {
      partId: candidates[0]!.id,
      confidence: 0.98,
      method: "product_code",
    };
  }

  // Product codes label a SKU (starter box), not always one part — prefer name hit.
  const byName = candidates.filter((p) => titleContainsName(normTitle, p));
  if (byName.length === 1) {
    return {
      partId: byName[0]!.id,
      confidence: 0.95,
      method: "product_code",
    };
  }

  return null;
}

interface SurfaceForm {
  partId: string;
  text: string;
  generation: Generation;
}

function buildSurfaceForms(ctx: MatcherContext): SurfaceForm[] {
  const forms: SurfaceForm[] = [];
  const seen = new Set<string>();

  const push = (part: PartDTO, text: string) => {
    const norm = normalizeText(text);
    if (norm.length < 2) return;
    const key = `${part.id}:${norm}`;
    if (seen.has(key)) return;
    seen.add(key);
    forms.push({ partId: part.id, text, generation: part.generation });
  };

  for (const part of ctx.parts) {
    push(part, part.nameEn);
    if (part.nameJp) push(part, part.nameJp);
    if (part.nameZh) push(part, part.nameZh);
    for (const code of part.productCodes) push(part, code);
  }

  for (const alias of ctx.aliases) {
    const part = ctx.parts.find((p) => p.id === alias.partId);
    if (!part) continue;
    push(part, alias.text);
  }

  return forms.sort(
    (a, b) => normalizeText(b.text).length - normalizeText(a.text).length
  );
}

function findByExact(
  title: string,
  ctx: MatcherContext,
  generation?: Generation
): MatchCandidate | null {
  let best: MatchCandidate | null = null;
  let bestScore = 0;

  for (const form of buildSurfaceForms(ctx)) {
    if (generation && form.generation !== generation) continue;
    const normForm = normalizeText(form.text);
    if (normForm.length < 2) continue;
    if (!formMatchesTitle(title, form.text)) continue;

    let score = normForm.length;
    // Prefer CJK part names over bare ratchet dimensions like "3-60".
    if (/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(normForm)) {
      score += 12;
    }
    if (/^\d+-\d+[a-z]?$/i.test(normForm)) {
      score -= 8;
    }

    if (score > bestScore) {
      bestScore = score;
      best = {
        partId: form.partId,
        confidence: score >= 12 ? 0.92 : 0.88,
        method: "alias_exact",
      };
    }
  }

  return best;
}

function findByFuzzy(
  title: string,
  ctx: MatcherContext,
  generation?: Generation
): MatchCandidate | null {
  let best: MatchCandidate | null = null;

  for (const part of ctx.parts) {
    if (generation && part.generation !== generation) continue;

    const candidates = [
      ...partNames(part),
      ...part.productCodes,
      ...ctx.aliases.filter((a) => a.partId === part.id).map((a) => a.text),
    ].filter(Boolean);

    let maxSim = 0;
    for (const c of candidates) {
      const sim = textSimilarity(title, c);
      if (sim > maxSim) maxSim = sim;
    }

    const threshold = 0.28;
    if (maxSim >= threshold && (!best || maxSim > best.confidence)) {
      best = {
        partId: part.id,
        confidence: Math.min(0.85, maxSim),
        method: "alias_fuzzy",
      };
    }
  }

  return best;
}

export function matchTitle(
  title: string,
  ctx: MatcherContext,
  opts?: { generation?: Generation; minConfidence?: number }
): MatchCandidate | null {
  if (!isCompEligible(title)) return null;

  const minConfidence = opts?.minConfidence ?? 0.28;

  const byCode = findByProductCode(title, ctx, opts?.generation);
  if (byCode) return byCode;

  const byExact = findByExact(title, ctx, opts?.generation);
  if (byExact) return byExact;

  const byFuzzy = findByFuzzy(title, ctx, opts?.generation);
  if (byFuzzy && byFuzzy.confidence >= minConfidence) return byFuzzy;

  return null;
}

export function matchObservation(
  title: string,
  ctx: MatcherContext,
  opts?: { generation?: Generation }
): MatchCandidate | null {
  return matchTitle(title, ctx, opts);
}

export interface ProductMatcherContext {
  products: ProductDTO[];
}

export interface ProductMatchCandidate {
  productId: string;
  confidence: number;
  method: MatchCandidate["method"];
}

const SKU_TYPE_MARKERS: Record<SkuType, RegExp> = {
  starter: /スターター|starter|start dash|entry set|バトルエントリー/i,
  sealed: /未開封|新品未開封|sealed|nib|new in box/i,
  complete_sealed: /完成品.*未開封|complete.*sealed|未開封.*完成/i,
  complete_loose: /完成品|complete(?!.*sealed)|組立済|assembled/i,
};

/** Strip packaging suffix so "Winning Valkyrie Starter" matches titles with reordered words. */
function productNameBases(product: ProductDTO): string[] {
  const raw = [product.nameEn, product.nameJp ?? ""].filter((n) => n.length >= 2);
  const out = new Set<string>();
  for (const n of raw) {
    out.add(n);
    let base = n
      .replace(/\s*\((Complete|Sealed|Layer only)\)\s*$/i, "")
      .replace(/\s+(Starter|Complete|Sealed)\s*$/i, "")
      .trim();
    // Peel JP packaging tokens repeatedly (… スターター 未開封).
    for (let i = 0; i < 3; i++) {
      const next = base.replace(/\s+(スターター|完成品|未開封)\s*$/u, "").trim();
      if (next === base) break;
      base = next;
    }
    if (base.length >= 2) out.add(base);
  }
  return [...out];
}

function titleMatchesProductName(title: string, product: ProductDTO): boolean {
  return productNameBases(product).some((name) => {
    // Require substantial names; avoid "Valkyrie" false-hit inside "Winning Valkyrie".
    if (name.length < 4) return false;
    return normalizedContains(title, name);
  });
}

function scoreProductForTitle(product: ProductDTO, title: string): number {
  let score = 0;
  const hasStarterMarker = /スターター|starter|start dash|entry set|バトルエントリー/i.test(title);
  const hasSealedMarker = /未開封|新品未開封|sealed|nib|new in box/i.test(title);
  const hasCompleteMarker = /完成品|\bcomplete\b|\bassembled\b/i.test(title);
  const hasComboSuffix = /\d-\d{2}\s*[a-z]{1,3}\b/i.test(title);
  const isCompleteSealedTitle =
    hasSealedMarker &&
    (hasCompleteMarker || /完成品.*未開封|未開封.*完成|complete.*sealed/i.test(title));

  if (SKU_TYPE_MARKERS[product.skuType]?.test(title)) score += 4;

  if (titleMatchesProductName(title, product)) score += 3;

  const combo = product.attrs?.combo;
  if (typeof combo === "string" && combo.length >= 3) {
    if (normalizedContains(title, combo)) score += 2;
  }

  if (product.skuType === "starter" && hasStarterMarker) score += 1;
  // Prefer complete_sealed when title has both complete + sealed language.
  if (product.skuType === "complete_sealed" && isCompleteSealedTitle) score += 4;
  if (product.skuType === "complete_loose" && isCompleteSealedTitle) score -= 4;
  if (product.skuType === "starter" && isCompleteSealedTitle && !hasStarterMarker) score -= 3;
  // Metal/Plastic: combo in title (105RF, D125CS) + no starter word → prefer complete_loose.
  const hasMetalPlasticCombo =
    /\b\d{2,3}[A-Z]{1,3}\b|\b[A-Z]{1,2}\d{2,3}[A-Z]{0,3}\b/.test(title);
  if (
    product.skuType === "complete_loose" &&
    hasMetalPlasticCombo &&
    !hasStarterMarker &&
    !hasSealedMarker
  ) {
    score += 2;
  }
  if (
    product.skuType === "complete_loose" &&
    hasComboSuffix &&
    !hasStarterMarker &&
    !hasSealedMarker
  ) {
    score += 3;
  }
  if (
    product.skuType === "complete_loose" &&
    hasCompleteMarker &&
    !hasSealedMarker
  ) {
    score += 1;
  }
  if (product.skuType === "starter" && !hasStarterMarker && hasComboSuffix) {
    score -= 2;
  }
  // Bare complete (no starter) should not land on starter SKU.
  if (product.skuType === "starter" && hasCompleteMarker && !hasStarterMarker) {
    score -= 3;
  }
  // Default ambiguous whole-SKU (code+name, no packaging cue): prefer starter over loose.
  if (
    product.skuType === "starter" &&
    !hasStarterMarker &&
    !hasCompleteMarker &&
    !hasSealedMarker
  ) {
    score += 1;
  }
  if (
    product.skuType === "complete_loose" &&
    !hasCompleteMarker &&
    !hasMetalPlasticCombo &&
    !hasComboSuffix
  ) {
    score -= 1;
  }

  return score;
}

function isWholeBeyProductCandidate(product: ProductDTO): boolean {
  // Never auto-match partial/layer-only or sealed-box contents as whole-SKU comps.
  const recipe = product.attrs?.recipeKind;
  if (recipe === "partial" || recipe === "contents") return false;
  if (product.attrs?.recipe === "layer_only") return false;
  if (
    product.skuType !== "starter" &&
    product.skuType !== "complete_loose" &&
    product.skuType !== "complete_sealed" &&
    product.skuType !== "sealed"
  ) {
    return false;
  }
  return true;
}

/**
 * Seller mislabel guard: title carries another product's combo (or a longer exclusive
 * name) while not supporting this product's combo/name.
 */
function titleNamesConflictingProduct(
  title: string,
  product: ProductDTO,
  all: ProductDTO[]
): boolean {
  const selfNamed = titleMatchesProductName(title, product);
  const selfCombo =
    typeof product.attrs?.combo === "string" &&
    product.attrs.combo.length >= 3 &&
    normalizedContains(title, product.attrs.combo);

  const selfBases = productNameBases(product);

  const selfCodes = new Set(product.productCodes.map(canonicalizeProductCode));

  for (const other of all) {
    if (other.id === product.id) continue;
    if (!isWholeBeyProductCandidate(other)) continue;
    if (other.generation !== product.generation) continue;
    // Same catalog code family (starter/loose/sealed variants) is not a conflict.
    if (other.productCodes.some((c) => selfCodes.has(canonicalizeProductCode(c)))) {
      continue;
    }

    const otherCombo =
      typeof other.attrs?.combo === "string" &&
      other.attrs.combo.length >= 3 &&
      normalizedContains(title, other.attrs.combo);
    // Combo of a different SKU present, ours absent — classic mislabel (BB71 + D125CS).
    if (otherCombo && !selfCombo && !selfNamed) return true;

    // Longer exclusive name of another product (not a substring of our base names).
    for (const otherName of productNameBases(other)) {
      if (otherName.length < 6) continue;
      if (!normalizedContains(title, otherName)) continue;
      if (selfBases.some((b) => b.includes(otherName) || otherName.includes(b))) continue;
      if (!selfNamed && !selfCombo) return true;
    }
  }
  return false;
}
export function matchToProduct(
  title: string,
  ctx: ProductMatcherContext,
  opts?: { generation?: Generation; minConfidence?: number }
): ProductMatchCandidate | null {
  if (!isProductCompEligible(title)) return null;

  const codes = extractProductCodes(title);
  if (codes.length === 0) return null;

  const candidates: Array<{ product: ProductDTO; score: number }> = [];

  for (const product of ctx.products) {
    if (opts?.generation && product.generation !== opts.generation) continue;
    if (!isWholeBeyProductCandidate(product)) continue;
    if (titleNamesConflictingProduct(title, product, ctx.products)) continue;
    for (const code of product.productCodes) {
      const catalogCode = canonicalizeProductCode(code);
      if (codes.some((c) => canonicalizeProductCode(c) === catalogCode)) {
        candidates.push({ product, score: scoreProductForTitle(product, title) });
        break;
      }
    }
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0]!;
  const second = candidates[1];

  // Ambiguous duplicate codes — precision over recall
  if (candidates.length > 1 && best.score === 0) return null;
  if (second && best.score === second.score) return null;
  if (best.score < 2) return null;

  // Seller mislabel guard: code BB-71 + name/combo of a different SKU → reject
  if (titleNamesConflictingProduct(title, best.product, ctx.products)) {
    return null;
  }

  const confidence = Math.min(0.98, 0.88 + best.score * 0.025);
  const minConfidence = opts?.minConfidence ?? 0.9;
  if (confidence < minConfidence) return null;

  return {
    productId: best.product.id,
    confidence,
    method: "product_code",
  };
}

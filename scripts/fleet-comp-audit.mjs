/**
 * Two-pass fleet comp audit: discover filled marks, then deep-verify comps.
 * Usage: node scripts/fleet-comp-audit.mjs
 */
import {
  loadProducts,
  getPartById,
  loadProductMatcherContext,
  loadMatcherContext,
} from "../packages/catalog/dist/index.js";
import { analyzeProductRecipe } from "../packages/shared/dist/index.js";
import { resolveIngestMatch } from "../packages/ingest/dist/match-ingest.js";
import { isStaleOrWrongMatch } from "../packages/ingest/dist/purge-bad-comps.js";
import {
  classifyListingShape,
  looksLikeBeybladeListing,
  isProductCompEligible,
} from "../packages/shared/dist/index.js";
import { writeFileSync } from "node:fs";

const WEB = process.env.WEB_URL ?? "https://web-production-5c33a.up.railway.app";
const OUT = process.env.AUDIT_OUT ?? "/tmp/fleet-audit-report.json";

const JUNK =
  /フジミ|プラモデル|トヨタ|toyota|\bbmw\b|ヘッドランプ|headlamp|リーバイス|levis|denso|デンソー|ルアー|lure|ミラー|mirror|釣具|tackle|パナソニック|Panasonic|ストラーダ|メモリーナビ|ホンダ|Honda|プーリー|古着|ミリタリー|フィールドジャケット|ユーロ/i;
const BEY = /ベイ(?:ブレード|)|beyblade|メタルファイト|metal fight|タカラ|takara tom/i;

function publishableProducts() {
  return loadProducts().filter((p) => {
    const parts = p.partIds.map((id) => getPartById(id)).filter(Boolean);
    return analyzeProductRecipe(p, parts).canPublishMark;
  });
}

async function fetchProduct(id) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(`${WEB}/api/product/${encodeURIComponent(id)}`, {
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function extraGarbage(title, product) {
  if (JUNK.test(title)) return "non-bey-junk";
  const codes = product.productCodes ?? [];
  const hasHyphenCode = codes.some((c) =>
    title.toUpperCase().includes(c.toUpperCase())
  );
  const bareBb = /\bBB\d{2}\b/i.test(title) && !/\bBB-\d{2}/i.test(title);
  if (bareBb && !BEY.test(title)) return "bare-bb-no-bey-signal";
  if (!BEY.test(title) && !hasHyphenCode) return "weak-title-signal";
  return null;
}

function auditComp(productId, product, comp) {
  const title = comp.title ?? "";
  const conf = comp.matchConfidence ?? 0;
  const issues = [];

  if (!looksLikeBeybladeListing(title)) issues.push("not-beyblade");
  if (!isProductCompEligible(title)) issues.push("not-complete-bey");
  if (classifyListingShape(title) === "lot") issues.push("lot");

  const junk = extraGarbage(title, product);
  if (junk) issues.push(junk);

  if (isStaleOrWrongMatch(title, "product", productId, conf)) {
    const shape = classifyListingShape(title);
    const fresh = resolveIngestMatch(title, { shape });
    if (!fresh) issues.push("no-match");
    else if (fresh.kind !== "product") issues.push(`matched-part:${fresh.match.partId}`);
    else if (fresh.match.productId !== productId) {
      issues.push(`wrong-product:${fresh.match.productId}`);
    } else issues.push("stale-or-wrong");
  }

  if ((comp.matchConfidence ?? 1) < 0.6) issues.push("low-confidence");

  return issues;
}

async function pool(items, concurrency, fn) {
  const out = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  return out;
}

async function main() {
  console.log("[audit] warming matcher...");
  loadMatcherContext();
  loadProductMatcherContext();

  const products = publishableProducts();
  console.log(`[audit] pass 1 — discover marks among ${products.length} SKUs`);

  const discovered = await pool(products, 10, async (p, idx) => {
    if (idx > 0 && idx % 50 === 0) console.log(`  scan ${idx}/${products.length}`);
    const data = await fetchProduct(p.id);
    if (!data?.oracle || (data.oracle.nComps ?? 0) < 1) return null;
    return { product: p, data };
  });

  const filled = discovered.filter(Boolean);
  console.log(`[audit] pass 2 — deep verify ${filled.length} filled SKUs`);

  const reports = filled.map(({ product: p, data }) => {
    const markComps = (data.comps ?? []).filter((c) => c.inOracleMark);
    const allComps = (data.comps ?? []).map((c) => ({
      title: c.title,
      url: c.url,
      price: c.displayPrice ?? c.price,
      confidence: c.matchConfidence,
      method: c.matchMethod,
      inOracleMark: c.inOracleMark,
      issues: auditComp(p.id, p, c),
    }));
    const badInMark = allComps.filter((c) => c.inOracleMark && c.issues.length > 0);
    const hiddenBad = allComps.filter((c) => !c.inOracleMark && c.issues.length > 0);

    let status = "OK";
    if (badInMark.length > 0) status = "GARBAGE";
    else if (markComps.length === 0 && (data.oracle.nComps ?? 0) >= 1) {
      status = "HIDDEN_COMPS"; // mark exists but UI filters all comps out
    }

    return {
      id: p.id,
      code: p.productCodes?.[0],
      name: p.nameEn,
      generation: p.generation,
      skuType: p.skuType,
      mark: data.oracle.value,
      nComps: data.oracle.nComps,
      confidence: data.oracle.confidence,
      status,
      markCompCount: markComps.length,
      badInMark,
      hiddenBadCount: hiddenBad.length,
      comps: allComps,
    };
  });

  writeFileSync(OUT, JSON.stringify(reports, null, 2));

  const ok = reports.filter((r) => r.status === "OK");
  const garbage = reports.filter((r) => r.status === "GARBAGE");
  const hidden = reports.filter((r) => r.status === "HIDDEN_COMPS");

  console.log("\n=== SUMMARY ===");
  console.log(`  filled marks: ${reports.length}`);
  console.log(`  OK:           ${ok.length}`);
  console.log(`  GARBAGE:      ${garbage.length}`);
  console.log(`  HIDDEN_COMPS: ${hidden.length}`);
  console.log(`  report:       ${OUT}`);

  for (const gen of ["plastic", "metal", "burst", "x"]) {
    const g = reports.filter((r) => r.generation === gen);
    if (!g.length) continue;
    console.log(
      `  ${gen}: ${g.length} filled, ${g.filter((r) => r.status === "OK").length} ok, ${g.filter((r) => r.status === "GARBAGE").length} garbage`
    );
  }

  if (garbage.length) {
    console.log("\n=== GARBAGE MARKS ===");
    for (const r of garbage) {
      console.log(`\n  ${r.code} ${r.name} — ¥${r.mark} n=${r.nComps} bad=${r.badInMark.length}`);
      for (const c of r.badInMark.slice(0, 5)) {
        console.log(`    ✗ [${c.issues.join(", ")}] ¥${c.price} ${((c.confidence ?? 0) * 100).toFixed(0)}%`);
        console.log(`      ${c.title.slice(0, 95)}`);
      }
    }
  }

  if (hidden.length) {
    console.log("\n=== HIDDEN COMPS (mark exists, all comps filtered from UI) ===");
    for (const r of hidden) {
      console.log(`  ${r.code} ${r.name} — ¥${r.mark} n=${r.nComps} (stored comps filtered out)`);
    }
  }

  console.log("\n=== OK SAMPLE (first 10) ===");
  for (const r of ok.slice(0, 10)) {
    console.log(`  ${r.code} ${r.name} — ¥${r.mark} n=${r.nComps}`);
    for (const c of r.comps.filter((x) => x.inOracleMark).slice(0, 2)) {
      console.log(`    ✓ ¥${c.price} ${((c.confidence ?? 0) * 100).toFixed(0)}% ${c.title.slice(0, 85)}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

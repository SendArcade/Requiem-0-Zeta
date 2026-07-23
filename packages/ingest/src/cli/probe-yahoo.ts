#!/usr/bin/env tsx
/**
 * Measures matcher accuracy against real Yahoo Auctions JP sold listings.
 * Usage: YAHOO_AUCTIONS_ENABLED=1 pnpm --filter @beyoracle/ingest probe:yahoo [query...]
 */
import { loadMatcherContext } from "@beyoracle/catalog";
import { matchObservation } from "@beyoracle/oracle";
import { YahooAuctionsJpSource } from "../adapters/yahoo-auctions-jp.js";
import { looksLikeBundle } from "../types.js";

const DEFAULT_QUERIES = [
  "ベイブレードX ドランソード",
  "ベイブレードX ウィザードアロー",
  "ベイブレードX ラチェット",
  "ベイブレード バースト",
];

async function main() {
  if (process.env.YAHOO_AUCTIONS_ENABLED !== "1") {
    console.error("Set YAHOO_AUCTIONS_ENABLED=1 to probe the live endpoint.");
    process.exit(1);
  }

  const queries = process.argv.slice(2).length
    ? process.argv.slice(2)
    : DEFAULT_QUERIES;

  const perQuery = Number(process.env.PROBE_LIMIT ?? 50);
  const source = new YahooAuctionsJpSource();
  const ctx = loadMatcherContext();

  let total = 0;
  let matched = 0;
  let bundles = 0;
  let bundlesMatched = 0;
  const unmatchedSamples: string[] = [];
  const byMethod = new Map<string, number>();

  for (const query of queries) {
    const raw = await source.search(query, { limit: perQuery, status: "sold" });
    const live = raw.filter((r) => (r.raw as { live?: boolean })?.live);

    if (live.length === 0) {
      console.warn(`  ${query}: no live results`);
      continue;
    }

    let qMatched = 0;
    for (const listing of live) {
      const obs = source.normalize(listing);
      const match = matchObservation(obs.title, ctx);
      const bundle = looksLikeBundle(obs.title);

      total++;
      if (bundle) bundles++;
      if (match) {
        matched++;
        qMatched++;
        byMethod.set(match.method, (byMethod.get(match.method) ?? 0) + 1);
        if (bundle) bundlesMatched++;
      } else if (unmatchedSamples.length < 15) {
        unmatchedSamples.push(`${obs.price} JPY | ${obs.title}`);
      }
    }

    const pct = ((qMatched / live.length) * 100).toFixed(0);
    console.log(`  ${query} -> ${qMatched}/${live.length} matched (${pct}%)`);
  }

  const pct = (n: number) => (total ? ((n / total) * 100).toFixed(1) : "0.0");

  console.log("\n=== Yahoo Auctions JP live match report ===");
  console.log(`listings sampled : ${total}`);
  console.log(`matched          : ${matched} (${pct(matched)}%)`);
  console.log(`unmatched        : ${total - matched} (${pct(total - matched)}%)`);
  console.log(`bundle/lot titles: ${bundles} (${pct(bundles)}%)`);
  console.log(`bundles matched  : ${bundlesMatched}`);

  if (byMethod.size > 0) {
    console.log("\nmatch method breakdown:");
    for (const [method, count] of [...byMethod].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${method.padEnd(14)} ${count}`);
    }
  }

  if (unmatchedSamples.length > 0) {
    console.log("\nunmatched samples:");
    for (const title of unmatchedSamples) console.log(`  - ${title}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

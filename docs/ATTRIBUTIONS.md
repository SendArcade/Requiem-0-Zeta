# Attributions

Patterns and inspiration borrowed for Beyoracle MVP.

## Code patterns

| Source | What we adapted | Where |
|--------|-----------------|-------|
| [warmachine](https://github.com/memeticmachines/warmachine) | Typed job catalog, cron.tick fan-out, ingest_runs observability | `packages/jobs`, `packages/worker`, `packages/ingest/src/runs.ts` |
| [PokeDao](https://github.com/ChicoPanama/PokeDao) | Cascading CardMatcher (code → alias → fuzzy) | `packages/oracle/src/matcher.ts` |
| [opencc-js](https://github.com/nk2028/opencc-js) | Traditional→Simplified Chinese folding for TW listings | `packages/shared/src/normalize-match.ts` |
| [wanakana](https://github.com/WaniKani/WanaKana) | Katakana fold + romaji bridge for JP titles | `packages/shared/src/normalize-match.ts` |
| [AndreyAkinshin/perfolizer](https://github.com/AndreyAkinshin/perfolizer) | Weighted quantile / trimmed median pattern (oracle v2) | `packages/oracle/src/robust-estimator.ts` |
| [reidjohnson/hpipy](https://github.com/reidjohnson/hpipy) | Chained median-of-ratios cohort index (Apache-2.0) | `packages/oracle/src/cohort-index.ts` |
| [scikit-learn-contrib/category_encoders](https://github.com/scikit-learn-contrib/category_encoders) | James-Stein shrinkage for sparse comps (planned) | `docs/VALUATION_RESEARCH.md` |
| Apify `kitebuilds/resale-sold-comps` | Mercari sold-comps fallback provider (live + fixture shape) | `packages/ingest/src/adapters/apify/mercari-sold.ts` |
| Apify `jpmarketdata/yahoo-auction-sold-comps` | Yahoo closed-auction sold-comps fallback provider | `packages/ingest/src/adapters/apify/yahoo-sold.ts` |
| [CamelMart](https://camelmart.com) / Walmart US shelf | US retail ask reference (MSRP-oriented); not sold comps | `packages/ingest/src/adapters/walmart-us.ts` |
| Yahoo Auctions closed search | `__NEXT_DATA__` JSON parse for sold comps | `packages/ingest/src/adapters/yahoo-auctions/client.ts` |
| eBay sold search (free scrape) | `LH_Sold=1&LH_Complete=1` HTML parse — no Marketplace Insights API | `packages/ingest/src/adapters/ebay/client.ts` |

## Catalog seed data

Part names and product codes imported from public community references (see
`pnpm catalog:build`):

| Source | License | What we use |
|--------|---------|-------------|
| [yujinyuz/beybrew](https://github.com/yujinyuz/beybrew) `beyparts.json` | Open | Beyblade X blades/ratchets/bits (MasterData-derived) |
| [Beyblade Fandom wiki](https://beyblade.fandom.com) API | CC-BY-SA 3.0 | Burst layers/discs/drivers, Metal wheels/tracks/tips, Plastic rings/bases |
| Hand-curated seeds | — | `data/seeds/curated-parts.json` — JP/ZH names for MVP parts |

Prior references:

- [beybxdb.com](https://beybxdb.com) — cross-check only (on hiatus Feb 2025)
- Beyblade Burst / Metal Fight wikis — alias strings

External data is **import-only**; Beyoracle owns its schema and does not mirror third-party DBs verbatim.

## Legal note

Live scrapers are env-gated. Prefer commercial parsers or official APIs in production. See ingest adapter comments for ToS sensitivity.

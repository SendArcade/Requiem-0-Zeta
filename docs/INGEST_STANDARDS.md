# Ingest standards

Operational contract for Beyoracle pricing ingest. This doc consolidates
[docs/SOURCE_MAP.md §7](SOURCE_MAP.md), [blueprint/05-sources.md](../blueprint/05-sources.md),
and the adapter checklist used in code review.

**Before adding a venue:** read [docs/SOURCE_MAP.md](SOURCE_MAP.md) for access
mechanics — do not re-research from scratch. **Before building a scraper:**
search GitHub / Apify / sibling repos per
[`.cursor/rules/scavenge-first.mdc`](../.cursor/rules/scavenge-first.mdc).

---

## 1. The `PricingSource` contract

Every marketplace sits behind the same interface (pattern from
[tcg_mcp](https://github.com/seanlok/tcg-mcp)):

```typescript
interface PricingSource {
  readonly id: SourceId;
  search(query: string, opts?: SearchOpts): Promise<RawListing[]>;
  normalize(raw: RawListing): ObservationDTO;
}
```

Oracle core, matcher, and web UI stay adapter-agnostic. Swapping a self-hosted
scraper for Apify or a licensed API must not touch `packages/oracle` or
`apps/web`.

**Layout (Mercari is the reference):**

| Piece | Role |
|---|---|
| `adapters/<venue>-jp.ts` | Thin `PricingSource` — fixtures, env gates, provider chain |
| `adapters/<venue>/client.ts` | Self-scrape HTTP client — throttle, retries, pagination |
| `adapters/apify/*-sold.ts` | Optional Apify fallback provider for sold comps |
| Catalog fixtures | Offline CI + contributor path when live is off |

Attributions for borrowed shapes live in [docs/ATTRIBUTIONS.md](ATTRIBUTIONS.md).

---

## 2. Sold vs ask (non-negotiable)

Oracle Value is a median of **realized** sales. Classify every candidate source
on this axis before wiring it in.

| Class | Examples | Oracle use |
|---|---|---|
| **Sold comps** | Mercari `STATUS_SOLD_OUT`, Yahoo closed search, Apify sold actors | Primary comps input |
| **US retail ask** | Walmart US (`walmart_us`), Amazon US (`amazon_us`) | Retail reference band when sold depth thin — MSRP-skew OK; **never** median input |
| **Ask / retail (JP)** | Suruga-ya shelf price, Mandarake list, Shopee active listing | Floor / sentiment only — not median input |
| **Demand weights** | Shopee `historical_sold`, Ruten `sold_count` | Units moved at unknown price — never a comp |

Persist `status: "sold" | "listing"` at the schema level. Reject ask-only rows
from product comp pools unless explicitly tagged as non-comp signals.

---

## 3. Provider chains (self-scrape + Apify fallback)

Shipped JP sold-comp sources use a **primary self-hosted path** with an optional
**Apify fallback** when Railway/datacenter egress is blocked or brittle.

### Mercari JP

| Order | Provider | Mechanism |
|---|---|---|
| 1 (default) | `dpop` | `api.mercari.jp/v2/entities:search` + ES256 DPoP proof |
| 2 (fallback) | `apify` | Actor [`kitebuilds/resale-sold-comps`](https://apify.com/kitebuilds/resale-sold-comps) |

### Yahoo Auctions JP

| Order | Provider | Mechanism |
|---|---|---|
| 1 (default) | `self` | Closed search HTML → embedded `__NEXT_DATA__` JSON |
| 2 (fallback) | `apify` | Actor [`jpmarketdata/yahoo-auction-sold-comps`](https://apify.com/jpmarketdata/yahoo-auction-sold-comps) |

Implementation: `packages/ingest/src/adapters/apify/client.ts` (REST, no npm
client) + venue-specific mappers in `mercari-sold.ts` / `yahoo-sold.ts`.

### Env vars

| Variable | Purpose |
|---|---|
| `MERCARI_API_ENABLED=1` | Turn on live Mercari search (default off → fixtures) |
| `YAHOO_AUCTIONS_ENABLED=1` | Turn on live Yahoo closed search |
| `MERCARI_LIVE_PROVIDER` | Comma chain: `dpop`, `apify`, or `dpop,apify` (default: `dpop`, then `apify` when `APIFY_TOKEN` set) |
| `YAHOO_LIVE_PROVIDER` | Comma chain: `self`, `apify`, or `self,apify` (default: `self`, then `apify` when `APIFY_TOKEN` set) |
| `WALMART_API_ENABLED=1` | Live Walmart US retail search (ask/listing — not sold comps) |
| `WALMART_MARKET_INGEST=1` | Persist Walmart listing rows during ingest |
| `WALMART_PUBLISHER_ID` / `WALMART_CONSUMER_ID` / `WALMART_ACCESS_TOKEN` | Optional Affiliate API (preferred over HTML scrape) |
| `AMAZON_API_ENABLED=1` | Live Amazon US retail search (ask/listing — not sold comps) |
| `AMAZON_MARKET_INGEST=1` | Persist Amazon listing rows during ingest |
| `AMAZON_ACCESS_KEY` / `AMAZON_SECRET_KEY` / `AMAZON_PARTNER_TAG` | Optional Product Advertising API (preferred over HTML scrape) |
| `WORKER_INGEST_SOURCES` | Comma list — dedicated worker only polls these sources (see [`docs/US_RETAIL_WORKERS.md`](US_RETAIL_WORKERS.md)) |
| `APIFY_TOKEN` | Apify API token — enables fallback (and explicit `apify` primary) |
| `APIFY_TIMEOUT_MS` | Local fetch timeout for sync actor runs (default 330000) |
| `MERCARI_STRICT=1` / `YAHOO_AUCTIONS_STRICT=1` | Throw on live failure instead of fixtures |
| `MERCARI_MIN_INTERVAL_MS`, `MERCARI_MAX_PAGES` | DPoP client politeness |
| `YAHOO_MIN_INTERVAL_MS`, `YAHOO_MAX_PAGES`, `YAHOO_CIRCUIT_FAILURES` | Self-scrape politeness + circuit breaker |
| `YAHOO_NORMALIZE_HYPHEN_QUERIES=1` | Rewrite `Absorb-S` → `Absorb S` (Yahoo 404 on hyphen form) |

**Apify fallback:** optional — requires `APIFY_TOKEN` (paid). **Skip when no budget;** DPoP + Yahoo self-scrape remain primary.

```bash
MERCARI_API_ENABLED=1 MERCARI_LIVE_PROVIDER=apify APIFY_TOKEN=*** ...
YAHOO_AUCTIONS_ENABLED=1 YAHOO_LIVE_PROVIDER=apify APIFY_TOKEN=*** ...
```

**Cost note (from SOURCE_MAP):** Mercari Apify actor ≈ $2 / 1k sold rows (PPE).
Yahoo Apify actor ≈ $20 / 1k keyword analyses — use as **fallback**, not default
cron path, unless self-scrape is consistently blocked.

---

## 4. Cross-cutting ingest rules

From SOURCE_MAP §7 — apply to every adapter:

1. **Query in the local language.** Mercari/Yahoo rank Japanese keywords far
   better than romanized strings. Ruten/Shopee TW need Traditional Chinese
   (`戰鬥陀螺X`). Drive queries from catalog aliases per source, not display names
   alone.
2. **Lot and bundle detection is mandatory.** Titles like `2個セット`, `まとめ売り`,
   `×10` must never enter the median unfiltered. Use `looksLikeBundle` /
   `isCompEligible` before persist (see `packages/ingest/src/persist.ts`).
3. **Separate ask from sold at the schema level.** Demand counters are not comps.
4. **Store no seller PII.** Keep aggregate rating if useful; drop seller IDs and
   usernames (JP APPI / TW PDPA posture).
5. **Persist raw payloads** in `observations.raw_json` with `provider` and
   `live: true` so rematch can rerun without re-fetching.
6. **Throttle by default.** Mercari 1.2s, Yahoo 1.5s minimum interval — good
   citizen on public endpoints.
7. **Fixtures always available.** Live paths are env-gated; CI never depends on
   marketplace uptime or Apify billing.

---

## 5. Adding a new source (checklist)

1. Read [docs/SOURCE_MAP.md](SOURCE_MAP.md) — confirm sold vs ask and priority.
2. Add `SourceId` + `SOURCE_MASK` bit in `packages/shared/src/index.ts`.
3. Implement `PricingSource` under `packages/ingest/src/adapters/`.
4. Add catalog fixtures for offline/CI.
5. Gate live path: `<SOURCE>_API_ENABLED=1`, fixtures fallback, optional
   `<SOURCE>_STRICT=1`.
6. If Apify actor exists, add `adapters/apify/<venue>-sold.ts` + env chain —
   do not fork oracle core.
7. Register in `packages/ingest/src/pipeline.ts`.
8. Add probe CLI if sold comps (`probe:<venue>`) and record baseline in this doc
   or [docs/CURRENT_STATE.md](CURRENT_STATE.md).
9. Cite borrowed patterns in [docs/ATTRIBUTIONS.md](ATTRIBUTIONS.md).

Nothing in `oracle` or `web` should need editing for a new comps source.

---

## 6. Probe bars (matcher accuracy)

Probes measure **matcher hit rate on live sold titles**, not adapter plumbing.
Fixtures-only runs validate wiring only.

Run from repo root (needs network; no local pricing DB):

```bash
MERCARI_API_ENABLED=1 pnpm --filter @beyoracle/ingest probe:mercari
YAHOO_AUCTIONS_ENABLED=1 pnpm --filter @beyoracle/ingest probe:yahoo
```

**Required** after any matcher or catalog alias change. Optional after pure
adapter/provider changes if mapping/normalization changed.

### Baselines (2026-07/08, matcher v3.1)

| Source | Matched | Bundle/lot titles | Notes |
|---|---:|---:|---|
| Mercari JP | **42/198 (21.2%)** | 86 | Stricter gen scoring vs v2; 0 bundles matched (good) |
| Yahoo Auctions JP | **96/200 (48.0%)** | 47 | Highest JP sold volume; 0 bundles matched |

Lower Mercari headline % vs v2 is expected — fewer false-positive gen matches,
not worse recall on correct-gen titles. ~24–40% of JP sold rows are lots/bundles
that must never become comps regardless of match rate.

Probe output tags live rows via `raw.live === true` and `raw.provider` (`dpop`,
`self`, or `apify`). Apify fallback rows must pass the same bundle gates.

---

## 7. Persist and comp eligibility

Before inserting `product_matches` / part matches:

- `isProductCompEligible` / `isCompEligible` (shape + bundle gates)
- Product-first matcher confidence routing (`packages/ingest/src/persist.ts`)

Re-ingest does not fix bad identity — it multiplies garbage. Harden matcher +
purge before scaling fleet shards.

---

## 8. Railway vs local

**System of record:** Railway Postgres + Redis + workers only. See
[docs/RAILWAY_ONLY.md](RAILWAY_ONLY.md) and
[`.specify/memory/constitution.md`](../.specify/memory/constitution.md).

- Local: unit tests, typecheck, fixtures ingest, probes with live env vars.
- Railway: backfill, purge, recompute, coverage, production cron.

Do not `docker compose up` or `pnpm db:seed` expecting production oracle data.

---

## Related docs

- [docs/SOURCE_MAP.md](SOURCE_MAP.md) — full venue research and phased roadmap
- [blueprint/05-sources.md](../blueprint/05-sources.md) — blueprint summary
- [blueprint/06-matching.md](../blueprint/06-matching.md) — matcher + bundle rules
- [docs/CURRENT_STATE.md](CURRENT_STATE.md) — env table and live path notes
- [docs/ATTRIBUTIONS.md](ATTRIBUTIONS.md) — Apify actor citations

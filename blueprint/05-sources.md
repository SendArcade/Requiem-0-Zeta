# 05 — Pricing sources

[← Blueprint index](README.md) · Prev: [04-data-model](04-data-model.md) · Next: [06-matching](06-matching.md)

This is the working summary. The full ranked research — access mechanics,
costs, ToS risk, per-country tables — is
[docs/SOURCE_MAP.md](../docs/SOURCE_MAP.md). Read that before adding a venue.

## The axis that matters: sold vs ask

Most marketplaces expose only **active listings**, meaning asking prices. Asking
prices are aspirational and include items that will never sell. Oracle Value is
a median of **realized** sales, so a source that cannot give us sold prices is
an identity or sentiment source, not a comps source.

Classify every candidate on this axis first.

## Shipped

| Source | Status | Access |
|---|---|---|
| **Mercari JP** | Live + fixtures | `api.mercari.jp` DPoP search, `STATUS_SOLD_OUT` |
| **Yahoo Auctions JP** | Live + fixtures | Closed search `__NEXT_DATA__`, ~46k sold / 180d |
| **Shopee TW** | Fixtures only | Public API blocked (403); needs commercial parser |

Mercari is the reference adapter — see [03-architecture](03-architecture.md).

## Ingest order

Condensed from [docs/SOURCE_MAP.md §6](../docs/SOURCE_MAP.md). The ordering is
deliberate: identity work is sequenced *before* extra venues, because every
additional marketplace multiplies matcher error.

| Phase | Source | Why here |
|---|---|---|
| 2 | **Yahoo Auctions JP closed search** | Highest ROI by a wide margin. ~46k sold Beyblade X records per 180 days, server-rendered, no auth, and it covers Yahoo!フリマ in the same response |
| 3 | **Catalog hardening (L0)** | Takara Tomy `MasterData.json` + Fandom alias dump. Fix identity before adding venues |
| 4 | **Ruten TW** | Semi-public JSON, 12k+ listings, cumulative sold counts. The TW depth Shopee alone lacks |
| 5 | **Suruga-ya, Mandarake** | Dealer ask *and buyback* give a defensible price floor; Mandarake adds vintage Plastic/HMS |
| 6 | **eBay Browse API** | Sanctioned, free, zero legal risk. Western ask prices and `gtin`/`epid` identity — explicitly not comps |
| 7 | **Aucfan** | Only if we need history beyond 180 days. Licensable rather than scraped, so it is the defensible option |

**Never:** Facebook Marketplace (login-walled, ToS-violating, PII-heavy) and
PriceCharting (verified zero Beyblade coverage).

## Adding a source

1. Read [docs/SOURCE_MAP.md](../docs/SOURCE_MAP.md) for the access path — do not
   re-research it.
2. Add the ID to `SOURCES` and `SOURCE_MASK` in
   [`packages/shared/src/index.ts`](../packages/shared/src/index.ts), using the
   next power of two.
3. Implement `PricingSource` in `packages/ingest/src/adapters/`. Follow the
   Mercari layout: a thin adapter over a `client.ts` that owns throttling,
   retries, and pagination.
4. Commit fixtures so CI and offline contributors keep working.
5. Gate the live path behind `<SOURCE>_API_ENABLED=1` and fall back to fixtures.
6. Register it in [`packages/ingest/src/pipeline.ts`](../packages/ingest/src/pipeline.ts).
7. Add the source label so the UI can render the toggle.

Nothing in `oracle` or `web` should need editing.

## Operating rules

- **Throttle by default.** Mercari uses a 1.2s minimum interval. Be a good
  citizen; these are unauthenticated public endpoints.
- **Persist raw payloads** into `observations.raw_json` so matching can be
  re-run without re-fetching.
- **Keyword-driven, not full-catalog.** Drive queries from catalog aliases and
  watchlist demand rather than crawling everything.
- **Prefer commercial parsers or official APIs** where they exist. Live
  scrapers stay env-gated and off by default.

---

See also: [02-landscape](02-landscape.md) · [03-architecture](03-architecture.md) · [docs/SOURCE_MAP.md](../docs/SOURCE_MAP.md)

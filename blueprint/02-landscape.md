# 02 — The current space

[← Blueprint index](README.md) · Prev: [01-thesis](01-thesis.md) · Next: [03-architecture](03-architecture.md)

Full research with access mechanics and costs lives in
[docs/SOURCE_MAP.md](../docs/SOURCE_MAP.md). This page is the summary an agent
needs to reason about positioning.

## Market conditions

Takara Tomy publicly apologised in May 2026 for Beyblade X stock-outs, saying
demand "significantly exceeded expectations," and promised more production.
Scalping filled the gap: DMM Kuji lottery exclusives like Hover Wyvern 2-80GN
moved from roughly $70–80 CAD in November 2025 to $200–417 at Western
importers. Supply-constrained hype plus fragmented, multilingual liquidity is
exactly the condition that makes a pricing oracle valuable.

Liquidity concentrates in Asia, not the West. Japan is the source of rare and
limited stock; Taiwan carries the highest everyday volume; Hong Kong has an
active community with thinner formal marketplaces.

## Who else is in this space

| Player | What it does | Threat |
|---|---|---|
| **321GoShoot "Bey Market"** | HK/TW app with candlestick charts, region-aware buyer quotes, orders feed, battle map, AI identifier | The only real competitor |
| **BeybladeHub.app** | TW parts database, tier lists, tournament calendar, store maps | Not a competitor — no pricing. Possible partner and ZH alias source |
| **BeySpin** | App Store AI scanner claiming "market value," subscription-gated | Low credibility, but proves demand for "what is mine worth" |
| **WBO Price Reference List** | Hand-curated, NIB, USD, legacy-weighted | Sanity band for old generations, not comps |
| **camelcamelcamel** | Amazon price history, some Takara Tomy ASINs | Retail signal only |

## Our wedge against 321GoShoot

Their "buyer quotes" and "latest orders feed" language points to an in-app
order book of user-submitted quotes rather than marketplace-derived comps.

That gives them one genuine advantage: it reflects what HK/TW bladers will
actually pay each other today. It also gives them two structural weaknesses. It
only works where they already have liquidity, and a candlestick chart built on
sparse user quotes is both noisy and gameable.

**Our differentiation is provenance.** A median and IQR over thousands of
verified realized sales, with per-source toggles so a user can see exactly
which marketplaces produced the number. They own community liquidity; we own
auditable evidence.

## Three findings that should change your plans

1. **Yahoo Auctions Japan closed search is the biggest unclaimed win.** Around
   46,000 sold Beyblade X records per rolling 180 days, server-rendered, no
   login or token, and it silently includes Yahoo!フリマ results. Materially
   easier to ingest than Mercari and an order of magnitude more volume.
2. **PriceCharting has zero Beyblade coverage.** A search returns 49 items,
   all video games and Funko Pops. Do not buy a subscription.
3. **eBay sold prices are effectively unobtainable.** Marketplace Insights is
   a manually gated Limited Release; the legacy Finding API shut down in early
   2025. Treat eBay as an ask-price and identity source only.

There is also **no community sold-price dataset** to bootstrap from. WBO's
marketplace is forum prose, and the Beyblade Discord price bot runs a simulated
in-game economy. We have to build the comps layer ourselves.

## What this implies

Ingest priority is set in [05-sources](05-sources.md) and detailed in
[docs/SOURCE_MAP.md §6](../docs/SOURCE_MAP.md). The short version: Yahoo
Auctions next, then fix catalog identity before adding any further venues,
because every extra marketplace multiplies matcher error.

---

See also: [05-sources](05-sources.md) · [06-matching](06-matching.md) · [10-roadmap](10-roadmap.md)

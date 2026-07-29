# Beyoracle — Pricing & Catalog Source Map

_Researched 2026-07-28. Verified against live endpoints where noted._

Scope: ranked map of secondary-market pricing sources and catalog/identity sources for the Beyblade
oracle, beyond the shipped Mercari JP + Shopee TW adapters.

**Sold vs ask** is the axis that matters most. Most marketplaces expose only *active listings*
(asking prices). Only a handful expose *realized sale prices*. The ranking below weights
sold-price availability heavily, because Oracle Value is a median of realized comps.

---

## 1. Headline findings

1. **Yahoo Auctions Japan closed search (落札相場) is the single biggest unclaimed win.**
   Verified live: `auctions.yahoo.co.jp/closedsearch` for `ベイブレードX` returns **46,416 sold
   records over a rolling 180-day window**, server-rendered HTML, no login, no token, no DPoP.
   Each row carries final sold price (落札), condition grade, seller rating %, ship-from
   prefecture, and end timestamp. It also silently aggregates **Yahoo!フリマ** (Yahoo Flea Market)
   sold items, so one adapter covers two marketplaces. This is materially easier to ingest than
   Mercari JP and roughly an order of magnitude more sold volume than anything else we found.

2. **PriceCharting does not cover Beyblade.** Verified: a `beyblade` search returns 49 items,
   all of which are video games, Funko Pops, a comic, and a strategy guide. Zero physical tops,
   blades, ratchets, or bits. Their API also explicitly excludes historic prices and historic
   sales. Do not buy a Legendary subscription for this.

3. **eBay Marketplace Insights is effectively unobtainable.** It is a Limited Release API gated
   behind manual business-case review. A developer publicly documented their denial with eBay's
   verbatim response: *"Access to this API is highly limited and generally reserved for eBay's
   approved partners only."* The legacy Finding and Shopping APIs were shut down in early 2025.
   What remains publicly available is the Browse API, which is **active listings only**.
   Plan for eBay as an ask-price and identity source, not a comps source.

4. **The best catalog source is Takara Tomy's own mobile app.** The official BEYBLADE X Android
   app ships a `MasterData.json` at `Android/data/jp.co.takaratomy.beyblade/files/MasterData.json`
   containing first-party part data. The `yujinyuz/beybrew` deck builder already derives its parts
   database from it. Paired with Takara Tomy's public product list page, this gives an
   authoritative L0 identity layer keyed on real BX/UX/CX product codes.

5. **We have one real competitor: 321GoShoot's "Bey Market."** HK/TW community app with a
   per-Beyblade candlestick price chart, region-aware buyer quotes, and a latest-orders feed.
   See §5 for an assessment of what their data probably is and where the gap is.

6. **No Beyblade community sold-price dataset exists.** The WBO marketplace is unstructured MyBB
   forum threads with prices in free text. The WBO Beywiki Price Reference List is hand-curated,
   NIB-only, USD, and weighted toward legacy generations. There is no scrapeable trade log,
   no price Discord bot, no maintained spreadsheet.

---

## 2. Ranked source table

Priority: **P0** = ingest next, **P1** = ingest after, **P2** = opportunistic, **P3** = skip.

### Japan

| Source | Official API? | Sold or ask | Realistic access path | Rough cost | Data quality for collectibles | Legal / ToS risk | Priority |
|---|---|---|---|---|---|---|---|
| **Yahoo Auctions JP + Yahoo!フリマ** (closedsearch) | No. Legacy Auctions API deprecated ~2009-era, dead. | **Sold** (落札価格), 180-day window, plus bids | **Self-scrape** — server-rendered HTML, unauthenticated, verified working. Apify fallbacks: `jpmarketdata/yahoo-auction-sold-comps` (returns median/avg/quartiles directly), `contented_eyebrow/yafuoku-closedsearch-crawler`, `jungle_synthesizer/yahoo-auctions-japan-marketplace-scraper` | Self-scrape ≈ free (proxy only). Apify PPE actors observed at $5–20 / 1,000 results | **Excellent.** Highest sold volume of any source. Condition grade, seller rating, region, end time, bid count | Low-moderate. Public, no login, no auth bypass. Rate-limit politely; store no seller PII | **P0** |
| **Mercari JP** (shipped) | No public API, no developer program | **Sold** via `sold_out` status filter | Self-signed DPoP (ES256) against `api.mercari.jp/v2/entities:search`. Libraries: `mercapi` (Python), `mercapi-node`. Apify: `kitebuilds/resale-sold-comps` (JP verified live, returns median/p25/p75), `japandatalab/mercari-japan-sold-listings-scraper`, `datalab-jp/mercari-scraper` | Self-host ≈ free but brittle. `kitebuilds` actor ~$2 / 1,000 sold records. JP residential proxy recommended (~$8/GB on Apify) | **Very good.** C2C, deep long tail, condition grades. Search is tuned for Japanese input — always query in Japanese | Moderate. No ToS contemplates third-party access. No account = no ban vector. JP APPI applies if you store seller identifiers — don't | **Shipped** |
| **Aucfan** (aggregates Yahoo Auctions, Mercari, Rakuma, Mbok, Amazon, Yahoo Shopping) | **Yes** — official data API + an MCP server launched Dec 2025. Sales-contact only, no self-serve | **Sold**, up to 10 years, ~70B records | Official API (contact sales) is the clean path. Consumer Premium is ¥2,200/mo and gates historical prices + image search. Apify: `jungle_synthesizer/aucfan-japan-auction-sold-price-database-scraper` | Premium ¥2,200/mo. API pricing undisclosed — enterprise/reuse-industry oriented | **Good breadth, paywalled depth.** Verified: free tier shows almost nothing; prices hidden behind Premium. Value is *historical backfill*, not daily freshness | **Lowest** if licensed — this is the only JP source you can pay to use legitimately | **P1** (backfill only) |
| **Suruga-ya** | No, but a stable semi-public search surface | **Ask** — used (中古) price, new price, list price, **plus buyback price** | Self-scrape or Apify `datalab-jp/suruga-ya-scraper`. Community: `suruguya` (PyPI), `parse.bot` Suruga-ya API with 207 branch→condition mappings | Low. Apify PPE | **Good for a dealer floor.** Clean numeric product IDs, condition variants, list price. The buyback price is a genuinely useful hard floor signal we can't get elsewhere | Low. Public catalog pages | **P1** |
| **Mandarake** | No | **Ask**, with a sold-out flag | `msikma/mdrscr` (Node, parses search results, `soldOut` param) | Free | Moderate. Strong for vintage Plastic/HMS-era, thin for Beyblade X | Low | **P2** |
| **Rakuma (fril.jp)** | No | **Sold** via `soldout` status filter | Apify `datalab-jp/japan-flea-market-scraper` (also covers Yahoo Flea Market), `jungle_synthesizer/rakuma-fril-japan-listings-scraper`. Server-rendered HTML, ~40 cards/page | Low | Moderate. Real sold filter, condition + seller rating from detail pages. Volume well below Mercari/Yahoo | Moderate, same class as Mercari | **P2** |
| **Amazon JP / Takara Tomy Mall** | Amazon PA-API/SP-API exist but are seller/affiliate-scoped | **Ask** (retail) | Keepa API for history (€49/mo, 20 tokens/min); camelcamelcamel covers some Takara Tomy ASINs | €49/mo for Keepa | **Low value.** Retail MSRP anchor only. Almost no secondary-market signal for limited/event beys | Low (official-ish) | **P3** |
| **Snkrdunk / magi** | No | Ask (+ a weak sold flag on magi) | Apify actors exist for both | Low | **Not applicable.** SNKRDUNK is sneakers/streetwear/TCG; magi is trading cards. Neither carries Beyblade | — | **P3 — skip** |

### Taiwan / SEA

| Source | Official API? | Sold or ask | Realistic access path | Rough cost | Data quality | Legal / ToS risk | Priority |
|---|---|---|---|---|---|---|---|
| **Shopee TW** (shipped) | Open Platform exists but is **seller-scoped**; Affiliate Open Platform is GraphQL + HMAC-SHA256 but is commission/link oriented, not a cross-market catalog | Ask + **cumulative sold counts** | Internal `/api/v4/...` JSON (`get_item_base_info`, search). Key fields: `historical_sold` (lifetime units), `sold` (monthly), `price` ÷ 100,000. One parser spans all 7 markets (TW/SG/MY/PH/ID/TH/VN) | Commercial parsers (ShopAPIS, Lumintu) or Apify actors; self-scrape needs proxy rotation | Moderate. No per-transaction sold price — only ask price + units-moved. Treat `historical_sold` as a **demand weight**, not a comp | Moderate. Internal endpoints, aggressive rate-limiting | **Shipped** |
| **Ruten 露天拍賣** | **Yes** — official Open API, but it's **seller-side** (manage your own products/orders). Apply via seller portal, 3 working days, HMAC-SHA256 signing | Ask + **per-listing cumulative `sold_count`** | Semi-public `rtapi` JSON endpoints, no login, no token. Apify `claude_code_reviewer/ruten-scraper` | Low / free | **Good and underrated.** Verified live: 12,449 listings for `戰鬥陀螺X`, with per-listing 銷售 counts, price ranges, JP-import vs TW-agent versions clearly distinguished in titles. The JP-parallel-import segment is exactly our cross-border arbitrage signal | Low-moderate. Semi-public JSON | **P1** |
| **Carousell (HK/SG/TW/MY/PH)** | No public API | **Ask only** | Apify `parseforge/carousell-scraper` (7 markets), `devcake/carousell-scraper` (6) | Low | Moderate breadth, thin Beyblade depth. Useful for HK where 321GoShoot is strong | Moderate | **P2** |
| **Yahoo TW 拍賣** | No. Confirmed **still operating** (HK Yahoo auctions closed in 2021; TW did not) | Ask | Self-scrape | Low | Low. Superseded by Ruten and Shopee for this category | Moderate | **P3** |
| **momo / PChome** | PChome has a semi-public search endpoint (`ecshweb.pchome.com.tw/search/v3.3/all/results`); momo has an internal `apisearch.momoshop.com.tw` POST endpoint | Ask (retail) | `chinchillaLiao/papaprice` covers momo/PChome/Shopee/Yahoo/Etmall in one lib | Free | **Low value.** First-party retail, MSRP-anchored. No secondary market | Low | **P3** |
| **Facebook Marketplace / Groups** | **No.** Graph API deliberately excludes Marketplace and has since post-Cambridge-Analytica | Ask | Only viable path is a logged-in session replaying `POST /api/graphql/` with a rotating `doc_id` + `fb_dtsg` CSRF token | High operationally | Real Beyblade trading volume exists here, especially in TW/HK groups — but it is unstructured, location-scoped, and purged fast | **Highest risk of any source.** Requires login, so the hiQ/Bright Data "public data" defense does not cleanly apply. ToS-violating, account-ban exposure, seller PII exposure, `doc_id` churns on every FB deploy | **P3 — do not build** |

### Global

| Source | Official API? | Sold or ask | Realistic access path | Rough cost | Data quality | Legal / ToS risk | Priority |
|---|---|---|---|---|---|---|---|
| **eBay** | **Yes.** Browse API (public, OAuth client-credentials). Marketplace Insights = Limited Release, denied to non-partners. Finding + Shopping APIs shut down early 2025 | Browse = **ask only**. Insights = sold, 90 days — but unobtainable | `GET /buy/browse/v1/item_summary/search`, plus `getItem` / `getItemByLegacyId`. Supports `gtin` and `epid` filters | Free | Good for Western ask prices and, importantly, **GTIN/ePID identity resolution** | **Lowest.** Fully official and documented | **P1** (as ask + identity, not comps) |
| **Whatnot** | Seller API in Developer Preview and **explicitly not onboarding new applicants** | Seller API = your own inventory. Apify scraper surfaces a `lastSalePrice` field | Apify `epicscrapers/whatnot-search-scraper` | Low | Interesting — `lastSalePrice` is a genuine realized-sale field. But US-centric and Beyblade depth is unproven | Moderate | **P2** |
| **Mercari US** | No public API | Sold status exists | Session-auth-walled. `www.mercari.com/v1/api/search` returns 401 cookieless; `api.mercari.com/v2/entities/search` is a dead end for US. Requires a real browser session + residential proxy | Higher than JP by a lot | Low incremental value — JP rarity doesn't circulate here | Moderate | **P3** |
| **Amazon (global)** | PA-API / SP-API, scoped | Ask | Keepa API €49/mo | €49/mo | Low for our category | Low | **P3** |
| **PriceCharting** | Yes, API on Legendary tier | Current values by grade only — **API explicitly excludes historic prices and historic sales** | N/A | N/A | **Zero Beyblade toy coverage — verified.** 49 results are all games/Funko/comics | — | **P3 — skip** |

---

## 3. Catalog / identity (L0) sources

| Source | Structured? | Access | License / risk | Verdict |
|---|---|---|---|---|
| **Takara Tomy BEYBLADE X app `MasterData.json`** | **Yes — first-party JSON** | `Android/data/jp.co.takaratomy.beyblade/files/MasterData.json`. Precedent: `yujinyuz/beybrew` | Extracted from a distributed app. Use as a *reference to normalize against*, don't redistribute verbatim | **Best available.** Authoritative part identity |
| **Takara Tomy official product list** (`beyblade.takaratomy.co.jp/beyblade-x/app/list.html`) | Semi — clean HTML table | Direct fetch. Verified: product code + JP name + release date, BX-01 onward, including BX-00 event/app-limited items | Public official page | **Excellent.** Canonical product codes and release dates, including the BX-00 limited items that drive the high end of the market |
| **Beyblade Fandom wiki** | Yes — MediaWiki XML dump | `Special:Statistics` → "Current pages" `.7z`, or request a fresh dump (once per 7 days). Bulk alternative: HuggingFace `nyuuzyou/fandom` (7.04M pages, 6.22 GB, all Fandom wikis, Feb 2025 snapshot). `JOHW85/ScrapeFandom` forces a fresh dump | **CC-BY-SA 3.0** — legally the cleanest bulk source we have | **Strong.** Best source for EN/JP/ZH alias strings at volume. Attribution required |
| **WBO / Beywiki** | MediaWiki | Standard wiki export | Community | **Good for aliases.** Its *Price Reference List* is hand-curated NIB USD, mostly legacy generations — usable as a sanity band, never as comps |
| **beybxdb.com** | **No.** Google Sites, per-product pages | Scrape only | Explicit no-plagiarism notice; asks for permission + credit. **Site banner says content current only to Feb 2025 and on hiatus** | **Cross-check, not source of truth.** Already credited in `ATTRIBUTIONS.md`. Stale for anything after Feb 2025 |
| **`craigashields/beyblades-api`** | Yes (Prisma + PlanetScale) | GitHub, or RapidAPI (`beyblade-api1`, Basic $0 / Pro $5) | MIT | **Not worth it.** 1 star, created Jun 2023, requires you to stand up and seed your own DB. Completeness unproven and almost certainly pre-dates most of the X line |
| **`andreafspeziale/beyhub`** — `public/data/beyblades.json` | **Yes** — clean JSON with blade/ratchet/bit split and per-part attack/defense/stamina/burst stats | GitHub | Open | **Useful seed.** Schema is close to what our catalog already models |
| **`yujinyuz/beybrew`** — `src/data/beyparts.json` | Yes | GitHub | Open | **Useful seed**, and the trail to `MasterData.json` |
| **`blackbeardONE/BeybladeDB`** | MySQL CLI toy project | GitHub | Open | Skip. Academic exercise, not a catalog |
| **Ultralytics `beyblade-x` dataset** | 526 images, 1,985 annotations, instance segmentation over blades/ratchets/bits/launchers | Ultralytics platform | Check terms | Not needed for v1 (no photo ID in scope), but worth bookmarking |
| **JAN / GTIN barcode databases** | Fragmented | **No free open JP barcode DB exists.** GS1 Japan's JICFS/IFDB is the authoritative catalog and is paid. GEPIR has no API and no bulk download | — | **Practical workaround:** Rakuten Web Service Ichiba API accepts JAN lookups and is free with a key; eBay Browse accepts a `gtin` filter. Use those two as the JAN→product bridge rather than buying GS1 data |

---

## 4. Cost summary

| Item | Cost |
|---|---|
| Apify Free / Starter / Scale / Business | $0 (with $5 usage) / $29 / $199 / $999 per month, prepaid usage |
| Apify compute | $0.20/CU on Free+Starter, $0.16 Scale, $0.13 Business (1 CU = 1 GB RAM × 1 hr) |
| Apify residential proxy | ~$8/GB |
| Typical Apify PPE actor rates observed | $2 – $20 per 1,000 results |
| Aucfan Premium (consumer) | ¥2,200/month |
| Aucfan API / MCP | Undisclosed, sales contact |
| Keepa API | €49/month (20 tokens/min) → €4,499/month (4,000/min) |
| eBay Browse API | Free |
| Rakuten Web Service API | Free with key |
| Self-scraping Yahoo closedsearch | Proxy cost only |

A realistic Phase-2 budget is **$29/month Apify Starter** plus a modest proxy allowance, since the
two highest-value additions (Yahoo closedsearch, Ruten) are both unauthenticated and cheap to
self-host behind our existing `PricingSource` interface.

---

## 5. Competitive landscape

**321GoShoot — "Bey Market"** (`321goshoot.app`, iOS + Android, HK/TW). The only real competitor.
Feature set: per-Beyblade candlestick price chart, region-aware buyer quotes, latest-orders feed,
alongside a battle-session map, AI Beyblade identifier (Gemini vision + curated KB), and a
collection tracker. Free, no ads, no subscription.

Assessment of their data: the phrasing "buyer quotes" and "latest orders feed" points to an
**in-app order book / user-submitted quotes**, not marketplace-derived comps. That has one real
advantage over us — it reflects what HK/TW bladers will actually pay each other today — and two
structural weaknesses: it only works where they already have liquidity, and a candlestick built on
sparse user quotes will be noisy and gameable. **Our differentiation is provenance:** median + IQR
over thousands of *verified realized* JP sold comps, with per-source toggles so a user can see
exactly which marketplaces the number came from.

**BeybladeHub.app** — TW-focused, independently run by community member "DaDa." Parts database,
combo/tier-list tools, G3/GP tournament calendar, Funbox store map, blog. **No pricing feature.**
Not a competitor. Potentially a partner and a good ZH alias source.

**BeySpin (Beyblade Scanner AI)** — App Store AI scanner offering "market value & pricing" and
"real-time price valuation graphs," subscription-gated. No disclosed data source; near-certainly
LLM-estimated rather than comp-derived. Low credibility threat, but it does confirm demand for
"what is my Beyblade worth."

**WBO Beywiki Price Reference List** — hand-curated, NIB, USD, explicitly "reasonable for both
seller and customer" rather than observed transactions, and weighted to Plastic-era products.
Useful as a sanity band for legacy generations, not as a comp source.

**camelcamelcamel** — Amazon-only price history; does carry some Takara Tomy Beyblade ASINs.
Retail signal only.

**Community datasets** — none. WBO's Bey Marketplace is MyBB forum threads with prices in prose
and a photo-verification rule; there is no structured trade log to mine. The "Beycord Revival"
Discord bot runs a *simulated* in-game economy, not real prices. No maintained community
price spreadsheet was found.

---

## 6. Recommended phased ingest roadmap

**Phase 1 — shipped.** Mercari JP + Shopee TW.

**Phase 2 — Yahoo Auctions JP closed search.** *Highest ROI by a wide margin.* Unauthenticated,
server-rendered, ~46k sold Beyblade X records per 180 days, and it covers Yahoo!フリマ in the same
response. Ship as a self-hosted `PricingSource` adapter with an Apify actor as the fallback
provider. Expect this alone to move most parts from "sparse comps" confidence gating into a
usable median + IQR.

**Phase 3 — catalog hardening (L0).** Before adding more price sources, fix identity. Normalize
against Takara Tomy's `MasterData.json` and the official product list page to get canonical
BX/UX/CX codes and release dates, then bulk-load aliases from the Fandom CC-BY-SA dump.
Rationale: every additional marketplace multiplies matcher error. Better identity now makes every
later source cheaper to add, and product codes are the L0 rung of our cascading matcher.

**Phase 4 — Ruten TW.** Semi-public JSON, no auth, 12k+ listings, per-listing cumulative sold
counts, and a clean split between JP parallel imports and TW agent versions. This is the TW depth
that Shopee alone doesn't give us, and it's the natural input to a cross-border spread signal.

**Phase 5 — Suruga-ya (+ Mandarake).** Dealer ask *and buyback* prices give us a defensible price
floor and a condition-aware band that pure C2C data can't produce. Mandarake adds vintage
Plastic/HMS coverage.

**Phase 6 — eBay Browse API.** Officially sanctioned, free, zero legal risk. Two jobs: Western ask
prices for the arbitrage spread, and `gtin`/`epid` lookups to strengthen L0 identity. Explicitly
*not* a comps source — do not wait on Marketplace Insights.

**Phase 7 — Aucfan, only if we need history beyond 180 days.** Yahoo closedsearch's 180-day window
is enough for a live oracle. Aucfan's value is a one-time 10-year backfill for long-run charts on
legacy generations. Because it's the only JP source we can *license* rather than scrape, it's also
the right thing to buy if the ToS posture ever needs to be defensible to a partner or acquirer.

**Phase 8 — opportunistic.** Rakuma for extra JP C2C depth; Carousell HK for the 321GoShoot
overlap region; Whatnot's `lastSalePrice` if US demand materializes.

**Never:** Facebook Marketplace (login-walled, ToS-violating, PII-laden, structurally fragile) and
PriceCharting (zero coverage).

---

## 7. Cross-cutting engineering notes

- **Query in the local language.** Mercari JP and Yahoo JP both rank Japanese keywords far better
  than romanized ones. Ruten and Shopee TW need Traditional Chinese (`戰鬥陀螺X`). Our alias table
  needs per-source query strings, not just display names.
- **Lot and bundle detection is mandatory.** A large share of Yahoo/Mercari sold rows are `2個セット`,
  `5点セット`, `まとめ売り`, or `×10` multipacks. Verified examples in the live data range from a
  ¥1,000 single part to a ¥180,000 ten-pack of the same limited bey. Feeding those into a median
  unfiltered will wreck the Oracle Value. Detect quantity in the title and either divide or exclude.
- **Separate ask from sold at the schema level.** Shopee `historical_sold` and Ruten `sold_count`
  are *units moved at an unknown price*. They are demand weights, not observations. Don't let them
  into the median.
- **Store no seller PII.** Several adapters can return seller IDs, usernames, and ratings. Keep the
  rating (useful signal), drop the identifier. This is the main thing that keeps us on the right
  side of JP APPI and Taiwan's PDPA.
- **Prefer provider-swappable adapters.** Per `.cursor/rules/scavenge-first.mdc`, every source above
  should sit behind the existing `PricingSource` interface so a self-hosted scraper can be swapped
  for an Apify actor or a licensed API without touching oracle core.

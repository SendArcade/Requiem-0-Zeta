# Beyoracle — Current State

_Last updated: 2026-08-07_

Architecture, thesis, and navigation live in
[`blueprint/README.md`](../blueprint/README.md). This document tracks what is
shipped right now.

## Production (Railway)

| Service | URL / notes |
|---------|-------------|
| **Web** | [https://web-production-5c33a.up.railway.app](https://web-production-5c33a.up.railway.app) (`DATA_SOURCE=auto` → Postgres when seeded) |
| **Worker** | BullMQ cron + one-shot flags (`ORACLE_BACKFILL`, `PRODUCT_BACKFILL`, `PURGE_BAD_COMPS`) |
| **Postgres + Redis** | Railway internal URLs via `DATABASE_URL` / `REDIS_URL` on web + worker |

Deploy: per-service Dockerfiles via `RAILWAY_DOCKERFILE_PATH` (`apps/web/Dockerfile`, `packages/worker/Dockerfile`).

## Phase 2 — product coverage (2026-08-07)

**Goal:** grow whole-SKU marks on publishable products (X + Burst first).

| Work | Status |
|------|--------|
| Product-first backfill (`pnpm backfill:products`) | ✅ shipped; English + JP queries |
| Cron rotates whole-SKU queries each tick | ✅ `INGEST_PRODUCT_QUERIES_PER_TICK=6` |
| Comp audit UI (evidence, match method, in-mark) | ✅ deployed on web |
| `/api/product/[id]` JSON (comps + recipe + oracle) | ✅ |
| Match re-validation purge (preserve observations) | ✅ `pnpm purge:bad-comps` |
| Coverage report | ✅ `pnpm product:coverage` |

**Prod one-shot backfill:** `PRODUCT_BACKFILL=1` + `PRODUCT_BACKFILL_MAX_QUERIES=500` + `PRODUCT_BACKFILL_SOURCES=mercari_jp,yahoo_auctions_jp`. Set `PRODUCT_BACKFILL=0` and `PRODUCT_BACKFILL_DONE=1` after completion.

**Parallel fleet (full catalog):** see [`docs/FULL_CATALOG_OKAYISH_RUN.md`](FULL_CATALOG_OKAYISH_RUN.md) and [`docs/PRODUCT_BACKFILL_FLEET.md`](PRODUCT_BACKFILL_FLEET.md). Enqueue with `PRODUCT_BACKFILL_ENQUEUE=1` + new `PRODUCT_BACKFILL_RUN_ID` (Redis claim dedupes redeploys). Scale worker replicas to drain `product.backfill.shard` jobs.

**North-star metric:** publishable products with ≥3 sold comps — run `pnpm product:coverage`.

## Shipped (MVP + Matcher v3 + Realtime)

- **Monorepo:** pnpm workspace with `apps/web`, `packages/{db,catalog,ingest,oracle,shared,events,worker}`
- **Catalog:** **1,105 parts** + **448 whole products** (Plastic 85 · Metal 119 · Burst 86 · X 158) — parts via `pnpm catalog:build`; products merged from `packages/catalog/data/seeds/products-*.json` (e.g. **products-metal.json**, 119 SKUs); **1,763 alias rows**
- **Schema:** Postgres via Drizzle — parts, aliases, observations, matches, oracle_snapshots, watchlist, watchlist_alerts
- **Ingest:** `PricingSource` interface; **Mercari JP** (live DPoP sold comps), **Yahoo Auctions JP** (live closed-search sold comps), **Shopee TW** (fixtures; live blocked by anti-bot)
- **Scheduled ingest:** BullMQ worker — `cron.tick` fans out to per-source `ingest.source` jobs; alerts decoupled on delay
- **Live push:** Redis pub/sub → SSE `/api/events` (DB poll fallback when Redis off)
- **Matcher v3:** Bundles/complete-bey excluded; wanakana + opencc normalize; labeled eval set (~213 titles)
- **Oracle v2 (default):** Landed JPY at ingest; time-decay + venue weights; MAD outlier gate; weighted median/IQR; cohort index re-timing + shrinkage (when context passed); TW region premium display. v1 median path via `engine: 'v1'`.
- **Oracle v1 (legacy):** Median + true Q1–Q3 band; **condition segmentation**; **minComps enforced**; per-condition breakdown
- **Web:** Reads Postgres when seeded (`DATA_SOURCE=auto`); fixture fallback when DB empty; **confidence gating** on asset/browse/search; **`/browse/products`** + **`/product/[id]`** whole-SKU pages; **grading pool picker** on asset pages
- **ALT-style UI (shipped 2026-08-05):** Royal accent shell, product/asset oracle heroes, comps chart + source toggles — spec + parity gaps in [`docs/ALT_UI_REFERENCE.md`](ALT_UI_REFERENCE.md)
- **Watchlist:** Session-based DB watchlist with baseline mark + **price-drop alerts** (default −10%)
- **Fixtures:** JSON sold comps — UI works without Postgres until `pnpm db:seed`


## Oracle catalog backfill

Full-catalog ingest + oracle recompute (fixtures → live sources → landed JPY → snapshot recompute):

```bash
pnpm backfill:oracle
# Lighter runs:
BACKFILL_MAX_QUERIES=100 pnpm backfill:oracle
SKIP_LIVE=1 pnpm backfill:oracle
```

**Status (2026-08-05):** Prod worker has `ORACLE_BACKFILL=1`, `BACKFILL_PAUSE_CRON_INGEST=1`, `BACKFILL_SOURCES=mercari_jp`, `BACKFILL_QUERY_BATCH=30`. Recent logs showed catalog backfill **~batch 5/106** (Mercari live; Yahoo closed-search **404** in prod — fixture fallback). After success, operators set `ORACLE_BACKFILL=0` (do not change during verification runs).

**Railway worker (one-shot):** set `ORACLE_BACKFILL=1` on the `worker` service to run backfill in the background on boot. Run-once guard skips if `ORACLE_BACKFILL_DONE=1` or `ingest_runs.job_name = oracle.backfill` is `running`/`success`. **While backfill is running, do not set `ORACLE_BACKFILL=0` or redeploy the worker.** After completion, set `ORACLE_BACKFILL=0` (and optionally `ORACLE_BACKFILL_DONE=1`):

```bash
railway variable set ORACLE_BACKFILL=0 ORACLE_BACKFILL_DONE=1 --service worker
railway logs --service worker --lines 100
```

Typical prod vars: `BACKFILL_QUERY_BATCH=30`, `INGEST_LIMIT_PER_QUERY=40`, live sources enabled (`MERCARI_API_ENABLED`, `YAHOO_AUCTIONS_ENABLED`, `MANDARAKE_API_ENABLED`, `RUTEN_API_ENABLED`).

## Commands

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm docker:up          # Postgres + Redis
pnpm db:migrate && pnpm db:seed
pnpm dev                # web on :3000
pnpm worker:dev         # BullMQ scheduled ingest (needs Redis + live flags)
pnpm ingest:run         # one-shot ingest → Postgres
pnpm ingest:fixtures    # smoke ingest adapters (no DB write)

# measure matcher accuracy against real sold listings
MERCARI_API_ENABLED=1 pnpm --filter @beyoracle/ingest probe:mercari
YAHOO_AUCTIONS_ENABLED=1 pnpm --filter @beyoracle/ingest probe:yahoo

# labeled matcher regression (~213 titles)
pnpm --filter @beyoracle/oracle eval:run

# asset oracle by grading pool (sealed, loose_standard, premium, …)
curl 'http://localhost:3000/api/asset/{partId}?pool=sealed'
```

## Env (optional live ingest)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres (default `postgres://postgres:postgres@localhost:5432/beyoracle`) |
| `REDIS_URL` | Redis for BullMQ + live SSE push (default `redis://localhost:6379`) |
| `REDIS_ENABLED=0` | Disable Redis pub/sub (SSE falls back to DB poll) |
| `DATA_SOURCE` | `auto` (default), `db`, or `fixtures` — web read path |
| `INGEST_INTERVAL_MS` | Worker cron interval (default 15 min) |
| `INGEST_ALLOW_FIXTURES=1` | Worker/CLI ingest uses fixtures when live APIs off |
| `MERCARI_API_ENABLED=1` | Enable live Mercari JP sold-comps search |
| `MERCARI_STRICT=1` | Throw on live failure instead of falling back to fixtures |
| `MERCARI_MIN_INTERVAL_MS` | Politeness delay between live requests (default 1200) |
| `MERCARI_MAX_PAGES` | Page cap per query (default 5) |
| `MERCARI_LIVE_PROVIDER` | Comma chain `dpop` / `apify` (default `dpop`, then `apify` when `APIFY_TOKEN` set) |
| `APIFY_TOKEN` | Apify API token — enables Mercari/Yahoo Apify fallback providers |
| `APIFY_TIMEOUT_MS` | Timeout for Apify sync actor runs (default 330000) |
| `SHOPEE_API_ENABLED=1` | Attempt live Shopee TW (blocked by anti-bot — see below) |
| `SHOPEE_STRICT=1` | Throw on Shopee failure instead of falling back to fixtures |
| `YAHOO_AUCTIONS_ENABLED=1` | Enable live Yahoo Auctions JP closed-search sold comps |
| `YAHOO_AUCTIONS_STRICT=1` | Throw on Yahoo failure instead of falling back to fixtures |
| `YAHOO_MIN_INTERVAL_MS` | Politeness delay between Yahoo requests (default 1500) |
| `YAHOO_MAX_PAGES` | Page cap per query (default 5) |
| `YAHOO_LIVE_PROVIDER` | Comma chain `self` / `apify` (default `self`, then `apify` when `APIFY_TOKEN` set) |
| `ORACLE_BACKFILL=1` | Worker boot: run `runOracleBackfill()` once (skipped if `ORACLE_BACKFILL_DONE=1` or ingest run already success/running) |
| `ORACLE_BACKFILL_DONE=1` | Run-once guard after backfill completes |
| `BACKFILL_PAUSE_CRON_INGEST=1` | Pause scheduled ingest fan-out while backfill runs |
| `BACKFILL_SOURCES` | Comma-separated source ids for backfill (prod example: `mercari_jp`) |
| `BACKFILL_QUERY_BATCH` | Queries per backfill batch (default 30) |
| `BACKFILL_MAX_QUERIES` | Cap total queries (CLI / local) |
| `SKIP_LIVE=1` | Fixtures-only backfill |
| `YAHOO_NORMALIZE_HYPHEN_QUERIES=1` | Replace letter-hyphen-letter tokens (e.g. `Absorb-S` → `Absorb S`) before search — Yahoo 404s on the hyphen form |

## Live Mercari JP path

**Mercari is not dead** — it is **env-gated** and defaults to fixtures so CI never
depends on marketplace uptime. Without `MERCARI_API_ENABLED=1`, every search
returns fixture JSON and looks "offline."

Primary path: `packages/ingest/src/adapters/mercari/` wraps
`api.mercari.jp/v2/entities:search` with a per-request DPoP proof (RFC 9449,
ES256, ephemeral P-256 key) — no account or token. Verified live 2026-07-29.

**Apify fallback:** when DPoP/self-scrape fails and `APIFY_TOKEN` is set, the
adapter tries Apify actor `kitebuilds/resale-sold-comps` (see
[docs/INGEST_STANDARDS.md](INGEST_STANDARDS.md)). Force with
`MERCARI_LIVE_PROVIDER=apify`.

```bash
MERCARI_API_ENABLED=1 pnpm --filter @beyoracle/ingest probe:mercari
```

Live probe baselines:

| Date | Matcher | Matched | Notes |
|------|---------|---------|-------|
| 2026-07-29 | v2 | **68/245 (27.8%)** | 99 bundle/lot titles, 0 bundles matched |
| 2026-08-05 | v3.1 | **42/198 (21.2%)** | Stricter gen/part-type scoring rejects wrong-gen hits that v2 counted; 86 bundle/lot titles, 0 bundles matched |

Lower v3.1 headline rate is expected — fewer false-positive matches, not worse recall on correct-gen titles.

## Live Yahoo Auctions JP path

Primary path: `packages/ingest/src/adapters/yahoo-auctions/` reads Yahoo's
closed search (落札相場) via the embedded `__NEXT_DATA__` JSON — no login, no
token. Covers Yahoo Auctions and Yahoo!フリマ in one response. ~46k sold Beyblade X
records per rolling 180 days.

**Apify fallback:** when self-scrape fails and `APIFY_TOKEN` is set, the adapter
tries Apify actor `jpmarketdata/yahoo-auction-sold-comps`. Force with
`YAHOO_LIVE_PROVIDER=apify`.

Yahoo returns **HTTP 404 with an empty listing** for some hyphenated part-name
queries (e.g. `Absorb-S`); the client treats 404 as zero results instead of
erroring. Set `YAHOO_NORMALIZE_HYPHEN_QUERIES=1` on deploy to rewrite
letter-hyphen-letter tokens to spaces and recover comps for those SKUs.

```bash
YAHOO_AUCTIONS_ENABLED=1 pnpm --filter @beyoracle/ingest probe:yahoo
```

Live probe baseline (2026-07-29): **96/200 matched (48.0%)**, 47 bundle/lot titles,
**0 bundles matched**.

## Shopee TW — blocked unsigned (fixtures only)

Shopee's internal search API returns **HTTP 403 / error 90309999** without request
signing, device fingerprinting, and valid session cookies. There is no public
developer API for cross-market sold comps — the Open Platform is seller-scoped.

The adapter attempts live when `SHOPEE_API_ENABLED=1`, logs the block clearly, and
falls back to fixtures. Production path needs a commercial parser (ShopAPIS,
Bright Data) wired behind `PricingSource`.

## Matcher v3.1 — what changed (2026-08-05)

On top of v2 fixes (2026-07-29):

1. **CJK normalization** — Latin/alphanumeric tokens protected before wanakana (`1-60` no longer → `160`).
2. **TitleHints** — generation/part-type inferred from keywords (`ベイブレードX`, `ブレード`, `ビット`); cross-gen false positives eliminated on eval set.
3. **Starter SKU disambiguation** — part-type hint breaks ties on shared product codes.
4. **Bundle flag** — `observations.is_bundle` persisted; comp queries filter `is_bundle=false`; ingest rejects lots before match.

Eval: **100% shape + 100% match** on ~213 labeled titles (`pnpm --filter @beyoracle/oracle eval:run`).

## Matcher v2 — what changed (2026-07-29)

Six defects fixed in one pass:

1. **Exact stage now uses all surface forms** — `loadMatcherContext()` expands
   EN/JP/ZH canonical names + atomic aliases; scored to prefer CJK names over
   bare ratchet dimensions like `3-60`.
2. **CJK fuzzy** — `tokenSetCjkAware()` + bigram Jaccard via `textSimilarity()`.
3. **Bundle exclusion** — `looksLikeBundle()` in `@beyoracle/shared`; ingest
   pipeline rejects before matching; matcher rejects as belt-and-suspenders.
4. **`minComps` enforced** — returns `null` when filtered comps &lt; threshold.
5. **Condition segmentation** — default mark uses `used`, `like_new`, `unknown`
   (excludes sealed); UI toggles + per-condition pills.
6. **Alias coverage** — 130 rows (was 19); Chinese aliases for all X parts.

Accuracy is materially improved but still imperfect — fuzzy false positives on
generic terms and product-code ambiguity on starter SKUs remain. Re-run probes
after any matcher or catalog change. Matcher v3 roadmap:
[`docs/MATCHING_RESEARCH.md`](../docs/MATCHING_RESEARCH.md).

## Not in v1

Marketplace, social, battle map, eBay adapter, combo premium model, photo ID.

## Known gaps

- **Live ingest reliability:** Yahoo closed-search **404** in prod backfill (fixtures fallback); Shopee TW unsigned API blocked; Mandarake/Ruten/Suruga-ya env-off or sparse in prod backfill config.
- **Matcher on live probes:** Mercari **21.2%** / Yahoo **48.0%** — bundles excluded; fuzzy false positives remain on generic titles.
- **ALT UI polish:** Chart colors not wired to tokens; no 1M/3M/6M chart window; browse filter drawer — see [`docs/ALT_UI_REFERENCE.md`](ALT_UI_REFERENCE.md) §7.
- **Product oracle coverage:** Backfill in flight — many parts/products still sparse comps until batches complete.
- **Not in v1:** Marketplace, social, eBay, photo ID, review queue for low-confidence matches.

## Next milestones

- Complete prod oracle backfill; then `ORACLE_BACKFILL=0` + re-enable full source fan-out
- Fix Yahoo prod closed-search path (404 regression)
- Shopee TW live path via signed API provider
- Redis cache for hot oracle snapshots

Source ranking, access mechanics, costs, and phased ingest order: `docs/SOURCE_MAP.md`.

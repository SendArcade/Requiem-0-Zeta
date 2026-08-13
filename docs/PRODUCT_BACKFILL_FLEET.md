# Product backfill fleet (Railway parallel workers)

Goal: fill **all publishable complete Beyblade SKUs** (starter / complete_loose / complete_sealed) across Plastic, Metal, Burst, and X with **live sold comps**, then recompute Oracle marks — with **max parallelization** and **zero tolerance for false-positive product matches**.

## Architecture

```
                    ┌─────────────────────┐
                    │  Enqueue once       │
                    │  PRODUCT_BACKFILL_  │
                    │  ENQUEUE=1          │
                    └──────────┬──────────┘
                               │ N × product.backfill.shard
                               ▼
┌──────────────┐  Redis BullMQ  ┌──────────────────────────────┐
│ worker rep 0 │◄──── queue ───►│ product.backfill.shard 0..N-1 │
│ worker rep 1 │               └──────────────────────────────┘
│ ...          │
│ worker rep R │  each job owns a disjoint product partition
└──────────────┘
         │
         ▼
   Postgres (shared DATABASE_URL)
   product_matches (live only) → product_oracle_snapshots
```

- **Shard assignment:** `FNV-1a(productId) % SHARD_COUNT` — deterministic, no overlap, full coverage.
- **Precision-first:** existing matcher auto-accept ≥0.9, lot/single-part shape gates, live-only marks (`isLiveMarketplaceComp`), `productMarkConditions` per variant, `PRODUCT_ORACLE_WINDOW_DAYS=180`.
- **Workers do not invent prices.** Sparse SKUs stay unmarked until ≥`DEFAULT_PUBLISHED_MIN_COMPS` (3) live solds.

## Railway setup (recommended: scale replicas)

### 1. Shared env (web + all worker replicas)

| Variable | Value |
|----------|--------|
| `DATABASE_URL` | Railway Postgres |
| `REDIS_URL` | Railway Redis |
| `MERCARI_API_ENABLED` | `1` |
| `YAHOO_AUCTIONS_ENABLED` | `1` if closed-search works; else omit |
| `PRODUCT_BACKFILL_SOURCES` | `mercari_jp` or `mercari_jp,yahoo_auctions_jp` |
| `DATA_SOURCE` | `auto` (web) |

### 2. Fleet env on **worker** service

| Variable | Value | Notes |
|----------|--------|--------|
| `PRODUCT_BACKFILL_FLEET` | `1` | Raise concurrency, pause cron |
| `PRODUCT_BACKFILL_ENQUEUE` | `1` | **One deploy only** — enqueues all shards |
| `PRODUCT_BACKFILL_SHARD_COUNT` | `64`–`256` | More shards = finer parallelism |
| `WORKER_CONCURRENCY` | `4`–`12` | Per replica; keep Mercari polite |
| `BACKFILL_PAUSE_CRON_INGEST` | `1` | Free capacity for backfill |
| `PRODUCT_BACKFILL_QUERY_BATCH` | `10`–`20` | Queries per batch inside a shard |
| `INGEST_LIMIT_PER_QUERY` | `25`–`40` | Listings per marketplace query |
| `PRODUCT_BACKFILL_GENERATIONS` | `burst` | Next pass is Burst-only (Wave 0+1 identity recut). Use `all` for the full catalog. Do not write venue yen as marks. |

### 3. Scale

In Railway UI → worker service → **Replicas** → set **16–64** (or as high as budget/rate-limits allow).

Each replica drains `product.backfill.shard` jobs from Redis. JobIds are idempotent (`product-backfill-shard-{N}-{id}`).

### 4. After fleet completes

```bash
# Stop re-enqueue on reboot
railway variable set PRODUCT_BACKFILL_ENQUEUE=0 PRODUCT_BACKFILL_ENQUEUE_DONE=1 PRODUCT_BACKFILL_FLEET=0 BACKFILL_PAUSE_CRON_INGEST=0 --service worker

# Quality pass
railway run --service worker pnpm purge:bad-comps
# or local with prod DATABASE_URL:
pnpm purge:bad-comps
pnpm product:coverage
```

## Static shards (optional)

If you prefer one Railway service **per** shard (no queue fan-out):

```bash
# replica / service A
PRODUCT_BACKFILL=1 PRODUCT_BACKFILL_SHARD_ID=0 PRODUCT_BACKFILL_SHARD_COUNT=32

# service B
PRODUCT_BACKFILL=1 PRODUCT_BACKFILL_SHARD_ID=1 PRODUCT_BACKFILL_SHARD_COUNT=32
# …
```

Or CLI:

```bash
PRODUCT_BACKFILL_SHARD_ID=3 PRODUCT_BACKFILL_SHARD_COUNT=32 \
  MERCARI_API_ENABLED=1 pnpm backfill:products:shard
```

## Local plan preview

```bash
PRODUCT_BACKFILL_SHARD_COUNT=64 pnpm backfill:products:fleet-plan
```

## Quality guarantees (do not lower)

| Gate | Location |
|------|----------|
| Auto-accept confidence ≥ 0.9 | `match-confidence-routing` |
| Lots / single parts never product comps | `classifyListingShape` / `isProductCompEligible` |
| Mislabel code vs name/combo rejected | `matchToProduct` conflict guard |
| Fixtures never product matches/marks | seed + `isLiveMarketplaceComp` |
| Variant pools separated | `productMarkConditions(skuType)` |
| Multi-comp publish floor | `DEFAULT_PUBLISHED_MIN_COMPS = 3` |
| Multi-month window | `PRODUCT_ORACLE_WINDOW_DAYS = 180` |
| Purge re-validates stored matches | `pnpm purge:bad-comps` |

## Multi-database note

A **single** Postgres is preferred: product_matches + observations are shared and deduped by `(source, externalId)`. Splitting DBs multiplies complexity (merge marks, cross-shard recompute).

If you outgrow one DB:

1. Keep **one write primary** for observations/matches.
2. Scale **workers** (stateless) not Postgres shards first.
3. Add read replicas for web only if needed.

## Cron ingest vs fleet

Worker boot **removes** Redis repeatable `scheduled-cron-tick` before re-adding. That drops the frozen Aug-5 `tickId` payload and makes `BACKFILL_PAUSE_CRON_INGEST=1` actually pause. Shard jobs use a 60m BullMQ lock plus `lockRenewTime` (override with `BULLMQ_LOCK_DURATION_MS` / `BULLMQ_LOCK_RENEW_MS`). Do not write venue yen as marks.

## Rate limits

Mercari/Yahoo will throttle if every replica hammers the API. Prefer:

- **More shards, moderate concurrency** (e.g. 64 shards × 16 replicas × concurrency 4)
- `MERCARI_MIN_INTERVAL_MS=800`–`1500`
- Sequential sources inside a shard (already default)

## Verify

```bash
pnpm test                                    # includes shard partition tests
pnpm backfill:products:fleet-plan
pnpm product:coverage                        # withMark ≥3 per generation
pnpm purge:bad-comps:dry
```

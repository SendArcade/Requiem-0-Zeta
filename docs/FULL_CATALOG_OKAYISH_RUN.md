# Full catalog okayish marks — one fleet run

**Goal:** get **as many of the 413 publishable whole-SKU products** showing an Oracle Value (≥3 sold comps) as possible in **one fleet pass** — breadth over Wave 0 Diablo precision.

## Expectations (straight)

| | Count |
|--|--:|
| Catalog products | 438 |
| Publishable (complete recipe) | **413** |
| Cannot ever publish (missing parts) | 25 |
| Marks before run (2026-08-20) | 23 |
| **Realistic after one run** | **150–300** okayish marks |
| **100% of 438** | Not guaranteed — many SKUs have zero JP sold liquidity |

"Okayish" = **one linked sold comp is enough**, but only if it's a **real match to that SKU** — not a hallucination:

| Gate | What it blocks |
|------|----------------|
| Matcher auto-accept **≥0.90** | fuzzy/wrong matches never persist |
| **product_code** or **≥0.95** when n=1 | bare B-code / alias-only guesses don't publish a mark |
| `isProductCompEligible` | lots, single parts, bundles |
| `looksLikeBeybladeListing` | car models, apparel junk |
| Live marketplace only | fixtures / invented prices |
| Sealed vs used pools | wrong condition row |
| Comp audit UI | every mark shows **item URL + match method** |

Set on **worker + web**:
```bash
railway variable set PUBLISHED_MIN_COMPS=1 --service worker
railway variable set PUBLISHED_MIN_COMPS=1 --service web
```

## Railway one-shot

```bash
# 1. Reset enqueue guard + new run id
railway variable delete PRODUCT_BACKFILL_ENQUEUE_DONE --service worker
railway variable set PRODUCT_BACKFILL_RUN_ID=run-20260820-okayish --service worker

# 2. Fleet config (full catalog, unlimited queries per shard)
railway variable set \
  PRODUCT_BACKFILL_ENQUEUE=1 \
  PRODUCT_BACKFILL_FLEET=1 \
  PRODUCT_BACKFILL_GENERATIONS=all \
  PRODUCT_BACKFILL_SHARD_COUNT=64 \
  PRODUCT_BACKFILL_MAX_QUERIES=0 \
  PRODUCT_BACKFILL_QUERY_BATCH=15 \
  INGEST_LIMIT_PER_QUERY=40 \
  MERCARI_API_ENABLED=1 \
  YAHOO_AUCTIONS_ENABLED=1 \
  BACKFILL_PAUSE_CRON_INGEST=1 \
  WORKER_CONCURRENCY=8 \
  --service worker

# 3. Redeploy worker (enqueues 64 shard jobs on boot)
railway up --service worker --detach

# 4. Watch
railway logs --service worker --lines 200 | grep product-backfill-shard

# 5. After queue drains
railway variable set PRODUCT_BACKFILL_ENQUEUE=0 PRODUCT_BACKFILL_ENQUEUE_DONE=1 PRODUCT_BACKFILL_FLEET=0 --service worker
pnpm product:coverage   # on Railway / tunnel
```

Scale worker replicas (8–16) in Railway UI to drain 64 shards faster.

## After the run

- `pnpm purge:bad-comps` — drop wrong-TT / junk matches (marks may go null; correct)
- Re-run Wave 0 recompute for the 7 Diablo starters if their marks drift
- Browse `/browse/products?confidence=has_mark` for coverage

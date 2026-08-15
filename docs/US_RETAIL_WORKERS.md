# US retail workers (Walmart + Amazon)

Dedicated Railway worker services poll **US big-box shelf asks** — `active_ask`
provenance only. They never feed Oracle Value (sold comps median).

## Why split workers?

- **Rate limits / bot blocks** — Walmart and Amazon HTML scrapes need conservative
  pacing; isolating them avoids starving JP sold-comp ingest on the main worker.
- **Query language** — US retail uses English catalog terms (`buildUsRetailQueryPlan`);
  JP corridors keep the mixed EN/JP rotation (`buildIngestQueryPlan`).
- **Blast radius** — a captcha block on Amazon must not pause Mercari/Yahoo cron.

## Services

| Service | `WORKER_INGEST_SOURCES` | Live flags | Notes |
|---------|-------------------------|------------|-------|
| **worker** (main) | *(unset)* | `MERCARI_API_ENABLED=1`, `YAHOO_AUCTIONS_ENABLED=1`, … | JP sold comps only — **excludes** `walmart_us` / `amazon_us` even if flags are set |
| **worker-walmart** | `walmart_us` | `WALMART_API_ENABLED=1` | Optional Affiliate API creds |
| **worker-amazon** | `amazon_us` | `AMAZON_API_ENABLED=1` | Optional PA-API creds |

All three share the same Redis `CONTROL_QUEUE` and Postgres — only the **cron fan-out
filter** differs.

## Env reference

### Shared

| Var | Purpose |
|-----|---------|
| `WORKER_INGEST_SOURCES` | Comma list — when set, this replica **only** enqueues those sources |
| `US_RETAIL_QUERIES_PER_TICK` | English query slice size (default `8`) |
| `US_RETAIL_QUERY_POOL_MAX` | Max catalog queries in rotation pool (default `600`) |
| `INGEST_INTERVAL_MS` | Cron interval — shared across workers (default 15m) |

### Walmart worker

```text
WORKER_INGEST_SOURCES=walmart_us
WALMART_API_ENABLED=1
WALMART_MARKET_INGEST=1
# optional Affiliate API:
WALMART_PUBLISHER_ID=…
WALMART_CONSUMER_ID=…
WALMART_ACCESS_TOKEN=…
```

### Amazon worker

```text
WORKER_INGEST_SOURCES=amazon_us
AMAZON_API_ENABLED=1
AMAZON_MARKET_INGEST=1
# optional Product Advertising API:
AMAZON_ACCESS_KEY=…
AMAZON_SECRET_KEY=…
AMAZON_PARTNER_TAG=…
```

### One-shot boot ingest (catalog sweep)

Set on a retail worker replica, review logs, then unset:

```text
US_RETAIL_INGEST_BOOT=1
US_RETAIL_BOOT_MAX_QUERIES=50   # optional cap
# after success:
US_RETAIL_INGEST_BOOT_DONE=1
# unset US_RETAIL_INGEST_BOOT
```

## Migrations

Apply on Railway Postgres before first live ingest:

```text
0014_walmart_source.sql
0015_amazon_source.sql
```

Worker boot runs Drizzle migrate automatically unless `SKIP_DB_BOOTSTRAP=1`.

## Railway setup (sketch)

1. Duplicate the existing `worker` service twice → `worker-walmart`, `worker-amazon`.
2. Same Dockerfile (`packages/worker/Dockerfile`), same `DATABASE_URL` / `REDIS_URL`.
3. Set env per table above; **remove** `WALMART_*` / `AMAZON_*` from main `worker`.
4. Scale each retail worker to **1 replica** initially (HTML scrape is fragile).
5. Trigger boot ingest once per corridor, then rely on cron.

## Product UI

When sold comps are thin, product pages show **US retail reference** — median of
Walmart + Amazon shelf asks in USD. MSRP-skew is expected; it is not Oracle Value.

See also: [`docs/INGEST_STANDARDS.md`](INGEST_STANDARDS.md), [`docs/SOURCE_MAP.md`](SOURCE_MAP.md).

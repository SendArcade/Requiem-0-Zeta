# Beyoracle — Agent guide

**Product:** ALT-style Beyblade oracle — **whole Beyblade** catalog (complete tops, sets, mint boxes) across **Plastic, Metal, Burst, and X equally**, sold comps, Oracle Value (median + IQR), source toggles. Part-level data is engine-internal, not the public mark. No marketplace/social in v1.

## Before coding

**Start at [`blueprint/README.md`](blueprint/README.md)** — the project's second
brain. It routes you to the two or three documents that match your task and
maps the whole repo.

1. [`blueprint/README.md`](blueprint/README.md) — entrypoint and navigation
2. `.cursor/rules/` (especially `scavenge-first.mdc`)
3. [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md) — what's shipped and what's broken
4. [`docs/ATTRIBUTIONS.md`](docs/ATTRIBUTIONS.md) — borrowed patterns

## Know this before you touch anything

- **Catalog:** 1,105 parts (Plastic 154 · Metal 164 · Burst 576 · X 211) + **448 products** (Plastic 85 · Metal 119 · Burst 86 · X 158) via seed JSON under `packages/catalog/data/seeds/`; parts rebuild: `pnpm catalog:build`
- **Matcher v3.1** runs end-to-end. Labeled eval **100% shape + 100% match** (~213 titles).
  Live probes: Mercari **21.2%** (v3.1, 2026-08-05 — stricter gen scoring; v2 was 27.8%),
  Yahoo **48.0%** (2026-07-29). ~24–40% of listings are bundles that must never become comps.
  See [`blueprint/06-matching.md`](blueprint/06-matching.md).

## Monorepo layout

| Path | Role |
|------|------|
| `apps/web` | Next.js App Router — search, browse, asset pages |
| `packages/db` | Drizzle schema + migrations |
| `packages/catalog` | Generation taxonomy, seed data, import scripts |
| `packages/ingest` | `PricingSource` interface; Mercari/Yahoo/Shopee + Ruten/Mandarake/Suruga-ya adapters; product-first match + persist + scheduled ingest |
| `packages/worker` | BullMQ cron worker — poll sources, recompute marks, fire watchlist alerts |
| `packages/events` | Redis pub/sub bus for live sales + alert push |
| `packages/oracle` | Matcher + Oracle Value aggregation |
| `packages/shared` | Shared types, FX helpers |

## Commands

```bash
pnpm install
pnpm typecheck
pnpm test                    # unit + eval regression (~213 labeled titles)
pnpm docker:up && pnpm db:migrate && pnpm db:seed
pnpm dev                    # web on :3000 (reads Postgres when seeded)
pnpm worker:dev             # BullMQ scheduled ingest (Redis + live flags)
pnpm backfill:products:fleet-plan   # parallel shard plan (full catalog)
# Railway fleet: PRODUCT_BACKFILL_ENQUEUE=1 PRODUCT_BACKFILL_FLEET=1 PRODUCT_BACKFILL_SHARD_COUNT=64
# See docs/PRODUCT_BACKFILL_FLEET.md
pnpm ingest:run             # one-shot ingest → Postgres
pnpm catalog:build          # rebuild parts.json from BeyBrew + Fandom wiki
pnpm ingest:fixtures        # smoke ingest from fixtures (no DB)

# measure matcher accuracy against real Mercari sold listings
MERCARI_API_ENABLED=1 pnpm --filter @beyoracle/ingest probe:mercari
```

## Env vars

See `docs/CURRENT_STATE.md` for the full table (`.env.example` is covered by
ignore rules). Live ingest:

- `MERCARI_API_ENABLED=1` — Mercari JP sold comps (DPoP, works)
- `YAHOO_AUCTIONS_ENABLED=1` — Yahoo Auctions JP closed search (works)
- `SHOPEE_API_ENABLED=1` — attempts Shopee TW (blocked by anti-bot; fixtures only)
- `MANDARAKE_API_ENABLED=1` — live Mandarake JP retail search (HTML parse; cookie priming)
- `RUTEN_API_ENABLED=1` — live Ruten TW rtapi (search + prod batch; ask + sold count)
- `SURUGAYA_API_ENABLED=1` — live stub (fixture fallback)
- `DEFER_ORACLE_RECOMPUTE=1` — defer inline oracle recompute to worker `oracle.recompute` jobs

## Verify tier

- Baseline: `pnpm typecheck && pnpm test`
- Smoke: `pnpm ingest:fixtures`
- Accuracy: `probe:mercari` — required for any matcher or catalog change

Fixtures validate plumbing, not accuracy. Full checklist in
[`blueprint/11-verification.md`](blueprint/11-verification.md).

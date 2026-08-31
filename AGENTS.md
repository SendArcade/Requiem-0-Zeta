# Beyoracle — Agent guide

**Product:** ALT-style Beyblade oracle — **whole Beyblade** catalog (complete tops, sets, mint boxes) across **Plastic, Metal, Burst, and X equally**, sold comps, Oracle Value (median + IQR), source toggles. Part-level data is engine-internal, not the public mark. No marketplace/social in v1.

## Before coding

**Start at [`blueprint/README.md`](blueprint/README.md)** — the project's second
brain. It routes you to the two or three documents that match your task and
maps the whole repo.

1. [`.specify/memory/constitution.md`](.specify/memory/constitution.md) — **binding** (Railway-only DB, tally-before-delete)
2. [`blueprint/README.md`](blueprint/README.md) — entrypoint and navigation
3. `.cursor/rules/` (`railway-only.mdc`, `scavenge-first.mdc`)
4. [`docs/RAILWAY_ONLY.md`](docs/RAILWAY_ONLY.md) + [`docs/CURRENT_STATE.md`](docs/CURRENT_STATE.md)
5. [`docs/ATTRIBUTIONS.md`](docs/ATTRIBUTIONS.md) — borrowed patterns

### Spec Kit (GitHub)

This repo is Spec Kit–initialized. Prefer **Spec → Plan → Tasks → Implement**:

- `/speckit-constitution` · `/speckit-specify` · `/speckit-plan` · `/speckit-tasks` · `/speckit-implement`
- CLI: `specify` (install: `uv tool install specify-cli`)

### Environment (NON-NEGOTIABLE)

| | Where |
|--|--------|
| **Pricing DB / oracle marks / live comps** | **Railway Postgres only** |
| **Workers / fleet / Redis** | **Railway only** |
| **Source code** | GitHub `SendArcade/Requiem-0-Zeta` |
| **Local laptop** | Edit code + unit tests — **not** a pricing database |

**Do not** `pnpm docker:up` / local Postgres for pricing or backfill.  
**Do** tally Railway row counts before any destructive local cleanup.

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
pnpm catalog:build           # rebuild parts.json from BeyBrew + Fandom wiki
pnpm ingest:fixtures         # smoke adapters only (no pricing DB)

# Pricing / oracle / backfill = Railway (not local Docker)
# railway run --service worker pnpm product:coverage
# Fleet: see docs/PRODUCT_BACKFILL_FLEET.md + docs/RAILWAY_ONLY.md
pnpm backfill:products:fleet-plan

# Local web UI only (fixtures or Railway-backed DATA_SOURCE when configured)
pnpm dev                     # :3000 — does not require docker:up for pricing

# measure matcher accuracy (can run without local DB; needs network for live)
MERCARI_API_ENABLED=1 pnpm --filter @beyoracle/ingest probe:mercari
```

Deprecated for pricing work: `pnpm docker:up`, local `db:seed` as “prod”.

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

## Cursor Cloud specific instructions

Toolchain: Node ≥20 (VM has 22.x) + pnpm 9.15.4 via Corepack. Install with
`pnpm install --frozen-lockfile` (this is the environment update script). No
Postgres/Redis/Docker is needed for local dev — the Railway-only rule stands.

**Internal packages must be compiled to `dist/` before `pnpm typecheck`, `pnpm test`,
and `pnpm dev`.** Every `@beyoracle/*` package resolves via its `package.json`
`exports` → `dist/` (the web app also lists `db`/`ingest`/`events` in
`serverExternalPackages`, so they are loaded from `dist/`, not source). A fresh
checkout has no `dist/`, so those commands fail until you build.

Build gotcha — `catalog` ↔ `oracle` package.json cycle: a single clean
`pnpm build` is non-deterministic and usually fails because `oracle` compiles
before `catalog/dist` exists. `catalog` builds fine without `oracle`
(`tsconfig` excludes `src/seed.ts`, the only file importing `oracle`), so build
`catalog` first. Deterministic recipe from a clean tree:

```bash
pnpm --filter @beyoracle/shared --filter @beyoracle/db --filter @beyoracle/events --filter @beyoracle/jobs build
pnpm --filter @beyoracle/catalog exec tsc
pnpm -r build            # oracle now resolves catalog; builds ingest/worker/web too
```

Once `dist/` exists, a plain `pnpm build` succeeds in one pass. Hot reload does
NOT pick up edits to internal packages — rebuild the changed package (e.g.
`pnpm --filter @beyoracle/oracle build`) and restart `pnpm dev`.

Run the web app locally on fixtures (no DB/Redis):

```bash
DATA_SOURCE=fixtures REDIS_ENABLED=0 pnpm dev   # :3000
```

Fast, reliable local paths (no product matcher): part/asset oracle —
`GET /api/asset/{partId}` and page `/asset/{partId}` (Oracle Value + IQR band +
per-condition marks + source toggles via `?sources=` / `?conditions=`).

Slow/avoid in fixtures mode: broad `GET /api/search`, `/product/{id}`,
`/browse/products`. The product matcher rebuilds its full context **per fixture**
and is CPU-bound; a broad search can peg Node's single thread and block the
whole dev server (kill the `next-server` PID and restart if that happens). The
**watchlist** needs Postgres (Railway), so it does nothing in fixtures mode.

Known pre-existing `pnpm test` failures in `packages/oracle` (WIP product
matcher, unrelated to setup): `product-eval.test.ts` passes only with a longer
timeout (~123s vs vitest's 5s default), and the "Burst identity product matcher"
case in `matcher.test.ts` asserts `.toMatch()` on a non-string object and fails
fast. The rest of the suite (48/50) passes.

### Railway CLI on Cloud Agents

`RAILWAY_TOKEN` in this environment is a **project token** (UUID), not an account
token. It is valid — `railway whoami` fails because that command needs a dashboard
token (`RAILWAY_API_TOKEN`). Use project-scoped commands directly:

```bash
railway redeploy -s web -y --from-source
railway redeploy -s worker -y --from-source
railway variable set -s worker KEY=value
railway deployment list -s worker --json
railway logs -s worker
```

See `.cursor/rules/railway-only.mdc` for the full token-type table.

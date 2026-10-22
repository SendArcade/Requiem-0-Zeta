# RAILWAY DEPLOYMENT PLAN

**Status:** PLAN ONLY — **DO NOT DEPLOY** until explicit approval after commit/push.  
**Date:** 2026-09-25  
**Source of truth for commands:** `package.json`, `apps/web/Dockerfile`, `apps/worker/Dockerfile`, `railway.toml`, `docs/CURRENT_STATE.md`, `docs/RAILWAY_ONLY.md`

---

## 0. Architecture (current vs intended)

| Component | Exists on Railway today? | Role |
|-----------|--------------------------|------|
| **Requiem web** (`@beyoracle/web`) | **YES** — documented URL `https://web-production-5c33a.up.railway.app` | Catalogue + Oracle APIs + Next UI |
| **Worker** (`@beyoracle/worker`) | **YES** | Ingest / recompute / fleet |
| **Postgres + Redis** | **YES** | Canonical pricing DB + queues |
| **RIPBEYS** (`@ripbeys/web`) | **NO** — not in Dockerfiles / railway.toml | Vite SPA consumer of Requiem `/api/*` |

RIPBEYS is a **separate static frontend**. It must call the **hosted Requiem web** API. It must **not** assume Vite’s `localhost:3000` proxy in production.

---

## 1. Requiem service (`web`)

| Item | Value (from repo) |
|------|-------------------|
| Root / build context | Monorepo root |
| Dockerfile | `apps/web/Dockerfile` (`RAILWAY_DOCKERFILE_PATH=apps/web/Dockerfile`) |
| Build | Inside Docker: filter-build shared → db → events → catalog → oracle → ingest → `@beyoracle/web` |
| Start | `pnpm exec next start -H 0.0.0.0 -p ${PORT:-3000}` |
| Expose | `3000` (Railway injects `PORT`) |
| Local start (dev) | `pnpm --filter @beyoracle/web dev` / root `pnpm dev` → `:3000` |
| Local start (prod-like) | After build: `pnpm --filter @beyoracle/web start` |
| Redeploy (project token) | `railway redeploy -s web -y --from-source` |

**Health-check endpoint:** No dedicated `/api/health` route exists (API routes: product, asset, search, watchlist, alerts, events, admin/review). Use:

```text
GET {REQUIEM_PUBLIC_URL}/api/product/{knownProductId}
```

as liveness + Oracle smoke (expect 200 JSON or 404 if ID unknown — not connection failure).

---

## 2. RIPBEYS service (new — not yet configured)

| Item | Value (from repo) |
|------|-------------------|
| Root directory | `apps/ripbeys` |
| Build command | `pnpm --dir apps/ripbeys build` (= `tsc -b && vite build`) |
| Dev command | `pnpm --dir apps/ripbeys dev` (Vite; proxies `/api` → `localhost:3000`) |
| Preview | `pnpm --dir apps/ripbeys preview` |
| Output | `apps/ripbeys/dist/` static assets |
| Dockerfile | **None in repo** |

### Hosting options (choose one before deploy)

**A. Static host (recommended for SPA)**  
- Build `dist/` in CI or Railway Nixpacks/`staticfile`  
- Serve with any static CDN / Railway static  
- Set build-time `VITE_REQUIEM_API_BASE=https://web-production-5c33a.up.railway.app` (or current public Requiem origin)

**B. New Railway service with Node static server**  
- Requires adding a Dockerfile or `serve` start — **not present today**; do not invent without approval

**C. Same Railway project, separate service**  
- Networking: public HTTPS to Requiem web; RIPBEYS browser calls public Requiem URL (CORS — see §11)

Until a RIPBEYS Dockerfile/service exists, **do not run `railway up` for ripbeys**.

---

## 3. Database dependency

| Item | Notes |
|------|-------|
| System of record | Railway Postgres (`DATABASE_URL` on web + worker) |
| Redis | `REDIS_URL` for BullMQ / SSE |
| Local Docker pricing DB | **Forbidden** for pricing (`docs/RAILWAY_ONLY.md`) |
| Catalog identity | Loaded from `@beyoracle/catalog` seed JSON **in the web image** (`COPY packages`) |
| Oracle marks | `product_oracle_snapshots` / `oracle_snapshots` in Postgres |

**New seed products** (e.g. `prod-x-dran-dagger-4-60r-complete-loose`) appear in API **identity/recipe** once catalog package is deployed. **Live mark values** appear only if Railway already has (or later gains via approved ingest/recompute) snapshots for those IDs.  
**`pnpm db:seed` against Railway = DATA WRITE — requires explicit approval.**

---

## 4–7. Build / start / roots (checklist)

| Service | Root | Build | Start |
|---------|------|-------|-------|
| web | repo root + Dockerfile | Docker multi-stage (see Dockerfile) | `next start` as above |
| worker | repo root + `apps/worker/Dockerfile` | Docker multi-stage | `node packages/worker/dist/index.js` |
| ripbeys | `apps/ripbeys` | `pnpm build` → `dist/` | Static host / TBD |

---

## 8. Required environment variables

### Requiem `web` (existing pattern from `docs/CURRENT_STATE.md`)

| Variable | Purpose | Mutates DB? |
|----------|---------|-------------|
| `DATABASE_URL` | Postgres | Read (API); writes only via app features (watchlist etc.) |
| `REDIS_URL` / `REDIS_ENABLED` | Events | No pricing wipe |
| `DATA_SOURCE` | `auto` / `db` / `fixtures` | Read path only |
| Live ingest flags | Usually on **worker**, not required for read-only Oracle | — |

### RIPBEYS (build-time Vite)

| Variable | Purpose | Production |
|----------|---------|------------|
| `VITE_REQUIEM_API_BASE` | Absolute Requiem origin, no trailing slash | **MUST SET** to public Requiem URL |
| `VITE_MARKET_OPEN` | Market gate | Set `0`/`false`/`gated` for public ComingSoon; open for investor demos |

**Do not bake `http://localhost:3000` into production builds.**

### Worker

Unchanged from existing Railway ops docs — ingest/backfill flags are **write paths**; leave alone for read-only Oracle verification.

---

## 9. Public API URL

Documented production web:

```text
https://web-production-5c33a.up.railway.app
```

Confirm current public URL with Railway dashboard / deployment list before hard-coding into RIPBEYS build. RIPBEYS then calls:

```text
{VITE_REQUIEM_API_BASE}/api/product/{id}
{VITE_REQUIEM_API_BASE}/api/asset/{id}
```

---

## 10. Frontend API configuration

| Mode | Mechanism |
|------|-----------|
| Local dual-app | Vite `server.proxy['/api']` → `http://localhost:3000` (`apps/ripbeys/vite.config.ts`) — **SAFE LOCAL DEVELOPMENT** |
| Production | `VITE_REQUIEM_API_BASE` — **MUST CHANGE FOR PRODUCTION** |
| Empty base + relative `/api` | Works only if RIPBEYS is served behind same origin as Requiem or a reverse proxy — **POTENTIAL BUG** if static-hosted alone |

---

## 11. CORS requirements

Requiem Next API routes inspected in this plan: **no explicit CORS headers** found in `apps/web/src/app/api/**`.

If RIPBEYS is on a **different origin** than Requiem:

- Browser `fetch` to Requiem will fail CORS unless:
  - Next middleware/headers add `Access-Control-Allow-Origin`, **or**
  - RIPBEYS is reverse-proxied under the same origin (`/api` → Requiem), **or**
  - a BFF proxies Oracle

**Action before deploy:** decide same-origin proxy vs CORS headers on Requiem. **Do not silently change Requiem CORS without approval** (touches `apps/web`).

---

## 12. Railway networking

| Need | Notes |
|------|-------|
| Web public HTTPS | Already |
| Worker private | Talks to Postgres/Redis internal |
| RIPBEYS → Web | Browser → public Web URL (or same-origin proxy) |
| Internal-only Requiem | **Breaks** RIPBEYS browser clients |

---

## 13. Health-check

| Check | Command / URL |
|-------|----------------|
| Web up | `GET /api/product/prod-x-bx-01-complete` (or any known seeded product on HEAD) |
| New dagger identity after catalog deploy | `GET /api/product/prod-x-dran-dagger-4-60r-complete-loose` — 200 with `product` object; `oracle` may be null until marks exist |
| Worker | Logs / Redis queue (ops) — not required for read-only UI smoke |

---

## 14. Deployment order (when approved)

1. **Preserve & commit** local tree per `PRE_DEPLOY_CHANGESET.md` (manual approval).  
2. **Push** to GitHub (manual approval).  
3. **Redeploy Requiem `web`** so catalog seeds (new product IDs) are in the image — `railway redeploy -s web -y --from-source`.  
4. **Do not** run `db:seed` / destructive migrate / purge without separate approval.  
5. **Read-only verify** Oracle endpoints against Railway URL.  
6. **Build RIPBEYS** with production `VITE_REQUIEM_API_BASE` (+ market gate as needed).  
7. **Host RIPBEYS** static `dist/` (service/CDN TBD).  
8. **Browser verification** (live Oracle flow § Live plan below).  
9. Rollback if needed (§15).

**Worker redeploy** only if code/env for worker changed — not required for RIPBEYS-only + seed JSON catalog deploy.

---

## 15. Rollback strategy

| Layer | Rollback |
|-------|----------|
| Requiem web | Redeploy previous successful Railway deployment / prior git SHA |
| Catalog seeds | Revert commit of `products-x.json` **only with owner approval** — never `git clean` local WIP |
| RIPBEYS static | Redeploy previous `dist/` artifact / prior commit build |
| Database | **Do not** roll back by wipe; pricing DB rollback is restore-from-backup only (ops) |

---

## 16. Migration safety

| Action | Safe for read-only verify? | Approval needed? |
|--------|----------------------------|------------------|
| Redeploy web with new catalog JSON | Usually yes (code + catalog read) | Deploy approval |
| `pnpm db:migrate` on Railway | May alter schema | **YES — manual** |
| `pnpm db:seed` on Railway | Writes products/parts | **YES — manual** |
| `purge:bad-comps` / fleet backfill | Writes matches/comps/marks | **YES — manual** |
| RIPBEYS static deploy | No DB touch | Deploy approval |

Connecting web to existing `DATABASE_URL` **without** seed/migrate/purge is the read-only path.

---

## 17. How to verify the original Oracle live

See **§ Live Oracle Verification Procedure** below (same doc). Numeric values must come from API responses — never invent.

---

## Live Oracle Verification Procedure

**Prerequisites:** Requiem web reachable with Railway `DATABASE_URL`; catalog deploy includes dagger seed if testing `bx-002` product id.

### A. API-only (no RIPBEYS)

```bash
# 1) Requiem up (local tunnel OR public Railway URL)
# Local with Railway DB (ops — uses secrets; never print DATABASE_URL):
#   railway run -s web pnpm --filter @beyoracle/web dev
# Or hit production:
#   set BASE=https://web-production-5c33a.up.railway.app

# 2) Product Oracle — Dagger Dran identity
curl -sS "$BASE/api/product/prod-x-dran-dagger-4-60r-complete-loose" | jq "{id: .product.id, oracle: .oracle}"

# 3) Part Oracle — bx-024 maps to x-blade-dranzer-spiral
curl -sS "$BASE/api/asset/x-blade-dranzer-spiral" | jq "{id: .part.id, oracle: .oracle}"

# 4) Confirm fields if oracle present: value, low, high, nComps, confidence, currency, asOf
# If oracle is null → UNAVAILABLE is correct (do not fabricate)
```

### B. Bridge expectations (local files — already verified)

| Listing | Bridge `oracleKind` | Requiem target |
|---------|---------------------|----------------|
| `bx-002` | `product` | `prod-x-dran-dagger-4-60r-complete-loose` |
| `bx-024` | `part` | `x-blade-dranzer-spiral` |
| `bx-007` | `none` | Needs seed / assembled_without_product_seed |
| `bx-001` | `none` | `ambiguous_identity` |

### C. RIPBEYS UI

1. Build with `VITE_REQUIEM_API_BASE=$BASE` (not localhost).  
2. Open `/market/bx-002` — value must match API `oracle.value` (or explicit unavailable/error).  
3. Confirm Network tab: `GET …/api/product/prod-x-dran-dagger-4-60r-complete-loose` only.  
4. Confirm no use of `Listing.price`.  
5. Repeat `bx-024` (part mark caveats), `bx-007` (needs seed), `bx-001` (ambiguous).  
6. Kill API / wrong base → UI shows error/unreachable — page must not crash.

### D. Pass criteria

- [ ] API responds (not TCP timeout)  
- [ ] Response schema includes `oracle` object or null — not a client invention  
- [ ] RIPBEYS displays API fields only  
- [ ] Currency/confidence/comps/asOf match payload when present  
- [ ] No hardcoded fallback price  

---

## Localhost reference classification

| Reference | File | Class |
|-----------|------|-------|
| Vite proxy `localhost:3000` | `apps/ripbeys/vite.config.ts` | **SAFE LOCAL DEVELOPMENT** |
| Comment example `VITE_REQUIEM_API_BASE` | `requiemOracle.ts` | **DOCUMENTATION ONLY** |
| Docs `DATABASE_URL` default localhost | `docs/CURRENT_STATE.md` | **DOCUMENTATION ONLY** (local defaults; Railway overrides in prod) |
| Empty `VITE_REQUIEM_API_BASE` in prod static host | — | **MUST CHANGE FOR PRODUCTION** / **POTENTIAL BUG** |

---

## Railway DB safety (Phase 7)

| Path | Modifies data? |
|------|----------------|
| `GET /api/product/*`, `GET /api/asset/*` | No (read) |
| Deploy web image with new seeds | No DB write by itself |
| Watchlist POST | Yes (user data) — avoid in smoke |
| `db:seed` / migrate / purge / backfill | **Yes — APPROVAL REQUIRED** |

**Read-only verification path:** point web at existing Railway Postgres → curl Oracle endpoints → observe.  
**Seed requirement for new product marks:** catalog JSON deploy ≠ automatic `product_oracle_snapshots`; expect null oracle until ingest/recompute (approved) or existing data.

---

*End of plan. STOP — no deploy executed.*

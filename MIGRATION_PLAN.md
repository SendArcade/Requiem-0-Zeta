# RIPBEYS → Requiem-0-Zeta Migration Plan

**Status:** Assessment complete. Local-only. No git commit/push/deploy.  
**Date:** 2026-09-21  
**Sources:**
- Main: `D:\Requiem-0-Zeta` (cloned from `SendArcade/Requiem-0-Zeta`)
- Frontend/assets: `D:\beyblade\web` (local RIPBEYS product + recovered models; Railway asset host gone)

---

## 1. Repository architecture (target)

```
Requiem-0-Zeta/                          ← single canonical repo
├── apps/
│   ├── web/                             ← KEEP: Next.js oracle research UI
│   │                                    (/browse, /product/[id], /asset/[id], watchlist)
│   └── ripbeys/                         ← ADD: Vite consumer product (landing, lab, beys, market, locker)
├── packages/
│   ├── db / catalog / oracle / ingest / worker / shared / events / jobs  ← UNTOUCHED brain
│   └── ripbeys-assets/ (optional later) ← mapping + validation helpers
├── public/ or apps/ripbeys/public/
│   └── assets/                          ← LOCAL vault of recovered 3D + media
└── MIGRATION_PLAN.md                    ← this file
```

**Decision (recommended, pending your approval):**  
Do **not** replace `apps/web`. Add `apps/ripbeys` as a second app in the pnpm workspace. Consumer marketing UX stays RIPBEYS; oracle/tools stay Requiem web. Both call the same catalogue + `/api/product/[id]` + `/api/asset/[id]`.

Alternative (larger, riskier): port RIPBEYS into Next App Router inside `apps/web`. Not recommended for v1 of this merge.

---

## 2. Current Requiem structure

| Path | Role |
|------|------|
| `apps/web` | Next.js 15 App Router + Tailwind; search/browse/product/asset/watchlist/admin |
| `packages/db` | Drizzle + Postgres schema |
| `packages/catalog` | Seeds, matcher context, 1,105 parts + 448 products |
| `packages/oracle` | Matcher + median/IQR valuation |
| `packages/ingest` | Mercari/Yahoo/Shopee/… adapters |
| `packages/worker` | BullMQ cron on Railway |
| `packages/shared` | DTOs, FX, provenance |
| `packages/events` / `jobs` | Redis bus + job schemas |

**Canonical IDs today:**
- **Parts:** `x-blade-dran-dagger`, `x-bx-01-blade`, `burst-…` (slug IDs)
- **Products (whole SKU):** `prod-x-bx-02-starter`, `prod-x-bx-20-complete-loose`, …  
- **Official product codes:** `BX-02`, `BX-20`, … in `productCodes[]`
- **Oracle:** `product_oracle_snapshots.productId` → products; `oracle_snapshots.assetId` → parts

**Existing frontend-safe APIs (reuse — do not invent):**
- `GET /api/product/[id]` → product + parts + recipe + oracle + comps + chart
- `GET /api/asset/[id]` → part-level oracle
- `GET /api/search`, `/api/watchlist`, `/api/alerts`, `/api/events`, `/api/admin/review`

**Env / deploy:** Railway-only pricing DB (`docs/RAILWAY_ONLY.md`). Local laptop = code + unit tests, not pricing DB.

---

## 3. Current RIPBEYS structure (`D:\beyblade\web`)

| Area | Notes |
|------|------|
| Framework | **Vite 8 + React 19 + react-router-dom 7** (not Next) |
| 3D | Three.js + FBX/OBJ via `ModelViewer` / `loadModel` / `dressMaterials` |
| Catalogue | Hardcoded `marketplaceListings` in `src/lib/assets.ts` with IDs `bx-001`, `bx-002`, … |
| Prices | **Hardcoded USD fantasy prices** on listings — must be removed for oracle-backed UI |
| Assets | `public/assets/models` (~437 FBX, ~764 PNG), game sprites, official art, partners (~1.5 GB) |
| Server | Express + optional Redis + S3/Railway bucket proxy (`server/`) — **bucket credentials gone** |
| Routes | `/`, `/lab`, `/market` (coming soon), Burst/X pages |
| Validate | `npm run validate:assets` → `scripts/validate-catalog.mjs` |

RIPBEYS **does not** call Requiem APIs today.

---

## 4. Conflicts (do not silently resolve)

### C1 — CRITICAL: ID namespace collision

| RIPBEYS listing ID | RIPBEYS name | Requiem `BX-0N` product | Requiem product name |
|--------------------|--------------|-------------------------|----------------------|
| `bx-002` | Dagger Dran 4-60R | `prod-x-bx-02-*` (`BX-02`) | **Wizard Arrow (4-60T)** |
| `bx-001` | Dran Sword 3-60F | `prod-x-bx-01-*` (`BX-01`) | Dran Sword (aligned-ish) |

**RIPBEYS `bx-NNN` are sequential UI IDs, not Takara product codes.**  
Treating `bx-002` as `BX-02` would wire the wrong Bey to the wrong oracle.

### C2 — CRITICAL: BX-20 meaning split inside Requiem + game assets

| Source | BX-20 means |
|--------|-------------|
| RIPBEYS / recovered game decal `BX20_DranDagger_4-60R.png` | Dran Dagger |
| Requiem part `x-blade-dran-dagger` | productCodes include `"BX-20"` |
| Requiem product `prod-x-bx-20-*` | **Shark Edge (3-80F)** with `x-blade-shark-edge` |

**Decision required:** Which Requiem **product** id should RIPBEYS “Dagger Dran 4-60R” bind to for oracle marks?
- Prefer mapping by **blade part** `x-blade-dran-dagger` + combo parts, then pick/create a publishable product row — **do not** use `prod-x-bx-20-*` as Shark Edge without confirmation.
- May need a new seed product e.g. `prod-x-dran-dagger-4-60r-complete-loose` — **your call**.

### C3 — Framework

| | Requiem web | RIPBEYS |
|--|-------------|---------|
| Bundler | Next 15 | Vite 8 |
| Routing | App Router | react-router-dom |
| CSS | Tailwind | Custom CSS (landing-x, lab, etc.) |
| React | 19 | 19 (compatible) |

### C4 — Catalogue philosophy

| Requiem | RIPBEYS |
|---------|---------|
| Parts + whole products; oracle on sold comps | Single “listing” = assembled toy + art + FBX |
| No 3D fields in DB | Models/textures are first-class UI |
| Price = oracle JPY | Price = hardcoded USD |

### C5 — Assets hosting

RIPBEYS previously proxied missing files from Railway bucket. **Bucket gone.**  
Local `public/assets` must be the vault. Slim “keepModels” deploy packs are obsolete for this merge.

### C6 — Duplicate / divergent names

Examples needing a mapping table (name → Requiem part/product), not numeric ID:
- RIPBEYS “Scythe Incendio” vs Requiem “Hells Scythe” (BX-03)
- RIPBEYS “Horn Rhino” vs Requiem naming
- Burst OBJ layers vs Requiem burst product seeds

### C7 — What must stay untouched

Do **not** rewrite: matcher, ingest adapters, oracle math, worker crons, Drizzle migrations semantics, Railway constitution, Spec Kit constitution.

---

## 5. Canonical data model

**Stable link = Requiem product id** (whole Bey SKU) when an assembled product exists; else **part id** for blade/layer-only.

```
Requiem product id  (e.g. prod-x-bx-01-starter)
├── productCodes[]     (BX-01, …)
├── partIds[]          (blade, ratchet, bit)
├── product_oracle_snapshots
├── product_matches → observations (comps)
└── attrs.ripbeys      (NEW presentation metadata — see below)
        ├── listingKey: "ripbeys:bx-001"   # legacy UI id, not product code
        ├── model: { assembled, blade, ratchet, bit, textures[] }
        ├── media: { poster, chip, … }
        ├── tint, seriesClass, …
```

**Do not** make `bx-002` the primary key in Requiem DB.

**RIPBEYS fields with no Requiem column today** (propose `products.attrs.ripbeys` or side table `ripbeys_presentations`):

| RIPBEYS field | Proposal |
|---------------|----------|
| `model` / stack parts | `attrs.ripbeys.models` paths under asset vault |
| `texture` / tint / accent | presentation attrs |
| `image` / poster | media paths |
| `creator` / `edition` | presentation-only (not oracle) |
| `price` | **DROP** — replace with API oracle |
| `class` (Attack/…) | map to part/product attrs.type where possible |

---

## 6. Asset migration plan

**Source:** `D:\beyblade\web\public\assets\` (~1.5 GB, 437 FBX, 764 model PNGs + game/official).

**Target (deterministic, preserve filenames):**

```
apps/ripbeys/public/assets/
  models/          ← copy as-is (FBX/OBJ/PNG AO/decals) — DO NOT rename
  game/
  official/
  partners/
  *.png heroes, logo, …
  beys/            ← NEW index-only folder (optional symlinks/json, not forced GLB conversion)
    <requiem-product-or-part-id>/
      manifest.json  ← maps roles → relative paths into /assets/models/...
```

**Why not force `blade.glb` renames:** originals are FBX; ModelViewer already loads FBX. Conversion is optional later.

**Shared assets:** AO/decal PNGs shared across molds stay in `models/`; manifests reference them (no duplication).

**Mapping file:** `packages/catalog/data/ripbeys-asset-map.json` (or `apps/ripbeys/src/data/bey-asset-map.json`):

```json
{
  "ripbeysListingId": "bx-002",
  "displayName": "Dagger Dran 4-60R",
  "requiemPartIds": ["x-blade-dran-dagger", "x-ratchet-4-60", "x-bit-r"],
  "requiemProductId": null,
  "requiemProductIdCandidates": [],
  "conflict": "BX-20 product row is Shark Edge; part codes claim BX-20 for Dran Dagger",
  "assembledModel": "/assets/models/dagger_dran.fbx",
  "decal": "/assets/models/BX20_DranDagger_4-60R.png"
}
```

---

## 7. Frontend migration plan

**Stage A — workspace app:** `apps/ripbeys` Vite app; copy `src/`, styles, public assets; keep visual identity.

**Stage B — data layer:** Replace hardcoded `price` usage with:
```
fetch(`${REQUIEM_API}/api/product/${requiemProductId}`)
```
Proxy in Vite/Next or same-origin when served behind Requiem gateway.

**Stage C — routes:**

| Route | App |
|-------|-----|
| `/` `/lab` `/beys` `/beys/[id]` `/market` `/locker` | ripbeys |
| `/browse` `/product/[id]` `/asset/[id]` `/search` `/watchlist` | web (oracle) |

**Stage D — ModelViewer:** keep in ripbeys; load local vault paths from asset map.

**Stage E — missing states:** no model / no oracle / no comps → explicit empty UI (no crash, no fabricated prices).

---

## 8. API integration plan

1. Reuse `GET /api/product/[id]` and `GET /api/asset/[id]` as-is.
2. Optional thin BFF on ripbeys Express **only if** CORS/dev convenience needed — prefer configuring Requiem web CORS or Next rewrite.
3. Add **read-only** endpoint only if needed:  
   `GET /api/ripbeys/bey/[listingOrProductId]` → resolves map + oracle — **only after** mapping conflicts resolved.
4. Never expose `DATABASE_URL` or worker internals to the browser.

---

## 9. Routing plan

Monorepo scripts:
```json
"dev:oracle": "pnpm --filter @beyoracle/web dev",
"dev:ripbeys": "pnpm --filter @ripbeys/web dev",
"dev": "… both or document ports 3000 + 5173"
```

Production later (your deploy): reverse-proxy host → ripbeys; `/api/*` → Requiem web. **Out of scope for this local migration.**

---

## 10. Dependency changes (planned)

| Package | Change |
|---------|--------|
| root `pnpm-workspace` | already `apps/*` — add `apps/ripbeys` |
| `@ripbeys/web` | new: vite, three, framer-motion, gsap, react-router (from RIPBEYS) |
| `@beyoracle/*` | **no** oracle/matcher dependency changes required for stage 1–2 |
| AWS S3 SDK in RIPBEYS server | optional/legacy; not required if all assets local |

---

## 11. Risks

1. Wrong oracle if numeric `bx-NNN` ↔ `BX-NN` assumed.
2. Internal Requiem BX-20 inconsistency (Shark Edge product vs Dran Dagger part codes).
3. 1.5 GB assets → git LFS / storage policy (you decide before commit).
4. FBX + Three.js only in Vite app — Next SSR must not import Three on server without dynamic import.
5. Hardcoded RIPBEYS prices accidentally shipping as “oracle”.
6. Case-sensitive paths on Linux Railway vs Windows local.

---

## 12. Validation plan

Per stage:
- `pnpm --filter @beyoracle/web typecheck`
- `pnpm --filter @beyoracle/db` / catalog / oracle tests as touched
- `pnpm --filter @ripbeys/web` build + `validate:assets`
- Spot-check: listing → map → local FBX loads; product API returns oracle or explicit null

---

## 13. Proposed final structure (summary)

ONE repo · TWO UIs · ONE catalogue · ONE oracle · ONE local asset vault · mapping table as the join.

---

## Decisions needed from you before binding IDs in code

1. **Confirm app layout:** `apps/ripbeys` + keep `apps/web`? (recommended)
2. **Dagger Dran:** bind oracle to part `x-blade-dran-dagger` only until a correct product row exists, **or** authorize a new `prod-x-…` seed?
3. **BX-20 catalog defect:** fix product seed (Shark Edge vs Dran Dagger) in a separate PR, or leave documented only for now?
4. **Git LFS / asset commit size:** copy all 1.5 GB into tree now, or vault + `.gitignore` large binaries until you approve?

---

## Implementation stages (local)

| Stage | Action | Status |
|-------|--------|--------|
| 0 | This plan | **done** |
| 1 | Generate draft `ripbeys-asset-map.json` (name-based; flag conflicts) | next |
| 2 | Copy `public/assets` → `apps/ripbeys/public/assets` (preserve) | next |
| 3 | Scaffold `apps/ripbeys` Vite app from `D:\beyblade\web` | after your ID decisions preferred |
| 4 | Wire oracle fetch; strip hardcoded prices from UI surfaces | after 3 |
| 5 | typecheck / build / validate report | end |

**Stopped short of overwriting any Requiem catalogue seeds** until you answer decisions 2–3.

# FULL REQUIEM 0 ZETA + RIPBEYS REGRESSION AUDIT

**Date:** 2026-09-24  
**Mode:** READ-ONLY forensic audit (Stages 1–11 claims verified against repository)  
**Branch:** `main`  
**Auditor constraint:** No application code, seed, migration, Oracle, DB, commit, push, deploy, or revert operations intended. Validation scripts that regenerate bridge/visual JSON were run for evidence (see §H).

---

## 1. EXECUTIVE SUMMARY

### Verdict (evidence-based)

| Claim | Status |
|-------|--------|
| Original Requiem Oracle **math** (`packages/oracle`) intact | **VERIFIED WORKING** — no local modifications to `packages/oracle`, `packages/db`, `packages/ingest`, `packages/worker`, `apps/web` in the working tree |
| RIPBEYS consumes Requiem API rather than replacing Oracle | **VERIFIED WORKING** — `fetchListingOracle` → `GET /api/product|asset` only; no client median/IQR |
| RIPBEYS listing ID ≠ Takara BX code | **VERIFIED** in bridge/map warnings + identity rules; hazards handled without silent BX-20 Shark binding |
| 26 / 104 / 448 / 578 bridge counts | **VERIFIED** against regenerated `oracle-bridge.json` |
| 578/578 models + posters | **VERIFIED** via `validate:assets` + `build:visual-assets` |
| Live Railway Oracle marks | **NOT VERIFIED** — Requiem `:3000` unreachable during audit |
| Migration left catalogue seeds untouched | **CLAIM FALSE** — working tree has **+223 lines** additive inserts in `products-x.json` (uncommitted); required for current Product Oracle bindings (e.g. Dran Dagger) |
| Entire RIPBEYS app is on `main` remote | **NOT VERIFIED / BLOCKED** — `apps/ripbeys/` is **untracked** (`??`); not in git history |

### Bottom line

- **Oracle engine and Requiem web APIs appear preserved** as the system of record for valuation.
- **RIPBEYS is an additive consumer UI + identity bridge**, not a fork of Oracle math.
- **Largest integrity risk is operational/git state**, not Oracle formula regression: Product Oracle “26 PASS” and Dagger showcase depend on **uncommitted** seed rows + an **untracked** `apps/ripbeys` tree. A clean checkout of `origin/main` alone does **not** reproduce the Stage 11 demo as documented.

No overall score is assigned (per instructions).

---

## 2. ORIGINAL REQUIEM PRESERVATION

### 2.1 Oracle

| Path | Purpose | Status | Callers | Dependencies | Changed since migration? | Regression risk |
|------|---------|--------|---------|--------------|--------------------------|-----------------|
| `packages/oracle/src/oracle-value.ts` | `computeOracleValue` / `computeProductOracleValue` | Present | ingest persist, web data loaders | robust-estimator, shared | **No local diff** vs HEAD packages | Low |
| `packages/oracle/src/robust-estimator.ts` | median, weighted median/IQR, MAD | Present | oracle-value | — | No | Low |
| `packages/shared` confidence/windows | `resolveOracleConfidence`, window days | Present | oracle, web | — | No | Low |
| `packages/db` `oracle_snapshots` / `product_oracle_snapshots` | Persisted marks | Present | ingest, web | Postgres/Railway | No | Low |

### 2.2 Backend / API

| Path | Purpose | Status |
|------|---------|--------|
| `apps/web/src/app/api/product/[id]/route.ts` | Product + oracle + comps | Intact (no local mod) |
| `apps/web/src/app/api/asset/[id]/route.ts` | Part oracle | Intact |
| `apps/web/src/lib/product-data.ts` | Assembles product response | Intact |
| `apps/web/src/lib/db-data.ts` / `data.ts` | Asset data | Intact |

### 2.3 Workers / ingestion

| Path | Purpose | Status |
|------|---------|--------|
| `packages/ingest/src/persist.ts` | Match persist + oracle recompute | No local mod |
| `packages/worker` `oracle.recompute` | Part snapshot batch | No local mod |
| Ingest adapters | Mercari/Yahoo/… | No local mod (unrelated recent commits on `main` are ingest/fleet — predate/outside RIPBEYS untracked tree) |

### 2.4 Catalogue / seeds

| Path | Purpose | Status |
|------|---------|--------|
| `packages/catalog/data/seeds/products-x.json` | X product seeds | **MODIFIED locally (+223 lines, additive IDs)** — Stage 4A/6A Class B + Dran Dagger seed etc. |
| `packages/catalog/data/parts.json` | Parts | No local mod observed in `git status` |
| Matcher (`packages/oracle` matcher / catalog) | Listing→identity | Map **builder scripts** added; matcher package itself not locally dirty |

### 2.5 Database

Railway-only pricing DB policy unchanged (`docs/RAILWAY_ONLY.md`). **Live DB tallies NOT VERIFIED** in this audit (no Railway connect).

---

## 3. ORACLE AUDIT

### 3.1 Original implementation (baseline)

- Valuation computed in **`packages/oracle`** (v1 plain median; default v2 weighted median + IQR band).
- Marks persisted to **`product_oracle_snapshots`** / **`oracle_snapshots`**.
- Public read path: **`GET /api/product/[id]`**, **`GET /api/asset/[id]`** returning `oracle: { value, low, high, nComps, confidence, currency, asOf, … }`.
- Sold comps filtered to mark-eligible evidence; confidence from shared helpers.

### 3.2 Current RIPBEYS implementation

```
OracleValuation / Marketplace
  → fetchListingOracle(listingId)
  → oracle-bridge.json (oracleKind product|part|none)
  → fetch /api/product/:requiemProductId  OR  /api/asset/:requiemPartId
  → parseOracleBlock (copy fields only)
  → formatOracleValue (Intl display only)
```

**Evidence files:** `apps/web/src/consumer/lib/requiemOracle.ts`, `oracleBridge.ts`, `OracleValuation.tsx`, `vite.config.ts` proxy `/api` → `localhost:3000`.

### 3.3 Runtime path classification

| Concern | Status | Evidence |
|---------|--------|----------|
| Frontend valuation math | **WORKING (absent)** | No median/IQR in client; only parse + format |
| Hardcoded Oracle fallback | **WORKING (absent)** | Unavailable/error states; no invented value |
| `Listing.price` → Oracle UI | **WORKING (not wired)** | No `item.price` in `pages/`; price still on `Listing` type/data as deprecated fantasy USD |
| Product vs Part | **WORKING** | Cards: product only; detail: part mark with explicit non-Bey caveat |
| Assembled without seed | **WORKING** | `oracleKind=none`, reason `assembled_without_product_seed` — no blade-as-Bey fetch |
| 502/503/504 | **WORKING (code)** | Mapped to `oracle_unreachable` |
| Timeout 12s | **WORKING (code)** | AbortController |
| Cache / inflight | **WORKING (code)** | 60s TTL; 404 cached; network/5xx not sticky-cached |
| Currency / comps / confidence / asOf / band | **WORKING (passthrough)** when API returns them | Live values **NOT VERIFIED** (API down) |

### 3.4 Change classification (Oracle-touching)

| Change | Class |
|--------|-------|
| `packages/oracle/**` | **UNCHANGED** (no working-tree diff) |
| `apps/web` API routes | **UNCHANGED** |
| `apps/ripbeys` Oracle client | **ADDITIVE** adapter |
| `oracle-bridge.json` + build script | **ADAPTER/BRIDGE** |
| Stage 6C map hygiene (CX bits, `(st)` strip) | **ADDITIVE** to map builder (affects which listings become Product Oracle eligible) — **not** Oracle math |
| `products-x.json` new complete_loose rows | **BEHAVIOR CHANGE (catalogue)** additive — expands what can bind to Product Oracle |

### 3.5 Regression findings (Oracle)

- **No confirmed Oracle-math regression.**
- **POTENTIAL REGRESSION / ENV:** Without uncommitted seeds + Railway marks, UI correctly shows unavailable/error — may look “broken” in demos if misread as Oracle failure rather than missing API/DB.

---

## 4. API AUDIT

### Routes used by RIPBEYS

| Path | Method | Request | Response (relevant) | Errors | Callers |
|------|--------|---------|---------------------|--------|---------|
| `/api/product/[id]` | GET | id path; optional `sources`/`conditions` | `{ product, parts, recipe, oracle, comps, chart, … }` | 404 `{ error }` | `requiemOracle.fetchOracleByTarget('product')` |
| `/api/asset/[id]` | GET | id path | `{ part, oracle, comps, … }` | 404 | part path |

### Original vs current

- **No removed/renamed routes found** for these two.
- RIPBEYS assumptions: relative `/api` via Vite proxy; optional `VITE_REQUIEM_API_BASE`.
- Display currency on Requiem routes historically JPY-oriented — RIPBEYS formats `oracle.currency` from payload.

### Other Requiem APIs (not RIPBEYS-critical)

`/api/search`, `/api/watchlist`, `/api/alerts`, `/api/events`, `/api/admin/*` — **NOT audited end-to-end** for RIPBEYS (not called by audited marketplace path). Status: **NOT VERIFIED** for migration side-effects (no local mods observed).

---

## 5. CATALOGUE IDENTITY AUDIT

### Rules (verified in implementation)

- Bridge warning: presentation IDs ≠ Takara codes; never `bx-NNN` → `BX-NN` by number.
- Visual index warning: never pick mesh by Requiem product code / numeric BX similarity.
- Product Oracle uses `requiemProductId`; mesh uses `ripbeysListingId`.

### Hazard re-check (bridge evidence)

| Listing | Observation | Classification |
|---------|-------------|----------------|
| `bx-002` Dagger Dran | `product` → `prod-x-dran-dagger-4-60r-complete-loose` | **VERIFIED** correct (not Shark Edge) |
| `bx-011` Keel Shark | confirmed parts; `oracleKind=none`; `assembled_without_product_seed` | **Demoted** — not falsely Product-Oracled to Shark pack |
| `bx-231` / `bx-274`–`276` | `conflict` `bx-20-catalog-split`; Oracle withheld | **Conflict preserved** |
| `bx-001` / `bx-013` | `ambiguous_identity` | **Unresolved (intentional)** |
| `bx-016`,`018`,`019`,`020`,`023`,`218` | demoted assembled | **Option B** |
| BX-01/22, BX-04/06 | Remain ambiguous policy twins in audits | **Unresolved — do not invent** |
| CX-05 / UX-07 siblings | Integrity audit claims separation maintained | **Claim accepted with Stage 6C report; live matcher NOT re-run here** |

### Seed mutation (critical identity dependency)

Uncommitted **new** product IDs include (diff `+` lines):

- `prod-x-dran-dagger-4-60r-complete-loose`
- `prod-x-hells-reaper-t4-70k-complete-loose`
- `prod-x-bx-16/19/21/23/26/35-complete-loose` (and related Class B set)
- `prod-x-sphinx-cowl-1-80gf-complete-loose`
- `prod-x-dranzer-spiral-3-80t-complete-loose`
- `prod-x-driger-slash-4-80p-complete-loose`

**HEAD (`main`) does not contain `prod-x-dran-dagger-4-60r-complete-loose`.**  
Therefore the Stage 11 “26 Product Oracle / Dagger showcase” configuration is **working-tree dependent**.

---

## 6. 578-LISTING AUDIT

### Totals (verified)

| Kind | Count | Arithmetic |
|------|------:|------------|
| Product Oracle | **26** | |
| Part Oracle | **104** | |
| Unavailable (`oracleKind=none`) | **448** | includes 18 demoted assembled X |
| **Total** | **578** | 26+104+448=**578** |

Map stats (`validate:assets`): confirmed 159 · ambiguous 100 · unmatched 315 · conflict 4 · confirmedWithProduct 26 · confirmedPartOnly 133.

**Note:** `confirmedPartOnly` (133) ≠ Part Oracle (104) because Option B demotes some confirmed assembled X to `oracleKind=none` (18 demoted + other none reasons). **Not a count bug.**

### Visual totals (verified)

| Asset | Count |
|-------|------:|
| Assembled model on disk | 578 |
| Poster on disk | 578 |
| noPreview | 0 |

### Per-listing dump

A full 578-row table is omitted here for size; machine-readable sources of truth:

- `apps/web/src/consumer/data/oracle-bridge.json` → `byListingId`
- `apps/web/src/consumer/data/visual-assets.json` → `byListingId`
- `packages/catalog/data/ripbeys-asset-map.json` → `entries[]`

Any row-level dispute must be checked against those files, not narrative reports.

**Report drift:** `CATALOGUE_IDENTITY_AUDIT.md` still says “14” Product Oracle — **stale** vs current bridge **26**.

---

## 7. VISUAL ASSET AUDIT

| Check | Status |
|-------|--------|
| `visual-assets.json` keyed by listing id | **VERIFIED** |
| `modelPathForListing` / `posterForListing` | Listing id only — **VERIFIED** |
| Oracle identity selects mesh | **NO VIOLATION FOUND** |
| ModelViewer / ModelSlot / loadModel | Reused; failure → poster — **VERIFIED (code)** |
| Lazy load (ModelStage IntersectionObserver) | **VERIFIED (code)** |
| Assets renamed/moved/deleted by Stage 7–11 | **No evidence** in scripts (path references only; 5 listings retargeted to alternate existing `x_*` complete meshes) |
| Duplicate assembled paths (5 pairs) | **INFO** — same Bey recipe, two listing rows; not wrong-Bey substitution |

---

## 8. FRONTEND REGRESSION AUDIT

| Area | Status |
|------|--------|
| Home → `/market` CTA | Present |
| Marketplace grid 578 | Present |
| `/market/:listingId` PDP | Present |
| Lab `/lab` | Present (unchanged role) |
| Search/filter/sort | Present |
| Demo states strip (Stage 11) | Present — additive |
| Save/copy/share | Present (localStorage fav) |
| Oracle / part / unavailable / needs seed / ambiguous | Present |
| Soft error boundaries | Present |
| `VITE_MARKET_OPEN` / ComingSoon | Present; **default OPEN** |
| Responsive / focus / reduced-motion | Declared in CSS — spot-checked earlier stages; **not fully re-tested every breakpoint in this audit** |
| Stage 11 removed core Requiem web UI | **No** — `apps/web` separate |

---

## 9. BACKEND REGRESSION AUDIT

| Area | Local working-tree status |
|------|---------------------------|
| `packages/oracle` | Clean |
| `packages/db` | Clean |
| `packages/ingest` | Clean |
| `packages/worker` | Clean |
| `apps/web` | Clean |

**Recent `main` history** includes ingest/oracle fleet commits (e.g. car-kit purge, sparse windows) — those are **Requiem mainline**, not RIPBEYS file edits. This audit does **not** re-validate those commits’ correctness beyond noting they are outside the untracked RIPBEYS tree.

---

## 10. DATA INTEGRITY AUDIT

| Issue | Classification |
|-------|----------------|
| Dran Dagger dedicated seed vs Shark Edge `prod-x-bx-20-*` | **LEGITIMATE SEPARATION** (shared pack code BX-20 documented on dagger seed note) |
| BX-01/BX-22, BX-04/BX-06 identical recipes | **AMBIGUOUS / SKU TWIN** — unresolved |
| `bx-231` conflict | **CONFLICT** — Oracle withheld |
| Additive Class B / dagger seeds in working tree | **ADDITIVE** migration data — not yet on HEAD |
| Duplicate productCodes on blades (pack provenance) | **KNOWN SEMANTIC COLLISION** (Stage 3 audit) — still applicabl |
| Burst chrome posters reused | **WEAK MEDIA** (see `DEMO_VISUAL_ISSUES.md`) — not identity corruption |

Dangling product part refs: Stage 6C / integrity reports claim 0; **not re-run** `@beyoracle/catalog` recipe validator (dist may be required) — **NOT VERIFIED** this session.

---

## 11. HARDCODED / FABRICATED DATA AUDIT

| Location | What | Reaches Oracle UI? |
|----------|------|-------------------|
| `apps/web/src/consumer/lib/assets.ts` `Listing.price` (~578 fantasy USD) | Deprecated fixture field | **NO** — pages do not read `.price` for valuation |
| `requiemOracle` / `OracleValuation` | No numeric fallbacks | **NO fabrication** |
| Requiem `retailReference` on product API | Shelf reference | Separate from Oracle mark; RIPBEYS PDP does not treat it as Oracle |
| Docs/examples | Mentions of prices | N/A |

**Finding:** Residual fantasy `price` fields remain on listings (P3 hygiene). They are **not** wired to Oracle display in audited UI — **VERIFIED** via grep of `pages/` (no matches).

---

## 12. PRODUCTION DEPLOYMENT AUDIT

| Topic | Finding |
|-------|---------|
| Pricing DB | Railway-only (policy) |
| RIPBEYS local API | Vite proxy → `localhost:3000` |
| `VITE_REQUIEM_API_BASE` | Optional absolute base |
| Hosted RIPBEYS | Must set production Requiem API origin — **localhost proxy will not work** |
| `VITE_MARKET_OPEN` | Default open; public launch must set `0`/`false`/`gated` |
| Independent Requiem deploy | Yes — `apps/web` on Railway remains Oracle host |
| Can frontend ship localhost:3000? | Only if `VITE_REQUIEM_API_BASE` baked wrong or proxy assumed — **risk if misconfigured** |
| Live hosted Oracle | **REQUIRES LIVE RAILWAY/API VERIFICATION** |

---

## 13. SECURITY AUDIT (read-only)

| Check | Result |
|-------|--------|
| Secrets in `apps/ripbeys` source | **No** `DATABASE_URL` / `RAILWAY_TOKEN` / API keys found in ripbeys src |
| Client-side Oracle | Read-only GET; no write APIs from RIPBEYS client |
| Credential commits in migration artifacts | Audit docs/maps are data maps — **no secrets observed** in spot checks |
| Injection | Bridge IDs path-encoded in `encodeURIComponent` |

**NOT a penetration test.** No exploitation performed.

---

## 14. PERFORMANCE AUDIT

| Topic | Evidence | Concern? |
|-------|----------|----------|
| 578-card catalogue | Paginated load-more (24) | Acceptable |
| ModelStage lazy load | IntersectionObserver + unload | Good |
| PDP ModelViewer dispose + `WEBGL_lose_context` | Present | Good |
| Oracle cache/dedupe | Present | Good |
| `visual-assets.json` chunk | ~297 KB in Vite output | P3 bundle weight |
| Main JS chunk | ~1.1 MB | Pre-existing RIPBEYS size; not Oracle regression |
| Opening all 578 FBX | Avoided by design | OK |

---

## 15. TEST RESULTS

| Command | Result | Scope |
|---------|--------|-------|
| `pnpm validate:assets` (ripbeys) | **Pass** — 578/578 assembled | VERIFIED LOCALLY |
| `pnpm build:oracle-bridge` | **Pass** — 26/104/448 | VERIFIED LOCALLY (rewrote bridge JSON) |
| `pnpm build:visual-assets` | **Pass** — 578/578/0 | VERIFIED LOCALLY (rewrote visual JSON) |
| `npx vite build` | **Pass** (~1m) | VERIFIED LOCALLY |
| `pnpm typecheck` (ripbeys) | **Fail** — ScrollRise NodeList + missing `@types/node` | Pre-existing; vite still builds |
| Requiem `:3000` product API | **Timeout / unreachable** | REQUIRES LIVE API |
| Railway DB tallies / integrity SQL | **Not run** | REQUIRES LIVE RAILWAY |
| `pnpm test` monorepo Oracle suite | **Not run** (out of scope / heavy) | NOT VERIFIED |

---

## 16. GIT / CHANGE AUDIT

### Working tree (high signal)

| Path | Git state | Nature |
|------|-----------|--------|
| `apps/ripbeys/` | `??` untracked | Entire consumer app |
| `packages/catalog/data/ripbeys-asset-map.json` (+ draft) | `??` | Generated map |
| `scripts/build-*-ripbeys*`, `validate-ripbeys-assets`, `build-oracle-bridge`, `build-visual-assets` | `??` | Migration tooling |
| Audit/report markdowns | `??` | Documentation |
| `packages/catalog/data/seeds/products-x.json` | `M` modified | **+223 additive seed lines** |
| `pnpm-lock.yaml` | `M` | Likely ripbeys workspace deps |
| `packages/oracle`, `apps/web`, `packages/db`, `ingest`, `worker` | Clean | No local migration edits |

### Implication

Stages 1–11 results are **local workspace artifacts**. They are **not** fully represented by committed `main` history alone.

---

## 17. FINDINGS TABLE

| ID | Sev | Area | Path | Evidence | Impact | Recommended fix | Safe now? |
|----|-----|------|------|----------|--------|-----------------|-----------|
| F01 | **P1** | Git/deploy | `apps/ripbeys/` | Entire tree `??` untracked | Demo/app not on remote `main` | Explicit commit/PR plan when authorized | NO (needs owner commit decision) |
| F02 | **P1** | Catalogue | `products-x.json` | +223 uncommitted seed lines; dagger seed absent on HEAD | Product Oracle 26 / Dagger binding not reproducible from clean HEAD | Commit seeds with review **or** document that demo requires local seeds | NO without catalogue owner |
| F03 | **P1** | Live Oracle | Railway / `:3000` | API timeout this session | Cannot confirm live marks/currency/comps | Start Railway-backed `apps/web`; re-probe `bx-002` | YES (ops only) |
| F04 | **P2** | Launch | `marketGate.ts` | Default `VITE_MARKET_OPEN` open | Public launch may expose market if env unset | Set `VITE_MARKET_OPEN=0` for public | YES |
| F05 | **P2** | Data hygiene | `assets.ts` `Listing.price` | Fantasy USD still on ~578 listings | Confusion if future UI wires price | Keep unwired; later remove field | YES (careful) |
| F06 | **P2** | Media | Burst posters | 465 chrome thumbs | Weak grid underlays | Future media pass — do not invent art | NO (content) |
| F07 | **P3** | Reports | `CATALOGUE_IDENTITY_AUDIT.md` | Claims 14 Product Oracle | Stale vs 26 | Update doc when editing docs | YES |
| F08 | **P3** | Build | `ScrollRise.tsx` / `@types/node` | typecheck fails | Noise; vite OK | Fix types separately | YES |
| F09 | **P3** | Perf | `visual-assets` bundle | ~297KB JSON in client | Larger download | Lazy/split later | YES |
| F10 | **INFO** | Oracle | `packages/oracle` | No local diff | Math preserved | None | — |
| F11 | **INFO** | Identity | `bx-002` vs Shark | Dedicated dagger product; Shark demoted | BX-20 hazard contained | Do not merge seeds | — |
| F12 | **INFO** | Bridge | demoted 18 | Option B | Part not sold as Bey price | Keep | — |
| F13 | **INFO** | Worker | `oracle.recompute` parts-focused | Product marks often inline/backfill | Pre-existing architecture | Do not “fix” in RIPBEYS stage | — |

---

## A. CONFIRMED WORKING

- Requiem Oracle packages and web product/asset APIs present and locally unmodified.
- RIPBEYS Oracle client is a read-only bridge (no client valuation math).
- Product vs Part vs unavailable separation in UI.
- Mesh selection by RIPBEYS listing id (not Oracle id).
- Bridge counts 26/104/448 = 578; visuals 578/578.
- BX-20 Dagger (`bx-002`) not bound to Shark Edge product.
- Conflicts/ambiguous/demoted states withhold Product Oracle.
- `vite build` succeeds.
- Asset validation 578/578.

## B. CONFIRMED REGRESSIONS

- **None confirmed** against original Oracle **mathematics** or Requiem API **route contracts**.
- **Catalogue/demo reproducibility regression vs clean `main`:** uncommitted seeds + untracked app mean documented Stage 11 state ≠ pristine HEAD (classification: **migration incompleteness / git hygiene**, not Oracle formula break).

## C. POTENTIAL REGRESSIONS

- Deploying RIPBEYS without seeding new products → fewer Product Oracle bindings.
- Misconfigured production API base → all Oracle cards error (correct fail-closed, bad demo).
- Accidental future wiring of `Listing.price` to UI.
- Stale identity audit docs misleading operators.

## D. LIVE ENVIRONMENT CHECKS REQUIRED

1. Railway Postgres tallies (observations, product_matches, product_oracle_snapshots, marks n≥3).
2. `GET /api/product/prod-x-dran-dagger-4-60r-complete-loose` with Railway-backed web — value/low/high/nComps/confidence/currency/asOf.
3. Same with API stopped — unreachable UI (already code-verified).
4. Confirm worker/product recompute still healthy post any mainline ingest commits.

## E. SAFE NEXT FIXES (when authorized)

1. Document/commit strategy for `apps/ripbeys` + maps + scripts + seed additions (owner approval).
2. Set `VITE_MARKET_OPEN=0` for public builds.
3. Refresh stale audit markdown counts.
4. Fix ScrollRise / `@types/node` typecheck.
5. Optionally strip or hard-block `Listing.price` from any UI import.

## F. MUST NOT TOUCH

- Oracle median/IQR/confidence math (`packages/oracle`)
- Matcher scoring core (unless separate catalogue program)
- Ingest/workers/DB schema without Railway tally discipline
- BX-20 Shark Edge ↔ Dagger identity merge
- Silent resolution of BX-01/22, BX-04/06, `bx-231`
- Fabricating Burst product artwork
- Using RIPBEYS `bx-NNN` as Takara `BX-NN`

## G. EXACT COMMANDS USED

```bash
git status --short
git rev-parse --abbrev-ref HEAD
git log --oneline -20
git diff --stat HEAD
git diff --stat packages/catalog/data/seeds/products-x.json
git diff packages/catalog/data/seeds/products-x.json | Select-String '^\+.*"id":'
git show HEAD:packages/catalog/data/seeds/products-x.json | Select-String 'prod-x-dran-dagger'
git status --short packages/oracle packages/db packages/ingest packages/worker apps/web

pnpm --dir apps/ripbeys validate:assets
pnpm --dir apps/ripbeys build:oracle-bridge
pnpm --dir apps/ripbeys build:visual-assets
cd apps/ripbeys && npx vite build
cd apps/ripbeys && pnpm typecheck

node (inline) — bridge hazard dump; count arithmetic; visual stats; conflict listing
rg / grep — price usage, secrets patterns, conflict statuses
```

Also: explore subagents (read-only) over Oracle packages and RIPBEYS client.

## H. FILES CREATED/CHANGED BY THIS AUDIT

| File | Action |
|------|--------|
| **`FULL_REGRESSION_AUDIT.md`** | **CREATED** (this report) — **only intended deliverable** |
| `apps/web/src/consumer/data/oracle-bridge.json` | **Regenerated** as side effect of `build:oracle-bridge` during verification |
| `apps/web/src/consumer/data/visual-assets.json` | **Regenerated** as side effect of `build:visual-assets` |

No application source, seeds, migrations, or Oracle packages were intentionally edited by this audit. No commit / push / deploy / Railway mutation.

---

*End of audit.*

# PRE-DEPLOY CHANGESET

**Date:** 2026-09-25  
**Status:** Proposal only — **DO NOT `git add` / `commit` / `push` until explicit user approval.**

Companion docs: `POST_AUDIT_PRESERVATION_REPORT.md`, `RAILWAY_DEPLOYMENT_PLAN.md`, `FULL_REGRESSION_AUDIT.md`.

---

## 1. Exact files that MUST be preserved (commit candidates)

### A. RIPBEYS application (untracked → new)

- `apps/ripbeys/**` **except**:
  - `apps/ripbeys/node_modules/**`
  - `apps/ripbeys/dist/**`
  - any local `.env` / secrets (none expected)

Includes Stage 11 UI, Oracle client, public models/posters, `src/data/oracle-bridge.json`, `src/data/visual-assets.json`.

### B. Catalogue seeds (modified tracked)

- `packages/catalog/data/seeds/products-x.json` (+223 additive products)

### C. Asset map (untracked)

- `packages/catalog/data/ripbeys-asset-map.json`
- Optional: `packages/catalog/data/ripbeys-asset-map.draft.json` (regenerable; can omit)

### D. Scripts (untracked)

- `scripts/build-oracle-bridge.mjs`
- `scripts/build-visual-assets.mjs`
- `scripts/build-ripbeys-asset-map.mjs`
- `scripts/build-ripbeys-asset-map-draft.mjs`
- `scripts/validate-ripbeys-assets.mjs`

### E. Lockfile / workspace

- `pnpm-lock.yaml` (includes `@ripbeys/web` + `@types/node`)

### F. Governance / reports (recommended)

- `.cursor/rules/requiem-ripbeys-architecture.mdc`
- `MIGRATION_PLAN.md`, `MIGRATION_STATUS.md`
- `FULL_REGRESSION_AUDIT.md`
- `POST_AUDIT_PRESERVATION_REPORT.md`
- `RAILWAY_DEPLOYMENT_PLAN.md`
- `PRE_DEPLOY_CHANGESET.md` (this file)
- `INVESTOR_DEMO_REPORT.md`, `DEMO_READINESS_REPORT.md`, `DEMO_VISUAL_ISSUES.md`
- Catalogue/Oracle audit markdowns (`CATALOGUE_*`, `DEMOTED_*`, `PRODUCT_ORACLE_*`, `MAPPING_REPORT.md`)

### G. TypeScript fix (already applied locally)

- `apps/ripbeys/src/components/reactbits/ScrollRise.tsx` (`Array.from` NodeList)
- `apps/ripbeys/package.json` (`@types/node` devDependency)

---

## 2. Exact files that should NOT be committed

| Path | Reason |
|------|--------|
| `apps/ripbeys/node_modules/` | Install artifact |
| `apps/ripbeys/dist/` | Build artifact |
| `.env`, `.env.local`, credentials | Secrets |
| Railway tokens / `DATABASE_URL` values | Secrets |
| Unrelated dirty files outside this migration | None currently on Oracle packages |

---

## 3. Generated files (commit recommended)

| File | Why commit |
|------|------------|
| `apps/ripbeys/src/data/oracle-bridge.json` | Encodes 26/104/448 without requiring rebuild on clone |
| `apps/ripbeys/src/data/visual-assets.json` | Encodes 578 visual index |
| `packages/catalog/data/ripbeys-asset-map.json` | Bridge input |

Regenerable via scripts, but committing avoids drift.

---

## 4. Stage 11 files (subset of ripbeys)

Notable Stage 11 surfaces (non-exhaustive):

- `apps/ripbeys/src/lib/marketGate.ts`
- `apps/ripbeys/src/App.tsx` (ComingSoon gate)
- Marketplace demo-state strip / featured sort
- PDP showcase polish
- Soft error boundaries / polish CSS
- `INVESTOR_DEMO_REPORT.md`, `DEMO_VISUAL_ISSUES.md`

---

## 5. `products-x.json` explanation

- **Status:** Modified vs `HEAD` (+223 lines).  
- **Nature:** Additive complete_loose / Class B / Dran Dagger product seeds.  
- **Why required:** RIPBEYS Product Oracle bindings reference new IDs (e.g. `prod-x-dran-dagger-4-60r-complete-loose`).  
- **Risk if omitted:** Clean checkout cannot reproduce 26 Product Oracle map.  
- **Risk if overwritten:** Loses Stage 4A/6A catalogue work.  
- **Railway note:** Deploying this JSON updates **catalog identity in the web image**; it does **not** by itself create sold comps or Oracle snapshots in Postgres.

---

## 6. `apps/ripbeys` explanation

- Entire consumer SPA is **untracked**.  
- Owns UI, 3D, listing visuals; **does not** own Oracle math.  
- Without committing it, Stage 11 is laptop-only.

---

## 7. Unrelated changes

| Area | Change? |
|------|---------|
| `packages/oracle` | No |
| `packages/db` | No |
| `packages/ingest` | No |
| `packages/worker` | No |
| `apps/web` | No |

---

## 8. Recommended commit grouping (when approved)

### COMMIT 1 — Stage 1–11 RIPBEYS integration + catalogue seeds

```text
apps/ripbeys/   (exclude node_modules, dist)
packages/catalog/data/seeds/products-x.json
packages/catalog/data/ripbeys-asset-map.json
packages/catalog/data/ripbeys-asset-map.draft.json   # optional
scripts/build-*.mjs + validate-ripbeys-assets.mjs
.cursor/rules/requiem-ripbeys-architecture.mdc
migration/audit markdowns (MIGRATION_*, FULL_REGRESSION_*, DEMO_*, CATALOGUE_*, etc.)
pnpm-lock.yaml
```

Suggested message theme: add RIPBEYS consumer bridge + additive X product seeds for Product Oracle bindings.

### COMMIT 2 — TypeScript fixes

If split from Commit 1 for clarity (optional — already in ripbeys tree):

```text
apps/ripbeys/src/components/reactbits/ScrollRise.tsx
apps/ripbeys/package.json  (@types/node)
pnpm-lock.yaml
```

Suggested message: fix ripbeys typecheck (NodeList iteration + @types/node).

### COMMIT 3 — Production configuration

**Only if actual Requiem CORS / RIPBEYS Dockerfile / Railway service files are added later.**  
Currently: **no production config code changes required for local gate** — RIPBEYS Dockerfile and CORS still TBD per `RAILWAY_DEPLOYMENT_PLAN.md`.  
**Do not invent Commit 3 content now.**

### Docs-only follow-ups (can merge into Commit 1)

```text
POST_AUDIT_PRESERVATION_REPORT.md
RAILWAY_DEPLOYMENT_PLAN.md
PRE_DEPLOY_CHANGESET.md
```

---

## 9. Approval gate

Reply explicitly to authorize, for example:

- “Commit group 1+2 as proposed”  
- or “Commit everything in section 1”  

Until then:

```text
# FORBIDDEN without approval
git add …
git commit …
git push …
railway redeploy …
railway up …
```

---

## 10. Post-approval next workflow (reminder)

```text
LOCAL → commit → push → Railway web redeploy → live API verify
  → RIPBEYS production build (VITE_REQUIEM_API_BASE) → host static
  → browser verify → fix locally → commit → push → redeploy
```

*End of changeset proposal.*

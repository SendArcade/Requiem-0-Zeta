# Beyoracle Constitution

Non-negotiable project principles for humans and coding agents.
This constitution supersedes ad-hoc convenience when it conflicts with safety.

## Core Principles

### I. Railway is the system of record (NON-NEGOTIABLE)

- **Production Postgres + Redis + workers live on Railway** (`oracle` project).
- **Never build, seed, or treat a local Docker/Homebrew Postgres as the pricing database.**
- Local `docker compose` is **deprecated** for pricing work. Do not `docker:up` for oracle/ingest/backfill unless the user **explicitly** asks for a throwaway local stack.
- All live ingest, product backfill, purge, recompute, and coverage run **against Railway** via `railway run` / worker env — not a laptop DB.

### II. Tally before destructive actions (NON-NEGOTIABLE)

Before deleting, wiping, or `docker compose down -v`:

1. **Tally Railway** (row counts: observations, product_matches, product_oracle_snapshots, marks ≥3 by gen).
2. **Tally the target** (local Docker / path) if it still exists.
3. **Compare** and record both tallies in the session/scratch log.
4. Only destroy if the user confirmed **or** Railway is clearly the superset and local is explicitly disposable.

Never delete local volumes “because Railway exists” without counts.

### III. Precision-first pricing (NON-NEGOTIABLE)

- Product marks: **live marketplace comps only** (`isLiveMarketplaceComp` — no seed fixtures).
- Auto-accept product matches only at **confidence ≥ 0.9**.
- Lots / multi-item titles never become product comps.
- Wrong SKU/variant or mislabel code+name/combo → reject.
- Publish floor: **≥ `DEFAULT_PUBLISHED_MIN_COMPS` (3)**; sparse SKUs stay **null**.
- Variants stay separated: `productMarkConditions(skuType)` + condition fields.
- Multi-month product window: **`PRODUCT_ORACLE_WINDOW_DAYS` (180)**.

### IV. Spec-driven work

- Non-trivial features: **Spec → Plan → Tasks → Implement** (Spec Kit `/speckit-*` skills).
- Specs live under Spec Kit paths; do not invent parallel undocumented processes.
- Constitution + `AGENTS.md` + `blueprint/` are binding context.

### V. Scavenge-first & verify

- Prefer battle-tested patterns; cite in `docs/ATTRIBUTIONS.md`.
- Before claiming done: `pnpm typecheck && pnpm test`; matcher/catalog changes need eval / probe discipline.
- Never invent marketplace sold rows or synthetic history.

## Environment topology

| Concern | Location |
|---------|----------|
| Source code | GitHub `SendArcade/Requiem-0-Zeta` |
| Pricing DB (comps, matches, snapshots) | **Railway Postgres only** |
| Queue / fleet jobs | **Railway Redis + worker replicas** |
| Secrets | Railway service variables (never commit) |
| Local laptop | Code edit + unit tests only; optional web UI against Railway URL |

## Forbidden by default

- `docker compose up` / `pnpm docker:up` for pricing DB work
- `docker compose down -v` without tally + user intent
- Seeding product_matches or product_oracle_snapshots from fixtures
- Lowering auto-accept or min comps to “get coverage”
- Committing `.env` or Railway passwords

## Allowed local actions

- `pnpm install`, `pnpm typecheck`, `pnpm test`, `pnpm catalog:build`
- Edit code; push to GitHub; deploy with `railway up` / CI
- Point tools at Railway via `railway run --service worker …` or prod `DATABASE_URL` when the user authorizes
- Fixtures-only unit tests (no write to prod)

## Governance

- Constitution **wins** over conflicting informal instructions.
- Amendments: update this file, `AGENTS.md`, and `.cursor/rules/railway-only.mdc` in the same change.
- Agents must surface blockers (missing Railway auth, rate limits) instead of falling back to local Docker.

**Version**: 1.0.0 | **Ratified**: 2026-08-09 | **Last Amended**: 2026-08-09

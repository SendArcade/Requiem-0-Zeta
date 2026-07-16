# Beyoracle

ALT-style Beyblade oracle — multi-generation catalog, dual-corridor comps (Mercari JP + Shopee TW), transparent Oracle Value with source toggles.

**New here?** Read [`blueprint/README.md`](blueprint/README.md) — the project's
second brain, covering thesis, architecture, sources, and known defects.

## Quick start

```bash
pnpm install
cp .env.example .env
pnpm db:seed
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

- **Monorepo:** pnpm + TypeScript
- **Web:** Next.js App Router + Tailwind
- **DB:** Postgres + Drizzle ORM
- **Oracle:** Median + IQR from sold comps

## Packages

| Package | Description |
|---------|-------------|
| `apps/web` | Search, browse, asset pages, watchlist |
| `packages/db` | Schema + migrations |
| `packages/catalog` | Seed data + import |
| `packages/ingest` | Mercari JP + Shopee TW adapters |
| `packages/oracle` | Matcher + Oracle Value |
| `packages/shared` | Types + FX helpers |

## Verify

```bash
pnpm typecheck
pnpm test
pnpm ingest:fixtures
```

## Env vars

See `.env.example`.

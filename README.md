# Requiem / RIPBEYS

Beyblade catalogue, 3D collection experience and transparent market valuations.

One Next.js application serves consumer pages, collector tools and pricing APIs. A separate worker runs ingestion and scheduled valuation jobs on Railway.

```sh
pnpm install --frozen-lockfile
DATA_SOURCE=fixtures REDIS_ENABLED=0 pnpm build
pnpm typecheck
pnpm test
DATA_SOURCE=fixtures REDIS_ENABLED=0 pnpm dev
```

Node 24 and pnpm 9.15.4 are the supported toolchain. Builds follow workspace dependencies automatically; no bootstrap order is required. Internal libraries export compiled `dist` files, so rebuild a changed package before restarting a running server.

| Location | Responsibility |
|---|---|
| `apps/web` | Next routes, RIPBEYS UI, collector pages, API handlers and canonical public assets |
| `apps/worker` | BullMQ ingestion and scheduled jobs |
| `packages/shared` | Shared types and domain rules |
| `packages/catalog` | Catalogue files and pure loaders/validation |
| `packages/catalog-sync` | Live-safe catalogue persistence |
| `packages/oracle` | Matching and valuation algorithms |
| `packages/pricing-service` | Pricing queries, persistence, recomputation and review operations |
| `packages/ingest` | Marketplace adapters and ingestion orchestration |
| `packages/db`, `packages/events`, `packages/jobs` | Database, event bus and job contracts |
| `tools/catalog-maintenance` | Catalogue generation, validation, sync and seed commands |

`pnpm build:web` builds and assembles a standalone web deployment. `pnpm build:worker` builds the worker and its dependencies. See [deployment operations](docs/operations/deployment.md).

Pricing databases, Redis and workers belong on **Railway**. Fixture development needs no database. Never run seed or maintenance writes against production without the authorization and tally requirements in [the constitution](.specify/memory/constitution.md).

Mobile browser checks: after `pnpm build:web`, run `pnpm --filter @beyoracle/web exec playwright install chromium` and `pnpm --filter @beyoracle/web test:e2e`. The checks cover compact phones, standard phones and landscape. The web app supports standalone home-screen launches through its manifest.

Start with [the blueprint](blueprint/README.md), [architecture](docs/architecture/repository.md), [current state](docs/CURRENT_STATE.md), and [documentation index](docs/README.md).

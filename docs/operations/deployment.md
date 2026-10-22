# Deployment

## Web

Use Node 24 and pnpm 9.15.4. From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm build:web
PORT=3000 HOSTNAME=0.0.0.0 node apps/web/.next/standalone/apps/web/server.js
```

For local fixture validation, set `DATA_SOURCE=fixtures REDIS_ENABLED=0` during build/start. Production should use the Railway `DATABASE_URL`; outages return 503 rather than silently serving fixtures. `/api/health` is liveness and `/api/ready` checks the database (or identifies explicit fixture mode).

Railway's web Dockerfile is `apps/web/Dockerfile`. It builds the web dependency graph, then runs the same assembly command as local/CI builds. No separate frontend build is needed. The public UI and APIs share one origin.

## Worker

Railway's worker Dockerfile is `apps/worker/Dockerfile`. It builds dependencies and uses `pnpm deploy --prod` to create a self-contained runtime without the web app's development dependencies. `packages/worker/Dockerfile` remains a compatibility symlink for existing service settings.

Do not start the worker locally during a structure validation. Live ingest, recomputation and pricing persistence stay on Railway. Do not change backfill flags or restart an active fleet without checking its operational requirements.

## Maintenance

Root commands `pnpm catalog:build`, `pnpm catalog:sync` and `pnpm db:seed` delegate to `@beyoracle/catalog-maintenance`. Additional recipe commands use `pnpm --filter @beyoracle/catalog-maintenance products:validate` (or the corresponding build/enrich command). Generators write to `packages/catalog/data`; validate changes before committing. Seed is destructive and is never a startup step.

Production admin API/page access remains disabled unless `ADMIN_API_TOKEN` is securely configured and a matching bearer header is supplied. Never put this token into frontend configuration.

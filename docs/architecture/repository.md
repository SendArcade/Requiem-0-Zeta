# Repository architecture

## Deployable applications

`apps/web` is the single Next.js application. Consumer pages live in `src/consumer` and native routes under `src/app/(consumer)`. Collector pages live under `src/app/(oracle)`, and API routes remain under `src/app/api`. Separate root layouts preserve the two visual shells and isolate their global styles; crossing between shells uses Next's full document navigation. Consumer navigation uses Next's router through a small prop adapter, not a second router.

Public assets belong to `apps/web/public`. There is no Vite application, API proxy, generated index.html rewrite, or frontend build copied into another source directory. Existing public route URLs are unchanged. Legacy `VITE_MARKET_OPEN` and `VITE_REQUIEM_API_BASE` build variables are accepted as compatibility aliases for `NEXT_PUBLIC_MARKET_OPEN` and `NEXT_PUBLIC_REQUIEM_API_BASE`.

`apps/worker` is the independent BullMQ service. Its package name remains `@beyoracle/worker`, so existing filtered commands keep working. `packages/worker/Dockerfile` is a compatibility symlink for externally configured Railway paths; maintained configuration points to `apps/worker/Dockerfile`.

## Dependency direction

```text
shared ──> catalog, db, events, jobs
catalog + db ──> catalog-sync
catalog + shared ──> oracle
catalog + db + oracle + events ──> pricing-service
pricing-service + marketplace adapters ──> ingest
pricing-service ──> web
catalog-sync + ingest + jobs ──> worker
catalog-sync + oracle ──> maintenance tools
```

Arrows show prerequisites flowing toward consumers. `catalog` has no database or valuation dependency. `pricing-service` has no ingestion adapter dependency. Web handlers do not import ingestion. Ingest retains compatibility re-exports for moved service operations, so there is one implementation and one recompute-enqueuer state.

Package names `shared` and `oracle` are retained to keep stable APIs; their domain and pricing responsibilities are explicit above. Libraries publish `dist`; catalogue also publishes `data`. Maintenance code lives under `tools`, outside runtime package imports.

## Enforcement

`pnpm check:architecture` verifies the dependency DAG, declared workspace imports, package boundaries, native web routes, worker location, deployment compatibility and documentation organization. `pnpm test` includes these checks. CI performs a frozen install and normal topological build without bootstrap exceptions.

`pnpm build` builds all applications and assembles the standalone web output. `scripts/assemble-web.mjs` is the single assembly step used by local builds, CI and Docker. It puts public assets, Next static assets and catalogue data beside the standalone server, without changing source files.

## Mobile web

Consumer pages expose persistent Home/Catalogue/Lab/Docs tabs on phones; game layouts retain their own navigation. Shared mobile styles account for display cutouts, home indicators and dynamic viewport heights. Menu panels lock background scrolling, contain keyboard focus, close with Escape and become inert when closed. `/manifest.webmanifest` and local icons support standalone home-screen launches; live pricing remains online and is not cached as an offline mark.

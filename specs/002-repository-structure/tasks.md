- [x] Package boundaries and maintenance tools
- [x] Worker relocation and deployment paths
- [x] Single Next web app and native routes
- [x] Repeatable build/assembly and architecture checks
- [x] Documentation organization
- [x] Full validation and functional checks
- [x] Mobile web polish and phone navigation checks

Validation (2026-10-22): frozen installation, clean topological build from empty generated outputs, final standalone web build, all workspace type checks, 309 regression tests + six architecture checks, nine Chromium phone browser tests, ingestion fixtures, catalogue validation (449 products, zero recipe issues) and asset validation (zero errors/warnings) pass. An isolated `pnpm deploy --prod` worker runtime loads its ingestion, pricing and catalogue-sync dependencies without the source workspace. A read-only Mercari probe sampled 10 live listings (one match, zero bundle matches); this is a connectivity check, not a broad accuracy benchmark. Catalogue seed data and production databases were not changed.

Production rollout remains unverified: no Railway credential is bound in this cloud environment. Browser tests use explicit fixtures and a production-mode standalone server; no worker or local pricing database was started.

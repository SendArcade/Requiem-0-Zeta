# Railway-only ops (no local pricing DB)

## Policy

Beyoracle’s **sold comps, product matches, and Oracle snapshots live only on Railway**.  
Local Docker is optional for unrelated experiments and is **not** used for pricing.

See constitution: `.specify/memory/constitution.md` and always-on rule: `.cursor/rules/railway-only.mdc`.

## Why

- Local Docker was never a clone of Railway (empty volume + seed/fixtures).
- Deleting local volumes without tallying risked confusion about “where the data is.”
- Production fleet already runs on Railway workers + Postgres + Redis.

## Day-to-day

| Task | Where |
|------|--------|
| Edit code | Local / GitHub |
| `pnpm test` / typecheck | Local |
| Live ingest / product fleet | Railway worker |
| Inspect counts | `railway connect Postgres --ssh` |
| Deploy | `railway up --service worker` or GitHub integration |

## Do not run for pricing work

```bash
pnpm docker:up
docker compose up -d
pnpm db:seed          # against local Docker “as if” prod
```

## Spec Kit

This repo is initialized with **GitHub Spec Kit** (`specify`):

```bash
# CLI (once)
uv tool install specify-cli

# In-agent skills
/speckit-constitution
/speckit-specify
/speckit-plan
/speckit-tasks
/speckit-implement
```

Integrations installed: Copilot, Claude, Grok, Cursor-agent.

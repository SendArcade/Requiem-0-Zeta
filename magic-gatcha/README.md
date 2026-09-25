# magic-gatcha (interim proxy)

The production gatcha app was deployed from this directory via `railway up` but **was never pushed to `main`**. The old `oracle` project still serves the real Next.js image.

This folder currently ships a **Caddy reverse proxy** so the **new Railway project** can expose a `gatcha` service URL while you recover the real app.

## Replace before decommissioning old prod

1. Recover the original `magic-gatcha` Next.js source (developer machine or Railway **Duplicate service** from old project → export image → connect on new project).
2. Replace this Dockerfile with the real multi-stage Next build.
3. Set `GATCHA_UPSTREAM` empty / remove proxy env on the gatcha service.

## Env

| Variable | Default | Purpose |
|----------|---------|---------|
| `GATCHA_UPSTREAM` | `https://gatcha-production-a07c.up.railway.app` | Upstream until real app is deployed |

Railway sets `PORT=8080` for this service.

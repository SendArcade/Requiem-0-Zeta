# BeyOracle integration

There is one web service. Next.js owns `/api/*`, `/requiem`, `/browse`, `/product/:id`, `/asset/:id`, `/search`, `/watchlist`, and `/admin/review`. Consumer routes (`/`, `/market`, `/market/:id`, `/lab`, `/hub`, `/game`, `/screens`, `/x/*`, `/burst/*`) rewrite to the Vite `index.html` copied into `apps/web/public`.

Oracle calls from the consumer are same-origin. The Docker build sets an empty `VITE_REQUIEM_API_BASE`.

## Production facts checked 2026-09-30

Host: `https://web-production-2507a.up.railway.app`.

| Check | Result |
|---|---|
| `GET /api/product/prod-x-bx-34-complete-loose` | 200, oracle value 1980 JPY, 7 comps |
| `GET /api/product/prod-x-dran-dagger-4-60r-complete-loose` | 200, `oracle` null |
| Listing `bx-002` link | `/product/prod-x-dran-dagger-4-60r-complete-loose`, not `/product/BX-02` |

A null oracle with HTTP 200 is an empty mark, not a healthy fake price.

## X feed

`GET /api/x/feed` is implemented on the RIPBEYS Express server (`apps/ripbeys/server/xfeed.mjs`). Production does not run that server. Next has no `/api/x/feed` route, so the landing strip gets 404. The handler scrapes a public timeline and optional `X_BEARER_TOKEN` through Redis. It was not copied into the web process in this pass, because that would put a third-party scrape on the same process as Oracle reads.

## Database

Pricing reads go through the existing product and asset API. This pass did not seed, migrate, or delete Railway rows.

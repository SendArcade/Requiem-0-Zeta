# Investor demo report

Updated: 2026-09-24 (Stage 11)

Local-only. No commit / push / deploy / Railway.

## Demo flow (verified)

| Step | Path | Notes |
|------|------|-------|
| Home | `/` | CTA **Browse the catalogue** → `/market` |
| Catalogue | `/market` | Intro + **Demo states** strip + full grid |
| Search / filter | controls on catalogue | Series, type, sort, text search |
| Showcase Product Oracle | `/market/bx-002` | **Dagger Dran 4-60R** |
| 3D | PDP hero | Orbit / zoom; listing-id mesh only |
| Oracle | PDP Oracle card | Live when Requiem `:3000` up; clean unreachable when down |
| Save / Copy / Share | PDP actions | localStorage fav; clipboard; Web Share / copy URL |
| Back | Back to marketplace | Returns to `/market` |

### Four intentional Oracle states (Demo states strip)

| State | Listing | URL |
|-------|---------|-----|
| Product Oracle | Dagger Dran 4-60R | `/market/bx-002` |
| Part mark | Dranzer Spiral | `/market/bx-024` |
| Needs product seed | Courage Dran S6-60V | `/market/bx-007` |
| Unavailable (ambiguous) | Dran Sword 3-60F | `/market/bx-001` |

## Strongest showcase screens

1. **Home** — brand + catalogue CTA  
2. **Catalogue** — featured Dagger hero (clickable) + Demo states strip  
3. **Dagger Dran PDP** — sticky 3D, recipe, canonical product id, Product Oracle card  
4. **Part mark PDP** (`bx-024`) — proves part ≠ Bey price  
5. **Needs seed / Ambiguous PDPs** — honest unavailable UX  

## Product Oracle coverage

| Metric | Count |
|--------|------:|
| Product Oracle mappings | 26 |
| Part Oracle mappings | 104 |
| Unavailable / unresolved | 448 |
| Assembled models on disk | 578 |
| Posters on disk | 578 |

Integrity (prior stages): **26/26 Product Oracle PASS**. Catalogue gaps intentionally unresolved.

## Market gate (demo vs public)

| Mode | How |
|------|-----|
| **Investor / local demo (default)** | Leave `VITE_MARKET_OPEN` unset → `/market` live |
| **Public launch gate** | Set `VITE_MARKET_OPEN=0` (or `false` / `gated`) → ComingSoon on `/market` and `/market/:id` |

Implementation: `apps/ripbeys/src/lib/marketGate.ts` + `App.tsx` (`MarketOrGate` / `ProductOrGate`). ComingSoon is **not** deleted.

## Launch both apps locally

### Terminal A — RIPBEYS (UI)

```bash
cd apps/ripbeys
pnpm install   # if needed
pnpm dev       # http://localhost:5173
```

### Terminal B — Requiem (Oracle API)

Pricing DB is **Railway-only**. For a live Product Oracle mark on Dagger Dran:

```bash
# From repo root — use your normal Railway-backed web env (DATABASE_URL etc.).
# Do not use local Docker as the pricing DB.
cd apps/web
pnpm --filter @beyoracle/shared --filter @beyoracle/db --filter @beyoracle/events --filter @beyoracle/jobs build
pnpm --filter @beyoracle/catalog exec tsc
pnpm -r build   # if dist/ missing
pnpm --filter @beyoracle/web dev   # http://localhost:3000
```

RIPBEYS Vite proxies `/api` → `http://localhost:3000`.

**Oracle down:** stop Terminal B (or leave it off). PDP shows **Oracle service unreachable** / error — **no invented price**.

Optional override: `VITE_REQUIEM_API_BASE=http://localhost:3000` in the RIPBEYS env.

## Oracle API check (Stage 11)

| Condition | Result |
|-----------|--------|
| Requiem `:3000` | Timed out / not running during Stage 11 probe |
| RIPBEYS `:5173/market` | HTTP 200 |
| Oracle down UX | Confirmed earlier + same code path (502/timeout → clean error, no fake value) |

To demo **live** value/band/comps/confidence/asOf: start Requiem with Railway DB, open `/market/bx-002`, confirm Product Oracle card fills from API.

## Recommended investor walkthrough order

1. Home → **Browse the catalogue**  
2. Point at **Demo states** strip (four real outcomes)  
3. Open **Dagger Dran** (featured hero or strip) → orbit 3D → recipe → Oracle  
4. If API up: show live mark; if down: show intentional unreachable state  
5. Open **Part mark** (`bx-024`) — “not complete Bey market value”  
6. Open **Needs product seed** (`bx-007`) and **Ambiguous** (`bx-001`)  
7. Back to grid → quick search “dagger” / filter X  

## Known limitations

- 26 Product Oracle only; 448 unavailable by design  
- Burst posters are game chrome (see `DEMO_VISUAL_ISSUES.md`) — 3D carries the card  
- Favorites are localStorage only  
- Pre-existing `ScrollRise` / `@types/node` typecheck noise; `vite build` OK  
- Live Oracle needs Railway-backed Requiem on `:3000`  

## Build results (Stage 11)

| Command | Result |
|---------|--------|
| `pnpm validate:assets` | Pass — 578/578 assembled |
| `pnpm build:oracle-bridge` | Pass — 26 / 104 / 448 |
| `pnpm build:visual-assets` | Pass — 578 models / 578 posters / 0 empty |
| `npx vite build` | Pass |

## Files touched (Stage 11)

- `apps/ripbeys/src/lib/marketGate.ts` — gate + DEMO_SHOWCASE  
- `apps/ripbeys/src/App.tsx` — ComingSoon restore via env  
- `apps/ripbeys/src/pages/Marketplace.tsx` — demo strip, featured pin, hero click  
- `apps/ripbeys/src/pages/marketplace.css` — showcase styling  
- `apps/ripbeys/src/pages/ProductDetail.tsx` / `product-detail.css` — showcase PDP polish  
- `DEMO_VISUAL_ISSUES.md`, `INVESTOR_DEMO_REPORT.md`, `MIGRATION_STATUS.md`

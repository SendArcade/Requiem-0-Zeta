# Demo readiness report

Updated: 2026-09-24 (Stage 10)

Local-only. No commit / push / deploy / Railway.

## Summary

RIPBEYS marketplace + product detail is **demo-ready** for investor walkthroughs on the recovered catalogue and Oracle integration — with explicit unavailable/error states when Requiem API is offline.

## User flow tested

| Step | Result |
|------|--------|
| Home → Catalogue CTA `/market` | Pass |
| Nav Catalogue active on `/market` and `/market/:id` | Pass |
| Search / series / type / sort controls | Pass |
| Product card → View Details → `/market/:listingId` | Pass |
| Product detail: recipe, status, identity, actions | Pass |
| Back to marketplace | Pass |
| Featured home tiles → `/market/:id` | Pass (wired) |
| Scroll-to-top on route change | Pass |
| Lab deep-link from PDP | Pass (`/lab?bey=`) |

## Marketplace status

- **578** listings in grid (paginated load-more)
- Card hierarchy: model (lazy ModelSlot) → name → series/type → Product Oracle chip → View Details
- Visuals keyed by RIPBEYS listing id (`visual-assets.json`)
- Soft error boundaries around card model + Oracle chips
- Hover / focus-visible polish

## Product detail status

- Sticky large hero stage (desktop); stacked on tablet/mobile
- Interactive ModelViewer (orbit / zoom), transparent clear + stronger loading poster
- Facts: series, type, combo, Requiem product/part id
- Recipe: Blade/Layer · Ratchet · Bit (+ part ids when known)
- Status chip: Product Oracle / Part mark / Needs product seed / Ambiguous / Conflict / Unavailable
- Actions: Save (localStorage), Copy ID, Share, Open in Lab
- Soft error boundaries on model + Oracle widgets

## 3D status

- Existing ModelViewer / ModelSlot / loadModel only
- Grid: IntersectionObserver lazy load + unload offscreen (ModelStage)
- Detail: single listing model; dispose + `WEBGL_lose_context` on unmount
- Failure → poster / “3D preview unavailable” — does not crash catalogue
- **Do not** open all 578 models at once (viewport + page size)

## Oracle resilience

| Case | UI |
|------|-----|
| API up + mark present | Live Product Oracle value + band/comps/confidence/asOf when provided |
| Empty mark | Unavailable — no invented price |
| 404 | Unavailable |
| 502/503/504 (proxy / down) | Error: “Oracle service unreachable” — no invented price |
| Network / abort timeout (12s) | Error with timeout / fetch message |
| Part Oracle (detail only) | Part/layer mark + “not complete Bey value” |
| Cards | Product Oracle only |

Verified against live UI with Requiem `:3000` down: clean error card, no fake prices.

## Asset validation

```
validate:assets → ok, 578 entries, assembledOk 578, assembledMissing 0
build:visual-assets → 578 models on disk, 578 posters, 0 noPreview
build:oracle-bridge → product 26 / part 104 / unavailable 448
```

5 intentional shared complete-mesh paths (same Bey, two listing rows) — not cross-wired wrong models.

No assets renamed / moved / converted / deleted in Stage 10.

## Responsive

- Desktop / 1440+: sticky PDP hero + side panel
- Laptop: same grid, sticky stage
- ≤960px: PDP stacks; stage unsticks
- ≤700px: 2-col market grid, full-width controls, 44px action targets
- ≤430px: 1-col market grid

## Accessibility / UX

- Keyboard: cards are `role="button"` + Enter/Space; visible `:focus-visible`
- Labels on nav, search, actions, model region
- Oracle / model failures expose text status (no silent blank price)
- `prefers-reduced-motion` disables PDP / shop motion where declared
- Contrast: cyan/sticker on dark RIPBEYS theme (existing system)

## Performance findings

- Market cards do not fetch Part Oracle
- Oracle cache + in-flight dedupe + 12s timeout
- ModelStage unloads offscreen meshes
- Detail viewer forces context loss on leave to limit GL retention
- Opening many PDPs in sequence should not retain prior scenes

## Remaining known issues

1. **Live Oracle** requires Requiem web on `localhost:3000` (Vite `/api` proxy). Offline → explicit error, not silent zeros.
2. **448** listings have no Product Oracle (catalogue gaps / demotions / unmatched) — shown as unavailable by design.
3. **Unresolved catalogue** (BX-01/22 twins, BX-04/06, bx-231, BX-20 pack-code nuance) — visuals show; Oracle withheld where required.
4. **Favorites** are localStorage only (no account sync).
5. **Pre-existing typecheck**: `ScrollRise.tsx` NodeList iteration + missing `@types/node` — unchanged; `vite build` still succeeds.
6. Some Burst posters are chrome thumbs (not studio product shots) — still valid listing media from the map.
7. `/market` is temporarily ungated for testing; restore ComingSoon before public go-live if desired.

## Build / test results

| Command | Result |
|---------|--------|
| `pnpm validate:assets` | Pass (578/578) |
| `pnpm build:oracle-bridge` | Pass (26 / 104 / 448) |
| `pnpm build:visual-assets` | Pass (578 / 578 / 0) |
| `npx vite build` | Pass (see Stage 10 run) |
| `pnpm typecheck` | Known pre-existing ScrollRise / `@types/node` failures |

## Demo script (suggested)

1. Home → **Browse the catalogue**
2. Filter **X** → open **Dagger Dran 4-60R** (`bx-002`)
3. Orbit the mesh · show recipe · show Product Oracle (or clean unreachable state)
4. Save · Copy ID · Back to marketplace
5. Optionally open a Part-mark / Needs product seed listing to show honest unavailable UX

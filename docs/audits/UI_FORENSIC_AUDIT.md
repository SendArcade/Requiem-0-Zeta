# Requiem-0-Zeta UI Forensic Audit

Read-only inspection of the current frontend. No application code was changed.

Date: 2026-09-27. Source of truth is the working tree on `main` (latest marketplace UI commit `96019ea` plus earlier integration). Production is one Next process that serves consumer routes as a Vite SPA and Requiem routes as Next pages.

## Executive Summary

Two UIs share one origin.

- `apps/ripbeys` is a Vite React SPA. It owns `/`, `/market`, `/market/:listingId`, `/lab`, `/hub`, `/game`, `/screens`, `/x/*`, and `/burst/*`. Visual language is black, acid yellow (`#ffea00`), and cyan (`#13fff3`), with Pixelify Sans and Nippo.
- `apps/web` is Next.js. It owns `/requiem`, `/browse`, `/product/:id`, `/asset/:id`, `/search`, `/watchlist`, `/admin/review`, and `/api/*`. Its chrome is a separate header (`SiteHeader`) from the consumer nav (`MarketingNav`).
- 3D is concentrated in `ModelViewer` → `ModelViewerImpl` plus a shared `ModelStage` canvas for catalogue cards. Loaders are Three.js FBX and OBJ. Listing meshes come from `visual-assets.json` keyed by RIPBEYS listing id.
- Oracle display in the consumer is `OracleValuation` → `fetchListingOracle` → `/api/product` or `/api/asset`. It does not compute prices.
- Motion is many parallel systems: CSS keyframes, GSAP (nav, scroll reveal), requestAnimationFrame (cursors, boot, model spin), and IntersectionObserver. Reduced motion is handled in several places, not one place.
- Screenshots were not captured. Playwright was not run (see Screenshot References).

## Current Architecture

Consumer entry: `apps/web/src/consumer/main.tsx` mounts `App` in `StrictMode` and registers a service worker (`lib/perf/registerSW.ts`).

`App.tsx` wraps `BrowserRouter`, `ScrollToTop`, a route `Suspense`, a root `AppErrorBoundary`, and a global `MorphBox` cursor frame. Most pages are `lazy()`. `Landing` is eager.

Production routing (`apps/web/next.config.mjs`): consumer path prefixes rewrite to the Vite `index.html`. `/api/*`, `/requiem`, `/browse`, `/product/*`, `/asset/*`, `/search`, `/watchlist`, and `/admin/*` stay Next. `/` is rewritten to the consumer homepage, not the Requiem home. The Requiem home component is `apps/web/src/app/requiem/page.tsx`.

Oracle identity stays in `@beyoracle/oracle` and the API. Visual identity stays in `visualAssets.ts` / `visual-assets.json`. Listing identity stays in `assets.ts` (`marketplaceListings`). The bridge is `oracle-bridge.json`.

No React context providers beyond `ModelStageProvider` on `/market` and `/market/:id`. No global theme provider. CSS variables live in `pages/theme.css` and are imported by page CSS.

## Route Inventory

Consumer (`App.tsx`):

| Route | Component | Data | 3D | Notes |
|---|---|---|---|---|
| `/` | `Landing` | Local tile list, `assets` hero bey, `RipBeysFeed` → `/api/x/feed` | `ModelViewer` tiles and hero after boot | Glitch boot gates the page |
| `/market` | `Marketplace` or `ComingSoon` | `marketplaceListings`, bridge, live Oracle | `ModelSlot` card models | `VITE_MARKET_OPEN` gate |
| `/market/:listingId` | `ProductDetail` or `ComingSoon` | Listing + visual + Oracle + recipe | `ModelViewer` interactive | Missing id renders missing state |
| `/gallery` | Redirect to `/lab` | — | — | |
| `/lab` | `GalleryPage` | Listings, query `?bey=` | Full viewer in lab | CSS `lab.css` |
| `/hub` | `Hub` | In-page experience data | As implemented in `Hub.tsx` | Lazy |
| `/game` | `Splash` from `Hub.tsx` | Same module | — | |
| `/screens` | `ReferenceScreens` | Static reference frames | — | |
| `/x`, `/x/scan`, `/x/battle`, `/x/gym`, `/x/collection`, `/x/settings` | `XPages.tsx` layout + pages | `GameShell` patterns | Mixed | Lazy group |
| `/burst`, `/burst/shop`, `/burst/customize`, `/burst/battle`, `/burst/scan`, `/burst/league`, `/burst/profile`, `/burst/settings` | `BurstPages.tsx` | Same pattern | Mixed | Lazy group |
| `*` | Redirect `/` | — | — | Unknown consumer paths do not 404 |

Requiem (`apps/web/src/app`):

| Route | Page | Data |
|---|---|---|
| `/requiem` | `requiem/page.tsx` | `browseProducts`, `browseGeneration` |
| `/browse` | `browse/page.tsx` | Generation index |
| `/browse/:generation` | `browse/[generation]/page.tsx` | Parts with snapshot marks → `/asset/:id` |
| `/browse/products` | `browse/products/page.tsx` | Products with published marks → `/product/:id` |
| `/product/:id` | `product/[id]/page.tsx` | `getProductData` — price, chart, comps, recipe |
| `/asset/:id` | `asset/[id]/page.tsx` | `getAssetData` — condition pools, chart, comps |
| `/search` | `search/page.tsx` | Unified product + part search |
| `/watchlist` | `watchlist/page.tsx` | Session cookie + DB |
| `/admin/review` | `admin/review/page.tsx` | Review queue |

Live Burst browse currently links 25 `/asset/...` parts. Live X browse currently links 17 `/asset/...` parts. Those counts are snapshot rows joined to catalogue parts, not the 578 marketplace listings.

## Home

Section order in `Landing.tsx` after the boot unlocks:

1. `GlitchBoot` until `bootGone`.
2. `MarketingNav` only after boot.
3. Hero (`rb-hero`): image `/assets/hero-cinematic.png`, shade, fade, sticker tags, kicker, “Let It Rip”, Magnet link to `/lab`.
4. Marquee ticker.
5. `ASCIIText` “LET_IT_RIP” when not compact and boot is done.
6. Beys heading + masonry of tiles. After boot, tiles use `ModelViewer` (`presentation="tile"`, not interactive). Before boot or on compact devices, posters.
7. Lab heading + copy + well with hero `ModelViewer` (`presentation="hero"`, spin).
8. Type cards (attack / defense / stamina / balance accents).
9. Crew cards with images.
10. Quote “Let it rip.”
11. Closing band with the same hero image, “say hi”, “Find your build.”, link to `/market`.
12. `RipBeysFeed` → `GET /api/x/feed`.
13. Footer logo `/assets/ripbeys-logo.png`.

Hero parallax is `useHeroParallax` (pointer + rAF) and is skipped when `prefers-reduced-motion` is set. Scroll reveal is `ScrollRise` (IntersectionObserver). Compact mode (`deviceTier`) disables magnets, ASCII, and live tile models.

`/api/x/feed` is implemented only in `apps/ripbeys/server/index.mjs`. The Next production server returns 404 for it, so the landing strip shows “Feed briefly offline.”

## Catalogue

`Marketplace` (`/market`):

- Data: all `marketplaceListings` (578). Filters: series All/X/Burst, class/type, text search across name, series, class, id, and bridge ids. Sort: Featured, name, Oracle ready, Oracle high, Oracle low. Page size 24 with a load-more button. No infinite scroll.
- Cards: `ProductCard`. Art well, poster, optional `ModelSlot` (shared WebGL stage), `OracleValuation` compact, “View Details”, listing id. Click and Enter open `/market/:id`.
- Current layout (commit `96019ea`): `pit-head` plus grid. Cards use a circular launch-ring background in `marketplace.css`. Hover lifts the card and switches the ring to yellow. Reduced motion disables that transform and, in a second query, disables all shop animations.
- Oracle on the card is fetched per card by `OracleValuation`, not by the grid filter. Missing marks render as unavailable states inside the card. The earlier “hide unpriced” filter was removed in `3552e94`.
- Chain: listing id → `resolveListingVisual` / `visual-assets.json` (mesh and poster) and, separately, `getOracleBridgeEntry` → `/api/product` or `/api/asset`. Mesh selection does not use the Oracle product id.

BeyOracle `/browse/burst` and `/browse/x` are different catalogues: 25 and 17 part pages with stored marks. They are not the shop grid.

## Product Detail

`ProductDetail.tsx` + `product-detail.css`.

- Missing listing: `pdp-page--missing`, back to `/market`.
- Toolbar back button.
- Hero: `pdp-stage` + `ModelViewer` when a model exists (drag orbit, scroll zoom). Poster-only branches when the model is absent or the viewer errors.
- Panel: name, series, class, facts, recipe list from the listing, `OracleValuation` `variant="detail"`, status note from `catalogueStatusLabel`, save/copy/share actions, lab link `/lab?bey=`.
- Dagger Dran (`bx-002`) has an extra showcase kicker.
- Motion: CSS `pdpStageIn`, `pdpPanelIn`, `pdpFloat`, disabled under reduced motion. Breakpoints 960px and 700px stack the stage and panel.

## 3D System

- `ModelViewer.tsx` lazy-loads `ModelViewerImpl`. Below 700px, non-interactive and non-`force3D` callers render `StaticPreview` (poster only).
- `ModelViewerImpl.tsx`: Three.js scene, camera, lights, orbit-style control, rAF spin and focus tween, dispose on unmount including context loss.
- `loadModel.ts`: FBXLoader and OBJLoader. Unused fabric/foam maps replaced with a 1×1 PNG. `dressMaterials.ts` applies recovered textures.
- `ModelStage.tsx`: one canvas for catalogue cards. IntersectionObserver mounts a slot’s model. Shared stage avoids one context per card.
- Mapping: `visualAssets.ts` reads `visual-assets.json` by listing id (`modelPath`, poster). `assets.ts` also stores model paths on listings; the visual index is the resolved path for marketplace and PDP.
- Failure: SoftErrorBoundary on cards; poster image remains. PDP has poster-only fallbacks.

## Navigation

`MarketingNav` + `site-nav.css` + `StaggeredMenu` (GSAP).

Links: Home `/`, Beys `/#beys`, Lab `/lab`, Crew `/#crew`, Catalogue `/market`. Logo goes home. Hash scroll offset 72px. Mobile: staggered menu, breakpoint around 820px and 700px. Active area prop `home | shop | lab | hub`.

Requiem pages use a different `SiteHeader` (Beyoracle wordmark to `/requiem`, Browse, Products, Watchlist, search). Two nav systems on one origin.

## Gallery

`/gallery` redirects to `/lab`. `GalleryPage` is the lab: listing picker, part stack, `ModelViewer`, `?bey=` deep link. CSS `lab.css` breakpoints 1000px and 700px.

## Lab

Same as Gallery. Home section “Open 3D lab” links into it with the hero Bey. PDP links with the current listing id.

## X Experience

`XPages.tsx` route group under `XRoutesLayout`: index, scan, battle, gym, collection, settings. Uses `GameShell`. This is a game-style shell, not the Oracle catalogue.

## Burst Experience

`BurstPages.tsx`: index, shop, customize, battle, scan, league, profile, settings. Same shell pattern. Not the `/browse/burst` Oracle part table.

## Current Motion System

| Component | Animation | Technology | Trigger | Purpose |
|---|---|---|---|---|
| GlitchBoot | Boot progress, unfold | CSS + rAF | First home load | Gate homepage |
| ScrollRise | Rise in | IntersectionObserver + CSS | Scroll | Section reveal |
| ScrollReveal / AnimatedContent / FadeContent / BlurText | Reveal | GSAP | Scroll / mount | React Bits |
| Magnet | Pull toward pointer | Pointer | Hover | CTA |
| StaggeredMenu | Menu open | GSAP | Click | Mobile nav |
| RipCursor / TargetCursor / BlobCursor | Custom cursor | rAF | Pointer | Desktop chrome |
| MorphBox | Frame morph | rAF + CSS | Global in App | Cursor frame |
| ASCIIText / FuzzyText / TextPressure / ClickSpark / LogoLoop | Canvas or text loops | rAF | Visible | Home and effects |
| Landing parallax | Hero shift | rAF | Pointer | Hero |
| landing.css orbits | Rotate | CSS keyframes | Always | Rings |
| marketplace cards | Translate, ring color | CSS transition | Hover | Cards |
| ModelViewerImpl | Spin, focus | rAF | Mount / prop | Model |
| Product detail | Stage and panel in | CSS keyframes | Load | PDP |
| Reduced motion | Various | CSS + matchMedia | OS setting | Partial coverage |

Duplicate pattern: several reveal helpers (ScrollRise, ScrollReveal, FadeContent, AnimatedContent) and several cursors (RipCursor, TargetCursor, BlobCursor, MorphBox).

## Current Visual System

Colors (from `theme.css`): paper `#000000`, paper-2 `#0a0a0a`, surface `#111111`, ink `#f5f5f5`, ink-3 `#a3a3a3`, mute `#8a8a8a`, line `rgba(255,255,255,0.18)`, sticker `#ffea00`, cyan `#13fff3`, lime `#a2ff1f`, red `#ef4139`. Type colors: attack red, defense cyan, stamina lime, balance white.

Type: display and pixel are Pixelify Sans. Script is Reenie Beanie. UI is Nippo then Chakra Petch. Hero scale is `clamp(40px–76px)`. Body UI is about 15px. Labels are 9–11px uppercase with wide tracking.

Spacing: page max widths around 1180px. Marketplace padding `clamp(36px, 5vw, 64px)`. Grid gap 18px. Nav offset 72px. Card radius token `--radius: 15px`. Marketplace rings are square wells with round inset shadows, not the radius token.

Shadows: `--shadow-sm/md/lg` in the token file. Cards add their own inset rings.

Buttons: yellow sticker fills (`.pit-launch`, active tabs), text links in cyan, ghost details buttons.

Requiem pages do not import `theme.css`. They use their own variables (`--text`, `--accent`, `--muted`, `--border`) in the Next app CSS. Two visual systems.

## Responsive System

Observed max-width breakpoints, not device labels:

- 1180px: marketplace grid 4 → 3.
- 1080 / 1000 / 980: landing, lab, showcase, intro collapse to one column.
- 860 / 820: pit header stacks; nav compresses.
- 760 / 700: product stage stacks; non-forced 3D becomes poster; landing tiles tighten.
- 640 / 560 / 520 / 500 / 430: further type and grid collapse; marketplace can become one column.

Fixed: marketplace controls are sticky at `top: 84px`. MorphBox/cursors are desktop decorations. Home nav is absent until boot finishes.

## Accessibility

Present: many `aria-label`s, route error boundary, focus-visible outlines on shop controls (3px cyan or blue), reduced-motion branches on home, boot, marketplace, PDP, logo loop.

Gaps: decorative images often `alt=""`. Custom cursors can compete with native focus. Two navigation systems. Clickable cards are `role="button"` in addition to inner buttons. Live X feed failure is text, not an alert role. Requiem and consumer contrast systems are separate. This audit did not measure contrast ratios.

## Performance

- Vite build output already measured earlier: main JS chunk about 1.1 MB minified, `visual-assets` chunk about 297 KB. 578 listing records live in the client bundle via `assets.ts` and the visual JSON.
- Home can mount several `ModelViewer` instances after boot.
- Catalogue uses one `ModelStage` and intersection mounting, which is the cheaper path.
- Marketplace does not prefetch Oracle for every card; each visible `OracleValuation` fetches. Cache and in-flight dedupe exist in `requiemOracle.ts` (60s, keyed by product or part id).
- Many always-on rAF loops (cursors, morph, ASCII, boot). Compact/device tier turns some off.
- `/browse` HTML on the live site is large (Burst page about 58 KB of HTML for 25 links) and is a different render path from the shop.
- X feed route is a 404 in production, so the home interval retries a failing endpoint every 180s.

## Asset Architecture

- Models and posters: `apps/web/public/assets/...`, resolved by listing id in `visual-assets.json`.
- Homepage art: `/assets/hero-cinematic.png`, `/assets/ripbeys-logo.png`.
- Fonts: Pixelify Sans, Reenie Beanie, Nippo, Chakra Petch, plus IBM Plex Mono referenced from `index.html` (Google / Fontshare). Some `/fonts/Poppins-*.ttf` references do not resolve at Vite build time.
- Icons: lucide-react on the marketplace. Type badges are CSS colors, not a full icon set.
- Catalogue identity files are not images: `oracle-bridge.json`, `visual-assets.json`, seed JSON in `packages/catalog`.

## Component Architecture

Consumer pages: `Landing`, `Marketplace`, `ProductDetail`, `Gallery`, `Hub`, `XPages`, `BurstPages`, `ComingSoon`, `ReferenceScreens`.

Shared consumer UI: `MarketingNav`, `OracleValuation`, `ModelViewer`, `ModelStage`, `ModelSlot`, `RipBeysFeed`, `PoweredBy`, `GameShell`, `SoftErrorBoundary`, `reactbits/*`.

Libraries: `assets`, `visualAssets`, `oracleBridge`, `requiemOracle`, `marketGate`, `loadModel`, `dressMaterials`, `perf/*`, `favorites`, `spirits`, `media`.

Requiem UI: `SiteHeader`, `AssetPageClient`, `ProductPageClient`, `CompsChart`, browse pages. Data via `apps/web/src/lib/data.ts` and `product-data.ts`.

## Existing Strengths

- Listing id, mesh, and Oracle id are separate.
- Missing Oracle is an explicit unavailable state, not a fake price.
- Catalogue cards share one WebGL stage.
- PDP and home have poster fallbacks.
- Route-level error boundary and soft boundaries around models and Oracle cards.
- Reduced motion is acknowledged in the major consumer CSS files.

## Existing Technical Debt

- Two design systems and two navs.
- Large always-loaded listing and visual JSON.
- Many overlapping motion components from React Bits plus local boot/cursor systems.
- X feed server is not mounted on the Next origin.
- Part asset pages recompute marks and can disagree with stored snapshots; the page 404 gate was loosened in `b891b32` but the headline number is still a recompute, not the snapshot row.
- Homepage 3D tiles multiply viewers when compact mode is off.

## Existing Inconsistencies

- Shop says “all listings.” BeyOracle browse says “parts with marks.” Counts will not match.
- `ModelViewer` bails to a poster under 700px unless `force3D`. Home tiles pass `force3D`. Catalogue slots use `ModelSlot`, a different path.
- Sticker yellow is the consumer accent. Requiem pages use `--accent` from another stylesheet.
- `/` is the consumer home. The original Requiem home is `/requiem`.

## High-Risk Areas

- Changing `visualAssets.ts` or the bridge changes which mesh or price appears.
- Changing `ModelViewerImpl` lifecycle can leak WebGL contexts.
- Rewriting consumer routes in `next.config.mjs` can steal `/api` or Requiem pages, or drop client-side refresh.
- Filtering the 578-list again will look like missing Beys even when BeyOracle browse still shows parts.

## Safe Areas for Redesign

- `marketplace.css`, `Landing` section layout, `MarketingNav` visuals, card chrome, PDP panel layout, copy, and motion that does not change fetch URLs or model `src`.

## Areas That Must NOT Be Broken

- Same-origin `/api/product` and `/api/asset`.
- Listing id → visual file. Oracle id → price.
- Unavailable when the mark is null.
- Poster when the model fails.
- `/lab?bey=` and `/market/:listingId` deep links.
- `VITE_MARKET_OPEN` gate.
- Requiem browse, product, asset, search, watchlist, admin.

## Dependency Inventory

Consumer runtime: React 19, react-router-dom 7, three, gsap, framer-motion and motion, lucide-react. Built with Vite. Served in production by being copied into the Next `public` tree from `apps/web/Dockerfile`.

## Screenshot References

Not captured. This audit did not launch Playwright or a local browser session. Route and layout statements come from source and from prior live HTTP checks (homepage, `/market`, `/browse/burst`, `/browse/x`, asset and product APIs).

## Complete Component Map

```
main.tsx
  App
    MorphBox
    Routes
      Landing
        GlitchBoot, MarketingNav, ScrollRise, Magnet, ASCIIText, ModelViewer, RipBeysFeed
      /market Marketplace
        MarketingNav, ProductCard, ModelSlot, OracleValuation, CountUp
      /market/:id ProductDetail
        ModelViewer, OracleValuation, MarketingNav
      /lab GalleryPage
      /hub Hub, /game Splash
      /x XRoutesLayout + pages
      /burst BurstLayout + pages
      /screens ReferenceScreens
```

Requiem tree is Next `app/` pages plus `SiteHeader`, `ProductPageClient`, `AssetPageClient`, `CompsChart`.

# REDESIGN CONSTRAINTS

### MUST PRESERVE

- 578 listing records and their ids.
- Oracle fetch, unavailable and error states, part-vs-product wording.
- Visual resolution by listing id.
- Deep links `/market/:listingId`, `/lab?bey=`, `/browse/...`, `/product/:id`, `/asset/:id`.
- Load-more catalogue behavior unless a redesign replaces it without dropping listings.
- Poster fallback and model dispose behavior.

### CAN REDESIGN

- Homepage section chrome, marketplace grid visuals, card frames, nav look, PDP side panel, type and crew sections, motion choices that stay decorative.

### NEEDS CARE

- Boot gate (home is not interactive until it finishes).
- `force3D` vs mobile poster switch.
- `ModelStage` intersection mounting.
- Two navs if both stay on one origin.
- Oracle compact variant on cards (must not show a part mark as a whole-Bey price).

### DO NOT TOUCH

- Canonical catalogue identity and seed meaning.
- Oracle math and snapshot schema.
- `visual-assets.json` mapping rules.
- Database contents and API response contracts.
- 3D asset file names and paths.
- Production route split between the Vite shell and Next pages.
- Gacha service code and its database (separate Railway service; not part of this UI tree).

## Audit close

1. Files inspected: `App.tsx`, `main.tsx`, `Landing.tsx`, `Marketplace.tsx`, `ProductDetail.tsx`, `MarketingNav.tsx`, `ModelViewer.tsx`, `loadModel.ts`, `theme.css`, `marketplace.css`, `oracleBridge.ts`, Next `page.tsx` routes, `next.config` behavior from the current integration, animation grep across `apps/web/src/consumer`.
2. Routes inspected: consumer table in `App.tsx` and Requiem `app/` pages, including live browse Burst (25 asset links) and X (17 asset links).
3. Components mapped: pages, nav, Oracle, model stack, React Bits motion set.
4. Animation systems: CSS keyframes, GSAP, rAF, IntersectionObserver. No single motion owner.
5. 3D: Three.js FBX/OBJ, `ModelViewer`, `ModelStage`.
6. Screenshots: none.
7. Architecture: one origin, two UIs, three ids (listing, mesh, Oracle).
8. Visual: consumer black/yellow/cyan pit vs separate Requiem chrome.
9. Performance: large client catalogue, home multi-viewer, X feed 404 retry, shared stage on the shop.
10. Redesign risk: route rewrites, asset keys, and treating BeyOracle part counts as the shop list.

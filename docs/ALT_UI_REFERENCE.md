# ALT.xyz UI Reference — Beyoracle Parity Spec

Audit date: **2026-08-05**  
Scope: Visual language, asset pricing UX, browse/search patterns  
Implementation owner: `apps/web/src/lib/alt-design-tokens.ts` + `apps/web/src/app/globals.css`

---

## 1. Research sources

| Source | What we extracted |
|--------|-------------------|
| [alt.xyz](https://alt.xyz) | Dark/light theme toggle (`localStorage.appTheme`), `#000` dark bg, `#7c50fc` Royal accent (splash spinner), `#1e2733` Shadow text (light mode) |
| [alt.xyz/browse](https://alt.xyz/browse) | Search header, filter drawer, marketplace source counts, card grid with grade/serial/POP, auction price + bid count |
| [Adobe Typekit ucg0rpr](https://use.typekit.net/ucg0rpr.css) | Neue Haas Grotesk Display + Text |
| [Alt Value blog](https://alt.xyz/blog/know-card-value-instantly) | Sold-comps-only valuation, Low/Medium/High confidence, daily refresh |
| [Emily Kolodny brand case study](https://www.emikolodny.com/work/alt) | Named palette (Royal, Shadow, Slate, Success/Warning/Error), Decimal/Peclet/NHG type pairing |

---

## 2. Color system

### 2.1 Brand palette (named)

| Token | Hex | Usage on ALT |
|-------|-----|--------------|
| Alt Black | `#000000` | Dark mode page bg, theme-color meta |
| Shadow | `#1e2733` | Light-mode body text |
| Royal | `#7c50fc` | Primary accent — CTAs, loading spinner, chart line |
| Success | `#22c55e` | Positive % change (Top rising) |
| Warning | `#eab308` | Low-confidence marks, deal bars |
| Error | `#ef4444` | Negative % change, errors |

Secondary brand hues (Gold, Powder, Slate, Navy, etc.) appear in marketing and MCM abstract graphics — not required for Beyoracle v1 dark shell.

### 2.2 Dark UI surfaces (Beyoracle target)

Beyoracle maps ALT dark mode to CSS variables in `globals.css`:

```
--bg:              #0a0a0f   (near Alt Black, lifted for card depth)
--surface:         #0f0f18
--card:            #141420
--card-hover:      #1a1a28
--border:          rgba(255,255,255,0.08)
--text:            #f4f4f5
--muted:           #71717a
--accent:          #7c50fc   (Royal — was cyan #22d3ee pre-audit)
--accent-dim:      #5b3bd4   (Royal pressed state)
--price:           #34d399   (positive money / rising %)
```

---

## 3. Typography

| Role | ALT production | Beyoracle fallback |
|------|----------------|-------------------|
| UI body | Neue Haas Grotesk Text (Typekit) | Inter (already in globals.css) |
| UI display / prices | Neue Haas Grotesk Display | Inter semibold/bold |
| MUI components | Roboto 300–700 | — |
| Editorial / hero | Tiempos Fine, Suisse Intl | — |

**Recommendation:** Do not embed Typekit in Beyoracle unless licensed. Inter + system stack is an acceptable NHG substitute (same Swiss grotesk lineage).

### Type scale (asset page)

| Element | Size | Weight |
|---------|------|--------|
| Oracle / Alt Value hero | 2.5–3rem | 600–700, tabular nums |
| Range band (low–high) | 0.875rem | 400, muted |
| Section headings | 1.125–1.25rem | 600 |
| Table body | 0.875rem | 400 |
| Metadata (grade, POP) | 0.75rem | 500, uppercase or muted |

---

## 4. Layout patterns

### 4.1 Global shell

```
┌─────────────────────────────────────────────────────────────┐
│  [ALT logo]     Browse · Auctions · Portfolio    [Search]   │  ← sticky header ~56px
├─────────────────────────────────────────────────────────────┤
│  max-width ~1280px, horizontal padding 1.5rem               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  page content                                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

- Logo: single-color wordmark, works on black
- Search: prominent on Browse (`3.7M items` count below)
- Category pills: horizontal scroll (ALL, BASKETBALL, …)

### 4.2 Browse / search

- **Left drawer:** filters (grade, price range, marketplace source, player, year)
- **Sort:** Sold listings, relevance
- **Card row fields:** Year Set Player # · Grade Serial POP · Time left · **Price** · Bid count · Bid CTA
- **Marketplace toggles:** Alt, eBay, Fanatics, Goldin, etc. with listing counts
- **Rising/falling strip:** avatar + name + **7d %** in green/red

### 4.3 Asset / card detail (Alt Value page)

Observed product UX from Alt Value documentation + marketplace listing detail patterns:

```
┌──────────────────┬──────────────────────────────────────────┐
│                  │  2023 Topps Chrome · PSA 9 · POP 96       │
│   Card image     │  Michael Jordan #23                       │
│   (large,        │                                           │
│    centered)     │  ALT VALUE          Confidence: Medium    │
│                  │  $43,750                                │
│                  │  $38,200 – $49,100  (range band)          │
│                  │  Based on N sold comps · Updated daily    │
├──────────────────┤                                           │
│  [1M][3M][6M]    │  ┌─────────────────────────────────────┐  │
│  [1Y][ALL]       │  │     line chart (Royal stroke)       │  │
│                  │  │     subtle gradient fill below      │  │
│                  │  └─────────────────────────────────────┘  │
│                  │                                           │
│                  │  RECENT COMPS (sold only)                 │
│                  │  date · source · price · condition        │
└──────────────────┴──────────────────────────────────────────┘
```

**Key behaviors:**
- Hero price is the **current Alt Value** (oracle mark), not last comp
- Range band always visible when confidence ≠ none
- Chart shows **historical Alt Value or comp-derived trend** — line chart, not OHLC candles
- Comps table: sold transactions only, source badge, external link
- No asking/listing prices in valuation hero

---

## 5. Chart UX spec (for Beyoracle `CompsChart`)

| Property | ALT pattern | Beyoracle mapping |
|----------|-------------|-------------------|
| Chart type | Line (+ optional area fill) | `buildTimeSeries()` → line/area |
| Current mark | Large hero above chart | `oracle.value` in `.price-hero` |
| Range | Subtitle under hero | `oracle.low` – `oracle.high` |
| Confidence | Text badge: Low / Medium / High | `oracle.confidence` → `.confidence-*` classes |
| Time ranges | Pill toggles: 1M 3M 6M 1Y ALL | Filter `chart[]` client-side |
| Sparse data | Show chart skeleton + warning copy | `nComps < min` → `--warning` badge |
| Color | Royal `#7c50fc` stroke | `--accent` CSS var |
| Grid | Subtle horizontal only | `--border` at 40% opacity |
| Tooltip | Date + price on hover | Standard recharts/custom tooltip |

**Do not:** Use candlesticks, volume bars, or listing ask prices in the oracle chart.

---

## 6. Component class map (globals.css)

Tailwind utility classes aligned to ALT:

| Class | Purpose |
|-------|---------|
| `.shell-main` | Centered page content (max-w-7xl) |
| `.card` / `.card-interactive` | Elevated surfaces |
| `.price-text` | Green tabular price display |
| `.btn-primary` / `.btn-ghost` | CTA patterns |
| `.input` / `.input-search` | Form controls |
| `.gen-pill` / `.gen-pill-active` | Generation category pills |
| `.badge` / `.badge-gen` | Metadata chips |
| `.header-blur` | Sticky frosted header |
| `.nav-link` / `.nav-link-active` | Header navigation |

Chart components live in `AssetClient.tsx` (`CompsChart`, `CompsTable`, `SourceToggles`).

---

## 7. Parity gaps — Beyoracle v1 vs ALT.xyz

### Shipped / aligned (this audit)

- [x] CSS token file `alt-design-tokens.ts`
- [x] Dark theme variables in `globals.css` (Tailwind + utility classes)
- [x] Royal accent `#7c50fc` (was cyan `#22d3ee`)
- [x] `AppShell`, `SiteHeader`, `layout.tsx` with Inter font
- [x] Product page (`/product/[id]`) with Oracle Value hero + confidence badge
- [x] Asset page (`/asset/[id]`) with source/condition toggles
- [x] `CompsChart` (Recharts line + scatter + IQR band + current mark reference line)
- [x] Browse products grid + generation filters

### Remaining gaps (future polish)

| Gap | Priority | Notes |
|-----|----------|-------|
| **CompsChart hardcoded colors** | P0 | Chart uses `#38bdf8` / `#64748b` instead of `var(--accent)` — wire to tokens |
| **Time-range pills (1M/3M/6M/1Y/ALL)** | P1 | ALT asset pages filter chart by window; Beyoracle shows all comps |
| **Browse card grid parity** | P1 | Product tiles exist but lack ALT auction metadata (time left, bid count) |
| **Filter drawer on browse** | P2 | No grade/price/marketplace source drawer like ALT browse |
| **Search result count header** | P2 | ALT shows `3.7M items` under search; Beyoracle search is minimal |
| **Price hero uses accent not price green** | P2 | Product page shows oracle in `--accent`; ALT often uses neutral/white for hero |
| **Neue Haas Grotesk** | P3 | Using Inter via next/font — acceptable NHG substitute |
| **Great Value / deal bars** | P3 | ALT marketplace-specific |
| **Auction countdown + bid UI** | P3 | Out of scope for oracle-only Beyoracle |
| **Rising/falling index strip** | P3 | Homepage market trends widget |

---

## 8. Implementation checklist (next agents)

1. Add `app/layout.tsx` importing `globals.css`, wrap with AppShell
2. Create `/products/[id]/page.tsx` using `getProductData()` + CompsChart
3. Replace inline styles on home/browse with CSS utility classes
4. Wire source + condition filter bar to URL search params
5. Add recharts (or lightweight SVG) line chart per §5 spec

---

## 9. Token sync rule

When changing colors or spacing:

1. Update `apps/web/src/lib/alt-design-tokens.ts` (`altCssVars`)
2. Mirror the same values in `apps/web/src/app/globals.css` `:root`
3. Run `pnpm --filter @beyoracle/web typecheck`

`alt-design-tokens.ts` is the **TypeScript source of truth**; CSS variables are the **runtime source of truth** for components.

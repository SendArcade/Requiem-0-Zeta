# Migration status (historical)

The RIPBEYS consumer now ships inside the Requiem web service. Current identity, Oracle, and asset rules are in `docs/ORACLE_LINKING.md`, `docs/CATALOGUE_IDENTITY_MAP.md`, and `docs/FINAL_SYSTEM_AUDIT.md`. This file is the 2026-09-24 snapshot only.

Updated: 2026-09-24 (Stage 11 — investor demo refinement)

## Done (no git commit/push)

1. Stages 1–10
2. **Stage 11:** Investor-facing refinement
   - `VITE_MARKET_OPEN` gate (default open; `0` restores ComingSoon)
   - Demo states strip: Product Oracle / Part mark / Needs seed / Unavailable
   - Featured sort pins showcase listings; Dagger hero opens PDP
   - Dagger Dran showcase PDP polish
   - `DEMO_VISUAL_ISSUES.md` (Burst chrome posters — no fake art)
   - `INVESTOR_DEMO_REPORT.md`

## Intentionally untouched

- Seeds, matcher, Oracle math, ingest, workers, DB, Railway, asset files
- No commit / push / deploy

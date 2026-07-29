# 10 — Roadmap

[← Blueprint index](README.md) · Prev: [09-decisions](09-decisions.md) · Next: [11-verification](11-verification.md)

Ordered by dependency, not ambition. The sequencing matters: several items get
cheaper or safer once the ones above them land.

## Done — matcher v2 (2026-07-29)

Shipped in one pass. Detail in [06-matching](06-matching.md).

| # | Work | Status |
|---|---|---|
| 1 | Split alias rows into atomic surface forms | ✅ 130 rows |
| 2 | Use `nameJp` / `nameZh` / `nameEn` in exact rung | ✅ via `loadMatcherContext()` |
| 3 | Filter bundles before comps reach the oracle | ✅ ingest + matcher |
| 4 | Re-run probe and record match rate | ✅ Mercari 27.8%, Yahoo 48.0% |
| 5 | Segment mark by condition | ✅ default excludes sealed |
| 6 | Fix `minComps` dead code | ✅ enforced |
| 7 | Fix band (true Q1–Q3) | ✅ |
| 8 | CJK-aware fuzzy similarity | ✅ bigram Jaccard |

**Exit criterion met:** match rate materially above 1.5%, zero bundles admitted.

## Now — make the mark production-grade

Remaining defects in [07-oracle-value](07-oracle-value.md).

| # | Work |
|---|---|
| 9 | Time-decay weighting on comp age |
| 10 | MAD-based outlier rejection before computing the band |
| 11 | Real dated FX series to replace the hardcoded `FX_RATES` stub |

## Then — widen the funnel

Order and rationale in [05-sources](05-sources.md) and
[docs/SOURCE_MAP.md](../docs/SOURCE_MAP.md).

| # | Work |
|---|---|
| 13 | **Yahoo Auctions JP closed search** — ✅ shipped; tune matcher on whole-product titles |
| 14 | **Product catalog** — whole Beyblade SKUs for **all gens** (Plastic, Metal, Burst, X): complete loose, starter, sealed box |
| 15 | **Catalog hardening** — Takara Tomy codes + Fandom aliases for vintage gens |
| 16 | Shopee TW live path (currently fixtures-only) |
| 17 | Ruten TW for real Taiwanese depth |
| 18 | **Mandarake + Suruga-ya** — vintage whole-product depth and dealer floor |

Note the ordering: **product catalog across all four generations** before adding
venues. Every additional marketplace multiplies matcher error.

## Later — infrastructure and product

| # | Work |
|---|---|
| 18 | BullMQ cron workers and Redis snapshot cache (deferred in [D8](09-decisions.md)) |
| 19 | Postgres in the web read path |
| 20 | Real watchlist alerts — listing below X% of mark |
| 21 | Confidence gating in the UI for sparse comps |
| 22 | Category shrinkage for parts with too few comps of their own |
| 23 | Market-wide index |
| 24 | Review queue for low-confidence matches |

## Explicitly not planned

Marketplace and checkout, social and battle maps, photo part ID, combo premium
modelling, Facebook and Discord scraping, PriceCharting integration (zero
Beyblade coverage), eBay as a comps source (Marketplace Insights is
unobtainable).

Reasoning in [01-thesis](01-thesis.md) and [02-landscape](02-landscape.md).

## Open research

Two investigations were in flight when this was written. Check `docs/` for
their output before designing from scratch:

- Robust estimators and sparse-comps methods, which informs items 8, 9, and 21
- Multilingual entity matching and CJK segmentation, which informs item 5 in
  [06-matching](06-matching.md)

---

See also: [06-matching](06-matching.md) · [07-oracle-value](07-oracle-value.md) · [11-verification](11-verification.md)

# Valuation engine research — synthesis

_Research agent output, 2026-07-29. Implementation status noted inline._

Oracle architecture: [`blueprint/07-oracle-value.md`](../blueprint/07-oracle-value.md).

## Shipped / fixed from this research

| Item | Status |
|------|--------|
| `minComps` dead code | ✅ enforced |
| True Q1–Q3 band (not Tukey fence) | ✅ |
| Interpolated quartiles (Hyndman-Fan type 7) | ✅ 2026-07-29 |
| TWD→JPY FX stub updated (4.76 → 5.08) | ✅ 2026-07-29 |
| Landed JPY + FX at sale | ✅ schema + ingest persist (`0003_oracle_normalization.sql`) |
| Time decay + MAD + weighted median | ✅ `packages/oracle/src/robust-estimator.ts` |
| Cohort index re-timing | ✅ `packages/oracle/src/cohort-index.ts` (pass `context.cohortIndex`) |
| Shrinkage toward cohort prior | ✅ `packages/oracle/src/shrinkage.ts` (pass `context.cohortPrior`) |
| Region TW premium display | ✅ asset page + `packages/oracle/src/region.ts` |
| Eval scoreboard (v2 vs v1) | ❌ planned |

## Next — five layers (ship independently)

### Layer 0 — Normalization at ingest (highest leverage)

Store immutable `landedJpy` + `fxRateAtSale` on each observation. Landed = item + buyer shipping. FX at **time of sale** (Frankfurter API), not read-time conversion. Fixes ~6% TW bias and stops history rewriting when FX moves.

### Layer 1 — Robust weighted estimator

Log-space prices. Weights = time decay × venue reliability × condition match. MAD outlier gate when n≥5. **Weighted trimmed Harrell-Davis** median — port from [perfolizer](https://github.com/AndreyAkinshin/perfolizer) (MIT). Report `nEffective` (Kish), dispersion (IQR), and bootstrap CI separately.

### Layer 2 — Cohort index

Chained weighted-median-of-ratios per (generation × part type). ~60 lines TS. Methodology from [hpipy](https://github.com/reidjohnson/hpipy) (Apache-2.0) — **not** GPL hpiR.

### Layer 3 — Index-anchored re-timing

`p_adj = p_obs × (I_today / I_atObsDate)` — Card Ladder pattern. Widens effective window for sparse parts (~3× effective n).

### Layer 4 — Region multiplier

One global mark; estimate JP/TW premium at cohort level. Surface: "Mark ¥1,000 (JP) · ~¥1,150 in TW."

## Libraries to add (pure JS)

| Package | Role |
|---------|------|
| `@stdlib/stats-base-dists-beta-cdf` | Harrell-Davis quantile |
| `simple-statistics` or `d3-array` | MAD, R-7 quantile helpers |
| Frankfurter API | Historical TWD/JPY |

## Scoreboard before changing estimators

Port k-fold error / revision metrics from `hpipy/utils/metrics.py` so v2 beats v1 on a fixed eval set — otherwise upgrades are unfalsifiable.

## Explicitly not v2

Case-Shiller repeat-sales (wrong framing — SKUs repeat), full hedemic regression, changepoint detection (v3 — reissue detection), deducting seller fees from buyer-facing mark.

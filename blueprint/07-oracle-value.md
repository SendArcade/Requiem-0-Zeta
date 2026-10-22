# 07 — Oracle Value

[← Blueprint index](README.md) · Prev: [06-matching](06-matching.md) · Next: [08-glossary](08-glossary.md)

Implementation: [`packages/oracle/src/oracle-value.ts`](../packages/oracle/src/oracle-value.ts)

## What the mark is

A robust central estimate of what a part actually sells for, plus an honest
range, computed only from **realized sales** within a window.

```
value = median(sold comps, last 90 days, selected sources)
low   = Q1 - 0.5 × IQR
high  = Q3 + 0.5 × IQR
```

Median rather than mean because collectible comps are heavy-tailed: one
mispriced lot or one grail sale would drag an average badly.

## Confidence

Sample size gates how loudly we present the number.

| Comps | Confidence |
|---|---|
| ≥ 5 | high |
| 3–4 | medium |
| 1–2 | low |
| 0 | no mark — return `null` |

**Never invent a mark.** Returning `null` and showing "insufficient data" is
correct behaviour, not a failure. Sparse comps are the normal case for older
generations, and a confident-looking number over two sales is a lie.

## Source toggles

Recomputation runs over **already-stored comps** and never triggers a fetch.
`recomputeWithSources()` takes a source list, converts it to a bitmask, and
re-filters. Snapshots cache per `(asset_id, sources_mask)`.

This is what makes the toggle instant and safe to expose. Keep it that way.

## Known defects (remaining)

Each is real; items marked **fixed** shipped in matcher v2 (2026-07-29).

### Condition segmentation — **fixed**

Default mark excludes sealed comps (`DEFAULT_ORACLE_CONDITIONS`). UI exposes
condition toggles and per-condition breakdown via `computeOracleByCondition()`.

### `minComps` — **fixed**

Returns `null` when `filtered.length < minComps` — no inner zero-only guard.

### The band — **fixed**

Band now uses true Q1–Q3 (interquartile range), not Tukey fence.

### No outlier rejection

The median resists outliers; the band does not. A single absurd comp widens the
published range. Add MAD-based rejection before computing the band.

### No time weighting

A comp from 89 days ago counts exactly as much as one from yesterday. In a
market where a part tripled in six months, that is a real distortion. Apply
exponential decay on comp age.

### FX is a hardcoded stub

`FX_RATES` in `shared` is a static table, and conversion uses today's rate
rather than the rate at time of sale — which quietly distorts any cross-currency
chart. See [04-data-model](04-data-model.md).

### `buildTimeSeries` — **fixed**

Now respects `windowDays`, `sourcesMask`, and `conditions` via shared `filterComps()`.

### Shipping is not normalised

Mercari prices typically include domestic shipping; Shopee's typically do not.
Comparing them directly biases the cross-corridor mark.

## Upgrade path

Do these in order. Steps 1–3 are cheap and matter more than any modelling
sophistication.

1. ~~Fix the defects above — especially condition segmentation and bundle
   exclusion (see [06-matching](06-matching.md)).~~ **Done (2026-07-29)**
2. Time-decay weighting on comp age.
3. MAD-based outlier rejection before the band.
4. Shrinkage toward the parent category (generation + part type) when a part
   has few comps of its own. This is the standard sparse-comps fix.
5. A market-wide index for "is Beyblade X up this month."

Research into robust estimators and sparse-comps methods is in flight; check
[docs/](../docs) for a valuation research document before designing step 4
from scratch.

## Rules

- A mark without comps behind it is not shippable.
- Prefer honest uncertainty to a precise-looking fabrication.
- Any change to the formula needs a regression test with fixed input comps.

---

See also: [04-data-model](04-data-model.md) · [06-matching](06-matching.md) · [11-verification](11-verification.md)

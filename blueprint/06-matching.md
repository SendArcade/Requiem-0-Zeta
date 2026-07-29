# 06 — Matching

[← Blueprint index](README.md) · Prev: [05-sources](05-sources.md) · Next: [07-oracle-value](07-oracle-value.md)

Implementation: [`packages/oracle/src/matcher.ts`](../packages/oracle/src/matcher.ts),
[`packages/catalog/src/load.ts`](../packages/catalog/src/load.ts),
[`packages/shared/src/index.ts`](../packages/shared/src/index.ts)

## What matching has to do

Turn a free-text marketplace title into a canonical part ID.

```
"ベイブレードX BEYBLADE X ドランソード　3-60 f 赤　レッド"  →  x-bx-01-blade
```

Titles are seller-written, in Japanese or Traditional Chinese, padded with
promo keywords, full-width characters, and bundle language. This is entity
resolution over noisy multilingual short text — the hardest part of the product
and the part that decides whether anyone trusts the number.

## Matcher v2 (shipped 2026-07-29)

A cascade adapted from PokeDao's CardMatcher. Bundles are rejected before any
rung fires.

| Step | Method | Confidence | Notes |
|---|---|---|---|
| 0 | `looksLikeBundle()` | — | Reject lots (`まとめ`, `セット`, multi-code, etc.) |
| 1 | Product code regex | 0.98 / 0.95 | Disambiguate starter SKUs via name-in-title |
| 2 | Exact surface form | 0.92 | EN/JP/ZH names + atomic aliases; scored |
| 3 | CJK-aware fuzzy | ≤0.85 | Bigram Jaccard via `textSimilarity()` |

### Context loading

`loadMatcherContext()` expands each part into atomic surface forms: canonical
`nameEn`, `nameJp`, `nameZh`, product codes, and alias rows from
`aliases.json` (130 rows). Polluted compound aliases like `"ドランソード BX-01"`
are split via `splitAliasText()`.

Exact matching scores candidates to prefer CJK part names over bare ratchet
dimensions (`3-60`) that substring-match incidentally.

### CJK fuzzy

Whitespace tokenization fails on unspaced Japanese. `tokenSetCjkAware()` emits
character bigrams for CJK runs so titles like `ベイブレードXドランソード3-60F`
score against `ドランソード`.

## Measured accuracy

```bash
MERCARI_API_ENABLED=1 pnpm --filter @beyoracle/ingest probe:mercari
YAHOO_AUCTIONS_ENABLED=1 pnpm --filter @beyoracle/ingest probe:yahoo
```

Probe baselines, 2026-07-29:

| Source | Listings | Matched | Rate | Bundles detected | Bundles matched |
|---|---|---|---|---|---|
| Mercari JP | 245 | 68 | **27.8%** | 99 (40.4%) | **0** |
| Yahoo Auctions JP | 200 | 96 | **48.0%** | 47 (23.5%) | **0** |

Previous baseline (pre-v2): Mercari **1.5%**, Yahoo **5.5%**.

Per-query Mercari hit rates on common X parts now land in the 15–80% range
depending on query specificity (e.g. `ドランソード` ~78%, generic `バースト` ~6%).

## Bundle exclusion

~24–40% of live sold listings are multi-item lots. These must never become comps.

`looksLikeBundle()` lives in `@beyoracle/shared` and is applied in:

- **Ingest pipeline** — skip before matching
- **Matcher** — reject as belt-and-suspenders

Patterns cover JP (`まとめ売り`, trailing `セット`, quantity suffixes) and ZH
(`整組`, `全套`, `○件`). Starter-box bundles (`スターター`) and joiner titles
(`＆`, `+`) are flagged.

## Remaining gaps

Accuracy is usable but not trustworthy for production claims yet:

- Generic queries still produce false positives (ratchet dimensions, shared promo text).
- Product codes label starter SKUs containing several parts — disambiguation by
  name helps but is not perfect.
- Chinese market coverage depends on alias quality; TW live ingest is still fixtures-only.
- No human review queue for low-confidence matches.

## Rules for anyone working here

- **Measure with the probe, not intuition.** Report a match rate.
- **A wrong match is worse than no match.** It silently corrupts the mark;
  a miss only reduces coverage.
- **Never let a bundle become a comp.**
- Regression-test against **real titles** from the probe, not invented ones.

---

See also: [04-data-model](04-data-model.md) · [07-oracle-value](07-oracle-value.md) · [08-glossary](08-glossary.md) · [11-verification](11-verification.md)

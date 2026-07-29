# Matching research — synthesis

_Research agent output, 2026-07-29. Implementation status noted inline._

Full live source ranking: [`SOURCE_MAP.md`](SOURCE_MAP.md). Matcher architecture: [`blueprint/06-matching.md`](../blueprint/06-matching.md).

## Shipped from this research (matcher v3)

| Item | Status |
|------|--------|
| Lot/bundle hard exclusion | ✅ `classifyListingShape` → `lot` |
| **`complete_bey` shape classifier** | ✅ starter/combo suffix (`3-60F`) excluded from part comps |
| **`wanakana` + `opencc-js` normalization** | ✅ `normalizeForMatch()`, `matchKeys()` |
| **Labeled eval set (~200 titles)** | ✅ `packages/oracle/fixtures/eval-titles.json` (213 cases), `pnpm eval:build` |
| CJK exact + bigram fuzzy | ✅ |
| Product-code dedupe (WD vs WD-MG) | ✅ |

## Next — ranked by accuracy per effort

1. **Composite confidence + three-zone routing** — auto-accept ≥0.90, review 0.60–0.90, reject below.
2. **MiniSearch BM25 blocking** — needed at 1k+ parts for performance and IDF.
3. **Authenticity flag + price floor** — `副廠`/`模倣品` keywords; reject below 30% of mark.
4. **Expand eval set** with live probe samples (`MERCARI_API_ENABLED=1 pnpm probe:mercari` → label → commit).

## Patterns to scavenge

| Source | Use |
|--------|-----|
| [Zarenk/product-matcher](https://github.com/Zarenk/product-matcher) | TypeScript token-set ratio, three-level blocking, three-zone decision |
| [PokeDao CardMatcher](https://github.com/ChicoPanama/PokeDao) | Negative cache, prefix-filtered candidates — **not** its CJK-stripping `normalize()` |
| Beyblade Fandom CC-BY-SA dump | Bulk EN/JP/ZH alias strings at volume |

## Explicitly deferred

Embeddings/pgvector, PGroonga, morphological analyzers (Kuromoji/nodejieba), Python sidecars — catalog is small and product codes are discriminative; revisit only if eval set shows >10% miss rate after normalization.

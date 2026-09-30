# Pricing pipeline

The Pricing Notion page was read on 2026-09-30 from the public link, after the page rendered. A raw download of the URL is only Notion’s empty shell.

## What the page specifies

Price one whole Beyblade SKU: complete loose, starter, or sealed box. Never a sum of part medians. Parts stay engine-internal. Multi-lots, launcher-only, and junk lots are not marks.

Sold comps only. Live sources named: Mercari Japan, Yahoo Auctions Japan. Partial: Shopee Taiwan. Next or planned: Ruten, Suruga-ya, eBay, Mandarake, Rakuma.

Gates: realized sale, one SKU, match above threshold, last 90 days, source URL stored. Under 3 comps: low confidence or no mark. Never invent a number.

Mark is the median. Band is Q1–Q3. Currency defaults to JPY. Confidence: 5+ high, 3–4 medium, 1–2 low and flagged, 0 none. Default mark excludes sealed comps. Source and condition toggles recompute stored comps and do not fetch again.

v2 (not shipped): FX at sale time, time-decay and outlier gate, generation index, shrinkage when n is under 3, a JP/TW premium display.

## What the code does

The live mark is still the Requiem median and IQR from Railway, read by `/api/product` and `/api/asset`. The consumer does not sum parts and does not invent a number. `DEFAULT_ORACLE_CONDITIONS` is `used`, `like_new`, `unknown`, which matches “exclude sealed.” The publish floor in code is 3 comps (`DEFAULT_PUBLISHED_MIN_COMPS`). The page’s “1–2 comps, show a flagged mark” tier is not a separate UI state.

The page’s “~46k BX sold / 180d” is its own note. It was not checked against the database.

## Read path

1. Marketplace and Bey pages call `fetchListingOracle(listingId)`.
2. The bridge picks `/api/product/{id}` or `/api/asset/{id}`.
3. The product and asset routes call the existing data functions. They accept `?sources=` and `?conditions=`.
4. A numeric `oracle.value` is the mark. `null` is unavailable. Zero is not a substitute.

The public archive lists a Bey only when `oracleKind` is `product` and that response contains a number. Part marks stay off that grid.

On 2026-09-30 a read of production `GET /api/product/{id}` for the 23 distinct product-bridge ids returned a JPY median for 12 products. Two products are shared by two listing ids, so 14 listings qualify. The earlier “22” count mixed in part-oracle numbers. Those part numbers were never a whole-Bey price.

## Condition pool

Default secondary mark: `used`, `like_new`, `unknown`. Sealed SKUs use `sealed` only. Publishing floor is 3 comps (`DEFAULT_PUBLISHED_MIN_COMPS`). Matcher auto-accept floor is 0.9. Do not change these from the consumer UI.

## Chart

`OracleHistory` draws the API comps: rolling median, sale dots, current-mark line, IQR band, ranges 1M / 3M / 6M / 1Y / ALL. It does not invent points.

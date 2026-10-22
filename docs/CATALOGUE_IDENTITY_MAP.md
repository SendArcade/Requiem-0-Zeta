# Catalogue identity map

Source files:

- Listings: `apps/web/src/consumer/lib/assets.ts` (`marketplaceListings`)
- Bridge: `apps/web/src/consumer/data/oracle-bridge.json` (generated 2026-09-24 from `packages/catalog/data/ripbeys-asset-map.json`)
- Names shown in the UI: `apps/web/src/consumer/lib/oracleNames.ts` (Requiem `nameEn` for confirmed rows)
- Visuals: `apps/web/src/consumer/data/visual-assets.json`

## Inventory

| Count | Meaning | Do not reuse this number for |
|---|---|---|
| 578 | Listing records in the bridge | Live prices, models, or product marks |
| 26 | `oracleKind: product` | Listings that currently have a number |
| 104 | `oracleKind: part` | Whole-Bey prices |
| 448 | `oracleKind: none` | Hidden bugs. This includes 18 assembled X Beys with parts but no product seed |
| 14 | Listings whose product API returned a number on 2026-09-30 | The bridge size |

All 578 records stay in the listing data. The public archive shows the product rows that currently have a number. Every other listing remains open by `/market/{listingId}`.

## Names

The card and the Bey page title use `oracleTitleForListing`, which prefers `oracleNames`. Examples already wired to the seed:

| Listing | Shown name | Product |
|---|---|---|
| bx-002 | Dran Dagger (4-60R) | prod-x-dran-dagger-4-60r-complete-loose |
| bx-003, bx-201 | Phoenix Wing (9-60GF) | prod-x-bx-23-complete-loose |
| bx-004, bx-228 | Cobalt Dragoon (2-60C) | prod-x-bx-34-complete-loose |
| bx-205 | Wizard Arrow (4-80B) | prod-x-bx-05-complete-loose |

`bx-002` must not be linked to Wizard Arrow / `BX-02`.

Seed `nameEn` values `Arc (4-55LO)` and `Dark (6-80W)` are short. The consumer repeats them. They were not expanded, because a longer trade name would be an invented identity.

## Adding a listing

1. Add the listing record. Do not derive a Requiem id from its number.
2. Add a visual-assets row for that id only.
3. Add a bridge row with `confirmed`, `ambiguous`, `unmatched`, or `conflict`.
4. Leave `oracleKind` as `none` until one canonical product or part is confirmed.
5. Run `pnpm audit:identity`.

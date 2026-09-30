# Seed inventory

Two different “seeds” exist. Do not merge them.

## Notion purchase plan

The Seed inventory page was read on 2026-09-30 from the public link. It is a $5,000 off-platform buying plan for a gacha pool: sort lots into individual whole Beys, and never list the lots themselves on the platform.

It states about 309 whole Beys, about $4,480 product spend, about $9,440 total Oracle value, about 2.1× Oracle over cost, and about $7,550 at 80% buyback. Orders span X, Burst, Metal, and Plastic/HMS (Hasbro cases, BX-07, BX-14, random boosters, Metal Fight lots, Mandarake and Suruga-ya singles). It also says marketplace listings can back the gacha: if a pull wins, buy that listing and ship it.

Those dollar Oracle totals are the page’s plan. They were not checked against Railway, and they were not written into the site.

## Catalogue seeds in this repo

Canonical product and part seeds live under `packages/catalog/data/seeds/`. `AGENTS.md` records 1,105 parts and 448 products. Those counts are not the 309-unit buy plan and not the 578 RIPBEYS listings.

18 assembled X listings have part ids and `oracleKind: none` with reason `assembled_without_product_seed`. They need a real product seed before a whole-Bey price. This pass did not invent those products or the $5k purchase lots.

Production rows stay on Railway Postgres. Do not seed a laptop database and treat it as that inventory.

The built catalogue in `AGENTS.md` splits as 1,105 parts (Plastic 154, Metal 164, Burst 576, X 211) and 448 products (Plastic 85, Metal 119, Burst 86, X 158). RIPBEYS listings do not add a second product table. A listing becomes priced only through `oracle-bridge.json`. The 18 assembled X rows without a product seed are listed in `demotedAssembledXWithoutProduct`.

Rebuild parts with `pnpm catalog:build` only when the seed inputs are supposed to change.

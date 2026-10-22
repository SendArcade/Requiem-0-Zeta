# Catalogue Identity Audit (Stage 3)

**Date:** 2026-09-21  
**Scope:** Read-only. No seed, Oracle, matcher, UI, asset, DB, or Railway changes.  
**Sources:** `packages/catalog/data/ripbeys-asset-map.json`, `apps/web/src/consumer/data/oracle-bridge.json`, `packages/catalog/data/parts.json`, `packages/catalog/data/seeds/products-*.json`, `MIGRATION_PLAN.md`, `MAPPING_REPORT.md`.

---

## A. Executive summary

RIPBEYS can safely show Product Oracle for **14** confirmed product bindings today. Expanding beyond that is blocked by **catalogue identity**, not by frontend wiring.

| Blocker | Scale | Nature |
|---------|------:|--------|
| Identical-recipe duplicate product codes | **2** X groups (BX-01/BX-22, BX-04/BX-06) | Same blade+ratchet+bit under two Takara codes — Oracle-canonical product must be chosen by policy |
| BX-20 / Dran Dagger vs Shark Edge | **1** systemic seed conflict | Part `productCodes` and product seeds disagree; **data conflict**, not a mapping typo |
| Demoted assembled X (Option B) | **26** | **0** exact existing complete_loose recipe matches; **17** need new seeds; **9** have same blade but different official combo |
| Ambiguous map entries | **101** | Mostly Burst SKU twins + EN/JP layer aliases; only **2** are the X identical-recipe case |

**Internal consistency:** The Requiem catalogue is **not** fully consistent for X identity:

1. Multiple blades list the same `productCodes` entry (e.g. BX-20 on both Dran Dagger and Shark Edge).
2. Two distinct product rows can share an identical assembled recipe under different codes (BX-01 vs BX-22).
3. Part `productCodes` appear to be “appeared in set/box” provenance, while product rows are “this SKU’s primary code” — these semantics collide when used as Oracle identity.

**Oracle expansion remains unsafe** until (at minimum) BX-20 and the two duplicate-recipe pairs have owner decisions, and demoted assemblies are either seeded or explicitly left productless.

Validation attempted: `validate-ripbeys-assets.mjs` (map/assets) is available. `@beyoracle/catalog` `validateProductRecipes` was not run (package `dist/` not built). No mutations performed.

---

## B. Duplicate product groups

Only **two** X `complete_loose` pairs share a byte-identical `partIds` recipe:

### B1 — Dran Sword 3-60F (BX-01 vs BX-22)

| Field | BX-01 | BX-22 |
|-------|-------|-------|
| Product id | `prod-x-bx-01-complete-loose` | `prod-x-bx-22-complete-loose` |
| Name | Dran Sword (3-60F) | Dran Sword (3-60F) |
| Codes | `BX-01` | `BX-22` |
| Recipe | `x-bx-01-blade` + `x-bx-05-ratchet` (3-60) + `x-bx-06-bit` (Flat) | **Identical** |
| Combo attr | `3-60F` | `3-60F` |

**RIPBEYS listings**

| Listing | Name | Map status |
|---------|------|------------|
| `bx-001` | Dran Sword 3-60F | **ambiguous** (candidates: both complete_loose) |
| `bx-202` | Sword Dran 3-60 F | confirmed part-only; candidates include both + BX-17 (3-60FRE — different bit) |

**Evidence interpretation**

- Not a mapper inventing duplicates: both rows exist in `products-x.json` with the same name, combo, and parts.
- Likely **re-release / alternate Takara SKU** for the same physical recipe (common for BX line), **or** a seed error duplicating BX-01 under BX-22.
- Catalogue evidence alone **cannot** prove which SKU owns sold comps for Oracle — comps attach to `productId`, so picking wrong splits or duplicates market marks.

**Can an Oracle-canonical product be selected from catalogue evidence alone?**  
**No.** Names and recipes are identical. Need owner rule (e.g. “prefer earliest BX code”, “prefer SKU with more comps on Railway”, “merge into one product id”). Numeric proximity of RIPBEYS `bx-001` → BX-01 is **not** valid evidence.

Related distinct product: `prod-x-bx-17-complete-loose` Dran Sword (**3-60FRE**) — different bit (Ball) — **not** a duplicate of this recipe.

---

### B2 — Knight Shield 3-80N (BX-04 vs BX-06)

| Field | BX-04 | BX-06 |
|-------|-------|-------|
| Product id | `prod-x-bx-04-complete-loose` | `prod-x-bx-06-complete-loose` |
| Name | Knight Shield (3-80N) | Knight Shield (3-80N) |
| Codes | `BX-04` | `BX-06` |
| Recipe | `x-bx-04-blade` + `x-ratchet-3-80` + `x-bit-n` | **Identical** |
| Combo | `3-80N` | `3-80N` |

**RIPBEYS listings**

| Listing | Name | Map status |
|---------|------|------------|
| `bx-013` | Helm Knight 3-80N | **ambiguous** (both complete_loose) |
| `bx-203` | Helm Knight 5-80 T | confirmed part-only; combo differs (5-80T) — not this recipe |

**Same conclusion as B1:** release twins or seed duplication; **no** Oracle winner from recipe evidence alone.

---

### B3 — No other identical X complete_loose recipes

Automated scan of all X `complete_loose` products found **only these two** multi-product recipe keys. Other “duplicates” in the ambiguous set are SKU-type variants (starter / sealed / loose) of one code — see §E.

---

## C. BX-20 evidence audit

### C1 — Evidence that BX-20 refers to Dagger / Dran Dagger

| Source | Evidence |
|--------|----------|
| RIPBEYS listings | `bx-002` “Dagger Dran 4-60R”; `bx-231` “Dagger Dran 4-70Q”; UI mesh names `Bx20 Dagger Dran 4-60R*` (`bx-274`–`bx-276`) |
| RIPBEYS / game assets (migration plan) | Decal naming `BX20_DranDagger_4-60R.png` |
| Requiem part row | `x-blade-dran-dagger` (`Dran Dagger`) has `productCodes` including **`BX-20`** (also BX-31, UX-00, UX-18) |
| Map status | All five Dagger listings are **`conflict`** with `bx-20-catalog-split`; no product Oracle bound |

Combo on primary listing: **4-60 + Rush** (`x-ratchet-4-60`, `x-bit-r`).

### C2 — Evidence that Requiem BX-20 product is Shark Edge

| Source | Evidence |
|--------|----------|
| Product seeds | `prod-x-bx-20-complete-loose` / `-sealed` / `-starter` |
| Name | **Shark Edge (3-80F)** |
| Codes | `["BX-20"]` |
| Recipe | `x-blade-shark-edge` + `x-ratchet-3-80` + `x-bx-06-bit` (Flat) |
| Combo | `3-80F` |

Also: part `x-blade-shark-edge` lists `BX-20` among its `productCodes` (along with BX-00, BX-14, BX-31, BX-48).

### C3 — Classification

This is a **seed/data conflict inside Requiem**, amplified by RIPBEYS presentation:

```
Part productCodes[BX-20]  →  Dran Dagger  AND  Shark Edge
Product productCodes[BX-20] → Shark Edge only
RIPBEYS Bx20* UI naming   → Dagger Dran
```

It is **not** fixed by remapping `bx-002` → `prod-x-bx-20-*` (that would attach Dagger UI to Shark Edge Oracle — forbidden).

**Safe interim (already in force):** withhold product Oracle; keep part id `x-blade-dran-dagger` for identity only; never display Shark Edge marks for Dagger listings.

**Owner decisions required (do not auto-resolve):**

1. Is Takara BX-20 historically Shark Edge, Dran Dagger, or a multi-blade set code whose `productCodes` on parts are over-broad?
2. Should `x-blade-dran-dagger.productCodes` drop `BX-20`?
3. Should a new product seed exist, e.g. Dran Dagger 4-60R under a non-BX-20 primary code (or corrected code)?

---

## D. The 26 demoted X assemblies

Bridge Option B demotions (`assembled_without_product_seed`). Automated check: **exact** `complete_loose` recipe match against all X products.

| Verdict | Count | Meaning |
|---------|------:|---------|
| `needs_new_product_seed` | **17** | No X product has this blade+ratchet+bit trio |
| `blade_exists_different_combo` | **9** | Blade exists on another official combo — **must not** bind to that product |
| `safe_existing_product` | **0** | — |

### D1 — Needs new product seed (17)

| Listing | Display name | Resolved parts (combo) |
|---------|--------------|-------------------------|
| `bx-003` | Soar Phoenix 9-60GF | Phoenix Wing + 9-60 + Gear Flat |
| `bx-005` | Tail Viper 5-80O | Viper Tail + 5-80 + Orb |
| `bx-006` | Horn Rhino 3-80S | Rhino Horn + 3-80 + Spike |
| `bx-008` | Reaper Incendio T4-70K | Reaper + 4-70 + Kick |
| `bx-012` | Yell Kong 3-60GB | Yell Kong + 3-60 + Gear Ball |
| `bx-015` | Chain Incendio 5-60HT | Hells Chain + 5-60 + High Taper |
| `bx-016` | Talon Ptera 3-80B | Ptera Swing + 3-80 + Ball |
| `bx-018` | Roar Tyrano 9-60GF | Tyranno Roar + 9-60 + Gear Flat |
| `bx-019` | Bite Croc 3-60LF | Croc Crunch + 3-60 + Low Flat |
| `bx-020` | Mammo Tusk 3-60T | Tusk Mammoth + 3-60 + Taper |
| `bx-023` | Shinobi Knife 4-80HN | Shinobi Knife + 4-80 + High Needle |
| `bx-211` | Sting Unicorn 5-60GP | Unicorn Sting + 5-60 + Gear Point |
| `bx-218` | Cowl Sphinx 9-80GN | Sphinx Cowl + 9-80 + Gear Needle |
| `bx-227` | Soar Phoenix 5-80H | Phoenix Wing + 5-80 + Hexa |
| `bx-248` | Cowl Sphinx 1-80GF | Sphinx Cowl + 1-80 + Gear Flat |
| `bx-252` | Dranzer Spiral 3-80T | Dranzer Spiral + 3-80 + Taper |
| `bx-253` | Driger Slash 4-80P | Driger Slash + 4-80 + Point |

**Evidence required before seeding:** confirmed Takara product code (or explicit “custom/complete-loose only” policy), exact part ids already in `parts.json`, SKU type (`complete_loose` vs starter), and whether comps should attach to a new `prod-x-…` id. Do **not** invent codes from RIPBEYS `bx-NNN`.

### D2 — Blade exists, different official combo (9) — do not bind

| Listing | RIPBEYS combo | Nearest existing product (different combo) |
|---------|---------------|--------------------------------------------|
| `bx-007` | Courage Dran S6-60V | UX-01 Dran Buster (**1-60A**) |
| `bx-011` | Keel Shark 3-60LF | BX-20 Shark Edge (**3-80F**) — also BX-20 conflict surface |
| `bx-014` | Scythe Incendio 4-60T | BX-03 Hells Scythe (**4-80B**) |
| `bx-017` | Savage Bear 3-60S | BX-37 Bear Scratch (**5-60F**) |
| `bx-021` | Gale Wyvern 5-80GB | UX-07 Wyvern Gale (**2-60S**) |
| `bx-219` | Arrow Wizard 4-80GB | BX-02 4-60T / BX-05 4-80**B** (not GB) |
| `bx-222` | Keel Shark 1-60Q | BX-20 Shark Edge (**3-80F**) |
| `bx-232` | Buster Dran 5-70DB | UX-01 Dran Buster (**1-60A**) |
| `bx-250` | Gill Shark 4-70O | CX-11 Shark Gill (**5-60FB**) |

Binding any of these to the existing product would **mis-attribute Oracle comps** (wrong ratchet/bit). Treat as new combo SKUs or leave productless.

---

## E. Ambiguous mapping groups (101)

Refined taxonomy (counts sum to **101**):

| Group | Count | What it is | Representative listings | Resolution path |
|-------|------:|------------|-------------------------|-----------------|
| **same_recipe_sku_variants** | 55 | Same product family as starter / sealed / loose (or Burst complete set twins) | Many `bb-*` with layer + `prod-burst-*-{loose,sealed,starter}` | Prefer **`complete_loose`** (or published mark SKU) via bridge rule — **no new seeds** |
| **naming_alias_en_jp_variants** | 25 | EN Hasbro vs JP Takara layer ids (Valtryek/Valkyrie, Spryzen/Spriggan) | `bb-142` Brave Valtryek; `bb-138` Lord Spryzen | Alias table / prefer one layer id per generation — **catalogue alias decision** |
| **multiple_part_name_matches** | 12 | Token overlap hit multiple layers/parts | `bb-114` Epic Evipero vs Evipero | Manual confirm one part; tighten matcher tokens |
| **generation_part_ambiguity** | 4 | Burst listing matched metal/X part ids | Cross-gen candidates in map | Generation-scope hard filter (already partially done in Stage 1 scripts) |
| **multiple_distinct_product_recipes** | 3 | ≥2 products with **different** recipes | `bx-204` Arrow Wizard 4-60-N; `bb-140` / `bb-375` Spryzen Requiem variants | Need part/combo evidence or human pick |
| **x_identical_recipe_diff_codes** | 2 | §B1 / §B2 | `bx-001`, `bx-013` | Owner Oracle-canonical policy |

**Resolvable from existing evidence without new seeds:** most of the **55** SKU-variant cases (policy: pick `complete_loose`).  
**Not resolvable without owner input:** the **2** X identical-recipe pairs, BX-20, and most demoted assemblies.  
**Partially resolvable with alias rules:** Valtryek/Spryzen-style **25**.

---

## F. Proposed canonical identity rules

1. **Presentation vs Takara:** RIPBEYS `bx-NNN` / `bb-NNN` never imply Takara `BX-NN` / product codes.
2. **Oracle attaches to Requiem `productId`**, never to listing id.
3. **Assembled Bey Oracle** requires a confirmed `complete_loose` (or explicitly chosen mark SKU) whose **partIds** match the listing’s blade+ratchet+bit (or Burst assembled recipe). Blade-only marks must not substitute.
4. **Identical recipe, multiple codes:** keep both product rows if they are real re-releases; designate one **`oracleCanonicalProductId`** (or merge comps) — do not delete silently.
5. **Part `productCodes`:** treat as weak provenance (“seen in sets”), not as unique SKU ownership, until cleaned; do not auto-bind Oracle from part codes alone.
6. **Code conflicts** (part claims code whose product uses another blade): flag for seed hygiene; do not resolve in RIPBEYS mapper.
7. **Demoted X:** remain `assembled_without_product_seed` until a seed exists with matching combo — never bind to nearest official combo.

---

## G. Decisions requiring human / product-owner confirmation

1. **BX-01 vs BX-22** — which `productId` is Oracle-canonical for Dran Sword 3-60F? (or merge strategy)
2. **BX-04 vs BX-06** — same for Knight Shield 3-80N / Helm Knight
3. **BX-20** — Shark Edge vs Dran Dagger: correct product seed, part `productCodes` cleanup, and whether to add Dran Dagger 4-60R product
4. **26 demoted** — approve new `complete_loose` seeds (with real codes) vs leave unavailable
5. **Burst EN/JP layer pairs** — canonical part id per Bey (Valtryek vs Valkyrie, etc.)
6. **SKU preference** — confirm `complete_loose` as default Oracle target among starter/sealed/loose twins
7. **Dual-app / asset commit** — unchanged from migration status (not identity, but still open)

---

## H. Files that would need modification **after approval**

| Approval | Likely files (no edits in this stage) |
|----------|----------------------------------------|
| Oracle-canonical among duplicate recipes | `packages/catalog/data/seeds/products-x.json` and/or bridge attrs; possibly `ripbeys-asset-map.json` / `oracle-bridge.json` regen; Railway recomputes if product ids merge |
| BX-20 fix | `parts.json` (or curated parts source) for `x-blade-dran-dagger` / `x-blade-shark-edge` codes; optionally new row in `products-x.json`; map/bridge regen |
| New combo seeds for demoted X | `products-x.json` only (parts already exist); then Stage 1 map + oracle-bridge regen; **not** UI-first |
| Burst aliases | `aliases.json` / `curated-aliases.json` / mapper config; map regen |
| SKU preference rule | `scripts/build-ripbeys-asset-map.mjs`, `scripts/build-oracle-bridge.mjs` |

**Must not change for identity resolution:** Oracle math, matcher scoring internals (unless alias lists), ingest adapters, workers, Drizzle schema, RIPBEYS 3D assets, ModelViewer.

---

## Consistency verdict

| Area | Consistent? |
|------|-------------|
| Product rows’ internal recipes (spot-checked X assembled) | Largely yes |
| Unique (recipe → one product code) | **No** — BX-01/22, BX-04/06 |
| Unique (product code → one blade) via part `productCodes` | **No** — BX-20 and ~60 other part-code vs product-blade mismatches |
| RIPBEYS map vs seeds for the 14 Product Oracle listings | Yes (Stage 2 verified) |
| Demoted 26 vs existing products | Correctly **non**-matching at recipe level |

**Conclusion:** Expand Product Oracle only after owner decisions on §G items 1–3 at minimum; treat §G item 6 as a low-risk automation to clear many of the 55 Burst/SKU ambiguous rows without inventing identities.

---

*Audit harness (ephemeral): `scripts/_catalogue-identity-audit.mjs` + `scripts/_catalogue-audit-out.json` may be deleted; they are not catalogue truth.*

# Catalogue Repair Proposal (Stage 4)

**Date:** 2026-09-21  
**Scope:** Proposal only for three identity blockers. **No seeds, DB, Oracle, matcher, ingest, workers, frontend, assets, Railway, commit, or push.**

**Inputs:** `CATALOGUE_IDENTITY_AUDIT.md`, `MAPPING_REPORT.md`, `MIGRATION_STATUS.md`, `packages/catalog/data/seeds/products-x.json`, `packages/catalog/data/parts.json`, `packages/catalog/data/sources/beyparts.json`, `packages/catalog/data/ripbeys-asset-map.json`, `apps/web/src/consumer/data/oracle-bridge.json`.

---

## Current state (relevant slice)

| Metric | Value |
|--------|------:|
| RIPBEYS listings mapped | 578 |
| Product Oracle (live) | 14 |
| Part Oracle mappings | 105 |
| Unavailable | 459 |
| Map conflicts | 5 (all BX-20 / Dagger Dran family) |
| Ambiguous (map) | 101 (includes `bx-001`, `bx-013`) |

| Listing | Display | Map / bridge | Blocker |
|---------|---------|--------------|---------|
| `bx-001` | Dran Sword 3-60F | ambiguous / `oracleKind: none` | BX-01 vs BX-22 identical recipe |
| `bx-013` | Helm Knight 3-80N | ambiguous / `oracleKind: none` | BX-04 vs BX-06 identical recipe |
| `bx-002` | Dagger Dran 4-60R | conflict / `bx-20-catalog-split` | Part codes vs Shark Edge products |
| `bx-231` | Dagger Dran 4-70Q | conflict | Same split; **different combo** (4-70Q) |
| `bx-274`–`bx-276` | Bx20 Dagger Dran UI meshes | conflict | Same split; UI/part presentation |

**Hard rule carried forward:** never bind Dagger Dran listings to `prod-x-bx-20-*` (Shark Edge).

---

## 1. BX-20 / Dagger Dran

### 1.1 What the seeds actually say today

**Products (`products-x.json`) — exclusive BX-20 ownership is Shark Edge:**

| Product id | nameEn | productCodes | partIds | combo |
|------------|--------|--------------|---------|-------|
| `prod-x-bx-20-complete-loose` | Shark Edge (3-80F) | `["BX-20"]` | `x-blade-shark-edge`, `x-ratchet-3-80`, `x-bx-06-bit` | 3-80F |
| `prod-x-bx-20-complete-sealed` | Shark Edge (Sealed) | `["BX-20"]` | same | 3-80F |
| `prod-x-bx-20-starter` | Shark Edge Starter | `["BX-20"]` | same | 3-80F |

There is **no** `complete_loose` / sealed / starter product whose assembled recipe is Dran Dagger + 4-60 + Rush.  
`x-blade-dran-dagger` appears only inside multipack **contents** (`prod-x-ux-00-sealed`), not as a Dagger Oracle target.

**Parts (`parts.json`) — conflicting `productCodes` fields:**

| Part id | nameEn | `productCodes` (relevant) |
|---------|--------|---------------------------|
| `x-blade-dran-dagger` | Dran Dagger | includes **`BX-20`**, BX-31, UX-00, UX-18 |
| `x-blade-shark-edge` | Shark Edge | includes **`BX-20`**, BX-00, BX-14, BX-31, BX-48 |
| `x-bx-04-blade` | Knight Shield | includes **`BX-20`** (plus BX-04/06/…) |
| `x-ratchet-4-60` | 4-60 | includes `BX-20` |
| `x-bit-r` | Rush | includes `BX-20` |

**Exact conflict:**  
`productCodes` on **parts** treat `BX-20` as shared provenance across multiple blades; **product** rows treat `BX-20` as the sole Shark Edge SKU code. RIPBEYS UI/mesh naming (`Bx20 Dagger Dran…`) and map conflict notes follow the part/UI side for Dagger.

**Upstream source (`beyparts.json`) — both combos under BX-20 strings:**

- Shark Edge sources include `BX-20 SHARKEDGE3-80F`
- Dran Dagger sources include `BX-20 DRANDAGGER4-60R`
- Knight Shield sources include `BX-20 KNIGHTSHIELD5-80T`

That is consistent with **BX-20 as a multi-item / random-booster style pack code** in community seed provenance — not with “one code → one blade exclusively.”

### 1.2 Minimum data change (proposed — not applied)

| Step | Change | Why |
|------|--------|-----|
| A | **Keep** all three `prod-x-bx-20-*` rows as Shark Edge (id, name, recipe, `productCodes`) | Do not delete/overwrite Shark Edge without explicit approval |
| B | **Add** a new assembled product family for Dran Dagger 4-60R (see §1.3) | Enables Product Oracle for `bx-002` without binding to Shark Edge |
| C | **Optional hygiene:** annotate Shark Edge and/or Dagger parts/products that `BX-20` on parts is pack provenance, not exclusive SKU ownership | Stops future mappers from treating part codes as 1:1 product identity |
| D | **Do not** remove `BX-20` from Shark Edge **product** `productCodes` in this patch unless you approve a retag | Preserves existing matcher/ingest attachment surface for Shark Edge comps |

**Out of scope for this minimum patch:** inventing a new Takara primary code for Shark Edge; deleting Shark Edge; binding `bx-002` → `prod-x-bx-20-*`.

### 1.3 Safe canonical representation (recommended)

```
Shark Edge 3-80F  →  keep prod-x-bx-20-{complete-loose,complete-sealed,starter}
                     productCodes: ["BX-20"]  (unchanged unless you later retag)

Dran Dagger 4-60R →  NEW prod-x-dran-dagger-4-60r-{complete-loose[,sealed,starter]}
                     partIds: [x-blade-dran-dagger, x-ratchet-4-60, x-bit-r]
                     attrs.combo: "4-60R"
                     productCodes:  <<< REQUIRES YOUR CHOICE — see Approval Q1 >>>
```

Suggested new ids (presentation-safe; not derived from RIPBEYS `bx-002`):

- `prod-x-dran-dagger-4-60r-complete-loose`
- optionally sealed/starter twins for SKU parity

**Never** use Shark Edge product ids for Dagger listings. After seed + map regen, `bx-002` should resolve by **recipe match** to the new Dagger product, with conflict flag cleared.

### 1.4 Affected product IDs

| Id | Effect |
|----|--------|
| `prod-x-bx-20-complete-loose` / `-sealed` / `-starter` | **Unchanged** under recommended patch |
| New `prod-x-dran-dagger-4-60r-*` | **Created** |
| `prod-x-ux-00-sealed` | Unchanged (multipack contents still list dagger blade) |

### 1.5 Affected RIPBEYS listings

| Listing | After approved seed + map/bridge regen |
|---------|----------------------------------------|
| `bx-002` Dagger Dran 4-60R | Can become **confirmed Product Oracle** → new Dagger product (not Shark Edge) |
| `bx-231` Dagger Dran 4-70Q | **Not** fixed by 4-60R seed alone (different ratchet/bit); stays unavailable or needs separate seed |
| `bx-274`–`bx-276` UI meshes | Likely remain part/UI-only or conflict-cleared to part; Product Oracle only if treated as the same 4-60R assembly |
| Shark Edge listings already part- or product-scoped to `x-blade-shark-edge` / `prod-x-bx-20-*` | Unchanged |

### 1.6 Oracle consequences

- Existing marks/comps attached to `prod-x-bx-20-*` remain **Shark Edge** — correct if matched as Shark Edge; must not be shown on Dagger UI.
- New Dagger product starts with **empty** Product Oracle until Railway ingest/match produces comps for that `productId`.
- Part Oracle for `x-blade-dran-dagger` can remain available independently.
- Matcher: must match Dagger by name/recipe to the **new** product id; must not collapse BX-20 code alone onto Shark Edge for Dagger titles.

### 1.7 Risks

| Risk | Mitigation |
|------|------------|
| Giving new Dagger product `productCodes: ["BX-20"]` duplicates Shark Edge’s exclusive code | Prefer distinct productCodes policy (Approval Q1); match by recipe/name for RIPBEYS |
| Removing `BX-20` from Shark Edge products | **Not proposed**; would orphan or retarget existing comps — needs separate approval |
| Removing `BX-20` from `x-blade-dran-dagger.productCodes` | Optional; may hide real pack provenance; do only with Approval Q2 |
| Assuming RIPBEYS `Bx20*` UI name means Takara BX-20 exclusivity | Already forbidden by architecture rules |

---

## 2. BX-01 vs BX-22 — Dran Sword 3-60F

### 2.1 What the seeds say

Both families are full parallel SKUs with **identical** `partIds` and combo:

| Code | complete_loose | sealed | starter | partIds |
|------|----------------|--------|---------|---------|
| BX-01 | `prod-x-bx-01-complete-loose` | `…-01-complete-sealed` | `…-01-starter` | `x-bx-01-blade` + `x-bx-05-ratchet` + `x-bx-06-bit` |
| BX-22 | `prod-x-bx-22-complete-loose` | `…-22-complete-sealed` | `…-22-starter` | **identical** |

Blade part `x-bx-01-blade` lists both `BX-01` and `BX-22` in `productCodes`.

**beyparts.json:** both `BX-01 DRANSWORD3-60F` and `BX-22 DRANSWORD3-60F` appear as distinct sources for Dran Sword — evidence of **separate releases/SKUs**, not a single accidental duplicate row.

### 2.2 Minimum data change

**Do not delete either family.** Preserve distinct product ids.

Minimum repair for RIPBEYS Product Oracle is **not** a recipe rewrite; it is an **Oracle display / bridge canonical choice** among existing ids:

| Approach | Seed change? | Description |
|----------|--------------|-------------|
| **P1 (preferred minimum)** | Optional metadata only | Keep both products; add non-destructive link, e.g. `attrs.releaseTwinProductIds` / `attrs.sameRecipeAs`, **or** bridge-only `requiemProductId` after you pick which id RIPBEYS displays |
| **P2** | None on seeds | Map/bridge policy only: after Approval Q3, confirm `bx-001` → chosen `complete_loose` id |
| **P3 (not proposed)** | Destructive | Merge/delete one family or redirect all comps — **requires explicit approval**; not minimum |

**Forbidden:** auto-select BX-01 because RIPBEYS id is `bx-001` or because `01 < 22`.

### 2.3 Affected product IDs

All six Dran Sword BX-01/BX-22 ids remain. Under P1/P2, none are deleted. Optional attrs may be added to both `complete_loose` rows (and optionally sealed/starter).

### 2.4 Affected RIPBEYS listings

| Listing | Effect after Approval Q3 + map/bridge regen |
|---------|-----------------------------------------------|
| `bx-001` Dran Sword 3-60F | Can become **confirmed Product Oracle** → chosen twin’s `complete_loose` |
| `bx-202` Sword Dran 3-60 F | Already part-scoped / multi-candidate; may still be ambiguous if BX-17 (3-60FRE) remains in play — separate from this twin choice |

### 2.5 Oracle consequences

- Comps already keyed to `prod-x-bx-01-*` vs `prod-x-bx-22-*` may be **split** across twins.
- Displaying only one twin undercounts unless you later approve a **comp merge / redirect** policy (Railway tally recommended before any merge — out of scope for this proposal’s execution).
- Choosing a display product does **not** invent values; it only picks which existing `productId` mark to show.

### 2.6 Risks

| Risk | Notes |
|------|-------|
| Picking wrong display twin | Split-market undercount; reversible if both ids kept |
| Merging product ids without tally | Can double-count or destroy marks — **do not** without approval + Railway counts |
| Treating twins as seed error | Contradicted by beyparts dual sources |

---

## 3. BX-04 vs BX-06 — Knight Shield 3-80N

### 3.1 What the seeds say

Same pattern as §2:

| Code | complete_loose | sealed | starter | partIds |
|------|----------------|--------|---------|---------|
| BX-04 | `prod-x-bx-04-complete-loose` | `…-04-complete-sealed` | `…-04-starter` | `x-bx-04-blade` + `x-ratchet-3-80` + `x-bit-n` |
| BX-06 | `prod-x-bx-06-complete-loose` | `…-06-complete-sealed` | `…-06-starter` | **identical** |

Blade `x-bx-04-blade` lists both `BX-04` and `BX-06` (and `BX-20` as pack provenance).

**beyparts.json:** both `BX-04 KNIGHTSHIELD3-80N` and `BX-06 KNIGHTSHIELD3-80N` — again **separate release evidence**.

### 3.2 Minimum data change

Same as §2: **preserve both**; resolve RIPBEYS via owner-picked display `complete_loose` (bridge and/or optional twin metadata). No numeric preference `04` vs `06`.

### 3.3 Affected product IDs / listings / Oracle / risks

| | |
|--|--|
| Product ids | All six BX-04/BX-06 Knight Shield rows preserved |
| RIPBEYS | `bx-013` Helm Knight 3-80N → can become Product Oracle after Approval Q4 |
| Note | `bx-203` Helm Knight 5-80T is a **different combo** — not this twin |
| Oracle | Same split-mark caveat as Dran Sword twins |
| Risks | Same as §2.6 |

---

## Proposed changes summary (still not applied)

| Conflict | Proposed action | Deletes Shark Edge / twins? |
|----------|-----------------|----------------------------|
| BX-20 / Dagger | Add Dagger 4-60R product family; keep Shark Edge `prod-x-bx-20-*` | **No** |
| BX-01 / BX-22 | Keep both; pick display Oracle id for `bx-001` | **No** |
| BX-04 / BX-06 | Keep both; pick display Oracle id for `bx-013` | **No** |

---

## Exact seed files that would change (after approval)

| File | Likely edits |
|------|----------------|
| `packages/catalog/data/seeds/products-x.json` | **Add** Dran Dagger 4-60R product row(s); optionally add twin-link `attrs` on BX-01/22 and BX-04/06 rows |
| `packages/catalog/data/parts.json` | **Optional only:** annotate or adjust `productCodes` for `x-blade-dran-dagger` / Shark Edge / Knight Shield per Approval Q2 — **not required** to unblock `bx-002` if new product matches by recipe |
| `packages/catalog/data/products.json` | Only if your build pipeline regenerates the merged products blob from seeds (downstream of `products-x.json`) |

**Not in this repair’s seed scope:** Burst seeds, matcher source, ingest, workers, Drizzle schema, RIPBEYS UI, assets.

**Downstream regenerations (after seed approval, separate step):**

- `packages/catalog/data/ripbeys-asset-map.json`
- `apps/web/src/consumer/data/oracle-bridge.json`
- Stage 1/2 validation scripts

---

## Exact fields that would change

### New Dran Dagger product (example shape — ids subject to Approval Q1)

```json
{
  "id": "prod-x-dran-dagger-4-60r-complete-loose",
  "generation": "x",
  "skuType": "complete_loose",
  "nameEn": "Dran Dagger (4-60R)",
  "productCodes": ["<<< APPROVAL Q1 >>>"],
  "attrs": { "combo": "4-60R", "line": "BX", "recipeKind": "assembled" },
  "partIds": ["x-blade-dran-dagger", "x-ratchet-4-60", "x-bit-r"]
}
```

### Optional twin metadata (BX-01/22 and BX-04/06)

```json
"attrs": {
  "combo": "3-60F",
  "line": "BX",
  "recipeKind": "assembled",
  "sameRecipeProductIds": ["prod-x-bx-01-complete-loose", "prod-x-bx-22-complete-loose"],
  "oracleDisplayPreferred": false
}
```

(Exact attribute names can follow existing catalog conventions when implementing.)

### Optional part field (Approval Q2 only)

- `x-blade-dran-dagger.productCodes` — remove or retain `BX-20`
- Do **not** change Shark Edge product `productCodes` without separate approval

### Unchanged fields (recommended)

- All `prod-x-bx-20-*` `id`, `nameEn`, `partIds`, `productCodes`, `skuType`
- All BX-01/22 and BX-04/06 product `id` and recipes

---

## Oracle impact (portfolio)

| Change | Product Oracle listings | Notes |
|--------|------------------------:|-------|
| Today | 14 | Unchanged until implement |
| After Dagger seed + confirm `bx-002` | +1 (→ 15) | Empty mark until comps exist |
| After twin picks for `bx-001` + `bx-013` | +2 (→ 16 or 17) | Uses existing product ids; marks may already exist on Railway for those ids |
| `bx-231` 4-70Q | 0 | Needs separate seed decision later |

No Oracle **math** changes. No fabricated values.

---

## Risks (global)

1. **Code collision** if Dagger and Shark Edge both claim exclusive `BX-20` on product rows.  
2. **Mark fragmentation** across release twins if display picks one id while comps live on the other.  
3. **Scope creep** into demoted-26 seeds or Burst aliases — intentionally excluded here.  
4. Implementing without regenerating map/bridge leaves RIPBEYS still conflict/ambiguous.

---

## Items still requiring your approval

| ID | Decision | Options |
|----|----------|---------|
| **Q1** | `productCodes` for new Dran Dagger 4-60R product | (a) empty / non-BX code pending research; (b) shared provenance note without exclusive `["BX-20"]`; (c) you supply confirmed alternate Takara code; (d) allow `["BX-20"]` on Dagger **and** keep Shark Edge on `BX-20` (dual product ownership — matcher impact) |
| **Q2** | Part hygiene for `x-blade-dran-dagger.productCodes` | Keep `BX-20` as pack provenance **or** remove `BX-20` from Dagger part only |
| **Q3** | Oracle display product for Dran Sword 3-60F | `prod-x-bx-01-complete-loose` **or** `prod-x-bx-22-complete-loose` **or** defer until Railway comps tally (no auto numeric pick) |
| **Q4** | Oracle display product for Knight Shield 3-80N | `prod-x-bx-04-complete-loose` **or** `prod-x-bx-06-complete-loose` **or** defer for tally |
| **Q5** | Shark Edge `prod-x-bx-20-*` | Confirm **retain as-is** (recommended) vs later retag/rename of BX-20 ownership |
| **Q6** | Sealed/starter twins for new Dagger product | loose-only minimum vs full loose/sealed/starter trio |
| **Q7** | Comp merge across twins | Never / later after Railway tally only |

---

## Recommended approval order

1. **Q5** retain Shark Edge products.  
2. **Q1 + Q6** authorize Dagger 4-60R seed shape.  
3. **Q2** optional part cleanup.  
4. **Q3 + Q4** twin display picks (or “defer + tally”).  
5. Only then authorize an implementation stage to edit seeds and regenerate map/bridge.

---

## Stop

This document is the Stage 4 deliverable. **No catalogue data was modified.** Next step is your answers to Q1–Q7 (or a subset) before any seed patch.

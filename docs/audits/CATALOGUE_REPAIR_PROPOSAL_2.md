# Catalogue Repair Proposal 2 (Stage 4B)

**Date:** 2026-09-21  
**Scope:** Evidence pass for `bx-001`, `bx-013`, `bx-231` only.  
**Rule:** Implement only if catalogue evidence makes the bind **unambiguous**. Otherwise leave data untouched.

**Post-4A baseline:** Product Oracle 15 · Part Oracle 105 · Unavailable 458 · Map conflicts 4.

**Outcome of this stage:** **No seed, map, or bridge mutations.** All three cases remain unresolved pending owner confirmation. See recommendations below.

---

## Summary verdict

| Listing | Unambiguous bind possible? | Action taken |
|---------|----------------------------|--------------|
| `bx-001` Dran Sword 3-60F | **No** — two identical-recipe SKUs | Left untouched |
| `bx-013` Helm Knight 3-80N | **No** — two identical-recipe SKUs | Left untouched |
| `bx-231` Dagger Dran 4-70Q | **No** — no existing product; official source lists **4-70P**, not 4-70Q | Left untouched; seed **not** created |

---

## 1. `bx-001` — Dran Sword 3-60F

### Current mapping

| Field | Value |
|-------|-------|
| Map status | `ambiguous` |
| Bridge | `oracleKind: none`, `reason: ambiguous_identity` |
| Resolved parts | `x-bx-01-blade` + `x-bx-05-ratchet` + `x-bx-06-bit` (combo `3-60F`) |
| Product id | `null` |

### Candidate product IDs

| Product id | Codes | nameEn | skuType | partIds | combo |
|------------|-------|--------|---------|---------|-------|
| `prod-x-bx-01-complete-loose` | `BX-01` | Dran Sword (3-60F) | complete_loose | identical trio | 3-60F |
| `prod-x-bx-22-complete-loose` | `BX-22` | Dran Sword (3-60F) | complete_loose | identical trio | 3-60F |

Also present (not candidates for this combo): BX-01/22 sealed & starter twins; `prod-x-bx-17-*` Dran Sword **3-60FRE** (different bit — Ball).

### Exact evidence

| Source | Finding |
|--------|---------|
| `products-x.json` | Both complete_loose rows share the same `nameEn`, `attrs.combo`, and `partIds` |
| Blade `x-bx-01-blade.productCodes` | Includes both `BX-01` and `BX-22` |
| `beyparts.json` Dran Sword sources | Both `BX-01 DRANSWORD3-60F` and `BX-22 DRANSWORD3-60F` as distinct lines — supports **two real releases**, not a seed typo |
| RIPBEYS | Display name is recipe-only (“Dran Sword 3-60F”); no Takara code, packaging, or reissue cue |
| Map note | Explicitly warns not to treat `bx-001` number as BX-01 |

No release/SKU metadata in seeds (e.g. reissue flag, date, colorway) distinguishes BX-01 from BX-22 for Oracle display.

### Recommended action

**Leave unresolved.** Do not bind, merge, or delete either product family. Do not pick a winner by numeric BX order or by RIPBEYS id `bx-001`.

Owner options later (out of scope for auto-implement):

1. Designate display Oracle product after Railway comps tally  
2. Add non-destructive twin metadata + explicit preferred id  
3. Keep both forever and accept no Product Oracle on `bx-001`

### Expected bridge / Oracle impact if left as-is

None. Product Oracle stays **15**.

### Confidence

**High** that existing catalogue evidence is insufficient for a safe single-product bind.

### Files that would change (only after owner pick)

| File | Change |
|------|--------|
| `ripbeys-asset-map.json` / `oracle-bridge.json` | Regen after bridge override or twin-preference rule |
| Optionally `products-x.json` | Twin-link `attrs` only — **not** required to display |

---

## 2. `bx-013` — Helm Knight 3-80N

### Current mapping

| Field | Value |
|-------|-------|
| Map status | `ambiguous` |
| Bridge | `oracleKind: none`, `reason: ambiguous_identity` |
| Resolved parts | `x-bx-04-blade` + `x-ratchet-3-80` + `x-bit-n` (combo `3-80N`) |
| Product id | `null` |
| Name note | RIPBEYS “Helm Knight” ↔ Requiem “Knight Shield” (EN alias; parts already resolve to Knight Shield blade) |

### Candidate product IDs

| Product id | Codes | nameEn | skuType | partIds | combo |
|------------|-------|--------|---------|---------|-------|
| `prod-x-bx-04-complete-loose` | `BX-04` | Knight Shield (3-80N) | complete_loose | identical trio | 3-80N |
| `prod-x-bx-06-complete-loose` | `BX-06` | Knight Shield (3-80N) | complete_loose | identical trio | 3-80N |

Sealed/starter twins exist for both codes. Not candidates for auto-merge with loose.

### Exact evidence

| Source | Finding |
|--------|---------|
| `products-x.json` | Identical `nameEn`, combo, and `partIds` under BX-04 and BX-06 |
| Blade `x-bx-04-blade.productCodes` | Includes both `BX-04` and `BX-06` |
| `beyparts.json` Knight Shield | Both `BX-04 KNIGHTSHIELD3-80N` and `BX-06 KNIGHTSHIELD3-80N` — dual release evidence |
| RIPBEYS | “Helm Knight 3-80N” — no code distinguishing 04 vs 06 |
| Map advisory | `bx-013` must not be treated as BX-13 (Knight Lance) |

### Recommended action

**Leave unresolved.** Same policy as §1: keep both SKU families; no numeric or presentation-id winner.

### Expected bridge / Oracle impact if left as-is

None.

### Confidence

**High** that evidence is insufficient for an unambiguous bind.

### Files that would change (after owner pick)

Same pattern as §1 (`map` / `bridge`; optional twin `attrs` on `products-x.json`).

---

## 3. `bx-231` — Dagger Dran 4-70Q

### Current mapping

| Field | Value |
|-------|-------|
| Map status | `conflict` (`bx-20-catalog-split`) |
| Bridge | `oracleKind: none`; part id `x-blade-dran-dagger` recorded |
| Resolved parts | `x-blade-dran-dagger` + `x-ratchet-4-70` + `x-bit-q` (combo `4-70Q`) |
| Product id | `null` |

Conflict reason: no dedicated complete_loose matches this trio; must not bind to Shark Edge `prod-x-bx-20-*`.

### Candidate product IDs (existing)

| Product id | Why considered | Exact match? |
|------------|----------------|--------------|
| `prod-x-dran-dagger-4-60r-complete-loose` | Same blade; Stage 4A | **No** — combo is 4-60R |
| `prod-x-bx-20-*` Shark Edge | Shared BX-20 pack code on parts | **No** — wrong blade/combo; **forbidden** |
| `prod-x-bx-31-*` Tyranno Beat (4-70Q) | Same ratchet+bit combo string `4-70Q` | **No** — blade is `x-blade-tyranno-beat`, not Dagger |
| Any `complete_loose` with dagger+4-70+Q | Search of `products-x.json` | **None** |

### Exact evidence (critical)

| Source | Finding |
|--------|---------|
| `beyparts.json` Dran Dagger sources | `BX-20 DRANDAGGER4-60R`, `BX-31 DRANDAGGER4-70P`, UX variants — **no `DRANDAGGER4-70Q` line** |
| `beyparts.json` / products BX-31 | Official **4-70Q** under BX-31 is **Tyranno Beat**, not Dran Dagger |
| Parts | `x-ratchet-4-70` and `x-bit-q` exist; recipe is physically representable |
| RIPBEYS | Listing + model name `x_dagger_dran_4_70q.fbx` assert **4-70Q** |

Conclusion: RIPBEYS asserts a combo that **does not appear** in current Requiem/beyparts official lines for Dran Dagger. Closest official Dagger-on-4-70 line is **4-70P** (Point), not Quake/Q.

### Recommended action

**Do not create a product seed in Stage 4B.** Evidence is insufficient / contradictory for a canonical Takara SKU.

**Do not** bind `bx-231` to Tyranno Beat or Shark Edge.

**Minimum seed proposal (for later approval only — not implemented):**

```json
{
  "id": "prod-x-dran-dagger-4-70q-complete-loose",
  "generation": "x",
  "skuType": "complete_loose",
  "nameEn": "Dran Dagger (4-70Q)",
  "productCodes": ["<<< OWNER: none vs custom vs confirmed code >>>"],
  "attrs": {
    "combo": "4-70Q",
    "line": "BX",
    "recipeKind": "assembled",
    "note": "RIPBEYS custom/alt combo; beyparts lists BX-31 Dran Dagger as 4-70P, not 4-70Q."
  },
  "partIds": ["x-blade-dran-dagger", "x-ratchet-4-70", "x-bit-q"]
}
```

**Alternate owner checks before any seed:**

1. Confirm whether RIPBEYS `4-70Q` is a typo for official **4-70P** → then seed/bind `4-70P` under BX-31 (or new id with `BX-31`), not Q.  
2. Confirm intentional custom/complete-loose-only combo → seed with empty/non-Takara code policy.  
3. Until then: keep conflict / withhold Product Oracle; part identity may stay on `x-blade-dran-dagger` only.

### Expected bridge / Oracle impact if left as-is

None. Conflicts remain **4**. Product Oracle stays **15**.

### Confidence

| Claim | Confidence |
|-------|------------|
| No existing product is the exact 4-70Q Dagger assembly | **High** |
| Official beyparts Dagger-on-4-70 is **4-70P**, not Q | **High** |
| Whether RIPBEYS listing should be corrected to 4-70P | **Low–medium** — needs human/product confirmation |
| Safe to invent `4-70Q` product now | **Reject** |

### Files that would change (only after approval)

| File | Change |
|------|--------|
| `packages/catalog/data/seeds/products-x.json` | Add Dagger 4-70Q (or 4-70P) complete_loose |
| Map builder / `ripbeys-asset-map.json` / `oracle-bridge.json` | Regen so `bx-231` can confirm if recipe matches |
| `parts.json` | **Not** required for recipe (parts already exist) |

---

## Implementation decision (Stage 4B)

Per instruction (“Only implement a change if the existing catalogue evidence makes it unambiguous”):

- **No** product rows added or edited  
- **No** part `productCodes` changes  
- **No** map/bridge regen required  
- **No** twin winners selected  

Deliverable is this proposal only.

---

## Expected portfolio if all three were later resolved (illustrative)

| Resolution | Product Oracle Δ |
|------------|-----------------:|
| `bx-001` bind to one twin | +1 |
| `bx-013` bind to one twin | +1 |
| `bx-231` new matching seed + confirm | +1 |
| **Theoretical max from these three** | **+3 → 18** |

Not applied in 4B.

---

## Items still requiring your approval

1. **Q-twin-sword:** Display Oracle for Dran Sword 3-60F → `prod-x-bx-01-complete-loose` vs `prod-x-bx-22-complete-loose` vs defer + Railway tally  
2. **Q-twin-shield:** Display Oracle for Knight Shield 3-80N → `prod-x-bx-04-complete-loose` vs `prod-x-bx-06-complete-loose` vs defer  
3. **Q-231-intent:** Is RIPBEYS `4-70Q` a typo for official **4-70P**, a custom combo, or something else?  
4. **Q-231-code:** If seeding, what `productCodes` (empty / BX-31 / other)? Never Shark Edge `prod-x-bx-20-*`.

---

## Validation

- Re-ran `node scripts/validate-ripbeys-assets.mjs` after evidence inspection (no data mutations): map still OK; `bx-002` remains dedicated Dagger 4-60R; `bx-001`/`bx-013` still unresolved by design.  
- Full `@beyoracle/catalog` vitest/`products:validate` not run (local `node_modules` absent) — same environment constraint as Stage 4A.

---

## Stop

Stage 4B ends here: proposal written, **zero catalogue mutations**.

# RIPBEYS → Requiem mapping report (Stage 1)

**Generated:** 2026-09-24T16:17:04.102Z  
**Artifact:** `packages/catalog/data/ripbeys-asset-map.json`  
**Scope:** Local catalogue/asset bridge only. No seed changes. No Oracle changes.

## Summary

| Metric | Count |
|--------|------:|
| Total listings | 578 |
| Confirmed | 159 |
| — with product id | 26 |
| — part-only (no unique product) | 133 |
| Ambiguous | 100 |
| Unmatched | 315 |
| Conflict | 4 |
| Assembled model file missing on disk | 0 |
| Poster path resolved | 578 |

## Matching rules used

- Evidence: display name, series, parsed X combo (ratchet + bit), Requiem part `nameEn`, part `productCodes`, product `partIds` / `skuType`.
- **Never** used numeric similarity (`bx-002` ↛ `BX-02`).
- Prefer unique `complete_loose` product whose `partIds` contain the resolved blade+ratchet+bit trio.
- If multiple products share the same recipe (e.g. BX-01 vs BX-22 Dran Sword 3-60F) → **ambiguous**.
- If blade identity is clear but no unique product seed exists → **confirmed** part-only (`requiemProductId: null`).
- Known BX-20 split: dedicated `prod-x-dran-dagger-4-60r-complete-loose` when recipe matches; **never** bind Dagger to Shark Edge `prod-x-bx-20-*`.

## Important catalogue conflicts

### C1 — BX-20 / Dran Dagger vs Shark Edge

| Source | Meaning |
|--------|---------|
| RIPBEYS `bx-002` | Dagger Dran 4-60R → `prod-x-dran-dagger-4-60r-complete-loose` when recipe matches |
| Part `x-blade-dran-dagger` | `productCodes` still include `BX-20` (unchanged; pack provenance) |
| Products `prod-x-bx-20-*` | **Shark Edge (3-80F)** — unchanged |
| Other Dagger combos (e.g. 4-70Q) | Remain **conflict** until a matching product seed exists |

**Action taken:** Added dedicated Dran Dagger 4-60R complete_loose. Confirmed `bx-002` to that product. Never assign Shark Edge Oracle to Dagger listings.

### C2 — Presentation id ≠ Takara code (advisory, not auto-conflict)

`bx-NNN` listing ids frequently disagree with Takara `BX-NN` families. The map records advisories and matches by name/parts only. Example: `bx-004` Cobalt Dragoon → `prod-x-bx-34-*`, never `BX-04`.

### C3 — Duplicate recipe products

`Dran Sword 3-60F` exists as both `prod-x-bx-01-complete-loose` and `prod-x-bx-22-complete-loose` (same parts). Listings matching that recipe are **ambiguous** until a canonical Oracle product is chosen.

## Evidence examples (confirmed with product)

- **bx-002** “Dagger Dran 4-60R” → `prod-x-dran-dagger-4-60r-complete-loose` via parts [x-blade-dran-dagger, x-ratchet-4-60, x-bit-r] (combo 4-60R)
- **bx-003** “Soar Phoenix 9-60GF” → `prod-x-bx-23-complete-loose` via parts [x-blade-phoenix-wing, x-ratchet-9-60, x-bit-gf] (combo 9-60GF)
- **bx-004** “Cobalt Dragoon 2-60C” → `prod-x-bx-34-complete-loose` via parts [x-blade-cobalt-dragoon, x-ratchet-2-60, x-bit-c] (combo 2-60C)
- **bx-005** “Tail Viper 5-80O” → `prod-x-bx-16-complete-loose` via parts [x-blade-viper-tail, x-ratchet-5-80, x-bit-o] (combo 5-80O)
- **bx-006** “Horn Rhino 3-80S” → `prod-x-bx-19-complete-loose` via parts [x-blade-rhino-horn, x-ratchet-3-80, x-bit-s] (combo 3-80S)
- **bx-008** “Reaper Incendio T4-70K” → `prod-x-hells-reaper-t4-70k-complete-loose` via parts [x-blade-reaper, x-ratchet-4-70, x-bit-k] (combo T4-70K)
- **bx-009** “Arc Wizard R4-55LO” → `prod-x-cx-02-complete-loose` via parts [x-blade-arc, x-ratchet-4-55, x-bit-wizard] (combo R4-55LO)
- **bx-010** “Dark Perseus B6-80W” → `prod-x-cx-03-complete-loose` via parts [x-blade-dark, x-ratchet-6-80, x-bit-perseus] (combo B6-80W)

## Evidence examples (confirmed part-only)

- **bx-007** “Courage Dran S6-60V” → parts [x-blade-dran-buster, x-ratchet-6-60, x-bit-v] — Blade/parts identified; no unique complete_loose product for this combo (product seed may be missing).
- **bx-011** “Keel Shark 3-60LF” → parts [x-blade-shark-edge, x-bx-05-ratchet, x-bit-lf] — Blade/parts identified; no unique complete_loose product for this combo (product seed may be missing).
- **bx-012** “Yell Kong 3-60GB” → parts [x-blade-yell-kong, x-bx-05-ratchet, x-bit-gb] — Blade/parts identified; no unique complete_loose product for this combo (product seed may be missing).
- **bx-014** “Scythe Incendio 4-60T” → parts [x-bx-03-blade, x-ratchet-4-60, x-bit-t] — Blade/parts identified; no unique complete_loose product for this combo (product seed may be missing).
- **bx-016** “Talon Ptera 3-80B” → parts [x-blade-ptera-swing, x-ratchet-3-80, x-bx-07-bit] — Advisory: bx-016 must NOT be treated as BX-16 (Viper Tail (5-80O)); identity uses name/parts only.

## Conflict listings

- **bx-231** Dagger Dran 4-70Q: Dagger Dran listing has no matching dedicated complete_loose product (or combo differs). Do not bind to prod-x-bx-20-* Shark Edge. Part x-blade-dran-dagger may still list BX-20 as pack provenance.
- **bx-274** Bx20 Dagger Dran 4-60R-BIT UI: Dagger Dran listing has no matching dedicated complete_loose product (or combo differs). Do not bind to prod-x-bx-20-* Shark Edge. Part x-blade-dran-dagger may still list BX-20 as pack provenance.
- **bx-275** Bx20 Dagger Dran 4-60R: Dagger Dran listing has no matching dedicated complete_loose product (or combo differs). Do not bind to prod-x-bx-20-* Shark Edge. Part x-blade-dran-dagger may still list BX-20 as pack provenance.
- **bx-276** Bx20 Dagger Dran 4-60R-RATCHET UI: Dagger Dran listing has no matching dedicated complete_loose product (or combo differs). Do not bind to prod-x-bx-20-* Shark Edge. Part x-blade-dran-dagger may still list BX-20 as pack provenance.

## Ambiguous (sample, first 25)

- **bx-001** Dran Sword 3-60F → candidates: prod-x-bx-01-complete-loose, prod-x-bx-22-complete-loose
- **bx-013** Helm Knight 3-80N → candidates: prod-x-bx-04-complete-loose, prod-x-bx-06-complete-loose
- **bb-114** Epic Evipero → candidates: burst-layer-epic-evipero-e2, burst-layer-evipero
- **bb-129** Shield Kerbeus K5 → candidates: burst-layer-kerbeus, prod-burst-b-03-complete-loose, prod-burst-b-03-sealed, prod-burst-b-03-starter
- **bb-138** Lord Spryzen → candidates: burst-layer-spriggan, burst-layer-spryzen, prod-burst-b-11-complete-loose, prod-burst-b-11-sealed
- **bb-140** Spryzen Requiem S5 → candidates: burst-layer-spriggan, burst-layer-spriggan-requiem, burst-layer-spryzen, burst-layer-spryzen-requiem-s3
- **bb-141** World Spryzen S6 → candidates: burst-layer-spriggan, burst-layer-spryzen, prod-burst-b-11-complete-loose, prod-burst-b-11-sealed
- **bb-142** Brave Valtryek → candidates: burst-layer-valkyrie, burst-layer-valtryek
- **bb-144** Sword Valtryek → candidates: burst-driver-sword, burst-layer-valkyrie, burst-layer-valtryek
- **bb-145** Union Valtryek V5 → candidates: burst-layer-valkyrie, burst-layer-valtryek
- **bb-146** Spear Valtryek V6 → candidates: burst-layer-valkyrie, burst-layer-valtryek
- **bb-147** Wyvern 2 → candidates: burst-layer-wyvern, prod-burst-b-07-complete-loose, prod-burst-b-07-sealed, prod-burst-b-07-starter
- **bb-148** Wyvern W6 → candidates: burst-layer-wyvern, prod-burst-b-07-complete-loose, prod-burst-b-07-sealed, prod-burst-b-07-starter
- **bb-204** Achilles A4 → candidates: burst-layer-turbo-achilles-a4, burst-layer-z-achilles-a4
- **bb-238** Dranzer F Crystal → candidates: metal-metal-wheel-crystal, prod-plastic-bb-06f-starter, prod-plastic-bb-06f-complete-loose, prod-plastic-bb-06f-complete-sealed
- **bb-239** Dranzer F → candidates: burst-layer-dranzer-flame, prod-plastic-bb-06f-starter, prod-plastic-bb-06f-complete-loose, prod-plastic-bb-06f-complete-sealed
- **bb-245** Evo Valtryek → candidates: burst-layer-valkyrie, burst-layer-valtryek
- **bb-201** Dead Phoenix P4Geo → candidates: burst-layer-dead-phoenix, prod-burst-b-131-complete-loose, prod-burst-b-131-sealed, prod-burst-b-131-starter
- **bb-218** Kerbeus K4Gamestop → candidates: burst-layer-kerbeus, prod-burst-b-03-complete-loose, prod-burst-b-03-sealed, prod-burst-b-03-starter
- **bb-294** Kerbeus K4 → candidates: burst-layer-guardian-kerbeus-k4, burst-layer-hazard-kerbeus-k4, burst-layer-kerbeus, prod-burst-b-03-complete-loose
- **bb-220** Kerbeus K4Geo → candidates: burst-layer-kerbeus, prod-burst-b-03-complete-loose, prod-burst-b-03-sealed, prod-burst-b-03-starter
- **bb-295** Kerbeus K5Master → candidates: burst-layer-kerbeus, prod-burst-b-03-complete-loose, prod-burst-b-03-sealed, prod-burst-b-03-starter
- **bb-296** Kerbeus K8 → candidates: burst-layer-kerbeus, prod-burst-b-03-complete-loose, prod-burst-b-03-sealed, prod-burst-b-03-starter
- **bb-297** Kerbeus K8Geo → candidates: burst-layer-kerbeus, prod-burst-b-03-complete-loose, prod-burst-b-03-sealed, prod-burst-b-03-starter
- **bb-298** Kiser Kerbeus 2 → candidates: burst-layer-kerbeus, prod-burst-b-03-complete-loose, prod-burst-b-03-sealed, prod-burst-b-03-starter

## Unmatched (why)

Most unmatched entries are Burst game meshes / alternate names with no safe Requiem part or product hit, plus arenas. Do not invent identities.

Count: **315**

## Missing assets

Assembled model missing: **0**  
(Texture AO/decal gaps are listed per-entry under `asset.missing` in the JSON; shared AO files are referenced, not duplicated.)

## Decisions required before Stage 2 (Oracle UI)

1. **Dual-app layout** — keep `apps/web` + `apps/ripbeys`? (recommended)
2. **Dagger Dran / BX-20** — part-only Oracle vs new product seed (do not use Shark Edge)
3. **Duplicate recipes** (e.g. BX-01 vs BX-22 Dran Sword) — which product id is canonical for Oracle?
4. **Asset commit strategy** — LFS / as-is / gitignore for ~1.5 GB vault

## Files

- `packages/catalog/data/ripbeys-asset-map.json` — clean map
- `packages/catalog/data/ripbeys-asset-map.draft.json` — earlier draft (kept)
- `scripts/build-ripbeys-asset-map.mjs` — regenerator
- `scripts/validate-ripbeys-assets.mjs` — validation

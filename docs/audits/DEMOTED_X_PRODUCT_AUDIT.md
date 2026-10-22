# Demoted X Product Audit (Stage 5)

**Date:** 2026-09-21  
**Scope:** Read-only audit of the 26 bridge entries with `reason = assembled_without_product_seed`.  
**No** seed, map, bridge, frontend, Oracle, matcher, DB, Railway, commit, or push changes.

**Sources:** `oracle-bridge.json` demotion list, `ripbeys-asset-map.json`, `products-x.json`, `parts.json`, `beyparts.json`, Stage 3 `CATALOGUE_IDENTITY_AUDIT.md`.

**Post-4A/4B context:** Dagger 4-60R product added; `bx-001`/`bx-013` twins still ambiguous; `bx-231` must not be invented as 4-70Q. None of those listings are in this demoted-26 set — Stage 4A/4B did **not** create an exact recipe match for any demoted row.

---

## Classification legend

| Code | Meaning |
|------|---------|
| **A** | Safe existing product bind (exact `complete_loose` recipe) |
| **B** | Requires new product seed (no exact recipe; blade/parts exist) |
| **C** | Existing product for same blade but **different** combo — do not bind |
| **D** | Insufficient evidence for a canonical product seed |
| **E** | Known catalogue conflict (e.g. identical-recipe twins) |

Rules applied: no numeric BX inference; part match ≠ product match; no typo→product invention.

---

## Totals

| Class | Count | Stage 3 prior (approx.) | Notes after 4A/4B |
|-------|------:|-------------------------|-------------------|
| **A** | **0** | 0 | Still no exact binds |
| **B** | **16** | 17 “needs new seed” | Yell Kong moved **B→D** |
| **C** | **9** | 9 “same blade wrong combo” | Unchanged set |
| **D** | **1** | (was lumped into B) | `bx-012` Yell Kong |
| **E** | **0** | 0 | No twin-recipe demotions |
| **Total** | **26** | 26 | |

**Verdict vs Stage 3:** Prior “17 new seeds / 9 wrong combo” still holds in spirit. Refined to **16 B + 1 D + 9 C**. Stage 4A/4B discoveries did not unlock any **A** binds among the 26.

---

## Full table (26)

| RIPBEYS ID | Listing name | Combo | Requiem part IDs | Existing product candidates | Class | Evidence | Proposed next action | Conf. |
|------------|--------------|-------|------------------|----------------------------|-------|----------|----------------------|-------|
| `bx-003` | Soar Phoenix 9-60GF | 9-60GF | `x-blade-phoenix-wing`, `x-ratchet-9-60`, `x-bit-gf` | None exact. | **B** | beyparts: `BX-23 PHOENIXWING9-60GF`, `BX-00 …9-60GF` | Propose `complete_loose` with confirmed code (prefer BX-23 / policy for BX-00) | med–high |
| `bx-005` | Tail Viper 5-80O | 5-80O | `x-blade-viper-tail`, `x-ratchet-5-80`, `x-bit-o` | None exact. | **B** | beyparts: `BX-16 VIPERTAIL5-80O` | New seed under **BX-16** (assembled), not multipack-only | high |
| `bx-006` | Horn Rhino 3-80S | 3-80S | `x-blade-rhino-horn`, `x-ratchet-3-80`, `x-bit-s` | None exact. | **B** | beyparts: `BX-19 RHINOHORN3-80S` | New seed under **BX-19** | high |
| `bx-007` | Courage Dran S6-60V | S6-60V | `x-blade-dran-buster`, `x-ratchet-6-60`, `x-bit-v` | `prod-x-ux-01-complete-loose` Dran Buster **1-60A** | **C** | Same blade; official sources list 1-60A / other combos — **no** S6-60V | Do **not** bind UX-01; seed only if official S6-60V confirmed (absent in beyparts) | high (no-bind) |
| `bx-008` | Reaper Incendio T4-70K | T4-70K | `x-blade-reaper`, `x-ratchet-4-70`, `x-bit-k` | None exact. | **B** | beyparts: `CX-05 HELLSREAPERT4-70K` | New seed under **CX-05** (confirm CX vs BX line attrs) | high |
| `bx-011` | Keel Shark 3-60LF | 3-60LF | `x-blade-shark-edge`, `x-bx-05-ratchet`, `x-bit-lf` | `prod-x-bx-20-*` Shark Edge **3-80F** only | **C** | beyparts: `BX-14 SHARKEDGE3-60LF`; must **not** bind BX-20 3-80F | New seed for Shark Edge **3-60LF** (e.g. BX-14); never `prod-x-bx-20-*` | high |
| `bx-012` | Yell Kong 3-60GB | 3-60GB | `x-blade-yell-kong`, `x-bx-05-ratchet`, `x-bit-gb` | None. | **D** | Part exists; beyparts blade has **image** `Yell_Kong_3-60GB.jpeg` but **no `source[]` product codes**; part `productCodes` is only name token | Gather Takara/Hasbro product code before any seed | med |
| `bx-014` | Scythe Incendio 4-60T | 4-60T | `x-bx-03-blade`, `x-ratchet-4-60`, `x-bit-t` | `prod-x-bx-03-*` Hells Scythe **4-80B**; same combo on **Wizard Arrow** `prod-x-bx-02-*` | **C** | beyparts: `BX-02 HELLSSCYTHE4-60T` / `BX-00 …4-60T` but Requiem **BX-02** product is Wizard Arrow 4-60T — code collision | Do not bind BX-03 or BX-02 Wizard; new Hells Scythe 4-60T seed needs **owner code choice** (not auto BX-02) | high (no-bind) |
| `bx-015` | Chain Incendio 5-60HT | 5-60HT | `x-blade-hells-chain`, `x-ratchet-5-60`, `x-bit-ht` | None exact. | **B** | beyparts: `BX-21 HELLSCHAIN5-60HT` | New seed under **BX-21** | high |
| `bx-016` | Talon Ptera 3-80B | 3-80B | `x-blade-ptera-swing`, `x-ratchet-3-80`, `x-bx-07-bit` | None exact. | **B** | beyparts only `UX-10 PTERASWING7-70B`; image `Talon_Ptera_3-80B.jpeg` matches RIPBEYS combo, not official source | Treat as likely **custom/alt**; seed only with explicit custom policy or better code evidence | low–med |
| `bx-017` | Savage Bear 3-60S | 3-60S | `x-blade-bear-scratch`, `x-bx-05-ratchet`, `x-bit-s` | `prod-x-bx-37-*` Bear Scratch **5-60F** | **C** | Official beyparts: `BX-37 BEARSCRATCH5-60F` only — no 3-60S | Do not bind BX-37; seed 3-60S only if confirmed elsewhere | high (no-bind) |
| `bx-018` | Roar Tyrano 9-60GF | 9-60GF | `x-blade-tyranno-roar`, `x-ratchet-9-60`, `x-bit-gf` | None exact. | **B** | beyparts source `UX-15 TYRANNOROAR1-70L` only; image `Roar_Tyranno_9-60GF.jpeg` matches listing | Combo may be presentation/custom; confirm code before seed (do not invent from image alone) | low–med |
| `bx-019` | Bite Croc 3-60LF | 3-60LF | `x-blade-croc-crunch`, `x-bx-05-ratchet`, `x-bit-lf` | None exact. | **B** | beyparts: `BX-00 CROCOCRUNCH2-60Q…`; image `Bite_Croc_3-60LF.jpeg` | Official source ≠ listing combo; custom vs typo — confirm before seed | low–med |
| `bx-020` | Mammo Tusk 3-60T | 3-60T | `x-blade-tusk-mammoth`, `x-bx-05-ratchet`, `x-bit-t` | None exact. | **B** | beyparts: 7-60S / 2-80E; image `Tusk_Mammoth_3-60T.jpeg` | Same: image-aligned combo without matching source line | low–med |
| `bx-021` | Gale Wyvern 5-80GB | 5-80GB | `x-blade-wyvern-gale`, `x-ratchet-5-80`, `x-bit-gb` | `prod-x-ux-07-*` Wyvern Gale **2-60S** | **C** | beyparts: `BX-24 WYVERNGALE5-80GB` | Do not bind UX-07; new seed **BX-24** 5-80GB | high |
| `bx-023` | Shinobi Knife 4-80HN | 4-80HN | `x-blade-shinobi-knife`, `x-ratchet-4-80`, `x-bit-hn` | None exact. | **B** | beyparts: `BX-00 SHINOBIKNIFE4-60LF…` only — not 4-80HN | Confirm combo/code; possible custom | low–med |
| `bx-211` | Sting Unicorn 5-60GP | 5-60GP | `x-blade-unicorn-sting`, `x-ratchet-5-60`, `x-bit-gp` | None exact. | **B** | beyparts: `BX-26 UNICORNSTING5-60GP` | New seed under **BX-26** | high |
| `bx-218` | Cowl Sphinx 9-80GN | 9-80GN | `x-blade-sphinx-cowl`, `x-ratchet-9-80`, `x-bit-gn` | None exact. | **B** | beyparts has `BX-27 SPHINXCOWL9-80G` (Gear?) not clearly **GN**; also other BX-27/UX-07 combos | Do not assume 9-80G ≡ 9-80GN; confirm bit before seed | med |
| `bx-219` | Arrow Wizard 4-80GB | 4-80GB | `x-bx-02-blade`, `x-ratchet-4-80`, `x-bit-gb` | `prod-x-bx-02-*` 4-60T; `prod-x-bx-05-*` 4-80**B** | **C** | beyparts: `BX-24 WIZARDARROW4-80GB` | Do not bind BX-02/05; new seed **BX-24** 4-80GB | high |
| `bx-222` | Keel Shark 1-60Q | 1-60Q | `x-blade-shark-edge`, `x-ratchet-1-60`, `x-bit-q` | `prod-x-bx-20-*` 3-80F | **C** | beyparts: `BX-31 SHARKEDGE1-60Q` | New seed Shark Edge 1-60Q (**BX-31**); never BX-20 Shark Edge 3-80F | high |
| `bx-227` | Soar Phoenix 5-80H | 5-80H | `x-blade-phoenix-wing`, `x-ratchet-5-80`, `x-bit-h` | None exact (other Phoenix combos also missing as products). | **B** | beyparts: `BX-35 PHOENIXWING5-80H` | New seed under **BX-35** | high |
| `bx-232` | Buster Dran 5-70DB | 5-70DB | `x-blade-dran-buster`, `x-ratchet-5-70`, `x-bit-db` | `prod-x-ux-01-*` 1-60A; same combo on Wizard Rod `prod-x-ux-03-*` | **C** | No Dran Buster 5-70DB in beyparts sources | Do not bind UX-01 or UX-03; seed only with new evidence | high (no-bind) |
| `bx-248` | Cowl Sphinx 1-80GF | 1-80GF | `x-blade-sphinx-cowl`, `x-ratchet-1-80`, `x-bit-gf` | None exact. | **B** | beyparts: `UX-07 SPHINXCOWL1-80GF` | New seed under **UX-07** | high |
| `bx-250` | Gill Shark 4-70O | 4-70O | `x-blade-shark-gill`, `x-ratchet-4-70`, `x-bit-o` | `prod-x-cx-11-*` Shark Gill **5-60FB** | **C** | Official source `CX-11 SHARKGILL5-60FB`; image `Gill_Shark_4-70O.jpeg` matches RIPBEYS not CX-11 | Do not bind CX-11; 4-70O likely custom — confirm before seed | high (no-bind) |
| `bx-252` | Dranzer Spiral 3-80T | 3-80T | `x-blade-dranzer-spiral`, `x-ratchet-3-80`, `x-bit-t` | None exact. | **B** | beyparts: `BX-00 DRANZERSPIRAL3-80T` | New seed (BX-00 special / metallic policy) | med–high |
| `bx-253` | Driger Slash 4-80P | 4-80P | `x-blade-driger-slash`, `x-ratchet-4-80`, `x-bit-p` | None exact. | **B** | beyparts: `BX-00 DRIGERSLASH4-80P` | New seed (BX-00 policy) | med–high |

---

## Class **C** detail (do not bind)

| ID | Listing combo | Nearest existing product | Official alt (beyparts) |
|----|---------------|--------------------------|-------------------------|
| `bx-007` | S6-60V | UX-01 Dran Buster 1-60A | None for S6-60V |
| `bx-011` | 3-60LF | BX-20 Shark Edge 3-80F | BX-14 Shark Edge 3-60LF |
| `bx-014` | 4-60T | BX-03 Hells Scythe 4-80B | Hells Scythe 4-60T lines (code collision with Wizard Arrow BX-02) |
| `bx-017` | 3-60S | BX-37 Bear Scratch 5-60F | Only 5-60F official |
| `bx-021` | 5-80GB | UX-07 Wyvern Gale 2-60S | BX-24 Wyvern Gale 5-80GB |
| `bx-219` | 4-80GB | BX-02 4-60T / BX-05 4-80B | BX-24 Wizard Arrow 4-80GB |
| `bx-222` | 1-60Q | BX-20 Shark Edge 3-80F | BX-31 Shark Edge 1-60Q |
| `bx-232` | 5-70DB | UX-01 1-60A | None for Dran Buster 5-70DB |
| `bx-250` | 4-70O | CX-11 Shark Gill 5-60FB | Only 5-60FB official |

---

## Strongest **B** seed candidates (official line ≈ listing combo)

These have a clear beyparts `CODE + COMBO` hit and no existing assembled product row:

| ID | Suggested primary code (from beyparts) | Combo |
|----|----------------------------------------|-------|
| `bx-005` | BX-16 | 5-80O |
| `bx-006` | BX-19 | 3-80S |
| `bx-008` | CX-05 | T4-70K |
| `bx-015` | BX-21 | 5-60HT |
| `bx-211` | BX-26 | 5-60GP |
| `bx-227` | BX-35 | 5-80H |
| `bx-248` | UX-07 | 1-80GF |
| `bx-003` | BX-23 (also BX-00 variants) | 9-60GF |
| `bx-252` / `bx-253` | BX-00 | 3-80T / 4-80P |

**C→seed** (same blade wrong product today, but official combo exists): `bx-011` (BX-14), `bx-021` (BX-24), `bx-219` (BX-24), `bx-222` (BX-31). Still classified **C** for *binding*; seeding is the path.

---

## Weak / custom-leaning rows (seed only with explicit approval)

| ID | Why weak |
|----|----------|
| `bx-012` | **D** — no product code in beyparts `source[]` |
| `bx-007`, `bx-017`, `bx-232`, `bx-250` | **C** with no matching official combo for RIPBEYS parts |
| `bx-016`, `bx-018`, `bx-019`, `bx-020`, `bx-023` | **B** but official sources disagree with listing combo (image-only alignment) |
| `bx-218` | **B** — 9-80**GN** vs beyparts 9-80**G** ambiguity |
| `bx-014` | **C** — seeding blocked on BX-02 ownership conflict until owner decides code |

---

## Relation to Stage 4A/4B

| Discovery | Effect on demoted 26 |
|-----------|----------------------|
| `prod-x-dran-dagger-4-60r-complete-loose` | No demoted listing uses Dagger 4-60R |
| Twin ambiguity `bx-001` / `bx-013` | Not in demoted set |
| Reject inventing Dagger 4-70Q | Reinforces: do not invent combos from RIPBEYS alone (`bx-018`/`bx-019`/etc.) |

---

## Recommended Stage 6 sequencing (not implemented)

1. Owner-approve a **batch of high-confidence B (+ C→seed)** rows with explicit `productCodes`.  
2. Add `complete_loose` seeds only (parts already exist).  
3. Regen map + bridge; demotions clear only on **exact** recipe match.  
4. Leave **D** / weak-B / conflict-C rows demoted until evidence improves.  
5. Never bind any Shark Edge alt-combo to `prod-x-bx-20-*`.

---

## Validation

```text
node scripts/validate-ripbeys-assets.mjs → ok
  confirmedWithProduct: 15
  conflict: 4
  (demoted remain 26 in bridge — unchanged)
```

No catalogue mutations in Stage 5.

---

## Stop

Audit complete: `DEMOTED_X_PRODUCT_AUDIT.md` only. Ephemeral `scripts/_demoted-x-audit-out.json` may be deleted; not catalogue truth.

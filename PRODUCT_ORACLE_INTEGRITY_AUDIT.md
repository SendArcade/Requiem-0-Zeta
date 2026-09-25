# Product Oracle Integrity Audit (Stage 6B + 6C re-run)

**Updated:** 2026-09-21 after Stage 6C hygiene fixes.

## Counts

| Metric | Stage 6B | After 6C |
|--------|--------:|--------:|
| Product Oracle | 25 | **26** |
| Integrity PASS | 22 | **26** |
| Integrity FAIL | 3 | **0** |

**+1 Product Oracle:** `bx-201` Soar Phoenix 9-60GF **(st)** — same recipe as `bx-003`; unlocked by stripping trailing `(st)` so combo parse works. Same product `prod-x-bx-23-complete-loose`. Expected side-effect of the bx-205 fix class, not a new seed.

## Former FAILs (now PASS)

| Listing | Before | After |
|---------|--------|-------|
| `bx-009` | parts included `x-bit-lo` | `x-blade-arc` + `x-ratchet-4-55` + **`x-bit-wizard`** (CX lock-chip from seed) |
| `bx-010` | parts included `x-bit-w` | `x-blade-dark` + `x-ratchet-6-80` + **`x-bit-perseus`** |
| `bx-205` | only `x-bit-wizard` via token | `x-bx-02-blade` + `x-ratchet-4-80` + `x-bx-07-bit` → Wizard Arrow 4-80B |

## Shared-code / Shark / Dagger

Unchanged and still correct: BX-20 Dagger ≠ Shark Edge; CX-05 Reaper ≠ Whale Wave; UX-07 Sphinx ≠ Wyvern Gale.

## Validation

`validate-ripbeys-assets.mjs` → ok · dangling product part refs → 0

See Stage 6C report in chat / `MIGRATION_STATUS.md` for files changed.

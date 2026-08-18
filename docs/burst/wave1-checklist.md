# Wave 1 expansion — Burst FMV (post Wave 0)

**Goal:** grow honest marks beyond the 7 Wave 0 starters — B-01 pack, boosters, and sealed rows for shipped starters.

**Prerequisite:** Wave 0 shipped 7/7 (see [`wave0-checklist.md`](wave0-checklist.md)).

---

## Scope (Wave 1 burst)

| B-code | product rows | Notes |
|--------|--------------|-------|
| B-01 | starter, complete_loose, sealed | Valkyrie Wing Accel DX — sealed-heavy |
| B-102 | complete_loose, sealed | Twin Nemesis booster |
| B-168 | complete_loose, sealed | Rage Longinus booster |
| B-34…B-127 | `*-sealed` (7 rows) | Peel 未開封 comps off starter marks |

**14 product rows total.** Out of scope until Wave 1 green: Wave 2 held SKUs (B-122, B-129, B-148, B-180), plastic/metal fleet.

---

## Execution

### Local preview

```bash
pnpm --filter @beyoracle/ingest burst:wave1-status   # current marks + match counts
# Dry run (no API):
BURST_WAVE1_DRY_RUN=1 pnpm --filter @beyoracle/ingest burst:wave1-ingest
```

### Railway (operator)

Cron stays paused (`BACKFILL_PAUSE_CRON_INGEST=1`). One-shot on worker:

```bash
railway variable set BURST_WAVE1_INGEST=1 --service worker
# redeploy worker or wait for boot
railway logs --service worker --lines 200

# After logs show complete:
railway variable set BURST_WAVE1_INGEST_DONE=1 --service worker
railway variable delete BURST_WAVE1_INGEST --service worker
pnpm --filter @beyoracle/ingest burst:wave1-status   # via railway run
```

### Broader catalog (plastic / metal / full burst)

When Wave 1 burst rows are green, use the generation oracle loop or fleet:

```bash
# Rotating query batches per generation (burst, plastic, metal)
railway variable set GENERATION_ORACLE_LOOP=burst,plastic,metal --service worker

# Or full parallel fleet (64 shards, burst-only default)
railway variable set PRODUCT_BACKFILL_ENQUEUE=1 PRODUCT_BACKFILL_FLEET=1 PRODUCT_BACKFILL_SHARD_COUNT=64 --service worker
```

See [`docs/PRODUCT_BACKFILL_FLEET.md`](../PRODUCT_BACKFILL_FLEET.md).

---

## Publish bar (per row)

Same Diablo rules as Wave 0:

1. Identity matches Takara truth
2. ≥3 sold comps in the correct condition pool (sealed vs used)
3. No bundles / wrong-TT comps
4. Venue band sanity (see [`venue-bands.md`](venue-bands.md))
5. Live item URLs on comps

---

## Current status

_Not started — run `burst:wave1-status` on Railway after ingest._

# HANDOFF — Beyoracle / Requiem-0-Zeta

Resume from this file if usage dies. Semi is AFK. Rimuru owns merge/deploy.

## Repo
- GitHub: https://github.com/SendArcade/Requiem-0-Zeta (private, SendArcade)
- Local: `/Users/semi/Vibecode/Requiem-0-Zeta`
- `main` includes PR #2 merge `fbc432c` (2026-08-13)
  - sealed out of starter/complete_loose FMV
  - title 未開封 overrides venue "used"
  - Wave 0+1 catalog identity recut
- Old PR #1 was FMV-only / superseded.

## Railway
- Project `oracle` `5dd67894-2e52-46a6-ae44-7fcf58fe2055` env `production`
- web: https://web-production-5c33a.up.railway.app
- worker: 16 replicas (PRODUCT_BACKFILL_FLEET). Do **not** scale down as the only action while 64-shard fleet + 10min locks are live.
- Last action: `railway up --detach` web + worker with message `PR2 Burst FMV + Wave 0+1 identity` (uploads succeeded; confirm deploy healthy before assuming live).

## Live data already done (Postgres)
- 未開封 titles retagged `condition=sealed` (783)
- 59 hung ingest_runs marked failed
- All Burst `product_oracle_snapshots` unpublished (0 rows)
- 23 sealed `product_matches` unlinked from Burst starters
- **Do not republish Burst FMV until Diablo passes the bar.**

## Ingest hang (next code)
Root cause: repeatable cron froze `tickId` on 5 Aug 2026; every 15 min Redis treats ingest jobs as dupes (`removeOnComplete`). 16 replicas are a 64-shard backfill fleet, not extra coverage.
Fix order:
1. generate tickId inside `dispatchCronTick`, not in repeatable payload
2. remove Redis repeatable `scheduled-cron-tick`
3. raise lock duration / lockRenewTime for shards
4. try/finally + stale sweeper on ingest_runs
5. drain stalled `product.backfill.shard` jobs
6. then scale worker toward 1–2
Do **not** start another 64-shard fleet. Point later fill at Burst only (`PRODUCT_BACKFILL_GENERATIONS=burst`).

## Publish bar (Diablo)
Fail/unpublish unless: correct TT identity, sealed out of default, n≥3 sold comps, no bundles.
n=1 never a mark (B-02, B-12, B-23, B-133).

## Identity (Shuna / PR #2 seed)
- B-34 Victory Valkyrie.B.V — not Winning (B-104, minted first)
- B-01 Valkyrie Wing Accel DX — three keys only; booster is B-13; B-29 stays own code
- B-86 Legend Spriggan (Achilles → B-129)
- B-97 Nightmare Longinus (Heaven Pegasus → B-148)
- B-102 Twin Nemesis booster (Dead Phoenix → B-131)
- B-110 Bloody Longinus (Requiem → B-100)
- B-127 Cho-Z Valkyrie (Spriggan → B-128)
- B-168 Rage Longinus booster (Belial → B-180)
- B-115 vacated (Geist → B-122)
- Collapse complete_sealed → sealed. Drop rb/booster-sealed extras.

## Team
- Ship room: Rimuru, Kaijin, Shuna, Souei, Diablo, Benimaru — build the mark
- Coverage room: Rimuru, Gabil, Hakuro, Rigurd, Shion, Geld — intel/ops
- Kaijin exclusive on the Mac clone. Commit often to a branch.
- Semi: suggestions only; Rimuru decides. Stop only for destructive deletes or spend.

## Next (in order)
1. Confirm web+worker deploys healthy on Railway.
2. Kaijin tickId/BullMQ PR → Rimuru merge + deploy worker.
3. Burst-only backfill (not 64-shard fleet).
4. Diablo QA new marks vs `venue-bands.md`. Unpublish failures.
5. Then Wave 2 catalog (rename remaining 27 misnamed codes) + missing keys from `takara-gaps.md`.
6. Metal / Plastic / X after Burst is honest.

## If usage dies now
Best leftover state: `main` at PR #2, intel in `docs/burst/`, Burst marks unpublished, sealed unlinked, ingest still hung until tickId ships.

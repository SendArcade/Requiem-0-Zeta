# HANDOFF — Beyoracle / Requiem-0-Zeta

Resume from this file if usage dies. Rimuru owns merge/deploy. Semi: suggestions only; stop only for destructive deletes or spend.

Written 2026-08-14 ~10:50 MYT.

## Repo
- GitHub: https://github.com/SendArcade/Requiem-0-Zeta (private)
- Local: `/Users/semi/Vibecode/Requiem-0-Zeta`
- `main` has:
  - PR #2 Burst FMV + Wave 0+1 identity (sealed out of starter/complete_loose)
  - compile fix `inferConditionFromTitle` → `resolveListingCondition` (adapters)
  - PR #3 tickId unfreeze
  - PR #4 `queue.removeRepeatable(scheduled-cron-tick)` + NaN-safe locks

## Railway
- Project `oracle` `5dd67894-2e52-46a6-ae44-7fcf58fe2055` env `production`
- web: https://web-production-5c33a.up.railway.app — deploy `0447729d` SUCCESS (compile fix)
- worker: deploy `2d0f1e08` SUCCESS (PR4 + `BULLMQ_LOCK_DURATION_MS=3600000`)
- worker still 16 replicas us-west2. Do **not** scale as the only action. Do **not** start a 64-shard fleet.
- Cron ingest paused on purpose: `BACKFILL_PAUSE_CRON_INGEST=1` and `PRODUCT_BACKFILL_FLEET=1`. Boot log: `removed 1 repeatable scheduled-cron-tick`. Redis repeatables = 0.
- `PRODUCT_BACKFILL_SHARD_COUNT` still 64 in env. `PRODUCT_BACKFILL_ENQUEUE=0`. Do **not** flip ENQUEUE=1.
- `PRODUCT_BACKFILL_MAX_QUERIES=100` on the service (pass 1 inherited this). Pass 2 overrides to 5000 in-process.

## Live data
- 未開封 retagged sealed (783)
- hung ingest_runs marked failed (Postgres running=0)
- Burst snapshots unpublished. **Do not republish until Diablo passes the bar.**
- 23 sealed product_matches unlinked from Burst starters
- Drained 30 active + 19 failed Aug 9 `product.backfill.shard` zombies (20260809-2033-64 and product-backfill-shard-64-*). Queue active=0 after drain.

## Burst fill (in-process, not a fleet)

Replica `0b19a5bc-bf9c-4a50-abec-a6d29b988257`

**Pass 1** (done): `/tmp/burst-fill.log`
- 76 products, 100 queries × 2 sources (mercari_jp, yahoo_auctions_jp), 9/9 batches
- inserted 69, updated 818, matched 342, productsTouched 15, productsRecomputed 15
- 5 errors: `matches_part_id_fkey` (identical text, no part ids in the log)
- 100-query cap truncated; only 15 of 76 got marks
- Souei: B-34 live page is Victory, ¥1,499, 3 comps. Other 14 not on public report (publish still down)
- PID 26 left as zombie after JSON; live cmdline gone

**Pass 2** (RUNNING as of 10:41 MYT): `/tmp/burst-fill-pass2.log` PID 266
```
env PRODUCT_BACKFILL_GENERATIONS=burst PRODUCT_BACKFILL_SHARD_ID=0 PRODUCT_BACKFILL_SHARD_COUNT=1 PRODUCT_BACKFILL_MAX_QUERIES=5000
node /app/packages/ingest/dist/cli/product-backfill-shard.js
```
- Header: `76 products, 904 queries × 2 sources` batch 1/76 then 2/76
- Do **not** start another fill unless PID 266 is dead AND there is no JSON report in pass2 log
- Monitor: `railway ssh -s worker -e production -p 5dd67894-2e52-46a6-ae44-7fcf58fe2055 -d 0b19a5bc-bf9c-4a50-abec-a6d29b988257 -- sh -c 'ps -o pid,etime,args | grep product-backfill; echo ---; cat /tmp/burst-fill-pass2.log'`
- Routine `burst-pass-2-fill-watch` polls every 30m Fri 10–21 MYT; delete after 22:00 MYT 2026-08-14

## Publish bar (Diablo)
Fail/unpublish unless: correct TT identity, sealed out of default, n≥3 sold comps, no bundles. n=1 never a mark.

## Identity (do not relitigate)
- B-34 Victory Valkyrie.B.V — not Winning (B-104)
- B-01 Valkyrie Wing Accel DX — three keys; booster B-13
- B-86 Legend Spriggan (Achilles → B-129)
- B-97 Nightmare Longinus (Heaven Pegasus → B-148)
- B-102 Twin Nemesis booster (Dead Phoenix → B-131)
- B-110 Bloody Longinus (Requiem → B-100)
- B-127 Cho-Z Valkyrie (Spriggan → B-128)
- B-168 Rage Longinus booster (Belial → B-180)
- B-115 vacated (Geist → B-122)
- sku_type: complete_loose / starter / sealed. complete_sealed collapsed into sealed.

## Team
- Ship room: Rimuru, Kaijin, Shuna, Souei, Diablo, Benimaru
- Coverage room: Rimuru, Gabil, Hakuro, Rigurd, Shion, Geld — freeze unless asked
- Kaijin: queue/Postgres. Souei: venue-verify only the 15 from pass 1 until pass 2 lands. Shuna: FK missing parts only. Diablo: bar after marks exist.
- Freeze extra research. Commit to git, not chat.

## Next (in order)
1. Let pass 2 finish. Read JSON in `/tmp/burst-fill-pass2.log`.
2. Postgres: which of 76 were `productsTouched`; the 5 missing `part_id`s for Shuna.
3. Souei venue-verify those products vs `venue-bands.md`. Diablo publish bar.
4. Do not unpause cron until pass 2 is done and you explicitly want ticks (`PRODUCT_BACKFILL_FLEET=0` and `BACKFILL_PAUSE_CRON_INGEST=0`).
5. Wave 2 catalog + `takara-gaps.md` after Burst marks are honest.
6. Metal / Plastic / X last.

## If usage dies now
Best leftover state: `main` with PR #2/#3/#4 + compile fix deployed. Worker lock 60m. Zombies drained. Cron paused. Pass 1 done (15 marks, truncated). Pass 2 running on Railway replica 0b19a5bc (survives chat death). Resume = cat pass2 log, then Diablo bar. Do not enqueue a 64-shard fleet.

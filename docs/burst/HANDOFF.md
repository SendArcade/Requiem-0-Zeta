# HANDOFF — Beyoracle / Requiem-0-Zeta

Resume from this file if usage dies. Rimuru owns merge/deploy. Semi: suggestions only; stop only for destructive deletes or spend.

Written 2026-08-14 ~23:42 MYT. Updated 2026-08-15 ~03:25 UTC (Wave 0 checklist + persist gate).

## Agent progress (2026-08-15 UTC)

- **Kaijin:** Postgres via Railway token. 26 touched IDs confirmed (Aug 14
  `product_matches`); 7 oracle snapshots (all starters); FK gaps
  `burst-disc-z`, `burst-b-180-layer`. Full list in `verify-pass2.md`.
- **Souei:** Full verify of all 26 vs `venue-bands.md` — **0 publishable**.
  Details in `verify-pass2.md`. Blockers: stale `products.name_en` on Railway
  (catalog seeds correct), bare B-code false positives on complete_loose rows,
  sealed comps on starter SKUs, B-97 mark below band.
- **Shuna:** **Done 2026-08-15** — `pnpm catalog:sync` on Railway (`2 parts`, `437 product rows` refreshed). Key names fixed in Postgres.
- **Diablo:** still blocked. Do not republish.
- **Matcher:** **Applied 2026-08-15** — purge + **28 sealed rematch** to `*-sealed` rows. Burst 9/76 marks. B-110 starter mark dropped (sealed isolation). Publish blocked pending Souei.
- **Diablo:** still blocked. Do not republish.

## Repo
- GitHub: https://github.com/SendArcade/Requiem-0-Zeta (private)
- Local: `/Users/semi/Vibecode/Requiem-0-Zeta`
- `main` has PR #2 (Burst FMV + Wave 0+1 identity), compile fix `inferConditionFromTitle` → `resolveListingCondition`, PR #3 tickId unfreeze, PR #4 `removeRepeatable(scheduled-cron-tick)` + NaN-safe locks.

## Railway
- Project `oracle` `5dd67894-2e52-46a6-ae44-7fcf58fe2055` env `production`
- web: https://web-production-5c33a.up.railway.app — deploy `0447729d` SUCCESS
- worker: deploy `2d0f1e08` SUCCESS (PR4 + `BULLMQ_LOCK_DURATION_MS=3600000`)
- 16 replicas us-west2. Do **not** scale as the only action. Do **not** start a 64-shard fleet.
- Cron paused: `BACKFILL_PAUSE_CRON_INGEST=1` and `PRODUCT_BACKFILL_FLEET=1`. Repeatable `scheduled-cron-tick` removed on boot.
- `PRODUCT_BACKFILL_SHARD_COUNT` still 64 in env. `PRODUCT_BACKFILL_ENQUEUE=0`. Do **not** flip ENQUEUE=1.
- Service `PRODUCT_BACKFILL_MAX_QUERIES=100` (pass 1 inherited). Pass 2 overrode to 5000 in-process.

## Live data
- 未開封 retagged sealed (783)
- hung ingest_runs marked failed (Postgres running=0)
- Burst snapshots unpublished. **Do not republish until Diablo passes the bar after Souei verify.**
- 23 sealed product_matches unlinked from Burst starters
- Drained 30 active + 19 failed Aug 9 `product.backfill.shard` zombies. Queue active=0 after drain.

## Burst fill (in-process, not a fleet)

Replica `0b19a5bc-bf9c-4a50-abec-a6d29b988257`

**Pass 1** (done): `/tmp/burst-fill.log`
- 76 products, 100 queries × 2 sources (mercari_jp, yahoo_auctions_jp), 9/9 batches
- inserted 69, updated 818, matched 342, productsTouched 15, productsRecomputed 15
- 5 `matches_part_id_fkey` errors (no part ids in the log)
- Souei spot: B-34 live page is Victory, ¥1,499, 3 comps. Other 14 not on public report (publish still down)

**Pass 2** (DONE ~23:40 MYT): `/tmp/burst-fill-pass2.log`
- 76 products, 904 queries × 2 sources, 76/76 batches
- inserted 396, updated 4456, matched 1693, productsTouched 33, productsRecomputed 33
- many identical `matches_part_id_fkey` errors (dozens; log does not name part ids)
- PID 266 still listed after JSON (hung, same as pass 1). Kill only that backfill, not worker PID 1. SIGTERM/SIGKILL via busybox ssh was flaky (`kill -9 266` got “specify whom to kill”).
- Do **not** start another fill. Do **not** enqueue a fleet.

The pass-2 log lists all 76 targeted IDs, not the 33 that moved. Get the 33 from Postgres.

## Publish bar (Diablo)
Fail/unpublish unless: correct TT identity, sealed out of default, n≥3 sold comps, no bundles. n=1 never a mark.
Semi order 2026-08-14: full venue+item verify of every touched product (not a sample) before publish.

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
- Coverage room: freeze unless asked
- Kaijin: Postgres list of 33 touched product ids + distinct missing part_ids
- Souei: venue+item verify those 33 (opened pages, TT identity, sealed vs loose, no bundles). Not a sample.
- Shuna: catalog only the named missing parts
- Diablo: bar after Souei verify, not before

## Next (in order)
1. ~~Kaijin: 33 product ids from Postgres; distinct `part_id`s failing `matches_part_id_fkey`.~~ **Done** → `verify-pass2.md`
2. ~~Souei: full venue+item verify those products vs `venue-bands.md`.~~ **Done — all FAIL** → `verify-pass2.md`
3. ~~**Shuna:** sync Railway `products.name_en` from catalog seeds; seed `burst-disc-z`, `burst-b-180-layer`.~~ **Done** (`pnpm catalog:sync`)
4. ~~**Matcher/ingest:** burst purge + rematch sealed rows.~~ **Done 2026-08-15** — 28 sealed comps on `*-sealed` SKUs; B-34-sealed mark live. `burst:wave0-status` for ops.
5. **Souei re-verify** Wave 0 (7 starters) — update `verify-pass2.md`. **Publish still DOWN.**
6. Fix B-97/B-104 marks (wrong comps in used pool) + B-110 starter n≥3 used.
7. Kill hung PID 266 if still a live backfill on replica 0b19a5bc.
8. Do not unpause cron until Wave 0 green.
9. Wave 2 catalog + `takara-gaps.md` after Burst Wave 0 publishes.
10. Metal / Plastic / X last.

## If usage dies now
Best leftover state: `main` with this handoff. PR #2/#3/#4 + compile fix deployed. Worker lock 60m. Zombies drained. Cron paused. Pass 1+2 done (33/76 marks). Publish still down. Resume = Postgres 33 ids, then Souei verify, then Diablo bar. Do not enqueue a 64-shard fleet.

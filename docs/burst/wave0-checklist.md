# Wave 0 exit checklist — Burst FMV

**Goal:** first **honest, publishable** ALT-style marks on Wave 1 majors only.
No fleet, no pass 3, no cron unpause until this doc is green.

**North star:** 7 SKUs × Diablo PASS × Souei sign-off × comp audit visible on web.

---

## Scope (Wave 0 only)

| B-code | product_id (starter) | sealed row | venue band doc |
|---|---|---|---|
| B-34 | `prod-burst-b-34-starter` | `prod-burst-b-34-sealed` | `venue-bands.md` B-34 |
| B-86 | `prod-burst-b-86-starter` | `prod-burst-b-86-sealed` | B-86 |
| B-97 | `prod-burst-b-97-starter` | `prod-burst-b-97-sealed` | B-97 |
| B-100 | `prod-burst-b-100-starter` | `prod-burst-b-100-sealed` | B-100 |
| B-104 | `prod-burst-b-104-starter` | `prod-burst-b-104-sealed` | B-104 |
| B-110 | `prod-burst-b-110-starter` | `prod-burst-b-110-sealed` | B-110 |
| B-127 | `prod-burst-b-127-starter` | `prod-burst-b-127-sealed` | B-127 |

**Out of scope until Wave 0 green:** Wave 2 held SKUs (B-122, B-129, B-148, B-180), `complete_loose`
rows with historical junk, 64-shard fleet, cron unpause.

---

## Diablo PASS criteria (per SKU)

All must be true on the **starter** row (default public mark = opened starter + launcher):

1. **Identity** — `products.name_en` / listing titles match Takara truth (see `HANDOFF.md` identity table).
2. **Pool** — mark computed from ≥3 **used** sold comps (sealed excluded from starter pool).
3. **No bundles** — zero `product_matches` with lot shape or まとめ language.
4. **No wrong-TT comps** — e.g. no Heaven Pegasus on B-97, no Winning on B-34.
5. **Venue band** — landed starter mark within `venue-bands.md` starter_used / used cluster (not sealed band).
6. **Sealed isolation** — 未開封 comps live on `*-sealed` rows only, not starter.
7. **Live evidence** — each comp has item URL; Souei opened page or cached venue ref.

---

## Execution order

### A. Deploy matcher hardening (branch `cursor/burst-souei-verify-2345`)

Code shipped:

- `looksLikeBeybladeListing` — bare `B-XX` needs burst context; junk regex rejects car parts / kits / apparel.
- Product matcher — sealed titles score to `*-sealed` SKU, away from starter.
- Persist gate — product matches require `isProductCompEligible(title)`.

### B. Railway cleanup (operator)

**Done 2026-08-15:** purge (4 junk + 32 sealed-on-starter) + **`burst:rematch-unmatched` (28 → sealed SKUs)** + recompute. `product_matches` 162→**154**. Burst marks **9/76** (B-34-sealed ¥11,800 n=3). B-110 starter mark **null** after sealed peel.

**Done 2026-08-15:** maintenance on 16 replicas; verify **4/7 PASS** (B-34, B-86, B-100, B-127).
**FAIL:** B-97 (mark ¥1,000 below band ¥2,200), B-104 (¥599 below floor ¥600), B-110 (no mark, n=0).
Zero stale/wrong-TT on all 7 — matcher cleanup held.

**Next on Railway (no Apify):** targeted gap ingest for the 3 failing SKUs:

```bash
pnpm --filter @beyoracle/ingest burst:wave0-ingest   # Mercari/Yahoo ingest + loose rematch + below-band purge + verify
pnpm --filter @beyoracle/ingest burst:wave0-verify   # 7/7 Diablo bar
pnpm --filter @beyoracle/ingest burst:wave0-status   # ops snapshot
```

Worker one-shot: `BURST_WAVE0_INGEST=1` on boot (unset after logs). Prior maintenance: `BURST_WAVE0_MAINTENANCE=1`.

**Expect:** `burst:purge-fast` removes bare B-code junk that survived SQL pass; product_matches
count drops; some Wave 0 marks may go null (correct — better no mark than wrong mark).

### C. Souei re-verify (Wave 0 rows only)

Re-run venue+item verify for the 7 starter (+ sealed) rows. Update `verify-pass2.md` section
"Wave 0" — do **not** republish until all 7 PASS.

### D. Publish (Diablo only after 7/7 PASS)

**Done 2026-08-18:** 7/7 verify on Railway worker. Web deploy uses persisted
`product_oracle_snapshots` for product-page Oracle Value (browse/search already did).

Operator cleanup after ship:

```bash
# Worker — stop one-shot Wave0 flags
railway variable delete BURST_WAVE0_INGEST --service worker
railway variable set BURST_WAVE0_INGEST_DONE=1 WAVE0_SHIPPED=1 --service worker
```

Cron stays paused until Wave 0b / fleet explicitly approved (`BACKFILL_PAUSE_CRON_INGEST=1`).

---

## Current status (2026-08-18)

| SKU | Mark | n | PASS |
|---|---|---:|:---:|
| B-34 | ¥1,499 | 3 | **PASS** |
| B-86 | ¥1,450 | 3 | **PASS** |
| B-97 | ¥4,000 | 5 | **PASS** |
| B-100 | ¥2,000 | 5 | **PASS** |
| B-104 | ¥700 | 3 | **PASS** |
| B-110 | ¥777 | 5 | **PASS** |
| B-127 | ¥699 | 3 | **PASS** |

**Wave 0 score: 7/7 PASS — shipped 2026-08-18.**

---

## Stop rules

- Do **not** start pass 3 backfill or 64-shard fleet.
- Do **not** unpause cron until Wave 0 is green.
- Do **not** expand to Wave 2 catalog until Wave 0 publishes.
- Kill hung PID 266 on replica `0b19a5bc…` if still running (ops only).

---

## When Wave 0 is green

1. Announce 7 Burst FMV marks on web (evidence + source toggles).
2. Expand to B-01 + B-102 boosters (sealed-heavy SKUs) as Wave 0b.
3. Then Metal / Plastic / X using same quality-first playbook.

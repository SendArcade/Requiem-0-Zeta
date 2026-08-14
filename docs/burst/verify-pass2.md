# Souei verify — pass 2 touched products (2026-08-14)

Full venue+item verify of Postgres-confirmed touched set (26 product IDs with new
`product_matches` on 2026-08-14 UTC) vs `venue-bands.md`. Pass 2 reported
`productsRecomputed=33`; 7 extra IDs exist only in replica log
(`/tmp/burst-fill-pass2.log` on `0b19a5bc…`).

**Publish bar (Diablo):** correct TT identity · sealed out of default pool · n≥3
sold · no bundles · mark within venue band. **All rows FAIL today.**

## Kaijin (Postgres)

### Touched product IDs (26 confirmed)

```
prod-burst-b-01-starter
prod-burst-b-02-starter
prod-burst-b-03-starter
prod-burst-b-03-complete-loose
prod-burst-b-06-complete-loose
prod-burst-b-10-complete-loose
prod-burst-b-100-starter
prod-burst-b-102-sealed
prod-burst-b-104-starter
prod-burst-b-104-complete-loose
prod-burst-b-110-starter
prod-burst-b-122-starter
prod-burst-b-127-starter
prod-burst-b-129-starter
prod-burst-b-131-starter
prod-burst-b-131-sealed
prod-burst-b-131-complete-loose
prod-burst-b-148-starter
prod-burst-b-148-sealed
prod-burst-b-148-complete-loose
prod-burst-b-168-sealed
prod-burst-b-168-complete-loose
prod-burst-b-180-starter
prod-burst-b-34-starter
prod-burst-b-86-starter
prod-burst-b-97-starter
```

### Oracle snapshots (7/76 targets, all starters)

| product_id | B-code | mark | n | DB name (wrong?) |
|---|---|---:|---:|---|
| prod-burst-b-34-starter | B-34 | ¥1,499 | 3 | Winning → **Victory** |
| prod-burst-b-86-starter | B-86 | ¥1,450 | 3 | Cho-Z Achilles → **Legend Spriggan** |
| prod-burst-b-97-starter | B-97 | ¥1,000 | 5 | Heaven Pegasus → **Nightmare Longinus** |
| prod-burst-b-100-starter | B-100 | ¥2,000 | 5 | Spriggan Requiem ✓ |
| prod-burst-b-104-starter | B-104 | ¥599 | 3 | Winning Valkyrie ✓ |
| prod-burst-b-122-starter | B-122 | ¥1,520 | 5 | Geist Fafnir ✓ |
| prod-burst-b-127-starter | B-127 | ¥699 | 3 | Cho-Z Spriggan → **Cho-Z Valkyrie** |

### `matches_part_id_fkey` — missing parts (catalog ⊄ Postgres)

1. `burst-disc-z`
2. `burst-b-180-layer`

Shuna: seed these parts on Railway before part-level match inserts stop failing.

---

## Souei verify — Wave 1 majors with snapshots

| B-code | product_id | Identity | Sealed out of default | n≥3 used pool | Mark vs band | Verdict |
|---|---|---|---|---|---|---|
| B-34 | prod-burst-b-34-starter | Listings mostly ビクトリーヴァルキリー ✓; 1 wrong (yp1002 ウィニング). **DB name wrong.** | Sealed comps attached but excluded from mark pool ✓ | 3 used (¥800–1,500) ✓ | ¥1,499 in used band ¥800–1,500 ✓ | **FAIL** (DB identity + 1 wrong-TT comp) |
| B-86 | prod-burst-b-86-starter | Listings レジェンドスプリガン ✓. **DB name wrong.** | ✓ | 3 used ✓ | ¥1,450 = venue m59769198123 ✓ | **FAIL** (DB identity) |
| B-97 | prod-burst-b-97-starter | Listings mostly ナイトメアロンギヌス ✓; 1 wrong (mp1011 ヘブンペガサス). **DB name wrong.** | 8 sealed attached; excluded from mark ✓ | 5 used ✓ | ¥1,000 **below** starter_used ¥2,200–5,790 | **FAIL** (identity + mark low) |
| B-100 | prod-burst-b-100-starter | スプリガンレクイエム ✓ | Sealed attached; excluded ✓ | 5 used ✓ | ¥2,000 in starter_used ¥690–5,900 ✓ | **FAIL** (sealed pollution in match set; review) |
| B-104 | prod-burst-b-104-starter | ウイニングヴァルキリー ✓ | Sealed attached; excluded ✓ | 3 used ✓ | ¥599 **edge** below band ¥600–1,200 | **FAIL** (marginal mark) |
| B-122 | prod-burst-b-122-starter | ガイストファブニル ✓ | Sealed attached; excluded ✓ | 5 used ✓ | ¥1,520 plausible (Wave 2 band omitted) | **FAIL** (held Wave 2; no band sign-off) |
| B-127 | prod-burst-b-127-starter | Listings mostly 超Zヴァルキリー ✓; 1 wrong (yp1005 超Zスプリガン). **DB name wrong.** | ✓ | 3 used ✓ | ¥699 = venue m29170136870 ✓ | **FAIL** (DB identity + 1 wrong-TT comp) |

**Diablo:** do **not** republish any Burst FMV. Unpublish remains correct.

---

## Souei verify — other touched products (no snapshot)

| B-code | product_id | Key issues | Verdict |
|---|---|---|---|
| B-01 | prod-burst-b-01-starter | 5/6 comps sealed; sealed belongs on `prod-burst-b-01-sealed`. Venue sealed ¥14,858–22,222 matched ✓ but wrong SKU row. | **FAIL** |
| B-02 | prod-burst-b-02-starter | n=3 sealed only; n=1 band rule + wrong pool. | **FAIL** |
| B-03 | prod-burst-b-03-starter | n=1 sealed. | **FAIL** |
| B-03 | prod-burst-b-03-complete-loose | **False positives:** Fujimi model, Masterworks shirts, DENSO device — not Beyblade. | **FAIL** |
| B-06 | prod-burst-b-06-complete-loose | **False positives:** BMW parts, unrelated 完成品 kits. | **FAIL** |
| B-10 | prod-burst-b-10-complete-loose | **False positives:** car mirror, trading cards, tackle box. | **FAIL** |
| B-102 | prod-burst-b-102-sealed | Booster sealed SKU; 4/6 comps are **used** loose boosters. Venue sealed ¥3,480–4,097. | **FAIL** |
| B-104 | prod-burst-b-104-complete-loose | **False positives:** vintage lure, Toyota headlamp. | **FAIL** |
| B-110 | prod-burst-b-110-starter | Listings ブラッディロンギヌス ✓. **DB name Spriggan Requiem wrong.** n=10 but no snapshot (pool/window). Sealed n=2 per coverage holes. | **FAIL** |
| B-129 | prod-burst-b-129-starter | 超Zアキレス ✓ (Legend Spriggan identity is B-86). Held Wave 2. | **FAIL** (held) |
| B-131 | prod-burst-b-131-* | B-102 Twin Nemesis is correct TT for booster; B-131 is Dead Phoenix conflation in matches. complete_loose **Levis jeans** false positive. | **FAIL** |
| B-148 | prod-burst-b-148-* | Heaven Pegasus is B-148 (Nightmare is B-97). Held Wave 2. | **FAIL** (held + identity split) |
| B-168 | prod-burst-b-168-sealed | Rage Longinus booster ✓ in titles; 4/6 comps used not sealed. Venue sealed m20189060113 ¥3,880 not isolated. | **FAIL** |
| B-168 | prod-burst-b-168-complete-loose | **False positives:** OSG tap, Toyota seats. DB name Dynamite Belial (B-180). | **FAIL** |
| B-180 | prod-burst-b-180-starter | n=1 sealed. Held Wave 2. | **FAIL** |

---

## Blockers before publish (ordered)

1. ~~**Shuna:** sync `products.name_en` on Railway from catalog seeds; seed `burst-disc-z`, `burst-b-180-layer`.~~ **Done 2026-08-15** — `pnpm catalog:sync -- --generation=burst`: 2 parts, 6 aliases, 437 product rows refreshed (Victory/Nightmare/Bloody Longinus/Cho-Z Valkyrie names live in Postgres).
2. ~~**Matcher/ingest:** `PURGE_DRY_RUN=1 pnpm purge:bad-comps` on Railway (full DB is slow), then apply; drop bare B-code false positives + sealed-on-starter matches.~~ **Partial 2026-08-15** — burst-scoped `purge:bad-comps` removed 6 wrong-TT matches; SQL junk pass removed 22 non-Beyblade B-code false positives; `burst:recompute` refreshed 22 products. **Still FAIL** publish bar (B-97 mark ¥1000, B-104 ¥599, sealed pollution on starters, B-01/B-110/B-102 no mark).
3. **Diablo:** re-run this verify after matcher hardening; still **DOWN** until every touched row passes.

## Ops (unchanged)

- Do not republish Burst snapshots.
- Do not start pass 3 or 64-shard fleet.
- Cron stays paused.
- Kill hung PID 266 on replica `0b19a5bc…` if still alive.

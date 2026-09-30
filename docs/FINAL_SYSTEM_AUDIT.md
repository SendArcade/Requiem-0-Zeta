# Final system audit

Date: 2026-09-30. Repository HEAD at the start of this pass: `39b6b45` on `main`. The brief named `61a2e61`; that commit is an ancestor, not the current production baseline.

## Integrations that were not available

| Source | What happened | Fallback |
|---|---|---|
| Notion RIPBEYS (`ripbeys.io`) | The user pasted the page on 2026-09-30. Public fetch earlier returned an empty shell. | Recorded in `docs/RIPBEYS_SOURCE.md`. Market figures there are not Oracle prices. |
| Notion: Pricing, Seed inventory, Grading | Read in the browser on 2026-09-30. A raw HTTP fetch of the same URLs returns an empty Notion shell, and `getPublicPageData` reported `publicAccessRole: none`. | `docs/PRICING_PIPELINE.md`, `docs/GRADING_AND_CONDITION.md`, `docs/SEED_INVENTORY.md`. |
| Figma | No design file was attached, and no Figma file was opened. | `UI_SYSTEM_FOUNDATION.md` and the current CSS. |
| Agents `ui-auditor`, `motion-auditor`, `visual-qa-agent`, `performance-auditor`, `responsive-auditor`, `accessibility-auditor`, `design-system-auditor`, `catalogue-integrity-auditor`, `3d-lifecycle-auditor` | These are markdown briefs under `.cursor/agents/`. They are not runnable subagents in this session. | Catalogue auditor and integration verifier were started. This document records the checks that finished in-process. |
| GitHub API | Not required. The local `main` at `39b6b45` was the tree under audit. | `git rev-parse` and `git status`. |

Skills read before edits: catalogue-integrity, oracle-integration, ripbeys-3d, marketplace-product, migration-safety, efficient-engineering, 3d-experience, catalogue-experience, product-experience, plus the architecture rules.

## What was wrong

The public archive treated any bridge row with a numeric API value as a published Bey. That included part-oracle rows. Compact cards then refused to show the part number and rendered “Unavailable” anyway, so part marks both leaked into the “live” set and still looked unpriced. Architecture forbids showing a blade or layer mark as the whole Bey.

Bey pages printed the Requiem id as text. They did not link to `/product/{id}` or `/asset/{id}`.

No mesh file was pointed at a different Bey among the 26 product rows, except `bx-009`, which stays UNVERIFIED (seed name `Arc`, file `arc_wizard.fbx`).

`GET /api/x/feed` 404s on the Next host because the handler lives only in the unused Express server.

## What changed in code

- `Marketplace.tsx` fetches and lists product-oracle listings only, and only when the value is a number.
- Search uses the Requiem display name.
- `ProductDetail.tsx` links the product id to `/product/...` and the part id to `/asset/...`.
- `scripts/audit-ripbeys-identity.mjs` and `pnpm audit:identity`.
- Docs listed below.

## What was not changed

- No FBX/OBJ was created, replaced, or reassigned.
- No Oracle math, seed, or Railway row was edited.
- Catalogue still has 578 listings.
- Cards stay on spin GIFs. One WebGL context per card was not added.
- The X feed was not ported onto the web process.
- Seed names `Arc (4-55LO)` and `Dark (6-80W)` were not expanded.

## Product Oracle rows

Filename status is token overlap, not a rendered mesh. Price is the production `oracle.value` on 2026-09-30. `hidden` means the archive will not list it until a number exists.

| Listing | Identity | Model | Oracle | BeyOracle | Status |
|---|---|---|---|---|---|
| bx-002 | Dran Dagger (4-60R) | dagger_dran.fbx | prod-x-dran-dagger-4-60r-complete-loose | /product/that id | null, hidden |
| bx-003, bx-201 | Phoenix Wing (9-60GF) | x_soar_phoenix_9_60gf_st.fbx | prod-x-bx-23-complete-loose | /product/that id | null, hidden |
| bx-004, bx-228 | Cobalt Dragoon (2-60C) | cobalt_dragoon.fbx / x_cobalt_dragoon_2_60c.fbx | prod-x-bx-34-complete-loose | /product/that id | ¥1,980, 7 comps |
| bx-005 | Viper Tail (5-80O) | tail_viper.fbx | prod-x-bx-16-complete-loose | /product/that id | null, hidden |
| bx-006 | Rhino Horn (3-80S) | horn_rhino.fbx | prod-x-bx-19-complete-loose | /product/that id | null, hidden |
| bx-008 | Hells Reaper (T4-70K) | reaper_incendio.fbx | prod-x-hells-reaper-t4-70k-complete-loose | /product/that id | null, hidden |
| bx-009 | Arc (4-55LO) | arc_wizard.fbx | prod-x-cx-02-complete-loose | /product/that id | ¥1,600, name UNVERIFIED vs filename |
| bx-010 | Dark (6-80W) | dark_perseus.fbx | prod-x-cx-03-complete-loose | /product/that id | ¥1,500 |
| bx-015 | Hells Chain (5-60HT) | chain_incendio.fbx | prod-x-bx-21-complete-loose | /product/that id | null, hidden |
| bx-022, bx-208 | Knight Lance (4-80HN) | lance_knight.fbx / x_knight_lance_4_80hn.fbx | prod-x-bx-13-complete-loose | /product/that id | ¥1,050 |
| bx-205 | Wizard Arrow (4-80B) | x_arrow_wizard_4_80b_st.fbx | prod-x-bx-05-complete-loose | /product/that id | ¥1,290 |
| bx-210 | Leon Claw (5-60P) | x_claw_leon_5_60p.fbx | prod-x-bx-15-complete-loose | /product/that id | ¥1,400 |
| bx-211 | Unicorn Sting (5-60GP) | x_sting_unicorn_5_60gp.fbx | prod-x-bx-26-complete-loose | /product/that id | null, hidden |
| bx-217 | Impact Drake (9-60LR) | x_impact_drake_9_60lr.fbx | prod-x-ux-11-complete-loose | /product/that id | ¥3,555 |
| bx-225 | Shinobi Shadow (1-80MN) | x_shadow_shinobi_1_80mn.fbx | prod-x-ux-05-complete-loose | /product/that id | ¥4,500 |
| bx-226 | Tyranno Beat (4-70Q) | x_beat_tyranno_4_70q.fbx | prod-x-bx-31-complete-loose | /product/that id | ¥2,300 |
| bx-227 | Phoenix Wing (5-80H) | x_soar_phoenix_5_80h.fbx | prod-x-bx-35-complete-loose | /product/that id | null, hidden |
| bx-229 | Dran Buster (1-60A) | x_dran_buster_1_60a.fbx | prod-x-ux-01-complete-loose | /product/that id | ¥4,227 |
| bx-248 | Sphinx Cowl (1-80GF) | x_cowl_sphinx_1_80gf.fbx | prod-x-sphinx-cowl-1-80gf-complete-loose | /product/that id | null, hidden |
| bx-249 | Leon Crest (7-60GN) | x_crest_leon_7_60gn.fbx | prod-x-ux-06-complete-loose | /product/that id | ¥3,000 |
| bx-252 | Dranzer Spiral (3-80T) | x_dranzer_spiral_3_80t.fbx | prod-x-dranzer-spiral-3-80t-complete-loose | /product/that id | null, hidden |
| bx-253 | Driger Slash (4-80P) | x_driger_slash_4_80p.fbx | prod-x-driger-slash-4-80p-complete-loose | /product/that id | null, hidden |
| bx-254 | Samurai Saber (2-70L) | x_saber_samurai_2_70l.fbx | prod-x-ux-09-complete-loose | /product/that id | ¥2,499 |

14 listing ids have a live product number. 12 of those ids are unique products. Prices above are a snapshot, not a hardcoded UI value.

## 3D

No model before/after change. New assets created: none.

## CRT

`.pit-head > .pit-crt` is `position: absolute; inset: 0` after the rule that would otherwise make every hero child `position: relative`. The canvas is `display: block; width/height 100%`, not `position: absolute`. Reduced motion pauses the shader instead of skipping the renderer. This was verified in CSS, not with new desktop and phone screenshots in this pass.

## Remaining

- 436 listings are `UNVERIFIED` on filename tokens. Most are Burst layers whose files use Hasbro spellings (`valtryek`, `achillies`) against different display tokens. They were not remapped from a guess.
- Meshes were not opened in a viewport for all 578 files.
- Responsive, keyboard, and bundle checks were not re-run in a browser during this pass.
- The Pricing, Seed inventory, and Grading pages were read in the browser. Their rules are recorded next to what the code actually does. The L10–L3 grade scale and the $5k buy plan are not implemented.
- UX-03 Wizard Rod (`prod-x-ux-03-complete-loose`, blade `x-blade-wizard-rod`) is in the Requiem seed and on the RIPBEYS page as a Taiwan resale example. No RIPBEYS listing bridges to it. No listing was added, and the page’s NT$295 → NT$2,500 figure was not written into the UI.
- `/api/x/feed` still 404s on the Next host.
- This pass was not deployed.

## Follow-up from the two audits

[Catalogue identity](173e0b09-139b-4ecc-a1ee-6fa25f72d383) confirmed all 26 product-oracle listings: display name, model file, and `requiemProductId` are the same Bey. `bx-002` stays Dran Dagger on BX-20, not Wizard Arrow / BX-02. `bx-003` and `bx-201` share the starter `_st` Phoenix Wing mesh. Four conflict rows stay unbound: `bx-231` (Dagger Dran 4-70Q), `bx-275` (Dagger Dran 4-60R without a blade), `bx-274` and `bx-276` (UI pieces). No product id was invented for them.

[Oracle integration](47f6a026-9e9d-4f35-a25e-5999d3f28a1f) failed on the public grid while that file still fetched every eligible part. The working tree now fetches `isProductOracleEligible` only. Its other finding stands: part-only records were titled “Oracle value.” The chart kicker now says “Part mark · not a whole-Bey price” when the bridge has no product id. `/api/x/feed` is still only on the unused Express server.

# Grading and condition

The Grading Notion page was read on 2026-09-30 from the public link. A raw download of the URL is only Notion’s empty shell.

## What the page specifies

Flow: intake, authenticate, grade, certificate, then an Oracle pool and inventory.

Sealed codes S10–S7 cover factory sealed through a worn box. Loose condition is six subscores, each 0–16: completeness, stickers, contact wear, performance surfaces, structure, and weight (G). Total is out of 100.

| Total | Code | Oracle pool on the page |
|---|---|---|
| 95–100 | L10 Gem | complete loose (mint) |
| 88–94 | L9 Near mint | complete loose |
| 80–87 | L8 Excellent | complete loose |
| 70–79 | L7 Light play | used complete |
| 60–69 | L6 Played | used complete |
| 50–59 | L5 Heavy play | used complete |
| 40–49 | L4 Poor | used complete, low confidence |
| under 40 | L3− | not gacha-eligible |

G is scored against the whole-product catalog weight, not part medians. Weight never overrides a mold check. Buyback percents on the page (80% down to 40%) are not implemented.

## What the code does

The live Oracle condition bucket is still only `sealed`, `like_new`, `used`, and `unknown` in `packages/shared`. There is no L10–L3 score, no S10–S7 certificate, and no buyback percent in the consumer. The page maps S10–S8 into the sealed pool and L8+ into like-new, which is the direction of that code, not the same scale.

Condition in this codebase is the Oracle comps bucket, not a separate letter grade.

| Value | Label | Use |
|---|---|---|
| `sealed` | Sealed / New | Sealed and complete-sealed SKUs only |
| `like_new` | Like New | Default secondary pool |
| `used` | Used | Default secondary pool |
| `unknown` | Unknown | Default secondary pool |

`productMarkConditions` in `packages/shared/src/index.ts` keeps sealed factory boxes out of the loose secondary mark, and keeps opened starters out of the sealed mark.

RIPBEYS does not calculate a grade. A Bey page can refetch with source and condition pills, but it cannot empty the last selected source or condition, and it cannot turn a missing mark into a number.

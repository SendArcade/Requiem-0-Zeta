# Demo visual issues

Updated: 2026-09-24 (Stage 11)

Local audit only. No fabricated artwork. No asset renames/moves.

## Burst posters (catalogue media)

All **465** Burst listings map to posters under `/assets/game/burst-chrome/`.

These files are **technically valid** (exist on disk, pass `validate:assets` / `build:visual-assets`) but are **visually weak** for an investor product grid:

| Pattern | Role in vault | Issue for marketplace |
|---------|---------------|------------------------|
| `ArenaThumb_*.png` | Arena / mode thumbnails | Not Bey product renders; repeat across many listings |
| `battle_menu_*_imagery.png` | Menu chrome | Shared placeholder art — multiple Beys share the same image |
| Other burst-chrome UI bitmaps | Game chrome | Same recycling problem |

**Count:** 465 / 465 Burst posters fall into chrome/thumb classes (not dedicated product photography).

**Action taken in Stage 11:** none (no obvious correct product-shot alternative in the vault for each listing without fabricating art).

**Recommendation:** future media pass — recover per-Bey product stills if present elsewhere in the dump, or accept 3D-first cards (model is already the primary visual; posters are underlays).

## X series posters

X listings with `/assets/game/x-sprites/*_Product.png` (e.g. Dagger Dran) read as strong product art.

Some X entries still use `/assets/game/beys/` chip/decal PNGs as map posters — acceptable underlay behind live 3D; weaker if the model fails.

## Shared complete meshes

Five pairs intentionally share one complete `x_*` FBX (same Bey recipe, two listing rows). Visuals are correct for both; not a wrong-Bey substitution.

## No path fixes applied

Stage 11 did not rewrite any media paths — no safer unique Burst product stills were identified in the existing vault for automatic remapping.

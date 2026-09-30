# 3D asset map

Models are resolved by listing id from `apps/ripbeys/src/data/visual-assets.json`. `modelPathForListing` returns that path only when the map says the file exists. A missing model shows the poster or “No preview”. It does not throw.

## Counts (current map)

| Figure | Meaning |
|---|---|
| 578 | Listing rows, and rows flagged `assembledModelOnDisk` |
| 573 | Unique assembled paths (5 paths are shared by two listing ids) |
| 781 | `.fbx` / `.obj` / `.glb` files under `apps/ripbeys/public/assets/models`, including piece files that are not the assembled map |
| 578 | Spin GIFs under `public/assets/spins` |

An earlier UI snapshot said 378 models. That number is not `assembledModelOnDisk` in the current JSON. The hero “Models” figure is that JSON field (578). It was not rewritten to 378.

## Shared paths

These pairs use one file because they are the same Bey, not because a listing was pointed at a stranger:

- `bx-003` and `bx-201` — Phoenix Wing 9-60GF
- `bx-001` and `bx-202` — Sword Dran blade file (product Oracle is not eligible on `bx-001`)
- `bx-020` and `bx-257` — Mammoth Tusk
- `bx-023` and `bx-256` — Knife Shinobi
- `bx-024` and `bx-277` — Dranzer Spiral green

## Filename check

`pnpm audit:identity` marks `asset_status`:

- `PASS` — a distinctive token in the filename also appears in the Requiem display name. This is not a render of the mesh.
- `UNVERIFIED` — the file loads according to the map, but the name does not share a token. `bx-009` is in this set: display name from the seed is `Arc (4-55LO)`, file is `arc_wizard.fbx`. The seed was not renamed and the file was not swapped.
- `MISSING` — no assembled file.
- `MISMATCH` — one path shared by listings whose names share no token. Current run: none.

No new mesh was created. A generated file would not be the manufactured Bey.

## Where 3D runs

The Bey page and Lab use `ModelViewer` (one live context). Catalogue cards use the spin GIF plus a poster so the archive does not open one WebGL context per listing. GIFs are not a substitute identity. The mesh path is still the one in the map.

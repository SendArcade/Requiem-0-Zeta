# 08 — Glossary

[← Blueprint index](README.md) · Prev: [07-oracle-value](07-oracle-value.md) · Next: [09-decisions](09-decisions.md)

Domain and marketplace vocabulary. If you are writing matcher heuristics or
reading listing text, read this first — most matching bugs are really
vocabulary bugs.

## Product anatomy

| Term | Meaning |
|---|---|
| **Beyblade / top** | The complete spinning toy, assembled from parts |
| **Combo** | A specific assembly of parts chosen for competitive play |
| **Stadium** | The arena. Sold separately, often bundled in lots |
| **Launcher** | The ripcord device. Frequently bundled — a bundle signal |
| **Beycode** | QR-style code on X packaging. `ベイコードなし` means "no beycode," a condition qualifier |

### Beyblade X (current generation)

| Part | Role | Example |
|---|---|---|
| **Blade** | Upper contact piece, carries the name | Dran Sword |
| **Ratchet** | Height and centre of gravity | 3-60 |
| **Bit** | Floor contact, determines movement type | F (Flat) |

Written together as `Dran Sword 3-60F`. Product codes are `BX-##`, `UX-##`,
`CX-##`.

### Earlier generations

| Generation | Parts | Codes |
|---|---|---|
| **Burst** | Layer, Forge Disc, Driver | `B-##` |
| **Metal Fight** | Face, Clear Wheel, Metal Wheel, Spin Track, Performance Tip | `BB##` |
| **Plastic** | Attack Ring, Weight Disk, Blade Base, Spinning Gear | varies |

### Manufacturers

**Takara Tomy** is the Japanese original and the reference for naming and codes.
**Hasbro** releases Western versions with different names and packaging — the
same physical part can carry two unrelated names, which is a matching hazard.

## Japanese marketplace vocabulary

### Condition

| Term | Reading | Meaning | Maps to |
|---|---|---|---|
| 新品 | shinpin | New | `sealed` |
| 未開封 | mikaifū | Unopened | `sealed` |
| 未使用 | mishiyō | Unused | `sealed` |
| 美品 | bihin | Excellent condition | `like_new` |
| 中古 | chūko | Used | `used` |
| ジャンク | janku | Junk, for parts | `used` |
| 傷 | kizu | Scratch, damage | `used` |

### Bundles — critical

These invalidate a listing as a single-part comp. See [06-matching](06-matching.md).

| Term | Meaning |
|---|---|
| まとめ売り | Bulk sale |
| まとめて | Together, in bulk |
| セット | Set |
| 大量 | Large quantity |
| 詰め合わせ | Assortment |
| ○個 / ○点 / ○本 | Counter suffixes — `4個` means four items |
| ＆ | Joins two products in one listing |

### Other

| Term | Meaning |
|---|---|
| 落札価格 | Winning bid price — the sold price on Yahoo Auctions |
| 送料込み | Shipping included, the Mercari default |
| 限定 | Limited edition |
| 非売品 | Not-for-sale item, promotional |
| 単品 | Single item — a useful positive signal |

## Traditional Chinese marketplace vocabulary

| Term | Meaning | Maps to |
|---|---|---|
| 戰鬥陀螺 | Beyblade (Taiwan) | — |
| 全新 | Brand new | `sealed` |
| 未拆 | Unopened | `sealed` |
| 二手 | Second-hand | `used` |
| 現貨 | In stock | — |
| 整組 / 全套 | Complete set | **bundle** |
| 多件 / 一批 | Multiple items | **bundle** |
| ○件 / ○入 / ○組 | Counter suffixes | **bundle** |

## Text normalisation hazards

- **Full-width characters.** `Ｘ` and `３` are distinct code points from `X` and
  `3`. NFKC normalisation handles this; skipping it breaks matching silently.
- **Full-width space** (`　`, U+3000) is not `\s` in every regex flavour.
- **No word boundaries.** Japanese and Chinese often run together with no
  spaces, so whitespace tokenisation fails outright. This is root cause 3 in
  [06-matching](06-matching.md).
- **Katakana length marks.** `ー` versus `-` versus `‐` are visually similar and
  distinct in code.
- **Mixed scripts.** A single title routinely contains kanji, katakana, Latin,
  and digits.

## Project terms

| Term | Meaning |
|---|---|
| **Oracle Value** | Our published mark for a part |
| **Comp** | A comparable realized sale used to compute the mark |
| **Corridor** | A country-market pairing we ingest, e.g. Mercari JP |
| **Source mask** | Bitmask of enabled sources for a mark |
| **Observation** | One raw listing or sale as ingested |
| **Match** | A resolved link from an observation to a part |
| **L0–L3** | Catalog, ingest, oracle, web layers — [03-architecture](03-architecture.md) |

---

See also: [04-data-model](04-data-model.md) · [06-matching](06-matching.md)

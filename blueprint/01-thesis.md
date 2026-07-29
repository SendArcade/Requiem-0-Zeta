# 01 — Thesis

[← Blueprint index](README.md) · Next: [02-landscape](02-landscape.md)

## The problem

Beyblade has a real secondary market with no price discovery. Takara Tomy
under-produced Beyblade X badly enough to issue a public apology in May 2026,
and scalpers moved into the gap. A lottery-exclusive Hover Wyvern went from
roughly $70 CAD in late 2025 to over $400 at importers. Buyers have no way to
know whether a price is fair, because the liquidity is fragmented across
Japanese, Taiwanese, and Hong Kong marketplaces in three languages.

Trading cards solved this. ALT.xyz publishes a daily fair-market value per card
and shows the comps behind it. Beyblade has nothing equivalent.

## The product

**One trusted mark per Beyblade product, with the evidence attached.**

1. A canonical catalog of **whole Beyblades** — complete tops, starter sets,
   special packages, and mint/sealed boxes — across every generation.
2. Sold comps ingested from the marketplaces where liquidity actually lives.
3. An **Oracle Value** — a robust central estimate plus an honest range for the
   **whole unit**, not a sum of part medians.
4. **Source toggles**, so a user in Taipei can price against Shopee TW while a
   collector in Osaka prices against Mercari JP.

The comps table is not a supporting detail. It is the product. A mark nobody
can audit is a number nobody will trust.

## Why whole Beyblades, not part sums

Most market listings — especially on eBay and in vintage — sell **complete
products**: a loose complete top, a starter set, a lottery box, a Metal Fight
takara tomy package. Special sets and mint boxes carry premiums that **cannot**
be recovered by adding part medians.

Part-level data still matters **inside the engine** (bill of materials, match
validation, completeness checks), but the **published asset** is the whole
Beyblade graded as one unit — e.g. complete loose in box, mint sealed, used
complete.

**All four generations equally:** Plastic, Metal Fight, Burst, and Beyblade X
each get the same catalog depth, ingest coverage, and Oracle Value treatment.
No generation is deprioritized — a Hover Wyvern lottery box and a sealed Driger
box matter as much as a complete X starter.

Multi-item lots (20 tops, stadium bundles) are still rejected — one comp must
be one product SKU. See [06-matching](06-matching.md).

## What we copied, and from whom

| Pattern | Source | Why |
|---|---|---|
| One platform mark plus labeled comps | ALT.xyz | Users trust a number they can audit |
| Include/exclude sources for your own estimate | Card Ladder | Regional markets price differently |
| Layered catalog → ingest → signal → UI | PokeDao | Scrapers can break without touching valuation |
| Provider interface per marketplace | tcg_mcp | Swapping venues must not rewrite the core |

ALT is the UX reference. It is closed source with no public API, so we borrow
the shape, not the code. Details in [03-architecture](03-architecture.md) and
[docs/ATTRIBUTIONS.md](../docs/ATTRIBUTIONS.md).

## Non-goals for v1

Deliberately out of scope. Every one of these has been considered and rejected
for now, and the reasoning is in [09-decisions](09-decisions.md).

- Marketplace, checkout, escrow, vault
- Social features: battle maps, tournaments, chat, player profiles
- Photo-based part identification
- Part-level public marks (parts stay internal to the engine)
- Facebook and Discord scraping

## What success looks like

A collector pastes a Beyblade or set name, sees a defensible whole-unit number,
sees the sales behind it, flips off the source they do not trust, and watches
the number move. If we can do that reliably across Plastic, Metal, Burst, and X,
the product works.

Everything else is a distraction until match accuracy is fixed.

---

See also: [02-landscape](02-landscape.md) · [09-decisions](09-decisions.md) · [10-roadmap](10-roadmap.md)

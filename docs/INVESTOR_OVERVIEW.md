# RIPBEYS and Requiem-0-Zeta

One product. Two names for the same system. Figures from the project notes are the note. Figures from the catalogue and the production Oracle are the product. The note’s market numbers were not re-audited. They are not prices in the app.

Showroom: https://web-production-2507a.up.railway.app
This brief on the site: https://web-production-2507a.up.railway.app/docs

## One product

Requiem-0-Zeta is the whole system. RIPBEYS is not a second catalogue or a second price. It is the public showroom. BeyOracle is the price inside that system: the median of sold comps for one whole Beyblade, across Plastic, Metal, Burst, and X.

The engine owns identity, ingestion, workers, Postgres, and the APIs. The showroom owns the catalogue a person browses, the 3D model, the Lab, and the page they read. A listing id such as bx-002 only points at a Bey in the showroom. The price is allowed only after that id is bridged to a confirmed product or part. bx-002 is Dran Dagger 4-60R. It is not BX-02 Wizard Arrow. Wizard Arrow is listing bx-205.

A card shows a yen figure only when that whole product returns a number. An empty Oracle says the data is insufficient. It does not print zero, and it does not add a blade, a ratchet, and a bit into a substitute. A part mark stays on its own page and is labeled a part mark. The site does not transfer ownership.

## What we have built

The catalogue is one seed for all four generations: about 1,105 parts (Plastic 154, Metal 164, Burst 576, X 211) and 448 products (Plastic 85, Metal 119, Burst 86, X 158).

Sold listings are ingested from Mercari Japan and Yahoo Auctions Japan. Shopee Taiwan is partial. Lots and bundles are rejected. A kept title is matched to a product at an accept floor of 0.9, and the sale keeps its source and its listing link. The mark is the median, in yen. The band is the middle half of the sales. The default pool is used, like new, and unknown. Sealed boxes are separate. Fewer than three comps is not a confident published whole-Bey price.

The showroom holds 578 listings. 26 may ask for a whole-Bey mark. 104 may ask for a blade or layer mark, which is never the Bey’s price. 448 are not fetched, including 18 assembled X Beys with parts but no complete product. On 30 September 2026, 12 products returned a yen median, which qualified 14 listings because two products are shared by two ids. That count moves. Dran Dagger can return empty on a successful request, and the page says so.

The Bey page and the Lab load the recovered model for that listing. Catalogue cards play a spin of the same file. A missing file shows a poster. It does not crash, and a drawn stand-in is not passed off as the real Bey. The chart is the sold history: rolling median, each sale, the current mark, and the band. Source and condition controls recompute stored comps. They do not invent a sale. Names are the confirmed catalogue names. Four Dagger Dran rows that are a different combo, a partial recipe, or a UI piece stay unmatched.

| Built and running | Written down, not yet shipped |
|---|---|
| Catalogue, matcher, sold comps, median, and band | L10–L3 certificates and buyback rates |
| Showroom, live model, chart, and docs | A vault, a checkout, or an onchain market |
| Whole-Bey prices on the public grid | The $5,000 buy plan and its planned totals |
| Source and condition controls | Time-weighted marks and a Japan versus Taiwan price |

## Why this approach works

This section is the project note, separate from the build.

**Demand is already here.** The note puts Beyblade X at about 30 million units shipped by April 2025, about 18 months after the July 2023 Japan launch, in about 79 regions. It cites Circana, via Takara Tomy, for X as the number-one battling-toy property in 11 markets including the United States in 2024, and a Hasbro set as the top action-figure item in Canada that year. TOMY’s fiscal 2024 report describes popularity across ages and tournaments with no age limit. A US national event for ages 13 and up feeds a world championship. Primary demand is not the missing piece.

**The layer after the boom is missing.** The note puts cards near $15.8 billion, with about 32 percent of TCG retail online, about 71 percent of grading submissions online, an authentication market near $2.2 billion, and tokenized Pokémon card volume around $124 million in a month. Beyblade secondary trade is still Mercari, Yahoo, Shopee, and Facebook. No shared index, no vault, about zero onchain volume. Cards wrapped a vault, an oracle, and a marketplace after demand was already large. Beyblade has not.

**The claim is infrastructure, not the next Pokémon.** The note does not say Beyblade becomes Pokémon-sized. It says pricing, authentication, a vault, and liquidity can grow five to ten times from near zero as X pulls Metal, Plastic, and Burst into one pool, the way ALT’s market expanded with cards, and can at least compete with a market the size of Hot Wheels.

**Taiwan is the preview.** UX-03 Wizard Rod in the note: about NT$295 retail and about NT$2,500 on Shopee, lots at 3 to 8 times, overnight lines of 200 to 300, spend of about NT$40,000 to NT$100,000 in months, and 458 scam cases with about NT$22.9 million in losses through July 2025. Scalping and fraud show up when there is no reference price. Wizard Rod is in the catalogue. No showroom listing is bridged to it, so that resale figure is not its Oracle value.

**The price is a whole Bey.** A sale is one SKU: complete loose, starter, or sealed box. Packaging and completeness disappear if part medians are added together. Sold prices only. All four generations, same bar. That is the difference from an oracle built for single cards.

**Grading stays greenfield until it is real.** There is no PSA for Beyblade. The note writes authentication first, sealed codes S10–S7, and a loose score out of 100 with buyback from 80 percent to none. The live product uses sealed, like new, used, and unknown so those pools do not share one median. It does not issue the letter grade. The index is the sold comps. The certificate waits until authentication is real.

A separate note is a $5,000 plan for about 309 whole Beys. Those planned totals are not in the database and are not on the cards.

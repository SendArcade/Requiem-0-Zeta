# RIPBEYS / BeyOracle — product brief

For an investor conversation. Figures drawn from the project notes (RIPBEYS, Pricing, Grading, Seed inventory) are marked as the note. Figures drawn from the running catalogue and the production Oracle are marked as the product. The note’s market numbers were not re-audited against Circana, Takara Tomy, or Taiwanese news. They are not prices in the app.

Live showroom: https://web-production-2507a.up.railway.app
Docs on that site: https://web-production-2507a.up.railway.app/docs

## The product in one paragraph

BeyOracle is a sold-comp price index for whole Beyblades, across Plastic, Metal, Burst, and X. RIPBEYS is the public showroom for that index: the Bey, the 3D file, the recipe, and the mark. One product. One catalogue. One Oracle. A card shows a number only when a confirmed whole Bey has enough sold comps. If it does not, the page says the data is insufficient. It does not invent a price, and it does not add up the prices of the parts.

## Why this can work

Primary Beyblade demand is already mainstream. The collectibles infrastructure around it is not.

Beyblade X has shipped on the order of 30 million units worldwide, in about 18 months from the July 2023 Japan launch, across dozens of regions. The note cites Circana, via Takara Tomy, for Beyblade X as the number-one battling-toy property in 11 markets including the United States in calendar 2024, and a Hasbro Xtreme Battle Set as the number-one item in Canada’s action-figure supercategory that year. TOMY’s fiscal 2024 report describes Beyblade X as popular across ages, with tournaments that are not age-limited. A US national tournament for ages 13 and up at Anime Expo 2025 feeds a world championship. Earlier generations never had adult competitive positioning at this scale.

What does not exist yet is the layer cards already have: a shared price, a trusted grade, a vault, and a place where those three meet. Card retail is roughly a third online. Grading submissions are majority digital. Platforms in the shape of ALT wrap a vault, an oracle, and a marketplace. Beyblade secondary trade is fragmented across Mercari, Yahoo Auctions, Shopee, and Facebook. There is no published secondary-market size for Beyblade X. The note’s comparison set is not “Beyblade becomes a $15.8 billion trading-card market.” It is “the infrastructure market around Beyblade — pricing, authentication, vault, liquidity — can grow several times from near zero,” the way ALT’s addressable market expanded once the index existed, and can at least compete with a category the size of Hot Wheels. Plastic, Metal, Burst, and X collectors get pulled into one pool instead of four hobbies.

Taiwan is the early read. When supply cannot match hype, the gray market prices itself. The note’s example is UX-03 Wizard Rod: about NT$295 retail and about NT$2,500 on Shopee, popular lots reselling at several times retail, overnight lines of a few hundred people, players spending on the order of one to three thousand US dollars in months, and 458 Beyblade-related online scam cases with about NT$22.9 million in losses through July 2025. That is the pattern cards showed before a grade and an index: scalping, trust gaps, no reference price. Demand arrived first.

The product is that missing reference. The edge versus a card oracle is the object. A Beyblade mark is a whole product — complete loose top, starter, or sealed box — not a slabbed single and not the sum of a blade, a ratchet, and a bit. Packaging and completeness are the price. The catalogue treats all four generations at the same evidence bar.

## What BeyOracle is

BeyOracle is the engine. It is already running.

It holds the canonical catalogue: about 1,105 parts (Plastic 154, Metal 164, Burst 576, X 211) and 448 products (Plastic 85, Metal 119, Burst 86, X 158). Parts are how the engine understands a Bey. The public mark is the whole product.

It ingests sold listings. Mercari Japan and Yahoo Auctions Japan are live. Shopee Taiwan is partial. Ruten, Suruga-ya, eBay, Mandarake, and Rakuma are named as next or planned and are not all feeding the mark. Workers poll, keep newly sold rows, and throw out lots and bundles. Those bundles are a large share of raw listings and must never become comps.

A kept listing is matched to a catalogue SKU. The matcher’s auto-accept floor is 0.9. Anything that does not clear that, or that is a bundle, does not become a comp. Every kept observation stores the source and a link back to the listing.

The Oracle mark is the median of those sold prices, in yen, over the default window. The band is the interquartile range, the middle half of the sales. Median is used instead of the mean so one extreme sale does not drag the number. The default pool is used, like new, and unknown. Sealed boxes are a separate pool, so an unopened product is not averaged with a played one. Fewer than three comps is not published as a confident mark. Zero comps is an explicit empty state.

On the BeyOracle pages (`/requiem`, `/product/{id}`, `/asset/{id}`) a person can see the mark, the band, the sold table, and the history chart, and can include or exclude sources and conditions. Those toggles recompute stored comps. They do not start a new scrape, and they do not fill a hole with a guess.

The database that holds this is Railway Postgres. The laptop is not a second pricing database.

## What RIPBEYS is

RIPBEYS is the consumer experience on the same site.

The catalogue shows a Bey only when the Product Oracle returns a number. The Bey page shows one live 3D model, the recipe (blade or layer, ratchet, bit), and the same history chart BeyOracle uses: rolling median, each sale as a dot, the current mark, and the band, across one month, three months, six months, one year, and all. The Lab is that model, set up to inspect. Drag orbits. Scroll zooms. If the file is missing, the page shows a poster. It does not crash.

The nav is Home, Beys, Lab, Docs, Catalogue. Docs is this system, written down on the site.

## How a price gets onto a card

1. A listing id, such as `bx-002`, is the showroom’s handle for one Bey. It is not a product code.
2. A bridge says whether that listing is a confirmed whole product, a confirmed part, or neither. The digits in `bx-002` are never read as `BX-02`.
3. A whole product calls `/api/product/{requiem product id}`. A part calls `/api/asset/{requiem part id}`. No bridge means no call.
4. A numeric median is the mark. Null is “insufficient data.”
5. Only whole-product marks appear on the public catalogue. A blade or layer mark stays on its own page and is labeled as a part mark.

`bx-002` is Dran Dagger 4-60R, product `prod-x-dran-dagger-4-60r-complete-loose`, pack code BX-20. Wizard Arrow is a different Bey, listing `bx-205`, code BX-05. Attaching Dagger Dran to BX-02 would price the wrong object. That mistake is refused on purpose.

## What is already built

**Catalogue and match.** Four generations in one seed. A matcher that scores a sold title onto a product, with eval coverage on labeled titles. Live probes have been run against Mercari and Yahoo. Bundles are excluded.

**Oracle.** Median, interquartile band, confidence, source, condition, per-observation provenance. Product pages and part pages. A history chart. A low-confidence warning. A retail reference shown as a shelf price when the sold mark is missing or thin, never as if it were a sold comp.

**Showroom.** 578 RIPBEYS listings on disk. 26 may ask for a whole-Bey mark. 104 may ask for a part mark. 448 are not fetched, including 18 assembled X Beys that have parts but no complete-product seed. On 30 September 2026, 12 products among those 26 returned a yen median. Two products are shared by two listing ids, so 14 listings qualified that day. That number moves when comps move. Empty products, including Dran Dagger on that date, stay hidden from the grid and say insufficient data on their own page.

**3D.** Recovered models keyed by listing id. The Bey page and the Lab load one live model. Catalogue cards use a recorded spin of that same file, so the grid does not open hundreds of WebGL contexts. Five files are shared because two listing ids are the same Bey, including Phoenix Wing 9-60GF. Missing files do not crash. New geometry has not been invented to fill gaps. Where a filename does not clearly match the name, the pair stays unverified. Arc (4-55LO) with `arc_wizard.fbx` is the open example. It was not guessed into a new name.

**Identity discipline.** Names on the cards are the confirmed Requiem English names. Hasbro and Takara word order can differ and still be the same Bey. Four Dagger Dran rows that are a different combo, a partial recipe, or a UI piece stay unmatched. They are not quietly priced as the main Dran Dagger.

**Docs.** Pricing, catalogue, Oracle links, models, grading, and the seed plan are on `/docs`, in the product’s own voice, including what is written down and not yet built.

## What is specified and not yet the product

**Grading.** There is no PSA for Beyblade. The note writes the greenfield: authenticate first (box code, shrink, print, beycode QR on X, mold, screw type, weight within about 8–10 percent of the catalogue reference). Weight never overrides a mold check. Sealed boxes are S10 down to S7. A loose Bey is six scores out of 16 — completeness, stickers, contact wear, performance surfaces, structure, and weight — totaled out of 100, then banded from L10 Gem to L3 below the pool, with buyback rates from 80 percent down to none. The live Oracle does not issue that certificate and does not pay those rates. It sorts comps into sealed, like new, used, and unknown, which is the direction of that scale, not the scale itself.

**Seed inventory.** A separate note is a $5,000 off-platform buying plan: sort lots into about 309 whole Beys, about $4,480 of product spend, a planned Oracle total near $9,440. Lots themselves are never listed. X is the volume baseline, Metal the planned lot return, Plastic and HMS the collector hook. If a gacha pull hits a Bey that only exists as someone else’s listing, the note says buy that listing and ship it. None of those dollars are in the database. None of them appear on cards. The 448 products and 1,105 parts are the catalogue. The 309 is a purchase plan.

**Later pricing.** Landed-yen at the exchange rate on the day of sale, heavier weight on recent sales, outlier control, a generation index so a sparse Bey can lean on its cohort, and a Japan price next to a Taiwan premium. The note also allows a flagged mark at one or two comps. The live floor is three. The later methods are not the current median.

**Not in this version.** Ownership transfer, a vault that holds stock, onchain settlement, and a checkout. The site says so on the Bey page. The public X feed route is implemented on an old server and is not served by the production web process.

## How to read a Bey in the demo

Open the catalogue. Every card there has a live whole-Bey median. Open one. The model is that listing’s file. The recipe is the parts. The chart is the sold history. The link under the identity goes to the BeyOracle product page for the canonical id, not to a URL built from the listing number. Open a Bey whose mark is empty, such as Dran Dagger when its product Oracle is null, and the page stays honest.

## The claim

The primary market has already arrived. The reference price has not. BeyOracle is that reference for the whole Bey, built from sold comps, across every generation, and RIPBEYS is the way a collector sees the Bey and the number together. The grade, the vault, and the inventory plan are the next layers. They are written down. They are not being pretended into the prices that are on the site today.

export type DocBlock =
  | { kind: 'p'; text: string }
  | { kind: 'h2'; text: string }
  | { kind: 'ul'; items: string[] }
  | { kind: 'table'; headers: string[]; rows: string[][] }
  | { kind: 'note'; text: string }

export type DocPage = {
  slug: string
  group: string
  title: string
  lede: string
  blocks: DocBlock[]
}

export const docPages: DocPage[] = [
  {
    slug: 'overview',
    group: 'Start',
    title: 'What this is',
    lede: 'RIPBEYS is the public showroom for one product. Requiem holds the catalogue, the sold comps, and the Oracle. A number on a card is a confirmed whole-Bey mark, or the card does not pretend to have one.',
    blocks: [
      { kind: 'h2', text: 'The gap the project is for' },
      {
        kind: 'p',
        text: 'Beyblade’s primary business is in its most mainstream stretch. Beyblade X has shipped tens of millions of units, it ranks as a leading battling-toy property in multiple markets, and tournaments are open to adults in a way earlier generations were not. The online and onchain collectibles layer around that demand is still near zero. Trading cards already went through this: retail moved online, grading became a digital submission, and vaults wrapped a price index, storage, and a marketplace. Beyblade still trades as scattered person-to-person listings on Mercari, Yahoo Auctions, Shopee, and Facebook, with no shared price, no shared grade, and no vault.',
      },
      {
        kind: 'p',
        text: 'The project note compares that with cards at a different scale. It cites a trading-card market around $15.8 billion, Pokémon retail above $2 billion, roughly a third of TCG retail online, and a large authentication-services market. It cites tokenized Pokémon card volume in the hundreds of millions of dollars a month, against about zero institutional or onchain Beyblade volume. It does not claim Beyblade becomes Pokémon. It claims the infrastructure around Beyblade — pricing, authentication, a vault, and liquidity — can grow several times from near zero as X pulls Metal, Plastic, and Burst collectors into one secondary pool. The note says that infrastructure can at least compete with a market the size of Hot Wheels. Those figures are the note’s thesis. They are not Oracle marks, and they are not printed as prices in the catalogue.',
      },
      { kind: 'h2', text: 'What the site is' },
      {
        kind: 'p',
        text: 'Requiem is the system of record. It owns the catalogue, the canonical product and part identity, the sold comps, the Oracle median, ingestion, and the database. RIPBEYS is the way a person looks at that system: the catalogue, the Bey page, the Lab, and the model. There is one marketplace and one Oracle. Listing stickers, part sums, and guessed numbers are not a second price.',
      },
      {
        kind: 'p',
        text: 'Taiwan shows up in the note as an early read of what happens when hype outruns supply. The example is UX-03 Wizard Rod: a low retail price, a much higher Shopee resale, overnight lines, heavy spend on chase units, and hundreds of Beyblade scam cases. The note treats that as the same pattern cards hit before a grade and a price index existed. Demand arrived first. The infrastructure did not. Wizard Rod is a real Requiem product, prod-x-ux-03-complete-loose, combo 5-70DB. No RIPBEYS listing is bridged to it, and the Taiwan resale figure is not shown as its Oracle value.',
      },
      { kind: 'h2', text: 'Three identities, kept apart' },
      {
        kind: 'p',
        text: 'A listing id such as bx-002 chooses the card, the name on that card, and the 3D file. It is a presentation id. It is not a Takara or Hasbro product code. bx-002 is Dran Dagger 4-60R, canonical product prod-x-dran-dagger-4-60r-complete-loose, pack code BX-20. Wizard Arrow 4-80B is a different listing, bx-205, on BX-05. The digits in bx-002 do not mean BX-02. BX-02 on the seed is a Wizard Arrow blade, not Dran Dagger.',
      },
      {
        kind: 'ul',
        items: [
          'The listing id picks the showroom object and the mesh. It never builds an Oracle URL.',
          'The Requiem product id or part id is the only identity that may be priced. A product mark is the whole Bey. A part mark is a blade or a layer, and the page says so.',
          'The visual map picks the model and the poster for that listing id alone. A missing model shows a poster or “No preview”. It does not crash, and it is not replaced with a drawn stand-in.',
        ],
      },
      { kind: 'h2', text: 'Where a visitor lands' },
      {
        kind: 'table',
        headers: ['Place', 'What it is for'],
        rows: [
          ['Home', 'The entrance. The crew section still lives here. Docs is the nav item, not a replacement for that section.'],
          ['Catalogue', 'Only Beys whose Product Oracle currently returns a number. Part marks stay off this grid.'],
          ['Bey page', 'One live model, the recipe, and the BeyOracle chart: median line, sold dots, current mark, and the band.'],
          ['Lab', 'The same mesh, set up to turn and inspect.'],
          ['Docs', 'These rules, including where a written plan is not yet the live site.'],
        ],
      },
      {
        kind: 'note',
        text: 'If the Oracle has no number, the page says the data is insufficient. It does not print zero, and it does not borrow a nearby Bey’s price.',
      },
    ],
  },
  {
    slug: 'pricing',
    group: 'Start',
    title: 'Pricing',
    lede: 'The mark is the median of sold prices for one whole Beyblade. The band is the middle half of those sales. Asking prices, part prices, and empty responses are not that mark.',
    blocks: [
      { kind: 'h2', text: 'One SKU, never a sum of parts' },
      {
        kind: 'p',
        text: 'A public price is for one whole product: a complete loose top, a starter, or a sealed box. Packaging, completeness, and rarity live in that sale. They disappear if you median each wheel on its own and add the medians up. A mint Driger box or a sealed beycode is not “blade plus ratchet plus bit”. Parts exist inside the engine as a bill of materials. They are not the number on a catalogue card.',
      },
      {
        kind: 'p',
        text: 'The same rule throws out the listings that are not one Bey. Multi-lots, bundles, launcher-only sales, and junk lots stay out of the mark. The pricing note treats those as a large share of raw listings, on the order of a third or more, and says they must never become comps. Plastic, Metal, Burst, and X are meant to clear the same quality bar. One generation is not a looser standard.',
      },
      { kind: 'h2', text: 'Sold only' },
      {
        kind: 'p',
        text: 'A comp is a realized sale, the same idea as a confirmed paid comp rather than an asking price. Mercari Japan and Yahoo Auctions Japan are the live feeds. Shopee Taiwan is partial: a demand signal, used as a sold comp when a sold price is actually there. Ruten, Suruga-ya, eBay, Mandarake, and Rakuma are named as next or planned. They are not all feeding the mark today. Suruga-ya, in the note, is a dealer ask and a buyback floor, which is a reference, not a sold comp, until a sale is stored.',
      },
      {
        kind: 'table',
        headers: ['Market', 'Role in the note'],
        rows: [
          ['Mercari Japan', 'Live. Person-to-person sold listings. Condition often sits in the title.'],
          ['Yahoo Auctions Japan', 'Live. The main Japan closed-auction feed.'],
          ['Shopee Taiwan', 'Partial. Taiwan demand, comps only when a sold price exists.'],
          ['Ruten', 'Next. Taiwan auction sales and the import spread.'],
          ['Suruga-ya', 'Next. Dealer ask and a buyback floor, not yet a sold-comp source.'],
          ['eBay', 'Next. Western sealed and complete-set sales.'],
          ['Mandarake and Rakuma', 'Planned. Vintage whole tops from Plastic through X.'],
        ],
      },
      { kind: 'h2', text: 'How a sale becomes a comp' },
      {
        kind: 'p',
        text: 'The flow is sources, then ingest, then match, then an Oracle mark, then the page. Workers poll the live sources. Newly sold listings are collected. Lots and bundles are rejected. What remains is matched to a catalogue product, not to “unknown”, and not by assuming a RIPBEYS number equals a product code. Each observation keeps its source and its listing URL. The Oracle is then recomputed from the stored comps. The site and any watchlist read that result. They do not recalculate it in the browser.',
      },
      {
        kind: 'ul',
        items: [
          'The sale has to be realized. An active listing’s ask never enters the median.',
          'It has to be one whole product. A summary lot does not.',
          'The match has to clear the accept floor, 0.9 in the shared matcher, and land on a product SKU.',
          'The default window in the note is 90 days. Older sales fall out of that pool.',
          'Provenance stays on the row: where it sold, and a link back to the listing.',
        ],
      },
      { kind: 'h2', text: 'The mark itself' },
      {
        kind: 'p',
        text: 'The mark is the median, not the mean. A single very expensive sale should not drag the whole number. The band is the interquartile range, the 25th percentile through the 75th. Currency is yen by default, and display can convert it. Confidence follows how many comps are in the pool. The note’s tiers are five or more for high, three or four for medium, one or two for a sparse flagged mark, and zero for no mark. The live publish floor is three comps. Below that, the site does not present a confident whole-Bey price. An empty Oracle comes back as insufficient data. It is not filled in.',
      },
      {
        kind: 'table',
        headers: ['Comps', 'What the note says', 'What the site does'],
        rows: [
          ['5 or more', 'High confidence, full mark, tight band', 'The number can show, with its band and comp count'],
          ['3 or 4', 'Medium confidence, wider band', 'Eligible for a published mark'],
          ['1 or 2', 'Show a mark and flag it as sparse', 'Not a separate published state. The publish floor is 3'],
          ['0', 'No mark', 'Insufficient data. No invented number'],
        ],
      },
      { kind: 'h2', text: 'Condition before the median' },
      {
        kind: 'p',
        text: 'Sales are split into a condition pool before the median is taken, so a sealed box and a played top do not share one number. The default public mark uses used, like new, and unknown. Sealed comps stay out of that pool, because an unopened box is a different product risk. A sealed SKU uses the sealed pool on its own. On a Bey page, source and condition pills recompute the stored comps. They do not start a new scrape, and the last remaining source or condition cannot be turned off. If the response has no numeric value, the control does not manufacture one.',
      },
      { kind: 'h2', text: 'What is written down and not shipped' },
      {
        kind: 'p',
        text: 'A later version in the note would normalize landed yen with the exchange rate on the day of the sale, weight recent sales more heavily, drop outliers, build a generation index so sparse products can borrow strength from their cohort, shrink a mark toward that cohort when the count is tiny, and show a Japan price next to a Taiwan premium. None of that replaces the current median. The chart on the Bey page draws the comps the API already returned: a rolling median, each sale as a dot, a dashed line at the current mark, the band behind them, and ranges of one month, three months, six months, one year, and all.',
      },
      {
        kind: 'note',
        text: 'On 30 September 2026, 12 product ids among the 26 product-bridge listings returned a yen median. Two of those products are shared by two listing ids, so 14 listings qualified. That count moves when new comps land. It is not a fixed catalogue size.',
      },
    ],
  },
  {
    slug: 'catalogue',
    group: 'Identity',
    title: 'Catalogue',
    lede: 'Every listing stays in the archive data. The public grid shows only the ones whose whole-Bey Oracle currently has a number. The other counts are different facts, and they are not interchangeable.',
    blocks: [
      { kind: 'h2', text: 'The counts' },
      {
        kind: 'p',
        text: 'There are 578 RIPBEYS listings. That is the full presentation inventory: X and Burst cards, names, and the files attached to those ids. Twenty-six of them are allowed to ask the Product Oracle for a whole-Bey mark. One hundred and four are allowed to ask for a part mark, a blade or a layer, which is never displayed as the price of the complete Bey. Four hundred and forty-eight are not fetched at all. Inside that last group, 18 are assembled X Beys that already have parts but do not yet have a canonical complete-product seed. They stay unpriced until that product exists. They are not given a made-up product id.',
      },
      {
        kind: 'table',
        headers: ['Count', 'What it counts'],
        rows: [
          ['578', 'Listing records. All of them remain addressable at /market/{id}.'],
          ['26', 'Listings whose bridge says product. They may call /api/product.'],
          ['104', 'Listings whose bridge says part. A blade or layer mark only.'],
          ['448', 'Listings with no Oracle fetch, including the 18 assembled X Beys with no product seed.'],
          ['14', 'Listings that had a numeric product mark on 30 Sep 2026. This is a live result, not a quota.'],
        ],
      },
      {
        kind: 'p',
        text: 'The catalogue used to treat any numeric response, including a part mark, as “this Bey has a price”. The card then refused to show that part number and looked blank. A part number was both leaking into the published set and still unreadable as a Bey price. The grid now asks only for product-eligible listings, and only keeps a card when that response is a number. Search uses the Requiem name, not only the old RIPBEYS label.',
      },
      { kind: 'h2', text: 'Names' },
      {
        kind: 'p',
        text: 'The title on a card and on a Bey page is the confirmed Requiem English name when one exists. Hasbro and Takara often swap the word order. Soar Phoenix and Phoenix Wing are the same Bey when they share a product id. Tail Viper and Viper Tail are the same idea. The listing keeps its id either way. The seed’s short names are repeated as written. Arc (4-55LO) and Dark (6-80W) were not expanded into longer trade names, because a longer name would have been a guess. The model files next to those two are arc_wizard.fbx and dark_perseus.fbx. The filename is noted. The display name was not rewritten to match the filename.',
      },
      { kind: 'h2', text: 'Conflicts that stay open' },
      {
        kind: 'p',
        text: 'Four Dagger Dran rows are conflicts and have no product id, so they have no Oracle. bx-231 is a 4-70Q combo, which is not the 4-60R Dran Dagger product. bx-275 names Dagger Dran 4-60R but lists only the ratchet and bit, with no blade. bx-274 and bx-276 are user-interface pieces of that same file, not a complete Bey. Leaving them unmatched is the correct state. Silently attaching them to bx-002 would price the wrong object.',
      },
      {
        kind: 'note',
        text: 'Adding a listing is safe only when its number is not copied onto a Requiem code, its mesh is filed under that listing id, and the bridge is recorded as confirmed, ambiguous, or unmatched. Unmatched stays unavailable.',
      },
    ],
  },
  {
    slug: 'oracle',
    group: 'Identity',
    title: 'Oracle links',
    lede: 'Each Bey page resolves one canonical identity, calls that identity’s API, and links to the BeyOracle page for the same id. The listing number is never the link.',
    blocks: [
      { kind: 'h2', text: 'The chain' },
      {
        kind: 'p',
        text: 'The page starts from the RIPBEYS listing. The bridge says whether that listing is a product, a part, or neither. A product listing calls GET /api/product/{requiemProductId}. A part listing calls GET /api/asset/{requiemPartId}. A listing with neither does not call at all. The response is the mark, the band, the comp count, the confidence, the date, and the sold rows behind the chart. The browser does not compute a median of its own.',
      },
      {
        kind: 'ul',
        items: [
          'Product pages link to /product/{requiemProductId}. That is the BeyOracle product page on this same site.',
          'Part-only pages link to /asset/{requiemPartId}. The chart is titled as a part mark, and it says it is not a whole-Bey price.',
          'A product listing may also list the blade, ratchet, and bit. The chart still uses the product, not the blade.',
        ],
      },
      { kind: 'h2', text: 'What the chart shows' },
      {
        kind: 'p',
        text: 'The history chart matches the BeyOracle price history. Each sold comp is a point. A line is the rolling median of prices in date order. A dashed line marks the current published mark. A shaded band is the interquartile range. The ranges are one month, three months, six months, one year, and all, with six months as the default. The tooltip shows the date and the yen figure. Under the chart, the sold table lists date, source, price, condition, how the listing was matched, the evidence, whether it was in the mark, and a link to the listing. A live event for a new sale refreshes that view. A watchlist account is BeyOracle’s, and it is not copied into this consumer.',
      },
      {
        kind: 'p',
        text: 'Low confidence is said out loud when the comp count is under the publish minimum, or when the payload itself says confidence is low. If a retail reference is present and the mark is missing or thin, the page can show that shelf price in dollars and label it as a shelf price, not a sold comp. Source pills and condition pills change the query. They cannot be cleared down to an empty set.',
      },
      { kind: 'h2', text: 'An example of a correct non-link' },
      {
        kind: 'p',
        text: 'Dran Dagger’s product endpoint can return HTTP 200 with an empty Oracle. That is an honest empty mark, not a broken page and not a license to show a part price instead. Wizard Rod’s product exists in the seed and is the note’s Taiwan example. Because no listing bridge points at prod-x-ux-03-complete-loose, the showroom does not display a Wizard Rod card with the Shopee resale typed in as if it were the median.',
      },
      {
        kind: 'note',
        text: 'The X feed route /api/x/feed exists on an unused Express server. The production web process does not serve it, so the landing strip can 404. Copying that scraper onto the Oracle process was not done.',
      },
    ],
  },
  {
    slug: 'models',
    group: 'Identity',
    title: '3D models',
    lede: 'The model is the recovered file stored for that listing. If the right file is not on disk, the page says so. A new sculpt is not passed off as the real Bey.',
    blocks: [
      { kind: 'h2', text: 'How a mesh is chosen' },
      {
        kind: 'p',
        text: 'visual-assets.json is keyed by listing id. The Bey page asks that map for the assembled model and uses it only when the map says the file is on disk. The Lab uses the same path. A catalogue card does not open a WebGL context for every Bey in the archive. It plays a spin recorded from that mesh, and falls back to a poster. The spin is a preview of the file. It is not a different identity. Placeholder waiting images are skipped in favor of that spin when a model exists.',
      },
      {
        kind: 'p',
        text: 'Five assembled paths are shared by two listing ids because those ids are the same Bey, not because one Bey was pointed at another’s mesh. Phoenix Wing 9-60GF is both bx-003 and bx-201, and they share the starter file. Mammoth Tusk, Knife Shinobi, and the green Dranzer do the same. Sword Dran is shared by bx-001 and bx-202. bx-001 is not a product-priced listing. Sharing a file is recorded. It is not treated as a mistake when the names are the same Bey.',
      },
      { kind: 'h2', text: 'What “the filename agrees” means' },
      {
        kind: 'p',
        text: 'An automated check compares distinctive words in the display name with the filename. Dran Dagger against dagger_dran.fbx agrees. That is not someone opening the file in a viewport and certifying every vertex. Where the words do not overlap, the row stays unverified. Burst files often use a Hasbro spelling, such as Valtryek or a misspelled Achilles, next to a Takara display name for the same layer. Those were not remapped from a guess. Brave Valtryek is a later Bey and is not substituted for an earlier Valtryek just because both names contain Valtryek.',
      },
      {
        kind: 'p',
        text: 'Arc is the clearest open case. The seed name is Arc (4-55LO). The file is arc_wizard.fbx, and separate Arc piece files exist for other listing ids. The assembled file was left where it is. Renaming the seed, or swapping the mesh for a generated one, would claim a certainty the files do not give. Disk also holds piece meshes that are not the assembled listing model. Those extras are not assigned to a product by similarity of the filename.',
      },
      { kind: 'h2', text: 'Where it runs' },
      {
        kind: 'ul',
        items: [
          'The Bey page keeps one interactive viewer: drag to orbit, scroll to zoom, a poster if the model fails.',
          'The Lab is the same viewer, opened from the Bey page with that listing id.',
          'The catalogue refuses a WebGL context per card. Hundreds of contexts at once is how the grid dies.',
          'Reduced motion pauses animated layers. It does not skip drawing the hero, or the hero stays black.',
        ],
      },
      {
        kind: 'note',
        text: 'The hero “Models” figure is the count of listing rows flagged as having a model, currently 578. An older snapshot said 378. That older number was not written back over the current count.',
      },
    ],
  },
  {
    slug: 'grading',
    group: 'Rules',
    title: 'Grading',
    lede: 'The grading note is a full authentication and score, from a sealed box down to a loose Bey out of 100. The live Oracle still sorts comps into four condition buckets. Both are described here so they are not mistaken for each other.',
    blocks: [
      { kind: 'h2', text: 'What the note is trying to do' },
      {
        kind: 'p',
        text: 'Cards have PSA. Beyblade does not have an equivalent that the market trusts. The note treats grading as greenfield and writes the flow as intake, then authenticate, then grade, then a certificate, then an Oracle pool and inventory. Authentication comes before a number. A heavy fake and a light real Bey must not share a grade because a scale said they were close.',
      },
      { kind: 'h2', text: 'Authentication' },
      {
        kind: 'p',
        text: 'A sealed piece is checked against the catalogue before it is called sealed. The product code on the box has to match the SKU. Factory shrink and tape have to match the era. Print, font, and color have to be clean. On X, a beycode QR, when the box has one, has to resolve to the expected product. Weight has to sit inside about 8 to 10 percent of the catalogue reference for the assembled unit. That weight check is the same idea on a loose Bey, and it never overrides a mold check. One gram is not authentication.',
      },
      {
        kind: 'ul',
        items: [
          'Loose: mold details, sprue marks, engravings, and the face-bolt logo match the catalogue.',
          'The screw type matches the generation, tri-wing or Phillips.',
          'Metal weight and feel are checked against known counterfeit tells. A light wrong alloy fails even if the sticker looks right.',
          'Sticker print and cut lines are part of the check, not a decoration.',
        ],
      },
      {
        kind: 'p',
        text: 'The note separates three things people mix up. A mold is an intentional production change, and a confirmed one, such as a later Earth mold or a green-plated Ten Heavy, becomes its own catalogue SKU. A variant is manufacturing tolerance inside a mold, and the weight subscore is where a premium can show. Wear is mass lost from play. Wear belongs to the contact-wear score, not to the weight score.',
      },
      { kind: 'h2', text: 'Sealed packaging' },
      {
        kind: 'p',
        text: 'Sealed codes are used when the piece is new in box, mint in box, or open with the original box. The box itself is scored from 0 to 5.',
      },
      {
        kind: 'table',
        headers: ['Code', 'Label', 'Box'],
        rows: [
          ['S10', 'Sealed, new in box', '5. Factory sealed, no dents.'],
          ['S9', 'Mint open box', '4 to 5. Opened once, inserts present.'],
          ['S8', 'Mint in box, complete', '3 to 4. Minor shelf wear.'],
          ['S7', 'Box worn', '2. Creases or fade, contents still mint.'],
        ],
      },
      { kind: 'h2', text: 'Loose condition' },
      {
        kind: 'p',
        text: 'A loose Bey is six scores, each from 0 to 16, totaled out of 100. Completeness asks whether every part is original and the assembly matches the generation. Stickers ask whether the factory stickers are all there and aligned. Contact wear asks whether battle has chewed the surface. Performance asks whether the tip, the ratchet teeth, and the rubber are still legal and usable. Structure asks whether anything is cracked, stripped, bent, or wobbling. Weight, the G score, compares assembled grams to the whole-product catalogue weight, not to a median of loose parts. Fifteen or 16 is a top-decile or a confirmed premium mold. Nine to 11 is the ordinary band. Zero to 5 is the floor, and it sends the piece back for an authenticity review in case an insert is missing. One exceptional ratchet may add at most two points to performance and two points to weight. The same observation is not counted twice beyond that.',
      },
      { kind: 'h2', text: 'Bands and buyback in the note' },
      {
        kind: 'table',
        headers: ['Total', 'Code', 'Label', 'Pool in the note', 'Buyback in the note'],
        rows: [
          ['95–100', 'L10', 'Gem', 'Complete loose, mint', '80%'],
          ['88–94', 'L9', 'Near mint', 'Complete loose', '75%'],
          ['80–87', 'L8', 'Excellent', 'Complete loose', '70%'],
          ['70–79', 'L7', 'Light play', 'Used complete', '60%'],
          ['60–69', 'L6', 'Played', 'Used complete', '50%'],
          ['50–59', 'L5', 'Heavy play', 'Used complete', '45%'],
          ['40–49', 'L4', 'Poor', 'Used, low confidence', '40%'],
          ['Under 40', 'L3', 'Below the pool', 'Not eligible', 'None'],
        ],
      },
      { kind: 'h2', text: 'What the live site actually stores' },
      {
        kind: 'p',
        text: 'Comps today are tagged sealed, like new, used, or unknown. Sealed and complete-sealed products use the sealed pool only. Complete loose and starters use used, like new, and unknown. That matches the note’s direction: factory-sealed does not sit in the played median, and an opened starter is not called sealed. It is not the L10–L3 certificate, and the site does not pay the buyback percents. A Bey page can filter the comps it already has. It does not grade the physical Bey in front of a camera.',
      },
      {
        kind: 'note',
        text: 'Until a certificate exists, a catalogue price is a condition pool of sold comps, not a gem mint letter grade.',
      },
    ],
  },
  {
    slug: 'seed',
    group: 'Rules',
    title: 'Seed inventory',
    lede: 'Two lists both get called a seed. One is the catalogue of products and parts. The other is a $5,000 plan to buy lots off-platform and sort them into whole Beys. They are not the same list, and the plan’s dollars are not on the cards.',
    blocks: [
      { kind: 'h2', text: 'The buy plan' },
      {
        kind: 'p',
        text: 'The seed-inventory note starts from a five thousand dollar budget. Lots are bought off the platform, sorted into individual whole Beys, and held as a pool. The lots themselves are never listed. After sorting, the note expects about 309 whole Beys, about $4,480 of product spend, a small buffer for prices moving, and shipping and fees above about $420. It also writes a planned Oracle value near $9,440, about 2.1 times cost, and about $7,550 of exposure if buyback were 80 percent. Those Oracle dollars are the plan’s arithmetic. They were not checked against the live database, and they were not inserted as marks.',
      },
      {
        kind: 'p',
        text: 'The shopping list spreads across generations on purpose. X is the demand baseline: Hasbro booster cases, BX-07 start dash sets, a BX-14 random booster, and a small used set. Burst is mid-tier random boosters and a few named boosters. Metal Fight is the largest share of planned Oracle value, bought as tournament lots, mixed 4D lots, and a handful of singles. Plastic and HMS are fewer pieces at a higher planned value each, including Mandarake and Suruga-ya picks. The note’s split is roughly 103 X, 42 Burst, 72 Metal, and 36 Plastic or HMS.',
      },
      {
        kind: 'table',
        headers: ['Generation in the plan', 'Role the note gives it'],
        rows: [
          ['X, about 41% of units', 'The current demand baseline. Lower planned value per Bey.'],
          ['Burst, about 17%', 'Mid-tier random boosters.'],
          ['Metal, about 28%', 'The best planned return per lot.'],
          ['Plastic and HMS, about 14%', 'Fewer units, highest planned value per Bey, the collector hook.'],
        ],
      },
      {
        kind: 'p',
        text: 'The same note says the marketplace can thicken that pool before a large inventory exists. If someone pulls a Bey that is only sitting as another person’s listing, buy that listing and ship it. Refill once there is traction. Personal inventory can be used the same way. That is an operating idea. It is not a live checkout on this site, and this site does not transfer ownership.',
      },
      { kind: 'h2', text: 'The catalogue that already exists' },
      {
        kind: 'p',
        text: 'The product and part seeds are the identity the Oracle is allowed to name. The built catalogue is 1,105 parts: 154 Plastic, 164 Metal, 576 Burst, and 211 X. It is 448 products: 85 Plastic, 119 Metal, 86 Burst, and 158 X. RIPBEYS does not add another product table on top of that. A listing becomes priced only when the bridge points at one of those products, or, for a part page, at one of those parts.',
      },
      {
        kind: 'p',
        text: 'Eighteen assembled X listings already know their blade, ratchet, and bit, and still have no complete-product row. Courage Dran and Keel Shark are in that set. They show as needing a product seed. They do not show a summed part price while they wait. Production comps live in Railway Postgres. A laptop database is not that inventory, and these docs do not authorize loading the five thousand dollar list into it.',
      },
      {
        kind: 'note',
        text: 'If a physical lot from the plan is later ingested, each whole Bey still needs its own confirmed product id before a card can show a mark. The lot’s asking price is not that mark.',
      },
    ],
  },
]

export function docBySlug(slug: string | undefined): DocPage | undefined {
  if (!slug || slug === 'overview') return docPages[0]
  return docPages.find((page) => page.slug === slug)
}

export function docHaystack(page: DocPage): string {
  const chunks = [page.title, page.group, page.lede]
  for (const block of page.blocks) {
    if (block.kind === 'p' || block.kind === 'h2' || block.kind === 'note') chunks.push(block.text)
    else if (block.kind === 'ul') chunks.push(...block.items)
    else chunks.push(...block.headers, ...block.rows.flat())
  }
  return chunks.join(' ').toLowerCase()
}

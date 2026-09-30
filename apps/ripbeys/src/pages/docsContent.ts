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
    lede: 'RIPBEYS is the public showroom. Requiem is the catalogue and the Oracle. They are one product.',
    blocks: [
      {
        kind: 'p',
        text: 'Primary Beyblade demand is in a mainstream wave. The pricing, authentication, and vault layer is still thin. This site is that layer: a confirmed product, its 3D file, and a sold-comp mark. It is not a second catalogue and it does not invent a price.',
      },
      { kind: 'h2', text: 'Three identities' },
      {
        kind: 'ul',
        items: [
          'Listing id, such as bx-002. This picks the card and the mesh. It is not a product code.',
          'Requiem product or part id. This is the only thing that may be priced.',
          'Visual file, from visual-assets.json for that listing id only.',
        ],
      },
      { kind: 'h2', text: 'What a visitor sees' },
      {
        kind: 'table',
        headers: ['Place', 'What it shows'],
        rows: [
          ['Catalogue', 'A Bey only when the Product Oracle returns a number'],
          ['Bey page', 'The live model, the recipe, and the same chart BeyOracle uses'],
          ['Lab', 'The same mesh, set up to turn'],
          ['Docs', 'These rules'],
        ],
      },
      {
        kind: 'note',
        text: 'bx-002 is Dran Dagger, product prod-x-dran-dagger-4-60r-complete-loose. It is not BX-02 Wizard Arrow.',
      },
    ],
  },
  {
    slug: 'pricing',
    group: 'Start',
    title: 'Pricing',
    lede: 'One whole Beyblade. Sold comps only. The mark is the median, and the band is the middle half of those sales.',
    blocks: [
      {
        kind: 'p',
        text: 'A price on a card is the Product Oracle median in yen. Asking prices, listing stickers, and blade marks are not that number. Parts stay inside the engine. A blade mark is never added up into a whole Bey.',
      },
      { kind: 'h2', text: 'What can carry a mark' },
      {
        kind: 'table',
        headers: ['Priced', 'Not a public mark'],
        rows: [
          ['Complete loose, starter, sealed box', 'A single part'],
          ['One SKU', 'A lot, a bundle, or a launcher on its own'],
        ],
      },
      { kind: 'h2', text: 'How a comp gets in' },
      {
        kind: 'ul',
        items: [
          'It is a realized sale, not an asking price.',
          'It is one product, matched above the accept floor.',
          'It falls in the default window. The page states 90 days.',
          'The source and the listing URL stay on the observation.',
          'Fewer than 3 comps does not become a confident published mark.',
        ],
      },
      { kind: 'h2', text: 'Sources' },
      {
        kind: 'table',
        headers: ['Market', 'State'],
        rows: [
          ['Mercari Japan', 'Live sold comps'],
          ['Yahoo Auctions Japan', 'Live sold comps'],
          ['Shopee Taiwan', 'Partial'],
          ['Ruten, Suruga-ya, eBay, Mandarake', 'Named as next. Not all of them feed the mark today.'],
        ],
      },
      {
        kind: 'note',
        text: 'The default pool is used, like new, and unknown. Sealed sales stay out of that pool. Toggles recompute stored comps. They do not invent a sale.',
      },
    ],
  },
  {
    slug: 'catalogue',
    group: 'Identity',
    title: 'Catalogue',
    lede: '578 listings stay on disk. 26 may call a product mark. A number on the live API is a smaller set again.',
    blocks: [
      {
        kind: 'table',
        headers: ['Count', 'Meaning'],
        rows: [
          ['578', 'Every RIPBEYS listing'],
          ['26', 'Product Oracle bridge'],
          ['104', 'Part Oracle. A blade or layer, not the whole Bey'],
          ['448', 'No fetch. Includes 18 assembled X Beys with no product seed'],
          ['14', 'Listings with a numeric product mark on 30 Sep 2026. This moves when comps move.'],
        ],
      },
      {
        kind: 'p',
        text: 'The public archive hides a listing until its product response has a number. Opening /market/bx-002 still works when that mark is empty. The page says insufficient data. It does not print zero.',
      },
      { kind: 'h2', text: 'Names' },
      {
        kind: 'p',
        text: 'Cards and Bey pages use the Requiem English name when the bridge confirmed one. Hasbro and Takara word order can differ. They are the same Bey when the product id matches. Short seed names, such as Arc (4-55LO), are shown as written. They were not lengthened by guess.',
      },
    ],
  },
  {
    slug: 'oracle',
    group: 'Identity',
    title: 'Oracle links',
    lede: 'A Bey page links to the canonical product or part. The listing number is never used as that URL.',
    blocks: [
      {
        kind: 'ul',
        items: [
          'Product bridge: GET /api/product/{requiemProductId}, and a link to /product/{id}.',
          'Part bridge: GET /api/asset/{requiemPartId}, labeled Part mark, and a link to /asset/{id}.',
          'No bridge: the chart stays empty. No call is made.',
        ],
      },
      {
        kind: 'p',
        text: 'The chart is the BeyOracle chart: rolling median, sold dots, the current mark, the interquartile band, and the ranges 1 month through all. The consumer does not calculate the median itself.',
      },
      {
        kind: 'note',
        text: 'UX-03 Wizard Rod exists as prod-x-ux-03-complete-loose. No RIPBEYS listing points at it. Taiwan resale figures from the RIPBEYS note are not Oracle marks.',
      },
    ],
  },
  {
    slug: 'models',
    group: 'Identity',
    title: '3D models',
    lede: 'The mesh is the recovered file for that listing. A missing file shows a poster. It does not crash, and it is not replaced with a drawn fake.',
    blocks: [
      {
        kind: 'p',
        text: 'The Bey page and the Lab load one Three.js model. Catalogue cards use a spin of that same file so the grid does not open hundreds of WebGL contexts. The spin is a preview. The identity is still the mesh path in the visual map.',
      },
      {
        kind: 'ul',
        items: [
          '578 listing rows are flagged as having a model. Five paths are shared by two ids of the same Bey, including Phoenix Wing 9-60GF on bx-003 and bx-201.',
          'A filename that shares a token with the display name is agreement, not a photograph of the mesh.',
          'bx-009 is named Arc (4-55LO) and the file is arc_wizard.fbx. That pair stays unverified. It was not swapped.',
        ],
      },
    ],
  },
  {
    slug: 'grading',
    group: 'Rules',
    title: 'Grading',
    lede: 'The written scale is sealed S10–S7 and a loose score out of 100. The live Oracle still uses four condition buckets.',
    blocks: [
      {
        kind: 'p',
        text: 'The grading note describes intake, authentication, a grade, and then an Oracle pool. Authentication checks the box code, the mold, the screw type, and weight against the catalogue. Weight never overrides a mold check.',
      },
      { kind: 'h2', text: 'Loose bands in the note' },
      {
        kind: 'table',
        headers: ['Total', 'Code', 'Pool in the note'],
        rows: [
          ['95–100', 'L10 Gem', 'Complete loose, mint'],
          ['88–94', 'L9', 'Complete loose'],
          ['80–87', 'L8', 'Complete loose'],
          ['70–79', 'L7', 'Used complete'],
          ['60–69', 'L6', 'Used complete'],
          ['50–59', 'L5', 'Used complete'],
          ['40–49', 'L4', 'Used, low confidence'],
          ['Under 40', 'L3', 'Not for the pool'],
        ],
      },
      {
        kind: 'note',
        text: 'The site does not score L10–L3 and does not pay the buyback percents in that note. Comps are tagged sealed, like new, used, or unknown. Sealed stays out of the default mark.',
      },
    ],
  },
  {
    slug: 'seed',
    group: 'Rules',
    title: 'Seed inventory',
    lede: 'The catalogue seed and the $5,000 buy plan are different lists. Neither one is a live price.',
    blocks: [
      {
        kind: 'p',
        text: 'The buy plan sorts off-platform lots into whole Beys for a future pool. It names about 309 Beys, about $4,480 of product spend, and a planned Oracle total near $9,440. Those dollars were not loaded into Railway and do not appear on cards.',
      },
      { kind: 'h2', text: 'Catalogue that exists now' },
      {
        kind: 'table',
        headers: ['Record', 'Count'],
        rows: [
          ['Parts', '1,105 — Plastic, Metal, Burst, and X'],
          ['Products', '448'],
          ['RIPBEYS listings', '578 presentation ids'],
          ['Assembled X without a product seed', '18, and they stay unpriced'],
        ],
      },
      {
        kind: 'p',
        text: 'A new listing is safe only when its number is not copied onto a Requiem code, its mesh is filed under that listing id, and its bridge is confirmed, ambiguous, or unmatched in the open. An unmatched listing stays unavailable.',
      },
    ],
  },
]

export function docBySlug(slug: string | undefined): DocPage | undefined {
  if (!slug || slug === 'overview') return docPages[0]
  return docPages.find((page) => page.slug === slug)
}

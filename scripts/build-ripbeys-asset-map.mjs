/**
 * Stage 1: RIPBEYS listing → canonical Requiem product/part + local asset paths.
 * Name / part / combo evidence only. Never maps bx-NNN → BX-NN by number.
 * Does not modify catalogue seeds.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const ASSETS_TS = path.join(ROOT, 'apps/ripbeys/src/lib/assets.ts')
const PART_MAPS = path.join(ROOT, 'apps/ripbeys/src/data/partMaps.json')
const VAULT = path.join(ROOT, 'apps/ripbeys/public/assets')
const OUT = path.join(ROOT, 'packages/catalog/data/ripbeys-asset-map.json')
const REPORT = path.join(ROOT, 'MAPPING_REPORT.md')

const parts = JSON.parse(fs.readFileSync(path.join(ROOT, 'packages/catalog/data/parts.json'), 'utf8'))
const products = [
  ...JSON.parse(fs.readFileSync(path.join(ROOT, 'packages/catalog/data/seeds/products-x.json'), 'utf8')),
  ...JSON.parse(fs.readFileSync(path.join(ROOT, 'packages/catalog/data/seeds/products-burst.json'), 'utf8')),
  ...JSON.parse(fs.readFileSync(path.join(ROOT, 'packages/catalog/data/seeds/products-metal.json'), 'utf8')),
  ...JSON.parse(fs.readFileSync(path.join(ROOT, 'packages/catalog/data/seeds/products-plastic.json'), 'utf8')),
]
const partMaps = fs.existsSync(PART_MAPS)
  ? JSON.parse(fs.readFileSync(PART_MAPS, 'utf8'))
  : {}

/** @type {Map<string, object[]>} */
const partsByNormName = new Map()
/** @type {Map<string, object>} */
const partById = new Map()
for (const p of parts) {
  partById.set(p.id, p)
  const key = norm(p.nameEn)
  if (!partsByNormName.has(key)) partsByNormName.set(key, [])
  partsByNormName.get(key).push(p)
}

const xRatchets = parts.filter((p) => p.generation === 'x' && p.partType === 'ratchet')
const xBits = parts.filter((p) => p.generation === 'x' && p.partType === 'bit')

/** Bit code (F, LF, GF, HN…) → part id. Prefer longest code match. */
const bitByCode = new Map()
for (const b of xBits) {
  const idTail = b.id.replace(/^x-(?:bx-\d+-)?bit-?/, '').toLowerCase()
  if (idTail && idTail.length <= 3 && !/[aeiou]{3}/.test(idTail)) {
    bitByCode.set(idTail.toUpperCase(), b.id)
  }
  // acronym from multi-word name: Low Flat → LF, Gear Flat → GF
  const words = String(b.nameEn).split(/\s+/).filter(Boolean)
  if (words.length >= 2) {
    const ac = words.map((w) => w[0]).join('').toUpperCase()
    if (ac.length >= 2 && ac.length <= 3 && !bitByCode.has(ac)) bitByCode.set(ac, b.id)
  }
  // single-letter from id when present: x-bit-r → R
  if (/^x-bit-[a-z]$/i.test(b.id)) {
    bitByCode.set(b.id.slice(-1).toUpperCase(), b.id)
  }
}
// Official single-letter codes that use legacy bx-* ids
bitByCode.set('F', 'x-bx-06-bit') // Flat
bitByCode.set('B', 'x-bx-07-bit') // Ball (when not Bound Spike BS)
bitByCode.set('FRE', 'x-bx-07-bit')

const ratchetByName = new Map()
for (const r of xRatchets) {
  ratchetByName.set(norm(r.nameEn), r.id)
  // also key without hyphen variants
  ratchetByName.set(norm(r.nameEn.replace(/-/g, ' ')), r.id)
}

/** RIPBEYS display-name aliases → Requiem part nameEn (normalized) */
const NAME_ALIASES = [
  [/^dagger dran\b/i, 'dran dagger'],
  [/^sword dran\b|^dran sword\b/i, 'dran sword'],
  [/^courage dran\b/i, 'dran buster'],
  [/^scythe incendio\b/i, 'hells scythe'],
  [/^reaper incendio\b/i, 'reaper'],
  [/^chain incendio\b/i, 'hells chain'],
  [/^horn rhino\b/i, 'rhino horn'],
  [/^helm knight\b/i, 'knight shield'],
  [/^lance knight\b/i, 'knight lance'],
  [/^tail viper\b/i, 'viper tail'],
  [/^yell kong\b/i, 'yell kong'],
  [/^soar phoenix\b/i, 'phoenix wing'],
  [/^keel shark\b/i, 'shark edge'],
  [/^savage bear\b/i, 'bear scratch'],
  [/^roar tyrano\b|^roar tyranno\b/i, 'tyranno roar'],
  [/^bite croc\b/i, 'croc crunch'],
  [/^mammo tusk\b|^tusk mammo\b/i, 'tusk mammoth'],
  [/^gale wyvern\b/i, 'wyvern gale'],
  [/^talon ptera\b/i, 'ptera swing'],
  [/^arc wizard\b/i, 'arc'],
  [/^dark perseus\b/i, 'dark'],
  [/^arrow wizard\b/i, 'wizard arrow'],
  [/^shinobi knife\b/i, 'shinobi knife'],
  [/^cobalt dragoon\b/i, 'cobalt dragoon'],
  [/^dranzer spiral\b/i, 'dranzer spiral'],
]

/** Strip trailing parentheticals e.g. "(st)" so combo parse / blade names work. */
function stripTrailingParens(displayName) {
  return String(displayName || '')
    .replace(/\s*\([^)]*\)\s*$/g, '')
    .trim()
}

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/hells?/g, 'hell')
    .replace(/tyranno/g, 'tyranno')
    .replace(/valtryek|valkyrie/g, 'valkyrie')
    .replace(/spryzen|spriggan/g, 'spriggan')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function fileExists(relUrl) {
  if (!relUrl) return false
  const rel = relUrl.replace(/^\//, '')
  // vault is apps/ripbeys/public — urls are /assets/...
  const full = path.join(ROOT, 'apps/ripbeys/public', rel)
  return fs.existsSync(full)
}

function parseListings(src) {
  const listings = []
  // Match each listing object that has id + name + series + model
  const re =
    /\{\s*id:\s*'(bx-\d+|bb-\d+)'\s*,\s*name:\s*'([^']*)'\s*,\s*series:\s*'([^']*)'\s*,\s*class:\s*'([^']*)'([\s\S]*?)(?=\n\s*\{|\n\s*\])/g
  let m
  while ((m = re.exec(src))) {
    const block = m[0]
    const modelM = block.match(/model:\s*`\$\{M\}\/([^`]+)`/)
    const imageM = block.match(/image:\s*`\$\{([^}]+)\}\/([^`]+)`/)
    const textureM = block.match(/texture:\s*`\$\{M\}\/([^`]+)`/)
    const imagePrefix = imageM ? imageM[1] : null
    const imageFile = imageM ? imageM[2] : null
    // Consts in assets.ts: BEY/BC/XS/XC/M
    const prefixRoots = {
      BEY: '/assets/game/beys',
      BC: '/assets/game/burst-chrome',
      XS: '/assets/game/x-sprites',
      XC: '/assets/game/x-chrome',
      M: '/assets/models',
    }
    let imagePath = null
    if (imagePrefix && imageFile) {
      const root = prefixRoots[imagePrefix]
      if (root) {
        const candidate = `${root}/${imageFile}`
        imagePath = fileExists(candidate)
          ? candidate
          : { unresolved: true, prefix: imagePrefix, file: imageFile, tried: candidate }
      } else {
        imagePath = { unresolved: true, prefix: imagePrefix, file: imageFile }
      }
    }
    listings.push({
      ripbeysListingId: m[1],
      displayName: m[2],
      series: m[3],
      class: m[4],
      assembledModelFile: modelM ? modelM[1] : null,
      textureFile: textureM ? textureM[1] : null,
      imageMeta: imagePath,
    })
  }
  return listings
}

/** Parse X combo: optional lock-chip letter(s) + N-NN + bit code */
function parseXCombo(displayName) {
  // e.g. "Dran Sword 3-60F", "Courage Dran S6-60V", "Arc Wizard R4-55LO", "Reaper Incendio T4-70K"
  // Strip "(st)" etc. first — otherwise combo is not at end-of-string.
  const cleaned = stripTrailingParens(displayName)
  const m = cleaned.match(
    /(?:\b([A-Z]{1,2}))?(\d{1,2}-\d{2})([A-Z]{1,3})\s*$/i,
  )
  if (!m) return null
  return {
    lockChip: m[1] ? m[1].toUpperCase() : null,
    ratchet: m[2],
    bitCode: m[3].toUpperCase(),
    combo: `${m[2]}${m[3].toUpperCase()}`,
    comboWithLock: m[1] ? `${m[1].toUpperCase()}${m[2]}${m[3].toUpperCase()}` : null,
  }
}

function bladeNameCandidates(displayName) {
  const cleaned = stripTrailingParens(displayName)
  let base = cleaned
    .replace(/\s+[A-Z]{0,2}\d{1,2}-\d{2}[A-Z]{1,3}\s*$/i, '')
    .trim()
  const out = new Set([norm(base), norm(cleaned)])
  for (const [re, repl] of NAME_ALIASES) {
    if (re.test(base) || re.test(cleaned) || re.test(displayName)) out.add(norm(repl))
  }
  // word-order swap: "Soar Phoenix" already aliased; also try last-two-word reverse
  const words = base.split(/\s+/).filter(Boolean)
  if (words.length === 2) out.add(norm(`${words[1]} ${words[0]}`))
  return [...out]
}

function findBladeParts(displayName, series) {
  const keys = bladeNameCandidates(displayName)
  const hits = []
  for (const k of keys) {
    const list = partsByNormName.get(k) || []
    for (const p of list) {
      if (p.partType !== 'blade' && p.partType !== 'layer' && p.partType !== 'energy_layer') {
        // burst layers often partType "layer" or similar — accept blade-like
        if (!['blade', 'layer', 'energy_layer', 'disk', 'driver'].includes(p.partType)) {
          // still allow if name is unique identity piece
          if (p.partType === 'bit' || p.partType === 'ratchet') continue
        }
      }
      // Prefer generation matching series
      hits.push(p)
    }
  }
  // Prefer exact generation
  const gen =
    /^x$/i.test(series) ? 'x' : /burst/i.test(series) ? 'burst' : /metal/i.test(series) ? 'metal' : null
  const filtered = gen ? hits.filter((p) => p.generation === gen) : hits
  const pool = filtered.length ? filtered : hits
  const seen = new Set()
  return pool.filter((p) => (seen.has(p.id) ? false : seen.add(p.id)))
}

function resolveXParts(displayName, bladeParts) {
  const combo = parseXCombo(displayName)
  const partIds = []
  const evidence = { name: displayName, parts: [], productCodes: [], combo: null }
  if (bladeParts.length === 1) {
    partIds.push(bladeParts[0].id)
    evidence.parts.push(bladeParts[0].nameEn)
    evidence.productCodes.push(...(bladeParts[0].productCodes || []))
  } else if (bladeParts.length > 1) {
    evidence.parts.push(...bladeParts.map((p) => `${p.id}:${p.nameEn}`))
  }
  if (combo) {
    evidence.combo = combo.comboWithLock || combo.combo
    const rid = ratchetByName.get(norm(combo.ratchet)) || ratchetByName.get(norm(combo.ratchet.replace('-', ' ')))
    if (rid) {
      partIds.push(rid)
      evidence.parts.push(combo.ratchet)
    }
    const bid = bitByCode.get(combo.bitCode)
    if (bid) {
      partIds.push(bid)
      evidence.parts.push(combo.bitCode)
    }
  }
  return { combo, partIds: [...new Set(partIds)], evidence }
}

function productsForParts(partIds, comboStr = null) {
  if (!partIds.length) return []
  const bladeId = partIds.find((id) => {
    const p = partById.get(id)
    return p && (p.partType === 'blade' || p.partType === 'layer')
  })
  if (!bladeId) return []
  const hits = products.filter((prod) => (prod.partIds || []).includes(bladeId))
  const scored = hits.map((prod) => {
    const ids = new Set(prod.partIds || [])
    const overlap = partIds.filter((id) => ids.has(id)).length
    const exactTrio =
      partIds.length >= 3 &&
      partIds.every((id) => ids.has(id)) &&
      (prod.partIds || []).length <= 4
    const comboMatch =
      comboStr &&
      prod.attrs?.combo &&
      String(prod.attrs.combo).replace(/\s+/g, '').toUpperCase() ===
        String(comboStr).replace(/\s+/g, '').toUpperCase()
    let score = overlap
    if (exactTrio && prod.skuType === 'complete_loose') score += 100
    else if (exactTrio && prod.skuType === 'starter') score += 50
    else if (exactTrio) score += 30
    if (comboMatch && prod.skuType === 'complete_loose') score += 80
    else if (comboMatch) score += 40
    if (prod.skuType === 'complete_loose') score += 5
    if (prod.skuType === 'sealed' && (prod.partIds || []).length > 6) score -= 50
    return { prod, score, exactTrio, comboMatch }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored
}

function bxCodeFromListingId(listingId) {
  const m = listingId.match(/^bx-(\d+)$/i)
  if (!m) return null
  const n = Number(m[1])
  return [`BX-${String(n).padStart(2, '0')}`, `BX-${n}`]
}

function findProductsByCode(codes) {
  return products.filter((p) =>
    (p.productCodes || []).some((c) => codes.includes(c)),
  )
}

function classify(listing, bladeParts, resolved) {
  const conflicts = []
  const notes = []
  const { partIds, evidence, combo } = resolved

  // Arena / non-bey
  if (/arena/i.test(listing.class) || /stadium/i.test(listing.displayName)) {
    return {
      status: 'unmatched',
      requiemProductId: null,
      requiemPartIds: [],
      candidates: [],
      conflicts: [],
      notes: ['Non-Bey listing (arena/stadium) — no Requiem product identity'],
      evidence,
    }
  }

  // BX-20 catalogue split: Shark Edge owns prod-x-bx-20-*; Dagger must never bind to those ids.
  // When a dedicated Dran Dagger complete_loose exists matching this listing's recipe, allow
  // normal classification (recipe match). Otherwise keep conflict until a seed exists.
  const hasDagger =
    partIds.includes('x-blade-dran-dagger') || /dagger dran|dran dagger/i.test(listing.displayName)
  if (hasDagger) {
    const isSharkEdgeProduct = (p) =>
      String(p.id || '').startsWith('prod-x-bx-20-') || /shark\s*edge/i.test(p.nameEn || '')
    const daggerLoose = products.filter((p) => {
      if (p.skuType !== 'complete_loose') return false
      if (isSharkEdgeProduct(p)) return false
      const ids = p.partIds || []
      return ids.includes('x-blade-dran-dagger') && ids.length === 3
    })
    const assembledIds = partIds.filter((id) => {
      const t = partById.get(id)?.partType
      return t === 'blade' || t === 'ratchet' || t === 'bit'
    })
    const recipeMatched = daggerLoose.some((p) => {
      const set = new Set(p.partIds || [])
      return assembledIds.length === 3 && assembledIds.every((id) => set.has(id))
    })
    if (!recipeMatched) {
      conflicts.push({
        type: 'bx-20-catalog-split',
        note:
          'Dagger Dran listing has no matching dedicated complete_loose product (or combo differs). Do not bind to prod-x-bx-20-* Shark Edge. Part x-blade-dran-dagger may still list BX-20 as pack provenance.',
      })
    } else {
      notes.push(
        'Dagger Dran matched to dedicated Dran Dagger product by recipe; Shark Edge prod-x-bx-20-* excluded.',
      )
    }
  }

  // Numeric ID is never evidence. Record advisory when bx-NNN coincides with a different BX-NN family.
  const codes = bxCodeFromListingId(listing.ripbeysListingId)
  if (codes) {
    const byCode = findProductsByCode(codes).filter(
      (p) => p.skuType === 'complete_loose' || p.skuType === 'starter',
    )
    if (byCode.length && bladeParts.length === 1) {
      const bladeId = bladeParts[0].id
      const codeUsesSameBlade = byCode.some((p) => (p.partIds || []).includes(bladeId))
      if (!codeUsesSameBlade) {
        notes.push(
          `Advisory: ${listing.ripbeysListingId} must NOT be treated as ${codes[0]} (${byCode
            .slice(0, 2)
            .map((p) => p.nameEn)
            .join(' / ')}); identity uses name/parts only.`,
        )
      } else {
        notes.push(
          `Advisory: ${listing.ripbeysListingId} number coincides with ${codes[0]} but identity was established by name/parts, not by numeric ID.`,
        )
      }
    } else if (byCode.length && bladeParts.length === 0) {
      notes.push(
        `Advisory: do not map ${listing.ripbeysListingId} → ${codes[0]} by number (${byCode[0]?.nameEn}).`,
      )
    }
  }

  // True catalogue contradiction only (not presentation-id vs Takara-code nesting)
  if (conflicts.some((c) => c.type === 'bx-20-catalog-split')) {
    return {
      status: 'conflict',
      requiemProductId: null,
      requiemPartIds: partIds.filter((id) => partById.has(id)),
      candidates: [],
      conflicts,
      notes,
      evidence,
    }
  }

  if (bladeParts.length > 1) {
    return {
      status: 'ambiguous',
      requiemProductId: null,
      requiemPartIds: bladeParts.map((p) => p.id),
      candidates: bladeParts.map((p) => ({
        id: p.id,
        nameEn: p.nameEn,
        productCodes: p.productCodes,
        kind: 'part',
      })),
      conflicts,
      notes: [...notes, 'Multiple blade/layer parts match display name'],
      evidence,
    }
  }

  if (bladeParts.length === 0) {
    // Burst / other: fuzzy product + layer part by token overlap (generation-scoped)
    const n = norm(listing.displayName)
    const tokens = n
      .split(' ')
      .filter((t) => t.length > 2)
      .filter((t) => !/^(the|and|pro|geo|premium)$/i.test(t))
    const wantGen = /burst/i.test(listing.series)
      ? 'burst'
      : /metal/i.test(listing.series)
        ? 'metal'
        : /plastic|bakuten|original/i.test(listing.series)
          ? 'plastic'
          : null

    const layerHits = parts.filter((p) => {
      if (wantGen && p.generation !== wantGen) return false
      if (wantGen === 'burst' && !['layer', 'energy_layer', 'disk', 'driver', 'frame', 'chip'].includes(p.partType)) {
        return false
      }
      const pn = norm(p.nameEn)
      if (pn === n) return true
      if (pn.length >= 5 && (n.includes(pn) || pn.includes(n))) return true
      if (tokens.length >= 2) {
        const hit = tokens.filter((t) => pn.includes(t)).length
        // require majority of tokens for Burst to avoid "storm"/"rage" false hits
        return hit >= Math.ceil(tokens.length * 0.75)
      }
      return false
    })
    const uniqLayers = []
    const seenL = new Set()
    for (const p of layerHits) {
      if (seenL.has(p.id)) continue
      seenL.add(p.id)
      uniqLayers.push(p)
    }

    const prodHits = products.filter((p) => {
      if (wantGen && p.generation !== wantGen) return false
      const pn = norm(p.nameEn).replace(/ complete| sealed| starter| dx/g, '').trim()
      if (pn === n) return true
      if (pn.length >= 5 && (n.includes(pn) || pn.includes(n))) return true
      if (tokens.length >= 2) {
        const hit = tokens.filter((t) => pn.includes(t)).length
        return hit >= Math.ceil(tokens.length * 0.75)
      }
      return false
    })

    // Prefer unique layer part
    if (uniqLayers.length === 1 && prodHits.length <= 1) {
      return {
        status: 'confirmed',
        requiemProductId: prodHits[0]?.id ?? null,
        requiemPartIds: uniqLayers[0].id ? [uniqLayers[0].id] : [],
        candidates: prodHits.slice(0, 5).map((p) => ({
          id: p.id,
          nameEn: p.nameEn,
          productCodes: p.productCodes,
          skuType: p.skuType,
        })),
        conflicts,
        notes: [
          ...notes,
          prodHits[0]
            ? 'Matched layer/product by name tokens'
            : 'Matched layer by name; no unique product seed',
        ],
        evidence: {
          ...evidence,
          parts: [uniqLayers[0].nameEn],
          productCodes: uniqLayers[0].productCodes || [],
        },
      }
    }
    if (uniqLayers.length > 1 || prodHits.length > 1) {
      return {
        status: 'ambiguous',
        requiemProductId: null,
        requiemPartIds: uniqLayers.slice(0, 5).map((p) => p.id),
        candidates: [
          ...uniqLayers.slice(0, 5).map((p) => ({
            id: p.id,
            nameEn: p.nameEn,
            productCodes: p.productCodes,
            kind: 'part',
          })),
          ...prodHits.slice(0, 5).map((p) => ({
            id: p.id,
            nameEn: p.nameEn,
            productCodes: p.productCodes,
            skuType: p.skuType,
          })),
        ],
        conflicts,
        notes: [...notes, 'Multiple name-token matches'],
        evidence,
      }
    }
    if (prodHits.length === 1) {
      return {
        status: 'confirmed',
        requiemProductId: prodHits[0].id,
        requiemPartIds: prodHits[0].partIds || [],
        candidates: [],
        conflicts,
        notes,
        evidence: { ...evidence, name: listing.displayName, parts: prodHits[0].partIds || [] },
      }
    }
    return {
      status: 'unmatched',
      requiemProductId: null,
      requiemPartIds: [],
      candidates: [],
      conflicts,
      notes: [...notes, 'No Requiem part or product matched by name/combo evidence'],
      evidence,
    }
  }

  // Single blade — look for products
  const comboKey = combo?.combo || null
  const scored = productsForParts(partIds, comboKey)
  const exactLoose = scored.filter((s) => {
    if (s.prod.skuType !== 'complete_loose') return false
    if (s.exactTrio) return true
    if (!s.comboMatch) return false
    const ids = new Set(s.prod.partIds || [])
    if (!ids.has(bladeParts[0].id)) return false
    // Require ratchet when we resolved one
    const ratchetId = partIds.find((id) => partById.get(id)?.partType === 'ratchet')
    if (ratchetId && !ids.has(ratchetId)) return false
    return true
  })

  // Safety: never bind Dagger listings to Shark Edge product ids
  const looseForBind = hasDagger
    ? exactLoose.filter(
        (s) =>
          !String(s.prod.id || '').startsWith('prod-x-bx-20-') &&
          !/shark\s*edge/i.test(s.prod.nameEn || ''),
      )
    : exactLoose

  if (looseForBind.length === 1) {
    const bound = looseForBind[0].prod
    // Canonical recipe is the product seed partIds. CX Custom Line stores lock_chip
    // bits (Wizard, Perseus, …) while display combos still use letter suffixes (LO, W);
    // letter-code bit lookup must not override the seed.
    const canonicalParts =
      Array.isArray(bound.partIds) && bound.partIds.length > 0 ? bound.partIds : partIds
    const cxLockNote =
      !looseForBind[0].exactTrio &&
      canonicalParts.some((id) => partById.get(id)?.attrs?.subType === 'lock_chip')
        ? [
            'CX/custom lock-chip: requiemPartIds taken from product seed (not letter-code bit parse).',
          ]
        : []
    return {
      status: 'confirmed',
      requiemProductId: bound.id,
      requiemPartIds: canonicalParts,
      candidates: [],
      conflicts,
      notes: [...notes, ...cxLockNote],
      evidence: {
        ...evidence,
        productCodes: bound.productCodes || [],
      },
    }
  }

  if (looseForBind.length > 1) {
    // Same recipe different product codes (BX-01 / BX-22)
    return {
      status: 'ambiguous',
      requiemProductId: null,
      requiemPartIds: partIds,
      candidates: looseForBind.map((s) => ({
        id: s.prod.id,
        nameEn: s.prod.nameEn,
        productCodes: s.prod.productCodes,
        skuType: s.prod.skuType,
      })),
      conflicts,
      notes: [
        ...notes,
        'Multiple complete_loose products share the same blade+ratchet+bit recipe; pick canonical product for Oracle explicitly.',
      ],
      evidence,
    }
  }

  // Blade confirmed, combo parts incomplete or no product
  if (partIds.length >= 1 && bladeParts.length === 1) {
    const starters = scored.filter((s) => s.score > 0 && s.prod.skuType === 'starter' && (s.prod.partIds || []).includes(bladeParts[0].id))
    // Prefer unique starter only if combo matches
    const starterExact = starters.filter((s) => s.exactTrio)
    if (starterExact.length === 1 && !combo) {
      return {
        status: 'confirmed',
        requiemProductId: starterExact[0].prod.id,
        requiemPartIds: partIds,
        candidates: [],
        conflicts,
        notes,
        evidence,
      }
    }
    return {
      status: 'confirmed',
      requiemProductId: null,
      requiemPartIds: partIds,
      candidates: scored
        .filter((s) => s.score > 0 && (s.prod.partIds || []).length <= 6)
        .slice(0, 5)
        .map((s) => ({
          id: s.prod.id,
          nameEn: s.prod.nameEn,
          productCodes: s.prod.productCodes,
          skuType: s.prod.skuType,
        })),
      conflicts,
      notes: [
        ...notes,
        combo
          ? 'Blade/parts identified; no unique complete_loose product for this combo (product seed may be missing).'
          : 'Blade identified without parseable combo; product left unset.',
      ],
      evidence,
    }
  }

  return {
    status: 'unmatched',
    requiemProductId: null,
    requiemPartIds: [],
    candidates: [],
    conflicts,
    notes,
    evidence,
  }
}

function resolveAssets(listing) {
  const file = listing.assembledModelFile
  const assembled = file ? `/assets/models/${file}` : null
  const assembledExists = assembled ? fileExists(assembled) : false
  const map = file && partMaps[file] ? partMaps[file] : null

  const textures = { ao: {}, decal: null, color: null }
  const missing = []

  if (assembled && !assembledExists) missing.push({ role: 'assembledModel', path: assembled })
  if (listing.textureFile) {
    const tp = `/assets/models/${listing.textureFile}`
    textures.color = tp
    if (!fileExists(tp)) missing.push({ role: 'colorTexture', path: tp })
  }
  if (map?.ao) {
    for (const [slot, tex] of Object.entries(map.ao)) {
      const p = `/assets/models/${tex}`
      textures.ao[slot] = p
      if (!fileExists(p)) missing.push({ role: `ao:${slot}`, path: p })
    }
  }
  if (map?.decal) {
    const p = `/assets/models/${map.decal}`
    textures.decal = p
    if (!fileExists(p)) missing.push({ role: 'decal', path: p })
  }

  let mediaPoster = null
  if (listing.imageMeta && typeof listing.imageMeta === 'string') {
    mediaPoster = listing.imageMeta
    if (!fileExists(mediaPoster)) missing.push({ role: 'poster', path: mediaPoster })
  } else if (listing.imageMeta?.unresolved) {
    missing.push({
      role: 'poster',
      path: null,
      detail: `${listing.imageMeta.prefix}/${listing.imageMeta.file}`,
    })
  }

  // Component models are baked into assembled FBX for X; Burst layers are layer-only OBJs
  const partsAsset = {
    blade: null,
    ratchet: null,
    bit: null,
    layer: null,
    note:
      'X assembled FBX embeds blade/ratchet/bit meshes; separate part files not required. Burst often uses layer OBJ only.',
  }
  if (file && /_Layer\.obj$/i.test(file)) {
    partsAsset.layer = assembledExists ? assembled : null
  }

  return {
    assembledModel: assembledExists ? assembled : assembled,
    assembledModelExists: assembledExists,
    parts: partsAsset,
    textures,
    media: {
      poster: mediaPoster,
    },
    missing,
  }
}

// --- main ---
const assetsTs = fs.readFileSync(ASSETS_TS, 'utf8')
const listings = parseListings(assetsTs)
if (listings.length < 500) {
  console.error('Expected ~578 listings, got', listings.length)
}

const entries = []
for (const L of listings) {
  const blades = findBladeParts(L.displayName, L.series)
  // Prefer blade partType for X
  const bladeOnly = blades.filter((p) => p.partType === 'blade')
  const bladeParts = bladeOnly.length ? bladeOnly : blades
  const resolved = resolveXParts(L.displayName, bladeParts)
  const cls = classify(L, bladeParts, resolved)
  const asset = resolveAssets(L)

  entries.push({
    ripbeysListingId: L.ripbeysListingId,
    displayName: L.displayName,
    series: L.series,
    class: L.class,
    status: cls.status,
    requiemProductId: cls.requiemProductId,
    requiemPartIds: cls.requiemPartIds,
    candidates: cls.candidates,
    evidence: cls.evidence,
    conflicts: cls.conflicts,
    notes: cls.notes,
    asset,
  })
}

const stats = {
  total: entries.length,
  confirmed: entries.filter((e) => e.status === 'confirmed').length,
  ambiguous: entries.filter((e) => e.status === 'ambiguous').length,
  unmatched: entries.filter((e) => e.status === 'unmatched').length,
  conflict: entries.filter((e) => e.status === 'conflict').length,
  assembledModelMissing: entries.filter((e) => e.asset.assembledModel && !e.asset.assembledModelExists)
    .length,
  withPoster: entries.filter((e) => e.asset.media.poster).length,
  confirmedWithProduct: entries.filter((e) => e.status === 'confirmed' && e.requiemProductId).length,
  confirmedPartOnly: entries.filter((e) => e.status === 'confirmed' && !e.requiemProductId).length,
}

const out = {
  generatedAt: new Date().toISOString(),
  version: 1,
  warning:
    'ripbeysListingId is a presentation ID, not a Takara product code. Never map bx-NNN → BX-NN by number. Conflicts are unresolved — do not invent seeds.',
  stats,
  entries,
}

fs.writeFileSync(OUT, JSON.stringify(out, null, 2))

// Report
const conflicts = entries.filter((e) => e.status === 'conflict')
const ambiguous = entries.filter((e) => e.status === 'ambiguous')
const decisions = [
  ...conflicts.map((e) => ({
    id: e.ripbeysListingId,
    name: e.displayName,
    reason: e.conflicts.map((c) => c.type).join(', '),
  })),
  ...ambiguous
    .filter((e) => e.candidates?.length)
    .slice(0, 40)
    .map((e) => ({
      id: e.ripbeysListingId,
      name: e.displayName,
      reason: `ambiguous candidates: ${e.candidates
        .slice(0, 3)
        .map((c) => c.id)
        .join(', ')}`,
    })),
]

const confirmedExamples = entries
  .filter((e) => e.status === 'confirmed' && e.requiemProductId)
  .slice(0, 8)
const partOnlyExamples = entries
  .filter((e) => e.status === 'confirmed' && !e.requiemProductId)
  .slice(0, 5)

const report = `# RIPBEYS → Requiem mapping report (Stage 1)

**Generated:** ${out.generatedAt}  
**Artifact:** \`packages/catalog/data/ripbeys-asset-map.json\`  
**Scope:** Local catalogue/asset bridge only. No seed changes. No Oracle changes.

## Summary

| Metric | Count |
|--------|------:|
| Total listings | ${stats.total} |
| Confirmed | ${stats.confirmed} |
| — with product id | ${stats.confirmedWithProduct} |
| — part-only (no unique product) | ${stats.confirmedPartOnly} |
| Ambiguous | ${stats.ambiguous} |
| Unmatched | ${stats.unmatched} |
| Conflict | ${stats.conflict} |
| Assembled model file missing on disk | ${stats.assembledModelMissing} |
| Poster path resolved | ${stats.withPoster} |

## Matching rules used

- Evidence: display name, series, parsed X combo (ratchet + bit), Requiem part \`nameEn\`, part \`productCodes\`, product \`partIds\` / \`skuType\`.
- **Never** used numeric similarity (\`bx-002\` ↛ \`BX-02\`).
- Prefer unique \`complete_loose\` product whose \`partIds\` contain the resolved blade+ratchet+bit trio.
- If multiple products share the same recipe (e.g. BX-01 vs BX-22 Dran Sword 3-60F) → **ambiguous**.
- If blade identity is clear but no unique product seed exists → **confirmed** part-only (\`requiemProductId: null\`).
- Known BX-20 split: dedicated \`prod-x-dran-dagger-4-60r-complete-loose\` when recipe matches; **never** bind Dagger to Shark Edge \`prod-x-bx-20-*\`.

## Important catalogue conflicts

### C1 — BX-20 / Dran Dagger vs Shark Edge

| Source | Meaning |
|--------|---------|
| RIPBEYS \`bx-002\` | Dagger Dran 4-60R → \`prod-x-dran-dagger-4-60r-complete-loose\` when recipe matches |
| Part \`x-blade-dran-dagger\` | \`productCodes\` still include \`BX-20\` (unchanged; pack provenance) |
| Products \`prod-x-bx-20-*\` | **Shark Edge (3-80F)** — unchanged |
| Other Dagger combos (e.g. 4-70Q) | Remain **conflict** until a matching product seed exists |

**Action taken:** Added dedicated Dran Dagger 4-60R complete_loose. Confirmed \`bx-002\` to that product. Never assign Shark Edge Oracle to Dagger listings.

### C2 — Presentation id ≠ Takara code (advisory, not auto-conflict)

\`bx-NNN\` listing ids frequently disagree with Takara \`BX-NN\` families. The map records advisories and matches by name/parts only. Example: \`bx-004\` Cobalt Dragoon → \`prod-x-bx-34-*\`, never \`BX-04\`.

### C3 — Duplicate recipe products

\`Dran Sword 3-60F\` exists as both \`prod-x-bx-01-complete-loose\` and \`prod-x-bx-22-complete-loose\` (same parts). Listings matching that recipe are **ambiguous** until a canonical Oracle product is chosen.

## Evidence examples (confirmed with product)

${confirmedExamples
  .map(
    (e) =>
      `- **${e.ripbeysListingId}** “${e.displayName}” → \`${e.requiemProductId}\` via parts [${e.requiemPartIds.join(', ')}] (combo ${e.evidence.combo || 'n/a'})`,
  )
  .join('\n') || '_None_'}

## Evidence examples (confirmed part-only)

${partOnlyExamples
  .map(
    (e) =>
      `- **${e.ripbeysListingId}** “${e.displayName}” → parts [${e.requiemPartIds.join(', ')}] — ${e.notes[0] || 'no unique product'}`,
  )
  .join('\n') || '_None_'}

## Conflict listings

${conflicts.map((e) => `- **${e.ripbeysListingId}** ${e.displayName}: ${e.conflicts.map((c) => c.note).join(' | ')}`).join('\n') || '_None_'}

## Ambiguous (sample, first 25)

${ambiguous
  .slice(0, 25)
  .map(
    (e) =>
      `- **${e.ripbeysListingId}** ${e.displayName} → candidates: ${(e.candidates || [])
        .slice(0, 4)
        .map((c) => c.id)
        .join(', ') || '(see notes)'}`,
  )
  .join('\n') || '_None_'}

## Unmatched (why)

Most unmatched entries are Burst game meshes / alternate names with no safe Requiem part or product hit, plus arenas. Do not invent identities.

Count: **${stats.unmatched}**

## Missing assets

Assembled model missing: **${stats.assembledModelMissing}**  
(Texture AO/decal gaps are listed per-entry under \`asset.missing\` in the JSON; shared AO files are referenced, not duplicated.)

## Decisions required before Stage 2 (Oracle UI)

1. **Dual-app layout** — keep \`apps/web\` + \`apps/ripbeys\`? (recommended)
2. **Dagger Dran / BX-20** — part-only Oracle vs new product seed (do not use Shark Edge)
3. **Duplicate recipes** (e.g. BX-01 vs BX-22 Dran Sword) — which product id is canonical for Oracle?
4. **Asset commit strategy** — LFS / as-is / gitignore for ~1.5 GB vault

## Files

- \`packages/catalog/data/ripbeys-asset-map.json\` — clean map
- \`packages/catalog/data/ripbeys-asset-map.draft.json\` — earlier draft (kept)
- \`scripts/build-ripbeys-asset-map.mjs\` — regenerator
- \`scripts/validate-ripbeys-assets.mjs\` — validation
`

fs.writeFileSync(REPORT, report)
console.log(JSON.stringify(stats, null, 2))
console.log('wrote', OUT)
console.log('wrote', REPORT)

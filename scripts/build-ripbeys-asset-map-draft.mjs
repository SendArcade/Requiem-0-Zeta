/**
 * Draft RIPBEYS listing → Requiem catalogue mapping.
 * Name-based only. Never equates bx-NNN with BX-NN product codes.
 * Writes packages/catalog/data/ripbeys-asset-map.draft.json
 */
import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const ROOT = path.resolve('D:/Requiem-0-Zeta')
const RIP = path.resolve('D:/beyblade/web')

// Load RIPBEYS listings by evaluating a minimal extract via dynamic import of built? 
 // Instead parse assets.ts with regex for listing objects — fragile but local-only draft.
const assetsTs = fs.readFileSync(path.join(RIP, 'src/lib/assets.ts'), 'utf8')

const partsPath = path.join(ROOT, 'packages/catalog/data/parts.json')
const productsPath = path.join(ROOT, 'packages/catalog/data/seeds/products-x.json')
const parts = JSON.parse(fs.readFileSync(partsPath, 'utf8'))
const productsX = JSON.parse(fs.readFileSync(productsPath, 'utf8'))

const partByName = new Map()
for (const p of parts) {
  if (p.generation !== 'x' && p.generation !== 'burst') continue
  const key = norm(p.nameEn)
  if (!partByName.has(key)) partByName.set(key, [])
  partByName.get(key).push(p)
}

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/hells?/g, 'hell')
    .replace(/incendio/g, 'scythe') // soft alias later
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function aliases(name) {
  const n = name.replace(/\s+[A-Z]*\d[\w-]*$/i, '').trim() // strip combo suffix
  const out = new Set([norm(name), norm(n)])
  // common RIPBEYS ↔ Requiem naming
  const map = [
    [/^dagger dran/i, 'dran dagger'],
    [/^sword dran|dran sword/i, 'dran sword'],
    [/^scythe incendio/i, 'hells scythe'],
    [/^reaper incendio/i, 'hells reaper'],
    [/^horn rhino/i, 'rhino horn'],
    [/^helm knight/i, 'knight shield'],
    [/^tail viper/i, 'viper tail'],
    [/^yell kong/i, 'kong yell'],
    [/^soar phoenix/i, 'phoenix wing'],
    [/^keel shark/i, 'shark edge'],
  ]
  for (const [re, repl] of map) {
    if (re.test(n)) out.add(norm(repl))
  }
  return [...out]
}

// Parse listing blocks: { id: 'bx-002', name: '...', model: `${M}/file.fbx` ...
const listings = []
const re =
  /\{\s*id:\s*'(bx-\d+|bb-\d+)'\s*,\s*name:\s*'([^']+)'[\s\S]*?model:\s*`\$\{M\}\/([^`]+)`/g
let m
while ((m = re.exec(assetsTs))) {
  listings.push({
    ripbeysListingId: m[1],
    displayName: m[2],
    assembledModel: `/assets/models/${m[3]}`,
  })
}

const rows = []
for (const L of listings) {
  const keys = aliases(L.displayName)
  let matchedParts = []
  for (const k of keys) {
    if (partByName.has(k)) matchedParts.push(...partByName.get(k))
  }
  // unique by id
  const seen = new Set()
  matchedParts = matchedParts.filter((p) => (seen.has(p.id) ? false : seen.add(p.id)))

  const productHits = []
  for (const part of matchedParts) {
    for (const prod of productsX) {
      if ((prod.partIds || []).includes(part.id) && prod.skuType === 'starter') {
        productHits.push({
          id: prod.id,
          nameEn: prod.nameEn,
          productCodes: prod.productCodes,
          skuType: prod.skuType,
        })
      }
    }
  }

  const conflicts = []
  // Flag if listing number looks like BX code
  const num = L.ripbeysListingId.match(/bx-(\d+)/i)
  if (num) {
    const code = `BX-${String(Number(num[1])).padStart(2, '0')}`
    const codeAlt = `BX-${Number(num[1])}`
    const byCode = productsX.filter(
      (p) =>
        (p.productCodes || []).includes(code) ||
        (p.productCodes || []).includes(codeAlt) ||
        (p.productCodes || []).includes(`BX-${num[1]}`),
    )
    for (const p of byCode) {
      if (!productHits.some((h) => h.id === p.id)) {
        conflicts.push({
          type: 'numeric-id-must-not-map-to-product-code',
          note: `${L.ripbeysListingId} must NOT be treated as ${code}`,
          productId: p.id,
          productName: p.nameEn,
        })
      }
    }
  }

  // BX-20 dagger vs shark
  if (/dagger/i.test(L.displayName)) {
    conflicts.push({
      type: 'bx-20-catalog-split',
      note: 'Dran Dagger part carries BX-20; prod-x-bx-20-* is Shark Edge — needs human decision',
    })
  }

  rows.push({
    ...L,
    requiemPartIds: matchedParts.map((p) => p.id),
    requiemPartNames: matchedParts.map((p) => p.nameEn),
    requiemProductId: productHits[0]?.id ?? null,
    requiemProductCandidates: productHits.slice(0, 5),
    conflicts,
    matchStatus: matchedParts.length
      ? productHits.length
        ? 'part+product-candidate'
        : 'part-only'
      : 'unmatched',
  })
}

const out = {
  generatedAt: new Date().toISOString(),
  source: { ripbeys: RIP, requiem: ROOT },
  warning:
    'DRAFT ONLY. ripbeysListingId is NOT a Takara product code. Resolve conflicts before binding oracle.',
  stats: {
    listingsParsed: rows.length,
    unmatched: rows.filter((r) => r.matchStatus === 'unmatched').length,
    partOnly: rows.filter((r) => r.matchStatus === 'part-only').length,
    withProductCandidate: rows.filter((r) => r.matchStatus === 'part+product-candidate').length,
    withConflicts: rows.filter((r) => r.conflicts.length).length,
  },
  entries: rows,
}

const dest = path.join(ROOT, 'packages/catalog/data/ripbeys-asset-map.draft.json')
fs.writeFileSync(dest, JSON.stringify(out, null, 2))
console.log(JSON.stringify(out.stats, null, 2))
console.log('wrote', dest)

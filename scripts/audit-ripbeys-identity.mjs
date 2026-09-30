/**
 * Identity reconciliation for RIPBEYS listings.
 * Filename overlap is not a visual inspection of the mesh.
 *
 *   node scripts/audit-ripbeys-identity.mjs
 *
 * Writes reports/ripbeys-identity-audit.json and exits 1 when an invariant fails.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const bridge = JSON.parse(
  fs.readFileSync(path.join(root, 'apps/ripbeys/src/data/oracle-bridge.json'), 'utf8'),
)
const visuals = JSON.parse(
  fs.readFileSync(path.join(root, 'apps/ripbeys/src/data/visual-assets.json'), 'utf8'),
)
const namesSrc = fs.readFileSync(path.join(root, 'apps/ripbeys/src/lib/oracleNames.ts'), 'utf8')
const oracleNames = Object.fromEntries(
  [...namesSrc.matchAll(/"([^"]+)":\s*"([^"]*)"/g)].map((m) => [m[1], m[2]]),
)

const STOP = new Set(
  'complete loose layer blade burst metal plastic beyblade series starter booster random pack with the and for from disc driver chip ring frame core plus model fbx obj'.split(
    ' ',
  ),
)
const ALIAS = {
  valkyrie: 'valtryek',
  valtryek: 'valtryek',
  phoenix: 'phoenix',
  soar: 'phoenix',
  achilles: 'achilles',
  achillies: 'achilles',
  incendio: 'reaper',
  hells: 'reaper',
  reaper: 'reaper',
  wizard: 'wizard',
  dagger: 'dran',
  sword: 'dran',
  buster: 'dran',
}

function tokens(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '')
    .split(/[^a-z0-9]+/)
    .map((t) => ALIAS[t] || t)
    .filter((t) => t.length > 3 && !STOP.has(t))
}

const byListing = bridge.byListingId
const byVisual = visuals.byListingId
const ids = Object.keys(byListing).sort()
const visualIds = new Set(Object.keys(byVisual))

const pathUsers = new Map()
for (const id of ids) {
  const model = byVisual[id]?.assembledModel
  if (!model) continue
  if (!pathUsers.has(model)) pathUsers.set(model, [])
  pathUsers.get(model).push(id)
}

const rows = ids.map((id) => {
  const entry = byListing[id]
  const visual = byVisual[id]
  const displayName = oracleNames[id] || entry.displayName
  const model = visual?.assembledModel || null
  const modelExists = Boolean(model && visual?.assembledModelExists)
  const poster = visual?.poster || null
  const posterExists = Boolean(poster && visual?.posterExists && !String(poster).includes('bg-waiting'))
  const nameTokens = new Set(tokens(displayName))
  const modelTokens = new Set(tokens(path.basename(model || '')))
  const overlap = [...nameTokens].filter((t) => modelTokens.has(t))
  const sharers = model ? pathUsers.get(model) || [] : []

  let assetStatus = 'MISSING'
  let identityStatus = entry.mapStatus === 'confirmed' ? 'PASS' : entry.mapStatus === 'ambiguous' ? 'AMBIGUOUS' : entry.mapStatus === 'conflict' ? 'AMBIGUOUS' : 'UNVERIFIED'
  const notes = []

  if (!visual) notes.push('listing has no visual-assets row')
  if (modelExists && overlap.length) assetStatus = 'PASS'
  else if (modelExists) assetStatus = 'UNVERIFIED'
  else if (model && !visual?.assembledModelExists) assetStatus = 'MISSING'
  else assetStatus = 'MISSING'

  if (assetStatus === 'UNVERIFIED') {
    notes.push('model filename shares no distinctive token with the display name; mesh was not opened')
  }
  if (assetStatus === 'PASS') {
    notes.push('filename token overlap only; mesh was not visually inspected')
  }
  if (sharers.length > 1) {
    const sets = sharers.map((other) => tokens(oracleNames[other] || byListing[other]?.displayName))
    const shared = sets[0].filter((token) => sets.every((set) => set.includes(token)))
    if (!shared.length) {
      assetStatus = 'MISMATCH'
      notes.push(`assembled path shared by listings with no shared name token: ${sharers.join(', ')}`)
    } else {
      notes.push(`same Bey on listing ids ${sharers.join(', ')}`)
    }
  }
  if (entry.oracleKind === 'product' && !entry.requiemProductId) {
    identityStatus = 'MISMATCH'
    notes.push('product oracle kind without a product id')
  }
  if (entry.oracleKind === 'part' && entry.requiemProductId) {
    identityStatus = 'MISMATCH'
    notes.push('part oracle also has a product id')
  }
  if (entry.oracleKind === 'part' && !entry.requiemPartId) {
    identityStatus = 'MISMATCH'
    notes.push('part oracle kind without a part id')
  }
  if (entry.oracleKind === 'none') identityStatus = entry.mapStatus === 'ambiguous' || entry.mapStatus === 'conflict' ? 'AMBIGUOUS' : 'UNAVAILABLE'

  let priceStatus = 'UNAVAILABLE'
  if (entry.oracleKind === 'product') priceStatus = 'UNVERIFIED'
  if (entry.oracleKind === 'part') priceStatus = 'UNAVAILABLE'

  return {
    listing_id: id,
    canonical_product_id: entry.requiemProductId,
    canonical_part_id: entry.requiemPartId,
    display_name: displayName,
    bridge_name: entry.displayName,
    series: entry.series ?? visual?.series ?? null,
    class: visual?.class ?? null,
    visual_asset: visual ? 'mapped' : 'missing',
    model_path: model,
    poster_path: posterExists ? poster : poster && String(poster).includes('bg-waiting') ? null : poster,
    oracle_bridge: entry.mapStatus,
    oracle_type: entry.oracleKind,
    oracle_id: entry.oracleKind === 'product' ? entry.requiemProductId : entry.oracleKind === 'part' ? entry.requiemPartId : null,
    beyoracle_reference:
      entry.oracleKind === 'product' && entry.requiemProductId
        ? `/product/${entry.requiemProductId}`
        : entry.oracleKind === 'part' && entry.requiemPartId
          ? `/asset/${entry.requiemPartId}`
          : null,
    oracle_price: null,
    price_status: priceStatus,
    asset_status: assetStatus,
    identity_status: identityStatus,
    part_scope: entry.partScope ?? null,
    reason: entry.reason,
    confidence: assetStatus === 'PASS' && identityStatus === 'PASS' ? 'filename' : 'unverified',
    notes: notes.join('; '),
  }
})

const counts = (key) =>
  rows.reduce((acc, row) => {
    acc[row[key]] = (acc[row[key]] || 0) + 1
    return acc
  }, {})

const productRows = rows.filter((row) => row.oracle_type === 'product')
const invariants = []
function expect(name, ok, detail) {
  invariants.push({ name, ok, detail })
}

expect('listing count is 578', ids.length === 578, String(ids.length))
expect('visual rows cover every listing', ids.every((id) => visualIds.has(id)), `visual ${visualIds.size}`)
expect('product oracle count is 26', productRows.length === 26, String(productRows.length))
expect(
  'part rows have no product id',
  rows.filter((row) => row.oracle_type === 'part').every((row) => !row.canonical_product_id && row.canonical_part_id),
  'part/product split',
)
expect(
  'product rows have a product id',
  productRows.every((row) => row.canonical_product_id),
  'product ids',
)
expect(
  'no numeric bx listing id is used as the oracle id',
  rows.every((row) => !row.oracle_id || !/^BX-\d+$/i.test(row.oracle_id)),
  'oracle ids are canonical slugs',
)

const report = {
  generatedAt: new Date().toISOString(),
  method:
    'Bridge and visual-asset JSON plus oracleNames.ts. Asset PASS means filename tokens overlap the display name. It is not a mesh inspection. Live Oracle prices are not fetched here.',
  stats: bridge.stats,
  modelFilesOnDisk: visuals.stats?.assembledModelOnDisk ?? null,
  counts: {
    asset_status: counts('asset_status'),
    identity_status: counts('identity_status'),
    oracle_type: counts('oracle_type'),
    price_status: counts('price_status'),
  },
  productOracle: productRows.map((row) => ({
    listing_id: row.listing_id,
    display_name: row.display_name,
    oracle_id: row.oracle_id,
    model_path: row.model_path,
    asset_status: row.asset_status,
    notes: row.notes,
  })),
  assetMismatches: rows.filter((row) => row.asset_status === 'MISMATCH').map((row) => ({
    listing_id: row.listing_id,
    display_name: row.display_name,
    model_path: row.model_path,
    notes: row.notes,
  })),
  assetUnverifiedSample: rows
    .filter((row) => row.asset_status === 'UNVERIFIED' && row.oracle_type !== 'none')
    .slice(0, 40)
    .map((row) => ({
      listing_id: row.listing_id,
      display_name: row.display_name,
      oracle_type: row.oracle_type,
      model_path: row.model_path,
    })),
  invariants,
  rows,
}

const outDir = path.join(root, 'reports')
fs.mkdirSync(outDir, { recursive: true })
const outPath = path.join(outDir, 'ripbeys-identity-audit.json')
fs.writeFileSync(outPath, JSON.stringify(report, null, 2))

const failed = invariants.filter((item) => !item.ok)
console.log(JSON.stringify({
  wrote: path.relative(root, outPath),
  stats: bridge.stats,
  models: visuals.stats?.assembledModelOnDisk,
  counts: report.counts,
  productOracle: report.productOracle,
  mismatches: report.assetMismatches.length,
  invariants: failed.length ? failed : 'all passed',
}, null, 2))

if (failed.length) process.exit(1)

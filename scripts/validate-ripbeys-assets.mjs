/**
 * Validate ripbeys-asset-map.json + assembled model files on disk.
 * Does not modify assets or catalogue seeds.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const MAP = path.join(ROOT, 'packages/catalog/data/ripbeys-asset-map.json')
const PUBLIC = path.join(ROOT, 'apps/ripbeys/public')

function exists(relUrl) {
  if (!relUrl) return false
  return fs.existsSync(path.join(PUBLIC, relUrl.replace(/^\//, '')))
}

if (!fs.existsSync(MAP)) {
  console.error('FAIL: missing', MAP)
  process.exit(1)
}

let data
try {
  data = JSON.parse(fs.readFileSync(MAP, 'utf8'))
} catch (e) {
  console.error('FAIL: invalid JSON', e.message)
  process.exit(1)
}

const requiredTop = ['generatedAt', 'version', 'stats', 'entries']
for (const k of requiredTop) {
  if (!(k in data)) {
    console.error('FAIL: missing top-level key', k)
    process.exit(1)
  }
}

const statuses = new Set(['confirmed', 'ambiguous', 'unmatched', 'conflict'])
const errors = []
const warnings = []

if (!Array.isArray(data.entries) || data.entries.length === 0) {
  errors.push('entries must be a non-empty array')
}

for (const [i, e] of (data.entries || []).entries()) {
  if (!e.ripbeysListingId) errors.push(`entry[${i}]: missing ripbeysListingId`)
  if (!e.displayName) errors.push(`entry[${i}]: missing displayName`)
  if (!statuses.has(e.status)) errors.push(`entry[${i}]: invalid status ${e.status}`)
  if (e.status === 'confirmed' && e.requiemProductId) {
    // ok
  }
  if (e.status === 'conflict' && e.requiemProductId) {
    errors.push(
      `${e.ripbeysListingId}: conflict entries must not bind requiemProductId (got ${e.requiemProductId})`,
    )
  }
  // Never allow numeric-only binding artifact
  if (e.notes?.some?.((n) => /mapped by numeric/i.test(n))) {
    errors.push(`${e.ripbeysListingId}: numeric mapping note found`)
  }
  const am = e.asset?.assembledModel
  if (am && !e.asset.assembledModelExists && exists(am)) {
    warnings.push(`${e.ripbeysListingId}: assembledModelExists flag false but file present`)
  }
  if (am && e.asset?.assembledModelExists && !exists(am)) {
    errors.push(`${e.ripbeysListingId}: assembled model marked present but missing on disk: ${am}`)
  }
}

// Spot-check Dagger Dran 4-60R → dedicated product (never Shark Edge)
const bx002 = data.entries.find((e) => e.ripbeysListingId === 'bx-002')
if (!bx002) errors.push('missing bx-002')
else {
  if (bx002.status !== 'confirmed') errors.push(`bx-002 must be status=confirmed (got ${bx002.status})`)
  if (bx002.requiemProductId !== 'prod-x-dran-dagger-4-60r-complete-loose') {
    errors.push(
      `bx-002 must bind prod-x-dran-dagger-4-60r-complete-loose (got ${bx002.requiemProductId})`,
    )
  }
  if (!(bx002.requiemPartIds || []).includes('x-blade-dran-dagger')) {
    errors.push('bx-002 should include part x-blade-dran-dagger')
  }
  if (String(bx002.requiemProductId || '').startsWith('prod-x-bx-20-')) {
    errors.push('bx-002 must not bind Shark Edge prod-x-bx-20-*')
  }
}
// Twins remain unresolved
for (const id of ['bx-001', 'bx-013']) {
  const e = data.entries.find((x) => x.ripbeysListingId === id)
  if (!e) errors.push(`missing ${id}`)
  else if (e.status === 'confirmed' && e.requiemProductId) {
    errors.push(`${id} must remain unresolved (no automatic twin winner); got ${e.requiemProductId}`)
  }
}

const assembledMissing = data.entries.filter(
  (e) => e.asset?.assembledModel && !exists(e.asset.assembledModel),
).length
const assembledOk = data.entries.filter(
  (e) => e.asset?.assembledModel && exists(e.asset.assembledModel),
).length

// Marketplace visual integrity: each listing's assembled model is unique to its id
// when paths differ; shared paths are reported but not fatal (some packs reuse meshes).
const owners = new Map()
const shared = []
for (const e of data.entries) {
  const am = e.asset?.assembledModel
  if (!am) continue
  if (owners.has(am) && owners.get(am) !== e.ripbeysListingId) {
    shared.push({ model: am, a: owners.get(am), b: e.ripbeysListingId })
  } else {
    owners.set(am, e.ripbeysListingId)
  }
}

console.log(
  JSON.stringify(
    {
      ok: errors.length === 0,
      entries: data.entries.length,
      stats: data.stats,
      assembledOk,
      assembledMissing,
      sharedAssembledModelPaths: shared.length,
      sharedSample: shared.slice(0, 10),
      errors: errors.slice(0, 40),
      warnings: warnings.slice(0, 20),
    },
    null,
    2,
  ),
)

process.exit(errors.length ? 1 : 0)

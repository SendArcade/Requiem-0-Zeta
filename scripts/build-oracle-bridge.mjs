/**
 * Emit apps/ripbeys/src/data/oracle-bridge.json from ripbeys-asset-map.json.
 * Run after Stage 1 map rebuild. Does not modify catalogue seeds or the Stage 1 map.
 *
 * Stage 2B Option B: assembled X listings without a canonical product are demoted to
 * oracleKind=none (reason=assembled_without_product_seed) — never fetch blade-as-Bey.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const map = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'packages/catalog/data/ripbeys-asset-map.json'), 'utf8'),
)
const parts = JSON.parse(fs.readFileSync(path.join(ROOT, 'packages/catalog/data/parts.json'), 'utf8'))
const partType = new Map(parts.map((p) => [p.id, p.partType]))

function pickPartId(ids) {
  if (!ids?.length) return null
  return ids.find((id) => ['blade', 'layer', 'energy_layer'].includes(partType.get(id))) || null
}

function partScopeFor(partId) {
  const t = partType.get(partId)
  if (t === 'blade') return 'blade'
  if (t === 'layer' || t === 'energy_layer') return 'layer'
  return 'part'
}

/** X listing with blade+ratchet+bit but no product seed → must not use part Oracle as Bey price. */
function isAssembledXWithoutProduct(e) {
  if (e.series !== 'X') return false
  if (e.status !== 'confirmed' || e.requiemProductId) return false
  const ids = e.requiemPartIds || []
  const types = new Set(ids.map((id) => partType.get(id)))
  return types.has('blade') && types.has('ratchet') && types.has('bit')
}

const bridge = {}
let product = 0
let part = 0
let none = 0
const demotedAssembledX = []

for (const e of map.entries) {
  let oracleKind = 'none'
  let requiemProductId = null
  let requiemPartId = null
  let reason = null
  let partScope = null

  if (e.status === 'confirmed' && e.requiemProductId) {
    oracleKind = 'product'
    requiemProductId = e.requiemProductId
    requiemPartId = pickPartId(e.requiemPartIds)
    if (requiemPartId) partScope = partScopeFor(requiemPartId)
    product++
  } else if (e.status === 'confirmed' && isAssembledXWithoutProduct(e)) {
    // Option B: withhold Oracle — do not present blade mark as complete Bey value
    requiemPartId = pickPartId(e.requiemPartIds)
    if (requiemPartId) partScope = partScopeFor(requiemPartId)
    reason = 'assembled_without_product_seed'
    none++
    demotedAssembledX.push({
      id: e.ripbeysListingId,
      displayName: e.displayName,
      requiemPartId,
      requiemPartIds: e.requiemPartIds || [],
    })
  } else if (e.status === 'confirmed') {
    const pid = pickPartId(e.requiemPartIds)
    if (pid) {
      oracleKind = 'part'
      requiemPartId = pid
      partScope = partScopeFor(pid)
      part++
    } else {
      reason = 'confirmed_without_blade_part'
      none++
    }
  } else if (e.status === 'conflict') {
    reason = e.conflicts?.[0]?.type || 'catalogue_conflict'
    requiemPartId = pickPartId(e.requiemPartIds)
    if (requiemPartId) partScope = partScopeFor(requiemPartId)
    none++
  } else if (e.status === 'ambiguous') {
    reason = 'ambiguous_identity'
    none++
  } else {
    reason = 'unmatched'
    none++
  }

  bridge[e.ripbeysListingId] = {
    displayName: e.displayName,
    series: e.series ?? null,
    mapStatus: e.status,
    oracleKind,
    requiemProductId,
    requiemPartId,
    requiemPartIds: e.requiemPartIds || [],
    partScope,
    reason,
  }
}

const out = {
  generatedAt: new Date().toISOString(),
  source: 'packages/catalog/data/ripbeys-asset-map.json',
  warning:
    'Presentation IDs only. Never map bx-NNN to BX-NN by number. Assembled X without product seed uses oracleKind=none (assembled_without_product_seed). Part Oracle is part-scope only.',
  stats: {
    total: Object.keys(bridge).length,
    productOracle: product,
    partOracle: part,
    unavailable: none,
    demotedAssembledXWithoutProduct: demotedAssembledX.length,
  },
  demotedAssembledXWithoutProduct: demotedAssembledX,
  byListingId: bridge,
}

const dest = path.join(ROOT, 'apps/ripbeys/src/data/oracle-bridge.json')
fs.mkdirSync(path.dirname(dest), { recursive: true })
fs.writeFileSync(dest, JSON.stringify(out, null, 2))
console.log(JSON.stringify(out.stats, null, 2))
console.log(
  'demoted',
  demotedAssembledX.map((d) => d.id).join(', '),
)
console.log('wrote', dest)

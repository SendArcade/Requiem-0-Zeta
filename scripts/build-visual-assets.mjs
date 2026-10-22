/**
 * Emit slim marketplace visual index from ripbeys-asset-map.json.
 * Listing id → that listing's assembled model + poster only (no cross-wiring).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MAP = path.join(ROOT, 'packages/catalog/data/ripbeys-asset-map.json')
const OUT = path.join(ROOT, 'apps/web/src/consumer/data/visual-assets.json')
const PUBLIC = path.join(ROOT, 'apps/web/public')

function exists(relUrl) {
  if (!relUrl) return false
  return fs.existsSync(path.join(PUBLIC, relUrl.replace(/^\//, '')))
}

const map = JSON.parse(fs.readFileSync(MAP, 'utf8'))
const byListingId = {}
const modelOwners = new Map()
let withModel = 0
let withPoster = 0
let modelMissingOnDisk = 0
let posterMissingOnDisk = 0
let noPreview = 0
const crossWire = []

for (const e of map.entries) {
  const id = e.ripbeysListingId
  const model = e.asset?.assembledModel || null
  const poster = e.asset?.media?.poster || null
  const modelOk = Boolean(model && exists(model))
  const posterOk = Boolean(poster && exists(poster))

  if (model) {
    withModel++
    if (!modelOk) modelMissingOnDisk++
    if (modelOwners.has(model) && modelOwners.get(model) !== id) {
      crossWire.push({ model, a: modelOwners.get(model), b: id })
    } else {
      modelOwners.set(model, id)
    }
  }
  if (poster) {
    withPoster++
    if (!posterOk) posterMissingOnDisk++
  }
  if (!modelOk && !posterOk) noPreview++

  byListingId[id] = {
    displayName: e.displayName,
    series: e.series ?? null,
    class: e.class ?? null,
    assembledModel: model,
    assembledModelExists: modelOk,
    poster,
    posterExists: posterOk,
  }
}

const sharedModels = [...modelOwners.entries()].filter(() => false)
// Count models used by >1 listing (intentional duplicates vs cross-wire)
const modelCounts = new Map()
for (const e of map.entries) {
  const m = e.asset?.assembledModel
  if (!m) continue
  if (!modelCounts.has(m)) modelCounts.set(m, [])
  modelCounts.get(m).push(e.ripbeysListingId)
}
const duplicateModels = [...modelCounts.entries()]
  .filter(([, ids]) => ids.length > 1)
  .map(([model, ids]) => ({ model, listings: ids }))

const out = {
  generatedAt: new Date().toISOString(),
  source: 'packages/catalog/data/ripbeys-asset-map.json',
  warning:
    'Visual assets are keyed by ripbeysListingId. Never pick a model by Requiem product code or numeric BX similarity.',
  stats: {
    total: map.entries.length,
    withAssembledModel: withModel,
    assembledModelOnDisk: withModel - modelMissingOnDisk,
    withPoster: withPoster,
    posterOnDisk: withPoster - posterMissingOnDisk,
    noPreview,
    duplicateAssembledModelPaths: duplicateModels.length,
  },
  duplicateAssembledModelPaths: duplicateModels.slice(0, 50),
  byListingId,
}

fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n')
console.log(JSON.stringify({ wrote: OUT, ...out.stats, crossWireSample: crossWire.slice(0, 5) }, null, 2))
if (modelMissingOnDisk) {
  console.warn('WARN: assembled models missing on disk:', modelMissingOnDisk)
}

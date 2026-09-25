import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const catalogPath = path.join(root, 'src', 'lib', 'assets.ts')
const catalog = fs.readFileSync(catalogPath, 'utf8')
const publicRoot = path.join(root, 'public')

const modelRefs = [...new Set([...catalog.matchAll(/model: `\$\{M\}\/([^`]+)`/g)].map((m) => m[1]))]
const textureRefs = [...new Set([...catalog.matchAll(/texture: `\$\{M\}\/([^`]+)`/g)].map((m) => m[1]))]
const ids = [...catalog.matchAll(/id: '([^']+)'/g)].map((m) => m[1])

const missing = (files, directory) => files.filter((file) => !fs.existsSync(path.join(publicRoot, directory, file)))
const missingModels = missing(modelRefs, path.join('assets', 'models'))
const missingTextures = missing(textureRefs, path.join('assets', 'models'))
const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index)
const burstParts = JSON.parse(fs.readFileSync(path.join(root, 'src', 'data', 'burstParts.json'), 'utf8'))
const partFiles = [...burstParts.disks, ...burstParts.drivers].map((part) => part.file)
const missingParts = missing(partFiles, path.join('assets', 'models'))
const burstBuilds = JSON.parse(fs.readFileSync(path.join(root, 'src', 'data', 'burstBuilds.json'), 'utf8'))
const diskNames = new Map(burstParts.disks.map((part) => [part.file, part.name]))
const driverNames = new Map(burstParts.drivers.map((part) => [part.file, part.name]))
const missingBuildParts = []
const mismatchedBuildLabels = []
for (const [name, build] of Object.entries(burstBuilds)) {
  for (const file of [build.layer.file, build.disk.file, build.driver.file]) {
    if (!fs.existsSync(path.join(publicRoot, 'assets', 'models', file))) missingBuildParts.push(`${name}: ${file}`)
  }
  if (diskNames.get(build.disk.file) && diskNames.get(build.disk.file) !== build.disk.name) {
    mismatchedBuildLabels.push(`${name}: ${build.disk.file} is ${diskNames.get(build.disk.file)}, not ${build.disk.name}`)
  }
  if (driverNames.get(build.driver.file) && driverNames.get(build.driver.file) !== build.driver.name) {
    mismatchedBuildLabels.push(`${name}: ${build.driver.file} is ${driverNames.get(build.driver.file)}, not ${build.driver.name}`)
  }
}

const normalizeBuildKey = (value) => value.replace(/\.(fbx|obj)$/i, '').replace(/geo.*$/i, '').replace(/_Layer$/i, '').replace(/[^a-z0-9]/gi, '').toLowerCase()
const buildKeys = new Set(Object.keys(burstBuilds).map(normalizeBuildKey))
const layerModels = modelRefs.filter((file) => /_Layer\.obj$/i.test(file))
const unverifiedLayers = layerModels.filter((file) => !buildKeys.has(normalizeBuildKey(file)))

console.log(`catalog listings: ${ids.length}`)
console.log(`model references: ${modelRefs.length}`)
console.log(`texture references: ${textureRefs.length}`)
console.log(`burst part references: ${partFiles.length}`)
console.log(`curated Burst builds: ${Object.keys(burstBuilds).length}`)
console.log(`Burst layer exports without curated stack: ${unverifiedLayers.length}`)

for (const [label, files] of [
  ['models', missingModels],
  ['textures', missingTextures],
  ['burst parts', missingParts],
]) {
  console.log(`${label} missing: ${files.length}`)
  files.slice(0, 20).forEach((file) => console.log(`  ${file}`))
}

console.log(`duplicate ids: ${new Set(duplicateIds).size}`)
console.log(`Burst build files missing: ${missingBuildParts.length}`)
console.log(`Burst build labels mismatched: ${mismatchedBuildLabels.length}`)
for (const issue of [...missingBuildParts, ...mismatchedBuildLabels]) console.log(`  ${issue}`)

if (missingModels.length || missingTextures.length || missingParts.length || duplicateIds.length || missingBuildParts.length || mismatchedBuildLabels.length) {
  process.exitCode = 1
}

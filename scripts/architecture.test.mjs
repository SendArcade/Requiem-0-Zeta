import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const workspaces = new Map()
for (const group of ['apps', 'packages', 'tools']) {
  for (const name of readdirSync(path.join(root, group))) {
    const directory = path.join(root, group, name)
    const manifest = path.join(directory, 'package.json')
    if (!existsSync(manifest)) continue
    const data = JSON.parse(readFileSync(manifest, 'utf8'))
    workspaces.set(data.name, { ...data, directory, group })
  }
}
const dependencies = workspace => Object.entries({ ...workspace.dependencies, ...workspace.devDependencies }).filter(([, version]) => version.startsWith('workspace:')).map(([name]) => name)
function sources(directory) {
  if (!existsSync(directory)) return []
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const file = path.join(directory, entry.name)
    return entry.isDirectory() ? sources(file) : /\.[cm]?[jt]sx?$/.test(entry.name) ? [file] : []
  })
}

test('workspace dependencies form a DAG with no application dependencies', () => {
  const visited = new Set()
  function visit(name, trail = []) {
    assert(!trail.includes(name), `Dependency cycle: ${[...trail, name].join(' -> ')}`)
    if (visited.has(name)) return
    const workspace = workspaces.get(name)
    assert(workspace, `Missing workspace ${name}`)
    for (const dependency of dependencies(workspace)) {
      assert.notEqual(workspaces.get(dependency)?.group, 'apps', `${name} depends on deployable application ${dependency}`)
      visit(dependency, [...trail, name])
    }
    visited.add(name)
  }
  for (const name of workspaces.keys()) visit(name)
})

test('workspace imports declare their package dependencies', () => {
  for (const [name, workspace] of workspaces) {
    const declared = new Set([name, ...dependencies(workspace)])
    for (const file of sources(path.join(workspace.directory, 'src'))) {
      const text = readFileSync(file, 'utf8')
      for (const match of text.matchAll(/from\s+["'](@beyoracle\/[^/"']+)/g)) {
        assert(declared.has(match[1]), `${path.relative(root, file)} imports undeclared ${match[1]}`)
      }
    }
  }
})

test('catalogue is independent of persistence and valuation', () => {
  assert.deepEqual(dependencies(workspaces.get('@beyoracle/catalog')), ['@beyoracle/shared'])
})

test('web uses pricing services and a single Next router/build', () => {
  const web = workspaces.get('@beyoracle/web')
  assert(dependencies(web).includes('@beyoracle/pricing-service'))
  assert(!dependencies(web).includes('@beyoracle/ingest'))
  assert(!web.dependencies['react-router-dom'])
  assert(!web.devDependencies.vite)
  assert(!existsSync(path.join(root, 'apps/ripbeys/package.json')))
  const config = readFileSync(path.join(web.directory, 'next.config.mjs'), 'utf8')
  assert(!config.includes('/index.html'))
  const routes = ['page', 'market/page', 'market/[listingId]/page', 'lab/page', 'docs/[slug]/page', 'x/battle/page', 'burst/customize/page', 'gacha/page']
  for (const route of routes) assert(existsSync(path.join(web.directory, 'src/app/(consumer)', `${route}.tsx`)), `Missing native route ${route}`)
})

test('worker is an app and the legacy deployment path resolves to its Dockerfile', () => {
  assert.equal(workspaces.get('@beyoracle/worker').group, 'apps')
  assert.equal(readFileSync(path.join(root, 'packages/worker/Dockerfile'), 'utf8'), readFileSync(path.join(root, 'apps/worker/Dockerfile'), 'utf8'))
})

test('root documentation contains entry points rather than historical reports', () => {
  assert.deepEqual(readdirSync(root).filter(file => file.endsWith('.md')).sort(), ['AGENTS.md', 'README.md'])
})

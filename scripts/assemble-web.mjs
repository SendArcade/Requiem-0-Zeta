import { cp, mkdir, access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const web = path.join(root, 'apps/web')
const standalone = path.join(web, '.next/standalone')
await access(path.join(standalone, 'apps/web/server.js'))
for (const [source, target] of [
  [path.join(web, 'public'), path.join(standalone, 'apps/web/public')],
  [path.join(web, '.next/static'), path.join(standalone, 'apps/web/.next/static')],
  [path.join(root, 'packages/catalog/data'), path.join(standalone, 'packages/catalog/data')],
]) {
  await mkdir(path.dirname(target), { recursive: true })
  await cp(source, target, { recursive: true })
}
console.log('Standalone web deployment assembled: apps/web/.next/standalone/apps/web/server.js')

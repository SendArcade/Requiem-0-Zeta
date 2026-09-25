import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createHash } from 'crypto'
import express from 'express'
import compression from 'compression'
import { cacheStats, cachedJson, connectRedis, memCache } from './cache.mjs'
import { assetsConfigured, fetchAsset } from './assets.mjs'
import { loadRipBeysFeed } from './xfeed.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DIST = path.join(ROOT, 'dist')
const PORT = Number(process.env.PORT) || 8080

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.fbx': 'application/octet-stream',
  '.obj': 'text/plain',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.wasm': 'application/wasm',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json',
}

function contentType(filePath) {
  return MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream'
}

function isHashedAsset(urlPath) {
  return /\/assets\/.+\.[A-Za-z0-9_-]{6,}\.(js|css|woff2?)$/.test(urlPath)
}

function isLongCache(urlPath) {
  return (
    isHashedAsset(urlPath) ||
    /\.(png|jpe?g|webp|gif|svg|woff2?|fbx|obj|glb|gltf|wasm)$/i.test(urlPath)
  )
}

function safeJoin(root, urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0])
  const cleaned = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '')
  const full = path.join(root, cleaned)
  if (!full.startsWith(root)) return null
  return full
}

function etagFor(buf) {
  return `"${createHash('sha1').update(buf).digest('hex')}"`
}

const app = express()
app.disable('x-powered-by')
app.use(compression({ threshold: 1024 }))

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    cache: cacheStats(),
    assets: assetsConfigured() ? 'bucket' : 'local-only',
    uptime: Math.round(process.uptime()),
  })
})

app.get('/api/perf', async (_req, res) => {
  const payload = await cachedJson(
    'perf:hints:v1',
    () => ({
      potato: 'Prefer posters over WebGL, skip motion, cache posters in Cache API.',
      assets: {
        posters: 'cache-first',
        models: 'stale-while-revalidate',
        shells: 'network-first',
        source: assetsConfigured() ? 'railway-bucket' : 'local',
      },
      ttlSec: { posters: 604800, models: 86400, html: 60 },
    }),
    { ttlSec: 300 },
  )
  res.setHeader('Cache-Control', 'public, max-age=60')
  res.json(payload)
})

app.get('/api/x/feed', async (_req, res) => {
  try {
    const payload = await loadRipBeysFeed()
    res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
    res.json(payload)
  } catch (err) {
    console.warn('[xfeed]', err?.message || err)
    res.status(502).json({
      handle: 'ripbeysio',
      profileUrl: 'https://x.com/ripbeysio',
      posts: [],
      error: 'feed_unavailable',
    })
  }
})

app.use(async (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next()

  let urlPath = req.path
  if (urlPath === '/') urlPath = '/index.html'

  // Game assets (models / sprites) — local dist first, then Railway bucket.
  if (urlPath.startsWith('/assets/')) {
    const local = safeJoin(DIST, urlPath)
    if (local && fs.existsSync(local) && fs.statSync(local).isFile()) {
      // fall through to local static handler below by not returning
    } else if (assetsConfigured()) {
      try {
        const remote = await fetchAsset(urlPath)
        if (!remote) return res.status(502).end('asset upstream error')
        for (const [k, v] of Object.entries(remote.headers)) {
          if (v) res.setHeader(k, v)
        }
        res.setHeader('X-Content-Type-Options', 'nosniff')
        if (req.method === 'HEAD') return res.status(remote.status).end()
        if (remote.status !== 200) return res.status(remote.status).end(remote.buffer || 'not found')
        remote.body.pipe(res)
        return
      } catch (err) {
        return next(err)
      }
    }
  }

  let filePath = safeJoin(DIST, urlPath)
  if (!filePath) return res.status(400).end('bad path')

  const wantsSpa =
    !path.extname(urlPath) ||
    urlPath === '/index.html' ||
    (!fs.existsSync(filePath) && !urlPath.startsWith('/assets/') && !urlPath.startsWith('/api/'))

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    if (wantsSpa && fs.existsSync(path.join(DIST, 'index.html'))) {
      filePath = path.join(DIST, 'index.html')
      urlPath = '/index.html'
    } else if (urlPath.startsWith('/assets/') && assetsConfigured()) {
      try {
        const remote = await fetchAsset(urlPath)
        if (!remote) return res.status(404).end('not found')
        for (const [k, v] of Object.entries(remote.headers)) {
          if (v) res.setHeader(k, v)
        }
        if (req.method === 'HEAD') return res.status(remote.status).end()
        if (remote.status !== 200) return res.status(remote.status).end(remote.buffer || 'not found')
        remote.body.pipe(res)
        return
      } catch (err) {
        return next(err)
      }
    } else {
      return res.status(404).end('not found')
    }
  }

  try {
    const stat = fs.statSync(filePath)
    const useMem = stat.size < 1_500_000
    const cacheKey = `static:${urlPath}:${stat.mtimeMs}`
    const buf = useMem
      ? await memCache(cacheKey, () => fs.promises.readFile(filePath), isLongCache(urlPath) ? 600_000 : 120_000)
      : await fs.promises.readFile(filePath)

    const tag = etagFor(buf)
    if (req.headers['if-none-match'] === tag) {
      res.status(304).end()
      return
    }

    res.setHeader('Content-Type', contentType(filePath))
    res.setHeader('ETag', tag)
    res.setHeader('Vary', 'Accept-Encoding')
    res.setHeader('X-Content-Type-Options', 'nosniff')

    if (urlPath === '/index.html' || urlPath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=120')
    } else if (isHashedAsset(urlPath)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    } else if (isLongCache(urlPath)) {
      res.setHeader('Cache-Control', 'public, max-age=604800, stale-while-revalidate=86400')
    } else {
      res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
    }

    if (req.method === 'HEAD') {
      res.status(200).end()
      return
    }
    res.status(200).send(buf)
  } catch (err) {
    next(err)
  }
})

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).end('error')
})

await connectRedis(process.env.REDIS_URL)
if (!fs.existsSync(DIST)) {
  console.warn('[server] dist/ missing — run npm run build first')
}

app.listen(PORT, '0.0.0.0', () => {
  console.info(
    `[server] listening on 0.0.0.0:${PORT} redis=${cacheStats().redis} assets=${assetsConfigured() ? 'bucket' : 'local-only'}`,
  )
})

import { createClient } from 'redis'

const MEMORY = new Map()

/** @type {import('redis').RedisClientType | null} */
let redis = null
let redisReady = false

export function cacheStats() {
  return {
    redis: redisReady ? 'up' : redis ? 'connecting' : 'memory-only',
    memoryKeys: MEMORY.size,
  }
}

export async function connectRedis(url = process.env.REDIS_URL) {
  if (!url) return null
  if (redis) return redis

  redis = createClient({
    url,
    socket: {
      reconnectStrategy: (retries) => Math.min(1000 * 2 ** retries, 10_000),
      connectTimeout: 8_000,
    },
  })

  redis.on('error', (err) => {
    redisReady = false
    console.warn('[cache] redis error', err?.message || err)
  })
  redis.on('ready', () => {
    redisReady = true
    console.info('[cache] redis ready')
  })

  try {
    await redis.connect()
    redisReady = true
  } catch (err) {
    console.warn('[cache] redis connect failed — using memory', err?.message || err)
    redisReady = false
  }
  return redis
}

function memGet(key) {
  const hit = MEMORY.get(key)
  if (!hit) return null
  if (hit.expiresAt && hit.expiresAt < Date.now()) {
    MEMORY.delete(key)
    return null
  }
  return hit.value
}

function memSet(key, value, ttlMs) {
  MEMORY.set(key, {
    value,
    expiresAt: ttlMs > 0 ? Date.now() + ttlMs : 0,
  })
  if (MEMORY.size > 250) {
    const first = MEMORY.keys().next().value
    if (first) MEMORY.delete(first)
  }
}

/** JSON values only — use memCache for Buffers. */
export async function cachedJson(key, loader, opts = {}) {
  const ttlSec = opts.ttlSec ?? 300

  if (redisReady && redis) {
    try {
      const raw = await redis.get(key)
      if (raw != null) return JSON.parse(raw)
    } catch {
      /* fall through */
    }
  } else {
    const local = memGet(key)
    if (local != null) return local
  }

  const value = await loader()
  if (value === undefined) return value

  if (redisReady && redis) {
    try {
      await redis.set(key, JSON.stringify(value), { EX: ttlSec })
    } catch {
      memSet(key, value, ttlSec * 1000)
    }
  } else {
    memSet(key, value, ttlSec * 1000)
  }
  return value
}

/** Small binary/string bodies in process memory (OS + CDN headers do the heavy lifting). */
export function memCache(key, loader, ttlMs = 120_000) {
  const hit = memGet(key)
  if (hit != null) return Promise.resolve(hit)
  return Promise.resolve(loader()).then((value) => {
    if (value !== undefined) memSet(key, value, ttlMs)
    return value
  })
}

/**
 * Browser Cache API helper for posters / static media.
 * Survives reloads; skips on private modes that block caches.
 */

const CACHE_NAME = 'ripbeys-media-v2'

async function openCache() {
  if (typeof caches === 'undefined') return null
  try {
    return await caches.open(CACHE_NAME)
  } catch {
    return null
  }
}

export async function cachedFetch(url: string, init?: RequestInit): Promise<Response> {
  const cache = await openCache()
  if (cache) {
    const hit = await cache.match(url)
    if (hit) return hit
  }

  const res = await fetch(url, init)
  if (cache && res.ok && (res.type === 'basic' || res.type === 'cors')) {
    try {
      await cache.put(url, res.clone())
    } catch {
      /* quota / opaque */
    }
  }
  return res
}

/** Warm a list of poster URLs in the background (best-effort). */
export function prefetchUrls(urls: string[], limit = 8) {
  if (typeof window === 'undefined') return
  const slice = urls.filter(Boolean).slice(0, limit)
  void (async () => {
    for (const url of slice) {
      try {
        await cachedFetch(url, { mode: 'no-cors' }).catch(() => undefined)
      } catch {
        /* ignore */
      }
    }
  })()
}

export async function clearMediaCache() {
  if (typeof caches === 'undefined') return
  try {
    await caches.delete(CACHE_NAME)
  } catch {
    /* ignore */
  }
}

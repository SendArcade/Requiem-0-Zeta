/**
 * Local favorites for marketplace presentation (no backend / payments).
 */
const KEY = 'ripbeys.market.favorites'

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

function write(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids))
  } catch {
    /* ignore quota */
  }
}

export function isFavorite(listingId: string): boolean {
  return read().includes(listingId)
}

export function toggleFavorite(listingId: string): boolean {
  const ids = read()
  const i = ids.indexOf(listingId)
  if (i >= 0) {
    ids.splice(i, 1)
    write(ids)
    return false
  }
  ids.push(listingId)
  write(ids)
  return true
}

/**
 * Frontend-safe Requiem Oracle client (read-only).
 * Never fabricates prices — missing / ineligible data returns explicit unavailable.
 *
 * Set VITE_REQUIEM_API_BASE (e.g. http://localhost:3000) or use Vite `/api` proxy.
 */
import {
  getOracleBridgeEntry,
  isOracleFetchEligible,
  unavailableReason,
  type OracleBridgeEntry,
} from './oracleBridge'

export type ValuationStatus = 'idle' | 'loading' | 'available' | 'unavailable' | 'error'

export type OracleCompSummary = {
  nComps: number
  sampleTitles: string[]
}

export type ListingOracleValuation = {
  listingId: string
  status: ValuationStatus
  oracleKind: 'product' | 'part' | 'none'
  requiemProductId: string | null
  requiemPartId: string | null
  /** Median / published mark when available */
  value: number | null
  low: number | null
  high: number | null
  nComps: number
  confidence: string | null
  currency: string
  asOf: string | null
  comps: OracleCompSummary | null
  mapStatus: OracleBridgeEntry['mapStatus'] | null
  reason: string | null
  error?: string
  source: 'requiem-api' | 'bridge' | 'unavailable'
}

/** @deprecated Use ListingOracleValuation — kept for earlier Stage 1 callers */
export type RequiemOracleMark = {
  productId: string
  value: number | null
  low: number | null
  high: number | null
  nComps: number
  confidence: string | null
  currency: string
  asOf: string | null
  source: 'requiem-api' | 'unavailable'
  error?: string
}

const base = () =>
  (import.meta.env.VITE_REQUIEM_API_BASE as string | undefined)?.replace(/\/$/, '') || ''

type CacheEntry = { at: number; value: ListingOracleValuation }
const cache = new Map<string, CacheEntry>()
/** In-flight dedupe so parallel cards sharing a product id hit one network request. */
const inflight = new Map<string, Promise<ListingOracleValuation>>()
const CACHE_TTL_MS = 60_000
/** Abort hung Oracle requests so the UI can show a clean error state. */
const ORACLE_TIMEOUT_MS = 12_000

function cacheKey(kind: string, id: string) {
  return `${kind}:${id}`
}

function asIso(v: unknown): string | null {
  if (typeof v === 'string') return v
  if (v instanceof Date) return v.toISOString()
  return null
}

function parseOracleBlock(oracle: Record<string, unknown> | null | undefined) {
  if (!oracle || typeof oracle !== 'object') {
    return {
      value: null as number | null,
      low: null as number | null,
      high: null as number | null,
      nComps: 0,
      confidence: null as string | null,
      currency: 'JPY',
      asOf: null as string | null,
    }
  }
  return {
    value: typeof oracle.value === 'number' ? oracle.value : null,
    low: typeof oracle.low === 'number' ? oracle.low : null,
    high: typeof oracle.high === 'number' ? oracle.high : null,
    nComps: Number(oracle.nComps ?? 0),
    confidence: typeof oracle.confidence === 'string' ? oracle.confidence : null,
    currency: typeof oracle.currency === 'string' ? oracle.currency : 'JPY',
    asOf: asIso(oracle.asOf),
  }
}

function parseComps(comps: unknown): OracleCompSummary | null {
  if (!Array.isArray(comps)) return null
  const titles = comps
    .slice(0, 3)
    .map((c) => (c && typeof c === 'object' && 'title' in c ? String((c as { title: unknown }).title) : ''))
    .filter(Boolean)
  return { nComps: comps.length, sampleTitles: titles }
}

function unavailableValuation(
  listingId: string,
  bridge: OracleBridgeEntry | null,
  reason: string,
  error?: string,
): ListingOracleValuation {
  return {
    listingId,
    status: error ? 'error' : 'unavailable',
    oracleKind: 'none',
    requiemProductId: bridge?.requiemProductId ?? null,
    requiemPartId: bridge?.requiemPartId ?? null,
    value: null,
    low: null,
    high: null,
    nComps: 0,
    confidence: null,
    currency: 'JPY',
    asOf: null,
    comps: null,
    mapStatus: bridge?.mapStatus ?? null,
    reason,
    error,
    source: 'unavailable',
  }
}

export async function fetchProductOracle(productId: string | null | undefined): Promise<RequiemOracleMark> {
  const v = await fetchOracleByTarget('product', productId)
  return {
    productId: productId || '',
    value: v.value,
    low: v.low,
    high: v.high,
    nComps: v.nComps,
    confidence: v.confidence,
    currency: v.currency,
    asOf: v.asOf,
    source: v.source === 'requiem-api' ? 'requiem-api' : 'unavailable',
    error: v.error,
  }
}

export async function fetchAssetOracle(partId: string | null | undefined): Promise<ListingOracleValuation> {
  return fetchOracleByTarget('part', partId, { listingId: '' })
}

async function fetchOracleByTarget(
  kind: 'product' | 'part',
  id: string | null | undefined,
  opts?: { listingId?: string; bridge?: OracleBridgeEntry | null },
): Promise<ListingOracleValuation> {
  const listingId = opts?.listingId ?? ''
  const bridge = opts?.bridge ?? null
  if (!id) {
    return unavailableValuation(listingId, bridge, kind === 'product' ? 'no_product_id' : 'no_part_id')
  }

  const key = cacheKey(kind, id)
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return { ...hit.value, listingId: listingId || hit.value.listingId }
  }

  const pending = inflight.get(key)
  if (pending) {
    const shared = await pending
    return { ...shared, listingId: listingId || shared.listingId }
  }

  const work = (async (): Promise<ListingOracleValuation> => {
    const path =
      kind === 'product'
        ? `/api/product/${encodeURIComponent(id)}`
        : `/api/asset/${encodeURIComponent(id)}`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), ORACLE_TIMEOUT_MS)
    try {
      const res = await fetch(`${base()}${path}`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      })
      if (!res.ok) {
        const unreachable = res.status === 502 || res.status === 503 || res.status === 504
        const reason = unreachable ? 'oracle_unreachable' : `http_${res.status}`
        const out = unavailableValuation(
          listingId,
          bridge,
          reason,
          unreachable ? 'Oracle service unreachable' : `http_${res.status}`,
        )
        out.oracleKind = kind
        if (kind === 'product') out.requiemProductId = id
        else out.requiemPartId = id
        out.status = res.status === 404 ? 'unavailable' : 'error'
        if (res.status === 404) cache.set(key, { at: Date.now(), value: out })
        return out
      }
      const data = (await res.json()) as {
        oracle?: Record<string, unknown> | null
        comps?: unknown
      }
      const mark = parseOracleBlock(data.oracle ?? undefined)
      const comps = parseComps(data.comps)
      const out: ListingOracleValuation = {
        listingId,
        status: mark.value == null ? 'unavailable' : 'available',
        oracleKind: kind,
        requiemProductId: kind === 'product' ? id : bridge?.requiemProductId ?? null,
        requiemPartId: kind === 'part' ? id : bridge?.requiemPartId ?? null,
        value: mark.value,
        low: mark.low,
        high: mark.high,
        nComps: mark.nComps || comps?.nComps || 0,
        confidence: mark.confidence,
        currency: mark.currency,
        asOf: mark.asOf,
        comps,
        mapStatus: bridge?.mapStatus ?? null,
        reason: mark.value == null ? 'oracle_mark_empty' : null,
        source: 'requiem-api',
      }
      cache.set(key, { at: Date.now(), value: out })
      return out
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === 'AbortError'
      const out = unavailableValuation(
        listingId,
        bridge,
        aborted ? 'oracle_timeout' : 'fetch_failed',
        aborted
          ? 'Oracle request timed out'
          : err instanceof Error
            ? err.message
            : 'fetch_failed',
      )
      out.oracleKind = kind
      if (kind === 'product') out.requiemProductId = id
      else out.requiemPartId = id
      out.status = 'error'
      return out
    } finally {
      clearTimeout(timer)
    }
  })()

  inflight.set(key, work)
  try {
    const result = await work
    return { ...result, listingId: listingId || result.listingId }
  } finally {
    inflight.delete(key)
  }
}

/**
 * Resolve a RIPBEYS listing to Oracle via the Stage 1 bridge.
 * Conflict / ambiguous / unmatched → unavailable (no network call).
 */
export async function fetchListingOracle(listingId: string | null | undefined): Promise<ListingOracleValuation> {
  const id = listingId || ''
  const bridge = getOracleBridgeEntry(id)
  if (!bridge || !isOracleFetchEligible(id)) {
    return unavailableValuation(id, bridge, unavailableReason(id))
  }

  if (bridge.oracleKind === 'product' && bridge.requiemProductId) {
    return fetchOracleByTarget('product', bridge.requiemProductId, { listingId: id, bridge })
  }
  if (bridge.oracleKind === 'part' && bridge.requiemPartId) {
    return fetchOracleByTarget('part', bridge.requiemPartId, { listingId: id, bridge })
  }
  return unavailableValuation(id, bridge, unavailableReason(id))
}

export function formatOracleValue(value: number | null, currency: string): string {
  if (value == null || Number.isNaN(value)) return '—'
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'JPY',
      maximumFractionDigits: currency === 'JPY' ? 0 : 2,
    }).format(value)
  } catch {
    return `${Math.round(value)} ${currency}`
  }
}

export function clearOracleCache() {
  cache.clear()
  inflight.clear()
}

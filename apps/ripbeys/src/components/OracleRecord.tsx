import { OracleHistory } from './OracleHistory'
import { useEffect, useState } from 'react'

const SOURCES = [
  ['mercari_jp', 'Mercari JP'],
  ['yahoo_auctions_jp', 'Yahoo Auctions JP'],
  ['mandarake_jp', 'Mandarake'],
  ['suruga_ya_jp', 'Suruga-ya'],
  ['shopee_tw', 'Shopee TW'],
  ['ruten_tw', 'Ruten TW'],
  ['ebay_com', 'eBay US'],
  ['walmart_us', 'Walmart US'],
  ['amazon_us', 'Amazon US'],
] as const

const CONDITIONS = [
  ['sealed', 'Sealed / New'],
  ['like_new', 'Like New'],
  ['used', 'Used'],
  ['unknown', 'Unknown'],
] as const

const DEFAULT_CONDITIONS = ['used', 'like_new', 'unknown']

const EVIDENCE: Record<string, string> = {
  confirmed_sale: 'Confirmed sale',
  dealer_sold_out_proxy: 'Dealer sold-out',
  dealer_buyback_offer: 'Dealer buyback',
  active_ask: 'Active ask',
  demand_proxy: 'Demand proxy',
}
const MATCH: Record<string, string> = {
  product_code: 'SKU code',
  alias_exact: 'Exact alias',
  alias_fuzzy: 'Fuzzy',
  manual: 'Manual',
}

type Comp = {
  id?: string
  title?: string
  url?: string
  source?: string
  displayPrice?: number
  price?: number
  currency?: string
  displayCurrency?: string
  observedAt?: string
  condition?: string
  evidenceKind?: string
  matchMethod?: string
  matchConfidence?: number
  inOracleMark?: boolean
}
type Mark = {
  value?: number | null
  low?: number | null
  high?: number | null
  nComps?: number
  nEffective?: number | null
  confidence?: string | null
  currency?: string
  asOf?: string | null
  engine?: string
}
type CondMark = { value?: number; nComps?: number }
type Payload = {
  oracle?: Mark | null
  oracleByCondition?: Record<string, CondMark>
  comps?: Comp[]
  conditions?: string[]
  publishedMinComps?: number
  retailReference?: { value: number; low: number; high: number; nAsks: number; sources: string[] } | null
}

function money(n: number, currency = 'JPY') {
  if (currency === 'JPY') return `¥${Math.round(n).toLocaleString('ja-JP')}`
  if (currency === 'TWD') return `NT$${Math.round(n).toLocaleString('ja-JP')}`
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(n)
}

function priced(comp: Comp) {
  return typeof comp.displayPrice === 'number' ? comp.displayPrice : comp.price
}

/** Beyoracle product/part record: filters, history chart, and sold comps. Never invents a number. */
export function OracleRecord({ productId, partId }: { productId?: string | null; partId?: string | null }) {
  const id = productId || partId || ''
  const kind = productId ? 'product' : 'asset'
  const [sources, setSources] = useState<string[]>(SOURCES.map(([source]) => source))
  const [conditions, setConditions] = useState<string[]>(DEFAULT_CONDITIONS)
  const [data, setData] = useState<Payload | null>(null)
  const [error, setError] = useState(false)
  const [live, setLive] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancel = false
    setError(false)
    const qs = new URLSearchParams({ sources: sources.join(','), conditions: conditions.join(',') })
    fetch(`/api/${kind}/${encodeURIComponent(id)}?${qs}`, { headers: { Accept: 'application/json' } })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status))
        return (await res.json()) as Payload
      })
      .then((json) => {
        if (!cancel) setData(json)
      })
      .catch(() => {
        if (!cancel) setError(true)
      })
    return () => {
      cancel = true
    }
  }, [id, kind, sources, conditions])

  useEffect(() => {
    if (!id) return
    const params = new URLSearchParams(productId ? { productId } : { partId: partId || '' })
    const stream = new EventSource(`/api/events?${params}`)
    stream.onopen = () => setLive(true)
    stream.onerror = () => setLive(false)
    stream.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as { type?: string }
        if (event.type === 'sale') {
          setSources((current) => [...current])
        }
      } catch {
        /* ignore malformed events */
      }
    }
    return () => stream.close()
  }, [id, productId, partId])

  function toggle(list: string[], value: string, keepOne: boolean) {
    if (list.includes(value)) {
      const next = list.filter((item) => item !== value)
      return keepOne && next.length === 0 ? list : next
    }
    return [...list, value]
  }

  if (!id) return <p className="pdp-muted">No confirmed Requiem identity for this listing.</p>
  if (error) return <p className="pdp-muted">Oracle request failed. No price invented.</p>
  if (!data) return <p className="pdp-muted">Loading Oracle…</p>

  const oracle = data.oracle ?? null
  const currency = oracle?.currency || 'JPY'
  const comps = data.comps ?? []
  const byCondition = data.oracleByCondition ?? {}

  return (
    <div className="oracle-record">
      <div className="oracle-hero">
        <div>
          <p className="oracle-record-kicker">
            Oracle value · sold comps
            <span className={live ? 'oracle-live is-on' : 'oracle-live'}>{live ? 'Live' : 'Offline'}</span>
          </p>
          {oracle?.value != null ? (
            <p className="oracle-record-value">{money(oracle.value, currency)}</p>
          ) : (
            <p className="oracle-record-value is-empty">Insufficient data</p>
          )}
          <p className="oracle-record-meta">
            {oracle?.low != null && oracle?.high != null ? `IQR ${money(oracle.low, currency)} – ${money(oracle.high, currency)} · ` : ''}
            {oracle?.nComps ?? comps.length} sold comps
            {oracle?.confidence ? ` · ${oracle.confidence} confidence` : ''}
            {oracle?.nEffective != null && oracle.engine === 'v2' ? ` · n eff ${oracle.nEffective.toFixed(1)}` : ''}
            {oracle?.asOf ? ` · ${String(oracle.asOf).slice(0, 10)}` : ''}
          </p>
          {oracle?.value != null && ((oracle.nComps ?? 0) < (data.publishedMinComps ?? 3) || oracle.confidence === 'low') ? (
            <p className="oracle-warn">Low confidence mark. Only {oracle.nComps ?? 0} sold comps — directional, not definitive.</p>
          ) : null}
          {data.retailReference && (oracle?.value == null || oracle.confidence === 'low') ? (
            <p className="oracle-warn">
              US retail reference {money(data.retailReference.value, 'USD')}
              {' '}({money(data.retailReference.low, 'USD')} – {money(data.retailReference.high, 'USD')}, {data.retailReference.nAsks} asks). Shelf price, not a sold comp.
            </p>
          ) : null}
          <div className="oracle-cond-marks">
            {CONDITIONS.map(([key, label]) => {
              const snap = byCondition[key]
              if (!snap || typeof snap.value !== 'number') return null
              return <span key={key}>{label}: {money(snap.value, currency)} ({snap.nComps ?? 0})</span>
            })}
          </div>
        </div>
      </div>

      <div>
        <h3>Include sources</h3>
        <div className="oracle-ranges">
          {SOURCES.map(([source, label]) => (
            <button key={source} type="button" className={sources.includes(source) ? 'is-on' : ''} onClick={() => setSources((current) => toggle(current, source, true))}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <h3>Conditions</h3>
        <div className="oracle-ranges">
          {CONDITIONS.map(([condition, label]) => (
            <button key={condition} type="button" className={conditions.includes(condition) ? 'is-on' : ''} onClick={() => setConditions((current) => toggle(current, condition, true))}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <h3>Price history</h3>
      <OracleHistory comps={comps} mark={oracle?.value ?? null} low={oracle?.low ?? null} high={oracle?.high ?? null} />

      <h3>Sold comps</h3>
      {comps.length ? (
        <div className="oracle-scroll">
          <table className="oracle-sheet">
            <thead>
              <tr>
                <th>Date</th>
                <th>Source</th>
                <th>Price</th>
                <th>Condition</th>
                <th>Match</th>
                <th>Evidence</th>
                <th>Mark</th>
                <th>Listing</th>
              </tr>
            </thead>
            <tbody>
              {comps.map((comp, index) => {
                const amount = priced(comp)
                const unit = comp.displayCurrency || comp.currency || currency
                const condition = CONDITIONS.find(([key]) => key === comp.condition)?.[1] || comp.condition || '—'
                return (
                  <tr key={comp.id || `${comp.observedAt}-${index}`} className={comp.inOracleMark === false ? 'is-dim' : ''}>
                    <td>{comp.observedAt ? comp.observedAt.slice(0, 10) : '—'}</td>
                    <td>{SOURCES.find(([source]) => source === comp.source)?.[1] || comp.source || '—'}</td>
                    <td>{typeof amount === 'number' ? money(amount, unit) : '—'}</td>
                    <td>{condition}</td>
                    <td>
                      {comp.matchMethod ? `${MATCH[comp.matchMethod] || comp.matchMethod}${comp.matchConfidence != null ? ` ${Math.round(comp.matchConfidence * 100)}%` : ''}` : '—'}
                    </td>
                    <td>{comp.evidenceKind ? EVIDENCE[comp.evidenceKind] || comp.evidenceKind : '—'}</td>
                    <td>{comp.inOracleMark ? 'In mark' : '—'}</td>
                    <td>
                      {comp.url ? <a href={comp.url} target="_blank" rel="noreferrer">{comp.title || 'Listing'}</a> : (comp.title || '—')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="pdp-muted">No sold comps for these filters.</p>
      )}
    </div>
  )
}

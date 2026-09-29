import { useEffect, useMemo, useState } from 'react'

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
const RANGES = ['1M', '3M', '6M', '1Y', 'ALL'] as const
type Range = (typeof RANGES)[number]

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

function cutoff(range: Range) {
  const day = 86400000
  if (range === '1M') return Date.now() - 30 * day
  if (range === '3M') return Date.now() - 90 * day
  if (range === '6M') return Date.now() - 180 * day
  if (range === '1Y') return Date.now() - 365 * day
  return null
}

function when(date: string) {
  return new Date(date.length > 10 ? date : `${date}T12:00:00`).getTime()
}

function median(values: number[]) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function priced(comp: Comp) {
  return typeof comp.displayPrice === 'number' ? comp.displayPrice : comp.price
}

function OracleChart({ comps, mark, low, high }: { comps: Comp[]; mark: number | null; low: number | null; high: number | null }) {
  const [range, setRange] = useState<Range>('6M')
  const [tip, setTip] = useState<string | null>(null)
  const points = useMemo(() => {
    const limit = cutoff(range)
    return comps
      .map((comp) => {
        const price = priced(comp)
        const ts = comp.observedAt ? when(comp.observedAt) : NaN
        return {
          ts,
          price,
          title: comp.title || '',
          source: SOURCES.find(([id]) => id === comp.source)?.[1] || comp.source || '',
          date: comp.observedAt?.slice(0, 10) || '',
        }
      })
      .filter((point): point is { ts: number; price: number; title: string; source: string; date: string } => (
        Number.isFinite(point.ts) && typeof point.price === 'number' && (limit == null || point.ts >= limit)
      ))
      .sort((a, b) => a.ts - b.ts)
  }, [comps, range])

  const width = 760
  const height = 280
  const padL = 56
  const padR = 16
  const padT = 18
  const padB = 28
  const prices = points.map((point) => point.price)
  const floor = Math.min(...prices, low ?? Infinity, mark ?? Infinity)
  const ceil = Math.max(...prices, high ?? -Infinity, mark ?? -Infinity)
  const empty = points.length === 0 || !Number.isFinite(floor) || !Number.isFinite(ceil)
  const span = empty ? 1 : Math.max(ceil - floor, 1)
  const lo = empty ? 0 : floor - span * 0.12
  const hi = empty ? 1 : ceil + span * 0.12
  const t0 = points[0]?.ts ?? 0
  const t1 = points[points.length - 1]?.ts ?? 1
  const x = (ts: number) => padL + (points.length < 2 ? (width - padL - padR) / 2 : ((ts - t0) / Math.max(t1 - t0, 1)) * (width - padL - padR))
  const y = (price: number) => padT + (1 - (price - lo) / Math.max(hi - lo, 1)) * (height - padT - padB)
  const rolling = useMemo(() => {
    const bag: number[] = []
    return points.map((point) => {
      bag.push(point.price)
      return { ts: point.ts, median: median(bag) }
    })
  }, [points])
  const path = rolling.map((point, index) => `${index ? 'L' : 'M'}${x(point.ts).toFixed(1)},${y(point.median).toFixed(1)}`).join(' ')

  return (
    <div className="oracle-plot">
      <div className="oracle-ranges" role="tablist" aria-label="Price history window">
        {RANGES.map((item) => (
          <button key={item} type="button" className={item === range ? 'is-on' : ''} onClick={() => setRange(item)}>
            {item}
          </button>
        ))}
      </div>
      {empty ? <p className="pdp-muted">No sold comps in {range}.</p> : (
        <svg className="oracle-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Oracle price history">
          {[0, 1, 2, 3].map((step) => {
            const price = lo + ((hi - lo) * step) / 3
            return (
              <g key={step}>
                <line x1={padL} x2={width - padR} y1={y(price)} y2={y(price)} stroke="rgba(255,255,255,0.08)" />
                <text x={padL - 8} y={y(price) + 4} textAnchor="end" fill="#808080" fontSize="11">{money(price).replace('¥', '¥')}</text>
              </g>
            )
          })}
          {low != null && high != null && low < high ? (
            <rect x={padL} y={y(high)} width={width - padL - padR} height={Math.max(y(low) - y(high), 1)} fill="rgba(19,255,243,0.08)" />
          ) : null}
          {path ? <path d={path} fill="none" stroke="#13fff3" strokeWidth="2" /> : null}
          {mark != null ? <line x1={padL} x2={width - padR} y1={y(mark)} y2={y(mark)} stroke="#ffea00" strokeDasharray="6 4" /> : null}
          {points.map((point) => (
            <circle
              key={`${point.ts}-${point.price}-${point.title}`}
              cx={x(point.ts)}
              cy={y(point.price)}
              r="4"
              fill="#a3a3a3"
              onMouseEnter={() => setTip(`${point.date} · ${money(point.price)} · ${point.source}${point.title ? ` · ${point.title}` : ''}`)}
              onMouseLeave={() => setTip(null)}
            />
          ))}
        </svg>
      )}
      <p className="oracle-legend">
        <i className="is-line" /> Rolling median
        <i className="is-dot" /> Sold comp
        <i className="is-mark" /> Current mark
      </p>
      {tip ? <p className="oracle-tip">{tip}</p> : null}
    </div>
  )
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
      <OracleChart comps={comps} mark={oracle?.value ?? null} low={oracle?.low ?? null} high={oracle?.high ?? null} />

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

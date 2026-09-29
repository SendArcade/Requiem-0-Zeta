import { useEffect, useMemo, useState } from 'react'

const RANGES = ['1M', '3M', '6M', '1Y', 'ALL'] as const
type Range = (typeof RANGES)[number]

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
  confidence?: string | null
  currency?: string
  asOf?: string | null
}
type Payload = { oracle?: Mark | null; comps?: Comp[]; chart?: Array<{ date: string; price: number }> }

function money(n: number, currency = 'JPY') {
  const prefix = currency === 'JPY' ? '¥' : currency === 'TWD' ? 'NT$' : ''
  if (prefix) return `${prefix}${Math.round(n).toLocaleString('ja-JP')}`
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

function tsOf(date: string) {
  return new Date(date.length > 10 ? date : `${date}T12:00:00`).getTime()
}

function median(values: number[]) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function OracleChart({
  comps,
  mark,
  low,
  high,
}: {
  comps: Comp[]
  mark: number | null
  low: number | null
  high: number | null
}) {
  const [range, setRange] = useState<Range>('6M')
  const points = useMemo(() => {
    const limit = cutoff(range)
    return comps
      .map((comp) => ({
        ts: comp.observedAt ? tsOf(comp.observedAt) : NaN,
        price: typeof comp.displayPrice === 'number' ? comp.displayPrice : comp.price,
        title: comp.title || '',
        date: comp.observedAt?.slice(0, 10) || '',
      }))
      .filter((point) => Number.isFinite(point.ts) && typeof point.price === 'number' && (limit == null || point.ts >= limit))
      .sort((a, b) => a.ts - b.ts) as Array<{ ts: number; price: number; title: string; date: string }>
  }, [comps, range])

  const line = useMemo(() => {
    const prices: number[] = []
    return points.map((point) => {
      prices.push(point.price)
      return { ts: point.ts, median: median(prices) }
    })
  }, [points])

  const width = 720
  const height = 260
  const padL = 52
  const padR = 12
  const padT = 16
  const padB = 28
  const prices = points.map((point) => point.price)
  const min = Math.min(...prices, low ?? Infinity, mark ?? Infinity)
  const max = Math.max(...prices, high ?? Infinity * -1, mark ?? Infinity * -1)
  const span = Math.max((Number.isFinite(max) ? max : 0) - (Number.isFinite(min) ? min : 0), 1)
  const lo = Number.isFinite(min) ? min - span * 0.12 : 0
  const hi = Number.isFinite(max) ? max + span * 0.12 : 1
  const t0 = points[0]?.ts ?? 0
  const t1 = points[points.length - 1]?.ts ?? 1
  const x = (ts: number) => padL + (points.length < 2 ? (width - padL - padR) / 2 : ((ts - t0) / Math.max(t1 - t0, 1)) * (width - padL - padR))
  const y = (price: number) => padT + (1 - (price - lo) / Math.max(hi - lo, 1)) * (height - padT - padB)
  const path = line.map((point, index) => `${index ? 'L' : 'M'}${x(point.ts).toFixed(1)},${y(point.median).toFixed(1)}`).join(' ')

  return (
    <div className="oracle-plot">
      <div className="oracle-ranges">
        {RANGES.map((item) => (
          <button key={item} type="button" className={item === range ? 'is-on' : ''} onClick={() => setRange(item)}>
            {item}
          </button>
        ))}
      </div>
      {points.length === 0 ? (
        <p className="pdp-muted">No sold comps in {range}.</p>
      ) : (
        <svg className="oracle-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Oracle price history">
          {[0, 1, 2, 3].map((step) => {
            const price = lo + ((hi - lo) * step) / 3
            return <line key={step} x1={padL} x2={width - padR} y1={y(price)} y2={y(price)} stroke="rgba(255,255,255,0.08)" />
          })}
          {low != null && high != null ? (
            <rect x={padL} y={y(high)} width={width - padL - padR} height={Math.max(y(low) - y(high), 1)} fill="rgba(19,255,243,0.08)" />
          ) : null}
          {path ? <path d={path} fill="none" stroke="#13fff3" strokeWidth="2" /> : null}
          {mark != null ? <line x1={padL} x2={width - padR} y1={y(mark)} y2={y(mark)} stroke="#ffea00" strokeDasharray="6 4" /> : null}
          {points.map((point) => (
            <circle key={`${point.ts}-${point.price}`} cx={x(point.ts)} cy={y(point.price)} r="3.5" fill="#9ca3af">
              <title>{`${point.date} · ${money(point.price)} · ${point.title}`}</title>
            </circle>
          ))}
        </svg>
      )}
      <p className="oracle-legend">
        <i className="is-line" /> Rolling median
        <i className="is-dot" /> Sold comp
        <i className="is-mark" /> Current mark
      </p>
    </div>
  )
}

/** Same Requiem payload as /requiem product pages: mark, IQR, history, sold comps. */
export function OracleRecord({ productId, partId }: { productId?: string | null; partId?: string | null }) {
  const id = productId || partId || ''
  const kind = productId ? 'product' : 'asset'
  const [data, setData] = useState<Payload | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!id) return
    let cancel = false
    setData(null)
    setError(false)
    fetch(`/api/${kind}/${encodeURIComponent(id)}`, { headers: { Accept: 'application/json' } })
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
  }, [id, kind])

  if (!id) return <p className="pdp-muted">No confirmed Requiem identity for this listing.</p>
  if (error) return <p className="pdp-muted">Oracle request failed. No price invented.</p>
  if (!data) return <p className="pdp-muted">Loading Oracle…</p>

  const oracle = data.oracle ?? null
  const currency = oracle?.currency || 'JPY'
  const comps = data.comps ?? []

  return (
    <div className="oracle-record">
      <div className="oracle-hero">
        <div>
          <p className="oracle-record-kicker">Oracle value · whole sold comps</p>
          {oracle?.value != null ? (
            <p className="oracle-record-value">{money(oracle.value, currency)}</p>
          ) : (
            <p className="oracle-record-value is-empty">Insufficient data</p>
          )}
          <p className="oracle-record-meta">
            {oracle?.low != null && oracle?.high != null ? `IQR ${money(oracle.low, currency)} – ${money(oracle.high, currency)} · ` : ''}
            {oracle?.nComps ?? comps.length} sold comps
            {oracle?.confidence ? ` · ${oracle.confidence} confidence` : ''}
            {oracle?.asOf ? ` · ${String(oracle.asOf).slice(0, 10)}` : ''}
          </p>
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
                <th>Evidence</th>
                <th>Mark</th>
                <th>Listing</th>
              </tr>
            </thead>
            <tbody>
              {comps.map((comp, index) => {
                const amount = typeof comp.displayPrice === 'number' ? comp.displayPrice : comp.price
                const unit = comp.displayCurrency || comp.currency || currency
                return (
                  <tr key={comp.id || `${comp.observedAt}-${index}`} className={comp.inOracleMark ? '' : 'is-dim'}>
                    <td>{comp.observedAt ? comp.observedAt.slice(0, 10) : '—'}</td>
                    <td>{comp.source || '—'}</td>
                    <td>{typeof amount === 'number' ? money(amount, unit) : '—'}</td>
                    <td>{comp.condition || '—'}</td>
                    <td>{comp.evidenceKind || '—'}</td>
                    <td>{comp.inOracleMark ? 'In mark' : '—'}</td>
                    <td>
                      {comp.url ? (
                        <a href={comp.url} target="_blank" rel="noreferrer">{comp.title || 'Listing'}</a>
                      ) : (
                        comp.title || '—'
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="pdp-muted">No sold comps yet for this identity.</p>
      )}
    </div>
  )
}

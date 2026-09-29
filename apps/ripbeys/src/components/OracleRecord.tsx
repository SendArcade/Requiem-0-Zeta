import { useEffect, useState } from 'react'

type Point = { date: string; price: number }
type Comp = {
  title?: string
  source?: string
  displayPrice?: number
  price?: number
  currency?: string
  displayCurrency?: string
  observedAt?: string
  condition?: string
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
type Payload = { oracle?: Mark | null; comps?: Comp[]; chart?: Point[] }

function money(n: number, currency = 'JPY') {
  return new Intl.NumberFormat(currency === 'JPY' ? 'ja-JP' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2,
  }).format(n)
}

function OracleChart({ points, mark, low, high }: { points: Point[]; mark: number | null; low: number | null; high: number | null }) {
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date))
  if (!sorted.length) return <p className="pdp-muted">No price history yet.</p>
  const prices = sorted.map((point) => point.price)
  const min = Math.min(...prices, low ?? Infinity, mark ?? Infinity)
  const max = Math.max(...prices, high ?? -Infinity, mark ?? -Infinity)
  const span = Math.max(max - min, 1)
  const width = 640
  const height = 180
  const x = (index: number) => (sorted.length === 1 ? width / 2 : (index / (sorted.length - 1)) * width)
  const y = (price: number) => height - ((price - min) / span) * (height - 20) - 10
  const line = sorted.map((point, index) => `${index ? 'L' : 'M'}${x(index).toFixed(1)},${y(point.price).toFixed(1)}`).join(' ')
  return (
    <svg className="oracle-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Oracle price history">
      {low != null && high != null ? (
        <rect x="0" y={y(high)} width={width} height={Math.max(y(low) - y(high), 1)} fill="rgba(255,234,0,0.12)" />
      ) : null}
      <path d={line} fill="none" stroke="#ffea00" strokeWidth="2" />
      {mark != null ? <line x1="0" x2={width} y1={y(mark)} y2={y(mark)} stroke="#13fff3" strokeDasharray="4 4" /> : null}
    </svg>
  )
}

/** Requiem product/part payload: mark, IQR, price history, sold comps. Never invents a number. */
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
  if (!data) return <p className="pdp-muted">Loading Oracle history…</p>

  const oracle = data.oracle ?? null
  const currency = oracle?.currency || 'JPY'
  const chart = (data.chart ?? []).filter((point) => typeof point.price === 'number' && point.date)
  const comps = data.comps ?? []
  const shown = comps.slice(0, 16)

  return (
    <div className="oracle-record">
      {oracle?.value != null ? (
        <>
          <p className="oracle-record-kicker">Oracle value · sold comps</p>
          <p className="oracle-record-value">{money(oracle.value, currency)}</p>
          <p className="oracle-record-meta">
            {oracle.low != null && oracle.high != null ? `IQR ${money(oracle.low, currency)} – ${money(oracle.high, currency)} · ` : ''}
            {oracle.nComps ?? comps.length} sold comps
            {oracle.confidence ? ` · ${oracle.confidence}` : ''}
            {oracle.asOf ? ` · ${String(oracle.asOf).slice(0, 10)}` : ''}
          </p>
        </>
      ) : (
        <p className="pdp-muted">Insufficient data for an Oracle value.</p>
      )}
      <h3>Price history</h3>
      <OracleChart points={chart} mark={oracle?.value ?? null} low={oracle?.low ?? null} high={oracle?.high ?? null} />
      <h3>Sold comps</h3>
      {shown.length ? (
        <ul className="oracle-comps">
          {shown.map((comp, index) => {
            const amount = typeof comp.displayPrice === 'number' ? comp.displayPrice : comp.price
            const unit = comp.displayCurrency || comp.currency || currency
            return (
              <li key={`${comp.observedAt ?? ''}-${index}`}>
                <time>{comp.observedAt ? comp.observedAt.slice(0, 10) : '—'}</time>
                <span>{comp.title || 'Untitled listing'}</span>
                <b>{typeof amount === 'number' ? money(amount, unit) : '—'}</b>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="pdp-muted">No sold comps yet for this identity.</p>
      )}
      {comps.length > shown.length ? <p className="pdp-muted">Showing {shown.length} of {comps.length}.</p> : null}
    </div>
  )
}

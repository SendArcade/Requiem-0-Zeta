import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const RANGES = ['1M', '3M', '6M', '1Y', 'ALL'] as const
type Range = (typeof RANGES)[number]
const ACCENT = '#7c50fc'
const DOT = '#8b6cf6'

type Comp = {
  title?: string
  source?: string
  displayPrice?: number
  price?: number
  observedAt?: string
  condition?: string
}

const SOURCE_LABELS: Record<string, string> = {
  mercari_jp: 'Mercari JP',
  yahoo_auctions_jp: 'Yahoo Auctions JP',
  mandarake_jp: 'Mandarake',
  suruga_ya_jp: 'Suruga-ya',
  shopee_tw: 'Shopee TW',
  ruten_tw: 'Ruten TW',
  ebay_com: 'eBay US',
  walmart_us: 'Walmart US',
  amazon_us: 'Amazon US',
}

function yen(n: number) {
  return `¥${Math.round(n).toLocaleString('ja-JP')}`
}

function axisYen(value: number) {
  const k = value / 1000
  return `¥${Math.abs(value) >= 10000 ? k.toFixed(0) : k.toFixed(1)}k`
}

function dayLabel(ts: number) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(ts))
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

function Tip({ active, payload }: { active?: boolean; payload?: Array<{ payload?: { ts?: number; price?: number; source?: string; condition?: string; median?: number } }> }) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  if (!point?.ts) return null
  const sale = typeof point.price === 'number'
  return (
    <div className="oracle-tooltip">
      <p>{dayLabel(point.ts)}</p>
      <strong>{sale ? yen(point.price as number) : `Mark ${yen(point.median ?? 0)}`}</strong>
      {sale && point.source ? <p>{SOURCE_LABELS[point.source] || point.source}</p> : null}
      {sale && point.condition ? <p>{point.condition.replaceAll('_', ' ')}</p> : null}
    </div>
  )
}

/** Same price-history chart Beyoracle renders on /requiem product pages. */
export function OracleHistory({
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
      .map((comp) => {
        const price = typeof comp.displayPrice === 'number' ? comp.displayPrice : comp.price
        const ts = comp.observedAt ? when(comp.observedAt) : NaN
        return { ts, price, date: comp.observedAt || '', source: comp.source, condition: comp.condition, title: comp.title }
      })
      .filter((point) => Number.isFinite(point.ts) && typeof point.price === 'number' && (limit == null || point.ts >= limit))
      .sort((a, b) => a.ts - b.ts)
  }, [comps, range])

  const scatter = points.map((point) => ({ ...point, date: point.date.slice(0, 10) }))
  const prices: number[] = []
  const line = points.map((point) => {
    prices.push(point.price)
    return { ts: point.ts, median: median(prices), date: point.date.slice(0, 10) }
  })
  if (mark != null && line.length) line.push({ ts: Date.now(), median: mark, date: 'Today' })

  const yMin = Math.min(...scatter.map((point) => point.price), low ?? Infinity, mark ?? Infinity)
  const yMax = Math.max(...scatter.map((point) => point.price), high ?? -Infinity, mark ?? -Infinity)
  const yPad = (Number.isFinite(yMax) && Number.isFinite(yMin) ? (yMax - yMin) * 0.12 : 0) || (Number.isFinite(yMax) ? yMax * 0.1 : 100)

  return (
    <div className="oracle-plot">
      <div className="oracle-ranges" role="tablist" aria-label="Price history window">
        {RANGES.map((item) => (
          <button key={item} type="button" className={item === range ? 'is-on' : ''} onClick={() => setRange(item)}>
            {item}
          </button>
        ))}
      </div>
      {scatter.length === 0 ? (
        <p className="pdp-muted">No sold comps in {range}.</p>
      ) : (
        <div className="oracle-chart-frame">
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart margin={{ top: 12, right: 12, bottom: 0, left: 4 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                type="number"
                dataKey="ts"
                domain={['dataMin', 'dataMax']}
                tickFormatter={dayLabel}
                tick={{ fill: '#a1a1aa', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={axisYen}
                tick={{ fill: '#a1a1aa', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={52}
                domain={[yMin - yPad, yMax + yPad]}
              />
              <Tooltip content={<Tip />} cursor={{ stroke: 'rgba(255,255,255,0.14)' }} />
              {low != null && high != null && low < high ? (
                <ReferenceArea y1={low} y2={high} fill={ACCENT} fillOpacity={0.06} strokeOpacity={0} />
              ) : null}
              {mark != null ? (
                <ReferenceLine
                  y={mark}
                  stroke={ACCENT}
                  strokeDasharray="6 4"
                  strokeWidth={1.5}
                  label={{ value: 'Current mark', position: 'insideTopRight', fill: ACCENT, fontSize: 10 }}
                />
              ) : null}
              <Line data={line} type="monotone" dataKey="median" stroke={ACCENT} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: ACCENT }} isAnimationActive={false} />
              <Scatter data={scatter} dataKey="price" fill={DOT} stroke={DOT} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
      <p className="oracle-legend">
        <i className="is-line" /> Rolling median
        <i className="is-dot" /> Sold comp
        <i className="is-mark" /> Current mark
      </p>
    </div>
  )
}

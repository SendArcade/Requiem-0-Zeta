import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ModelSlot, ModelStageProvider } from '../components/ModelStage'
import { MarketingNav } from '../components/MarketingNav'
import CountUp from '../components/reactbits/CountUp'
import { OracleValuation } from '../components/OracleValuation'
import { SoftErrorBoundary } from '../components/SoftErrorBoundary'
import { marketplaceListings, type Listing } from '../lib/assets'
import { DEMO_SHOWCASE } from '../lib/marketGate'
import {
  getOracleBridgeEntry,
  isProductOracleEligible,
} from '../lib/oracleBridge'
import { fetchListingOracle } from '../lib/requiemOracle'
import {
  modelPathForListing,
  posterForListing,
  resolveListingVisual,
  visualAssetStats,
} from '../lib/visualAssets'
import { spiritUrl } from '../lib/spirits'
import './marketplace.css'

type SortMode = 'Featured' | 'Name A-Z' | 'Oracle ready' | 'Oracle high' | 'Oracle low'

function stackOf(item: Listing) {
  return item.assembly === 'burst' && item.parts?.every((part) => part.src)
    ? item.parts.map((part) => ({ src: part.src!, texture: part.texture, tint: item.tint, role: part.role }))
    : undefined
}

function ProductCard({ item, index, onOpen }: { item: Listing; index: number; onOpen: () => void }) {
  const visual = resolveListingVisual(item.id)
  const modelSrc = modelPathForListing(item)
  const poster = posterForListing(item)
  const hasModel = Boolean(modelSrc)
  const spirit = spiritUrl(item.name)
  const stack = stackOf(item)

  return (
    <article
      className="shop-card"
      style={{ '--product-accent': item.accent } as CSSProperties}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen()
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`Open ${item.name} details`}
    >
      <div className="shop-card-art">
        <span className="shop-card-number">{String(index + 1).padStart(2, '0')}</span>
        {spirit && <img className="shop-card-spirit" src={spirit} alt="" loading="lazy" />}
        {item.badge && <img className="shop-card-chip" src={item.badge} alt="" loading="lazy" />}
        {poster && (
          <img
            className={`shop-card-poster${hasModel ? ' shop-card-poster--under' : ''}`}
            src={poster}
            alt=""
            loading="lazy"
            onError={(event) => {
              event.currentTarget.style.display = 'none'
            }}
          />
        )}
        {hasModel && (
          <SoftErrorBoundary
            label={`card-model:${item.id}`}
            fallback={<span className="shop-card-empty">No preview</span>}
          >
            <ModelSlot
              src={modelSrc!}
              texture={item.texture}
              tint={item.tint}
              stack={stack}
              className="shop-card-model"
            />
          </SoftErrorBoundary>
        )}
        {!hasModel && !poster && <span className="shop-card-empty">No preview</span>}
        <span className="shop-card-foil" aria-hidden="true" />
      </div>
      <div className="shop-card-copy">
        <h2>{item.name}</h2>
        <span className="shop-card-meta">
          {item.series} · {item.class}
        </span>
        <SoftErrorBoundary
          label={`card-oracle:${item.id}`}
          fallback={
            <strong className="shop-oracle shop-oracle--na">
              <span className="shop-oracle-kicker">Product Oracle</span>
              <span className="shop-oracle-live">Unavailable</span>
            </strong>
          }
        >
          <OracleValuation listingId={item.id} variant="compact" />
        </SoftErrorBoundary>
        <button
          type="button"
          className="shop-card-details"
          onClick={(event) => {
            event.stopPropagation()
            onOpen()
          }}
        >
          View Details
        </button>
        <code className="shop-card-id" title={item.id}>
          {item.id}
          {visual.modelExists ? '' : visual.posterExists ? ' · poster' : ' · no preview'}
        </code>
      </div>
    </article>
  )
}

export function Marketplace() {
  const navigate = useNavigate()
  const [series, setSeries] = useState<'All' | 'X' | 'Burst'>('All')
  const [type, setType] = useState<'All' | Listing['class']>('All')
  const [sort, setSort] = useState<SortMode>('Featured')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [oracleValues, setOracleValues] = useState<Record<string, number | null>>({})
  const pageSize = 24

  const catalog = useMemo(
    () => marketplaceListings.filter((item): item is Listing => Boolean(item?.id && item?.name)),
    [],
  )

  const productOracleCount = useMemo(
    () => catalog.filter((item) => isProductOracleEligible(item.id)).length,
    [catalog],
  )

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase()
    const filtered = catalog.filter((item) => {
      const bridge = getOracleBridgeEntry(item.id)
      const hay = `${item.name} ${item.series} ${item.class} ${item.id} ${bridge?.requiemProductId ?? ''} ${bridge?.requiemPartId ?? ''}`.toLowerCase()
      return (
        (series === 'All' || item.series === series) &&
        (type === 'All' || item.class === type) &&
        (!term || hay.includes(term))
      )
    })

    const byOracleReady = (a: Listing, b: Listing) =>
      Number(isProductOracleEligible(b.id)) - Number(isProductOracleEligible(a.id))

    const showcaseRank = (id: string) => {
      const i = DEMO_SHOWCASE.findIndex((s) => s.id === id)
      return i === -1 ? 99 : i
    }

    if (sort === 'Oracle ready') {
      return [...filtered].sort(byOracleReady)
    }
    if (sort === 'Name A-Z') {
      return [...filtered].sort((a, b) => a.name.localeCompare(b.name))
    }
    if (sort === 'Oracle high' || sort === 'Oracle low') {
      const dir = sort === 'Oracle high' ? -1 : 1
      return [...filtered].sort((a, b) => {
        const av = oracleValues[a.id]
        const bv = oracleValues[b.id]
        const aOk = typeof av === 'number'
        const bOk = typeof bv === 'number'
        if (aOk && bOk) return dir * (av! - bv!)
        if (aOk !== bOk) return aOk ? -1 : 1
        return byOracleReady(a, b) || a.name.localeCompare(b.name)
      })
    }
    // Featured: investor showcase anchors first, then Product Oracle ready, then name
    return [...filtered].sort(
      (a, b) =>
        showcaseRank(a.id) - showcaseRank(b.id) ||
        byOracleReady(a, b) ||
        Number(resolveListingVisual(b.id).modelExists) - Number(resolveListingVisual(a.id).modelExists) ||
        a.name.localeCompare(b.name),
    )
  }, [catalog, oracleValues, query, series, sort, type])

  useEffect(() => setPage(1), [query, series, sort, type])

  useEffect(() => {
    if (sort !== 'Oracle high' && sort !== 'Oracle low') return
    const eligible = catalog.filter((item) => isProductOracleEligible(item.id))
    let cancelled = false
    ;(async () => {
      const next: Record<string, number | null> = {}
      await Promise.all(
        eligible.map(async (item) => {
          const v = await fetchListingOracle(item.id)
          next[item.id] = v.status === 'available' && v.value != null ? v.value : null
        }),
      )
      if (!cancelled) setOracleValues((prev) => ({ ...prev, ...next }))
    })()
    return () => {
      cancelled = true
    }
  }, [catalog, sort])

  const shown = visible.slice(0, page * pageSize)
  const hero = catalog.find((item) => item.id === 'bx-002') ?? catalog[0]
  const beyCount = catalog.filter((item) => item.class !== 'Arena').length
  const openDetail = (item: Listing) => navigate(`/market/${item.id}`)

  return (
    <ModelStageProvider>
      <main className="shop-page">
        <MarketingNav active="shop" />

        <section className="pit-head">
          <div className="pit-head-copy">
            <p className="pit-kicker">Marketplace</p>
            <h1>Every Bey in the pit.</h1>
            <p>
              {visible.length} listings. Open one for the model. The Oracle price shows when BeyOracle has a mark.
            </p>
          </div>
          <button type="button" className="pit-launch" onClick={() => openDetail(hero)}>
            <span>Launch</span>
            <strong>{hero.name}</strong>
            <small>{hero.series} · {hero.id}</small>
          </button>
          <dl className="pit-counts">
            <div>
              <dt>Beys</dt>
              <dd><CountUp to={beyCount} separator="," /></dd>
            </div>
            <div>
              <dt>Models</dt>
              <dd><CountUp to={visualAssetStats.assembledModelOnDisk} separator="," /></dd>
            </div>
            <div>
              <dt>Product marks</dt>
              <dd><CountUp to={productOracleCount} separator="," /></dd>
            </div>
          </dl>
        </section>

        <section className="shop-catalogue pit-catalogue" id="market">
          <header className="shop-section-head">
            <div>
              <span className="shop-eyebrow">Full list</span>
              <h2>Catalogue</h2>
            </div>
            <p>
              {shown.length} of {visible.length}
            </p>
          </header>
          <div className="shop-controls">
            <div className="shop-tabs">
              {(['All', 'X', 'Burst'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  className={series === value ? 'active' : ''}
                  onClick={() => setSeries(value)}
                >
                  {value === 'All' ? 'All products' : `${value} series`}
                </button>
              ))}
            </div>
            <label className="shop-search">
              <Search size={15} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, series, listing id…"
              />
            </label>
            <label className="shop-select">
              <select value={type} onChange={(event) => setType(event.target.value as typeof type)}>
                <option value="All">All types</option>
                <option value="Attack">Attack</option>
                <option value="Defense">Defense</option>
                <option value="Stamina">Stamina</option>
                <option value="Balance">Balance</option>
                <option value="Arena">Arenas</option>
                <option value="Part">Parts</option>
              </select>
              <ChevronDown size={14} />
            </label>
            <label className="shop-select">
              <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>
                <option value="Featured">Featured</option>
                <option value="Name A-Z">Name A-Z</option>
                <option value="Oracle ready">Oracle ready</option>
                <option value="Oracle high">Oracle value ↓</option>
                <option value="Oracle low">Oracle value ↑</option>
              </select>
              <ChevronDown size={14} />
            </label>
          </div>
          {shown.length === 0 ? (
            <p className="shop-intro-copy">No listings match these filters.</p>
          ) : null}
          <div className="shop-grid">
            {shown.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                index={visible.indexOf(item)}
                onOpen={() => openDetail(item)}
              />
            ))}
          </div>
          {shown.length < visible.length && (
            <button className="shop-more" type="button" onClick={() => setPage((value) => value + 1)}>
              Load more products
            </button>
          )}
        </section>

        <footer className="shop-footer">
          <span>RIP BEYS / PRODUCT ARCHIVE</span>
          <small>Assets decoded for local research only. Valuation from Requiem Product Oracle.</small>
          <Link to="/lab">Open the 3D Lab</Link>
        </footer>
      </main>
    </ModelStageProvider>
  )
}

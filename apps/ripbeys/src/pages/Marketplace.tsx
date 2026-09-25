import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ModelViewer } from '../components/ModelViewer'
import { ModelSlot, ModelStageProvider } from '../components/ModelStage'
import { MarketingNav } from '../components/MarketingNav'
import CountUp from '../components/reactbits/CountUp'
import { OracleValuation } from '../components/OracleValuation'
import { SoftErrorBoundary } from '../components/SoftErrorBoundary'
import { marketplaceListings, type Listing } from '../lib/assets'
import { DEMO_SHOWCASE } from '../lib/marketGate'
import {
  catalogueStatusLabel,
  getOracleBridgeEntry,
  isProductOracleEligible,
  oracleBridgeStats,
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
  const heroModel = hero ? modelPathForListing(hero) : undefined
  const heroPoster = hero ? posterForListing(hero) : undefined
  const beyCount = catalog.filter((item) => item.class !== 'Arena').length
  const openDetail = (item: Listing) => navigate(`/market/${item.id}`)

  return (
    <ModelStageProvider>
      <main className="shop-page">
        <MarketingNav active="shop" />

        <section className="shop-intro">
          <div className="shop-intro-copy">
            <span className="shop-eyebrow">Catalogue / Requiem Oracle</span>
            <h1>
              Shop
              <br />
              <em>the build.</em>
            </h1>
            <p>
              Every recovered listing shows its own RIPBEYS mesh — not a lookalike by product code.
              Open a Bey for the full 3D + Oracle product page.
            </p>
            <div className="shop-intro-stats">
              <span>
                <b>
                  <CountUp to={beyCount} separator="," />
                </b>
                <small>Beys</small>
              </span>
              <span>
                <b>
                  <CountUp to={visualAssetStats.assembledModelOnDisk} separator="," />
                </b>
                <small>3D models</small>
              </span>
              <span>
                <b>
                  <CountUp to={productOracleCount} separator="," />
                </b>
                <small>Product Oracle</small>
              </span>
            </div>
          </div>
          <div
            className="shop-intro-product shop-intro-product--link"
            role="link"
            tabIndex={0}
            onClick={() => openDetail(hero)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                openDetail(hero)
              }
            }}
            aria-label={`Open featured ${hero.name}`}
          >
            <span>Featured / {hero.id.toUpperCase()}</span>
            {heroModel ? (
              <ModelViewer
                src={heroModel}
                texture={hero.texture}
                tint={hero.tint}
                poster={heroPoster ?? hero.image}
                height="100%"
                interactive={false}
                ground={false}
                autoRotate={false}
                spinAxis
                spin={1.15}
                presentation="hero"
              />
            ) : (
              <img className="model-poster" src={heroPoster ?? hero.image} alt="" />
            )}
            <strong>{hero.name}</strong>
            <small>
              {hero.series} series · {hero.class} · Open product
            </small>
          </div>
        </section>

        <section className="shop-showcase" aria-label="Investor demo states">
          <header className="shop-showcase-head">
            <span className="shop-eyebrow">Demo states</span>
            <p>Four real catalogue outcomes — no invented coverage.</p>
          </header>
          <div className="shop-showcase-grid">
            {DEMO_SHOWCASE.map((slot) => {
              const item = catalog.find((entry) => entry.id === slot.id)
              if (!item) return null
              const status = catalogueStatusLabel(item.id)
              return (
                <button
                  key={slot.id}
                  type="button"
                  className={`shop-showcase-card shop-showcase-card--${slot.tone}`}
                  onClick={() => openDetail(item)}
                >
                  <span className={`shop-showcase-tone shop-showcase-tone--${slot.tone}`}>{slot.label}</span>
                  <strong>{item.name}</strong>
                  <small>{slot.blurb}</small>
                  <code>{item.id}</code>
                  <span className="shop-showcase-status">{status.label}</span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="shop-catalogue" id="market">
          <header className="shop-section-head">
            <div>
              <span className="shop-eyebrow">All releases</span>
              <h2>Catalogue</h2>
            </div>
            <p>
              {shown.length} of {visible.length} · {visualAssetStats.assembledModelOnDisk} models ·{' '}
              {oracleBridgeStats.productOracle} Product Oracle
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

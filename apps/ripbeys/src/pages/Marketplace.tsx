import { useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ChevronDown, Search } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MarketingNav } from '../components/MarketingNav'
import CountUp from '../components/reactbits/CountUp'
import CRTWarp from '../components/reactbits/CRTWarp'
import GlareHover from '../components/reactbits/GlareHover'
import ShinyText from '../components/reactbits/ShinyText'
import { OracleValuation } from '../components/OracleValuation'
import { SoftErrorBoundary } from '../components/SoftErrorBoundary'
import { marketplaceListings, type Listing } from '../lib/assets'
import { DEMO_SHOWCASE } from '../lib/marketGate'
import {
  getOracleBridgeEntry,
  isOracleFetchEligible,
  isProductOracleEligible,
} from '../lib/oracleBridge'
import { fetchListingOracle } from '../lib/requiemOracle'
import {
  modelPathForListing,
  posterForListing,
  resolveListingVisual,
  oracleTitleForListing,
  visualAssetStats,
} from '../lib/visualAssets'
import { spiritUrl } from '../lib/spirits'
import './marketplace.css'

gsap.registerPlugin(ScrollTrigger)

type SortMode = 'Featured' | 'Name A-Z' | 'Oracle ready' | 'Oracle high' | 'Oracle low'

function ProductCard({ item, index, onOpen, reduceMotion }: { item: Listing; index: number; onOpen: () => void; reduceMotion: boolean }) {
  const artRef = useRef<HTMLDivElement>(null)
  const visual = resolveListingVisual(item.id)
  const modelSrc = modelPathForListing(item)
  const poster = posterForListing(item)
  const hasModel = Boolean(modelSrc)
  const spirit = spiritUrl(item.name)
  const [playSpin, setPlaySpin] = useState(false)
  const [spinFailed, setSpinFailed] = useState(false)

  useEffect(() => {
    const el = artRef.current
    if (!el || !hasModel) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setPlaySpin(true)
      },
      { rootMargin: '240px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasModel])

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
      aria-label={`Open ${oracleTitleForListing(item)} details`}
    >
      <div className="shop-card-art" ref={artRef}>
        <GlareHover
          className="shop-card-glare"
          width="100%"
          height="100%"
          background="transparent"
          borderRadius="0"
          borderColor="transparent"
          glareColor="#ffea00"
          glareOpacity={reduceMotion ? 0 : 0.28}
          glareSize={160}
          transitionDuration={480}
        >
        <span className="shop-card-number">{String(index + 1).padStart(2, '0')}</span>
        {spirit && <img className="shop-card-spirit" src={spirit} alt="" loading="lazy" />}
        {item.badge && <img className="shop-card-chip" src={item.badge} alt="" loading="lazy" />}
        {poster && (!playSpin || spinFailed) && (
          <img
            className="shop-card-poster"
            src={poster}
            alt=""
            loading="lazy"
            decoding="async"
            onError={(event) => {
              event.currentTarget.style.display = 'none'
            }}
          />
        )}
        {hasModel && playSpin && !spinFailed && (
          <img
            className="shop-card-spin"
            src={`/assets/spins/${item.id}.gif?v=2`}
            alt=""
            decoding="async"
            onError={() => setSpinFailed(true)}
          />
        )}
        {!hasModel && !poster && <span className="shop-card-empty">No preview</span>}
        <span className="shop-card-foil" aria-hidden="true" />
        </GlareHover>
      </div>
      <div className="shop-card-copy">
        <h2>{oracleTitleForListing(item)}</h2>
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
  const [reduceMotion, setReduceMotion] = useState(false)
  const [oracleValues, setOracleValues] = useState<Record<string, number | null>>({})
  const [oracleChecked, setOracleChecked] = useState(false)
  const pageSize = 12

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
      if (!oracleChecked || typeof oracleValues[item.id] !== 'number') return false
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
  }, [catalog, oracleChecked, oracleValues, query, series, sort, type])

  useEffect(() => setPage(1), [query, series, sort, type])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduceMotion(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const eligible = catalog.filter((item) => isOracleFetchEligible(item.id))
    let cancelled = false
    ;(async () => {
      const next: Record<string, number | null> = {}
      await Promise.all(
        eligible.map(async (item) => {
          const v = await fetchListingOracle(item.id)
          next[item.id] = v.status === 'available' && v.value != null ? v.value : null
        }),
      )
      if (!cancelled) {
        setOracleValues(next)
        setOracleChecked(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [catalog])

  const shown = visible.slice(0, page * pageSize)
  const priced = catalog.filter((item) => typeof oracleValues[item.id] === 'number')
  const beyCount = oracleChecked ? priced.length : 0
  const openDetail = (item: Listing) => navigate(`/market/${item.id}`)
  const pageRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const root = pageRef.current
    if (!root || reduceMotion) return
    const ctx = gsap.context(() => {
      const heroScroll = () => ({ trigger: '.pit-head', start: 'top top', end: 'bottom top', scrub: 0.6 })
      gsap.to('.pit-atmosphere', {
        yPercent: 46,
        scale: 1.45,
        ease: 'none',
        scrollTrigger: heroScroll(),
      })
      gsap.to('.pit-head-copy', {
        y: -280,
        scale: 0.82,
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: '.pit-head', start: 'top top', end: '70% top', scrub: 0.6 },
      })
      gsap.to('.pit-down', {
        y: 40,
        opacity: 0,
        ease: 'none',
        scrollTrigger: heroScroll(),
      })
      gsap.to('.pit-counts', {
        y: 180,
        x: 70,
        opacity: 0,
        ease: 'none',
        scrollTrigger: heroScroll(),
      })
      gsap.from('.nk-section h2', {
        y: 160,
        scale: 0.72,
        opacity: 0,
        duration: 1,
        ease: 'power4.out',
        scrollTrigger: { trigger: '.nk-section', start: 'top 92%' },
      })
      gsap.from('.nk-section-tools > *', {
        y: 70,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.nk-section', start: 'top 90%' },
      })
      gsap.from('.nk-tools', {
        y: 80,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.nk-tools', start: 'top 92%' },
      })
      gsap.utils.toArray<HTMLElement>('.nk-grid .shop-card').forEach((card, index) => {
        const spin = card.querySelector('.shop-card-spin, .shop-card-poster')
        gsap.from(card, {
          y: 90,
          opacity: 0,
          duration: 0.7,
          delay: (index % 3) * 0.06,
          ease: 'power3.out',
          scrollTrigger: { trigger: card, start: 'top 90%' },
        })
        if (spin) {
          gsap.fromTo(spin, { y: 24, scale: 1.06 }, {
            y: -16,
            scale: 1,
            ease: 'none',
            scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: 0.5 },
          })
        }
      })
      gsap.from('.nk-more', {
        scale: 0.8,
        y: 50,
        opacity: 0,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.nk-more', start: 'top 96%' },
      })
      gsap.from('.shop-footer > *', {
        y: 60,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.shop-footer', start: 'top 98%' },
      })
    }, root)
    return () => ctx.revert()
  }, [reduceMotion, shown.length, series, type, sort, query])

  return (
      <main className="shop-page nk-page" ref={pageRef}>
        <MarketingNav active="shop" />

        <section className="pit-head">
          <div className="pit-crt" aria-hidden="true">
          <CRTWarp
            className="pit-atmosphere"
            color="#ffea00"
            backgroundColor="#050505"
            speed={0.5}
            curvature={0.25}
            scanlineStrength={0.25}
            scanlineFrequency={160}
            waveAmplitude={0.24}
            waveFrequency={2.2}
            bloom={0.85}
            bloomRadius={1}
            noise={0.07}
            vignette={0.45}
            brightness={0.48}
            pixelation={1}
            rgbShift={0.008}
            mouseReact={!reduceMotion}
            mouseStrength={0.35}
            dpr={1}
            fps={30}
            paused={reduceMotion}
          />
          </div>
          <div className="pit-head-copy">
            <p className="pit-kicker">
              <ShinyText text="Marketplace" speed={3.4} delay={1.2} disabled={reduceMotion} color="#ffea00" shineColor="#ffffff" />
            </p>
            <h1 className="pit-title">
              <span>Every Bey</span>
              <span>in the pit.</span>
            </h1>
            <p>
              {oracleChecked
                ? `${visible.length} with a live Oracle mark.`
                : 'Checking which Beys have an Oracle value.'}
            </p>
            <a className="pit-down" href="#market">Into the archive</a>
          </div>
          <dl className="pit-counts">
            <div>
              <dt>Beys</dt>
              <dd><CountUp to={beyCount} separator="," duration={1.1} /></dd>
            </div>
            <div>
              <dt>Models</dt>
              <dd><CountUp to={visualAssetStats.assembledModelOnDisk} separator="," duration={1.1} /></dd>
            </div>
            <div>
              <dt>Product marks</dt>
              <dd><CountUp to={productOracleCount} separator="," duration={1.1} /></dd>
            </div>
          </dl>
        </section>

        <section className="nk-archive" id="market">
          <header className="nk-section">
            <h2>Archive</h2>
            <div className="nk-section-tools">
              {(['All', 'X', 'Burst'] as const).map((value) => (
                <button key={value} type="button" className={series === value ? 'active' : ''} onClick={() => { setSeries(value); setType('All') }}>
                  {value === 'All' ? 'All' : value}
                </button>
              ))}
              <span>{shown.length} / {visible.length}</span>
            </div>
          </header>
          <div className="nk-tools">
            <label className="shop-search">
              <Search size={15} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" aria-label="Search the catalogue" />
            </label>
            <label className="shop-select">
              <span className="sr-only">Sort</span>
              <select value={sort} aria-label="Sort catalogue" onChange={(event) => setSort(event.target.value as SortMode)}>
                <option value="Featured">Featured</option>
                <option value="Name A-Z">Name A-Z</option>
                <option value="Oracle ready">Oracle ready</option>
                <option value="Oracle high">Oracle value ↓</option>
                <option value="Oracle low">Oracle value ↑</option>
              </select>
              <ChevronDown size={14} />
            </label>
          </div>
          {!oracleChecked ? (
            <p className="shop-intro-copy">Checking which Beys have an Oracle value.</p>
          ) : shown.length === 0 ? (
            <p className="shop-intro-copy">No listings with an Oracle value match these filters.</p>
          ) : (
            <div className="nk-grid">
              {shown.map((item) => (
                <ProductCard
                  key={item.id}
                  item={item}
                  index={visible.indexOf(item)}
                  reduceMotion={reduceMotion}
                  onOpen={() => openDetail(item)}
                />
              ))}
            </div>
          )}
          {shown.length < visible.length && (
            <button className="nk-more" type="button" onClick={() => setPage((value) => value + 1)}>
              View all
            </button>
          )}
        </section>

        <footer className="shop-footer">
          <span>RIP BEYS / PRODUCT ARCHIVE</span>
          <small>Assets decoded for local research only. Valuation from Requiem Product Oracle.</small>
          <Link to="/lab">Open the 3D Lab</Link>
        </footer>
      </main>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Copy, Heart, Share2 } from 'lucide-react'
import type { CSSProperties } from 'react'
import { ModelViewer } from '../components/ModelViewer'
import { MarketingNav } from '../components/MarketingNav'
import { OracleRecord } from '../components/OracleRecord'
import { OracleValuation } from '../components/OracleValuation'
import { SoftErrorBoundary } from '../components/SoftErrorBoundary'
import { listingById, type BeyPart, type Listing } from '../lib/assets'
import { DEMO_SHOWCASE } from '../lib/marketGate'
import {
  catalogueStatusLabel,
  getOracleBridgeEntry,
} from '../lib/oracleBridge'
import { isFavorite, toggleFavorite } from '../lib/favorites'
import { modelPathForListing, posterForListing } from '../lib/visualAssets'
import './marketplace.css'
import './product-detail.css'

function stackOf(item: Listing) {
  return item.assembly === 'burst' && item.parts?.every((part) => part.src)
    ? item.parts.map((part) => ({ src: part.src!, texture: part.texture, tint: item.tint, role: part.role }))
    : undefined
}

function comboFromListing(item: Listing, bridgePartIds: string[]) {
  const fromName = item.name.match(/([A-Z]{0,2}\d{1,2}-\d{2}[A-Z]{1,3})\s*$/i)
  if (fromName) return fromName[1].toUpperCase()
  const ratchet = item.parts?.find((p) => p.role === 'Ratchet')?.name
  const bit = item.parts?.find((p) => p.role === 'Bit')?.name
  if (ratchet && bit && ratchet !== '—' && bit !== '—') return `${ratchet}${bit}`
  const fromIds = bridgePartIds
    .map((id) => {
      const r = id.match(/ratchet-(\d+-\d+)/i)
      const b = id.match(/bit-([a-z0-9]+)$/i)
      return { r: r?.[1], b: b?.[1]?.toUpperCase() }
    })
    .reduce(
      (acc, cur) => ({
        r: acc.r || cur.r,
        b: acc.b || cur.b,
      }),
      { r: undefined as string | undefined, b: undefined as string | undefined },
    )
  if (fromIds.r && fromIds.b) return `${fromIds.r}${fromIds.b}`
  return null
}

function Recipe({ parts, partIds }: { parts?: BeyPart[]; partIds: string[] }) {
  const rows =
    parts && parts.length
      ? parts.map((part, i) => ({
          role: part.role,
          name: part.name,
          id: partIds[i] ?? null,
        }))
      : partIds.map((id) => {
          let role = 'Part'
          if (/blade|layer/i.test(id)) role = /layer/i.test(id) ? 'Layer' : 'Blade'
          else if (/ratchet/i.test(id)) role = 'Ratchet'
          else if (/bit/i.test(id)) role = 'Bit'
          return { role, name: id, id }
        })

  if (!rows.length) {
    return <p className="pdp-muted">Recipe parts are not listed for this archive entry.</p>
  }

  return (
    <ul className="pdp-recipe">
      {rows.map((row) => (
        <li key={`${row.role}-${row.name}-${row.id ?? ''}`}>
          <span>{row.role}</span>
          <strong title={row.name}>{row.name}</strong>
          {row.id && row.id !== row.name ? <code>{row.id}</code> : null}
        </li>
      ))}
    </ul>
  )
}

export function ProductDetail() {
  const { listingId = '' } = useParams<{ listingId: string }>()
  const navigate = useNavigate()
  const item = useMemo(() => listingById(listingId), [listingId])
  const bridge = getOracleBridgeEntry(listingId)
  const status = catalogueStatusLabel(listingId)
  const modelSrc = item ? modelPathForListing(item) : undefined
  const poster = item ? posterForListing(item) : undefined
  const combo = item ? comboFromListing(item, bridge?.requiemPartIds ?? []) : null
  const [fav, setFav] = useState(false)
  const [copied, setCopied] = useState(false)
  const [shared, setShared] = useState(false)

  useEffect(() => {
    setFav(isFavorite(listingId))
    setCopied(false)
    setShared(false)
  }, [listingId])

  useEffect(() => {
    if (!item) return
    document.title = `${item.name} · RIP BEYS`
    return () => {
      document.title = 'RIP BEYS'
    }
  }, [item])

  if (!item) {
    return (
      <main className="pdp-page pdp-page--missing">
        <MarketingNav active="shop" />
        <div className="pdp-missing">
          <span className="shop-eyebrow">Catalogue</span>
          <h1>Listing not found</h1>
          <p>
            No RIPBEYS listing <code>{listingId || '—'}</code> in the archive.
          </p>
          <Link to="/market" className="pdp-back">
            <ArrowLeft size={16} /> Back to marketplace
          </Link>
        </div>
      </main>
    )
  }

  const identityText = [
    item.id,
    bridge?.requiemProductId,
    bridge?.requiemPartId,
    combo,
  ]
    .filter(Boolean)
    .join(' · ')

  const copyIdentity = async () => {
    try {
      await navigator.clipboard.writeText(identityText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      /* ignore */
    }
  }

  const shareIdentity = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: item.name, text: identityText, url })
      } else {
        await navigator.clipboard.writeText(url)
      }
      setShared(true)
      window.setTimeout(() => setShared(false), 1600)
    } catch {
      /* user cancel / ignore */
    }
  }

  const isShowcase = DEMO_SHOWCASE.some((slot) => slot.id === item.id)
  const showcaseSlot = DEMO_SHOWCASE.find((slot) => slot.id === item.id)

  return (
    <main className={`pdp-page${item.id === 'bx-002' ? ' pdp-page--showcase' : ''}`} style={{ '--product-accent': item.accent } as CSSProperties}>
      <MarketingNav active="shop" />

      <div className="pdp-toolbar">
        <button type="button" className="pdp-back" onClick={() => navigate('/market')}>
          <ArrowLeft size={16} /> Back to marketplace
        </button>
        <span className={`pdp-status pdp-status--${status.tone}`} title={status.detail}>
          {status.label}
        </span>
      </div>

      <section className="pdp-hero">
        <div className="pdp-stage" aria-label={`${item.name} 3D model`}>
          <SoftErrorBoundary
            label={`model:${item.id}`}
            fallback={
              <div className="pdp-poster-only">
                {poster ? <img src={poster} alt="" /> : null}
                <span>3D preview unavailable</span>
              </div>
            }
          >
            {modelSrc ? (
              <ModelViewer
                src={modelSrc}
                texture={item.texture}
                tint={item.tint}
                stack={stackOf(item)}
                poster={poster}
                height="100%"
                interactive
                force3D
                ground={false}
                autoRotate
                presentation="hero"
              />
            ) : poster ? (
              <div className="pdp-poster-only">
                <img src={poster} alt="" />
                <span>3D model unavailable — poster</span>
              </div>
            ) : (
              <div className="pdp-poster-only">
                <span>No preview</span>
              </div>
            )}
          </SoftErrorBoundary>
          <span className="pdp-stage-hint">Drag to orbit · scroll to zoom</span>
        </div>

        <div className="pdp-panel">
          <span className="shop-eyebrow">
            {item.series} series · {item.class}
            {showcaseSlot ? ` · ${showcaseSlot.label}` : isShowcase ? ' · Demo state' : ''}
          </span>
          {item.id === 'bx-002' && (
            <p className="pdp-kicker">Showcase product — Dagger Dran with confirmed Product Oracle mapping</p>
          )}
          <h1>{item.name}</h1>
          <p className="pdp-lede">
            RIPBEYS listing <code>{item.id}</code>
            {bridge?.requiemProductId ? (
              <>
                {' '}
                → Requiem product <code>{bridge.requiemProductId}</code>
              </>
            ) : bridge?.requiemPartId ? (
              <>
                {' '}
                → part <code>{bridge.requiemPartId}</code>
              </>
            ) : (
              <> → no confirmed Requiem product</>
            )}
            . Mesh is resolved from this listing only.
          </p>

          <dl className="pdp-facts">
            <div>
              <dt>Series</dt>
              <dd>{item.series}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{item.class}</dd>
            </div>
            {combo && (
              <div>
                <dt>Combo</dt>
                <dd>{combo}</dd>
              </div>
            )}
            {bridge?.requiemProductId && (
              <div>
                <dt>Requiem product</dt>
                <dd title={bridge.requiemProductId}>{bridge.requiemProductId}</dd>
              </div>
            )}
            {!bridge?.requiemProductId && bridge?.requiemPartId && (
              <div>
                <dt>Requiem part</dt>
                <dd title={bridge.requiemPartId}>{bridge.requiemPartId}</dd>
              </div>
            )}
          </dl>

          <div className="pdp-block">
            <h2>Recipe</h2>
            <Recipe parts={item.parts} partIds={bridge?.requiemPartIds ?? []} />
          </div>

          <div className="pdp-block">
            <h2>Oracle</h2>
            <SoftErrorBoundary
              label={`oracle:${item.id}`}
              fallback={
                <div className="shop-oracle-detail pdp-oracle" data-status="error" data-kind="none">
                  <small className="shop-oracle-label shop-oracle-label--error">Oracle unavailable</small>
                  <b className="shop-oracle-value shop-oracle-value--error">Error</b>
                  <span className="shop-oracle-band">Valuation widget failed — no price invented.</span>
                </div>
              }
            >
              <OracleValuation listingId={item.id} variant="detail" />
            </SoftErrorBoundary>
            <p className="pdp-status-note">{status.detail}</p>
          </div>

          <div className="pdp-actions">
            <button
              type="button"
              className={fav ? 'is-on' : ''}
              onClick={() => setFav(toggleFavorite(item.id))}
              aria-pressed={fav}
            >
              <Heart size={16} fill={fav ? 'currentColor' : 'none'} />
              {fav ? 'Saved' : 'Save'}
            </button>
            <button type="button" onClick={copyIdentity}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Copied' : 'Copy ID'}
            </button>
            <button type="button" onClick={shareIdentity}>
              <Share2 size={16} />
              {shared ? 'Done' : 'Share'}
            </button>
            <Link to={`/lab?bey=${encodeURIComponent(item.id)}`} className="pdp-lab">
              Open in Lab
            </Link>
          </div>

          <small className="pdp-footnote">
            No purchase or ownership transfer. Valuation from Requiem Product Oracle when available.
            Hardcoded listing prices are not market values.
          </small>
        </div>
      </section>
      <section className="oracle-board">
        <OracleRecord productId={bridge?.requiemProductId} partId={bridge?.requiemPartId} />
      </section>
    </main>
  )
}

import { useEffect, useState } from 'react'
import {
  fetchListingOracle,
  formatOracleValue,
  type ListingOracleValuation,
  type ValuationStatus,
} from '../lib/requiemOracle'
import {
  getOracleBridgeEntry,
  isPartOracleEligible,
  isProductOracleEligible,
  partMarkLabel,
  unavailableReason,
} from '../lib/oracleBridge'

type Props = {
  listingId: string
  /** compact = card (Product Oracle only); detail = product page */
  variant?: 'compact' | 'detail'
}

/**
 * Compact: Product Oracle only (never part-as-Bey-price on cards).
 * Detail: Product Oracle when eligible; otherwise optional part/layer mark with disclaimer;
 * otherwise explicit unavailable.
 */
export function OracleValuation({ listingId, variant = 'compact' }: Props) {
  const bridge = getOracleBridgeEntry(listingId)
  const productEligible = isProductOracleEligible(listingId)
  const partEligible = isPartOracleEligible(listingId)
  const [valuation, setValuation] = useState<ListingOracleValuation | null>(null)

  useEffect(() => {
    const shouldFetch =
      variant === 'compact' ? productEligible : productEligible || partEligible
    if (!shouldFetch) {
      setValuation(null)
      return
    }

    let cancelled = false
    setValuation(null)
    fetchListingOracle(listingId).then((v) => {
      if (!cancelled) setValuation(v)
    })
    return () => {
      cancelled = true
    }
  }, [listingId, productEligible, partEligible, variant])

  const blockedReason = unavailableReason(listingId)
  const productId = bridge?.requiemProductId

  if (variant === 'compact') {
    if (!productEligible) {
      const isAssembledGap = bridge?.reason === 'assembled_without_product_seed'
      return (
        <strong
          className={`shop-oracle shop-oracle--na${isAssembledGap ? ' shop-oracle--assembled-gap' : ''}`}
          title={blockedReason}
        >
          <span className="shop-oracle-kicker">Product Oracle</span>
          <span className="shop-oracle-live">{isAssembledGap ? 'No product mark' : 'Unavailable'}</span>
        </strong>
      )
    }

    const status: ValuationStatus = valuation ? valuation.status : 'loading'
    const title = productId ? `Requiem product: ${productId}` : 'Product Oracle'

    if (status === 'loading') {
      return (
        <strong className="shop-oracle shop-oracle--product shop-oracle--loading" title={title}>
          <span className="shop-oracle-kicker">Product Oracle</span>
          <span className="shop-oracle-live shop-oracle-pulse">…</span>
        </strong>
      )
    }
    if (status === 'available' && valuation?.value != null) {
      const meta = [
        valuation.nComps ? `${valuation.nComps} comps` : null,
        valuation.confidence,
        valuation.asOf ? valuation.asOf.slice(0, 10) : null,
      ]
        .filter(Boolean)
        .join(' · ')
      return (
        <strong
          className="shop-oracle shop-oracle--product shop-oracle--live"
          title={meta ? `${title} · ${meta}` : title}
        >
          <span className="shop-oracle-kicker">Product Oracle</span>
          <span className="shop-oracle-live">{formatOracleValue(valuation.value, valuation.currency)}</span>
        </strong>
      )
    }
    if (status === 'error') {
      return (
        <strong
          className="shop-oracle shop-oracle--error"
          title={valuation?.error || valuation?.reason || 'Oracle request failed'}
        >
          <span className="shop-oracle-kicker">Product Oracle</span>
          <span className="shop-oracle-live">Error</span>
        </strong>
      )
    }
    return (
      <strong
        className="shop-oracle shop-oracle--na"
        title={valuation?.reason || 'Product Oracle mark empty or unavailable'}
      >
        <span className="shop-oracle-kicker">Product Oracle</span>
        <span className="shop-oracle-live">Unavailable</span>
      </strong>
    )
  }

  // —— detail ——
  if (productEligible) {
    const status: ValuationStatus = valuation ? valuation.status : 'loading'
    return (
      <div className="shop-oracle-detail pdp-oracle" data-status={status} data-kind="product">
        {status === 'loading' && (
          <>
            <small className="shop-oracle-label">Loading Product Oracle…</small>
            <b className="shop-oracle-value shop-oracle-pulse">…</b>
          </>
        )}
        {status === 'available' && valuation && (
          <>
            <small className="shop-oracle-label">Product Oracle</small>
            <b className="shop-oracle-value">{formatOracleValue(valuation.value, valuation.currency)}</b>
            {(valuation.low != null || valuation.high != null) && (
              <span className="shop-oracle-band">
                Band {formatOracleValue(valuation.low, valuation.currency)} –{' '}
                {formatOracleValue(valuation.high, valuation.currency)}
              </span>
            )}
            <ul className="shop-oracle-ids">
              {valuation.requiemProductId && (
                <li>
                  Product <code>{valuation.requiemProductId}</code>
                </li>
              )}
              <li>
                {valuation.nComps ? `${valuation.nComps} comps` : 'Comps pending'}
                {valuation.confidence ? ` · ${valuation.confidence}` : ''}
                {valuation.asOf ? ` · as of ${valuation.asOf.slice(0, 10)}` : ''}
              </li>
            </ul>
            {valuation.comps?.sampleTitles?.length ? (
              <details className="shop-oracle-comps">
                <summary>Sample comps</summary>
                <ul>
                  {valuation.comps.sampleTitles.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </details>
            ) : null}
          </>
        )}
        {status === 'unavailable' && (
          <>
            <small className="shop-oracle-label">Product Oracle</small>
            <b className="shop-oracle-value shop-oracle-value--na">Oracle valuation unavailable</b>
            <span className="shop-oracle-band">{valuation?.reason || 'Product mark empty or unavailable'}</span>
            {productId && (
              <ul className="shop-oracle-ids">
                <li>
                  Mapped product <code>{productId}</code>
                </li>
              </ul>
            )}
          </>
        )}
        {status === 'error' && (
          <>
            <small className="shop-oracle-label shop-oracle-label--error">
              {valuation?.reason === 'oracle_timeout' ? 'Oracle timed out' : 'Oracle request failed'}
            </small>
            <b className="shop-oracle-value shop-oracle-value--error">Error</b>
            <span className="shop-oracle-band">
              {valuation?.error || valuation?.reason || 'Could not reach Requiem Oracle API'}
              . No price invented.
            </span>
          </>
        )}
      </div>
    )
  }

  if (partEligible) {
    const status: ValuationStatus = valuation ? valuation.status : 'loading'
    const mark = partMarkLabel(bridge?.partScope)
    return (
      <div className="shop-oracle-detail pdp-oracle" data-status={status} data-kind="part">
        {status === 'loading' && (
          <>
            <small className="shop-oracle-label">Loading {mark}…</small>
            <b className="shop-oracle-value shop-oracle-pulse">…</b>
          </>
        )}
        {status === 'available' && valuation && (
          <>
            <small className="shop-oracle-label">{mark}</small>
            <b className="shop-oracle-value">{formatOracleValue(valuation.value, valuation.currency)}</b>
            <span className="shop-oracle-caveat">
              This is a part / layer mark only — not the complete Bey market value.
            </span>
            <ul className="shop-oracle-ids">
              {valuation.requiemPartId && (
                <li>
                  Part <code>{valuation.requiemPartId}</code>
                </li>
              )}
              <li>
                {valuation.nComps ? `${valuation.nComps} comps` : null}
                {valuation.confidence ? ` · ${valuation.confidence}` : ''}
                {valuation.asOf ? ` · as of ${valuation.asOf.slice(0, 10)}` : ''}
              </li>
            </ul>
          </>
        )}
        {(status === 'unavailable' || status === 'error') && (
          <>
            <small className="shop-oracle-label">Product Oracle</small>
            <b className="shop-oracle-value shop-oracle-value--na">Oracle valuation unavailable</b>
            <span className="shop-oracle-band">
              No complete-product Oracle. {mark} also unavailable
              {valuation?.reason ? ` (${valuation.reason})` : ''}.
            </span>
            {bridge?.requiemPartId && (
              <ul className="shop-oracle-ids">
                <li>
                  Known part <code>{bridge.requiemPartId}</code>
                </li>
              </ul>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="shop-oracle-detail pdp-oracle" data-status="unavailable" data-kind="none">
      <small className="shop-oracle-label">Product Oracle</small>
      <b className="shop-oracle-value shop-oracle-value--na">Oracle valuation unavailable</b>
      <span className="shop-oracle-band">{blockedReason}</span>
      {bridge?.reason === 'assembled_without_product_seed' && (
        <span className="shop-oracle-caveat">
          Assembled Bey needs a canonical Requiem product seed before a complete-product Oracle can be
          shown. Blade / part marks are not used as substitutes.
        </span>
      )}
      {bridge?.requiemPartId && (
        <ul className="shop-oracle-ids">
          <li>
            Known part (not priced as Bey) <code>{bridge.requiemPartId}</code>
          </li>
        </ul>
      )}
      {productId && (
        <ul className="shop-oracle-ids">
          <li>
            Mapped product <code>{productId}</code>
          </li>
        </ul>
      )}
    </div>
  )
}

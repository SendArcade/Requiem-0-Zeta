/**
 * RIPBEYS listing ids → Oracle fetch targets (from Stage 1 map via build-oracle-bridge).
 * Never treats bx-NNN as BX-NN. Assembled X without product seed is not fetch-eligible.
 */
import bridge from '../data/oracle-bridge.json'

export type OracleKind = 'product' | 'part' | 'none'
export type PartScope = 'blade' | 'layer' | 'part'

export type OracleBridgeEntry = {
  displayName: string
  series?: string | null
  mapStatus: 'confirmed' | 'ambiguous' | 'unmatched' | 'conflict'
  oracleKind: OracleKind
  requiemProductId: string | null
  requiemPartId: string | null
  requiemPartIds: string[]
  partScope?: PartScope | null
  reason: string | null
}

const byId = bridge.byListingId as Record<string, OracleBridgeEntry>

export const oracleBridgeStats = bridge.stats as {
  total: number
  productOracle: number
  partOracle: number
  unavailable: number
  demotedAssembledXWithoutProduct?: number
}

export function getOracleBridgeEntry(listingId: string | null | undefined): OracleBridgeEntry | null {
  if (!listingId) return null
  return byId[listingId] ?? null
}

/** True when the listing may call Requiem /api/product or /api/asset. */
export function isOracleFetchEligible(listingId: string | null | undefined): boolean {
  const e = getOracleBridgeEntry(listingId)
  return e?.oracleKind === 'product' || e?.oracleKind === 'part'
}

/** Marketplace grid live pricing — product Oracle only. */
export function isProductOracleEligible(listingId: string | null | undefined): boolean {
  return getOracleBridgeEntry(listingId)?.oracleKind === 'product'
}

/** Part-scope Oracle eligible (blade/layer mark — never complete-Bey price). */
export function isPartOracleEligible(listingId: string | null | undefined): boolean {
  return getOracleBridgeEntry(listingId)?.oracleKind === 'part'
}

/** Compact / title label for part-scope marks (never "Oracle Value"). */
export function partMarkLabel(scope: PartScope | null | undefined): string {
  if (scope === 'blade') return 'Blade mark'
  if (scope === 'layer') return 'Layer mark'
  return 'Part mark'
}

/** Human-readable catalogue / Oracle status for product detail UI. */
export function catalogueStatusLabel(listingId: string | null | undefined): {
  label: string
  tone: 'product' | 'part' | 'gap' | 'warn' | 'mute'
  detail: string
} {
  const e = getOracleBridgeEntry(listingId)
  if (!e) {
    return { label: 'Unavailable', tone: 'mute', detail: 'Listing is not in the Oracle bridge.' }
  }
  if (e.oracleKind === 'product') {
    return {
      label: 'Product Oracle',
      tone: 'product',
      detail: e.requiemProductId
        ? `Canonical product ${e.requiemProductId}`
        : 'Confirmed complete-product Oracle mapping',
    }
  }
  if (e.reason === 'assembled_without_product_seed') {
    return {
      label: 'Needs product seed',
      tone: 'gap',
      detail: 'Assembled Bey has parts but no canonical complete-product seed yet.',
    }
  }
  if (e.oracleKind === 'part') {
    return {
      label: partMarkLabel(e.partScope),
      tone: 'part',
      detail: 'Part / layer mark only — not a complete Bey market value.',
    }
  }
  if (e.mapStatus === 'ambiguous') {
    return {
      label: 'Ambiguous',
      tone: 'warn',
      detail: 'Identity is ambiguous — Oracle withheld until a catalogue decision.',
    }
  }
  if (e.mapStatus === 'conflict') {
    return {
      label: 'Conflict',
      tone: 'warn',
      detail: unavailableReason(listingId) || 'Catalogue conflict — Oracle withheld.',
    }
  }
  return {
    label: 'Unavailable',
    tone: 'mute',
    detail: unavailableReason(listingId) || 'Oracle valuation unavailable.',
  }
}

export function unavailableReason(listingId: string | null | undefined): string {
  const e = getOracleBridgeEntry(listingId)
  if (!e) return 'listing_not_in_bridge'
  if (e.oracleKind !== 'none') return ''
  if (e.reason === 'assembled_without_product_seed') {
    return 'Complete-product Oracle unavailable — no canonical product seed for this assembled Bey'
  }
  if (e.mapStatus === 'conflict') {
    return e.reason === 'bx-20-catalog-split'
      ? 'Catalogue conflict (BX-20 / Dran Dagger vs Shark Edge) — Oracle withheld'
      : `Catalogue conflict — Oracle withheld (${e.reason ?? 'unresolved'})`
  }
  if (e.mapStatus === 'ambiguous') return 'Identity ambiguous — Oracle withheld until catalogue decision'
  if (e.mapStatus === 'unmatched') return 'No confirmed Requiem identity — Oracle unavailable'
  if (e.reason === 'confirmed_without_blade_part') return 'Confirmed identity lacks a blade/layer part for Oracle'
  return e.reason ?? 'Oracle unavailable'
}

/**
 * Catalogue market gate.
 *
 * Default: OPEN (investor / local demo).
 * Public launch: set VITE_MARKET_OPEN=0 (or "false") to restore ComingSoon on /market.
 * Product detail routes stay behind the same gate.
 */
export function isMarketOpen(): boolean {
  const raw = (import.meta.env.VITE_MARKET_OPEN as string | undefined)?.trim().toLowerCase()
  if (raw === undefined || raw === '') return true
  return raw !== '0' && raw !== 'false' && raw !== 'off' && raw !== 'gated'
}

/** Investor walkthrough anchors — real bridge states, no invented catalogue. */
export const DEMO_SHOWCASE = [
  {
    id: 'bx-002',
    label: 'Product Oracle',
    blurb: 'Dagger Dran — live complete-product mark',
    tone: 'product' as const,
  },
  {
    id: 'bx-024',
    label: 'Part mark',
    blurb: 'Dranzer Spiral — blade mark only, not Bey price',
    tone: 'part' as const,
  },
  {
    id: 'bx-007',
    label: 'Needs product seed',
    blurb: 'Courage Dran — assembled, no product seed yet',
    tone: 'gap' as const,
  },
  {
    id: 'bx-001',
    label: 'Unavailable',
    blurb: 'Dran Sword — ambiguous identity, Oracle withheld',
    tone: 'mute' as const,
  },
] as const

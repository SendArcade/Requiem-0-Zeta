// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, expect, it, vi } from 'vitest'
import { Marketplace } from './Marketplace'

const { fetchOracle } = vi.hoisted(() => ({ fetchOracle: vi.fn() }))
vi.mock('../lib/requiemOracle', () => ({ fetchListingOracle: fetchOracle }))
vi.mock('../lib/assets', () => ({ marketplaceListings: [
  { id: 'unpriced', name: 'Alpha', series: 'X', class: 'Attack' },
  { id: 'priced', name: 'Zulu', series: 'X', class: 'Attack' },
] }))
vi.mock('../lib/oracleBridge', () => ({
  isProductOracleEligible: () => true,
  getOracleBridgeEntry: (id: string) => ({ requiemProductId: id }),
}))
vi.mock('../lib/visualAssets', () => ({
  resolveListingVisual: () => ({ modelExists: false, posterExists: false }),
  modelPathForListing: () => undefined,
  posterForListing: () => undefined,
  oracleTitleForListing: (item: { name: string }) => item.name,
  visualAssetStats: { assembledModelOnDisk: 0 },
}))
vi.mock('../lib/spirits', () => ({ spiritUrl: () => undefined }))
vi.mock('../components/MarketingNav', () => ({ MarketingNav: () => null }))
vi.mock('../components/OracleValuation', () => ({ OracleValuation: () => null }))
vi.mock('../components/reactbits/CountUp', () => ({ default: ({ to }: { to: number }) => <span>{to}</span> }))
vi.mock('../components/reactbits/CRTWarp', () => ({ default: () => null }))
vi.mock('../components/reactbits/GlareHover', () => ({ default: () => null }))
vi.mock('../components/reactbits/ShinyText', () => ({ default: () => null }))
vi.mock('gsap', () => ({ gsap: { registerPlugin() {}, context: () => ({ revert() {} }) } }))
vi.mock('gsap/ScrollTrigger', () => ({ ScrollTrigger: {} }))

afterEach(() => vi.unstubAllGlobals())

it('counts available marks and sorts them ahead of mapped but unpriced entries', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  let finish!: () => void
  fetchOracle.mockImplementation((id: string) => new Promise(resolve => {
    if (id === 'priced') finish = () => resolve({ status: 'available', value: 1500 })
    else resolve({ status: 'unavailable', value: null })
  }))
  const host = document.createElement('div')
  document.body.append(host)
  const root = createRoot(host)
  try {
    await act(async () => root.render(<MemoryRouter><Marketplace /></MemoryRouter>))
    const count = () => Array.from(host.querySelectorAll('dt')).find(x => x.textContent === 'Product marks')?.nextElementSibling?.textContent
    expect(count()).toBe('…')
    await act(async () => finish())
    expect(count()).toBe('1')
    expect(host.textContent).toContain('1 with a live Product Oracle value. 2 in the archive.')
    const sort = host.querySelector('select')!
    await act(async () => {
      sort.value = 'Oracle ready'
      sort.dispatchEvent(new Event('change', { bubbles: true }))
    })
    expect(Array.from(host.querySelectorAll('.shop-card h2')).map(x => x.textContent)).toEqual(['Zulu', 'Alpha'])
  } finally {
    await act(async () => root.unmount())
    host.remove()
  }
})

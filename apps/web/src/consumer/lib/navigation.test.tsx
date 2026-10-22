// @vitest-environment happy-dom
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { Link, NavLink, useNavigate, useSearchParams } from './navigation'
const routing = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }))
vi.mock('next/navigation', () => ({
  useRouter: () => routing,
  usePathname: () => '/market',
  useParams: () => ({ listingId: 'bx-002' }),
  useSearchParams: () => new URLSearchParams('sort=name'),
}))
vi.mock('next/link', () => ({ default: ({ href, prefetch: _, ...props }: Record<string, unknown>) => <a href={href as string} {...props} /> }))
let host: HTMLDivElement
let root: ReturnType<typeof createRoot>
beforeEach(() => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true)
  vi.clearAllMocks()
  window.history.replaceState(null, '', '/market?sort=name')
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
})
afterEach(async () => { await act(async () => root.unmount()); host.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals() })
it('uses Next navigation for paths, query changes and replacement', async () => {
  let navigate!: ReturnType<typeof useNavigate>
  function Probe() { navigate = useNavigate(); return null }
  await act(async () => root.render(<Probe />))
  navigate('/market/bx-002')
  navigate({ pathname: '/lab', search: '?id=bx-002', hash: 'viewer' }, { replace: true })
  expect(routing.push).toHaveBeenCalledWith('/market/bx-002')
  expect(routing.replace).toHaveBeenCalledWith('/lab?id=bx-002#viewer')
})
it('updates same-page hashes and preserves browser history navigation', async () => {
  let navigate!: ReturnType<typeof useNavigate>
  function Probe() { navigate = useNavigate(); return null }
  await act(async () => root.render(<Probe />))
  const hashChange = vi.fn()
  window.addEventListener('hashchange', hashChange)
  navigate('/market?sort=name#archive')
  expect(window.location.hash).toBe('#archive')
  expect(hashChange).toHaveBeenCalledOnce()
  expect(routing.push).not.toHaveBeenCalled()
  const go = vi.spyOn(window.history, 'go').mockImplementation(() => {})
  navigate(-1)
  expect(go).toHaveBeenCalledWith(-1)
  window.removeEventListener('hashchange', hashChange)
})
it('updates query parameters without losing the hash', async () => {
  let setParams!: ReturnType<typeof useSearchParams>[1]
  function Probe() { const [, setter] = useSearchParams(); setParams = setter; return null }
  window.history.replaceState(null, '', '/market?sort=name#archive')
  await act(async () => root.render(<Probe />))
  setParams({ sort: 'oracle ready' }, { replace: true })
  expect(routing.replace).toHaveBeenCalledWith('/market?sort=oracle+ready#archive')
})
it('renders links with native hrefs and correct active states', async () => {
  await act(async () => root.render(<><Link to="/docs">Docs</Link><NavLink to="/market" end className={({ isActive }) => isActive ? 'active' : ''}>Market</NavLink><NavLink to="/x">X</NavLink></>))
  expect(host.querySelector('a')?.getAttribute('href')).toBe('/docs')
  expect(host.querySelector('.active')?.getAttribute('aria-current')).toBe('page')
  expect(host.querySelector('a[href="/x"]')?.hasAttribute('aria-current')).toBe(false)
})

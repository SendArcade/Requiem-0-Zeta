import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCallback, useEffect, type MouseEvent } from 'react'
import { StaggeredMenu, type StaggeredMenuItem } from './reactbits/StaggeredMenu'
import './reactbits/reactbits-overrides.css'
import FluidGlass from './reactbits/FluidGlass'
import './site-nav.css'

type NavArea = 'home' | 'shop' | 'lab' | 'hub' | 'docs' | 'gacha'

type NavLink = {
  to: string
  label: string
  area: NavArea
  hash?: string
}

const links: NavLink[] = [
  { to: '/', label: 'Home', area: 'home' },
  { to: '/#beys', label: 'Beys', area: 'home', hash: 'beys' },
  { to: '/lab', label: 'Lab', area: 'lab' },
  { to: '/docs', label: 'Docs', area: 'docs' },
  { to: '/market', label: 'Catalogue', area: 'shop' },
  { to: '/gacha', label: 'Gacha', area: 'gacha' },
]

const menuItems: StaggeredMenuItem[] = [
  { label: 'Home', ariaLabel: 'Go to home page', link: '/' },
  { label: 'Beys', ariaLabel: 'Open beys', link: '/#beys' },
  { label: 'Lab', ariaLabel: 'Open 3D Lab', link: '/lab' },
  { label: 'Docs', ariaLabel: 'Open documentation', link: '/docs' },
  { label: 'Catalogue', ariaLabel: 'Open catalogue', link: '/market' },
  { label: 'Gacha', ariaLabel: 'Open gacha', link: '/gacha' },
]

const NAV_OFFSET = 72

export function scrollToHash(hash: string, behavior: ScrollBehavior = 'smooth') {
  const id = hash.replace(/^#/, '')
  if (!id) {
    window.scrollTo({ top: 0, behavior })
    return
  }
  const el = document.getElementById(id)
  if (!el) return
  const top = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET
  window.scrollTo({ top: Math.max(0, top), behavior })
}

/** Scroll to hash targets after route / hash changes (RR does not do this alone). */
export function HashScroll() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (pathname !== '/') return
    const run = () => scrollToHash(hash || '', hash ? 'smooth' : 'auto')
    const id = window.setTimeout(run, 40)
    return () => window.clearTimeout(id)
  }, [pathname, hash])

  return null
}

function isLinkActive(link: NavLink, pathname: string, hash: string, area: NavArea) {
  if (link.hash) return pathname === '/' && hash === `#${link.hash}`
  if (link.to === '/') return pathname === '/' && !hash
  if (link.to === '/market') return pathname === '/market' || pathname.startsWith('/market/')
  if (link.to === '/docs') return pathname === '/docs' || pathname.startsWith('/docs/')
  return area === link.area && pathname === link.to
}

export function MarketingNav({ active, overlay = false, glass = false }: { active: NavArea; overlay?: boolean; glass?: boolean }) {
  const { pathname, hash } = useLocation()
  const navigate = useNavigate()

  const go = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, link: NavLink) => {
      window.dispatchEvent(new Event('rb-nav'))
      if (link.hash) {
        event.preventDefault()
        if (pathname === '/') {
          navigate({ pathname: '/', hash: link.hash })
          scrollToHash(link.hash)
        } else {
          navigate({ pathname: '/', hash: link.hash })
        }
        return
      }
      if (link.to === '/' && pathname === '/') {
        event.preventDefault()
        navigate({ pathname: '/', hash: '' })
        scrollToHash('')
      }
    },
    [navigate, pathname],
  )

  return (
    <>
      <HashScroll />
      <header className={`site-nav${overlay ? ' site-nav-overlay' : ''}${glass ? ' site-nav--glass' : ''}`} data-active={active}>
        {glass ? <FluidGlass className="site-nav-glass" /> : null}
        <Link to="/" className="site-brand cursor-target" aria-label="Rip Beys home" onClick={(e) => go(e, links[0])}>
          <img className="site-brand-mark" src="/assets/ripbeys-logo.png" alt="" width={36} height={36} />
          <span>RIPBEYS</span>
        </Link>
        <nav className="site-nav-links" aria-label="Archive">
          {links.map((link) => (
            <Link
              key={link.label}
              to={link.to}
              className={`cursor-target${isLinkActive(link, pathname, hash, active) ? ' active' : ''}`}
              onClick={(e) => go(e, link)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </header>
      <StaggeredMenu
        className="marketing-staggered-menu"
        isFixed
        position="right"
        items={menuItems}
        displaySocials={false}
        displayItemNumbering
        menuButtonColor="#f5f5f5"
        openMenuButtonColor="#f5f5f5"
        accentColor="#FFEA00"
        colors={['#1a1200', '#FFEA00']}
        closeOnClickAway
      />
    </>
  )
}

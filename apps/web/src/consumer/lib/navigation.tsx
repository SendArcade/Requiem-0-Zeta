'use client'

import NextLink from 'next/link'
import { usePathname, useRouter, useParams as nextParams, useSearchParams as nextSearch } from 'next/navigation'
import { useCallback, useEffect, useState, type ComponentProps } from 'react'

type Destination = string | { pathname: string; hash?: string; search?: string }
function destination(to: Destination) {
  if (typeof to === 'string') return to
  return `${to.pathname}${to.search || ''}${to.hash ? `#${to.hash.replace(/^#/, '')}` : ''}`
}

/** Small prop adapter for existing UI components; Next owns all routing and history. */
export function useNavigate() {
  const router = useRouter()
  return useCallback((to: Destination | number, options?: { replace?: boolean }) => {
    if (typeof to === 'number') { window.history.go(to); return }
    const href = destination(to)
    const target = new URL(href, window.location.href)
    if (target.pathname === window.location.pathname && target.search === window.location.search) {
      window.history[options?.replace ? 'replaceState' : 'pushState'](null, '', href)
      window.dispatchEvent(new Event('hashchange'))
      return
    }
    router[options?.replace ? 'replace' : 'push'](href)
  }, [router])
}

export function useLocation() {
  const pathname = usePathname() || '/'
  const params = nextSearch()
  const [hash, setHash] = useState('')
  useEffect(() => {
    const sync = () => setHash(window.location.hash)
    sync()
    window.addEventListener('hashchange', sync)
    window.addEventListener('popstate', sync)
    return () => { window.removeEventListener('hashchange', sync); window.removeEventListener('popstate', sync) }
  }, [pathname, params])
  return { pathname, hash, search: params.size ? `?${params}` : '' }
}

export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>() {
  return nextParams() as T
}

export function useSearchParams() {
  const params = nextSearch()
  const pathname = usePathname() || '/'
  const navigate = useNavigate()
  const setParams = useCallback((value: Record<string, string>, options?: { replace?: boolean }) => {
    const search = new URLSearchParams(value).toString()
    navigate(`${pathname}${search ? `?${search}` : ''}${window.location.hash}`, options)
  }, [navigate, pathname])
  return [new URLSearchParams(params.toString()), setParams] as const
}

type LinkProps = Omit<ComponentProps<typeof NextLink>, 'href'> & { to: string }
export function Link({ to, onClick, ...props }: LinkProps) {
  const pathname = usePathname()
  const navigate = useNavigate()
  return <NextLink {...props} href={to} prefetch={props.prefetch ?? false} onClick={event => {
    onClick?.(event)
    if (!event.defaultPrevented && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && to.includes('#') && to.split('#')[0] === pathname) {
      event.preventDefault()
      navigate(to)
    }
  }} />
}

export function NavLink({ to, end = false, className, ...props }: Omit<LinkProps, 'className'> & { end?: boolean; className?: string | ((state: { isActive: boolean }) => string | undefined) }) {
  const pathname = usePathname() || '/'
  const isActive = end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`)
  return <Link {...props} to={to} aria-current={isActive ? 'page' : undefined} className={typeof className === 'function' ? className({ isActive }) : className} />
}

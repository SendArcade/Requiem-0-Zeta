'use client'

import { Component, Suspense, useEffect, type ErrorInfo, type ReactNode } from 'react'
import MorphBox from './components/reactbits/MorphBox'
import { useLocation } from './lib/navigation'

type ErrorState = { error: Error | null }
class ConsumerErrorBoundary extends Component<{ children: ReactNode }, ErrorState> {
  state: ErrorState = { error: null }
  static getDerivedStateFromError(error: Error): ErrorState { return { error } }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('Rip Beys route failed', error, info) }
  render() {
    if (this.state.error) return <main className="app-error"><span className="app-error-mark">RB</span><p>Archive preview unavailable</p><h1>That route dropped a part.</h1><button type="button" onClick={() => window.location.reload()}>Reload the archive</button></main>
    return this.props.children
  }
}
function RouteEffects() {
  const { pathname, hash } = useLocation()
  useEffect(() => { if (!(pathname === '/' && hash)) window.scrollTo({ top: 0, left: 0, behavior: 'auto' }) }, [pathname, hash])
  return null
}
export default function ConsumerShell({ children }: { children: ReactNode }) {
  return <ConsumerErrorBoundary><Suspense fallback={<p role="status">Opening archive…</p>}><RouteEffects /><MorphBox />{children}</Suspense></ConsumerErrorBoundary>
}

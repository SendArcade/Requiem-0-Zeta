import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Component, lazy, Suspense, useEffect, type ErrorInfo, type ReactNode } from 'react'
import MorphBox from './components/reactbits/MorphBox'
import { isMarketOpen } from './lib/marketGate'
import { Landing } from './pages/Landing'

const Splash = lazy(() => import('./pages/Hub').then((module) => ({ default: module.Splash })))
const Hub = lazy(() => import('./pages/Hub').then((module) => ({ default: module.Hub })))
const GalleryPage = lazy(() => import('./pages/Gallery').then((module) => ({ default: module.GalleryPage })))
const ReferenceScreens = lazy(() => import('./pages/ReferenceScreens').then((module) => ({ default: module.ReferenceScreens })))
const ComingSoon = lazy(() => import('./pages/ComingSoon').then((module) => ({ default: module.ComingSoon })))
const Marketplace = lazy(() => import('./pages/Marketplace').then((module) => ({ default: module.Marketplace })))
const SpinBake = import.meta.env.DEV
  ? lazy(() => import('./pages/SpinBake').then((module) => ({ default: module.SpinBake })))
  : null
const ProductDetail = lazy(() => import('./pages/ProductDetail').then((module) => ({ default: module.ProductDetail })))
const DocsPage = lazy(() => import('./pages/Docs').then((module) => ({ default: module.DocsPage })))
const GachaPage = lazy(() => import('./pages/Gacha').then((module) => ({ default: module.GachaPage })))
// Landing is eager so the glitch intro is the first paint — no "Opening archive" screen
// const Landing = lazy(() => import('./pages/Landing').then((module) => ({ default: module.Landing })))
const XRoutesLayout = lazy(() => import('./pages/XPages').then((module) => ({ default: module.XRoutesLayout })))
const XHome = lazy(() => import('./pages/XPages').then((module) => ({ default: module.XHome })))
const XScan = lazy(() => import('./pages/XPages').then((module) => ({ default: module.XScan })))
const XBattle = lazy(() => import('./pages/XPages').then((module) => ({ default: module.XBattle })))
const XGym = lazy(() => import('./pages/XPages').then((module) => ({ default: module.XGym })))
const XCollection = lazy(() => import('./pages/XPages').then((module) => ({ default: module.XCollection })))
const XSettings = lazy(() => import('./pages/XPages').then((module) => ({ default: module.XSettings })))
const BurstLayout = lazy(() => import('./pages/BurstPages').then((module) => ({ default: module.BurstLayout })))
const BurstHome = lazy(() => import('./pages/BurstPages').then((module) => ({ default: module.BurstHome })))
const BurstCustomize = lazy(() => import('./pages/BurstPages').then((module) => ({ default: module.BurstCustomize })))
const BurstBattle = lazy(() => import('./pages/BurstPages').then((module) => ({ default: module.BurstBattle })))
const BurstScan = lazy(() => import('./pages/BurstPages').then((module) => ({ default: module.BurstScan })))
const BurstLeague = lazy(() => import('./pages/BurstPages').then((module) => ({ default: module.BurstLeague })))
const BurstProfile = lazy(() => import('./pages/BurstPages').then((module) => ({ default: module.BurstProfile })))
const BurstSettings = lazy(() => import('./pages/BurstPages').then((module) => ({ default: module.BurstSettings })))
const BurstShop = lazy(() => import('./pages/BurstPages').then((module) => ({ default: module.BurstShop })))

type AppErrorState = { error: Error | null }

class AppErrorBoundary extends Component<{ children: ReactNode }, AppErrorState> {
  state: AppErrorState = { error: null }

  static getDerivedStateFromError(error: Error): AppErrorState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Rip Beys route failed', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <main className="app-error">
          <span className="app-error-mark">RB</span>
          <p>Archive preview unavailable</p>
          <h1>That route dropped a part.</h1>
          <button type="button" onClick={() => window.location.reload()}>Reload the archive</button>
        </main>
      )
    }
    return this.props.children
  }
}

function RouteLoading() {
  return <main className="route-loading route-loading--blank" aria-busy="true" />
}

/** Keep SPA navigations starting at the top (except in-page hash scrolls on home). */
function ScrollToTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (pathname === '/' && hash) return
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname, hash])
  return null
}

/** Local/investor demo opens the catalogue; set VITE_MARKET_OPEN=0 to restore ComingSoon for public launch. */
function MarketOrGate() {
  return isMarketOpen() ? <Marketplace /> : <ComingSoon />
}

function ProductOrGate() {
  return isMarketOpen() ? <ProductDetail /> : <ComingSoon />
}

export default function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<RouteLoading />}>
          <MorphBox />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/market" element={<MarketOrGate />} />
            {SpinBake ? <Route path="/spin-bake" element={<SpinBake />} /> : null}
            <Route path="/market/:listingId" element={<ProductOrGate />} />
            <Route path="/game" element={<Splash />} />
            <Route path="/hub" element={<Hub />} />
            <Route path="/lab" element={<GalleryPage />} />
            <Route path="/gacha" element={<GachaPage />} />
            <Route path="/docs" element={<DocsPage />} />
            <Route path="/docs/:slug" element={<DocsPage />} />
            <Route path="/gallery" element={<Navigate to="/lab" replace />} />
            <Route path="/screens" element={<ReferenceScreens />} />
            <Route path="/x" element={<XRoutesLayout />}>
              <Route index element={<XHome />} />
              <Route path="scan" element={<XScan />} />
              <Route path="battle" element={<XBattle />} />
              <Route path="gym" element={<XGym />} />
              <Route path="collection" element={<XCollection />} />
              <Route path="settings" element={<XSettings />} />
            </Route>
            <Route path="/burst" element={<BurstLayout />}>
              <Route index element={<BurstHome />} />
              <Route path="shop" element={<BurstShop />} />
              <Route path="customize" element={<BurstCustomize />} />
              <Route path="battle" element={<BurstBattle />} />
              <Route path="scan" element={<BurstScan />} />
              <Route path="league" element={<BurstLeague />} />
              <Route path="profile" element={<BurstProfile />} />
              <Route path="settings" element={<BurstSettings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppErrorBoundary>
  )
}

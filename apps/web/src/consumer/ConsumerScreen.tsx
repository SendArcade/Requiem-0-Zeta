'use client'
import dynamic from 'next/dynamic'
import { isMarketOpen } from './lib/marketGate'

const loading = () => <p role="status">Opening archive…</p>
const Landing = dynamic(() => import('./pages/Landing').then(module => module.Landing), { ssr: false, loading })
const Splash = dynamic(() => import('./pages/Hub').then(module => module.Splash), { ssr: false, loading })
const Hub = dynamic(() => import('./pages/Hub').then(module => module.Hub), { ssr: false, loading })
const GalleryPage = dynamic(() => import('./pages/Gallery').then(module => module.GalleryPage), { ssr: false, loading })
const ReferenceScreens = dynamic(() => import('./pages/ReferenceScreens').then(module => module.ReferenceScreens), { ssr: false, loading })
const ComingSoon = dynamic(() => import('./pages/ComingSoon').then(module => module.ComingSoon), { ssr: false, loading })
const Marketplace = dynamic(() => import('./pages/Marketplace').then(module => module.Marketplace), { ssr: false, loading })
const ProductDetail = dynamic(() => import('./pages/ProductDetail').then(module => module.ProductDetail), { ssr: false, loading })
const DocsPage = dynamic(() => import('./pages/Docs').then(module => module.DocsPage), { ssr: false, loading })
const GachaPage = dynamic(() => import('./pages/Gacha').then(module => module.GachaPage), { ssr: false, loading })
const SpinBake = dynamic(() => import('./pages/SpinBake').then(module => module.SpinBake), { ssr: false, loading })
const XRoutesLayout = dynamic(() => import('./pages/XPages').then(module => module.XRoutesLayout), { ssr: false, loading })
const XHome = dynamic(() => import('./pages/XPages').then(module => module.XHome), { ssr: false, loading })
const XScan = dynamic(() => import('./pages/XPages').then(module => module.XScan), { ssr: false, loading })
const XBattle = dynamic(() => import('./pages/XPages').then(module => module.XBattle), { ssr: false, loading })
const XGym = dynamic(() => import('./pages/XPages').then(module => module.XGym), { ssr: false, loading })
const XCollection = dynamic(() => import('./pages/XPages').then(module => module.XCollection), { ssr: false, loading })
const XSettings = dynamic(() => import('./pages/XPages').then(module => module.XSettings), { ssr: false, loading })
const BurstLayout = dynamic(() => import('./pages/BurstPages').then(module => module.BurstLayout), { ssr: false, loading })
const BurstHome = dynamic(() => import('./pages/BurstPages').then(module => module.BurstHome), { ssr: false, loading })
const BurstShop = dynamic(() => import('./pages/BurstPages').then(module => module.BurstShop), { ssr: false, loading })
const BurstCustomize = dynamic(() => import('./pages/BurstPages').then(module => module.BurstCustomize), { ssr: false, loading })
const BurstBattle = dynamic(() => import('./pages/BurstPages').then(module => module.BurstBattle), { ssr: false, loading })
const BurstScan = dynamic(() => import('./pages/BurstPages').then(module => module.BurstScan), { ssr: false, loading })
const BurstLeague = dynamic(() => import('./pages/BurstPages').then(module => module.BurstLeague), { ssr: false, loading })
const BurstProfile = dynamic(() => import('./pages/BurstPages').then(module => module.BurstProfile), { ssr: false, loading })
const BurstSettings = dynamic(() => import('./pages/BurstPages').then(module => module.BurstSettings), { ssr: false, loading })

const screens = { Landing, Splash, Hub, GalleryPage, ReferenceScreens, ComingSoon, Marketplace, ProductDetail, DocsPage, GachaPage, SpinBake, XHome, XScan, XBattle, XGym, XCollection, XSettings, BurstHome, BurstShop, BurstCustomize, BurstBattle, BurstScan, BurstLeague, BurstProfile, BurstSettings }
export function ConsumerScreen({ screen, frame }: { screen: keyof typeof screens; frame?: 'x' | 'burst' }) {
  const Screen = !isMarketOpen() && (screen === 'Marketplace' || screen === 'ProductDetail') ? ComingSoon : screens[screen]
  if (frame === 'x') return <XRoutesLayout><Screen /></XRoutesLayout>
  if (frame === 'burst') return <BurstLayout><Screen /></BurstLayout>
  return <Screen />
}

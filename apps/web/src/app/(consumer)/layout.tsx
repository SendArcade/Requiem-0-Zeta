import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { ConsumerBoundary } from '@/consumer/ConsumerBoundary'
import '@/consumer/index.css'

import '../mobile.css'

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#000000' }
export const metadata: Metadata = {
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'RIPBEYS' },
  title: 'Rip Beys — Let it rip.',
  description: 'Rip Beys — Beyblade X and Burst archive. Spin recovered meshes. Browse the drop.',
  icons: { icon: '/favicon.png', apple: '/apple-touch-icon.png' },
}
export default function Layout({ children }: { children: ReactNode }) {
  return <html lang="en"><head>
    <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=nippo@400,500,700&display=swap" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=Pixelify+Sans:wght@400;500;700&family=Reenie+Beanie&display=swap" />
  </head><body>
    <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute', overflow: 'hidden' }}><filter id="rb-spray" x="-25%" y="-25%" width="150%" height="150%"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="7" result="n" /><feDisplacementMap in="SourceGraphic" in2="n" scale="2.8" xChannelSelector="R" yChannelSelector="G" /></filter></svg>
    <div id="root"><ConsumerBoundary>{children}</ConsumerBoundary></div>
  </body></html>
}

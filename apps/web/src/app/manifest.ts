import type { MetadataRoute } from 'next'
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/', name: 'RIPBEYS — Beyblade Archive', short_name: 'RIPBEYS',
    description: 'Explore the Beyblade archive, 3D Lab and product pricing.',
    start_url: '/', scope: '/', display: 'standalone', background_color: '#000000', theme_color: '#000000',
    icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }],
    shortcuts: [{ name: 'Catalogue', url: '/market' }, { name: '3D Lab', url: '/lab' }],
  }
}

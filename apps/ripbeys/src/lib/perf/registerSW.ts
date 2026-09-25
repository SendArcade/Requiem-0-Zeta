/**
 * Register the production service worker (cache shells + media).
 * No-op in Vite dev so HMR stays clean.
 */

export function registerServiceWorker() {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) return
  if (import.meta.env.DEV) return

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[sw] register failed', err)
    })
  })
}

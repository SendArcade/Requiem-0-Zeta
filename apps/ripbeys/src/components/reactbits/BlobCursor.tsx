import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import './BlobCursor.css'

export default function BlobCursor() {
  const { pathname } = useLocation()
  const skip = pathname.startsWith('/x') || pathname.startsWith('/burst') || pathname === '/game'
  const blob = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (skip) return
    const node = blob.current
    if (!node) return
    if (window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(any-pointer: fine)').matches) return

    document.documentElement.classList.add('rb-blob-on')
    let x = window.innerWidth / 2
    let y = window.innerHeight / 2
    let cx = x
    let cy = y
    let hover = false
    let frame = 0

    const hot = 'a, button, .cursor-target, .rb-tile, .rb-type, .rb-pill, .rb-mega'
    const onMove = (event: MouseEvent) => {
      x = event.clientX
      y = event.clientY
      const target = event.target
      hover = target instanceof Element && Boolean(target.closest(hot))
    }
    const tick = () => {
      cx += (x - cx) * 0.18
      cy += (y - cy) * 0.18
      const scale = hover ? 2.15 : 1
      node.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%) scale(${scale})`
      node.classList.toggle('is-hot', hover)
      frame = requestAnimationFrame(tick)
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('mousemove', onMove)
      document.documentElement.classList.remove('rb-blob-on')
    }
  }, [pathname, skip])

  if (skip || typeof document === 'undefined') return null
  return createPortal(<div ref={blob} className="rb-blob" aria-hidden="true" />, document.body)
}

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import './RipCursor.css'

const SKIP = ['/x', '/burst', '/game']
const HOVER = 'a, button, [role="button"], input, select, textarea, summary, label, [href], .rb-tile, .rb-pill, .rb-crew-card, .shop-card, .shop-more, .site-brand, .site-nav-links a, .site-nav'

function isHot(x: number, y: number) {
  for (const node of document.elementsFromPoint(x, y)) {
    if (!(node instanceof Element)) continue
    if (node.closest('.rb-cursor-root')) continue
    if (node.matches(HOVER) || node.closest(HOVER)) return true
  }
  return false
}

export function RipCursor() {
  const { pathname } = useLocation()
  const skip = SKIP.some((path) => pathname.startsWith(path))
  const root = useRef<HTMLDivElement>(null)
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const sparks = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    if (skip) return
    const host = root.current
    const d = dot.current
    const r = ring.current
    if (!host || !d || !r) return

    const bits = sparks.current
    let x = window.innerWidth / 2
    let y = window.innerHeight / 2
    let rx = x
    let ry = y
    let scale = 1
    let hover = false
    let armed = false
    let frame = 0
    const trail = bits.map(() => ({ x, y }))

    const paint = () => {
      if (!armed) return
      rx += (x - rx) * 0.16
      ry += (y - ry) * 0.16
      scale += ((hover ? 2.8 : 1) - scale) * 0.18
      d.style.left = `${x}px`
      d.style.top = `${y}px`
      r.style.left = `${rx}px`
      r.style.top = `${ry}px`
      r.style.setProperty('--rb-s', String(scale))
      r.classList.toggle('is-hover', hover)

      let px = rx
      let py = ry
      trail.forEach((point, index) => {
        point.x += (px - point.x) * (0.28 - index * 0.02)
        point.y += (py - point.y) * (0.28 - index * 0.02)
        px = point.x
        py = point.y
        const spark = bits[index]
        if (!spark) return
        spark.style.left = `${point.x}px`
        spark.style.top = `${point.y}px`
        spark.style.opacity = armed ? String(0.55 - index * 0.07) : '0'
      })
    }

    const onPointer = (event: MouseEvent) => {
      if ('pointerType' in event && (event as PointerEvent).pointerType === 'touch') return
      x = event.clientX
      y = event.clientY
      hover = isHot(x, y)
      if (!armed) {
        armed = true
        rx = x
        ry = y
        trail.forEach((point) => {
          point.x = x
          point.y = y
        })
        document.documentElement.classList.add('rb-cursor-on')
        host.classList.add('is-on')
      }
      paint()
    }

    const tick = () => {
      paint()
      frame = requestAnimationFrame(tick)
    }

    document.addEventListener('pointermove', onPointer, { passive: true, capture: true })
    document.addEventListener('mousemove', onPointer, { passive: true, capture: true })
    frame = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('pointermove', onPointer, true)
      document.removeEventListener('mousemove', onPointer, true)
      document.documentElement.classList.remove('rb-cursor-on')
    }
  }, [pathname, skip])

  if (skip || typeof document === 'undefined') return null

  return createPortal(
    <div ref={root} className="rb-cursor-root" aria-hidden="true">
      {Array.from({ length: 7 }, (_, index) => (
        <i
          key={index}
          className="rb-cursor-spark"
          ref={(node) => {
            if (node) sparks.current[index] = node as HTMLDivElement
          }}
        />
      ))}
      <div ref={ring} className="rb-cursor-ring" />
      <div ref={dot} className="rb-cursor-dot" />
    </div>,
    document.body,
  )
}

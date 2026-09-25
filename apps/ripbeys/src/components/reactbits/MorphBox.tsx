import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import './MorphBox.css'

/** Headings / mega titles only — not a global cursor:none */
const SELECTOR =
  '.rb-mega, .rb-mega h2, .rb-under, .rb-hi h2, .rb-hi-script, .rb-quote p, .rb-lab-row h3, .rb-type h3, .rb-hero-punk, .rb-hero-line'

function hashText(value: string) {
  let h = 0
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0
  return h
}

const ACCENTS = [
  '#ffea00',
  '#c8ff00',
  '#13fff3',
  '#ff4d9a',
  '#ff6b2c',
  '#a78bfa',
  '#60a5fa',
]

function accentFor(el: Element) {
  const text = (el.textContent || '').trim().toLowerCase()
  const h = hashText(text || el.className)
  return ACCENTS[h % ACCENTS.length]
}

function randomFrame() {
  const kind = Math.random()
  let w: number
  let h: number
  if (kind < 0.34) {
    const s = 118 + Math.random() * 72
    w = s
    h = s
  } else if (kind < 0.67) {
    w = 148 + Math.random() * 100
    h = 86 + Math.random() * 54
  } else {
    w = 86 + Math.random() * 54
    h = 148 + Math.random() * 100
  }
  const rot =
    Math.random() < 0.22
      ? (Math.random() - 0.5) * 8
      : (Math.random() < 0.5 ? -1 : 1) * (7 + Math.random() * 32)
  const dur = 0.32 + Math.random() * 0.12
  return { w: Math.round(w), h: Math.round(h), rot: Math.round(rot * 10) / 10, dur }
}

export default function MorphBox() {
  const { pathname } = useLocation()
  const skip = pathname.startsWith('/x') || pathname.startsWith('/burst') || pathname === '/game'
  const root = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (skip) return
    const node = root.current
    const shell = inner.current
    if (!node || !shell) return
    if (window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(any-pointer: fine)').matches) return

    let armed = false
    let closing = false
    let closeTimer = 0
    let x = 0
    let y = 0
    let cx = 0
    let cy = 0
    let frame = 0
    let last: HTMLElement | null = null
    let running = false

    const clearClose = () => {
      if (closeTimer) {
        window.clearTimeout(closeTimer)
        closeTimer = 0
      }
      closing = false
      shell.classList.remove('is-close')
      node.classList.remove('is-closing')
    }

    const finishHide = () => {
      clearClose()
      armed = false
      node.classList.remove('is-on', 'is-open')
      shell.classList.remove('is-pop', 'is-close')
      if (last) last.style.cursor = ''
      last = null
    }

    const hide = () => {
      armed = false
      if (last) {
        last.style.cursor = ''
        last = null
      }
      if (!node.classList.contains('is-on') || closing) return
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        finishHide()
        return
      }

      closing = true
      shell.classList.remove('is-pop')
      void shell.offsetWidth
      shell.classList.add('is-close')
      node.classList.add('is-closing')
      node.classList.remove('is-open')

      const closeMs =
        (parseFloat(shell.style.getPropertyValue('--morph-close')) ||
          parseFloat(getComputedStyle(shell).getPropertyValue('--morph-close')) ||
          0.28) * 1000
      closeTimer = window.setTimeout(() => {
        if (closing) finishHide()
      }, closeMs + 30)
    }

    const openOn = (el: HTMLElement) => {
      clearClose()
      const shape = randomFrame()
      const ink = accentFor(el)
      const closeDur = Math.max(0.22, shape.dur * 0.72)
      shell.style.setProperty('--morph-rot', `${shape.rot}deg`)
      shell.style.setProperty('--morph-dur', `${shape.dur}s`)
      shell.style.setProperty('--morph-close', `${closeDur}s`)
      node.style.setProperty('--morph-ink', ink)
      node.style.width = `${shape.w}px`
      node.style.height = `${shape.h}px`
      shell.classList.remove('is-pop', 'is-close')
      void shell.offsetWidth
      shell.classList.add('is-pop')
      node.classList.add('is-on', 'is-open')
      node.classList.remove('is-closing')
    }

    const tick = () => {
      const follow = armed ? 0.42 : 0.28
      cx += (x - cx) * follow
      cy += (y - cy) * follow
      node.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%)`
      const dx = Math.abs(x - cx)
      const dy = Math.abs(y - cy)
      if (!armed && !closing && dx < 0.4 && dy < 0.4) {
        running = false
        frame = 0
        return
      }
      frame = requestAnimationFrame(tick)
    }

    const kick = () => {
      if (running) return
      running = true
      frame = requestAnimationFrame(tick)
    }

    const onMove = (event: MouseEvent) => {
      x = event.clientX
      y = event.clientY
      const hit = event.target
      if (!(hit instanceof Element)) {
        hide()
        kick()
        return
      }
      const next = hit.closest(SELECTOR)
      if (!next) {
        hide()
        kick()
        return
      }
      const nextEl = next instanceof HTMLElement ? next : next.parentElement
      if (!nextEl) {
        hide()
        kick()
        return
      }
      if (last !== nextEl) {
        if (last) last.style.cursor = ''
        last = nextEl
        last.style.cursor = 'none'
        openOn(nextEl)
      }
      armed = true
      node.classList.add('is-on')
      kick()
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    return () => {
      if (frame) cancelAnimationFrame(frame)
      if (closeTimer) window.clearTimeout(closeTimer)
      window.removeEventListener('mousemove', onMove)
      finishHide()
    }
  }, [pathname, skip])

  if (skip || typeof document === 'undefined') return null

  return createPortal(
    <div ref={root} className="rb-morph-box" aria-hidden="true">
      <div ref={inner} className="rb-morph-inner">
        <div className="rb-morph-fill" />
        <i />
        <i />
        <i />
        <i />
      </div>
    </div>,
    document.getElementById('root') ?? document.body,
  )
}

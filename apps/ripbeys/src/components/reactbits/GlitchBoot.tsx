import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import GlitchText from './GlitchText'
import './GlitchBoot.css'

type GlitchBootProps = {
  onUnlock: () => void
  onDone: () => void
  onMorph?: () => void
}

function isPhoneBoot() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(max-width: 700px)').matches ||
    (window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(any-pointer: fine)').matches)
  )
}

export default function GlitchBoot({ onUnlock, onDone, onMorph }: GlitchBootProps) {
  const [leaving, setLeaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [ready, setReady] = useState(false)
  const [phone] = useState(isPhoneBoot)
  const finished = useRef(false)
  const unlocked = useRef(false)
  const morphed = useRef(false)
  const touchY = useRef(0)
  const touchMoved = useRef(false)
  const target = useRef(0)
  const current = useRef(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef(0)
  const lastTs = useRef(0)
  const lastDocWrite = useRef(-1)

  useEffect(() => {
    setMounted(true)
    const t = window.setTimeout(() => setReady(true), 24)
    return () => window.clearTimeout(t)
  }, [])

  const paint = useCallback((value: number) => {
    current.current = value
    const node = rootRef.current
    const rounded = Math.round(value * 250) / 250
    if (node) node.style.setProperty('--boot-pull', rounded.toFixed(3))
    if (Math.abs(rounded - lastDocWrite.current) >= 0.008) {
      lastDocWrite.current = rounded
      document.documentElement.style.setProperty('--boot-pull', rounded.toFixed(3))
    }
    if (value > 0.03) node?.classList.add('is-pulling')
    else node?.classList.remove('is-pulling')
  }, [])

  const handoff = useCallback(() => {
    if (finished.current) return
    finished.current = true
    if (!unlocked.current) {
      unlocked.current = true
      onUnlock()
    }
    if (!morphed.current) {
      morphed.current = true
      onMorph?.()
    }
    target.current = 1
    paint(1)
    document.documentElement.style.setProperty('--boot-pull', '1')
    setLeaving(true)
    window.scrollTo(0, 0)
    window.setTimeout(() => onDone(), phone ? 320 : 420)
  }, [onUnlock, onDone, onMorph, paint, phone])

  // Phone: short auto intro — no scroll gate
  useEffect(() => {
    if (!mounted || !phone) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.style.setProperty('--boot-pull', '1')
      onUnlock()
      onMorph?.()
      onDone()
      return
    }

    document.documentElement.style.setProperty('--boot-pull', '0')
    const unlockT = window.setTimeout(() => {
      if (!unlocked.current) {
        unlocked.current = true
        onUnlock()
      }
      if (!morphed.current) {
        morphed.current = true
        onMorph?.()
      }
      paint(0.35)
    }, 420)
    const doneT = window.setTimeout(() => handoff(), 1600)
    return () => {
      window.clearTimeout(unlockT)
      window.clearTimeout(doneT)
    }
  }, [mounted, phone, handoff, onUnlock, onDone, onMorph, paint])

  // Desktop: scroll / wheel gate
  useEffect(() => {
    if (!mounted || phone) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.style.setProperty('--boot-pull', '1')
      onUnlock()
      onMorph?.()
      onDone()
      return
    }

    const tick = (ts: number) => {
      if (!lastTs.current) lastTs.current = ts
      const dt = Math.min(32, ts - lastTs.current) / 16.67
      lastTs.current = ts
      const k = 1 - Math.pow(0.86, dt)
      const next = current.current + (target.current - current.current) * k
      const settled = Math.abs(target.current - next) < 0.0012
      paint(settled ? target.current : next)

      if (!unlocked.current && current.current >= 0.18) {
        unlocked.current = true
        onUnlock()
      }
      if (!morphed.current && current.current >= 0.28) {
        morphed.current = true
        onMorph?.()
      }
      if (!finished.current && current.current >= 0.992) {
        handoff()
        rafRef.current = 0
        lastTs.current = 0
        return
      }
      if (settled) {
        rafRef.current = 0
        lastTs.current = 0
      } else {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    const kick = () => {
      if (!rafRef.current) {
        lastTs.current = 0
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    const push = (delta: number) => {
      if (finished.current) return
      target.current = Math.min(1, Math.max(0, target.current + delta))
      kick()
    }

    const onWheel = (event: WheelEvent) => {
      if (finished.current) return
      if (event.deltaY <= 0) {
        if (target.current > 0.001 && target.current < 1) {
          event.preventDefault()
          push(event.deltaY / 1050)
        }
        return
      }
      event.preventDefault()
      push(Math.min(0.1, event.deltaY / 780))
    }

    const onKey = (event: KeyboardEvent) => {
      if (finished.current) return
      if (event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === ' ' || event.key === 'Enter') {
        event.preventDefault()
        push(0.22)
      }
    }

    const onTouchStart = (event: TouchEvent) => {
      touchY.current = event.touches[0]?.clientY ?? 0
      touchMoved.current = false
    }

    const onTouchMove = (event: TouchEvent) => {
      if (finished.current) return
      const y = event.touches[0]?.clientY ?? touchY.current
      const dy = touchY.current - y
      touchY.current = y
      if (Math.abs(dy) < 3) return
      touchMoved.current = true
      event.preventDefault()
      push(dy / 360)
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
    }
  }, [mounted, phone, paint, handoff, onUnlock, onDone, onMorph])

  const onBootActivate = () => {
    if (finished.current) return
    if (phone || !touchMoved.current) handoff()
  }

  if (!mounted || typeof document === 'undefined') return null

  return createPortal(
    <div
      ref={rootRef}
      className={`rb-boot${ready ? ' is-ready' : ''}${leaving ? ' is-out' : ''}${phone ? ' is-phone' : ''}`}
      role="dialog"
      aria-label={phone ? 'Rip Beys intro' : 'Rip Beys intro — scroll to enter'}
      style={{ ['--boot-pull' as string]: '0' }}
      onClick={onBootActivate}
    >
      <div className="rb-boot-veil" aria-hidden="true" />
      <div className="rb-boot-stack">
        <img className="rb-boot-logo" src="/assets/ripbeys-logo.png" alt="" width={88} height={88} draggable={false} />
        {phone ? (
          <h1 className="rb-boot-title-plain">RIPBEYS</h1>
        ) : (
          <GlitchText speed={1} enableShadows enableOnHover={false} className="rb-boot-glitch-text">
            RIPBEYS
          </GlitchText>
        )}
        <div className="rb-boot-scroll" aria-hidden="true">
          {phone ? <span className="rb-boot-scroll-phone">Tap to skip</span> : <span className="rb-boot-scroll-desk">Scroll to enter</span>}
          {!phone ? <i /> : null}
        </div>
      </div>
      {!phone ? (
        <div className="rb-boot-rail" aria-hidden="true">
          <span />
        </div>
      ) : (
        <div className="rb-boot-progress" aria-hidden="true">
          <span />
        </div>
      )}
    </div>,
    document.body,
  )
}

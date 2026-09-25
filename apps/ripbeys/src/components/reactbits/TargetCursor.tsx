import { createPortal } from 'react-dom'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { gsap } from 'gsap'
import './TargetCursor.css'

export interface TargetCursorProps {
  targetSelector?: string
  spinDuration?: number
  hideDefaultCursor?: boolean
  hoverDuration?: number
  parallaxOn?: boolean
}

const TargetCursor = ({
  targetSelector = '.cursor-target',
  spinDuration = 2,
  hideDefaultCursor = true,
  hoverDuration = 0.2,
  parallaxOn = true,
}: TargetCursorProps) => {
  const { pathname } = useLocation()
  const skip = pathname.startsWith('/x') || pathname.startsWith('/burst') || pathname === '/game'
  const cursorRef = useRef<HTMLDivElement>(null)
  const cornersRef = useRef<NodeListOf<HTMLDivElement> | null>(null)
  const spinTl = useRef<gsap.core.Timeline | null>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const isActiveRef = useRef(false)
  const targetCornerPositionsRef = useRef<{ x: number; y: number }[] | null>(null)
  const tickerFnRef = useRef<(() => void) | null>(null)
  const activeStrengthRef = useRef({ current: 0 })

  const isTouchOnly = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(any-pointer: fine)').matches
  }, [])

  const constants = useMemo(() => ({ borderWidth: 3, cornerSize: 12 }), [])

  const moveCursor = useCallback((x: number, y: number) => {
    if (!cursorRef.current) return
    gsap.to(cursorRef.current, { x, y, duration: 0.1, ease: 'power3.out' })
  }, [])

  useEffect(() => {
    if (isTouchOnly || skip || !cursorRef.current) return
    const originalCursor = document.body.style.cursor
    if (hideDefaultCursor) document.body.style.cursor = 'none'
    document.documentElement.classList.add('rb-target-cursor')

    const cursor = cursorRef.current
    cornersRef.current = cursor.querySelectorAll('.target-cursor-corner')

    let activeTarget: Element | null = null
    let currentLeaveHandler: (() => void) | null = null
    let resumeTimeout: ReturnType<typeof setTimeout> | null = null

    const cleanupTarget = (target: Element) => {
      if (currentLeaveHandler) target.removeEventListener('mouseleave', currentLeaveHandler)
      currentLeaveHandler = null
    }

    gsap.set(cursor, { xPercent: -50, yPercent: -50, x: window.innerWidth / 2, y: window.innerHeight / 2 })

    const createSpinTimeline = () => {
      spinTl.current?.kill()
      spinTl.current = gsap.timeline({ repeat: -1 }).to(cursor, { rotation: '+=360', duration: spinDuration, ease: 'none' })
    }
    createSpinTimeline()

    const tickerFn = () => {
      if (!targetCornerPositionsRef.current || !cursorRef.current || !cornersRef.current) return
      const strength = activeStrengthRef.current.current
      if (strength === 0) return
      const cursorX = gsap.getProperty(cursorRef.current, 'x') as number
      const cursorY = gsap.getProperty(cursorRef.current, 'y') as number
      Array.from(cornersRef.current).forEach((corner, index) => {
        const currentX = gsap.getProperty(corner, 'x') as number
        const currentY = gsap.getProperty(corner, 'y') as number
        const targetX = targetCornerPositionsRef.current![index].x - cursorX
        const targetY = targetCornerPositionsRef.current![index].y - cursorY
        const duration = strength >= 0.99 ? (parallaxOn ? 0.2 : 0) : 0.05
        gsap.to(corner, {
          x: currentX + (targetX - currentX) * strength,
          y: currentY + (targetY - currentY) * strength,
          duration,
          ease: duration === 0 ? 'none' : 'power1.out',
          overwrite: 'auto',
        })
      })
    }
    tickerFnRef.current = tickerFn

    const moveHandler = (event: MouseEvent) => moveCursor(event.clientX, event.clientY)
    window.addEventListener('mousemove', moveHandler)

    const mouseDownHandler = () => {
      if (!dotRef.current) return
      gsap.to(dotRef.current, { scale: 0.7, duration: 0.3 })
      gsap.to(cursorRef.current, { scale: 0.9, duration: 0.2 })
    }
    const mouseUpHandler = () => {
      if (!dotRef.current) return
      gsap.to(dotRef.current, { scale: 1, duration: 0.3 })
      gsap.to(cursorRef.current, { scale: 1, duration: 0.2 })
    }
    window.addEventListener('mousedown', mouseDownHandler)
    window.addEventListener('mouseup', mouseUpHandler)

    const enterHandler = (event: MouseEvent) => {
      const directTarget = event.target as Element
      const allTargets: Element[] = []
      let current: Element | null = directTarget
      while (current && current !== document.body) {
        if (current.matches(targetSelector)) allTargets.push(current)
        current = current.parentElement
      }
      const target = allTargets[0] || null
      if (!target || !cursorRef.current || !cornersRef.current) return
      if (activeTarget === target) return
      if (activeTarget) cleanupTarget(activeTarget)
      if (resumeTimeout) {
        clearTimeout(resumeTimeout)
        resumeTimeout = null
      }

      activeTarget = target
      const corners = Array.from(cornersRef.current)
      corners.forEach((corner) => gsap.killTweensOf(corner, 'x,y'))
      gsap.killTweensOf(cursorRef.current, 'rotation')
      spinTl.current?.pause()
      gsap.set(cursorRef.current, { rotation: 0 })

      const rect = target.getBoundingClientRect()
      const { borderWidth, cornerSize } = constants
      const cursorX = gsap.getProperty(cursorRef.current, 'x') as number
      const cursorY = gsap.getProperty(cursorRef.current, 'y') as number
      targetCornerPositionsRef.current = [
        { x: rect.left - borderWidth, y: rect.top - borderWidth },
        { x: rect.right + borderWidth - cornerSize, y: rect.top - borderWidth },
        { x: rect.right + borderWidth - cornerSize, y: rect.bottom + borderWidth - cornerSize },
        { x: rect.left - borderWidth, y: rect.bottom + borderWidth - cornerSize },
      ]
      isActiveRef.current = true
      gsap.ticker.add(tickerFnRef.current!)
      gsap.to(activeStrengthRef.current, { current: 1, duration: hoverDuration, ease: 'power2.out' })
      corners.forEach((corner, index) => {
        gsap.to(corner, {
          x: targetCornerPositionsRef.current![index].x - cursorX,
          y: targetCornerPositionsRef.current![index].y - cursorY,
          duration: 0.2,
          ease: 'power2.out',
        })
      })

      const leaveHandler = () => {
        gsap.ticker.remove(tickerFnRef.current!)
        isActiveRef.current = false
        targetCornerPositionsRef.current = null
        gsap.set(activeStrengthRef.current, { current: 0, overwrite: true })
        activeTarget = null
        if (cornersRef.current) {
          const resetCorners = Array.from(cornersRef.current)
          gsap.killTweensOf(resetCorners, 'x,y')
          const { cornerSize: size } = constants
          const positions = [
            { x: -size * 1.5, y: -size * 1.5 },
            { x: size * 0.5, y: -size * 1.5 },
            { x: size * 0.5, y: size * 0.5 },
            { x: -size * 1.5, y: size * 0.5 },
          ]
          const timeline = gsap.timeline()
          resetCorners.forEach((corner, index) => {
            timeline.to(corner, { x: positions[index].x, y: positions[index].y, duration: 0.3, ease: 'power3.out' }, 0)
          })
        }
        resumeTimeout = setTimeout(() => {
          if (!activeTarget && cursorRef.current && spinTl.current) {
            const currentRotation = (gsap.getProperty(cursorRef.current, 'rotation') as number) % 360
            spinTl.current.kill()
            gsap.to(cursorRef.current, {
              rotation: currentRotation + 360,
              duration: spinDuration * (1 - currentRotation / 360),
              ease: 'none',
              onComplete: () => createSpinTimeline(),
            })
          }
          resumeTimeout = null
        }, 50)
        cleanupTarget(target)
      }

      currentLeaveHandler = leaveHandler
      target.addEventListener('mouseleave', leaveHandler)
    }

    window.addEventListener('mouseover', enterHandler)

    return () => {
      if (tickerFnRef.current) gsap.ticker.remove(tickerFnRef.current)
      window.removeEventListener('mousemove', moveHandler)
      window.removeEventListener('mouseover', enterHandler)
      window.removeEventListener('mousedown', mouseDownHandler)
      window.removeEventListener('mouseup', mouseUpHandler)
      if (activeTarget) cleanupTarget(activeTarget)
      spinTl.current?.kill()
      document.body.style.cursor = originalCursor
      document.documentElement.classList.remove('rb-target-cursor')
    }
  }, [constants, hideDefaultCursor, hoverDuration, isTouchOnly, moveCursor, parallaxOn, skip, spinDuration, targetSelector])

  if (isTouchOnly || skip) return null

  return createPortal(
    <div ref={cursorRef} className="target-cursor-wrapper">
      <div ref={dotRef} className="target-cursor-dot" />
      <div className="target-cursor-corner corner-tl" />
      <div className="target-cursor-corner corner-tr" />
      <div className="target-cursor-corner corner-br" />
      <div className="target-cursor-corner corner-bl" />
    </div>,
    document.body,
  )
}

export default TargetCursor

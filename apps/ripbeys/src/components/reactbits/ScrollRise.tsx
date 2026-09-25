import { useEffect, useRef, type ElementType, type ReactNode } from 'react'

type ScrollRiseProps = {
  children: ReactNode
  className?: string
  stagger?: number
  as?: ElementType
  id?: string
}

/** Punk-leaning scroll reveal: rise + slight skew, no card zoom. */
export default function ScrollRise({ children, className = '', stagger = 70, as: Tag = 'div', id }: ScrollRiseProps) {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = root.current
    if (!node) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      node.classList.add('is-in')
      node.querySelectorAll('[data-rise-item]').forEach((el) => el.classList.add('is-in'))
      return
    }

    // Array.from: NodeListOf is not always Iterable under this tsconfig lib set
    const items = Array.from(node.querySelectorAll<HTMLElement>('[data-rise-item]'))
    items.forEach((el, index) => {
      el.style.setProperty('--rise-delay', `${index * stagger}ms`)
    })

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('is-in')
          io.unobserve(entry.target)
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -6% 0px' },
    )

    io.observe(node)
    items.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [stagger])

  return (
    <Tag ref={root} id={id} className={`rb-rise ${className}`.trim()} data-rise>
      {children}
    </Tag>
  )
}

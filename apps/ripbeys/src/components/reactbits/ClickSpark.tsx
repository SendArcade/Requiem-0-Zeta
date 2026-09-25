import { useCallback, useEffect, useRef, type ReactNode } from 'react'

interface ClickSparkProps {
  sparkColor?: string
  sparkSize?: number
  sparkRadius?: number
  sparkCount?: number
  duration?: number
  extraScale?: number
  children?: ReactNode
}

interface Spark {
  x: number
  y: number
  angle: number
  startTime: number
}

export default function ClickSpark({
  sparkColor = '#ffea00',
  sparkSize = 10,
  sparkRadius = 18,
  sparkCount = 10,
  duration = 420,
  extraScale = 1,
  children,
}: ClickSparkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sparksRef = useRef<Spark[]>([])
  const rafRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const parent = canvas.parentElement
    if (!parent) return

    const resizeCanvas = () => {
      const { width, height } = parent.getBoundingClientRect()
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
    }

    const observer = new ResizeObserver(resizeCanvas)
    observer.observe(parent)
    resizeCanvas()
    return () => observer.disconnect()
  }, [])

  const stopLoop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }
  }, [])

  const drawFrame = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      sparksRef.current = sparksRef.current.filter((spark) => {
        const elapsed = timestamp - spark.startTime
        if (elapsed >= duration) return false
        const eased = (elapsed / duration) * (2 - elapsed / duration)
        const distance = eased * sparkRadius * extraScale
        const lineLength = sparkSize * (1 - elapsed / duration)
        ctx.strokeStyle = sparkColor
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(spark.x + distance * Math.cos(spark.angle), spark.y + distance * Math.sin(spark.angle))
        ctx.lineTo(
          spark.x + (distance + lineLength) * Math.cos(spark.angle),
          spark.y + (distance + lineLength) * Math.sin(spark.angle),
        )
        ctx.stroke()
        return true
      })

      if (sparksRef.current.length) {
        rafRef.current = requestAnimationFrame(drawFrame)
      } else {
        rafRef.current = 0
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    },
    [duration, extraScale, sparkColor, sparkRadius, sparkSize],
  )

  useEffect(() => () => stopLoop(), [stopLoop])

  const handleClick = useCallback(
    (event: React.MouseEvent) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      const now = performance.now()
      sparksRef.current.push(
        ...Array.from({ length: sparkCount }, (_, index) => ({
          x,
          y,
          angle: (2 * Math.PI * index) / sparkCount,
          startTime: now,
        })),
      )
      if (!rafRef.current) rafRef.current = requestAnimationFrame(drawFrame)
    },
    [drawFrame, sparkCount],
  )

  return (
    <div className="click-spark" onClick={handleClick}>
      <canvas ref={canvasRef} />
      {children}
    </div>
  )
}

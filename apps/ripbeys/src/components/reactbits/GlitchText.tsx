import './GlitchText.css'

type GlitchTextProps = {
  children: string
  speed?: number
  enableShadows?: boolean
  enableOnHover?: boolean
  className?: string
}

export default function GlitchText({
  children,
  speed = 1,
  enableShadows = true,
  enableOnHover = false,
  className = '',
}: GlitchTextProps) {
  const inlineStyles = {
    ['--after-duration' as string]: `${speed * 3}s`,
    ['--before-duration' as string]: `${speed * 2}s`,
    ['--after-shadow' as string]: enableShadows ? '-5px 0 rgba(255, 60, 120, 0.85)' : 'none',
    ['--before-shadow' as string]: enableShadows ? '5px 0 rgba(40, 255, 220, 0.75)' : 'none',
  }

  const hoverClass = enableOnHover ? 'enable-on-hover' : ''

  return (
    <div className={`glitch ${hoverClass} ${className}`.trim()} style={inlineStyles} data-text={children}>
      {children}
    </div>
  )
}

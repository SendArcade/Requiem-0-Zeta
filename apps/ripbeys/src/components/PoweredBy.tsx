import './powered-by.css'

type PoweredByProps = {
  className?: string
}

export function PoweredBy({ className = '' }: PoweredByProps) {
  return (
    <div className={`rb-powered ${className}`.trim()}>
      <span>Powered by</span>
      <a className="rb-powered-link" href="https://solana.com/" target="_blank" rel="noreferrer" aria-label="Solana">
        <img src="/assets/partners/solana.svg" alt="" width={88} height={28} />
      </a>
      <i aria-hidden="true" />
      <a className="rb-powered-link" href="https://www.magicblock.xyz/" target="_blank" rel="noreferrer" aria-label="MagicBlock">
        <img src="/assets/partners/magicblock.svg" alt="" width={120} height={24} />
      </a>
    </div>
  )
}

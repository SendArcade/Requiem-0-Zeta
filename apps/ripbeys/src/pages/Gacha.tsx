import { useEffect, useMemo, useState } from 'react'
import { MarketingNav } from '../components/MarketingNav'
import { ModelViewer } from '../components/ModelViewer'
import { listingById } from '../lib/assets'
import { modelPathForListing, posterForListing } from '../lib/visualAssets'
import './gacha.css'

const PACKS = [
  { id: 'oracle', name: 'Oracle Pack', listingId: 'bx-229' },
  { id: 'shinobi', name: 'Shinobi Pack', listingId: 'bx-225' },
] as const

const PRIZES = [
  { productId: 'prod-x-ux-05-complete-loose', listingId: 'bx-225' },
  { productId: 'prod-x-ux-01-complete-loose', listingId: 'bx-229' },
  { productId: 'prod-x-ux-11-complete-loose', listingId: 'bx-217' },
  { productId: 'prod-x-ux-06-complete-loose', listingId: 'bx-249' },
  { productId: 'prod-x-ux-09-complete-loose', listingId: 'bx-254' },
  { productId: 'prod-x-bx-31-complete-loose', listingId: 'bx-226' },
  { productId: 'prod-x-bx-34-complete-loose', listingId: 'bx-004' },
  { productId: 'prod-x-cx-02-complete-loose', listingId: 'bx-009' },
  { productId: 'prod-x-cx-03-complete-loose', listingId: 'bx-010' },
  { productId: 'prod-x-bx-15-complete-loose', listingId: 'bx-210' },
  { productId: 'prod-x-bx-05-complete-loose', listingId: 'bx-205' },
  { productId: 'prod-x-bx-13-complete-loose', listingId: 'bx-022' },
] as const

type Mark = { value: number | null; currency: string | null; nComps: number }

type PhantomProvider = {
  isPhantom?: boolean
  publicKey?: { toString(): string } | null
  connect: (opts?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey: { toString(): string } }>
  disconnect: () => Promise<void>
}

function phantomProvider(): PhantomProvider | null {
  const solana = (window as Window & { solana?: PhantomProvider }).solana
  return solana?.isPhantom ? solana : null
}

function bladeFor(listingId: string) {
  return `/assets/spins/${listingId}.gif?v=2`
}

function yen(mark: Mark | undefined) {
  if (!mark || mark.value == null) return 'Oracle unavailable'
  const amount = new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 0 }).format(mark.value)
  return mark.currency === 'JPY' || !mark.currency ? `¥${amount}` : `${amount} ${mark.currency}`
}

export function GachaPage() {
  const [packId, setPackId] = useState<(typeof PACKS)[number]['id']>('oracle')
  const [activeId, setActiveId] = useState<string>('bx-229')
  const [marks, setMarks] = useState<Record<string, Mark>>({})
  const [wallet, setWallet] = useState<string | null>(null)
  const [walletNote, setWalletNote] = useState<string | null>(null)

  useEffect(() => {
    const provider = phantomProvider()
    if (provider?.publicKey) setWallet(provider.publicKey.toString())
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const next: Record<string, Mark> = {}
      await Promise.all(
        PRIZES.map(async (prize) => {
          try {
            const response = await fetch(`/api/product/${encodeURIComponent(prize.productId)}`, {
              headers: { Accept: 'application/json' },
            })
            if (!response.ok) {
              next[prize.listingId] = { value: null, currency: null, nComps: 0 }
              return
            }
            const body = (await response.json()) as { oracle?: { value?: unknown; currency?: unknown; nComps?: unknown } | null }
            const oracle = body.oracle
            next[prize.listingId] = {
              value: typeof oracle?.value === 'number' ? oracle.value : null,
              currency: typeof oracle?.currency === 'string' ? oracle.currency : null,
              nComps: Number(oracle?.nComps ?? 0) || 0,
            }
          } catch {
            next[prize.listingId] = { value: null, currency: null, nComps: 0 }
          }
        }),
      )
      if (!cancelled) setMarks(next)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const active = useMemo(() => {
    const item = listingById(activeId)
    const model = item ? modelPathForListing(item) : undefined
    const poster = item ? posterForListing(item) : undefined
    return {
      name: item?.name ?? activeId,
      model,
      poster: poster || bladeFor(activeId),
    }
  }, [activeId])

  async function connectWallet() {
    const provider = phantomProvider()
    if (!provider) {
      setWalletNote('Phantom is not installed in this browser.')
      return
    }
    try {
      const result = await provider.connect()
      setWallet(result.publicKey.toString())
      setWalletNote('Connected on devnet.')
    } catch {
      setWalletNote('Wallet connection was cancelled.')
    }
  }

  async function disconnectWallet() {
    const provider = phantomProvider()
    try {
      await provider?.disconnect()
    } catch {
      /* the button still clears the local session */
    }
    setWallet(null)
    setWalletNote(null)
  }

  return (
    <div className="gacha-page">
      <MarketingNav active="gacha" />
      <main className="gacha-main">
        <section className="gacha-stage">
          <div className="gacha-copy">
            <p className="gacha-kicker">Devnet · Product Oracle</p>
            <h1>Open a pack.</h1>
            <p>Connect a wallet, then rip. The stage uses the Bey’s 3D model when one exists, and the product photo otherwise.</p>
            <div className="gacha-packs" role="group" aria-label="Choose a pack">
              {PACKS.map((pack) => (
                <button
                  key={pack.id}
                  type="button"
                  className={pack.id === packId ? 'is-on' : ''}
                  onClick={() => {
                    setPackId(pack.id)
                    setActiveId(pack.listingId)
                  }}
                >
                  <img src={bladeFor(pack.listingId)} alt="" />
                  <span>{pack.name}</span>
                </button>
              ))}
            </div>
            <div className="gacha-wallet">
              {wallet ? (
                <button type="button" onClick={() => void disconnectWallet()}>
                  {wallet.slice(0, 4)}…{wallet.slice(-4)}
                </button>
              ) : (
                <button type="button" onClick={() => void connectWallet()}>
                  Connect wallet
                </button>
              )}
              <a href="https://gatcha-production-1ec2.up.railway.app/gacha">Rip on devnet</a>
              {walletNote ? <p>{walletNote}</p> : null}
              <p>Set Phantom to Devnet. A rip transfers that blade’s NFT into the connected wallet.</p>
            </div>
          </div>
          <div className="gacha-model">
            {active.model ? (
              <ModelViewer src={active.model} poster={active.poster} spin={8} height="100%" interactive force3D />
            ) : (
              <img src={active.poster} alt="" />
            )}
            <p>{active.name}</p>
            <p className="gacha-mark">{yen(marks[activeId])}</p>
          </div>
        </section>

        <section className="gacha-prizes" aria-label="Oracle prizes">
          <h2>In this pack</h2>
          <ul>
            {PRIZES.map((prize) => {
              const item = listingById(prize.listingId)
              const name = item?.name ?? prize.listingId
              return (
                <li key={prize.listingId}>
                  <button type="button" className={prize.listingId === activeId ? 'is-on' : ''} onClick={() => setActiveId(prize.listingId)}>
                    <img src={bladeFor(prize.listingId)} alt="" />
                    <span>{name}</span>
                    <b>{yen(marks[prize.listingId])}</b>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      </main>
    </div>
  )
}

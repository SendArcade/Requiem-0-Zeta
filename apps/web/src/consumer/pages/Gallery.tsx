import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from '../lib/navigation'
import type * as THREE from 'three'
import { ChevronDown, Layers, Search, Shuffle } from 'lucide-react'
import { ModelViewer } from '../components/ModelViewer'
import { MarketingNav } from '../components/MarketingNav'
import { burstDiscs, burstDrivers, isWholeBeyListing, listingById, marketplaceListings, productRenderFor, type BeyPart, type Listing } from '../lib/assets'
import { spiritUrl } from '../lib/spirits'
import { useCompact } from '../lib/media'
import './marketplace.css'
import './lab.css'

const PART_NOTES: Record<string, { what: string; why: string }> = {
  Blade: { what: 'The top half — the part that takes every hit.', why: 'Its shape decides how you fight. Wide contact points trade blows; swept contact points attack.' },
  Ratchet: { what: 'The ring between the blade and the bit.', why: 'The code sets the height and contact points. Lower hits harder; taller keeps the blade clear.' },
  Bit: { what: 'The tip the whole bey spins on.', why: 'Flat bits sprint and attack. Ball and needle bits stay upright and outlast.' },
  Layer: { what: 'The top ring and face of the bey.', why: 'It absorbs hits and carries the spirit. In Burst, a hard hit can pop the layer apart.' },
  Disc: { what: 'The die-cast metal weight in the middle.', why: 'Mass keeps the bey spinning. Shaped discs can add attack or change balance.' },
  Driver: { what: 'The tip and shaft at the bottom.', why: 'It decides whether the bey charges, holds its line, or stays upright.' },
}

const CLASS_NOTES: Record<string, string> = {
  Attack: 'Fast contact points and an aggressive line. Built to knock the other bey out.',
  Defense: 'Low, heavy, and difficult to move. Built to absorb contact and outlast.',
  Stamina: 'A controlled spin that wins on the clock instead of picking a fight.',
  Balance: 'A measured mix of attack, defense, and stamina.',
}

function readMeshes(object: THREE.Object3D) {
  const rows: { name: string; maps: string[] }[] = []
  object.traverse((node) => {
    const mesh = node as THREE.Mesh
    if (!mesh.isMesh || !mesh.visible) return
    const materials = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).filter(Boolean) as THREE.MeshStandardMaterial[]
    rows.push({ name: mesh.name || 'part', maps: [...new Set(materials.flatMap((material) => [material.map?.name, material.aoMap?.name].filter(Boolean) as string[]))] })
  })
  return rows
}

function matchesRole(mesh: string, role: string) {
  if (role === 'Bit') return /(^|[_-])(bit|tip|performance)/i.test(mesh)
  if (role === 'Ratchet') return /(^|[_-])(ratchet|base|ring)/i.test(mesh)
  if (role === 'Blade') return /(^|[_-])(blade|layer|head|chip|metal)/i.test(mesh)
  if (role === 'Disc') return /dis[kc]/i.test(mesh)
  if (role === 'Driver') return /_tip/i.test(mesh)
  return /layer/i.test(mesh)
}

function PartSwap({ label, options, onPick }: { label: string; options: { name: string }[]; onPick: (index: number) => void }) {
  return (
    <button className="viewer-swap" type="button" onClick={() => onPick(Math.floor(Math.random() * options.length))}>
      <Shuffle size={12} /> {label}
    </button>
  )
}

export function GalleryPage() {
  const beys = useMemo(() => marketplaceListings.filter((item): item is Listing => isWholeBeyListing(item)), [])
  const [params, setParams] = useSearchParams()
  const beyParam = params.get('bey')

  /** Resolve deep links from the whole-bey catalogue first, then any listing with a mesh. */
  const resolveBey = useCallback(
    (id: string | null) => {
      if (!id) return undefined
      const whole = beys.find((item) => item.id === id)
      if (whole) return whole
      const hit = listingById(id)
      return hit?.model ? hit : undefined
    },
    [beys],
  )

  const initial = useMemo(() => resolveBey(beyParam) ?? beys[0], [beys, beyParam, resolveBey])

  const [selected, setSelected] = useState<Listing>(initial)
  const [series, setSeries] = useState<'All' | 'X' | 'Burst'>('All')
  const [query, setQuery] = useState('')
  const [focus, setFocus] = useState<string | null>(null)
  const [focusedRole, setFocusedRole] = useState<string | null>(null)
  const [swap, setSwap] = useState<{ disc?: number; driver?: number }>({})
  const [meshes, setMeshes] = useState<{ name: string; maps: string[] }[]>([])
  const [modelMounted, setModelMounted] = useState(false)
  const [mobile3d, setMobile3d] = useState(false)

  // Sync URL → selection (landing deep links)
  useEffect(() => {
    if (!beyParam) return
    const hit = resolveBey(beyParam)
    if (hit && hit.id !== selected.id) {
      setSwap({})
      setFocus(null)
      setFocusedRole(null)
      setSelected(hit)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to URL changes
  }, [beyParam, resolveBey])

  const onReady = useCallback((object: THREE.Object3D) => setMeshes(readMeshes(object)), [])

  const parts: BeyPart[] = useMemo(
    () =>
      (selected.parts ?? []).map((part) => {
        if (part.role === 'Disc' && swap.disc !== undefined) return { ...part, name: burstDiscs[swap.disc].name, src: burstDiscs[swap.disc].src }
        if (part.role === 'Driver' && swap.driver !== undefined) return { ...part, name: burstDrivers[swap.driver].name, src: burstDrivers[swap.driver].src }
        return part
      }),
    [selected, swap],
  )
  const stack = parts.every((part) => part.src) ? parts.map((part) => ({ src: part.src!, texture: part.texture, tint: selected.tint, role: part.role })) : undefined
  const modelKey = `${selected.id}-${stack?.map((part) => part.src).join('|') ?? 'direct'}`

  useEffect(() => {
    setMeshes([])
    setFocus(null)
    setFocusedRole(null)
    setModelMounted(false)
    // Auto-enable orbit on phones after first paint so 3D isn't stuck inert
    const compactNow = window.matchMedia('(max-width: 700px)').matches
    setMobile3d(compactNow)
    const timer = window.setTimeout(() => setModelMounted(true), compactNow ? 180 : 100)
    return () => window.clearTimeout(timer)
  }, [modelKey])

  const compact = useCompact()
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase()
    return beys.filter((item) => (series === 'All' || item.series === series) && (!term || `${item.name} ${item.class}`.toLowerCase().includes(term)))
  }, [beys, query, series])
  const rows = parts.map((part) => {
    const owned = meshes.filter((mesh) => matchesRole(mesh.name, part.role))
    return { ...part, meshes: owned.length, maps: [...new Set(owned.flatMap((mesh) => mesh.maps))] }
  })
  const swappable = selected.assembly === 'burst'
  const verificationLabel = selected.partsVerified
    ? 'Release reference checked'
    : (selected.verificationSource ?? 'Game export; release match not asserted')
  const selectedPoster = productRenderFor(selected) || selected.image

  const pick = (item: Listing) => {
    setSwap({})
    setFocus(null)
    setFocusedRole(null)
    setSelected(item)
    setParams({ bey: item.id }, { replace: true })
  }

  return (
    <main className="viewer-page lab-page" style={{ ['--lab-accent' as string]: selected.accent || '#13fff3' }}>
      <MarketingNav active="lab" />
      <section className="viewer-layout lab-layout">
        <div className="viewer-main lab-main">
          <header className="viewer-head lab-head">
            <div className="lab-head-meta">
              <span className="viewer-eyebrow">3D Lab · {selected.series}</span>
              <b className="lab-class" data-class={selected.class}>
                {selected.class}
              </b>
            </div>
            <h1>{selected.name}</h1>
            <p>{CLASS_NOTES[selected.class] ?? 'Recovered product mesh ready for inspection.'}</p>
            <small className="viewer-source">{verificationLabel}</small>
          </header>

          <div className="viewer-canvas lab-canvas">
            <div className="lab-canvas-glow" aria-hidden="true" />
            <img className="viewer-floor" src="/assets/game/floors/Floor_Chaos.png" alt="" aria-hidden="true" />
            {spiritUrl(selected.name) ? <img className="viewer-spirit" src={spiritUrl(selected.name)} alt="" aria-hidden="true" /> : null}
            {modelMounted ? (
              <ModelViewer
                key={modelKey}
                src={selected.model!}
                texture={selected.texture}
                tint={selected.tint}
                stack={stack}
                focusRole={focusedRole}
                poster={selectedPoster}
                onReady={onReady}
                ground={false}
                height="100%"
                presentation="hero"
                interactive={!compact || mobile3d}
                autoRotate={false}
                force3D
              />
            ) : (
              <div className="viewer-placeholder">
                {selectedPoster ? (
                  <img src={selectedPoster} alt="" decoding="async" />
                ) : (
                  <span>Preparing preview</span>
                )}
                {compact ? (
                  <button type="button" onClick={() => setMobile3d(true)}>
                    Enable touch orbit
                  </button>
                ) : null}
              </div>
            )}
            <span className="viewer-hint">
              {compact
                ? mobile3d
                  ? 'Drag to rotate · pinch zoom'
                  : '3D loading · tap Enable touch orbit'
                : 'Drag to rotate · scroll to zoom'}
            </span>
          </div>

          <div className="viewer-controls lab-controls">
            <span>
              <b>{focusedRole ? `Focused: ${focusedRole}` : 'Assembled view'}</b>
              <em> · click a part to inspect</em>
            </span>
            <button type="button" onClick={() => setFocusedRole(null)}>
              Reset view
            </button>
          </div>
        </div>

        <aside className="viewer-rail lab-rail">
          <header className="viewer-rail-head lab-rail-head">
            <span>Specimen drawer</span>
            <h2>Choose a Bey</h2>
            <small>{visible.length} recovered builds</small>
          </header>

          <section className="viewer-parts lab-parts">
            <h3>
              <Layers size={13} /> Build anatomy
            </h3>
            <ul>
              {!rows.length && (
                <li className="viewer-complete">
                  <b>Complete exported model</b>
                  <span>{meshes.length ? `${meshes.length} rendered meshes` : 'Loading mesh data'}</span>
                </li>
              )}
              {rows.map((part) => {
                const note = PART_NOTES[part.role]
                const open = focus === part.role
                return (
                  <li key={part.role} className={open ? 'open' : ''}>
                    <button
                      className={`viewer-part-head${focusedRole === part.role ? ' focused' : ''}`}
                      type="button"
                      onClick={() => {
                        const next = open ? null : part.role
                        setFocus(next)
                        setFocusedRole(next)
                      }}
                      aria-expanded={open}
                    >
                      <span>{part.role}</span>
                      <b>{part.name}</b>
                      <ChevronDown size={14} />
                    </button>
                    {open && (
                      <div className="viewer-part-body">
                        <strong>{note?.what}</strong>
                        <p>{note?.why}</p>
                        {part.meshes > 0 && (
                          <small>
                            {part.meshes} mesh{part.meshes > 1 ? 'es' : ''}
                            {part.maps.length ? ` · ${part.maps.length} map${part.maps.length > 1 ? 's' : ''}` : ''}
                          </small>
                        )}
                        {swappable && part.role === 'Disc' && (
                          <PartSwap label="Try another disc" options={burstDiscs} onPick={(index) => setSwap((value) => ({ ...value, disc: index }))} />
                        )}
                        {swappable && part.role === 'Driver' && (
                          <PartSwap label="Try another driver" options={burstDrivers} onPick={(index) => setSwap((value) => ({ ...value, driver: index }))} />
                        )}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="viewer-browser lab-browser">
            <div className="viewer-filters">
              <div className="viewer-tabs lab-tabs">
                {(['All', 'X', 'Burst'] as const).map((value) => (
                  <button key={value} type="button" className={series === value ? 'active' : ''} onClick={() => setSeries(value)}>
                    {value}
                  </button>
                ))}
              </div>
              <label>
                <Search size={14} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search beys" />
              </label>
            </div>
            <p className="viewer-count">{visible.length} beys</p>
            <ul className="viewer-list lab-list">
              {visible.map((item) => {
                const thumb = productRenderFor(item) || item.image
                return (
                  <li key={item.id}>
                    <button type="button" className={item.id === selected.id ? 'active' : ''} onClick={() => pick(item)}>
                      <img src={thumb} alt="" />
                      <span>
                        {item.name}
                        <small>
                          {item.series} · {item.class}
                        </small>
                      </span>
                      <i style={{ background: item.accent }} />
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        </aside>
      </section>
    </main>
  )
}

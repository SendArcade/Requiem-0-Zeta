import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BurstShell } from '../components/GameShell'
import { ModelViewer } from '../components/ModelViewer'
import { marketplaceListings } from '../lib/assets'
import { burstShop, battleTiles, burstParts, rivals, BC, xBeys } from '../data'

export function BurstLayout() {
  return <BurstShell />
}

export function BurstHome() {
  return (
    <div className="battle-menu">
      {battleTiles.map((t) => (
        <Link
          key={t.name}
          to={t.to === '/burst/battle/go' ? '/burst/battle' : t.to}
          className="battle-tile"
        >
          <img className="battle-tile-art" src={t.img} alt="" />
          <div className="label">
            <img src={t.icon} alt="" />
            {t.name}
          </div>
        </Link>
      ))}
    </div>
  )
}

export function BurstShop() {
  return (
    <div className="burst-panel">
      <div className="burst-panel-head">
        <span>Beycoins</span>
        <span className="timer">06 DAYS 23 HOURS 58 MINUTES</span>
      </div>
      <div className="burst-grid">
        {burstShop.map((item) => (
          <div key={item.name} className="burst-card">
            <div className="thumb"><img src={item.img} alt="" /></div>
            <div className="info">
              <strong>{item.name}</strong>
              <small>{item.kind}</small>
            </div>
            <div className="buy">Purchased</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Energy layers the catalog has a recovered mesh for, so the picker is live. */
const layerMeshes = marketplaceListings.filter(
  (l) => l?.series === 'Burst' && l.class !== 'Arena' && l.model?.endsWith('_Layer.obj'),
).slice(0, 6)

export function BurstCustomize() {
  const [layer, setLayer] = useState(layerMeshes[0]?.name ?? burstParts.layers[0])
  const [disk, setDisk] = useState(burstParts.disks[0])
  const [driver, setDriver] = useState(burstParts.drivers[0])
  const picked = layerMeshes.find((l) => l.name === layer)
  return (
    <div className="burst-panel">
      <div className="burst-panel-head">
        <span>Customize</span>
          <span className="timer">{layer} / {disk} / {driver}</span>
      </div>
      <div className="screen-pad" style={{ color: '#fff' }}>
        {picked?.model ? (
          <ModelViewer
            key={picked.id}
            src={picked.model}
            texture={picked.texture}
            tint={picked.tint}
            poster={picked.image}
            height={160}
            interactive={false}
          />
        ) : (
          <img src={`${BC}/Hypersphere_LargeLogo.png`} alt="" style={{ width: 180, margin: '0 auto 16px' }} />
        )}
        {([
          ['Layer', layerMeshes.map((l) => l.name), layer, setLayer],
          ['Disk', burstParts.disks, disk, setDisk],
          ['Driver', burstParts.drivers, driver, setDriver],
        ] as const).map(([title, items, value, set]) => (
          <div key={title as string} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.14em', opacity: 0.7, marginBottom: 6 }}>{title}</div>
            <div className="cta-row">
              {(items as string[]).map((it) => (
                <button
                  key={it}
                  type="button"
                  className={`cta ${value === it ? 'cyan' : 'ghost'}`}
                  onClick={() => (set as (v: string) => void)(it)}
                >
                  {it}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="cta-row">
          <Link className="cta cyan" to="/lab">View 3D layers</Link>
        </div>
      </div>
    </div>
  )
}

export function BurstBattle() {
  const [rival, setRival] = useState(rivals[0].name)
  const [go, setGo] = useState(false)
  return (
    <div className="burst-panel">
      <div className="burst-panel-head">
        <span>Choose rival</span>
        <span className="timer">Quick Battle</span>
      </div>
      <div className="screen-pad">
        <div className="burst-grid" style={{ gridTemplateColumns: '1fr 1fr', maxHeight: 160 }}>
          {rivals.map((r) => (
            <button
              key={r.name}
              type="button"
              className="burst-card"
              style={{ borderColor: rival === r.name ? 'var(--burst-cyan)' : undefined }}
              onClick={() => setRival(r.name)}
            >
              <div className="info" style={{ padding: 12 }}>
                <strong>{r.name}</strong>
                <small>{r.rank}</small>
              </div>
            </button>
          ))}
        </div>
        <div
          className="arena-stage"
          style={{
            backgroundImage: "url('/assets/ui/burst/Arena_SkyClash_Floor.png')",
            marginTop: 12,
            minHeight: 180,
          }}
        >
          {go && (
            <>
              <img className="spin" src={xBeys[0].img} alt="" style={{ left: '24%', top: '36%' }} />
              <img className="spin" src={xBeys[2].img} alt="" style={{ right: '24%', top: '40%', animationDirection: 'reverse' }} />
            </>
          )}
        </div>
        <div className="cta-row">
          <button type="button" className="cta cyan" onClick={() => setGo(true)}>
            Launch vs {rival.split(' ')[0]}
          </button>
        </div>
      </div>
    </div>
  )
}

export function BurstScan() {
  const [ok, setOk] = useState(false)
  return (
    <div className="burst-panel">
      <div className="burst-panel-head"><span>Scan</span></div>
      <div className="scan-stage" style={{ minHeight: 280 }}>
        <div
          className="scan-reticle"
          style={{ borderColor: 'var(--burst-cyan)', boxShadow: '0 0 0 999px rgba(0,0,0,0.45), inset 0 0 40px rgba(0,180,255,0.2)' }}
          onClick={() => setOk(true)}
        >
          <img src={`${BC}/battle_menu_scan_button.png`} alt="" style={{ width: 80 }} />
        </div>
      </div>
      {ok && <div className="cta-row" style={{ justifyContent: 'center' }}><span className="cta cyan">Part unlocked / Ace Dragon</span></div>}
    </div>
  )
}

export function BurstLeague() {
  return (
    <div className="burst-panel">
      <div className="burst-panel-head"><span>Battle League</span></div>
      <div className="screen-pad">
        <img src={`${BC}/BattleLeagueGiantLogo.png`} alt="" style={{ width: 220, margin: '0 auto 16px' }} />
        <img src={`${BC}/battle_menu_battle_league_imagery.png`} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }} />
        <div style={{ marginTop: 14, display: 'grid', gap: 8 }}>
          {[['Valt', 'Shu'], ['Aiger', 'Free'], ['You', 'TBA']].map(([a, b]) => (
            <div key={a} style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, padding: 10, background: 'rgba(0,0,0,0.35)', textAlign: 'center', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 12 }}>
              <span>{a}</span><span style={{ color: 'var(--burst-cyan)' }}>vs</span><span>{b}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function BurstProfile() {
  const nav = useNavigate()
  return (
    <div className="burst-panel">
      <div className="burst-panel-head"><span>Achievements</span></div>
      <div className="burst-grid">
        {['First Burst Finish', 'Stadium Regular', 'Part Collector', 'League Contender', 'Toy Battle Ready', 'WBBA Member'].map((a) => (
          <div key={a} className="burst-card">
            <div className="thumb">
              <img src={`${BC}/battle_menu_challenges_icon.png`} alt="" />
            </div>
            <div className="info"><strong>{a}</strong><small>Unlocked</small></div>
            <div className="buy">Owned</div>
          </div>
        ))}
      </div>
      <div className="cta-row" style={{ padding: 12, position: 'relative', zIndex: 2 }}>
        <button type="button" className="cta ghost" onClick={() => nav('/burst/shop')}>Open Beycoins</button>
        <Link className="cta cyan" to="/hub">Hub</Link>
      </div>
    </div>
  )
}

export function BurstSettings() {
  return (
    <div className="burst-panel">
      <div className="burst-panel-head"><span>Settings</span></div>
      <div className="screen-pad">
        <div className="cta-row">
          {['Audio', 'Controls', 'Account', 'Credits'].map((t) => (
            <span key={t} className="cta ghost">{t}</span>
          ))}
        </div>
        <div className="cta-row">
          <Link className="cta cyan" to="/hub">Back to hub</Link>
        </div>
      </div>
    </div>
  )
}

// shop alias used in routes
export { BurstShop as BurstShopPage }

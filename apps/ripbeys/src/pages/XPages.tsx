import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { XShell } from '../components/GameShell'
import { ModelViewer } from '../components/ModelViewer'
import { xBeys, xTypeIcon, XC } from '../data'

function useXActive(): 'home' | 'locker' | 'battle' | 'scan' | 'gym' {
  const p = useLocation().pathname
  if (p.includes('/collection')) return 'locker'
  if (p.includes('/battle')) return 'battle'
  if (p.includes('/scan')) return 'scan'
  if (p.includes('/gym')) return 'gym'
  return 'home'
}

export function XRoutesLayout() {
  return <XShell active={useXActive()} />
}

/** Beys the app ships a mesh for — the only ones the 3D screens can use. */
const xModels = xBeys.filter((b) => b.model)

export function XHome() {
  const featured = xModels[0]
  return (
    <>
      <div className="x-center">
        <div className="news-frame">
          <img
            className="hero"
            src={`${XC}/News-IMG-01.png`}
            alt=""
            onError={(e) => { (e.target as HTMLImageElement).src = `${XC}/IMG_ToyBattle.png` }}
          />
          <div className="bar" />
        </div>
        <div className="stat-strip">
          <div className="stat-pill"><b>12,480</b>Bey Points</div>
          <div className="stat-pill"><b>{xBeys.length}</b>Unlocked</div>
          <div className="stat-pill"><b>A-</b>Rank</div>
        </div>
        <div className="cta-row">
          <Link className="cta lime" to="/x/battle">Rare Bey Get</Link>
          <Link className="cta ghost" to="/x/scan">Scan Bey Code</Link>
          <Link className="cta ghost" to="/lab">3D Gallery</Link>
        </div>
      </div>
      <div className="x-feature">
         <ModelViewer className="bey-3d" src={featured.model!} tint={featured.tint} poster={featured.img} height={210} interactive={false} />
        <div className="name">{featured.name}</div>
        <img className="core" src={`${XC}/PowerCore_Bronze.png`} alt="Power core" />
      </div>
    </>
  )
}

export function XCollection() {
  const [sel, setSel] = useState(0)
  return (
    <div className="x-center" style={{ gridColumn: '2 / -1' }}>
      <div className="locker-grid">
        {xBeys.map((b, i) => (
          <button
            key={b.name}
            type="button"
            className={`locker-card ${i === sel ? 'on' : ''}`}
            onClick={() => setSel(i)}
          >
            <img src={b.img} alt="" />
            <strong>{b.name}</strong>
            <small>
              <img className="type-icon" src={xTypeIcon[b.type]} alt="" />
              {b.type} · {b.pts} pts
            </small>
          </button>
        ))}
      </div>
    </div>
  )
}

export function XBattle() {
  const [go, setGo] = useState(false)
  // Re-drawn from a fresh pair each launch, like the app's Rare Bey Get roll.
  const [[left, right], setPair] = useState(() => [xModels[0], xModels[3]])
  const roll = () => {
    const pool = [...xModels].sort(() => Math.random() - 0.5)
    setPair([pool[0], pool[1]])
    setGo(true)
  }
  return (
    <div className="x-center" style={{ gridColumn: '2 / -1' }}>
      <div className="arena-stage" style={{ backgroundImage: `url(${XC}/bg-waiting-01.png)` }}>
        {go && (
          <>
            <div className="bey-slot left">
              <ModelViewer src={left.model!} tint={left.tint} poster={left.img} spin={14} height="100%" interactive={false} />
              <span>{left.name}</span>
            </div>
            <div className="bey-slot right">
              <ModelViewer src={right.model!} tint={right.tint} poster={right.img} spin={-11} height="100%" interactive={false} />
              <span>{right.name}</span>
            </div>
            <div className="clash" />
          </>
        )}
      </div>
      <div className="cta-row">
        <button type="button" className="cta lime" onClick={roll}>Spend 500 Bey Points</button>
        <button type="button" className="cta ghost" onClick={() => setGo(false)}>Reset</button>
      </div>
    </div>
  )
}

export function XScan() {
  const [ok, setOk] = useState(false)
  return (
    <div className="x-center" style={{ gridColumn: '2 / -1' }}>
      <div className="scan-stage">
        <div className="scan-reticle" onClick={() => setOk(true)}>
          <img
            src={`${XC}/scan-reticle-03.png`}
            alt=""
            style={{ width: '70%', opacity: 0.85 }}
            onError={(e) => { (e.target as HTMLImageElement).src = `${XC}/icon-scan.png` }}
          />
        </div>
      </div>
      {ok && (
        <div className="cta-row">
          <span className="cta lime">Unlocked · Sword Dran parts</span>
        </div>
      )}
    </div>
  )
}

export function XGym() {
  return (
    <div className="x-center" style={{ gridColumn: '2 / -1' }}>
      <div className="stat-strip">
        <div className="stat-pill"><b>842</b>Launch power</div>
        <div className="stat-pill"><b>12°</b>Best angle</div>
        <div className="stat-pill"><b>91</b>Consistency</div>
        <div className="stat-pill"><b>14</b>Sessions</div>
      </div>
      <div
        className="arena-stage"
        style={{ backgroundImage: `url(${XC}/inventory-bg.png)`, minHeight: 200, marginTop: 12 }}
      >
        <div className="bey-slot gym">
           <ModelViewer src={xModels[0].model!} tint={xModels[0].tint} poster={xModels[0].img} spin={9} height="100%" interactive={false} />
          <span>{xModels[0].name}</span>
        </div>
      </div>
    </div>
  )
}

export function XSettings() {
  return (
    <div className="x-center" style={{ gridColumn: '2 / -1' }}>
      <div className="locker-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {['Notifications', 'Account / Hasbro ID', 'Language', 'About'].map((t) => (
          <div key={t} className="locker-card"><strong>{t}</strong></div>
        ))}
      </div>
      <div className="cta-row">
        <Link className="cta ghost" to="/hub">Back to hub</Link>
      </div>
    </div>
  )
}

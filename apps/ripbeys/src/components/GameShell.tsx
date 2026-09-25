import { NavLink, Outlet, Link } from 'react-router-dom'
import type { ReactNode } from 'react'

const XC = '/assets/game/x-chrome'

export function Stage({ children }: { children?: ReactNode }) {
  return (
    <div className="app-root">
      <div className="stage">
        <div className="stage-fill">{children ?? <Outlet />}</div>
      </div>
    </div>
  )
}

export function XShell({ active }: { active: 'home' | 'locker' | 'battle' | 'scan' | 'gym' }) {
  return (
    <Stage>
      <div className="x-home">
        <header className="x-header">
          <Link to="/x/settings"><img className="cog" src={`${XC}/header-cog.png`} alt="" /></Link>
          <img className="logo" src={`${XC}/header-logo.png`} alt="Beyblade X" />
          <div className="x-profile">
            <img src={`${XC}/header-portrait.png`} alt="" />
            EternalRadiance#463
          </div>
          <div className="x-utils">
            <img src={`${XC}/header-friend.png`} alt="" />
            <img src={`${XC}/header-playlist.png`} alt="" />
            <Link to="/x/scan"><img src={`${XC}/icon-QR-code.png`} alt="Scan" /></Link>
          </div>
        </header>

        <nav className="x-tabs">
          <NavLink to="/x/collection" className={({ isActive }) => (isActive ? 'active' : undefined)}>Beylocker</NavLink>
          <NavLink to="/x" end className={({ isActive }) => (isActive ? 'active' : undefined)}>Details</NavLink>
          <NavLink to="/x/gym" className={({ isActive }) => (isActive ? 'active' : undefined)}>Power Cores</NavLink>
          <NavLink to="/x/battle" className={({ isActive }) => (isActive ? 'active' : undefined)}>Battle</NavLink>
        </nav>

        <div className="x-body">
          <aside className="x-rail">
            <NavLink to="/x/battle" className={`rail-btn ${active === 'battle' ? 'on' : ''}`}>
              <img src={`${XC}/home-icon-1battle-${active === 'battle' ? 'on' : 'off'}.png`} alt="" />
              Battle
            </NavLink>
            <NavLink to="/x/collection" className={`rail-btn ${active === 'locker' ? 'on' : ''}`}>
              <img src={`${XC}/home-icon-2beylocker-${active === 'locker' ? 'on' : 'off'}.png`} alt="" />
              Beylocker
            </NavLink>
            <NavLink to="/x" end className={`rail-btn ${active === 'home' ? 'on' : ''}`}>
              <img src={`${XC}/home-icon-3home-${active === 'home' ? 'on' : 'off'}.png`} alt="" />
              Home
            </NavLink>
          </aside>
          <Outlet />
        </div>

        <footer className="x-footer">
          <span>Season ends in 209 days</span>
          <div className="season-track">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <span key={i} className={i < 3 ? 'reward' : undefined} />
            ))}
          </div>
          <div className="collect">
            21/50 Collected
            <div className="meter"><i /></div>
          </div>
        </footer>
      </div>
    </Stage>
  )
}

export function BurstShell() {
  return (
    <Stage>
      <div
        className="burst-home"
        style={{ backgroundImage: "url('/assets/game/burst-chrome/ArenaThumb_Quadstrike.png')" }}
      >
        <header className="burst-top">
          <Link className="burst-back" to="/hub">‹</Link>
          <nav className="cta-row" style={{ margin: 0, flex: 1, justifyContent: 'center', padding: '0 12px' }}>
            <NavLink to="/burst" end className={({ isActive }) => `cta ${isActive ? 'cyan' : 'ghost'}`} style={{ fontSize: 10, padding: '8px 12px' }}>Battle</NavLink>
            <NavLink to="/burst/shop" className={({ isActive }) => `cta ${isActive ? 'cyan' : 'ghost'}`} style={{ fontSize: 10, padding: '8px 12px' }}>Beycoins</NavLink>
            <NavLink to="/burst/customize" className={({ isActive }) => `cta ${isActive ? 'cyan' : 'ghost'}`} style={{ fontSize: 10, padding: '8px 12px' }}>Build</NavLink>
            <NavLink to="/burst/league" className={({ isActive }) => `cta ${isActive ? 'cyan' : 'ghost'}`} style={{ fontSize: 10, padding: '8px 12px' }}>League</NavLink>
            <NavLink to="/burst/scan" className={({ isActive }) => `cta ${isActive ? 'cyan' : 'ghost'}`} style={{ fontSize: 10, padding: '8px 12px' }}>Scan</NavLink>
          </nav>
          <div className="burst-user">
            <div className="meta">
              <div><b>WickedOre</b> · Newbie</div>
              <div className="coins">◉ 1,342,177,279</div>
            </div>
            <Link to="/burst/profile" className="hex-avatar">
              <img src="/assets/beybladeburst/icon.png" alt="" />
              <span className="lvl">1</span>
            </Link>
          </div>
        </header>
        <Outlet />
      </div>
    </Stage>
  )
}

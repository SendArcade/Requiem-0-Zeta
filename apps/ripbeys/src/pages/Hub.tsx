import { Link, useNavigate } from 'react-router-dom'
import { Stage } from '../components/GameShell'
import { MarketingNav } from '../components/MarketingNav'
import './landing.css'

export function Splash() {
  const nav = useNavigate()
  return (
    <Stage>
      <div
        className="splash"
        style={{ backgroundImage: "url('/assets/game/x-splash/bg-SplashScreen.png')" }}
        onClick={() => nav('/hub')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && nav('/hub')}
      >
        <div
          className="splash-lines"
          style={{ backgroundImage: "url('/assets/game/x-splash/bg-SplashScreen-lines.png')" }}
        />
        <div className="splash-burst-glow" />
        <div className="splash-brush" />
        <img className="splash-logo" src="/assets/game/x-chrome/header-logo.png" alt="Beyblade X" />
        <div className="splash-tap">TAP TO START</div>
        <div className="splash-meta">Version: 1.5.3.0 · Mixed X + Burst QuadStrike</div>
      </div>
    </Stage>
  )
}

/**
 * Frames the two app recreations rather than sitting alongside them. The
 * replicas keep the games' own chrome on purpose — this page is the seam, so
 * it wears the Rip Beys language and says plainly what you are stepping into.
 */
export function Hub() {
  return (
    <main className="lp hub-frame">
      <MarketingNav active="hub" />

      <section className="hub-intro">
        <div className="hub-intro-copy">
          <span className="lp-eyebrow">The archive / two worlds</span>
          <h1>Both apps,<br /><em>rebuilt.</em></h1>
          <p>
            The screens, the chrome, and the recovered meshes are back in one place. Choose a
            world, then jump from the game replica into the real archive whenever you find a bey.
          </p>
          <div className="hub-intro-stats">
            <span><b>02</b><small>game worlds</small></span>
            <span><b>578</b><small>catalogue lots</small></span>
            <span><b>3D</b><small>live Lab</small></span>
          </div>
        </div>
        <div className="hub-intro-art" aria-hidden="true">
          <img className="hub-intro-plate" src="/assets/game/keyart/Environment_Blue.png" alt="" />
          <span className="hub-intro-glow" />
          <img className="hub-intro-bey hub-intro-bey-back" src="/assets/game/x-sprites/ScytheIncendioFull.png" alt="" />
          <img className="hub-intro-bey hub-intro-bey-front" src="/assets/game/x-sprites/DaggerDran_Product.png" alt="" />
          <span className="hub-intro-stamp">Decoded / live archive</span>
        </div>
      </section>

      <section className="hub-cards">
        <Link to="/x" className="hub-app x">
          <img className="hub-app-icon" src="/assets/beybladex/icon.png" alt="" />
          <div>
            <h2>Beyblade X</h2>
            <p>Home, Beylocker, Rare Bey Get, Launch Gym and the scanner — lime chrome, live 3D beys in the arena.</p>
            <span className="hub-enter">Enter X →</span>
          </div>
        </Link>
        <Link to="/burst" className="hub-app burst">
          <img className="hub-app-icon" src="/assets/beybladeburst/icon.png" alt="" />
          <div>
            <h2>Burst QuadStrike</h2>
            <p>Battle menu, Beycoins shop, Customize with a live layer preview, League and Profile — cyan stadium chrome.</p>
            <span className="hub-enter">Enter Burst →</span>
          </div>
        </Link>
      </section>

      <footer className="lp-footer">
        <div><span className="lp-mark">RB</span><b>RIP BEYS</b><small>Recreated for research</small></div>
        <p>Beyblade is © Takara Tomy / Hasbro.</p>
      </footer>
    </main>
  )
}

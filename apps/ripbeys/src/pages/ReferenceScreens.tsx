import { Link } from 'react-router-dom'
import { Stage } from '../components/GameShell'

const shots = {
  x: ['01_launch.png', '03_tap1.png', '41_after_50s.png', '22_beylocker.png', '25_qr.png', '42_battle_try.png'],
  burst: ['01_launch.png', '22_badge.png', '26_char.png', '28_nav_explore.png', '31_tab1.png', '32_tab2.png'],
}

export function ReferenceScreens() {
  return (
    <Stage>
      <div className="gallery-wrap" style={{ overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <h1 style={{ margin: 0, fontSize: 24 }}>Emulator reference</h1>
          <Link className="cta ghost" to="/hub">Hub</Link>
        </div>
        <div style={{ fontSize: 12, letterSpacing: '0.14em', marginBottom: 8, opacity: 0.7 }}>BEYBLADE X</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {shots.x.map((f) => (
            <img key={f} src={`/assets/screens/x/${f}`} alt={f} style={{ width: '100%', border: '1px solid rgba(255,255,255,0.1)' }} />
          ))}
        </div>
        <div style={{ fontSize: 12, letterSpacing: '0.14em', margin: '16px 0 8px', opacity: 0.7 }}>BURST</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {shots.burst.map((f) => (
            <img key={f} src={`/assets/screens/burst/${f}`} alt={f} style={{ width: '100%', border: '1px solid rgba(255,255,255,0.1)' }} />
          ))}
        </div>
      </div>
    </Stage>
  )
}

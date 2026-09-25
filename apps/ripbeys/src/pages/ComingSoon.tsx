import { Link } from 'react-router-dom'
import { MarketingNav } from '../components/MarketingNav'
import { PoweredBy } from '../components/PoweredBy'
import FuzzyText from '../components/reactbits/FuzzyText'
import './coming-soon.css'

export function ComingSoon() {
  return (
    <main className="rb-soon">
      <MarketingNav active="shop" overlay />
      <div className="rb-soon-stage">
        <img className="rb-soon-logo" src="/assets/ripbeys-logo.png" alt="Rip Beys" width={96} height={96} />
        <p className="rb-soon-kicker">Catalogue</p>
        <div className="rb-soon-fuzzy">
          <FuzzyText
            fontSize="clamp(5.5rem, 22vw, 16rem)"
            fontWeight={400}
            fontFamily="'Reenie Beanie', cursive"
            color="#f5f5f5"
            baseIntensity={0.22}
            hoverIntensity={0.6}
            enableHover
            fuzzRange={36}
            fps={48}
            glitchMode
            glitchInterval={2600}
            glitchDuration={180}
            transitionDuration={8}
            letterSpacing={2}
          >
            Coming Soon
          </FuzzyText>
        </div>
        <p className="rb-soon-line">Builds are still spinning up. Check back later.</p>
        <PoweredBy className="rb-soon-powered" />
        <Link to="/" className="rb-soon-back cursor-target">
          ← Back home
        </Link>
      </div>
    </main>
  )
}

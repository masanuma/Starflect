import { useUI } from '../lib/ui'
import BrandMascot from './BrandMascot'

interface Props {
  onSelect: () => void
  onSelectPair: () => void
  onAbout: () => void
}

export default function Home({ onSelect, onSelectPair, onAbout }: Props) {
  const t = useUI()
  return (
    <div className="home">
      <div className="hero">
        <div className="hero-mark" aria-hidden="true">
          <BrandMascot size={92} />
        </div>
        <h1 className="wordmark">{t.home.appTitle}</h1>
        <p className="wordmark-sub">Starflect</p>
        <p className="tagline">
          {t.home.tagline1}
          <br />
          {t.home.tagline2}
        </p>
        <button className="about-link" onClick={onAbout}>
          {t.home.aboutLink}
        </button>
      </div>

      <div className="mode-list">
        <button className="mode-card mode-detailed" onClick={onSelect}>
          <div className="mode-head">
            <span className="mode-name">{t.home.soloName}</span>
            <span className="mode-time">{t.home.soloTime}</span>
          </div>
          <p className="mode-desc">{t.home.soloDesc}</p>
        </button>

        <button className="mode-card mode-pair" onClick={onSelectPair}>
          <div className="mode-head">
            <span className="mode-name">{t.home.pairName}</span>
            <span className="mode-badge-new">NEW</span>
          </div>
          <p className="mode-desc">{t.home.pairDesc}</p>
        </button>
      </div>

      <p className="home-note">{t.home.note}</p>
    </div>
  )
}

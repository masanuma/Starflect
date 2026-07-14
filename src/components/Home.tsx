import { useUI } from '../lib/ui'

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
          <svg viewBox="0 0 48 48" width="44" height="44" fill="none">
            <path
              d="M24 4c1.2 8.4 4.9 15.6 20 20-15.1 4.4-18.8 11.6-20 20-1.2-8.4-4.9-15.6-20-20 15.1-4.4 18.8-11.6 20-20Z"
              fill="#F2B25C"
            />
            <circle cx="38" cy="10" r="1.6" fill="#C9B8F0" />
            <circle cx="9" cy="37" r="1.2" fill="#C9B8F0" />
          </svg>
        </div>
        <h1 className="wordmark">Starflect</h1>
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

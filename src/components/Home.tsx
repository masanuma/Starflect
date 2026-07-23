import { useUI } from '../lib/ui'
import { loadCompanion } from '../lib/companion'
import { starTypeOf } from '../lib/startypes'
import type { PlanetKey } from '../lib/types'
import BrandMascot from './BrandMascot'
import HoshiKyaraMascot from './HoshiKyaraMascot'

interface Props {
  onSelect: () => void
  onSelectPair: () => void
  onAbout: () => void
  onCompanion: () => void
}

export default function Home({ onSelect, onSelectPair, onAbout, onCompanion }: Props) {
  const t = useUI()

  // 相棒がいれば「会いにいく」入口を出す(ここが相棒ホームへの導線)
  const companion = loadCompanion()
  const cLonOf = (key: PlanetKey) => companion?.chart.planets.find((p) => p.key === key)?.lon
  const cSun = cLonOf('sun')
  const cMoon = cLonOf('moon')
  const cStar = cSun !== undefined && cMoon !== undefined ? starTypeOf(cSun, cMoon) : null

  return (
    <div className="home">
      <p className="home-greet">{companion ? t.home.greetBack : t.home.greetNew}</p>
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
        {companion && cStar ? (
          // 相棒がいる = 診断済み。診断は初回のみなので「会話する」を主役に、変更は小リンク
          <>
            <button className="mode-card mode-companion" onClick={onCompanion}>
              <div className="mode-head">
                <span className="mode-name">
                  <span className="mode-companion-icon" aria-hidden="true">
                    <HoshiKyaraMascot sunElement={cStar.sunElement} moonElement={cStar.moonElement} size={26} />
                  </span>
                  {t.home.seeCompanion(cStar.type.name)}
                </span>
              </div>
              <p className="mode-desc">{t.home.companionDesc}</p>
            </button>
            <button className="change-info-link" onClick={onSelect}>
              {t.home.changeInfo}
            </button>
          </>
        ) : (
          // 初回 = 診断を表示
          <button className="mode-card mode-detailed" onClick={onSelect}>
            <div className="mode-head">
              <span className="mode-name">{t.home.soloName}</span>
              <span className="mode-time">{t.home.soloTime}</span>
            </div>
            <p className="mode-desc">{t.home.soloDesc}</p>
          </button>
        )}

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

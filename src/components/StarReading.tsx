import type { ChartData, PlanetKey } from '../lib/types'
import type { Quality } from '../lib/fortune'
import { readFortune } from '../lib/fortune'
import { todayColor, todayColorName } from '../lib/companion'
import { starTypeOf } from '../lib/startypes'
import HoshiKyaraMascot from './HoshiKyaraMascot'
import { useUI } from '../lib/ui'

/** 良し悪しをアイコン(文字入り)で示す。ピンク/ブルーだけでは伝わりにくいので明示。 */
function QualBadge({ quality }: { quality: Quality }) {
  const t = useUI()
  const label = quality === 'good' ? t.companion.qualGood : quality === 'hard' ? t.companion.qualHard : t.companion.qualConj
  return (
    <span className={`qual-badge qual-${quality}`}>
      <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden="true">
        {quality === 'good' && <path d="M12 3 l2.2 5.4 l5.4 2.2 l-5.4 2.2 l-2.2 5.4 l-2.2 -5.4 l-5.4 -2.2 l5.4 -2.2 z" fill="currentColor" />}
        {quality === 'hard' && (
          <>
            <path d="M12 4 L20.4 19 Q21 20 20 20 L4 20 Q3 20 3.6 19 Z" fill="currentColor" />
            <rect x="11.1" y="9" width="1.8" height="5" rx="0.9" fill="#fff" />
            <circle cx="12" cy="16.6" r="1.1" fill="#fff" />
          </>
        )}
        {quality === 'conj' && <path d="M12 4 L19 12 L12 20 L5 12 Z" fill="currentColor" />}
      </svg>
      {label}
    </span>
  )
}

/**
 * ほしキャラが読む「今日」の運勢。
 * 先の期間(明日/今週/来月…)は出さない。先まで見せると"明日また来る理由"も
 * "相棒に聞く理由"も同時に消えてしまうため、この先は相談室へ渡す。
 */
export default function StarReading({ chart, onAsk }: { chart: ChartData; onAsk?: (q: string) => void }) {
  const t = useUI()
  const fortune = readFortune(chart.planets, 'today')

  const lonOf = (key: PlanetKey) => chart.planets.find((p) => p.key === key)?.lon
  const sunLon = lonOf('sun')
  const moonLon = lonOf('moon')
  const starType = sunLon !== undefined && moonLon !== undefined ? starTypeOf(sunLon, moonLon) : null
  const name = starType?.type.name ?? ''

  return (
    <section className="reading-card">
      <div className="card-head">
        {starType && (
          <div className="card-head-icon" aria-hidden="true">
            <HoshiKyaraMascot sunElement={starType.sunElement} moonElement={starType.moonElement} size={52} />
          </div>
        )}
        <div>
          <p className="card-title">{t.companion.readingHeading}</p>
          <p className="card-sub">{t.companion.readsIntro(name)}</p>
        </div>
      </div>

      <p className="reading-sky">{fortune.skyNote}</p>
      <p className="fortune-tone">
        <span className="tone-badge">{fortune.toneLabel}</span>
        {fortune.toneText}
      </p>

      <ul className="fortune-list">
        {fortune.items.map((item) => (
          <li key={item.title} className={`fortune-item ${item.quality}`}>
            <div className="fortune-item-head">
              <QualBadge quality={item.quality} />
              {/* 表に出すのは日常語だけ。天体名・角度は出さない(AIに渡す item.title は技術表記のまま) */}
              <p className="fortune-item-title">{item.plain}</p>
            </div>
            <p className="fortune-item-text">{item.text}</p>
          </li>
        ))}
      </ul>

      <div className="today-chips">
          <div className="today-chip">
            <span className="chip-label">{t.companion.colorLabel}</span>
            <span className="chip-colorname">
              <span className="chip-color" style={{ background: todayColor() }} aria-hidden="true" />
              {todayColorName()}
            </span>
          </div>
      </div>

      {onAsk && (
        <div className="ask-ahead">
          <p className="ask-ahead-title">{t.companion.askAheadTitle}</p>
          <div className="ask-ahead-chips">
            {t.companion.askAhead.map((a) => (
              <button key={a.label} className="ask-ahead-chip" onClick={() => onAsk(a.q)}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

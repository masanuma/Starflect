import { useState } from 'react'
import type { ChartData, PeriodKey, PlanetKey } from '../lib/types'
import { readFortune, periodLabel } from '../lib/fortune'
import { todayColor } from '../lib/companion'
import { starTypeOf } from '../lib/startypes'
import HoshiKyaraMascot from './HoshiKyaraMascot'
import { useUI } from '../lib/ui'

const TABS: PeriodKey[] = ['today', 'tomorrow', 'week']

/**
 * ほしキャラが読む運勢(共有部品)。Result と Companion の両方で使う。
 * 見出し＋ほしキャラの自己紹介＋小さめマスコットで「相棒が読んでいる」体を統一。
 * 画面遷移なしで 今日/明日/今週 を切り替える。中身は readFortune の実データ(AIなし)。
 */
export default function StarReading({ chart }: { chart: ChartData }) {
  const t = useUI()
  const [period, setPeriod] = useState<PeriodKey>('today')
  const fortune = readFortune(chart.planets, period)

  const lonOf = (key: PlanetKey) => chart.planets.find((p) => p.key === key)?.lon
  const sunLon = lonOf('sun')
  const moonLon = lonOf('moon')
  const starType = sunLon !== undefined && moonLon !== undefined ? starTypeOf(sunLon, moonLon) : null
  const name = starType?.type.name ?? ''

  return (
    <section className="reading-card">
      <div className="reading-head">
        {starType && (
          <div className="reading-mascot" aria-hidden="true">
            <HoshiKyaraMascot sunElement={starType.sunElement} moonElement={starType.moonElement} size={52} />
          </div>
        )}
        <div>
          <p className="reading-heading">{t.companion.readingHeading}</p>
          <p className="reading-intro">{t.companion.readsIntro(name)}</p>
        </div>
      </div>

      <div className="reading-tabs" role="tablist">
        {TABS.map((p) => (
          <button
            key={p}
            role="tab"
            aria-selected={p === period}
            className={`reading-tab ${p === period ? 'active' : ''}`}
            onClick={() => setPeriod(p)}
          >
            {periodLabel(p)}
          </button>
        ))}
      </div>

      <p className="reading-sky">{fortune.skyNote}</p>
      <p className="fortune-tone">
        <span className="tone-badge">{fortune.toneLabel}</span>
        {fortune.toneText}
      </p>

      <ul className="fortune-list">
        {fortune.items.map((item) => (
          <li key={item.title} className={`fortune-item ${item.quality}`}>
            <p className="fortune-item-title">
              <span className="fortune-symbol" aria-hidden="true">
                {item.symbol}
              </span>
              {item.title}
            </p>
            <p className="fortune-item-text">{item.text}</p>
          </li>
        ))}
      </ul>

      {period === 'today' && (
        <div className="today-chips">
          <div className="today-chip">
            <span className="chip-label">{t.companion.colorLabel}</span>
            <span className="chip-color" style={{ background: todayColor() }} aria-hidden="true" />
          </div>
        </div>
      )}
    </section>
  )
}

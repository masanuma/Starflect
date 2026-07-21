import { useState } from 'react'
import type { ChartData, PeriodKey } from '../lib/types'
import { readFortune, periodLabel } from '../lib/fortune'
import { todayColor } from '../lib/companion'
import { useUI } from '../lib/ui'

const TABS: PeriodKey[] = ['today', 'tomorrow', 'week']

/**
 * ほしキャラが読む運勢(共有部品)。Result と Companion の両方で使う。
 * 画面遷移なしで 今日/明日/今週 を切り替える。中身は readFortune の実データ(AIなし)。
 */
export default function StarReading({ chart, starName }: { chart: ChartData; starName: string }) {
  const t = useUI()
  const [period, setPeriod] = useState<PeriodKey>('today')
  const fortune = readFortune(chart.planets, period)

  return (
    <section className="reading-card">
      <p className="reading-title">{t.companion.readsTitle(starName, periodLabel(period))}</p>

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

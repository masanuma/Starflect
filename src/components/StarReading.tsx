import { useState } from 'react'
import type { ChartData, PeriodKey, PlanetKey } from '../lib/types'
import type { Quality } from '../lib/fortune'
import { readFortune, periodLabel } from '../lib/fortune'
import { todayColor, todayColorName } from '../lib/companion'
import { starTypeOf } from '../lib/startypes'
import HoshiKyaraMascot from './HoshiKyaraMascot'
import { useUI } from '../lib/ui'

type TabId = 'today' | 'tomorrow' | 'week' | 'nextweek' | 'month' | 'nextmonth'
// 上段=今の期間(今日/今週/今月)、下段=次の期間(明日/来週/来月)。3列で折り返す。
const TABS: TabId[] = ['today', 'week', 'month', 'tomorrow', 'nextweek', 'nextmonth']
const PERIOD_OF: Record<TabId, PeriodKey> = {
  today: 'today',
  tomorrow: 'tomorrow',
  week: 'week',
  nextweek: 'week',
  month: 'month',
  nextmonth: 'month',
}

/** その期間を読むための基準日(来週=+7日、来月=翌月1日) */
function tabDate(id: TabId): Date {
  const n = new Date()
  if (id === 'nextweek') return new Date(n.getFullYear(), n.getMonth(), n.getDate() + 7)
  if (id === 'nextmonth') return new Date(n.getFullYear(), n.getMonth() + 1, 1)
  return n
}

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
 * ほしキャラが読む運勢(共有部品)。Result と Companion の両方で使う。
 * 見出し＋ほしキャラの自己紹介＋小さめマスコットで「相棒が読んでいる」体を統一。
 * 画面遷移なしで 今日/明日/今週/来週/今月/来月 を切り替える。中身は readFortune の実データ(AIなし)。
 */
export default function StarReading({ chart }: { chart: ChartData }) {
  const t = useUI()
  const [tab, setTab] = useState<TabId>('today')
  const fortune = readFortune(chart.planets, PERIOD_OF[tab], tabDate(tab))

  const lonOf = (key: PlanetKey) => chart.planets.find((p) => p.key === key)?.lon
  const sunLon = lonOf('sun')
  const moonLon = lonOf('moon')
  const starType = sunLon !== undefined && moonLon !== undefined ? starTypeOf(sunLon, moonLon) : null
  const name = starType?.type.name ?? ''

  const tabLabel = (id: TabId) =>
    id === 'nextweek' ? t.companion.tabNextWeek : id === 'nextmonth' ? t.companion.tabNextMonth : periodLabel(PERIOD_OF[id])

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

      <div className="reading-tabs" role="tablist">
        {TABS.map((id) => (
          <button
            key={id}
            role="tab"
            aria-selected={id === tab}
            className={`reading-tab ${id === tab ? 'active' : ''}`}
            onClick={() => setTab(id)}
          >
            {tabLabel(id)}
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
            <div className="fortune-item-head">
              <QualBadge quality={item.quality} />
              <p className="fortune-item-title">
                <span className="fortune-symbol" aria-hidden="true">
                  {item.symbol}
                </span>
                {item.title}
              </p>
            </div>
            <p className="fortune-item-text">{item.text}</p>
          </li>
        ))}
      </ul>

      {tab === 'today' && (
        <div className="today-chips">
          <div className="today-chip">
            <span className="chip-label">{t.companion.colorLabel}</span>
            <span className="chip-colorname">
              <span className="chip-color" style={{ background: todayColor() }} aria-hidden="true" />
              {todayColorName()}
            </span>
          </div>
        </div>
      )}
    </section>
  )
}

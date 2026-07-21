import { useEffect, useState } from 'react'
import type { CompanionState } from '../lib/companion'
import { touchVisit, daysSinceLastVisit, markForecastSeen, todayColor } from '../lib/companion'
import { starTypeOf } from '../lib/startypes'
import { readFortune } from '../lib/fortune'
import type { PlanetKey } from '../lib/types'
import HoshiKyaraMascot from './HoshiKyaraMascot'
import { useUI } from '../lib/ui'
import { track } from '../lib/analytics'

interface Props {
  state: CompanionState
  onRetry: () => void
  onHome: () => void
}

/**
 * 星の相棒ホーム(MVP v0.1)。
 * ステップ2: 挨拶(罰なし・経過日数で出し分け)＋「今日の星」カード(readFortune の実データにテンプレ相棒口調)。
 * AIなし(A1)。TODO(step3〜): 夜の振り返りタップ・週末まとめ。
 */
export default function Companion({ state, onRetry, onHome }: Props) {
  const t = useUI()
  const [daysSince] = useState(() => daysSinceLastVisit(state))

  useEffect(() => {
    touchVisit(state)
    markForecastSeen(state)
    track('companion_open', { days_since: daysSince, star_type: state.starType })
    // マウント時に1回だけ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const lonOf = (key: PlanetKey) => state.chart.planets.find((p) => p.key === key)?.lon
  const sunLon = lonOf('sun')
  const moonLon = lonOf('moon')
  const starType = sunLon !== undefined && moonLon !== undefined ? starTypeOf(sunLon, moonLon) : null

  // 「今日の星」は実データ(トランジット)から。相棒画面では常に today を読む。
  // readFortune は getLang() を都度参照するので、言語切替で再ローカライズさせるため毎レンダーで計算(Result と同じ方針)。
  const fortune = readFortune(state.chart.planets, 'today')
  const color = todayColor()

  const greeting =
    daysSince === 0 ? t.companion.greetToday : daysSince === 1 ? t.companion.greetDay : t.companion.greetBack

  return (
    <div className="companion-screen">
      {starType && (
        <div className="companion-mascot" aria-hidden="true">
          <HoshiKyaraMascot sunElement={starType.sunElement} moonElement={starType.moonElement} size={104} />
        </div>
      )}
      <p className="companion-greeting">{greeting}</p>
      <h2 className="companion-name">{starType?.type.name ?? ''}</h2>

      <section className="today-card">
        <p className="today-title">
          <span className="today-star" aria-hidden="true">
            ✦
          </span>
          {t.companion.cardTitle}
        </p>
        <p className="today-intro">{t.companion.cardIntro}</p>
        <p className="today-sky">{fortune.skyNote}</p>
        <p className="today-tone">{fortune.toneText}</p>
        <div className="today-chips">
          <div className="today-chip">
            <span className="chip-label">{t.companion.colorLabel}</span>
            <span className="chip-color" style={{ background: color }} aria-hidden="true" />
          </div>
          <div className="today-chip">
            <span className="chip-label">{t.companion.keywordLabel}</span>
            <span className="chip-keyword">{fortune.toneLabel}</span>
          </div>
        </div>
      </section>

      <p className="companion-placeholder">（夜の振り返りは準備中）</p>

      <div className="result-actions">
        <button className="ghost" onClick={onRetry}>
          {t.result.retry}
        </button>
        <button className="ghost" onClick={onHome}>
          {t.result.home}
        </button>
      </div>
    </div>
  )
}

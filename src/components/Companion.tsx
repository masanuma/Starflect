import { useEffect, useState } from 'react'
import type { CompanionState } from '../lib/companion'
import { touchVisit, daysSinceLastVisit } from '../lib/companion'
import { starTypeOf } from '../lib/startypes'
import type { PlanetKey } from '../lib/types'
import HoshiKyaraMascot from './HoshiKyaraMascot'
import { track } from '../lib/analytics'

interface Props {
  state: CompanionState
  onRetry: () => void
  onHome: () => void
}

/**
 * 星の相棒ホーム(MVP v0.1 / ステップ1: 骨組み)。
 * 2回目以降はここが起点。今はデータが読めていることの確認まで。
 * TODO(step2〜): 今日の星カード・夜タップ・週末まとめ。
 */
export default function Companion({ state, onRetry, onHome }: Props) {
  // 訪問を記録し、前回からの経過日数を挨拶に使う(罰なし)
  const [daysSince] = useState(() => daysSinceLastVisit(state))

  useEffect(() => {
    touchVisit(state)
    track('companion_open', { days_since: daysSince, star_type: state.starType })
    // マウント時に1回だけ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const lonOf = (key: PlanetKey) => state.chart.planets.find((p) => p.key === key)?.lon
  const sunLon = lonOf('sun')
  const moonLon = lonOf('moon')
  const starType = sunLon !== undefined && moonLon !== undefined ? starTypeOf(sunLon, moonLon) : null

  const greeting = daysSince === 0 ? 'また来てくれたね' : daysSince === 1 ? 'おはよう、今日もどうぞ' : 'おかえり、ひさしぶり'

  return (
    <div className="companion-screen">
      {starType && (
        <div className="companion-mascot" aria-hidden="true">
          <HoshiKyaraMascot sunElement={starType.sunElement} moonElement={starType.moonElement} size={104} />
        </div>
      )}
      <p className="companion-greeting">{greeting}</p>
      <h2 className="companion-name">{starType?.type.name ?? 'あなたのほしキャラ'}</h2>

      <p className="companion-placeholder">
        （ここに「今日の星」と夜の振り返りが入ります — 準備中）
      </p>

      <div className="result-actions">
        <button className="ghost" onClick={onRetry}>
          診断をやり直す
        </button>
        <button className="ghost" onClick={onHome}>
          トップへ
        </button>
      </div>
    </div>
  )
}

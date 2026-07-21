import { useEffect, useState } from 'react'
import type { CompanionState, Mood, Domain } from '../lib/companion'
import {
  touchVisit,
  daysSinceLastVisit,
  markForecastSeen,
  todayColor,
  todayKey,
  recordMood,
  weekAggregate,
} from '../lib/companion'
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
type TapPhase = 'mood' | 'domain' | 'done'

export default function Companion({ state, onRetry, onHome }: Props) {
  const t = useUI()
  const [daysSince] = useState(() => daysSinceLastVisit(state))

  // 夜の振り返り: 今日すでにタップ済みなら 'done' で復元(同日に何度も聞かない)
  const todayEntry = state.daily[todayKey()]
  const [phase, setPhase] = useState<TapPhase>(todayEntry?.mood ? 'done' : 'mood')
  const [mood, setMood] = useState<Mood | undefined>(todayEntry?.mood)

  function pickMood(m: Mood) {
    setMood(m)
    recordMood(state, m)
    track('tap_mood', { mood: m, star_type: state.starType })
    setPhase('domain')
  }
  function pickDomain(d?: Domain) {
    if (mood) recordMood(state, mood, d)
    if (d) track('tap_domain', { domain: d, mood })
    setPhase('done')
  }

  const reaction = mood === 'good' ? t.companion.reactGood : mood === 'bad' ? t.companion.reactBad : t.companion.reactMeh

  // 週末まとめ＋翌週フォーキャスト。土日に表示(ローカル開発時のみ ?weekend で強制確認できる)。
  const now = new Date()
  const forceWeekend =
    new URLSearchParams(location.search).has('weekend') && /^(localhost|127\.)/.test(location.hostname)
  const isWeekend = forceWeekend || now.getDay() === 0 || now.getDay() === 6

  const agg = weekAggregate(state, now)
  const domainLabel = (d?: Domain) =>
    d === 'work' ? t.companion.domWork : d === 'love' ? t.companion.domLove : d === 'people' ? t.companion.domPeople : t.companion.domOther
  const recap =
    agg.total === 0
      ? t.companion.recapNone
      : agg.bad >= 2 && agg.topBadDomain
        ? t.companion.recapTough(domainLabel(agg.topBadDomain))
        : agg.good >= agg.bad && agg.good > 0
          ? t.companion.recapGood
          : t.companion.recapCalm

  // 翌週の運行(未来にウエイト)。now+7 で来週のトランジットを読む。
  const nextWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7)
  const nextFortune = readFortune(state.chart.planets, 'week', nextWeek)
  const tailwind = nextFortune.items.find((i) => i.quality === 'good')
  const caution = nextFortune.items.find((i) => i.quality === 'hard')

  useEffect(() => {
    touchVisit(state)
    markForecastSeen(state)
    track('companion_open', { days_since: daysSince, star_type: state.starType })
    if (isWeekend) track('weekend_view', { star_type: state.starType })
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

      <section className="tap-card">
        {phase === 'mood' && (
          <>
            <p className="tap-question">{t.companion.tapQuestion}</p>
            <div className="tap-moods">
              <button className="tap-btn" onClick={() => pickMood('good')}>
                <span aria-hidden="true">😊</span> {t.companion.moodGood}
              </button>
              <button className="tap-btn" onClick={() => pickMood('meh')}>
                <span aria-hidden="true">😐</span> {t.companion.moodMeh}
              </button>
              <button className="tap-btn" onClick={() => pickMood('bad')}>
                <span aria-hidden="true">😔</span> {t.companion.moodBad}
              </button>
            </div>
          </>
        )}

        {phase === 'domain' && (
          <>
            <p className="tap-question">{t.companion.domainQuestion}</p>
            <div className="tap-domains">
              <button className="tap-chip" onClick={() => pickDomain('work')}>
                {t.companion.domWork}
              </button>
              <button className="tap-chip" onClick={() => pickDomain('love')}>
                {t.companion.domLove}
              </button>
              <button className="tap-chip" onClick={() => pickDomain('people')}>
                {t.companion.domPeople}
              </button>
              <button className="tap-chip" onClick={() => pickDomain('other')}>
                {t.companion.domOther}
              </button>
              <button className="tap-chip tap-skip" onClick={() => pickDomain(undefined)}>
                {t.companion.tapSkip}
              </button>
            </div>
          </>
        )}

        {phase === 'done' && <p className="tap-reaction">{reaction}</p>}
      </section>

      {isWeekend && (
        <section className="weekend-card">
          <p className="weekend-title">{t.companion.weekendTitle}</p>
          <p className="weekend-recap">{recap}</p>
          <p className="forecast-title">
            <span aria-hidden="true">✦ </span>
            {t.companion.forecastTitle}
          </p>
          <p className="forecast-tone">{nextFortune.toneText}</p>
          {tailwind && (
            <p className="forecast-line forecast-good">
              <span className="forecast-label">{t.companion.tailwindLabel}</span>
              {tailwind.title}
            </p>
          )}
          {caution && (
            <p className="forecast-line forecast-hard">
              <span className="forecast-label">{t.companion.cautionLabel}</span>
              {caution.title}
            </p>
          )}
        </section>
      )}

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

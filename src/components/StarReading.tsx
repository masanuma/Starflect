import { useEffect, useRef, useState } from 'react'
import type { ChartData, PlanetKey } from '../lib/types'
import { readFortune } from '../lib/fortune'
import { todayColor, todayColorName, loadCompanion, saveFortune, todaysFortune } from '../lib/companion'
import { starTypeOf } from '../lib/startypes'
import { getPlanet } from '../lib/planets'
import { signName } from '../lib/signs'
import { signIndex } from '../lib/astro'
import { streamAiFortune } from '../lib/aiChat'
import HoshiKyaraMascot from './HoshiKyaraMascot'
import { useUI } from '../lib/ui'

type State =
  | { kind: 'reading' }
  | { kind: 'done'; text: string }
  | { kind: 'error' }

/**
 * ほしキャラが読む「今日」の運勢。
 *
 * **本文はAIが書く。** 以前は固定文21本(運行天体7種 × 良い/悪い/重なる)から選ぶだけで、
 * しかも運行天体だけで決まり出生図に依存しなかったため、同じ人の14日ぶんで異なりは13本、
 * 別人でも本文が被っていた＝毎日の面では12星座占いと同じ土俵に立っていた。
 *
 * **1日1本・引き直し不可**。保存済みがあればそれを見せる(毎回違うことを言うと「適当だ」と思われる)。
 * 深掘りしたい人は下のチップから相談室へ流す。
 *
 * 先の期間(明日/今週/来月…)は出さない。先まで見せると"明日また来る理由"も
 * "相棒に聞く理由"も同時に消えてしまうため。
 */
export default function StarReading({ chart, onAsk }: { chart: ChartData; onAsk?: (q: string) => void }) {
  const t = useUI()
  const fortune = readFortune(chart.planets, 'today')

  const lonOf = (key: PlanetKey) => chart.planets.find((p) => p.key === key)?.lon
  const sunLon = lonOf('sun')
  const moonLon = lonOf('moon')
  const starType = sunLon !== undefined && moonLon !== undefined ? starTypeOf(sunLon, moonLon) : null
  const name = starType?.type.name ?? ''

  const [state, setState] = useState<State>(() => {
    const saved = loadCompanion()
    const today = saved ? todaysFortune(saved) : undefined
    return today ? { kind: 'done', text: today.text } : { kind: 'reading' }
  })
  // 二重生成を防ぐ(StrictMode の二回マウントや、再レンダーでの再実行)
  const startedRef = useRef(false)

  async function generate() {
    setState({ kind: 'reading' })
    let acc = ''
    try {
      await streamAiFortune(
        {
          name: chart.name ?? '',
          dateLabel: chart.dateLabel,
          placeLabel: chart.placeLabel,
          starTypeName: starType?.type.name,
          starTypeCopy: starType?.type.copy,
          planets: chart.planets.map((p) => ({
            label: getPlanet(p.key).name,
            role: getPlanet(p.key).role,
            sign: signName(signIndex(p.lon)),
            deg: p.lon % 30,
            retro: p.retro,
          })),
          periods: [
            {
              label: '今日',
              sky: fortune.skyNote,
              tone: fortune.toneLabel,
              items: fortune.items.map((i) => i.title),
            },
          ],
        },
        (delta) => {
          // 届いた分から順に出す＝「読み込み中」ではなく「いま書いている」に見せる
          acc += delta
          setState({ kind: 'done', text: acc })
        },
      )
      const saved = loadCompanion()
      // 相棒がまだ作られていない瞬間(初回診断の直後)は保存を諦める。翌日また書けばよい
      if (saved && acc.trim()) saveFortune(saved, acc.trim(), fortune.items.map((i) => i.title))
    } catch {
      // 障害は素直に伝える。固定文でごまかすと「その人のために書いている」が嘘になる
      setState({ kind: 'error' })
    }
  }

  useEffect(() => {
    if (startedRef.current || state.kind === 'done') return
    startedRef.current = true
    void generate()
    // マウント時に1回だけ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

      {state.kind === 'reading' && (
        <div className="fortune-waiting">
          {starType && (
            <div className="fortune-waiting-star" aria-hidden="true">
              <HoshiKyaraMascot sunElement={starType.sunElement} moonElement={starType.moonElement} size={68} />
            </div>
          )}
          <p className="fortune-waiting-msg">
            {t.companion.fortuneWaiting}
            <span className="fortune-dots" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </p>
          {/* 待たせている間に「いま何を見ているか」を出す。手元のデータなのでAIを待たずに表示できる */}
          <p className="fortune-waiting-hint">{fortune.plainSky}</p>
        </div>
      )}

      {state.kind === 'done' && <p className="fortune-body">{state.text}</p>}

      {state.kind === 'error' && (
        <div className="fortune-error">
          <p>{t.companion.fortuneError}</p>
          <button className="ghost" onClick={() => void generate()}>
            {t.companion.fortuneRetry}
          </button>
        </div>
      )}

      {/* 天体の根拠は「なぜならば」＝見たい人だけ。畳んでおく(憲法) */}
      <details className="fortune-why">
        <summary>{t.companion.fortuneWhy}</summary>
        <p className="fortune-why-sky">{fortune.plainSky}</p>
        <p className="fortune-why-tone">
          <span className="tone-badge">{fortune.toneLabel}</span>
          {fortune.toneText}
        </p>
        <ul className="fortune-why-list">
          {fortune.items.map((item) => (
            <li key={item.title} className={item.quality}>
              {item.plain}
            </li>
          ))}
        </ul>
      </details>

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

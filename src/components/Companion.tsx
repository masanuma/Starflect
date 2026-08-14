import { useEffect, useState } from 'react'
import type { CompanionState, Mood, Domain } from '../lib/companion'
import {
  touchVisit,
  daysSinceLastVisit,
  markForecastSeen,
  todayKey,
  recordMood,
  weekAggregate,
  currentSignals,
  loadCompanion,
  behaviorBrief,
  personaNeedsUpdate,
  savePersona,
  todaysPickId,
  recordPick,
  personaPicks,
  PICK_IDS,
} from '../lib/companion'
import { starTypeOf } from '../lib/startypes'
import { readFortune } from '../lib/fortune'
import type { PlanetKey } from '../lib/types'
import HoshiKyaraMascot from './HoshiKyaraMascot'
import StarReading from './StarReading'
import PartyCard from './PartyCard'
import RewardMap from './RewardMap'
import AiChat from './AiChat'
import { buildChatContext, chatStorageKey, userSays, fetchPersona, facetOfNow, timeOfDay } from '../lib/aiChat'
import { useUI, quoted } from '../lib/ui'
import { track } from '../lib/analytics'

interface Props {
  state: CompanionState
  onHome: () => void
  onPair: () => void
}

type TapPhase = 'mood' | 'domain' | 'pick' | 'done'

/**
 * 星の相棒ホーム(MVP v0.1)。2回目以降の起点。
 * 挨拶(罰なし) + ほしキャラが読む運勢(StarReading・期間切替) + 夜の振り返りタップ + 週末まとめ。
 * AIなし(A1/B1)。
 */
export default function Companion({ state, onHome, onPair }: Props) {
  const t = useUI()
  const [daysSince] = useState(() => daysSinceLastVisit(state))
  // ごほうび地図の現在シグナル。タップ・会話・運勢閲覧で増える(端末の最新を反映)
  const [signals, setSignals] = useState(() => currentSignals(state))
  const refreshSignals = () => setSignals(currentSignals(loadCompanion() ?? state))

  // 夜の振り返り: 今日すでにタップ済みなら 'done' で復元(同日に何度も聞かない)
  const todayEntry = state.daily[todayKey()]
  /**
   * 一日を振り返るタップは、**一日が進んでから**にする。
   * 朝7時に「今日はいかがでしたか？」と聞かれるのは、単純におかしい。
   * これまでは時刻を一切見ておらず、朝でも夜でも同じ画面を出していた。
   */
  const askMood = facetOfNow() === 'night' || timeOfDay() === '夕方'
  const [phase, setPhase] = useState<TapPhase>(todayEntry?.mood || !askMood ? 'done' : 'mood')
  const [mood, setMood] = useState<Mood | undefined>(todayEntry?.mood)

  // 2問目は「領域」と「遊びの二択」の取り合い。日付から決まるので、同じ日は何度開いても同じ問い。
  // 二択は3日に1日しか出ないので、ローカル開発時だけ ?pick=<id> で強制表示できるようにしておく
  const forcedPick = new URLSearchParams(location.search).get('pick')
  const pickId =
    forcedPick && /^(localhost|127\.)/.test(location.hostname)
      ? (PICK_IDS.find((id) => id === forcedPick) ?? todaysPickId())
      : todaysPickId()

  function pickMood(m: Mood) {
    setMood(m)
    recordMood(state, m)
    refreshSignals()
    track('tap_mood', { mood: m, star_type: state.starType })
    setPhase(pickId ? 'pick' : 'domain')
  }
  function pickDomain(d?: Domain) {
    if (mood) recordMood(state, mood, d)
    if (d) track('tap_domain', { domain: d, mood })
    setPhase('done')
  }
  function answerPick(a: 0 | 1) {
    if (!pickId) return
    recordPick(state, pickId, a)
    refreshSignals()
    track('tap_pick', { pick: pickId, answer: a })
    setPhase('done')
  }

  /**
   * 「人となり」を裏で作り直す（記憶の圧縮）。
   *
   * 運勢の生成をブロックしない＝**その日の運勢は前回の人となりを使う**。翌日から新しくなる。
   * ここで待たせてまで最新にする価値は無いし、待ち時間はパーソナライズの証拠として
   * 運勢の生成に使いたい。失敗しても握りつぶす（人となりが無いだけで、運勢は書ける）。
   */
  async function refreshPersona() {
    try {
      const base = loadCompanion() ?? state
      const says = userSays(base.chart)
      if (!personaNeedsUpdate(base, says.length)) return
      const lines = await fetchPersona(says, behaviorBrief(base), personaPicks(base))
      savePersona(base, lines, says.length)
    } catch {
      /* 作れなくても困らない */
    }
  }

  // 運勢カードの「この先が気になったら」から相談室へ質問を投げる(毎日の入口をAIに寄せる)
  const [autoAsk, setAutoAsk] = useState<{ q: string; n: number } | undefined>()
  const ask = (q: string) => setAutoAsk((prev) => ({ q, n: (prev?.n ?? 0) + 1 }))

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
    refreshSignals()
    // hour を送るまで「1日に何回・何時に開かれているか」が一切分からなかった。
    // 時間帯で顔を変える施策が効いたかどうかは、この基準線が無いと判定できない
    track('companion_open', {
      days_since: daysSince,
      star_type: state.starType,
      hour: new Date().getHours(),
      time_of_day: timeOfDay(),
    })
    if (isWeekend) track('weekend_view', { star_type: state.starType })
    void refreshPersona()
    // マウント時に1回だけ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const lonOf = (key: PlanetKey) => state.chart.planets.find((p) => p.key === key)?.lon
  const sunLon = lonOf('sun')
  const moonLon = lonOf('moon')
  const starType = sunLon !== undefined && moonLon !== undefined ? starTypeOf(sunLon, moonLon) : null

  const greeting =
    daysSince === 0 ? t.companion.greetToday : daysSince === 1 ? t.companion.greetDay : t.companion.greetBack

  return (
    <div className="companion-screen">
      <div className="companion-topbar">
        <button className="companion-menu" onClick={onHome}>
          {t.companion.toMenu}
        </button>
      </div>
      {starType && (
        <div className="companion-mascot" aria-hidden="true">
          <HoshiKyaraMascot sunElement={starType.sunElement} moonElement={starType.moonElement} size={104} />
        </div>
      )}
      <p className="companion-greeting">{greeting}</p>
      <h2 className="companion-name">{starType ? quoted(starType.type.name) : ''}</h2>

      {/* 毎日ひらく理由＝今日の運勢。ここを一等地に置く。
          地図や星の内訳は「たまに見る」ものなので、相談室・振り返りより下へ送る */}
      {/* daysSince は touchVisit より前にcaptureした値。渡さないと「ひさしぶり」が永久に出ない */}
      <StarReading chart={state.chart} onAsk={ask} daysSince={daysSince} />

      <AiChat
        context={buildChatContext(state.chart)}
        storageKey={chatStorageKey(state.chart)}
        chart={state.chart}
        onExchange={refreshSignals}
        autoAsk={autoAsk}
      />

      {/*
        朝〜昼は振り返りを聞かないので、カードごと出さない。
        `phase==='done'` は「答えた人へのひとこと」なので、答えていない人に出すと
        押してもいない気分への反応文が表示されてしまう
      */}
      {(askMood || todayEntry?.mood) && (
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

        {/* 遊びの二択。領域と同じ枠なので、聞かれる回数は増えない */}
        {phase === 'pick' && pickId && (
          <>
            <p className="tap-question">{t.companion.picks[pickId].q}</p>
            <div className="tap-domains">
              <button className="tap-chip" onClick={() => answerPick(0)}>
                {t.companion.picks[pickId].a[0]}
              </button>
              <button className="tap-chip" onClick={() => answerPick(1)}>
                {t.companion.picks[pickId].a[1]}
              </button>
              <button className="tap-chip tap-skip" onClick={() => setPhase('done')}>
                {t.companion.tapSkip}
              </button>
            </div>
          </>
        )}

        {phase === 'done' && <p className="tap-reaction">{reaction}</p>}
      </section>
      )}

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
              {tailwind.plain}
            </p>
          )}
          {caution && (
            <p className="forecast-line forecast-hard">
              <span className="forecast-label">{t.companion.cautionLabel}</span>
              {caution.plain}
            </p>
          )}
        </section>
      )}

      {/* 進み具合(Lv)は見出しに残しつつ、宝箱一覧は畳んでおく */}
      <RewardMap signals={signals} chart={state.chart} starName={starType?.type.name ?? ''} collapsible />

      <PartyCard data={state.chart} collapsedByDefault />

      <div className="result-actions">
        <button className="ghost" onClick={onPair}>
          {t.companion.toPair}
        </button>
        <button className="ghost" onClick={onHome}>
          {t.companion.toMenu}
        </button>
      </div>
    </div>
  )
}

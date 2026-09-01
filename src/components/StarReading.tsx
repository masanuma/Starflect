import { useEffect, useRef, useState } from 'react'
import type { ChartData, PlanetKey } from '../lib/types'
import { readFortune } from '../lib/fortune'
import {
  todayColor,
  todayColorName,
  loadCompanion,
  saveFortune,
  todaysFortune,
  currentAir,
  pendingHitAsk,
  recordHit,
} from '../lib/companion'
import type { Hit } from '../lib/companion'
import { track } from '../lib/analytics'
import { starTypeOf } from '../lib/startypes'
import { getPlanet } from '../lib/planets'
import { signName, signKeywords } from '../lib/signs'
import { signIndex } from '../lib/astro'
import { streamAiFortune, facetOfNow } from '../lib/aiChat'
import type { Facet } from '../lib/companion'
import HoshiKyaraMascot from './HoshiKyaraMascot'
import { useUI, quoted } from '../lib/ui'
import { useLang } from '../lib/i18n'
import { makeShareCard, pickQuote } from '../lib/shareCard'
import { renderToStaticMarkup } from 'react-dom/server'

/** 答え合わせで振り返る運勢の抜粋。全文を貼ると今日の運勢より長くなって主役が入れ替わる */
const excerpt = (text: string, max = 56) => (text.length <= max ? text : `${text.slice(0, max)}…`)

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
export default function StarReading({
  chart,
  onAsk,
  daysSince,
}: {
  chart: ChartData
  onAsk?: (q: string) => void
  /**
   * 前回訪問からの経過日数。**訪問を記録する前に**captureした値を親から受け取る。
   * ここで自前に測ると、親の `touchVisit` と競合して常に0になり「ひさしぶり」が出ない。
   */
  daysSince?: number
}) {
  const t = useUI()
  const { lang } = useLang()
  const fortune = readFortune(chart.planets, 'today')

  // 「今日の1枚」＝運勢の締めの1文を画像カードにする。拡散の最小単位。
  // 生成は全部この端末内(canvas)で、サーバーには何も送らない
  const [card, setCard] = useState<{ url: string; blob: Blob } | null>(null)
  async function makeCard(text: string) {
    if (!starType) return
    try {
      track('share_card_make', { facet })
      const svg = renderToStaticMarkup(
        <HoshiKyaraMascot sunElement={starType.sunElement} moonElement={starType.moonElement} size={400} />,
      )
      const blob = await makeShareCard({
        mascotSvg: svg,
        dateLabel: new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date()),
        typeName: quoted(starType.type.name),
        quote: pickQuote(text),
      })
      setCard((prev) => {
        if (prev) URL.revokeObjectURL(prev.url)
        return { url: URL.createObjectURL(blob), blob }
      })
    } catch {
      /* 生成できない環境では何も出さない */
    }
  }
  async function shareCard() {
    if (!card) return
    const file = new File([card.blob], 'starflect.png', { type: 'image/png' })
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] })
        track('share_card_share', { facet })
        return
      }
    } catch {
      /* キャンセル等は無視して保存に流さない */
      return
    }
    saveCard()
  }
  function saveCard() {
    if (!card) return
    const a = document.createElement('a')
    a.href = card.url
    a.download = `starflect-${new Date().toISOString().slice(0, 10)}.png`
    a.click()
    track('share_card_save', { facet })
  }

  // どちらの面を読むかは時刻で決まる。夜〜深夜は月の面（いまの気持ち）。
  // 面はマウント時に1度だけ決める＝生成中に日付境界をまたいでも入れ替わらない
  const [facet] = useState<Facet>(() => facetOfNow())
  const night = facet === 'night'

  const lonOf = (key: PlanetKey) => chart.planets.find((p) => p.key === key)?.lon
  const sunLon = lonOf('sun')
  const moonLon = lonOf('moon')
  const starType = sunLon !== undefined && moonLon !== undefined ? starTypeOf(sunLon, moonLon) : null
  const name = starType?.type.name ?? ''

  const [state, setState] = useState<State>(() => {
    const saved = loadCompanion()
    const today = saved ? todaysFortune(saved, undefined, undefined, facet) : undefined
    return today ? { kind: 'done', text: today.text } : { kind: 'reading' }
  })
  // 夜に見たときだけ、その日の朝ぶんを畳んで置いておく（読み返せるように）
  const daytime = night ? (loadCompanion() ? todaysFortune(loadCompanion()!, undefined, undefined, 'day') : undefined) : undefined
  // 二重生成を防ぐ(StrictMode の二回マウントや、再レンダーでの再実行)
  const startedRef = useRef(false)

  // 答え合わせ。前に書いた運勢について、後日1回だけ聞く(毎日は聞かない・スキップ可)。
  // マウント時に一度だけ決める＝答えた直後に次の質問が湧いて出ないように。
  const [ask, setAsk] = useState(() => {
    const saved = loadCompanion()
    return saved ? pendingHitAsk(saved) : undefined
  })
  const [thanked, setThanked] = useState(false)
  function answerHit(hit: Hit) {
    if (!ask) return
    const saved = loadCompanion()
    if (saved) recordHit(saved, ask.dateKey, hit)
    track('fortune_hit', { hit, days_ago: ask.daysAgo })
    setAsk(undefined)
    // スキップは「答えなかった」なので、お礼を言われるほうが気持ち悪い
    setThanked(hit !== 'skip')
  }

  async function generate() {
    setState({ kind: 'reading' })
    let acc = ''
    // 記憶(層2)。渡すものが何も無ければ undefined＝プロンプトにブロックごと出さない。
    // 生の回数・日数はここを通らない＝AIが数え上げることが構造的にできない
    const saved0 = loadCompanion()
    const air = saved0 ? currentAir(saved0, new Date(), daysSince) : undefined
    const hasAir = air && Object.keys(air).length > 0
    // 人となり（全期間）。会話がまだ少ない人には無い。生成は相棒ホーム側で裏で走らせる
    const persona = saved0?.persona?.lines
    // これまで一度も運勢を書いたことがない＝出会って最初の1本。
    // 初回だけ「明日、今日がどうだったか聞かせて」という約束で閉じる（答え合わせの予告）
    const firstMeeting = !saved0 || !Object.values(saved0.daily).some((e) => e.fortune || e.fortuneNight)
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
            // 星座名も渡すが、運勢のプロンプトはこれを載せない（載せると口に出すため）。
            // 実際に使われるのは traits のほう
            sign: signName(signIndex(p.lon)),
            traits: signKeywords(signIndex(p.lon)),
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
        undefined,
        hasAir ? air : undefined,
        persona?.length ? persona : undefined,
        facet,
        firstMeeting,
      )
      const saved = loadCompanion()
      // 相棒がまだ作られていない瞬間(初回診断の直後)は保存を諦める。翌日また書けばよい
      if (saved && acc.trim()) {
        saveFortune(saved, acc.trim(), fortune.items.map((i) => i.title), undefined, undefined, facet)
      }
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
          <p className="card-title">{night ? t.companion.readingHeadingNight : t.companion.readingHeading}</p>
          <p className="card-sub">{night ? t.companion.readsIntroNight(name) : t.companion.readsIntro(name)}</p>
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
            {night ? t.companion.fortuneWaitingNight : t.companion.fortuneWaiting}
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

      {/* 今日の1枚。締めの1文だけを画像にする＝全文の全公開は求めない */}
      {state.kind === 'done' && !card && (
        <button className="ghost card-make" onClick={() => void makeCard(state.text)}>
          {t.companion.cardMake}
        </button>
      )}
      {card && (
        <div className="card-preview">
          <img src={card.url} alt="" />
          <div className="card-actions">
            <button className="cta card-btn" onClick={() => void shareCard()}>
              {t.companion.cardShare}
            </button>
            <button className="ghost card-btn" onClick={saveCard}>
              {t.companion.cardSave}
            </button>
          </div>
        </div>
      )}

      {/* 夜に見たときだけ、朝に読んだ運勢を畳んで置く。読み返せるが、主役は月の面のまま */}
      {night && daytime && (
        <details className="fortune-why">
          <summary>{t.companion.daytimeFortune}</summary>
          <p className="fortune-body">{daytime.text}</p>
        </details>
      )}

      {/*
        答え合わせ。読み終えたあとが自然な間なので、本文の下に置く。
        集めた手応えは次からの書き方(断定を弱める/踏み込む)にだけ使い、的中率などの数字は出さない。
      */}
      {state.kind === 'done' && ask && (
        <div className="hit-ask">
          <p className="hit-ask-q">{t.companion.hitAsk(ask.daysAgo)}</p>
          <p className="hit-ask-quote">{excerpt(ask.fortune.text)}</p>
          <div className="hit-ask-btns">
            <button onClick={() => answerHit('hit')}>{t.companion.hitYes}</button>
            <button onClick={() => answerHit('soso')}>{t.companion.hitSoso}</button>
            <button onClick={() => answerHit('miss')}>{t.companion.hitNo}</button>
            <button onClick={() => answerHit('dunno')}>{t.companion.hitDunno}</button>
          </div>
          <button className="hit-ask-skip" onClick={() => answerHit('skip')}>
            {t.companion.hitSkip}
          </button>
        </div>
      )}
      {thanked && <p className="hit-thanks">{t.companion.hitThanks}</p>}

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

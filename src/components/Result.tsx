import { useEffect, useState } from 'react'
import type { ChartData, PlanetKey } from '../lib/types'
import { synthesize } from '../lib/synthesis'
import { starTypeOf, elementPhrase } from '../lib/startypes'
import AiChat from './AiChat'
import StarReading from './StarReading'
import PartyCard from './PartyCard'
import ShareButtons from './ShareButtons'
import InviteTeaser from './InviteTeaser'
import Feedback from './Feedback'
import ResultReveal from './ResultReveal'
import { createCompanion, loadCompanion, markForecastSeen } from '../lib/companion'
import { buildChatContext, chatStorageKey } from '../lib/aiChat'
import PlanetMascot from './PlanetMascot'
import HoshiKyaraMascot from './HoshiKyaraMascot'
import { useUI, quoted } from '../lib/ui'
import { track } from '../lib/analytics'

const ELEMENT_SLUG: Record<string, string> = { 火: 'fire', 地: 'earth', 風: 'air', 水: 'water' }

interface Props {
  data: ChartData
  onHome: () => void
  onPair: () => void
}

export default function Result({ data, onHome, onPair }: Props) {
  const t = useUI()

  const lonOf = (key: PlanetKey) => data.planets.find((p) => p.key === key)?.lon
  const sunLon = lonOf('sun')
  const moonLon = lonOf('moon')
  const ascLon = lonOf('asc')
  const synthesis =
    sunLon !== undefined && moonLon !== undefined && ascLon !== undefined
      ? synthesize(sunLon, moonLon, ascLon)
      : null

  const starType = sunLon !== undefined && moonLon !== undefined ? starTypeOf(sunLon, moonLon) : null

  const starSlug = starType
    ? `${ELEMENT_SLUG[starType.sunElement]}_${ELEMENT_SLUG[starType.moonElement]}`
    : undefined

  // 「はじめての診断」かどうか。リビール演出と「歩き方」案内は初回だけ出す。
  // (createCompanion より前＝レンダー中に判定する必要があるので useState の初期化で見る)
  const [isFirst] = useState(() => {
    if (typeof window === 'undefined') return false
    if (new URLSearchParams(window.location.search).has('reveal')) return true // 確認用の強制表示
    return loadCompanion() === null
  })
  // 動きが苦手な設定では演出を再生しない(案内は出す)
  const [revealing, setRevealing] = useState(
    () => isFirst && !(typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches),
  )
  const [played, setPlayed] = useState(false)
  // 運勢カードの「この先が気になったら」から相談室へ質問を投げる
  const [autoAsk, setAutoAsk] = useState<{ q: string; n: number } | undefined>()
  const ask = (q: string) => setAutoAsk((prev) => ({ q, n: (prev?.n ?? 0) + 1 }))

  useEffect(() => {
    track('diagnose_result', {
      period: data.period,
      has_time: ascLon !== undefined,
      star_type: starSlug,
    })
    // 診断した時点で、このほしキャラを相棒として自動保存(次回から相棒ホームに戻る=毎日そばに)
    const companion = createCompanion(data, starSlug ?? '')
    // この画面でも運勢を見ている(StarReading を出している)のに数えていなかった。
    // 初回セッションではここが唯一の加算源になり得るので、地図の1つ目が届くかどうかを左右する
    markForecastSeen(companion)
    // 結果表示ごとに1回だけ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 相談チャット(＝ほしキャラとの会話)に渡すコンテキスト
  const chatContext = buildChatContext(data)

  return (
    <>
      {revealing && starType && (
        <ResultReveal
          sunElement={starType.sunElement}
          moonElement={starType.moonElement}
          name={quoted(starType.type.name)}
          copy={starType.type.copy}
          onFadeStart={() => setPlayed(true)}
          onDone={() => {
            setRevealing(false)
            setPlayed(true)
          }}
        />
      )}
      <div className={`result-screen${played ? ' is-revealed' : ''}${revealing && !played ? ' is-veiled' : ''}`}>
      <p className="result-lead">{t.result.born(data.dateLabel)}</p>
      {data.placeLabel && <p className="result-place">{data.placeLabel}</p>}
      <h2 className="screen-title">{t.result.title(data.name ?? '')}</h2>
      <div className="ornament" aria-hidden="true">
        ✦ ✦ ✦
      </div>

      {starType && (
        <section className="type-card">
          <div className="type-mascot" aria-hidden="true">
            <HoshiKyaraMascot sunElement={starType.sunElement} moonElement={starType.moonElement} size={150} />
          </div>
          <h3 className="type-name">{quoted(starType.type.name)}</h3>
          <p className="type-copy">{starType.type.copy}</p>
          {/* 太陽×月の式は「どこから生まれたか」の答え。登場演出の直後に置いて余韻をつなぐ */}
          <div className="type-formula">
            <div className="type-formula-side">
              <PlanetMascot planetKey="sun" size={42} />
              <span>
                {t.result.outerFace}
                <br />
                {elementPhrase(starType.sunElement)}
              </span>
            </div>
            <span className="type-formula-x" aria-hidden="true">
              ×
            </span>
            <div className="type-formula-side">
              <PlanetMascot planetKey="moon" size={42} />
              <span>
                {t.result.innerHeart}
                <br />
                {elementPhrase(starType.moonElement)}
              </span>
            </div>
          </div>
          <p className="type-count">{t.result.typeCount}</p>
          {/*
            出会いの一行。式（太陽×月＝どこから生まれたか）の直後に、キャラ自身の声で置く。
            ほしキャラは生まれた瞬間の空から作られる＝誕生の瞬間を共有する存在。
            「診断される」ではなく「出会う」——ここが関係の始まり（憲法: 支えになる占い）
          */}
          <p className="type-meeting">{t.result.meetingLine(data.dateLabel)}</p>

          <div className="type-detail">
            <p className="type-text">{starType.type.text}</p>
          </div>
        </section>
      )}

      {/* 招待リンクで来た人には「送ってくれた人との相性」を最初に見せる。誘われた人のいちばんの関心はここ */}
      <InviteTeaser mySlug={starSlug} onPair={onPair} />

      <StarReading key={t.companion.readingHeading} chart={data} onAsk={ask} />

      <AiChat context={chatContext} storageKey={chatStorageKey(data)} chart={data} autoAsk={autoAsk} />

      {/* 最初に今日を楽しむ。星の詳しい説明は、その後で気になる人が読む。 */}
      <PartyCard data={data} collapsedByDefault />
      {synthesis && (
        <details className="result-synthesis">
          <summary>{t.result.synthLabel}</summary>
          <p>{synthesis.intro}</p><p>{synthesis.balance}</p><p>{synthesis.relation}</p>
        </details>
      )}

      {starType && (
        <ShareButtons
          heading={t.share.heading}
          text={t.share.text(quoted(starType.type.name))}
          path={starSlug ? `/c/${encodeURIComponent(starSlug)}` : '/'}
          label={starSlug}
        />
      )}

      <Feedback page="result" starType={starSlug} chart={data} />

      {ascLon === undefined && (
        <div className="upsell">
          <p>{t.result.upsell}</p>
        </div>
      )}

      <div className="result-actions">
        <button className="ghost" onClick={onPair}>
          {t.companion.toPair}
        </button>
        <button className="ghost" onClick={onHome}>
          {t.companion.toMenu}
        </button>
      </div>
      </div>
    </>
  )
}

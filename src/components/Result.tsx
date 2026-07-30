import { useEffect, useRef, useState } from 'react'
import type { ChartData, PlanetKey } from '../lib/types'
import { synthesize } from '../lib/synthesis'
import { starTypeOf, elementPhrase } from '../lib/startypes'
import AiChat from './AiChat'
import StarReading from './StarReading'
import PartyCard from './PartyCard'
import ShareButtons from './ShareButtons'
import Feedback from './Feedback'
import ResultReveal from './ResultReveal'
import { createCompanion, loadCompanion } from '../lib/companion'
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
  // 「歩き方」案内から相談室へ運ぶ
  const chatRef = useRef<HTMLDivElement>(null)
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
    createCompanion(data, starSlug ?? '')
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

          <div className="type-detail">
            <p className="type-text">{starType.type.text}</p>
            {synthesis && (
              <div className="type-synth">
                <p className="type-synth-label">{t.result.synthLabel}</p>
                <p className="type-text">{synthesis.intro}</p>
                <p className="type-text">{synthesis.balance}</p>
                <p className="type-text">{synthesis.relation}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 初回は情報量が多いので、この画面の歩き方と“いちばんのおすすめ”を先に示す */}
      {isFirst && (
        <section className="guide-card">
          <p className="guide-title">✦ {t.result.guideTitle}</p>
          <p className="guide-body">{t.result.guideBody(data.planets.length)}</p>
          <button
            className="guide-cta"
            onClick={() => {
              // 動きが苦手な設定のときは滑らせずに一気に運ぶ
              const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
              chatRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
            }}
          >
            {t.result.guideCta} ↓
          </button>
        </section>
      )}

      {/* 「自分は何者か」を見てから人に見せる流れにする(星の内訳→シェア) */}
      <PartyCard data={data} />

      {starType && (
        <ShareButtons
          heading={t.share.heading}
          text={t.share.text(quoted(starType.type.name))}
          path={starSlug ? `/c/${encodeURIComponent(starSlug)}` : '/'}
          label={starSlug}
        />
      )}

      <StarReading chart={data} onAsk={ask} />

      <div ref={chatRef}>
        <AiChat context={chatContext} storageKey={chatStorageKey(data)} chart={data} autoAsk={autoAsk} />
      </div>

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

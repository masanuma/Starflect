import { useEffect, useState } from 'react'
import type { PairData, PairPerson } from '../lib/compat'
import { compatOf, pairTip, relLabel } from '../lib/compat'
import { readFortune, periodLabel } from '../lib/fortune'
import { starTypeOf } from '../lib/startypes'
import type { PairChatContext } from '../lib/aiChat'
import { streamAiPairChat } from '../lib/aiChat'
import { getPlanet } from '../lib/planets'
import { signName } from '../lib/signs'
import { signIndex } from '../lib/astro'
import { useUI } from '../lib/ui'
import AiChat from './AiChat'
import PairReveal from './PairReveal'
import HoshiKyaraMascot from './HoshiKyaraMascot'
import ShareButtons from './ShareButtons'
import SectionIcon from './SectionIcon'
import Feedback from './Feedback'
import { track } from '../lib/analytics'

interface Props {
  data: PairData
  onRetry: () => void
  onHome: () => void
}

/** キャラのスラッグ(= /ogp/<slug>.png・サーバーが相性を再計算するための鍵) */
const ELEMENT_SLUG: Record<string, string> = { 火: 'fire', 地: 'earth', 風: 'air', 水: 'water' }
const slugOf = (s: { sunElement: string; moonElement: string }) =>
  `${ELEMENT_SLUG[s.sunElement]}_${ELEMENT_SLUG[s.moonElement]}`

function personType(p: PairPerson) {
  const sun = p.planets.find((pp) => pp.key === 'sun')!
  const moon = p.planets.find((pp) => pp.key === 'moon')!
  return starTypeOf(sun.lon, moon.lon)
}

/** 直前にリビール演出を見せた組み合わせ(同じふたりでの占い直しでは再生しない) */
const PAIR_REVEALED_KEY = 'starflect-pair-revealed'

export default function PairResult({ data, onRetry, onHome }: Props) {
  const t = useUI()
  const { a, b } = data
  const typeA = personType(a)
  const typeB = personType(b)
  const compat = compatOf(a, b)

  // 出すのは「今日のふたり」だけ。先まで見せると"また見る理由"も"相棒に聞く理由"も消えるので、
  // この先は相談室へ渡す(ソロの運勢カードと同じ方針)
  const fortuneA = readFortune(a.planets, 'today')
  const fortuneB = readFortune(b.planets, 'today')
  // 相談室へ質問を投げるための合図
  const [autoAsk, setAutoAsk] = useState<{ q: string; n: number } | undefined>()
  const ask = (q: string) => setAutoAsk((prev) => ({ q, n: (prev?.n ?? 0) + 1 }))
  const tip = pairTip(fortuneA.toneLevel, fortuneB.toneLevel, a.name, b.name)

  const anyApprox = a.approxTime || b.approxTime

  // リビール演出は「はじめて見る組み合わせ」のときだけ。
  // 同じふたりで条件を変えて占い直したときに毎回再生されると煩わしいので、直前の組み合わせを覚えておく。
  const pairKey = `${a.dateLabel}|${b.dateLabel}`
  const [revealing, setRevealing] = useState(() => {
    if (typeof window === 'undefined') return false
    if (new URLSearchParams(window.location.search).has('reveal')) return true // 確認用の強制再生
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false
    try {
      return localStorage.getItem(PAIR_REVEALED_KEY) !== pairKey
    } catch {
      return true
    }
  })
  const [played, setPlayed] = useState(false)

  useEffect(() => {
    track('pair_result')
    try {
      localStorage.setItem(PAIR_REVEALED_KEY, pairKey)
    } catch {
      /* 保存できない環境では毎回再生されるだけなので無視 */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 相性チャット(相談室)に渡すふたりのデータ。選択中の期間の空模様を反映する。
  const natalOf = (p: PairPerson) =>
    p.planets.map((pp) => ({ label: getPlanet(pp.key).name, sign: signName(signIndex(pp.lon)) }))
  const pairChatContext: PairChatContext = {
    nameA: a.name,
    nameB: b.name,
    typeA: typeA.type.name,
    typeB: typeB.type.name,
    natalA: natalOf(a),
    natalB: natalOf(b),
    percent: compat.percent,
    nickname: compat.nickname,
    details: compat.details.map((d) => `${d.title}: ${d.text}`),
    skyNote: fortuneA.skyNote,
    toneA: fortuneA.toneLabel,
    toneB: fortuneB.toneLabel,
    aspectsA: fortuneA.items.map((i) => i.title),
    aspectsB: fortuneB.items.map((i) => i.title),
  }

  return (
    <>
      {revealing && (
        <PairReveal
          a={{ sunElement: typeA.sunElement, moonElement: typeA.moonElement, name: a.name }}
          b={{ sunElement: typeB.sunElement, moonElement: typeB.moonElement, name: b.name }}
          percent={compat.percent}
          nickname={compat.nickname}
          emoji={compat.emoji}
          onFadeStart={() => setPlayed(true)}
          onDone={() => {
            setRevealing(false)
            setPlayed(true)
          }}
        />
      )}
      <div
        className={`result-screen pair-screen${played ? ' is-revealed' : ''}${revealing && !played ? ' is-veiled' : ''}`}
      >
      <p className="result-lead">
        {a.name} × {b.name}
      </p>
      <h2 className="screen-title pop-title">{t.pairResult.title}</h2>
      <div className="ornament" aria-hidden="true">
        ✦ ✦ ✦
      </div>

      <section className="pair-hero">
        <div className="pair-types">
          <div className="pair-type">
            <span className="pair-type-mascot" aria-hidden="true">
              <HoshiKyaraMascot sunElement={typeA.sunElement} moonElement={typeA.moonElement} size={62} />
            </span>
            <span className="pair-type-name">{typeA.type.name}</span>
            <span className="pair-type-person">{a.name}</span>
          </div>
          <div className="pair-x" aria-hidden="true">
            ×
          </div>
          <div className="pair-type">
            <span className="pair-type-mascot" aria-hidden="true">
              <HoshiKyaraMascot sunElement={typeB.sunElement} moonElement={typeB.moonElement} size={62} />
            </span>
            <span className="pair-type-name">{typeB.type.name}</span>
            <span className="pair-type-person">{b.name}</span>
          </div>
        </div>
        <p className="pair-percent">
          {t.pairResult.matchLabel} <strong>{compat.percent}</strong>
          <span className="pair-percent-unit">%</span>
        </p>
        <p className="pair-nickname">
          {compat.emoji} {compat.nickname}
        </p>
      </section>

      <section className="planet-card">
        <header className="planet-head">
          <div className="planet-symbol" aria-hidden="true">
            <SectionIcon name="breakdown" />
          </div>
          <div>
            <p className="planet-title">{t.pairResult.breakdownTitle}</p>
            <p className="planet-sub">{t.pairResult.breakdownSub}</p>
          </div>
        </header>
        <ul className="fortune-list">
          {compat.details.map((d) => (
            <li key={d.title} className={`fortune-item ${d.rel === 'spark' ? 'hard' : 'good'}`}>
              <p className="fortune-item-title">
                {d.title}
                <span className={`rel-badge rel-${d.rel}`}>{relLabel(d.rel)}</span>
              </p>
              <p className="fortune-item-text">{d.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="planet-card pair-today">
        <header className="planet-head">
          <div className="planet-symbol" aria-hidden="true">
            <SectionIcon name="today" />
          </div>
          <div>
            <p className="planet-title">{t.pairResult.todayTitle(periodLabel('today'))}</p>
            <p className="planet-sub">{t.pairResult.todaySub(fortuneA.plainSky)}</p>
          </div>
        </header>

        <div className="pair-tones">
          <div className="pair-tone">
            <p className="pair-tone-name">{a.name}</p>
            <span className="tone-badge">{fortuneA.toneLabel}</span>
            <p className="pair-tone-text">{fortuneA.items[0]?.text}</p>
          </div>
          <div className="pair-tone">
            <p className="pair-tone-name">{b.name}</p>
            <span className="tone-badge">{fortuneB.toneLabel}</span>
            <p className="pair-tone-text">{fortuneB.items[0]?.text}</p>
          </div>
        </div>

        <p className="pair-tip">{tip}</p>

        <div className="ask-ahead">
          <p className="ask-ahead-title">{t.pairResult.askAheadTitle}</p>
          <div className="ask-ahead-chips">
            {t.pairResult.askAhead.map((q) => (
              <button key={q.label} className="ask-ahead-chip" onClick={() => ask(q.q)}>
                {q.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <AiChat
        storageKey={`starflect-pairchat:${a.dateLabel}:${b.dateLabel}`}
        stream={(msgs, onDelta, l) => streamAiPairChat(pairChatContext, msgs, onDelta, l)}
        headerIcon={<SectionIcon name="pairReading" />}
        copy={t.pairChat}
        autoAsk={autoAsk}
      />

      {/*
        相性は構造的に相手を巻き込む(相手の生年月日を聞く＝会話が発生し、結果は「ふたりの話題」)。
        共有本文には個人名を入れない(公開SNSに他人の名前を出さないため)。キャラ名と%だけで語る。
      */}
      <ShareButtons
        heading={t.share.pairHeading}
        text={t.share.pairText(typeA.type.name, typeB.type.name, compat.percent, compat.nickname)}
        path="/pair"
        label="pair"
        params={{ a: slugOf(typeA), b: slugOf(typeB) }}
      />

      <Feedback page="pair" />

      {anyApprox && (
        <div className="upsell">
          <p>{t.pairResult.upsell}</p>
        </div>
      )}

      <div className="result-actions">
        <button className="cta cta-pop" onClick={onRetry}>
          {t.pairResult.retry}
        </button>
        <button className="ghost" onClick={onHome}>
          {t.pairResult.home}
        </button>
      </div>
      </div>
    </>
  )
}

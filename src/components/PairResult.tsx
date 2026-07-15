import { useEffect, useState } from 'react'
import type { PairData, PairPerson } from '../lib/compat'
import { compatOf, pairTip, relLabel } from '../lib/compat'
import { readFortune, periodNoun, periodLabel } from '../lib/fortune'
import { starTypeOf } from '../lib/startypes'
import { fetchAiPairReading } from '../lib/aiReading'
import { getPlanet } from '../lib/planets'
import { signName } from '../lib/signs'
import { signIndex } from '../lib/astro'
import { useLang } from '../lib/i18n'
import { useUI } from '../lib/ui'
import AiReading from './AiReading'
import HoshiKyaraMascot from './HoshiKyaraMascot'
import SectionIcon from './SectionIcon'
import Feedback from './Feedback'
import { track } from '../lib/analytics'

interface Props {
  data: PairData
  onRetry: () => void
  onHome: () => void
}

function personType(p: PairPerson) {
  const sun = p.planets.find((pp) => pp.key === 'sun')!
  const moon = p.planets.find((pp) => pp.key === 'moon')!
  return starTypeOf(sun.lon, moon.lon)
}

export default function PairResult({ data, onRetry, onHome }: Props) {
  const { lang } = useLang()
  const t = useUI()
  const { a, b } = data
  const typeA = personType(a)
  const typeB = personType(b)
  const compat = compatOf(a, b)

  const fortuneA = readFortune(a.planets, data.period)
  const fortuneB = readFortune(b.planets, data.period)
  const tip = pairTip(fortuneA.toneLevel, fortuneB.toneLevel, a.name, b.name)

  const anyApprox = a.approxTime || b.approxTime

  const [aiState, setAiState] = useState<
    { status: 'idle' } | { status: 'loading' } | { status: 'done'; text: string } | { status: 'error'; message: string }
  >({ status: 'idle' })

  useEffect(() => {
    track('pair_result')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleAiReading() {
    track('ai_pair_click')
    setAiState({ status: 'loading' })
    try {
      const natalOf = (p: PairPerson) =>
        p.planets.map((pp) => ({
          label: getPlanet(pp.key).name,
          sign: signName(signIndex(pp.lon)),
        }))
      const text = await fetchAiPairReading({
        nameA: a.name,
        nameB: b.name,
        typeA: typeA.type.name,
        typeB: typeB.type.name,
        percent: compat.percent,
        nickname: compat.nickname,
        details: compat.details.map((d) => `${d.title}: ${d.text}`),
        natalA: natalOf(a),
        natalB: natalOf(b),
        periodLabel: periodNoun(data.period),
        skyNote: fortuneA.skyNote,
        toneA: fortuneA.toneLabel,
        toneB: fortuneB.toneLabel,
        aspectsA: fortuneA.items.map((i) => i.title),
        aspectsB: fortuneB.items.map((i) => i.title),
        lang,
      })
      setAiState({ status: 'done', text })
    } catch (e) {
      setAiState({ status: 'error', message: e instanceof Error ? e.message : t.common.unknownError })
    }
  }

  return (
    <div className="result-screen pair-screen">
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
            <p className="planet-title">{t.pairResult.todayTitle(periodLabel(data.period))}</p>
            <p className="planet-sub">{t.pairResult.todaySub(fortuneA.skyNote)}</p>
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
      </section>

      <section className="planet-card ai-card">
        <header className="planet-head">
          <div className="planet-symbol" aria-hidden="true">
            <SectionIcon name="pairReading" />
          </div>
          <div>
            <p className="planet-title">{t.pairResult.aiTitle}</p>
            <p className="planet-sub">{t.pairResult.aiSub(a.name, b.name)}</p>
          </div>
        </header>

        {aiState.status === 'idle' && (
          <>
            <button className="cta" onClick={handleAiReading}>
              {t.pairResult.aiCta}
            </button>
            <p className="ai-note">{t.pairResult.aiNote}</p>
          </>
        )}

        {aiState.status === 'loading' && (
          <p className="ai-loading">
            <span className="ai-spinner" aria-hidden="true">
              ✦
            </span>
            {t.pairResult.aiLoading}
          </p>
        )}

        {aiState.status === 'done' && <AiReading text={aiState.text} />}

        {aiState.status === 'error' && (
          <>
            <p className="form-error">{aiState.message}</p>
            <button className="ghost" onClick={handleAiReading}>
              {t.common.tryAgain}
            </button>
          </>
        )}
      </section>

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
  )
}

import { useState } from 'react'
import type { PairData, PairPerson } from '../lib/compat'
import { compatOf, pairTip, REL_LABEL } from '../lib/compat'
import { readFortune, periodDef } from '../lib/fortune'
import { starTypeOf } from '../lib/startypes'
import { fetchAiPairReading } from '../lib/aiReading'
import { PLANET_INFO } from '../lib/planets'
import { SIGNS } from '../lib/signs'
import { signIndex } from '../lib/astro'

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
  const { a, b } = data
  const typeA = personType(a)
  const typeB = personType(b)
  const compat = compatOf(a, b)

  const period = periodDef(data.period)
  const fortuneA = readFortune(a.planets, data.period)
  const fortuneB = readFortune(b.planets, data.period)
  const tip = pairTip(fortuneA.toneLevel, fortuneB.toneLevel, a.name, b.name)

  const anyApprox = a.approxTime || b.approxTime

  const [aiState, setAiState] = useState<
    { status: 'idle' } | { status: 'loading' } | { status: 'done'; text: string } | { status: 'error'; message: string }
  >({ status: 'idle' })

  async function handleAiReading() {
    setAiState({ status: 'loading' })
    try {
      const natalOf = (p: PairPerson) =>
        p.planets.map((pp) => ({
          label: PLANET_INFO[pp.key].name,
          sign: SIGNS[signIndex(pp.lon)].name,
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
        periodLabel: period.noun,
        skyNote: fortuneA.skyNote,
        toneA: fortuneA.toneLabel,
        toneB: fortuneB.toneLabel,
        aspectsA: fortuneA.items.map((i) => i.title),
        aspectsB: fortuneB.items.map((i) => i.title),
      })
      setAiState({ status: 'done', text })
    } catch (e) {
      setAiState({ status: 'error', message: e instanceof Error ? e.message : '不明なエラー' })
    }
  }

  return (
    <div className="result-screen pair-screen">
      <p className="result-lead">
        {a.name} × {b.name}
      </p>
      <h2 className="screen-title pop-title">ふたりの相性</h2>
      <div className="ornament" aria-hidden="true">
        ✦ ✦ ✦
      </div>

      <section className="pair-hero">
        <div className="pair-types">
          <div className="pair-type">
            <span className="pair-type-emoji">{typeA.type.emoji}</span>
            <span className="pair-type-name">{typeA.type.name}</span>
            <span className="pair-type-person">{a.name}</span>
          </div>
          <div className="pair-x" aria-hidden="true">
            ×
          </div>
          <div className="pair-type">
            <span className="pair-type-emoji">{typeB.type.emoji}</span>
            <span className="pair-type-name">{typeB.type.name}</span>
            <span className="pair-type-person">{b.name}</span>
          </div>
        </div>
        <p className="pair-percent">
          相性 <strong>{compat.percent}</strong>
          <span className="pair-percent-unit">%</span>
        </p>
        <p className="pair-nickname">
          {compat.emoji} {compat.nickname}
        </p>
      </section>

      <section className="planet-card">
        <header className="planet-head">
          <div className="planet-symbol" aria-hidden="true">
            🔍
          </div>
          <div>
            <p className="planet-title">相性の内訳</p>
            <p className="planet-sub">太陽(表の顔)と月(心)、4つの組み合わせから</p>
          </div>
        </header>
        <ul className="fortune-list">
          {compat.details.map((d) => (
            <li key={d.title} className={`fortune-item ${d.rel === 'spark' ? 'hard' : 'good'}`}>
              <p className="fortune-item-title">
                {d.title}
                <span className={`rel-badge rel-${d.rel}`}>{REL_LABEL[d.rel]}</span>
              </p>
              <p className="fortune-item-text">{d.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="planet-card pair-today">
        <header className="planet-head">
          <div className="planet-symbol" aria-hidden="true">
            🗓️
          </div>
          <div>
            <p className="planet-title">{period.label}のふたり</p>
            <p className="planet-sub">{fortuneA.skyNote} — その星がふたりに吹かせる風は?</p>
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
            💌
          </div>
          <div>
            <p className="planet-title">AI占星術師のふたり鑑定</p>
            <p className="planet-sub">
              Claudeが{a.name}と{b.name}の星を読み解きます
            </p>
          </div>
        </header>

        {aiState.status === 'idle' && (
          <>
            <button className="cta" onClick={handleAiReading}>
              AIにふたりを詳しく占ってもらう
            </button>
            <p className="ai-note">
              上記の計算結果(星座・相性・角度)がAI(Claude API)に送信されます。鑑定には10〜30秒ほどかかります。
            </p>
          </>
        )}

        {aiState.status === 'loading' && (
          <p className="ai-loading">
            <span className="ai-spinner" aria-hidden="true">
              ✦
            </span>
            ふたりの星を読んでいます……(10〜30秒ほどお待ちください)
          </p>
        )}

        {aiState.status === 'done' && <p className="ai-text">{aiState.text}</p>}

        {aiState.status === 'error' && (
          <>
            <p className="form-error">{aiState.message}</p>
            <button className="ghost" onClick={handleAiReading}>
              もう一度試す
            </button>
          </>
        )}
      </section>

      {anyApprox && (
        <div className="upsell">
          <p>
            生まれた時刻が分かると月星座の精度が上がり、相性の判定もより正確になります(現在は正午で近似しています)。
          </p>
        </div>
      )}

      <div className="result-actions">
        <button className="cta cta-pop" onClick={onRetry}>
          条件を変えて占う
        </button>
        <button className="ghost" onClick={onHome}>
          モード選択に戻る
        </button>
      </div>
    </div>
  )
}

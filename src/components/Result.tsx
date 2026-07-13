import { useState } from 'react'
import type { ChartData, PlanetKey } from '../lib/types'
import { signIndex, degInSign } from '../lib/astro'
import { SIGNS } from '../lib/signs'
import { synthesize } from '../lib/synthesis'
import { readFortune, periodDef } from '../lib/fortune'
import { fetchAiReading } from '../lib/aiReading'
import { PLANET_INFO, signMannerOf } from '../lib/planets'
import { findNatalAspects } from '../lib/natalAspects'
import { starTypeOf, ELEMENT_WORD } from '../lib/startypes'
import AiChat from './AiChat'
import type { ChatChartContext } from '../lib/aiChat'
import PlanetMascot, { MASCOT_COLOR } from './PlanetMascot'

interface Props {
  data: ChartData
  onRetry: () => void
  onHome: () => void
}

export default function Result({ data, onRetry, onHome }: Props) {
  const who = data.name ? `${data.name}さん` : 'あなた'

  const lonOf = (key: PlanetKey) => data.planets.find((p) => p.key === key)?.lon
  const sunLon = lonOf('sun')
  const moonLon = lonOf('moon')
  const ascLon = lonOf('asc')
  const synthesis =
    sunLon !== undefined && moonLon !== undefined && ascLon !== undefined
      ? synthesize(sunLon, moonLon, ascLon)
      : null

  const period = periodDef(data.period)
  const fortune = readFortune(data.planets, data.period)

  // ほしキャラを構成するパーティ = 計算した全天体(太陽・月・上昇星座を先頭に)
  const partyPlanets = data.planets
  const starType = sunLon !== undefined && moonLon !== undefined ? starTypeOf(sunLon, moonLon) : null
  const natalAspects = findNatalAspects(data.planets)

  const [aiState, setAiState] = useState<
    { status: 'idle' } | { status: 'loading' } | { status: 'done'; text: string } | { status: 'error'; message: string }
  >({ status: 'idle' })

  async function handleAiReading() {
    setAiState({ status: 'loading' })
    try {
      const text = await fetchAiReading({
        name: data.name,
        periodLabel: period.noun,
        dateLabel: data.dateLabel,
        placeLabel: data.placeLabel,
        natal: data.planets.map((p) => ({
          label: PLANET_INFO[p.key].name + (p.retro ? '(逆行)' : ''),
          sign: SIGNS[signIndex(p.lon)].name,
          deg: degInSign(p.lon),
        })),
        synthesis: synthesis ? [synthesis.intro, synthesis.balance, synthesis.relation] : undefined,
        natalAspects: natalAspects.length ? natalAspects.map((a) => a.tech) : undefined,
        toneLabel: fortune.toneLabel,
        skyNote: fortune.skyNote,
        aspects: fortune.items.map((i) => i.title),
      })
      setAiState({ status: 'done', text })
    } catch (e) {
      setAiState({ status: 'error', message: e instanceof Error ? e.message : '不明なエラー' })
    }
  }

  // 相談チャットに渡すコンテキスト(鑑定済みならその文章も文脈に含める)
  const chatContext: ChatChartContext = {
    name: data.name,
    dateLabel: data.dateLabel,
    placeLabel: data.placeLabel,
    starTypeName: starType?.type.name,
    starTypeCopy: starType?.type.copy,
    planets: data.planets.map((p) => ({
      label: PLANET_INFO[p.key].name,
      sign: SIGNS[signIndex(p.lon)].name,
      deg: degInSign(p.lon),
      retro: p.retro,
    })),
    natalAspects: natalAspects.length ? natalAspects.map((a) => a.tech) : undefined,
    periodLabel: period.noun,
    skyNote: fortune.skyNote,
    toneLabel: fortune.toneLabel,
    transits: fortune.items.map((i) => i.title),
    reading: aiState.status === 'done' ? aiState.text : undefined,
  }
  const chatStorageKey = `starflect-chat:${data.dateLabel}:${data.name}`

  return (
    <div className="result-screen">
      <p className="result-lead">{data.dateLabel} 生まれ</p>
      {data.placeLabel && <p className="result-place">{data.placeLabel}</p>}
      <h2 className="screen-title">{who}のほしキャラ</h2>
      <div className="ornament" aria-hidden="true">
        ✦ ✦ ✦
      </div>

      {starType && (
        <section className="type-card">
          <div className="type-emoji" aria-hidden="true">
            {starType.type.emoji}
          </div>
          <h3 className="type-name">{starType.type.name}</h3>
          <p className="type-copy">{starType.type.copy}</p>
          <p className="type-text">{starType.type.text}</p>
          {synthesis && (
            <div className="type-synth">
              <p className="type-synth-label">✦ もっと詳しく、あなたのほしキャラ ✦</p>
              <p className="type-text">{synthesis.intro}</p>
              <p className="type-text">{synthesis.balance}</p>
              <p className="type-text">{synthesis.relation}</p>
            </div>
          )}
          <div className="type-formula">
            <div className="type-formula-side">
              <PlanetMascot planetKey="sun" size={42} />
              <span>
                表の顔
                <br />
                {starType.sunElement}の{ELEMENT_WORD[starType.sunElement]}
              </span>
            </div>
            <span className="type-formula-x" aria-hidden="true">
              ×
            </span>
            <div className="type-formula-side">
              <PlanetMascot planetKey="moon" size={42} />
              <span>
                心の中
                <br />
                {starType.moonElement}の{ELEMENT_WORD[starType.moonElement]}
              </span>
            </div>
          </div>
          <p className="type-count">この組み合わせで、全16キャラ</p>
        </section>
      )}

      <section className="party-card">
        <div className="party-head">
          <p className="party-title">ほしキャラを構成するパーティ</p>
          <p className="party-sub">
            生まれた瞬間の星たちが、あなたを動かすキャラになりました。担当と、いまの発揮のしかたです
          </p>
        </div>
        <ul className="party-list">
          {partyPlanets.map((p) => {
            const info = PLANET_INFO[p.key]
            const sign = SIGNS[signIndex(p.lon)]
            const color = MASCOT_COLOR[p.key]
            return (
              <li
                key={p.key}
                className="party-row"
                style={{ background: `${color}14`, borderColor: `${color}44` }}
              >
                <div className="party-row-av" style={{ background: `${color}2e` }}>
                  <PlanetMascot planetKey={p.key} size={58} />
                </div>
                <div className="party-row-body">
                  <p className="party-row-top">
                    <span className="party-row-class">{info.role}</span>
                    <span className="party-row-planet">
                      {info.symbol} {info.name}
                    </span>
                    {p.retro && <span className="retro-badge">℞</span>}
                    {info.generational && <span className="gen-badge">世代</span>}
                  </p>
                  <span className="party-row-sign">
                    {sign.symbol} {sign.name} {degInSign(p.lon).toFixed(1)}°
                  </span>
                  <dl className="party-facts">
                    <div>
                      <dt>担当</dt>
                      <dd>{info.domain}</dd>
                    </div>
                    <div>
                      <dt>クセ</dt>
                      <dd>「{signMannerOf(p.lon)}」</dd>
                    </div>
                  </dl>
                </div>
              </li>
            )
          })}
        </ul>
        <p className="party-foot">「世代」= 動きがゆっくりで、同世代に共通する時代の空気も映す天体です</p>
      </section>

      <section className="planet-card fortune-card">
        <header className="planet-head">
          <div className="planet-symbol" aria-hidden="true">
            ☄
          </div>
          <div>
            <p className="planet-title">
              {period.label}の運勢
              <span className="planet-deg">{fortune.skyNote}</span>
            </p>
            <p className="planet-sub">いまの星の運行と{who}のほしキャラから読んでいます</p>
          </div>
        </header>
        <p className="fortune-tone">
          <span className="tone-badge">{fortune.toneLabel}</span>
          {fortune.toneText}
        </p>
        <ul className="fortune-list">
          {fortune.items.map((item) => (
            <li key={item.title} className={`fortune-item ${item.quality}`}>
              <p className="fortune-item-title">
                <span className="fortune-symbol" aria-hidden="true">
                  {item.symbol}
                </span>
                {item.title}
              </p>
              <p className="fortune-item-text">{item.text}</p>
            </li>
          ))}
        </ul>
        <p className="sign-foot">
          {period.noun}の空をゆく星々と、生まれた瞬間の星の配置との角度をもとにしています。
        </p>
      </section>

      <section className="planet-card ai-card">
        <header className="planet-head">
          <div className="planet-symbol" aria-hidden="true">
            ✶
          </div>
          <div>
            <p className="planet-title">AI占星術師の詳しいほしキャラ鑑定</p>
            <p className="planet-sub">AIが{who}のチャートと星の運行を読み解きます</p>
          </div>
        </header>

        {aiState.status === 'idle' && (
          <>
            <button className="cta" onClick={handleAiReading}>
              AIに詳しく占ってもらう
            </button>
            <p className="ai-note">
              上記の計算結果(星座・角度)がAIに送信されます。鑑定には10〜30秒ほどかかります。
            </p>
          </>
        )}

        {aiState.status === 'loading' && (
          <p className="ai-loading">
            <span className="ai-spinner" aria-hidden="true">
              ✦
            </span>
            星を読んでいます……(10〜30秒ほどお待ちください)
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

      <AiChat context={chatContext} storageKey={chatStorageKey} />

      {ascLon === undefined && (
        <div className="upsell">
          <p>
            生まれた<strong>時刻</strong>が分かると、<strong>上昇星座</strong>
            と3天体の総合分析まで占えます(月星座の精度も上がります)。母子手帳をチェックしてみて。
          </p>
        </div>
      )}

      <div className="result-actions">
        <button className="cta" onClick={onRetry}>
          もう一度占う
        </button>
        <button className="ghost" onClick={onHome}>
          モード選択に戻る
        </button>
      </div>
    </div>
  )
}

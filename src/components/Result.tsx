import { useState } from 'react'
import type { ChartData, PlanetKey } from '../lib/types'
import { signIndex, degInSign } from '../lib/astro'
import { SIGNS, ELEMENT_NOTE } from '../lib/signs'
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

/** フルカードで表示する主要3天体(星座ごとの詳細文があるもの) */
type CoreKey = 'sun' | 'moon' | 'asc'

const PLANET_META: Record<CoreKey, { title: string; sub: string }> = {
  sun: { title: '太陽星座', sub: 'あなたの基本性格・人生の方向性' },
  moon: { title: '月星座', sub: '素顔の感情・心が安らぐもの' },
  asc: { title: '上昇星座', sub: '第一印象・生まれ持った雰囲気' },
}

const isCoreKey = (key: PlanetKey): key is CoreKey => key === 'sun' || key === 'moon' || key === 'asc'

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

  const corePlanets = data.planets.filter((p) => isCoreKey(p.key))
  // 星のパーティ = 上昇星座を除く10天体(それぞれにマスコットあり)
  const partyPlanets = data.planets.filter((p) => p.key !== 'asc')
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
      <h2 className="screen-title">{who}の星</h2>
      <div className="ornament" aria-hidden="true">
        ✦ ✦ ✦
      </div>

      {starType && (
        <section className="type-card">
          <p className="type-eyebrow">✦ あなたのほしキャラ ✦</p>
          <div className="type-emoji" aria-hidden="true">
            {starType.type.emoji}
          </div>
          <h3 className="type-name">{starType.type.name}</h3>
          <p className="type-copy">{starType.type.copy}</p>
          <p className="type-text">{starType.type.text}</p>
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

      {corePlanets.map((p) => {
        if (!isCoreKey(p.key)) return null
        const coreKey = p.key
        const idx = signIndex(p.lon)
        const sign = SIGNS[idx]
        const meta = PLANET_META[coreKey]
        const deg = degInSign(p.lon)
        return (
          <section key={p.key} className="planet-card">
            <header className="planet-head">
              <div
                className="planet-symbol planet-symbol-char"
                style={{ background: `${MASCOT_COLOR[coreKey]}2e` }}
                aria-hidden="true"
              >
                <PlanetMascot planetKey={coreKey} size={48} />
              </div>
              <div>
                <p className="planet-title">
                  {meta.title}
                  <span className="planet-deg">
                    {sign.name} {deg.toFixed(1)}°
                  </span>
                </p>
                <p className="planet-sub">{meta.sub}</p>
              </div>
            </header>
            <h3 className="sign-name">{sign.name}</h3>
            <div className="keyword-row">
              {sign.keywords.map((k) => (
                <span key={k} className="keyword">
                  {k}
                </span>
              ))}
            </div>
            <p className="sign-text">{sign[coreKey]}</p>
            <p className="sign-foot">
              {sign.element}の星座 — {ELEMENT_NOTE[sign.element]} ／ 支配星: {sign.ruler}
            </p>
          </section>
        )
      })}

      {synthesis && (
        <section className="planet-card synth-card">
          <header className="planet-head">
            <div className="planet-symbol" aria-hidden="true">
              ✧
            </div>
            <div>
              <p className="planet-title">3天体を総合的に見たとき</p>
              <p className="planet-sub">太陽 × 月 × 上昇星座が描く、{who}の全体像</p>
            </div>
          </header>
          <p className="sign-text">{synthesis.intro}</p>
          <p className="sign-text">{synthesis.balance}</p>
          <p className="sign-text synth-last">{synthesis.relation}</p>
        </section>
      )}

      <section className="party-card">
        <div className="party-head">
          <p className="party-title">あなたの星のパーティ</p>
          <p className="party-sub">10の星が、あなたを動かす10人のキャラです</p>
        </div>
        <div className="party-grid">
          {partyPlanets.map((p) => {
            const info = PLANET_INFO[p.key]
            const sign = SIGNS[signIndex(p.lon)]
            const color = MASCOT_COLOR[p.key]
            return (
              <div
                key={p.key}
                className="party-member"
                style={{ background: `${color}18`, borderColor: `${color}55` }}
              >
                <div className="party-avatar" style={{ background: `${color}2e` }}>
                  <PlanetMascot planetKey={p.key} size={54} />
                </div>
                <p className="party-class">{info.role}</p>
                <p className="party-planet">
                  {info.symbol} {info.name}
                </p>
                <div className="party-chips">
                  <span className="party-sign">
                    {sign.symbol} {sign.name}
                  </span>
                  {p.retro && <span className="retro-badge">℞</span>}
                </div>
              </div>
            )
          })}
        </div>
        <p className="party-foot">タップで各キャラの詳しいステータスは下の「もっと深く見る」へ</p>
      </section>

      <details className="deep-details">
        <summary className="deep-summary">
          <span className="deep-summary-icon" aria-hidden="true">
            🔭
          </span>
          もっと深く見る — キャラの詳しいステータス
          <span className="deep-summary-hint">タップで展開</span>
        </summary>
        <div className="deep-body">
          <p className="deep-lead">
            ほしキャラはあなたの「メインキャラ」。でも生まれた瞬間の空には10個の天体があり、それぞれがあなたの中の別のキャラを担当しています。ここから先は、その全員のプロフィールです。
          </p>

          <section className="planet-card chart-card">
            <header className="planet-head">
              <div className="planet-symbol" aria-hidden="true">
                ✵
              </div>
              <div>
                <p className="planet-title">天体配置表</p>
                <p className="planet-sub">生まれた瞬間の星の配置(℞は逆行)</p>
              </div>
            </header>
            <table className="chart-table">
              <tbody>
                {data.planets.map((p) => {
                  const info = PLANET_INFO[p.key]
                  const sign = SIGNS[signIndex(p.lon)]
                  return (
                    <tr key={p.key}>
                      <td className="chart-symbol">{info.symbol}</td>
                      <td className="chart-planet">{info.name}</td>
                      <td className="chart-sign">
                        {sign.symbol} {sign.name}
                      </td>
                      <td className="chart-deg">{degInSign(p.lon).toFixed(1)}°</td>
                      <td className="chart-retro">{p.retro ? <span className="retro-badge">℞ 逆行</span> : ''}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>

          {partyPlanets.length > 0 && (
            <section className="planet-card">
              <header className="planet-head">
                <div className="planet-symbol" aria-hidden="true">
                  ✦
                </div>
                <div>
                  <p className="planet-title">パーティ全員の詳しいステータス</p>
                  <p className="planet-sub">10キャラそれぞれの担当と、いまの発揮のしかた</p>
                </div>
              </header>
              <ul className="minor-planet-list">
                {partyPlanets.map((p) => {
                  const info = PLANET_INFO[p.key]
                  const sign = SIGNS[signIndex(p.lon)]
                  return (
                    <li key={p.key} className="minor-planet">
                      <div className="minor-head">
                        <p className="minor-role">
                          あなたの{info.role}
                          <span className="minor-planet-name">
                            〈{info.symbol} {info.name}〉
                          </span>
                        </p>
                        <div className="minor-chips">
                          <span className="sign-chip">
                            {sign.symbol} {sign.name} {degInSign(p.lon).toFixed(1)}°
                          </span>
                          {p.retro && <span className="retro-badge">℞</span>}
                          {info.generational && <span className="gen-badge">世代</span>}
                        </div>
                      </div>
                      <dl className="minor-facts">
                        <div>
                          <dt>担当</dt>
                          <dd>{info.domain}</dd>
                        </div>
                        <div>
                          <dt>やり方</dt>
                          <dd>「{signMannerOf(p.lon)}」</dd>
                        </div>
                      </dl>
                    </li>
                  )
                })}
              </ul>
              <p className="sign-foot">
                「世代」マークの天体は動きがゆっくりで、同世代に共通する時代の空気も映します。
              </p>
            </section>
          )}

        </div>
      </details>

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
            <p className="planet-sub">いまの星の運行と{who}の星との角度から読んでいます</p>
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
          {period.noun}の空をゆく星々と、生まれた瞬間の星の配置との実際の角度(アスペクト)をもとにしています。
        </p>
      </section>

      <section className="planet-card ai-card">
        <header className="planet-head">
          <div className="planet-symbol" aria-hidden="true">
            ✶
          </div>
          <div>
            <p className="planet-title">AI占星術師の詳しい鑑定</p>
            <p className="planet-sub">Claudeが{who}のチャートと星の運行を読み解きます</p>
          </div>
        </header>

        {aiState.status === 'idle' && (
          <>
            <button className="cta" onClick={handleAiReading}>
              AIに詳しく占ってもらう
            </button>
            <p className="ai-note">
              上記の計算結果(星座・角度)がAI(Claude API)に送信されます。鑑定には10〜30秒ほどかかります。
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

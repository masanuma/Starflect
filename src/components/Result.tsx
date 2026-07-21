import { useEffect, useState } from 'react'
import type { ChartData, PlanetKey } from '../lib/types'
import { signIndex, degInSign } from '../lib/astro'
import { signName, signSymbol } from '../lib/signs'
import { synthesize } from '../lib/synthesis'
import { readFortune, periodNoun } from '../lib/fortune'
import { fetchAiReading } from '../lib/aiReading'
import { getPlanet, signMannerOf } from '../lib/planets'
import { findNatalAspects } from '../lib/natalAspects'
import { starTypeOf, elementPhrase } from '../lib/startypes'
import AiChat from './AiChat'
import AiReading from './AiReading'
import StarReading from './StarReading'
import Feedback from './Feedback'
import { createCompanion } from '../lib/companion'
import type { ChatChartContext } from '../lib/aiChat'
import PlanetMascot, { MASCOT_COLOR } from './PlanetMascot'
import HoshiKyaraMascot from './HoshiKyaraMascot'
import SectionIcon from './SectionIcon'
import { useLang } from '../lib/i18n'
import { useUI } from '../lib/ui'
import { track } from '../lib/analytics'

const RETRO_SUFFIX: Record<string, string> = {
  ja: '(逆行)',
  en: '(retrograde)',
  es: '(retrógrado)',
  fr: '(rétrograde)',
  it: '(retrogrado)',
  pt: '(retrógrado)',
  ko: '(역행)',
}

const ELEMENT_SLUG: Record<string, string> = { 火: 'fire', 地: 'earth', 風: 'air', 水: 'water' }

interface Props {
  data: ChartData
  onHome: () => void
}

export default function Result({ data, onHome }: Props) {
  const { lang } = useLang()
  const t = useUI()
  const retroSuffix = RETRO_SUFFIX[lang] ?? RETRO_SUFFIX.ja

  const lonOf = (key: PlanetKey) => data.planets.find((p) => p.key === key)?.lon
  const sunLon = lonOf('sun')
  const moonLon = lonOf('moon')
  const ascLon = lonOf('asc')
  const synthesis =
    sunLon !== undefined && moonLon !== undefined && ascLon !== undefined
      ? synthesize(sunLon, moonLon, ascLon)
      : null

  const fortune = readFortune(data.planets, data.period)

  // ほしキャラを構成するパーティ = 計算した全天体(太陽・月・上昇星座を先頭に)
  const partyPlanets = data.planets
  const starType = sunLon !== undefined && moonLon !== undefined ? starTypeOf(sunLon, moonLon) : null
  const natalAspects = findNatalAspects(data.planets)

  const [aiState, setAiState] = useState<
    { status: 'idle' } | { status: 'loading' } | { status: 'done'; text: string } | { status: 'error'; message: string }
  >({ status: 'idle' })

  const starSlug = starType
    ? `${ELEMENT_SLUG[starType.sunElement]}_${ELEMENT_SLUG[starType.moonElement]}`
    : undefined

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

  async function handleAiReading() {
    track('ai_reading_click')
    setAiState({ status: 'loading' })
    try {
      const text = await fetchAiReading({
        name: data.name,
        periodLabel: periodNoun(data.period),
        dateLabel: data.dateLabel,
        placeLabel: data.placeLabel,
        natal: data.planets.map((p) => ({
          label: getPlanet(p.key).name + (p.retro ? retroSuffix : ''),
          sign: signName(signIndex(p.lon)),
          deg: degInSign(p.lon),
        })),
        synthesis: synthesis ? [synthesis.intro, synthesis.balance, synthesis.relation] : undefined,
        natalAspects: natalAspects.length ? natalAspects.map((a) => a.tech) : undefined,
        toneLabel: fortune.toneLabel,
        skyNote: fortune.skyNote,
        aspects: fortune.items.map((i) => i.title),
        lang,
      })
      setAiState({ status: 'done', text })
    } catch (e) {
      setAiState({ status: 'error', message: e instanceof Error ? e.message : t.common.unknownError })
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
      label: getPlanet(p.key).name,
      sign: signName(signIndex(p.lon)),
      deg: degInSign(p.lon),
      retro: p.retro,
    })),
    natalAspects: natalAspects.length ? natalAspects.map((a) => a.tech) : undefined,
    periodLabel: periodNoun(data.period),
    skyNote: fortune.skyNote,
    toneLabel: fortune.toneLabel,
    transits: fortune.items.map((i) => i.title),
    reading: aiState.status === 'done' ? aiState.text : undefined,
  }
  const chatStorageKey = `starflect-chat:${data.dateLabel}:${data.name}`

  return (
    <div className="result-screen">
      <p className="result-lead">{t.result.born(data.dateLabel)}</p>
      {data.placeLabel && <p className="result-place">{data.placeLabel}</p>}
      <h2 className="screen-title">{t.result.title(data.name ?? '')}</h2>
      <div className="ornament" aria-hidden="true">
        ✦ ✦ ✦
      </div>

      {starType && (
        <section className="type-card">
          <div className="type-mascot" aria-hidden="true">
            <HoshiKyaraMascot sunElement={starType.sunElement} moonElement={starType.moonElement} size={96} />
          </div>
          <h3 className="type-name">{starType.type.name}</h3>
          <p className="type-copy">{starType.type.copy}</p>
          <p className="type-text">{starType.type.text}</p>
          {synthesis && (
            <div className="type-synth">
              <p className="type-synth-label">{t.result.synthLabel}</p>
              <p className="type-text">{synthesis.intro}</p>
              <p className="type-text">{synthesis.balance}</p>
              <p className="type-text">{synthesis.relation}</p>
            </div>
          )}
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
        </section>
      )}

      <section className="party-card">
        <div className="party-head">
          <p className="party-title">{t.result.partyTitle}</p>
          <p className="party-sub">{t.result.partySub}</p>
        </div>
        <ul className="party-list">
          {partyPlanets.map((p) => {
            const info = getPlanet(p.key)
            const si = signIndex(p.lon)
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
                    {info.generational && <span className="gen-badge">{t.result.genBadge}</span>}
                  </p>
                  <span className="party-row-sign">
                    {signSymbol(si)} {signName(si)} {degInSign(p.lon).toFixed(1)}°
                  </span>
                  <dl className="party-facts">
                    <div>
                      <dt>{t.result.domain}</dt>
                      <dd>{info.domain}</dd>
                    </div>
                    <div>
                      <dt>{t.result.quirk}</dt>
                      <dd>{lang === 'ja' ? `「${signMannerOf(p.lon)}」` : signMannerOf(p.lon)}</dd>
                    </div>
                  </dl>
                </div>
              </li>
            )
          })}
        </ul>
        <p className="party-foot">{t.result.partyFoot}</p>
      </section>

      <StarReading chart={data} starName={starType?.type.name ?? ''} />

      <section className="planet-card ai-card">
        <header className="planet-head">
          <div className="planet-symbol" aria-hidden="true">
            <SectionIcon name="reading" />
          </div>
          <div>
            <p className="planet-title">{t.result.aiTitle}</p>
            <p className="planet-sub">{t.result.aiSub(data.name ?? '')}</p>
          </div>
        </header>

        {aiState.status === 'idle' && (
          <>
            <button className="cta" onClick={handleAiReading}>
              {t.result.aiCta}
            </button>
            <p className="ai-note">{t.result.aiNote}</p>
          </>
        )}

        {aiState.status === 'loading' && (
          <p className="ai-loading">
            <span className="ai-spinner" aria-hidden="true">
              ✦
            </span>
            {t.result.aiLoading}
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

      <AiChat context={chatContext} storageKey={chatStorageKey} />

      <Feedback page="result" starType={starSlug} />

      {ascLon === undefined && (
        <div className="upsell">
          <p>{t.result.upsell}</p>
        </div>
      )}

      <div className="adopt-card">
        <p className="adopt-lead">{t.result.adoptLead}</p>
        <p className="adopt-promise">{t.companion.seeYouTomorrow}</p>
      </div>

      <div className="result-actions">
        <button className="ghost" onClick={onHome}>
          {t.companion.otherPerson}
        </button>
      </div>
    </div>
  )
}

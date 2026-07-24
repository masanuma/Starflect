import { useEffect } from 'react'
import type { ChartData, PlanetKey } from '../lib/types'
import { synthesize } from '../lib/synthesis'
import { starTypeOf, elementPhrase } from '../lib/startypes'
import AiChat from './AiChat'
import StarReading from './StarReading'
import PartyCard from './PartyCard'
import ShareButtons from './ShareButtons'
import Feedback from './Feedback'
import { createCompanion } from '../lib/companion'
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
          <h3 className="type-name">{quoted(starType.type.name)}</h3>
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

      {starType && <ShareButtons starTypeName={quoted(starType.type.name)} starSlug={starSlug} />}

      <PartyCard data={data} />

      <StarReading chart={data} />

      <AiChat context={chatContext} storageKey={chatStorageKey(data)} chart={data} />

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
  )
}

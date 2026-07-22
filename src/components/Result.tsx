import { useEffect, useState } from 'react'
import type { ChartData, PlanetKey } from '../lib/types'
import { signIndex, degInSign } from '../lib/astro'
import { signName, signSymbol } from '../lib/signs'
import { synthesize } from '../lib/synthesis'
import { getPlanet, signMannerOf } from '../lib/planets'
import { starTypeOf, elementPhrase } from '../lib/startypes'
import AiChat from './AiChat'
import StarReading from './StarReading'
import Feedback from './Feedback'
import { createCompanion } from '../lib/companion'
import { buildChatContext, chatStorageKey } from '../lib/aiChat'
import PlanetMascot, { MASCOT_COLOR } from './PlanetMascot'
import HoshiKyaraMascot from './HoshiKyaraMascot'
import { useLang } from '../lib/i18n'
import { useUI, quoted } from '../lib/ui'
import { track } from '../lib/analytics'

const ELEMENT_SLUG: Record<string, string> = { 火: 'fire', 地: 'earth', 風: 'air', 水: 'water' }

interface Props {
  data: ChartData
  onHome: () => void
  onPair: () => void
}

export default function Result({ data, onHome, onPair }: Props) {
  const { lang } = useLang()
  const t = useUI()

  const lonOf = (key: PlanetKey) => data.planets.find((p) => p.key === key)?.lon
  const sunLon = lonOf('sun')
  const moonLon = lonOf('moon')
  const ascLon = lonOf('asc')
  const synthesis =
    sunLon !== undefined && moonLon !== undefined && ascLon !== undefined
      ? synthesize(sunLon, moonLon, ascLon)
      : null

  // ほしキャラを構成するパーティ = 計算した全天体(太陽・月・上昇星座を先頭に)
  const partyPlanets = data.planets
  // 上昇星座までを表示し、残りは畳む(長すぎるため)。時刻なしで asc が無いときは 太陽・月 まで
  const hasAsc = partyPlanets.some((p) => p.key === 'asc')
  const partyShown = hasAsc ? 3 : 2
  const [showAllParty, setShowAllParty] = useState(false)
  const visibleParty = showAllParty ? partyPlanets : partyPlanets.slice(0, partyShown)
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

      <section className="party-card">
        <div className="card-head">
          {starType && (
            <div className="card-head-icon" aria-hidden="true">
              <HoshiKyaraMascot sunElement={starType.sunElement} moonElement={starType.moonElement} size={52} />
            </div>
          )}
          <div>
            <p className="card-title">{t.result.partyTitle(partyPlanets.length)}</p>
            <p className="card-sub">{t.result.partySub}</p>
          </div>
        </div>
        <ul className="party-list">
          {visibleParty.map((p) => {
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
                  {(() => {
                    const parts = t.result.roleSign(info.role, info.name, signName(si), p.key === 'asc')
                    return (
                      <p className="party-row-headline">
                        <span className="ph-role" style={{ color }}>
                          {/* 上昇星座の記号「ASC」は一般的でないので出さない */}
                          {p.key !== 'asc' && `${info.symbol} `}
                          {parts.role}
                        </span>
                        <span className="ph-sep">{parts.sep1}</span>
                        <span className="ph-planet">{parts.planetLabel}</span>
                        <span className="ph-sep">{parts.sep2}</span>
                        <span className="ph-sign">
                          {signSymbol(si)} {parts.sign}
                        </span>
                        <span className="ph-deg">{degInSign(p.lon).toFixed(1)}°</span>
                        {p.retro && <span className="retro-badge">{t.result.retro}</span>}
                      </p>
                    )
                  })()}
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
        {partyPlanets.length > partyShown && (
          <button
            className={`party-toggle${showAllParty ? ' open' : ''}`}
            onClick={() => setShowAllParty((v) => !v)}
          >
            {showAllParty ? t.result.partyLess : t.result.partyMore(partyPlanets.length - partyShown)}
          </button>
        )}
      </section>

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

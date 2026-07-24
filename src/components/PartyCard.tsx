import { useState } from 'react'
import type { ChartData } from '../lib/types'
import { signIndex, degInSign } from '../lib/astro'
import { signName, signSymbol } from '../lib/signs'
import { getPlanet, signMannerOf } from '../lib/planets'
import { starTypeOf } from '../lib/startypes'
import PlanetMascot, { MASCOT_COLOR } from './PlanetMascot'
import HoshiKyaraMascot from './HoshiKyaraMascot'
import { useLang } from '../lib/i18n'
import { useUI } from '../lib/ui'

interface Props {
  data: ChartData
  /** 完全に畳んだ状態から始める(相棒ホーム用: 見出しだけ表示し、タップで全員を開く) */
  collapsedByDefault?: boolean
}

/**
 * ほしキャラを構成する10天体パーティ。結果画面と相棒ホームの両方で使う共有部品。
 * data.planets(太陽・月・上昇星座を先頭に全天体)を表示。
 * - 既定(結果画面): 先頭3件を表示し、残りを開閉。
 * - collapsedByDefault(相棒ホーム): 見出しだけで畳んでおき、タップで全員を開く。
 */
export default function PartyCard({ data, collapsedByDefault = false }: Props) {
  const { lang } = useLang()
  const t = useUI()

  const partyPlanets = data.planets
  const hasAsc = partyPlanets.some((p) => p.key === 'asc')
  const partyShown = hasAsc ? 3 : 2
  const [showAllParty, setShowAllParty] = useState(false)
  const visibleParty = collapsedByDefault
    ? showAllParty
      ? partyPlanets
      : []
    : showAllParty
      ? partyPlanets
      : partyPlanets.slice(0, partyShown)

  const sunLon = partyPlanets.find((p) => p.key === 'sun')?.lon
  const moonLon = partyPlanets.find((p) => p.key === 'moon')?.lon
  const starType = sunLon !== undefined && moonLon !== undefined ? starTypeOf(sunLon, moonLon) : null

  return (
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
      {visibleParty.length > 0 && (
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
      )}
      {collapsedByDefault ? (
        <button
          className={`party-toggle${showAllParty ? ' open' : ''}`}
          onClick={() => setShowAllParty((v) => !v)}
        >
          {showAllParty ? t.result.partyLess : t.result.partyReveal(partyPlanets.length)}
        </button>
      ) : (
        partyPlanets.length > partyShown && (
          <button
            className={`party-toggle${showAllParty ? ' open' : ''}`}
            onClick={() => setShowAllParty((v) => !v)}
          >
            {showAllParty ? t.result.partyLess : t.result.partyMore(partyPlanets.length - partyShown)}
          </button>
        )
      )}
    </section>
  )
}

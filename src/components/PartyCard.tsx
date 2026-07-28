import { useState } from 'react'
import type { ChartData, PlanetKey, PlanetPos } from '../lib/types'
import { signIndex, degInSign } from '../lib/astro'
import { signName, signSymbol } from '../lib/signs'
import { getPlanet, signMannerOf } from '../lib/planets'
import { starTypeOf } from '../lib/startypes'
import PlanetMascot, { MASCOT_COLOR } from './PlanetMascot'
import HoshiKyaraMascot from './HoshiKyaraMascot'
import { getLang } from '../lib/i18n'
import { useUI } from '../lib/ui'

interface Props {
  data: ChartData
  /** 完全に畳んだ状態から始める(相棒ホーム用: 見出しだけ表示し、タップで全員を開く) */
  collapsedByDefault?: boolean
}

/**
 * あなたをかたちづくる11のかけらぼし(10天体＋上昇星座)。結果画面と相棒ホームの両方で使う共有部品。
 * data.planets(太陽・月・上昇星座を先頭に全天体)を表示。
 * - 既定(結果画面): 先頭3件を表示し、残りを開閉。
 * - collapsedByDefault(相棒ホーム): 見出しだけで畳んでおき、タップで全員を開く。
 */
export default function PartyCard({ data, collapsedByDefault = false }: Props) {
  // 言語切替の再描画は useUI() が内部で useLang() を呼ぶことで担保される
  const t = useUI()

  const partyPlanets = data.planets
  const [showAllParty, setShowAllParty] = useState(false)
  const byKey = (k: PlanetKey) => partyPlanets.find((p) => p.key === k)

  // 説明ページ /stars と同じ並び。太陽を先頭に置き、自分→周り→時代とズームアウトする
  const sun = byKey('sun')
  const GROUPS: { title: string; keys: PlanetKey[] }[] = [
    { title: t.result.partyGroup1, keys: ['moon', 'asc', 'mercury', 'venus', 'mars'] },
    { title: t.result.partyGroup2, keys: ['jupiter', 'saturn'] },
    { title: t.result.partyGroup3, keys: ['uranus', 'neptune', 'pluto'] },
  ]
  // 時刻不明だと上昇星座が無いので、実在する天体だけに絞る
  const groups = GROUPS.map((g) => ({ ...g, planets: g.keys.map(byKey).filter((p) => p !== undefined) }))
  // 畳んでいる間は「毎日のあなた担当」まで。グループの途中で切らない
  const openCount = collapsedByDefault && !showAllParty ? 0 : showAllParty ? groups.length : 1
  const hiddenCount = groups.slice(openCount).reduce((n, g) => n + g.planets.length, 0)
  const showSun = !(collapsedByDefault && !showAllParty)

  const sunLon = partyPlanets.find((p) => p.key === 'sun')?.lon
  const moonLon = partyPlanets.find((p) => p.key === 'moon')?.lon
  const starType = sunLon !== undefined && moonLon !== undefined ? starTypeOf(sunLon, moonLon) : null

  function row(p: PlanetPos) {
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
                    <dd>{signMannerOf(p.lon)}</dd>
                  </div>
                </dl>
              </div>
            </li>
          )
          }

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
      {showSun && sun && <ul className="party-list">{row(sun)}</ul>}

      {groups.slice(0, openCount).map((g) => (
        <div key={g.title} className="party-group">
          <p className="party-group-title">{g.title}</p>
          <ul className="party-list">{g.planets.map(row)}</ul>
        </div>
      ))}
      {collapsedByDefault ? (
        <button
          className={`party-toggle${showAllParty ? ' open' : ''}`}
          onClick={() => setShowAllParty((v) => !v)}
        >
          {showAllParty ? t.result.partyLess : t.result.partyReveal(partyPlanets.length)}
        </button>
      ) : (
        hiddenCount > 0 && (
          <button
            className={`party-toggle${showAllParty ? ' open' : ''}`}
            onClick={() => setShowAllParty((v) => !v)}
          >
            {showAllParty ? t.result.partyLess : t.result.partyMore(hiddenCount)}
          </button>
        )
      )}

      {/* 天体や星座の用語が急に出てくるので、説明ページ(静的・別ページ)へ逃がす */}
      <a className="party-learn" href={`${getLang() === 'ja' ? '' : `/${getLang()}`}/stars`}>
        {t.result.partyLearn} →
      </a>
    </section>
  )
}

import { useState } from 'react'
import type { ChartData, PlanetKey } from '../lib/types'
import { signIndex } from '../lib/astro'
import { signName } from '../lib/signs'
import { signMannerOf } from '../lib/planets'
import { mapProgress } from '../lib/companion'
import { useUI, quoted } from '../lib/ui'

interface Props {
  /** 現在の累計シグナル(=地図の通貨)。使うほど増え、減らない */
  signals: number
  /** 月星座の裏側などを組み立てるためのチャート */
  chart: ChartData
  /** ほしキャラ名(括弧なしの生の名前。表示時に言語別の括弧を付ける) */
  starName: string
}

/**
 * ごほうび地図(縦ロードマップ)。
 * 「使い込むほど、自分についての発見がひらく」を最初から見せておく＝アプリの売り。
 * 手に入れた宝箱は点灯・タップで中身、まだの宝箱は鍵つきで予告(あと◯シグナル)。減らない・罰しない。
 */
export default function RewardMap({ signals, chart, starName }: Props) {
  const t = useUI()
  const prog = mapProgress(signals)
  const [open, setOpen] = useState<string | null>(null)

  const lonOf = (key: PlanetKey) => chart.planets.find((p) => p.key === key)?.lon
  const moonLon = lonOf('moon')
  const moonSign = moonLon !== undefined ? signName(signIndex(moonLon)) : ''
  const moonManner = moonLon !== undefined ? signMannerOf(moonLon) : ''

  function contentFor(key: string, content: 'ready' | 'soon'): string {
    if (content === 'soon') return t.map.soonNote
    if (key === 'birth') return t.map.bornBody(quoted(starName))
    if (key === 'moonBack') return t.map.moonBackBody(moonSign, moonManner)
    return t.map.soonNote
  }

  return (
    <section className="map-card">
      <div className="card-head">
        <div className="card-head-icon map-head-icon" aria-hidden="true">
          ✦
        </div>
        <div>
          <p className="card-title">{t.map.title}</p>
          <p className="card-sub">{t.map.sub}</p>
        </div>
      </div>

      <p className="map-progress">
        {t.map.progressLead(quoted(starName), signals)}
        {prog.next ? (
          <span className="map-progress-next"> · {t.map.toNext(prog.remaining, t.map.tiers[prog.next.key].name)}</span>
        ) : (
          <span className="map-progress-next"> · {t.map.allDone}</span>
        )}
      </p>

      <ol className="map-track">
        {prog.tiers.map((tier) => {
          const info = t.map.tiers[tier.key]
          const isNext = prog.next?.key === tier.key
          const isOpen = open === tier.key
          return (
            <li
              key={tier.key}
              className={`map-node${tier.unlocked ? ' is-unlocked' : ' is-locked'}${isNext ? ' is-next' : ''}`}
            >
              <div className="map-node-dot" aria-hidden="true">
                {tier.unlocked ? '✦' : '🔒'}
              </div>
              <div className="map-node-body">
                <button
                  className="map-node-head"
                  onClick={() => tier.unlocked && setOpen(isOpen ? null : tier.key)}
                  disabled={!tier.unlocked}
                >
                  <span className="map-node-name">{info.name}</span>
                  {tier.unlocked ? (
                    <span className="map-node-cta">{isOpen ? t.map.close : t.map.open}</span>
                  ) : (
                    <span className="map-node-lock">
                      {isNext ? t.map.lockedHint(prog.remaining) : `Lv.${tier.at}`}
                    </span>
                  )}
                </button>
                <p className="map-node-teaser">{info.teaser}</p>
                {isOpen && tier.unlocked && (
                  <p className={`map-node-content${tier.content === 'soon' ? ' is-soon' : ''}`}>
                    {contentFor(tier.key, tier.content)}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

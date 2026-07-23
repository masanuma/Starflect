import { useMemo, useState } from 'react'
import type { ChartData } from '../lib/types'
import { mapProgress, loadCompanion, behaviorBrief } from '../lib/companion'
import { buildChatContext } from '../lib/aiChat'
import { fetchAiReport, loadReport } from '../lib/aiReport'
import type { ReportTopic } from '../lib/aiReport'
import { useLang } from '../lib/i18n'
import { useUI, quoted } from '../lib/ui'

interface Props {
  /** 現在の累計シグナル(=地図の通貨)。使うほど増え、減らない */
  signals: number
  /** 発見レポートの土台になるチャート */
  chart: ChartData
  /** ほしキャラ名(括弧なしの生の名前。表示時に言語別の括弧を付ける) */
  starName: string
}

interface ReportState {
  loading?: boolean
  text?: string
  error?: boolean
}

/**
 * ごほうび地図(縦ロードマップ)。
 * 「使い込むほど、自分についての発見がひらく」を最初から見せておく＝アプリの売り。
 * 宝箱を開くと、AIが出生図×行動ログからその人だけの発見レポートを生成(初回のみ・以降キャッシュ)。
 * 減らない・罰しない。まだ実装していない宝箱は「準備中」。
 */
export default function RewardMap({ signals, chart, starName }: Props) {
  const t = useUI()
  const { lang } = useLang()
  const prog = mapProgress(signals)
  const [open, setOpen] = useState<string | null>(null)
  const [reports, setReports] = useState<Record<string, ReportState>>({})

  // 発見レポートに渡す占星術データ土台(全期間トランジット込み)。チャートが変わらない限り作り直さない
  const context = useMemo(() => buildChatContext(chart), [chart])

  async function generate(topic: ReportTopic) {
    const cached = loadReport(context, topic)
    if (cached) {
      setReports((r) => ({ ...r, [topic]: { text: cached } }))
      return
    }
    setReports((r) => ({ ...r, [topic]: { loading: true } }))
    try {
      const state = loadCompanion()
      const behavior = state ? behaviorBrief(state) : undefined
      const text = await fetchAiReport(context, topic, behavior, lang)
      setReports((r) => ({ ...r, [topic]: { text } }))
    } catch {
      setReports((r) => ({ ...r, [topic]: { error: true } }))
    }
  }

  function toggle(key: string, content: 'ready' | 'ai' | 'soon') {
    const next = open === key ? null : key
    setOpen(next)
    const rep = reports[key]
    if (next && content === 'ai' && !rep?.text && !rep?.loading) {
      void generate(key as ReportTopic)
    }
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

      <p className="map-earn">{t.map.earnHint}</p>

      <ol className="map-track">
        {prog.tiers.map((tier) => {
          const info = t.map.tiers[tier.key]
          const isNext = prog.next?.key === tier.key
          const isOpen = open === tier.key
          const rep = reports[tier.key]
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
                  onClick={() => tier.unlocked && toggle(tier.key, tier.content)}
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
                  <>
                    {tier.content === 'ai' ? (
                      rep?.loading ? (
                        <p className="map-node-content is-generating">{t.map.generating}</p>
                      ) : rep?.error ? (
                        <p className="map-node-content is-soon">
                          {t.map.reportError}{' '}
                          <button className="map-retry" onClick={() => void generate(tier.key as ReportTopic)}>
                            {t.map.reportRetry}
                          </button>
                        </p>
                      ) : (
                        <p className="map-node-content">{rep?.text}</p>
                      )
                    ) : (
                      <p className={`map-node-content${tier.content === 'soon' ? ' is-soon' : ''}`}>
                        {tier.content === 'soon' ? t.map.soonNote : t.map.bornBody(quoted(starName))}
                      </p>
                    )}
                  </>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

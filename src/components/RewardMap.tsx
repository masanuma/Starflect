import { useMemo, useState } from 'react'
import type { ChartData } from '../lib/types'
import { mapProgress, loadCompanion, behaviorBrief, currentAir } from '../lib/companion'
import { buildChatContext } from '../lib/aiChat'
import { fetchAiReport, loadReport } from '../lib/aiReport'
import type { ReportTopic } from '../lib/aiReport'
import { useLang } from '../lib/i18n'
import { useUI, quoted } from '../lib/ui'
import { track } from '../lib/analytics'

interface Props {
  /** 現在の累計シグナル(=地図の通貨)。使うほど増え、減らない */
  signals: number
  /** 発見レポートの土台になるチャート */
  chart: ChartData
  /** ほしキャラ名(括弧なしの生の名前。表示時に言語別の括弧を付ける) */
  starName: string
  /**
   * 手紙の一覧を畳んでおく(相棒ホーム用)。
   * 見出しだけ残し、読める手紙は開いたときに静かに並べる。
   */
  collapsible?: boolean
}

interface ReportState {
  loading?: boolean
  text?: string
  error?: boolean
}

/**
 * 読める手紙の一覧。利用回数の数字や、未解放の予告は見せない。
 * 手紙を開くと、AIが出生図×行動ログからその人だけの内容を生成(初回のみ・以降キャッシュ)。
 * 減らない・罰しない。しきい値や生成の仕組みは宝箱時代のまま＝変わったのは服だけ。
 */
export default function RewardMap({ signals, chart, starName, collapsible = false }: Props) {
  const t = useUI()
  const { lang } = useLang()
  const prog = mapProgress(signals)
  const [open, setOpen] = useState<string | null>(null)
  const [reports, setReports] = useState<Record<string, ReportState>>({})
  const [expanded, setExpanded] = useState(!collapsible)

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
      // 「ほんとうの相棒」だけは記憶（人となり・いまの空気）も踏まえて書く＝最終形の中身
      const memory =
        topic === 'trueBuddy' && state
          ? { persona: state.persona?.lines, air: currentAir(state) }
          : undefined
      const text = await fetchAiReport(context, topic, behavior, lang, memory)
      setReports((r) => ({ ...r, [topic]: { text } }))
    } catch {
      setReports((r) => ({ ...r, [topic]: { error: true } }))
    }
  }

  function toggle(key: string, content: 'ready' | 'ai' | 'soon') {
    const next = open === key ? null : key
    setOpen(next)
    // 宝箱が実際に開かれているかを、これまで一切測っていなかった。
    // しきい値(3/10/25/50/100)を実データで調整するには、この2つが要る
    if (next) track('map_box_open', { box: key, kind: content, signals })
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

      {collapsible && (
        <button
          className={`map-toggle${expanded ? ' open' : ''}`}
          onClick={() =>
            setExpanded((v) => {
              if (!v) track('map_open', { signals, unlocked: prog.tiers.filter((x) => x.unlocked).length })
              return !v
            })
          }
        >
          {expanded ? t.map.collapseMap : t.map.expandMap}
        </button>
      )}

      {expanded && (
      <>
      <ol className="map-track">
        {prog.tiers.filter((tier) => tier.unlocked).map((tier) => {
          const info = t.map.tiers[tier.key]
          const isOpen = open === tier.key
          const rep = reports[tier.key]
          return (
            <li
              key={tier.key}
              className="map-node is-unlocked"
            >
              {/* 🔒はゲームの語彙。手紙の体裁では「開ける封筒」と「まだ書いている途中」 */}
              <div className="map-node-dot" aria-hidden="true">
                ✉
              </div>
              <div className="map-node-body">
                <button
                  className="map-node-head"
                  onClick={() => toggle(tier.key, tier.content)}
                >
                  <span className="map-node-name">{info.name}</span>
                  <span className="map-node-cta">{isOpen ? t.map.close : t.map.open}</span>
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
      </>
      )}
    </section>
  )
}

import { useState } from 'react'
import type { ChartData } from '../lib/types'
import { readFortune } from '../lib/fortune'
import { getPlanet } from '../lib/planets'
import { signName, signKeywords } from '../lib/signs'
import { signIndex } from '../lib/astro'
import { streamAiDayCheck } from '../lib/aiChat'
import { useLang } from '../lib/i18n'
import { useUI } from '../lib/ui'
import { track } from '../lib/analytics'

/**
 * 「この日、どう？」— 日付を選ぶと、その日が自分にとってどんな日かを読む。
 *
 * **読む占いを「使う占い」にする一手。** 人はこれから来る日付（面接・デート・引っ越し）を
 * 常に抱えていて、それを調べる用事は再訪問の理由になる。
 * エンジン(astronomy-engine)は任意の日付を計算できるのに、これまで「今日」しか見せていなかった。
 *
 * その日の運行は**この端末で**計算して渡す（サーバーは astronomy-engine を読めない）。
 * 毎日の運勢と違い、保存も引き直し禁止も無い＝照会なので何度でも聞ける。
 */
export default function DayCheck({ chart }: { chart: ChartData }) {
  const t = useUI()
  const { lang } = useLang()
  const [date, setDate] = useState('')
  const [state, setState] = useState<{ kind: 'idle' } | { kind: 'reading' } | { kind: 'done'; text: string } | { kind: 'error' }>(
    { kind: 'idle' },
  )

  // 今日〜3年先まで。「3年より先は手元に無い」という相談室の建付けと揃える
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const today = new Date()
  const min = fmt(today)
  const max = fmt(new Date(today.getFullYear() + 3, today.getMonth(), today.getDate()))

  async function read() {
    if (!date) return
    const [y, m, d] = date.split('-').map(Number)
    const when = new Date(y, m - 1, d, 12) // その日の正午を代表時刻にする
    const label = new Intl.DateTimeFormat(lang, { year: 'numeric', month: 'long', day: 'numeric' }).format(when)
    const fortune = readFortune(chart.planets, 'today', when)
    track('day_check', { days_ahead: Math.round((when.getTime() - today.getTime()) / 86_400_000) })
    setState({ kind: 'reading' })
    let acc = ''
    try {
      await streamAiDayCheck(
        {
          name: chart.name ?? '',
          dateLabel: chart.dateLabel,
          placeLabel: chart.placeLabel,
          planets: chart.planets.map((p) => ({
            label: getPlanet(p.key).name,
            role: getPlanet(p.key).role,
            sign: signName(signIndex(p.lon)),
            traits: signKeywords(signIndex(p.lon)),
            deg: p.lon % 30,
            retro: p.retro,
          })),
          periods: [
            {
              label,
              sky: fortune.skyNote,
              tone: fortune.toneLabel,
              items: fortune.items.map((i) => i.title),
            },
          ],
        },
        label,
        (delta) => {
          acc += delta
          setState({ kind: 'done', text: acc })
        },
      )
    } catch {
      setState({ kind: 'error' })
    }
  }

  return (
    <section className="daycheck-card">
      <div className="card-head">
        <div className="card-head-icon" aria-hidden="true">
          🗓
        </div>
        <div>
          <p className="card-title">{t.companion.dayCheckTitle}</p>
          <p className="card-sub">{t.companion.dayCheckSub}</p>
        </div>
      </div>

      <div className="daycheck-form">
        <input
          type="date"
          value={date}
          min={min}
          max={max}
          onChange={(e) => setDate(e.target.value)}
          aria-label={t.companion.dayCheckTitle}
        />
        <button className="cta daycheck-go" disabled={!date || state.kind === 'reading'} onClick={() => void read()}>
          {t.companion.dayCheckButton}
        </button>
      </div>

      {state.kind === 'reading' && (
        <p className="fortune-waiting-msg daycheck-waiting">
          {t.companion.fortuneWaiting}
          <span className="fortune-dots" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </p>
      )}
      {state.kind === 'done' && <p className="fortune-body">{state.text}</p>}
      {state.kind === 'error' && (
        <div className="fortune-error">
          <p>{t.companion.fortuneError}</p>
          <button className="ghost" onClick={() => void read()}>
            {t.companion.fortuneRetry}
          </button>
        </div>
      )}
    </section>
  )
}

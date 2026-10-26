import { useLang } from '../lib/i18n'
import { fortuneLabels } from '../lib/fortuneLabels'
import { fortuneOutlook, parseFortuneReading } from '../lib/fortuneReading'
import type { FortuneOutlook } from '../lib/fortuneReading'
import type { ReactNode } from 'react'

/** The outlook is calculated from the stars, never inferred from optimistic wording. */
export function FortuneWeather({ outlook }: { outlook: FortuneOutlook }) {
  return (
    <svg viewBox="0 0 100 88" className="fortune-weather" aria-hidden="true" focusable="false">
      {outlook !== 'careful' && <g fill="none" stroke="#b97b1e" strokeWidth="3" strokeLinecap="round">
        <path d="M48 7v6m0 48v6M18 37h6m48 0h6M26 15l5 5m34 34 5 5m0-44-5 5M31 54l-5 5" />
        <circle cx="48" cy="37" r="18" fill="#ffe29b" />
      </g>}
      {outlook === 'good' ? <g fill="#9b701e"><path d="m82 62 2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
        <path d="m15 60 1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" /></g> :
        <path d="M24 68a14 14 0 0 1-1-28 21 21 0 0 1 40-6 17 17 0 0 1 14 34Z"
          fill={outlook === 'steady' ? '#e6edf9' : '#f8e7cd'} stroke={outlook === 'steady' ? '#647fa8' : '#a56b35'} strokeWidth="2.5" />}
      {outlook === 'careful' && <g stroke="#a56b35" strokeWidth="2.5" strokeLinecap="round">
        <path d="m37 76-2 5m21-5-2 5" /><path d="M44 52h.1m13 0h.1" />
        <path d="M47 59q4 3 8 0" fill="none" />
      </g>}
    </svg>
  )
}

export function FortuneOutlookBanner({ level, night = false }: { level: number; night?: boolean }) {
  const { lang } = useLang()
  const labels = fortuneLabels[lang]
  const outlook = fortuneOutlook(level)
  return <div className={`fortune-outlook fortune-outlook--${outlook}`}>
    <FortuneWeather outlook={outlook} />
    <div><p className="fortune-outlook-eyebrow">{night ? labels.night : labels.sky}</p>
      <p className="fortune-outlook-label">{labels[outlook]}</p>
      <p className="fortune-outlook-hint">{labels[`${outlook}Hint`]}</p></div>
  </div>
}

export default function FortuneContent({ text, onAsk, mascot, outlook = 'steady' }: { text: string; onAsk?: (q: string) => void; mascot?: ReactNode; outlook?: FortuneOutlook }) {
  const { lang } = useLang()
  const labels = fortuneLabels[lang]
  const reading = parseFortuneReading(text)
  if (!reading) return <div className="fortune-prose">{text.split(/\n\s*\n/).filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}</div>
  return <div className="fortune-editorial">
    {reading.greeting ? <div className={`fortune-greeting fortune-greeting--${outlook}`}>
      {mascot && <div className="fortune-greeting-mascot" aria-hidden="true">{mascot}</div>}
      <h3>{reading.greeting}</h3>
    </div> : <h3 className="fortune-headline">{reading.headline}</h3>}
    <div className="fortune-prose">{reading.paragraphs.map((p, i) => <p key={i}>{p}</p>)}</div>
    {reading.caution && <aside className="fortune-caution">
      <p className="fortune-caution-label"><span aria-hidden="true">◇</span> {labels.caution}</p>
      <p>{reading.caution}</p>
    </aside>}
    {onAsk && reading.questions.length > 0 && <div className="fortune-followup">
      <p>{labels.continue}</p>
      <div>{reading.questions.map(q => <button type="button" key={q} onClick={() => onAsk(q)}>{q}<span aria-hidden="true"> →</span></button>)}</div>
    </div>}
  </div>
}

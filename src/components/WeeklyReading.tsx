import { useEffect, useRef, useState } from 'react'
import { useLang } from '../lib/i18n'
import { streamAiWeekly } from '../lib/aiChat'
import { starTypeOf } from '../lib/startypes'
import { getPlanet } from '../lib/planets'
import { signIndex } from '../lib/astro'
import { signKeywords } from '../lib/signs'
import { calendarWeek, weeklyMaterials, weeklyLabels, loadWeekly, saveWeekly, parseWeekly } from '../lib/weeklyReading'
import type { ChartData } from '../lib/types'

type State = {kind:'loading'} | {kind:'error'} | {kind:'done'; text:string}
export default function WeeklyReading({chart, onAsk}: {chart:ChartData; onAsk?: (q:string) => void}) {
  const {lang} = useLang()
  const labels = weeklyLabels[lang]
  const [week] = useState(() => calendarWeek())
  const [state, setState] = useState<State>(() => {
    const text = loadWeekly(chart, week.start, lang)
    return text ? {kind:'done',text} : {kind:'loading'}
  })
  const started = useRef(false)
  async function generate() {
    setState({kind:'loading'})
    try {
      const sun = chart.planets.find(p => p.key === 'sun')
      const moon = chart.planets.find(p => p.key === 'moon')
      const star = sun && moon ? starTypeOf(sun.lon, moon.lon) : undefined
      let text = ''
      await streamAiWeekly({ name:chart.name, dateLabel:'', starTypeName:star?.type.name, starTypeCopy:star?.type.copy,
        planets: chart.planets.map(p => ({label:getPlanet(p.key).name, role:getPlanet(p.key).role,
          sign:'', deg:p.lon % 30, traits:signKeywords(signIndex(p.lon))})), periods:[],
      }, weeklyMaterials(chart, week.dates[0]), chunk => {text += chunk}, lang)
      const body = parseWeekly(text)
      saveWeekly(chart, week.start, lang, body)
      setState({kind:'done',text:body})
    } catch { setState({kind:'error'}) }
  }
  useEffect(() => {
    if (started.current || state.kind === 'done') return
    started.current = true
    void generate()
  }, []) // one reading per person, language and calendar week
  const dateFormat = new Intl.DateTimeFormat(lang,{month:'numeric',day:'numeric'})
  return <section className="weekly-reading">
    <div className="weekly-reading-heading"><span aria-hidden="true">✦</span>
      <h4>{labels.title}</h4></div>
    <p className="weekly-reading-dates">{dateFormat.format(week.dates[0])} — {dateFormat.format(week.dates[6])}</p>
    {state.kind === 'loading' && <p role="status">{labels.loading}</p>}
    {state.kind === 'error' && <div role="alert"><p>{labels.error}</p><button type="button" onClick={() => void generate()}>{labels.retry}</button></div>}
    {state.kind === 'done' && <><p className="weekly-reading-body">{state.text}</p>
      {onAsk && <button type="button" onClick={() => onAsk(labels.question)}>{labels.more} <span aria-hidden="true">→</span></button>}</>}
  </section>
}

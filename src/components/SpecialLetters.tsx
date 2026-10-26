import { useEffect, useRef, useState } from 'react'
import type { ChartData, PlanetKey } from '../lib/types'
import { useLang } from '../lib/i18n'
import { getPlanet } from '../lib/planets'
import { buildChatContext, streamAiSpecial } from '../lib/aiChat'
import { parseWeekly } from '../lib/weeklyReading'
import { todayKey } from '../lib/companion'
import { arrivingMoments, deliverLetters, loadLetters, saveLetter, letterLabels } from '../lib/specialLetters'
import type { SpecialLetter } from '../lib/specialLetters'

export function Letter({chart,letter}:{chart:ChartData;letter:SpecialLetter}) {
  const {lang}=useLang()
  const labels=letterLabels[lang]
  const [text,setText]=useState(letter.texts[lang] ?? '')
  const [status,setStatus]=useState<'idle'|'loading'|'done'|'error'>(text?'done':'idle')
  const busy=useRef(false)
  const moment=letter.moment
  async function open() {
    if(busy.current || text) return
    busy.current=true
    setStatus('loading')
    try {
      let acc=''
      await streamAiSpecial(buildChatContext(chart),{date:moment.date,
        transit:getPlanet(moment.transit).name,natal:getPlanet(moment.natal as PlanetKey).name,angle:moment.angle},chunk=>{acc+=chunk},lang)
      const body=parseWeekly(acc)
      saveLetter(chart,moment.id,lang,body)
      setText(body);setStatus('done')
    } catch {setStatus('error')}
    finally {busy.current=false}
  }
  const date=new Intl.DateTimeFormat(lang,{year:'numeric',month:'long',day:'numeric'}).format(new Date(`${moment.date}T12:00:00`))
  return <details className="special-letter" onToggle={event=>{
    if(event.currentTarget.open && status==='idle') void open()
  }}>
    <summary><span className="special-letter-seal" aria-hidden="true">✉</span><span>
      <span className="special-letter-title">{labels.title}</span>
      <span className="special-letter-date">{lang==='ja'||lang==='ko' ? `${date} ${labels.around}` : `${labels.around} ${date}`}</span>
      <span className="special-letter-open">{labels.open} <span aria-hidden="true">↗</span></span>
    </span></summary>
    <div className="special-letter-body">
      {status==='loading' && <p role="status">{labels.loading}</p>}
      {status==='error' && <div role="alert"><p>{labels.error}</p><button type="button" onClick={()=>void open()}>{labels.retry}</button></div>}
      {text && <p>{text}</p>}
      <details className="fortune-why"><summary>{labels.basis}</summary>
        <p>{getPlanet(moment.transit).name} → {getPlanet(moment.natal as PlanetKey).name} · {moment.angle}°</p>
      </details>
    </div>
  </details>
}

export default function SpecialLetters({chart}:{chart:ChartData}) {
  const {lang}=useLang()
  const [today]=useState(()=>todayKey())
  const [letters,setLetters]=useState(()=>loadLetters(chart))
  useEffect(()=>{setLetters(deliverLetters(chart,arrivingMoments(chart)))},[chart])
  const current=letters.filter(l=>l.moment.from<=today && today<=l.moment.until)
  const past=letters.filter(l=>l.moment.until<today)
  if(!letters.length) return null
  return <section className="special-letters" aria-label={letterLabels[lang].title}>
    {current.map(letter=><Letter key={`${lang}:${letter.moment.id}`} chart={chart} letter={letter}/>)}
    {past.length>0 && <details className="special-letter-archive"><summary>{letterLabels[lang].past}</summary>
      {past.map(letter=><Letter key={`${lang}:${letter.moment.id}`} chart={chart} letter={letter}/>)}
    </details>}
  </section>
}

import {createRoot} from 'react-dom/client'
import {LangProvider,useLang,LANGS,type Lang} from '../lib/i18n'
import {useState} from 'react'
import FortuneContent,{FortuneOutlookBanner} from '../components/FortuneContent'
import HoshiKyaraMascot from '../components/HoshiKyaraMascot'
import {Letter} from '../components/SpecialLetters'
import {weeklyLabels} from '../lib/weeklyReading'
import type {StarMoment} from '../lib/specialLetters'
import type {ChartData} from '../lib/types'
import samples from '../../docs/experiments/2026-09-09/language-check.json'
import '../styles.css'
function Preview(){
  const {lang,setLang}=useLang()
  const [night,setNight]=useState(false)
  const [width,setWidth]=useState('320')
  const [question,setQuestion]=useState('')
  const values=samples as {lang:string;kind:string;ok:boolean;value:any;moment?:StarMoment}[]
  const find=(kind:string)=>[...values].reverse().find(v=>v.lang===lang&&v.kind===kind&&v.ok)
  const day=find(night?'night':'day'),week=find('weekly'),special=find('special')
  const chart:ChartData={name:'',dateLabel:'',period:'today',planets:[]}
  return <main style={{padding:16,maxWidth:850,margin:'auto'}}><h1 style={{fontSize:22}}>7言語の生成例・表示確認</h1>
    <p>検証用。本文は実際の生成例です。個人データは変更しません。</p>
    <label>言語 <select value={lang} onChange={e=>{setLang(e.target.value as Lang);setQuestion('')}}>{LANGS.map(l=><option key={l.code} value={l.code}>{l.label}</option>)}</select></label>{' '}
    <label>幅 <select value={width} onChange={e=>setWidth(e.target.value)}><option>320</option><option>390</option><option>700</option></select></label>{' '}
    <label><input type="checkbox" checked={night} onChange={e=>setNight(e.target.checked)}/>夜・注意日</label>
    <div style={{width:`${width}px`,maxWidth:'100%',margin:'20px auto'}}><section className="reading-card reading-card--editorial">
      <FortuneOutlookBanner level={night?-1:1} night={night}/>
      {day&&<FortuneContent text={JSON.stringify(day.value)} onAsk={setQuestion} outlook={night?'careful':'good'} mascot={<HoshiKyaraMascot sunElement="地" moonElement="地" size={76}/>}/>}
      {special&&<Letter key={lang} chart={chart} letter={{moment:special.moment!,texts:{[lang]:special.value}}}/>}
      {week&&<section className="weekly-reading"><h4>{weeklyLabels[lang].title}</h4><p>{week.value}</p><button onClick={()=>setQuestion(weeklyLabels[lang].question)}>{weeklyLabels[lang].more}</button></section>}
      {question&&<p role="status">{question}</p>}
      <details><summary>相談の生成例</summary><p>{find('chat')?.value}</p><p>{find('followup')?.value}</p></details>
    </section></div>
  </main>
}
createRoot(document.getElementById('root')!).render(<LangProvider><Preview/></LangProvider>)

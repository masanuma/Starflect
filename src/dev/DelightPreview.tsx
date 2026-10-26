/** Isolated fixture preview: never changes the user's chart or generates a reading. */
import {useState} from 'react'
import {createRoot} from 'react-dom/client'
import {LangProvider,useLang} from '../lib/i18n'
import FortuneContent,{FortuneOutlookBanner} from '../components/FortuneContent'
import HoshiKyaraMascot from '../components/HoshiKyaraMascot'
import {Letter} from '../components/SpecialLetters'
import type {StarMoment} from '../lib/specialLetters'
import type {ChartData} from '../lib/types'
import checks from '../../docs/experiments/2026-09-09/live-delight-check.json'
import '../styles.css'
function Preview(){
  const [kind,setKind]=useState('day')
  const [width,setWidth]=useState('390')
  const {setLang}=useLang()
  const sample=checks.find(c=>c.kind===kind)!
  const special=checks.find(c=>c.kind==='special')!
  const chart:ChartData={name:'表示サンプル',dateLabel:'',period:'today',planets:[]}
  const outlook=kind==='night'?'careful':kind==='english'?'steady':'good'
  return <main style={{maxWidth:820,margin:'auto',padding:'24px 12px'}}>
    <h1 style={{fontSize:22}}>今日の楽しみと、特別便</h1>
    <p style={{fontSize:13}}>架空人物の生成例です。保存済みの占いには影響しません。特別便は表示確認のため並べています。</p>
    <div style={{display:'flex',gap:16,flexWrap:'wrap',margin:'20px 0'}}>
      <label>生成例 <select value={kind} onChange={e=>{setKind(e.target.value);setLang(e.target.value==='english'?'en':'ja')}}><option value="day">昼・いい日</option><option value="night">夜・注意日</option><option value="english">English</option></select></label>
      <label>幅 <select value={width} onChange={e=>setWidth(e.target.value)}><option>320</option><option>390</option><option>700</option></select> px</label>
    </div>
    <div style={{width:`${width}px`,maxWidth:'100%',margin:'auto'}}><section className="reading-card reading-card--editorial">
      <p className="card-title">「揺るがない山」</p>
      <FortuneOutlookBanner level={outlook==='good'?1:outlook==='careful'?-1:0} night={kind==='night'}/>
      <FortuneContent text={JSON.stringify(sample.value)} outlook={outlook} mascot={<HoshiKyaraMascot sunElement="地" moonElement="地" size={76}/>}/>
      {kind!=='english' && <Letter key={kind} chart={chart} letter={{moment:special.moment as StarMoment,texts:{ja:special.value.text}}}/>}
    </section></div>
  </main>
}
createRoot(document.getElementById('root')!).render(<LangProvider><Preview/></LangProvider>)

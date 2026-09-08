/** Local Vite preview only; not imported by the production entry point. */
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { LangProvider, useLang, setLang, type Lang } from '../lib/i18n'
import FortuneContent, { FortuneOutlookBanner } from '../components/FortuneContent'
import edited from '../../docs/experiments/2026-09-08/edited-new.json'
import inputs from '../../docs/experiments/2026-09-08/inputs.json'
import '../styles.css'

function Preview() {
  const [index, setIndex] = useState(4)
  const [width, setWidth] = useState('390')
  const [question, setQuestion] = useState('')
  const { lang, setLang: changeLanguage } = useLang()
  const e = edited[index]
  const text = JSON.stringify({version: 2, headline: e.title, paragraphs: e.body.split('\n\n'), caution:e.caution, questions:e.questions})
  return <main style={{padding:'24px 12px', maxWidth:900, margin:'auto'}}>
    <h1 style={{fontSize:20, marginBottom:10}}>運勢の表示プレビュー</h1>
    <p style={{fontSize:13}}>比較資料の編集原稿を使っています。実際の生成結果はアプリ本体で確認できます。</p>
    <div style={{display:'flex', gap:12, flexWrap:'wrap', margin:'18px 0'}}>
      <label>日付 <select value={index} onChange={event => {setIndex(Number(event.target.value)); setQuestion('')}}>
        {edited.map((e,i)=><option key={e.date} value={i}>{e.date}</option>)}</select></label>
      <label>画面幅 <select value={width} onChange={event => setWidth(event.target.value)}>
        <option value="320">320px</option><option value="390">390px</option><option value="700">700px</option></select></label>
      <label>表示ラベル <select value={lang} onChange={event => changeLanguage(event.target.value as Lang)}>
        <option value="ja">日本語</option><option value="en">English</option><option value="fr">Français</option></select></label>
    </div>
    <div style={{width:`${width}px`, maxWidth:'100%', margin:'auto'}}>
      <section className="reading-card reading-card--editorial">
        <p className="card-title">ほしキャラが読む、今日の運勢</p>
        <p className="card-sub">「揺るがない山」 · {e.date}</p>
        <FortuneOutlookBanner level={inputs.days[index].fortune.toneLevel} />
        <FortuneContent text={text} onAsk={setQuestion} />
      </section>
      {question && <p role="status">相談へ：{question}</p>}
    </div>
  </main>
}
setLang('ja')
createRoot(document.getElementById('root')!).render(<LangProvider><Preview /></LangProvider>)

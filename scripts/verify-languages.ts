import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {setLang,LANGS} from '../src/lib/i18n'
import {buildChatContext} from '../src/lib/aiChat'
import {weeklyMaterials,parseWeekly,weeklyLabels} from '../src/lib/weeklyReading'
import {monthlyMoment,letterLabels} from '../src/lib/specialLetters'
import {getPlanet} from '../src/lib/planets'
import {fortuneLabels} from '../src/lib/fortuneLabels'
import {parseFortuneReading} from '../src/lib/fortuneReading'
import type {ChartData,PlanetKey} from '../src/lib/types'
const dir='docs/experiments/2026-09-09'
mkdirSync(dir,{recursive:true})
const path=`${dir}/language-check.json`
const fixture=JSON.parse(readFileSync('docs/experiments/2026-09-08/inputs.json','utf8'))
const chart:ChartData={name:'',dateLabel:'1990-05-15',planets:fixture.natal,period:'today'}
const moment=Array.from({length:12},(_,i)=>monthlyMoment(chart.planets,2026,i)).find(Boolean)!
const questions={ja:['話がかみ合わない時の対処法を知りたいです。','同僚に仕事をもう少し分担してほしいのですが、私の気持ちが伝わりません。'],en:['What can I do when we keep talking past each other?','I want my coworker to share more of the work, but I cannot get my point across.'],es:['¿Qué puedo hacer cuando no logramos entendernos?','Quiero que mi compañero de trabajo se encargue de más tareas, pero no consigo que entienda lo que necesito.'],fr:['Que faire quand on ne se comprend pas ?','Je voudrais que mon collègue partage davantage les tâches, mais je ne parviens pas à lui faire comprendre mon besoin.'],it:['Cosa posso fare quando non riusciamo a capirci?','Vorrei che il mio collega condividesse più lavoro, ma non riesco a fargli capire ciò di cui ho bisogno.'],pt:['O que posso fazer quando não nos conseguimos entender?','Gostaria que o meu colega partilhasse mais tarefas, mas não consigo fazer-me entender.'],ko:['서로 말이 통하지 않을 때 어떻게 하면 좋을까요?','동료에게 일을 조금 더 나눠 맡아 달라고 하고 싶은데 제 마음이 잘 전달되지 않아요.']}
const results:any[]=process.argv.includes('--resume')?JSON.parse(readFileSync(path,'utf8')):[]
const jobs=LANGS.map(({code:lang})=>{
  setLang(lang)
  const context=buildChatContext(chart)
  const week=weeklyMaterials(chart,new Date(2026,8,9,12))
  const localizedMoment={date:moment.date,transit:getPlanet(moment.transit).name,natal:getPlanet(moment.natal as PlanetKey).name,angle:moment.angle}
  for(const labels of [fortuneLabels[lang],weeklyLabels[lang],letterLabels[lang]]) {
    if(Object.values(labels).some(v=>typeof v!=='string'||!v.trim())) throw Error(`Missing labels ${lang}`)
  }
  return {lang,context,week,localizedMoment}
})
async function run(job:typeof jobs[number]) {
  const {lang,context,week,localizedMoment}=job
  let first=''
  for(const kind of ['day','night','weekly','special','chat','followup','report']) {
    const old=results.find(r=>r.lang===lang&&r.kind===kind&&r.ok)
    if(old){if(kind==='chat')first=old.value;continue}
    const endpoint=kind==='report'?'ai-report':kind==='chat'||kind==='followup'?'ai-chat':'ai-fortune'
    const messages=kind==='chat'?[{role:'user',content:questions[lang][0]}]:kind==='followup'?
      [{role:'user',content:questions[lang][0]},{role:'assistant',content:first},{role:'user',content:questions[lang][1]}]:[{role:'user',content:'この人の星を読んでください。'}]
    const extra=kind==='report'?{topic:'moonBack'}:kind==='weekly'?{horizon:'week',week}:kind==='special'?{horizon:'special',moment:localizedMoment}:{facet:kind==='night'?'night':'day',outlook:kind==='night'?'careful':'good'}
    let raw='',status=0
    try {
      const response=await fetch(`http://127.0.0.1:5173/api/${endpoint}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({context,lang,formatVersion:2,messages,...extra}),signal:AbortSignal.timeout(90000)})
      status=response.status;raw=await response.text()
      if(status!==200)throw Error(`HTTP ${status}`)
      const value=kind==='report'?JSON.parse(raw).text:kind==='day'||kind==='night'?parseFortuneReading(raw):kind==='weekly'||kind==='special'?parseWeekly(raw):raw
      if(!value || ((kind==='day'||kind==='night') && !(value as any).greeting))throw Error('Missing or invalid response')
      if(lang!=='ja'&&/[\u3040-\u30ff]/.test(JSON.stringify(value)))throw Error('Japanese mixed into response')
      if(lang==='ko'&&!/[가-힣]/.test(JSON.stringify(value)))throw Error('Missing Korean text')
      if(kind==='chat')first=value as string
      results.push({lang,kind,ok:true,value,moment:kind==='special'?moment:undefined})
      console.log(`PASS ${lang}/${kind}`)
    }catch(error){results.push({lang,kind,ok:false,status,raw,error:String(error)});console.log(`FAIL ${lang}/${kind}: ${error}`)}
    writeFileSync(path,JSON.stringify(results,null,2)+'\n')
  }
}
// Two streams at a time keep the check bounded without flooding the AI service.
let index=0
await Promise.all([0,1].map(async()=>{while(index<jobs.length)await run(jobs[index++])}))
const failures=LANGS.flatMap(({code})=>['day','night','weekly','special','chat','followup','report'].filter(kind=>!results.some(r=>r.lang===code&&r.kind===kind&&r.ok)).map(kind=>`${code}/${kind}`))
console.log(JSON.stringify({passed:49-failures.length,failures}))
if(failures.length)process.exitCode=1

import assert from 'node:assert/strict'
import {readFileSync, writeFileSync} from 'node:fs'
import {calendarWeek, weeklyMaterials, loadWeekly, saveWeekly, parseWeekly} from '../src/lib/weeklyReading'
import {createCompanion, loadCompanion} from '../src/lib/companion'
import {buildChatContext} from '../src/lib/aiChat'
import {buildWeeklyEditorial} from '../server/weeklyEditorial'
import type {ChartData} from '../src/lib/types'
import {createElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import Result from '../src/components/Result'
import RewardMap from '../src/components/RewardMap'

const cache = new Map<string,string>()
Object.assign(globalThis,{location:new URL('http://localhost:5173/app'),localStorage:{getItem:(key:string)=>cache.get(key)??null,setItem:(key:string,value:string)=>cache.set(key,value)}})
const fixtures = JSON.parse(readFileSync('docs/experiments/2026-09-08/inputs.json','utf8'))
const chart:ChartData = {name:'',dateLabel:'1990年5月15日',planets:fixtures.natal,period:'today'}
const week = calendarWeek(new Date(2026,8,13,23,59))
assert.equal(week.start,'2026-09-07')
assert.equal(week.end,'2026-09-13')
assert.equal(calendarWeek(new Date(2026,8,14)).start,'2026-09-14')
assert.equal(calendarWeek(new Date(2027,0,1)).start,'2026-12-28')
const material = weeklyMaterials(chart,new Date(2026,8,8))
assert.equal(material.days.length,7)
assert.equal(material.days[0].label,material.start)
assert.equal(material.days[6].label,material.end)
assert.equal(new Set(material.days.map(d=>d.label)).size,7)
assert.equal(parseWeekly('{"version":1,"text":"楽しみ"}'),'楽しみ')
for(const bad of ['{','null','{"version":1,"text":""}','{"version":1,"text":42}']) assert.throws(()=>parseWeekly(bad))
createCompanion(chart,'earth_earth')
saveWeekly(chart,week.start,'ja','今週の楽しみ')
saveWeekly(chart,week.start,'ja','書き換え')
assert.equal(loadWeekly(chart,week.start,'ja'),'今週の楽しみ')
assert.equal(loadWeekly(chart,week.start,'en'),undefined)
assert.equal(loadWeekly(chart,'2026-09-14','ja'),undefined)
assert.equal(loadWeekly({...chart,name:'別の人'},week.start,'ja'),undefined)
saveWeekly(chart,week.start,'en','A small joy')
assert.equal(loadWeekly(chart,week.start,'en'),'A small joy')
assert.ok(loadCompanion()?.weekly?.ja)
assert.ok(buildWeeklyEditorial({context:fixtures.days[0].context,messages:[],week:material}).includes('2026-09-07'))
createCompanion({...chart,dateLabel:'別の日'},'earth_earth')
assert.equal(loadCompanion()?.weekly,undefined)
const resultHtml=renderToStaticMarkup(createElement(Result,{data:chart,onHome:()=>{},onPair:()=>{}}))
const dailyIndex=resultHtml.indexOf('reading-card--editorial')
const chatIndex=resultHtml.indexOf('chat-card')
const starsIndex=resultHtml.indexOf('あなたをかたちづくる')
assert.ok(dailyIndex >= 0 && dailyIndex < chatIndex && chatIndex < starsIndex)
assert.ok(!resultHtml.includes('guide-card'))
const letters=renderToStaticMarkup(createElement(RewardMap,{signals:2,chart,starName:'揺るがない山'}))
assert.ok(!letters.includes('map-progress') && !letters.includes('map-earn') && !letters.includes('map-node-lock'))
assert.ok(letters.includes('月星座の裏側') && !letters.includes('隠れた自分'))
console.log('PASS: calendar boundaries, seven dated calculations, parser, stable weekly cache, language/person separation, chart replacement')
console.log('PASS: first-visit reading/chat/stars order and available-only letters without progress counts')

if(process.argv.includes('--live')) {
  const results:any[]=[]
  async function call(path:string,payload:unknown) {
    const response=await fetch(`http://127.0.0.1:5173/api/${path}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),signal:AbortSignal.timeout(60_000)})
    assert.equal(response.status,200)
    return response.text()
  }
  const context=buildChatContext(chart)
  context.planets=fixtures.days[0].context.planets
  const weekly=parseWeekly(await call('ai-fortune',{context,week:material,formatVersion:2,horizon:'week',lang:'ja',messages:[{role:'user',content:'今週、楽しみにしていいことを短く教えてください。'}]}))
  results.push({kind:'weekly',week:material,text:weekly})
  console.log('WEEKLY:',weekly)
  const messages=[{role:'user',content:'話がかみ合わない時の対処法が知りたい'}]
  const first=await call('ai-chat',{context,messages,lang:'ja'})
  console.log('CHAT 1:',first)
  results.push({kind:'clarification',text:first})
  messages.push({role:'assistant',content:first},{role:'user',content:'こちらの気持ちが伝わらない感じです。仕事の分担について、同僚にもう少し手伝ってほしいと伝えたいです。'})
  const second=await call('ai-chat',{context,messages,lang:'ja'})
  console.log('CHAT 2:',second)
  results.push({kind:'specific-advice',text:second})
  writeFileSync('docs/experiments/2026-09-08/weekly-chat-check.json',JSON.stringify(results,null,2)+'\n')
}

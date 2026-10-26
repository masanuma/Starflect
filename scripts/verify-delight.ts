import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {monthlyMoment,arrivingMoments,deliverLetters,loadLetters,saveLetter} from '../src/lib/specialLetters'
import {createCompanion} from '../src/lib/companion'
import {parseFortuneReading} from '../src/lib/fortuneReading'
import {Body} from 'astronomy-engine'
import {eclipticLongitude,norm} from '../src/lib/astro'
import type {ChartData} from '../src/lib/types'
const cache=new Map<string,string>()
Object.assign(globalThis,{localStorage:{getItem:(k:string)=>cache.get(k)??null,setItem:(k:string,v:string)=>cache.set(k,v)}})
const fixtures=JSON.parse(readFileSync('docs/experiments/2026-09-08/inputs.json','utf8'))
// Engineer an actual sextile at a month boundary using the ephemeris, not a fake event.
const date=new Date(2026,8,1,12)
const chart:ChartData={name:'Test',dateLabel:'fixture',period:'today',planets:[{key:'sun',lon:norm(eclipticLongitude(Body.Venus,date)-60)}]}
const moment=monthlyMoment(chart.planets,2026,8)!
assert.equal(moment.date,'2026-09-01')
assert.ok(moment.offset<0.001)
assert.ok(arrivingMoments(chart,new Date(2026,7,31,12)).some(m=>m.id===moment.id))
assert.ok(!arrivingMoments(chart,new Date(2026,8,5,12)).some(m=>m.id===moment.id))
assert.equal(monthlyMoment([],2026,8),undefined)
createCompanion(chart,'earth_earth')
deliverLetters(chart,[moment]);deliverLetters(chart,[moment])
assert.equal(loadLetters(chart).length,1)
assert.equal(deliverLetters(chart,[]).length,1)
saveLetter(chart,moment.id,'ja','手紙');saveLetter(chart,moment.id,'ja','上書き')
saveLetter(chart,moment.id,'en','Letter')
assert.equal(loadLetters(chart)[0].texts.ja,'手紙')
assert.equal(loadLetters(chart)[0].texts.en,'Letter')
const other={...chart,name:'Other'}
assert.equal(loadLetters(other).length,0)
createCompanion(other,'earth_earth')
assert.equal(loadLetters(other).length,0)
const daily={version:2,headline:'見出し',paragraphs:['本文'],caution:'',questions:[]}
assert.ok(parseFortuneReading(JSON.stringify(daily)))
assert.equal(parseFortuneReading(JSON.stringify({...daily,greeting:'今日の楽しみ'}))?.greeting,'今日の楽しみ')
assert.equal(parseFortuneReading(JSON.stringify({...daily,greeting:42})),null)
console.log('PASS: real personal peak, month-boundary arrival, absent event, delivery deduplication, archive, immutable localized text, person separation, legacy greeting compatibility')
if(process.argv.includes('--live')) {
  const sampleMoment=Array.from({length:12},(_,i)=>monthlyMoment(fixtures.natal,2026,i)).find(Boolean)!
  assert.ok(sampleMoment)
  const results=[]
  for(const [kind,extra] of [
    ['day',{facet:'day',outlook:'good',lang:'ja'}],
    ['night',{facet:'night',outlook:'careful',lang:'ja'}],
    ['english',{facet:'day',outlook:'steady',lang:'en'}],
    ['special',{horizon:'special',moment:{date:sampleMoment.date,transit:sampleMoment.transit,natal:sampleMoment.natal,angle:sampleMoment.angle},lang:'ja'}],
  ] as const) {
    const response=await fetch('http://127.0.0.1:5173/api/ai-fortune',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({context:fixtures.days[kind==='night'?4:1].context,messages:[{role:'user',content:'私の楽しみを教えて'}],formatVersion:2,...extra}),signal:AbortSignal.timeout(60000)})
    assert.equal(response.status,200)
    const raw=await response.text()
    const value=kind==='special'?JSON.parse(raw.replace(/^\s*```(?:json)?\s*/,'').replace(/\s*```\s*$/,'')):parseFortuneReading(raw)
    assert.ok(value)
    if(kind==='special') assert.ok(value.version===1 && value.text)
    else assert.ok(value.greeting && value.paragraphs.length===2)
    console.log(kind,JSON.stringify(value))
    if(kind==='english') assert.ok(!/[\u3040-\u30ff]/.test(JSON.stringify(value)))
    results.push({kind,value,moment:kind==='special'?sampleMoment:undefined})
  }
  mkdirSync('docs/experiments/2026-09-09',{recursive:true})
  writeFileSync('docs/experiments/2026-09-09/live-delight-check.json',JSON.stringify(results,null,2)+'\n')
}

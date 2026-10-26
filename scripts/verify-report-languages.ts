import assert from 'node:assert/strict'
import {LANGS,setLang} from '../src/lib/i18n'
import {fetchAiReport,loadReport,loadLegacyReport} from '../src/lib/aiReport'
import {streamAiChat} from '../src/lib/aiChat'
import {aiFailureMessage} from '../src/lib/aiErrors'
import {createElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {LangProvider} from '../src/lib/i18n'
import RewardMap from '../src/components/RewardMap'
import {readFileSync} from 'node:fs'
const cache=new Map<string,string>()
const context={name:'test',dateLabel:'test',planets:[],periods:[]}
let calls=0
Object.assign(globalThis,{localStorage:{getItem:(k:string)=>cache.get(k)??null,setItem:(k:string,v:string)=>cache.set(k,v)},fetch:async(_url:string,options:any)=>{
  calls++;return {ok:true,json:async()=>({text:`letter-${JSON.parse(options.body).lang}`})}
}})
cache.set('starflect-report:test:test:moonBack','Original letter without language metadata')
assert.equal(loadReport(context,'moonBack','ja'),null)
assert.equal(loadLegacyReport(context,'moonBack'),'Original letter without language metadata')
for(const {code} of LANGS){
  setLang(code)
  const pending=fetchAiReport(context,'moonBack')
  setLang(code==='ja'?'en':'ja') // a late response keeps the requested language
  assert.equal(await pending,`letter-${code}`)
  assert.equal(loadReport(context,'moonBack',code),`letter-${code}`)
}
for(const {code} of LANGS) assert.equal(await fetchAiReport(context,'moonBack',undefined,code),`letter-${code}`)
assert.equal(calls,7)
assert.ok(loadLegacyReport(context,'moonBack'))
const fixture=JSON.parse(readFileSync('docs/experiments/2026-09-08/inputs.json','utf8'))
for(const {code} of LANGS){
  Object.assign(globalThis,{location:new URL(`http://localhost/app?lang=${code}`)})
  const html=renderToStaticMarkup(createElement(LangProvider,{children:createElement(RewardMap,{signals:2,chart:{name:'',dateLabel:'fixture',planets:fixture.natal,period:'today'},starName:'Star Character'})}))
  assert.ok(!html.includes('map-progress')&&!html.includes('map-node-lock'))
  assert.equal((html.match(/class="map-node is-unlocked"/g)??[]).length,2)
}
console.log('PASS: seven-language report caches, late response isolation, no regeneration, preserved legacy archive, available-only letters in seven languages')
for(const {code} of LANGS){
  for(const status of [429,503]){
    globalThis.fetch=async()=>new Response(JSON.stringify({error:'日本語のサーバーエラー'}),{status})
    await assert.rejects(streamAiChat(context,[{role:'user',content:'test'}],()=>{},code),{message:aiFailureMessage(code,status)})
  }
  globalThis.fetch=async()=>new Response('')
  await assert.rejects(streamAiChat(context,[{role:'user',content:'test'}],()=>{},code),{message:aiFailureMessage(code)})
  globalThis.fetch=async()=>{throw Error('Network failure')}
  await assert.rejects(streamAiChat(context,[{role:'user',content:'test'}],()=>{},code),{message:aiFailureMessage(code)})
}
console.log('PASS: localized busy/server/network/empty-response errors in seven languages')

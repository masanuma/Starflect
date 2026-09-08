/** Four local endpoint checks using fictional fixtures; no production requests. */
import { readFileSync, writeFileSync } from 'node:fs'
import assert from 'node:assert/strict'
const data = JSON.parse(readFileSync('docs/experiments/2026-09-08/inputs.json','utf8'))
const cases = [
  {index:1, lang:'ja', facet:'day', outlook:'good'},
  {index:4, lang:'ja', facet:'day', outlook:'careful'},
  {index:4, lang:'ja', facet:'night', outlook:'careful'},
  {index:0, lang:'en', facet:'day', outlook:'steady'},
]
const results = []
for (const c of cases) {
  const response = await fetch('http://127.0.0.1:5173/api/ai-fortune', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body:JSON.stringify({context:data.days[c.index].context, lang:c.lang, facet:c.facet,
      outlook:c.outlook, formatVersion:2, timeOfDay:c.facet === 'night'?'夜':'朝',
      messages:[{role:'user',content:c.facet==='night'?'いまのわたしの気持ちを読んで':'今日のわたしの運勢を教えて'}]}),
    signal:AbortSignal.timeout(60_000),
  })
  assert.equal(response.status,200)
  const text = await response.text()
  const value = JSON.parse(text.replace(/^\s*```(?:json)?\s*/, '').replace(/\s*```\s*$/, ''))
  assert.equal(value.version,2)
  assert.ok(value.headline?.length)
  assert.equal(value.paragraphs?.length,2)
  assert.equal(typeof value.caution,'string')
  assert.ok(value.questions.length <= 2)
  if(c.lang==='en') assert.ok(!/[\u3040-\u30ff]/.test(JSON.stringify(value)))
  results.push({...c,date:data.days[c.index].date,result:value})
  console.log(`${c.lang}/${c.facet}/${c.outlook}: ${value.headline}`)
}
writeFileSync('docs/experiments/2026-09-08/live-editorial-check-round2.json',JSON.stringify(results,null,2)+'\n')

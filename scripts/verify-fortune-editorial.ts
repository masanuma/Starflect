import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseFortuneReading, fortunePlainText, fortuneOutlook } from '../src/lib/fortuneReading'
import { saveFortune, todaysFortune, type CompanionState } from '../src/lib/companion'
import { buildEditorialFortune } from '../server/fortuneEditorial'

const inputs = JSON.parse(readFileSync('docs/experiments/2026-09-08/inputs.json', 'utf8'))
const edited = JSON.parse(readFileSync('docs/experiments/2026-09-08/edited-new.json', 'utf8'))
const value = { version: 2, headline: edited[4].title, paragraphs: edited[4].body.split('\n\n'), caution:'', questions:edited[4].questions }
const text = JSON.stringify(value)
assert.deepEqual(parseFortuneReading(text), value)
assert.deepEqual(parseFortuneReading('```json\n' + text + '\n```'), value)
for (const invalid of ['{', text.slice(0,-4), 'null', JSON.stringify({...value, paragraphs:[42]}), JSON.stringify({...value,headline:''})]) {
  assert.equal(parseFortuneReading(invalid), null)
}
assert.equal(parseFortuneReading('以前の占いです。'), null)
assert.equal(fortunePlainText('以前の占いです。'), '以前の占いです。')
assert.ok(fortunePlainText(text).startsWith(value.headline))
assert.ok(!fortunePlainText(text).includes('questions'))
assert.ok(!fortunePlainText(text).includes(value.questions[0]))
assert.equal(fortuneOutlook(inputs.days[4].fortune.toneLevel), 'careful')
assert.equal(fortuneOutlook(inputs.days[1].fortune.toneLevel), 'good')
assert.equal(fortuneOutlook(inputs.days[0].fortune.toneLevel), 'steady')

const cache = new Map<string,string>()
Object.assign(globalThis, {localStorage:{ getItem:(key:string)=>cache.get(key) ?? null, setItem:(key:string,v:string)=>cache.set(key,v) }})
const now = new Date('2026-09-13T08:00:00+09:00')
const original = { daily: {} } as CompanionState
const saved = saveFortune(original,text,['same basis'],'ja',now,'day',-2)
const reading = todaysFortune(saved,'ja',now,'day')!
assert.equal(reading.text,text)
assert.equal(reading.toneLevel,-2)
assert.equal(saveFortune(saved,'replacement',[],'ja',now,'day',2),saved)
const withEnglish = saveFortune(saved,'legacy english',[],'en',now,'day',-2)
assert.equal(todaysFortune(withEnglish,'ja',now,'day')!.text,text)
assert.equal(todaysFortune(withEnglish,'en',now,'day')!.text,'legacy english')
assert.equal(todaysFortune(withEnglish,'ja',now,'night'),undefined)
const system = buildEditorialFortune({context:inputs.days[4].context, messages:[], outlook:'careful', facet:'night', formatVersion:2})
assert.ok(system.includes('いまは夜の面'))
assert.ok(system.includes('"outlook":"careful"'))
console.log('PASS: structure, truncated responses, legacy text, sharing, three outlooks, stable cache, language/night separation, night prompt')

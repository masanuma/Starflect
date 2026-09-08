/** Isolated editorial experiment. Does not modify app code or call production endpoints.
 * Prepare: node --import tsx scripts/prototype-week.ts
 * Generate (14 bounded calls, resumes saved results):
 * node --env-file=.env --import tsx scripts/prototype-week.ts --generate
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import { createHash } from 'node:crypto'
import ts from 'typescript'
import Anthropic from '@anthropic-ai/sdk'
import { localToDate, eclipticLongitude, isRetrograde, signIndex } from '../src/lib/astro'
import { PRO_PLANETS, getPlanet } from '../src/lib/planets'
import { signKeywords, signName } from '../src/lib/signs'
import { starTypeOf } from '../src/lib/startypes'
import { readFortune } from '../src/lib/fortune'

const out = resolve('docs/experiments/2026-09-08')
mkdirSync(out, { recursive: true })
const source = readFileSync('server/handlers.ts', 'utf8')
// Evaluate a transpiled in-memory copy to access the exact current prompt builder.
// No source file exports or application behavior are changed.
const compiled = ts.transpileModule(source + '\nexport { buildFortuneSystem, AI_MODEL };', {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText
const mod = { exports: {} as any }
runInNewContext(compiled, {
  module: mod, exports: mod.exports, require: createRequire(resolve('server/handlers.ts')),
  process, console, setTimeout, clearTimeout,
})
const { buildFortuneSystem, AI_MODEL } = mod.exports
const birth = localToDate('1990-05-15', '12:00', 9)
const natal = PRO_PLANETS.map(key => ({
  key, lon: eclipticLongitude(getPlanet(key).body!, birth),
  retro: key !== 'sun' && key !== 'moon' && isRetrograde(getPlanet(key).body!, birth),
}))
const star = starTypeOf(natal[0].lon, natal[1].lon)
const base = {
  name: '', dateLabel: '1990年5月15日',
  starTypeName: star.type.name, starTypeCopy: star.type.copy,
  planets: natal.map(p => ({
    label: getPlanet(p.key).name, role: getPlanet(p.key).role,
    sign: signName(signIndex(p.lon)), traits: signKeywords(signIndex(p.lon)),
    deg: p.lon % 30, retro: p.retro,
  })),
}
const editorial = readFileSync(resolve(out, 'new-editorial-prompt.md'), 'utf8')
const days = Array.from({ length: 7 }, (_, index) => {
  const date = `2026-09-${String(9 + index).padStart(2, '0')}`
  const when = localToDate(date, '08:00', 9)
  const fortune = readFortune(natal, 'today', when)
  const context = { ...base, periods: [{ label: '今日', sky: fortune.skyNote,
    tone: fortune.toneLabel, items: fortune.items.map(i => i.title) }] }
  const oldSystem = buildFortuneSystem(context, 'ja', undefined, undefined, '朝', 'day', index === 0)
  // Same natal traits/transit facts, with a different editorial instruction and output shape.
  const newSystem = editorial + '\n\n【今回の確定材料】\n' + JSON.stringify({
    starTypeName: base.starTypeName, starTypeCopy: base.starTypeCopy,
    natalTraits: base.planets.map(p => ({ label: p.label, role: p.role, traits: p.traits, retro: p.retro })),
    transit: context.periods[0], timeOfDay: '朝', firstMeeting: index === 0,
  }, null, 2)
  return { date, evaluatedAt: when.toISOString(), firstMeeting: index === 0,
    context, fortune, oldSystem, newSystem }
})
writeFileSync(resolve(out, 'inputs.json'), JSON.stringify({
  metadata: {
    model: AI_MODEL, handlerSha256: createHash('sha256').update(source).digest('hex'),
    fictionalProfile: true, birthDate: '1990-05-15', birthTimeUnknown: true,
    approximation: '12:00 JST; ascendant omitted', readingTime: '08:00 JST',
    memory: 'none; no invented conversations or mood logs',
    method: 'same local readFortune top-four transits and natal traits; one independent generation per day/version',
    generatedDateNotProvidedToEitherModel: true,
  }, natal, days,
}, null, 2) + '\n')
console.log(JSON.stringify(days.map(d => ({date:d.date, tone:d.fortune.toneLabel, items:d.context.periods[0].items})), null, 2))

if (process.argv.includes('--generate')) {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is not configured')
  const client = new Anthropic({ maxRetries: 0, timeout: 60_000 })
  const resultPath = resolve(out, 'raw-generations.json')
  const results: any[] = existsSync(resultPath) ? JSON.parse(readFileSync(resultPath, 'utf8')) : []
  for (const day of days) {
    for (const version of ['old', 'new'] as const) {
      const system = version === 'old' ? day.oldSystem : day.newSystem
      const promptHash = createHash('sha256').update(system).digest('hex')
      if (results.some(r => r.date === day.date && r.version === version && r.promptHash === promptHash)) continue
      const message = await client.messages.create({
        model: AI_MODEL, max_tokens: 1500, thinking: { type: 'adaptive' },
        output_config: { effort: 'low' }, system,
        messages: [{ role: 'user', content: '今日のわたしの運勢を教えて' }],
      })
      const text = message.content.filter(b => b.type === 'text').map(b => b.text).join('')
      if (!text.trim() || message.stop_reason !== 'end_turn') throw new Error('Incomplete generation; not saved')
      results.push({ date: day.date, version, model: message.model, promptHash,
        createdAt: new Date().toISOString(), stopReason: message.stop_reason, usage: message.usage, text })
      writeFileSync(resultPath, JSON.stringify(results, null, 2) + '\n')
      console.log(`Saved ${day.date} ${version}`)
    }
  }
}

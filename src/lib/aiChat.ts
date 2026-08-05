/** 相談チャット。server/handlers.ts の Chat* と対で管理する */

import type { Lang } from './i18n'
import type { ChartData, PlanetKey } from './types'
import { getPlanet } from './planets'
import { signName } from './signs'
import { signIndex, degInSign } from './astro'
import { findNatalAspects } from './natalAspects'
import { forecastSet } from './fortune'
import type { PeriodBrief } from './fortune'
import { starTypeOf } from './startypes'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatChartContext {
  name: string
  dateLabel: string
  placeLabel?: string
  starTypeName?: string
  starTypeCopy?: string
  planets: { label: string; role?: string; sign: string; deg: number; retro?: boolean }[]
  natalAspects?: string[]
  /** 今日〜来月＋この先数か月まで、期間ごとのトランジット見通し(全期間ぶん渡す) */
  periods: PeriodBrief[]
  reading?: string
}

/** チャートから相談チャット用のコンテキストを組み立てる(Result / Companion 共用) */
export function buildChatContext(chart: ChartData): ChatChartContext {
  const lonOf = (key: PlanetKey) => chart.planets.find((p) => p.key === key)?.lon
  const sunLon = lonOf('sun')
  const moonLon = lonOf('moon')
  const starType = sunLon !== undefined && moonLon !== undefined ? starTypeOf(sunLon, moonLon) : null
  const natalAspects = findNatalAspects(chart.planets)
  return {
    name: chart.name,
    dateLabel: chart.dateLabel,
    placeLabel: chart.placeLabel,
    starTypeName: starType?.type.name,
    starTypeCopy: starType?.type.copy,
    planets: chart.planets.map((p) => ({
      label: getPlanet(p.key).name,
      // 役割名も渡す。AIは「やる気担当の火星が」のように役割名を主にして日常語で語る
      role: getPlanet(p.key).role,
      sign: signName(signIndex(p.lon)),
      deg: degInSign(p.lon),
      retro: p.retro,
    })),
    natalAspects: natalAspects.length ? natalAspects.map((a) => a.tech) : undefined,
    // 今日〜来月＋この先数か月まで、全期間のトランジットを渡す(1期間しか無くて濁す問題を解消)
    periods: forecastSet(chart.planets),
  }
}

/** 会話履歴を保存する localStorage キー(人ごとに分ける) */
export const chatStorageKey = (chart: ChartData) => `starflect-chat:${chart.dateLabel}:${chart.name}`

/** 相性チャットに渡すふたりのデータ一式(server/handlers.ts の PairChatContext と対) */
export interface PairChatContext {
  nameA: string
  nameB: string
  typeA: string
  typeB: string
  natalA: { label: string; sign: string }[]
  natalB: { label: string; sign: string }[]
  percent: number
  nickname: string
  details: string[]
  skyNote: string
  toneA: string
  toneB: string
  aspectsA: string[]
  aspectsB: string[]
}

/** text/plain を逐次読み込む共通処理。届いた断片ごとに onDelta を呼ぶ。 */
async function postStream(url: string, body: unknown, onDelta: (text: string) => void): Promise<void> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok || !res.body) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(data?.error ?? `サーバーエラー (${res.status})`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    if (chunk) onDelta(chunk)
  }
}

/** 相談チャット(ほしキャラ本人)をストリーミングで受け取る。 */
export async function streamAiChat(
  context: ChatChartContext,
  messages: ChatMessage[],
  onDelta: (text: string) => void,
  lang?: Lang,
): Promise<void> {
  await postStream('/api/ai-chat', { context, messages, lang }, onDelta)
}

/** 相性チャット(ふたりの相性について)をストリーミングで受け取る。 */
export async function streamAiPairChat(
  context: PairChatContext,
  messages: ChatMessage[],
  onDelta: (text: string) => void,
  lang?: Lang,
): Promise<void> {
  await postStream('/api/ai-pair-chat', { context, messages, lang }, onDelta)
}

/**
 * 今日の運勢(ほしキャラが書く)をストリーミングで受け取る。
 *
 * ストリーミングにするのは、待ち時間を「読み込み中」ではなく
 * 「いま書いている」として見せたいから。1文目が早く出るほど体感が軽くなる。
 */
export async function streamAiFortune(
  context: ChatChartContext,
  onDelta: (text: string) => void,
  lang?: Lang,
): Promise<void> {
  await postStream(
    '/api/ai-fortune',
    { context, messages: [{ role: 'user', content: '今日のわたしの運勢を教えて' }], lang },
    onDelta,
  )
}

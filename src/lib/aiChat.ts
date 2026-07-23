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
  planets: { label: string; sign: string; deg: number; retro?: boolean }[]
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

/**
 * 相談チャットをストリーミングで受け取る。
 * サーバーは text/plain を逐次送ってくるので、届いた断片ごとに onDelta を呼ぶ。
 */
export async function streamAiChat(
  context: ChatChartContext,
  messages: ChatMessage[],
  onDelta: (text: string) => void,
  lang?: Lang,
): Promise<void> {
  const res = await fetch('/api/ai-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context, messages, lang }),
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

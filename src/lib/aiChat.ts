/** 相談チャット。server/handlers.ts の Chat* と対で管理する */

import type { Lang } from './i18n'

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
  periodLabel: string
  skyNote: string
  toneLabel: string
  transits: string[]
  reading?: string
}

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

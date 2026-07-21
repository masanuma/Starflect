import type { Lang } from './i18n'

/** 相性鑑定リクエスト。server/aiReading.ts の AiPairRequest と対で管理する */
export interface AiPairRequest {
  nameA: string
  nameB: string
  typeA: string
  typeB: string
  percent: number
  nickname: string
  details: string[]
  natalA: { label: string; sign: string }[]
  natalB: { label: string; sign: string }[]
  periodLabel: string
  skyNote: string
  toneA: string
  toneB: string
  aspectsA: string[]
  aspectsB: string[]
  lang?: Lang
}

async function postJson<T>(url: string, body: T): Promise<string> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await res.json().catch(() => null)) as { text?: string; error?: string } | null
  if (!res.ok || !data?.text) {
    throw new Error(data?.error ?? `サーバーエラー (${res.status})`)
  }
  return data.text
}

export const fetchAiPairReading = (req: AiPairRequest) => postJson('/api/ai-pair', req)

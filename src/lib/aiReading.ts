/** サーバー(/api/ai-reading)に送る鑑定リクエスト。server/aiReading.ts と対で管理する */
export interface AiReadingRequest {
  name: string
  periodLabel: string
  dateLabel: string
  placeLabel?: string
  natal: { label: string; sign: string; deg: number }[]
  synthesis?: string[]
  /** 出生天体同士のアスペクト(プロ級のみ) */
  natalAspects?: string[]
  toneLabel: string
  skyNote: string
  aspects: string[]
}

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

export const fetchAiReading = (req: AiReadingRequest) => postJson('/api/ai-reading', req)
export const fetchAiPairReading = (req: AiPairRequest) => postJson('/api/ai-pair', req)

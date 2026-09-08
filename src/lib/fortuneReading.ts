/** Versioned wire/storage format. Old plain-text readings remain readable. */
export interface FortuneReading {
  version: 2
  headline: string
  paragraphs: string[]
  caution: string
  questions: string[]
}

export function parseFortuneReading(text: string): FortuneReading | null {
  try {
    const value = JSON.parse(text.replace(/^\s*```(?:json)?\s*/, '').replace(/\s*```\s*$/, ''))
    const strings = (items: unknown, min: number, max: number): items is string[] =>
      Array.isArray(items) && items.length >= min && items.length <= max &&
      items.every(item => typeof item === 'string' && item.trim().length > 0 && item.length <= 2000)
    if (value?.version !== 2 || typeof value.headline !== 'string' || !value.headline.trim() ||
      value.headline.length > 200 || !strings(value.paragraphs, 1, 3) ||
      typeof value.caution !== 'string' || value.caution.length > 1000 || !strings(value.questions, 0, 2)) return null
    return { version: 2, headline: value.headline.trim(), paragraphs: value.paragraphs.map((p: string) => p.trim()),
      caution: value.caution.trim(), questions: value.questions.map((q: string) => q.trim()) }
  } catch { return null }
}

/** Sharing and retrospective excerpts must never expose JSON or consultation buttons. */
export function fortunePlainText(text: string): string {
  const reading = parseFortuneReading(text)
  return reading ? [reading.headline, ...reading.paragraphs, reading.caution].filter(Boolean).join('\n\n') : text
}

export type FortuneOutlook = 'good' | 'steady' | 'careful'
export const fortuneOutlook = (level: number): FortuneOutlook => level > 0 ? 'good' : level < 0 ? 'careful' : 'steady'

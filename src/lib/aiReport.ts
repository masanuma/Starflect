/** ごほうび地図の「発見レポート」。server/handlers.ts の createReportHandler と対で管理する */

import type { Lang } from './i18n'
import type { ChatChartContext } from './aiChat'
import type { BehaviorBrief } from './companion'

export type ReportTopic = 'moonBack' | 'partyDeep' | 'moodTrend' | 'hiddenSelf'

/** 生成済みレポートを保存する localStorage キー(人×トピックごと) */
const reportKey = (context: ChatChartContext, topic: ReportTopic) =>
  `starflect-report:${context.dateLabel}:${context.name}:${topic}`

/** キャッシュ済みの発見レポートを読む(無ければ null) */
export function loadReport(context: ChatChartContext, topic: ReportTopic): string | null {
  try {
    return localStorage.getItem(reportKey(context, topic))
  } catch {
    return null
  }
}

/**
 * 発見レポートを取得する。初回はサーバーで生成し、以降はローカルキャッシュから即返す。
 * コストは「宝箱を開いたときの1回だけ」に抑える設計。
 */
export async function fetchAiReport(
  context: ChatChartContext,
  topic: ReportTopic,
  behavior?: BehaviorBrief,
  lang?: Lang,
): Promise<string> {
  const cached = loadReport(context, topic)
  if (cached) return cached

  const res = await fetch('/api/ai-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context, topic, behavior, lang }),
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(data?.error ?? `サーバーエラー (${res.status})`)
  }
  const data = (await res.json()) as { text?: string }
  const text = (data.text ?? '').trim()
  if (text) {
    try {
      localStorage.setItem(reportKey(context, topic), text)
    } catch {
      /* 保存できない環境では無視(次回また生成) */
    }
  }
  return text
}

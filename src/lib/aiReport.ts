/** ごほうび地図の「発見レポート」。server/handlers.ts の createReportHandler と対で管理する */

import { getLang, type Lang } from './i18n'
import type { ChatChartContext } from './aiChat'
import type { AirBrief, BehaviorBrief } from './companion'

export type ReportTopic = 'moonBack' | 'partyDeep' | 'moodTrend' | 'hiddenSelf' | 'trueBuddy'

/** 生成済みレポートを保存する localStorage キー(人×トピックごと) */
const reportKey = (context: ChatChartContext, topic: ReportTopic, lang:Lang) =>
  `starflect-report:${context.dateLabel}:${context.name}:${topic}:lang=${lang}`

/** キャッシュ済みの発見レポートを読む(無ければ null) */
export function loadReport(context: ChatChartContext, topic: ReportTopic, lang:Lang=getLang()): string | null {
  try {
    return localStorage.getItem(reportKey(context, topic, lang))
  } catch {
    return null
  }
}

/** Old entries have no language metadata. Preserve them as an explicitly labelled archive. */
export function loadLegacyReport(context:ChatChartContext,topic:ReportTopic):string|null {
  try { return localStorage.getItem(`starflect-report:${context.dateLabel}:${context.name}:${topic}`) } catch { return null }
}
export const legacyReportLabel:Record<Lang,string>={ja:'以前の手紙（保存時の言語）',en:'Earlier letter (original language)',es:'Carta anterior (idioma original)',fr:'Ancienne lettre (langue d’origine)',it:'Lettera precedente (lingua originale)',pt:'Carta anterior (idioma original)',ko:'이전 편지 (저장 당시 언어)'}

/**
 * 発見レポートを取得する。初回はサーバーで生成し、以降はローカルキャッシュから即返す。
 * コストは「宝箱を開いたときの1回だけ」に抑える設計。
 */
export async function fetchAiReport(
  context: ChatChartContext,
  topic: ReportTopic,
  behavior?: BehaviorBrief,
  lang: Lang = getLang(),
  /** `trueBuddy` 用の記憶。圧縮済みの言葉だけで、生の会話は含まない */
  memory?: { persona?: string[]; air?: AirBrief },
): Promise<string> {
  const cached = loadReport(context, topic, lang)
  if (cached) return cached

  const res = await fetch('/api/ai-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context, topic, behavior, lang, ...memory }),
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(data?.error ?? `サーバーエラー (${res.status})`)
  }
  const data = (await res.json()) as { text?: string }
  const text = (data.text ?? '').trim()
  if (text) {
    try {
      localStorage.setItem(reportKey(context, topic, lang), text)
    } catch {
      /* 保存できない環境では無視(次回また生成) */
    }
  }
  return text
}

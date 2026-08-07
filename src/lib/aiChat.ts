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
import type { AirBrief, BehaviorBrief } from './companion'

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
 * ふたりの相性の読み(相性と「今日のふたり」をひとつづきで)をストリーミングで受け取る。
 * ソロと違い**保存しない**＝占い直せる。言い回しは変わるが本筋はぶれない。
 */
export async function streamAiPairFortune(
  context: PairChatContext,
  onDelta: (text: string) => void,
  lang?: Lang,
): Promise<void> {
  await postStream(
    '/api/ai-pair-fortune',
    { context, messages: [{ role: 'user', content: 'ふたりの相性を教えて' }], lang },
    onDelta,
  )
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
  /** 端末に貯めた記録を言葉に変えたもの(記憶の層2)。生の回数・日数は含まない */
  air?: AirBrief,
  /** 全期間を圧縮した「人となり」。圧縮済みの短い文だけ(生の会話は含まない) */
  persona?: string[],
): Promise<void> {
  await postStream(
    '/api/ai-fortune',
    { context, messages: [{ role: 'user', content: '今日のわたしの運勢を教えて' }], lang, air, persona },
    onDelta,
  )
}

/* ---------- 人となり(記憶の圧縮) ---------- */

/** 圧縮に渡す発言の数。古いものより最近のほうが「いまのその人」に近い */
const PERSONA_MAX_SAYS = 40
/** 1発言の長さの上限。長文をそのまま送るとトークンを食う */
const PERSONA_MAX_LEN = 120

/**
 * 保存済みの会話から、その人自身の発言だけを取り出す。
 *
 * ほしキャラ側の発言は入れない — それはAIが書いた言葉であって、その人の材料ではない。
 * ここで取り出した生ログを見てよいのは**圧縮AIだけ**（`/api/ai-persona`）。
 * 運勢AIに届くのは圧縮後の短い文だけ。
 */
export function userSays(chart: ChartData): string[] {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(chatStorageKey(chart))
  } catch {
    return []
  }
  if (!raw) return []
  try {
    const messages = JSON.parse(raw) as ChatMessage[]
    return messages
      .filter((m) => m.role === 'user' && m.content.trim())
      .map((m) => m.content.trim().slice(0, PERSONA_MAX_LEN))
      .slice(-PERSONA_MAX_SAYS)
  } catch {
    return []
  }
}

/**
 * 会話と行動記録から「人となり」を作らせる。
 * 画面には出さないので、届いた分をためて改行で割るだけ。
 */
export async function fetchPersona(
  says: string[],
  behavior?: BehaviorBrief,
  /** 1日1問の二択で選んだもの（日本語ラベル） */
  picks?: string[],
): Promise<string[]> {
  let acc = ''
  await postStream(
    '/api/ai-persona',
    { context: { says, behavior, picks }, messages: [{ role: 'user', content: 'この人の人となりをまとめて' }] },
    (delta) => {
      acc += delta
    },
  )
  return acc
    .split('\n')
    .map((l) => l.replace(/^[-・*\s]+/, '').trim())
    .filter(Boolean)
}

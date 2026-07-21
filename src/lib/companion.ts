import type { ChartData } from './types'
import { getLang } from './i18n'
import type { Lang } from './i18n'

/**
 * 「星の相棒」データ層(MVP v0.1)。
 * すべて端末内(localStorage)に保存。アカウント・クラウド同期は将来。
 * 罰なし設計: 開かない日があっても状態は減らない・キャラは弱らない。
 */

export type Mood = 'good' | 'meh' | 'bad'
export type Domain = 'work' | 'love' | 'people' | 'other'

export interface DailyEntry {
  mood: Mood
  domain?: Domain
  /** その日の「今日の星」カードを見たか */
  forecastSeen?: boolean
}

export interface CompanionState {
  /** 相棒＝あなたのほしキャラの土台になる診断データ */
  chart: ChartData
  /** ほしキャラのスラッグ(例: 'earth_fire')。解析・表示用 */
  starType: string
  /** 迎え入れた日(ISO) */
  createdAt: string
  /** 最後に開いた日(ISO) */
  lastVisitAt: string
  /** 日付キー 'YYYY-MM-DD' → その日の記録 */
  daily: Record<string, DailyEntry>
}

const STORAGE_KEY = 'starflect-companion:v1'

/** ローカル日付の 'YYYY-MM-DD'(タイムゾーンはブラウザ依存) */
export function todayKey(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function loadCompanion(): CompanionState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as CompanionState
  } catch {
    return null
  }
}

export function saveCompanion(state: CompanionState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* 保存できない環境(プライベートモード等)では無視 */
  }
}

export function hasCompanion(): boolean {
  return loadCompanion() !== null
}

/** 相棒を迎え入れる(初回のみ)。既にいれば chart だけ更新して保持 */
export function createCompanion(chart: ChartData, starType: string, now: Date = new Date()): CompanionState {
  const existing = loadCompanion()
  const iso = now.toISOString()
  const state: CompanionState = existing
    ? { ...existing, chart, starType }
    : { chart, starType, createdAt: iso, lastVisitAt: iso, daily: {} }
  saveCompanion(state)
  return state
}

/** 前回訪問からの経過日数(暦日ベース)。初回や不明時は 0 */
export function daysSinceLastVisit(state: CompanionState, now: Date = new Date()): number {
  const last = new Date(state.lastVisitAt)
  if (isNaN(last.getTime())) return 0
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const b = new Date(last.getFullYear(), last.getMonth(), last.getDate()).getTime()
  return Math.max(0, Math.round((a - b) / 86_400_000))
}

/** 訪問を記録して lastVisitAt を更新。更新前の経過日数を返す(挨拶の出し分けに使う) */
export function touchVisit(state: CompanionState, now: Date = new Date()): { state: CompanionState; daysSince: number } {
  const daysSince = daysSinceLastVisit(state, now)
  const next = { ...state, lastVisitAt: now.toISOString() }
  saveCompanion(next)
  return { state: next, daysSince }
}

/** 「今日の星」カードを見たことを記録(週末まとめ・解析用) */
export function markForecastSeen(state: CompanionState, now: Date = new Date()): CompanionState {
  const key = todayKey(now)
  const prev = state.daily[key]
  if (prev?.forecastSeen) return state
  const next: CompanionState = {
    ...state,
    daily: { ...state.daily, [key]: { ...prev, forecastSeen: true } as DailyEntry },
  }
  saveCompanion(next)
  return next
}

/** 日付から決定論的に「今日のラッキーカラー」を選ぶ(毎日変わる小さな報酬。テンプレ＝AIなし) */
const DAY_COLORS = ['#EA6596', '#8A63DD', '#E8A93A', '#2FA2B0', '#C93B72', '#6A45C4', '#3E9B7A', '#D98324']
const COLOR_NAMES: Record<Lang, string[]> = {
  ja: ['ローズピンク', 'ラベンダー', 'ゴールド', 'ターコイズ', 'マゼンタ', 'バイオレット', 'エメラルド', 'オレンジ'],
  en: ['rose pink', 'lavender', 'gold', 'turquoise', 'magenta', 'violet', 'emerald', 'orange'],
  es: ['rosa', 'lavanda', 'dorado', 'turquesa', 'magenta', 'violeta', 'esmeralda', 'naranja'],
  fr: ['rose', 'lavande', 'doré', 'turquoise', 'magenta', 'violet', 'émeraude', 'orange'],
  it: ['rosa', 'lavanda', 'oro', 'turchese', 'magenta', 'viola', 'smeraldo', 'arancione'],
  pt: ['rosa', 'lavanda', 'dourado', 'turquesa', 'magenta', 'violeta', 'esmeralda', 'laranja'],
  ko: ['로즈핑크', '라벤더', '골드', '터콰이즈', '마젠타', '바이올렛', '에메랄드', '오렌지'],
}
function colorIndex(key: string): number {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return h % DAY_COLORS.length
}
export function todayColor(key: string = todayKey()): string {
  return DAY_COLORS[colorIndex(key)]
}
export function todayColorName(key: string = todayKey(), lang: Lang = getLang()): string {
  return (COLOR_NAMES[lang] ?? COLOR_NAMES.ja)[colorIndex(key)]
}

export interface WeekAggregate {
  /** タップした日数(直近7日) */
  total: number
  good: number
  meh: number
  bad: number
  /** しんどかった日にいちばん多かった領域(あれば) */
  topBadDomain?: Domain
}

/** 直近7日のタップを集計(週末まとめ・簡易“見抜き”用)。相関統計はv0.2、ここは単純カウント。 */
export function weekAggregate(state: CompanionState, now: Date = new Date()): WeekAggregate {
  let good = 0
  let meh = 0
  let bad = 0
  let total = 0
  const badDomains: Partial<Record<Domain, number>> = {}
  for (let i = 0; i < 7; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const e = state.daily[todayKey(d)]
    if (!e?.mood) continue
    total++
    if (e.mood === 'good') good++
    else if (e.mood === 'bad') {
      bad++
      if (e.domain) badDomains[e.domain] = (badDomains[e.domain] ?? 0) + 1
    } else meh++
  }
  let topBadDomain: Domain | undefined
  let max = 0
  for (const [k, v] of Object.entries(badDomains)) {
    if ((v ?? 0) > max) {
      max = v ?? 0
      topBadDomain = k as Domain
    }
  }
  return { total, good, meh, bad, topBadDomain }
}

/** その日の気分タップを記録 */
export function recordMood(
  state: CompanionState,
  mood: Mood,
  domain?: Domain,
  now: Date = new Date(),
): CompanionState {
  const key = todayKey(now)
  const prev = state.daily[key]
  const next: CompanionState = {
    ...state,
    daily: { ...state.daily, [key]: { ...prev, mood, domain } },
  }
  saveCompanion(next)
  return next
}

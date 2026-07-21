import type { ChartData } from './types'

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

/** 日付から決定論的に「今日の色」を選ぶ(毎日変わる小さな報酬。テンプレ＝AIなし) */
const DAY_COLORS = ['#EA6596', '#8A63DD', '#E8A93A', '#2FA2B0', '#C93B72', '#6A45C4', '#3E9B7A', '#D98324']
export function todayColor(key: string = todayKey()): string {
  let h = 0
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0
  return DAY_COLORS[h % DAY_COLORS.length]
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

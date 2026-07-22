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
  /**
   * 累計シグナル(=「ごほうび地図」の通貨)。使うほど貯まる一方で、減らない・罰しない。
   * 連打で薄く稼げないよう、気分は「その日はじめて残したとき」だけ+1・会話は1往復+1・運勢閲覧は1日+1で数える。
   * 旧データ(このフィールド無し)は daily から推定して補完する(currentSignals)。
   */
  signals?: number
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

/**
 * 旧データ(signals 未保存)向けに、これまでの記録から現在のシグナルを推定する。
 * 気分を残した日 +1 / 運勢を見た日 +1 で概算(会話は履歴を持たないので数えない)。
 */
function backfillSignals(state: CompanionState): number {
  let n = 0
  for (const e of Object.values(state.daily)) {
    if (e.mood) n++
    if (e.forecastSeen) n++
  }
  return n
}

/** 現在の累計シグナル(未保存なら旧データから推定) */
export function currentSignals(state: CompanionState): number {
  return state.signals ?? backfillSignals(state)
}

/** 会話1往復ぶんのシグナルを加算(端末の最新状態に対して。相棒が居ないときは何もしない) */
export function earnChatSignal(): void {
  const s = loadCompanion()
  if (!s) return
  saveCompanion({ ...s, signals: currentSignals(s) + 1 })
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
  const base = loadCompanion() ?? state
  const daysSince = daysSinceLastVisit(base, now)
  const next = { ...base, lastVisitAt: now.toISOString() }
  saveCompanion(next)
  return { state: next, daysSince }
}

/** 「今日の星」カードを見たことを記録(週末まとめ・解析用)。その日はじめてなら +1 シグナル */
export function markForecastSeen(state: CompanionState, now: Date = new Date()): CompanionState {
  // 端末の最新状態を土台にする(訪問記録やタップと相互に上書きし合わないように)
  const base = loadCompanion() ?? state
  const key = todayKey(now)
  const prev = base.daily[key]
  if (prev?.forecastSeen) return base
  const next: CompanionState = {
    ...base,
    signals: currentSignals(base) + 1,
    daily: { ...base.daily, [key]: { ...prev, forecastSeen: true } as DailyEntry },
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

/**
 * ごほうび地図(縦ロードマップ)の宝箱。
 * at = 解放に必要な累計シグナル。key は表示テキスト(ui.ts の map.tiers)と対応。
 * content: 'ready' = 中身を今すぐ見られる / 'soon' = 予告(地図に鍵つきで見せておく=売り)。
 * しきい値は運用しながら調整する前提の暫定値。
 */
export interface Milestone {
  at: number
  key: string
  content: 'ready' | 'soon'
}

export const MILESTONES: Milestone[] = [
  { at: 0, key: 'birth', content: 'ready' },
  { at: 3, key: 'moonBack', content: 'ready' },
  { at: 10, key: 'partyDeep', content: 'soon' },
  { at: 25, key: 'moodTrend', content: 'soon' },
  { at: 50, key: 'hiddenSelf', content: 'soon' },
  { at: 100, key: 'trueBuddy', content: 'soon' },
]

export interface MapProgress {
  signals: number
  /** 各宝箱に「解放済みか」を添えた一覧(表示順) */
  tiers: Array<Milestone & { unlocked: boolean }>
  /** 次に解放される宝箱(全部解放済みなら undefined) */
  next?: Milestone
  /** 次の宝箱まであと何シグナルか(0 = もう手が届いている) */
  remaining: number
}

/** 累計シグナルから、地図の解放状況と「次の宝箱まであと◯」を求める */
export function mapProgress(signals: number): MapProgress {
  const tiers = MILESTONES.map((m) => ({ ...m, unlocked: signals >= m.at }))
  const next = MILESTONES.find((m) => signals < m.at)
  return { signals, tiers, next, remaining: next ? next.at - signals : 0 }
}

/** その日の気分タップを記録。その日はじめて気分を残したときだけ +1 シグナル(連打では増えない) */
export function recordMood(
  state: CompanionState,
  mood: Mood,
  domain?: Domain,
  now: Date = new Date(),
): CompanionState {
  const base = loadCompanion() ?? state
  const key = todayKey(now)
  const prev = base.daily[key]
  const firstToday = !prev?.mood
  const next: CompanionState = {
    ...base,
    signals: currentSignals(base) + (firstToday ? 1 : 0),
    daily: { ...base.daily, [key]: { ...prev, mood, domain } },
  }
  saveCompanion(next)
  return next
}

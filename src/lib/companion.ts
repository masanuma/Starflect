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

/**
 * その日の運勢（AIが書いたもの）。
 *
 * **1日1本・引き直し不可**。一度書いたものを保存して、同じ日に何度開いても同じものを見せる。
 * （毎回違うことを言うと「適当だ」と思われる。深掘りしたい人は相談室へ流す）
 * 言語ごとに別で持つ＝日本語で書いたものと英語で書いたものは別物として扱う。
 */
export interface SavedFortune {
  /** 本文 */
  text: string
  /** 書いた時刻(ISO) */
  writtenAt: string
  /**
   * 根拠に使った星の並び（技術表記のまま）。
   * 「なぜならば」を見たい人への提示と、答え合わせのときの手がかりに使う。
   */
  basis: string[]
}

/**
 * 運勢の答え合わせ。**その運勢が書かれた日**の記録として持つ（聞いた日ではない）。
 * `skip` は「聞いたけど答えなかった」＝二度は聞かないための記録で、手応えの集計からは外す。
 */
export type Hit = 'hit' | 'soso' | 'miss' | 'dunno' | 'skip'

/**
 * 全期間の記録を圧縮した「人となり」＝記憶の層2の第2の窓。
 *
 * 「いまの空気」が**直近5回の変化**を見るのに対し、こちらは**全期間の傾向**を見る。
 * 材料は会話ログと行動記録（＝層1）だが、**層1を見てよいのは圧縮AIだけ**で、
 * 運勢を書くAIにはこの `lines`（圧縮後の言葉）しか渡らない。
 *
 * 固有名詞・出来事・日付・数は含めない。含めた瞬間に「知ってくれてる」が「監視されてる」に変わる。
 */
export interface Persona {
  /** 3〜4個の短い文。日本語1本で持つ（プロンプトが日本語なので全言語で使える） */
  lines: string[]
  writtenAt: string
  /** 要約に使った会話の往復数。次に作り直すかの判定に使う */
  basedOn: number
}

export interface DailyEntry {
  /** その日の気分。運勢だけ保存して気分は未記録の日があるので任意 */
  mood?: Mood
  domain?: Domain
  /** その日の「今日の星」カードを見たか */
  forecastSeen?: boolean
  /** その日の運勢（言語ごとに1本） */
  fortune?: Partial<Record<Lang, SavedFortune>>
  /** その日の運勢の答え合わせ（後日1回だけ聞く） */
  hit?: Hit
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
  /** 最後に答え合わせを「聞いた」日(ISO)。毎日は聞かないためのクールダウンに使う */
  lastHitAskAt?: string
  /** 全期間の記録を圧縮した「人となり」(層2の第2の窓) */
  persona?: Persona
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
    // 容量オーバーの可能性があるので、いちばん重い「保存した運勢」を7日ぶんまで削って一度だけ再試行する。
    // 気分・領域の記録は軽いうえ「いまの空気」の材料なので消さない。
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pruneFortunes(state, new Date(), 7)))
    } catch {
      /* それでも保存できない環境(プライベートモード等)では無視 */
    }
  }
}

export function hasCompanion(): boolean {
  return loadCompanion() !== null
}

/** 出生データが同じ人かどうか(生年月日＋時刻＋場所で見る) */
const sameChart = (a: ChartData, b: ChartData) => a.dateLabel === b.dateLabel && a.placeLabel === b.placeLabel

/** 運勢とその答え合わせを落とす。答え合わせは運勢に対する評価なので、運勢を捨てるなら道連れにする */
function stripFortune(entry: DailyEntry): DailyEntry {
  const { fortune: _f, hit: _h, ...rest } = entry
  return rest
}

/** 気分・領域・訪問の記録が何も無い＝残す意味が無い日か */
function isEmptyEntry(e: DailyEntry): boolean {
  return e.mood === undefined && e.domain === undefined && e.forecastSeen === undefined
}

/**
 * 相棒を迎え入れる(初回のみ)。既にいれば chart だけ更新して保持。
 *
 * ⚠️ **出生データが変わったら、保存済みの運勢は捨てる**。
 * 運勢はその出生図に対して書かれたものなので、別の生年月日で占い直したときに
 * 残っていると**前の人の運勢がそのまま表示される**（引き直し不可の判定に引っかかって再生成もされない）。
 * 気分・領域の記録は本人の行動なので残す。
 */
export function createCompanion(chart: ChartData, starType: string, now: Date = new Date()): CompanionState {
  const existing = loadCompanion()
  const iso = now.toISOString()
  let state: CompanionState
  if (!existing) {
    state = { chart, starType, createdAt: iso, lastVisitAt: iso, daily: {} }
  } else if (sameChart(existing.chart, chart)) {
    state = { ...existing, chart, starType }
  } else {
    const daily: Record<string, DailyEntry> = {}
    for (const [key, entry] of Object.entries(existing.daily)) {
      const rest = stripFortune(entry)
      if (isEmptyEntry(rest)) continue
      daily[key] = rest
    }
    // 「人となり」も前の人のもの。会話ログは生年月日＋名前でキーが分かれるので自動で切り替わるが、
    // これは相棒の状態に乗っているので明示的に捨てる
    const { persona: _drop, ...keep } = existing
    state = { ...keep, chart, starType, daily }
  }
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
  /** ready=テンプレ即表示 / ai=AIが専用レポートを生成 / soon=準備中(未実装) */
  content: 'ready' | 'ai' | 'soon'
}

export const MILESTONES: Milestone[] = [
  { at: 0, key: 'birth', content: 'ready' },
  { at: 3, key: 'moonBack', content: 'ai' },
  { at: 10, key: 'partyDeep', content: 'ai' },
  { at: 25, key: 'moodTrend', content: 'ai' },
  { at: 50, key: 'hiddenSelf', content: 'ai' },
  { at: 100, key: 'trueBuddy', content: 'soon' },
]

/** 発見レポート(気分のクセ・隠れた自分)に渡す、行動ログの実測サマリ */
export interface BehaviorBrief {
  days: number
  good: number
  meh: number
  bad: number
  topDomains: string[]
  sinceDays: number
}

const DOMAIN_JA: Record<Domain, string> = { work: '仕事', love: '恋愛', people: '人間関係', other: 'その他' }

/** これまでの気分タップを集計(全期間)。AI発見レポートの「行動の実測」として使う */
export function behaviorBrief(state: CompanionState, now: Date = new Date()): BehaviorBrief {
  let good = 0
  let meh = 0
  let bad = 0
  let days = 0
  const dom: Partial<Record<Domain, number>> = {}
  for (const e of Object.values(state.daily)) {
    if (!e.mood) continue
    days++
    if (e.mood === 'good') good++
    else if (e.mood === 'bad') bad++
    else meh++
    if (e.domain) dom[e.domain] = (dom[e.domain] ?? 0) + 1
  }
  const topDomains = Object.entries(dom)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .slice(0, 2)
    .map(([k]) => DOMAIN_JA[k as Domain])
  const created = new Date(state.createdAt)
  const sinceDays = isNaN(created.getTime())
    ? 0
    : Math.max(0, Math.round((now.getTime() - created.getTime()) / 86_400_000))
  return { days, good, meh, bad, topDomains, sinceDays }
}

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
/* ---------- その日の運勢の保存（1日1本・引き直し不可） ---------- */

/** 保存した運勢を残す日数。これより古いものは本文だけ捨てる（気分の記録は残す） */
const FORTUNE_KEEP_DAYS = 30

/**
 * 古い運勢の本文だけを捨てる（純粋関数）。
 *
 * 気分・領域・訪問の記録は**捨てない**。軽いうえに「いまの空気」の材料になるため。
 * 捨てるのは本文（1本200字前後）だけで、30日ぶんでも数KBに収まる。
 */
export function pruneFortunes(state: CompanionState, now: Date = new Date(), keepDays = FORTUNE_KEEP_DAYS): CompanionState {
  const limit = todayKey(new Date(now.getTime() - keepDays * 86_400_000))
  const daily: Record<string, DailyEntry> = {}
  for (const [key, entry] of Object.entries(state.daily)) {
    if (key >= limit || !entry.fortune) {
      daily[key] = entry
      continue
    }
    const rest = stripFortune(entry)
    // 本文しか無かった日は、まるごと捨てて構わない
    if (isEmptyEntry(rest)) continue
    daily[key] = rest
  }
  return { ...state, daily }
}

/** その日ぶんの運勢を保存する。すでにある場合は**上書きしない**（引き直し不可） */
export function saveFortune(
  state: CompanionState,
  text: string,
  basis: string[],
  lang: Lang = getLang(),
  now: Date = new Date(),
): CompanionState {
  const key = todayKey(now)
  const entry = state.daily[key] ?? {}
  if (entry.fortune?.[lang]) return state /* すでに今日の分がある＝引き直させない */
  const next: CompanionState = {
    ...state,
    daily: {
      ...state.daily,
      [key]: {
        ...entry,
        fortune: { ...entry.fortune, [lang]: { text, writtenAt: now.toISOString(), basis } },
      },
    },
  }
  const pruned = pruneFortunes(next, now)
  saveCompanion(pruned)
  return pruned
}

/** その日ぶんの運勢（未生成なら undefined） */
export function todaysFortune(
  state: CompanionState,
  lang: Lang = getLang(),
  now: Date = new Date(),
): SavedFortune | undefined {
  return state.daily[todayKey(now)]?.fortune?.[lang]
}

/**
 * 直近の「過去の」運勢＝答え合わせで振り返る対象。
 *
 * 「昨日」に限定しない。間が空く人がいるので、**直近の1本**を日付つきで返す。
 * 何日前まで聞くかは呼び出し側で決める（古すぎる話を振ると気持ち悪いため）。
 */
export function latestPastFortune(
  state: CompanionState,
  lang: Lang = getLang(),
  now: Date = new Date(),
): { dateKey: string; daysAgo: number; fortune: SavedFortune } | undefined {
  const today = todayKey(now)
  const past = Object.entries(state.daily)
    .filter(([key, e]) => key < today && e.fortune?.[lang])
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
  const hit = past[0]
  if (!hit) return undefined
  const [dateKey, entry] = hit
  const diff = Math.round((new Date(today).getTime() - new Date(dateKey).getTime()) / 86_400_000)
  return { dateKey, daysAgo: diff, fortune: entry.fortune![lang]! }
}

/* ---------- 層2「いまの空気」＝AIに渡す記憶 ---------- */

/**
 * 記憶の3層。
 * ```
 * 層1  生の記録        端末に貯める。AIには絶対に渡さない
 * 層2  「いまの空気」   直近だけを見て、言葉に変える  ← ここ
 * 層3  AIが喋る        層2を素材に、自然に混ぜる。触れないことも選べる
 * ```
 * **数を渡すからAIが数えて言ってしまう。渡すものを言葉にすれば数えようがない。**
 * だからこの型のフィールドはすべて「言葉」で、数値は1つも持たない。
 *
 * さらに**言わないことも設計のうち**：変化が無いとき・偏りが無いときは
 * その項目ごと `undefined` にして渡さない。「いつもどおりですね」と毎日言われるのは、
 * 見てくれている証ではなく監視されている感覚になる。
 */
export interface AirBrief {
  /** 気分の流れ。「いつもどおり」のときは渡さない */
  mood?: string
  /** 気になっていること。偏りが無ければ渡さない */
  focus?: string
  /** ひさしぶり感。3日以上空いたときだけ */
  gap?: string
  /** 占いの手応え（答え合わせの蓄積から） */
  hit?: string
}

/** 「いまの空気」を見る窓。日数ではなく**回数**で切る（週1の人の記憶が消えないように） */
const AIR_WINDOW = 5
/** これより古い記録はノイズなので見ない */
const AIR_MAX_DAYS = 30
/** 気分がこの数に満たなければ、流れとは呼べないので何も渡さない */
const AIR_MIN_MOODS = 3
/**
 * 手応えは気分より集まりにくい（答え合わせは毎日は聞かない）ので、しきい値を1つ下げる。
 * 3件を待つと、実質いつまでも渡らない。
 */
const AIR_MIN_HITS = 2

const MOOD_SCORE: Record<Mood, number> = { good: 1, meh: 0, bad: -1 }
const HIT_SCORE: Partial<Record<Hit, number>> = { hit: 1, soso: 0, miss: -1 }

/** 直近の記録を新しい順に。30日より古いものは捨てる */
function recentEntries(state: CompanionState, now: Date): Array<[string, DailyEntry]> {
  const today = todayKey(now)
  const oldest = todayKey(new Date(now.getTime() - AIR_MAX_DAYS * 86_400_000))
  return Object.entries(state.daily)
    .filter(([key]) => key >= oldest && key <= today)
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
}

const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length

/**
 * 気分の流れを言葉にする。
 * 直近の半分と、その前とを比べて「動いたか」を見る。動いていなければ水準で見る。
 * どちらでもなければ `undefined`＝いつもどおり＝黙る。
 */
function moodTrend(moods: Mood[]): string | undefined {
  if (moods.length < AIR_MIN_MOODS) return undefined
  const s = moods.map((m) => MOOD_SCORE[m])
  const half = Math.ceil(s.length / 2)
  const delta = avg(s.slice(0, half)) - avg(s.slice(half))
  if (delta >= 0.5) return '上向き'
  if (delta <= -0.5) return '下向き'
  const level = avg(s)
  if (level <= -0.4) return 'しんどめが続く'
  if (level >= 0.6) return 'いい感じが続く'
  return undefined
}

/**
 * 現在の「いまの空気」。渡すものが何も無ければ空オブジェクトを返す。
 * 呼び出し側は空なら記憶ブロックごと送らない。
 */
export function currentAir(
  state: CompanionState,
  now: Date = new Date(),
  /**
   * 前回訪問からの経過日数。画面側で**訪問を記録する前に**captureした値を渡すこと。
   * 既定値のまま呼ぶと `touchVisit` 済みの状態を見て常に0になり、「ひさしぶり」が永久に出ない。
   */
  daysSince: number = daysSinceLastVisit(state, now),
): AirBrief {
  const recent = recentEntries(state, now)

  const moods = recent
    .map(([, e]) => e.mood)
    .filter((m): m is Mood => !!m)
    .slice(0, AIR_WINDOW)
  const mood = moodTrend(moods)

  // 気になっていること：同じ窓のなかで、はっきり偏っているときだけ。'その他'は偏りとみなさない
  const domains = recent
    .filter(([, e]) => e.mood)
    .slice(0, AIR_WINDOW)
    .map(([, e]) => e.domain)
    .filter((d): d is Domain => !!d && d !== 'other')
  const tally: Partial<Record<Domain, number>> = {}
  for (const d of domains) tally[d] = (tally[d] ?? 0) + 1
  const top = Object.entries(tally).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0]
  const focus =
    top && (top[1] ?? 0) >= 3 && (top[1] ?? 0) > domains.length / 2
      ? `${DOMAIN_JA[top[0] as Domain]}のことが多い`
      : undefined

  // ひさしぶり感：1日空いた程度では触れない(毎日来いという圧をかけない)
  const gap = daysSince >= 3 ? 'ひさしぶり' : undefined

  const hits = recent
    .map(([, e]) => e.hit)
    .filter((h): h is Hit => !!h && h in HIT_SCORE)
    .slice(0, AIR_WINDOW)
  let hit: string | undefined
  if (hits.length >= AIR_MIN_HITS) {
    const level = avg(hits.map((h) => HIT_SCORE[h] ?? 0))
    hit = level >= 0.5 ? '当たっている感じ' : level <= -0.5 ? 'ぴんと来ていないみたい' : 'まちまち'
  }

  const air: AirBrief = {}
  if (mood) air.mood = mood
  if (focus) air.focus = focus
  if (gap) air.gap = gap
  if (hit) air.hit = hit
  return air
}

/* ---------- 人となり（記憶の圧縮） ---------- */

/** これだけ会話が積み上がったら、はじめて「人となり」を作る */
const PERSONA_MIN_TURNS = 3
/** 前回の要約からこれだけ会話が増えたら作り直す。毎日変わるものは「人となり」ではない */
const PERSONA_REFRESH_TURNS = 5

/**
 * いま「人となり」を作り直すべきか。
 * `turns` は会話の往復数（＝ユーザーの発言数）。
 */
export function personaNeedsUpdate(state: CompanionState, turns: number): boolean {
  if (turns < PERSONA_MIN_TURNS) return false
  const p = state.persona
  if (!p) return true
  return turns >= p.basedOn + PERSONA_REFRESH_TURNS
}

/** 「人となり」を保存する。空の要約は保存しない（前回のものを残したほうがまし） */
export function savePersona(
  state: CompanionState,
  lines: string[],
  basedOn: number,
  now: Date = new Date(),
): CompanionState {
  const clean = lines.map((l) => l.trim()).filter(Boolean)
  if (!clean.length) return state
  const base = loadCompanion() ?? state
  const next: CompanionState = {
    ...base,
    persona: { lines: clean, writtenAt: now.toISOString(), basedOn },
  }
  saveCompanion(next)
  return next
}

/* ---------- 答え合わせ ---------- */

/** 答え合わせを聞いてよい期間。これより前の運勢を振り返られても覚えていない */
const HIT_ASK_MAX_DAYS = 3
/** 前に聞いてからこの日数は聞かない（毎日は聞かない） */
const HIT_ASK_COOLDOWN_DAYS = 3

/**
 * いま答え合わせを聞くべき運勢（無ければ undefined）。
 *
 * - 直近の**過去の**運勢が対象。今日ぶんは聞かない（まだ1日が終わっていない）
 * - 3日より前の運勢は振り返らない
 * - すでに答えた／スキップした運勢は二度と聞かない
 * - 前に聞いてから3日は聞かない
 */
export function pendingHitAsk(
  state: CompanionState,
  lang: Lang = getLang(),
  now: Date = new Date(),
): { dateKey: string; daysAgo: number; fortune: SavedFortune } | undefined {
  const past = latestPastFortune(state, lang, now)
  if (!past || past.daysAgo > HIT_ASK_MAX_DAYS) return undefined
  if (state.daily[past.dateKey]?.hit) return undefined
  if (state.lastHitAskAt) {
    const asked = new Date(state.lastHitAskAt)
    if (!isNaN(asked.getTime())) {
      const days = Math.round((now.getTime() - asked.getTime()) / 86_400_000)
      if (days < HIT_ASK_COOLDOWN_DAYS) return undefined
    }
  }
  return past
}

/** 答え合わせを記録する。スキップも `'skip'` として残す＝同じ日を二度は聞かない */
export function recordHit(
  state: CompanionState,
  dateKey: string,
  hit: Hit,
  now: Date = new Date(),
): CompanionState {
  const base = loadCompanion() ?? state
  const prev = base.daily[dateKey]
  if (!prev) return base
  const next: CompanionState = {
    ...base,
    lastHitAskAt: now.toISOString(),
    daily: { ...base.daily, [dateKey]: { ...prev, hit } },
  }
  saveCompanion(next)
  return next
}

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

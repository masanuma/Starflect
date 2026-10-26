/** 相談チャット。server/handlers.ts の Chat* と対で管理する */

import { getLang, type Lang } from './i18n'
import type { ChartData, PlanetKey } from './types'
import { getPlanet } from './planets'
import { signName } from './signs'
import { signIndex, degInSign } from './astro'
import { findNatalAspects } from './natalAspects'
import { forecastSet, longRangeTransits } from './fortune'
import type { PeriodBrief } from './fortune'
import { starTypeOf } from './startypes'
import type { AirBrief, BehaviorBrief, Facet } from './companion'
import type { FortuneOutlook } from './fortuneReading'
import { fortunePlainText } from './fortuneReading'
import { loadCompanion, todaysFortune } from './companion'
import { calendarWeek, loadWeekly } from './weeklyReading'
import { aiFailureMessage } from './aiErrors'

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
  planets: { label: string; role?: string; sign: string; deg: number; retro?: boolean; traits?: string[] }[]
  natalAspects?: string[]
  /** 今日〜来月＋この先数か月まで、期間ごとのトランジット見通し(全期間ぶん渡す) */
  periods: PeriodBrief[]
  /**
   * 3年先までの、木星・土星が出生の星に近づく時期。
   * これが無いと「来年の夏は？」に答える材料が無く、AIは一般論を書くしかない。
   */
  longRange?: string[]
  /**
   * 今日の日付(YYYY-MM-DD)。**`longRange` とセットで必ず渡すこと。**
   * これが無いとAIは「今日」が分からず、絶対日付の一覧を渡しても「来年の夏」を計算できない
   * （実測で、2026年8月に「来年の夏は2026年8月ごろ」と答えた）。
   * 端末の日付を使う＝`longRange` の計算基準と必ず一致する。
   */
  today?: string
  reading?: string
  weeklyReading?: string
}

/** チャートから相談チャット用のコンテキストを組み立てる(Result / Companion 共用) */
export function buildChatContext(chart: ChartData): ChatChartContext {
  const lonOf = (key: PlanetKey) => chart.planets.find((p) => p.key === key)?.lon
  const sunLon = lonOf('sun')
  const moonLon = lonOf('moon')
  const starType = sunLon !== undefined && moonLon !== undefined ? starTypeOf(sunLon, moonLon) : null
  const natalAspects = findNatalAspects(chart.planets)
  const saved = loadCompanion()
  const samePerson = saved && saved.chart.dateLabel === chart.dateLabel && saved.chart.name === chart.name &&
    JSON.stringify(saved.chart.planets) === JSON.stringify(chart.planets)
  const reading = samePerson ? todaysFortune(saved, undefined, undefined, facetOfNow()) : undefined
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
    // さらに先(3年)まで。「来年の夏は？」に一般論ではなく、その人の配置で答えられるようにする
    longRange: longRangeTransits(chart.planets),
    today: todayISO(),
    reading: reading ? fortunePlainText(reading.text) : undefined,
    weeklyReading: loadWeekly(chart, calendarWeek().start, getLang()),
  }
}

/** 端末の今日(YYYY-MM-DD)。longRange の計算基準と揃えるため、サーバー時刻ではなくここで作る */
function todayISO(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

/**
 * いま何時ごろか（プロンプト用の日本語1本。表示には使わない）。
 *
 * **なぜ必要か**：夕方に今日の運勢をひらいて「朝のうちに〜」と言われても使えない。
 * 締めの「今日できる行動」がもう過ぎた時間帯を指すと、その1文がまるごと無駄になる。
 *
 * **サーバー時刻ではなく端末の時刻を使う**。サーバーはUTCなので、日本の夕方は
 * サーバーでは午前になり、いちばん直したかったズレがそのまま残る。
 */
const BANDS = ['朝', '昼', '夕方', '夜', '深夜']

export function timeOfDay(now = new Date()): string {
  // 夜の面は時刻でしか出ないので、ローカル開発時だけ ?tod=夜 で切り替えられるようにする。
  // ここで上書きすると、面の選択・気分タップの出し分け・プロンプトが一斉に揃う
  if (typeof location !== 'undefined' && /^(localhost|127\.)/.test(location.hostname)) {
    const forced = new URLSearchParams(location.search).get('tod')
    if (forced && BANDS.includes(forced)) return forced
  }
  const h = now.getHours()
  // 深夜(23〜4時)を先に返す。あとに回すと 0〜4時 が `h < 15` に吸われて「昼」になる
  if (h >= 23 || h < 5) return '深夜'
  if (h < 11) return '朝'
  if (h < 15) return '昼'
  if (h < 18) return '夕方'
  return '夜'
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
  const lang=(body as {lang?:Lang}).lang ?? getLang()
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).catch(()=>{throw new Error(aiFailureMessage(lang))})

  if (!res.ok || !res.body) {
    throw new Error(aiFailureMessage(lang,res.status))
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let received=false
  for (;;) {
    const { done, value } = await reader.read().catch(()=>{throw new Error(aiFailureMessage(lang))})
    if (done) break
    const chunk = decoder.decode(value, { stream: true })
    if (chunk) { received=true;onDelta(chunk) }
  }
  if(!received)throw new Error(aiFailureMessage(lang))
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
    // 相性の読みも「今日のふたりでできること」で締めるので、同じく時間帯が要る
    { context, messages: [{ role: 'user', content: 'ふたりの相性を教えて' }], lang, timeOfDay: timeOfDay() },
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
  /** 太陽の面(朝〜夕方) か 月の面(夜〜深夜) か */
  facet: Facet = 'day',
  /** 出会って最初の1本か。初回だけ「明日聞かせて」という約束で閉じる */
  firstMeeting = false,
  outlook?: FortuneOutlook,
): Promise<void> {
  await postStream(
    '/api/ai-fortune',
    {
      context,
      messages: [
        {
          role: 'user',
          content: facet === 'night' ? 'いまのわたしの気持ちを読んで' : '今日のわたしの運勢を教えて',
        },
      ],
      lang,
      air,
      persona,
      facet,
      firstMeeting,
      formatVersion: 2,
      outlook,
      // 呼び出し側に任せず必ず付ける。忘れると「朝のうちに」が夜に出る
      timeOfDay: timeOfDay(),
    },
    onDelta,
  )
}

/**
 * 「この日、どう？」＝選んだ日がどんな日かを読む。
 * 毎日の運勢とは別物の**照会**なので、保存も引き直し禁止も無い。
 * その日の運行(periods[0])は呼び出し側がクライアントで計算して渡す。
 */
export async function streamAiWeekly(
  context: ChatChartContext,
  week: { start: string; end: string; days: PeriodBrief[] },
  onDelta: (text: string) => void,
  lang: Lang,
): Promise<void> {
  await postStream('/api/ai-fortune', { context, week, lang, horizon: 'week', formatVersion: 2,
    messages: [{role:'user', content:'今週、楽しみにしていいことを短く教えてください。'}] }, onDelta)
}

export async function streamAiSpecial(context:ChatChartContext, moment:{date:string;transit:string;natal:string;angle:number}, onDelta:(text:string)=>void, lang:Lang):Promise<void> {
  await postStream('/api/ai-fortune',{context,moment,lang,horizon:'special',formatVersion:2,
    messages:[{role:'user',content:'この星の節目に楽しみにしていいことを、短いお便りにしてください。'}]},onDelta)
}

export async function streamAiDayCheck(
  context: ChatChartContext,
  dateLabel: string,
  onDelta: (text: string) => void,
  lang?: Lang,
): Promise<void> {
  await postStream(
    '/api/ai-fortune',
    {
      context,
      messages: [{ role: 'user', content: `「${dateLabel}」はわたしにとってどんな日？` }],
      lang,
      targetDate: dateLabel,
      facet: 'day',
    },
    onDelta,
  )
}

/** いまの時刻はどちらの面か。夜〜深夜が月の面 */
export function facetOfNow(now = new Date()): Facet {
  const t = timeOfDay(now)
  return t === '夜' || t === '深夜' ? 'night' : 'day'
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

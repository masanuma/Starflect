import { Body } from 'astronomy-engine'
import { eclipticLongitude, signIndex } from './astro'
import { SIGNS } from './signs'
import type { PlanetPos, PlanetKey, PeriodKey } from './types'

type TransitKey = 'moon' | 'sun' | 'mercury' | 'venus' | 'mars' | 'jupiter' | 'saturn'

interface PeriodDef {
  key: PeriodKey
  label: string
  noun: string
  /** 期間を代表する時点(現在からの日数) */
  offsetDays: number
  /** 期間の長さに合わせて見る天体(速い天体は短期間のみ) */
  bodies: TransitKey[]
}

export const PERIODS: PeriodDef[] = [
  { key: 'today', label: '今日', noun: '今日', offsetDays: 0, bodies: ['moon', 'sun', 'mercury', 'venus', 'mars'] },
  { key: 'tomorrow', label: '明日', noun: '明日', offsetDays: 1, bodies: ['moon', 'sun', 'mercury', 'venus', 'mars'] },
  { key: 'week', label: '今週', noun: 'この1週間', offsetDays: 3.5, bodies: ['sun', 'mercury', 'venus', 'mars', 'jupiter'] },
  { key: 'month', label: '今月', noun: 'この1か月', offsetDays: 15, bodies: ['sun', 'venus', 'mars', 'jupiter', 'saturn'] },
]

export const periodDef = (key: PeriodKey) => PERIODS.find((p) => p.key === key) ?? PERIODS[0]

interface TransitInfo {
  body: Body
  name: string
  symbol: string
  good: string
  hard: string
  conj: string
}

const TRANSITS: Record<TransitKey, TransitInfo> = {
  moon: {
    body: Body.Moon, name: '月', symbol: '☽',
    good: '気分が乗りやすく、直感が冴える流れ。感じたことを素直に行動に移すと吉です。',
    hard: '気分の浮き沈みが出やすいとき。予定を詰め込みすぎず、心の休憩時間を確保して。',
    conj: '感情のアンテナが敏感になります。心が動いたこと、それがこの期間のテーマです。',
  },
  sun: {
    body: Body.Sun, name: '太陽', symbol: '☉',
    good: '活力が高まり、あなたらしさが自然と評価される追い風です。',
    hard: '自分のペースと周囲の期待がぶつかりやすいとき。無理な背伸びは禁物です。',
    conj: 'スポットライトが当たる節目。新しいスタートを切るのに向いています。',
  },
  mercury: {
    body: Body.Mercury, name: '水星', symbol: '☿',
    good: '会話や連絡ごとがスムーズに進みます。学び・発信・交渉ごとに好機です。',
    hard: '言葉の行き違いが起きやすいとき。大事な連絡は一呼吸おいて読み返しを。',
    conj: '頭の回転が速まり、アイデアが湧きます。思いつきはメモに残すと吉。',
  },
  venus: {
    body: Body.Venus, name: '金星', symbol: '♀',
    good: '人間関係や恋愛に甘い追い風。楽しみごとやおしゃれへの投資が運を呼びます。',
    hard: '楽しさへの誘惑が判断を鈍らせがち。衝動買いと甘い話にはご注意を。',
    conj: '魅力が高まるとき。人との出会い、美しいものとの出会いに恵まれます。',
  },
  mars: {
    body: Body.Mars, name: '火星', symbol: '♂',
    good: '行動力とチャレンジ精神が湧き上がります。迷っていた一歩を踏み出すなら今。',
    hard: '焦りやイライラが表に出やすいとき。勢いだけの決断や衝突に注意です。',
    conj: 'エンジン全開のエネルギー期。運動や勝負ごとで発散すると好循環になります。',
  },
  jupiter: {
    body: Body.Jupiter, name: '木星', symbol: '♃',
    good: 'チャンスが広がる幸運の角度。誘いには「はい」と答えてみる価値があります。',
    hard: '気が大きくなって広げすぎてしまいがち。約束と出費は身の丈を意識して。',
    conj: '約12年に一度の拡大期。将来につながる種まきに最適なタイミングです。',
  },
  saturn: {
    body: Body.Saturn, name: '土星', symbol: '♄',
    good: '努力がかたちになりやすい堅実な流れ。コツコツ系の作業がはかどります。',
    hard: '責任や制限を感じやすいとき。ただし、ここで固めた土台は裏切りません。',
    conj: '人生の骨組みを見直す節目。長期的な計画を立てるのに向いています。',
  },
}

const NATAL_LABEL: Record<PlanetKey, string> = {
  sun: '太陽(基本性格)',
  moon: '月(心)',
  asc: '上昇星座(ふるまい)',
  mercury: '水星(知性)',
  venus: '金星(愛情)',
  mars: '火星(行動力)',
  jupiter: '木星(発展)',
  saturn: '土星(課題)',
  uranus: '天王星(変革)',
  neptune: '海王星(想像力)',
  pluto: '冥王星(再生)',
}

type Quality = 'good' | 'hard' | 'conj'

interface AspectDef {
  angle: number
  orb: number
  name: string
  quality: Quality
}

// name は運勢カードの見出しに表示。専門用語を避け、度数は残す(AIの精度確保も兼ねる)
const ASPECTS: AspectDef[] = [
  { angle: 0, orb: 6, name: 'ぴったり重なる(0°)', quality: 'conj' },
  { angle: 60, orb: 4, name: 'ゆるやかな追い風(60°)', quality: 'good' },
  { angle: 90, orb: 6, name: '試練の角度(90°)', quality: 'hard' },
  { angle: 120, orb: 6, name: '大きな追い風(120°)', quality: 'good' },
  { angle: 180, orb: 6, name: 'ひっぱり合い(180°)', quality: 'hard' },
]

export interface FortuneItem {
  symbol: string
  title: string
  quality: Quality
  text: string
}

export interface Fortune {
  toneLabel: string
  toneText: string
  /** 調子の数値(+2=絶好調 〜 -2=充電期間)。相性占いの組み合わせ判定に使う */
  toneLevel: number
  skyNote: string
  items: FortuneItem[]
}

/** 黄経差を0〜180°に正規化 */
function separation(a: number, b: number): number {
  const d = Math.abs(a - b) % 360
  return d > 180 ? 360 - d : d
}

const TONES: { min: number; label: string; text: string; level: number }[] = [
  { min: 2, label: '絶好調', text: '星々が力強く味方する期間。攻めの選択が吉と出ます。', level: 2 },
  { min: 1, label: '追い風', text: '流れは味方。気になっていたことを進めるチャンスです。', level: 1 },
  { min: -0.5, label: '穏やか', text: '大きな波のない安定した星回り。足元を整えるのに向いています。', level: 0 },
  { min: -1.5, label: '足場固め', text: 'やや緊張感のある配置。丁寧さを心がければ実りに変わります。', level: -1 },
  { min: -Infinity, label: '充電期間', text: '星からの宿題が多めの期間。無理せず、休息と準備を優先して。', level: -2 },
]

export function readFortune(natal: PlanetPos[], period: PeriodKey, now = new Date()): Fortune {
  const def = periodDef(period)
  const when = new Date(now.getTime() + def.offsetDays * 86400_000)

  const transitLons = new Map<TransitKey, number>()
  for (const key of def.bodies) {
    transitLons.set(key, eclipticLongitude(TRANSITS[key].body, when))
  }

  interface Hit {
    transit: TransitKey
    natalKey: PlanetKey
    aspect: AspectDef
    exactness: number
  }
  const hits: Hit[] = []
  for (const [tKey, tLon] of transitLons) {
    for (const n of natal) {
      const sep = separation(tLon, n.lon)
      for (const a of ASPECTS) {
        const off = Math.abs(sep - a.angle)
        if (off <= a.orb) {
          hits.push({ transit: tKey, natalKey: n.key, aspect: a, exactness: off })
        }
      }
    }
  }
  hits.sort((x, y) => x.exactness - y.exactness)
  const top = hits.slice(0, 4)

  const items: FortuneItem[] = top.map((h) => {
    const t = TRANSITS[h.transit]
    return {
      symbol: t.symbol,
      title: `運行中の${t.name} × あなたの${NATAL_LABEL[h.natalKey]} — ${h.aspect.name}`,
      quality: h.aspect.quality,
      text: t[h.aspect.quality],
    }
  })

  if (items.length === 0) {
    items.push({
      symbol: '✦',
      title: '大きな角度のない、静かな星回り',
      quality: 'good',
      text: '運行中の星々はあなたの星と目立った角度を作っていません。外からの波が少ないぶん、自分のペースを保つほど運が安定する期間です。',
    })
  }

  const score = top.reduce(
    (s, h) => s + (h.aspect.quality === 'good' ? 1 : h.aspect.quality === 'hard' ? -1 : 0.3),
    0,
  )
  const tone = TONES.find((t) => score >= t.min) ?? TONES[2]

  const sunSign = SIGNS[signIndex(eclipticLongitude(Body.Sun, when))].name
  const skyNote =
    period === 'today' || period === 'tomorrow'
      ? `太陽は${sunSign}、月は${SIGNS[signIndex(eclipticLongitude(Body.Moon, when))].name}を運行中`
      : `太陽は${sunSign}のエリアを運行中`

  return { toneLabel: tone.label, toneText: tone.text, toneLevel: tone.level, skyNote, items }
}

import { elementOf, elementLabel } from './signs'
import type { Element } from './signs'
import { getLang } from './i18n'
import type { Lang } from './i18n'
import type { PlanetPos, PeriodKey } from './types'

/** ひとり分の相性用チャート */
export interface PairPerson {
  name: string
  dateLabel: string
  /** 時刻未入力なら true(月星座は正午で近似) */
  approxTime: boolean
  planets: PlanetPos[]
}

export interface PairData {
  a: PairPerson
  b: PairPerson
  period: PeriodKey
}

/** エレメント同士の関係: 共鳴(同じ) / 好相性(火×風・地×水) / 化学反応(その他) */
export type ElementRel = 'same' | 'friend' | 'spark'

export function relOf(x: Element, y: Element): ElementRel {
  if (x === y) return 'same'
  const pair = [x, y].sort().join('')
  if (pair === '火風' || pair === '地水') return 'friend'
  return 'spark'
}

const REL_LABEL_L: Record<Lang, Record<ElementRel, string>> = {
  ja: { same: '共鳴', friend: '好相性', spark: '化学反応' },
  en: { same: 'Resonance', friend: 'Good Match', spark: 'Chemistry' },
  es: { same: 'Resonancia', friend: 'Buena Sintonía', spark: 'Química' },
}

/** 関係ラベル(現在言語) */
export const relLabel = (rel: ElementRel): string => (REL_LABEL_L[getLang()] ?? REL_LABEL_L.ja)[rel]

const REL_SCORE: Record<ElementRel, number> = { same: 2.0, friend: 1.8, spark: 1.0 }

/** 表の顔どうし(太陽×太陽)の文 */
const SUN_TEXT: Record<Lang, Record<ElementRel, string>> = {
  ja: {
    same: 'ふるまいのテンポがそっくり。一緒にいて疲れない、素の距離感で付き合えるふたりです。',
    friend: 'ノリとテンポが自然に噛み合います。片方が動けばもう片方が乗る、心地よいリズムのふたり。',
    spark: 'ペースは正反対。だからこそ相手の動き方が新鮮で、自分にない世界を見せてくれます。',
  },
  en: {
    same: 'Your everyday tempos are alike. Easy to be around, you relate at your natural, unguarded distance.',
    friend: 'Your vibes and pace mesh naturally. One moves, the other follows—a comfortable rhythm.',
    spark: 'Your paces are opposite. That’s exactly why the other feels fresh, showing you a world you don’t have.',
  },
  es: {
    same: 'Vuestros ritmos cotidianos se parecen. Cómodos juntos, os tratáis con vuestra distancia natural y sin corazas.',
    friend: 'Vuestra onda y vuestro ritmo encajan solos. Uno se mueve, el otro le sigue: un ritmo agradable.',
    spark: 'Vuestros ritmos son opuestos. Justo por eso el otro resulta fresco y os muestra un mundo que no tenéis.',
  },
}

/** 心どうし(月×月)の文 */
const MOON_TEXT: Record<Lang, Record<ElementRel, string>> = {
  ja: {
    same: '心の充電方法が同じ。言葉にしなくても「わかる」が通じる、安心感の強い組み合わせです。',
    friend: '感情の波長が合いやすく、落ち込んだとき・嬉しいときの寄り添い方が自然に噛み合います。',
    spark: '心の動き方は別モノ。すれ違いも起きますが、理解し合えたときの絆は誰より深くなります。',
  },
  en: {
    same: 'You recharge the same way. A “you just get it” without words—a deeply reassuring match.',
    friend: 'Your emotional wavelengths align easily; how you comfort each other in lows and share the highs meshes naturally.',
    spark: 'Your hearts move differently. Misfires happen, but once you understand each other, the bond runs deeper than any.',
  },
  es: {
    same: 'Recargáis igual. Un “te entiendo” sin palabras: una combinación que da mucha seguridad.',
    friend: 'Vuestras longitudes de onda emocionales se alinean fácil; os arropáis en los bajones y compartís las alegrías con naturalidad.',
    spark: 'Vuestros corazones se mueven distinto. Habrá desencuentros, pero al entenderos el vínculo se hace más hondo que ninguno.',
  },
}

/** クロス(あなたの太陽×相手の月、あなたの月×相手の太陽)の文 */
function crossText(lang: Lang, r1: ElementRel, r2: ElementRel): string {
  const sparks = (r1 === 'spark' ? 1 : 0) + (r2 === 'spark' ? 1 : 0)
  const T = {
    ja: [
      '素の自分を見せ合える関係。あなたの外の顔と相手の心、その逆も、互いに心地よく噛み合います。',
      '片方が甘えて、片方が受け止める——自然と役割が生まれる関係。凸凹がちょうどいい組み合わせです。',
      'ミステリアスに惹かれ合う関係。「わからない」からこそ、もっと知りたくなるふたりです。',
    ],
    en: [
      'A relationship where you show your real selves. Your outer face and their heart—and vice versa—mesh comfortably.',
      'One leans in, the other holds space—roles arise naturally. The give-and-take fits just right.',
      'A mysteriously magnetic pull. Precisely because you “don’t get” each other, you want to know more.',
    ],
    es: [
      'Una relación donde os mostráis tal cual sois. Tu cara externa y su corazón —y al revés— encajan con comodidad.',
      'Uno se apoya, el otro sostiene: los roles surgen solos. El toma y daca encaja perfecto.',
      'Una atracción magnética y misteriosa. Justo porque no os “entendéis”, queréis saber más.',
    ],
  }[lang]
  return T[sparks]
}

/** タイプ相性のニックネーム(太陽の関係 × 月の関係)。emoji は言語非依存 */
const NICK_EMOJI: Record<ElementRel, Record<ElementRel, string>> = {
  same: { same: '👯', friend: '🤝', spark: '🎭' },
  friend: { same: '💞', friend: '🌈', spark: '🎢' },
  spark: { same: '🧲', friend: '☕', spark: '⚡' },
}

const NICK_NAME: Record<Lang, Record<ElementRel, Record<ElementRel, string>>> = {
  ja: {
    same: { same: 'まるで双子タイプ', friend: 'あうんの呼吸タイプ', spark: '似た者同士、心は別世界タイプ' },
    friend: { same: '深いところで通じ合うタイプ', friend: 'ベストパートナータイプ', spark: '楽しいけど時々嵐タイプ' },
    spark: { same: '見た目は正反対、心は同じタイプ', friend: '慣れるほど心地いいタイプ', spark: '化学反応MAXタイプ' },
  },
  en: {
    same: { same: 'Practically Twins', friend: 'In Perfect Sync', spark: 'Alike Outside, Worlds Apart Inside' },
    friend: { same: 'Connected Deep Down', friend: 'Best Partners', spark: 'Fun with Occasional Storms' },
    spark: { same: 'Opposite Looks, Same Heart', friend: 'Better the More You Get Used to It', spark: 'Maximum Chemistry' },
  },
  es: {
    same: { same: 'Casi gemelos', friend: 'En perfecta sintonía', spark: 'Iguales fuera, mundos aparte dentro' },
    friend: { same: 'Conectados en lo profundo', friend: 'Mejores compañeros', spark: 'Divertidos con tormentas ocasionales' },
    spark: { same: 'Opuestos por fuera, iguales de corazón', friend: 'Mejor cuanto más os acostumbráis', spark: 'Química al máximo' },
  },
}

const DETAIL_TITLE: Record<Lang, (aSun: string, bSun: string, aMoon: string, bMoon: string) => [string, string, string]> = {
  ja: (aSun, bSun, aMoon, bMoon) => [
    `表の顔どうし(太陽 ${aSun}×${bSun})`,
    `心どうし(月 ${aMoon}×${bMoon})`,
    'クロス(あなたの表×相手の心)',
  ],
  en: (aSun, bSun, aMoon, bMoon) => [
    `Outer selves (Sun ${aSun} × ${bSun})`,
    `Inner hearts (Moon ${aMoon} × ${bMoon})`,
    'Cross (your outer × their heart)',
  ],
  es: (aSun, bSun, aMoon, bMoon) => [
    `Caras externas (Sol ${aSun} × ${bSun})`,
    `Corazones (Luna ${aMoon} × ${bMoon})`,
    'Cruce (tu cara × su corazón)',
  ],
}

export interface CompatDetail {
  title: string
  rel: ElementRel
  text: string
}

export interface Compat {
  /** 55〜98の相性スコア */
  percent: number
  emoji: string
  nickname: string
  details: CompatDetail[]
}

const elemOf = (planets: PlanetPos[], key: 'sun' | 'moon'): Element => {
  const p = planets.find((pp) => pp.key === key)
  if (!p) throw new Error(`missing ${key}`)
  return elementOf(p.lon)
}

/** ふたりのタイプ相性を判定する */
export function compatOf(a: PairPerson, b: PairPerson): Compat {
  const lang = getLang()
  const aSun = elemOf(a.planets, 'sun')
  const aMoon = elemOf(a.planets, 'moon')
  const bSun = elemOf(b.planets, 'sun')
  const bMoon = elemOf(b.planets, 'moon')

  const sunRel = relOf(aSun, bSun)
  const moonRel = relOf(aMoon, bMoon)
  const cross1 = relOf(aSun, bMoon)
  const cross2 = relOf(aMoon, bSun)

  // 心(月)の関係を最重視、次いで表の顔、クロスは補助
  const score =
    REL_SCORE[sunRel] * 1.0 + REL_SCORE[moonRel] * 1.4 + REL_SCORE[cross1] * 0.6 + REL_SCORE[cross2] * 0.6
  const max = 2.0 * 3.6
  const min = 1.0 * 3.6
  const percent = Math.round(55 + ((score - min) / (max - min)) * 43)

  const RANK: Record<ElementRel, number> = { spark: 0, friend: 1, same: 2 }
  const crossRel = RANK[cross1] <= RANK[cross2] ? cross1 : cross2

  const titles = DETAIL_TITLE[lang](
    elementLabel(aSun), elementLabel(bSun), elementLabel(aMoon), elementLabel(bMoon),
  )

  return {
    percent,
    emoji: NICK_EMOJI[sunRel][moonRel],
    nickname: NICK_NAME[lang][sunRel][moonRel],
    details: [
      { title: titles[0], rel: sunRel, text: SUN_TEXT[lang][sunRel] },
      { title: titles[1], rel: moonRel, text: MOON_TEXT[lang][moonRel] },
      { title: titles[2], rel: crossRel, text: crossText(lang, cross1, cross2) },
    ],
  }
}

/**
 * ふたりの調子(toneLevel)の組み合わせから、その期間の過ごし方のヒントを返す。
 * レベル: +1以上=好調 / 0=穏やか / -1以下=充電
 */
export function pairTip(levelA: number, levelB: number, nameA: string, nameB: string): string {
  const lang = getLang()
  const bucket = (n: number) => (n >= 1 ? 2 : n >= 0 ? 1 : 0)
  const a = bucket(levelA)
  const b = bucket(levelB)
  const [hi, lo, hiName, loName] = a >= b ? [a, b, nameA, nameB] : [b, a, nameB, nameA]

  const T = {
    ja: {
      hh: `🚀 ふたりそろって追い風!新しいこと・おでかけ・大事な話、この期間が狙い目です。`,
      hm: `🌤️ ${hiName}に勢いがある期間。${hiName}から誘うと、するっと楽しい流れになります。`,
      hl: `🤲 ${hiName}は好調、${loName}は充電中。${hiName}が聞き役・支え役に回ると、ぐっと絆が深まります。`,
      mm: `☕ 穏やかなふたり日和。頑張らない時間の共有(散歩・カフェ・のんびり)が正解です。`,
      ml: `🕯️ ${loName}は少しお疲れ気味の星回り。予定を詰めず、${hiName}がペースを合わせてあげると◎。`,
      ll: `🛋️ ふたりとも充電期間。無理に盛り上げず、静かに一緒にいるだけで十分な時期です。`,
    },
    en: {
      hh: `🚀 Both of you have a tailwind! New things, outings, big talks—this period is the sweet spot.`,
      hm: `🌤️ ${hiName} has momentum this period. If ${hiName} does the inviting, it slides into something fun.`,
      hl: `🤲 ${hiName} is on a roll while ${loName} recharges. If ${hiName} plays listener and supporter, the bond deepens.`,
      mm: `☕ A calm day for two. Sharing unhurried time (a walk, a café, taking it easy) is the answer.`,
      ml: `🕯️ ${loName} is under a slightly tired sky. Don’t overbook; it works best if ${hiName} matches the pace.`,
      ll: `🛋️ You’re both in a recharge period. No need to force the mood—just being quietly together is plenty.`,
    },
    es: {
      hh: `🚀 ¡Los dos con viento a favor! Cosas nuevas, salidas, conversaciones importantes: este periodo es el momento ideal.`,
      hm: `🌤️ ${hiName} tiene impulso este periodo. Si ${hiName} propone el plan, todo fluye hacia algo divertido.`,
      hl: `🤲 ${hiName} está en racha y ${loName} recarga. Si ${hiName} escucha y apoya, el vínculo se fortalece.`,
      mm: `☕ Un día tranquilo para dos. Compartir tiempo sin prisas (un paseo, un café, relajarse) es el acierto.`,
      ml: `🕯️ ${loName} está bajo un cielo algo cansado. Sin llenar la agenda; funciona mejor si ${hiName} adapta el ritmo.`,
      ll: `🛋️ Los dos en periodo de recarga. No hace falta forzar el ánimo: estar juntos en calma ya basta.`,
    },
  }[lang]

  if (hi === 2 && lo === 2) return T.hh
  if (hi === 2 && lo === 1) return T.hm
  if (hi === 2 && lo === 0) return T.hl
  if (hi === 1 && lo === 1) return T.mm
  if (hi === 1 && lo === 0) return T.ml
  return T.ll
}

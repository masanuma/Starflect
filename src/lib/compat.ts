import { signIndex } from './astro'
import { SIGNS } from './signs'
import type { SignInfo } from './signs'
import type { PlanetPos, PeriodKey } from './types'

type Element = SignInfo['element']

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

export const REL_LABEL: Record<ElementRel, string> = {
  same: '共鳴',
  friend: '好相性',
  spark: '化学反応',
}

const REL_SCORE: Record<ElementRel, number> = { same: 2.0, friend: 1.8, spark: 1.0 }

/** 表の顔どうし(太陽×太陽)の文 */
const SUN_TEXT: Record<ElementRel, string> = {
  same: 'ふるまいのテンポがそっくり。一緒にいて疲れない、素の距離感で付き合えるふたりです。',
  friend: 'ノリとテンポが自然に噛み合います。片方が動けばもう片方が乗る、心地よいリズムのふたり。',
  spark: 'ペースは正反対。だからこそ相手の動き方が新鮮で、自分にない世界を見せてくれます。',
}

/** 心どうし(月×月)の文 */
const MOON_TEXT: Record<ElementRel, string> = {
  same: '心の充電方法が同じ。言葉にしなくても「わかる」が通じる、安心感の強い組み合わせです。',
  friend: '感情の波長が合いやすく、落ち込んだとき・嬉しいときの寄り添い方が自然に噛み合います。',
  spark: '心の動き方は別モノ。すれ違いも起きますが、理解し合えたときの絆は誰より深くなります。',
}

/** クロス(あなたの太陽×相手の月、あなたの月×相手の太陽)の文 */
function crossText(r1: ElementRel, r2: ElementRel): string {
  const sparks = (r1 === 'spark' ? 1 : 0) + (r2 === 'spark' ? 1 : 0)
  if (sparks === 0)
    return '素の自分を見せ合える関係。あなたの外の顔と相手の心、その逆も、互いに心地よく噛み合います。'
  if (sparks === 1)
    return '片方が甘えて、片方が受け止める——自然と役割が生まれる関係。凸凹がちょうどいい組み合わせです。'
  return 'ミステリアスに惹かれ合う関係。「わからない」からこそ、もっと知りたくなるふたりです。'
}

/** タイプ相性のニックネーム(太陽の関係 × 月の関係) */
const PAIR_NICKNAME: Record<ElementRel, Record<ElementRel, { emoji: string; name: string }>> = {
  same: {
    same: { emoji: '👯', name: 'まるで双子タイプ' },
    friend: { emoji: '🤝', name: 'あうんの呼吸タイプ' },
    spark: { emoji: '🎭', name: '似た者同士、心は別世界タイプ' },
  },
  friend: {
    same: { emoji: '💞', name: '深いところで通じ合うタイプ' },
    friend: { emoji: '🌈', name: 'ベストパートナータイプ' },
    spark: { emoji: '🎢', name: '楽しいけど時々嵐タイプ' },
  },
  spark: {
    same: { emoji: '🧲', name: '見た目は正反対、心は同じタイプ' },
    friend: { emoji: '☕', name: '慣れるほど心地いいタイプ' },
    spark: { emoji: '⚡', name: '化学反応MAXタイプ' },
  },
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

const elementOf = (planets: PlanetPos[], key: 'sun' | 'moon'): Element => {
  const p = planets.find((pp) => pp.key === key)
  if (!p) throw new Error(`missing ${key}`)
  return SIGNS[signIndex(p.lon)].element
}

/** ふたりのタイプ相性を判定する */
export function compatOf(a: PairPerson, b: PairPerson): Compat {
  const aSun = elementOf(a.planets, 'sun')
  const aMoon = elementOf(a.planets, 'moon')
  const bSun = elementOf(b.planets, 'sun')
  const bMoon = elementOf(b.planets, 'moon')

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

  const nick = PAIR_NICKNAME[sunRel][moonRel]

  const RANK: Record<ElementRel, number> = { spark: 0, friend: 1, same: 2 }
  const crossRel = RANK[cross1] <= RANK[cross2] ? cross1 : cross2

  return {
    percent,
    emoji: nick.emoji,
    nickname: nick.name,
    details: [
      { title: `表の顔どうし(太陽 ${aSun}×${bSun})`, rel: sunRel, text: SUN_TEXT[sunRel] },
      { title: `心どうし(月 ${aMoon}×${bMoon})`, rel: moonRel, text: MOON_TEXT[moonRel] },
      { title: 'クロス(あなたの表×相手の心)', rel: crossRel, text: crossText(cross1, cross2) },
    ],
  }
}

/**
 * ふたりの調子(toneLevel)の組み合わせから、その期間の過ごし方のヒントを返す。
 * レベル: +1以上=好調 / 0=穏やか / -1以下=充電
 */
export function pairTip(levelA: number, levelB: number, nameA: string, nameB: string): string {
  const bucket = (n: number) => (n >= 1 ? 2 : n >= 0 ? 1 : 0)
  const a = bucket(levelA)
  const b = bucket(levelB)
  const [hi, lo, hiName, loName] = a >= b ? [a, b, nameA, nameB] : [b, a, nameB, nameA]

  if (hi === 2 && lo === 2) return `🚀 ふたりそろって追い風!新しいこと・おでかけ・大事な話、この期間が狙い目です。`
  if (hi === 2 && lo === 1) return `🌤️ ${hiName}に勢いがある期間。${hiName}から誘うと、するっと楽しい流れになります。`
  if (hi === 2 && lo === 0)
    return `🤲 ${hiName}は好調、${loName}は充電中。${hiName}が聞き役・支え役に回ると、ぐっと絆が深まります。`
  if (hi === 1 && lo === 1) return `☕ 穏やかなふたり日和。頑張らない時間の共有(散歩・カフェ・のんびり)が正解です。`
  if (hi === 1 && lo === 0)
    return `🕯️ ${loName}は少しお疲れ気味の星回り。予定を詰めず、${hiName}がペースを合わせてあげると◎。`
  return `🛋️ ふたりとも充電期間。無理に盛り上げず、静かに一緒にいるだけで十分な時期です。`
}

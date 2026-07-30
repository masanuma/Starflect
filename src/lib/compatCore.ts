/**
 * 相性の中核（**astronomy-engine 非依存**）。
 *
 * 相性は「太陽のエレメント」と「月のエレメント」の4値だけで決まる＝生年月日の細部に依存しない。
 * つまりキャラのスラッグ2つ（例 earth_fire × water_water）から%とニックネームを再計算できる。
 * これをサーバー（相性シェアの着地ページ `/pair` のOGP）から使いたいので、
 * `compat.ts` から計算部分だけをここへ分離した。
 *
 * ⚠️ このファイルは `astro.ts` / `signs.ts` を **値として** import してはいけない。
 * それらは astronomy-engine を読むため、Railway の Node 18 でサーバーが起動クラッシュする
 * （`starData.ts` / `astroText.ts` と同じ役割分担）。型だけの import はコンパイル時に消えるので安全。
 */
import type { Lang } from './i18n'
import type { Element } from './signs'

export type ElementRel = 'same' | 'friend' | 'spark'

export function relOf(x: Element, y: Element): ElementRel {
  if (x === y) return 'same'
  const pair = [x, y].sort().join('')
  if (pair === '火風' || pair === '地水') return 'friend'
  return 'spark'
}

export const REL_SCORE: Record<ElementRel, number> = { same: 2.0, friend: 1.8, spark: 1.0 }

export const NICK_EMOJI: Record<ElementRel, Record<ElementRel, string>> = {
  same: { same: '👯', friend: '🤝', spark: '🎭' },
  friend: { same: '💞', friend: '🌈', spark: '🎢' },
  spark: { same: '🧲', friend: '☕', spark: '⚡' },
}

export const NICK_NAME: Record<Lang, Record<ElementRel, Record<ElementRel, string>>> = {
  ja: {
    same: { same: 'まるで双子タイプ', friend: 'あうんの呼吸タイプ', spark: '似た者同士、心は別世界タイプ' },
    friend: { same: '深いところで通じ合うタイプ', friend: 'ベストパートナータイプ', spark: '楽しいけど時々嵐タイプ' },
    spark: { same: '見た目は正反対、心は同じタイプ', friend: '慣れるほど心地いいタイプ', spark: '化学反応MAXタイプ' },
  },
  en: {
    same: { same: 'Practically Twins', friend: 'In Perfect Sync', spark: 'Alike Outside, Worlds Apart Inside' },
    friend: { same: 'Connected Deep Down', friend: 'Best Partners', spark: 'Fun with Occasional Storms' },
    spark: { same: 'Opposites Outside, Same Inside', friend: 'Cosier the Longer You Know', spark: 'Chemistry at Max' },
  },
  es: {
    same: { same: 'Casi gemelos', friend: 'En perfecta sintonía', spark: 'Iguales por fuera, mundos aparte por dentro' },
    friend: { same: 'Conectados en lo profundo', friend: 'Mejores compañeros', spark: 'Divertido con tormentas ocasionales' },
    spark: { same: 'Opuestos por fuera, iguales por dentro', friend: 'Más cómodos con el tiempo', spark: 'Química al máximo' },
  },
  fr: {
    same: { same: 'Presque jumeaux', friend: 'En parfaite harmonie', spark: 'Pareils dehors, mondes à part dedans' },
    friend: { same: 'Connectés au plus profond', friend: 'Meilleurs partenaires', spark: 'Amusant avec des orages' },
    spark: { same: 'Opposés dehors, pareils dedans', friend: 'De plus en plus agréable', spark: 'Alchimie au maximum' },
  },
  it: {
    same: { same: 'Praticamente gemelli', friend: 'In perfetta sintonia', spark: 'Simili fuori, mondi diversi dentro' },
    friend: { same: 'Legati nel profondo', friend: 'Partner ideali', spark: 'Divertente con qualche tempesta' },
    spark: { same: 'Opposti fuori, uguali dentro', friend: 'Sempre più piacevole', spark: 'Chimica al massimo' },
  },
  pt: {
    same: { same: 'Praticamente gêmeos', friend: 'Em perfeita sintonia', spark: 'Iguais por fora, mundos à parte por dentro' },
    friend: { same: 'Ligados no fundo', friend: 'Melhores parceiros', spark: 'Divertido com tempestades ocasionais' },
    spark: { same: 'Opostos por fora, iguais por dentro', friend: 'Mais gostoso com o tempo', spark: 'Química no máximo' },
  },
  ko: {
    same: { same: '쌍둥이 같은 타입', friend: '척하면 척인 타입', spark: '닮은 듯 마음은 딴 세상 타입' },
    friend: { same: '깊은 곳에서 통하는 타입', friend: '베스트 파트너 타입', spark: '즐겁지만 가끔 폭풍 타입' },
    spark: { same: '겉은 정반대, 마음은 같은 타입', friend: '알수록 편해지는 타입', spark: '화학반응 MAX 타입' },
  },
}

/** 相性の要約(%・絵文字・呼び名)。太陽と月のエレメントだけから決まる */
export function pairSummary(
  lang: Lang,
  aSun: Element,
  aMoon: Element,
  bSun: Element,
  bMoon: Element,
): { percent: number; emoji: string; nickname: string } {
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

  return {
    percent,
    emoji: NICK_EMOJI[sunRel][moonRel],
    nickname: (NICK_NAME[lang] ?? NICK_NAME.ja)[sunRel][moonRel],
  }
}

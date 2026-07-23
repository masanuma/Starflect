import { elementOf, elementLabel } from './signs'
import type { Element } from './signs'
import { getLang } from './i18n'
import { STAR_TYPES, ELEMENT_WORD_L } from './starData'
import type { StarType } from './starData'
export type { StarType } from './starData'



export const elementWord = (el: Element): string => ELEMENT_WORD_L[getLang()][el] ?? ELEMENT_WORD_L.ja[el]

/** 「火の情熱」/「Fire · passion」形式のエレメント表現(現在言語) */
export const elementPhrase = (el: Element): string => {
  const lang = getLang()
  return lang === 'ja' ? `${elementLabel(el)}の${elementWord(el)}` : `${elementLabel(el)} · ${elementWord(el)}`
}



export interface StarTypeResult {
  type: StarType
  sunElement: Element
  moonElement: Element
}

/** エレメントの並び順(火→地→風→水) */
export const ELEMENT_ORDER: Element[] = ['火', '地', '風', '水']

/** 太陽と月の黄経から星タイプを判定(現在言語で) */
export function starTypeOf(sunLon: number, moonLon: number): StarTypeResult {
  const sunElement = elementOf(sunLon)
  const moonElement = elementOf(moonLon)
  const table = STAR_TYPES[getLang()] ?? STAR_TYPES.ja
  return { type: table[sunElement][moonElement], sunElement, moonElement }
}

/** 全16タイプを表示順(太陽エレメント × 月エレメント)で返す(現在言語で) */
export function allStarTypes(): StarTypeResult[] {
  const table = STAR_TYPES[getLang()] ?? STAR_TYPES.ja
  const out: StarTypeResult[] = []
  for (const sunElement of ELEMENT_ORDER) {
    for (const moonElement of ELEMENT_ORDER) {
      out.push({ type: table[sunElement][moonElement], sunElement, moonElement })
    }
  }
  return out
}

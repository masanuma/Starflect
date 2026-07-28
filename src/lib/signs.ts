import { signIndex } from './astro'
import { getLang } from './i18n'
import { ELEMENT_LABEL } from './starData'
import { SIGN_NAMES, SIGN_KEYWORDS, SIGN_ELEMENTS, SIGN_SYMBOLS } from './astroText'

// 表示用データは astro 非依存の astroText.ts に集約。既存の import 先を保つため再エクスポートする
export { SIGN_ELEMENTS, SIGN_SYMBOLS } from './astroText'

export type Element = '火' | '地' | '風' | '水'



/** エレメントの表示名(現在言語) */
export const elementLabel = (el: Element): string => (ELEMENT_LABEL[getLang()] ?? ELEMENT_LABEL.ja)[el]

/** 黄経からエレメントを得る(言語非依存) */
export const elementOf = (lon: number): Element => SIGN_ELEMENTS[signIndex(lon)]

/** 星座インデックスの名前(現在言語) */
export const signName = (i: number): string => SIGN_NAMES[getLang()][i] ?? SIGN_NAMES.ja[i]
export const signSymbol = (i: number): string => SIGN_SYMBOLS[i]
export const signKeywords = (i: number): string[] => SIGN_KEYWORDS[getLang()][i] ?? SIGN_KEYWORDS.ja[i]

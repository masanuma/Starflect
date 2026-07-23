import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

export type Lang = 'ja' | 'en' | 'es' | 'fr' | 'it' | 'pt' | 'ko'

export const LANGS: { code: Lang; label: string }[] = [
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
  { code: 'fr', label: 'FR' },
  { code: 'it', label: 'IT' },
  { code: 'pt', label: 'PT' },
  { code: 'ko', label: '한국어' },
]

/** AIに渡す言語名(応答言語の指定用) */
export const LANG_NAME: Record<Lang, string> = {
  ja: '日本語',
  en: 'English',
  es: 'Español (español)',
  fr: 'Français (French)',
  it: 'Italiano (Italian)',
  pt: 'Português (Portuguese)',
  ko: '한국어 (Korean)',
}

const STORAGE_KEY = 'starflect-lang'

/**
 * 現在の言語(モジュールレベル)。コンポーネント以外のデータ取得関数が参照する。
 * LangProvider がレンダー時に同期更新するので、子の描画時には正しい値になっている。
 */
let currentLang: Lang = 'ja'
export const getLang = (): Lang => currentLang

/**
 * 現在言語を明示的に切り替える。主にサーバーサイドの静的ページ生成で使う
 * (setLang(lang) してから ui()/allStarTypes()/elementLabel() 等を呼ぶと、その言語で返る)。
 * ブラウザでは LangProvider が同期更新するため通常は使わない。
 */
export const setLang = (l: Lang): void => {
  currentLang = l
}

const SUPPORTED: Lang[] = ['ja', 'en', 'es', 'fr', 'it', 'pt', 'ko']

function detectLang(): Lang {
  // 紹介LP( /en など )から /app?lang=xx で来たら、その言語を最優先(＋保存してsticky化)
  try {
    const q = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('lang') : null
    if (q && (SUPPORTED as string[]).includes(q)) {
      try {
        localStorage.setItem(STORAGE_KEY, q)
      } catch {
        /* 無視 */
      }
      return q as Lang
    }
  } catch {
    /* 無視 */
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && (SUPPORTED as string[]).includes(saved)) return saved as Lang
  } catch {
    /* 無視 */
  }
  const n = (typeof navigator !== 'undefined' ? navigator.language : 'ja').toLowerCase()
  const hit = SUPPORTED.find((l) => l !== 'ja' && n.startsWith(l))
  return hit ?? 'ja'
}

interface LangCtx {
  lang: Lang
  setLang: (l: Lang) => void
}

const LangContext = createContext<LangCtx>({ lang: 'ja', setLang: () => {} })

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => detectLang())

  // 子が描画される前に同期で反映(データ取得関数が getLang() で参照)
  currentLang = lang

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  function setLang(l: Lang) {
    setLangState(l)
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {
      /* 無視 */
    }
  }

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>
}

export function useLang(): LangCtx {
  return useContext(LangContext)
}

/** ロケール別データから現在言語の値を取り出す(未定義は日本語にフォールバック) */
export function pick<T>(rec: Record<Lang, T>, lang: Lang): T {
  return rec[lang] ?? rec.ja
}

import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

export type Lang = 'ja' | 'en' | 'es'

export const LANGS: { code: Lang; label: string }[] = [
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
]

/** AIに渡す言語名(応答言語の指定用) */
export const LANG_NAME: Record<Lang, string> = {
  ja: '日本語',
  en: 'English',
  es: 'Español (español)',
}

const STORAGE_KEY = 'starflect-lang'

/**
 * 現在の言語(モジュールレベル)。コンポーネント以外のデータ取得関数が参照する。
 * LangProvider がレンダー時に同期更新するので、子の描画時には正しい値になっている。
 */
let currentLang: Lang = 'ja'
export const getLang = (): Lang => currentLang

function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'ja' || saved === 'en' || saved === 'es') return saved
  } catch {
    /* 無視 */
  }
  const n = (typeof navigator !== 'undefined' ? navigator.language : 'ja').toLowerCase()
  if (n.startsWith('es')) return 'es'
  if (n.startsWith('en')) return 'en'
  return 'ja'
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

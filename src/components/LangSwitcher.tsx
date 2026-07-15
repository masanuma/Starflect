import { LANGS, useLang } from '../lib/i18n'
import { track } from '../lib/analytics'

/** 言語切替(ja / EN / ES のセグメント) */
export default function LangSwitcher() {
  const { lang, setLang } = useLang()
  return (
    <div className="lang-switch" role="group" aria-label="Language">
      {LANGS.map((l) => (
        <button
          key={l.code}
          className={`lang-btn${lang === l.code ? ' active' : ''}`}
          aria-pressed={lang === l.code}
          onClick={() => {
            setLang(l.code)
            track('lang_switch', { lang: l.code })
          }}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}

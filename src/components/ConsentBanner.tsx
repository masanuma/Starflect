import { useUI } from '../lib/ui'
import type { Consent } from '../lib/analytics'

/** アクセス解析の同意バナー(許可を押すまで GA は読み込まれない) */
export default function ConsentBanner({ onChoose }: { onChoose: (c: Consent) => void }) {
  const t = useUI()
  return (
    <div className="consent-banner" role="dialog" aria-live="polite" aria-label={t.consent.message}>
      <p className="consent-msg">{t.consent.message}</p>
      <div className="consent-actions">
        <button className="consent-deny" onClick={() => onChoose('denied')}>
          {t.consent.deny}
        </button>
        <button className="consent-allow" onClick={() => onChoose('granted')}>
          {t.consent.allow}
        </button>
      </div>
    </div>
  )
}

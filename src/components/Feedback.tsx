import { useState } from 'react'
import { useLang } from '../lib/i18n'
import { useUI } from '../lib/ui'
import { sendFeedback } from '../lib/feedback'
import type { FeedbackRating } from '../lib/feedback'
import { track } from '../lib/analytics'

/** 結果画面のフィードバック欄(評価＋任意コメント → スプレッドシート & GA4) */
export default function Feedback({ page, starType }: { page: string; starType?: string }) {
  const { lang } = useLang()
  const t = useUI()
  const [rating, setRating] = useState<FeedbackRating | null>(null)
  const [comment, setComment] = useState('')
  const [sent, setSent] = useState(false)

  const faces: { v: FeedbackRating; emoji: string; label: string }[] = [
    { v: 'bad', emoji: '😕', label: t.feedback.bad },
    { v: 'good', emoji: '😊', label: t.feedback.good },
    { v: 'great', emoji: '😍', label: t.feedback.great },
  ]

  function submit() {
    if (!rating) return
    void sendFeedback({ rating, comment: comment.trim() || undefined, lang, starType, page })
    track('feedback', { rating, page })
    setSent(true)
  }

  if (sent) {
    return (
      <section className="planet-card feedback-card">
        <p className="feedback-thanks">✦ {t.feedback.thanks}</p>
      </section>
    )
  }

  return (
    <section className="planet-card feedback-card">
      <header className="planet-head">
        <div>
          <p className="planet-title">{t.feedback.title}</p>
          <p className="planet-sub">{t.feedback.sub}</p>
        </div>
      </header>

      <div className="feedback-faces">
        {faces.map((f) => (
          <button
            key={f.v}
            type="button"
            className={`feedback-face${rating === f.v ? ' active' : ''}`}
            onClick={() => setRating(f.v)}
            aria-pressed={rating === f.v}
            aria-label={f.label}
          >
            <span className="feedback-face-emoji" aria-hidden="true">
              {f.emoji}
            </span>
            <span className="feedback-face-label">{f.label}</span>
          </button>
        ))}
      </div>

      <textarea
        className="feedback-comment"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t.feedback.placeholder}
        maxLength={2000}
        rows={2}
      />

      <button className="cta feedback-send" disabled={!rating} onClick={submit}>
        {t.feedback.send}
      </button>
    </section>
  )
}

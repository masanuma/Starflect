import { useEffect, useState } from 'react'
import HoshiKyaraMascot from './HoshiKyaraMascot'
import { loadInvite, clearInvite, parseSlug, charaNameOf, inviteTeaser } from '../lib/invite'
import { useUI, quoted } from '../lib/ui'
import { track } from '../lib/analytics'

/**
 * 招待の相性ティザー。招待リンク( ?i=<slug> )で来た人の診断結果と相棒ホームに出す。
 * 招待者のキャラ × 自分のキャラの「呼び名」だけ見せて、詳しい相性(ふたりの生年月日)へ誘う。
 * 招待が無い人には何も描画しない＝表に出す量を増やさない(憲法)。
 */
export default function InviteTeaser({ mySlug, onPair }: { mySlug?: string; onPair: () => void }) {
  const t = useUI()
  // マウント時に1度だけ読む。CTAで clearInvite しても表示中のカードは消えない(急に消えると事故に見える)
  const [inviter] = useState(() => loadInvite())
  const el = inviter ? parseSlug(inviter) : null
  const name = inviter ? charaNameOf(inviter) : null
  const teaser = inviter && mySlug ? inviteTeaser(mySlug, inviter) : null
  const show = Boolean(el && name && teaser)

  useEffect(() => {
    if (show) track('invite_teaser', { star_type: inviter })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!el || !name || !teaser) return null
  return (
    <section className="invite-card">
      <p className="invite-heading">✉ {t.invite.heading}</p>
      <div className="invite-body">
        <div className="invite-mascot" aria-hidden="true">
          <HoshiKyaraMascot sunElement={el.sun} moonElement={el.moon} size={72} />
        </div>
        <div>
          <p className="invite-line">{t.invite.senderIs(quoted(name))}</p>
          <p className="invite-nick">
            <span aria-hidden="true">{teaser.emoji}</span> {t.invite.youTwo(teaser.nickname)}
          </p>
        </div>
      </div>
      <p className="invite-note">{t.invite.note}</p>
      <button
        className="cta invite-cta"
        onClick={() => {
          track('invite_pair_click', { star_type: inviter })
          clearInvite()
          onPair()
        }}
      >
        {t.invite.cta}
      </button>
    </section>
  )
}

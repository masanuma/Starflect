import { useState } from 'react'
import { useUI } from '../lib/ui'
import { xShareUrl, lineShareUrl, nativeShare, canNativeShare, copyLink } from '../lib/share'
import type { ShareParts } from '../lib/share'
import { track } from '../lib/analytics'

interface Props {
  /** 括弧つきのほしキャラ名(共有文に埋め込む) */
  starTypeName: string
  /** キャラのスラッグ(解析＋将来のキャラ別OGP用に ?c= で付与) */
  starSlug?: string
}

/**
 * 結果のSNSシェア(拡大の起爆剤)。ネイティブ共有 / X / LINE / リンクコピー。
 * 共有URLは自分のオリジン＝受け取った人が「自分のほしキャラは?」と診断に入る動線になる。
 */
export default function ShareButtons({ starTypeName, starSlug }: Props) {
  const t = useUI()
  const [copied, setCopied] = useState(false)

  // 共有の着地先はキャラ別ページ(読み物→診断CTA)。slug 不明時はトップLP
  const base = starSlug ? `${location.origin}/c/${encodeURIComponent(starSlug)}` : `${location.origin}/`
  /**
   * 共有先ごとに utm_source を付ける。着地先は静的ページでGA4が動かないため、
   * サーバー側の集計(server/stats.ts)がこの値を見て「どこから来たか」を数える。
   * これが無いと、シェア経由の訪問と検索・直打ちが区別できない。
   */
  const shareUrl = (via: string) => `${base}?utm_source=${via}`
  const partsFor = (via: string): ShareParts => ({
    text: t.share.text(starTypeName),
    url: shareUrl(via),
    hashtags: t.share.hashtags,
  })
  const parts = partsFor('x') /* リンクのhrefは描画時に決まるのでX用を既定にする */

  async function onNative() {
    if (await nativeShare(partsFor('native'))) track('share', { target: 'native', star_type: starSlug })
  }
  async function onCopy() {
    if (await copyLink(shareUrl('copy'))) {
      setCopied(true)
      track('share', { target: 'copy', star_type: starSlug })
      window.setTimeout(() => setCopied(false), 1800)
    }
  }

  return (
    <section className="share-card">
      <p className="share-heading">{t.share.heading}</p>
      <div className="share-row">
        {canNativeShare() && (
          <button className="share-btn share-native" onClick={onNative}>
            <span aria-hidden="true">📤</span> {t.share.native}
          </button>
        )}
        <a
          className="share-btn share-x"
          href={xShareUrl(parts)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('share', { target: 'x', star_type: starSlug })}
        >
          <span aria-hidden="true">𝕏</span> Post
        </a>
        <a
          className="share-btn share-line"
          href={lineShareUrl(partsFor('line'))}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('share', { target: 'line', star_type: starSlug })}
        >
          <span aria-hidden="true">💬</span> LINE
        </a>
        <button className="share-btn share-copy" onClick={onCopy}>
          <span aria-hidden="true">🔗</span> {copied ? t.share.copied : t.share.copy}
        </button>
      </div>
    </section>
  )
}

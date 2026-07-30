import { useState } from 'react'
import { useUI } from '../lib/ui'
import { xShareUrl, lineShareUrl, nativeShare, canNativeShare, copyLink } from '../lib/share'
import type { ShareParts } from '../lib/share'
import { track } from '../lib/analytics'

interface Props {
  /** 見出し(「結果を友だちにもシェア」など) */
  heading: string
  /** 共有本文 */
  text: string
  /** 着地先のパス(先頭スラッシュ込み)。受け取った人が診断に入る動線になる */
  path: string
  /** 解析用のラベル(診断結果=キャラのスラッグ、相性=`pair`) */
  label?: string
  /** GA4 のイベント名を分けたいとき(既定は share) */
  event?: string
}

/**
 * 結果のSNSシェア(拡大の起爆剤)。ネイティブ共有 / X / LINE / リンクコピー。
 * 診断結果と相性結果の両方で使う。違いは「見出し・本文・着地先」の3つだけなので props で受ける。
 */
export default function ShareButtons({ heading, text, path, label, event = 'share' }: Props) {
  const t = useUI()
  const [copied, setCopied] = useState(false)

  /**
   * 共有先ごとに utm_source を付ける。着地先は静的ページでGA4が動かないため、
   * サーバー側の集計(server/stats.ts)がこの値を見て「どこから来たか」を数える。
   * これが無いと、シェア経由の訪問と検索・直打ちが区別できない。
   */
  const shareUrl = (via: string) => `${location.origin}${path}?utm_source=${via}`
  const partsFor = (via: string): ShareParts => ({ text, url: shareUrl(via), hashtags: t.share.hashtags })

  async function onNative() {
    if (await nativeShare(partsFor('native'))) track(event, { target: 'native', star_type: label })
  }
  async function onCopy() {
    if (await copyLink(shareUrl('copy'))) {
      setCopied(true)
      track(event, { target: 'copy', star_type: label })
      window.setTimeout(() => setCopied(false), 1800)
    }
  }

  return (
    <section className="share-card">
      <p className="share-heading">{heading}</p>
      <div className="share-row">
        {canNativeShare() && (
          <button className="share-btn share-native" onClick={onNative}>
            <span aria-hidden="true">📤</span> {t.share.native}
          </button>
        )}
        <a
          className="share-btn share-x"
          href={xShareUrl(partsFor('x'))}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track(event, { target: 'x', star_type: label })}
        >
          <span aria-hidden="true">𝕏</span> Post
        </a>
        <a
          className="share-btn share-line"
          href={lineShareUrl(partsFor('line'))}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track(event, { target: 'line', star_type: label })}
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

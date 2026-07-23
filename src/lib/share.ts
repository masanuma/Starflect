/**
 * 結果のSNSシェア(拡大導線)。まずは定型文＋リンク共有(Phase 1)。
 * キャラ別OGP画像(Phase 2)は、共有URLの ?c=<slug> をサーバーが読んで og:image を出し分ける形で後付けする。
 */

export interface ShareParts {
  /** キャラ名を含む共有本文(ネイティブ共有・X用。LINEはURLのOGPに任せる) */
  text: string
  /** 共有するURL(自分のオリジン。診断への入口＝受け取った人が自分のキャラを知る動線) */
  url: string
  /** ハッシュタグ(#なし) */
  hashtags: string[]
}

/** X(Twitter)のツイート意図URL */
export function xShareUrl(p: ShareParts): string {
  const q = new URLSearchParams({ text: p.text, url: p.url })
  if (p.hashtags.length) q.set('hashtags', p.hashtags.join(','))
  return `https://twitter.com/intent/tweet?${q.toString()}`
}

/** LINE共有URL(LINEはURLのみ＝そのURLのOGPが展開される。Phase 2の画像がここで効く) */
export function lineShareUrl(p: ShareParts): string {
  return `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(p.url)}`
}

/** 端末ネイティブの共有シート(主にモバイル)。成功したら true。未対応/キャンセルは false */
export async function nativeShare(p: ShareParts): Promise<boolean> {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ text: p.text, url: p.url })
      return true
    } catch {
      // ユーザーキャンセル等
      return false
    }
  }
  return false
}

/** ネイティブ共有が使えるか(ボタン出し分け用) */
export function canNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function'
}

/** リンクをクリップボードにコピー。成功で true */
export async function copyLink(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url)
    return true
  } catch {
    return false
  }
}

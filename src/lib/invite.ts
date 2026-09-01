/**
 * 相性の招待ループ(新機能案B3)。
 *
 * シェアされたキャラページ( /c/<slug>?utm_source=... )のCTAから /app?i=<slug> で届く
 * 「誰に誘われたか」を預かり、診断後に **招待者のキャラ × 自分のキャラ** の相性ティザーを見せる。
 * 誘った人・誘われた人の双方に「ふたりで見る理由」が生まれる＝1人用の診断が2人の体験になる。
 *
 * **URLに載るのはキャラのスラッグだけ**(例 earth_fire)。LPの約束
 * 「入力した生年月日そのものを送信することはありません」を守るため、生年月日は絶対に載せない。
 * スラッグは16通り＝本人特定に使えない粒度。
 */
import type { Element } from './signs'
import { STAR_TYPES } from './starData'
import { getLang } from './i18n'
import { pairSummary } from './compatCore'

const SLUG_EL: Record<string, Element> = { fire: '火', earth: '地', air: '風', water: '水' }

/** 'earth_fire' → {sun:'地', moon:'火'}。不正なスラッグは null */
export function parseSlug(slug: string): { sun: Element; moon: Element } | null {
  const [s, m] = slug.split('_')
  const sun = SLUG_EL[s]
  const moon = SLUG_EL[m]
  return sun && moon ? { sun, moon } : null
}

/** スラッグからキャラ名(現在言語)。不正なら null */
export function charaNameOf(slug: string): string | null {
  const el = parseSlug(slug)
  if (!el) return null
  const table = STAR_TYPES[getLang()] ?? STAR_TYPES.ja
  return table[el.sun][el.moon].name
}

const KEY = 'starflect-invite:v1'
/** 招待の賞味期限。届いてすぐ診断しない人も居るが、1か月前の招待に「送ってくれた人」は変 */
const TTL_MS = 14 * 24 * 60 * 60 * 1000

/** 招待スラッグを預かる。有効なスラッグだけ受け付け、受理したら true */
export function saveInvite(slug: string): boolean {
  if (!parseSlug(slug)) return false
  try {
    localStorage.setItem(KEY, JSON.stringify({ slug, at: Date.now() }))
    return true
  } catch {
    return false
  }
}

/** 預かり中の招待スラッグ。期限切れ・不正は null(掃除もする) */
export function loadInvite(): string | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const { slug, at } = JSON.parse(raw) as { slug?: string; at?: number }
    if (!slug || !parseSlug(slug) || !at || Date.now() - at > TTL_MS) {
      localStorage.removeItem(KEY)
      return null
    }
    return slug
  } catch {
    return null
  }
}

export function clearInvite(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* 消せなくても実害なし(期限で消える) */
  }
}

/** 招待者×自分の相性ティザー(compatCoreで再計算)。スラッグが不正なら null */
export function inviteTeaser(mySlug: string, inviterSlug: string): { emoji: string; nickname: string } | null {
  const me = parseSlug(mySlug)
  const inv = parseSlug(inviterSlug)
  if (!me || !inv) return null
  const s = pairSummary(getLang(), inv.sun, inv.moon, me.sun, me.moon)
  // %は出さない。数字まで見せると「ちゃんと占う」理由が消える。呼び名だけがちょうどいい入口
  return { emoji: s.emoji, nickname: s.nickname }
}

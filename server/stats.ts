/**
 * 着地の集計（Cookieなし・個人情報なし）。
 *
 * GA4 はSPA(/app)の中でしか動かないため、**シェアの着地先(/c/<slug>)も検索の入口(LP)も
 * まったく計測できていなかった**。ここはサーバーが全リクエストを受けているので、
 * Cookieも同意バナーも使わずに「どこに、どこから、何人来たか」だけを数える。
 *
 * 記録するのは次の3つだけで、個人を識別できるものは持たない。
 *   - 日付（YYYY-MM-DD）
 *   - 丸めたパス（スラッグや言語はまとめる）
 *   - 流入元（utm_source ＞ 参照元のホスト名 ＞ direct）
 * IPもUAも保存しない。ホスト名より細かいURLも捨てる（参照元URLにはクエリが入りうるため）。
 */

/** 集計の1行 */
export interface StatRow {
  date: string
  path: string
  source: string
  count: number
}

/** key = `${date}|${path}|${source}` */
const counts = new Map<string, number>()
/** プロセス起動時刻。数字を読むとき「いつからの集計か」が要るので持っておく */
const since = new Date().toISOString()

/** 明らかなクローラーは数えない（数字が膨らんで流入判断を誤るため） */
const BOT = /bot|crawler|spider|crawling|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|pinterest|vkshare|w3c_validator|headlesschrome|lighthouse|preview|fetch|monitor|uptime|curl|wget|python-requests|axios|go-http-client/i

export const isBot = (ua: string | undefined): boolean => !!ua && BOT.test(ua)

/**
 * パスを集計しやすい形に丸める。
 * 個々のキャラや言語ごとの数字はGSCで見られるので、ここでは「面」の単位でよい。
 */
export function normalizePath(pathname: string): string {
  const seg = pathname.replace(/\/+$/, '').split('/').filter(Boolean)
  if (seg.length === 0) return '/'
  // 先頭が言語コードなら落とす（/en/c/xxx → /c/xxx）
  const LANGS = ['en', 'es', 'fr', 'it', 'pt', 'ko']
  const s = LANGS.includes(seg[0]) ? seg.slice(1) : seg
  if (s.length === 0) return '/' /* /en など言語トップ */
  if (s[0] === 'c') return '/c/*'
  if (s[0] === 'stars') return '/stars'
  if (s[0] === 'app') return '/app'
  return '/other'
}

/** 流入元を「ホスト名まで」に丸める。utm_source があればそちらを優先 */
export function normalizeSource(referer: string | undefined, utmSource: string | undefined, selfHost: string): string {
  if (utmSource) return utmSource.slice(0, 40).toLowerCase()
  if (!referer) return 'direct'
  try {
    const h = new URL(referer).hostname.replace(/^www\./, '')
    if (h === selfHost.replace(/^www\./, '')) return 'internal'
    return h.slice(0, 60)
  } catch {
    return 'unknown'
  }
}

/** 1件数える */
export function record(path: string, source: string, now = new Date()): void {
  const date = now.toISOString().slice(0, 10)
  const key = `${date}|${path}|${source}`
  counts.set(key, (counts.get(key) ?? 0) + 1)
}

/** 現在の集計を新しい日付順で返す */
export function snapshot(): { since: string; rows: StatRow[] } {
  const rows: StatRow[] = []
  for (const [key, count] of counts) {
    const [date, path, source] = key.split('|')
    rows.push({ date, path, source, count })
  }
  rows.sort((a, b) => (a.date === b.date ? b.count - a.count : a.date < b.date ? 1 : -1))
  return { since, rows }
}

/**
 * 標準出力へ1行で吐く。メモリ上の集計はデプロイで消えるが、
 * Railway のログには残るので履歴はこちらで追える。
 */
export function flushToLog(): void {
  const { rows } = snapshot()
  if (rows.length === 0) return
  console.log(`[stats] ${JSON.stringify(rows)}`)
}

import { fileURLToPath } from 'node:url'
import { readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import express from 'express'
import { createAiHandlers, createFeedbackHandler } from './handlers'
import { renderLP, renderCharPage, renderStarsPage, renderPairPage, elementsOfSlug, CONTENT_LANGS } from './pages'
import { CHAR_BY_SLUG } from './characters'
import * as stats from './stats'
import type { Lang } from '../src/lib/i18n'

// 本番サーバー: 静的な紹介LP( / , /<lang> ) とキャラ別ページ( /c/<slug> , /<lang>/c/<slug> )を7言語で配信し、
// アプリ本体(SPA)は /app、AI鑑定APIは /api を同一オリジンで提供する。

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '../dist')

/**
 * ローカル用に .env を読む。Vite は自前で .env を読むが、このサーバーは読まないため
 * `npm start` だと AI が「APIキーが未設定」になっていた。
 * すでに設定済みの環境変数は上書きしないので、本番(Railway の Variables)には影響しない。
 * .env が無ければ何もしない。Node 18 でも動くよう依存を足さず自前で解析する。
 */
try {
  for (const line of readFileSync(path.resolve(__dirname, '../.env'), 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/)
    if (!m || line.trimStart().startsWith('#')) continue
    const key = m[1]
    if (process.env[key] !== undefined) continue
    process.env[key] = m[2].trim().replace(/^["']|["']$/g, '')
  }
} catch {
  /* .env が無い(本番など)ときは何もしない */
}
const ORIGIN = 'https://starflect.asanuma.works'
const SLUGS = Object.keys(CHAR_BY_SLUG)
const NONJA = CONTENT_LANGS.filter((l) => l !== 'ja')
const isLang = (v: string): v is Lang => (CONTENT_LANGS as string[]).includes(v)

// アプリ本体(SPA)。検索の入口は LP と /c なので noindex にして重複を避ける。
/**
 * SPA本体のHTML。検索の重複を避けるため noindex ＋ canonical を /app に差し替える。
 *
 * 中身はキャッシュするが、dist/index.html の更新時刻が変わったら読み直す。
 * 本番はビルド→起動が順次なので実質起動時の1回だけ。ローカルは「サーバーを起動したまま
 * 再ビルド」ができてしまい、固定キャッシュだと消えたバンドルを指してアプリが起動しなくなる。
 * (環境変数に依存しないので、どちらの環境でも正しく動く)
 */
const appHtmlPath = path.join(distDir, 'index.html')
let appHtmlCache = ''
let appHtmlMtime = -1

function appHtml(): string {
  try {
    const mtime = statSync(appHtmlPath).mtimeMs
    if (mtime !== appHtmlMtime) {
      appHtmlCache = readFileSync(appHtmlPath, 'utf8')
        .replace(
          '<meta name="robots" content="index, follow, max-image-preview:large" />',
          '<meta name="robots" content="noindex, follow" />',
        )
        .replace(
          '<link rel="canonical" href="https://starflect.asanuma.works/" />',
          '<link rel="canonical" href="https://starflect.asanuma.works/app" />',
        )
      appHtmlMtime = mtime
    }
    return appHtmlCache
  } catch {
    return '' /* 未ビルド時は空 */
  }
}

// 静的ページはデータ固定なので起動時に一度だけ全言語ぶん生成してキャッシュする。
const LP_HTML: Record<string, string> = {}
const STARS_HTML: Record<string, string> = {}
const PAIR_HTML: Record<string, string> = {}
const CHAR_HTML: Record<string, Record<string, string>> = {}
for (const lang of CONTENT_LANGS) {
  LP_HTML[lang] = renderLP(lang)
  STARS_HTML[lang] = renderStarsPage(lang)
  PAIR_HTML[lang] = renderPairPage(lang)
  CHAR_HTML[lang] = {}
  for (const slug of SLUGS) {
    const h = renderCharPage(lang, slug)
    if (h) CHAR_HTML[lang][slug] = h
  }
}

/**
 * サイトマップの lastmod。
 *
 * 静的ページはすべてコードから生成しているので「内容が変わる＝デプロイした」とみなせる。
 * そこでビルド成果物(dist/index.html)の更新時刻＝デプロイ時刻を最終更新日として使う。
 *
 * 固定文字列(2026-07-23)にしていたときは、`/stars` を7言語ぶん足してもLPを全面書き換えても
 * 日付が動かず、クローラーに「更新なし」と判断されて再クロールされなかった
 * (Bing の検出URLが 119 のまま止まっていた)。
 */
function lastModified(): string {
  try {
    return new Date(statSync(appHtmlPath).mtimeMs).toISOString().slice(0, 10)
  } catch {
    return new Date().toISOString().slice(0, 10) /* 未ビルド時は当日 */
  }
}

function sitemapXml(): string {
  const urls: string[] = []
  const lastmod = lastModified()
  const push = (loc: string, prio: string) =>
    urls.push(`  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod><priority>${prio}</priority></url>`)
  for (const lang of CONTENT_LANGS) {
    push(ORIGIN + (lang === 'ja' ? '/' : `/${lang}`), lang === 'ja' ? '1.0' : '0.9')
    push(ORIGIN + (lang === 'ja' ? '/stars' : `/${lang}/stars`), '0.6')
    push(ORIGIN + (lang === 'ja' ? '/pair' : `/${lang}/pair`), '0.7')
    for (const slug of SLUGS) {
      push(ORIGIN + (lang === 'ja' ? `/c/${slug}` : `/${lang}/c/${slug}`), '0.7')
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
}
const SITEMAP = sitemapXml()

const app = express()
const handlers = createAiHandlers(process.env.ANTHROPIC_API_KEY)
const feedback = createFeedbackHandler(process.env.FEEDBACK_SHEET_URL)

/**
 * 着地の集計。GA4 は /app の中でしか動かず、シェアの着地先も検索の入口も無計測だったため、
 * ここでページ表示だけを数える（Cookieなし・同意不要・個人情報なし。詳細は stats.ts）。
 * 静的アセットとAPIは対象外。ページのGETだけを見る。
 */
const STATS_KEY = process.env.STATS_KEY
app.use((req, _res, next) => {
  if (req.method !== 'GET') return next()
  const p = req.path
  if (p.startsWith('/api/') || p.startsWith('/assets/') || p.startsWith('/ogp/') || p.includes('.')) return next()
  if (stats.isBot(req.get('user-agent'))) return next()
  const utm = typeof req.query.utm_source === 'string' ? req.query.utm_source : undefined
  stats.record(stats.normalizePath(p), stats.normalizeSource(req.get('referer'), utm, req.hostname))
  next()
})

// 集計の閲覧。鍵(STATS_KEY)を設定していないときは存在しない扱いにする
app.get('/api/stats', (req, res) => {
  if (!STATS_KEY || req.query.key !== STATS_KEY) return res.status(404).send('Not found')
  return res.json(stats.snapshot())
})

app.post('/api/ai-pair-chat', handlers.pairChat)
app.post('/api/ai-chat', handlers.chat)
app.post('/api/ai-report', handlers.report)
app.post('/api/feedback', feedback)

// sitemap(全言語ぶんを動的生成)は静的配信より前に置く
app.get('/sitemap.xml', (_req, res) => {
  res.type('application/xml').send(SITEMAP)
})

// 静的アセット(assets / ogp / favicon / robots.txt)。index.html の自動配信は無効。
app.use(express.static(distDir, { index: false }))

const sendHtml = (res: express.Response, html: string) => res.type('html').send(html)

// 紹介LP(ja)。旧シェア形式 /?c=<slug> は OGP だけキャラ別に差し替える(既存カード救済)。
app.get('/', (req, res) => {
  let html = LP_HTML.ja
  const c = typeof req.query.c === 'string' ? req.query.c : ''
  const ch = CHAR_BY_SLUG[c]
  if (ch) {
    html = html
      .split(`${ORIGIN}/ogp/default.png`)
      .join(`${ORIGIN}/ogp/${c}.png`)
      .replace(
        /<meta property="og:title" content="[^"]*"\/>/,
        `<meta property="og:title" content="私のほしキャラは「${ch.name}」｜ほしキャラ診断"/>`,
      )
  }
  sendHtml(res, html)
})

// キャラ別ページ(ja)
app.get('/c/:slug', (req, res) => {
  const html = CHAR_HTML.ja[req.params.slug]
  if (html) sendHtml(res, html)
  else res.redirect(302, '/')
})

// アプリ本体(SPA)
app.get(['/app', '/app/'], (_req, res) => {
  const html = appHtml()
  if (html) sendHtml(res, html)
  else res.status(404).send('Not built')
})

// 10天体と12星座の説明ページ(ja)
app.get('/stars', (_req, res) => sendHtml(res, STARS_HTML.ja))

/**
 * 相性の紹介ページ＝相性シェアの着地先。
 * `?a=<slug>&b=<slug>` が付いていれば「そのふたりの結果」を出す。
 * LINEは本文を送れずURLだけなので、カードに%が出ないと肝心の中身が相手に伝わらない。
 * 不正なスラッグは無視して通常のページを返す(壊れたリンクでも着地はさせる)。
 */
const pairHtml = (lang: Lang, q: express.Request['query']): string => {
  const a = typeof q.a === 'string' ? q.a : ''
  const b = typeof q.b === 'string' ? q.b : ''
  if (a && b && elementsOfSlug(a) && elementsOfSlug(b)) return renderPairPage(lang, { a, b })
  return PAIR_HTML[lang]
}

// 相性の紹介ページ(ja)
app.get('/pair', (req, res) => sendHtml(res, pairHtml('ja', req.query)))

// 他言語の紹介LP( /<lang> )
app.get('/:lang', (req, res, next) => {
  const l = req.params.lang
  if (l === 'ja') return res.redirect(301, '/')
  if (isLang(l) && NONJA.includes(l)) return sendHtml(res, LP_HTML[l])
  return next()
})

// 他言語の説明ページ( /<lang>/stars )
app.get('/:lang/stars', (req, res) => {
  const l = req.params.lang
  if (l === 'ja') return res.redirect(301, '/stars')
  if (isLang(l) && STARS_HTML[l]) return sendHtml(res, STARS_HTML[l])
  return res.redirect(302, '/')
})

// 他言語の相性紹介ページ( /<lang>/pair )
app.get('/:lang/pair', (req, res) => {
  const l = req.params.lang
  if (l === 'ja') return res.redirect(301, '/pair')
  if (isLang(l) && PAIR_HTML[l]) return sendHtml(res, pairHtml(l, req.query))
  return res.redirect(302, '/')
})

// 他言語のキャラ別ページ( /<lang>/c/<slug> )
app.get('/:lang/c/:slug', (req, res) => {
  const l = req.params.lang
  if (l === 'ja') return res.redirect(301, `/c/${req.params.slug}`)
  if (isLang(l) && CHAR_HTML[l]?.[req.params.slug]) return sendHtml(res, CHAR_HTML[l][req.params.slug])
  return res.redirect(302, '/')
})

// その他の未知GETは紹介LPへ寄せる
app.use((req, res) => {
  if (req.method === 'GET') res.redirect(302, '/')
  else res.status(404).send('Not found')
})

// メモリ上の集計はデプロイで消えるので、定期的にログへ吐いて履歴を残す
setInterval(() => stats.flushToLog(), 30 * 60 * 1000).unref()
for (const sig of ['SIGTERM', 'SIGINT'] as const) {
  process.on(sig, () => {
    stats.flushToLog()
    process.exit(0)
  })
}

const port = Number(process.env.PORT) || 3000
app.listen(port, () => {
  console.log(`Starflect server listening on port ${port}`)
})

import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import express from 'express'
import { createAiHandlers, createFeedbackHandler } from './handlers'
import { renderLP, renderCharPage, CONTENT_LANGS } from './pages'
import { CHAR_BY_SLUG } from './characters'
import type { Lang } from '../src/lib/i18n'

// 本番サーバー: 静的な紹介LP( / , /<lang> ) とキャラ別ページ( /c/<slug> , /<lang>/c/<slug> )を7言語で配信し、
// アプリ本体(SPA)は /app、AI鑑定APIは /api を同一オリジンで提供する。

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '../dist')
const ORIGIN = 'https://starflect.asanuma.works'
const SLUGS = Object.keys(CHAR_BY_SLUG)
const NONJA = CONTENT_LANGS.filter((l) => l !== 'ja')
const isLang = (v: string): v is Lang => (CONTENT_LANGS as string[]).includes(v)

// アプリ本体(SPA)。検索の入口は LP と /c なので noindex にして重複を避ける。
let APP_HTML = ''
try {
  APP_HTML = readFileSync(path.join(distDir, 'index.html'), 'utf8')
    .replace(
      '<meta name="robots" content="index, follow, max-image-preview:large" />',
      '<meta name="robots" content="noindex, follow" />',
    )
    .replace(
      '<link rel="canonical" href="https://starflect.asanuma.works/" />',
      '<link rel="canonical" href="https://starflect.asanuma.works/app" />',
    )
} catch {
  /* 未ビルド時は空 */
}

// 静的ページはデータ固定なので起動時に一度だけ全言語ぶん生成してキャッシュする。
const LP_HTML: Record<string, string> = {}
const CHAR_HTML: Record<string, Record<string, string>> = {}
for (const lang of CONTENT_LANGS) {
  LP_HTML[lang] = renderLP(lang)
  CHAR_HTML[lang] = {}
  for (const slug of SLUGS) {
    const h = renderCharPage(lang, slug)
    if (h) CHAR_HTML[lang][slug] = h
  }
}

function sitemapXml(): string {
  const urls: string[] = []
  const push = (loc: string, prio: string) =>
    urls.push(`  <url><loc>${loc}</loc><lastmod>2026-07-23</lastmod><priority>${prio}</priority></url>`)
  for (const lang of CONTENT_LANGS) {
    push(ORIGIN + (lang === 'ja' ? '/' : `/${lang}`), lang === 'ja' ? '1.0' : '0.9')
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

app.post('/api/ai-pair', handlers.pair)
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
  if (APP_HTML) sendHtml(res, APP_HTML)
  else res.status(404).send('Not built')
})

// 他言語の紹介LP( /<lang> )
app.get('/:lang', (req, res, next) => {
  const l = req.params.lang
  if (l === 'ja') return res.redirect(301, '/')
  if (isLang(l) && NONJA.includes(l)) return sendHtml(res, LP_HTML[l])
  return next()
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

const port = Number(process.env.PORT) || 3000
app.listen(port, () => {
  console.log(`Starflect server listening on port ${port}`)
})

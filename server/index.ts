import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import express from 'express'
import { createAiHandlers, createFeedbackHandler } from './handlers'
import { renderLP, renderCharPage } from './pages'
import { CHAR_BY_SLUG } from './characters'

// 本番サーバー: 静的な紹介LP( / ) とキャラ別ページ( /c/<slug> ) を配信し、
// アプリ本体(SPA)は /app、AI鑑定APIは /api を同一オリジンで提供する。
// Railway では ANTHROPIC_API_KEY を Variables に、PORT は自動で注入される。

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '../dist')
const ORIGIN = 'https://starflect.asanuma.works'

// アプリ本体(SPA)。検索の入口は LP と /c なので、/app は noindex にして重複を避ける。
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

// 静的ページはデータ固定なので起動時に一度だけ生成してキャッシュする。
const LP_HTML = renderLP()
const CHAR_HTML: Record<string, string> = {}
for (const slug of Object.keys(CHAR_BY_SLUG)) {
  const h = renderCharPage(slug)
  if (h) CHAR_HTML[slug] = h
}

const app = express()
const handlers = createAiHandlers(process.env.ANTHROPIC_API_KEY)
const feedback = createFeedbackHandler(process.env.FEEDBACK_SHEET_URL)

// APIルート(静的配信より前に登録する)
app.post('/api/ai-pair', handlers.pair)
app.post('/api/ai-chat', handlers.chat)
app.post('/api/ai-report', handlers.report)
app.post('/api/feedback', feedback)

// 静的アセット(assets / ogp / favicon / sitemap.xml / robots.txt)。index.html の自動配信は無効。
app.use(express.static(distDir, { index: false }))

// 紹介LP( / )。旧シェア形式 /?c=<slug> は OGP だけキャラ別に差し替える(既存カード救済)。
app.get('/', (req, res) => {
  let html = LP_HTML
  const c = typeof req.query.c === 'string' ? req.query.c : ''
  const ch = CHAR_BY_SLUG[c]
  if (ch) {
    html = html
      .split(`${ORIGIN}/ogp/default.png`)
      .join(`${ORIGIN}/ogp/${c}.png`)
      .replace(
        '<meta property="og:title" content="ほしキャラ診断 〜Starflect〜"/>',
        `<meta property="og:title" content="私のほしキャラは「${ch.name}」｜ほしキャラ診断"/>`,
      )
      .replace(
        '<meta name="twitter:title" content="ほしキャラ診断 〜Starflect〜"/>',
        `<meta name="twitter:title" content="私のほしキャラは「${ch.name}」｜ほしキャラ診断"/>`,
      )
  }
  res.type('html').send(html)
})

// キャラ別ページ( /c/<slug> )。無効な slug はLPへ。
app.get('/c/:slug', (req, res) => {
  const html = CHAR_HTML[req.params.slug]
  if (html) res.type('html').send(html)
  else res.redirect(302, '/')
})

// アプリ本体(SPA)
app.get(['/app', '/app/'], (_req, res) => {
  if (APP_HTML) res.type('html').send(APP_HTML)
  else res.status(404).send('Not built')
})

// その他の未知GETは紹介LPへ寄せる(ハード404を出さない)
app.use((req, res) => {
  if (req.method === 'GET') res.redirect(302, '/')
  else res.status(404).send('Not found')
})

const port = Number(process.env.PORT) || 3000
app.listen(port, () => {
  console.log(`Starflect server listening on port ${port}`)
})

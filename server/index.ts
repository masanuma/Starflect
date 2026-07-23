import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import express from 'express'
import { createAiHandlers, createFeedbackHandler } from './handlers'

// 本番サーバー: ビルド済みフロント(dist/)の配信 + AI鑑定APIを同一オリジンで提供する。
// Railway では ANTHROPIC_API_KEY を Variables に、PORT は自動で注入される。

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '../dist')

const ORIGIN = 'https://starflect.asanuma.works'
const DEFAULT_OG = `${ORIGIN}/ogp/default.png`

// 16キャラ(slug → 名前)。共有URLの ?c=<slug> で og:image と og:title をキャラ別に差し替える。
// slug = <太陽エレメント>_<月エレメント>。画像は public/ogp/<slug>.png(scripts/gen-ogp.tsx で生成)。
const CHAR_NAME: Record<string, string> = {
  fire_fire: '疾走する彗星', fire_earth: '大地に立つ炎', fire_air: '舞い上がる花火', fire_water: '内に海を抱く炎',
  earth_fire: '静かな火山', earth_earth: '揺るがない山', earth_air: '風を聴く大樹', earth_water: '泉を隠す森',
  air_fire: '熱を運ぶ風', air_earth: '羅針盤を持つ旅人', air_air: '自由な渡り鳥', air_water: '月夜のそよ風',
  water_fire: '海底の火山', water_earth: '静かな入り江', water_air: '風をうつす水面', water_water: '深海の月',
}

// dist/index.html を起動時に読み込む(本番のみ。無ければ後述のフォールバックで都度読む)
let INDEX_HTML = ''
try {
  INDEX_HTML = readFileSync(path.join(distDir, 'index.html'), 'utf8')
} catch {
  /* 未ビルド時は空。sendIndex 側で都度読み込みを試みる */
}

/** SPA本体を返す。?c=<slug> が有効ならキャラ別のOGP画像・タイトルに差し替える */
function sendIndex(req: express.Request, res: express.Response): void {
  let html = INDEX_HTML
  if (!html) {
    try {
      html = readFileSync(path.join(distDir, 'index.html'), 'utf8')
    } catch {
      res.status(404).send('Not built')
      return
    }
  }
  const c = typeof req.query.c === 'string' ? req.query.c : ''
  const name = CHAR_NAME[c]
  if (name) {
    const img = `${ORIGIN}/ogp/${c}.png`
    const title = `私のほしキャラは「${name}」｜ほしキャラ診断`
    html = html
      .split(DEFAULT_OG).join(img)
      .replace('<meta property="og:title" content="ほしキャラ診断 〜Starflect〜" />', `<meta property="og:title" content="${title}" />`)
      .replace('<meta name="twitter:title" content="ほしキャラ診断 〜Starflect〜" />', `<meta name="twitter:title" content="${title}" />`)
  }
  res.type('html').send(html)
}

const app = express()
const handlers = createAiHandlers(process.env.ANTHROPIC_API_KEY)
const feedback = createFeedbackHandler(process.env.FEEDBACK_SHEET_URL)

// APIルート(静的配信より前に登録する)
app.post('/api/ai-pair', handlers.pair)
app.post('/api/ai-chat', handlers.chat)
app.post('/api/ai-report', handlers.report)
app.post('/api/feedback', feedback)

// ビルド済みの静的ファイル(index.html の自動配信は無効化し、下の sendIndex で ?c= を反映する)
app.use(express.static(distDir, { index: false }))

// SPAフォールバック: 未解決のGETは index.html を返す(?c=<slug> でOGPをキャラ別に差し替え)
app.use(sendIndex)

const port = Number(process.env.PORT) || 3000
app.listen(port, () => {
  console.log(`Starflect server listening on port ${port}`)
})

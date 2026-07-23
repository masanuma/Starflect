import { fileURLToPath } from 'node:url'
import path from 'node:path'
import express from 'express'
import { createAiHandlers, createFeedbackHandler } from './handlers'

// 本番サーバー: ビルド済みフロント(dist/)の配信 + AI鑑定APIを同一オリジンで提供する。
// Railway では ANTHROPIC_API_KEY を Variables に、PORT は自動で注入される。

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '../dist')

const app = express()
const handlers = createAiHandlers(process.env.ANTHROPIC_API_KEY)
const feedback = createFeedbackHandler(process.env.FEEDBACK_SHEET_URL)

// APIルート(静的配信より前に登録する)
app.post('/api/ai-pair', handlers.pair)
app.post('/api/ai-chat', handlers.chat)
app.post('/api/ai-report', handlers.report)
app.post('/api/feedback', feedback)

// ビルド済みの静的ファイル
app.use(express.static(distDir))

// SPAフォールバック: 上記で解決しなかったGETはindex.htmlを返す
app.use((_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'))
})

const port = Number(process.env.PORT) || 3000
app.listen(port, () => {
  console.log(`Starflect server listening on port ${port}`)
})

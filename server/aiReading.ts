import type { Plugin } from 'vite'
import { createAiHandlers, createFeedbackHandler } from './handlers'

/**
 * 開発サーバー用のViteプラグイン。
 * 本番(Railway)では server/index.ts の Express が同じハンドラを使う。
 */
export function aiReadingPlugin(apiKey: string | undefined, feedbackUrl?: string): Plugin {
  const handlers = createAiHandlers(apiKey)
  const feedback = createFeedbackHandler(feedbackUrl)
  return {
    name: 'starflect-ai-reading',
    configureServer(server) {
      server.middlewares.use('/api/ai-pair', handlers.pair)
      server.middlewares.use('/api/ai-chat', handlers.chat)
      server.middlewares.use('/api/ai-report', handlers.report)
      server.middlewares.use('/api/feedback', feedback)
    },
  }
}

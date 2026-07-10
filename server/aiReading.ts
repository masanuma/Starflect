import type { Plugin } from 'vite'
import { createAiHandlers } from './handlers'

/**
 * 開発サーバー用のViteプラグイン。
 * 本番(Railway)では server/index.ts の Express が同じ createAiHandlers を使う。
 */
export function aiReadingPlugin(apiKey: string | undefined): Plugin {
  const handlers = createAiHandlers(apiKey)
  return {
    name: 'starflect-ai-reading',
    configureServer(server) {
      server.middlewares.use('/api/ai-reading', handlers.reading)
      server.middlewares.use('/api/ai-pair', handlers.pair)
    },
  }
}

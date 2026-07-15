import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { aiReadingPlugin } from './server/aiReading'

export default defineConfig(({ mode }) => {
  // .env の ANTHROPIC_API_KEY はサーバー側だけで使う(クライアントには渡さない)
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), aiReadingPlugin(env.ANTHROPIC_API_KEY, env.FEEDBACK_SHEET_URL)],
  }
})

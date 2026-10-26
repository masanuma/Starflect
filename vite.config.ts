import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { aiReadingPlugin } from './server/aiReading'

export default defineConfig(({ mode }) => {
  // .env の ANTHROPIC_API_KEY はサーバー側だけで使う(クライアントには渡さない)
  const env = loadEnv(mode, process.cwd(), '')
  return {
    // Preserve the previous browser target while updating the development toolchain.
    build: { target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'] },
    plugins: [react(), aiReadingPlugin(env.ANTHROPIC_API_KEY, env.FEEDBACK_SHEET_URL)],
  }
})

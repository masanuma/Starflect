import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 環境変数を読み込み
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    define: {
      // Railway環境変数をビルド時に埋め込み
      'import.meta.env.OPENAI_API_KEY': JSON.stringify(env.OPENAI_API_KEY)
    },
    server: {
      host: true,
      port: 3500,
      proxy: {
        '/api/openai-proxy': {
          target: 'https://api.openai.com',
          changeOrigin: true,
          rewrite: (path) => '/v1/chat/completions',
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // APIキーを安全にヘッダーに追加
              const apiKey = env.OPENAI_API_KEY;
              if (apiKey) {
                proxyReq.setHeader('Authorization', `Bearer ${apiKey}`);
              }
              proxyReq.setHeader('Content-Type', 'application/json');
              console.log('🔐 プロキシリクエスト:', {
                url: req.url,
                hasApiKey: !!apiKey,
                keyPrefix: apiKey ? apiKey.substring(0, 7) + '...' : 'なし'
              });
            });
          }
        }
      }
    },
    preview: {
      host: '0.0.0.0',
      port: env.PORT ? parseInt(env.PORT) : 3000,
      strictPort: true
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      commonjsOptions: {
        include: [/node_modules/]
      },
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom']
          }
        }
      }
    }
  }
})
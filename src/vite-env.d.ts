/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly OPENAI_API_KEY: string  // サーバーサイド環境変数（VITEプレフィックスなし）
  readonly GEMINI_API_KEY: string  // Gemini APIキー
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 
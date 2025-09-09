/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly OPENAI_API_KEY: string  // サーバーサイド環境変数（VITEプレフィックスなし）
  // 他の環境変数もここに追加
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 